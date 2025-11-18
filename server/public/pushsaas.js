// PushSaaS - Opt-in Prompt Library
(function () {
  'use strict';

  // Configuración por defecto
  const defaultConfig = {
    type: 'lightbox1',
    whenToShow: 'Show Immediately',
    animation: 'Drop-in',
    backgroundColor: '#ffffff',
    headline: '',
    text: 'Would you like to receive notifications on latest updates?',
    cancelButton: 'NOT YET',
    cancelBgColor: '#ffffff',
    cancelTextColor: '#000000',
    approveButton: 'YES',
    approveBgColor: '#2563eb',
    approveTextColor: '#ffffff',
    siteId: null
  };

  let config = defaultConfig;
  let apiBase = '';
  let demoMode = false; // Modo demo para desarrollo local

  // Función principal de inicialización
  window.PushSaaS = {
    init: function (userConfig) {
      console.log('PushSaaS: Inicializando con configuración:', userConfig);
      config = { ...defaultConfig, ...userConfig };

      // Activar modo demo si está en localhost y no es HTTPS
      demoMode = window.location.hostname === 'localhost' && window.location.protocol !== 'https:';
      if (demoMode) {
        console.log('🔧 PushSaaS: Modo DEMO activado (localhost sin HTTPS)');
        console.log('⚠️ En producción con HTTPS, las suscripciones serán reales');
      }

      // Detectar API base desde el script actual
      const scriptEl = document.currentScript ||
        document.querySelector('script[src*="pushsaas.js"]');

      if (scriptEl && scriptEl.src) {
        const url = new URL(scriptEl.src);
        apiBase = `${url.protocol}//${url.host}`;
        console.log('PushSaaS: API base detectada:', apiBase);
      } else {
        // Fallback: usar el origin actual
        apiBase = window.location.origin;
        console.log('PushSaaS: Usando origen actual como API base:', apiBase);
      }

      // Inicializar según configuración
      console.log('PushSaaS: Llamando a setupPrompt()');
      this.setupPrompt();
    },

    setupPrompt: function () {
      console.log('PushSaaS: setupPrompt() ejecutándose');

      // Verificar soporte
      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
        console.warn('PushSaaS: Push notifications not supported');
        console.warn('PushSaaS: serviceWorker:', 'serviceWorker' in navigator);
        console.warn('PushSaaS: PushManager:', 'PushManager' in window);
        console.warn('PushSaaS: Notification:', 'Notification' in window);
        return;
      }

      console.log('PushSaaS: Soporte verificado OK');
      console.log('PushSaaS: whenToShow =', config.whenToShow);

      // Determinar cuándo mostrar el prompt
      switch (config.whenToShow) {
        case 'Show Immediately':
          console.log('PushSaaS: Mostrando prompt inmediatamente');
          this.showPrompt();
          break;
        case 'After 5 seconds':
          console.log('PushSaaS: Mostrando prompt en 5 segundos');
          setTimeout(() => this.showPrompt(), 5000);
          break;
        case 'On exit intent':
          console.log('PushSaaS: Configurando exit intent');
          this.setupExitIntent();
          break;
        default:
          console.log('PushSaaS: Mostrando prompt (default)');
          this.showPrompt();
      }
    },

    showPrompt: function () {
      console.log('PushSaaS: showPrompt() ejecutándose');

      // Verificar si ya está suscrito
      console.log('PushSaaS: Verificando estado de suscripción...');
      this.checkSubscriptionStatus().then(isSubscribed => {
        console.log('PushSaaS: Estado de suscripción:', isSubscribed);

        if (isSubscribed) {
          console.log('PushSaaS: Usuario ya está suscrito, no mostrando prompt');
          return;
        }

        console.log('PushSaaS: Usuario NO suscrito, mostrando prompt tipo:', config.type);

        // Crear y mostrar el prompt según el tipo
        switch (config.type) {
          case 'lightbox1':
            console.log('PushSaaS: Creando lightbox1');
            this.createLightbox1();
            break;
          case 'lightbox2':
            console.log('PushSaaS: Creando lightbox2');
            this.createLightbox2();
            break;
          case 'bellIcon':
            console.log('PushSaaS: Creando bellIcon');
            this.createBellIcon();
            break;
          default:
            console.log('PushSaaS: Creando lightbox1 (default)');
            this.createLightbox1();
        }
      }).catch(error => {
        console.error('PushSaaS: Error al verificar suscripción:', error);
        // Mostrar el prompt de todos modos si hay error
        console.log('PushSaaS: Mostrando prompt de todos modos debido al error');
        this.createLightbox1();
      });
    },

    checkSubscriptionStatus: async function () {
      try {
        console.log('PushSaaS: checkSubscriptionStatus() ejecutándose');

        if ('serviceWorker' in navigator) {
          console.log('PushSaaS: Service Worker soportado, verificando registros...');

          // Verificar si hay algún SW registrado
          const registrations = await navigator.serviceWorker.getRegistrations();
          console.log('PushSaaS: Service Workers registrados:', registrations.length);

          if (registrations.length === 0) {
            console.log('PushSaaS: No hay Service Workers registrados, usuario NO suscrito');
            return false;
          }

          // Obtener el primer registro activo
          const registration = registrations[0];
          console.log('PushSaaS: Usando registro:', registration);

          const subscription = await registration.pushManager.getSubscription();
          console.log('PushSaaS: Suscripción actual:', subscription);

          return !!subscription;
        }

        console.log('PushSaaS: Service Worker no soportado');
        return false;
      } catch (error) {
        console.error('PushSaaS: Error checking subscription status:', error);
        return false;
      }
    },

    createLightbox1: function () {
      console.log('PushSaaS: createLightbox1() iniciando');
      console.log('PushSaaS: Configuración actual:', config);

      // Crear overlay
      const overlay = document.createElement('div');
      overlay.id = 'pushsaas-overlay-lightbox1';
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
      `;

      // Crear modal
      const modal = document.createElement('div');
      modal.style.cssText = `
        background-color: ${config.backgroundColor};
        padding: 24px;
        border-radius: 8px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
        max-width: 400px;
        width: 90%;
        text-align: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      `;

      let content = `
        <div style="margin-bottom: 16px;">
          <div style="width: 48px; height: 48px; margin: 0 auto; background-color: #f3f4f6; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px;">
            🔔
          </div>
        </div>
      `;

      if (config.headline) {
        content += `<h3 style="font-size: 18px; font-weight: 600; margin-bottom: 8px; color: #1f2937;">${config.headline}</h3>`;
      }

      if (config.text) {
        content += `<p style="color: #6b7280; margin-bottom: 24px; font-size: 14px; line-height: 1.5;">${config.text}</p>`;
      }

      content += `
        <div style="display: flex; gap: 12px; justify-content: center;">
          <button id="pushsaas-cancel" style="
            padding: 8px 24px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            border: 1px solid #d1d5db;
            background-color: ${config.cancelBgColor};
            color: ${config.cancelTextColor};
            cursor: pointer;
          ">${config.cancelButton}</button>
          <button id="pushsaas-approve" style="
            padding: 8px 24px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            border: none;
            background-color: ${config.approveBgColor};
            color: ${config.approveTextColor};
            cursor: pointer;
          ">${config.approveButton}</button>
        </div>
      `;

      modal.innerHTML = content;
      overlay.appendChild(modal);

      console.log('PushSaaS: Overlay creado:', overlay);
      console.log('PushSaaS: Modal creado:', modal);
      console.log('PushSaaS: Agregando al body...');

      document.body.appendChild(overlay);

      console.log('PushSaaS: Overlay agregado al DOM');
      console.log('PushSaaS: Verificando si está visible:', overlay.offsetHeight > 0);

      // Event listeners
      const cancelBtn = document.getElementById('pushsaas-cancel');
      const approveBtn = document.getElementById('pushsaas-approve');

      console.log('PushSaaS: Botón cancelar:', cancelBtn);
      console.log('PushSaaS: Botón aprobar:', approveBtn);

      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
          console.log('PushSaaS: Click en cancelar');
          this.closePrompt(overlay);
        });
      }

      if (approveBtn) {
        approveBtn.addEventListener('click', () => {
          console.log('PushSaaS: Click en aprobar');
          this.handleSubscribe(overlay);
        });
      }

      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          console.log('PushSaaS: Click en overlay (cerrar)');
          this.closePrompt(overlay);
        }
      });

      console.log('PushSaaS: createLightbox1() completado');
    },

    createLightbox2: function () {
      // Implementación similar pero más simple
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
      `;

      const modal = document.createElement('div');
      modal.style.cssText = `
        background-color: white;
        padding: 16px;
        border-radius: 8px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
        max-width: 300px;
        width: 90%;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      `;

      modal.innerHTML = `
        <div style="height: 8px; background-color: #60a5fa; border-radius: 4px; margin-bottom: 16px;"></div>
        <p style="font-size: 14px; color: #6b7280; margin-bottom: 16px;">${config.text}</p>
        <div style="display: flex; gap: 8px; justify-content: flex-end;">
          <button id="pushsaas-cancel" style="padding: 4px 12px; font-size: 12px; border: 1px solid #d1d5db; border-radius: 4px; background: white; cursor: pointer;">${config.cancelButton}</button>
          <button id="pushsaas-approve" style="padding: 4px 12px; font-size: 12px; background-color: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">${config.approveButton}</button>
        </div>
      `;

      overlay.appendChild(modal);
      document.body.appendChild(overlay);

      // Event listeners
      document.getElementById('pushsaas-cancel').addEventListener('click', () => {
        this.closePrompt(overlay);
      });

      document.getElementById('pushsaas-approve').addEventListener('click', () => {
        this.handleSubscribe(overlay);
      });
    },

    createBellIcon: function () {
      const bellIcon = document.createElement('div');
      bellIcon.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 48px;
        height: 48px;
        background-color: #3b82f6;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 20px;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        animation: pushsaas-pulse 2s infinite;
      `;

      bellIcon.innerHTML = '🔔';
      bellIcon.title = 'Click to enable notifications';

      bellIcon.addEventListener('click', () => {
        this.handleSubscribe(bellIcon);
      });

      document.body.appendChild(bellIcon);

      // Agregar animación CSS
      if (!document.getElementById('pushsaas-styles')) {
        const style = document.createElement('style');
        style.id = 'pushsaas-styles';
        style.textContent = `
          @keyframes pushsaas-pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
          }
        `;
        document.head.appendChild(style);
      }
    },

    setupExitIntent: function () {
      let hasShown = false;

      document.addEventListener('mouseleave', (e) => {
        if (e.clientY <= 0 && !hasShown) {
          hasShown = true;
          this.showPrompt();
        }
      });
    },

    closePrompt: function (element) {
      if (element && element.parentNode) {
        element.parentNode.removeChild(element);
      }
    },

    handleSubscribe: async function (promptElement) {
      try {
        console.log('PushSaaS: Iniciando suscripción...');

        // Solicitar permisos
        console.log('PushSaaS: Solicitando permisos...');
        const permission = await Notification.requestPermission();
        console.log('PushSaaS: Permiso obtenido:', permission);

        if (permission !== 'granted') {
          alert('Notifications were denied. Please enable them in your browser settings.');
          this.closePrompt(promptElement);
          return;
        }

        // Registrar Service Worker
        console.log('PushSaaS: Registrando Service Worker...');
        let swReg = await navigator.serviceWorker.getRegistration();

        if (!swReg) {
          console.log('PushSaaS: No hay SW registrado, registrando nuevo...');
          swReg = await navigator.serviceWorker.register('/pushsaas-sw.js', {
            scope: '/'
          });
        }

        await navigator.serviceWorker.ready;
        console.log('PushSaaS: Service Worker listo');

        // Obtener clave VAPID
        console.log('PushSaaS: Obteniendo clave VAPID desde:', `${apiBase}/vapid-public-key`);
        const response = await fetch(`${apiBase}/vapid-public-key`);
        const responseData = await response.json();
        console.log('PushSaaS: VAPID response:', responseData);

        // La API devuelve { success: true, data: { publicKey: "..." } }
        const publicKey = responseData.data?.publicKey || responseData.publicKey;

        if (!publicKey) {
          throw new Error('VAPID public key not found in response');
        }

        console.log('PushSaaS: Using VAPID key:', publicKey);

        // Crear suscripción
        console.log('PushSaaS: Intentando suscribirse con pushManager...');

        let subscription;
        let subscriptionData;

        if (demoMode) {
          // Modo DEMO: simular suscripción sin conexión real al servicio push
          console.log('🔧 PushSaaS: Modo DEMO - Simulando suscripción (no se conectará al servicio push real)');

          // Crear datos de suscripción simulados
          subscriptionData = {
            endpoint: `https://fcm.googleapis.com/fcm/send/demo-${Date.now()}`,
            keys: {
              p256dh: btoa('demo-p256dh-key-' + Math.random()),
              auth: btoa('demo-auth-key-' + Math.random())
            },
            siteId: config.siteId,
            isDemoMode: true // Marcar como demo
          };

          console.log('🔧 PushSaaS: Suscripción simulada creada:', subscriptionData);

        } else {
          // Modo PRODUCCIÓN: suscripción real
          subscription = await swReg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: this.urlBase64ToUint8Array(publicKey)
          });

          console.log('PushSaaS: ✅ Suscripción creada exitosamente:', subscription);

          // Preparar datos de suscripción real
          subscriptionData = {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('p256dh')))),
              auth: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('auth'))))
            }
          };

          if (config.siteId) {
            subscriptionData.siteId = config.siteId;
          }
        }

        // Enviar suscripción al servidor
        console.log('PushSaaS: Enviando suscripción al servidor:', `${apiBase}/subscribe`);
        console.log('PushSaaS: Datos a enviar:', subscriptionData);
        const saveResponse = await fetch(`${apiBase}/subscribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscriptionData)
        });

        console.log('PushSaaS: Status de respuesta:', saveResponse.status, saveResponse.statusText);

        // Verificar si la respuesta es exitosa
        if (!saveResponse.ok) {
          const errorText = await saveResponse.text();
          console.error('PushSaaS: Error del servidor (texto completo):', errorText);
          throw new Error(`Server error: ${saveResponse.status} - ${errorText.substring(0, 200)}`);
        }

        const saveResult = await saveResponse.json();
        console.log('PushSaaS: Respuesta del servidor:', saveResult);

        // Cerrar prompt SIEMPRE después del proceso
        console.log('PushSaaS: Cerrando prompt...');
        this.closePrompt(promptElement);

        // Mostrar confirmación
        if (demoMode) {
          console.log('🔧 PushSaaS: ✅ Suscripción DEMO guardada exitosamente');
          console.log('⚠️ NOTA: Esta es una suscripción simulada para desarrollo local');
          console.log('💡 En producción con HTTPS, las notificaciones funcionarán de verdad');

          // Mostrar alert informativo en demo
          alert('✅ ¡Suscripción exitosa!\n\n🔧 Modo DEMO activado\nEsta es una suscripción simulada para desarrollo local.\n\n💡 En producción con HTTPS, las notificaciones push funcionarán de verdad.');
        } else {
          console.log('PushSaaS: ✅ Successfully subscribed to notifications');

          // Mostrar notificación de bienvenida solo en modo producción
          if ('serviceWorker' in navigator && 'Notification' in window) {
            navigator.serviceWorker.ready.then(registration => {
              registration.showNotification('¡Bienvenido!', {
                body: 'Te has suscrito exitosamente a las notificaciones.',
                icon: '/favicon.ico',
                tag: 'welcome-notification'
              });
            }).catch(err => {
              console.log('PushSaaS: No se pudo mostrar notificación de bienvenida:', err);
            });
          }
        }

      } catch (error) {
        console.error('PushSaaS: ❌ Error subscribing to notifications:', error);
        console.error('PushSaaS: Error name:', error.name);
        console.error('PushSaaS: Error message:', error.message);
        console.error('PushSaaS: Error stack:', error.stack);

        // Cerrar prompt INCLUSO si hay error
        console.log('PushSaaS: Cerrando prompt debido a error...');
        this.closePrompt(promptElement);

        // Proporcionar mensaje más específico según el tipo de error
        let errorMessage = 'Error al suscribirse a las notificaciones.';

        if (error.name === 'AbortError') {
          errorMessage = '❌ Error del servicio push.\n\nPosibles soluciones:\n• Desactiva VPN/proxy si está activo\n• Verifica que tu firewall permita conexiones push\n• Intenta reiniciar el navegador\n• Prueba en modo incógnito';
        } else if (error.name === 'NotAllowedError') {
          errorMessage = '❌ Permisos de notificación denegados.\n\nPor favor, habilita las notificaciones en la configuración de tu navegador.';
        } else if (error.message) {
          errorMessage += '\n\nDetalles técnicos: ' + error.message;
        }

        alert(errorMessage);
      }
    },

    urlBase64ToUint8Array: function (base64String) {
      const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
      const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
      const rawData = atob(base64);
      const outputArray = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      return outputArray;
    }
  };

  // NO auto-inicializar desde query string - dejarlo al HTML
  // El demo.html manejará la inicialización

})();
