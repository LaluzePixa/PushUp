# PushSaaS - Instrucciones para GitHub Copilot

## Descripción del Proyecto
PushSaaS es una plataforma de notificaciones push que incluye un frontend React con TypeScript, un backend Node.js, y sistema de gestión de campañas. Utiliza Docker para el despliegue.

## Estilo de Código y Convenciones

### Frontend (React + TypeScript)
- Usar TypeScript estricto con tipos explícitos
- Componentes funcionales con hooks en lugar de componentes de clase
- Usar interfaces para definir props y tipos de datos
- Naming convention: PascalCase para componentes, camelCase para variables y funciones
- Usar Tailwind CSS para estilos
- Estructura de carpetas: components, services, types, contexts, lib
- Importaciones absolutas preferidas sobre relativas

### Backend (Node.js + Express)
- Usar ES6+ syntax con import/export
- Naming convention: camelCase para variables y funciones, PascalCase para clases
- Separar lógica en services, middleware, y routes
- Usar async/await en lugar de callbacks
- Manejar errores de forma consistente con try/catch
- Validación de datos de entrada obligatoria

### Base de Datos y APIs
- Usar esquemas de validación para todas las entradas
- Responses consistentes con status codes apropiados
- Documentar endpoints con comentarios JSDoc
- Usar middleware de autenticación para rutas protegidas

## Patrones Específicos

### Autenticación
- Implementar middleware de autenticación JWT
- Validar tokens en todas las rutas protegidas
- Manejar refresh tokens de forma segura

### Notificaciones Push
- Usar web-push para implementar notificaciones
- Manejar service workers de forma apropiada
- Validar VAPID keys y configuración

### Gestión de Estado
- Usar Context API para estado global
- Implementar custom hooks para lógica reutilizable
- Separar estado de UI del estado de aplicación

## Estructura de Archivos
- Agrupar archivos por funcionalidad, no por tipo
- Un archivo por componente/servicio
- Usar index.ts para exportaciones limpias
- Tests junto a los archivos que prueban

## Comentarios y Documentación
- Comentar funciones complejas con JSDoc
- Incluir examples en comentarios para APIs
- Documentar props de componentes con comentarios
- README.md actualizado con cada feature importante

## Seguridad
- Validar todas las entradas del usuario
- Sanitizar datos antes de almacenar
- Usar variables de entorno para secrets
- Implementar rate limiting en APIs
- CORS configurado apropiadamente

## Testing
- Tests unitarios para funciones puras
- Tests de integración para APIs
- Tests de componentes con React Testing Library
- Coverage mínimo del 80%

## Docker y Despliegue
- Usar multi-stage builds para optimización
- Variables de entorno para configuración
- Health checks en servicios
- Logs estructurados para monitoreo

Siempre generar código que siga estas convenciones y esté listo para producción.