// Attack detection logic and ML integration

import type { RiskLevel, AttackDetection } from "./types"

export class AttackDetector {
  // Simplified ML-like detection logic for demo
  // In production, this would integrate with actual ML models

  static async detectAttacks(url: string, features: any): Promise<AttackDetection[]> {
    const detections: Partial<AttackDetection>[] = []

    // SQL Injection detection
    const sqliScore = this.detectSQLInjection(url)
    if (sqliScore > 0.5) {
      detections.push({
        attack_type: "sqli",
        confidence_score: sqliScore,
        risk_level: this.getRiskLevel(sqliScore),
        detection_status: "completed",
        payload: this.extractSQLPayload(url),
        detection_details: {
          patterns_matched: ["sql_keywords", "injection_syntax"],
          ml_score: sqliScore,
        },
      })
    }

    // XSS detection
    const xssScore = this.detectXSS(url)
    if (xssScore > 0.5) {
      detections.push({
        attack_type: "xss",
        confidence_score: xssScore,
        risk_level: this.getRiskLevel(xssScore),
        detection_status: "completed",
        payload: this.extractXSSPayload(url),
        detection_details: {
          patterns_matched: ["script_tags", "javascript_events"],
          ml_score: xssScore,
        },
      })
    }

    // Directory Traversal detection
    const traversalScore = this.detectDirectoryTraversal(url)
    if (traversalScore > 0.5) {
      detections.push({
        attack_type: "directory_traversal",
        confidence_score: traversalScore,
        risk_level: this.getRiskLevel(traversalScore),
        detection_status: "completed",
        payload: this.extractTraversalPayload(url),
        detection_details: {
          patterns_matched: ["path_traversal", "system_files"],
          ml_score: traversalScore,
        },
      })
    }

    // Command Injection detection
    const cmdScore = this.detectCommandInjection(url)
    if (cmdScore > 0.5) {
      detections.push({
        attack_type: "command_injection",
        confidence_score: cmdScore,
        risk_level: this.getRiskLevel(cmdScore),
        detection_status: "completed",
        payload: this.extractCommandPayload(url),
        detection_details: {
          patterns_matched: ["command_separators", "system_commands"],
          ml_score: cmdScore,
        },
      })
    }

    return detections as AttackDetection[]
  }

  private static detectSQLInjection(url: string): number {
    const sqlPatterns = [
      /union\s+select/i,
      /or\s+1\s*=\s*1/i,
      /'\s*or\s*'1'\s*=\s*'1/i,
      /drop\s+table/i,
      /insert\s+into/i,
      /delete\s+from/i,
      /exec\s*\(/i,
      /script\s*>/i,
    ]

    let score = 0
    for (const pattern of sqlPatterns) {
      if (pattern.test(url)) {
        score += 0.2
      }
    }

    return Math.min(score, 1.0)
  }

  private static detectXSS(url: string): number {
    const xssPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /alert\s*\(/i,
      /prompt\s*\(/i,
      /confirm\s*\(/i,
      /<iframe/i,
      /eval\s*\(/i,
    ]

    let score = 0
    for (const pattern of xssPatterns) {
      if (pattern.test(url)) {
        score += 0.25
      }
    }

    return Math.min(score, 1.0)
  }

  private static detectDirectoryTraversal(url: string): number {
    const traversalPatterns = [/\.\.\//, /\.\.\\/, /\/etc\/passwd/i, /\/proc\//i, /\/var\/log/i, /\.\.%2f/i, /\.\.%5c/i]

    let score = 0
    for (const pattern of traversalPatterns) {
      if (pattern.test(url)) {
        score += 0.3
      }
    }

    return Math.min(score, 1.0)
  }

  private static detectCommandInjection(url: string): number {
    const cmdPatterns = [/[|&;`]/, /\$\(/, /`.*`/, /&&/, /\|\|/, /;\s*cat/i, /;\s*ls/i, /;\s*pwd/i]

    let score = 0
    for (const pattern of cmdPatterns) {
      if (pattern.test(url)) {
        score += 0.25
      }
    }

    return Math.min(score, 1.0)
  }

  private static getRiskLevel(score: number): RiskLevel {
    if (score >= 0.9) return "critical"
    if (score >= 0.7) return "high"
    if (score >= 0.5) return "medium"
    return "low"
  }

  private static extractSQLPayload(url: string): string {
    const match = url.match(/(union\s+select.*|or\s+1\s*=\s*1.*|'\s*or\s*'1'\s*=\s*'1.*)/i)
    return match ? match[1] : ""
  }

  private static extractXSSPayload(url: string): string {
    const match = url.match(/(<script.*?>.*?<\/script>|javascript:.*|on\w+\s*=.*)/i)
    return match ? match[1] : ""
  }

  private static extractTraversalPayload(url: string): string {
    const match = url.match(/(\.\.\/.*|\.\.\\.*|\/etc\/.*|\/proc\/.*)/i)
    return match ? match[1] : ""
  }

  private static extractCommandPayload(url: string): string {
    const match = url.match(/([|&;`].*|\$$$.*$$|`.*`)/)
    return match ? match[1] : ""
  }
}

export function detectAttackType(url: string): { types: string[]; confidence: number } {
  const detections: string[] = []
  let maxConfidence = 0

  // SQL Injection detection
  const sqliScore = AttackDetector["detectSQLInjection"](url)
  if (sqliScore > 0.5) {
    detections.push("sql_injection")
    maxConfidence = Math.max(maxConfidence, sqliScore)
  }

  // XSS detection
  const xssScore = AttackDetector["detectXSS"](url)
  if (xssScore > 0.5) {
    detections.push("xss")
    maxConfidence = Math.max(maxConfidence, xssScore)
  }

  // Directory Traversal detection
  const traversalScore = AttackDetector["detectDirectoryTraversal"](url)
  if (traversalScore > 0.5) {
    detections.push("directory_traversal")
    maxConfidence = Math.max(maxConfidence, traversalScore)
  }

  // Command Injection detection
  const cmdScore = AttackDetector["detectCommandInjection"](url)
  if (cmdScore > 0.5) {
    detections.push("command_injection")
    maxConfidence = Math.max(maxConfidence, cmdScore)
  }

  return {
    types: detections,
    confidence: maxConfidence,
  }
}

export function analyzePayload(url: string): { patterns: string[]; risk: string } {
  const patterns: string[] = []
  let riskLevel = "low"

  // Check for various attack patterns
  if (/union\s+select/i.test(url)) patterns.push("SQL Union")
  if (/<script/i.test(url)) patterns.push("Script Tag")
  if (/\.\.\//i.test(url)) patterns.push("Path Traversal")
  if (/[|&;`]/i.test(url)) patterns.push("Command Separator")

  if (patterns.length > 2) riskLevel = "high"
  else if (patterns.length > 0) riskLevel = "medium"

  return { patterns, risk: riskLevel }
}

// Make private methods accessible for the exported functions
declare module "./attack-detector" {
  namespace AttackDetector {
    function detectSQLInjection(url: string): number
    function detectXSS(url: string): number
    function detectDirectoryTraversal(url: string): number
    function detectCommandInjection(url: string): number
  }
}
