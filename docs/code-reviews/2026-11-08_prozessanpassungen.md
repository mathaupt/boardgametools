# Prozessstand – 08.11.2026

- Umsetzungsauftrag und Freigabe des erst danach erstellten konkreten Plans getrennt erfasst. Plan vor Runtime-Änderungen zur Prüfung vorlegen.
- Monitoring-Anbieterentscheidung eingeholt: GitHub Actions mit Workflow-Alarmen. Persönliche Benachrichtigungseinstellungen und tatsächliche Zustellung müssen bei Einrichtung geprüft werden.
- Fehlende Auditdaten nicht als befundfrei gewertet; Vorlauf mit Registryzugriff wiederholt und Ursache dokumentiert.
- Erfolgskriterien bleiben offen, bis tatsächliche Nachweise vorliegen: FEAT-019 Verhalten und Mikrofonabnahme, FEAT-030 aktiver Workflow samt Alarmierung, BUG-038 VoiceOver, BUG-041 gerendertes Raster und BUG-076 Produktionsschema.


## Nach der Implementierung

- Konkrete Planfreigabe erhalten und Aktualität vor Runtime-Änderungen bestätigt.
- TDD über schrittweise Verhaltenstests; neue Browserzustände gezielt mit simuliertem SpeechRecognition-Vertrag geprüft, tatsächliche Audioqualität nicht daraus abgeleitet.
- Dokumentheader verlangen bei den beiden Mikrofonseiten vollständige Einstiegsnavigation. Der Vertrag ist separat getestet; andere App-Ziele bleiben unverändert.
- Providertests führen Kopien des echten Skripts in isolierten temporären Verzeichnissen aus. Betriebscredentials gehören weder in Fixtures noch Assertions. Nach dem Fund sofort beide Readiness-Secrets rotiert.
- BUG-077 zusätzlich zum automatischen Rootlayout-Vertrag manuell im lokalen finalen Build Ende-zu-Ende geprüft.
- Automatische Backupablehnung nicht umgangen. Erst nach ausdrücklicher Autorisierung vollständiges Produktionsbackup samt Wiederherstellungsprüfung erstellen; danach genau die ausstehende Eventdauer-Migration freigeben/anwenden.
- Veröffentlichung nur nach gesondertem Git-Push-/Deploymentauftrag. Geplante GitHub-Prüfungen und persönliche Workflow-Benachrichtigungseinstellungen bei Aktivierung tatsächlich prüfen.
