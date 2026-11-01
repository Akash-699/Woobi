# Woobi — Production Deployment & Operations Runbook
Troyz Solutions — Architecture & Release Engineering

This document establishes standard operating procedures for deploying, managing, securing, and rolling back **Woobi** in production environments.

---

## 1. Architecture Overview

```
                                  [ Cloudflare / DNS / DDoS Shield ]
                                                  │
                                                  ▼ HTTPS (Port 443)
                                      [ Nginx Reverse Proxy ]
                       TLS Termination / Gzip / Rate Limiting / Static Caching
                                                  │
                                                  ▼ HTTP (Port 8080)
                            [ Node.js Monorepo Backend (PM2 Cluster) ]
                            ├── modules/backend/security (Rate Limiting, CSP)
                            ├── modules/backend/auth (Bearer Tokens, Revocations)
                            ├── modules/backend/database (Atomic Writes, .bak Auto-Recovery)
                            └── modules/backend/storage (Safe Assets, Sandboxed Uploads)
```

---

## 2. Infrastructure Requirements & Topology

- **Host Operating System**: Ubuntu 22.04 LTS or Debian 12
- **Node.js**: v18.x or v20.x Active LTS
- **Process Manager**: PM2 (`npm install -g pm2`)
- **Reverse Proxy**: Nginx 1.22+ or Cloudflare Tunnel
- **Storage**: Persistent SSD block storage with automated daily snapshots
- **Memory Requirements**: Minimum 2 GB RAM (512 MB per Node cluster worker)

---

## 3. Reverse Proxy Configuration (Nginx)

Place this configuration at `/etc/nginx/sites-available/woobi.conf`:

```nginx
# Rate Limiting Zone: 30 requests per minute per IP
limit_req_zone $binary_remote_addr zone=woobi_limit:10m rate=30r/m;

server {
    listen 80;
    server_name app.woobi.com api.woobi.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name app.woobi.com api.woobi.com;

    # SSL Certificates
    ssl_certificate /etc/letsencrypt/live/woobi.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/woobi.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; font-src 'self';" always;

    # Static 3D Asset Caching (GLB, Textures)
    location ~* \.(glb|gltf|bin|png|jpg|jpeg|webp|svg|woff2)$ {
        root /var/www/woobi;
        expires 30d;
        add_header Cache-Control "public, no-transform, max-age=2592000";
        access_log off;
    }

    # API Proxy with Rate Limiting
    location /api/ {
        limit_req zone=woobi_limit burst=10 nodelay;
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }

    # Frontend Single Page App
    location / {
        root /var/www/woobi;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 4. PM2 Process Management & Concurrency Architecture

### Mandatory Single-Instance Architecture (`instances: 1`, `exec_mode: 'fork'`)
> [!IMPORTANT]
> The Woobi production backend uses a local-first JSON file storage engine (`DatabaseService.js`) with atomic file writes, `.bak` snapshot rotation, and OS directory locking (`.oslock`). 
> **Running in PM2 multi-worker cluster mode (`instances: 'max'`) is strictly PROHIBITED.** 
> In a multi-worker cluster, separate Node processes hold distinct in-memory cache states and race on disk file updates, which can lead to cache desynchronization and clobbered updates.
> 
> The application is configured for single-process execution (`instances: 1`, `exec_mode: 'fork'`) with automatic crash recovery (`autorestart: true`).
> 
> **Horizontal Scaling Roadmap**: For high-concurrency multi-worker horizontal scaling, `DatabaseService.js` must be migrated to a client-server transactional database (such as PostgreSQL or SQLite configured in WAL mode).

Start and monitor the application:

```bash
# 1. Start application in verified single-writer mode using ecosystem file
pm2 start ecosystem.config.cjs --env production

# 2. Persist PM2 across server restarts
pm2 save
pm2 startup

# 3. View live process status
pm2 status

# 4. View process logs
pm2 logs woobi-backend --lines 100
```

---

## 5. Automated Data Backup & Disaster Recovery

The Woobi database uses atomic JSON writes with automatic `.bak` copy rotation on every write operation.

### Scheduled Cron Backup
Configure `/etc/cron.daily/woobi-backup`:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/woobi"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p "$BACKUP_DIR/$DATE"

# Snapshot database collections and uploads
cp -r /var/www/woobi/data/*.json "$BACKUP_DIR/$DATE/"
cp -r /var/www/woobi/data/uploads "$BACKUP_DIR/$DATE/" 2>/dev/null || true

# Retain backups for 30 days
find "$BACKUP_DIR" -maxdepth 1 -type d -mtime +30 -exec rm -rf {} +
```

### Crash Recovery Protocol
If an ungraceful OS reboot or power loss occurs during a write:
1. `DatabaseService.js` automatically detects if the primary `.json` file is corrupt.
2. It immediately checks for the corresponding `.json.bak` snapshot.
3. If valid, the backup snapshot is restored and written to the primary path.
4. If no backup is available, it gracefully initializes an empty entity collection to preserve uptime.

---

## 6. Zero-Downtime Deployment Procedure

```bash
# 1. Pull verified release tag or commit from canonical origin
git fetch origin --tags
git checkout tags/v1.0.0-rc1

# 2. Pull Git LFS assets
git lfs pull

# 3. Install production dependencies
npm ci --omit=dev

# 4. Run automated pre-deployment test validation
npm test
npm run test:e2e

# 5. Reload PM2 cluster with zero dropped connections
pm2 reload ecosystem.config.cjs --env production
```

---

## 7. Emergency Rollback Protocol

If critical regressions or security issues are detected post-deployment:

```bash
# 1. Immediate rollback to prior stable tag
git checkout tags/v0.9.8-stable

# 2. Reload cluster immediately
pm2 reload ecosystem.config.cjs --env production

# 3. If database schema rollback is required:
cp /var/backups/woobi/<LATEST_VALID_TIMESTAMP>/*.json /var/www/woobi/data/
pm2 restart ecosystem.config.cjs --env production
```

---

## 8. Android Release Engineering & Signing

The mobile application is a high-performance Android WebView wrapper (`android-app/`).

### Release Build Prerequisites
1. Generate a production upload keystore (store securely in a hardware security module or corporate vault):
   ```bash
   keytool -genkeypair -v -keystore woobi-release.jks -alias woobi-key \
           -keyalg RSA -keysize 2048 -validity 10000
   ```
2. Create `android-app/keystore.properties` (never commit to Git):
   ```properties
   storeFile=../woobi-release.jks
   storePassword=SECRET_STORE_PASSWORD
   keyAlias=woobi-key
   keyPassword=SECRET_KEY_PASSWORD
   ```
3. Assemble Release APK / AAB:
   ```bash
   cd android-app
   ./gradlew assembleRelease
   ./gradlew bundleRelease
   ```
4. Output Artifacts:
   - APK: `android-app/app/build/outputs/apk/release/app-release.apk`
   - AAB (Play Store): `android-app/app/build/outputs/bundle/release/app-release.aab`

