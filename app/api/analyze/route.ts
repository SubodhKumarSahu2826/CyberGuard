import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { URLAnalyzer } from "@/lib/url-analyzer"
import { AttackDetector } from "@/lib/attack-detector"
import { urlAnalysisSchema, validateUrl } from "@/lib/input-validation"
import { JsonCache, cacheKeys } from "@/lib/cache"
import type { AnalysisResponse, RiskLevel } from "@/lib/types"

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const clientIP = request.headers.get("x-forwarded-for")?.split(",")[0] || request.ip || "unknown"
  const userAgent = request.headers.get("user-agent") || ""

  try {
    console.log("[v0] Analyze API called")

    // Try to create Supabase client with error handling
    let supabase
    let databaseAvailable = true
    try {
      supabase = await createClient()
      console.log("[v0] Supabase client created successfully for analyze")
    } catch (clientError) {
      console.error("[v0] Failed to create Supabase client in analyze API:", clientError)
      databaseAvailable = false
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = urlAnalysisSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: validationResult.error.errors,
        },
        { status: 400 },
      )
    }

    const { url, method = "GET", headers, body: requestBody, source_ip, user_agent } = validationResult.data

    // Validate and sanitize URL
    const urlValidation = validateUrl(url)
    if (!urlValidation.isValid) {
      return NextResponse.json({ error: urlValidation.error }, { status: 400 })
    }

    // Check cache first
    const cacheKey = cacheKeys.urlAnalysis(url)
    const cachedResult = JsonCache.get<AnalysisResponse>(cacheKey)
    if (cachedResult) {
      return NextResponse.json(cachedResult)
    }

    // Extract features (this works without database)
    const features = URLAnalyzer.extractFeatures(urlValidation.sanitized)

    // Detect attacks (this works without database)
    const detections = await AttackDetector.detectAttacks(urlValidation.sanitized, features)

    // Calculate overall risk
    const overallRisk: RiskLevel =
      detections.length > 0
        ? detections.reduce((max, detection) => {
            const riskLevels = { low: 1, medium: 2, high: 3, critical: 4 }
            return riskLevels[detection.risk_level!] > riskLevels[max] ? detection.risk_level! : max
          }, "low" as RiskLevel)
        : "low"

    const processingTime = Date.now() - startTime

    // Create response with or without database storage
    const response: AnalysisResponse = {
      url_id: databaseAvailable ? "temp-id" : "no-db-" + Date.now(),
      detections: detections,
      features: features,
      overall_risk: overallRisk,
      processing_time_ms: processingTime,
      service_status: databaseAvailable ? "operational" : "degraded",
      message: databaseAvailable ? undefined : "Analysis completed without database storage",
    }

    // Cache the result for 5 minutes
    JsonCache.set(cacheKey, response, 300)

    return NextResponse.json(response)
  } catch (error) {
    console.error("Analysis error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        service_status: "degraded",
      },
      { status: 500 },
    )
  }
}
