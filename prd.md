---

# **PRD: Lab-in-the-Field Citizen Reporting Experiment (1 Day – 4 Feedback Treatments)**

## 1. Overview

**Purpose**
Evaluate whether different *performance feedback framings* in a mobile-friendly citizen-reporting app influence cooperative behavior in a low-cost public-goods task on campus.

**Research questions**

1. Do distinct feedback framings—**control**, **individual**, **cooperative**, **competitive**—produce different reporting levels in an identical field task?
2. Do certain framings sustain participation across short, repeated periods within the same session?

**Format**

* Duration: one-day field experiment
* 3 sessions × 60 minutes each
* Each session = 4 periods × 15 minutes
* Participants walk through campus and report pre-placed QR/code “issues” using their phones.
* App gives real-time feedback according to assigned treatment.

**Platform & stack**
Progressive Web App (PWA) built with:

| Layer         | Technology                                                  |
| ------------- | ----------------------------------------------------------- |
| Frontend      | **React + TypeScript + Vite + TailwindCSS + React-Leaflet** |
| Backend (API) | **Fastify (Node 22)**                                       |
| Database      | **PostgreSQL (Railway)**                                    |
| ORM           | **Prisma**                                                  |
| Realtime      | **Server-Sent Events (SSE)**                                |
| Hosting       | **Railway + custom domain (HTTPS)**                         |

---

## 2. Scope

**In scope**

* 4 treatment variants (control / individual / cooperative / competitive)
* QR or manual code reporting
* Server-side validation of all reports
* Real-time feedback via SSE
* Period tracking inside each session
* CSV export for later R / Python analysis
* Short exit survey
* Offline-ready PWA behavior for reliability

**Out of scope**

* Municipal integration or real issue creation
* User accounts or authentication
* Long-term tracking beyond experiment day
* Push notifications or background geolocation

---

## 3. User Roles

### 1. Participant (student)

* Joins via experiment link or QR code
* Receives a random treatment (stored server-side in signed cookie)
* Reports issues by scanning or typing code
* Views feedback in real time
* Completes short exit survey

### 2. Researcher (admin)

* Starts session and verifies issue catalog load
* Monitors live counts and leaderboards
* Exports data at session end
* Moves or replaces QR tags if needed

---

## 4. Functional Requirements

### **FR1 – Treatment assignment**

**Description**
When a participant first opens the experiment URL, the backend creates a participant record and assigns one of four treatments at random or balanced proportions.

**Acceptance**

* Treatment ∈ {control, individual, cooperative, competitive} stored in DB
* Persisted in HTTP-only cookie so refresh doesn’t change it
* Treatment embedded in every API response
* Admin dashboard shows counts per treatment

---

### **FR2 – Issue catalog**

**Description**
Server loads predefined issue list from `issues.csv` or seeded DB table.

**Acceptance**

* File format:

  ```csv
  issue_id,session_slot
  ISSUE_A01,1
  ISSUE_A02,1
  ISSUE_B03,2
  ```
* Invalid codes rejected with clear message
* Issue only valid for its session slot
* Catalog cached in memory for performance

---

### **FR3 – Reporting page**

**Description**
Single mobile-optimized page for code submission and camera scanning.

**Acceptance**

* Manual input and QR scanner both available
* Scanner uses `getUserMedia` + `BarcodeDetector` / ZXing fallback
* After submit → immediate visual feedback
* Works on Android Chrome / iOS Safari via HTTPS PWA
* Responsive layout (≥ 360 px width, 44 px tap targets)

---

### **FR4 – Server-side validation**

**Description**
All reports are verified on the backend before insertion.

**Rules**

1. Issue exists in catalog
2. Issue active for current session slot
3. Participant hasn’t reported this issue before

**Acceptance**

* Invalid → `{status:"invalid"}` (no DB write)
* Duplicate → `{status:"duplicate"}` (no counter increment)
* Valid → record stored with participant ID, treatment, issue ID, timestamp, slot, period ID, optional GPS

---

### **FR5 – Feedback per treatment**

**Description**
After valid submission, the server returns treatment-specific payload; React updates UI.

| Treatment   | Feedback behavior                                                |
| ----------- | ---------------------------------------------------------------- |
| Control     | “Report received.”                                               |
| Individual  | “You’ve reported N issues.”                                      |
| Cooperative | Progress bar (`found/total`) + level text (“Community level 3”). |
| Competitive | Leaderboard (top 5 participants by count).                       |

* Feedback computed server-side
* Participants in different treatments never receive cross-treatment data

---

### **FR6 – Period handling**

**Description**
Each session lasts 60 min = 4 × 15 min periods.

**Acceptance**

* Period = `floor((now – session_start) / 900)`
* Stored on each report
* UI shows “Period X of 4”
* Periods beyond 3 still recorded if overtime

---

### **FR7 – Data logging**

**Description**
All relevant events stored in Postgres for later export.

**Acceptance**

* Each **Scan**:
  participant_id, treatment, issue_id, timestamp, session_slot, period_id, (lat?, lon?, accuracy?)
* Each **Participant**:
  treatment, total_reports, session_id
* CSV exports (`/admin/export/scans.csv`, `participants.csv`) open in Excel or R.

---

### **FR8 – Exit survey**

**Description**
Shown once after session end.

**Acceptance**

* Questions: perceived fairness, fun, usefulness, pressure, feedback type seen
* Linked to participant record
* Results exportable with treatment metadata

---

### **FR9 – Admin monitoring**

**Description**
Web dashboard for researchers.

**Acceptance**

* Displays totals per treatment / period
* Real-time counts via SSE
* Manual CSV export anytime
* Authenticated via single `ADMIN_TOKEN`

---

## 5. Non-Functional Requirements

### **NFR1 – Availability**

* Must run entire experiment day without restart
* Refresh preserves session and treatment

**Acceptance**

* Cookie-based identity survives reload
* Postgres persists all data
* Auto reconnect for SSE if network drops

---

### **NFR2 – Mobile usability**

* Designed primarily for mobile browsers

**Acceptance**

* Works on 360 px screens
* UI built with Tailwind responsive utilities
* Buttons ≥ 44 px
* Manual entry always available

---

### **NFR3 – Performance**

* Submissions must feel instantaneous

**Acceptance**

* POST → confirmation < 2 s on campus Wi-Fi/LTE
* Leaderboard/progress updated in same SSE frame

---

### **NFR4 – Privacy & ethics**

* Pseudonymous participation; optional GPS

**Acceptance**

* No names/emails collected
* Location optional and stored separately
* Consent notice shown on first screen
* Data stored in EU-based Railway Postgres

---

### **NFR5 – Treatment isolation**

* No cross-exposure to other feedback framings

**Acceptance**

* Backend verifies treatment per request
* Frontend purely displays server payload
* Leaderboards segmented by treatment & session

---

### **NFR6 – Installability (PWA)**

* Must work like a native app on phones

**Acceptance**

* Has valid `manifest.webmanifest`
* Has service worker via `vite-plugin-pwa`
* Launches full-screen from Home Screen
* Camera access retained in standalone mode

---

## 6. Data Model (minimal)

### **Participant**

| Field         | Type      | Notes                                            |
| ------------- | --------- | ------------------------------------------------ |
| id            | UUID      | server-generated                                 |
| public_code   | string    | masked for leaderboard                           |
| treatment     | enum      | control / individual / cooperative / competitive |
| session_id    | int       | FK → Session                                     |
| total_reports | int       | counter                                          |
| created_at    | timestamp | auto                                             |

### **Scan**

| Field          | Type      | Notes                         |
| -------------- | --------- | ----------------------------- |
| id             | bigint    | autoincrement                 |
| participant_id | uuid      | FK                            |
| treatment      | string    | copy of participant.treatment |
| issue_id       | string    | FK → Issue                    |
| session_id     | int       | FK                            |
| period_id      | int       | derived from session_start    |
| lat            | float?    | optional                      |
| lon            | float?    | optional                      |
| accuracy       | float?    | optional                      |
| ts             | timestamp | server time                   |

### **Issue**

| Field        | Type   | Notes                 |
| ------------ | ------ | --------------------- |
| id           | string | e.g. ISSUE_A01        |
| session_slot | int    | determines visibility |

---

## 7. Day-of-Operation Plan

1. Researcher starts Session 1 in admin dashboard (~09:50).
2. Verifies issue list loaded from CSV.
3. QR tags placed on campus.
4. Participants join via QR/link; system auto-assigns treatments.
5. Four 15-minute periods run (total ≈ 60 min).
6. At session end, researcher exports CSV for backup.
7. Repeat for Sessions 2 & 3.

**Acceptance:** after final export, all three sessions contain valid `session_slot` and `period_id` labels and complete participant / scan records.

---

### **Appendix: PWA Deployment Summary**

* Built via `vite build` → `dist/` static assets
* Served by Fastify with service worker and manifest
* Deployed to Railway with `prisma migrate deploy && node dist/server.js`
* HTTPS ensured for camera API access
* Mobile install prompt verified on iOS Safari and Android Chrome

---
