// Type surface for the ported Custom-VTT SoundSynthesizer (client/src/audio/SoundSynthesizer.js).
// The .js stays verbatim (user's original synth engine) and default-exports a
// singleton INSTANCE (`export default new SoundSynthesizer()`); only the
// methods the game actually calls are declared here.
declare class SoundSynthesizer {
  ctx: AudioContext | null;
  unlocked: boolean;
  enabled: boolean;

  unlock(): void;
  ensureContext(): boolean;
  setMasterVolume(v: number): void;

  playUIClick(): void;
  playTokenPickup(volume?: number): void;
  playTokenDrop(volume?: number): void;
  playDamage(options?: Record<string, unknown>): void;
  playHeal(): void;
  playDiceRoll(options?: Record<string, unknown>): void;
  playChatMessage(type?: string): void;
  playCriticalSuccess(): void;
  playCriticalFail(): void;
  playLevelUp(): void;
  playGoldClink(): void;
  playYourTurn(): void;
  playSpellCast(options?: Record<string, unknown>): void;
  playDoorOpen(options?: Record<string, unknown>): void;
  playDoorClose(options?: Record<string, unknown>): void;
  playDoorLocked(options?: Record<string, unknown>): void;
  playGatePortcullis(options?: Record<string, unknown>): void;
  playStoneSlide(options?: Record<string, unknown>): void;
  playThunder(): void;
  playElementSound(styleKey: string, options?: Record<string, unknown>): void;
  playSoundStack(layers: Array<{ sound: string; delay?: number; options?: Record<string, unknown> }>, opts?: { masterVolume?: number }): number;
  stopSoundStack(): void;
}

declare const synth: SoundSynthesizer;
export default synth;
