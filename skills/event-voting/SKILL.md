---
name: event-voting
description: Erstelle Spieleabende mit Voting-Funktion - Events planen, Spieler einladen, Spiele vorschlagen und abstimmen. Nutze diesen Skill wenn der User einen Spieleabend organisieren oder an einer Abstimmung teilnehmen möchte.
metadata:
  author: boardgametools
  version: "1.0"
---

# Event Voting Skill

## Wann diesen Skill verwenden

Verwende diesen Skill wenn der User:
- Einen Spieleabend planen möchte
- Spieler zu einem Event einladen will
- Ein Spiel für ein Event vorschlagen möchte
- Für ein vorgeschlagenes Spiel abstimmen will
- Das Voting beenden und Ergebnis sehen möchte

## Datenmodell

### Event
- **title**: Name des Events
- **description**: Beschreibung
- **eventDate**: Datum und Uhrzeit
- **location**: Ort
- **status**: draft | voting | closed
- **groupId**: Optional - Verknüpfung zu einer Gruppe
- **selectedGameId**: Das gewählte Spiel nach Voting-Ende

### EventInvite
- **eventId**: Referenz zum Event
- **userId**: Eingeladener User
- **status**: pending | accepted | declined

### GameProposal
- **eventId**: Referenz zum Event
- **gameId**: Vorgeschlagenes Spiel
- **proposedById**: User der vorgeschlagen hat

### Vote
- **proposalId**: Referenz zum Vorschlag
- **userId**: User der abgestimmt hat

## Event Status Flow

```
draft → voting → closed
```

1. **draft**: Event wird erstellt, Einladungen verschickt
2. **voting**: Spieler können Spiele vorschlagen und abstimmen
3. **closed**: Voting beendet, Spiel mit meisten Stimmen ausgewählt

## API Endpoints

### Event erstellen
```
POST /api/events
Content-Type: application/json

{
  "title": "Spieleabend März",
  "description": "Monatlicher Spieleabend",
  "eventDate": "2024-03-20T19:00:00Z",
  "location": "Bei Max"
}
```

### Spieler einladen
```
POST /api/events/{id}/invite
Content-Type: application/json

{
  "userIds": ["user1", "user2", "user3"]
}
```

### Einladung beantworten
```
PUT /api/events/{id}/invite
Content-Type: application/json

{
  "status": "accepted"
}
```

### Voting starten
```
POST /api/events/{id}/start-voting
```

### Spiel vorschlagen
```
POST /api/events/{id}/propose
Content-Type: application/json

{
  "gameId": "game123"
}
```

### Abstimmen
```
POST /api/events/{id}/vote
Content-Type: application/json

{
  "proposalId": "proposal123"
}
```

### Voting beenden
```
POST /api/events/{id}/close
```
Wählt automatisch das Spiel mit den meisten Stimmen.

## UI Navigation

- **Events Übersicht**: `/dashboard/events`
- **Neues Event**: `/dashboard/events/new`
- **Event Details & Voting**: `/dashboard/events/{id}`

## Typische Workflows

### Event erstellen und Voting starten
1. Erstelle Event mit Titel, Datum, Ort
2. Lade Spieler ein (per E-Mail oder aus Gruppen)
3. Warte auf Zusagen
4. Starte das Voting
5. Spieler schlagen Spiele vor und stimmen ab
6. Beende Voting - Gewinner wird angezeigt

### An Voting teilnehmen
1. Öffne Event-Einladung
2. Akzeptiere die Einladung
3. Schlage ein Spiel aus der Sammlung vor
4. Stimme für deine Favoriten ab

## Codebeispiele

### Event mit Einladungen erstellen
```typescript
const event = await prisma.event.create({
  data: {
    title: "Spieleabend",
    eventDate: new Date("2024-03-20T19:00:00Z"),
    location: "Bei Max",
    status: "draft",
    createdById: userId,
    invites: {
      create: userIds.map(id => ({ userId: id })),
    },
  },
});
```

### Vorschläge mit Stimmen laden
```typescript
const proposals = await prisma.gameProposal.findMany({
  where: { eventId },
  include: {
    game: true,
    proposedBy: true,
    _count: { select: { votes: true } },
  },
  orderBy: { votes: { _count: "desc" } },
});
```

### Gewinner ermitteln und Event schließen
```typescript
const winner = await prisma.gameProposal.findFirst({
  where: { eventId },
  orderBy: { votes: { _count: "desc" } },
});

await prisma.event.update({
  where: { id: eventId },
  data: {
    status: "closed",
    selectedGameId: winner?.gameId,
  },
});
```
