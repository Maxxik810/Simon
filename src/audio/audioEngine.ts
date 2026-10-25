import type { ColorId } from '../game/colors';

// All sounds are generated with Web Audio oscillators: no audio files,
// so they will also work offline later (ARCHITECTURE 1, 2.4).

// Pitches inspired by the original Simon toy; clearly distinct from each other.
const TONE_HZ: Record<ColorId, number> = {
  green: 415.3,
  red: 311.1,
  yellow: 252.0,
  blue: 209.0,
};

const ATTACK_S = 0.01;
const RELEASE_S = 0.04;
const VOLUME = 0.25;

type Voice = { osc: OscillatorNode; gain: GainNode; stopped: boolean };

let ctx: AudioContext | null = null;
const active = new Set<Voice>();

function getAudioContextClass(): typeof AudioContext | undefined {
  if (typeof window === 'undefined') return undefined;
  const w = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
  return w.AudioContext ?? w.webkitAudioContext;
}

/**
 * Creates or resumes the AudioContext. Must be called from a user gesture
 * ("התחל משחק"). Resolves to false when sound cannot be started, so the game
 * never advances silently as if sound had played.
 */
export async function unlockAudio(): Promise<boolean> {
  try {
    const AudioContextClass = getAudioContextClass();
    if (!AudioContextClass) return false;
    if (!ctx) ctx = new AudioContextClass();
    if (ctx.state !== 'running') await ctx.resume();
    return (ctx.state as AudioContextState) === 'running';
  } catch {
    return false;
  }
}

function startVoice(frequency: number, type: OscillatorType, at = 0): Voice | null {
  if (!ctx || ctx.state !== 'running') return null;
  const start = ctx.currentTime + at;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = frequency;
  // Short envelope to avoid clicks
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(VOLUME, start + ATTACK_S);
  osc.connect(gain).connect(ctx.destination);
  osc.start(start);
  const voice: Voice = { osc, gain, stopped: false };
  active.add(voice);
  osc.onended = () => {
    active.delete(voice);
    osc.disconnect();
    gain.disconnect();
  };
  return voice;
}

function stopVoice(voice: Voice, at?: number) {
  if (voice.stopped || !ctx) return;
  voice.stopped = true;
  const when = Math.max(at ?? ctx.currentTime, ctx.currentTime);
  try {
    voice.gain.gain.cancelScheduledValues(when);
    voice.gain.gain.setValueAtTime(voice.gain.gain.value, when);
    voice.gain.gain.linearRampToValueAtTime(0, when + RELEASE_S);
    voice.osc.stop(when + RELEASE_S + 0.01);
  } catch {
    // Already stopped
  }
}

/** Starts the tone of a color and returns a function that stops it. */
export function startTone(color: ColorId): () => void {
  const voice = startVoice(TONE_HZ[color], 'triangle');
  return () => {
    if (voice) stopVoice(voice);
  };
}

function playMotif(notes: ReadonlyArray<[hz: number, startS: number, lengthS: number]>, type: OscillatorType) {
  if (!ctx) return;
  for (const [hz, startS, lengthS] of notes) {
    const voice = startVoice(hz, type, startS);
    if (voice) stopVoice(voice, ctx.currentTime + startS + lengthS);
  }
}

/** Short rising fanfare */
export function playWin() {
  playMotif(
    [
      [523.3, 0, 0.14],
      [659.3, 0.15, 0.14],
      [784.0, 0.3, 0.14],
      [1046.5, 0.45, 0.4],
    ],
    'triangle',
  );
}

/** Low falling buzz */
export function playLose() {
  playMotif(
    [
      [196.0, 0, 0.25],
      [146.8, 0.27, 0.25],
      [98.0, 0.54, 0.5],
    ],
    'sawtooth',
  );
}

/** Stops every sound that is playing or scheduled. */
export function stopAll() {
  for (const voice of [...active]) {
    voice.stopped = false;
    stopVoice(voice);
  }
}
