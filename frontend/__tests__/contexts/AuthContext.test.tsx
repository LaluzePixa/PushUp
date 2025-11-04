import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/api';
import { checkAuth } from '@/lib/auth';

// Mock the dependencies
jest.mock('@/services/api');
jest.mock('@/lib/auth');
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

const mockAuthService = authService as jest.Mocked<typeof authService>;
const mockCheckAuth = checkAuth as jest.MockedFunction<typeof checkAuth>;

// Test component that uses the auth context
const TestComponent = () => {
  const { user, login, logout, loading, register, isAuthenticated } = useAuth();

  return (
    <div>
      <div data-testid="user">{user ? JSON.stringify(user) : 'null'}</div>
      <div data-testid="loading">{loading ? 'loading' : 'not-loading'}</div>
      <div data-testid="authenticated">{isAuthenticated ? 'authenticated' : 'not-authenticated'}</div>
      <button 
        data-testid="login-button" 
        onClick={() => login({ email: 'test@example.com', password: 'password' })}
      >
        Login
      </button>
      <button 
        data-testid="register-button"
        onClick={() => register({ email: 'test@example.com', password: 'password' })}
      >
        Register
      </button>
      <button data-testid="logout-button" onClick={logout}>
        Logout
      </button>
    </div>
  );
};

const renderWithAuthProvider = (component: React.ReactElement) => {
  return render(
    <AuthProvider>
      {component}
    </AuthProvider>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  });

  it('provides default values', async () => {
    mockCheckAuth.mockResolvedValue({
      isAuthenticated: false,
      user: null
    });

    renderWithAuthProvider(<TestComponent />);
    
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    });

    expect(screen.getByTestId('user')).toHaveTextContent('null');
    expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
  });

  it('handles successful login', async () => {
    const user = userEvent.setup();
    const mockUser = { 
      id: 1, 
      email: 'test@example.com', 
      role: 'user' as const, 
      isActive: true, 
      createdAt: '2023-01-01T00:00:00Z' 
    };
    
    mockAuthService.login.mockResolvedValue({
      success: true,
      data: { user: mockUser, token: 'mock-token' }
    });

    mockCheckAuth.mockResolvedValue({
      isAuthenticated: false,
      user: null
    });

    renderWithAuthProvider(<TestComponent />);
    
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    });

    const loginButton = screen.getByTestId('login-button');
    await user.click(loginButton);

    await waitFor(() => {
      expect(mockAuthService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password'
      });
    });
  });

  it('handles login error', async () => {
    const user = userEvent.setup();
    
    mockAuthService.login.mockResolvedValue({
      success: false,
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid credentials'
      }
    });

    mockCheckAuth.mockResolvedValue({
      isAuthenticated: false,
      user: null
    });

    renderWithAuthProvider(<TestComponent />);
    
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    });

    const loginButton = screen.getByTestId('login-button');
    await user.click(loginButton);

    await waitFor(() => {
      expect(mockAuthService.login).toHaveBeenCalled();
    });
  });

  it('handles successful registration', async () => {
    const user = userEvent.setup();
    const mockUser = { 
      id: 1, 
      email: 'test@example.com', 
      role: 'user' as const, 
      isActive: true, 
      createdAt: '2023-01-01T00:00:00Z' 
    };
    
    mockAuthService.register.mockResolvedValue({
      success: true,
      data: { user: mockUser, token: 'mock-token' }
    });

    mockCheckAuth.mockResolvedValue({
      isAuthenticated: false,
      user: null
    });

    renderWithAuthProvider(<TestComponent />);
    
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    });

    const registerButton = screen.getByTestId('register-button');
    await user.click(registerButton);

    await waitFor(() => {
      expect(mockAuthService.register).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password'
      });
    });
  });

  it('handles logout', async () => {
    const user = userEvent.setup();
    const mockUser = { 
      id: 1, 
      email: 'test@example.com', 
      role: 'user' as const, 
      isActive: true, 
      createdAt: '2023-01-01T00:00:00Z' 
    };
    
    // Start with authenticated user
    mockCheckAuth.mockResolvedValue({
      isAuthenticated: true,
      user: mockUser
    });

    renderWithAuthProvider(<TestComponent />);
    
    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser));
      expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
    });

    // Now logout
    const logoutButton = screen.getByTestId('logout-button');
    await user.click(logoutButton);

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('null');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
    });
  });

  it('initializes with existing authenticated user', async () => {
    const mockUser = { 
      id: 1, 
      email: 'test@example.com', 
      role: 'user' as const, 
      isActive: true, 
      createdAt: '2023-01-01T00:00:00Z' 
    };
    
    mockCheckAuth.mockResolvedValue({
      isAuthenticated: true,
      user: mockUser
    });

    renderWithAuthProvider(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser));
      expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    });
  });

  it('handles auth check error', async () => {
    mockCheckAuth.mockRejectedValue(new Error('Auth check failed'));

    renderWithAuthProvider(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('null');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    });
  });

  it('provides admin status correctly', async () => {
    const adminUser = { 
      id: 1, 
      email: 'admin@example.com', 
      role: 'admin' as const, 
      isActive: true, 
      createdAt: '2023-01-01T00:00:00Z' 
    };
    
    mockCheckAuth.mockResolvedValue({
      isAuthenticated: true,
      user: adminUser
    });

    const AdminTestComponent = () => {
      const { isAdmin, isSuperAdmin } = useAuth();
      return (
        <div>
          <div data-testid="is-admin">{isAdmin ? 'admin' : 'not-admin'}</div>
          <div data-testid="is-super-admin">{isSuperAdmin ? 'super-admin' : 'not-super-admin'}</div>
        </div>
      );
    };

    renderWithAuthProvider(<AdminTestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('is-admin')).toHaveTextContent('admin');
      expect(screen.getByTestId('is-super-admin')).toHaveTextContent('not-super-admin');
    });
  });
});