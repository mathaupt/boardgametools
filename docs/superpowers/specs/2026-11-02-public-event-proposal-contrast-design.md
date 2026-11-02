# Design-Spec: Lesbare Spielvorschläge auf der öffentlichen Eventseite

## Ziel

Die Treffer aus der eigenen Sammlung und der BGG-Suche sollen sich auf der
öffentlichen Eventseite visuell klar vom Hintergrund und vom umgebenden
Suchbereich abheben. Lesbarkeit und Erkennbarkeit müssen in hellem und dunklem
Theme erhalten bleiben.

## Bestand

- BGG-Treffer in `src/components/public-event/bgg-search-results.tsx` nutzen
  `bg-background/80` bei einem bereits ähnlich hellen Hintergrund.
- Sammlungstreffer in
  `src/components/public-event/collection-game-proposer.tsx` verwenden dieselbe
  halbtransparente Flächenrolle.
- Namen und Metadaten verwenden bereits die semantischen Textfarben
  `text-foreground` und `text-muted-foreground`.
- Produktgestaltung ist Club Programme: blaue Arbeitsfläche, ruhige Flächen,
  feine Trennlinien und semantische Farbrollen.

## Bestätigte Gestaltung

Beide Trefferlisten erhalten eine deckende semantische Kartenfläche
(`bg-card`/`text-card-foreground`) und eine klar erkennbare Border. So entsteht
ein eigener, ruhiger Flächenkontrast gegenüber dem Suchbereich, ohne eine neue
Farbe oder dekorative Hervorhebung einzuführen. Text-, Bild-, Aktions- und
Interaktionshierarchie bleiben unverändert. Die Lösung soll durch die
Theme-Tokens auch im Dark Mode funktionieren.

## Verworfen

- Nur die Border stärker machen: grenzt die Zeilen ab, löst die nahezu gleiche
  Flächenfarbe aber nicht.
- Akzentfarbe oder farbiger Streifen: zieht zu viel Aufmerksamkeit auf
  Vorschläge, die noch nicht ausgewählt wurden.

## Umfang und Abnahme

- Änderungen ausschließlich an BGG- und Sammlungsergebniszeilen.
- Tests prüfen die semantische Flächenrolle in beiden Listen.
- Bestehende Namen, Bild-Fallbacks, Buttons, Suche, Sortierung und Vorschlags-
  API bleiben unverändert.
- Impeccable-Prüfung berücksichtigt Desktop und schmale Ansicht sowie Hell-
  und Dunkel-Theme. Farbkontrast bleibt über semantische Tokens erhalten;
  Browserabnahme wird dokumentiert, sofern der Browserhost verfügbar ist.
- Keine API-, Datenbank- oder Berechtigungsänderung.

## Nachbesserung am 02.11.2026 (0.50.61)

Der spätere Nutzerscreenshot zeigt, dass die ausschließlich auf Trefferzeilen begrenzte Lösung die Suchbereiche insgesamt unzureichend vereinheitlicht. Der Folgeauftrag erweitert den Umfang auf die gesamten beiden Vorschlagsbereiche. Die äußeren Panels verwenden deckendes `card`; die gemeinsame Ergebnisliste nutzt `background`, feine Trennlinien und lesbare Metadaten. Einzelne Ergebniszeilen haben keine eigenen verschachtelten Karten mehr. Beide Suchfelder sind sichtbar beschriftet und mindestens 44 px hoch. Sammlungssuche filtert direkt und bietet „Zurücksetzen“; die BGG-Suche bleibt ein explizites Formular mit einem einzelnen Mindestlängenhinweis. Der deaktivierte BGG-Button besitzt eine eigene gut lesbare Flächen-/Textkombination ohne reduzierte Gesamtdeckkraft. Bei großer Schrift dürfen Aktionsbeschriftungen umbrechen. Diese Festlegung ersetzt die frühere Begrenzung auf Ergebniszeilen.

Die lokale Vorschau rendert reale Komponenten und globale Styles ohne Produktionsdaten. Browserprüfungen erfolgen über native CUA, wenn der DOM-Browserhost nicht verfügbar ist; ein fehlender DOM-Browserhost verhindert den lokalen Server und die native Browserprüfung nicht.
