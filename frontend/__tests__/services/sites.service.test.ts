import { sitesService } from '@/services/sites.service';
import type { Site, PaginationData } from '@/types/api';

// Mock the API client
jest.mock('@/services/api-client', () => ({
    __esModule: true,
    default: {
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
    },
}));

import apiClient from '@/services/api-client';

describe('sitesService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getSites', () => {
        it('should call API without parameters', async () => {
            const mockResponse = {
                data: {
                    sites: [
                        { id: 1, name: 'Site 1', domain: 'site1.com', isActive: true },
                        { id: 2, name: 'Site 2', domain: 'site2.com', isActive: true },
                    ],
                    pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
                },
            };

            (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

            const result = await sitesService.getSites();

            expect(apiClient.get).toHaveBeenCalledWith('/sites');
            expect(result).toEqual(mockResponse);
        });

        it('should call API with page parameter', async () => {
            const mockResponse = { data: { sites: [], pagination: {} } };
            (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

            await sitesService.getSites({ page: 2 });

            expect(apiClient.get).toHaveBeenCalledWith('/sites?page=2');
        });

        it('should call API with limit parameter', async () => {
            const mockResponse = { data: { sites: [], pagination: {} } };
            (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

            await sitesService.getSites({ limit: 20 });

            expect(apiClient.get).toHaveBeenCalledWith('/sites?limit=20');
        });

        it('should call API with search parameter', async () => {
            const mockResponse = { data: { sites: [], pagination: {} } };
            (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

            await sitesService.getSites({ search: 'example' });

            expect(apiClient.get).toHaveBeenCalledWith('/sites?search=example');
        });

        it('should call API with isActive parameter', async () => {
            const mockResponse = { data: { sites: [], pagination: {} } };
            (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

            await sitesService.getSites({ isActive: false });

            expect(apiClient.get).toHaveBeenCalledWith('/sites?isActive=false');
        });

        it('should call API with multiple parameters', async () => {
            const mockResponse = { data: { sites: [], pagination: {} } };
            (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

            await sitesService.getSites({
                page: 2,
                limit: 20,
                search: 'example',
                isActive: true,
            });

            expect(apiClient.get).toHaveBeenCalledWith('/sites?page=2&limit=20&search=example&isActive=true');
        });

        it('should handle API errors', async () => {
            const errorMessage = 'Failed to fetch sites';
            (apiClient.get as jest.Mock).mockRejectedValue(new Error(errorMessage));

            await expect(sitesService.getSites()).rejects.toThrow(errorMessage);
        });
    });

    describe('createSite', () => {
        it('should call API with site data', async () => {
            const siteData = {
                name: 'New Site',
                domain: 'newsite.com',
                description: 'A new site',
            };
            const mockResponse = {
                data: { id: 1, ...siteData, isActive: true, createdAt: '2023-01-01T00:00:00Z' },
            };

            (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

            const result = await sitesService.createSite(siteData);

            expect(apiClient.post).toHaveBeenCalledWith('/sites', siteData);
            expect(result).toEqual(mockResponse);
        });

        it('should create site without description', async () => {
            const siteData = {
                name: 'New Site',
                domain: 'newsite.com',
            };
            const mockResponse = {
                data: { id: 1, ...siteData, isActive: true, createdAt: '2023-01-01T00:00:00Z' },
            };

            (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

            const result = await sitesService.createSite(siteData);

            expect(apiClient.post).toHaveBeenCalledWith('/sites', siteData);
            expect(result).toEqual(mockResponse);
        });

        it('should handle creation errors', async () => {
            const siteData = {
                name: 'New Site',
                domain: 'newsite.com',
            };
            const errorMessage = 'Domain already exists';
            (apiClient.post as jest.Mock).mockRejectedValue(new Error(errorMessage));

            await expect(sitesService.createSite(siteData)).rejects.toThrow(errorMessage);
        });
    });

    describe('getSite', () => {
        it('should call API with site ID', async () => {
            const mockSite: Site = {
                id: 1,
                name: 'Test Site',
                domain: 'test.com',
                isActive: true,
                createdAt: '2023-01-01T00:00:00Z',
                subscribersCount: 100,
                campaignsCount: 5,
                updatedAt: '2023-01-02T00:00:00Z',
            };
            const mockResponse = { data: mockSite };

            (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

            const result = await sitesService.getSite(1);

            expect(apiClient.get).toHaveBeenCalledWith('/sites/1');
            expect(result).toEqual(mockResponse);
        });

        it('should handle site not found', async () => {
            const errorMessage = 'Site not found';
            (apiClient.get as jest.Mock).mockRejectedValue(new Error(errorMessage));

            await expect(sitesService.getSite(999)).rejects.toThrow(errorMessage);
        });
    });

    describe('updateSite', () => {
        it('should call API with site ID and update data', async () => {
            const updateData = { name: 'Updated Site', description: 'Updated description' };
            const mockResponse = {
                data: {
                    id: 1,
                    domain: 'test.com',
                    ...updateData,
                    isActive: true,
                    createdAt: '2023-01-01T00:00:00Z',
                    subscribersCount: 100,
                    campaignsCount: 5,
                    updatedAt: '2023-01-02T00:00:00Z',
                },
            };

            (apiClient.put as jest.Mock).mockResolvedValue(mockResponse);

            const result = await sitesService.updateSite(1, updateData);

            expect(apiClient.put).toHaveBeenCalledWith('/sites/1', updateData);
            expect(result).toEqual(mockResponse);
        });

        it('should handle partial updates', async () => {
            const updateData = { isActive: false };
            const mockResponse = {
                data: {
                    id: 1,
                    name: 'Test Site',
                    domain: 'test.com',
                    ...updateData,
                    createdAt: '2023-01-01T00:00:00Z',
                    subscribersCount: 100,
                    campaignsCount: 5,
                    updatedAt: '2023-01-02T00:00:00Z',
                },
            };

            (apiClient.put as jest.Mock).mockResolvedValue(mockResponse);

            const result = await sitesService.updateSite(1, updateData);

            expect(apiClient.put).toHaveBeenCalledWith('/sites/1', updateData);
            expect(result).toEqual(mockResponse);
        });

        it('should handle update errors', async () => {
            const errorMessage = 'Failed to update site';
            (apiClient.put as jest.Mock).mockRejectedValue(new Error(errorMessage));

            await expect(sitesService.updateSite(1, { name: 'Updated' })).rejects.toThrow(errorMessage);
        });
    });

    describe('deleteSite', () => {
        it('should call API with site ID', async () => {
            const mockResponse = { data: { message: 'Site deleted successfully' } };

            (apiClient.delete as jest.Mock).mockResolvedValue(mockResponse);

            const result = await sitesService.deleteSite(1);

            expect(apiClient.delete).toHaveBeenCalledWith('/sites/1');
            expect(result).toEqual(mockResponse);
        });

        it('should handle delete errors', async () => {
            const errorMessage = 'Failed to delete site';
            (apiClient.delete as jest.Mock).mockRejectedValue(new Error(errorMessage));

            await expect(sitesService.deleteSite(1)).rejects.toThrow(errorMessage);
        });

        it('should handle site not found for deletion', async () => {
            const errorMessage = 'Site not found';
            (apiClient.delete as jest.Mock).mockRejectedValue(new Error(errorMessage));

            await expect(sitesService.deleteSite(999)).rejects.toThrow(errorMessage);
        });
    });

    describe('parameter handling', () => {
        it('should handle empty parameters object', async () => {
            const mockResponse = { data: { sites: [], pagination: {} } };
            (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

            await sitesService.getSites({});

            expect(apiClient.get).toHaveBeenCalledWith('/sites');
        });

        it('should handle undefined values in parameters', async () => {
            const mockResponse = { data: { sites: [], pagination: {} } };
            (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

            await sitesService.getSites({
                page: undefined,
                limit: 10,
                search: undefined,
                isActive: undefined,
            });

            expect(apiClient.get).toHaveBeenCalledWith('/sites?limit=10');
        });

        it('should handle zero values correctly', async () => {
            const mockResponse = { data: { sites: [], pagination: {} } };
            (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

            await sitesService.getSites({ page: 0, limit: 0 });

            // Zero should not be included as it's falsy
            expect(apiClient.get).toHaveBeenCalledWith('/sites');
        });

        it('should handle boolean false correctly', async () => {
            const mockResponse = { data: { sites: [], pagination: {} } };
            (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

            await sitesService.getSites({ isActive: false });

            expect(apiClient.get).toHaveBeenCalledWith('/sites?isActive=false');
        });

        it('should handle empty string search', async () => {
            const mockResponse = { data: { sites: [], pagination: {} } };
            (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

            await sitesService.getSites({ search: '' });

            // Empty strings are filtered out by URLSearchParams
            expect(apiClient.get).toHaveBeenCalledWith('/sites');
        });
    });

    describe('data validation', () => {
        it('should pass through all site creation fields', async () => {
            const siteData = {
                name: 'Test Site',
                domain: 'test.com',
                description: 'Test description',
            };
            const mockResponse = { data: { id: 1, ...siteData } };

            (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

            await sitesService.createSite(siteData);

            expect(apiClient.post).toHaveBeenCalledWith('/sites', siteData);
        });

        it('should pass through all update fields', async () => {
            const updateData = {
                name: 'Updated Site',
                domain: 'updated.com',
                description: 'Updated description',
                isActive: false,
            };
            const mockResponse = { data: { id: 1, ...updateData } };

            (apiClient.put as jest.Mock).mockResolvedValue(mockResponse);

            await sitesService.updateSite(1, updateData);

            expect(apiClient.put).toHaveBeenCalledWith('/sites/1', updateData);
        });
    });
});