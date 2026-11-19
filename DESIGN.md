---
name: BoardGameTools — Split-Flap
description: Dunkle, präzise Spielorganisation mit dem Charakter einer mechanischen Anzeigetafel.
colors:
  background: "#0B0B0D"
  surface: "#1B1D20"
  surface-raised: "#202226"
  steel: "#2A2D31"
  steel-mid: "#3B3E42"
  steel-light: "#5B5E63"
  foreground: "#F2F2F2"
  muted-foreground: "#BFC1C4"
  amber: "#FFB000"
  amber-foreground: "#17191C"
  error: "#B00020"
  error-foreground: "#FFFFFF"
  ios-tint: "#2445B4"
  ios-dark-tint: "#A8BAFF"
  ios-background: "#EAF0FF"
  ios-dark-background: "#151923"
  ios-surface: "#FFFFFF"
  ios-dark-surface: "#202637"
  ios-ink: "#172648"
  ios-dark-ink: "#EDF1FF"
typography:
  display:
    fontFamily: "Barlow Condensed, sans-serif"
    fontSize: "clamp(2.25rem, 4vw, 3.75rem)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.02em"
  event-title:
    fontFamily: "Barlow Condensed, sans-serif"
    fontSize: "1.7rem"
    fontWeight: 700
    lineHeight: 1.05
  date-status:
    fontFamily: "Barlow Condensed, sans-serif"
    fontWeight: 700
  body:
    fontFamily: "Barlow, system-ui, -apple-system, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  compact-data:
    fontFamily: "Geist Mono, monospace"
    fontWeight: 700
rounded:
  control: "0.5rem"
  nav: "0.625rem"
  surface: "0.875rem"
  status: "0.375rem"
spacing:
  small: "0.5rem"
  regular: "1rem"
  inset: "1.25rem"
  section: "1.5rem"
  workspace: "2rem"
components:
  button-primary:
    backgroundColor: "{colors.amber}"
    textColor: "{colors.amber-foreground}"
    rounded: "{rounded.control}"
    height: "2.75rem"
  navigation-active:
    backgroundColor: "{colors.amber}"
    textColor: "{colors.amber-foreground}"
    rounded: "{rounded.nav}"
    padding: "0.7rem 0.85rem"
  event-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.surface}"
  date-tile:
    backgroundColor: "{colors.amber}"
    textColor: "{colors.amber-foreground}"
    typography: "{typography.date-status}"
    rounded: "{rounded.control}"
    width: "4.5rem"
    height: "5.25rem"
---

# Design System: BoardGameTools — Split-Flap Web

## Overview

**Creative North Star: „Split-Flap“**

Das Websystem nimmt die klare, mechanische Anmutung einer Split-Flap-Anzeigetafel auf: dunkles Graphit, matte Stahlflächen und lesbare helle Schrift bilden den ruhigen Grund. Amber setzt wenige, eindeutige Signale für aktive Navigation, Aktionen und Termine. Rot bleibt Fehlerzuständen vorbehalten.

Barlow trägt Fließtexte; lokal gehostetes Barlow Condensed setzt Display-Überschriften, Termintitel, Datum und Status. Geist Mono bleibt für kompakte Zahlenwerte und Datenüberschriften. Die Datumskachel zeigt eine sichtbare horizontale Mittelfuge; die hervorgehobene Eventkarte trägt eine 3px-Oberkante mit Amberstart und Stahlspur. Produktinhalte, Routen und Bedienabläufe bleiben unverändert.

Die native iOS-App behält ihr bestätigtes, eigenständiges Club-Programme-System mit adaptiven Blau- und Pfirsichfarben, SF-Systemschrift und nativen SwiftUI-Mustern. Es ist plattformspezifisch und keine Farb- oder Komponentenquelle für neue Weboberflächen. Maßgeblich dafür sind `ClubTheme` und die iOS-Designspezifikation.

**Key Characteristics:**
- Dunkle, nahezu schwarze Webgrundfläche mit gestaffelten Stahlflächen.
- Amber als klarer Interaktions- und Datumsakzent; Rot ausschließlich für Fehler.
- Barlow für Fließtext, lokal gehostetes Barlow Condensed für Display, Termintitel, Datum und Status.
- Geist Mono für kompakte Werte und Datenüberschriften.
- Datumsblock mit sichtbarer horizontaler Mittelnaht.
- Eventkarte mit 3px-Oberkante aus Amberstart und Stahlspur.
- Eigenständige native iOS-Gestaltung bleibt erhalten.

## Colors

Die Webpalette folgt den bestätigten Split-Flap-Farben. Semantische Variablen in `src/app/globals.css` sind die Laufzeitquelle; unterstützende Vordergrund- und Statusfarben bleiben an ihrer jeweiligen Rolle.

### Primary
- **Anzeigetafel-Amber** (`amber`, #FFB000): Aktionen, Links und aktive Navigation.

### Neutral
- **Nacht** (`background`, #0B0B0D): globale Seitenfläche.
- **Graphit** (`surface`, #1B1D20) und **Tiefstahl** (`surface-raised`, #202226): Karten und Popover.
- **Stahl** (`steel`, #2A2D31), **Stahlkante** (`steel-mid`, #3B3E42) und **Hellstahl** (`steel-light`, #5B5E63): sekundäre Flächen, Linien und Eingabekonturen.
- **Anzeigeschrift** (`foreground`, #F2F2F2) und **Gedämpfte Anzeige** (`muted-foreground`, #BFC1C4): Haupttext und Metadaten.

### Named Rules
**Die Amber-Signal-Regel.** Amber markiert Interaktion und die Datumskachel; Rot (#B00020) ist Fehlerzuständen vorbehalten.

### Native iOS — separates Farbsystem
Die iOS-App behält die adaptiven Rollen in `ClubTheme`: Tint #2445B4 / #A8BAFF, Hintergrund #EAF0FF / #151923, Oberfläche #FFFFFF / #202637 und Tinte #172648 / #EDF1FF. Diese Werte gelten ausschließlich für iOS.

## Typography

**Display Font:** Barlow Condensed (lokal gehostet, Schriftschnitte 500, 600 und 700)
**Body Font:** Barlow (mit `system-ui, -apple-system, sans-serif`)
**Label/Mono Font:** Geist Mono mit `monospace` als Fallback für kompakte Werte und Datenüberschriften.

**Character:** Barlow bleibt die klare Leseschrift. Barlow Condensed gibt Überschriften und den Terminanzeigen eine schmale, signalhafte Form; Geist Mono hält kompakte Werte tabellarisch lesbar.

### Hierarchy
- **Display** (Barlow Condensed 700, `clamp(2.25rem, 4vw, 3.75rem)`, Zeilenhöhe 1): Seitenüberschriften.
- **Headline** (Barlow Condensed 700, 1.7rem Desktop, Zeilenhöhe 1.05): hervorgehobene Terminüberschrift.
- **Title** (700, 1.4–1.45rem): Abschnitts- und Kartenüberschriften.
- **Body** (400, 1rem): Fließtext; allgemeine Zeilenhöhe folgt dem Browser-/Utility-Verhalten, sofern keine Komponente sie festlegt.
- **Label / Status** (Barlow Condensed 700, 1rem): kompakte Statusanzeige in Versalien mit 0.055em Laufweite.
- **Datum** (Barlow Condensed 700): tabellarische Tagesziffern; 2.6rem mobil und 3.5rem ab 768px.
- **Kompaktwerte** (Geist Mono): kurze numerische Werte und Datenüberschriften.

### Native iOS-Typografie
Die native App verwendet SF-Systemschrift und semantische SwiftUI-Textstile mit Dynamic Type. Diese Hierarchie wird nicht in Webschriftgrößen übersetzt.

## Layout

Der Seitenrahmen ist responsiv. Unter 1024px ist die Navigation einklappbar; ab 1024px steht sie als 248px breite, haftende Seitenleiste neben dem flexiblen Hauptbereich. Der Inhalt erhält mobil 1rem seitlichen Abstand, ab 768px 1.5rem und auf Desktop `clamp(1.5rem, 3vw, 3rem)`. Es gibt keine festgelegte maximale Inhaltsbreite.

Das Dashboard nutzt mobil einen einspaltigen Ablauf. Ab 768px werden Terminbereich und Aktionsbereich in zwei Spalten mit 2rem Abstand angeordnet; die Historie bleibt unter dem Terminbereich. Andere Seiten übernehmen diese Dashboard-Anordnung nicht automatisch. Kleine Touch-Ziele vermeiden: Navigation und Arbeitsbereichsaktionen haben mindestens 2.75rem Höhe.

## Elevation & Depth

Die Webgestaltung ist überwiegend flach. Flächenwechsel und Stahl-Trennlinien strukturieren Inhalte; Event- und Sammlungskarten führen keinen eigenen Schatten. Vorhandene allgemeine UI-Primitiven können eigene Basisstile besitzen und sind keine neue Schattenhierarchie.

## Shapes

Die Formen sind kompakte, gerundete Rechtecke. Arbeitsflächen und Eventkarten verwenden 0.875rem Radius, Navigation etwa 0.625rem, Controls 0.5rem und Statusfelder 0.375rem. Feine Linien trennen Bereiche. Der Datumskachel-Schnitt verläuft horizontal auf halber Höhe; seine Naht bleibt sichtbar, während die Kachel selbst als ein Block lesbar bleibt.

## Components

### Buttons
Aktionen stehen klar auf dunkler Fläche. Die Primäraktion nutzt Amber mit dunkler Vordergrundfarbe; Arbeitsbereichsbuttons sind mindestens 2.75rem hoch. Der globale sichtbare Tastaturfokus ist ein 3px Amber-Ring mit 3px Abstand. Bewegung respektiert `prefers-reduced-motion`.

### Cards / Containers
Termin- und Filterflächen nutzen Graphit, eine 1px Stahlkante und abgerundete Ecken. Die hervorgehobene Eventkarte kombiniert Metadaten, Status, Abstimmungsvorschläge und eine dunklere Fußzeile. Sammlungskarten bleiben flach; beim Hover wechselt ihre Fläche auf Stahl.

### Inputs / Fields
Arbeitsbereichseingaben und Select-Auslöser haben mindestens 2.75rem Höhe und dunkle Kartenfläche. Fokus erhält den globalen Amber-Fokusring. Checkboxen und Radios behalten ihre eigene Komponentenbehandlung.

### Navigation
Hauptziele kombinieren Lucide-Icon und sichtbare deutsche Bezeichnung. Ab 1024px ist die Navigation eine 248px Seitenleiste; darunter wird sie über einen Menüschalter geöffnet. Der aktive Eintrag ist amberfarben mit dunkler Schrift, Hover nutzt Stahl. Fokus in der Seitenleiste hat einen 3px Amber-Ring mit 2px Abstand.

### Split-Flap-Datumskachel
Die hervorgehobene Datumskachel ist amberfarben, vertikal gestapelt und durch eine Stahlnaht zwischen oberem und unterem Segment geteilt. Mobil misst sie 4.5rem × mindestens 5.25rem, ab 768px 5.75rem × mindestens 6.75rem. Tageszahl und Monat verwenden lokal gehostetes Barlow Condensed und tabellarische Ziffern. Kompakte Datumsvarianten sind transparent und zeigen keine Naht.

### Eventkarte
Die hervorgehobene Eventkarte hat eine präzise 3px starke Oberkante: Amber beginnt links über der Breite der Datumskachel, danach läuft die Kante als Stahlspur weiter. Der Akzent markiert die ausgewählte Karte und bleibt auf dieser Variante.

### Status
Status erscheinen als kompakte, rechteckige Stahlchips mit Barlow Condensed, Versalien und sichtbarem Text. Farbe ergänzt den Status, ersetzt seine Beschriftung nicht.

## Do's and Don'ts

### Do:
- **Do** die dunklen semantischen CSS-Variablen für Webflächen, Text und Interaktionen verwenden.
- **Do** Amber für aktive Navigation, Aktionen und die charakteristische Datumskachel einsetzen.
- **Do** Display, Termintitel, Datum und Status mit lokal gehostetem Barlow Condensed setzen.
- **Do** kompakte Werte und Datenüberschriften mit Geist Mono setzen.
- **Do** die horizontale Mittelnaht der hervorgehobenen Datumskachel erhalten.
- **Do** die 3px-Oberkante der hervorgehobenen Eventkarte mit Amberstart und Stahlspur erhalten.
- **Do** die 248px Desktopnavigation und den responsiven einspaltigen Mobilaufbau berücksichtigen.
- **Do** Status zusätzlich verständlich beschriften und Tastaturfokus sichtbar halten.
- **Do** die bestätigte adaptive Club-Programme-Gestaltung ausschließlich für native iOS-Oberflächen weiterführen.

### Don't:
- **Don't** Rot als dekorativen Webakzent verwenden; es ist Fehlerzuständen vorbehalten.
- **Don't** die native iOS-Farbpalette auf Weboberflächen übertragen.
- **Don't** der flachen Sammlungskarte Schatten hinzufügen.
- **Don't** die Dashboard-Spaltenanordnung auf schmale Ansichten übertragen.

Dokumentationsgrundlage: `PRODUCT.md`, `src/app/globals.css`, `src/app/club.css`, `src/app/layout.tsx`, `src/components/layout/navbar.tsx`, `src/components/dashboard/event-preview.tsx` und `BoardGameTools/BoardGameTools/Utilities/Theme.swift`. Produktfakten, Routen und Verhalten bleiben unverändert.
