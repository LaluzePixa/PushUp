# Worker Pool Configuration Guide

## Configuración del Pool de Workers

El sistema de campaña utiliza **Worker Threads** de Node.js para procesamiento paralelo de notificaciones push, aprovechando múltiples cores del CPU.

### Variables de Entorno

Configura estas variables en tu archivo `.env`:

```bash
# Número de workers (threads) para procesamiento paralelo
# 0 = auto-detect (usa 75% de los cores disponibles)
# Recomendado: 75-85% de tus CPU cores
WORKER_POOL_SIZE=8

# Concurrencia por worker (no usado actualmente, reservado para futuro)
WORKER_CONCURRENCY=2

# Tamaño de batch para envío de notificaciones
# Mayor = menos queries a DB pero más memoria
# Recomendado: 500-1000 para mejor rendimiento
NOTIFICATION_BATCH_SIZE=1000
```

### Configuración por Máquina

#### Servidor con 4 cores
```bash
WORKER_POOL_SIZE=3    # 75% de 4 cores
NOTIFICATION_BATCH_SIZE=500
```

#### Servidor con 8 cores
```bash
WORKER_POOL_SIZE=6    # 75% de 8 cores
NOTIFICATION_BATCH_SIZE=1000
```

#### Servidor con 12 cores (recomendado)
```bash
WORKER_POOL_SIZE=8    # 67% de 12 cores
NOTIFICATION_BATCH_SIZE=1000
```

#### Servidor con 16+ cores
```bash
WORKER_POOL_SIZE=12   # 75% de 16 cores
NOTIFICATION_BATCH_SIZE=1000
```

### Auto-detección

Si configuras `WORKER_POOL_SIZE=0` o lo dejas vacío, el sistema detectará automáticamente el número óptimo de workers:

```bash
# Sistema detectará 75% de CPU cores disponibles
WORKER_POOL_SIZE=0
```

## Rendimiento Esperado

### Comparación de Throughput

| Configuración | Cores | Workers | Throughput Estimado | Tiempo (1M usuarios) |
|---------------|-------|---------|---------------------|---------------------|
| **Sin Workers** | 12 | 0 | ~8,000 u/s | ~2 min |
| **2 Workers** | 4 | 2 | ~12,000 u/s | ~83s |
| **4 Workers** | 8 | 4 | ~18,000 u/s | ~55s |
| **8 Workers** | 12 | 8 | ~25,000 u/s | ~40s |
| **12 Workers** | 16 | 12 | ~30,000 u/s | ~33s |

### Factores que Afectan el Rendimiento

1. **CPU Cores**: Más cores = más paralelismo posible
2. **Memoria RAM**: Cada worker consume ~50-100 MB
3. **Latencia de Red**: Push services (FCM, APNS) pueden ser limitantes
4. **PostgreSQL**: Pool de conexiones debe soportar carga concurrente
5. **Batch Size**: Batches más grandes = menos overhead pero más memoria

## Monitoreo

### Logs del Worker Pool

Al inicializar, verás:
```
🚀 Initializing worker pool with 8 workers (12 CPU cores available)
✅ Worker pool initialized: 8 workers ready
```

Durante ejecución de campaña:
```
[Campaign 123] 🚀 Sending to 1000000 subscribers in 1000 batches using worker pool
[Campaign 123] 📤 Distributing 1000 tasks across 8 workers
[Campaign 123] ✅ Sending completed in 40.25s
[Campaign 123] 📊 Throughput: 24844.72 notifications/second
[Campaign 123] 📈 Stats: 998500 sent, 1200 failed, 300 expired
```

### API de Estadísticas

Puedes obtener estadísticas del worker pool:

```javascript
import { getWorkerPool } from './services/worker-pool.js';

const pool = getWorkerPool();
const stats = pool.getStats();

console.log(stats);
// {
//   poolSize: 8,
//   workersActive: 5,
//   workersIdle: 3,
//   queuedTasks: 150,
//   tasksCompleted: 850,
//   tasksQueued: 1000,
//   avgProcessingTime: 45,
//   workerDetails: [...]
// }
```

## Optimización

### Ajuste Fino del Batch Size

El `NOTIFICATION_BATCH_SIZE` óptimo depende de varios factores:

**Para campañas pequeñas (<10K usuarios):**
```bash
NOTIFICATION_BATCH_SIZE=500
```

**Para campañas medianas (10K-100K usuarios):**
```bash
NOTIFICATION_BATCH_SIZE=1000
```

**Para campañas masivas (100K-1M+ usuarios):**
```bash
NOTIFICATION_BATCH_SIZE=1500
```

### Balance Memoria vs Rendimiento

Cada worker consume memoria. Si experimentas problemas de memoria:

1. **Reduce workers:**
   ```bash
   WORKER_POOL_SIZE=4  # En lugar de 8
   ```

2. **Reduce batch size:**
   ```bash
   NOTIFICATION_BATCH_SIZE=500  # En lugar de 1000
   ```

3. **Aumenta límite de memoria de Node.js:**
   ```bash
   NODE_OPTIONS="--max-old-space-size=4096"
   ```

## Troubleshooting

### Worker Pool no se inicializa

**Síntoma:** No ves logs de inicialización
**Solución:** Verifica que el archivo worker existe:
```bash
ls -la src/workers/notification-sender.worker.js
```

### Error: "Worker initialization timeout"

**Causa:** Worker tarda más de 5 segundos en inicializar
**Solución:** 
1. Verifica que todas las dependencias estén instaladas
2. Revisa logs de error del worker
3. Aumenta timeout en `worker-pool.js` si es necesario

### Bajo rendimiento con muchos workers

**Causa:** Más workers no siempre = mejor rendimiento
**Solución:** 
1. No excedas el número de CPU cores
2. Considera latencia de red como bottleneck
3. Verifica pool de conexiones PostgreSQL:
   ```bash
   # .env
   DATABASE_MAX_CONNECTIONS=20
   ```

### High memory usage

**Causa:** Batches muy grandes o muchos workers
**Solución:**
1. Reduce `WORKER_POOL_SIZE`
2. Reduce `NOTIFICATION_BATCH_SIZE`
3. Implementa límite de campaña concurrente

## Testing

### Test Rápido (10K usuarios)

```bash
npm test -- campaign-million-users.test.js --testNamePattern="10,000"
```

Deberías ver throughput >15,000 u/s con 8 workers.

### Test Completo (1M usuarios)

```bash
npm test -- campaign-million-users.test.js --testNamePattern="1,000,000"
```

Con 8 workers deberías lograr <45 segundos para 1M usuarios.

## Producción

### Recomendaciones

1. **Auto-scaling**: Usa 75% de cores disponibles
   ```bash
   WORKER_POOL_SIZE=0  # Auto-detect
   ```

2. **Monitoreo**: Implementa alertas si throughput cae <10,000 u/s

3. **Limpieza**: El pool se limpia automáticamente al cerrar el servidor

4. **Graceful Shutdown**: Implementado por defecto
   ```javascript
   process.on('SIGTERM', async () => {
     await workerPool.terminate(); // Espera tareas activas
   });
   ```

## Ejemplos de Configuración

### Desarrollo Local
```bash
WORKER_POOL_SIZE=4
NOTIFICATION_BATCH_SIZE=500
```

### Staging
```bash
WORKER_POOL_SIZE=0  # Auto-detect
NOTIFICATION_BATCH_SIZE=1000
```

### Producción
```bash
WORKER_POOL_SIZE=0  # Auto-detect
NOTIFICATION_BATCH_SIZE=1000
NODE_OPTIONS="--max-old-space-size=4096"
```
