// Audit logging for security and compliance
import { createClient } from "@/lib/supabase/server"

export interface AuditLogEntry {
  action: string
  resource_type: string
  resource_id?: string
  user_id?: string
  ip_address?: string
  user_agent?: string
  details?: Record<string, any>
  timestamp?: string
}

export class AuditLogger {
  private static instance: AuditLogger
  private logQueue: AuditLogEntry[] = []
  private batchSize = 10
  private flushInterval = 5000 // 5 seconds

  private constructor() {
    // Flush logs periodically
    setInterval(() => {
      this.flush()
    }, this.flushInterval)

    // Flush on process exit
    process.on("beforeExit", () => {
      this.flush()
    })
  }

  public static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger()
    }
    return AuditLogger.instance
  }

  async log(entry: AuditLogEntry): Promise<void> {
    const logEntry: AuditLogEntry = {
      ...entry,
      timestamp: entry.timestamp || new Date().toISOString(),
    }

    this.logQueue.push(logEntry)

    // Flush if queue is full
    if (this.logQueue.length >= this.batchSize) {
      await this.flush()
    }
  }

  private async flush(): Promise<void> {
    if (this.logQueue.length === 0) return

    const batch = this.logQueue.splice(0, this.batchSize)

    try {
      const supabase = await createClient()
      const { error } = await supabase.from("audit_logs").insert(batch)

      if (error) {
        console.error("Failed to write audit logs:", error)
        // Re-queue failed logs (with limit to prevent infinite growth)
        if (this.logQueue.length < 100) {
          this.logQueue.unshift(...batch)
        }
      }
    } catch (error) {
      console.error("Audit logging error:", error)
    }
  }

  // Convenience methods for common audit events
  async logAuthentication(userId: string, success: boolean, ip?: string, userAgent?: string): Promise<void> {
    await this.log({
      action: success ? "auth_success" : "auth_failure",
      resource_type: "authentication",
      user_id: userId,
      ip_address: ip,
      user_agent: userAgent,
      details: { success },
    })
  }

  async logUrlAnalysis(
    urlId: string,
    url: string,
    detectionCount: number,
    userId?: string,
    ip?: string,
  ): Promise<void> {
    await this.log({
      action: "url_analysis",
      resource_type: "url",
      resource_id: urlId,
      user_id: userId,
      ip_address: ip,
      details: {
        url: url.substring(0, 255), // Truncate for storage
        detection_count: detectionCount,
      },
    })
  }

  async logPcapUpload(
    pcapId: string,
    filename: string,
    fileSize: number,
    extractedUrls: number,
    userId?: string,
    ip?: string,
  ): Promise<void> {
    await this.log({
      action: "pcap_upload",
      resource_type: "pcap_file",
      resource_id: pcapId,
      user_id: userId,
      ip_address: ip,
      details: {
        filename,
        file_size: fileSize,
        extracted_urls: extractedUrls,
      },
    })
  }

  async logDataAccess(
    resourceType: string,
    resourceId: string,
    action: string,
    userId?: string,
    ip?: string,
  ): Promise<void> {
    await this.log({
      action: `data_${action}`,
      resource_type: resourceType,
      resource_id: resourceId,
      user_id: userId,
      ip_address: ip,
    })
  }

  async logSecurityEvent(
    event: string,
    severity: "low" | "medium" | "high" | "critical",
    details: Record<string, any>,
    ip?: string,
  ): Promise<void> {
    await this.log({
      action: "security_event",
      resource_type: "security",
      ip_address: ip,
      details: {
        event,
        severity,
        ...details,
      },
    })
  }
}

export const auditLogger = AuditLogger.getInstance()
