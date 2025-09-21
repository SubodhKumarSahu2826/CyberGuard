"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Shield, Activity, AlertTriangle, Settings, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export function DashboardHeader() {
  const [isLiveCapture, setIsLiveCapture] = useState(false)
  const [captureStatus, setCaptureStatus] = useState<any>(null)
  const [connectionError, setConnectionError] = useState(false)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    checkCaptureStatus()
  }, [])

  const checkCaptureStatus = async () => {
    try {
      console.log("[v0] Dashboard header checking capture status...")
      const response = await fetch("/api/capture/status")
      const data = await response.json()

      console.log("[v0] Dashboard header received data:", data)

      if (data.capture_status) {
        setCaptureStatus(data.capture_status)
        setIsLiveCapture(data.capture_status?.isCapturing || false)
        setConnectionError(false)
      } else if (data.error || data.warning) {
        console.warn("[v0] Service warning:", data.error || data.warning)
        setCaptureStatus({ isCapturing: false, queueSize: 0 })
        setIsLiveCapture(false)
        setConnectionError(true)
      }
    } catch (error) {
      console.error("[v0] Dashboard header error checking capture status:", error)
      setCaptureStatus({ isCapturing: false, queueSize: 0 })
      setIsLiveCapture(false)
      setConnectionError(true)
    }
  }

  const toggleLiveCapture = async () => {
    if (connectionError) {
      console.warn("[v0] Cannot toggle capture - connection error")
      return
    }

    try {
      const endpoint = isLiveCapture ? "/api/capture/stop" : "/api/capture/start"
      const response = await fetch(endpoint, { method: "POST" })

      if (response.ok) {
        setIsLiveCapture(!isLiveCapture)
        checkCaptureStatus()
      }
    } catch (error) {
      console.error("[v0] Error toggling capture:", error)
      setConnectionError(true)
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold">CyberGuard</h1>
                <p className="text-sm text-muted-foreground">Attack Detection System</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Badge
                variant={connectionError ? "destructive" : isLiveCapture ? "default" : "secondary"}
                className="flex items-center gap-1"
              >
                <Activity className="h-3 w-3" />
                {connectionError ? "Connection Error" : isLiveCapture ? "Live Monitoring" : "Monitoring Stopped"}
              </Badge>

              {captureStatus?.queueSize > 0 && !connectionError && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {captureStatus.queueSize} in queue
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant={isLiveCapture ? "destructive" : "default"}
              size="sm"
              onClick={toggleLiveCapture}
              disabled={connectionError}
              className="flex items-center gap-2"
            >
              <Activity className="h-4 w-4" />
              {connectionError ? "Service Unavailable" : isLiveCapture ? "Stop Monitoring" : "Start Monitoring"}
            </Button>

            <Button variant="outline" size="sm" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
