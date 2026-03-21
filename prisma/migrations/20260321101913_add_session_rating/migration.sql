-- CreateTable
CREATE TABLE "SessionRating" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionRating_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SessionRating_sessionId_idx" ON "SessionRating"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "SessionRating_sessionId_userId_key" ON "SessionRating"("sessionId", "userId");

-- AddForeignKey
ALTER TABLE "SessionRating" ADD CONSTRAINT "SessionRating_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GameSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionRating" ADD CONSTRAINT "SessionRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
