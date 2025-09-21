# Deployment Guide

## Overview

This guide covers deploying the Cyber Attack Detection System to production environments.

## Prerequisites

- Node.js 18+
- Python 3.8+
- Supabase account
- Vercel account (recommended)
- Domain name (optional)

## Environment Setup

### 1. Environment Variables

Create a `.env.production` file with the following variables:

\`\`\`bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Security
ENCRYPTION_KEY=your-32-character-encryption-key
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=https://your-domain.com

# Python Configuration
PYTHON_PATH=/usr/bin/python3

# Optional: Redis for caching
REDIS_URL=redis://your-redis-instance

# Optional: Monitoring
SENTRY_DSN=your-sentry-dsn
\`\`\`

### 2. Database Setup

#### Production Database Migration

1. **Create Supabase Project**
   \`\`\`bash
   # Install Supabase CLI
   npm install -g supabase
   
   # Login to Supabase
   supabase login
   
   # Link to your project
   supabase link --project-ref your-project-ref
   \`\`\`

2. **Run Migrations**
   \`\`\`bash
   # Apply database schema
   supabase db push
   
   # Or run SQL scripts manually
   psql -h your-host -U postgres -d postgres -f scripts/001_create_attack_detection_tables.sql
   psql -h your-host -U postgres -d postgres -f scripts/002_create_sample_data.sql
   psql -h your-host -U postgres -d postgres -f scripts/003_create_rls_policies.sql
   \`\`\`

3. **Verify Database Setup**
   \`\`\`sql
   -- Check tables exist
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public';
   
   -- Verify RLS policies
   SELECT schemaname, tablename, policyname 
   FROM pg_policies;
   \`\`\`

## Deployment Options

### Option 1: Vercel (Recommended)

#### 1. Install Vercel CLI
\`\`\`bash
npm install -g vercel
\`\`\`

#### 2. Configure Project
\`\`\`bash
# Login to Vercel
vercel login

# Initialize project
vercel

# Set environment variables
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add ENCRYPTION_KEY
\`\`\`

#### 3. Deploy
\`\`\`bash
# Build and deploy
vercel --prod
\`\`\`

#### 4. Configure Custom Domain (Optional)
\`\`\`bash
vercel domains add your-domain.com
\`\`\`

### Option 2: Docker Deployment

#### 1. Create Dockerfile
\`\`\`dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat python3 py3-pip
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Install Python dependencies
COPY requirements.txt ./
RUN pip3 install -r requirements.txt

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
\`\`\`

#### 2. Build and Run
\`\`\`bash
# Build image
docker build -t cyber-attack-detection .

# Run container
docker run -p 3000:3000 \
  -e SUPABASE_URL=your-url \
  -e SUPABASE_ANON_KEY=your-key \
  cyber-attack-detection
\`\`\`

### Option 3: Traditional Server

#### 1. Server Setup
\`\`\`bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Python
sudo apt install python3 python3-pip

# Install PM2 for process management
npm install -g pm2
\`\`\`

#### 2. Application Setup
\`\`\`bash
# Clone repository
git clone <your-repo-url>
cd cyber-attack-detection

# Install dependencies
npm install
pip3 install -r requirements.txt

# Build application
npm run build

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
\`\`\`

#### 3. Nginx Configuration
\`\`\`nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
\`\`\`

## ML Model Deployment

### 1. Model Training
\`\`\`bash
# Train models on production data
python scripts/ml_training.py --environment production

# Verify model performance
python scripts/model_validation.py
\`\`\`

### 2. Model Serving
\`\`\`bash
# Start ML inference service
python scripts/ml_inference.py --port 8001 --workers 4
\`\`\`

### 3. Model Updates
\`\`\`bash
# Schedule regular retraining
crontab -e

# Add cron job for weekly retraining
0 2 * * 0 cd /path/to/app && python scripts/ml_training.py
\`\`\`

## Monitoring and Logging

### 1. Application Monitoring
\`\`\`bash
# Install monitoring tools
npm install @sentry/nextjs

# Configure Sentry
# Add to next.config.js
const { withSentryConfig } = require('@sentry/nextjs');
\`\`\`

### 2. Database Monitoring
\`\`\`sql
-- Create monitoring views
CREATE VIEW attack_detection_stats AS
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_detections,
  COUNT(*) FILTER (WHERE attack_detected = true) as attacks_detected
FROM attack_detections
GROUP BY DATE(created_at);
\`\`\`

### 3. Log Management
\`\`\`bash
# Configure log rotation
sudo nano /etc/logrotate.d/cyber-attack-detection

/var/log/cyber-attack-detection/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
}
\`\`\`

## Security Hardening

### 1. SSL/TLS Configuration
\`\`\`bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com
\`\`\`

### 2. Firewall Setup
\`\`\`bash
# Configure UFW
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
\`\`\`

### 3. Security Headers
\`\`\`javascript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  }
];
\`\`\`

## Performance Optimization

### 1. Caching Strategy
\`\`\`javascript
// Configure Redis caching
const redis = new Redis(process.env.REDIS_URL);

// Cache frequently accessed data
await redis.setex(`stats:${period}`, 300, JSON.stringify(stats));
\`\`\`

### 2. Database Optimization
\`\`\`sql
-- Create indexes for better performance
CREATE INDEX idx_attack_detections_timestamp ON attack_detections(created_at);
CREATE INDEX idx_attack_detections_source_ip ON attack_detections(source_ip);
CREATE INDEX idx_attack_detections_attack_type ON attack_detections(attack_types);
\`\`\`

### 3. CDN Configuration
\`\`\`bash
# Configure Vercel Edge Network
# Add to vercel.json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "s-maxage=60, stale-while-revalidate"
        }
      ]
    }
  ]
}
\`\`\`

## Backup and Recovery

### 1. Database Backups
\`\`\`bash
# Automated daily backups
#!/bin/bash
pg_dump -h your-host -U postgres -d your-db > backup_$(date +%Y%m%d).sql
aws s3 cp backup_$(date +%Y%m%d).sql s3://your-backup-bucket/
\`\`\`

### 2. Application Backups
\`\`\`bash
# Backup application files
tar -czf app_backup_$(date +%Y%m%d).tar.gz /path/to/app
\`\`\`

## Health Checks

### 1. Application Health
\`\`\`javascript
// pages/api/health.js
export default function handler(req, res) {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version
  });
}
\`\`\`

### 2. Database Health
\`\`\`sql
-- Health check query
SELECT 
  'database' as component,
  CASE WHEN COUNT(*) > 0 THEN 'healthy' ELSE 'unhealthy' END as status
FROM pg_stat_activity;
\`\`\`

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   \`\`\`bash
   # Check connection
   psql -h your-host -U postgres -d your-db -c "SELECT 1;"
   \`\`\`

2. **ML Model Loading Issues**
   \`\`\`bash
   # Verify Python dependencies
   pip3 list | grep -E "(scikit-learn|xgboost|pandas)"
   \`\`\`

3. **Memory Issues**
   \`\`\`bash
   # Monitor memory usage
   free -h
   pm2 monit
   \`\`\`

### Log Analysis
\`\`\`bash
# Check application logs
pm2 logs cyber-attack-detection

# Check system logs
sudo journalctl -u nginx -f
\`\`\`

## Scaling Considerations

### Horizontal Scaling
- Use load balancers (Nginx, HAProxy)
- Deploy multiple application instances
- Implement session storage (Redis)

### Database Scaling
- Read replicas for query performance
- Connection pooling (PgBouncer)
- Database sharding for large datasets

### ML Model Scaling
- Model serving with multiple workers
- GPU acceleration for inference
- Model caching and optimization
\`\`\`

```json file="" isHidden
