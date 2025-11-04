import apiClient, { tokenUtils, healthCheck } from '@/services/api-client';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock window.localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};

// Mock document.cookie
Object.defineProperty(document, 'cookie', {
  writable: true,
  value: '',
});

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('ApiClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.setItem.mockClear();
    mockLocalStorage.removeItem.mockClear();
  });

  describe('tokenUtils', () => {
    it('gets token from localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('test-token');
      
      const token = tokenUtils.get();
      
      expect(token).toBe('test-token');
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('auth_token');
    });

    it('returns null when no token in localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const token = tokenUtils.get();
      
      expect(token).toBeNull();
    });

    it('sets token in localStorage and cookie', () => {
      const testToken = 'test-token-123';
      
      tokenUtils.set(testToken);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('auth_token', testToken);
      expect(document.cookie).toContain(`auth-token=${testToken}`);
      expect(document.cookie).toContain('path=/');
      expect(document.cookie).toContain('SameSite=Lax');
    });

    it('removes token from localStorage and cookie', () => {
      tokenUtils.remove();
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_token');
      expect(document.cookie).toContain('auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC');
    });
  });

  describe('HTTP methods', () => {
    it('makes GET request without token', async () => {
      const mockResponse = { data: { test: 'value' } };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = await apiClient.get('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/test',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('makes GET request with token', async () => {
      const mockResponse = { data: { test: 'value' } };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });
      mockLocalStorage.getItem.mockReturnValue('test-token');

      const result = await apiClient.get('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/test',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token',
          },
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('makes POST request with data', async () => {
      const mockResponse = { success: true };
      const postData = { email: 'test@example.com', password: 'password' };
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });
      mockLocalStorage.getItem.mockReturnValue('test-token');

      const result = await apiClient.post('/auth/login', postData);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/auth/login',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token',
          },
          body: JSON.stringify(postData),
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('makes PUT request with data', async () => {
      const mockResponse = { success: true };
      const putData = { name: 'Updated Name' };
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await apiClient.put('/users/1', putData);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/users/1',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(putData),
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('makes DELETE request', async () => {
      const mockResponse = { success: true };
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await apiClient.delete('/users/1');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/users/1',
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Error handling', () => {
    it('throws error for HTTP error responses', async () => {
      const errorResponse = {
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS',
      };
      
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve(errorResponse),
      });

      await expect(apiClient.get('/test')).rejects.toThrow('Invalid credentials');
    });

    it('throws error with status and code information', async () => {
      const errorResponse = {
        message: 'Not found',
        code: 'NOT_FOUND',
      };
      
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve(errorResponse),
      });

      try {
        await apiClient.get('/test');
      } catch (error: any) {
        expect(error.message).toBe('Not found');
        expect(error.status).toBe(404);
        expect(error.code).toBe('NOT_FOUND');
      }
    });

    it('handles network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(apiClient.get('/test')).rejects.toThrow('Network error');
    });

    it('uses default error message for unknown errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
      });

      await expect(apiClient.get('/test')).rejects.toThrow('HTTP 500');
    });
  });

  describe('Public API calls', () => {
    it('makes public GET request without authentication', async () => {
      const mockResponse = { data: { public: 'data' } };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await apiClient.publicGet('/public/data');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/public/data',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('handles public API errors', async () => {
      const errorResponse = { error: 'Public endpoint error' };
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve(errorResponse),
      });

      await expect(apiClient.publicGet('/public/invalid')).rejects.toThrow('Public endpoint error');
    });
  });

  describe('healthCheck', () => {
    it('returns true for successful health check', async () => {
      mockFetch.mockResolvedValue({ ok: true });

      const result = await healthCheck();

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/healthz');
    });

    it('returns false for failed health check', async () => {
      mockFetch.mockResolvedValue({ ok: false });

      const result = await healthCheck();

      expect(result).toBe(false);
    });

    it('returns false for network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await healthCheck();

      expect(result).toBe(false);
    });
  });
});