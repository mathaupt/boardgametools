-- AlterTable
ALTER TABLE "User" ADD COLUMN     "publicProfileEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "publicProfileFeaturedBadgeIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "publicProfileTokenNonce" TEXT,
ADD COLUMN     "publicProfileTokenHash" TEXT;

-- CreateTable
CREATE TABLE "DiscoveryDismissal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiscoveryDismissal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupChallenge" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "target" INTEGER NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupChallengeParticipant" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "GroupChallengeParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DiscoveryDismissal_userId_idx" ON "DiscoveryDismissal"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DiscoveryDismissal_userId_gameId_key" ON "DiscoveryDismissal"("userId", "gameId");

-- CreateIndex
CREATE INDEX "GroupChallenge_groupId_status_idx" ON "GroupChallenge"("groupId", "status");

-- CreateIndex
CREATE INDEX "GroupChallengeParticipant_userId_leftAt_idx" ON "GroupChallengeParticipant"("userId", "leftAt");

-- CreateIndex
CREATE UNIQUE INDEX "GroupChallengeParticipant_challengeId_userId_key" ON "GroupChallengeParticipant"("challengeId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_publicProfileTokenHash_key" ON "User"("publicProfileTokenHash");

-- AddForeignKey
ALTER TABLE "DiscoveryDismissal" ADD CONSTRAINT "DiscoveryDismissal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscoveryDismissal" ADD CONSTRAINT "DiscoveryDismissal_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupChallenge" ADD CONSTRAINT "GroupChallenge_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupChallenge" ADD CONSTRAINT "GroupChallenge_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupChallengeParticipant" ADD CONSTRAINT "GroupChallengeParticipant_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "GroupChallenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupChallengeParticipant" ADD CONSTRAINT "GroupChallengeParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
