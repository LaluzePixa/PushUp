# 🚀 Guía de Ejecución - PushSaaS

## 🔄 Modos de Desarrollo

### **Opción 1: Desarrollo Local con Hot Reload (Recomendado)**

Para desarrollo activo donde haces cambios frecuentes:

#### 1. Base de Datos (Solo Docker)
```bash
# Solo levantar la base de datos
docker-compose up db -d
```

#### 2. Backend Local
```bash
# Terminal 1 - Backend
cd server
npm install
# Crear archivo .env si no existe
npm run migrate  # Ejecutar migraciones
npm run start    # O usar nodemon para auto-reload
```

#### 3. Frontend Local  
```bash
# Terminal 2 - Frontend
cd frontend
npm install
npm run dev      # Vite con hot reload en http://localhost:5173
```

**✅ Ventajas:**
- Hot reload automático en frontend
- Cambios de backend se ven al guardar (con nodemon)
- No rebuilds de Docker
- Debugging más fácil

---

### **Opción 2: Docker Completo (Para producción/testing)**

Para testing completo o deployment:

```bash
# Levantar todo el stack
docker-compose up --build

# O en background
docker-compose up -d --build
```

**⚠️ Requiere rebuild cuando cambias código**

---

### **Opción 3: Híbrido (Frontend local + Backend Docker)**

```bash
# Solo backend y DB en Docker
docker-compose up api db -d

# Frontend local
cd frontend
npm run dev
```

---

## 🔧 Configuración para Hot Reload

### Backend con Nodemon

Modifica `server/package.json`:

```json
{
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "migrate": "node scripts/migrate.js",
    "gen:vapid": "node scripts/genVapid.js"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

```bash
cd server
npm install nodemon --save-dev
npm run dev  # Auto-reload en cambios
```

### Frontend con Vite

Ya configurado! `npm run dev` incluye hot reload automático.

---

## 📋 Comandos Útiles

### Desarrollo Diario (Opción 1)
```bash
# Terminal 1: Base de datos
docker-compose up db -d

# Terminal 2: Backend  
cd server && npm run dev

# Terminal 3: Frontend
cd frontend && npm run dev
```

### Ver logs en tiempo real
```bash
# Logs de DB
docker-compose logs -f db

# Logs de todos los servicios Docker
docker-compose logs -f
```

### Reiniciar servicios específicos
```bash
# Solo rebuild backend
docker-compose up --build api -d

# Solo rebuild frontend  
docker-compose up --build frontend -d
```

### Cleanup
```bash
# Parar todos los contenedores
docker-compose down

# Parar y limpiar volúmenes
docker-compose down -v

# Limpiar imágenes no usadas
docker system prune
```

---

## 🌐 URLs de Acceso

- **Frontend (Vite dev):** http://localhost:5173
- **Frontend (Docker):** http://localhost:8080  
- **Backend API:** http://localhost:3000
- **Cliente Legacy:** http://localhost:8081
- **Base de Datos:** localhost:5432

---

## 💡 Recomendaciones

### Para Desarrollo Activo:
✅ **Usar Opción 1** (servicios locales)
- Cambios instantáneos
- Mejor debugging
- Logs directos en terminal

### Para Testing Final:
✅ **Usar Opción 2** (Docker completo)
- Ambiente idéntico a producción
- Test de integraciones
- Validar Dockerfiles

### Variables de Entorno:
- Crea `server/.env` con configuración local
- `frontend/.env.local` para variables del frontend

### Hot Reload Tips:
- Frontend: Cambios automáticos con Vite
- Backend: Usar nodemon para auto-restart
- DB: Solo necesita restart si cambias esquema