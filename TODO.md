# FileSanté — TODO

## 1. Inscription patient triage
- [ ] Build `/dashboard.html` triage page, nurse role login, localStorage hospital binding
- [ ] Form: name, priority (P4/P5), motif → `POST /api/patients`
- [ ] Auto-generate anonymized token + UUID server-side
- [ ] Render QR code with `/patient.html?token=XXXXX`
- [ ] Insert patient row: status `waiting`, no phone yet
- [ ] Push patient into queue display immediately

## 2. Activation QR patient
- [ ] Build `/patient.html?token=` route
- [ ] Consent screen (Loi 25)
- [ ] Phone input, Canadian format
- [ ] `POST /api/patients/:token/activate` → pseudonymize phone, set 24h TTL
- [ ] 3-state waiting UI: waiting / notified / confirm
- [ ] "no-QR" fallback screen on invalid token
- [ ] No ETA shown to patient (design lock)

## 3. File attente virtuelle
- [ ] `GET /api/hospitals/:code/queue` → sort P4 before P5, FIFO within group
- [ ] WebSocket `/ws?hospital=&type=dashboard` broadcast on add/notify/confirm/delete
- [ ] `src/jobs/scheduler.js` node-cron: next-up detection, confirm expiry, 24h TTL purge

## 4. Notification + rappel
- [ ] Scheduler picks next patient per P4/P5 + FIFO
- [ ] Web Push API → Amber Alert sound + vibration via Service Worker (PWA)
- [ ] Twilio SMS backup, neutral message, no medical detail (`src/services/SmsService.js`)
- [ ] Patient status → `notified`, start confirm timer
- [ ] Manual notify: `POST /api/patients/:id/notify` + "Rappelé manuellement" badge

## 5. Confirmation retour
- [ ] Patient UI: "Je reviens" button on notify
- [ ] Confirm → status `confirmed`
- [ ] Expiry job → status `expired`, dashboard alert
- [ ] Honor per-hospital `confirm_delay` (1–15 min)

## 6. Civières
- [ ] Civières section on triage dashboard
- [ ] Assign patient → civiere_num + reason, status `Occupée`
- [ ] Status transitions: Occupée → Résultats signalés → Décision médicale → Libérée
- [ ] Timestamp each transition
- [ ] Compute occupancy rate live for director/provincial KPIs
- [ ] Table `civiere_patients` schema

## 7. Surge button
- [ ] `POST /api/hospitals/:code/surge` with +15/+30/+45
- [ ] Suspend all notifications during surge window
- [ ] Recalc internal ETAs
- [ ] Twilio SMS broadcast to affected patients, neutral wording
- [ ] Auto-resume after delay

## 8. Rapport quart PDF
- [ ] `GET /api/hospitals/:code/report` → pdfkit generation
- [ ] Manual download button on dashboard
- [ ] Auto-generate on shift change, header = outgoing nurse name
- [ ] Content: P4/P5 counts, avg wait, civières occupied/freed, surge events, notifs sent, $ saved (85$/h RAMQ, 1200$/nuit)

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
