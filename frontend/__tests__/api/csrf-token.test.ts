import { GET } from '@/app/api/csrf-token/route';

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

// Mock the csrf module
jest.mock('@/lib/csrf', () => ({
  generateCSRFToken: jest.fn(),
}));

import { generateCSRFToken } from '@/lib/csrf';

const mockGenerateCSRFToken = generateCSRFToken as jest.MockedFunction<typeof generateCSRFToken>;

describe('/api/csrf-token', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset console.error mock
    jest.spyOn(console, 'error').mockImplementation(() => { });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('successfully generates and returns CSRF token', async () => {
    const mockToken = 'mock-csrf-token-123';
    mockGenerateCSRFToken.mockResolvedValue(mockToken);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ token: mockToken });
    expect(mockGenerateCSRFToken).toHaveBeenCalledTimes(1);
  });

  it('handles CSRF token generation error', async () => {
    const error = new Error('Token generation failed');
    mockGenerateCSRFToken.mockRejectedValue(error);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: 'Failed to generate CSRF token' });
    expect(mockGenerateCSRFToken).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith('CSRF token generation error:', error);
  });

  it('returns JSON response with correct content type', async () => {
    const mockToken = 'test-token';
    mockGenerateCSRFToken.mockResolvedValue(mockToken);

    const response = await GET();

    expect(response.headers.get('content-type')).toContain('application/json');
  });

  it('calls generateCSRFToken without parameters', async () => {
    const mockToken = 'test-token';
    mockGenerateCSRFToken.mockResolvedValue(mockToken);

    await GET();

    expect(mockGenerateCSRFToken).toHaveBeenCalledWith();
  });

  it('handles empty token response', async () => {
    mockGenerateCSRFToken.mockResolvedValue('');

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ token: '' });
  });

  it('handles different types of errors', async () => {
    const stringError = 'String error message';
    mockGenerateCSRFToken.mockRejectedValue(stringError);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: 'Failed to generate CSRF token' });
    expect(console.error).toHaveBeenCalledWith('CSRF token generation error:', stringError);
  });
});