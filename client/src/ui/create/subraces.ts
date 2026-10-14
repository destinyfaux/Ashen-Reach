// Extracted SRD subraces for all bloodlines
import type { AbilityKey, Trait } from "./gamedata";

export interface SubraceData {
  id: string;
  name: string;
  flavor: string;
  asi: Partial<Record<AbilityKey, number>>;
  traits: Trait[];
}

export const SUBRACES_BY_RACE: Record<string, SubraceData[]> = {
  "Dwarf": [
    {
      "id": "Hill Dwarf",
      "name": "Hill Dwarf",
      "asi": {
        "WIS": 1
      },
      "traits": [
        {
          "name": "Dwarven Toughness",
          "desc": "Hit point maximum increases by 1, and it increases by 1 every time you gain a level."
        }
      ]
    },
    {
      "id": "Mountain Dwarf",
      "name": "Mountain Dwarf",
      "asi": {
        "STR": 2
      },
      "traits": [
        {
          "name": "Dwarven Armor Training",
          "desc": "Proficiency with light and medium armor."
        }
      ]
    },
    {
      "id": "Duergar",
      "name": "Duergar",
      "asi": {
        "STR": 1
      },
      "traits": [
        {
          "name": "Superior Darkvision",
          "desc": "Darkvision radius is 120 feet."
        },
        {
          "name": "Duergar Resilience",
          "desc": "You have advantage on saving throws against illusions and against being charmed or paralyzed."
        },
        {
          "name": "Duergar Magic",
          "desc": "At 3rd level, you can cast enlarge/reduce on yourself once per day. At 5th level, you can cast invisibility on yourself once per day. You don't need material components for either spell, and you can't cast them while you're in direct sunlig"
        },
        {
          "name": "Sunlight Sensitivity",
          "desc": "You have disadvantage on attack rolls and on Wisdom (Perception) checks that rely on sight when you, the target of your attack, or whatever you are trying to perceive is in direct sunlight."
        }
      ]
    }
  ],
  "Elf": [
    {
      "id": "High Elf",
      "name": "High Elf",
      "asi": {
        "INT": 1
      },
      "traits": [
        {
          "name": "Elf Weapon Training",
          "desc": "Proficiency with longswords, shortswords, shortbows, and longbows."
        },
        {
          "name": "Cantrip",
          "desc": "You know one cantrip of your choice from the wizard spell list. Intelligence is your spellcasting ability for it."
        },
        {
          "name": "Extra Language",
          "desc": "You can speak, read, and write one extra language of your choice."
        }
      ]
    },
    {
      "id": "Wood Elf",
      "name": "Wood Elf",
      "asi": {
        "WIS": 1
      },
      "traits": [
        {
          "name": "Elf Weapon Training",
          "desc": "Proficiency with longswords, shortswords, shortbows, and longbows."
        },
        {
          "name": "Mask of the Wild",
          "desc": "You can attempt to hide even when you are only lightly obscured by foliage, heavy rain, falling snow, mist, and other natural phenomena."
        },
        {
          "name": "Fleet of Foot",
          "desc": "Base walking speed increases to 35 feet."
        }
      ]
    },
    {
      "id": "Drow",
      "name": "Drow",
      "asi": {
        "CHA": 1
      },
      "traits": [
        {
          "name": "Superior Darkvision",
          "desc": "Darkvision radius is 120 feet."
        },
        {
          "name": "Sunlight Sensitivity",
          "desc": "You have disadvantage on attack rolls and on Wisdom (Perception) checks that rely on sight when you, the target of your attack, or whatever you are trying to perceive is in direct sunlight."
        },
        {
          "name": "Drow Magic",
          "desc": "You know the dancing lights cantrip. At 3rd level, you can cast faerie fire once per day. At 5th level, you can cast darkness once per day. Charisma is your spellcasting ability for these spells."
        },
        {
          "name": "Drow Weapon Training",
          "desc": "Proficiency with rapiers, shortswords, and hand crossbows."
        }
      ]
    },
    {
      "id": "Eladrin",
      "name": "Eladrin",
      "asi": {
        "CHA": 1
      },
      "traits": [
        {
          "name": "Elf Weapon Training",
          "desc": "Proficiency with longswords, shortswords, shortbows, and longbows."
        },
        {
          "name": "Fey Step",
          "desc": "As a bonus action, you can magically teleport up to 30 feet to an unoccupied space you can see. Once you use this trait, you can't use it again until you finish a short or long rest. When you reach 3rd level, your Fey Step gains an addition"
        },
        {
          "name": "Seasonal Form",
          "desc": "Choose a season: Autumn, Winter, Spring, or Summer. Your appearance and Fey Step effect are tied to this season. You can change seasons at the end of a short or long rest."
        }
      ]
    },
    {
      "id": "Sea Elf",
      "name": "Sea Elf",
      "asi": {
        "CON": 1
      },
      "traits": [
        {
          "name": "Sea Elf Training",
          "desc": "Proficiency with spears, tridents, light crossbows, and nets."
        },
        {
          "name": "Amphibious",
          "desc": "You can breathe air and water."
        },
        {
          "name": "Swim",
          "desc": "You have a swimming speed of 30 feet."
        },
        {
          "name": "Friend of the Sea",
          "desc": "Using gestures and sounds, you can communicate simple ideas with any beast that has an innate swimming speed."
        },
        {
          "name": "Child of the Sea",
          "desc": "You have resistance to cold damage."
        }
      ]
    },
    {
      "id": "Shadar-kai",
      "name": "Shadar-kai",
      "asi": {
        "CON": 1
      },
      "traits": [
        {
          "name": "Necrotic Resistance",
          "desc": "You have resistance to necrotic damage."
        },
        {
          "name": "Blessing of the Raven Queen",
          "desc": "As a bonus action, you can magically teleport up to 30 feet to an unoccupied space you can see. You also gain resistance to all damage until the start of your next turn. Once you use this trait, you can't use it again until you finish a sho"
        }
      ]
    },
    {
      "id": "Ash Elf",
      "name": "Ash Elf",
      "asi": {
        "DEX": 2,
        "INT": 1
      },
      "traits": [
        {
          "name": "Superior Darkvision",
          "desc": "You can see in dim light within 120ft of you as if it were bright light, and in darkness as if it were dim light. You can't discern color in darkness only shades of grey."
        },
        {
          "name": "Ashen Acclimation",
          "desc": "Your eyes are evolved for the volatile haze of the Wastes. The distance you can see through fog or heavy ash is doubled (typically up to 120ft) allowing you to spot threats before they emerge from the gloom."
        },
        {
          "name": "Fungal Adaptation",
          "desc": "You have advantage on saving throws against being poisoned and resistance against poison damage."
        },
        {
          "name": "Necrotic Resistance",
          "desc": "You have resistance to necrotic damage."
        },
        {
          "name": "The Weaver's Silence",
          "desc": "You have proficiency in the stealth skill. Starting at 3rd level you can cast the silence spell once per long rest. Intelligence is your spellcasting ability for this spell."
        },
        {
          "name": "Soul-Sickness",
          "desc": "Your spirit is brittle, tied to a fading world. You have disadvantage on saving throws against being charmed or frightened by non-undead creatures."
        }
      ]
    }
  ],
  "Halfling": [
    {
      "id": "Lightfoot",
      "name": "Lightfoot",
      "asi": {
        "CHA": 1
      },
      "traits": [
        {
          "name": "Naturally Stealthy",
          "desc": "You can attempt to hide even when you are obscured only by a creature that is at least one size larger than you."
        }
      ]
    },
    {
      "id": "Stout",
      "name": "Stout",
      "asi": {
        "CON": 1
      },
      "traits": [
        {
          "name": "Stout Resilience",
          "desc": "Advantage on saving throws against poison, and you have resistance against poison damage."
        }
      ]
    },
    {
      "id": "Ghostwise",
      "name": "Ghostwise",
      "asi": {
        "WIS": 1
      },
      "traits": [
        {
          "name": "Silent Speech",
          "desc": "You can speak telepathically to any creature within 30 feet of you. The creature understands you only if the two of you share a language. You can speak telepathically in this way to one creature at a time."
        }
      ]
    }
  ],
  "Human": [
    {
      "id": "Variant",
      "name": "Variant",
      "asi": {},
      "traits": [
        {
          "name": "Ability Score Increase",
          "desc": "Two different ability scores of your choice increase by 1."
        },
        {
          "name": "Skills",
          "desc": "You gain proficiency in one skill of your choice."
        },
        {
          "name": "Feat",
          "desc": "You gain one feat of your choice."
        },
        {
          "name": "Extra Language",
          "desc": "You can speak, read, and write one extra language of your choice."
        }
      ]
    }
  ],
  "Dragonborn": [
    {
      "id": "Black",
      "name": "Black",
      "asi": {},
      "traits": [
        {
          "name": "Breath Weapon",
          "desc": "5 by 30 ft. line; lightning damage; DEX save."
        },
        {
          "name": "Damage Resistance",
          "desc": "Lightning"
        }
      ]
    },
    {
      "id": "Blue",
      "name": "Blue",
      "asi": {},
      "traits": [
        {
          "name": "Breath Weapon",
          "desc": "5 by 30 ft. line; lightning damage; DEX save."
        },
        {
          "name": "Damage Resistance",
          "desc": "Lightning"
        }
      ]
    },
    {
      "id": "Brass",
      "name": "Brass",
      "asi": {},
      "traits": [
        {
          "name": "Breath Weapon",
          "desc": "5 by 30 ft. line; fire damage; DEX save."
        },
        {
          "name": "Damage Resistance",
          "desc": "Fire"
        }
      ]
    },
    {
      "id": "Bronze",
      "name": "Bronze",
      "asi": {},
      "traits": [
        {
          "name": "Breath Weapon",
          "desc": "5 by 30 ft. line; lightning damage; DEX save."
        },
        {
          "name": "Damage Resistance",
          "desc": "Lightning"
        }
      ]
    },
    {
      "id": "Copper",
      "name": "Copper",
      "asi": {},
      "traits": [
        {
          "name": "Breath Weapon",
          "desc": "5 by 30 ft. line; acid damage; DEX save."
        },
        {
          "name": "Damage Resistance",
          "desc": "Acid"
        }
      ]
    },
    {
      "id": "Gold",
      "name": "Gold",
      "asi": {},
      "traits": [
        {
          "name": "Breath Weapon",
          "desc": "15 ft. cone; fire damage; DEX save."
        },
        {
          "name": "Damage Resistance",
          "desc": "Fire"
        }
      ]
    },
    {
      "id": "Green",
      "name": "Green",
      "asi": {},
      "traits": [
        {
          "name": "Breath Weapon",
          "desc": "15 ft. cone; poison damage; CON save."
        },
        {
          "name": "Damage Resistance",
          "desc": "Poison"
        }
      ]
    },
    {
      "id": "Red",
      "name": "Red",
      "asi": {},
      "traits": [
        {
          "name": "Breath Weapon",
          "desc": "15 ft. cone; fire damage; DEX save."
        },
        {
          "name": "Damage Resistance",
          "desc": "Fire"
        }
      ]
    },
    {
      "id": "Silver",
      "name": "Silver",
      "asi": {},
      "traits": [
        {
          "name": "Breath Weapon",
          "desc": "15 ft. cone; cold damage; CON save."
        },
        {
          "name": "Damage Resistance",
          "desc": "Cold"
        }
      ]
    },
    {
      "id": "White",
      "name": "White",
      "asi": {},
      "traits": [
        {
          "name": "Breath Weapon",
          "desc": "15 ft. cone; cold damage; CON save."
        },
        {
          "name": "Damage Resistance",
          "desc": "Cold"
        }
      ]
    }
  ],
  "Gnome": [
    {
      "id": "Forest Gnome",
      "name": "Forest Gnome",
      "asi": {
        "DEX": 1
      },
      "traits": [
        {
          "name": "Natural Illusionist",
          "desc": "You know the minor illusion cantrip. Intelligence is your spellcasting ability for it."
        },
        {
          "name": "Speak with Small Beasts",
          "desc": "Through sounds and gestures, you can communicate simple ideas with Small or smaller beasts."
        }
      ]
    },
    {
      "id": "Rock Gnome",
      "name": "Rock Gnome",
      "asi": {
        "CON": 1
      },
      "traits": [
        {
          "name": "Artificer's Lore",
          "desc": "Whenever you make an Intelligence (History) check related to magic items, alchemical objects, or technological devices, you can add twice your proficiency bonus, instead of any proficiency bonus you normally apply."
        },
        {
          "name": "Tinker",
          "desc": "You have proficiency with artisan's tools (tinker's tools). Using those tools, you can spend 1 hour and 10 gp worth of materials to construct a Tiny clockwork device (AC 5, 1 HP). You can have up to three such devices active at a time. Opti"
        }
      ]
    }
  ],
  "Half-Elf": [
    {
      "id": "Wood Elf Descent",
      "name": "Wood Elf Descent",
      "asi": {},
      "traits": [
        {
          "name": "Elf Weapon Training",
          "desc": "Proficiency with longswords, shortswords, shortbows, and longbows."
        },
        {
          "name": "Mask of the Wild",
          "desc": "You can attempt to hide even when you are only lightly obscured by foliage, heavy rain, falling snow, mist, and other natural phenomena."
        },
        {
          "name": "Ability Score Increase",
          "desc": "Replace Skill Versatility: DEX increases by 1, and WIS increases by 1. Alternatively, increase DEX or WIS by 1 and gain proficiency in one skill of your choice."
        }
      ]
    },
    {
      "id": "Moon Elf or Sun Elf Descent",
      "name": "Moon Elf or Sun Elf Descent",
      "asi": {},
      "traits": [
        {
          "name": "Elf Weapon Training",
          "desc": "Proficiency with longswords, shortswords, shortbows, and longbows."
        },
        {
          "name": "Cantrip",
          "desc": "You know one cantrip of your choice from the wizard spell list. Intelligence is your spellcasting ability for it."
        },
        {
          "name": "Ability Score Increase",
          "desc": "Replace Skill Versatility: INT increases by 1, and one other ability score of your choice increases by 1."
        }
      ]
    },
    {
      "id": "Drow Descent",
      "name": "Drow Descent",
      "asi": {},
      "traits": [
        {
          "name": "Drow Magic",
          "desc": "You know the dancing lights cantrip. At 3rd level, you can cast faerie fire once per day. At 5th level, you can cast darkness once per day. Charisma is your spellcasting ability for these spells."
        },
        {
          "name": "Ability Score Increase",
          "desc": "Replace Skill Versatility: DEX increases by 1, and CHA increases by 1. Alternatively, increase DEX or CHA by 1 and gain proficiency in one skill of your choice."
        }
      ]
    }
  ],
  "Tiefling": [
    {
      "id": "Feral",
      "name": "Feral",
      "asi": {
        "DEX": 1
      },
      "traits": [
        {
          "name": "Variant Ability Scores",
          "desc": "Replace INT +1 with DEX +1."
        }
      ]
    },
    {
      "id": "Dispater Tiefling",
      "name": "Dispater Tiefling",
      "asi": {
        "DEX": 1
      },
      "traits": [
        {
          "name": "Variant Ability Scores",
          "desc": "Replace INT +1 with DEX +1."
        },
        {
          "name": "Infernal Legacy (Dispater)",
          "desc": "Thaumaturgy cantrip. At 3rd level: disguise self once per day. At 5th level: invisibility once per day. Charisma is your spellcasting ability."
        }
      ]
    },
    {
      "id": "Glasya Tiefling",
      "name": "Glasya Tiefling",
      "asi": {
        "DEX": 1
      },
      "traits": [
        {
          "name": "Variant Ability Scores",
          "desc": "Replace INT +1 with DEX +1."
        },
        {
          "name": "Infernal Legacy (Glasya)",
          "desc": "Minor illusion cantrip. At 3rd level: disguise self once per day. At 5th level: invisibility once per day. Charisma is your spellcasting ability."
        }
      ]
    },
    {
      "id": "Mammon Tiefling",
      "name": "Mammon Tiefling",
      "asi": {
        "INT": 1
      },
      "traits": [
        {
          "name": "Infernal Legacy (Mammon)",
          "desc": "Mage hand cantrip. At 3rd level: Tenser's floating disk once per day. At 5th level: arcane lock once per day. Charisma is your spellcasting ability."
        }
      ]
    },
    {
      "id": "Mephistopheles Tiefling",
      "name": "Mephistopheles Tiefling",
      "asi": {
        "INT": 1
      },
      "traits": [
        {
          "name": "Infernal Legacy (Mephistopheles)",
          "desc": "Mage hand cantrip. At 3rd level: burning hands once per day. At 5th level: flame blade once per day. Charisma is your spellcasting ability."
        }
      ]
    },
    {
      "id": "Zariel Tiefling",
      "name": "Zariel Tiefling",
      "asi": {
        "STR": 1
      },
      "traits": [
        {
          "name": "Variant Ability Scores",
          "desc": "Replace INT +1 with STR +1."
        },
        {
          "name": "Infernal Legacy (Zariel)",
          "desc": "Thaumaturgy cantrip. At 3rd level: searing smite once per day. At 5th level: branding smite once per day. Charisma is your spellcasting ability."
        }
      ]
    },
    {
      "id": "Zariel Tiefling (BGDiA)",
      "name": "Zariel Tiefling (BGDiA)",
      "asi": {
        "STR": 1
      },
      "traits": [
        {
          "name": "Variant Ability Scores",
          "desc": "Replace INT +1 with STR +1. Same as SCAG Zariel variant with additional narrative context from BGDiA."
        },
        {
          "name": "Infernal Legacy (Zariel)",
          "desc": "Thaumaturgy cantrip. At 3rd level: searing smite once per day. At 5th level: branding smite once per day. Charisma is your spellcasting ability."
        },
        {
          "name": "Zariel's Legacy",
          "desc": "Your tiefling heritage is tied to Zariel, the Archdevil of Avernus. You may have distinctive features such as golden eyes or a faint smell of brimstone."
        }
      ]
    }
  ],
  "Genasi": [
    {
      "id": "Air Genasi",
      "name": "Air Genasi",
      "asi": {
        "DEX": 1
      },
      "traits": [
        {
          "name": "Unending Breath",
          "desc": "You can hold your breath indefinitely while you're not incapacitated."
        },
        {
          "name": "Mingle with the Wind",
          "desc": "You can cast levitate once per day with this trait, requiring no material components. Constitution is your spellcasting ability for it."
        }
      ]
    },
    {
      "id": "Earth Genasi",
      "name": "Earth Genasi",
      "asi": {
        "STR": 1
      },
      "traits": [
        {
          "name": "Earth Walk",
          "desc": "You can move across difficult terrain made of earth or stone without expending extra movement."
        },
        {
          "name": "Merge with Stone",
          "desc": "You can cast pass without trace once per day with this trait, requiring no material components. Constitution is your spellcasting ability for it."
        }
      ]
    },
    {
      "id": "Fire Genasi",
      "name": "Fire Genasi",
      "asi": {
        "INT": 1
      },
      "traits": [
        {
          "name": "Darkvision",
          "desc": "You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light. Your ties to the Elemental Plane of Fire make your darkvision unusual: everything you see in darkness is in shades of red."
        },
        {
          "name": "Fire Resistance",
          "desc": "You have resistance to fire damage."
        },
        {
          "name": "Reach to the Blaze",
          "desc": "You know the produce flame cantrip. At 3rd level, you can cast burning hands once per day. Constitution is your spellcasting ability for these spells."
        }
      ]
    },
    {
      "id": "Water Genasi",
      "name": "Water Genasi",
      "asi": {
        "WIS": 1
      },
      "traits": [
        {
          "name": "Acid Resistance",
          "desc": "You have resistance to acid damage."
        },
        {
          "name": "Amphibious",
          "desc": "You can breathe air and water."
        },
        {
          "name": "Swim",
          "desc": "You have a swimming speed of 30 feet."
        },
        {
          "name": "Call to the Wave",
          "desc": "You know the shape water cantrip. At 3rd level, you can cast create or destroy water once per day. Constitution is your spellcasting ability for these spells."
        }
      ]
    }
  ],
  "Deep Gnome": [
    {
      "id": "MToF Expanded",
      "name": "MToF Expanded",
      "asi": {},
      "traits": [
        {
          "name": "Svirfneblin Magic",
          "desc": "At 3rd level, you can cast blindness/deafness, blur, and disguise self once per day each with this trait, requiring no material components. When you cast blindness/deafness with this trait, you can't use it on yourself. Intelligence is your"
        }
      ]
    }
  ],
  "Aasimar": [
    {
      "id": "Protector",
      "name": "Protector",
      "asi": {
        "WIS": 1
      },
      "traits": [
        {
          "name": "Radiant Soul",
          "desc": "Starting at 3rd level, you can use your action to unleash the divine energy within yourself, causing your eyes to glimmer and two luminous, incorporeal wings to sprout from your back. For 1 minute, you have a flying speed of 30 feet, and on"
        }
      ]
    },
    {
      "id": "Scourge",
      "name": "Scourge",
      "asi": {
        "CON": 1
      },
      "traits": [
        {
          "name": "Radiant Consumption",
          "desc": "Starting at 3rd level, you can use your action to unleash the divine energy within yourself, causing a searing light to radiate from you, pour out of your eyes and mouth, and threaten to char you. For 1 minute, you shed bright light in a 10"
        }
      ]
    },
    {
      "id": "Fallen",
      "name": "Fallen",
      "asi": {
        "STR": 1
      },
      "traits": [
        {
          "name": "Necrotic Shroud",
          "desc": "Starting at 3rd level, you can use your action to unleash the divine energy within yourself, causing your eyes to turn into pools of darkness and two skeletal, ghostly, flightless wings to sprout from your back. For 1 minute, you cause each"
        }
      ]
    }
  ],
  "Gem Dragonborn": [
    {
      "id": "Amethyst",
      "name": "Amethyst",
      "asi": {},
      "traits": [
        {
          "name": "Breath Weapon",
          "desc": "15 ft. cone; force damage; DEX save."
        },
        {
          "name": "Gem Resistance",
          "desc": "Force"
        },
        {
          "name": "Psionic Rebuke",
          "desc": "When a creature hits you with a melee attack, you can use your reaction to deal 1d4 force damage to the creature. The damage increases to 1d6 at 6th level, 1d8 at 11th level, and 1d10 at 16th level."
        }
      ]
    },
    {
      "id": "Crystal",
      "name": "Crystal",
      "asi": {},
      "traits": [
        {
          "name": "Breath Weapon",
          "desc": "15 ft. cone; radiant damage; CON save."
        },
        {
          "name": "Gem Resistance",
          "desc": "Radiant"
        },
        {
          "name": "Psionic Rebuke",
          "desc": "When a creature hits you with a melee attack, you can use your reaction to deal 1d4 radiant damage to the creature. The damage increases to 1d6 at 6th level, 1d8 at 11th level, and 1d10 at 16th level."
        }
      ]
    },
    {
      "id": "Emerald",
      "name": "Emerald",
      "asi": {},
      "traits": [
        {
          "name": "Breath Weapon",
          "desc": "15 ft. cone; psychic damage; WIS save."
        },
        {
          "name": "Gem Resistance",
          "desc": "Psychic"
        },
        {
          "name": "Psionic Rebuke",
          "desc": "When a creature hits you with a melee attack, you can use your reaction to deal 1d4 psychic damage to the creature. The damage increases to 1d6 at 6th level, 1d8 at 11th level, and 1d10 at 16th level."
        }
      ]
    },
    {
      "id": "Sapphire",
      "name": "Sapphire",
      "asi": {},
      "traits": [
        {
          "name": "Breath Weapon",
          "desc": "15 ft. cone; thunder damage; CON save."
        },
        {
          "name": "Gem Resistance",
          "desc": "Thunder"
        },
        {
          "name": "Psionic Rebuke",
          "desc": "When a creature hits you with a melee attack, you can use your reaction to deal 1d4 thunder damage to the creature. The damage increases to 1d6 at 6th level, 1d8 at 11th level, and 1d10 at 16th level."
        }
      ]
    },
    {
      "id": "Topaz",
      "name": "Topaz",
      "asi": {},
      "traits": [
        {
          "name": "Breath Weapon",
          "desc": "15 ft. cone; cold damage; CON save."
        },
        {
          "name": "Gem Resistance",
          "desc": "Cold"
        },
        {
          "name": "Psionic Rebuke",
          "desc": "When a creature hits you with a melee attack, you can use your reaction to deal 1d4 cold damage to the creature. The damage increases to 1d6 at 6th level, 1d8 at 11th level, and 1d10 at 16th level."
        }
      ]
    }
  ]
};
