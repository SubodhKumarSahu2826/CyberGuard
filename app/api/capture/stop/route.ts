import { type NextRequest, NextResponse } from "next/server"
import { urlCaptureService } from "@/lib/url-capture"

export async function POST(request: NextRequest) {
  try {
    await urlCaptureService.stopCapture()

    return NextResponse.json({
      success: true,
      message: "Live URL capture stopped",
      status: urlCaptureService.getStatus(),
    })
  } catch (error) {
    console.error("Error stopping URL capture:", error)
    return NextResponse.json({ error: "Failed to stop URL capture" }, { status: 500 })
  }
}
