export type MusicScene =
  | 'menu'
  | 'crypt'
  | 'combat'
  | 'town'
  | 'boss'
  | 'cathedral'
  | 'forest'
  | 'dungeon'
  | 'tavern'
  | 'graveyard'
  | 'castle'
  | 'ruins'
  | 'library'
  | 'abyss'
  | 'victory'
  | 'gameover';

// P2.4/P2.6: ported Custom-VTT SoundSynthesizer — pure WebAudio one-shots
// (UI, dice, fanfares, per-element spell impacts). No audio files, ever.
import synth from './SoundSynthesizer';

export type InstrumentVoice =
  | 'flute'       // Arc the Lad: lyrical, warm, breathy wooden flute with vibrato
  | 'harp'        // Delicate, acoustic plucked nylon harp/lute
  | 'strings'     // Warm, slow-swelling legato orchestral strings
  | 'cello'       // Resonant, deep bowed acoustic cello
  | 'organ'       // Reverberant cathedral pipe organ (soft 8' + 4' flutes)
  | 'choir'       // Ethereal vocal formant pad
  | 'horn'        // Noble JRPG French horn / brass swell
  | 'bass'        // Deep, warm acoustic upright/pedal bass (soft sub-triangle)
  | 'bell'        // Rare, distant church / tubular bell chime
  | 'timpani';    // Deep orchestral bass drum / timpani for dramatic cadence

interface AudioSettings {
  musicVolume: number;
  sfxVolume: number;
}

const SETTINGS_KEY = 'ar_audio_mix';
const DEFAULT_SETTINGS: AudioSettings = { musicVolume: 0.8, sfxVolume: 1 };
const settingsListeners = new Set<() => void>();

let context: AudioContext | null = null;
let master: GainNode | null = null;
let musicBus: GainNode | null = null;
let sfxBus: GainNode | null = null;
let activeTrack: GainNode | null = null;

// Dual stereo spatial delays for atmospheric depth
let delayLeft: DelayNode | null = null;
let delayRight: DelayNode | null = null;
let delayFeedback: GainNode | null = null;
let delayDampFilter: BiquadFilterNode | null = null;

let sequencerTimer: number | null = null;
let nextStepTime = 0;
let currentStep = 0;
let enabled = false;
let scene: MusicScene = 'menu';
let settings = loadSettings();

// Lookahead scheduler config (Chris Wilson clock pattern)
const LOOKAHEAD_INTERVAL_MS = 25;
const SCHEDULE_AHEAD_SEC = 0.12;

function loadSettings(): AudioSettings {
  let stored: string | null;
  try {
    stored = localStorage.getItem(SETTINGS_KEY);
  } catch (error) {
    console.warn('Unable to read audio preferences from browser storage:', error);
    return { ...DEFAULT_SETTINGS };
  }
  if (!stored) return { ...DEFAULT_SETTINGS };
  try {
    const saved = JSON.parse(stored) as Partial<AudioSettings>;
    return {
      musicVolume: clamp(Number(saved.musicVolume), DEFAULT_SETTINGS.musicVolume),
      sfxVolume: clamp(Number(saved.sfxVolume), DEFAULT_SETTINGS.sfxVolume),
    };
  } catch (error) {
    console.warn('Unable to parse saved audio preferences:', error);
    return { ...DEFAULT_SETTINGS };
  }
}

function clamp(value: number, fallback: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : fallback;
}

function saveSettings() {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.warn('Unable to save audio preferences to browser storage:', error);
  }
}

function notifySettings() {
  for (const listener of settingsListeners) listener();
}

function ramp(node: GainNode | null, value: number, timeConstant = 0.1) {
  if (!node || !context) return;
  node.gain.cancelScheduledValues(context.currentTime);
  node.gain.setTargetAtTime(Math.max(0.00001, value), context.currentTime, timeConstant);
}

function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/* -------------------------------------------------------------------------- */
/* Web Audio Context & FX Bus Network                                         */
/* -------------------------------------------------------------------------- */

function createContext() {
  if (context) return;
  const AudioContextClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;

  context = new AudioContextClass();
  master = context.createGain();
  musicBus = context.createGain();
  sfxBus = context.createGain();

  // Mastering Dynamics Compressor (glues chiptune/orchestral dynamics)
  const compressor = context.createDynamicsCompressor();
  compressor.threshold.value = -16;
  compressor.knee.value = 10;
  compressor.ratio.value = 3.5;
  compressor.attack.value = 0.003;
  compressor.release.value = 0.22;

  master.gain.value = 1;
  musicBus.gain.value = 1;
  sfxBus.gain.value = 0;
  musicBus.connect(master);
  sfxBus.connect(master);
  master.connect(compressor);
  compressor.connect(context.destination);

  // Dual-channel stereo spatial reflections
  delayLeft = context.createDelay(2.0);
  delayRight = context.createDelay(2.0);
  delayFeedback = context.createGain();
  delayDampFilter = context.createBiquadFilter();
  const wet = context.createGain();

  delayLeft.delayTime.value = 0.38;
  delayRight.delayTime.value = 0.52;
  delayDampFilter.type = 'lowpass';
  delayDampFilter.frequency.value = 1400; // Warm analog room damping
  delayFeedback.gain.value = 0.32;
  wet.gain.value = 0.26;

  musicBus.connect(delayLeft);
  musicBus.connect(delayRight);
  delayLeft.connect(delayDampFilter);
  delayRight.connect(delayDampFilter);
  delayDampFilter.connect(delayFeedback);
  delayFeedback.connect(delayLeft);
  delayFeedback.connect(delayRight);
  delayDampFilter.connect(wet);
  wet.connect(master);
}

/* -------------------------------------------------------------------------- */
/* Synthesis Voices (Baroque Organ, Genesis FM Bass, Elden Bells & Choir)     */
/* -------------------------------------------------------------------------- */

function playVoice(
  voice: InstrumentVoice,
  midi: number,
  at: number,
  duration: number,
  output: AudioNode,
  velocity = 1
) {
  const ctx = context;
  if (!ctx) return;
  const freq = midiToFreq(midi);

  switch (voice) {
    case 'flute': {
      // Arc the Lad wooden lyrical flute: Sine + breath overtone + delayed expressive vibrato
      const osc = ctx.createOscillator();
      const subHarmonic = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const env = ctx.createGain();
      const vLfo = ctx.createOscillator();
      const vGain = ctx.createGain();

      osc.type = 'sine';
      subHarmonic.type = 'triangle';
      osc.frequency.setValueAtTime(freq, at);
      subHarmonic.frequency.setValueAtTime(freq * 2, at);

      // Delayed vibrato (enters after note blooms, 5.2 Hz)
      vLfo.frequency.setValueAtTime(5.2, at);
      vGain.gain.setValueAtTime(0, at);
      vGain.gain.setValueAtTime(0, at + 0.15);
      vGain.gain.linearRampToValueAtTime(freq * 0.015, at + 0.45);
      vLfo.connect(vGain);
      vGain.connect(osc.frequency);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1600, at);

      const subGain = ctx.createGain();
      subGain.gain.value = 0.12;
      subHarmonic.connect(subGain);
      subGain.connect(filter);
      osc.connect(filter);
      filter.connect(env);
      env.connect(output);

      // Gentle wind attack and soft musical release
      env.gain.setValueAtTime(0.0001, at);
      env.gain.linearRampToValueAtTime(0.085 * velocity, at + 0.1);
      env.gain.setValueAtTime(0.07 * velocity, at + duration * 0.8);
      env.gain.exponentialRampToValueAtTime(0.0001, at + duration + 0.3);

      vLfo.start(at);
      osc.start(at);
      subHarmonic.start(at);
      vLfo.stop(at + duration + 0.35);
      osc.stop(at + duration + 0.35);
      subHarmonic.stop(at + duration + 0.35);
      break;
    }

    case 'harp': {
      // Delicate plucked nylon string: Triangle/sine pluck with physical frequency damping
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, at);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1800, at);
      filter.frequency.exponentialRampToValueAtTime(450, at + Math.min(1.2, duration));

      env.gain.setValueAtTime(0.0001, at);
      env.gain.linearRampToValueAtTime(0.09 * velocity, at + 0.008);
      env.gain.exponentialRampToValueAtTime(0.02 * velocity, at + 0.35);
      env.gain.exponentialRampToValueAtTime(0.0001, at + duration + 0.6);

      osc.connect(filter);
      filter.connect(env);
      env.connect(output);

      osc.start(at);
      osc.stop(at + duration + 0.7);
      break;
    }

    case 'strings': {
      // Ethereal warm string pad: Dual detuned triangles with rich, slow swelling attack
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const env = ctx.createGain();

      osc1.type = 'triangle';
      osc2.type = 'sawtooth';
      osc1.frequency.setValueAtTime(freq * 0.998, at);
      osc2.frequency.setValueAtTime(freq * 1.002, at);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(750, at);

      const osc2Atten = ctx.createGain();
      osc2Atten.gain.value = 0.25;
      osc2.connect(osc2Atten);
      osc1.connect(filter);
      osc2Atten.connect(filter);
      filter.connect(env);
      env.connect(output);

      // Long, lush orchestral swell
      env.gain.setValueAtTime(0.0001, at);
      env.gain.linearRampToValueAtTime(0.045 * velocity, at + 0.7);
      env.gain.setValueAtTime(0.04 * velocity, at + duration * 0.85);
      env.gain.exponentialRampToValueAtTime(0.0001, at + duration + 1.2);

      osc1.start(at);
      osc2.start(at);
      osc1.stop(at + duration + 1.3);
      osc2.stop(at + duration + 1.3);
      break;
    }

    case 'cello': {
      // Mournful bowed solo cello (Elden Ring / Castlevania style)
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const env = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, at);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(650, at);
      filter.Q.value = 2.0;

      env.gain.setValueAtTime(0.0001, at);
      env.gain.linearRampToValueAtTime(0.055 * velocity, at + 0.25);
      env.gain.exponentialRampToValueAtTime(0.0001, at + duration + 0.8);

      osc.connect(filter);
      filter.connect(env);
      env.connect(output);

      osc.start(at);
      osc.stop(at + duration + 0.9);
      break;
    }

    case 'organ': {
      // Warm, sacred church organ: 8' and 4' soft wooden pipe flutes
      const pipe8 = ctx.createOscillator();
      const pipe4 = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const env = ctx.createGain();

      pipe8.type = 'sine';
      pipe4.type = 'triangle';
      pipe8.frequency.setValueAtTime(freq, at);
      pipe4.frequency.setValueAtTime(freq * 2, at);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1100, at);

      const p4Gain = ctx.createGain();
      p4Gain.gain.value = 0.35;
      pipe4.connect(p4Gain);
      p4Gain.connect(filter);
      pipe8.connect(filter);
      filter.connect(env);
      env.connect(output);

      env.gain.setValueAtTime(0.0001, at);
      env.gain.linearRampToValueAtTime(0.06 * velocity, at + 0.12);
      env.gain.setValueAtTime(0.05 * velocity, at + duration * 0.9);
      env.gain.exponentialRampToValueAtTime(0.0001, at + duration + 0.6);

      pipe8.start(at);
      pipe4.start(at);
      pipe8.stop(at + duration + 0.7);
      pipe4.stop(at + duration + 0.7);
      break;
    }

    case 'choir': {
      // Ethereal vocal formant: Detuned sines through an "Ah" vowel filter
      const oscA = ctx.createOscillator();
      const oscB = ctx.createOscillator();
      const formant = ctx.createBiquadFilter();
      const env = ctx.createGain();

      oscA.type = 'triangle';
      oscB.type = 'sine';
      oscA.frequency.setValueAtTime(freq * 0.997, at);
      oscB.frequency.setValueAtTime(freq * 1.003, at);

      formant.type = 'bandpass';
      formant.frequency.setValueAtTime(780, at);
      formant.Q.value = 3.2;

      env.gain.setValueAtTime(0.0001, at);
      env.gain.linearRampToValueAtTime(0.05 * velocity, at + 0.5);
      env.gain.exponentialRampToValueAtTime(0.0001, at + duration + 1.1);

      oscA.connect(formant);
      oscB.connect(formant);
      formant.connect(env);
      env.connect(output);

      oscA.start(at);
      oscB.start(at);
      oscA.stop(at + duration + 1.2);
      oscB.stop(at + duration + 1.2);
      break;
    }

    case 'horn': {
      // Noble JRPG French horn / brass swell
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const env = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, at);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(420, at);
      filter.frequency.linearRampToValueAtTime(950, at + 0.35);

      env.gain.setValueAtTime(0.0001, at);
      env.gain.linearRampToValueAtTime(0.055 * velocity, at + 0.22);
      env.gain.exponentialRampToValueAtTime(0.0001, at + duration + 0.7);

      osc.connect(filter);
      filter.connect(env);
      env.connect(output);

      osc.start(at);
      osc.stop(at + duration + 0.8);
      break;
    }

    case 'bass': {
      // Deep, rounded acoustic double-bass / sub foundation (NEVER slap-bass)
      const osc = ctx.createOscillator();
      const sub = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const env = ctx.createGain();

      osc.type = 'triangle';
      sub.type = 'sine';
      osc.frequency.setValueAtTime(freq, at);
      sub.frequency.setValueAtTime(freq, at);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(260, at);

      env.gain.setValueAtTime(0.0001, at);
      env.gain.linearRampToValueAtTime(0.09 * velocity, at + 0.04);
      env.gain.exponentialRampToValueAtTime(0.0001, at + duration + 0.5);

      osc.connect(filter);
      sub.connect(filter);
      filter.connect(env);
      env.connect(output);

      osc.start(at);
      sub.start(at);
      osc.stop(at + duration + 0.6);
      sub.stop(at + duration + 0.6);
      break;
    }

    case 'bell': {
      // Rare distant cathedral bell: Inharmonic FM synthesis ringing into the hall
      const carrier = ctx.createOscillator();
      const modulator = ctx.createOscillator();
      const modGain = ctx.createGain();
      const env = ctx.createGain();

      carrier.type = 'sine';
      modulator.type = 'sine';
      carrier.frequency.setValueAtTime(freq, at);
      modulator.frequency.setValueAtTime(freq * 2.756, at);

      modGain.gain.setValueAtTime(freq * 0.8, at);
      modGain.gain.exponentialRampToValueAtTime(0.01, at + duration * 1.5);

      env.gain.setValueAtTime(0.0001, at);
      env.gain.linearRampToValueAtTime(0.05 * velocity, at + 0.01);
      env.gain.exponentialRampToValueAtTime(0.0001, at + duration + 2.5);

      modulator.connect(modGain);
      modGain.connect(carrier.frequency);
      carrier.connect(env);
      env.connect(output);

      modulator.start(at);
      carrier.start(at);
      modulator.stop(at + duration + 2.6);
      carrier.stop(at + duration + 2.6);
      break;
    }

    case 'timpani': {
      // Dramatic, boomy orchestral bass drum / timpani for phrase cadences
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(95, at);
      osc.frequency.exponentialRampToValueAtTime(45, at + 0.25);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, at);

      env.gain.setValueAtTime(0.18 * velocity, at);
      env.gain.exponentialRampToValueAtTime(0.0001, at + 1.2);

      osc.connect(filter);
      filter.connect(env);
      env.connect(output);

      osc.start(at);
      osc.stop(at + 1.3);
      break;
    }
  }
}

/* -------------------------------------------------------------------------- */
/* Soundtrack Compositions (16 Thematic Musical Pieces)                       */
/* -------------------------------------------------------------------------- */

interface TrackScore {
  bpm: number;
  beatsPerBar: number;
  totalBars: number;
  level: number;
  chordVoice: InstrumentVoice;
  leadVoice: InstrumentVoice;
  accentVoice?: InstrumentVoice;
  chords: { root: number; intervals: number[] }[]; // One chord per bar (spacious, sustains full bar)
  bassNotes: (number | null)[];                    // Sparsely placed bass notes
  melody: { bar: number; beat: number; midi: number; len: number }[]; // Well-phrased lyrical notes
  rareBells?: number[];                            // Specific bars where a distant bell tolls
  rareTimpani?: number[];                          // Specific bars for cadence impact
}

const COMPOSITIONS: Record<MusicScene, TrackScore> = {
  // 1. Menu: "Requiem for the Stars" (Arc the Lad x Ethereal Original)
  // Key: E Minor (Em9 - Cmaj7 - Am9 - B7sus4 - Em - Gmaj7 - Cmaj7 - B7)
  menu: {
    bpm: 68,
    beatsPerBar: 4,
    totalBars: 8,
    level: 0.32,
    chordVoice: 'strings',
    leadVoice: 'flute',
    accentVoice: 'harp',
    chords: [
      { root: 52, intervals: [0, 7, 11, 14] }, // Em9
      { root: 48, intervals: [0, 7, 12, 16] }, // Cmaj7
      { root: 45, intervals: [0, 7, 12, 15] }, // Am7
      { root: 47, intervals: [0, 7, 10, 14] }, // B7sus4
      { root: 52, intervals: [0, 7, 12, 15] }, // Em
      { root: 55, intervals: [0, 7, 11, 14] }, // Gmaj7
      { root: 48, intervals: [0, 7, 12, 16] }, // Cmaj7
      { root: 47, intervals: [0, 6, 9, 15] },  // B7(b9) cadence
    ],
    bassNotes: [40, null, 36, null, 33, null, 35, null, 40, null, 43, null, 36, null, 35, null],
    melody: [
      // Beautiful lyrical phrasing with long breaths and rests
      { bar: 0, beat: 1.0, midi: 76, len: 1.8 }, // E5
      { bar: 0, beat: 3.0, midi: 79, len: 1.2 }, // G5
      { bar: 1, beat: 0.5, midi: 78, len: 1.5 }, // F#5
      { bar: 1, beat: 2.5, midi: 76, len: 2.0 }, // E5
      { bar: 2, beat: 1.0, midi: 71, len: 1.8 }, // B4
      { bar: 2, beat: 3.0, midi: 74, len: 1.2 }, // D5
      { bar: 3, beat: 0.5, midi: 76, len: 1.8 }, // E5
      { bar: 3, beat: 2.5, midi: 74, len: 2.2 }, // D5 (lingers into silence)
      { bar: 4, beat: 1.0, midi: 79, len: 1.6 }, // G5
      { bar: 4, beat: 3.0, midi: 83, len: 1.2 }, // B5
      { bar: 5, beat: 0.5, midi: 81, len: 1.6 }, // A5
      { bar: 5, beat: 2.5, midi: 79, len: 2.0 }, // G5
      { bar: 6, beat: 1.0, midi: 76, len: 1.8 }, // E5
      { bar: 6, beat: 3.0, midi: 74, len: 1.4 }, // D5
      { bar: 7, beat: 1.0, midi: 71, len: 2.8 }, // B4 resolving gently into the loop
    ],
    rareBells: [0, 4],
  },

  // 2. Crypt: "Catacombs of the Tarnished" (Elden Ring Dread & Silence)
  // Key: D Locrian / Minor Tension (Dm - Bb/D - Edim - Dm)
  crypt: {
    bpm: 54,
    beatsPerBar: 4,
    totalBars: 8,
    level: 0.28,
    chordVoice: 'strings',
    leadVoice: 'cello',
    accentVoice: 'bell',
    chords: [
      { root: 38, intervals: [0, 7, 12, 15] }, // Dm deep drone
      { root: 38, intervals: [0, 6, 12, 15] }, // D diminished tension
      { root: 34, intervals: [0, 8, 12, 15] }, // Bb/D
      { root: 38, intervals: [0, 6, 13, 15] }, // Elden dissonant cluster
      { root: 38, intervals: [0, 7, 12, 15] }, // Dm
      { root: 35, intervals: [0, 6, 12, 15] }, // Bdim
      { root: 34, intervals: [0, 7, 10, 15] }, // Bb
      { root: 37, intervals: [0, 6, 12, 15] }, // C#dim resolution
    ],
    bassNotes: [26, null, null, null, 22, null, null, null, 26, null, null, null, 23, null, null, null],
    melody: [
      // Sparse, sorrowful cello notes with bars of silence
      { bar: 1, beat: 0.5, midi: 50, len: 2.8 }, // Low D
      { bar: 1, beat: 3.5, midi: 53, len: 1.5 }, // F
      { bar: 2, beat: 1.5, midi: 56, len: 3.2 }, // Ab (tritone despair)
      { bar: 5, beat: 0.5, midi: 62, len: 2.8 }, // D octave higher
      { bar: 5, beat: 3.5, midi: 61, len: 2.0 }, // C# (mournful leading tone)
      { bar: 6, beat: 2.0, midi: 58, len: 3.5 }, // Bb decaying to silence
    ],
    rareBells: [0], // Only one solitary church bell every 8 bars
    rareTimpani: [4],
  },

  // 3. Town: "The Seacoast Haven" (Arc the Lad Nostalgic Peace)
  // Key: D Major (D - Gmaj7 - Bm7 - A7sus4 - G - D/F# - Em9 - D)
  town: {
    bpm: 72,
    beatsPerBar: 4,
    totalBars: 8,
    level: 0.3,
    chordVoice: 'strings',
    leadVoice: 'flute',
    accentVoice: 'harp',
    chords: [
      { root: 50, intervals: [0, 7, 12, 16] }, // Dmaj
      { root: 55, intervals: [0, 7, 11, 14] }, // Gmaj7
      { root: 47, intervals: [0, 7, 10, 14] }, // Bm7
      { root: 45, intervals: [0, 7, 10, 14] }, // A7sus4
      { root: 55, intervals: [0, 7, 12, 16] }, // G
      { root: 54, intervals: [0, 7, 12, 16] }, // D/F#
      { root: 52, intervals: [0, 7, 10, 14] }, // Em9
      { root: 50, intervals: [0, 7, 12, 16] }, // D resolve
    ],
    bassNotes: [38, null, 43, null, 35, null, 33, null, 43, null, 42, null, 40, null, 38, null],
    melody: [
      { bar: 0, beat: 1.0, midi: 74, len: 1.8 }, // D5
      { bar: 0, beat: 3.0, midi: 76, len: 1.2 }, // E5
      { bar: 1, beat: 0.5, midi: 78, len: 2.2 }, // F#5
      { bar: 1, beat: 3.0, midi: 74, len: 1.2 }, // D5
      { bar: 2, beat: 0.5, midi: 71, len: 2.5 }, // B4
      { bar: 3, beat: 1.0, midi: 69, len: 2.8 }, // A4
      { bar: 4, beat: 0.5, midi: 79, len: 1.8 }, // G5
      { bar: 4, beat: 2.5, midi: 78, len: 1.2 }, // F#5
      { bar: 5, beat: 0.5, midi: 74, len: 2.5 }, // D5
      { bar: 6, beat: 1.0, midi: 76, len: 2.2 }, // E5
      { bar: 7, beat: 0.5, midi: 74, len: 3.2 }, // D5 warm resolution
    ],
  },

  // 4. Combat: "Blade of Destiny" (Noble JRPG Combat, Castlevania / Arc the Lad II)
  // Key: D Minor (Dm - Bb - C - Am - Dm - Gm - A7 - Dm)
  combat: {
    bpm: 104,
    beatsPerBar: 4,
    totalBars: 8,
    level: 0.35,
    chordVoice: 'organ',
    leadVoice: 'horn',
    accentVoice: 'harp',
    chords: [
      { root: 50, intervals: [0, 7, 12, 15] }, // Dm
      { root: 46, intervals: [0, 8, 12, 15] }, // Bb
      { root: 48, intervals: [0, 7, 12, 16] }, // C
      { root: 45, intervals: [0, 7, 12, 15] }, // Am
      { root: 50, intervals: [0, 7, 12, 15] }, // Dm
      { root: 43, intervals: [0, 7, 10, 15] }, // Gm
      { root: 45, intervals: [0, 6, 9, 15] },  // A7
      { root: 50, intervals: [0, 7, 12, 15] }, // Dm
    ],
    // Tight acoustic cello/bass ostinato instead of buzzing slap-bass
    bassNotes: [38, 38, 34, 34, 36, 36, 33, 33, 38, 38, 31, 31, 33, 33, 38, 38],
    melody: [
      { bar: 0, beat: 0.0, midi: 62, len: 1.5 },
      { bar: 0, beat: 2.0, midi: 65, len: 1.0 },
      { bar: 0, beat: 3.0, midi: 67, len: 1.0 },
      { bar: 1, beat: 0.0, midi: 69, len: 2.5 },
      { bar: 2, beat: 0.0, midi: 72, len: 1.5 },
      { bar: 2, beat: 2.0, midi: 69, len: 1.5 },
      { bar: 3, beat: 0.0, midi: 65, len: 2.8 },
      { bar: 4, beat: 0.0, midi: 74, len: 2.0 },
      { bar: 5, beat: 0.0, midi: 70, len: 2.0 },
      { bar: 6, beat: 0.0, midi: 69, len: 2.0 },
      { bar: 7, beat: 0.0, midi: 62, len: 3.0 },
    ],
    rareTimpani: [0, 4, 7],
  },

  // 5. Boss: "Sovereign of the Blood Moon" (Elden Ring / Castlevania Dread)
  // Key: C Minor / C# Diminished (Cm - Ab - Fm - G7b9)
  boss: {
    bpm: 92,
    beatsPerBar: 4,
    totalBars: 8,
    level: 0.36,
    chordVoice: 'organ',
    leadVoice: 'choir',
    accentVoice: 'bell',
    chords: [
      { root: 48, intervals: [0, 7, 12, 15] }, // Cm
      { root: 44, intervals: [0, 8, 12, 15] }, // Ab
      { root: 41, intervals: [0, 7, 12, 15] }, // Fm
      { root: 43, intervals: [0, 6, 9, 15] },  // G7b9
      { root: 48, intervals: [0, 6, 12, 15] }, // Cdim
      { root: 44, intervals: [0, 8, 12, 15] }, // Ab
      { root: 43, intervals: [0, 7, 10, 15] }, // G
      { root: 48, intervals: [0, 7, 12, 15] }, // Cm
    ],
    bassNotes: [36, null, 32, null, 29, null, 31, null, 36, null, 32, null, 31, null, 36, null],
    melody: [
      { bar: 0, beat: 1.0, midi: 72, len: 2.5 },
      { bar: 1, beat: 0.5, midi: 68, len: 2.5 },
      { bar: 2, beat: 1.0, midi: 65, len: 2.5 },
      { bar: 3, beat: 0.5, midi: 67, len: 3.0 },
      { bar: 4, beat: 1.0, midi: 75, len: 2.5 },
      { bar: 5, beat: 0.5, midi: 72, len: 2.0 },
      { bar: 6, beat: 1.0, midi: 71, len: 2.5 },
      { bar: 7, beat: 0.5, midi: 72, len: 3.5 },
    ],
    rareBells: [0, 4],
    rareTimpani: [0, 2, 4, 6],
  },

  // 6. Cathedral: "Basilica of the Fallen Grace" (Sacred Pipe Organ & Choral Wash)
  // Key: G Minor (Gm - Eb - Bb - F - Cm - Gm - D7 - Gm)
  cathedral: {
    bpm: 52,
    beatsPerBar: 4,
    totalBars: 8,
    level: 0.32,
    chordVoice: 'organ',
    leadVoice: 'choir',
    accentVoice: 'bell',
    chords: [
      { root: 43, intervals: [0, 7, 12, 15] }, // Gm
      { root: 39, intervals: [0, 8, 12, 15] }, // Eb
      { root: 46, intervals: [0, 7, 12, 16] }, // Bb
      { root: 41, intervals: [0, 7, 12, 16] }, // F
      { root: 48, intervals: [0, 7, 12, 15] }, // Cm
      { root: 43, intervals: [0, 7, 12, 15] }, // Gm
      { root: 45, intervals: [0, 6, 9, 15] },  // D7
      { root: 43, intervals: [0, 7, 12, 15] }, // Gm
    ],
    bassNotes: [31, null, null, null, 27, null, null, null, 31, null, null, null, 33, null, null, null],
    melody: [
      { bar: 0, beat: 1.0, midi: 67, len: 2.8 },
      { bar: 1, beat: 1.0, midi: 70, len: 2.8 },
      { bar: 2, beat: 1.0, midi: 69, len: 2.8 },
      { bar: 3, beat: 1.0, midi: 65, len: 2.8 },
      { bar: 4, beat: 1.0, midi: 67, len: 2.8 },
      { bar: 6, beat: 1.0, midi: 66, len: 2.5 },
      { bar: 7, beat: 0.5, midi: 67, len: 3.5 },
    ],
    rareBells: [0],
  },

  // 7. Forest: "Mist of the Spirit Wood" (Arc the Lad / Secret of Mana Pastoral Calm)
  // Key: A Dorian (Am9 - Bm7/A - Cmaj7 - D9)
  forest: {
    bpm: 64,
    beatsPerBar: 4,
    totalBars: 8,
    level: 0.28,
    chordVoice: 'strings',
    leadVoice: 'flute',
    accentVoice: 'harp',
    chords: [
      { root: 45, intervals: [0, 7, 11, 14] }, // Am9
      { root: 47, intervals: [0, 7, 10, 14] }, // Bm7
      { root: 48, intervals: [0, 7, 12, 16] }, // Cmaj7
      { root: 50, intervals: [0, 7, 10, 14] }, // D9
      { root: 45, intervals: [0, 7, 11, 14] }, // Am9
      { root: 48, intervals: [0, 7, 12, 16] }, // Cmaj7
      { root: 47, intervals: [0, 7, 10, 14] }, // Bm7
      { root: 45, intervals: [0, 7, 12, 15] }, // Am
    ],
    bassNotes: [33, null, 35, null, 36, null, 38, null, 33, null, 36, null, 35, null, 33, null],
    melody: [
      { bar: 0, beat: 1.0, midi: 69, len: 2.0 },
      { bar: 0, beat: 3.5, midi: 71, len: 1.0 },
      { bar: 1, beat: 1.0, midi: 72, len: 2.2 },
      { bar: 2, beat: 0.5, midi: 76, len: 2.8 },
      { bar: 3, beat: 1.5, midi: 74, len: 2.5 },
      { bar: 4, beat: 1.0, midi: 79, len: 2.0 },
      { bar: 5, beat: 0.5, midi: 76, len: 2.5 },
      { bar: 6, beat: 1.0, midi: 72, len: 2.2 },
      { bar: 7, beat: 0.5, midi: 69, len: 3.5 },
    ],
  },

  // 8. Dungeon: "Iron Oubliette" (Spacious, Dread-Filled Drone with Minimal Notes)
  // Key: F Minor (Fm - Db/F - Bbm/F - C7)
  dungeon: {
    bpm: 50,
    beatsPerBar: 4,
    totalBars: 8,
    level: 0.28,
    chordVoice: 'strings',
    leadVoice: 'cello',
    chords: [
      { root: 41, intervals: [0, 7, 12, 15] }, // Fm
      { root: 41, intervals: [0, 8, 12, 15] }, // Db/F
      { root: 41, intervals: [0, 6, 12, 15] }, // Diminished tension
      { root: 36, intervals: [0, 7, 10, 16] }, // C7
      { root: 41, intervals: [0, 7, 12, 15] }, // Fm
      { root: 37, intervals: [0, 8, 12, 15] }, // Db
      { root: 36, intervals: [0, 6, 9, 15] },  // C dim
      { root: 41, intervals: [0, 7, 12, 15] }, // Fm
    ],
    // Only 4-5 spaced-out bass notes creating deep dread
    bassNotes: [29, null, null, null, 25, null, null, null, 29, null, null, null, 24, null, null, null],
    melody: [
      { bar: 1, beat: 2.0, midi: 53, len: 3.0 },
      { bar: 3, beat: 1.0, midi: 52, len: 2.8 },
      { bar: 5, beat: 2.0, midi: 56, len: 3.0 },
      { bar: 7, beat: 1.0, midi: 53, len: 3.5 },
    ],
    rareTimpani: [0, 4],
  },

  // 9. Tavern: "The Minstrel's Tale" (Arc the Lad / Medieval Renaissance Warmth)
  // Key: G Major (G - C - D - G / Em - C - Am7 - D7)
  tavern: {
    bpm: 78,
    beatsPerBar: 4,
    totalBars: 8,
    level: 0.3,
    chordVoice: 'harp',
    leadVoice: 'flute',
    accentVoice: 'strings',
    chords: [
      { root: 55, intervals: [0, 7, 12, 16] }, // G
      { root: 48, intervals: [0, 7, 12, 16] }, // C
      { root: 50, intervals: [0, 7, 12, 16] }, // D
      { root: 55, intervals: [0, 7, 12, 16] }, // G
      { root: 52, intervals: [0, 7, 12, 15] }, // Em
      { root: 48, intervals: [0, 7, 12, 16] }, // C
      { root: 45, intervals: [0, 7, 10, 15] }, // Am7
      { root: 50, intervals: [0, 7, 10, 16] }, // D7
    ],
    bassNotes: [43, null, 36, null, 38, null, 43, null, 40, null, 36, null, 33, null, 38, null],
    melody: [
      { bar: 0, beat: 0.5, midi: 71, len: 1.5 },
      { bar: 0, beat: 2.5, midi: 74, len: 1.2 },
      { bar: 1, beat: 0.5, midi: 72, len: 2.0 },
      { bar: 2, beat: 0.5, midi: 74, len: 1.8 },
      { bar: 3, beat: 0.5, midi: 71, len: 2.5 },
      { bar: 4, beat: 0.5, midi: 76, len: 2.0 },
      { bar: 5, beat: 0.5, midi: 72, len: 2.0 },
      { bar: 6, beat: 0.5, midi: 69, len: 2.2 },
      { bar: 7, beat: 0.5, midi: 67, len: 3.2 },
    ],
  },

  // 10. Graveyard: "Garden of Whispering Souls" (Castlevania Gothic Solitude)
  // Key: C# Minor (C#m - A - F#m - G#7)
  graveyard: {
    bpm: 56,
    beatsPerBar: 4,
    totalBars: 8,
    level: 0.28,
    chordVoice: 'organ',
    leadVoice: 'cello',
    accentVoice: 'bell',
    chords: [
      { root: 49, intervals: [0, 7, 12, 15] }, // C#m
      { root: 45, intervals: [0, 8, 12, 15] }, // A
      { root: 42, intervals: [0, 7, 12, 15] }, // F#m
      { root: 44, intervals: [0, 6, 9, 15] },  // G#7
      { root: 49, intervals: [0, 7, 12, 15] }, // C#m
      { root: 45, intervals: [0, 8, 12, 15] }, // A
      { root: 44, intervals: [0, 7, 10, 16] }, // G#
      { root: 49, intervals: [0, 7, 12, 15] }, // C#m
    ],
    bassNotes: [37, null, 33, null, 30, null, 32, null, 37, null, 33, null, 32, null, 37, null],
    melody: [
      { bar: 0, beat: 1.0, midi: 61, len: 2.5 },
      { bar: 1, beat: 0.5, midi: 64, len: 2.8 },
      { bar: 2, beat: 1.0, midi: 66, len: 2.2 },
      { bar: 3, beat: 0.5, midi: 68, len: 3.0 },
      { bar: 4, beat: 1.0, midi: 73, len: 2.5 },
      { bar: 5, beat: 0.5, midi: 69, len: 2.8 },
      { bar: 6, beat: 1.0, midi: 68, len: 2.5 },
      { bar: 7, beat: 0.5, midi: 61, len: 3.5 },
    ],
    rareBells: [0],
  },

  // 11. Castle: "Colonnade of the Crimson Moon" (Symphony of the Night Baroque Majesty)
  // Key: D Minor (Dm - Bb - Gm - A7 - Dm - F - C - A7)
  castle: {
    bpm: 76,
    beatsPerBar: 4,
    totalBars: 8,
    level: 0.32,
    chordVoice: 'organ',
    leadVoice: 'harp',
    accentVoice: 'bell',
    chords: [
      { root: 50, intervals: [0, 7, 12, 15] }, // Dm
      { root: 46, intervals: [0, 8, 12, 15] }, // Bb
      { root: 43, intervals: [0, 7, 12, 15] }, // Gm
      { root: 45, intervals: [0, 6, 9, 15] },  // A7
      { root: 50, intervals: [0, 7, 12, 15] }, // Dm
      { root: 53, intervals: [0, 7, 12, 16] }, // F
      { root: 48, intervals: [0, 7, 12, 16] }, // C
      { root: 45, intervals: [0, 6, 9, 15] },  // A7
    ],
    bassNotes: [38, null, 34, null, 31, null, 33, null, 38, null, 41, null, 36, null, 33, null],
    melody: [
      { bar: 0, beat: 0.5, midi: 74, len: 1.8 },
      { bar: 0, beat: 2.5, midi: 77, len: 1.2 },
      { bar: 1, beat: 0.5, midi: 76, len: 2.2 },
      { bar: 2, beat: 0.5, midi: 79, len: 2.0 },
      { bar: 3, beat: 0.5, midi: 81, len: 2.8 },
      { bar: 4, beat: 0.5, midi: 82, len: 1.8 },
      { bar: 5, beat: 0.5, midi: 81, len: 2.2 },
      { bar: 6, beat: 0.5, midi: 77, len: 2.0 },
      { bar: 7, beat: 0.5, midi: 74, len: 3.2 },
    ],
    rareBells: [0, 4],
  },

  // 12. Ruins: "Relics of the Fallen Empire" (Elden Ring Solitary Desolation)
  // Key: Bb Minor (Bbm - Gbmaj7 - Ebm7 - F7sus4)
  ruins: {
    bpm: 50,
    beatsPerBar: 4,
    totalBars: 8,
    level: 0.28,
    chordVoice: 'strings',
    leadVoice: 'cello',
    accentVoice: 'bell',
    chords: [
      { root: 46, intervals: [0, 7, 12, 15] }, // Bbm
      { root: 42, intervals: [0, 7, 11, 14] }, // Gbmaj7
      { root: 39, intervals: [0, 7, 10, 14] }, // Ebm7
      { root: 41, intervals: [0, 7, 10, 15] }, // F7sus4
      { root: 46, intervals: [0, 7, 12, 15] }, // Bbm
      { root: 42, intervals: [0, 7, 11, 14] }, // Gbmaj7
      { root: 41, intervals: [0, 6, 9, 15] },  // F7
      { root: 46, intervals: [0, 7, 12, 15] }, // Bbm
    ],
    bassNotes: [34, null, null, null, 30, null, null, null, 34, null, null, null, 29, null, null, null],
    melody: [
      { bar: 1, beat: 1.0, midi: 58, len: 3.0 },
      { bar: 2, beat: 2.0, midi: 61, len: 2.5 },
      { bar: 3, beat: 1.0, midi: 65, len: 3.2 },
      { bar: 5, beat: 1.0, midi: 66, len: 2.8 },
      { bar: 6, beat: 2.0, midi: 65, len: 2.5 },
      { bar: 7, beat: 1.0, midi: 58, len: 3.5 },
    ],
    rareBells: [0],
  },

  // 13. Library: "Archive of the Arcane" (Contemplative & Mystical)
  // Key: B Minor (Bm9 - Gmaj7 - Em9 - F#7sus4)
  library: {
    bpm: 60,
    beatsPerBar: 4,
    totalBars: 8,
    level: 0.28,
    chordVoice: 'strings',
    leadVoice: 'harp',
    accentVoice: 'flute',
    chords: [
      { root: 47, intervals: [0, 7, 11, 14] }, // Bm9
      { root: 43, intervals: [0, 7, 11, 14] }, // Gmaj7
      { root: 40, intervals: [0, 7, 10, 14] }, // Em9
      { root: 42, intervals: [0, 7, 10, 15] }, // F#7sus4
      { root: 47, intervals: [0, 7, 11, 14] }, // Bm9
      { root: 43, intervals: [0, 7, 11, 14] }, // Gmaj7
      { root: 42, intervals: [0, 6, 9, 15] },  // F#7
      { root: 47, intervals: [0, 7, 12, 15] }, // Bm
    ],
    bassNotes: [35, null, 31, null, 28, null, 30, null, 35, null, 31, null, 30, null, 35, null],
    melody: [
      { bar: 0, beat: 1.0, midi: 71, len: 2.2 },
      { bar: 1, beat: 1.0, midi: 74, len: 2.0 },
      { bar: 2, beat: 1.0, midi: 76, len: 2.5 },
      { bar: 3, beat: 1.0, midi: 73, len: 2.8 },
      { bar: 4, beat: 1.0, midi: 78, len: 2.0 },
      { bar: 5, beat: 1.0, midi: 74, len: 2.2 },
      { bar: 6, beat: 1.0, midi: 73, len: 2.5 },
      { bar: 7, beat: 1.0, midi: 71, len: 3.2 },
    ],
  },

  // 14. Abyss: "The Nameless Void" (Deep Sub-Drone & Void Silence)
  // Key: C Sub-Pedal with Dissonant Overtone Whispers
  abyss: {
    bpm: 46,
    beatsPerBar: 4,
    totalBars: 8,
    level: 0.28,
    chordVoice: 'strings',
    leadVoice: 'choir',
    chords: [
      { root: 36, intervals: [0, 7, 12, 13] }, // Deep low C with minor 2nd clash
      { root: 36, intervals: [0, 6, 12, 15] },
      { root: 36, intervals: [0, 7, 11, 14] },
      { root: 36, intervals: [0, 5, 12, 15] },
      { root: 36, intervals: [0, 7, 12, 13] },
      { root: 36, intervals: [0, 6, 12, 15] },
      { root: 36, intervals: [0, 7, 11, 14] },
      { root: 36, intervals: [0, 7, 12, 15] },
    ],
    bassNotes: [24, null, null, null, 24, null, null, null, 24, null, null, null, 24, null, null, null],
    melody: [
      { bar: 1, beat: 2.0, midi: 48, len: 3.5 },
      { bar: 3, beat: 1.0, midi: 47, len: 3.5 },
      { bar: 5, beat: 2.0, midi: 51, len: 3.5 },
      { bar: 7, beat: 1.0, midi: 48, len: 4.0 },
    ],
    rareTimpani: [0],
  },

  // 15. Victory: "Dawn Over the Kingdom" (Arc the Lad / Final Fantasy Grandeur)
  // Key: D Major (D - A/C# - Bm7 - Gmaj7 - D - Em7 - A7sus4 - D)
  victory: {
    bpm: 80,
    beatsPerBar: 4,
    totalBars: 8,
    level: 0.33,
    chordVoice: 'strings',
    leadVoice: 'horn',
    accentVoice: 'bell',
    chords: [
      { root: 50, intervals: [0, 7, 12, 16] }, // D
      { root: 49, intervals: [0, 7, 12, 16] }, // A/C#
      { root: 47, intervals: [0, 7, 10, 14] }, // Bm7
      { root: 43, intervals: [0, 7, 11, 14] }, // Gmaj7
      { root: 50, intervals: [0, 7, 12, 16] }, // D
      { root: 40, intervals: [0, 7, 10, 14] }, // Em7
      { root: 45, intervals: [0, 7, 10, 14] }, // A7sus4
      { root: 50, intervals: [0, 7, 12, 16] }, // D
    ],
    bassNotes: [38, null, 37, null, 35, null, 31, null, 38, null, 28, null, 33, null, 38, null],
    melody: [
      { bar: 0, beat: 0.5, midi: 74, len: 1.8 },
      { bar: 0, beat: 2.5, midi: 76, len: 1.2 },
      { bar: 1, beat: 0.5, midi: 78, len: 2.5 },
      { bar: 2, beat: 0.5, midi: 81, len: 2.0 },
      { bar: 3, beat: 0.5, midi: 79, len: 2.5 },
      { bar: 4, beat: 0.5, midi: 86, len: 2.0 },
      { bar: 5, beat: 0.5, midi: 83, len: 2.0 },
      { bar: 6, beat: 0.5, midi: 81, len: 2.5 },
      { bar: 7, beat: 0.5, midi: 74, len: 3.5 },
    ],
    rareBells: [0, 4],
    rareTimpani: [0, 4, 7],
  },

  // 16. Game Over: "Rest, Weary Soul" (Solemn Baroque Epitaph)
  // Key: A Minor (Am - Fmaj7 - Dm9 - E7 - Am)
  gameover: {
    bpm: 50,
    beatsPerBar: 4,
    totalBars: 8,
    level: 0.28,
    chordVoice: 'strings',
    leadVoice: 'cello',
    accentVoice: 'bell',
    chords: [
      { root: 45, intervals: [0, 7, 12, 15] }, // Am
      { root: 41, intervals: [0, 7, 11, 14] }, // Fmaj7
      { root: 38, intervals: [0, 7, 10, 14] }, // Dm9
      { root: 40, intervals: [0, 6, 9, 15] },  // E7
      { root: 45, intervals: [0, 7, 12, 15] }, // Am
      { root: 41, intervals: [0, 7, 11, 14] }, // Fmaj7
      { root: 40, intervals: [0, 6, 9, 15] },  // E7
      { root: 45, intervals: [0, 7, 12, 15] }, // Am
    ],
    bassNotes: [33, null, null, null, 29, null, null, null, 33, null, null, null, 28, null, null, null],
    melody: [
      { bar: 0, beat: 1.0, midi: 57, len: 2.5 },
      { bar: 1, beat: 1.0, midi: 60, len: 2.5 },
      { bar: 2, beat: 1.0, midi: 62, len: 2.5 },
      { bar: 3, beat: 1.0, midi: 64, len: 3.0 },
      { bar: 4, beat: 1.0, midi: 65, len: 2.5 },
      { bar: 5, beat: 1.0, midi: 60, len: 2.5 },
      { bar: 6, beat: 1.0, midi: 59, len: 2.5 },
      { bar: 7, beat: 1.0, midi: 57, len: 3.5 },
    ],
    rareBells: [0],
  },
};

/* -------------------------------------------------------------------------- */
/* Web Audio Lookahead Sequencer Engine                                       */
/* -------------------------------------------------------------------------- */

function scheduleMeasure(score: TrackScore, bar: number, beat: number, audioTime: number, output: GainNode) {
  const beatDuration = 60 / score.bpm;

  // 1. Chords (Play only on downbeat of the bar, letting strings/pads sustain across the bar)
  if (beat === 0) {
    const chord = score.chords[bar % score.chords.length];
    chord.intervals.forEach((interval) => {
      playVoice(score.chordVoice, chord.root + interval, audioTime, beatDuration * (score.beatsPerBar - 0.2), output, 0.85);
    });

    // Rare distant bells on specific bars
    if (score.rareBells && score.rareBells.includes(bar)) {
      playVoice('bell', chord.root + 24, audioTime, beatDuration * 3.5, output, 0.7);
    }

    // Rare cadence timpani
    if (score.rareTimpani && score.rareTimpani.includes(bar)) {
      playVoice('timpani', 40, audioTime, 1.2, output, 1.0);
    }
  }

  // 2. Bass (Acoustic low end placed on specific half-bars)
  const bassIndex = bar * 2 + Math.floor(beat / 2);
  if (beat % 2 === 0 && score.bassNotes[bassIndex % score.bassNotes.length] !== null) {
    const bassMidi = score.bassNotes[bassIndex % score.bassNotes.length];
    if (bassMidi) {
      playVoice('bass', bassMidi, audioTime, beatDuration * 1.8, output, 0.9);
    }
  }

  // 3. Melody notes matching this exact measure and beat
  score.melody.forEach((note) => {
    if (note.bar === bar && Math.abs(note.beat - beat) < 0.25) {
      playVoice(score.leadVoice, note.midi, audioTime, note.len * beatDuration, output, 1.0);

      // Subtle harp accent in unison/octave if specified
      if (score.accentVoice === 'harp') {
        playVoice('harp', note.midi, audioTime + 0.02, note.len * 0.8 * beatDuration, output, 0.4);
      }
    }
  });
}

function clockTick() {
  if (!context || !enabled || !activeTrack) return;
  const score = COMPOSITIONS[scene] || COMPOSITIONS.menu;
  const beatDuration = 60 / score.bpm;
  const stepDuration = beatDuration / 2; // Check on 8th-note boundaries

  while (nextStepTime < context.currentTime + SCHEDULE_AHEAD_SEC) {
    const totalStepsInBar = score.beatsPerBar * 2;
    const bar = Math.floor(currentStep / totalStepsInBar) % score.totalBars;
    const beat = (currentStep % totalStepsInBar) / 2;

    scheduleMeasure(score, bar, beat, nextStepTime, activeTrack);

    currentStep = (currentStep + 1) % (score.totalBars * totalStepsInBar);
    nextStepTime += stepDuration;
  }
}

function startTrack() {
  if (!context || !musicBus) return;
  if (sequencerTimer !== null) window.clearInterval(sequencerTimer);

  // Smooth crossfade out old track
  if (activeTrack) {
    const fading = activeTrack;
    ramp(fading, 0.00001, 0.4);
    setTimeout(() => fading.disconnect(), 1500);
  }

  const score = COMPOSITIONS[scene] || COMPOSITIONS.menu;

  const newTrack = context.createGain();
  newTrack.gain.value = 0.0001;
  newTrack.connect(musicBus);
  activeTrack = newTrack;

  ramp(newTrack, score.level * settings.musicVolume, 0.8);
  currentStep = 0;
  nextStepTime = context.currentTime + 0.08;

  clockTick();
  sequencerTimer = window.setInterval(clockTick, LOOKAHEAD_INTERVAL_MS);
}

/* -------------------------------------------------------------------------- */
/* Sound Effects (SFX Engine preserved & fully integrated)                    */
/* -------------------------------------------------------------------------- */

function playTone(
  frequency: number,
  options: {
    delay?: number;
    duration?: number;
    peak?: number;
    type?: OscillatorType;
    endFrequency?: number;
    filter?: number;
  } = {}
) {
  const ctx = context,
    output = sfxBus;
  if (!ctx || !output) return;
  const at = ctx.currentTime + (options.delay || 0);
  const duration = options.duration ?? 0.2;
  const oscillator = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const envelope = ctx.createGain();
  oscillator.type = options.type || 'sine';
  oscillator.frequency.setValueAtTime(frequency, at);
  if (options.endFrequency)
    oscillator.frequency.exponentialRampToValueAtTime(options.endFrequency, at + duration);
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(options.filter || 3600, at);
  envelope.gain.setValueAtTime(0.0001, at);
  envelope.gain.exponentialRampToValueAtTime(options.peak ?? 0.12, at + 0.012);
  envelope.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  oscillator.connect(filter);
  filter.connect(envelope);
  envelope.connect(output);
  oscillator.start(at);
  oscillator.stop(at + duration + 0.01);
  oscillator.onended = () => {
    oscillator.disconnect();
    filter.disconnect();
    envelope.disconnect();
  };
}

function playNoise(
  options: {
    duration?: number;
    peak?: number;
    delay?: number;
    low?: number;
    high?: number;
    endHigh?: number;
    type?: BiquadFilterType;
    q?: number;
    attack?: number;
  } = {}
) {
  const ctx = context,
    output = sfxBus;
  if (!ctx || !output) return;
  const duration = options.duration ?? 0.16;
  const at = ctx.currentTime + (options.delay || 0);
  const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate);
  const samples = buffer.getChannelData(0);
  for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
  const noise = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const envelope = ctx.createGain();
  noise.buffer = buffer;
  filter.type = options.type || 'bandpass';
  filter.frequency.setValueAtTime(options.low || 800, at);
  filter.Q.value = options.q || 0.8;
  if (options.endHigh) filter.frequency.exponentialRampToValueAtTime(options.endHigh, at + duration);
  else filter.frequency.setValueAtTime(options.high || options.low || 800, at);
  envelope.gain.setValueAtTime(0.0001, at);
  envelope.gain.linearRampToValueAtTime(
    options.peak ?? 0.12,
    at + Math.min(options.attack ?? 0.015, duration * 0.35)
  );
  envelope.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  noise.connect(filter);
  filter.connect(envelope);
  envelope.connect(output);
  noise.start(at);
  noise.stop(at + duration + 0.01);
  noise.onended = () => {
    noise.disconnect();
    filter.disconnect();
    envelope.disconnect();
  };
}

/* -------------------------------------------------------------------------- */
/* Public API Exports                                                         */
/* -------------------------------------------------------------------------- */

export function setMusicScene(next: MusicScene) {
  if (scene === next) return;
  scene = next;
  if (enabled) startTrack();
}

export function getAudioSettings() {
  return { ...settings, enabled };
}

export function isMusicEnabled() {
  return enabled;
}

export function subscribeAudioSettings(listener: () => void) {
  settingsListeners.add(listener);
  return () => settingsListeners.delete(listener);
}

export function setMusicVolume(value: number) {
  settings.musicVolume = clamp(value, settings.musicVolume);
  saveSettings();
  if (activeTrack) {
    const score = COMPOSITIONS[scene] || COMPOSITIONS.menu;
    ramp(activeTrack, enabled ? score.level * settings.musicVolume : 0.0001);
  }
  notifySettings();
}

export function setSfxVolume(value: number) {
  settings.sfxVolume = clamp(value, settings.sfxVolume);
  saveSettings();
  if (enabled) ramp(sfxBus, settings.sfxVolume);
  synth.setMasterVolume(settings.sfxVolume);
  notifySettings();
}

export function playSfx(name: string, volume = 1) {
  if (!enabled || !context || !sfxBus) return;
  const level = clamp(volume, 1);
  if (level === 0) return;

  const sc = (fn: () => void) => {
    try {
      if (synth.ensureContext()) fn();
    } catch {
      /* never break the frame */
    }
  };

  switch (name) {
    case 'dice':         sc(() => synth.playDiceRoll()); return;
    case 'fanfare':      sc(() => synth.playLevelUp()); return;
    case 'crit-success': sc(() => synth.playCriticalSuccess()); return;
    case 'crit-fail':    sc(() => synth.playCriticalFail()); return;
    case 'gold':         sc(() => synth.playGoldClink()); return;
    case 'door-open':    sc(() => synth.playDoorOpen()); return;
    case 'door-close':   sc(() => synth.playDoorClose()); return;
    case 'door-locked':  sc(() => synth.playDoorLocked()); return;
    case 'uiclick':      sc(() => synth.playUIClick()); return;
    case 'your-turn':    sc(() => synth.playYourTurn()); return;
    case 'elem:fire':      sc(() => synth.playElementSound('fire')); return;
    case 'elem:frost':     sc(() => synth.playElementSound('frost')); return;
    case 'elem:lightning': sc(() => synth.playElementSound('lightning')); return;
    case 'elem:acid':      sc(() => synth.playElementSound('acid')); return;
    case 'elem:holy':      sc(() => synth.playElementSound('holy')); return;
    case 'elem:dark':      sc(() => synth.playElementSound('dark')); return;
    case 'elem:force':     sc(() => synth.playElementSound('force')); return;
    case 'elem:thunder':   sc(() => synth.playElementSound('thunder')); return;
    case 'elem:slash':     sc(() => synth.playElementSound('slash')); return;
    case 'elem:impact':    sc(() => synth.playElementSound('impact')); return;
    case 'elem:smoke':     sc(() => synth.playElementSound('smoke')); return;
  }

  switch (name) {
    case 'step':
      playNoise({ duration: 0.075, peak: 0.2 * level, low: 90, high: 310, attack: 0.003, q: 1.2 });
      playTone(105, { duration: 0.09, peak: 0.12 * level, type: 'triangle', endFrequency: 62, filter: 360 });
      playNoise({ duration: 0.055, peak: 0.07 * level, delay: 0.012, low: 520, high: 1300, type: 'bandpass' });
      break;
    case 'fire':
      playNoise({ duration: 0.22, peak: 0.1 * level, low: 500, high: 1500, type: 'bandpass' });
      playNoise({ duration: 0.045, peak: 0.11 * level, delay: 0.01 + Math.random() * 0.05, low: 1100, high: 2400 });
      break;
    case 'door':
      playNoise({ duration: 0.42, peak: 0.16 * level, low: 110, high: 620, endHigh: 180, type: 'bandpass', q: 1.8 });
      playNoise({ duration: 0.18, peak: 0.1 * level, delay: 0.28, low: 65, high: 210, attack: 0.01 });
      playTone(145, { duration: 0.26, peak: 0.07 * level, type: 'triangle', endFrequency: 76, delay: 0.25, filter: 420 });
      break;
    case 'type':
      playNoise({ duration: 0.025, peak: 0.045 * level, low: 1500, high: 3000, type: 'highpass' });
      break;
    case 'ui':
      playTone(740, { duration: 0.075, peak: 0.1 * level, type: 'sine', endFrequency: 520 });
      playNoise({ duration: 0.04, peak: 0.045 * level, low: 1800, high: 3600 });
      break;
    case 'attack':
      playNoise({ duration: 0.28, peak: 0.19 * level, low: 700, high: 2200, endHigh: 230, type: 'bandpass' });
      playTone(180, { duration: 0.2, peak: 0.08 * level, type: 'triangle', endFrequency: 85 });
      break;
    case 'shoot':
      playNoise({ duration: 0.2, peak: 0.16 * level, low: 1200, high: 3600, endHigh: 500, type: 'bandpass' });
      playTone(520, { duration: 0.09, peak: 0.1 * level, type: 'triangle', endFrequency: 170 });
      break;
    case 'spell':
      playNoise({ duration: 0.48, peak: 0.13 * level, low: 2800, endHigh: 360, attack: 0.1, q: 4.5 });
      [294, 440, 587].forEach((frequency, index) => {
        playTone(frequency, { delay: index * 0.04, duration: 0.52, peak: 0.075 * level, type: 'triangle', endFrequency: frequency * 1.35 });
        playTone(frequency * 1.006, { delay: index * 0.04, duration: 0.48, peak: 0.035 * level, type: 'sine', endFrequency: frequency * 1.4 });
      });
      playTone(310, { delay: 0.24, duration: 0.2, peak: 0.075 * level, type: 'sawtooth', endFrequency: 920, filter: 2600 });
      break;
    case 'heal':
      playNoise({ duration: 0.85, peak: 0.1 * level, low: 180, endHigh: 3600, attack: 0.2, q: 4.5 });
      [523, 659, 784, 988, 1175].forEach((frequency, index) => {
        playTone(frequency, { delay: index * 0.06, duration: 0.52, peak: 0.08 * level, type: 'sine' });
        playTone(frequency * 1.006, { delay: index * 0.06, duration: 0.48, peak: 0.035 * level, type: 'triangle' });
      });
      break;
    case 'buff':
      playTone(392, { duration: 0.48, peak: 0.1 * level, type: 'triangle', endFrequency: 587 });
      playTone(784, { delay: 0.1, duration: 0.42, peak: 0.065 * level, type: 'sine' });
      break;
    case 'hit':
      playNoise({ duration: 0.025, peak: 0.11 * level, low: 3200, high: 5600, type: 'highpass' });
      playNoise({ duration: 0.16, peak: 0.22 * level, low: 95, high: 520, q: 4 });
      playTone(100, { duration: 0.18, peak: 0.16 * level, type: 'sawtooth', endFrequency: 48, filter: 650 });
      break;
    case 'crit':
      playNoise({ duration: 0.025, peak: 0.15 * level, low: 3400, high: 6000, type: 'highpass' });
      playNoise({ duration: 0.24, peak: 0.28 * level, low: 450, high: 1800 });
      playTone(130, { duration: 0.25, peak: 0.2 * level, type: 'sawtooth', endFrequency: 42, filter: 700 });
      playTone(880, { duration: 0.22, peak: 0.11 * level, type: 'triangle', endFrequency: 1320 });
      break;
    case 'miss':
      playNoise({ duration: 0.21, peak: 0.13 * level, low: 800, high: 2400, endHigh: 350 });
      break;
    case 'die':
      playTone(180, { duration: 0.72, peak: 0.16 * level, type: 'triangle', endFrequency: 48, filter: 900 });
      playNoise({ duration: 0.38, peak: 0.07 * level, low: 280, high: 950, endHigh: 180 });
      break;
  }
}

export async function setAudioEnabled(next: boolean): Promise<boolean> {
  if (!next) {
    enabled = false;
    if (sequencerTimer !== null) window.clearInterval(sequencerTimer);
    sequencerTimer = null;
    if (activeTrack) ramp(activeTrack, 0.00001, 0.05);
    ramp(sfxBus, 0.00001, 0.05);
    notifySettings();
    return true;
  }

  createContext();
  if (!context || !sfxBus) return false;
  await context.resume();
  enabled = true;
  ramp(sfxBus, settings.sfxVolume);
  synth.unlock();                               // ported synth rides the same gesture
  synth.setMasterVolume(settings.sfxVolume);
  startTrack();
  notifySettings();
  return true;
}

export async function toggleMusic() {
  return setAudioEnabled(!enabled);
}

// damage type → synth element cue (P2.6 impact sounds; Engine routes by it)
export const ELEMENT_SFX: Record<string, string> = {
  fire: 'elem:fire', cold: 'elem:frost', frost: 'elem:frost', lightning: 'elem:lightning',
  acid: 'elem:acid', poison: 'elem:acid', radiant: 'elem:holy', necrotic: 'elem:dark',
  psychic: 'elem:force', force: 'elem:force', thunder: 'elem:thunder',
  slashing: 'elem:slash', piercing: 'elem:slash', bludgeoning: 'elem:impact',
  healing: 'elem:holy',
};
