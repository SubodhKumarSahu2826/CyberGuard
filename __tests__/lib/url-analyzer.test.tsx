import { describe, it, expect } from "@jest/globals"
import { extractFeatures, calculateEntropy } from "@/lib/url-analyzer"

describe("URL Analyzer", () => {
  it("should extract basic URL features", () => {
    const url = "https://example.com/path/to/resource?param=value"
    const features = extractFeatures(url)

    expect(features.url_length).toBe(url.length)
    expect(features.domain_length).toBe("example.com".length)
    expect(features.path_depth).toBe(3)
    expect(features.query_params_count).toBe(1)
    expect(features.has_suspicious_keywords).toBe(false)
  })

  it("should detect suspicious keywords", () => {
    const url = "http://example.com/admin/login?user=admin&pass=password"
    const features = extractFeatures(url)

    expect(features.has_suspicious_keywords).toBe(true)
    expect(features.suspicious_keyword_count).toBeGreaterThan(0)
  })

  it("should calculate URL entropy correctly", () => {
    const lowEntropyUrl = "http://example.com/aaaaaaa"
    const highEntropyUrl = "http://example.com/x9k2m8n4p7q1w5e3r6t"

    const lowEntropy = calculateEntropy(lowEntropyUrl)
    const highEntropy = calculateEntropy(highEntropyUrl)

    expect(highEntropy).toBeGreaterThan(lowEntropy)
  })

  it("should detect special characters", () => {
    const url = "http://example.com/search?q=<script>alert(1)</script>"
    const features = extractFeatures(url)

    expect(features.special_char_count).toBeGreaterThan(0)
    expect(features.has_script_tags).toBe(true)
  })
})
