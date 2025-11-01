# WU Citizen-Reporting Experiment

Mobile-first PWA for field experiment with QR code scanning, real-time feedback, and treatment-based reporting.

## Repository Structure

- `/api` - Fastify + Prisma + PostgreSQL backend
- `/web` - React + Vite + Tailwind CSS + PWA frontend
- `/data` - CSV seed files for issues

## Quick Start

### Prerequisites
- Node.js 22+
- pnpm (via corepack)
- PostgreSQL database

### Backend Setup

```bash
cd api
pnpm install
pnpm run generate  # Generate Prisma client
# Update .env with your DATABASE_URL, secrets, etc.
pnpm run migrate   # Run migrations
pnpm run seed      # Seed initial data
pnpm run dev       # Start dev server on port 3000
```

### Frontend Setup

```bash
cd web
pnpm install
pnpm run dev       # Start dev server on port 5173
```

### Railway Deployment

1. Create new Railway project and connect GitHub repo
2. Provision PostgreSQL database
3. Add Web Service from GitHub (root: `api`)
4. Set environment variables:
   - `DATABASE_URL` (from PostgreSQL service)
   - `COOKIE_SECRET` (random string)
   - `SESSION_SLOT` (1, 2, or 3)
   - `ADMIN_TOKEN` (admin secret)
   - `NODE_ENV=production`
5. Set start command: `pnpm run migrate:deploy && pnpm run build && pnpm run start`
6. Configure HTTPS domain

See `/Implementation Plan & Technical Documentation.md` for detailed architecture.
