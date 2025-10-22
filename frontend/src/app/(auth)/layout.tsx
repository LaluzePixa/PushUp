// app/(auth)/layout.tsx - Opción 2: Centrado Simple y Minimalista
export default function AuthLayout({
    children,
  }: {
    children: React.ReactNode
  }) {
    return (
      // Grid centrado - muy simple y efectivo
      <div className="min-h-screen  flex items-center justify-center p-6">
        {/* Contenedor del formulario */}
        <div className="w-full max-w-sm">
        
            {/* Logo/Título simple */}
            
            {/* Contenido del formulario */}
            {children}
          
        </div>
      </div>
    )
  }