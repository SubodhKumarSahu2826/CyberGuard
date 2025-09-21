import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Detections API called")

    // Try to create Supabase client with error handling
    let supabase
    try {
      supabase = await createClient()
      console.log("[v0] Supabase client created successfully for detections")
    } catch (clientError) {
      console.error("[v0] Failed to create Supabase client in detections API:", clientError)
      // Return mock data when database is unavailable
      return NextResponse.json({
        data: [],
        pagination: {
          page: 1,
          limit: 50,
          total: 0,
          pages: 0,
        },
        service_status: "degraded",
        message: "Database temporarily unavailable",
      })
    }

    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Math.min(Number.parseInt(searchParams.get("limit") || "50"), 100)
    const attackType = searchParams.get("attack_type")
    const riskLevel = searchParams.get("risk_level")
    const sourceIp = searchParams.get("source_ip")
    const startDate = searchParams.get("start_date")
    const endDate = searchParams.get("end_date")

    // Build query
    let query = supabase
      .from("attack_detections")
      .select(`
        *,
        urls (
          url,
          domain,
          source_ip,
          timestamp
        )
      `)
      .order("created_at", { ascending: false })

    // Apply filters
    if (attackType) {
      query = query.eq("attack_type", attackType)
    }

    if (riskLevel) {
      query = query.eq("risk_level", riskLevel)
    }

    if (sourceIp) {
      query = query.eq("urls.source_ip", sourceIp)
    }

    if (startDate) {
      query = query.gte("created_at", startDate)
    }

    if (endDate) {
      query = query.lte("created_at", endDate)
    }

    // Apply pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error("Error fetching detections:", error)
      return NextResponse.json({ error: "Failed to fetch detections" }, { status: 500 })
    }

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error("Detections API error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        service_status: "degraded",
      },
      { status: 500 },
    )
  }
}
