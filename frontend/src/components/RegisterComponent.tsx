'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/AuthContext"

export function RegisterCard() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const { register } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Validación básica
      if (!email || !password || !confirmPassword) {
        setError('Por favor, completa todos los campos')
        return
      }

      if (password !== confirmPassword) {
        setError('Las contraseñas no coinciden')
        return
      }

      // SECURITY: Password validation matching backend requirements
      if (password.length < 12) {
        setError('La contraseña debe tener al menos 12 caracteres')
        return
      }

      // Verificar que contenga mayúscula
      if (!/[A-Z]/.test(password)) {
        setError('La contraseña debe contener al menos una letra mayúscula')
        return
      }

      // Verificar que contenga minúscula
      if (!/[a-z]/.test(password)) {
        setError('La contraseña debe contener al menos una letra minúscula')
        return
      }

      // Verificar que contenga número
      if (!/[0-9]/.test(password)) {
        setError('La contraseña debe contener al menos un número')
        return
      }

      // Verificar que contenga carácter especial
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        setError('La contraseña debe contener al menos un carácter especial (!@#$%^&*...)')
        return
      }

      console.log('🔄 Iniciando proceso de registro con backend real...')

      // Usar el AuthContext que se conecta al backend real
      const result = await register({ email, password })

      if (result.success) {
        console.log('✅ Registro exitoso con backend real')

        // Redirigir al dashboard
        router.push('/dashboard')

      } else {
        setError(result.error || 'Error de registro')
      }

    } catch (err: unknown) {
      console.error('❌ Error en registro:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error inesperado durante el registro';
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Register</CardTitle>
        <CardDescription>
          Create a new account
        </CardDescription>
        <CardAction>
          <Link href="/login">Log In</Link>
        </CardAction>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-6">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
                {error}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creando cuenta...
                </div>
              ) : (
                'Crear Cuenta'
              )}
            </Button>
          </div>
        </form>

        {/* Información de desarrollo */}
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-800">
          <p className="font-medium mb-1">🔧 Conectado al backend real:</p>
          <p>• Tu cuenta se creará en el backend PostgreSQL</p>
          <p>• Usa un email válido y contraseña de al menos 6 caracteres</p>
        </div>
      </CardContent>
    </Card>
  )
}
