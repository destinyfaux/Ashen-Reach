// ui/sheet.ts — FIX 11 [1]: the character record. Renders MY token's full 5E
// sheet (token.sheet — SCHEMA.md §2, built server-side by CharacterEngine)
// in a scrollable ornate modal: identity, vitals, abilities, saving throws,
// skills, attacks, spellcasting (casters only), features & traits
// (collapsible), passive scores.
//
// Live updates: the sheet panel re-renders on store patches when a cheap
// value fingerprint changes (HP moves reflect immediately) — state:patch
// rebuilds every token object, so identity-diffing would re-render on every
// step of every player. Scroll position and open <details> survive the
// re-render. `subclass` renders only when the server sheet carries it
// (wave-2 server work) — the row hides otherwise.
import { useGame } from '../game/store';
import type { TokenState } from '../game/store';
import { createModal, myToken } from './escape';
import type { PanelHandle } from './escape';
import { sheetOp } from '../net/client';

// ── sheet data (SCHEMA.md §2 subset this panel renders; every field optional
//    — the engine never throws and neither does the panel) ──────────────────
export interface SheetAttack {
  name?: string; ability?: string; proficient?: boolean; attackBonus?: number;
  damageDice?: string; damageMod?: number; damageFormula?: string; damageType?: string;
  ranged?: boolean; finesse?: boolean; twoHanded?: boolean; versatile?: boolean;
  thrown?: boolean; ammunition?: boolean; reachFt?: number;
  rangeFt?: number | null; longRangeFt?: number | null;
}
export interface SheetSlot { total?: number; used?: number }
export interface SheetSpellcasting {
  ability?: string; abilityMod?: number; saveDC?: number; attackBonus?: number;
  cantripsKnown?: number; preparedCount?: number | null;
  slots?: Record<string, SheetSlot>; cantrips?: string[];
  spellsByLevel?: Record<string, string[]>; spells?: string[];
}
export interface SheetItem { name?: string; qty?: number; kind?: string; category?: string; weight?: number }
export interface SheetData {
  schema?: string; id?: string; name?: string;
  race?: string | null; subrace?: string | null; class?: string | null;
  subclass?: string | null;              // wave-2 server field — render if present
  archetype?: string | null; background?: string | null;
  level?: number;
  abilities?: Record<string, number>;
  baseAbilities?: Record<string, number>;
  mods?: Record<string, number>;
  proficiencyBonus?: number;
  saves?: Record<string, { proficient?: boolean; mod?: number }>;
  skills?: Record<string, { name?: string; ability?: string; proficient?: boolean; mod?: number }>;
  passive?: { perception?: number; investigation?: number; insight?: number } | null;
  initiative?: number; speedFt?: number; darkvisionFt?: number | null; languages?: string[];
  ac?: number;
  acDetail?: { base?: number; dex?: number; armor?: string | null; shield?: number; notes?: string[] } | null;
  armor?: string | null; shield?: boolean;
  hp?: { current?: number; max?: number; hitDie?: number; hitDiceSpent?: number };
  hitDice?: { die?: string; total?: number; remaining?: number };
  attacks?: SheetAttack[];
  spellcasting?: SheetSpellcasting | null;
  sneakAttackDice?: string | null;
  equipment?: SheetItem[];
  inventory?: SheetItem[];
  carrying?: { weight?: number; capacity?: number; encumbered?: boolean };
  features?: { level?: number; name?: string; description?: string }[];
  traits?: { name?: string; description?: string; source?: string }[];
  xp?: number;
  deathSaves?: { ok: number; fail: number; stable: boolean; dead: boolean };
  conditions?: string[];
}

/** My token + its sheet. The sheet is an extra field on the wire token; the
 *  store's TokenState is intentionally not widened (no store.ts edit). */
export function readMySheet(): { token: TokenState | null; sheet: SheetData | null } {
  const token = myToken();
  const sheet = token ? ((token as unknown as { sheet?: SheetData }).sheet ?? null) : null;
  return { token, sheet };
}

// ── formatting helpers ─────────────────────────────────────────────────────
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
const fmt = (n?: number | null) => (n == null ? '—' : n >= 0 ? `+${n}` : `${n}`);
const ABILITY_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const;
const ABILITY_NAMES: Record<string, string> = { str: 'STR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'WIS', cha: 'CHA' };
const SKILL_ORDER = [
  'acrobatics', 'animal_handling', 'arcana', 'athletics', 'deception', 'history',
  'insight', 'intimidation', 'investigation', 'medicine', 'nature', 'perception',
  'performance', 'persuasion', 'religion', 'sleight_of_hand', 'stealth', 'survival',
];
const ORDINALS = ['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th'];
const ordinal = (n: number) => ORDINALS[n] || `${n}th`;

function vital(b: string, label: string, band?: string, title?: string): string {
  return `<div class="pnl-vital"${band ? ` data-band="${band}"` : ''}${title ? ` title="${esc(title)}"` : ''}><b>${b}</b><span>${label}</span></div>`;
}

/** Cheap value fingerprint of everything this panel renders — compared on
 *  every store patch so re-renders only happen when the data actually moved. */
function fingerprint(token: TokenState | null, sheet: SheetData | null): string {
  if (!token) return 'none';
  const sc = sheet?.spellcasting;
  return [
    token.hp, token.hpMax, token.ac, (token.conditions || []).join(','),
    token.deathSaves?.ok, token.deathSaves?.fail, token.deathSaves?.dead,
    sheet?.name, sheet?.level, sheet?.subclass, sheet?.race, sheet?.subrace,
    sheet?.class, sheet?.background, sheet?.ac, sheet?.armor, sheet?.shield,
    sheet?.hp?.current, sheet?.hp?.max, sheet?.hitDice?.remaining, sheet?.hitDice?.total,
    sheet?.initiative, sheet?.proficiencyBonus, !!useGame.getState().initiative,
    sheet?.sneakAttackDice,
    sc ? `${sc.saveDC}|${sc.attackBonus}|${sc.cantripsKnown}|${sc.preparedCount}` +
      Object.entries(sc.slots || {}).map(([l, s]) => `${l}:${s.used}/${s.total}`).join(';') +
      `|${(sc.cantrips || []).join(',')}` +
      Object.entries(sc.spellsByLevel || {}).map(([l, n]) => `${l}:${n.join(',')}`).join(';') : '',
    (sheet?.attacks || []).map((a) => a.name).join(','),
    (sheet?.features || []).map((f) => f.name).join(','),
    (sheet?.traits || []).map((t) => t.name).join(','),
    sheet?.passive?.perception, sheet?.passive?.investigation, sheet?.passive?.insight,
  ].join('~');
}

export function mountSheet(container: HTMLElement): PanelHandle {
  const modal = createModal(container, { kicker: 'character record', title: 'Character Record' });
  let lastFp = '';

  const render = () => {
    const { token, sheet } = readMySheet();
    const body = modal.body;

    // preserve reader state across the re-render
    const scroll = body.scrollTop;
    const openKeys = new Set(
      Array.from(body.querySelectorAll<HTMLDetailsElement>('details[data-key][open]'))
        .map((d) => d.dataset.key || ''));

    if (!token) {
      modal.setHead({ title: 'No Mortal Shell', sub: null });
      body.innerHTML = `<div class="pnl-note">thou walkest as the DM's eye — no mortal shell binds thee.</div>`;
      lastFp = fingerprint(token, sheet);
      return;
    }
    if (!sheet) {
      modal.setHead({ title: token.name, sub: null });
      body.innerHTML = `<div class="pnl-note"><b>${esc(token.name)}</b> walks as a plain ${esc(token.archetype)}.<br/>
        Souls forged at the Forge of Souls carry a full record — this one carries none yet.</div>`;
      lastFp = fingerprint(token, sheet);
      return;
    }

    // ── identity ──
    const lineage = [sheet.race, sheet.subrace].filter(Boolean).join(' ');
    const calling = sheet.subclass ? `${sheet.class} (${sheet.subclass})` : sheet.class;
    modal.setHead({
      title: sheet.name || token.name,
      sub: [lineage, calling, sheet.level ? `Level ${sheet.level}` : null, sheet.background]
        .filter(Boolean).join(' · ') || null,
    });

    // ── vitals (token hp is the live value — sheets lag damage rolls) ──
    const hpMax = token.hpMax || 1;
    const pct = token.hp / hpMax;
    const vitals = [
      vital(`${Math.max(0, token.hp)}<i>/${hpMax}</i>`, 'hit points', pct > 0.6 ? undefined : pct > 0.3 ? 'mid' : 'low'),
      vital(String(token.ac), 'armor class', undefined,
        sheet.acDetail ? `base ${sheet.acDetail.base ?? '?'}${sheet.acDetail.dex ? ` + dex ${fmt(sheet.acDetail.dex)}` : ''}${sheet.acDetail.armor ? ` · ${sheet.acDetail.armor}` : ''}${sheet.acDetail.shield ? ` + shield ${fmt(sheet.acDetail.shield)}` : ''}` : undefined),
      vital(fmt(sheet.initiative), 'initiative'),
      vital(`${sheet.speedFt ?? token.speedFt} ft`, 'speed'),
      vital(fmt(sheet.proficiencyBonus), 'proficiency'),
      sheet.hitDice ? vital(`${sheet.hitDice.remaining ?? '?'}/${sheet.hitDice.total ?? '?'}`, `hit dice ${sheet.hitDice.die || ''}`.trim()) : '',
      sheet.darkvisionFt ? vital(`${sheet.darkvisionFt} ft`, 'darkvision') : '',
      sheet.sneakAttackDice ? vital(sheet.sneakAttackDice, 'sneak attack') : '',
    ].filter(Boolean).join('');

    // ── abilities (final score, modifier, racial ASI when it moved) ──
    const abilities = ABILITY_KEYS.map((k) => {
      const score = sheet.abilities?.[k];
      const base = sheet.baseAbilities?.[k];
      const asi = (score != null && base != null) ? score - base : 0;
      return `<div class="pnl-ability">
        <div class="ab-name">${ABILITY_NAMES[k]}</div>
        <div class="ab-score">${score ?? '—'}</div>
        <div class="ab-mod">${fmt(sheet.mods?.[k])}</div>
        ${asi ? `<div class="ab-asi">${asi > 0 ? '+' : ''}${asi} racial</div>` : ''}
      </div>`;
    }).join('');

    // ── saving throws ──
    const saves = ABILITY_KEYS.map((k) => {
      const sv = sheet.saves?.[k];
      return `<div class="pnl-save${sv?.proficient ? ' prof' : ''}"><span class="pnl-dot"></span><b>${fmt(sv?.mod)}</b><span>${ABILITY_NAMES[k].toLowerCase()}</span></div>`;
    }).join('');

    // ── skills (proficient highlighted) ──
    const skills = SKILL_ORDER.map((slug) => {
      const sk = sheet.skills?.[slug];
      if (!sk) return '';
      return `<div class="pnl-skill${sk.proficient ? ' prof' : ''}"><span class="pnl-dot"></span><b>${fmt(sk.mod)}</b><span class="sk-name">${esc(sk.name || slug)}</span><span class="sk-ab">${esc((sk.ability || '').toUpperCase())}</span></div>`;
    }).join('');

    // ── attacks ──
    const atkRows = (sheet.attacks || []).map((a) => {
      const props: string[] = [];
      if (a.finesse) props.push('finesse');
      if (a.twoHanded) props.push('two-handed');
      if (a.versatile) props.push('versatile');
      if (a.thrown) props.push('thrown');
      if (a.ammunition) props.push('ammo');
      if (a.ranged && a.rangeFt) props.push(`range ${a.rangeFt}/${a.longRangeFt ?? a.rangeFt}`);
      const dmg = a.damageFormula ||
        `${a.damageDice || '?'}${a.damageMod ? (a.damageMod > 0 ? '+' : '') + a.damageMod : ''}`;
      return `<tr>
        <td>${esc(a.name || '—')}</td>
        <td class="pnl-atk-bonus">${fmt(a.attackBonus)}</td>
        <td>${esc(dmg)}${a.damageType ? ` <span class="atk-type">${esc(a.damageType)}</span>` : ''}</td>
        <td class="dim">${esc(props.join(' · '))}</td>
      </tr>`;
    }).join('');
    const attacksHtml = atkRows ? `
      <div class="pnl-sec">attacks</div>
      <table class="pnl-table">
        <thead><tr><th>weapon</th><th>bonus</th><th>damage</th><th>properties</th></tr></thead>
        <tbody>${atkRows}</tbody>
      </table>` : '';

    // ── spellcasting (casters only) ──
    const sc = sheet.spellcasting;
    const hasSpells = !!sc && ((sc.cantrips || []).length > 0 || (sc.spells || []).length > 0 ||
      Object.keys(sc.slots || {}).length > 0 || Object.keys(sc.spellsByLevel || {}).length > 0);
    let spellHtml = '';
    if (sc && hasSpells) {
      const meta = [
        sc.ability ? vital(String(sc.ability), 'spell ability') : '',
        sc.saveDC != null ? vital(String(sc.saveDC), 'save dc') : '',
        sc.attackBonus != null ? vital(fmt(sc.attackBonus), 'spell attack') : '',
        sc.cantripsKnown != null ? vital(String(sc.cantripsKnown), 'cantrips') : '',
        sc.preparedCount != null ? vital(String(sc.preparedCount), 'prepared') : '',
      ].filter(Boolean).join('');
      const slots = Object.entries(sc.slots || {})
        .sort((a, b) => Number(a[0]) - Number(b[0]))
        .map(([lvl, sl]) => `<div class="pnl-slot">${ordinal(Number(lvl))} <b>${Math.max(0, (sl.total ?? 0) - (sl.used ?? 0))}/${sl.total ?? 0}</b></div>`)
        .join('');
      const cantripChips = (sc.cantrips || []).map((n) => `<span class="pnl-chip cantrip">${esc(n)}</span>`).join('');
      const levelBlocks = Object.entries(sc.spellsByLevel || {})
        .sort((a, b) => Number(a[0]) - Number(b[0]))
        .map(([lvl, names]) => `
          <div class="pnl-spell-level">${ordinal(Number(lvl))} level</div>
          <div class="pnl-chips">${names.map((n) => `<span class="pnl-chip">${esc(n)}</span>`).join('')}</div>`)
        .join('');
      spellHtml = `
        <div class="pnl-sec">spellcasting</div>
        <div class="pnl-vitals">${meta}</div>
        ${slots ? `<div class="pnl-slots">${slots}</div>` : ''}
        ${cantripChips ? `<div class="pnl-spell-level">cantrips</div><div class="pnl-chips">${cantripChips}</div>` : ''}
        ${levelBlocks}`;
    }

    // ── features & traits (collapsible) ──
    const feats = (sheet.features || []).map((f, i) => `
      <details class="pnl-feat" data-key="f${i}:${esc(f.name || '')}">
        <summary><span class="pnl-feat-lvl">lv ${f.level ?? '?'}</span>${esc(f.name || '—')}</summary>
        <div class="pnl-feat-body">${esc(f.description || '')}</div>
      </details>`).join('');
    const traits = (sheet.traits || []).map((t, i) => `
      <details class="pnl-feat" data-key="t${i}:${esc(t.name || '')}">
        <summary><span class="pnl-feat-src">${esc(t.source || 'trait')}</span>${esc(t.name || '—')}</summary>
        <div class="pnl-feat-body">${esc(t.description || '')}</div>
      </details>`).join('');

    // ── passive scores ──
    const p = sheet.passive;
    const passiveHtml = p ? `
      <div class="pnl-sec">passive scores</div>
      <div class="pnl-chips">
        ${p.perception != null ? `<span class="pnl-chip">passive perception <b>${p.perception}</b></span>` : ''}
        ${p.investigation != null ? `<span class="pnl-chip">passive investigation <b>${p.investigation}</b></span>` : ''}
        ${p.insight != null ? `<span class="pnl-chip">passive insight <b>${p.insight}</b></span>` : ''}
      </div>` : '';

    const inCombat = !!useGame.getState().initiative;
    const hitDiceRemaining = Math.max(0, Math.floor(sheet.hitDice?.remaining || 0));
    const pactSlotsUsed = sheet.class === 'Warlock' && Object.values(sc?.slots || {}).some((slot) => (slot.used || 0) > 0);
    const defaultHitDice = pactSlotsUsed ? 0 : Math.min(1, hitDiceRemaining);
    const hitDiceOptions = Array.from({ length: hitDiceRemaining + 1 }, (_, n) =>
      `<option value="${n}"${n === defaultHitDice ? ' selected' : ''}>${n}</option>`).join('');
    const canShortRest = !inCombat && (pactSlotsUsed || (hitDiceRemaining > 0 && token.hp < hpMax));
    const hasUsedSlots = Object.values(sc?.slots || {}).some((slot) => (slot.used || 0) > 0);
    const canLongRest = !inCombat && (token.hp < hpMax || hitDiceRemaining < (sheet.hitDice?.total || 0) || hasUsedSlots);
    const restHtml = `
      <div class="pnl-sec">rest &amp; recover</div>
      <div class="pnl-rest-actions">
        <label>Hit Dice to spend
          <select data-rest-dice ${hitDiceRemaining ? '' : 'disabled'}>${hitDiceOptions}</select>
        </label>
        <button type="button" class="pnl-btn" data-rest-short ${canShortRest ? '' : 'disabled'}>Short Rest</button>
        <button type="button" class="pnl-btn" data-rest-long ${canLongRest ? '' : 'disabled'}>Long Rest</button>
      </div>
      <div class="pnl-rest-note">Short rests spend Hit Dice; long rests restore HP, spell slots, and some spent Hit Dice. Resting is unavailable during combat.</div>`;

    body.innerHTML = `
      <div class="pnl-vitals">${vitals}</div>
      <div class="pnl-sec">abilities</div>
      <div class="pnl-abilities">${abilities}</div>
      <div class="pnl-sec">saving throws</div>
      <div class="pnl-cols">${saves}</div>
      <div class="pnl-sec">skills</div>
      <div class="pnl-cols">${skills}</div>
      ${attacksHtml}
      ${spellHtml}
      <div class="pnl-sec">features &amp; traits</div>
      ${feats}${traits || (feats ? '' : '<div class="pnl-note">no recorded deeds — the road is still young.</div>')}
      ${passiveHtml}
      ${restHtml}`;

    body.querySelector<HTMLButtonElement>('[data-rest-short]')?.addEventListener('click', () => {
      const count = Number(body.querySelector<HTMLSelectElement>('[data-rest-dice]')?.value || 0);
      sheetOp('shortRest', count);
    });
    body.querySelector<HTMLButtonElement>('[data-rest-long]')?.addEventListener('click', () => {
      if (window.confirm('Complete a long rest and restore your resources?')) sheetOp('longRest');
    });

    body.scrollTop = scroll;
    body.querySelectorAll<HTMLDetailsElement>('details[data-key]').forEach((d) => {
      if (openKeys.has(d.dataset.key || '')) d.open = true;
    });
    lastFp = fingerprint(token, sheet);
  };

  modal.onOpen = render;
  const off = useGame.subscribe(() => {
    if (!modal.isOpen()) return;
    const { token, sheet } = readMySheet();
    if (fingerprint(token, sheet) !== lastFp) render();
  });

  return {
    open: () => modal.open(),
    close: () => modal.close(),
    toggle: () => modal.toggle(),
    isOpen: () => modal.isOpen(),
    dispose() { off(); modal.dispose(); },
  };
}
