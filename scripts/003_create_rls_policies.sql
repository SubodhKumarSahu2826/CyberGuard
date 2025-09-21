-- Enable Row Level Security on all tables
ALTER TABLE urls ENABLE ROW LEVEL SECURITY;
ALTER TABLE attack_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE url_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE pcap_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users to access all data
-- In a production environment, you would want more granular policies

-- URLs policies
CREATE POLICY "Allow authenticated users to view urls" ON urls
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to insert urls" ON urls
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to update urls" ON urls
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Attack detections policies
CREATE POLICY "Allow authenticated users to view attack_detections" ON attack_detections
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to insert attack_detections" ON attack_detections
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to update attack_detections" ON attack_detections
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- URL features policies
CREATE POLICY "Allow authenticated users to view url_features" ON url_features
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to insert url_features" ON url_features
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- PCAP files policies
CREATE POLICY "Allow authenticated users to view pcap_files" ON pcap_files
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to insert pcap_files" ON pcap_files
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to update pcap_files" ON pcap_files
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ML models policies (read-only for most users)
CREATE POLICY "Allow authenticated users to view ml_models" ON ml_models
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Audit logs policies (read-only)
CREATE POLICY "Allow authenticated users to view audit_logs" ON audit_logs
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow system to insert audit_logs" ON audit_logs
  FOR INSERT WITH CHECK (true);
