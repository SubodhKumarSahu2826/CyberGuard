// Type definitions for the cyber attack detection system

export type AttackType =
  | "sqli"
  | "xss"
  | "directory_traversal"
  | "command_injection"
  | "ssrf"
  | "file_inclusion"
  | "credential_stuffing"
  | "brute_force"
  | "http_parameter_pollution"
  | "xxe"
  | "web_shell"
  | "typosquatting"

export type DetectionStatus = "pending" | "processing" | "completed" | "failed"

export type RiskLevel = "low" | "medium" | "high" | "critical"

export interface URLRecord {
  id: string
  url: string
  domain: string
  path?: string
  query_params?: Record<string, any>
  method: string
  headers?: Record<string, any>
  body?: string
  source_ip?: string
  user_agent?: string
  timestamp: string
  created_at: string
  updated_at: string
}

export interface AttackDetection {
  id: string
  url_id: string
  attack_type: AttackType
  confidence_score: number
  risk_level: RiskLevel
  detection_status: DetectionStatus
  payload?: string
  detection_details?: Record<string, any>
  false_positive: boolean
  created_at: string
  updated_at: string
}

export interface URLFeatures {
  id: string
  url_id: string
  url_length?: number
  domain_length?: number
  path_length?: number
  query_length?: number
  special_char_count?: number
  digit_count?: number
  entropy?: number
  path_depth?: number
  subdomain_count?: number
  parameter_count?: number
  suspicious_keywords?: string[]
  encoded_chars_count?: number
  frequency_score?: number
  created_at: string
}

export interface MLModel {
  id: string
  model_name: string
  version: string
  model_type: string
  accuracy?: number
  precision_score?: number
  recall_score?: number
  f1_score?: number
  model_path: string
  is_active: boolean
  training_data_size?: number
  created_at: string
}

export interface AnalysisRequest {
  url: string
  method?: string
  headers?: Record<string, string>
  body?: string
  source_ip?: string
  user_agent?: string
}

export interface AnalysisResponse {
  url_id: string
  detections: AttackDetection[]
  features: URLFeatures
  overall_risk: RiskLevel
  processing_time_ms: number
}
