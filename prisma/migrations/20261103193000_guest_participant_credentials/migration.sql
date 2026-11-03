ALTER TABLE "GuestParticipant"
ADD COLUMN "credentialHash" TEXT;

CREATE UNIQUE INDEX "GuestParticipant_credentialHash_key"
ON "GuestParticipant"("credentialHash");
