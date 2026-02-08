# Security Guide for AdStack WebSocket Server

This document outlines security best practices and hardening procedures for the WebSocket server.

## Table of Contents

1. [Authentication & Authorization](#authentication--authorization)
2. [Network Security](#network-security)
3. [Data Protection](#data-protection)
4. [Rate Limiting](#rate-limiting)
5. [Input Validation](#input-validation)
6. [Logging & Monitoring](#logging--monitoring)
7. [Dependency Security](#dependency-security)
8. [Security Checklist](#security-checklist)

## Authentication & Authorization

### JWT Token Security

#### Strong Secret Key

```bash
# Generate cryptographically strong secret (256-bit)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Requirements:**
- Minimum 32 characters
- Use cryptographically random values
- Never commit to version control
- Rotate regularly (every 90 days)

#### Token Configuration

```typescript
// src/middleware/auth.ts
const token = jwt.sign(payload, process.env.JWT_SECRET!, {
  expiresIn: '24h',        // Token expiration
  algorithm: 'HS256',      // Strong algorithm
  issuer: 'adstack-ws',    // Token issuer
  audience: 'adstack-app', // Token audience
});
```

#### Token Verification

```typescript
// Always verify token properties
const decoded = jwt.verify(token, JWT_SECRET, {
  algorithms: ['HS256'],
  issuer: 'adstack-ws',
  audience: 'adstack-app',
  maxAge: '24h',
}) as JWTPayload;

// Validate required claims
if (!decoded.userId || !decoded.address) {
  throw new Error('Invalid token claims');
}
```

### WebSocket Authentication

#### Handshake Authentication

```typescript
// Only authenticate during handshake
io.use(authMiddleware);

// Reject unauthorized connections
if (!token || !decoded) {
  return next(new Error('Authentication required'));
}
```

#### Session Management

```typescript
// Store authenticated user info on socket
socket.userId = decoded.userId;
socket.address = decoded.address;
socket.role = decoded.role;

// Disconnect on token expiration
setTimeout(() => {
  socket.disconnect(true);
}, tokenExpiry);
```

### Role-Based Access Control

```typescript
// Define roles
enum Role {
  USER = 'user',
  ADMIN = 'admin',
  DEVELOPER = 'developer',
}

// Check permissions
function requireRole(role: Role) {
  return (socket: AuthenticatedSocket, next: Function) => {
    if (socket.role !== role) {
      return next(new Error('Insufficient permissions'));
    }
    next();
  };
}

// Apply to specific events
socket.on('admin:action', requireRole(Role.ADMIN), handler);
```

## Network Security

### SSL/TLS Configuration

#### Nginx SSL Setup

```nginx
# Strong SSL configuration
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256';
ssl_prefer_server_ciphers off;

# Enable HSTS
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

# OCSP stapling
ssl_stapling on;
ssl_stapling_verify on;
resolver 8.8.8.8 8.8.4.4 valid=300s;
resolver_timeout 5s;
```

#### Certificate Management

```bash
# Use Let's Encrypt
sudo certbot --nginx -d ws.adstack.io

# Auto-renewal
sudo certbot renew --dry-run

# Certificate monitoring
0 0 1 * * certbot renew --quiet
```

### Firewall Configuration

```bash
# UFW (Ubuntu)
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow from 10.0.0.0/8 to any port 6379  # Redis (internal only)
sudo ufw enable

# Check status
sudo ufw status verbose
```

### CORS Configuration

```typescript
// Strict CORS policy
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || [],
  credentials: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400, // 24 hours
}));

// Validate origins
const allowedOrigins = new Set(process.env.ALLOWED_ORIGINS?.split(','));

io.use((socket, next) => {
  const origin = socket.handshake.headers.origin;

  if (!origin || !allowedOrigins.has(origin)) {
    return next(new Error('CORS policy violation'));
  }

  next();
});
```

## Data Protection

### Sensitive Data Handling

#### Environment Variables

```bash
# Never log sensitive data
# ❌ BAD
logger.info(`JWT Secret: ${process.env.JWT_SECRET}`);

# ✅ GOOD
logger.info('JWT Secret configured');
```

#### Redis Security

```bash
# redis.conf
requirepass your-strong-redis-password
bind 127.0.0.1 ::1  # Listen only on localhost
protected-mode yes
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command CONFIG ""
```

```typescript
// Connect with password
const redis = new Redis({
  host: 'localhost',
  port: 6379,
  password: process.env.REDIS_PASSWORD,
  tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
});
```

### Data Encryption

#### Encrypt Sensitive Event Data

```typescript
import crypto from 'crypto';

function encryptData(data: string, key: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);

  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

function decryptData(encryptedData: string, key: string): string {
  const [iv, authTag, encrypted] = encryptedData.split(':');

  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    Buffer.from(key, 'hex'),
    Buffer.from(iv, 'hex')
  );

  decipher.setAuthTag(Buffer.from(authTag, 'hex'));

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
```

### PII Protection

```typescript
// Mask sensitive data in logs
function maskPII(data: any): any {
  const masked = { ...data };

  // Mask email
  if (masked.email) {
    masked.email = masked.email.replace(/(.{3})(.*)(@.*)/, '$1***$3');
  }

  // Mask wallet address
  if (masked.address) {
    masked.address = `${masked.address.slice(0, 6)}...${masked.address.slice(-4)}`;
  }

  return masked;
}

logger.info('User connected', maskPII({ email, address }));
```

## Rate Limiting

### Connection Rate Limiting

```typescript
// Limit connections per IP
const connectionLimiter = new Map<string, number>();

io.use((socket, next) => {
  const ip = socket.handshake.address;
  const count = connectionLimiter.get(ip) || 0;

  if (count > 10) {
    return next(new Error('Too many connections'));
  }

  connectionLimiter.set(ip, count + 1);

  socket.on('disconnect', () => {
    connectionLimiter.set(ip, (connectionLimiter.get(ip) || 0) - 1);
  });

  next();
});

// Clean up old entries
setInterval(() => {
  for (const [ip, count] of connectionLimiter.entries()) {
    if (count === 0) {
      connectionLimiter.delete(ip);
    }
  }
}, 60000);
```

### Event Rate Limiting

```typescript
// Redis-based rate limiting
async function checkRateLimit(
  userId: string,
  action: string,
  limit: number,
  window: number
): Promise<boolean> {
  const key = `ratelimit:${userId}:${action}`;
  const current = await redis.incr(key);

  if (current === 1) {
    await redis.expire(key, window);
  }

  return current <= limit;
}

// Apply to events
socket.on('subscribe', async (data) => {
  const allowed = await checkRateLimit(socket.userId, 'subscribe', 10, 60);

  if (!allowed) {
    socket.emit('error', { message: 'Rate limit exceeded' });
    return;
  }

  // Process subscription...
});
```

### Nginx Rate Limiting

```nginx
# Define rate limit zones
limit_req_zone $binary_remote_addr zone=ws_limit:10m rate=10r/s;
limit_conn_zone $binary_remote_addr zone=ws_conn:10m;

server {
  location / {
    # Apply rate limits
    limit_req zone=ws_limit burst=20 nodelay;
    limit_conn ws_conn 100;

    # Custom error page
    limit_req_status 429;
    limit_conn_status 429;
  }
}
```

## Input Validation

### Schema Validation

```typescript
import Joi from 'joi';

// Define schemas
const subscribeSchema = Joi.object({
  contractId: Joi.string().required().pattern(/^S[A-Z0-9]+\.[a-z0-9-]+$/),
  eventTypes: Joi.array().items(Joi.string()).optional(),
});

// Validate input
socket.on('subscribe', async (data) => {
  const { error, value } = subscribeSchema.validate(data);

  if (error) {
    socket.emit('error', {
      message: 'Invalid input',
      details: error.details,
    });
    return;
  }

  // Process validated data...
});
```

### Sanitization

```typescript
// Sanitize contract IDs
function sanitizeContractId(id: string): string {
  return id.replace(/[^A-Z0-9.-]/gi, '');
}

// Prevent injection
function sanitizeEventType(type: string): string {
  const allowedTypes = new Set([
    'campaign_created',
    'bid_placed',
    'payment_processed',
  ]);

  return allowedTypes.has(type) ? type : '';
}
```

### Size Limits

```typescript
// Limit message size
io.use((socket, next) => {
  const originalEmit = socket.emit;

  socket.emit = function (event: string, ...args: any[]) {
    const size = JSON.stringify(args).length;

    if (size > 10240) { // 10KB limit
      logger.warn(`Message too large: ${size} bytes`);
      return;
    }

    return originalEmit.apply(socket, [event, ...args]);
  };

  next();
});
```

## Logging & Monitoring

### Security Event Logging

```typescript
// Log security events
function logSecurityEvent(
  event: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  details: any
) {
  logger.warn('SECURITY_EVENT', {
    event,
    severity,
    timestamp: Date.now(),
    ...maskPII(details),
  });

  // Alert on critical events
  if (severity === 'critical') {
    // Send to monitoring service
    sendAlert(event, details);
  }
}

// Usage
logSecurityEvent('AUTH_FAILURE', 'medium', {
  userId: socket.userId,
  ip: socket.handshake.address,
});
```

### Intrusion Detection

```typescript
// Track failed auth attempts
const failedAttempts = new Map<string, number>();

socket.on('authenticate', (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    failedAttempts.delete(socket.handshake.address);
  } catch (error) {
    const ip = socket.handshake.address;
    const attempts = (failedAttempts.get(ip) || 0) + 1;

    failedAttempts.set(ip, attempts);

    if (attempts >= 5) {
      logSecurityEvent('BRUTE_FORCE_ATTEMPT', 'high', { ip, attempts });
      socket.disconnect(true);
    }
  }
});
```

## Dependency Security

### Regular Updates

```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Check for outdated packages
npm outdated

# Update dependencies
npm update
```

### Automated Scanning

```yaml
# .github/workflows/security-scan.yml
- name: Run Snyk scan
  uses: snyk/actions/node@master
  with:
    args: --severity-threshold=high

- name: OWASP Dependency Check
  uses: dependency-check/Dependency-Check_Action@main
```

### Supply Chain Security

```bash
# Verify package integrity
npm ci --prefer-offline

# Use package-lock.json
git add package-lock.json

# Check for known malicious packages
npx can-i-ignore-scripts
```

## Security Checklist

### Pre-Deployment

- [ ] Strong JWT secret generated (32+ chars)
- [ ] All environment variables configured
- [ ] SKIP_AUTH disabled in production
- [ ] SSL/TLS certificates installed
- [ ] CORS origins restricted
- [ ] Redis password protected
- [ ] Firewall rules configured
- [ ] Rate limiting enabled
- [ ] Input validation implemented
- [ ] Security headers configured
- [ ] Log rotation configured
- [ ] Monitoring alerts setup

### Authentication

- [ ] JWT tokens have expiration
- [ ] Token verification includes all claims
- [ ] Handshake authentication enforced
- [ ] Role-based access control implemented
- [ ] Session management in place
- [ ] Token rotation strategy defined

### Network

- [ ] TLS 1.2+ only
- [ ] Strong cipher suites configured
- [ ] HSTS header enabled
- [ ] Certificate auto-renewal setup
- [ ] Internal services not exposed
- [ ] DDoS protection configured

### Data

- [ ] Sensitive data encrypted at rest
- [ ] PII masked in logs
- [ ] Redis security configured
- [ ] Secure random generation used
- [ ] No secrets in code/logs
- [ ] Data retention policy defined

### Monitoring

- [ ] Security event logging enabled
- [ ] Failed auth attempts tracked
- [ ] Anomaly detection configured
- [ ] Alerts for critical events
- [ ] Regular security audits scheduled
- [ ] Incident response plan documented

### Dependencies

- [ ] All packages up to date
- [ ] No known vulnerabilities
- [ ] Automated scanning enabled
- [ ] Package integrity verified
- [ ] Unnecessary dependencies removed

## Incident Response

### Security Incident Procedure

1. **Detection**
   - Monitor alerts and logs
   - Identify suspicious activity

2. **Containment**
   ```bash
   # Immediately revoke compromised tokens
   redis-cli FLUSHDB

   # Block malicious IPs
   sudo ufw deny from <IP_ADDRESS>

   # Disable affected services
   pm2 stop adstack-websocket
   ```

3. **Investigation**
   ```bash
   # Review logs
   grep "SECURITY_EVENT" logs/combined.log

   # Check Redis for suspicious data
   redis-cli KEYS "*"

   # Review active connections
   pm2 monit
   ```

4. **Eradication**
   - Patch vulnerabilities
   - Rotate all secrets
   - Update affected systems

5. **Recovery**
   - Restore from clean backup
   - Restart services
   - Monitor closely

6. **Post-Incident**
   - Document incident
   - Update procedures
   - Implement preventive measures

## Reporting Security Issues

**DO NOT** open public GitHub issues for security vulnerabilities.

Instead, email: security@adstack.io

Include:
- Description of vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We will respond within 48 hours.

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Socket.IO Security](https://socket.io/docs/v4/security/)
- [Redis Security](https://redis.io/topics/security)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)
