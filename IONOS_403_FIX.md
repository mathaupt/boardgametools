# IONOS Deployment Troubleshooting Guide

## 🔍 403-Fehler Diagnose

### Häufige Ursachen für 403 bei IONOS GitHub Deployment:

1. **Fehlende Build-Schritte** - IONOS führt nicht automatisch `npm run build` aus
2. **Falsche Dateiberechtigungen** - IONOS hat strenge Berechtigungsregeln
3. **Fehlende .next/ Ordner** - Build-Artefakte nicht vorhanden
4. **Node.js Version** - IONOS unterstützt möglicherweise nicht Node.js 18
5. **Port-Konflikte** - Anwendung läuft auf falschem Port

## 🛠️ Lösungen

### Option 1: GitHub Actions Workflow (Empfohlen)

Ich habe einen vollständigen GitHub Actions Workflow erstellt (`.github/workflows/deploy.yml`), der:

- ✅ **Automatisch baut** mit `npm run build`
- ✅ **Umgebungsvariablen** setzt
- ✅ **PM2 konfiguriert** für Prozess-Management
- ✅ **Nginx einrichtet** als Reverse Proxy
- ✅ **SSH Deployment** zu deinem IONOS Server

#### Setup:
1. **GitHub Secrets** hinzufügen:
   ```
   IONOS_HOST=deine-server-ip
   IONOS_USER=dein-ssh-user
   IONOS_SSH_KEY=-----BEGIN OPENSSH PRIVATE KEY-----
   IONOS_PORT=22
   IONOS_DOMAIN=deine-domain.com
   NEXTAUTH_URL=https://deine-domain.com
   NEXTAUTH_SECRET=dein-secret
   BGG_AUTH_TOKEN=dein-bgg-token
   ```

2. **SSH Key** erstellen:
   ```bash
   ssh-keygen -t rsa -b 4096 -C "github-actions"
   # Public Key zu IONOS ~/.ssh/authorized_keys hinzufügen
   # Private Key als GitHub Secret speichern
   ```

### Option 2: Manuelles Deployment mit Build-Skript

Wenn du bei IONOS bleiben willst, aber den Build-Prozess kontrollieren:

#### 1. Pre-Build Hook erstellen
```bash
# .ionos/build.sh
#!/bin/bash
echo "Starting build process..."

# Node.js Version prüfen
node --version
npm --version

# Dependencies installieren
npm ci

# Prisma Client generieren
npx prisma generate

# Anwendung bauen
npm run build

echo "Build completed successfully!"
```

#### 2. IONOS Deployment Konfiguration anpassen
```json
{
  "scripts": {
    "build": "next build",
    "start": "next start",
    "ionos-build": "chmod +x .ionos/build.sh && .ionos/build.sh"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=8.0.0"
  }
}
```

#### 3. IONOS App Settings
- **Build Command**: `npm run ionos-build`
- **Start Command**: `npm start`
- **Node.js Version**: `18.x`
- **Environment Variables**: Alle benötigten Variablen setzen

### Option 3: Docker Deployment (Beste Lösung)

Docker umgeht IONOS Build-Probleme komplett:

#### 1. Dockerfile erstellen
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
EXPOSE 3000
CMD ["npm", "start"]
```

#### 2. Docker Compose
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=file:./data/dev.db
      - NEXTAUTH_URL=https://deine-domain.com
      - NEXTAUTH_SECRET=dein-secret
      - BGG_AUTH_TOKEN=dein-bgg-token
    volumes:
      - ./data:/app/data
```

## 🔧 Debugging Schritte

### 1. Build-Log prüfen
```bash
# Lokal testen
npm ci
npm run build
ls -la .next/

# Build-Artefakte prüfen
ls -la .next/standalone/
```

### 2. IONOS Logs
- IONOS Kundenpanel → Deployment → Logs
- Nach "npm run build" Fehlern suchen
- Berechtigungsprobleme prüfen

### 3. SSH Debug
```bash
# Auf IONOS Server
ssh user@ionos-server
cd /var/www/your-app
ls -la
pm2 logs
nginx -t
```

### 4. Port-Test
```bash
# Auf IONOS Server
curl http://localhost:3000
netstat -tlnp | grep :3000
```

## 📋 Quick Fix für 403

Wenn es schnell gehen muss:

```bash
# 1. Lokal bauen
npm ci
npm run build

# 2. Alle Dateien hochladen
scp -r .next user@ionos-server:/var/www/boardgametools/
scp -r node_modules user@ionos-server:/var/www/boardgametools/
scp package.json user@ionos-server:/var/www/boardgametools/

# 3. Auf Server starten
ssh user@ionos-server
cd /var/www/boardgametools
pm2 start "npm start" --name boardgametools
```

## 🚀 Empfehlung

**Verwende den GitHub Actions Workflow** - er löst alle 403-Probleme durch:
- Automatischen Build-Prozess
- Korrekte Dateiberechtigungen
- PM2 Prozess-Management
- Nginx Reverse Proxy
- SSL-Konfiguration

Der Workflow ist in `.github/workflows/deploy.yml` bereit und只需要 die GitHub Secrets konfigurieren.
