// Input validation and sanitization utilities
import { z } from "zod"

// URL validation schema
export const urlAnalysisSchema = z.object({
  url: z.string().url("Invalid URL format").max(2048, "URL too long"),
  method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"]).optional().default("GET"),
  headers: z.record(z.string()).optional(),
  body: z.string().max(10240, "Request body too large").optional(),
  source_ip: z.string().ip().optional(),
  user_agent: z.string().max(512, "User agent too long").optional(),
})

// PCAP upload validation
export const pcapUploadSchema = z.object({
  filename: z.string().min(1, "Filename required").max(255, "Filename too long"),
  fileSize: z
    .number()
    .min(1, "File cannot be empty")
    .max(100 * 1024 * 1024, "File too large (max 100MB)"),
  fileType: z.enum([".pcap", ".pcapng", ".cap"], {
    errorMap: () => ({ message: "Invalid file type. Only .pcap, .pcapng, and .cap files allowed" }),
  }),
})

// Detection query validation
export const detectionQuerySchema = z.object({
  page: z.coerce.number().min(1).max(1000).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(50),
  attack_type: z
    .enum([
      "sqli",
      "xss",
      "directory_traversal",
      "command_injection",
      "ssrf",
      "file_inclusion",
      "credential_stuffing",
      "brute_force",
      "http_parameter_pollution",
      "xxe",
      "web_shell",
      "typosquatting",
    ])
    .optional(),
  risk_level: z.enum(["low", "medium", "high", "critical"]).optional(),
  source_ip: z.string().ip().optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
})

// Stats query validation
export const statsQuerySchema = z.object({
  timeframe: z.enum(["1h", "24h", "7d", "30d"]).optional().default("24h"),
})

// Sanitize HTML content to prevent XSS
export function sanitizeHtml(input: string): string {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
}

// Sanitize SQL-like input to prevent injection
export function sanitizeSql(input: string): string {
  return input.replace(/[';\\]/g, "").trim()
}

// Validate and sanitize URL
export function validateUrl(url: string): { isValid: boolean; sanitized: string; error?: string } {
  try {
    const parsed = new URL(url)

    // Block dangerous protocols
    const allowedProtocols = ["http:", "https:"]
    if (!allowedProtocols.includes(parsed.protocol)) {
      return { isValid: false, sanitized: "", error: "Only HTTP and HTTPS protocols allowed" }
    }

    // Block private/local addresses in production
    if (process.env.NODE_ENV === "production") {
      const hostname = parsed.hostname.toLowerCase()
      const privateRanges = [
        "localhost",
        "127.",
        "10.",
        "172.16.",
        "172.17.",
        "172.18.",
        "172.19.",
        "172.20.",
        "172.21.",
        "172.22.",
        "172.23.",
        "172.24.",
        "172.25.",
        "172.26.",
        "172.27.",
        "172.28.",
        "172.29.",
        "172.30.",
        "172.31.",
        "192.168.",
      ]

      if (privateRanges.some((range) => hostname.includes(range))) {
        return { isValid: false, sanitized: "", error: "Private/local addresses not allowed" }
      }
    }

    return { isValid: true, sanitized: parsed.toString() }
  } catch (error) {
    return { isValid: false, sanitized: "", error: "Invalid URL format" }
  }
}

// Input length limits
export const INPUT_LIMITS = {
  URL_MAX_LENGTH: 2048,
  HEADER_MAX_LENGTH: 8192,
  BODY_MAX_LENGTH: 10240,
  USER_AGENT_MAX_LENGTH: 512,
  FILENAME_MAX_LENGTH: 255,
  FILE_MAX_SIZE: 100 * 1024 * 1024, // 100MB
} as const
