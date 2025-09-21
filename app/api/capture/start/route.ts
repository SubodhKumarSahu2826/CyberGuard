import { type NextRequest, NextResponse } from "next/server"
import { urlCaptureService } from "@/lib/url-capture"

export async function POST(request: NextRequest) {
  try {
    await urlCaptureService.startCapture()

    return NextResponse.json({
      success: true,
      message: "Live URL capture started",
      status: urlCaptureService.getStatus(),
    })
  } catch (error) {
    console.error("Error starting URL capture:", error)
    return NextResponse.json({ error: "Failed to start URL capture" }, { status: 500 })
  }
}
