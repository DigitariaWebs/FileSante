"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo } from "react";

import { Icon } from "@/components/ui/Icon";
import { useFileSante } from "@/hooks/useFileSante";
import { isActive } from "@/lib/filesante/store";
import type { HospitalCode, Patient } from "@/lib/filesante/types";
import {
  dataTable,
  downloadPdf,
  nowStamp,
  paragraph,
  reportHeader,
  sectionTitle,
  statTiles,
} from "@/lib/pdf/export";

const MIN = 60_000;
const HOUR = 60 * MIN;
const RAMQ_HOURLY = 85;
const CIVIERE_NIGHT = 1200;
const IEDM_BASELINE_MIN = 323;
const VALID_HOSPITALS: HospitalCode[] = ["HMR", "HND", "HSC", "HGM"];

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
  const totalMin = Math.max(0, Math.round(ms / MIN));
  return fmtMin(totalMin);
}

export default function ShiftReportPage() {
  return (
    <Suspense fallback={null}>
      <ShiftReportInner />
    </Suspense>
  );
}

function ShiftReportInner() {
  const s = useFileSante();
  const params = useSearchParams();
  const hospital = (() => {
    const q = params.get("hospital");
    return q && (VALID_HOSPITALS as string[]).includes(q)
      ? (q as HospitalCode)
      : "HMR";
  })();
  const autoPrint = params.get("autoprint") === "1";
  const outgoingNurseName = params.get("nurse") ?? "—";

  const report = useMemo(
    () => buildReport(s.patients, hospital, s),
    [s, hospital],
  );

  const triggerDownload = useMemo(
    () => () =>
      exportTriageReportPdf({
        hospital,
        outgoingNurseName,
        shiftLabel: s.staff.shiftLabel,
        fallbackNurse: `${s.nurseShift.firstName} ${s.nurseShift.lastName}`,
        report,
        civAvail: s.staff.civieresAvail,
        civTotal: s.staff.civieresTotal,
        simClock: s.simClock,
      }),
    [hospital, outgoingNurseName, report, s.staff, s.nurseShift, s.simClock],
  );

  useEffect(() => {
    if (autoPrint && typeof window !== "undefined") {
      const t = window.setTimeout(triggerDownload, 250);
      return () => window.clearTimeout(t);
    }
  }, [autoPrint, triggerDownload]);

  return (
    <>
      <style jsx global>{`
        @media print {
          /* Hide app chrome and only print the report content. */
          [data-report-hide] {
            display: none !important;
          }
          .fs-dash-page {
            background: #fff !important;
          }
          body {
            background: #fff !important;
          }
        }
        @page {
          margin: 18mm 16mm;
        }
      `}</style>

      <div
        data-report-hide
        className="flex items-center justify-between gap-3 border-b border-[var(--ap-hairline)] bg-[var(--ap-canvas-parchment)] px-10 py-4"
      >
        <Link
          href="/dashboard/triage"
          className="fs-btn fs-btn-pearl fs-btn-sm"
        >
          ← Retour
        </Link>
        <div className="text-[12.5px] text-[var(--ap-ink-muted-80)]">
          Aperçu rapport — téléchargez la version PDF pour archivage.
        </div>
        <button
          type="button"
          onClick={triggerDownload}
          className="fs-btn fs-btn-primary fs-btn-sm"
        >
          <Icon name="archive" size={13} />
          Télécharger PDF
        </button>
      </div>

      <article className="mx-auto max-w-[860px] px-10 py-10 text-[var(--ap-ink)]">
        <header className="border-b border-[var(--ap-hairline)] pb-5">
          <div className="fs-eyebrow">Rapport de quart · FileSanté</div>
          <h1 className="fs-display-md mt-2 text-[28px]!">
            {HOSPITAL_LABEL[hospital]}
          </h1>
          <div className="mt-2 grid gap-1 text-[13px] text-[var(--ap-ink-muted-80)] sm:grid-cols-2">
            <div>
              <b className="text-[var(--ap-ink)]">Infirmière sortante :</b>{" "}
              {outgoingNurseName !== "—"
                ? outgoingNurseName
                : `${s.nurseShift.firstName} ${s.nurseShift.lastName}`}
            </div>
            <div>
              <b className="text-[var(--ap-ink)]">Édité :</b>{" "}
              {new Date().toLocaleString("fr-CA")}
            </div>
            <div>
              <b className="text-[var(--ap-ink)]">Quart :</b>{" "}
              {s.staff.shiftLabel}
            </div>
            <div>
              <b className="text-[var(--ap-ink)]">Code hôpital :</b> {hospital}
            </div>
          </div>
        </header>

        <Section title="Volume des inscriptions">
          <Grid>
            <Stat label="Patients P4" value={report.p4Count} />
            <Stat label="Patients P5" value={report.p5Count} />
            <Stat label="Total session" value={report.total} />
            <Stat
              label="Active en fin de quart"
              value={report.stillActive}
              hint="Transmis au quart entrant"
            />
          </Grid>
        </Section>

        <Section title="Temps & flux">
          <Grid>
            <Stat label="Attente moyenne" value={fmtMin(report.avgWaitMin)} />
            <Stat label="Attente médiane" value={fmtMin(report.medWaitMin)} />
            <Stat
              label="Notifications envoyées"
              value={report.notifsSent}
              hint={`dont ${report.manualNotifs} déclenchées manuellement`}
            />
            <Stat
              label="Confirmés / Annulés"
              value={`${report.confirmed} / ${report.cancelled}`}
            />
            <Stat
              label="Non-réponse / Non-présentation"
              value={`${report.noResponse} / ${report.noShow}`}
              hint="Place libérée"
            />
            <Stat
              label="Arrivés au triage retour"
              value={report.arrived}
            />
          </Grid>
        </Section>

        <Section title="Civières">
          <Grid>
            <Stat
              label="Disponibles (fin de quart)"
              value={`${s.staff.civieresAvail}/${s.staff.civieresTotal}`}
            />
            <Stat label="Occupées" value={report.civieresOccupied} />
            <Stat label="Libérées (session)" value={report.civieresFreed} />
            <Stat
              label="Taux d'occupation"
              value={`${Math.round(((s.staff.civieresTotal - s.staff.civieresAvail) / Math.max(1, s.staff.civieresTotal)) * 100)}%`}
            />
          </Grid>
        </Section>

        <Section title="Événements de surcharge">
          {report.surgeEvents.length === 0 ? (
            <p className="text-[13px] text-[var(--ap-ink-muted-80)]">
              Aucune surcharge déclenchée durant le quart.
            </p>
          ) : (
            <table className="fs-dash-table w-full text-[13px]">
              <thead>
                <tr>
                  <th>Début</th>
                  <th>Délai</th>
                  <th>Durée effective</th>
                  <th>État</th>
                </tr>
              </thead>
              <tbody>
                {report.surgeEvents.map((e) => (
                  <tr key={e.id}>
                    <td className="font-mono tabular-nums">
                      {fmtSimMin(e.startedAt, s.simClock)}
                    </td>
                    <td>+{e.minutes} min</td>
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

        <Section title="Économies estimées">
          <Grid>
            <Stat
              label="Économies du jour"
              value={fmtCAD(report.savings.daily)}
              hint="RAMQ + civières libérées"
            />
            <Stat
              label="Projection annuelle"
              value={fmtCAD(report.savings.annual)}
              hint="Extrapolation 365 jours"
            />
            <Stat
              label="Temps gagné / patient"
              value={`${Math.round(report.savings.minSavedPerPatient)} min`}
              hint={`vs baseline IEDM ${IEDM_BASELINE_MIN} min`}
            />
            <Stat
              label="Civières × 1 200 $"
              value={fmtCAD(report.savings.civSavings)}
            />
          </Grid>
          <p className="mt-3 text-[12px] text-[var(--ap-ink-muted-80)]">
            Méthodologie : patients confirmés × (323 − attente moyenne) ÷ 60 ×{" "}
            {RAMQ_HOURLY} $/h + civières libérées × {CIVIERE_NIGHT} $.
          </p>
        </Section>

        <footer className="mt-10 border-t border-[var(--ap-hairline)] pt-4 text-[11.5px] text-[var(--ap-ink-muted-48)]">
          Rapport généré côté client — aucune donnée PII transmise. Conserver
          24h max selon politique Loi 25.
        </footer>
      </article>
    </>
  );
}

function fmtSimMin(simMs: number, nowSim: number): string {
  // Best-effort: show as "il y a Xh Ym".
  const ago = Math.max(0, nowSim - simMs);
  return `il y a ${fmtDuration(ago)}`;
}

function buildReport(
  patients: Patient[],
  hospital: HospitalCode,
  s: ReturnType<typeof useFileSante>,
) {
  const scoped = patients.filter((p) => p.hospital === hospital);
  const p4Count = scoped.filter((p) => p.priority === "P4").length;
  const p5Count = scoped.filter((p) => p.priority === "P5").length;
  const stillActive = scoped.filter(isActive).length;
  const confirmed = scoped.filter(
    (p) =>
      p.status === "CONFIRMED" ||
      p.status === "ARRIVED" ||
      p.status === "COMPLETED",
  ).length;
  const cancelled = scoped.filter(
    (p) => p.status === "CANCELLED_BY_PATIENT",
  ).length;
  const noResponse = scoped.filter((p) => p.status === "NO_RESPONSE").length;
  const noShow = scoped.filter((p) => p.status === "NO_SHOW").length;
  const arrived = scoped.filter(
    (p) => p.status === "ARRIVED" || p.status === "COMPLETED",
  ).length;
  const notifsSent = scoped.filter((p) => p.notifiedAt !== null).length;
  const manualNotifs = scoped.filter((p) => p.manualNotify).length;

  // Wait in minutes: notifiedAt-registeredAt for notified patients.
  const waitMins = scoped
    .filter((p) => p.notifiedAt !== null)
    .map((p) => Math.max(0, ((p.notifiedAt as number) - p.registeredAt) / MIN));
  const avgWaitMin =
    waitMins.length === 0
      ? 0
      : waitMins.reduce((a, b) => a + b, 0) / waitMins.length;
  const medWaitMin = (() => {
    if (waitMins.length === 0) return 0;
    const sorted = [...waitMins].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  })();

  const civieresFreed = s.civieres.filter(
    (c) => c.hospital === hospital && c.status === "DISCHARGED",
  ).length;
  const civieresOccupied = s.civieres.filter(
    (c) => c.hospital === hospital && c.status !== "DISCHARGED",
  ).length;

  const surgeEvents = s.surgeEvents
    .filter((e) => e.hospital === hospital)
    .sort((a, b) => b.startedAt - a.startedAt)
    .slice(0, 20);

  // Savings: same formula as SavingsStrip but scoped to confirmed patients.
  const minSavedPerPatient = Math.max(0, IEDM_BASELINE_MIN - avgWaitMin);
  const timePerPatientH = minSavedPerPatient / 60;
  const ramqSavings = confirmed * timePerPatientH * RAMQ_HOURLY;
  const civSavings = civieresFreed * CIVIERE_NIGHT;
  const daily = ramqSavings + civSavings;
  const annual = daily * 365;

  return {
    p4Count,
    p5Count,
    total: scoped.length,
    stillActive,
    confirmed,
    cancelled,
    noResponse,
    noShow,
    arrived,
    notifsSent,
    manualNotifs,
    avgWaitMin,
    medWaitMin,
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

type TriageReport = ReturnType<typeof buildReport>;

async function exportTriageReportPdf(args: {
  hospital: HospitalCode;
  outgoingNurseName: string;
  shiftLabel: string;
  fallbackNurse: string;
  report: TriageReport;
  civAvail: number;
  civTotal: number;
  simClock: number;
}) {
  const { hospital, outgoingNurseName, shiftLabel, fallbackNurse, report, civAvail, civTotal, simClock } = args;
  const occupancyPct = Math.round(
    ((civTotal - civAvail) / Math.max(1, civTotal)) * 100,
  );
  await downloadPdf({
    filename: `filesante-rapport-quart-${hospital}-${nowStamp()}.pdf`,
    content: [
      ...reportHeader({
        eyebrow: "Rapport de quart · FileSanté",
        title: HOSPITAL_LABEL[hospital],
        metadata: [
          {
            label: "Infirmière sortante",
            value: outgoingNurseName !== "—" ? outgoingNurseName : fallbackNurse,
          },
          { label: "Édité", value: new Date().toLocaleString("fr-CA") },
          { label: "Quart", value: shiftLabel },
          { label: "Code hôpital", value: hospital },
        ],
      }),
      sectionTitle("Volume des inscriptions"),
      statTiles([
        { label: "Patients P4", value: report.p4Count },
        { label: "Patients P5", value: report.p5Count },
        { label: "Total session", value: report.total },
        {
          label: "Active fin de quart",
          value: report.stillActive,
          hint: "Transmis au quart entrant",
        },
      ]),
      sectionTitle("Temps & flux"),
      statTiles([
        { label: "Attente moyenne", value: fmtMin(report.avgWaitMin) },
        { label: "Attente médiane", value: fmtMin(report.medWaitMin) },
        {
          label: "Notifications envoyées",
          value: report.notifsSent,
          hint: `dont ${report.manualNotifs} manuelles`,
        },
        {
          label: "Confirmés / Annulés",
          value: `${report.confirmed} / ${report.cancelled}`,
        },
        {
          label: "Sans réponse / No-show",
          value: `${report.noResponse} / ${report.noShow}`,
        },
        { label: "Arrivés triage retour", value: report.arrived },
      ]),
      sectionTitle("Civières"),
      statTiles([
        {
          label: "Disponibles fin de quart",
          value: `${civAvail}/${civTotal}`,
        },
        { label: "Occupées", value: report.civieresOccupied },
        { label: "Libérées (session)", value: report.civieresFreed },
        { label: "Taux d'occupation", value: `${occupancyPct}%` },
      ]),
      sectionTitle("Événements de surcharge"),
      dataTable(
        report.surgeEvents,
        [
          {
            header: "Début",
            width: 80,
            render: (e) => fmtSimMin(e.startedAt, simClock),
          },
          { header: "Délai", width: 60, render: (e) => `+${e.minutes} min` },
          {
            header: "Durée effective",
            width: 90,
            render: (e) =>
              e.endedAt !== null ? fmtDuration(e.endedAt - e.startedAt) : "en cours",
          },
          {
            header: "État",
            width: "*",
            render: (e) => (e.endedAt !== null ? "Levée" : "Active"),
          },
        ],
        { emptyText: "Aucune surcharge déclenchée durant le quart." },
      ),
      sectionTitle("Économies estimées"),
      statTiles([
        {
          label: "Économies du jour",
          value: fmtCAD(report.savings.daily),
          hint: "RAMQ + civières",
          tone: "success",
        },
        {
          label: "Projection annuelle",
          value: fmtCAD(report.savings.annual),
          hint: "× 365",
        },
        {
          label: "Temps gagné / patient",
          value: `${Math.round(report.savings.minSavedPerPatient)} min`,
          hint: `baseline IEDM ${IEDM_BASELINE_MIN} min`,
        },
        {
          label: "Civières × 1 200 $",
          value: fmtCAD(report.savings.civSavings),
        },
      ]),
      paragraph(
        `Méthodologie : patients confirmés × (323 − attente moyenne) ÷ 60 × ${RAMQ_HOURLY} $/h + civières libérées × ${CIVIERE_NIGHT} $.`,
        { muted: true },
      ),
      paragraph(
        "Rapport généré côté client — aucune donnée PII transmise. Conserver 24h max selon politique Loi 25.",
        { muted: true },
      ),
    ],
  });
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
