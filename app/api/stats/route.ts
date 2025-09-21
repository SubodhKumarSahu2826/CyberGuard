import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Stats API called")

    // Try to create Supabase client with error handling
    let supabase
    try {
      supabase = await createClient()
      console.log("[v0] Supabase client created successfully for stats")
    } catch (clientError) {
      console.error("[v0] Failed to create Supabase client in stats API:", clientError)
      // Return mock stats when database is unavailable
      return NextResponse.json({
        summary: {
          total_urls: 0,
          total_detections: 0,
          detection_rate: "0.00",
        },
        attack_types: {},
        risk_levels: {},
        top_ips: [],
        timeline: [],
        timeframe: "24h",
        service_status: "degraded",
        message: "Database temporarily unavailable",
      })
    }

    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get("timeframe") || "24h"

    // Calculate time range
    const now = new Date()
    let startTime: Date

    switch (timeframe) {
      case "1h":
        startTime = new Date(now.getTime() - 60 * 60 * 1000)
        break
      case "24h":
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case "7d":
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case "30d":
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      default:
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    }

    // Get total URLs analyzed
    const { count: totalUrls } = await supabase
      .from("urls")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startTime.toISOString())

    // Get total detections
    const { count: totalDetections } = await supabase
      .from("attack_detections")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startTime.toISOString())

    // Get detections by attack type
    const { data: attackTypeStats } = await supabase
      .from("attack_detections")
      .select("attack_type")
      .gte("created_at", startTime.toISOString())

    const attackTypeCounts =
      attackTypeStats?.reduce(
        (acc, detection) => {
          acc[detection.attack_type] = (acc[detection.attack_type] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      ) || {}

    // Get detections by risk level
    const { data: riskLevelStats } = await supabase
      .from("attack_detections")
      .select("risk_level")
      .gte("created_at", startTime.toISOString())

    const riskLevelCounts =
      riskLevelStats?.reduce(
        (acc, detection) => {
          acc[detection.risk_level] = (acc[detection.risk_level] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      ) || {}

    // Get top attacking IPs
    const { data: ipStats } = await supabase
      .from("urls")
      .select("source_ip")
      .gte("created_at", startTime.toISOString())
      .not("source_ip", "is", null)

    const ipCounts =
      ipStats?.reduce(
        (acc, url) => {
          if (url.source_ip) {
            acc[url.source_ip] = (acc[url.source_ip] || 0) + 1
          }
          return acc
        },
        {} as Record<string, number>,
      ) || {}

    const topIPs = Object.entries(ipCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([ip, count]) => ({ ip, count }))

    // Get recent detections timeline
    const { data: timelineData } = await supabase
      .from("attack_detections")
      .select("created_at, attack_type, risk_level")
      .gte("created_at", startTime.toISOString())
      .order("created_at", { ascending: true })

    return NextResponse.json({
      summary: {
        total_urls: totalUrls || 0,
        total_detections: totalDetections || 0,
        detection_rate: totalUrls ? (((totalDetections || 0) / totalUrls) * 100).toFixed(2) : "0.00",
      },
      attack_types: attackTypeCounts,
      risk_levels: riskLevelCounts,
      top_ips: topIPs,
      timeline: timelineData || [],
      timeframe,
    })
  } catch (error) {
    console.error("Stats API error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        service_status: "degraded",
      },
      { status: 500 },
    )
  }
}
