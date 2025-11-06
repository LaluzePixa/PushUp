import { dashboardService } from '@/services/dashboard.service';
import apiClient from '@/services/api-client';

// Mock the API client
jest.mock('@/services/api-client', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('dashboardService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMetrics', () => {
    it('fetches metrics without siteId', async () => {
      const mockMetrics = {
        totalSubscribers: 1000,
        activeCampaigns: 50,
        clickRate: 0.25,
        conversionRate: 0.12
      };

      mockApiClient.get.mockResolvedValue({ data: mockMetrics });

      const result = await dashboardService.getMetrics();

      expect(mockApiClient.get).toHaveBeenCalledWith('/dashboard/metrics');
      expect(result).toEqual({ data: mockMetrics });
    });

    it('fetches metrics with siteId', async () => {
      const mockMetrics = {
        totalSubscribers: 500,
        activeCampaigns: 25,
        clickRate: 0.30,
        conversionRate: 0.15
      };

      mockApiClient.get.mockResolvedValue({ data: mockMetrics });

      const result = await dashboardService.getMetrics(123);

      expect(mockApiClient.get).toHaveBeenCalledWith('/dashboard/metrics?siteId=123');
      expect(result).toEqual({ data: mockMetrics });
    });

    it('handles API errors for metrics', async () => {
      const error = new Error('Failed to fetch metrics');
      mockApiClient.get.mockRejectedValue(error);

      await expect(dashboardService.getMetrics()).rejects.toThrow(error);
    });
  });

  describe('getAnalytics', () => {
    it('fetches analytics with default period (30 days)', async () => {
      const mockAnalytics = [
        { date: '2023-01-01', subscribers: 100, clicks: 50 },
        { date: '2023-01-02', subscribers: 120, clicks: 60 }
      ];

      mockApiClient.get.mockResolvedValue({ data: mockAnalytics });

      const result = await dashboardService.getAnalytics();

      expect(mockApiClient.get).toHaveBeenCalledWith('/dashboard/analytics?period=30');
      expect(result).toEqual({ data: mockAnalytics });
    });

    it('fetches analytics with custom period', async () => {
      const mockAnalytics = [
        { date: '2023-01-01', subscribers: 100, clicks: 50 }
      ];

      mockApiClient.get.mockResolvedValue({ data: mockAnalytics });

      const result = await dashboardService.getAnalytics(7);

      expect(mockApiClient.get).toHaveBeenCalledWith('/dashboard/analytics?period=7');
      expect(result).toEqual({ data: mockAnalytics });
    });

    it('fetches analytics with period and siteId', async () => {
      const mockAnalytics = [
        { date: '2023-01-01', subscribers: 50, clicks: 25 }
      ];

      mockApiClient.get.mockResolvedValue({ data: mockAnalytics });

      const result = await dashboardService.getAnalytics(14, 456);

      expect(mockApiClient.get).toHaveBeenCalledWith('/dashboard/analytics?period=14&siteId=456');
      expect(result).toEqual({ data: mockAnalytics });
    });

    it('handles API errors for analytics', async () => {
      const error = new Error('Failed to fetch analytics');
      mockApiClient.get.mockRejectedValue(error);

      await expect(dashboardService.getAnalytics()).rejects.toThrow(error);
    });
  });

  describe('getSubscriptions', () => {
    it('fetches subscriptions with default parameters', async () => {
      const mockSubscriptions = [
        { id: 1, email: 'user1@example.com', subscribedAt: '2023-01-01' },
        { id: 2, email: 'user2@example.com', subscribedAt: '2023-01-02' }
      ];

      mockApiClient.get.mockResolvedValue({ data: mockSubscriptions });

      const result = await dashboardService.getSubscriptions();

      expect(mockApiClient.get).toHaveBeenCalledWith('/dashboard/subscriptions?limit=10&page=1');
      expect(result).toEqual({ data: mockSubscriptions });
    });

    it('fetches subscriptions with custom limit and page', async () => {
      const mockSubscriptions = [
        { id: 1, email: 'user1@example.com', subscribedAt: '2023-01-01' }
      ];

      mockApiClient.get.mockResolvedValue({ data: mockSubscriptions });

      const result = await dashboardService.getSubscriptions(5, 2);

      expect(mockApiClient.get).toHaveBeenCalledWith('/dashboard/subscriptions?limit=5&page=2');
      expect(result).toEqual({ data: mockSubscriptions });
    });

    it('fetches subscriptions with siteId', async () => {
      const mockSubscriptions = [
        { id: 1, email: 'user1@example.com', subscribedAt: '2023-01-01', siteId: 789 }
      ];

      mockApiClient.get.mockResolvedValue({ data: mockSubscriptions });

      const result = await dashboardService.getSubscriptions(10, 1, 789);

      expect(mockApiClient.get).toHaveBeenCalledWith('/dashboard/subscriptions?limit=10&page=1&siteId=789');
      expect(result).toEqual({ data: mockSubscriptions });
    });

    it('handles API errors for subscriptions', async () => {
      const error = new Error('Failed to fetch subscriptions');
      mockApiClient.get.mockRejectedValue(error);

      await expect(dashboardService.getSubscriptions()).rejects.toThrow(error);
    });
  });

  describe('getSegments', () => {
    it('fetches user segments', async () => {
      const mockSegments = [
        { id: 1, name: 'Active Users', count: 500 },
        { id: 2, name: 'Inactive Users', count: 200 }
      ];

      mockApiClient.get.mockResolvedValue({ data: mockSegments });

      const result = await dashboardService.getSegments();

      expect(mockApiClient.get).toHaveBeenCalledWith('/dashboard/segments');
      expect(result).toEqual({ data: mockSegments });
    });

    it('handles API errors for segments', async () => {
      const error = new Error('Failed to fetch segments');
      mockApiClient.get.mockRejectedValue(error);

      await expect(dashboardService.getSegments()).rejects.toThrow(error);
    });
  });

  describe('getRecentCampaigns', () => {
    it('fetches recent campaigns with default limit', async () => {
      const mockCampaigns = [
        { id: 1, name: 'Campaign 1', sentAt: '2023-01-01', recipients: 100 },
        { id: 2, name: 'Campaign 2', sentAt: '2023-01-02', recipients: 150 }
      ];

      mockApiClient.get.mockResolvedValue({ data: mockCampaigns });

      const result = await dashboardService.getRecentCampaigns();

      expect(mockApiClient.get).toHaveBeenCalledWith('/dashboard/recent-campaigns?limit=5');
      expect(result).toEqual({ data: mockCampaigns });
    });

    it('fetches recent campaigns with custom limit', async () => {
      const mockCampaigns = [
        { id: 1, name: 'Campaign 1', sentAt: '2023-01-01', recipients: 100 }
      ];

      mockApiClient.get.mockResolvedValue({ data: mockCampaigns });

      const result = await dashboardService.getRecentCampaigns(3);

      expect(mockApiClient.get).toHaveBeenCalledWith('/dashboard/recent-campaigns?limit=3');
      expect(result).toEqual({ data: mockCampaigns });
    });

    it('fetches recent campaigns with siteId', async () => {
      const mockCampaigns = [
        { id: 1, name: 'Campaign 1', sentAt: '2023-01-01', recipients: 100, siteId: 111 }
      ];

      mockApiClient.get.mockResolvedValue({ data: mockCampaigns });

      const result = await dashboardService.getRecentCampaigns(5, 111);

      expect(mockApiClient.get).toHaveBeenCalledWith('/dashboard/recent-campaigns?limit=5&siteId=111');
      expect(result).toEqual({ data: mockCampaigns });
    });

    it('handles API errors for recent campaigns', async () => {
      const error = new Error('Failed to fetch recent campaigns');
      mockApiClient.get.mockRejectedValue(error);

      await expect(dashboardService.getRecentCampaigns()).rejects.toThrow(error);
    });
  });

  describe('getJourneys', () => {
    it('fetches journeys without options', async () => {
      const mockResponse = {
        journeys: [
          { id: 1, name: 'Journey 1', status: 'active' },
          { id: 2, name: 'Journey 2', status: 'draft' }
        ],
        pagination: { current: 1, limit: 10, total: 2, pages: 1 }
      };

      mockApiClient.get.mockResolvedValue({ data: mockResponse });

      const result = await dashboardService.getJourneys();

      expect(mockApiClient.get).toHaveBeenCalledWith('/dashboard/journeys');
      expect(result).toEqual({ data: mockResponse });
    });

    it('fetches journeys with pagination', async () => {
      const mockResponse = {
        journeys: [
          { id: 3, name: 'Journey 3', status: 'active' }
        ],
        pagination: { current: 2, limit: 5, total: 10, pages: 2 }
      };

      mockApiClient.get.mockResolvedValue({ data: mockResponse });

      const result = await dashboardService.getJourneys({ page: 2, limit: 5 });

      expect(mockApiClient.get).toHaveBeenCalledWith('/dashboard/journeys?page=2&limit=5');
      expect(result).toEqual({ data: mockResponse });
    });

    it('fetches journeys with status filter', async () => {
      const mockResponse = {
        journeys: [
          { id: 1, name: 'Journey 1', status: 'active' }
        ],
        pagination: { current: 1, limit: 10, total: 1, pages: 1 }
      };

      mockApiClient.get.mockResolvedValue({ data: mockResponse });

      const result = await dashboardService.getJourneys({ status: 'active' });

      expect(mockApiClient.get).toHaveBeenCalledWith('/dashboard/journeys?status=active');
      expect(result).toEqual({ data: mockResponse });
    });

    it('fetches journeys with search', async () => {
      const mockResponse = {
        journeys: [
          { id: 1, name: 'Onboarding Journey', status: 'active' }
        ],
        pagination: { current: 1, limit: 10, total: 1, pages: 1 }
      };

      mockApiClient.get.mockResolvedValue({ data: mockResponse });

      const result = await dashboardService.getJourneys({ search: 'Onboarding' });

      expect(mockApiClient.get).toHaveBeenCalledWith('/dashboard/journeys?search=Onboarding');
      expect(result).toEqual({ data: mockResponse });
    });

    it('fetches journeys with all options', async () => {
      const mockResponse = {
        journeys: [],
        pagination: { current: 1, limit: 20, total: 0, pages: 0 }
      };

      mockApiClient.get.mockResolvedValue({ data: mockResponse });

      const result = await dashboardService.getJourneys({
        page: 1,
        limit: 20,
        status: 'draft',
        search: 'test'
      });

      expect(mockApiClient.get).toHaveBeenCalledWith('/dashboard/journeys?page=1&limit=20&status=draft&search=test');
      expect(result).toEqual({ data: mockResponse });
    });

    it('handles API errors for journeys', async () => {
      const error = new Error('Failed to fetch journeys');
      mockApiClient.get.mockRejectedValue(error);

      await expect(dashboardService.getJourneys()).rejects.toThrow(error);
    });
  });

  describe('getMonitoringLocations', () => {
    it('fetches monitoring locations', async () => {
      const mockLocations = {
        locations: [
          { id: 1, name: 'US East', enabled: true },
          { id: 2, name: 'EU West', enabled: true }
        ],
        total: 2,
        enabled: 2
      };

      mockApiClient.get.mockResolvedValue({ data: mockLocations });

      const result = await dashboardService.getMonitoringLocations();

      expect(mockApiClient.get).toHaveBeenCalledWith('/dashboard/monitoring-locations');
      expect(result).toEqual({ data: mockLocations });
    });

    it('handles API errors for monitoring locations', async () => {
      const error = new Error('Failed to fetch monitoring locations');
      mockApiClient.get.mockRejectedValue(error);

      await expect(dashboardService.getMonitoringLocations()).rejects.toThrow(error);
    });
  });
});