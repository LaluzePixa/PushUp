import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { CardDemo } from '@/components/LoginComponent';
import { useAuth } from '@/contexts/AuthContext';

// Mock dependencies
const mockPush = jest.fn();
const mockLogin = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
  }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockPush.mockClear();
  mockLogin.mockClear();
});

describe('CardDemo (LoginComponent)', () => {
  it('renders login form elements', () => {
    render(<CardDemo />);
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
    expect(screen.getByText(/sign up/i)).toBeInTheDocument();
  });

  it('shows validation errors for empty fields', async () => {
    const user = userEvent.setup();
    render(<CardDemo />);

    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

    // The form has HTML5 validation (required attributes), so clicking won't trigger
    // our custom validation. We need to remove required attributes or type values first.
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    // Type and then clear to bypass HTML5 validation
    await user.type(emailInput, 'a');
    await user.clear(emailInput);
    await user.type(passwordInput, 'a');
    await user.clear(passwordInput);

    // Remove required attribute to allow form submission
    emailInput.removeAttribute('required');
    passwordInput.removeAttribute('required');

    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/por favor, completa todos los campos/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue({ success: true });
    
    render(<CardDemo />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('handles login error', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Invalid credentials';
    mockLogin.mockResolvedValue({ success: false, error: errorMessage });
    
    render(<CardDemo />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    const user = userEvent.setup();
    // Mock a slow login to test loading state
    mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100)));
    
    render(<CardDemo />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);
    
    // Check for loading state
    expect(screen.getByText(/iniciando sesión/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('navigates to select-site page after successful login', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue({ success: true });
    
    render(<CardDemo />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/select-site');
    });
  });

  it('shows forgot password link', () => {
    render(<CardDemo />);
    
    expect(screen.getByText(/forgot your password/i)).toBeInTheDocument();
  });

  it('shows sign up link', () => {
    render(<CardDemo />);
    
    expect(screen.getByText(/sign up/i)).toBeInTheDocument();
  });
});