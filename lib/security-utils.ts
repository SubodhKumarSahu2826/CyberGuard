// Security utilities and helpers
import crypto from "crypto"
import { auditLogger } from "./audit-logger"

// Generate secure random tokens
export function generateSecureToken(length = 32): string {
  return crypto.randomBytes(length).toString("hex")
}

// Hash sensitive data
export function hashData(data: string, salt?: string): string {
  const actualSalt = salt || crypto.randomBytes(16).toString("hex")
  const hash = crypto.pbkdf2Sync(data, actualSalt, 10000, 64, "sha512")
  return `${actualSalt}:${hash.toString("hex")}`
}

// Verify hashed data
export function verifyHash(data: string, hash: string): boolean {
  const [salt, originalHash] = hash.split(":")
  const verifyHash = crypto.pbkdf2Sync(data, salt, 10000, 64, "sha512")
  return originalHash === verifyHash.toString("hex")
}

// Encrypt sensitive data
export function encryptData(data: string, key?: string): string {
  const encryptionKey = key || process.env.ENCRYPTION_KEY || generateSecureToken(32)
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipher("aes-256-cbc", encryptionKey)

  let encrypted = cipher.update(data, "utf8", "hex")
  encrypted += cipher.final("hex")

  return `${iv.toString("hex")}:${encrypted}`
}

// Decrypt sensitive data
export function decryptData(encryptedData: string, key?: string): string {
  const encryptionKey = key || process.env.ENCRYPTION_KEY || ""
  const [ivHex, encrypted] = encryptedData.split(":")
  const iv = Buffer.from(ivHex, "hex")
  const decipher = crypto.createDecipher("aes-256-cbc", encryptionKey)

  let decrypted = decipher.update(encrypted, "hex", "utf8")
  decrypted += decipher.final("utf8")

  return decrypted
}

// Detect potential security threats in requests
export async function detectSecurityThreats(request: {
  url: string
  headers: Record<string, string>
  body?: string
  ip?: string
}): Promise<{ threats: string[]; riskScore: number }> {
  const threats: string[] = []
  let riskScore = 0

  // Check for common attack patterns in URL
  const urlThreats = [
    { pattern: /[<>'"]/g, threat: "xss_chars", score: 10 },
    { pattern: /union\s+select/i, threat: "sql_injection", score: 20 },
    { pattern: /\.\.\//g, threat: "path_traversal", score: 15 },
    { pattern: /[|&;`]/g, threat: "command_injection", score: 15 },
    { pattern: /%[0-9a-f]{2}/gi, threat: "url_encoding", score: 5 },
  ]

  for (const { pattern, threat, score } of urlThreats) {
    if (pattern.test(request.url)) {
      threats.push(threat)
      riskScore += score
    }
  }

  // Check headers for suspicious patterns
  const userAgent = request.headers["user-agent"] || ""
  const suspiciousAgents = ["sqlmap", "nikto", "nmap", "masscan", "zap"]

  if (suspiciousAgents.some((agent) => userAgent.toLowerCase().includes(agent))) {
    threats.push("suspicious_user_agent")
    riskScore += 25
  }

  // Check for excessive header count (potential HTTP pollution)
  if (Object.keys(request.headers).length > 50) {
    threats.push("excessive_headers")
    riskScore += 10
  }

  // Check body for threats
  if (request.body) {
    const bodyThreats = [
      { pattern: /<script/i, threat: "script_injection", score: 20 },
      { pattern: /javascript:/i, threat: "javascript_protocol", score: 15 },
      { pattern: /on\w+\s*=/i, threat: "event_handler", score: 15 },
    ]

    for (const { pattern, threat, score } of bodyThreats) {
      if (pattern.test(request.body)) {
        threats.push(threat)
        riskScore += score
      }
    }
  }

  // Log high-risk requests
  if (riskScore >= 30) {
    await auditLogger.logSecurityEvent(
      "high_risk_request",
      riskScore >= 50 ? "critical" : "high",
      {
        threats,
        risk_score: riskScore,
        url: request.url.substring(0, 255),
        user_agent: userAgent.substring(0, 255),
      },
      request.ip,
    )
  }

  return { threats, riskScore }
}

// IP address utilities
export function isPrivateIP(ip: string): boolean {
  const privateRanges = [
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[01])\./,
    /^192\.168\./,
    /^127\./,
    /^169\.254\./,
    /^::1$/,
    /^fc00:/,
    /^fe80:/,
  ]

  return privateRanges.some((range) => range.test(ip))
}

export function normalizeIP(ip: string): string {
  // Remove IPv6 prefix for IPv4-mapped addresses
  if (ip.startsWith("::ffff:")) {
    return ip.substring(7)
  }
  return ip
}

// Content Security Policy generator
export function generateCSP(): string {
  const directives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ]

  return directives.join("; ")
}
