// ═══════════════════════════════════════════════════════════════════════════
// SubraceSelector.ts — dynamic subrace / lineage UI component for character forge.
// Queries the SRD database for all lineages and subraces of the chosen race,
// displaying interactive cards, ASI bonuses, trait lists, and lore details.
// ═══════════════════════════════════════════════════════════════════════════
import { h, raceMark, icon } from './steps';
import type { StepCtx } from './steps';
import { fetchSrdRace, getCachedRace } from './srdClient';
import type { SrdSubrace, SrdRaceData } from './srdClient';

export function renderSubraceSelector(container: HTMLElement, ctx: StepCtx): void {
  const s = ctx.state;
  container.replaceChildren();

  if (!s.race) {
    container.append(
      h('div', { class: 'cr-subrace-container' },
        h('div', { class: 'cr-subrace-unified', text: 'Select a bloodline above to examine its lineages and subraces.' })
      )
    );
    return;
  }

  const cached: SrdRaceData | null = getCachedRace(s.race);

  // If not yet cached, fetch dynamically from the SRD database
  if (!cached) {
    const loadingBox = h('div', { class: 'cr-subrace-container' },
      h('div', { class: 'cr-subrace-loading' },
        icon('sparkle'),
        h('span', { text: ` Consulting the SRD archives for ${s.race} lineages…` })
      )
    );
    container.append(loadingBox);

    fetchSrdRace(s.race).then((data) => {
      if (ctx.state.race === s.race) {
        if (data) {
          renderSubraceSelector(container, ctx);
        } else {
          container.replaceChildren();
          container.append(
            h('div', { class: 'cr-subrace-container' },
              h('div', { class: 'cr-subrace-unified', text: `Unified Bloodline · ${s.race} carries an undivided inheritance.` })
            )
          );
        }
      }
    });
    return;
  }

  const subraces: SrdSubrace[] = cached.subraces_list || [];

  if (subraces.length > 0) {
    const subGrid = h('div', { class: 'cr-cards cr-subrace-grid' });

    for (const sub of subraces) {
      const isSel = s.subrace === sub.name || (!s.subrace && subraces[0]?.name === sub.name);

      const asiBadges = Object.entries(sub.ability_score_increase || {}).map(([stat, bonus]) =>
        h('span', { class: 'cr-chip gold', text: `+${bonus} ${stat.toUpperCase()}` })
      );

      const traitsText = sub.traits && sub.traits.length > 0
        ? sub.traits.map((t) => t.name).join(' · ')
        : `${sub.source || 'SRD'} lineage`;

      subGrid.append(
        h('button', {
          class: `cr-card cr-subrace-card ${isSel ? 'sel' : ''}`,
          onclick: () => {
            ctx.update({ subrace: sub.name });
          },
        },
          h('span', { class: 'cr-card-mark' }, raceMark(s.race)),
          h('span', { class: 'cr-card-name', text: sub.name }),
          h('span', { class: 'cr-card-meta' },
            ...asiBadges,
            h('span', { class: 'cr-chip', text: sub.source || 'SRD' })
          ),
          h('span', { class: 'cr-card-flavor', text: traitsText })
        )
      );
    }

    const subraceBox = h('div', { class: 'cr-subrace-container' },
      h('div', { style: 'display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px;' },
        h('div', { class: 'cr-label' }, `${s.race} Subraces & Lineages (${subraces.length} from SRD Database)`),
        h('span', { style: 'font-size:12px;color:var(--cr-gold);font-style:italic;', text: 'Select lineage variant' })
      ),
      subGrid
    );

    container.append(subraceBox);
  } else {
    // Unified bloodline (no subraces in SRD)
    container.append(
      h('div', { class: 'cr-subrace-container' },
        h('div', { class: 'cr-subrace-unified' },
          icon('brand', 14),
          h('span', { text: ` Unified Bloodline · ${s.race} has no divergent subraces in the SRD records. All traits belong to the unbroken line.` })
        )
      )
    );
  }
}
