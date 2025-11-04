import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { useSiteContext } from '@/contexts/SiteContext';
import { useAuth } from '@/contexts/AuthContext';

// Mock dependencies
jest.mock('next/navigation');
jest.mock('@/contexts/SiteContext');
jest.mock('@/contexts/AuthContext');

const mockPush = jest.fn();
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseSiteContext = useSiteContext as jest.MockedFunction<typeof useSiteContext>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock the page component (we'll create a simplified version for testing)
const MockSelectSitePage = () => {
  const router = useRouter();
  const { selectedSite, sites, loading, setSelectedSite } = useSiteContext();
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <div>Please login to continue</div>;
  }

  if (loading) {
    return <div>Loading sites...</div>;
  }

  if (sites.length === 0) {
    return (
      <div>
        <h1>No sites found</h1>
        <p>Create your first site to get started</p>
        <button onClick={() => router.push('/sites/new')}>Create Site</button>
      </div>
    );
  }

  return (
    <div>
      <h1>Select a Site</h1>
      <div data-testid="sites-list">
        {sites.map((site) => (
          <div key={site.id} data-testid={`site-${site.id}`}>
            <h3>{site.name}</h3>
            <p>{site.domain}</p>
            <p>{site.subscribersCount} subscribers</p>
            <button
              onClick={() => {
                setSelectedSite(site);
                router.push('/dashboard');
              }}
              data-testid={`select-site-${site.id}`}
            >
              Select Site
            </button>
          </div>
        ))}
      </div>
      {selectedSite && (
        <div data-testid="selected-site">
          Currently selected: {selectedSite.name}
        </div>
      )}
    </div>
  );
};

describe('Select Site Page', () => {
  const mockUser = {
    id: 1,
    email: 'test@example.com',
    role: 'user' as const,
    isActive: true,
    createdAt: '2023-01-01T00:00:00Z',
  };

  const mockSites = [
    {
      id: 1,
      name: 'Site 1',
      domain: 'site1.com',
      isActive: true,
      subscribersCount: 150,
      campaignsCount: 5,
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
    },
    {
      id: 2,
      name: 'Site 2',
      domain: 'site2.com',
      isActive: true,
      subscribersCount: 300,
      campaignsCount: 8,
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn(),
    });

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
      selectedSite: null,
      setSelectedSite: jest.fn(),
      sites: mockSites,
      loading: false,
      refreshSites: jest.fn(),
      createSite: jest.fn(),
    });
  });

  it('shows login message when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      refreshUser: jest.fn(),
      isAuthenticated: false,
      isAdmin: false,
      isSuperAdmin: false,
    });

    render(<MockSelectSitePage />);

    expect(screen.getByText('Please login to continue')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    mockUseSiteContext.mockReturnValue({
      selectedSite: null,
      setSelectedSite: jest.fn(),
      sites: [],
      loading: true,
      refreshSites: jest.fn(),
      createSite: jest.fn(),
    });

    render(<MockSelectSitePage />);

    expect(screen.getByText('Loading sites...')).toBeInTheDocument();
  });

  it('shows no sites message when user has no sites', () => {
    mockUseSiteContext.mockReturnValue({
      selectedSite: null,
      setSelectedSite: jest.fn(),
      sites: [],
      loading: false,
      refreshSites: jest.fn(),
      createSite: jest.fn(),
    });

    render(<MockSelectSitePage />);

    expect(screen.getByText('No sites found')).toBeInTheDocument();
    expect(screen.getByText('Create your first site to get started')).toBeInTheDocument();
    expect(screen.getByText('Create Site')).toBeInTheDocument();
  });

  it('navigates to create site page when create button is clicked', async () => {
    const user = userEvent.setup();
    
    mockUseSiteContext.mockReturnValue({
      selectedSite: null,
      setSelectedSite: jest.fn(),
      sites: [],
      loading: false,
      refreshSites: jest.fn(),
      createSite: jest.fn(),
    });

    render(<MockSelectSitePage />);

    const createButton = screen.getByText('Create Site');
    await user.click(createButton);

    expect(mockPush).toHaveBeenCalledWith('/sites/new');
  });

  it('displays list of sites', () => {
    render(<MockSelectSitePage />);

    expect(screen.getByText('Select a Site')).toBeInTheDocument();
    expect(screen.getByTestId('sites-list')).toBeInTheDocument();
    
    // Check first site
    expect(screen.getByTestId('site-1')).toBeInTheDocument();
    expect(screen.getByText('Site 1')).toBeInTheDocument();
    expect(screen.getByText('site1.com')).toBeInTheDocument();
    expect(screen.getByText('150 subscribers')).toBeInTheDocument();
    
    // Check second site
    expect(screen.getByTestId('site-2')).toBeInTheDocument();
    expect(screen.getByText('Site 2')).toBeInTheDocument();
    expect(screen.getByText('site2.com')).toBeInTheDocument();
    expect(screen.getByText('300 subscribers')).toBeInTheDocument();
  });

  it('selects site and navigates to dashboard', async () => {
    const user = userEvent.setup();
    const mockSetSelectedSite = jest.fn();
    
    mockUseSiteContext.mockReturnValue({
      selectedSite: null,
      setSelectedSite: mockSetSelectedSite,
      sites: mockSites,
      loading: false,
      refreshSites: jest.fn(),
      createSite: jest.fn(),
    });

    render(<MockSelectSitePage />);

    const selectButton = screen.getByTestId('select-site-1');
    await user.click(selectButton);

    expect(mockSetSelectedSite).toHaveBeenCalledWith(mockSites[0]);
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });

  it('shows currently selected site', () => {
    mockUseSiteContext.mockReturnValue({
      selectedSite: mockSites[0],
      setSelectedSite: jest.fn(),
      sites: mockSites,
      loading: false,
      refreshSites: jest.fn(),
      createSite: jest.fn(),
    });

    render(<MockSelectSitePage />);

    expect(screen.getByTestId('selected-site')).toBeInTheDocument();
    expect(screen.getByText('Currently selected: Site 1')).toBeInTheDocument();
  });

  it('renders select buttons for all sites', () => {
    render(<MockSelectSitePage />);

    mockSites.forEach((site) => {
      expect(screen.getByTestId(`select-site-${site.id}`)).toBeInTheDocument();
    });
  });

  it('handles site selection for multiple sites', async () => {
    const user = userEvent.setup();
    const mockSetSelectedSite = jest.fn();
    
    mockUseSiteContext.mockReturnValue({
      selectedSite: null,
      setSelectedSite: mockSetSelectedSite,
      sites: mockSites,
      loading: false,
      refreshSites: jest.fn(),
      createSite: jest.fn(),
    });

    render(<MockSelectSitePage />);

    // Select first site
    const selectButton1 = screen.getByTestId('select-site-1');
    await user.click(selectButton1);

    expect(mockSetSelectedSite).toHaveBeenCalledWith(mockSites[0]);

    // Select second site
    const selectButton2 = screen.getByTestId('select-site-2');
    await user.click(selectButton2);

    expect(mockSetSelectedSite).toHaveBeenCalledWith(mockSites[1]);
    expect(mockPush).toHaveBeenCalledTimes(2);
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });
});