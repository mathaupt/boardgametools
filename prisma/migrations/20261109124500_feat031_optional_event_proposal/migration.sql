-- Event sessions may be linked to a selected collection game or BGG game without an event proposal.
ALTER TABLE "EventPlayedSession" ALTER COLUMN "proposalId" DROP NOT NULL;
