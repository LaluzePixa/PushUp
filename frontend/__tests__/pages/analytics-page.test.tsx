import React from 'react';
import { render, screen } from '@testing-library/react';
import Analytics from '@/app/(main)/dashboard/analytics/page';

// Mock the InlineChart component
jest.mock('@/components/InlineChart', () => ({
  InlineChart: () => <div data-testid="inline-chart">Inline Chart Component</div>,
}));

describe('Analytics Page', () => {
  it('renders without crashing', () => {
    render(<Analytics />);
    expect(screen.getByTestId('inline-chart')).toBeInTheDocument();
  });

  it('displays the inline chart component', () => {
    render(<Analytics />);
    expect(screen.getByText('Inline Chart Component')).toBeInTheDocument();
  });

  it('has correct wrapper structure', () => {
    render(<Analytics />);
    const wrapper = screen.getByTestId('inline-chart').parentElement;
    expect(wrapper?.tagName.toLowerCase()).toBe('div');
  });

  it('renders inline chart inside container', () => {
    const { container } = render(<Analytics />);
    const divElement = container.querySelector('div');
    expect(divElement).toBeInTheDocument();
    expect(divElement).toContainElement(screen.getByTestId('inline-chart'));
  });
});