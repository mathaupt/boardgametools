-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "selectedDate" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "DateProposal" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DateProposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DateVote" (
    "id" TEXT NOT NULL,
    "dateProposalId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "availability" TEXT NOT NULL DEFAULT 'yes',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DateVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuestDateVote" (
    "id" TEXT NOT NULL,
    "dateProposalId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "availability" TEXT NOT NULL DEFAULT 'yes',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuestDateVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DateProposal_eventId_date_key" ON "DateProposal"("eventId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DateVote_dateProposalId_userId_key" ON "DateVote"("dateProposalId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "GuestDateVote_dateProposalId_guestId_key" ON "GuestDateVote"("dateProposalId", "guestId");

-- AddForeignKey
ALTER TABLE "DateProposal" ADD CONSTRAINT "DateProposal_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DateVote" ADD CONSTRAINT "DateVote_dateProposalId_fkey" FOREIGN KEY ("dateProposalId") REFERENCES "DateProposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DateVote" ADD CONSTRAINT "DateVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestDateVote" ADD CONSTRAINT "GuestDateVote_dateProposalId_fkey" FOREIGN KEY ("dateProposalId") REFERENCES "DateProposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestDateVote" ADD CONSTRAINT "GuestDateVote_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "GuestParticipant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
