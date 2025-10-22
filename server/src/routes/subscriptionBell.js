import express from 'express';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// In-memory storage for subscription bell configuration
// En producción, esto debería ir en la base de datos
let subscriptionBellConfig = {
    style: 'Rounded',
    position: 'Bottom Left',
    theme: 'Dark',
    themeColor: '#4A90E2',
    popupStyle: 'Standard',
    xAxis: '15',
    yAxis: '15',
    defaultTitle: 'Suscríbete para recibir notificaciones push sobre las últimas actualizaciones',
    defaultButtonText: 'SUSCRIBIRSE',
    subscribedTitle: 'Estás suscrito a las notificaciones push',
    subscribedButtonText: 'DESUSCRIBIRSE',
    unsubscribedTitle: 'No estás suscrito a las notificaciones push',
    unsubscribedButtonText: 'SUSCRIBIRSE',
    showLastNotifications: true,
    defaultHeading: 'Aquí hay algunas notificaciones que te perdiste:',
    subscribedHeading: 'Notificaciones Recientes',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
};

/**
 * @route GET /api/subscription-bell/config
 * @desc Get subscription bell configuration
 * @access Public (para que la página HTML pueda acceder sin autenticación)
 */
router.get('/config', (req, res) => {
    try {
        res.json({
            success: true,
            data: subscriptionBellConfig,
            message: 'Configuración obtenida exitosamente'
        });
    } catch (error) {
        console.error('Error getting subscription bell config:', error);
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
 * @access Public (para que la página HTML pueda guardar sin autenticación)
 */
router.post('/config', (req, res) => {
    try {
        const {
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
        if (!defaultTitle || !defaultButtonText) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'El título y texto del botón por defecto son requeridos'
                }
            });
        }

        // Actualizar la configuración
        subscriptionBellConfig = {
            ...subscriptionBellConfig,
            style: style || subscriptionBellConfig.style,
            position: position || subscriptionBellConfig.position,
            theme: theme || subscriptionBellConfig.theme,
            themeColor: themeColor || subscriptionBellConfig.themeColor,
            popupStyle: popupStyle || subscriptionBellConfig.popupStyle,
            xAxis: xAxis || subscriptionBellConfig.xAxis,
            yAxis: yAxis || subscriptionBellConfig.yAxis,
            defaultTitle,
            defaultButtonText,
            subscribedTitle: subscribedTitle || subscriptionBellConfig.subscribedTitle,
            subscribedButtonText: subscribedButtonText || subscriptionBellConfig.subscribedButtonText,
            unsubscribedTitle: unsubscribedTitle || subscriptionBellConfig.unsubscribedTitle,
            unsubscribedButtonText: unsubscribedButtonText || subscriptionBellConfig.unsubscribedButtonText,
            showLastNotifications: showLastNotifications !== undefined ? showLastNotifications : subscriptionBellConfig.showLastNotifications,
            defaultHeading: defaultHeading || subscriptionBellConfig.defaultHeading,
            subscribedHeading: subscribedHeading || subscriptionBellConfig.subscribedHeading,
            isActive: isActive !== undefined ? isActive : subscriptionBellConfig.isActive,
            updatedAt: new Date().toISOString()
        };

        res.json({
            success: true,
            data: subscriptionBellConfig,
            message: 'Configuración actualizada exitosamente'
        });
    } catch (error) {
        console.error('Error updating subscription bell config:', error);
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
 * @access Public (para que la página HTML pueda cambiar sin autenticación)
 */
router.post('/toggle', (req, res) => {
    try {
        const { isActive } = req.body;

        if (typeof isActive !== 'boolean') {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'isActive debe ser un valor booleano'
                }
            });
        }

        subscriptionBellConfig.isActive = isActive;
        subscriptionBellConfig.updatedAt = new Date().toISOString();

        res.json({
            success: true,
            data: {
                isActive: subscriptionBellConfig.isActive,
                updatedAt: subscriptionBellConfig.updatedAt
            },
            message: `Campana de suscripción ${isActive ? 'activada' : 'desactivada'} exitosamente`
        });
    } catch (error) {
        console.error('Error toggling subscription bell:', error);
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
 */
router.get('/widget-config', (req, res) => {
    try {
        // Solo retornar la configuración necesaria para el widget público
        const publicConfig = {
            style: subscriptionBellConfig.style,
            position: subscriptionBellConfig.position,
            theme: subscriptionBellConfig.theme,
            themeColor: subscriptionBellConfig.themeColor,
            defaultTitle: subscriptionBellConfig.defaultTitle,
            defaultButtonText: subscriptionBellConfig.defaultButtonText,
            subscribedTitle: subscriptionBellConfig.subscribedTitle,
            subscribedButtonText: subscriptionBellConfig.subscribedButtonText,
            unsubscribedTitle: subscriptionBellConfig.unsubscribedTitle,
            unsubscribedButtonText: subscriptionBellConfig.unsubscribedButtonText,
            showLastNotifications: subscriptionBellConfig.showLastNotifications,
            defaultHeading: subscriptionBellConfig.defaultHeading,
            subscribedHeading: subscriptionBellConfig.subscribedHeading,
            isActive: subscriptionBellConfig.isActive
        };

        res.json({
            success: true,
            data: publicConfig,
            message: 'Configuración del widget obtenida exitosamente'
        });
    } catch (error) {
        console.error('Error getting widget config:', error);
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
        console.error('Error getting recent campaigns:', error);
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