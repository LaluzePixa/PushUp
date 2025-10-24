'use client'

import * as React from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import {
    ChevronDown,
    User,
    Settings,
    LogOut,
    UserCircle,
} from "lucide-react"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

// Componente del dropdown de usuario
export function UserDropdown({ user }: { user: { name: string; email?: string } }) {
    const { logout } = useAuth()
    const router = useRouter()

    const handleLogout = () => {
        console.log('🚪 Cerrando sesión...')
        // Usar el método del AuthContext que maneja toda la limpieza
        logout()
        console.log('✅ Sesión cerrada correctamente')
        // Navigate using Next.js router after logout
        router.push('/login')
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 p-2 h-auto hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                    <UserCircle className="h-5 w-5 text-purple-400" />
                    <div className="flex flex-col items-start">
                        <span className="text-xs font-medium">{user.name}</span>
                        {user.email && (
                            <span className="text-xs text-muted-foreground">{user.email}</span>
                        )}
                    </div>
                    <ChevronDown className="h-4 w-4 ml-auto" />
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Perfil</span>
                </DropdownMenuItem>

                <DropdownMenuItem className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Configuración</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                    onClick={handleLogout}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar Sesión</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}