import {
  getAudioSettings, setAudioEnabled, setMusicVolume, setSfxVolume,
  subscribeAudioSettings,
} from './music';

export function mountAudioSettings(container: HTMLElement, expanded = false): () => void {
  const root = document.createElement('section');
  root.className = `ar-audio-settings${expanded ? ' is-expanded' : ''}`;
  root.innerHTML = `
    <button type="button" class="ar-audio-toggle" aria-pressed="false">♫ <span>Sound off</span></button>
    <details class="ar-audio-volume"${expanded ? ' open' : ''}>
      <summary>Volumes</summary>
      <div class="ar-audio-mix">
        <label><span>Music <output data-music-value></output></span>
          <input type="range" min="0" max="1" step="0.01" data-music-volume aria-label="Music volume" /></label>
        <label><span>Effects <output data-sfx-value></output></span>
          <input type="range" min="0" max="1" step="0.01" data-sfx-volume aria-label="Sound effects volume" /></label>
      </div>
    </details>
    <span class="ar-audio-status" role="status" aria-live="polite"></span>`;
  container.appendChild(root);

  const toggle = root.querySelector<HTMLButtonElement>('.ar-audio-toggle')!;
  const details = root.querySelector<HTMLDetailsElement>('.ar-audio-volume')!;
  const musicInput = root.querySelector<HTMLInputElement>('[data-music-volume]')!;
  const sfxInput = root.querySelector<HTMLInputElement>('[data-sfx-volume]')!;
  const musicValue = root.querySelector<HTMLOutputElement>('[data-music-value]')!;
  const sfxValue = root.querySelector<HTMLOutputElement>('[data-sfx-value]')!;
  const status = root.querySelector<HTMLElement>('.ar-audio-status')!;

  const sync = () => {
    const current = getAudioSettings();
    toggle.setAttribute('aria-pressed', String(current.enabled));
    toggle.querySelector('span')!.textContent = current.enabled ? 'Sound on' : 'Sound off';
    musicInput.value = String(current.musicVolume);
    sfxInput.value = String(current.sfxVolume);
    musicValue.value = `${Math.round(current.musicVolume * 100)}%`;
    sfxValue.value = `${Math.round(current.sfxVolume * 100)}%`;
    root.dataset.enabled = String(current.enabled);
  };
  const onToggle = async () => {
    status.textContent = '';
    try {
      const active = await setAudioEnabled(!getAudioSettings().enabled);
      if (!active) status.textContent = 'Audio is unavailable in this browser.';
    } catch (error) {
      status.textContent = 'Audio could not be started.';
      console.error('Unable to start audio:', error);
    }
    sync();
  };
  const onMusic = () => setMusicVolume(Number(musicInput.value));
  const onSfx = () => setSfxVolume(Number(sfxInput.value));
  const offSettings = subscribeAudioSettings(sync);
  toggle.addEventListener('click', onToggle);
  musicInput.addEventListener('input', onMusic);
  sfxInput.addEventListener('input', onSfx);
  details.addEventListener('toggle', () => root.classList.toggle('volumes-open', details.open));
  sync();
  root.classList.toggle('volumes-open', details.open);

  return () => {
    offSettings();
    toggle.removeEventListener('click', onToggle);
    musicInput.removeEventListener('input', onMusic);
    sfxInput.removeEventListener('input', onSfx);
    root.remove();
  };
}
