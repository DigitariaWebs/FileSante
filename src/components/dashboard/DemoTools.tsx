"use client";

import { useState } from "react";

import { Icon } from "@/components/ui/Icon";
import { store, triggerDemoNotify } from "@/lib/filesante/store";

export function DemoTools() {
  const [confirming, setConfirming] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function doReset() {
    store.resetDemo();
    setConfirming(false);
    setToast("Démo réinitialisée — 5 patients HMR");
    window.setTimeout(() => setToast(null), 2500);
  }

  function doNotify() {
    const id = triggerDemoNotify("HMR");
    setToast(
      id ? "Notification déclenchée sur le prochain patient HMR" : "Aucun patient REGISTERED à notifier",
    );
    window.setTimeout(() => setToast(null), 2500);
  }

  return (
    <section className="fs-dash-card flex flex-wrap items-center gap-4 border-dashed p-5">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[rgba(124,58,237,0.1)] text-[#5b21b6]">
        <Icon name="lifebelt" size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="fs-eyebrow text-[#5b21b6]">Démo</div>
        <h3 className="fs-tagline mt-0.5">Outils de simulation</h3>
        <p className="mt-1 text-[12px] text-[var(--ap-ink-muted-80)]">
          Réinitialise la file et déclenche manuellement une notification (push
          + SMS) pour test.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={doNotify}
          className="fs-btn fs-btn-pearl"
          title="Déclencher push + SMS sur le prochain patient HMR"
        >
          <Icon name="bell" size={13} />
          Test notify
        </button>
        {confirming ? (
          <>
            <span className="text-[12px] text-[#c8102e]">Confirmer ?</span>
            <button
              type="button"
              onClick={doReset}
              className="fs-btn fs-btn-danger fs-btn-sm"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="fs-btn fs-btn-pearl fs-btn-sm"
            >
              Annuler
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="fs-btn fs-btn-pearl"
            title="Réinitialiser la file (5 patients HMR)"
          >
            <Icon name="x" size={13} />
            Reset démo
          </button>
        )}
      </div>
      {toast && (
        <div className="w-full rounded-xl border border-[rgba(30,144,214,0.3)] bg-[rgba(30,144,214,0.06)] px-4 py-2 text-[12.5px] text-[var(--fs-primary)]">
          {toast}
        </div>
      )}
    </section>
  );
}
