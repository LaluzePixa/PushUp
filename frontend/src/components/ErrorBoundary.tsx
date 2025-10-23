'use client'

import React, { ReactNode } from 'react'
import { Button } from '@/components/ui/button'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI
 *
 * CRITICAL: This prevents the entire app from crashing when a component errors
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null
    }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error Boundary caught an error:', error)
      console.error('Error Info:', errorInfo)
    }

    // TODO: Log to error tracking service (Sentry, LogRocket, etc.)
    // Example: logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null
    })
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default fallback UI
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

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-md text-left">
                <p className="text-sm font-mono text-destructive mb-2">
                  Error en desarrollo:
                </p>
                <p className="text-xs font-mono text-muted-foreground break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex gap-2 justify-center">
              <Button
                onClick={this.handleReset}
                variant="outline"
              >
                Intentar de nuevo
              </Button>
              <Button
                onClick={() => window.location.replace('/dashboard')}
                variant="default"
              >
                Volver al inicio
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
