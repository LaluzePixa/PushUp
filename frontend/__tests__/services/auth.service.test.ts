import { authService } from '@/services/auth.service';

// Mock the API client
jest.mock('@/services/api-client', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
  tokenUtils: {
    get: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
  },
}));

import apiClient, { tokenUtils } from '@/services/api-client';

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;
const mockTokenUtils = tokenUtils as jest.Mocked<typeof tokenUtils>;

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('successfully logs in user and sets token', async () => {
      const mockCredentials = {
        email: 'test@example.com',
        password: 'password123',
      };
      const mockResponse = {
        token: 'mock-jwt-token',
        user: {
          id: 1,
          email: 'test@example.com',
          role: 'user' as const,
          isActive: true,
          createdAt: '2023-01-01T00:00:00Z'
        },
        success: true,
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await authService.login(mockCredentials);

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/login', mockCredentials);
      expect(mockTokenUtils.set).toHaveBeenCalledWith('mock-jwt-token');
      expect(result).toEqual(mockResponse);
    });

    it('handles login without token', async () => {
      const mockCredentials = {
        email: 'test@example.com',
        password: 'password123',
      };
      const mockResponse = {
        success: false,
        message: 'Invalid credentials',
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await authService.login(mockCredentials);

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/login', mockCredentials);
      expect(mockTokenUtils.set).not.toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('throws error when login fails', async () => {
      const mockCredentials = {
        email: 'test@example.com',
        password: 'password123',
      };
      const mockError = new Error('Network error');

      mockApiClient.post.mockRejectedValue(mockError);

      await expect(authService.login(mockCredentials)).rejects.toThrow('Network error');
      expect(mockTokenUtils.set).not.toHaveBeenCalled();
    });
  });

  describe('register', () => {
    it('successfully registers user and sets token', async () => {
      const mockUserData = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
      };
      const mockResponse = {
        token: 'mock-jwt-token',
        user: {
          id: 2,
          email: 'newuser@example.com',
          name: 'New User',
          role: 'user' as const,
          isActive: true,
          createdAt: '2023-01-01T00:00:00Z'
        },
        success: true,
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await authService.register(mockUserData);

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/register', mockUserData);
      expect(mockTokenUtils.set).toHaveBeenCalledWith('mock-jwt-token');
      expect(result).toEqual(mockResponse);
    });

    it('handles registration without token', async () => {
      const mockUserData = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
      };
      const mockResponse = {
        success: false,
        message: 'Email already exists',
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await authService.register(mockUserData);

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/register', mockUserData);
      expect(mockTokenUtils.set).not.toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('throws error when registration fails', async () => {
      const mockUserData = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
      };
      const mockError = new Error('Server error');

      mockApiClient.post.mockRejectedValue(mockError);

      await expect(authService.register(mockUserData)).rejects.toThrow('Server error');
      expect(mockTokenUtils.set).not.toHaveBeenCalled();
    });
  });

  describe('getCurrentUser', () => {
    it('successfully gets current user', async () => {
      const mockResponse = {
        data: { id: 1, email: 'test@example.com', name: 'Test User' },
        success: true,
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await authService.getCurrentUser();

      expect(mockApiClient.get).toHaveBeenCalledWith('/auth/me');
      expect(result).toEqual(mockResponse);
    });

    it('throws error when getting current user fails', async () => {
      const mockError = new Error('Unauthorized');

      mockApiClient.get.mockRejectedValue(mockError);

      await expect(authService.getCurrentUser()).rejects.toThrow('Unauthorized');
    });
  });

  describe('changePassword', () => {
    it('successfully changes password', async () => {
      const currentPassword = 'oldpassword';
      const newPassword = 'newpassword';
      const mockResponse = {
        success: true,
        message: 'Password changed successfully',
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await authService.changePassword(currentPassword, newPassword);

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      expect(result).toEqual(mockResponse);
    });

    it('handles password change failure', async () => {
      const currentPassword = 'wrongpassword';
      const newPassword = 'newpassword';
      const mockResponse = {
        success: false,
        message: 'Current password is incorrect',
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await authService.changePassword(currentPassword, newPassword);

      expect(result).toEqual(mockResponse);
    });

    it('throws error when password change request fails', async () => {
      const currentPassword = 'oldpassword';
      const newPassword = 'newpassword';
      const mockError = new Error('Server error');

      mockApiClient.post.mockRejectedValue(mockError);

      await expect(authService.changePassword(currentPassword, newPassword)).rejects.toThrow('Server error');
    });
  });

  describe('logout', () => {
    it('removes token on logout', () => {
      authService.logout();

      expect(mockTokenUtils.remove).toHaveBeenCalledTimes(1);
      expect(mockTokenUtils.remove).toHaveBeenCalledWith();
    });
  });
});