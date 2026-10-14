#!/usr/bin/env node
// tools/srd_query.mjs — Deterministic, token-safe SRD query CLI
// Run: node tools/srd_query.mjs <command> [args...]
import {
  list_top_level, keys, get, count, slice, search,
  get_race, get_class, get_class_features, get_spell_slots,
  get_spell_list, get_spell, get_equipment_stats, get_feat, get_background
} from '../server/src/rules/srd.js';

const [,, cmd, ...args] = process.argv;

function out(data) {
  if (data === undefined) {
    console.error('null / not found');
    process.exit(1);
  }
  if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') {
    console.log(data);
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}

switch (cmd) {
  case 'top':
  case 'list_top_level':
    out(list_top_level());
    break;

  case 'keys':
    out(keys(args[0] || '/'));
    break;

  case 'get':
    out(get(args[0] || '/'));
    break;

  case 'count':
    out(count(args[0] || '/'));
    break;

  case 'slice':
    out(slice(args[0] || '/', Number(args[1]) || 0, Number(args[2]) || 10));
    break;

  case 'search':
    out(search(args[0], args[1], args[2]));
    break;

  case 'race':
    out(get_race(args[0], args[1]));
    break;

  case 'class':
    out(get_class(args[0], args[1] && isNaN(Number(args[1])) ? args[1] : null, !isNaN(Number(args[args.length - 1])) ? Number(args[args.length - 1]) : null));
    break;

  case 'features':
    out(get_class_features(args[0], Number(args[1]) || 1));
    break;

  case 'slots':
    out(get_spell_slots(args[0], Number(args[1]) || 1));
    break;

  case 'spells':
    out(get_spell_list(args[0], Number(args[1]) || 9));
    break;

  case 'spell':
    out(get_spell(args.join(' ')));
    break;

  case 'equipment':
  case 'item':
    out(get_equipment_stats(args.join(' ')));
    break;

  case 'feat':
    out(get_feat(args.join(' ')));
    break;

  case 'background':
    out(get_background(args.join(' ')));
    break;

  default:
    console.log(`Usage: node tools/srd_query.mjs <command> [args...]
Commands:
  top                         List top-level sections
  keys <path>                 List keys at JSON path (e.g. /classes)
  get <path>                  Get exact value at JSON path (e.g. /classes/Fighter/hit_die)
  count <path>                Count items at path
  slice <path> <start> <end>  Slice array/keys at path
  search <sec> <field> <val>  Search in section by field value
  race <name> [subrace]       Get race stats and traits
  class <name> [sub] [level]  Get class stats and features
  features <name> [level]     Get class features up to level
  slots <name> [level]        Get spell slots at level
  spells <class> [maxLevel]   Get spell list for class
  spell <name>                Get spell details
  equipment <name>            Get equipment/weapon/armor stats
  feat <name>                 Get feat details
  background <name>           Get background details`);
    break;
}
