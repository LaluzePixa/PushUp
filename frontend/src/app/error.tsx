'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

/**
 * Global Error Handler for Next.js App Router
 * This catches errors at the route level
 *
 * CRITICAL: Provides a graceful fallback when pages crash
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Route Error:', error)
    }

    // TODO: Log to error tracking service (Sentry, LogRocket, etc.)
    // Example: logErrorToService(error);
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full space-y-4 text-center">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-destructive">
            ¡Ups! Algo salió mal
          </h1>
          <p className="text-muted-foreground">
            Hemos encontrado un error inesperado. Por favor, intenta recargar la página.
          </p>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-md text-left">
            <p className="text-sm font-mono text-destructive mb-2">
              Error en desarrollo:
            </p>
            <p className="text-xs font-mono text-muted-foreground break-all">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-xs font-mono text-muted-foreground mt-2">
                Digest: {error.digest}
              </p>
            )}
          </div>
        )}

        <div className="flex gap-2 justify-center">
          <Button
            onClick={() => reset()}
            variant="outline"
          >
            Intentar de nuevo
          </Button>
          <Button
            onClick={() => window.location.href = '/dashboard'}
            variant="default"
          >
            Volver al inicio
          </Button>
        </div>
      </div>
    </div>
  )
}
