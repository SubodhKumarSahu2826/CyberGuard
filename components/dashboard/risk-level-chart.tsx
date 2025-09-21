"use client"

import { useEffect, useState } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface RiskData {
  name: string
  value: number
  color: string
}

const RISK_COLORS = {
  critical: "hsl(var(--chart-3))",
  high: "hsl(var(--chart-2))",
  medium: "hsl(var(--chart-1))",
  low: "hsl(var(--chart-4))",
}

export function RiskLevelChart() {
  const [data, setData] = useState<RiskData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 60000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      const response = await fetch("/api/stats?timeframe=24h")
      const stats = await response.json()

      const riskLevels = stats.risk_levels || {}

      const chartData = Object.entries(riskLevels)
        .map(([level, count]: [string, any]) => ({
          name: level.charAt(0).toUpperCase() + level.slice(1),
          value: count,
          color: RISK_COLORS[level as keyof typeof RISK_COLORS] || RISK_COLORS.low,
        }))
        .filter((item) => item.value > 0)

      setData(chartData)
    } catch (error) {
      console.error("Error fetching risk level data:", error)
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
        <div className="text-muted-foreground">No risk data available</div>
      </div>
    )
  }

  return (
    <ChartContainer
      config={{
        critical: { label: "Critical", color: RISK_COLORS.critical },
        high: { label: "High", color: RISK_COLORS.high },
        medium: { label: "Medium", color: RISK_COLORS.medium },
        low: { label: "Low", color: RISK_COLORS.low },
      }}
      className="h-[300px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <ChartTooltip content={<ChartTooltipContent />} formatter={(value, name) => [`${value} threats`, name]} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
