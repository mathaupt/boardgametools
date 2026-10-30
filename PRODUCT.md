# BoardGameTools – Produktkontext

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

Der gemeinsame Produktkontext gilt für die Webanwendung und den nativen iOS-Client. Beide folgen den Bedienkonventionen ihrer Plattform. Bestätigt im Init-Gespräch am 30.10.2026.

## Users

Private Spielrunden und ihre Organisatoren sind die Hauptzielgruppe. Sie verwalten ihre Brettspiele, verabreden sich zu Spieleabenden, wählen gemeinsam Spiele aus und halten gespielte Partien fest. Eingeladene Gäste können über öffentliche Share-Links ohne eigenes Konto teilnehmen.

## Product Purpose

BoardGameTools erleichtert die Organisation gemeinsamer Spieleabende und verbindet die Vorbereitung mit der Spielhistorie. Erfolg bedeutet, dass eine Runde Termin und Spiele gemeinsam festlegen und anschließend ihre Partien nachvollziehen kann. Dieses Kernziel wurde im Init-Gespräch bestätigt; quantitative Erfolgsziele sind noch nicht festgelegt.

## Positioning

Das Produkt verbindet die eigene Spielesammlung und BoardGameGeek-Importe mit Terminabstimmung, Spielvorschlägen, Voting und dem Erfassen gespielter Partien. Öffentliche Gäste-Teilnahme unterstützt die Organisation über die registrierten Nutzer hinaus. Eine darüber hinausgehende Alleinstellungsbehauptung gegenüber anderen Produkten ist nicht bestätigt.

## Operating Context

- Vor dem Spieleabend: Sammlung pflegen, Spiele importieren, Gruppe und Event organisieren, Einladungen teilen, Termine und Spiele abstimmen.
- Nach dem Spielen: Spielsessions mit Ergebnissen, Dauer und Notizen erfassen; Statistiken und den Fortschritt von Spielereihen ansehen.
- Web und iOS nutzen ein gemeinsames Backend. Die iOS-App hat einen lokalen SwiftData-Speicher und Synchronisation; vollständige Offline-Bearbeitung ist keine zugesicherte Fähigkeit.
- Öffentliche Teilnehmer arbeiten über Share-Links und Nicknames; geschützte Verwaltungsfunktionen erfordern eine Anmeldung und entsprechende Berechtigungen.

## Capabilities and Constraints

- Spielesammlung mit Suche, Filtern, Tags, Bildern und BGG-Import; Barcode- und Cover-Erkennung unterstützen das Hinzufügen von Spielen.
- Spielsessions, Spielergebnisse, Gruppen, Events, Terminabstimmung und Spiele-Voting; Kalender-Export und E-Mail-Benachrichtigungen ergänzen die Eventplanung.
- Spielereihen haben eigenen Fortschritt und Bewertungen. Ihr Gespielt-Status ist unabhängig vom Session-Tracking.
- Web und iOS teilen die Produktziele; Funktionsgleichheit darf nicht ohne Prüfung der jeweiligen Implementierung vorausgesetzt werden.
- Deutsche Oberflächentexte und Dokumentation verwenden korrekte Rechtschreibung einschließlich Umlauten. Weitere Sprachziele sind offen.
- Personenbezogene Daten und Zugriffsrechte müssen geschützt bleiben; Gäste erhalten nur die für die Freigabe vorgesehenen Möglichkeiten.
- Preise, Geschäftsmodell und quantitative Nutzungsziele sind nicht bestätigt.

## Brand Commitments

Der bestehende Produktname ist BoardGameTools. Deutsche, verständliche Bezeichnungen wie Spielesammlung, Spielsessions, Spieleabende, Gruppen und Spielereihen bilden die vorhandene Produktsprache. Eine zusätzliche Markenpersönlichkeit oder neue visuelle Vorgabe wurde im Init-Gespräch nicht festgelegt.

## Evidence on Hand

- `CONCEPT.md`: Produktkonzept, Funktionsbereiche und technische Architektur.
- `docs/FEATURES.md`: dokumentierte Abläufe, Seiten und Berechtigungen; Einzelheiten anhand der Implementierung prüfen.
- `src/app/`, `src/components/` und `src/lib/faq.ts`: bestehende Weboberflächen, Inhalte und Hilfetexte.
- `BoardGameTools/`: nativer iOS-Client mit SwiftUI und SwiftData.
- `docs/openapi.yaml` und `src/app/api/`: API-Dokumentation und implementierte Schnittstellen.

Diese Quellen belegen den Projektstand, keine Markt- oder Kundenerfolge. Testimonials, Nutzungszahlen und Leistungsversprechen dürfen daraus nicht erfunden werden.

## Product Principles

1. Die gemeinsame Organisation privater Spieleabende ist der Maßstab für Produktentscheidungen.
2. Eingeladene Gäste sollen an freigegebenen Abstimmungen ohne Registrierung teilnehmen können.
3. Sammlung, Planung und Spielhistorie sollen zusammenarbeiten; ihre unterschiedlichen Zustände müssen verständlich bleiben.
4. Web und iOS erfüllen dieselben Produktziele mit vertrauten Bedienmustern ihrer jeweiligen Plattform.
5. Bestehende Daten, Berechtigungen und bestätigte Produktfakten bleiben bei Gestaltungsänderungen erhalten.

## Accessibility & Inclusion

Verbindliche Projektgrundlage sind WCAG 2.1 AA und `skills/accessibility/SKILL.md`: ausreichende Kontraste, sichtbarer Tastaturfokus, beschriftete Bedienelemente, verständliche Statusanzeigen und ausreichend große Touch-Ziele. Native iOS-Oberflächen berücksichtigen zusätzlich die Plattformkonventionen, insbesondere VoiceOver, Dynamic Type und reduzierte Bewegung. Dies sind Anforderungen für künftige Arbeit, keine Aussage über eine bereits vollständig geprüfte Konformität.
