# FileSanté Manual QA Workflow

End-to-end testing across all dashboards. Steps flow through related dashboards so cross-state links get verified together. Run in order — later steps depend on earlier registrations/referrals.

---

## A. Reset

1-Go to `/dashboard/admin` → click **Demo reset** → confirm state seeds back to 5 HMR patients.
2-Open DevTools → Application → LocalStorage → confirm `filesante.store.v5` exists and `filesante.triage.hospital` is empty/HMR.

---

## B. Triage full loop (Register → Queue → Scan → Patient portal → SMS)

1-Go to `/dashboard/triage` → check stat tiles render → set hospital filter to **HMR** (binding persists).
2-Click **Tout voir** → lands on `/dashboard/triage/queue` → confirm patients listed and HMR filter still applied.
3-Go to `/dashboard/triage/register` → fill name/phone, pick HMR + P5 + Sur place + SMS contact, check Law 25 → Submit → note the 4-digit code from success modal.
4-Back to `/dashboard/triage/queue` → switch to **Inscrits** tab → confirm new patient appears with REGISTERED status.
5-Click **Rappeler** action → patient moves to AWAITING_CONFIRMATION → tab switches show updated counts.
6-Go to `/dashboard/triage/sms` → search by phone → confirm SMS log entry for registration notification.
7-Go to `/dashboard/triage/scan` → enter 4-digit code → submit → success toast shows → patient flips to ARRIVED.
8-Open `/dashboard/patient` in new tab → enter same code → confirm timeline shows REGISTERED → AWAITING → CONFIRMED → ARRIVED with countdown and QR card.
9-On patient portal demo bar → toggle **Cancel** → status flips to LWBS → return to `/dashboard/triage/queue` **Fermés** tab → patient appears closed.

---

## C. Triage Call-mode patient (Register CALL → Calls → Confirm)

1-Go to `/dashboard/triage/register` → register new patient with **contact method = Appel** + P4 → submit.
2-Go to `/dashboard/triage/calls` → confirm patient appears under call list with phone link → click **Confirmé** → status becomes CONFIRMED.
3-Re-check `/dashboard/triage/queue` **Confirmés** tab → same patient listed.

---

## D. 811 hotline → Clinique → Patient destination

1-Go to `/dashboard/811/new` → fill name/phone + sector Plateau-Mont-Royal + P5 + symptoms + consent → confirm auto-ranked clinic list appears → submit.
2-Go to `/dashboard/811/calls` → **Actifs** tab → search by patient name → confirm new 811 call entry with origin HOME_811.
3-Go to `/dashboard/clinique/inbox` → **En attente** tab → confirm referral from HOTLINE_811 (blue chip) with SLA countdown.
4-Click **Accepter** on that referral → moves to **Acceptés** tab → check `/dashboard/clinique` overview → accepted count +1 and load % bumped.
5-Open `/dashboard/patient` → lookup with 811 patient code → destination card now shows accepted clinic name + hours.
6-Go to `/dashboard/811` overview → confirm Oriented count incremented and recent calls list updated.

---

## E. Triage → Clinique referral path (Refuse flow)

1-Register a P4 patient at `/dashboard/triage/register` with hospital HMR.
2-Go to `/dashboard/clinique/inbox` → find TRIAGE-source referral (red chip) → click **Refuser** → moves to **Refusés** tab.
3-Check `/dashboard/clinique` → refused count +1, accepted count unchanged.

---

## F. Civières (stretchers) + Direction alerts

1-Go to `/dashboard/triage/civieres` → click **Add Stretcher** modal → create stretcher #X with status AWAITING_RESULTS.
2-Click next-status button → AWAITING_RESULTS → RESULTS_IN → DECISION → DISCHARGED → stretcher moves to released history.
3-Confirm staff/availability counters on header update accordingly.
4-Go to `/dashboard/direction/alerts` → confirm civière-related alert appears in feed → dismiss one → it disappears.

---

## G. Clinique capacity tuning

1-Go to `/dashboard/clinique/capacity` → change daily capacity input to 30 → **Save** → capacity bar + remaining slots recalc.
2-Hourly bar chart shows distribution 08–19h → peak hour tile matches highest bar.

---

## H. Surge mode + Direction + Shift report

1-Go to `/dashboard/triage` → toggle **Surge Mode** modal → enable for HMR with +30 min.
2-`/dashboard/direction/alerts` → confirm surge alert pushed.
3-Go to `/dashboard/direction` → select hospital HMR → confirm overdue list, occupancy gauge, savings strip render.
4-Go to `/dashboard/direction/hourly` → switch hospital tab to HMR → dual-line chart (registrations vs arrivals) renders with current data.
5-Go to `/dashboard/triage` → click **Shift Report** link → opens `/dashboard/triage/report?hospital=HMR&nurse=...` → Print button works, savings formula visible.
6-Go to `/dashboard/direction/report` → switch hospital selector → surge events table includes surge from step 1.

---

## I. KPI / Analytics

1-Go to `/dashboard/triage/kpi` → confirm volume + funnel + outcome tiles reflect all patients created in earlier steps → Print works.
2-Go to `/dashboard/triage/analytics` → 12h hourly chart, donut, 7-day history table render → no-show rate matches kpi.

---

## J. MSSS provincial oversight

1-Go to `/dashboard/msss` → confirm aggregated counts > sum of single-hospital views, civière occupancy gauge system-wide.
2-Go to `/dashboard/msss/hospitals` → each hospital card (HMR/HND/HSC/HGM) shows stats + occupancy → click into HMR card link → routes to `/dashboard/direction` scoped to HMR.
3-Go to `/dashboard/msss/sectors` → sector load color coding (red >0.85, orange >0.65, green <0.65) renders correctly.

---

## K. Regression sweep

1-Hard refresh every dashboard route once → state rehydrates from localStorage, no flash of empty data.
2-`/dashboard/admin` → Demo reset → all earlier patients/referrals/civières gone → counters back to seed values.

---

## Notes

- Cross-state: `filesante.store.v5` is the single source — mutations in one tab propagate via store subscribers; open two tabs to verify live sync.
- Hospital binding sticky: changing hospital on `/dashboard/triage` persists across `/dashboard/triage/*` pages.
- Codes are 4 digits, numeric, auto-generated on register, reused as scan key + patient lookup key.
- 811 referrals carry 5-min SLA; triage referrals use default SLA — watch countdown color shift on `/dashboard/clinique/inbox`.
