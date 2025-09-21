"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { Globe, ExternalLink, Ban } from "lucide-react"

interface IPData {
  ip: string
  count: number
  percentage: number
  risk_score: number
  country?: string
  last_seen: string
}

export function TopAttackingIPs() {
  const [ips, setIPs] = useState<IPData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchIPs()
    const interval = setInterval(fetchIPs, 60000)
    return () => clearInterval(interval)
  }, [])

  const fetchIPs = async () => {
    try {
      const response = await fetch("/api/stats?timeframe=24h")
      const stats = await response.json()

      const topIPs = stats.top_ips || []
      const maxCount = Math.max(...topIPs.map((ip: any) => ip.count))

      const processedIPs = topIPs.map((ip: any) => ({
        ip: ip.ip,
        count: ip.count,
        percentage: maxCount > 0 ? Math.round((ip.count / maxCount) * 100) : 0,
        risk_score: Math.min(Math.round((ip.count / 10) * 100), 100),
        country: "Unknown", // Would integrate with IP geolocation service
        last_seen: new Date().toISOString(),
      }))

      setIPs(processedIPs)
    } catch (error) {
      console.error("Error fetching IP data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getRiskLevel = (score: number) => {
    if (score >= 80) return { level: "Critical", color: "destructive" }
    if (score >= 60) return { level: "High", color: "secondary" }
    if (score >= 40) return { level: "Medium", color: "default" }
    return { level: "Low", color: "outline" }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-3 border rounded-lg">
            <div className="h-6 w-6 bg-muted animate-pulse rounded" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-2 w-full bg-muted animate-pulse rounded" />
            </div>
            <div className="h-6 w-12 bg-muted animate-pulse rounded" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-3">
        {ips.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No attacking IPs detected</div>
        ) : (
          ips.map((ipData, index) => {
            const risk = getRiskLevel(ipData.risk_score)

            return (
              <div
                key={ipData.ip}
                className="flex items-center space-x-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-shrink-0 text-sm font-mono text-muted-foreground">#{index + 1}</div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono text-sm">{ipData.ip}</span>
                    <Badge variant={risk.color as any} className="text-xs">
                      {risk.level}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{ipData.count} attacks</span>
                      <span className="text-muted-foreground">{ipData.risk_score}% risk</span>
                    </div>
                    <Progress value={ipData.percentage} className="h-1" />
                  </div>
                </div>

                <div className="flex flex-col space-y-1">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive">
                    <Ban className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </ScrollArea>
  )
}
