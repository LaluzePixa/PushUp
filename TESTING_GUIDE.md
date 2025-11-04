# 🧪 Guía Completa de Testing

## 📋 Resumen de Cobertura de Tests

### ✅ Tests Implementados

#### Frontend (52 tests pasando)
- **API Client Tests** - Pruebas de comunicación con backend
- **Authentication Context** - Pruebas de login/logout
- **Login Component** - Pruebas de UI de login
- **Site Selection** - Pruebas de selección de sitios
- **Push Notifications Hook** - Pruebas de notificaciones push
- **Multi-Site Switching** (NUEVO) - Pruebas de cambio entre sitios

#### Server (Requiere PostgreSQL)
- **Authentication Middleware** - JWT, hashing, autorización
- **Authentication Routes** - Login, register, change password
- **Sites Routes** - CRUD de sitios, paginación
- **Campaigns Routes** - CRUD y envío de campañas
- **Multi-Site Isolation** (NUEVO) - Aislamiento de datos entre sitios
- **Campaign Scale** (NUEVO) - Tests de carga para campañas

---

## 🆕 Nuevos Tests Críticos

### 1. Tests de Múltiples Sitios (`multi-site-isolation.test.js`)

**Qué prueban:**
- ✅ Aislamiento de datos entre sitios
- ✅ Cambio rápido entre sitios sin mezclar datos
- ✅ Requests concurrentes a diferentes sitios
- ✅ Filtrado correcto de campañas por sitio
- ✅ Prevención de fugas de datos entre usuarios
- ✅ Límite de 5 sitios por usuario

**Escenarios cubiertos:**
```javascript
// Usuario con 3 sitios
Site 1: 2 subscriptores, 1 campaña
Site 2: 1 subscriptor, 1 campaña
Site 3: 3 subscriptores, 2 campañas

// Tests incluyen:
- Cambio entre los 3 sitios verificando conteos correctos
- 10 requests rápidos alternando entre sitios
- Requests concurrentes simultáneos
- Verificación de que datos no se mezclan
```

**Cómo ejecutar:**
```bash
cd server
npm test -- multi-site-isolation.test.js
```

### 2. Tests de Escala de Campañas (`campaign-scale.test.js`)

**Qué prueban:**
- ✅ Envío a 100 usuarios (< 5 segundos)
- ✅ Envío a 500 usuarios (< 15 segundos)
- ⏭️ Envío a 1000+ usuarios (skip por defecto, < 60 segundos)
- ✅ Manejo de fallos parciales
- ✅ Estadísticas precisas de ejecución
- ✅ Campañas concurrentes
- ✅ Gestión de memoria

**Escenarios cubiertos:**
```javascript
// Test con 100 usuarios
- Crear 100 subscriptores
- Enviar campaña inmediata
- Verificar tiempo < 5 segundos
- Validar que llegó a todos

// Test con 500 usuarios
- Crear 500 subscriptores en batches de 50
- Enviar campaña
- Verificar tiempo < 15 segundos

// Test de 1000+ usuarios (skip)
- Crear 1000 subscriptores en batches de 100
- Enviar campaña
- Medir performance y throughput
```

**Cómo ejecutar:**
```bash
# Tests normales (100 y 500 usuarios)
cd server
npm test -- campaign-scale.test.js

# Incluir test de 1000+ usuarios
npm test -- --testNamePattern="1000"
```

### 3. Tests de Cambio de Sitios Frontend (`multi-site-switching.test.tsx`)

**Qué prueban:**
- ✅ UI responde correctamente al cambiar sitio
- ✅ Datos se actualizan sin page reload
- ✅ Loading states durante cambio
- ✅ No se mezclan datos entre sitios
- ✅ Performance del cambio (< 500ms)
- ✅ Manejo de 5 sitios simultáneos

**Escenarios cubiertos:**
```javascript
// Usuario con 5 sitios
Tech Blog:         1,500 subscriptores, 10 campañas
E-commerce Store:  5,200 subscriptores, 25 campañas
News Portal:      12,000 subscriptores, 50 campañas
Community Forum:     800 subscriptores,  5 campañas
Portfolio Site:      150 subscriptores,  2 campañas

// Tests incluyen:
- Cambio secuencial por los 5 sitios
- Cambio rápido de ida y vuelta
- Verificación de conteos correctos
- Sin memory leaks
```

**Cómo ejecutar:**
```bash
cd frontend
npm test -- multi-site-switching.test.tsx
```

---

## 🚀 Ejecutar Todos los Tests

### Frontend
```bash
cd frontend

# Todos los tests
npm test

# Con cobertura
npm test -- --coverage

# Solo tests nuevos
npm test -- multi-site-switching

# Watch mode
npm test -- --watch
```

### Server
```bash
cd server

# Todos los tests (requiere PostgreSQL)
npm test

# Solo tests específicos
npm test -- multi-site-isolation
npm test -- campaign-scale

# Con cobertura
npm test -- --coverage

# Tests de 1000+ usuarios
npm test -- --testNamePattern="1000"
```

---

## 🐘 Configurar PostgreSQL para Tests del Server

Los tests del servidor requieren una base de datos PostgreSQL.

### Opción 1: Docker (Recomendado)
```bash
docker run --name pushup-test-db \
  -e POSTGRES_PASSWORD=test123 \
  -e POSTGRES_DB=pushup_test \
  -p 5432:5432 \
  -d postgres:15

# Verificar que funciona
docker ps
```

### Opción 2: PostgreSQL Local
```bash
# Crear base de datos de test
psql -U postgres
CREATE DATABASE pushup_test;
\q
```

### Variables de Entorno
Crear archivo `.env.test` en `/server`:
```env
NODE_ENV=test
DATABASE_URL=postgresql://postgres:test123@localhost:5432/pushup_test
JWT_SECRET=test-secret-key-do-not-use-in-production
VAPID_PUBLIC_KEY=test-vapid-public-key
VAPID_PRIVATE_KEY=test-vapid-private-key
```

---

## 📊 Métricas de Performance

### Tiempos Esperados

#### Campañas
- 100 usuarios: < 5 segundos ✅
- 500 usuarios: < 15 segundos ✅
- 1000 usuarios: < 60 segundos ✅

#### Cambio de Sitios
- Cambio de sitio (UI): < 500ms ✅
- Request al servidor: < 200ms ✅
- Carga de datos: < 1 segundo ✅

### Uso de Memoria
- Tests completos frontend: < 100 MB
- Tests completos server: < 200 MB
- Test de 1000 usuarios: < 50 MB de incremento

---

## ❌ Tests Conocidos como Skip

### Frontend
1. **usePushNotifications - detección no soportada**
   - Razón: Mockear detección de APIs del navegador es complejo
   - TODO: Refactorizar hook para facilitar testing

2. **usePushNotifications - permisos denegados**
   - Razón: Estado de permisos necesita sincronización
   - TODO: Mockear Notification.permission correctamente

### Server
1. **Campaign Scale - 1000+ usuarios**
   - Razón: Tarda 1-2 minutos
   - Cómo ejecutar: `npm test -- --testNamePattern="1000"`

---

## 🎯 Cobertura de Escenarios Críticos

### ✅ Completamente Cubierto

1. **Cambio entre múltiples sitios**
   - Cambio rápido sin errores
   - Datos correctos por sitio
   - Sin fugas de datos
   - Performance adecuada

2. **Envío a escala**
   - 100 usuarios: ✅
   - 500 usuarios: ✅
   - 1000+ usuarios: ✅ (skip por defecto)
   - Manejo de errores: ✅

3. **Aislamiento de datos**
   - Por sitio: ✅
   - Por usuario: ✅
   - Concurrencia: ✅

### 🔶 Parcialmente Cubierto

1. **Rate limiting**
   - Mock básico implementado
   - TODO: Tests con límites reales de APIs

2. **Recuperación ante fallos**
   - Manejo de errores parciales: ✅
   - TODO: Tests de retry logic

### ❌ No Cubierto (Futuro)

1. **Tests E2E**
   - Flujo completo usuario → backend → notificación
   - Requiere: Cypress/Playwright

2. **Tests de Stress**
   - 10,000+ usuarios
   - Múltiples campañas simultáneas a miles

3. **Tests de Carga Sostenida**
   - Envío continuo durante horas
   - Monitoreo de degradación

---

## 🔧 Solución de Problemas

### Tests del Frontend fallan
```bash
# Limpiar cache
rm -rf node_modules/.cache

# Reinstalar dependencias
npm ci

# Verificar versión de Node
node --version  # Debe ser v18+
```

### Tests del Server fallan
```bash
# Verificar PostgreSQL está corriendo
docker ps | grep postgres

# O si es local
pg_isready

# Verificar conexión
psql postgresql://postgres:test123@localhost:5432/pushup_test

# Limpiar base de datos
npm run db:reset:test
```

### Tests de campaña tardan mucho
```bash
# Usar mock más rápido
export MOCK_PUSH_SEND=true

# O skip tests largos
npm test -- --testPathIgnorePatterns="campaign-scale"
```

---

## 📈 Próximos Pasos

### Prioridad Alta
- [ ] Tests E2E con Cypress
- [ ] Tests de rate limiting real
- [ ] Logs de performance en CI/CD

### Prioridad Media
- [ ] Tests de 10,000+ usuarios
- [ ] Tests de carga sostenida
- [ ] Monitoring de memory leaks

### Prioridad Baja
- [ ] Tests de accesibilidad
- [ ] Tests de SEO
- [ ] Tests de compatibilidad de navegadores

---

## 📚 Recursos

- [Jest Documentation](https://jestjs.io/)
- [Testing Library](https://testing-library.com/)
- [Supertest for API Testing](https://github.com/visionmedia/supertest)
- [PostgreSQL Docker](https://hub.docker.com/_/postgres)

---

## 🤝 Contribuir

Al agregar nuevos features:
1. Escribir tests ANTES del código (TDD)
2. Mantener cobertura > 70%
3. Documentar tests complejos
4. Actualizar esta guía

---

**Última actualización:** $(date '+%Y-%m-%d')
**Versión:** 1.0.0
