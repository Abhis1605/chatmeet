let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;

  const AudioCtx =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioCtx) return null;

  if (!audioContext) {
    audioContext = new AudioCtx();
  }
  return audioContext;
}

/** Call from a user gesture so later notification sounds are allowed to play. */
export function primeNotificationSound() {
  const ctx = getAudioContext();
  if (ctx && ctx.state === "suspended") {
    void ctx.resume().catch(() => {});
  }
}

function playTone(ctx: AudioContext) {
  const now = ctx.currentTime;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(880, now);
  oscillator.frequency.setValueAtTime(1174.66, now + 0.09);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.16, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);

  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.26);
}

export function playNotificationSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === "suspended") {
    void ctx
      .resume()
      .then(() => playTone(ctx))
      .catch(() => {});
    return;
  }

  playTone(ctx);
}
