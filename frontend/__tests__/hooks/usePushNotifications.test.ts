import { renderHook, act } from '@testing-library/react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

// Mock Notification API
const mockNotification = {
  permission: 'default' as NotificationPermission,
  requestPermission: jest.fn(),
};

Object.defineProperty(window, 'Notification', {
  value: mockNotification,
  writable: true,
});

// Mock service worker registration
const mockServiceWorkerRegistration = {
  pushManager: {
    subscribe: jest.fn(),
    getSubscription: jest.fn(),
  },
};

Object.defineProperty(navigator, 'serviceWorker', {
  value: {
    ready: Promise.resolve(mockServiceWorkerRegistration),
    register: jest.fn(),
  },
  writable: true,
});

// Mock push service
jest.mock('@/services/api', () => ({
  pushService: {
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
  },
}));

describe('usePushNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockNotification.permission = 'default';
    mockNotification.requestPermission.mockResolvedValue('granted');
    mockServiceWorkerRegistration.pushManager.getSubscription.mockResolvedValue(null);
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => usePushNotifications());

    expect(result.current.isSupported).toBe(true);
    expect(result.current.isSubscribed).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(result.current.permission).toBe('default');
  });

  it('detects when push notifications are not supported', () => {
    // Mock unsupported environment
    Object.defineProperty(window, 'Notification', {
      value: undefined,
      writable: true,
    });

    const { result } = renderHook(() => usePushNotifications());

    expect(result.current.isSupported).toBe(false);
  });

  it('requests permission successfully', async () => {
    const { result } = renderHook(() => usePushNotifications());

    await act(async () => {
      await result.current.requestPermission();
    });

    expect(mockNotification.requestPermission).toHaveBeenCalled();
    expect(result.current.permission).toBe('granted');
  });

  it('handles permission denial', async () => {
    mockNotification.requestPermission.mockResolvedValue('denied');

    const { result } = renderHook(() => usePushNotifications());

    await act(async () => {
      await result.current.requestPermission();
    });

    expect(result.current.permission).toBe('denied');
  });

  it('subscribes to push notifications', async () => {
    const mockSubscription = {
      endpoint: 'https://fcm.googleapis.com/fcm/send/test',
      getKey: jest.fn().mockImplementation((name) => {
        if (name === 'p256dh') return new ArrayBuffer(8);
        if (name === 'auth') return new ArrayBuffer(8);
        return null;
      }),
    };

    mockNotification.permission = 'granted';
    mockServiceWorkerRegistration.pushManager.subscribe.mockResolvedValue(mockSubscription);

    const { result } = renderHook(() => usePushNotifications());

    await act(async () => {
      const success = await result.current.subscribe(1);
      expect(success).toBe(true);
    });

    expect(mockServiceWorkerRegistration.pushManager.subscribe).toHaveBeenCalled();
    expect(result.current.isSubscribed).toBe(true);
  });

  it('handles subscription error', async () => {
    mockNotification.permission = 'granted';
    mockServiceWorkerRegistration.pushManager.subscribe.mockRejectedValue(
      new Error('Subscription failed')
    );

    const { result } = renderHook(() => usePushNotifications());

    await act(async () => {
      const success = await result.current.subscribe(1);
      expect(success).toBe(false);
    });

    expect(result.current.isSubscribed).toBe(false);
    expect(result.current.error).toBe('Subscription failed');
  });

  it('unsubscribes from push notifications', async () => {
    const mockSubscription = {
      unsubscribe: jest.fn().mockResolvedValue(true),
      endpoint: 'https://fcm.googleapis.com/fcm/send/test',
      getKey: jest.fn(),
    };

    mockServiceWorkerRegistration.pushManager.getSubscription.mockResolvedValue(mockSubscription);

    const { result } = renderHook(() => usePushNotifications());

    await act(async () => {
      const success = await result.current.unsubscribe();
      expect(success).toBe(true);
    });

    expect(mockSubscription.unsubscribe).toHaveBeenCalled();
    expect(result.current.isSubscribed).toBe(false);
  });

  it('checks existing subscription on mount', async () => {
    const mockSubscription = {
      endpoint: 'https://fcm.googleapis.com/fcm/send/test',
      getKey: jest.fn(),
    };

    mockServiceWorkerRegistration.pushManager.getSubscription.mockResolvedValue(mockSubscription);

    const { result } = renderHook(() => usePushNotifications());

    // Wait for effect to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(result.current.isSubscribed).toBe(true);
  });

  it('does not subscribe when permission is denied', async () => {
    mockNotification.permission = 'denied';

    const { result } = renderHook(() => usePushNotifications());

    await act(async () => {
      const success = await result.current.subscribe(1);
      expect(success).toBe(false);
    });

    expect(mockServiceWorkerRegistration.pushManager.subscribe).not.toHaveBeenCalled();
    expect(result.current.isSubscribed).toBe(false);
  });

  it('handles loading state correctly', async () => {
    mockNotification.permission = 'granted';
    
    // Mock a slow subscription process
    let resolveSubscribe: (value: any) => void;
    mockServiceWorkerRegistration.pushManager.subscribe.mockReturnValue(
      new Promise((resolve) => {
        resolveSubscribe = resolve;
      })
    );

    const { result } = renderHook(() => usePushNotifications());

    // Start subscription
    act(() => {
      result.current.subscribe(1);
    });

    // Should be loading
    expect(result.current.loading).toBe(true);

    // Resolve the subscription
    await act(async () => {
      resolveSubscribe!({
        endpoint: 'https://fcm.googleapis.com/fcm/send/test',
        getKey: jest.fn(),
      });
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Should not be loading anymore
    expect(result.current.loading).toBe(false);
  });

  it('clears error when starting new operation', async () => {
    const { result } = renderHook(() => usePushNotifications());

    // Set an error first
    await act(async () => {
      mockServiceWorkerRegistration.pushManager.subscribe.mockRejectedValue(
        new Error('First error')
      );
      await result.current.subscribe(1);
    });

    expect(result.current.error).toBe('First error');

    // Try again - error should be cleared
    await act(async () => {
      mockServiceWorkerRegistration.pushManager.subscribe.mockResolvedValue({
        endpoint: 'https://fcm.googleapis.com/fcm/send/test',
        getKey: jest.fn(),
      });
      await result.current.subscribe(1);
    });

    expect(result.current.error).toBeNull();
  });
});