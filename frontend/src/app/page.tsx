"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function OldPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirección inmediata
    router.push('/dashboard')
    
    // O con reemplazo (no guarda en historial)
    // router.replace('/dashboard')
    
    // O con delay
    // setTimeout(() => {
    //   router.push('/dashboard')
    // }, 2000) // 2 segundos
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>Redirigiendo...</p>
      </div>
    </div>
  )
}