import { CronJob } from 'cron';
import webpush from 'web-push';

class CampaignScheduler {
  constructor(pool) {
    this.pool = pool;
    this.scheduledJobs = new Map();
    this.isRunning = false;
    
    // Verificar campañas programadas cada minuto
    this.checkScheduledCampaigns = new CronJob(
      '0 * * * * *', // Cada minuto
      async () => {
        await this.processScheduledCampaigns();
      },
      null,
      false, // No iniciar automáticamente
      'America/Los_Angeles'
    );
  }
  
  start() {
    if (!this.isRunning) {
      this.checkScheduledCampaigns.start();
      this.isRunning = true;
      console.log('[Campaign Scheduler] Iniciado ✅');
      
      // Cargar campañas programadas existentes al iniciar
      this.loadScheduledCampaigns();
    }
  }
  
  stop() {
    if (this.isRunning) {
      this.checkScheduledCampaigns.stop();
      
      // Detener todos los trabajos programados
      this.scheduledJobs.forEach(job => job.stop());
      this.scheduledJobs.clear();
      
      this.isRunning = false;
      console.log('[Campaign Scheduler] Detenido ❌');
    }
  }
  
  // Cargar campañas programadas existentes de la base de datos
  async loadScheduledCampaigns() {
    try {
      const result = await this.pool.query(
        `SELECT id, scheduled_at FROM campaigns 
         WHERE status = 'scheduled' AND scheduled_at > NOW()
         ORDER BY scheduled_at ASC`
      );
      
      for (const campaign of result.rows) {
        this.scheduleCampaign(campaign.id, new Date(campaign.scheduled_at));
      }
      
      console.log(`[Campaign Scheduler] Cargadas ${result.rows.length} campañas programadas`);
      
    } catch (error) {
      console.error('[Campaign Scheduler] Error al cargar campañas programadas:', error);
    }
  }
  
  // Programar una campaña específica
  scheduleCampaign(campaignId, scheduledDate) {
    try {
      // Si ya existe un trabajo para esta campaña, cancelarlo
      if (this.scheduledJobs.has(campaignId)) {
        this.scheduledJobs.get(campaignId).stop();
        this.scheduledJobs.delete(campaignId);
      }
      
      // Crear nuevo trabajo cron
      const job = new CronJob(
        scheduledDate,
        async () => {
          try {
            await this.executeCampaign(campaignId);
            this.scheduledJobs.delete(campaignId);
          } catch (error) {
            console.error(`[Campaign Scheduler] Error ejecutando campaña ${campaignId}:`, error);
          }
        },
        null,
        true // Iniciar automáticamente
      );
      
      this.scheduledJobs.set(campaignId, job);
      
      console.log(`[Campaign Scheduler] Campaña ${campaignId} programada para ${scheduledDate.toISOString()}`);
      
    } catch (error) {
      console.error(`[Campaign Scheduler] Error programando campaña ${campaignId}:`, error);
    }
  }
  
  // Cancelar programación de una campaña
  cancelScheduledCampaign(campaignId) {
    if (this.scheduledJobs.has(campaignId)) {
      this.scheduledJobs.get(campaignId).stop();
      this.scheduledJobs.delete(campaignId);
      console.log(`[Campaign Scheduler] Cancelada programación de campaña ${campaignId}`);
    }
  }
  
  // Procesar campañas que deberían haberse ejecutado (fallback)
  async processScheduledCampaigns() {
    try {
      const result = await this.pool.query(
        `SELECT id FROM campaigns 
         WHERE status = 'scheduled' AND scheduled_at <= NOW()
         ORDER BY scheduled_at ASC`
      );
      
      for (const campaign of result.rows) {
        console.log(`[Campaign Scheduler] Ejecutando campaña atrasada ${campaign.id}`);
        await this.executeCampaign(campaign.id);
      }
      
    } catch (error) {
      console.error('[Campaign Scheduler] Error procesando campañas programadas:', error);
    }
  }
  
  // Ejecutar una campaña
  async executeCampaign(campaignId) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Obtener datos de la campaña
      const campaignResult = await client.query(
        `SELECT c.*, array_agg(
           json_build_object('text', ca.action_text, 'url', ca.action_url, 'order', ca.action_order)
           ORDER BY ca.action_order
         ) FILTER (WHERE ca.id IS NOT NULL) as actions
         FROM campaigns c
         LEFT JOIN campaign_actions ca ON c.id = ca.campaign_id
         WHERE c.id = $1 AND c.status IN ('draft', 'scheduled')
         GROUP BY c.id`,
        [campaignId]
      );
      
      if (campaignResult.rows.length === 0) {
        console.log(`[Campaign Scheduler] Campaña ${campaignId} no encontrada o ya enviada`);
        await client.query('COMMIT');
        return;
      }
      
      const campaign = campaignResult.rows[0];
      
      // Marcar campaña como en proceso
      await client.query(
        'UPDATE campaigns SET status = $1, updated_at = NOW() WHERE id = $2',
        ['processing', campaignId]
      );
      
      // Obtener suscripciones objetivo
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
      const subscriptions = subscriptionsResult.rows;
      
      if (subscriptions.length === 0) {
        await client.query(
          'UPDATE campaigns SET status = $1, sent_at = NOW(), updated_at = NOW() WHERE id = $2',
          ['sent', campaignId]
        );
        await client.query('COMMIT');
        console.log(`[Campaign Scheduler] Campaña ${campaignId} completada sin suscripciones objetivo`);
        return;
      }
      
      // Preparar payload de notificación
      const actions = campaign.actions || [];
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
      
      // Enviar notificaciones en lotes para evitar sobrecarga
      const batchSize = 100;
      let totalSent = 0;
      let totalFailed = 0;
      
      for (let i = 0; i < subscriptions.length; i += batchSize) {
        const batch = subscriptions.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (subscription) => {
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
            return { status: 'success' };
            
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
            
            return { status: 'error', error: error.message };
          }
        });
        
        await Promise.allSettled(batchPromises);
        
        // Pequeña pausa entre lotes
        if (i + batchSize < subscriptions.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      // Actualizar estadísticas finales de la campaña
      await client.query(
        `UPDATE campaigns 
         SET status = $1, sent_at = NOW(), total_sent = $2, total_failed = $3, updated_at = NOW()
         WHERE id = $4`,
        ['sent', totalSent, totalFailed, campaignId]
      );
      
      await client.query('COMMIT');
      
      console.log(`[Campaign Scheduler] Campaña ${campaignId} ejecutada: ${totalSent} enviadas, ${totalFailed} fallidas`);
      
    } catch (error) {
      await client.query('ROLLBACK');
      
      // Marcar campaña como fallida
      try {
        await client.query(
          'UPDATE campaigns SET status = $1, updated_at = NOW() WHERE id = $2',
          ['failed', campaignId]
        );
      } catch (updateError) {
        console.error(`[Campaign Scheduler] Error actualizando estado de campaña ${campaignId}:`, updateError);
      }
      
      console.error(`[Campaign Scheduler] Error ejecutando campaña ${campaignId}:`, error);
      throw error;
      
    } finally {
      client.release();
    }
  }
  
  // Obtener estadísticas del scheduler
  getStats() {
    return {
      isRunning: this.isRunning,
      scheduledCampaigns: this.scheduledJobs.size,
      campaignIds: Array.from(this.scheduledJobs.keys())
    };
  }
}

export default CampaignScheduler;
