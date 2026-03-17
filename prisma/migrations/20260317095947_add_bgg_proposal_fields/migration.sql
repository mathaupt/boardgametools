-- AlterTable
ALTER TABLE "GameProposal" ADD COLUMN     "bggId" TEXT,
ADD COLUMN     "bggImageUrl" TEXT,
ADD COLUMN     "bggMaxPlayers" INTEGER,
ADD COLUMN     "bggMinPlayers" INTEGER,
ADD COLUMN     "bggName" TEXT,
ADD COLUMN     "bggPlayTimeMinutes" INTEGER,
ADD COLUMN     "guestId" TEXT,
ALTER COLUMN "gameId" DROP NOT NULL,
ALTER COLUMN "proposedById" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "GameProposal" ADD CONSTRAINT "GameProposal_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "GuestParticipant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
