# Solución al Error: "Registration failed - push service error"

## Causa del Error

El error `AbortError: Registration failed - push service error` ocurre cuando el navegador no puede conectarse al servicio push del sistema operativo/navegador.

## Causas Comunes

1. **Firewall/Antivirus**: Bloquea la conexión a `fcm.googleapis.com` (Chrome) o `push.services.mozilla.com` (Firefox)
2. **VPN/Proxy**: Interfiere con la comunicación con los servicios push
3. **Configuración de red corporativa**: Bloquea puertos necesarios
4. **Service Worker corrupto**: El SW no está registrado correctamente
5. **Clave VAPID inválida**: La clave es demasiado corta o tiene formato incorrecto

## Diagnóstico

### 1. Verificar acceso a servicios push:

**Chrome/Edge:**
```javascript
fetch('https://fcm.googleapis.com/')
  .then(r => console.log('✅ FCM accesible:', r.status))
  .catch(e => console.error('❌ FCM bloqueado:', e))
```

**Firefox:**
```javascript
fetch('https://push.services.mozilla.com/')
  .then(r => console.log('✅ Push service accesible:', r.status))
  .catch(e => console.error('❌ Push service bloqueado:', e))
```

### 2. Verificar Service Worker:

```javascript
navigator.serviceWorker.getRegistrations()
  .then(regs => console.log('SW registrados:', regs))
```

### 3. Verificar permisos:

```javascript
console.log('Permiso notificaciones:', Notification.permission)
```

### 4. Verificar clave VAPID:

```javascript
fetch('http://localhost:3000/vapid-public-key')
  .then(r => r.json())
  .then(d => {
    console.log('Clave VAPID:', d.data.publicKey);
    console.log('Longitud:', d.data.publicKey?.length);
  })
```

## Soluciones

### Solución 1: Reiniciar Service Worker

1. Abrir DevTools (F12)
2. Application → Service Workers
3. Click "Unregister" en todos los SW
4. Recargar página (F5)
5. Intentar suscribirse de nuevo

O usar el botón "🔄 Reiniciar Service Worker" en la interfaz.

### Solución 2: Desactivar VPN/Proxy temporalmente

Si tienes una VPN activa, desactívala temporalmente y prueba de nuevo.

### Solución 3: Configurar Firewall/Antivirus

**Windows Defender:**
1. Windows Security → Firewall & network protection
2. Allow an app through firewall
3. Asegurar que Chrome/Edge tenga acceso

**Kaspersky/Norton/McAfee:**
- Agregar `fcm.googleapis.com` a lista blanca
- Permitir conexiones de navegador

### Solución 4: Probar en otro navegador

```bash
# Firefox usa un servicio push diferente (Mozilla)
# Puede funcionar si Chrome está bloqueado
```

### Solución 5: HTTPS local (Producción)

Para desarrollo local con HTTPS:

```bash
# Instalar mkcert
choco install mkcert

# Crear certificados locales
mkcert -install
mkcert localhost 127.0.0.1 ::1

# En next.config.ts, agregar:
# server: {
#   https: {
#     key: fs.readFileSync('./localhost-key.pem'),
#     cert: fs.readFileSync('./localhost.pem'),
#   },
# }
```

### Solución 6: Verificar clave VAPID

```bash
cd server
node scripts/genVapid.js
```

Asegurar que `.env` tenga:
```
VAPID_PUBLIC_KEY=BJM...
VAPID_PRIVATE_KEY=...
```

### Solución 7: Usar ngrok (Testing rápido)

```bash
# Terminal 1 - Frontend
cd frontend
npm run dev

# Terminal 2 - Backend
cd server
npm start

# Terminal 3 - Exponer con HTTPS
ngrok http 3001
```

Luego accede via la URL de ngrok (https://xxx.ngrok.io)

## Testing en Producción

El error NO debería ocurrir en producción con HTTPS válido:

```bash
# Verificar en producción
curl https://tu-dominio.com/vapid-public-key

# Debe retornar clave VAPID válida
```

## Código de Diagnóstico Automático

Agregado en el hook `usePushNotifications.ts`:

```typescript
// Detecta AbortError específicamente
if (subscribeError.name === 'AbortError') {
  throw new Error('Error de servicio push. Verifica: 
    1) Que no haya VPN/proxy activo, 
    2) Que el firewall permita conexiones push, 
    3) Intenta reiniciar el navegador');
}
```

## Notas Importantes

⚠️ **Este error es común en desarrollo local**
✅ **En producción con HTTPS válido, no debería ocurrir**
🔒 **HTTPS es OBLIGATORIO para push notifications (excepto localhost)**

## Recursos

- [MDN: Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Web Push Protocol](https://datatracker.ietf.org/doc/html/rfc8030)
- [VAPID](https://datatracker.ietf.org/doc/html/rfc8292)
