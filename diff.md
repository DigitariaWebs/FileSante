# FileSante ↔ FileSante 2.0 — UI/UX Feature Diff

Comparison of UI features only. Scope: HTML/JS in `FileSante2.0/frontend/` vs Next.js in `FileSante/src/`.
Backend (Express, DB, WebSocket, SMS service) intentionally excluded.

Generated: 2026-05-20

---

## TL;DR

- **FileSante** — modern Next.js 15 app, App Router, TS, Apple-style design (`fs-*` tokens), Tailwind, mock state store with sim clock. UI-only, no backend.
- **FileSante 2.0** — vanilla HTML/CSS/JS, 11 standalone dashboards, glassmorphic landing, real Express backend (auth, DB, WebSocket, SMS).
- **Same domains** — 811, triage, clinique/facility, direction/MSSS, patient — but **2.0 covers more operational scenarios** (civière, surge, shift change), and **FileSante has more polished sub-pages** (KPI funnel, alert tiers, SMS log, clinic drill-down).

---

## 1. Domain Coverage Matrix

| Domain | FileSante (Next.js) | FileSante 2.0 (HTML) |
|---|---|---|
| Landing / Marketing | `/` (Hero, StatsRow, HowItWorks, Features, Portals, Partners, CTA, Marquee) | `index.html` (glassmorphic hero, portal grid, 6-step process, hospital partners) |
| Login | Modal only (`login-modal.tsx`) | Standalone `login.html` (4 role cards, hospital/region select) |
| Triage — Home | `/dashboard/triage` (session banner, KPIs, à confirmer, arrivées, SMS panel) | `dashboard.html` (KPIs, queue table, civière section, surge alerts) |
| Triage — Queue | `/dashboard/triage/queue` (5 tabs, deadline countdowns) | inside `dashboard.html` (5 filter tabs, card-on-mobile) |
| Triage — Register | `/dashboard/triage/register` (full form, origin DESK/HOME_811, consent) | inside `dashboard.html` (Add patient modal) |
| Triage — Scan/QR | `/dashboard/triage/scan` (large input, code pills, recent scans) | inside `dashboard.html` (return code modal, QR scan or 4-digit) |
| Triage — KPI | `/dashboard/triage/kpi` (8 tiles + 5-step funnel) | `analytics.html` (4 KPI + bar/donut + 7-day history) |
| Triage — SMS Log | `/dashboard/triage/sms` (search, full-text) | none |
| Triage — Civière | none | inside `dashboard.html` (stretcher table, status flow, add modal, alert bar) |
| 811 — Home | `/dashboard/811` (KPIs, recent calls, resource search panel) | `dashboard-811.html` (KPIs, orientation form, recent orientations) |
| 811 — Calls list | `/dashboard/811/calls` (search, tabs, table) | none |
| 811 — New call | `/dashboard/811/new` (eval form, ranked rec panel, registration modal) | inside `dashboard-811.html` (single-page form + result card) |
| Clinique — Home | `/dashboard/clinique` (KPIs, capacity bar, pending refs, heartbeat spark) | `dashboard-facility.html` (KPIs, pending refs, history, peer facilities) |
| Clinique — Capacity | `/dashboard/clinique/capacity` (hourly bars, capacity setter) | none |
| Clinique — Inbox | `/dashboard/clinique/inbox` (4 tabs, search, accept/refuse) | inside `dashboard-facility.html` (pending list w/ accept/decline) |
| Sector heatmap | inside `/dashboard/msss` (12 sectors as cells) | `dashboard-sector.html` (heat grid, 5-color legend, stale section) |
| Direction — Home | `/dashboard/direction` (hospital tabs, KPIs, dual sparkline, alerts, capacity) | `dashboard-director.html` (KPIs + savings calc + methodology) |
| Direction — Alerts | `/dashboard/direction/alerts` (3 tiers: critical/warning/watch) | inside `dashboard-director.html` (single amber banner) |
| Direction — Hourly | `/dashboard/direction/hourly` (dual bar chart, 6h/12h/24h window) | inside `dashboard-director.html` (single bar + donut) |
| MSSS — Home | `/dashboard/msss` (KPIs, hospital table, sector heatmap) | `dashboard-provincial.html` (KPIs, hospital grid, line chart, breakdown) |
| MSSS — Hospitals | `/dashboard/msss/hospitals` (sortable table w/ sparklines) | inside `dashboard-provincial.html` (basic breakdown table) |
| MSSS — Sectors | `/dashboard/msss/sectors` (heatmap + clinic drill-down list) | inside `dashboard-sector.html` (cell click, no drill-down) |
| Admin (all hospitals) | none | `admin.html` (global KPIs, hospital cards w/ trend ±1, hourly chart) |
| Patient portal | `/dashboard/patient` (code lookup, step rail, confirm Oui/Non, summary, SMS timeline) | `patient.html` (state machine: no-token → activate → waiting → soon → depart) |

---

## 2. Features FileSante HAS that 2.0 does NOT

### Pages / sub-pages

- **Triage KPI funnel page** (`/dashboard/triage/kpi`) — dedicated 5-step funnel (Inscribed → Confirmed → Arrived → No-show → Annulés) with funnel-fill bars + percentages.
- **Triage SMS log page** (`/dashboard/triage/sms`) — full-text searchable SMS history with icon chips and T+ timestamps.
- **Triage Queue page** (`/dashboard/triage/queue`) — split off as its own route with 5 status tabs and per-row deadline countdowns.
- **Triage Scan page** (`/dashboard/triage/scan`) — dedicated scan/return page with active-code pills, recent scans sidebar.
- **811 Calls list page** (`/dashboard/811/calls`) — searchable, tabbed history (All/Active/Closed) with monospace codes.
- **Clinique Inbox page** (`/dashboard/clinique/inbox`) — 4-tab referral mgmt (Pending/Accepted/Refused/All) with empty-state.
- **Clinique Capacity page** (`/dashboard/clinique/capacity`) — 12-bar hourly capacity chart + editable daily capacity setting.
- **Direction Alerts page** (`/dashboard/direction/alerts`) — 3 wait-time tiers (CRITICAL >3h red / WARNING 2–3h orange / WATCH 1–2h amber).
- **Direction Hourly page** (`/dashboard/direction/hourly`) — dual-grouped bar chart (inscriptions vs arrivals) with 6h/12h/24h window selector.
- **MSSS Hospitals page** (`/dashboard/msss/hospitals`) — sortable per-column table with per-hospital sparkline trend.
- **MSSS Sectors page** (`/dashboard/msss/sectors`) — clickable sector cells with clinic-drill-down list (type chip, load bar, ETA).

### Components / interactions

- **Step rail** (4-step progress: Inscrit → Confirmation → Confirmé → Arrivé) on patient page.
- **Deterministic QR card** from string hash (`QrCard.tsx` — xorshift32, 21×21 finder stamps).
- **Reactive Countdown component** with T-zero detection (`Countdown.tsx`).
- **Sparkline SVG component** with customizable line + fill (`Sparkline.tsx`).
- **Sortable table headers** with ▲/▼ direction indicators (MSSS hospitals).
- **Centralized client store** (`useFileSante` + `useSyncExternalStore`) with localStorage hydration and a `simClock` ticking at 1×/60×/600× — synchronizes countdowns, SMS, series across all pages.
- **Apple-style fs-* design system** (`fs-display-hero` 56px, `fs-btn-pearl`, `fs-stat-tile`, `fs-funnel-track`, `fs-icon-chip`, etc.).
- **Symptom multi-select chips** (10 triage symptoms) on `/dashboard/811/new`.
- **Origin selector** (DESK / HOME_811) on `/dashboard/triage/register` for intake source attribution.
- **Patient confirmation Oui/Non flow** with conditional cards per status (AWAITING_CONFIRMATION → REGISTERED → CONFIRMED → closed).
- **Marketing sections** — `HowItWorks`, `MarqueeStrip`, `StatsRow`, `CallToAction`, `Reveal` (scroll-trigger), `PhoneFrame`.
- **Type-safe Patient/Referral models** (`lib/filesante/types.ts`) with 9 status states.

---

## 3. Features 2.0 HAS that FileSante does NOT

### Pages

- **Standalone `login.html`** — full-page login with 4 role cards (Inf. Triage / Inf. 811 / Directeur / Gouvernement), hospital-code select, region select for 811, conditional fields. *(FileSante has only a modal.)*
- **`analytics.html`** — separate analytics page with Chart.js hourly bar + status donut + 7-day history table (date / registered / returned / no-show / rates / avg wait / peak hour). *(FileSante's triage KPI page is funnel-focused, not history-focused.)*
- **`admin.html`** — system-admin all-hospitals view: global KPI strip (5 cards inc. LWBS aggregate), hospital cards with status bars, **trend indicators ±1 from client-side snapshots**, 12h hourly bar chart, 30s auto-refresh.
- **`dashboard-provincial.html`** — provincial Chart.js **multi-line chart** (4 hospital series, 7h–19h) + per-hospital occupancy bar chart.

### Triage-specific operations missing from FileSante

- **Civière (stretcher) management** — entire in-facility patient tracking subsystem:
  - Civière section with table: patient, stretcher #1–20, reason (Labo / Radio / Consultant / Other), status (Attente résultats → Résultats → Décision → Libérée).
  - **Civière alert bar** at top: "X civières en attente de résultats" with dismiss buttons per stretcher.
  - **Add Stretcher modal**: name, stretcher #, reason.
- **Surge mode modal** — +15 / +30 / +45 min delay broadcast to waiting patients during overflow.
- **Nurse shift-change modal** — Prénom / Nom inputs, updates session.
- **Explicit SMS vs Call notification mode toggle** on patient registration (phone-call mode shows 4-digit code instead of QR).
- **Call alerts section** — "patients to call" list with `tel:` links + "Called" button (for patients waiting >3h on phone-call mode).
- **Patient row highlight** — `non-confirmé` rows get red bg (#FEF2F2), action buttons color-coded (green confirm, amber notify, red noshow).
- **Cancel / "Annuler"** explicit row action.

### Director / Direction

- **Savings calculator strip** — 4 cards: daily total savings ($), annual projection ($), time saved per patient (min), civière savings ($).
- **Methodology expander** — documents the formula: IEDM baseline 5h23, RAMQ cost 85 $/h, civière 1200 $/night.
- **Staff indicator bar** — nurses on duty, doctors, civières available (e.g. 4/12), current shift.
- **PDF shift-report generation** button (`/api/hospitals/{code}/report`).

### 811 / Orientation

- **Patient age-range field** (0–2 / 3–12 / 13–17 / 18–64 / 65+) on orientation form.
- **Postal-code / sector-name location input** (H1V / Rosemont / Plateau / …) with text fallback.
- **Algorithmic orientation result card** — displays resource type, **distance**, name, address, **phone**, **next available slot**, accept button. *(FileSante shows ranked resources but without distance / next-slot.)*
- **Hardcoded RESOURCES fallback** of 5 GMF/CLSC/IPS for offline demo.

### Facility / Clinique

- **WebSocket live pill** — real-time connection indicator on facility dashboard.
- **Peer facilities grid** — same-sector clinics shown side-by-side with own facility highlighted.
- **Test referral creation button** — synthesizes a fake referral for demo.
- **Source badge on referrals** — `811 / 911 / Hospital / Test` chip.

### Sector heatmap

- **5-color heat legend** explicitly visible (<25 % calm → >90 % critical) + **stale gray** for >4h inactive.
- **Stale section** below heatmap — separate list of facilities with no activity for >4h, with time-since-activity label.
- **Auto-fill grid** (CSS Grid `auto-fill minmax(220px, 1fr)`) — flexes per viewport.

### Provincial / MSSS

- **Multi-hospital line chart** — Chart.js with 4 datasets (one per hospital), 7h–19h x-axis.
- **Per-hospital cards** with colored header bar by civière occupancy (green ≤65 % / amber 65–85 % / red >85 %).
- **Export-report (TXT) download** button.

### Patient portal

- **State-machine driven view** (no-token → activation → waiting → soon → depart). FileSante has step-rail but expects the patient already has a code lookup.
- **Phone activation flow** — enter number (10+ digits) + consent checkbox + "Confirmer et rejoindre" submit.
- **State-driven hero gradient** — header tint changes by state (blue waiting / amber soon / green depart).
- **Demo bar at bottom** — toggle buttons (En attente / Tour approche / Partez) to switch demo state.
- **"Je suis arrivé(e)"** big arrival-confirm button.
- **Status polling** (`/api/patients/{token}` every 30s).
- **Worsening-symptoms warning card** ("alerter le 811 si …") + **document checklist** (RAMQ / ID / meds) on `soon` state.

### Landing page polish

- **Glassmorphic navbar** (backdrop-blur, rgba) with sticky behavior.
- **Animated grid overlay** on hero background.
- **Pulsing live-dot badge** in hero.
- **Bouncing scroll indicator**.
- **IntersectionObserver fade-in** on scroll.
- **Hospital partner cards** — 4 pilot hospitals (HMR, HND, HSC, HGM) with logos/badges.

---

## 4. Notes on parity that is *different*, not missing

- Both have a **portal grid** on landing, but 2.0 has 7 portals incl. "Sector heatmap" and "Government" as separate tiles; FileSante has 6 in `Portals.tsx`.
- Both have **referral accept/decline** but UI metaphors differ — 2.0 uses tile rows in a single column, FileSante uses tabbed inbox.
- Both have **queue filters** (5 tabs) — same semantics, different styling.
- Both have **hospital code identity** — 2.0 in localStorage post-login; FileSante via mock store with no auth gate.
- Both render **QR codes** — 2.0 uses external lib; FileSante uses a deterministic decorative 21×21 grid (not scannable).

---

## 5. Design-token alignment

| Token kind | FileSante (`fs-*` + Apple) | FileSante 2.0 (`tokens.css`) |
|---|---|---|
| Primary | `--fs-primary` #1E90D6 | `--blue-600` #0D3B8A (deeper) |
| Accent | (none — single-blue identity) | `--teal-400` #1DB89A / `--teal-600` #0F7A68 |
| Heatmap | inline scale in component | explicit `--heat-0`…`--heat-4` + `--heat-stale` |
| Type | SF Pro Display / Text / Mono | DM Sans + Syne + DM Serif Display |
| Radius | 10px base + 18px cards | 6 / 9 / 14 / 16 px tokens |
| Status colors | `info / success / warn / danger` enum | `blue / green / amber / red` per-status |

Visual languages **diverge** — FileSante is Apple-system minimalism; 2.0 is colorful health-information.

---

## 6. Recommended port targets (priority order)

If porting 2.0 → FileSante (UI/UX only), suggest:

1. **Civière (stretcher) subsystem** in triage — highest functional gap.
2. **Surge mode** + **shift-change** + **Cancel** row action in triage queue.
3. **SMS-vs-Call notification mode** explicit toggle on registration + call alerts list.
4. **Director savings calculator** strip + methodology expander + staff indicator bar.
5. **Patient activation flow** (no-token / activation form / state-driven hero / demo toggle).
6. **Admin all-hospitals page** (`/dashboard/admin`).
7. **Analytics page** with hourly bar + status donut + 7-day history table (port Chart.js or use existing Sparkline + new Donut component).
8. **811 orientation result card enhancements** (distance + next slot + phone + age-range field).
9. **Sector heatmap stale section** + explicit 5-color legend.
10. **Standalone login page** with role cards (replace modal-only flow).
11. **Provincial multi-hospital line chart** + per-hospital occupancy cards on `/dashboard/msss`.
12. **Landing polish** — glassmorphic blur, animated grid overlay, pulsing dot, scroll indicator.

Items 1–6 are functional gaps; 7–12 are visual / analytical polish.
