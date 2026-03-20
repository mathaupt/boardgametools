# Accessibility – Verbindliche Regeln

> Dieses Skill-Dokument definiert die Barrierefreiheits-Standards für BoardGameTools.
> Alle neuen und bestehenden Komponenten MÜSSEN diese Regeln einhalten.

## Grundsätze

BoardGameTools orientiert sich an **WCAG 2.1 Level AA**. Ziel ist eine Anwendung, die für alle Nutzer – unabhängig von Einschränkungen – bedienbar ist.

---

## 1. Farbkontrast

| Element | Mindestkontrast | Referenz |
|---------|----------------|----------|
| Normaler Text (< 18px / < 14px bold) | **4.5 : 1** | WCAG 1.4.3 |
| Großer Text (≥ 18px / ≥ 14px bold) | **3 : 1** | WCAG 1.4.3 |
| UI-Komponenten & Grafiken | **3 : 1** | WCAG 1.4.11 |
| Deaktivierte Elemente | ausgenommen | WCAG 1.4.3 |

### Prüfung

- Alle Text-/Hintergrund-Kombinationen mit einem Kontrastprüfer validieren
- Sowohl Light- als auch Dark-Theme prüfen
- Farbige Badges und Status-Indikatoren dürfen **nicht allein** auf Farbe setzen → zusätzlich Icon oder Text verwenden

---

## 2. Schriftgrößen

| Element | Mindestgröße |
|---------|-------------|
| Fließtext | `text-sm` (14px) |
| Beschriftungen (Labels) | `text-xs` (12px) |
| Überschriften | `text-lg` (18px) oder größer |
| Eingabefelder | `text-sm` (14px) |
| Buttons | `text-sm` (14px) |

- Schriftgrößen in `rem` oder Tailwind-Klassen angeben, **niemals** in `px` direkt
- `font-size` darf nicht per `!important` fixiert werden → Nutzer-Zoom muss funktionieren

---

## 3. Fokuszustände

Jedes interaktive Element MUSS einen sichtbaren Fokusring haben:

```css
/* Standard-Fokusring (bereits in globals.css definiert) */
:focus-visible {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
}
```

### Regeln

- **Nie** `outline: none` ohne Ersatz setzen
- `focus-visible` bevorzugen (kein Ring bei Mausklick, nur bei Tastatur)
- Fokusreihenfolge muss logisch sein (DOM-Reihenfolge = visuelle Reihenfolge)
- Modale Dialoge müssen den Fokus **einfangen** (Focus Trap)
- Nach Schließen eines Dialogs: Fokus zurück zum auslösenden Element

---

## 4. Touch-Flächen

| Element | Mindestgröße |
|---------|-------------|
| Buttons, Links, Icons | **44 × 44 px** |
| Inline-Links im Fließtext | Ausnahme (Schriftgröße reicht) |

- `min-h-[44px] min-w-[44px]` für Icon-Buttons
- Ausreichend Abstand zwischen Touch-Zielen (≥ 8px)

---

## 5. Semantisches HTML

- Überschriften-Hierarchie einhalten: `h1` → `h2` → `h3` (keine Sprünge)
- Listen mit `<ul>` / `<ol>` auszeichnen
- Formulare: Jedes `<input>` braucht ein `<label>` (oder `aria-label`)
- Tabellen: `<th>` mit `scope` verwenden
- Landmarks nutzen: `<main>`, `<nav>`, `<aside>`, `<header>`, `<footer>`

---

## 6. ARIA-Attribute

### Pflicht

| Situation | Attribut |
|-----------|---------|
| Icon-Button ohne Text | `aria-label="Beschreibung"` |
| Ladeindikator (Spinner) | `aria-busy="true"` auf Container |
| Dynamisch geladene Inhalte | `aria-live="polite"` auf Container |
| Expandierbare Bereiche | `aria-expanded="true/false"` |
| Aktiver Tab / Navigation | `aria-current="page"` |

### Verboten

- `aria-label` auf nicht-interaktiven Elementen (div, span) → stattdessen `role` hinzufügen oder semantisches Element verwenden
- Redundantes ARIA (z.B. `role="button"` auf `<button>`)

---

## 7. Bilder und Medien

- Jedes `<Image>` / `<img>` braucht ein **aussagekräftiges** `alt`-Attribut
- Dekorative Bilder: `alt=""` und `aria-hidden="true"`
- SVG-Icons: `aria-hidden="true"` wenn begleitender Text vorhanden

---

## 8. Tastaturnavigation

- Alle Funktionen müssen per Tastatur erreichbar sein
- `Tab` zum Navigieren, `Enter` / `Space` zum Aktivieren
- `Escape` schließt Modale/Dropdowns
- Keine Keyboard-Traps (Nutzer muss immer weiter navigieren können)

---

## 9. Bewegung und Animation

- `prefers-reduced-motion` respektieren:
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
  ```
- Keine automatisch startenden Animationen > 5 Sekunden ohne Pausier-Möglichkeit

---

## 10. Formulare und Fehlermeldungen

- Fehler direkt am Feld anzeigen (nicht nur oben auf der Seite)
- Fehlermeldungen mit `role="alert"` oder `aria-live="assertive"`
- Pflichtfelder mit `aria-required="true"` kennzeichnen
- Erfolgsmeldungen mit `aria-live="polite"`

---

## Checkliste für Code-Reviews

- [ ] Alle interaktiven Elemente per Tab erreichbar?
- [ ] Fokusring sichtbar?
- [ ] Touch-Flächen ≥ 44px?
- [ ] Kontrast ≥ 4.5:1 für Text?
- [ ] Überschriften-Hierarchie korrekt?
- [ ] Alle Bilder mit `alt`?
- [ ] Icon-Buttons mit `aria-label`?
- [ ] Formulare mit Labels?
- [ ] Fehlermeldungen für Screenreader zugänglich?
- [ ] `prefers-reduced-motion` berücksichtigt?
