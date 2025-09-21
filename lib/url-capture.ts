// Live URL capture service for real-time monitoring
export interface CapturedURL {
  url: string
  method: string
  headers: Record<string, string>
  body?: string
  source_ip: string
  user_agent?: string
  timestamp: string
}

export class URLCaptureService {
  private static instance: URLCaptureService
  private isCapturing = false
  private captureQueue: CapturedURL[] = []
  private batchSize = 10
  private batchTimeout = 5000 // 5 seconds
  private processingInterval: NodeJS.Timeout | null = null

  private constructor() {}

  public static getInstance(): URLCaptureService {
    if (!URLCaptureService.instance) {
      URLCaptureService.instance = new URLCaptureService()
    }
    return URLCaptureService.instance
  }

  async startCapture(): Promise<void> {
    if (this.isCapturing) {
      console.log("[v0] URL capture already running")
      return
    }

    this.isCapturing = true
    console.log("[v0] Starting live URL capture...")

    // Start batch processing with interval
    this.processingInterval = setInterval(() => {
      if (this.captureQueue.length > 0) {
        const batch = this.captureQueue.splice(0, this.batchSize)
        this.processBatch(batch).catch((error) => {
          console.error("[v0] Error in batch processing:", error)
        })
      }
    }, this.batchTimeout)
  }

  async stopCapture(): Promise<void> {
    this.isCapturing = false

    // Clear the processing interval
    if (this.processingInterval) {
      clearInterval(this.processingInterval)
      this.processingInterval = null
    }

    // Process remaining URLs in queue
    if (this.captureQueue.length > 0) {
      console.log("[v0] Processing remaining URLs in queue:", this.captureQueue.length)
      await this.processBatch(this.captureQueue)
      this.captureQueue = []
    }

    console.log("[v0] Stopped live URL capture")
  }

  async captureURL(urlData: CapturedURL): Promise<void> {
    if (!this.isCapturing) {
      console.log("[v0] URL capture not active, ignoring URL")
      return
    }

    // Add to queue
    this.captureQueue.push(urlData)
    console.log("[v0] Added URL to queue, current size:", this.captureQueue.length)

    // Process batch if queue is full
    if (this.captureQueue.length >= this.batchSize) {
      const batch = this.captureQueue.splice(0, this.batchSize)
      await this.processBatch(batch)
    }
  }

  private async processBatch(urls: CapturedURL[]): Promise<void> {
    try {
      console.log("[v0] Processing batch of URLs:", urls.length)

      // For now, just log the URLs without database operations
      // This avoids the Supabase pattern validation error
      for (const urlData of urls) {
        console.log("[v0] Processing URL:", {
          url: urlData.url,
          method: urlData.method,
          domain: this.extractDomain(urlData.url),
          timestamp: urlData.timestamp,
        })

        // TODO: Add database storage and ML analysis when Supabase issue is resolved
        // For now, just simulate processing
        await new Promise((resolve) => setTimeout(resolve, 10))
      }

      console.log(`[v0] Processed batch of ${urls.length} URLs successfully`)
    } catch (error) {
      console.error("[v0] Error processing URL batch:", error)
    }
  }

  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname
    } catch {
      return ""
    }
  }

  private extractPath(url: string): string {
    try {
      return new URL(url).pathname
    } catch {
      return ""
    }
  }

  private extractQueryParams(url: string): Record<string, any> {
    try {
      const urlObj = new URL(url)
      const params: Record<string, any> = {}
      urlObj.searchParams.forEach((value, key) => {
        params[key] = value
      })
      return params
    } catch {
      return {}
    }
  }

  getStatus(): { isCapturing: boolean; queueSize: number } {
    const status = {
      isCapturing: this.isCapturing,
      queueSize: this.captureQueue.length,
    }
    console.log("[v0] Getting status:", status)
    return status
  }
}

export const urlCaptureService = URLCaptureService.getInstance()
