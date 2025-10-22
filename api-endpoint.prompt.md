---
description: "Generar un endpoint de API REST para el backend de PushSaaS"
---

# Crear API Endpoint

Generar un endpoint de API REST completo que siga los patrones de PushSaaS:

## Estructura del Endpoint

1. **Route Handler:**
   ```javascript
   export const handlerName = async (req, res, next) => {
     try {
       // Validation
       // Business logic
       // Response
     } catch (error) {
       next(error);
     }
   };
   ```

2. **Validation:**
   - Validar todos los parámetros de entrada
   - Sanitizar datos
   - Return validation errors con formato consistente

3. **Response Format:**
   ```javascript
   // Success
   res.status(200).json({
     success: true,
     data: result,
     message: "Operation completed"
   });
   
   // Error
   res.status(400).json({
     success: false,
     error: {
       code: "ERROR_CODE",
       message: "Human readable message"
     }
   });
   ```

## Características Requeridas

- **Authentication:** Middleware de autenticación si es necesario
- **Authorization:** Verificar permisos del usuario
- **Input validation:** Esquemas de validación completos
- **Error handling:** Try/catch con errores descriptivos
- **Status codes:** HTTP status codes apropiados
- **JSDoc:** Documentación completa del endpoint
- **Logging:** Log de operaciones importantes
- **Rate limiting:** Considerar limitación de requests si aplicable

## Patrones de Seguridad

- **JWT verification:** Para rutas protegidas
- **Input sanitization:** Prevenir XSS y injection attacks
- **Parameter validation:** Validar tipos y rangos
- **CORS headers:** Configuración apropiada
- **Request size limits:** Limitar tamaño de payloads

## Database Operations

- **Transactions:** Usar para operaciones críticas
- **Query optimization:** Índices apropiados
- **Error handling:** Catch y handle database errors
- **Connection pooling:** Gestión eficiente de conexiones

## Testing Considerations

- **Unit tests:** Para lógica de business
- **Integration tests:** Para flujo completo
- **Error scenarios:** Test de casos de error
- **Mock data:** Datos de test realistas

Generar endpoint completo con middleware, validación, manejo de errores y documentación.