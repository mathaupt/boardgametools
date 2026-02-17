---
name: game-management
description: Verwalte die Brettspielsammlung - Spiele hinzufügen, bearbeiten, löschen und von BoardGameGeek importieren. Nutze diesen Skill wenn der User Spiele verwalten, hinzufügen oder seine Sammlung organisieren möchte.
metadata:
  author: boardgametools
  version: "1.0"
---

# Game Management Skill

## Wann diesen Skill verwenden

Verwende diesen Skill wenn der User:
- Ein neues Spiel zur Sammlung hinzufügen möchte
- Spieldetails bearbeiten oder aktualisieren will
- Ein Spiel aus der Sammlung löschen möchte
- Ein Spiel von BoardGameGeek importieren will
- Seine Spielesammlung durchsuchen oder filtern möchte

## Datenmodell

Ein Spiel hat folgende Eigenschaften:
- **name** (required): Name des Spiels
- **description**: Kurze Beschreibung
- **minPlayers**: Minimale Spieleranzahl (default: 1)
- **maxPlayers**: Maximale Spieleranzahl (default: 4)
- **playTimeMinutes**: Durchschnittliche Spieldauer in Minuten
- **complexity**: Komplexität auf Skala 1-5
- **bggId**: BoardGameGeek ID für Import
- **imageUrl**: URL zum Spielcover

## API Endpoints

### Alle Spiele abrufen
```
GET /api/games
```
Gibt alle Spiele des eingeloggten Users zurück.

### Spiel erstellen
```
POST /api/games
Content-Type: application/json

{
  "name": "Catan",
  "description": "Klassisches Aufbauspiel",
  "minPlayers": 3,
  "maxPlayers": 4,
  "playTimeMinutes": 90,
  "complexity": 2
}
```

### Spiel aktualisieren
```
PUT /api/games/{id}
Content-Type: application/json

{
  "name": "Die Siedler von Catan",
  "playTimeMinutes": 75
}
```

### Spiel löschen
```
DELETE /api/games/{id}
```

## UI Navigation

- **Spieleübersicht**: `/dashboard/games`
- **Neues Spiel**: `/dashboard/games/new`
- **Spiel bearbeiten**: `/dashboard/games/{id}/edit`
- **Spieldetails**: `/dashboard/games/{id}`

## Typische Workflows

### Spiel manuell hinzufügen
1. Navigiere zu `/dashboard/games`
2. Klicke auf "Spiel hinzufügen"
3. Fülle das Formular aus
4. Speichere das Spiel

### Spiel von BGG importieren
1. Finde die BGG-ID in der URL des Spiels auf boardgamegeek.com
2. Gib die ID beim Erstellen im Feld "BoardGameGeek ID" ein
3. Das System kann Daten automatisch ergänzen

## Codebeispiele

### Spiel in der Datenbank erstellen (Prisma)
```typescript
const game = await prisma.game.create({
  data: {
    name: "Wingspan",
    description: "Engine-Building Spiel über Vögel",
    minPlayers: 1,
    maxPlayers: 5,
    playTimeMinutes: 70,
    complexity: 3,
    ownerId: userId,
  },
});
```

### Spiele mit Sessions laden
```typescript
const games = await prisma.game.findMany({
  where: { ownerId: userId },
  include: {
    _count: { select: { sessions: true } },
  },
  orderBy: { name: "asc" },
});
```
