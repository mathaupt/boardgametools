# Prozessanpassungen – FEAT-009 und E-Pläne (0.50.44)

- [x] FEAT-009 vor Datenzugriff gegen Wartungsskript und Datenbankkonfiguration geprüft.
- [x] Kein Dry-Run ohne explizite `BGT_MAINTENANCE_DATABASE_URL`; kein Apply ohne geprüftes Manifest, belastbaren Backupnachweis und separate Freigabe.
- [x] gzip-Integrität des vorhandenen Backupkandidaten geprüft und deren Aussagegrenze dokumentiert.
- [x] BUG-053 als eigenen Sicherheitsplan von der bestätigten FEAT-013-Entscheidung „ohne Gastwechsel“ getrennt.
- [x] Native iOS-Pläne für FEAT-001–004 und FEAT-010–013 mit Swift-Verträgen, VoiceOver, Dynamic Type und Simulatorabnahme erstellt.
- [x] Changelog und Backlog aktualisiert; Plan- und Statusreferenzen geprüft.
- [x] Commit-Hook: ESLint, zugehörige Tests, Security-Check und Regressionsevaluator erfolgreich; letzter Lauf 10/10 ohne Regression.

Erfolgsmessung: FEAT-009 wartet weiterhin auf sichere Datenbankkonfiguration,
Manifestprüfung und Restore-Nachweis. E hat drei verlinkte, nicht freigegebene
Pläne. Es wurden keine Produktionsdaten geändert und kein iOS- oder
Sicherheitscode implementiert.

## Ergänzung: BUG-061

- [x] Direkter Dashboardaufruf und Reload als reproduzierbare Nutzerschritte aufgenommen.
- [x] Dashboard-Serverseite, Cacheabstraktion, Einladungsquery und Error Boundary gelesen.
- [ ] Digest mit zeitgleichem Serverlog korrelieren, Root Cause reproduzieren und Regressionstest ergänzen.

Vor Erhalt des Digests wurde keine Root Cause angenommen; React blendet die
konkrete Server-Component-Fehlermeldung in Production aus.

### BUG-061 Korrektur

- [x] Digest mit dem Stacktrace abgeglichen und Cache-String als Root Cause bestätigt.
- [x] Regressionstest zuerst rot gesehen; anschließend Normalisierung für Cache-String und `Date` ergänzt.
- [x] Gezielter Test (2/2), TypeScript und Produktionsbuild bestanden.
- [x] Event- und Sessionzeitpunkte gleichermaßen normalisiert.
- [ ] Produktionsdeploy nach Commit beobachten; keine Deployaktion in dieser Korrektur ausgelöst.
