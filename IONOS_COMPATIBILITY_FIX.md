# IONOS Deploy Now Kompatibilitäts-Fix

## 🔍 Das Problem

IONOS Deploy Now verwendet automatisch `deploy-to-ionos-action@v2`, aber unser Workflow ist für `artifact-action@v1` konfiguriert. Das führt zu:

```
Error: unknown version: 1
```

## ✅ Lösung: IONOS-kompatibler Workflow

Ich habe einen neuen Workflow erstellt: `.github/workflows/ionos-deploy.yml`

### Merkmale:
- ✅ **IONOS-kompatibel** - Verwendet Standard GitHub Actions
- ✅ **SSH Deployment** - Direkte Verbindung zum IONOS Server
- ✅ **Automatischer Build** - TypeScript, Prisma, Next.js
- ✅ **Environment Variables** - Alle Secrets werden verwendet
- ✅ **Startup Script** - Automatischer Start auf dem Server

## 🔧 Benötigte GitHub Secrets

Im GitHub Repository → Settings → Secrets:

```
BGG_API_URL = https://boardgamegeek.com/xmlapi2
BGG_AUTH_TOKEN = dein-bgg-token
NEXTAUTH_URL = https://home-5019782947.app-ionos.space
NEXTAUTH_SECRET = dein-nextauth-secret
IONOS_SSH_USER = dein-ssh-username
IONOS_SSH_KEY = dein-ssh-private-key
```

## 🚀 Deployment Optionen

### Option 1: Automatischer Workflow (Empfohlen)
```bash
# Workflow manuell auslösen
GitHub Repository → Actions → ionos-deploy → Run workflow
```

### Option 2: IONOS Deploy Now Interface
1. IONOS Kundenpanel → Deploy Now
2. Projekt auswählen
3. Branch auswählen
4. "Deploy" klicken

### Option 3: Manuelles Deployment
```bash
# Lokal bauen und hochladen
npm ci --include=dev
npx prisma generate
npm run build

# SSH zum Server
ssh user@access-5019782947.app-ionos.space
# Dateien hochladen und starten
```

## 🔍 Server-Informationen

Aus dem Deployment-Log:
- **Remote Host**: `access-5019782947.app-ionos.space`
- **Site URL**: `https://home-5019782947.app-ionos.space`
- **SSH User**: Aus Secrets
- **Deployment ID**: `b8f8a807-d09c-471b-a601-1815ba8cc08c`

## 📋 Troubleshooting

### 1. SSH Connection Failed
```bash
# SSH Key prüfen
ssh -i private-key user@access-5019782947.app-ionos.space
```

### 2. Build Failed
```bash
# Lokal testen
npm ci --include=dev
npx prisma generate
npm run build
```

### 3. 403 Forbidden
```bash
# Auf dem Server prüfen
curl https://home-5019782947.app-ionos.space
```

## 🎯 Erwartetes Ergebnis

Nach erfolgreicher Deployment:
- ✅ **Website erreichbar**: `https://home-5019782947.app-ionos.space`
- ✅ **Kein 403 Forbidden**
- ✅ **BGG API funktioniert**
- ✅ **Authentifizierung funktioniert**

## 📞 IONOS Support

Falls Probleme weiterhin bestehen:
- IONOS Deploy Now Dokumentation: https://docs.ionos.space/
- Projekt-ID: `3d05dbb9-4704-47b9-a84e-e2d4250f7bcb`
- Deployment-ID: `b8f8a807-d09c-471b-a601-1815ba8cc08c`

Der neue Workflow umgeht das IONOS Deploy Now Action-Problem und verwendet direktes SSH Deployment!
