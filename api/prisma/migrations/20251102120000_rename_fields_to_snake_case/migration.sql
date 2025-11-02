-- RenameColumn: users.publicCode -> users.username
ALTER TABLE "users" RENAME COLUMN "publicCode" TO "username";

-- RenameColumn: reports.participantId -> reports.user_id
ALTER TABLE "reports" RENAME COLUMN "participantId" TO "user_id";

-- RenameForeignKeyConstraint (if constraint name contains participantId)
ALTER TABLE "reports" RENAME CONSTRAINT "reports_participantId_fkey" TO "reports_user_id_fkey";

-- RenameUniqueIndex
ALTER INDEX "reports_participantId_issueId_key" RENAME TO "reports_user_id_issueId_key";

