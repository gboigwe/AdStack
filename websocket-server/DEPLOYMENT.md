# WebSocket Server Deployment Guide

Complete guide for deploying the AdStack WebSocket Server to production.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Deployment Methods](#deployment-methods)
4. [Production Checklist](#production-checklist)
5. [Monitoring & Maintenance](#monitoring--maintenance)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

- **OS**: Ubuntu 20.04+ / Debian 11+ / CentOS 8+
- **Node.js**: v18.x or higher
- **RAM**: Minimum 2GB, Recommended 4GB+
- **CPU**: Minimum 2 cores, Recommended 4+ cores
- **Disk**: 20GB+ available space
- **Network**: Stable connection with low latency

### Required Services

- **Redis**: v6.0+ or v7.0+
- **Nginx**: v1.18+ (for reverse proxy)
- **SSL Certificate**: Let's Encrypt or similar

### Software Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Redis
sudo apt install -y redis-server

# Install Nginx
sudo apt install -y nginx

# Install PM2 globally
sudo npm install -g pm2

# Install Docker (optional, for containerized deployment)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

## Environment Configuration

### 1. Create Environment File

```bash
cd websocket-server
cp .env.example .env
```

### 2. Configure Environment Variables

Edit `.env` with production values:

```env
# Server
NODE_ENV=production
PORT=3002
LOG_LEVEL=info

# Redis
REDIS_URL=redis://localhost:6379
# Or for Redis with password:
# REDIS_URL=redis://:password@localhost:6379

# Stacks Blockchain
STACKS_WS_URL=wss://stacks-node-api.mainnet.stacks.co
STACKS_API_URL=https://stacks-node-api.mainnet.stacks.co

# Authentication
JWT_SECRET=your-very-strong-secret-key-here-min-32-chars
SKIP_AUTH=false

# CORS
ALLOWED_ORIGINS=https://adstack.io,https://app.adstack.io

# Contract Addresses (Mainnet)
CAMPAIGN_CONTRACT=SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7.campaign-orchestrator
AUCTION_CONTRACT=SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7.auction-engine
BRIDGE_CONTRACT=SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7.cross-chain-bridge
PAYMENT_CONTRACT=SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7.payment-processor
GOVERNANCE_CONTRACT=SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7.governance-dao

# Performance
MAX_SUBSCRIPTIONS_PER_CLIENT=10
EVENT_HISTORY_LIMIT=100
REDIS_TTL=3600
```

### 3. Generate Strong JWT Secret

```bash
# Generate a secure random key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Set File Permissions

```bash
chmod 600 .env
```

## Deployment Methods

### Method 1: PM2 (Recommended for VPS)

#### Step 1: Build the Application

```bash
npm install
npm run build
```

#### Step 2: Start with PM2

```bash
# Start application
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup systemd
# Run the command that PM2 outputs
```

#### Step 3: Verify Deployment

```bash
# Check status
pm2 status

# View logs
pm2 logs adstack-websocket

# Monitor resources
pm2 monit
```

#### Common PM2 Commands

```bash
# Restart
pm2 restart adstack-websocket

# Reload (zero-downtime)
pm2 reload adstack-websocket

# Stop
pm2 stop adstack-websocket

# Delete
pm2 delete adstack-websocket

# View specific logs
pm2 logs adstack-websocket --lines 100
```

### Method 2: Docker & Docker Compose

#### Step 1: Create .env File

Create `.env` file for Docker Compose:

```env
JWT_SECRET=your-secret-key-here
ALLOWED_ORIGINS=https://adstack.io,https://app.adstack.io
CAMPAIGN_CONTRACT=SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7.campaign-orchestrator
AUCTION_CONTRACT=SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7.auction-engine
BRIDGE_CONTRACT=SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7.cross-chain-bridge
PAYMENT_CONTRACT=SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7.payment-processor
GOVERNANCE_CONTRACT=SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7.governance-dao
GRAFANA_PASSWORD=your-grafana-password
```

#### Step 2: Build and Start

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# With monitoring (Prometheus + Grafana)
docker-compose --profile monitoring up -d

# View logs
docker-compose logs -f websocket-server
```

#### Step 3: Verify Deployment

```bash
# Check container status
docker-compose ps

# Health check
curl http://localhost:3002/health

# View logs
docker-compose logs -f
```

#### Docker Commands

```bash
# Stop services
docker-compose down

# Restart specific service
docker-compose restart websocket-server

# View resource usage
docker stats

# Execute command in container
docker-compose exec websocket-server sh

# Remove volumes (caution: deletes data)
docker-compose down -v
```

### Method 3: Kubernetes (For Large Scale)

#### Step 1: Create Kubernetes Manifests

See `k8s/` directory for example manifests:
- `deployment.yaml` - WebSocket server deployment
- `service.yaml` - Service definition
- `ingress.yaml` - Ingress for external access
- `configmap.yaml` - Configuration
- `secret.yaml` - Sensitive data

#### Step 2: Deploy to Cluster

```bash
# Create namespace
kubectl create namespace adstack

# Apply secrets
kubectl apply -f k8s/secret.yaml -n adstack

# Apply configs
kubectl apply -f k8s/configmap.yaml -n adstack

# Deploy application
kubectl apply -f k8s/deployment.yaml -n adstack
kubectl apply -f k8s/service.yaml -n adstack
kubectl apply -f k8s/ingress.yaml -n adstack

# Verify deployment
kubectl get pods -n adstack
kubectl get svc -n adstack
```

## Nginx Configuration

### Step 1: Copy Nginx Config

```bash
sudo cp nginx.conf /etc/nginx/sites-available/adstack-websocket
sudo ln -s /etc/nginx/sites-available/adstack-websocket /etc/nginx/sites-enabled/
```

### Step 2: Obtain SSL Certificate

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d ws.adstack.io
```

### Step 3: Test and Reload Nginx

```bash
# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Enable on boot
sudo systemctl enable nginx
```

## Production Checklist

### Security

- [ ] Strong JWT secret (32+ characters)
- [ ] SSL/TLS enabled (HTTPS only)
- [ ] CORS properly configured
- [ ] Authentication enabled (`SKIP_AUTH=false`)
- [ ] Firewall configured (only necessary ports open)
- [ ] Redis password protected
- [ ] Rate limiting enabled in Nginx
- [ ] Security headers configured
- [ ] `.env` file permissions set to 600
- [ ] No sensitive data in logs

### Performance

- [ ] Redis configured with appropriate memory limits
- [ ] PM2 cluster mode enabled
- [ ] Nginx worker processes optimized
- [ ] System file descriptor limit increased
- [ ] Keep-alive connections enabled
- [ ] Proper caching configured
- [ ] Log rotation configured
- [ ] Database indexes optimized

### Monitoring

- [ ] Health check endpoint accessible
- [ ] Metrics endpoint secured and working
- [ ] Log aggregation configured
- [ ] Error tracking setup (Sentry, etc.)
- [ ] Uptime monitoring configured
- [ ] Alert rules configured
- [ ] Performance monitoring active
- [ ] Resource usage tracked

### Reliability

- [ ] Auto-restart on failure enabled
- [ ] Graceful shutdown configured
- [ ] Database connection retry logic tested
- [ ] Backup strategy in place
- [ ] Disaster recovery plan documented
- [ ] Load testing completed
- [ ] Stress testing completed
- [ ] Failover strategy defined

## Monitoring & Maintenance

### Health Checks

```bash
# Basic health check
curl https://ws.adstack.io/health

# Detailed status
curl https://ws.adstack.io/status

# Prometheus metrics
curl https://ws.adstack.io/metrics
```

### Log Management

```bash
# View live logs (PM2)
pm2 logs adstack-websocket --lines 100

# View Docker logs
docker-compose logs -f websocket-server

# Tail log files
tail -f logs/combined.log
tail -f logs/error.log
```

### Log Rotation

Create `/etc/logrotate.d/adstack-websocket`:

```
/var/www/adstack-websocket/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 nodejs nodejs
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

### Performance Monitoring

Access Grafana dashboard:
```
http://your-server:3000
```

Default credentials:
- Username: admin
- Password: (set in .env)

### Backup Strategy

```bash
# Backup Redis data
redis-cli SAVE
cp /var/lib/redis/dump.rdb /backup/redis-$(date +%Y%m%d).rdb

# Backup configuration
tar -czf /backup/config-$(date +%Y%m%d).tar.gz .env ecosystem.config.js

# Automated daily backup script
cat > /usr/local/bin/backup-websocket.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backup/adstack-websocket"
mkdir -p $BACKUP_DIR
DATE=$(date +%Y%m%d)

# Backup Redis
redis-cli SAVE
cp /var/lib/redis/dump.rdb $BACKUP_DIR/redis-$DATE.rdb

# Backup configs
cd /var/www/adstack-websocket
tar -czf $BACKUP_DIR/config-$DATE.tar.gz .env ecosystem.config.js

# Keep only last 7 days
find $BACKUP_DIR -mtime +7 -delete
EOF

chmod +x /usr/local/bin/backup-websocket.sh

# Add to crontab
crontab -e
# Add line:
# 0 2 * * * /usr/local/bin/backup-websocket.sh
```

### Scaling

#### Vertical Scaling (Increase Resources)

```bash
# Increase PM2 instances
pm2 scale adstack-websocket 4

# Or update ecosystem.config.js
instances: 4  # Instead of 'max'
```

#### Horizontal Scaling (Multiple Servers)

1. **Setup Redis Cluster** for shared state
2. **Configure Load Balancer** (Nginx, HAProxy)
3. **Enable Sticky Sessions** (IP hash)
4. **Deploy to Multiple Servers**

Example Nginx load balancing:

```nginx
upstream websocket_backend {
    ip_hash;  # Sticky sessions
    server server1.adstack.io:3002;
    server server2.adstack.io:3002;
    server server3.adstack.io:3002;
}
```

## Troubleshooting

### Common Issues

#### 1. Cannot Connect to WebSocket

**Symptoms**: Client connection fails

**Solutions**:
```bash
# Check if server is running
pm2 status
curl http://localhost:3002/health

# Check firewall
sudo ufw status
sudo ufw allow 3002/tcp

# Check Nginx
sudo nginx -t
sudo systemctl status nginx

# Check logs
pm2 logs adstack-websocket --err
```

#### 2. High Memory Usage

**Symptoms**: Server using too much memory

**Solutions**:
```bash
# Check memory usage
pm2 monit

# Reduce Redis TTL in .env
REDIS_TTL=1800
EVENT_HISTORY_LIMIT=50

# Restart with memory limit
pm2 restart adstack-websocket --max-memory-restart 1G

# Check for memory leaks
node --inspect dist/index.js
```

#### 3. Slow Performance

**Symptoms**: High latency, slow responses

**Solutions**:
```bash
# Check Redis latency
redis-cli --latency

# Check system load
htop

# Increase PM2 instances
pm2 scale adstack-websocket 4

# Optimize Redis
redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

#### 4. Redis Connection Lost

**Symptoms**: "Redis connection failed" in logs

**Solutions**:
```bash
# Check Redis status
sudo systemctl status redis

# Restart Redis
sudo systemctl restart redis

# Check Redis logs
sudo tail -f /var/log/redis/redis-server.log

# Test connection
redis-cli ping
```

#### 5. SSL Certificate Issues

**Symptoms**: Certificate expired or invalid

**Solutions**:
```bash
# Renew certificate
sudo certbot renew

# Test certificate
sudo certbot certificates

# Force renewal
sudo certbot renew --force-renewal

# Setup auto-renewal
sudo systemctl enable certbot.timer
```

### Emergency Procedures

#### Server Down

```bash
# Quick restart
pm2 restart adstack-websocket

# If that fails, stop and start
pm2 stop adstack-websocket
pm2 start ecosystem.config.js --env production

# Check for port conflicts
sudo lsof -i :3002
```

#### Database Recovery

```bash
# Restore Redis from backup
sudo systemctl stop redis
sudo cp /backup/redis-YYYYMMDD.rdb /var/lib/redis/dump.rdb
sudo chown redis:redis /var/lib/redis/dump.rdb
sudo systemctl start redis
```

#### Rollback Deployment

```bash
# Rollback to previous version (PM2)
pm2 stop adstack-websocket
git checkout previous-version
npm install
npm run build
pm2 start ecosystem.config.js --env production

# Rollback Docker
docker-compose down
git checkout previous-version
docker-compose up -d
```

## Support

- **Documentation**: https://docs.adstack.io
- **GitHub Issues**: https://github.com/adstack/issues
- **Discord**: https://discord.gg/adstack
- **Email**: support@adstack.io
- **Status Page**: https://status.adstack.io
