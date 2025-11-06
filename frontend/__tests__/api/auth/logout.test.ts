import { NextRequest } from 'next/server';
import { POST } from '@/app/api/auth/logout/route';

// Mock next/server
jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: any, init?: ResponseInit) => {
      const headers = new Headers();
      headers.set('content-type', 'application/json');

      return {
        json: async () => data,
        status: init?.status || 200,
        headers: headers,
      };
    },
  },
  NextRequest: jest.fn(),
}));

// Mock the auth-server module
jest.mock('@/lib/auth-server', () => ({
  deleteSession: jest.fn(),
}));

import { deleteSession } from '@/lib/auth-server';

const mockDeleteSession = deleteSession as jest.MockedFunction<typeof deleteSession>;

describe('/api/auth/logout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset console.error mock
    jest.spyOn(console, 'error').mockImplementation(() => { });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('successfully logs out user', async () => {
    mockDeleteSession.mockResolvedValue(undefined);

    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ message: 'Logged out successfully' });
    expect(mockDeleteSession).toHaveBeenCalledTimes(1);
  });

  it('handles logout error gracefully', async () => {
    const error = new Error('Session deletion failed');
    mockDeleteSession.mockRejectedValue(error);

    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: 'Logout failed' });
    expect(mockDeleteSession).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith('Logout error:', error);
  });

  it('calls deleteSession without parameters', async () => {
    mockDeleteSession.mockResolvedValue(undefined);

    await POST();

    expect(mockDeleteSession).toHaveBeenCalledWith();
  });

  it('returns JSON response with correct content type', async () => {
    mockDeleteSession.mockResolvedValue(undefined);

    const response = await POST();

    expect(response.headers.get('content-type')).toContain('application/json');
  });

  it('handles different types of errors', async () => {
    const stringError = 'String error';
    mockDeleteSession.mockRejectedValue(stringError);

    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: 'Logout failed' });
    expect(console.error).toHaveBeenCalledWith('Logout error:', stringError);
  });
});