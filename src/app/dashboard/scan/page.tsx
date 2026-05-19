"use client";

import { useState } from "react";

import { Topbar } from "@/components/dashboard/Topbar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { markArrived } from "@/lib/filesante/store";

type Result =
  | { ok: true; name: string; code: string; hospital: string }
  | { ok: false; reason: string };

export default function ScanPage() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    // Accept either raw 4-digit code or QR payload "filesante:<id>:<code>"
    const parsed = trimmed.startsWith("filesante:")
      ? trimmed.split(":")[2] ?? trimmed
      : trimmed;
    const r = markArrived(parsed);
    if (r.ok) {
      setResult({
        ok: true,
        name: `${r.patient.firstName} ${r.patient.lastName}`,
        code: r.patient.code,
        hospital: r.patient.hospital,
      });
      setCode("");
    } else {
      setResult({ ok: false, reason: r.reason });
    }
  }

  return (
    <>
      <Topbar title="Retour patient · scan / code" />
      <div className="px-8 py-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <form
            onSubmit={submit}
            className="rounded-2xl border border-[var(--fs-line)] bg-white p-8"
          >
            <div className="mx-auto max-w-[400px]">
              <div className="fs-sec-eyebrow text-center">Triage retour</div>
              <h2 className="mt-2 text-center font-display text-2xl font-semibold tracking-[-0.02em] text-[var(--fs-ink)]">
                Scanner le QR ou saisir le code
              </h2>
              <p className="mt-2 text-center text-sm text-[var(--fs-ink-2)]">
                Le patient revient à l&apos;urgence — aucun nouveau triage.
                Statut → ARRIVED.
              </p>

              <div className="mt-6">
                <Label htmlFor="code" className="mb-1.5 inline-block">
                  Code retour (4 chiffres) ou contenu QR
                </Label>
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  autoFocus
                  inputMode="numeric"
                  placeholder="4321"
                  className="h-14 text-center font-mono text-2xl tracking-[0.3em]"
                />
              </div>

              <button
                type="submit"
                className="fs-pill mt-5 w-full justify-center"
                style={{ height: 50 }}
              >
                Marquer arrivé
              </button>

              {result && (
                <div
                  className={`mt-5 rounded-xl border p-4 text-sm ${
                    result.ok
                      ? "border-green-200 bg-green-50 text-green-800"
                      : "border-red-200 bg-red-50 text-red-800"
                  }`}
                >
                  {result.ok ? (
                    <>
                      <div className="font-semibold">
                        ✓ {result.name} marqué arrivé
                      </div>
                      <div className="mt-0.5 text-xs">
                        Code {result.code} · {result.hospital}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="font-semibold">✕ Refusé</div>
                      <div className="mt-0.5 text-xs">{result.reason}</div>
                    </>
                  )}
                </div>
              )}
            </div>
          </form>

          <aside className="rounded-2xl border border-[var(--fs-line)] bg-white p-6">
            <div className="fs-sec-eyebrow">Comment ça marche</div>
            <ol className="mt-3 space-y-3 text-[13.5px] text-[var(--fs-ink-2)]">
              <li>
                <b className="text-[var(--fs-ink)]">1.</b> Patient se présente
                au triage avec son code ou QR.
              </li>
              <li>
                <b className="text-[var(--fs-ink)]">2.</b> Vous scannez (caméra
                de l&apos;appareil) ou saisissez les 4 chiffres.
              </li>
              <li>
                <b className="text-[var(--fs-ink)]">3.</b> Système valide le
                statut (CONFIRMED, AWAITING_*, REGISTERED).
              </li>
              <li>
                <b className="text-[var(--fs-ink)]">4.</b> Patient passe en
                ARRIVED · flux urgence standard.
              </li>
            </ol>
            <div className="mt-4 rounded-xl bg-[var(--fs-bg-soft-2)] p-3 text-xs text-[var(--fs-ink-2)]">
              <b className="text-[var(--fs-ink)]">Astuce demo:</b> ouvre la file
              dans un onglet et copie le code 4 chiffres d&apos;un patient pour
              tester.
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
