-- RenameTable: participant -> users
ALTER TABLE "participant" RENAME TO "users";

-- RenamePrimaryKeyConstraint
ALTER TABLE "users" RENAME CONSTRAINT "participant_pkey" TO "users_pkey";

-- RenameForeignKeyConstraints
ALTER TABLE "users" RENAME CONSTRAINT "participant_sessionId_fkey" TO "users_sessionId_fkey";

