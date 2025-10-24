'use client'

import { useState, useEffect, useCallback, DependencyList } from 'react'
import type { ApiResponse } from '@/services/api'

interface UseApiDataOptions {
  /**
   * Auto-fetch on mount
   * @default true
   */
  autoFetch?: boolean

  /**
   * Show console logs for debugging
   * @default false
   */
  debug?: boolean

  /**
   * Callback on success
   */
  onSuccess?: (data: unknown) => void

  /**
   * Callback on error
   */
  onError?: (error: Error) => void
}

interface UseApiDataReturn<T> {
  /** The fetched data */
  data: T | null

  /** Loading state */
  loading: boolean

  /** Error message if fetch failed */
  error: string | null

  /** Manually trigger a refetch */
  refetch: () => Promise<void>

  /** Clear error */
  clearError: () => void

  /** Reset to initial state */
  reset: () => void
}

/**
 * Custom hook for fetching data from API
 *
 * BENEFITS:
 * - Eliminates code duplication (same pattern used 10+ times)
 * - Centralized error handling
 * - Consistent loading states
 * - Easy refetch mechanism
 *
 * @example Basic usage
 * ```tsx
 * const { data, loading, error, refetch } = useApiData(
 *   () => sitesService.getSites(),
 *   [selectedSite?.id]
 * )
 *
 * if (loading) return <LoadingSpinner />
 * if (error) return <ErrorMessage message={error} onRetry={refetch} />
 * return <SitesList sites={data} />
 * ```
 *
 * @example With options
 * ```tsx
 * const { data, loading, refetch } = useApiData(
 *   () => campaignsService.getCampaigns(),
 *   [],
 *   {
 *     autoFetch: false, // Don't fetch on mount
 *     debug: true, // Show console logs
 *     onSuccess: (data) => toast.success('Loaded!'),
 *     onError: (error) => toast.error(error.message)
 *   }
 * )
 * ```
 */
export function useApiData<T>(
  fetcher: () => Promise<ApiResponse<T>>,
  dependencies: DependencyList = [],
  options: UseApiDataOptions = {}
): UseApiDataReturn<T> {
  const {
    autoFetch = true,
    debug = false,
    onSuccess,
    onError,
  } = options

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(autoFetch)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      if (debug) console.log('[useApiData] Fetching data...')

      const response = await fetcher()

      if (response.success && response.data) {
        setData(response.data)
        if (debug) console.log('[useApiData] Data fetched:', response.data)
        onSuccess?.(response.data)
      } else {
        const errorMsg = response.error?.message || response.message || 'Error desconocido'
        setError(errorMsg)
        if (debug) console.error('[useApiData] Error:', errorMsg)
        onError?.(new Error(errorMsg))
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error de conexión'
      setError(errorMsg)
      if (debug) console.error('[useApiData] Exception:', err)
      onError?.(err instanceof Error ? err : new Error(String(err)))
    } finally {
      setLoading(false)
    }
  }, [fetcher, debug, onSuccess, onError])

  useEffect(() => {
    if (autoFetch) {
      fetchData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchData, autoFetch, ...dependencies])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setLoading(false)
  }, [])

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    clearError,
    reset,
  }
}

/**
 * Hook for paginated data
 *
 * @example
 * ```tsx
 * const {
 *   data,
 *   loading,
 *   error,
 *   page,
 *   totalPages,
 *   nextPage,
 *   prevPage,
 *   goToPage
 * } = usePaginatedApiData(
 *   (page, limit) => usersService.getUsers(page, limit),
 *   10 // items per page
 * )
 * ```
 */
export function usePaginatedApiData<T>(
  fetcher: (page: number, limit: number) => Promise<ApiResponse<T & { pagination?: { totalPages?: number } }>>,
  itemsPerPage: number = 10
) {
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const { data, loading, error, refetch } = useApiData(
    () => fetcher(page, itemsPerPage),
    [page, itemsPerPage]
  )

  // Update total pages when data changes
  useEffect(() => {
    if (data && typeof data === 'object' && 'pagination' in data && data.pagination) {
      setTotalPages(data.pagination.totalPages || 1)
    }
  }, [data])

  const nextPage = useCallback(() => {
    if (page < totalPages) {
      setPage(p => p + 1)
    }
  }, [page, totalPages])

  const prevPage = useCallback(() => {
    if (page > 1) {
      setPage(p => p - 1)
    }
  }, [page])

  const goToPage = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage)
    }
  }, [totalPages])

  return {
    data,
    loading,
    error,
    page,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
    nextPage,
    prevPage,
    goToPage,
    refetch,
  }
}
