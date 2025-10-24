/**
 * API Service para PushSaaS
 * Maneja todas las comunicaciones con el backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface ApiError extends Error {
    status?: number;
    code?: string;
    details?: unknown;
}

export interface PaginationData {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

export interface ApiResponse<T = unknown> {
    success?: boolean;
    message?: string;
    token?: string;
    user?: User;
    data?: T;
    error?: {
        code: string;
        message: string;
    };
}

export interface User {
    id: number;
    email: string;
    role: 'user' | 'admin' | 'superadmin';
    isActive: boolean;
    createdAt: string;
    updatedAt?: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    email: string;
    password: string;
    role?: 'user' | 'admin' | 'superadmin';
}

export interface Site {
    id: number;
    name: string;
    domain: string;
    description?: string;
    isActive: boolean;
    subscribersCount: number;
    campaignsCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface PushSubscription {
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
    siteId?: number;
}

/**
 * Utilitades para manejo de tokens
 */
export const tokenUtils = {
    get: () => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('auth_token');
        }
        return null;
    },

    set: (token: string) => {
        if (typeof window !== 'undefined') {
            // Guardar en localStorage
            localStorage.setItem('auth_token', token);

            // También guardar en cookie para el middleware
            const expires = new Date();
            expires.setTime(expires.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 días

            const cookieString = [
                `auth-token=${token}`,
                `expires=${expires.toUTCString()}`,
                `path=/`,
                `SameSite=Lax`
            ].join(';');

            document.cookie = cookieString;
            console.log('🍪 Token guardado en cookie y localStorage:', token.substring(0, 20) + '...');
        }
    },

    remove: () => {
        if (typeof window !== 'undefined') {
            // Eliminar de localStorage
            localStorage.removeItem('auth_token');

            // Eliminar cookie
            document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            console.log('🗑️ Token eliminado de cookie y localStorage');
        }
    }
};

/**
 * Cliente HTTP base con configuración de autenticación
 */
class ApiClient {
    private baseURL: string;

    constructor(baseURL: string) {
        this.baseURL = baseURL;
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
        const url = `${this.baseURL}${endpoint}`;
        const token = tokenUtils.get();

        const defaultHeaders: HeadersInit = {
            'Content-Type': 'application/json',
        };

        if (token) {
            defaultHeaders.Authorization = `Bearer ${token}`;
        }

        const config: RequestInit = {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers,
            },
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                // Crear error con información completa
                const errorMessage = data.error || data.message || `HTTP ${response.status}`;
                const errorCode = data.code || 'UNKNOWN_ERROR';

                const error = new Error(errorMessage);
                (error as ApiError).status = response.status;
                (error as ApiError).code = errorCode;
                (error as ApiError).details = data.details || null;

                throw error;
            }

            return data;
        } catch (error) {
            console.error(`API Error [${endpoint}]:`, error);
            throw error;
        }
    }

    async get<T>(endpoint: string): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, { method: 'GET' });
    }

    async post<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async put<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, { method: 'DELETE' });
    }

    /**
     * Método para llamadas públicas (sin autenticación)
     */
    async publicGet<T>(endpoint: string): Promise<ApiResponse<T>> {
        const url = `${this.baseURL}${endpoint}`;

        const config: RequestInit = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        };

        try {
            console.log(`[publicGet] Llamando a: ${url}`);
            const response = await fetch(url, config);
            console.log(`[publicGet] Status: ${response.status}, OK: ${response.ok}`);

            const data = await response.json();
            console.log(`[publicGet] Data recibida:`, data);

            if (!response.ok) {
                const errorMessage = data.error || data.message || `HTTP ${response.status}`;
                const errorCode = data.code || 'UNKNOWN_ERROR';

                const error = new Error(errorMessage);
                (error as ApiError).status = response.status;
                (error as ApiError).code = errorCode;
                (error as ApiError).details = data.details || null;

                console.error(`[publicGet] Error response:`, error);
                throw error;
            }

            return data;
        } catch (error) {
            console.error(`[publicGet] API Error [${endpoint}]:`, error);
            throw error;
        }
    }
}

const apiClient = new ApiClient(API_BASE_URL);

/**
 * Servicios de Autenticación
 */
export const authService = {
    /**
     * Iniciar sesión
     */
    async login(credentials: LoginCredentials): Promise<ApiResponse> {
        const response = await apiClient.post('/auth/login', credentials);

        if (response.token) {
            tokenUtils.set(response.token);
        }

        return response;
    },

    /**
     * Registrar nuevo usuario
     */
    async register(userData: RegisterData): Promise<ApiResponse> {
        const response = await apiClient.post('/auth/register', userData);

        if (response.token) {
            tokenUtils.set(response.token);
        }

        return response;
    },

    /**
     * Obtener información del usuario actual
     */
    async getCurrentUser(): Promise<ApiResponse<User>> {
        return apiClient.get('/auth/me');
    },

    /**
     * Cambiar contraseña
     */
    async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse> {
        return apiClient.post('/auth/change-password', {
            currentPassword,
            newPassword
        });
    },

    /**
     * Cerrar sesión
     */
    logout(): void {
        tokenUtils.remove();
    }
};

/**
 * Servicios de Sitios
 */
export const sitesService = {
    /**
     * Listar sitios del usuario
     */
    async getSites(params?: {
        page?: number;
        limit?: number;
        search?: string;
        isActive?: boolean;
    }): Promise<ApiResponse<{ sites: Site[]; pagination: PaginationData }>> {
        const searchParams = new URLSearchParams();

        if (params?.page) searchParams.append('page', params.page.toString());
        if (params?.limit) searchParams.append('limit', params.limit.toString());
        if (params?.search) searchParams.append('search', params.search);
        if (params?.isActive !== undefined) searchParams.append('isActive', params.isActive.toString());

        const endpoint = `/sites${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
        return apiClient.get(endpoint);
    },

    /**
     * Crear nuevo sitio
     */
    async createSite(siteData: {
        name: string;
        domain: string;
        description?: string;
    }): Promise<ApiResponse<Site>> {
        return apiClient.post('/sites', siteData);
    },

    /**
     * Obtener sitio específico
     */
    async getSite(id: number): Promise<ApiResponse<Site>> {
        return apiClient.get(`/sites/${id}`);
    },

    /**
     * Actualizar sitio
     */
    async updateSite(id: number, siteData: Partial<Site>): Promise<ApiResponse<Site>> {
        return apiClient.put(`/sites/${id}`, siteData);
    },

    /**
     * Eliminar sitio
     */
    async deleteSite(id: number): Promise<ApiResponse> {
        return apiClient.delete(`/sites/${id}`);
    }
};

/**
 * Servicios de Notificaciones Push
 */
export const pushService = {
    /**
     * Obtener clave pública VAPID (público, sin autenticación)
     */
    async getVapidPublicKey(): Promise<ApiResponse<{ publicKey: string }>> {
        return apiClient.publicGet('/vapid-public-key');
    },

    /**
     * Suscribir dispositivo a notificaciones push
     */
    async subscribe(subscription: PushSubscription): Promise<ApiResponse<{ id: number }>> {
        return apiClient.post('/subscribe', subscription);
    },

    /**
     * Enviar notificación push (solo admins)
     */
    async sendNotification(params: {
        title?: string;
        body?: string;
        url?: string;
        endpoint?: string;
        siteId?: number;
        userId?: number;
    }): Promise<ApiResponse<{
        sent: number;
        removed: number;
        errors: number;
        total: number;
    }>> {
        return apiClient.post('/send', params);
    }
};

/**
 * Servicios de Usuarios (solo para admins)
 */
export const usersService = {
    /**
     * Listar usuarios
     */
    async getUsers(params?: {
        page?: number;
        limit?: number;
        role?: string;
        search?: string;
        isActive?: boolean;
    }): Promise<ApiResponse<{ users: User[]; pagination: PaginationData }>> {
        const searchParams = new URLSearchParams();

        if (params?.page) searchParams.append('page', params.page.toString());
        if (params?.limit) searchParams.append('limit', params.limit.toString());
        if (params?.role) searchParams.append('role', params.role);
        if (params?.search) searchParams.append('search', params.search);
        if (params?.isActive !== undefined) searchParams.append('isActive', params.isActive.toString());

        const endpoint = `/users${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
        return apiClient.get(endpoint);
    },

    /**
     * Obtener usuario específico
     */
    async getUser(id: number): Promise<ApiResponse<User>> {
        return apiClient.get(`/users/${id}`);
    },

    /**
     * Actualizar usuario
     */
    async updateUser(id: number, userData: Partial<User>): Promise<ApiResponse<User>> {
        return apiClient.put(`/users/${id}`, userData);
    },

    /**
     * Eliminar usuario
     */
    async deleteUser(id: number): Promise<ApiResponse> {
        return apiClient.delete(`/users/${id}`);
    }
};

/**
 * Interface para métricas del dashboard
 */
export interface DashboardMetric {
    title: string;
    description: string;
    data: string | number | null;
    hasData: boolean;
}

export interface DashboardMetrics {
    [key: string]: DashboardMetric;
}

/**
 * Interface para datos analíticos
 */
export interface AnalyticsDataPoint {
    date: string;
    users?: number;
    subscriptions: number;
    campaigns: number;
}

/**
 * Interface para suscripciones
 */
export interface Subscription {
    id: number;
    date: string;
    siteName: string;
    siteDomain: string;
    ipAddress: string;
    browser: string;
    os: string;
    device: string;
    country: string;
}

/**
 * Interface para segmentos de usuarios (dashboard)
 */
export interface UserSegment {
    name: string;
    description: string;
    userCount: number;
    value: string;
}

/**
 * Interface para condiciones de segmento
 */
export interface SegmentConditions {
    userAgent?: {
        contains?: string;
        notContains?: string;
    };
    createdAt?: {
        after?: string;
        before?: string;
    };
    siteId?: {
        equals?: number;
        in?: number[];
    };
    [key: string]: unknown;
}

/**
 * Interface para suscriptores
 */
export interface Subscriber {
    id: number;
    endpoint: string;
    userAgent?: string;
    ipAddress?: string;
    siteId: number;
    createdAt: string;
    updatedAt?: string;
}

/**
 * Interface completa para segmentos
 */
export interface Segment {
    id: number;
    name: string;
    description?: string;
    siteId?: number;
    conditions: SegmentConditions;
    createdAt: string;
    updatedAt?: string;
}

/**
 * Interface para crear/actualizar segmentos
 */
export interface SegmentFormData {
    name: string;
    description?: string;
    siteId?: number;
    conditions: SegmentConditions;
}

/**
 * Interface para campañas recientes
 */
export interface RecentCampaign {
    id: number;
    title: string;
    message: string;
    time: string;
    status: string;
    siteName: string;
    createdAt: string;
}

/**
 * Interface para campañas completas
 */
export interface Campaign {
    id: string;
    name: string;
    dateCreated: string;
    status: "Error" | "Success" | "Pending" | "Scheduled";
    totalAttempts: number;
    successfullySent: number;
    failedToSend: number | string;
    delivered: number;
    clicked: number;
    closed: number;
    ctr: number;
    message?: string;
    scheduledAt?: string;
    sentAt?: string;
}

/**
 * Interface para journeys
 */
export interface Journey {
    id: string;
    name: string;
    dateCreated: string;
    status: "Draft" | "Active" | "Paused" | "Completed";
    stepsCount: number;
    completedExecutions: number;
    activeExecutions: number;
}

/**
 * Interface para ubicaciones de monitoreo
 */
export interface MonitoringLocation {
    id: string;
    name: string;
    region: string;
    enabled: boolean;
    isActive: boolean;
    lastCheckAt?: string;
}

/**
 * Servicios de Dashboard
 */
export const dashboardService = {
    /**
     * Obtener métricas del dashboard
     */
    async getMetrics(siteId?: number): Promise<ApiResponse<DashboardMetrics>> {
        const params = siteId ? `?siteId=${siteId}` : '';
        return apiClient.get(`/dashboard/metrics${params}`);
    },

    /**
     * Obtener datos analíticos para gráficos
     */
    async getAnalytics(period: number = 30, siteId?: number): Promise<ApiResponse<AnalyticsDataPoint[]>> {
        const params = new URLSearchParams();
        params.append('period', period.toString());
        if (siteId) params.append('siteId', siteId.toString());
        return apiClient.get(`/dashboard/analytics?${params.toString()}`);
    },

    /**
     * Obtener suscripciones recientes
     */
    async getSubscriptions(limit: number = 10, page: number = 1, siteId?: number): Promise<ApiResponse<Subscription[]>> {
        const params = new URLSearchParams();
        params.append('limit', limit.toString());
        params.append('page', page.toString());
        if (siteId) params.append('siteId', siteId.toString());
        return apiClient.get(`/dashboard/subscriptions?${params.toString()}`);
    },

    /**
     * Obtener segmentos de usuarios disponibles
     */
    async getSegments(): Promise<ApiResponse<UserSegment[]>> {
        return apiClient.get('/dashboard/segments');
    },

    /**
     * Crear un nuevo segmento
     */
    async createSegment(segmentData: {
        name: string;
        description?: string;
        siteId?: number;
        conditions: SegmentConditions;
    }): Promise<ApiResponse<Segment>> {
        return apiClient.post('/segments', segmentData);
    },

    /**
     * Actualizar un segmento existente
     */
    async updateSegment(segmentId: number, segmentData: {
        name?: string;
        description?: string;
        conditions?: SegmentConditions;
    }): Promise<ApiResponse<Segment>> {
        return apiClient.put(`/segments/${segmentId}`, segmentData);
    },

    /**
     * Eliminar un segmento
     */
    async deleteSegment(segmentId: number): Promise<ApiResponse<void>> {
        return apiClient.delete(`/segments/${segmentId}`);
    },

    /**
     * Obtener detalles de un segmento específico
     */
    async getSegmentById(segmentId: number): Promise<ApiResponse<Segment>> {
        return apiClient.get(`/segments/${segmentId}`);
    },

    /**
     * Obtener todos los segmentos con paginación
     */
    async getAllSegments(options?: {
        page?: number;
        limit?: number;
        siteId?: number;
        search?: string;
    }): Promise<ApiResponse<{
        segments: Segment[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
        };
    }>> {
        const params = new URLSearchParams();

        if (options?.page) params.append('page', options.page.toString());
        if (options?.limit) params.append('limit', options.limit.toString());
        if (options?.siteId) params.append('siteId', options.siteId.toString());
        if (options?.search) params.append('search', options.search);

        const queryString = params.toString();
        const url = queryString ? `/segments?${queryString}` : '/segments';

        return apiClient.get(url);
    },

    /**
     * Obtener campañas recientes para preview
     */
    async getRecentCampaigns(limit: number = 5, siteId?: number): Promise<ApiResponse<RecentCampaign[]>> {
        const params = new URLSearchParams();
        params.append('limit', limit.toString());
        if (siteId) params.append('siteId', siteId.toString());
        return apiClient.get(`/dashboard/recent-campaigns?${params.toString()}`);
    },

    /**
     * Obtener journeys del usuario
     */
    async getJourneys(options?: {
        page?: number;
        limit?: number;
        status?: string;
        search?: string;
    }): Promise<ApiResponse<{
        journeys: Journey[];
        pagination: {
            current: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>> {
        const params = new URLSearchParams();

        if (options?.page) params.append('page', options.page.toString());
        if (options?.limit) params.append('limit', options.limit.toString());
        if (options?.status) params.append('status', options.status);
        if (options?.search) params.append('search', options.search);

        const queryString = params.toString();
        const url = queryString ? `/dashboard/journeys?${queryString}` : '/dashboard/journeys';

        return apiClient.get(url);
    },

    /**
     * Obtener ubicaciones de monitoreo
     */
    async getMonitoringLocations(): Promise<ApiResponse<{
        locations: MonitoringLocation[];
        total: number;
        enabled: number;
    }>> {
        return apiClient.get('/dashboard/monitoring-locations');
    }
};

/**
 * Interface para crear/actualizar campañas
 */
export interface CampaignFormData {
    name: string;
    title: string;
    body: string;
    iconUrl?: string;
    imageUrl?: string;
    clickUrl?: string;
    badgeUrl?: string;
    siteId?: number;
    sendType: 'immediate' | 'scheduled' | 'draft';
    scheduledAt?: string;
    segmentId?: number;
}

/**
 * Servicios de Campañas
 */
export const campaignsService = {
    /**
     * Obtener lista de campañas
     */
    async getCampaigns(options?: {
        page?: number;
        limit?: number;
        status?: string;
        search?: string;
        siteId?: number;
    }): Promise<ApiResponse<{
        campaigns: Campaign[];
        pagination: {
            current: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>> {
        const params = new URLSearchParams();

        if (options?.page) params.append('page', options.page.toString());
        if (options?.limit) params.append('limit', options.limit.toString());
        if (options?.status) params.append('status', options.status);
        if (options?.search) params.append('search', options.search);
        if (options?.siteId) params.append('siteId', options.siteId.toString());

        const queryString = params.toString();
        const url = queryString ? `/campaigns?${queryString}` : '/campaigns';

        return apiClient.get(url);
    },

    /**
     * Crear nueva campaña
     */
    async createCampaign(data: CampaignFormData): Promise<ApiResponse<Campaign>> {
        return apiClient.post('/campaigns', data);
    },

    /**
     * Obtener una campaña por ID
     */
    async getCampaign(id: string | number): Promise<ApiResponse<Campaign>> {
        return apiClient.get(`/campaigns/${id}`);
    },

    /**
     * Actualizar una campaña existente
     */
    async updateCampaign(id: string | number, data: Partial<CampaignFormData>): Promise<ApiResponse<Campaign>> {
        return apiClient.put(`/campaigns/${id}`, data);
    },

    /**
     * Eliminar una campaña
     */
    async deleteCampaign(id: string | number): Promise<ApiResponse<void>> {
        return apiClient.delete(`/campaigns/${id}`);
    },

    /**
     * Pausar una campaña programada
     */
    async pauseCampaign(id: string | number): Promise<ApiResponse<Campaign>> {
        return apiClient.post(`/campaigns/${id}/pause`);
    },

    /**
     * Reanudar una campaña pausada
     */
    async resumeCampaign(id: string | number): Promise<ApiResponse<Campaign>> {
        return apiClient.post(`/campaigns/${id}/resume`);
    },

    /**
     * Enviar una campaña inmediatamente
     */
    async sendCampaign(id: string | number): Promise<ApiResponse<{
        sent: number;
        errors: number;
        total: number;
    }>> {
        return apiClient.post(`/campaigns/${id}/send`);
    }
};

/**
 * Utilidad para verificar conectividad con el backend
 */
export const healthCheck = async (): Promise<boolean> => {
    try {
        const response = await fetch(`${API_BASE_URL}/healthz`);
        return response.ok;
    } catch (error) {
        console.error('Health check failed:', error);
        return false;
    }
};

export default apiClient;

/**
 * Servicio específico para gestión de segmentos
 */
export const segmentsService = {
    /**
     * Listar todos los segmentos con filtros
     */
    async list(options?: {
        page?: number;
        limit?: number;
        siteId?: number;
        search?: string;
    }): Promise<ApiResponse<{
        segments: Segment[];
        pagination: PaginationData;
    }>> {
        const params = new URLSearchParams();

        if (options?.page) params.append('page', options.page.toString());
        if (options?.limit) params.append('limit', options.limit.toString());
        if (options?.siteId) params.append('siteId', options.siteId.toString());
        if (options?.search) params.append('search', options.search);

        const queryString = params.toString();
        const url = queryString ? `/segments?${queryString}` : '/segments';

        return apiClient.get(url);
    },

    /**
     * Obtener un segmento por ID
     */
    async getById(id: number): Promise<ApiResponse<Segment>> {
        return apiClient.get(`/segments/${id}`);
    },

    /**
     * Crear un nuevo segmento
     */
    async create(data: SegmentFormData): Promise<ApiResponse<Segment>> {
        return apiClient.post('/segments', data);
    },

    /**
     * Actualizar un segmento existente
     */
    async update(id: number, data: Partial<SegmentFormData>): Promise<ApiResponse<Segment>> {
        return apiClient.put(`/segments/${id}`, data);
    },

    /**
     * Eliminar un segmento
     */
    async delete(id: number): Promise<ApiResponse<void>> {
        return apiClient.delete(`/segments/${id}`);
    },

    /**
     * Obtener suscriptores que coinciden con un segmento
     */
    async getSubscribers(id: number, options?: {
        page?: number;
        limit?: number;
    }): Promise<ApiResponse<{
        subscribers: Subscriber[];
        pagination: PaginationData;
    }>> {
        const params = new URLSearchParams();

        if (options?.page) params.append('page', options.page.toString());
        if (options?.limit) params.append('limit', options.limit.toString());

        const queryString = params.toString();
        const url = queryString ? `/segments/${id}/subscribers?${queryString}` : `/segments/${id}/subscribers`;

        return apiClient.get(url);
    }
};

/**
 * Interface para configuraciones de opt-in prompts
 */
export interface OptinConfig {
    id?: number;
    siteId?: number;
    userId?: number;
    type: 'lightbox1' | 'lightbox2' | 'bellIcon';
    whenToShow: 'Show Immediately' | 'After 5 seconds' | 'On exit intent';
    animation: string;
    backgroundColor: string;
    headline: string;
    headlineEnabled: boolean;
    text: string;
    textEnabled: boolean;
    cancelButton: string;
    cancelBgColor: string;
    cancelTextColor: string;
    approveButton: string;
    approveBgColor: string;
    approveTextColor: string;
    rePromptDelay: string;
    isActive?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

/**
 * Interface para crear/actualizar configuraciones de opt-in
 */
export interface OptinConfigFormData {
    siteId?: number;
    type: 'lightbox1' | 'lightbox2' | 'bellIcon';
    whenToShow: 'Show Immediately' | 'After 5 seconds' | 'On exit intent';
    animation: string;
    backgroundColor: string;
    headline: string;
    headlineEnabled: boolean;
    text: string;
    textEnabled: boolean;
    cancelButton: string;
    cancelBgColor: string;
    cancelTextColor: string;
    approveButton: string;
    approveBgColor: string;
    approveTextColor: string;
    rePromptDelay: string;
}

/**
 * Servicios de Opt-in Prompts
 */
export const optinsService = {
    /**
     * Obtener configuración de opt-in prompt
     */
    async getConfig(siteId?: number): Promise<ApiResponse<OptinConfig>> {
        const params = new URLSearchParams();
        if (siteId) params.append('siteId', siteId.toString());

        const queryString = params.toString();
        const url = queryString ? `/optins?${queryString}` : '/optins';

        return apiClient.get(url);
    },

    /**
     * Guardar configuración de opt-in prompt
     */
    async saveConfig(data: OptinConfigFormData): Promise<ApiResponse<OptinConfig>> {
        return apiClient.post('/optins', data);
    },

    /**
     * Obtener configuración específica por ID
     */
    async getConfigById(id: number): Promise<ApiResponse<OptinConfig>> {
        return apiClient.get(`/optins/${id}`);
    },

    /**
     * Actualizar configuración de opt-in prompt
     */
    async updateConfig(id: number, data: Partial<OptinConfigFormData>): Promise<ApiResponse<OptinConfig>> {
        return apiClient.put(`/optins/${id}`, data);
    },

    /**
     * Eliminar configuración de opt-in prompt
     */
    async deleteConfig(id: number): Promise<ApiResponse<void>> {
        return apiClient.delete(`/optins/${id}`);
    },

    /**
     * Generar código de integración
     */
    async generateCode(id: number, format: 'javascript' | 'html' | 'react' = 'javascript', siteId?: number): Promise<ApiResponse<{
        code: string;
        format: string;
        config: OptinConfig;
    }>> {
        const params = new URLSearchParams();
        params.append('format', format);
        if (siteId) params.append('siteId', siteId.toString());

        const queryString = params.toString();
        return apiClient.get(`/optins/${id}/code?${queryString}`);
    }
};
