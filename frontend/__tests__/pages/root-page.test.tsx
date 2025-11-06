import React from 'react';
import { render, screen } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import OldPage from '@/app/page';

// Mock Next.js router
const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

describe('Root Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();
    mockReplace.mockClear();
  });

  it('renders loading state', () => {
    const { container } = render(<OldPage />);

    expect(screen.getByText('Redirigiendo...')).toBeInTheDocument();

    // Check for the spinner element with animate-spin class
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('rounded-full', 'h-8', 'w-8', 'border-b-2', 'border-blue-600');
  });

  it('redirects to dashboard on mount', () => {
    render(<OldPage />);

    expect(mockPush).toHaveBeenCalledWith('/dashboard');
    expect(mockPush).toHaveBeenCalledTimes(1);
  });

  it('has correct loading animation elements', () => {
    render(<OldPage />);

    const container = screen.getByText('Redirigiendo...').closest('div');
    expect(container).toHaveClass('text-center');

    const spinnerContainer = container?.querySelector('.animate-spin');
    expect(spinnerContainer).toBeInTheDocument();
    expect(spinnerContainer).toHaveClass('rounded-full', 'h-8', 'w-8', 'border-b-2', 'border-blue-600');
  });

  it('has proper layout structure', () => {
    render(<OldPage />);

    const mainContainer = screen.getByText('Redirigiendo...').closest('.flex');
    expect(mainContainer).toHaveClass('items-center', 'justify-center', 'min-h-screen');
  });
});