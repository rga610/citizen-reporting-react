-- Rename all remaining camelCase columns to snake_case
-- This migration assumes columns are still in camelCase from initial migration

-- Sessions table
ALTER TABLE "sessions" RENAME COLUMN "startTs" TO "start_ts";
ALTER TABLE "sessions" RENAME COLUMN "endTs" TO "end_ts";

-- Users table (Participant)
ALTER TABLE "users" RENAME COLUMN "sessionId" TO "session_id";
ALTER TABLE "users" RENAME COLUMN "totalReports" TO "total_reports";
ALTER TABLE "users" RENAME COLUMN "isActive" TO "is_active";
ALTER TABLE "users" RENAME COLUMN "createdAt" TO "created_at";

-- Rename foreign key constraint for users.sessionId
ALTER TABLE "users" RENAME CONSTRAINT "users_sessionId_fkey" TO "users_session_id_fkey";

-- Issues table
ALTER TABLE "issues" RENAME COLUMN "sessionSlot" TO "session_slot";

-- Reports table (Scan)
ALTER TABLE "reports" RENAME COLUMN "issueId" TO "issue_id";
ALTER TABLE "reports" RENAME COLUMN "sessionId" TO "session_id";
ALTER TABLE "reports" RENAME COLUMN "periodId" TO "period_id";

-- Rename foreign key constraints for reports
ALTER TABLE "reports" RENAME CONSTRAINT "reports_issueId_fkey" TO "reports_issue_id_fkey";
ALTER TABLE "reports" RENAME CONSTRAINT "reports_sessionId_fkey" TO "reports_session_id_fkey";

-- Rename indexes for reports (also fix issueId -> issue_id in index name)
ALTER INDEX "reports_sessionId_issueId_idx" RENAME TO "reports_session_id_issue_id_idx";
ALTER INDEX "reports_sessionId_idx" RENAME TO "reports_session_id_idx";
ALTER INDEX "reports_user_id_issueId_key" RENAME TO "reports_user_id_issue_id_key";

