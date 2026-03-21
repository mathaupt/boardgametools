-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "winningProposalId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Event_winningProposalId_key" ON "Event"("winningProposalId");

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_winningProposalId_fkey" FOREIGN KEY ("winningProposalId") REFERENCES "GameProposal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
