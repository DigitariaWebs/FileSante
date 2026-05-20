"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo } from "react";

import { Icon } from "@/components/ui/Icon";
import { useFileSante } from "@/hooks/useFileSante";
import {
  getCivieresOccupancyAll,
  getCivieresOccupancyByHospital,
  isActive,
} from "@/lib/filesante/store";
import type { HospitalCode, Patient } from "@/lib/filesante/types";

const MIN = 60_000;
const RAMQ_HOURLY = 85;
const CIVIERE_NIGHT = 1200;
const IEDM_BASELINE_MIN = 323; // 5h23
const ALL_HOSPITALS: HospitalCode[] = ["HMR", "HND", "HSC", "HGM"];

const HOSPITAL_LABEL: Record<HospitalCode, string> = {
  HMR: "Hôpital Maisonneuve-Rosemont",
  HND: "Hôpital Notre-Dame",
  HSC: "Hôpital du Sacré-Cœur",
  HGM: "Hôpital général de Montréal",
};

function fmtMin(n: number) {
  const h = Math.floor(n / 60);
  const m = Math.round(n % 60);
  return h > 0 ? `${h}h${m.toString().padStart(2, "0")}` : `${m} min`;
}

function fmtCAD(n: number) {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtDuration(ms: number) {
  return fmtMin(Math.max(0, Math.round(ms / MIN)));
}

export default function DirectorReportPage() {
  return (
    <Suspense fallback={null}>
      <DirectorReportInner />
    </Suspense>
  );
}

function DirectorReportInner() {
  const s = useFileSante();
  const params = useSearchParams();
  const hospitalParam = params.get("hospital");
  const hospital: HospitalCode | "ALL" =
    hospitalParam && (ALL_HOSPITALS as string[]).includes(hospitalParam)
      ? (hospitalParam as HospitalCode)
      : "ALL";
  const autoPrint = params.get("autoprint") === "1";

  useEffect(() => {
    if (autoPrint && typeof window !== "undefined") {
      const t = window.setTimeout(() => window.print(), 400);
      return () => window.clearTimeout(t);
    }
  }, [autoPrint]);

  const scoped = useMemo(
    () =>
      hospital === "ALL"
        ? s.patients
        : s.patients.filter((p) => p.hospital === hospital),
    [s.patients, hospital],
  );

  const report = useMemo(() => buildReport(scoped, hospital, s), [scoped, hospital, s]);

  return (
    <>
      <style jsx global>{`
        @media print {
          [data-report-hide] {
            display: none !important;
          }
          .fs-dash-page,
          body {
            background: #fff !important;
          }
        }
        @page {
          margin: 16mm 14mm;
        }
      `}</style>

      <div
        data-report-hide
        className="flex items-center justify-between gap-3 border-b border-[var(--ap-hairline)] bg-[var(--ap-canvas-parchment)] px-10 py-4"
      >
        <Link
          href="/dashboard/direction"
          className="fs-btn fs-btn-pearl fs-btn-sm"
        >
          ← Retour
        </Link>
        <div className="text-[12.5px] text-[var(--ap-ink-muted-80)]">
          Rapport directeur — utilisez « Imprimer » du navigateur pour PDF.
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="fs-btn fs-btn-primary fs-btn-sm"
        >
          <Icon name="archive" size={13} />
          Imprimer / PDF
        </button>
      </div>

      <article className="mx-auto max-w-[920px] px-10 py-10 text-[var(--ap-ink)]">
        <header className="border-b border-[var(--ap-hairline)] pb-5">
          <div className="fs-eyebrow">Rapport direction · FileSanté</div>
          <h1 className="fs-display-md mt-2 text-[28px]!">
            {hospital === "ALL" ? "Réseau · 4 établissements" : HOSPITAL_LABEL[hospital]}
          </h1>
          <div className="mt-2 grid gap-1 text-[13px] text-[var(--ap-ink-muted-80)] sm:grid-cols-2">
            <div>
              <b className="text-[var(--ap-ink)]">Périmètre :</b>{" "}
              {hospital === "ALL"
                ? "Tous les hôpitaux (HMR · HND · HSC · HGM)"
                : `${hospital} — ${HOSPITAL_LABEL[hospital]}`}
            </div>
            <div>
              <b className="text-[var(--ap-ink)]">Édité :</b>{" "}
              {new Date().toLocaleString("fr-CA")}
            </div>
            <div>
              <b className="text-[var(--ap-ink)]">Effectif clinique :</b>{" "}
              {s.staff.nurses} infirmières · {s.staff.doctors} médecins
            </div>
            <div>
              <b className="text-[var(--ap-ink)]">Quart :</b>{" "}
              {s.staff.shiftLabel}
            </div>
          </div>
        </header>

        <Section title="Volumes & flux">
          <Grid>
            <Stat label="Inscrits cumulés" value={report.total} />
            <Stat label="Actifs maintenant" value={report.activeNow} />
            <Stat label="P4 / P5" value={`${report.p4} / ${report.p5}`} />
            <Stat
              label="Taux d'acceptation"
              value={`${report.acceptanceRate}%`}
              hint={`${report.confirmed} confirmés / ${report.total}`}
            />
            <Stat
              label="LWBS + No-show"
              value={report.noShow + s.lwbs}
              hint={`${report.noShow} no-show · ${s.lwbs} LWBS`}
            />
            <Stat label="Annulés" value={report.cancelled} />
            <Stat label="Notifications envoyées" value={report.notifsSent} />
            <Stat label="Attente moyenne" value={fmtMin(report.avgWaitMin)} />
          </Grid>
        </Section>

        <Section title="Alertes patients > 3h">
          {report.overdue.length === 0 ? (
            <p className="text-[13px] text-[var(--ap-ink-muted-80)]">
              Aucune attente excessive. Bon respect des cibles.
            </p>
          ) : (
            <table className="fs-dash-table w-full text-[13px]">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Priorité</th>
                  <th>Hôpital</th>
                  <th>Attente</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {report.overdue.slice(0, 20).map((p) => {
                  const waitMin = Math.floor(
                    (s.simClock - p.registeredAt) / MIN,
                  );
                  return (
                    <tr key={p.id}>
                      <td>
                        {p.firstName} {p.lastName}
                      </td>
                      <td>{p.priority}</td>
                      <td>{p.hospital}</td>
                      <td className="font-mono tabular-nums text-[#c8102e]">
                        {Math.floor(waitMin / 60)}h
                        {(waitMin % 60).toString().padStart(2, "0")}
                      </td>
                      <td>{p.status}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Section>

        <Section title="Civières & capacité">
          <Grid>
            <Stat
              label="Disponibles réseau"
              value={`${s.staff.civieresAvail}/${s.staff.civieresTotal}`}
            />
            <Stat
              label="Taux d'occupation réseau"
              value={`${Math.round(getCivieresOccupancyAll().rate * 100)}%`}
            />
            <Stat
              label="Civières libérées (session)"
              value={report.civieresFreed}
            />
            <Stat
              label="Civières occupées"
              value={report.civieresOccupied}
            />
          </Grid>
          {hospital === "ALL" && (
            <table className="fs-dash-table mt-4 w-full text-[13px]">
              <thead>
                <tr>
                  <th>Hôpital</th>
                  <th>Occupées</th>
                  <th>Cible</th>
                  <th>Taux</th>
                </tr>
              </thead>
              <tbody>
                {ALL_HOSPITALS.map((h) => {
                  const o = getCivieresOccupancyByHospital(h);
                  return (
                    <tr key={h}>
                      <td className="font-semibold">{h}</td>
                      <td className="font-mono tabular-nums">{o.occupied}</td>
                      <td className="font-mono tabular-nums">{o.total}</td>
                      <td className="font-mono tabular-nums">
                        {Math.round(o.rate * 100)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Section>

        <Section title="Événements de surcharge">
          {report.surgeEvents.length === 0 ? (
            <p className="text-[13px] text-[var(--ap-ink-muted-80)]">
              Aucune surcharge enregistrée sur ce périmètre.
            </p>
          ) : (
            <table className="fs-dash-table w-full text-[13px]">
              <thead>
                <tr>
                  <th>Hôpital</th>
                  <th>Délai</th>
                  <th>Début</th>
                  <th>Durée</th>
                  <th>État</th>
                </tr>
              </thead>
              <tbody>
                {report.surgeEvents.map((e) => (
                  <tr key={e.id}>
                    <td>{e.hospital}</td>
                    <td>+{e.minutes} min</td>
                    <td className="font-mono tabular-nums">
                      il y a {fmtDuration(s.simClock - e.startedAt)}
                    </td>
                    <td className="font-mono tabular-nums">
                      {e.endedAt !== null
                        ? fmtDuration(e.endedAt - e.startedAt)
                        : "en cours"}
                    </td>
                    <td>{e.endedAt !== null ? "Levée" : "Active"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>

        <Section title="Économies — méthodologie IEDM">
          <Grid>
            <Stat
              label="Économies du jour"
              value={fmtCAD(report.savings.daily)}
              hint="RAMQ + civières libérées"
            />
            <Stat
              label="Projection annuelle"
              value={fmtCAD(report.savings.annual)}
              hint="× 365"
            />
            <Stat
              label="Projection 5 ans"
              value={fmtCAD(report.savings.annual * 5)}
            />
            <Stat
              label="Temps gagné / patient"
              value={`${Math.round(report.savings.minSavedPerPatient)} min`}
              hint={`baseline IEDM ${IEDM_BASELINE_MIN} min (5h23)`}
            />
          </Grid>
          <p className="mt-3 text-[12px] text-[var(--ap-ink-muted-80)]">
            Formule : patients confirmés × (323 − attente moyenne) ÷ 60 ×{" "}
            {RAMQ_HOURLY} $/h + civières libérées × {CIVIERE_NIGHT} $ (nuitée).
            Baseline IEDM 2025 : temps médian d'attente avant FileSanté = 5h23.
          </p>
        </Section>

        {hospital === "ALL" && (
          <Section title="Performance par hôpital">
            <table className="fs-dash-table w-full text-[13px]">
              <thead>
                <tr>
                  <th>Hôpital</th>
                  <th>Inscrits</th>
                  <th>Actifs</th>
                  <th>Confirmés</th>
                  <th>No-show</th>
                  <th>Att. moyenne</th>
                </tr>
              </thead>
              <tbody>
                {ALL_HOSPITALS.map((h) => {
                  const rec = perHospitalSummary(s.patients, h);
                  return (
                    <tr key={h}>
                      <td className="font-semibold">{h}</td>
                      <td className="font-mono tabular-nums">{rec.total}</td>
                      <td className="font-mono tabular-nums">{rec.active}</td>
                      <td className="font-mono tabular-nums">
                        {rec.confirmed}
                      </td>
                      <td className="font-mono tabular-nums">{rec.noShow}</td>
                      <td className="font-mono tabular-nums">
                        {fmtMin(rec.avgWaitMin)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Section>
        )}

        <footer className="mt-10 border-t border-[var(--ap-hairline)] pt-4 text-[11.5px] text-[var(--ap-ink-muted-48)]">
          Rapport agrégé — sans PII. Loi 25 : données opérationnelles
          anonymisées 24 h post-visite.
        </footer>
      </article>
    </>
  );
}

function buildReport(
  scoped: Patient[],
  hospital: HospitalCode | "ALL",
  s: ReturnType<typeof useFileSante>,
) {
  const total = scoped.length;
  const activeNow = scoped.filter(isActive).length;
  const p4 = scoped.filter((p) => p.priority === "P4").length;
  const p5 = scoped.filter((p) => p.priority === "P5").length;
  const confirmed = scoped.filter(
    (p) =>
      p.status === "CONFIRMED" ||
      p.status === "ARRIVED" ||
      p.status === "COMPLETED",
  ).length;
  const noShow = scoped.filter((p) => p.status === "NO_SHOW").length;
  const cancelled = scoped.filter(
    (p) =>
      p.status === "CANCELLED_BY_PATIENT" || p.status === "NO_RESPONSE",
  ).length;
  const notifsSent = scoped.filter((p) => p.notifiedAt !== null).length;

  const arrivedWith = scoped.filter(
    (p) =>
      (p.status === "ARRIVED" || p.status === "COMPLETED") && p.arrivedAt,
  );
  const avgWaitMin =
    arrivedWith.length > 0
      ? arrivedWith.reduce(
          (sum, p) => sum + (p.arrivedAt! - p.registeredAt) / MIN,
          0,
        ) / arrivedWith.length
      : 0;

  const acceptanceRate =
    total > 0 ? Math.round((confirmed / total) * 100) : 0;

  const THREE_H = 3 * 60 * MIN;
  const overdue = scoped
    .filter((p) => isActive(p) && s.simClock - p.registeredAt > THREE_H)
    .sort((a, b) => a.registeredAt - b.registeredAt);

  const civScope = (c: { hospital: HospitalCode; status: string }) =>
    hospital === "ALL" || c.hospital === hospital;
  const civieresFreed = s.civieres.filter(
    (c) => civScope(c) && c.status === "DISCHARGED",
  ).length;
  const civieresOccupied = s.civieres.filter(
    (c) => civScope(c) && c.status !== "DISCHARGED",
  ).length;

  const surgeEvents = s.surgeEvents
    .filter((e) => hospital === "ALL" || e.hospital === hospital)
    .sort((a, b) => b.startedAt - a.startedAt)
    .slice(0, 25);

  const minSavedPerPatient = Math.max(0, IEDM_BASELINE_MIN - avgWaitMin);
  const ramqSavings = confirmed * (minSavedPerPatient / 60) * RAMQ_HOURLY;
  const civSavings = civieresFreed * CIVIERE_NIGHT;
  const daily = ramqSavings + civSavings;
  const annual = daily * 365;

  return {
    total,
    activeNow,
    p4,
    p5,
    confirmed,
    noShow,
    cancelled,
    notifsSent,
    avgWaitMin,
    acceptanceRate,
    overdue,
    civieresFreed,
    civieresOccupied,
    surgeEvents,
    savings: {
      minSavedPerPatient,
      ramqSavings,
      civSavings,
      daily,
      annual,
    },
  };
}

function perHospitalSummary(patients: Patient[], code: HospitalCode) {
  const scoped = patients.filter((p) => p.hospital === code);
  const total = scoped.length;
  const active = scoped.filter(isActive).length;
  const confirmed = scoped.filter(
    (p) =>
      p.status === "CONFIRMED" ||
      p.status === "ARRIVED" ||
      p.status === "COMPLETED",
  ).length;
  const noShow = scoped.filter((p) => p.status === "NO_SHOW").length;
  const arrivedWith = scoped.filter(
    (p) =>
      (p.status === "ARRIVED" || p.status === "COMPLETED") && p.arrivedAt,
  );
  const avgWaitMin =
    arrivedWith.length > 0
      ? arrivedWith.reduce(
          (sum, p) => sum + (p.arrivedAt! - p.registeredAt) / MIN,
          0,
        ) / arrivedWith.length
      : 0;
  return { total, active, confirmed, noShow, avgWaitMin };
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6">
      <h2 className="fs-tagline text-[18px]!">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {children}
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-[var(--ap-hairline)] bg-[var(--ap-canvas-parchment)] px-3 py-2.5">
      <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--ap-ink-muted-48)]">
        {label}
      </div>
      <div className="mt-1 font-mono text-[20px] font-semibold tabular-nums text-[var(--ap-ink)]">
        {value}
      </div>
      {hint && (
        <div className="mt-0.5 text-[11px] text-[var(--ap-ink-muted-80)]">
          {hint}
        </div>
      )}
    </div>
  );
}
