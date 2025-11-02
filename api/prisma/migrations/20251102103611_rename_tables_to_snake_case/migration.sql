-- RenameTable: Session -> sessions
ALTER TABLE "Session" RENAME TO "sessions";

-- RenameTable: Participant -> participant
ALTER TABLE "Participant" RENAME TO "participant";

-- RenameTable: Issue -> issues
ALTER TABLE "Issue" RENAME TO "issues";

-- RenameTable: Scan -> reports
ALTER TABLE "Scan" RENAME TO "reports";

-- RenamePrimaryKeyConstraints
ALTER TABLE "sessions" RENAME CONSTRAINT "Session_pkey" TO "sessions_pkey";
ALTER TABLE "participant" RENAME CONSTRAINT "Participant_pkey" TO "participant_pkey";
ALTER TABLE "issues" RENAME CONSTRAINT "Issue_pkey" TO "issues_pkey";
ALTER TABLE "reports" RENAME CONSTRAINT "Scan_pkey" TO "reports_pkey";

-- RenameForeignKeyConstraints
ALTER TABLE "participant" RENAME CONSTRAINT "Participant_sessionId_fkey" TO "participant_sessionId_fkey";
ALTER TABLE "reports" RENAME CONSTRAINT "Scan_participantId_fkey" TO "reports_participantId_fkey";
ALTER TABLE "reports" RENAME CONSTRAINT "Scan_issueId_fkey" TO "reports_issueId_fkey";
ALTER TABLE "reports" RENAME CONSTRAINT "Scan_sessionId_fkey" TO "reports_sessionId_fkey";

-- RenameIndexes
ALTER INDEX "Scan_sessionId_issueId_idx" RENAME TO "reports_sessionId_issueId_idx";
ALTER INDEX "Scan_sessionId_idx" RENAME TO "reports_sessionId_idx";
ALTER UNIQUE INDEX "Scan_participantId_issueId_key" RENAME TO "reports_participantId_issueId_key";

