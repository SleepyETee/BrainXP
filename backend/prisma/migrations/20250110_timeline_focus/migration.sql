-- Timeline blocks to support visual scheduling and buffers
CREATE TABLE "timeline_blocks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "taskId" TEXT,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'task',
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "day" DATE NOT NULL,
    "color" TEXT,
    "isBuffer" BOOLEAN NOT NULL DEFAULT FALSE,
    "order" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "timeline_blocks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "timeline_blocks_userId_day_idx" ON "timeline_blocks"("userId", "day");
CREATE INDEX "timeline_blocks_userId_startTime_idx" ON "timeline_blocks"("userId", "startTime");
CREATE INDEX "timeline_blocks_taskId_idx" ON "timeline_blocks"("taskId");

ALTER TABLE "timeline_blocks" ADD CONSTRAINT "timeline_blocks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "timeline_blocks" ADD CONSTRAINT "timeline_blocks_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Focus session linkage to timeline blocks and outcome tracking
ALTER TABLE "focus_sessions" ADD COLUMN "timelineBlockId" TEXT;
ALTER TABLE "focus_sessions" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'active';
ALTER TABLE "focus_sessions" ADD COLUMN "outcome" TEXT;

CREATE INDEX "focus_sessions_timelineBlockId_idx" ON "focus_sessions"("timelineBlockId");
ALTER TABLE "focus_sessions" ADD CONSTRAINT "focus_sessions_timelineBlockId_fkey" FOREIGN KEY ("timelineBlockId") REFERENCES "timeline_blocks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- User-level nudge preferences for transitions and drift
CREATE TABLE "nudge_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT TRUE,
    "preTransitionMinutes" INTEGER NOT NULL DEFAULT 5,
    "driftDetectionMinutes" INTEGER NOT NULL DEFAULT 2,
    "soundsEnabled" BOOLEAN NOT NULL DEFAULT TRUE,
    "hapticsEnabled" BOOLEAN NOT NULL DEFAULT TRUE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "nudge_preferences_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "nudge_preferences_userId_key" UNIQUE ("userId")
);

ALTER TABLE "nudge_preferences" ADD CONSTRAINT "nudge_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
