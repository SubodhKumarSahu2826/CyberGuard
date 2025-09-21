import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase environment variables")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function seedSampleData() {
  console.log("🌱 Seeding sample attack detection data...")

  // Sample attack detections
  const sampleDetections = [
    {
      url: "http://malicious-site.com/phishing",
      attack_type: "phishing",
      confidence_score: 0.95,
      risk_level: "high",
      detected_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
      source_ip: "192.168.1.100",
      user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      features: {
        suspicious_keywords: ["login", "verify", "urgent"],
        domain_age: 5,
        ssl_valid: false,
        redirect_count: 3,
      },
    },
    {
      url: "http://suspicious-download.net/malware.exe",
      attack_type: "malware",
      confidence_score: 0.88,
      risk_level: "high",
      detected_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 min ago
      source_ip: "10.0.0.50",
      user_agent: "curl/7.68.0",
      features: {
        file_extension: ".exe",
        suspicious_domain: true,
        known_malware_hash: true,
      },
    },
    {
      url: "http://spam-site.org/click-here",
      attack_type: "spam",
      confidence_score: 0.72,
      risk_level: "medium",
      detected_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 min ago
      source_ip: "172.16.0.25",
      user_agent: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)",
      features: {
        click_bait_phrases: ["click here", "amazing offer"],
        popup_count: 5,
        ad_density: 0.8,
      },
    },
    {
      url: "https://fake-bank.com/login",
      attack_type: "phishing",
      confidence_score: 0.91,
      risk_level: "high",
      detected_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
      source_ip: "203.0.113.45",
      user_agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      features: {
        impersonates_brand: "bank",
        ssl_mismatch: true,
        form_fields: ["username", "password", "ssn"],
      },
    },
    {
      url: "http://ddos-botnet.ru/join",
      attack_type: "botnet",
      confidence_score: 0.85,
      risk_level: "high",
      detected_at: new Date(Date.now() - 1000 * 60 * 20).toISOString(), // 20 min ago
      source_ip: "198.51.100.75",
      user_agent: "Bot/1.0",
      features: {
        suspicious_country: "RU",
        known_botnet_ip: true,
        command_control: true,
      },
    },
  ]

  // Insert sample detections
  const { data: detections, error: detectionsError } = await supabase
    .from("attack_detections")
    .insert(sampleDetections)
    .select()

  if (detectionsError) {
    console.error("Error inserting detections:", detectionsError)
    return
  }

  console.log(`✅ Inserted ${detections.length} sample attack detections`)

  // Sample network traffic data
  const sampleTraffic = [
    {
      source_ip: "192.168.1.100",
      destination_ip: "203.0.113.10",
      source_port: 443,
      destination_port: 80,
      protocol: "TCP",
      packet_size: 1024,
      timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      flags: ["SYN", "ACK"],
      payload_hash: "a1b2c3d4e5f6",
    },
    {
      source_ip: "10.0.0.50",
      destination_ip: "198.51.100.20",
      source_port: 80,
      destination_port: 443,
      protocol: "HTTP",
      packet_size: 2048,
      timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
      flags: ["GET"],
      payload_hash: "f6e5d4c3b2a1",
    },
  ]

  const { data: traffic, error: trafficError } = await supabase.from("network_traffic").insert(sampleTraffic).select()

  if (trafficError) {
    console.error("Error inserting traffic:", trafficError)
    return
  }

  console.log(`✅ Inserted ${traffic.length} sample network traffic records`)

  // Sample threat intelligence
  const sampleThreats = [
    {
      indicator_type: "domain",
      indicator_value: "malicious-site.com",
      threat_type: "phishing",
      confidence: 0.95,
      source: "threat_feed_alpha",
      first_seen: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
      last_seen: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      tags: ["phishing", "credential-theft"],
      description: "Known phishing domain targeting banking credentials",
    },
    {
      indicator_type: "ip",
      indicator_value: "203.0.113.45",
      threat_type: "malware",
      confidence: 0.88,
      source: "internal_analysis",
      first_seen: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12 hours ago
      last_seen: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      tags: ["c2", "botnet"],
      description: "Command and control server for banking trojan",
    },
  ]

  const { data: threats, error: threatsError } = await supabase
    .from("threat_intelligence")
    .insert(sampleThreats)
    .select()

  if (threatsError) {
    console.error("Error inserting threats:", threatsError)
    return
  }

  console.log(`✅ Inserted ${threats.length} sample threat intelligence records`)

  console.log("🎉 Sample data seeding completed!")
  console.log("Your dashboard should now display attack detection data, charts, and statistics.")
}

seedSampleData().catch(console.error)
