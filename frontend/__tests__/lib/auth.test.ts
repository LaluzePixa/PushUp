import { checkAuth } from '@/lib/auth';

// Mock fetch
global.fetch = jest.fn();

describe('auth library', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset console.error mock
    jest.spyOn(console, 'error').mockImplementation(() => { });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('checkAuth', () => {
    it('returns authenticated user when session is valid', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        role: 'user' as const,
        isActive: true,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-02T00:00:00Z',
      };

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ user: mockUser }),
      };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(mockResponse as any);

      const result = await checkAuth();

      expect(fetch).toHaveBeenCalledWith('/api/auth/session', {
        method: 'GET',
        credentials: 'include',
      });
      expect(result).toEqual({
        isAuthenticated: true,
        user: mockUser,
      });
    });

    it('returns unauthenticated when session is invalid', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
      };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(mockResponse as any);

      const result = await checkAuth();

      expect(fetch).toHaveBeenCalledWith('/api/auth/session', {
        method: 'GET',
        credentials: 'include',
      });
      expect(result).toEqual({
        isAuthenticated: false,
        user: null,
      });
    });

    it('handles network errors gracefully', async () => {
      const networkError = new Error('Network error');
      (fetch as jest.MockedFunction<typeof fetch>).mockRejectedValue(networkError);

      const result = await checkAuth();

      expect(console.error).toHaveBeenCalledWith('Auth check failed:', networkError);
      expect(result).toEqual({
        isAuthenticated: false,
        user: null,
      });
    });

    it('handles JSON parsing errors', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
      };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(mockResponse as any);

      const result = await checkAuth();

      expect(result).toEqual({
        isAuthenticated: false,
        user: null,
      });
    });

    it('uses correct request configuration', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
      };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(mockResponse as any);

      await checkAuth();

      expect(fetch).toHaveBeenCalledWith('/api/auth/session', {
        method: 'GET',
        credentials: 'include',
      });
    });

    it('handles different user roles', async () => {
      const mockAdminUser = {
        id: 2,
        email: 'admin@example.com',
        role: 'admin' as const,
        isActive: true,
        createdAt: '2023-01-01T00:00:00Z',
      };

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ user: mockAdminUser }),
      };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(mockResponse as any);

      const result = await checkAuth();

      expect(result).toEqual({
        isAuthenticated: true,
        user: mockAdminUser,
      });
    });

    it('handles superadmin role', async () => {
      const mockSuperAdminUser = {
        id: 3,
        email: 'superadmin@example.com',
        role: 'superadmin' as const,
        isActive: true,
        createdAt: '2023-01-01T00:00:00Z',
      };

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ user: mockSuperAdminUser }),
      };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(mockResponse as any);

      const result = await checkAuth();

      expect(result).toEqual({
        isAuthenticated: true,
        user: mockSuperAdminUser,
      });
    });

    it('handles inactive users', async () => {
      const mockInactiveUser = {
        id: 4,
        email: 'inactive@example.com',
        role: 'user' as const,
        isActive: false,
        createdAt: '2023-01-01T00:00:00Z',
      };

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ user: mockInactiveUser }),
      };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(mockResponse as any);

      const result = await checkAuth();

      expect(result).toEqual({
        isAuthenticated: true,
        user: mockInactiveUser,
      });
    });
  });
});