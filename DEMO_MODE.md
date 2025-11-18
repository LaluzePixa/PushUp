# 🔧 Modo DEMO - Desarrollo Local

## ¿Qué es el Modo DEMO?

El **Modo DEMO** es una funcionalidad automática que se activa cuando estás desarrollando en `localhost` sin HTTPS. Permite probar la interfaz y flujo de opt-in sin necesidad de conectarse al servicio push real (FCM/Mozilla Push Service).

## ¿Cuándo se activa?

El modo DEMO se activa automáticamente cuando:
- ✅ `window.location.hostname === 'localhost'`
- ✅ `window.location.protocol !== 'https:'`

```javascript
// Se activa en:
http://localhost:3000/demo.html ✅ DEMO MODE
http://127.0.0.1:3000/demo.html ✅ DEMO MODE

// NO se activa en:
https://localhost:3000/demo.html ❌ Modo producción
https://tu-dominio.com/demo.html ❌ Modo producción
```

## ¿Qué hace el Modo DEMO?

### 1. **Simula la suscripción push**
En lugar de llamar a `pushManager.subscribe()` (que fallaría con `AbortError` en localhost), crea una suscripción simulada:

```javascript
{
  endpoint: "https://fcm.googleapis.com/fcm/send/demo-1699999999999",
  keys: {
    p256dh: "ZGVtby1wMjU2ZGgta2V5LTAuMTIzNDU2Nzg5",
    auth: "ZGVtby1hdXRoLWtleS0wLjk4NzY1NDMyMQ=="
  },
  siteId: 4,
  isDemoMode: true
}
```

### 2. **Guarda en la base de datos**
La suscripción simulada se guarda en la BD para que puedas:
- Ver las suscripciones en el admin
- Probar el flujo completo
- Verificar que el siteId se asocia correctamente

### 3. **Muestra mensajes claros**
```
🔧 PushSaaS: Modo DEMO activado (localhost sin HTTPS)
⚠️ En producción con HTTPS, las suscripciones serán reales
```

### 4. **Alert informativo**
```
✅ ¡Suscripción exitosa!

🔧 Modo DEMO activado
Esta es una suscripción simulada para desarrollo local.

💡 En producción con HTTPS, las notificaciones push funcionarán de verdad.
```

## Limitaciones del Modo DEMO

❌ **NO funcionan**:
- Notificaciones push reales
- Comunicación con FCM/Mozilla Push Service
- Service Worker push events
- Notificaciones de prueba desde el servidor

✅ **SÍ funcionan**:
- Interfaz del opt-in prompt
- Flujo de suscripción (simulado)
- Guardado en base de datos
- Asociación con siteId
- Permisos de notificación del navegador

## Solucionar el AbortError en localhost

El error `AbortError: Registration failed - push service error` ocurre porque Chrome/Edge no pueden conectarse al servicio push de Google en localhost sin HTTPS.

### Soluciones:

#### Opción 1: Usar Modo DEMO (Actual)
✅ Ya está configurado, solo prueba en `http://localhost:3000`

#### Opción 2: HTTPS Local
```bash
# Instalar mkcert
choco install mkcert

# Crear certificados
mkcert -install
mkcert localhost 127.0.0.1

# Configurar servidor para usar HTTPS
# Agregar a tu configuración del servidor
```

#### Opción 3: Usar ngrok (Testing rápido)
```bash
# Terminal 1 - Backend
cd server
npm start

# Terminal 2 - ngrok
ngrok http 3000
# Accede via https://xxxx.ngrok.io
```

#### Opción 4: Firefox
Firefox usa Mozilla Push Service que puede funcionar mejor en localhost.

## Producción vs Demo

| Característica | Localhost (DEMO) | Producción (HTTPS) |
|----------------|------------------|-------------------|
| Opt-in prompt | ✅ Funciona | ✅ Funciona |
| Permisos browser | ✅ Funciona | ✅ Funciona |
| Push subscription | 🔧 Simulado | ✅ Real |
| Guardar en BD | ✅ Funciona | ✅ Funciona |
| Enviar notificaciones | ❌ No funciona | ✅ Funciona |
| Service Worker | ✅ Se registra | ✅ Funciona completo |

## Verificar el Modo

### En la consola del navegador:
```javascript
// Deberías ver estos mensajes
🔧 PushSaaS: Modo DEMO activado (localhost sin HTTPS)
⚠️ En producción con HTTPS, las suscripciones serán reales

// Al suscribirse
🔧 PushSaaS: Modo DEMO - Simulando suscripción (no se conectará al servicio push real)
🔧 PushSaaS: ✅ Suscripción DEMO guardada exitosamente
```

### En los logs del servidor:
```
🔧 Demo mode subscription received (localhost development)
```

### En la base de datos:
```sql
SELECT endpoint, site_id FROM subscriptions;
-- Verás endpoints que empiezan con:
-- https://fcm.googleapis.com/fcm/send/demo-...
```

## Testing End-to-End

### 1. Development (localhost)
```bash
# Usa modo DEMO automático
npm run dev
# Abre http://localhost:3001 o http://localhost:3000/demo.html
```

### 2. Staging (HTTPS)
```bash
# Deploy a un servidor de staging con HTTPS
# Las suscripciones serán reales
```

### 3. Production (HTTPS)
```bash
# Deploy a producción
# Todo funcionará completamente
```

## Logs de Ejemplo

### Modo DEMO activado:
```
PushSaaS: Inicializando con configuración: {type: "lightbox1", ...}
🔧 PushSaaS: Modo DEMO activado (localhost sin HTTPS)
⚠️ En producción con HTTPS, las suscripciones serán reales
PushSaaS: setupPrompt() ejecutándose
PushSaaS: Mostrando prompt inmediatamente
...
🔧 PushSaaS: Modo DEMO - Simulando suscripción
🔧 PushSaaS: Suscripción simulada creada: {...}
🔧 PushSaaS: ✅ Suscripción DEMO guardada exitosamente
```

### Modo Producción (HTTPS):
```
PushSaaS: Inicializando con configuración: {type: "lightbox1", ...}
PushSaaS: setupPrompt() ejecutándose
PushSaaS: Mostrando prompt inmediatamente
...
PushSaaS: Intentando suscribirse con pushManager...
PushSaaS: ✅ Suscripción creada exitosamente: {...}
PushSaaS: ✅ Successfully subscribed to notifications
```

## Preguntas Frecuentes

### ¿Por qué necesito esto?
El servicio push de Chrome/Edge requiere HTTPS. En localhost sin HTTPS, el browser no puede conectarse a FCM, causando `AbortError`.

### ¿Es seguro para producción?
Sí. El modo DEMO **solo** se activa en localhost sin HTTPS. En producción con HTTPS válido, usará el servicio push real automáticamente.

### ¿Puedo desactivarlo?
Sí. Simplemente usa HTTPS en localhost (con mkcert) y el modo DEMO no se activará.

### ¿Las suscripciones demo funcionan?
Para testing de UI y flujo: Sí ✅
Para recibir notificaciones reales: No ❌

### ¿Debo limpiar las suscripciones demo?
Puedes identificarlas por el endpoint que empieza con `demo-` y eliminarlas antes de ir a producción:

```sql
DELETE FROM subscriptions 
WHERE endpoint LIKE '%demo-%';
```

## Recursos

- [MDN: Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [PUSH_TROUBLESHOOTING.md](./PUSH_TROUBLESHOOTING.md)
- [PREVIEW_GUIDE.md](./PREVIEW_GUIDE.md)
