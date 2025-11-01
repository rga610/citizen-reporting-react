# WU Citizen-Reporting Experiment (Lab-in-the-Field)

### 🧩 Overview
This repository contains the **Progressive Web App (PWA)** and **API backend** for the *Citizen-Reporting Experiment* conducted at **WU Wien**.  
The experiment tests how different **performance-feedback framings** (control, individual, cooperative, competitive) influence participation in a simulated public-goods task.

Participants walk across campus, scan or enter issue codes, and receive real-time feedback through the app.  
All reports are stored securely in a **PostgreSQL database** and can be exported for later statistical analysis.

---

## 🧠 Research Context
- **Purpose:** Examine how real-time feedback shapes cooperative behavior in low-cost public goods settings.  
- **Design:** One-day field experiment, three 1-hour sessions (4 × 15 min periods).  
- **Treatments:**  
  1. Control – “Report received.”  
  2. Individual – Personal progress counter.  
  3. Cooperative – Shared group progress bar.  
  4. Competitive – Real-time leaderboard.  
- **Platform:** Web-based mobile app (no install required).  
- **Stack:** TypeScript + React + Fastify + Prisma + PostgreSQL (Railway).

---

## 🏗️ Architecture

```

Frontend (React + Vite + PWA)
↳ /api/report   (POST)
↳ /api/sse/slot/:slot   (SSE for realtime feedback)
Backend (Fastify + TypeScript)
Database (PostgreSQL via Prisma)
Hosting (Railway)

```

**Key features**
- Real-time feedback with Server-Sent Events (SSE)
- QR-code and manual input support
- Period tracking and session logging
- Admin dashboard for live stats and CSV export
- Fully installable PWA (works offline / camera access)

---

## 📦 Repository Structure

```

citizen-reporting/
├── api/              # Fastify backend
│   ├── src/
│   │   ├── server.ts
│   │   ├── routes/   # report.ts, sse.ts, admin.ts, survey.ts
│   │   ├── services/ # feedback, treatment, period calculators
│   │   ├── prisma/   # schema.prisma, migrations
│   │   └── utils/    # validation, csv export, SSE helpers
├── web/              # React + Vite frontend (PWA)
│   ├── src/pages/    # Instructions, Hunt, Survey, Results
│   ├── src/components/ (QrScanner, Leaderboard, ProgressBar)
│   ├── manifest.webmanifest
│   ├── vite.config.ts
│   └── index.html
└── README.md

````

---

## 🚀 Quick Start (Local)

### 1️⃣ Clone the repo
```bash
git clone https://github.com/YOUR-ORG/citizen-reporting.git
cd citizen-reporting
````

### 2️⃣ Backend setup

```bash
cd api
pnpm install
cp .env.example .env
# Fill in DATABASE_URL and secrets
npx prisma migrate dev --name init
pnpm run dev
```

### 3️⃣ Frontend setup

```bash
cd ../web
pnpm install
pnpm run dev
```

Open: [https://localhost:5173](https://localhost:5173)

---

## 🧩 Environment Variables

| Variable        | Description                               |
| --------------- | ----------------------------------------- |
| `DATABASE_URL`  | Postgres connection string                |
| `COOKIE_SECRET` | Secret key for signed participant cookies |
| `SESSION_SLOT`  | Session slot number (1–3)                 |
| `ADMIN_TOKEN`   | Token for accessing admin dashboard       |
| `NODE_ENV`      | `development` / `production`              |

Example `.env.example`:

```bash
DATABASE_URL="postgresql://user:password@host:5432/dbname"
COOKIE_SECRET="replace_with_random"
SESSION_SLOT="1"
ADMIN_TOKEN="replace_with_admin_secret"
NODE_ENV="production"
```

---

## 🌐 Deployment (Railway)

1. Create a new **Railway project**
2. Add a **PostgreSQL service**
3. Add a **Web Service** from this GitHub repo
4. Set Environment Variables (see above)
5. Start command:

   ```bash
   prisma migrate deploy && pnpm build && node dist/server.js
   ```
6. Ensure **HTTPS** domain → camera access only works on HTTPS
7. Visit your domain, e.g.
   `https://citizen-reporting.up.railway.app`

---

## 📱 PWA Features

* Works as installable app (Add to Home Screen)
* Offline-ready with cached assets
* Camera access for QR scanning
* Manifest + service worker via `vite-plugin-pwa`
* Works on Android Chrome ≥ 117 and iOS Safari ≥ 17

---

## 🔍 API Overview

| Method | Endpoint                  | Description                               |
| ------ | ------------------------- | ----------------------------------------- |
| `POST` | `/api/report`             | Submit issue report                       |
| `GET`  | `/api/sse/slot/:slot`     | Stream cooperative progress & leaderboard |
| `POST` | `/api/survey`             | Submit exit survey                        |
| `GET`  | `/api/admin/stats`        | Admin summary view                        |
| `GET`  | `/api/admin/export/:type` | CSV export (`participants` or `scans`)    |

**Report Request**

```json
{
  "issue_id": "ISSUE_A01",
  "lat": 48.219,
  "lon": 16.403,
  "accuracy": 12
}
```

**Report Response**

```json
{
  "status": "ok",
  "treatment": "cooperative",
  "feedback": { "found": 14, "total": 20, "period_id": 2 }
}
```

---

## 🧾 Data Model (simplified)

### Participant

| Field         | Type                                             |
| ------------- | ------------------------------------------------ |
| id            | UUID                                             |
| treatment     | control / individual / cooperative / competitive |
| session_id    | Int                                              |
| total_reports | Int                                              |

### Scan

| Field                | Type     |
| -------------------- | -------- |
| id                   | BigInt   |
| participant_id       | UUID     |
| issue_id             | String   |
| period_id            | Int      |
| lat / lon / accuracy | Float?   |
| ts                   | DateTime |

### Issue

| Field        | Type   |
| ------------ | ------ |
| id           | String |
| session_slot | Int    |

---

## 📊 Admin Dashboard

Accessible at `/admin` (protected by `ADMIN_TOKEN`).

Features:

* Live totals per treatment & period (auto-refresh via SSE)
* Manual CSV export (participants / scans)
* Session control (start, stop, export)

---

## 🔒 Privacy & Ethics

* No personal identifiers collected
* Participant ID = random UUID stored in secure cookie
* Location optional and anonymized
* Data stored temporarily on EU-based Railway Postgres
* HTTPS enforced; all network traffic encrypted
* Consent notice shown on first screen

---

## 🧪 Testing

| Type                  | Tool                        |
| --------------------- | --------------------------- |
| Unit tests            | Vitest                      |
| API integration       | Supertest                   |
| End-to-end (optional) | Playwright                  |
| Mobile QA             | iOS Safari & Android Chrome |

Run:

```bash
pnpm run test
```

---

## 🧰 Development Notes

* **Real-time layer:** Server-Sent Events (SSE)
* **Camera API:** `BarcodeDetector` (native) → fallback to `@zxing/browser`
* **Styling:** TailwindCSS
* **Map UI (optional):** React-Leaflet
* **ORM:** Prisma with migrations
* **Build tool:** Vite
* **Language:** TypeScript across frontend + backend

---




