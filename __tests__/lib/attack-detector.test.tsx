import { describe, it, expect } from "@jest/globals"
import { detectAttackType } from "@/lib/attack-detector"

describe("Attack Detector", () => {
  it("should detect SQL injection patterns", () => {
    const sqlInjectionUrls = [
      "http://example.com/search?id=1' OR '1'='1",
      "http://example.com/user?id=1; DROP TABLE users--",
      "http://example.com/login?user=admin'/**/UNION/**/SELECT/**/",
    ]

    sqlInjectionUrls.forEach((url) => {
      const result = detectAttackType(url)
      expect(result.types).toContain("sql_injection")
      expect(result.confidence).toBeGreaterThan(0.7)
    })
  })

  it("should detect XSS patterns", () => {
    const xssUrls = [
      'http://example.com/search?q=<script>alert("xss")</script>',
      "http://example.com/comment?text=<img src=x onerror=alert(1)>",
      "http://example.com/profile?name=javascript:alert(document.cookie)",
    ]

    xssUrls.forEach((url) => {
      const result = detectAttackType(url)
      expect(result.types).toContain("xss")
      expect(result.confidence).toBeGreaterThan(0.7)
    })
  })

  it("should detect directory traversal", () => {
    const traversalUrls = [
      "http://example.com/file?path=../../../etc/passwd",
      "http://example.com/download?file=..\\..\\windows\\system32\\config\\sam",
      "http://example.com/view?page=....//....//etc/hosts",
    ]

    traversalUrls.forEach((url) => {
      const result = detectAttackType(url)
      expect(result.types).toContain("directory_traversal")
      expect(result.confidence).toBeGreaterThan(0.7)
    })
  })

  it("should not flag clean URLs", () => {
    const cleanUrls = [
      "https://example.com/about",
      "https://example.com/products/laptop",
      "https://example.com/search?q=javascript+tutorial",
    ]

    cleanUrls.forEach((url) => {
      const result = detectAttackType(url)
      expect(result.types).toHaveLength(0)
      expect(result.confidence).toBeLessThan(0.3)
    })
  })
})
