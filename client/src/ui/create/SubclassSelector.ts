// ═══════════════════════════════════════════════════════════════════════════
// SubclassSelector.ts — dynamic subclass UI component for the character forge.
// Queries the SRD database for all specialization paths/archetypes of the chosen
// class, rendering interactive cards, search filtering, and detailed feature breakdowns.
// ═══════════════════════════════════════════════════════════════════════════
import { h, classSigil, icon } from './steps';
import type { StepCtx } from './steps';
import { CLASSES } from './gamedata';
import { fetchSrdClass, getCachedClass } from './srdClient';
import type { SrdSubclass, SrdClassData } from './srdClient';

let searchQuery = '';

export function renderSubclassSelector(container: HTMLElement, ctx: StepCtx): void {
  const s = ctx.state;
  container.replaceChildren();

  if (!s.charClass) {
    container.append(
      h('div', { class: 'cr-cols' },
        h('div', { class: 'cr-main' },
          h('div', { class: 'cr-panel' },
            h('div', { class: 'cr-panel-head' },
              h('div', { class: 'cr-panel-title', text: 'NO CALLING CHOSEN' }),
              h('div', { class: 'cr-panel-sub', text: 'Step back to Calling and select your class first.' })
            ),
            h('div', { class: 'cr-panel-empty', text: 'Specialization paths fork from your class calling.' })
          )
        )
      )
    );
    return;
  }

  const cls = CLASSES.find((x) => x.id.toLowerCase() === s.charClass.toLowerCase());
  const cached: SrdClassData | null = getCachedClass(s.charClass);

  // If not yet cached, fetch dynamically from the SRD database
  if (!cached) {
    const loadingCard = h('div', { class: 'cr-panel' },
      h('div', { class: 'cr-panel-head' },
        h('div', { class: 'cr-panel-title', text: 'CONSULTING THE ARCHIVES' }),
        h('div', { class: 'cr-panel-sub', text: `Querying the SRD database for ${s.charClass} specialization paths…` })
      ),
      h('div', { class: 'cr-subclass-loading' },
        icon('sparkle'),
        h('span', { text: ` Retrieving archetype records and feature trees for ${s.charClass}…` })
      )
    );

    const asideLoading = h('div', { class: 'cr-aside' },
      h('div', { class: 'cr-panel' },
        h('div', { class: 'cr-panel-title', text: 'SRD ARCHIVES' }),
        h('div', { class: 'cr-panel-empty', text: 'Unfolding specialization paths from the database…' })
      )
    );

    container.append(h('div', { class: 'cr-cols' }, h('div', { class: 'cr-main' }, loadingCard), asideLoading));

    fetchSrdClass(s.charClass).then((data) => {
      if (ctx.state.charClass === s.charClass) {
        if (data) {
          renderSubclassSelector(container, ctx);
        } else {
          // Error handling
          container.replaceChildren();
          const errPanel = h('div', { class: 'cr-panel' },
            h('div', { class: 'cr-panel-head' },
              h('div', { class: 'cr-panel-title', text: 'ARCHIVES UNREACHABLE' }),
              h('div', { class: 'cr-panel-sub', text: `Could not retrieve ${s.charClass} subclasses from the SRD.` })
            ),
            h('div', { class: 'cr-panel-empty', text: 'The record is sealed or momentarily inaccessible.' }),
            h('button', {
              class: 'cr-btn cr-btn-ghost',
              style: 'margin-top: 14px;',
              onclick: () => renderSubclassSelector(container, ctx),
            }, icon('sparkle'), 'RETRY QUERY')
          );
          container.append(h('div', { class: 'cr-cols' }, h('div', { class: 'cr-main' }, errPanel)));
        }
      }
    });
    return;
  }

  const subs: SrdSubclass[] = cached.subclasses_list || [];

  if (!subs.length) {
    container.append(
      h('div', { class: 'cr-cols' },
        h('div', { class: 'cr-main' },
          h('div', { class: 'cr-panel' },
            h('div', { class: 'cr-panel-head' },
              h('div', { class: 'cr-panel-title', text: 'NO SUBCLASSES RECORDED' }),
              h('div', { class: 'cr-panel-sub', text: `No specialization paths found in the SRD database for ${s.charClass}.` })
            ),
            h('div', { class: 'cr-panel-empty', text: 'Your class advances with undivided discipline.' })
          )
        )
      )
    );
    return;
  }

  // Filter subclasses if user types in search box
  const q = searchQuery.trim().toLowerCase();
  const filteredSubs = q
    ? subs.filter((sub) =>
        sub.name.toLowerCase().includes(q) ||
        (sub.description && sub.description.toLowerCase().includes(q)) ||
        (sub.source && sub.source.toLowerCase().includes(q)) ||
        sub.features.some((f) => f.name.toLowerCase().includes(q))
      )
    : subs;

  // Search input header
  const searchRow = h('div', { class: 'cr-search-row', style: 'display:flex;gap:10px;align-items:center;margin-bottom:8px;' },
    h('input', {
      class: 'cr-input',
      type: 'text',
      placeholder: `Search ${subs.length} ${s.charClass} subclasses (e.g. name, feature, source)…`,
      value: searchQuery,
      oninput: (e: Event) => {
        searchQuery = (e.target as HTMLInputElement).value;
        renderSubclassSelector(container, ctx);
      },
    }),
    searchQuery
      ? h('button', {
          class: 'cr-btn cr-btn-ghost',
          style: 'padding:8px 14px;font-size:12px;',
          title: 'Clear search filter',
          onclick: () => {
            searchQuery = '';
            renderSubclassSelector(container, ctx);
          },
        }, 'CLEAR')
      : null
  );

  // Subclasses grid
  const grid = h('div', { class: 'cr-cards cr-sub-grid' });
  for (const sub of filteredSubs) {
    const isSel = s.subclass === sub.name || s.subclass.toLowerCase() === sub.name.toLowerCase();
    const firstFeature = sub.features[0]?.name || `${sub.source || 'SRD'} path`;
    const sigilKind = cls ? cls.sigil : 'spark';

    grid.append(
      h('button', {
        class: `cr-card cr-sub-card ${isSel ? 'sel' : ''}`,
        onclick: () => {
          ctx.update({ subclass: sub.name });
        },
      },
        h('span', { class: 'cr-card-mark sigil' }, classSigil(sigilKind, 32)),
        h('span', { class: 'cr-card-name', text: sub.name }),
        h('span', { class: 'cr-card-meta' },
          h('span', { class: 'cr-chip gold', text: firstFeature }),
          h('span', { class: 'cr-chip', text: sub.source || 'SRD' })
        ),
        h('span', {
          class: 'cr-card-flavor',
          text: sub.description
            ? (sub.description.length > 130 ? sub.description.slice(0, 130) + '…' : sub.description)
            : 'Specialization path from the SRD database.'
        })
      )
    );
  }

  // Selected subclass aside panel
  const sel = subs.find((x) => s.subclass && x.name.toLowerCase() === s.subclass.toLowerCase());

  const aside = sel
    ? h('div', { class: 'cr-panel' },
        h('div', { class: 'cr-panel-head' },
          h('div', { class: 'cr-panel-title', text: sel.name.toUpperCase() }),
          h('div', { class: 'cr-panel-sub', text: `${s.charClass} Specialization · Source: ${sel.source || 'SRD'}` })
        ),
        h('div', { class: 'cr-chiprow' },
          h('span', { class: 'cr-chip gold', text: `${s.charClass} Archetype` }),
          h('span', { class: 'cr-chip', text: sel.source || 'SRD' }),
          h('span', { class: 'cr-chip gold', text: `${sel.features.length} Features` })
        ),
        sel.description
          ? h('div', { class: 'cr-block', style: 'font-style:italic;line-height:1.55;color:var(--cr-bone-dim);margin:10px 0 14px;' }, sel.description)
          : null,
        h('div', { class: 'cr-block' },
          h('div', { class: 'cr-block-title', text: 'Granted Subclass Features (SRD)' }),
          sel.features.length
            ? h('div', { class: 'cr-traitlist' },
                ...sel.features.map((f) =>
                  h('div', { class: 'cr-trait' },
                    h('div', { class: 'cr-trait-name', text: `Level ${f.level || 1} — ${f.name}` }),
                    h('div', { class: 'cr-trait-desc', text: f.description || '' })
                  )
                )
              )
            : h('div', { class: 'cr-panel-empty', text: 'Features awaken as you gain experience.' })
        ),
        h('div', {
          class: 'cr-hint show',
          style: 'margin-top:14px;padding:8px 10px;background:rgba(184,149,47,0.06);border-left:2px solid var(--cr-gold);',
          text: `Chosen path: ${sel.name}. Granted features and abilities are recorded directly from the SRD database.`
        })
      )
    : h('div', { class: 'cr-panel' },
        h('div', { class: 'cr-panel-head' },
          h('div', { class: 'cr-panel-title', text: 'CHOOSE A PATH' }),
          h('div', { class: 'cr-panel-sub', text: 'The first fork of your calling.' })
        ),
        h('div', { class: 'cr-panel-empty', text: `Select a ${s.charClass} specialization from the SRD database to examine its granted powers, magical traditions, and combat disciplines.` })
      );

  const mainCol = h('div', { class: 'cr-main' },
    h('div', { style: 'display:flex;justify-content:space-between;align-items:baseline;' },
      h('div', { class: 'cr-label', text: `${s.charClass} Subclasses (${subs.length} in SRD Database)` }),
      q ? h('span', { style: 'font-size:12px;color:var(--cr-gold);font-style:italic;', text: `Showing ${filteredSubs.length} of ${subs.length}` }) : null
    ),
    searchRow,
    grid
  );

  container.append(h('div', { class: 'cr-cols' }, mainCol, h('div', { class: 'cr-aside' }, aside)));
}
