# Deployment Anleitung: BoardGameTools bei IONOS

Diese Anleitung beschreibt die Deployment-Schritte für die BoardGameTools-Anwendung bei IONOS Shared Hosting oder Cloud Server.

## 📋 Voraussetzungen

### IONOS Hosting-Typen
- **Shared Hosting** (Linux mit SSH-Zugriff)
- **Cloud Server** (Ubuntu/Debian empfohlen)
- **Managed Hosting** mit Node.js-Unterstützung

### Benötigte Zugänge
- SSH-Zugriff zum Server
- IONOS Kundenpanel-Zugriff
- Domain-Verwaltung (falls eigene Domain)

## 🚀 Deployment-Optionen

### Option 1: Docker Deployment (Empfohlen)

#### 1. Server vorbereiten
```bash
# Per SSH zum Server verbinden
ssh user@your-server-ionos.com

# System aktualisieren
sudo apt update && sudo apt upgrade -y

# Docker installieren
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Docker Compose installieren
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### 2. Projekt vorbereiten
```bash
# Projekt klonen
git clone https://github.com/mathaupt/boardgametools.git
cd boardgametools

# Dependencies installieren und builden
npm ci
npm run build

# Dockerfile erstellen
cat > Dockerfile << 'EOF'
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder --app /app/package.json ./package.json
COPY --from=builder --app /app/public ./public
COPY --from=builder --app --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --app --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
EOF

# Docker Compose erstellen
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=file:./data/dev.db
      - NEXTAUTH_URL=https://your-domain.com
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - BGG_API_URL=https://boardgamegeek.com/xmlapi2
      - BGG_AUTH_TOKEN=${BGG_AUTH_TOKEN}
    volumes:
      - ./data:/app/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped
EOF

# Nginx Konfiguration
cat > nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:3000;
    }

    server {
        listen 80;
        server_name your-domain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name your-domain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        location / {
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
EOF
```

#### 3. Umgebungsvariablen konfigurieren
```bash
# .env.production erstellen
cat > .env.production << 'EOF'
NODE_ENV=production
DATABASE_URL=file:./data/dev.db
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-super-secret-change-this
BGG_API_URL=https://boardgamegeek.com/xmlapi2
BGG_AUTH_TOKEN=your-bgg-auth-token
EOF

# SSL-Verzeichnis erstellen
mkdir -p ssl
```

#### 4. Deployment ausführen
```bash
# Docker Images bauen und starten
docker-compose up -d --build

# Datenbank initialisieren
docker-compose exec app npx prisma migrate deploy
docker-compose exec app npx prisma generate

# Logs überprüfen
docker-compose logs -f app
```

### Option 2: Manuelleses Node.js Deployment

#### 1. Node.js Umgebung einrichten
```bash
# Per SSH zum Server verbinden
ssh user@your-server-ionos.com

# Node.js 18 installieren (via NVM)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18

# PM2 für Prozess-Management installieren
npm install -g pm2
```

#### 2. Projekt deployen
```bash
# Projekt klonen
git clone https://github.com/mathaupt/boardgametools.git
cd boardgametools

# Dependencies installieren
npm ci

# Umgebungsvariablen konfigurieren
cp .env.example .env.production
nano .env.production
```

#### 3. Anwendung bauen
```bash
# Produktion-Build erstellen
npm run build

# Prisma Client generieren
npx prisma generate

# Build überprüfen
ls -la .next/standalone/
```

#### 4. PM2 Konfiguration
```bash
# PM2 Konfigurationsdatei erstellen
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'boardgametools',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    instances: 1,
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      DATABASE_URL: 'file:./data/dev.db',
      NEXTAUTH_URL: 'https://your-domain.com',
      NEXTAUTH_SECRET: 'your-super-secret-change-this',
      BGG_API_URL: 'https://boardgamegeek.com/xmlapi2',
      BGG_AUTH_TOKEN: 'your-bgg-auth-token'
    }
  }]
};
EOF

# Datenbank-Verzeichnis erstellen
mkdir -p data

# Anwendung mit PM2 starten
pm2 start ecosystem.config.js --env production

# PM2 als System-Service einrichten
pm2 startup
pm2 save
```

## 🔧 IONOS Konfiguration

### Domain einrichten
1. **IONOS Kundenpanel** → Domain-Verwaltung
2. **DNS-Einstellungen** für deine Domain:
   - A-Record: `@` → Server-IP
   - A-Record: `www` → Server-IP
   - CNAME (optional): `api` → `@`

### SSL-Zertifikat (Let's Encrypt)
```bash
# Certbot installieren
sudo apt install certbot python3-certbot-nginx

# SSL-Zertifikat erstellen
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-Renew einrichten
sudo crontab -e
# Hinzufügen: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Firewall konfigurieren
```bash
# UFW Firewall einrichten
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw status
```

## 📊 Monitoring & Wartung

### PM2 Monitoring
```bash
# Anwendung status prüfen
pm2 status

# Logs anzeigen
pm2 logs boardgametools

# Anwendung neustarten
pm2 restart boardgametools

# Performance-Metriken
pm2 monit
```

### Docker Monitoring
```bash
# Container status prüfen
docker-compose ps

# Logs anzeigen
docker-compose logs -f app

# Ressourcen-Nutzung
docker stats

# Backup erstellen
docker-compose exec app npx prisma db push --preview-feature
```

### Backup-Strategie
```bash
# Datenbank-Backup-Skript
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec app npx prisma db push --preview-feature
cp data/dev.db backups/boardgametools_$DATE.db
find backups/ -name "*.db" -mtime +7 -delete
EOF

chmod +x backup.sh

# Cron-Job für tägliches Backup
echo "0 2 * * * /path/to/backup.sh" | crontab -
```

## 🚨 Fehlerbehebung

### Häufige Probleme

#### 1. Port 3000 nicht erreichbar
```bash
# Firewall prüfen
sudo ufw status

# Prozess prüfen
sudo netstat -tlnp | grep :3000

# Nginx Konfiguration testen
sudo nginx -t
```

#### 2. Datenbank-Fehler
```bash
# Prisma Migrationen prüfen
docker-compose exec app npx prisma migrate status

# Datenbank neu initialisieren
docker-compose exec app npx prisma migrate reset
```

#### 3. Memory Issues
```bash
# PM2 Memory-Limits anpassen
pm2 delete boardgametools
pm2 start ecosystem.config.js --env production

# Swap aktivieren
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

## 📱 Post-Deployment Checklist

- [ ] Anwendung unter https://your-domain.com erreichbar
- [ ] SSL-Zertifikat gültig
- [ ] Login mit Test-Account funktioniert
- [ ] BGG-Suche funktioniert mit Token
- [ ] Datenbank-Migrationen ausgeführt
- [ ] PM2/Docker Services laufen stabil
- [ ] Logs zeigen keine Fehler
- [ ] Backup-Strategie eingerichtet
- [ ] Monitoring konfiguriert

## 🆘 Support

Bei Problemen mit IONOS:
- **IONOS Help Center**: https://www.ionos.de/help/
- **SSH-Zugriff prüfen**: `ssh -v user@server`
- **System-Ressourcen**: `free -h` und `df -h`

Für Applikations-Probleme:
- **Logs prüfen**: `pm2 logs` oder `docker-compose logs`
- **GitHub Issues**: https://github.com/mathaupt/boardgametools/issues

---

**Hinweis**: Diese Anleitung geht von einem Linux-Server mit SSH-Zugriff aus. Bei IONOS Shared Hosting ohne SSH müssen die Schritte entsprechend angepasst werden.
