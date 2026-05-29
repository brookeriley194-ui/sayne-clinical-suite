import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Tutorial } from "@/components/tutorial";

const DISMISS_KEY = "sayne_install_dismissed";
const DISMISS_DAYS = 14;

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const mql = window.matchMedia?.("(display-mode: standalone)").matches;
  // @ts-expect-error iOS Safari
  const ios = window.navigator?.standalone === true;
  return Boolean(mql || ios);
}

function isMobile(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

function dismissedRecently(): boolean {
  try {
    const v = localStorage.getItem(DISMISS_KEY);
    if (!v) return false;
    const ts = parseInt(v, 10);
    if (!ts) return false;
    return Date.now() - ts < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch { return false; }
}

export function InstallBanner() {
  const [visible, setVisible] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    if (!isMobile()) return;
    if (isStandalone()) return;
    if (dismissedRecently()) return;
    setVisible(true);
  }, []);

  if (!visible && !showTutorial) return null;

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {}
    setVisible(false);
  };

  return (
    <>
      {visible && (
        <div
          className="fixed left-3 right-3 z-50 sayne-card flex items-center gap-3 px-3 py-2.5 md:hidden"
          style={{
            bottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)",
            borderTop: "2px solid #C9A8F5",
            borderTopLeftRadius: 14,
            borderTopRightRadius: 14,
          }}
        >
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="font-display text-sm font-bold tracking-tight">SAYNE</span>
            <svg width="14" height="14" viewBox="0 0 42 42" fill="none" aria-hidden>
              <path d="M4 30 Q21 4 38 30" stroke="#C9A8F5" strokeWidth="3" strokeLinecap="round" fill="none" />
              <circle cx="38" cy="30" r="4" fill="#89CFF0" />
            </svg>
          </div>
          <div className="text-xs text-foreground flex-1 min-w-0 truncate">
            Add Sayne to your home screen
          </div>
          <button
            onClick={() => setShowTutorial(true)}
            className="text-xs font-medium shrink-0"
            style={{ color: "#3a7fa3" }}
          >
            How?
          </button>
          <button
            onClick={dismiss}
            aria-label="Dismiss"
            className="shrink-0 p-1 rounded-full hover:bg-[var(--panel)]"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      )}
      <Tutorial open={showTutorial} onClose={() => setShowTutorial(false)} />
    </>
  );
}
