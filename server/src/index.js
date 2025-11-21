import 'dotenv/config';

// Validate environment variables BEFORE anything else
import { validateEnv, getEnvInfo } from './config/validateEnv.js';
validateEnv();

import express from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import pg from 'pg';
import webpush from 'web-push';
import helmet from 'helmet';
import pinoHttp from 'pino-http';

// Importar rutas y middlewares
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import sitesRoutes from './routes/sites.js';
import campaignsRoutes from './routes/campaigns.js';
import segmentsRoutes from './routes/segments.js';
import dashboardRoutes from './routes/dashboard.js';
import optinsRoutes from './routes/optins.js';
import subscriptionBellRoutes from './routes/subscriptionBell.js';
import emailPromptRoutes from './routes/emailPrompt.js';
import { authenticateToken, authorizeRoles, optionalAuth } from './middleware/auth.js';

// Importar servicios y configuración
import CampaignScheduler from './services/campaignScheduler.js';
import logger from './config/logger.js';
import { initGeoIP, getGeoData, getClientIP } from './utils/geoip.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Security: Helmet adds security headers to protect against common vulnerabilities
// SECURITY: Different CSP for development vs production
const isDevelopment = process.env.NODE_ENV !== 'production';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      // SECURITY: Only allow 'unsafe-inline' in development for demo.html
      // Production should use nonces or hashes for inline styles/scripts
      styleSrc: isDevelopment
        ? ["'self'", "'unsafe-inline'"]
        : ["'self'"],
      scriptSrc: isDevelopment
        ? ["'self'", "'unsafe-inline'"]
        : ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      upgradeInsecureRequests: isDevelopment ? [] : null, // Upgrade HTTP to HTTPS in production
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  crossOriginEmbedderPolicy: false, // Allow push notifications to work
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow resources from other origins
}));

// HTTP Request Logging with Pino
app.use(pinoHttp({
  logger,
  customLogLevel: (req, res, err) => {
    if (res.statusCode >= 500 || err) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  customSuccessMessage: (req, res) => {
    return `${req.method} ${req.url} - ${res.statusCode}`;
  },
  customErrorMessage: (req, res, err) => {
    return `${req.method} ${req.url} - ${res.statusCode} - ${err.message}`;
  },
  // Don't log health checks to reduce noise
  autoLogging: {
    ignore: (req) => req.url === '/healthz'
  }
}));

app.use(bodyParser.json());
app.use(cookieParser()); // Parse cookies from requests

// CORS Configuration - SECURITY FIX
// Only allow specific origins from environment variable
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:3001', 'http://localhost:3000']; // Default for development only - incluye ambos puertos

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from origin ${origin}`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true, // Allow cookies to be sent
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-Request-ID'], // Expose custom headers if needed
  maxAge: 86400 // Cache preflight requests for 24 hours
}));

app.use(express.static('public'));

const { Pool } = pg;

// Database pool configuration with limits
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: parseInt(process.env.DB_POOL_MAX) || 20,          // Maximum connections
  min: parseInt(process.env.DB_POOL_MIN) || 5,           // Minimum connections
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,  // 30s
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECT_TIMEOUT) || 5000, // 5s
});

// Handle pool errors
pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected database pool error');
  // Don't exit process - let the app continue with remaining connections
});

// Log pool connection
pool.on('connect', () => {
  logger.debug('New database connection established');
});

// Hacer disponible el pool de conexiones en toda la app
app.locals.pool = pool;

// VAPID
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:you@example.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// migración al arrancar
import('../scripts/migrate.js').catch(() => { });

// Rutas de autenticación y usuarios
app.use('/auth', authRoutes);
app.use('/users', usersRoutes);
app.use('/sites', sitesRoutes);
app.use('/campaigns', campaignsRoutes);
app.use('/segments', segmentsRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/optins', optinsRoutes);
app.use('/api/subscription-bell', subscriptionBellRoutes);
app.use('/email-prompt', emailPromptRoutes);

// Rutas públicas
app.get('/healthz', (_, res) => res.send('ok'));
app.get('/vapid-public-key', (_, res) => {
  res.json({
    success: true,
    data: { publicKey: process.env.VAPID_PUBLIC_KEY }
  });
});

// Servir página de configuración del subscription bell
app.get('/subs-bell', (req, res) => {
  res.sendFile('subs-bell.html', { root: './public' });
});

// Servir página demo del cliente
app.get('/demo-client', (req, res) => {
  res.sendFile('demo-client.html', { root: './public' });
});

// guardar suscripción (con autenticación opcional)
app.post('/subscribe', optionalAuth, async (req, res) => {
  try {
    logger.debug({ body: JSON.stringify(req.body).slice(0, 200) }, 'Subscribe request received');
    const sub = req.body;
    const { siteId, isDemoMode } = req.body; // Para soporte multi-tenant y modo demo

    // Marcar si es modo demo para logging
    if (isDemoMode) {
      logger.info('🔧 Demo mode subscription received (localhost development)');
    }

    if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_SUBSCRIPTION',
          message: 'Suscripción inválida'
        }
      });
    }

    const userAgent = req.headers['user-agent'] || null;
    const ip = getClientIP(req);
    const userId = req.user ? req.user.id : null;

    // Obtener datos geográficos de la IP
    const geoData = getGeoData(ip);

    logger.debug({ ip, geoData }, 'Geolocation data for subscription');

    const sql = `
      INSERT INTO subscriptions (endpoint, p256dh, auth, user_agent, ip, user_id, site_id, country, state, city)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      ON CONFLICT (endpoint)
      DO UPDATE SET 
        p256dh=EXCLUDED.p256dh, 
        auth=EXCLUDED.auth, 
        user_id=EXCLUDED.user_id,
        site_id=EXCLUDED.site_id,
        country=EXCLUDED.country,
        state=EXCLUDED.state,
        city=EXCLUDED.city,
        updated_at=NOW()
      RETURNING id;
    `;
    const values = [
      sub.endpoint,
      sub.keys.p256dh,
      sub.keys.auth,
      userAgent,
      ip,
      userId,
      siteId || null,
      geoData.country,
      geoData.state,
      geoData.city
    ];
    const r = await pool.query(sql, values);

    res.json({
      success: true,
      data: {
        id: r.rows[0].id
      },
      message: 'Suscripción guardada exitosamente'
    });
  } catch (error) {
    logger.error({
      err: error,
      message: error.message,
      stack: error.stack,
      body: req.body
    }, 'Subscribe error');

    // Si la respuesta ya fue enviada, no enviar otra
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Error interno del servidor',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }
      });
    }
  }
});

// envío de notificaciones (solo admins y superadmins)
app.post('/send', authenticateToken, authorizeRoles('admin', 'superadmin'), async (req, res) => {
  try {
    const {
      title = 'Hola 👋',
      body = 'Mensaje de prueba',
      url = '/',
      endpoint,
      siteId,
      userId
    } = req.body || {};

    let targets = [];
    let whereConditions = [];
    let queryParams = [];
    let paramCounter = 1;

    // Filtrar por endpoint específico
    if (endpoint) {
      whereConditions.push(`endpoint = $${paramCounter}`);
      queryParams.push(endpoint);
      paramCounter++;
    }

    // Filtrar por site_id (multi-tenant)
    if (siteId) {
      whereConditions.push(`site_id = $${paramCounter}`);
      queryParams.push(siteId);
      paramCounter++;
    }

    // Filtrar por usuario específico
    if (userId) {
      whereConditions.push(`user_id = $${paramCounter}`);
      queryParams.push(parseInt(userId));
      paramCounter++;
    }

    const whereClause = whereConditions.length > 0 ?
      `WHERE ${whereConditions.join(' AND ')}` : '';

    const query = `SELECT endpoint, p256dh, auth FROM subscriptions ${whereClause}`;
    const rr = await pool.query(query, queryParams);
    targets = rr.rows;

    if (targets.length === 0) {
      return res.json({
        ok: true,
        sent: 0,
        removed: 0,
        errors: 0,
        message: 'No hay suscripciones que coincidan con los criterios'
      });
    }

    let sent = 0, removed = 0, errors = 0;
    const results = await Promise.allSettled(targets.map(async (t) => {
      const subscription = { endpoint: t.endpoint, keys: { p256dh: t.p256dh, auth: t.auth } };
      try {
        await webpush.sendNotification(subscription, JSON.stringify({ title, body, url }));
        sent++;
        return { status: 'success', endpoint: t.endpoint };
      } catch (e) {
        errors++;
        if (e.statusCode === 410 || e.statusCode === 404) {
          await pool.query('DELETE FROM subscriptions WHERE endpoint=$1', [subscription.endpoint]).catch(() => { });
          removed++;
          return { status: 'removed', endpoint: t.endpoint, reason: 'subscription_expired' };
        }
        return { status: 'error', endpoint: t.endpoint, error: e.message };
      }
    }));

    // Log para auditoría
    logger.info({
      user: req.user.email,
      role: req.user.role,
      sent,
      errors,
      removed,
      total: targets.length
    }, 'Send notification completed');

    res.json({
      ok: true,
      sent,
      removed,
      errors,
      total: targets.length,
      message: `Notificaciones procesadas: ${sent} enviadas, ${errors} errores, ${removed} suscripciones eliminadas`
    });
  } catch (error) {
    logger.error({ err: error }, 'Send notification error');
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// admin/demo
app.get('/admin', (_, res) => res.sendFile(process.cwd() + '/public/admin.html'));
app.get('/demo', (_, res) => res.sendFile(process.cwd() + '/public/demo.html'));

// Inicializar GeoIP y arrancar el servidor
async function startServer() {
  // Inicializar GeoIP database
  await initGeoIP();

  // Inicializar y arrancar el scheduler de campañas
  const campaignScheduler = new CampaignScheduler(pool);
  campaignScheduler.start();

  // Ruta para obtener estadísticas del scheduler
  app.get('/scheduler/stats', authenticateToken, authorizeRoles('admin', 'superadmin'), (req, res) => {
    res.json(campaignScheduler.getStats());
  });

  // Manejar cierre graceful del servidor
  process.on('SIGINT', () => {
    logger.info('Received SIGINT, shutting down gracefully...');
    campaignScheduler.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    logger.info('Received SIGTERM, shutting down gracefully...');
    campaignScheduler.stop();
    process.exit(0);
  });

  app.listen(PORT, () => {
    logger.info({ port: PORT, env: process.env.NODE_ENV }, 'PushSaaS API server started');
  });
}

// Arrancar el servidor
startServer().catch((error) => {
  logger.error({ err: error }, 'Failed to start server');
  process.exit(1);
});
