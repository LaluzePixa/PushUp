"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { dashboardService, AnalyticsDataPoint } from '@/services/api'

const chartConfig = {
  subscriptions: {
    label: "Suscripciones",
    color: "hsl(var(--chart-1))",
  },
  campaigns: {
    label: "Campañas",
    color: "hsl(var(--chart-2))",
  },
  users: {
    label: "Usuarios",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig

export default function Chart() {
  const [timeRange, setTimeRange] = React.useState("30")
  const [chartData, setChartData] = useState<AnalyticsDataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar datos analíticos
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await dashboardService.getAnalytics(parseInt(timeRange))

        if (response.success && response.data) {
          setChartData(response.data)
        } else {
          setError('Error al cargar datos analíticos')
        }
      } catch (err) {
        console.error('Error fetching analytics:', err)
        setError('Error de conexión')
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [timeRange])

  const filteredData = chartData.slice(-parseInt(timeRange))

  return (
    <Card>
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1 text-center sm:text-left">
          <CardTitle>Actividad del Dashboard</CardTitle>
          <CardDescription>
            Mostrando actividad de suscripciones y campañas
          </CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger
            className="w-[160px] rounded-lg sm:ml-auto"
            aria-label="Seleccionar período"
          >
            <SelectValue placeholder="Últimos 30 días" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="7" className="rounded-lg">
              Últimos 7 días
            </SelectItem>
            <SelectItem value="30" className="rounded-lg">
              Últimos 30 días
            </SelectItem>
            <SelectItem value="90" className="rounded-lg">
              Últimos 90 días
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {loading ? (
          <div className="flex items-center justify-center h-[250px]">
            <div className="text-muted-foreground">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm">Cargando datos...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-[250px]">
            <div className="text-center text-muted-foreground">
              <p className="text-destructive mb-2">⚠️ {error}</p>
              <button
                onClick={() => window.location.reload()}
                className="text-sm text-primary hover:underline"
              >
                Reintentar
              </button>
            </div>
          </div>
        ) : !filteredData.length ? (
          <div className="flex items-center justify-center h-[250px]">
            <div className="text-center text-muted-foreground">
              <p className="mb-2">📊 No hay datos disponibles</p>
              <p className="text-sm">Los datos aparecerán cuando haya actividad</p>
            </div>
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] w-full"
          >
            <AreaChart data={filteredData}>
              <defs>
                <linearGradient id="fillSubscriptions" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-subscriptions)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-subscriptions)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient id="fillCampaigns" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-campaigns)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-campaigns)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return date.toLocaleDateString("es-ES", {
                    month: "short",
                    day: "numeric",
                  })
                }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      if (value === undefined) return "";
                      return new Date(value).toLocaleDateString("es-ES", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      });
                    }}
                    indicator="dot"
                  />
                }
              />
              <Area
                dataKey="subscriptions"
                type="natural"
                fill="url(#fillSubscriptions)"
                stroke="var(--color-subscriptions)"
                stackId="a"
              />
              <Area
                dataKey="campaigns"
                type="natural"
                fill="url(#fillCampaigns)"
                stroke="var(--color-campaigns)"
                stackId="a"
              />
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
