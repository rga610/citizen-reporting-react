-- CreateTable
CREATE TABLE "Session" (
    "id" SERIAL NOT NULL,
    "slot" INTEGER NOT NULL,
    "startTs" TIMESTAMP(3) NOT NULL,
    "endTs" TIMESTAMP(3),

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Participant" (
    "id" TEXT NOT NULL,
    "publicCode" TEXT NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "treatment" TEXT NOT NULL,
    "totalReports" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Issue" (
    "id" TEXT NOT NULL,
    "sessionSlot" INTEGER NOT NULL,

    CONSTRAINT "Issue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scan" (
    "id" BIGSERIAL NOT NULL,
    "participantId" TEXT NOT NULL,
    "treatment" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "periodId" INTEGER NOT NULL,
    "lat" DOUBLE PRECISION,
    "lon" DOUBLE PRECISION,
    "accuracy" DOUBLE PRECISION,
    "ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Scan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Scan_sessionId_issueId_idx" ON "Scan"("sessionId", "issueId");

-- CreateIndex
CREATE INDEX "Scan_sessionId_idx" ON "Scan"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Scan_participantId_issueId_key" ON "Scan"("participantId", "issueId");

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scan" ADD CONSTRAINT "Scan_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scan" ADD CONSTRAINT "Scan_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scan" ADD CONSTRAINT "Scan_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

