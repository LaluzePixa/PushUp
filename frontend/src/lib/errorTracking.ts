/**
 * Error Tracking Service
 *
 * This module provides error tracking functionality for the application.
 * It's designed to work with Sentry or LogRocket for production error monitoring.
 *
 * To enable:
 * 1. Install Sentry: npm install @sentry/nextjs
 * 2. Run: npx @sentry/wizard@latest -i nextjs
 * 3. Add NEXT_PUBLIC_SENTRY_DSN to .env.local
 * 4. Uncomment the imports and calls below
 */

// import * as Sentry from "@sentry/nextjs";

type ErrorContext = {
  user?: { id: string; email?: string; role?: string };
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
};

class ErrorTrackingService {
  private isEnabled: boolean = false;

  initialize() {
    // Check if Sentry DSN is configured
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
      this.isEnabled = true;

      /**
       * Uncomment to enable Sentry:
       *
       * Sentry.init({
       *   dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
       *   environment: process.env.NODE_ENV,
       *   tracesSampleRate: 1.0,
       *   replaysSessionSampleRate: 0.1,
       *   replaysOnErrorSampleRate: 1.0,
       *   integrations: [
       *     new Sentry.BrowserTracing(),
       *     new Sentry.Replay({
       *       maskAllText: true,
       *       blockAllMedia: true,
       *     }),
       *   ],
       * });
       */

      console.info('Error tracking is ready (Sentry/LogRocket not configured)');
    } else {
      console.warn('Error tracking disabled. Set NEXT_PUBLIC_SENTRY_DSN to enable.');
    }
  }

  captureException(error: Error, context?: ErrorContext) {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error captured:', error, context);
    }

    if (!this.isEnabled) return;

    /**
     * Uncomment to enable Sentry error capture:
     *
     * Sentry.withScope((scope) => {
     *   if (context?.user) {
     *     scope.setUser(context.user);
     *   }
     *   if (context?.tags) {
     *     Object.entries(context.tags).forEach(([key, value]) => {
     *       scope.setTag(key, value);
     *     });
     *   }
     *   if (context?.extra) {
     *     Object.entries(context.extra).forEach(([key, value]) => {
     *       scope.setExtra(key, value);
     *     });
     *   }
     *   if (context?.level) {
     *     scope.setLevel(context.level);
     *   }
     *   Sentry.captureException(error);
     * });
     */
  }

  captureMessage(message: string, context?: ErrorContext) {
    if (process.env.NODE_ENV === 'development') {
      console.log('Message captured:', message, context);
    }

    if (!this.isEnabled) return;

    /**
     * Uncomment to enable Sentry message capture:
     *
     * Sentry.withScope((scope) => {
     *   if (context?.user) {
     *     scope.setUser(context.user);
     *   }
     *   if (context?.tags) {
     *     Object.entries(context.tags).forEach(([key, value]) => {
     *       scope.setTag(key, value);
     *     });
     *   }
     *   if (context?.level) {
     *     scope.setLevel(context.level);
     *   }
     *   Sentry.captureMessage(message);
     * });
     */
  }

  setUser(user: { id: string; email?: string; role?: string } | null) {
    if (!this.isEnabled) return;

    /**
     * Uncomment to enable Sentry user tracking:
     *
     * if (user) {
     *   Sentry.setUser(user);
     * } else {
     *   Sentry.setUser(null);
     * }
     */
  }

  addBreadcrumb(breadcrumb: {
    message: string;
    category?: string;
    level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
    data?: Record<string, unknown>;
  }) {
    if (!this.isEnabled) return;

    /**
     * Uncomment to enable Sentry breadcrumbs:
     *
     * Sentry.addBreadcrumb(breadcrumb);
     */
  }
}

// Create singleton instance
const errorTracking = new ErrorTrackingService();

// Initialize on client side
if (typeof window !== 'undefined') {
  errorTracking.initialize();
}

export default errorTracking;
