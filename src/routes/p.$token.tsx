import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SayneLogo } from "@/components/sayne-logo";
import { SyringeVisualizer } from "@/components/syringe-visualizer";

export const Route = createFileRoute("/p/$token")({ component: PatientPage });

type Protocol = {
  id: string; name: string; compound: string;
  dose: number; dose_unit: string; frequency: string; route: string;
  duration_days: number | null; ongoing: boolean; notes: string | null;
};

function PatientPage() {
  const { token } = Route.useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [protocol, setProtocol] = useState<Protocol | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("get-patient-protocol", {
          body: { token },
        });
        if (cancelled) return;
        if (error || (data as any)?.error) {
          setError((data as any)?.error ?? error?.message ?? "Unable to load protocol");
        } else {
          setProtocol((data as any).protocol);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Unable to load protocol");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      <header className="px-5 sm:px-8 py-6 border-b" style={{ borderColor: "var(--border)" }}>
        <SayneLogo />
      </header>

      <main className="px-5 sm:px-8 py-10 max-w-2xl mx-auto">
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading your protocol…</div>
        ) : error ? (
          <div className="sayne-card p-8 text-center">
            <h1 className="font-display text-xl font-bold mb-2">Link unavailable</h1>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        ) : protocol ? (
          <ProtocolView p={protocol} />
        ) : null}

        <footer className="mt-12 text-center text-xs text-muted-foreground">
          For clinical reference only. Follow your physician's instructions.
        </footer>
      </main>
    </div>
  );
}

function ProtocolView({ p }: { p: Protocol }) {
  // Normalize to mcg + assume a reference reconstitution of 5mg in 2mL → 2500 mcg/mL.
  // (Doctors can override per-protocol once vials are wired up.)
  const dose_mcg =
    p.dose_unit === "mcg" ? p.dose :
    p.dose_unit === "mg" ? p.dose * 1000 :
    p.dose; // IU treated 1:1 for display
  const concentration_mcg_per_ml = 2500;

  // Mock potency for now (real value will come from vial reconstitution date).
  const potency_score = 92;

  return (
    <div className="space-y-10">
      <div>
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">{p.name}</div>
        <h1
          className="font-display text-4xl sm:text-5xl font-semibold leading-tight tracking-tight break-words"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {p.compound}
        </h1>
      </div>

      <SyringeVisualizer
        compound={p.compound}
        dose_mcg={dose_mcg}
        concentration_mcg_per_ml={concentration_mcg_per_ml}
        potency_score={potency_score}
      />

      <div className="sayne-card p-5">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Instructions</div>
        <p className="text-base">{p.frequency}</p>
        <div className="flex items-center gap-2 flex-wrap mt-3">
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium"
            style={{ backgroundColor: "var(--panel)", color: "var(--foreground)", border: "1px solid var(--border)" }}>
            {p.route}
          </span>
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-mono"
            style={{ backgroundColor: "color-mix(in oklab, var(--secondary) 35%, transparent)", color: "var(--foreground)" }}>
            {p.ongoing ? "Ongoing" : `${p.duration_days ?? "—"} days`}
          </span>
        </div>
      </div>

      {p.notes && (
        <div className="sayne-card p-5">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Notes</div>
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{p.notes}</p>
        </div>
      )}
    </div>
  );
}
