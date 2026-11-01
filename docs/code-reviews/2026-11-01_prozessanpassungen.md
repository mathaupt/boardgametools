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
