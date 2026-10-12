export type MusicScene = 'menu' | 'crypt' | 'combat' | 'town';

type Voice = 'pad' | 'bass' | 'lead' | 'drone';

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
let sequencer: number | null = null;
let enabled = false;
let scene: MusicScene = 'menu';
let step = 0;
let settings = loadSettings();

const menuRoots = [52, 48, 50, 47, 52, 55, 48, 47];
const menuMelody = [null, 76, null, 79, 78, null, 76, null, 71, null, 74, null, 76, null, 79, null,
  74, null, 71, null, 69, null, 67, null, 66, null, 69, null, 71, null, 74, null];
const cryptRoots = [38, 35, 31, 33, 38, 36, 31, 35];
const combatRoots = [38, 41, 43, 36, 38, 34, 41, 36];
const townRoots = [45, 48, 50, 43, 45, 52, 48, 43];
const cryptMelody = [null, null, 50, null, null, 53, null, null, 57, null, null, 53, null, 50, null, null];

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

function ramp(node: GainNode | null, value: number, timeConstant = 0.08) {
  if (!node || !context) return;
  node.gain.cancelScheduledValues(context.currentTime);
  node.gain.setTargetAtTime(value, context.currentTime, timeConstant);
}

function createContext() {
  if (context) return;
  const AudioContextClass = window.AudioContext;
  if (!AudioContextClass) return;

  context = new AudioContextClass();
  master = context.createGain();
  musicBus = context.createGain();
  sfxBus = context.createGain();
  const compressor = context.createDynamicsCompressor();
  compressor.threshold.value = -18;
  compressor.knee.value = 12;
  compressor.ratio.value = 3;
  compressor.attack.value = 0.004;
  compressor.release.value = 0.25;
  master.gain.value = 1;
  musicBus.gain.value = 1;
  sfxBus.gain.value = 0;
  musicBus.connect(master);
  sfxBus.connect(master);
  master.connect(compressor);
  compressor.connect(context.destination);

  const delay = context.createDelay(1);
  const feedback = context.createGain();
  const wet = context.createGain();
  delay.delayTime.value = scene === 'crypt' ? 0.48 : scene === 'town' ? 0.28 : 0.34;
  feedback.gain.value = scene === 'crypt' ? 0.28 : scene === 'town' ? 0.14 : 0.18;
  wet.gain.value = 0.16;
  musicBus.connect(delay);
  delay.connect(feedback);
  feedback.connect(delay);
  delay.connect(wet);
  wet.connect(master);
}

function playNote(midi: number, at: number, duration: number, voice: Voice, output: AudioNode) {
  const ctx = context;
  if (!ctx) return;
  const oscillator = ctx.createOscillator();
  const envelope = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  const frequency = 440 * Math.pow(2, (midi - 69) / 12);
  oscillator.type = voice === 'lead' ? 'sine' : voice === 'pad' ? 'triangle' : voice === 'drone' ? 'sine' : 'sawtooth';
  oscillator.frequency.setValueAtTime(frequency, at);
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(voice === 'lead' ? 1800 : voice === 'pad' ? 760 : voice === 'drone' ? 260 : 380, at);
  const peak = voice === 'lead' ? 0.055 : voice === 'pad' ? 0.026 : voice === 'drone' ? 0.035 : 0.06;
  const attack = voice === 'lead' ? 0.05 : voice === 'pad' || voice === 'drone' ? 0.8 : 0.08;
  envelope.gain.setValueAtTime(0.0001, at);
  envelope.gain.exponentialRampToValueAtTime(peak, at + attack);
  envelope.gain.setTargetAtTime(0.0001, at + Math.max(attack, duration * 0.72), voice === 'pad' || voice === 'drone' ? 0.65 : 0.16);
  oscillator.connect(filter);
  filter.connect(envelope);
  envelope.connect(output);
  oscillator.start(at);
  oscillator.stop(at + duration + (voice === 'pad' || voice === 'drone' ? 2.5 : 0.6));
  oscillator.onended = () => { oscillator.disconnect(); filter.disconnect(); envelope.disconnect(); };
}

function tick() {
  const ctx = context;
  const output = activeTrack;
  if (!ctx || !output || !enabled) return;
  const at = ctx.currentTime + 0.04;
  const bar = Math.floor(step / 8) % 8;
  const beat = step % 8;

  if (scene === 'menu') {
    const root = menuRoots[bar];
    const duration = 60 / 72 / 2;
    if (beat === 0) {
      const minor = bar !== 1 && bar !== 2 && bar !== 5;
      [root, root + 7, root + 12, root + (minor ? 15 : 16)].forEach((note) => playNote(note, at, duration * 7.5, 'pad', output));
      playNote(root - 12, at, duration * 1.8, 'bass', output);
    } else if (beat === 4) playNote(menuRoots[bar] - 5, at, duration * 1.5, 'bass', output);
    let note = menuMelody[step % menuMelody.length];
    if (bar >= 4 && note !== null && step % 4 === 1) note += 7;
    if (note !== null && beat !== 7) playNote(note, at, duration * 1.7, 'lead', output);
  } else {
    const combat = scene === 'combat';
    const town = scene === 'town';
    const roots = combat ? combatRoots : town ? townRoots : cryptRoots;
    const root = roots[bar];
    const duration = 60 / (combat ? 92 : town ? 68 : 62) / 2;
    if (beat === 0) {
      const chord = combat ? [root, root + 5, root + 7, root + 10]
        : town ? [root, root + 4, root + 7, root + 11] : [root, root + 7, root + 12, root + 14];
      chord.forEach((note) => playNote(note, at, duration * (town ? 7.8 : 6.8), town ? 'pad' : 'drone', output));
      playNote(root - 12, at, duration * (combat ? 1.8 : 3.7), 'bass', output);
    } else if (beat === 4 || (combat && beat === 2)) playNote(root - (beat === 4 ? 5 : 12), at, duration * 1.8, 'bass', output);
    const note = town ? (beat === 2 || beat === 6 ? root + (beat === 2 ? 12 : 16) : null)
      : cryptMelody[step % cryptMelody.length];
    if (note !== null && (combat || town || bar % 2 === 0 || beat === 5)) {
      playNote(note + (combat && beat === 5 ? 7 : bar % 4 === 3 && !town ? -1 : 0), at, duration * (combat ? 0.8 : 1.5), 'lead', output);
    }
  }
  step = (step + 1) % 64;
}

function startTrack() {
  if (!context || !musicBus) return;
  if (sequencer !== null) window.clearInterval(sequencer);
  if (activeTrack) {
    const fadingTrack = activeTrack;
    ramp(fadingTrack, 0, 0.2);
    window.setTimeout(() => fadingTrack.disconnect(), 6000);
  }
  const track = context.createGain();
  const level = scene === 'crypt' ? 0.25 : scene === 'combat' ? 0.3 : scene === 'town' ? 0.26 : 0.28;
  track.gain.value = 0.0001;
  track.connect(musicBus);
  activeTrack = track;
  ramp(track, level * settings.musicVolume, 0.7);
  step = 0;
  const bpm = scene === 'crypt' ? 62 : scene === 'combat' ? 92 : scene === 'town' ? 68 : 72;
  tick();
  sequencer = window.setInterval(tick, 60 / bpm / 2 * 1000);
}

function playTone(frequency: number, options: {
  delay?: number; duration?: number; peak?: number; type?: OscillatorType;
  endFrequency?: number; filter?: number;
} = {}) {
  const ctx = context, output = sfxBus;
  if (!ctx || !output) return;
  const at = ctx.currentTime + (options.delay || 0);
  const duration = options.duration ?? 0.2;
  const oscillator = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const envelope = ctx.createGain();
  oscillator.type = options.type || 'sine';
  oscillator.frequency.setValueAtTime(frequency, at);
  if (options.endFrequency) oscillator.frequency.exponentialRampToValueAtTime(options.endFrequency, at + duration);
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
  oscillator.onended = () => { oscillator.disconnect(); filter.disconnect(); envelope.disconnect(); };
}

function playNoise(options: {
  duration?: number; peak?: number; delay?: number; low?: number; high?: number;
  endHigh?: number; type?: BiquadFilterType; q?: number; attack?: number;
} = {}) {
  const ctx = context, output = sfxBus;
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
  envelope.gain.linearRampToValueAtTime(options.peak ?? 0.12, at + Math.min(options.attack ?? 0.015, duration * 0.35));
  envelope.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  noise.connect(filter);
  filter.connect(envelope);
  envelope.connect(output);
  noise.start(at);
  noise.stop(at + duration + 0.01);
  noise.onended = () => { noise.disconnect(); filter.disconnect(); envelope.disconnect(); };
}

export function setMusicScene(next: MusicScene) {
  if (scene === next) return;
  scene = next;
  if (enabled) startTrack();
}

export function getAudioSettings() {
  return { ...settings, enabled };
}

export function isMusicEnabled() { return enabled; }

export function subscribeAudioSettings(listener: () => void) {
  settingsListeners.add(listener);
  return () => settingsListeners.delete(listener);
}

export function setMusicVolume(value: number) {
  settings.musicVolume = clamp(value, settings.musicVolume);
  saveSettings();
  if (activeTrack) {
    const level = scene === 'crypt' ? 0.25 : scene === 'combat' ? 0.3 : scene === 'town' ? 0.26 : 0.28;
    ramp(activeTrack, enabled ? level * settings.musicVolume : 0);
  }
  notifySettings();
}

export function setSfxVolume(value: number) {
  settings.sfxVolume = clamp(value, settings.sfxVolume);
  saveSettings();
  if (enabled) ramp(sfxBus, settings.sfxVolume);
  notifySettings();
}

export function playSfx(name: string, volume = 1) {
  if (!enabled || !context || !sfxBus) return;
  const level = clamp(volume, 1);
  if (level === 0) return;

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
    if (sequencer !== null) window.clearInterval(sequencer);
    sequencer = null;
    if (activeTrack) ramp(activeTrack, 0, 0.04);
    ramp(sfxBus, 0, 0.04);
    notifySettings();
    return true;
  }

  createContext();
  if (!context || !sfxBus) return false;
  await context.resume();
  enabled = true;
  ramp(sfxBus, settings.sfxVolume);
  startTrack();
  notifySettings();
  return true;
}

export async function toggleMusic() {
  return setAudioEnabled(!enabled);
}
