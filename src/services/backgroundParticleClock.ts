export type BackgroundParticleTick = (time: number, delta: number) => void;

const listeners = new Set<BackgroundParticleTick>();

export const isPageBackgrounded = (): boolean => (
  typeof document !== 'undefined'
  && (document.visibilityState === 'hidden' || !document.hasFocus())
);

/**
 * Bridges Tone's worker-backed audio clock to particle simulations while the
 * document is hidden. Rendering remains on requestAnimationFrame, but wall-hit
 * generation no longer depends on it.
 */
class BackgroundParticleClock {
  subscribe(listener: BackgroundParticleTick): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  tick(time: number, delta: number): void {
    if (!isPageBackgrounded()) return;
    listeners.forEach((listener) => listener(time, delta));
  }
}

export const backgroundParticleClock = new BackgroundParticleClock();
