# ASHENREACH — 5E Rules Engine Schemas

Authoritative data contracts for `server/src/rules/` (plain ESM, zero deps, never
throws — malformed input falls back to defaults, `null`-able dice return `null`).
Companion to the frozen API list in `docs/CONTRACTS.md` §"5E rules engine".

| Module | Exports |
|---|---|
| `dice.js` | `rollDiceFormula(formula, rng?)`, `d20(mod?, {adv,dis}, rng?)`, `rollDamage(formula, {crit,...})`, `parseDiceFormula`, `formulaAvg`, `splitDiceFormula`, `seqRng` (test rng) |
| `CharacterEngine.js` | `buildCharacter(def) -> Sheet`, `levelUp(sheet, {hpRoll?,rng?})`, `xpForLevel(n)`, `buildCombatProfile(sheet)`, `getAbilityModifier`, `getProficiencyBonus` |
| `CombatEngine.js` | `rollInitiative(tokens, rng?)`, `beginTurn(state, tokenId)`, `nextTurn(state)`, `resolveAction(state, actor, request, rng?)`, `attemptMove(state, token, x, z, {isDM?})`, `applyDamage/applyHealing`, `rollSave`, `rollDeathSave`, `stabilize`, `concentrationCheck`, `effectiveAc`, `distFt` |
| `MonsterAI.js` | `chooseAction(state, monsterToken, srdMonster?, rng?) -> ActionRequest`, `buildMonsterToken(indexEntry, overrides?) -> token`, `parseSpellcastingTrait(traits)` |
| `DirectorAI.js` | `think(state, events?, opts?) -> [{op, payload}]` |

---

## 1. CharacterDef — `buildCharacter(def)` input

The character-creation wizard (client `ui/create`, T2-e) emits exactly this shape
(`CharacterDef` in `creation.ts`). Every field is optional; the engine fills
defensive defaults and NEVER throws.

| Field | Type | Default | Notes |
|---|---|---|---|
| `name` | `string` | `'Nameless'` | truncated to 32 chars |
| `race` | `string` | `'Human'` | any `srd_data.json` race key (case/slug-insensitive) — see list below |
| `subrace` | `string?` | auto | must exist in `race.subraces`; **if the race has subraces and none is given, the FIRST subrace's ASI is applied automatically** (e.g. Human → `Variant`, Dwarf → `Hill Dwarf`, Elf → `High Elf`) |
| `class` | `string` | `'Fighter'` | any SRD class key, slug, or archetype alias — see below |
| `level` | `number` | `1` | clamped 1–20 |
| `background` | `string?` | – | SRD background key (grants skills + feature); unknown → ignored |
| `abilities` | `{str,dex,con,int,wis,cha}` | all `10` | base scores, clamped 1–30; racial ASI applied on top |
| `skillProficiencies` | `string[]` | `[]` | skill names (`'Stealth'`); race traits + background also grant skills |
| `spells` | `{cantrips?: string[], byLevel?: {1: string[], ...}}` | class default book | override the curated default spell list |
| `equipmentOverrides` | `{items?, weapons?, armor?, shield?, spells?}` | – | replace starting equipment (see below) |
| `look` | `Look` (§3) | `{}` | passed through to `sheet.look` |
| `id` | `string?` | generated | stable sheet id (`sheet_<name>_<rand>`) |

**Races** (42 in `srd_data.json`): Dwarf, Elf, Halfling, Human, Dragonborn,
Gnome, Half-Elf, Half-Orc, Tiefling, Aarakocra, Genasi, Goliath, Deep Gnome,
Aasimar, Bugbear, Firbolg, Goblin, Hobgoblin, Kenku, Kobold, Lizardfolk, Orc,
Tabaxi, Triton, Yuan-ti Pureblood, Custom Lineage, Gem Dragonborn, Dhampir,
Hexblood, Reborn, Owlin, Verdan, Leonin, Satyr, Fairy, Harengon, Astral Elf,
Autognome, Giff, Hadozee, Plasmoid, Thri-kreen.
*The creation wizard currently offers the first 6 (Human, Elf, Dwarf, Halfling,
Half-Orc, Tiefling) — the engine accepts all.*

**Classes** (13): Barbarian, Bard, Cleric, Druid, Fighter, Monk, Paladin,
Ranger, Rogue, Sorcerer, Warlock, Wizard, Artificer.
*The creation wizard currently offers 7 of these (Fighter, Wizard, Rogue, Cleric, Sorcerer, Warlock, Barbarian) — the engine accepts all.*

**Archetype aliases** (ASHENREACH flavor → SRD): `warden`→Fighter,
`shadowdancer`→Rogue, `ashen_mage`/`ashenmage`→Wizard, `pale_priest`/`palepriest`→Cleric.

**equipmentOverrides** (all optional):
- `items: (string|{name, qty})[]` — replaces the whole starting kit
- `weapons: (string|{name, qty})[]` — replaces weapons/shield only
- `armor: string|null` — set armor (`null` = none)
- `shield: boolean|null` — shield on/off
- `spells` — alias for `def.spells`

**House rules (documented, deterministic):** starting equipment resolves the
FIRST option of each SRD "(a) X or (b) Y" line; HP per level after 1st is the
average (floor(die/2)+1+CON, min 1); spell-slot tables are the hardcoded PHB
numbers (source JSON arrays are inconsistently indexed).

### Full example

```json
{
  "name": "Vael of the Ash",
  "race": "Human",
  "class": "warden",
  "level": 1,
  "background": "Soldier",
  "abilities": { "str": 16, "dex": 14, "con": 15, "int": 10, "wis": 12, "cha": 8 },
  "skillProficiencies": ["Athletics"],
  "look": {
    "bodyType": "heavy",
    "skinTone": 1,
    "hairStyle": 1,
    "hairColor": 0,
    "cloakColor": 3,
    "eyeColor": 0,
    "faceDecor": "scars"
  }
}
```

---

## 2. Sheet — `buildCharacter(def)` output

Top-level keys (all present on every Sheet):

| Key | Type | Meaning |
|---|---|---|
| `schema` | `'ashenreach.sheet/1'` | version tag |
| `id` | `string` | stable id (persisted) |
| `name` | `string` | ≤32 chars |
| `race`, `subrace`, `class`, `archetype`, `background` | `string\|null` | resolved SRD keys; `archetype` = the original input string |
| `level` | `number` | 1–20 |
| `look` | `Look` | pass-through of `def.look` (§3) |
| `abilities`, `baseAbilities` | `{str..cha: number}` | final (racial applied) / pre-racial scores |
| `mods` | `{str..cha: number}` | ability modifiers |
| `proficiencyBonus` | `number` | by level (2 at 1–4) |
| `saves` | `{str..cha: {proficient: boolean, mod: number}}` | |
| `skills` | `{slug: {name, ability, proficient, mod}}` | all 18 SRD skills, keyed by slug |
| `passive` | `{perception, investigation, insight: number}` | 10 + skill mod |
| `initiative` | `number` | DEX mod |
| `speedFt`, `darkvisionFt`, `languages` | `number`, `number\|null`, `string[]` | from race |
| `ac` | `number` | final AC |
| `acDetail` | `{base, dex, armor, shield, notes}` | how AC was computed |
| `armor`, `shield` | `string\|null`, `boolean` | equipped |
| `hp` | `{current, max, hitDie, hitDiceSpent}` | level 1: `max = hitDie + CON mod` |
| `hitDice` | `{die: 'd10', total, remaining}` | total = level |
| `avgHpPerLevel` | `number` | floor(die/2)+1+CON (used by `levelUp`) |
| `attacks` | `Attack[]` | from starting weapons (see example) |
| `equipped` | `string[]` | zero or one currently wielded weapon name; it is the default attack |
| `spellcasting` | `Spellcasting\|null` | `null` for non-casters; `{ability, abilityMod, saveDC, attackBonus, cantripsKnown, preparedCount, slots: {1: {total, used}}, cantrips: string[], spellsByLevel: {1: string[]}, spells: string[]}` |
| `sneakAttackDice` | `string\|null` | e.g. `'1d6'` (Rogue only) |
| `equipment` | `{name, qty, kind, category}[]` | resolved starting kit |
| `inventory` | `{name, qty, kind, weight, equipped}[]` | equipment + weights; `equipped` is the current weapon/armor/shield state |
| `carrying` | `{weight, capacity, encumbered}` | STR×15 capacity |
| `features` | `{level, name, description}[]` | class features ≤ level |
| `traits` | `{name, description, source: 'race'\|'subrace'\|'background'}[]` | |
| `xp` | `number` | threshold for current level (`xpForLevel`) |
| `deathSaves` | `{ok, fail, stable, dead}` | starts clean |
| `conditions` | `string[]` | starts empty |
| `concentration` | `object\|null` | active concentration |

`buildCombatProfile(sheet)` projects a Sheet into the slimmer token shape
CombatEngine consumes (`attacks[{name,toHit,dmg,...}], saveMods, spellcasting,
dexMod, hp/hpMax/ac/speedFt, sneakAttackDice, sheetId`).

### Full example (output of the §1 def — real values)

```json
{
  "schema": "ashenreach.sheet/1",
  "id": "sheet_vael_x7f2",
  "name": "Vael of the Ash",
  "race": "Human",
  "subrace": "Variant",
  "class": "Fighter",
  "archetype": "warden",
  "level": 1,
  "background": "Soldier",
  "look": {
    "bodyType": "heavy",
    "skinTone": 1,
    "hairStyle": 1,
    "hairColor": 0,
    "cloakColor": 3,
    "eyeColor": 0,
    "faceDecor": "scars"
  },
  "abilities": { "str": 17, "dex": 15, "con": 16, "int": 11, "wis": 13, "cha": 9 },
  "baseAbilities": { "str": 16, "dex": 14, "con": 15, "int": 10, "wis": 12, "cha": 8 },
  "mods": { "str": 3, "dex": 2, "con": 3, "int": 0, "wis": 1, "cha": -1 },
  "proficiencyBonus": 2,
  "saves": {
    "str": { "proficient": true, "mod": 5 },
    "dex": { "proficient": false, "mod": 2 },
    "con": { "proficient": true, "mod": 5 },
    "int": { "proficient": false, "mod": 0 },
    "wis": { "proficient": false, "mod": 1 },
    "cha": { "proficient": false, "mod": -1 }
  },
  "skills": {
    "acrobatics": { "name": "Acrobatics", "ability": "dex", "proficient": false, "mod": 2 },
    "animal_handling": { "name": "Animal Handling", "ability": "wis", "proficient": false, "mod": 1 },
    "arcana": { "name": "Arcana", "ability": "int", "proficient": false, "mod": 0 },
    "athletics": { "name": "Athletics", "ability": "str", "proficient": true, "mod": 5 },
    "deception": { "name": "Deception", "ability": "cha", "proficient": false, "mod": -1 },
    "history": { "name": "History", "ability": "int", "proficient": false, "mod": 0 },
    "insight": { "name": "Insight", "ability": "wis", "proficient": false, "mod": 1 },
    "intimidation": { "name": "Intimidation", "ability": "cha", "proficient": true, "mod": 1 },
    "investigation": { "name": "Investigation", "ability": "int", "proficient": false, "mod": 0 },
    "medicine": { "name": "Medicine", "ability": "wis", "proficient": false, "mod": 1 },
    "nature": { "name": "Nature", "ability": "int", "proficient": false, "mod": 0 },
    "perception": { "name": "Perception", "ability": "wis", "proficient": false, "mod": 1 },
    "performance": { "name": "Performance", "ability": "cha", "proficient": false, "mod": -1 },
    "persuasion": { "name": "Persuasion", "ability": "cha", "proficient": false, "mod": -1 },
    "religion": { "name": "Religion", "ability": "int", "proficient": false, "mod": 0 },
    "sleight_of_hand": { "name": "Sleight of Hand", "ability": "dex", "proficient": false, "mod": 2 },
    "stealth": { "name": "Stealth", "ability": "dex", "proficient": false, "mod": 2 },
    "survival": { "name": "Survival", "ability": "wis", "proficient": false, "mod": 1 }
  },
  "passive": { "perception": 11, "investigation": 10, "insight": 11 },
  "initiative": 2,
  "speedFt": 30,
  "darkvisionFt": null,
  "languages": ["Common"],
  "ac": 18,
  "acDetail": { "base": 16, "dex": 0, "armor": "Chain Mail", "shield": 2, "notes": [] },
  "armor": "Chain Mail",
  "shield": true,
  "hp": { "current": 13, "max": 13, "hitDie": 10, "hitDiceSpent": 0 },
  "hitDice": { "die": "d10", "total": 1, "remaining": 1 },
  "avgHpPerLevel": 9,
  "attacks": [
    {
      "name": "Longsword",
      "ability": "str",
      "proficient": true,
      "attackBonus": 5,
      "damageDice": "1d8",
      "damageMod": 3,
      "damageFormula": "1d8+3",
      "damageType": "slashing",
      "ranged": false,
      "finesse": false,
      "twoHanded": false,
      "versatile": true,
      "thrown": false,
      "ammunition": false,
      "reachFt": 5,
      "rangeFt": null,
      "longRangeFt": null
    },
    {
      "name": "Crossbow, Light",
      "ability": "dex",
      "proficient": true,
      "attackBonus": 4,
      "damageDice": "1d8",
      "damageMod": 2,
      "damageFormula": "1d8+2",
      "damageType": "piercing",
      "ranged": true,
      "finesse": false,
      "twoHanded": true,
      "versatile": false,
      "thrown": false,
      "ammunition": true,
      "reachFt": 5,
      "rangeFt": 80,
      "longRangeFt": 320
    }
  ],
  "spellcasting": null,
  "sneakAttackDice": null,
  "equipment": [
    { "name": "Chain Mail", "qty": 1, "kind": "armor", "category": "heavy" },
    { "name": "Longsword", "qty": 1, "kind": "weapon", "category": "martial_melee" },
    { "name": "Shield", "qty": 1, "kind": "shield", "category": "shields" },
    { "name": "Crossbow, Light", "qty": 1, "kind": "weapon", "category": "simple_ranged" },
    { "name": "Dungeoneer's Pack", "qty": 1, "kind": "pack" }
  ],
  "inventory": [
    { "name": "Chain Mail", "qty": 1, "kind": "armor", "weight": 55 },
    { "name": "Longsword", "qty": 1, "kind": "weapon", "weight": 3 },
    { "name": "Shield", "qty": 1, "kind": "shield", "weight": 6 },
    { "name": "Crossbow, Light", "qty": 1, "kind": "weapon", "weight": 5 },
    { "name": "Dungeoneer's Pack", "qty": 1, "kind": "pack", "weight": 0 }
  ],
  "carrying": { "weight": 69, "capacity": 255, "encumbered": false },
  "features": [
    { "level": 1, "name": "Fighting Style", "description": "Choose one: Archery (+2 ranged attack), Defense (+1 AC while wearing armor), Dueling (+2 damage with one-handed weapon in one hand, no other weapon), Great Weapon Fighting (reroll 1s and 2s on damage with two-handed or versatile weapons), Protection (impose disadvantage on attack vs ally within 5 ft as reaction with shield), Two-Weapon Fighting (add ability modifier to off-hand damage)." },
    { "level": 1, "name": "Second Wind", "description": "Bonus action: regain 1d10 + fighter level HP. Once per short rest." }
  ],
  "traits": [
    { "name": "Extra Language", "description": "You can speak, read, and write one extra language of your choice.", "source": "race" },
    { "name": "Ability Score Increase", "description": "Two different ability scores of your choice increase by 1.", "source": "subrace" },
    { "name": "Skills", "description": "You gain proficiency in one skill of your choice.", "source": "subrace" },
    { "name": "Feat", "description": "You gain one feat of your choice.", "source": "subrace" },
    { "name": "Extra Language", "description": "You can speak, read, and write one extra language of your choice.", "source": "subrace" },
    { "name": "Military Rank", "description": "You have a military rank from your career as a soldier. Soldiers loyal to your former military organization still recognize your authority and influence…", "source": "background" }
  ],
  "xp": 0,
  "deathSaves": { "ok": 0, "fail": 0, "stable": false, "dead": false },
  "conditions": [],
  "concentration": null
}
```

---

## 3. Look — `CharacterDef.look` (character creation contract)

AUTHORITATIVE shape, produced by the client creation wizard (T2-e,
`ui/create/portrait.ts` `LookState`). Seven fields, all required by the wizard;
the engine treats the object as an opaque pass-through (`sheet.look`).

| Field | Type | Allowed values |
|---|---|---|
| `bodyType` | `string` | `'slim' \| 'normal' \| 'heavy'` |
| `skinTone` | `number` | palette index 0–5 (Pale Moth, Ashen, Weathered, Olive Dusk, Deep Umber, Crypt Sallow) |
| `hairStyle` | `number` | palette index 0–4 (Cropped, Topknot, Long, Braids, Shaved) |
| `hairColor` | `number` | palette index 0–5 (Ink Black, Ash Brown, Chestnut, Copper, Bone Silver, Ember Auburn) |
| `cloakColor` | `number` | palette index 0–5 (Charcoal, Ember Umber, Crypt Teal, Blood Maroon, Moss Olive, Slate) |
| `eyeColor` | `number` | palette index 0–3 (Ember, Crypt, Steel, Blood) |
| `faceDecor` | `string` | `'none' \| 'scars' \| 'runes' \| 'warpaint'` |

Indices are consumed modulo palette length, so out-of-range values degrade
gracefully. NOTE: the 3D rig (T2-c, `engine/types.ts` `TokenLook`) consumes a
derived variant (`{bodyType:'lean'|'standard'|'broad'|'tall', skinTone: hex,
hair, hairColor: hex, hoodUp, cloakColor: hex, clothTint, seed}`) — the GM maps
wizard indices → rig values when placing tokens; the seven wizard fields above
are the canonical persisted form.

### Full example

```json
{
  "bodyType": "heavy",
  "skinTone": 1,
  "hairStyle": 1,
  "hairColor": 0,
  "cloakColor": 3,
  "eyeColor": 0,
  "faceDecor": "scars"
}
```

---

## 4. Monster + AI-DM contracts (MonsterAI / DirectorAI)

### 4.1 Monster token — `buildMonsterToken(indexEntry, overrides?)`

Converts a `monsters_index.json` entry (id/name/cr/hp/ac/speedFt/senses/attacks/
saveAttacks/multiattack/traits/abilityScores) into a token carrying the
CombatEngine profile. Merge it into `GameManager.makeMonsterToken` output
(overrides: `{id, x, z, archetype, hidden, ...}`; index values win for
`attacks`/`saveMods` unless overridden):

```json
{
  "id": "mob_x1", "kind": "monster", "ownerId": "DM", "name": "Goblin",
  "monsterId": "goblin", "archetype": "skeleton",
  "x": 0, "z": 0, "rotY": 0,
  "hp": 7, "hpMax": 7, "ac": 15, "speedFt": 30, "initiative": 0,
  "conditions": [], "deathSaves": null, "size": 0.8, "hidden": false,
  "wander": false, "portraitSeed": 123456,
  "senses": { "darkvision": 60, "passive_perception": 9 },
  "dexMod": 2,
  "saveMods": { "str": -1, "dex": 2, "con": 0, "int": 0, "wis": -1, "cha": -1 },
  "attacks": [
    { "name": "Scimitar", "toHit": 4, "dmg": "1d6+2", "dmgType": "slashing",
      "ranged": false, "reachFt": 5, "rangeFt": null, "longRangeFt": null },
    { "name": "Shortbow", "toHit": 4, "dmg": "1d6+2", "dmgType": "piercing",
      "ranged": true, "reachFt": 5, "rangeFt": 80, "longRangeFt": 320 }
  ],
  "spellcasting": null,
  "multiattack": null
}
```

Caster monsters get `spellcasting` parsed from their stat-block "Spellcasting"
trait (Acolyte: `{ability:'wis', saveDC:12, attackBonus:4, slots:{1:{total:3,used:0}}, cantrips:['Light','Sacred Flame','Thaumaturgy'], spellsByLevel:{1:['Bless','Cure Wounds','Sanctuary']}, spells:[...]}`).

### 4.2 `chooseAction(state, monsterToken, srdMonster?, rng?) -> ActionRequest`

Returns a request `CombatEngine.resolveAction` accepts directly, plus one
extension: **`move: {x, z}` (world feet)** — the intended pre-action step.
GameManager wiring per monster turn:

```js
const req = chooseAction(state, monsterToken, srdIndexEntry);
if (req.move) attemptMove(state, monsterToken, req.move.x, req.move.z);   // budget-gated
const res = resolveAction(state, monsterToken, req);                      // {ok, result|reason}
nextTurn(state);
```

Request shape: `{kind: 'attack'|'cast'|'dash'|'dodge', targetId?, spellId?,
weaponName?, attacks?: string[] (multiattack), slotLevel?, slot: 'action',
move?: {x, z}, reason: string}`. `kind` values map to CombatEngine's action
menu; `move` is consumed by the caller (CombatEngine ignores it).

### 4.3 `think(state, events?, opts?) -> [{op, payload}]` (AI-DM)

Poll once per turn end — beats are deduped per state (idempotent).
`opts`: `{partyLevel?, spawnPoints?: [{x,z}] world feet, archetypeFor?(entry), rng?}`.

| op | payload | GameManager handling |
|---|---|---|
| `spawn` | `{name, archetype, x, z, hp, hpMax, ac, speedFt, monsterId, cr}` | `dmCommand({op:'spawn', payload})` — x/z are WORLD FEET; **pass `monsterId` through to the token and attach the combat profile via `buildMonsterToken`** |
| `chat` | `{text, color?}` | `gm.narrate(text, color)` (needs a `chat` case in `dmCommand` or a direct call) |
| `weather` | `{type: 'clear'\|'rain'\|'storm'\|'fog', intensity: 0..1}` | `dmCommand({op:'weather', payload})` |
| `daynight` | `{mode: 'fixed', time: 0..1440}` | `dmCommand({op:'daynight', payload})` |

Heuristics v1: reinforcement wave (1–2 CR-appropriate spawns, party still
standing, all monsters dead before round 2) → retreat narration (first living
monster < 30% HP) → weather shift every 3 rounds, dimming light every 6.

---

## 5. Mechanics overlay — `Mechanics.js` + `server/src/data/mechanics_overlay.json`

The SRD (`srd_data.json`) stays an immutable content database. Executable rules live
in a **separate mechanics overlay**: formulas, costs, triggers and effects compiled
once from SRD prose into deterministic JSON, run by `Mechanics.js` + `CombatEngine.js`
(no LLM, no `eval`). Any feature WITHOUT an overlay entry remains display text on the
sheet — the runtime falls back to showing the SRD description (DeepSeek-pattern:
SRD → display, overlay → mechanics, engine → executes overlay when present).

### Shape

```json
{
  "version": "ashenreach.mechanics/1",
  "resources": { "<id>": { "label", "max": "<expr>", "recovery": "short_rest|long_rest" } },
  "features":  { "<Class>/<Feature>": {
      "id", "name", "activation": "action|bonus|free|reaction|passive",
      "minLevel", "resource?", "sourceFeature?",       // sourceFeature: one SRD feature → many actions
      "cost?: { resourceId, amount: <expr> }",
      "effects": [ { "kind": "heal|condition|extra_action|dash|disengage|hide|turn_undead|create_slot|slot_to_pointS", ... } ]
  } },
  "passives": { "<Class>/<Feature>": { "extraAttacks|uncannyDodge|discipleOfLife|saveAdvantage|style", "minLevel" } },
  "racial":   { "<Race>/<Trait>": { "hook": "reroll_nat1|save_advantage|resistance|damage_floor|crit_extra_dice", ... } },
  "spells":   { "<Name>": { "mode": "attack|save|auto|heal|buff|sleep|shield|hex|charm", "activation?", dice/save/type/... } }
}
```

Formulas are plain expressions over `{level, classLevel, profBonus, strMod..chaMod,
resource, slotLevel}` — a tiny recursive-descent evaluator (numbers, `+ - * /`,
comparisons, ternary, `min/max/floor/ceil/abs`), never throws (malformed → null).

### Sheet integration (built by `buildCharacter`, idempotent via `initResources`)

| Field | Shape | Notes |
|---|---|---|
| `sheet.resources` | `{<id>: {cur, max, recovery, label}}` | pools from features + racial hooks |
| `sheet.actions` | `[{id, name, activation, resource, summary}]` | HUD feature buttons; `passive` excluded |
| `sheet.passives` | `{rerollNat1, saveAdvantage, resistances, damageFloor, critExtraDice, uncannyDodge, extraAttacks, discipleOfLife, fightingStyle}` | hook bundle consulted by CombatEngine |
| `sheet.fightingStyle` | `string\|null` | house default (Fighter/Paladin → Defense, Ranger → Archery) until the creation UI offers the choice |

### Compiled in v1 (playable classes + wizard races)

- **Fighter**: Second Wind (bonus, 1d10+level, 1/short rest), Action Surge (extra
  action, 1/short rest), Fighting Style (Defense default; Archery/Dueling/GWF
  mechanical), Extra Attack (lvl 5)
- **Barbarian**: Rage (+2/3/4 STR melee dmg, B/P/S resistance, no casting, 10
  rounds, 2–6/long rest), Reckless Attack (adv both ways), Unarmored Defense
  (10+DEX+CON), Fast Movement (+10 ft, no heavy armor), Danger Sense (DEX saves adv)
- **Rogue**: Cunning Action (bonus Dash/Disengage/Hide), Uncanny Dodge (reaction,
  halve, auto when reaction free), Sneak Attack (pre-existing)
- **Cleric**: Channel Divinity: Turn Undead (action, 30 ft, WIS save or frightened;
  gated on `token.creatureType === 'undead'`), Disciple of Life (heal spells +2+slot level)
- **Wizard**: Arcane Recovery (auto on short rest, slot levels ≤ ceil(level/2),
  cheapest first, 1/long rest)
- **Sorcerer**: Font of Magic (points = level), Flexible Casting (create 2nd-level
  slot for 2 points; burn highest slot for its level)
- **Races**: Halfling Lucky/Brave, Half-Orc Relentless Endurance/Savage Attacks,
  Dwarven Resilience (poison adv + resistance), Elf Fey Ancestry, Tiefling Hellish
  Resistance (fire)
- **Spells**: Shield (reaction, +5 AC), Hex (+1d6 necrotic rider on the hexer's
  hits, breaks… concentration), Charm Person (WIS save → charmed; breaks on damage)
  join the 24 previously-compiled spells (table now lives in the overlay, inline
  fallback preserved)

### Rests & reactions

- `shortRest(sheet, dice?)` → also recovers `short_rest` pools + Arcane Recovery;
  `longRest(sheet)` → recovers ALL pools (RAW) + `initResources` refresh (new
  features unlock at the new level).
- **Opportunity attacks**: `CombatEngine.opportunityAttacks(state, mover, fromX,
  fromZ)` scans each voluntary in-combat move segment; CombatDriver resolves each
  as a `slot:'reaction'` attack with `opportunity: true` (range gate relaxed — the
  strike lands at the leave-reach boundary). Disengage/used reaction suppress.
  Auto-resolved for both sides (house automation; DM can house-rule later).
