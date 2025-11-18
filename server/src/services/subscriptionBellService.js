import logger from '../config/logger.js';

/**
 * Service for managing subscription bell configurations
 * Handles database operations for subscription bell settings
 */
class SubscriptionBellService {
    constructor(pool) {
        this.pool = pool;
    }

    /**
     * Get subscription bell configuration for a site
     * @param {number} siteId - The site ID
     * @returns {Promise<Object|null>} Configuration object or null if not found
     */
    async getConfigBySiteId(siteId) {
        try {
            const result = await this.pool.query(
                'SELECT * FROM subscription_bell_configs WHERE site_id = $1',
                [siteId]
            );

            if (result.rows.length === 0) {
                return null;
            }

            return this.formatConfig(result.rows[0]);
        } catch (error) {
            logger.error({ err: error, siteId }, 'Error getting subscription bell config');
            throw error;
        }
    }

    /**
     * Get or create default configuration for a site
     * @param {number} siteId - The site ID
     * @returns {Promise<Object>} Configuration object
     */
    async getOrCreateConfig(siteId) {
        try {
            let config = await this.getConfigBySiteId(siteId);

            if (!config) {
                config = await this.createDefaultConfig(siteId);
            }

            return config;
        } catch (error) {
            logger.error({ err: error, siteId }, 'Error getting or creating config');
            throw error;
        }
    }

    /**
     * Create default configuration for a site
     * @param {number} siteId - The site ID
     * @returns {Promise<Object>} Created configuration object
     */
    async createDefaultConfig(siteId) {
        try {
            const result = await this.pool.query(
                `INSERT INTO subscription_bell_configs (
          site_id, style, position, theme, theme_color, popup_style,
          x_axis, y_axis, default_title, default_button_text,
          subscribed_title, subscribed_button_text, unsubscribed_title,
          unsubscribed_button_text, show_last_notifications,
          default_heading, subscribed_heading, is_active
        ) VALUES (
          $1, 'Rounded', 'Bottom Right', 'Dark', '#4A90E2', 'Standard',
          '15', '15',
          'Suscríbete para recibir notificaciones push sobre las últimas actualizaciones',
          'SUSCRIBIRSE',
          'Estás suscrito a las notificaciones push',
          'DESUSCRIBIRSE',
          'No estás suscrito a las notificaciones push',
          'SUSCRIBIRSE',
          true,
          'Aquí hay algunas notificaciones que te perdiste:',
          'Notificaciones Recientes',
          true
        ) RETURNING *`,
                [siteId]
            );

            return this.formatConfig(result.rows[0]);
        } catch (error) {
            logger.error({ err: error, siteId }, 'Error creating default config');
            throw error;
        }
    }

    /**
     * Update subscription bell configuration
     * @param {number} siteId - The site ID
     * @param {Object} configData - Configuration data to update
     * @returns {Promise<Object>} Updated configuration object
     */
    async updateConfig(siteId, configData) {
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
            } = configData;

            const result = await this.pool.query(
                `UPDATE subscription_bell_configs SET
          style = COALESCE($2, style),
          position = COALESCE($3, position),
          theme = COALESCE($4, theme),
          theme_color = COALESCE($5, theme_color),
          popup_style = COALESCE($6, popup_style),
          x_axis = COALESCE($7, x_axis),
          y_axis = COALESCE($8, y_axis),
          default_title = COALESCE($9, default_title),
          default_button_text = COALESCE($10, default_button_text),
          subscribed_title = COALESCE($11, subscribed_title),
          subscribed_button_text = COALESCE($12, subscribed_button_text),
          unsubscribed_title = COALESCE($13, unsubscribed_title),
          unsubscribed_button_text = COALESCE($14, unsubscribed_button_text),
          show_last_notifications = COALESCE($15, show_last_notifications),
          default_heading = COALESCE($16, default_heading),
          subscribed_heading = COALESCE($17, subscribed_heading),
          is_active = COALESCE($18, is_active),
          updated_at = NOW()
        WHERE site_id = $1
        RETURNING *`,
                [
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
                ]
            );

            if (result.rows.length === 0) {
                throw new Error('Configuration not found');
            }

            return this.formatConfig(result.rows[0]);
        } catch (error) {
            logger.error({ err: error, siteId }, 'Error updating config');
            throw error;
        }
    }

    /**
     * Toggle bell visibility
     * @param {number} siteId - The site ID
     * @param {boolean} isActive - New active status
     * @returns {Promise<Object>} Updated configuration object
     */
    async toggleVisibility(siteId, isActive) {
        try {
            const result = await this.pool.query(
                `UPDATE subscription_bell_configs SET
          is_active = $2,
          updated_at = NOW()
        WHERE site_id = $1
        RETURNING *`,
                [siteId, isActive]
            );

            if (result.rows.length === 0) {
                throw new Error('Configuration not found');
            }

            return this.formatConfig(result.rows[0]);
        } catch (error) {
            logger.error({ err: error, siteId, isActive }, 'Error toggling visibility');
            throw error;
        }
    }

    /**
     * Format database row to camelCase object
     * @param {Object} row - Database row
     * @returns {Object} Formatted configuration object
     */
    formatConfig(row) {
        return {
            id: row.id,
            siteId: row.site_id,
            style: row.style,
            position: row.position,
            theme: row.theme,
            themeColor: row.theme_color,
            popupStyle: row.popup_style,
            xAxis: row.x_axis,
            yAxis: row.y_axis,
            defaultTitle: row.default_title,
            defaultButtonText: row.default_button_text,
            subscribedTitle: row.subscribed_title,
            subscribedButtonText: row.subscribed_button_text,
            unsubscribedTitle: row.unsubscribed_title,
            unsubscribedButtonText: row.unsubscribed_button_text,
            showLastNotifications: row.show_last_notifications,
            defaultHeading: row.default_heading,
            subscribedHeading: row.subscribed_heading,
            isActive: row.is_active,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }
}

export default SubscriptionBellService;
