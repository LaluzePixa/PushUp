import React from 'react';
import { render, screen } from '@testing-library/react';
import RegisterPage from '@/app/(auth)/register/page';

// Mock the RegisterComponent
jest.mock('@/components/RegisterComponent', () => ({
  RegisterCard: () => <div data-testid="register-component">Register Component</div>,
}));

describe('Register Page', () => {
  it('renders without crashing', () => {
    render(<RegisterPage />);
    expect(screen.getByTestId('register-component')).toBeInTheDocument();
  });

  it('displays the register component', () => {
    render(<RegisterPage />);
    expect(screen.getByText('Register Component')).toBeInTheDocument();
  });

  it('has correct wrapper structure', () => {
    render(<RegisterPage />);
    const wrapper = screen.getByTestId('register-component').parentElement;
    expect(wrapper?.tagName.toLowerCase()).toBe('div');
  });

  it('renders register component inside container', () => {
    const { container } = render(<RegisterPage />);
    const divElement = container.querySelector('div');
    expect(divElement).toBeInTheDocument();
    expect(divElement).toContainElement(screen.getByTestId('register-component'));
  });
});