// ui/createLoader.js — PLAIN JAVASCRIPT ON PURPOSE (not typechecked by tsc,
// which only includes client/src/**/*.ts). It dynamically imports T2-e's
// character-creation module, which may not exist yet while the pivot ships.
// tools/build.mjs resolves './create/creation' to an inline stub when the
// real module is absent, so both `npm run build` and the runtime import stay
// green — the moment T2-e lands creation.ts the real module bundles in.
//
// Expected module surface (documented in the worklog):
//   mountCreation(container: HTMLElement, opts: { invite?: string,
//     name?: string, archetype?: string }): void
//   (also accepts `default` or `mount` names)
// When finished, creation calls useGame.getState().setPhase('playing').
export async function loadCreation() {
  try {
    const mod = await import('./create/creation');
    const mount = mod.mountCreation || mod.default || mod.mount || null;
    return mount ? { mount } : null;
  } catch (e) {
    console.warn('[ashenreach] character creation module not present yet', e);
    return null;
  }
}
