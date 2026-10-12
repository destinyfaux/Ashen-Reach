// Central typed event bus — engine <-> UI <-> net. No React state churn in the render loop.
type Handler = (payload: any) => void;

class EventBus {
  private map = new Map<string, Set<Handler>>();
  on(ev: string, fn: Handler): () => void {
    if (!this.map.has(ev)) this.map.set(ev, new Set());
    this.map.get(ev)!.add(fn);
    return () => this.map.get(ev)?.delete(fn);
  }
  emit(ev: string, payload?: any) {
    const set = this.map.get(ev);
    if (set) for (const fn of set) {
      try { fn(payload); } catch (e) { console.error(`[bus:${ev}]`, e); }
    }
  }
  clear() { this.map.clear(); }
}

export const Bus = new EventBus();

// Canonical event names
export const EV = {
  // net → engine
  TOKENS_SYNC: 'tokens:sync',
  MAP_LOAD: 'map:load',
  DOORS_SYNC: 'doors:sync',
  ENV_SYNC: 'env:sync',         // dayNight + weather
  // engine → ui/net
  MOVE_INTENT: 'move:intent',   // {x,z,rotY}
  INTERACT: 'ui:interact',
  // net → ui
  CHAT: 'chat',
  ROLL: 'roll:show',
  FX: 'fx:action',
  JOINED: 'session:joined',
  ERROR: 'session:error',
  MOVE_REJECTED: 'move:rejected',
  PROMPT: 'prompt',
  SFX: 'sfx'                    // {name, vol?}
} as const;
