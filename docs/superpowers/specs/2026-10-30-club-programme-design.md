# Club Programme – bestätigte Webgestaltung

Der Nutzer hat die erste, blaue Vergleichsskizze ausgewählt. Geltungsbereich: Dashboard, Navigation, Spielesammlung und Eventübersicht. Die iOS-App und API-Verträge bleiben außerhalb dieses Auftrags.

Das Dashboard übernimmt die Komposition aus `.impeccable/mocks/decision/club-program.html`: kobaltblaue Navigation links, ein hellblauer Arbeitsbereich, kommende Spieleabende mit hervorgehobenen Datumsblöcken links und Einladungen mit Schnellzugriffen rechts. Spielhistorie und kompakte Sammlungszahlen folgen darunter. Ausschließlich echte Kontodaten werden angezeigt; Beispieldaten und nicht belegbare Abstimmungsaufforderungen aus der Skizze werden nicht übernommen.

Barlow ist die gemeinsame Webschrift. Kobalt kennzeichnet Navigation und Aktionen; Pfirsich hebt das Datum hervor. Semantische Zustände bleiben zusätzlich beschriftet. Auf kleinen Bildschirmen wird die Navigation über einen beschrifteten Menüschalter geöffnet; die Arbeitsbereiche stehen untereinander. Alle bestehenden Bereiche einschließlich Administration, Profil, FAQ, Versionshistorie und Abmelden bleiben erreichbar.

Sammlung und Events übernehmen Schrift, Flächen und Hierarchie. Spielecover werden vollständig gezeigt; Filter, Sortierung, Import, Scanner und Löschbestätigung bleiben erhalten. Eventdaten erhalten dasselbe Datumsformat wie das Dashboard. Leere Zustände führen zu vorhandenen Erstellaktionen. Datenabfragen, Eigentümerfilter und Berechtigungen bleiben erhalten.

Validierung: Tests für Navigation und ihre mobilen Zustände sowie für Daten und leere Dashboardzustände; bestehende Unit-Tests, TypeScript, ESLint und Review-Regressionscheck. Desktop- und Mobilansichten werden mit echten Komponenten und ausdrücklich als synthetisch markierten Testdaten gerendert, ohne Zugriff auf produktive Konten oder Datenbanken. Unabhängige Abschlussprüfung und Dokumentation des gebauten Systems folgen.
