---

# **Implementation Plan & Technical Documentation**

**Project:** *WU Citizen-Reporting Lab-in-the-Field Experiment*
**Stack:** TypeScript + React (Vite) + Fastify + Prisma + PostgreSQL (Railway)
**Target Devices:** Mobile browsers (PWA installable on iOS & Android)
**Purpose:** To operationalize a 1-day on-campus field experiment testing performance-feedback framings (control / individual / cooperative / competitive).

---

## **Phase 0 — Project Setup**

### **Folder structure**

```
citizen-reporting/
├── api/                    # Fastify backend
│   ├── src/
│   │   ├── server.ts
│   │   ├── routes/
│   │   │   ├── report.ts
│   │   │   ├── sse.ts
│   │   │   ├── admin.ts
│   │   │   └── survey.ts
│   │   ├── db/
│   │   │   ├── client.ts
│   │   │   └── seed-issues.ts
│   │   ├── services/
│   │   │   ├── feedback.ts
│   │   │   ├── period.ts
│   │   │   └── treatment.ts
│   │   ├── utils/
│   │   │   ├── validation.ts
│   │   │   ├── sse.ts
│   │   │   └── csv-export.ts
│   │   └── prisma/
│   │       ├── schema.prisma
│   │       └── migrations/
│   └── package.json
├── web/                    # Frontend React app
│   ├── src/
│   │   ├── main.tsx
│   │   ├── pages/
│   │   │   ├── Instructions.tsx
│   │   │   ├── Hunt.tsx
│   │   │   ├── Survey.tsx
│   │   │   └── Results.tsx
│   │   ├── components/
│   │   │   ├── QrScanner.tsx
│   │   │   ├── Leaderboard.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   └── FeedbackPanel.tsx
│   │   ├── styles/
│   │   │   └── index.css
│   │   └── hooks/
│   ├── vite.config.ts
│   ├── manifest.webmanifest
│   ├── index.html
│   └── package.json
├── dockerfile
├── README.md
└── .env.example
```

---

## **Phase 1 — Backend Environment**

### **1. Dependencies**

```bash
pnpm add fastify fastify-cors fastify-helmet fastify-cookie
pnpm add @prisma/client zod
pnpm add -D typescript tsx prisma @types/node
```

### **2. Prisma schema (core models)**

```prisma
model Session {
  id        Int          @id @default(autoincrement())
  slot      Int
  startTs   DateTime
  endTs     DateTime?
  scans     Scan[]
  parts     Participant[]
}

model Participant {
  id           String   @id @default(uuid())
  publicCode   String
  sessionId    Int
  session      Session  @relation(fields: [sessionId], references: [id])
  treatment    String
  totalReports Int      @default(0)
  createdAt    DateTime @default(now())
  scans        Scan[]
}

model Issue {
  id          String  @id
  sessionSlot Int
  scans       Scan[]
}

model Scan {
  id            BigInt       @id @default(autoincrement())
  participantId String
  participant   Participant  @relation(fields: [participantId], references: [id])
  treatment     String
  issueId       String
  issue         Issue        @relation(fields: [issueId], references: [id])
  sessionId     Int
  session       Session      @relation(fields: [sessionId], references: [id])
  periodId      Int
  lat           Float?
  lon           Float?
  accuracy      Float?
  ts            DateTime     @default(now())

  @@unique([participantId, issueId])
  @@index([sessionId, issueId])
}
```

### **3. Database configuration**

`.env`

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
COOKIE_SECRET="replace_with_strong_random"
SESSION_SLOT="1"
ADMIN_TOKEN="replace_with_admin_secret"
NODE_ENV="production"
```

### **4. Initialize**

```bash
npx prisma migrate dev --name init
npx prisma db seed
```

**Seed file:** loads issues from `data/issues.csv` into the `Issue` table.

---

## **Phase 2 — API Architecture**

### **Endpoints**

| Route                     | Method    | Description                                     |
| ------------------------- | --------- | ----------------------------------------------- |
| `/api/report`             | POST      | Receive and validate report submission          |
| `/api/sse/slot/:slot`     | GET (SSE) | Stream live cooperative progress & leaderboard  |
| `/api/admin/stats`        | GET       | Admin monitoring of totals per treatment/period |
| `/api/admin/export/:type` | GET       | CSV export (`participants` or `scans`)          |
| `/api/survey`             | POST      | Store exit survey responses                     |

### **Core middleware**

```ts
app.register(fastifyHelmet);
app.register(fastifyCors, { origin: true, credentials: true });
app.register(fastifyCookie, { secret: process.env.COOKIE_SECRET });
```

### **Report submission logic**

* Validate input with Zod schema
* Verify issue_id in `Issue` table for current slot
* Reject duplicates
* Compute current `period_id`
* Insert new `Scan`, increment participant total
* Return JSON payload with treatment-specific feedback

### **Feedback computation**

```ts
switch (treatment) {
  case "control": return { message: "Report received" };
  case "individual": return { myCount: count };
  case "cooperative": return { found, total };
  case "competitive": return { leaderboard: top5 };
}
```

### **Realtime SSE**

* Each slot has an active SSE stream `/api/sse/slot/:slot`
* Every 1s sends `{type:"coop", found, total}`, `{type:"comp", top}`, `{type:"period", id}`
* Reconnect auto-handled on client

---

## **Phase 3 — Frontend Environment**

### **1. Dependencies**

```bash
pnpm create vite web --template react-ts
cd web
pnpm add react-router-dom react-leaflet leaflet
pnpm add vite-plugin-pwa
```

### **2. PWA setup (`vite.config.ts`)**

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: true,
      workbox: {
        runtimeCaching: [
          { urlPattern: /^https:\/\/api\.citizen-reporting\.com\//, handler: "NetworkFirst" },
        ],
      },
    }),
  ],
});
```

### **3. `manifest.webmanifest`**

```json
{
  "name": "Campus Hunt",
  "short_name": "Hunt",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#0ea5e9",
  "background_color": "#ffffff",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### **4. Pages**

| Page                 | Purpose                                 |
| -------------------- | --------------------------------------- |
| **Instructions.tsx** | Consent, experiment intro               |
| **Hunt.tsx**         | QR/manual reporting, real-time feedback |
| **Survey.tsx**       | Exit questions                          |
| **Results.tsx**      | Thank-you + link for next session       |

---

## **Phase 4 — QR Scanning**

**Library:** `@zxing/browser` with `BarcodeDetector` fallback.
**Component:** `QrScanner.tsx` (handles both APIs, requests rear camera, includes file upload fallback).
**Access:** HTTPS only, with `Permissions-Policy: camera=(self)` header set in Fastify.

---

## **Phase 5 — Feedback UI Components**

* `FeedbackPanel.tsx`: renders feedback from API (`control`, `individual`, etc.)
* `ProgressBar.tsx`: cooperative progress visualization
* `Leaderboard.tsx`: top contributors, masked codes, SSE-updated
* All built with Tailwind utilities and mobile-friendly typography.

---

## **Phase 6 — Admin Dashboard**

| Feature              | Implementation                                        |
| -------------------- | ----------------------------------------------------- |
| Totals per treatment | Query counts grouped by `treatment`                   |
| Reports per period   | Query grouped by `period_id`                          |
| Live updates         | SSE subscription                                      |
| Export               | `GET /api/admin/export/scans.csv`, `participants.csv` |
| Access               | Protected by `ADMIN_TOKEN`                            |

---

## **Phase 7 — Deployment (Railway)**

**Steps**

1. Create new Railway project
2. Add PostgreSQL plugin
3. Create Web Service from GitHub repo
4. Add environment variables:

   ```
   DATABASE_URL=<from Postgres>
   COOKIE_SECRET=<random>
   SESSION_SLOT=<1/2/3>
   ADMIN_TOKEN=<secure token>
   NODE_ENV=production
   ```
5. Start command:

   ```bash
   prisma migrate deploy && pnpm build && node dist/server.js
   ```
6. Enable HTTPS domain for camera and PWA features
7. Verify endpoints `/api/report`, `/api/sse/slot/1`, `/manifest.webmanifest`

---

## **Phase 8 — Data Export & Analysis**

* Export CSVs from admin view after each session.
* Files automatically include:

  * `participant_id`, `treatment`, `session_slot`, `period_id`, `issue_id`, `timestamp`, `lat`, `lon`
  * One row per report (Scan)
* Compatible with R or Python for analysis of contribution patterns and treatment effects.

---

## **Phase 9 — Testing**

| Test Type               | Focus                                      | Tools                         |
| ----------------------- | ------------------------------------------ | ----------------------------- |
| **Unit tests**          | API input validation, feedback logic       | Vitest / Jest                 |
| **Integration**         | `/api/report` flow with in-memory Postgres | Supertest                     |
| **E2E (optional)**      | React flows (join → report → feedback)     | Playwright                    |
| **Mobile manual tests** | iOS Safari, Android Chrome                 | Real devices via deployed URL |

---

## **Phase 10 — Security, Privacy & Ethics**

* **Anonymity:** participants identified only by UUID (`public_code` masked).
* **Minimal data:** no names/emails collected; location optional.
* **Transport security:** HTTPS enforced; HSTS headers set.
* **Rate limiting:** 1 request/sec per participant.
* **Data storage:** EU-hosted Railway Postgres (temporary for experiment duration).
* **Consent:** mandatory text on first screen clarifying research nature and optional GPS use.

---

## **Phase 11 — Maintenance & Observability**

* Logging to Railway console (JSON logs per report event)
* Simple health route `/api/health`
* Auto-restart on crash via Railway platform
* Manual data backup (CSV export) after each session

---

## **Phase 12 — Deliverables**

| Deliverable                    | Description                                               |
| ------------------------------ | --------------------------------------------------------- |
| `citizen-reporting` repository | Full codebase (frontend + backend)                        |
| Technical documentation        | This plan + API docs (Swagger optional)                   |
| Admin credentials              | For WU research team                                      |
| Data exports                   | CSVs for each session                                     |
| Presentation                   | Summary of stack, architecture, and experimental outcomes |

---

## **Summary Diagram**

```
[ Participant PWA ]
   | QR Scan / Code Submit
   v
[ Fastify API ]
   |--> Validate issue
   |--> Insert Scan
   |--> Return Feedback JSON
   |<-- SSE (progress, leaderboard)
   v
[ PostgreSQL DB (Railway) ]
   | Sessions / Participants / Scans / Issues
   v
[ Admin Dashboard ]
   |--> Live totals
   |--> CSV export
```

---

## **Appendix: Build & Run Locally**

```bash
# 1. Backend
cd api
pnpm install
npx prisma migrate dev
pnpm run dev

# 2. Frontend
cd ../web
pnpm install
pnpm run dev

# Access app
https://localhost:5173
```

---
