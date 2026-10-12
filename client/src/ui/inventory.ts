// ui/inventory.ts — FIX 11 [2]: the satchel. Item list from the sheet's
// equipment / inventory section (SCHEMA.md §2) with Equip / Use actions
// wired to the intent:sheet op ({op:'equip'|'use', itemId:<item name>} — the
// boss's wire contract; inventory rows carry no ids, the NAME is the key).
//
// Read-only fallback: if the sheet's inventory list is empty the panel falls
// back to the equipment list, then to gear derived from attacks + worn armor
// + shield — the panel is never empty. Buttons optimistically go busy until
// the next state sync (or a 4s timeout, so a stub server never bricks them);
// the server response itself arrives as a normal state:patch / chat
// narration, so the panel works read-only even while the server ignores ops.
import { useGame } from '../game/store';
import { createModal } from './escape';
import type { PanelHandle } from './escape';
import { readMySheet } from './sheet';
import type { SheetData, SheetItem } from './sheet';
import { sheetOp } from '../net/client';

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

/** Only healing potions currently have a server-backed Use effect. */
const CONSUMABLE = /^potion of (?:greater |superior |supreme )?healing$/i;

/** Sort rank: weapons first, then armor/shield, gear/tools, packs last. */
const KIND_RANK: Record<string, number> = { weapon: 0, armor: 1, shield: 2, gear: 3, tool: 4, pack: 5 };
const rankOf = (it: SheetItem) => KIND_RANK[String(it.kind || '')] ?? 3;

const prettyCat = (c: string) => String(c || '').replace(/_/g, ' ');

/** Is this item currently on the body? Armor/shield derive from the sheet's
 *  own fields; weapons await the server's equipped list (optional field —
 *  rendered only when the server sends it). */
function isEquipped(item: SheetItem, sheet: SheetData): boolean {
  const name = String(item.name || '');
  if (item.kind === 'shield') return !!sheet.shield;
  if (item.kind === 'armor') return sheet.armor === name;
  const equipped = (sheet as { equipped?: string[] }).equipped;
  return Array.isArray(equipped) && equipped.includes(name);
}

/** inventory → equipment → derived starting gear. `note` explains the
 *  fallback so the ledger never lies about where the rows came from. */
function itemsOf(sheet: SheetData): { items: SheetItem[]; note: string | null } {
  const inv = (sheet.inventory || []).filter((i) => i && i.name);
  if (inv.length) return { items: inv, note: null };
  const eq = (sheet.equipment || []).filter((i) => i && i.name);
  if (eq.length) return { items: eq, note: 'ledger without weights — the forge recorded names only' };
  const derived: SheetItem[] = [];
  for (const a of sheet.attacks || []) if (a.name) derived.push({ name: a.name, qty: 1, kind: 'weapon' });
  if (sheet.armor) derived.push({ name: sheet.armor, qty: 1, kind: 'armor' });
  if (sheet.shield) derived.push({ name: 'Shield', qty: 1, kind: 'shield' });
  return { items: derived, note: derived.length ? 'starting gear, as forged' : null };
}

function fingerprint(sheet: SheetData | null, tokenHp: number): string {
  if (!sheet) return `nosheet:${tokenHp}`;
  return [
    tokenHp,
    sheet.armor, sheet.shield,
    JSON.stringify((sheet as { equipped?: string[] }).equipped ?? null),
    JSON.stringify(sheet.inventory ?? null),
    JSON.stringify(sheet.equipment ?? null),
    JSON.stringify(sheet.carrying ?? null),
  ].join('~');
}

export function mountInventory(container: HTMLElement): PanelHandle {
  const modal = createModal(container, { kicker: 'satchel & gear', title: 'Satchel & Gear' });
  let lastFp = '';

  const render = () => {
    const { token, sheet } = readMySheet();
    const body = modal.body;
    const scroll = body.scrollTop;

    if (!token) {
      modal.setHead({ title: 'Satchel & Gear', sub: null });
      body.innerHTML = `<div class="pnl-note">thou walkest as the DM's eye — no satchel binds thee.</div>`;
      lastFp = fingerprint(sheet, 0);
      return;
    }
    if (!sheet) {
      modal.setHead({ title: token.name, sub: null });
      body.innerHTML = `<div class="pnl-note"><b>${esc(token.name)}</b> carries nothing the ledger can see.<br/>
        Souls forged at the Forge of Souls carry starting gear.</div>`;
      lastFp = fingerprint(sheet, token.hp);
      return;
    }

    const { items, note } = itemsOf(sheet);
    const rows = [...items].sort((a, b) => rankOf(a) - rankOf(b)).map((it) => {
      const name = String(it.name || '—');
      const kind = String(it.kind || '');
      const equipped = isEquipped(it, sheet);
      const canEquip = kind === 'weapon' || kind === 'armor' || kind === 'shield';
      const usable = !canEquip && CONSUMABLE.test(name);
      return `<div class="pnl-item">
        <span class="it-name">${esc(name)}</span>
        ${it.qty && it.qty > 1 ? `<span class="it-qty">×${it.qty}</span>` : ''}
        <span class="it-cat">${esc(prettyCat(it.category || kind))}</span>
        <span class="it-wt">${it.weight != null ? `${it.weight} lb` : '—'}</span>
        ${equipped ? '<span class="pnl-badge">equipped</span>' : ''}
        ${canEquip ? `<button type="button" class="pnl-btn" data-op="equip" data-item="${esc(name)}">${equipped ? 'Unequip' : 'Equip'}</button>` : ''}
        ${usable ? `<button type="button" class="pnl-btn" data-op="use" data-item="${esc(name)}">Use</button>` : ''}
      </div>`;
    }).join('');

    const c = sheet.carrying;
    const loadHtml = c ? `
      <div class="pnl-load${c.encumbered ? ' enc' : ''}">
        <span>load ${c.weight ?? 0} / ${c.capacity ?? '?'} lb</span>
        <div class="pnl-load-bar"><i style="width:${Math.min(100, ((c.weight || 0) / Math.max(1, c.capacity || 1)) * 100)}%"></i></div>
        ${c.encumbered ? '<span>encumbered</span>' : ''}
      </div>` : '';

    modal.setHead({
      title: sheet.name || token.name,
      sub: [`${items.length} ${items.length === 1 ? 'entry' : 'entries'}`,
        c ? `load ${c.weight ?? 0}/${c.capacity ?? '?'} lb` : null,
        note].filter(Boolean).join(' · ') || null,
    });
    body.innerHTML = rows
      ? rows + loadHtml
      : `<div class="pnl-note">the satchel holds nothing but ash.<br/>Gear gathered in the reach will find its way here.</div>` + loadHtml;
    body.scrollTop = scroll;
    lastFp = fingerprint(sheet, token.hp);
  };

  modal.onOpen = render;

  // Equip / Use → intent:sheet op. Optimistic busy state until the state
  // sync lands (re-render rebuilds the buttons) or the timeout rescues them.
  modal.body.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-op]');
    if (!btn || btn.disabled) return;
    sheetOp(btn.dataset.op === 'use' ? 'use' : 'equip', btn.dataset.item || '');
    btn.disabled = true;
    btn.classList.add('busy');
    setTimeout(() => { btn.disabled = false; btn.classList.remove('busy'); }, 4000);
  });

  const off = useGame.subscribe(() => {
    if (!modal.isOpen()) return;
    const { token, sheet } = readMySheet();
    if (fingerprint(sheet, token?.hp ?? 0) !== lastFp) render();
  });

  return {
    open: () => modal.open(),
    close: () => modal.close(),
    toggle: () => modal.toggle(),
    isOpen: () => modal.isOpen(),
    dispose() { off(); modal.dispose(); },
  };
}
