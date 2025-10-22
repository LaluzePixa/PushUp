# PushSaaS 🚀

MVP de un **SaaS para envío de notificaciones push** construido con Node.js, Express y PostgreSQL.

El proyecto está montado con **Docker Compose** y se compone de cuatro servicios:

- **api** → Backend Node.js + Express que expone la API REST con autenticación JWT
- **db** → Base de datos PostgreSQL 16 para almacenar usuarios y suscripciones  
- **frontend** → Panel de administración moderno con React + Shadcn/ui
- **client** → Cliente web de pruebas que simula la integración del snippet

## ✨ Características

- 📡 **API REST** con autenticación JWT y gestión de usuarios
- 🔐 **Sistema de roles** (superadmin, admin, user) con permisos granulares
- 🎨 **Interfaz moderna** construida con React + Shadcn/ui + Tailwind CSS
- 👥 **Gestión de usuarios** completa con activación/desactivación
- 📤 **Envío de notificaciones** con filtros avanzados (usuario, sitio, etc.)
- 🗄️ **Base de datos PostgreSQL** para persistencia de usuarios y suscripciones
- 🌐 **Service Worker** para recepción de notificaciones
- 🐳 **Dockerizado** para fácil despliegue

## 📋 Prerrequisitos

- [Docker](https://docs.docker.com/get-docker/) >= 20.0
- [Docker Compose](https://docs.docker.com/compose/install/) >= 2.0

## 📂 Estructura del proyecto

```
pushsaas/
├── docker-compose.yml
├── server/                    # API (Node.js + Express + JWT)
│   ├── Dockerfile
│   ├── package.json
│   ├── src/
│   │   ├── index.js          # Servidor principal
│   │   ├── middleware/
│   │   │   └── auth.js       # Middlewares de autenticación
│   │   └── routes/
│   │       ├── auth.js       # Rutas de autenticación
│   │       └── users.js      # Rutas de gestión de usuarios
│   ├── public/
│   │   ├── pushsaas.js       # Snippet para clientes
│   │   ├── pushsaas-sw.js    # Service Worker
│   │   ├── admin.html        # Panel de administración (legacy)
│   │   └── demo.html         # Demo interna
│   └── scripts/
│       ├── migrate.js        # Migraciones de BD
│       └── genVapid.js       # Generador de claves VAPID
├── frontend/                  # Panel moderno (React + Shadcn/ui)
│   ├── Dockerfile
│   ├── package.json
│   ├── src/
│   │   ├── components/       # Componentes React
│   │   ├── contexts/         # Contextos (Auth)
│   │   ├── services/         # Servicios API
│   │   └── types/            # Tipos TypeScript
│   └── nginx.conf           # Configuración Nginx con proxy
└── client/                   # Cliente web de pruebas
    ├── index.html
    └── pushsaas-sw.js
```

## 🚀 Instalación y configuración

### 1. Clonar el repositorio

```bash
git clone <repo-url> pushsaas
cd pushsaas
```

### 2. Construir y arrancar contenedores

```bash
docker compose up -d --build
```

### 3. Generar claves VAPID

```bash
docker compose run --rm api node scripts/genVapid.js
```

Copia los valores generados y créalos en `server/.env`:

```env
VAPID_PUBLIC_KEY=tu_clave_publica_aqui
VAPID_PRIVATE_KEY=tu_clave_privada_aqui
VAPID_SUBJECT=mailto:tu@email.com
DATABASE_URL=postgresql://pushsaas:pushsaas@db:5432/pushsaas
PORT=3000
```

⚠️ **Importante**: El `VAPID_SUBJECT` debe ser una URL válida, normalmente un `mailto:`.

### 4. Reiniciar la API

```bash
docker compose restart api
```

## 🧪 Pruebas

### Cliente de pruebas
- **URL**: http://localhost:8080
- **Función**: Registra el Service Worker y se suscribe al backend

### 🎛️ Panel de Administración Moderno (Shadcn/ui)
- **URL**: http://localhost:8080
- **Credenciales**: `admin@pushsaas.local` / `admin123`
- **Funcionalidades**:
  - 🔐 Sistema de autenticación con JWT
  - 👥 Gestión completa de usuarios con roles
  - 📤 Envío de notificaciones con filtros avanzados
  - 📊 Dashboard con métricas del sistema
  - ⚙️ Configuración del sistema

### 📱 Cliente de Pruebas (Legacy)
- **URL**: http://localhost:8081
- **Función**: Registra el Service Worker y se suscribe al backend

### 🔧 Panel de Administración Legacy
- **URL**: http://localhost:3000/admin
- **Función**: Interfaz HTML simple para envío de notificaciones

### Flujo de prueba completo

1. **Accede al panel moderno**: http://localhost:8080
2. **Inicia sesión** con `admin@pushsaas.local` / `admin123`
3. **Gestiona usuarios** en la pestaña "Usuarios"
4. **Envía notificaciones** desde la pestaña "Notificaciones"
5. **Prueba suscripciones** en http://localhost:8081

## 📡 API Endpoints

### `GET /healthz`
Endpoint de health check.

**Respuesta:**
```
ok
```

### `GET /vapid-public-key`
Obtiene la clave pública VAPID.

**Respuesta:**
```json
{
  "publicKey": "tu_clave_publica_vapid"
}
```

### `POST /subscribe`
Registra una nueva suscripción push.

**Body:**
```json
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/...",
  "keys": {
    "p256dh": "clave_p256dh",
    "auth": "clave_auth"
  }
}
```

**Respuesta:**
```json
{
  "message": "Suscripción guardada"
}
```

### `POST /send`
Envía una notificación push a todas las suscripciones.

**Body:**
```json
{
  "title": "Título de la notificación",
  "body": "Mensaje de la notificación",
  "url": "https://ejemplo.com"
}
```

**Respuesta:**
```json
{
  "message": "Notificaciones enviadas",
  "sent": 5,
  "failed": 0
}
```

## 🛠️ Comandos útiles

### Ver logs de la API
```bash
docker compose logs -f api
```

### Acceder a la base de datos
```bash
docker compose exec db psql -U pushsaas -d pushsaas
```

### Ver suscripciones guardadas
```bash
docker compose exec db psql -U pushsaas -d pushsaas -c "SELECT COUNT(*) FROM subscriptions;"
```

### Parar todos los servicios
```bash
docker compose down
```

### Limpiar volúmenes (⚠️ elimina datos)
```bash
docker compose down -v
```

## 🚧 Limitaciones actuales

- ❌ El endpoint `/send` está abierto sin autenticación (solo para pruebas locales)
- ❌ No hay soporte multi-tenant (todas las suscripciones van a la misma tabla)
- ❌ Solo funciona en `http://localhost`; en producción las Push requieren HTTPS
- ❌ No hay validación de datos de entrada
- ❌ No hay rate limiting

## 🔮 Roadmap

### Próximas funcionalidades
- [ ] 🔐 Autenticación API con tokens
- [ ] 🔒 HTTPS con certificados SSL (Caddy/Traefik)
- [ ] 🏢 Sistema multi-tenant con `site_id`
- [ ] 📊 Panel de administración más completo
- [ ] 📈 Métricas y analytics
- [ ] ⚡ Rate limiting y validación de datos
- [ ] 🎨 Personalización de notificaciones (iconos, acciones)
- [ ] 📱 Soporte para diferentes tipos de notificaciones

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Añade nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.