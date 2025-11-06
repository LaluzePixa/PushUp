import { segmentsService } from '@/services/segments.service';
import type { Segment, SegmentFormData, Subscriber, PaginationData } from '@/types/api';

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

describe('segmentsService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('list', () => {
        it('should call API without parameters', async () => {
            const mockResponse = {
                data: {
                    segments: [
                        { id: 1, name: 'Segment 1', description: 'Test segment 1' },
                        { id: 2, name: 'Segment 2', description: 'Test segment 2' },
                    ],
                    pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
                },
            };

            (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

            const result = await segmentsService.list();

            expect(apiClient.get).toHaveBeenCalledWith('/segments');
            expect(result).toEqual(mockResponse);
        });

        it('should call API with page parameter', async () => {
            const mockResponse = { data: { segments: [], pagination: {} } };
            (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

            await segmentsService.list({ page: 2 });

            expect(apiClient.get).toHaveBeenCalledWith('/segments?page=2');
        });

        it('should call API with limit parameter', async () => {
            const mockResponse = { data: { segments: [], pagination: {} } };
            (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

            await segmentsService.list({ limit: 20 });

            expect(apiClient.get).toHaveBeenCalledWith('/segments?limit=20');
        });

        it('should call API with siteId parameter', async () => {
            const mockResponse = { data: { segments: [], pagination: {} } };
            (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

            await segmentsService.list({ siteId: 123 });

            expect(apiClient.get).toHaveBeenCalledWith('/segments?siteId=123');
        });

        it('should call API with search parameter', async () => {
            const mockResponse = { data: { segments: [], pagination: {} } };
            (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

            await segmentsService.list({ search: 'test' });

            expect(apiClient.get).toHaveBeenCalledWith('/segments?search=test');
        });

        it('should call API with multiple parameters', async () => {
            const mockResponse = { data: { segments: [], pagination: {} } };
            (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

            await segmentsService.list({
                page: 2,
                limit: 20,
                siteId: 123,
                search: 'test',
            });

            expect(apiClient.get).toHaveBeenCalledWith('/segments?page=2&limit=20&siteId=123&search=test');
        });

        it('should handle API errors', async () => {
            const errorMessage = 'Failed to fetch segments';
            (apiClient.get as jest.Mock).mockRejectedValue(new Error(errorMessage));

            await expect(segmentsService.list()).rejects.toThrow(errorMessage);
        });
    });

    describe('getById', () => {
        it('should call API with segment ID', async () => {
            const mockSegment: Segment = {
                id: 1,
                name: 'Test Segment',
                description: 'Test description',
                siteId: 123,
                conditions: {},
                createdAt: '2023-01-01T00:00:00Z',
                updatedAt: '2023-01-02T00:00:00Z',
            };
            const mockResponse = { data: mockSegment };

            (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

            const result = await segmentsService.getById(1);

            expect(apiClient.get).toHaveBeenCalledWith('/segments/1');
            expect(result).toEqual(mockResponse);
        });

        it('should handle segment not found', async () => {
            const errorMessage = 'Segment not found';
            (apiClient.get as jest.Mock).mockRejectedValue(new Error(errorMessage));

            await expect(segmentsService.getById(999)).rejects.toThrow(errorMessage);
        });
    });

    describe('create', () => {
        it('should call API with segment data', async () => {
            const segmentData: SegmentFormData = {
                name: 'New Segment',
                description: 'New segment description',
                siteId: 123,
                conditions: { location: 'US' },
            };
            const mockResponse = {
                data: {
                    id: 1,
                    ...segmentData,
                    createdAt: '2023-01-01T00:00:00Z',
                    updatedAt: '2023-01-01T00:00:00Z',
                },
            };

            (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

            const result = await segmentsService.create(segmentData);

            expect(apiClient.post).toHaveBeenCalledWith('/segments', segmentData);
            expect(result).toEqual(mockResponse);
        });

        it('should handle creation errors', async () => {
            const segmentData: SegmentFormData = {
                name: 'New Segment',
                description: 'New segment description',
                siteId: 123,
                conditions: {},
            };
            const errorMessage = 'Segment name already exists';
            (apiClient.post as jest.Mock).mockRejectedValue(new Error(errorMessage));

            await expect(segmentsService.create(segmentData)).rejects.toThrow(errorMessage);
        });
    });

    describe('update', () => {
        it('should call API with segment ID and update data', async () => {
            const updateData = { name: 'Updated Segment', description: 'Updated description' };
            const mockResponse = {
                data: {
                    id: 1,
                    siteId: 123,
                    ...updateData,
                    createdAt: '2023-01-01T00:00:00Z',
                    updatedAt: '2023-01-02T00:00:00Z',
                },
            };

            (apiClient.put as jest.Mock).mockResolvedValue(mockResponse);

            const result = await segmentsService.update(1, updateData);

            expect(apiClient.put).toHaveBeenCalledWith('/segments/1', updateData);
            expect(result).toEqual(mockResponse);
        });

        it('should handle partial updates', async () => {
            const updateData = { conditions: { location: 'CA' } };
            const mockResponse = {
                data: {
                    id: 1,
                    name: 'Test Segment',
                    description: 'Test description',
                    siteId: 123,
                    ...updateData,
                    createdAt: '2023-01-01T00:00:00Z',
                    updatedAt: '2023-01-02T00:00:00Z',
                },
            };

            (apiClient.put as jest.Mock).mockResolvedValue(mockResponse);

            const result = await segmentsService.update(1, updateData);

            expect(apiClient.put).toHaveBeenCalledWith('/segments/1', updateData);
            expect(result).toEqual(mockResponse);
        });

        it('should handle update errors', async () => {
            const errorMessage = 'Failed to update segment';
            (apiClient.put as jest.Mock).mockRejectedValue(new Error(errorMessage));

            await expect(segmentsService.update(1, { name: 'Updated' })).rejects.toThrow(errorMessage);
        });
    });

    describe('delete', () => {
        it('should call API with segment ID', async () => {
            const mockResponse = { data: undefined };

            (apiClient.delete as jest.Mock).mockResolvedValue(mockResponse);

            const result = await segmentsService.delete(1);

            expect(apiClient.delete).toHaveBeenCalledWith('/segments/1');
            expect(result).toEqual(mockResponse);
        });

        it('should handle delete errors', async () => {
            const errorMessage = 'Failed to delete segment';
            (apiClient.delete as jest.Mock).mockRejectedValue(new Error(errorMessage));

            await expect(segmentsService.delete(1)).rejects.toThrow(errorMessage);
        });

        it('should handle segment not found for deletion', async () => {
            const errorMessage = 'Segment not found';
            (apiClient.delete as jest.Mock).mockRejectedValue(new Error(errorMessage));

            await expect(segmentsService.delete(999)).rejects.toThrow(errorMessage);
        });
    });

    describe('getSubscribers', () => {
        it('should call API with segment ID without parameters', async () => {
            const mockResponse = {
                data: {
                    subscribers: [
                        { id: 1, email: 'user1@example.com', isActive: true },
                        { id: 2, email: 'user2@example.com', isActive: true },
                    ],
                    pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
                },
            };

            (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

            const result = await segmentsService.getSubscribers(1);

            expect(apiClient.get).toHaveBeenCalledWith('/segments/1/subscribers');
            expect(result).toEqual(mockResponse);
        });

        it('should call API with page parameter', async () => {
            const mockResponse = { data: { subscribers: [], pagination: {} } };
            (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

            await segmentsService.getSubscribers(1, { page: 2 });

            expect(apiClient.get).toHaveBeenCalledWith('/segments/1/subscribers?page=2');
        });

        it('should call API with limit parameter', async () => {
            const mockResponse = { data: { subscribers: [], pagination: {} } };
            (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

            await segmentsService.getSubscribers(1, { limit: 20 });

            expect(apiClient.get).toHaveBeenCalledWith('/segments/1/subscribers?limit=20');
        });

        it('should call API with multiple parameters', async () => {
            const mockResponse = { data: { subscribers: [], pagination: {} } };
            (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

            await segmentsService.getSubscribers(1, { page: 2, limit: 20 });

            expect(apiClient.get).toHaveBeenCalledWith('/segments/1/subscribers?page=2&limit=20');
        });

        it('should handle subscribers fetch errors', async () => {
            const errorMessage = 'Failed to fetch subscribers';
            (apiClient.get as jest.Mock).mockRejectedValue(new Error(errorMessage));

            await expect(segmentsService.getSubscribers(1)).rejects.toThrow(errorMessage);
        });
    });

    describe('parameter handling', () => {
        it('should handle empty options object for list', async () => {
            const mockResponse = { data: { segments: [], pagination: {} } };
            (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

            await segmentsService.list({});

            expect(apiClient.get).toHaveBeenCalledWith('/segments');
        });

        it('should handle undefined values in list options', async () => {
            const mockResponse = { data: { segments: [], pagination: {} } };
            (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

            await segmentsService.list({
                page: undefined,
                limit: 10,
                siteId: undefined,
                search: undefined,
            });

            expect(apiClient.get).toHaveBeenCalledWith('/segments?limit=10');
        });

        it('should handle zero values correctly for list', async () => {
            const mockResponse = { data: { segments: [], pagination: {} } };
            (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

            await segmentsService.list({ page: 0, limit: 0, siteId: 0 });

            // Zero should not be included as it's falsy
            expect(apiClient.get).toHaveBeenCalledWith('/segments');
        });

        it('should handle empty options object for getSubscribers', async () => {
            const mockResponse = { data: { subscribers: [], pagination: {} } };
            (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

            await segmentsService.getSubscribers(1, {});

            expect(apiClient.get).toHaveBeenCalledWith('/segments/1/subscribers');
        });

        it('should handle undefined values in getSubscribers options', async () => {
            const mockResponse = { data: { subscribers: [], pagination: {} } };
            (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

            await segmentsService.getSubscribers(1, {
                page: undefined,
                limit: 10,
            });

            expect(apiClient.get).toHaveBeenCalledWith('/segments/1/subscribers?limit=10');
        });
    });
});