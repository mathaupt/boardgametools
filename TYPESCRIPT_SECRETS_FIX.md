# TypeScript and Secrets Fix for IONOS Deployment

## 🔍 Aktuelle Probleme

### 1. TypeScript fehlt
```
⨯ Failed to load next.config.ts, see more info here https://nextjs.org/docs/messages/next-config-error
Error: Failed to transpile "next.config.ts".
Error: Cannot find module 'typescript'
```

### 2. Secrets als GitHub Secrets
Du hast die Secrets bereits in GitHub konfiguriert, aber der Workflow verwendet sie nicht richtig.

## ✅ Korrekturen durchgeführt

### 1. GitHub Actions Workflow
```yaml
env:
  BGG_API_URL: ${{ secrets.BGG_API_URL }}
  BGG_AUTH_TOKEN: ${{ secrets.BGG_AUTH_TOKEN }}
  BGG_USERNAME: ${{ secrets.BGG_USERNAME }}
  BGG_PASSWORD: ${{ secrets.BGG_PASSWORD }}
  NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}
```

### 2. TypeScript Installation
```bash
npm ci
npx prisma generate
npm install typescript --save-dev  # ✅ hinzugefügt
npm run build
```

### 3. IONOS Config mit Environment Variables
```yaml
environment:
  NEXTAUTH_SECRET: "${NEXTAUTH_SECRET}"
  BGG_API_URL: "${BGG_API_URL}"
  BGG_AUTH_TOKEN: "${BGG_AUTH_TOKEN}"
```

## 🔧 Benötigte GitHub Secrets

Im GitHub Repository → Settings → Secrets:

```
BGG_API_URL = https://boardgamegeek.com/xmlapi2
BGG_AUTH_TOKEN = dein-bgg-token
BGG_USERNAME = dein-bgg-username (optional)
BGG_PASSWORD = dein-bgg-password (optional)
NEXTAUTH_SECRET = dein-nextauth-secret
IONOS_API_KEY = dein-ionos-api-key
```

## 🚀 Nächste Schritte

### 1. GitHub Secrets prüfen
Stelle sicher, dass alle Secrets existieren:
- GitHub Repository → Settings → Secrets and variables → Actions

### 2. Deployment auslösen
```bash
git add .
git commit -m "fix: Add TypeScript installation and use GitHub Secrets"
git push origin main
```

### 3. Build-Log prüfen
Erwartetes Ergebnis:
```
✓ npm ci completed
✓ Prisma Client generated
✓ TypeScript installed
✓ Next.js build completed
✓ Deployment successful
```

## 🔍 Wenn Fehler weiterhin auftreten

### 1. TypeScript nicht gefunden
Falls TypeScript immer noch fehlt:
```yaml
- name: Setup Node
  uses: actions/setup-node@v4
  with:
    node-version: v20.x
    cache: 'npm'
```

### 2. Secrets nicht gefunden
Prüfe die Secret-Namen im GitHub Repository:
```
BGG_API_URL (nicht BGG-API-URL)
NEXTAUTH_SECRET (nicht NEXTAUTH-SECRET)
```

### 3. Build-Timeout
IONOS Deploy Now hat Zeitlimits. Falls der Build zu lange dauert:
- Dependencies reduzieren
- Build optimieren

## 📋 Zusammenfassung

Die Fixes beheben:
- ✅ **TypeScript fehlt**: `npm install typescript --save-dev`
- ✅ **Secrets nicht verwendet**: `${{ secrets.VAR_NAME }}`
- ✅ **IONOS Config**: Environment Variables statt hardcoded values

Nach diesen Korrekturen sollte der Build erfolgreich sein!
