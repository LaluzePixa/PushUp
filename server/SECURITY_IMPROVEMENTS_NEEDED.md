# 🔒 Security Improvements Needed

## CRITICAL: Install and Configure Rate Limiting

### Why it's critical:
Without rate limiting, attackers can:
- **Brute force** login endpoints (try millions of password combinations)
- **Spam** registration endpoint (create unlimited fake accounts)
- **DoS** any endpoint (overwhelm server with requests)

### Installation:
```bash
cd server
npm install express-rate-limit
```

### Implementation:

Add to `server/src/middleware/rateLimiter.js`:
```javascript
import rateLimit from 'express-rate-limit';

// Strict rate limit for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many authentication attempts',
    code: 'TOO_MANY_REQUESTS',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
});

// Moderate rate limit for registration
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 registrations per hour
  message: {
    error: 'Too many accounts created from this IP',
    code: 'TOO_MANY_REQUESTS',
    retryAfter: '1 hour'
  }
});

// General API rate limit
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests',
    code: 'TOO_MANY_REQUESTS'
  }
});
```

Add to `server/src/routes/auth.js`:
```javascript
import { authLimiter, registerLimiter } from '../middleware/rateLimiter.js';

// Apply to routes
router.post('/login', authLimiter, async (req, res) => { ... });
router.post('/register', registerLimiter, async (req, res) => { ... });
```

Add to `server/src/index.js`:
```javascript
import { apiLimiter } from './middleware/rateLimiter.js';

// Apply to all routes
app.use('/api', apiLimiter);
```

---

## Other Security Improvements

### 1. Install Helmet for Security Headers
```bash
npm install helmet
```

```javascript
import helmet from 'helmet';
app.use(helmet());
```

### 2. Validate All Environment Variables at Startup
Create `server/src/config/validateEnv.js`:
```javascript
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'VAPID_PUBLIC_KEY',
  'VAPID_PRIVATE_KEY'
];

export function validateEnv() {
  const missing = requiredEnvVars.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file and compare with .env.example'
    );
  }
}
```

Call in `index.js`:
```javascript
import { validateEnv } from './config/validateEnv.js';
validateEnv(); // Will throw if any required vars are missing
```

### 3. Add Request ID Tracking
```bash
npm install express-request-id
```

```javascript
import addRequestId from 'express-request-id';
app.use(addRequestId());
```

### 4. Structured Logging
```bash
npm install winston
```

Create `server/src/config/logger.js`:
```javascript
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

### 5. Database Connection Pool Configuration
Update in `index.js`:
```javascript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum connections in pool
  min: 5,  // Minimum connections to keep open
  idleTimeoutMillis: 30000, // Close idle connections after 30s
  connectionTimeoutMillis: 5000, // Timeout if can't connect within 5s
});

// Handle pool errors
pool.on('error', (err) => {
  logger.error('Unexpected database error', err);
  process.exit(-1);
});
```

---

## Timeline:
- **CRITICAL items**: Install within 24 hours
- **HIGH items**: Install within 1 week
- **MEDIUM items**: Install within 2 weeks
