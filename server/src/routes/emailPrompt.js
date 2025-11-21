import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import logger from '../config/logger.js';

const router = express.Router();

// GET /email-prompt/settings/:siteId - Obtener configuración de email prompt para un sitio
router.get('/settings/:siteId', authenticateToken, async (req, res) => {
    try {
        const { pool } = req.app.locals;
        const { siteId } = req.params;
        const userId = req.user.id;
        const isAdmin = req.user.role === 'admin' || req.user.role === 'superadmin';

        // Verificar que el sitio pertenece al usuario (si no es admin)
        if (!isAdmin) {
            const siteCheck = await pool.query(
                'SELECT id FROM sites WHERE id = $1 AND user_id = $2',
                [siteId, userId]
            );

            if (siteCheck.rows.length === 0) {
                return res.status(403).json({
                    success: false,
                    error: {
                        code: 'FORBIDDEN',
                        message: 'No tienes acceso a este sitio'
                    }
                });
            }
        }

        // Buscar configuración existente
        const result = await pool.query(
            'SELECT * FROM email_prompt_settings WHERE site_id = $1',
            [siteId]
        );

        if (result.rows.length === 0) {
            // Devolver configuración por defecto si no existe
            return res.json({
                success: true,
                data: {
                    settings: {
                        site_id: parseInt(siteId),
                        is_enabled: false,
                        animation: 'Slide-in',
                        background_color: '#ffffff',
                        text_color: '#000000',
                        input_color: '#000000',
                        text: 'Opt-in for latest news and updates',
                        icon_url: null,
                        cancel_button_text: 'Not Yet',
                        cancel_button_color: '#2563eb',
                        cancel_button_show: true,
                        submit_button_text: 'Subscribe',
                        submit_button_color: '#2563eb',
                        submit_button_show: true,
                        re_prompt_delay: 1,
                        thank_you_message: 'Thank You...',
                        collect_email: true,
                        email_label: 'Email Address',
                        email_validation_error: 'Please enter a valid e-mail address',
                        email_required: true,
                        collect_phone: true,
                        phone_label: 'Phone Number',
                        phone_validation_error: 'Please enter a valid phone number',
                        default_country: 'United States',
                        phone_required: true
                    }
                }
            });
        }

        res.json({
            success: true,
            data: {
                settings: result.rows[0]
            }
        });

    } catch (error) {
        logger.error({ err: error }, 'Get email prompt settings error');
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Error interno del servidor'
            }
        });
    }
});

// POST /email-prompt/settings/:siteId - Actualizar/crear configuración de email prompt
router.post('/settings/:siteId', authenticateToken, async (req, res) => {
    try {
        const { pool } = req.app.locals;
        const { siteId } = req.params;
        const userId = req.user.id;
        const isAdmin = req.user.role === 'admin' || req.user.role === 'superadmin';

        // Verificar que el sitio pertenece al usuario (si no es admin)
        if (!isAdmin) {
            const siteCheck = await pool.query(
                'SELECT id FROM sites WHERE id = $1 AND user_id = $2',
                [siteId, userId]
            );

            if (siteCheck.rows.length === 0) {
                return res.status(403).json({
                    success: false,
                    error: {
                        code: 'FORBIDDEN',
                        message: 'No tienes acceso a este sitio'
                    }
                });
            }
        }

        const {
            is_enabled,
            animation,
            background_color,
            text_color,
            input_color,
            text,
            icon_url,
            cancel_button_text,
            cancel_button_color,
            cancel_button_show,
            submit_button_text,
            submit_button_color,
            submit_button_show,
            re_prompt_delay,
            thank_you_message,
            collect_email,
            email_label,
            email_validation_error,
            email_required,
            collect_phone,
            phone_label,
            phone_validation_error,
            default_country,
            phone_required
        } = req.body;

        // Upsert (insertar o actualizar)
        const result = await pool.query(
            `INSERT INTO email_prompt_settings (
        site_id, is_enabled, animation, background_color, text_color, input_color, text, icon_url,
        cancel_button_text, cancel_button_color, cancel_button_show,
        submit_button_text, submit_button_color, submit_button_show,
        re_prompt_delay, thank_you_message,
        collect_email, email_label, email_validation_error, email_required,
        collect_phone, phone_label, phone_validation_error, default_country, phone_required,
        updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, NOW()
      )
      ON CONFLICT (site_id) 
      DO UPDATE SET
        is_enabled = $2,
        animation = $3,
        background_color = $4,
        text_color = $5,
        input_color = $6,
        text = $7,
        icon_url = $8,
        cancel_button_text = $9,
        cancel_button_color = $10,
        cancel_button_show = $11,
        submit_button_text = $12,
        submit_button_color = $13,
        submit_button_show = $14,
        re_prompt_delay = $15,
        thank_you_message = $16,
        collect_email = $17,
        email_label = $18,
        email_validation_error = $19,
        email_required = $20,
        collect_phone = $21,
        phone_label = $22,
        phone_validation_error = $23,
        default_country = $24,
        phone_required = $25,
        updated_at = NOW()
      RETURNING *`,
            [
                siteId,
                is_enabled,
                animation,
                background_color,
                text_color,
                input_color,
                text,
                icon_url,
                cancel_button_text,
                cancel_button_color,
                cancel_button_show,
                submit_button_text,
                submit_button_color,
                submit_button_show,
                re_prompt_delay,
                thank_you_message,
                collect_email,
                email_label,
                email_validation_error,
                email_required,
                collect_phone,
                phone_label,
                phone_validation_error,
                default_country,
                phone_required
            ]
        );

        logger.info({ siteId, userId }, 'Email prompt settings updated');

        res.json({
            success: true,
            data: {
                settings: result.rows[0]
            }
        });

    } catch (error) {
        logger.error({ err: error }, 'Update email prompt settings error');
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Error interno del servidor'
            }
        });
    }
});

// GET /email-prompt/settings/:siteId/public - Obtener configuración pública (sin autenticación)
router.get('/settings/:siteId/public', async (req, res) => {
    try {
        const { pool } = req.app.locals;
        const { siteId } = req.params;

        const result = await pool.query(
            `SELECT 
        is_enabled, animation, background_color, text_color, input_color, text, icon_url,
        cancel_button_text, cancel_button_color, cancel_button_show,
        submit_button_text, submit_button_color, submit_button_show,
        thank_you_message,
        collect_email, email_label, email_validation_error, email_required,
        collect_phone, phone_label, phone_validation_error, default_country, phone_required
      FROM email_prompt_settings 
      WHERE site_id = $1 AND is_enabled = true`,
            [siteId]
        );

        if (result.rows.length === 0) {
            return res.json({
                success: true,
                data: {
                    settings: null
                }
            });
        }

        res.json({
            success: true,
            data: {
                settings: result.rows[0]
            }
        });

    } catch (error) {
        logger.error({ err: error }, 'Get public email prompt settings error');
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Error interno del servidor'
            }
        });
    }
});

// POST /email-prompt/collect - Guardar email/teléfono recolectado (público)
router.post('/collect', async (req, res) => {
    try {
        const { pool } = req.app.locals;
        const { siteId, email, phone, countryCode, subscriptionId } = req.body;

        if (!email && !phone) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Se requiere email o teléfono'
                }
            });
        }

        const result = await pool.query(
            `INSERT INTO collected_contacts (site_id, subscription_id, email, phone, country_code)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
            [siteId, subscriptionId || null, email || null, phone || null, countryCode || null]
        );

        logger.info({ siteId, email: !!email, phone: !!phone }, 'Contact collected');

        res.json({
            success: true,
            data: {
                contact: result.rows[0]
            }
        });

    } catch (error) {
        logger.error({ err: error }, 'Collect contact error');
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
