import { type NextRequest, NextResponse } from "next/server"
import { urlCaptureService } from "@/lib/url-capture"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, method = "GET", headers = {}, body: requestBody, source_ip } = body

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    const capturedURL = {
      url,
      method,
      headers,
      body: requestBody,
      source_ip: source_ip || request.ip || "unknown",
      user_agent: headers["User-Agent"] || request.headers.get("user-agent") || undefined,
      timestamp: new Date().toISOString(),
    }

    await urlCaptureService.captureURL(capturedURL)

    return NextResponse.json({
      success: true,
      message: "URL captured for analysis",
    })
  } catch (error) {
    console.error("Error capturing URL:", error)
    return NextResponse.json({ error: "Failed to capture URL" }, { status: 500 })
  }
}
