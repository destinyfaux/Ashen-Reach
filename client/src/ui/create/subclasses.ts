// Extracted SRD subclasses for all 13 classes
import type { Trait } from "./gamedata";

export interface SubclassData {
  id: string;
  name: string;
  flavor: string;
  feature: Trait;
}

export const ALL_SUBCLASSES: Record<string, SubclassData[]> = {
  "Barbarian": [
    {
      "id": "Berserker",
      "name": "Berserker",
      "flavor": "A barbarian driven by fury, trading exhaustion for devastating power.",
      "feature": {
        "name": "Frenzy",
        "desc": "When you rage, you can go berserk: gain one extra melee attack as a bonus action each turn while raging. Suffer one level of exhaustion when rage ends."
      }
    },
    {
      "id": "Totem Warrior",
      "name": "Totem Warrior",
      "flavor": "A barbarian who channels the power of animal spirits.",
      "feature": {
        "name": "Totem Spirit",
        "desc": "Choose a totem animal. Bear: resistance to all damage except psychic while raging. Eagle: creatures have disadvantage on attacks against you from more than 5 ft away while raging; +2 speed while raging. Wolf: allies have advantage on melee "
      }
    },
    {
      "id": "Ancestral Guardian",
      "name": "Ancestral Guardian",
      "flavor": "Spirits of ancestors protect the barbarian and their allies.",
      "feature": {
        "name": "Ancestral Protectors",
        "desc": "When you hit a creature with a melee attack while raging, spectral guardians harass the target. The target has disadvantage on attacks against anyone but you, and allies have resistance to damage from the target's attacks. Lasts until start"
      }
    },
    {
      "id": "Storm Herald",
      "name": "Storm Herald",
      "flavor": "A barbarian wreathed in elemental storm energy.",
      "feature": {
        "name": "Storm Aura",
        "desc": "While raging, a 10-ft aura surrounds you. Desert: each creature of your choice in aura takes 2 fire damage (3 at 5th, 4 at 10th, 5 at 15th, 6 at 20th). Sea: each creature of your choice takes 2 lightning damage (scaling same). Tundra: each "
      }
    },
    {
      "id": "Zealot",
      "name": "Zealot",
      "flavor": "A barbarian fueled by divine fury.",
      "feature": {
        "name": "Divine Fury",
        "desc": "While raging, the first creature you hit on each of your turns with a melee weapon takes extra damage equal to 1d6 + half your barbarian level. Damage type: radiant or necrotic (your choice when you gain this feature)."
      }
    },
    {
      "id": "Beast",
      "name": "Beast",
      "flavor": "A barbarian who transforms with bestial traits.",
      "feature": {
        "name": "Form of the Beast",
        "desc": "When you rage, choose a natural weapon: Bite (melee, 1d8 piercing, gain temp HP equal to CON mod + PROF on hit), Claws (melee, 1d6 slashing, extra attack as bonus action), or Tail (melee, 1d8 piercing, +1d12 to AC against one attack as reac"
      }
    },
    {
      "id": "Wild Magic",
      "name": "Wild Magic",
      "flavor": "A barbarian whose rage unleashes unpredictable magical effects.",
      "feature": {
        "name": "Magic Awareness",
        "desc": "Action: sense the presence of magic within 30 ft. Learn the school of any magic detected."
      }
    }
  ],
  "Fighter": [
    {
      "id": "Champion",
      "name": "Champion",
      "flavor": "A fighter who excels at raw physical prowess and critical strikes.",
      "feature": {
        "name": "Improved Critical",
        "desc": "Your weapon attacks score a critical hit on a roll of 19 or 20."
      }
    },
    {
      "id": "Battle Master",
      "name": "Battle Master",
      "flavor": "A fighter who uses combat maneuvers and tactical superiority.",
      "feature": {
        "name": "Combat Superiority",
        "desc": "Gain 4 d8 superiority dice (5 at 7th, 6 at 10th, 7 at 13th, 8 at 15th, 9 at 18th). Dice become d10 at 10th and d12 at 18th. Learn 3 maneuvers from the Battle Master list."
      }
    },
    {
      "id": "Eldritch Knight",
      "name": "Eldritch Knight",
      "flavor": "A fighter who wields arcane magic alongside martial skill.",
      "feature": {
        "name": "Spellcasting",
        "desc": "Cast wizard spells. See spellcasting block for slots and spells known."
      }
    },
    {
      "id": "Cavalier",
      "name": "Cavalier",
      "flavor": "A fighter who excels at mounted combat and protecting allies.",
      "feature": {
        "name": "Bonus Proficiency",
        "desc": "Gain proficiency in one of: Animal Handling, History, Insight, Performance, or Persuasion. Also gain proficiency with leatherworker's tools."
      }
    },
    {
      "id": "Samurai",
      "name": "Samurai",
      "flavor": "A fighter who channels fierce determination and fighting spirit.",
      "feature": {
        "name": "Fighting Spirit",
        "desc": "Bonus action: gain advantage on all weapon attack rolls until end of current turn, and gain 5 temp HP (10 at 10th, 15 at 15th). Three uses per long rest."
      }
    },
    {
      "id": "Arcane Archer",
      "name": "Arcane Archer",
      "flavor": "A fighter who imbues arrows with magical effects.",
      "feature": {
        "name": "Arcane Arrow",
        "desc": "Once per turn when you fire an arrow from a shortbow or longbow, you can apply an Arcane Shot. You know 2 Arcane Shot options. Arcane Shots deal an extra 2d6 force damage on hit (4d6 at 18th). Use twice per short rest."
      }
    },
    {
      "id": "Psi Warrior",
      "name": "Psi Warrior",
      "flavor": "A fighter who channels psionic energy to enhance combat.",
      "feature": {
        "name": "Psionic Power",
        "desc": "Gain psionic energy dice: 4d8 + INT mod (6d8 at 5th, 8d8 at 11th, 10d8 at 17th). Dice become d10 at 11th and d12 at 17th. As a bonus action, choose: Protective Field (reduce damage to self or ally within 30 ft by 1d8 + INT mod), or Telekine"
      }
    },
    {
      "id": "Rune Knight",
      "name": "Rune Knight",
      "flavor": "A fighter who carves magical runes for giant-like power.",
      "feature": {
        "name": "Rune Carver",
        "desc": "Learn 2 runes from the list (3 at 7th, 4 at 10th, 5 at 15th). Each rune provides a passive benefit and an active invocation (bonus action, PROF/long rest). Runes: Cloud, Fire, Frost, Hill, Stone, Storm, Wind."
      }
    }
  ],
  "Monk": [
    {
      "id": "Open Hand",
      "name": "Open Hand",
      "flavor": "A monk who manipulates ki to control enemies in melee.",
      "feature": {
        "name": "Open Hand Technique",
        "desc": "When you hit with Flurry of Blows, choose one per target: push 15 ft away, knock prone, or target cannot take reactions until end of your next turn. No save for push/prone option on hit."
      }
    },
    {
      "id": "Four Elements",
      "name": "Four Elements",
      "flavor": "A monk who commands the elements through ki.",
      "feature": {
        "name": "Disciple of the Elements",
        "desc": "Learn elemental disciplines that let you spend ki to create elemental effects. Choose 2 disciplines at 3rd (3 at 6th, 4 at 11th, 5 at 17th). Disciplines include: Fangs of the Fire Snake, Fist of Four Thunders, Fist of Unbroken Air, Rush of "
      }
    },
    {
      "id": "Shadow",
      "name": "Shadow",
      "flavor": "A monk who manipulates darkness and shadow.",
      "feature": {
        "name": "Shadow Arts",
        "desc": "Can cast minor illusion (no components, WIS as spellcasting ability). Spend 2 ki to cast darkness, darkvision, pass without trace, or silence."
      }
    },
    {
      "id": "Drunken Master",
      "name": "Drunken Master",
      "flavor": "A monk whose erratic movements confound enemies.",
      "feature": {
        "name": "Drunken Technique",
        "desc": "When you use Flurry of Blows, gain +10 ft speed and you do not provoke opportunity attacks until end of your turn."
      }
    },
    {
      "id": "Kensei",
      "name": "Kensei",
      "flavor": "A monk who masters weapons as extensions of ki.",
      "feature": {
        "name": "Kensei Weapons",
        "desc": "Choose 2 melee and 1 ranged weapon that lack heavy or special properties; these are kensei weapons. Count as monk weapons for you. Can change one weapon choice when you gain a monk level."
      }
    },
    {
      "id": "Sun Soul",
      "name": "Sun Soul",
      "flavor": "A monk who channels radiant energy.",
      "feature": {
        "name": "Radiant Sun Bolt",
        "desc": "Ranged spell attack: 30 ft range, 1d4 radiant damage (1d6 at 11th, 1d8 at 17th). Can be used with Flurry of Blows (replace unarmed strikes with sun bolts). Counts as a monk weapon."
      }
    },
    {
      "id": "Mercy",
      "name": "Mercy",
      "flavor": "A monk who wields ki to heal or harm with a touch.",
      "feature": {
        "name": "Implements of Mercy",
        "desc": "Gain proficiency in Medicine and one of: Insight, Investigation, or Religion. Also gain proficiency with herbalism kit and poisoner's kit."
      }
    },
    {
      "id": "Astral Self",
      "name": "Astral Self",
      "flavor": "A monk who manifests an astral form through ki.",
      "feature": {
        "name": "Arms of the Astral Self",
        "desc": "Bonus action: spend 1 ki to summon spectral arms for 10 minutes. Your unarmed strikes use WIS instead of STR/DEX for attack and damage, and have 10-ft reach. Arms make unarmed strikes as part of your Attack action."
      }
    }
  ],
  "Paladin": [
    {
      "id": "Devotion",
      "name": "Devotion",
      "flavor": "A paladin sworn to the ideals of righteousness and justice.",
      "feature": {
        "name": "Oath Spells",
        "desc": "Oath spells are always prepared and don't count against your prepared spells. 3rd: sanctuary, shield of faith. 5th: lesser restoration, zone of truth. 9th: beacon of hope, dispel magic. 13th: freedom of movement, guardian of faith. 17th: co"
      }
    },
    {
      "id": "Ancients",
      "name": "Ancients",
      "flavor": "A paladin sworn to preserve the light of life and joy.",
      "feature": {
        "name": "Oath Spells",
        "desc": "Oath spells always prepared. 3rd: ensnaring strike, speak with animals. 5th: moonbeam, misty step. 9th: plant growth, protection from energy. 13th: ice storm, stoneskin. 17th: commune with nature, tree stride."
      }
    },
    {
      "id": "Vengeance",
      "name": "Vengeance",
      "flavor": "A paladin sworn to punish those who commit grievous sins.",
      "feature": {
        "name": "Oath Spells",
        "desc": "Oath spells always prepared. 3rd: bane, hunter's mark. 5th: hold person, misty step. 9th: haste, protection from energy. 13th: banishment, dimension door. 17th: hold monster, scrying."
      }
    },
    {
      "id": "Crown",
      "name": "Crown",
      "flavor": "A paladin sworn to uphold law, civilization, and order.",
      "feature": {
        "name": "Oath Spells",
        "desc": "Oath spells always prepared. 3rd: command, compelled duel. 5th: warding bond, zone of truth. 9th: aura of vitality, spirit guardians. 13th: banishment, guardian of faith. 17th: circle of power, geas."
      }
    },
    {
      "id": "Conquest",
      "name": "Conquest",
      "flavor": "A paladin who crushes opposition through fear and domination.",
      "feature": {
        "name": "Oath Spells",
        "desc": "Oath spells always prepared. 3rd: armor of Agathys, command. 5th: hold person, spiritual weapon. 9th: bestow curse, fear. 13th: dominate beast, stoneskin. 17th: cloudkill, dominate person."
      }
    },
    {
      "id": "Redemption",
      "name": "Redemption",
      "flavor": "A paladin who seeks to redeem wrongdoers through compassion.",
      "feature": {
        "name": "Oath Spells",
        "desc": "Oath spells always prepared. 3rd: sanctuary, sleep. 5th: calm emotions, hold person. 9th: counterspell, hypnotic pattern. 13th: Otiluke's resilient sphere, stun. 17th: hold monster, mass cure wounds."
      }
    },
    {
      "id": "Glory",
      "name": "Glory",
      "flavor": "A paladin who strives to achieve immortal glory through deeds.",
      "feature": {
        "name": "Oath Spells",
        "desc": "Oath spells always prepared. 3rd: enhance ability, guiding bolt. 5th: misty step, spiritual weapon. 9th: haste, protection from energy. 13th: death ward, freedom of movement. 17th: commune, dispel evil and good."
      }
    },
    {
      "id": "Watchers",
      "name": "Watchers",
      "flavor": "A paladin sworn to guard against extraplanar threats.",
      "feature": {
        "name": "Oath Spells",
        "desc": "Oath spells always prepared. 3rd: alarm, detect evil and good. 5th: moonbeam, see invisibility. 9th: countermagic (counterspell), nymph's lore (Nondetection). 13th: aura of life, banishment. 17th: banishing smite, scrying."
      }
    },
    {
      "id": "Oathbreaker",
      "name": "Oathbreaker",
      "flavor": "A paladin who has broken their sacred oaths and embraces darkness.",
      "feature": {
        "name": "Oath Spells",
        "desc": "Oath spells always prepared. 3rd: hellish rebuke, inflict wounds. 5th: crown of madness, darkness. 9th: animate dead, dispel magic. 13th: aura of hate, blight. 17th: contagion, destructive wave."
      }
    }
  ],
  "Ranger": [
    {
      "id": "Hunter",
      "name": "Hunter",
      "flavor": "A ranger who adapts tactics to any combat situation.",
      "feature": {
        "name": "Hunter's Prey",
        "desc": "Choose one: Colossus Slayer (target below HP max, deal 1d8 extra damage once per turn), Giant Killer (reaction: melee attack when Large+ creature misses you within 5 ft), or Horde Breaker (once per turn, attack a second creature within 5 ft"
      }
    },
    {
      "id": "Beast Master",
      "name": "Beast Master",
      "flavor": "A ranger who bonds with a loyal animal companion.",
      "feature": {
        "name": "Ranger's Companion",
        "desc": "Bond with a beast of CR 1/4 or lower. Add PROF bonus to its AC, attacks, damage, and saves. It takes its turn on your initiative. Command it as bonus action: attack, dash, disengage, dodge, or help. If you are incapacitated, it can act inde"
      }
    },
    {
      "id": "Gloom Stalker",
      "name": "Gloom Stalker",
      "flavor": "A ranger who hunts in the darkness of the Underdark.",
      "feature": {
        "name": "Dread Ambusher",
        "desc": "Gain +WIS mod to initiative. On the first turn of combat, gain +10 ft speed and can make one extra weapon attack with 1d8 extra damage if you take the Attack action."
      }
    },
    {
      "id": "Horizon Walker",
      "name": "Horizon Walker",
      "flavor": "A ranger who traverses the boundaries between planes.",
      "feature": {
        "name": "Planar Warrior",
        "desc": "Bonus action: choose one creature you can see. Your next weapon attack against it this turn deals extra 1d8 force damage (2d8 at 11th). If you hit, the target cannot teleport until start of your next turn."
      }
    },
    {
      "id": "Monster Slayer",
      "name": "Monster Slayer",
      "flavor": "A ranger who specializes in hunting deadly threats.",
      "feature": {
        "name": "Slayer's Prey",
        "desc": "Bonus action: mark one creature you can see. Deal 1d6 extra damage the first time you hit it each turn. Mark lasts until you use this again or target dies."
      }
    },
    {
      "id": "Fey Wanderer",
      "name": "Fey Wanderer",
      "flavor": "A ranger who walks between the mortal world and the Feywild.",
      "feature": {
        "name": "Fey Wanderer Magic",
        "desc": "Learn additional spells: charm person, misty step (5th), blink (9th), dominate beast (13th), seeming (17th). Always prepared, don't count against spells known."
      }
    },
    {
      "id": "Swarmkeeper",
      "name": "Swarmkeeper",
      "flavor": "A ranger surrounded by a swarm of nature spirits.",
      "feature": {
        "name": "Swarmkeeper Magic",
        "desc": "Learn additional spells: faerie fire, web (5th), gaseous form (9th), arcane eye (13th), insect plague (17th). Always prepared, don't count against spells known."
      }
    },
    {
      "id": "Drakewarden",
      "name": "Drakewarden",
      "flavor": "A ranger bonded with a drake companion.",
      "feature": {
        "name": "Drake Companion",
        "desc": "Bonus action: summon a drake. It has HP equal to 5 × your ranger level, AC = 16 + PROF bonus, and uses your spell attack modifier for attacks. It deals 1d6 + WIS mod piercing damage (1d8 at 11th). Acts on your initiative. Command it as bonu"
      }
    }
  ],
  "Rogue": [
    {
      "id": "Thief",
      "name": "Thief",
      "flavor": "A rogue who excels at stealth, climbing, and using magical devices.",
      "feature": {
        "name": "Fast Hands",
        "desc": "Can use Sleight of Hand, use thieves' tools, or use an object as a bonus action with Cunning Action."
      }
    },
    {
      "id": "Assassin",
      "name": "Assassin",
      "flavor": "A rogue who specializes in eliminating targets with lethal precision.",
      "feature": {
        "name": "Bonus Proficiencies",
        "desc": "Gain proficiency with disguise kit and poisoner's kit."
      }
    },
    {
      "id": "Arcane Trickster",
      "name": "Arcane Trickster",
      "flavor": "A rogue who combines stealth with wizard magic.",
      "feature": {
        "name": "Spellcasting",
        "desc": "Cast wizard spells. See spellcasting block for slots and spells known. Enchantment and illusion spells count as rogue spells for you."
      }
    },
    {
      "id": "Inquisitive",
      "name": "Inquisitive",
      "flavor": "A rogue who uncovers secrets and exposes lies.",
      "feature": {
        "name": "Ear for Deceit",
        "desc": "When you make a WIS (Insight) check to determine if someone is lying, treat a d20 roll of 7 or lower as an 8."
      }
    },
    {
      "id": "Scout",
      "name": "Scout",
      "flavor": "A rogue who excels at exploration and skirmishing.",
      "feature": {
        "name": "Skirmisher",
        "desc": "Reaction: when a creature ends its turn within 5 ft of you, move up to half your speed without provoking opportunity attacks."
      }
    },
    {
      "id": "Mastermind",
      "name": "Mastermind",
      "flavor": "A rogue who manipulates others from the shadows.",
      "feature": {
        "name": "Master of Intrigue",
        "desc": "Gain proficiency with disguise kit, forgery kit, and one gaming set. Learn two languages. Gain proficiency in Deception, Persuasion, or one of: arcana, history, investigation, nature, religion."
      }
    },
    {
      "id": "Swashbuckler",
      "name": "Swashbuckler",
      "flavor": "A rogue who fights with flair and daring mobility.",
      "feature": {
        "name": "Fancy Footwork",
        "desc": "When you make a melee attack against a creature, it cannot make opportunity attacks against you for the rest of your turn."
      }
    },
    {
      "id": "Phantom",
      "name": "Phantom",
      "flavor": "A rogue haunted by spirits of the dead.",
      "feature": {
        "name": "Whispers of the Dead",
        "desc": "Whenever you finish a short or long rest, gain proficiency in one skill or tool of your choice. Lasts until your next rest."
      }
    },
    {
      "id": "Soulknife",
      "name": "Soulknife",
      "flavor": "A rogue who manifests psychic blades from their mind.",
      "feature": {
        "name": "Psionic Power",
        "desc": "Gain psionic energy dice: 2d8 + INT mod (4d8 at 9th, 6d8 at 13th, 8d8 at 17th). Dice become d10 at 13th and d12 at 17th."
      }
    }
  ],
  "Bard": [
    {
      "id": "College of Lore",
      "name": "College of Lore",
      "flavor": "Bards of the College of Lore gather knowledge from far and wide, using their talents to weave songs, stories, and magic.",
      "feature": {
        "name": "Bonus Proficiencies",
        "desc": "Gain proficiency with three skills of your choice."
      }
    },
    {
      "id": "College of Valor",
      "name": "College of Valor",
      "flavor": "Bards of the College of Valor sing of great heroes and their daring deeds, often joining them on the front lines.",
      "feature": {
        "name": "Bonus Proficiencies",
        "desc": "Gain proficiency with medium armor, shields, and martial weapons."
      }
    },
    {
      "id": "College of Glamour",
      "name": "College of Glamour",
      "flavor": "Bards of the College of Glamour weave breathtaking magic with pure charisma and presence.",
      "feature": {
        "name": "Mantle of Inspiration",
        "desc": "As a bonus action, expend one Bardic Inspiration use to grant 5 temporary HP to up to 4 friendly creatures within 60 ft and allow each to use its reaction to move up to its speed without provoking opportunity attacks. Temp HP improves to 8 "
      }
    },
    {
      "id": "College of Swords",
      "name": "College of Swords",
      "flavor": "Bards of the College of Swords are daring blades who combine magical talent with martial skill.",
      "feature": {
        "name": "Bonus Proficiencies",
        "desc": "Gain proficiency with medium armor and scimitars. If proficient with a melee weapon that lacks the two-handed property, you can use it as a spellcasting focus."
      }
    },
    {
      "id": "College of Whispers",
      "name": "College of Whispers",
      "flavor": "Bards of the College of Whispers are spies and manipulators who use secrets as weapons.",
      "feature": {
        "name": "Psychic Blades",
        "desc": "When you hit with a weapon attack, you can expend one Bardic Inspiration die to deal extra psychic damage equal to the die roll + your bard level. Target must also make a WIS save or be frightened of you until end of your next turn."
      }
    },
    {
      "id": "College of Creation",
      "name": "College of Creation",
      "flavor": "Bards of the College of Creation tap into the song of creation itself to bring things into being.",
      "feature": {
        "name": "Mote of Potential",
        "desc": "When you give a creature a Bardic Inspiration die, you also create a Mote of Potential floating above its head. When the die is rolled, the mote detonates: creatures of your choice within 5 ft of the target must make a CON save or take thun"
      }
    },
    {
      "id": "College of Eloquence",
      "name": "College of Eloquence",
      "flavor": "Bards of the College of Eloquence are master orators whose words reshape reality.",
      "feature": {
        "name": "Silver Tongue",
        "desc": "When you make a Charisma (Persuasion) or Charisma (Deception) check, you can treat a d20 roll of 9 or lower as a 10."
      }
    }
  ],
  "Cleric": [
    {
      "id": "Knowledge Domain",
      "name": "Knowledge Domain",
      "flavor": "Clerics of the Knowledge Domain value learning and understanding above all.",
      "feature": {
        "name": "Blessings of Knowledge",
        "desc": "Gain proficiency in two of: Arcana, History, Nature, Religion. Gain proficiency with two languages. Double proficiency bonus for checks with chosen skills."
      }
    },
    {
      "id": "Life Domain",
      "name": "Life Domain",
      "flavor": "Clerics of the Life Domain are devoted to preserving life and healing the wounded.",
      "feature": {
        "name": "Disciple of Life",
        "desc": "Whenever you use a spell of 1st level or higher to restore hit points, the creature regains additional HP equal to 2 + the spell's level."
      }
    },
    {
      "id": "Light Domain",
      "name": "Light Domain",
      "flavor": "Clerics of the Light Domain wield fire, radiance, and the power of dawn.",
      "feature": {
        "name": "Bonus Cantrip",
        "desc": "Learn the light cantrip if you don't already know it. It counts as a cleric cantrip for you."
      }
    },
    {
      "id": "Nature Domain",
      "name": "Nature Domain",
      "flavor": "Clerics of the Nature Domain protect the wild places and harness natural forces.",
      "feature": {
        "name": "Acolyte of Nature",
        "desc": "Learn one druid cantrip of your choice. Gain proficiency in one of: Animal Handling, Nature, or Survival."
      }
    },
    {
      "id": "Tempest Domain",
      "name": "Tempest Domain",
      "flavor": "Clerics of the Tempest Domain channel the wrath of storms and the fury of the sea.",
      "feature": {
        "name": "Bonus Proficiencies",
        "desc": "Gain proficiency with martial weapons and heavy armor."
      }
    },
    {
      "id": "Trickery Domain",
      "name": "Trickery Domain",
      "flavor": "Clerics of the Trickery Domain use deception and illusion to achieve their goals.",
      "feature": {
        "name": "Blessing of the Trickster",
        "desc": "As an action, touch one willing creature. It has advantage on Dexterity (Stealth) checks for 1 hour. Usable once per long rest (or expend a spell slot)."
      }
    },
    {
      "id": "War Domain",
      "name": "War Domain",
      "flavor": "Clerics of the War Domain are battle-hardened warriors who fight for their deity's cause.",
      "feature": {
        "name": "Bonus Proficiencies",
        "desc": "Gain proficiency with martial weapons and heavy armor."
      }
    },
    {
      "id": "Forge Domain",
      "name": "Forge Domain",
      "flavor": "Clerics of the Forge Domain master the art of creation and imbuing metal with divine power.",
      "feature": {
        "name": "Bonus Proficiencies",
        "desc": "Gain proficiency with heavy armor and smith's tools."
      }
    },
    {
      "id": "Grave Domain",
      "name": "Grave Domain",
      "flavor": "Clerics of the Grave Domain guard the boundary between life and death, opposing undeath.",
      "feature": {
        "name": "Circle of Mortality",
        "desc": "You learn the spare the dying cantrip with a range of 30 ft. When you cast a spell to heal a creature at 0 HP, treat any die rolled as its maximum. You have advantage on saves against diseases and being poisoned."
      }
    },
    {
      "id": "Order Domain",
      "name": "Order Domain",
      "flavor": "Clerics of the Order Domain uphold law, discipline, and societal structure.",
      "feature": {
        "name": "Bonus Proficiency",
        "desc": "Gain proficiency with heavy armor."
      }
    },
    {
      "id": "Peace Domain",
      "name": "Peace Domain",
      "flavor": "Clerics of the Peace Domain foster harmony and unity among allies.",
      "feature": {
        "name": "Implement of Peace",
        "desc": "Gain proficiency in Insight, Performance, or Persuasion. When you cast a spell that restores HP, the target also gains temporary HP equal to your proficiency bonus."
      }
    },
    {
      "id": "Twilight Domain",
      "name": "Twilight Domain",
      "flavor": "Clerics of the Twilight Domain operate in the boundary between light and darkness.",
      "feature": {
        "name": "Bonus Proficiencies",
        "desc": "Gain proficiency with martial weapons and heavy armor."
      }
    },
    {
      "id": "Death Domain",
      "name": "Death Domain",
      "flavor": "Clerics of the Death Domain harness necromantic power and wield the energy of death.",
      "feature": {
        "name": "Bonus Proficiency",
        "desc": "Gain proficiency with martial weapons."
      }
    }
  ],
  "Druid": [
    {
      "id": "Circle of the Land",
      "name": "Circle of the Land",
      "flavor": "Druids of the Land are mystics who guard the natural world and its secrets.",
      "feature": {
        "name": "Bonus Cantrip",
        "desc": "Learn one additional druid cantrip of your choice."
      }
    },
    {
      "id": "Circle of the Moon",
      "name": "Circle of the Moon",
      "flavor": "Druids of the Moon are fearsome shapechangers who embrace their animal forms.",
      "feature": {
        "name": "Combat Wild Shape",
        "desc": "When you use Wild Shape, you can use a bonus action instead of an action. While transformed, you can use a bonus action to expend one spell slot and regain 1d8 HP per spell slot level."
      }
    },
    {
      "id": "Circle of Dreams",
      "name": "Circle of Dreams",
      "flavor": "Druids of the Circle of Dreams are connected to the Feywild and its dreamlike magic.",
      "feature": {
        "name": "Hearth of Moonlight and Shadow",
        "desc": "During a short or long rest, you can invoke shadowy silence and light. Friendly creatures within 30 ft have advantage on Stealth checks. Any healing from resting is increased by 1d6. Lasts until the rest ends. Usable once per long rest."
      }
    },
    {
      "id": "Circle of the Shepherd",
      "name": "Circle of the Shepherd",
      "flavor": "Druids of the Circle of the Shepherd commune with nature spirits and summon powerful allies.",
      "feature": {
        "name": "Speech of the Woods",
        "desc": "You learn Sylvan. You can speak with beasts. Beasts can understand your speech and you understand theirs. Limited by beast intelligence."
      }
    },
    {
      "id": "Circle of Spores",
      "name": "Circle of Spores",
      "flavor": "Druids of the Circle of Spores find beauty in decay and channel the cycle of life and death.",
      "feature": {
        "name": "Circle Spells",
        "desc": "Gain additional spells at levels 2, 3, 5, 7, and 9 that are always prepared."
      }
    },
    {
      "id": "Circle of Stars",
      "name": "Circle of Stars",
      "flavor": "Druids of the Circle of Stars look to the cosmos for guidance and power.",
      "feature": {
        "name": "Star Map",
        "desc": "You create a Star Map, a Tiny object that serves as a spellcasting focus. You know the guidance cantrip. While holding the map, you can cast guiding bolt without using a spell slot (WIS mod times per long rest). You can also use it to deter"
      }
    },
    {
      "id": "Circle of Wildfire",
      "name": "Circle of Wildfire",
      "flavor": "Druids of the Circle of Wildfire embrace destruction and rebirth through fire.",
      "feature": {
        "name": "Circle Spells",
        "desc": "Gain additional spells at levels 2, 3, 5, 7, and 9 that are always prepared."
      }
    }
  ],
  "Sorcerer": [
    {
      "id": "Draconic Bloodline",
      "name": "Draconic Bloodline",
      "flavor": "Sorcerers with draconic bloodline ancestry gain the power and resilience of dragons.",
      "feature": {
        "name": "Dragon Ancestor",
        "desc": "Choose one dragon type (Black/Copper: Acid, Blue/Bronze: Lightning, Brass/Gold/Red: Fire, Green: Poison, Silver/White: Cold). You gain a +1 bonus on CHA checks with dragons of that type, and speak Draconic."
      }
    },
    {
      "id": "Wild Magic",
      "name": "Wild Magic",
      "flavor": "Sorcerers with wild magic have unpredictable, chaotic power that surges unpredictably.",
      "feature": {
        "name": "Wild Magic Surge",
        "desc": "Immediately after you cast a sorcerer spell of 1st level or higher, the DM can have you roll a d20. On a 1, roll on the Wild Magic Surge table to create a random effect."
      }
    },
    {
      "id": "Divine Soul",
      "name": "Divine Soul",
      "flavor": "Sorcerers with a divine soul draw power from celestial or divine sources.",
      "feature": {
        "name": "Divine Magic",
        "desc": "Learn the thaumaturgy cantrip. When you select a spell during a level-up, you can choose from the cleric spell list in addition to the sorcerer spell list. It counts as a sorcerer spell for you."
      }
    },
    {
      "id": "Shadow Magic",
      "name": "Shadow Magic",
      "flavor": "Sorcerers with shadow magic draw power from the Shadowfell and darkness itself.",
      "feature": {
        "name": "Eyes of the Dark",
        "desc": "You have 120 ft darkvision. When you reach 3rd level, you can cast darkness once per long rest by spending 2 sorcery points. CHA is your spellcasting ability."
      }
    },
    {
      "id": "Storm Sorcery",
      "name": "Storm Sorcery",
      "flavor": "Sorcerers with storm sorcery command the power of wind, thunder, and lightning.",
      "feature": {
        "name": "Wind Speaker",
        "desc": "You know the Primordial language."
      }
    },
    {
      "id": "Aberrant Mind",
      "name": "Aberrant Mind",
      "flavor": "Sorcerers with aberrant mind powers are touched by alien entities from the Far Realm.",
      "feature": {
        "name": "Psionic Spells",
        "desc": "Learn additional spells at levels 1, 3, 5, 7, and 9 that don't count against your spells known. You can cast these without verbal components by spending sorcery points equal to the spell's level."
      }
    },
    {
      "id": "Clockwork Soul",
      "name": "Clockwork Soul",
      "flavor": "Sorcerers with clockwork soul powers are connected to the plane of Mechanus and cosmic order.",
      "feature": {
        "name": "Clockwork Magic",
        "desc": "Learn additional spells at levels 1, 3, 5, 7, and 9 that don't count against your spells known. These are always prepared and can be replaced with other abjuration or transmutation spells."
      }
    }
  ],
  "Warlock": [
    {
      "id": "The Archfey",
      "name": "The Archfey",
      "flavor": "Warlocks who serve the capricious and powerful lords of the Feywild.",
      "feature": {
        "name": "Fey Presence",
        "desc": "As an action, each creature in a 10 ft cube originating from you makes a WIS save or is charmed or frightened (your choice) by you until end of your next turn. Usable once per short or long rest."
      }
    },
    {
      "id": "The Fiend",
      "name": "The Fiend",
      "flavor": "Warlocks who serve the dark powers of the Lower Planes.",
      "feature": {
        "name": "Dark One's Blessing",
        "desc": "When you reduce a hostile creature to 0 HP, you gain temporary HP equal to your CHA mod + warlock level."
      }
    },
    {
      "id": "The Great Old One",
      "name": "The Great Old One",
      "flavor": "Warlocks who serve unfathomable entities from the Far Realm.",
      "feature": {
        "name": "Awakened Mind",
        "desc": "You can telepathically speak to any creature within 30 ft that you can see. The creature doesn't need to share a language, but must be able to understand at least one."
      }
    },
    {
      "id": "The Celestial",
      "name": "The Celestial",
      "flavor": "Warlocks who serve the forces of the Upper Planes and radiant power.",
      "feature": {
        "name": "Bonus Cantrips",
        "desc": "Learn light and sacred flame. They count as warlock cantrips for you."
      }
    },
    {
      "id": "The Hexblade",
      "name": "The Hexblade",
      "flavor": "Warlocks who serve mysterious entities from the Shadowfell that forge weapons.",
      "feature": {
        "name": "Hexblade's Curse",
        "desc": "As a bonus action, choose one creature you can see within 30 ft. You gain: bonus damage equal to proficiency bonus on damage rolls against it; attacks crit on 19-20; if it dies, regain HP equal to warlock level + CHA mod. Usable once per sh"
      }
    },
    {
      "id": "The Fathomless",
      "name": "The Fathomless",
      "flavor": "Warlocks who serve the deep and alien powers of the ocean depths.",
      "feature": {
        "name": "Tentacle of the Deeps",
        "desc": "As a bonus action, create a 10 ft spectral tentacle within 60 ft that lasts for 1 minute. When you cast a spell on your turn, you can direct the tentacle to make a melee spell attack against one creature within 10 ft of it (1d8 cold damage,"
      }
    },
    {
      "id": "The Genie",
      "name": "The Genie",
      "flavor": "Warlocks who serve the noble genies of the Elemental Planes.",
      "feature": {
        "name": "Genie's Vessel",
        "desc": "Choose a genie type (Dao: bludgeoning/earth, Djinni: thunder/wind, Efreeti: fire, Marid: cold/water). Gain a vessel (Tiny object). While inside, you're safe from harm and can rest. When you cast a spell through the vessel, add proficiency b"
      }
    },
    {
      "id": "The Undying",
      "name": "The Undying",
      "flavor": "Warlocks who serve undying beings that have conquered death itself.",
      "feature": {
        "name": "Among the Dead",
        "desc": "Learn the spare the dying cantrip. You have advantage on saves against diseases and being poisoned. Undead have disadvantage on attacks against you for their first attack each combat."
      }
    }
  ],
  "Wizard": [
    {
      "id": "School of Abjuration",
      "name": "School of Abjuration",
      "flavor": "Wizards who specialize in protective magic and wards.",
      "feature": {
        "name": "Abjuration Savant",
        "desc": "Gold and time to copy abjuration spells into your spellbook is halved."
      }
    },
    {
      "id": "School of Conjuration",
      "name": "School of Conjuration",
      "flavor": "Wizards who specialize in creating objects and summoning creatures.",
      "feature": {
        "name": "Conjuration Savant",
        "desc": "Gold and time to copy conjuration spells into your spellbook is halved."
      }
    },
    {
      "id": "School of Divination",
      "name": "School of Divination",
      "flavor": "Wizards who specialize in foresight and revealing hidden knowledge.",
      "feature": {
        "name": "Divination Savant",
        "desc": "Gold and time to copy divination spells into your spellbook is halved."
      }
    },
    {
      "id": "School of Enchantment",
      "name": "School of Enchantment",
      "flavor": "Wizards who specialize in charming and beguiling minds.",
      "feature": {
        "name": "Enchantment Savant",
        "desc": "Gold and time to copy enchantment spells into your spellbook is halved."
      }
    },
    {
      "id": "School of Evocation",
      "name": "School of Evocation",
      "flavor": "Wizards who specialize in elemental and offensive magic.",
      "feature": {
        "name": "Evocation Savant",
        "desc": "Gold and time to copy evocation spells into your spellbook is halved."
      }
    },
    {
      "id": "School of Illusion",
      "name": "School of Illusion",
      "flavor": "Wizards who specialize in deception and false imagery.",
      "feature": {
        "name": "Illusion Savant",
        "desc": "Gold and time to copy illusion spells into your spellbook is halved."
      }
    },
    {
      "id": "School of Necromancy",
      "name": "School of Necromancy",
      "flavor": "Wizards who specialize in death and undeath.",
      "feature": {
        "name": "Necromancy Savant",
        "desc": "Gold and time to copy necromancy spells into your spellbook is halved."
      }
    },
    {
      "id": "School of Transmutation",
      "name": "School of Transmutation",
      "flavor": "Wizards who specialize in transforming matter and energy.",
      "feature": {
        "name": "Transmutation Savant",
        "desc": "Gold and time to copy transmutation spells into your spellbook is halved."
      }
    },
    {
      "id": "War Magic",
      "name": "War Magic",
      "flavor": "Wizards who blend evocation and abjuration for battlefield supremacy.",
      "feature": {
        "name": "Arcane Deflection",
        "desc": "As a reaction when hit by an attack or fail a save, gain +2 AC against the attack or +4 to the save. If you use this, you can only cast cantrips on your next turn."
      }
    },
    {
      "id": "Order of Scribes",
      "name": "Order of Scribes",
      "flavor": "Wizards who unlock the magical potential of their spellbooks.",
      "feature": {
        "name": "Wizardly Quill",
        "desc": "As a bonus action, conjure a Tiny quill in your free hand. It writes without ink, can't be taken from you, and summarizing text takes 1/10th the time. When you copy a spell into your spellbook, the time and gold cost is halved."
      }
    },
    {
      "id": "Bladesinging",
      "name": "Bladesinging",
      "flavor": "Wizards who blend martial skill with arcane magic in a deadly dance.",
      "feature": {
        "name": "Training in War and Song",
        "desc": "Gain proficiency with one-handed melee weapons and light armor. Gain proficiency in Performance or one musical instrument."
      }
    },
    {
      "id": "Chronurgy Magic",
      "name": "Chronurgy Magic",
      "flavor": "Wizards who manipulate time and its flow across the multiverse.",
      "feature": {
        "name": "Chronal Shift",
        "desc": "As a reaction when a creature you can see makes an attack roll, ability check, or saving throw, you can force it to reroll. You can do so after the roll but before the outcome. The creature must use the new roll. Usable twice per long rest."
      }
    },
    {
      "id": "Graviturgy Magic",
      "name": "Graviturgy Magic",
      "flavor": "Wizards who manipulate gravity and the forces that bind the cosmos.",
      "feature": {
        "name": "Adjust Density",
        "desc": "As an action, target one creature or object you can see within 60 ft. It becomes heavier or lighter for 1 minute. Heavier: -10 ft speed, when it hits with a melee attack it deals extra 1d4 bludgeoning damage. Lighter: +10 ft speed, when it "
      }
    }
  ],
  "Artificer": [
    {
      "id": "Alchemist",
      "name": "Alchemist",
      "flavor": "Artificers who focus on alchemy, creating elixirs and chemical concoctions.",
      "feature": {
        "name": "Alchemist Spells",
        "desc": "Always have certain spells prepared after you reach the specified levels (3rd, 5th, 9th, 13th, 17th). These don't count against your prepared spells."
      }
    },
    {
      "id": "Artillerist",
      "name": "Artillerist",
      "flavor": "Artificers who create magical cannons and explosive devices.",
      "feature": {
        "name": "Artillerist Spells",
        "desc": "Always have certain spells prepared after you reach the specified levels (3rd, 5th, 9th, 13th, 17th). These don't count against your prepared spells."
      }
    },
    {
      "id": "Battle Smith",
      "name": "Battle Smith",
      "flavor": "Artificers who combine martial prowess with mechanical companions.",
      "feature": {
        "name": "Battle Smith Spells",
        "desc": "Always have certain spells prepared after you reach the specified levels (3rd, 5th, 9th, 13th, 17th). These don't count against your prepared spells."
      }
    },
    {
      "id": "Armorer",
      "name": "Armorer",
      "flavor": "Artificers who create and wield magical power armor.",
      "feature": {
        "name": "Armorer Spells",
        "desc": "Always have certain spells prepared after you reach the specified levels (3rd, 5th, 9th, 13th, 17th). These don't count against your prepared spells."
      }
    }
  ]
};
