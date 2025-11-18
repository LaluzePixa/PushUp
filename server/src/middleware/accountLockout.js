import logger from '../config/logger.js';
import { logSecurityEvent, SecurityEvents } from '../utils/security-logger.js';

/**
 * Account Lockout Middleware
 * Protects against brute force attacks by locking accounts after failed attempts
 */

// Configuration
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 30;
const ATTEMPT_WINDOW_MINUTES = 15;

/**
 * Check if account is locked
 * Middleware to be used before authentication
 */
export async function checkAccountLockout(req, res, next) {
  try {
    const { email } = req.body;

    if (!email) {
      return next();
    }

    const { pool } = req.app.locals;

    // Get user lockout status
    const result = await pool.query(
      `SELECT id, email, failed_login_attempts, account_locked_until, last_failed_login
       FROM users
       WHERE email = $1`,
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      // User doesn't exist - don't reveal this info
      // Continue to normal auth flow which will fail
      return next();
    }

    const user = result.rows[0];

    // Check if account is currently locked
    if (user.account_locked_until) {
      const lockedUntil = new Date(user.account_locked_until);
      const now = new Date();

      if (now < lockedUntil) {
        // Account is still locked
        const minutesRemaining = Math.ceil((lockedUntil - now) / 1000 / 60);

        logSecurityEvent(SecurityEvents.LOGIN_BLOCKED, {
          email: user.email,
          userId: user.id,
          reason: 'Account locked due to failed attempts',
          lockedUntil: lockedUntil.toISOString(),
          minutesRemaining
        }, req);

        return res.status(423).json({
          success: false,
          error: {
            code: 'ACCOUNT_LOCKED',
            message: `Cuenta bloqueada por seguridad. Intenta de nuevo en ${minutesRemaining} minutos.`,
            lockedUntil: lockedUntil.toISOString(),
            retryAfter: minutesRemaining * 60 // seconds
          }
        });
      } else {
        // Lock period has expired, unlock account
        await pool.query(
          `UPDATE users
           SET failed_login_attempts = 0,
               account_locked_until = NULL
           WHERE id = $1`,
          [user.id]
        );

        logSecurityEvent(SecurityEvents.ACCOUNT_UNLOCKED, {
          email: user.email,
          userId: user.id,
          reason: 'Lockout period expired'
        }, req);
      }
    }

    // Attach user info to request for later use
    req.accountLockoutUser = user;
    next();

  } catch (error) {
    logger.error({ err: error }, 'Error checking account lockout');
    // Don't block login on lockout check error
    next();
  }
}

/**
 * Record failed login attempt
 * Call this after authentication fails
 */
export async function recordFailedLogin(req, email, reason = 'Invalid credentials') {
  try {
    const { pool } = req.app.locals;
    const normalizedEmail = email.toLowerCase().trim();

    // Record the attempt in login_attempts table
    await pool.query(
      `INSERT INTO login_attempts (email, ip_address, user_agent, success, failure_reason)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        normalizedEmail,
        req.ip || req.connection?.remoteAddress,
        req.get('user-agent'),
        false,
        reason
      ]
    );

    // Update user's failed attempts counter
    const result = await pool.query(
      `UPDATE users
       SET failed_login_attempts = failed_login_attempts + 1,
           last_failed_login = CURRENT_TIMESTAMP
       WHERE email = $1
       RETURNING id, email, failed_login_attempts`,
      [normalizedEmail]
    );

    if (result.rows.length === 0) {
      // User doesn't exist - still log attempt
      return;
    }

    const user = result.rows[0];
    const attempts = user.failed_login_attempts;

    logger.warn({
      userId: user.id,
      email: user.email,
      attempts,
      ip: req.ip
    }, `Failed login attempt (${attempts}/${MAX_FAILED_ATTEMPTS})`);

    // Lock account if max attempts reached
    if (attempts >= MAX_FAILED_ATTEMPTS) {
      const lockUntil = new Date();
      lockUntil.setMinutes(lockUntil.getMinutes() + LOCKOUT_DURATION_MINUTES);

      await pool.query(
        `UPDATE users
         SET account_locked_until = $1
         WHERE id = $2`,
        [lockUntil, user.id]
      );

      logSecurityEvent(SecurityEvents.ACCOUNT_LOCKED, {
        userId: user.id,
        email: user.email,
        attempts,
        lockedUntil: lockUntil.toISOString(),
        lockoutDuration: LOCKOUT_DURATION_MINUTES
      }, req);

      logger.error({
        userId: user.id,
        email: user.email,
        attempts,
        lockedUntil: lockUntil.toISOString()
      }, 'Account locked due to failed login attempts');

      // TODO: Send email notification to user about account lock
      // sendAccountLockedEmail(user.email, lockUntil);
    }

  } catch (error) {
    logger.error({ err: error }, 'Error recording failed login');
  }
}

/**
 * Record successful login
 * Resets failed attempts counter
 */
export async function recordSuccessfulLogin(req, email) {
  try {
    const { pool } = req.app.locals;
    const normalizedEmail = email.toLowerCase().trim();

    // Record successful attempt
    await pool.query(
      `INSERT INTO login_attempts (email, ip_address, user_agent, success)
       VALUES ($1, $2, $3, $4)`,
      [
        normalizedEmail,
        req.ip || req.connection?.remoteAddress,
        req.get('user-agent'),
        true
      ]
    );

    // Reset failed attempts counter
    await pool.query(
      `UPDATE users
       SET failed_login_attempts = 0,
           last_failed_login = NULL
       WHERE email = $1`,
      [normalizedEmail]
    );

    logger.info({ email: normalizedEmail }, 'Successful login - reset failed attempts');

  } catch (error) {
    logger.error({ err: error }, 'Error recording successful login');
  }
}

/**
 * Get recent failed login attempts for monitoring
 */
export async function getRecentFailedAttempts(pool, minutes = 60) {
  try {
    const result = await pool.query(
      `SELECT
         email,
         ip_address,
         COUNT(*) as attempt_count,
         MAX(attempted_at) as last_attempt
       FROM login_attempts
       WHERE success = false
         AND attempted_at >= NOW() - INTERVAL '${minutes} minutes'
       GROUP BY email, ip_address
       HAVING COUNT(*) >= 3
       ORDER BY attempt_count DESC, last_attempt DESC
       LIMIT 50`
    );

    return result.rows;
  } catch (error) {
    logger.error({ err: error }, 'Error getting recent failed attempts');
    return [];
  }
}

/**
 * Manually unlock an account (admin function)
 */
export async function unlockAccount(pool, userId, unlockedBy) {
  try {
    const result = await pool.query(
      `UPDATE users
       SET failed_login_attempts = 0,
           account_locked_until = NULL,
           last_failed_login = NULL
       WHERE id = $1
       RETURNING email`,
      [userId]
    );

    if (result.rows.length > 0) {
      logger.info({
        userId,
        email: result.rows[0].email,
        unlockedBy
      }, 'Account manually unlocked');

      return {
        success: true,
        email: result.rows[0].email
      };
    }

    return {
      success: false,
      error: 'User not found'
    };

  } catch (error) {
    logger.error({ err: error, userId }, 'Error unlocking account');
    return {
      success: false,
      error: 'Database error'
    };
  }
}

/**
 * Get lockout statistics
 */
export async function getLockoutStats(pool) {
  try {
    const [lockedAccounts, recentAttempts, topTargets] = await Promise.all([
      // Currently locked accounts
      pool.query(
        `SELECT COUNT(*) as count
         FROM users
         WHERE account_locked_until > NOW()`
      ),

      // Failed attempts in last hour
      pool.query(
        `SELECT COUNT(*) as count
         FROM login_attempts
         WHERE success = false
           AND attempted_at >= NOW() - INTERVAL '1 hour'`
      ),

      // Most targeted accounts (last 24h)
      pool.query(
        `SELECT
           email,
           COUNT(*) as attempts
         FROM login_attempts
         WHERE success = false
           AND attempted_at >= NOW() - INTERVAL '24 hours'
         GROUP BY email
         ORDER BY attempts DESC
         LIMIT 10`
      )
    ]);

    return {
      lockedAccounts: parseInt(lockedAccounts.rows[0].count),
      failedAttemptsLastHour: parseInt(recentAttempts.rows[0].count),
      mostTargeted: topTargets.rows
    };

  } catch (error) {
    logger.error({ err: error }, 'Error getting lockout stats');
    return null;
  }
}

/**
 * Cleanup old login attempts (should be run periodically)
 */
export async function cleanupOldAttempts(pool, daysToKeep = 30) {
  try {
    const result = await pool.query(
      `DELETE FROM login_attempts
       WHERE attempted_at < NOW() - INTERVAL '${daysToKeep} days'`
    );

    logger.info({ deleted: result.rowCount }, 'Cleaned up old login attempts');
    return result.rowCount;

  } catch (error) {
    logger.error({ err: error }, 'Error cleaning up old attempts');
    return 0;
  }
}

export default {
  checkAccountLockout,
  recordFailedLogin,
  recordSuccessfulLogin,
  getRecentFailedAttempts,
  unlockAccount,
  getLockoutStats,
  cleanupOldAttempts,
  MAX_FAILED_ATTEMPTS,
  LOCKOUT_DURATION_MINUTES
};
