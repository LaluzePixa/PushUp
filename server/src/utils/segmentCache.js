/**
 * Segment Cache Utility
 * 
 * Provides in-memory caching for segment evaluation results to improve
 * campaign performance and reduce database load.
 * 
 * Features:
 * - LRU (Least Recently Used) eviction policy
 * - TTL (Time To Live) support for cache entries
 * - Automatic materialized count updates
 * - Memory-efficient storage
 */

import logger from '../config/logger.js';

/**
 * Cache configuration
 */
const CACHE_CONFIG = {
    // Maximum number of segments to cache
    MAX_SIZE: 1000,

    // Default TTL in milliseconds (5 minutes)
    DEFAULT_TTL: 5 * 60 * 1000,

    // Minimum interval between materializations (1 minute)
    MIN_MATERIALIZATION_INTERVAL: 60 * 1000
};

/**
 * Cache entry structure
 */
class CacheEntry {
    constructor(segmentId, subscriptionIds, ttl = CACHE_CONFIG.DEFAULT_TTL) {
        this.segmentId = segmentId;
        this.subscriptionIds = subscriptionIds;
        this.count = subscriptionIds.length;
        this.createdAt = Date.now();
        this.expiresAt = Date.now() + ttl;
        this.accessCount = 0;
        this.lastAccessedAt = Date.now();
    }

    /**
     * Check if entry is expired
     */
    isExpired() {
        return Date.now() > this.expiresAt;
    }

    /**
     * Mark entry as accessed (for LRU)
     */
    markAccessed() {
        this.accessCount++;
        this.lastAccessedAt = Date.now();
    }
}

/**
 * Segment Cache Manager
 */
class SegmentCache {
    constructor() {
        // Map: segmentId -> CacheEntry
        this.cache = new Map();

        // Map: segmentId -> Promise (for preventing duplicate materializations)
        this.pendingMaterializations = new Map();

        // Stats
        this.stats = {
            hits: 0,
            misses: 0,
            evictions: 0,
            materializations: 0
        };

        // Start cleanup interval (every 2 minutes)
        this.startCleanupInterval();
    }

    /**
     * Get cached segment subscription IDs
     * 
     * @param {number} segmentId - Segment ID
     * @returns {number[]|null} - Array of subscription IDs or null if not cached
     */
    get(segmentId) {
        const entry = this.cache.get(segmentId);

        if (!entry) {
            this.stats.misses++;
            return null;
        }

        if (entry.isExpired()) {
            this.cache.delete(segmentId);
            this.stats.misses++;
            return null;
        }

        entry.markAccessed();
        this.stats.hits++;
        return entry.subscriptionIds;
    }

    /**
     * Set cached segment subscription IDs
     * 
     * @param {number} segmentId - Segment ID
     * @param {number[]} subscriptionIds - Array of subscription IDs
     * @param {number} ttl - Time to live in milliseconds
     */
    set(segmentId, subscriptionIds, ttl = CACHE_CONFIG.DEFAULT_TTL) {
        // Check cache size and evict if necessary
        if (this.cache.size >= CACHE_CONFIG.MAX_SIZE) {
            this.evictLRU();
        }

        const entry = new CacheEntry(segmentId, subscriptionIds, ttl);
        this.cache.set(segmentId, entry);

        logger.debug(`Segment ${segmentId} cached with ${subscriptionIds.length} subscriptions`);
    }

    /**
     * Invalidate (remove) cached segment
     * 
     * @param {number} segmentId - Segment ID to invalidate
     */
    invalidate(segmentId) {
        const deleted = this.cache.delete(segmentId);
        if (deleted) {
            logger.debug(`Segment ${segmentId} cache invalidated`);
        }
        return deleted;
    }

    /**
     * Clear all cache
     */
    clear() {
        this.cache.clear();
        logger.info('Segment cache cleared');
    }

    /**
     * Evict least recently used entry
     */
    evictLRU() {
        let oldestEntry = null;
        let oldestSegmentId = null;

        for (const [segmentId, entry] of this.cache.entries()) {
            if (!oldestEntry || entry.lastAccessedAt < oldestEntry.lastAccessedAt) {
                oldestEntry = entry;
                oldestSegmentId = segmentId;
            }
        }

        if (oldestSegmentId) {
            this.cache.delete(oldestSegmentId);
            this.stats.evictions++;
            logger.debug(`Evicted segment ${oldestSegmentId} from cache (LRU)`);
        }
    }

    /**
     * Materialize segment (evaluate conditions and update database)
     * 
     * @param {number} segmentId - Segment ID
     * @param {object} pool - Database pool
     * @param {function} evaluateSegmentConditions - Condition evaluation function
     * @returns {Promise<number>} - Count of matching subscriptions
     */
    async materialize(segmentId, pool, evaluateSegmentConditions) {
        // Check if already materializing
        if (this.pendingMaterializations.has(segmentId)) {
            return this.pendingMaterializations.get(segmentId);
        }

        // Check last materialization time to prevent too frequent updates
        const segment = await pool.query(
            'SELECT last_materialized_at, max_size FROM audience_segments WHERE id = $1',
            [segmentId]
        );

        if (segment.rows.length === 0) {
            throw new Error(`Segment ${segmentId} not found`);
        }

        const lastMaterialized = segment.rows[0].last_materialized_at;
        const maxSize = segment.rows[0].max_size || 10000;

        if (lastMaterialized) {
            const timeSinceLastMaterialization = Date.now() - new Date(lastMaterialized).getTime();
            if (timeSinceLastMaterialization < CACHE_CONFIG.MIN_MATERIALIZATION_INTERVAL) {
                logger.debug(`Skipping materialization for segment ${segmentId} (too soon)`);
                // Return cached count if available
                const cachedEntry = this.cache.get(segmentId);
                return cachedEntry ? cachedEntry.count : 0;
            }
        }

        // Create promise for materialization
        const materializationPromise = this._doMaterialize(
            segmentId,
            pool,
            evaluateSegmentConditions,
            maxSize
        );

        this.pendingMaterializations.set(segmentId, materializationPromise);

        try {
            const count = await materializationPromise;
            return count;
        } finally {
            this.pendingMaterializations.delete(segmentId);
        }
    }

    /**
     * Internal materialization logic
     */
    async _doMaterialize(segmentId, pool, evaluateSegmentConditions, maxSize) {
        try {
            this.stats.materializations++;

            // Get segment
            const segmentResult = await pool.query(
                'SELECT * FROM audience_segments WHERE id = $1',
                [segmentId]
            );

            if (segmentResult.rows.length === 0) {
                throw new Error(`Segment ${segmentId} not found`);
            }

            const segment = segmentResult.rows[0];

            // Build query for subscriptions
            let whereConditions = [];
            let queryParams = [];

            if (segment.site_id) {
                whereConditions.push('site_id = $1');
                queryParams.push(segment.site_id);
            }

            const whereClause = whereConditions.length > 0 ?
                `WHERE ${whereConditions.join(' AND ')}` : '';

            // Get all relevant subscriptions
            const subscriptionsQuery = `
        SELECT id, user_agent, site_id, created_at, country, state, city
        FROM subscriptions 
        ${whereClause}
        ORDER BY created_at DESC
      `;

            const subscriptionsResult = await pool.query(subscriptionsQuery, queryParams);
            const allSubscriptions = subscriptionsResult.rows;

            // Filter using segment conditions
            const matchingSubscriptions = allSubscriptions.filter(sub =>
                evaluateSegmentConditions(sub, segment.conditions)
            );

            // Apply max_size limit
            const limitedSubscriptions = matchingSubscriptions.slice(0, maxSize);
            const subscriptionIds = limitedSubscriptions.map(sub => sub.id);
            const count = subscriptionIds.length;

            // Update database
            await pool.query(
                `UPDATE audience_segments 
         SET materialized_count = $1, last_materialized_at = NOW() 
         WHERE id = $2`,
                [count, segmentId]
            );

            // Update cache
            this.set(segmentId, subscriptionIds, CACHE_CONFIG.DEFAULT_TTL);

            logger.info(`Segment ${segmentId} materialized: ${count} subscriptions`);
            return count;

        } catch (error) {
            logger.error({ err: error, segmentId }, 'Segment materialization error');
            throw error;
        }
    }

    /**
     * Start cleanup interval to remove expired entries
     */
    startCleanupInterval() {
        setInterval(() => {
            let cleaned = 0;
            for (const [segmentId, entry] of this.cache.entries()) {
                if (entry.isExpired()) {
                    this.cache.delete(segmentId);
                    cleaned++;
                }
            }
            if (cleaned > 0) {
                logger.debug(`Cleaned ${cleaned} expired segment cache entries`);
            }
        }, 2 * 60 * 1000); // Every 2 minutes
    }

    /**
     * Get cache statistics
     */
    getStats() {
        const hitRate = this.stats.hits + this.stats.misses > 0 ?
            (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2) : 0;

        return {
            ...this.stats,
            hitRate: `${hitRate}%`,
            size: this.cache.size,
            maxSize: CACHE_CONFIG.MAX_SIZE
        };
    }
}

// Singleton instance
const segmentCache = new SegmentCache();

export default segmentCache;
export { SegmentCache, CACHE_CONFIG };
