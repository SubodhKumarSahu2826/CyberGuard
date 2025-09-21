import { type NextRequest, NextResponse } from "next/server"
import { mlService } from "@/lib/ml-service"

export async function GET(request: NextRequest) {
  try {
    const modelInfo = await mlService.getModelInfo()
    return NextResponse.json(modelInfo)
  } catch (error) {
    console.error("ML info error:", error)
    return NextResponse.json({ error: "Failed to get ML model info" }, { status: 500 })
  }
}
