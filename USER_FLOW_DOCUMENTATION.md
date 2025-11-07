# 📋 FLUJO COMPLETO DE USUARIO NUEVO - PushSaaS

## 🎯 ÍNDICE
1. [Registro Inicial](#1-registro-inicial)
2. [Login (Usuario Existente)](#2-login-usuario-existente)
3. [Selección/Creación de Sitio](#3-seleccióncreación-de-sitio)
4. [Dashboard Principal](#4-dashboard-principal)
5. [Configuración de Opt-in Prompt](#5-configuración-de-opt-in-prompt)
6. [Otras Páginas Disponibles](#6-otras-páginas-disponibles)
7. [Arquitectura de Contextos y Servicios](#7-arquitectura-de-contextos-y-servicios)

---

## 1. REGISTRO INICIAL

### 📍 Ruta: `/register`

### 📁 Archivos Involucrados:

#### **Página Principal:**
- `frontend/src/app/(auth)/register/page.tsx`
  - Solo renderiza el componente RegisterCard
  - Grupo de ruta: `(auth)` para layout compartido

#### **Layout de Autenticación:**
- `frontend/src/app/(auth)/layout.tsx`
  - Layout minimalista centrado
  - Sin sidebar ni navegación
  - Fondo simple para formularios

#### **Componente de Registro:**
- `frontend/src/components/RegisterComponent.tsx`
  - **Estado Local:**
    - `email`: Email del usuario
    - `password`: Contraseña
    - `confirmPassword`: Confirmación de contraseña
    - `isLoading`: Estado de carga
    - `error`: Mensajes de error
  
  - **Validaciones:**
    - Campos completos
    - Contraseñas coinciden
    - Mínimo 6 caracteres en contraseña
  
  - **Funciones Clave:**
    - `handleSubmit()`: Procesa el formulario
    - Usa `useAuth().register()` del contexto
    - Redirección automática a `/dashboard` tras éxito

#### **Contexto de Autenticación:**
- `frontend/src/contexts/AuthContext.tsx`
  - **Estado Global:**
    - `user`: Datos del usuario autenticado
    - `loading`: Estado de carga
    - `isAuthenticated`: Boolean de autenticación
    - `isAdmin`: Rol de administrador
    - `isSuperAdmin`: Rol de super admin
  
  - **Función `register()`:**
    ```typescript
    register({ email, password }) -> { success, error }
    ```
    - Llama a `authService.register()`
    - Establece usuario en estado global
    - Cookies HTTP-only para sesión segura
    - No usa localStorage para tokens

#### **Servicio de Autenticación:**
- `frontend/src/services/auth.service.ts`
  - **Endpoint:** `POST /api/auth/register`
  - **Request Body:**
    ```json
    {
      "email": "usuario@example.com",
      "password": "contraseña123"
    }
    ```
  - **Response:**
    ```json
    {
      "success": true,
      "user": { "id": 1, "email": "...", "role": "user" },
      "token": "jwt_token"
    }
    ```

#### **API Cliente:**
- `frontend/src/services/api-client.ts`
  - Axios interceptors
  - Manejo de cookies
  - CSRF token handling
  - Error handling global

#### **Backend - Registro:**
- `server/src/routes/authRoutes.js`
  - Endpoint: `/api/auth/register`
  - Validación de datos
  - Hash de contraseña (bcrypt)
  - Creación de usuario en PostgreSQL
  - Generación de JWT
  - Set de cookies HTTP-only

### 🔄 Flujo de Datos:

```
Usuario completa formulario
    ↓
RegisterComponent.handleSubmit()
    ↓
AuthContext.register()
    ↓
authService.register()
    ↓
apiClient POST /api/auth/register
    ↓
Backend: authRoutes.js
    ↓
PostgreSQL: INSERT INTO users
    ↓
Response con JWT + User data
    ↓
Set cookies HTTP-only
    ↓
AuthContext actualiza estado global
    ↓
Router.push('/dashboard')
```

### ⚙️ Elementos UI:
- Input de email (validación HTML5)
- Input de password (type="password")
- Input de confirmación de password
- Botón "Crear Cuenta" con loading spinner
- Link a "/login" para usuarios existentes
- Mensaje de error (si aplica)
- Banner informativo de conexión al backend

---

## 2. LOGIN (USUARIO EXISTENTE)

### 📍 Ruta: `/login`

### 📁 Archivos Involucrados:

#### **Página Principal:**
- `frontend/src/app/(auth)/login/page.tsx`
  - Renderiza componente CardDemo (LoginComponent)

#### **Componente de Login:**
- `frontend/src/components/LoginComponent.tsx`
  - **Estado Local:**
    - `email`: Email del usuario
    - `password`: Contraseña
    - `isLoading`: Estado de carga
    - `error`: Mensajes de error
  
  - **Funciones Clave:**
    - `handleSubmit()`: Procesa login
    - Usa `useAuth().login()`
    - Maneja parámetro `?redirect=` para redirección
    - Redirección por defecto: `/select-site`

#### **Servicio de Autenticación:**
- `frontend/src/services/auth.service.ts`
  - **Endpoint:** `POST /api/auth/login`
  - **Request:**
    ```json
    {
      "email": "usuario@example.com",
      "password": "contraseña123"
    }
    ```
  - **Response:** Token JWT + User data

#### **Backend - Login:**
- `server/src/routes/authRoutes.js`
  - Endpoint: `/api/auth/login`
  - Verificación de credenciales
  - Comparación bcrypt
  - Generación de JWT
  - Set de cookies HTTP-only

### 🔄 Flujo de Datos:

```
Usuario ingresa credenciales
    ↓
LoginComponent.handleSubmit()
    ↓
AuthContext.login()
    ↓
authService.login()
    ↓
Backend: authRoutes.js
    ↓
Verificación en PostgreSQL
    ↓
Response con JWT + User data
    ↓
AuthContext actualiza estado
    ↓
Router.push('/select-site' o redirect param)
```

### ⚙️ Elementos UI:
- Input de email
- Input de password
- Link "Forgot password?" (placeholder)
- Botón "Iniciar Sesión" con loading
- Link a "/register" para nuevos usuarios
- Banner informativo de backend

---

## 3. SELECCIÓN/CREACIÓN DE SITIO

### 📍 Ruta: `/select-site` → Redirige a → `/setup/sites`

### 📁 Archivos Involucrados:

#### **Página de Redirección:**
- `frontend/src/app/select-site/page.tsx`
  - **Función:** Redirección automática a `/setup/sites`
  - Muestra loading spinner mientras redirige
  - Usa `router.replace()` para evitar historial

#### **Página de Gestión de Sitios:**
- `frontend/src/app/(main)/(setup)/sites/page.tsx`
  - **Estado Local:**
    - `searchTerm`: Filtro de búsqueda
    - `loading`: Estado de carga
    - `error`: Mensajes de error
    - `showCreateModal`: Visibilidad del modal de creación
    - `showEditModal`: Visibilidad del modal de edición
    - `editingSite`: Sitio en edición
    - `createSiteData`: { name, domain, description }
  
  - **useEffect:**
    - Carga sitios al montar: `refreshSites()`
  
  - **Funciones Clave:**
    - `handleCreateSite()`: Crea nuevo sitio
    - `handleEditSite()`: Actualiza sitio existente
    - `handleDeleteSite()`: Elimina sitio
    - `setSelectedSite()`: Selecciona sitio activo

#### **Contexto de Sitio:**
- `frontend/src/contexts/SiteContext.tsx`
  - **Estado Global:**
    - `selectedSite`: Sitio actualmente activo
    - `sites`: Array de todos los sitios del usuario
    - `loading`: Estado de carga
    - `isInitialized`: Flag de inicialización completa
  
  - **Persistencia:**
    - Guarda `selectedSiteId` en localStorage
    - Restaura sitio seleccionado al recargar página
  
  - **Funciones:**
    - `setSelectedSite()`: Selecciona y persiste sitio
    - `refreshSites()`: Recarga lista de sitios
    - `createSite()`: Crea sitio y lo selecciona automáticamente

#### **Servicio de Sitios:**
- `frontend/src/services/sites.service.ts`
  - **Endpoints:**
    - `GET /api/sites` - Lista de sitios del usuario
    - `POST /api/sites` - Crear sitio
    - `PUT /api/sites/:id` - Actualizar sitio
    - `DELETE /api/sites/:id` - Eliminar sitio

#### **Backend - Sitios:**
- `server/src/routes/siteRoutes.js`
  - Middleware de autenticación en todas las rutas
  - CRUD completo de sitios
  - Filtro por usuario autenticado
  - PostgreSQL: tabla `sites`

### 🔄 Flujo de Datos - Creación de Sitio:

```
Usuario completa modal de creación
    ↓
handleCreateSite()
    ↓
sitesService.createSite()
    ↓
POST /api/sites
    ↓
Backend: siteRoutes.js
    ↓
PostgreSQL: INSERT INTO sites
    ↓
Response con nuevo sitio
    ↓
SiteContext.createSite()
    ↓
refreshSites() - recarga lista
    ↓
setSelectedSite() - auto-selecciona
    ↓
localStorage.setItem('selectedSiteId')
    ↓
SiteGuard permite acceso al dashboard
```

### 🛡️ SiteGuard Component:
- `frontend/src/components/SiteGuard.tsx`
  - **Función:** Protección de rutas que requieren sitio seleccionado
  - **Lógica:**
    - Si `loading`: Muestra spinner de carga
    - Si `!selectedSite`: Muestra CleanSiteSelector
    - Si `selectedSite`: Renderiza children (dashboard)
  - **Key prop:** Usa `site-id` para forzar remount

#### **Selector de Sitio:**
- `frontend/src/components/CleanSiteSelector.tsx`
  - Modal/pantalla completa
  - Lista de sitios existentes
  - Botón "Crear Nuevo Sitio"
  - Selección o creación obligatoria

### ⚙️ Elementos UI:
- **Lista de Sitios (Grid):**
  - Nombre del sitio
  - Dominio
  - Descripción
  - Estado (activo/inactivo)
  - Estadísticas:
    - Número de suscriptores
    - Número de campañas
  - Fecha de creación
  - Botones:
    - "Seleccionar" (establece como activo)
    - "Editar" (abre modal)
    - "Eliminar" (con confirmación)

- **Barra de Búsqueda**
- **Botón "Agregar Sitio"**
- **Modal de Creación:**
  - Input: Nombre del sitio *
  - Input: Dominio (URL) *
  - Textarea: Descripción
  - Botones: Cancelar / Crear Sitio

- **Modal de Edición:**
  - Mismos campos que creación
  - Checkbox: Sitio activo
  - Botones: Cancelar / Guardar Cambios

---

## 4. DASHBOARD PRINCIPAL

### 📍 Ruta: `/dashboard`

### 📁 Archivos Involucrados:

#### **Página Principal:**
- `frontend/src/app/(main)/dashboard/page.tsx`
  - **Hooks:**
    - `useAuth()`: Obtiene usuario y estado de autenticación
    - `useSiteContext()`: Obtiene sitio seleccionado
  
  - **Componentes Renderizados:**
    - `InfoCard`: Header con info del sitio
    - `MetricsGrid`: Métricas principales (x2)
    - `Chart`: Gráfico de analíticas
    - `MetricCard`: Métrica individual de usuarios

#### **Layout Principal:**
- `frontend/src/app/(main)/layout.tsx`
  - **Providers:**
    - `SiteProvider`: Contexto de sitios
    - `SiteGuard`: Protección de rutas
    - `SiteLayoutWrapper`: Layout con sidebar
  - **Metadata:** Título y descripción

#### **SiteLayoutWrapper:**
- `frontend/src/components/SiteLayoutWrapper.tsx`
  - **Lógica:**
    - Si `loading`: No renderiza nada
    - Si `selectedSite`: Muestra `SidebarLayout + children`
    - Si `!selectedSite`: Solo children (SiteGuard maneja selector)

#### **Sidebar:**
- `frontend/src/components/sidebar-optimized.tsx`
  - **Secciones:**
    - **DASHBOARD:**
      - Dashboard
      - Analytics
      - Geo Report
    - **SETUP:**
      - Sites (gestión de sitios)
      - Opt-in Prompt (configuración de prompts)
      - Welcome Notification
      - Subscription Bell
      - Notification Cards
    - **PUSH NOTIFICATIONS:**
      - Manual Push (Campañas)
      - Journeys (Automatización)
    - **USERS:**
      - Subscribers (Suscriptores)
      - Segments (Segmentos)
    - **INTEGRATION:**
      - Manual Integration
      - Public API Keys
    - **COLLECT EMAIL:**
      - (Sección futura)
    - **LOGS:**
      - (Sección futura)
    - **OTROS:**
      - Opt-in Funnel
      - Data & Privacy
      - Uptime Monitoring
      - Troubleshooter
  
  - **Header:**
    - Selector de sitio (dropdown)
    - Botón "Crear Nuevo Sitio"
    - UserDropdown (perfil/logout)
    - Toggle de tema (dark/light)

#### **Componentes de Métricas:**

1. **MetricsGrid** (`frontend/src/components/MetricsGrid.tsx`)
   - **Props:**
     - `metrics`: Array de nombres de métricas
     - `columns`: Número de columnas (grid)
     - `color`: Colores personalizados
   
   - **Métricas Disponibles:**
     - `active_users`: Usuarios activos
     - `total_subscriptions`: Suscripciones totales
     - `total_campaigns`: Campañas totales
     - `conversion_rate`: Tasa de conversión
     - `total_sites`: Sitios totales
     - `active_sites`: Sitios activos
     - `recent_campaigns`: Campañas recientes

2. **MetricCard** (`frontend/src/components/MetricCard.tsx`)
   - Tarjeta individual de métrica
   - Gráfico inline opcional
   - Comparación con período anterior

3. **Chart** (`frontend/src/components/Chart.tsx`)
   - Gráfico de líneas/área
   - Datos de analíticas temporales
   - Filtros de período

4. **InfoCard** (`frontend/src/components/InfoCard.tsx`)
   - Header descriptivo
   - Título y descripción de página

#### **Servicios de Dashboard:**
- `frontend/src/services/dashboard.service.ts`
  - **Endpoints:**
    - `GET /api/dashboard/metrics` - Métricas generales
    - `GET /api/dashboard/analytics` - Datos de gráficos
    - `GET /api/dashboard/recent-campaigns` - Campañas recientes
    - Todos soportan filtro opcional: `?siteId=X`

#### **Backend - Dashboard:**
- `server/src/routes/dashboardRoutes.js`
  - Agregación de datos de múltiples tablas
  - Cálculos de métricas
  - Filtrado por sitio si se proporciona
  - Cache de métricas (opcional)

### 🔄 Flujo de Datos - Dashboard:

```
Página carga
    ↓
useAuth() verifica autenticación
    ↓
useSiteContext() obtiene sitio seleccionado
    ↓
MetricsGrid solicita métricas
    ↓
dashboardService.getMetrics(siteId?)
    ↓
GET /api/dashboard/metrics?siteId=X
    ↓
Backend: Consultas PostgreSQL agregadas
    ↓
Response con todas las métricas
    ↓
MetricsGrid renderiza tarjetas
    ↓
Chart solicita datos de analíticas
    ↓
dashboardService.getAnalytics(siteId?)
    ↓
Response con datos temporales
    ↓
Chart renderiza gráfico
```

### ⚙️ Elementos UI del Dashboard:
- **Header:**
  - Título: "Dashboard - [Nombre del Sitio]"
  - Subtítulo: "[Dominio] | [Email del usuario]"

- **Métricas Principales (Grid 4 columnas):**
  - Usuarios Activos
  - Suscripciones Totales
  - Campañas Totales
  - Tasa de Conversión

- **Métricas Secundarias (Grid 3 columnas):**
  - Sitios Totales
  - Sitios Activos
  - Campañas Recientes

- **Gráfico Principal:**
  - Línea temporal de métricas
  - Selector de período
  - Zoom y pan interactivo

- **Tarjeta de Usuarios:**
  - Total de usuarios
  - Gráfico inline
  - Comparación con período anterior

---

## 5. CONFIGURACIÓN DE OPT-IN PROMPT

### 📍 Ruta: `/setup/optinp` (Página actual del usuario)

### 📁 Archivos Involucrados:

#### **Página Principal:**
- `frontend/src/app/(main)/(setup)/optinp/page.tsx`
  - **Estado Local (Configuración):**
    - `selectedType`: Tipo de prompt ('lightbox1' | 'lightbox2' | 'bellIcon')
    - `whenToShow`: Cuándo mostrar ('Show Immediately' | 'After 5 seconds' | 'On exit intent')
    - `animation`: Animación ('Drop-in' | 'Fade-in' | 'Slide-up')
    - `backgroundColor`: Color de fondo (hex)
    - `headline`: Título del prompt
    - `headlineEnabled`: Mostrar/ocultar título
    - `text`: Texto del mensaje
    - `textEnabled`: Mostrar/ocultar texto
    - `cancelButton`: Texto botón cancelar
    - `cancelBgColor`, `cancelTextColor`: Colores botón cancelar
    - `approveButton`: Texto botón aprobar
    - `approveBgColor`, `approveTextColor`: Colores botón aprobar
    - `rePromptDelay`: Días antes de re-mostrar (0-365)
  
  - **Estado Local (Gestión):**
    - `isSaving`: Estado de guardado
    - `saveError`: Errores de guardado
    - `lastSaved`: Timestamp del último guardado
    - `configId`: ID de configuración guardada
  
  - **Hooks:**
    - `usePushNotifications()`: Gestión de suscripciones
    - `useSiteContext()`: Sitio seleccionado
  
  - **useEffect - Carga de Configuración:**
    - Se ejecuta al cambiar `selectedSite`
    - Llama a `optinsService.getConfig(siteId)`
    - Carga configuración existente o usa defaults
  
  - **Funciones Clave:**
    - `handleSaveConfig()`: Guarda/actualiza configuración
    - `handleSubscribe()`: Prueba suscripción push real
    - `generateIntegrationScript()`: Genera código de integración
    - `generatePreviewUrl()`: Genera URL de demo

#### **Hook de Push Notifications:**
- `frontend/src/hooks/usePushNotifications.ts`
  - **Estado:**
    - `isSupported`: Navegador soporta push
    - `isSubscribed`: Usuario ya suscrito
    - `loading`: Estado de carga
    - `error`: Errores
    - `permission`: Estado de permiso ('default' | 'granted' | 'denied')
  
  - **Funciones:**
    - `subscribe(siteId)`: Suscribe al usuario
      - Solicita permiso del navegador
      - Obtiene pushSubscription del service worker
      - Envía a backend: `POST /api/push/subscribe`
    - `unsubscribe()`: Desuscribe al usuario
    - Verifica soporte y estado al montar

#### **Servicio de Opt-ins:**
- `frontend/src/services/optins.service.ts`
  - **Endpoints:**
    - `GET /api/optins/config/:siteId` - Obtener configuración
    - `POST /api/optins/config` - Crear configuración
    - `PUT /api/optins/config/:configId` - Actualizar configuración
    - `POST /api/optins/generate-code` - Generar código de integración

#### **Backend - Opt-ins:**
- `server/src/routes/optinRoutes.js`
  - CRUD de configuraciones de opt-in
  - Asociadas a sitio específico
  - Generación de código de integración
  - PostgreSQL: tabla `optin_configs`

#### **Service Worker:**
- `frontend/public/pushsaas-sw.js`
  - Intercepta notificaciones push
  - Muestra notificaciones al usuario
  - Maneja clicks en notificaciones
  - Background sync

### 🔄 Flujo de Datos - Guardar Configuración:

```
Usuario modifica configuración
    ↓
Cambia estado local (setters)
    ↓
Vista previa se actualiza en tiempo real
    ↓
Usuario hace clic en "Guardar Configuración"
    ↓
handleSaveConfig()
    ↓
Valida selectedSite existe
    ↓
Construye objeto OptinConfigFormData
    ↓
Si configId existe:
  optinsService.updateConfig(configId, data)
Si no:
  optinsService.saveConfig(data)
    ↓
POST/PUT /api/optins/config
    ↓
Backend: optinRoutes.js
    ↓
PostgreSQL: INSERT/UPDATE optin_configs
    ↓
Response con config guardada
    ↓
Actualiza configId en estado
    ↓
setLastSaved(new Date())
    ↓
Alert: "✅ Configuración guardada exitosamente"
```

### 🔄 Flujo de Datos - Suscripción Push:

```
Usuario hace clic en "YES" en preview
    ↓
handleSubscribe()
    ↓
Valida selectedSite
    ↓
usePushNotifications.subscribe(siteId)
    ↓
Notification.requestPermission()
    ↓
Si granted:
  navigator.serviceWorker.ready
    ↓
  pushManager.subscribe()
    ↓
  Obtiene pushSubscription del navegador
    ↓
  pushService.subscribe({ siteId, subscription })
    ↓
  POST /api/push/subscribe
    ↓
  Backend: pushRoutes.js
    ↓
  PostgreSQL: INSERT INTO subscriptions
    ↓
  Response success
    ↓
  isSubscribed = true
    ↓
  Alert: "¡Te has suscrito exitosamente!"
```

### 🔄 Flujo de Generación de Código:

```
Usuario hace clic en "Copiar Código de Integración"
    ↓
Si configId existe:
  optinsService.generateCode(configId, 'javascript', siteId)
    ↓
  POST /api/optins/generate-code
    ↓
  Backend genera script personalizado
    ↓
  Response con código JavaScript
Si no:
  generateIntegrationScript() - local
    ↓
Código copiado al portapapeles
    ↓
navigator.clipboard.writeText(script)
    ↓
Alert: "✅ Código de integración copiado"
```

### ⚙️ Elementos UI:

#### **Panel Izquierdo (Formulario):**

1. **Estado de Notificaciones:**
   - Badge de estado del navegador
   - Sitio activo
   - ID de configuración guardada
   - Última actualización
   - Errores (si existen)

2. **Configuración de Timing:**
   - Dropdown "When to Show":
     - Show Immediately
     - After 5 seconds
     - On exit intent

3. **Tipo de Prompt (Radio Grid):**
   - Lightbox 1 (Centrado con icono)
   - Lightbox 2 (Banner superior)
   - Bell Icon (Icono flotante)
   - Cada opción con preview visual

4. **Estilo:**
   - Dropdown "Animation":
     - Drop-in
     - Fade-in
     - Slide-up
   - Color Picker: Background Color

5. **Contenido:**
   - Input: Headline (con checkbox enable/disable)
   - Textarea: Text (con checkbox enable/disable)
   - Button: Upload Icon

6. **Botón Cancelar:**
   - Input: Texto del botón
   - Color Picker: Background
   - Color Picker: Text Color

7. **Botón Aprobar:**
   - Input: Texto del botón
   - Color Picker: Background
   - Color Picker: Text Color

8. **Re-prompt:**
   - Input numérico: Días de delay (0-365)

9. **Botones de Acción:**
   - "Guardar Configuración" (verde)
   - "Copiar Código de Integración" (azul)
   - "Vista Previa en Sitio Web" (morado)

#### **Panel Derecho (Preview):**

1. **Previews por Tipo:**
   - **Lightbox 1:**
     - Modal centrado
     - Icono en parte superior
     - Headline (si habilitado)
     - Texto
     - Dos botones: Cancelar / Aprobar
     - Colores personalizados
     - Click en "YES" → suscripción real
   
   - **Lightbox 2:**
     - Banner compacto
     - Barra de color superior
     - Texto y botones inline
   
   - **Bell Icon:**
     - Icono flotante circular
     - Click → suscripción directa
     - Badge visual si ya suscrito

2. **Estados del Preview:**
   - Loading: "Suscribiendo..."
   - Success: "✓ Suscrito"
   - Error: Mensaje de error

---

## 6. OTRAS PÁGINAS DISPONIBLES

### 6.1. WELCOME NOTIFICATION

#### 📍 Ruta: `/setup/welcome-noti`
#### 📁 Archivo: `frontend/src/app/(main)/(setup)/welcome-noti/page.tsx`

**Descripción:** Configura la notificación de bienvenida que se envía automáticamente al suscribirse.

**Estado Local:**
- `title`: Título de la notificación
- `body`: Cuerpo del mensaje
- `destinationUrl`: URL de destino al hacer click
- `selectedOs`: Sistema operativo para preview ('Windows' | 'Mac' | 'Android')

**Funcionalidades:**
- Configurar título y mensaje de bienvenida
- Upload de icono e imagen
- URL de destino
- Preview por sistema operativo
- Botones: Deactivate / Update

**Backend:**
- Endpoint: `/api/welcome-notifications`
- Se envía automáticamente al confirmar suscripción

---

### 6.2. SUBSCRIPTION BELL

#### 📍 Ruta: `/setup/subs-bell`
#### 📁 Archivo: `frontend/src/app/(main)/(setup)/subs-bell/page.tsx`

**Descripción:** Configura el widget de campana de suscripción persistente.

**Estado Local:**
- **Styling:**
  - `style`: Rounded/Square/Circle
  - `position`: Bottom Left/Right, Top Left/Right
  - `theme`: Dark/Light/Auto + color picker
  - `popupStyle`: Standard/Minimal/Compact
  - `xAxis`, `yAxis`: Offset en píxeles
- **Action Buttons:**
  - Estados: Default / Subscribed / Unsubscribed
  - Títulos y textos de botones personalizables
- **Last Notifications:**
  - `showLastNotifications`: Toggle
  - Carga últimas 3 campañas desde dashboard service
  - Headings personalizables

**Integración:**
- Carga campañas reales: `dashboardService.getRecentCampaigns(3, siteId)`
- Preview interactivo con tabs
- Widget persistente en sitio web

**Backend:**
- Endpoint: `/api/subscription-bell/config`
- Dashboard: `/api/dashboard/recent-campaigns`

---

### 6.3. CAMPAIGNS (MANUAL PUSH)

#### 📍 Ruta: `/push-noti/campaigns`
#### 📁 Archivo: `frontend/src/app/(main)/(push-noti)/campaigns/page.tsx`

**Descripción:** Gestión completa de campañas de notificaciones push.

**Estado Local:**
- `searchTerm`: Filtro de búsqueda
- `sortField`: Campo de ordenamiento
- `sortDirection`: Dirección (asc/desc)
- `campaigns`: Array de campañas
- `isLoading`: Estado de carga
- `error`: Errores
- `isCreateModalOpen`: Visibilidad del modal
- `pagination`: { current, limit, total, pages }

**Funcionalidades:**
- **Listar Campañas:**
  - Tabla con todas las campañas
  - Columnas: Name, Date Created, Status, Total Attempts, Successfully Sent, Failed, Delivered, Clicked, Closed, CTR
  - Búsqueda y ordenamiento
  - Paginación
  
- **Crear Campaña:**
  - Modal: `CreateCampaignModal`
  - Campos: Título, mensaje, URL, segmento, programación
  
- **Enviar Campaña:**
  - Para borradores (status: Pending)
  - Confirmación antes de enviar
  - Endpoint: `POST /api/campaigns/:id/send`
  
- **Editar/Eliminar:**
  - Menú dropdown por campaña
  - Editar: Borradores y programadas
  - Eliminar: Todas las campañas

**Servicios:**
- `campaignsService.getCampaigns({ page, limit, search, siteId })`
- `campaignsService.sendCampaign(id)`
- `campaignsService.deleteCampaign(id)`

**Backend:**
- Endpoints:
  - `GET /api/campaigns?siteId=X&page=1&limit=20`
  - `POST /api/campaigns`
  - `PUT /api/campaigns/:id`
  - `POST /api/campaigns/:id/send`
  - `DELETE /api/campaigns/:id`

---

### 6.4. SUBSCRIBERS

#### 📍 Ruta: `/users/subscribers`
#### 📁 Archivo: `frontend/src/app/(main)/(users)/subscribers/page.tsx`

**Descripción:** Lista y gestión de suscriptores.

**Componentes:**
- `InfoCard`: Header descriptivo
- Badge de sitio activo
- `Tables`: Componente de tabla de suscriptores

**Funcionalidades:**
- Lista de todos los suscriptores
- Filtrado por sitio seleccionado
- Información: Ubicación, dispositivo, navegador
- Fecha de suscripción
- Estado activo/inactivo

**Backend:**
- Endpoint: `GET /api/subscribers?siteId=X`
- Tabla: `subscriptions` en PostgreSQL

---

### 6.5. SEGMENTS

#### 📍 Ruta: `/users/segments`
#### 📁 Archivo: `frontend/src/app/(main)/(users)/segments/page.tsx`

**Descripción:** Creación y gestión de segmentos de usuarios.

**Funcionalidades:**
- Crear segmentos con condiciones
- Filtros: Ubicación, dispositivo, navegador, comportamiento
- Asignar suscriptores a segmentos
- Usar segmentos en campañas

**Backend:**
- Endpoints:
  - `GET /api/segments?siteId=X`
  - `POST /api/segments`
  - `PUT /api/segments/:id`
  - `DELETE /api/segments/:id`

---

### 6.6. ANALYTICS

#### 📍 Ruta: `/dashboard/analytics`
#### 📁 Archivo: `frontend/src/app/(main)/dashboard/analytics/page.tsx`

**Descripción:** Analíticas detalladas de notificaciones.

**Métricas:**
- Impresiones
- Clicks
- CTR
- Conversiones
- Análisis temporal
- Comparación por campaña

---

### 6.7. GEO REPORT

#### 📍 Ruta: `/dashboard/geo-report`
#### 📁 Archivo: `frontend/src/app/(main)/dashboard/geo-report/page.tsx`

**Descripción:** Reporte geográfico de suscriptores.

**Funcionalidades:**
- Mapa de calor
- Lista por países/ciudades
- Estadísticas por región

---

### 6.8. INTEGRATION

#### 📍 Rutas:
- `/integration/manual-integ`
- `/integration/public-api-keys`

#### 📁 Archivos:
- `frontend/src/app/(main)/(integration)/manual-integ/page.tsx`
- `frontend/src/app/(main)/(integration)/public-api-keys/page.tsx`

**Descripción:**
- Guías de integración manual
- Gestión de API keys
- Webhooks
- SDKs disponibles

---

## 7. ARQUITECTURA DE CONTEXTOS Y SERVICIOS

### 7.1. ROOT LAYOUT

#### 📁 Archivo: `frontend/src/app/layout.tsx`

**Providers (Nivel Global):**
1. **ThemeProvider:**
   - Gestión de tema dark/light
   - Persistencia en localStorage
   - System theme detection

2. **AuthProvider:**
   - Contexto de autenticación global
   - Disponible en toda la app
   - Verifica sesión al cargar

**HTML Structure:**
```tsx
<html suppressHydrationWarning>
  <body>
    <ThemeProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ThemeProvider>
  </body>
</html>
```

---

### 7.2. MAIN LAYOUT

#### 📁 Archivo: `frontend/src/app/(main)/layout.tsx`

**Providers (Nivel Main):**
1. **SiteProvider:**
   - Contexto de sitios
   - Solo en rutas principales (no en auth)
   - Gestiona sitio seleccionado

2. **SiteGuard:**
   - Verifica sitio seleccionado
   - Muestra selector si es necesario
   - Protege rutas principales

3. **SiteLayoutWrapper:**
   - Renderiza sidebar si hay sitio
   - Layout responsive

**Estructura:**
```tsx
<SiteProvider>
  <SiteGuard>
    <SiteLayoutWrapper>
      {children}
    </SiteLayoutWrapper>
  </SiteGuard>
</SiteProvider>
```

---

### 7.3. CONTEXTOS

#### **AuthContext:**
- **Ubicación:** `frontend/src/contexts/AuthContext.tsx`
- **Estado:**
  - `user: User | null`
  - `loading: boolean`
  - `isAuthenticated: boolean`
  - `isAdmin: boolean`
  - `isSuperAdmin: boolean`
- **Métodos:**
  - `login(credentials)`
  - `register(userData)`
  - `logout()`
  - `refreshUser()`
- **Persistencia:** Cookies HTTP-only
- **Inicialización:** useEffect al montar

#### **SiteContext:**
- **Ubicación:** `frontend/src/contexts/SiteContext.tsx`
- **Estado:**
  - `selectedSite: Site | null`
  - `sites: Site[]`
  - `loading: boolean`
  - `isInitialized: boolean`
- **Métodos:**
  - `setSelectedSite(site)`
  - `refreshSites()`
  - `createSite(data)`
- **Persistencia:** localStorage (`selectedSiteId`)
- **Sincronización:** Auto-restaura sitio al recargar

---

### 7.4. SERVICIOS (API CLIENT)

#### **Estructura Modular:**

```
services/
├── index.ts              # Exportaciones centralizadas
├── api-client.ts         # Cliente Axios base
├── auth.service.ts       # Autenticación
├── sites.service.ts      # Sitios
├── campaigns.service.ts  # Campañas
├── segments.service.ts   # Segmentos
├── dashboard.service.ts  # Dashboard
├── users.service.ts      # Usuarios
├── push.service.ts       # Push notifications
└── optins.service.ts     # Opt-ins
```

#### **API Client Base:**
- **Ubicación:** `frontend/src/services/api-client.ts`
- **Features:**
  - Axios instance
  - Base URL: `process.env.NEXT_PUBLIC_API_URL || http://localhost:3000`
  - Interceptors:
    - Request: Auto-incluye cookies
    - Response: Manejo de errores global
  - CSRF token handling
  - Token refresh logic

#### **Tipos:**
- **Ubicación:** `frontend/src/types/api.ts`
- **Interfaces:**
  - User, Site, Campaign, Segment, Subscription
  - ApiResponse, ApiError, PaginationData
  - Form Data types

---

### 7.5. HOOKS PERSONALIZADOS

#### **useAuth:**
```typescript
const { user, loading, login, register, logout, isAuthenticated } = useAuth()
```

#### **useSiteContext:**
```typescript
const { selectedSite, sites, setSelectedSite, refreshSites } = useSiteContext()
```

#### **usePushNotifications:**
```typescript
const {
  isSupported,
  isSubscribed,
  loading,
  error,
  permission,
  subscribe,
  unsubscribe
} = usePushNotifications()
```

---

### 7.6. BACKEND (Resumen)

#### **Estructura:**
```
server/src/
├── index.js              # Entry point
├── config/
│   └── database.js       # PostgreSQL config
├── middleware/
│   ├── auth.js           # JWT verification
│   └── csrf.js           # CSRF protection
├── routes/
│   ├── authRoutes.js     # /api/auth/*
│   ├── siteRoutes.js     # /api/sites/*
│   ├── campaignRoutes.js # /api/campaigns/*
│   ├── pushRoutes.js     # /api/push/*
│   ├── optinRoutes.js    # /api/optins/*
│   └── dashboardRoutes.js# /api/dashboard/*
├── services/
│   └── pushService.js    # Web Push logic
└── utils/
    └── webpush.js        # VAPID keys
```

#### **Base de Datos (PostgreSQL):**

**Tablas Principales:**
- `users`: Usuarios de la plataforma
- `sites`: Sitios web registrados
- `subscriptions`: Suscripciones push
- `campaigns`: Campañas de notificaciones
- `segments`: Segmentos de usuarios
- `optin_configs`: Configuraciones de opt-in
- `campaign_stats`: Estadísticas de campañas

**Relaciones:**
- `users` 1:N `sites`
- `sites` 1:N `subscriptions`
- `sites` 1:N `campaigns`
- `sites` 1:N `optin_configs`
- `campaigns` 1:N `campaign_stats`
- `segments` N:M `subscriptions`

---

## 8. FLUJO COMPLETO DE USUARIO NUEVO (RESUMEN)

```
┌─────────────────────────────────────────────────────────────────┐
│                   1. REGISTRO INICIAL                            │
│   URL: /register                                                 │
│   Archivos:                                                      │
│   - app/(auth)/register/page.tsx                                 │
│   - components/RegisterComponent.tsx                             │
│   - contexts/AuthContext.tsx                                     │
│   - services/auth.service.ts                                     │
│   Backend: POST /api/auth/register                               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│           2. REDIRECCIÓN AUTOMÁTICA A DASHBOARD                  │
│   router.push('/dashboard')                                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              3. DASHBOARD VERIFICA AUTENTICACIÓN                 │
│   AuthContext.user existe → Continúa                             │
│   Si no → Redirect a /login                                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│         4. SITEGUARD VERIFICA SITIO SELECCIONADO                 │
│   SiteContext.loading = true → Muestra spinner                   │
│   SiteContext.sites = [] → Carga sitios desde backend            │
│   Backend: GET /api/sites                                        │
│   Si no hay sitios → Muestra selector obligatorio                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│          5. USUARIO DEBE CREAR/SELECCIONAR SITIO                 │
│   URL: /setup/sites (a través de SiteGuard)                      │
│   Archivos:                                                      │
│   - components/CleanSiteSelector.tsx                             │
│   - components/SiteGuard.tsx                                     │
│   - app/(main)/(setup)/sites/page.tsx                            │
│   - contexts/SiteContext.tsx                                     │
│   - services/sites.service.ts                                    │
│   Backend: POST /api/sites                                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│            6. SITIO SELECCIONADO → DASHBOARD ACCESIBLE           │
│   SiteContext.setSelectedSite(site)                              │
│   localStorage.setItem('selectedSiteId', site.id)                │
│   SiteGuard permite renderizar children                          │
│   SiteLayoutWrapper muestra sidebar                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│               7. DASHBOARD CARGA Y MUESTRA DATOS                 │
│   URL: /dashboard                                                │
│   Archivos:                                                      │
│   - app/(main)/dashboard/page.tsx                                │
│   - components/MetricsGrid.tsx                                   │
│   - components/Chart.tsx                                         │
│   - services/dashboard.service.ts                                │
│   Backend: GET /api/dashboard/metrics?siteId=X                   │
│   Backend: GET /api/dashboard/analytics?siteId=X                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│           8. USUARIO NAVEGA A CONFIGURAR OPT-IN                  │
│   Click en sidebar → "Opt-in Prompt"                             │
│   URL: /setup/optinp                                             │
│   Archivos:                                                      │
│   - app/(main)/(setup)/optinp/page.tsx                           │
│   - hooks/usePushNotifications.ts                                │
│   - services/optins.service.ts                                   │
│   - contexts/SiteContext.tsx                                     │
│   Backend: GET /api/optins/config/:siteId                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│          9. USUARIO CONFIGURA Y GUARDA OPT-IN                    │
│   - Selecciona tipo de prompt                                    │
│   - Configura colores, textos, animación                         │
│   - Ve preview en tiempo real                                    │
│   - Click "Guardar Configuración"                                │
│   Backend: POST/PUT /api/optins/config                           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│        10. USUARIO COPIA CÓDIGO DE INTEGRACIÓN                   │
│   - Click "Copiar Código de Integración"                         │
│   - Código JavaScript generado                                   │
│   - Incluye siteId y configuración                               │
│   - Usuario pega en su sitio web                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│        11. USUARIO PUEDE EXPLORAR OTRAS PÁGINAS                  │
│   - Campaigns: /push-noti/campaigns                              │
│   - Subscribers: /users/subscribers                              │
│   - Segments: /users/segments                                    │
│   - Welcome Notification: /setup/welcome-noti                    │
│   - Subscription Bell: /setup/subs-bell                          │
│   - Analytics: /dashboard/analytics                              │
│   - Geo Report: /dashboard/geo-report                            │
│   - Manual Integration: /integration/manual-integ                │
│   - API Keys: /integration/public-api-keys                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. ÁRBOL DE ARCHIVOS CRÍTICOS

```
frontend/src/
│
├── app/
│   ├── layout.tsx                    # Root layout (Theme + Auth)
│   ├── page.tsx                      # Home → Redirige a /dashboard
│   │
│   ├── (auth)/                       # Grupo de autenticación
│   │   ├── layout.tsx                # Layout centrado para auth
│   │   ├── login/
│   │   │   └── page.tsx              # Página de login
│   │   └── register/
│   │       └── page.tsx              # Página de registro
│   │
│   ├── select-site/
│   │   └── page.tsx                  # Redirige a /setup/sites
│   │
│   └── (main)/                       # Grupo principal (requiere auth + sitio)
│       ├── layout.tsx                # Layout con Site Provider + Guard
│       │
│       ├── dashboard/
│       │   ├── page.tsx              # Dashboard principal
│       │   ├── analytics/
│       │   │   └── page.tsx          # Analíticas detalladas
│       │   └── geo-report/
│       │       └── page.tsx          # Reporte geográfico
│       │
│       ├── (setup)/                  # Grupo de configuración
│       │   ├── sites/
│       │   │   └── page.tsx          # Gestión de sitios
│       │   ├── optinp/
│       │   │   └── page.tsx          # ⭐ Configuración de opt-in (página actual)
│       │   ├── welcome-noti/
│       │   │   └── page.tsx          # Configuración de bienvenida
│       │   ├── subs-bell/
│       │   │   └── page.tsx          # Configuración de bell widget
│       │   └── noti-cards/
│       │       └── page.tsx          # Configuración de cards
│       │
│       ├── (push-noti)/              # Grupo de notificaciones
│       │   ├── campaigns/
│       │   │   └── page.tsx          # Gestión de campañas
│       │   └── journeys/
│       │       └── page.tsx          # Automatización
│       │
│       ├── (users)/                  # Grupo de usuarios
│       │   ├── subscribers/
│       │   │   └── page.tsx          # Lista de suscriptores
│       │   └── segments/
│       │       └── page.tsx          # Gestión de segmentos
│       │
│       ├── (integration)/            # Grupo de integración
│       │   ├── manual-integ/
│       │   │   └── page.tsx          # Guía de integración
│       │   └── public-api-keys/
│       │       └── page.tsx          # Gestión de API keys
│       │
│       ├── optin-funnel/
│       │   └── page.tsx              # Embudo de opt-in
│       ├── data-and-privacy/
│       │   └── page.tsx              # Privacidad
│       ├── uptime-monitoring/
│       │   └── page.tsx              # Monitoreo
│       └── troubleshooter/
│           └── page.tsx              # Diagnóstico
│
├── components/
│   ├── LoginComponent.tsx            # Componente de login
│   ├── RegisterComponent.tsx         # Componente de registro
│   ├── SiteGuard.tsx                 # ⭐ Guard para verificar sitio
│   ├── SiteLayoutWrapper.tsx         # ⭐ Wrapper con sidebar
│   ├── CleanSiteSelector.tsx         # Selector de sitio
│   ├── sidebar-optimized.tsx         # ⭐ Sidebar principal
│   ├── UserDropdown.tsx              # Dropdown de usuario
│   ├── SiteSelector.tsx              # Selector inline de sitio
│   ├── InfoCard.tsx                  # Card de información
│   ├── MetricCard.tsx                # Card de métrica individual
│   ├── MetricsGrid.tsx               # ⭐ Grid de métricas
│   ├── Chart.tsx                     # Gráfico de analíticas
│   ├── Table.tsx                     # Tabla de suscriptores
│   ├── CreateCampaignModal.tsx       # Modal de crear campaña
│   ├── CreateSegmentModal.tsx        # Modal de crear segmento
│   ├── theme-provider.tsx            # Provider de tema
│   └── ui/                           # Componentes UI base (shadcn)
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       └── ...
│
├── contexts/
│   ├── AuthContext.tsx               # ⭐ Contexto de autenticación
│   └── SiteContext.tsx               # ⭐ Contexto de sitios
│
├── hooks/
│   └── usePushNotifications.ts       # ⭐ Hook de notificaciones push
│
├── services/
│   ├── index.ts                      # Exportaciones centralizadas
│   ├── api-client.ts                 # ⭐ Cliente Axios base
│   ├── auth.service.ts               # ⭐ Servicio de autenticación
│   ├── sites.service.ts              # ⭐ Servicio de sitios
│   ├── campaigns.service.ts          # Servicio de campañas
│   ├── segments.service.ts           # Servicio de segmentos
│   ├── dashboard.service.ts          # ⭐ Servicio de dashboard
│   ├── users.service.ts              # Servicio de usuarios
│   ├── push.service.ts               # ⭐ Servicio de push
│   └── optins.service.ts             # ⭐ Servicio de opt-ins
│
├── types/
│   └── api.ts                        # ⭐ Tipos TypeScript de API
│
└── lib/
    └── auth.ts                       # Utilidades de autenticación

public/
└── pushsaas-sw.js                    # ⭐ Service Worker
```

**Leyenda:**
- ⭐ = Archivo crítico en el flujo de usuario nuevo
- (grupo) = Grupo de rutas de Next.js (no afecta URL)

---

## 10. ENDPOINTS DEL BACKEND

### **Autenticación:**
```
POST   /api/auth/register           # Registro de usuario
POST   /api/auth/login              # Login
POST   /api/auth/logout             # Logout
GET    /api/auth/me                 # Usuario actual
POST   /api/auth/refresh            # Refresh token
```

### **Sitios:**
```
GET    /api/sites                   # Lista de sitios del usuario
POST   /api/sites                   # Crear sitio
GET    /api/sites/:id               # Detalle de sitio
PUT    /api/sites/:id               # Actualizar sitio
DELETE /api/sites/:id               # Eliminar sitio
```

### **Dashboard:**
```
GET    /api/dashboard/metrics       # Métricas generales
GET    /api/dashboard/analytics     # Datos de gráficos
GET    /api/dashboard/recent-campaigns  # Campañas recientes
```

### **Opt-ins:**
```
GET    /api/optins/config/:siteId   # Obtener configuración
POST   /api/optins/config           # Crear configuración
PUT    /api/optins/config/:id       # Actualizar configuración
DELETE /api/optins/config/:id       # Eliminar configuración
POST   /api/optins/generate-code    # Generar código de integración
```

### **Push Notifications:**
```
POST   /api/push/subscribe          # Suscribir usuario
POST   /api/push/unsubscribe        # Desuscribir usuario
GET    /api/push/vapid              # Obtener VAPID public key
```

### **Campañas:**
```
GET    /api/campaigns               # Lista de campañas
POST   /api/campaigns               # Crear campaña
GET    /api/campaigns/:id           # Detalle de campaña
PUT    /api/campaigns/:id           # Actualizar campaña
DELETE /api/campaigns/:id           # Eliminar campaña
POST   /api/campaigns/:id/send      # Enviar campaña
```

### **Suscriptores:**
```
GET    /api/subscribers             # Lista de suscriptores
GET    /api/subscribers/:id         # Detalle de suscriptor
DELETE /api/subscribers/:id         # Eliminar suscriptor
```

### **Segmentos:**
```
GET    /api/segments                # Lista de segmentos
POST   /api/segments                # Crear segmento
GET    /api/segments/:id            # Detalle de segmento
PUT    /api/segments/:id            # Actualizar segmento
DELETE /api/segments/:id            # Eliminar segmento
```

### **Todos los endpoints protegidos requieren:**
- Header: `Authorization: Bearer <token>` (o cookie HTTP-only)
- Middleware de autenticación
- Filtrado por usuario autenticado

---

## 11. VARIABLES DE ENTORNO

### **Frontend (.env.local):**
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<vapid_public_key>
```

### **Backend (.env):**
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/pushsaas
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pushsaas
DB_USER=user
DB_PASSWORD=password

# JWT
JWT_SECRET=<your_jwt_secret>
JWT_EXPIRES_IN=7d

# VAPID (Web Push)
VAPID_PUBLIC_KEY=<vapid_public_key>
VAPID_PRIVATE_KEY=<vapid_private_key>
VAPID_SUBJECT=mailto:admin@pushsaas.com

# Server
PORT=3000
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:3001
```

---

## 12. RESUMEN FINAL

### **Flujo Secuencial de Usuario Nuevo:**

1. **Registro** (`/register`) → Crea cuenta en PostgreSQL
2. **Auto-login** → Establece sesión con JWT en cookies
3. **Redirección** → Dashboard (`/dashboard`)
4. **Verificación** → AuthContext valida sesión
5. **SiteGuard** → Verifica sitio seleccionado
6. **No hay sitios** → Muestra selector obligatorio
7. **Creación/Selección** → Usuario crea primer sitio
8. **Persistencia** → Sitio guardado en localStorage
9. **Dashboard Desbloqueado** → Muestra métricas y sidebar
10. **Navegación** → Acceso a todas las páginas
11. **Configuración Opt-in** (`/setup/optinp`) → Configura prompts
12. **Integración** → Copia código y pega en sitio web
13. **Funcionamiento** → Push notifications activas

### **Archivos Más Importantes:**

1. `app/layout.tsx` - Providers globales
2. `app/(main)/layout.tsx` - Site Provider + Guard
3. `contexts/AuthContext.tsx` - Autenticación
4. `contexts/SiteContext.tsx` - Gestión de sitios
5. `components/SiteGuard.tsx` - Protección de rutas
6. `components/sidebar-optimized.tsx` - Navegación
7. `services/api-client.ts` - Cliente HTTP
8. `app/(main)/(setup)/optinp/page.tsx` - Configuración de opt-in
9. `hooks/usePushNotifications.ts` - Gestión de suscripciones
10. `server/src/routes/*` - Backend APIs

### **Tecnologías Clave:**

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript
- **Styling:** Tailwind CSS, shadcn/ui
- **State:** React Context API
- **HTTP:** Axios con interceptors
- **Autenticación:** JWT con HTTP-only cookies
- **Backend:** Node.js + Express
- **Base de Datos:** PostgreSQL
- **Push Notifications:** Web Push API + Service Workers
- **Seguridad:** CSRF tokens, bcrypt, CORS

---

**Documento generado:** $(date)
**Versión:** 1.0
**Última actualización de código:** Noviembre 2025
