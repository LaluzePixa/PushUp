import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import pg from 'pg';
import webpush from 'web-push';

// Importar rutas y middlewares
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import sitesRoutes from './routes/sites.js';
import campaignsRoutes from './routes/campaigns.js';
import segmentsRoutes from './routes/segments.js';
import dashboardRoutes from './routes/dashboard.js';
import optinsRoutes from './routes/optins.js';
import subscriptionBellRoutes from './routes/subscriptionBell.js';
import { authenticateToken, authorizeRoles, optionalAuth } from './middleware/auth.js';

// Importar servicios
import CampaignScheduler from './services/campaignScheduler.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(cors());
app.use(express.static('public'));

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

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
    console.log('[subscribe] body=', JSON.stringify(req.body).slice(0, 200)); // debug
    const sub = req.body;
    const { siteId } = req.body; // Para soporte multi-tenant

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
    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString();
    const userId = req.user ? req.user.id : null;

    const sql = `
      INSERT INTO subscriptions (endpoint, p256dh, auth, user_agent, ip, user_id, site_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      ON CONFLICT (endpoint)
      DO UPDATE SET 
        p256dh=EXCLUDED.p256dh, 
        auth=EXCLUDED.auth, 
        user_id=EXCLUDED.user_id,
        site_id=EXCLUDED.site_id,
        updated_at=NOW()
      RETURNING id;
    `;
    const values = [sub.endpoint, sub.keys.p256dh, sub.keys.auth, userAgent, ip, userId, siteId || null];
    const r = await pool.query(sql, values);

    res.json({
      success: true,
      data: {
        id: r.rows[0].id
      },
      message: 'Suscripción guardada exitosamente'
    });
  } catch (error) {
    console.error('[Subscribe Error]', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error interno del servidor'
      }
    });
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
    console.log(`[Send Notification] User: ${req.user.email} (${req.user.role}) - Sent: ${sent}, Errors: ${errors}, Removed: ${removed}`);

    res.json({
      ok: true,
      sent,
      removed,
      errors,
      total: targets.length,
      message: `Notificaciones procesadas: ${sent} enviadas, ${errors} errores, ${removed} suscripciones eliminadas`
    });
  } catch (error) {
    console.error('[Send Error]', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// admin/demo
app.get('/admin', (_, res) => res.sendFile(process.cwd() + '/public/admin.html'));
app.get('/demo', (_, res) => res.sendFile(process.cwd() + '/public/demo.html'));

// Inicializar y arrancar el scheduler de campañas
const campaignScheduler = new CampaignScheduler(pool);
campaignScheduler.start();

// Ruta para obtener estadísticas del scheduler
app.get('/scheduler/stats', authenticateToken, authorizeRoles('admin', 'superadmin'), (req, res) => {
  res.json(campaignScheduler.getStats());
});

// Manejar cierre graceful del servidor
process.on('SIGINT', () => {
  console.log('\n[Server] Cerrando servidor...');
  campaignScheduler.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n[Server] Cerrando servidor...');
  campaignScheduler.stop();
  process.exit(0);
});

app.listen(PORT, () => console.log(`pushsaas API en http://localhost:${PORT}`));
