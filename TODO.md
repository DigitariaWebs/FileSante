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
- [ ] Allow nurse to register phone-only patient (no QR)
- [ ] On turn → dashboard alert with `tel:` link instead of push
- [ ] No SMS auto-send required, nurse calls manually

## 10. Dashboard 811
- [ ] Build `/dashboard-811.html`
- [ ] Orientation form: symptoms, location, perceived urgency
- [ ] `POST /api/orient` → algo returns GMF/CLSC/IPS, <5s
- [ ] Output ranked recommendation to operator

## 11. Dashboard Directeur
- [ ] Build `/dashboard-director.html`
- [ ] `GET /api/hospitals/:code/stats` live KPIs via WebSocket
- [ ] Alert visuel patient wait >3h
- [ ] Chart.js hourly fréquentation graphs
- [ ] Live savings calc (5h23 baseline IEDM 2025, 85$/h, 1200$/nuit)
- [ ] Director PDF report (richer than shift report)

## 12. Dashboard Provincial
- [ ] Build `/dashboard-provincial.html`
- [ ] `GET /api/hospitals/all/admin-stats` aggregate
- [ ] Per-hospital row + global totals
- [ ] Network total savings figure

## 13. Délai confirmation ajustable
- [ ] `PATCH /api/hospitals/:code/settings` → `confirm_delay` 1–15 min
- [ ] Persist in `hospitals.confirm_delay`
- [ ] Apply non-retroactively to next notifications

## 14. Reset démo
- [ ] `POST /api/demo/reset` → wipe demo data, seed 5 patients HMR (Marie, Fatima, Sophie P4; Jean, Roger P5)
- [ ] `POST /api/demo/trigger-notify` for manual push+SMS test

## 15. URLs production
- [ ] Deploy on `filesante-api-production-caf7.up.railway.app`
- [ ] Routes: `/`, `/dashboard.html`, `/dashboard-811.html`, `/dashboard-director.html`, `/dashboard-provincial.html`, `/patient.html`, `/health`
- [ ] `/health` returns 200 OK

## 16. Base de données
- [ ] PostgreSQL 15 on Railway, SSL on
- [ ] Tables: `hospitals`, `patients`, `users`, `civiere_patients`, `daily_stats`, `migrations`, `notifications`, `hospitals_settings`
- [ ] Roles enum: nurse/director/admin/811/provincial
- [ ] Pseudonymize token at creation
- [ ] Phone column separate from medical data
- [ ] Cron TTL: wipe personal data 24h post-visite
- [ ] Loi 25 consent gate at QR scan

## Demo jeudi prep
- [ ] Run `POST /api/demo/reset`
- [ ] Open 5 dashboards in tabs
- [ ] Walk flow: triage → QR → notify → confirm
- [ ] Demo surge, civières, PDF reports
