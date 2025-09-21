"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertTriangle, Shield, Clock, ExternalLink, Filter, Download } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface Detection {
  id: string
  attack_type: string
  confidence_score: number
  risk_level: string
  created_at: string
  urls: {
    url: string
    domain: string
    source_ip: string
  }
}

const getRiskColor = (risk: string) => {
  switch (risk) {
    case "critical":
      return "destructive"
    case "high":
      return "secondary"
    case "medium":
      return "default"
    case "low":
      return "outline"
    default:
      return "outline"
  }
}

const getRiskIcon = (risk: string) => {
  switch (risk) {
    case "critical":
    case "high":
      return <AlertTriangle className="h-3 w-3" />
    default:
      return <Shield className="h-3 w-3" />
  }
}

export function RecentDetections() {
  const [detections, setDetections] = useState<Detection[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDetections()
    const interval = setInterval(fetchDetections, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchDetections = async () => {
    try {
      const response = await fetch("/api/detections?limit=10")
      const data = await response.json()
      setDetections(data.data || [])
    } catch (error) {
      console.error("Error fetching detections:", error)
    } finally {
      setLoading(false)
    }
  }

  const exportDetections = async () => {
    try {
      const response = await fetch("/api/detections?limit=1000&format=csv")
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `detections_${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Error exporting detections:", error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
            <div className="h-8 w-8 bg-muted animate-pulse rounded" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
              <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
            </div>
            <div className="h-6 w-16 bg-muted animate-pulse rounded" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm" onClick={exportDetections}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[400px]">
        <div className="space-y-3">
          {detections.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No recent detections found</div>
          ) : (
            detections.map((detection) => (
              <div
                key={detection.id}
                className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-shrink-0">
                  <Badge variant={getRiskColor(detection.risk_level) as any} className="flex items-center gap-1">
                    {getRiskIcon(detection.risk_level)}
                    {detection.risk_level}
                  </Badge>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium truncate">
                      {detection.attack_type.replace(/_/g, " ").toUpperCase()}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {Math.round(detection.confidence_score * 100)}%
                    </Badge>
                  </div>

                  <div className="flex items-center space-x-4 mt-1 text-xs text-muted-foreground">
                    <span className="truncate max-w-[200px]">{detection.urls.domain}</span>
                    <span>{detection.urls.source_ip}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(detection.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>

                <Button variant="ghost" size="sm">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
