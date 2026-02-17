---
name: statistics
description: Zeige Statistiken und Auswertungen - Meistgespielte Spiele, Gewinnraten, Spielzeit-Analysen. Nutze diesen Skill wenn der User Statistiken einsehen oder Auswertungen zu seinen Spielen und Partien möchte.
metadata:
  author: boardgametools
  version: "1.0"
---

# Statistics Skill

## Wann diesen Skill verwenden

Verwende diesen Skill wenn der User:
- Wissen möchte welche Spiele am meisten gespielt wurden
- Gewinnstatistiken pro Spieler sehen will
- Spielzeit-Auswertungen abrufen möchte
- Trends in seiner Spielhistorie analysieren will

## Verfügbare Statistiken

### Spiel-Statistiken
- **Meistgespielte Spiele**: Ranking nach Anzahl Sessions
- **Gesamtspielzeit pro Spiel**: Summe aller Session-Dauern
- **Durchschnittliche Spieldauer**: Mittelwert pro Spiel
- **Zuletzt gespielte Spiele**: Chronologische Liste

### Spieler-Statistiken
- **Gewinnrate**: Prozent der gewonnenen Spiele
- **Lieblingsspiele**: Spiele die am häufigsten gespielt wurden
- **Gesamtspielzeit**: Summe aller Partien
- **Platzierungsverteilung**: Wie oft 1., 2., 3. Platz etc.

### Gruppen-Statistiken
- **Aktivste Spieler**: Wer spielt am meisten
- **Beliebteste Spiele**: In der Gruppe am häufigsten gespielt
- **Event-Teilnahme**: Wer nimmt an Events teil

## API Endpoints

### Spiel-Statistiken
```
GET /api/statistics/games
```
Response:
```json
{
  "mostPlayed": [
    { "game": {...}, "sessionCount": 15, "totalMinutes": 1350 }
  ],
  "recentlyPlayed": [...],
  "totalGames": 25,
  "totalSessions": 87
}
```

### Spieler-Statistiken
```
GET /api/statistics/players
GET /api/statistics/players/{userId}
```
Response:
```json
{
  "winRate": 0.35,
  "totalGames": 45,
  "totalPlayTime": 3240,
  "favoriteGame": {...},
  "placements": { "1": 16, "2": 12, "3": 10, "other": 7 }
}
```

### Zeitraum-Filter
```
GET /api/statistics/games?from=2024-01-01&to=2024-03-31
```

## UI Navigation

- **Statistik Dashboard**: `/dashboard/statistics`
- **Spiel-Statistiken**: `/dashboard/statistics/games`
- **Spieler-Statistiken**: `/dashboard/statistics/players`

## Codebeispiele

### Meistgespielte Spiele ermitteln
```typescript
const mostPlayed = await prisma.game.findMany({
  where: { ownerId: userId },
  include: {
    _count: { select: { sessions: true } },
    sessions: {
      select: { durationMinutes: true },
    },
  },
  orderBy: {
    sessions: { _count: "desc" },
  },
  take: 10,
});

const stats = mostPlayed.map(game => ({
  game,
  sessionCount: game._count.sessions,
  totalMinutes: game.sessions.reduce(
    (sum, s) => sum + (s.durationMinutes || 0), 0
  ),
}));
```

### Gewinnrate berechnen
```typescript
const playerStats = await prisma.sessionPlayer.aggregate({
  where: { userId },
  _count: { _all: true },
});

const wins = await prisma.sessionPlayer.count({
  where: { userId, isWinner: true },
});

const winRate = wins / playerStats._count._all;
```

### Platzierungsverteilung
```typescript
const placements = await prisma.sessionPlayer.groupBy({
  by: ["placement"],
  where: { userId },
  _count: { _all: true },
});

const distribution = placements.reduce((acc, p) => {
  const key = p.placement <= 3 ? p.placement.toString() : "other";
  acc[key] = (acc[key] || 0) + p._count._all;
  return acc;
}, {});
```

## Visualisierung

Die Statistiken können mit Charts dargestellt werden:
- **Bar Chart**: Meistgespielte Spiele
- **Pie Chart**: Platzierungsverteilung
- **Line Chart**: Spielaktivität über Zeit
- **Leaderboard**: Spieler-Ranking

Empfohlene Libraries:
- recharts
- chart.js
- @tremor/react
