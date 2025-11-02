# Prisma Migration Best Practices & Troubleshooting Guide

## 🎯 Quick Reference: The 5-Minute Migration Recipe

### ✅ Standard Migration Workflow

1. **Update Prisma Schema** (`api/prisma/schema.prisma`)
   - Make your changes (add models, modify fields, add `@@map` directives)
   - Use `@@map("table_name")` to rename tables without changing model names

2. **Create Migration Locally**
   ```bash
   cd api
   npx prisma migrate dev --name descriptive_migration_name
   ```
   - ✅ Review the generated SQL file
   - ✅ Test migration locally first
   - ✅ Commit both schema.prisma AND the migration file

3. **Verify Migration File**
   - Check file encoding: **UTF-8 without BOM**
   - Check SQL syntax: Use PostgreSQL-compatible syntax
   - Never use `ALTER UNIQUE INDEX` - use `ALTER INDEX` for renaming

4. **Deploy to Production**
   ```bash
   npx prisma migrate deploy --schema=prisma/schema.prisma
   ```

---

## 🚨 Common Pitfalls & Solutions

### 1. **File Encoding Issues** (BOM Characters)

**Problem:** Migration files with UTF-16 or UTF-8 BOM cause PostgreSQL syntax errors:
```
syntax error at or near "\u{feff}"
```

**Solution:**
- Always save migration files as **UTF-8 without BOM**
- PowerShell fix:
  ```powershell
  $content = Get-Content migration.sql -Raw
  $enc = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText("migration.sql", $content, $enc)
  ```
- VS Code: Set encoding to "UTF-8" (not "UTF-8 with BOM")

**Prevention:**
- Configure your editor to save SQL files as UTF-8 without BOM
- Verify before committing: `Format-Hex migration.sql | Select-Object -First 1`
  - Should start with `2D 2D` (-- comment) or `43 52 45 41 54 45` (CREATE), NOT `FF FE` or `EF BB BF`

### 2. **Failed Migration State**

**Problem:** Prisma blocks all migrations if one fails:
```
Error: P3009: migrate found failed migrations in the target database
```

**Solution - Three Options:**

**Option A: Roll Back & Retry (Use when migration was partially applied)**
```bash
npx prisma migrate resolve --rolled-back MIGRATION_NAME
# Fix the migration file
npx prisma migrate deploy
```

**Option B: Mark as Applied (Use when tables already exist)**
```bash
npx prisma migrate resolve --applied MIGRATION_NAME
npx prisma migrate deploy
```

**Option C: Reset Database (⚠️ Only for development, destroys data)**
```bash
npx prisma migrate reset
```

### 3. **PostgreSQL Syntax Errors**

**Problem:** Invalid SQL syntax in migration files

**Common Errors:**
- ❌ `ALTER UNIQUE INDEX` → ✅ `ALTER INDEX` (UNIQUE is only for CREATE)
- ❌ `CREATE TABLE IF EXISTS` → ✅ `CREATE TABLE` (PostgreSQL doesn't support IF EXISTS for CREATE TABLE)
- ❌ Missing quotes around identifiers with special characters

**Solution:**
- Always test SQL locally first
- Use Prisma's generated migrations as reference
- Verify syntax with PostgreSQL documentation

### 4. **Railway Deployment Configuration**

**Problem:** Commands run from wrong directory or migration files not found

**Solution:**

**Railway Settings:**
- **Root Directory:** `api` (NOT `/api` - no leading slash!)
- **Pre-deploy Command:** `npx prisma migrate deploy --schema=prisma/schema.prisma`
- **Custom Start Command:** `pnpm run start` (or `node dist/server.js`)

**Important:**
- Root Directory must be relative path: `api`
- Schema path is relative to Root Directory: `prisma/schema.prisma`
- All commands run from Root Directory

---

## 📋 Migration Checklist

### Before Creating Migration
- [ ] Schema changes are tested locally
- [ ] Backup production database (if critical)
- [ ] Editor configured for UTF-8 without BOM

### Creating Migration
- [ ] Run `prisma migrate dev` locally
- [ ] Review generated SQL file
- [ ] Test migration locally (`prisma migrate reset` then `prisma migrate deploy`)
- [ ] Verify file encoding (UTF-8, no BOM)
- [ ] Check SQL syntax (especially ALTER INDEX commands)

### Committing Migration
- [ ] Commit `schema.prisma` changes
- [ ] Commit migration directory (`prisma/migrations/XXXXX_name/`)
- [ ] Commit `migration_lock.toml` if changed
- [ ] Push to GitHub

### Deploying to Production
- [ ] Verify Railway Root Directory is correct (`api`)
- [ ] Verify Pre-deploy Command: `npx prisma migrate deploy --schema=prisma/schema.prisma`
- [ ] Monitor deployment logs for errors
- [ ] If migration fails, use `prisma migrate resolve` to fix state

---

## 🔧 Railway-Specific Best Practices

### Builder Configuration

**Railway.json:**
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "RAILPACK"
  }
}
```

**Or use Dockerfile:**
```json
{
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  }
}
```

### Railway Commands

**Pre-deploy Command (runs before app starts):**
```
npx prisma migrate deploy --schema=prisma/schema.prisma
```

**Start Command:**
```
pnpm run start
```

**DO NOT** combine migrations in start command - use Pre-deploy for migrations.

### File Inclusion

Railpack automatically includes files, but ensure:
- Migration files are committed to git
- No `.railwayignore` excludes `prisma/migrations/`
- Root Directory is set correctly

---

## 🛠️ Troubleshooting Guide

### Migration File Not Found
```
Error: P3015: Could not find the migration file
```

**Check:**
1. File exists in git: `git ls-files prisma/migrations/`
2. File encoding is correct (UTF-8, no BOM)
3. Railway Root Directory is correct
4. File is committed and pushed

### Migration Already Applied
```
Error: P3008: Migration is already recorded as applied
```

**Solution:** This is normal - Prisma skips already-applied migrations. Just continue.

### Migration Failed
```
Error: P3009: migrate found failed migrations
```

**Solution:**
1. Check logs for specific error
2. Fix migration file if needed
3. Use `prisma migrate resolve` to mark as rolled-back or applied
4. Redeploy

### Tables Already Exist
```
Error: relation "TableName" already exists
```

**Solution:**
- If migration partially applied: Mark as rolled-back, fix file, redeploy
- If tables fully exist: Mark migration as applied, continue

---

## 📝 Example: Renaming Tables

### Step-by-Step Process

1. **Update Schema** (`schema.prisma`):
   ```prisma
   model Session {
     // ... fields
     @@map("sessions")  // Add this
   }
   ```

2. **Create Migration:**
   ```bash
   cd api
   npx prisma migrate dev --name rename_tables_to_snake_case
   ```

3. **Review Generated SQL:**
   - Check table renames
   - Check constraint renames
   - Check index renames (use `ALTER INDEX`, not `ALTER UNIQUE INDEX`)

4. **Fix Any Issues:**
   - Ensure UTF-8 encoding (no BOM)
   - Fix any SQL syntax errors
   - Test locally

5. **Commit & Push:**
   ```bash
   git add api/prisma/schema.prisma
   git add api/prisma/migrations/
   git commit -m "Rename tables to snake_case"
   git push
   ```

6. **Deploy:**
   - Railway auto-deploys from GitHub
   - Pre-deploy command runs migrations
   - Monitor logs for success

---

## 🎓 Key Learnings from Our Experience

1. **Always verify file encoding** - UTF-8 BOM causes cryptic PostgreSQL errors
2. **Test migrations locally first** - Catch syntax errors before production
3. **Use Prisma's generated migrations** - Don't manually write SQL unless necessary
4. **Check Railway Root Directory** - Must be relative path `api`, not `/api`
5. **Keep migration state clean** - Use `prisma migrate resolve` to fix failed states
6. **PostgreSQL syntax quirks** - `ALTER UNIQUE INDEX` doesn't exist, use `ALTER INDEX`
7. **Monitor deployment logs** - Catch errors early
8. **Commit both schema and migrations** - Always commit migration files, not just schema

---

## 🚀 Quick Start Template

```bash
# 1. Make schema changes
# Edit api/prisma/schema.prisma

# 2. Create migration locally
cd api
npx prisma migrate dev --name my_migration_name

# 3. Verify migration file
# - Check encoding (UTF-8, no BOM)
# - Review SQL syntax
# - Test locally

# 4. Commit and push
git add api/prisma/schema.prisma
git add api/prisma/migrations/
git commit -m "Add migration: my_migration_name"
git push origin main

# 5. Railway auto-deploys
# - Pre-deploy runs: npx prisma migrate deploy --schema=prisma/schema.prisma
# - Monitor logs for success
```

---

---

## 🚀 Railway Pre-Deploy Command Patterns

### Standard Pattern (99% of the time)

**Pre-deploy Command:**
```
npx prisma migrate deploy --schema=prisma/schema.prisma
```

**When to use:** Normal deployments with new migrations or when everything is working.

**What it does:**
- Applies pending migrations
- Skips already-applied migrations
- Fails if migrations are in a failed state
- Keeps database in sync

---

### Recovery Patterns (Only when migrations fail)

#### Pattern 1: Migration Partially Applied (Tables created but migration failed)

**Pre-deploy Command:**
```
npx prisma migrate resolve --applied MIGRATION_NAME && npx prisma migrate deploy --schema=prisma/schema.prisma
```

**When to use:** Tables already exist from a failed migration.

**Example:**
```
npx prisma migrate resolve --applied 20251101215541_init && npx prisma migrate deploy --schema=prisma/schema.prisma
```

**After this succeeds:** Switch back to standard pattern.

---

#### Pattern 2: Migration Failed and Needs Retry

**Pre-deploy Command:**
```
npx prisma migrate resolve --rolled-back MIGRATION_NAME && npx prisma migrate deploy --schema=prisma/schema.prisma
```

**When to use:** Migration failed, you fixed the migration file, and want to retry.

**Example:**
```
npx prisma migrate resolve --rolled-back 20251102103611_rename_tables_to_snake_case && npx prisma migrate deploy --schema=prisma/schema.prisma
```

**After this succeeds:** Switch back to standard pattern.

---

#### Pattern 3: One-Time Fix, Then Normal Deploy

**Option A: Run resolve command separately** (Recommended)
1. Temporarily set Pre-deploy to: `npx prisma migrate resolve --applied MIGRATION_NAME`
2. Deploy once
3. Switch back to: `npx prisma migrate deploy --schema=prisma/schema.prisma`

**Option B: Combined command**
```
npx prisma migrate resolve --applied MIGRATION_NAME && npx prisma migrate deploy --schema=prisma/schema.prisma
```

---

### Decision Tree

```
Is migration state normal? (no failed migrations)
├─ YES → Use STANDARD PATTERN
│         npx prisma migrate deploy --schema=prisma/schema.prisma
│
└─ NO → Migration failed?
    ├─ Tables already exist? → Use PATTERN 1 (--applied)
    │   npx prisma migrate resolve --applied NAME && npx prisma migrate deploy ...
    │
    └─ Need to retry migration? → Use PATTERN 2 (--rolled-back)
        npx prisma migrate resolve --rolled-back NAME && npx prisma migrate deploy ...
```

---

### Best Practices for Pre-Deploy Commands

1. **Default to standard pattern** - Use `migrate deploy` for normal operations
2. **Use recovery patterns only when needed** - Only when migrations fail
3. **Switch back after recovery** - Always return to standard pattern after fixing
4. **Monitor deployment logs** - Check logs to catch issues early
5. **Don't leave recovery commands permanently** - They're temporary fixes

---

### Example Workflow

**Normal Deployment:**
```
Pre-deploy: npx prisma migrate deploy --schema=prisma/schema.prisma
Start: pnpm run start
```

**After Fixing Failed Migration:**
```
Pre-deploy: npx prisma migrate resolve --applied 20251101215541_init
Start: pnpm run start
```
(Deploy once, then switch back)

**Next Deployment:**
```
Pre-deploy: npx prisma migrate deploy --schema=prisma/schema.prisma
Start: pnpm run start
```

**Summary:**
- **Standard:** `npx prisma migrate deploy --schema=prisma/schema.prisma` (use this always)
- **Recovery:** Use `--applied` or `--rolled-back` only when needed, then switch back
- **Permanent:** Keep standard pattern set in Railway

**Key Rule:** Recovery commands are temporary fixes - always switch back to standard pattern after recovery succeeds.

---

## 📚 Additional Resources

- [Prisma Migration Troubleshooting](https://www.prisma.io/docs/guides/database/production-troubleshooting)
- [Prisma Migrate Resolve](https://www.prisma.io/docs/reference/api-reference/command-reference#migrate-resolve)
- [Railway Deployment Docs](https://docs.railway.app/)
- [PostgreSQL ALTER INDEX Syntax](https://www.postgresql.org/docs/current/sql-alterindex.html)

---

**Remember:** Most migration issues can be avoided by:
1. Testing locally first
2. Verifying file encoding
3. Using Prisma's generated migrations
4. Keeping migration state clean

