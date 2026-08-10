# iOS-App: Brettspiel-Logos und Account-Bearbeitung

**Datum:** 2026-08-10
**Status:** Approved

## Ziel

Die iOS-App soll optisch ansprechendere, Brettspiel-bezogene Logos für die App selbst sowie für die Event- und Session-Listen erhalten. Zusätzlich sollen Nutzer im Einstellungsbildschirm ihre Account-Daten (Name und Passwort) bearbeiten können, ohne die E-Mail-Adresse zu ändern.

## Scope

1. **Visuelle Logos**
   - App-Icon (Home-Screen + optional in-App Branding)
   - Event-Listen-Thumbnail (pro Zeile)
   - Session-Listen-Thumbnail (pro Zeile)
2. **Account-Einstellungen**
   - Name ändern
   - Passwort ändern (mit aktuellem Passwort als Bestätigung)
   - E-Mail ändern bleibt gesperrt

## Visuelle Logos

### Generierte Assets

| Asset | Dateiname | Verwendung | Grösse (mindestens) |
|-------|-----------|------------|--------------------|
| `AppIcon` | `AppIcon.png` | iOS App-Icon, Login/Dashboard Branding | 1024×1024 px |
| `EventIcon` | `EventIcon.png` | Thumbnail in `EventRow` | 128×128 px |
| `SessionIcon` | `SessionIcon.png` | Thumbnail in `SessionRow` | 128×128 px |

### Design-Richtung

- Brettspiel-Thema: Würfel, Karten, Meeples, Spielbrett.
- Moderne, flache Illustration mit lebendigem Farbverlauf.
- Passend zum bestehenden `Theme.primary`-Farbschema.
- Keine einklappbaren SF Symbols mehr in den Zeilen-Thumbnails.

### Xcode-Integration

- Neue `Image Set`-Einträge in `Assets.xcassets`: `AppIcon`, `EventIcon`, `SessionIcon`.
- `AppIcon.appiconset/Contents.json` referenziert `AppIcon.png` für alle erforderlichen Grössen.
- `EventRow` ersetzt `Image(systemName: "calendar.badge.sparkles")` durch `Image("EventIcon")` (resizable).
- `SessionRow` ersetzt `Image(systemName: "dice.gamedots")` durch `Image("SessionIcon")` (resizable).
- `LoginView` zeigt `Image("AppIcon")` oberhalb des Login-Formulars.

## Account-Einstellungen

### Backend

- `PUT /api/mobile/v1/me` wird neu unterstützt.
- Authentifizierung über `apiAuth` (Bearer-Token).
- Request-Body:
  - `name` (optional): Neuer Anzeigename, max. 100 Zeichen.
  - `currentPassword` (optional): Aktuelles Passwort.
  - `newPassword` (optional): Neues Passwort, min. 8, max. 128 Zeichen.
- Regeln:
  - `email` wird ignoriert / nicht akzeptiert.
  - `newPassword` nur mit gültigem `currentPassword`.
  - Passwort wird mit bcrypt hashiert.
- Response: aktualisiertes `UserDTO` mit `id`, `email`, `name`, `role`.

### iOS UI

- `SettingsView` erhält einen neuen Abschnitt **Account**:
  - TextField "Name" (Vorab befüllt aus `AuthManager.currentUser` oder GET `/api/mobile/v1/me`).
  - SecureField "Aktuelles Passwort".
  - SecureField "Neues Passwort".
  - Button "Account aktualisieren".
- Fehler- und Erfolgsmeldungen über `errorMessage` / Toast-ähnliches Label.
- `AuthManager` erhält `updateProfile(name:currentPassword:newPassword:)`, ruft `PUT /api/mobile/v1/me` auf und aktualisiert `currentUser` lokal.

## Abgrenzungen / Nicht im Scope

- E-Mail-Änderung bleibt gesperrt.
- Keine Avatar-Uploads.
- Keine Account-Löschung.
- Keine UI für Passwort-Vergessen innerhalb der App.

## Akzeptanzkriterien

- [ ] iOS-Build erfolgreich.
- [ ] App-Icon erscheint auf dem Home-Screen.
- [ ] Event- und Session-List zeigen die neuen Bild-Thumbnails.
- [ ] Login-View zeigt das App-Logo.
- [ ] Namens-Update in Einstellungen wirkt sich auf `currentUser` aus.
- [ ] Passwort-Update mit falschem `currentPassword` wird abgelehnt.
- [ ] Changelog-Eintrag und Unit-Test für `PUT /api/mobile/v1/me` vorhanden.
