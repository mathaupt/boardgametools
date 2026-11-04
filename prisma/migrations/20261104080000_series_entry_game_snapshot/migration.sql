ALTER TABLE "GameSeriesEntry"
  ALTER COLUMN "gameId" DROP NOT NULL,
  ADD COLUMN "gameName" TEXT,
  ADD COLUMN "gameDescription" TEXT,
  ADD COLUMN "gameImageUrl" TEXT,
  ADD COLUMN "minPlayers" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "maxPlayers" INTEGER NOT NULL DEFAULT 4,
  ADD COLUMN "gamePlayTimeMinutes" INTEGER,
  ADD COLUMN "complexity" INTEGER,
  ADD COLUMN "bggId" TEXT,
  ADD COLUMN "source" TEXT NOT NULL DEFAULT 'COLLECTION',
  ADD COLUMN "temporaryReason" TEXT;

UPDATE "GameSeriesEntry" AS entry
SET
  "gameName" = game."name",
  "gameDescription" = game."description",
  "gameImageUrl" = game."imageUrl",
  "minPlayers" = game."minPlayers",
  "maxPlayers" = game."maxPlayers",
  "gamePlayTimeMinutes" = game."playTimeMinutes",
  "complexity" = game."complexity",
  "bggId" = game."bggId"
FROM "Game" AS game
WHERE entry."gameId" = game."id";

UPDATE "GameSeriesEntry" AS entry
SET "gameId" = NULL, "source" = 'DETACHED_COLLECTION'
FROM "Game" AS game
WHERE entry."gameId" = game."id" AND game."deletedAt" IS NOT NULL;

ALTER TABLE "GameSeriesEntry"
  ALTER COLUMN "gameName" SET NOT NULL;

ALTER TABLE "GameSeriesEntry"
  DROP CONSTRAINT "GameSeriesEntry_gameId_fkey",
  ADD CONSTRAINT "GameSeriesEntry_gameId_fkey"
    FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "GameSeriesEntry_seriesId_bggId_idx"
  ON "GameSeriesEntry"("seriesId", "bggId");

CREATE UNIQUE INDEX "GameSeriesEntry_seriesId_bggId_temporary_key"
  ON "GameSeriesEntry"("seriesId", "bggId")
  WHERE "gameId" IS NULL AND "bggId" IS NOT NULL AND "source" = 'TEMPORARY_BGG';
