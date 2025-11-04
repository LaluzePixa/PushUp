/**
 * Environment Setup for Frontend Tests
 * Sets up environment variables before any tests run
 */

// Mock environment variables for testing
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000';
process.env.NEXT_PUBLIC_APP_NAME = 'PushSaaS Test';
process.env.NEXT_PUBLIC_APP_VERSION = '1.0.0-test';

// Mock Next.js router
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => { },
        removeListener: () => { },
        addEventListener: () => { },
        removeEventListener: () => { },
        dispatchEvent: () => false,
    }),
});

// Mock IntersectionObserver
(global as any).IntersectionObserver = class MockIntersectionObserver {
    observe() {
        return null;
    }
    disconnect() {
        return null;
    }
    unobserve() {
        return null;
    }
};

// Mock ResizeObserver
(global as any).ResizeObserver = class MockResizeObserver {
    observe() {
        return null;
    }
    disconnect() {
        return null;
    }
    unobserve() {
        return null;
    }
};