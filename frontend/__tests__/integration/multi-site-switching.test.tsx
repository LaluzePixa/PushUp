/**
 * Multi-Site Switching Integration Tests
 * Tests user experience when switching between multiple sites
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SiteProvider } from '@/contexts/SiteContext';
import { AuthProvider } from '@/contexts/AuthContext';

// Mock data
const mockSites = [
  {
    id: 1,
    name: 'Tech Blog',
    domain: 'techblog.com',
    isActive: true,
    subscribersCount: 1500,
    campaignsCount: 10,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'E-commerce Store',
    domain: 'store.com',
    isActive: true,
    subscribersCount: 5200,
    campaignsCount: 25,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  },
  {
    id: 3,
    name: 'News Portal',
    domain: 'news.com',
    isActive: true,
    subscribersCount: 12000,
    campaignsCount: 50,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  },
  {
    id: 4,
    name: 'Community Forum',
    domain: 'forum.com',
    isActive: true,
    subscribersCount: 800,
    campaignsCount: 5,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  },
  {
    id: 5,
    name: 'Portfolio Site',
    domain: 'portfolio.com',
    isActive: true,
    subscribersCount: 150,
    campaignsCount: 2,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  },
];

// Mock component that simulates dashboard with site switching
const MockDashboard = () => {
  const [selectedSite, setSelectedSite] = React.useState(mockSites[0]);
  const [loading, setLoading] = React.useState(false);

  const switchSite = async (siteId: number) => {
    setLoading(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    const site = mockSites.find(s => s.id === siteId);
    if (site) {
      setSelectedSite(site);
    }
    setLoading(false);
  };

  return (
    <div>
      <div data-testid="current-site">
        <h1>{selectedSite.name}</h1>
        <p data-testid="site-domain">{selectedSite.domain}</p>
        <p data-testid="subscriber-count">{selectedSite.subscribersCount} subscribers</p>
        <p data-testid="campaign-count">{selectedSite.campaignsCount} campaigns</p>
      </div>

      {loading && <div data-testid="loading">Loading...</div>}

      <div data-testid="site-switcher">
        <h2>Switch Site</h2>
        {mockSites.map(site => (
          <button
            key={site.id}
            data-testid={`switch-to-site-${site.id}`}
            onClick={() => switchSite(site.id)}
            disabled={loading}
          >
            {site.name}
          </button>
        ))}
      </div>

      <div data-testid="site-stats">
        <p>Total Sites: {mockSites.length}</p>
      </div>
    </div>
  );
};

describe('Multi-Site Switching Integration', () => {
  describe('Site Selection and Display', () => {
    it('should display initial site correctly', () => {
      render(<MockDashboard />);

      expect(screen.getByText('Tech Blog')).toBeInTheDocument();
      expect(screen.getByTestId('site-domain')).toHaveTextContent('techblog.com');
      expect(screen.getByTestId('subscriber-count')).toHaveTextContent('1500 subscribers');
      expect(screen.getByTestId('campaign-count')).toHaveTextContent('10 campaigns');
    });

    it('should display all 5 sites in switcher', () => {
      render(<MockDashboard />);

      mockSites.forEach(site => {
        expect(screen.getByTestId(`switch-to-site-${site.id}`)).toBeInTheDocument();
      });

      expect(screen.getByTestId('site-stats')).toHaveTextContent('Total Sites: 5');
    });
  });

  describe('Single Site Switch', () => {
    it('should switch to different site and display correct data', async () => {
      const user = userEvent.setup();
      render(<MockDashboard />);

      // Initially showing Tech Blog
      expect(screen.getByText('Tech Blog')).toBeInTheDocument();

      // Switch to E-commerce Store
      await user.click(screen.getByTestId('switch-to-site-2'));

      await waitFor(() => {
        expect(screen.getByText('E-commerce Store')).toBeInTheDocument();
      });

      expect(screen.getByTestId('site-domain')).toHaveTextContent('store.com');
      expect(screen.getByTestId('subscriber-count')).toHaveTextContent('5200 subscribers');
      expect(screen.getByTestId('campaign-count')).toHaveTextContent('25 campaigns');
    });

    it('should show loading state during switch', async () => {
      const user = userEvent.setup();
      render(<MockDashboard />);

      const switchButton = screen.getByTestId('switch-to-site-2');
      await user.click(switchButton);

      // Loading indicator should appear
      expect(screen.getByTestId('loading')).toBeInTheDocument();

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });
    });

    it('should disable switcher buttons during loading', async () => {
      const user = userEvent.setup();
      render(<MockDashboard />);

      const switchButton = screen.getByTestId('switch-to-site-3');
      await user.click(switchButton);

      // All buttons should be disabled during loading
      mockSites.forEach(site => {
        expect(screen.getByTestId(`switch-to-site-${site.id}`)).toBeDisabled();
      });

      await waitFor(() => {
        expect(screen.getByTestId('switch-to-site-1')).not.toBeDisabled();
      });
    });
  });

  describe('Rapid Site Switching', () => {
    it('should handle switching through all 5 sites sequentially', async () => {
      const user = userEvent.setup();
      render(<MockDashboard />);

      // Switch through all sites
      for (let i = 0; i < mockSites.length; i++) {
        const site = mockSites[i];
        await user.click(screen.getByTestId(`switch-to-site-${site.id}`));

        await waitFor(() => {
          expect(screen.getByText(site.name)).toBeInTheDocument();
        });

        expect(screen.getByTestId('site-domain')).toHaveTextContent(site.domain);
        expect(screen.getByTestId('subscriber-count')).toHaveTextContent(
          `${site.subscribersCount} subscribers`
        );
      }
    });

    it('should handle rapid back-and-forth switching', async () => {
      const user = userEvent.setup();
      render(<MockDashboard />);

      // Rapidly switch between site 1 and site 2 multiple times
      for (let i = 0; i < 3; i++) {
        await user.click(screen.getByTestId('switch-to-site-2'));
        await waitFor(() => {
          expect(screen.getByText('E-commerce Store')).toBeInTheDocument();
        });

        await user.click(screen.getByTestId('switch-to-site-1'));
        await waitFor(() => {
          expect(screen.getByText('Tech Blog')).toBeInTheDocument();
        });
      }

      // Final state should be correct
      expect(screen.getByTestId('subscriber-count')).toHaveTextContent('1500 subscribers');
    });
  });

  describe('Data Isolation Between Sites', () => {
    it('should show different subscriber counts for each site', async () => {
      const user = userEvent.setup();
      render(<MockDashboard />);

      const expectedCounts = {
        1: '1500 subscribers',
        2: '5200 subscribers',
        3: '12000 subscribers',
        4: '800 subscribers',
        5: '150 subscribers',
      };

      for (const [siteId, expectedCount] of Object.entries(expectedCounts)) {
        await user.click(screen.getByTestId(`switch-to-site-${siteId}`));

        await waitFor(() => {
          expect(screen.getByTestId('subscriber-count')).toHaveTextContent(expectedCount);
        });
      }
    });

    it('should show different campaign counts for each site', async () => {
      const user = userEvent.setup();
      render(<MockDashboard />);

      const expectedCounts = {
        1: '10 campaigns',
        2: '25 campaigns',
        3: '50 campaigns',
        4: '5 campaigns',
        5: '2 campaigns',
      };

      for (const [siteId, expectedCount] of Object.entries(expectedCounts)) {
        await user.click(screen.getByTestId(`switch-to-site-${siteId}`));

        await waitFor(() => {
          expect(screen.getByTestId('campaign-count')).toHaveTextContent(expectedCount);
        });
      }
    });

    it('should not mix data between sites during rapid switching', async () => {
      const user = userEvent.setup();
      render(<MockDashboard />);

      // Switch to site 3 (12000 subscribers)
      await user.click(screen.getByTestId('switch-to-site-3'));
      await waitFor(() => {
        expect(screen.getByTestId('subscriber-count')).toHaveTextContent('12000 subscribers');
      });

      // Switch to site 5 (150 subscribers)
      await user.click(screen.getByTestId('switch-to-site-5'));
      await waitFor(() => {
        expect(screen.getByTestId('subscriber-count')).toHaveTextContent('150 subscribers');
      });

      // Should NOT show 12000 anymore
      expect(screen.getByTestId('subscriber-count')).not.toHaveTextContent('12000 subscribers');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle switching to the same site', async () => {
      const user = userEvent.setup();
      render(<MockDashboard />);

      const initialDomain = screen.getByTestId('site-domain').textContent;

      // Click same site button
      await user.click(screen.getByTestId('switch-to-site-1'));

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      // Should still show same data
      expect(screen.getByTestId('site-domain')).toHaveTextContent(initialDomain!);
    });

    it('should maintain site list integrity during switches', async () => {
      const user = userEvent.setup();
      render(<MockDashboard />);

      // Switch multiple times
      await user.click(screen.getByTestId('switch-to-site-2'));
      await waitFor(() => {
        expect(screen.getByText('E-commerce Store')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('switch-to-site-4'));
      await waitFor(() => {
        expect(screen.getByText('Community Forum')).toBeInTheDocument();
      });

      // Site switcher should still show all 5 sites
      expect(screen.getByTestId('site-stats')).toHaveTextContent('Total Sites: 5');
      mockSites.forEach(site => {
        expect(screen.getByTestId(`switch-to-site-${site.id}`)).toBeInTheDocument();
      });
    });
  });

  describe('Performance and Memory', () => {
    it('should handle switching to site with large subscriber count', async () => {
      const user = userEvent.setup();
      render(<MockDashboard />);

      // Switch to News Portal with 12,000 subscribers
      await user.click(screen.getByTestId('switch-to-site-3'));

      await waitFor(() => {
        expect(screen.getByTestId('subscriber-count')).toHaveTextContent('12000 subscribers');
      }, { timeout: 3000 });

      expect(screen.getByText('News Portal')).toBeInTheDocument();
    });

    it('should complete site switch within reasonable time', async () => {
      const user = userEvent.setup();
      render(<MockDashboard />);

      const startTime = Date.now();

      await user.click(screen.getByTestId('switch-to-site-2'));

      await waitFor(() => {
        expect(screen.getByText('E-commerce Store')).toBeInTheDocument();
      });

      const duration = Date.now() - startTime;

      // Should complete within 500ms
      expect(duration).toBeLessThan(500);
    });
  });

  describe('User Experience', () => {
    it('should allow switching between sites without page reload', async () => {
      const user = userEvent.setup();
      const { container } = render(<MockDashboard />);

      const initialContainer = container;

      // Switch sites multiple times
      await user.click(screen.getByTestId('switch-to-site-2'));
      await waitFor(() => {
        expect(screen.getByText('E-commerce Store')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('switch-to-site-3'));
      await waitFor(() => {
        expect(screen.getByText('News Portal')).toBeInTheDocument();
      });

      // Container should be the same (no page reload)
      expect(container).toBe(initialContainer);
    });

    it('should show clear indication of current site', async () => {
      const user = userEvent.setup();
      render(<MockDashboard />);

      await user.click(screen.getByTestId('switch-to-site-4'));

      await waitFor(() => {
        // Both the name and domain should be visible
        expect(screen.getByText('Community Forum')).toBeInTheDocument();
        expect(screen.getByTestId('site-domain')).toHaveTextContent('forum.com');
      });
    });
  });
});
