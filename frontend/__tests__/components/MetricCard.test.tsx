import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import MetricCard from '@/components/MetricCard';

// Mock the contexts and services
jest.mock('@/contexts/SiteContext', () => ({
  useSiteContext: jest.fn(),
}));

jest.mock('@/services/api', () => ({
  dashboardService: {
    getMetrics: jest.fn(),
  },
}));

import { useSiteContext } from '@/contexts/SiteContext';
import { dashboardService } from '@/services/api';

const mockUseSiteContext = useSiteContext as jest.MockedFunction<typeof useSiteContext>;
const mockDashboardService = dashboardService as jest.Mocked<typeof dashboardService>;

describe('MetricCard', () => {
  const mockSite = {
    id: 1,
    name: 'Test Site',
    domain: 'test.com',
    isActive: true,
    subscribersCount: 100,
    campaignsCount: 5,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseSiteContext.mockReturnValue({
      selectedSite: mockSite,
      setSelectedSite: jest.fn(),
      sites: [mockSite],
      loading: false,
      refreshSites: jest.fn(),
      createSite: jest.fn(),
    });
  });

  it('renders loading state initially', () => {
    mockDashboardService.getMetrics.mockImplementation(() => new Promise(() => { })); // Never resolves

    render(<MetricCard metricName="total_users" />);

    // Check for loading skeleton elements
    const loadingElements = document.querySelectorAll('.animate-pulse');
    expect(loadingElements.length).toBeGreaterThan(0); // Multiple loading elements
  });

  it('renders metric data successfully', async () => {
    const mockMetricData = {
      total_users: {
        title: 'Total Users',
        description: 'Total number of registered users',
        data: 1250,
        hasData: true,
      },
    };

    mockDashboardService.getMetrics.mockResolvedValue({
      success: true,
      data: mockMetricData,
    });

    render(<MetricCard metricName="total_users" />);

    await waitFor(() => {
      expect(screen.getByText('Total Users')).toBeInTheDocument();
      expect(screen.getByText('Total number of registered users')).toBeInTheDocument();
      expect(screen.getByText('1250')).toBeInTheDocument(); // European format without separators for small numbers
      expect(screen.getByText('✓ Data available')).toBeInTheDocument();
    });
  });

  it('renders metric without data', async () => {
    const mockMetricData = {
      empty_metric: {
        title: 'Empty Metric',
        description: 'A metric with no data',
        data: null,
        hasData: false,
      },
    };

    mockDashboardService.getMetrics.mockResolvedValue({
      success: true,
      data: mockMetricData,
    });

    render(<MetricCard metricName="empty_metric" />);

    await waitFor(() => {
      expect(screen.getByText('Empty Metric')).toBeInTheDocument();
      expect(screen.getByText('A metric with no data')).toBeInTheDocument();
      expect(screen.getByText('No data found')).toBeInTheDocument();
      expect(screen.getByText('No data available for this period')).toBeInTheDocument();
    });
  });

  it('renders error when metric not found', async () => {
    const mockMetricData = {
      other_metric: {
        title: 'Other Metric',
        description: 'Another metric',
        data: 100,
        hasData: true,
      },
    };

    mockDashboardService.getMetrics.mockResolvedValue({
      success: true,
      data: mockMetricData,
    });

    render(<MetricCard metricName="nonexistent_metric" />);

    await waitFor(() => {
      expect(screen.getByText('⚠️ Error')).toBeInTheDocument();
      expect(screen.getByText('Métrica "nonexistent_metric" no encontrada')).toBeInTheDocument();
    });
  });

  it('renders error when API call fails', async () => {
    mockDashboardService.getMetrics.mockRejectedValue(new Error('Network error'));

    render(<MetricCard metricName="total_users" />);

    await waitFor(() => {
      expect(screen.getByText('⚠️ Error')).toBeInTheDocument();
      expect(screen.getByText('Error de conexión')).toBeInTheDocument();
    });
  });

  it('renders error when API returns unsuccessful response', async () => {
    mockDashboardService.getMetrics.mockResolvedValue({
      success: false,
      error: {
        code: 'API_ERROR',
        message: 'API Error',
      },
    });

    render(<MetricCard metricName="total_users" />);

    await waitFor(() => {
      expect(screen.getByText('⚠️ Error')).toBeInTheDocument();
      expect(screen.getByText('Error al cargar métricas')).toBeInTheDocument();
    });
  });

  it('formats numeric data with locale string', async () => {
    const mockMetricData = {
      large_number: {
        title: 'Large Number',
        description: 'A large numeric value',
        data: 1234567,
        hasData: true,
      },
    };

    mockDashboardService.getMetrics.mockResolvedValue({
      success: true,
      data: mockMetricData,
    });

    render(<MetricCard metricName="large_number" />);

    await waitFor(() => {
      expect(screen.getByText('1.234.567')).toBeInTheDocument(); // European format
    });
  });

  it('displays string data without formatting', async () => {
    const mockMetricData = {
      text_metric: {
        title: 'Text Metric',
        description: 'A text-based metric',
        data: 'Active',
        hasData: true,
      },
    };

    mockDashboardService.getMetrics.mockResolvedValue({
      success: true,
      data: mockMetricData,
    });

    render(<MetricCard metricName="text_metric" />);

    await waitFor(() => {
      expect(screen.getByText('Active')).toBeInTheDocument();
    });
  });

  it('applies custom className', async () => {
    const mockMetricData = {
      test_metric: {
        title: 'Test Metric',
        description: 'Test description',
        data: 100,
        hasData: true,
      },
    };

    mockDashboardService.getMetrics.mockResolvedValue({
      success: true,
      data: mockMetricData,
    });

    const { container } = render(<MetricCard metricName="test_metric" className="custom-class" />);

    await waitFor(() => {
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  it('refetches data when selectedSite changes', async () => {
    const mockMetricData = {
      test_metric: {
        title: 'Test Metric',
        description: 'Test description',
        data: 100,
        hasData: true,
      },
    };

    mockDashboardService.getMetrics.mockResolvedValue({
      success: true,
      data: mockMetricData,
    });

    const { rerender } = render(<MetricCard metricName="test_metric" />);

    await waitFor(() => {
      expect(mockDashboardService.getMetrics).toHaveBeenCalledWith(1);
    });

    // Change selected site
    const newMockSite = { ...mockSite, id: 2 };
    mockUseSiteContext.mockReturnValue({
      selectedSite: newMockSite,
      setSelectedSite: jest.fn(),
      sites: [newMockSite],
      loading: false,
      refreshSites: jest.fn(),
      createSite: jest.fn(),
    });

    rerender(<MetricCard metricName="test_metric" />);

    await waitFor(() => {
      expect(mockDashboardService.getMetrics).toHaveBeenCalledWith(2);
    });
  });

  it('handles case when no site is selected', async () => {
    mockUseSiteContext.mockReturnValue({
      selectedSite: null,
      setSelectedSite: jest.fn(),
      sites: [],
      loading: false,
      refreshSites: jest.fn(),
      createSite: jest.fn(),
    });

    mockDashboardService.getMetrics.mockResolvedValue({
      success: true,
      data: {},
    });

    render(<MetricCard metricName="test_metric" />);

    await waitFor(() => {
      expect(mockDashboardService.getMetrics).toHaveBeenCalledWith(undefined);
    });
  });
});