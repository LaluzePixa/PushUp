import express from 'express';
import { signJWT, hashPassword, comparePassword, authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Validación de email
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validación de contraseña
const isValidPassword = (password) => {
  // Mínimo 6 caracteres
  return password && password.length >= 6;
};

// POST /auth/register - Registro de usuarios
router.post('/register', async (req, res) => {
  try {
    const { email, password, role = 'user' } = req.body;

    // Validaciones
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email y contraseña son requeridos',
        code: 'MISSING_FIELDS'
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        error: 'Email inválido',
        code: 'INVALID_EMAIL'
      });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({
        error: 'La contraseña debe tener al menos 6 caracteres',
        code: 'INVALID_PASSWORD'
      });
    }

    // Verificar roles válidos
    const validRoles = ['user', 'admin', 'superadmin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        error: 'Rol inválido',
        code: 'INVALID_ROLE',
        validRoles
      });
    }

    const { pool } = req.app.locals;

    // Verificar si el usuario ya existe
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        error: 'El usuario ya existe',
        code: 'USER_EXISTS'
      });
    }

    // Solo superadmins pueden crear otros admins o superadmins
    if (role !== 'user') {
      if (!req.user || req.user.role !== 'superadmin') {
        return res.status(403).json({
          error: 'Solo los superadministradores pueden crear usuarios con roles administrativos',
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }
    }

    // Hash de la contraseña
    const passwordHash = await hashPassword(password);

    // Crear usuario en una transacción
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Crear usuario
      const userResult = await client.query(
        `INSERT INTO users (email, password_hash, role) 
         VALUES ($1, $2, $3) 
         RETURNING id, email, role, is_active, created_at`,
        [email.toLowerCase(), passwordHash, role]
      );

      const newUser = userResult.rows[0];

      // Crear sitio automáticamente para usuarios regulares
      if (role === 'user') {
        const siteName = `Sitio de ${email.split('@')[0]}`;
        const domain = email.split('@')[1] || 'ejemplo.com';

        await client.query(
          `INSERT INTO sites (name, domain, user_id, is_active, description) 
           VALUES ($1, $2, $3, $4, $5)`,
          [siteName, domain, newUser.id, true, 'Sitio creado automáticamente durante el registro']
        );
      }

      await client.query('COMMIT');

      // Generar JWT
      const token = signJWT({
        userId: newUser.id,
        email: newUser.email,
        role: newUser.role
      });

      res.status(201).json({
        message: 'Usuario creado exitosamente',
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
          role: newUser.role,
          isActive: newUser.is_active,
          createdAt: newUser.created_at
        }
      });

    } catch (dbError) {
      await client.query('ROLLBACK');
      throw dbError;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('[Register Error]', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// POST /auth/login - Inicio de sesión
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validaciones
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email y contraseña son requeridos',
        code: 'MISSING_FIELDS'
      });
    }

    const { pool } = req.app.locals;

    // Buscar usuario
    const result = await pool.query(
      'SELECT id, email, password_hash, role, is_active FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        code: 'INVALID_CREDENTIALS'
      });
    }

    const user = result.rows[0];

    // Verificar si el usuario está activo
    if (!user.is_active) {
      return res.status(401).json({
        error: 'Usuario desactivado',
        code: 'USER_DISABLED'
      });
    }

    // Verificar contraseña
    const isPasswordValid = await comparePassword(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Generar JWT
    const token = signJWT({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    // Actualizar última conexión (opcional)
    await pool.query(
      'UPDATE users SET updated_at = NOW() WHERE id = $1',
      [user.id]
    );

    res.json({
      message: 'Inicio de sesión exitoso',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.is_active
      }
    });

  } catch (error) {
    console.error('[Login Error]', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// GET /auth/me - Obtener información del usuario actual
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const { pool } = req.app.locals;

    // Obtener información actualizada del usuario
    const result = await pool.query(
      `SELECT id, email, role, is_active, created_at, updated_at 
       FROM users WHERE id = $1`,
      [req.user.id]
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
    console.error('[Me Error]', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// POST /auth/change-password - Cambiar contraseña
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validaciones
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Contraseña actual y nueva contraseña son requeridas',
        code: 'MISSING_FIELDS'
      });
    }

    if (!isValidPassword(newPassword)) {
      return res.status(400).json({
        error: 'La nueva contraseña debe tener al menos 6 caracteres',
        code: 'INVALID_PASSWORD'
      });
    }

    const { pool } = req.app.locals;

    // Obtener contraseña actual del usuario
    const result = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        code: 'USER_NOT_FOUND'
      });
    }

    const user = result.rows[0];

    // Verificar contraseña actual
    const isCurrentPasswordValid = await comparePassword(currentPassword, user.password_hash);

    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        error: 'Contraseña actual incorrecta',
        code: 'INVALID_CURRENT_PASSWORD'
      });
    }

    // Hash de la nueva contraseña
    const newPasswordHash = await hashPassword(newPassword);

    // Actualizar contraseña
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [newPasswordHash, req.user.id]
    );

    res.json({
      message: 'Contraseña actualizada exitosamente'
    });

  } catch (error) {
    console.error('[Change Password Error]', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

export default router;
