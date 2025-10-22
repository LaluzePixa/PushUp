import express from 'express';
import { authenticateToken, authorizeRoles, authorizeOwnerOrAdmin, hashPassword } from '../middleware/auth.js';

const router = express.Router();

// Validación de email
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// GET /users - Listar usuarios (solo admins y superadmins)
router.get('/', authenticateToken, authorizeRoles('admin', 'superadmin'), async (req, res) => {
  try {
    const { pool } = req.app.locals;
    const { 
      page = 1, 
      limit = 10, 
      role, 
      search,
      isActive 
    } = req.query;

    // Construir query dinámicamente
    let whereConditions = [];
    let queryParams = [];
    let paramCounter = 1;

    // Filtro por rol
    if (role && ['user', 'admin', 'superadmin'].includes(role)) {
      whereConditions.push(`role = $${paramCounter}`);
      queryParams.push(role);
      paramCounter++;
    }

    // Filtro por estado activo
    if (isActive !== undefined) {
      whereConditions.push(`is_active = $${paramCounter}`);
      queryParams.push(isActive === 'true');
      paramCounter++;
    }

    // Búsqueda por email
    if (search) {
      whereConditions.push(`email ILIKE $${paramCounter}`);
      queryParams.push(`%${search}%`);
      paramCounter++;
    }

    const whereClause = whereConditions.length > 0 ? 
      `WHERE ${whereConditions.join(' AND ')}` : '';

    // Query para contar total
    const countQuery = `SELECT COUNT(*) FROM users ${whereClause}`;
    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].count);

    // Query principal con paginación
    const offset = (page - 1) * limit;
    const usersQuery = `
      SELECT id, email, role, is_active, created_at, updated_at 
      FROM users 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
    `;
    
    const usersResult = await pool.query(usersQuery, [
      ...queryParams, 
      parseInt(limit), 
      offset
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      users: usersResult.rows.map(user => ({
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.is_active,
        createdAt: user.created_at,
        updatedAt: user.updated_at
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
    console.error('[Users List Error]', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// GET /users/:id - Obtener usuario específico
router.get('/:id', authenticateToken, authorizeOwnerOrAdmin, async (req, res) => {
  try {
    const { pool } = req.app.locals;
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
      return res.status(400).json({
        error: 'ID de usuario inválido',
        code: 'INVALID_USER_ID'
      });
    }

    const result = await pool.query(
      `SELECT id, email, role, is_active, created_at, updated_at 
       FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        code: 'USER_NOT_FOUND'
      });
    }

    const user = result.rows[0];

    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.is_active,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }
    });

  } catch (error) {
    console.error('[User Get Error]', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// PUT /users/:id - Actualizar usuario
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { pool } = req.app.locals;
    const userId = parseInt(req.params.id);
    const { email, role, isActive } = req.body;

    if (isNaN(userId)) {
      return res.status(400).json({
        error: 'ID de usuario inválido',
        code: 'INVALID_USER_ID'
      });
    }

    // Verificar permisos
    const isOwner = req.user.id === userId;
    const isAdmin = ['admin', 'superadmin'].includes(req.user.role);
    const isSuperAdmin = req.user.role === 'superadmin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        error: 'No tienes permisos para actualizar este usuario',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    // Obtener usuario actual
    const currentUserResult = await pool.query(
      'SELECT id, email, role, is_active FROM users WHERE id = $1',
      [userId]
    );

    if (currentUserResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        code: 'USER_NOT_FOUND'
      });
    }

    const currentUser = currentUserResult.rows[0];

    // Construir query de actualización dinámicamente
    let updateFields = [];
    let queryParams = [];
    let paramCounter = 1;

    // Actualizar email
    if (email && email !== currentUser.email) {
      if (!isValidEmail(email)) {
        return res.status(400).json({
          error: 'Email inválido',
          code: 'INVALID_EMAIL'
        });
      }

      // Verificar que el email no esté en uso
      const emailCheck = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email.toLowerCase(), userId]
      );

      if (emailCheck.rows.length > 0) {
        return res.status(409).json({
          error: 'El email ya está en uso',
          code: 'EMAIL_IN_USE'
        });
      }

      updateFields.push(`email = $${paramCounter}`);
      queryParams.push(email.toLowerCase());
      paramCounter++;
    }

    // Actualizar rol (solo admins pueden cambiar roles)
    if (role && role !== currentUser.role) {
      if (!isAdmin) {
        return res.status(403).json({
          error: 'Solo los administradores pueden cambiar roles',
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }

      const validRoles = ['user', 'admin', 'superadmin'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          error: 'Rol inválido',
          code: 'INVALID_ROLE',
          validRoles
        });
      }

      // Solo superadmins pueden crear/modificar otros superadmins
      if (role === 'superadmin' && !isSuperAdmin) {
        return res.status(403).json({
          error: 'Solo los superadministradores pueden asignar el rol de superadmin',
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }

      // No permitir que un admin se quite su propio rol admin
      if (isOwner && currentUser.role === 'admin' && role !== 'admin' && !isSuperAdmin) {
        return res.status(400).json({
          error: 'No puedes cambiar tu propio rol de administrador',
          code: 'CANNOT_CHANGE_OWN_ADMIN_ROLE'
        });
      }

      updateFields.push(`role = $${paramCounter}`);
      queryParams.push(role);
      paramCounter++;
    }

    // Actualizar estado activo (solo admins)
    if (isActive !== undefined && isActive !== currentUser.is_active) {
      if (!isAdmin) {
        return res.status(403).json({
          error: 'Solo los administradores pueden cambiar el estado de usuarios',
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }

      // No permitir que un admin se desactive a sí mismo
      if (isOwner && !isActive) {
        return res.status(400).json({
          error: 'No puedes desactivarte a ti mismo',
          code: 'CANNOT_DEACTIVATE_SELF'
        });
      }

      updateFields.push(`is_active = $${paramCounter}`);
      queryParams.push(isActive);
      paramCounter++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        error: 'No hay campos para actualizar',
        code: 'NO_FIELDS_TO_UPDATE'
      });
    }

    // Agregar updated_at
    updateFields.push(`updated_at = NOW()`);

    // Ejecutar actualización
    const updateQuery = `
      UPDATE users 
      SET ${updateFields.join(', ')} 
      WHERE id = $${paramCounter} 
      RETURNING id, email, role, is_active, updated_at
    `;
    
    queryParams.push(userId);
    
    const result = await pool.query(updateQuery, queryParams);
    const updatedUser = result.rows[0];

    res.json({
      message: 'Usuario actualizado exitosamente',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
        isActive: updatedUser.is_active,
        updatedAt: updatedUser.updated_at
      }
    });

  } catch (error) {
    console.error('[User Update Error]', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// DELETE /users/:id - Eliminar usuario (solo superadmins)
router.delete('/:id', authenticateToken, authorizeRoles('superadmin'), async (req, res) => {
  try {
    const { pool } = req.app.locals;
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
      return res.status(400).json({
        error: 'ID de usuario inválido',
        code: 'INVALID_USER_ID'
      });
    }

    // No permitir eliminar el propio usuario
    if (req.user.id === userId) {
      return res.status(400).json({
        error: 'No puedes eliminar tu propio usuario',
        code: 'CANNOT_DELETE_SELF'
      });
    }

    // Verificar que el usuario existe
    const userCheck = await pool.query(
      'SELECT id, email FROM users WHERE id = $1',
      [userId]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        code: 'USER_NOT_FOUND'
      });
    }

    const userToDelete = userCheck.rows[0];

    // Eliminar usuario (las suscripciones se eliminarán en cascada)
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);

    res.json({
      message: 'Usuario eliminado exitosamente',
      deletedUser: {
        id: userId,
        email: userToDelete.email
      }
    });

  } catch (error) {
    console.error('[User Delete Error]', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// GET /users/:id/subscriptions - Obtener suscripciones de un usuario
router.get('/:id/subscriptions', authenticateToken, authorizeOwnerOrAdmin, async (req, res) => {
  try {
    const { pool } = req.app.locals;
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
      return res.status(400).json({
        error: 'ID de usuario inválido',
        code: 'INVALID_USER_ID'
      });
    }

    const result = await pool.query(
      `SELECT id, endpoint, user_agent, ip, site_id, created_at, updated_at
       FROM subscriptions 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({
      subscriptions: result.rows.map(sub => ({
        id: sub.id,
        endpoint: sub.endpoint,
        userAgent: sub.user_agent,
        ip: sub.ip,
        siteId: sub.site_id,
        createdAt: sub.created_at,
        updatedAt: sub.updated_at
      }))
    });

  } catch (error) {
    console.error('[User Subscriptions Error]', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

export default router;
