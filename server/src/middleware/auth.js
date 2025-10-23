import { createVerifier, createSigner } from 'fast-jwt';
import bcrypt from 'bcrypt';

// Configuración JWT
// SEGURIDAD: No permitir fallback a secret débil
// La aplicación DEBE fallar si no hay JWT_SECRET configurado
if (!process.env.JWT_SECRET) {
  throw new Error(
    '❌ CRITICAL SECURITY ERROR: JWT_SECRET environment variable is required.\n' +
    'Please set JWT_SECRET in your .env file with a strong random secret.\n' +
    'You can generate one with: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"'
  );
}

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Crear funciones de JWT
export const signJWT = createSigner({ 
  key: JWT_SECRET, 
  expiresIn: JWT_EXPIRES_IN 
});

export const verifyJWT = createVerifier({ 
  key: JWT_SECRET 
});

// Middleware de autenticación
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: 'Token de acceso requerido',
        code: 'TOKEN_REQUIRED' 
      });
    }

    const payload = verifyJWT(token);
    
    // Obtener información completa del usuario desde la base de datos
    const { pool } = req.app.locals;
    const userResult = await pool.query(
      'SELECT id, email, role, is_active FROM users WHERE id = $1', 
      [payload.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ 
        error: 'Usuario no encontrado',
        code: 'USER_NOT_FOUND' 
      });
    }

    const user = userResult.rows[0];
    
    if (!user.is_active) {
      return res.status(401).json({ 
        error: 'Usuario desactivado',
        code: 'USER_DISABLED' 
      });
    }

    // Agregar información del usuario al request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.is_active
    };

    next();
  } catch (error) {
    console.error('[Auth Error]', error.message);
    
    // Manejar diferentes tipos de errores de JWT
    if (error.code === 'FAST_JWT_EXPIRED') {
      return res.status(401).json({ 
        error: 'Token expirado',
        code: 'TOKEN_EXPIRED' 
      });
    }
    
    if (error.code === 'FAST_JWT_INVALID_SIGNATURE') {
      return res.status(401).json({ 
        error: 'Token inválido',
        code: 'TOKEN_INVALID' 
      });
    }

    return res.status(401).json({ 
      error: 'Token inválido',
      code: 'TOKEN_INVALID' 
    });
  }
};

// Middleware de autorización por roles
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Usuario no autenticado',
        code: 'NOT_AUTHENTICATED' 
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'No tienes permisos para acceder a este recurso',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: allowedRoles,
        current: req.user.role
      });
    }

    next();
  };
};

// Middleware para verificar si es el mismo usuario o admin
export const authorizeOwnerOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Usuario no autenticado',
      code: 'NOT_AUTHENTICATED' 
    });
  }

  const targetUserId = parseInt(req.params.userId || req.params.id);
  const isOwner = req.user.id === targetUserId;
  const isAdmin = ['admin', 'superadmin'].includes(req.user.role);

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ 
      error: 'Solo puedes acceder a tu propia información o ser administrador',
      code: 'INSUFFICIENT_PERMISSIONS' 
    });
  }

  next();
};

// Utilidades de hash de contraseñas
export const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

// Middleware opcional para rutas públicas que pueden tener usuario autenticado
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const payload = verifyJWT(token);
      const { pool } = req.app.locals;
      const userResult = await pool.query(
        'SELECT id, email, role, is_active FROM users WHERE id = $1 AND is_active = true', 
        [payload.userId]
      );

      if (userResult.rows.length > 0) {
        const user = userResult.rows[0];
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role,
          isActive: user.is_active
        };
      }
    }
  } catch (error) {
    // En rutas opcionales, ignoramos errores de autenticación
    console.log('[Optional Auth] Token inválido o expirado, continuando sin usuario');
  }
  
  next();
};
