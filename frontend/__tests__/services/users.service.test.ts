import { usersService } from '@/services/users.service';
import apiClient from '@/services/api-client';

// Mock the API client
jest.mock('@/services/api-client', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('usersService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUsers', () => {
    it('fetches users without parameters', async () => {
      const mockResponse = {
        users: [
          { id: 1, email: 'user1@example.com', role: 'user' as const, isActive: true, createdAt: '2023-01-01' },
          { id: 2, email: 'user2@example.com', role: 'user' as const, isActive: true, createdAt: '2023-01-02' },
        ],
        pagination: { current: 1, total: 2, pages: 1, limit: 10 }
      };

      mockApiClient.get.mockResolvedValue({ data: mockResponse });

      const result = await usersService.getUsers();

      expect(mockApiClient.get).toHaveBeenCalledWith('/users');
      expect(result).toEqual({ data: mockResponse });
    });

    it('fetches users with role parameter', async () => {
      const mockResponse = {
        users: [
          { id: 1, email: 'admin@example.com', role: 'admin' as const, isActive: true, createdAt: '2023-01-01' },
        ],
        pagination: { current: 1, total: 1, pages: 1, limit: 10 }
      };

      mockApiClient.get.mockResolvedValue({ data: mockResponse });

      const result = await usersService.getUsers({ role: 'admin' });

      expect(mockApiClient.get).toHaveBeenCalledWith('/users?role=admin');
      expect(result).toEqual({ data: mockResponse });
    });

    it('fetches users with search parameter', async () => {
      const mockResponse = {
        users: [
          { id: 1, email: 'john@example.com', role: 'user' as const, isActive: true, createdAt: '2023-01-01' },
        ],
        pagination: { current: 1, total: 1, pages: 1, limit: 10 }
      };

      mockApiClient.get.mockResolvedValue({ data: mockResponse });

      const result = await usersService.getUsers({ search: 'john' });

      expect(mockApiClient.get).toHaveBeenCalledWith('/users?search=john');
      expect(result).toEqual({ data: mockResponse });
    });

    it('fetches users with page parameter', async () => {
      const mockResponse = {
        users: [
          { id: 11, email: 'user11@example.com', role: 'user' as const, isActive: true, createdAt: '2023-01-11' },
        ],
        pagination: { current: 2, total: 15, pages: 2, limit: 10 }
      };

      mockApiClient.get.mockResolvedValue({ data: mockResponse });

      const result = await usersService.getUsers({ page: 2 });

      expect(mockApiClient.get).toHaveBeenCalledWith('/users?page=2');
      expect(result).toEqual({ data: mockResponse });
    });

    it('fetches users with limit parameter', async () => {
      const mockResponse = {
        users: [
          { id: 1, email: 'user1@example.com', role: 'user' as const, isActive: true, createdAt: '2023-01-01' },
          { id: 2, email: 'user2@example.com', role: 'user' as const, isActive: true, createdAt: '2023-01-02' },
        ],
        pagination: { current: 1, total: 2, pages: 1, limit: 10 }
      };

      mockApiClient.get.mockResolvedValue({ data: mockResponse });

      const result = await usersService.getUsers({ limit: 10 });

      expect(mockApiClient.get).toHaveBeenCalledWith('/users?limit=10');
      expect(result).toEqual({ data: mockResponse });
    });

    it('fetches users with isActive parameter', async () => {
      const mockResponse = {
        users: [
          { id: 1, email: 'active@example.com', role: 'user' as const, isActive: true, createdAt: '2023-01-01' },
        ],
        pagination: { current: 1, total: 1, pages: 1, limit: 10 }
      };

      mockApiClient.get.mockResolvedValue({ data: mockResponse });

      const result = await usersService.getUsers({ isActive: true });

      expect(mockApiClient.get).toHaveBeenCalledWith('/users?isActive=true');
      expect(result).toEqual({ data: mockResponse });
    });

    it('fetches users with multiple parameters', async () => {
      const mockResponse = {
        users: [
          { id: 1, email: 'admin@example.com', role: 'admin' as const, isActive: true, createdAt: '2023-01-01' },
        ],
        pagination: { current: 1, total: 1, pages: 1, limit: 5 }
      };

      mockApiClient.get.mockResolvedValue({ data: mockResponse });

      const result = await usersService.getUsers({
        role: 'admin',
        search: 'admin',
        page: 1,
        limit: 5,
        isActive: true
      });

      expect(mockApiClient.get).toHaveBeenCalledWith('/users?page=1&limit=5&role=admin&search=admin&isActive=true');
      expect(result).toEqual({ data: mockResponse });
    });

    it('handles undefined parameters correctly', async () => {
      const mockResponse = {
        users: [],
        pagination: { current: 1, total: 0, pages: 0, limit: 20 }
      };

      mockApiClient.get.mockResolvedValue({ data: mockResponse });

      const result = await usersService.getUsers({
        role: undefined,
        search: 'test',
        page: undefined,
        limit: 20,
      });

      expect(mockApiClient.get).toHaveBeenCalledWith('/users?limit=20&search=test');
      expect(result).toEqual({ data: mockResponse });
    });

    it('handles API errors', async () => {
      const error = new Error('Failed to fetch users');
      mockApiClient.get.mockRejectedValue(error);

      await expect(usersService.getUsers()).rejects.toThrow(error);
      expect(mockApiClient.get).toHaveBeenCalledWith('/users');
    });

    it('constructs URL without query parameters when options is empty', async () => {
      const mockResponse = {
        users: [],
        pagination: { current: 1, total: 0, pages: 0, limit: 10 }
      };
      mockApiClient.get.mockResolvedValue({ data: mockResponse });

      await usersService.getUsers({});

      expect(mockApiClient.get).toHaveBeenCalledWith('/users');
    });
  });

  describe('getUser', () => {
    it('fetches a specific user by id', async () => {
      const mockUser = {
        id: 1,
        email: 'user@example.com',
        role: 'user' as const,
        isActive: true,
        createdAt: '2023-01-01'
      };

      mockApiClient.get.mockResolvedValue({ data: mockUser });

      const result = await usersService.getUser(1);

      expect(mockApiClient.get).toHaveBeenCalledWith('/users/1');
      expect(result).toEqual({ data: mockUser });
    });

    it('handles API errors when fetching user', async () => {
      const error = new Error('User not found');
      mockApiClient.get.mockRejectedValue(error);

      await expect(usersService.getUser(999)).rejects.toThrow(error);
      expect(mockApiClient.get).toHaveBeenCalledWith('/users/999');
    });
  });

  describe('updateUser', () => {
    it('updates a user with new data', async () => {
      const updateData = {
        email: 'updated@example.com',
        isActive: false
      };

      const mockUpdatedUser = {
        id: 1,
        email: 'updated@example.com',
        role: 'user' as const,
        isActive: false,
        createdAt: '2023-01-01',
        updatedAt: '2023-06-01'
      };

      mockApiClient.put.mockResolvedValue({ data: mockUpdatedUser });

      const result = await usersService.updateUser(1, updateData);

      expect(mockApiClient.put).toHaveBeenCalledWith('/users/1', updateData);
      expect(result).toEqual({ data: mockUpdatedUser });
    });

    it('updates user role', async () => {
      const updateData = { role: 'admin' as const };

      const mockUpdatedUser = {
        id: 1,
        email: 'user@example.com',
        role: 'admin' as const,
        isActive: true,
        createdAt: '2023-01-01',
        updatedAt: '2023-06-01'
      };

      mockApiClient.put.mockResolvedValue({ data: mockUpdatedUser });

      const result = await usersService.updateUser(1, updateData);

      expect(mockApiClient.put).toHaveBeenCalledWith('/users/1', updateData);
      expect(result).toEqual({ data: mockUpdatedUser });
    });

    it('handles API errors when updating user', async () => {
      const error = new Error('Failed to update user');
      mockApiClient.put.mockRejectedValue(error);

      await expect(usersService.updateUser(1, { email: 'test@example.com' })).rejects.toThrow(error);
      expect(mockApiClient.put).toHaveBeenCalledWith('/users/1', { email: 'test@example.com' });
    });
  });

  describe('deleteUser', () => {
    it('deletes a user by id', async () => {
      const mockResponse = { success: true };

      mockApiClient.delete.mockResolvedValue({ data: mockResponse });

      const result = await usersService.deleteUser(1);

      expect(mockApiClient.delete).toHaveBeenCalledWith('/users/1');
      expect(result).toEqual({ data: mockResponse });
    });

    it('handles API errors when deleting user', async () => {
      const error = new Error('Failed to delete user');
      mockApiClient.delete.mockRejectedValue(error);

      await expect(usersService.deleteUser(999)).rejects.toThrow(error);
      expect(mockApiClient.delete).toHaveBeenCalledWith('/users/999');
    });
  });
});