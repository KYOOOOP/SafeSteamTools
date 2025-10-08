# SafeSteamTools Deployment Guide 🚀

This guide covers multiple deployment options for SafeSteamTools, from local development to production environments.

## Table of Contents
1. [Quick Start (Windows Executable)](#quick-start-windows-executable)
2. [Docker Deployment](#docker-deployment)
3. [Cloud Deployment](#cloud-deployment)
4. [Manual Deployment](#manual-deployment)
5. [Environment Configuration](#environment-configuration)
6. [Security Considerations](#security-considerations)
7. [Monitoring and Maintenance](#monitoring-and-maintenance)

## Quick Start (Windows Executable)

### For Windows Users - One-Click Install

1. **Download the latest release**:
   ```
   https://github.com/KYOOOOP/SafeSteamTools/releases/latest
   ```
   Download: `SafeSteamTools-v1.0.0-windows.zip`

2. **Extract and setup**:
   ```bash
   # Extract ZIP file
   # Double-click INSTALL.bat for guided setup
   
   # Or manual setup:
   copy .env.example .env
   # Edit .env with your Steam API key
   ```

3. **Get Steam API key**:
   - Visit: https://steamcommunity.com/dev/apikey
   - Copy your API key to `.env` file:
     ```
     STEAM_API_KEY=your_32_character_hex_key
     ```

4. **Run the application**:
   ```bash
   SafeSteamTools.exe
   ```

5. **Access the web interface**:
   - Open browser: http://localhost:3001
   - API available at: http://localhost:3001/api

### Verification
```bash
# Test the API
curl http://localhost:3001/health

# Should return:
{"status":"healthy","timestamp":"...","version":"1.0.0"}
```

## Docker Deployment

### Development Environment

```bash
# Clone repository
git clone https://github.com/KYOOOOP/SafeSteamTools.git
cd SafeSteamTools

# Setup environment
cp .env.example .env
# Edit .env with your Steam API key

# Start all services
docker-compose up --build
```

Services will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- PostgreSQL: localhost:5432
- Redis: localhost:6379

### Production Docker Setup

1. **Create production docker-compose**:
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  frontend:
    image: safesteamtools/frontend:latest
    ports:
      - "80:3000"
    environment:
      - NEXT_PUBLIC_API_URL=https://your-api-domain.com
      - NODE_ENV=production
    restart: unless-stopped

  backend:
    image: safesteamtools/backend:latest
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - STEAM_API_KEY=${STEAM_API_KEY}
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=safesteam
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

2. **Deploy**:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Cloud Deployment

### Option 1: Vercel (Frontend) + Render (Backend)

#### Frontend on Vercel

1. **Fork the repository** on GitHub

2. **Connect to Vercel**:
   - Visit https://vercel.com/new
   - Import your forked repository
   - Set root directory to `frontend`
   - Configure environment variables:
     ```
     NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
     ```

#### Backend on Render

1. **Create new Web Service**:
   - Connect your GitHub repository
   - Set root directory to `backend`
   - Build command: `npm install && npm run build`
   - Start command: `npm start`

2. **Environment variables**:
   ```
   NODE_ENV=production
   STEAM_API_KEY=your_steam_api_key
   DATABASE_URL=your_postgres_connection_string
   REDIS_URL=your_redis_connection_string
   PORT=3001
   ```

3. **Add PostgreSQL**:
   - Create Render PostgreSQL service
   - Use connection string in `DATABASE_URL`

### Option 2: Railway

1. **Deploy with one click**:
   ```
   https://railway.app/new/template/SafeSteamTools
   ```

2. **Or manual deployment**:
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login and deploy
   railway login
   railway link
   railway up
   ```

### Option 3: DigitalOcean App Platform

1. **Create App Spec** (`app.yaml`):
```yaml
name: safesteamtools
region: nyc
services:
  - name: backend
    source_dir: backend
    github:
      repo: your-username/SafeSteamTools
      branch: main
    run_command: npm start
    environment_slug: node-js
    instance_count: 1
    instance_size_slug: basic-xxs
    envs:
      - key: STEAM_API_KEY
        value: your_steam_api_key
        type: SECRET
      - key: NODE_ENV
        value: production
        
  - name: frontend
    source_dir: frontend
    github:
      repo: your-username/SafeSteamTools
      branch: main
    run_command: npm start
    environment_slug: node-js
    instance_count: 1
    instance_size_slug: basic-xxs
    envs:
      - key: NEXT_PUBLIC_API_URL
        value: ${backend.PUBLIC_URL}
        
databases:
  - name: postgres
    engine: PG
    version: "15"
```

## Manual Deployment

### Prerequisites
- Node.js 18+
- PostgreSQL 13+
- Redis 6+
- PM2 (for process management)

### Backend Setup

1. **Clone and build**:
```bash
git clone https://github.com/KYOOOOP/SafeSteamTools.git
cd SafeSteamTools/backend
npm ci --production
npm run build
```

2. **Configure environment**:
```bash
cp .env.example .env
# Edit .env with production values
```

3. **Setup database**:
```bash
# Create database
createdb safesteam

# Run migrations
psql -d safesteam -f database/init.sql
```

4. **Start with PM2**:
```bash
npm install -g pm2
pm2 start ecosystem.config.js --env production
```

### Frontend Setup

1. **Build frontend**:
```bash
cd ../frontend
npm ci --production
npm run build
```

2. **Serve with Nginx**:
```nginx
# /etc/nginx/sites-available/safesteamtools
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Environment Configuration

### Required Environment Variables

```bash
# Steam API Configuration
STEAM_API_KEY=your_32_character_hex_api_key    # Required

# Database Configuration  
DATABASE_URL=postgresql://user:pass@host:port/db
REDIS_URL=redis://host:port

# Server Configuration
PORT=3001                                      # Default: 3001
NODE_ENV=production                            # production|development
CORS_ORIGIN=https://your-frontend-domain.com

# Security Configuration
RATE_LIMIT_WINDOW_MS=900000                    # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100                    # Max requests per window
CACHE_TTL_SECONDS=300                          # Cache TTL (5 minutes)
```

### Optional Environment Variables

```bash
# Frontend Configuration
NEXT_PUBLIC_API_URL=https://your-api-domain.com
NEXT_PUBLIC_STEAM_COMMUNITY_URL=https://steamcommunity.com

# Monitoring
SENTRY_DSN=your_sentry_dsn
NEW_RELIC_LICENSE_KEY=your_newrelic_key
```

## Security Considerations

### Production Security Checklist

- ✅ **HTTPS Only**: Enforce SSL/TLS encryption
- ✅ **Environment Variables**: Never hardcode secrets
- ✅ **Rate Limiting**: Configure appropriate limits
- ✅ **Firewall**: Restrict unnecessary ports
- ✅ **Updates**: Keep dependencies updated
- ✅ **Monitoring**: Implement security monitoring
- ✅ **Backups**: Regular database backups
- ✅ **Access Control**: Limit server access

### Nginx Security Headers

```nginx
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

### Database Security

```sql
-- Create limited user for application
CREATE USER safesteam_app WITH PASSWORD 'secure_random_password';
GRANT CONNECT ON DATABASE safesteam TO safesteam_app;
GRANT USAGE ON SCHEMA public TO safesteam_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO safesteam_app;
```

## Monitoring and Maintenance

### Health Monitoring

```bash
# Backend health check
curl https://your-api.com/health

# Expected response:
{"status":"healthy","timestamp":"...","version":"1.0.0"}
```

### Log Monitoring

```bash
# PM2 logs
pm2 logs safesteamtools-backend

# Docker logs
docker-compose logs -f backend

# System logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Performance Monitoring

```bash
# Database connections
psql -c "SELECT count(*) FROM pg_stat_activity;"

# Redis memory usage
redis-cli info memory

# System resources
htop
df -h
free -h
```

### Backup Strategy

```bash
# Database backup
pg_dump safesteam > backup_$(date +%Y%m%d_%H%M%S).sql

# Automated backup script
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump safesteam | gzip > "/backups/safesteam_$DATE.sql.gz"

# Keep only last 7 days
find /backups -name "safesteam_*.sql.gz" -mtime +7 -delete
```

### Update Procedure

```bash
# 1. Backup current version
pg_dump safesteam > pre_update_backup.sql

# 2. Pull latest changes
git pull origin main

# 3. Install dependencies
npm ci --production

# 4. Build application
npm run build

# 5. Restart services
pm2 restart safesteamtools-backend

# 6. Verify deployment
curl https://your-api.com/health
```

## Troubleshooting

### Common Issues

**Issue**: `STEAM_API_KEY` not working
```bash
# Verify API key format (32 hex characters)
echo $STEAM_API_KEY | grep -E '^[A-F0-9]{32}$'

# Test API key directly
curl "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=$STEAM_API_KEY&steamids=76561198000000000"
```

**Issue**: Database connection failed
```bash
# Test PostgreSQL connection
psql $DATABASE_URL -c "SELECT version();"

# Check if database exists
psql $DATABASE_URL -c "\l"
```

**Issue**: Redis connection failed
```bash
# Test Redis connection
redis-cli -u $REDIS_URL ping

# Check Redis status
redis-cli info replication
```

**Issue**: High memory usage
```bash
# Check Node.js memory usage
pm2 show safesteamtools-backend

# Restart if necessary
pm2 restart safesteamtools-backend

# Configure memory limits
pm2 start --max-memory-restart 512M
```

## Support

For deployment issues:
1. Check [GitHub Issues](https://github.com/KYOOOOP/SafeSteamTools/issues)
2. Review [Security Guidelines](.github/SECURITY.md)
3. Create new issue with:
   - Deployment method used
   - Error messages
   - Environment details
   - Steps to reproduce

---

**Successfully deployed SafeSteamTools? Don't forget to:**
- Verify all security checks pass
- Test with a public Steam profile
- Monitor logs for the first 24 hours
- Set up automated backups