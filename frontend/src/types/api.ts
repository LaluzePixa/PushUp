/**
 * API Types and Interfaces
 * Centralized type definitions for all API services
 */

/**
 * Base API Types
 */
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

/**
 * User Types
 */
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

/**
 * Site Types
 */
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

/**
 * Push Notification Types
 */
export interface PushSubscription {
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
    siteId?: number;
}

/**
 * Dashboard Types
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

export interface AnalyticsDataPoint {
    date: string;
    users?: number;
    subscriptions: number;
    campaigns: number;
}

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

export interface UserSegment {
    name: string;
    description: string;
    userCount: number;
    value: string;
}

export interface RecentCampaign {
    id: number;
    title: string;
    message: string;
    time: string;
    status: string;
    siteName: string;
    createdAt: string;
}

export interface Journey {
    id: string;
    name: string;
    dateCreated: string;
    status: "Draft" | "Active" | "Paused" | "Completed";
    stepsCount: number;
    completedExecutions: number;
    activeExecutions: number;
}

export interface MonitoringLocation {
    id: string;
    name: string;
    region: string;
    enabled: boolean;
    isActive: boolean;
    lastCheckAt?: string;
}

/**
 * Segment Types
 */

// Operadores disponibles para cada tipo de condición
export type StringOperator = 'equals' | 'notEquals' | 'contains' | 'notContains' | 'in' | 'notIn';
export type DateOperator = 'after' | 'before' | 'between';
export type NumericOperator = 'equals' | 'notEquals' | 'in' | 'notIn';

// Condiciones individuales por tipo
export interface UserAgentCondition {
    equals?: string;
    notEquals?: string;
    contains?: string;
    notContains?: string;
}

export interface DateCondition {
    after?: string;
    before?: string;
    between?: [string, string];
}

export interface NumericCondition {
    equals?: number;
    notEquals?: number;
    in?: number[];
    notIn?: number[];
}

export interface StringCondition {
    equals?: string;
    notEquals?: string;
    in?: string[];
    notIn?: string[];
}

// Condiciones del segmento (soporte completo de geo-targeting)
export interface SegmentConditions {
    userAgent?: UserAgentCondition;
    createdAt?: DateCondition;
    siteId?: NumericCondition;
    country?: StringCondition;
    state?: StringCondition;
    city?: StringCondition;
    [key: string]: unknown;
}

export interface Subscriber {
    id: number;
    endpoint: string;
    userAgent?: string;
    ipAddress?: string;
    siteId: number;
    country?: string;
    state?: string;
    city?: string;
    createdAt: string;
    updatedAt?: string;
}

export interface Segment {
    id: number;
    name: string;
    description?: string;
    siteId?: number;
    conditions: SegmentConditions;
    maxSize?: number; // Límite máximo de suscriptores (1-100000)
    materializedCount?: number; // Conteo cacheado de suscriptores
    lastMaterializedAt?: string; // Última actualización del conteo
    createdAt: string;
    updatedAt?: string;
}

export interface SegmentFormData {
    name: string;
    description?: string;
    siteId?: number;
    conditions: SegmentConditions;
    maxSize?: number; // Default 10000, max 100000
}

/**
 * Campaign Types
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
 * Opt-in Types
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
