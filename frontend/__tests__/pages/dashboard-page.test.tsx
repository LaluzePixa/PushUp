import React from 'react';
import { render, screen } from '@testing-library/react';
import DashboardPage from '@/app/(main)/dashboard/page';

// Mock the contexts
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/contexts/SiteContext', () => ({
  useSiteContext: jest.fn(),
}));

// Mock the components
jest.mock('@/components/Chart', () => {
  return function MockChart() {
    return <div data-testid="chart-component">Chart Component</div>;
  };
});

jest.mock('@/components/InfoCard', () => {
  return function MockInfoCard({ title, description }: { title: string; description: string }) {
    return (
      <div data-testid="info-card">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    );
  };
});

jest.mock('@/components/MetricCard', () => {
  return function MockMetricCard({ metricName }: { metricName: string }) {
    return <div data-testid="metric-card">{metricName}</div>;
  };
});

jest.mock('@/components/MetricsGrid', () => ({
  MetricsGrid: function MockMetricsGrid({
    metrics,
    className,
    columns,
    color
  }: {
    metrics: string[];
    className?: string;
    columns: number;
    color: { light: string; dark: string };
  }) {
    return (
      <div data-testid="metrics-grid" className={className}>
        <div>Columns: {columns}</div>
        <div>Color: {color.light}</div>
        {metrics.map((metric) => (
          <div key={metric} data-testid={`metric-${metric}`}>
            {metric}
          </div>
        ))}
      </div>
    );
  },
}));

import { useAuth } from '@/contexts/AuthContext';
import { useSiteContext } from '@/contexts/SiteContext';

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseSiteContext = useSiteContext as jest.MockedFunction<typeof useSiteContext>;

describe('Dashboard Page', () => {
  const mockUser = {
    id: 1,
    email: 'test@example.com',
    role: 'user' as const,
    isActive: true,
    createdAt: '2023-01-01T00:00:00Z',
  };

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

    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      refreshUser: jest.fn(),
      isAuthenticated: true,
      isAdmin: false,
      isSuperAdmin: false,
    });

    mockUseSiteContext.mockReturnValue({
      selectedSite: mockSite,
      setSelectedSite: jest.fn(),
      sites: [mockSite],
      loading: false,
      refreshSites: jest.fn(),
      createSite: jest.fn(),
    });
  });

  it('renders loading state when auth is loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      refreshUser: jest.fn(),
      isAuthenticated: false,
      isAdmin: false,
      isSuperAdmin: false,
    });

    const { container } = render(<DashboardPage />);

    expect(screen.getByText('Cargando...')).toBeInTheDocument();

    // Check for the spinner element with animate-spin class
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('border-2', 'border-blue-500', 'border-t-transparent', 'rounded-full');
  });

  it('renders dashboard with selected site', () => {
    render(<DashboardPage />);

    expect(screen.getByTestId('info-card')).toBeInTheDocument();
    expect(screen.getByText('Dashboard - Test Site')).toBeInTheDocument();
    expect(screen.getByText('test.com | test@example.com')).toBeInTheDocument();
  });

  it('renders dashboard without selected site', () => {
    mockUseSiteContext.mockReturnValue({
      selectedSite: null,
      setSelectedSite: jest.fn(),
      sites: [],
      loading: false,
      refreshSites: jest.fn(),
      createSite: jest.fn(),
    });

    render(<DashboardPage />);

    expect(screen.getByText('Dashboard General')).toBeInTheDocument();
    expect(screen.getByText('Todos los sitios | test@example.com')).toBeInTheDocument();
  });

  it('renders all metrics grids', () => {
    render(<DashboardPage />);

    const metricsGrids = screen.getAllByTestId('metrics-grid');
    expect(metricsGrids).toHaveLength(2);

    // First metrics grid (primary metrics)
    expect(screen.getByTestId('metric-active_users')).toBeInTheDocument();
    expect(screen.getByTestId('metric-total_subscriptions')).toBeInTheDocument();
    expect(screen.getByTestId('metric-total_campaigns')).toBeInTheDocument();
    expect(screen.getByTestId('metric-conversion_rate')).toBeInTheDocument();

    // Second metrics grid (secondary metrics)
    expect(screen.getByTestId('metric-total_sites')).toBeInTheDocument();
    expect(screen.getByTestId('metric-active_sites')).toBeInTheDocument();
    expect(screen.getByTestId('metric-recent_campaigns')).toBeInTheDocument();
  });

  it('renders chart component', () => {
    render(<DashboardPage />);

    expect(screen.getByTestId('chart-component')).toBeInTheDocument();
    expect(screen.getByText('Chart Component')).toBeInTheDocument();
  });

  it('renders metric card component', () => {
    render(<DashboardPage />);

    expect(screen.getByTestId('metric-card')).toBeInTheDocument();
    expect(screen.getByText('total_users')).toBeInTheDocument();
  });

  it('configures metrics grids with correct properties', () => {
    render(<DashboardPage />);

    // Check primary metrics grid configuration
    const firstGrid = screen.getAllByTestId('metrics-grid')[0];
    expect(firstGrid).toHaveTextContent('Columns: 4');
    expect(firstGrid).toHaveTextContent('Color: #3b82f6');

    // Check secondary metrics grid configuration
    const secondGrid = screen.getAllByTestId('metrics-grid')[1];
    expect(secondGrid).toHaveTextContent('Columns: 3');
    expect(secondGrid).toHaveTextContent('Color: #10b981');
  });

  it('handles user without email gracefully', () => {
    mockUseAuth.mockReturnValue({
      user: { ...mockUser, email: undefined as any },
      loading: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      refreshUser: jest.fn(),
      isAuthenticated: true,
      isAdmin: false,
      isSuperAdmin: false,
    });

    render(<DashboardPage />);

    expect(screen.getByText('test.com | Usuario')).toBeInTheDocument();
  });

  it('has proper layout structure', () => {
    const { container } = render(<DashboardPage />);

    const mainContainer = container.querySelector('.space-y-8');
    expect(mainContainer).toBeInTheDocument();

    const headerSection = container.querySelector('.flex.justify-between.items-center');
    expect(headerSection).toBeInTheDocument();
  });
});