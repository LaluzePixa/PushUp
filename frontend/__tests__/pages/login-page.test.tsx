import React from 'react';
import { render, screen } from '@testing-library/react';
import LoginPage from '@/app/(auth)/login/page';

// Mock the LoginComponent
jest.mock('@/components/LoginComponent', () => ({
  CardDemo: () => <div data-testid="login-component">Login Component</div>,
}));

describe('Login Page', () => {
  it('renders without crashing', () => {
    render(<LoginPage />);
    expect(screen.getByTestId('login-component')).toBeInTheDocument();
  });

  it('displays the login component', () => {
    render(<LoginPage />);
    expect(screen.getByText('Login Component')).toBeInTheDocument();
  });

  it('has correct wrapper structure', () => {
    render(<LoginPage />);
    const wrapper = screen.getByTestId('login-component').parentElement;
    expect(wrapper?.tagName.toLowerCase()).toBe('div');
  });

  it('renders login component inside container', () => {
    const { container } = render(<LoginPage />);
    const divElement = container.querySelector('div');
    expect(divElement).toBeInTheDocument();
    expect(divElement).toContainElement(screen.getByTestId('login-component'));
  });
});