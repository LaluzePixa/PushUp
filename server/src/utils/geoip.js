/**
 * GeoIP Utility
 * Provides IP geolocation using MaxMind GeoLite2 database
 */

import maxmind from 'maxmind';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let cityLookup = null;

/**
 * Initialize the GeoIP reader
 * @returns {Promise<boolean>} Success status
 */
export async function initGeoIP() {
    try {
        // Try to load from node_modules first (npm package)
        const dbPath = path.join(__dirname, '../../node_modules/@ip-location-db/geolite2-city-mmdb/geolite2-city-ipv4.mmdb');

        cityLookup = await maxmind.open(dbPath);
        logger.info('✅ GeoIP database loaded successfully');
        return true;
    } catch (error) {
        logger.error({ err: error }, '❌ Error loading GeoIP database');
        // Don't fail the app if GeoIP is not available
        return false;
    }
}

/**
 * Get geographic data for an IP address
 * @param {string} ip - IP address to lookup
 * @returns {Object} Geographic information
 */
export function getGeoData(ip) {
    // Default response when no data available
    const defaultResponse = {
        country: null,
        countryCode: null,
        state: null,
        stateCode: null,
        city: null,
        postalCode: null,
        latitude: null,
        longitude: null,
        timezone: null
    };

    if (!cityLookup) {
        return defaultResponse;
    }

    // Clean IP address (remove port if present)
    let cleanIP = ip;
    if (ip && ip.includes(':')) {
        // Handle IPv6 or IPv4 with port
        if (ip.startsWith('::ffff:')) {
            cleanIP = ip.replace('::ffff:', '');
        }
        // Remove port
        const lastColon = cleanIP.lastIndexOf(':');
        if (lastColon > -1 && !cleanIP.includes('[')) {
            cleanIP = cleanIP.substring(0, lastColon);
        }
    }

    // Skip private IPs
    if (isPrivateIP(cleanIP)) {
        return defaultResponse;
    }

    try {
        const data = cityLookup.get(cleanIP);

        if (!data) {
            return defaultResponse;
        }

        return {
            country: data.country?.names?.en || null,
            countryCode: data.country?.iso_code || null,
            state: data.subdivisions?.[0]?.names?.en || null,
            stateCode: data.subdivisions?.[0]?.iso_code || null,
            city: data.city?.names?.en || null,
            postalCode: data.postal?.code || null,
            latitude: data.location?.latitude || null,
            longitude: data.location?.longitude || null,
            timezone: data.location?.time_zone || null
        };
    } catch (error) {
        logger.error({ err: error, ip: cleanIP }, 'Error getting geo data');
        return defaultResponse;
    }
}

/**
 * Check if an IP is a private/local address
 * @param {string} ip - IP address
 * @returns {boolean} True if private IP
 */
function isPrivateIP(ip) {
    if (!ip) return true;

    // Localhost
    if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') {
        return true;
    }

    // Private IPv4 ranges
    const parts = ip.split('.');
    if (parts.length === 4) {
        const first = parseInt(parts[0]);
        const second = parseInt(parts[1]);

        // 10.0.0.0/8
        if (first === 10) return true;

        // 172.16.0.0/12
        if (first === 172 && second >= 16 && second <= 31) return true;

        // 192.168.0.0/16
        if (first === 192 && second === 168) return true;

        // Link-local 169.254.0.0/16
        if (first === 169 && second === 254) return true;
    }

    return false;
}

/**
 * Validate if a string is a valid IP address
 * @param {string} ip - IP address to validate
 * @returns {boolean} True if valid IP
 */
export function isValidIP(ip) {
    if (!ip) return false;

    // IPv4 regex
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;

    // IPv6 regex (simplified)
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;

    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

/**
 * Extract IP from request
 * @param {Object} req - Express request object
 * @returns {string} IP address
 */
export function getClientIP(req) {
    // Check various headers for the real IP
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        // x-forwarded-for can be a comma-separated list
        const ips = forwarded.split(',').map(ip => ip.trim());
        return ips[0];
    }

    return req.headers['x-real-ip'] ||
        req.connection?.remoteAddress ||
        req.socket?.remoteAddress ||
        req.ip ||
        '127.0.0.1';
}
