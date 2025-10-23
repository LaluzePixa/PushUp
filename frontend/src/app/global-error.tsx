'use client'

/**
 * Global Error Handler for Root Layout
 * This catches errors that occur in the root layout
 *
 * CRITICAL: Last resort error boundary - renders entire HTML structure
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{
            maxWidth: '32rem',
            width: '100%',
            textAlign: 'center'
          }}>
            <h1 style={{
              fontSize: '2.25rem',
              fontWeight: 'bold',
              color: '#DC2626',
              marginBottom: '1rem'
            }}>
              Error crítico del sistema
            </h1>
            <p style={{
              color: '#6B7280',
              marginBottom: '2rem'
            }}>
              Se ha producido un error grave. Por favor, recarga la página o contacta con soporte si el problema persiste.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
              <button
                onClick={() => reset()}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #D1D5DB',
                  borderRadius: '0.375rem',
                  backgroundColor: 'white',
                  cursor: 'pointer'
                }}
              >
                Intentar de nuevo
              </button>
              <button
                onClick={() => window.location.replace('/')}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#3B82F6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer'
                }}
              >
                Ir al inicio
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
