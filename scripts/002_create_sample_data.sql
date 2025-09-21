-- Insert sample ML model
INSERT INTO ml_models (
  model_name,
  version,
  model_type,
  accuracy,
  precision_score,
  recall_score,
  f1_score,
  model_path,
  is_active,
  training_data_size
) VALUES (
  'cyber_attack_detector',
  '1.0.0',
  'ensemble',
  0.9542,
  0.9321,
  0.9456,
  0.9388,
  '/models/cyber_attack_detector_v1.pkl',
  TRUE,
  50000
) ON CONFLICT (model_name, version) DO NOTHING;

-- Insert sample URLs for testing
INSERT INTO urls (url, domain, path, query_params, method, source_ip, user_agent) VALUES
(
  'https://example.com/admin/login.php?user=admin&pass=123',
  'example.com',
  '/admin/login.php',
  '{"user": "admin", "pass": "123"}',
  'GET',
  '192.168.1.100',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
),
(
  'https://vulnerable-site.com/search?q=<script>alert(1)</script>',
  'vulnerable-site.com',
  '/search',
  '{"q": "<script>alert(1)</script>"}',
  'GET',
  '10.0.0.50',
  'curl/7.68.0'
),
(
  'https://target.com/file.php?path=../../../etc/passwd',
  'target.com',
  '/file.php',
  '{"path": "../../../etc/passwd"}',
  'GET',
  '203.0.113.45',
  'python-requests/2.25.1'
);

-- Insert corresponding attack detections
INSERT INTO attack_detections (url_id, attack_type, confidence_score, risk_level, detection_status, payload, detection_details)
SELECT 
  u.id,
  'credential_stuffing',
  0.8945,
  'high',
  'completed',
  'user=admin&pass=123',
  '{"patterns_matched": ["common_credentials", "admin_path"], "ml_score": 0.8945}'
FROM urls u WHERE u.domain = 'example.com';

INSERT INTO attack_detections (url_id, attack_type, confidence_score, risk_level, detection_status, payload, detection_details)
SELECT 
  u.id,
  'xss',
  0.9876,
  'critical',
  'completed',
  '<script>alert(1)</script>',
  '{"patterns_matched": ["script_tag", "javascript_execution"], "ml_score": 0.9876}'
FROM urls u WHERE u.domain = 'vulnerable-site.com';

INSERT INTO attack_detections (url_id, attack_type, confidence_score, risk_level, detection_status, payload, detection_details)
SELECT 
  u.id,
  'directory_traversal',
  0.9234,
  'critical',
  'completed',
  '../../../etc/passwd',
  '{"patterns_matched": ["path_traversal", "system_file"], "ml_score": 0.9234}'
FROM urls u WHERE u.domain = 'target.com';
