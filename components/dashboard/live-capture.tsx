"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Activity, Play, Square, Send, Globe, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function LiveCapture() {
  const [isCapturing, setIsCapturing] = useState(false)
  const [captureStatus, setCaptureStatus] = useState<any>(null)
  const [testUrl, setTestUrl] = useState("")
  const [testMethod, setTestMethod] = useState("GET")
  const [testHeaders, setTestHeaders] = useState("")
  const [testBody, setTestBody] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    checkStatus()
    const interval = setInterval(checkStatus, 5000)
    return () => clearInterval(interval)
  }, [])

  const checkStatus = async () => {
    try {
      const response = await fetch("/api/capture/status")
      const data = await response.json()
      setCaptureStatus(data.capture_status)
      setIsCapturing(data.capture_status?.isCapturing || false)
    } catch (error) {
      console.error("Error checking capture status:", error)
    }
  }

  const toggleCapture = async () => {
    try {
      const endpoint = isCapturing ? "/api/capture/stop" : "/api/capture/start"
      const response = await fetch(endpoint, { method: "POST" })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: isCapturing ? "Capture Stopped" : "Capture Started",
          description: data.message,
        })
        checkStatus()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to toggle capture",
        variant: "destructive",
      })
    }
  }

  const submitTestURL = async () => {
    if (!testUrl) {
      toast({
        title: "Error",
        description: "Please enter a URL to test",
        variant: "destructive",
      })
      return
    }

    try {
      let headers = {}
      if (testHeaders) {
        try {
          headers = JSON.parse(testHeaders)
        } catch {
          headers = { "User-Agent": testHeaders }
        }
      }

      const response = await fetch("/api/capture/url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: testUrl,
          method: testMethod,
          headers,
          body: testBody || undefined,
        }),
      })

      if (response.ok) {
        toast({
          title: "URL Submitted",
          description: "URL has been captured for analysis",
        })
        setTestUrl("")
        setTestHeaders("")
        setTestBody("")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit URL",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Live URL Capture
        </CardTitle>
        <CardDescription>Monitor and capture URLs in real-time for threat analysis</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Section */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center space-x-3">
            <div className={`h-3 w-3 rounded-full ${isCapturing ? "bg-green-500 animate-pulse" : "bg-gray-400"}`} />
            <div>
              <p className="font-medium">{isCapturing ? "Live Monitoring Active" : "Monitoring Stopped"}</p>
              <p className="text-sm text-muted-foreground">Queue: {captureStatus?.queueSize || 0} URLs</p>
            </div>
          </div>

          <Button
            variant={isCapturing ? "destructive" : "default"}
            onClick={toggleCapture}
            className="flex items-center gap-2"
          >
            {isCapturing ? (
              <>
                <Square className="h-4 w-4" />
                Stop
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Start
              </>
            )}
          </Button>
        </div>

        {/* Test URL Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <Label className="font-medium">Test URL Analysis</Label>
          </div>

          <div className="grid gap-3">
            <div className="flex gap-2">
              <select
                value={testMethod}
                onChange={(e) => setTestMethod(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
              <Input
                placeholder="https://example.com/api/endpoint"
                value={testUrl}
                onChange={(e) => setTestUrl(e.target.value)}
                className="flex-1"
              />
            </div>

            <Input
              placeholder="Headers (JSON or User-Agent string)"
              value={testHeaders}
              onChange={(e) => setTestHeaders(e.target.value)}
            />

            {(testMethod === "POST" || testMethod === "PUT") && (
              <Textarea
                placeholder="Request body (optional)"
                value={testBody}
                onChange={(e) => setTestBody(e.target.value)}
                rows={3}
              />
            )}

            <Button onClick={submitTestURL} className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Analyze URL
            </Button>
          </div>
        </div>

        {/* Info Section */}
        <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
          <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p>Live capture monitors incoming HTTP requests and analyzes them for potential threats.</p>
            <p className="mt-1">Use the test section to manually submit URLs for analysis.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
