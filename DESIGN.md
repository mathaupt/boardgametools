---
name: BoardGameTools — Club Programme
description: Club Programme für Web und native iOS-Oberflächen zur gemeinsamen Spielorganisation.
colors:
  primary: "#2445b4"
  primary-foreground: "oklch(0.98 0 0)"
  background: "#eaf0ff"
  foreground: "#172648"
  card: "oklch(1 0 0)"
  secondary: "#dce5fc"
  secondary-foreground: "#244389"
  muted: "#e1e9fc"
  muted-foreground: "#4a5b7e"
  accent: "#f4af85"
  accent-foreground: "#542f20"
  border: "#c7d1ed"
  sidebar-accent: "#3456c5"
  sidebar-border: "#5973c6"
  white: "#ffffff"
  destructive: "oklch(0.55 0.22 27)"
  success: "oklch(0.55 0.16 155)"
  warning: "oklch(0.75 0.16 75)"
  info: "oklch(0.6 0.18 245)"
  dark-primary: "#a8baff"
  dark-primary-foreground: "#172648"
  dark-background: "oklch(0.14 0.015 265)"
  dark-foreground: "oklch(0.94 0.005 80)"
  dark-card: "oklch(0.19 0.02 265)"
  dark-secondary: "oklch(0.24 0.03 265)"
  dark-secondary-foreground: "oklch(0.9 0.01 265)"
  dark-muted: "oklch(0.22 0.02 265)"
  dark-muted-foreground: "oklch(0.65 0.015 265)"
  dark-accent: "oklch(0.75 0.14 75)"
  dark-accent-foreground: "oklch(0.18 0.03 60)"
  dark-border: "oklch(0.28 0.025 265)"
  dark-input: "oklch(0.25 0.025 265)"
  dark-ring: "oklch(0.65 0.2 265)"
  dark-sidebar: "oklch(0.15 0.02 265)"
  dark-sidebar-accent: "oklch(0.2 0.025 265)"
  dark-sidebar-border: "oklch(0.25 0.03 265)"
  ios-tint: "#2445b4"
  ios-dark-tint: "#a8baff"
  ios-on-tint: "#ffffff"
  ios-dark-on-tint: "#172648"
  ios-background: "#eaf0ff"
  ios-dark-background: "#151923"
  ios-surface: "#ffffff"
  ios-dark-surface: "#202637"
  ios-ink: "#172648"
  ios-dark-ink: "#edf1ff"
  ios-secondary-ink: "#4a5b7e"
  ios-dark-secondary-ink: "#b6c2de"
  ios-soft-blue: "#dce5fc"
  ios-dark-soft-blue: "#2b3652"
  ios-date-background: "#f4af85"
  ios-dark-date-background: "#e8ac88"
  ios-date-ink: "#542f20"
typography:
  headline:
    fontFamily: "Barlow, system-ui, -apple-system, sans-serif"
    fontSize: "2.5rem"
    fontWeight: 700
    lineHeight: 1.12
    letterSpacing: "-0.03em"
  headline-mobile:
    fontFamily: "Barlow, system-ui, -apple-system, sans-serif"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: 1.12
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Barlow, system-ui, -apple-system, sans-serif"
    fontSize: "1.45rem"
    fontWeight: 700
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Barlow, system-ui, -apple-system, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Barlow, system-ui, -apple-system, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: "1.25rem"
  ios-section-title:
    fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif"
    fontWeight: 700
  ios-event-title:
    fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif"
    fontWeight: 700
  ios-headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif"
    fontWeight: 600
  ios-body:
    fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif"
    fontWeight: 400
  ios-metadata:
    fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif"
    fontWeight: 400
  ios-status:
    fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif"
    fontWeight: 600
  ios-date-day:
    fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif"
    fontWeight: 700
  ios-date-month:
    fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif"
    fontWeight: 600
  ios-date-year:
    fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif"
    fontWeight: 400
rounded:
  control: "0.5rem"
  surface: "0.875rem"
  date: "0.6rem"
  state: "0.35rem"
  pill: "9999px"
  ios-surface: "14px"
  ios-control: "10px"
  ios-cover: "8px"
  ios-state: "6px"
spacing:
  small: "0.5rem"
  medium: "0.75rem"
  regular: "1rem"
  inset: "1.25rem"
  section: "1.5rem"
  workspace: "2rem"
  ios-content-inset: "20px"
  ios-section: "24px"
  ios-row-gap: "16px"
  ios-action-gap: "12px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0.5rem 1rem"
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.secondary-foreground}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0.5rem 1rem"
  button-outline:
    backgroundColor: "{colors.background}"
    rounded: "{rounded.control}"
    typography: "{typography.label}"
    padding: "0.5rem 1rem"
  navigation-active:
    backgroundColor: "{colors.white}"
    textColor: "{colors.primary}"
    rounded: "{rounded.control}"
    padding: "0.7rem 0.85rem"
  state:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.secondary-foreground}"
    rounded: "{rounded.state}"
    padding: "0.3rem 0.6rem"
  event-card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.surface}"
  date:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-foreground}"
    rounded: "{rounded.date}"
    padding: "0.65rem 0.4rem"
  ios-button-primary:
    backgroundColor: "{colors.ios-tint}"
    textColor: "{colors.ios-on-tint}"
    typography: "{typography.ios-headline}"
    rounded: "{rounded.ios-control}"
    padding: "4px 12px"
  ios-surface:
    backgroundColor: "{colors.ios-surface}"
    textColor: "{colors.ios-ink}"
    rounded: "{rounded.ios-surface}"
    padding: "20px"
  ios-date:
    backgroundColor: "{colors.ios-date-background}"
    textColor: "{colors.ios-date-ink}"
    rounded: "{rounded.ios-control}"
    padding: "8px 0"
  ios-state:
    backgroundColor: "{colors.ios-soft-blue}"
    textColor: "{colors.ios-tint}"
    typography: "{typography.ios-status}"
    rounded: "{rounded.ios-state}"
    padding: "6px 10px"
---

# Design System: BoardGameTools

## Overview

**Creative North Star: "Club Programme"**

Club Programme überträgt die Klarheit eines Veranstaltungsprogramms auf die gemeinsame Spielorganisation. Kobaltblaue Navigation, eine helle blaue Arbeitsfläche und klar gestufte Barlow-Schrift bilden die gemeinsame Webgestaltung.

Die Oberflächen bleiben ruhig und überwiegend flach. Datumsblöcke, Trennlinien und beschriftete Aktionen führen durch Termine, Sammlung und Spielhistorie. Die Gestaltung verwendet Code und vorhandene Spielcover; zusätzliche Rastergrafiken gehören nicht zur visuellen Grundausstattung.

Die native iOS-Adaption gilt zunächst für Übersicht, Hauptnavigation, Sammlung und Spieleabende. Sie übernimmt die Farbrollen und das Datumsmotiv von Club Programme mit SF-Systemschrift, Dynamic Type, SF Symbols und systemgeführten Navigationen, Listen und Sheets ab iOS 17. Die Webgestaltung bleibt eigenständig erhalten; die nativen Rollen tragen das Präfix `ios-`.

**Key Characteristics:**
- Kobaltblaue Navigation mit sichtbaren Textbezeichnungen.
- Barlow mit deutlicher Größenhierarchie.
- Blaue Flächentöne und gezielte pfirsichfarbene Datumsakzente.
- Flache Arbeitsbereiche mit feinen Trennlinien.
- Native iOS-Bedienmuster mit Systemschrift, Dynamic Type und SF Symbols.

## Colors

Die Palette verbindet kühles Programmpapier und Kobalt mit einem warmen Datumsakzent. Die Frontmatter dokumentiert die Quellwerte; `src/app/globals.css` bleibt die ausführbare Quelle für sämtliche semantischen Zustände.

Die ausführbare native Quelle ist `ClubTheme` in `BoardGameTools/BoardGameTools/Utilities/Theme.swift`. Die Paare `ios-*` und `ios-dark-*` folgen dem hellen beziehungsweise dunklen Erscheinungsbild. Die SwiftUI-Werte sind in Punkten definiert; portable Maßtokens verwenden dafür CSS-px als numerische Darstellung, keine Vorgabe zur physischen Pixeldichte.

### Primary

- **Programmkobalt** (`primary`): Navigation, Hauptaktionen, Textlinks und aktive Filter. Im dunklen Modus übernimmt `dark-primary` diese Rolle; seine dunkle Vordergrundfarbe bleibt erhalten.

- **Natives Programmkobalt** (`ios-tint` / `ios-dark-tint`): aktive Tabs, Links, Hauptaktionen und Statusschrift. `ios-on-tint` / `ios-dark-on-tint` liefern den Text der eigenen Primärschaltfläche.

### Secondary

- **Pfirsich** (`accent`): hervorgehobener Datumsblock und ausgewählte Interaktionsflächen; dazu der warme dunkle Text `accent-foreground`.
- **Weiches Blau** (`secondary`): Statusflächen, Eventfuß und Bildhintergründe, mit eigenem dunklem Blauton für Text.

- **Nativer Pfirsich** (`ios-date-background` / `ios-dark-date-background`): Datumsblöcke mit gemeinsamem `ios-date-ink`. **Natives weiches Blau** (`ios-soft-blue` / `ios-dark-soft-blue`): Status, Offline-Hinweis und Coverplatzhalter.

### Neutral

- **Blaues Papier** (`background`), **weiße Oberfläche** (`card`) und **blaue Tinte** (`foreground`) gliedern den Arbeitsbereich.
- `muted-foreground` kennzeichnet Metadaten; `border` trennt Zeilen und Abschnitte. Die dunkle Variante nutzt eigene Oberflächen statt einer bloßen Farbinvertierung.
- Erfolg, Warnung, Information und destruktive Aktionen behalten ihre semantischen Farben. Sie sind keine zusätzlichen dekorativen Akzente.

- **Native Flächen und Tinte:** `ios-background`, `ios-surface`, `ios-ink` und `ios-secondary-ink` haben jeweils ausdrücklich eigene dunkle Gegenstücke. Diese nativen Hexwerte ersetzen keine Web-OKLCH-Tokens.

## Typography

**Display Font / Body Font:** Barlow mit `system-ui, -apple-system, sans-serif` als Fallback. Über `next/font` werden die Gewichte 400, 500, 600, 700 und 800 geladen. Geist Mono ist als Fontvariable vorhanden, in den betrachteten Club-Oberflächen aber keine eigene sichtbare Rolle.

### Hierarchy

- **Headline:** Seitenüberschriften gemäß `headline` und unterhalb 768px gemäß `headline-mobile`.
- **Title:** Abschnittsüberschriften gemäß `title`; Eventtitel verwenden mobil dieselbe Größe mit Zeilenhöhe 1.2 und wachsen ab 1024px auf 1.7rem.
- **Body:** normale Texte gemäß `body`; Einführungstexte sind 1.1rem, Metadaten 0.95rem.
- **Label:** Schaltflächen gemäß `label`; Navigation verwendet 1rem bei Gewicht 500, aktiv 700.
- **Datum:** Tageszahlen verwenden Gewicht 700 und Zeilenhöhe 1; mobil 2.4rem, ab 768px 3.5rem. Ziffern werden tabellarisch gesetzt.

### Native iOS-Hierarchie

SF-Systemschrift folgt semantischen SwiftUI-Textstilen statt einer festen Web-Schriftgröße: `ios-section-title` entspricht `.title3.bold()`, `ios-event-title` `.title2.bold()`, `ios-headline` `.headline`, `ios-body` `.body`, `ios-metadata` `.subheadline` und `ios-status` `.footnote.weight(.semibold)`. Der Datumsblock verwendet `.largeTitle.bold()` mit tabellarischen Ziffern, `.caption.weight(.semibold)` für den Monat und `.caption2` für das Jahr. Dynamic Type bestimmt die tatsächliche Größe und Zeilenhöhe; die Frontmatter setzt deshalb keine feste native Schriftgröße. Native Navigationsüberschriften bleiben systemgeführt.

## Layout

Der gemeinsame Rahmen ist mobil einspaltig. Ab 1024px steht links eine 232px breite, am oberen Rand haftende Navigation mit einer Höhe von 100dvh und eigener vertikaler Scrollmöglichkeit. Der Arbeitsbereich hat mobil seitlich 1.25rem Abstand, auf Desktop `clamp(1.5rem, 3vw, 2.75rem)`; es gibt keine feste maximale Inhaltsbreite.

Das Dashboard wechselt ab 768px zu zwei Spalten (`minmax(0, 1fr) minmax(15rem, .46fr)`) mit 2rem Abstand. Mobil folgen Termine, Aktionen und Historie aufeinander. Diese Inhaltsreihenfolge gehört zum Dashboard, nicht als zwingende Vorlage zu allen Seiten. Die Sammlung verwendet ein Raster mit 1.25rem Abstand, ab 640px zwei und ab 1280px drei Spalten. Filter umbrechen, statt horizontales Scrollen zu erzwingen.

Die native Übersicht verwendet einen zentrierten Inhalt mit maximal 720pt Breite, 20pt Außenabstand und 24pt Abschnittsabstand. Eigene Inhaltsflächen haben 20pt Innenabstand. Sammlung und Spieleabende verwenden native gruppierte Listen mit Zeilenabständen von 8pt vertikal und 16pt horizontal. Bei Accessibility-Schriftgrößen wechseln Aktionsgruppen sowie Spiel- und Terminzeilen vom horizontalen ins vertikale Layout. Der native Aufbau wird nicht aus Web-Breakpoints abgeleitet.

## Elevation & Depth

Die Club-Oberflächen vermitteln Tiefe hauptsächlich durch Flächenfarben und Trennlinien. Eventkarte und Filterbereich besitzen keinen eigenen Schatten. Sammlungskarten setzen den Schatten und Rand der Basiskarte ausdrücklich zurück. Bestehende UI-Primitiven wie Eingabefelder und Outline-Schaltflächen tragen weiterhin kleine Standardschatten; daraus entsteht keine neue Schattenhierarchie für Inhaltsflächen.

Native Club-Inhaltsflächen bleiben ohne eigenen Schatten. Tiefe entsteht durch `ios-background`, `ios-surface`, Trennlinien und die von iOS gesteuerte Präsentation von Navigation und Sheets. Bestehende ältere Detailansichten mit `Theme.Card` sind nicht die Vorlage für neue Club-Flächen.

## Shapes

Ruhige, gerundete Rechtecke prägen die Oberfläche: Steuerelemente und Navigation verwenden `control`, größere Club-Flächen `surface`. Datumsblöcke und Statusfelder haben eigene Radien. Filtertags sind vollständig gerundet. Trennlinien sind überwiegend 1px stark; der erste Einladungseintrag beginnt mit einer 2px starken Primärlinie.

Native Club-Flächen verwenden 14pt Radius, eigene Primäraktionen und Datumsblöcke 10pt, Cover 8pt und Status 6pt. Native Systemsteuerelemente behalten ihre Plattformform.

## Components

### Buttons

Primär- und Sekundärschaltflächen verwenden die semantischen Farben und den Kontrollradius. Im Arbeitsbereich erhalten Schaltflächen eine Mindesthöhe von 2.75rem; Icon-Schaltflächen zusätzlich dieselbe Mindestbreite. Die normale Variante hat horizontales Padding von 1rem, bei direktem SVG-Kind 0.75rem. Hover reduziert bei Primäraktionen die Hintergrunddeckkraft auf 90%; Outline und Ghost verwenden den Akzent. Tastaturfokus zeigt den bestehenden 3px-Fokusring mit halber Ringdeckkraft. Deaktivierte Schaltflächen haben halbe Deckkraft und nehmen keine Zeigerereignisse an.

### Chips

Aktive Sammlungstags verwenden Primärhintergrund und Primärtextgegenfarbe; inaktive Tags nutzen `muted` und `muted-foreground`. `aria-pressed` vermittelt den Filterzustand. Eventstatus verwendet die kompakte rechteckige `state`-Form statt einer Pille.

### Cards / Containers

Die hervorgehobene Eventkarte kombiniert eine weiße beziehungsweise dunkle Kartenfläche, einen Datumsblock und einen sekundär gefärbten Fuß. Kopf und Inhaltsbereiche haben 1.5rem horizontalen Abstand. Sammlungskarten zeigen vorhandene Cover unbeschnitten in einem 13rem hohen Bildbereich; Hover wechselt die Kartenfläche zu `secondary`. Leere Zustände bleiben lesbare Inhaltsflächen mit Text und passender Aktion.

### Inputs / Fields

Das bestehende Eingabeprimitiv hat einen 1px-Rand, Kontrollradius, horizontales Padding von 0.75rem, Schriftgröße 0.875rem und einen kleinen Schatten. Fokus zeigt einen Ring in der semantischen Ringfarbe. Platzhalter verwenden die gedämpfte Textfarbe; deaktivierte Felder erhalten halbe Deckkraft. Im Club-Arbeitsbereich erhalten native Eingaben außer Checkboxen und Radios sowie Select-Auslöser eine Mindesthöhe von 2.75rem und die Kartenhintergrundfarbe.

### Navigation

Alle Hauptziele kombinieren ein Lucide-SVG mit sichtbarem Text. Der aktive Eintrag ist weiß mit Kobaltschrift, Hover verwendet die Seitenleistenakzentfarbe. Unterhalb 1024px klappt ein beschrifteter Menüschalter die Linkliste auf. Auswahl und Escape schließen sie; Escape gibt den Fokus an den Schalter zurück. Tastaturfokus in der Navigation verwendet eine 3px starke Akzentkontur mit 2px Abstand.

### Native iOS-Komponenten

`ClubTheme.PrimaryButton` ist vollbreit mit `.headline`, mindestens 44pt Inhaltshöhe vor 4pt vertikalem Padding und 12pt horizontalem Padding. Gedrückt sinkt die Deckkraft auf 80%. Sekundäre Aktionen verwenden den nativen `.bordered`-Stil; leere Listen den nativen `ContentUnavailableView` mit passender Aktion. Die Suche nutzt `.searchable`, Filter und Hinzufügen öffnen native Sheets. SF Symbols werden mit Text oder Accessibility-Beschriftung verwendet.

Die fünf nativen Tabs heißen Übersicht, Spiele, Sessions, Spieleabende und Mehr; Mehr erschließt Gruppen, Spielereihen und Einstellungen. `NavigationStack`, Tabauswahl, Fokus und Übergänge folgen iOS. Es gibt keine eigene Animationskurve oder nachgebaute Webseitenleiste.

Der native Datumsblock wird in Übersicht und Spieleabendliste gemeinsam verwendet: skalierte Mindestbreite ab 66pt, Mindesthöhe 82pt vor vertikalem Padding, Tag/Monat/Jahr und ein vollständiges VoiceOver-Datum. Der Status bleibt zusätzlich ausgeschrieben. Sammlungscovers passen vollständig in eine Fläche von 64 × 80pt; bei großer Schrift stehen sie über dem Text.

### Datumsblock

Der hervorgehobene Termin verwendet einen vertikal gestapelten Tageswert und Monatstext. Mobil ist die Fläche 4.5rem breit und mindestens 5.25rem hoch; ab 768px 5.75rem breit und mindestens 6.75rem hoch. Weitere Termine verwenden die kompakte transparente Variante. Dieses Datumsmotiv ist für Termine bestimmt.

## Do's and Don'ts

### Do:
- **Do** semantische Farbvariablen für Flächen, Text und Zustände verwenden.
- **Do** Navigation und Aktionen verständlich auf Deutsch beschriften.
- **Do** vorhandene Spielcover vollständig im Bildbereich darstellen.
- **Do** sichtbaren Tastaturfokus und reduzierte Bewegung erhalten.
- **Do** in nativen Club-Oberflächen `ClubTheme`, semantische Textstile und systemgeführte Navigation verwenden.
- **Do** bei Accessibility-Schriftgrößen Inhalte vertikal anordnen und Status zusätzlich als Text zeigen.

### Don't:
- **Don't** die Desktopspalten auf schmale Ansichten übertragen.
- **Don't** die pfirsichfarbene Datumsfläche als allgemeinen Kartenhintergrund einsetzen.
- **Don't** Schatten der Basiskarte in die flachen Sammlungskarten zurückbringen.

Die Dokumentation beschreibt den implementierten Stand, keine vollständige WCAG-Konformitätsprüfung. Extraktionsgrundlage: `src/app/globals.css`, `src/app/club.css`, `src/app/layout.tsx`, gemeinsame UI-Primitiven, Navigation, Dashboard und Sammlungskomponenten. Der gewählte Richtungsvertrag steht unter `.impeccable/surfaces/src-app-dashboard-dashboard-page-tsx.md`.

Native Extraktionsgrundlage: `Theme.swift` (`ClubTheme`), `DashboardView.swift`, `MainTabView.swift`, `GameListView.swift` und `EventListView.swift`. Richtungsvertrag: `.impeccable/surfaces/boardgametools-boardgametools-views-dashboardview-swift.md`; bestätigte Oberflächenspezifikation: `docs/superpowers/specs/2026-10-30-ios-club-programme-design.md`. Der unabhängige Abschlussreview gab 13 gültige Simulatorbilder unter `.impeccable/review/ios/` mit Disposition `ship` frei. Diese Evidenz betrifft statische Simulatoransichten einschließlich dunkler Darstellung und großer Schrift; sie ist keine Hardwareabnahme oder vollständige Accessibility-Prüfung. Ältere native Detail- und Bearbeitungsansichten werden nicht als Club-Programme-Systemregeln kanonisiert.
