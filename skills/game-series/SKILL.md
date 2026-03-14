---
name: game-series
description: Verwalte Spielereihen (EXIT, Adventure Games, etc.) - Reihen anlegen, Spiele hinzufügen, Fortschritt tracken und bewerten. Nutze diesen Skill wenn der User Spielereihen organisieren, Fortschritt tracken oder Einmal-Spiel-Serien verwalten möchte.
metadata:
  author: boardgametools
  version: "1.0"
---

# Game Series Skill (Spielereihen)

## Wann diesen Skill verwenden

Verwende diesen Skill wenn der User:
- Eine neue Spielereihe anlegen möchte (z.B. EXIT, Adventure Games, Murder Mystery)
- Spiele zu einer Reihe hinzufügen will (aus Sammlung oder per BGG-Import)
- Den Fortschritt einer Reihe einsehen möchte
- Spiele als "gespielt" markieren und bewerten will
- Die Reihenfolge der Spiele in einer Reihe ändern möchte
- Schwierigkeitsgrade zuordnen will

## Domänenmodell

Spielereihen sind Sammlungen von Einmal-Spielen (Spiele, die man einmalig durchspielt und dann nicht mehr). Typische Beispiele:
- **EXIT - Das Spiel** (Escape-Room-Rätselspiele)
- **Adventure Games** (Story-getriebene Abenteuerspiele)
- **Murder Mystery Games** (Krimi-Dinner-Spiele)

### GameSeries
- **name** (required): Name der Reihe
- **description**: Beschreibung der Reihe
- **imageUrl**: Cover-Bild URL

### GameSeriesEntry
- **sortOrder**: Reihenfolge innerhalb der Serie
- **played**: Boolean - ob durchgespielt
- **playedAt**: Datum wann gespielt
- **rating**: 1-5 Sterne Bewertung (nach dem Spielen)
- **difficulty**: Schwierigkeitsgrad ("einsteiger", "fortgeschritten", "profi")
- **game**: Referenz zum Spiel in der Sammlung

## API Endpoints

### Alle Reihen abrufen
```
GET /api/series
```
Gibt alle Reihen des Users mit Entry-Count und Fortschritt zurück.

### Reihe erstellen
```
POST /api/series
Content-Type: application/json

{
  "name": "EXIT - Das Spiel",
  "description": "Escape-Room-Spiele von Kosmos",
  "imageUrl": "https://..."
}
```

### Reihe Details
```
GET /api/series/{id}
```
Gibt Reihe mit allen Entries inkl. Game-Details zurück.

### Reihe aktualisieren
```
PUT /api/series/{id}
Content-Type: application/json

{
  "name": "EXIT - Das Spiel (Kosmos)",
  "description": "Alle EXIT-Spiele"
}
```

### Reihe löschen
```
DELETE /api/series/{id}
```

### Spiel zur Reihe hinzufügen
```
POST /api/series/{id}/entries
Content-Type: application/json

// Aus Sammlung:
{ "gameId": "clx...", "difficulty": "fortgeschritten" }

// Per BGG-Import (wird automatisch in Sammlung importiert):
{ "bggId": "12345", "difficulty": "einsteiger" }
```

### Entry aktualisieren
```
PUT /api/series/{id}/entries/{entryId}
Content-Type: application/json

{
  "played": true,
  "rating": 4,
  "difficulty": "profi"
}
```

### Entry entfernen
```
DELETE /api/series/{id}/entries/{entryId}
```
Entfernt das Spiel aus der Reihe. Das Spiel bleibt in der Sammlung.

### Reihenfolge ändern
```
PUT /api/series/{id}/entries/reorder
Content-Type: application/json

{
  "entries": [
    { "id": "entry1", "sortOrder": 0 },
    { "id": "entry2", "sortOrder": 1 },
    { "id": "entry3", "sortOrder": 2 }
  ]
}
```

## UI Navigation

- **Reihen-Übersicht**: `/dashboard/series`
- **Neue Reihe**: `/dashboard/series/new`
- **Reihen-Detail**: `/dashboard/series/{id}`
- **Reihe bearbeiten**: `/dashboard/series/{id}/edit`

## Schwierigkeitsgrade

| Wert | Label | Farbe |
|------|-------|-------|
| `einsteiger` | Einsteiger | Grün |
| `fortgeschritten` | Fortgeschritten | Gelb |
| `profi` | Profi | Rot |

## Typische Workflows

### Neue Reihe mit BGG-Import anlegen
1. Navigiere zu `/dashboard/series`
2. Klicke "Neue Reihe"
3. Gib Name und Beschreibung ein (z.B. "EXIT - Das Spiel")
4. Klicke "Reihe erstellen"
5. Auf der Detail-Seite klicke "Spiel hinzufügen"
6. Wechsle zum Tab "Von BGG importieren"
7. Suche nach "EXIT" und füge Spiele hinzu
8. Setze optional den Schwierigkeitsgrad

### Spiel als gespielt markieren
1. Gehe zur Reihen-Detail-Seite
2. Klicke den Kreis-Button neben dem Spiel
3. Optional: Vergib eine Sterne-Bewertung (1-5)

### Reihenfolge ändern
1. Nutze die Pfeil-Buttons (oben/unten) neben jedem Eintrag

## Codebeispiele

### Reihe mit Fortschritt laden
```typescript
const series = await prisma.gameSeries.findMany({
  where: { ownerId: userId },
  include: {
    entries: {
      include: { game: true },
      orderBy: { sortOrder: "asc" },
    },
  },
});

const withProgress = series.map(s => ({
  ...s,
  total: s.entries.length,
  played: s.entries.filter(e => e.played).length,
}));
```

### Spiel per BGG-Import zur Reihe hinzufügen
```typescript
// 1. Spiel in Sammlung importieren (falls noch nicht vorhanden)
let game = await prisma.game.findFirst({
  where: { bggId, ownerId: userId },
});

if (!game) {
  const bggData = await fetchBGGGame(bggId);
  game = await prisma.game.create({ data: { ...bggData, ownerId: userId } });
}

// 2. Zur Reihe hinzufügen
const entry = await prisma.gameSeriesEntry.create({
  data: { seriesId, gameId: game.id, sortOrder: nextOrder },
});
```
