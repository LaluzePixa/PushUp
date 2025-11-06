import React from 'react';
import { render, screen } from '@testing-library/react';
import Page from '@/app/(main)/data-and-privacy/page';

// Mock the InfoCard component
jest.mock('@/components/InfoCard', () => {
  return function MockInfoCard({ title, description }: { title: string; description: string }) {
    return (
      <div data-testid="info-card">
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    );
  };
});

describe('Data and Privacy Page', () => {
  it('renders without crashing', () => {
    render(<Page />);
    expect(screen.getByTestId('info-card')).toBeInTheDocument();
  });

  it('displays the main title and description', () => {
    render(<Page />);
    expect(screen.getByText('Data & Privacy Details')).toBeInTheDocument();
    expect(screen.getByText(/Your trust is the most important thing to us/)).toBeInTheDocument();
  });

  it('displays User Data section', () => {
    render(<Page />);
    expect(screen.getByText('User Data')).toBeInTheDocument();
    expect(screen.getByText(/We store following data points for each Subscriber/)).toBeInTheDocument();
  });

  it('displays all user data fields', () => {
    render(<Page />);

    // Check for data field labels
    expect(screen.getByText('date')).toBeInTheDocument();
    expect(screen.getByText('endpoint')).toBeInTheDocument();
    expect(screen.getByText('timezone')).toBeInTheDocument();
    expect(screen.getByText('device_type')).toBeInTheDocument();
    expect(screen.getByText('operating_system')).toBeInTheDocument();
    expect(screen.getByText('browser')).toBeInTheDocument();
    expect(screen.getByText('ip_address')).toBeInTheDocument();
    expect(screen.getByText('city')).toBeInTheDocument();
    expect(screen.getByText('state')).toBeInTheDocument();
    expect(screen.getByText('country')).toBeInTheDocument();
    expect(screen.getByText('session_date')).toBeInTheDocument();
  });

  it('displays Cookies section', () => {
    render(<Page />);
    expect(screen.getByText('Cookies')).toBeInTheDocument();
    expect(screen.getByText(/Webpushr JavaScript snippet use HTTP Cookies/)).toBeInTheDocument();
  });

  it('displays all cookie types', () => {
    render(<Page />);

    expect(screen.getByText('_webpushrPageviews')).toBeInTheDocument();
    expect(screen.getByText('_webpushrSubscriberID')).toBeInTheDocument();
    expect(screen.getByText('_webpushrPromptAction')).toBeInTheDocument();
    expect(screen.getByText('_webpushrEndPoint')).toBeInTheDocument();
    expect(screen.getByText('_webpushrLastVisit')).toBeInTheDocument();
    expect(screen.getByText('_webpushrSessionLog')).toBeInTheDocument();
    expect(screen.getByText('_webpushrSubscriberCount')).toBeInTheDocument();
    expect(screen.getByText('_webpushr')).toBeInTheDocument();
  });

  it('displays FAQ section', () => {
    render(<Page />);
    expect(screen.getByText('Frequently asked questions')).toBeInTheDocument();
  });

  it('displays all FAQ questions', () => {
    render(<Page />);

    expect(screen.getByText(/Can Webpushr determine the end-user identity/)).toBeInTheDocument();
    expect(screen.getByText(/Will I lose any Webpushr functionality/)).toBeInTheDocument();
    expect(screen.getByText(/What happens if a subscriber unsubscribes/)).toBeInTheDocument();
    expect(screen.getByText(/How long do you store subscriber data/)).toBeInTheDocument();
    expect(screen.getByText(/How can I be GDPR compliant/)).toBeInTheDocument();
  });

  it('displays contact section', () => {
    render(<Page />);
    expect(screen.getByText('Have more questions?')).toBeInTheDocument();
    expect(screen.getByText('Ask us anything')).toBeInTheDocument();
  });

  it('has proper layout structure', () => {
    const { container } = render(<Page />);

    const mainContainer = container.querySelector('.max-w-4xl.mx-auto.p-6.space-y-8');
    expect(mainContainer).toBeInTheDocument();

    const sections = container.querySelectorAll('.bg-white.rounded-lg.border');
    expect(sections.length).toBeGreaterThan(0);
  });

  it('displays links with proper styling', () => {
    render(<Page />);

    // Get all links, filtering out the "Ask us anything" button
    const links = screen.getAllByRole('link').filter(link =>
      link.textContent !== 'Ask us anything'
    );

    expect(links.length).toBeGreaterThan(0);

    links.forEach(link => {
      expect(link).toHaveClass('text-blue-600', 'hover:text-blue-800', 'underline');
    });
  });

  it('displays action button with proper styling', () => {
    render(<Page />);

    const button = screen.getByText('Ask us anything');
    expect(button).toHaveClass('inline-block', 'bg-blue-500', 'hover:bg-blue-600', 'text-white');
  });

  it('has responsive grid layout for data fields', () => {
    const { container } = render(<Page />);

    const dataFields = container.querySelectorAll('.flex');
    expect(dataFields.length).toBeGreaterThan(0);

    // Check that each field has the proper layout structure
    dataFields.forEach(field => {
      const labelColumn = field.querySelector('.w-32.flex-shrink-0, .w-48.flex-shrink-0');
      const contentColumn = field.querySelector('.flex-1');

      if (labelColumn && contentColumn) {
        expect(labelColumn).toBeInTheDocument();
        expect(contentColumn).toBeInTheDocument();
      }
    });
  });
});