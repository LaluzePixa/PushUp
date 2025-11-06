/**
 * Mock del Worker Pool para tests
 * 
 * Este mock simula el comportamiento del worker pool sin usar
 * worker threads reales, permitiendo que los tests funcionen
 * correctamente en Jest.
 */

/**
 * Mock de WorkerPool que procesa en el mismo hilo
 */
class MockWorkerPool {
    constructor(options = {}) {
        this.size = options.size || 4;
        this.isInitialized = false;
        this.stats = {
            tasksCompleted: 0,
            tasksQueued: 0,
            totalProcessingTime: 0
        };
    }

    async initialize() {
        if (this.isInitialized) return;
        this.isInitialized = true;
    }

    async execute(taskData) {
        this.stats.tasksQueued++;
        const startTime = Date.now();

        // Simular procesamiento en el mismo hilo (para tests)
        const { processBatchSync } = await import('./notification-sender.mock.js');
        const result = await processBatchSync(taskData);

        this.stats.tasksCompleted++;
        this.stats.totalProcessingTime += Date.now() - startTime;

        return result;
    }

    async executeMany(tasks) {
        const promises = tasks.map(task => this.execute(task));
        return Promise.all(promises);
    }

    getStats() {
        const avgProcessingTime = this.stats.tasksCompleted > 0
            ? this.stats.totalProcessingTime / this.stats.tasksCompleted
            : 0;

        return {
            poolSize: this.size,
            workersActive: 0,
            workersIdle: this.size,
            queuedTasks: 0,
            tasksCompleted: this.stats.tasksCompleted,
            tasksQueued: this.stats.tasksQueued,
            avgProcessingTime: Math.round(avgProcessingTime),
            workerDetails: []
        };
    }

    async waitForCompletion() {
        // No-op en mock
    }

    async terminate(force = false) {
        this.isInitialized = false;
    }
}

let mockPoolInstance = null;

export function getWorkerPool(options = {}) {
    if (!mockPoolInstance) {
        mockPoolInstance = new MockWorkerPool(options);
    }
    return mockPoolInstance;
}

export async function resetWorkerPool() {
    if (mockPoolInstance) {
        await mockPoolInstance.terminate(true);
        mockPoolInstance = null;
    }
}

export { MockWorkerPool as WorkerPool };
