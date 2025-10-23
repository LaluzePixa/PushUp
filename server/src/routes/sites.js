import express from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Validación de sitio
const validateSite = (data) => {
  const errors = [];

  if (!data.name?.trim()) errors.push('El nombre es requerido');
  if (!data.domain?.trim()) errors.push('El dominio es requerido');

  // Validar formato básico de dominio
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  if (data.domain && !domainRegex.test(data.domain.trim())) {
    errors.push('El formato del dominio no es válido');
  }

  return errors;
};

// GET /sites - Listar sitios del usuario
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { pool } = req.app.locals;
    const {
      page = 1,
      limit = 10,
      search,
      isActive
    } = req.query;

    let whereConditions = [`user_id = $1`];
    let queryParams = [req.user.id];
    let paramCounter = 2;

    // Para administradores, mostrar todos los sitios si se especifica
    if ((req.user.role === 'admin' || req.user.role === 'superadmin') && req.query.all === 'true') {
      whereConditions = [];
      queryParams = [];
      paramCounter = 1;
    }

    // Filtro por estado activo
    if (isActive !== undefined) {
      whereConditions.push(`is_active = $${paramCounter}`);
      queryParams.push(isActive === 'true');
      paramCounter++;
    }

    // Búsqueda por nombre o dominio
    if (search) {
      whereConditions.push(`(name ILIKE $${paramCounter} OR domain ILIKE $${paramCounter})`);
      queryParams.push(`%${search}%`);
      paramCounter++;
    }

    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

    // Contar total
    const countQuery = `SELECT COUNT(*) FROM sites ${whereClause}`;
    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].count);

    // Query principal con paginación
    // OPTIMIZATION: Use LEFT JOIN with GROUP BY instead of subqueries
    // This prevents N+1 query problem (was 2*N+1 queries, now just 1)
    const offset = (page - 1) * limit;
    const sitesQuery = `
      SELECT s.*,
             COALESCE(COUNT(DISTINCT sub.id), 0) as subscribers_count,
             COALESCE(COUNT(DISTINCT c.id), 0) as campaigns_count
      FROM sites s
      LEFT JOIN subscriptions sub ON s.id = sub.site_id
      LEFT JOIN campaigns c ON s.id = c.site_id
      ${whereClause}
      GROUP BY s.id
      ORDER BY s.created_at DESC
      LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
    `;

    const sitesResult = await pool.query(sitesQuery, [
      ...queryParams,
      parseInt(limit),
      offset
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        sites: sitesResult.rows.map(site => ({
          id: site.id,
          name: site.name,
          domain: site.domain,
          description: site.description,
          isActive: site.is_active,
          subscribersCount: parseInt(site.subscribers_count),
          campaignsCount: parseInt(site.campaigns_count),
          createdAt: site.created_at,
          updatedAt: site.updated_at
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
    console.error('[Sites List Error]', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// POST /sites - Crear nuevo sitio
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { pool } = req.app.locals;
    const { name, domain, description } = req.body;

    // Validar datos
    const validationErrors = validateSite({ name, domain });

    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Datos de sitio inválidos',
        code: 'VALIDATION_ERROR',
        details: validationErrors
      });
    }

    // Verificar que el dominio no esté en uso por el mismo usuario
    const domainCheck = await pool.query(
      'SELECT id FROM sites WHERE domain = $1 AND user_id = $2',
      [domain.trim().toLowerCase(), req.user.id]
    );

    if (domainCheck.rows.length > 0) {
      return res.status(409).json({
        error: 'Ya tienes un sitio registrado con este dominio',
        code: 'DOMAIN_EXISTS'
      });
    }

    // Limitar número de sitios para usuarios no-admin
    if (req.user.role === 'user') {
      const userSitesCount = await pool.query(
        'SELECT COUNT(*) FROM sites WHERE user_id = $1',
        [req.user.id]
      );

      const maxSites = 5; // Límite para usuarios regulares
      if (parseInt(userSitesCount.rows[0].count) >= maxSites) {
        return res.status(403).json({
          error: `Los usuarios regulares pueden tener máximo ${maxSites} sitios`,
          code: 'SITES_LIMIT_EXCEEDED'
        });
      }
    }

    // Crear sitio
    const siteResult = await pool.query(
      `INSERT INTO sites (user_id, name, domain, description, is_active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        req.user.id,
        name.trim(),
        domain.trim().toLowerCase(),
        description?.trim() || null,
        true
      ]
    );

    const site = siteResult.rows[0];

    res.status(201).json({
      success: true,
      message: 'Sitio creado exitosamente',
      data: {
        id: site.id,
        name: site.name,
        domain: site.domain,
        description: site.description,
        isActive: site.is_active,
        subscribersCount: 0,
        campaignsCount: 0,
        createdAt: site.created_at,
        updatedAt: site.updated_at
      }
    });

  } catch (error) {
    console.error('[Site Create Error]', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// GET /sites/:id - Obtener sitio específico
router.get('/:id', authenticateToken, authorizeRoles('admin', 'superadmin'), async (req, res) => {
  try {
    const { pool } = req.app.locals;
    const siteId = parseInt(req.params.id);

    if (isNaN(siteId)) {
      return res.status(400).json({
        error: 'ID de sitio inválido',
        code: 'INVALID_SITE_ID'
      });
    }

    // OPTIMIZATION: Use LEFT JOIN instead of subqueries for consistency
    const siteResult = await pool.query(
      `SELECT s.*,
              COALESCE(COUNT(DISTINCT sub.id), 0) as subscribers_count,
              COALESCE(COUNT(DISTINCT c.id), 0) as campaigns_count
       FROM sites s
       LEFT JOIN subscriptions sub ON s.id = sub.site_id
       LEFT JOIN campaigns c ON s.id = c.site_id
       WHERE s.id = $1 AND s.user_id = $2
       GROUP BY s.id`,
      [siteId, req.user.id]
    );

    if (siteResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Sitio no encontrado',
        code: 'SITE_NOT_FOUND'
      });
    }

    const site = siteResult.rows[0];

    res.json({
      site: {
        id: site.id,
        name: site.name,
        domain: site.domain,
        description: site.description,
        isActive: site.is_active,
        subscribersCount: parseInt(site.subscribers_count),
        campaignsCount: parseInt(site.campaigns_count),
        createdAt: site.created_at,
        updatedAt: site.updated_at
      }
    });

  } catch (error) {
    console.error('[Site Get Error]', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// PUT /sites/:id - Actualizar sitio
router.put('/:id', authenticateToken, authorizeRoles('admin', 'superadmin'), async (req, res) => {
  try {
    const { pool } = req.app.locals;
    const siteId = parseInt(req.params.id);
    const { name, domain, description, isActive } = req.body;

    if (isNaN(siteId)) {
      return res.status(400).json({
        error: 'ID de sitio inválido',
        code: 'INVALID_SITE_ID'
      });
    }

    // Validar datos
    const validationErrors = validateSite({ name, domain });

    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Datos de sitio inválidos',
        code: 'VALIDATION_ERROR',
        details: validationErrors
      });
    }

    // Verificar que el sitio existe y pertenece al usuario
    const siteCheck = await pool.query(
      'SELECT id, domain FROM sites WHERE id = $1 AND user_id = $2',
      [siteId, req.user.id]
    );

    if (siteCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'Sitio no encontrado',
        code: 'SITE_NOT_FOUND'
      });
    }

    const currentSite = siteCheck.rows[0];

    // Verificar que el dominio no esté en uso por otro sitio del mismo usuario
    if (domain.trim().toLowerCase() !== currentSite.domain) {
      const domainCheck = await pool.query(
        'SELECT id FROM sites WHERE domain = $1 AND user_id = $2 AND id != $3',
        [domain.trim().toLowerCase(), req.user.id, siteId]
      );

      if (domainCheck.rows.length > 0) {
        return res.status(409).json({
          error: 'Ya tienes un sitio registrado con este dominio',
          code: 'DOMAIN_EXISTS'
        });
      }
    }

    // Actualizar sitio
    const updateResult = await pool.query(
      `UPDATE sites 
       SET name = $1, domain = $2, description = $3, is_active = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [
        name.trim(),
        domain.trim().toLowerCase(),
        description?.trim() || null,
        isActive !== undefined ? isActive : true,
        siteId
      ]
    );

    const updatedSite = updateResult.rows[0];

    res.json({
      message: 'Sitio actualizado exitosamente',
      site: {
        id: updatedSite.id,
        name: updatedSite.name,
        domain: updatedSite.domain,
        description: updatedSite.description,
        isActive: updatedSite.is_active,
        updatedAt: updatedSite.updated_at
      }
    });

  } catch (error) {
    console.error('[Site Update Error]', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// DELETE /sites/:id - Eliminar sitio
router.delete('/:id', authenticateToken, authorizeRoles('admin', 'superadmin'), async (req, res) => {
  try {
    const { pool } = req.app.locals;
    const siteId = parseInt(req.params.id);

    if (isNaN(siteId)) {
      return res.status(400).json({
        error: 'ID de sitio inválido',
        code: 'INVALID_SITE_ID'
      });
    }

    // Verificar que el sitio existe y pertenece al usuario
    const siteCheck = await pool.query(
      'SELECT id, name, domain FROM sites WHERE id = $1 AND user_id = $2',
      [siteId, req.user.id]
    );

    if (siteCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'Sitio no encontrado',
        code: 'SITE_NOT_FOUND'
      });
    }

    const site = siteCheck.rows[0];

    // Verificar si hay suscripciones activas
    const subscriptionsCheck = await pool.query(
      'SELECT COUNT(*) FROM subscriptions WHERE site_id = $1',
      [siteId]
    );

    const subscriptionsCount = parseInt(subscriptionsCheck.rows[0].count);

    if (subscriptionsCount > 0) {
      return res.status(400).json({
        error: `No se puede eliminar el sitio porque tiene ${subscriptionsCount} suscripciones activas`,
        code: 'SITE_HAS_SUBSCRIPTIONS',
        subscriptionsCount
      });
    }

    // Eliminar sitio (las campañas y segmentos se actualizarán a NULL por FK)
    await pool.query('DELETE FROM sites WHERE id = $1', [siteId]);

    res.json({
      message: 'Sitio eliminado exitosamente',
      deletedSite: {
        id: siteId,
        name: site.name,
        domain: site.domain
      }
    });

  } catch (error) {
    console.error('[Site Delete Error]', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// GET /sites/:id/subscriptions - Obtener suscripciones de un sitio
router.get('/:id/subscriptions', authenticateToken, authorizeRoles('admin', 'superadmin'), async (req, res) => {
  try {
    const { pool } = req.app.locals;
    const siteId = parseInt(req.params.id);
    const { page = 1, limit = 10 } = req.query;

    if (isNaN(siteId)) {
      return res.status(400).json({
        error: 'ID de sitio inválido',
        code: 'INVALID_SITE_ID'
      });
    }

    // Verificar que el sitio pertenece al usuario
    const siteCheck = await pool.query(
      'SELECT id, name FROM sites WHERE id = $1 AND user_id = $2',
      [siteId, req.user.id]
    );

    if (siteCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'Sitio no encontrado',
        code: 'SITE_NOT_FOUND'
      });
    }

    const offset = (page - 1) * limit;

    const subscriptionsResult = await pool.query(
      `SELECT id, endpoint, user_agent, ip, created_at, updated_at
       FROM subscriptions 
       WHERE site_id = $1 
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [siteId, parseInt(limit), offset]
    );

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM subscriptions WHERE site_id = $1',
      [siteId]
    );

    const total = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(total / limit);

    res.json({
      site: siteCheck.rows[0],
      subscriptions: subscriptionsResult.rows.map(sub => ({
        id: sub.id,
        endpoint: sub.endpoint.substring(0, 50) + '...',
        userAgent: sub.user_agent,
        ip: sub.ip,
        createdAt: sub.created_at,
        updatedAt: sub.updated_at
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('[Site Subscriptions Error]', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

export default router;
