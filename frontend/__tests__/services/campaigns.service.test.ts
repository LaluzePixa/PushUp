import { campaignsService } from '@/services/campaigns.service';

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

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('campaignsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCampaigns', () => {
    it('gets campaigns without parameters', async () => {
      const mockResponse = {
        success: true,
        data: {
          campaigns: [
            {
              id: 1,
              title: 'Test Campaign',
              status: 'draft',
              createdAt: '2023-01-01T00:00:00Z',
            },
          ],
          pagination: {
            current: 1,
            limit: 10,
            total: 1,
            pages: 1,
          },
        },
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await campaignsService.getCampaigns();

      expect(mockApiClient.get).toHaveBeenCalledWith('/campaigns');
      expect(result).toEqual(mockResponse);
    });

    it('gets campaigns with all query parameters', async () => {
      const options = {
        page: 2,
        limit: 20,
        status: 'sent',
        search: 'test',
        siteId: 123,
      };

      const mockResponse = {
        success: true,
        data: {
          campaigns: [],
          pagination: {
            current: 2,
            limit: 20,
            total: 0,
            pages: 0,
          },
        },
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await campaignsService.getCampaigns(options);

      expect(mockApiClient.get).toHaveBeenCalledWith('/campaigns?page=2&limit=20&status=sent&search=test&siteId=123');
      expect(result).toEqual(mockResponse);
    });

    it('gets campaigns with partial parameters', async () => {
      const options = {
        page: 1,
        siteId: 456,
      };

      mockApiClient.get.mockResolvedValue({ success: true, data: { campaigns: [], pagination: {} } });

      await campaignsService.getCampaigns(options);

      expect(mockApiClient.get).toHaveBeenCalledWith('/campaigns?page=1&siteId=456');
    });

    it('handles API error', async () => {
      const mockError = new Error('Network error');
      mockApiClient.get.mockRejectedValue(mockError);

      await expect(campaignsService.getCampaigns()).rejects.toThrow('Network error');
    });
  });

  describe('createCampaign', () => {
    it('creates a new campaign', async () => {
      const campaignData = {
        name: 'New Campaign',
        title: 'Campaign Title',
        body: 'Campaign message body',
        targetUrl: 'https://example.com',
        sendType: 'immediate' as const,
        siteId: 1,
      };

      const mockResponse = {
        success: true,
        data: {
          id: 1,
          ...campaignData,
          status: 'draft',
          createdAt: '2023-01-01T00:00:00Z',
        },
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await campaignsService.createCampaign(campaignData);

      expect(mockApiClient.post).toHaveBeenCalledWith('/campaigns', campaignData);
      expect(result).toEqual(mockResponse);
    });

    it('handles creation error', async () => {
      const campaignData = {
        name: 'New Campaign',
        title: 'Campaign Title',
        body: 'Campaign message body',
        targetUrl: 'https://example.com',
        sendType: 'immediate' as const,
        siteId: 1,
      };
      const mockError = new Error('Validation failed');

      mockApiClient.post.mockRejectedValue(mockError);

      await expect(campaignsService.createCampaign(campaignData)).rejects.toThrow('Validation failed');
    });
  });

  describe('getCampaign', () => {
    it('gets campaign by string ID', async () => {
      const campaignId = 'campaign-123';
      const mockResponse = {
        success: true,
        data: {
          id: 'campaign-123',
          title: 'Test Campaign',
          status: 'sent',
        },
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await campaignsService.getCampaign(campaignId);

      expect(mockApiClient.get).toHaveBeenCalledWith('/campaigns/campaign-123');
      expect(result).toEqual(mockResponse);
    });

    it('gets campaign by numeric ID', async () => {
      const campaignId = 456;
      const mockResponse = {
        success: true,
        data: {
          id: 456,
          title: 'Test Campaign',
          status: 'draft',
        },
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await campaignsService.getCampaign(campaignId);

      expect(mockApiClient.get).toHaveBeenCalledWith('/campaigns/456');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updateCampaign', () => {
    it('updates campaign with partial data', async () => {
      const campaignId = 1;
      const updateData = {
        title: 'Updated Campaign Title',
        status: 'scheduled',
      };

      const mockResponse = {
        success: true,
        data: {
          id: 1,
          title: 'Updated Campaign Title',
          status: 'scheduled',
          message: 'Original message',
        },
      };

      mockApiClient.put.mockResolvedValue(mockResponse);

      const result = await campaignsService.updateCampaign(campaignId, updateData);

      expect(mockApiClient.put).toHaveBeenCalledWith('/campaigns/1', updateData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('deleteCampaign', () => {
    it('deletes campaign successfully', async () => {
      const campaignId = 789;
      const mockResponse = {
        success: true,
        message: 'Campaign deleted successfully',
      };

      mockApiClient.delete.mockResolvedValue(mockResponse);

      const result = await campaignsService.deleteCampaign(campaignId);

      expect(mockApiClient.delete).toHaveBeenCalledWith('/campaigns/789');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('pauseCampaign', () => {
    it('pauses campaign successfully', async () => {
      const campaignId = 111;
      const mockResponse = {
        success: true,
        data: {
          id: 111,
          status: 'paused',
        },
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await campaignsService.pauseCampaign(campaignId);

      expect(mockApiClient.post).toHaveBeenCalledWith('/campaigns/111/pause');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('resumeCampaign', () => {
    it('resumes campaign successfully', async () => {
      const campaignId = 222;
      const mockResponse = {
        success: true,
        data: {
          id: 222,
          status: 'scheduled',
        },
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await campaignsService.resumeCampaign(campaignId);

      expect(mockApiClient.post).toHaveBeenCalledWith('/campaigns/222/resume');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('sendCampaign', () => {
    it('sends campaign immediately', async () => {
      const campaignId = 333;
      const mockResponse = {
        success: true,
        data: {
          sent: 150,
          errors: 5,
          total: 155,
        },
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await campaignsService.sendCampaign(campaignId);

      expect(mockApiClient.post).toHaveBeenCalledWith('/campaigns/333/send');
      expect(result).toEqual(mockResponse);
    });

    it('handles send campaign error', async () => {
      const campaignId = 444;
      const mockError = new Error('Campaign send failed');

      mockApiClient.post.mockRejectedValue(mockError);

      await expect(campaignsService.sendCampaign(campaignId)).rejects.toThrow('Campaign send failed');
    });
  });
});