-- AlterTable
ALTER TABLE "Group" ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "password" TEXT,
ADD COLUMN     "shareToken" TEXT;

-- CreateTable
CREATE TABLE "GroupPoll" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'single',
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "GroupPoll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupPollOption" (
    "id" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "GroupPollOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupPollVote" (
    "id" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "voterName" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupPollVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupComment" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "pollId" TEXT,
    "authorName" TEXT NOT NULL,
    "userId" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Group_shareToken_key" ON "Group"("shareToken");

-- CreateIndex
CREATE UNIQUE INDEX "GroupPollVote_optionId_voterName_key" ON "GroupPollVote"("optionId", "voterName");

-- AddForeignKey
ALTER TABLE "GroupPoll" ADD CONSTRAINT "GroupPoll_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupPoll" ADD CONSTRAINT "GroupPoll_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupPollOption" ADD CONSTRAINT "GroupPollOption_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "GroupPoll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupPollVote" ADD CONSTRAINT "GroupPollVote_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "GroupPollOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupPollVote" ADD CONSTRAINT "GroupPollVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupComment" ADD CONSTRAINT "GroupComment_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupComment" ADD CONSTRAINT "GroupComment_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "GroupPoll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupComment" ADD CONSTRAINT "GroupComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
