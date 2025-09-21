import { type NextRequest, NextResponse } from "next/server"
import { pcapService } from "@/lib/pcap-service"
import { pcapUploadSchema } from "@/lib/input-validation"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  const clientIP = request.headers.get("x-forwarded-for")?.split(",")[0] || request.ip || "unknown"

  try {
    console.log("[v0] PCAP upload API called")

    // Try to create Supabase client with error handling
    let supabase
    let databaseAvailable = true
    try {
      supabase = await createClient()
      console.log("[v0] Supabase client created successfully for PCAP upload")
    } catch (clientError) {
      console.error("[v0] Failed to create Supabase client in PCAP upload API:", clientError)
      databaseAvailable = false
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf("."))
    const validationResult = pcapUploadSchema.safeParse({
      filename: file.name,
      fileSize: file.size,
      fileType: fileExtension,
    })

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid file",
          details: validationResult.error.errors,
        },
        { status: 400 },
      )
    }

    // Initialize service
    await pcapService.initialize()

    // Save uploaded file
    const filePath = await pcapService.saveUploadedFile(file)

    // Process PCAP file
    const results = await pcapService.processPCAPFile(filePath)

    // Store results in database only if available
    let pcapId = "temp-" + Date.now()
    if (databaseAvailable && supabase) {
      try {
        pcapId = await pcapService.storePCAPResults(filePath, results)
      } catch (dbError) {
        console.error("[v0] Failed to store PCAP results in database:", dbError)
      }
    }

    return NextResponse.json({
      success: true,
      pcap_id: pcapId,
      filename: file.name,
      file_size: file.size,
      results: {
        total_packets: results.total_packets,
        http_packets: results.http_packets,
        extracted_urls_count: results.extracted_urls.length,
        processing_time: results.processing_time_seconds,
      },
      service_status: databaseAvailable ? "operational" : "degraded",
      message: databaseAvailable ? undefined : "File processed without database storage",
    })
  } catch (error) {
    console.error("PCAP upload error:", error)
    return NextResponse.json(
      {
        error: "Failed to process PCAP file",
        service_status: "degraded",
      },
      { status: 500 },
    )
  }
}
