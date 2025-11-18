import express from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import logger from '../config/logger.js';
import SubscriptionBellService from '../services/subscriptionBellService.js';

const router = express.Router();

/**
 * @route GET /api/subscription-bell/config
 * @desc Get subscription bell configuration for a site
 * @access Public (for the HTML page to access without authentication)
 * @requires Query param: siteId
 */
router.get('/config', async (req, res) => {
    try {
        const { pool } = req.app.locals;
        const { siteId } = req.query;

        if (!siteId) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'siteId es requerido'
                }
            });
        }

        const service = new SubscriptionBellService(pool);
        const config = await service.getOrCreateConfig(parseInt(siteId));

        res.json({
            success: true,
            data: config,
            message: 'Configuración obtenida exitosamente'
        });
    } catch (error) {
        logger.error({ err: error }, 'Error getting subscription bell config');
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
 * @route POST /api/subscription-bell/config
 * @desc Update subscription bell configuration
 * @access Private (Admin/SuperAdmin only)
 * @requires Body: siteId and configuration fields
 */
router.post('/config', authenticateToken, authorizeRoles('admin', 'superadmin'), async (req, res) => {
    try {
        const { pool } = req.app.locals;
        const {
            siteId,
            style,
            position,
            theme,
            themeColor,
            popupStyle,
            xAxis,
            yAxis,
            defaultTitle,
            defaultButtonText,
            subscribedTitle,
            subscribedButtonText,
            unsubscribedTitle,
            unsubscribedButtonText,
            showLastNotifications,
            defaultHeading,
            subscribedHeading,
            isActive
        } = req.body;

        // Validación básica
        if (!siteId) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'siteId es requerido'
                }
            });
        }

        if (!defaultTitle || !defaultButtonText) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'El título y texto del botón por defecto son requeridos'
                }
            });
        }

        // Verificar que el sitio pertenece al usuario (excepto superadmin)
        if (req.user.role !== 'superadmin') {
            const siteCheck = await pool.query(
                'SELECT id FROM sites WHERE id = $1 AND user_id = $2',
                [siteId, req.user.id]
            );

            if (siteCheck.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'SITE_NOT_FOUND',
                        message: 'Sitio no encontrado o no tienes permisos para modificarlo'
                    }
                });
            }
        }

        const service = new SubscriptionBellService(pool);

        // Verificar si existe la configuración, si no, crearla
        let config = await service.getConfigBySiteId(parseInt(siteId));
        if (!config) {
            config = await service.createDefaultConfig(parseInt(siteId));
        }

        // Actualizar la configuración
        const updatedConfig = await service.updateConfig(parseInt(siteId), {
            style,
            position,
            theme,
            themeColor,
            popupStyle,
            xAxis,
            yAxis,
            defaultTitle,
            defaultButtonText,
            subscribedTitle,
            subscribedButtonText,
            unsubscribedTitle,
            unsubscribedButtonText,
            showLastNotifications,
            defaultHeading,
            subscribedHeading,
            isActive
        });

        res.json({
            success: true,
            data: updatedConfig,
            message: 'Configuración actualizada exitosamente'
        });
    } catch (error) {
        logger.error({ err: error }, 'Error updating subscription bell config');
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
 * @route POST /api/subscription-bell/toggle
 * @desc Toggle subscription bell visibility
 * @access Private (Admin/SuperAdmin only)
 * @requires Body: siteId and isActive
 */
router.post('/toggle', authenticateToken, authorizeRoles('admin', 'superadmin'), async (req, res) => {
    try {
        const { pool } = req.app.locals;
        const { siteId, isActive } = req.body;

        if (!siteId) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'siteId es requerido'
                }
            });
        }

        if (typeof isActive !== 'boolean') {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'isActive debe ser un valor booleano'
                }
            });
        }

        // Verificar que el sitio pertenece al usuario (excepto superadmin)
        if (req.user.role !== 'superadmin') {
            const siteCheck = await pool.query(
                'SELECT id FROM sites WHERE id = $1 AND user_id = $2',
                [siteId, req.user.id]
            );

            if (siteCheck.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'SITE_NOT_FOUND',
                        message: 'Sitio no encontrado o no tienes permisos para modificarlo'
                    }
                });
            }
        }

        const service = new SubscriptionBellService(pool);

        // Verificar si existe la configuración, si no, crearla
        let config = await service.getConfigBySiteId(parseInt(siteId));
        if (!config) {
            config = await service.createDefaultConfig(parseInt(siteId));
        }

        const updatedConfig = await service.toggleVisibility(parseInt(siteId), isActive);

        res.json({
            success: true,
            data: {
                isActive: updatedConfig.isActive,
                updatedAt: updatedConfig.updatedAt
            },
            message: `Campana de suscripción ${isActive ? 'activada' : 'desactivada'} exitosamente`
        });
    } catch (error) {
        logger.error({ err: error }, 'Error toggling subscription bell');
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
 * @route GET /api/subscription-bell/widget-config
 * @desc Get public widget configuration for embedding
 * @access Public
 * @requires Query param: siteId
 */
router.get('/widget-config', async (req, res) => {
    try {
        const { pool } = req.app.locals;
        const { siteId } = req.query;

        if (!siteId) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'siteId es requerido'
                }
            });
        }

        const service = new SubscriptionBellService(pool);
        const config = await service.getOrCreateConfig(parseInt(siteId));

        // Solo retornar la configuración necesaria para el widget público
        const publicConfig = {
            style: config.style,
            position: config.position,
            theme: config.theme,
            themeColor: config.themeColor,
            defaultTitle: config.defaultTitle,
            defaultButtonText: config.defaultButtonText,
            subscribedTitle: config.subscribedTitle,
            subscribedButtonText: config.subscribedButtonText,
            unsubscribedTitle: config.unsubscribedTitle,
            unsubscribedButtonText: config.unsubscribedButtonText,
            showLastNotifications: config.showLastNotifications,
            defaultHeading: config.defaultHeading,
            subscribedHeading: config.subscribedHeading,
            isActive: config.isActive
        };

        res.json({
            success: true,
            data: publicConfig,
            message: 'Configuración del widget obtenida exitosamente'
        });
    } catch (error) {
        logger.error({ err: error }, 'Error getting widget config');
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
 * @route GET /api/subscription-bell/recent-campaigns
 * @desc Get recent campaigns for widget preview
 * @access Public
 */
router.get('/recent-campaigns', (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 3;

        // Simulación de campañas recientes
        // En producción, esto vendría de la base de datos
        const recentCampaigns = [
            {
                title: '¡Bienvenido a PushSaaS!',
                time: 'Hace 2 horas',
                id: '1'
            },
            {
                title: 'Nueva función disponible',
                time: 'Ayer',
                id: '2'
            },
            {
                title: 'Actualización de sistema',
                time: 'Hace 3 días',
                id: '3'
            }
        ].slice(0, limit);

        res.json({
            success: true,
            data: recentCampaigns,
            message: 'Campañas recientes obtenidas exitosamente'
        });
    } catch (error) {
        logger.error({ err: error }, 'Error getting recent campaigns');
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Error interno del servidor'
            }
        });
    }
});

export default router;