# Node.js Version Compatibility Fix

## 🔍 Das Problem

**Next.js 16.1.6 benötigt Node.js >=20.9.0**, aber der Workflow verwendet Node.js 18.x:

```
You are using Node.js 18.20.8. For Next.js, Node.js version ">=20.9.0" is required.
Error: Process completed with exit code 1.
```

## ✅ Korrektur durchgeführt

### 1. GitHub Actions Workflow
```yaml
node-version: v20.x  # ✅ statt v18.x
```

### 2. IONOS Deploy Now Config
```yaml
runtime: nodejs20     # ✅ statt nodejs18
nodeVersion: "20"    # ✅ statt "18"
```

## 🚀 Nächste Schritte

### 1. GitHub Secret für NEXTAUTH_SECRET
Im GitHub Repository → Settings → Secrets:
```
NEXTAUTH_SECRET = dein-sekreter-schlüssel
```

### 2. Deployment auslösen
```bash
git add .
git commit -m "fix: Update Node.js version to 20.x for Next.js compatibility"
git push origin main
```

## 🔍 Erwartetes Ergebnis

### Build-Log sollte zeigen:
```
✓ Setup Node v20.x
✓ npm ci completed
✓ Prisma Client generated
✓ Next.js build completed
✓ Deployment successful
```

### Website sollte erreichbar sein:
- ✅ Kein 403 Forbidden mehr
- ✅ Next.js Anwendung läuft
- ✅ Authentifizierung funktioniert

## 📋 Alternative: Next.js Version downgraden

Wenn IONOS kein Node.js 20 unterstützt:

```json
// package.json
{
  "dependencies": {
    "next": "^14.2.15",  // statt "16.1.6"
  }
}
```

Aber Node.js 20 ist die bessere Lösung für die Zukunft.

## 🎯 Zusammenfassung

Das 403-Problem wurde durch **Node.js Version Inkompatibilität** verursacht:
- **Next.js 16.1.6** benötigt **Node.js >=20.9.0**
- **IONOS Deploy Now** verwendet jetzt **Node.js 20.x**
- **Build sollte erfolgreich** sein

Mit Node.js 20.x sollte das Deployment jetzt funktionieren!
