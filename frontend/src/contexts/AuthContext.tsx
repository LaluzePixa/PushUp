'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { authService, User, LoginCredentials, RegisterData } from '@/services/api';
import { checkAuth } from '@/lib/auth';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
    register: (userData: RegisterData) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
    refreshUser: () => Promise<void>;
    isAuthenticated: boolean;
    isAdmin: boolean;
    isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    /**
     * Obtener información del usuario actual desde el backend
     * Ahora usa la nueva función de verificación segura
     */
    const refreshUser = async () => {
        try {
            console.log('🔄 Verificando sesión segura...');
            const authStatus = await checkAuth();

            if (authStatus.isAuthenticated && authStatus.user) {
                console.log('✅ Usuario autenticado:', authStatus.user.email);
                setUser(authStatus.user);
            } else {
                console.log('❌ No hay sesión válida');
                setUser(null);
            }
        } catch (error) {
            console.error('❌ Error refreshing user:', error);
            console.log('🗑️ Sesión inválida, limpiando estado');
            setUser(null);
        }
    };

    /**
     * Inicializar autenticación al cargar la aplicación
     * Ahora usa verificación de sesión segura sin tokens en localStorage
     */
    useEffect(() => {
        const initializeAuth = async () => {
            setLoading(true);

            console.log('🔄 Inicializando auth con verificación de sesión...');

            // Verificar sesión actual usando HTTP-only cookies
            await refreshUser();

            setLoading(false);
        };

        initializeAuth();
    }, []);

    /**
     * Función de inicio de sesión
     */
    const login = async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
        try {
            setLoading(true);
            console.log('🔄 Intentando login para:', credentials.email);

            const response = await authService.login(credentials);
            console.log('📡 Respuesta del backend:', {
                hasUser: !!response.user,
                hasToken: !!response.token,
                userEmail: response.user?.email
            });

            if (response.user && response.token) {
                console.log('✅ Login exitoso, estableciendo usuario');
                setUser(response.user);
                return { success: true };
            } else {
                console.log('❌ Login falló - respuesta incompleta');
                return { success: false, error: response.error?.message || 'Error de autenticación' };
            }
        } catch (error: unknown) {
            console.error('❌ Error en login:', error);
            const errorMessage = error instanceof Error ? error.message : 'Error al iniciar sesión';
            return {
                success: false,
                error: errorMessage
            };
        } finally {
            setLoading(false);
        }
    };    /**
     * Función de registro
     */
    const register = async (userData: RegisterData): Promise<{ success: boolean; error?: string }> => {
        try {
            setLoading(true);
            const response = await authService.register(userData);

            if (response.user && response.token) {
                setUser(response.user);
                return { success: true };
            } else {
                return { success: false, error: response.error?.message || 'Error de registro' };
            }
        } catch (error: unknown) {
            console.error('Register error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Error al registrarse';
            return {
                success: false,
                error: errorMessage
            };
        } finally {
            setLoading(false);
        }
    };

    /**
     * Función de cierre de sesión
     * Ahora usa navegación segura sin hard redirects
     */
    const logout = async () => {
        console.log('🚪 Cerrando sesión...');

        // Limpiar el estado del usuario primero
        setUser(null);

        try {
            // Llamar al endpoint de logout para limpiar la sesión del servidor
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });
        } catch (error) {
            console.error('Error during logout:', error);
        }

        // Limpiar datos del cliente solo si es necesario (legacy cleanup)
        if (typeof window !== 'undefined') {
            // Limpiar localStorage legacy data
            localStorage.removeItem('selectedSiteId');
            localStorage.removeItem('user-email');
            // Note: auth_token will be removed by server-side session management
        }

        console.log('✅ Sesión cerrada correctamente');
    };

    // Computed properties
    const isAuthenticated = !!user;
    const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
    const isSuperAdmin = user?.role === 'superadmin';

    const value: AuthContextType = {
        user,
        loading,
        login,
        register,
        logout,
        refreshUser,
        isAuthenticated,
        isAdmin,
        isSuperAdmin,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

/**
 * Hook personalizado para usar el contexto de autenticación
 */
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);

    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    return context;
};

/**
 * Hook para requerir autenticación
 * Redirige al login si el usuario no está autenticado
 */
export const useRequireAuth = () => {
    const { isAuthenticated, loading, user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            // Usar Next.js router para navegación SPA
            router.replace('/login');
        }
    }, [isAuthenticated, loading, router]);

    return { isAuthenticated, loading, user };
};

/**
 * Hook para requerir rol de administrador
 */
export const useRequireAdmin = () => {
    const { isAdmin, loading, user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !isAdmin) {
            // Usar Next.js router para navegación SPA
            router.replace('/dashboard');
        }
    }, [isAdmin, loading, router]);

    return { isAdmin, loading, user };
};

export default AuthContext;