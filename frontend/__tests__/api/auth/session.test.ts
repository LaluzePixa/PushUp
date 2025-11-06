import { GET } from '@/app/api/auth/session/route';

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
}));

// Mock the auth-server module
jest.mock('@/lib/auth-server', () => ({
  getSession: jest.fn(),
}));

import { getSession } from '@/lib/auth-server';

const mockGetSession = getSession as jest.MockedFunction<typeof getSession>;

describe('/api/auth/session', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset console.error mock
    jest.spyOn(console, 'error').mockImplementation(() => { });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('successfully returns session data', async () => {
    const mockSession = {
      user: {
        id: 1,
        email: 'test@example.com',
        role: 'user' as const,
        isActive: true,
        createdAt: '2023-01-01T00:00:00Z'
      },
      sessionId: 'session-123',
      expiresAt: new Date()
    };
    mockGetSession.mockResolvedValue(mockSession);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(expect.objectContaining({
      user: expect.objectContaining({
        id: 1,
        email: 'test@example.com'
      })
    }));
    expect(mockGetSession).toHaveBeenCalledTimes(1);
  });

  it('handles session retrieval error', async () => {
    const error = new Error('Session retrieval failed');
    mockGetSession.mockRejectedValue(error);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: 'Internal server error' });
    expect(mockGetSession).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith('Session check error:', error);
  });

  it('returns JSON response with correct content type', async () => {
    mockGetSession.mockResolvedValue(null);

    const response = await GET();

    expect(response.headers.get('content-type')).toContain('application/json');
  });

  it('calls getSession without parameters', async () => {
    mockGetSession.mockResolvedValue(null);

    await GET();

    expect(mockGetSession).toHaveBeenCalledWith();
  });

  it('handles null session response', async () => {
    mockGetSession.mockResolvedValue(null);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: 'Not authenticated' });
  });

  it('handles different types of errors', async () => {
    const stringError = 'String error message';
    mockGetSession.mockRejectedValue(stringError);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: 'Internal server error' });
    expect(console.error).toHaveBeenCalledWith('Session check error:', stringError);
  });
});