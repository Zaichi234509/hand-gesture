class SoundEngine {
  private ctx: AudioContext | null = null;
  public muted = false;

  private ensureContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  playSoftTick(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.09);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.035, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  playUnlockChime(stepIndex = 0): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const baseNotes = [
      [523.25, 659.25, 783.99, 987.77], // Cmaj7
      [587.33, 739.99, 880.0, 1108.73], // Dmaj7
      [659.25, 830.61, 987.77, 1244.51], // Emaj7
      [523.25, 659.25, 783.99, 1046.5], // C6/9
      [587.33, 698.46, 880.0, 1046.5], // Dm7
      [659.25, 783.99, 987.77, 1318.51], // Em7 add11
    ];

    const chord = baseNotes[stepIndex % baseNotes.length];
    const now = ctx.currentTime;

    chord.forEach((freq, idx) => {
      const start = now + idx * 0.065;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(0.055 / (1 + idx * 0.18), start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.95);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + 1.0);
    });
  }

  playFinalLetterReveal(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const notes = [392.0, 493.88, 587.33, 739.99, 987.77, 1174.66]; // Warm Gmaj9 bloom
    const now = ctx.currentTime;

    notes.forEach((freq, idx) => {
      const start = now + idx * 0.085;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(0.06 / (1 + idx * 0.14), start + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.7);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + 1.75);
    });
  }
}

export const soundEngine = new SoundEngine();
