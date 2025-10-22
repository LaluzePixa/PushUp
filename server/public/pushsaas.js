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

  // Función principal de inicialización
  window.PushSaaS = {
    init: function (userConfig) {
      config = { ...defaultConfig, ...userConfig };

      // Detectar API base desde el script actual
      const scriptEl = document.currentScript ||
        document.querySelector('script[src*="pushsaas.js"]');

      if (scriptEl && scriptEl.src) {
        const url = new URL(scriptEl.src);
        apiBase = `${url.protocol}//${url.host}`;
      }

      // Inicializar según configuración
      this.setupPrompt();
    },

    setupPrompt: function () {
      // Verificar soporte
      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
        console.warn('PushSaaS: Push notifications not supported');
        return;
      }

      // Determinar cuándo mostrar el prompt
      switch (config.whenToShow) {
        case 'Show Immediately':
          this.showPrompt();
          break;
        case 'After 5 seconds':
          setTimeout(() => this.showPrompt(), 5000);
          break;
        case 'On exit intent':
          this.setupExitIntent();
          break;
        default:
          this.showPrompt();
      }
    },

    showPrompt: function () {
      // Verificar si ya está suscrito
      this.checkSubscriptionStatus().then(isSubscribed => {
        if (isSubscribed) {
          console.log('PushSaaS: User already subscribed');
          return;
        }

        // Crear y mostrar el prompt según el tipo
        switch (config.type) {
          case 'lightbox1':
            this.createLightbox1();
            break;
          case 'lightbox2':
            this.createLightbox2();
            break;
          case 'bellIcon':
            this.createBellIcon();
            break;
          default:
            this.createLightbox1();
        }
      });
    },

    checkSubscriptionStatus: async function () {
      try {
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          return !!subscription;
        }
        return false;
      } catch (error) {
        console.error('PushSaaS: Error checking subscription status:', error);
        return false;
      }
    },

    createLightbox1: function () {
      // Crear overlay
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
      document.body.appendChild(overlay);

      // Event listeners
      document.getElementById('pushsaas-cancel').addEventListener('click', () => {
        this.closePrompt(overlay);
      });

      document.getElementById('pushsaas-approve').addEventListener('click', () => {
        this.handleSubscribe(overlay);
      });

      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this.closePrompt(overlay);
        }
      });
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
        // Solicitar permisos
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          alert('Notifications were denied. Please enable them in your browser settings.');
          return;
        }

        // Registrar Service Worker
        const swReg = await navigator.serviceWorker.register('/pushsaas-sw.js');
        await navigator.serviceWorker.ready;

        // Obtener clave VAPID
        const response = await fetch(`${apiBase}/vapid-public-key`);
        const { publicKey } = await response.json();

        // Crear suscripción
        const subscription = await swReg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(publicKey)
        });

        // Enviar suscripción al servidor
        const subscriptionData = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('p256dh')))),
            auth: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('auth'))))
          }
        };

        if (config.siteId) {
          subscriptionData.siteId = config.siteId;
        }

        await fetch(`${apiBase}/subscribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscriptionData)
        });

        // Cerrar prompt
        this.closePrompt(promptElement);

        // Mostrar confirmación
        console.log('PushSaaS: Successfully subscribed to notifications');

        // Opcional: mostrar notificación de bienvenida
        if ('serviceWorker' in navigator && 'Notification' in window) {
          navigator.serviceWorker.ready.then(registration => {
            registration.showNotification('Welcome!', {
              body: 'You have successfully subscribed to notifications.',
              icon: '/icon-192.png',
              badge: '/badge-72.png'
            });
          });
        }

      } catch (error) {
        console.error('PushSaaS: Error subscribing to notifications:', error);
        alert('Error subscribing to notifications. Please try again.');
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

  // Auto-inicializar si hay configuración en el query string (para demo)
  if (window.location.search.includes('config=')) {
    const urlParams = new URLSearchParams(window.location.search);
    const configParam = urlParams.get('config');
    if (configParam) {
      try {
        const parsedConfig = JSON.parse(decodeURIComponent(configParam));
        window.PushSaaS.init(parsedConfig);
      } catch (error) {
        console.error('PushSaaS: Error parsing config from URL:', error);
      }
    }
  }

})();
