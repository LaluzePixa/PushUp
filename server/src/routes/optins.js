import express from 'express';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route GET /optins
 * @desc Obtener configuraciones de opt-in prompts del usuario
 * @access Private
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { pool } = req.app.locals;
    const userId = req.user.id;
    const siteId = req.query.siteId;

    let query = `
      SELECT * FROM optin_configurations 
      WHERE user_id = $1
    `;
    const params = [userId];

    if (siteId) {
      query += ` AND site_id = $2`;
      params.push(siteId);
    } else {
      query += ` AND site_id IS NULL`;
    }

    query += ` ORDER BY created_at DESC LIMIT 1`;

    const result = await pool.query(query, params);

    if (result.rows.length > 0) {
      const config = result.rows[0];
      res.json({
        success: true,
        data: {
          id: config.id,
          siteId: config.site_id,
          userId: config.user_id,
          type: config.type,
          whenToShow: config.when_to_show,
          animation: config.animation,
          backgroundColor: config.background_color,
          headline: config.headline,
          headlineEnabled: config.headline_enabled,
          text: config.text,
          textEnabled: config.text_enabled,
          cancelButton: config.cancel_button,
          cancelBgColor: config.cancel_bg_color,
          cancelTextColor: config.cancel_text_color,
          approveButton: config.approve_button,
          approveBgColor: config.approve_bg_color,
          approveTextColor: config.approve_text_color,
          rePromptDelay: config.re_prompt_delay,
          isActive: config.is_active,
          createdAt: config.created_at,
          updatedAt: config.updated_at
        }
      });
    } else {
      // Si no existe configuración, devolver configuración por defecto
      const defaultConfig = {
        id: null,
        siteId: siteId || null,
        userId: userId,
        type: 'lightbox1',
        whenToShow: 'Show Immediately',
        animation: 'Drop-in',
        backgroundColor: '#ffffff',
        headline: '',
        headlineEnabled: false,
        text: 'Would you like to receive notifications on latest updates?',
        textEnabled: true,
        cancelButton: 'NOT YET',
        cancelBgColor: '#ffffff',
        cancelTextColor: '#000000',
        approveButton: 'YES',
        approveBgColor: '#2563eb',
        approveTextColor: '#ffffff',
        rePromptDelay: '0',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      res.json({
        success: true,
        data: defaultConfig
      });
    }
  } catch (error) {
    console.error('Error fetching opt-in config:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_CONFIG_ERROR',
        message: 'Error al obtener configuración de opt-in'
      }
    });
  }
});

/**
 * @route POST /optins
 * @desc Crear o actualizar configuración de opt-in prompt
 * @access Private
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      siteId,
      type,
      whenToShow,
      animation,
      backgroundColor,
      headline,
      headlineEnabled,
      text,
      textEnabled,
      cancelButton,
      cancelBgColor,
      cancelTextColor,
      approveButton,
      approveBgColor,
      approveTextColor,
      rePromptDelay
    } = req.body;

    // Validaciones básicas
    if (!type || !['lightbox1', 'lightbox2', 'bellIcon'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TYPE',
          message: 'Tipo de opt-in inválido'
        }
      });
    }

    if (!whenToShow || !['Show Immediately', 'After 5 seconds', 'On exit intent'].includes(whenToShow)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_WHEN_TO_SHOW',
          message: 'Configuración de cuándo mostrar inválida'
        }
      });
    }

    // Verificar si ya existe una configuración para este usuario/sitio
    const { pool } = req.app.locals;
    let existingQuery = `
      SELECT id FROM optin_configurations 
      WHERE user_id = $1
    `;
    const existingParams = [req.user.id];

    if (siteId) {
      // Verificar que el sitio pertenece al usuario
      const siteCheck = await pool.query(
        'SELECT id FROM sites WHERE id = $1 AND user_id = $2',
        [siteId, req.user.id]
      );

      if (siteCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'SITE_ACCESS_DENIED',
            message: 'No tienes permisos para este sitio'
          }
        });
      }

      existingQuery += ` AND site_id = $2`;
      existingParams.push(siteId);
    } else {
      existingQuery += ` AND site_id IS NULL`;
    }

    const existingResult = await pool.query(existingQuery, existingParams);

    let result;
    if (existingResult.rows.length > 0) {
      // Actualizar configuración existente
      const updateQuery = `
        UPDATE optin_configurations 
        SET type = $1, when_to_show = $2, animation = $3, background_color = $4,
            headline = $5, headline_enabled = $6, text = $7, text_enabled = $8,
            cancel_button = $9, cancel_bg_color = $10, cancel_text_color = $11,
            approve_button = $12, approve_bg_color = $13, approve_text_color = $14,
            re_prompt_delay = $15, updated_at = NOW()
        WHERE id = $16
        RETURNING *
      `;

      result = await pool.query(updateQuery, [
        type,
        whenToShow,
        animation || 'Drop-in',
        backgroundColor || '#ffffff',
        headline || '',
        headlineEnabled || false,
        text || 'Would you like to receive notifications on latest updates?',
        textEnabled !== undefined ? textEnabled : true,
        cancelButton || 'NOT YET',
        cancelBgColor || '#ffffff',
        cancelTextColor || '#000000',
        approveButton || 'YES',
        approveBgColor || '#2563eb',
        approveTextColor || '#ffffff',
        rePromptDelay || '0',
        existingResult.rows[0].id
      ]);
    } else {
      // Crear nueva configuración
      const insertQuery = `
        INSERT INTO optin_configurations (
          user_id, site_id, type, when_to_show, animation, background_color,
          headline, headline_enabled, text, text_enabled, cancel_button,
          cancel_bg_color, cancel_text_color, approve_button, approve_bg_color,
          approve_text_color, re_prompt_delay
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        RETURNING *
      `;

      result = await pool.query(insertQuery, [
        req.user.id,
        siteId || null,
        type,
        whenToShow,
        animation || 'Drop-in',
        backgroundColor || '#ffffff',
        headline || '',
        headlineEnabled || false,
        text || 'Would you like to receive notifications on latest updates?',
        textEnabled !== undefined ? textEnabled : true,
        cancelButton || 'NOT YET',
        cancelBgColor || '#ffffff',
        cancelTextColor || '#000000',
        approveButton || 'YES',
        approveBgColor || '#2563eb',
        approveTextColor || '#ffffff',
        rePromptDelay || '0'
      ]);
    }

    const savedConfig = result.rows[0];

    res.status(201).json({
      success: true,
      message: 'Configuración de opt-in guardada exitosamente',
      data: {
        id: savedConfig.id,
        siteId: savedConfig.site_id,
        userId: savedConfig.user_id,
        type: savedConfig.type,
        whenToShow: savedConfig.when_to_show,
        animation: savedConfig.animation,
        backgroundColor: savedConfig.background_color,
        headline: savedConfig.headline,
        headlineEnabled: savedConfig.headline_enabled,
        text: savedConfig.text,
        textEnabled: savedConfig.text_enabled,
        cancelButton: savedConfig.cancel_button,
        cancelBgColor: savedConfig.cancel_bg_color,
        cancelTextColor: savedConfig.cancel_text_color,
        approveButton: savedConfig.approve_button,
        approveBgColor: savedConfig.approve_bg_color,
        approveTextColor: savedConfig.approve_text_color,
        rePromptDelay: savedConfig.re_prompt_delay,
        isActive: savedConfig.is_active,
        createdAt: savedConfig.created_at,
        updatedAt: savedConfig.updated_at
      }
    });
  } catch (error) {
    console.error('Error saving opt-in config:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SAVE_CONFIG_ERROR',
        message: 'Error al guardar configuración de opt-in'
      }
    });
  }
});

/**
 * @route GET /optins/:id
 * @desc Obtener configuración específica de opt-in prompt
 * @access Private
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { pool } = req.app.locals;
    const configId = parseInt(req.params.id);
    const userId = req.user.id;

    if (isNaN(configId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CONFIG_ID',
          message: 'ID de configuración inválido'
        }
      });
    }

    // Buscar configuración en base de datos
    const result = await pool.query(
      'SELECT * FROM optin_configurations WHERE id = $1 AND user_id = $2',
      [configId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CONFIG_NOT_FOUND',
          message: 'Configuración no encontrada'
        }
      });
    }

    const config = result.rows[0];

    res.json({
      success: true,
      data: {
        id: config.id,
        siteId: config.site_id,
        userId: config.user_id,
        type: config.type,
        whenToShow: config.when_to_show,
        animation: config.animation,
        backgroundColor: config.background_color,
        headline: config.headline,
        headlineEnabled: config.headline_enabled,
        text: config.text,
        textEnabled: config.text_enabled,
        cancelButton: config.cancel_button,
        cancelBgColor: config.cancel_bg_color,
        cancelTextColor: config.cancel_text_color,
        approveButton: config.approve_button,
        approveBgColor: config.approve_bg_color,
        approveTextColor: config.approve_text_color,
        rePromptDelay: config.re_prompt_delay,
        isActive: config.is_active,
        createdAt: config.created_at,
        updatedAt: config.updated_at
      }
    });
  } catch (error) {
    console.error('Error fetching opt-in config by ID:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_CONFIG_ERROR',
        message: 'Error al obtener configuración de opt-in'
      }
    });
  }
});

/**
 * @route PUT /optins/:id
 * @desc Actualizar configuración de opt-in prompt
 * @access Private
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const configId = req.params.id;
    const userId = req.user.id;
    const updates = req.body;

    // TODO: Actualizar en base de datos
    // Por ahora simulamos una actualización exitosa
    const updatedConfig = {
      id: configId,
      userId: userId,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      data: updatedConfig,
      message: 'Configuración de opt-in actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error updating opt-in config:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_CONFIG_ERROR',
        message: 'Error al actualizar configuración de opt-in'
      }
    });
  }
});

/**
 * @route DELETE /optins/:id
 * @desc Eliminar configuración de opt-in prompt
 * @access Private
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const configId = req.params.id;
    const userId = req.user.id;

    // TODO: Eliminar de base de datos
    // Por ahora simulamos eliminación exitosa
    res.json({
      success: true,
      message: 'Configuración de opt-in eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error deleting opt-in config:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_CONFIG_ERROR',
        message: 'Error al eliminar configuración de opt-in'
      }
    });
  }
});

/**
 * @route GET /optins/:id/code
 * @desc Generar código de integración para opt-in prompt
 * @access Private
 */
router.get('/:id/code', authenticateToken, async (req, res) => {
  try {
    const configId = req.params.id;
    const userId = req.user.id;
    const format = req.query.format || 'javascript'; // javascript, html, react

    // TODO: Obtener configuración real de la base de datos
    const config = {
      type: 'lightbox1',
      whenToShow: 'Show Immediately',
      animation: 'Drop-in',
      backgroundColor: '#ffffff',
      headline: 'Stay Updated!',
      text: 'Would you like to receive notifications on latest updates?',
      cancelButton: 'NOT YET',
      cancelBgColor: '#ffffff',
      cancelTextColor: '#000000',
      approveButton: 'YES',
      approveBgColor: '#2563eb',
      approveTextColor: '#ffffff',
      siteId: req.query.siteId
    };

    let code = '';

    switch (format) {
      case 'javascript':
        code = `<!-- PushSaaS Opt-in Prompt -->
<script>
(function() {
  var config = ${JSON.stringify(config, null, 2)};
  var script = document.createElement('script');
  script.src = '${process.env.API_BASE_URL || 'http://localhost:3000'}/pushsaas.js';
  script.onload = function() {
    if (window.PushSaaS) {
      window.PushSaaS.init(config);
    }
  };
  document.head.appendChild(script);
})();
</script>`;
        break;

      case 'html':
        code = `<!DOCTYPE html>
<!-- Agrega este código antes del cierre de </body> -->
<script src="${process.env.API_BASE_URL || 'http://localhost:3000'}/pushsaas.js"></script>
<script>
  window.PushSaaS.init(${JSON.stringify(config, null, 2)});
</script>`;
        break;

      case 'react':
        code = `// Instala: npm install use-script-tag
import { useScript } from 'use-script-tag';

function YourComponent() {
  const config = ${JSON.stringify(config, null, 2)};
  
  useScript('${process.env.API_BASE_URL || 'http://localhost:3000'}/pushsaas.js', {
    onLoad: () => {
      if (window.PushSaaS) {
        window.PushSaaS.init(config);
      }
    }
  });

  return (
    // Tu componente
  );
}`;
        break;

      default:
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_FORMAT',
            message: 'Formato de código inválido. Usa: javascript, html, o react'
          }
        });
    }

    res.json({
      success: true,
      data: {
        code,
        format,
        config
      }
    });
  } catch (error) {
    console.error('Error generating integration code:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CODE_GENERATION_ERROR',
        message: 'Error al generar código de integración'
      }
    });
  }
});

export default router;