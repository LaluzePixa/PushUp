import express from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import logger from '../config/logger.js';

const router = express.Router();

/**
 * Get default configuration values
 */
const getDefaultConfig = () => ({
    style: 'Rounded',
    position: 'Bottom Left',
    theme: 'Dark',
    themeColor: '#4A90E2',
    popupStyle: 'Standard',
    xAxis: 15,
    yAxis: 15,
    defaultTitle: 'Suscríbete para recibir notificaciones push sobre las últimas actualizaciones',
    defaultButtonText: 'SUSCRIBIRSE',
    subscribedTitle: 'Estás suscrito a las notificaciones push',
    subscribedButtonText: 'DESUSCRIBIRSE',
    unsubscribedTitle: 'No estás suscrito a las notificaciones push',
    unsubscribedButtonText: 'SUSCRIBIRSE',
    showLastNotifications: true,
    defaultHeading: 'Aquí hay algunas notificaciones que te perdiste:',
    subscribedHeading: 'Notificaciones Recientes',
    isActive: true
});

/**
 * Transform DB row to API format
 */
const transformConfigToApi = (config) => ({
    id: config.id,
    siteId: config.site_id,
    style: config.style,
    position: config.position,
    theme: config.theme,
    themeColor: config.theme_color,
    popupStyle: config.popup_style,
    xAxis: config.x_axis,
    yAxis: config.y_axis,
    defaultTitle: config.default_title,
    defaultButtonText: config.default_button_text,
    subscribedTitle: config.subscribed_title,
    subscribedButtonText: config.subscribed_button_text,
    unsubscribedTitle: config.unsubscribed_title,
    unsubscribedButtonText: config.unsubscribed_button_text,
    showLastNotifications: config.show_last_notifications,
    defaultHeading: config.default_heading,
    subscribedHeading: config.subscribed_heading,
    isActive: config.is_active,
    createdAt: config.created_at,
    updatedAt: config.updated_at
});

/**
 * @route GET /api/subscription-bell/config/:siteId
 * @desc Get subscription bell configuration for a specific site
 * @access Public (para que la página HTML pueda acceder sin autenticación)
 */
router.get('/config/:siteId', async (req, res) => {
    try {
        const { siteId } = req.params;
        const { pool } = req.app.locals;

        // Validate siteId
        if (!siteId || isNaN(parseInt(siteId))) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'ID de sitio inválido'
                }
            });
        }

        // Get config from database
        const result = await pool.query(
            `SELECT * FROM subscription_bell_configs WHERE site_id = $1`,
            [parseInt(siteId)]
        );

        let config;
        if (result.rows.length === 0) {
            // Return default config if no custom config exists
            config = {
                ...getDefaultConfig(),
                siteId: parseInt(siteId)
            };
        } else {
            config = transformConfigToApi(result.rows[0]);
        }

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
 * @desc Create or update subscription bell configuration
 * @access Private (Authenticated users for their own sites)
 */
router.post('/config', authenticateToken, async (req, res) => {
    try {
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

        const { pool } = req.app.locals;

        // Validation
        if (!siteId) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'El ID del sitio es requerido'
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

        // Verify that the user owns the site
        const siteCheck = await pool.query(
            'SELECT id FROM sites WHERE id = $1 AND user_id = $2',
            [siteId, req.user.id]
        );

        if (siteCheck.rows.length === 0) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'No tienes permisos para modificar la configuración de este sitio'
                }
            });
        }

        // Check if config exists
        const existingConfig = await pool.query(
            'SELECT id FROM subscription_bell_configs WHERE site_id = $1',
            [siteId]
        );

        let result;
        if (existingConfig.rows.length > 0) {
            // Update existing config
            result = await pool.query(
                `UPDATE subscription_bell_configs SET
                    style = COALESCE($1, style),
                    position = COALESCE($2, position),
                    theme = COALESCE($3, theme),
                    theme_color = COALESCE($4, theme_color),
                    popup_style = COALESCE($5, popup_style),
                    x_axis = COALESCE($6, x_axis),
                    y_axis = COALESCE($7, y_axis),
                    default_title = $8,
                    default_button_text = $9,
                    subscribed_title = COALESCE($10, subscribed_title),
                    subscribed_button_text = COALESCE($11, subscribed_button_text),
                    unsubscribed_title = COALESCE($12, unsubscribed_title),
                    unsubscribed_button_text = COALESCE($13, unsubscribed_button_text),
                    show_last_notifications = COALESCE($14, show_last_notifications),
                    default_heading = COALESCE($15, default_heading),
                    subscribed_heading = COALESCE($16, subscribed_heading),
                    is_active = COALESCE($17, is_active),
                    updated_at = CURRENT_TIMESTAMP
                WHERE site_id = $18
                RETURNING *`,
                [
                    style, position, theme, themeColor, popupStyle,
                    xAxis, yAxis, defaultTitle, defaultButtonText,
                    subscribedTitle, subscribedButtonText,
                    unsubscribedTitle, unsubscribedButtonText,
                    showLastNotifications, defaultHeading,
                    subscribedHeading, isActive, siteId
                ]
            );
        } else {
            // Create new config
            result = await pool.query(
                `INSERT INTO subscription_bell_configs (
                    site_id, style, position, theme, theme_color, popup_style,
                    x_axis, y_axis, default_title, default_button_text,
                    subscribed_title, subscribed_button_text,
                    unsubscribed_title, unsubscribed_button_text,
                    show_last_notifications, default_heading,
                    subscribed_heading, is_active
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
                RETURNING *`,
                [
                    siteId, style || 'Rounded', position || 'Bottom Left',
                    theme || 'Dark', themeColor || '#4A90E2', popupStyle || 'Standard',
                    xAxis || 15, yAxis || 15, defaultTitle, defaultButtonText,
                    subscribedTitle || 'Estás suscrito a las notificaciones push',
                    subscribedButtonText || 'DESUSCRIBIRSE',
                    unsubscribedTitle || 'No estás suscrito a las notificaciones push',
                    unsubscribedButtonText || 'SUSCRIBIRSE',
                    showLastNotifications !== undefined ? showLastNotifications : true,
                    defaultHeading || 'Aquí hay algunas notificaciones que te perdiste:',
                    subscribedHeading || 'Notificaciones Recientes',
                    isActive !== undefined ? isActive : true
                ]
            );
        }

        const config = transformConfigToApi(result.rows[0]);

        res.json({
            success: true,
            data: config,
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
 * @access Private (Authenticated users for their own sites)
 */
router.post('/toggle', authenticateToken, async (req, res) => {
    try {
        const { siteId, isActive } = req.body;
        const { pool } = req.app.locals;

        if (!siteId) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'El ID del sitio es requerido'
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

        // Verify that the user owns the site
        const siteCheck = await pool.query(
            'SELECT id FROM sites WHERE id = $1 AND user_id = $2',
            [siteId, req.user.id]
        );

        if (siteCheck.rows.length === 0) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'No tienes permisos para modificar la configuración de este sitio'
                }
            });
        }

        const result = await pool.query(
            `UPDATE subscription_bell_configs
             SET is_active = $1, updated_at = CURRENT_TIMESTAMP
             WHERE site_id = $2
             RETURNING *`,
            [isActive, siteId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Configuración no encontrada. Crea una primero.'
                }
            });
        }

        res.json({
            success: true,
            data: {
                isActive: result.rows[0].is_active,
                updatedAt: result.rows[0].updated_at
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
 * @route GET /api/subscription-bell/widget-config/:siteId
 * @desc Get public widget configuration for embedding
 * @access Public
 */
router.get('/widget-config/:siteId', async (req, res) => {
    try {
        const { siteId } = req.params;
        const { pool } = req.app.locals;

        if (!siteId || isNaN(parseInt(siteId))) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'ID de sitio inválido'
                }
            });
        }

        const result = await pool.query(
            `SELECT style, position, theme, theme_color, popup_style,
                    default_title, default_button_text, subscribed_title,
                    subscribed_button_text, unsubscribed_title, unsubscribed_button_text,
                    show_last_notifications, default_heading, subscribed_heading, is_active
             FROM subscription_bell_configs WHERE site_id = $1`,
            [parseInt(siteId)]
        );

        let publicConfig;
        if (result.rows.length === 0) {
            // Return default public config
            const defaults = getDefaultConfig();
            publicConfig = {
                style: defaults.style,
                position: defaults.position,
                theme: defaults.theme,
                themeColor: defaults.themeColor,
                defaultTitle: defaults.defaultTitle,
                defaultButtonText: defaults.defaultButtonText,
                subscribedTitle: defaults.subscribedTitle,
                subscribedButtonText: defaults.subscribedButtonText,
                unsubscribedTitle: defaults.unsubscribedTitle,
                unsubscribedButtonText: defaults.unsubscribedButtonText,
                showLastNotifications: defaults.showLastNotifications,
                defaultHeading: defaults.defaultHeading,
                subscribedHeading: defaults.subscribedHeading,
                isActive: defaults.isActive
            };
        } else {
            const config = result.rows[0];
            publicConfig = {
                style: config.style,
                position: config.position,
                theme: config.theme,
                themeColor: config.theme_color,
                defaultTitle: config.default_title,
                defaultButtonText: config.default_button_text,
                subscribedTitle: config.subscribed_title,
                subscribedButtonText: config.subscribed_button_text,
                unsubscribedTitle: config.unsubscribed_title,
                unsubscribedButtonText: config.unsubscribed_button_text,
                showLastNotifications: config.show_last_notifications,
                defaultHeading: config.default_heading,
                subscribedHeading: config.subscribed_heading,
                isActive: config.is_active
            };
        }

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
 * @route GET /api/subscription-bell/recent-campaigns/:siteId
 * @desc Get recent campaigns for widget preview
 * @access Public
 */
router.get('/recent-campaigns/:siteId', async (req, res) => {
    try {
        const { siteId } = req.params;
        const limit = parseInt(req.query.limit) || 3;
        const { pool } = req.app.locals;

        if (!siteId || isNaN(parseInt(siteId))) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'ID de sitio inválido'
                }
            });
        }

        // Get actual recent campaigns from database
        const result = await pool.query(
            `SELECT id, title, body, created_at
             FROM campaigns
             WHERE site_id = $1 AND status = 'Success'
             ORDER BY created_at DESC
             LIMIT $2`,
            [parseInt(siteId), limit]
        );

        const recentCampaigns = result.rows.map(campaign => ({
            title: campaign.title,
            time: formatTimeAgo(campaign.created_at),
            id: campaign.id.toString()
        }));

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

/**
 * Helper function to format time ago
 */
function formatTimeAgo(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);

    if (seconds < 60) return 'Hace un momento';
    if (seconds < 3600) return `Hace ${Math.floor(seconds / 60)} minutos`;
    if (seconds < 86400) return `Hace ${Math.floor(seconds / 3600)} horas`;
    if (seconds < 604800) return `Hace ${Math.floor(seconds / 86400)} días`;
    return new Date(date).toLocaleDateString('es-ES');
}

export default router;
