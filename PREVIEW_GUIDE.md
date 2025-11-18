# Guía de Vista Previa - PushSaaS

## ¿Cómo usar la Vista Previa?

La función "Vista Previa en Sitio Web" te permite ver cómo se verá tu opt-in prompt antes de implementarlo en producción.

## Pasos para usar la vista previa:

### 1. Configura tu Opt-in Prompt
En la página `/optinp`:
- ✅ **Selecciona un sitio** desde el menú lateral
- ⚙️ Configura el tipo de prompt (Lightbox 1, Lightbox 2, Bell Icon)
- 🎨 Personaliza colores, textos y botones
- 💾 **Guarda la configuración** (recomendado pero opcional)

### 2. Abre la Vista Previa
- Click en el botón **"Vista Previa en Sitio Web"**
- Se abrirá una nueva pestaña con `http://localhost:3000/demo.html`
- La configuración actual se pasa como parámetro en la URL

### 3. Interactúa con el Preview
- El prompt aparecerá según tu configuración "When to Show":
  - **Show Immediately**: Aparece al cargar la página
  - **After 5 seconds**: Aparece 5 segundos después
  - **On exit intent**: Aparece cuando mueves el mouse hacia la barra de direcciones

### 4. Prueba la suscripción
- Click en el botón de aprobar (YES)
- Se solicitarán permisos de notificación
- Si acepta, se creará una suscripción push real
- Verás mensajes en la consola del navegador con detalles

## Funciones de la página de preview:

### Botones disponibles:
- **🔄 Reiniciar Demo**: Recarga el prompt para verlo nuevamente
- **⚙️ Ver Configuración**: Muestra la configuración JSON actual
- **📊 Panel Admin**: Navega al panel de administración

### Información mostrada:
- Estado de carga del prompt
- Configuración actual en formato JSON
- Código de integración para copiar y pegar

## Solución de Problemas

### El prompt no aparece:
1. Abre DevTools (F12) → Console
2. Busca mensajes que empiecen con `[PushSaaS]` o `[Demo.html]`
3. Verifica que window.PushSaaS esté definido:
   ```javascript
   console.log(window.PushSaaS)
   ```

### Error "Registration failed - push service error":
- Ver [PUSH_TROUBLESHOOTING.md](./PUSH_TROUBLESHOOTING.md)
- Soluciones comunes:
  - Desactiva VPN/proxy
  - Reinicia Service Worker
  - Verifica conexión a FCM
  - Prueba en otro navegador

### La configuración no se carga:
1. Verifica la URL - debe contener `?config=`
2. Abre la consola y ejecuta:
   ```javascript
   const urlParams = new URLSearchParams(window.location.search);
   const config = urlParams.get('config');
   console.log(JSON.parse(decodeURIComponent(config)));
   ```

### Service Worker no se registra:
1. DevTools (F12) → Application → Service Workers
2. Verifica que `pushsaas-sw.js` esté registrado
3. Si no está, ejecuta:
   ```javascript
   navigator.serviceWorker.register('/pushsaas-sw.js')
     .then(reg => console.log('SW registrado:', reg))
     .catch(err => console.error('Error SW:', err))
   ```

## Arquitectura

### Flujo de la Vista Previa:

```
Frontend (Next.js)
    ↓
[Click "Vista Previa"]
    ↓
Genera URL con config: /demo.html?config={...}
    ↓
Backend Server (http://localhost:3000)
    ↓
Sirve: demo.html
    ↓
Carga: pushsaas.js
    ↓
Inicializa: window.PushSaaS.init(config)
    ↓
Registra: pushsaas-sw.js
    ↓
Muestra prompt según configuración
```

### Archivos involucrados:

1. **Frontend**:
   - `frontend/src/app/(main)/(setup)/optinp/page.tsx`
   - Función `generatePreviewUrl()`

2. **Backend**:
   - `server/public/demo.html` - Página de demostración
   - `server/public/pushsaas.js` - Librería principal
   - `server/public/pushsaas-sw.js` - Service Worker

3. **API**:
   - `GET /vapid-public-key` - Obtiene clave pública VAPID
   - `POST /subscribe` - Guarda suscripción en la base de datos

## Desarrollo y Testing

### Modo debug:
Abre la consola del navegador para ver logs detallados:
- `[Demo.html]` - Mensajes de la página de demo
- `[PushSaaS]` - Mensajes de la librería
- `[PushSaaS SW]` - Mensajes del Service Worker

### Variables de entorno:
```bash
# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:3000

# Backend (.env)
VAPID_PUBLIC_KEY=BJM...
VAPID_PRIVATE_KEY=...
```

### Comandos útiles:

```bash
# Limpiar Service Workers
# En la consola del navegador:
navigator.serviceWorker.getRegistrations()
  .then(regs => regs.forEach(reg => reg.unregister()))

# Verificar suscripción actual
navigator.serviceWorker.ready
  .then(reg => reg.pushManager.getSubscription())
  .then(sub => console.log(sub))

# Enviar notificación de prueba (desde backend)
POST http://localhost:3000/send
{
  "title": "Test",
  "body": "Mensaje de prueba",
  "url": "/"
}
```

## Notas Importantes

⚠️ **HTTPS Requerido en Producción**
- Localhost funciona con HTTP
- Producción REQUIERE HTTPS válido
- Service Workers no funcionan sin HTTPS

🔒 **Permisos de Notificación**
- Solo se pueden solicitar una vez
- Si el usuario deniega, debe cambiar manualmente en settings
- Chrome: chrome://settings/content/notifications
- Firefox: about:preferences#privacy

📱 **Compatibilidad**
- ✅ Chrome/Edge (Desktop & Android)
- ✅ Firefox (Desktop & Android)
- ✅ Safari (Desktop & iOS 16.4+)
- ❌ iOS Safari < 16.4

## Recursos

- [MDN: Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Web Push Protocol](https://datatracker.ietf.org/doc/html/rfc8030)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)
