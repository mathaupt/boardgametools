---
name: session-tracking
description: Erfasse und verwalte Spielsessions - Partien dokumentieren, Ergebnisse tracken und Spielhistorie aufbauen. Nutze diesen Skill wenn der User eine gespielte Partie erfassen oder Spielhistorie einsehen möchte.
metadata:
  author: boardgametools
  version: "1.0"
---

# Session Tracking Skill

## Wann diesen Skill verwenden

Verwende diesen Skill wenn der User:
- Eine gespielte Partie erfassen möchte
- Ergebnisse (Punkte, Gewinner) dokumentieren will
- Die Spielhistorie eines Spiels einsehen möchte
- Statistiken zu gespielten Partien abrufen will

## Datenmodell

### GameSession
- **gameId**: Referenz zum gespielten Spiel
- **playedAt**: Datum und Uhrzeit der Partie
- **durationMinutes**: Tatsächliche Spieldauer
- **notes**: Notizen zur Partie
- **createdById**: User der die Session erstellt hat

### SessionPlayer
- **sessionId**: Referenz zur Session
- **userId**: Referenz zum Spieler
- **score**: Erreichte Punktzahl
- **isWinner**: Ob der Spieler gewonnen hat
- **placement**: Platzierung (1., 2., 3., etc.)

## API Endpoints

### Sessions abrufen
```
GET /api/sessions
GET /api/sessions?gameId={gameId}
```

### Session erstellen
```
POST /api/sessions
Content-Type: application/json

{
  "gameId": "clx...",
  "playedAt": "2024-03-15T19:00:00Z",
  "durationMinutes": 90,
  "notes": "Spannendes Spiel!",
  "players": [
    { "userId": "user1", "score": 45, "isWinner": true, "placement": 1 },
    { "userId": "user2", "score": 38, "isWinner": false, "placement": 2 }
  ]
}
```

### Session Details
```
GET /api/sessions/{id}
```

## UI Navigation

- **Sessions Übersicht**: `/dashboard/sessions`
- **Neue Session**: `/dashboard/sessions/new`
- **Session Details**: `/dashboard/sessions/{id}`

## Typische Workflows

### Partie erfassen
1. Navigiere zu `/dashboard/sessions`
2. Klicke auf "Session erfassen"
3. Wähle das gespielte Spiel
4. Gib Datum und Dauer ein
5. Füge Spieler und deren Ergebnisse hinzu
6. Speichere die Session

### Spielhistorie einsehen
1. Gehe zur Spieldetailseite
2. Scrolle zu "Letzte Sessions"
3. Oder filtere Sessions nach Spiel

## Codebeispiele

### Session mit Spielern erstellen
```typescript
const session = await prisma.gameSession.create({
  data: {
    gameId: gameId,
    playedAt: new Date(),
    durationMinutes: 90,
    notes: "Tolles Spiel!",
    createdById: userId,
    players: {
      create: [
        { userId: "user1", score: 45, isWinner: true, placement: 1 },
        { userId: "user2", score: 38, isWinner: false, placement: 2 },
      ],
    },
  },
  include: { players: true },
});
```

### Sessions eines Spiels laden
```typescript
const sessions = await prisma.gameSession.findMany({
  where: { gameId },
  include: {
    players: {
      include: { user: true },
      orderBy: { placement: "asc" },
    },
  },
  orderBy: { playedAt: "desc" },
});
```
