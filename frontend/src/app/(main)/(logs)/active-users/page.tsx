'use client'

import { useState, useEffect } from 'react'
import InfoCard from "@/components/InfoCard"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Users, Globe, Building2, TrendingUp } from 'lucide-react'
import apiClient from '@/services/api-client'
import { useSiteContext } from '@/contexts/SiteContext'

interface ActiveUser {
    id: number
    endpoint: string
    user_agent: string
    ip: string
    country: string | null
    state: string | null
    city: string | null
    created_at: string
    updated_at: string
    site_id: number
    site_name: string
    site_domain: string
}

interface ActiveUsersStats {
    totalUsers: number
    countriesCount: number
    sitesCount: number
    newLast7Days: number
    newLast30Days: number
}

interface CountryData {
    country: string
    count: number
}

interface DeviceData {
    device_type: string
    count: number
}

interface Pagination {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
}

interface ActiveUsersResponse {
    success: boolean
    data: {
        users: ActiveUser[]
        stats: ActiveUsersStats
        topCountries: CountryData[]
        topDevices: DeviceData[]
        pagination: Pagination
    }
}

interface Site {
    id: number
    name: string
    domain: string
}

export default function Page() {
    const { selectedSite } = useSiteContext()
    const [users, setUsers] = useState<ActiveUser[]>([])
    const [stats, setStats] = useState<ActiveUsersStats | null>(null)
    const [topCountries, setTopCountries] = useState<CountryData[]>([])
    const [topDevices, setTopDevices] = useState<DeviceData[]>([])
    const [pagination, setPagination] = useState<Pagination | null>(null)

    const [page, setPage] = useState(1)
    const [country, setCountry] = useState<string>('')
    const [search, setSearch] = useState<string>('')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (selectedSite) {
            loadActiveUsers()
        }
    }, [page, country, search, selectedSite])

    const loadActiveUsers = async () => {
        if (!selectedSite) return

        setLoading(true)
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '50',
                siteId: selectedSite.id.toString()
            })

            if (country) params.append('country', country)
            if (search) params.append('search', search)

            const response = await apiClient.get<ActiveUsersResponse>(
                `/dashboard/active-users?${params}`
            )

            if (response?.success && response.data) {
                setUsers(response.data.users)
                setStats(response.data.stats)
                setTopCountries(response.data.topCountries)
                setTopDevices(response.data.topDevices)
                setPagination(response.data.pagination)
            }
        } catch (error) {
            console.error('Error loading active users:', error)
        } finally {
            setLoading(false)
        }
    }

    const getDeviceType = (userAgent: string): string => {
        const ua = userAgent.toLowerCase()
        if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
            return 'Mobile'
        }
        if (ua.includes('tablet') || ua.includes('ipad')) {
            return 'Tablet'
        }
        return 'Desktop'
    }

    const getOS = (userAgent: string): string => {
        const ua = userAgent.toLowerCase()
        if (ua.includes('windows')) return 'Windows'
        if (ua.includes('mac os')) return 'macOS'
        if (ua.includes('linux')) return 'Linux'
        if (ua.includes('android')) return 'Android'
        if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) return 'iOS'
        return 'Unknown'
    }

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <div className="space-y-6">
            <div className="mb-6">
                <InfoCard
                    title="Active Users"
                    description="Active Users are website visitors who have approved (opted in) to receive push notifications from you and have not unsubscribed yet. We save various attributes for each user once they opt-in - such as their location, operating system, device type, etc."
                />
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Countries</CardTitle>
                            <Globe className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.countriesCount}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Sites</CardTitle>
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.sitesCount}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">New (Last 7 Days)</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.newLast7Days.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">
                                {stats.newLast30Days.toLocaleString()} in last 30 days
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Top Countries & Devices */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Top Countries</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {topCountries.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No data available</p>
                            ) : (
                                topCountries.map((item, index) => (
                                    <div key={index} className="flex justify-between items-center">
                                        <span className="text-sm">{item.country || 'Unknown'}</span>
                                        <span className="text-sm font-semibold">{item.count.toLocaleString()}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Device Types</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {topDevices.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No data available</p>
                            ) : (
                                topDevices.map((item, index) => (
                                    <div key={index} className="flex justify-between items-center">
                                        <span className="text-sm">{item.device_type}</span>
                                        <span className="text-sm font-semibold">{item.count.toLocaleString()}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">Country</label>
                            <Input
                                placeholder="Filter by country..."
                                value={country}
                                onChange={(e) => { setCountry(e.target.value); setPage(1) }}
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-2 block">Search</label>
                            <Input
                                placeholder="Search endpoint or user agent..."
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Users Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Active Users ({pagination?.total.toLocaleString() || 0})</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8">Loading...</div>
                    ) : users.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">No users found</div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Site</TableHead>
                                        <TableHead>Location</TableHead>
                                        <TableHead>Device</TableHead>
                                        <TableHead>OS</TableHead>
                                        <TableHead>Created</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">{user.site_name}</div>
                                                    <div className="text-xs text-muted-foreground">{user.site_domain}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">
                                                    {[user.city, user.state, user.country]
                                                        .filter(Boolean)
                                                        .join(', ') || 'Unknown'}
                                                </div>
                                            </TableCell>
                                            <TableCell>{getDeviceType(user.user_agent)}</TableCell>
                                            <TableCell>{getOS(user.user_agent)}</TableCell>
                                            <TableCell className="text-sm">{formatDate(user.created_at)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {/* Pagination */}
                            {pagination && pagination.totalPages > 1 && (
                                <div className="flex items-center justify-between mt-4">
                                    <div className="text-sm text-muted-foreground">
                                        Page {pagination.page} of {pagination.totalPages}
                                        ({pagination.total.toLocaleString()} total users)
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage(page - 1)}
                                            disabled={!pagination.hasPrev}
                                        >
                                            <ChevronLeft className="h-4 w-4 mr-1" />
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage(page + 1)}
                                            disabled={!pagination.hasNext}
                                        >
                                            Next
                                            <ChevronRight className="h-4 w-4 ml-1" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}