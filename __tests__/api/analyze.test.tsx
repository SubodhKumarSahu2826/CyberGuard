import { describe, it, expect, beforeEach, afterEach } from "@jest/globals"
import { createMocks } from "node-mocks-http"
import { POST } from "@/app/api/analyze/route"

describe("/api/analyze", () => {
  beforeEach(() => {
    // Reset any mocks or test data
  })

  afterEach(() => {
    // Clean up after tests
  })

  it("should analyze a URL and detect SQL injection", async () => {
    const { req } = createMocks({
      method: "POST",
      body: {
        url: "http://example.com/search?q=' OR 1=1--",
        source_ip: "192.168.1.100",
      },
    })

    const response = await POST(req as any)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.attack_detected).toBe(true)
    expect(data.attack_types).toContain("sql_injection")
    expect(data.confidence_score).toBeGreaterThan(0.8)
  })

  it("should analyze a clean URL and return no threats", async () => {
    const { req } = createMocks({
      method: "POST",
      body: {
        url: "https://example.com/about",
        source_ip: "192.168.1.100",
      },
    })

    const response = await POST(req as any)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.attack_detected).toBe(false)
    expect(data.attack_types).toHaveLength(0)
  })

  it("should handle invalid URL format", async () => {
    const { req } = createMocks({
      method: "POST",
      body: {
        url: "not-a-valid-url",
        source_ip: "192.168.1.100",
      },
    })

    const response = await POST(req as any)
    expect(response.status).toBe(400)
  })

  it("should detect XSS attacks", async () => {
    const { req } = createMocks({
      method: "POST",
      body: {
        url: 'http://example.com/search?q=<script>alert("xss")</script>',
        source_ip: "192.168.1.100",
      },
    })

    const response = await POST(req as any)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.attack_detected).toBe(true)
    expect(data.attack_types).toContain("xss")
  })
})
