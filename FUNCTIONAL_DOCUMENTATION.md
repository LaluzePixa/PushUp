# PushSaaS - Documentación Funcional Completa

## 📋 Índice
1. [Visión General del Sistema](#visión-general-del-sistema)
2. [Arquitectura de la Aplicación](#arquitectura-de-la-aplicación)
3. [Funcionalidades del Backend (Server)](#funcionalidades-del-backend-server)
4. [Funcionalidades del Frontend](#funcionalidades-del-frontend)
5. [Flujos de Usuario Principales](#flujos-de-usuario-principales)
6. [Modelo de Datos](#modelo-de-datos)
7. [API Endpoints](#api-endpoints)
8. [Servicios y Componentes Clave](#servicios-y-componentes-clave)
9. [Seguridad y Autenticación](#seguridad-y-autenticación)
10. [Integración y Configuración](#integración-y-configuración)

---

## 📊 Visión General del Sistema

**PushSaaS** es una plataforma SaaS (Software as a Service) completa para gestión de notificaciones push web. Permite a los usuarios crear, gestionar y enviar notificaciones push a sus suscriptores de manera eficiente y escalable.

### 🎯 Objetivos Principales
- **Gestión de Usuarios Multi-tenant**: Cada usuario puede gestionar múltiples sitios web
- **Campañas de Notificaciones**: Crear y programar notificaciones push personalizadas
- **Segmentación de Audiencias**: Dirigir campañas a grupos específicos de usuarios
- **Analytics y Métricas**: Seguimiento detallado del rendimiento de las campañas
- **Integración Simple**: Fácil implementación en sitios web existentes

---

## 🏗 Arquitectura de la Aplicación

### Stack Tecnológico
- **Frontend**: Next.js 14+ (React, TypeScript, TailwindCSS)
- **Backend**: Node.js + Express.js
- **Base de Datos**: PostgreSQL
- **Autenticación**: JWT (JSON Web Tokens)
- **Push Notifications**: Web Push Protocol + VAPID
- **Scheduling**: Cron Jobs

### Estructura de Directorios
```
pushsaas/
├── frontend/                   # Aplicación Next.js
│   ├── src/
│   │   ├── app/               # App Router de Next.js
│   │   ├── components/        # Componentes reutilizables
│   │   ├── contexts/          # Context API (AuthContext, SiteContext)
│   │   ├── services/          # Servicios API
│   │   ├── types/             # Definiciones TypeScript
│   │   └── lib/               # Utilidades y helpers
│   └── public/                # Assets estáticos
└── server/                     # API Backend
    ├── src/
    │   ├── routes/            # Rutas de la API
    │   ├── middleware/        # Middlewares (auth, CORS, etc.)
    │   ├── services/          # Lógica de negocio
    │   └── utils/             # Utilidades
    ├── scripts/               # Scripts de migración y utilidades
    └── public/                # Assets del cliente (widgets, service workers)
```

---

## 🔧 Funcionalidades del Backend (Server)

### 1. **Sistema de Autenticación** (`/src/routes/auth.js`)

#### Funcionalidades:
- **Registro de usuarios**: Validación de email, hash seguro de contraseñas
- **Login con JWT**: Autenticación basada en tokens
- **Verificación de sesiones**: Middleware de autenticación
- **Cambio de contraseñas**: Con validación de contraseña actual
- **Roles de usuario**: `user`, `admin`, `superadmin`

#### Validaciones de Seguridad:
- Contraseñas mínimo 12 caracteres
- Requiere mayúsculas, minúsculas, números y símbolos
- Protección contra ataques de fuerza bruta
- Tokens JWT con expiración

#### Endpoints Principales:
```javascript
POST /auth/register    // Registro de nuevos usuarios
POST /auth/login       // Autenticación
GET  /auth/me          // Información del usuario actual
POST /auth/change-password // Cambio de contraseña
```

### 2. **Gestión de Sitios Web** (`/src/routes/sites.js`)

#### Funcionalidades:
- **CRUD completo de sitios**: Crear, leer, actualizar, eliminar
- **Multi-tenancy**: Cada usuario gestiona sus propios sitios
- **Validación de dominios**: Verificación de formato y unicidad
- **Limitaciones por rol**: Los usuarios regulares tienen límite de sitios
- **Métricas por sitio**: Conteo de suscriptores y campañas

#### Características:
- Soporte para múltiples sitios por usuario
- Validación de dominios con regex
- Soft delete (marcar como inactivo)
- Agregación de estadísticas en tiempo real

### 3. **Sistema de Campañas** (`/src/routes/campaigns.js`)

#### Funcionalidades Avanzadas:
- **Tipos de envío**: Inmediato, programado, borrador
- **Segmentación**: Envío a todos o a segmentos específicos
- **Programación**: Uso de Cron Jobs para envíos automáticos
- **Acciones personalizadas**: Botones con URLs en las notificaciones
- **Tracking completo**: Enviadas, entregadas, fallidas, clicadas

#### Estados de Campaña:
- `draft`: Borrador editable
- `scheduled`: Programada para envío futuro
- `sent`: Enviada exitosamente
- `cancelled`: Cancelada por el usuario

#### Métricas Avanzadas:
- Total de intentos de envío
- Notificaciones entregadas
- Clicks recibidos (CTR)
- Suscripciones expiradas o inválidas

### 4. **Gestión de Suscripciones** (`/src/index.js`)

#### Funcionalidades:
- **Registro de suscripciones**: Endpoint público para widgets
- **Validación de VAPID**: Verificación de claves push
- **Gestión de endpoints**: Limpieza automática de suscripciones inválidas
- **Soporte multi-site**: Asociación de suscripciones a sitios específicos

#### Proceso de Suscripción:
1. Cliente obtiene VAPID public key
2. Navegador genera suscripción push
3. Frontend envía suscripción al backend
4. Backend valida y almacena en PostgreSQL

### 5. **Sistema de Segmentos** (`/src/routes/segments.js`)

#### Funcionalidades:
- **Segmentación dinámica**: Filtros basados en condiciones JSON
- **Criterios flexibles**: Por fecha, user agent, IP, sitio
- **Evaluación en tiempo real**: Función de evaluación de condiciones
- **Reutilización**: Un segmento puede usarse en múltiples campañas

#### Ejemplo de Condiciones:
```json
{
  "conditions": [
    {
      "field": "created_at",
      "operator": "after",
      "value": "2024-01-01"
    },
    {
      "field": "site_id",
      "operator": "equals",
      "value": 1
    }
  ]
}
```

### 6. **Dashboard y Analytics** (`/src/routes/dashboard.js`)

#### Métricas Principales:
- **Suscriptores totales**: Por usuario y por sitio
- **Campañas enviadas**: Totales y por período
- **Tasas de entrega**: Porcentajes de éxito
- **Métricas de engagement**: CTR, conversiones

#### Funcionalidades de Reporting:
- Gráficos de crecimiento temporal
- Comparativas entre campañas
- Métricas de rendimiento por sitio
- Exportación de datos

### 7. **Gestión de Usuarios** (`/src/routes/users.js`)

#### Funcionalidades Administrativas:
- **CRUD de usuarios**: Solo para administradores
- **Gestión de roles**: Asignación y modificación
- **Paginación**: Listado eficiente con filtros
- **Búsqueda**: Por email, rol, estado

### 8. **Sistema de Opt-ins** (`/src/routes/optins.js`)

#### Funcionalidades:
- **Configuración visual**: Personalización de prompts
- **Triggers dinámicos**: Mostrar en diferentes momentos
- **A/B Testing**: Múltiples variantes
- **Métricas de conversión**: Tasas de opt-in

### 9. **Subscription Bell** (`/src/routes/subscriptionBell.js`)

#### Widget Personalizable:
- **Icono flotante**: Para sitios web
- **Configuración visual**: Colores, posición, animaciones
- **Estado dinámico**: Suscrito/no suscrito
- **Integración simple**: Un solo script

---

## 🖥 Funcionalidades del Frontend

### 1. **Sistema de Autenticación** (`/src/contexts/AuthContext.tsx`)

#### Context API Robusto:
- **Estado global**: Usuario, loading, autenticación
- **Hooks personalizados**: `useAuth`, `useRequireAuth`, `useRequireAdmin`
- **Verificación automática**: Check de sesión en background
- **Redirección inteligente**: Basada en roles y estado

#### Características de Seguridad:
- Verificación de tokens en cliente
- Renovación automática de sesiones
- Logout automático por expiración
- Protección de rutas por roles

### 2. **Gestión de Sitios** (`/src/contexts/SiteContext.tsx`)

#### Context de Multi-tenancy:
- **Selector de sitio activo**: Componente dropdown
- **Persistencia**: LocalStorage para recordar selección
- **Filtrado automático**: Datos por sitio seleccionado
- **Cambio dinámico**: Sin recarga de página

### 3. **Componentes de UI**

#### Sidebar Optimizado (`/src/components/sidebar-optimized.tsx`):
- **Navegación jerárquica**: Menús y submenús
- **Estado activo**: Highlighting de ruta actual
- **Collapsible**: Expansión/contracción de secciones
- **Theme switcher**: Modo claro/oscuro
- **User dropdown**: Acciones de usuario

#### Componentes Especializados:
- **`SiteSelector`**: Selector de sitios multi-tenant
- **`UserDropdown`**: Menú de usuario con acciones
- **`ContactUsModal`**: Modal de contacto
- **`CreateCampaignModal`**: Creación de campañas
- **`CreateSegmentModal`**: Creación de segmentos

### 4. **Servicios API** (`/src/services/`)

#### Arquitectura Modular:
```typescript
// services/api-client.ts - Cliente HTTP base
// services/auth.service.ts - Autenticación
// services/sites.service.ts - Gestión de sitios
// services/campaigns.service.ts - Campañas
// services/segments.service.ts - Segmentos
// services/dashboard.service.ts - Métricas
// services/users.service.ts - Gestión de usuarios
// services/push.service.ts - Notificaciones push
// services/optins.service.ts - Opt-ins
```

#### Cliente HTTP Robusto:
- **Interceptores**: Autenticación automática
- **Manejo de errores**: Responses unificados
- **Retry logic**: Reintentos automáticos
- **Loading states**: Estados de carga

### 5. **Páginas y Rutas**

#### App Router de Next.js:
```
app/
├── (auth)/                    # Rutas de autenticación
│   ├── login/
│   └── register/
├── (main)/                    # Aplicación principal
│   ├── dashboard/             # Dashboard y analytics
│   ├── campaigns/             # Gestión de campañas
│   ├── segments/              # Segmentación
│   ├── subscribers/           # Lista de suscriptores
│   ├── (integration)/         # Herramientas de integración
│   ├── (setup)/              # Configuración
│   └── (logs)/               # Logs y monitoreo
└── api/                       # API Routes de Next.js
```

#### Características de Routing:
- **Grupos de rutas**: Organización lógica
- **Layouts anidados**: Diferentes layouts por sección
- **Middleware**: Protección de rutas
- **Páginas dinámicas**: `[id]`, `[...slug]`

---

## 👥 Flujos de Usuario Principales

### 1. **Flujo de Registro y Onboarding**

```mermaid
graph TD
    A[Registro] --> B[Verificación Email]
    B --> C[Login]
    C --> D[Seleccionar/Crear Sitio]
    D --> E[Configurar Integración]
    E --> F[Primera Campaña]
```

#### Pasos Detallados:
1. **Registro**: Email + contraseña segura
2. **Verificación**: Confirmación por email (opcional)
3. **Login**: Autenticación JWT
4. **Setup de sitio**: Nombre, dominio, configuración
5. **Integración**: Snippet de código para el sitio
6. **Primera campaña**: Tutorial guiado

### 2. **Flujo de Creación de Campaña**

```mermaid
graph TD
    A[Nueva Campaña] --> B[Configurar Contenido]
    B --> C[Seleccionar Audiencia]
    C --> D[Programar Envío]
    D --> E[Previsualización]
    E --> F[Confirmar y Enviar]
    F --> G[Monitoreo en Tiempo Real]
```

#### Configuraciones Disponibles:
- **Contenido**: Título, mensaje, iconos, imágenes
- **Acciones**: Botones con URLs personalizadas
- **Audiencia**: Todos los suscriptores o segmentos específicos
- **Programación**: Inmediato, programado, borrador
- **Configuración avanzada**: TTL, badge, sonidos

### 3. **Flujo de Integración en Sitio Web**

```mermaid
graph TD
    A[Generar Código] --> B[Insertar en HTML]
    B --> C[Configurar Service Worker]
    C --> D[Probar Suscripción]
    D --> E[Verificar en Dashboard]
```

#### Métodos de Integración:
1. **Manual**: Snippet JavaScript directo
2. **Subscription Bell**: Widget flotante
3. **API REST**: Integración programática
4. **WordPress Plugin**: Plugin dedicado (próximamente)

### 4. **Flujo de Gestión de Suscriptores**

```mermaid
graph TD
    A[Suscriptor Visita Sitio] --> B[Prompt de Opt-in]
    B --> C[Acepta Notificaciones]
    C --> D[Registro en Base de Datos]
    D --> E[Asignación a Segmentos]
    E --> F[Elegible para Campañas]
```

#### Gestión Avanzada:
- **Segmentación automática**: Por comportamiento, ubicación, tiempo
- **Limpieza automática**: Eliminación de suscripciones inválidas
- **GDPR Compliance**: Opt-out fácil y transparente
- **Analytics**: Métricas de crecimiento y churn

---

## 🗄 Modelo de Datos

### Entidades Principales

#### 1. **Users** (Usuarios)
```sql
users {
  id: SERIAL PRIMARY KEY
  email: VARCHAR(255) UNIQUE
  password_hash: VARCHAR(255)
  role: ENUM('user', 'admin', 'superadmin')
  is_active: BOOLEAN
  created_at: TIMESTAMPTZ
  updated_at: TIMESTAMPTZ
}
```

#### 2. **Sites** (Sitios Web)
```sql
sites {
  id: SERIAL PRIMARY KEY
  user_id: INTEGER REFERENCES users(id)
  name: VARCHAR(255)
  domain: VARCHAR(255)
  description: TEXT
  is_active: BOOLEAN
  created_at: TIMESTAMPTZ
  updated_at: TIMESTAMPTZ
}
```

#### 3. **Subscriptions** (Suscripciones Push)
```sql
subscriptions {
  id: SERIAL PRIMARY KEY
  endpoint: TEXT UNIQUE
  p256dh: TEXT
  auth: TEXT
  user_agent: TEXT
  ip: TEXT
  user_id: INTEGER REFERENCES users(id)
  site_id: INTEGER REFERENCES sites(id)
  created_at: TIMESTAMPTZ
  updated_at: TIMESTAMPTZ
}
```

#### 4. **Campaigns** (Campañas)
```sql
campaigns {
  id: SERIAL PRIMARY KEY
  user_id: INTEGER REFERENCES users(id)
  site_id: INTEGER REFERENCES sites(id)
  segment_id: INTEGER REFERENCES audience_segments(id)
  name: VARCHAR(255)
  title: VARCHAR(255)
  body: TEXT
  icon_url: TEXT
  image_url: TEXT
  click_url: TEXT
  badge_url: TEXT
  status: ENUM('draft', 'scheduled', 'sent', 'cancelled')
  send_type: ENUM('immediate', 'scheduled', 'draft')
  scheduled_at: TIMESTAMPTZ
  sent_at: TIMESTAMPTZ
  total_sent: INTEGER
  total_delivered: INTEGER
  total_failed: INTEGER
  total_clicked: INTEGER
  created_at: TIMESTAMPTZ
  updated_at: TIMESTAMPTZ
}
```

#### 5. **Audience Segments** (Segmentos de Audiencia)
```sql
audience_segments {
  id: SERIAL PRIMARY KEY
  user_id: INTEGER REFERENCES users(id)
  site_id: INTEGER REFERENCES sites(id)
  name: VARCHAR(255)
  description: TEXT
  conditions: JSONB
  created_at: TIMESTAMPTZ
  updated_at: TIMESTAMPTZ
}
```

#### 6. **Campaign Executions** (Ejecuciones de Campaña)
```sql
campaign_executions {
  id: SERIAL PRIMARY KEY
  campaign_id: INTEGER REFERENCES campaigns(id)
  subscription_id: INTEGER REFERENCES subscriptions(id)
  endpoint: TEXT
  status: ENUM('pending', 'sent', 'delivered', 'failed', 'clicked')
  error_message: TEXT
  sent_at: TIMESTAMPTZ
  delivered_at: TIMESTAMPTZ
  clicked_at: TIMESTAMPTZ
  created_at: TIMESTAMPTZ
}
```

### Relaciones Clave

```mermaid
erDiagram
    Users ||--o{ Sites : owns
    Users ||--o{ Campaigns : creates
    Users ||--o{ AudienceSegments : defines
    Sites ||--o{ Subscriptions : has
    Sites ||--o{ Campaigns : targets
    Campaigns ||--o{ CampaignExecutions : generates
    AudienceSegments ||--o{ Campaigns : targets
    Subscriptions ||--o{ CampaignExecutions : receives
```

---

## 🔌 API Endpoints

### Autenticación
```
POST   /auth/register         # Registro de usuario
POST   /auth/login            # Login
GET    /auth/me               # Información del usuario
POST   /auth/change-password  # Cambio de contraseña
```

### Sitios
```
GET    /sites                 # Listar sitios del usuario
POST   /sites                 # Crear nuevo sitio
GET    /sites/:id             # Obtener sitio específico
PUT    /sites/:id             # Actualizar sitio
DELETE /sites/:id             # Eliminar sitio
GET    /sites/:id/subscriptions # Suscripciones del sitio
```

### Campañas
```
GET    /campaigns             # Listar campañas
POST   /campaigns             # Crear campaña
GET    /campaigns/:id         # Obtener campaña específica
PUT    /campaigns/:id         # Actualizar campaña
DELETE /campaigns/:id         # Eliminar campaña
POST   /campaigns/:id/send    # Enviar campaña inmediatamente
```

### Suscripciones
```
GET    /vapid-public-key      # Obtener clave pública VAPID
POST   /subscribe             # Registrar suscripción
POST   /send                  # Enviar notificación (admin)
```

### Segmentos
```
GET    /segments              # Listar segmentos
POST   /segments              # Crear segmento
GET    /segments/:id          # Obtener segmento específico
PUT    /segments/:id          # Actualizar segmento
DELETE /segments/:id          # Eliminar segmento
POST   /segments/:id/preview  # Previsualizar audiencia
```

### Dashboard
```
GET    /dashboard/metrics     # Métricas generales
GET    /dashboard/analytics   # Analytics avanzados
GET    /dashboard/campaigns/recent # Campañas recientes
```

### Usuarios (Admin)
```
GET    /users                 # Listar usuarios
GET    /users/:id             # Obtener usuario específico
PUT    /users/:id             # Actualizar usuario
DELETE /users/:id             # Eliminar usuario
```

---

## 🛠 Servicios y Componentes Clave

### 1. **Campaign Scheduler** (`/src/services/campaignScheduler.js`)

#### Funcionalidades:
- **Cron Jobs**: Programación de envíos automáticos
- **Gestión de memoria**: Map de trabajos programados
- **Reintentos**: Logic de retry para fallos
- **Limpieza automática**: Eliminación de jobs completados

#### Ejemplo de Uso:
```javascript
const job = new CronJob(scheduledDate, async () => {
  await executeCampaign(pool, campaignId);
  scheduledJobs.delete(campaignId);
});
job.start();
scheduledJobs.set(campaignId, job);
```

### 2. **VAPID Management**

#### Configuración:
```javascript
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);
```

#### Generación de Claves:
```bash
# Script incluido
node scripts/genVapid.js
```

### 3. **Middleware de Autenticación** (`/src/middleware/auth.js`)

#### Componentes:
- **`authenticateToken`**: Verificación JWT obligatoria
- **`optionalAuth`**: Autenticación opcional para rutas públicas
- **`authorizeRoles`**: Control de acceso por roles
- **`authorizeOwnerOrAdmin`**: Verificación de propiedad o admin

### 4. **Cliente API Frontend** (`/src/services/api-client.ts`)

#### Características:
- **Interceptores automáticos**: Inyección de tokens
- **Manejo de errores**: Responses tipados
- **Token refresh**: Renovación automática
- **Health check**: Verificación de conectividad

---

## 🔒 Seguridad y Autenticación

### 1. **Autenticación JWT**

#### Flujo de Tokens:
1. Login genera JWT con payload del usuario
2. Token se almacena en localStorage y cookie
3. Requests incluyen token en header Authorization
4. Backend verifica y extrae información del usuario

#### Configuración de Seguridad:
```javascript
// Expiración de tokens
const TOKEN_EXPIRY = '24h';

// Algoritmo de hash para contraseñas
const SALT_ROUNDS = 10;

// Validación de contraseñas robusta
const PASSWORD_REQUIREMENTS = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSymbols: true
};
```

### 2. **CORS y Políticas de Seguridad**

#### Configuración CORS:
```javascript
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3001', 'https://yourdomain.com'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### 3. **Validación de Datos**

#### Middleware de Validación:
- Sanitización de inputs
- Validación de tipos de datos
- Prevención de inyección SQL
- Escape de caracteres especiales

### 4. **Control de Acceso por Roles**

#### Jerarquía de Roles:
- **`user`**: Acceso básico a sus propios recursos
- **`admin`**: Gestión de usuarios y configuraciones
- **`superadmin`**: Acceso completo al sistema

---

## 🔧 Integración y Configuración

### 1. **Variables de Entorno**

#### Server (.env):
```env
# Base de datos
DATABASE_URL=postgresql://user:password@localhost/pushsaas

# JWT
JWT_SECRET=your-super-secret-key

# VAPID Keys para Push Notifications
VAPID_SUBJECT=mailto:your-email@domain.com
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key

# CORS
ALLOWED_ORIGINS=http://localhost:3001,https://yourdomain.com

# Puerto
PORT=3000
```

#### Frontend (.env.local):
```env
# API Backend URL
NEXT_PUBLIC_API_URL=http://localhost:3000

# Configuraciones públicas
NEXT_PUBLIC_APP_NAME=PushSaaS
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### 2. **Scripts de Inicialización**

#### Migración de Base de Datos:
```bash
node server/scripts/migrate.js
```

#### Generación de VAPID Keys:
```bash
node server/scripts/genVapid.js
```

### 3. **Integración en Sitios Web**

#### Snippet Básico:
```html
<!-- Insertar antes del </head> -->
<script src="https://yourapi.com/pushsaas.js"></script>
<script>
  PushSaaS.init({
    siteId: 'your-site-id',
    apiKey: 'your-api-key'
  });
</script>
```

#### Service Worker:
```javascript
// En /public/pushsaas-sw.js
self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {};
  
  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    image: data.image,
    data: data.data,
    actions: data.actions
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});
```

### 4. **Docker Deployment**

#### docker-compose.yml:
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: pushsaas
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
      
  server:
    build: ./server
    environment:
      DATABASE_URL: postgresql://postgres:password@postgres:5432/pushsaas
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      
  frontend:
    build: ./frontend
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3000
    ports:
      - "3001:3000"
    depends_on:
      - server

volumes:
  postgres_data:
```

---

## 📊 Métricas y Monitoreo

### 1. **KPIs Principales**

#### Métricas de Usuario:
- Usuarios registrados
- Sitios web activos
- Tasa de retención de usuarios

#### Métricas de Engagement:
- Suscriptores totales por sitio
- Tasa de opt-in promedio
- Crecimiento de suscripciones

#### Métricas de Campañas:
- Campañas enviadas
- Tasa de entrega (delivery rate)
- Click-through rate (CTR)
- Tasa de conversión

### 2. **Dashboard Analytics**

#### Gráficos Disponibles:
- Crecimiento de suscriptores en el tiempo
- Rendimiento de campañas por día/semana/mes
- Comparativa entre sitios
- Distribución geográfica de suscriptores

#### Exportación de Datos:
- CSV de suscriptores
- Reportes de campañas
- Analytics avanzados

---

## 🚀 Funcionalidades Futuras (Roadmap)

### Próximas Implementaciones:
1. **Journey Builder**: Automatización de campañas secuenciales
2. **A/B Testing**: Testing de variantes de campañas
3. **Integración WordPress**: Plugin oficial
4. **API REST Completa**: Endpoints públicos para integración
5. **Webhooks**: Notificaciones de eventos en tiempo real
6. **Plantillas**: Biblioteca de plantillas prediseñadas
7. **Geo-targeting**: Segmentación por ubicación geográfica
8. **Analytics Avanzados**: Reportes personalizados y dashboards

---

## 📋 Conclusión

PushSaaS es una plataforma robusta y escalable que ofrece una solución completa para la gestión de notificaciones push web. Con una arquitectura moderna basada en Next.js y Node.js, proporciona todas las herramientas necesarias para crear, gestionar y analizar campañas de notificaciones efectivas.

### Fortalezas del Sistema:
- **Arquitectura escalable** con separación clara frontend/backend
- **Seguridad robusta** con autenticación JWT y validaciones estrictas
- **Multi-tenancy** completo con gestión de sitios múltiples
- **Analytics detallados** para optimización de campañas
- **Integración simple** en sitios web existentes
- **Code quality** alto con TypeScript y patrones modernos

### Tecnologías Clave:
- **Frontend**: Next.js 14, React, TypeScript, TailwindCSS
- **Backend**: Node.js, Express, PostgreSQL, JWT
- **Push**: Web Push Protocol, VAPID, Service Workers
- **DevOps**: Docker, Docker Compose, scripts de migración

Esta documentación serve como base para entender completamente el funcionamiento del sistema y facilitar el desarrollo de tests comprehensivos con Jest.