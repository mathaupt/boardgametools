# IONOS Deploy Now - Minimale Konfiguration

## 🔍 Das Problem

IONOS Deploy Now verwendet automatisch `deploy-to-ionos-action@v2` und ignoriert unsere Workflow-Konfiguration. Der Fehler "unknown version: 1" kommt von Versions-Inkompatibilität.

## ✅ Lösung: IONOS Deploy Now Konfiguration anpassen

IONOS Deploy Now erwartet eine bestimmte Struktur. Ich erstelle eine minimale, funktionierende Konfiguration.

### 1. IONOS Deploy Now Projektstruktur
IONOS erwartet folgende Dateien:
- `.deploy-now/config.yaml` (Projekt-Konfiguration)
- `package.json` (mit build script)
- `next.config.js` oder `next.config.ts`

### 2. Automatische IONOS Integration
IONOS Deploy Now:
1. Klont das Repository
2. Führt `npm install` aus
3. Führt `npm run build` aus
4. Lädt Build-Artefakte hoch
5. Konfiguriert Webserver

## 🔧 Benötigte Konfiguration

### package.json Anpassungen
```json
{
  "scripts": {
    "build": "next build",
    "start": "next start"
  },
  "engines": {
    "node": ">=20.0.0"
  }
}
```

### IONOS Config
```yaml
# .deploy-now/config.yaml
version: 1
runtime: nodejs20
buildCommand: "npm run build"
outputDirectory: ".next"
nodeVersion: "20"
```

## 🚀 Deployment Strategie

### Option 1: IONOS Deploy Now Interface (Empfohlen)
1. IONOS Kundenpanel → Deploy Now
2. Repository verbinden
3. Branch auswählen
4. "Deploy" klicken

### Option 2: Manuelles Deployment
```bash
# SSH zum IONOS Server
ssh user@access-5019782947.app-ionos.space

# Projekt部署
cd /app
git clone https://github.com/mathaupt/boardgametools.git
cd boardgametools
npm install
npm run build
npm start
```

### Option 3: FTP Upload
1. Lokal bauen: `npm run build`
2. `.next` Ordner hochladen
3. Server neu starten

## 🔍 Server-Informationen

- **Host**: `access-5019782947.app-ionos.space`
- **URL**: `https://home-5019782947.app-ionos.space`
- **SSH**: Aus IONOS Kundenpanel
- **Path**: `/app` oder `/var/www/html`

## 📋 Troubleshooting

### 1. Build Fehler
```bash
# Lokal testen
npm install
npm run build
```

### 2. 403 Forbidden
```bash
# Auf dem Server prüfen
ls -la /app/.next/
curl -I https://home-5019782947.app-ionos.space
```

### 3. Node.js Version
```bash
# Node.js Version prüfen
node --version  # Sollte >=20.0.0 sein
```

## 🎯 Empfehlung

**Verwende das IONOS Deploy Now Interface** statt GitHub Actions:

1. **IONOS Kundenpanel** → Deploy Now
2. **Repository verbinden**: `https://github.com/mathaupt/boardgametools.git`
3. **Branch auswählen**: `main`
4. **Build Command**: `npm run build`
5. **Output Directory**: `.next`
6. **Node.js Version**: `20`

IONOS kümmert sich um:
- ✅ Automatische Builds
- ✅ SSL-Zertifikate
- ✅ Load Balancing
- ✅ Skalierung

## 📞 IONOS Support

- **Dokumentation**: https://docs.ionos.space/
- **Projekt-ID**: `3d05dbb9-4704-47b9-a84e-e2d4250f7bcb`
- **Deployment-ID**: `b8f8a807-d09c-471b-a601-1815ba8cc08c`

IONOS Deploy Now ist einfacher als GitHub Actions für dieses Projekt!
