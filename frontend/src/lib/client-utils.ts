/**
 * Utility functions to safely handle client-side only operations
 * This helps prevent SSR/hydration issues and improves Fast Refresh
 */

// Safe window object access
export const safeWindow = typeof window !== 'undefined' ? window : undefined;

// Safe document access
export const safeDocument = typeof document !== 'undefined' ? document : undefined;

// Safe URL parameters access
export const getURLParams = (): URLSearchParams | null => {
    if (typeof window === 'undefined') return null;
    try {
        return new URLSearchParams(window.location.search);
    } catch {
        return null;
    }
};

// Safe redirect parameter extraction
export const getRedirectParam = (defaultPath = '/select-site'): string => {
    const params = getURLParams();
    return params?.get('redirect') || defaultPath;
};

// Safe window reload
export const safeReload = (): void => {
    if (typeof window !== 'undefined') {
        window.location.reload();
    }
};

// Safe window redirect
export const safeRedirect = (url: string): void => {
    if (typeof window !== 'undefined') {
        window.location.href = url;
    }
};

// Safe window replace
export const safeReplace = (url: string): void => {
    if (typeof window !== 'undefined') {
        window.location.replace(url);
    }
};

// Safe DOM element access
export const safeGetElement = (id: string): HTMLElement | null => {
    if (typeof document === 'undefined') return null;
    try {
        return document.getElementById(id);
    } catch {
        return null;
    }
};

// Safe DOM query selector
export const safeQuerySelector = (selector: string): HTMLElement | null => {
    if (typeof document === 'undefined') return null;
    try {
        return document.querySelector(selector);
    } catch {
        return null;
    }
};

// Safe DOM query selector all
export const safeQuerySelectorAll = (selector: string): NodeListOf<Element> | null => {
    if (typeof document === 'undefined') return null;
    try {
        return document.querySelectorAll(selector);
    } catch {
        return null;
    }
};

// Safe event listener management
export const safeAddEventListener = (
    element: Element | Window | Document | null,
    event: string,
    handler: EventListener,
    options?: boolean | AddEventListenerOptions
): (() => void) | null => {
    if (!element || typeof element.addEventListener !== 'function') return null;

    try {
        element.addEventListener(event, handler, options);
        return () => element.removeEventListener(event, handler, options);
    } catch {
        return null;
    }
};

// Safe cookie management
export const safeCookie = {
    set: (name: string, value: string, options: string = ''): void => {
        if (typeof document === 'undefined') return;
        try {
            document.cookie = `${name}=${value}${options ? `; ${options}` : ''}`;
        } catch {
            // Silently fail
        }
    },

    get: (name: string): string | null => {
        if (typeof document === 'undefined') return null;
        try {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) {
                return parts.pop()?.split(';').shift() || null;
            }
        } catch {
            // Silently fail
        }
        return null;
    }
};