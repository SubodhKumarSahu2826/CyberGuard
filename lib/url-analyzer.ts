// URL analysis and feature extraction utilities
import type { URLFeatures } from "./url-features" // Assuming URLFeatures is declared in another file

export class URLAnalyzer {
  static extractFeatures(url: string): Partial<URLFeatures> {
    try {
      const urlObj = new URL(url)
      const domain = urlObj.hostname
      const path = urlObj.pathname
      const queryString = urlObj.search

      // Lexical features
      const urlLength = url.length
      const domainLength = domain.length
      const pathLength = path.length
      const queryLength = queryString.length

      // Count special characters
      const specialCharCount = (url.match(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/g) || []).length
      const digitCount = (url.match(/\d/g) || []).length

      // Calculate entropy
      const entropy = this.calculateEntropy(url)

      // Structural features
      const pathDepth = path.split("/").filter((segment) => segment.length > 0).length
      const subdomainCount = domain.split(".").length - 2 // Subtract main domain and TLD
      const parameterCount = new URLSearchParams(queryString).size

      // Pattern detection
      const suspiciousKeywords = this.detectSuspiciousKeywords(url)
      const encodedCharsCount = this.countEncodedChars(url)

      // Statistical features (simplified for demo)
      const frequencyScore = this.calculateFrequencyScore(url)

      return {
        url_length: urlLength,
        domain_length: domainLength,
        path_length: pathLength,
        query_length: queryLength,
        special_char_count: specialCharCount,
        digit_count: digitCount,
        entropy: entropy,
        path_depth: pathDepth,
        subdomain_count: Math.max(0, subdomainCount),
        parameter_count: parameterCount,
        suspicious_keywords: suspiciousKeywords,
        encoded_chars_count: encodedCharsCount,
        frequency_score: frequencyScore,
      }
    } catch (error) {
      console.error("Error extracting URL features:", error)
      return {}
    }
  }

  private static calculateEntropy(str: string): number {
    const freq: Record<string, number> = {}
    for (const char of str) {
      freq[char] = (freq[char] || 0) + 1
    }

    let entropy = 0
    const length = str.length

    for (const count of Object.values(freq)) {
      const probability = count / length
      entropy -= probability * Math.log2(probability)
    }

    return entropy
  }

  private static detectSuspiciousKeywords(url: string): string[] {
    const keywords = [
      // SQL Injection patterns
      "union",
      "select",
      "insert",
      "delete",
      "drop",
      "exec",
      "script",
      // XSS patterns
      "alert",
      "prompt",
      "confirm",
      "javascript:",
      "vbscript:",
      // Directory traversal
      "../",
      "..\\",
      "/etc/",
      "/proc/",
      "/var/",
      // Command injection
      "|",
      "&",
      ";",
      "`",
      "$(",
      // Common attack patterns
      "admin",
      "root",
      "password",
      "passwd",
      "login",
      "cmd",
      "shell",
    ]

    const lowerUrl = url.toLowerCase()
    return keywords.filter((keyword) => lowerUrl.includes(keyword))
  }

  private static countEncodedChars(url: string): number {
    // Count URL encoded characters (%XX)
    const encodedMatches = url.match(/%[0-9A-Fa-f]{2}/g)
    return encodedMatches ? encodedMatches.length : 0
  }

  private static calculateFrequencyScore(url: string): number {
    // Simplified frequency score based on common patterns
    // In a real implementation, this would use historical data
    const commonPatterns = [".com", ".org", ".net", "www.", "http", "https"]
    let score = 0

    for (const pattern of commonPatterns) {
      if (url.includes(pattern)) {
        score += 0.1
      }
    }

    return Math.min(score, 1.0)
  }
}

export function extractFeatures(url: string): any {
  return URLAnalyzer.extractFeatures(url)
}

export function calculateEntropy(str: string): number {
  return URLAnalyzer["calculateEntropy"](str)
}

// Make private method accessible for the exported function
declare module "./url-analyzer" {
  namespace URLAnalyzer {
    function calculateEntropy(str: string): number
  }
}
