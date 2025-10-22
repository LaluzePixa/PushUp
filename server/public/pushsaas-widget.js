/**
 * PushSaaS Subscription Bell Widget
 * Este script debe ser integrado por los clientes en sus sitios web
 */

class PushSaaSWidget {
    constructor(config = {}) {
        this.config = {
            // URL del servidor PushSaaS
            serverUrl: config.serverUrl || 'http://localhost:3000',
            // ID del sitio del cliente (debe ser proporcionado)
            siteId: config.siteId || null,
            // Configuración por defecto
            position: 'bottom-right',
            theme: 'dark',
            debug: config.debug || false,
            ...config
        };

        this.isSubscribed = false;
        this.subscription = null;
        this.bellConfig = null;
        this.isVisible = false;

        this.init();
    }

    log(...args) {
        if (this.config.debug) {
            console.log('[PushSaaS Widget]', ...args);
        }
    }

    async init() {
        try {
            this.log('Inicializando widget...');

            if (!this.config.siteId) {
                console.error('[PushSaaS Widget] Error: siteId es requerido');
                return;
            }

            // Cargar configuración del servidor
            await this.loadConfig();

            // Solo mostrar si está activo
            if (!this.bellConfig?.isActive) {
                this.log('Widget desactivado en configuración');
                return;
            }

            // Verificar soporte de service workers
            if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
                this.log('Push notifications no soportadas en este navegador');
                return;
            }

            // Registrar service worker
            await this.registerServiceWorker();

            // Verificar estado de suscripción actual
            await this.checkSubscriptionStatus();

            // Crear y mostrar el widget
            this.createWidget();

            this.log('Widget inicializado correctamente');
        } catch (error) {
            console.error('[PushSaaS Widget] Error en inicialización:', error);
        }
    }

    async loadConfig() {
        try {
            const response = await fetch(`${this.config.serverUrl}/api/subscription-bell/widget-config`);
            const data = await response.json();

            if (data.success) {
                this.bellConfig = data.data;
                this.log('Configuración cargada:', this.bellConfig);
            } else {
                throw new Error('Error al cargar configuración');
            }
        } catch (error) {
            this.log('Error cargando configuración, usando defaults');
            // Configuración por defecto si falla
            this.bellConfig = {
                isActive: true,
                position: 'Bottom Right',
                theme: 'Dark',
                themeColor: '#4A90E2',
                defaultTitle: 'Suscríbete para recibir notificaciones',
                defaultButtonText: 'SUSCRIBIRSE',
                subscribedTitle: 'Estás suscrito a las notificaciones',
                subscribedButtonText: 'DESUSCRIBIRSE',
                unsubscribedTitle: 'No estás suscrito a las notificaciones',
                unsubscribedButtonText: 'SUSCRIBIRSE',
                showLastNotifications: true,
                defaultHeading: 'Notificaciones recientes:',
                subscribedHeading: 'Notificaciones recientes'
            };
        }
    }

    async registerServiceWorker() {
        try {
            const registration = await navigator.serviceWorker.register('/pushsaas-sw.js');
            this.log('Service Worker registrado:', registration);
            return registration;
        } catch (error) {
            this.log('Error registrando Service Worker:', error);
            throw error;
        }
    }

    async checkSubscriptionStatus() {
        try {
            const registration = await navigator.serviceWorker.ready;
            this.subscription = await registration.pushManager.getSubscription();
            this.isSubscribed = !!this.subscription;
            this.log('Estado de suscripción:', this.isSubscribed);
        } catch (error) {
            this.log('Error verificando suscripción:', error);
        }
    }

    createWidget() {
        // Crear contenedor principal
        this.widgetContainer = document.createElement('div');
        this.widgetContainer.id = 'pushsaas-widget';
        this.setContainerStyles();

        // Crear icono de campana
        this.createBellIcon();

        // Crear modal de suscripción
        this.createSubscriptionModal();

        // Agregar al DOM
        document.body.appendChild(this.widgetContainer);
    }

    setContainerStyles() {
        const position = this.bellConfig.position.toLowerCase();
        const styles = {
            position: 'fixed',
            zIndex: '10000',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        };

        // Posicionamiento
        if (position.includes('bottom')) {
            styles.bottom = '20px';
        } else {
            styles.top = '20px';
        }

        if (position.includes('right')) {
            styles.right = '20px';
        } else {
            styles.left = '20px';
        }

        Object.assign(this.widgetContainer.style, styles);
    }

    createBellIcon() {
        this.bellIcon = document.createElement('div');
        this.bellIcon.innerHTML = '🔔';

        const iconStyles = {
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            backgroundColor: this.bellConfig.themeColor,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            cursor: 'pointer',
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
            transition: 'all 0.3s ease',
            userSelect: 'none'
        };

        Object.assign(this.bellIcon.style, iconStyles);

        // Efectos hover
        this.bellIcon.addEventListener('mouseenter', () => {
            this.bellIcon.style.transform = 'scale(1.1)';
            this.bellIcon.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
        });

        this.bellIcon.addEventListener('mouseleave', () => {
            this.bellIcon.style.transform = 'scale(1)';
            this.bellIcon.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
        });

        // Click para mostrar modal
        this.bellIcon.addEventListener('click', () => {
            this.toggleModal();
        });

        this.widgetContainer.appendChild(this.bellIcon);
    }

    createSubscriptionModal() {
        this.modal = document.createElement('div');
        this.modal.style.display = 'none';

        const modalStyles = {
            position: 'absolute',
            bottom: '60px',
            right: '0',
            width: '320px',
            backgroundColor: 'white',
            borderRadius: '10px',
            boxShadow: '0 5px 25px rgba(0,0,0,0.2)',
            padding: '20px',
            zIndex: '10001'
        };

        if (this.bellConfig.position.toLowerCase().includes('left')) {
            modalStyles.right = 'auto';
            modalStyles.left = '0';
        }

        if (this.bellConfig.position.toLowerCase().includes('top')) {
            modalStyles.bottom = 'auto';
            modalStyles.top = '60px';
        }

        Object.assign(this.modal.style, modalStyles);

        // Crear contenido del modal
        this.updateModalContent();

        this.widgetContainer.appendChild(this.modal);

        // Cerrar modal al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (!this.widgetContainer.contains(e.target)) {
                this.hideModal();
            }
        });
    }

    updateModalContent() {
        const state = this.isSubscribed ? 'subscribed' : 'default';
        let title, buttonText, buttonAction;

        if (state === 'subscribed') {
            title = this.bellConfig.subscribedTitle;
            buttonText = this.bellConfig.subscribedButtonText;
            buttonAction = () => this.unsubscribe();
        } else {
            title = this.bellConfig.defaultTitle;
            buttonText = this.bellConfig.defaultButtonText;
            buttonAction = () => this.subscribe();
        }

        this.modal.innerHTML = `
      <div style="margin-bottom: 15px;">
        <button onclick="document.getElementById('pushsaas-widget').querySelector('.modal').style.display='none'" 
                style="float: right; background: none; border: none; font-size: 18px; cursor: pointer; color: #999;">×</button>
        <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #333; line-height: 1.4;">${title}</h3>
      </div>
      
      ${this.bellConfig.showLastNotifications ? this.createNotificationsSection() : ''}
      
      <button onclick="this.clickHandler()" 
              style="width: 100%; padding: 12px; background: ${this.bellConfig.themeColor}; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 14px;">
        ${buttonText}
      </button>
    `;

        // Agregar event listener al botón
        const button = this.modal.querySelector('button:last-child');
        button.clickHandler = buttonAction;
    }

    createNotificationsSection() {
        // En una implementación real, esto cargaría las notificaciones reales
        return `
      <div style="margin-bottom: 15px;">
        <h4 style="margin: 0 0 10px 0; font-size: 14px; color: #666;">${this.bellConfig.defaultHeading}</h4>
        <div style="space-y: 8px;">
          <div style="padding: 8px; background: #f0f8ff; border: 1px solid #b3d9ff; border-radius: 4px; margin-bottom: 5px;">
            <div style="font-size: 12px; font-weight: 500; color: #0066cc;">¡Bienvenido a nuestro sitio!</div>
            <div style="font-size: 10px; color: #999;">Hace 2 horas</div>
          </div>
          <div style="padding: 8px; background: #f0f8ff; border: 1px solid #b3d9ff; border-radius: 4px;">
            <div style="font-size: 12px; font-weight: 500; color: #0066cc;">Nuevas funciones disponibles</div>
            <div style="font-size: 10px; color: #999;">Ayer</div>
          </div>
        </div>
      </div>
    `;
    }

    async subscribe() {
        try {
            this.log('Iniciando suscripción...');

            // Solicitar permiso
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                alert('Los permisos de notificación son necesarios para suscribirse');
                return;
            }

            // Obtener clave pública VAPID
            const vapidResponse = await fetch(`${this.config.serverUrl}/vapid-public-key`);
            const vapidData = await vapidResponse.json();

            if (!vapidData.success) {
                throw new Error('Error obteniendo clave VAPID');
            }

            // Crear suscripción
            const registration = await navigator.serviceWorker.ready;
            this.subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(vapidData.data.publicKey)
            });

            // Enviar suscripción al servidor
            const subscribeResponse = await fetch(`${this.config.serverUrl}/subscribe`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...this.subscription.toJSON(),
                    siteId: this.config.siteId
                })
            });

            const subscribeData = await subscribeResponse.json();

            if (subscribeData.success) {
                this.isSubscribed = true;
                this.updateModalContent();
                this.log('Suscripción exitosa');
                this.showNotification('¡Suscripción exitosa!', 'Ahora recibirás nuestras notificaciones');
            } else {
                throw new Error(subscribeData.message || 'Error en suscripción');
            }
        } catch (error) {
            console.error('[PushSaaS Widget] Error en suscripción:', error);
            alert('Error al suscribirse. Por favor, inténtalo de nuevo.');
        }
    }

    async unsubscribe() {
        try {
            this.log('Cancelando suscripción...');

            if (this.subscription) {
                await this.subscription.unsubscribe();
                this.subscription = null;
                this.isSubscribed = false;
                this.updateModalContent();
                this.log('Suscripción cancelada');
                this.showNotification('Suscripción cancelada', 'Ya no recibirás notificaciones');
            }
        } catch (error) {
            console.error('[PushSaaS Widget] Error cancelando suscripción:', error);
            alert('Error al cancelar suscripción. Por favor, inténtalo de nuevo.');
        }
    }

    showNotification(title, body) {
        if (Notification.permission === 'granted') {
            new Notification(title, { body, icon: '/favicon.ico' });
        }
    }

    toggleModal() {
        if (this.modal.style.display === 'none') {
            this.showModal();
        } else {
            this.hideModal();
        }
    }

    showModal() {
        this.modal.style.display = 'block';
        this.isVisible = true;
    }

    hideModal() {
        this.modal.style.display = 'none';
        this.isVisible = false;
    }

    // Utility function para convertir VAPID key
    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }
}

// Auto-inicialización si hay configuración en la página
if (typeof window !== 'undefined') {
    // Buscar configuración en meta tags o variables globales
    const siteIdMeta = document.querySelector('meta[name="pushsaas-site-id"]');
    const serverUrlMeta = document.querySelector('meta[name="pushsaas-server-url"]');

    if (siteIdMeta) {
        const config = {
            siteId: siteIdMeta.getAttribute('content'),
            serverUrl: serverUrlMeta ? serverUrlMeta.getAttribute('content') : 'http://localhost:3000',
            debug: true // En producción debería ser false
        };

        // Inicializar cuando el DOM esté listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                window.pushSaaSWidget = new PushSaaSWidget(config);
            });
        } else {
            window.pushSaaSWidget = new PushSaaSWidget(config);
        }
    }
}

// Exportar para uso manual
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PushSaaSWidget;
} else if (typeof window !== 'undefined') {
    window.PushSaaSWidget = PushSaaSWidget;
}