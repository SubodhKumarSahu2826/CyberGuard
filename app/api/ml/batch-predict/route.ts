import { type NextRequest, NextResponse } from "next/server"
import { mlService } from "@/lib/ml-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { urls, model_type = "ensemble" } = body

    if (!urls || !Array.isArray(urls)) {
      return NextResponse.json({ error: "URLs array is required" }, { status: 400 })
    }

    if (urls.length > 100) {
      return NextResponse.json({ error: "Maximum 100 URLs allowed per batch" }, { status: 400 })
    }

    // Get batch predictions
    const predictions = await mlService.batchPredict(urls, model_type)

    return NextResponse.json({
      predictions,
      total: predictions.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Batch ML prediction error:", error)
    return NextResponse.json({ error: "Batch ML prediction failed" }, { status: 500 })
  }
}
