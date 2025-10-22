# 🚀 Guía de Ejecución - PushSaaS

## 📋 Prerrequisitos

Antes de ejecutar el proyecto, asegúrate de tener instalado:

- **Docker Desktop** (Windows/Mac) o **Docker Engine** (Linux)
- **Docker Compose** v2.0 o superior
- **Git** para clonar el repositorio

### ✅ Verificar instalación

```powershell
# Verificar Docker
docker --version
docker-compose --version

# Verificar que Docker esté ejecutándose
docker ps
```

## 🚀 Ejecución del Proyecto

### 1. Navegar al directorio del proyecto

```powershell
cd c:\Users\Laluze\Desktop\Projects\pushsaas
```

### 2. Verificar configuración

El archivo `.env` ya está configurado en `server/.env` con:
- ✅ Claves VAPID generadas
- ✅ Configuración de base de datos
- ✅ JWT secret configurado

### 3. Construir y ejecutar todos los servicios

```powershell
# Construir e iniciar todos los contenedores
docker-compose up -d --build
```

Este comando:
- 🔨 Construye las imágenes Docker
- 🚀 Inicia todos los servicios en background
- 📊 Configura la red entre contenedores

### 4. Verificar que los servicios estén ejecutándose

```powershell
# Ver estado de los contenedores
docker-compose ps

# Ver logs en tiempo real
docker-compose logs -f
```

Deberías ver 4 contenedores ejecutándose:
- `pushsaas_api` (puerto 3000)
- `pushsaas_db` (puerto 5432)
- `pushsaas_frontend` (puerto 8080)
- `pushsaas_client_legacy` (puerto 8081)

## 🌐 Acceder a la Aplicación

### 🎛️ Panel de Administración Principal
- **URL**: http://localhost:8080
- **Credenciales**:
  - Usuario: `admin@pushsaas.local`
  - Contraseña: `admin123`

**Funcionalidades disponibles:**
- 🔐 Sistema de autenticación
- 👥 Gestión de usuarios y roles
- 📤 Envío de notificaciones push
- 📊 Dashboard con métricas
- ⚙️ Configuración del sistema

### 📱 Cliente de Pruebas (Legacy)
- **URL**: http://localhost:8081
- **Función**: Permite probar suscripciones y recepción de notificaciones

### 🔧 API Backend
- **URL**: http://localhost:3000
- **Health Check**: http://localhost:3000/healthz
- **Panel Legacy**: http://localhost:3000/admin

## 🧪 Flujo de Prueba Completo

### 1. **Acceder al Panel de Administración**
```
Abrir → http://localhost:8080
Login → admin@pushsaas.local / admin123
```

### 2. **Configurar un Usuario**
- Ve a la pestaña "Usuarios"
- Crea un nuevo usuario o activa usuarios existentes
- Asigna roles apropiados

### 3. **Probar Suscripciones**
- Abre http://localhost:8081 en otra pestaña
- Acepta las notificaciones cuando el navegador lo solicite
- El cliente se registrará automáticamente

### 4. **Enviar Notificación de Prueba**
- Regresa al panel de admin (http://localhost:8080)
- Ve a la pestaña "Notificaciones"
- Crea y envía una notificación de prueba
- Deberías ver la notificación en el cliente de pruebas

## 🛠️ Comandos Útiles

### Gestión de Contenedores
```powershell
# Iniciar servicios
docker-compose up -d

# Parar servicios
docker-compose down

# Reiniciar un servicio específico
docker-compose restart api

# Ver logs de un servicio
docker-compose logs -f api

# Reconstruir sin caché
docker-compose build --no-cache
docker-compose up -d
```

### Base de Datos
```powershell
# Acceder a la base de datos
docker-compose exec db psql -U pushsaas -d pushsaas

# Ejecutar migraciones (si las hay)
docker-compose exec api node scripts/migrate.js
```

### Desarrollo
```powershell
# Modo desarrollo con live reload
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Ejecutar comandos dentro del contenedor
docker-compose exec api npm install
docker-compose exec frontend npm run build
```

## 🔧 Solución de Problemas

### ❌ Error: Puerto ya en uso
```powershell
# Verificar qué proceso usa el puerto
netstat -ano | findstr :8080

# Cambiar puertos en docker-compose.yml si es necesario
```

### ❌ Error: Docker no responde
```powershell
# Reiniciar Docker Desktop
# O ejecutar:
docker system prune -f
docker-compose down --volumes
docker-compose up -d --build
```

### ❌ Error: Base de datos no conecta
```powershell
# Verificar que el contenedor de DB esté ejecutándose
docker-compose logs db

# Reiniciar solo la base de datos
docker-compose restart db
```

### ❌ Error: Variables de entorno
```powershell
# Verificar que server/.env existe y tiene las variables correctas
cat server/.env

# Si faltan variables, regenerar VAPID:
docker-compose run --rm api node scripts/genVapid.js
```

## 📊 Monitoreo

### Ver estado en tiempo real
```powershell
# Estadísticas de contenedores
docker stats

# Logs de todos los servicios
docker-compose logs -f --tail=100

# Verificar conectividad
curl http://localhost:3000/healthz
curl http://localhost:8080
```

## 🛑 Detener el Proyecto

```powershell
# Detener servicios (mantiene volúmenes)
docker-compose down

# Detener y eliminar volúmenes (CUIDADO: borra datos de BD)
docker-compose down --volumes

# Limpiar imágenes no utilizadas
docker system prune -f
```

---

## ✅ Checklist de Ejecución Exitosa

- [ ] Docker Desktop ejecutándose
- [ ] `docker-compose up -d --build` completado sin errores
- [ ] 4 contenedores ejecutándose: `docker-compose ps`
- [ ] Panel admin accesible: http://localhost:8080
- [ ] Login exitoso con admin@pushsaas.local/admin123
- [ ] Cliente de pruebas accesible: http://localhost:8081
- [ ] API responde: http://localhost:3000/healthz

¡Tu proyecto PushSaaS debería estar ejecutándose correctamente! 🎉