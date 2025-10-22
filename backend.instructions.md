# Instrucciones Específicas para Backend Node.js

## Framework y Tecnologías
- Node.js con Express
- ES6+ modules (import/export)
- Middleware pattern
- RESTful API design

## Estructura de APIs

### Route Handlers
```javascript
export const handlerName = async (req, res, next) => {
  try {
    // Validar entrada
    // Procesar lógica
    // Enviar respuesta
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
```

### Response Format
```javascript
// Success Response
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully"
}

// Error Response
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

## Middleware Patterns

### Authentication Middleware
```javascript
export const authenticateToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: { code: 'NO_TOKEN', message: 'Access token required' }
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      error: { code: 'INVALID_TOKEN', message: 'Invalid access token' }
    });
  }
};
```

### Validation Middleware
- Validar todos los inputs
- Sanitizar datos de entrada
- Return consistent error messages
- Use validation libraries (joi, yup, zod)

## Database Patterns

### Query Functions
```javascript
export const findUserById = async (id) => {
  try {
    // Database query logic
    return user;
  } catch (error) {
    throw new Error(`Failed to find user: ${error.message}`);
  }
};
```

### Transactions
- Usar transacciones para operaciones críticas
- Rollback en caso de error
- Consistent data state

## Error Handling

### Global Error Handler
```javascript
export const errorHandler = (error, req, res, next) => {
  console.error('Error:', error);
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: error.message }
    });
  }
  
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'Internal server error' }
  });
};
```

## Security Patterns

### Input Validation
- Validate all user inputs
- Use parameterized queries
- Sanitize HTML content
- Rate limiting on APIs

### Authentication & Authorization
- JWT tokens with expiration
- Refresh token mechanism
- Role-based access control
- Secure password hashing

## Push Notifications

### VAPID Configuration
```javascript
const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY
};

webpush.setVapidDetails(
  'mailto:your-email@example.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);
```

### Send Notification
```javascript
export const sendPushNotification = async (subscription, payload) => {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return { success: true };
  } catch (error) {
    console.error('Push notification failed:', error);
    throw new Error('Failed to send push notification');
  }
};
```

## Logging and Monitoring
- Structured logging (JSON format)
- Log levels (error, warn, info, debug)
- Request/response logging
- Performance monitoring

## Environment Configuration
- Use .env files for configuration
- Validate environment variables at startup
- Different configs for dev/staging/prod
- Never commit secrets to git

Generar siempre código backend que sea seguro, escalable y mantenible.