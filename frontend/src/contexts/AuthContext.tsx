'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService, User, LoginCredentials, RegisterData } from '@/services/api';

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
     */
    const refreshUser = async () => {
        try {
            console.log('🔄 Obteniendo datos del usuario del backend...');
            const response = await authService.getCurrentUser();
            if (response.user) {
                console.log('✅ Usuario autenticado:', response.user.email);
                setUser(response.user);
            } else {
                console.log('❌ Respuesta sin usuario, limpiando sesión');
                setUser(null);
                authService.logout();
            }
        } catch (error) {
            console.error('❌ Error refreshing user:', error);
            console.log('🗑️ Token inválido, limpiando sesión');
            setUser(null);
            authService.logout();
        }
    };

    /**
     * Inicializar autenticación al cargar la aplicación
     */
    useEffect(() => {
        const initializeAuth = async () => {
            setLoading(true);

            // Verificar si hay token almacenado
            const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

            console.log('🔄 Inicializando auth, token encontrado:', !!token);

            if (token) {
                console.log('🔍 Verificando token con backend...');
                await refreshUser();
            } else {
                console.log('❌ No hay token, usuario no autenticado');
            }

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
        } catch (error: any) {
            console.error('❌ Error en login:', error);
            return {
                success: false,
                error: error.message || 'Error al iniciar sesión'
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
        } catch (error: any) {
            console.error('Register error:', error);
            return {
                success: false,
                error: error.message || 'Error al registrarse'
            };
        } finally {
            setLoading(false);
        }
    };

    /**
     * Función de cierre de sesión
     */
    const logout = () => {
        authService.logout();
        setUser(null);

        // Limpiar también el sitio seleccionado del localStorage
        // para evitar que el siguiente usuario vea el sitio del usuario anterior
        if (typeof window !== 'undefined') {
            localStorage.removeItem('selectedSiteId');
            // Evitar problemas de chunks con navegación manual
            window.location.href = '/login';
        }
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

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            // Redirigir al login
            window.location.href = '/login';
        }
    }, [isAuthenticated, loading]);

    return { isAuthenticated, loading, user };
};

/**
 * Hook para requerir rol de administrador
 */
export const useRequireAdmin = () => {
    const { isAdmin, loading, user } = useAuth();

    useEffect(() => {
        if (!loading && !isAdmin) {
            // Redirigir al dashboard o mostrar error de permisos
            window.location.href = '/dashboard';
        }
    }, [isAdmin, loading]);

    return { isAdmin, loading, user };
};

export default AuthContext;