# FileSanté — TODO

## 1. Inscription patient triage
- [x] Triage page at `/dashboard/triage/register` (Next.js demo, no auth layer); localStorage hospital binding persists across registrations
- [x] Form: name, priority (P4/P5), motif → `addPatient()` (client store, no real API)
- [x] Auto-generate 4-digit code + patient id client-side (`randomCode` + `newPatientId`)
- [x] Render decorative QR via `RegistrationModal`; patient page uses `?code=XXXX` (not `?token=`)
- [x] Insert patient row: status `REGISTERED` (≈waiting); phone collected upfront for SMS demo
- [x] Push to queue display immediately via reactive store subscription

## 2. Activation QR patient
- [x] `/dashboard/patient` route accepts `?token=` (alias of `?code=`)
- [x] Consent screen (Loi 25) — `ActivationView` gated on `activatedAt === null`
- [x] Phone input, Canadian format (`CANADIAN_PHONE_RE` validation)
- [x] `activatePatient(id, phone)` store action — sets `activatedAt` + `ttlAt` (24h); `pseudonymizePhone` helper for display layer
- [x] Phases waiting / soon (=notified) / depart (=confirm) — `statusToPhase`
- [x] Invalid-token fallback screen — `NotFound` shows "QR ou code invalide" with returned token
- [x] No wait-minutes displayed to patient — only countdown to next deadline

## 3. File attente virtuelle
- [x] `getHospitalQueue(code)` + `sortQueue` selectors — P4 before P5, FIFO by `registeredAt` within group ([store.ts](src/lib/filesante/store.ts))
- [x] Reactive broadcast via `store.subscribe` / `useFileSante` (replaces WebSocket in this Next.js client demo); queue page filters by bound hospital (localStorage)
- [x] `engine.tick` (Ticker, 1s) handles next-up (`askConfirmAt`), confirm expiry (15min → final 10min → `NO_RESPONSE`), arrival expiry → `NO_SHOW`, and 24h TTL PII purge via `purgeExpired` + `redactPatientPii`

## 4. Notification + rappel
- [x] `pickNextForHospital(code)` selector — P4>P5 + FIFO; engine `tick` auto-notifies on `askConfirmAt`
- [x] `fireBrowserNotification` — `window.Notification` permission + `navigator.vibrate` Amber-pattern fallback (no PWA service worker yet)
- [x] Neutral SMS template via `logSms` (no medical detail); real Twilio backend out of scope
- [x] `notifyPatient(id, {manual})` → status `AWAITING_CONFIRMATION`, sets `notifiedAt`, starts 15-min `confirmDeadlineAt`
- [x] Manual notify: "Rappeler" button on REGISTERED rows + "Rappelé manuellement" chip via `manualNotify` flag

## 5. Confirmation retour
- [x] Patient page: "Oui, je viens" / "Non, j'annule" buttons during AWAITING_CONFIRMATION (`patient/page.tsx` ActionCard)
- [x] `confirmPatient` → status `CONFIRMED` with 60-min arrival window
- [x] Engine: AWAITING → AWAITING_FINAL → NO_RESPONSE (expired); CONFIRMED past `arrivalDeadlineAt` → NO_SHOW. Each pushes `ExpiryAlert` via `pushExpiryAlert`; `ExpiryAlertBar` shows on queue page
- [x] Per-hospital `confirm_delay` (1-15 min) stored in `hospitalSettings`; `notifyPatient` reads `getConfirmDelayMin(hospital)` (UI control = Section 13)

## 6. Civières
- [x] Civières section at [/dashboard/triage/civieres](src/app/dashboard/triage/civieres/page.tsx) with `AddStretcherModal` for assignment
- [x] Assign → `addCiviere({stretcherNum, reason, ...})` → starting status `AWAITING_RESULTS` (≈ Occupée), staff `civieresAvail` decremented
- [x] Transitions: `AWAITING_RESULTS` → `RESULTS_IN` → `DECISION` → `DISCHARGED` (4 states match spec); `setCiviereStatus` advances
- [x] `transitions: { status, at }[]` append-only history on each `Civiere` — timestamped per status change
- [x] `getCivieresOccupancyAll()` + `getCivieresOccupancyByHospital(code)` selectors; Director `CapacityCard` consumes live values (no more hardcoded 14/20)
- [x] In-memory schema = `Civiere` type ([types.ts](src/lib/filesante/types.ts)); real `civiere_patients` SQL table out of scope (no backend)

## 7. Surge button
- [x] `triggerSurge(code, +15|+30|+45)` per-hospital ([store.ts](src/lib/filesante/store.ts)); state in `surgeByHospital[code]` (`SurgeState{minutes, startedAt}`)
- [x] Notifications suspended automatically — `triggerSurge` pushes back `askConfirmAt` by `+minutes`, so engine's `notifyPatient` schedule shifts with it
- [x] ETAs recalculated — `estimatedSlotAt` extended by `+minutes` for every active patient at that hospital
- [x] Neutral SMS broadcast via `logSms` to REGISTERED patients of that hospital (no medical detail)
- [x] Auto-resume: engine `autoResumeSurge` clears surge once `startedAt + minutes` elapses

## 8. Rapport quart PDF
- [x] Client-side printable report at `/dashboard/triage/report?hospital=...&nurse=...` ([report/page.tsx](src/app/dashboard/triage/report/page.tsx)); browser "Imprimer/PDF" used in place of pdfkit (no backend)
- [x] "Rapport de quart" button on triage dashboard → opens report scoped to bound hospital + current nurse
- [x] Auto-open on shift change: `ShiftChangeModal` opens new-tab report with `?autoprint=1` and `&nurse=<outgoing>` before flipping shift
- [x] Content: P4/P5 counts, attente moyenne+médiane, civières occupied/freed/avail, surge event log (`s.surgeEvents` per hospital), notifs sent + manualNotifs, économies (85$/h RAMQ + 1200$/nuit civière, baseline IEDM 323 min)

## 9. Mode appel téléphonique
- [x] Register form supports `contact: "CALL"` toggle → `RegistrationModal` skips QR rendering for CALL patients
- [x] `PendingCallsBar` dashboard alert with `tel:` links for CALL patients in AWAITING_CONFIRMATION; mounted on triage home + queue page. Dedicated [calls page](src/app/dashboard/triage/calls/page.tsx) lists all CALL patients with urgency banding
- [x] `notifyPatient` skips SMS for `contact === "CALL"`; fires nurse-targeted browser notification with patient name + phone instead

## 10. Dashboard 811
- [x] Built — [/dashboard/811](src/app/dashboard/811/page.tsx) home with KPIs (total/active/orientés/refusés/avg wait + sparkline + recent calls) + [/dashboard/811/calls](src/app/dashboard/811/calls/page.tsx)
- [x] Orientation form at [/dashboard/811/new](src/app/dashboard/811/new/page.tsx): identité, secteur (location), tranche d'âge, symptômes multi-select, priorité CTAS, notes, hôpital fallback
- [x] Client-side `ranked` algorithm — filters CLINICS by `loadInitial < 0.95`, sorts by sector match then lowest load, slice top 4. Synchronous = instant (<5s). GMF/CLSC/IPS/UMF types covered in [data/clinics.ts](src/data/clinics.ts)
- [x] Recommendation panel: ranked clinic cards (load %, ETA, distance, next-slot, phone, hours, address) + "Recommandation prioritaire" badge on top result; selectable for `addReferral` linkage

## 11. Dashboard Directeur
- [x] Built — [/dashboard/direction](src/app/dashboard/direction/page.tsx) with per-hospital tabs (HMR/HND/HSC/HGM/Tous)
- [x] Live KPIs via `useFileSante` reactive store (WebSocket equivalent in this client demo)
- [x] Alerte patients > 3h — `overdue` list section with countdown + status; ranked by `registeredAt`
- [x] Hourly graphs — custom SVG `ChartRow` rendering inscriptions + arrivées over 12 buckets (6 sim hours); replaces Chart.js
- [x] `SavingsStrip` live (5h23 IEDM baseline, 85$/h RAMQ, 1200$/nuit civière); director report extends with 5-year projection
- [x] Director PDF report at [/dashboard/direction/report](src/app/dashboard/direction/report/page.tsx) — richer: volumes & flux, alertes >3h table, civières per-hospital breakdown, surge events log, économies (jour/annuel/5 ans), performance par hôpital comparison

## 12. Dashboard Provincial
- [x] Built — [/dashboard/msss](src/app/dashboard/msss/page.tsx) — vue provinciale 4 hôpitaux + ~58 cliniques
- [x] Aggregate stats computed live from `useFileSante` (no API needed in client demo): total/active/arrivés/no-show réseau + per-CIUSSS heatmap
- [x] Per-hospital row table (HMR/HND/HSC/HGM — inscrits, actifs, arrivés, no-show, attente moy.) + global KPI tiles
- [x] Network total savings via `SavingsStrip` (économies du jour + projection annuelle + temps gagné/patient + civières × 1200$); inputs = `provincial.confirmed` × `(323 − avgWaitMin)` + DISCHARGED civières
- [x] Bonus: `MultiLineChart` 12h inscriptions par hôpital, sector heatmap (12 secteurs), occupancy cards par hôpital

## 13. Délai confirmation ajustable
- [x] `setConfirmDelay(code, minutes)` store action (clamped 1-15) replaces `PATCH /api/hospitals/:code/settings` ([store.ts](src/lib/filesante/store.ts))
- [x] Persisted in `hospitalSettings[code].confirmDelayMin` (localStorage via store persist layer)
- [x] Non-retroactive: `notifyPatient` reads `getConfirmDelayMin(p.hospital)` at notify time only; already-notified patients keep their `confirmDeadlineAt`
- [x] UI: `ConfirmDelayCard` slider (1-15 min) on triage dashboard, scoped to bound hospital ([ConfirmDelayCard.tsx](src/components/dashboard/ConfirmDelayCard.tsx))

## 14. Reset démo
- [x] `store.resetDemo()` wipes state and reseeds 5 HMR patients exactly: Marie Tremblay / Fatima El-Amrani / Sophie Roy (P4), Jean Bouchard / Roger Lavoie (P5) — REGISTERED, askConfirmAt +30 min ([store.ts](src/lib/filesante/store.ts))
- [x] `triggerDemoNotify(code="HMR")` picks next REGISTERED via `pickNextForHospital` and fires `notifyPatient({manual:true})` → push notification + neutral SMS
- [x] UI: `DemoTools` widget on triage dashboard with "Test notify" + confirm-gated "Reset démo" buttons ([DemoTools.tsx](src/components/dashboard/DemoTools.tsx))

## 15. URLs production
- [ ] Deploy on `filesante-api-production-caf7.up.railway.app` — hosting step, out of repo scope
- [x] Routes available: `/`, `/dashboard/triage`, `/dashboard/811`, `/dashboard/direction`, `/dashboard/msss`, `/dashboard/patient`, `/health`; legacy `.html` aliases redirect via `next.config.ts` (`/dashboard.html` → `/dashboard/triage`, etc — permanent 308)
- [x] `/health` returns 200 OK JSON `{status:"ok"}` via [src/app/health/route.ts](src/app/health/route.ts) (GET + HEAD)

## 16. Base de données
- [ ] PostgreSQL 15 on Railway, SSL on — hosting/infra step, no backend in this Next.js client demo
- [x] In-memory schema = TypeScript types ([types.ts](src/lib/filesante/types.ts)) — `Patient`, `Civiere` (≈ `civiere_patients`), `Referral`, `SmsLog` (≈ `notifications`), `HospitalSettings` (≈ `hospitals_settings`), `SurgeEvent`, `ExpiryAlert`. Persisted via `localStorage` (key `filesante.store.v5`). `hospitals`, `users`, `daily_stats`, `migrations` would be added with a real DB
- [x] Roles enum: `Role = "nurse" | "director" | "admin" | "hotline_811" | "provincial"` ([types.ts](src/lib/filesante/types.ts))
- [x] Pseudonymized at creation: 4-digit `randomCode()` + opaque `newPatientId()` UUID-ish — no PII in identifiers ([store.ts](src/lib/filesante/store.ts))
- [x] Phone separate from medical data: `Patient.phone` distinct from `Patient.motif` field; `pseudonymizePhone()` helper for display
- [x] TTL cron: `engine.purgeExpired` runs every tick — terminal patients past `ttlAt` get PII redacted via `redactPatientPii`
- [x] Loi 25 consent gated at QR scan: `ActivationView` blocks queue join until checkbox accepted ([patient/page.tsx](src/app/dashboard/patient/page.tsx))

## Demo jeudi prep
- [ ] Run `POST /api/demo/reset`
- [ ] Open 5 dashboards in tabs
- [ ] Walk flow: triage → QR → notify → confirm
- [ ] Demo surge, civières, PDF reports
