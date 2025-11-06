/**
 * Gestión del Worker Thread Pool para procesamiento de notificaciones
 * 
 * Este módulo administra un pool de worker threads que procesan
 * el envío de notificaciones push en paralelo, aprovechando
 * múltiples cores del CPU.
 * 
 * @module services/worker-pool
 */

import { Worker } from 'worker_threads';
import { cpus } from 'os';
import path from 'path';
import { dirname } from 'path';
import { createRequire } from 'module';
import logger from '../config/logger.js';

// Solución compatible con Jest y ES modules
const require = createRequire(import.meta.url);
const __dirname = dirname(require.resolve('../services/worker-pool.js'));

/**
 * Pool de Worker Threads para procesamiento paralelo
 */
class WorkerPool {
    constructor(options = {}) {
        this.workerPath = options.workerPath || path.join(__dirname, '../workers/notification-sender.worker.js');
        this.size = this.determinePoolSize(options.size);
        this.concurrency = options.concurrency || 2;
        this.workers = [];
        this.availableWorkers = [];
        this.taskQueue = [];
        this.isInitialized = false;
        this.stats = {
            tasksCompleted: 0,
            tasksQueued: 0,
            totalProcessingTime: 0
        };
    }

    /**
     * Determina el tamaño óptimo del pool basado en la configuración
     * 
     * @param {number} configSize - Tamaño configurado en .env
     * @returns {number} Tamaño óptimo del pool
     */
    determinePoolSize(configSize) {
        const numCPUs = cpus().length;

        // Si se configuró 0 o no se configuró, auto-detectar
        if (!configSize || configSize === 0) {
            // Usar 75% de los cores disponibles (dejar algunos para el SO y Node.js principal)
            return Math.max(1, Math.floor(numCPUs * 0.75));
        }

        // Validar que no exceda el número de CPUs
        const validatedSize = Math.min(configSize, numCPUs);

        if (validatedSize < configSize) {
            logger.warn({ configSize, cpuCores: numCPUs, usingSize: validatedSize }, 'Worker pool size exceeds CPU cores');
        }

        return Math.max(1, validatedSize);
    }

    /**
     * Inicializa el pool de workers
     * 
     * @returns {Promise<void>}
     */
    async initialize() {
        if (this.isInitialized) {
            return;
        }

        logger.info({ workers: this.size, cpuCores: cpus().length }, 'Initializing worker pool');

        const workerPromises = [];

        for (let i = 0; i < this.size; i++) {
            const workerPromise = this.createWorker(i);
            workerPromises.push(workerPromise);
        }

        await Promise.all(workerPromises);
        this.isInitialized = true;

        logger.info({ workers: this.workers.length }, 'Worker pool initialized');
    }

    /**
     * Crea un worker individual
     * 
     * @param {number} id - ID del worker
     * @returns {Promise<Worker>}
     */
    createWorker(id) {
        return new Promise((resolve, reject) => {
            const worker = new Worker(this.workerPath);

            worker.workerId = id;
            worker.isBusy = false;
            worker.tasksProcessed = 0;

            worker.on('message', (message) => {
                if (message.type === 'ready') {
                    this.workers.push(worker);
                    this.availableWorkers.push(worker);
                    resolve(worker);
                }
            });

            worker.on('error', (error) => {
                logger.error({ err: error, workerId: id }, 'Worker error');
                reject(error);
            });

            worker.on('exit', (code) => {
                if (code !== 0) {
                    logger.error({ workerId: id, exitCode: code }, 'Worker exited with error code');
                }
            });

            // Timeout de inicialización
            setTimeout(() => {
                reject(new Error(`Worker ${id} initialization timeout`));
            }, 5000);
        });
    }

    /**
     * Ejecuta una tarea en un worker disponible
     * 
     * @param {Object} taskData - Datos de la tarea
     * @returns {Promise<Object>} Resultado de la tarea
     */
    async execute(taskData) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        return new Promise((resolve, reject) => {
            const task = {
                data: taskData,
                resolve,
                reject,
                queuedAt: Date.now()
            };

            this.taskQueue.push(task);
            this.stats.tasksQueued++;
            this.processQueue();
        });
    }

    /**
     * Procesa la cola de tareas asignándolas a workers disponibles
     */
    processQueue() {
        while (this.taskQueue.length > 0 && this.availableWorkers.length > 0) {
            const task = this.taskQueue.shift();
            const worker = this.availableWorkers.shift();

            this.runTask(worker, task);
        }
    }

    /**
     * Ejecuta una tarea en un worker específico
     * 
     * @param {Worker} worker - Worker que ejecutará la tarea
     * @param {Object} task - Tarea a ejecutar
     */
    runTask(worker, task) {
        worker.isBusy = true;
        const startTime = Date.now();

        const messageHandler = (message) => {
            if (message.type === 'ready') {
                return; // Ignorar mensajes de inicialización
            }

            const processingTime = Date.now() - startTime;
            this.stats.totalProcessingTime += processingTime;
            this.stats.tasksCompleted++;

            worker.tasksProcessed++;
            worker.isBusy = false;
            worker.off('message', messageHandler);
            worker.off('error', errorHandler);

            // Devolver el worker al pool
            this.availableWorkers.push(worker);

            // Procesar siguiente tarea en la cola
            this.processQueue();

            if (message.success) {
                task.resolve(message.result);
            } else {
                task.reject(new Error(message.error.message));
            }
        };

        const errorHandler = (error) => {
            worker.off('message', messageHandler);
            worker.off('error', errorHandler);

            worker.isBusy = false;
            this.availableWorkers.push(worker);
            this.processQueue();

            task.reject(error);
        };

        worker.on('message', messageHandler);
        worker.on('error', errorHandler);
        worker.postMessage(task.data);
    }

    /**
     * Ejecuta múltiples tareas en paralelo
     * 
     * @param {Array<Object>} tasks - Array de tareas a ejecutar
     * @returns {Promise<Array>} Resultados de las tareas
     */
    async executeMany(tasks) {
        const promises = tasks.map(task => this.execute(task));
        return Promise.all(promises);
    }

    /**
     * Obtiene estadísticas del pool
     * 
     * @returns {Object} Estadísticas del pool
     */
    getStats() {
        const avgProcessingTime = this.stats.tasksCompleted > 0
            ? this.stats.totalProcessingTime / this.stats.tasksCompleted
            : 0;

        return {
            poolSize: this.size,
            workersActive: this.workers.filter(w => w.isBusy).length,
            workersIdle: this.availableWorkers.length,
            queuedTasks: this.taskQueue.length,
            tasksCompleted: this.stats.tasksCompleted,
            tasksQueued: this.stats.tasksQueued,
            avgProcessingTime: Math.round(avgProcessingTime),
            workerDetails: this.workers.map(w => ({
                id: w.workerId,
                busy: w.isBusy,
                tasksProcessed: w.tasksProcessed
            }))
        };
    }

    /**
     * Espera a que todas las tareas se completen
     * 
     * @returns {Promise<void>}
     */
    async waitForCompletion() {
        while (this.taskQueue.length > 0 || this.availableWorkers.length < this.workers.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    /**
     * Finaliza el pool de workers
     * 
     * @param {boolean} force - Si es true, termina inmediatamente
     * @returns {Promise<void>}
     */
    async terminate(force = false) {
        if (!force) {
            await this.waitForCompletion();
        }

        logger.info({ workers: this.workers.length }, 'Terminating worker pool');

        const terminationPromises = this.workers.map(async (worker) => {
            await worker.terminate();
        });

        await Promise.all(terminationPromises);

        this.workers = [];
        this.availableWorkers = [];
        this.taskQueue = [];
        this.isInitialized = false;

        logger.info('Worker pool terminated');
    }
}

// Singleton: mantener una sola instancia del pool
let poolInstance = null;

/**
 * Obtiene o crea la instancia del pool de workers
 * 
 * @param {Object} options - Opciones de configuración
 * @returns {WorkerPool} Instancia del pool
 */
export function getWorkerPool(options = {}) {
    if (!poolInstance) {
        poolInstance = new WorkerPool(options);
    }
    return poolInstance;
}

/**
 * Reinicia el pool de workers (útil para tests)
 * 
 * @returns {Promise<void>}
 */
export async function resetWorkerPool() {
    if (poolInstance) {
        await poolInstance.terminate(true);
        poolInstance = null;
    }
}

export { WorkerPool };
