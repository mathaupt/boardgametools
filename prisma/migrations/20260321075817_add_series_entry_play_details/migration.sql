-- AlterTable
ALTER TABLE "GameSeriesEntry" ADD COLUMN     "playTimeMinutes" INTEGER,
ADD COLUMN     "playerCount" INTEGER,
ADD COLUMN     "score" INTEGER,
ADD COLUMN     "successful" BOOLEAN;

-- CreateIndex
CREATE INDEX "ApiLog_createdAt_durationMs_idx" ON "ApiLog"("createdAt", "durationMs");

-- CreateIndex
CREATE INDEX "Event_createdById_idx" ON "Event"("createdById");

-- CreateIndex
CREATE INDEX "Event_eventDate_idx" ON "Event"("eventDate");

-- CreateIndex
CREATE INDEX "Game_ownerId_idx" ON "Game"("ownerId");

-- CreateIndex
CREATE INDEX "GameSession_createdById_idx" ON "GameSession"("createdById");

-- CreateIndex
CREATE INDEX "GroupMember_userId_idx" ON "GroupMember"("userId");

-- CreateIndex
CREATE INDEX "GuestDateVote_guestId_idx" ON "GuestDateVote"("guestId");

-- CreateIndex
CREATE INDEX "GuestVote_proposalId_idx" ON "GuestVote"("proposalId");
