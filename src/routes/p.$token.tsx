import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SayneLogo } from "@/components/sayne-logo";

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
            <h1 className="font-display text-xl font-semibold mb-2">Link unavailable</h1>
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
  // Compute draw volume assuming 5mg vial reconstituted in 2mL (display reference)
  const drawVolMl = (() => {
    const mg = p.dose_unit === "mcg" ? p.dose / 1000 : p.dose_unit === "mg" ? p.dose : null;
    if (!mg) return null;
    const concentration = 5 / 2; // mg/mL example
    return mg / concentration;
  })();

  return (
    <div className="space-y-8">
      <div>
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">{p.name}</div>
        <h1
          className="font-display text-4xl sm:text-5xl font-semibold leading-tight tracking-tight break-words"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {p.compound}
        </h1>
      </div>

      <SyringeVisualizer drawMl={drawVolMl} dose={p.dose} unit={p.dose_unit} />

      <div className="grid grid-cols-2 gap-3">
        <div className="sayne-card p-4">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Dose</div>
          <div className="font-mono text-xl font-semibold">
            {p.dose} <span className="text-sm text-muted-foreground">{p.dose_unit}</span>
          </div>
        </div>
        <div className="sayne-card p-4">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Draw Volume</div>
          <div className="font-mono text-xl font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {drawVolMl != null ? `${drawVolMl.toFixed(2)} mL` : "—"}
          </div>
        </div>
        <div className="sayne-card p-4 col-span-2">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Frequency</div>
          <div className="text-base">{p.frequency}</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium"
          style={{ backgroundColor: "var(--panel)", color: "var(--foreground)", border: "1px solid var(--border)" }}>
          {p.route}
        </span>
        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-mono"
          style={{ backgroundColor: "color-mix(in oklab, var(--secondary) 35%, transparent)", color: "var(--foreground)" }}>
          {p.ongoing ? "Ongoing" : `${p.duration_days ?? "—"} days`}
        </span>
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

function SyringeVisualizer({ drawMl, dose, unit }: { drawMl: number | null; dose: number; unit: string }) {
  const totalMl = 1; // 1mL syringe reference
  const pct = drawMl != null ? Math.min(100, Math.max(2, (drawMl / totalMl) * 100)) : 0;
  return (
    <div className="sayne-card p-5">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-3">Syringe (1 mL reference)</div>
      <div className="relative h-10 w-full rounded-full overflow-hidden border" style={{ borderColor: "var(--border)", backgroundColor: "var(--panel)" }}>
        <div
          className="absolute inset-y-0 left-0 transition-all"
          style={{ width: `${pct}%`, backgroundColor: "var(--primary)" }}
        />
        <div className="absolute inset-0 flex items-center justify-between px-3 font-mono text-xs"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          <span>0.0 mL</span>
          <span className="font-semibold">{drawMl != null ? `${drawMl.toFixed(2)} mL` : `${dose}${unit}`}</span>
          <span>1.0 mL</span>
        </div>
      </div>
    </div>
  );
}
