// ═══════════════════════════════════════════════════════════════════════════
// gamedata.ts — full SRD data for the character creation wizard.
//
// EXTRACTION NOTE (FIX 6, task 4-c — supersedes the T2-e 6-race/7-class cut):
//   GENERATED FILE — do not hand-edit the literal data blocks. Regenerate with:
//     node /home/z/my-project/scripts/gen_gamedata.mjs
//   Source of truth: /home/z/my-project/ashenreach/_refs/Custom-VTT/client/src/
//   data/srd_data.json (v2.1.0) — ALL 42 races and ALL 13 classes, trimmed for
//   the wizard preview. Kept fields:
//     - races (42): ASI (+ auto-picked first subrace, see below), speed, size,
//       darkvision, languages, traits (desc ~220ch)
//     - classes (13): hit die, primary ability, saves, proficiencies, level-1
//       features, spellcasting note (level-1 cantrips/slots hardcoded to the
//       server's PHB tables — the source JSON slot arrays are inconsistently
//       indexed per class), starting equipment strings
//     - subclasses: ONLY classes that choose at level 1 — Cleric (Divine
//       Domain), Sorcerer (Sorcerous Origin), Warlock (Otherworldly Patron).
//       Level-3 choosers (Fighter, Rogue, …) get a wizard note instead.
//     - backgrounds (13 PHB), ability score info, equipment packs (unchanged)
//   SUBRACE HOUSE RULE (matches server CharacterEngine / SCHEMA.md §1): when a
//   race has subraces and none is chosen, the FIRST subrace's ASI is applied
//   automatically. We ship that subrace (name + numeric ASI) on each race and
//   racialAsi() folds it in, so the client preview equals the server sheet.
//   The wizard emits `subclass` in its CharacterDef; the server's GameManager
//   currently strips it before buildCharacter (ignored, not an error).
// ═══════════════════════════════════════════════════════════════════════════

export type AbilityKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';
export const ABILITY_KEYS: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

export interface Trait { name: string; desc: string; }

export interface RaceInfo {
  id: string; flavor: string;
  asi: Partial<Record<AbilityKey, number>>;
  /** auto-picked first subrace (server house rule) — its ASI is folded into racialAsi() */
  subrace: { name: string; asi: Partial<Record<AbilityKey, number>> } | null;
  speed: number; size: string; darkvision: number; languages: string[];
  traits: Trait[];
}

export type ClassSigil = 'sword' | 'eye' | 'dagger' | 'flame' | 'spark' | 'pact' | 'axe'
  | 'song' | 'leaf' | 'fist' | 'sun' | 'arrow' | 'gear';

export interface ClassInfo {
  id: string; flavor: string; sigil: ClassSigil;
  hitDie: number; primary: string[]; saves: string[];
  armor: string[]; weapons: string[]; tools: string[];
  skills: { count: number; from: string[] } | null;
  features: Trait[];
  spellAbility: string | null; spellNote: string | null;
  equipment: string[];
}

export interface SubclassInfo {
  id: string; name: string; flavor: string;
  feature: Trait;                 // the level-1 feature the path grants
}

export interface BackgroundInfo {
  id: string; flavor: string;
  skills: string[]; tools: string[]; languages: number;
  equipment: string[];
  feature: Trait;
}

// ── raw shapes emitted by the extraction script ──
interface RawRace {
  id: string; asi: Record<string, number>;
  subrace: { name: string; asi: Record<string, number> } | null;
  speed: number; size: string; darkvision: number; languages: string[]; traits: Trait[];
}
interface RawClass {
  id: string; hitDie: number; primary: string[]; saves: string[];
  armor: string[]; weapons: string[]; tools: string[];
  skills: { count: number; from: string[] } | null;
  features: Trait[]; spellAbility: string | null; spellNote: string | null;
  equipment: string[];
}
interface RawSubclass { id: string; name: string; flavor: string; feature: Trait; }
interface RawBg {
  id: string; skills: string[]; tools: string[]; languages: number;
  equipment: string[]; feature: Trait;
}

// ═══ DATA (extracted — do not hand-edit the literal blocks) ═══
const RACE_DATA: RawRace[] = [
  { id:"Dwarf", asi:{"CON":2}, subrace:{ name:"Hill Dwarf", asi:{"WIS":1} },
    speed:25, size:"Medium",
    darkvision:60, languages:["Common","Dwarvish"],
    traits:[
      { name:"Dwarven Resilience", desc:"Advantage on saving throws against poison, and resistance against poison damage." },
      { name:"Dwarven Combat Training", desc:"Proficiency with battleaxes, hand crossbows, light hammers, and warhammers." },
      { name:"Tool Proficiency", desc:"Proficiency with one artisan's tool of your choice: smith's tools, brewer's supplies, or mason's tools." },
      { name:"Stonecunning", desc:"Whenever you make an Intelligence (History) check related to the origin of stonework, you are considered proficient in the History skill and add double your proficiency bonus to the check." }
    ] },
  { id:"Elf", asi:{"DEX":2}, subrace:{ name:"High Elf", asi:{"INT":1} },
    speed:30, size:"Medium",
    darkvision:60, languages:["Common","Elvish"],
    traits:[
      { name:"Keen Senses", desc:"Proficiency in the Perception skill." },
      { name:"Fey Ancestry", desc:"Advantage on saving throws against being charmed, and magic cannot put you to sleep." },
      { name:"Trance", desc:"Elves don't need to sleep. Instead, they meditate deeply, remaining semiconscious, for 4 hours a day. After resting in this way, you gain the same benefit that a human does from 8 hours of sleep." }
    ] },
  { id:"Halfling", asi:{"DEX":2}, subrace:{ name:"Lightfoot", asi:{"CHA":1} },
    speed:25, size:"Small",
    darkvision:0, languages:["Common","Halfling"],
    traits:[
      { name:"Lucky", desc:"When you roll a 1 on the d20 for an attack roll, ability check, or saving throw, you can reroll the die and must use the new roll." },
      { name:"Brave", desc:"You have advantage on saving throws against being frightened." },
      { name:"Halfling Nimbleness", desc:"You can move through the space of any creature that is of a size larger than yours." }
    ] },
  { id:"Human", asi:{"STR":1,"DEX":1,"CON":1,"INT":1,"WIS":1,"CHA":1}, subrace:{ name:"Variant", asi:{} },
    speed:30, size:"Medium",
    darkvision:0, languages:["Common"],
    traits:[
      { name:"Extra Language", desc:"You can speak, read, and write one extra language of your choice." }
    ] },
  { id:"Dragonborn", asi:{"STR":2,"CHA":1}, subrace:{ name:"Black", asi:{} },
    speed:30, size:"Medium",
    darkvision:0, languages:["Common","Draconic"],
    traits:[
      { name:"Draconic Ancestry", desc:"You have draconic ancestry. Choose one type of dragon from the Draconic Ancestry table. Your breath weapon and damage resistance are determined by the dragon type." },
      { name:"Breath Weapon", desc:"You can use your action to exhale destructive energy. Your draconic ancestry determines the size, shape, and damage type of the exhalation. When you use your breath weapon, each creature in the area of the exhalation…" },
      { name:"Damage Resistance", desc:"You have resistance to the damage type associated with your draconic ancestry." },
      { name:"Draconic Heritage", desc:"You can speak, read, and write Draconic." }
    ] },
  { id:"Gnome", asi:{"INT":2}, subrace:{ name:"Forest Gnome", asi:{"DEX":1} },
    speed:25, size:"Small",
    darkvision:60, languages:["Common","Gnomish"],
    traits:[
      { name:"Gnome Cunning", desc:"You have advantage on all Intelligence, Wisdom, and Charisma saving throws against magic." }
    ] },
  { id:"Half-Elf", asi:{"CHA":2}, subrace:{ name:"Wood Elf Descent", asi:{} },
    speed:30, size:"Medium",
    darkvision:60, languages:["Common","Elvish"],
    traits:[
      { name:"Fey Ancestry", desc:"Advantage on saving throws against being charmed, and magic cannot put you to sleep." },
      { name:"Skill Versatility", desc:"You gain proficiency in two skills of your choice." },
      { name:"Extra Language", desc:"You can speak, read, and write one extra language of your choice." },
      { name:"Ability Score Increase", desc:"Two other ability scores of your choice increase by 1." }
    ] },
  { id:"Half-Orc", asi:{"STR":2,"CON":1}, subrace:null,
    speed:30, size:"Medium",
    darkvision:60, languages:["Common","Orc"],
    traits:[
      { name:"Menacing", desc:"You gain proficiency in the Intimidation skill." },
      { name:"Relentless Endurance", desc:"When you are reduced to 0 hit points but not killed outright, you can drop to 1 hit point instead. You can't use this feature again until you finish a long rest." },
      { name:"Savage Attacks", desc:"When you score a critical hit with a melee weapon attack, you can roll one of the weapon's damage dice one additional time and add it to the extra damage of the critical hit." }
    ] },
  { id:"Tiefling", asi:{"CHA":2,"INT":1}, subrace:{ name:"Feral", asi:{"DEX":1} },
    speed:30, size:"Medium",
    darkvision:60, languages:["Common","Infernal"],
    traits:[
      { name:"Hellish Resistance", desc:"You have resistance to fire damage." },
      { name:"Infernal Legacy", desc:"You know the thaumaturgy cantrip. At 3rd level, you can cast hellish rebuke once per day as a 2nd-level spell. At 5th level, you can cast darkness once per day. Charisma is your spellcasting ability for these spells." }
    ] },
  { id:"Aarakocra", asi:{"DEX":2,"WIS":1}, subrace:null,
    speed:25, size:"Medium",
    darkvision:0, languages:["Common","Aarakocra","Auran"],
    traits:[
      { name:"Flight", desc:"You have a flying speed of 50 feet. To use this speed, you can't be wearing medium or heavy armor." },
      { name:"Talons", desc:"You are proficient with your unarmed strikes, which deal 1d4 slashing damage on a hit." }
    ] },
  { id:"Genasi", asi:{"CON":2}, subrace:{ name:"Air Genasi", asi:{"DEX":1} },
    speed:30, size:"Medium",
    darkvision:0, languages:["Common","Primordial"],
    traits:[

    ] },
  { id:"Goliath", asi:{"STR":2,"CON":1}, subrace:null,
    speed:30, size:"Medium",
    darkvision:0, languages:["Common","Giant"],
    traits:[
      { name:"Natural Athlete", desc:"You have proficiency in the Athletics skill." },
      { name:"Stone's Endurance", desc:"You can focus yourself to occasionally shrug off injury. When you take damage, you can use your reaction to roll a d12. Add your Constitution modifier to the number rolled, and reduce the damage by that total. After…" },
      { name:"Powerful Build", desc:"You count as one size larger when determining your carrying capacity and the weight you can push, drag, or lift." },
      { name:"Mountain Born", desc:"You're acclimated to high altitude, including elevations above 20,000 feet. You're also naturally adapted to cold climates, as described in chapter 5 of the Dungeon Master's Guide." }
    ] },
  { id:"Deep Gnome", asi:{"INT":2,"DEX":1}, subrace:{ name:"MToF Expanded", asi:{} },
    speed:25, size:"Small",
    darkvision:120, languages:["Common","Gnomish","Undercommon"],
    traits:[
      { name:"Superior Darkvision", desc:"Darkvision radius is 120 feet." },
      { name:"Gnome Cunning", desc:"You have advantage on all Intelligence, Wisdom, and Charisma saving throws against magic." },
      { name:"Svirfneblin Camouflage", desc:"When you make a Dexterity (Stealth) check while in rocky terrain, you can add twice your proficiency bonus to the roll." },
      { name:"Stone Camouflage", desc:"You have advantage on Dexterity (Stealth) checks made to hide in rocky terrain." }
    ] },
  { id:"Aasimar", asi:{"CHA":2}, subrace:{ name:"Protector", asi:{"WIS":1} },
    speed:30, size:"Medium",
    darkvision:60, languages:["Common","Celestial"],
    traits:[
      { name:"Celestial Resistance", desc:"You have resistance to necrotic damage and radiant damage." },
      { name:"Healing Hands", desc:"As an action, you can touch a creature and cause it to regain a number of hit points equal to your level. Once you use this trait, you can't use it again until you finish a long rest." },
      { name:"Light Bearer", desc:"You know the light cantrip. Charisma is your spellcasting ability for it." }
    ] },
  { id:"Bugbear", asi:{"STR":2,"DEX":1}, subrace:null,
    speed:30, size:"Medium",
    darkvision:60, languages:["Common","Goblin"],
    traits:[
      { name:"Long-Limbed", desc:"When you make a melee attack on your turn, your reach for it is 5 feet greater than normal." },
      { name:"Surprise Attack", desc:"If you surprise a creature and hit it with an attack on your first turn in combat, the attack deals an extra 2d6 damage to it." },
      { name:"Sneaky", desc:"You are proficient in the Stealth skill." },
      { name:"Powerful Build", desc:"You count as one size larger when determining your carrying capacity and the weight you can push, drag, or lift." }
    ] },
  { id:"Firbolg", asi:{"WIS":2,"STR":1}, subrace:null,
    speed:30, size:"Medium",
    darkvision:60, languages:["Common","Elvish","Giant"],
    traits:[
      { name:"Firbolg Magic", desc:"You can cast detect magic and disguise self with this trait, using Wisdom as your spellcasting ability. Once you cast either spell, you can't cast it again with this trait until you finish a short or long rest. When…" },
      { name:"Hidden Step", desc:"As a bonus action, you can magically turn invisible until the start of your next turn or until you attack, make a damage roll, or force someone to make a saving throw. Once you use this trait, you can't use it again…" },
      { name:"Powerful Build", desc:"You count as one size larger when determining your carrying capacity and the weight you can push, drag, or lift." },
      { name:"Speech of Beast and Leaf", desc:"You have the ability to communicate in a limited manner with beasts and plants. They can understand the meaning of your words, though you have no special ability to understand them in return. You have advantage on all…" }
    ] },
  { id:"Goblin", asi:{"DEX":2,"CON":1}, subrace:null,
    speed:30, size:"Small",
    darkvision:60, languages:["Common","Goblin"],
    traits:[
      { name:"Darkvision", desc:"You can see in dim light within 60 feet as if it were bright light, and in darkness as if it were dim light." },
      { name:"Fury of the Small", desc:"When you damage a creature with an attack or a spell and the creature's size is larger than yours, you can cause the attack or spell to deal extra damage to the creature equal to your level. Once you use this trait…" },
      { name:"Nimble Escape", desc:"You can take the Disengage or Hide action as a bonus action on each of your turns." }
    ] },
  { id:"Hobgoblin", asi:{"CON":2,"INT":1}, subrace:null,
    speed:30, size:"Medium",
    darkvision:60, languages:["Common","Goblin"],
    traits:[
      { name:"Saving Face", desc:"Hobgoblins are careful not to show weakness in front of their allies, for fear of losing status. If you miss with an attack roll or fail an ability check or a saving throw, you can gain a bonus to the roll equal to the…" },
      { name:"Martial Training", desc:"You are proficient with two martial weapons of your choice and with light armor." }
    ] },
  { id:"Kenku", asi:{"DEX":2,"WIS":1}, subrace:null,
    speed:30, size:"Medium",
    darkvision:0, languages:["Common","Auran"],
    traits:[
      { name:"Expert Forgery", desc:"You can duplicate other creatures' handwriting and craftwork. You have advantage on all checks made to produce forgeries or duplicates of existing objects." },
      { name:"Kenku Training", desc:"You are proficient in your choice of two of the following skills: Acrobatics, Deception, Stealth, and Sleight of Hand." },
      { name:"Mimicry", desc:"You can mimic sounds you have heard, including voices. A creature that hears the sounds can tell they are imitations with a successful Wisdom (Insight) check opposed by your Charisma (Deception) check." }
    ] },
  { id:"Kobold", asi:{"DEX":2,"STR":-2}, subrace:null,
    speed:30, size:"Small",
    darkvision:60, languages:["Common","Draconic"],
    traits:[
      { name:"Darkvision", desc:"You can see in dim light within 60 feet as if it were bright light, and in darkness as if it were dim light." },
      { name:"Grovel, Cower, and Beg", desc:"As an action on your turn, you can cower pathetically to distract nearby foes. Until the end of your next turn, your allies gain advantage on attack rolls against enemies within 10 feet of you that can see you. Once…" },
      { name:"Pack Tactics", desc:"You have advantage on an attack roll against a creature if at least one of your allies is within 5 feet of the creature and the ally isn't incapacitated." },
      { name:"Sunlight Sensitivity", desc:"You have disadvantage on attack rolls and on Wisdom (Perception) checks that rely on sight when you, the target of your attack, or whatever you are trying to perceive is in direct sunlight." }
    ] },
  { id:"Lizardfolk", asi:{"CON":2,"WIS":1}, subrace:null,
    speed:30, size:"Medium",
    darkvision:0, languages:["Common","Draconic"],
    traits:[
      { name:"Bite", desc:"You have a fanged maw that you can use to make unarmed strikes. When you hit with it, the strike deals 1d6 + your Strength modifier slashing damage, instead of the bludgeoning damage normal for an unarmed strike." },
      { name:"Cunning Artisan", desc:"As part of a short rest, you can harvest bone and hide from a slain beast, construct, dragon, monstrosity, or plant creature of size Small or larger to create one of the following items: a shield, a club, a javelin, or…" },
      { name:"Hold Breath", desc:"You can hold your breath for up to 15 minutes at a time." },
      { name:"Hunter's Lore", desc:"You gain proficiency with two of the following skills of your choice: Animal Handling, Nature, Perception, Stealth, and Survival." },
      { name:"Natural Armor", desc:"You have tough, scaly skin. When you aren't wearing armor, your AC is 13 + your Dexterity modifier. You can use your natural armor to determine your AC if the armor you wear would leave you with a lower AC. A shield's…" },
      { name:"Hungry Jaws", desc:"In battle, you can throw yourself into a vicious feeding frenzy. As a bonus action, you can make a special attack with your bite. If the attack hits, it deals its normal damage, and you gain temporary hit points equal…" }
    ] },
  { id:"Orc", asi:{"STR":2,"CON":1,"INT":-2}, subrace:null,
    speed:30, size:"Medium",
    darkvision:60, languages:["Common","Orc"],
    traits:[
      { name:"Aggressive", desc:"As a bonus action, you can move up to your speed toward an enemy of your choice that you can see or hear. You must end this move closer to the enemy than you started." },
      { name:"Menacing", desc:"You are trained in the Intimidation skill." },
      { name:"Powerful Build", desc:"You count as one size larger when determining your carrying capacity and the weight you can push, drag, or lift." }
    ] },
  { id:"Tabaxi", asi:{"DEX":2,"CHA":1}, subrace:null,
    speed:30, size:"Medium",
    darkvision:60, languages:["Common","Sylvan"],
    traits:[
      { name:"Darkvision", desc:"You have a cat's keen senses, especially in the dark. You can see in dim light within 60 feet as if it were bright light, and in darkness as if it were dim light." },
      { name:"Feline Agility", desc:"Your reflexes and agility allow you to move with a burst of speed. When you move on your turn in combat, you can double your speed until the end of the turn. Once you use this trait, you can't use it again until you…" },
      { name:"Cat's Claws", desc:"Because of your claws, you have a climbing speed of 20 feet. In addition, your claws are natural weapons, which you can use to make unarmed strikes. If you hit with them, you deal slashing damage equal to 1d4 + your…" },
      { name:"Cat's Talent", desc:"You have proficiency in the Perception and Stealth skills." }
    ] },
  { id:"Triton", asi:{"STR":1,"CON":1,"CHA":1}, subrace:null,
    speed:30, size:"Medium",
    darkvision:0, languages:["Common","Primordial"],
    traits:[
      { name:"Amphibious", desc:"You can breathe air and water." },
      { name:"Control Air and Water", desc:"You can cast fog cloud with this trait. Starting at 3rd level, you can cast gust of wind with it, and starting at 5th level, you can also cast wall of water with it. Once you cast a spell with this trait, you can't…" },
      { name:"Emissary of the Sea", desc:"You can communicate simple ideas with any beast that has an innate swimming speed. They can understand the meaning of your words, though you have no special ability to understand them in return." },
      { name:"Guardians of the Depths", desc:"Adapted to even the most extreme ocean depths, you have resistance to cold damage, and you ignore any of the drawbacks caused by a deep, underwater environment." },
      { name:"Swim", desc:"You have a swimming speed of 30 feet." }
    ] },
  { id:"Yuan-ti Pureblood", asi:{"CHA":2,"INT":1}, subrace:null,
    speed:30, size:"Medium",
    darkvision:60, languages:["Common","Abyssal"],
    traits:[
      { name:"Darkvision", desc:"You can see in dim light within 60 feet as if it were bright light, and in darkness as if it were dim light." },
      { name:"Innate Spellcasting", desc:"You know the poison spray cantrip. At 3rd level, you can cast animal friendship (snakes only) once per day. At 5th level, you can cast suggestion once per day. Charisma is your spellcasting ability for these spells." },
      { name:"Magic Resistance", desc:"You have advantage on all saving throws against spells and other magical effects." },
      { name:"Poison Immunity", desc:"You are immune to poison damage and the poisoned condition." }
    ] },
  { id:"Custom Lineage", asi:{}, subrace:null,
    speed:30, size:"Medium",
    darkvision:60, languages:["Common","One other of your choice"],
    traits:[
      { name:"Ability Score Increase", desc:"One ability score of your choice increases by 2." },
      { name:"Feat", desc:"You gain one feat of your choice." },
      { name:"Variable Trait", desc:"You are Medium or Small. You choose one skill in which you gain proficiency. You can choose one of the following: darkvision 60 ft., or proficiency in one skill of your choice." }
    ] },
  { id:"Gem Dragonborn", asi:{"STR":2,"CHA":1}, subrace:{ name:"Amethyst", asi:{} },
    speed:30, size:"Medium",
    darkvision:60, languages:["Common","Draconic"],
    traits:[
      { name:"Gem Ancestry", desc:"You have a gem dragon ancestor, which determines the damage type of your breath weapon and your psionic ability." },
      { name:"Breath Weapon", desc:"You can use your action to exhale destructive energy. When you use your breath weapon, each creature in the area must make a saving throw. The DC equals 8 + your Constitution modifier + your proficiency bonus. A…" },
      { name:"Psionic Mind", desc:"You can send telepathic messages to any creature you can see within 30 feet of you. The creature can understand you only if it knows the language you're using." },
      { name:"Gem Resistance", desc:"You have resistance to the damage type associated with your gem ancestry." }
    ] },
  { id:"Dhampir", asi:{}, subrace:null,
    speed:35, size:"Medium",
    darkvision:60, languages:["Common"],
    traits:[
      { name:"Ability Score Increase", desc:"Increase one ability score by 2, and increase a different one by 1, or increase three different scores by 1." },
      { name:"Darkvision", desc:"You can see in dim light within 60 feet as if it were bright light, and in darkness as if it were dim light." },
      { name:"Deathless Nature", desc:"You don't need to breathe. You are immune to disease. You have resistance to poison damage, and you have advantage on saving throws against being poisoned." },
      { name:"Spider Climb", desc:"You have a climbing speed equal to your walking speed. In addition, at 3rd level, you can move up, down, and across vertical surfaces and upside down on ceilings while leaving your hands free." },
      { name:"Vampiric Bite", desc:"Your fanged bite is a natural weapon, which counts as a simple melee weapon with which you are proficient. You add your Constitution modifier, instead of your Strength modifier, to attack and damage rolls. It deals 1d4…" }
    ] },
  { id:"Hexblood", asi:{}, subrace:null,
    speed:30, size:"Medium",
    darkvision:60, languages:["Common","Sylvan"],
    traits:[
      { name:"Ability Score Increase", desc:"Increase one ability score by 2, and increase a different one by 1, or increase three different scores by 1." },
      { name:"Darkvision", desc:"You can see in dim light within 60 feet as if it were bright light, and in darkness as if it were dim light." },
      { name:"Eerie Token", desc:"As a bonus action, you can harmlessly detach a fingernail, a lock of hair, or one of your teeth. A creature carrying your token has advantage on ability checks made to track you, and you know the token's location and…" },
      { name:"Hex Magic", desc:"You can cast disguise self and hex with this trait, using Intelligence, Wisdom, or Charisma as your spellcasting ability (choose when you select this race). Once you cast either spell with this trait, you can't cast…" },
      { name:"Fey Type", desc:"Your creature type is fey, rather than humanoid." }
    ] },
  { id:"Reborn", asi:{}, subrace:null,
    speed:30, size:"Medium",
    darkvision:60, languages:["Common"],
    traits:[
      { name:"Ability Score Increase", desc:"Increase one ability score by 2, and increase a different one by 1, or increase three different scores by 1." },
      { name:"Darkvision", desc:"You can see in dim light within 60 feet as if it were bright light, and in darkness as if it were dim light." },
      { name:"Deathless Nature", desc:"You don't need to sleep, and magic can't put you to sleep. You can finish a long rest in 4 hours if you spend those hours in an inactive, motionless state, during which you retain consciousness. You have advantage on…" },
      { name:"Knowledge from a Past Life", desc:"You temporarily remember glimpses of the past, perhaps memories of an ancient conflict, long-dead loved ones, or a distant homeland. Whenever you make an ability check that uses a skill, you can roll a d6 immediately…" }
    ] },
  { id:"Owlin", asi:{}, subrace:null,
    speed:30, size:"Medium",
    darkvision:120, languages:["Common","One other of your choice"],
    traits:[
      { name:"Ability Score Increase", desc:"Increase one ability score by 2, and increase a different one by 1, or increase three different scores by 1." },
      { name:"Darkvision", desc:"You can see in dim light within 120 feet as if it were bright light, and in darkness as if it were dim light." },
      { name:"Flight", desc:"You have a flying speed equal to your walking speed. To use this speed, you can't be wearing medium or heavy armor." },
      { name:"Silent Feathers", desc:"You have proficiency in the Stealth skill." }
    ] },
  { id:"Verdan", asi:{"CON":2,"CHA":1}, subrace:null,
    speed:30, size:"Small",
    darkvision:0, languages:["Common","Goblin","One other of your choice"],
    traits:[
      { name:"Black Blood Healing", desc:"The black blood of the verdan is thick and adhesive, aiding in the healing process. When you roll a 1 or 2 on any Hit Die you spend to regain hit points at the end of a short rest, you can reroll the die and must use…" },
      { name:"Fortune Favors the Verdant", desc:"You can add 1d4 to any ability check you make that uses a skill in which you lack proficiency. You can use this trait a number of times equal to your proficiency bonus, regaining all expended uses when you finish a…" },
      { name:"Limited Telepathy", desc:"You can telepathically communicate with any creature you can see within 30 feet of you. You don't need to share a language with the creature for it to understand your telepathic utterances, but the creature must be…" },
      { name:"Telepathic Insight", desc:"Your mind's awareness of others lends you a particular insight into their behavior. You have advantage on Wisdom (Insight) checks to determine whether a creature is lying or telling the truth." }
    ] },
  { id:"Leonin", asi:{"CON":2,"STR":1}, subrace:null,
    speed:35, size:"Medium",
    darkvision:60, languages:["Common","Leonin"],
    traits:[
      { name:"Darkvision", desc:"You can see in dim light within 60 feet as if it were bright light, and in darkness as if it were dim light." },
      { name:"Daunting Roar", desc:"As a bonus action, you can let out an intimidating roar. Each creature of your choice within 10 feet of you must succeed on a Wisdom saving throw (DC equals 8 + your proficiency bonus + your Constitution modifier) or…" },
      { name:"Hunter's Instincts", desc:"You have proficiency in one of the following skills of your choice: Athletics, Intimidation, Perception, or Survival." },
      { name:"Pride's Claws", desc:"Your claws are natural weapons, which you can use to make unarmed strikes. If you hit with them, you deal slashing damage equal to 1d4 + your Strength modifier, instead of the bludgeoning damage normal for an unarmed…" }
    ] },
  { id:"Satyr", asi:{"CHA":2,"DEX":1}, subrace:null,
    speed:35, size:"Medium",
    darkvision:0, languages:["Common","Sylvan"],
    traits:[
      { name:"Fey", desc:"Your creature type is fey, rather than humanoid." },
      { name:"Ram", desc:"You can use your head and horns to make unarmed strikes. If you hit with them, you deal bludgeoning damage equal to 1d4 + your Strength modifier." },
      { name:"Magic Resistance", desc:"You have advantage on saving throws against spells and other magical effects." },
      { name:"Mirthful Leaps", desc:"Whenever you make a long or high jump, you can roll a d8 and add the number rolled to the number of feet you cover, even when making a standing jump. This extra distance costs movement as normal." },
      { name:"Reveler", desc:"You have proficiency in the Performance and Persuasion skills, and you have proficiency with one musical instrument of your choice." }
    ] },
  { id:"Fairy", asi:{}, subrace:null,
    speed:30, size:"Small",
    darkvision:0, languages:["Common","Sylvan"],
    traits:[
      { name:"Ability Score Increase", desc:"Increase one ability score by 2, and increase a different one by 1, or increase three different scores by 1." },
      { name:"Fey", desc:"Your creature type is fey, rather than humanoid." },
      { name:"Fairy Flight", desc:"You have a flying speed equal to your walking speed. To use this speed, you can't be wearing medium or heavy armor." },
      { name:"Fey Magic", desc:"You know the druidcraft cantrip. At 3rd level, you can cast faerie fire once per day. At 5th level, you can cast enlarge/reduce once per day. You choose which version of enlarge/reduce to cast when you cast it…" }
    ] },
  { id:"Harengon", asi:{}, subrace:null,
    speed:30, size:"Medium",
    darkvision:0, languages:["Common","One other of your choice"],
    traits:[
      { name:"Ability Score Increase", desc:"Increase one ability score by 2, and increase a different one by 1, or increase three different scores by 1." },
      { name:"Hare-Trigger", desc:"You can add your proficiency bonus to your initiative rolls." },
      { name:"Lucky Footwork", desc:"When you fail a Dexterity saving throw, you can use your reaction to roll a d4 and add it to the save, potentially turning a failure into a success. You can use this trait a number of times equal to your proficiency…" },
      { name:"Rabbit Hop", desc:"As a bonus action, you can jump a number of feet equal to five times your proficiency bonus, without provoking opportunity attacks. You can use this trait only if your speed is greater than 0. You can use it a number…" },
      { name:"Perception Proficiency", desc:"You have proficiency in the Perception skill." }
    ] },
  { id:"Astral Elf", asi:{"DEX":2,"INT":1}, subrace:null,
    speed:30, size:"Medium",
    darkvision:60, languages:["Common","Elvish"],
    traits:[
      { name:"Celestial Resistance", desc:"You have resistance to radiant damage." },
      { name:"Starlight Step", desc:"As a bonus action, you can magically teleport up to 30 feet to an unoccupied space you can see. You can use this trait a number of times equal to your proficiency bonus, and you regain all expended uses when you finish…" },
      { name:"Astral Fire", desc:"You know the light cantrip. Starting at 3rd level, you can cast the faerie fire spell with this trait. Starting at 5th level, you can also cast the daylight spell. Intelligence is your spellcasting ability for these…" },
      { name:"Fey Ancestry", desc:"You have advantage on saving throws against being charmed, and magic can't put you to sleep." },
      { name:"Trance", desc:"You don't need to sleep, and magic can't put you to sleep. You can finish a long rest in 4 hours if you spend those hours in a trancelike meditation, during which you remain conscious." }
    ] },
  { id:"Autognome", asi:{"CON":2,"DEX":1}, subrace:null,
    speed:30, size:"Small",
    darkvision:0, languages:["Common","Gnomish"],
    traits:[
      { name:"Built for Purpose", desc:"You were created to perform a specialized function. You gain proficiency in one of the following skill sets: arcana and investigation, athletics and survival, or perception and stealth." },
      { name:"Armored Casing", desc:"You are encased in a metal shell. While you aren't wearing armor, your base Armor Class is 13 + your Dexterity modifier. You can use a shield and still gain this benefit." },
      { name:"Cure Mechanism", desc:"The mending cantrip can be cast on you to restore hit points. When mending is cast on you in this way, you regain a number of hit points equal to 2d6 + your proficiency bonus." },
      { name:"Mechanical Nature", desc:"You are a construct. You are immune to disease and the poisoned condition. You are also immune to poison damage. You don't need to eat, drink, or breathe." },
      { name:"Sentry's Rest", desc:"When you take a long rest, you must spend at least six hours in an inactive, motionless state, rather than sleeping. In this state, you appear inert, but it doesn't render you unconscious, and you can see and hear as…" }
    ] },
  { id:"Giff", asi:{"STR":2,"CON":1}, subrace:null,
    speed:30, size:"Medium",
    darkvision:0, languages:["Common"],
    traits:[
      { name:"Astral Spark", desc:"Your connection to the Astral Plane gives you the ability to deal radiant damage with your unarmed strikes. When you hit with an unarmed strike, you can deal radiant damage instead of bludgeoning damage, and you can…" },
      { name:"Firearms Mastery", desc:"You have a special affinity for firearms. You are proficient with all firearms. If you have a firearm, you can reload it as a bonus action instead of an action. When you score a critical hit with a firearm, you can…" },
      { name:"Hippo Build", desc:"You count as one size larger when determining your carrying capacity and the weight you can push, drag, or lift. You have advantage on Strength checks made to push or pull objects." },
      { name:"Headfirst Charge", desc:"If you move at least 20 feet in a straight line toward a creature and then hit it with a melee weapon attack on the same turn, the target takes an extra 1d6 bludgeoning damage. If the target is a creature, it must…" }
    ] },
  { id:"Hadozee", asi:{"DEX":2,"WIS":1}, subrace:null,
    speed:30, size:"Medium",
    darkvision:0, languages:["Common"],
    traits:[
      { name:"Dexterous Feet", desc:"You can use your feet as effectively as your hands. You can use your feet to manipulate objects, and you can use them to cast spells with somatic components if your hands are full." },
      { name:"Glide", desc:"You have a patagium — a membrane of skin between your limbs — that allows you to glide. When you fall at least 10 feet above the ground, you can use your reaction to spread your arms and legs to glide horizontally a…" },
      { name:"Hadozee Resilience", desc:"The magic of the Feywild has given you a measure of resilience. When you take damage, you can use your reaction to roll a d6. Add your proficiency bonus to the number rolled, and reduce the damage you take by that…" }
    ] },
  { id:"Plasmoid", asi:{"CON":2,"DEX":1}, subrace:null,
    speed:30, size:"Medium",
    darkvision:0, languages:["Common","One other language of your choice"],
    traits:[
      { name:"Amorphous", desc:"You can squeeze through a space as narrow as 1 inch wide, provided you are wearing and carrying nothing. You have advantage on ability checks you make to initiate or escape a grapple." },
      { name:"Darkvision", desc:"You can see in dim light within 60 feet as if it were bright light and in darkness as if it were dim light. You discern colors in that darkness only as shades of gray." },
      { name:"Hold Breath", desc:"You can hold your breath for 1 hour." },
      { name:"Natural Resilience", desc:"You have resistance to acid and poison damage, and you have advantage on saving throws against being poisoned." },
      { name:"Shape Self", desc:"As a bonus action, you can reshape your body to give yourself a head, one or two arms, one or two legs, or some other form. You can use this trait to appear as a member of another humanoid race, though you are still…" }
    ] },
  { id:"Thri-kreen", asi:{"DEX":2,"WIS":1}, subrace:null,
    speed:30, size:"Medium",
    darkvision:60, languages:["Common","Thri-kreen"],
    traits:[
      { name:"Chameleon Carapace", desc:"While you aren't wearing armor, your carapace gives you a base AC of 13 + your Dexterity modifier. As an action, you can change the color of your carapace to match the color and texture of your surroundings, giving you…" },
      { name:"Darkvision", desc:"You can see in dim light within 60 feet as if it were bright light and in darkness as if it were dim light. You discern colors in that darkness only as shades of gray." },
      { name:"Secondary Arms", desc:"You have two slightly smaller arms below your primary pair of arms. The secondary arms can manipulate objects, open doors, and wield light weapons. They can't wield shields or weapons with the two-handed property." },
      { name:"Sleepless", desc:"You do not require sleep and can remain conscious during a long rest. You still need to refrain from strenuous activity to gain the benefit of a long rest." },
      { name:"Thri-kreen Telepathy", desc:"Without the aid of magic, you can't use telepathy to communicate with a creature unless the creature also has telepathy. You can communicate telepathically with any creature within 120 feet that also has telepathy." }
    ] },
];

const CLASS_DATA: RawClass[] = [
  { id:"Barbarian", hitDie:12, primary:["Strength"],
    saves:["STR","CON"],
    armor:["Light armor","Medium armor","Shields"],
    weapons:["Simple weapons","Martial weapons"],
    tools:[],
    skills:{"count":2,"from":["Animal Handling","Athletics","Intimidation","Nature","Perception","Survival"]},
    features:[
      { name:"Rage", desc:"Bonus action: enter rage for 1 minute. Advantage on STR checks and saves; +2 melee weapon damage (+3 at 9th, +4 at 16th); resistance to bludgeoning, piercing, and slashing damage. Cannot cast or concentrate on spells…" },
      { name:"Unarmored Defense", desc:"AC = 10 + DEX modifier + CON modifier while not wearing armor." }
    ],
    spellAbility:null,
    spellNote:null,
    equipment:["Greataxe or any martial melee weapon","Two handaxes or any simple weapon","Explorer's pack","Four javelins"] },
  { id:"Fighter", hitDie:10, primary:["Strength","Dexterity"],
    saves:["STR","CON"],
    armor:["All armor","Shields"],
    weapons:["Simple weapons","Martial weapons"],
    tools:[],
    skills:{"count":2,"from":["Acrobatics","Animal Handling","Athletics","History","Insight","Intimidation","Perception","Survival"]},
    features:[
      { name:"Fighting Style", desc:"Choose one: Archery (+2 ranged attack), Defense (+1 AC while wearing armor), Dueling (+2 damage with one-handed weapon in one hand, no other weapon), Great Weapon Fighting (reroll 1s and 2s on damage with two-handed or…" },
      { name:"Second Wind", desc:"Bonus action: regain 1d10 + fighter level HP. Once per short rest." }
    ],
    spellAbility:null,
    spellNote:null,
    equipment:["Chain mail or leather armor and longbow with 20 arrows","Martial weapon and shield or two martial weapons","Light crossbow with 20 bolts or two handaxes","Dungeoneer's pack or explorer's pack"] },
  { id:"Monk", hitDie:8, primary:["Dexterity","Wisdom"],
    saves:["STR","DEX"],
    armor:[],
    weapons:["Simple weapons","Shortswords"],
    tools:["One artisan's tool or one musical instrument"],
    skills:{"count":2,"from":["Acrobatics","Athletics","History","Insight","Religion","Stealth"]},
    features:[
      { name:"Unarmored Defense", desc:"AC = 10 + DEX modifier + WIS modifier while not wearing armor or using a shield." },
      { name:"Martial Arts", desc:"While unarmed or using monk weapons (shortswords, simple melee weapons without two-handed/heavy), use DEX instead of STR for attacks, roll a martial arts die (1d4 at 1st, 1d6 at 5th, 1d8 at 11th, 1d10 at 17th) for…" }
    ],
    spellAbility:null,
    spellNote:null,
    equipment:["Shortsword or any simple weapon","Dungeoneer's pack or explorer's pack","10 darts"] },
  { id:"Paladin", hitDie:10, primary:["Strength","Charisma"],
    saves:["WIS","CHA"],
    armor:["All armor","Shields"],
    weapons:["Simple weapons","Martial weapons"],
    tools:[],
    skills:{"count":2,"from":["Athletics","Insight","Intimidation","Medicine","Persuasion","Religion"]},
    features:[
      { name:"Divine Sense", desc:"Action: detect celestials, fiends, and undead within 60 ft. Also detect consecrated/desecrated places/objects. Uses equal to 1 + CHA modifier per long rest." },
      { name:"Lay on Hands", desc:"Pool of HP equal to 5 × paladin level. Touch a creature as an action to restore HP from the pool. Alternatively, expend 5 HP to cure one disease or neutralize one poison." }
    ],
    spellAbility:"Charisma",
    spellNote:"Spellcasting begins at 2nd level. Focus: holy symbol.",
    equipment:["Martial weapon and shield or two martial weapons","Five javelins or any simple melee weapon","Priest's pack or explorer's pack","Chain mail and a holy symbol"] },
  { id:"Ranger", hitDie:10, primary:["Dexterity","Wisdom"],
    saves:["STR","DEX"],
    armor:["Light armor","Medium armor","Shields"],
    weapons:["Simple weapons","Martial weapons"],
    tools:[],
    skills:{"count":3,"from":["Animal Handling","Athletics","Insight","Investigation","Nature","Perception","Stealth","Survival"]},
    features:[
      { name:"Favored Enemy", desc:"Choose a type of favored enemy: aberrations, beasts, celestials, constructs, dragons, elementals, fey, fiends, giants, monstrosities, oozes, plants, or undead. Gain advantage on Survival checks to track them and…" },
      { name:"Natural Explorer", desc:"Choose a favored terrain: arctic, coast, desert, forest, grassland, mountain, swamp, or Underdark. While traveling there for 1 hour+: difficult terrain doesn't slow group, can't become lost, remain alert while…" }
    ],
    spellAbility:"Wisdom",
    spellNote:"Spellcasting begins at 2nd level. Focus: druidic focus.",
    equipment:["Scale mail or leather armor","Two shortswords or two simple melee weapons","Dungeoneer's pack or explorer's pack","Longbow with quiver of 20 arrows"] },
  { id:"Rogue", hitDie:8, primary:["Dexterity"],
    saves:["DEX","INT"],
    armor:["Light armor"],
    weapons:["Simple weapons","Hand crossbows","Longswords","Rapiers","Shortswords"],
    tools:["Thieves' tools"],
    skills:{"count":4,"from":["Acrobatics","Athletics","Deception","Insight","Intimidation","Investigation","Perception","Performance","Persuasion","Sleight of Hand","Stealth"]},
    features:[
      { name:"Sneak Attack", desc:"Once per turn, deal extra damage when you hit with a finesse or ranged weapon and have advantage, or another enemy of the target is within 5 ft. Extra damage: 1d6 at 1st, 2d6 at 3rd, 3d6 at 5th, 4d6 at 7th, 5d6 at 9th…" },
      { name:"Thieves' Cant", desc:"Secret mix of dialect, jargon, and code allowing you to hide messages in conversation. Only creatures that know Thieves' Cant understand it. Also includes secret signs and symbols." }
    ],
    spellAbility:null,
    spellNote:null,
    equipment:["Rapier or shortsword","Shortbow with quiver of 20 arrows or shortsword","Burglar's pack, dungeoneer's pack, or explorer's pack","Leather armor, two daggers, and thieves' tools"] },
  { id:"Bard", hitDie:8, primary:["Charisma"],
    saves:["DEX","CHA"],
    armor:["Light armor"],
    weapons:["Simple weapons","Hand crossbows","Longswords","Rapiers","Shortswords"],
    tools:["Three musical instruments of your choice"],
    skills:{"count":3,"from":["Acrobatics","Animal Handling","Arcana","Athletics","Deception","History","Insight","Intimidation","Investigation","Medicine","Nature","Perception","Performance","Persuasion","Religion","Sleight of Hand","Stealth","Survival"]},
    features:[
      { name:"Spellcasting", desc:"You know spells from the bard spell list. Charisma is your spellcasting ability. You can use a musical instrument as a spellcasting focus." },
      { name:"Bardic Inspiration", desc:"As a bonus action, give one creature a Bardic Inspiration die (d6). The creature can roll the die and add the number to one ability check, attack roll, or saving throw. Die lasts 10 min or until used. Uses = CHA mod…" }
    ],
    spellAbility:"Charisma",
    spellNote:"Cantrips known: 2. 1st-level slots: 2. Focus: musical instrument.",
    equipment:["(a) Rapier, (b) Longsword, or (c) any simple weapon","(a) Diplomat's Pack or (b) Entertainer's Pack","(a) Lute or (b) any musical instrument","Leather armor and a dagger"] },
  { id:"Cleric", hitDie:8, primary:["Wisdom"],
    saves:["WIS","CHA"],
    armor:["Light armor","Medium armor","Shields"],
    weapons:["Simple weapons"],
    tools:[],
    skills:{"count":2,"from":["History","Insight","Medicine","Persuasion","Religion"]},
    features:[
      { name:"Spellcasting", desc:"You prepare cleric spells from the cleric spell list. Wisdom is your spellcasting ability. You can use a holy symbol as a spellcasting focus." },
      { name:"Divine Domain", desc:"Choose a Divine Domain subclass. You gain domain spells and features at 1st, 2nd, 6th, 8th, and 17th levels." }
    ],
    spellAbility:"Wisdom",
    spellNote:"Cantrips known: 3. 1st-level slots: 2. Focus: holy symbol.",
    equipment:["(a) Mace or (b) Warhammer (if proficient)","(a) Scale mail, (b) Leather armor, or (c) Chain mail (if proficient)","(a) Light crossbow and 20 bolts or (b) any simple weapon","(a) Priest's Pack or (b) Explorer's Pack","Shield and holy symbol"] },
  { id:"Druid", hitDie:8, primary:["Wisdom"],
    saves:["INT","WIS"],
    armor:["Light armor","Medium armor","Shields (nonmetal)"],
    weapons:["Clubs","Daggers","Darts","Javelins","Maces","Quarterstaffs","Scimitars","Sickles","Slings","Spears"],
    tools:["Herbalism kit"],
    skills:{"count":2,"from":["Arcana","Animal Handling","Insight","Medicine","Nature","Perception","Religion","Survival"]},
    features:[
      { name:"Spellcasting", desc:"You prepare druid spells from the druid spell list. Wisdom is your spellcasting ability. You can use a druidic focus as a spellcasting focus." },
      { name:"Druidic", desc:"You know Druidic, a secret language. You can speak it and leave hidden messages. Others who know Druidic can spot and read such messages automatically." }
    ],
    spellAbility:"Wisdom",
    spellNote:"Cantrips known: 2. 1st-level slots: 2. Focus: druidic focus.",
    equipment:["(a) Wooden shield or (b) any simple weapon","(a) Scimitar or (b) any simple melee weapon","Leather armor, explorer's pack, and druidic focus"] },
  { id:"Sorcerer", hitDie:6, primary:["Charisma"],
    saves:["CON","CHA"],
    armor:[],
    weapons:["Daggers","Darts","Slings","Quarterstaffs","Light crossbows"],
    tools:[],
    skills:{"count":2,"from":["Arcana","Deception","Insight","Intimidation","Persuasion","Religion"]},
    features:[
      { name:"Spellcasting", desc:"You know spells from the sorcerer spell list. Charisma is your spellcasting ability. You can use an arcane focus as a spellcasting focus." },
      { name:"Sorcerous Origin", desc:"Choose a Sorcerous Origin subclass which grants features at 1st level and again at 6th, 14th, and 18th levels." }
    ],
    spellAbility:"Charisma",
    spellNote:"Cantrips known: 4. 1st-level slots: 2. Focus: arcane focus.",
    equipment:["(a) Light crossbow and 20 bolts or (b) any simple weapon","(a) Component pouch or (b) Arcane focus","(a) Dungeoneer's Pack or (b) Explorer's Pack","Two daggers"] },
  { id:"Warlock", hitDie:8, primary:["Charisma"],
    saves:["WIS","CHA"],
    armor:["Light armor"],
    weapons:["Simple weapons"],
    tools:[],
    skills:{"count":2,"from":["Arcana","Deception","History","Intimidation","Investigation","Nature","Religion"]},
    features:[
      { name:"Spellcasting (Pact Magic)", desc:"You know spells from the warlock spell list. Charisma is your spellcasting ability. You can use an arcane focus as a spellcasting focus. Your pact magic slots recharge on a short rest. You always cast warlock spells at…" },
      { name:"Otherworldly Patron", desc:"Choose an Otherworldly Patron subclass which grants features at 1st level and again at 6th, 10th, and 14th levels." }
    ],
    spellAbility:"Charisma",
    spellNote:"Cantrips known: 2. 1st-level slots: 1. Pact magic slots recharge on a short rest. Focus: arcane focus.",
    equipment:["(a) Light crossbow and 20 bolts or (b) any simple weapon","(a) Component pouch or (b) Arcane focus","(a) Scholar's Pack or (b) Dungeoneer's Pack","Simple weapon, leather armor, two daggers"] },
  { id:"Wizard", hitDie:6, primary:["Intelligence"],
    saves:["INT","WIS"],
    armor:[],
    weapons:["Daggers","Darts","Slings","Quarterstaffs","Light crossbows"],
    tools:[],
    skills:{"count":2,"from":["Arcana","History","Insight","Investigation","Medicine","Religion"]},
    features:[
      { name:"Spellcasting", desc:"You prepare wizard spells from your spellbook. Intelligence is your spellcasting ability. You can use an arcane focus as a spellcasting focus. You start with a spellbook containing six 1st-level wizard spells of your…" },
      { name:"Arcane Recovery", desc:"Once per day during a short rest, recover expended spell slots with a combined level equal to or less than half your wizard level (rounded up). No slot can be 6th level or higher." }
    ],
    spellAbility:"Intelligence",
    spellNote:"Cantrips known: 3. 1st-level slots: 2. Focus: arcane focus.",
    equipment:["(a) Quarterstaff or (b) Dagger","(a) Component pouch or (b) Arcane focus","(a) Scholar's Pack or (b) Explorer's Pack","Spellbook"] },
  { id:"Artificer", hitDie:8, primary:["Intelligence"],
    saves:["CON","INT"],
    armor:["Light armor","Medium armor","Shields"],
    weapons:["Simple weapons"],
    tools:["Thieves' tools","Tinker's tools","One artisan tool of your choice"],
    skills:{"count":3,"from":["Arcana","History","Investigation","Medicine","Nature","Perception","Sleight of Hand"]},
    features:[
      { name:"Spellcasting", desc:"You prepare artificer spells from the artificer spell list. Intelligence is your spellcasting ability. You can use a spellcasting focus (any artisan tool or an infused item) for your spells. You can use any weapon or…" },
      { name:"Magical Tinkering", desc:"As an action, touch a Tiny nonmagical object and impart one property: shed bright light 5 ft (+ dim 5 ft), play a recorded message up to 6 seconds, emit an odor, or create a static visual effect. You can have a number…" }
    ],
    spellAbility:"Intelligence",
    spellNote:"Cantrips known: 2. 1st-level slots: 2. Focus: artisan tool or infused item.",
    equipment:["(a) Studded leather armor or (b) Scale mail","(a) Thieves' tools or (b) Any artisan tool","(a) Light crossbow and 20 bolts or (b) Two handaxes","(a) Dungeoneer's Pack or (b) Explorer's Pack","Two daggers"] },
];

// level-1 subclass choices — keyed by class id; classes missing here pick at level 3
const SUBCLASS_DATA: Record<string, RawSubclass[]> = {
  Cleric: [
    { id:"Knowledge Domain", name:"Knowledge Domain",
      flavor:"Clerics of the Knowledge Domain value learning and understanding above all.",
      feature:{ name:"Blessings of Knowledge", desc:"Gain proficiency in two of: Arcana, History, Nature, Religion. Gain proficiency with two languages. Double proficiency bonus for checks with chosen skills." } },
    { id:"Life Domain", name:"Life Domain",
      flavor:"Clerics of the Life Domain are devoted to preserving life and healing the wounded.",
      feature:{ name:"Disciple of Life", desc:"Whenever you use a spell of 1st level or higher to restore hit points, the creature regains additional HP equal to 2 + the spell's level." } },
    { id:"Light Domain", name:"Light Domain",
      flavor:"Clerics of the Light Domain wield fire, radiance, and the power of dawn.",
      feature:{ name:"Bonus Cantrip", desc:"Learn the light cantrip if you don't already know it. It counts as a cleric cantrip for you." } },
    { id:"Nature Domain", name:"Nature Domain",
      flavor:"Clerics of the Nature Domain protect the wild places and harness natural forces.",
      feature:{ name:"Acolyte of Nature", desc:"Learn one druid cantrip of your choice. Gain proficiency in one of: Animal Handling, Nature, or Survival." } },
    { id:"Tempest Domain", name:"Tempest Domain",
      flavor:"Clerics of the Tempest Domain channel the wrath of storms and the fury of the sea.",
      feature:{ name:"Bonus Proficiencies", desc:"Gain proficiency with martial weapons and heavy armor." } },
    { id:"Trickery Domain", name:"Trickery Domain",
      flavor:"Clerics of the Trickery Domain use deception and illusion to achieve their goals.",
      feature:{ name:"Blessing of the Trickster", desc:"As an action, touch one willing creature. It has advantage on Dexterity (Stealth) checks for 1 hour. Usable once per long rest (or expend a spell slot)." } },
    { id:"War Domain", name:"War Domain",
      flavor:"Clerics of the War Domain are battle-hardened warriors who fight for their deity's cause.",
      feature:{ name:"Bonus Proficiencies", desc:"Gain proficiency with martial weapons and heavy armor." } },
    { id:"Forge Domain", name:"Forge Domain",
      flavor:"Clerics of the Forge Domain master the art of creation and imbuing metal with divine power.",
      feature:{ name:"Bonus Proficiencies", desc:"Gain proficiency with heavy armor and smith's tools." } },
    { id:"Grave Domain", name:"Grave Domain",
      flavor:"Clerics of the Grave Domain guard the boundary between life and death, opposing undeath.",
      feature:{ name:"Circle of Mortality", desc:"You learn the spare the dying cantrip with a range of 30 ft. When you cast a spell to heal a creature at 0 HP, treat any die rolled as its maximum. You have advantage on saves against diseases and being poisoned." } },
    { id:"Order Domain", name:"Order Domain",
      flavor:"Clerics of the Order Domain uphold law, discipline, and societal structure.",
      feature:{ name:"Bonus Proficiency", desc:"Gain proficiency with heavy armor." } },
    { id:"Peace Domain", name:"Peace Domain",
      flavor:"Clerics of the Peace Domain foster harmony and unity among allies.",
      feature:{ name:"Implement of Peace", desc:"Gain proficiency in Insight, Performance, or Persuasion. When you cast a spell that restores HP, the target also gains temporary HP equal to your proficiency bonus." } },
    { id:"Twilight Domain", name:"Twilight Domain",
      flavor:"Clerics of the Twilight Domain operate in the boundary between light and darkness.",
      feature:{ name:"Bonus Proficiencies", desc:"Gain proficiency with martial weapons and heavy armor." } },
    { id:"Death Domain", name:"Death Domain",
      flavor:"Clerics of the Death Domain harness necromantic power and wield the energy of death.",
      feature:{ name:"Bonus Proficiency", desc:"Gain proficiency with martial weapons." } },
  ],
  Sorcerer: [
    { id:"Draconic Bloodline", name:"Draconic Bloodline",
      flavor:"Sorcerers with draconic bloodline ancestry gain the power and resilience of dragons.",
      feature:{ name:"Dragon Ancestor", desc:"Choose one dragon type (Black/Copper: Acid, Blue/Bronze: Lightning, Brass/Gold/Red: Fire, Green: Poison, Silver/White: Cold). You gain a +1 bonus on CHA checks with dragons of that type, and speak Draconic." } },
    { id:"Wild Magic", name:"Wild Magic",
      flavor:"Sorcerers with wild magic have unpredictable, chaotic power that surges unpredictably.",
      feature:{ name:"Wild Magic Surge", desc:"Immediately after you cast a sorcerer spell of 1st level or higher, the DM can have you roll a d20. On a 1, roll on the Wild Magic Surge table to create a random effect." } },
    { id:"Divine Soul", name:"Divine Soul",
      flavor:"Sorcerers with a divine soul draw power from celestial or divine sources.",
      feature:{ name:"Divine Magic", desc:"Learn the thaumaturgy cantrip. When you select a spell during a level-up, you can choose from the cleric spell list in addition to the sorcerer spell list. It counts as a sorcerer spell for you." } },
    { id:"Shadow Magic", name:"Shadow Magic",
      flavor:"Sorcerers with shadow magic draw power from the Shadowfell and darkness itself.",
      feature:{ name:"Eyes of the Dark", desc:"You have 120 ft darkvision. When you reach 3rd level, you can cast darkness once per long rest by spending 2 sorcery points. CHA is your spellcasting ability." } },
    { id:"Storm Sorcery", name:"Storm Sorcery",
      flavor:"Sorcerers with storm sorcery command the power of wind, thunder, and lightning.",
      feature:{ name:"Wind Speaker", desc:"You know the Primordial language." } },
    { id:"Aberrant Mind", name:"Aberrant Mind",
      flavor:"Sorcerers with aberrant mind powers are touched by alien entities from the Far Realm.",
      feature:{ name:"Psionic Spells", desc:"Learn additional spells at levels 1, 3, 5, 7, and 9 that don't count against your spells known. You can cast these without verbal components by spending sorcery points equal to the spell's level." } },
    { id:"Clockwork Soul", name:"Clockwork Soul",
      flavor:"Sorcerers with clockwork soul powers are connected to the plane of Mechanus and cosmic order.",
      feature:{ name:"Clockwork Magic", desc:"Learn additional spells at levels 1, 3, 5, 7, and 9 that don't count against your spells known. These are always prepared and can be replaced with other abjuration or transmutation spells." } },
  ],
  Warlock: [
    { id:"The Archfey", name:"The Archfey",
      flavor:"Warlocks who serve the capricious and powerful lords of the Feywild.",
      feature:{ name:"Fey Presence", desc:"As an action, each creature in a 10 ft cube originating from you makes a WIS save or is charmed or frightened (your choice) by you until end of your next turn. Usable once per short or long rest." } },
    { id:"The Fiend", name:"The Fiend",
      flavor:"Warlocks who serve the dark powers of the Lower Planes.",
      feature:{ name:"Dark One's Blessing", desc:"When you reduce a hostile creature to 0 HP, you gain temporary HP equal to your CHA mod + warlock level." } },
    { id:"The Great Old One", name:"The Great Old One",
      flavor:"Warlocks who serve unfathomable entities from the Far Realm.",
      feature:{ name:"Awakened Mind", desc:"You can telepathically speak to any creature within 30 ft that you can see. The creature doesn't need to share a language, but must be able to understand at least one." } },
    { id:"The Celestial", name:"The Celestial",
      flavor:"Warlocks who serve the forces of the Upper Planes and radiant power.",
      feature:{ name:"Bonus Cantrips", desc:"Learn light and sacred flame. They count as warlock cantrips for you." } },
    { id:"The Hexblade", name:"The Hexblade",
      flavor:"Warlocks who serve mysterious entities from the Shadowfell that forge weapons.",
      feature:{ name:"Hexblade's Curse", desc:"As a bonus action, choose one creature you can see within 30 ft. You gain: bonus damage equal to proficiency bonus on damage rolls against it; attacks crit on 19-20; if it dies, regain HP equal to warlock level + CHA mod. Usable once per short or long rest. Lasts until target dies or you use it…" } },
    { id:"The Fathomless", name:"The Fathomless",
      flavor:"Warlocks who serve the deep and alien powers of the ocean depths.",
      feature:{ name:"Tentacle of the Deeps", desc:"As a bonus action, create a 10 ft spectral tentacle within 60 ft that lasts for 1 minute. When you cast a spell on your turn, you can direct the tentacle to make a melee spell attack against one creature within 10 ft of it (1d8 cold damage, CHA mod times per long rest). At 10th level, damage…" } },
    { id:"The Genie", name:"The Genie",
      flavor:"Warlocks who serve the noble genies of the Elemental Planes.",
      feature:{ name:"Genie's Vessel", desc:"Choose a genie type (Dao: bludgeoning/earth, Djinni: thunder/wind, Efreeti: fire, Marid: cold/water). Gain a vessel (Tiny object). While inside, you're safe from harm and can rest. When you cast a spell through the vessel, add proficiency bonus to one damage roll of that spell of the chosen type." } },
    { id:"The Undying", name:"The Undying",
      flavor:"Warlocks who serve undying beings that have conquered death itself.",
      feature:{ name:"Among the Dead", desc:"Learn the spare the dying cantrip. You have advantage on saves against diseases and being poisoned. Undead have disadvantage on attacks against you for their first attack each combat." } },
  ],
};

const BG_DATA: RawBg[] = [
  { id:"Acolyte", skills:["Insight","Religion"],
    tools:[], languages:2,
    equipment:["A prayer book","5 sticks of incense","vestments","common clothes","pouch with 15 gp"],
    feature:{ name:"Shelter of the Faithful", desc:"As an acolyte, you command the respect of those who share your faith, and you can perform the religious ceremonies of your deity. You and your adventuring companions can expect to receive free healing, care, and food at a temple, shrine, or other established…" } },
  { id:"Charlatan", skills:["Deception","Sleight of Hand"],
    tools:["Disguise kit","Forgery kit"], languages:0,
    equipment:["A set of fine clothes","a disguise kit","tools of the con","pouch with 15 gp"],
    feature:{ name:"False Identity", desc:"You have created a second identity that includes documentation, established acquaintances, and disguises allowing you to assume that persona. You can forge documents including official papers and personal letters, as long as you have seen an example of the…" } },
  { id:"Criminal", skills:["Deception","Stealth"],
    tools:["Thieves' tools","one type of gaming set"], languages:0,
    equipment:["A crowbar","a set of dark common clothes including a hood","pouch with 15 gp"],
    feature:{ name:"Criminal Contact", desc:"You have a reliable and trustworthy contact who acts as your liaison to a network of other criminals. You know how to get messages to and from your contact, even over great distances; specifically, you know the local messengers, corrupt caravan masters, and…" } },
  { id:"Entertainer", skills:["Acrobatics","Performance"],
    tools:["Disguise kit","one type of musical instrument"], languages:0,
    equipment:["A musical instrument (one of your choice)","the favor of an admirer","a costume","pouch with 15 gp"],
    feature:{ name:"By Popular Demand", desc:"You can always find a place to perform, usually in an inn or tavern but possibly with a circus, at a theater, or even in a noble's court. At such a place, you receive free lodging and food of a modest or comfortable standard, as long as you perform each…" } },
  { id:"Folk Hero", skills:["Animal Handling","Survival"],
    tools:["One type of artisan's tools","land vehicles"], languages:0,
    equipment:["A set of artisan's tools (one of your choice)","a shovel","an iron pot","a set of common clothes","pouch with 10 gp"],
    feature:{ name:"Rustic Hospitality", desc:"Since you come from the ranks of the common folk, you fit in among them with ease. You can find a place to hide, rest, or recuperate among commoners, unless you have shown yourself to be a danger to them. They will shield you from the law or anyone…" } },
  { id:"Guild Artisan", skills:["Insight","Persuasion"],
    tools:["One type of artisan's tools"], languages:1,
    equipment:["A set of artisan's tools (one of your choice)","a letter of introduction","a set of traveler's clothes","pouch with 15 gp"],
    feature:{ name:"Guild Membership", desc:"As an established and respected member of a guild, you can rely on certain benefits that membership provides. Your fellow guild members will provide you with lodging and food if necessary, and pay for your funeral if needed. In some cities and towns, a…" } },
  { id:"Hermit", skills:["Medicine","Religion"],
    tools:["Herbalism kit"], languages:1,
    equipment:["A scroll case stuffed full of notes from your studies","a blanket","a set of common clothes","an herbalism kit","pouch with 5 gp"],
    feature:{ name:"Discovery", desc:"The quiet seclusion of your extended hermitage gave you access to a unique and powerful discovery. The exact nature of this revelation depends on the nature of your seclusion. Work with your DM to determine the details of your discovery and its impact on the…" } },
  { id:"Noble", skills:["History","Persuasion"],
    tools:["One type of gaming set"], languages:1,
    equipment:["A set of fine clothes","a signet ring","a scroll of pedigree","pouch with 25 gp"],
    feature:{ name:"Position of Privilege", desc:"Thanks to your noble birth, people are inclined to think the best of you. You are welcome in high society, and people assume you have the right to be wherever you are. You can secure an audience with a local noble if you need to." } },
  { id:"Outlander", skills:["Athletics","Survival"],
    tools:["One type of musical instrument"], languages:1,
    equipment:["A staff","a hunting trap","a trophy from an animal you killed","a set of traveler's clothes","pouch with 10 gp"],
    feature:{ name:"Wanderer", desc:"You have an excellent memory for maps and geography, and you can always recall the general layout of terrain, settlements, and other features around you. In addition, you can find food and fresh water for yourself and up to five other people each day,…" } },
  { id:"Sage", skills:["Arcana","History"],
    tools:[], languages:2,
    equipment:["A bottle of black ink","a quill","a small knife","a letter from a dead colleague posing a question you have not yet been able to answer","a set of common clothes","pouch with 10 gp"],
    feature:{ name:"Researcher", desc:"When you attempt to learn or recall a piece of lore, if you do not have that information in your records, you often know where and from whom you can obtain it. Usually, this information comes from a library, scriptorium, university, or a sage or other…" } },
  { id:"Sailor", skills:["Athletics","Perception"],
    tools:["Navigator's tools","water vehicles"], languages:0,
    equipment:["A bilge hook","50 feet of silk rope","a lucky charm","a set of common clothes","pouch with 10 gp"],
    feature:{ name:"Ship's Passage", desc:"When you need to, you can secure free passage on a sailing ship for yourself and your adventuring companions. You might sail on the ship you served on, or another ship you have good relations with. Because you're calling in a favor, you can't be certain of…" } },
  { id:"Soldier", skills:["Athletics","Intimidation"],
    tools:["Land vehicles","one type of gaming set"], languages:0,
    equipment:["An insignia of rank","a trophy taken from a fallen enemy","a dagger","a set of common clothes","pouch with 10 gp"],
    feature:{ name:"Military Rank", desc:"You have a military rank from your career as a soldier. Soldiers loyal to your former military organization still recognize your authority and influence, and they defer to you if they are of a lower rank. You can invoke your rank to exert influence over…" } },
  { id:"Urchin", skills:["Sleight of Hand","Stealth"],
    tools:["Disguise kit","thieves' tools"], languages:0,
    equipment:["A small knife","a map of the city you grew up in","a pet mouse","a token to remember your parents by","a set of common clothes","pouch with 10 gp"],
    feature:{ name:"City Secrets", desc:"You know the secret patterns and flow to cities and can find passages through the urban sprawl that others would miss. When you are not in combat, you (and companions you lead) can travel between any two locations in the city twice as fast as your speed…" } }
];

const ABILITY_DATA = {
  str: { name:"Strength", abbr:"STR", affects:["Melee weapon attacks","Athletics checks","Carrying capacity","Grapple/shove attempts"] },
  dex: { name:"Dexterity", abbr:"DEX", affects:["Ranged weapon attacks","Finesse weapon attacks","AC (with light/medium armor)","Dexterity saves","Initiative","Acrobatics/Sleight of Hand/Stealth checks"] },
  con: { name:"Constitution", abbr:"CON", affects:["Hit points per level","Constitution saves","Endurance checks"] },
  int: { name:"Intelligence", abbr:"INT", affects:["Wizard/Artificer spellcasting","Arcana/History/Investigation/Nature/Religion checks","Number of languages known"] },
  wis: { name:"Wisdom", abbr:"WIS", affects:["Cleric/Druid/Ranger spellcasting","Animal Handling/Insight/Medicine/Perception/Survival checks","Wisdom saves against charm/fear"] },
  cha: { name:"Charisma", abbr:"CHA", affects:["Bard/Sorcerer/Paladin/Warlock spellcasting","Deception/Intimidation/Performance/Persuasion checks","Charisma saves against possession/domination"] }
};

const PACK_DATA: Record<string, string[]> = {
  "Burglar's Pack": ["Backpack","1,000 ball bearings","10 feet of string","Bell","5 candles","Crowbar","Hammer","10 pitons","Quiver with 20 arrows","Roll of parchment","Soap","Waterskin","Rations (5 days)"],
  "Diplomat's Pack": ["Chest","2 cases for maps and scrolls","5 candles","5 sticks of incense","Vestments","2 yards of cloth (fine)","Roll of parchment","Ink and ink pen","Lamp","2 flasks of oil","5 sheets of paper","Vial of perfume","Sealing wax","Soap"],
  "Dungeoneer's Pack": ["Backpack","Crowbar","Hammer","10 pitons","10 torches","Tinderbox","10 days of rations","Waterskin","50 feet of hempen rope"],
  "Entertainer's Pack": ["Backpack","Bedroll","2 costumes","5 candles","5 days of rations","Waterskin","Disguise kit"],
  "Explorer's Pack": ["Backpack","Bedroll","Mess kit","Tinderbox","10 torches","10 days of rations","Waterskin","50 feet of hempen rope"],
  "Priest's Pack": ["Backpack","Blanket","10 candles","Vestments","2 blocks of incense","Censer","Vestments","2 days of rations","Waterskin"],
  "Scholar's Pack": ["Backpack","Book of lore","Bottle of ink","Ink pen","10 sheets of parchment","Little bag of sand","Small knife"]
};

// ── hand-written dark-fantasy flavor (art direction: grim, low-saturation) ──
// (lives in scripts/gen_gamedata.mjs — regenerate to change)
const RACE_FLAVOR: Record<string, string> = {
  Human: "Short-lived and stubborn, humans burn bright against the long dark. Ambition is their inheritance.",
  Elf: "The ash-years thinned the elven lines. What remains remembers everything, and forgives nothing.",
  Dwarf: "Stone remembers, and so do dwarves. They hold grudges the way mountains hold ore.",
  Halfling: "The small folk outlive empires. Luck, they say, is just another kind of armor.",
  "Half-Orc": "Born of rage and ruin, half-orcs carve their worth into the world with iron patience.",
  Tiefling: "An infernal debt, written in blood and horn. Every tiefling pays — or makes the world pay.",
  Dragonborn: "The blood of dead dragons thins with every generation. Yours still remembers fire.",
  Gnome: "Curiosity is a slow poison. Gnomes drink it daily and call it living.",
  "Half-Elf": "Two worlds, no home. Half-elves inherit every war and none of the spoils.",
  Aarakocra: "Sky-born, storm-marked. The ground feels like a cage with no bars.",
  Genasi: "An elemental debt collects interest in your veins — earth, flame, wave, or wind.",
  Goliath: "The mountains ate your ancestors. You intend to return the favor.",
  "Deep Gnome": "You were born where the light is not. Your eyes settled the argument.",
  Aasimar: "A celestial ember burns behind your ribs. It keeps score.",
  Bugbear: "Long arms, longer grudges. The dark taught you to strike first.",
  Firbolg: "The forests fell, and you fell with them. What grew back answers to you.",
  Goblin: "Small, sharp, and numbered. You outlived your whole warband — ask why.",
  Hobgoblin: "Discipline is the only god that never died. You march for it still.",
  Kenku: "Your voice was the price. Now you speak in stolen echoes.",
  Kobold: "Weak alone, lethal in packs. You are the pack now.",
  Lizardfolk: "The swamp remembers the empire that burned. So do you, coldly.",
  Orc: "Rage is an heirloom. You carry it like a blade you are learning to sheathe.",
  Tabaxi: "Curiosity killed the cat — several times. You have answers left.",
  Triton: "The drowned courts sent you ashore as a warning. Nobody listened.",
  "Yuan-ti Pureblood": "Serpent blood, patient venom. You smile like something with all the time in the world.",
  "Custom Lineage": "Whatever you were, the Ash took it. What survived is yours to name.",
  "Gem Dragonborn": "A psionic choir hums in your skull. Sometimes it sings back.",
  Dhampir: "The grave wanted you and settled for half. Thirst is a quiet roommate.",
  Hexblood: "A witch's bargain runs in your blood — a debt written in crow-feathers and thread.",
  Reborn: "You died. It did not take. The gap where life used to be itches.",
  Owlin: "Silent wings, sleepless eyes. You collect secrets nobody knows they dropped.",
  Verdan: "Your people are new, small, and running. You ran toward the fire instead.",
  Leonin: "Pride ate the prides. You carry the last roar in your chest.",
  Satyr: "The revel ended centuries ago. You still hear the music, faintly, behind the ash.",
  Fairy: "Small and spectral, born of fading borders. Doors open for you that should not.",
  Harengon: "Luck rabbits through your blood. You were born mid-leap and never landed.",
  "Astral Elf": "You walked the silver void and came back — older, quieter, lit from within.",
  Autognome: "Clockwork heart, gnomish hands. You wind yourself each morning and pretend not to.",
  Giff: "Hippo-built, cannon-raised. You are what survived the shipwreck.",
  Hadozee: "The rigging raised you. You glide on grief and salt.",
  Plasmoid: "You have no bones and fewer obligations. Your shape is a negotiation.",
  "Thri-kreen": "Four arms, no sleep, a taste for the unspoiled. The clutch speaks in clicks.",
};
const CLASS_FLAVOR: Record<string, { flavor: string; sigil: ClassSigil }> = {
  Fighter: { flavor: "Steel discipline. You are the wall the dark breaks against.", sigil: 'sword' },
  Wizard: { flavor: "You read the letters the world was written in — and rewrite them.", sigil: 'eye' },
  Rogue: { flavor: "The quiet knife, the picked lock, the vanishing act. You are the unfair fight.", sigil: 'dagger' },
  Cleric: { flavor: "A lantern against the long night. Your god speaks; the dead listen.", sigil: 'flame' },
  Sorcerer: { flavor: "Magic does not obey you. It sleeps in your blood — and sometimes wakes hungry.", sigil: 'spark' },
  Warlock: { flavor: "You signed. Now something old and patient owns a piece of your shadow.", sigil: 'pact' },
  Barbarian: { flavor: "Grief with a weapon. Your rage is an old and reliable god.", sigil: 'axe' },
  Bard: { flavor: "You sing the embers back to life. Every song is a small resurrection.", sigil: 'song' },
  Druid: { flavor: "The wild is not gentle, and neither are you. Ash feeds new green.", sigil: 'leaf' },
  Monk: { flavor: "Your body is the last intact temple. You keep it — and its silence — whole.", sigil: 'fist' },
  Paladin: { flavor: "The oath outlived the church that wrote it. You are its last signature.", sigil: 'sun' },
  Ranger: { flavor: "You hunt what hunts the refugees. The Ashenreach is your trapline.", sigil: 'arrow' },
  Artificer: { flavor: "Where the world broke, you rivet. Your devices are small stubborn prayers.", sigil: 'gear' },
};
const BG_FLAVOR: Record<string, string> = {
  Acolyte: 'Raised in candlelight and incense, sworn to a faith that outlasted its temples.',
  Charlatan: 'You sold salvation, relics and second chances. The marks still believe.',
  Criminal: 'You know the city\'s back doors, and the names that open them.',
  Entertainer: 'You fed on applause until the crowds stopped coming. The show is not over.',
  'Folk Hero': 'You stood up when no one else would. The village still sings of it.',
  'Guild Artisan': 'Trade is a kind of prayer. Your seal still carries weight.',
  Hermit: 'You went into the wild to be alone with something that finally answered.',
  Noble: 'Gilded name, buried fortune, enemies with long memories.',
  Outlander: 'The wilds raised you. Soft walls make you itch.',
  Sage: 'You have read every forbidden book you could steal. One of them read you back.',
  Sailor: 'Salt in the lungs and a horizon debt that never clears.',
  Soldier: 'You held the line. The line held. Not everyone was so lucky.',
  Urchin: 'You grew up a ghost in your own city — and it taught you all its secrets.',
};

// ── public shapes ──
export const RACES: RaceInfo[] = RACE_DATA.map((r) => ({
  id: r.id, flavor: RACE_FLAVOR[r.id] || '', asi: r.asi, subrace: r.subrace,
  speed: r.speed, size: r.size, darkvision: r.darkvision,
  languages: r.languages, traits: r.traits,
}));
export const RACE_MAP: Record<string, RaceInfo> = Object.fromEntries(RACES.map((r) => [r.id, r]));

export const CLASSES: ClassInfo[] = CLASS_DATA.map((c) => ({
  id: c.id, flavor: (CLASS_FLAVOR[c.id] || { flavor: '' }).flavor,
  sigil: (CLASS_FLAVOR[c.id] || { sigil: 'sword' as ClassSigil }).sigil,
  hitDie: c.hitDie, primary: c.primary, saves: c.saves, armor: c.armor,
  weapons: c.weapons, tools: c.tools, skills: c.skills, features: c.features,
  spellAbility: c.spellAbility, spellNote: c.spellNote, equipment: c.equipment,
}));
export const CLASS_MAP: Record<string, ClassInfo> = Object.fromEntries(CLASSES.map((c) => [c.id, c]));

/** Level-1 subclass choices per class (Cleric / Sorcerer / Warlock). Empty for
 *  classes that choose their path at level 3 — the wizard skips the step. */
export const SUBCLASSES: Record<string, SubclassInfo[]> = Object.fromEntries(
  Object.entries(SUBCLASS_DATA).map(([cid, subs]) => [cid, subs.map((s) => ({
    id: s.id, name: s.name, flavor: s.flavor, feature: s.feature,
  }))]),
);
/** True when the class picks its path at level 1 (the wizard shows the step). */
export function hasLevel1Subclass(classId: string): boolean {
  return !!SUBCLASSES[classId]?.length;
}

export const BACKGROUNDS: BackgroundInfo[] = BG_DATA.map((b) => ({
  id: b.id, flavor: BG_FLAVOR[b.id] || '', skills: b.skills, tools: b.tools,
  languages: b.languages, equipment: b.equipment, feature: b.feature,
}));
export const BG_MAP: Record<string, BackgroundInfo> = Object.fromEntries(BACKGROUNDS.map((b) => [b.id, b]));

export const ABILITY_INFO = ABILITY_DATA as Record<AbilityKey, { name: string; abbr: string; affects: string[] }>;
export const PACKS: Record<string, string[]> = PACK_DATA;

// ── 5E math helpers (client-side preview; the server engine stays authoritative) ──
export function abilityMod(score: number): number { return Math.floor((score - 10) / 2); }
export function modStr(m: number): string { return m >= 0 ? '+' + m : String(m); }

export const POINT_BUY_TOTAL = 27;
const PB_COST: Record<number, number> = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
export function pointBuyCost(score: number): number { return PB_COST[score] ?? 0; }
export function pointBuySpent(base: Record<AbilityKey, number>): number {
  return ABILITY_KEYS.reduce((n, k) => n + pointBuyCost(base[k]), 0);
}

/** 4d6, drop the lowest — returns all four dice plus the kept total. */
export function roll4d6(): { dice: number[]; total: number } {
  const dice = Array.from({ length: 4 }, () => 1 + Math.floor(Math.random() * 6));
  const total = dice.slice().sort((a, b) => b - a).slice(0, 3).reduce((a, b) => a + b, 0);
  return { dice, total };
}

/** Racial ability bonuses for a race id, filled to all six keys (0 where none).
 *  Folds in the auto-picked first subrace (server house rule) so the preview
 *  equals CharacterEngine's sheet — e.g. Dwarf gets CON+2 AND Hill Dwarf WIS+1. */
export function racialAsi(raceId: string): Record<AbilityKey, number> {
  const r = RACE_MAP[raceId];
  const out = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 };
  if (!r) return out;
  for (const src of [r.asi, r.subrace?.asi]) {
    if (!src) continue;
    for (const [k, v] of Object.entries(src)) {
      const key = k.toLowerCase() as AbilityKey;
      if (key in out) out[key] += v;
    }
  }
  return out;
}

/** Apply racial ASI (incl. auto subrace) to base scores → final scores. */
export function finalScores(base: Record<AbilityKey, number>, raceId: string): Record<AbilityKey, number> {
  const asi = racialAsi(raceId);
  const out = { ...base };
  for (const k of ABILITY_KEYS) out[k] = base[k] + asi[k];
  return out;
}

/** Level-1 HP: hit die + CON mod (racial CON included). */
export function previewHP(classId: string, con: number): number {
  const cls = CLASS_MAP[classId];
  if (!cls) return 8;
  return Math.max(1, cls.hitDie + abilityMod(con));
}

/**
 * Armor-based AC preview from the class starting-kit text (heuristic, preview only —
 * the server CharacterEngine computes the real AC). 5E armor math. Unarmored
 * Defense: Barbarian (DEX+CON) and Monk (DEX+WIS) apply while unarmored.
 */
export function previewAC(classId: string, equipTexts: string[], dex: number, con: number, wis = 10): number {
  const dexM = abilityMod(dex), conM = abilityMod(con), wisM = abilityMod(wis);
  const text = equipTexts.join(' | ').toLowerCase();
  const has = (s: string) => text.includes(s);
  const armored = has('mail') || has('scale') || has('leather') || has('armor') || has('breastplate');
  let ac = 10 + dexM;
  if (has('chain mail')) ac = 16;
  else if (has('scale mail')) ac = 14 + Math.min(dexM, 2);
  else if (has('studded leather')) ac = 12 + dexM;
  else if (has('leather armor') || has('leather')) ac = 11 + dexM;
  if (classId === 'Barbarian') ac = Math.max(ac, 10 + dexM + conM); // Unarmored Defense (CON)
  if (classId === 'Monk' && !armored) ac = Math.max(ac, 10 + dexM + wisM); // Unarmored Defense (WIS)
  if (/\bshield/.test(text)) ac += 2;
  return ac;
}
