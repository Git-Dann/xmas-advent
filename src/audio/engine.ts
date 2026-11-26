import { getPrefs, setPrefs } from '../lib/prefs';

/**
 * Centralised Web Audio engine.
 * - Three channels (ui, ambient, narrative) into a master gain.
 * - Starts only after an explicit user gesture (iOS requirement and good manners).
 * - Lazy-loads and caches decoded buffers per event; picks a random variation with a small
 *   pitch and level jitter so repeated sounds do not feel mechanical.
 * - Suspends when the page is hidden, resumes when it returns, and recovers from iOS
 *   "interrupted" sessions (phone calls, Siri) on the next gesture.
 * - Every failure is silent: no puzzle ever depends on sound.
 */
export type Channel = 'ui' | 'ambient' | 'narrative';

export type SoundEvent =
  | 'ui.tap' | 'ui.press' | 'ui.release' | 'ui.open' | 'ui.close' | 'ui.back' | 'ui.error.soft'
  | 'door.unlock' | 'door.open' | 'door.close' | 'paper.rustle' | 'letter.unfold' | 'seal.break'
  | 'object.pickup' | 'object.rotate' | 'object.place' | 'object.inspect' | 'dial.tick'
  | 'lock.engage' | 'lock.release' | 'puzzle.correct' | 'puzzle.complete' | 'evidence.collect'
  | 'secret.reveal' | 'chapter.complete' | 'key.earned' | 'key.insert' | 'key.turn' | 'christmas.reveal'
  | 'ambient.wind' | 'ambient.fireplace' | 'ambient.winter';

interface SoundDef {
  channel: Channel;
  files: string[];
  gain?: number;
  loop?: boolean;
}

type SoundMap = Partial<Record<SoundEvent, SoundDef>>;

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private channels = new Map<Channel, GainNode>();
  private buffers = new Map<string, Promise<AudioBuffer | null>>();
  private map: SoundMap = {};
  private mapLoaded: Promise<void> | null = null;
  private loops = new Map<SoundEvent, { source: AudioBufferSourceNode; gain: GainNode }>();
  private lastPlayed = new Map<SoundEvent, number>();
  private wantedAmbient: SoundEvent | null = null;

  constructor() {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => this.onVisibility());
      window.addEventListener('pagehide', () => void this.ctx?.suspend().catch(() => undefined));
    }
  }

  private loadMap(): Promise<void> {
    this.mapLoaded ??= import('./soundMap.json')
      .then((mod) => {
        this.map = (mod.default ?? mod) as SoundMap;
      })
      .catch(() => {
        this.map = {};
      });
    return this.mapLoaded;
  }

  /** Call from a user gesture (tap, click, key press). Safe to call repeatedly. */
  unlock(): void {
    if (getPrefs().muted) return;
    try {
      if (!this.ctx) {
        const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) return;
        this.ctx = new Ctor({ latencyHint: 'interactive' });
        this.master = this.ctx.createGain();
        this.master.connect(this.ctx.destination);
        for (const channel of ['ui', 'ambient', 'narrative'] as Channel[]) {
          const gain = this.ctx.createGain();
          gain.connect(this.master);
          this.channels.set(channel, gain);
        }
        this.applyVolumes();
        void this.loadMap().then(() => this.preload(['ui.tap', 'ui.open', 'ui.close', 'dial.tick', 'ui.error.soft', 'puzzle.correct']));
      }
      if (this.ctx.state !== 'running') void this.ctx.resume().catch(() => undefined);
    } catch {
      this.ctx = null;
    }
  }

  applyVolumes(): void {
    if (!this.ctx || !this.master) return;
    const prefs = getPrefs();
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(prefs.muted ? 0 : 1, t, 0.05);
    this.channels.get('ui')?.gain.setTargetAtTime(prefs.ui, t, 0.05);
    this.channels.get('ambient')?.gain.setTargetAtTime(prefs.ambient, t, 0.2);
    this.channels.get('narrative')?.gain.setTargetAtTime(prefs.narrative, t, 0.05);
  }

  setMuted(muted: boolean): void {
    setPrefs({ muted, soundPrompted: true });
    if (!muted) {
      this.unlock();
      if (this.wantedAmbient) void this.startAmbient(this.wantedAmbient);
    }
    this.applyVolumes();
  }

  private async buffer(url: string): Promise<AudioBuffer | null> {
    if (!this.ctx) return null;
    let pending = this.buffers.get(url);
    if (!pending) {
      const ctx = this.ctx;
      pending = fetch(url)
        .then((res) => (res.ok ? res.arrayBuffer() : Promise.reject(new Error(String(res.status)))))
        .then((data) => ctx.decodeAudioData(data))
        .catch(() => null);
      this.buffers.set(url, pending);
    }
    return pending;
  }

  preload(events: SoundEvent[]): void {
    for (const event of events) for (const file of this.map[event]?.files ?? []) void this.buffer(file);
  }

  async play(event: SoundEvent, opts: { gain?: number; delay?: number } = {}): Promise<void> {
    if (getPrefs().muted || document.hidden) return;
    this.unlock();
    if (!this.ctx) return;
    await this.loadMap();
    const def = this.map[event];
    if (!def || def.files.length === 0) return;
    // Debounce identical events fired in the same instant (for example a fast dial spin).
    const now = performance.now();
    if (now - (this.lastPlayed.get(event) ?? 0) < 35) return;
    this.lastPlayed.set(event, now);
    const file = def.files[Math.floor(Math.random() * def.files.length)]!;
    const buffer = await this.buffer(file);
    if (!buffer || !this.ctx) return;
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    if (def.channel === 'ui') source.playbackRate.value = 0.97 + Math.random() * 0.06;
    const gain = this.ctx.createGain();
    gain.gain.value = (def.gain ?? 1) * (opts.gain ?? 1) * (def.channel === 'ui' ? 0.9 + Math.random() * 0.1 : 1);
    source.connect(gain).connect(this.channels.get(def.channel)!);
    source.start(this.ctx.currentTime + (opts.delay ?? 0));
  }

  /** Starts (or crossfades to) an ambient loop. Only one ambient bed plays at a time. */
  async startAmbient(event: SoundEvent): Promise<void> {
    this.wantedAmbient = event;
    if (getPrefs().muted || !this.ctx) return;
    if (this.loops.has(event)) return;
    await this.loadMap();
    const def = this.map[event];
    const file = def?.files[0];
    if (!def || !file) return;
    const buffer = await this.buffer(file);
    if (!buffer || !this.ctx || this.wantedAmbient !== event) return;
    for (const other of [...this.loops.keys()]) if (other !== event) this.stopLoop(other);
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const gain = this.ctx.createGain();
    gain.gain.value = 0;
    gain.gain.setTargetAtTime(def.gain ?? 1, this.ctx.currentTime, 1.2);
    source.connect(gain).connect(this.channels.get('ambient')!);
    source.start();
    this.loops.set(event, { source, gain });
  }

  stopAmbient(): void {
    this.wantedAmbient = null;
    for (const event of [...this.loops.keys()]) this.stopLoop(event);
  }

  private stopLoop(event: SoundEvent): void {
    const loop = this.loops.get(event);
    if (!loop || !this.ctx) return;
    loop.gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.4);
    loop.source.stop(this.ctx.currentTime + 2);
    this.loops.delete(event);
  }

  private onVisibility(): void {
    if (!this.ctx) return;
    if (document.hidden) void this.ctx.suspend().catch(() => undefined);
    else if (!getPrefs().muted) void this.ctx.resume().catch(() => undefined);
  }
}

export const audio = new AudioEngine();

/** Install once: the first gesture of any kind unlocks audio (if the player has turned it on). */
export function installAudioUnlock(): void {
  const handler = () => audio.unlock();
  for (const type of ['pointerdown', 'keydown', 'touchend']) window.addEventListener(type, handler, { passive: true, capture: true });
}
