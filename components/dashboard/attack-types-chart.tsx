"use client"

import { useEffect, useState } from "react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface AttackData {
  attack_type: string
  count: number
  percentage: number
}

export function AttackTypesChart() {
  const [data, setData] = useState<AttackData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      const response = await fetch("/api/stats?timeframe=24h")
      const stats = await response.json()

      const attackTypes = stats.attack_types || {}
      const total = Object.values(attackTypes).reduce((sum: number, count: any) => sum + count, 0)

      const chartData = Object.entries(attackTypes)
        .map(([type, count]: [string, any]) => ({
          attack_type: type.replace(/_/g, " ").toUpperCase(),
          count: count,
          percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        }))
        .sort((a, b) => b.count - a.count)

      setData(chartData)
    } catch (error) {
      console.error("Error fetching attack types data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading chart data...</div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center">
        <div className="text-muted-foreground">No attack data available</div>
      </div>
    )
  }

  return (
    <ChartContainer
      config={{
        count: {
          label: "Attacks",
          color: "hsl(var(--chart-1))",
        },
      }}
      className="h-[300px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <XAxis dataKey="attack_type" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={80} />
          <YAxis tick={{ fontSize: 12 }} />
          <ChartTooltip
            content={<ChartTooltipContent />}
            formatter={(value, name) => [
              `${value} attacks (${data.find((d) => d.count === value)?.percentage}%)`,
              "Count",
            ]}
          />
          <Bar dataKey="count" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
