import { type NextRequest, NextResponse } from "next/server"
import { mlService } from "@/lib/ml-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, model_type = "ensemble" } = body

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    // Get ML prediction
    const prediction = await mlService.predict(url, model_type)

    return NextResponse.json(prediction)
  } catch (error) {
    console.error("ML prediction error:", error)
    return NextResponse.json({ error: "ML prediction failed" }, { status: 500 })
  }
}
