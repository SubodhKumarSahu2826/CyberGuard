# API Reference

## Authentication

All API endpoints require authentication. Include the authorization header:

\`\`\`
Authorization: Bearer <your-token>
\`\`\`

## Base URL

\`\`\`
https://your-domain.com/api
\`\`\`

## Endpoints

### URL Analysis

#### POST /api/analyze

Analyze a single URL for potential cyber attacks.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| url | string | Yes | The URL to analyze |
| source_ip | string | Yes | Source IP address |
| user_agent | string | No | User agent string |
| timestamp | string | No | ISO timestamp |

**Example Request:**

\`\`\`bash
curl -X POST https://your-domain.com/api/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "url": "http://example.com/search?q=test",
    "source_ip": "192.168.1.100"
  }'
\`\`\`

**Example Response:**

\`\`\`json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "url": "http://example.com/search?q=test",
  "attack_detected": false,
  "attack_types": [],
  "confidence_score": 0.15,
  "risk_level": "low",
  "timestamp": "2024-01-15T10:30:00Z",
  "features": {
    "url_length": 32,
    "domain_length": 11,
    "path_depth": 1,
    "query_params_count": 1,
    "entropy": 2.8,
    "special_char_count": 4,
    "suspicious_keyword_count": 0,
    "has_suspicious_keywords": false,
    "has_script_tags": false,
    "has_sql_keywords": false
  },
  "processing_time_ms": 45
}
\`\`\`

#### POST /api/ml/batch-predict

Analyze multiple URLs in a single request.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| urls | array | Yes | Array of URL objects |

**Example Request:**

\`\`\`json
{
  "urls": [
    {
      "url": "http://example.com/page1",
      "source_ip": "192.168.1.100"
    },
    {
      "url": "http://example.com/page2",
      "source_ip": "192.168.1.101"
    }
  ]
}
\`\`\`

### Detection History

#### GET /api/detections

Retrieve detection history with optional filtering.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| limit | integer | 50 | Number of results to return |
| offset | integer | 0 | Pagination offset |
| attack_type | string | - | Filter by attack type |
| risk_level | string | - | Filter by risk level (low/medium/high/critical) |
| start_date | string | - | Start date (ISO format) |
| end_date | string | - | End date (ISO format) |
| source_ip | string | - | Filter by source IP |

**Example Request:**

\`\`\`bash
curl "https://your-domain.com/api/detections?limit=10&attack_type=sql_injection&risk_level=high" \
  -H "Authorization: Bearer <token>"
\`\`\`

**Example Response:**

\`\`\`json
{
  "detections": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "url": "http://malicious.com/search?id=1' OR '1'='1",
      "attack_detected": true,
      "attack_types": ["sql_injection"],
      "confidence_score": 0.95,
      "risk_level": "high",
      "source_ip": "192.168.1.100",
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 1,
  "limit": 10,
  "offset": 0
}
\`\`\`

### Statistics

#### GET /api/stats

Get system statistics and metrics.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| period | string | 24h | Time period (1h, 24h, 7d, 30d) |

**Example Response:**

\`\`\`json
{
  "period": "24h",
  "total_urls_analyzed": 15420,
  "attacks_detected": 342,
  "attack_rate": 0.022,
  "attack_types": {
    "sql_injection": 145,
    "xss": 89,
    "directory_traversal": 67,
    "command_injection": 41
  },
  "risk_levels": {
    "low": 12450,
    "medium": 2628,
    "high": 298,
    "critical": 44
  },
  "top_attacking_ips": [
    {
      "ip": "192.168.1.100",
      "count": 23,
      "last_seen": "2024-01-15T10:30:00Z"
    }
  ]
}
\`\`\`

### File Upload

#### POST /api/upload/pcap

Upload and process PCAP files for URL extraction and analysis.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| file | file | Yes | PCAP file to upload |
| auto_analyze | boolean | No | Automatically analyze extracted URLs |

**Example Request:**

\`\`\`bash
curl -X POST https://your-domain.com/api/upload/pcap \
  -H "Authorization: Bearer <token>" \
  -F "file=@capture.pcap" \
  -F "auto_analyze=true"
\`\`\`

**Example Response:**

\`\`\`json
{
  "file_id": "550e8400-e29b-41d4-a716-446655440000",
  "filename": "capture.pcap",
  "size": 1048576,
  "status": "processing",
  "urls_extracted": 0,
  "estimated_completion": "2024-01-15T10:35:00Z",
  "upload_timestamp": "2024-01-15T10:30:00Z"
}
\`\`\`

### Live Capture

#### POST /api/capture/start

Start live HTTP URL capture.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| interface | string | No | Network interface to monitor |
| filter | string | No | BPF filter expression |
| duration | integer | No | Capture duration in seconds |

#### POST /api/capture/stop

Stop active URL capture session.

#### GET /api/capture/status

Get current capture session status.

## Error Responses

All endpoints return consistent error responses:

\`\`\`json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "The provided URL is not valid",
    "details": {
      "field": "url",
      "value": "not-a-url"
    }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
\`\`\`

### Error Codes

| Code | Description |
|------|-------------|
| INVALID_REQUEST | Request validation failed |
| UNAUTHORIZED | Authentication required |
| FORBIDDEN | Insufficient permissions |
| NOT_FOUND | Resource not found |
| RATE_LIMITED | Too many requests |
| INTERNAL_ERROR | Server error |

## Rate Limits

- **Analysis endpoints**: 1000 requests/hour per API key
- **Upload endpoints**: 100 requests/hour per API key
- **Query endpoints**: 5000 requests/hour per API key

Rate limit headers are included in responses:

\`\`\`
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642248000
