import { type NextRequest, NextResponse } from "next/server"
import { urlCaptureService } from "@/lib/url-capture"

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Getting capture status without Supabase dependency...")

    // Get status directly from the service without database operations
    const status = urlCaptureService.getStatus()
    console.log("[v0] Capture status retrieved:", status)

    return NextResponse.json({
      capture_status: status,
      timestamp: new Date().toISOString(),
      service: "operational",
    })
  } catch (error) {
    console.error("[v0] Error getting capture status:", error)

    // Return a safe fallback status
    return NextResponse.json({
      capture_status: { isCapturing: false, queueSize: 0 },
      timestamp: new Date().toISOString(),
      service: "degraded",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
