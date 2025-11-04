/** @type {import('jest').Config} */
const config = {
    // Use Node.js environment for server testing
    testEnvironment: 'node',

    // Root directory for tests and modules
    rootDir: '.',

    // Test directory patterns
    testMatch: [
        '<rootDir>/src/**/__tests__/**/*.test.js',
        '<rootDir>/tests/**/*.test.js'
    ],

    // Setup files after environment is set up
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

    // Module file extensions
    moduleFileExtensions: ['js', 'json'],

    // Coverage configuration
    collectCoverage: false, // Enable with --coverage flag
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/index.js', // Exclude main entry file
        '!src/**/__tests__/**',
        '!**/node_modules/**'
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    coverageThreshold: {
        global: {
            branches: 70,
            functions: 70,
            lines: 70,
            statements: 70
        }
    },

    // Test timeout (30 seconds for integration tests)
    testTimeout: 30000,

    // Clear mocks between tests
    clearMocks: true,

    // Restore mocks after each test
    restoreMocks: true,

    // Verbose output
    verbose: true,

    // Transform configuration for ES modules
    extensionsToTreatAsEsm: ['.js'],

    // Global setup and teardown
    globalSetup: '<rootDir>/tests/globalSetup.js',
    globalTeardown: '<rootDir>/tests/globalTeardown.js',

    // Mock patterns
    moduleNameMapping: {},

    // Force exit after tests
    forceExit: true,

    // Detect open handles
    detectOpenHandles: true
};

export default config;