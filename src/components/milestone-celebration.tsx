import { useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Flame, Sparkles } from "lucide-react";

const COLORS = ["#C9A8F5", "#A8D5BA", "#F5C97A", "#F5B8C8"]; // Sayne accents

type Props = {
  milestone: number | null;
  onDismiss: (n: number) => void;
};

export function MilestoneCelebration({ milestone, onDismiss }: Props) {
  const pieces = useMemo(
    () => Array.from({ length: 40 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      cx: `${(Math.random() - 0.5) * 30}vw`,
      cd: `${2 + Math.random() * 2.2}s`,
      size: 6 + Math.random() * 8,
      color: COLORS[i % COLORS.length],
      delay: Math.random() * 0.6,
      shape: Math.random() > 0.5 ? "50%" : "2px",
    })),
    [milestone],
  );

  useEffect(() => {
    if (milestone == null) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onDismiss(milestone); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [milestone, onDismiss]);

  if (milestone == null) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center px-6 animate-in fade-in"
      style={{ background: "color-mix(in oklab, var(--background) 65%, transparent)", backdropFilter: "blur(8px)" }}
    >
      {/* Confetti layer */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {pieces.map((p) => (
          <span
            key={p.id}
            className="confetti-piece absolute top-0"
            style={{
              left: `${p.left}%`,
              width: p.size,
              height: p.size,
              background: p.color,
              borderRadius: p.shape,
              animationDelay: `${p.delay}s`,
              ["--cx" as string]: p.cx,
              ["--cd" as string]: p.cd,
            } as React.CSSProperties}
          />
        ))}
      </div>

      <div
        className="sayne-card relative max-w-md w-full p-8 text-center animate-in zoom-in-95"
        style={{ background: "var(--card)" }}
      >
        <div
          className="mx-auto size-16 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: "color-mix(in oklab, #F5C97A 25%, transparent)" }}
        >
          <Flame className="size-9" style={{ color: "#F5C97A" }} fill="#F5C97A" fillOpacity={0.4} />
        </div>
        <h2 className="font-display text-3xl font-bold mb-2 inline-flex items-center gap-2">
          <Sparkles className="size-5 text-primary" />
          {milestone} day streak!
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          You're building a real habit. Consistency is the win — keep it gentle, keep it going.
        </p>
        <Button onClick={() => onDismiss(milestone)} className="w-full">Keep going</Button>
      </div>
    </div>
  );
}
