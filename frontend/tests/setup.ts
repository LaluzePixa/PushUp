/**
 * Jest Setup File for Frontend Tests
 * Runs after test environment is set up but before tests run
 */

import '@testing-library/jest-dom';

// Mock next/navigation
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
        prefetch: jest.fn(),
        back: jest.fn(),
        forward: jest.fn(),
        refresh: jest.fn(),
    }),
    usePathname: () => '/test-path',
    useSearchParams: () => new URLSearchParams(),
}));

// Mock next/image
jest.mock('next/image', () => ({
    __esModule: true,
    default: (props: any) => {
        return React.createElement('img', { ...props, alt: props.alt || '' });
    },
}));

// Mock next-themes
jest.mock('next-themes', () => ({
    useTheme: () => ({
        theme: 'light',
        setTheme: jest.fn(),
        themes: ['light', 'dark'],
    }),
    ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock fetch globally
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
});

// Mock sessionStorage
const sessionStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
    value: sessionStorageMock,
});

// Mock document.cookie
Object.defineProperty(document, 'cookie', {
    writable: true,
    value: '',
});

// Mock URL.createObjectURL
Object.defineProperty(URL, 'createObjectURL', {
    writable: true,
    value: jest.fn(() => 'mocked-url'),
});

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
    value: {
        randomUUID: () => 'mocked-uuid',
    },
});

// Console suppression for cleaner test output
const originalError = console.error;

// Clear all mocks after each test
afterEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear.mockClear();
    sessionStorageMock.clear.mockClear();
});

// Global test utilities
declare global {
    var testUtils: {
        createMockUser: () => any;
        createMockSite: () => any;
        createMockCampaign: () => any;
        createMockApiResponse: (data?: any, success?: boolean) => any;
        mockFetch: (response: any, ok?: boolean) => void;
    };
}

global.testUtils = {
    createMockUser: () => ({
        id: 1,
        email: 'test@example.com',
        role: 'user',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    }),

    createMockSite: () => ({
        id: 1,
        name: 'Test Site',
        domain: 'test.example.com',
        description: 'Test site description',
        isActive: true,
        subscribersCount: 100,
        campaignsCount: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    }),

    createMockCampaign: () => ({
        id: '1',
        name: 'Test Campaign',
        dateCreated: new Date().toLocaleString('es-ES'),
        status: 'Success',
        totalAttempts: 100,
        successfullySent: 95,
        failedToSend: 5,
        delivered: 90,
        clicked: 10,
        closed: 0,
        ctr: '11.11',
        message: 'Test campaign message',
    }),

    createMockApiResponse: (data = {}, success = true) => ({
        success,
        data,
        error: success ? undefined : 'Test error',
    }),

    mockFetch: (response: any, ok = true) => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok,
            json: async () => response,
            text: async () => JSON.stringify(response),
            status: ok ? 200 : 400,
        });
    },
};