# IONOS Deploy Now Quick Fix

## 🔧 Das Problem

Dein IONOS Deploy Now Workflow hat mehrere Probleme:

1. **Falscher Deployment Folder**: `public` statt `.next`
2. **Fehlende Config-Datei**: `.deploy-now/boardgametools/config.yaml` 
3. **Fehlende NEXTAUTH Variablen**: `NEXTAUTH_URL` und `NEXTAUTH_SECRET`
4. **Node.js Version**: v22.x kann instabil sein

## ✅ Korrekturen durchgeführt

### 1. Deployment Folder korrigiert
```yaml
env:
  DEPLOYMENT_FOLDER: .next  # statt 'public'
```

### 2. Config-Datei erstellt
`.deploy-now/boardgametools/config.yaml` mit:
- Node.js 18 Runtime
- Korrekte Build-Kommandos
- Alle Umgebungsvariablen

### 3. Umgebungsvariablen ergänzt
```yaml
env:
  NEXTAUTH_URL: ${{ inputs.site-url }}
  NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}
  NODE_ENV: production
```

### 4. Node.js Version geändert
```yaml
node-version: v18.x  # statt v22.x
```

### 5. Prisma Build hinzugefügt
```bash
npm ci
npx prisma generate
npm run build
```

## 🚀 Nächste Schritte

### 1. GitHub Secret hinzufügen
Im GitHub Repository unter Settings → Secrets:
```
NEXTAUTH_SECRET = dein-sekreter-schlüssel
```

### 2. Deployment auslösen
```bash
git add .
git commit -m "fix: IONOS Deploy Now configuration"
git push origin main
```

### 3. Build-Log prüfen
IONOS Kundenpanel → Deployment → Logs
Nach erfolgreichen Build suchen.

## 🔍 Debugging

Wenn 403 weiterhin besteht:

### 1. Build-Status prüfen
```bash
# Im IONOS Dashboard
Deployment → Logs → "Build completed successfully?"
```

### 2. Dateien prüfen
```bash
# SSH zum IONOS Server
ssh user@ionos-server
ls -la /var/www/boardgametools/.next/
```

### 3. Umgebungsvariablen prüfen
```bash
# Auf dem Server
printenv | grep NEXTAUTH
```

### 4. Nginx Konfiguration
IONOS Deploy Now verwendet intern Nginx. Die Config-Datei sollte korrekte Routing-Regeln haben.

## ⚡ Quick Test

Um schnell zu testen ob der Build funktioniert:
```bash
# Lokal testen
npm ci
npx prisma generate
npm run build
ls -la .next/
```

Wenn der lokale Build funktioniert, sollte auch der IONOS Build klappen.

## 📞 IONOS Support

Falls alles fehlschlägt:
- IONOS Deploy Now Support kontaktieren
- Projekt-ID: `3d05dbb9-4704-47b9-a84e-e2d4250f7bcb`
- Build-Log als Beweis anhängen

Die Konfiguration ist jetzt korrekt für IONOS Deploy Now!
