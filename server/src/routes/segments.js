import express from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import logger from '../config/logger.js';
import { sanitizeForLike } from '../utils/sanitize.js';
import { validateSegmentData, SEGMENT_LIMITS } from '../types/segmentConditions.js';

const router = express.Router();

// Validación de segmento (usa el validador tipado)
const validateSegment = (data) => {
  return validateSegmentData(data);
};

/**
 * Evalúa si una suscripción cumple con las condiciones del segmento
 * Soporta múltiples tipos de condiciones con operadores flexibles
 * 
 * @param {Object} subscription - Objeto de suscripción con todos los campos
 * @param {Object} conditions - Objeto de condiciones del segmento
 * @returns {boolean} - true si cumple todas las condiciones (AND lógico)
 */
const evaluateSegmentConditions = (subscription, conditions) => {
  if (!conditions || Object.keys(conditions).length === 0) {
    return true; // Sin condiciones = incluir todos
  }

  // Evaluar condiciones por campo (AND lógico entre campos)
  for (const [field, condition] of Object.entries(conditions)) {
    let fieldMatch = false;

    switch (field) {
      case 'userAgent': {
        const userAgent = subscription.user_agent?.toLowerCase() || '';

        if (condition.equals !== undefined) {
          fieldMatch = userAgent === condition.equals.toLowerCase();
        } else if (condition.notEquals !== undefined) {
          fieldMatch = userAgent !== condition.notEquals.toLowerCase();
        } else if (condition.contains !== undefined) {
          fieldMatch = userAgent.includes(condition.contains.toLowerCase());
        } else if (condition.notContains !== undefined) {
          fieldMatch = !userAgent.includes(condition.notContains.toLowerCase());
        } else if (condition.in !== undefined) {
          fieldMatch = condition.in.some(val => userAgent.includes(val.toLowerCase()));
        } else if (condition.notIn !== undefined) {
          fieldMatch = !condition.notIn.some(val => userAgent.includes(val.toLowerCase()));
        }

        if (!fieldMatch) return false;
        break;
      }

      case 'createdAt': {
        const createdAt = new Date(subscription.created_at);

        if (condition.after !== undefined) {
          fieldMatch = createdAt > new Date(condition.after);
        } else if (condition.before !== undefined) {
          fieldMatch = createdAt < new Date(condition.before);
        } else if (condition.between !== undefined && Array.isArray(condition.between)) {
          const [start, end] = condition.between;
          fieldMatch = createdAt >= new Date(start) && createdAt <= new Date(end);
        }

        if (!fieldMatch) return false;
        break;
      }

      case 'siteId': {
        const siteId = subscription.site_id;

        if (condition.equals !== undefined) {
          fieldMatch = siteId === condition.equals;
        } else if (condition.notEquals !== undefined) {
          fieldMatch = siteId !== condition.notEquals;
        } else if (condition.in !== undefined) {
          fieldMatch = condition.in.includes(siteId);
        } else if (condition.notIn !== undefined) {
          fieldMatch = !condition.notIn.includes(siteId);
        }

        if (!fieldMatch) return false;
        break;
      }

      case 'country': {
        const country = subscription.country?.toLowerCase() || '';

        if (condition.equals !== undefined) {
          fieldMatch = country === condition.equals.toLowerCase();
        } else if (condition.notEquals !== undefined) {
          fieldMatch = country !== condition.notEquals.toLowerCase();
        } else if (condition.in !== undefined) {
          fieldMatch = condition.in.some(val => country === val.toLowerCase());
        } else if (condition.notIn !== undefined) {
          fieldMatch = !condition.notIn.some(val => country === val.toLowerCase());
        }

        if (!fieldMatch) return false;
        break;
      }

      case 'state': {
        const state = subscription.state?.toLowerCase() || '';

        if (condition.equals !== undefined) {
          fieldMatch = state === condition.equals.toLowerCase();
        } else if (condition.notEquals !== undefined) {
          fieldMatch = state !== condition.notEquals.toLowerCase();
        } else if (condition.in !== undefined) {
          fieldMatch = condition.in.some(val => state === val.toLowerCase());
        } else if (condition.notIn !== undefined) {
          fieldMatch = !condition.notIn.some(val => state === val.toLowerCase());
        }

        if (!fieldMatch) return false;
        break;
      }

      case 'city': {
        const city = subscription.city?.toLowerCase() || '';

        if (condition.equals !== undefined) {
          fieldMatch = city === condition.equals.toLowerCase();
        } else if (condition.notEquals !== undefined) {
          fieldMatch = city !== condition.notEquals.toLowerCase();
        } else if (condition.in !== undefined) {
          fieldMatch = condition.in.some(val => city === val.toLowerCase());
        } else if (condition.notIn !== undefined) {
          fieldMatch = !condition.notIn.some(val => city === val.toLowerCase());
        }

        if (!fieldMatch) return false;
        break;
      }

      default:
        // Campo no reconocido, log warning pero no falla
        logger.warn(`Campo de condición desconocido: ${field}`);
        break;
    }
  }

  return true; // Todas las condiciones cumplidas
};

// GET /segments - Listar segmentos
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { pool } = req.app.locals;
    const {
      page = 1,
      limit = 10,
      siteId,
      search
    } = req.query;

    const isAdmin = req.user.role === 'admin' || req.user.role === 'superadmin';

    let whereConditions = [];
    let queryParams = [];
    let paramCounter = 1;

    // Si no es admin, solo puede ver sus propios segmentos
    if (!isAdmin) {
      whereConditions.push(`user_id = $${paramCounter}`);
      queryParams.push(req.user.id);
      paramCounter++;
    } else {
      // Para admins: filtro opcional por user_id si se especifica
      if (req.query.userId) {
        whereConditions.push(`user_id = $${paramCounter}`);
        queryParams.push(req.query.userId);
        paramCounter++;
      }
    }

    // Filtro por sitio
    if (siteId) {
      whereConditions.push(`site_id = $${paramCounter}`);
      queryParams.push(siteId);
      paramCounter++;
    }

    // Búsqueda por nombre
    if (search) {
      const sanitized = sanitizeForLike(search);
      whereConditions.push(`name ILIKE $${paramCounter}`);
      queryParams.push(`%${sanitized}%`);
      paramCounter++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Contar total
    const countQuery = `SELECT COUNT(*) FROM audience_segments ${whereClause}`;
    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].count);

    // Query principal con paginación
    const offset = (page - 1) * limit;
    const segmentsQuery = `
      SELECT * FROM audience_segments
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
    `;

    const segmentsResult = await pool.query(segmentsQuery, [
      ...queryParams,
      parseInt(limit),
      offset
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        segments: segmentsResult.rows.map(segment => ({
          id: segment.id,
          name: segment.name,
          description: segment.description,
          siteId: segment.site_id,
          conditions: segment.conditions,
          createdAt: segment.created_at,
          updatedAt: segment.updated_at
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    logger.error({ err: error }, 'Segments list error');
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error interno del servidor'
      }
    });
  }
});

// POST /segments - Crear nuevo segmento
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { pool } = req.app.locals;
    const {
      name,
      description,
      siteId,
      conditions,
      maxSize
    } = req.body;

    // Validar que el sitio pertenece al usuario (si se especifica)
    if (siteId) {
      const siteCheck = await pool.query(
        'SELECT id FROM sites WHERE id = $1 AND user_id = $2',
        [siteId, req.user.id]
      );

      if (siteCheck.rows.length === 0) {
        return res.status(403).json({
          error: 'No tienes permisos para crear segmentos en este sitio',
          code: 'SITE_ACCESS_DENIED'
        });
      }
    }

    // Aplicar default o valor recibido para max_size
    const finalMaxSize = maxSize !== undefined ? maxSize : SEGMENT_LIMITS.DEFAULT_MAX_SIZE;

    // Validar datos con el nuevo validador
    const validationErrors = validateSegment({
      name,
      conditions,
      max_size: finalMaxSize
    });

    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Datos de segmento inválidos',
        code: 'VALIDATION_ERROR',
        details: validationErrors
      });
    }

    // Crear segmento con max_size
    const segmentResult = await pool.query(
      `INSERT INTO audience_segments (user_id, site_id, name, description, conditions, max_size)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        req.user.id,
        siteId || null,
        name.trim(),
        description?.trim() || null,
        JSON.stringify(conditions),
        finalMaxSize
      ]
    );

    const segment = segmentResult.rows[0];

    res.status(201).json({
      success: true,
      message: 'Segmento creado exitosamente',
      data: {
        id: segment.id,
        name: segment.name,
        description: segment.description,
        siteId: segment.site_id,
        conditions: segment.conditions,
        maxSize: segment.max_size,
        createdAt: segment.created_at
      }
    });

  } catch (error) {
    logger.error({ err: error }, 'Segment create error');
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error interno del servidor'
      }
    });
  }
});

// GET /segments/:id - Obtener segmento específico
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { pool } = req.app.locals;
    const segmentId = parseInt(req.params.id);

    if (isNaN(segmentId)) {
      return res.status(400).json({
        error: 'ID de segmento inválido',
        code: 'INVALID_SEGMENT_ID'
      });
    }

    // Verificar que el segmento pertenece al usuario
    const segmentResult = await pool.query(
      'SELECT * FROM audience_segments WHERE id = $1 AND user_id = $2',
      [segmentId, req.user.id]
    );

    if (segmentResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Segmento no encontrado',
        code: 'SEGMENT_NOT_FOUND'
      });
    }

    const segment = segmentResult.rows[0];

    res.json({
      segment: {
        id: segment.id,
        name: segment.name,
        description: segment.description,
        siteId: segment.site_id,
        conditions: segment.conditions,
        createdAt: segment.created_at,
        updatedAt: segment.updated_at
      }
    });

  } catch (error) {
    logger.error({ err: error }, 'Segment get error');
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// PUT /segments/:id - Actualizar segmento
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { pool } = req.app.locals;
    const segmentId = parseInt(req.params.id);

    if (isNaN(segmentId)) {
      return res.status(400).json({
        error: 'ID de segmento inválido',
        code: 'INVALID_SEGMENT_ID'
      });
    }

    // Verificar que el segmento pertenece al usuario
    const ownershipCheck = await pool.query(
      'SELECT id FROM audience_segments WHERE id = $1 AND user_id = $2',
      [segmentId, req.user.id]
    );

    if (ownershipCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'Segmento no encontrado o no tienes permisos para editarlo',
        code: 'SEGMENT_NOT_FOUND'
      });
    }

    const {
      name,
      description,
      siteId,
      conditions
    } = req.body;

    // Validar que el sitio pertenece al usuario (si se especifica)
    if (siteId) {
      const siteCheck = await pool.query(
        'SELECT id FROM sites WHERE id = $1 AND user_id = $2',
        [siteId, req.user.id]
      );

      if (siteCheck.rows.length === 0) {
        return res.status(403).json({
          error: 'No tienes permisos para asignar este sitio',
          code: 'SITE_ACCESS_DENIED'
        });
      }
    }

    // Validar datos
    const validationErrors = validateSegment({
      name,
      conditions
    });

    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Datos de segmento inválidos',
        code: 'VALIDATION_ERROR',
        details: validationErrors
      });
    }

    // Verificar que el segmento existe
    const segmentCheck = await pool.query(
      'SELECT id FROM audience_segments WHERE id = $1 AND user_id = $2',
      [segmentId, req.user.id]
    );

    if (segmentCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'Segmento no encontrado',
        code: 'SEGMENT_NOT_FOUND'
      });
    }

    // Actualizar segmento
    const updateResult = await pool.query(
      `UPDATE audience_segments 
       SET name = $1, description = $2, site_id = $3, conditions = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [
        name.trim(),
        description?.trim() || null,
        siteId || null,
        JSON.stringify(conditions),
        segmentId
      ]
    );

    const updatedSegment = updateResult.rows[0];

    res.json({
      message: 'Segmento actualizado exitosamente',
      segment: {
        id: updatedSegment.id,
        name: updatedSegment.name,
        description: updatedSegment.description,
        siteId: updatedSegment.site_id,
        conditions: updatedSegment.conditions,
        updatedAt: updatedSegment.updated_at
      }
    });

  } catch (error) {
    logger.error({ err: error }, 'Segment update error');
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// DELETE /segments/:id - Eliminar segmento
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { pool } = req.app.locals;
    const segmentId = parseInt(req.params.id);

    if (isNaN(segmentId)) {
      return res.status(400).json({
        error: 'ID de segmento inválido',
        code: 'INVALID_SEGMENT_ID'
      });
    }

    // Verificar que el segmento pertenece al usuario
    const ownershipCheck = await pool.query(
      'SELECT id FROM audience_segments WHERE id = $1 AND user_id = $2',
      [segmentId, req.user.id]
    );

    if (ownershipCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'Segmento no encontrado o no tienes permisos para eliminarlo',
        code: 'SEGMENT_NOT_FOUND'
      });
    }

    // Verificar que el segmento existe
    const segmentCheck = await pool.query(
      'SELECT id, name FROM audience_segments WHERE id = $1 AND user_id = $2',
      [segmentId, req.user.id]
    );

    if (segmentCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'Segmento no encontrado',
        code: 'SEGMENT_NOT_FOUND'
      });
    }

    const segment = segmentCheck.rows[0];

    // Eliminar segmento
    await pool.query('DELETE FROM audience_segments WHERE id = $1', [segmentId]);

    res.json({
      message: 'Segmento eliminado exitosamente',
      deletedSegment: {
        id: segmentId,
        name: segment.name
      }
    });

  } catch (error) {
    logger.error({ err: error }, 'Segment delete error');
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// POST /segments/:id/preview - Previsualizar suscripciones que coinciden con el segmento
router.post('/:id/preview', authenticateToken, authorizeRoles('admin', 'superadmin'), async (req, res) => {
  try {
    const { pool } = req.app.locals;
    const segmentId = parseInt(req.params.id);
    const { limit = 10 } = req.body;

    if (isNaN(segmentId)) {
      return res.status(400).json({
        error: 'ID de segmento inválido',
        code: 'INVALID_SEGMENT_ID'
      });
    }

    // Obtener segmento
    const segmentResult = await pool.query(
      'SELECT * FROM audience_segments WHERE id = $1 AND user_id = $2',
      [segmentId, req.user.id]
    );

    if (segmentResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Segmento no encontrado',
        code: 'SEGMENT_NOT_FOUND'
      });
    }

    const segment = segmentResult.rows[0];

    // Obtener todas las suscripciones para filtrar
    let whereConditions = [];
    let queryParams = [];
    let paramCounter = 1;

    // Filtrar por sitio si está especificado en el segmento
    if (segment.site_id) {
      whereConditions.push(`site_id = $${paramCounter}`);
      queryParams.push(segment.site_id);
      paramCounter++;
    }

    const whereClause = whereConditions.length > 0 ?
      `WHERE ${whereConditions.join(' AND ')}` : '';

    const subscriptionsQuery = `
      SELECT id, endpoint, user_agent, ip, site_id, created_at, updated_at
      FROM subscriptions 
      ${whereClause}
      ORDER BY created_at DESC
    `;

    const subscriptionsResult = await pool.query(subscriptionsQuery, queryParams);
    const allSubscriptions = subscriptionsResult.rows;

    // Filtrar suscripciones usando las condiciones del segmento
    const matchingSubscriptions = allSubscriptions.filter(subscription =>
      evaluateSegmentConditions(subscription, segment.conditions)
    );

    // Limitar resultados para la preview
    const previewSubscriptions = matchingSubscriptions.slice(0, limit);

    res.json({
      segment: {
        id: segment.id,
        name: segment.name,
        conditions: segment.conditions
      },
      preview: {
        totalMatching: matchingSubscriptions.length,
        totalAvailable: allSubscriptions.length,
        subscriptions: previewSubscriptions.map(sub => ({
          id: sub.id,
          endpoint: sub.endpoint.substring(0, 50) + '...',
          userAgent: sub.user_agent,
          ip: sub.ip,
          siteId: sub.site_id,
          createdAt: sub.created_at
        }))
      }
    });

  } catch (error) {
    logger.error({ err: error }, 'Segment preview error');
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// POST /segments/preview - Previsualizar suscripciones con condiciones temporales
router.post('/preview', authenticateToken, authorizeRoles('admin', 'superadmin'), async (req, res) => {
  try {
    const { pool } = req.app.locals;
    const { conditions, siteId, limit = 10 } = req.body;

    if (!conditions || typeof conditions !== 'object') {
      return res.status(400).json({
        error: 'Las condiciones son requeridas',
        code: 'VALIDATION_ERROR'
      });
    }

    // Obtener suscripciones para filtrar
    let whereConditions = [];
    let queryParams = [];
    let paramCounter = 1;

    if (siteId) {
      whereConditions.push(`site_id = $${paramCounter}`);
      queryParams.push(siteId);
      paramCounter++;
    }

    const whereClause = whereConditions.length > 0 ?
      `WHERE ${whereConditions.join(' AND ')}` : '';

    const subscriptionsQuery = `
      SELECT id, endpoint, user_agent, ip, site_id, created_at, updated_at
      FROM subscriptions 
      ${whereClause}
      ORDER BY created_at DESC
    `;

    const subscriptionsResult = await pool.query(subscriptionsQuery, queryParams);
    const allSubscriptions = subscriptionsResult.rows;

    // Filtrar suscripciones usando las condiciones proporcionadas
    const matchingSubscriptions = allSubscriptions.filter(subscription =>
      evaluateSegmentConditions(subscription, conditions)
    );

    // Limitar resultados para la preview
    const previewSubscriptions = matchingSubscriptions.slice(0, limit);

    res.json({
      preview: {
        totalMatching: matchingSubscriptions.length,
        totalAvailable: allSubscriptions.length,
        subscriptions: previewSubscriptions.map(sub => ({
          id: sub.id,
          endpoint: sub.endpoint.substring(0, 50) + '...',
          userAgent: sub.user_agent,
          ip: sub.ip,
          siteId: sub.site_id,
          createdAt: sub.created_at
        }))
      }
    });

  } catch (error) {
    logger.error({ err: error }, 'Segment preview error');
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

export { evaluateSegmentConditions };
export default router;
