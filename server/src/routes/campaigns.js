import express from 'express';
import { CronJob } from 'cron';
import webpush from 'web-push';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Mapa para almacenar trabajos programados en memoria
const scheduledJobs = new Map();

// Validación de campos requeridos
const validateCampaign = (data) => {
  const errors = [];

  if (!data.name?.trim()) errors.push('El nombre es requerido');
  if (!data.title?.trim()) errors.push('El título es requerido');
  if (!data.body?.trim()) errors.push('El cuerpo del mensaje es requerido');

  if (data.sendType === 'scheduled' && !data.scheduledAt) {
    errors.push('La fecha de programación es requerida para envíos programados');
  }

  if (data.scheduledAt && new Date(data.scheduledAt) <= new Date()) {
    errors.push('La fecha de programación debe ser futura');
  }

  return errors;
};

// Función para ejecutar una campaña
const executeCampaign = async (pool, campaignId) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Obtener datos de la campaña
    const campaignResult = await client.query(
      `SELECT c.*, array_agg(
         json_build_object('text', ca.action_text, 'url', ca.action_url, 'order', ca.action_order)
         ORDER BY ca.action_order
       ) as actions
       FROM campaigns c
       LEFT JOIN campaign_actions ca ON c.id = ca.campaign_id
       WHERE c.id = $1 AND c.status IN ('draft', 'scheduled')
       GROUP BY c.id`,
      [campaignId]
    );

    if (campaignResult.rows.length === 0) {
      throw new Error('Campaña no encontrada o ya enviada');
    }

    const campaign = campaignResult.rows[0];

    // Obtener suscripciones objetivo
    let subscriptions = [];

    // Si la campaña tiene un segment_id, usar segmentación
    if (campaign.segment_id) {
      // Obtener el segmento
      const segmentResult = await client.query(
        'SELECT * FROM audience_segments WHERE id = $1',
        [campaign.segment_id]
      );

      if (segmentResult.rows.length > 0) {
        const segment = segmentResult.rows[0];

        // Obtener todas las suscripciones y filtrar por segmento
        let whereConditions = [];
        let queryParams = [];
        let paramCounter = 1;

        if (segment.site_id) {
          whereConditions.push(`site_id = $${paramCounter}`);
          queryParams.push(segment.site_id);
          paramCounter++;
        }

        const whereClause = whereConditions.length > 0 ?
          `WHERE ${whereConditions.join(' AND ')}` : '';

        const allSubscriptionsQuery = `
          SELECT id, endpoint, p256dh, auth, user_agent, ip, site_id, created_at
          FROM subscriptions 
          ${whereClause}
          ORDER BY created_at DESC
        `;

        const allSubscriptionsResult = await client.query(allSubscriptionsQuery, queryParams);
        const allSubscriptions = allSubscriptionsResult.rows;

        // Filtrar usando las condiciones del segmento
        const { evaluateSegmentConditions } = await import('./segments.js');
        subscriptions = allSubscriptions.filter(sub =>
          evaluateSegmentConditions(sub, segment.conditions)
        );
      }
    } else {
      // Usar filtros básicos por site_id
      let whereConditions = [];
      let queryParams = [];
      let paramCounter = 1;

      if (campaign.site_id) {
        whereConditions.push(`site_id = $${paramCounter}`);
        queryParams.push(campaign.site_id);
        paramCounter++;
      }

      const whereClause = whereConditions.length > 0 ?
        `WHERE ${whereConditions.join(' AND ')}` : '';

      const subscriptionsQuery = `
        SELECT id, endpoint, p256dh, auth 
        FROM subscriptions 
        ${whereClause}
        ORDER BY created_at DESC
      `;

      const subscriptionsResult = await client.query(subscriptionsQuery, queryParams);
      subscriptions = subscriptionsResult.rows;
    }

    if (subscriptions.length === 0) {
      await client.query(
        'UPDATE campaigns SET status = $1, updated_at = NOW() WHERE id = $2',
        ['sent', campaignId]
      );
      await client.query('COMMIT');
      return { sent: 0, failed: 0, message: 'No hay suscripciones objetivo' };
    }

    // Preparar payload de notificación
    const actions = campaign.actions.filter(a => a.text);
    const notificationPayload = {
      title: campaign.title,
      body: campaign.body,
      icon: campaign.icon_url,
      image: campaign.image_url,
      badge: campaign.badge_url,
      data: {
        url: campaign.click_url,
        actions: actions.length > 0 ? actions : undefined,
        campaignId: campaign.id
      }
    };

    // Enviar notificaciones
    let totalSent = 0;
    let totalFailed = 0;
    const executionPromises = subscriptions.map(async (subscription) => {
      try {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth
          }
        };

        await webpush.sendNotification(
          pushSubscription,
          JSON.stringify(notificationPayload)
        );

        // Registrar ejecución exitosa
        await client.query(
          `INSERT INTO campaign_executions (campaign_id, subscription_id, endpoint, status, sent_at)
           VALUES ($1, $2, $3, $4, NOW())`,
          [campaignId, subscription.id, subscription.endpoint, 'sent']
        );

        totalSent++;
        return { status: 'success', endpoint: subscription.endpoint };

      } catch (error) {
        totalFailed++;
        let status = 'failed';

        // Si la suscripción expiró, eliminarla
        if (error.statusCode === 410 || error.statusCode === 404) {
          await client.query('DELETE FROM subscriptions WHERE id = $1', [subscription.id]);
          status = 'expired';
        }

        // Registrar ejecución fallida
        await client.query(
          `INSERT INTO campaign_executions (campaign_id, subscription_id, endpoint, status, error_message, sent_at)
           VALUES ($1, $2, $3, $4, $5, NOW())`,
          [campaignId, subscription.id, subscription.endpoint, status, error.message]
        );

        return { status: 'error', endpoint: subscription.endpoint, error: error.message };
      }
    });

    await Promise.allSettled(executionPromises);

    // Actualizar estadísticas de la campaña
    await client.query(
      `UPDATE campaigns 
       SET status = $1, sent_at = NOW(), total_sent = $2, total_failed = $3, updated_at = NOW()
       WHERE id = $4`,
      ['sent', totalSent, totalFailed, campaignId]
    );

    await client.query('COMMIT');

    console.log(`[Campaign ${campaignId}] Ejecutada: ${totalSent} enviadas, ${totalFailed} fallidas`);

    return {
      sent: totalSent,
      failed: totalFailed,
      total: subscriptions.length,
      message: `Campaña ejecutada: ${totalSent} enviadas, ${totalFailed} fallidas`
    };

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`[Campaign ${campaignId} Error]`, error);
    throw error;
  } finally {
    client.release();
  }
};

// POST /campaigns - Crear nueva campaña
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { pool } = req.app.locals;
    const {
      name,
      title,
      body,
      iconUrl,
      imageUrl,
      clickUrl,
      badgeUrl,
      siteId,
      segmentId,
      sendType = 'immediate',
      scheduledAt,
      actions = []
    } = req.body;

    // Validar datos
    const validationErrors = validateCampaign({
      name,
      title,
      body,
      sendType,
      scheduledAt
    });

    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Datos de campaña inválidos',
        code: 'VALIDATION_ERROR',
        details: validationErrors
      });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Crear campaña
      const campaignResult = await client.query(
        `INSERT INTO campaigns (
          user_id, site_id, segment_id, name, title, body, icon_url, image_url, 
          click_url, badge_url, send_type, scheduled_at, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *`,
        [
          req.user.id,
          siteId || null,
          segmentId || null,
          name.trim(),
          title.trim(),
          body.trim(),
          iconUrl || null,
          imageUrl || null,
          clickUrl || null,
          badgeUrl || null,
          sendType,
          scheduledAt ? new Date(scheduledAt) : null,
          sendType === 'scheduled' ? 'scheduled' : 'draft'
        ]
      );

      const campaign = campaignResult.rows[0];

      console.log('[Campaign Created]', {
        id: campaign.id,
        name: campaign.name,
        user_id: campaign.user_id,
        status: campaign.status,
        send_type: campaign.send_type
      });

      // Crear acciones si las hay
      if (actions && actions.length > 0) {
        const actionInserts = actions.map((action, index) =>
          client.query(
            'INSERT INTO campaign_actions (campaign_id, action_text, action_url, action_order) VALUES ($1, $2, $3, $4)',
            [campaign.id, action.text, action.url, index + 1]
          )
        );

        await Promise.all(actionInserts);
      }

      // Si es envío inmediato, ejecutar ahora
      if (sendType === 'immediate') {
        // Primero hacer COMMIT para que la campaña sea visible
        await client.query('COMMIT');

        try {
          const result = await executeCampaign(pool, campaign.id);

          return res.status(201).json({
            success: true,
            message: 'Campaña creada y enviada exitosamente',
            data: {
              id: campaign.id,
              name: campaign.name,
              status: 'sent'
            },
            execution: result
          });

        } catch (execError) {
          console.error('[Campaign Execution Error]', execError);

          return res.status(500).json({
            success: false,
            error: {
              code: 'EXECUTION_ERROR',
              message: `Error al enviar campaña: ${execError.message}`
            }
          });
        }
      }

      // Si es programada, crear trabajo cron
      if (sendType === 'scheduled') {
        const scheduledDate = new Date(scheduledAt);

        try {
          const job = new CronJob(scheduledDate, async () => {
            try {
              await executeCampaign(pool, campaign.id);
              scheduledJobs.delete(campaign.id);
            } catch (error) {
              console.error(`[Scheduled Campaign ${campaign.id} Error]`, error);
            }
          });

          job.start();
          scheduledJobs.set(campaign.id, job);

          console.log(`[Campaign ${campaign.id}] Programada para ${scheduledDate.toISOString()}`);

        } catch (cronError) {
          console.error('[Cron Job Creation Error]', cronError);
          await client.query('ROLLBACK');
          return res.status(500).json({
            success: false,
            error: {
              code: 'SCHEDULING_ERROR',
              message: 'Error al programar la campaña'
            }
          });
        }
      }

      await client.query('COMMIT');

      res.status(201).json({
        success: true,
        message: sendType === 'scheduled' ?
          'Campaña programada exitosamente' :
          'Campaña creada exitosamente',
        data: {
          id: campaign.id,
          name: campaign.name,
          title: campaign.title,
          body: campaign.body,
          status: campaign.status,
          sendType: campaign.send_type,
          scheduledAt: campaign.scheduled_at,
          createdAt: campaign.created_at
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('[Campaign Create Error]', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error interno del servidor'
      }
    });
  }
});

// GET /campaigns/:id - Obtener campaña específica
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { pool } = req.app.locals;
    const campaignId = parseInt(req.params.id);

    if (isNaN(campaignId)) {
      return res.status(400).json({
        error: 'ID de campaña inválido',
        code: 'INVALID_CAMPAIGN_ID'
      });
    }

    // Obtener campaña con verificación de propiedad
    const campaignResult = await pool.query(
      `SELECT c.*, 
              array_agg(
                json_build_object(
                  'id', ca.id,
                  'text', ca.action_text, 
                  'url', ca.action_url, 
                  'order', ca.action_order
                ) ORDER BY ca.action_order
              ) FILTER (WHERE ca.id IS NOT NULL) as actions
       FROM campaigns c
       LEFT JOIN campaign_actions ca ON c.id = ca.campaign_id
       WHERE c.id = $1 AND c.user_id = $2
       GROUP BY c.id`,
      [campaignId, req.user.id]
    );

    if (campaignResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Campaña no encontrada',
        code: 'CAMPAIGN_NOT_FOUND'
      });
    }

    const campaign = campaignResult.rows[0];

    // Obtener estadísticas de ejecución
    const statsResult = await pool.query(
      `SELECT 
         status,
         COUNT(*) as count
       FROM campaign_executions 
       WHERE campaign_id = $1 
       GROUP BY status`,
      [campaignId]
    );

    const stats = {};
    statsResult.rows.forEach(row => {
      stats[row.status] = parseInt(row.count);
    });

    res.json({
      campaign: {
        id: campaign.id,
        name: campaign.name,
        title: campaign.title,
        body: campaign.body,
        iconUrl: campaign.icon_url,
        imageUrl: campaign.image_url,
        clickUrl: campaign.click_url,
        badgeUrl: campaign.badge_url,
        siteId: campaign.site_id,
        status: campaign.status,
        sendType: campaign.send_type,
        scheduledAt: campaign.scheduled_at,
        sentAt: campaign.sent_at,
        totalSent: campaign.total_sent,
        totalDelivered: campaign.total_delivered,
        totalFailed: campaign.total_failed,
        totalClicked: campaign.total_clicked,
        actions: campaign.actions || [],
        createdAt: campaign.created_at,
        updatedAt: campaign.updated_at
      },
      executionStats: stats
    });

  } catch (error) {
    console.error('[Campaign Get Error]', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// PUT /campaigns/:id - Actualizar campaña (solo borradores)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { pool } = req.app.locals;
    const campaignId = parseInt(req.params.id);

    if (isNaN(campaignId)) {
      return res.status(400).json({
        error: 'ID de campaña inválido',
        code: 'INVALID_CAMPAIGN_ID'
      });
    }

    const {
      name,
      title,
      body,
      iconUrl,
      imageUrl,
      clickUrl,
      badgeUrl,
      siteId,
      sendType,
      scheduledAt,
      actions = []
    } = req.body;

    // Verificar que la campaña existe y es editable
    const campaignCheck = await pool.query(
      'SELECT id, status FROM campaigns WHERE id = $1 AND user_id = $2',
      [campaignId, req.user.id]
    );

    if (campaignCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'Campaña no encontrada',
        code: 'CAMPAIGN_NOT_FOUND'
      });
    }

    const currentCampaign = campaignCheck.rows[0];

    if (currentCampaign.status !== 'draft') {
      return res.status(400).json({
        error: 'Solo se pueden editar campañas en borrador',
        code: 'CAMPAIGN_NOT_EDITABLE'
      });
    }

    // Validar datos
    const validationErrors = validateCampaign({
      name,
      title,
      body,
      sendType,
      scheduledAt
    });

    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Datos de campaña inválidos',
        code: 'VALIDATION_ERROR',
        details: validationErrors
      });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Actualizar campaña
      const updateResult = await client.query(
        `UPDATE campaigns 
         SET name = $1, title = $2, body = $3, icon_url = $4, image_url = $5,
             click_url = $6, badge_url = $7, site_id = $8, send_type = $9,
             scheduled_at = $10, status = $11, updated_at = NOW()
         WHERE id = $12
         RETURNING *`,
        [
          name?.trim(),
          title?.trim(),
          body?.trim(),
          iconUrl || null,
          imageUrl || null,
          clickUrl || null,
          badgeUrl || null,
          siteId || null,
          sendType,
          scheduledAt ? new Date(scheduledAt) : null,
          sendType === 'scheduled' ? 'scheduled' : 'draft',
          campaignId
        ]
      );

      // Eliminar acciones existentes
      await client.query('DELETE FROM campaign_actions WHERE campaign_id = $1', [campaignId]);

      // Crear nuevas acciones
      if (actions && actions.length > 0) {
        const actionInserts = actions.map((action, index) =>
          client.query(
            'INSERT INTO campaign_actions (campaign_id, action_text, action_url, action_order) VALUES ($1, $2, $3, $4)',
            [campaignId, action.text, action.url, index + 1]
          )
        );

        await Promise.all(actionInserts);
      }

      await client.query('COMMIT');

      const updatedCampaign = updateResult.rows[0];

      res.json({
        message: 'Campaña actualizada exitosamente',
        campaign: {
          id: updatedCampaign.id,
          name: updatedCampaign.name,
          title: updatedCampaign.title,
          body: updatedCampaign.body,
          status: updatedCampaign.status,
          sendType: updatedCampaign.send_type,
          scheduledAt: updatedCampaign.scheduled_at,
          updatedAt: updatedCampaign.updated_at
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('[Campaign Update Error]', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// DELETE /campaigns/:id - Eliminar campaña
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { pool } = req.app.locals;
    const campaignId = parseInt(req.params.id);

    if (isNaN(campaignId)) {
      return res.status(400).json({
        error: 'ID de campaña inválido',
        code: 'INVALID_CAMPAIGN_ID'
      });
    }

    // Verificar que la campaña existe
    const campaignCheck = await pool.query(
      'SELECT id, name, status FROM campaigns WHERE id = $1 AND user_id = $2',
      [campaignId, req.user.id]
    );

    if (campaignCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'Campaña no encontrada',
        code: 'CAMPAIGN_NOT_FOUND'
      });
    }

    const campaign = campaignCheck.rows[0];

    // Cancelar trabajo programado si existe
    if (scheduledJobs.has(campaignId)) {
      scheduledJobs.get(campaignId).stop();
      scheduledJobs.delete(campaignId);
    }

    // Eliminar campaña (las acciones y ejecuciones se eliminan en cascada)
    await pool.query('DELETE FROM campaigns WHERE id = $1', [campaignId]);

    res.json({
      message: 'Campaña eliminada exitosamente',
      deletedCampaign: {
        id: campaignId,
        name: campaign.name,
        status: campaign.status
      }
    });

  } catch (error) {
    console.error('[Campaign Delete Error]', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// POST /campaigns/:id/send - Enviar campaña inmediatamente (solo borradores)
router.post('/:id/send', authenticateToken, async (req, res) => {
  try {
    const { pool } = req.app.locals;
    const campaignId = parseInt(req.params.id);

    if (isNaN(campaignId)) {
      return res.status(400).json({
        error: 'ID de campaña inválido',
        code: 'INVALID_CAMPAIGN_ID'
      });
    }

    // Verificar que la campaña existe y es enviable
    const campaignCheck = await pool.query(
      'SELECT id, name, status FROM campaigns WHERE id = $1 AND user_id = $2',
      [campaignId, req.user.id]
    );

    if (campaignCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'Campaña no encontrada',
        code: 'CAMPAIGN_NOT_FOUND'
      });
    }

    const campaign = campaignCheck.rows[0];

    if (campaign.status !== 'draft') {
      return res.status(400).json({
        error: 'Solo se pueden enviar campañas en borrador',
        code: 'CAMPAIGN_NOT_SENDABLE'
      });
    }

    // Ejecutar campaña
    const result = await executeCampaign(pool, campaignId);

    res.json({
      message: 'Campaña enviada exitosamente',
      campaign: {
        id: campaignId,
        name: campaign.name,
        status: 'sent'
      },
      execution: result
    });

  } catch (error) {
    console.error('[Campaign Send Error]', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * GET /campaigns - Obtener lista de campañas del usuario
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { pool } = req.app.locals;
    const { page = 1, limit = 20, status, search } = req.query;
    const userId = req.user.id;

    let query = `
      SELECT 
        c.id,
        c.name,
        c.title as notification_title,
        c.body as message,
        c.status,
        c.send_type,
        c.scheduled_at,
        c.created_at,
        c.sent_at,
        c.total_sent,
        c.total_delivered,
        c.total_failed,
        c.total_clicked,
        COALESCE(ce_stats.delivered_count, 0) as delivered,
        COALESCE(ce_stats.failed_count, 0) as failed,
        COALESCE(ce_stats.clicked_count, 0) as clicked
      FROM campaigns c
      LEFT JOIN (
        SELECT 
          campaign_id,
          COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_count,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count,
          COUNT(CASE WHEN status = 'clicked' THEN 1 END) as clicked_count
        FROM campaign_executions
        GROUP BY campaign_id
      ) ce_stats ON c.id = ce_stats.campaign_id
      WHERE c.user_id = $1
    `;

    const queryParams = [userId];
    let paramIndex = 2;

    // Aplicar filtros
    if (status && status !== 'all') {
      query += ` AND c.status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }

    if (search) {
      query += ` AND (c.name ILIKE $${paramIndex} OR c.title ILIKE $${paramIndex} OR c.body ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Ordenar por fecha de creación (más recientes primero)
    query += ' ORDER BY c.created_at DESC';

    // Paginación
    const offset = (page - 1) * limit;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(parseInt(limit), offset);

    const result = await pool.query(query, queryParams);

    console.log('[Campaigns Query]', {
      userId,
      query: query.replace(/\s+/g, ' ').trim(),
      queryParams,
      rowCount: result.rows.length
    });

    // Formatear datos para el frontend
    const formattedCampaigns = result.rows.map(campaign => {
      const totalAttempts = campaign.total_sent || 0;
      const delivered = campaign.delivered || 0;
      const clicked = campaign.clicked || 0;
      const failed = campaign.failed || 0;

      return {
        id: campaign.id.toString(),
        name: campaign.name,
        dateCreated: new Date(campaign.created_at).toLocaleString('es-ES'),
        status: mapCampaignStatus(campaign.status),
        totalAttempts: totalAttempts,
        successfullySent: totalAttempts - failed,
        failedToSend: failed > 0 ? failed : (totalAttempts === 0 ? "No subscriber found" : 0),
        delivered: delivered,
        clicked: clicked,
        closed: 0, // No tenemos esta métrica aún
        ctr: delivered > 0 ? ((clicked / delivered) * 100).toFixed(2) : 0,
        message: campaign.message,
        scheduledAt: campaign.scheduled_at,
        sentAt: campaign.sent_at
      };
    });

    // Obtener total de campañas para paginación
    let countQuery = 'SELECT COUNT(*) FROM campaigns WHERE user_id = $1';
    const countParams = [userId];

    if (status && status !== 'all') {
      countQuery += ' AND status = $2';
      countParams.push(status);
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalCampaigns = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: {
        campaigns: formattedCampaigns,
        pagination: {
          current: parseInt(page),
          limit: parseInt(limit),
          total: totalCampaigns,
          pages: Math.ceil(totalCampaigns / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error getting campaigns:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error interno del servidor'
      }
    });
  }
});

/**
 * Helper para mapear estados de campaña
 */
function mapCampaignStatus(status) {
  const statusMap = {
    'draft': 'Pending',
    'scheduled': 'Scheduled',
    'sending': 'Pending',
    'sent': 'Success',
    'failed': 'Error',
    'cancelled': 'Error'
  };

  return statusMap[status] || 'Pending';
}

export default router;
