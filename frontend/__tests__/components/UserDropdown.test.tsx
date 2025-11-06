import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserDropdown } from '@/components/UserDropdown';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock AuthContext
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('UserDropdown', () => {
  const mockPush = jest.fn();
  const mockLogout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseRouter.mockReturnValue({
      push: mockPush,
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    });

    mockUseAuth.mockReturnValue({
      user: null,
      login: jest.fn(),
      register: jest.fn(),
      logout: mockLogout,
      refreshUser: jest.fn(),
      loading: false,
      isAuthenticated: false,
      isAdmin: false,
      isSuperAdmin: false,
    });
  });

  it('renders user dropdown with user information', () => {
    const user = { name: 'John Doe', email: 'john@example.com' };
    render(<UserDropdown user={user} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument(); // User name
    expect(screen.getByText('john@example.com')).toBeInTheDocument(); // User email
  });

  it('renders user dropdown without email', () => {
    const user = { name: 'Jane Smith' };
    render(<UserDropdown user={user} />);

    expect(screen.getByText('Jane Smith')).toBeInTheDocument(); // User name instead of initials
  });

  it('opens dropdown when trigger is clicked', async () => {
    const user = userEvent.setup();
    const userData = { name: 'John Doe', email: 'john@example.com' };
    render(<UserDropdown user={userData} />);

    const trigger = screen.getByRole('button');
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText(/cerrar sesión/i)).toBeInTheDocument();
    });
  });

  it('calls logout when logout is clicked', async () => {
    const user = userEvent.setup();
    const userData = { name: 'John Doe', email: 'john@example.com' };
    render(<UserDropdown user={userData} />);

    const trigger = screen.getByRole('button');
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText(/cerrar sesión/i)).toBeInTheDocument();
    });

    const logoutButton = screen.getByText(/cerrar sesión/i);
    await user.click(logoutButton);

    expect(mockLogout).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('renders user with name in trigger', () => {
    const user = { name: 'John' };
    render(<UserDropdown user={user} />);

    expect(screen.getByText('John')).toBeInTheDocument();
  });

  it('renders user with full name in trigger', () => {
    const user = { name: 'John Michael Doe' };
    render(<UserDropdown user={user} />);

    expect(screen.getByText('John Michael Doe')).toBeInTheDocument(); // Full name instead of initials
  });

  it('handles empty name gracefully', () => {
    const user = { name: '' };
    render(<UserDropdown user={user} />);

    // Should render something even with empty name
    const avatar = screen.getByRole('button');
    expect(avatar).toBeInTheDocument();
  });

  it('displays user information correctly in dropdown', async () => {
    const user = userEvent.setup();
    const userData = { name: 'Alice Johnson', email: 'alice@example.com' };
    render(<UserDropdown user={userData} />);

    const trigger = screen.getByRole('button');
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    });
  });

  it('does not show email when not provided', async () => {
    const user = userEvent.setup();
    const userData = { name: 'Bob Wilson' };
    render(<UserDropdown user={userData} />);

    const trigger = screen.getByRole('button');
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
    });

    // Email should not be shown if not provided
    expect(screen.queryByText('@')).not.toBeInTheDocument();
  });

  it('closes dropdown when clicking outside', async () => {
    const user = userEvent.setup();
    const userData = { name: 'Carol Davis', email: 'carol@example.com' };
    render(
      <div style={{ pointerEvents: 'auto' }}>
        <UserDropdown user={userData} />
        <div data-testid="outside">Outside element</div>
      </div>
    );

    const trigger = screen.getByRole('button');
    await user.click(trigger);

    // Wait for dropdown menu to appear
    await waitFor(() => {
      expect(screen.getByText(/cerrar sesión/i)).toBeInTheDocument();
    });

    const outsideElement = screen.getByTestId('outside');
    await user.click(outsideElement);

    // Wait for dropdown menu to disappear
    await waitFor(() => {
      expect(screen.queryByText(/cerrar sesión/i)).not.toBeInTheDocument();
    });
  });

  it('handles special characters in name', () => {
    const user = { name: 'José María', email: 'jose@example.com' };
    render(<UserDropdown user={user} />);

    expect(screen.getByText('José María')).toBeInTheDocument(); // Full name instead of initials
  });

  it('handles very long names', () => {
    const user = { name: 'Alexander Christopher Wellington Montgomery' };
    render(<UserDropdown user={user} />);

    expect(screen.getByText('Alexander Christopher Wellington Montgomery')).toBeInTheDocument(); // Full name instead of initials
  });
});