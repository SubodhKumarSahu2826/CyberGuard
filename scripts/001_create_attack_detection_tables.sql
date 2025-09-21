-- Create enum for attack types
CREATE TYPE attack_type AS ENUM (
  'sqli',
  'xss', 
  'directory_traversal',
  'command_injection',
  'ssrf',
  'file_inclusion',
  'credential_stuffing',
  'brute_force',
  'http_parameter_pollution',
  'xxe',
  'web_shell',
  'typosquatting'
);

-- Create enum for detection status
CREATE TYPE detection_status AS ENUM (
  'pending',
  'processing',
  'completed',
  'failed'
);

-- Create enum for risk level
CREATE TYPE risk_level AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);

-- URLs table to store analyzed URLs
CREATE TABLE IF NOT EXISTS urls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  domain TEXT NOT NULL,
  path TEXT,
  query_params JSONB,
  method VARCHAR(10) DEFAULT 'GET',
  headers JSONB,
  body TEXT,
  source_ip INET,
  user_agent TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attack detections table
CREATE TABLE IF NOT EXISTS attack_detections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url_id UUID NOT NULL REFERENCES urls(id) ON DELETE CASCADE,
  attack_type attack_type NOT NULL,
  confidence_score DECIMAL(5,4) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  risk_level risk_level NOT NULL,
  detection_status detection_status DEFAULT 'pending',
  payload TEXT,
  detection_details JSONB,
  false_positive BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feature extractions table for ML features
CREATE TABLE IF NOT EXISTS url_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url_id UUID NOT NULL REFERENCES urls(id) ON DELETE CASCADE,
  -- Lexical features
  url_length INTEGER,
  domain_length INTEGER,
  path_length INTEGER,
  query_length INTEGER,
  special_char_count INTEGER,
  digit_count INTEGER,
  entropy DECIMAL(10,6),
  -- Structural features
  path_depth INTEGER,
  subdomain_count INTEGER,
  parameter_count INTEGER,
  -- Pattern features
  suspicious_keywords JSONB,
  encoded_chars_count INTEGER,
  -- Statistical features
  frequency_score DECIMAL(10,6),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PCAP files table for uploaded packet captures
CREATE TABLE IF NOT EXISTS pcap_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_path TEXT NOT NULL,
  upload_timestamp TIMESTAMPTZ DEFAULT NOW(),
  processing_status detection_status DEFAULT 'pending',
  extracted_urls_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ML models table for model versioning
CREATE TABLE IF NOT EXISTS ml_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name TEXT NOT NULL,
  version TEXT NOT NULL,
  model_type TEXT NOT NULL, -- 'random_forest', 'xgboost', 'ensemble'
  accuracy DECIMAL(5,4),
  precision_score DECIMAL(5,4),
  recall_score DECIMAL(5,4),
  f1_score DECIMAL(5,4),
  model_path TEXT NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  training_data_size INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(model_name, version)
);

-- Audit logs for security tracking
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  user_id UUID,
  ip_address INET,
  user_agent TEXT,
  details JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_urls_domain ON urls(domain);
CREATE INDEX IF NOT EXISTS idx_urls_timestamp ON urls(timestamp);
CREATE INDEX IF NOT EXISTS idx_urls_source_ip ON urls(source_ip);
CREATE INDEX IF NOT EXISTS idx_attack_detections_url_id ON attack_detections(url_id);
CREATE INDEX IF NOT EXISTS idx_attack_detections_type ON attack_detections(attack_type);
CREATE INDEX IF NOT EXISTS idx_attack_detections_risk_level ON attack_detections(risk_level);
CREATE INDEX IF NOT EXISTS idx_attack_detections_created_at ON attack_detections(created_at);
CREATE INDEX IF NOT EXISTS idx_url_features_url_id ON url_features(url_id);
CREATE INDEX IF NOT EXISTS idx_pcap_files_status ON pcap_files(processing_status);
CREATE INDEX IF NOT EXISTS idx_ml_models_active ON ml_models(is_active);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_urls_updated_at BEFORE UPDATE ON urls
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attack_detections_updated_at BEFORE UPDATE ON attack_detections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
