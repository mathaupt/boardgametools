-- Event sessions retain a game snapshot when the original collection game is removed.
ALTER TABLE "GameSession" DROP CONSTRAINT "GameSession_gameId_fkey";
ALTER TABLE "GameSession" ALTER COLUMN "gameId" DROP NOT NULL;
ALTER TABLE "GameSession"
  ADD COLUMN "gameNameSnapshot" TEXT,
  ADD COLUMN "gameBggIdSnapshot" TEXT,
  ADD COLUMN "gameImageUrlSnapshot" TEXT,
  ADD COLUMN "gameMinPlayersSnapshot" INTEGER,
  ADD COLUMN "gameMaxPlayersSnapshot" INTEGER,
  ADD COLUMN "gamePlayTimeMinutesSnapshot" INTEGER,
  ADD COLUMN "gameComplexitySnapshot" DOUBLE PRECISION;
ALTER TABLE "GameSession" ADD CONSTRAINT "GameSession_gameId_fkey"
  FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "SessionGuestPlayer" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "score" INTEGER,
  "isWinner" BOOLEAN NOT NULL DEFAULT false,
  "placement" INTEGER,
  CONSTRAINT "SessionGuestPlayer_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SessionGuestPlayer_sessionId_idx" ON "SessionGuestPlayer"("sessionId");
ALTER TABLE "SessionGuestPlayer" ADD CONSTRAINT "SessionGuestPlayer_sessionId_fkey"
  FOREIGN KEY ("sessionId") REFERENCES "GameSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "EventPlayedSession" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "proposalId" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "operationId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EventPlayedSession_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "EventPlayedSession_sessionId_key" ON "EventPlayedSession"("sessionId");
CREATE UNIQUE INDEX "EventPlayedSession_eventId_operationId_key" ON "EventPlayedSession"("eventId", "operationId");
CREATE INDEX "EventPlayedSession_eventId_idx" ON "EventPlayedSession"("eventId");
CREATE INDEX "EventPlayedSession_proposalId_idx" ON "EventPlayedSession"("proposalId");
ALTER TABLE "EventPlayedSession" ADD CONSTRAINT "EventPlayedSession_eventId_fkey"
  FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventPlayedSession" ADD CONSTRAINT "EventPlayedSession_proposalId_fkey"
  FOREIGN KEY ("proposalId") REFERENCES "GameProposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventPlayedSession" ADD CONSTRAINT "EventPlayedSession_sessionId_fkey"
  FOREIGN KEY ("sessionId") REFERENCES "GameSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
