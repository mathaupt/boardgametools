-- Existing events keep the former three-hour calendar export duration.
ALTER TABLE "Event"
ADD COLUMN "durationMinutes" INTEGER NOT NULL DEFAULT 180;
