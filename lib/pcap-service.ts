// PCAP processing service for Next.js backend
import { spawn } from "child_process"
import fs from "fs/promises"
import path from "path"
import { createClient } from "@/lib/supabase/server"

export interface PCAPProcessingResult {
  pcap_file: string
  total_packets: number
  http_packets: number
  extracted_urls: ExtractedURL[]
  processing_time_seconds: number
  timestamp: string
  error?: string
}

export interface ExtractedURL {
  url: string
  method: string
  host: string
  path: string
  headers: Record<string, string>
  source_ip: string
  timestamp: string
  packet_info: {
    protocol: string
    src_port?: number
    dst_port?: number
  }
}

export class PCAPService {
  private static instance: PCAPService
  private pythonPath: string
  private scriptPath: string
  private uploadsDir: string

  private constructor() {
    this.pythonPath = process.env.PYTHON_PATH || "python3"
    this.scriptPath = path.join(process.cwd(), "scripts", "pcap_processor.py")
    this.uploadsDir = path.join(process.cwd(), "uploads", "pcap")
  }

  public static getInstance(): PCAPService {
    if (!PCAPService.instance) {
      PCAPService.instance = new PCAPService()
    }
    return PCAPService.instance
  }

  async initialize(): Promise<void> {
    // Ensure uploads directory exists
    await fs.mkdir(this.uploadsDir, { recursive: true })
    console.log("PCAP Service initialized")
  }

  async saveUploadedFile(file: File): Promise<string> {
    const filename = `${Date.now()}_${file.name}`
    const filePath = path.join(this.uploadsDir, filename)

    const buffer = Buffer.from(await file.arrayBuffer())
    await fs.writeFile(filePath, buffer)

    return filePath
  }

  async processPCAPFile(filePath: string): Promise<PCAPProcessingResult> {
    return new Promise((resolve, reject) => {
      const process = spawn(this.pythonPath, [this.scriptPath, filePath])

      let output = ""
      let errorOutput = ""

      process.stdout.on("data", (data) => {
        output += data.toString()
      })

      process.stderr.on("data", (data) => {
        errorOutput += data.toString()
      })

      process.on("close", (code) => {
        if (code === 0) {
          try {
            // Parse the JSON output from the Python script
            const lines = output.trim().split("\n")
            const jsonLine = lines.find((line) => line.startsWith("{"))

            if (jsonLine) {
              const result = JSON.parse(jsonLine)
              resolve(result)
            } else {
              // If no JSON output, create a basic result
              resolve({
                pcap_file: filePath,
                total_packets: 0,
                http_packets: 0,
                extracted_urls: [],
                processing_time_seconds: 0,
                timestamp: new Date().toISOString(),
                error: "No JSON output from processor",
              })
            }
          } catch (parseError) {
            reject(new Error(`Failed to parse PCAP processing output: ${parseError}`))
          }
        } else {
          reject(new Error(`PCAP processing failed with code ${code}: ${errorOutput}`))
        }
      })

      process.on("error", (error) => {
        reject(error)
      })
    })
  }

  async storePCAPResults(filePath: string, results: PCAPProcessingResult): Promise<string> {
    const supabase = await createClient()

    try {
      // Store PCAP file record
      const { data: pcapRecord, error: pcapError } = await supabase
        .from("pcap_files")
        .insert({
          filename: path.basename(filePath),
          file_size: (await fs.stat(filePath)).size,
          file_path: filePath,
          processing_status: results.error ? "failed" : "completed",
          extracted_urls_count: results.extracted_urls.length,
        })
        .select()
        .single()

      if (pcapError) {
        throw new Error(`Failed to store PCAP record: ${pcapError.message}`)
      }

      // Store extracted URLs
      for (const urlInfo of results.extracted_urls) {
        // Insert URL record
        const { data: urlRecord, error: urlError } = await supabase
          .from("urls")
          .insert({
            url: urlInfo.url,
            domain: urlInfo.host,
            path: urlInfo.path,
            method: urlInfo.method,
            headers: urlInfo.headers,
            source_ip: urlInfo.source_ip,
            user_agent: urlInfo.headers["User-Agent"] || null,
            timestamp: urlInfo.timestamp,
          })
          .select()
          .single()

        if (urlError) {
          console.error(`Failed to store URL: ${urlError.message}`)
          continue
        }

        // TODO: Trigger ML analysis for each URL
        // This would integrate with the ML service we created earlier
      }

      return pcapRecord.id
    } catch (error) {
      console.error("Error storing PCAP results:", error)
      throw error
    }
  }

  async cleanupOldFiles(maxAgeHours = 24): Promise<void> {
    try {
      const files = await fs.readdir(this.uploadsDir)
      const now = Date.now()
      const maxAge = maxAgeHours * 60 * 60 * 1000

      for (const file of files) {
        const filePath = path.join(this.uploadsDir, file)
        const stats = await fs.stat(filePath)

        if (now - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filePath)
          console.log(`Cleaned up old PCAP file: ${file}`)
        }
      }
    } catch (error) {
      console.error("Error cleaning up old files:", error)
    }
  }
}

export const pcapService = PCAPService.getInstance()
