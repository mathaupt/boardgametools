---
name: BoardGameTools — Club Programme
description: Klare gemeinsame Weboberflächen für Spieleabende und Spielesammlung.
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
rounded:
  control: "0.5rem"
  surface: "0.875rem"
  date: "0.6rem"
  state: "0.35rem"
  pill: "9999px"
spacing:
  small: "0.5rem"
  medium: "0.75rem"
  regular: "1rem"
  inset: "1.25rem"
  section: "1.5rem"
  workspace: "2rem"
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
---

# Design System: BoardGameTools

## Overview

**Creative North Star: "Club Programme"**

Club Programme überträgt die Klarheit eines Veranstaltungsprogramms auf die gemeinsame Spielorganisation. Kobaltblaue Navigation, eine helle blaue Arbeitsfläche und klar gestufte Barlow-Schrift bilden die gemeinsame Webgestaltung.

Die Oberflächen bleiben ruhig und überwiegend flach. Datumsblöcke, Trennlinien und beschriftete Aktionen führen durch Termine, Sammlung und Spielhistorie. Die Gestaltung verwendet Code und vorhandene Spielcover; zusätzliche Rastergrafiken gehören nicht zur visuellen Grundausstattung.

**Key Characteristics:**
- Kobaltblaue Navigation mit sichtbaren Textbezeichnungen.
- Barlow mit deutlicher Größenhierarchie.
- Blaue Flächentöne und gezielte pfirsichfarbene Datumsakzente.
- Flache Arbeitsbereiche mit feinen Trennlinien.

## Colors

Die Palette verbindet kühles Programmpapier und Kobalt mit einem warmen Datumsakzent. Die Frontmatter dokumentiert die Quellwerte; `src/app/globals.css` bleibt die ausführbare Quelle für sämtliche semantischen Zustände.

### Primary

- **Programmkobalt** (`primary`): Navigation, Hauptaktionen, Textlinks und aktive Filter. Im dunklen Modus übernimmt `dark-primary` diese Rolle; seine dunkle Vordergrundfarbe bleibt erhalten.

### Secondary

- **Pfirsich** (`accent`): hervorgehobener Datumsblock und ausgewählte Interaktionsflächen; dazu der warme dunkle Text `accent-foreground`.
- **Weiches Blau** (`secondary`): Statusflächen, Eventfuß und Bildhintergründe, mit eigenem dunklem Blauton für Text.

### Neutral

- **Blaues Papier** (`background`), **weiße Oberfläche** (`card`) und **blaue Tinte** (`foreground`) gliedern den Arbeitsbereich.
- `muted-foreground` kennzeichnet Metadaten; `border` trennt Zeilen und Abschnitte. Die dunkle Variante nutzt eigene Oberflächen statt einer bloßen Farbinvertierung.
- Erfolg, Warnung, Information und destruktive Aktionen behalten ihre semantischen Farben. Sie sind keine zusätzlichen dekorativen Akzente.

## Typography

**Display Font / Body Font:** Barlow mit `system-ui, -apple-system, sans-serif` als Fallback. Über `next/font` werden die Gewichte 400, 500, 600, 700 und 800 geladen. Geist Mono ist als Fontvariable vorhanden, in den betrachteten Club-Oberflächen aber keine eigene sichtbare Rolle.

### Hierarchy

- **Headline:** Seitenüberschriften gemäß `headline` und unterhalb 768px gemäß `headline-mobile`.
- **Title:** Abschnittsüberschriften gemäß `title`; Eventtitel verwenden mobil dieselbe Größe mit Zeilenhöhe 1.2 und wachsen ab 1024px auf 1.7rem.
- **Body:** normale Texte gemäß `body`; Einführungstexte sind 1.1rem, Metadaten 0.95rem.
- **Label:** Schaltflächen gemäß `label`; Navigation verwendet 1rem bei Gewicht 500, aktiv 700.
- **Datum:** Tageszahlen verwenden Gewicht 700 und Zeilenhöhe 1; mobil 2.4rem, ab 768px 3.5rem. Ziffern werden tabellarisch gesetzt.

## Layout

Der gemeinsame Rahmen ist mobil einspaltig. Ab 1024px steht links eine 232px breite, am oberen Rand haftende Navigation mit einer Höhe von 100dvh und eigener vertikaler Scrollmöglichkeit. Der Arbeitsbereich hat mobil seitlich 1.25rem Abstand, auf Desktop `clamp(1.5rem, 3vw, 2.75rem)`; es gibt keine feste maximale Inhaltsbreite.

Das Dashboard wechselt ab 768px zu zwei Spalten (`minmax(0, 1fr) minmax(15rem, .46fr)`) mit 2rem Abstand. Mobil folgen Termine, Aktionen und Historie aufeinander. Diese Inhaltsreihenfolge gehört zum Dashboard, nicht als zwingende Vorlage zu allen Seiten. Die Sammlung verwendet ein Raster mit 1.25rem Abstand, ab 640px zwei und ab 1280px drei Spalten. Filter umbrechen, statt horizontales Scrollen zu erzwingen.

## Elevation & Depth

Die Club-Oberflächen vermitteln Tiefe hauptsächlich durch Flächenfarben und Trennlinien. Eventkarte und Filterbereich besitzen keinen eigenen Schatten. Sammlungskarten setzen den Schatten und Rand der Basiskarte ausdrücklich zurück. Bestehende UI-Primitiven wie Eingabefelder und Outline-Schaltflächen tragen weiterhin kleine Standardschatten; daraus entsteht keine neue Schattenhierarchie für Inhaltsflächen.

## Shapes

Ruhige, gerundete Rechtecke prägen die Oberfläche: Steuerelemente und Navigation verwenden `control`, größere Club-Flächen `surface`. Datumsblöcke und Statusfelder haben eigene Radien. Filtertags sind vollständig gerundet. Trennlinien sind überwiegend 1px stark; der erste Einladungseintrag beginnt mit einer 2px starken Primärlinie.

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

### Datumsblock

Der hervorgehobene Termin verwendet einen vertikal gestapelten Tageswert und Monatstext. Mobil ist die Fläche 4.5rem breit und mindestens 5.25rem hoch; ab 768px 5.75rem breit und mindestens 6.75rem hoch. Weitere Termine verwenden die kompakte transparente Variante. Dieses Datumsmotiv ist für Termine bestimmt.

## Do's and Don'ts

### Do:
- **Do** semantische Farbvariablen für Flächen, Text und Zustände verwenden.
- **Do** Navigation und Aktionen verständlich auf Deutsch beschriften.
- **Do** vorhandene Spielcover vollständig im Bildbereich darstellen.
- **Do** sichtbaren Tastaturfokus und reduzierte Bewegung erhalten.

### Don't:
- **Don't** die Desktopspalten auf schmale Ansichten übertragen.
- **Don't** die pfirsichfarbene Datumsfläche als allgemeinen Kartenhintergrund einsetzen.
- **Don't** Schatten der Basiskarte in die flachen Sammlungskarten zurückbringen.

Die Dokumentation beschreibt den implementierten Stand, keine vollständige WCAG-Konformitätsprüfung. Extraktionsgrundlage: `src/app/globals.css`, `src/app/club.css`, `src/app/layout.tsx`, gemeinsame UI-Primitiven, Navigation, Dashboard und Sammlungskomponenten. Der gewählte Richtungsvertrag steht unter `.impeccable/surfaces/src-app-dashboard-dashboard-page-tsx.md`.
