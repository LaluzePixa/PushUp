import { getCSRFToken } from '@/lib/csrf';

// Mock fetch
global.fetch = jest.fn();

describe('csrf library', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset console.error mock
    jest.spyOn(console, 'error').mockImplementation(() => { });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getCSRFToken', () => {
    it('returns CSRF token from successful API response', async () => {
      const mockToken = 'abc123def456';
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ token: mockToken }),
      };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(mockResponse as any);

      const result = await getCSRFToken();

      expect(fetch).toHaveBeenCalledWith('/api/csrf-token', {
        method: 'GET',
        credentials: 'include',
      });
      expect(result).toBe(mockToken);
    });

    it('returns null when API request fails', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
      };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(mockResponse as any);

      const result = await getCSRFToken();

      expect(fetch).toHaveBeenCalledWith('/api/csrf-token', {
        method: 'GET',
        credentials: 'include',
      });
      expect(result).toBeNull();
    });

    it('handles network errors gracefully', async () => {
      const networkError = new Error('Network error');
      (fetch as jest.MockedFunction<typeof fetch>).mockRejectedValue(networkError);

      const result = await getCSRFToken();

      expect(console.error).toHaveBeenCalledWith('Failed to get CSRF token:', networkError);
      expect(result).toBeNull();
    });

    it('handles JSON parsing errors', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
      };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(mockResponse as any);

      const result = await getCSRFToken();

      expect(result).toBeNull();
    });

    it('uses correct request configuration', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
      };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(mockResponse as any);

      await getCSRFToken();

      expect(fetch).toHaveBeenCalledWith('/api/csrf-token', {
        method: 'GET',
        credentials: 'include',
      });
    });

    it('handles empty response body', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({}),
      };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(mockResponse as any);

      const result = await getCSRFToken();

      expect(result).toBeUndefined();
    });

    it('handles null token response', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ token: null }),
      };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(mockResponse as any);

      const result = await getCSRFToken();

      expect(result).toBeNull();
    });

    it('handles missing token field in response', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ message: 'Success' }),
      };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(mockResponse as any);

      const result = await getCSRFToken();

      expect(result).toBeUndefined();
    });

    it('handles different HTTP error status codes', async () => {
      const testCases = [400, 401, 403, 404, 500, 503];

      for (const status of testCases) {
        const mockResponse = {
          ok: false,
          status,
        };

        (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(mockResponse as any);

        const result = await getCSRFToken();

        expect(result).toBeNull();
      }
    });

    it('includes credentials in request', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ token: 'test-token' }),
      };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(mockResponse as any);

      await getCSRFToken();

      const [url, options] = (fetch as jest.MockedFunction<typeof fetch>).mock.calls[0];
      expect(url).toBe('/api/csrf-token');
      expect(options).toEqual({
        method: 'GET',
        credentials: 'include',
      });
    });
  });
});