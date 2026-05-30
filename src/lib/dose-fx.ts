// Lightweight client-side effects shared by the dose check-off interaction:
// haptic vibration + optional completion sound (Web Audio sine blip).

export function haptic(ms = 15) {
  try { navigator.vibrate?.(ms); } catch { /* ignore */ }
}

const SOUND_KEY = "sayne:completion-sound";

export function getSoundEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(SOUND_KEY) === "1";
}
export function setSoundEnabled(on: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SOUND_KEY, on ? "1" : "0");
}

let ctx: AudioContext | null = null;
function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (ctx) return ctx;
  const Ctor = (window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);
  if (!Ctor) return null;
  ctx = new Ctor();
  return ctx;
}

export function playCheckSound() {
  if (!getSoundEnabled()) return;
  const ac = getCtx();
  if (!ac) return;
  try {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(740, ac.currentTime);
    o.frequency.exponentialRampToValueAtTime(1180, ac.currentTime + 0.12);
    g.gain.setValueAtTime(0.0001, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.18, ac.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.22);
    o.connect(g).connect(ac.destination);
    o.start();
    o.stop(ac.currentTime + 0.25);
  } catch { /* ignore */ }
}

export function playCompletionFlourish() {
  if (!getSoundEnabled()) return;
  const ac = getCtx();
  if (!ac) return;
  try {
    [660, 880, 1175].forEach((freq, i) => {
      const o = ac.createOscillator();
      const g = ac.createGain();
      const t = ac.currentTime + i * 0.09;
      o.type = "sine";
      o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.16, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
      o.connect(g).connect(ac.destination);
      o.start(t);
      o.stop(t + 0.32);
    });
  } catch { /* ignore */ }
}
