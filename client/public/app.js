"use strict";(()=>{var qm=Object.defineProperty;var za=(i,e)=>()=>(i&&(e=i(i=0)),e);var $m=(i,e)=>{for(var t in e)qm(i,t,{get:e[t],enumerable:!0})};function jr(i){return!!fs[i]?.length}function Ln(i){return Math.floor((i-10)/2)}function Oi(i){return i>=0?"+"+i:String(i)}function b0(i){return y0[i]??0}function Za(i){return yn.reduce((e,t)=>e+b0(i[t]),0)}function Sc(){let i=Array.from({length:4},()=>1+Math.floor(Math.random()*6)),e=i.slice().sort((t,n)=>n-t).slice(0,3).reduce((t,n)=>t+n,0);return{dice:i,total:e}}function Ja(i){let e=g0[i],t={str:0,dex:0,con:0,int:0,wis:0,cha:0};if(!e)return t;for(let n of[e.asi,e.subrace?.asi])if(n)for(let[s,r]of Object.entries(n)){let a=s.toLowerCase();a in t&&(t[a]+=r)}return t}function Mc(i,e){let t=Ja(e),n={...i};for(let s of yn)n[s]=i[s]+t[s];return n}function _c(i,e){let t=v0[i];return t?Math.max(1,t.hitDie+Ln(e)):8}function wc(i,e,t,n,s=10){let r=Ln(t),a=Ln(n),o=Ln(s),l=e.join(" | ").toLowerCase(),c=d=>l.includes(d),h=c("mail")||c("scale")||c("leather")||c("armor")||c("breastplate"),u=10+r;return c("chain mail")?u=16:c("scale mail")?u=14+Math.min(r,2):c("studded leather")?u=12+r:(c("leather armor")||c("leather"))&&(u=11+r),i==="Barbarian"&&(u=Math.max(u,10+r+a)),i==="Monk"&&!h&&(u=Math.max(u,10+r+o)),/\bshield/.test(l)&&(u+=2),u}var yn,l0,c0,h0,u0,d0,f0,p0,Dd,m0,Ni,g0,kn,v0,fs,ps,ZM,Ys,xc,Ka,y0,Ec=za(()=>{"use strict";yn=["str","dex","con","int","wis","cha"],l0=[{id:"Dwarf",asi:{CON:2},subrace:{name:"Hill Dwarf",asi:{WIS:1}},speed:25,size:"Medium",darkvision:60,languages:["Common","Dwarvish"],traits:[{name:"Dwarven Resilience",desc:"Advantage on saving throws against poison, and resistance against poison damage."},{name:"Dwarven Combat Training",desc:"Proficiency with battleaxes, hand crossbows, light hammers, and warhammers."},{name:"Tool Proficiency",desc:"Proficiency with one artisan's tool of your choice: smith's tools, brewer's supplies, or mason's tools."},{name:"Stonecunning",desc:"Whenever you make an Intelligence (History) check related to the origin of stonework, you are considered proficient in the History skill and add double your proficiency bonus to the check."}]},{id:"Elf",asi:{DEX:2},subrace:{name:"High Elf",asi:{INT:1}},speed:30,size:"Medium",darkvision:60,languages:["Common","Elvish"],traits:[{name:"Keen Senses",desc:"Proficiency in the Perception skill."},{name:"Fey Ancestry",desc:"Advantage on saving throws against being charmed, and magic cannot put you to sleep."},{name:"Trance",desc:"Elves don't need to sleep. Instead, they meditate deeply, remaining semiconscious, for 4 hours a day. After resting in this way, you gain the same benefit that a human does from 8 hours of sleep."}]},{id:"Halfling",asi:{DEX:2},subrace:{name:"Lightfoot",asi:{CHA:1}},speed:25,size:"Small",darkvision:0,languages:["Common","Halfling"],traits:[{name:"Lucky",desc:"When you roll a 1 on the d20 for an attack roll, ability check, or saving throw, you can reroll the die and must use the new roll."},{name:"Brave",desc:"You have advantage on saving throws against being frightened."},{name:"Halfling Nimbleness",desc:"You can move through the space of any creature that is of a size larger than yours."}]},{id:"Human",asi:{STR:1,DEX:1,CON:1,INT:1,WIS:1,CHA:1},subrace:{name:"Variant",asi:{}},speed:30,size:"Medium",darkvision:0,languages:["Common"],traits:[{name:"Extra Language",desc:"You can speak, read, and write one extra language of your choice."}]},{id:"Dragonborn",asi:{STR:2,CHA:1},subrace:{name:"Black",asi:{}},speed:30,size:"Medium",darkvision:0,languages:["Common","Draconic"],traits:[{name:"Draconic Ancestry",desc:"You have draconic ancestry. Choose one type of dragon from the Draconic Ancestry table. Your breath weapon and damage resistance are determined by the dragon type."},{name:"Breath Weapon",desc:"You can use your action to exhale destructive energy. Your draconic ancestry determines the size, shape, and damage type of the exhalation. When you use your breath weapon, each creature in the area of the exhalation\u2026"},{name:"Damage Resistance",desc:"You have resistance to the damage type associated with your draconic ancestry."},{name:"Draconic Heritage",desc:"You can speak, read, and write Draconic."}]},{id:"Gnome",asi:{INT:2},subrace:{name:"Forest Gnome",asi:{DEX:1}},speed:25,size:"Small",darkvision:60,languages:["Common","Gnomish"],traits:[{name:"Gnome Cunning",desc:"You have advantage on all Intelligence, Wisdom, and Charisma saving throws against magic."}]},{id:"Half-Elf",asi:{CHA:2},subrace:{name:"Wood Elf Descent",asi:{}},speed:30,size:"Medium",darkvision:60,languages:["Common","Elvish"],traits:[{name:"Fey Ancestry",desc:"Advantage on saving throws against being charmed, and magic cannot put you to sleep."},{name:"Skill Versatility",desc:"You gain proficiency in two skills of your choice."},{name:"Extra Language",desc:"You can speak, read, and write one extra language of your choice."},{name:"Ability Score Increase",desc:"Two other ability scores of your choice increase by 1."}]},{id:"Half-Orc",asi:{STR:2,CON:1},subrace:null,speed:30,size:"Medium",darkvision:60,languages:["Common","Orc"],traits:[{name:"Menacing",desc:"You gain proficiency in the Intimidation skill."},{name:"Relentless Endurance",desc:"When you are reduced to 0 hit points but not killed outright, you can drop to 1 hit point instead. You can't use this feature again until you finish a long rest."},{name:"Savage Attacks",desc:"When you score a critical hit with a melee weapon attack, you can roll one of the weapon's damage dice one additional time and add it to the extra damage of the critical hit."}]},{id:"Tiefling",asi:{CHA:2,INT:1},subrace:{name:"Feral",asi:{DEX:1}},speed:30,size:"Medium",darkvision:60,languages:["Common","Infernal"],traits:[{name:"Hellish Resistance",desc:"You have resistance to fire damage."},{name:"Infernal Legacy",desc:"You know the thaumaturgy cantrip. At 3rd level, you can cast hellish rebuke once per day as a 2nd-level spell. At 5th level, you can cast darkness once per day. Charisma is your spellcasting ability for these spells."}]},{id:"Aarakocra",asi:{DEX:2,WIS:1},subrace:null,speed:25,size:"Medium",darkvision:0,languages:["Common","Aarakocra","Auran"],traits:[{name:"Flight",desc:"You have a flying speed of 50 feet. To use this speed, you can't be wearing medium or heavy armor."},{name:"Talons",desc:"You are proficient with your unarmed strikes, which deal 1d4 slashing damage on a hit."}]},{id:"Genasi",asi:{CON:2},subrace:{name:"Air Genasi",asi:{DEX:1}},speed:30,size:"Medium",darkvision:0,languages:["Common","Primordial"],traits:[]},{id:"Goliath",asi:{STR:2,CON:1},subrace:null,speed:30,size:"Medium",darkvision:0,languages:["Common","Giant"],traits:[{name:"Natural Athlete",desc:"You have proficiency in the Athletics skill."},{name:"Stone's Endurance",desc:"You can focus yourself to occasionally shrug off injury. When you take damage, you can use your reaction to roll a d12. Add your Constitution modifier to the number rolled, and reduce the damage by that total. After\u2026"},{name:"Powerful Build",desc:"You count as one size larger when determining your carrying capacity and the weight you can push, drag, or lift."},{name:"Mountain Born",desc:"You're acclimated to high altitude, including elevations above 20,000 feet. You're also naturally adapted to cold climates, as described in chapter 5 of the Dungeon Master's Guide."}]},{id:"Deep Gnome",asi:{INT:2,DEX:1},subrace:{name:"MToF Expanded",asi:{}},speed:25,size:"Small",darkvision:120,languages:["Common","Gnomish","Undercommon"],traits:[{name:"Superior Darkvision",desc:"Darkvision radius is 120 feet."},{name:"Gnome Cunning",desc:"You have advantage on all Intelligence, Wisdom, and Charisma saving throws against magic."},{name:"Svirfneblin Camouflage",desc:"When you make a Dexterity (Stealth) check while in rocky terrain, you can add twice your proficiency bonus to the roll."},{name:"Stone Camouflage",desc:"You have advantage on Dexterity (Stealth) checks made to hide in rocky terrain."}]},{id:"Aasimar",asi:{CHA:2},subrace:{name:"Protector",asi:{WIS:1}},speed:30,size:"Medium",darkvision:60,languages:["Common","Celestial"],traits:[{name:"Celestial Resistance",desc:"You have resistance to necrotic damage and radiant damage."},{name:"Healing Hands",desc:"As an action, you can touch a creature and cause it to regain a number of hit points equal to your level. Once you use this trait, you can't use it again until you finish a long rest."},{name:"Light Bearer",desc:"You know the light cantrip. Charisma is your spellcasting ability for it."}]},{id:"Bugbear",asi:{STR:2,DEX:1},subrace:null,speed:30,size:"Medium",darkvision:60,languages:["Common","Goblin"],traits:[{name:"Long-Limbed",desc:"When you make a melee attack on your turn, your reach for it is 5 feet greater than normal."},{name:"Surprise Attack",desc:"If you surprise a creature and hit it with an attack on your first turn in combat, the attack deals an extra 2d6 damage to it."},{name:"Sneaky",desc:"You are proficient in the Stealth skill."},{name:"Powerful Build",desc:"You count as one size larger when determining your carrying capacity and the weight you can push, drag, or lift."}]},{id:"Firbolg",asi:{WIS:2,STR:1},subrace:null,speed:30,size:"Medium",darkvision:60,languages:["Common","Elvish","Giant"],traits:[{name:"Firbolg Magic",desc:"You can cast detect magic and disguise self with this trait, using Wisdom as your spellcasting ability. Once you cast either spell, you can't cast it again with this trait until you finish a short or long rest. When\u2026"},{name:"Hidden Step",desc:"As a bonus action, you can magically turn invisible until the start of your next turn or until you attack, make a damage roll, or force someone to make a saving throw. Once you use this trait, you can't use it again\u2026"},{name:"Powerful Build",desc:"You count as one size larger when determining your carrying capacity and the weight you can push, drag, or lift."},{name:"Speech of Beast and Leaf",desc:"You have the ability to communicate in a limited manner with beasts and plants. They can understand the meaning of your words, though you have no special ability to understand them in return. You have advantage on all\u2026"}]},{id:"Goblin",asi:{DEX:2,CON:1},subrace:null,speed:30,size:"Small",darkvision:60,languages:["Common","Goblin"],traits:[{name:"Darkvision",desc:"You can see in dim light within 60 feet as if it were bright light, and in darkness as if it were dim light."},{name:"Fury of the Small",desc:"When you damage a creature with an attack or a spell and the creature's size is larger than yours, you can cause the attack or spell to deal extra damage to the creature equal to your level. Once you use this trait\u2026"},{name:"Nimble Escape",desc:"You can take the Disengage or Hide action as a bonus action on each of your turns."}]},{id:"Hobgoblin",asi:{CON:2,INT:1},subrace:null,speed:30,size:"Medium",darkvision:60,languages:["Common","Goblin"],traits:[{name:"Saving Face",desc:"Hobgoblins are careful not to show weakness in front of their allies, for fear of losing status. If you miss with an attack roll or fail an ability check or a saving throw, you can gain a bonus to the roll equal to the\u2026"},{name:"Martial Training",desc:"You are proficient with two martial weapons of your choice and with light armor."}]},{id:"Kenku",asi:{DEX:2,WIS:1},subrace:null,speed:30,size:"Medium",darkvision:0,languages:["Common","Auran"],traits:[{name:"Expert Forgery",desc:"You can duplicate other creatures' handwriting and craftwork. You have advantage on all checks made to produce forgeries or duplicates of existing objects."},{name:"Kenku Training",desc:"You are proficient in your choice of two of the following skills: Acrobatics, Deception, Stealth, and Sleight of Hand."},{name:"Mimicry",desc:"You can mimic sounds you have heard, including voices. A creature that hears the sounds can tell they are imitations with a successful Wisdom (Insight) check opposed by your Charisma (Deception) check."}]},{id:"Kobold",asi:{DEX:2,STR:-2},subrace:null,speed:30,size:"Small",darkvision:60,languages:["Common","Draconic"],traits:[{name:"Darkvision",desc:"You can see in dim light within 60 feet as if it were bright light, and in darkness as if it were dim light."},{name:"Grovel, Cower, and Beg",desc:"As an action on your turn, you can cower pathetically to distract nearby foes. Until the end of your next turn, your allies gain advantage on attack rolls against enemies within 10 feet of you that can see you. Once\u2026"},{name:"Pack Tactics",desc:"You have advantage on an attack roll against a creature if at least one of your allies is within 5 feet of the creature and the ally isn't incapacitated."},{name:"Sunlight Sensitivity",desc:"You have disadvantage on attack rolls and on Wisdom (Perception) checks that rely on sight when you, the target of your attack, or whatever you are trying to perceive is in direct sunlight."}]},{id:"Lizardfolk",asi:{CON:2,WIS:1},subrace:null,speed:30,size:"Medium",darkvision:0,languages:["Common","Draconic"],traits:[{name:"Bite",desc:"You have a fanged maw that you can use to make unarmed strikes. When you hit with it, the strike deals 1d6 + your Strength modifier slashing damage, instead of the bludgeoning damage normal for an unarmed strike."},{name:"Cunning Artisan",desc:"As part of a short rest, you can harvest bone and hide from a slain beast, construct, dragon, monstrosity, or plant creature of size Small or larger to create one of the following items: a shield, a club, a javelin, or\u2026"},{name:"Hold Breath",desc:"You can hold your breath for up to 15 minutes at a time."},{name:"Hunter's Lore",desc:"You gain proficiency with two of the following skills of your choice: Animal Handling, Nature, Perception, Stealth, and Survival."},{name:"Natural Armor",desc:"You have tough, scaly skin. When you aren't wearing armor, your AC is 13 + your Dexterity modifier. You can use your natural armor to determine your AC if the armor you wear would leave you with a lower AC. A shield's\u2026"},{name:"Hungry Jaws",desc:"In battle, you can throw yourself into a vicious feeding frenzy. As a bonus action, you can make a special attack with your bite. If the attack hits, it deals its normal damage, and you gain temporary hit points equal\u2026"}]},{id:"Orc",asi:{STR:2,CON:1,INT:-2},subrace:null,speed:30,size:"Medium",darkvision:60,languages:["Common","Orc"],traits:[{name:"Aggressive",desc:"As a bonus action, you can move up to your speed toward an enemy of your choice that you can see or hear. You must end this move closer to the enemy than you started."},{name:"Menacing",desc:"You are trained in the Intimidation skill."},{name:"Powerful Build",desc:"You count as one size larger when determining your carrying capacity and the weight you can push, drag, or lift."}]},{id:"Tabaxi",asi:{DEX:2,CHA:1},subrace:null,speed:30,size:"Medium",darkvision:60,languages:["Common","Sylvan"],traits:[{name:"Darkvision",desc:"You have a cat's keen senses, especially in the dark. You can see in dim light within 60 feet as if it were bright light, and in darkness as if it were dim light."},{name:"Feline Agility",desc:"Your reflexes and agility allow you to move with a burst of speed. When you move on your turn in combat, you can double your speed until the end of the turn. Once you use this trait, you can't use it again until you\u2026"},{name:"Cat's Claws",desc:"Because of your claws, you have a climbing speed of 20 feet. In addition, your claws are natural weapons, which you can use to make unarmed strikes. If you hit with them, you deal slashing damage equal to 1d4 + your\u2026"},{name:"Cat's Talent",desc:"You have proficiency in the Perception and Stealth skills."}]},{id:"Triton",asi:{STR:1,CON:1,CHA:1},subrace:null,speed:30,size:"Medium",darkvision:0,languages:["Common","Primordial"],traits:[{name:"Amphibious",desc:"You can breathe air and water."},{name:"Control Air and Water",desc:"You can cast fog cloud with this trait. Starting at 3rd level, you can cast gust of wind with it, and starting at 5th level, you can also cast wall of water with it. Once you cast a spell with this trait, you can't\u2026"},{name:"Emissary of the Sea",desc:"You can communicate simple ideas with any beast that has an innate swimming speed. They can understand the meaning of your words, though you have no special ability to understand them in return."},{name:"Guardians of the Depths",desc:"Adapted to even the most extreme ocean depths, you have resistance to cold damage, and you ignore any of the drawbacks caused by a deep, underwater environment."},{name:"Swim",desc:"You have a swimming speed of 30 feet."}]},{id:"Yuan-ti Pureblood",asi:{CHA:2,INT:1},subrace:null,speed:30,size:"Medium",darkvision:60,languages:["Common","Abyssal"],traits:[{name:"Darkvision",desc:"You can see in dim light within 60 feet as if it were bright light, and in darkness as if it were dim light."},{name:"Innate Spellcasting",desc:"You know the poison spray cantrip. At 3rd level, you can cast animal friendship (snakes only) once per day. At 5th level, you can cast suggestion once per day. Charisma is your spellcasting ability for these spells."},{name:"Magic Resistance",desc:"You have advantage on all saving throws against spells and other magical effects."},{name:"Poison Immunity",desc:"You are immune to poison damage and the poisoned condition."}]},{id:"Custom Lineage",asi:{},subrace:null,speed:30,size:"Medium",darkvision:60,languages:["Common","One other of your choice"],traits:[{name:"Ability Score Increase",desc:"One ability score of your choice increases by 2."},{name:"Feat",desc:"You gain one feat of your choice."},{name:"Variable Trait",desc:"You are Medium or Small. You choose one skill in which you gain proficiency. You can choose one of the following: darkvision 60 ft., or proficiency in one skill of your choice."}]},{id:"Gem Dragonborn",asi:{STR:2,CHA:1},subrace:{name:"Amethyst",asi:{}},speed:30,size:"Medium",darkvision:60,languages:["Common","Draconic"],traits:[{name:"Gem Ancestry",desc:"You have a gem dragon ancestor, which determines the damage type of your breath weapon and your psionic ability."},{name:"Breath Weapon",desc:"You can use your action to exhale destructive energy. When you use your breath weapon, each creature in the area must make a saving throw. The DC equals 8 + your Constitution modifier + your proficiency bonus. A\u2026"},{name:"Psionic Mind",desc:"You can send telepathic messages to any creature you can see within 30 feet of you. The creature can understand you only if it knows the language you're using."},{name:"Gem Resistance",desc:"You have resistance to the damage type associated with your gem ancestry."}]},{id:"Dhampir",asi:{},subrace:null,speed:35,size:"Medium",darkvision:60,languages:["Common"],traits:[{name:"Ability Score Increase",desc:"Increase one ability score by 2, and increase a different one by 1, or increase three different scores by 1."},{name:"Darkvision",desc:"You can see in dim light within 60 feet as if it were bright light, and in darkness as if it were dim light."},{name:"Deathless Nature",desc:"You don't need to breathe. You are immune to disease. You have resistance to poison damage, and you have advantage on saving throws against being poisoned."},{name:"Spider Climb",desc:"You have a climbing speed equal to your walking speed. In addition, at 3rd level, you can move up, down, and across vertical surfaces and upside down on ceilings while leaving your hands free."},{name:"Vampiric Bite",desc:"Your fanged bite is a natural weapon, which counts as a simple melee weapon with which you are proficient. You add your Constitution modifier, instead of your Strength modifier, to attack and damage rolls. It deals 1d4\u2026"}]},{id:"Hexblood",asi:{},subrace:null,speed:30,size:"Medium",darkvision:60,languages:["Common","Sylvan"],traits:[{name:"Ability Score Increase",desc:"Increase one ability score by 2, and increase a different one by 1, or increase three different scores by 1."},{name:"Darkvision",desc:"You can see in dim light within 60 feet as if it were bright light, and in darkness as if it were dim light."},{name:"Eerie Token",desc:"As a bonus action, you can harmlessly detach a fingernail, a lock of hair, or one of your teeth. A creature carrying your token has advantage on ability checks made to track you, and you know the token's location and\u2026"},{name:"Hex Magic",desc:"You can cast disguise self and hex with this trait, using Intelligence, Wisdom, or Charisma as your spellcasting ability (choose when you select this race). Once you cast either spell with this trait, you can't cast\u2026"},{name:"Fey Type",desc:"Your creature type is fey, rather than humanoid."}]},{id:"Reborn",asi:{},subrace:null,speed:30,size:"Medium",darkvision:60,languages:["Common"],traits:[{name:"Ability Score Increase",desc:"Increase one ability score by 2, and increase a different one by 1, or increase three different scores by 1."},{name:"Darkvision",desc:"You can see in dim light within 60 feet as if it were bright light, and in darkness as if it were dim light."},{name:"Deathless Nature",desc:"You don't need to sleep, and magic can't put you to sleep. You can finish a long rest in 4 hours if you spend those hours in an inactive, motionless state, during which you retain consciousness. You have advantage on\u2026"},{name:"Knowledge from a Past Life",desc:"You temporarily remember glimpses of the past, perhaps memories of an ancient conflict, long-dead loved ones, or a distant homeland. Whenever you make an ability check that uses a skill, you can roll a d6 immediately\u2026"}]},{id:"Owlin",asi:{},subrace:null,speed:30,size:"Medium",darkvision:120,languages:["Common","One other of your choice"],traits:[{name:"Ability Score Increase",desc:"Increase one ability score by 2, and increase a different one by 1, or increase three different scores by 1."},{name:"Darkvision",desc:"You can see in dim light within 120 feet as if it were bright light, and in darkness as if it were dim light."},{name:"Flight",desc:"You have a flying speed equal to your walking speed. To use this speed, you can't be wearing medium or heavy armor."},{name:"Silent Feathers",desc:"You have proficiency in the Stealth skill."}]},{id:"Verdan",asi:{CON:2,CHA:1},subrace:null,speed:30,size:"Small",darkvision:0,languages:["Common","Goblin","One other of your choice"],traits:[{name:"Black Blood Healing",desc:"The black blood of the verdan is thick and adhesive, aiding in the healing process. When you roll a 1 or 2 on any Hit Die you spend to regain hit points at the end of a short rest, you can reroll the die and must use\u2026"},{name:"Fortune Favors the Verdant",desc:"You can add 1d4 to any ability check you make that uses a skill in which you lack proficiency. You can use this trait a number of times equal to your proficiency bonus, regaining all expended uses when you finish a\u2026"},{name:"Limited Telepathy",desc:"You can telepathically communicate with any creature you can see within 30 feet of you. You don't need to share a language with the creature for it to understand your telepathic utterances, but the creature must be\u2026"},{name:"Telepathic Insight",desc:"Your mind's awareness of others lends you a particular insight into their behavior. You have advantage on Wisdom (Insight) checks to determine whether a creature is lying or telling the truth."}]},{id:"Leonin",asi:{CON:2,STR:1},subrace:null,speed:35,size:"Medium",darkvision:60,languages:["Common","Leonin"],traits:[{name:"Darkvision",desc:"You can see in dim light within 60 feet as if it were bright light, and in darkness as if it were dim light."},{name:"Daunting Roar",desc:"As a bonus action, you can let out an intimidating roar. Each creature of your choice within 10 feet of you must succeed on a Wisdom saving throw (DC equals 8 + your proficiency bonus + your Constitution modifier) or\u2026"},{name:"Hunter's Instincts",desc:"You have proficiency in one of the following skills of your choice: Athletics, Intimidation, Perception, or Survival."},{name:"Pride's Claws",desc:"Your claws are natural weapons, which you can use to make unarmed strikes. If you hit with them, you deal slashing damage equal to 1d4 + your Strength modifier, instead of the bludgeoning damage normal for an unarmed\u2026"}]},{id:"Satyr",asi:{CHA:2,DEX:1},subrace:null,speed:35,size:"Medium",darkvision:0,languages:["Common","Sylvan"],traits:[{name:"Fey",desc:"Your creature type is fey, rather than humanoid."},{name:"Ram",desc:"You can use your head and horns to make unarmed strikes. If you hit with them, you deal bludgeoning damage equal to 1d4 + your Strength modifier."},{name:"Magic Resistance",desc:"You have advantage on saving throws against spells and other magical effects."},{name:"Mirthful Leaps",desc:"Whenever you make a long or high jump, you can roll a d8 and add the number rolled to the number of feet you cover, even when making a standing jump. This extra distance costs movement as normal."},{name:"Reveler",desc:"You have proficiency in the Performance and Persuasion skills, and you have proficiency with one musical instrument of your choice."}]},{id:"Fairy",asi:{},subrace:null,speed:30,size:"Small",darkvision:0,languages:["Common","Sylvan"],traits:[{name:"Ability Score Increase",desc:"Increase one ability score by 2, and increase a different one by 1, or increase three different scores by 1."},{name:"Fey",desc:"Your creature type is fey, rather than humanoid."},{name:"Fairy Flight",desc:"You have a flying speed equal to your walking speed. To use this speed, you can't be wearing medium or heavy armor."},{name:"Fey Magic",desc:"You know the druidcraft cantrip. At 3rd level, you can cast faerie fire once per day. At 5th level, you can cast enlarge/reduce once per day. You choose which version of enlarge/reduce to cast when you cast it\u2026"}]},{id:"Harengon",asi:{},subrace:null,speed:30,size:"Medium",darkvision:0,languages:["Common","One other of your choice"],traits:[{name:"Ability Score Increase",desc:"Increase one ability score by 2, and increase a different one by 1, or increase three different scores by 1."},{name:"Hare-Trigger",desc:"You can add your proficiency bonus to your initiative rolls."},{name:"Lucky Footwork",desc:"When you fail a Dexterity saving throw, you can use your reaction to roll a d4 and add it to the save, potentially turning a failure into a success. You can use this trait a number of times equal to your proficiency\u2026"},{name:"Rabbit Hop",desc:"As a bonus action, you can jump a number of feet equal to five times your proficiency bonus, without provoking opportunity attacks. You can use this trait only if your speed is greater than 0. You can use it a number\u2026"},{name:"Perception Proficiency",desc:"You have proficiency in the Perception skill."}]},{id:"Astral Elf",asi:{DEX:2,INT:1},subrace:null,speed:30,size:"Medium",darkvision:60,languages:["Common","Elvish"],traits:[{name:"Celestial Resistance",desc:"You have resistance to radiant damage."},{name:"Starlight Step",desc:"As a bonus action, you can magically teleport up to 30 feet to an unoccupied space you can see. You can use this trait a number of times equal to your proficiency bonus, and you regain all expended uses when you finish\u2026"},{name:"Astral Fire",desc:"You know the light cantrip. Starting at 3rd level, you can cast the faerie fire spell with this trait. Starting at 5th level, you can also cast the daylight spell. Intelligence is your spellcasting ability for these\u2026"},{name:"Fey Ancestry",desc:"You have advantage on saving throws against being charmed, and magic can't put you to sleep."},{name:"Trance",desc:"You don't need to sleep, and magic can't put you to sleep. You can finish a long rest in 4 hours if you spend those hours in a trancelike meditation, during which you remain conscious."}]},{id:"Autognome",asi:{CON:2,DEX:1},subrace:null,speed:30,size:"Small",darkvision:0,languages:["Common","Gnomish"],traits:[{name:"Built for Purpose",desc:"You were created to perform a specialized function. You gain proficiency in one of the following skill sets: arcana and investigation, athletics and survival, or perception and stealth."},{name:"Armored Casing",desc:"You are encased in a metal shell. While you aren't wearing armor, your base Armor Class is 13 + your Dexterity modifier. You can use a shield and still gain this benefit."},{name:"Cure Mechanism",desc:"The mending cantrip can be cast on you to restore hit points. When mending is cast on you in this way, you regain a number of hit points equal to 2d6 + your proficiency bonus."},{name:"Mechanical Nature",desc:"You are a construct. You are immune to disease and the poisoned condition. You are also immune to poison damage. You don't need to eat, drink, or breathe."},{name:"Sentry's Rest",desc:"When you take a long rest, you must spend at least six hours in an inactive, motionless state, rather than sleeping. In this state, you appear inert, but it doesn't render you unconscious, and you can see and hear as\u2026"}]},{id:"Giff",asi:{STR:2,CON:1},subrace:null,speed:30,size:"Medium",darkvision:0,languages:["Common"],traits:[{name:"Astral Spark",desc:"Your connection to the Astral Plane gives you the ability to deal radiant damage with your unarmed strikes. When you hit with an unarmed strike, you can deal radiant damage instead of bludgeoning damage, and you can\u2026"},{name:"Firearms Mastery",desc:"You have a special affinity for firearms. You are proficient with all firearms. If you have a firearm, you can reload it as a bonus action instead of an action. When you score a critical hit with a firearm, you can\u2026"},{name:"Hippo Build",desc:"You count as one size larger when determining your carrying capacity and the weight you can push, drag, or lift. You have advantage on Strength checks made to push or pull objects."},{name:"Headfirst Charge",desc:"If you move at least 20 feet in a straight line toward a creature and then hit it with a melee weapon attack on the same turn, the target takes an extra 1d6 bludgeoning damage. If the target is a creature, it must\u2026"}]},{id:"Hadozee",asi:{DEX:2,WIS:1},subrace:null,speed:30,size:"Medium",darkvision:0,languages:["Common"],traits:[{name:"Dexterous Feet",desc:"You can use your feet as effectively as your hands. You can use your feet to manipulate objects, and you can use them to cast spells with somatic components if your hands are full."},{name:"Glide",desc:"You have a patagium \u2014 a membrane of skin between your limbs \u2014 that allows you to glide. When you fall at least 10 feet above the ground, you can use your reaction to spread your arms and legs to glide horizontally a\u2026"},{name:"Hadozee Resilience",desc:"The magic of the Feywild has given you a measure of resilience. When you take damage, you can use your reaction to roll a d6. Add your proficiency bonus to the number rolled, and reduce the damage you take by that\u2026"}]},{id:"Plasmoid",asi:{CON:2,DEX:1},subrace:null,speed:30,size:"Medium",darkvision:0,languages:["Common","One other language of your choice"],traits:[{name:"Amorphous",desc:"You can squeeze through a space as narrow as 1 inch wide, provided you are wearing and carrying nothing. You have advantage on ability checks you make to initiate or escape a grapple."},{name:"Darkvision",desc:"You can see in dim light within 60 feet as if it were bright light and in darkness as if it were dim light. You discern colors in that darkness only as shades of gray."},{name:"Hold Breath",desc:"You can hold your breath for 1 hour."},{name:"Natural Resilience",desc:"You have resistance to acid and poison damage, and you have advantage on saving throws against being poisoned."},{name:"Shape Self",desc:"As a bonus action, you can reshape your body to give yourself a head, one or two arms, one or two legs, or some other form. You can use this trait to appear as a member of another humanoid race, though you are still\u2026"}]},{id:"Thri-kreen",asi:{DEX:2,WIS:1},subrace:null,speed:30,size:"Medium",darkvision:60,languages:["Common","Thri-kreen"],traits:[{name:"Chameleon Carapace",desc:"While you aren't wearing armor, your carapace gives you a base AC of 13 + your Dexterity modifier. As an action, you can change the color of your carapace to match the color and texture of your surroundings, giving you\u2026"},{name:"Darkvision",desc:"You can see in dim light within 60 feet as if it were bright light and in darkness as if it were dim light. You discern colors in that darkness only as shades of gray."},{name:"Secondary Arms",desc:"You have two slightly smaller arms below your primary pair of arms. The secondary arms can manipulate objects, open doors, and wield light weapons. They can't wield shields or weapons with the two-handed property."},{name:"Sleepless",desc:"You do not require sleep and can remain conscious during a long rest. You still need to refrain from strenuous activity to gain the benefit of a long rest."},{name:"Thri-kreen Telepathy",desc:"Without the aid of magic, you can't use telepathy to communicate with a creature unless the creature also has telepathy. You can communicate telepathically with any creature within 120 feet that also has telepathy."}]}],c0=[{id:"Barbarian",hitDie:12,primary:["Strength"],saves:["STR","CON"],armor:["Light armor","Medium armor","Shields"],weapons:["Simple weapons","Martial weapons"],tools:[],skills:{count:2,from:["Animal Handling","Athletics","Intimidation","Nature","Perception","Survival"]},features:[{name:"Rage",desc:"Bonus action: enter rage for 1 minute. Advantage on STR checks and saves; +2 melee weapon damage (+3 at 9th, +4 at 16th); resistance to bludgeoning, piercing, and slashing damage. Cannot cast or concentrate on spells\u2026"},{name:"Unarmored Defense",desc:"AC = 10 + DEX modifier + CON modifier while not wearing armor."}],spellAbility:null,spellNote:null,equipment:["Greataxe or any martial melee weapon","Two handaxes or any simple weapon","Explorer's pack","Four javelins"]},{id:"Fighter",hitDie:10,primary:["Strength","Dexterity"],saves:["STR","CON"],armor:["All armor","Shields"],weapons:["Simple weapons","Martial weapons"],tools:[],skills:{count:2,from:["Acrobatics","Animal Handling","Athletics","History","Insight","Intimidation","Perception","Survival"]},features:[{name:"Fighting Style",desc:"Choose one: Archery (+2 ranged attack), Defense (+1 AC while wearing armor), Dueling (+2 damage with one-handed weapon in one hand, no other weapon), Great Weapon Fighting (reroll 1s and 2s on damage with two-handed or\u2026"},{name:"Second Wind",desc:"Bonus action: regain 1d10 + fighter level HP. Once per short rest."}],spellAbility:null,spellNote:null,equipment:["Chain mail or leather armor and longbow with 20 arrows","Martial weapon and shield or two martial weapons","Light crossbow with 20 bolts or two handaxes","Dungeoneer's pack or explorer's pack"]},{id:"Monk",hitDie:8,primary:["Dexterity","Wisdom"],saves:["STR","DEX"],armor:[],weapons:["Simple weapons","Shortswords"],tools:["One artisan's tool or one musical instrument"],skills:{count:2,from:["Acrobatics","Athletics","History","Insight","Religion","Stealth"]},features:[{name:"Unarmored Defense",desc:"AC = 10 + DEX modifier + WIS modifier while not wearing armor or using a shield."},{name:"Martial Arts",desc:"While unarmed or using monk weapons (shortswords, simple melee weapons without two-handed/heavy), use DEX instead of STR for attacks, roll a martial arts die (1d4 at 1st, 1d6 at 5th, 1d8 at 11th, 1d10 at 17th) for\u2026"}],spellAbility:null,spellNote:null,equipment:["Shortsword or any simple weapon","Dungeoneer's pack or explorer's pack","10 darts"]},{id:"Paladin",hitDie:10,primary:["Strength","Charisma"],saves:["WIS","CHA"],armor:["All armor","Shields"],weapons:["Simple weapons","Martial weapons"],tools:[],skills:{count:2,from:["Athletics","Insight","Intimidation","Medicine","Persuasion","Religion"]},features:[{name:"Divine Sense",desc:"Action: detect celestials, fiends, and undead within 60 ft. Also detect consecrated/desecrated places/objects. Uses equal to 1 + CHA modifier per long rest."},{name:"Lay on Hands",desc:"Pool of HP equal to 5 \xD7 paladin level. Touch a creature as an action to restore HP from the pool. Alternatively, expend 5 HP to cure one disease or neutralize one poison."}],spellAbility:"Charisma",spellNote:"Spellcasting begins at 2nd level. Focus: holy symbol.",equipment:["Martial weapon and shield or two martial weapons","Five javelins or any simple melee weapon","Priest's pack or explorer's pack","Chain mail and a holy symbol"]},{id:"Ranger",hitDie:10,primary:["Dexterity","Wisdom"],saves:["STR","DEX"],armor:["Light armor","Medium armor","Shields"],weapons:["Simple weapons","Martial weapons"],tools:[],skills:{count:3,from:["Animal Handling","Athletics","Insight","Investigation","Nature","Perception","Stealth","Survival"]},features:[{name:"Favored Enemy",desc:"Choose a type of favored enemy: aberrations, beasts, celestials, constructs, dragons, elementals, fey, fiends, giants, monstrosities, oozes, plants, or undead. Gain advantage on Survival checks to track them and\u2026"},{name:"Natural Explorer",desc:"Choose a favored terrain: arctic, coast, desert, forest, grassland, mountain, swamp, or Underdark. While traveling there for 1 hour+: difficult terrain doesn't slow group, can't become lost, remain alert while\u2026"}],spellAbility:"Wisdom",spellNote:"Spellcasting begins at 2nd level. Focus: druidic focus.",equipment:["Scale mail or leather armor","Two shortswords or two simple melee weapons","Dungeoneer's pack or explorer's pack","Longbow with quiver of 20 arrows"]},{id:"Rogue",hitDie:8,primary:["Dexterity"],saves:["DEX","INT"],armor:["Light armor"],weapons:["Simple weapons","Hand crossbows","Longswords","Rapiers","Shortswords"],tools:["Thieves' tools"],skills:{count:4,from:["Acrobatics","Athletics","Deception","Insight","Intimidation","Investigation","Perception","Performance","Persuasion","Sleight of Hand","Stealth"]},features:[{name:"Sneak Attack",desc:"Once per turn, deal extra damage when you hit with a finesse or ranged weapon and have advantage, or another enemy of the target is within 5 ft. Extra damage: 1d6 at 1st, 2d6 at 3rd, 3d6 at 5th, 4d6 at 7th, 5d6 at 9th\u2026"},{name:"Thieves' Cant",desc:"Secret mix of dialect, jargon, and code allowing you to hide messages in conversation. Only creatures that know Thieves' Cant understand it. Also includes secret signs and symbols."}],spellAbility:null,spellNote:null,equipment:["Rapier or shortsword","Shortbow with quiver of 20 arrows or shortsword","Burglar's pack, dungeoneer's pack, or explorer's pack","Leather armor, two daggers, and thieves' tools"]},{id:"Bard",hitDie:8,primary:["Charisma"],saves:["DEX","CHA"],armor:["Light armor"],weapons:["Simple weapons","Hand crossbows","Longswords","Rapiers","Shortswords"],tools:["Three musical instruments of your choice"],skills:{count:3,from:["Acrobatics","Animal Handling","Arcana","Athletics","Deception","History","Insight","Intimidation","Investigation","Medicine","Nature","Perception","Performance","Persuasion","Religion","Sleight of Hand","Stealth","Survival"]},features:[{name:"Spellcasting",desc:"You know spells from the bard spell list. Charisma is your spellcasting ability. You can use a musical instrument as a spellcasting focus."},{name:"Bardic Inspiration",desc:"As a bonus action, give one creature a Bardic Inspiration die (d6). The creature can roll the die and add the number to one ability check, attack roll, or saving throw. Die lasts 10 min or until used. Uses = CHA mod\u2026"}],spellAbility:"Charisma",spellNote:"Cantrips known: 2. 1st-level slots: 2. Focus: musical instrument.",equipment:["(a) Rapier, (b) Longsword, or (c) any simple weapon","(a) Diplomat's Pack or (b) Entertainer's Pack","(a) Lute or (b) any musical instrument","Leather armor and a dagger"]},{id:"Cleric",hitDie:8,primary:["Wisdom"],saves:["WIS","CHA"],armor:["Light armor","Medium armor","Shields"],weapons:["Simple weapons"],tools:[],skills:{count:2,from:["History","Insight","Medicine","Persuasion","Religion"]},features:[{name:"Spellcasting",desc:"You prepare cleric spells from the cleric spell list. Wisdom is your spellcasting ability. You can use a holy symbol as a spellcasting focus."},{name:"Divine Domain",desc:"Choose a Divine Domain subclass. You gain domain spells and features at 1st, 2nd, 6th, 8th, and 17th levels."}],spellAbility:"Wisdom",spellNote:"Cantrips known: 3. 1st-level slots: 2. Focus: holy symbol.",equipment:["(a) Mace or (b) Warhammer (if proficient)","(a) Scale mail, (b) Leather armor, or (c) Chain mail (if proficient)","(a) Light crossbow and 20 bolts or (b) any simple weapon","(a) Priest's Pack or (b) Explorer's Pack","Shield and holy symbol"]},{id:"Druid",hitDie:8,primary:["Wisdom"],saves:["INT","WIS"],armor:["Light armor","Medium armor","Shields (nonmetal)"],weapons:["Clubs","Daggers","Darts","Javelins","Maces","Quarterstaffs","Scimitars","Sickles","Slings","Spears"],tools:["Herbalism kit"],skills:{count:2,from:["Arcana","Animal Handling","Insight","Medicine","Nature","Perception","Religion","Survival"]},features:[{name:"Spellcasting",desc:"You prepare druid spells from the druid spell list. Wisdom is your spellcasting ability. You can use a druidic focus as a spellcasting focus."},{name:"Druidic",desc:"You know Druidic, a secret language. You can speak it and leave hidden messages. Others who know Druidic can spot and read such messages automatically."}],spellAbility:"Wisdom",spellNote:"Cantrips known: 2. 1st-level slots: 2. Focus: druidic focus.",equipment:["(a) Wooden shield or (b) any simple weapon","(a) Scimitar or (b) any simple melee weapon","Leather armor, explorer's pack, and druidic focus"]},{id:"Sorcerer",hitDie:6,primary:["Charisma"],saves:["CON","CHA"],armor:[],weapons:["Daggers","Darts","Slings","Quarterstaffs","Light crossbows"],tools:[],skills:{count:2,from:["Arcana","Deception","Insight","Intimidation","Persuasion","Religion"]},features:[{name:"Spellcasting",desc:"You know spells from the sorcerer spell list. Charisma is your spellcasting ability. You can use an arcane focus as a spellcasting focus."},{name:"Sorcerous Origin",desc:"Choose a Sorcerous Origin subclass which grants features at 1st level and again at 6th, 14th, and 18th levels."}],spellAbility:"Charisma",spellNote:"Cantrips known: 4. 1st-level slots: 2. Focus: arcane focus.",equipment:["(a) Light crossbow and 20 bolts or (b) any simple weapon","(a) Component pouch or (b) Arcane focus","(a) Dungeoneer's Pack or (b) Explorer's Pack","Two daggers"]},{id:"Warlock",hitDie:8,primary:["Charisma"],saves:["WIS","CHA"],armor:["Light armor"],weapons:["Simple weapons"],tools:[],skills:{count:2,from:["Arcana","Deception","History","Intimidation","Investigation","Nature","Religion"]},features:[{name:"Spellcasting (Pact Magic)",desc:"You know spells from the warlock spell list. Charisma is your spellcasting ability. You can use an arcane focus as a spellcasting focus. Your pact magic slots recharge on a short rest. You always cast warlock spells at\u2026"},{name:"Otherworldly Patron",desc:"Choose an Otherworldly Patron subclass which grants features at 1st level and again at 6th, 10th, and 14th levels."}],spellAbility:"Charisma",spellNote:"Cantrips known: 2. 1st-level slots: 1. Pact magic slots recharge on a short rest. Focus: arcane focus.",equipment:["(a) Light crossbow and 20 bolts or (b) any simple weapon","(a) Component pouch or (b) Arcane focus","(a) Scholar's Pack or (b) Dungeoneer's Pack","Simple weapon, leather armor, two daggers"]},{id:"Wizard",hitDie:6,primary:["Intelligence"],saves:["INT","WIS"],armor:[],weapons:["Daggers","Darts","Slings","Quarterstaffs","Light crossbows"],tools:[],skills:{count:2,from:["Arcana","History","Insight","Investigation","Medicine","Religion"]},features:[{name:"Spellcasting",desc:"You prepare wizard spells from your spellbook. Intelligence is your spellcasting ability. You can use an arcane focus as a spellcasting focus. You start with a spellbook containing six 1st-level wizard spells of your\u2026"},{name:"Arcane Recovery",desc:"Once per day during a short rest, recover expended spell slots with a combined level equal to or less than half your wizard level (rounded up). No slot can be 6th level or higher."}],spellAbility:"Intelligence",spellNote:"Cantrips known: 3. 1st-level slots: 2. Focus: arcane focus.",equipment:["(a) Quarterstaff or (b) Dagger","(a) Component pouch or (b) Arcane focus","(a) Scholar's Pack or (b) Explorer's Pack","Spellbook"]},{id:"Artificer",hitDie:8,primary:["Intelligence"],saves:["CON","INT"],armor:["Light armor","Medium armor","Shields"],weapons:["Simple weapons"],tools:["Thieves' tools","Tinker's tools","One artisan tool of your choice"],skills:{count:3,from:["Arcana","History","Investigation","Medicine","Nature","Perception","Sleight of Hand"]},features:[{name:"Spellcasting",desc:"You prepare artificer spells from the artificer spell list. Intelligence is your spellcasting ability. You can use a spellcasting focus (any artisan tool or an infused item) for your spells. You can use any weapon or\u2026"},{name:"Magical Tinkering",desc:"As an action, touch a Tiny nonmagical object and impart one property: shed bright light 5 ft (+ dim 5 ft), play a recorded message up to 6 seconds, emit an odor, or create a static visual effect. You can have a number\u2026"}],spellAbility:"Intelligence",spellNote:"Cantrips known: 2. 1st-level slots: 2. Focus: artisan tool or infused item.",equipment:["(a) Studded leather armor or (b) Scale mail","(a) Thieves' tools or (b) Any artisan tool","(a) Light crossbow and 20 bolts or (b) Two handaxes","(a) Dungeoneer's Pack or (b) Explorer's Pack","Two daggers"]}],h0={Cleric:[{id:"Knowledge Domain",name:"Knowledge Domain",flavor:"Clerics of the Knowledge Domain value learning and understanding above all.",feature:{name:"Blessings of Knowledge",desc:"Gain proficiency in two of: Arcana, History, Nature, Religion. Gain proficiency with two languages. Double proficiency bonus for checks with chosen skills."}},{id:"Life Domain",name:"Life Domain",flavor:"Clerics of the Life Domain are devoted to preserving life and healing the wounded.",feature:{name:"Disciple of Life",desc:"Whenever you use a spell of 1st level or higher to restore hit points, the creature regains additional HP equal to 2 + the spell's level."}},{id:"Light Domain",name:"Light Domain",flavor:"Clerics of the Light Domain wield fire, radiance, and the power of dawn.",feature:{name:"Bonus Cantrip",desc:"Learn the light cantrip if you don't already know it. It counts as a cleric cantrip for you."}},{id:"Nature Domain",name:"Nature Domain",flavor:"Clerics of the Nature Domain protect the wild places and harness natural forces.",feature:{name:"Acolyte of Nature",desc:"Learn one druid cantrip of your choice. Gain proficiency in one of: Animal Handling, Nature, or Survival."}},{id:"Tempest Domain",name:"Tempest Domain",flavor:"Clerics of the Tempest Domain channel the wrath of storms and the fury of the sea.",feature:{name:"Bonus Proficiencies",desc:"Gain proficiency with martial weapons and heavy armor."}},{id:"Trickery Domain",name:"Trickery Domain",flavor:"Clerics of the Trickery Domain use deception and illusion to achieve their goals.",feature:{name:"Blessing of the Trickster",desc:"As an action, touch one willing creature. It has advantage on Dexterity (Stealth) checks for 1 hour. Usable once per long rest (or expend a spell slot)."}},{id:"War Domain",name:"War Domain",flavor:"Clerics of the War Domain are battle-hardened warriors who fight for their deity's cause.",feature:{name:"Bonus Proficiencies",desc:"Gain proficiency with martial weapons and heavy armor."}},{id:"Forge Domain",name:"Forge Domain",flavor:"Clerics of the Forge Domain master the art of creation and imbuing metal with divine power.",feature:{name:"Bonus Proficiencies",desc:"Gain proficiency with heavy armor and smith's tools."}},{id:"Grave Domain",name:"Grave Domain",flavor:"Clerics of the Grave Domain guard the boundary between life and death, opposing undeath.",feature:{name:"Circle of Mortality",desc:"You learn the spare the dying cantrip with a range of 30 ft. When you cast a spell to heal a creature at 0 HP, treat any die rolled as its maximum. You have advantage on saves against diseases and being poisoned."}},{id:"Order Domain",name:"Order Domain",flavor:"Clerics of the Order Domain uphold law, discipline, and societal structure.",feature:{name:"Bonus Proficiency",desc:"Gain proficiency with heavy armor."}},{id:"Peace Domain",name:"Peace Domain",flavor:"Clerics of the Peace Domain foster harmony and unity among allies.",feature:{name:"Implement of Peace",desc:"Gain proficiency in Insight, Performance, or Persuasion. When you cast a spell that restores HP, the target also gains temporary HP equal to your proficiency bonus."}},{id:"Twilight Domain",name:"Twilight Domain",flavor:"Clerics of the Twilight Domain operate in the boundary between light and darkness.",feature:{name:"Bonus Proficiencies",desc:"Gain proficiency with martial weapons and heavy armor."}},{id:"Death Domain",name:"Death Domain",flavor:"Clerics of the Death Domain harness necromantic power and wield the energy of death.",feature:{name:"Bonus Proficiency",desc:"Gain proficiency with martial weapons."}}],Sorcerer:[{id:"Draconic Bloodline",name:"Draconic Bloodline",flavor:"Sorcerers with draconic bloodline ancestry gain the power and resilience of dragons.",feature:{name:"Dragon Ancestor",desc:"Choose one dragon type (Black/Copper: Acid, Blue/Bronze: Lightning, Brass/Gold/Red: Fire, Green: Poison, Silver/White: Cold). You gain a +1 bonus on CHA checks with dragons of that type, and speak Draconic."}},{id:"Wild Magic",name:"Wild Magic",flavor:"Sorcerers with wild magic have unpredictable, chaotic power that surges unpredictably.",feature:{name:"Wild Magic Surge",desc:"Immediately after you cast a sorcerer spell of 1st level or higher, the DM can have you roll a d20. On a 1, roll on the Wild Magic Surge table to create a random effect."}},{id:"Divine Soul",name:"Divine Soul",flavor:"Sorcerers with a divine soul draw power from celestial or divine sources.",feature:{name:"Divine Magic",desc:"Learn the thaumaturgy cantrip. When you select a spell during a level-up, you can choose from the cleric spell list in addition to the sorcerer spell list. It counts as a sorcerer spell for you."}},{id:"Shadow Magic",name:"Shadow Magic",flavor:"Sorcerers with shadow magic draw power from the Shadowfell and darkness itself.",feature:{name:"Eyes of the Dark",desc:"You have 120 ft darkvision. When you reach 3rd level, you can cast darkness once per long rest by spending 2 sorcery points. CHA is your spellcasting ability."}},{id:"Storm Sorcery",name:"Storm Sorcery",flavor:"Sorcerers with storm sorcery command the power of wind, thunder, and lightning.",feature:{name:"Wind Speaker",desc:"You know the Primordial language."}},{id:"Aberrant Mind",name:"Aberrant Mind",flavor:"Sorcerers with aberrant mind powers are touched by alien entities from the Far Realm.",feature:{name:"Psionic Spells",desc:"Learn additional spells at levels 1, 3, 5, 7, and 9 that don't count against your spells known. You can cast these without verbal components by spending sorcery points equal to the spell's level."}},{id:"Clockwork Soul",name:"Clockwork Soul",flavor:"Sorcerers with clockwork soul powers are connected to the plane of Mechanus and cosmic order.",feature:{name:"Clockwork Magic",desc:"Learn additional spells at levels 1, 3, 5, 7, and 9 that don't count against your spells known. These are always prepared and can be replaced with other abjuration or transmutation spells."}}],Warlock:[{id:"The Archfey",name:"The Archfey",flavor:"Warlocks who serve the capricious and powerful lords of the Feywild.",feature:{name:"Fey Presence",desc:"As an action, each creature in a 10 ft cube originating from you makes a WIS save or is charmed or frightened (your choice) by you until end of your next turn. Usable once per short or long rest."}},{id:"The Fiend",name:"The Fiend",flavor:"Warlocks who serve the dark powers of the Lower Planes.",feature:{name:"Dark One's Blessing",desc:"When you reduce a hostile creature to 0 HP, you gain temporary HP equal to your CHA mod + warlock level."}},{id:"The Great Old One",name:"The Great Old One",flavor:"Warlocks who serve unfathomable entities from the Far Realm.",feature:{name:"Awakened Mind",desc:"You can telepathically speak to any creature within 30 ft that you can see. The creature doesn't need to share a language, but must be able to understand at least one."}},{id:"The Celestial",name:"The Celestial",flavor:"Warlocks who serve the forces of the Upper Planes and radiant power.",feature:{name:"Bonus Cantrips",desc:"Learn light and sacred flame. They count as warlock cantrips for you."}},{id:"The Hexblade",name:"The Hexblade",flavor:"Warlocks who serve mysterious entities from the Shadowfell that forge weapons.",feature:{name:"Hexblade's Curse",desc:"As a bonus action, choose one creature you can see within 30 ft. You gain: bonus damage equal to proficiency bonus on damage rolls against it; attacks crit on 19-20; if it dies, regain HP equal to warlock level + CHA mod. Usable once per short or long rest. Lasts until target dies or you use it\u2026"}},{id:"The Fathomless",name:"The Fathomless",flavor:"Warlocks who serve the deep and alien powers of the ocean depths.",feature:{name:"Tentacle of the Deeps",desc:"As a bonus action, create a 10 ft spectral tentacle within 60 ft that lasts for 1 minute. When you cast a spell on your turn, you can direct the tentacle to make a melee spell attack against one creature within 10 ft of it (1d8 cold damage, CHA mod times per long rest). At 10th level, damage\u2026"}},{id:"The Genie",name:"The Genie",flavor:"Warlocks who serve the noble genies of the Elemental Planes.",feature:{name:"Genie's Vessel",desc:"Choose a genie type (Dao: bludgeoning/earth, Djinni: thunder/wind, Efreeti: fire, Marid: cold/water). Gain a vessel (Tiny object). While inside, you're safe from harm and can rest. When you cast a spell through the vessel, add proficiency bonus to one damage roll of that spell of the chosen type."}},{id:"The Undying",name:"The Undying",flavor:"Warlocks who serve undying beings that have conquered death itself.",feature:{name:"Among the Dead",desc:"Learn the spare the dying cantrip. You have advantage on saves against diseases and being poisoned. Undead have disadvantage on attacks against you for their first attack each combat."}}]},u0=[{id:"Acolyte",skills:["Insight","Religion"],tools:[],languages:2,equipment:["A prayer book","5 sticks of incense","vestments","common clothes","pouch with 15 gp"],feature:{name:"Shelter of the Faithful",desc:"As an acolyte, you command the respect of those who share your faith, and you can perform the religious ceremonies of your deity. You and your adventuring companions can expect to receive free healing, care, and food at a temple, shrine, or other established\u2026"}},{id:"Charlatan",skills:["Deception","Sleight of Hand"],tools:["Disguise kit","Forgery kit"],languages:0,equipment:["A set of fine clothes","a disguise kit","tools of the con","pouch with 15 gp"],feature:{name:"False Identity",desc:"You have created a second identity that includes documentation, established acquaintances, and disguises allowing you to assume that persona. You can forge documents including official papers and personal letters, as long as you have seen an example of the\u2026"}},{id:"Criminal",skills:["Deception","Stealth"],tools:["Thieves' tools","one type of gaming set"],languages:0,equipment:["A crowbar","a set of dark common clothes including a hood","pouch with 15 gp"],feature:{name:"Criminal Contact",desc:"You have a reliable and trustworthy contact who acts as your liaison to a network of other criminals. You know how to get messages to and from your contact, even over great distances; specifically, you know the local messengers, corrupt caravan masters, and\u2026"}},{id:"Entertainer",skills:["Acrobatics","Performance"],tools:["Disguise kit","one type of musical instrument"],languages:0,equipment:["A musical instrument (one of your choice)","the favor of an admirer","a costume","pouch with 15 gp"],feature:{name:"By Popular Demand",desc:"You can always find a place to perform, usually in an inn or tavern but possibly with a circus, at a theater, or even in a noble's court. At such a place, you receive free lodging and food of a modest or comfortable standard, as long as you perform each\u2026"}},{id:"Folk Hero",skills:["Animal Handling","Survival"],tools:["One type of artisan's tools","land vehicles"],languages:0,equipment:["A set of artisan's tools (one of your choice)","a shovel","an iron pot","a set of common clothes","pouch with 10 gp"],feature:{name:"Rustic Hospitality",desc:"Since you come from the ranks of the common folk, you fit in among them with ease. You can find a place to hide, rest, or recuperate among commoners, unless you have shown yourself to be a danger to them. They will shield you from the law or anyone\u2026"}},{id:"Guild Artisan",skills:["Insight","Persuasion"],tools:["One type of artisan's tools"],languages:1,equipment:["A set of artisan's tools (one of your choice)","a letter of introduction","a set of traveler's clothes","pouch with 15 gp"],feature:{name:"Guild Membership",desc:"As an established and respected member of a guild, you can rely on certain benefits that membership provides. Your fellow guild members will provide you with lodging and food if necessary, and pay for your funeral if needed. In some cities and towns, a\u2026"}},{id:"Hermit",skills:["Medicine","Religion"],tools:["Herbalism kit"],languages:1,equipment:["A scroll case stuffed full of notes from your studies","a blanket","a set of common clothes","an herbalism kit","pouch with 5 gp"],feature:{name:"Discovery",desc:"The quiet seclusion of your extended hermitage gave you access to a unique and powerful discovery. The exact nature of this revelation depends on the nature of your seclusion. Work with your DM to determine the details of your discovery and its impact on the\u2026"}},{id:"Noble",skills:["History","Persuasion"],tools:["One type of gaming set"],languages:1,equipment:["A set of fine clothes","a signet ring","a scroll of pedigree","pouch with 25 gp"],feature:{name:"Position of Privilege",desc:"Thanks to your noble birth, people are inclined to think the best of you. You are welcome in high society, and people assume you have the right to be wherever you are. You can secure an audience with a local noble if you need to."}},{id:"Outlander",skills:["Athletics","Survival"],tools:["One type of musical instrument"],languages:1,equipment:["A staff","a hunting trap","a trophy from an animal you killed","a set of traveler's clothes","pouch with 10 gp"],feature:{name:"Wanderer",desc:"You have an excellent memory for maps and geography, and you can always recall the general layout of terrain, settlements, and other features around you. In addition, you can find food and fresh water for yourself and up to five other people each day,\u2026"}},{id:"Sage",skills:["Arcana","History"],tools:[],languages:2,equipment:["A bottle of black ink","a quill","a small knife","a letter from a dead colleague posing a question you have not yet been able to answer","a set of common clothes","pouch with 10 gp"],feature:{name:"Researcher",desc:"When you attempt to learn or recall a piece of lore, if you do not have that information in your records, you often know where and from whom you can obtain it. Usually, this information comes from a library, scriptorium, university, or a sage or other\u2026"}},{id:"Sailor",skills:["Athletics","Perception"],tools:["Navigator's tools","water vehicles"],languages:0,equipment:["A bilge hook","50 feet of silk rope","a lucky charm","a set of common clothes","pouch with 10 gp"],feature:{name:"Ship's Passage",desc:"When you need to, you can secure free passage on a sailing ship for yourself and your adventuring companions. You might sail on the ship you served on, or another ship you have good relations with. Because you're calling in a favor, you can't be certain of\u2026"}},{id:"Soldier",skills:["Athletics","Intimidation"],tools:["Land vehicles","one type of gaming set"],languages:0,equipment:["An insignia of rank","a trophy taken from a fallen enemy","a dagger","a set of common clothes","pouch with 10 gp"],feature:{name:"Military Rank",desc:"You have a military rank from your career as a soldier. Soldiers loyal to your former military organization still recognize your authority and influence, and they defer to you if they are of a lower rank. You can invoke your rank to exert influence over\u2026"}},{id:"Urchin",skills:["Sleight of Hand","Stealth"],tools:["Disguise kit","thieves' tools"],languages:0,equipment:["A small knife","a map of the city you grew up in","a pet mouse","a token to remember your parents by","a set of common clothes","pouch with 10 gp"],feature:{name:"City Secrets",desc:"You know the secret patterns and flow to cities and can find passages through the urban sprawl that others would miss. When you are not in combat, you (and companions you lead) can travel between any two locations in the city twice as fast as your speed\u2026"}}],d0={str:{name:"Strength",abbr:"STR",affects:["Melee weapon attacks","Athletics checks","Carrying capacity","Grapple/shove attempts"]},dex:{name:"Dexterity",abbr:"DEX",affects:["Ranged weapon attacks","Finesse weapon attacks","AC (with light/medium armor)","Dexterity saves","Initiative","Acrobatics/Sleight of Hand/Stealth checks"]},con:{name:"Constitution",abbr:"CON",affects:["Hit points per level","Constitution saves","Endurance checks"]},int:{name:"Intelligence",abbr:"INT",affects:["Wizard/Artificer spellcasting","Arcana/History/Investigation/Nature/Religion checks","Number of languages known"]},wis:{name:"Wisdom",abbr:"WIS",affects:["Cleric/Druid/Ranger spellcasting","Animal Handling/Insight/Medicine/Perception/Survival checks","Wisdom saves against charm/fear"]},cha:{name:"Charisma",abbr:"CHA",affects:["Bard/Sorcerer/Paladin/Warlock spellcasting","Deception/Intimidation/Performance/Persuasion checks","Charisma saves against possession/domination"]}},f0={"Burglar's Pack":["Backpack","1,000 ball bearings","10 feet of string","Bell","5 candles","Crowbar","Hammer","10 pitons","Quiver with 20 arrows","Roll of parchment","Soap","Waterskin","Rations (5 days)"],"Diplomat's Pack":["Chest","2 cases for maps and scrolls","5 candles","5 sticks of incense","Vestments","2 yards of cloth (fine)","Roll of parchment","Ink and ink pen","Lamp","2 flasks of oil","5 sheets of paper","Vial of perfume","Sealing wax","Soap"],"Dungeoneer's Pack":["Backpack","Crowbar","Hammer","10 pitons","10 torches","Tinderbox","10 days of rations","Waterskin","50 feet of hempen rope"],"Entertainer's Pack":["Backpack","Bedroll","2 costumes","5 candles","5 days of rations","Waterskin","Disguise kit"],"Explorer's Pack":["Backpack","Bedroll","Mess kit","Tinderbox","10 torches","10 days of rations","Waterskin","50 feet of hempen rope"],"Priest's Pack":["Backpack","Blanket","10 candles","Vestments","2 blocks of incense","Censer","Vestments","2 days of rations","Waterskin"],"Scholar's Pack":["Backpack","Book of lore","Bottle of ink","Ink pen","10 sheets of parchment","Little bag of sand","Small knife"]},p0={Human:"Short-lived and stubborn, humans burn bright against the long dark. Ambition is their inheritance.",Elf:"The ash-years thinned the elven lines. What remains remembers everything, and forgives nothing.",Dwarf:"Stone remembers, and so do dwarves. They hold grudges the way mountains hold ore.",Halfling:"The small folk outlive empires. Luck, they say, is just another kind of armor.","Half-Orc":"Born of rage and ruin, half-orcs carve their worth into the world with iron patience.",Tiefling:"An infernal debt, written in blood and horn. Every tiefling pays \u2014 or makes the world pay.",Dragonborn:"The blood of dead dragons thins with every generation. Yours still remembers fire.",Gnome:"Curiosity is a slow poison. Gnomes drink it daily and call it living.","Half-Elf":"Two worlds, no home. Half-elves inherit every war and none of the spoils.",Aarakocra:"Sky-born, storm-marked. The ground feels like a cage with no bars.",Genasi:"An elemental debt collects interest in your veins \u2014 earth, flame, wave, or wind.",Goliath:"The mountains ate your ancestors. You intend to return the favor.","Deep Gnome":"You were born where the light is not. Your eyes settled the argument.",Aasimar:"A celestial ember burns behind your ribs. It keeps score.",Bugbear:"Long arms, longer grudges. The dark taught you to strike first.",Firbolg:"The forests fell, and you fell with them. What grew back answers to you.",Goblin:"Small, sharp, and numbered. You outlived your whole warband \u2014 ask why.",Hobgoblin:"Discipline is the only god that never died. You march for it still.",Kenku:"Your voice was the price. Now you speak in stolen echoes.",Kobold:"Weak alone, lethal in packs. You are the pack now.",Lizardfolk:"The swamp remembers the empire that burned. So do you, coldly.",Orc:"Rage is an heirloom. You carry it like a blade you are learning to sheathe.",Tabaxi:"Curiosity killed the cat \u2014 several times. You have answers left.",Triton:"The drowned courts sent you ashore as a warning. Nobody listened.","Yuan-ti Pureblood":"Serpent blood, patient venom. You smile like something with all the time in the world.","Custom Lineage":"Whatever you were, the Ash took it. What survived is yours to name.","Gem Dragonborn":"A psionic choir hums in your skull. Sometimes it sings back.",Dhampir:"The grave wanted you and settled for half. Thirst is a quiet roommate.",Hexblood:"A witch's bargain runs in your blood \u2014 a debt written in crow-feathers and thread.",Reborn:"You died. It did not take. The gap where life used to be itches.",Owlin:"Silent wings, sleepless eyes. You collect secrets nobody knows they dropped.",Verdan:"Your people are new, small, and running. You ran toward the fire instead.",Leonin:"Pride ate the prides. You carry the last roar in your chest.",Satyr:"The revel ended centuries ago. You still hear the music, faintly, behind the ash.",Fairy:"Small and spectral, born of fading borders. Doors open for you that should not.",Harengon:"Luck rabbits through your blood. You were born mid-leap and never landed.","Astral Elf":"You walked the silver void and came back \u2014 older, quieter, lit from within.",Autognome:"Clockwork heart, gnomish hands. You wind yourself each morning and pretend not to.",Giff:"Hippo-built, cannon-raised. You are what survived the shipwreck.",Hadozee:"The rigging raised you. You glide on grief and salt.",Plasmoid:"You have no bones and fewer obligations. Your shape is a negotiation.","Thri-kreen":"Four arms, no sleep, a taste for the unspoiled. The clutch speaks in clicks."},Dd={Fighter:{flavor:"Steel discipline. You are the wall the dark breaks against.",sigil:"sword"},Wizard:{flavor:"You read the letters the world was written in \u2014 and rewrite them.",sigil:"eye"},Rogue:{flavor:"The quiet knife, the picked lock, the vanishing act. You are the unfair fight.",sigil:"dagger"},Cleric:{flavor:"A lantern against the long night. Your god speaks; the dead listen.",sigil:"flame"},Sorcerer:{flavor:"Magic does not obey you. It sleeps in your blood \u2014 and sometimes wakes hungry.",sigil:"spark"},Warlock:{flavor:"You signed. Now something old and patient owns a piece of your shadow.",sigil:"pact"},Barbarian:{flavor:"Grief with a weapon. Your rage is an old and reliable god.",sigil:"axe"},Bard:{flavor:"You sing the embers back to life. Every song is a small resurrection.",sigil:"song"},Druid:{flavor:"The wild is not gentle, and neither are you. Ash feeds new green.",sigil:"leaf"},Monk:{flavor:"Your body is the last intact temple. You keep it \u2014 and its silence \u2014 whole.",sigil:"fist"},Paladin:{flavor:"The oath outlived the church that wrote it. You are its last signature.",sigil:"sun"},Ranger:{flavor:"You hunt what hunts the refugees. The Ashenreach is your trapline.",sigil:"arrow"},Artificer:{flavor:"Where the world broke, you rivet. Your devices are small stubborn prayers.",sigil:"gear"}},m0={Acolyte:"Raised in candlelight and incense, sworn to a faith that outlasted its temples.",Charlatan:"You sold salvation, relics and second chances. The marks still believe.",Criminal:"You know the city's back doors, and the names that open them.",Entertainer:"You fed on applause until the crowds stopped coming. The show is not over.","Folk Hero":"You stood up when no one else would. The village still sings of it.","Guild Artisan":"Trade is a kind of prayer. Your seal still carries weight.",Hermit:"You went into the wild to be alone with something that finally answered.",Noble:"Gilded name, buried fortune, enemies with long memories.",Outlander:"The wilds raised you. Soft walls make you itch.",Sage:"You have read every forbidden book you could steal. One of them read you back.",Sailor:"Salt in the lungs and a horizon debt that never clears.",Soldier:"You held the line. The line held. Not everyone was so lucky.",Urchin:"You grew up a ghost in your own city \u2014 and it taught you all its secrets."},Ni=l0.map(i=>({id:i.id,flavor:p0[i.id]||"",asi:i.asi,subrace:i.subrace,speed:i.speed,size:i.size,darkvision:i.darkvision,languages:i.languages,traits:i.traits})),g0=Object.fromEntries(Ni.map(i=>[i.id,i])),kn=c0.map(i=>({id:i.id,flavor:(Dd[i.id]||{flavor:""}).flavor,sigil:(Dd[i.id]||{sigil:"sword"}).sigil,hitDie:i.hitDie,primary:i.primary,saves:i.saves,armor:i.armor,weapons:i.weapons,tools:i.tools,skills:i.skills,features:i.features,spellAbility:i.spellAbility,spellNote:i.spellNote,equipment:i.equipment})),v0=Object.fromEntries(kn.map(i=>[i.id,i])),fs=Object.fromEntries(Object.entries(h0).map(([i,e])=>[i,e.map(t=>({id:t.id,name:t.name,flavor:t.flavor,feature:t.feature}))]));ps=u0.map(i=>({id:i.id,flavor:m0[i.id]||"",skills:i.skills,tools:i.tools,languages:i.languages,equipment:i.equipment,feature:i.feature})),ZM=Object.fromEntries(ps.map(i=>[i.id,i])),Ys=d0,xc=f0;Ka=27,y0={8:0,9:1,10:2,11:3,12:4,13:5,14:7,15:9}});function Tc(i){let e=parseInt(i.slice(1),16);return[e>>16&255,e>>8&255,e&255]}function zt(i,e,t){let n=Tc(i),s=Tc(e),r=n.map((a,o)=>Math.round(a+(s[o]-a)*t));return`rgb(${r[0]},${r[1]},${r[2]})`}function Fn(i,e){let[t,n,s]=Tc(i);return`rgba(${t},${n},${s},${e})`}function x0(i){let e=i>>>0;return()=>{e=e+1831565813|0;let t=Math.imul(e^e>>>15,1|e);return t=t+Math.imul(t^t>>>7,61|t)^t,((t^t>>>14)>>>0)/4294967296}}function Nd(i){let e=2166136261;for(let t=0;t<i.length;t++)e^=i.charCodeAt(t),e=Math.imul(e,16777619);return e>>>0}function Od(i,e){i.width=512,i.height=640;let s=i.getContext("2d");if(!s)return;let r=e.look,a=x0((e.seed??7)^40503),o=Hd[e.race]||Hd.Human,l=Ui[r.skinTone%Ui.length],c=Fi[r.hairColor%Fi.length],h=zi[r.cloakColor%zi.length],u=Bi[r.eyeColor%Bi.length],d=e.class||"Fighter",f=o.scale,g=S0[r.bodyType]||1,b=512/2,p=140*f,m=172*f,x=116,v=x+m,y=p/2,w=x+m*.44,_=y*.46,M=v+74,T=168*g,L=d==="Barbarian";s.clearRect(0,0,512,640),M0(s,a,h),d==="Cleric"&&_0(s,b,x,y),w0(s,a,h,b,M,T,640,L),T0(s,a,h,b,x,y,T,M,L),L||A0(s,h,b,x,y,T,M),C0(s,l,b,v,M,y*(.34*g+.1),o);let S=R0(b,y,x,v,w,o.jaw);P0(s,S,l,o,y,w,v),I0(s,o,l,b,y,w,f),o.horns&&L0(s,c,b,y,x),o.tusks&&k0(s,l,b,y,w,m),D0(s,b,y,x,w,L,d),H0(s,u,c,d,b,w,_,o,f),N0(s,l,c,o,b,y,w,m),O0(s,a,c,r.hairStyle,b,y,x,w,v,M,L),o.beard&&U0(s,c,b,y,w,m,M),F0(s,r.faceDecor,a,b,y,w,m,d),B0(s,a,d,b,x,y,T,M,u,h),z0(s,a,b,x,M,T),G0(s,a,512,640),V0(s,d,512,640),W0(s,S,b,x,y,d)}function M0(i,e,t){let n=i.createLinearGradient(0,0,0,640);n.addColorStop(0,"#0e0f13"),n.addColorStop(.55,"#0a0b0e"),n.addColorStop(1,"#060708"),i.fillStyle=n,i.fillRect(0,0,512,640);let s=i.createRadialGradient(120,90,20,120,90,420);s.addColorStop(0,"rgba(201,116,52,0.14)"),s.addColorStop(1,"rgba(201,116,52,0)"),i.fillStyle=s,i.fillRect(0,0,512,640);let r=i.createRadialGradient(470,300,30,470,300,380);r.addColorStop(0,"rgba(61,90,90,0.10)"),r.addColorStop(1,"rgba(61,90,90,0)"),i.fillStyle=r,i.fillRect(0,0,512,640);for(let o=0;o<7;o++){let l=40+e()*440,c=80+e()*420,h=60+e()*130,u=i.createRadialGradient(l,c,0,l,c,h);u.addColorStop(0,`rgba(${8+e()*14|0},${8+e()*12|0},${10+e()*12|0},0.16)`),u.addColorStop(1,"rgba(0,0,0,0)"),i.fillStyle=u,i.fillRect(l-h,c-h,h*2,h*2)}let a=i.createRadialGradient(256,300,60,256,300,330);a.addColorStop(0,Fn(t.base,.1)),a.addColorStop(1,"rgba(0,0,0,0)"),i.fillStyle=a,i.fillRect(0,0,512,640)}function _0(i,e,t,n){i.save(),i.globalCompositeOperation="screen";let s=n*1.7,r=i.createRadialGradient(e,t+10,s*.62,e,t+10,s);r.addColorStop(0,"rgba(230,199,102,0)"),r.addColorStop(.55,"rgba(230,199,102,0.16)"),r.addColorStop(.8,"rgba(230,199,102,0.05)"),r.addColorStop(1,"rgba(230,199,102,0)"),i.fillStyle=r,i.beginPath(),i.arc(e,t+10,s,0,Math.PI*2),i.fill(),i.restore()}function w0(i,e,t,n,s,r,a,o){i.save();let l=new Path2D;l.moveTo(n-r*.86,s-6),l.quadraticCurveTo(n-r,s+26,n-r*.97,s+70),l.quadraticCurveTo(n-r*.85,(s+a)/2,n-r*.8,a),l.lineTo(n+r*.8,a),l.quadraticCurveTo(n+r*.85,(s+a)/2,n+r*.97,s+70),l.quadraticCurveTo(n+r,s+26,n+r*.86,s-6),l.quadraticCurveTo(n,s-30,n-r*.86,s-6);let c=i.createLinearGradient(n-r,s,n+r*.7,a),h=o?"#3d3629":t.base,u=o?"#57503c":t.light,d=o?"#14110a":t.shadow;c.addColorStop(0,zt(u,h,.35)),c.addColorStop(.45,h),c.addColorStop(1,d),i.fillStyle=c,i.fill(l),i.clip(l);for(let g=0;g<9;g++){let b=n+(e()*2-1)*r*.8;i.beginPath(),i.moveTo(b,s-10),i.quadraticCurveTo(b+(e()*60-30),s+150,b+(e()*90-45),a),i.strokeStyle=Fn(g%2?d:u,.1+e()*.08),i.lineWidth=6+e()*14,i.lineCap="round",i.stroke()}let f=i.createLinearGradient(0,s-20,0,s+90);f.addColorStop(0,Fn(u,.18)),f.addColorStop(1,"rgba(0,0,0,0)"),i.fillStyle=f,i.fillRect(n-r,s-20,r*2,110),i.restore(),o&&E0(i,e,n,s,r,a)}function E0(i,e,t,n,s,r){i.save(),i.lineCap="round";for(let a=0;a<900;a++){let o=e()<.5?-1:1,l=e(),c=t+o*(18+l*s*.92),h=n-26+Math.pow(e(),.7)*150+l*20;if(h>r)continue;let u=9+e()*16,d=-Math.PI/2+(e()-.5)*1.6+o*.35,f=e()<.24?"#6e6350":e()<.5?"#4a4132":"#2c2618";i.strokeStyle=Fn(f,.5+e()*.4),i.lineWidth=1.2+e()*1.8,i.beginPath(),i.moveTo(c,h),i.quadraticCurveTo(c+Math.cos(d)*u*.5+o*3,h+Math.sin(d)*u*.5,c+Math.cos(d)*u,h+Math.sin(d)*u),i.stroke()}i.restore()}function T0(i,e,t,n,s,r,a,o,l){if(l)return;i.save();let c=new Path2D;c.moveTo(n-a*.8,o+34),c.quadraticCurveTo(n-r*1.5,o-40,n-r*1.22,s+46),c.quadraticCurveTo(n-r*1.05,s-58,n,s-54),c.quadraticCurveTo(n+r*1.05,s-58,n+r*1.22,s+46),c.quadraticCurveTo(n+r*1.5,o-40,n+a*.8,o+34),c.quadraticCurveTo(n,o+66,n-a*.8,o+34);let h=new Path2D;h.ellipse(n,s+r*.72,r*1,r*1.05,0,0,Math.PI*2);let u=new Path2D;u.addPath(c),u.addPath(h);let d=i.createLinearGradient(n-r*1.3,s-60,n+r*1.1,o+40);d.addColorStop(0,zt(t.light,t.base,.45)),d.addColorStop(.5,t.base),d.addColorStop(1,t.shadow),i.fillStyle=d,i.fill(u,"evenodd"),i.save(),i.clip(u,"evenodd");for(let g=0;g<6;g++){let b=n+(e()*2-1)*r*1.1;i.beginPath(),i.moveTo(b,s-50),i.quadraticCurveTo(b+(e()*90-45),o-60,b+(e()*120-60),o+40),i.strokeStyle=Fn(g%2?t.shadow:t.light,.12+e()*.08),i.lineWidth=8+e()*16,i.lineCap="round",i.stroke()}let f=i.createRadialGradient(n,s+r*.72,r*.72,n,s+r*.72,r*1.12);f.addColorStop(0,"rgba(0,0,0,0)"),f.addColorStop(1,"rgba(0,0,0,0.5)"),i.fillStyle=f,i.fillRect(n-r*1.5,s-80,r*3,r*2.6),i.restore(),i.restore()}function A0(i,e,t,n,s,r,a){i.save(),i.globalCompositeOperation="screen",i.strokeStyle="rgba(230,199,102,0.28)",i.lineWidth=3,i.lineCap="round",i.beginPath(),i.moveTo(t-r*.78,a+22),i.quadraticCurveTo(t-s*1.48,a-44,t-s*1.2,n+42),i.quadraticCurveTo(t-s*1.02,n-56,t,n-52),i.stroke(),i.restore()}function C0(i,e,t,n,s,r,a){i.save(),i.beginPath(),i.moveTo(t-r,n-26),i.quadraticCurveTo(t-r*.9,s-8,t-r*1.25,s+18),i.lineTo(t+r*1.25,s+18),i.quadraticCurveTo(t+r*.9,s-8,t+r,n-26),i.closePath();let o=i.createLinearGradient(t-r,n,t+r,s);o.addColorStop(0,zt(e.base,e.shadow,.45)),o.addColorStop(.6,e.shadow),o.addColorStop(1,zt(e.shadow,"#000",.4)),i.fillStyle=o,i.fill(),i.beginPath(),i.ellipse(t,n+6,r*1.5,30,0,0,Math.PI*2);let l=i.createRadialGradient(t,n-4,4,t,n-4,56);l.addColorStop(0,"rgba(0,0,0,0.42)"),l.addColorStop(1,"rgba(0,0,0,0)"),i.fillStyle=l,i.fill(),i.restore()}function R0(i,e,t,n,s,r){let a=new Path2D,o=t+(s-t)*.42;return a.moveTo(i-e*.96,o),a.bezierCurveTo(i-e*.94,t-6,i-e*.5,t-14,i,t-13),a.bezierCurveTo(i+e*.5,t-14,i+e*.94,t-6,i+e*.96,o),a.bezierCurveTo(i+e*1.02,s+14,i+e*(.7+.2*r),n-42,i+e*.42*r,n-8),a.quadraticCurveTo(i,n+4,i-e*.42*r,n-8),a.bezierCurveTo(i-e*(.7+.2*r),n-42,i-e*1.02,s+14,i-e*.96,o),a.closePath(),a}function P0(i,e,t,n,s,r,a){i.save(),i.clip(e);let o=i.createLinearGradient(256-s,r-70,256+s*.9,a+20);o.addColorStop(0,zt(t.light,t.base,.25)),o.addColorStop(.42,t.base),o.addColorStop(1,zt(t.base,t.shadow,.8)),i.fillStyle=o,i.fillRect(256-s*1.2,r-120,s*2.4,a-r+180),i.globalCompositeOperation="multiply";let l=i.createRadialGradient(256+s*.66,r+34,12,256+s*.66,r+34,s*1.15);l.addColorStop(0,"rgba(30,22,20,0.5)"),l.addColorStop(1,"rgba(30,22,20,0)"),i.fillStyle=l,i.fillRect(256-s,r-110,s*2,a-r+150),n.tint&&(i.fillStyle=Fn(n.tint,n.tint==="#8ea3b0"?.07:.15),i.fillRect(256-s,r-110,s*2,a-r+150)),i.globalCompositeOperation="screen";let c=(h,u,d,f)=>{let g=i.createRadialGradient(h,u,0,h,u,d);g.addColorStop(0,`rgba(255,232,200,${f})`),g.addColorStop(1,"rgba(255,232,200,0)"),i.fillStyle=g,i.fillRect(h-d,u-d,d*2,d*2)};c(256-s*.52,r+20,44,.16),c(256-s*.16,r-52,40,.13),c(256+s*.42,r+26,30,.07),i.restore()}function I0(i,e,t,n,s,r,a){let o=l=>{i.save(),i.translate(n+l*s*.98,r+6),i.beginPath(),e.ears==="pointed"?(i.moveTo(0,-8),i.quadraticCurveTo(l*26*a,-20*a,l*30*a,-2),i.quadraticCurveTo(l*24*a,14,0,16)):i.ellipse(0,0,9*a,17*a,0,0,Math.PI*2),i.closePath();let c=i.createLinearGradient(l*-6,-10,l*22,10);c.addColorStop(0,zt(t.base,t.shadow,.35)),c.addColorStop(1,zt(t.base,t.shadow,.6)),i.fillStyle=c,i.fill(),i.beginPath(),e.ears==="pointed"?(i.moveTo(l*2,-4),i.quadraticCurveTo(l*16,-8,l*18,0),i.quadraticCurveTo(l*12,6,l*2,8)):i.ellipse(l*1,1,4*a,9*a,0,0,Math.PI*2),i.fillStyle="rgba(20,12,10,0.45)",i.fill(),i.restore()};o(-1),o(1)}function L0(i,e,t,n,s){let r=a=>{i.save(),i.translate(t+a*n*.52,s+10),i.beginPath(),i.moveTo(0,10),i.quadraticCurveTo(a*30,4,a*44,-30),i.quadraticCurveTo(a*47,-44,a*38,-50),i.quadraticCurveTo(a*40,-30,a*22,-14),i.quadraticCurveTo(a*12,-4,0,2),i.closePath();let o=i.createLinearGradient(0,0,a*46,-50);o.addColorStop(0,zt(e.shadow,"#2b2019",.5)),o.addColorStop(1,"#6e5b45"),i.fillStyle=o,i.fill(),i.strokeStyle="rgba(0,0,0,0.35)",i.lineWidth=1.5;for(let l=1;l<=4;l++){let c=l/5;i.beginPath(),i.moveTo(a*(10+c*26),-2-c*30),i.quadraticCurveTo(a*(16+c*22),-6-c*30,a*(14+c*24),-12-c*28),i.stroke()}i.restore()};r(-1),r(1)}function k0(i,e,t,n,s,r){let a=s+r*.27,o=l=>{i.save(),i.translate(t+l*n*.3,a+8),i.beginPath(),i.moveTo(0,6),i.quadraticCurveTo(l*5,-6,l*3,-16),i.quadraticCurveTo(l*8,-6,l*4,8),i.closePath();let c=i.createLinearGradient(0,-16,0,8);c.addColorStop(0,"#e8ddc4"),c.addColorStop(1,zt(e.base,"#c9b896",.5)),i.fillStyle=c,i.fill(),i.restore()};o(-1),o(1)}function D0(i,e,t,n,s,r,a){if(i.save(),r){i.restore();return}let o=i.createLinearGradient(0,n-10,0,s+6);if(o.addColorStop(0,"rgba(4,3,3,0.62)"),o.addColorStop(1,"rgba(4,3,3,0)"),i.fillStyle=o,i.beginPath(),i.ellipse(e,n+(s-n)*.5,t*1.12,(s-n)*.75,0,0,Math.PI*2),i.fill(),a==="Rogue"){let l=i.createLinearGradient(0,s-14,0,s+16);l.addColorStop(0,"rgba(0,0,0,0)"),l.addColorStop(.5,"rgba(0,0,0,0.34)"),l.addColorStop(1,"rgba(0,0,0,0)"),i.fillStyle=l,i.fillRect(e-t*1.2,s-14,t*2.4,30)}i.restore()}function H0(i,e,t,n,s,r,a,o,l){let c=15*l,h=6.5*l,u=6.6*l,d=n==="Warlock",f=g=>{let b=s+g*a,p=r;i.save();let m=i.createRadialGradient(b,p-2,4,b,p,26);m.addColorStop(0,"rgba(18,10,8,0.4)"),m.addColorStop(1,"rgba(18,10,8,0)"),i.fillStyle=m,i.beginPath(),i.ellipse(b,p,26,16,0,0,Math.PI*2),i.fill(),i.beginPath(),i.moveTo(b-c,p),i.quadraticCurveTo(b,p-h*1.7,b+c,p),i.quadraticCurveTo(b,p+h*1.5,b-c,p),i.closePath(),m=i.createLinearGradient(b,p-h,b,p+h),m.addColorStop(0,"#b8ad9c"),m.addColorStop(1,"#6e6355"),i.fillStyle=m,i.fill(),i.beginPath(),i.arc(b,p,u,0,Math.PI*2),m=i.createRadialGradient(b-u*.3,p-u*.3,1,b,p,u),m.addColorStop(0,e.glow),m.addColorStop(.55,e.iris),m.addColorStop(1,zt(e.iris,"#000",.62)),i.fillStyle=m,i.fill(),i.beginPath(),i.arc(b,p,u*.42,0,Math.PI*2),i.fillStyle="#0a0705",i.fill(),i.beginPath(),i.arc(b,p,u,0,Math.PI*2),i.strokeStyle="rgba(0,0,0,0.55)",i.lineWidth=1.4,i.stroke(),i.save(),i.shadowColor=e.glow,i.shadowBlur=d?10:5,i.fillStyle="rgba(255,250,238,0.95)",i.beginPath(),i.arc(b-u*.38,p-u*.42,1.9*l,0,Math.PI*2),i.fill(),d&&(i.shadowBlur=14,i.fillStyle=Fn(e.glow,.5),i.beginPath(),i.arc(b,p,u*.8,0,Math.PI*2),i.fill()),i.restore(),i.beginPath(),i.moveTo(b-c*1.04,p-1),i.quadraticCurveTo(b,p-h*1.8,b+c*1.04,p-1),i.strokeStyle="rgba(16,9,7,0.8)",i.lineWidth=2.2,i.lineCap="round",i.stroke(),i.beginPath(),i.moveTo(b-c*.9,p+3.4),i.quadraticCurveTo(b,p+h*1.6,b+c*.9,p+3.4),i.strokeStyle="rgba(16,9,7,0.3)",i.lineWidth=1.4,i.stroke(),i.beginPath(),i.moveTo(b-c*1.15,p-h-10),i.quadraticCurveTo(b+g*2,p-h-(o.tusks?18:15),b+c*1.2,p-h-(o.tusks?11:8)),i.strokeStyle=zt(t.shadow,t.base,.4),i.lineWidth=o.tusks?6.5:5.2,i.lineCap="round",i.stroke(),i.restore()};f(-1),f(1)}function N0(i,e,t,n,s,r,a,o){let l=a+o*.17,c=a+o*.145,h=a+o*.27;i.save(),i.beginPath(),i.moveTo(s-3,a-2),i.quadraticCurveTo(s-7,l,s-8.5,c+5),i.quadraticCurveTo(s,c+11,s+8.5,c+5),i.quadraticCurveTo(s+7,l,s+3,a-2),i.closePath();let u=i.createLinearGradient(s-8,a,s+9,c);u.addColorStop(0,"rgba(0,0,0,0)"),u.addColorStop(.7,"rgba(20,12,10,0.20)"),u.addColorStop(1,"rgba(20,12,10,0.34)"),i.fillStyle=u,i.fill(),i.fillStyle="rgba(14,8,6,0.5)",i.beginPath(),i.ellipse(s-5.5,c+4,2.4,1.5,-.4,0,Math.PI*2),i.fill(),i.beginPath(),i.ellipse(s+5.5,c+4,2.4,1.5,.4,0,Math.PI*2),i.fill(),i.globalCompositeOperation="screen",u=i.createRadialGradient(s-2,c,0,s-2,c,10),u.addColorStop(0,"rgba(255,232,200,0.15)"),u.addColorStop(1,"rgba(255,232,200,0)"),i.fillStyle=u,i.fillRect(s-12,c-10,24,20),i.globalCompositeOperation="source-over",n.beard||(i.beginPath(),i.moveTo(s-r*.3,h),i.quadraticCurveTo(s,h+(n.tusks?2:4.5),s+r*.3,h),i.strokeStyle="rgba(24,12,10,0.72)",i.lineWidth=2.4,i.lineCap="round",i.stroke(),i.globalCompositeOperation="screen",u=i.createRadialGradient(s,h+9,0,s,h+9,12),u.addColorStop(0,"rgba(255,220,190,0.12)"),u.addColorStop(1,"rgba(255,220,190,0)"),i.fillStyle=u,i.fillRect(s-12,h-3,24,24)),i.restore()}function O0(i,e,t,n,s,r,a,o,l,c,h){let u=()=>{i.save(),i.beginPath(),i.moveTo(s-r*.97,a+34),i.bezierCurveTo(s-r*.95,a-12,s-r*.5,a-22,s,a-21),i.bezierCurveTo(s+r*.5,a-22,s+r*.95,a-12,s+r*.97,a+34),i.quadraticCurveTo(s+r*.5,a+22,s,a+26),i.quadraticCurveTo(s-r*.5,a+22,s-r*.97,a+34),i.closePath();let f=i.createLinearGradient(s-r,a-24,s+r*.6,a+40);f.addColorStop(0,zt(t.light,t.base,.3)),f.addColorStop(.55,t.base),f.addColorStop(1,zt(t.base,t.shadow,.5)),i.fillStyle=f,i.fill(),i.restore()},d=(f,g,b,p,m)=>{i.save(),i.lineCap="round";for(let x=0;x<f;x++){let v=e()<.5?-1:1,y=s+v*r*(.5+e()*.5);i.beginPath(),i.moveTo(y,g),i.quadraticCurveTo(y+v*10,g+(b-g)*.5,y+v*(4+e()*14),b),i.strokeStyle=Fn(e()<.5?t.light:t.shadow,m),i.lineWidth=1+e()*2,i.stroke()}i.restore()};if(i.save(),n===4){u(),i.save();for(let f=0;f<500;f++){let g=s+(e()*2-1)*r*.92,b=Math.abs(g-s)/(r*.95),p=a-8+Math.sqrt(Math.max(0,1-b*b))*34*e()+e()*12;i.fillStyle=Fn(e()<.5?t.shadow:t.base,.5),i.fillRect(g,p,1.3,1.3)}i.restore()}else if(n===1){u(),i.beginPath(),i.ellipse(s,a-26,r*.3,r*.24,0,0,Math.PI*2);let f=i.createRadialGradient(s-10,a-34,4,s,a-26,r*.34);f.addColorStop(0,t.light),f.addColorStop(.7,t.base),f.addColorStop(1,t.shadow),i.fillStyle=f,i.fill(),i.beginPath(),i.ellipse(s,a-12,r*.22,4,0,0,Math.PI*2),i.fillStyle="#3a2c1c",i.fill(),d(6,a-30,a-2,r,.5)}else if(n===2||n===3){u();let f=(g,b,p,m)=>{i.save();let x=s+g*r*.78,v=a+30;i.beginPath(),i.moveTo(x-12,v),i.bezierCurveTo(x+g*6-14,v+60,x+g*b-10,v+p*.55,x+g*b-6,v+p),i.lineTo(x+g*b+10,v+p),i.bezierCurveTo(x+g*b+16,v+p*.55,x+g*10+14,v+60,x+12,v),i.closePath();let y=i.createLinearGradient(x-14,v,x+g*b+12,v+p);if(y.addColorStop(0,zt(t.light,t.base,.35)),y.addColorStop(.5,t.base),y.addColorStop(1,zt(t.base,t.shadow,.55)),i.fillStyle=y,i.fill(),m){i.strokeStyle="rgba(0,0,0,0.4)",i.lineWidth=2.4;for(let w=1;w<=5;w++){let _=w/6,M=v+p*_,T=x+g*b*_;i.beginPath(),i.moveTo(T-10,M-5),i.quadraticCurveTo(T,M+3,T+10,M-5),i.stroke()}}i.beginPath(),i.moveTo(x+g*2-6,v+8),i.quadraticCurveTo(x+g*b*.5-4,v+p*.5,x+g*b-2,v+p-8),i.strokeStyle=Fn(t.light,.28),i.lineWidth=4,i.lineCap="round",i.stroke(),i.restore()};f(-1,-26,Math.min(c+150-(a+30),210),n===3),f(1,30,Math.min(c+150-(a+30),200),n===3),h&&d(10,a+20,l+30,r,.45)}else{u(),i.save(),i.beginPath(),i.moveTo(s-r*.9,a+32),i.quadraticCurveTo(s-r*.4,a+46,s-r*.05,a+40),i.quadraticCurveTo(s+r*.5,a+34,s+r*.92,a+30),i.quadraticCurveTo(s+r*.5,a+18,s,a+20),i.quadraticCurveTo(s-r*.5,a+18,s-r*.9,a+32),i.closePath();let f=i.createLinearGradient(0,a+16,0,a+46);f.addColorStop(0,zt(t.light,t.base,.25)),f.addColorStop(1,zt(t.base,t.shadow,.4)),i.fillStyle=f,i.fill(),i.restore(),d(5,a+26,a+52,r,.5)}i.restore()}function U0(i,e,t,n,s,r,a){let o=s+r*.27;i.save(),i.beginPath(),i.moveTo(t-n*.86,s+26),i.quadraticCurveTo(t-n*.95,o+30,t-n*.5,a+96),i.quadraticCurveTo(t,a+122,t+n*.5,a+96),i.quadraticCurveTo(t+n*.95,o+30,t+n*.86,s+26),i.quadraticCurveTo(t,s+44,t-n*.86,s+26),i.closePath();let l=i.createLinearGradient(t-n,s+20,t+n*.7,a+110);l.addColorStop(0,zt(e.light,e.base,.3)),l.addColorStop(.45,e.base),l.addColorStop(1,zt(e.base,e.shadow,.6)),i.fillStyle=l,i.fill(),i.clip(),i.lineCap="round";for(let c=0;c<40;c++){let h=t+(c%20-10)*n*.09,u=s+30+c*7%30;i.beginPath(),i.moveTo(h,u),i.quadraticCurveTo(h+c*13%17-8,(u+a)/2,h+c*29%21-10,a+90+c%3*10),i.strokeStyle=Fn(c%3===0?e.light:c%3===1?e.base:e.shadow,.3),i.lineWidth=2+c%3,i.stroke()}i.restore(),i.save(),i.beginPath(),i.moveTo(t-n*.34,o-2),i.quadraticCurveTo(t-n*.5,o+12,t-n*.62,o+20),i.quadraticCurveTo(t-n*.3,o+14,t,o+6),i.quadraticCurveTo(t+n*.3,o+14,t+n*.62,o+20),i.quadraticCurveTo(t+n*.5,o+12,t+n*.34,o-2),i.closePath(),i.fillStyle=zt(e.base,e.shadow,.25),i.fill(),i.restore()}function F0(i,e,t,n,s,r,a,o){if(e!=="none"){if(i.save(),e==="scars"){let l=(c,h,u,d)=>{i.beginPath(),i.moveTo(c,h),i.lineTo(u,d),i.strokeStyle="rgba(10,6,5,0.55)",i.lineWidth=2.6,i.lineCap="round",i.stroke(),i.beginPath(),i.moveTo(c+1.6,h-1.6),i.lineTo(u+1.6,d-1.6),i.strokeStyle="rgba(235,215,190,0.4)",i.lineWidth=1.3,i.stroke()};l(n-s*.5,r-26,n-s*.18,r+26),l(n+s*.3,r+a*.1,n+s*.52,r+a*.22),(o==="Fighter"||t()<.6)&&l(n+s*.12,r-18,n+s*.34,r-6)}else if(e==="runes"){let l=(c,h,u)=>{let d=3+Math.floor(t()*3);i.beginPath();for(let f=0;f<=d;f++){let g=t()*Math.PI*2,b=u*(.5+t()*.5),p=c+Math.cos(g)*b,m=h+Math.sin(g)*b;f===0?i.moveTo(p,m):i.lineTo(p,m)}i.strokeStyle="rgba(255,176,96,0.85)",i.lineWidth=1.8,i.lineJoin="miter",i.shadowColor="#ff9a3d",i.shadowBlur=7,i.stroke()};l(n-s*.5,r+22,7),l(n-s*.34,r+34,5),l(n+s*.42,r+a*.14,6),l(n+s*.1,r-34,5)}else if(e==="warpaint"){let l=(h,u,d,f)=>{i.save(),i.translate(n,h),i.rotate(-.06),i.beginPath(),i.moveTo(-s*1.1,-u/2),i.lineTo(s*1.1,-u/2),i.lineTo(s*1.05,u/2),i.lineTo(-s*1.15,u/2),i.closePath(),i.globalAlpha=d,i.fillStyle=f,i.fill(),i.restore()},c=o==="Cleric"?"#8a6a1f":"#7a1f1f";l(r-2,10,.5,c),l(r+16,7,.34,c)}i.restore()}}function B0(i,e,t,n,s,r,a,o,l,c){if(i.save(),t==="Fighter"){let h=n-a*.72,u=o-6;i.beginPath(),i.moveTo(h-58,u+58),i.quadraticCurveTo(h-66,u-6,h-10,u-18),i.quadraticCurveTo(h+42,u-10,h+50,u+44),i.quadraticCurveTo(h-6,u+66,h-58,u+58),i.closePath();let d=i.createLinearGradient(h-60,u-18,h+44,u+60);d.addColorStop(0,"#8b8f97"),d.addColorStop(.5,"#4c4f56"),d.addColorStop(1,"#23252a"),i.fillStyle=d,i.fill(),i.strokeStyle="rgba(230,199,102,0.5)",i.lineWidth=2,i.stroke();for(let f=0;f<4;f++)i.beginPath(),i.arc(h-40+f*24,u+12+Math.sin(f)*8,2.2,0,Math.PI*2),i.fillStyle="rgba(230,199,102,0.55)",i.fill()}else if(t==="Wizard"){i.globalCompositeOperation="screen";for(let h=0;h<9;h++){let u=n+(e()*2-1)*r*2.4,d=s-40+e()*260;if(Math.abs(u-n)<r*1.05&&d>s&&d<s+r*2)continue;let f=1.2+e()*2.4;i.shadowColor="#ffb45e",i.shadowBlur=9,i.fillStyle=`rgba(255,190,110,${.5+e()*.4})`,i.beginPath(),i.arc(u,d,f,0,Math.PI*2),i.fill()}}else if(t==="Sorcerer"){i.globalCompositeOperation="screen";for(let h=0;h<14;h++){let u=n+(e()*2-1)*r*2.6,d=620-e()*380;if(Math.abs(u-n)<r*1.15&&d>s-20&&d<s+r*2.2)continue;let f=6+e()*14,g=i.createLinearGradient(u,d,u,d-f);g.addColorStop(0,"rgba(255,150,60,0)"),g.addColorStop(1,`rgba(255,190,110,${.35+e()*.4})`),i.strokeStyle=g,i.lineWidth=1.6,i.beginPath(),i.moveTo(u,d),i.lineTo(u+(e()*6-3),d-f),i.stroke()}}else if(t==="Warlock")for(let h=0;h<5;h++){let u=n+(e()*2-1)*a,d=600-e()*60,f=50+e()*80,g=i.createRadialGradient(u,d,4,u,d,f);g.addColorStop(0,"rgba(88,52,110,0.12)"),g.addColorStop(1,"rgba(88,52,110,0)"),i.fillStyle=g,i.fillRect(u-f,d-f,f*2,f*2)}i.restore()}function z0(i,e,t,n,s,r){i.save(),i.globalCompositeOperation="overlay",i.lineCap="round";let a=850;for(let o=0;o<a;o++){let l=e(),c,h,u,d;l<.55?(c=t+(e()*2-1)*72,h=n+e()*210,u=Math.PI/2+(e()-.5)*.9):(c=t+(e()*2-1)*r,h=s-10+e()*(640-s),u=Math.PI/2+(e()-.5)*.5+(c<t?-.5:.5)),d=7+e()*15;let f=e()<.5,g=e()<.35;i.strokeStyle=f?`rgba(${g?"255":"240"},${g?"220":"236"},${g?"180":"225"},${.025+e()*.045})`:`rgba(10,8,${g?10:14},${.03+e()*.05})`,i.lineWidth=1.6+e()*3.2,i.beginPath(),i.moveTo(c,h),i.quadraticCurveTo(c+Math.cos(u)*d*.5+(e()-.5)*5,h+Math.sin(u)*d*.5,c+Math.cos(u)*d,h+Math.sin(u)*d),i.stroke()}i.restore()}function G0(i,e,t,n){i.save(),i.globalCompositeOperation="overlay";let s=t*n/90;for(let r=0;r<s;r++){let a=e();i.fillStyle=a<.5?`rgba(255,250,240,${.02+a*.05})`:`rgba(8,6,10,${.02+(a-.5)*.06})`,i.fillRect(e()*t,e()*n,1.4,1.4)}i.restore()}function V0(i,e,t,n){i.save();let s=i.createRadialGradient(t/2,n*.42,n*.28,t/2,n*.46,n*.82);s.addColorStop(0,"rgba(0,0,0,0)"),s.addColorStop(.75,e==="Warlock"?"rgba(6,3,10,0.34)":"rgba(0,0,0,0.28)"),s.addColorStop(1,"rgba(0,0,0,0.66)"),i.fillStyle=s,i.fillRect(0,0,t,n);let r=i.createLinearGradient(0,n-140,0,n);r.addColorStop(0,"rgba(0,0,0,0)"),r.addColorStop(1,"rgba(0,0,0,0.5)"),i.fillStyle=r,i.fillRect(0,n-140,t,140),i.restore()}function W0(i,e,t,n,s,r){i.save(),i.globalCompositeOperation="screen",i.strokeStyle=r==="Cleric"?"rgba(240,214,150,0.5)":"rgba(235,190,130,0.38)",i.lineWidth=2.4,i.lineCap="round",i.beginPath(),i.moveTo(t-s*.7,n-8),i.bezierCurveTo(t-s*.95,n+8,t-s*.96,n+42,t-s*.86,n+72),i.stroke(),i.strokeStyle="rgba(235,190,130,0.2)",i.lineWidth=5,i.stroke(e),i.restore()}var Ui,Fi,Ks,Bi,zi,Hd,S0,Ac=za(()=>{"use strict";Ui=[{name:"Pale Moth",light:"#ead9c4",base:"#cdb69e",shadow:"#6e584a"},{name:"Ashen",light:"#cfc9c2",base:"#a8a29b",shadow:"#565249"},{name:"Weathered",light:"#d9b489",base:"#b28a5f",shadow:"#66482e"},{name:"Olive Dusk",light:"#c0a87e",base:"#998059",shadow:"#4f4128"},{name:"Deep Umber",light:"#8c6746",base:"#664629",shadow:"#2c1c10"},{name:"Crypt Sallow",light:"#bcb7a0",base:"#918c74",shadow:"#46433a"}],Fi=[{name:"Ink Black",light:"#565664",base:"#26242e",shadow:"#0d0c12"},{name:"Ash Brown",light:"#8f7a66",base:"#57452f",shadow:"#251b10"},{name:"Chestnut",light:"#a06c40",base:"#6d4526",shadow:"#301a0c"},{name:"Copper",light:"#cf8340",base:"#934d1f",shadow:"#421c07"},{name:"Bone Silver",light:"#ddd6c6",base:"#a79f8e",shadow:"#4f4a3f"},{name:"Ember Auburn",light:"#a85a30",base:"#732f16",shadow:"#2c0f05"}],Ks=["Cropped","Topknot","Long","Braids","Shaved"],Bi=[{name:"Ember",iris:"#c8781f",glow:"#ffcf7a"},{name:"Crypt",iris:"#3f7a72",glow:"#8fe3d4"},{name:"Steel",iris:"#6f879c",glow:"#cfe0ef"},{name:"Blood",iris:"#7c2422",glow:"#d05248"}],zi=[{name:"Charcoal",light:"#45484f",base:"#24262c",shadow:"#0b0c10"},{name:"Ember Umber",light:"#6e4c2a",base:"#46301a",shadow:"#180f07"},{name:"Crypt Teal",light:"#42605c",base:"#2a403c",shadow:"#0c1615"},{name:"Blood Maroon",light:"#642c2a",base:"#3f1a19",shadow:"#140807"},{name:"Moss Olive",light:"#5b5838",base:"#38351f",shadow:"#11110a"},{name:"Slate",light:"#5c6370",base:"#373d47",shadow:"#121419"}];Hd={Human:{scale:1,jaw:1,ears:"round",beard:!1,tusks:!1,horns:!1,tint:null},Elf:{scale:.94,jaw:.9,ears:"pointed",beard:!1,tusks:!1,horns:!1,tint:"#8ea3b0"},Dwarf:{scale:1.06,jaw:1.18,ears:"round",beard:!0,tusks:!1,horns:!1,tint:"#7a4a30"},Halfling:{scale:.88,jaw:1.04,ears:"round",beard:!1,tusks:!1,horns:!1,tint:"#a67c4e"},"Half-Orc":{scale:1.08,jaw:1.2,ears:"round",beard:!1,tusks:!0,horns:!1,tint:"#5a7050"},Tiefling:{scale:1,jaw:.96,ears:"round",beard:!1,tusks:!1,horns:!0,tint:"#7a2a24"},"Half-Elf":{scale:.98,jaw:.95,ears:"pointed",beard:!1,tusks:!1,horns:!1,tint:"#9aa8ae"},"Astral Elf":{scale:.94,jaw:.9,ears:"pointed",beard:!1,tusks:!1,horns:!1,tint:"#8a92c0"},Fairy:{scale:.86,jaw:.88,ears:"pointed",beard:!1,tusks:!1,horns:!1,tint:"#9ac0b8"},Owlin:{scale:.92,jaw:.92,ears:"pointed",beard:!1,tusks:!1,horns:!1,tint:"#7f8ea0"},Firbolg:{scale:1.1,jaw:1.05,ears:"pointed",beard:!1,tusks:!1,horns:!1,tint:"#7a8a7a"},Gnome:{scale:.88,jaw:1.02,ears:"round",beard:!1,tusks:!1,horns:!1,tint:"#a67c4e"},"Deep Gnome":{scale:.88,jaw:1.02,ears:"round",beard:!1,tusks:!1,horns:!1,tint:"#7a6a80"},Goblin:{scale:.88,jaw:1.1,ears:"round",beard:!1,tusks:!0,horns:!1,tint:"#6d7a4a"},Kobold:{scale:.86,jaw:1.08,ears:"round",beard:!1,tusks:!1,horns:!1,tint:"#8a4a3a"},Verdan:{scale:.88,jaw:1,ears:"round",beard:!1,tusks:!1,horns:!1,tint:"#6a8a6a"},Harengon:{scale:.9,jaw:.98,ears:"pointed",beard:!1,tusks:!1,horns:!1,tint:"#9a8a7a"},Orc:{scale:1.1,jaw:1.22,ears:"round",beard:!1,tusks:!0,horns:!1,tint:"#5a7050"},Goliath:{scale:1.12,jaw:1.15,ears:"round",beard:!1,tusks:!1,horns:!1,tint:"#8a8f96"},Bugbear:{scale:1.08,jaw:1.2,ears:"round",beard:!1,tusks:!0,horns:!1,tint:"#6d7a5a"},Hobgoblin:{scale:1.04,jaw:1.14,ears:"round",beard:!1,tusks:!1,horns:!1,tint:"#8a5a3a"},Leonin:{scale:1.08,jaw:1.16,ears:"round",beard:!0,tusks:!0,horns:!1,tint:"#b08a4a"},Giff:{scale:1.1,jaw:1.24,ears:"round",beard:!1,tusks:!0,horns:!1,tint:"#6d7050"},"Thri-kreen":{scale:1.02,jaw:1.06,ears:"pointed",beard:!1,tusks:!1,horns:!1,tint:"#7a8a5a"},Dragonborn:{scale:1.04,jaw:1.1,ears:"round",beard:!1,tusks:!1,horns:!0,tint:"#7a5a3a"},"Gem Dragonborn":{scale:1.04,jaw:1.1,ears:"round",beard:!1,tusks:!1,horns:!0,tint:"#6a5a8a"},Lizardfolk:{scale:1,jaw:1.12,ears:"round",beard:!1,tusks:!0,horns:!1,tint:"#5a7a5a"},"Yuan-ti Pureblood":{scale:1,jaw:1,ears:"round",beard:!1,tusks:!1,horns:!1,tint:"#6a8a5a"},Hexblood:{scale:1,jaw:.96,ears:"round",beard:!1,tusks:!1,horns:!0,tint:"#5a6a5a"},Tabaxi:{scale:.98,jaw:.95,ears:"pointed",beard:!1,tusks:!1,horns:!1,tint:"#a08a5a"},Satyr:{scale:.98,jaw:.98,ears:"pointed",beard:!1,tusks:!1,horns:!0,tint:"#8a6a4a"},Hadozee:{scale:.96,jaw:1.06,ears:"round",beard:!1,tusks:!1,horns:!1,tint:"#7a6a5a"},Genasi:{scale:1,jaw:1,ears:"round",beard:!1,tusks:!1,horns:!1,tint:"#8a8ab0"},Aasimar:{scale:1,jaw:.96,ears:"round",beard:!1,tusks:!1,horns:!1,tint:"#c8b890"},Triton:{scale:.98,jaw:.94,ears:"pointed",beard:!1,tusks:!1,horns:!1,tint:"#6a9a9a"},Aarakocra:{scale:.94,jaw:.9,ears:"pointed",beard:!1,tusks:!1,horns:!1,tint:"#a08a6a"},Kenku:{scale:.94,jaw:1.08,ears:"round",beard:!1,tusks:!0,horns:!1,tint:"#6a6a72"},Dhampir:{scale:1,jaw:.94,ears:"pointed",beard:!1,tusks:!0,horns:!1,tint:"#b0a8b8"},Reborn:{scale:1,jaw:1,ears:"round",beard:!1,tusks:!1,horns:!1,tint:"#9aa89a"},"Custom Lineage":{scale:1,jaw:1,ears:"round",beard:!1,tusks:!1,horns:!1,tint:null},Autognome:{scale:.88,jaw:1.04,ears:"round",beard:!1,tusks:!1,horns:!1,tint:"#8a8f96"},Plasmoid:{scale:.98,jaw:.92,ears:"round",beard:!1,tusks:!1,horns:!1,tint:"#7a8a9a"}},S0={slim:.85,normal:1,heavy:1.18}});function zd(){return{step:0,name:"",race:"",charClass:"",subclass:"",mode:"pointbuy",base:{str:8,dex:8,con:8,int:8,wis:8,cha:8},pool:[],rolled:!1,dice:{},look:{bodyType:"normal",skinTone:1,hairStyle:0,hairColor:1,cloakColor:0,eyeColor:0,faceDecor:"none"},background:"",equipChoices:{}}}function Zs(i){let e=jr(i.charClass);return Qa.map((t,n)=>n).filter(t=>t!==q0||e)}function H(i,e,...t){let n=document.createElement(i);if(e)for(let[s,r]of Object.entries(e))r==null||r===!1||(typeof r=="function"?n.addEventListener(s.slice(2).toLowerCase(),r):s==="class"?n.className=String(r):s==="text"?n.textContent=String(r):s==="html"?n.innerHTML=String(r):s==="disabled"?n.disabled=!0:n.setAttribute(s,String(r)));for(let s of t)s!=null&&s!==!1&&n.append(typeof s=="object"?s:document.createTextNode(String(s)));return n}function Qr(i,e){let t=document.createElementNS($0,"svg");t.setAttribute("viewBox","0 0 24 24"),t.setAttribute("fill","none"),t.setAttribute("stroke","currentColor"),t.setAttribute("stroke-width","1.7"),t.setAttribute("stroke-linecap","round"),t.setAttribute("stroke-linejoin","round");for(let[n,s]of Object.entries(e||{}))t.setAttribute(n,s);return t.innerHTML=i,t}function Gd(i,e=30){return Qr({sword:'<path d="M12 2v13"/><path d="M8.5 13.5h7"/><path d="M12 15.5v4.5"/><path d="M10 20h4"/><path d="M12 2l-1.6 3h3.2z"/>',eye:'<path d="M2 13q10-9 20 0-10 9-20 0z"/><circle cx="12" cy="13" r="3"/><path d="M12 5.5v-2M6.5 7.5L5 6M17.5 7.5L19 6"/>',dagger:'<path d="M12 3l3 6-3 9-3-9z"/><path d="M7.5 9h9"/><path d="M12 18v3"/>',flame:'<path d="M12 2.5c3 4 6 6 4.5 11-.8 3-3 4.5-4.5 7-1.5-2.5-3.7-4-4.5-7C6 8.5 9 6.5 12 2.5z"/><path d="M12 12c1.4 1.6 1.6 3.4.2 5.2"/>',spark:'<path d="M12 2l1.8 7.2L22 12l-8.2 2.8L12 22l-1.8-7.2L2 12l8.2-2.8z"/>',pact:'<path d="M12 3.5L20 18H4z"/><circle cx="12" cy="14.5" r="2.6"/><path d="M12 3.5V9"/>',axe:'<path d="M9 21L16 5"/><path d="M16 5q5 2 4 7-3-2-6-1 1-3 2-6z"/>',song:'<circle cx="8.5" cy="17.5" r="3"/><path d="M11.5 17.5V4l7.5 2.2"/><path d="M11.5 9.5l7.5 2.2"/>',leaf:'<path d="M19 4C9 4 4 9 4 15c0 3 2 5 5 5 6 0 10-6 10-16z"/><path d="M9 20c2-6 5-10 9-13"/>',fist:'<path d="M7 11V7a2 2 0 0 1 4 0v3"/><path d="M11 10V6a2 2 0 0 1 4 0v4"/><path d="M15 10V8a2 2 0 0 1 4 0v5a7 7 0 0 1-7 7h-1a6 6 0 0 1-6-6v-3"/>',sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1"/>',arrow:'<path d="M4 20L20 4"/><path d="M20 4h-7M20 4v7"/><path d="M9 11l4 4"/>',gear:'<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1"/>'}[i],{width:String(e),height:String(e)})}function Y0(i){let e=X0[i]||"human";return Qr(Ud[e]||Ud.human,{width:"22",height:"22"})}function ms(i,e=16){return Qr({chevL:'<path d="M14.5 5.5L8 12l6.5 6.5"/>',chevR:'<path d="M9.5 5.5L16 12l-6.5 6.5"/>',download:'<path d="M12 4v10M8 10.5L12 14.5l4-4"/><path d="M5 19h14"/>',upload:'<path d="M12 14V4M8 7.5L12 3.5l4 4"/><path d="M5 19h14"/>',check:'<path d="M5 13l4 4L19 7"/>',warn:'<path d="M12 3.5L22 20H2z"/><path d="M12 10v4.5"/><circle cx="12" cy="17" r="0.4"/>',dice:'<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><circle cx="8.5" cy="8.5" r="1.4" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.4" fill="currentColor"/><circle cx="15.5" cy="8.5" r="1.4" fill="currentColor"/><circle cx="8.5" cy="15.5" r="1.4" fill="currentColor"/>',brand:'<path d="M12 2.5l2.4 5.6L20 10.5l-5.6 2.4L12 18.5l-2.4-5.6L4 10.5l5.6-2.4z"/>',sparkle:'<path d="M12 4l1.2 4.8L18 10l-4.8 1.2L12 16l-1.2-4.8L6 10l4.8-1.2z"/>'}[i],{width:String(e),height:String(e)})}function ja(i,e=26){let n=({1:[[12,12]],2:[[8,8],[16,16]],3:[[8,8],[12,12],[16,16]],4:[[8,8],[16,8],[8,16],[16,16]],5:[[8,8],[16,8],[12,12],[8,16],[16,16]],6:[[8,7],[16,7],[8,12],[16,12],[8,17],[16,17]]}[i]||[]).map(([s,r])=>`<circle cx="${s}" cy="${r}" r="1.7" fill="currentColor" stroke="none"/>`).join("");return Qr(`<rect x="3" y="3" width="18" height="18" rx="3.5"/>${n}`,{width:String(e),height:String(e)})}function bn(i,e,...t){return H("div",{class:"cr-panel"},H("div",{class:"cr-panel-head"},H("div",{class:"cr-panel-title",text:i}),e?H("div",{class:"cr-panel-sub",text:e}):null),...t)}function mt(i,e=""){return H("span",{class:`cr-chip ${e}`,text:i})}function K0(i){let e=Ja(i);return yn.filter(t=>e[t]!==0).map(t=>mt(`${Oi(e[t])} ${Ys[t].abbr}`,"gold"))}function Vd(i){let e=i.replace(/\(([a-c])\)\s*/gi,"").trim(),t=e.split(/\s+or\s+/i).map(s=>s.trim()).filter(Boolean),n=[];for(let s of t)if(s.includes(","))for(let r of s.split(",").map(a=>a.trim()).filter(Boolean))n.push(r);else n.push(s);return n.length?n:[e]}function Wd(i){let e=kn.find(t=>t.id===i.charClass);return e?e.equipment.map((t,n)=>{let s=Vd(t);return s[Math.min(i.equipChoices[n]??0,s.length-1)]}):[]}function qd(i,e){let t=H("canvas",{class:"cr-portrait-canvas",width:"512",height:"640"});return t.style.width=`${e}px`,t.style.height=`${Math.round(e*1.25)}px`,Od(t,{race:i.race||"Human",class:i.charClass||"Fighter",look:i.look,seed:Nd(i.name||"nameless")^23063}),t}function Z0(i,e){let t=e.state,n=H("div",{class:"cr-cards cr-race-grid"});for(let l of Ni)n.append(H("button",{class:`cr-card ${t.race===l.id?"sel":""}`,onclick:()=>e.update({race:l.id})},H("span",{class:"cr-card-mark"},Y0(l.id)),H("span",{class:"cr-card-name",text:l.id}),H("span",{class:"cr-card-meta"},...K0(l.id)),H("span",{class:"cr-card-flavor",text:l.flavor})));let s=H("div",{class:"cr-error",text:"A name of at least two letters, ash-born."});s.style.display="none";let r=H("div",{class:"cr-field"},H("label",{class:"cr-label",text:"Character Name"}),H("div",{class:"cr-name-row"},H("input",{class:"cr-input",type:"text",placeholder:"e.g. Osric of the Ash",maxlength:24,value:t.name,oninput:l=>{let c=l.target.value;e.patchSilent({name:c}),s.style.display=c.trim().length<2?"":"none"}}),H("button",{class:"cr-btn cr-btn-ghost cr-dice-btn",title:"Draw a name from the grave",onclick:()=>e.update({name:Fd[Math.floor(Math.random()*Fd.length)]})},ms("sparkle"))),s),a=Ni.find(l=>l.id===t.race),o=a?bn(a.id.toUpperCase(),a.flavor,H("div",{class:"cr-chiprow"},mt(`${a.speed} ft speed`),mt(a.size),a.darkvision?mt(`Darkvision ${a.darkvision} ft`):null,...a.languages.map(l=>mt(l)),a.subrace?mt(`Lineage: ${a.subrace.name}`,"gold"):null),a.traits.length?H("div",{class:"cr-traitlist"},...a.traits.map(l=>H("div",{class:"cr-trait"},H("div",{class:"cr-trait-name",text:l.name}),H("div",{class:"cr-trait-desc",text:l.desc})))):H("div",{class:"cr-panel-empty",text:"This bloodline carries its gifts by lineage \u2014 the details arrive with your subrace at the table."})):bn("CHOOSE A BLOODLINE","Every race remembers the Ashenreach differently.",H("div",{class:"cr-panel-empty",text:"Select a race to read its grim inheritance \u2014 ability bonuses, traits, and the speed of its blood."}));i.append(H("div",{class:"cr-cols"},H("div",{class:"cr-main"},r,H("div",{class:"cr-label",text:"Bloodline"}),n),H("div",{class:"cr-aside"},o)))}function J0(i,e){let t=e.state,n=H("div",{class:"cr-cards cr-class-grid"});for(let a of kn)n.append(H("button",{class:`cr-card cr-class-card ${t.charClass===a.id?"sel":""}`,onclick:()=>e.update({charClass:a.id,subclass:"",equipChoices:{}})},H("span",{class:"cr-card-mark sigil"},Gd(a.sigil,34)),H("span",{class:"cr-card-name",text:a.id}),H("span",{class:"cr-card-meta"},mt(`d${a.hitDie} hit die`),mt(a.primary.join(" or "))),H("span",{class:"cr-card-flavor",text:a.flavor})));let s=kn.find(a=>a.id===t.charClass),r=s?bn(s.id.toUpperCase(),s.flavor,H("div",{class:"cr-chiprow"},mt(`Hit die d${s.hitDie}`,"gold"),mt(`Primary: ${s.primary.join(" / ")}`),mt(`Saves: ${s.saves.join(", ")}`),s.skills?mt(`${s.skills.count} skills of choice`):null,jr(s.id)?mt("path chosen next","gold"):mt("path at level 3")),H("div",{class:"cr-block"},H("div",{class:"cr-block-title",text:"Proficiencies"}),s.armor.length?H("div",{class:"cr-kv"},H("b",{text:"Armor"}),H("span",{text:s.armor.join(", ")})):null,H("div",{class:"cr-kv"},H("b",{text:"Weapons"}),H("span",{text:s.weapons.join(", ")})),s.tools.length?H("div",{class:"cr-kv"},H("b",{text:"Tools"}),H("span",{text:s.tools.join(", ")})):null),H("div",{class:"cr-block"},H("div",{class:"cr-block-title",text:"Level 1 Features"}),...s.features.map(a=>H("div",{class:"cr-trait"},H("div",{class:"cr-trait-name",text:a.name}),H("div",{class:"cr-trait-desc",text:a.desc})))),s.spellNote?H("div",{class:"cr-spellnote"},ms("sparkle"),H("span",{text:`${s.spellAbility} spellcasting \u2014 ${s.spellNote}`})):null,jr(s.id)?null:H("div",{class:"cr-hint",text:"Your path (subclass) is chosen at 3rd level \u2014 the forge records it then."})):bn("CHOOSE A CALLING","Steel, shadow, or something older.",H("div",{class:"cr-panel-empty",text:"Select a class to study its hit die, proficiencies, and first-flame features."}));i.append(H("div",{class:"cr-cols"},H("div",{class:"cr-main"},n),H("div",{class:"cr-aside"},r)))}function j0(i,e){let t=e.state,n=fs[t.charClass]||[],s=kn.find(l=>l.id===t.charClass);if(!n.length){i.append(H("div",{class:"cr-cols"},H("div",{class:"cr-main"},bn("THE PATH FORKS AT 3RD LEVEL",s?`${s.flavor} Your specialization is chosen at 3rd level, when the wound has scarred over.`:"",H("div",{class:"cr-panel-empty",text:"Nothing to choose here yet \u2014 step onward."})))));return}let r=H("div",{class:"cr-cards cr-sub-grid"});for(let l of n)r.append(H("button",{class:`cr-card cr-sub-card ${t.subclass===l.id?"sel":""}`,onclick:()=>e.update({subclass:l.id})},H("span",{class:"cr-card-mark sigil"},Gd(s?s.sigil:"spark",30)),H("span",{class:"cr-card-name",text:l.name}),H("span",{class:"cr-card-meta"},mt(l.feature.name,"gold")),H("span",{class:"cr-card-flavor",text:l.flavor})));let a=n.find(l=>l.id===t.subclass),o=a?bn(a.name.toUpperCase(),a.flavor,H("div",{class:"cr-chiprow"},mt(`${t.charClass} path`,"gold"),mt(a.feature.name)),H("div",{class:"cr-trait"},H("div",{class:"cr-trait-name",text:`Level 1 \u2014 ${a.feature.name}`}),H("div",{class:"cr-trait-desc",text:a.feature.desc})),H("div",{class:"cr-hint",text:"The forge sends your path with the character sheet; the wider powers awaken as you level."})):bn("CHOOSE A PATH","The first fork of the calling.",H("div",{class:"cr-panel-empty",text:"Each path grants a different first gift. Study them before you swear."}));i.append(H("div",{class:"cr-cols"},H("div",{class:"cr-main"},r),H("div",{class:"cr-aside"},o)))}function Q0(i,e){let t=e.state,n=t.race||"Human",s=Ja(n),r=Mc(t.base,n),a=kn.find(v=>v.id===t.charClass),o=H("div",{class:"cr-tabs"},H("button",{class:`cr-tab ${t.mode==="pointbuy"?"sel":""}`,onclick:()=>l("pointbuy")},"POINT BUY"),H("button",{class:`cr-tab ${t.mode==="roll"?"sel":""}`,onclick:()=>l("roll")},"ROLL 4d6"),H("button",{class:`cr-tab ${t.mode==="pool"?"sel":""}`,onclick:()=>l("pool")},"ASSIGN POOL"));function l(v){let y={mode:v};if(v==="pointbuy"){let w={...t.base};for(let _ of yn)w[_]=Math.max(8,Math.min(15,w[_]));y.base=w,y.pool=[],y.rolled=!1,y.dice={}}else v==="roll"?(y.pool=[],y.dice={},y.rolled=!1):(y.dice={},y.rolled=!1,t.pool.length===0&&!Object.keys(t.dice).length&&(y.pool=[]));e.update(y)}let c=[],h=(v,y,w)=>c.push(H("div",{class:"cr-stat"},H("div",{class:"cr-stat-num",text:String(y)}),H("div",{class:"cr-stat-label",text:v}),w?H("div",{class:"cr-stat-note",text:w}):null));if(a){if(h("Hit Points",_c(a.id,r.con),`d${a.hitDie} + CON`),h("Armor Class",wc(a.id,Wd(t),r.dex,r.con,r.wis),"from starting kit"),h("Initiative",Oi(Ln(r.dex)),"DEX modifier"),h("Speed",(Ni.find(v=>v.id===n)?.speed??30)+" ft",n),a.spellAbility){let v=a.spellAbility.slice(0,3).toLowerCase();h("Spell DC",10+Ln(r[v]),a.spellAbility)}h("Proficiency","+2","level 1")}let u;if(t.mode==="pointbuy"){let v=Za(t.base),y=Ka-v;u=bn("POINTS OF FATE","Twenty-seven points, scores 8\u201315.",H("div",{class:"cr-points"},H("div",{class:`cr-points-num ${y===0?"ok":y<0?"bad":""}`,text:String(y)}),H("div",{class:"cr-points-label",text:"points unspent"})),H("button",{class:"cr-btn cr-btn-ghost cr-full",onclick:()=>p(),title:"Place the standard array on your best abilities"},ms("sparkle"),"SUGGEST THE STANDARD ARRAY"),H("div",{class:"cr-cost-table"},H("span",{text:"Cost:"}),...[8,9,10,11,12,13,14,15].map(w=>H("span",{class:"cr-cost-cell",text:`${w}\xB7${{8:0,9:1,10:2,11:3,12:4,13:5,14:7,15:9}[w]}`}))))}else t.mode==="roll"?u=bn("THE BONES","4d6, drop the lowest, in order. Rerolling is between you and the dark.",H("button",{class:"cr-btn cr-btn-primary cr-full",onclick:()=>g()},ms("dice"),t.rolled?"ROLL AGAIN":"CAST THE DICE"),t.rolled?H("div",{class:"cr-hint",text:"The bones have spoken. Rearrangement belongs to the pool mode."}):H("div",{class:"cr-hint",text:"Each row rolls its own 4d6 \u2014 lowest die struck through."})):u=bn("THE POOL","Roll six fates, then set them where they belong.",H("button",{class:"cr-btn cr-btn-primary cr-full",onclick:()=>b()},ms("dice"),"ROLL THE POOL"),H("div",{class:"cr-pool"},...t.pool.map((v,y)=>H("button",{class:"cr-pool-chip",text:String(v),onclick:()=>f(y)})),t.pool.length===0&&Object.values(t.base).every(v=>v>0)?H("div",{class:"cr-hint ok",text:"The pool is spent. Fate is written."}):null),H("div",{class:"cr-hint",text:"Pick a value, then press an ability to set it. Press a set ability to return it."}));let d=-1;function f(v){d=v,i.querySelectorAll(".cr-pool-chip").forEach((y,w)=>y.classList.toggle("sel",w===v)),i.querySelectorAll(".cr-abil-row").forEach(y=>y.classList.add("target"))}function g(){let v=i.querySelectorAll(".cr-abil-row"),y={},w={...t.base};for(let _ of yn){let M=Sc();y[_]=M.dice,w[_]=M.total}v.forEach((_,M)=>{_.classList.add("rolling");let T=_.querySelectorAll(".cr-die"),L=performance.now()+M*90,S=560,E=window.setInterval(()=>{let D=(performance.now()-L)/S;if(T.forEach(O=>{O.replaceChildren(ja(1+Math.floor(Math.random()*6))),O.classList.remove("dropped")}),performance.now()-L>S){window.clearInterval(E);let O=yn[M],F=(y[O]||[]).slice().sort((W,B)=>W-B);T.forEach((W,B)=>{W.replaceChildren(ja(F[B])),W.classList.toggle("dropped",B===0)}),_.classList.remove("rolling")}},70)}),window.setTimeout(()=>e.update({base:w,dice:y,rolled:!0}),560+5*90+80)}function b(){let v=Array.from({length:6},()=>Sc().total).sort((y,w)=>w-y);e.update({pool:v,base:{str:0,dex:0,con:0,int:0,wis:0,cha:0}})}function p(){let v=kn.find(T=>T.id===t.charClass),y=[],w=T=>{T&&!y.includes(T)&&y.push(T)};if(v){for(let T of v.primary)w(T.slice(0,3).toLowerCase());w("con"),w("dex");for(let T of yn)w(T)}else y.push(...yn);let _=[15,14,13,12,10,8],M={str:8,dex:8,con:8,int:8,wis:8,cha:8};y.slice(0,6).forEach((T,L)=>{M[T]=_[L]}),e.update({base:M})}let m=H("div",{class:"cr-abil-table"});for(let v of yn){let y=Ys[v],w;if(t.mode==="pointbuy")w=H("div",{class:"cr-stepper"},H("button",{class:"cr-step-btn",disabled:t.base[v]<=8,onclick:()=>x(v,-1),text:"\u2013"}),H("span",{class:"cr-step-val",text:String(t.base[v])}),H("button",{class:"cr-step-btn",disabled:t.base[v]>=15,onclick:()=>x(v,1),text:"+"}));else if(t.mode==="roll"){let _=(t.dice[v]||[]).slice().sort((M,T)=>M-T);w=H("div",{class:"cr-dice-row"},...t.rolled&&_.length===4?_.map((M,T)=>H("span",{class:`cr-die ${T===0?"dropped":""}`},ja(M))):Array.from({length:4},()=>H("span",{class:"cr-die blank"},ja(1+Math.floor(Math.random()*6)))),H("span",{class:"cr-die-sum",text:t.rolled&&_.length===4?String(t.base[v]):"\xB7"}))}else{let _=t.base[v]>0;w=H("button",{class:`cr-pool-slot ${_?"set":""}`,onclick:()=>{if(d>=0&&t.pool[d]!==void 0){let M=t.pool.slice(),T=M.splice(d,1)[0],L={...t.base,[v]:T};d=-1,e.update({pool:M,base:L})}else if(_){let M=[...t.pool,t.base[v]],T={...t.base,[v]:0};e.update({pool:M,base:T})}}},_?String(t.base[v]):"\u2014 set \u2014")}m.append(H("div",{class:"cr-abil-row"},H("div",{class:"cr-abil-name"},H("b",{text:y.name}),H("span",{class:"cr-abbr",text:y.abbr}),H("span",{class:"cr-abil-affects",text:y.affects.slice(0,3).join(" \xB7 ")})),w,s[v]!==0?H("span",{class:"cr-asi-chip",text:`${Oi(s[v])} ${t.race||"race"}`}):H("span",{class:"cr-asi-chip dim",text:"\xB10"}),H("span",{class:"cr-abil-final",text:t.base[v]>0?String(r[v]):"\xB7"}),H("span",{class:"cr-abil-mod",text:t.base[v]>0?Oi(Ln(r[v])):"\xB7"})))}function x(v,y){let w=t.base[v]+y;w<8||w>15||Za({...t.base,[v]:w})>Ka||e.update({base:{...t.base,[v]:w}})}i.append(H("div",{class:"cr-cols"},H("div",{class:"cr-main"},o,m),H("div",{class:"cr-aside"},u,bn("THE MATH","What the numbers move.",H("div",{class:"cr-statgrid"},...c)))))}function eg(i,e){let t=e.state,n=t.look,s=(c,h,u)=>H("div",{class:"cr-seg"},...c.map(d=>H("button",{class:h()===d.v?"sel":"",onclick:()=>u(d.v)},H("span",{text:d.label}),d.sub?H("small",{text:d.sub}):null))),r=(c,h,u)=>H("div",{class:"cr-swatches"},...c.map((d,f)=>{let g=H("button",{class:`cr-swatch ${h()===f?"sel":""}`,title:d.name,onclick:()=>u(f)});return g.style.background=d.iris?`radial-gradient(circle at 35% 32%, ${d.glow}, ${d.iris} 55%, #000 140%)`:`linear-gradient(150deg, ${d.light||d.base}, ${d.base} 55%, ${d.shadow||d.base})`,g})),a=c=>{let h=['<path d="M5 9q7-8 14 0"/><path d="M5 9q2 3 7 3t7-3"/>','<circle cx="12" cy="7" r="3.4"/><path d="M8 10q4 5 8 0"/><path d="M12 10v7"/>','<path d="M6 6q6-6 12 0"/><path d="M6 6q-2 8 1 14M18 6q2 8-1 14"/>','<path d="M6 6q6-6 12 0"/><path d="M7 7l-1.6 3.2L7 13l-1.6 3.2L7 19M17 7l1.6 3.2L17 13l1.6 3.2L17 19"/>','<path d="M6 9q6-5 12 0"/>'];return Qr(h[c]||h[0],{width:"26",height:"26"})},o={none:"Unmarked",scars:"Scars",runes:"Runes",warpaint:"Warpaint"};i.append(H("div",{class:"cr-cols cr-visage"},H("div",{class:"cr-portrait-col"},H("div",{class:"cr-portrait-frame"},qd(t,300)),H("div",{class:"cr-portrait-cap"},H("div",{class:"cr-portrait-name",text:t.name.trim()||"The Nameless"}),H("div",{class:"cr-portrait-sub",text:`${t.race||"\u2014"} \xB7 ${t.charClass||"\u2014"}${t.subclass?` \xB7 ${t.subclass}`:""}`}))),H("div",{class:"cr-main cr-visage-controls"},H("div",{class:"cr-ctrl"},H("div",{class:"cr-label",text:"Frame"}),s([{v:"slim",label:"Slim"},{v:"normal",label:"Normal"},{v:"heavy",label:"Heavy"}],()=>n.bodyType,c=>l({bodyType:c}))),H("div",{class:"cr-ctrl"},H("div",{class:"cr-label",text:"Skin \u2014 tones of the ash"}),r(Ui,()=>n.skinTone,c=>l({skinTone:c}))),H("div",{class:"cr-ctrl"},H("div",{class:"cr-label",text:"Hair"}),H("div",{class:"cr-style-cards"},...Ks.map((c,h)=>H("button",{class:`cr-style-card ${n.hairStyle===h?"sel":""}`,title:c,onclick:()=>l({hairStyle:h})},a(h),H("span",{text:c}))))),H("div",{class:"cr-ctrl"},H("div",{class:"cr-label",text:"Hair Color"}),r(Fi,()=>n.hairColor,c=>l({hairColor:c}))),H("div",{class:"cr-ctrl"},H("div",{class:"cr-label",text:"Eyes \u2014 what catches the light"}),r(Bi,()=>n.eyeColor,c=>l({eyeColor:c}))),H("div",{class:"cr-ctrl"},H("div",{class:"cr-label",text:"Cloak"}),r(zi,()=>n.cloakColor,c=>l({cloakColor:c}))),H("div",{class:"cr-ctrl"},H("div",{class:"cr-label",text:"Face Decor"}),s(["none","scars","runes","warpaint"].map(c=>({v:c,label:o[c]})),()=>n.faceDecor,c=>l({faceDecor:c}))))));function l(c){e.update({look:{...n,...c}})}}function tg(i,e){let t=e.state,n=H("div",{class:"cr-cards cr-bg-grid"});for(let l of ps)n.append(H("button",{class:`cr-card cr-bg-card ${t.background===l.id?"sel":""}`,onclick:()=>e.update({background:l.id})},H("span",{class:"cr-card-name",text:l.id}),H("span",{class:"cr-card-meta"},...l.skills.map(c=>mt(c))),H("span",{class:"cr-card-flavor",text:l.flavor})));let s=ps.find(l=>l.id===t.background),r=s?bn(s.id.toUpperCase(),s.flavor,H("div",{class:"cr-chiprow"},...s.skills.map(l=>mt(l,"gold")),...s.tools.map(l=>mt(l)),s.languages?mt(`${s.languages} extra language${s.languages>1?"s":""}`):null),H("div",{class:"cr-trait"},H("div",{class:"cr-trait-name",text:`Feature \u2014 ${s.feature.name}`}),H("div",{class:"cr-trait-desc",text:s.feature.desc})),H("div",{class:"cr-block"},H("div",{class:"cr-block-title",text:"Keepsakes"}),H("ul",{class:"cr-equip-list"},...s.equipment.map(l=>H("li",{text:l}))))):bn("CLAIM A PAST","What were you, before the Reach called?",H("div",{class:"cr-panel-empty",text:"Pick a background \u2014 its skills, feature and keepsakes are yours."})),a=kn.find(l=>l.id===t.charClass),o=a?bn(`${a.id.toUpperCase()} \u2014 FIELD KIT`,"Choose between the alternatives; packs expand to their contents.",...a.equipment.map((l,c)=>{let h=Vd(l);if(h.length<=1)return H("div",{class:"cr-equip-row"},H("span",{class:"cr-equip-bullet"}),H("span",{text:h[0]}),Bd(h[0]));let u=Math.min(t.equipChoices[c]??0,h.length-1);return H("div",{class:"cr-equip-row choice"},H("div",{class:"cr-equip-opts"},...h.map((d,f)=>H("button",{class:`cr-equip-opt ${f===u?"sel":""}`,onclick:()=>e.update({equipChoices:{...t.equipChoices,[c]:f}})},H("span",{text:`(${String.fromCharCode(97+f)})`}),H("span",{text:d})))),Bd(h[u]))})):null;i.append(H("div",{class:"cr-cols"},H("div",{class:"cr-main"},n),H("div",{class:"cr-aside"},r,o)))}function Bd(i){let e=i.toLowerCase(),t=Object.keys(xc).find(n=>e.includes(n.toLowerCase()));return t?H("div",{class:"cr-equip-pack"},H("div",{class:"cr-equip-pack-title",text:`${t} contains:`}),H("div",{class:"cr-equip-pack-items",text:xc[t].join(" \xB7 ")})):null}function ng(i,e){let t=e.state,n=Mc(t.base,t.race||"Human"),s=kn.find(u=>u.id===t.charClass),r=Ni.find(u=>u.id===t.race),a=ps.find(u=>u.id===t.background),o=(fs[t.charClass]||[]).find(u=>u.id===t.subclass)||null,l=Wd(t),c=[mt(t.look.bodyType,""),mt(Ui[t.look.skinTone%Ui.length].name),mt(`${Ks[t.look.hairStyle%Ks.length]} hair, ${Fi[t.look.hairColor%Fi.length].name}`),mt(`${Bi[t.look.eyeColor%Bi.length].name} eyes`),mt(`${zi[t.look.cloakColor%zi.length].name} cloak`),mt(t.look.faceDecor==="none"?"unmarked face":t.look.faceDecor)],h=H("div",{class:"cr-sheet"},H("div",{class:"cr-sheet-head"},H("div",{class:"cr-sheet-name",text:t.name.trim()||"The Nameless"}),H("div",{class:"cr-sheet-sub",text:`Level 1 ${t.race||"\u2014"} ${t.charClass||"\u2014"}${o?` \xB7 ${o.name}`:""} \xB7 ${t.background||"\u2014"}`})),H("div",{class:"cr-sheet-abil"},...yn.map(u=>H("div",{class:"cr-sheet-abil-cell"},H("div",{class:"cr-sheet-abbr",text:Ys[u].abbr}),H("div",{class:"cr-sheet-score",text:String(n[u])}),H("div",{class:"cr-sheet-mod",text:Oi(Ln(n[u]))})))),H("div",{class:"cr-statgrid review"},H("div",{class:"cr-stat"},H("div",{class:"cr-stat-num",text:String(s?_c(s.id,n.con):"\xB7")}),H("div",{class:"cr-stat-label",text:"Hit Points"})),H("div",{class:"cr-stat"},H("div",{class:"cr-stat-num",text:String(s?wc(s.id,l,n.dex,n.con,n.wis):"\xB7")}),H("div",{class:"cr-stat-label",text:"Armor Class"})),H("div",{class:"cr-stat"},H("div",{class:"cr-stat-num",text:Oi(Ln(n.dex))}),H("div",{class:"cr-stat-label",text:"Initiative"})),H("div",{class:"cr-stat"},H("div",{class:"cr-stat-num",text:`${r?.speed??30} ft`}),H("div",{class:"cr-stat-label",text:"Speed"})),H("div",{class:"cr-stat"},H("div",{class:"cr-stat-num",text:"+2"}),H("div",{class:"cr-stat-label",text:"Proficiency"})),...s?.spellAbility?(()=>{let u=s.spellAbility.slice(0,3).toLowerCase();return[H("div",{class:"cr-stat"},H("div",{class:"cr-stat-num",text:String(10+Ln(n[u]))}),H("div",{class:"cr-stat-label",text:`Spell DC (${Ys[u].abbr})`}))]})():[]),s?H("div",{class:"cr-block"},H("div",{class:"cr-block-title",text:"Saving Throws"}),H("div",{class:"cr-chiprow"},...yn.map(u=>{let d=s.saves.some(g=>g.toLowerCase()===u),f=Ln(n[u])+(d?2:0);return mt(`${Ys[u].abbr} ${Oi(f)}${d?" \u25CF":""}`,d?"gold":"")}))):null,s?H("div",{class:"cr-block"},H("div",{class:"cr-block-title",text:"Features at Level 1"}),H("div",{class:"cr-chiprow"},...s.features.map(u=>mt(u.name,"gold"))),o?H("div",{class:"cr-chiprow"},mt(`${o.feature.name} (${o.name})`,"gold")):null,a?H("div",{class:"cr-chiprow"},mt(`${a.feature.name} (${a.id})`)):null,r?H("div",{class:"cr-chiprow"},...r.traits.map(u=>mt(u.name))):null):null,H("div",{class:"cr-block"},H("div",{class:"cr-block-title",text:"Kit & Keepsakes"}),H("ul",{class:"cr-equip-list review"},...l.map(u=>H("li",{text:u})),...a?a.equipment.map(u=>H("li",{text:u})):[])));i.append(H("div",{class:"cr-cols cr-oath"},H("div",{class:"cr-portrait-col"},H("div",{class:"cr-portrait-frame"},qd(t,240)),H("div",{class:"cr-portrait-cap"},H("div",{class:"cr-portrait-name",text:t.name.trim()||"The Nameless"}),H("div",{class:"cr-lookchips"},...c))),H("div",{class:"cr-main"},H("div",{class:"cr-oath-actions"},H("button",{class:"cr-btn cr-btn-ghost",onclick:()=>e.exportJSON()},ms("download"),"EXPORT JSON"),H("label",{class:"cr-btn cr-btn-ghost cr-file-btn"},ms("upload"),"IMPORT JSON",H("input",{type:"file",accept:".json,application/json",onchange:u=>{let d=u.target.files?.[0];if(!d)return;let f=new FileReader;f.onload=()=>{let g=e.importJSONText(String(f.result||""));g.ok||alert(`The scroll is flawed:
`+g.errors.join(`
`))},f.readAsText(d)}}))),h)))}function $d(i,e){switch(i.replaceChildren(),e.state.step){case 0:Z0(i,e);break;case 1:J0(i,e);break;case 2:j0(i,e);break;case 3:Q0(i,e);break;case 4:eg(i,e);break;case 5:tg(i,e);break;case 6:ng(i,e);break}}function eo(i){switch(i.step){case 0:return i.name.trim().length<2?{ok:!1,hint:"Give your shadow a name."}:i.race?{ok:!0,hint:""}:{ok:!1,hint:"Choose a bloodline."};case 1:return i.charClass?{ok:!0,hint:""}:{ok:!1,hint:"Choose a calling."};case 2:return jr(i.charClass)?i.subclass?{ok:!0,hint:""}:{ok:!1,hint:"Choose your path."}:{ok:!0,hint:""};case 3:{if(i.mode==="pointbuy"){let e=Ka-Za(i.base);if(e>0)return{ok:!1,hint:`${e} fate points unspent.`};if(e<0)return{ok:!1,hint:"Too many fate points spent."}}if(i.mode==="roll"&&!i.rolled)return{ok:!1,hint:"Cast the dice before you go on."};if(i.mode==="pool"){if(i.pool.length===0&&yn.every(e=>i.base[e]<=0))return{ok:!1,hint:"Roll the pool, then set your fate."};if(i.pool.length>0)return{ok:!1,hint:"The pool still holds fates."};if(yn.some(e=>i.base[e]<=0))return{ok:!1,hint:"Every ability needs a value."}}return{ok:!0,hint:""}}case 4:return{ok:!0,hint:""};case 5:return i.background?{ok:!0,hint:""}:{ok:!1,hint:"Claim a past."};default:return{ok:!0,hint:""}}}var q0,Qa,$0,Ud,X0,Fd,Xd=za(()=>{"use strict";Ec();Ac();q0=2,Qa=[{id:"origin",label:"Origin",title:"Name Your Shadow",sub:"Every ash-born soul arrives nameless. Choose what the world will whisper.",rune:"M8 3v18M8 5l8-2M8 11l8-2"},{id:"calling",label:"Calling",title:"Choose Your Calling",sub:"Not a class \u2014 a wound, a gift, a burden. Decide how you fight the dark.",rune:"M9 21V3M9 3h5q3 2 0 6H9M11 12l5 9"},{id:"path",label:"Path",title:"Choose Your Path",sub:"Your calling demands a choice before the first wound. Take the path \u2014 or note where it forks.",rune:"M12 3v7M12 10l-6 5M12 10l6 5"},{id:"fate",label:"Fate",title:"Weave Your Fate",sub:"Twenty-seven points of light, or trust the dice. The bones never lie twice.",rune:"M7 3v18M7 3l10 5L7 13"},{id:"visage",label:"Visage",title:"Shape Your Visage",sub:"The face the dark will learn to fear. Paint it in ember and ash.",rune:"M12 21V8M12 8L6 3M12 8l6-5"},{id:"past",label:"Past",title:"Claim Your Past",sub:"No one walks into the Ashenreach by accident. Say what you were before.",rune:"M12 3l6 6-6 6-6-6zM8 13l-3 8M16 13l3 8"},{id:"oath",label:"Oath",title:"Speak the Oath",sub:"Read the ledger of your soul. Then step through, and do not look back.",rune:"M4 8l16 8M20 8L4 16"}];$0="http://www.w3.org/2000/svg";Ud={human:'<circle cx="12" cy="8" r="4"/><path d="M4.5 19.5q7.5-8 15 0"/>',elf:'<path d="M9 3.5q8 2.5 7 13-6-4-7-13z"/><path d="M11 10l3.5 1.5"/>',dwarf:'<path d="M4 18.5h16"/><path d="M7 18.5L10 7l3 5 2-7 2 13.5"/>',halfling:'<circle cx="8" cy="9.5" r="3.2"/><circle cx="16" cy="9.5" r="3.2"/><circle cx="12" cy="15" r="3.2"/>',orc:'<path d="M9 5.5q-2 7 2 13M15 5.5q2 7-2 13"/><path d="M7 5q5-2.5 10 0"/>',horns:'<path d="M7 4q-3 7 2.5 11M17 4q3 7-2.5 11"/><path d="M7 4q5-2.5 10 0"/><circle cx="12" cy="12.5" r="3"/>',halo:'<circle cx="12" cy="8" r="4"/><path d="M6 4q6-3 12 0"/><path d="M4.5 19.5q7.5-6 15 0"/>',scale:'<path d="M12 3l7 5-3 9H8L5 8z"/><path d="M9 17l-1.5 4M15 17l1.5 4"/>',serpent:'<path d="M5 18q4 3 7 0t7 0"/><circle cx="17.5" cy="12.5" r="1.8"/><path d="M5 18q-2-1-1.5-4"/>',wing:'<path d="M12 5v13"/><path d="M12 6L4 4q-2 8 8 10M12 6l8-2q2 8-8 10"/>',beast:'<path d="M8 5q-3 3 0 7M16 5q3 3 0 7"/><circle cx="12" cy="14" r="4"/>',leaf:'<path d="M19 5C10 5 5 10 5 15c0 2.5 1.5 4 4 4 5.5 0 10-5 10-14z"/><path d="M9 19c1.5-5 4-8.5 8-11"/>',element:'<path d="M12 3q6 6 0 9t0 9"/><path d="M12 6.5q-4 3.5 0 6t0 6"/>',construct:'<rect x="6.5" y="7.5" width="11" height="9" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M9.5 3v4M14.5 3v4M9.5 16.5v4M14.5 16.5v4"/>',amorph:'<path d="M12 4q6 1 7 7-1 6-7 8-6-2-7-8 1-6 7-7z"/><circle cx="9.5" cy="11" r="1.4"/><circle cx="14.5" cy="13" r="1.4"/>'},X0={Human:"human","Half-Elf":"human","Custom Lineage":"human",Reborn:"human",Giff:"human",Elf:"elf","Astral Elf":"elf",Aasimar:"halo",Owlin:"wing",Fairy:"wing",Dwarf:"dwarf",Halfling:"halfling",Gnome:"halfling","Deep Gnome":"halfling",Goblin:"halfling",Kobold:"halfling",Verdan:"halfling",Autognome:"construct","Half-Orc":"orc",Orc:"orc",Goliath:"orc",Bugbear:"orc",Hobgoblin:"orc",Leonin:"orc","Thri-kreen":"orc",Harengon:"beast",Tabaxi:"beast",Satyr:"beast",Hadozee:"beast",Tiefling:"horns",Hexblood:"horns",Dhampir:"horns",Dragonborn:"scale","Gem Dragonborn":"scale",Lizardfolk:"scale","Yuan-ti Pureblood":"serpent",Aarakocra:"wing",Kenku:"wing",Firbolg:"leaf",Genasi:"element",Plasmoid:"amorph"};Fd=["Osric","Mara","Thorne","Vesper","Kael","Isolde","Bram","Sera","Dain","Lyra","Corvus","Elowen","Hask","Nyra","Aldric","Runa","Grimm","Selene","Varek","Wren"]});var jd={};$m(jd,{mountCreation:()=>Cc,validateCharacterDef:()=>Zd});function Cc(i,e){Kd(),Gi&&Gi.dispose(),Gi=ig(i,e)}function Kd(){if(!(Yd||typeof document>"u")){if(!document.getElementById("ar-create-css")){let i=document.createElement("link");i.id="ar-create-css",i.rel="stylesheet",i.href="/create.css",document.head.append(i)}Yd=!0}}function ig(i,e){let t=zd();e.name&&(t.name=e.name.trim().slice(0,24));let n=H("div",{class:"cr-steps"}),s=H("div",{class:"cr-step-title"}),r=H("div",{class:"cr-step-sub"}),a=H("div",{class:"cr-step-content"}),o=H("div",{class:"cr-hint"}),l=H("button",{class:"cr-btn cr-btn-back",onclick:()=>v(-1)},"BACK"),c=H("button",{class:"cr-btn cr-btn-primary",onclick:()=>v(1)},"NEXT");function h(){let M=(fs[t.charClass]||[]).some(T=>T.id===t.subclass)?t.subclass:void 0;return{name:t.name.trim(),race:t.race,class:t.charClass,...M?{subclass:M}:{},level:1,abilities:{...t.base},background:t.background,look:{...t.look}}}let u={state:t,update:m,patchSilent:x,goTo:M=>{let T=Zs(t),L=T[0],S=T[T.length-1];t.step=Math.max(L,Math.min(S,M)),_()},buildDef:h,exportJSON:d,importJSONText:rg};function d(){let M=h(),T=JSON.stringify({format:"ashenreach.character",version:1,def:M},null,2),L=document.createElement("a");L.href=URL.createObjectURL(new Blob([T],{type:"application/json"})),L.download=`ashenreach-${M.name.toLowerCase().replace(/[^a-z0-9]+/g,"-")||"nameless"}.json`,L.click(),setTimeout(()=>URL.revokeObjectURL(L.href),4e3)}let f=H("div",{class:"cr-root"},H("div",{class:"cr-frame"},H("header",{class:"cr-header"},H("div",{class:"cr-brand"},H("span",{class:"cr-brand-mark",html:'<svg viewBox="0 0 32 32" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M16 4l3.2 8.8L28 16l-8.8 3.2L16 28l-3.2-8.8L4 16l8.8-3.2z"/></svg>'}),H("span",{class:"cr-brand-text"},H("b",{text:"ASHENREACH"}),H("small",{text:"Character Forge"}))),n,e.onCancel?H("button",{class:"cr-btn cr-btn-ghost cr-cancel",onclick:()=>{e.onCancel?.()}},"ABANDON"):H("span",{class:"cr-header-spacer"})),H("section",{class:"cr-body"},H("div",{class:"cr-step-head"},s,r),a),H("footer",{class:"cr-footer"},o,H("div",{class:"cr-footer-nav"},l,c))));i.append(f);let g=M=>{M.target?.tagName!=="INPUT"&&(M.key==="Enter"&&v(1),M.key==="Escape"&&e.onCancel&&e.onCancel())};document.addEventListener("keydown",g);function b(){document.removeEventListener("keydown",g),f.remove(),Gi&&Gi.root===f&&(Gi=null)}function p(M){Object.assign(t,{name:M.name,race:M.race,charClass:M.class,subclass:M.subclass||"",mode:"pool",pool:[],rolled:!1,dice:{},base:{...M.abilities},look:{...M.look},background:M.background,equipChoices:{}});let T=Zs(t);t.step=T[T.length-1],_()}function m(M){Object.assign(t,M),y(),w()}function x(M){Object.assign(t,M),y()}function v(M){let T=eo(t),L=Zs(t),S=L.indexOf(t.step);if(M>0){if(!T.ok)return;if(S<0||S>=L.length-1){let E=h();b(),e.onDone(E);return}t.step=L[S+1]}else M<0&&S>0&&(t.step=L[S-1]);_()}function y(){let M=eo(t),T=Zs(t),L=t.step===T[T.length-1],S=t.step===T[0];o.textContent=M.ok?"":M.hint,o.classList.toggle("show",!M.ok),l.disabled=S,c.textContent=L?"BEGIN THE REACH":"NEXT",c.classList.toggle("begin",L),c.disabled=!M.ok}function w(){a.classList.remove("anim"),$d(a,u),a.offsetWidth,a.classList.add("anim")}function _(){let M=Qa[t.step];s.textContent=M.title,r.textContent=M.sub;let T=Zs(t),L=T.indexOf(t.step),S=L>=0?T[L+1]:void 0;n.replaceChildren(...T.map(E=>{let D=Qa[E],O=E<t.step?"done":E===t.step?"cur":"next";return H("div",{class:`cr-step ${O}`,role:"button",onclick:()=>{(E<t.step||E===S&&eo(t).ok)&&u.goTo(E)}},H("span",{class:"cr-step-rune",html:`<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${D.rune}"/></svg>`}),H("span",{class:"cr-step-label",text:D.label.toUpperCase()}))})),w(),y()}return _(),{root:f,dispose:b,applyDef:p}}function Zd(i){let e=[];if(typeof i!="object"||i===null)return{ok:!1,def:null,errors:["Not a character scroll (JSON object expected)."]};let t=i,n=t.format==="ashenreach.character"&&t.def&&typeof t.def=="object"?t.def:t,s=typeof n.name=="string"?n.name.trim().slice(0,24):"";s.length<2&&e.push("Name must be at least two letters.");let r=String(n.race||"");Ni.some(y=>y.id===r)||e.push(`Unknown race "${r}".`);let a=String(n.class??n.charClass??"");kn.some(y=>y.id===a)||e.push(`Unknown class "${a}".`);let o,l=n.subclass??n.subclassName??n.path;if(l!=null&&String(l).trim()!==""){let y=String(l).trim();(fs[a]||[]).some(w=>w.id===y)?o=y:e.push(`Unknown ${a||"class"} path "${y}".`)}let c=Math.max(1,Math.min(20,Math.round(Number(n.level??1))||1)),h=String(n.background||"");ps.some(y=>y.id===h)||e.push(`Unknown background "${h}".`);let u=n.abilities??{},d={str:10,dex:10,con:10,int:10,wis:10,cha:10};for(let y of sg){let w=Number(u[y]);!Number.isFinite(w)||w<1||w>20?e.push(`Ability ${y.toUpperCase()} must be a number 1\u201320.`):d[y]=Math.round(w)}let f=n.look??{},g=["slim","normal","heavy"],b=g.includes(String(f.bodyType))?f.bodyType:"normal";f.bodyType!==void 0&&!g.includes(String(f.bodyType))&&e.push("bodyType must be slim | normal | heavy.");let p=(y,w)=>{let _=Math.round(Number(y));return Number.isFinite(_)&&_>=0?Math.min(_,w):0},m=["none","scars","runes","warpaint"],x=m.includes(String(f.faceDecor))?f.faceDecor:"none";f.faceDecor!==void 0&&!m.includes(String(f.faceDecor))&&e.push("faceDecor must be none | scars | runes | warpaint.");let v={bodyType:b,skinTone:p(f.skinTone,Ui.length-1),hairStyle:p(f.hairStyle,Ks.length-1),hairColor:p(f.hairColor,Fi.length-1),cloakColor:p(f.cloakColor,zi.length-1),eyeColor:p(f.eyeColor,Bi.length-1),faceDecor:x};return e.length?{ok:!1,def:null,errors:e}:{ok:!0,def:{name:s,race:r,class:a,...o?{subclass:o}:{},level:c,abilities:d,background:h,look:v},errors:[]}}function rg(i){let e;try{e=JSON.parse(i)}catch{return{ok:!1,errors:["The scroll is not valid JSON."]}}let t=Zd(e);return!t.ok||!t.def?{ok:!1,errors:t.errors}:Gi?(Gi.applyDef(t.def),{ok:!0,errors:[]}):{ok:!1,errors:["The forge is cold."]}}function Jd(i){Kd();let e=H("div",{class:"cr-qa-done"},H("div",{class:"cr-panel"},H("div",{class:"cr-panel-title",text:"THE OATH IS SPOKEN"}),H("div",{class:"cr-panel-sub",text:"CharacterDef handed to the session flow \u2014 also at window.__AR_LAST_DEF__"}),H("pre",{class:"cr-qa-json",text:JSON.stringify(i,null,2)}),H("div",{class:"cr-oath-actions"},H("button",{class:"cr-btn cr-btn-ghost",onclick:()=>{navigator.clipboard?.writeText(JSON.stringify(i,null,2)).catch(()=>{})}},"COPY JSON"),H("button",{class:"cr-btn cr-btn-primary",onclick:()=>{e.remove(),Cc(document.body,{onDone:t=>{window.__AR_LAST_DEF__=t,Jd(t)}})}},"FORGE ANOTHER"))));document.body.append(e)}var Yd,Gi,sg,Qd=za(()=>{Xd();Ec();Ac();Yd=!1;Gi=null;sg=["str","dex","con","int","wis","cha"];if(typeof document<"u"&&typeof location<"u")try{if(new URLSearchParams(location.search).get("page")==="create"){let i=()=>{Cc(document.body,{onDone:e=>{window.__AR_LAST_DEF__=e,console.log("[ashenreach] character complete:",JSON.stringify(e)),Jd(e)}})};document.readyState==="loading"?document.addEventListener("DOMContentLoaded",i,{once:!0}):i()}}catch{}});function Xm(i){let e=i,t=new Set;return{getState:()=>e,setState:s=>{let r=e;e={...e,...s};for(let a of t)a(e,r)},subscribe:s=>(t.add(s),()=>t.delete(s))}}var Ee=Xm({phase:"connecting",me:null,players:[],tokens:[],doors:[],myTokenId:null,chat:[],mapName:"",dayTime:21*60,weather:"clear",interactLabel:null,connection:"offline",pingMs:null,initiative:null,setPhase:i=>Ee.setState({phase:i}),setJoined:(i,e,t,n)=>Ee.setState({phase:"playing",me:i,players:e,tokens:t,mapName:n,myTokenId:"tok_"+i.id.slice(2)}),applyPatch:i=>Ee.setState(i),setInteract:i=>Ee.setState({interactLabel:i}),setConnection:i=>Ee.setState({connection:i})});var lc=class{map=new Map;on(e,t){return this.map.has(e)||this.map.set(e,new Set),this.map.get(e).add(t),()=>this.map.get(e)?.delete(t)}emit(e,t){let n=this.map.get(e);if(n)for(let s of n)try{s(t)}catch(r){console.error(`[bus:${e}]`,r)}}clear(){this.map.clear()}},We=new lc,qe={TOKENS_SYNC:"tokens:sync",MAP_LOAD:"map:load",DOORS_SYNC:"doors:sync",ENV_SYNC:"env:sync",MOVE_INTENT:"move:intent",INTERACT:"ui:interact",CHAT:"chat",ROLL:"roll:show",FX:"fx:action",JOINED:"session:joined",ERROR:"session:error",MOVE_REJECTED:"move:rejected",PROMPT:"prompt",SFX:"sfx"};var $t=null,Ws=!1,hc=0,hs=null,cc=null,uc=!1,Ga=-1,Gs="",Wr=null,Vs=null,Pi=null,cs=[],dc="ar_join";function Ym(){try{let i=JSON.parse(sessionStorage.getItem(dc)||"null");return i&&typeof i=="object"&&!Array.isArray(i)?i:null}catch{return null}}var qr=Ym(),fc=!1,Va=!1,$r=[],Km=100;function Wa(i){if($t&&$t.readyState<=1)return $t;uc=!1;let e=location.protocol==="https:"?"wss:":"ws:";return $t=new WebSocket(i||`${e}//${location.host}/ws`),$t.onopen=Zm,$t.onmessage=jm,$t.onclose=Jm,$t.onerror=()=>{},$t}function Zm(){Ws=!0,hc=0;let i=Ee.getState();i.setConnection("online"),i.phase==="connecting"&&i.setPhase("join");let e=Va;for(Va=!1;$r.length;){let t=$r.shift();$t?.send(t)}!e&&qr&&(fc||sessionStorage.getItem("ar_uid"))&&Qn("session:join",{...qr,resumeId:sessionStorage.getItem("ar_uid")||void 0})}function Jm(){if(Ws=!1,$t=null,cc&&clearInterval(cc),cc=null,Ee.setState({pingMs:null}),uc)return;Ee.getState().setConnection("reconnecting");let i=Math.min(8e3,500*2**hc)*(.8+Math.random()*.4);hc++,hs&&clearTimeout(hs),hs=setTimeout(()=>{hs=null,Wa()},i)}function Qn(i,e){let t=JSON.stringify({ev:i,data:e});$t&&Ws?$t.send(t):$r.length<Km&&$r.push(t)}function jm(i){let e;try{e=JSON.parse(String(i.data))}catch{return}if(!e||typeof e.ev!="string")return;let t=e.data??{};try{Qm(e.ev,t)}catch(n){console.error(`[net] dispatch ${e.ev}`,n)}}function Qm(i,e){let t=Ee.getState;switch(i){case"state:sync":{let n=e.state||{};Ga=typeof e.version=="number"?e.version:n.version??-1,e.map&&(Wr=e.map,Gs=e.map.id||""),Vs=n.tokens||[],cs=n.doors||[],Pi={dayNight:n.dayNight,weather:n.weather},e.you?(sessionStorage.setItem("ar_uid",e.you.id),fc=!0,t().setJoined(e.you,n.players||[],n.tokens||[],n.mapName||n.mapId||""),Ee.setState({initiative:n.initiative??null})):t().applyPatch({players:n.players,tokens:n.tokens,chat:n.chat,mapName:n.mapName||n.mapId,dayTime:n.dayNight?.time,weather:n.weather?.type}),Ee.setState({chat:n.chat||[],doors:cs,dayTime:n.dayNight?.time??Ee.getState().dayTime,weather:n.weather?.type??Ee.getState().weather}),e.map?We.emit(qe.MAP_LOAD,e.map):n.mapId&&n.mapId!==Gs&&fd(n.mapId),We.emit(qe.DOORS_SYNC,cs),We.emit(qe.TOKENS_SYNC,n.tokens||[]),We.emit(qe.ENV_SYNC,Pi),We.emit(qe.JOINED,e);break}case"state:patch":{if(typeof e.version=="number"){if(e.version<=Ga)return;Ga=e.version}let n={};e.players&&(n.players=e.players);let s=e.mapId,r=!!s&&s!==Gs;e.tokens&&(n.tokens=e.tokens,Vs=e.tokens,r||We.emit(qe.TOKENS_SYNC,e.tokens)),e.chat&&(n.chat=e.chat),(e.mapName||e.mapId)&&(n.mapName=e.mapName||e.mapId),e.dayNight&&(n.dayTime=e.dayNight.time),e.weather&&(n.weather=e.weather.type),e.initiative!==void 0&&(n.initiative=e.initiative),e.doors&&(n.doors=e.doors,cs=e.doors),t().applyPatch(n),(e.dayNight||e.weather)&&(Pi={dayNight:e.dayNight??Pi?.dayNight,weather:e.weather??Pi?.weather},We.emit(qe.ENV_SYNC,Pi)),r?e.map?(Gs=e.map.id||s,Wr=e.map,We.emit(qe.MAP_LOAD,e.map),We.emit(qe.DOORS_SYNC,cs),We.emit(qe.TOKENS_SYNC,Vs||[])):fd(s):e.doors&&We.emit(qe.DOORS_SYNC,e.doors);break}case"fx:action":We.emit(qe.FX,e);break;case"roll:show":We.emit(qe.ROLL,e);break;case"prompt":We.emit(qe.PROMPT,e);break;case"move:rejected":We.emit(qe.MOVE_REJECTED,e);break;case"session:error":{We.emit(qe.ERROR,e);let n=Ee.getState();n.phase!=="playing"&&e.code!=="move_rejected"&&e.code!=="dm"&&n.setPhase("join");break}case"net:pong":Number.isFinite(e.sentAt)&&Ee.setState({pingMs:Math.max(0,Date.now()-e.sentAt)});break;default:break}}async function fd(i){try{let e=await fetch(`/api/map/${encodeURIComponent(i)}`);if(!e.ok)throw new Error(`HTTP ${e.status}`);let t=await e.json();Gs=t.id||i,Wr=t,We.emit(qe.MAP_LOAD,t),We.emit(qe.DOORS_SYNC,cs),We.emit(qe.TOKENS_SYNC,Vs||[])}catch(e){console.error("[net] map fetch failed",i,e)}}function pd(){Wr&&We.emit(qe.MAP_LOAD,Wr),We.emit(qe.DOORS_SYNC,cs),Vs&&We.emit(qe.TOKENS_SYNC,Vs),Pi&&We.emit(qe.ENV_SYNC,Pi)}function pc(i,e,t){Qn("intent:move",{x:i,z:e,rotY:t})}function md(i){Qn("intent:door",{wallIndex:i})}function gd(i){Qn("intent:exit",{exitId:i})}function qa(i,e,t,n={}){qr={invite:i,name:e,archetype:t,...n},sessionStorage.setItem(dc,JSON.stringify(qr)),(!$t||$t.readyState>1)&&Wa(),Ws||(Va=!0),Qn("session:join",{invite:i,name:e,archetype:t,...n,resumeId:sessionStorage.getItem("ar_uid")||void 0})}function vd(i){Qn("chat:say",{text:i})}function di(i,e){Qn("dm:cmd",{op:i,payload:e})}function us(i){Qn("intent:action",i)}function yd(){Qn("intent:endTurn",{})}function Xr(i,e){Qn("intent:sheet",typeof e=="number"?{op:i,hitDice:e}:e?{op:i,itemId:e}:{op:i})}function $a(){if(uc=!0,qr=null,fc=!1,Va=!1,sessionStorage.removeItem(dc),Ga=-1,Gs="",$r.length=0,hs&&(clearTimeout(hs),hs=null),$t&&Ws)try{$t.send(JSON.stringify({ev:"session:leave",data:{}}))}catch{}if($t)try{$t.close(1e3,"menu")}catch{}$t=null,Ws=!1,Ee.getState().setConnection("offline")}var Ii={warden:{id:"warden",name:"warden",title:"Warden",accent:"#b8952f",desc:"Bulwark of the last gate. Sword and oath.",path:"M50 8 L84 22 V50 C84 71 69 85 50 93 C31 85 16 71 16 50 V22 Z M50 26 V60 M40 60 H60 M50 60 V72 M50 78 m-4 0 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0"},shadowdancer:{id:"shadowdancer",name:"shadowdancer",title:"Shadowdancer",accent:"#5a7a8c",desc:"A whisper in the dark. Blade and venom.",path:"M66 14 A38 38 0 1 0 66 86 A30 30 0 1 1 66 14 Z M26 84 L54 56 M48 50 L60 62"},ashen_mage:{id:"ashen_mage",name:"ashen_mage",title:"Ashen Mage",accent:"#c96a2b",desc:"Ember-bound scholar of the burning word.",path:"M50 8 C60 24 76 34 76 56 C76 75 64 90 50 90 C36 90 24 75 24 56 C24 42 33 36 37 26 C40 36 46 40 46 40 C41 25 45 15 50 8 Z M50 80 C44 80 40 74 40 67 C40 61 45 58 50 53 C55 58 60 61 60 67 C60 74 56 80 50 80 Z"},pale_priest:{id:"pale_priest",name:"pale_priest",title:"Pale Priest",accent:"#9db8a6",desc:"Keeper of the last light. Mercy and ruin.",path:"M50 12 m-12 0 a12 12 0 1 0 24 0 a12 12 0 1 0 -24 0 M50 24 V84 M30 44 H70 M38 84 H62 M26 20 L18 12 M74 20 L82 12"}};var bd={crown:"M22 76 H78 L72 42 L59 56 L50 30 L41 56 L28 42 Z M50 66 m-3.5 0 a3.5 3.5 0 1 0 7 0 a3.5 3.5 0 1 0 -7 0",d20:"M50 6 L88 50 L50 94 L12 50 Z M50 24 L70 50 L50 76 L30 50 Z M50 24 V6 M70 50 H88 M50 76 V94 M30 50 H12",send:"M14 10 L86 50 L14 90 L30 50 Z",x:"M28 28 L72 72 M72 28 L28 72",droplet:"M50 12 C62 32 74 44 74 60 A24 24 0 1 1 26 60 C26 44 38 32 50 12 Z",shield:"M50 10 L78 21 V46 C78 63 66 75 50 82 C34 75 22 63 22 46 V21 Z",moon:"M62 14 A34 34 0 1 0 62 86 A27 27 0 1 1 62 14 Z",sun:"M50 22 m-14 0 a14 14 0 1 0 28 0 a14 14 0 1 0 -28 0 M50 2 V9 M50 91 V98 M2 50 H9 M91 50 H98 M16 16 L21 21 M79 79 L84 84 M84 16 L79 21 M21 79 L16 84",rain:"M25 52 A13 13 0 0 1 25 26 A17 17 0 0 1 57 20 A12 12 0 0 1 66 52 Z M38 62 L34 74 M52 62 L48 74 M64 62 L60 74",storm:"M25 50 A13 13 0 0 1 25 24 A17 17 0 0 1 57 18 A12 12 0 0 1 66 50 Z M52 54 L40 74 H49 L43 92 L60 68 H50 L56 54 Z",fog:"M20 32 Q35 26 50 32 T80 32 M20 50 Q35 44 50 50 T80 50 M20 68 Q35 62 50 68 T80 68",sparkle:"M50 10 L56 44 L90 50 L56 56 L50 90 L44 56 L10 50 L44 44 Z",skull:"M50 14 C30 14 20 28 20 42 C20 52 26 58 32 62 L32 74 H68 L68 62 C74 58 80 52 80 42 C80 28 70 14 50 14 Z M38 42 m-5 0 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0 M62 42 m-5 0 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0 M50 52 L46 60 H54 Z M42 74 V82 M50 74 V82 M58 74 V82",chat:"M18 18 H82 A7 7 0 0 1 89 25 V56 A7 7 0 0 1 82 63 H47 L31 79 V63 H18 A7 7 0 0 1 11 56 V25 A7 7 0 0 1 18 18 Z M30 34 H70 M30 46 H56",link:"M38 62 A16 16 0 0 1 38 39 L46 31 M62 38 A16 16 0 0 1 62 61 L54 69 M40 52 L60 44",sword:"M70 12 L78 20 L44 54 L36 46 Z M34 48 L46 60 M26 56 L38 68 M30 72 L22 80",map:"M16 22 L38 14 L62 22 L84 14 V78 L62 86 L38 78 L16 86 Z M38 14 V78 M62 22 V86",chevron:"M30 36 L50 56 L70 36",ember:"M50 16 C58 30 68 38 68 54 C68 68 60 78 50 78 C40 78 32 68 32 54 C32 44 38 40 40 32 C42 40 47 43 47 43 C44 32 46 23 50 16 Z",boot:"M32 16 V48 C32 56 26 58 22 62 C18 66 20 72 26 74 L70 84 C76 85 80 82 80 76 C80 62 68 58 60 52 C54 47 52 40 52 16 Z",hourglass:"M30 12 H70 M30 88 H70 M34 12 C34 34 46 40 46 50 C46 60 34 66 34 88 M66 12 C66 34 54 40 54 50 C54 60 66 66 66 88"};function fi(i,e="",t=100){return`<svg class="${e}" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${i}"/></svg>`}function ht(i,e=""){return fi(bd[i]||bd.sparkle,e)}function mc(i){switch(i){case"rain":return ht("rain");case"storm":return ht("storm");case"fog":return ht("fog");default:return ht("sparkle")}}function xd(i){let e=Math.floor(i/60%24);return e>=7&&e<19?ht("sun"):ht("moon")}var Ed="ar_audio_mix",Yr={musicVolume:.8,sfxVolume:1},gc=new Set,Ot=null,qs=null,$s=null,ei=null,Di=null,Xs=null,Hi=!1,jt="menu",ki=0,ti=i0(),Sd=[52,48,50,47,52,55,48,47],Md=[null,76,null,79,78,null,76,null,71,null,74,null,76,null,79,null,74,null,71,null,69,null,67,null,66,null,69,null,71,null,74,null],e0=[38,35,31,33,38,36,31,35],t0=[38,41,43,36,38,34,41,36],n0=[45,48,50,43,45,52,48,43],_d=[null,null,50,null,null,53,null,null,57,null,null,53,null,50,null,null];function i0(){let i;try{i=localStorage.getItem(Ed)}catch(e){return console.warn("Unable to read audio preferences from browser storage:",e),{...Yr}}if(!i)return{...Yr};try{let e=JSON.parse(i);return{musicVolume:Kr(Number(e.musicVolume),Yr.musicVolume),sfxVolume:Kr(Number(e.sfxVolume),Yr.sfxVolume)}}catch(e){return console.warn("Unable to parse saved audio preferences:",e),{...Yr}}}function Kr(i,e){return Number.isFinite(i)?Math.max(0,Math.min(1,i)):e}function Td(){try{localStorage.setItem(Ed,JSON.stringify(ti))}catch(i){console.warn("Unable to save audio preferences to browser storage:",i)}}function Xa(){for(let i of gc)i()}function ds(i,e,t=.08){!i||!Ot||(i.gain.cancelScheduledValues(Ot.currentTime),i.gain.setTargetAtTime(e,Ot.currentTime,t))}function s0(){if(Ot)return;let i=window.AudioContext;if(!i)return;Ot=new i,qs=Ot.createGain(),$s=Ot.createGain(),ei=Ot.createGain();let e=Ot.createDynamicsCompressor();e.threshold.value=-18,e.knee.value=12,e.ratio.value=3,e.attack.value=.004,e.release.value=.25,qs.gain.value=1,$s.gain.value=1,ei.gain.value=0,$s.connect(qs),ei.connect(qs),qs.connect(e),e.connect(Ot.destination);let t=Ot.createDelay(1),n=Ot.createGain(),s=Ot.createGain();t.delayTime.value=jt==="crypt"?.48:jt==="town"?.28:.34,n.gain.value=jt==="crypt"?.28:jt==="town"?.14:.18,s.gain.value=.16,$s.connect(t),t.connect(n),n.connect(t),t.connect(s),s.connect(qs)}function Li(i,e,t,n,s){let r=Ot;if(!r)return;let a=r.createOscillator(),o=r.createGain(),l=r.createBiquadFilter(),c=440*Math.pow(2,(i-69)/12);a.type=n==="lead"?"sine":n==="pad"?"triangle":n==="drone"?"sine":"sawtooth",a.frequency.setValueAtTime(c,e),l.type="lowpass",l.frequency.setValueAtTime(n==="lead"?1800:n==="pad"?760:n==="drone"?260:380,e);let h=n==="lead"?.055:n==="pad"?.026:n==="drone"?.035:.06,u=n==="lead"?.05:n==="pad"||n==="drone"?.8:.08;o.gain.setValueAtTime(1e-4,e),o.gain.exponentialRampToValueAtTime(h,e+u),o.gain.setTargetAtTime(1e-4,e+Math.max(u,t*.72),n==="pad"||n==="drone"?.65:.16),a.connect(l),l.connect(o),o.connect(s),a.start(e),a.stop(e+t+(n==="pad"||n==="drone"?2.5:.6)),a.onended=()=>{a.disconnect(),l.disconnect(),o.disconnect()}}function wd(){let i=Ot,e=Di;if(!i||!e||!Hi)return;let t=i.currentTime+.04,n=Math.floor(ki/8)%8,s=ki%8;if(jt==="menu"){let r=Sd[n],a=60/72/2;if(s===0){let l=n!==1&&n!==2&&n!==5;[r,r+7,r+12,r+(l?15:16)].forEach(c=>Li(c,t,a*7.5,"pad",e)),Li(r-12,t,a*1.8,"bass",e)}else s===4&&Li(Sd[n]-5,t,a*1.5,"bass",e);let o=Md[ki%Md.length];n>=4&&o!==null&&ki%4===1&&(o+=7),o!==null&&s!==7&&Li(o,t,a*1.7,"lead",e)}else{let r=jt==="combat",a=jt==="town",l=(r?t0:a?n0:e0)[n],c=60/(r?92:a?68:62)/2;s===0?((r?[l,l+5,l+7,l+10]:a?[l,l+4,l+7,l+11]:[l,l+7,l+12,l+14]).forEach(d=>Li(d,t,c*(a?7.8:6.8),a?"pad":"drone",e)),Li(l-12,t,c*(r?1.8:3.7),"bass",e)):(s===4||r&&s===2)&&Li(l-(s===4?5:12),t,c*1.8,"bass",e);let h=a?s===2||s===6?l+(s===2?12:16):null:_d[ki%_d.length];h!==null&&(r||a||n%2===0||s===5)&&Li(h+(r&&s===5?7:n%4===3&&!a?-1:0),t,c*(r?.8:1.5),"lead",e)}ki=(ki+1)%64}function Ad(){if(!Ot||!$s)return;if(Xs!==null&&window.clearInterval(Xs),Di){let n=Di;ds(n,0,.2),window.setTimeout(()=>n.disconnect(),6e3)}let i=Ot.createGain(),e=jt==="crypt"?.25:jt==="combat"?.3:jt==="town"?.26:.28;i.gain.value=1e-4,i.connect($s),Di=i,ds(i,e*ti.musicVolume,.7),ki=0;let t=jt==="crypt"?62:jt==="combat"?92:jt==="town"?68:72;wd(),Xs=window.setInterval(wd,60/t/2*1e3)}function an(i,e={}){let t=Ot,n=ei;if(!t||!n)return;let s=t.currentTime+(e.delay||0),r=e.duration??.2,a=t.createOscillator(),o=t.createBiquadFilter(),l=t.createGain();a.type=e.type||"sine",a.frequency.setValueAtTime(i,s),e.endFrequency&&a.frequency.exponentialRampToValueAtTime(e.endFrequency,s+r),o.type="lowpass",o.frequency.setValueAtTime(e.filter||3600,s),l.gain.setValueAtTime(1e-4,s),l.gain.exponentialRampToValueAtTime(e.peak??.12,s+.012),l.gain.exponentialRampToValueAtTime(1e-4,s+r),a.connect(o),o.connect(l),l.connect(n),a.start(s),a.stop(s+r+.01),a.onended=()=>{a.disconnect(),o.disconnect(),l.disconnect()}}function Jt(i={}){let e=Ot,t=ei;if(!e||!t)return;let n=i.duration??.16,s=e.currentTime+(i.delay||0),r=e.createBuffer(1,Math.ceil(e.sampleRate*n),e.sampleRate),a=r.getChannelData(0);for(let h=0;h<a.length;h++)a[h]=Math.random()*2-1;let o=e.createBufferSource(),l=e.createBiquadFilter(),c=e.createGain();o.buffer=r,l.type=i.type||"bandpass",l.frequency.setValueAtTime(i.low||800,s),l.Q.value=i.q||.8,i.endHigh?l.frequency.exponentialRampToValueAtTime(i.endHigh,s+n):l.frequency.setValueAtTime(i.high||i.low||800,s),c.gain.setValueAtTime(1e-4,s),c.gain.linearRampToValueAtTime(i.peak??.12,s+Math.min(i.attack??.015,n*.35)),c.gain.exponentialRampToValueAtTime(1e-4,s+n),o.connect(l),l.connect(c),c.connect(t),o.start(s),o.stop(s+n+.01),o.onended=()=>{o.disconnect(),l.disconnect(),c.disconnect()}}function Zr(i){jt!==i&&(jt=i,Hi&&Ad())}function vc(){return{...ti,enabled:Hi}}function Cd(i){return gc.add(i),()=>gc.delete(i)}function Rd(i){ti.musicVolume=Kr(i,ti.musicVolume),Td(),Di&&ds(Di,Hi?(jt==="crypt"?.25:jt==="combat"?.3:jt==="town"?.26:.28)*ti.musicVolume:0),Xa()}function Pd(i){ti.sfxVolume=Kr(i,ti.sfxVolume),Td(),Hi&&ds(ei,ti.sfxVolume),Xa()}function pi(i,e=1){if(!Hi||!Ot||!ei)return;let t=Kr(e,1);if(t!==0)switch(i){case"step":Jt({duration:.075,peak:.2*t,low:90,high:310,attack:.003,q:1.2}),an(105,{duration:.09,peak:.12*t,type:"triangle",endFrequency:62,filter:360}),Jt({duration:.055,peak:.07*t,delay:.012,low:520,high:1300,type:"bandpass"});break;case"fire":Jt({duration:.22,peak:.1*t,low:500,high:1500,type:"bandpass"}),Jt({duration:.045,peak:.11*t,delay:.01+Math.random()*.05,low:1100,high:2400});break;case"door":Jt({duration:.42,peak:.16*t,low:110,high:620,endHigh:180,type:"bandpass",q:1.8}),Jt({duration:.18,peak:.1*t,delay:.28,low:65,high:210,attack:.01}),an(145,{duration:.26,peak:.07*t,type:"triangle",endFrequency:76,delay:.25,filter:420});break;case"type":Jt({duration:.025,peak:.045*t,low:1500,high:3e3,type:"highpass"});break;case"ui":an(740,{duration:.075,peak:.1*t,type:"sine",endFrequency:520}),Jt({duration:.04,peak:.045*t,low:1800,high:3600});break;case"attack":Jt({duration:.28,peak:.19*t,low:700,high:2200,endHigh:230,type:"bandpass"}),an(180,{duration:.2,peak:.08*t,type:"triangle",endFrequency:85});break;case"shoot":Jt({duration:.2,peak:.16*t,low:1200,high:3600,endHigh:500,type:"bandpass"}),an(520,{duration:.09,peak:.1*t,type:"triangle",endFrequency:170});break;case"spell":Jt({duration:.48,peak:.13*t,low:2800,endHigh:360,attack:.1,q:4.5}),[294,440,587].forEach((n,s)=>{an(n,{delay:s*.04,duration:.52,peak:.075*t,type:"triangle",endFrequency:n*1.35}),an(n*1.006,{delay:s*.04,duration:.48,peak:.035*t,type:"sine",endFrequency:n*1.4})}),an(310,{delay:.24,duration:.2,peak:.075*t,type:"sawtooth",endFrequency:920,filter:2600});break;case"heal":Jt({duration:.85,peak:.1*t,low:180,endHigh:3600,attack:.2,q:4.5}),[523,659,784,988,1175].forEach((n,s)=>{an(n,{delay:s*.06,duration:.52,peak:.08*t,type:"sine"}),an(n*1.006,{delay:s*.06,duration:.48,peak:.035*t,type:"triangle"})});break;case"buff":an(392,{duration:.48,peak:.1*t,type:"triangle",endFrequency:587}),an(784,{delay:.1,duration:.42,peak:.065*t,type:"sine"});break;case"hit":Jt({duration:.025,peak:.11*t,low:3200,high:5600,type:"highpass"}),Jt({duration:.16,peak:.22*t,low:95,high:520,q:4}),an(100,{duration:.18,peak:.16*t,type:"sawtooth",endFrequency:48,filter:650});break;case"crit":Jt({duration:.025,peak:.15*t,low:3400,high:6e3,type:"highpass"}),Jt({duration:.24,peak:.28*t,low:450,high:1800}),an(130,{duration:.25,peak:.2*t,type:"sawtooth",endFrequency:42,filter:700}),an(880,{duration:.22,peak:.11*t,type:"triangle",endFrequency:1320});break;case"miss":Jt({duration:.21,peak:.13*t,low:800,high:2400,endHigh:350});break;case"die":an(180,{duration:.72,peak:.16*t,type:"triangle",endFrequency:48,filter:900}),Jt({duration:.38,peak:.07*t,low:280,high:950,endHigh:180});break}}async function Id(i){return i?(s0(),!Ot||!ei?!1:(await Ot.resume(),Hi=!0,ds(ei,ti.sfxVolume),Ad(),Xa(),!0)):(Hi=!1,Xs!==null&&window.clearInterval(Xs),Xs=null,Di&&ds(Di,0,.04),ds(ei,0,.04),Xa(),!0)}function Ya(i,e=!1){let t=document.createElement("section");t.className=`ar-audio-settings${e?" is-expanded":""}`,t.innerHTML=`
    <button type="button" class="ar-audio-toggle" aria-pressed="false">\u266B <span>Sound off</span></button>
    <details class="ar-audio-volume"${e?" open":""}>
      <summary>Volumes</summary>
      <div class="ar-audio-mix">
        <label><span>Music <output data-music-value></output></span>
          <input type="range" min="0" max="1" step="0.01" data-music-volume aria-label="Music volume" /></label>
        <label><span>Effects <output data-sfx-value></output></span>
          <input type="range" min="0" max="1" step="0.01" data-sfx-volume aria-label="Sound effects volume" /></label>
      </div>
    </details>
    <span class="ar-audio-status" role="status" aria-live="polite"></span>`,i.appendChild(t);let n=t.querySelector(".ar-audio-toggle"),s=t.querySelector(".ar-audio-volume"),r=t.querySelector("[data-music-volume]"),a=t.querySelector("[data-sfx-volume]"),o=t.querySelector("[data-music-value]"),l=t.querySelector("[data-sfx-value]"),c=t.querySelector(".ar-audio-status"),h=()=>{let b=vc();n.setAttribute("aria-pressed",String(b.enabled)),n.querySelector("span").textContent=b.enabled?"Sound on":"Sound off",r.value=String(b.musicVolume),a.value=String(b.sfxVolume),o.value=`${Math.round(b.musicVolume*100)}%`,l.value=`${Math.round(b.sfxVolume*100)}%`,t.dataset.enabled=String(b.enabled)},u=async()=>{c.textContent="";try{await Id(!vc().enabled)||(c.textContent="Audio is unavailable in this browser.")}catch(b){c.textContent="Audio could not be started.",console.error("Unable to start audio:",b)}h()},d=()=>Rd(Number(r.value)),f=()=>Pd(Number(a.value)),g=Cd(h);return n.addEventListener("click",u),r.addEventListener("input",d),a.addEventListener("input",f),s.addEventListener("toggle",()=>t.classList.toggle("volumes-open",s.open)),h(),t.classList.toggle("volumes-open",s.open),()=>{g(),n.removeEventListener("click",u),r.removeEventListener("input",d),a.removeEventListener("input",f),t.remove()}}var yc="ar_characters";function r0(){try{let i=JSON.parse(localStorage.getItem(yc)||"[]");if(!Array.isArray(i))return[];let e=!1,t=i.filter(n=>n&&typeof n.name=="string"&&n.name.trim());for(let n of t)(typeof n.id!="string"||!n.id)&&(n.id=crypto.randomUUID(),e=!0);return e&&localStorage.setItem(yc,JSON.stringify(t)),t}catch{return[]}}function Ld(i,e={}){let t=document.createElement("div");t.className="screen-join landing-screen";let n=r0();t.innerHTML=`
    <canvas class="landing-embers" data-embers aria-hidden="true"></canvas>
    <div class="landing-sigil" aria-hidden="true"><div class="landing-sigil-ring"></div></div>
    <div class="landing-vignette" aria-hidden="true"></div>
    <header class="landing-top"><span class="landing-world">A WORLD ON THE ASHEN EDGE</span>
      <div data-audio-controls></div></header>
    <main class="landing-main">
      <div class="landing-mark-wrap">
        <button type="button" class="landing-mark" data-crown aria-label="A crown sigil">
          ${ht("crown","ic ic-crown")}
        </button>
        <div class="landing-secret" data-secret aria-live="polite" hidden>The old crown remembers.</div>
      </div>
      <p class="landing-eyebrow">THE FIRE HAS FADED. THE STORY HAS NOT.</p>
      <h1 class="landing-title" aria-label="ASHENREACH">ASHENREACH</h1>
      <p class="landing-subtitle">The world after the last fire</p>
      <div class="landing-rule"><span>\u2726</span></div>
      <div class="join-note landing-note" data-note hidden>kindling the reach\u2026</div>
      <div class="join-error landing-error" data-error hidden></div>
      <section class="landing-returning" data-returning hidden>
        <div class="landing-section-label">WANDERERS \xB7 THIS DEVICE</div>
        <div data-character-list></div>
      </section>
      <button type="button" class="landing-primary" data-forge><span>${ht("ember","ic ic-ember")}</span> Begin a new tale</button>
      <button type="button" class="landing-secondary" data-settings aria-expanded="false">${e.invite?`Summons \xB7 ${Jr(e.invite)}`:"Join a gathering"} <span>\uFF0B</span></button>
      <section class="landing-settings" data-settings-panel hidden>
        ${e.invite?`<div class="landing-invite-fixed">Summons code <b>${Jr(e.invite)}</b></div>`:`
          <label for="ar-invite">SUMMONS CODE</label>
          <input id="ar-invite" class="join-invite-input" maxlength="12" autocomplete="off" spellcheck="false" placeholder="Optional \u2014 join a friend's gathering" />`}
        <label class="join-dm landing-dm" data-dm><input type="checkbox" data-dm-box />
          <span class="join-dm-crown">${ht("crown","ic ic-crown-sm")}</span><span>Enter as Dungeon Master</span>
        </label>
      </section>
      <p class="landing-foot">Characters saved on this device \xB7 WASD to move \xB7 Space to jump \xB7 drag to look</p>
    </main>
    <footer class="landing-footer"><span>ASHENREACH</span><span>WANDERERS WELCOME</span></footer>`,i.appendChild(t);let s=E=>t.querySelector(E),r=t.querySelector("#ar-invite"),a=s("[data-dm-box]"),o=s("[data-error]"),l=s("[data-note]"),c=s("[data-forge]"),h=s("[data-settings]"),u=s("[data-settings-panel]"),d=s("[data-returning]"),f=s("[data-character-list]"),g=s("[data-crown]"),b=s("[data-secret]"),p=0;g.addEventListener("click",()=>{p++,p===5&&(t.classList.add("is-crown-awake"),g.parentElement?.classList.add("has-secret"),b.hidden=!1,g.setAttribute("aria-label","The old crown remembers"))});let m=()=>{d.hidden=n.length===0,f.innerHTML=n.map((E,D)=>`
      <div class="landing-character">
        <span class="landing-character-mark">${ht("ember","ic ic-ember")}</span>
        <span class="landing-character-copy"><b>${Jr(E.name)}</b>
          <small>${Jr(E.class||"Wanderer")} \xB7 Level ${Number(E.level)||1}</small></span>
        <button type="button" class="landing-character-enter" data-continue="${D}">Continue \u2192</button>
        <button type="button" class="landing-character-delete" data-delete="${D}"
          aria-label="Delete ${Jr(E.name)}" title="Delete character">${ht("x")}</button>
      </div>`).join("")};m();let x=e.dmKey||new URLSearchParams(location.search).get("dm")||"";x&&(a.checked=!0);let v=E=>{o.textContent=E||"The gate refused thee.",o.hidden=!1};e.error&&v(e.error);let y=We.on(qe.ERROR,E=>v(E&&E.message||"The gate refused thee.")),w=()=>{o.hidden=!0};r&&r.addEventListener("input",w);let _=()=>{w();let E=e.invite||(r?r.value.trim():""),D=e.name||"";e.onForge?.({name:D,invite:E,dm:a.checked,dmKey:x}),Ee.getState().setPhase("create")};c.addEventListener("click",_),h.addEventListener("click",()=>{u.hidden=!u.hidden,h.setAttribute("aria-expanded",String(!u.hidden)),u.hidden||r?.focus()}),f.addEventListener("click",E=>{let D=E.target.closest("button");if(!D)return;let O=Number(D.dataset.continue??D.dataset.delete),F=n[O];if(F){if(D.hasAttribute("data-delete")){if(!window.confirm(`Delete ${F.name} from this device? This cannot be undone.`))return;n.splice(O,1);try{localStorage.setItem(yc,JSON.stringify(n))}catch(W){n.splice(O,0,F),console.error("[ashenreach] could not delete this-device character",W),v("Unable to delete this character from browser storage.");return}m();return}e.onContinue?.(F,e.invite||(r?r.value.trim():""),a.checked,x)}});let M=()=>{let E=Ee.getState();l.hidden=E.phase!=="connecting"&&E.connection!=="reconnecting"&&E.connection!=="offline",l.textContent=E.connection==="reconnecting"?"the reach slipped away \u2014 rekindling\u2026":E.connection==="offline"?"kindling the reach\u2026":l.textContent};M();let T=Ee.subscribe((E,D)=>{(E.phase!==D.phase||E.connection!==D.connection)&&M()}),L=a0(t.querySelector("[data-embers]")),S=Ya(t.querySelector("[data-audio-controls]"));return()=>{T(),y(),L(),S(),t.remove()}}function a0(i){let e=i.getContext("2d");if(!e||matchMedia("(prefers-reduced-motion: reduce)").matches)return()=>{};let t=Math.min(devicePixelRatio||1,2),n=0,s=[],r=()=>{i.width=Math.floor(innerWidth*t),i.height=Math.floor(innerHeight*t),s=Array.from({length:52},()=>({x:Math.random()*i.width,y:Math.random()*i.height,r:(.7+Math.random()*1.5)*t,speed:(.12+Math.random()*.32)*t,phase:Math.random()*Math.PI*2}))},a=()=>{e.clearRect(0,0,i.width,i.height),s.forEach(o=>{o.y-=o.speed,o.x+=Math.sin(o.phase+o.y*.004)*.18*t,o.y<-8&&(o.y=i.height+8,o.x=Math.random()*i.width);let l=.18+(Math.sin(o.phase+o.y*.018)+1)*.16;e.fillStyle=`rgba(230, 166, 67, ${l})`,e.beginPath(),e.arc(o.x,o.y,o.r,0,Math.PI*2),e.fill()}),n=requestAnimationFrame(a)};return r(),n=requestAnimationFrame(a),window.addEventListener("resize",r),()=>{cancelAnimationFrame(n),window.removeEventListener("resize",r)}}function Jr(i){return i.replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e])}function bc(i,e){let t=e.size||64,n=Math.min(window.devicePixelRatio||1,2);i.width!==t*n&&(i.width=t*n,i.height=t*n);let s=i.getContext("2d");if(!s)return;s.save(),s.scale(n,n),s.clearRect(0,0,t,t);let r=t/2,a=s.createRadialGradient(r*.82,r*.74,t*.05,r,r,r);a.addColorStop(0,"#2b2418"),a.addColorStop(.55,"#14110b"),a.addColorStop(1,"#080a0d"),s.beginPath(),s.arc(r,r,r,0,Math.PI*2),s.closePath(),s.fillStyle=a,s.fill(),s.clip();let o=7;for(let d=0;d<e.name.length;d++)o=o*31+e.name.charCodeAt(d)>>>4;let l=()=>(o=o*16807%2147483647,o/2147483647);for(let d=0;d<46;d++){let f=l()*Math.PI*2,g=l()*r;s.fillStyle=l()<.6?"rgba(0,0,0,0.35)":"rgba(184,149,47,0.10)",s.fillRect(r+Math.cos(f)*g,r+Math.sin(f)*g,1+l(),1+l())}let c=Ii[e.archetype]||Ii.warden,h=t*.88/100;s.save(),s.translate(r,r),s.scale(h,h),s.translate(-50,-50),s.lineWidth=5.5,s.lineJoin="round",s.lineCap="round",s.strokeStyle=c.accent,s.shadowColor=c.accent,s.shadowBlur=7;let u=new Path2D(c.path);s.stroke(u),s.shadowBlur=0,s.globalAlpha=.24,s.fillStyle=c.accent,s.fill(u),s.restore(),s.setTransform(n,0,0,n,0,0),s.beginPath(),s.arc(r,r,r-1.4,0,Math.PI*2),s.lineWidth=2.6,s.strokeStyle=e.color||"#b8952f",s.stroke(),s.beginPath(),s.arc(r,r,r-.2,0,Math.PI*2),s.lineWidth=1,s.strokeStyle="rgba(0,0,0,0.85)",s.stroke(),s.restore()}var o0={online:"online",reconnecting:"reconnecting",offline:"offline"};function kd(i){let e=document.createElement("div");e.className="hud",e.innerHTML=`
    <div class="hud-tl">
      <div class="hud-loc ornate">
        <span class="hud-loc-name" data-loc>\u2014</span>
        <span class="hud-loc-meta">
          <span class="hud-meta-bit" data-clock>${ht("moon","ic ic-sm")}</span>
          <span class="hud-meta-bit" data-weather>${ht("sparkle","ic ic-sm")}</span>
        </span>
         <span class="hud-conn" data-conn-badge data-conn="offline" title="Connection status"><span data-conn-label>offline</span><small data-ping>\u2014</small></span>
      </div>
       <section class="hud-party-wrap" data-party-wrap hidden>
         <div class="hud-party-label">COMPANIONS</div>
         <div class="hud-party" data-party></div>
       </section>
    </div>

    <div class="hud-side">
      <div class="hud-things" data-things></div>
      <div class="hud-dm" data-dm hidden>
        <button type="button" class="dm-toggle" data-dm-toggle>${ht("crown","ic ic-sm")} DM</button>
        <div class="dm-panel ornate" data-dm-panel hidden>
          <div class="dm-row dm-section">world</div>
          <div class="dm-row" data-dm-weather></div>
          <div class="dm-row" data-dm-daynight></div>
          <div class="dm-row dm-section">sky clock</div>
          <div class="dm-row dm-clocknote" data-dm-clocknote></div>
          <div class="dm-row dm-section">blight</div>
          <div class="dm-row">
            <select class="dm-select" data-dm-spawn>
              <option value="skeleton">skeleton</option>
              <option value="zombie">zombie</option>
              <option value="shadow">shadow</option>
              <option value="specter">specter</option>
              <option value="ghoul">ghoul</option>
              <option value="cultist">cultist</option>
            </select>
            <button type="button" data-dm-spawn-near>near party</button>
          </div>
          <div class="dm-row">
            <button type="button" data-dm-combat-start class="dm-combat-btn">start initiative</button>
            <button type="button" data-dm-combat-end class="dm-combat-btn">end combat</button>
          </div>
          <div class="dm-row">
            <select class="dm-select" data-dm-map></select>
            <button type="button" data-dm-map-go>travel</button>
          </div>
          <div class="dm-row dm-section">doors</div>
          <div class="dm-row">
            <select class="dm-select" data-dm-door aria-label="Select door"></select>
            <select class="dm-select" data-dm-door-action aria-label="Door action"></select>
            <button type="button" data-dm-door-apply>apply</button>
          </div>
          <div class="dm-row dm-section">creatures (<span data-dm-count>0</span>)</div>
          <div class="dm-list" data-dm-list></div>
        </div>
      </div>
    </div>

    <section class="hud-self" data-self hidden aria-label="Your character">
      <div class="hud-self-portrait"><canvas class="hud-portrait-canvas" data-portrait width="56" height="56"></canvas></div>
      <div class="hud-selfbar">
        <div class="hud-self-head">
          <div class="hud-identity">
            <span class="hud-name" data-self-name></span>
            <span class="hud-arch" data-self-arch></span>
          </div>
          <span class="hud-ac" title="Armor Class">${ht("shield","ic ic-xs")}<b data-ac-v></b><small>AC</small></span>
        </div>
        <div class="hud-vitals">
          <div class="hud-vitals-label"><span>VITALITY</span><span class="hud-hptext" data-hp-text></span></div>
          <div class="hud-hp" data-hp-meter role="progressbar" aria-label="Hit points" aria-valuemin="0" aria-valuenow="0" aria-valuemax="1">
            <div class="hud-hp-fill" data-hp-fill></div>
          </div>
        </div>
        <div class="hud-conditions" data-conditions></div>
      </div>
    </section>

    <div class="hud-chat" data-chat>
      <div class="hud-chat-log" data-chat-log></div>
      <input class="hud-chat-input" data-chat-input maxlength="300" hidden
        placeholder="speak\u2026 (Enter to send \xB7 Esc to close)" />
      <button type="button" class="hud-chat-open" data-chat-open>${ht("send","ic ic-sm")} speak</button>
    </div>

    <div class="hud-interact" data-interact hidden></div>
    <div class="hud-toast" data-move-toast role="status" aria-live="polite" hidden></div>
    <div class="hud-rolls" data-rolls></div>
    <div class="hud-prompt" data-prompt hidden></div>

    <div class="hud-init ornate" data-init hidden></div>
    <div class="hud-turnbar" data-turnbar hidden>
      <div class="turn-banner" data-turn-banner>THY TURN</div>
      <div class="turn-target" data-target-row hidden>
        <label for="combat-target">Target</label>
        <select id="combat-target" data-target-select aria-label="Choose a visible foe">
          <option value="">Choose a foe\u2026</option>
        </select>
        <span data-target-feedback role="status" aria-live="polite">Choose a visible foe.</span>
      </div>
      <div class="turn-actions">
        <button type="button" class="ta-btn" data-act="attack" disabled>${ht("sword","ic ic-sm")} <span>Strike</span></button>
        <button type="button" class="ta-btn" data-act="cantrip" data-cantrip disabled hidden>${ht("sparkle","ic ic-sm")} <span data-cantrip-name>Cantrip</span></button>
        <button type="button" class="ta-btn" data-act="dash">${ht("boot","ic ic-sm")} <span>Dash</span></button>
        <button type="button" class="ta-btn" data-act="dodge">${ht("shield","ic ic-sm")} <span>Dodge</span></button>
        <button type="button" class="ta-btn" data-act="help" hidden>${ht("droplet","ic ic-sm")} <span>Help</span></button>
        <button type="button" class="ta-btn ta-end" data-act="end">${ht("hourglass","ic ic-sm")} <span>End Turn</span></button>
      </div>
      <div class="turn-move" data-move-ft></div>
    </div>

    <div class="hud-hint" data-hint>WASD move \xB7 drag orbit \xB7 wheel zoom \xB7 \u21B5 chat</div>
  `,i.appendChild(e);let t=C=>e.querySelector(C),n=t("[data-loc]"),s=t("[data-clock]"),r=t("[data-weather]"),a=t("[data-conn-badge]"),o=t("[data-conn-label]"),l=t("[data-ping]"),c=t("[data-party]"),h=t("[data-party-wrap]"),u=t("[data-things]"),d=t("[data-self]"),f=t("[data-portrait]"),g=t("[data-self-name]"),b=t("[data-self-arch]"),p=t("[data-hp-meter]"),m=t("[data-hp-fill]"),x=t("[data-hp-text]"),v=t("[data-ac-v]"),y=t("[data-conditions]"),w=t("[data-chat-log]"),_=t("[data-chat-input]"),M=t("[data-chat-open]"),T=t("[data-interact]"),L=t("[data-rolls]"),S=t("[data-prompt]"),E=t("[data-dm]"),D=t("[data-dm-toggle]"),O=t("[data-dm-panel]"),F=t("[data-dm-weather]"),W=t("[data-dm-daynight]"),B=t("[data-dm-clocknote]"),ee=t("[data-dm-spawn]"),q=t("[data-dm-spawn-near]"),le=t("[data-dm-map]"),X=t("[data-dm-map-go]"),te=t("[data-dm-door]"),Pe=t("[data-dm-door-action]"),$e=t("[data-dm-door-apply]"),$=t("[data-dm-list]"),se=t("[data-dm-count]"),ye=t("[data-hint]"),Se=t("[data-init]"),De=t("[data-turnbar]"),Ne=t("[data-turn-banner]"),st=t("[data-target-row]"),rt=t("[data-target-select]"),ut=t("[data-target-feedback]"),U=t("[data-move-ft]"),fn=t("[data-cantrip]"),at=t("[data-cantrip-name]"),ot=t("[data-move-toast]"),ke=[],_t=-1,Fe="",k=C=>C.replace(/[&<>"]/g,I=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[I]),A=C=>C.trim().toLowerCase().replace(/(^|[\s'-])([a-z])/g,(I,G,J)=>G+J.toUpperCase());function Y(C){let I=(C%1440+1440)%1440,G=Math.floor(I/60),J=String(Math.floor(I%60)).padStart(2,"0"),ie=G<5?"deep night":G<7?"dawn":G<11?"morning":G<14?"noon":G<17?"afternoon":G<19?"dusk":G<22?"evening":"night";return{time:`${String(G).padStart(2,"0")}:${J}`,phase:ie}}function ae(C){a.dataset.conn=C,o.textContent=o0[C]||C}function ce(C){l.textContent=C==null?"\u2014":`${C} ms`,l.dataset.quality=C==null?"unknown":C<100?"good":C<220?"fair":"poor"}function re(C,I,G){n.textContent=C||"\u2014";let{time:J,phase:ie}=Y(I);s.innerHTML=`${xd(I)} <span>${J} \xB7 ${ie}</span>`,r.innerHTML=`${mc(G)} <span>${G}</span>`;let Q=Y(I);B.textContent=`${Q.time} \u2014 ${Q.phase}`}function Ie(C,I){return I.find(G=>G.kind==="player"&&G.ownerId===C.id)}let ve=new Map;function Te(C,I){let G=document.createElement("div"),J=A(C.name),ie=I?Math.max(0,I.hp):0,Q=I?Math.max(1,I.hpMax):1,me=I?Math.max(0,Math.min(100,I.hp/I.hpMax*100)):100,Ce=me>60?"high":me>30?"mid":"low",ne=I?I.ac:"\u2014",xe=I?I.speedFt:30,Ze=I?.conditions||[],wt=I?.sheet?.passive,et=I?.initiative,ge=I?.deathSaves,It=I?(Ii[I.archetype]||Ii.warden).title:C.role==="dm"?"dungeon master":"wanderer",nt=ge&&!ge.stable&&!ge.dead&&(ge.ok>0||ge.fail>0)?`<span class="cond-chip death">${ht("droplet","ic ic-xs")} ${ge.ok}\xB7${ge.fail}</span>`:"";G.className=`pcard${C.online?"":" offline"}`,G.style.setProperty("--pc",C.color||"#c9a227"),G.dataset.online=String(!!C.online),G.innerHTML=`
      <div class="pcard-face">
        ${I?'<canvas class="pcard-canvas" width="44" height="44"></canvas>':ht("crown","ic")}
      </div>
      <div class="pcard-main">
        <div class="pcard-namerow">
          <span class="pcard-name" title="${k(J)}">${k(J)}</span>
          ${C.role==="dm"?ht("crown","ic ic-crown-inline"):""}
          <span class="pcard-dot"></span>
        </div>
        <div class="pcard-sub">${k(It)}</div>
        ${I?`
        <div class="pcard-hpbar" data-band="${Ce}"><i style="width:${me}%"></i><b>${ie} <em>/ ${Q}</em></b></div>
        ${Ze.length||nt?`<div class="pcard-chips">${Ze.slice(0,3).map(wn=>`<span class="cond-chip">${k(wn)}</span>`).join("")}${Ze.length>3?`<span class="cond-chip">+${Ze.length-3}</span>`:""}${nt}</div>`:""}
        <div class="pcard-detail">
          <span class="pd-stat"><b>${ne}</b>AC</span>
          <span class="pd-stat"><b>${xe}</b>SPD</span>
          ${et!=null?`<span class="pd-stat"><b>${et>=0?"+":""}${et}</b>INIT</span>`:""}
          ${wt?.perception!=null?`<span class="pd-stat"><b>${wt.perception}</b>PASS\xB7PER</span>`:""}
          <span class="pd-state">${C.online?"bound to the reach":"gone dark"}</span>
        </div>`:`
        <div class="pcard-detail">
          <span class="pd-state">${C.online?"walks the reach unseen":"gone dark"}</span>
        </div>`}
      </div>
      ${I?`<span class="pcard-ac" title="Armor Class" aria-label="Armor Class ${ne}">${ht("shield","ic ic-xs")}<b>${ne}</b><small>AC</small></span>`:""}`;let Wt=G.querySelector("canvas");return Wt&&I&&bc(Wt,{archetype:I.archetype,color:C.color||"#c9a227",name:C.name,size:44}),G}function dt(C,I){let G=new Map;for(let ne of C){let xe=G.get(ne.id);(!xe||!xe.online&&ne.online)&&G.set(ne.id,ne)}let J=Ee.getState(),ie=[...G.values()].filter(ne=>ne.id!==J.me?.id&&Ie(ne,I)?.id!==J.myTokenId).sort((ne,xe)=>Number(xe.online)-Number(ne.online));h.hidden=ie.length===0;let Q=[],me=new Set;for(let ne of ie){me.add(ne.id);let xe=Ie(ne,I),Ze=xe?.conditions||[],Tt=xe?.sheet?.passive,wt=xe?.deathSaves,et=[ne.name,ne.role,ne.online,ne.color,xe?.archetype??"",xe?.hpMax??"",xe?.ac??"",xe?.speedFt??"",xe?.initiative??"",Ze.join(","),wt?`${wt.ok}/${wt.fail}/${Number(wt.stable)}`:"",Tt?.perception??"",xe?.id===Ee.getState().myTokenId?"1":""].join("|"),ge=ve.get(ne.id);if((!ge||ge.key!==et)&&(ge={el:Te(ne,xe),key:et},ve.set(ne.id,ge)),xe){let It=ge.el.querySelector(".pcard-hpbar"),nt=ge.el.querySelector(".pcard-hpbar i"),Wt=ge.el.querySelector(".pcard-hpbar b"),wn=Math.max(0,Math.min(100,xe.hp/xe.hpMax*100));It&&(It.dataset.band=wn>60?"high":wn>30?"mid":"low"),nt&&(nt.style.width=wn+"%"),Wt&&(Wt.innerHTML=`${Math.max(0,xe.hp)} <em>/ ${Math.max(1,xe.hpMax)}</em>`)}Q.push(ge.el)}for(let ne of[...ve.keys()])me.has(ne)||(ve.get(ne).el.remove(),ve.delete(ne));let Ce=Array.from(c.children);if(Ce.length!==Q.length||Q.some((ne,xe)=>ne!==Ce[xe]))for(let ne of Q)c.appendChild(ne)}function fe(C,I){u.hidden=I!=="dm";let G=C.filter(ie=>ie.kind==="monster"&&!ie.hidden),J=G.slice(0,6);u.innerHTML=J.map(ie=>`
      <div class="hud-monster${ie.hp<=0?" dead":""}">
        <span class="mname">${k(ie.name)}</span>
        <span class="mhp">${Math.max(0,ie.hp)}/${ie.hpMax}</span>
      </div>`).join("")+(G.length>6?`<div class="hud-monster more">+${G.length-6} more</div>`:""),se.textContent=String(G.length),$.innerHTML=G.map(ie=>`
      <div class="dm-list-row">
        <span>${k(ie.name)}</span>
        <span>${ie.hp}/${ie.hpMax}</span>
        <button type="button" class="dm-x" data-rm="${ie.id}" title="unmake">${ht("x","ic ic-xs")}</button>
      </div>`).join("")}function Re(C){let I=C.me,G=C.tokens.find(xe=>xe.id===C.myTokenId);if(!I||!G){d.hidden=!0;return}d.hidden=!1,d.style.setProperty("--pc",I.color||"#c9a227"),g.textContent=A(G.name),b.textContent=(Ii[G.archetype]||Ii.warden).title;let J=Math.max(1,G.hpMax),ie=Math.max(0,Math.min(J,G.hp)),Q=Math.max(0,Math.min(100,ie/J*100));m.style.width=Q+"%",m.dataset.band=Q>60?"high":Q>30?"mid":"low",x.textContent=`${ie} / ${J}`,p.setAttribute("aria-valuenow",String(ie)),p.setAttribute("aria-valuemax",String(J)),v.textContent=String(G.ac);let me=G.conditions||[],Ce=me.slice(0,3);y.innerHTML=Ce.map(xe=>`<span class="cond-chip">${k(xe)}</span>`).join("")+(me.length>Ce.length?`<span class="cond-chip cond-more">+${me.length-Ce.length}</span>`:"")+(G.deathSaves&&!G.deathSaves.stable&&!G.deathSaves.dead&&(G.deathSaves.fail>0||G.deathSaves.ok>0)?`<span class="cond-chip death">${ht("droplet","ic ic-xs")} saves ${G.deathSaves.ok}<b>\xB7</b>${G.deathSaves.fail}</span>`:"");let ne=`${G.archetype}|${I.color}|${G.name}`;ne!==Fe&&(Fe=ne,bc(f,{archetype:G.archetype,color:I.color||"#c9a227",name:G.name,size:64}))}function Oe(C){let I=[...C,...ke].sort((G,J)=>G.t-J.t).slice(-9);w.innerHTML=I.map(G=>G.from?`<div class="hud-chat-line"><span style="color:${G.color||"#b8952f"}">${k(G.from)}:</span> ${k(G.text)}</div>`:`<div class="hud-chat-line sys">${k(G.text)}</div>`).join(""),w.scrollTop=w.scrollHeight}function Be(C){if(!C){T.hidden=!0;return}T.hidden=!1,T.innerHTML=`${k(C)} <span class="key">E</span>`}function Ae(C){let I=te.value;te.replaceChildren(...C.map(Q=>{let me=document.createElement("option");me.value=String(Q.wallIndex);let Ce=Number.isFinite(Q.x1)&&Number.isFinite(Q.z1)?` \xB7 ${Q.x1},${Q.z1}`:"",ne=Q.secret?"secret ":"",xe=Q.locked?"locked":Q.open?"open":"closed";return me.textContent=`${ne}door ${Q.wallIndex+1}${Ce} \xB7 ${xe}`,me})),C.some(Q=>String(Q.wallIndex)===I)&&(te.value=I),te.disabled=C.length===0,$e.disabled=C.length===0;let G=C.find(Q=>String(Q.wallIndex)===te.value),J=G?["open","close","lock","unlock",...G.secret?["reveal","conceal"]:[]]:[],ie=Pe.value;Pe.replaceChildren(...J.map(Q=>{let me=document.createElement("option");return me.value=Q,me.textContent=Q,me})),J.includes(ie)&&(Pe.value=ie),Pe.disabled=J.length===0}function lt(C){let I=C==="dm";E.hidden=!I,ye.innerHTML=I?`WASD move \xB7 E interact \xB7 drag orbit \xB7 wheel zoom \xB7 \u21B5 chat \xB7 ${ht("crown","ic ic-xs")} DM tools`:"WASD move \xB7 E interact \xB7 drag orbit \xB7 wheel zoom \xB7 \u21B5 chat"}let ze=null,tt=null,z=new Map,_e=null,j=0,oe="",Me="";function we(C,I){let G=new Set(C.initiative?.order||[]),J=C.tokens.filter(ne=>ne.kind==="monster"&&!ne.hidden&&ne.hp>0&&!ne.deathSaves?.dead&&G.has(ne.id)).sort((ne,xe)=>ne.name.localeCompare(xe.name)),ie=JSON.stringify(J.map(ne=>[ne.id,ne.name]));if(ie!==Me){Me=ie;let ne=document.createElement("option");ne.value="",ne.textContent=J.length?"Choose a foe\u2026":"No visible foes",rt.replaceChildren(ne);for(let xe of J){let Ze=document.createElement("option");Ze.value=xe.id,Ze.textContent=xe.name,rt.appendChild(Ze)}J.some(xe=>xe.id===oe)||(oe=""),rt.value=oe}let Q=J.find(ne=>ne.id===oe),me=!!I?.actionUsed,Ce=Q&&I?Math.round(Math.hypot(Q.x-I.x,Q.z-I.z)):null;ut.textContent=Q&&Ce!=null?`${Q.name} \xB7 ${Q.hp}/${Q.hpMax} HP \xB7 ${Ce} ft`:J.length?"Choose a visible foe.":"No visible foes to target.";for(let ne of De.querySelectorAll(".ta-btn")){let xe=ne.dataset.act==="attack"||ne.dataset.act==="cantrip";ne.dataset.act!=="end"&&(ne.disabled=me||xe&&!Q)}return Q}function ct(C){if(!ze||!tt)return;let I=tt.children[j],G=ze.clientWidth;if(!I||I.hidden||G<=0)return;let J=tt.scrollWidth,ie;if(J+28<=G)ie=Math.round((G-J)/2);else{let Q=I.offsetLeft+I.offsetWidth/2;ie=Math.round(Math.max(G-14-J,Math.min(14,G/2-Q)))}C?(tt.style.transition="none",tt.style.transform=`translateX(${ie}px)`,tt.offsetWidth,tt.style.transition=""):tt.style.transform=`translateX(${ie}px)`}function Nt(C){let I=C.initiative,G=De.querySelector('[data-act="help"]');if(De.querySelectorAll(".ta-btn").forEach(pt=>{pt.hidden=pt.dataset.act==="cantrip"}),!I||!Array.isArray(I.order)||I.order.length===0){Se.hidden=!0,st.hidden=!0,oe="",rt.value="";let pt=document.createElement("option");pt.value="",pt.textContent="Choose a foe\u2026",rt.replaceChildren(pt),Me="\0",De.querySelectorAll(".ta-btn").forEach(qt=>{qt.disabled=!1});let Ye=C.tokens.find(qt=>qt.id===C.myTokenId),St=!!Ye&&C.tokens.some(qt=>qt.kind==="player"&&qt.id!==Ye.id&&qt.hp<=0&&!qt.deathSaves?.dead&&C.players.some(Zt=>Zt.id===qt.ownerId&&Zt.online));De.hidden=!St,St&&(De.querySelectorAll(".ta-btn").forEach(qt=>{qt.hidden=qt.dataset.act!=="help"}),Ne.textContent="A COMPANION IS DOWN",G.hidden=!1,U.textContent="Approach them to help"),ze=tt=null,_e=null,z.clear();return}Se.hidden=!1;let J=I.order.map(pt=>String(pt)),ie=Number(I.turnIdx),Q=ie>=0&&ie<J.length?J[ie]:"";j=ie>=0&&ie<J.length?ie:-1;let me=new Map(C.tokens.map(pt=>[pt.id,pt])),Ce=J.join(","),ne=Ce!==_e;if(ne){_e=Ce,Se.innerHTML=`
        <div class="ini-turn" data-ini-turn></div>
        <div class="ini-round"><span class="ini-round-cap">round</span><b data-round>${I.round??1}</b></div>
        <div class="ini-window"><div class="ini-track"></div></div>`,ze=Se.querySelector(".ini-window"),tt=Se.querySelector(".ini-track"),z.clear();for(let pt of J){let Ye=document.createElement("div");Ye.className="ini-cell",Ye.dataset.id=pt,tt.appendChild(Ye),z.set(pt,Ye)}}else{let pt=Se.querySelector("[data-round]");pt&&(pt.textContent=String(I.round??1))}let xe=me.get(Q),Ze=Se.querySelector("[data-ini-turn]");Ze&&(Ze.textContent=Q?Q===C.myTokenId?"YOUR TURN":xe?.kind==="monster"?`ENEMY TURN \xB7 ${xe.name}`:`WAITING FOR \xB7 ${xe?.name||"next turn"}`:"TURN IN PROGRESS",Ze.dataset.turn=Q?Q===C.myTokenId?"you":xe?.kind==="monster"?"enemy":"party":"party");for(let pt=0;pt<J.length;pt++){let Ye=z.get(J[pt]);if(!Ye)continue;let St=me.get(J[pt]);if(!St){Ye.hidden=!0;continue}Ye.hidden=!1;let qt=St.hp<=0||St.deathSaves?.dead,Zt=Math.max(0,Math.min(100,St.hp/St.hpMax*100));Ye.className=`ini-cell${J[pt]===Q?" now":""}${qt?" down":""}${St.id===C.myTokenId?" mine":""} k-${St.kind}`,Ye.title=St.name;let zs=`${St.name}|${St.initiative??""}|${qt?"d":""}`;if(Ye.dataset.sk!==zs)Ye.dataset.sk=zs,Ye.innerHTML=`
          <span class="ini-hpstrip"><i style="height:${Zt}%"></i></span>
          ${St.initiative!=null?`<span class="ini-badge">${k(String(St.initiative))}</span>`:""}
          <span class="ini-name">${k(St.name)}</span>
          <span class="ini-hp">${Math.max(0,St.hp)}/${St.hpMax}</span>
          ${qt?`<span class="ini-skull">${ht("skull","ic")}</span>`:""}`;else{let Ba=Ye.querySelector(".ini-hp");Ba&&(Ba.textContent=`${Math.max(0,St.hp)}/${St.hpMax}`);let Vr=Ye.querySelector(".ini-hpstrip i");Vr&&(Vr.style.height=Zt+"%")}}if(ct(ne),!(Q===C.myTokenId)){De.hidden=!0;return}De.hidden=!1,st.hidden=!1;let wt=me.get(String(C.myTokenId)),et=C.tokens.some(pt=>pt.kind==="player"&&pt.id!==wt?.id&&pt.hp<=0&&!pt.deathSaves?.dead&&C.players.some(Ye=>Ye.id===pt.ownerId&&Ye.online));G.hidden=!et;let ge=I.movement,It=ge&&ge.tokenId===Q&&ge.usedFt||0,nt=wt?.speedFt??30,Wt=ge&&ge.tokenId===Q&&Number.isFinite(ge.maxFt)?ge.maxFt:nt;U.textContent=`${Math.max(0,Wt-It)}/${Wt} ft movement \xB7 ${wt?.actionUsed?"action spent":"action ready"} \xB7 ${Math.max(0,wt?.hp??0)} hp`;let tn=wt?.sheet?.spellcasting?.cantrips?.[0];fn.hidden=!tn,tn&&(at.textContent=String(tn)),we(C,wt)}let it=Ee.getState(),ft=C=>{if(C.connection!==it.connection&&ae(C.connection),C.pingMs!==it.pingMs&&ce(C.pingMs),(C.mapName!==it.mapName||C.dayTime!==it.dayTime||C.weather!==it.weather)&&re(C.mapName,C.dayTime,C.weather),(C.players!==it.players||C.tokens!==it.tokens)&&dt(C.players,C.tokens),(C.tokens!==it.tokens||C.me?.role!==it.me?.role)&&fe(C.tokens,C.me?.role),(C.tokens!==it.tokens||C.me!==it.me||C.myTokenId!==it.myTokenId)&&Re(C),C.chat!==it.chat){let I=C.chat.length?C.chat[C.chat.length-1].t:-1;I!==_t&&(_t=I,Oe(C.chat))}C.interactLabel!==it.interactLabel&&Be(C.interactLabel),C.me?.role!==it.me?.role&&lt(C.me?.role),C.doors!==it.doors&&Ae(C.doors),(C.initiative!==it.initiative||C.tokens!==it.tokens||C.myTokenId!==it.myTokenId)&&Nt(C),it=C},rn=Ee.subscribe((C,I)=>{it=I,ft(C)}),In=Ee.getState();it={...In,me:null,players:[],tokens:[],doors:[],chat:[],mapName:"",dayTime:-1,weather:"",interactLabel:null,connection:"offline",pingMs:null},ft(In);let Oa=()=>{M.hidden=!0,_.hidden=!1,_.focus()},Os=()=>{_.hidden=!0,M.hidden=!1,_.value=""};M.addEventListener("click",Oa);let jn=C=>{C.target?.closest("button")&&pi("ui")},Us=C=>{C.key.length===1&&!C.ctrlKey&&!C.metaKey&&!C.altKey&&pi("type",.45)};e.addEventListener("click",jn),_.addEventListener("keydown",Us),_.addEventListener("keydown",C=>{if(C.stopPropagation(),C.key==="Enter"){let I=_.value.trim();I&&vd(I),Os()}else C.key==="Escape"&&Os()});let zr="",os=0,ls=0,Fs=0,Bs=We.on(qe.MOVE_REJECTED,C=>{let I=String(C?.reason||"blocked");if(I==="not_your_turn")return;let G=Date.now();(I!==zr||G>=ls)&&(zr=I,os=0,ls=G+2e3,ot.hidden=!1,window.clearTimeout(Fs),Fs=window.setTimeout(()=>{ot.hidden=!0},2e3)),os++;let J=I==="no_movement"?"No movement remaining":I==="blocked"?"That way is blocked":"Movement corrected";ot.textContent=os>1?`${J} \xB7 \xD7${os}`:J});_.addEventListener("blur",()=>{_.value||Os()});let Ua=We.on(qe.ROLL,C=>{if(!C)return;let I=C.nat;I!==20&&I!==1&&(I=/^\s*1d20/i.test(String(C.formula||""))&&Array.isArray(C.rolls)&&C.rolls.length?Number(C.rolls[0]):void 0);let G=I===20||C.crit===!0,J=I===1,ie=document.createElement("div");ie.className=`hud-roll${G?" crit":""}${J?" fail":""}`;let Q=Array.isArray(C.rolls)?C.rolls.join(" "):"";for(ie.innerHTML=`
      ${ht("d20","ic ic-sm")}
      <span class="roll-tag">${k(String(C.tag||"roll"))}</span>
      <span class="roll-formula">${k(String(C.formula||""))}</span>
      ${Q?`<span class="roll-rolls">[${k(String(Q))}]</span>`:""}
      ${G?'<span class="roll-tier">critical</span>':""}${J?'<span class="roll-tier">fumble</span>':""}
      <span class="roll-total">${k(String(C.total??"?"))}</span>`,L.appendChild(ie);L.children.length>3;)L.firstElementChild?.remove();setTimeout(()=>{ie.classList.add("bye")},3500),setTimeout(()=>{ie.remove()},4150)}),Fa=We.on(qe.PROMPT,C=>{if(C){if(C.kind==="turn"){De.hidden=!1,Ne.textContent=`THY TURN \u2014 ROUND ${C.round??""}`,Ne.classList.remove("flash"),Ne.offsetWidth,Ne.classList.add("flash");return}if(C.kind==="notice"){ke.push({from:"",color:"#c98a5a",text:String(C.text||""),t:Date.now()}),Oe(Ee.getState().chat);return}if(C.kind==="solo-down-cancel"){S.hidden=!0;return}if(C.kind==="solo-down"||C.kind==="character-ended"){S.hidden=!1,S.innerHTML=`
        <div class="hud-prompt-card ornate" role="alertdialog" aria-modal="true">
          <div class="hp-kind">${k(String(C.kind))}</div>
          <div class="hp-title">${k(String(C.title||"The moment bends\u2026"))}</div>
          <div class="hp-text">${k(String(C.text||""))}</div>
          <div class="hp-actions">${(Array.isArray(C.options)?C.options:[]).map((I,G)=>`<button type="button" class="hp-opt" data-opt="${G}">${k(String(I.label||"Continue"))}</button>`).join("")}
          ${C.kind==="solo-down"?'<button type="button" class="hp-dismiss" data-hp-dismiss>wait for help</button>':""}
        </div>`,S.querySelector("[data-hp-dismiss]")?.addEventListener("click",()=>{S.hidden=!0}),S.querySelectorAll(".hp-opt").forEach((I,G)=>I.addEventListener("click",()=>{let J=C.options?.[G]?.action;J==="accept-death"?us({kind:"acceptDeath"}):J==="return-menu"&&(S.hidden=!0,Ee.getState().setPhase("join"),$a())}));return}S.hidden=!1,S.innerHTML=`
      <div class="hud-prompt-card ornate">
        <div class="hp-kind">${k(String(C.kind||"choice"))}</div>
        <div class="hp-title">${k(String(C.title||"The moment bends\u2026"))}</div>
        ${C.text?`<div class="hp-text">${k(String(C.text))}</div>`:""}
        <div class="hp-actions">
          ${Array.isArray(C.options)?C.options.map((I,G)=>`<button type="button" class="hp-opt" data-opt="${G}">${k(String(I.label??I))}</button>`).join(""):""}
          <button type="button" class="hp-dismiss" data-hp-dismiss>later</button>
        </div>
      </div>`,S.querySelector("[data-hp-dismiss]")?.addEventListener("click",()=>{S.hidden=!0}),S.querySelectorAll(".hp-opt").forEach(I=>I.addEventListener("click",()=>{S.hidden=!0}))}}),ac=We.on(qe.ERROR,C=>{Ee.getState().phase==="playing"&&(ke.push({from:"",color:"#d9704f",text:C?.message||"the reach refused",t:Date.now()}),ke.length>30&&(ke=ke.slice(-30)),Oe(Ee.getState().chat))}),oc=We.on(qe.FX,C=>{if(!C||Ee.getState().phase!=="playing")return;let I=C.action||{};(I.anim==="hit"||I.anim==="crit"||I.anim==="heal"||I.anim==="miss"||I.anim==="die")&&(ke.push({from:"",color:I.anim==="heal"?"#8fe8b0":I.anim==="die"?"#b96a6a":"#c98a5a",text:`${C.actorId||"?"} \u2014 ${I.anim}${I.power?` (${I.power})`:""}`,t:Date.now()}),ke.length>30&&(ke=ke.slice(-30)),Oe(Ee.getState().chat))});D.addEventListener("click",()=>{O.hidden=!O.hidden});for(let C of["clear","rain","storm","fog"]){let I=document.createElement("button");I.type="button",I.innerHTML=`${mc(C)} <span>${C}</span>`,I.addEventListener("click",()=>di("weather",{type:C})),F.appendChild(I)}let Gr=(C,I,G)=>{let J=document.createElement("button");J.type="button",J.innerHTML=`${I} <span>${C}</span>`,J.addEventListener("click",()=>di("daynight",G)),W.appendChild(J)};Gr("noon",ht("sun","ic ic-sm"),{mode:"fixed",time:12*60}),Gr("night",ht("moon","ic ic-sm"),{mode:"fixed",time:21*60}),Gr("cycle",ht("sparkle","ic ic-sm"),{mode:"cycle"}),q.addEventListener("click",()=>{let C=Ee.getState(),I=C.tokens.find(G=>G.id===C.myTokenId);di("spawn",{monsterId:ee.value,x:(I?.x??0)+15,z:(I?.z??0)+10})});let P=t("[data-dm-combat-start]"),V=t("[data-dm-combat-end]");P?.addEventListener("click",()=>di("combat",{action:"start"})),V?.addEventListener("click",()=>di("combat",{action:"end"})),rt.addEventListener("change",()=>{oe=rt.value;let C=Ee.getState();we(C,C.tokens.find(I=>I.id===C.myTokenId))}),De.querySelectorAll(".ta-btn").forEach(C=>{C.addEventListener("click",()=>{let I=Ee.getState(),G=I.tokens.find(Q=>Q.id===I.myTokenId),J=C.dataset.act;if(!G)return;if(J==="end"){yd();return}if(J==="dash"){us({kind:"dash"});return}if(J==="dodge"){us({kind:"dodge"});return}if(J==="help"){let Q=I.tokens.filter(me=>me.kind==="player"&&me.id!==G.id&&me.hp<=0&&!me.deathSaves?.dead).sort((me,Ce)=>Math.hypot(me.x-G.x,me.z-G.z)-Math.hypot(Ce.x-G.x,Ce.z-G.z))[0];Q&&us({kind:"help",targetId:Q.id});return}let ie=I.tokens.find(Q=>Q.id===oe&&Q.kind==="monster"&&!Q.hidden&&Q.hp>0&&!Q.deathSaves?.dead);if(J==="attack"&&ie){us({kind:"attack",targetId:ie.id});return}if(J==="cantrip"){let me=G?.sheet?.spellcasting?.cantrips?.[0];me&&ie&&us({kind:"cast",spellId:me,targetId:ie.id})}})}),fetch("/api/maps").then(C=>C.json()).then(C=>{for(let I of C.maps||[]){let G=document.createElement("option");G.value=I.id,G.textContent=I.name||I.id,le.appendChild(G)}}).catch(()=>{}),X.addEventListener("click",()=>{le.value&&di("map",{id:le.value})}),te.addEventListener("change",()=>Ae(Ee.getState().doors)),$e.addEventListener("click",()=>{let C=Number(te.value);Number.isInteger(C)&&di("door",{wallIndex:C,action:Pe.value})}),$.addEventListener("click",C=>{let I=C.target.closest("[data-rm]");I&&di("remove",{id:I.dataset.rm})});let K=()=>{Se.hidden||ct(!0)};return window.addEventListener("resize",K),()=>{rn(),Ua(),Fa(),ac(),oc(),Bs(),window.clearTimeout(Fs),e.removeEventListener("click",jn),_.removeEventListener("keydown",Us),window.removeEventListener("resize",K),e.remove()}}async function ef(){try{let i=await Promise.resolve().then(()=>(Qd(),jd)),e=i.mountCreation||i.default||i.mount||null;return e?{mount:e}:null}catch(i){return console.warn("[ashenreach] character creation module not present yet",i),null}}var tf={fighter:"warden",barbarian:"warden",paladin:"warden",rogue:"shadowdancer",ranger:"shadowdancer",monk:"shadowdancer",wizard:"ashen_mage",sorcerer:"ashen_mage",warlock:"ashen_mage",druid:"ashen_mage",cleric:"pale_priest",bard:"pale_priest",artificer:"ashen_mage"};function nf(i,e){if(e.headless){let _=document.createElement("div");_.className="headless-bg",i.appendChild(_)}let t=null,n=null,s=null,r=null,a=null,o=!1,l={name:"",invite:e.invite||"",dm:!!e.dmKey,dmKey:e.dmKey||""},c=null,h=We.on(qe.ERROR,_=>{Ee.getState().phase==="create"&&!c&&(c=_&&_.message||"The gate refused thee.")}),u=Ee.getState().phase,d=()=>{r?.(),r=null,t?.remove(),t=null},f=()=>{a?.(),a=null,s?.remove(),s=null},g=()=>{n?.remove(),n=null},b=()=>{t||(t=document.createElement("div"),i.appendChild(t),r=Ld(t,{invite:e.invite,dmKey:e.dmKey,name:l.name,error:c||void 0,onForge:_=>{l.name=_.name,l.invite=_.invite,l.dm=_.dm,l.dmKey=_.dmKey},onContinue:(_,M,T,L)=>{let S=String(_.class||"fighter").toLowerCase();qa(M,_.name,tf[S]||"warden",{character:_,...T?{dm:!0,dmKey:L}:{}})}}),c=null)},p=()=>{s||(s=document.createElement("div"),i.appendChild(s),a=kd(s))},m=!1,x=()=>{n||m||(m=!0,n=document.createElement("div"),i.appendChild(n),n.innerHTML=`
      <div class="screen-join">
        <div class="join-panel ornate screen-create-ph">
          <div class="join-crown"></div>
          <h1 class="join-title" style="font-size:30px">The Forge of Souls</h1>
          <div class="join-sub">shaping a wanderer from ash\u2026</div>
        </div>
      </div>`,ef().then(_=>{if(!(o||!n)){if(_){n.innerHTML="";try{_.mount(n,{invite:l.invite,name:l.name,onDone:M=>{ag(M);let T=String(M?.class||"fighter").toLowerCase();qa(l.invite,String(M?.name||l.name||"Wanderer"),tf[T]||"warden",{character:M,...l.dm?{dm:!0,dmKey:l.dmKey}:{}})},onCancel:()=>Ee.getState().setPhase("join")})}catch(M){console.error("[ashenreach] creation mount failed",M),v()}}else v();m=!1}}))},v=()=>{n&&(n.innerHTML=`
      <div class="screen-join">
        <div class="join-panel ornate screen-create-ph">
          <div class="join-crown"></div>
          <h1 class="join-title" style="font-size:30px">The Forge of Souls</h1>
          <div class="join-sub">character creation is still being kindled by the smiths.<br/>
            Step in as a plain warden for now \u2014 forge properly next time.</div>
          <button type="button" class="join-enter" data-create-enter>Enter the Reach</button>
        </div>
      </div>`,n.querySelector("[data-create-enter]")?.addEventListener("click",()=>{qa(l.invite,l.name||"Wanderer","warden",l.dm?{dm:!0,dmKey:l.dmKey}:{})}))},y=_=>{switch(_){case"connecting":case"join":g(),f(),b();break;case"create":d(),f(),x();break;case"playing":d(),g(),p();break}};y(u);let w=Ee.subscribe((_,M)=>{_.phase!==M.phase&&y(_.phase)});return()=>{o=!0,w(),h(),d(),g(),f()}}function ag(i){if(!i||typeof i!="object")return;let e=i;if(typeof e.name!="string"||!e.name.trim())return;(typeof e.id!="string"||!e.id)&&(e.id=crypto.randomUUID());let t=e.name.trim();try{let n="ar_characters",s=JSON.parse(localStorage.getItem(n)||"[]"),a=(Array.isArray(s)?s:[]).filter(o=>!o||typeof o.name!="string"||o.name.toLowerCase()!==t.toLowerCase());localStorage.setItem(n,JSON.stringify([i,...a].slice(0,5)))}catch(n){console.warn("[ashenreach] could not save this-device character",n)}}var Fu="169";var og=0,sf=1,lg=2;var xp=1,Bu=2,xi=3,ji=0,hn=1,Mt=2,si=0,yr=1,Vt=2,rf=3,af=4,cg=5,_s=100,hg=101,ug=102,dg=103,fg=104,pg=200,mg=201,gg=202,vg=203,ph=204,mh=205,yg=206,bg=207,xg=208,Sg=209,Mg=210,_g=211,wg=212,Eg=213,Tg=214,gh=0,vh=1,yh=2,Mr=3,bh=4,xh=5,Sh=6,Mh=7,Sp=0,Ag=1,Cg=2,Ji=0,Rg=1,Pg=2,Ig=3,zu=4,Lg=5,kg=6,Dg=7,of="attached",Hg="detached",Mp=300,_r=301,wr=302,_h=303,wh=304,xl=306,ai=1e3,Es=1001,Eh=1002,xn=1003,Ng=1004;var to=1005;var An=1006,Rc=1007;var Ts=1008;var _i=1009,_p=1010,wp=1011,ga=1012,Gu=1013,As=1014,Vn=1015,Xn=1016,Vu=1017,Wu=1018,Er=1020,Ep=35902,Tp=1021,Ap=1022,Hn=1023,Cp=1024,Rp=1025,br=1026,Tr=1027,qu=1028,$u=1029,Pp=1030,Xu=1031;var Yu=1033,Do=33776,Ho=33777,No=33778,Oo=33779,Th=35840,Ah=35841,Ch=35842,Rh=35843,Ph=36196,Ih=37492,Lh=37496,kh=37808,Dh=37809,Hh=37810,Nh=37811,Oh=37812,Uh=37813,Fh=37814,Bh=37815,zh=37816,Gh=37817,Vh=37818,Wh=37819,qh=37820,$h=37821,Uo=36492,Xh=36494,Yh=36495,Ip=36283,Kh=36284,Zh=36285,Jh=36286;var Bo=2300,jh=2301,Pc=2302,lf=2400,cf=2401,hf=2402;var Og=3200,Ug=3201;var Lp=0,Fg=1,Ki="",Gt="srgb",ts="srgb-linear",Ku="display-p3",Sl="display-p3-linear",zo="linear",Pt="srgb",Go="rec709",Vo="p3";var Js=7680;var uf=519,Bg=512,zg=513,Gg=514,kp=515,Vg=516,Wg=517,qg=518,$g=519,va=35044;var df="300 es",Mi=2e3,Wo=2001,Qi=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){if(this._listeners===void 0)return!1;let n=this._listeners;return n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){if(this._listeners===void 0)return;let s=this._listeners[e];if(s!==void 0){let r=s.indexOf(t);r!==-1&&s.splice(r,1)}}dispatchEvent(e){if(this._listeners===void 0)return;let n=this._listeners[e.type];if(n!==void 0){e.target=this;let s=n.slice(0);for(let r=0,a=s.length;r<a;r++)s[r].call(this,e);e.target=null}}},on=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];var Ic=Math.PI/180,Qh=180/Math.PI;function ri(){let i=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(on[i&255]+on[i>>8&255]+on[i>>16&255]+on[i>>24&255]+"-"+on[e&255]+on[e>>8&255]+"-"+on[e>>16&15|64]+on[e>>24&255]+"-"+on[t&63|128]+on[t>>8&255]+"-"+on[t>>16&255]+on[t>>24&255]+on[n&255]+on[n>>8&255]+on[n>>16&255]+on[n>>24&255]).toLowerCase()}function nn(i,e,t){return Math.max(e,Math.min(t,i))}function Xg(i,e){return(i%e+e)%e}function Lc(i,e,t){return(1-t)*i+t*e}function ii(i,e){switch(e.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("Invalid component type.")}}function Et(i,e){switch(e.constructor){case Float32Array:return i;case Uint32Array:return Math.round(i*4294967295);case Uint16Array:return Math.round(i*65535);case Uint8Array:return Math.round(i*255);case Int32Array:return Math.round(i*2147483647);case Int16Array:return Math.round(i*32767);case Int8Array:return Math.round(i*127);default:throw new Error("Invalid component type.")}}var ue=class i{constructor(e=0,t=0){i.prototype.isVector2=!0,this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,n=this.y,s=e.elements;return this.x=s[0]*t+s[3]*n+s[6],this.y=s[1]*t+s[4]*n+s[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(nn(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let n=Math.cos(t),s=Math.sin(t),r=this.x-e.x,a=this.y-e.y;return this.x=r*n-a*s+e.x,this.y=r*s+a*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},je=class i{constructor(e,t,n,s,r,a,o,l,c){i.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,n,s,r,a,o,l,c)}set(e,t,n,s,r,a,o,l,c){let h=this.elements;return h[0]=e,h[1]=s,h[2]=o,h[3]=t,h[4]=r,h[5]=l,h[6]=n,h[7]=a,h[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,s=t.elements,r=this.elements,a=n[0],o=n[3],l=n[6],c=n[1],h=n[4],u=n[7],d=n[2],f=n[5],g=n[8],b=s[0],p=s[3],m=s[6],x=s[1],v=s[4],y=s[7],w=s[2],_=s[5],M=s[8];return r[0]=a*b+o*x+l*w,r[3]=a*p+o*v+l*_,r[6]=a*m+o*y+l*M,r[1]=c*b+h*x+u*w,r[4]=c*p+h*v+u*_,r[7]=c*m+h*y+u*M,r[2]=d*b+f*x+g*w,r[5]=d*p+f*v+g*_,r[8]=d*m+f*y+g*M,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],a=e[4],o=e[5],l=e[6],c=e[7],h=e[8];return t*a*h-t*o*c-n*r*h+n*o*l+s*r*c-s*a*l}invert(){let e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],a=e[4],o=e[5],l=e[6],c=e[7],h=e[8],u=h*a-o*c,d=o*l-h*r,f=c*r-a*l,g=t*u+n*d+s*f;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);let b=1/g;return e[0]=u*b,e[1]=(s*c-h*n)*b,e[2]=(o*n-s*a)*b,e[3]=d*b,e[4]=(h*t-s*l)*b,e[5]=(s*r-o*t)*b,e[6]=f*b,e[7]=(n*l-c*t)*b,e[8]=(a*t-n*r)*b,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,s,r,a,o){let l=Math.cos(r),c=Math.sin(r);return this.set(n*l,n*c,-n*(l*a+c*o)+a+e,-s*c,s*l,-s*(-c*a+l*o)+o+t,0,0,1),this}scale(e,t){return this.premultiply(kc.makeScale(e,t)),this}rotate(e){return this.premultiply(kc.makeRotation(-e)),this}translate(e,t){return this.premultiply(kc.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,n=e.elements;for(let s=0;s<9;s++)if(t[s]!==n[s])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}},kc=new je;function Dp(i){for(let e=i.length-1;e>=0;--e)if(i[e]>=65535)return!0;return!1}function qo(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function Yg(){let i=qo("canvas");return i.style.display="block",i}var ff={};function Fo(i){i in ff||(ff[i]=!0,console.warn(i))}function Kg(i,e,t){return new Promise(function(n,s){function r(){switch(i.clientWaitSync(e,i.SYNC_FLUSH_COMMANDS_BIT,0)){case i.WAIT_FAILED:s();break;case i.TIMEOUT_EXPIRED:setTimeout(r,t);break;default:n()}}setTimeout(r,t)})}function Zg(i){let e=i.elements;e[2]=.5*e[2]+.5*e[3],e[6]=.5*e[6]+.5*e[7],e[10]=.5*e[10]+.5*e[11],e[14]=.5*e[14]+.5*e[15]}function Jg(i){let e=i.elements;e[11]===-1?(e[10]=-e[10]-1,e[14]=-e[14]):(e[10]=-e[10],e[14]=-e[14]+1)}var pf=new je().set(.8224621,.177538,0,.0331941,.9668058,0,.0170827,.0723974,.9105199),mf=new je().set(1.2249401,-.2249404,0,-.0420569,1.0420571,0,-.0196376,-.0786361,1.0982735),ea={[ts]:{transfer:zo,primaries:Go,luminanceCoefficients:[.2126,.7152,.0722],toReference:i=>i,fromReference:i=>i},[Gt]:{transfer:Pt,primaries:Go,luminanceCoefficients:[.2126,.7152,.0722],toReference:i=>i.convertSRGBToLinear(),fromReference:i=>i.convertLinearToSRGB()},[Sl]:{transfer:zo,primaries:Vo,luminanceCoefficients:[.2289,.6917,.0793],toReference:i=>i.applyMatrix3(mf),fromReference:i=>i.applyMatrix3(pf)},[Ku]:{transfer:Pt,primaries:Vo,luminanceCoefficients:[.2289,.6917,.0793],toReference:i=>i.convertSRGBToLinear().applyMatrix3(mf),fromReference:i=>i.applyMatrix3(pf).convertLinearToSRGB()}},jg=new Set([ts,Sl]),bt={enabled:!0,_workingColorSpace:ts,get workingColorSpace(){return this._workingColorSpace},set workingColorSpace(i){if(!jg.has(i))throw new Error(`Unsupported working color space, "${i}".`);this._workingColorSpace=i},convert:function(i,e,t){if(this.enabled===!1||e===t||!e||!t)return i;let n=ea[e].toReference,s=ea[t].fromReference;return s(n(i))},fromWorkingColorSpace:function(i,e){return this.convert(i,this._workingColorSpace,e)},toWorkingColorSpace:function(i,e){return this.convert(i,e,this._workingColorSpace)},getPrimaries:function(i){return ea[i].primaries},getTransfer:function(i){return i===Ki?zo:ea[i].transfer},getLuminanceCoefficients:function(i,e=this._workingColorSpace){return i.fromArray(ea[e].luminanceCoefficients)}};function xr(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function Dc(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}var js,eu=class{static getDataURL(e){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let t;if(e instanceof HTMLCanvasElement)t=e;else{js===void 0&&(js=qo("canvas")),js.width=e.width,js.height=e.height;let n=js.getContext("2d");e instanceof ImageData?n.putImageData(e,0,0):n.drawImage(e,0,0,e.width,e.height),t=js}return t.width>2048||t.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",e),t.toDataURL("image/jpeg",.6)):t.toDataURL("image/png")}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){let t=qo("canvas");t.width=e.width,t.height=e.height;let n=t.getContext("2d");n.drawImage(e,0,0,e.width,e.height);let s=n.getImageData(0,0,e.width,e.height),r=s.data;for(let a=0;a<r.length;a++)r[a]=xr(r[a]/255)*255;return n.putImageData(s,0,0),t}else if(e.data){let t=e.data.slice(0);for(let n=0;n<t.length;n++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[n]=Math.floor(xr(t[n]/255)*255):t[n]=xr(t[n]);return{data:t,width:e.width,height:e.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}},Qg=0,$o=class{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:Qg++}),this.uuid=ri(),this.data=e,this.dataReady=!0,this.version=0}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let n={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let a=0,o=s.length;a<o;a++)s[a].isDataTexture?r.push(Hc(s[a].image)):r.push(Hc(s[a]))}else r=Hc(s);n.url=r}return t||(e.images[this.uuid]=n),n}};function Hc(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?eu.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}var ev=0,Sn=class i extends Qi{constructor(e=i.DEFAULT_IMAGE,t=i.DEFAULT_MAPPING,n=Es,s=Es,r=An,a=Ts,o=Hn,l=_i,c=i.DEFAULT_ANISOTROPY,h=Ki){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:ev++}),this.uuid=ri(),this.name="",this.source=new $o(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=n,this.wrapT=s,this.magFilter=r,this.minFilter=a,this.anisotropy=c,this.format=o,this.internalFormat=null,this.type=l,this.offset=new ue(0,0),this.repeat=new ue(1,1),this.center=new ue(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new je,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.pmremVersion=0}get image(){return this.source.data}set image(e=null){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let n={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==Mp)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case ai:e.x=e.x-Math.floor(e.x);break;case Es:e.x=e.x<0?0:1;break;case Eh:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case ai:e.y=e.y-Math.floor(e.y);break;case Es:e.y=e.y<0?0:1;break;case Eh:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};Sn.DEFAULT_IMAGE=null;Sn.DEFAULT_MAPPING=Mp;Sn.DEFAULT_ANISOTROPY=1;var yt=class i{constructor(e=0,t=0,n=0,s=1){i.prototype.isVector4=!0,this.x=e,this.y=t,this.z=n,this.w=s}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,s){return this.x=e,this.y=t,this.z=n,this.w=s,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,n=this.y,s=this.z,r=this.w,a=e.elements;return this.x=a[0]*t+a[4]*n+a[8]*s+a[12]*r,this.y=a[1]*t+a[5]*n+a[9]*s+a[13]*r,this.z=a[2]*t+a[6]*n+a[10]*s+a[14]*r,this.w=a[3]*t+a[7]*n+a[11]*s+a[15]*r,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,s,r,l=e.elements,c=l[0],h=l[4],u=l[8],d=l[1],f=l[5],g=l[9],b=l[2],p=l[6],m=l[10];if(Math.abs(h-d)<.01&&Math.abs(u-b)<.01&&Math.abs(g-p)<.01){if(Math.abs(h+d)<.1&&Math.abs(u+b)<.1&&Math.abs(g+p)<.1&&Math.abs(c+f+m-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;let v=(c+1)/2,y=(f+1)/2,w=(m+1)/2,_=(h+d)/4,M=(u+b)/4,T=(g+p)/4;return v>y&&v>w?v<.01?(n=0,s=.707106781,r=.707106781):(n=Math.sqrt(v),s=_/n,r=M/n):y>w?y<.01?(n=.707106781,s=0,r=.707106781):(s=Math.sqrt(y),n=_/s,r=T/s):w<.01?(n=.707106781,s=.707106781,r=0):(r=Math.sqrt(w),n=M/r,s=T/r),this.set(n,s,r,t),this}let x=Math.sqrt((p-g)*(p-g)+(u-b)*(u-b)+(d-h)*(d-h));return Math.abs(x)<.001&&(x=1),this.x=(p-g)/x,this.y=(u-b)/x,this.z=(d-h)/x,this.w=Math.acos((c+f+m-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this.w=Math.max(e.w,Math.min(t.w,this.w)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this.w=Math.max(e,Math.min(t,this.w)),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},tu=class extends Qi{constructor(e=1,t=1,n={}){super(),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=1,this.scissor=new yt(0,0,e,t),this.scissorTest=!1,this.viewport=new yt(0,0,e,t);let s={width:e,height:t,depth:1};n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:An,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1},n);let r=new Sn(s,n.mapping,n.wrapS,n.wrapT,n.magFilter,n.minFilter,n.format,n.type,n.anisotropy,n.colorSpace);r.flipY=!1,r.generateMipmaps=n.generateMipmaps,r.internalFormat=n.internalFormat,this.textures=[];let a=n.count;for(let o=0;o<a;o++)this.textures[o]=r.clone(),this.textures[o].isRenderTargetTexture=!0;this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.depthTexture=n.depthTexture,this.samples=n.samples}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}setSize(e,t,n=1){if(this.width!==e||this.height!==t||this.depth!==n){this.width=e,this.height=t,this.depth=n;for(let s=0,r=this.textures.length;s<r;s++)this.textures[s].image.width=e,this.textures[s].image.height=t,this.textures[s].image.depth=n;this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let n=0,s=e.textures.length;n<s;n++)this.textures[n]=e.textures[n].clone(),this.textures[n].isRenderTargetTexture=!0;let t=Object.assign({},e.texture.image);return this.texture.source=new $o(t),this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}},gn=class extends tu{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=!0}},Xo=class extends Sn{constructor(e=null,t=1,n=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:s},this.magFilter=xn,this.minFilter=xn,this.wrapR=Es,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}};var nu=class extends Sn{constructor(e=null,t=1,n=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:s},this.magFilter=xn,this.minFilter=xn,this.wrapR=Es,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var Ht=class{constructor(e=0,t=0,n=0,s=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=s}static slerpFlat(e,t,n,s,r,a,o){let l=n[s+0],c=n[s+1],h=n[s+2],u=n[s+3],d=r[a+0],f=r[a+1],g=r[a+2],b=r[a+3];if(o===0){e[t+0]=l,e[t+1]=c,e[t+2]=h,e[t+3]=u;return}if(o===1){e[t+0]=d,e[t+1]=f,e[t+2]=g,e[t+3]=b;return}if(u!==b||l!==d||c!==f||h!==g){let p=1-o,m=l*d+c*f+h*g+u*b,x=m>=0?1:-1,v=1-m*m;if(v>Number.EPSILON){let w=Math.sqrt(v),_=Math.atan2(w,m*x);p=Math.sin(p*_)/w,o=Math.sin(o*_)/w}let y=o*x;if(l=l*p+d*y,c=c*p+f*y,h=h*p+g*y,u=u*p+b*y,p===1-o){let w=1/Math.sqrt(l*l+c*c+h*h+u*u);l*=w,c*=w,h*=w,u*=w}}e[t]=l,e[t+1]=c,e[t+2]=h,e[t+3]=u}static multiplyQuaternionsFlat(e,t,n,s,r,a){let o=n[s],l=n[s+1],c=n[s+2],h=n[s+3],u=r[a],d=r[a+1],f=r[a+2],g=r[a+3];return e[t]=o*g+h*u+l*f-c*d,e[t+1]=l*g+h*d+c*u-o*f,e[t+2]=c*g+h*f+o*d-l*u,e[t+3]=h*g-o*u-l*d-c*f,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,s){return this._x=e,this._y=t,this._z=n,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let n=e._x,s=e._y,r=e._z,a=e._order,o=Math.cos,l=Math.sin,c=o(n/2),h=o(s/2),u=o(r/2),d=l(n/2),f=l(s/2),g=l(r/2);switch(a){case"XYZ":this._x=d*h*u+c*f*g,this._y=c*f*u-d*h*g,this._z=c*h*g+d*f*u,this._w=c*h*u-d*f*g;break;case"YXZ":this._x=d*h*u+c*f*g,this._y=c*f*u-d*h*g,this._z=c*h*g-d*f*u,this._w=c*h*u+d*f*g;break;case"ZXY":this._x=d*h*u-c*f*g,this._y=c*f*u+d*h*g,this._z=c*h*g+d*f*u,this._w=c*h*u-d*f*g;break;case"ZYX":this._x=d*h*u-c*f*g,this._y=c*f*u+d*h*g,this._z=c*h*g-d*f*u,this._w=c*h*u+d*f*g;break;case"YZX":this._x=d*h*u+c*f*g,this._y=c*f*u+d*h*g,this._z=c*h*g-d*f*u,this._w=c*h*u-d*f*g;break;case"XZY":this._x=d*h*u-c*f*g,this._y=c*f*u-d*h*g,this._z=c*h*g+d*f*u,this._w=c*h*u+d*f*g;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+a)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let n=t/2,s=Math.sin(n);return this._x=e.x*s,this._y=e.y*s,this._z=e.z*s,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,n=t[0],s=t[4],r=t[8],a=t[1],o=t[5],l=t[9],c=t[2],h=t[6],u=t[10],d=n+o+u;if(d>0){let f=.5/Math.sqrt(d+1);this._w=.25/f,this._x=(h-l)*f,this._y=(r-c)*f,this._z=(a-s)*f}else if(n>o&&n>u){let f=2*Math.sqrt(1+n-o-u);this._w=(h-l)/f,this._x=.25*f,this._y=(s+a)/f,this._z=(r+c)/f}else if(o>u){let f=2*Math.sqrt(1+o-n-u);this._w=(r-c)/f,this._x=(s+a)/f,this._y=.25*f,this._z=(l+h)/f}else{let f=2*Math.sqrt(1+u-n-o);this._w=(a-s)/f,this._x=(r+c)/f,this._y=(l+h)/f,this._z=.25*f}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<Number.EPSILON?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(nn(this.dot(e),-1,1)))}rotateTowards(e,t){let n=this.angleTo(e);if(n===0)return this;let s=Math.min(1,t/n);return this.slerp(e,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let n=e._x,s=e._y,r=e._z,a=e._w,o=t._x,l=t._y,c=t._z,h=t._w;return this._x=n*h+a*o+s*c-r*l,this._y=s*h+a*l+r*o-n*c,this._z=r*h+a*c+n*l-s*o,this._w=a*h-n*o-s*l-r*c,this._onChangeCallback(),this}slerp(e,t){if(t===0)return this;if(t===1)return this.copy(e);let n=this._x,s=this._y,r=this._z,a=this._w,o=a*e._w+n*e._x+s*e._y+r*e._z;if(o<0?(this._w=-e._w,this._x=-e._x,this._y=-e._y,this._z=-e._z,o=-o):this.copy(e),o>=1)return this._w=a,this._x=n,this._y=s,this._z=r,this;let l=1-o*o;if(l<=Number.EPSILON){let f=1-t;return this._w=f*a+t*this._w,this._x=f*n+t*this._x,this._y=f*s+t*this._y,this._z=f*r+t*this._z,this.normalize(),this}let c=Math.sqrt(l),h=Math.atan2(c,o),u=Math.sin((1-t)*h)/c,d=Math.sin(t*h)/c;return this._w=a*u+this._w*d,this._x=n*u+this._x*d,this._y=s*u+this._y*d,this._z=r*u+this._z*d,this._onChangeCallback(),this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),n=Math.random(),s=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(s*Math.sin(e),s*Math.cos(e),r*Math.sin(t),r*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},N=class i{constructor(e=0,t=0,n=0){i.prototype.isVector3=!0,this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(gf.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(gf.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,n=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6]*s,this.y=r[1]*t+r[4]*n+r[7]*s,this.z=r[2]*t+r[5]*n+r[8]*s,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,n=this.y,s=this.z,r=e.elements,a=1/(r[3]*t+r[7]*n+r[11]*s+r[15]);return this.x=(r[0]*t+r[4]*n+r[8]*s+r[12])*a,this.y=(r[1]*t+r[5]*n+r[9]*s+r[13])*a,this.z=(r[2]*t+r[6]*n+r[10]*s+r[14])*a,this}applyQuaternion(e){let t=this.x,n=this.y,s=this.z,r=e.x,a=e.y,o=e.z,l=e.w,c=2*(a*s-o*n),h=2*(o*t-r*s),u=2*(r*n-a*t);return this.x=t+l*c+a*u-o*h,this.y=n+l*h+o*c-r*u,this.z=s+l*u+r*h-a*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,n=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[4]*n+r[8]*s,this.y=r[1]*t+r[5]*n+r[9]*s,this.z=r[2]*t+r[6]*n+r[10]*s,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let n=e.x,s=e.y,r=e.z,a=t.x,o=t.y,l=t.z;return this.x=s*l-r*o,this.y=r*a-n*l,this.z=n*o-s*a,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return Nc.copy(this).projectOnVector(e),this.sub(Nc)}reflect(e){return this.sub(Nc.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(nn(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y,s=this.z-e.z;return t*t+n*n+s*s}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){let s=Math.sin(t)*e;return this.x=s*Math.sin(n),this.y=Math.cos(t)*e,this.z=s*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),s=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=s,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,n=Math.sqrt(1-t*t);return this.x=n*Math.cos(e),this.y=t,this.z=n*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},Nc=new N,gf=new Ht,oi=class{constructor(e=new N(1/0,1/0,1/0),t=new N(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(Bn.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(Bn.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let n=Bn.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let n=e.geometry;if(n!==void 0){let r=n.getAttribute("position");if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0)for(let a=0,o=r.count;a<o;a++)e.isMesh===!0?e.getVertexPosition(a,Bn):Bn.fromBufferAttribute(r,a),Bn.applyMatrix4(e.matrixWorld),this.expandByPoint(Bn);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),no.copy(e.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),no.copy(n.boundingBox)),no.applyMatrix4(e.matrixWorld),this.union(no)}let s=e.children;for(let r=0,a=s.length;r<a;r++)this.expandByObject(s[r],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,Bn),Bn.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(ta),io.subVectors(this.max,ta),Qs.subVectors(e.a,ta),er.subVectors(e.b,ta),tr.subVectors(e.c,ta),Vi.subVectors(er,Qs),Wi.subVectors(tr,er),gs.subVectors(Qs,tr);let t=[0,-Vi.z,Vi.y,0,-Wi.z,Wi.y,0,-gs.z,gs.y,Vi.z,0,-Vi.x,Wi.z,0,-Wi.x,gs.z,0,-gs.x,-Vi.y,Vi.x,0,-Wi.y,Wi.x,0,-gs.y,gs.x,0];return!Oc(t,Qs,er,tr,io)||(t=[1,0,0,0,1,0,0,0,1],!Oc(t,Qs,er,tr,io))?!1:(so.crossVectors(Vi,Wi),t=[so.x,so.y,so.z],Oc(t,Qs,er,tr,io))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,Bn).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(Bn).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(mi[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),mi[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),mi[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),mi[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),mi[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),mi[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),mi[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),mi[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(mi),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}},mi=[new N,new N,new N,new N,new N,new N,new N,new N],Bn=new N,no=new oi,Qs=new N,er=new N,tr=new N,Vi=new N,Wi=new N,gs=new N,ta=new N,io=new N,so=new N,vs=new N;function Oc(i,e,t,n,s){for(let r=0,a=i.length-3;r<=a;r+=3){vs.fromArray(i,r);let o=s.x*Math.abs(vs.x)+s.y*Math.abs(vs.y)+s.z*Math.abs(vs.z),l=e.dot(vs),c=t.dot(vs),h=n.dot(vs);if(Math.max(-Math.max(l,c,h),Math.min(l,c,h))>o)return!1}return!0}var tv=new oi,na=new N,Uc=new N,li=class{constructor(e=new N,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let n=this.center;t!==void 0?n.copy(t):tv.setFromPoints(e).getCenter(n);let s=0;for(let r=0,a=e.length;r<a;r++)s=Math.max(s,n.distanceToSquared(e[r]));return this.radius=Math.sqrt(s),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;na.subVectors(e,this.center);let t=na.lengthSq();if(t>this.radius*this.radius){let n=Math.sqrt(t),s=(n-this.radius)*.5;this.center.addScaledVector(na,s/n),this.radius+=s}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(Uc.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(na.copy(e.center).add(Uc)),this.expandByPoint(na.copy(e.center).sub(Uc))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}},gi=new N,Fc=new N,ro=new N,qi=new N,Bc=new N,ao=new N,zc=new N,ya=class{constructor(e=new N,t=new N(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,gi)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=gi.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(gi.copy(this.origin).addScaledVector(this.direction,t),gi.distanceToSquared(e))}distanceSqToSegment(e,t,n,s){Fc.copy(e).add(t).multiplyScalar(.5),ro.copy(t).sub(e).normalize(),qi.copy(this.origin).sub(Fc);let r=e.distanceTo(t)*.5,a=-this.direction.dot(ro),o=qi.dot(this.direction),l=-qi.dot(ro),c=qi.lengthSq(),h=Math.abs(1-a*a),u,d,f,g;if(h>0)if(u=a*l-o,d=a*o-l,g=r*h,u>=0)if(d>=-g)if(d<=g){let b=1/h;u*=b,d*=b,f=u*(u+a*d+2*o)+d*(a*u+d+2*l)+c}else d=r,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*l)+c;else d=-r,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*l)+c;else d<=-g?(u=Math.max(0,-(-a*r+o)),d=u>0?-r:Math.min(Math.max(-r,-l),r),f=-u*u+d*(d+2*l)+c):d<=g?(u=0,d=Math.min(Math.max(-r,-l),r),f=d*(d+2*l)+c):(u=Math.max(0,-(a*r+o)),d=u>0?r:Math.min(Math.max(-r,-l),r),f=-u*u+d*(d+2*l)+c);else d=a>0?-r:r,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*l)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,u),s&&s.copy(Fc).addScaledVector(ro,d),f}intersectSphere(e,t){gi.subVectors(e.center,this.origin);let n=gi.dot(this.direction),s=gi.dot(gi)-n*n,r=e.radius*e.radius;if(s>r)return null;let a=Math.sqrt(r-s),o=n-a,l=n+a;return l<0?null:o<0?this.at(l,t):this.at(o,t)}intersectsSphere(e){return this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){let n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,s,r,a,o,l,c=1/this.direction.x,h=1/this.direction.y,u=1/this.direction.z,d=this.origin;return c>=0?(n=(e.min.x-d.x)*c,s=(e.max.x-d.x)*c):(n=(e.max.x-d.x)*c,s=(e.min.x-d.x)*c),h>=0?(r=(e.min.y-d.y)*h,a=(e.max.y-d.y)*h):(r=(e.max.y-d.y)*h,a=(e.min.y-d.y)*h),n>a||r>s||((r>n||isNaN(n))&&(n=r),(a<s||isNaN(s))&&(s=a),u>=0?(o=(e.min.z-d.z)*u,l=(e.max.z-d.z)*u):(o=(e.max.z-d.z)*u,l=(e.min.z-d.z)*u),n>l||o>s)||((o>n||n!==n)&&(n=o),(l<s||s!==s)&&(s=l),s<0)?null:this.at(n>=0?n:s,t)}intersectsBox(e){return this.intersectBox(e,gi)!==null}intersectTriangle(e,t,n,s,r){Bc.subVectors(t,e),ao.subVectors(n,e),zc.crossVectors(Bc,ao);let a=this.direction.dot(zc),o;if(a>0){if(s)return null;o=1}else if(a<0)o=-1,a=-a;else return null;qi.subVectors(this.origin,e);let l=o*this.direction.dot(ao.crossVectors(qi,ao));if(l<0)return null;let c=o*this.direction.dot(Bc.cross(qi));if(c<0||l+c>a)return null;let h=-o*qi.dot(zc);return h<0?null:this.at(h/a,r)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},Ge=class i{constructor(e,t,n,s,r,a,o,l,c,h,u,d,f,g,b,p){i.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,n,s,r,a,o,l,c,h,u,d,f,g,b,p)}set(e,t,n,s,r,a,o,l,c,h,u,d,f,g,b,p){let m=this.elements;return m[0]=e,m[4]=t,m[8]=n,m[12]=s,m[1]=r,m[5]=a,m[9]=o,m[13]=l,m[2]=c,m[6]=h,m[10]=u,m[14]=d,m[3]=f,m[7]=g,m[11]=b,m[15]=p,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new i().fromArray(this.elements)}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){let t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){let t=this.elements,n=e.elements,s=1/nr.setFromMatrixColumn(e,0).length(),r=1/nr.setFromMatrixColumn(e,1).length(),a=1/nr.setFromMatrixColumn(e,2).length();return t[0]=n[0]*s,t[1]=n[1]*s,t[2]=n[2]*s,t[3]=0,t[4]=n[4]*r,t[5]=n[5]*r,t[6]=n[6]*r,t[7]=0,t[8]=n[8]*a,t[9]=n[9]*a,t[10]=n[10]*a,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,n=e.x,s=e.y,r=e.z,a=Math.cos(n),o=Math.sin(n),l=Math.cos(s),c=Math.sin(s),h=Math.cos(r),u=Math.sin(r);if(e.order==="XYZ"){let d=a*h,f=a*u,g=o*h,b=o*u;t[0]=l*h,t[4]=-l*u,t[8]=c,t[1]=f+g*c,t[5]=d-b*c,t[9]=-o*l,t[2]=b-d*c,t[6]=g+f*c,t[10]=a*l}else if(e.order==="YXZ"){let d=l*h,f=l*u,g=c*h,b=c*u;t[0]=d+b*o,t[4]=g*o-f,t[8]=a*c,t[1]=a*u,t[5]=a*h,t[9]=-o,t[2]=f*o-g,t[6]=b+d*o,t[10]=a*l}else if(e.order==="ZXY"){let d=l*h,f=l*u,g=c*h,b=c*u;t[0]=d-b*o,t[4]=-a*u,t[8]=g+f*o,t[1]=f+g*o,t[5]=a*h,t[9]=b-d*o,t[2]=-a*c,t[6]=o,t[10]=a*l}else if(e.order==="ZYX"){let d=a*h,f=a*u,g=o*h,b=o*u;t[0]=l*h,t[4]=g*c-f,t[8]=d*c+b,t[1]=l*u,t[5]=b*c+d,t[9]=f*c-g,t[2]=-c,t[6]=o*l,t[10]=a*l}else if(e.order==="YZX"){let d=a*l,f=a*c,g=o*l,b=o*c;t[0]=l*h,t[4]=b-d*u,t[8]=g*u+f,t[1]=u,t[5]=a*h,t[9]=-o*h,t[2]=-c*h,t[6]=f*u+g,t[10]=d-b*u}else if(e.order==="XZY"){let d=a*l,f=a*c,g=o*l,b=o*c;t[0]=l*h,t[4]=-u,t[8]=c*h,t[1]=d*u+b,t[5]=a*h,t[9]=f*u-g,t[2]=g*u-f,t[6]=o*h,t[10]=b*u+d}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(nv,e,iv)}lookAt(e,t,n){let s=this.elements;return En.subVectors(e,t),En.lengthSq()===0&&(En.z=1),En.normalize(),$i.crossVectors(n,En),$i.lengthSq()===0&&(Math.abs(n.z)===1?En.x+=1e-4:En.z+=1e-4,En.normalize(),$i.crossVectors(n,En)),$i.normalize(),oo.crossVectors(En,$i),s[0]=$i.x,s[4]=oo.x,s[8]=En.x,s[1]=$i.y,s[5]=oo.y,s[9]=En.y,s[2]=$i.z,s[6]=oo.z,s[10]=En.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,s=t.elements,r=this.elements,a=n[0],o=n[4],l=n[8],c=n[12],h=n[1],u=n[5],d=n[9],f=n[13],g=n[2],b=n[6],p=n[10],m=n[14],x=n[3],v=n[7],y=n[11],w=n[15],_=s[0],M=s[4],T=s[8],L=s[12],S=s[1],E=s[5],D=s[9],O=s[13],F=s[2],W=s[6],B=s[10],ee=s[14],q=s[3],le=s[7],X=s[11],te=s[15];return r[0]=a*_+o*S+l*F+c*q,r[4]=a*M+o*E+l*W+c*le,r[8]=a*T+o*D+l*B+c*X,r[12]=a*L+o*O+l*ee+c*te,r[1]=h*_+u*S+d*F+f*q,r[5]=h*M+u*E+d*W+f*le,r[9]=h*T+u*D+d*B+f*X,r[13]=h*L+u*O+d*ee+f*te,r[2]=g*_+b*S+p*F+m*q,r[6]=g*M+b*E+p*W+m*le,r[10]=g*T+b*D+p*B+m*X,r[14]=g*L+b*O+p*ee+m*te,r[3]=x*_+v*S+y*F+w*q,r[7]=x*M+v*E+y*W+w*le,r[11]=x*T+v*D+y*B+w*X,r[15]=x*L+v*O+y*ee+w*te,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[4],s=e[8],r=e[12],a=e[1],o=e[5],l=e[9],c=e[13],h=e[2],u=e[6],d=e[10],f=e[14],g=e[3],b=e[7],p=e[11],m=e[15];return g*(+r*l*u-s*c*u-r*o*d+n*c*d+s*o*f-n*l*f)+b*(+t*l*f-t*c*d+r*a*d-s*a*f+s*c*h-r*l*h)+p*(+t*c*u-t*o*f-r*a*u+n*a*f+r*o*h-n*c*h)+m*(-s*o*h-t*l*u+t*o*d+s*a*u-n*a*d+n*l*h)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){let s=this.elements;return e.isVector3?(s[12]=e.x,s[13]=e.y,s[14]=e.z):(s[12]=e,s[13]=t,s[14]=n),this}invert(){let e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],a=e[4],o=e[5],l=e[6],c=e[7],h=e[8],u=e[9],d=e[10],f=e[11],g=e[12],b=e[13],p=e[14],m=e[15],x=u*p*c-b*d*c+b*l*f-o*p*f-u*l*m+o*d*m,v=g*d*c-h*p*c-g*l*f+a*p*f+h*l*m-a*d*m,y=h*b*c-g*u*c+g*o*f-a*b*f-h*o*m+a*u*m,w=g*u*l-h*b*l-g*o*d+a*b*d+h*o*p-a*u*p,_=t*x+n*v+s*y+r*w;if(_===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let M=1/_;return e[0]=x*M,e[1]=(b*d*r-u*p*r-b*s*f+n*p*f+u*s*m-n*d*m)*M,e[2]=(o*p*r-b*l*r+b*s*c-n*p*c-o*s*m+n*l*m)*M,e[3]=(u*l*r-o*d*r-u*s*c+n*d*c+o*s*f-n*l*f)*M,e[4]=v*M,e[5]=(h*p*r-g*d*r+g*s*f-t*p*f-h*s*m+t*d*m)*M,e[6]=(g*l*r-a*p*r-g*s*c+t*p*c+a*s*m-t*l*m)*M,e[7]=(a*d*r-h*l*r+h*s*c-t*d*c-a*s*f+t*l*f)*M,e[8]=y*M,e[9]=(g*u*r-h*b*r-g*n*f+t*b*f+h*n*m-t*u*m)*M,e[10]=(a*b*r-g*o*r+g*n*c-t*b*c-a*n*m+t*o*m)*M,e[11]=(h*o*r-a*u*r-h*n*c+t*u*c+a*n*f-t*o*f)*M,e[12]=w*M,e[13]=(h*b*s-g*u*s+g*n*d-t*b*d-h*n*p+t*u*p)*M,e[14]=(g*o*s-a*b*s-g*n*l+t*b*l+a*n*p-t*o*p)*M,e[15]=(a*u*s-h*o*s+h*n*l-t*u*l-a*n*d+t*o*d)*M,this}scale(e){let t=this.elements,n=e.x,s=e.y,r=e.z;return t[0]*=n,t[4]*=s,t[8]*=r,t[1]*=n,t[5]*=s,t[9]*=r,t[2]*=n,t[6]*=s,t[10]*=r,t[3]*=n,t[7]*=s,t[11]*=r,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],s=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,s))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let n=Math.cos(t),s=Math.sin(t),r=1-n,a=e.x,o=e.y,l=e.z,c=r*a,h=r*o;return this.set(c*a+n,c*o-s*l,c*l+s*o,0,c*o+s*l,h*o+n,h*l-s*a,0,c*l-s*o,h*l+s*a,r*l*l+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,s,r,a){return this.set(1,n,r,0,e,1,a,0,t,s,1,0,0,0,0,1),this}compose(e,t,n){let s=this.elements,r=t._x,a=t._y,o=t._z,l=t._w,c=r+r,h=a+a,u=o+o,d=r*c,f=r*h,g=r*u,b=a*h,p=a*u,m=o*u,x=l*c,v=l*h,y=l*u,w=n.x,_=n.y,M=n.z;return s[0]=(1-(b+m))*w,s[1]=(f+y)*w,s[2]=(g-v)*w,s[3]=0,s[4]=(f-y)*_,s[5]=(1-(d+m))*_,s[6]=(p+x)*_,s[7]=0,s[8]=(g+v)*M,s[9]=(p-x)*M,s[10]=(1-(d+b))*M,s[11]=0,s[12]=e.x,s[13]=e.y,s[14]=e.z,s[15]=1,this}decompose(e,t,n){let s=this.elements,r=nr.set(s[0],s[1],s[2]).length(),a=nr.set(s[4],s[5],s[6]).length(),o=nr.set(s[8],s[9],s[10]).length();this.determinant()<0&&(r=-r),e.x=s[12],e.y=s[13],e.z=s[14],zn.copy(this);let c=1/r,h=1/a,u=1/o;return zn.elements[0]*=c,zn.elements[1]*=c,zn.elements[2]*=c,zn.elements[4]*=h,zn.elements[5]*=h,zn.elements[6]*=h,zn.elements[8]*=u,zn.elements[9]*=u,zn.elements[10]*=u,t.setFromRotationMatrix(zn),n.x=r,n.y=a,n.z=o,this}makePerspective(e,t,n,s,r,a,o=Mi){let l=this.elements,c=2*r/(t-e),h=2*r/(n-s),u=(t+e)/(t-e),d=(n+s)/(n-s),f,g;if(o===Mi)f=-(a+r)/(a-r),g=-2*a*r/(a-r);else if(o===Wo)f=-a/(a-r),g=-a*r/(a-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return l[0]=c,l[4]=0,l[8]=u,l[12]=0,l[1]=0,l[5]=h,l[9]=d,l[13]=0,l[2]=0,l[6]=0,l[10]=f,l[14]=g,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(e,t,n,s,r,a,o=Mi){let l=this.elements,c=1/(t-e),h=1/(n-s),u=1/(a-r),d=(t+e)*c,f=(n+s)*h,g,b;if(o===Mi)g=(a+r)*u,b=-2*u;else if(o===Wo)g=r*u,b=-1*u;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return l[0]=2*c,l[4]=0,l[8]=0,l[12]=-d,l[1]=0,l[5]=2*h,l[9]=0,l[13]=-f,l[2]=0,l[6]=0,l[10]=b,l[14]=-g,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(e){let t=this.elements,n=e.elements;for(let s=0;s<16;s++)if(t[s]!==n[s])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}},nr=new N,zn=new Ge,nv=new N(0,0,0),iv=new N(1,1,1),$i=new N,oo=new N,En=new N,vf=new Ge,yf=new Ht,Ut=class i{constructor(e=0,t=0,n=0,s=i.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=n,this._order=s}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,s=this._order){return this._x=e,this._y=t,this._z=n,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){let s=e.elements,r=s[0],a=s[4],o=s[8],l=s[1],c=s[5],h=s[9],u=s[2],d=s[6],f=s[10];switch(t){case"XYZ":this._y=Math.asin(nn(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-h,f),this._z=Math.atan2(-a,r)):(this._x=Math.atan2(d,c),this._z=0);break;case"YXZ":this._x=Math.asin(-nn(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(o,f),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-u,r),this._z=0);break;case"ZXY":this._x=Math.asin(nn(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-u,f),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(l,r));break;case"ZYX":this._y=Math.asin(-nn(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(d,f),this._z=Math.atan2(l,r)):(this._x=0,this._z=Math.atan2(-a,c));break;case"YZX":this._z=Math.asin(nn(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-h,c),this._y=Math.atan2(-u,r)):(this._x=0,this._y=Math.atan2(o,f));break;case"XZY":this._z=Math.asin(-nn(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(d,c),this._y=Math.atan2(o,r)):(this._x=Math.atan2(-h,f),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return vf.makeRotationFromQuaternion(e),this.setFromRotationMatrix(vf,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return yf.setFromEuler(this),this.setFromQuaternion(yf,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};Ut.DEFAULT_ORDER="XYZ";var Yo=class{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}},sv=0,bf=new N,ir=new Ht,vi=new Ge,lo=new N,ia=new N,rv=new N,av=new Ht,xf=new N(1,0,0),Sf=new N(0,1,0),Mf=new N(0,0,1),_f={type:"added"},ov={type:"removed"},sr={type:"childadded",child:null},Gc={type:"childremoved",child:null},gt=class i extends Qi{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:sv++}),this.uuid=ri(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=i.DEFAULT_UP.clone();let e=new N,t=new Ut,n=new Ht,s=new N(1,1,1);function r(){n.setFromEuler(t,!1)}function a(){t.setFromQuaternion(n,void 0,!1)}t._onChange(r),n._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new Ge},normalMatrix:{value:new je}}),this.matrix=new Ge,this.matrixWorld=new Ge,this.matrixAutoUpdate=i.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=i.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Yo,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return ir.setFromAxisAngle(e,t),this.quaternion.multiply(ir),this}rotateOnWorldAxis(e,t){return ir.setFromAxisAngle(e,t),this.quaternion.premultiply(ir),this}rotateX(e){return this.rotateOnAxis(xf,e)}rotateY(e){return this.rotateOnAxis(Sf,e)}rotateZ(e){return this.rotateOnAxis(Mf,e)}translateOnAxis(e,t){return bf.copy(e).applyQuaternion(this.quaternion),this.position.add(bf.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(xf,e)}translateY(e){return this.translateOnAxis(Sf,e)}translateZ(e){return this.translateOnAxis(Mf,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(vi.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?lo.copy(e):lo.set(e,t,n);let s=this.parent;this.updateWorldMatrix(!0,!1),ia.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?vi.lookAt(ia,lo,this.up):vi.lookAt(lo,ia,this.up),this.quaternion.setFromRotationMatrix(vi),s&&(vi.extractRotation(s.matrixWorld),ir.setFromRotationMatrix(vi),this.quaternion.premultiply(ir.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(_f),sr.child=e,this.dispatchEvent(sr),sr.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(ov),Gc.child=e,this.dispatchEvent(Gc),Gc.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),vi.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),vi.multiply(e.parent.matrixWorld)),e.applyMatrix4(vi),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(_f),sr.child=e,this.dispatchEvent(sr),sr.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,s=this.children.length;n<s;n++){let a=this.children[n].getObjectByProperty(e,t);if(a!==void 0)return a}}getObjectsByProperty(e,t,n=[]){this[e]===t&&n.push(this);let s=this.children;for(let r=0,a=s.length;r<a;r++)s[r].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(ia,e,rv),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(ia,av,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);let t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].updateMatrixWorld(e)}updateWorldMatrix(e,t){let n=this.parent;if(e===!0&&n!==null&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),t===!0){let s=this.children;for(let r=0,a=s.length;r<a;r++)s[r].updateWorldMatrix(!1,!0)}}toJSON(e){let t=e===void 0||typeof e=="string",n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});let s={};s.uuid=this.uuid,s.type=this.type,this.name!==""&&(s.name=this.name),this.castShadow===!0&&(s.castShadow=!0),this.receiveShadow===!0&&(s.receiveShadow=!0),this.visible===!1&&(s.visible=!1),this.frustumCulled===!1&&(s.frustumCulled=!1),this.renderOrder!==0&&(s.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(s.matrixAutoUpdate=!1),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.visibility=this._visibility,s.active=this._active,s.bounds=this._bounds.map(o=>({boxInitialized:o.boxInitialized,boxMin:o.box.min.toArray(),boxMax:o.box.max.toArray(),sphereInitialized:o.sphereInitialized,sphereRadius:o.sphere.radius,sphereCenter:o.sphere.center.toArray()})),s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.geometryCount=this._geometryCount,s.matricesTexture=this._matricesTexture.toJSON(e),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(s.boundingSphere={center:s.boundingSphere.center.toArray(),radius:s.boundingSphere.radius}),this.boundingBox!==null&&(s.boundingBox={min:s.boundingBox.min.toArray(),max:s.boundingBox.max.toArray()}));function r(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(e)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(e.geometries,this.geometry);let o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){let l=o.shapes;if(Array.isArray(l))for(let c=0,h=l.length;c<h;c++){let u=l[c];r(e.shapes,u)}else r(e.shapes,l)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(e.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let o=[];for(let l=0,c=this.material.length;l<c;l++)o.push(r(e.materials,this.material[l]));s.material=o}else s.material=r(e.materials,this.material);if(this.children.length>0){s.children=[];for(let o=0;o<this.children.length;o++)s.children.push(this.children[o].toJSON(e).object)}if(this.animations.length>0){s.animations=[];for(let o=0;o<this.animations.length;o++){let l=this.animations[o];s.animations.push(r(e.animations,l))}}if(t){let o=a(e.geometries),l=a(e.materials),c=a(e.textures),h=a(e.images),u=a(e.shapes),d=a(e.skeletons),f=a(e.animations),g=a(e.nodes);o.length>0&&(n.geometries=o),l.length>0&&(n.materials=l),c.length>0&&(n.textures=c),h.length>0&&(n.images=h),u.length>0&&(n.shapes=u),d.length>0&&(n.skeletons=d),f.length>0&&(n.animations=f),g.length>0&&(n.nodes=g)}return n.object=s,n;function a(o){let l=[];for(let c in o){let h=o[c];delete h.metadata,l.push(h)}return l}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let n=0;n<e.children.length;n++){let s=e.children[n];this.add(s.clone())}return this}};gt.DEFAULT_UP=new N(0,1,0);gt.DEFAULT_MATRIX_AUTO_UPDATE=!0;gt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var Gn=new N,yi=new N,Vc=new N,bi=new N,rr=new N,ar=new N,wf=new N,Wc=new N,qc=new N,$c=new N,Xc=new yt,Yc=new yt,Kc=new yt,Zi=class i{constructor(e=new N,t=new N,n=new N){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,s){s.subVectors(n,t),Gn.subVectors(e,t),s.cross(Gn);let r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(e,t,n,s,r){Gn.subVectors(s,t),yi.subVectors(n,t),Vc.subVectors(e,t);let a=Gn.dot(Gn),o=Gn.dot(yi),l=Gn.dot(Vc),c=yi.dot(yi),h=yi.dot(Vc),u=a*c-o*o;if(u===0)return r.set(0,0,0),null;let d=1/u,f=(c*l-o*h)*d,g=(a*h-o*l)*d;return r.set(1-f-g,g,f)}static containsPoint(e,t,n,s){return this.getBarycoord(e,t,n,s,bi)===null?!1:bi.x>=0&&bi.y>=0&&bi.x+bi.y<=1}static getInterpolation(e,t,n,s,r,a,o,l){return this.getBarycoord(e,t,n,s,bi)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(r,bi.x),l.addScaledVector(a,bi.y),l.addScaledVector(o,bi.z),l)}static getInterpolatedAttribute(e,t,n,s,r,a){return Xc.setScalar(0),Yc.setScalar(0),Kc.setScalar(0),Xc.fromBufferAttribute(e,t),Yc.fromBufferAttribute(e,n),Kc.fromBufferAttribute(e,s),a.setScalar(0),a.addScaledVector(Xc,r.x),a.addScaledVector(Yc,r.y),a.addScaledVector(Kc,r.z),a}static isFrontFacing(e,t,n,s){return Gn.subVectors(n,t),yi.subVectors(e,t),Gn.cross(yi).dot(s)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,s){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[s]),this}setFromAttributeAndIndices(e,t,n,s){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,s),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return Gn.subVectors(this.c,this.b),yi.subVectors(this.a,this.b),Gn.cross(yi).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return i.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return i.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,n,s,r){return i.getInterpolation(e,this.a,this.b,this.c,t,n,s,r)}containsPoint(e){return i.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return i.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let n=this.a,s=this.b,r=this.c,a,o;rr.subVectors(s,n),ar.subVectors(r,n),Wc.subVectors(e,n);let l=rr.dot(Wc),c=ar.dot(Wc);if(l<=0&&c<=0)return t.copy(n);qc.subVectors(e,s);let h=rr.dot(qc),u=ar.dot(qc);if(h>=0&&u<=h)return t.copy(s);let d=l*u-h*c;if(d<=0&&l>=0&&h<=0)return a=l/(l-h),t.copy(n).addScaledVector(rr,a);$c.subVectors(e,r);let f=rr.dot($c),g=ar.dot($c);if(g>=0&&f<=g)return t.copy(r);let b=f*c-l*g;if(b<=0&&c>=0&&g<=0)return o=c/(c-g),t.copy(n).addScaledVector(ar,o);let p=h*g-f*u;if(p<=0&&u-h>=0&&f-g>=0)return wf.subVectors(r,s),o=(u-h)/(u-h+(f-g)),t.copy(s).addScaledVector(wf,o);let m=1/(p+b+d);return a=b*m,o=d*m,t.copy(n).addScaledVector(rr,a).addScaledVector(ar,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},Hp={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Xi={h:0,s:0,l:0},co={h:0,s:0,l:0};function Zc(i,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?i+(e-i)*6*t:t<1/2?e:t<2/3?i+(e-i)*6*(2/3-t):i}var de=class{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){let s=e;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=Gt){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,bt.toWorkingColorSpace(this,t),this}setRGB(e,t,n,s=bt.workingColorSpace){return this.r=e,this.g=t,this.b=n,bt.toWorkingColorSpace(this,s),this}setHSL(e,t,n,s=bt.workingColorSpace){if(e=Xg(e,1),t=nn(t,0,1),n=nn(n,0,1),t===0)this.r=this.g=this.b=n;else{let r=n<=.5?n*(1+t):n+t-n*t,a=2*n-r;this.r=Zc(a,r,e+1/3),this.g=Zc(a,r,e),this.b=Zc(a,r,e-1/3)}return bt.toWorkingColorSpace(this,s),this}setStyle(e,t=Gt){function n(r){r!==void 0&&parseFloat(r)<1&&console.warn("THREE.Color: Alpha component of "+e+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(e)){let r,a=s[1],o=s[2];switch(a){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,t);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,t);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,t);break;default:console.warn("THREE.Color: Unknown color model "+e)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(e)){let r=s[1],a=r.length;if(a===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,t);if(a===6)return this.setHex(parseInt(r,16),t);console.warn("THREE.Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=Gt){let n=Hp[e.toLowerCase()];return n!==void 0?this.setHex(n,t):console.warn("THREE.Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=xr(e.r),this.g=xr(e.g),this.b=xr(e.b),this}copyLinearToSRGB(e){return this.r=Dc(e.r),this.g=Dc(e.g),this.b=Dc(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=Gt){return bt.fromWorkingColorSpace(ln.copy(this),e),Math.round(nn(ln.r*255,0,255))*65536+Math.round(nn(ln.g*255,0,255))*256+Math.round(nn(ln.b*255,0,255))}getHexString(e=Gt){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=bt.workingColorSpace){bt.fromWorkingColorSpace(ln.copy(this),t);let n=ln.r,s=ln.g,r=ln.b,a=Math.max(n,s,r),o=Math.min(n,s,r),l,c,h=(o+a)/2;if(o===a)l=0,c=0;else{let u=a-o;switch(c=h<=.5?u/(a+o):u/(2-a-o),a){case n:l=(s-r)/u+(s<r?6:0);break;case s:l=(r-n)/u+2;break;case r:l=(n-s)/u+4;break}l/=6}return e.h=l,e.s=c,e.l=h,e}getRGB(e,t=bt.workingColorSpace){return bt.fromWorkingColorSpace(ln.copy(this),t),e.r=ln.r,e.g=ln.g,e.b=ln.b,e}getStyle(e=Gt){bt.fromWorkingColorSpace(ln.copy(this),e);let t=ln.r,n=ln.g,s=ln.b;return e!==Gt?`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(n*255)},${Math.round(s*255)})`}offsetHSL(e,t,n){return this.getHSL(Xi),this.setHSL(Xi.h+e,Xi.s+t,Xi.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(Xi),e.getHSL(co);let n=Lc(Xi.h,co.h,t),s=Lc(Xi.s,co.s,t),r=Lc(Xi.l,co.l,t);return this.setHSL(n,s,r),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,n=this.g,s=this.b,r=e.elements;return this.r=r[0]*t+r[3]*n+r[6]*s,this.g=r[1]*t+r[4]*n+r[7]*s,this.b=r[2]*t+r[5]*n+r[8]*s,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},ln=new de;de.NAMES=Hp;var lv=0,wi=class extends Qi{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:lv++}),this.uuid=ri(),this.name="",this.type="Material",this.blending=yr,this.side=ji,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=ph,this.blendDst=mh,this.blendEquation=_s,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new de(0,0,0),this.blendAlpha=0,this.depthFunc=Mr,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=uf,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Js,this.stencilZFail=Js,this.stencilZPass=Js,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let n=e[t];if(n===void 0){console.warn(`THREE.Material: parameter '${t}' has value of undefined.`);continue}let s=this[t];if(s===void 0){console.warn(`THREE.Material: '${t}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(n):s&&s.isVector3&&n&&n.isVector3?s.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});let n={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==yr&&(n.blending=this.blending),this.side!==ji&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==ph&&(n.blendSrc=this.blendSrc),this.blendDst!==mh&&(n.blendDst=this.blendDst),this.blendEquation!==_s&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==Mr&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==uf&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==Js&&(n.stencilFail=this.stencilFail),this.stencilZFail!==Js&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==Js&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function s(r){let a=[];for(let o in r){let l=r[o];delete l.metadata,a.push(l)}return a}if(t){let r=s(e.textures),a=s(e.images);r.length>0&&(n.textures=r),a.length>0&&(n.images=a)}return n}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,n=null;if(t!==null){let s=t.length;n=new Array(s);for(let r=0;r!==s;++r)n[r]=t[r].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}onBuild(){console.warn("Material: onBuild() has been removed.")}},kt=class extends wi{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new de(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Ut,this.combine=Sp,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}};var Xt=new N,ho=new ue,Xe=class{constructor(e,t,n=!1){if(Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=n,this.usage=va,this.updateRanges=[],this.gpuType=Vn,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[e+s]=t.array[n+s];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)ho.fromBufferAttribute(this,t),ho.applyMatrix3(e),this.setXY(t,ho.x,ho.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)Xt.fromBufferAttribute(this,t),Xt.applyMatrix3(e),this.setXYZ(t,Xt.x,Xt.y,Xt.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)Xt.fromBufferAttribute(this,t),Xt.applyMatrix4(e),this.setXYZ(t,Xt.x,Xt.y,Xt.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)Xt.fromBufferAttribute(this,t),Xt.applyNormalMatrix(e),this.setXYZ(t,Xt.x,Xt.y,Xt.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)Xt.fromBufferAttribute(this,t),Xt.transformDirection(e),this.setXYZ(t,Xt.x,Xt.y,Xt.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];return this.normalized&&(n=ii(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=Et(n,this.array)),this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=ii(t,this.array)),t}setX(e,t){return this.normalized&&(t=Et(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=ii(t,this.array)),t}setY(e,t){return this.normalized&&(t=Et(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=ii(t,this.array)),t}setZ(e,t){return this.normalized&&(t=Et(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=ii(t,this.array)),t}setW(e,t){return this.normalized&&(t=Et(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=Et(t,this.array),n=Et(n,this.array)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,s){return e*=this.itemSize,this.normalized&&(t=Et(t,this.array),n=Et(n,this.array),s=Et(s,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=s,this}setXYZW(e,t,n,s,r){return e*=this.itemSize,this.normalized&&(t=Et(t,this.array),n=Et(n,this.array),s=Et(s,this.array),r=Et(r,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=s,this.array[e+3]=r,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==va&&(e.usage=this.usage),e}};var Ar=class extends Xe{constructor(e,t,n){super(new Uint16Array(e),t,n)}};var Ko=class extends Xe{constructor(e,t,n){super(new Uint32Array(e),t,n)}};var He=class extends Xe{constructor(e,t,n){super(new Float32Array(e),t,n)}},cv=0,Dn=new Ge,Jc=new gt,or=new N,Tn=new oi,sa=new oi,Qt=new N,Qe=class i extends Qi{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:cv++}),this.uuid=ri(),this.name="",this.type="BufferGeometry",this.index=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(Dp(e)?Ko:Ar)(e,1):this.index=e,this}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let r=new je().getNormalMatrix(e);n.applyNormalMatrix(r),n.needsUpdate=!0}let s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(e),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return Dn.makeRotationFromQuaternion(e),this.applyMatrix4(Dn),this}rotateX(e){return Dn.makeRotationX(e),this.applyMatrix4(Dn),this}rotateY(e){return Dn.makeRotationY(e),this.applyMatrix4(Dn),this}rotateZ(e){return Dn.makeRotationZ(e),this.applyMatrix4(Dn),this}translate(e,t,n){return Dn.makeTranslation(e,t,n),this.applyMatrix4(Dn),this}scale(e,t,n){return Dn.makeScale(e,t,n),this.applyMatrix4(Dn),this}lookAt(e){return Jc.lookAt(e),Jc.updateMatrix(),this.applyMatrix4(Jc.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(or).negate(),this.translate(or.x,or.y,or.z),this}setFromPoints(e){let t=[];for(let n=0,s=e.length;n<s;n++){let r=e[n];t.push(r.x,r.y,r.z||0)}return this.setAttribute("position",new He(t,3)),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new oi);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new N(-1/0,-1/0,-1/0),new N(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let n=0,s=t.length;n<s;n++){let r=t[n];Tn.setFromBufferAttribute(r),this.morphTargetsRelative?(Qt.addVectors(this.boundingBox.min,Tn.min),this.boundingBox.expandByPoint(Qt),Qt.addVectors(this.boundingBox.max,Tn.max),this.boundingBox.expandByPoint(Qt)):(this.boundingBox.expandByPoint(Tn.min),this.boundingBox.expandByPoint(Tn.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new li);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new N,1/0);return}if(e){let n=this.boundingSphere.center;if(Tn.setFromBufferAttribute(e),t)for(let r=0,a=t.length;r<a;r++){let o=t[r];sa.setFromBufferAttribute(o),this.morphTargetsRelative?(Qt.addVectors(Tn.min,sa.min),Tn.expandByPoint(Qt),Qt.addVectors(Tn.max,sa.max),Tn.expandByPoint(Qt)):(Tn.expandByPoint(sa.min),Tn.expandByPoint(sa.max))}Tn.getCenter(n);let s=0;for(let r=0,a=e.count;r<a;r++)Qt.fromBufferAttribute(e,r),s=Math.max(s,n.distanceToSquared(Qt));if(t)for(let r=0,a=t.length;r<a;r++){let o=t[r],l=this.morphTargetsRelative;for(let c=0,h=o.count;c<h;c++)Qt.fromBufferAttribute(o,c),l&&(or.fromBufferAttribute(e,c),Qt.add(or)),s=Math.max(s,n.distanceToSquared(Qt))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let n=t.position,s=t.normal,r=t.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new Xe(new Float32Array(4*n.count),4));let a=this.getAttribute("tangent"),o=[],l=[];for(let T=0;T<n.count;T++)o[T]=new N,l[T]=new N;let c=new N,h=new N,u=new N,d=new ue,f=new ue,g=new ue,b=new N,p=new N;function m(T,L,S){c.fromBufferAttribute(n,T),h.fromBufferAttribute(n,L),u.fromBufferAttribute(n,S),d.fromBufferAttribute(r,T),f.fromBufferAttribute(r,L),g.fromBufferAttribute(r,S),h.sub(c),u.sub(c),f.sub(d),g.sub(d);let E=1/(f.x*g.y-g.x*f.y);isFinite(E)&&(b.copy(h).multiplyScalar(g.y).addScaledVector(u,-f.y).multiplyScalar(E),p.copy(u).multiplyScalar(f.x).addScaledVector(h,-g.x).multiplyScalar(E),o[T].add(b),o[L].add(b),o[S].add(b),l[T].add(p),l[L].add(p),l[S].add(p))}let x=this.groups;x.length===0&&(x=[{start:0,count:e.count}]);for(let T=0,L=x.length;T<L;++T){let S=x[T],E=S.start,D=S.count;for(let O=E,F=E+D;O<F;O+=3)m(e.getX(O+0),e.getX(O+1),e.getX(O+2))}let v=new N,y=new N,w=new N,_=new N;function M(T){w.fromBufferAttribute(s,T),_.copy(w);let L=o[T];v.copy(L),v.sub(w.multiplyScalar(w.dot(L))).normalize(),y.crossVectors(_,L);let E=y.dot(l[T])<0?-1:1;a.setXYZW(T,v.x,v.y,v.z,E)}for(let T=0,L=x.length;T<L;++T){let S=x[T],E=S.start,D=S.count;for(let O=E,F=E+D;O<F;O+=3)M(e.getX(O+0)),M(e.getX(O+1)),M(e.getX(O+2))}}computeVertexNormals(){let e=this.index,t=this.getAttribute("position");if(t!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new Xe(new Float32Array(t.count*3),3),this.setAttribute("normal",n);else for(let d=0,f=n.count;d<f;d++)n.setXYZ(d,0,0,0);let s=new N,r=new N,a=new N,o=new N,l=new N,c=new N,h=new N,u=new N;if(e)for(let d=0,f=e.count;d<f;d+=3){let g=e.getX(d+0),b=e.getX(d+1),p=e.getX(d+2);s.fromBufferAttribute(t,g),r.fromBufferAttribute(t,b),a.fromBufferAttribute(t,p),h.subVectors(a,r),u.subVectors(s,r),h.cross(u),o.fromBufferAttribute(n,g),l.fromBufferAttribute(n,b),c.fromBufferAttribute(n,p),o.add(h),l.add(h),c.add(h),n.setXYZ(g,o.x,o.y,o.z),n.setXYZ(b,l.x,l.y,l.z),n.setXYZ(p,c.x,c.y,c.z)}else for(let d=0,f=t.count;d<f;d+=3)s.fromBufferAttribute(t,d+0),r.fromBufferAttribute(t,d+1),a.fromBufferAttribute(t,d+2),h.subVectors(a,r),u.subVectors(s,r),h.cross(u),n.setXYZ(d+0,h.x,h.y,h.z),n.setXYZ(d+1,h.x,h.y,h.z),n.setXYZ(d+2,h.x,h.y,h.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)Qt.fromBufferAttribute(e,t),Qt.normalize(),e.setXYZ(t,Qt.x,Qt.y,Qt.z)}toNonIndexed(){function e(o,l){let c=o.array,h=o.itemSize,u=o.normalized,d=new c.constructor(l.length*h),f=0,g=0;for(let b=0,p=l.length;b<p;b++){o.isInterleavedBufferAttribute?f=l[b]*o.data.stride+o.offset:f=l[b]*h;for(let m=0;m<h;m++)d[g++]=c[f++]}return new Xe(d,h,u)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let t=new i,n=this.index.array,s=this.attributes;for(let o in s){let l=s[o],c=e(l,n);t.setAttribute(o,c)}let r=this.morphAttributes;for(let o in r){let l=[],c=r[o];for(let h=0,u=c.length;h<u;h++){let d=c[h],f=e(d,n);l.push(f)}t.morphAttributes[o]=l}t.morphTargetsRelative=this.morphTargetsRelative;let a=this.groups;for(let o=0,l=a.length;o<l;o++){let c=a[o];t.addGroup(c.start,c.count,c.materialIndex)}return t}toJSON(){let e={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){let l=this.parameters;for(let c in l)l[c]!==void 0&&(e[c]=l[c]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let n=this.attributes;for(let l in n){let c=n[l];e.data.attributes[l]=c.toJSON(e.data)}let s={},r=!1;for(let l in this.morphAttributes){let c=this.morphAttributes[l],h=[];for(let u=0,d=c.length;u<d;u++){let f=c[u];h.push(f.toJSON(e.data))}h.length>0&&(s[l]=h,r=!0)}r&&(e.data.morphAttributes=s,e.data.morphTargetsRelative=this.morphTargetsRelative);let a=this.groups;a.length>0&&(e.data.groups=JSON.parse(JSON.stringify(a)));let o=this.boundingSphere;return o!==null&&(e.data.boundingSphere={center:o.center.toArray(),radius:o.radius}),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let n=e.index;n!==null&&this.setIndex(n.clone(t));let s=e.attributes;for(let c in s){let h=s[c];this.setAttribute(c,h.clone(t))}let r=e.morphAttributes;for(let c in r){let h=[],u=r[c];for(let d=0,f=u.length;d<f;d++)h.push(u[d].clone(t));this.morphAttributes[c]=h}this.morphTargetsRelative=e.morphTargetsRelative;let a=e.groups;for(let c=0,h=a.length;c<h;c++){let u=a[c];this.addGroup(u.start,u.count,u.materialIndex)}let o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());let l=e.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}},Ef=new Ge,ys=new ya,uo=new li,Tf=new N,fo=new N,po=new N,mo=new N,jc=new N,go=new N,Af=new N,vo=new N,he=class extends gt{constructor(e=new Qe,t=new kt){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){let s=t[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){let o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}getVertexPosition(e,t){let n=this.geometry,s=n.attributes.position,r=n.morphAttributes.position,a=n.morphTargetsRelative;t.fromBufferAttribute(s,e);let o=this.morphTargetInfluences;if(r&&o){go.set(0,0,0);for(let l=0,c=r.length;l<c;l++){let h=o[l],u=r[l];h!==0&&(jc.fromBufferAttribute(u,e),a?go.addScaledVector(jc,h):go.addScaledVector(jc.sub(t),h))}t.add(go)}return t}raycast(e,t){let n=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),uo.copy(n.boundingSphere),uo.applyMatrix4(r),ys.copy(e.ray).recast(e.near),!(uo.containsPoint(ys.origin)===!1&&(ys.intersectSphere(uo,Tf)===null||ys.origin.distanceToSquared(Tf)>(e.far-e.near)**2))&&(Ef.copy(r).invert(),ys.copy(e.ray).applyMatrix4(Ef),!(n.boundingBox!==null&&ys.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(e,t,ys)))}_computeIntersections(e,t,n){let s,r=this.geometry,a=this.material,o=r.index,l=r.attributes.position,c=r.attributes.uv,h=r.attributes.uv1,u=r.attributes.normal,d=r.groups,f=r.drawRange;if(o!==null)if(Array.isArray(a))for(let g=0,b=d.length;g<b;g++){let p=d[g],m=a[p.materialIndex],x=Math.max(p.start,f.start),v=Math.min(o.count,Math.min(p.start+p.count,f.start+f.count));for(let y=x,w=v;y<w;y+=3){let _=o.getX(y),M=o.getX(y+1),T=o.getX(y+2);s=yo(this,m,e,n,c,h,u,_,M,T),s&&(s.faceIndex=Math.floor(y/3),s.face.materialIndex=p.materialIndex,t.push(s))}}else{let g=Math.max(0,f.start),b=Math.min(o.count,f.start+f.count);for(let p=g,m=b;p<m;p+=3){let x=o.getX(p),v=o.getX(p+1),y=o.getX(p+2);s=yo(this,a,e,n,c,h,u,x,v,y),s&&(s.faceIndex=Math.floor(p/3),t.push(s))}}else if(l!==void 0)if(Array.isArray(a))for(let g=0,b=d.length;g<b;g++){let p=d[g],m=a[p.materialIndex],x=Math.max(p.start,f.start),v=Math.min(l.count,Math.min(p.start+p.count,f.start+f.count));for(let y=x,w=v;y<w;y+=3){let _=y,M=y+1,T=y+2;s=yo(this,m,e,n,c,h,u,_,M,T),s&&(s.faceIndex=Math.floor(y/3),s.face.materialIndex=p.materialIndex,t.push(s))}}else{let g=Math.max(0,f.start),b=Math.min(l.count,f.start+f.count);for(let p=g,m=b;p<m;p+=3){let x=p,v=p+1,y=p+2;s=yo(this,a,e,n,c,h,u,x,v,y),s&&(s.faceIndex=Math.floor(p/3),t.push(s))}}}};function hv(i,e,t,n,s,r,a,o){let l;if(e.side===hn?l=n.intersectTriangle(a,r,s,!0,o):l=n.intersectTriangle(s,r,a,e.side===ji,o),l===null)return null;vo.copy(o),vo.applyMatrix4(i.matrixWorld);let c=t.ray.origin.distanceTo(vo);return c<t.near||c>t.far?null:{distance:c,point:vo.clone(),object:i}}function yo(i,e,t,n,s,r,a,o,l,c){i.getVertexPosition(o,fo),i.getVertexPosition(l,po),i.getVertexPosition(c,mo);let h=hv(i,e,t,n,fo,po,mo,Af);if(h){let u=new N;Zi.getBarycoord(Af,fo,po,mo,u),s&&(h.uv=Zi.getInterpolatedAttribute(s,o,l,c,u,new ue)),r&&(h.uv1=Zi.getInterpolatedAttribute(r,o,l,c,u,new ue)),a&&(h.normal=Zi.getInterpolatedAttribute(a,o,l,c,u,new N),h.normal.dot(n.direction)>0&&h.normal.multiplyScalar(-1));let d={a:o,b:l,c,normal:new N,materialIndex:0};Zi.getNormal(fo,po,mo,d.normal),h.face=d,h.barycoord=u}return h}var Ue=class i extends Qe{constructor(e=1,t=1,n=1,s=1,r=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:n,widthSegments:s,heightSegments:r,depthSegments:a};let o=this;s=Math.floor(s),r=Math.floor(r),a=Math.floor(a);let l=[],c=[],h=[],u=[],d=0,f=0;g("z","y","x",-1,-1,n,t,e,a,r,0),g("z","y","x",1,-1,n,t,-e,a,r,1),g("x","z","y",1,1,e,n,t,s,a,2),g("x","z","y",1,-1,e,n,-t,s,a,3),g("x","y","z",1,-1,e,t,n,s,r,4),g("x","y","z",-1,-1,e,t,-n,s,r,5),this.setIndex(l),this.setAttribute("position",new He(c,3)),this.setAttribute("normal",new He(h,3)),this.setAttribute("uv",new He(u,2));function g(b,p,m,x,v,y,w,_,M,T,L){let S=y/M,E=w/T,D=y/2,O=w/2,F=_/2,W=M+1,B=T+1,ee=0,q=0,le=new N;for(let X=0;X<B;X++){let te=X*E-O;for(let Pe=0;Pe<W;Pe++){let $e=Pe*S-D;le[b]=$e*x,le[p]=te*v,le[m]=F,c.push(le.x,le.y,le.z),le[b]=0,le[p]=0,le[m]=_>0?1:-1,h.push(le.x,le.y,le.z),u.push(Pe/M),u.push(1-X/T),ee+=1}}for(let X=0;X<T;X++)for(let te=0;te<M;te++){let Pe=d+te+W*X,$e=d+te+W*(X+1),$=d+(te+1)+W*(X+1),se=d+(te+1)+W*X;l.push(Pe,$e,se),l.push($e,$,se),q+=6}o.addGroup(f,q,L),f+=q,d+=ee}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}};function Cr(i){let e={};for(let t in i){e[t]={};for(let n in i[t]){let s=i[t][n];s&&(s.isColor||s.isMatrix3||s.isMatrix4||s.isVector2||s.isVector3||s.isVector4||s.isTexture||s.isQuaternion)?s.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][n]=null):e[t][n]=s.clone():Array.isArray(s)?e[t][n]=s.slice():e[t][n]=s}}return e}function mn(i){let e={};for(let t=0;t<i.length;t++){let n=Cr(i[t]);for(let s in n)e[s]=n[s]}return e}function uv(i){let e=[];for(let t=0;t<i.length;t++)e.push(i[t].clone());return e}function Np(i){let e=i.getRenderTarget();return e===null?i.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:bt.workingColorSpace}var Dr={clone:Cr,merge:mn},dv=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,fv=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,At=class extends wi{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=dv,this.fragmentShader=fv,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=Cr(e.uniforms),this.uniformsGroups=uv(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let s in this.uniforms){let a=this.uniforms[s].value;a&&a.isTexture?t.uniforms[s]={type:"t",value:a.toJSON(e).uuid}:a&&a.isColor?t.uniforms[s]={type:"c",value:a.getHex()}:a&&a.isVector2?t.uniforms[s]={type:"v2",value:a.toArray()}:a&&a.isVector3?t.uniforms[s]={type:"v3",value:a.toArray()}:a&&a.isVector4?t.uniforms[s]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?t.uniforms[s]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?t.uniforms[s]={type:"m4",value:a.toArray()}:t.uniforms[s]={value:a}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let n={};for(let s in this.extensions)this.extensions[s]===!0&&(n[s]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}},Zo=class extends gt{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new Ge,this.projectionMatrix=new Ge,this.projectionMatrixInverse=new Ge,this.coordinateSystem=Mi}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}},Yi=new N,Cf=new ue,Rf=new ue,cn=class extends Zo{constructor(e=50,t=1,n=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=n,this.far=s,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=Qh*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(Ic*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return Qh*2*Math.atan(Math.tan(Ic*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,n){Yi.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(Yi.x,Yi.y).multiplyScalar(-e/Yi.z),Yi.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(Yi.x,Yi.y).multiplyScalar(-e/Yi.z)}getViewSize(e,t){return this.getViewBounds(e,Cf,Rf),t.subVectors(Rf,Cf)}setViewOffset(e,t,n,s,r,a){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(Ic*.5*this.fov)/this.zoom,n=2*t,s=this.aspect*n,r=-.5*s,a=this.view;if(this.view!==null&&this.view.enabled){let l=a.fullWidth,c=a.fullHeight;r+=a.offsetX*s/l,t-=a.offsetY*n/c,s*=a.width/l,n*=a.height/c}let o=this.filmOffset;o!==0&&(r+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,t,t-n,e,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}},lr=-90,cr=1,iu=class extends gt{constructor(e,t,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let s=new cn(lr,cr,e,t);s.layers=this.layers,this.add(s);let r=new cn(lr,cr,e,t);r.layers=this.layers,this.add(r);let a=new cn(lr,cr,e,t);a.layers=this.layers,this.add(a);let o=new cn(lr,cr,e,t);o.layers=this.layers,this.add(o);let l=new cn(lr,cr,e,t);l.layers=this.layers,this.add(l);let c=new cn(lr,cr,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[n,s,r,a,o,l]=t;for(let c of t)this.remove(c);if(e===Mi)n.up.set(0,1,0),n.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(e===Wo)n.up.set(0,-1,0),n.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(let c of t)this.add(c),c.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:s}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[r,a,o,l,c,h]=this.children,u=e.getRenderTarget(),d=e.getActiveCubeFace(),f=e.getActiveMipmapLevel(),g=e.xr.enabled;e.xr.enabled=!1;let b=n.texture.generateMipmaps;n.texture.generateMipmaps=!1,e.setRenderTarget(n,0,s),e.render(t,r),e.setRenderTarget(n,1,s),e.render(t,a),e.setRenderTarget(n,2,s),e.render(t,o),e.setRenderTarget(n,3,s),e.render(t,l),e.setRenderTarget(n,4,s),e.render(t,c),n.texture.generateMipmaps=b,e.setRenderTarget(n,5,s),e.render(t,h),e.setRenderTarget(u,d,f),e.xr.enabled=g,n.texture.needsPMREMUpdate=!0}},Jo=class extends Sn{constructor(e,t,n,s,r,a,o,l,c,h){e=e!==void 0?e:[],t=t!==void 0?t:_r,super(e,t,n,s,r,a,o,l,c,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}},su=class extends gn{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let n={width:e,height:e,depth:1},s=[n,n,n,n,n,n];this.texture=new Jo(s,t.mapping,t.wrapS,t.wrapT,t.magFilter,t.minFilter,t.format,t.type,t.anisotropy,t.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=t.generateMipmaps!==void 0?t.generateMipmaps:!1,this.texture.minFilter=t.minFilter!==void 0?t.minFilter:An}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},s=new Ue(5,5,5),r=new At({name:"CubemapFromEquirect",uniforms:Cr(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:hn,blending:si});r.uniforms.tEquirect.value=t;let a=new he(s,r),o=t.minFilter;return t.minFilter===Ts&&(t.minFilter=An),new iu(1,10,this).update(e,a),t.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(e,t,n,s){let r=e.getRenderTarget();for(let a=0;a<6;a++)e.setRenderTarget(this,a),e.clear(t,n,s);e.setRenderTarget(r)}},Qc=new N,pv=new N,mv=new je,Si=class{constructor(e=new N(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,s){return this.normal.set(e,t,n),this.constant=s,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){let s=Qc.subVectors(n,t).cross(pv.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(s,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t){let n=e.delta(Qc),s=this.normal.dot(n);if(s===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let r=-(e.start.dot(this.normal)+this.constant)/s;return r<0||r>1?null:t.copy(e.start).addScaledVector(n,r)}intersectsLine(e){let t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let n=t||mv.getNormalMatrix(e),s=this.coplanarPoint(Qc).applyMatrix4(e),r=this.normal.applyMatrix3(n).normalize();return this.constant=-s.dot(r),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}},bs=new li,bo=new N,ba=class{constructor(e=new Si,t=new Si,n=new Si,s=new Si,r=new Si,a=new Si){this.planes=[e,t,n,s,r,a]}set(e,t,n,s,r,a){let o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(n),o[3].copy(s),o[4].copy(r),o[5].copy(a),this}copy(e){let t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=Mi){let n=this.planes,s=e.elements,r=s[0],a=s[1],o=s[2],l=s[3],c=s[4],h=s[5],u=s[6],d=s[7],f=s[8],g=s[9],b=s[10],p=s[11],m=s[12],x=s[13],v=s[14],y=s[15];if(n[0].setComponents(l-r,d-c,p-f,y-m).normalize(),n[1].setComponents(l+r,d+c,p+f,y+m).normalize(),n[2].setComponents(l+a,d+h,p+g,y+x).normalize(),n[3].setComponents(l-a,d-h,p-g,y-x).normalize(),n[4].setComponents(l-o,d-u,p-b,y-v).normalize(),t===Mi)n[5].setComponents(l+o,d+u,p+b,y+v).normalize();else if(t===Wo)n[5].setComponents(o,u,b,v).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),bs.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),bs.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(bs)}intersectsSprite(e){return bs.center.set(0,0,0),bs.radius=.7071067811865476,bs.applyMatrix4(e.matrixWorld),this.intersectsSphere(bs)}intersectsSphere(e){let t=this.planes,n=e.center,s=-e.radius;for(let r=0;r<6;r++)if(t[r].distanceToPoint(n)<s)return!1;return!0}intersectsBox(e){let t=this.planes;for(let n=0;n<6;n++){let s=t[n];if(bo.x=s.normal.x>0?e.max.x:e.min.x,bo.y=s.normal.y>0?e.max.y:e.min.y,bo.z=s.normal.z>0?e.max.z:e.min.z,s.distanceToPoint(bo)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};function Op(){let i=null,e=!1,t=null,n=null;function s(r,a){t(r,a),n=i.requestAnimationFrame(s)}return{start:function(){e!==!0&&t!==null&&(n=i.requestAnimationFrame(s),e=!0)},stop:function(){i.cancelAnimationFrame(n),e=!1},setAnimationLoop:function(r){t=r},setContext:function(r){i=r}}}function gv(i){let e=new WeakMap;function t(o,l){let c=o.array,h=o.usage,u=c.byteLength,d=i.createBuffer();i.bindBuffer(l,d),i.bufferData(l,c,h),o.onUploadCallback();let f;if(c instanceof Float32Array)f=i.FLOAT;else if(c instanceof Uint16Array)o.isFloat16BufferAttribute?f=i.HALF_FLOAT:f=i.UNSIGNED_SHORT;else if(c instanceof Int16Array)f=i.SHORT;else if(c instanceof Uint32Array)f=i.UNSIGNED_INT;else if(c instanceof Int32Array)f=i.INT;else if(c instanceof Int8Array)f=i.BYTE;else if(c instanceof Uint8Array)f=i.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)f=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:d,type:f,bytesPerElement:c.BYTES_PER_ELEMENT,version:o.version,size:u}}function n(o,l,c){let h=l.array,u=l.updateRanges;if(i.bindBuffer(c,o),u.length===0)i.bufferSubData(c,0,h);else{u.sort((f,g)=>f.start-g.start);let d=0;for(let f=1;f<u.length;f++){let g=u[d],b=u[f];b.start<=g.start+g.count+1?g.count=Math.max(g.count,b.start+b.count-g.start):(++d,u[d]=b)}u.length=d+1;for(let f=0,g=u.length;f<g;f++){let b=u[f];i.bufferSubData(c,b.start*h.BYTES_PER_ELEMENT,h,b.start,b.count)}l.clearUpdateRanges()}l.onUploadCallback()}function s(o){return o.isInterleavedBufferAttribute&&(o=o.data),e.get(o)}function r(o){o.isInterleavedBufferAttribute&&(o=o.data);let l=e.get(o);l&&(i.deleteBuffer(l.buffer),e.delete(o))}function a(o,l){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){let h=e.get(o);(!h||h.version<o.version)&&e.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}let c=e.get(o);if(c===void 0)e.set(o,t(o,l));else if(c.version<o.version){if(c.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(c.buffer,o,l),c.version=o.version}}return{get:s,remove:r,update:a}}var Wn=class i extends Qe{constructor(e=1,t=1,n=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:n,heightSegments:s};let r=e/2,a=t/2,o=Math.floor(n),l=Math.floor(s),c=o+1,h=l+1,u=e/o,d=t/l,f=[],g=[],b=[],p=[];for(let m=0;m<h;m++){let x=m*d-a;for(let v=0;v<c;v++){let y=v*u-r;g.push(y,-x,0),b.push(0,0,1),p.push(v/o),p.push(1-m/l)}}for(let m=0;m<l;m++)for(let x=0;x<o;x++){let v=x+c*m,y=x+c*(m+1),w=x+1+c*(m+1),_=x+1+c*m;f.push(v,y,_),f.push(y,w,_)}this.setIndex(f),this.setAttribute("position",new He(g,3)),this.setAttribute("normal",new He(b,3)),this.setAttribute("uv",new He(p,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.width,e.height,e.widthSegments,e.heightSegments)}},vv=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,yv=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,bv=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,xv=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Sv=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,Mv=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,_v=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,wv=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,Ev=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec3 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 ).rgb;
	}
#endif`,Tv=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,Av=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,Cv=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Rv=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,Pv=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,Iv=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,Lv=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,kv=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,Dv=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Hv=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,Nv=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,Ov=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,Uv=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,Fv=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif
#ifdef USE_BATCHING_COLOR
	vec3 batchingColor = getBatchingColor( getIndirectIndex( gl_DrawID ) );
	vColor.xyz *= batchingColor.xyz;
#endif`,Bv=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,zv=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,Gv=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,Vv=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Wv=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,qv=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,$v=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Xv="gl_FragColor = linearToOutputTexel( gl_FragColor );",Yv=`
const mat3 LINEAR_SRGB_TO_LINEAR_DISPLAY_P3 = mat3(
	vec3( 0.8224621, 0.177538, 0.0 ),
	vec3( 0.0331941, 0.9668058, 0.0 ),
	vec3( 0.0170827, 0.0723974, 0.9105199 )
);
const mat3 LINEAR_DISPLAY_P3_TO_LINEAR_SRGB = mat3(
	vec3( 1.2249401, - 0.2249404, 0.0 ),
	vec3( - 0.0420569, 1.0420571, 0.0 ),
	vec3( - 0.0196376, - 0.0786361, 1.0982735 )
);
vec4 LinearSRGBToLinearDisplayP3( in vec4 value ) {
	return vec4( value.rgb * LINEAR_SRGB_TO_LINEAR_DISPLAY_P3, value.a );
}
vec4 LinearDisplayP3ToLinearSRGB( in vec4 value ) {
	return vec4( value.rgb * LINEAR_DISPLAY_P3_TO_LINEAR_SRGB, value.a );
}
vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,Kv=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,Zv=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,Jv=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,jv=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Qv=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,ey=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,ty=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,ny=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,iy=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,sy=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,ry=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,ay=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,oy=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,ly=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,cy=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,hy=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,uy=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,dy=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,fy=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,py=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,my=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,gy=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,vy=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,yy=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,by=`#if defined( USE_LOGDEPTHBUF )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,xy=`#if defined( USE_LOGDEPTHBUF )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Sy=`#ifdef USE_LOGDEPTHBUF
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,My=`#ifdef USE_LOGDEPTHBUF
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,_y=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = vec4( mix( pow( sampledDiffuseColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), sampledDiffuseColor.rgb * 0.0773993808, vec3( lessThanEqual( sampledDiffuseColor.rgb, vec3( 0.04045 ) ) ) ), sampledDiffuseColor.w );
	
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,wy=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,Ey=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,Ty=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Ay=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Cy=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Ry=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,Py=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Iy=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Ly=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,ky=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Dy=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,Hy=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,Ny=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Oy=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Uy=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,Fy=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,By=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,zy=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,Gy=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,Vy=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,Wy=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,qy=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,$y=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Xy=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Yy=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,Ky=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Zy=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Jy=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,jy=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow (sampler2D shadow, vec2 uv, float compare ){
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		float hard_shadow = step( compare , distribution.x );
		if (hard_shadow != 1.0 ) {
			float distance = compare - distribution.x ;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		
		float lightToPositionLength = length( lightToPosition );
		if ( lightToPositionLength - shadowCameraFar <= 0.0 && lightToPositionLength - shadowCameraNear >= 0.0 ) {
			float dp = ( lightToPositionLength - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
			#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
				vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
				shadow = (
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
				) * ( 1.0 / 9.0 );
			#else
				shadow = texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
			#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
#endif`,Qy=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,eb=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,tb=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,nb=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,ib=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,sb=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,rb=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,ab=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,ob=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,lb=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,cb=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,hb=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,ub=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
		
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
		
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		
		#else
		
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,db=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,fb=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,pb=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,mb=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,gb=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,vb=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,yb=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,bb=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,xb=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Sb=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Mb=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,_b=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,wb=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,Eb=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,Tb=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,Ab=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Cb=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Rb=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Pb=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,Ib=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Lb=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,kb=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Db=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,Hb=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Nb=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,Ob=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,Ub=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Fb=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Bb=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,zb=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Gb=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Vb=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Wb=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,qb=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,$b=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Xb=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Yb=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Kb=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Je={alphahash_fragment:vv,alphahash_pars_fragment:yv,alphamap_fragment:bv,alphamap_pars_fragment:xv,alphatest_fragment:Sv,alphatest_pars_fragment:Mv,aomap_fragment:_v,aomap_pars_fragment:wv,batching_pars_vertex:Ev,batching_vertex:Tv,begin_vertex:Av,beginnormal_vertex:Cv,bsdfs:Rv,iridescence_fragment:Pv,bumpmap_pars_fragment:Iv,clipping_planes_fragment:Lv,clipping_planes_pars_fragment:kv,clipping_planes_pars_vertex:Dv,clipping_planes_vertex:Hv,color_fragment:Nv,color_pars_fragment:Ov,color_pars_vertex:Uv,color_vertex:Fv,common:Bv,cube_uv_reflection_fragment:zv,defaultnormal_vertex:Gv,displacementmap_pars_vertex:Vv,displacementmap_vertex:Wv,emissivemap_fragment:qv,emissivemap_pars_fragment:$v,colorspace_fragment:Xv,colorspace_pars_fragment:Yv,envmap_fragment:Kv,envmap_common_pars_fragment:Zv,envmap_pars_fragment:Jv,envmap_pars_vertex:jv,envmap_physical_pars_fragment:cy,envmap_vertex:Qv,fog_vertex:ey,fog_pars_vertex:ty,fog_fragment:ny,fog_pars_fragment:iy,gradientmap_pars_fragment:sy,lightmap_pars_fragment:ry,lights_lambert_fragment:ay,lights_lambert_pars_fragment:oy,lights_pars_begin:ly,lights_toon_fragment:hy,lights_toon_pars_fragment:uy,lights_phong_fragment:dy,lights_phong_pars_fragment:fy,lights_physical_fragment:py,lights_physical_pars_fragment:my,lights_fragment_begin:gy,lights_fragment_maps:vy,lights_fragment_end:yy,logdepthbuf_fragment:by,logdepthbuf_pars_fragment:xy,logdepthbuf_pars_vertex:Sy,logdepthbuf_vertex:My,map_fragment:_y,map_pars_fragment:wy,map_particle_fragment:Ey,map_particle_pars_fragment:Ty,metalnessmap_fragment:Ay,metalnessmap_pars_fragment:Cy,morphinstance_vertex:Ry,morphcolor_vertex:Py,morphnormal_vertex:Iy,morphtarget_pars_vertex:Ly,morphtarget_vertex:ky,normal_fragment_begin:Dy,normal_fragment_maps:Hy,normal_pars_fragment:Ny,normal_pars_vertex:Oy,normal_vertex:Uy,normalmap_pars_fragment:Fy,clearcoat_normal_fragment_begin:By,clearcoat_normal_fragment_maps:zy,clearcoat_pars_fragment:Gy,iridescence_pars_fragment:Vy,opaque_fragment:Wy,packing:qy,premultiplied_alpha_fragment:$y,project_vertex:Xy,dithering_fragment:Yy,dithering_pars_fragment:Ky,roughnessmap_fragment:Zy,roughnessmap_pars_fragment:Jy,shadowmap_pars_fragment:jy,shadowmap_pars_vertex:Qy,shadowmap_vertex:eb,shadowmask_pars_fragment:tb,skinbase_vertex:nb,skinning_pars_vertex:ib,skinning_vertex:sb,skinnormal_vertex:rb,specularmap_fragment:ab,specularmap_pars_fragment:ob,tonemapping_fragment:lb,tonemapping_pars_fragment:cb,transmission_fragment:hb,transmission_pars_fragment:ub,uv_pars_fragment:db,uv_pars_vertex:fb,uv_vertex:pb,worldpos_vertex:mb,background_vert:gb,background_frag:vb,backgroundCube_vert:yb,backgroundCube_frag:bb,cube_vert:xb,cube_frag:Sb,depth_vert:Mb,depth_frag:_b,distanceRGBA_vert:wb,distanceRGBA_frag:Eb,equirect_vert:Tb,equirect_frag:Ab,linedashed_vert:Cb,linedashed_frag:Rb,meshbasic_vert:Pb,meshbasic_frag:Ib,meshlambert_vert:Lb,meshlambert_frag:kb,meshmatcap_vert:Db,meshmatcap_frag:Hb,meshnormal_vert:Nb,meshnormal_frag:Ob,meshphong_vert:Ub,meshphong_frag:Fb,meshphysical_vert:Bb,meshphysical_frag:zb,meshtoon_vert:Gb,meshtoon_frag:Vb,points_vert:Wb,points_frag:qb,shadow_vert:$b,shadow_frag:Xb,sprite_vert:Yb,sprite_frag:Kb},be={common:{diffuse:{value:new de(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new je},alphaMap:{value:null},alphaMapTransform:{value:new je},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new je}},envmap:{envMap:{value:null},envMapRotation:{value:new je},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new je}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new je}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new je},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new je},normalScale:{value:new ue(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new je},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new je}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new je}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new je}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new de(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new de(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new je},alphaTest:{value:0},uvTransform:{value:new je}},sprite:{diffuse:{value:new de(16777215)},opacity:{value:1},center:{value:new ue(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new je},alphaMap:{value:null},alphaMapTransform:{value:new je},alphaTest:{value:0}}},ni={basic:{uniforms:mn([be.common,be.specularmap,be.envmap,be.aomap,be.lightmap,be.fog]),vertexShader:Je.meshbasic_vert,fragmentShader:Je.meshbasic_frag},lambert:{uniforms:mn([be.common,be.specularmap,be.envmap,be.aomap,be.lightmap,be.emissivemap,be.bumpmap,be.normalmap,be.displacementmap,be.fog,be.lights,{emissive:{value:new de(0)}}]),vertexShader:Je.meshlambert_vert,fragmentShader:Je.meshlambert_frag},phong:{uniforms:mn([be.common,be.specularmap,be.envmap,be.aomap,be.lightmap,be.emissivemap,be.bumpmap,be.normalmap,be.displacementmap,be.fog,be.lights,{emissive:{value:new de(0)},specular:{value:new de(1118481)},shininess:{value:30}}]),vertexShader:Je.meshphong_vert,fragmentShader:Je.meshphong_frag},standard:{uniforms:mn([be.common,be.envmap,be.aomap,be.lightmap,be.emissivemap,be.bumpmap,be.normalmap,be.displacementmap,be.roughnessmap,be.metalnessmap,be.fog,be.lights,{emissive:{value:new de(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Je.meshphysical_vert,fragmentShader:Je.meshphysical_frag},toon:{uniforms:mn([be.common,be.aomap,be.lightmap,be.emissivemap,be.bumpmap,be.normalmap,be.displacementmap,be.gradientmap,be.fog,be.lights,{emissive:{value:new de(0)}}]),vertexShader:Je.meshtoon_vert,fragmentShader:Je.meshtoon_frag},matcap:{uniforms:mn([be.common,be.bumpmap,be.normalmap,be.displacementmap,be.fog,{matcap:{value:null}}]),vertexShader:Je.meshmatcap_vert,fragmentShader:Je.meshmatcap_frag},points:{uniforms:mn([be.points,be.fog]),vertexShader:Je.points_vert,fragmentShader:Je.points_frag},dashed:{uniforms:mn([be.common,be.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Je.linedashed_vert,fragmentShader:Je.linedashed_frag},depth:{uniforms:mn([be.common,be.displacementmap]),vertexShader:Je.depth_vert,fragmentShader:Je.depth_frag},normal:{uniforms:mn([be.common,be.bumpmap,be.normalmap,be.displacementmap,{opacity:{value:1}}]),vertexShader:Je.meshnormal_vert,fragmentShader:Je.meshnormal_frag},sprite:{uniforms:mn([be.sprite,be.fog]),vertexShader:Je.sprite_vert,fragmentShader:Je.sprite_frag},background:{uniforms:{uvTransform:{value:new je},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Je.background_vert,fragmentShader:Je.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new je}},vertexShader:Je.backgroundCube_vert,fragmentShader:Je.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Je.cube_vert,fragmentShader:Je.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Je.equirect_vert,fragmentShader:Je.equirect_frag},distanceRGBA:{uniforms:mn([be.common,be.displacementmap,{referencePosition:{value:new N},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Je.distanceRGBA_vert,fragmentShader:Je.distanceRGBA_frag},shadow:{uniforms:mn([be.lights,be.fog,{color:{value:new de(0)},opacity:{value:1}}]),vertexShader:Je.shadow_vert,fragmentShader:Je.shadow_frag}};ni.physical={uniforms:mn([ni.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new je},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new je},clearcoatNormalScale:{value:new ue(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new je},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new je},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new je},sheen:{value:0},sheenColor:{value:new de(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new je},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new je},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new je},transmissionSamplerSize:{value:new ue},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new je},attenuationDistance:{value:0},attenuationColor:{value:new de(0)},specularColor:{value:new de(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new je},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new je},anisotropyVector:{value:new ue},anisotropyMap:{value:null},anisotropyMapTransform:{value:new je}}]),vertexShader:Je.meshphysical_vert,fragmentShader:Je.meshphysical_frag};var xo={r:0,b:0,g:0},xs=new Ut,Zb=new Ge;function Jb(i,e,t,n,s,r,a){let o=new de(0),l=r===!0?0:1,c,h,u=null,d=0,f=null;function g(x){let v=x.isScene===!0?x.background:null;return v&&v.isTexture&&(v=(x.backgroundBlurriness>0?t:e).get(v)),v}function b(x){let v=!1,y=g(x);y===null?m(o,l):y&&y.isColor&&(m(y,1),v=!0);let w=i.xr.getEnvironmentBlendMode();w==="additive"?n.buffers.color.setClear(0,0,0,1,a):w==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,a),(i.autoClear||v)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil))}function p(x,v){let y=g(v);y&&(y.isCubeTexture||y.mapping===xl)?(h===void 0&&(h=new he(new Ue(1,1,1),new At({name:"BackgroundCubeMaterial",uniforms:Cr(ni.backgroundCube.uniforms),vertexShader:ni.backgroundCube.vertexShader,fragmentShader:ni.backgroundCube.fragmentShader,side:hn,depthTest:!1,depthWrite:!1,fog:!1})),h.geometry.deleteAttribute("normal"),h.geometry.deleteAttribute("uv"),h.onBeforeRender=function(w,_,M){this.matrixWorld.copyPosition(M.matrixWorld)},Object.defineProperty(h.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),s.update(h)),xs.copy(v.backgroundRotation),xs.x*=-1,xs.y*=-1,xs.z*=-1,y.isCubeTexture&&y.isRenderTargetTexture===!1&&(xs.y*=-1,xs.z*=-1),h.material.uniforms.envMap.value=y,h.material.uniforms.flipEnvMap.value=y.isCubeTexture&&y.isRenderTargetTexture===!1?-1:1,h.material.uniforms.backgroundBlurriness.value=v.backgroundBlurriness,h.material.uniforms.backgroundIntensity.value=v.backgroundIntensity,h.material.uniforms.backgroundRotation.value.setFromMatrix4(Zb.makeRotationFromEuler(xs)),h.material.toneMapped=bt.getTransfer(y.colorSpace)!==Pt,(u!==y||d!==y.version||f!==i.toneMapping)&&(h.material.needsUpdate=!0,u=y,d=y.version,f=i.toneMapping),h.layers.enableAll(),x.unshift(h,h.geometry,h.material,0,0,null)):y&&y.isTexture&&(c===void 0&&(c=new he(new Wn(2,2),new At({name:"BackgroundMaterial",uniforms:Cr(ni.background.uniforms),vertexShader:ni.background.vertexShader,fragmentShader:ni.background.fragmentShader,side:ji,depthTest:!1,depthWrite:!1,fog:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),s.update(c)),c.material.uniforms.t2D.value=y,c.material.uniforms.backgroundIntensity.value=v.backgroundIntensity,c.material.toneMapped=bt.getTransfer(y.colorSpace)!==Pt,y.matrixAutoUpdate===!0&&y.updateMatrix(),c.material.uniforms.uvTransform.value.copy(y.matrix),(u!==y||d!==y.version||f!==i.toneMapping)&&(c.material.needsUpdate=!0,u=y,d=y.version,f=i.toneMapping),c.layers.enableAll(),x.unshift(c,c.geometry,c.material,0,0,null))}function m(x,v){x.getRGB(xo,Np(i)),n.buffers.color.setClear(xo.r,xo.g,xo.b,v,a)}return{getClearColor:function(){return o},setClearColor:function(x,v=1){o.set(x),l=v,m(o,l)},getClearAlpha:function(){return l},setClearAlpha:function(x){l=x,m(o,l)},render:b,addToRenderList:p}}function jb(i,e){let t=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},s=d(null),r=s,a=!1;function o(S,E,D,O,F){let W=!1,B=u(O,D,E);r!==B&&(r=B,c(r.object)),W=f(S,O,D,F),W&&g(S,O,D,F),F!==null&&e.update(F,i.ELEMENT_ARRAY_BUFFER),(W||a)&&(a=!1,y(S,E,D,O),F!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,e.get(F).buffer))}function l(){return i.createVertexArray()}function c(S){return i.bindVertexArray(S)}function h(S){return i.deleteVertexArray(S)}function u(S,E,D){let O=D.wireframe===!0,F=n[S.id];F===void 0&&(F={},n[S.id]=F);let W=F[E.id];W===void 0&&(W={},F[E.id]=W);let B=W[O];return B===void 0&&(B=d(l()),W[O]=B),B}function d(S){let E=[],D=[],O=[];for(let F=0;F<t;F++)E[F]=0,D[F]=0,O[F]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:E,enabledAttributes:D,attributeDivisors:O,object:S,attributes:{},index:null}}function f(S,E,D,O){let F=r.attributes,W=E.attributes,B=0,ee=D.getAttributes();for(let q in ee)if(ee[q].location>=0){let X=F[q],te=W[q];if(te===void 0&&(q==="instanceMatrix"&&S.instanceMatrix&&(te=S.instanceMatrix),q==="instanceColor"&&S.instanceColor&&(te=S.instanceColor)),X===void 0||X.attribute!==te||te&&X.data!==te.data)return!0;B++}return r.attributesNum!==B||r.index!==O}function g(S,E,D,O){let F={},W=E.attributes,B=0,ee=D.getAttributes();for(let q in ee)if(ee[q].location>=0){let X=W[q];X===void 0&&(q==="instanceMatrix"&&S.instanceMatrix&&(X=S.instanceMatrix),q==="instanceColor"&&S.instanceColor&&(X=S.instanceColor));let te={};te.attribute=X,X&&X.data&&(te.data=X.data),F[q]=te,B++}r.attributes=F,r.attributesNum=B,r.index=O}function b(){let S=r.newAttributes;for(let E=0,D=S.length;E<D;E++)S[E]=0}function p(S){m(S,0)}function m(S,E){let D=r.newAttributes,O=r.enabledAttributes,F=r.attributeDivisors;D[S]=1,O[S]===0&&(i.enableVertexAttribArray(S),O[S]=1),F[S]!==E&&(i.vertexAttribDivisor(S,E),F[S]=E)}function x(){let S=r.newAttributes,E=r.enabledAttributes;for(let D=0,O=E.length;D<O;D++)E[D]!==S[D]&&(i.disableVertexAttribArray(D),E[D]=0)}function v(S,E,D,O,F,W,B){B===!0?i.vertexAttribIPointer(S,E,D,F,W):i.vertexAttribPointer(S,E,D,O,F,W)}function y(S,E,D,O){b();let F=O.attributes,W=D.getAttributes(),B=E.defaultAttributeValues;for(let ee in W){let q=W[ee];if(q.location>=0){let le=F[ee];if(le===void 0&&(ee==="instanceMatrix"&&S.instanceMatrix&&(le=S.instanceMatrix),ee==="instanceColor"&&S.instanceColor&&(le=S.instanceColor)),le!==void 0){let X=le.normalized,te=le.itemSize,Pe=e.get(le);if(Pe===void 0)continue;let $e=Pe.buffer,$=Pe.type,se=Pe.bytesPerElement,ye=$===i.INT||$===i.UNSIGNED_INT||le.gpuType===Gu;if(le.isInterleavedBufferAttribute){let Se=le.data,De=Se.stride,Ne=le.offset;if(Se.isInstancedInterleavedBuffer){for(let st=0;st<q.locationSize;st++)m(q.location+st,Se.meshPerAttribute);S.isInstancedMesh!==!0&&O._maxInstanceCount===void 0&&(O._maxInstanceCount=Se.meshPerAttribute*Se.count)}else for(let st=0;st<q.locationSize;st++)p(q.location+st);i.bindBuffer(i.ARRAY_BUFFER,$e);for(let st=0;st<q.locationSize;st++)v(q.location+st,te/q.locationSize,$,X,De*se,(Ne+te/q.locationSize*st)*se,ye)}else{if(le.isInstancedBufferAttribute){for(let Se=0;Se<q.locationSize;Se++)m(q.location+Se,le.meshPerAttribute);S.isInstancedMesh!==!0&&O._maxInstanceCount===void 0&&(O._maxInstanceCount=le.meshPerAttribute*le.count)}else for(let Se=0;Se<q.locationSize;Se++)p(q.location+Se);i.bindBuffer(i.ARRAY_BUFFER,$e);for(let Se=0;Se<q.locationSize;Se++)v(q.location+Se,te/q.locationSize,$,X,te*se,te/q.locationSize*Se*se,ye)}}else if(B!==void 0){let X=B[ee];if(X!==void 0)switch(X.length){case 2:i.vertexAttrib2fv(q.location,X);break;case 3:i.vertexAttrib3fv(q.location,X);break;case 4:i.vertexAttrib4fv(q.location,X);break;default:i.vertexAttrib1fv(q.location,X)}}}}x()}function w(){T();for(let S in n){let E=n[S];for(let D in E){let O=E[D];for(let F in O)h(O[F].object),delete O[F];delete E[D]}delete n[S]}}function _(S){if(n[S.id]===void 0)return;let E=n[S.id];for(let D in E){let O=E[D];for(let F in O)h(O[F].object),delete O[F];delete E[D]}delete n[S.id]}function M(S){for(let E in n){let D=n[E];if(D[S.id]===void 0)continue;let O=D[S.id];for(let F in O)h(O[F].object),delete O[F];delete D[S.id]}}function T(){L(),a=!0,r!==s&&(r=s,c(r.object))}function L(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:o,reset:T,resetDefaultState:L,dispose:w,releaseStatesOfGeometry:_,releaseStatesOfProgram:M,initAttributes:b,enableAttribute:p,disableUnusedAttributes:x}}function Qb(i,e,t){let n;function s(c){n=c}function r(c,h){i.drawArrays(n,c,h),t.update(h,n,1)}function a(c,h,u){u!==0&&(i.drawArraysInstanced(n,c,h,u),t.update(h,n,u))}function o(c,h,u){if(u===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,c,0,h,0,u);let f=0;for(let g=0;g<u;g++)f+=h[g];t.update(f,n,1)}function l(c,h,u,d){if(u===0)return;let f=e.get("WEBGL_multi_draw");if(f===null)for(let g=0;g<c.length;g++)a(c[g],h[g],d[g]);else{f.multiDrawArraysInstancedWEBGL(n,c,0,h,0,d,0,u);let g=0;for(let b=0;b<u;b++)g+=h[b];for(let b=0;b<d.length;b++)t.update(g,n,d[b])}}this.setMode=s,this.render=r,this.renderInstances=a,this.renderMultiDraw=o,this.renderMultiDrawInstances=l}function ex(i,e,t,n){let s;function r(){if(s!==void 0)return s;if(e.has("EXT_texture_filter_anisotropic")===!0){let M=e.get("EXT_texture_filter_anisotropic");s=i.getParameter(M.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function a(M){return!(M!==Hn&&n.convert(M)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(M){let T=M===Xn&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(M!==_i&&n.convert(M)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE)&&M!==Vn&&!T)}function l(M){if(M==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";M="mediump"}return M==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=t.precision!==void 0?t.precision:"highp",h=l(c);h!==c&&(console.warn("THREE.WebGLRenderer:",c,"not supported, using",h,"instead."),c=h);let u=t.logarithmicDepthBuffer===!0,d=t.reverseDepthBuffer===!0&&e.has("EXT_clip_control");if(d===!0){let M=e.get("EXT_clip_control");M.clipControlEXT(M.LOWER_LEFT_EXT,M.ZERO_TO_ONE_EXT)}let f=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),g=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),b=i.getParameter(i.MAX_TEXTURE_SIZE),p=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),m=i.getParameter(i.MAX_VERTEX_ATTRIBS),x=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),v=i.getParameter(i.MAX_VARYING_VECTORS),y=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),w=g>0,_=i.getParameter(i.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:l,textureFormatReadable:a,textureTypeReadable:o,precision:c,logarithmicDepthBuffer:u,reverseDepthBuffer:d,maxTextures:f,maxVertexTextures:g,maxTextureSize:b,maxCubemapSize:p,maxAttributes:m,maxVertexUniforms:x,maxVaryings:v,maxFragmentUniforms:y,vertexTextures:w,maxSamples:_}}function tx(i){let e=this,t=null,n=0,s=!1,r=!1,a=new Si,o=new je,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(u,d){let f=u.length!==0||d||n!==0||s;return s=d,n=u.length,f},this.beginShadows=function(){r=!0,h(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(u,d){t=h(u,d,0)},this.setState=function(u,d,f){let g=u.clippingPlanes,b=u.clipIntersection,p=u.clipShadows,m=i.get(u);if(!s||g===null||g.length===0||r&&!p)r?h(null):c();else{let x=r?0:n,v=x*4,y=m.clippingState||null;l.value=y,y=h(g,d,v,f);for(let w=0;w!==v;++w)y[w]=t[w];m.clippingState=y,this.numIntersection=b?this.numPlanes:0,this.numPlanes+=x}};function c(){l.value!==t&&(l.value=t,l.needsUpdate=n>0),e.numPlanes=n,e.numIntersection=0}function h(u,d,f,g){let b=u!==null?u.length:0,p=null;if(b!==0){if(p=l.value,g!==!0||p===null){let m=f+b*4,x=d.matrixWorldInverse;o.getNormalMatrix(x),(p===null||p.length<m)&&(p=new Float32Array(m));for(let v=0,y=f;v!==b;++v,y+=4)a.copy(u[v]).applyMatrix4(x,o),a.normal.toArray(p,y),p[y+3]=a.constant}l.value=p,l.needsUpdate=!0}return e.numPlanes=b,e.numIntersection=0,p}}function nx(i){let e=new WeakMap;function t(a,o){return o===_h?a.mapping=_r:o===wh&&(a.mapping=wr),a}function n(a){if(a&&a.isTexture){let o=a.mapping;if(o===_h||o===wh)if(e.has(a)){let l=e.get(a).texture;return t(l,a.mapping)}else{let l=a.image;if(l&&l.height>0){let c=new su(l.height);return c.fromEquirectangularTexture(i,a),e.set(a,c),a.addEventListener("dispose",s),t(c.texture,a.mapping)}else return null}}return a}function s(a){let o=a.target;o.removeEventListener("dispose",s);let l=e.get(o);l!==void 0&&(e.delete(o),l.dispose())}function r(){e=new WeakMap}return{get:n,dispose:r}}var Rr=class extends Zo{constructor(e=-1,t=1,n=1,s=-1,r=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=s,this.near=r,this.far=a,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,s,r,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,s=(this.top+this.bottom)/2,r=n-e,a=n+e,o=s+t,l=s-t;if(this.view!==null&&this.view.enabled){let c=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=c*this.view.offsetX,a=r+c*this.view.width,o-=h*this.view.offsetY,l=o-h*this.view.height}this.projectionMatrix.makeOrthographic(r,a,o,l,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}},gr=4,Pf=[.125,.215,.35,.446,.526,.582],ws=20,eh=new Rr,If=new de,th=null,nh=0,ih=0,sh=!1,Ms=(1+Math.sqrt(5))/2,hr=1/Ms,Lf=[new N(-Ms,hr,0),new N(Ms,hr,0),new N(-hr,0,Ms),new N(hr,0,Ms),new N(0,Ms,-hr),new N(0,Ms,hr),new N(-1,1,-1),new N(1,1,-1),new N(-1,1,1),new N(1,1,1)],jo=class{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(e,t=0,n=.1,s=100){th=this._renderer.getRenderTarget(),nh=this._renderer.getActiveCubeFace(),ih=this._renderer.getActiveMipmapLevel(),sh=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(256);let r=this._allocateTargets();return r.depthBuffer=!0,this._sceneToCubeUV(e,n,s,r),t>0&&this._blur(r,0,0,t),this._applyPMREM(r),this._cleanup(r),r}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Hf(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Df(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodPlanes.length;e++)this._lodPlanes[e].dispose()}_cleanup(e){this._renderer.setRenderTarget(th,nh,ih),this._renderer.xr.enabled=sh,e.scissorTest=!1,So(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===_r||e.mapping===wr?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),th=this._renderer.getRenderTarget(),nh=this._renderer.getActiveCubeFace(),ih=this._renderer.getActiveMipmapLevel(),sh=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let n=t||this._allocateTargets();return this._textureToCubeUV(e,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){let e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,n={magFilter:An,minFilter:An,generateMipmaps:!1,type:Xn,format:Hn,colorSpace:ts,depthBuffer:!1},s=kf(e,t,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=kf(e,t,n);let{_lodMax:r}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=ix(r)),this._blurMaterial=sx(r,e,t)}return s}_compileMaterial(e){let t=new he(this._lodPlanes[0],e);this._renderer.compile(t,eh)}_sceneToCubeUV(e,t,n,s){let o=new cn(90,1,t,n),l=[1,-1,1,1,1,1],c=[1,1,1,-1,-1,-1],h=this._renderer,u=h.autoClear,d=h.toneMapping;h.getClearColor(If),h.toneMapping=Ji,h.autoClear=!1;let f=new kt({name:"PMREM.Background",side:hn,depthWrite:!1,depthTest:!1}),g=new he(new Ue,f),b=!1,p=e.background;p?p.isColor&&(f.color.copy(p),e.background=null,b=!0):(f.color.copy(If),b=!0);for(let m=0;m<6;m++){let x=m%3;x===0?(o.up.set(0,l[m],0),o.lookAt(c[m],0,0)):x===1?(o.up.set(0,0,l[m]),o.lookAt(0,c[m],0)):(o.up.set(0,l[m],0),o.lookAt(0,0,c[m]));let v=this._cubeSize;So(s,x*v,m>2?v:0,v,v),h.setRenderTarget(s),b&&h.render(g,o),h.render(e,o)}g.geometry.dispose(),g.material.dispose(),h.toneMapping=d,h.autoClear=u,e.background=p}_textureToCubeUV(e,t){let n=this._renderer,s=e.mapping===_r||e.mapping===wr;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=Hf()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Df());let r=s?this._cubemapMaterial:this._equirectMaterial,a=new he(this._lodPlanes[0],r),o=r.uniforms;o.envMap.value=e;let l=this._cubeSize;So(t,0,0,3*l,2*l),n.setRenderTarget(t),n.render(a,eh)}_applyPMREM(e){let t=this._renderer,n=t.autoClear;t.autoClear=!1;let s=this._lodPlanes.length;for(let r=1;r<s;r++){let a=Math.sqrt(this._sigmas[r]*this._sigmas[r]-this._sigmas[r-1]*this._sigmas[r-1]),o=Lf[(s-r-1)%Lf.length];this._blur(e,r-1,r,a,o)}t.autoClear=n}_blur(e,t,n,s,r){let a=this._pingPongRenderTarget;this._halfBlur(e,a,t,n,s,"latitudinal",r),this._halfBlur(a,e,n,n,s,"longitudinal",r)}_halfBlur(e,t,n,s,r,a,o){let l=this._renderer,c=this._blurMaterial;a!=="latitudinal"&&a!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");let h=3,u=new he(this._lodPlanes[s],c),d=c.uniforms,f=this._sizeLods[n]-1,g=isFinite(r)?Math.PI/(2*f):2*Math.PI/(2*ws-1),b=r/g,p=isFinite(r)?1+Math.floor(h*b):ws;p>ws&&console.warn(`sigmaRadians, ${r}, is too large and will clip, as it requested ${p} samples when the maximum is set to ${ws}`);let m=[],x=0;for(let M=0;M<ws;++M){let T=M/b,L=Math.exp(-T*T/2);m.push(L),M===0?x+=L:M<p&&(x+=2*L)}for(let M=0;M<m.length;M++)m[M]=m[M]/x;d.envMap.value=e.texture,d.samples.value=p,d.weights.value=m,d.latitudinal.value=a==="latitudinal",o&&(d.poleAxis.value=o);let{_lodMax:v}=this;d.dTheta.value=g,d.mipInt.value=v-n;let y=this._sizeLods[s],w=3*y*(s>v-gr?s-v+gr:0),_=4*(this._cubeSize-y);So(t,w,_,3*y,2*y),l.setRenderTarget(t),l.render(u,eh)}};function ix(i){let e=[],t=[],n=[],s=i,r=i-gr+1+Pf.length;for(let a=0;a<r;a++){let o=Math.pow(2,s);t.push(o);let l=1/o;a>i-gr?l=Pf[a-i+gr-1]:a===0&&(l=0),n.push(l);let c=1/(o-2),h=-c,u=1+c,d=[h,h,u,h,u,u,h,h,u,u,h,u],f=6,g=6,b=3,p=2,m=1,x=new Float32Array(b*g*f),v=new Float32Array(p*g*f),y=new Float32Array(m*g*f);for(let _=0;_<f;_++){let M=_%3*2/3-1,T=_>2?0:-1,L=[M,T,0,M+2/3,T,0,M+2/3,T+1,0,M,T,0,M+2/3,T+1,0,M,T+1,0];x.set(L,b*g*_),v.set(d,p*g*_);let S=[_,_,_,_,_,_];y.set(S,m*g*_)}let w=new Qe;w.setAttribute("position",new Xe(x,b)),w.setAttribute("uv",new Xe(v,p)),w.setAttribute("faceIndex",new Xe(y,m)),e.push(w),s>gr&&s--}return{lodPlanes:e,sizeLods:t,sigmas:n}}function kf(i,e,t){let n=new gn(i,e,t);return n.texture.mapping=xl,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function So(i,e,t,n,s){i.viewport.set(e,t,n,s),i.scissor.set(e,t,n,s)}function sx(i,e,t){let n=new Float32Array(ws),s=new N(0,1,0);return new At({name:"SphericalGaussianBlur",defines:{n:ws,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:s}},vertexShader:Zu(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:si,depthTest:!1,depthWrite:!1})}function Df(){return new At({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Zu(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:si,depthTest:!1,depthWrite:!1})}function Hf(){return new At({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Zu(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:si,depthTest:!1,depthWrite:!1})}function Zu(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function rx(i){let e=new WeakMap,t=null;function n(o){if(o&&o.isTexture){let l=o.mapping,c=l===_h||l===wh,h=l===_r||l===wr;if(c||h){let u=e.get(o),d=u!==void 0?u.texture.pmremVersion:0;if(o.isRenderTargetTexture&&o.pmremVersion!==d)return t===null&&(t=new jo(i)),u=c?t.fromEquirectangular(o,u):t.fromCubemap(o,u),u.texture.pmremVersion=o.pmremVersion,e.set(o,u),u.texture;if(u!==void 0)return u.texture;{let f=o.image;return c&&f&&f.height>0||h&&f&&s(f)?(t===null&&(t=new jo(i)),u=c?t.fromEquirectangular(o):t.fromCubemap(o),u.texture.pmremVersion=o.pmremVersion,e.set(o,u),o.addEventListener("dispose",r),u.texture):null}}}return o}function s(o){let l=0,c=6;for(let h=0;h<c;h++)o[h]!==void 0&&l++;return l===c}function r(o){let l=o.target;l.removeEventListener("dispose",r);let c=e.get(l);c!==void 0&&(e.delete(l),c.dispose())}function a(){e=new WeakMap,t!==null&&(t.dispose(),t=null)}return{get:n,dispose:a}}function ax(i){let e={};function t(n){if(e[n]!==void 0)return e[n];let s;switch(n){case"WEBGL_depth_texture":s=i.getExtension("WEBGL_depth_texture")||i.getExtension("MOZ_WEBGL_depth_texture")||i.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":s=i.getExtension("EXT_texture_filter_anisotropic")||i.getExtension("MOZ_EXT_texture_filter_anisotropic")||i.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":s=i.getExtension("WEBGL_compressed_texture_s3tc")||i.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":s=i.getExtension("WEBGL_compressed_texture_pvrtc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:s=i.getExtension(n)}return e[n]=s,s}return{has:function(n){return t(n)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(n){let s=t(n);return s===null&&Fo("THREE.WebGLRenderer: "+n+" extension not supported."),s}}}function ox(i,e,t,n){let s={},r=new WeakMap;function a(u){let d=u.target;d.index!==null&&e.remove(d.index);for(let g in d.attributes)e.remove(d.attributes[g]);for(let g in d.morphAttributes){let b=d.morphAttributes[g];for(let p=0,m=b.length;p<m;p++)e.remove(b[p])}d.removeEventListener("dispose",a),delete s[d.id];let f=r.get(d);f&&(e.remove(f),r.delete(d)),n.releaseStatesOfGeometry(d),d.isInstancedBufferGeometry===!0&&delete d._maxInstanceCount,t.memory.geometries--}function o(u,d){return s[d.id]===!0||(d.addEventListener("dispose",a),s[d.id]=!0,t.memory.geometries++),d}function l(u){let d=u.attributes;for(let g in d)e.update(d[g],i.ARRAY_BUFFER);let f=u.morphAttributes;for(let g in f){let b=f[g];for(let p=0,m=b.length;p<m;p++)e.update(b[p],i.ARRAY_BUFFER)}}function c(u){let d=[],f=u.index,g=u.attributes.position,b=0;if(f!==null){let x=f.array;b=f.version;for(let v=0,y=x.length;v<y;v+=3){let w=x[v+0],_=x[v+1],M=x[v+2];d.push(w,_,_,M,M,w)}}else if(g!==void 0){let x=g.array;b=g.version;for(let v=0,y=x.length/3-1;v<y;v+=3){let w=v+0,_=v+1,M=v+2;d.push(w,_,_,M,M,w)}}else return;let p=new(Dp(d)?Ko:Ar)(d,1);p.version=b;let m=r.get(u);m&&e.remove(m),r.set(u,p)}function h(u){let d=r.get(u);if(d){let f=u.index;f!==null&&d.version<f.version&&c(u)}else c(u);return r.get(u)}return{get:o,update:l,getWireframeAttribute:h}}function lx(i,e,t){let n;function s(d){n=d}let r,a;function o(d){r=d.type,a=d.bytesPerElement}function l(d,f){i.drawElements(n,f,r,d*a),t.update(f,n,1)}function c(d,f,g){g!==0&&(i.drawElementsInstanced(n,f,r,d*a,g),t.update(f,n,g))}function h(d,f,g){if(g===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,f,0,r,d,0,g);let p=0;for(let m=0;m<g;m++)p+=f[m];t.update(p,n,1)}function u(d,f,g,b){if(g===0)return;let p=e.get("WEBGL_multi_draw");if(p===null)for(let m=0;m<d.length;m++)c(d[m]/a,f[m],b[m]);else{p.multiDrawElementsInstancedWEBGL(n,f,0,r,d,0,b,0,g);let m=0;for(let x=0;x<g;x++)m+=f[x];for(let x=0;x<b.length;x++)t.update(m,n,b[x])}}this.setMode=s,this.setIndex=o,this.render=l,this.renderInstances=c,this.renderMultiDraw=h,this.renderMultiDrawInstances=u}function cx(i){let e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,a,o){switch(t.calls++,a){case i.TRIANGLES:t.triangles+=o*(r/3);break;case i.LINES:t.lines+=o*(r/2);break;case i.LINE_STRIP:t.lines+=o*(r-1);break;case i.LINE_LOOP:t.lines+=o*r;break;case i.POINTS:t.points+=o*r;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",a);break}}function s(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:s,update:n}}function hx(i,e,t){let n=new WeakMap,s=new yt;function r(a,o,l){let c=a.morphTargetInfluences,h=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,u=h!==void 0?h.length:0,d=n.get(o);if(d===void 0||d.count!==u){let L=function(){M.dispose(),n.delete(o),o.removeEventListener("dispose",L)};d!==void 0&&d.texture.dispose();let f=o.morphAttributes.position!==void 0,g=o.morphAttributes.normal!==void 0,b=o.morphAttributes.color!==void 0,p=o.morphAttributes.position||[],m=o.morphAttributes.normal||[],x=o.morphAttributes.color||[],v=0;f===!0&&(v=1),g===!0&&(v=2),b===!0&&(v=3);let y=o.attributes.position.count*v,w=1;y>e.maxTextureSize&&(w=Math.ceil(y/e.maxTextureSize),y=e.maxTextureSize);let _=new Float32Array(y*w*4*u),M=new Xo(_,y,w,u);M.type=Vn,M.needsUpdate=!0;let T=v*4;for(let S=0;S<u;S++){let E=p[S],D=m[S],O=x[S],F=y*w*4*S;for(let W=0;W<E.count;W++){let B=W*T;f===!0&&(s.fromBufferAttribute(E,W),_[F+B+0]=s.x,_[F+B+1]=s.y,_[F+B+2]=s.z,_[F+B+3]=0),g===!0&&(s.fromBufferAttribute(D,W),_[F+B+4]=s.x,_[F+B+5]=s.y,_[F+B+6]=s.z,_[F+B+7]=0),b===!0&&(s.fromBufferAttribute(O,W),_[F+B+8]=s.x,_[F+B+9]=s.y,_[F+B+10]=s.z,_[F+B+11]=O.itemSize===4?s.w:1)}}d={count:u,texture:M,size:new ue(y,w)},n.set(o,d),o.addEventListener("dispose",L)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)l.getUniforms().setValue(i,"morphTexture",a.morphTexture,t);else{let f=0;for(let b=0;b<c.length;b++)f+=c[b];let g=o.morphTargetsRelative?1:1-f;l.getUniforms().setValue(i,"morphTargetBaseInfluence",g),l.getUniforms().setValue(i,"morphTargetInfluences",c)}l.getUniforms().setValue(i,"morphTargetsTexture",d.texture,t),l.getUniforms().setValue(i,"morphTargetsTextureSize",d.size)}return{update:r}}function ux(i,e,t,n){let s=new WeakMap;function r(l){let c=n.render.frame,h=l.geometry,u=e.get(l,h);if(s.get(u)!==c&&(e.update(u),s.set(u,c)),l.isInstancedMesh&&(l.hasEventListener("dispose",o)===!1&&l.addEventListener("dispose",o),s.get(l)!==c&&(t.update(l.instanceMatrix,i.ARRAY_BUFFER),l.instanceColor!==null&&t.update(l.instanceColor,i.ARRAY_BUFFER),s.set(l,c))),l.isSkinnedMesh){let d=l.skeleton;s.get(d)!==c&&(d.update(),s.set(d,c))}return u}function a(){s=new WeakMap}function o(l){let c=l.target;c.removeEventListener("dispose",o),t.remove(c.instanceMatrix),c.instanceColor!==null&&t.remove(c.instanceColor)}return{update:r,dispose:a}}var Qo=class extends Sn{constructor(e,t,n,s,r,a,o,l,c,h=br){if(h!==br&&h!==Tr)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");n===void 0&&h===br&&(n=As),n===void 0&&h===Tr&&(n=Er),super(null,s,r,a,o,l,h,n,c),this.isDepthTexture=!0,this.image={width:e,height:t},this.magFilter=o!==void 0?o:xn,this.minFilter=l!==void 0?l:xn,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}},Up=new Sn,Nf=new Qo(1,1),Fp=new Xo,Bp=new nu,zp=new Jo,Of=[],Uf=[],Ff=new Float32Array(16),Bf=new Float32Array(9),zf=new Float32Array(4);function Hr(i,e,t){let n=i[0];if(n<=0||n>0)return i;let s=e*t,r=Of[s];if(r===void 0&&(r=new Float32Array(s),Of[s]=r),e!==0){n.toArray(r,0);for(let a=1,o=0;a!==e;++a)o+=t,i[a].toArray(r,o)}return r}function Yt(i,e){if(i.length!==e.length)return!1;for(let t=0,n=i.length;t<n;t++)if(i[t]!==e[t])return!1;return!0}function Kt(i,e){for(let t=0,n=e.length;t<n;t++)i[t]=e[t]}function Ml(i,e){let t=Uf[e];t===void 0&&(t=new Int32Array(e),Uf[e]=t);for(let n=0;n!==e;++n)t[n]=i.allocateTextureUnit();return t}function dx(i,e){let t=this.cache;t[0]!==e&&(i.uniform1f(this.addr,e),t[0]=e)}function fx(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Yt(t,e))return;i.uniform2fv(this.addr,e),Kt(t,e)}}function px(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(i.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(Yt(t,e))return;i.uniform3fv(this.addr,e),Kt(t,e)}}function mx(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Yt(t,e))return;i.uniform4fv(this.addr,e),Kt(t,e)}}function gx(i,e){let t=this.cache,n=e.elements;if(n===void 0){if(Yt(t,e))return;i.uniformMatrix2fv(this.addr,!1,e),Kt(t,e)}else{if(Yt(t,n))return;zf.set(n),i.uniformMatrix2fv(this.addr,!1,zf),Kt(t,n)}}function vx(i,e){let t=this.cache,n=e.elements;if(n===void 0){if(Yt(t,e))return;i.uniformMatrix3fv(this.addr,!1,e),Kt(t,e)}else{if(Yt(t,n))return;Bf.set(n),i.uniformMatrix3fv(this.addr,!1,Bf),Kt(t,n)}}function yx(i,e){let t=this.cache,n=e.elements;if(n===void 0){if(Yt(t,e))return;i.uniformMatrix4fv(this.addr,!1,e),Kt(t,e)}else{if(Yt(t,n))return;Ff.set(n),i.uniformMatrix4fv(this.addr,!1,Ff),Kt(t,n)}}function bx(i,e){let t=this.cache;t[0]!==e&&(i.uniform1i(this.addr,e),t[0]=e)}function xx(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Yt(t,e))return;i.uniform2iv(this.addr,e),Kt(t,e)}}function Sx(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Yt(t,e))return;i.uniform3iv(this.addr,e),Kt(t,e)}}function Mx(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Yt(t,e))return;i.uniform4iv(this.addr,e),Kt(t,e)}}function _x(i,e){let t=this.cache;t[0]!==e&&(i.uniform1ui(this.addr,e),t[0]=e)}function wx(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Yt(t,e))return;i.uniform2uiv(this.addr,e),Kt(t,e)}}function Ex(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Yt(t,e))return;i.uniform3uiv(this.addr,e),Kt(t,e)}}function Tx(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Yt(t,e))return;i.uniform4uiv(this.addr,e),Kt(t,e)}}function Ax(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s);let r;this.type===i.SAMPLER_2D_SHADOW?(Nf.compareFunction=kp,r=Nf):r=Up,t.setTexture2D(e||r,s)}function Cx(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTexture3D(e||Bp,s)}function Rx(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTextureCube(e||zp,s)}function Px(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTexture2DArray(e||Fp,s)}function Ix(i){switch(i){case 5126:return dx;case 35664:return fx;case 35665:return px;case 35666:return mx;case 35674:return gx;case 35675:return vx;case 35676:return yx;case 5124:case 35670:return bx;case 35667:case 35671:return xx;case 35668:case 35672:return Sx;case 35669:case 35673:return Mx;case 5125:return _x;case 36294:return wx;case 36295:return Ex;case 36296:return Tx;case 35678:case 36198:case 36298:case 36306:case 35682:return Ax;case 35679:case 36299:case 36307:return Cx;case 35680:case 36300:case 36308:case 36293:return Rx;case 36289:case 36303:case 36311:case 36292:return Px}}function Lx(i,e){i.uniform1fv(this.addr,e)}function kx(i,e){let t=Hr(e,this.size,2);i.uniform2fv(this.addr,t)}function Dx(i,e){let t=Hr(e,this.size,3);i.uniform3fv(this.addr,t)}function Hx(i,e){let t=Hr(e,this.size,4);i.uniform4fv(this.addr,t)}function Nx(i,e){let t=Hr(e,this.size,4);i.uniformMatrix2fv(this.addr,!1,t)}function Ox(i,e){let t=Hr(e,this.size,9);i.uniformMatrix3fv(this.addr,!1,t)}function Ux(i,e){let t=Hr(e,this.size,16);i.uniformMatrix4fv(this.addr,!1,t)}function Fx(i,e){i.uniform1iv(this.addr,e)}function Bx(i,e){i.uniform2iv(this.addr,e)}function zx(i,e){i.uniform3iv(this.addr,e)}function Gx(i,e){i.uniform4iv(this.addr,e)}function Vx(i,e){i.uniform1uiv(this.addr,e)}function Wx(i,e){i.uniform2uiv(this.addr,e)}function qx(i,e){i.uniform3uiv(this.addr,e)}function $x(i,e){i.uniform4uiv(this.addr,e)}function Xx(i,e,t){let n=this.cache,s=e.length,r=Ml(t,s);Yt(n,r)||(i.uniform1iv(this.addr,r),Kt(n,r));for(let a=0;a!==s;++a)t.setTexture2D(e[a]||Up,r[a])}function Yx(i,e,t){let n=this.cache,s=e.length,r=Ml(t,s);Yt(n,r)||(i.uniform1iv(this.addr,r),Kt(n,r));for(let a=0;a!==s;++a)t.setTexture3D(e[a]||Bp,r[a])}function Kx(i,e,t){let n=this.cache,s=e.length,r=Ml(t,s);Yt(n,r)||(i.uniform1iv(this.addr,r),Kt(n,r));for(let a=0;a!==s;++a)t.setTextureCube(e[a]||zp,r[a])}function Zx(i,e,t){let n=this.cache,s=e.length,r=Ml(t,s);Yt(n,r)||(i.uniform1iv(this.addr,r),Kt(n,r));for(let a=0;a!==s;++a)t.setTexture2DArray(e[a]||Fp,r[a])}function Jx(i){switch(i){case 5126:return Lx;case 35664:return kx;case 35665:return Dx;case 35666:return Hx;case 35674:return Nx;case 35675:return Ox;case 35676:return Ux;case 5124:case 35670:return Fx;case 35667:case 35671:return Bx;case 35668:case 35672:return zx;case 35669:case 35673:return Gx;case 5125:return Vx;case 36294:return Wx;case 36295:return qx;case 36296:return $x;case 35678:case 36198:case 36298:case 36306:case 35682:return Xx;case 35679:case 36299:case 36307:return Yx;case 35680:case 36300:case 36308:case 36293:return Kx;case 36289:case 36303:case 36311:case 36292:return Zx}}var ru=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=Ix(t.type)}},au=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=Jx(t.type)}},ou=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){let s=this.seq;for(let r=0,a=s.length;r!==a;++r){let o=s[r];o.setValue(e,t[o.id],n)}}},rh=/(\w+)(\])?(\[|\.)?/g;function Gf(i,e){i.seq.push(e),i.map[e.id]=e}function jx(i,e,t){let n=i.name,s=n.length;for(rh.lastIndex=0;;){let r=rh.exec(n),a=rh.lastIndex,o=r[1],l=r[2]==="]",c=r[3];if(l&&(o=o|0),c===void 0||c==="["&&a+2===s){Gf(t,c===void 0?new ru(o,i,e):new au(o,i,e));break}else{let u=t.map[o];u===void 0&&(u=new ou(o),Gf(t,u)),t=u}}}var Sr=class{constructor(e,t){this.seq=[],this.map={};let n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let s=0;s<n;++s){let r=e.getActiveUniform(t,s),a=e.getUniformLocation(t,r.name);jx(r,a,this)}}setValue(e,t,n,s){let r=this.map[t];r!==void 0&&r.setValue(e,n,s)}setOptional(e,t,n){let s=t[n];s!==void 0&&this.setValue(e,n,s)}static upload(e,t,n,s){for(let r=0,a=t.length;r!==a;++r){let o=t[r],l=n[o.id];l.needsUpdate!==!1&&o.setValue(e,l.value,s)}}static seqWithValue(e,t){let n=[];for(let s=0,r=e.length;s!==r;++s){let a=e[s];a.id in t&&n.push(a)}return n}};function Vf(i,e,t){let n=i.createShader(e);return i.shaderSource(n,t),i.compileShader(n),n}var Qx=37297,e1=0;function t1(i,e){let t=i.split(`
`),n=[],s=Math.max(e-6,0),r=Math.min(e+6,t.length);for(let a=s;a<r;a++){let o=a+1;n.push(`${o===e?">":" "} ${o}: ${t[a]}`)}return n.join(`
`)}function n1(i){let e=bt.getPrimaries(bt.workingColorSpace),t=bt.getPrimaries(i),n;switch(e===t?n="":e===Vo&&t===Go?n="LinearDisplayP3ToLinearSRGB":e===Go&&t===Vo&&(n="LinearSRGBToLinearDisplayP3"),i){case ts:case Sl:return[n,"LinearTransferOETF"];case Gt:case Ku:return[n,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space:",i),[n,"LinearTransferOETF"]}}function Wf(i,e,t){let n=i.getShaderParameter(e,i.COMPILE_STATUS),s=i.getShaderInfoLog(e).trim();if(n&&s==="")return"";let r=/ERROR: 0:(\d+)/.exec(s);if(r){let a=parseInt(r[1]);return t.toUpperCase()+`

`+s+`

`+t1(i.getShaderSource(e),a)}else return s}function i1(i,e){let t=n1(e);return`vec4 ${i}( vec4 value ) { return ${t[0]}( ${t[1]}( value ) ); }`}function s1(i,e){let t;switch(e){case Rg:t="Linear";break;case Pg:t="Reinhard";break;case Ig:t="Cineon";break;case zu:t="ACESFilmic";break;case kg:t="AgX";break;case Dg:t="Neutral";break;case Lg:t="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",e),t="Linear"}return"vec3 "+i+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}var Mo=new N;function r1(){bt.getLuminanceCoefficients(Mo);let i=Mo.x.toFixed(4),e=Mo.y.toFixed(4),t=Mo.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${i}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function a1(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(ua).join(`
`)}function o1(i){let e=[];for(let t in i){let n=i[t];n!==!1&&e.push("#define "+t+" "+n)}return e.join(`
`)}function l1(i,e){let t={},n=i.getProgramParameter(e,i.ACTIVE_ATTRIBUTES);for(let s=0;s<n;s++){let r=i.getActiveAttrib(e,s),a=r.name,o=1;r.type===i.FLOAT_MAT2&&(o=2),r.type===i.FLOAT_MAT3&&(o=3),r.type===i.FLOAT_MAT4&&(o=4),t[a]={type:r.type,location:i.getAttribLocation(e,a),locationSize:o}}return t}function ua(i){return i!==""}function qf(i,e){let t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return i.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function $f(i,e){return i.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}var c1=/^[ \t]*#include +<([\w\d./]+)>/gm;function lu(i){return i.replace(c1,u1)}var h1=new Map;function u1(i,e){let t=Je[e];if(t===void 0){let n=h1.get(e);if(n!==void 0)t=Je[n],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,n);else throw new Error("Can not resolve #include <"+e+">")}return lu(t)}var d1=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Xf(i){return i.replace(d1,f1)}function f1(i,e,t,n){let s="";for(let r=parseInt(e);r<parseInt(t);r++)s+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function Yf(i){let e=`precision ${i.precision} float;
	precision ${i.precision} int;
	precision ${i.precision} sampler2D;
	precision ${i.precision} samplerCube;
	precision ${i.precision} sampler3D;
	precision ${i.precision} sampler2DArray;
	precision ${i.precision} sampler2DShadow;
	precision ${i.precision} samplerCubeShadow;
	precision ${i.precision} sampler2DArrayShadow;
	precision ${i.precision} isampler2D;
	precision ${i.precision} isampler3D;
	precision ${i.precision} isamplerCube;
	precision ${i.precision} isampler2DArray;
	precision ${i.precision} usampler2D;
	precision ${i.precision} usampler3D;
	precision ${i.precision} usamplerCube;
	precision ${i.precision} usampler2DArray;
	`;return i.precision==="highp"?e+=`
#define HIGH_PRECISION`:i.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:i.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}function p1(i){let e="SHADOWMAP_TYPE_BASIC";return i.shadowMapType===xp?e="SHADOWMAP_TYPE_PCF":i.shadowMapType===Bu?e="SHADOWMAP_TYPE_PCF_SOFT":i.shadowMapType===xi&&(e="SHADOWMAP_TYPE_VSM"),e}function m1(i){let e="ENVMAP_TYPE_CUBE";if(i.envMap)switch(i.envMapMode){case _r:case wr:e="ENVMAP_TYPE_CUBE";break;case xl:e="ENVMAP_TYPE_CUBE_UV";break}return e}function g1(i){let e="ENVMAP_MODE_REFLECTION";if(i.envMap)switch(i.envMapMode){case wr:e="ENVMAP_MODE_REFRACTION";break}return e}function v1(i){let e="ENVMAP_BLENDING_NONE";if(i.envMap)switch(i.combine){case Sp:e="ENVMAP_BLENDING_MULTIPLY";break;case Ag:e="ENVMAP_BLENDING_MIX";break;case Cg:e="ENVMAP_BLENDING_ADD";break}return e}function y1(i){let e=i.envMapCubeUVHeight;if(e===null)return null;let t=Math.log2(e)-2,n=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),7*16)),texelHeight:n,maxMip:t}}function b1(i,e,t,n){let s=i.getContext(),r=t.defines,a=t.vertexShader,o=t.fragmentShader,l=p1(t),c=m1(t),h=g1(t),u=v1(t),d=y1(t),f=a1(t),g=o1(r),b=s.createProgram(),p,m,x=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(p=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(ua).join(`
`),p.length>0&&(p+=`
`),m=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(ua).join(`
`),m.length>0&&(m+=`
`)):(p=[Yf(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+h:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(ua).join(`
`),m=[Yf(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+c:"",t.envMap?"#define "+h:"",t.envMap?"#define "+u:"",d?"#define CUBEUV_TEXEL_WIDTH "+d.texelWidth:"",d?"#define CUBEUV_TEXEL_HEIGHT "+d.texelHeight:"",d?"#define CUBEUV_MAX_MIP "+d.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor||t.batchingColor?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==Ji?"#define TONE_MAPPING":"",t.toneMapping!==Ji?Je.tonemapping_pars_fragment:"",t.toneMapping!==Ji?s1("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",Je.colorspace_pars_fragment,i1("linearToOutputTexel",t.outputColorSpace),r1(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(ua).join(`
`)),a=lu(a),a=qf(a,t),a=$f(a,t),o=lu(o),o=qf(o,t),o=$f(o,t),a=Xf(a),o=Xf(o),t.isRawShaderMaterial!==!0&&(x=`#version 300 es
`,p=[f,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+p,m=["#define varying in",t.glslVersion===df?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===df?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+m);let v=x+p+a,y=x+m+o,w=Vf(s,s.VERTEX_SHADER,v),_=Vf(s,s.FRAGMENT_SHADER,y);s.attachShader(b,w),s.attachShader(b,_),t.index0AttributeName!==void 0?s.bindAttribLocation(b,0,t.index0AttributeName):t.morphTargets===!0&&s.bindAttribLocation(b,0,"position"),s.linkProgram(b);function M(E){if(i.debug.checkShaderErrors){let D=s.getProgramInfoLog(b).trim(),O=s.getShaderInfoLog(w).trim(),F=s.getShaderInfoLog(_).trim(),W=!0,B=!0;if(s.getProgramParameter(b,s.LINK_STATUS)===!1)if(W=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(s,b,w,_);else{let ee=Wf(s,w,"vertex"),q=Wf(s,_,"fragment");console.error("THREE.WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(b,s.VALIDATE_STATUS)+`

Material Name: `+E.name+`
Material Type: `+E.type+`

Program Info Log: `+D+`
`+ee+`
`+q)}else D!==""?console.warn("THREE.WebGLProgram: Program Info Log:",D):(O===""||F==="")&&(B=!1);B&&(E.diagnostics={runnable:W,programLog:D,vertexShader:{log:O,prefix:p},fragmentShader:{log:F,prefix:m}})}s.deleteShader(w),s.deleteShader(_),T=new Sr(s,b),L=l1(s,b)}let T;this.getUniforms=function(){return T===void 0&&M(this),T};let L;this.getAttributes=function(){return L===void 0&&M(this),L};let S=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return S===!1&&(S=s.getProgramParameter(b,Qx)),S},this.destroy=function(){n.releaseStatesOfProgram(this),s.deleteProgram(b),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=e1++,this.cacheKey=e,this.usedTimes=1,this.program=b,this.vertexShader=w,this.fragmentShader=_,this}var x1=0,cu=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e){let t=e.vertexShader,n=e.fragmentShader,s=this._getShaderStage(t),r=this._getShaderStage(n),a=this._getShaderCacheForMaterial(e);return a.has(s)===!1&&(a.add(s),s.usedTimes++),a.has(r)===!1&&(a.add(r),r.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let n of t)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){let t=this.shaderCache,n=t.get(e);return n===void 0&&(n=new hu(e),t.set(e,n)),n}},hu=class{constructor(e){this.id=x1++,this.code=e,this.usedTimes=0}};function S1(i,e,t,n,s,r,a){let o=new Yo,l=new cu,c=new Set,h=[],u=s.logarithmicDepthBuffer,d=s.reverseDepthBuffer,f=s.vertexTextures,g=s.precision,b={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function p(S){return c.add(S),S===0?"uv":`uv${S}`}function m(S,E,D,O,F){let W=O.fog,B=F.geometry,ee=S.isMeshStandardMaterial?O.environment:null,q=(S.isMeshStandardMaterial?t:e).get(S.envMap||ee),le=q&&q.mapping===xl?q.image.height:null,X=b[S.type];S.precision!==null&&(g=s.getMaxPrecision(S.precision),g!==S.precision&&console.warn("THREE.WebGLProgram.getParameters:",S.precision,"not supported, using",g,"instead."));let te=B.morphAttributes.position||B.morphAttributes.normal||B.morphAttributes.color,Pe=te!==void 0?te.length:0,$e=0;B.morphAttributes.position!==void 0&&($e=1),B.morphAttributes.normal!==void 0&&($e=2),B.morphAttributes.color!==void 0&&($e=3);let $,se,ye,Se;if(X){let rn=ni[X];$=rn.vertexShader,se=rn.fragmentShader}else $=S.vertexShader,se=S.fragmentShader,l.update(S),ye=l.getVertexShaderID(S),Se=l.getFragmentShaderID(S);let De=i.getRenderTarget(),Ne=F.isInstancedMesh===!0,st=F.isBatchedMesh===!0,rt=!!S.map,ut=!!S.matcap,U=!!q,fn=!!S.aoMap,at=!!S.lightMap,ot=!!S.bumpMap,ke=!!S.normalMap,_t=!!S.displacementMap,Fe=!!S.emissiveMap,k=!!S.metalnessMap,A=!!S.roughnessMap,Y=S.anisotropy>0,ae=S.clearcoat>0,ce=S.dispersion>0,re=S.iridescence>0,Ie=S.sheen>0,ve=S.transmission>0,Te=Y&&!!S.anisotropyMap,dt=ae&&!!S.clearcoatMap,fe=ae&&!!S.clearcoatNormalMap,Re=ae&&!!S.clearcoatRoughnessMap,Oe=re&&!!S.iridescenceMap,Be=re&&!!S.iridescenceThicknessMap,Ae=Ie&&!!S.sheenColorMap,lt=Ie&&!!S.sheenRoughnessMap,ze=!!S.specularMap,tt=!!S.specularColorMap,z=!!S.specularIntensityMap,_e=ve&&!!S.transmissionMap,j=ve&&!!S.thicknessMap,oe=!!S.gradientMap,Me=!!S.alphaMap,we=S.alphaTest>0,ct=!!S.alphaHash,Nt=!!S.extensions,it=Ji;S.toneMapped&&(De===null||De.isXRRenderTarget===!0)&&(it=i.toneMapping);let ft={shaderID:X,shaderType:S.type,shaderName:S.name,vertexShader:$,fragmentShader:se,defines:S.defines,customVertexShaderID:ye,customFragmentShaderID:Se,isRawShaderMaterial:S.isRawShaderMaterial===!0,glslVersion:S.glslVersion,precision:g,batching:st,batchingColor:st&&F._colorsTexture!==null,instancing:Ne,instancingColor:Ne&&F.instanceColor!==null,instancingMorph:Ne&&F.morphTexture!==null,supportsVertexTextures:f,outputColorSpace:De===null?i.outputColorSpace:De.isXRRenderTarget===!0?De.texture.colorSpace:ts,alphaToCoverage:!!S.alphaToCoverage,map:rt,matcap:ut,envMap:U,envMapMode:U&&q.mapping,envMapCubeUVHeight:le,aoMap:fn,lightMap:at,bumpMap:ot,normalMap:ke,displacementMap:f&&_t,emissiveMap:Fe,normalMapObjectSpace:ke&&S.normalMapType===Fg,normalMapTangentSpace:ke&&S.normalMapType===Lp,metalnessMap:k,roughnessMap:A,anisotropy:Y,anisotropyMap:Te,clearcoat:ae,clearcoatMap:dt,clearcoatNormalMap:fe,clearcoatRoughnessMap:Re,dispersion:ce,iridescence:re,iridescenceMap:Oe,iridescenceThicknessMap:Be,sheen:Ie,sheenColorMap:Ae,sheenRoughnessMap:lt,specularMap:ze,specularColorMap:tt,specularIntensityMap:z,transmission:ve,transmissionMap:_e,thicknessMap:j,gradientMap:oe,opaque:S.transparent===!1&&S.blending===yr&&S.alphaToCoverage===!1,alphaMap:Me,alphaTest:we,alphaHash:ct,combine:S.combine,mapUv:rt&&p(S.map.channel),aoMapUv:fn&&p(S.aoMap.channel),lightMapUv:at&&p(S.lightMap.channel),bumpMapUv:ot&&p(S.bumpMap.channel),normalMapUv:ke&&p(S.normalMap.channel),displacementMapUv:_t&&p(S.displacementMap.channel),emissiveMapUv:Fe&&p(S.emissiveMap.channel),metalnessMapUv:k&&p(S.metalnessMap.channel),roughnessMapUv:A&&p(S.roughnessMap.channel),anisotropyMapUv:Te&&p(S.anisotropyMap.channel),clearcoatMapUv:dt&&p(S.clearcoatMap.channel),clearcoatNormalMapUv:fe&&p(S.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:Re&&p(S.clearcoatRoughnessMap.channel),iridescenceMapUv:Oe&&p(S.iridescenceMap.channel),iridescenceThicknessMapUv:Be&&p(S.iridescenceThicknessMap.channel),sheenColorMapUv:Ae&&p(S.sheenColorMap.channel),sheenRoughnessMapUv:lt&&p(S.sheenRoughnessMap.channel),specularMapUv:ze&&p(S.specularMap.channel),specularColorMapUv:tt&&p(S.specularColorMap.channel),specularIntensityMapUv:z&&p(S.specularIntensityMap.channel),transmissionMapUv:_e&&p(S.transmissionMap.channel),thicknessMapUv:j&&p(S.thicknessMap.channel),alphaMapUv:Me&&p(S.alphaMap.channel),vertexTangents:!!B.attributes.tangent&&(ke||Y),vertexColors:S.vertexColors,vertexAlphas:S.vertexColors===!0&&!!B.attributes.color&&B.attributes.color.itemSize===4,pointsUvs:F.isPoints===!0&&!!B.attributes.uv&&(rt||Me),fog:!!W,useFog:S.fog===!0,fogExp2:!!W&&W.isFogExp2,flatShading:S.flatShading===!0,sizeAttenuation:S.sizeAttenuation===!0,logarithmicDepthBuffer:u,reverseDepthBuffer:d,skinning:F.isSkinnedMesh===!0,morphTargets:B.morphAttributes.position!==void 0,morphNormals:B.morphAttributes.normal!==void 0,morphColors:B.morphAttributes.color!==void 0,morphTargetsCount:Pe,morphTextureStride:$e,numDirLights:E.directional.length,numPointLights:E.point.length,numSpotLights:E.spot.length,numSpotLightMaps:E.spotLightMap.length,numRectAreaLights:E.rectArea.length,numHemiLights:E.hemi.length,numDirLightShadows:E.directionalShadowMap.length,numPointLightShadows:E.pointShadowMap.length,numSpotLightShadows:E.spotShadowMap.length,numSpotLightShadowsWithMaps:E.numSpotLightShadowsWithMaps,numLightProbes:E.numLightProbes,numClippingPlanes:a.numPlanes,numClipIntersection:a.numIntersection,dithering:S.dithering,shadowMapEnabled:i.shadowMap.enabled&&D.length>0,shadowMapType:i.shadowMap.type,toneMapping:it,decodeVideoTexture:rt&&S.map.isVideoTexture===!0&&bt.getTransfer(S.map.colorSpace)===Pt,premultipliedAlpha:S.premultipliedAlpha,doubleSided:S.side===Mt,flipSided:S.side===hn,useDepthPacking:S.depthPacking>=0,depthPacking:S.depthPacking||0,index0AttributeName:S.index0AttributeName,extensionClipCullDistance:Nt&&S.extensions.clipCullDistance===!0&&n.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(Nt&&S.extensions.multiDraw===!0||st)&&n.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:S.customProgramCacheKey()};return ft.vertexUv1s=c.has(1),ft.vertexUv2s=c.has(2),ft.vertexUv3s=c.has(3),c.clear(),ft}function x(S){let E=[];if(S.shaderID?E.push(S.shaderID):(E.push(S.customVertexShaderID),E.push(S.customFragmentShaderID)),S.defines!==void 0)for(let D in S.defines)E.push(D),E.push(S.defines[D]);return S.isRawShaderMaterial===!1&&(v(E,S),y(E,S),E.push(i.outputColorSpace)),E.push(S.customProgramCacheKey),E.join()}function v(S,E){S.push(E.precision),S.push(E.outputColorSpace),S.push(E.envMapMode),S.push(E.envMapCubeUVHeight),S.push(E.mapUv),S.push(E.alphaMapUv),S.push(E.lightMapUv),S.push(E.aoMapUv),S.push(E.bumpMapUv),S.push(E.normalMapUv),S.push(E.displacementMapUv),S.push(E.emissiveMapUv),S.push(E.metalnessMapUv),S.push(E.roughnessMapUv),S.push(E.anisotropyMapUv),S.push(E.clearcoatMapUv),S.push(E.clearcoatNormalMapUv),S.push(E.clearcoatRoughnessMapUv),S.push(E.iridescenceMapUv),S.push(E.iridescenceThicknessMapUv),S.push(E.sheenColorMapUv),S.push(E.sheenRoughnessMapUv),S.push(E.specularMapUv),S.push(E.specularColorMapUv),S.push(E.specularIntensityMapUv),S.push(E.transmissionMapUv),S.push(E.thicknessMapUv),S.push(E.combine),S.push(E.fogExp2),S.push(E.sizeAttenuation),S.push(E.morphTargetsCount),S.push(E.morphAttributeCount),S.push(E.numDirLights),S.push(E.numPointLights),S.push(E.numSpotLights),S.push(E.numSpotLightMaps),S.push(E.numHemiLights),S.push(E.numRectAreaLights),S.push(E.numDirLightShadows),S.push(E.numPointLightShadows),S.push(E.numSpotLightShadows),S.push(E.numSpotLightShadowsWithMaps),S.push(E.numLightProbes),S.push(E.shadowMapType),S.push(E.toneMapping),S.push(E.numClippingPlanes),S.push(E.numClipIntersection),S.push(E.depthPacking)}function y(S,E){o.disableAll(),E.supportsVertexTextures&&o.enable(0),E.instancing&&o.enable(1),E.instancingColor&&o.enable(2),E.instancingMorph&&o.enable(3),E.matcap&&o.enable(4),E.envMap&&o.enable(5),E.normalMapObjectSpace&&o.enable(6),E.normalMapTangentSpace&&o.enable(7),E.clearcoat&&o.enable(8),E.iridescence&&o.enable(9),E.alphaTest&&o.enable(10),E.vertexColors&&o.enable(11),E.vertexAlphas&&o.enable(12),E.vertexUv1s&&o.enable(13),E.vertexUv2s&&o.enable(14),E.vertexUv3s&&o.enable(15),E.vertexTangents&&o.enable(16),E.anisotropy&&o.enable(17),E.alphaHash&&o.enable(18),E.batching&&o.enable(19),E.dispersion&&o.enable(20),E.batchingColor&&o.enable(21),S.push(o.mask),o.disableAll(),E.fog&&o.enable(0),E.useFog&&o.enable(1),E.flatShading&&o.enable(2),E.logarithmicDepthBuffer&&o.enable(3),E.reverseDepthBuffer&&o.enable(4),E.skinning&&o.enable(5),E.morphTargets&&o.enable(6),E.morphNormals&&o.enable(7),E.morphColors&&o.enable(8),E.premultipliedAlpha&&o.enable(9),E.shadowMapEnabled&&o.enable(10),E.doubleSided&&o.enable(11),E.flipSided&&o.enable(12),E.useDepthPacking&&o.enable(13),E.dithering&&o.enable(14),E.transmission&&o.enable(15),E.sheen&&o.enable(16),E.opaque&&o.enable(17),E.pointsUvs&&o.enable(18),E.decodeVideoTexture&&o.enable(19),E.alphaToCoverage&&o.enable(20),S.push(o.mask)}function w(S){let E=b[S.type],D;if(E){let O=ni[E];D=Dr.clone(O.uniforms)}else D=S.uniforms;return D}function _(S,E){let D;for(let O=0,F=h.length;O<F;O++){let W=h[O];if(W.cacheKey===E){D=W,++D.usedTimes;break}}return D===void 0&&(D=new b1(i,E,S,r),h.push(D)),D}function M(S){if(--S.usedTimes===0){let E=h.indexOf(S);h[E]=h[h.length-1],h.pop(),S.destroy()}}function T(S){l.remove(S)}function L(){l.dispose()}return{getParameters:m,getProgramCacheKey:x,getUniforms:w,acquireProgram:_,releaseProgram:M,releaseShaderCache:T,programs:h,dispose:L}}function M1(){let i=new WeakMap;function e(a){return i.has(a)}function t(a){let o=i.get(a);return o===void 0&&(o={},i.set(a,o)),o}function n(a){i.delete(a)}function s(a,o,l){i.get(a)[o]=l}function r(){i=new WeakMap}return{has:e,get:t,remove:n,update:s,dispose:r}}function _1(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.material.id!==e.material.id?i.material.id-e.material.id:i.z!==e.z?i.z-e.z:i.id-e.id}function Kf(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.z!==e.z?e.z-i.z:i.id-e.id}function Zf(){let i=[],e=0,t=[],n=[],s=[];function r(){e=0,t.length=0,n.length=0,s.length=0}function a(u,d,f,g,b,p){let m=i[e];return m===void 0?(m={id:u.id,object:u,geometry:d,material:f,groupOrder:g,renderOrder:u.renderOrder,z:b,group:p},i[e]=m):(m.id=u.id,m.object=u,m.geometry=d,m.material=f,m.groupOrder=g,m.renderOrder=u.renderOrder,m.z=b,m.group=p),e++,m}function o(u,d,f,g,b,p){let m=a(u,d,f,g,b,p);f.transmission>0?n.push(m):f.transparent===!0?s.push(m):t.push(m)}function l(u,d,f,g,b,p){let m=a(u,d,f,g,b,p);f.transmission>0?n.unshift(m):f.transparent===!0?s.unshift(m):t.unshift(m)}function c(u,d){t.length>1&&t.sort(u||_1),n.length>1&&n.sort(d||Kf),s.length>1&&s.sort(d||Kf)}function h(){for(let u=e,d=i.length;u<d;u++){let f=i[u];if(f.id===null)break;f.id=null,f.object=null,f.geometry=null,f.material=null,f.group=null}}return{opaque:t,transmissive:n,transparent:s,init:r,push:o,unshift:l,finish:h,sort:c}}function w1(){let i=new WeakMap;function e(n,s){let r=i.get(n),a;return r===void 0?(a=new Zf,i.set(n,[a])):s>=r.length?(a=new Zf,r.push(a)):a=r[s],a}function t(){i=new WeakMap}return{get:e,dispose:t}}function E1(){let i={};return{get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new N,color:new de};break;case"SpotLight":t={position:new N,direction:new N,color:new de,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new N,color:new de,distance:0,decay:0};break;case"HemisphereLight":t={direction:new N,skyColor:new de,groundColor:new de};break;case"RectAreaLight":t={color:new de,position:new N,halfWidth:new N,halfHeight:new N};break}return i[e.id]=t,t}}}function T1(){let i={};return{get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ue};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ue};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ue,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[e.id]=t,t}}}var A1=0;function C1(i,e){return(e.castShadow?2:0)-(i.castShadow?2:0)+(e.map?1:0)-(i.map?1:0)}function R1(i){let e=new E1,t=T1(),n={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)n.probe.push(new N);let s=new N,r=new Ge,a=new Ge;function o(c){let h=0,u=0,d=0;for(let L=0;L<9;L++)n.probe[L].set(0,0,0);let f=0,g=0,b=0,p=0,m=0,x=0,v=0,y=0,w=0,_=0,M=0;c.sort(C1);for(let L=0,S=c.length;L<S;L++){let E=c[L],D=E.color,O=E.intensity,F=E.distance,W=E.shadow&&E.shadow.map?E.shadow.map.texture:null;if(E.isAmbientLight)h+=D.r*O,u+=D.g*O,d+=D.b*O;else if(E.isLightProbe){for(let B=0;B<9;B++)n.probe[B].addScaledVector(E.sh.coefficients[B],O);M++}else if(E.isDirectionalLight){let B=e.get(E);if(B.color.copy(E.color).multiplyScalar(E.intensity),E.castShadow){let ee=E.shadow,q=t.get(E);q.shadowIntensity=ee.intensity,q.shadowBias=ee.bias,q.shadowNormalBias=ee.normalBias,q.shadowRadius=ee.radius,q.shadowMapSize=ee.mapSize,n.directionalShadow[f]=q,n.directionalShadowMap[f]=W,n.directionalShadowMatrix[f]=E.shadow.matrix,x++}n.directional[f]=B,f++}else if(E.isSpotLight){let B=e.get(E);B.position.setFromMatrixPosition(E.matrixWorld),B.color.copy(D).multiplyScalar(O),B.distance=F,B.coneCos=Math.cos(E.angle),B.penumbraCos=Math.cos(E.angle*(1-E.penumbra)),B.decay=E.decay,n.spot[b]=B;let ee=E.shadow;if(E.map&&(n.spotLightMap[w]=E.map,w++,ee.updateMatrices(E),E.castShadow&&_++),n.spotLightMatrix[b]=ee.matrix,E.castShadow){let q=t.get(E);q.shadowIntensity=ee.intensity,q.shadowBias=ee.bias,q.shadowNormalBias=ee.normalBias,q.shadowRadius=ee.radius,q.shadowMapSize=ee.mapSize,n.spotShadow[b]=q,n.spotShadowMap[b]=W,y++}b++}else if(E.isRectAreaLight){let B=e.get(E);B.color.copy(D).multiplyScalar(O),B.halfWidth.set(E.width*.5,0,0),B.halfHeight.set(0,E.height*.5,0),n.rectArea[p]=B,p++}else if(E.isPointLight){let B=e.get(E);if(B.color.copy(E.color).multiplyScalar(E.intensity),B.distance=E.distance,B.decay=E.decay,E.castShadow){let ee=E.shadow,q=t.get(E);q.shadowIntensity=ee.intensity,q.shadowBias=ee.bias,q.shadowNormalBias=ee.normalBias,q.shadowRadius=ee.radius,q.shadowMapSize=ee.mapSize,q.shadowCameraNear=ee.camera.near,q.shadowCameraFar=ee.camera.far,n.pointShadow[g]=q,n.pointShadowMap[g]=W,n.pointShadowMatrix[g]=E.shadow.matrix,v++}n.point[g]=B,g++}else if(E.isHemisphereLight){let B=e.get(E);B.skyColor.copy(E.color).multiplyScalar(O),B.groundColor.copy(E.groundColor).multiplyScalar(O),n.hemi[m]=B,m++}}p>0&&(i.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=be.LTC_FLOAT_1,n.rectAreaLTC2=be.LTC_FLOAT_2):(n.rectAreaLTC1=be.LTC_HALF_1,n.rectAreaLTC2=be.LTC_HALF_2)),n.ambient[0]=h,n.ambient[1]=u,n.ambient[2]=d;let T=n.hash;(T.directionalLength!==f||T.pointLength!==g||T.spotLength!==b||T.rectAreaLength!==p||T.hemiLength!==m||T.numDirectionalShadows!==x||T.numPointShadows!==v||T.numSpotShadows!==y||T.numSpotMaps!==w||T.numLightProbes!==M)&&(n.directional.length=f,n.spot.length=b,n.rectArea.length=p,n.point.length=g,n.hemi.length=m,n.directionalShadow.length=x,n.directionalShadowMap.length=x,n.pointShadow.length=v,n.pointShadowMap.length=v,n.spotShadow.length=y,n.spotShadowMap.length=y,n.directionalShadowMatrix.length=x,n.pointShadowMatrix.length=v,n.spotLightMatrix.length=y+w-_,n.spotLightMap.length=w,n.numSpotLightShadowsWithMaps=_,n.numLightProbes=M,T.directionalLength=f,T.pointLength=g,T.spotLength=b,T.rectAreaLength=p,T.hemiLength=m,T.numDirectionalShadows=x,T.numPointShadows=v,T.numSpotShadows=y,T.numSpotMaps=w,T.numLightProbes=M,n.version=A1++)}function l(c,h){let u=0,d=0,f=0,g=0,b=0,p=h.matrixWorldInverse;for(let m=0,x=c.length;m<x;m++){let v=c[m];if(v.isDirectionalLight){let y=n.directional[u];y.direction.setFromMatrixPosition(v.matrixWorld),s.setFromMatrixPosition(v.target.matrixWorld),y.direction.sub(s),y.direction.transformDirection(p),u++}else if(v.isSpotLight){let y=n.spot[f];y.position.setFromMatrixPosition(v.matrixWorld),y.position.applyMatrix4(p),y.direction.setFromMatrixPosition(v.matrixWorld),s.setFromMatrixPosition(v.target.matrixWorld),y.direction.sub(s),y.direction.transformDirection(p),f++}else if(v.isRectAreaLight){let y=n.rectArea[g];y.position.setFromMatrixPosition(v.matrixWorld),y.position.applyMatrix4(p),a.identity(),r.copy(v.matrixWorld),r.premultiply(p),a.extractRotation(r),y.halfWidth.set(v.width*.5,0,0),y.halfHeight.set(0,v.height*.5,0),y.halfWidth.applyMatrix4(a),y.halfHeight.applyMatrix4(a),g++}else if(v.isPointLight){let y=n.point[d];y.position.setFromMatrixPosition(v.matrixWorld),y.position.applyMatrix4(p),d++}else if(v.isHemisphereLight){let y=n.hemi[b];y.direction.setFromMatrixPosition(v.matrixWorld),y.direction.transformDirection(p),b++}}}return{setup:o,setupView:l,state:n}}function Jf(i){let e=new R1(i),t=[],n=[];function s(h){c.camera=h,t.length=0,n.length=0}function r(h){t.push(h)}function a(h){n.push(h)}function o(){e.setup(t)}function l(h){e.setupView(t,h)}let c={lightsArray:t,shadowsArray:n,camera:null,lights:e,transmissionRenderTarget:{}};return{init:s,state:c,setupLights:o,setupLightsView:l,pushLight:r,pushShadow:a}}function P1(i){let e=new WeakMap;function t(s,r=0){let a=e.get(s),o;return a===void 0?(o=new Jf(i),e.set(s,[o])):r>=a.length?(o=new Jf(i),a.push(o)):o=a[r],o}function n(){e=new WeakMap}return{get:t,dispose:n}}var uu=class extends wi{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=Og,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},du=class extends wi{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}},I1=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,L1=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;function k1(i,e,t){let n=new ba,s=new ue,r=new ue,a=new yt,o=new uu({depthPacking:Ug}),l=new du,c={},h=t.maxTextureSize,u={[ji]:hn,[hn]:ji,[Mt]:Mt},d=new At({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new ue},radius:{value:4}},vertexShader:I1,fragmentShader:L1}),f=d.clone();f.defines.HORIZONTAL_PASS=1;let g=new Qe;g.setAttribute("position",new Xe(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let b=new he(g,d),p=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=xp;let m=this.type;this.render=function(_,M,T){if(p.enabled===!1||p.autoUpdate===!1&&p.needsUpdate===!1||_.length===0)return;let L=i.getRenderTarget(),S=i.getActiveCubeFace(),E=i.getActiveMipmapLevel(),D=i.state;D.setBlending(si),D.buffers.color.setClear(1,1,1,1),D.buffers.depth.setTest(!0),D.setScissorTest(!1);let O=m!==xi&&this.type===xi,F=m===xi&&this.type!==xi;for(let W=0,B=_.length;W<B;W++){let ee=_[W],q=ee.shadow;if(q===void 0){console.warn("THREE.WebGLShadowMap:",ee,"has no shadow.");continue}if(q.autoUpdate===!1&&q.needsUpdate===!1)continue;s.copy(q.mapSize);let le=q.getFrameExtents();if(s.multiply(le),r.copy(q.mapSize),(s.x>h||s.y>h)&&(s.x>h&&(r.x=Math.floor(h/le.x),s.x=r.x*le.x,q.mapSize.x=r.x),s.y>h&&(r.y=Math.floor(h/le.y),s.y=r.y*le.y,q.mapSize.y=r.y)),q.map===null||O===!0||F===!0){let te=this.type!==xi?{minFilter:xn,magFilter:xn}:{};q.map!==null&&q.map.dispose(),q.map=new gn(s.x,s.y,te),q.map.texture.name=ee.name+".shadowMap",q.camera.updateProjectionMatrix()}i.setRenderTarget(q.map),i.clear();let X=q.getViewportCount();for(let te=0;te<X;te++){let Pe=q.getViewport(te);a.set(r.x*Pe.x,r.y*Pe.y,r.x*Pe.z,r.y*Pe.w),D.viewport(a),q.updateMatrices(ee,te),n=q.getFrustum(),y(M,T,q.camera,ee,this.type)}q.isPointLightShadow!==!0&&this.type===xi&&x(q,T),q.needsUpdate=!1}m=this.type,p.needsUpdate=!1,i.setRenderTarget(L,S,E)};function x(_,M){let T=e.update(b);d.defines.VSM_SAMPLES!==_.blurSamples&&(d.defines.VSM_SAMPLES=_.blurSamples,f.defines.VSM_SAMPLES=_.blurSamples,d.needsUpdate=!0,f.needsUpdate=!0),_.mapPass===null&&(_.mapPass=new gn(s.x,s.y)),d.uniforms.shadow_pass.value=_.map.texture,d.uniforms.resolution.value=_.mapSize,d.uniforms.radius.value=_.radius,i.setRenderTarget(_.mapPass),i.clear(),i.renderBufferDirect(M,null,T,d,b,null),f.uniforms.shadow_pass.value=_.mapPass.texture,f.uniforms.resolution.value=_.mapSize,f.uniforms.radius.value=_.radius,i.setRenderTarget(_.map),i.clear(),i.renderBufferDirect(M,null,T,f,b,null)}function v(_,M,T,L){let S=null,E=T.isPointLight===!0?_.customDistanceMaterial:_.customDepthMaterial;if(E!==void 0)S=E;else if(S=T.isPointLight===!0?l:o,i.localClippingEnabled&&M.clipShadows===!0&&Array.isArray(M.clippingPlanes)&&M.clippingPlanes.length!==0||M.displacementMap&&M.displacementScale!==0||M.alphaMap&&M.alphaTest>0||M.map&&M.alphaTest>0){let D=S.uuid,O=M.uuid,F=c[D];F===void 0&&(F={},c[D]=F);let W=F[O];W===void 0&&(W=S.clone(),F[O]=W,M.addEventListener("dispose",w)),S=W}if(S.visible=M.visible,S.wireframe=M.wireframe,L===xi?S.side=M.shadowSide!==null?M.shadowSide:M.side:S.side=M.shadowSide!==null?M.shadowSide:u[M.side],S.alphaMap=M.alphaMap,S.alphaTest=M.alphaTest,S.map=M.map,S.clipShadows=M.clipShadows,S.clippingPlanes=M.clippingPlanes,S.clipIntersection=M.clipIntersection,S.displacementMap=M.displacementMap,S.displacementScale=M.displacementScale,S.displacementBias=M.displacementBias,S.wireframeLinewidth=M.wireframeLinewidth,S.linewidth=M.linewidth,T.isPointLight===!0&&S.isMeshDistanceMaterial===!0){let D=i.properties.get(S);D.light=T}return S}function y(_,M,T,L,S){if(_.visible===!1)return;if(_.layers.test(M.layers)&&(_.isMesh||_.isLine||_.isPoints)&&(_.castShadow||_.receiveShadow&&S===xi)&&(!_.frustumCulled||n.intersectsObject(_))){_.modelViewMatrix.multiplyMatrices(T.matrixWorldInverse,_.matrixWorld);let O=e.update(_),F=_.material;if(Array.isArray(F)){let W=O.groups;for(let B=0,ee=W.length;B<ee;B++){let q=W[B],le=F[q.materialIndex];if(le&&le.visible){let X=v(_,le,L,S);_.onBeforeShadow(i,_,M,T,O,X,q),i.renderBufferDirect(T,null,O,X,_,q),_.onAfterShadow(i,_,M,T,O,X,q)}}}else if(F.visible){let W=v(_,F,L,S);_.onBeforeShadow(i,_,M,T,O,W,null),i.renderBufferDirect(T,null,O,W,_,null),_.onAfterShadow(i,_,M,T,O,W,null)}}let D=_.children;for(let O=0,F=D.length;O<F;O++)y(D[O],M,T,L,S)}function w(_){_.target.removeEventListener("dispose",w);for(let T in c){let L=c[T],S=_.target.uuid;S in L&&(L[S].dispose(),delete L[S])}}}var D1={[gh]:vh,[yh]:Sh,[bh]:Mh,[Mr]:xh,[vh]:gh,[Sh]:yh,[Mh]:bh,[xh]:Mr};function H1(i){function e(){let z=!1,_e=new yt,j=null,oe=new yt(0,0,0,0);return{setMask:function(Me){j!==Me&&!z&&(i.colorMask(Me,Me,Me,Me),j=Me)},setLocked:function(Me){z=Me},setClear:function(Me,we,ct,Nt,it){it===!0&&(Me*=Nt,we*=Nt,ct*=Nt),_e.set(Me,we,ct,Nt),oe.equals(_e)===!1&&(i.clearColor(Me,we,ct,Nt),oe.copy(_e))},reset:function(){z=!1,j=null,oe.set(-1,0,0,0)}}}function t(){let z=!1,_e=!1,j=null,oe=null,Me=null;return{setReversed:function(we){_e=we},setTest:function(we){we?ye(i.DEPTH_TEST):Se(i.DEPTH_TEST)},setMask:function(we){j!==we&&!z&&(i.depthMask(we),j=we)},setFunc:function(we){if(_e&&(we=D1[we]),oe!==we){switch(we){case gh:i.depthFunc(i.NEVER);break;case vh:i.depthFunc(i.ALWAYS);break;case yh:i.depthFunc(i.LESS);break;case Mr:i.depthFunc(i.LEQUAL);break;case bh:i.depthFunc(i.EQUAL);break;case xh:i.depthFunc(i.GEQUAL);break;case Sh:i.depthFunc(i.GREATER);break;case Mh:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}oe=we}},setLocked:function(we){z=we},setClear:function(we){Me!==we&&(i.clearDepth(we),Me=we)},reset:function(){z=!1,j=null,oe=null,Me=null}}}function n(){let z=!1,_e=null,j=null,oe=null,Me=null,we=null,ct=null,Nt=null,it=null;return{setTest:function(ft){z||(ft?ye(i.STENCIL_TEST):Se(i.STENCIL_TEST))},setMask:function(ft){_e!==ft&&!z&&(i.stencilMask(ft),_e=ft)},setFunc:function(ft,rn,In){(j!==ft||oe!==rn||Me!==In)&&(i.stencilFunc(ft,rn,In),j=ft,oe=rn,Me=In)},setOp:function(ft,rn,In){(we!==ft||ct!==rn||Nt!==In)&&(i.stencilOp(ft,rn,In),we=ft,ct=rn,Nt=In)},setLocked:function(ft){z=ft},setClear:function(ft){it!==ft&&(i.clearStencil(ft),it=ft)},reset:function(){z=!1,_e=null,j=null,oe=null,Me=null,we=null,ct=null,Nt=null,it=null}}}let s=new e,r=new t,a=new n,o=new WeakMap,l=new WeakMap,c={},h={},u=new WeakMap,d=[],f=null,g=!1,b=null,p=null,m=null,x=null,v=null,y=null,w=null,_=new de(0,0,0),M=0,T=!1,L=null,S=null,E=null,D=null,O=null,F=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS),W=!1,B=0,ee=i.getParameter(i.VERSION);ee.indexOf("WebGL")!==-1?(B=parseFloat(/^WebGL (\d)/.exec(ee)[1]),W=B>=1):ee.indexOf("OpenGL ES")!==-1&&(B=parseFloat(/^OpenGL ES (\d)/.exec(ee)[1]),W=B>=2);let q=null,le={},X=i.getParameter(i.SCISSOR_BOX),te=i.getParameter(i.VIEWPORT),Pe=new yt().fromArray(X),$e=new yt().fromArray(te);function $(z,_e,j,oe){let Me=new Uint8Array(4),we=i.createTexture();i.bindTexture(z,we),i.texParameteri(z,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(z,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let ct=0;ct<j;ct++)z===i.TEXTURE_3D||z===i.TEXTURE_2D_ARRAY?i.texImage3D(_e,0,i.RGBA,1,1,oe,0,i.RGBA,i.UNSIGNED_BYTE,Me):i.texImage2D(_e+ct,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,Me);return we}let se={};se[i.TEXTURE_2D]=$(i.TEXTURE_2D,i.TEXTURE_2D,1),se[i.TEXTURE_CUBE_MAP]=$(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),se[i.TEXTURE_2D_ARRAY]=$(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),se[i.TEXTURE_3D]=$(i.TEXTURE_3D,i.TEXTURE_3D,1,1),s.setClear(0,0,0,1),r.setClear(1),a.setClear(0),ye(i.DEPTH_TEST),r.setFunc(Mr),at(!1),ot(sf),ye(i.CULL_FACE),U(si);function ye(z){c[z]!==!0&&(i.enable(z),c[z]=!0)}function Se(z){c[z]!==!1&&(i.disable(z),c[z]=!1)}function De(z,_e){return h[z]!==_e?(i.bindFramebuffer(z,_e),h[z]=_e,z===i.DRAW_FRAMEBUFFER&&(h[i.FRAMEBUFFER]=_e),z===i.FRAMEBUFFER&&(h[i.DRAW_FRAMEBUFFER]=_e),!0):!1}function Ne(z,_e){let j=d,oe=!1;if(z){j=u.get(_e),j===void 0&&(j=[],u.set(_e,j));let Me=z.textures;if(j.length!==Me.length||j[0]!==i.COLOR_ATTACHMENT0){for(let we=0,ct=Me.length;we<ct;we++)j[we]=i.COLOR_ATTACHMENT0+we;j.length=Me.length,oe=!0}}else j[0]!==i.BACK&&(j[0]=i.BACK,oe=!0);oe&&i.drawBuffers(j)}function st(z){return f!==z?(i.useProgram(z),f=z,!0):!1}let rt={[_s]:i.FUNC_ADD,[hg]:i.FUNC_SUBTRACT,[ug]:i.FUNC_REVERSE_SUBTRACT};rt[dg]=i.MIN,rt[fg]=i.MAX;let ut={[pg]:i.ZERO,[mg]:i.ONE,[gg]:i.SRC_COLOR,[ph]:i.SRC_ALPHA,[Mg]:i.SRC_ALPHA_SATURATE,[xg]:i.DST_COLOR,[yg]:i.DST_ALPHA,[vg]:i.ONE_MINUS_SRC_COLOR,[mh]:i.ONE_MINUS_SRC_ALPHA,[Sg]:i.ONE_MINUS_DST_COLOR,[bg]:i.ONE_MINUS_DST_ALPHA,[_g]:i.CONSTANT_COLOR,[wg]:i.ONE_MINUS_CONSTANT_COLOR,[Eg]:i.CONSTANT_ALPHA,[Tg]:i.ONE_MINUS_CONSTANT_ALPHA};function U(z,_e,j,oe,Me,we,ct,Nt,it,ft){if(z===si){g===!0&&(Se(i.BLEND),g=!1);return}if(g===!1&&(ye(i.BLEND),g=!0),z!==cg){if(z!==b||ft!==T){if((p!==_s||v!==_s)&&(i.blendEquation(i.FUNC_ADD),p=_s,v=_s),ft)switch(z){case yr:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Vt:i.blendFunc(i.ONE,i.ONE);break;case rf:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case af:i.blendFuncSeparate(i.ZERO,i.SRC_COLOR,i.ZERO,i.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",z);break}else switch(z){case yr:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Vt:i.blendFunc(i.SRC_ALPHA,i.ONE);break;case rf:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case af:i.blendFunc(i.ZERO,i.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",z);break}m=null,x=null,y=null,w=null,_.set(0,0,0),M=0,b=z,T=ft}return}Me=Me||_e,we=we||j,ct=ct||oe,(_e!==p||Me!==v)&&(i.blendEquationSeparate(rt[_e],rt[Me]),p=_e,v=Me),(j!==m||oe!==x||we!==y||ct!==w)&&(i.blendFuncSeparate(ut[j],ut[oe],ut[we],ut[ct]),m=j,x=oe,y=we,w=ct),(Nt.equals(_)===!1||it!==M)&&(i.blendColor(Nt.r,Nt.g,Nt.b,it),_.copy(Nt),M=it),b=z,T=!1}function fn(z,_e){z.side===Mt?Se(i.CULL_FACE):ye(i.CULL_FACE);let j=z.side===hn;_e&&(j=!j),at(j),z.blending===yr&&z.transparent===!1?U(si):U(z.blending,z.blendEquation,z.blendSrc,z.blendDst,z.blendEquationAlpha,z.blendSrcAlpha,z.blendDstAlpha,z.blendColor,z.blendAlpha,z.premultipliedAlpha),r.setFunc(z.depthFunc),r.setTest(z.depthTest),r.setMask(z.depthWrite),s.setMask(z.colorWrite);let oe=z.stencilWrite;a.setTest(oe),oe&&(a.setMask(z.stencilWriteMask),a.setFunc(z.stencilFunc,z.stencilRef,z.stencilFuncMask),a.setOp(z.stencilFail,z.stencilZFail,z.stencilZPass)),_t(z.polygonOffset,z.polygonOffsetFactor,z.polygonOffsetUnits),z.alphaToCoverage===!0?ye(i.SAMPLE_ALPHA_TO_COVERAGE):Se(i.SAMPLE_ALPHA_TO_COVERAGE)}function at(z){L!==z&&(z?i.frontFace(i.CW):i.frontFace(i.CCW),L=z)}function ot(z){z!==og?(ye(i.CULL_FACE),z!==S&&(z===sf?i.cullFace(i.BACK):z===lg?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):Se(i.CULL_FACE),S=z}function ke(z){z!==E&&(W&&i.lineWidth(z),E=z)}function _t(z,_e,j){z?(ye(i.POLYGON_OFFSET_FILL),(D!==_e||O!==j)&&(i.polygonOffset(_e,j),D=_e,O=j)):Se(i.POLYGON_OFFSET_FILL)}function Fe(z){z?ye(i.SCISSOR_TEST):Se(i.SCISSOR_TEST)}function k(z){z===void 0&&(z=i.TEXTURE0+F-1),q!==z&&(i.activeTexture(z),q=z)}function A(z,_e,j){j===void 0&&(q===null?j=i.TEXTURE0+F-1:j=q);let oe=le[j];oe===void 0&&(oe={type:void 0,texture:void 0},le[j]=oe),(oe.type!==z||oe.texture!==_e)&&(q!==j&&(i.activeTexture(j),q=j),i.bindTexture(z,_e||se[z]),oe.type=z,oe.texture=_e)}function Y(){let z=le[q];z!==void 0&&z.type!==void 0&&(i.bindTexture(z.type,null),z.type=void 0,z.texture=void 0)}function ae(){try{i.compressedTexImage2D.apply(i,arguments)}catch(z){console.error("THREE.WebGLState:",z)}}function ce(){try{i.compressedTexImage3D.apply(i,arguments)}catch(z){console.error("THREE.WebGLState:",z)}}function re(){try{i.texSubImage2D.apply(i,arguments)}catch(z){console.error("THREE.WebGLState:",z)}}function Ie(){try{i.texSubImage3D.apply(i,arguments)}catch(z){console.error("THREE.WebGLState:",z)}}function ve(){try{i.compressedTexSubImage2D.apply(i,arguments)}catch(z){console.error("THREE.WebGLState:",z)}}function Te(){try{i.compressedTexSubImage3D.apply(i,arguments)}catch(z){console.error("THREE.WebGLState:",z)}}function dt(){try{i.texStorage2D.apply(i,arguments)}catch(z){console.error("THREE.WebGLState:",z)}}function fe(){try{i.texStorage3D.apply(i,arguments)}catch(z){console.error("THREE.WebGLState:",z)}}function Re(){try{i.texImage2D.apply(i,arguments)}catch(z){console.error("THREE.WebGLState:",z)}}function Oe(){try{i.texImage3D.apply(i,arguments)}catch(z){console.error("THREE.WebGLState:",z)}}function Be(z){Pe.equals(z)===!1&&(i.scissor(z.x,z.y,z.z,z.w),Pe.copy(z))}function Ae(z){$e.equals(z)===!1&&(i.viewport(z.x,z.y,z.z,z.w),$e.copy(z))}function lt(z,_e){let j=l.get(_e);j===void 0&&(j=new WeakMap,l.set(_e,j));let oe=j.get(z);oe===void 0&&(oe=i.getUniformBlockIndex(_e,z.name),j.set(z,oe))}function ze(z,_e){let oe=l.get(_e).get(z);o.get(_e)!==oe&&(i.uniformBlockBinding(_e,oe,z.__bindingPointIndex),o.set(_e,oe))}function tt(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),c={},q=null,le={},h={},u=new WeakMap,d=[],f=null,g=!1,b=null,p=null,m=null,x=null,v=null,y=null,w=null,_=new de(0,0,0),M=0,T=!1,L=null,S=null,E=null,D=null,O=null,Pe.set(0,0,i.canvas.width,i.canvas.height),$e.set(0,0,i.canvas.width,i.canvas.height),s.reset(),r.reset(),a.reset()}return{buffers:{color:s,depth:r,stencil:a},enable:ye,disable:Se,bindFramebuffer:De,drawBuffers:Ne,useProgram:st,setBlending:U,setMaterial:fn,setFlipSided:at,setCullFace:ot,setLineWidth:ke,setPolygonOffset:_t,setScissorTest:Fe,activeTexture:k,bindTexture:A,unbindTexture:Y,compressedTexImage2D:ae,compressedTexImage3D:ce,texImage2D:Re,texImage3D:Oe,updateUBOMapping:lt,uniformBlockBinding:ze,texStorage2D:dt,texStorage3D:fe,texSubImage2D:re,texSubImage3D:Ie,compressedTexSubImage2D:ve,compressedTexSubImage3D:Te,scissor:Be,viewport:Ae,reset:tt}}function jf(i,e,t,n){let s=N1(n);switch(t){case Tp:return i*e;case Cp:return i*e;case Rp:return i*e*2;case qu:return i*e/s.components*s.byteLength;case $u:return i*e/s.components*s.byteLength;case Pp:return i*e*2/s.components*s.byteLength;case Xu:return i*e*2/s.components*s.byteLength;case Ap:return i*e*3/s.components*s.byteLength;case Hn:return i*e*4/s.components*s.byteLength;case Yu:return i*e*4/s.components*s.byteLength;case Do:case Ho:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*8;case No:case Oo:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case Ah:case Rh:return Math.max(i,16)*Math.max(e,8)/4;case Th:case Ch:return Math.max(i,8)*Math.max(e,8)/2;case Ph:case Ih:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*8;case Lh:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case kh:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case Dh:return Math.floor((i+4)/5)*Math.floor((e+3)/4)*16;case Hh:return Math.floor((i+4)/5)*Math.floor((e+4)/5)*16;case Nh:return Math.floor((i+5)/6)*Math.floor((e+4)/5)*16;case Oh:return Math.floor((i+5)/6)*Math.floor((e+5)/6)*16;case Uh:return Math.floor((i+7)/8)*Math.floor((e+4)/5)*16;case Fh:return Math.floor((i+7)/8)*Math.floor((e+5)/6)*16;case Bh:return Math.floor((i+7)/8)*Math.floor((e+7)/8)*16;case zh:return Math.floor((i+9)/10)*Math.floor((e+4)/5)*16;case Gh:return Math.floor((i+9)/10)*Math.floor((e+5)/6)*16;case Vh:return Math.floor((i+9)/10)*Math.floor((e+7)/8)*16;case Wh:return Math.floor((i+9)/10)*Math.floor((e+9)/10)*16;case qh:return Math.floor((i+11)/12)*Math.floor((e+9)/10)*16;case $h:return Math.floor((i+11)/12)*Math.floor((e+11)/12)*16;case Uo:case Xh:case Yh:return Math.ceil(i/4)*Math.ceil(e/4)*16;case Ip:case Kh:return Math.ceil(i/4)*Math.ceil(e/4)*8;case Zh:case Jh:return Math.ceil(i/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function N1(i){switch(i){case _i:case _p:return{byteLength:1,components:1};case ga:case wp:case Xn:return{byteLength:2,components:1};case Vu:case Wu:return{byteLength:2,components:4};case As:case Gu:case Vn:return{byteLength:4,components:1};case Ep:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${i}.`)}function O1(i,e,t,n,s,r,a){let o=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new ue,h=new WeakMap,u,d=new WeakMap,f=!1;try{f=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function g(k,A){return f?new OffscreenCanvas(k,A):qo("canvas")}function b(k,A,Y){let ae=1,ce=Fe(k);if((ce.width>Y||ce.height>Y)&&(ae=Y/Math.max(ce.width,ce.height)),ae<1)if(typeof HTMLImageElement<"u"&&k instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&k instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&k instanceof ImageBitmap||typeof VideoFrame<"u"&&k instanceof VideoFrame){let re=Math.floor(ae*ce.width),Ie=Math.floor(ae*ce.height);u===void 0&&(u=g(re,Ie));let ve=A?g(re,Ie):u;return ve.width=re,ve.height=Ie,ve.getContext("2d").drawImage(k,0,0,re,Ie),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+ce.width+"x"+ce.height+") to ("+re+"x"+Ie+")."),ve}else return"data"in k&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+ce.width+"x"+ce.height+")."),k;return k}function p(k){return k.generateMipmaps&&k.minFilter!==xn&&k.minFilter!==An}function m(k){i.generateMipmap(k)}function x(k,A,Y,ae,ce=!1){if(k!==null){if(i[k]!==void 0)return i[k];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+k+"'")}let re=A;if(A===i.RED&&(Y===i.FLOAT&&(re=i.R32F),Y===i.HALF_FLOAT&&(re=i.R16F),Y===i.UNSIGNED_BYTE&&(re=i.R8)),A===i.RED_INTEGER&&(Y===i.UNSIGNED_BYTE&&(re=i.R8UI),Y===i.UNSIGNED_SHORT&&(re=i.R16UI),Y===i.UNSIGNED_INT&&(re=i.R32UI),Y===i.BYTE&&(re=i.R8I),Y===i.SHORT&&(re=i.R16I),Y===i.INT&&(re=i.R32I)),A===i.RG&&(Y===i.FLOAT&&(re=i.RG32F),Y===i.HALF_FLOAT&&(re=i.RG16F),Y===i.UNSIGNED_BYTE&&(re=i.RG8)),A===i.RG_INTEGER&&(Y===i.UNSIGNED_BYTE&&(re=i.RG8UI),Y===i.UNSIGNED_SHORT&&(re=i.RG16UI),Y===i.UNSIGNED_INT&&(re=i.RG32UI),Y===i.BYTE&&(re=i.RG8I),Y===i.SHORT&&(re=i.RG16I),Y===i.INT&&(re=i.RG32I)),A===i.RGB_INTEGER&&(Y===i.UNSIGNED_BYTE&&(re=i.RGB8UI),Y===i.UNSIGNED_SHORT&&(re=i.RGB16UI),Y===i.UNSIGNED_INT&&(re=i.RGB32UI),Y===i.BYTE&&(re=i.RGB8I),Y===i.SHORT&&(re=i.RGB16I),Y===i.INT&&(re=i.RGB32I)),A===i.RGBA_INTEGER&&(Y===i.UNSIGNED_BYTE&&(re=i.RGBA8UI),Y===i.UNSIGNED_SHORT&&(re=i.RGBA16UI),Y===i.UNSIGNED_INT&&(re=i.RGBA32UI),Y===i.BYTE&&(re=i.RGBA8I),Y===i.SHORT&&(re=i.RGBA16I),Y===i.INT&&(re=i.RGBA32I)),A===i.RGB&&Y===i.UNSIGNED_INT_5_9_9_9_REV&&(re=i.RGB9_E5),A===i.RGBA){let Ie=ce?zo:bt.getTransfer(ae);Y===i.FLOAT&&(re=i.RGBA32F),Y===i.HALF_FLOAT&&(re=i.RGBA16F),Y===i.UNSIGNED_BYTE&&(re=Ie===Pt?i.SRGB8_ALPHA8:i.RGBA8),Y===i.UNSIGNED_SHORT_4_4_4_4&&(re=i.RGBA4),Y===i.UNSIGNED_SHORT_5_5_5_1&&(re=i.RGB5_A1)}return(re===i.R16F||re===i.R32F||re===i.RG16F||re===i.RG32F||re===i.RGBA16F||re===i.RGBA32F)&&e.get("EXT_color_buffer_float"),re}function v(k,A){let Y;return k?A===null||A===As||A===Er?Y=i.DEPTH24_STENCIL8:A===Vn?Y=i.DEPTH32F_STENCIL8:A===ga&&(Y=i.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):A===null||A===As||A===Er?Y=i.DEPTH_COMPONENT24:A===Vn?Y=i.DEPTH_COMPONENT32F:A===ga&&(Y=i.DEPTH_COMPONENT16),Y}function y(k,A){return p(k)===!0||k.isFramebufferTexture&&k.minFilter!==xn&&k.minFilter!==An?Math.log2(Math.max(A.width,A.height))+1:k.mipmaps!==void 0&&k.mipmaps.length>0?k.mipmaps.length:k.isCompressedTexture&&Array.isArray(k.image)?A.mipmaps.length:1}function w(k){let A=k.target;A.removeEventListener("dispose",w),M(A),A.isVideoTexture&&h.delete(A)}function _(k){let A=k.target;A.removeEventListener("dispose",_),L(A)}function M(k){let A=n.get(k);if(A.__webglInit===void 0)return;let Y=k.source,ae=d.get(Y);if(ae){let ce=ae[A.__cacheKey];ce.usedTimes--,ce.usedTimes===0&&T(k),Object.keys(ae).length===0&&d.delete(Y)}n.remove(k)}function T(k){let A=n.get(k);i.deleteTexture(A.__webglTexture);let Y=k.source,ae=d.get(Y);delete ae[A.__cacheKey],a.memory.textures--}function L(k){let A=n.get(k);if(k.depthTexture&&k.depthTexture.dispose(),k.isWebGLCubeRenderTarget)for(let ae=0;ae<6;ae++){if(Array.isArray(A.__webglFramebuffer[ae]))for(let ce=0;ce<A.__webglFramebuffer[ae].length;ce++)i.deleteFramebuffer(A.__webglFramebuffer[ae][ce]);else i.deleteFramebuffer(A.__webglFramebuffer[ae]);A.__webglDepthbuffer&&i.deleteRenderbuffer(A.__webglDepthbuffer[ae])}else{if(Array.isArray(A.__webglFramebuffer))for(let ae=0;ae<A.__webglFramebuffer.length;ae++)i.deleteFramebuffer(A.__webglFramebuffer[ae]);else i.deleteFramebuffer(A.__webglFramebuffer);if(A.__webglDepthbuffer&&i.deleteRenderbuffer(A.__webglDepthbuffer),A.__webglMultisampledFramebuffer&&i.deleteFramebuffer(A.__webglMultisampledFramebuffer),A.__webglColorRenderbuffer)for(let ae=0;ae<A.__webglColorRenderbuffer.length;ae++)A.__webglColorRenderbuffer[ae]&&i.deleteRenderbuffer(A.__webglColorRenderbuffer[ae]);A.__webglDepthRenderbuffer&&i.deleteRenderbuffer(A.__webglDepthRenderbuffer)}let Y=k.textures;for(let ae=0,ce=Y.length;ae<ce;ae++){let re=n.get(Y[ae]);re.__webglTexture&&(i.deleteTexture(re.__webglTexture),a.memory.textures--),n.remove(Y[ae])}n.remove(k)}let S=0;function E(){S=0}function D(){let k=S;return k>=s.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+k+" texture units while this GPU supports only "+s.maxTextures),S+=1,k}function O(k){let A=[];return A.push(k.wrapS),A.push(k.wrapT),A.push(k.wrapR||0),A.push(k.magFilter),A.push(k.minFilter),A.push(k.anisotropy),A.push(k.internalFormat),A.push(k.format),A.push(k.type),A.push(k.generateMipmaps),A.push(k.premultiplyAlpha),A.push(k.flipY),A.push(k.unpackAlignment),A.push(k.colorSpace),A.join()}function F(k,A){let Y=n.get(k);if(k.isVideoTexture&&ke(k),k.isRenderTargetTexture===!1&&k.version>0&&Y.__version!==k.version){let ae=k.image;if(ae===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(ae.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{$e(Y,k,A);return}}t.bindTexture(i.TEXTURE_2D,Y.__webglTexture,i.TEXTURE0+A)}function W(k,A){let Y=n.get(k);if(k.version>0&&Y.__version!==k.version){$e(Y,k,A);return}t.bindTexture(i.TEXTURE_2D_ARRAY,Y.__webglTexture,i.TEXTURE0+A)}function B(k,A){let Y=n.get(k);if(k.version>0&&Y.__version!==k.version){$e(Y,k,A);return}t.bindTexture(i.TEXTURE_3D,Y.__webglTexture,i.TEXTURE0+A)}function ee(k,A){let Y=n.get(k);if(k.version>0&&Y.__version!==k.version){$(Y,k,A);return}t.bindTexture(i.TEXTURE_CUBE_MAP,Y.__webglTexture,i.TEXTURE0+A)}let q={[ai]:i.REPEAT,[Es]:i.CLAMP_TO_EDGE,[Eh]:i.MIRRORED_REPEAT},le={[xn]:i.NEAREST,[Ng]:i.NEAREST_MIPMAP_NEAREST,[to]:i.NEAREST_MIPMAP_LINEAR,[An]:i.LINEAR,[Rc]:i.LINEAR_MIPMAP_NEAREST,[Ts]:i.LINEAR_MIPMAP_LINEAR},X={[Bg]:i.NEVER,[$g]:i.ALWAYS,[zg]:i.LESS,[kp]:i.LEQUAL,[Gg]:i.EQUAL,[qg]:i.GEQUAL,[Vg]:i.GREATER,[Wg]:i.NOTEQUAL};function te(k,A){if(A.type===Vn&&e.has("OES_texture_float_linear")===!1&&(A.magFilter===An||A.magFilter===Rc||A.magFilter===to||A.magFilter===Ts||A.minFilter===An||A.minFilter===Rc||A.minFilter===to||A.minFilter===Ts)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),i.texParameteri(k,i.TEXTURE_WRAP_S,q[A.wrapS]),i.texParameteri(k,i.TEXTURE_WRAP_T,q[A.wrapT]),(k===i.TEXTURE_3D||k===i.TEXTURE_2D_ARRAY)&&i.texParameteri(k,i.TEXTURE_WRAP_R,q[A.wrapR]),i.texParameteri(k,i.TEXTURE_MAG_FILTER,le[A.magFilter]),i.texParameteri(k,i.TEXTURE_MIN_FILTER,le[A.minFilter]),A.compareFunction&&(i.texParameteri(k,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(k,i.TEXTURE_COMPARE_FUNC,X[A.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(A.magFilter===xn||A.minFilter!==to&&A.minFilter!==Ts||A.type===Vn&&e.has("OES_texture_float_linear")===!1)return;if(A.anisotropy>1||n.get(A).__currentAnisotropy){let Y=e.get("EXT_texture_filter_anisotropic");i.texParameterf(k,Y.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(A.anisotropy,s.getMaxAnisotropy())),n.get(A).__currentAnisotropy=A.anisotropy}}}function Pe(k,A){let Y=!1;k.__webglInit===void 0&&(k.__webglInit=!0,A.addEventListener("dispose",w));let ae=A.source,ce=d.get(ae);ce===void 0&&(ce={},d.set(ae,ce));let re=O(A);if(re!==k.__cacheKey){ce[re]===void 0&&(ce[re]={texture:i.createTexture(),usedTimes:0},a.memory.textures++,Y=!0),ce[re].usedTimes++;let Ie=ce[k.__cacheKey];Ie!==void 0&&(ce[k.__cacheKey].usedTimes--,Ie.usedTimes===0&&T(A)),k.__cacheKey=re,k.__webglTexture=ce[re].texture}return Y}function $e(k,A,Y){let ae=i.TEXTURE_2D;(A.isDataArrayTexture||A.isCompressedArrayTexture)&&(ae=i.TEXTURE_2D_ARRAY),A.isData3DTexture&&(ae=i.TEXTURE_3D);let ce=Pe(k,A),re=A.source;t.bindTexture(ae,k.__webglTexture,i.TEXTURE0+Y);let Ie=n.get(re);if(re.version!==Ie.__version||ce===!0){t.activeTexture(i.TEXTURE0+Y);let ve=bt.getPrimaries(bt.workingColorSpace),Te=A.colorSpace===Ki?null:bt.getPrimaries(A.colorSpace),dt=A.colorSpace===Ki||ve===Te?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,A.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,A.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,A.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,dt);let fe=b(A.image,!1,s.maxTextureSize);fe=_t(A,fe);let Re=r.convert(A.format,A.colorSpace),Oe=r.convert(A.type),Be=x(A.internalFormat,Re,Oe,A.colorSpace,A.isVideoTexture);te(ae,A);let Ae,lt=A.mipmaps,ze=A.isVideoTexture!==!0,tt=Ie.__version===void 0||ce===!0,z=re.dataReady,_e=y(A,fe);if(A.isDepthTexture)Be=v(A.format===Tr,A.type),tt&&(ze?t.texStorage2D(i.TEXTURE_2D,1,Be,fe.width,fe.height):t.texImage2D(i.TEXTURE_2D,0,Be,fe.width,fe.height,0,Re,Oe,null));else if(A.isDataTexture)if(lt.length>0){ze&&tt&&t.texStorage2D(i.TEXTURE_2D,_e,Be,lt[0].width,lt[0].height);for(let j=0,oe=lt.length;j<oe;j++)Ae=lt[j],ze?z&&t.texSubImage2D(i.TEXTURE_2D,j,0,0,Ae.width,Ae.height,Re,Oe,Ae.data):t.texImage2D(i.TEXTURE_2D,j,Be,Ae.width,Ae.height,0,Re,Oe,Ae.data);A.generateMipmaps=!1}else ze?(tt&&t.texStorage2D(i.TEXTURE_2D,_e,Be,fe.width,fe.height),z&&t.texSubImage2D(i.TEXTURE_2D,0,0,0,fe.width,fe.height,Re,Oe,fe.data)):t.texImage2D(i.TEXTURE_2D,0,Be,fe.width,fe.height,0,Re,Oe,fe.data);else if(A.isCompressedTexture)if(A.isCompressedArrayTexture){ze&&tt&&t.texStorage3D(i.TEXTURE_2D_ARRAY,_e,Be,lt[0].width,lt[0].height,fe.depth);for(let j=0,oe=lt.length;j<oe;j++)if(Ae=lt[j],A.format!==Hn)if(Re!==null)if(ze){if(z)if(A.layerUpdates.size>0){let Me=jf(Ae.width,Ae.height,A.format,A.type);for(let we of A.layerUpdates){let ct=Ae.data.subarray(we*Me/Ae.data.BYTES_PER_ELEMENT,(we+1)*Me/Ae.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,j,0,0,we,Ae.width,Ae.height,1,Re,ct,0,0)}A.clearLayerUpdates()}else t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,j,0,0,0,Ae.width,Ae.height,fe.depth,Re,Ae.data,0,0)}else t.compressedTexImage3D(i.TEXTURE_2D_ARRAY,j,Be,Ae.width,Ae.height,fe.depth,0,Ae.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else ze?z&&t.texSubImage3D(i.TEXTURE_2D_ARRAY,j,0,0,0,Ae.width,Ae.height,fe.depth,Re,Oe,Ae.data):t.texImage3D(i.TEXTURE_2D_ARRAY,j,Be,Ae.width,Ae.height,fe.depth,0,Re,Oe,Ae.data)}else{ze&&tt&&t.texStorage2D(i.TEXTURE_2D,_e,Be,lt[0].width,lt[0].height);for(let j=0,oe=lt.length;j<oe;j++)Ae=lt[j],A.format!==Hn?Re!==null?ze?z&&t.compressedTexSubImage2D(i.TEXTURE_2D,j,0,0,Ae.width,Ae.height,Re,Ae.data):t.compressedTexImage2D(i.TEXTURE_2D,j,Be,Ae.width,Ae.height,0,Ae.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):ze?z&&t.texSubImage2D(i.TEXTURE_2D,j,0,0,Ae.width,Ae.height,Re,Oe,Ae.data):t.texImage2D(i.TEXTURE_2D,j,Be,Ae.width,Ae.height,0,Re,Oe,Ae.data)}else if(A.isDataArrayTexture)if(ze){if(tt&&t.texStorage3D(i.TEXTURE_2D_ARRAY,_e,Be,fe.width,fe.height,fe.depth),z)if(A.layerUpdates.size>0){let j=jf(fe.width,fe.height,A.format,A.type);for(let oe of A.layerUpdates){let Me=fe.data.subarray(oe*j/fe.data.BYTES_PER_ELEMENT,(oe+1)*j/fe.data.BYTES_PER_ELEMENT);t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,oe,fe.width,fe.height,1,Re,Oe,Me)}A.clearLayerUpdates()}else t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,fe.width,fe.height,fe.depth,Re,Oe,fe.data)}else t.texImage3D(i.TEXTURE_2D_ARRAY,0,Be,fe.width,fe.height,fe.depth,0,Re,Oe,fe.data);else if(A.isData3DTexture)ze?(tt&&t.texStorage3D(i.TEXTURE_3D,_e,Be,fe.width,fe.height,fe.depth),z&&t.texSubImage3D(i.TEXTURE_3D,0,0,0,0,fe.width,fe.height,fe.depth,Re,Oe,fe.data)):t.texImage3D(i.TEXTURE_3D,0,Be,fe.width,fe.height,fe.depth,0,Re,Oe,fe.data);else if(A.isFramebufferTexture){if(tt)if(ze)t.texStorage2D(i.TEXTURE_2D,_e,Be,fe.width,fe.height);else{let j=fe.width,oe=fe.height;for(let Me=0;Me<_e;Me++)t.texImage2D(i.TEXTURE_2D,Me,Be,j,oe,0,Re,Oe,null),j>>=1,oe>>=1}}else if(lt.length>0){if(ze&&tt){let j=Fe(lt[0]);t.texStorage2D(i.TEXTURE_2D,_e,Be,j.width,j.height)}for(let j=0,oe=lt.length;j<oe;j++)Ae=lt[j],ze?z&&t.texSubImage2D(i.TEXTURE_2D,j,0,0,Re,Oe,Ae):t.texImage2D(i.TEXTURE_2D,j,Be,Re,Oe,Ae);A.generateMipmaps=!1}else if(ze){if(tt){let j=Fe(fe);t.texStorage2D(i.TEXTURE_2D,_e,Be,j.width,j.height)}z&&t.texSubImage2D(i.TEXTURE_2D,0,0,0,Re,Oe,fe)}else t.texImage2D(i.TEXTURE_2D,0,Be,Re,Oe,fe);p(A)&&m(ae),Ie.__version=re.version,A.onUpdate&&A.onUpdate(A)}k.__version=A.version}function $(k,A,Y){if(A.image.length!==6)return;let ae=Pe(k,A),ce=A.source;t.bindTexture(i.TEXTURE_CUBE_MAP,k.__webglTexture,i.TEXTURE0+Y);let re=n.get(ce);if(ce.version!==re.__version||ae===!0){t.activeTexture(i.TEXTURE0+Y);let Ie=bt.getPrimaries(bt.workingColorSpace),ve=A.colorSpace===Ki?null:bt.getPrimaries(A.colorSpace),Te=A.colorSpace===Ki||Ie===ve?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,A.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,A.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,A.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,Te);let dt=A.isCompressedTexture||A.image[0].isCompressedTexture,fe=A.image[0]&&A.image[0].isDataTexture,Re=[];for(let oe=0;oe<6;oe++)!dt&&!fe?Re[oe]=b(A.image[oe],!0,s.maxCubemapSize):Re[oe]=fe?A.image[oe].image:A.image[oe],Re[oe]=_t(A,Re[oe]);let Oe=Re[0],Be=r.convert(A.format,A.colorSpace),Ae=r.convert(A.type),lt=x(A.internalFormat,Be,Ae,A.colorSpace),ze=A.isVideoTexture!==!0,tt=re.__version===void 0||ae===!0,z=ce.dataReady,_e=y(A,Oe);te(i.TEXTURE_CUBE_MAP,A);let j;if(dt){ze&&tt&&t.texStorage2D(i.TEXTURE_CUBE_MAP,_e,lt,Oe.width,Oe.height);for(let oe=0;oe<6;oe++){j=Re[oe].mipmaps;for(let Me=0;Me<j.length;Me++){let we=j[Me];A.format!==Hn?Be!==null?ze?z&&t.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+oe,Me,0,0,we.width,we.height,Be,we.data):t.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+oe,Me,lt,we.width,we.height,0,we.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):ze?z&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+oe,Me,0,0,we.width,we.height,Be,Ae,we.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+oe,Me,lt,we.width,we.height,0,Be,Ae,we.data)}}}else{if(j=A.mipmaps,ze&&tt){j.length>0&&_e++;let oe=Fe(Re[0]);t.texStorage2D(i.TEXTURE_CUBE_MAP,_e,lt,oe.width,oe.height)}for(let oe=0;oe<6;oe++)if(fe){ze?z&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+oe,0,0,0,Re[oe].width,Re[oe].height,Be,Ae,Re[oe].data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+oe,0,lt,Re[oe].width,Re[oe].height,0,Be,Ae,Re[oe].data);for(let Me=0;Me<j.length;Me++){let ct=j[Me].image[oe].image;ze?z&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+oe,Me+1,0,0,ct.width,ct.height,Be,Ae,ct.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+oe,Me+1,lt,ct.width,ct.height,0,Be,Ae,ct.data)}}else{ze?z&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+oe,0,0,0,Be,Ae,Re[oe]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+oe,0,lt,Be,Ae,Re[oe]);for(let Me=0;Me<j.length;Me++){let we=j[Me];ze?z&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+oe,Me+1,0,0,Be,Ae,we.image[oe]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+oe,Me+1,lt,Be,Ae,we.image[oe])}}}p(A)&&m(i.TEXTURE_CUBE_MAP),re.__version=ce.version,A.onUpdate&&A.onUpdate(A)}k.__version=A.version}function se(k,A,Y,ae,ce,re){let Ie=r.convert(Y.format,Y.colorSpace),ve=r.convert(Y.type),Te=x(Y.internalFormat,Ie,ve,Y.colorSpace);if(!n.get(A).__hasExternalTextures){let fe=Math.max(1,A.width>>re),Re=Math.max(1,A.height>>re);ce===i.TEXTURE_3D||ce===i.TEXTURE_2D_ARRAY?t.texImage3D(ce,re,Te,fe,Re,A.depth,0,Ie,ve,null):t.texImage2D(ce,re,Te,fe,Re,0,Ie,ve,null)}t.bindFramebuffer(i.FRAMEBUFFER,k),ot(A)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,ae,ce,n.get(Y).__webglTexture,0,at(A)):(ce===i.TEXTURE_2D||ce>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&ce<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,ae,ce,n.get(Y).__webglTexture,re),t.bindFramebuffer(i.FRAMEBUFFER,null)}function ye(k,A,Y){if(i.bindRenderbuffer(i.RENDERBUFFER,k),A.depthBuffer){let ae=A.depthTexture,ce=ae&&ae.isDepthTexture?ae.type:null,re=v(A.stencilBuffer,ce),Ie=A.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,ve=at(A);ot(A)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,ve,re,A.width,A.height):Y?i.renderbufferStorageMultisample(i.RENDERBUFFER,ve,re,A.width,A.height):i.renderbufferStorage(i.RENDERBUFFER,re,A.width,A.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,Ie,i.RENDERBUFFER,k)}else{let ae=A.textures;for(let ce=0;ce<ae.length;ce++){let re=ae[ce],Ie=r.convert(re.format,re.colorSpace),ve=r.convert(re.type),Te=x(re.internalFormat,Ie,ve,re.colorSpace),dt=at(A);Y&&ot(A)===!1?i.renderbufferStorageMultisample(i.RENDERBUFFER,dt,Te,A.width,A.height):ot(A)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,dt,Te,A.width,A.height):i.renderbufferStorage(i.RENDERBUFFER,Te,A.width,A.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function Se(k,A){if(A&&A.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(t.bindFramebuffer(i.FRAMEBUFFER,k),!(A.depthTexture&&A.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");(!n.get(A.depthTexture).__webglTexture||A.depthTexture.image.width!==A.width||A.depthTexture.image.height!==A.height)&&(A.depthTexture.image.width=A.width,A.depthTexture.image.height=A.height,A.depthTexture.needsUpdate=!0),F(A.depthTexture,0);let ae=n.get(A.depthTexture).__webglTexture,ce=at(A);if(A.depthTexture.format===br)ot(A)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,ae,0,ce):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,ae,0);else if(A.depthTexture.format===Tr)ot(A)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,ae,0,ce):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,ae,0);else throw new Error("Unknown depthTexture format")}function De(k){let A=n.get(k),Y=k.isWebGLCubeRenderTarget===!0;if(A.__boundDepthTexture!==k.depthTexture){let ae=k.depthTexture;if(A.__depthDisposeCallback&&A.__depthDisposeCallback(),ae){let ce=()=>{delete A.__boundDepthTexture,delete A.__depthDisposeCallback,ae.removeEventListener("dispose",ce)};ae.addEventListener("dispose",ce),A.__depthDisposeCallback=ce}A.__boundDepthTexture=ae}if(k.depthTexture&&!A.__autoAllocateDepthBuffer){if(Y)throw new Error("target.depthTexture not supported in Cube render targets");Se(A.__webglFramebuffer,k)}else if(Y){A.__webglDepthbuffer=[];for(let ae=0;ae<6;ae++)if(t.bindFramebuffer(i.FRAMEBUFFER,A.__webglFramebuffer[ae]),A.__webglDepthbuffer[ae]===void 0)A.__webglDepthbuffer[ae]=i.createRenderbuffer(),ye(A.__webglDepthbuffer[ae],k,!1);else{let ce=k.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,re=A.__webglDepthbuffer[ae];i.bindRenderbuffer(i.RENDERBUFFER,re),i.framebufferRenderbuffer(i.FRAMEBUFFER,ce,i.RENDERBUFFER,re)}}else if(t.bindFramebuffer(i.FRAMEBUFFER,A.__webglFramebuffer),A.__webglDepthbuffer===void 0)A.__webglDepthbuffer=i.createRenderbuffer(),ye(A.__webglDepthbuffer,k,!1);else{let ae=k.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,ce=A.__webglDepthbuffer;i.bindRenderbuffer(i.RENDERBUFFER,ce),i.framebufferRenderbuffer(i.FRAMEBUFFER,ae,i.RENDERBUFFER,ce)}t.bindFramebuffer(i.FRAMEBUFFER,null)}function Ne(k,A,Y){let ae=n.get(k);A!==void 0&&se(ae.__webglFramebuffer,k,k.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),Y!==void 0&&De(k)}function st(k){let A=k.texture,Y=n.get(k),ae=n.get(A);k.addEventListener("dispose",_);let ce=k.textures,re=k.isWebGLCubeRenderTarget===!0,Ie=ce.length>1;if(Ie||(ae.__webglTexture===void 0&&(ae.__webglTexture=i.createTexture()),ae.__version=A.version,a.memory.textures++),re){Y.__webglFramebuffer=[];for(let ve=0;ve<6;ve++)if(A.mipmaps&&A.mipmaps.length>0){Y.__webglFramebuffer[ve]=[];for(let Te=0;Te<A.mipmaps.length;Te++)Y.__webglFramebuffer[ve][Te]=i.createFramebuffer()}else Y.__webglFramebuffer[ve]=i.createFramebuffer()}else{if(A.mipmaps&&A.mipmaps.length>0){Y.__webglFramebuffer=[];for(let ve=0;ve<A.mipmaps.length;ve++)Y.__webglFramebuffer[ve]=i.createFramebuffer()}else Y.__webglFramebuffer=i.createFramebuffer();if(Ie)for(let ve=0,Te=ce.length;ve<Te;ve++){let dt=n.get(ce[ve]);dt.__webglTexture===void 0&&(dt.__webglTexture=i.createTexture(),a.memory.textures++)}if(k.samples>0&&ot(k)===!1){Y.__webglMultisampledFramebuffer=i.createFramebuffer(),Y.__webglColorRenderbuffer=[],t.bindFramebuffer(i.FRAMEBUFFER,Y.__webglMultisampledFramebuffer);for(let ve=0;ve<ce.length;ve++){let Te=ce[ve];Y.__webglColorRenderbuffer[ve]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,Y.__webglColorRenderbuffer[ve]);let dt=r.convert(Te.format,Te.colorSpace),fe=r.convert(Te.type),Re=x(Te.internalFormat,dt,fe,Te.colorSpace,k.isXRRenderTarget===!0),Oe=at(k);i.renderbufferStorageMultisample(i.RENDERBUFFER,Oe,Re,k.width,k.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+ve,i.RENDERBUFFER,Y.__webglColorRenderbuffer[ve])}i.bindRenderbuffer(i.RENDERBUFFER,null),k.depthBuffer&&(Y.__webglDepthRenderbuffer=i.createRenderbuffer(),ye(Y.__webglDepthRenderbuffer,k,!0)),t.bindFramebuffer(i.FRAMEBUFFER,null)}}if(re){t.bindTexture(i.TEXTURE_CUBE_MAP,ae.__webglTexture),te(i.TEXTURE_CUBE_MAP,A);for(let ve=0;ve<6;ve++)if(A.mipmaps&&A.mipmaps.length>0)for(let Te=0;Te<A.mipmaps.length;Te++)se(Y.__webglFramebuffer[ve][Te],k,A,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+ve,Te);else se(Y.__webglFramebuffer[ve],k,A,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+ve,0);p(A)&&m(i.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(Ie){for(let ve=0,Te=ce.length;ve<Te;ve++){let dt=ce[ve],fe=n.get(dt);t.bindTexture(i.TEXTURE_2D,fe.__webglTexture),te(i.TEXTURE_2D,dt),se(Y.__webglFramebuffer,k,dt,i.COLOR_ATTACHMENT0+ve,i.TEXTURE_2D,0),p(dt)&&m(i.TEXTURE_2D)}t.unbindTexture()}else{let ve=i.TEXTURE_2D;if((k.isWebGL3DRenderTarget||k.isWebGLArrayRenderTarget)&&(ve=k.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),t.bindTexture(ve,ae.__webglTexture),te(ve,A),A.mipmaps&&A.mipmaps.length>0)for(let Te=0;Te<A.mipmaps.length;Te++)se(Y.__webglFramebuffer[Te],k,A,i.COLOR_ATTACHMENT0,ve,Te);else se(Y.__webglFramebuffer,k,A,i.COLOR_ATTACHMENT0,ve,0);p(A)&&m(ve),t.unbindTexture()}k.depthBuffer&&De(k)}function rt(k){let A=k.textures;for(let Y=0,ae=A.length;Y<ae;Y++){let ce=A[Y];if(p(ce)){let re=k.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:i.TEXTURE_2D,Ie=n.get(ce).__webglTexture;t.bindTexture(re,Ie),m(re),t.unbindTexture()}}}let ut=[],U=[];function fn(k){if(k.samples>0){if(ot(k)===!1){let A=k.textures,Y=k.width,ae=k.height,ce=i.COLOR_BUFFER_BIT,re=k.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,Ie=n.get(k),ve=A.length>1;if(ve)for(let Te=0;Te<A.length;Te++)t.bindFramebuffer(i.FRAMEBUFFER,Ie.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+Te,i.RENDERBUFFER,null),t.bindFramebuffer(i.FRAMEBUFFER,Ie.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+Te,i.TEXTURE_2D,null,0);t.bindFramebuffer(i.READ_FRAMEBUFFER,Ie.__webglMultisampledFramebuffer),t.bindFramebuffer(i.DRAW_FRAMEBUFFER,Ie.__webglFramebuffer);for(let Te=0;Te<A.length;Te++){if(k.resolveDepthBuffer&&(k.depthBuffer&&(ce|=i.DEPTH_BUFFER_BIT),k.stencilBuffer&&k.resolveStencilBuffer&&(ce|=i.STENCIL_BUFFER_BIT)),ve){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,Ie.__webglColorRenderbuffer[Te]);let dt=n.get(A[Te]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,dt,0)}i.blitFramebuffer(0,0,Y,ae,0,0,Y,ae,ce,i.NEAREST),l===!0&&(ut.length=0,U.length=0,ut.push(i.COLOR_ATTACHMENT0+Te),k.depthBuffer&&k.resolveDepthBuffer===!1&&(ut.push(re),U.push(re),i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,U)),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,ut))}if(t.bindFramebuffer(i.READ_FRAMEBUFFER,null),t.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),ve)for(let Te=0;Te<A.length;Te++){t.bindFramebuffer(i.FRAMEBUFFER,Ie.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+Te,i.RENDERBUFFER,Ie.__webglColorRenderbuffer[Te]);let dt=n.get(A[Te]).__webglTexture;t.bindFramebuffer(i.FRAMEBUFFER,Ie.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+Te,i.TEXTURE_2D,dt,0)}t.bindFramebuffer(i.DRAW_FRAMEBUFFER,Ie.__webglMultisampledFramebuffer)}else if(k.depthBuffer&&k.resolveDepthBuffer===!1&&l){let A=k.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[A])}}}function at(k){return Math.min(s.maxSamples,k.samples)}function ot(k){let A=n.get(k);return k.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&A.__useRenderToTexture!==!1}function ke(k){let A=a.render.frame;h.get(k)!==A&&(h.set(k,A),k.update())}function _t(k,A){let Y=k.colorSpace,ae=k.format,ce=k.type;return k.isCompressedTexture===!0||k.isVideoTexture===!0||Y!==ts&&Y!==Ki&&(bt.getTransfer(Y)===Pt?(ae!==Hn||ce!==_i)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",Y)),A}function Fe(k){return typeof HTMLImageElement<"u"&&k instanceof HTMLImageElement?(c.width=k.naturalWidth||k.width,c.height=k.naturalHeight||k.height):typeof VideoFrame<"u"&&k instanceof VideoFrame?(c.width=k.displayWidth,c.height=k.displayHeight):(c.width=k.width,c.height=k.height),c}this.allocateTextureUnit=D,this.resetTextureUnits=E,this.setTexture2D=F,this.setTexture2DArray=W,this.setTexture3D=B,this.setTextureCube=ee,this.rebindTextures=Ne,this.setupRenderTarget=st,this.updateRenderTargetMipmap=rt,this.updateMultisampleRenderTarget=fn,this.setupDepthRenderbuffer=De,this.setupFrameBufferTexture=se,this.useMultisampledRTT=ot}function U1(i,e){function t(n,s=Ki){let r,a=bt.getTransfer(s);if(n===_i)return i.UNSIGNED_BYTE;if(n===Vu)return i.UNSIGNED_SHORT_4_4_4_4;if(n===Wu)return i.UNSIGNED_SHORT_5_5_5_1;if(n===Ep)return i.UNSIGNED_INT_5_9_9_9_REV;if(n===_p)return i.BYTE;if(n===wp)return i.SHORT;if(n===ga)return i.UNSIGNED_SHORT;if(n===Gu)return i.INT;if(n===As)return i.UNSIGNED_INT;if(n===Vn)return i.FLOAT;if(n===Xn)return i.HALF_FLOAT;if(n===Tp)return i.ALPHA;if(n===Ap)return i.RGB;if(n===Hn)return i.RGBA;if(n===Cp)return i.LUMINANCE;if(n===Rp)return i.LUMINANCE_ALPHA;if(n===br)return i.DEPTH_COMPONENT;if(n===Tr)return i.DEPTH_STENCIL;if(n===qu)return i.RED;if(n===$u)return i.RED_INTEGER;if(n===Pp)return i.RG;if(n===Xu)return i.RG_INTEGER;if(n===Yu)return i.RGBA_INTEGER;if(n===Do||n===Ho||n===No||n===Oo)if(a===Pt)if(r=e.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(n===Do)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===Ho)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===No)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===Oo)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=e.get("WEBGL_compressed_texture_s3tc"),r!==null){if(n===Do)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===Ho)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===No)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===Oo)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===Th||n===Ah||n===Ch||n===Rh)if(r=e.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(n===Th)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===Ah)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===Ch)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===Rh)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===Ph||n===Ih||n===Lh)if(r=e.get("WEBGL_compressed_texture_etc"),r!==null){if(n===Ph||n===Ih)return a===Pt?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(n===Lh)return a===Pt?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(n===kh||n===Dh||n===Hh||n===Nh||n===Oh||n===Uh||n===Fh||n===Bh||n===zh||n===Gh||n===Vh||n===Wh||n===qh||n===$h)if(r=e.get("WEBGL_compressed_texture_astc"),r!==null){if(n===kh)return a===Pt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===Dh)return a===Pt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===Hh)return a===Pt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===Nh)return a===Pt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===Oh)return a===Pt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===Uh)return a===Pt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===Fh)return a===Pt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===Bh)return a===Pt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===zh)return a===Pt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===Gh)return a===Pt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===Vh)return a===Pt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===Wh)return a===Pt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===qh)return a===Pt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===$h)return a===Pt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===Uo||n===Xh||n===Yh)if(r=e.get("EXT_texture_compression_bptc"),r!==null){if(n===Uo)return a===Pt?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===Xh)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===Yh)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===Ip||n===Kh||n===Zh||n===Jh)if(r=e.get("EXT_texture_compression_rgtc"),r!==null){if(n===Uo)return r.COMPRESSED_RED_RGTC1_EXT;if(n===Kh)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===Zh)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===Jh)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===Er?i.UNSIGNED_INT_24_8:i[n]!==void 0?i[n]:null}return{convert:t}}var fu=class extends cn{constructor(e=[]){super(),this.isArrayCamera=!0,this.cameras=e}},xt=class extends gt{constructor(){super(),this.isGroup=!0,this.type="Group"}},F1={type:"move"},da=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new xt,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new xt,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new N,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new N),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new xt,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new N,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new N),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let s=null,r=null,a=null,o=this._targetRay,l=this._grip,c=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(c&&e.hand){a=!0;for(let b of e.hand.values()){let p=t.getJointPose(b,n),m=this._getHandJoint(c,b);p!==null&&(m.matrix.fromArray(p.transform.matrix),m.matrix.decompose(m.position,m.rotation,m.scale),m.matrixWorldNeedsUpdate=!0,m.jointRadius=p.radius),m.visible=p!==null}let h=c.joints["index-finger-tip"],u=c.joints["thumb-tip"],d=h.position.distanceTo(u.position),f=.02,g=.005;c.inputState.pinching&&d>f+g?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!c.inputState.pinching&&d<=f-g&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else l!==null&&e.gripSpace&&(r=t.getPose(e.gripSpace,n),r!==null&&(l.matrix.fromArray(r.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,r.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(r.linearVelocity)):l.hasLinearVelocity=!1,r.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(r.angularVelocity)):l.hasAngularVelocity=!1));o!==null&&(s=t.getPose(e.targetRaySpace,n),s===null&&r!==null&&(s=r),s!==null&&(o.matrix.fromArray(s.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,s.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(s.linearVelocity)):o.hasLinearVelocity=!1,s.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(s.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(F1)))}return o!==null&&(o.visible=s!==null),l!==null&&(l.visible=r!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let n=new xt;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}},B1=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,z1=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`,pu=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t,n){if(this.texture===null){let s=new Sn,r=e.properties.get(s);r.__webglTexture=t.texture,(t.depthNear!=n.depthNear||t.depthFar!=n.depthFar)&&(this.depthNear=t.depthNear,this.depthFar=t.depthFar),this.texture=s}}getMesh(e){if(this.texture!==null&&this.mesh===null){let t=e.cameras[0].viewport,n=new At({vertexShader:B1,fragmentShader:z1,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new he(new Wn(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},mu=class extends Qi{constructor(e,t){super();let n=this,s=null,r=1,a=null,o="local-floor",l=1,c=null,h=null,u=null,d=null,f=null,g=null,b=new pu,p=t.getContextAttributes(),m=null,x=null,v=[],y=[],w=new ue,_=null,M=new cn;M.layers.enable(1),M.viewport=new yt;let T=new cn;T.layers.enable(2),T.viewport=new yt;let L=[M,T],S=new fu;S.layers.enable(1),S.layers.enable(2);let E=null,D=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function($){let se=v[$];return se===void 0&&(se=new da,v[$]=se),se.getTargetRaySpace()},this.getControllerGrip=function($){let se=v[$];return se===void 0&&(se=new da,v[$]=se),se.getGripSpace()},this.getHand=function($){let se=v[$];return se===void 0&&(se=new da,v[$]=se),se.getHandSpace()};function O($){let se=y.indexOf($.inputSource);if(se===-1)return;let ye=v[se];ye!==void 0&&(ye.update($.inputSource,$.frame,c||a),ye.dispatchEvent({type:$.type,data:$.inputSource}))}function F(){s.removeEventListener("select",O),s.removeEventListener("selectstart",O),s.removeEventListener("selectend",O),s.removeEventListener("squeeze",O),s.removeEventListener("squeezestart",O),s.removeEventListener("squeezeend",O),s.removeEventListener("end",F),s.removeEventListener("inputsourceschange",W);for(let $=0;$<v.length;$++){let se=y[$];se!==null&&(y[$]=null,v[$].disconnect(se))}E=null,D=null,b.reset(),e.setRenderTarget(m),f=null,d=null,u=null,s=null,x=null,$e.stop(),n.isPresenting=!1,e.setPixelRatio(_),e.setSize(w.width,w.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function($){r=$,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function($){o=$,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function($){c=$},this.getBaseLayer=function(){return d!==null?d:f},this.getBinding=function(){return u},this.getFrame=function(){return g},this.getSession=function(){return s},this.setSession=async function($){if(s=$,s!==null){if(m=e.getRenderTarget(),s.addEventListener("select",O),s.addEventListener("selectstart",O),s.addEventListener("selectend",O),s.addEventListener("squeeze",O),s.addEventListener("squeezestart",O),s.addEventListener("squeezeend",O),s.addEventListener("end",F),s.addEventListener("inputsourceschange",W),p.xrCompatible!==!0&&await t.makeXRCompatible(),_=e.getPixelRatio(),e.getSize(w),s.renderState.layers===void 0){let se={antialias:p.antialias,alpha:!0,depth:p.depth,stencil:p.stencil,framebufferScaleFactor:r};f=new XRWebGLLayer(s,t,se),s.updateRenderState({baseLayer:f}),e.setPixelRatio(1),e.setSize(f.framebufferWidth,f.framebufferHeight,!1),x=new gn(f.framebufferWidth,f.framebufferHeight,{format:Hn,type:_i,colorSpace:e.outputColorSpace,stencilBuffer:p.stencil})}else{let se=null,ye=null,Se=null;p.depth&&(Se=p.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,se=p.stencil?Tr:br,ye=p.stencil?Er:As);let De={colorFormat:t.RGBA8,depthFormat:Se,scaleFactor:r};u=new XRWebGLBinding(s,t),d=u.createProjectionLayer(De),s.updateRenderState({layers:[d]}),e.setPixelRatio(1),e.setSize(d.textureWidth,d.textureHeight,!1),x=new gn(d.textureWidth,d.textureHeight,{format:Hn,type:_i,depthTexture:new Qo(d.textureWidth,d.textureHeight,ye,void 0,void 0,void 0,void 0,void 0,void 0,se),stencilBuffer:p.stencil,colorSpace:e.outputColorSpace,samples:p.antialias?4:0,resolveDepthBuffer:d.ignoreDepthValues===!1})}x.isXRRenderTarget=!0,this.setFoveation(l),c=null,a=await s.requestReferenceSpace(o),$e.setContext(s),$e.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return b.getDepthTexture()};function W($){for(let se=0;se<$.removed.length;se++){let ye=$.removed[se],Se=y.indexOf(ye);Se>=0&&(y[Se]=null,v[Se].disconnect(ye))}for(let se=0;se<$.added.length;se++){let ye=$.added[se],Se=y.indexOf(ye);if(Se===-1){for(let Ne=0;Ne<v.length;Ne++)if(Ne>=y.length){y.push(ye),Se=Ne;break}else if(y[Ne]===null){y[Ne]=ye,Se=Ne;break}if(Se===-1)break}let De=v[Se];De&&De.connect(ye)}}let B=new N,ee=new N;function q($,se,ye){B.setFromMatrixPosition(se.matrixWorld),ee.setFromMatrixPosition(ye.matrixWorld);let Se=B.distanceTo(ee),De=se.projectionMatrix.elements,Ne=ye.projectionMatrix.elements,st=De[14]/(De[10]-1),rt=De[14]/(De[10]+1),ut=(De[9]+1)/De[5],U=(De[9]-1)/De[5],fn=(De[8]-1)/De[0],at=(Ne[8]+1)/Ne[0],ot=st*fn,ke=st*at,_t=Se/(-fn+at),Fe=_t*-fn;if(se.matrixWorld.decompose($.position,$.quaternion,$.scale),$.translateX(Fe),$.translateZ(_t),$.matrixWorld.compose($.position,$.quaternion,$.scale),$.matrixWorldInverse.copy($.matrixWorld).invert(),De[10]===-1)$.projectionMatrix.copy(se.projectionMatrix),$.projectionMatrixInverse.copy(se.projectionMatrixInverse);else{let k=st+_t,A=rt+_t,Y=ot-Fe,ae=ke+(Se-Fe),ce=ut*rt/A*k,re=U*rt/A*k;$.projectionMatrix.makePerspective(Y,ae,ce,re,k,A),$.projectionMatrixInverse.copy($.projectionMatrix).invert()}}function le($,se){se===null?$.matrixWorld.copy($.matrix):$.matrixWorld.multiplyMatrices(se.matrixWorld,$.matrix),$.matrixWorldInverse.copy($.matrixWorld).invert()}this.updateCamera=function($){if(s===null)return;let se=$.near,ye=$.far;b.texture!==null&&(b.depthNear>0&&(se=b.depthNear),b.depthFar>0&&(ye=b.depthFar)),S.near=T.near=M.near=se,S.far=T.far=M.far=ye,(E!==S.near||D!==S.far)&&(s.updateRenderState({depthNear:S.near,depthFar:S.far}),E=S.near,D=S.far);let Se=$.parent,De=S.cameras;le(S,Se);for(let Ne=0;Ne<De.length;Ne++)le(De[Ne],Se);De.length===2?q(S,M,T):S.projectionMatrix.copy(M.projectionMatrix),X($,S,Se)};function X($,se,ye){ye===null?$.matrix.copy(se.matrixWorld):($.matrix.copy(ye.matrixWorld),$.matrix.invert(),$.matrix.multiply(se.matrixWorld)),$.matrix.decompose($.position,$.quaternion,$.scale),$.updateMatrixWorld(!0),$.projectionMatrix.copy(se.projectionMatrix),$.projectionMatrixInverse.copy(se.projectionMatrixInverse),$.isPerspectiveCamera&&($.fov=Qh*2*Math.atan(1/$.projectionMatrix.elements[5]),$.zoom=1)}this.getCamera=function(){return S},this.getFoveation=function(){if(!(d===null&&f===null))return l},this.setFoveation=function($){l=$,d!==null&&(d.fixedFoveation=$),f!==null&&f.fixedFoveation!==void 0&&(f.fixedFoveation=$)},this.hasDepthSensing=function(){return b.texture!==null},this.getDepthSensingMesh=function(){return b.getMesh(S)};let te=null;function Pe($,se){if(h=se.getViewerPose(c||a),g=se,h!==null){let ye=h.views;f!==null&&(e.setRenderTargetFramebuffer(x,f.framebuffer),e.setRenderTarget(x));let Se=!1;ye.length!==S.cameras.length&&(S.cameras.length=0,Se=!0);for(let Ne=0;Ne<ye.length;Ne++){let st=ye[Ne],rt=null;if(f!==null)rt=f.getViewport(st);else{let U=u.getViewSubImage(d,st);rt=U.viewport,Ne===0&&(e.setRenderTargetTextures(x,U.colorTexture,d.ignoreDepthValues?void 0:U.depthStencilTexture),e.setRenderTarget(x))}let ut=L[Ne];ut===void 0&&(ut=new cn,ut.layers.enable(Ne),ut.viewport=new yt,L[Ne]=ut),ut.matrix.fromArray(st.transform.matrix),ut.matrix.decompose(ut.position,ut.quaternion,ut.scale),ut.projectionMatrix.fromArray(st.projectionMatrix),ut.projectionMatrixInverse.copy(ut.projectionMatrix).invert(),ut.viewport.set(rt.x,rt.y,rt.width,rt.height),Ne===0&&(S.matrix.copy(ut.matrix),S.matrix.decompose(S.position,S.quaternion,S.scale)),Se===!0&&S.cameras.push(ut)}let De=s.enabledFeatures;if(De&&De.includes("depth-sensing")){let Ne=u.getDepthInformation(ye[0]);Ne&&Ne.isValid&&Ne.texture&&b.init(e,Ne,s.renderState)}}for(let ye=0;ye<v.length;ye++){let Se=y[ye],De=v[ye];Se!==null&&De!==void 0&&De.update(Se,se,c||a)}te&&te($,se),se.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:se}),g=null}let $e=new Op;$e.setAnimationLoop(Pe),this.setAnimationLoop=function($){te=$},this.dispose=function(){}}},Ss=new Ut,G1=new Ge;function V1(i,e){function t(p,m){p.matrixAutoUpdate===!0&&p.updateMatrix(),m.value.copy(p.matrix)}function n(p,m){m.color.getRGB(p.fogColor.value,Np(i)),m.isFog?(p.fogNear.value=m.near,p.fogFar.value=m.far):m.isFogExp2&&(p.fogDensity.value=m.density)}function s(p,m,x,v,y){m.isMeshBasicMaterial||m.isMeshLambertMaterial?r(p,m):m.isMeshToonMaterial?(r(p,m),u(p,m)):m.isMeshPhongMaterial?(r(p,m),h(p,m)):m.isMeshStandardMaterial?(r(p,m),d(p,m),m.isMeshPhysicalMaterial&&f(p,m,y)):m.isMeshMatcapMaterial?(r(p,m),g(p,m)):m.isMeshDepthMaterial?r(p,m):m.isMeshDistanceMaterial?(r(p,m),b(p,m)):m.isMeshNormalMaterial?r(p,m):m.isLineBasicMaterial?(a(p,m),m.isLineDashedMaterial&&o(p,m)):m.isPointsMaterial?l(p,m,x,v):m.isSpriteMaterial?c(p,m):m.isShadowMaterial?(p.color.value.copy(m.color),p.opacity.value=m.opacity):m.isShaderMaterial&&(m.uniformsNeedUpdate=!1)}function r(p,m){p.opacity.value=m.opacity,m.color&&p.diffuse.value.copy(m.color),m.emissive&&p.emissive.value.copy(m.emissive).multiplyScalar(m.emissiveIntensity),m.map&&(p.map.value=m.map,t(m.map,p.mapTransform)),m.alphaMap&&(p.alphaMap.value=m.alphaMap,t(m.alphaMap,p.alphaMapTransform)),m.bumpMap&&(p.bumpMap.value=m.bumpMap,t(m.bumpMap,p.bumpMapTransform),p.bumpScale.value=m.bumpScale,m.side===hn&&(p.bumpScale.value*=-1)),m.normalMap&&(p.normalMap.value=m.normalMap,t(m.normalMap,p.normalMapTransform),p.normalScale.value.copy(m.normalScale),m.side===hn&&p.normalScale.value.negate()),m.displacementMap&&(p.displacementMap.value=m.displacementMap,t(m.displacementMap,p.displacementMapTransform),p.displacementScale.value=m.displacementScale,p.displacementBias.value=m.displacementBias),m.emissiveMap&&(p.emissiveMap.value=m.emissiveMap,t(m.emissiveMap,p.emissiveMapTransform)),m.specularMap&&(p.specularMap.value=m.specularMap,t(m.specularMap,p.specularMapTransform)),m.alphaTest>0&&(p.alphaTest.value=m.alphaTest);let x=e.get(m),v=x.envMap,y=x.envMapRotation;v&&(p.envMap.value=v,Ss.copy(y),Ss.x*=-1,Ss.y*=-1,Ss.z*=-1,v.isCubeTexture&&v.isRenderTargetTexture===!1&&(Ss.y*=-1,Ss.z*=-1),p.envMapRotation.value.setFromMatrix4(G1.makeRotationFromEuler(Ss)),p.flipEnvMap.value=v.isCubeTexture&&v.isRenderTargetTexture===!1?-1:1,p.reflectivity.value=m.reflectivity,p.ior.value=m.ior,p.refractionRatio.value=m.refractionRatio),m.lightMap&&(p.lightMap.value=m.lightMap,p.lightMapIntensity.value=m.lightMapIntensity,t(m.lightMap,p.lightMapTransform)),m.aoMap&&(p.aoMap.value=m.aoMap,p.aoMapIntensity.value=m.aoMapIntensity,t(m.aoMap,p.aoMapTransform))}function a(p,m){p.diffuse.value.copy(m.color),p.opacity.value=m.opacity,m.map&&(p.map.value=m.map,t(m.map,p.mapTransform))}function o(p,m){p.dashSize.value=m.dashSize,p.totalSize.value=m.dashSize+m.gapSize,p.scale.value=m.scale}function l(p,m,x,v){p.diffuse.value.copy(m.color),p.opacity.value=m.opacity,p.size.value=m.size*x,p.scale.value=v*.5,m.map&&(p.map.value=m.map,t(m.map,p.uvTransform)),m.alphaMap&&(p.alphaMap.value=m.alphaMap,t(m.alphaMap,p.alphaMapTransform)),m.alphaTest>0&&(p.alphaTest.value=m.alphaTest)}function c(p,m){p.diffuse.value.copy(m.color),p.opacity.value=m.opacity,p.rotation.value=m.rotation,m.map&&(p.map.value=m.map,t(m.map,p.mapTransform)),m.alphaMap&&(p.alphaMap.value=m.alphaMap,t(m.alphaMap,p.alphaMapTransform)),m.alphaTest>0&&(p.alphaTest.value=m.alphaTest)}function h(p,m){p.specular.value.copy(m.specular),p.shininess.value=Math.max(m.shininess,1e-4)}function u(p,m){m.gradientMap&&(p.gradientMap.value=m.gradientMap)}function d(p,m){p.metalness.value=m.metalness,m.metalnessMap&&(p.metalnessMap.value=m.metalnessMap,t(m.metalnessMap,p.metalnessMapTransform)),p.roughness.value=m.roughness,m.roughnessMap&&(p.roughnessMap.value=m.roughnessMap,t(m.roughnessMap,p.roughnessMapTransform)),m.envMap&&(p.envMapIntensity.value=m.envMapIntensity)}function f(p,m,x){p.ior.value=m.ior,m.sheen>0&&(p.sheenColor.value.copy(m.sheenColor).multiplyScalar(m.sheen),p.sheenRoughness.value=m.sheenRoughness,m.sheenColorMap&&(p.sheenColorMap.value=m.sheenColorMap,t(m.sheenColorMap,p.sheenColorMapTransform)),m.sheenRoughnessMap&&(p.sheenRoughnessMap.value=m.sheenRoughnessMap,t(m.sheenRoughnessMap,p.sheenRoughnessMapTransform))),m.clearcoat>0&&(p.clearcoat.value=m.clearcoat,p.clearcoatRoughness.value=m.clearcoatRoughness,m.clearcoatMap&&(p.clearcoatMap.value=m.clearcoatMap,t(m.clearcoatMap,p.clearcoatMapTransform)),m.clearcoatRoughnessMap&&(p.clearcoatRoughnessMap.value=m.clearcoatRoughnessMap,t(m.clearcoatRoughnessMap,p.clearcoatRoughnessMapTransform)),m.clearcoatNormalMap&&(p.clearcoatNormalMap.value=m.clearcoatNormalMap,t(m.clearcoatNormalMap,p.clearcoatNormalMapTransform),p.clearcoatNormalScale.value.copy(m.clearcoatNormalScale),m.side===hn&&p.clearcoatNormalScale.value.negate())),m.dispersion>0&&(p.dispersion.value=m.dispersion),m.iridescence>0&&(p.iridescence.value=m.iridescence,p.iridescenceIOR.value=m.iridescenceIOR,p.iridescenceThicknessMinimum.value=m.iridescenceThicknessRange[0],p.iridescenceThicknessMaximum.value=m.iridescenceThicknessRange[1],m.iridescenceMap&&(p.iridescenceMap.value=m.iridescenceMap,t(m.iridescenceMap,p.iridescenceMapTransform)),m.iridescenceThicknessMap&&(p.iridescenceThicknessMap.value=m.iridescenceThicknessMap,t(m.iridescenceThicknessMap,p.iridescenceThicknessMapTransform))),m.transmission>0&&(p.transmission.value=m.transmission,p.transmissionSamplerMap.value=x.texture,p.transmissionSamplerSize.value.set(x.width,x.height),m.transmissionMap&&(p.transmissionMap.value=m.transmissionMap,t(m.transmissionMap,p.transmissionMapTransform)),p.thickness.value=m.thickness,m.thicknessMap&&(p.thicknessMap.value=m.thicknessMap,t(m.thicknessMap,p.thicknessMapTransform)),p.attenuationDistance.value=m.attenuationDistance,p.attenuationColor.value.copy(m.attenuationColor)),m.anisotropy>0&&(p.anisotropyVector.value.set(m.anisotropy*Math.cos(m.anisotropyRotation),m.anisotropy*Math.sin(m.anisotropyRotation)),m.anisotropyMap&&(p.anisotropyMap.value=m.anisotropyMap,t(m.anisotropyMap,p.anisotropyMapTransform))),p.specularIntensity.value=m.specularIntensity,p.specularColor.value.copy(m.specularColor),m.specularColorMap&&(p.specularColorMap.value=m.specularColorMap,t(m.specularColorMap,p.specularColorMapTransform)),m.specularIntensityMap&&(p.specularIntensityMap.value=m.specularIntensityMap,t(m.specularIntensityMap,p.specularIntensityMapTransform))}function g(p,m){m.matcap&&(p.matcap.value=m.matcap)}function b(p,m){let x=e.get(m).light;p.referencePosition.value.setFromMatrixPosition(x.matrixWorld),p.nearDistance.value=x.shadow.camera.near,p.farDistance.value=x.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:s}}function W1(i,e,t,n){let s={},r={},a=[],o=i.getParameter(i.MAX_UNIFORM_BUFFER_BINDINGS);function l(x,v){let y=v.program;n.uniformBlockBinding(x,y)}function c(x,v){let y=s[x.id];y===void 0&&(g(x),y=h(x),s[x.id]=y,x.addEventListener("dispose",p));let w=v.program;n.updateUBOMapping(x,w);let _=e.render.frame;r[x.id]!==_&&(d(x),r[x.id]=_)}function h(x){let v=u();x.__bindingPointIndex=v;let y=i.createBuffer(),w=x.__size,_=x.usage;return i.bindBuffer(i.UNIFORM_BUFFER,y),i.bufferData(i.UNIFORM_BUFFER,w,_),i.bindBuffer(i.UNIFORM_BUFFER,null),i.bindBufferBase(i.UNIFORM_BUFFER,v,y),y}function u(){for(let x=0;x<o;x++)if(a.indexOf(x)===-1)return a.push(x),x;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function d(x){let v=s[x.id],y=x.uniforms,w=x.__cache;i.bindBuffer(i.UNIFORM_BUFFER,v);for(let _=0,M=y.length;_<M;_++){let T=Array.isArray(y[_])?y[_]:[y[_]];for(let L=0,S=T.length;L<S;L++){let E=T[L];if(f(E,_,L,w)===!0){let D=E.__offset,O=Array.isArray(E.value)?E.value:[E.value],F=0;for(let W=0;W<O.length;W++){let B=O[W],ee=b(B);typeof B=="number"||typeof B=="boolean"?(E.__data[0]=B,i.bufferSubData(i.UNIFORM_BUFFER,D+F,E.__data)):B.isMatrix3?(E.__data[0]=B.elements[0],E.__data[1]=B.elements[1],E.__data[2]=B.elements[2],E.__data[3]=0,E.__data[4]=B.elements[3],E.__data[5]=B.elements[4],E.__data[6]=B.elements[5],E.__data[7]=0,E.__data[8]=B.elements[6],E.__data[9]=B.elements[7],E.__data[10]=B.elements[8],E.__data[11]=0):(B.toArray(E.__data,F),F+=ee.storage/Float32Array.BYTES_PER_ELEMENT)}i.bufferSubData(i.UNIFORM_BUFFER,D,E.__data)}}}i.bindBuffer(i.UNIFORM_BUFFER,null)}function f(x,v,y,w){let _=x.value,M=v+"_"+y;if(w[M]===void 0)return typeof _=="number"||typeof _=="boolean"?w[M]=_:w[M]=_.clone(),!0;{let T=w[M];if(typeof _=="number"||typeof _=="boolean"){if(T!==_)return w[M]=_,!0}else if(T.equals(_)===!1)return T.copy(_),!0}return!1}function g(x){let v=x.uniforms,y=0,w=16;for(let M=0,T=v.length;M<T;M++){let L=Array.isArray(v[M])?v[M]:[v[M]];for(let S=0,E=L.length;S<E;S++){let D=L[S],O=Array.isArray(D.value)?D.value:[D.value];for(let F=0,W=O.length;F<W;F++){let B=O[F],ee=b(B),q=y%w,le=q%ee.boundary,X=q+le;y+=le,X!==0&&w-X<ee.storage&&(y+=w-X),D.__data=new Float32Array(ee.storage/Float32Array.BYTES_PER_ELEMENT),D.__offset=y,y+=ee.storage}}}let _=y%w;return _>0&&(y+=w-_),x.__size=y,x.__cache={},this}function b(x){let v={boundary:0,storage:0};return typeof x=="number"||typeof x=="boolean"?(v.boundary=4,v.storage=4):x.isVector2?(v.boundary=8,v.storage=8):x.isVector3||x.isColor?(v.boundary=16,v.storage=12):x.isVector4?(v.boundary=16,v.storage=16):x.isMatrix3?(v.boundary=48,v.storage=48):x.isMatrix4?(v.boundary=64,v.storage=64):x.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",x),v}function p(x){let v=x.target;v.removeEventListener("dispose",p);let y=a.indexOf(v.__bindingPointIndex);a.splice(y,1),i.deleteBuffer(s[v.id]),delete s[v.id],delete r[v.id]}function m(){for(let x in s)i.deleteBuffer(s[x]);a=[],s={},r={}}return{bind:l,update:c,dispose:m}}var el=class{constructor(e={}){let{canvas:t=Yg(),context:n=null,depth:s=!0,stencil:r=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:u=!1}=e;this.isWebGLRenderer=!0;let d;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");d=n.getContextAttributes().alpha}else d=a;let f=new Uint32Array(4),g=new Int32Array(4),b=null,p=null,m=[],x=[];this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=Gt,this.toneMapping=Ji,this.toneMappingExposure=1;let v=this,y=!1,w=0,_=0,M=null,T=-1,L=null,S=new yt,E=new yt,D=null,O=new de(0),F=0,W=t.width,B=t.height,ee=1,q=null,le=null,X=new yt(0,0,W,B),te=new yt(0,0,W,B),Pe=!1,$e=new ba,$=!1,se=!1,ye=new Ge,Se=new Ge,De=new N,Ne=new yt,st={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},rt=!1;function ut(){return M===null?ee:1}let U=n;function fn(P,V){return t.getContext(P,V)}try{let P={alpha:!0,depth:s,stencil:r,antialias:o,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:h,failIfMajorPerformanceCaveat:u};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${Fu}`),t.addEventListener("webglcontextlost",oe,!1),t.addEventListener("webglcontextrestored",Me,!1),t.addEventListener("webglcontextcreationerror",we,!1),U===null){let V="webgl2";if(U=fn(V,P),U===null)throw fn(V)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(P){throw console.error("THREE.WebGLRenderer: "+P.message),P}let at,ot,ke,_t,Fe,k,A,Y,ae,ce,re,Ie,ve,Te,dt,fe,Re,Oe,Be,Ae,lt,ze,tt,z;function _e(){at=new ax(U),at.init(),ze=new U1(U,at),ot=new ex(U,at,e,ze),ke=new H1(U),ot.reverseDepthBuffer&&ke.buffers.depth.setReversed(!0),_t=new cx(U),Fe=new M1,k=new O1(U,at,ke,Fe,ot,ze,_t),A=new nx(v),Y=new rx(v),ae=new gv(U),tt=new jb(U,ae),ce=new ox(U,ae,_t,tt),re=new ux(U,ce,ae,_t),Be=new hx(U,ot,k),fe=new tx(Fe),Ie=new S1(v,A,Y,at,ot,tt,fe),ve=new V1(v,Fe),Te=new w1,dt=new P1(at),Oe=new Jb(v,A,Y,ke,re,d,l),Re=new k1(v,re,ot),z=new W1(U,_t,ot,ke),Ae=new Qb(U,at,_t),lt=new lx(U,at,_t),_t.programs=Ie.programs,v.capabilities=ot,v.extensions=at,v.properties=Fe,v.renderLists=Te,v.shadowMap=Re,v.state=ke,v.info=_t}_e();let j=new mu(v,U);this.xr=j,this.getContext=function(){return U},this.getContextAttributes=function(){return U.getContextAttributes()},this.forceContextLoss=function(){let P=at.get("WEBGL_lose_context");P&&P.loseContext()},this.forceContextRestore=function(){let P=at.get("WEBGL_lose_context");P&&P.restoreContext()},this.getPixelRatio=function(){return ee},this.setPixelRatio=function(P){P!==void 0&&(ee=P,this.setSize(W,B,!1))},this.getSize=function(P){return P.set(W,B)},this.setSize=function(P,V,K=!0){if(j.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}W=P,B=V,t.width=Math.floor(P*ee),t.height=Math.floor(V*ee),K===!0&&(t.style.width=P+"px",t.style.height=V+"px"),this.setViewport(0,0,P,V)},this.getDrawingBufferSize=function(P){return P.set(W*ee,B*ee).floor()},this.setDrawingBufferSize=function(P,V,K){W=P,B=V,ee=K,t.width=Math.floor(P*K),t.height=Math.floor(V*K),this.setViewport(0,0,P,V)},this.getCurrentViewport=function(P){return P.copy(S)},this.getViewport=function(P){return P.copy(X)},this.setViewport=function(P,V,K,C){P.isVector4?X.set(P.x,P.y,P.z,P.w):X.set(P,V,K,C),ke.viewport(S.copy(X).multiplyScalar(ee).round())},this.getScissor=function(P){return P.copy(te)},this.setScissor=function(P,V,K,C){P.isVector4?te.set(P.x,P.y,P.z,P.w):te.set(P,V,K,C),ke.scissor(E.copy(te).multiplyScalar(ee).round())},this.getScissorTest=function(){return Pe},this.setScissorTest=function(P){ke.setScissorTest(Pe=P)},this.setOpaqueSort=function(P){q=P},this.setTransparentSort=function(P){le=P},this.getClearColor=function(P){return P.copy(Oe.getClearColor())},this.setClearColor=function(){Oe.setClearColor.apply(Oe,arguments)},this.getClearAlpha=function(){return Oe.getClearAlpha()},this.setClearAlpha=function(){Oe.setClearAlpha.apply(Oe,arguments)},this.clear=function(P=!0,V=!0,K=!0){let C=0;if(P){let I=!1;if(M!==null){let G=M.texture.format;I=G===Yu||G===Xu||G===$u}if(I){let G=M.texture.type,J=G===_i||G===As||G===ga||G===Er||G===Vu||G===Wu,ie=Oe.getClearColor(),Q=Oe.getClearAlpha(),me=ie.r,Ce=ie.g,ne=ie.b;J?(f[0]=me,f[1]=Ce,f[2]=ne,f[3]=Q,U.clearBufferuiv(U.COLOR,0,f)):(g[0]=me,g[1]=Ce,g[2]=ne,g[3]=Q,U.clearBufferiv(U.COLOR,0,g))}else C|=U.COLOR_BUFFER_BIT}V&&(C|=U.DEPTH_BUFFER_BIT,U.clearDepth(this.capabilities.reverseDepthBuffer?0:1)),K&&(C|=U.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),U.clear(C)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){t.removeEventListener("webglcontextlost",oe,!1),t.removeEventListener("webglcontextrestored",Me,!1),t.removeEventListener("webglcontextcreationerror",we,!1),Te.dispose(),dt.dispose(),Fe.dispose(),A.dispose(),Y.dispose(),re.dispose(),tt.dispose(),z.dispose(),Ie.dispose(),j.dispose(),j.removeEventListener("sessionstart",Oa),j.removeEventListener("sessionend",Os),jn.stop()};function oe(P){P.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),y=!0}function Me(){console.log("THREE.WebGLRenderer: Context Restored."),y=!1;let P=_t.autoReset,V=Re.enabled,K=Re.autoUpdate,C=Re.needsUpdate,I=Re.type;_e(),_t.autoReset=P,Re.enabled=V,Re.autoUpdate=K,Re.needsUpdate=C,Re.type=I}function we(P){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",P.statusMessage)}function ct(P){let V=P.target;V.removeEventListener("dispose",ct),Nt(V)}function Nt(P){it(P),Fe.remove(P)}function it(P){let V=Fe.get(P).programs;V!==void 0&&(V.forEach(function(K){Ie.releaseProgram(K)}),P.isShaderMaterial&&Ie.releaseShaderCache(P))}this.renderBufferDirect=function(P,V,K,C,I,G){V===null&&(V=st);let J=I.isMesh&&I.matrixWorld.determinant()<0,ie=ac(P,V,K,C,I);ke.setMaterial(C,J);let Q=K.index,me=1;if(C.wireframe===!0){if(Q=ce.getWireframeAttribute(K),Q===void 0)return;me=2}let Ce=K.drawRange,ne=K.attributes.position,xe=Ce.start*me,Ze=(Ce.start+Ce.count)*me;G!==null&&(xe=Math.max(xe,G.start*me),Ze=Math.min(Ze,(G.start+G.count)*me)),Q!==null?(xe=Math.max(xe,0),Ze=Math.min(Ze,Q.count)):ne!=null&&(xe=Math.max(xe,0),Ze=Math.min(Ze,ne.count));let Tt=Ze-xe;if(Tt<0||Tt===1/0)return;tt.setup(I,C,ie,K,Q);let wt,et=Ae;if(Q!==null&&(wt=ae.get(Q),et=lt,et.setIndex(wt)),I.isMesh)C.wireframe===!0?(ke.setLineWidth(C.wireframeLinewidth*ut()),et.setMode(U.LINES)):et.setMode(U.TRIANGLES);else if(I.isLine){let ge=C.linewidth;ge===void 0&&(ge=1),ke.setLineWidth(ge*ut()),I.isLineSegments?et.setMode(U.LINES):I.isLineLoop?et.setMode(U.LINE_LOOP):et.setMode(U.LINE_STRIP)}else I.isPoints?et.setMode(U.POINTS):I.isSprite&&et.setMode(U.TRIANGLES);if(I.isBatchedMesh)if(I._multiDrawInstances!==null)et.renderMultiDrawInstances(I._multiDrawStarts,I._multiDrawCounts,I._multiDrawCount,I._multiDrawInstances);else if(at.get("WEBGL_multi_draw"))et.renderMultiDraw(I._multiDrawStarts,I._multiDrawCounts,I._multiDrawCount);else{let ge=I._multiDrawStarts,It=I._multiDrawCounts,nt=I._multiDrawCount,Wt=Q?ae.get(Q).bytesPerElement:1,wn=Fe.get(C).currentProgram.getUniforms();for(let tn=0;tn<nt;tn++)wn.setValue(U,"_gl_DrawID",tn),et.render(ge[tn]/Wt,It[tn])}else if(I.isInstancedMesh)et.renderInstances(xe,Tt,I.count);else if(K.isInstancedBufferGeometry){let ge=K._maxInstanceCount!==void 0?K._maxInstanceCount:1/0,It=Math.min(K.instanceCount,ge);et.renderInstances(xe,Tt,It)}else et.render(xe,Tt)};function ft(P,V,K){P.transparent===!0&&P.side===Mt&&P.forceSinglePass===!1?(P.side=hn,P.needsUpdate=!0,Bs(P,V,K),P.side=ji,P.needsUpdate=!0,Bs(P,V,K),P.side=Mt):Bs(P,V,K)}this.compile=function(P,V,K=null){K===null&&(K=P),p=dt.get(K),p.init(V),x.push(p),K.traverseVisible(function(I){I.isLight&&I.layers.test(V.layers)&&(p.pushLight(I),I.castShadow&&p.pushShadow(I))}),P!==K&&P.traverseVisible(function(I){I.isLight&&I.layers.test(V.layers)&&(p.pushLight(I),I.castShadow&&p.pushShadow(I))}),p.setupLights();let C=new Set;return P.traverse(function(I){if(!(I.isMesh||I.isPoints||I.isLine||I.isSprite))return;let G=I.material;if(G)if(Array.isArray(G))for(let J=0;J<G.length;J++){let ie=G[J];ft(ie,K,I),C.add(ie)}else ft(G,K,I),C.add(G)}),x.pop(),p=null,C},this.compileAsync=function(P,V,K=null){let C=this.compile(P,V,K);return new Promise(I=>{function G(){if(C.forEach(function(J){Fe.get(J).currentProgram.isReady()&&C.delete(J)}),C.size===0){I(P);return}setTimeout(G,10)}at.get("KHR_parallel_shader_compile")!==null?G():setTimeout(G,10)})};let rn=null;function In(P){rn&&rn(P)}function Oa(){jn.stop()}function Os(){jn.start()}let jn=new Op;jn.setAnimationLoop(In),typeof self<"u"&&jn.setContext(self),this.setAnimationLoop=function(P){rn=P,j.setAnimationLoop(P),P===null?jn.stop():jn.start()},j.addEventListener("sessionstart",Oa),j.addEventListener("sessionend",Os),this.render=function(P,V){if(V!==void 0&&V.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(y===!0)return;if(P.matrixWorldAutoUpdate===!0&&P.updateMatrixWorld(),V.parent===null&&V.matrixWorldAutoUpdate===!0&&V.updateMatrixWorld(),j.enabled===!0&&j.isPresenting===!0&&(j.cameraAutoUpdate===!0&&j.updateCamera(V),V=j.getCamera()),P.isScene===!0&&P.onBeforeRender(v,P,V,M),p=dt.get(P,x.length),p.init(V),x.push(p),Se.multiplyMatrices(V.projectionMatrix,V.matrixWorldInverse),$e.setFromProjectionMatrix(Se),se=this.localClippingEnabled,$=fe.init(this.clippingPlanes,se),b=Te.get(P,m.length),b.init(),m.push(b),j.enabled===!0&&j.isPresenting===!0){let G=v.xr.getDepthSensingMesh();G!==null&&Us(G,V,-1/0,v.sortObjects)}Us(P,V,0,v.sortObjects),b.finish(),v.sortObjects===!0&&b.sort(q,le),rt=j.enabled===!1||j.isPresenting===!1||j.hasDepthSensing()===!1,rt&&Oe.addToRenderList(b,P),this.info.render.frame++,$===!0&&fe.beginShadows();let K=p.state.shadowsArray;Re.render(K,P,V),$===!0&&fe.endShadows(),this.info.autoReset===!0&&this.info.reset();let C=b.opaque,I=b.transmissive;if(p.setupLights(),V.isArrayCamera){let G=V.cameras;if(I.length>0)for(let J=0,ie=G.length;J<ie;J++){let Q=G[J];os(C,I,P,Q)}rt&&Oe.render(P);for(let J=0,ie=G.length;J<ie;J++){let Q=G[J];zr(b,P,Q,Q.viewport)}}else I.length>0&&os(C,I,P,V),rt&&Oe.render(P),zr(b,P,V);M!==null&&(k.updateMultisampleRenderTarget(M),k.updateRenderTargetMipmap(M)),P.isScene===!0&&P.onAfterRender(v,P,V),tt.resetDefaultState(),T=-1,L=null,x.pop(),x.length>0?(p=x[x.length-1],$===!0&&fe.setGlobalState(v.clippingPlanes,p.state.camera)):p=null,m.pop(),m.length>0?b=m[m.length-1]:b=null};function Us(P,V,K,C){if(P.visible===!1)return;if(P.layers.test(V.layers)){if(P.isGroup)K=P.renderOrder;else if(P.isLOD)P.autoUpdate===!0&&P.update(V);else if(P.isLight)p.pushLight(P),P.castShadow&&p.pushShadow(P);else if(P.isSprite){if(!P.frustumCulled||$e.intersectsSprite(P)){C&&Ne.setFromMatrixPosition(P.matrixWorld).applyMatrix4(Se);let J=re.update(P),ie=P.material;ie.visible&&b.push(P,J,ie,K,Ne.z,null)}}else if((P.isMesh||P.isLine||P.isPoints)&&(!P.frustumCulled||$e.intersectsObject(P))){let J=re.update(P),ie=P.material;if(C&&(P.boundingSphere!==void 0?(P.boundingSphere===null&&P.computeBoundingSphere(),Ne.copy(P.boundingSphere.center)):(J.boundingSphere===null&&J.computeBoundingSphere(),Ne.copy(J.boundingSphere.center)),Ne.applyMatrix4(P.matrixWorld).applyMatrix4(Se)),Array.isArray(ie)){let Q=J.groups;for(let me=0,Ce=Q.length;me<Ce;me++){let ne=Q[me],xe=ie[ne.materialIndex];xe&&xe.visible&&b.push(P,J,xe,K,Ne.z,ne)}}else ie.visible&&b.push(P,J,ie,K,Ne.z,null)}}let G=P.children;for(let J=0,ie=G.length;J<ie;J++)Us(G[J],V,K,C)}function zr(P,V,K,C){let I=P.opaque,G=P.transmissive,J=P.transparent;p.setupLightsView(K),$===!0&&fe.setGlobalState(v.clippingPlanes,K),C&&ke.viewport(S.copy(C)),I.length>0&&ls(I,V,K),G.length>0&&ls(G,V,K),J.length>0&&ls(J,V,K),ke.buffers.depth.setTest(!0),ke.buffers.depth.setMask(!0),ke.buffers.color.setMask(!0),ke.setPolygonOffset(!1)}function os(P,V,K,C){if((K.isScene===!0?K.overrideMaterial:null)!==null)return;p.state.transmissionRenderTarget[C.id]===void 0&&(p.state.transmissionRenderTarget[C.id]=new gn(1,1,{generateMipmaps:!0,type:at.has("EXT_color_buffer_half_float")||at.has("EXT_color_buffer_float")?Xn:_i,minFilter:Ts,samples:4,stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:bt.workingColorSpace}));let G=p.state.transmissionRenderTarget[C.id],J=C.viewport||S;G.setSize(J.z,J.w);let ie=v.getRenderTarget();v.setRenderTarget(G),v.getClearColor(O),F=v.getClearAlpha(),F<1&&v.setClearColor(16777215,.5),v.clear(),rt&&Oe.render(K);let Q=v.toneMapping;v.toneMapping=Ji;let me=C.viewport;if(C.viewport!==void 0&&(C.viewport=void 0),p.setupLightsView(C),$===!0&&fe.setGlobalState(v.clippingPlanes,C),ls(P,K,C),k.updateMultisampleRenderTarget(G),k.updateRenderTargetMipmap(G),at.has("WEBGL_multisampled_render_to_texture")===!1){let Ce=!1;for(let ne=0,xe=V.length;ne<xe;ne++){let Ze=V[ne],Tt=Ze.object,wt=Ze.geometry,et=Ze.material,ge=Ze.group;if(et.side===Mt&&Tt.layers.test(C.layers)){let It=et.side;et.side=hn,et.needsUpdate=!0,Fs(Tt,K,C,wt,et,ge),et.side=It,et.needsUpdate=!0,Ce=!0}}Ce===!0&&(k.updateMultisampleRenderTarget(G),k.updateRenderTargetMipmap(G))}v.setRenderTarget(ie),v.setClearColor(O,F),me!==void 0&&(C.viewport=me),v.toneMapping=Q}function ls(P,V,K){let C=V.isScene===!0?V.overrideMaterial:null;for(let I=0,G=P.length;I<G;I++){let J=P[I],ie=J.object,Q=J.geometry,me=C===null?J.material:C,Ce=J.group;ie.layers.test(K.layers)&&Fs(ie,V,K,Q,me,Ce)}}function Fs(P,V,K,C,I,G){P.onBeforeRender(v,V,K,C,I,G),P.modelViewMatrix.multiplyMatrices(K.matrixWorldInverse,P.matrixWorld),P.normalMatrix.getNormalMatrix(P.modelViewMatrix),I.onBeforeRender(v,V,K,C,P,G),I.transparent===!0&&I.side===Mt&&I.forceSinglePass===!1?(I.side=hn,I.needsUpdate=!0,v.renderBufferDirect(K,V,C,I,P,G),I.side=ji,I.needsUpdate=!0,v.renderBufferDirect(K,V,C,I,P,G),I.side=Mt):v.renderBufferDirect(K,V,C,I,P,G),P.onAfterRender(v,V,K,C,I,G)}function Bs(P,V,K){V.isScene!==!0&&(V=st);let C=Fe.get(P),I=p.state.lights,G=p.state.shadowsArray,J=I.state.version,ie=Ie.getParameters(P,I.state,G,V,K),Q=Ie.getProgramCacheKey(ie),me=C.programs;C.environment=P.isMeshStandardMaterial?V.environment:null,C.fog=V.fog,C.envMap=(P.isMeshStandardMaterial?Y:A).get(P.envMap||C.environment),C.envMapRotation=C.environment!==null&&P.envMap===null?V.environmentRotation:P.envMapRotation,me===void 0&&(P.addEventListener("dispose",ct),me=new Map,C.programs=me);let Ce=me.get(Q);if(Ce!==void 0){if(C.currentProgram===Ce&&C.lightsStateVersion===J)return Fa(P,ie),Ce}else ie.uniforms=Ie.getUniforms(P),P.onBeforeCompile(ie,v),Ce=Ie.acquireProgram(ie,Q),me.set(Q,Ce),C.uniforms=ie.uniforms;let ne=C.uniforms;return(!P.isShaderMaterial&&!P.isRawShaderMaterial||P.clipping===!0)&&(ne.clippingPlanes=fe.uniform),Fa(P,ie),C.needsLights=Gr(P),C.lightsStateVersion=J,C.needsLights&&(ne.ambientLightColor.value=I.state.ambient,ne.lightProbe.value=I.state.probe,ne.directionalLights.value=I.state.directional,ne.directionalLightShadows.value=I.state.directionalShadow,ne.spotLights.value=I.state.spot,ne.spotLightShadows.value=I.state.spotShadow,ne.rectAreaLights.value=I.state.rectArea,ne.ltc_1.value=I.state.rectAreaLTC1,ne.ltc_2.value=I.state.rectAreaLTC2,ne.pointLights.value=I.state.point,ne.pointLightShadows.value=I.state.pointShadow,ne.hemisphereLights.value=I.state.hemi,ne.directionalShadowMap.value=I.state.directionalShadowMap,ne.directionalShadowMatrix.value=I.state.directionalShadowMatrix,ne.spotShadowMap.value=I.state.spotShadowMap,ne.spotLightMatrix.value=I.state.spotLightMatrix,ne.spotLightMap.value=I.state.spotLightMap,ne.pointShadowMap.value=I.state.pointShadowMap,ne.pointShadowMatrix.value=I.state.pointShadowMatrix),C.currentProgram=Ce,C.uniformsList=null,Ce}function Ua(P){if(P.uniformsList===null){let V=P.currentProgram.getUniforms();P.uniformsList=Sr.seqWithValue(V.seq,P.uniforms)}return P.uniformsList}function Fa(P,V){let K=Fe.get(P);K.outputColorSpace=V.outputColorSpace,K.batching=V.batching,K.batchingColor=V.batchingColor,K.instancing=V.instancing,K.instancingColor=V.instancingColor,K.instancingMorph=V.instancingMorph,K.skinning=V.skinning,K.morphTargets=V.morphTargets,K.morphNormals=V.morphNormals,K.morphColors=V.morphColors,K.morphTargetsCount=V.morphTargetsCount,K.numClippingPlanes=V.numClippingPlanes,K.numIntersection=V.numClipIntersection,K.vertexAlphas=V.vertexAlphas,K.vertexTangents=V.vertexTangents,K.toneMapping=V.toneMapping}function ac(P,V,K,C,I){V.isScene!==!0&&(V=st),k.resetTextureUnits();let G=V.fog,J=C.isMeshStandardMaterial?V.environment:null,ie=M===null?v.outputColorSpace:M.isXRRenderTarget===!0?M.texture.colorSpace:ts,Q=(C.isMeshStandardMaterial?Y:A).get(C.envMap||J),me=C.vertexColors===!0&&!!K.attributes.color&&K.attributes.color.itemSize===4,Ce=!!K.attributes.tangent&&(!!C.normalMap||C.anisotropy>0),ne=!!K.morphAttributes.position,xe=!!K.morphAttributes.normal,Ze=!!K.morphAttributes.color,Tt=Ji;C.toneMapped&&(M===null||M.isXRRenderTarget===!0)&&(Tt=v.toneMapping);let wt=K.morphAttributes.position||K.morphAttributes.normal||K.morphAttributes.color,et=wt!==void 0?wt.length:0,ge=Fe.get(C),It=p.state.lights;if($===!0&&(se===!0||P!==L)){let Zt=P===L&&C.id===T;fe.setState(C,P,Zt)}let nt=!1;C.version===ge.__version?(ge.needsLights&&ge.lightsStateVersion!==It.state.version||ge.outputColorSpace!==ie||I.isBatchedMesh&&ge.batching===!1||!I.isBatchedMesh&&ge.batching===!0||I.isBatchedMesh&&ge.batchingColor===!0&&I.colorTexture===null||I.isBatchedMesh&&ge.batchingColor===!1&&I.colorTexture!==null||I.isInstancedMesh&&ge.instancing===!1||!I.isInstancedMesh&&ge.instancing===!0||I.isSkinnedMesh&&ge.skinning===!1||!I.isSkinnedMesh&&ge.skinning===!0||I.isInstancedMesh&&ge.instancingColor===!0&&I.instanceColor===null||I.isInstancedMesh&&ge.instancingColor===!1&&I.instanceColor!==null||I.isInstancedMesh&&ge.instancingMorph===!0&&I.morphTexture===null||I.isInstancedMesh&&ge.instancingMorph===!1&&I.morphTexture!==null||ge.envMap!==Q||C.fog===!0&&ge.fog!==G||ge.numClippingPlanes!==void 0&&(ge.numClippingPlanes!==fe.numPlanes||ge.numIntersection!==fe.numIntersection)||ge.vertexAlphas!==me||ge.vertexTangents!==Ce||ge.morphTargets!==ne||ge.morphNormals!==xe||ge.morphColors!==Ze||ge.toneMapping!==Tt||ge.morphTargetsCount!==et)&&(nt=!0):(nt=!0,ge.__version=C.version);let Wt=ge.currentProgram;nt===!0&&(Wt=Bs(C,V,I));let wn=!1,tn=!1,pt=!1,Ye=Wt.getUniforms(),St=ge.uniforms;if(ke.useProgram(Wt.program)&&(wn=!0,tn=!0,pt=!0),C.id!==T&&(T=C.id,tn=!0),wn||L!==P){ot.reverseDepthBuffer?(ye.copy(P.projectionMatrix),Zg(ye),Jg(ye),Ye.setValue(U,"projectionMatrix",ye)):Ye.setValue(U,"projectionMatrix",P.projectionMatrix),Ye.setValue(U,"viewMatrix",P.matrixWorldInverse);let Zt=Ye.map.cameraPosition;Zt!==void 0&&Zt.setValue(U,De.setFromMatrixPosition(P.matrixWorld)),ot.logarithmicDepthBuffer&&Ye.setValue(U,"logDepthBufFC",2/(Math.log(P.far+1)/Math.LN2)),(C.isMeshPhongMaterial||C.isMeshToonMaterial||C.isMeshLambertMaterial||C.isMeshBasicMaterial||C.isMeshStandardMaterial||C.isShaderMaterial)&&Ye.setValue(U,"isOrthographic",P.isOrthographicCamera===!0),L!==P&&(L=P,tn=!0,pt=!0)}if(I.isSkinnedMesh){Ye.setOptional(U,I,"bindMatrix"),Ye.setOptional(U,I,"bindMatrixInverse");let Zt=I.skeleton;Zt&&(Zt.boneTexture===null&&Zt.computeBoneTexture(),Ye.setValue(U,"boneTexture",Zt.boneTexture,k))}I.isBatchedMesh&&(Ye.setOptional(U,I,"batchingTexture"),Ye.setValue(U,"batchingTexture",I._matricesTexture,k),Ye.setOptional(U,I,"batchingIdTexture"),Ye.setValue(U,"batchingIdTexture",I._indirectTexture,k),Ye.setOptional(U,I,"batchingColorTexture"),I._colorsTexture!==null&&Ye.setValue(U,"batchingColorTexture",I._colorsTexture,k));let qt=K.morphAttributes;if((qt.position!==void 0||qt.normal!==void 0||qt.color!==void 0)&&Be.update(I,K,Wt),(tn||ge.receiveShadow!==I.receiveShadow)&&(ge.receiveShadow=I.receiveShadow,Ye.setValue(U,"receiveShadow",I.receiveShadow)),C.isMeshGouraudMaterial&&C.envMap!==null&&(St.envMap.value=Q,St.flipEnvMap.value=Q.isCubeTexture&&Q.isRenderTargetTexture===!1?-1:1),C.isMeshStandardMaterial&&C.envMap===null&&V.environment!==null&&(St.envMapIntensity.value=V.environmentIntensity),tn&&(Ye.setValue(U,"toneMappingExposure",v.toneMappingExposure),ge.needsLights&&oc(St,pt),G&&C.fog===!0&&ve.refreshFogUniforms(St,G),ve.refreshMaterialUniforms(St,C,ee,B,p.state.transmissionRenderTarget[P.id]),Sr.upload(U,Ua(ge),St,k)),C.isShaderMaterial&&C.uniformsNeedUpdate===!0&&(Sr.upload(U,Ua(ge),St,k),C.uniformsNeedUpdate=!1),C.isSpriteMaterial&&Ye.setValue(U,"center",I.center),Ye.setValue(U,"modelViewMatrix",I.modelViewMatrix),Ye.setValue(U,"normalMatrix",I.normalMatrix),Ye.setValue(U,"modelMatrix",I.matrixWorld),C.isShaderMaterial||C.isRawShaderMaterial){let Zt=C.uniformsGroups;for(let zs=0,Ba=Zt.length;zs<Ba;zs++){let Vr=Zt[zs];z.update(Vr,Wt),z.bind(Vr,Wt)}}return Wt}function oc(P,V){P.ambientLightColor.needsUpdate=V,P.lightProbe.needsUpdate=V,P.directionalLights.needsUpdate=V,P.directionalLightShadows.needsUpdate=V,P.pointLights.needsUpdate=V,P.pointLightShadows.needsUpdate=V,P.spotLights.needsUpdate=V,P.spotLightShadows.needsUpdate=V,P.rectAreaLights.needsUpdate=V,P.hemisphereLights.needsUpdate=V}function Gr(P){return P.isMeshLambertMaterial||P.isMeshToonMaterial||P.isMeshPhongMaterial||P.isMeshStandardMaterial||P.isShadowMaterial||P.isShaderMaterial&&P.lights===!0}this.getActiveCubeFace=function(){return w},this.getActiveMipmapLevel=function(){return _},this.getRenderTarget=function(){return M},this.setRenderTargetTextures=function(P,V,K){Fe.get(P.texture).__webglTexture=V,Fe.get(P.depthTexture).__webglTexture=K;let C=Fe.get(P);C.__hasExternalTextures=!0,C.__autoAllocateDepthBuffer=K===void 0,C.__autoAllocateDepthBuffer||at.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),C.__useRenderToTexture=!1)},this.setRenderTargetFramebuffer=function(P,V){let K=Fe.get(P);K.__webglFramebuffer=V,K.__useDefaultFramebuffer=V===void 0},this.setRenderTarget=function(P,V=0,K=0){M=P,w=V,_=K;let C=!0,I=null,G=!1,J=!1;if(P){let Q=Fe.get(P);if(Q.__useDefaultFramebuffer!==void 0)ke.bindFramebuffer(U.FRAMEBUFFER,null),C=!1;else if(Q.__webglFramebuffer===void 0)k.setupRenderTarget(P);else if(Q.__hasExternalTextures)k.rebindTextures(P,Fe.get(P.texture).__webglTexture,Fe.get(P.depthTexture).__webglTexture);else if(P.depthBuffer){let ne=P.depthTexture;if(Q.__boundDepthTexture!==ne){if(ne!==null&&Fe.has(ne)&&(P.width!==ne.image.width||P.height!==ne.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");k.setupDepthRenderbuffer(P)}}let me=P.texture;(me.isData3DTexture||me.isDataArrayTexture||me.isCompressedArrayTexture)&&(J=!0);let Ce=Fe.get(P).__webglFramebuffer;P.isWebGLCubeRenderTarget?(Array.isArray(Ce[V])?I=Ce[V][K]:I=Ce[V],G=!0):P.samples>0&&k.useMultisampledRTT(P)===!1?I=Fe.get(P).__webglMultisampledFramebuffer:Array.isArray(Ce)?I=Ce[K]:I=Ce,S.copy(P.viewport),E.copy(P.scissor),D=P.scissorTest}else S.copy(X).multiplyScalar(ee).floor(),E.copy(te).multiplyScalar(ee).floor(),D=Pe;if(ke.bindFramebuffer(U.FRAMEBUFFER,I)&&C&&ke.drawBuffers(P,I),ke.viewport(S),ke.scissor(E),ke.setScissorTest(D),G){let Q=Fe.get(P.texture);U.framebufferTexture2D(U.FRAMEBUFFER,U.COLOR_ATTACHMENT0,U.TEXTURE_CUBE_MAP_POSITIVE_X+V,Q.__webglTexture,K)}else if(J){let Q=Fe.get(P.texture),me=V||0;U.framebufferTextureLayer(U.FRAMEBUFFER,U.COLOR_ATTACHMENT0,Q.__webglTexture,K||0,me)}T=-1},this.readRenderTargetPixels=function(P,V,K,C,I,G,J){if(!(P&&P.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let ie=Fe.get(P).__webglFramebuffer;if(P.isWebGLCubeRenderTarget&&J!==void 0&&(ie=ie[J]),ie){ke.bindFramebuffer(U.FRAMEBUFFER,ie);try{let Q=P.texture,me=Q.format,Ce=Q.type;if(!ot.textureFormatReadable(me)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!ot.textureTypeReadable(Ce)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}V>=0&&V<=P.width-C&&K>=0&&K<=P.height-I&&U.readPixels(V,K,C,I,ze.convert(me),ze.convert(Ce),G)}finally{let Q=M!==null?Fe.get(M).__webglFramebuffer:null;ke.bindFramebuffer(U.FRAMEBUFFER,Q)}}},this.readRenderTargetPixelsAsync=async function(P,V,K,C,I,G,J){if(!(P&&P.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let ie=Fe.get(P).__webglFramebuffer;if(P.isWebGLCubeRenderTarget&&J!==void 0&&(ie=ie[J]),ie){let Q=P.texture,me=Q.format,Ce=Q.type;if(!ot.textureFormatReadable(me))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!ot.textureTypeReadable(Ce))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");if(V>=0&&V<=P.width-C&&K>=0&&K<=P.height-I){ke.bindFramebuffer(U.FRAMEBUFFER,ie);let ne=U.createBuffer();U.bindBuffer(U.PIXEL_PACK_BUFFER,ne),U.bufferData(U.PIXEL_PACK_BUFFER,G.byteLength,U.STREAM_READ),U.readPixels(V,K,C,I,ze.convert(me),ze.convert(Ce),0);let xe=M!==null?Fe.get(M).__webglFramebuffer:null;ke.bindFramebuffer(U.FRAMEBUFFER,xe);let Ze=U.fenceSync(U.SYNC_GPU_COMMANDS_COMPLETE,0);return U.flush(),await Kg(U,Ze,4),U.bindBuffer(U.PIXEL_PACK_BUFFER,ne),U.getBufferSubData(U.PIXEL_PACK_BUFFER,0,G),U.deleteBuffer(ne),U.deleteSync(Ze),G}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")}},this.copyFramebufferToTexture=function(P,V=null,K=0){P.isTexture!==!0&&(Fo("WebGLRenderer: copyFramebufferToTexture function signature has changed."),V=arguments[0]||null,P=arguments[1]);let C=Math.pow(2,-K),I=Math.floor(P.image.width*C),G=Math.floor(P.image.height*C),J=V!==null?V.x:0,ie=V!==null?V.y:0;k.setTexture2D(P,0),U.copyTexSubImage2D(U.TEXTURE_2D,K,0,0,J,ie,I,G),ke.unbindTexture()},this.copyTextureToTexture=function(P,V,K=null,C=null,I=0){P.isTexture!==!0&&(Fo("WebGLRenderer: copyTextureToTexture function signature has changed."),C=arguments[0]||null,P=arguments[1],V=arguments[2],I=arguments[3]||0,K=null);let G,J,ie,Q,me,Ce;K!==null?(G=K.max.x-K.min.x,J=K.max.y-K.min.y,ie=K.min.x,Q=K.min.y):(G=P.image.width,J=P.image.height,ie=0,Q=0),C!==null?(me=C.x,Ce=C.y):(me=0,Ce=0);let ne=ze.convert(V.format),xe=ze.convert(V.type);k.setTexture2D(V,0),U.pixelStorei(U.UNPACK_FLIP_Y_WEBGL,V.flipY),U.pixelStorei(U.UNPACK_PREMULTIPLY_ALPHA_WEBGL,V.premultiplyAlpha),U.pixelStorei(U.UNPACK_ALIGNMENT,V.unpackAlignment);let Ze=U.getParameter(U.UNPACK_ROW_LENGTH),Tt=U.getParameter(U.UNPACK_IMAGE_HEIGHT),wt=U.getParameter(U.UNPACK_SKIP_PIXELS),et=U.getParameter(U.UNPACK_SKIP_ROWS),ge=U.getParameter(U.UNPACK_SKIP_IMAGES),It=P.isCompressedTexture?P.mipmaps[I]:P.image;U.pixelStorei(U.UNPACK_ROW_LENGTH,It.width),U.pixelStorei(U.UNPACK_IMAGE_HEIGHT,It.height),U.pixelStorei(U.UNPACK_SKIP_PIXELS,ie),U.pixelStorei(U.UNPACK_SKIP_ROWS,Q),P.isDataTexture?U.texSubImage2D(U.TEXTURE_2D,I,me,Ce,G,J,ne,xe,It.data):P.isCompressedTexture?U.compressedTexSubImage2D(U.TEXTURE_2D,I,me,Ce,It.width,It.height,ne,It.data):U.texSubImage2D(U.TEXTURE_2D,I,me,Ce,G,J,ne,xe,It),U.pixelStorei(U.UNPACK_ROW_LENGTH,Ze),U.pixelStorei(U.UNPACK_IMAGE_HEIGHT,Tt),U.pixelStorei(U.UNPACK_SKIP_PIXELS,wt),U.pixelStorei(U.UNPACK_SKIP_ROWS,et),U.pixelStorei(U.UNPACK_SKIP_IMAGES,ge),I===0&&V.generateMipmaps&&U.generateMipmap(U.TEXTURE_2D),ke.unbindTexture()},this.copyTextureToTexture3D=function(P,V,K=null,C=null,I=0){P.isTexture!==!0&&(Fo("WebGLRenderer: copyTextureToTexture3D function signature has changed."),K=arguments[0]||null,C=arguments[1]||null,P=arguments[2],V=arguments[3],I=arguments[4]||0);let G,J,ie,Q,me,Ce,ne,xe,Ze,Tt=P.isCompressedTexture?P.mipmaps[I]:P.image;K!==null?(G=K.max.x-K.min.x,J=K.max.y-K.min.y,ie=K.max.z-K.min.z,Q=K.min.x,me=K.min.y,Ce=K.min.z):(G=Tt.width,J=Tt.height,ie=Tt.depth,Q=0,me=0,Ce=0),C!==null?(ne=C.x,xe=C.y,Ze=C.z):(ne=0,xe=0,Ze=0);let wt=ze.convert(V.format),et=ze.convert(V.type),ge;if(V.isData3DTexture)k.setTexture3D(V,0),ge=U.TEXTURE_3D;else if(V.isDataArrayTexture||V.isCompressedArrayTexture)k.setTexture2DArray(V,0),ge=U.TEXTURE_2D_ARRAY;else{console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: only supports THREE.DataTexture3D and THREE.DataTexture2DArray.");return}U.pixelStorei(U.UNPACK_FLIP_Y_WEBGL,V.flipY),U.pixelStorei(U.UNPACK_PREMULTIPLY_ALPHA_WEBGL,V.premultiplyAlpha),U.pixelStorei(U.UNPACK_ALIGNMENT,V.unpackAlignment);let It=U.getParameter(U.UNPACK_ROW_LENGTH),nt=U.getParameter(U.UNPACK_IMAGE_HEIGHT),Wt=U.getParameter(U.UNPACK_SKIP_PIXELS),wn=U.getParameter(U.UNPACK_SKIP_ROWS),tn=U.getParameter(U.UNPACK_SKIP_IMAGES);U.pixelStorei(U.UNPACK_ROW_LENGTH,Tt.width),U.pixelStorei(U.UNPACK_IMAGE_HEIGHT,Tt.height),U.pixelStorei(U.UNPACK_SKIP_PIXELS,Q),U.pixelStorei(U.UNPACK_SKIP_ROWS,me),U.pixelStorei(U.UNPACK_SKIP_IMAGES,Ce),P.isDataTexture||P.isData3DTexture?U.texSubImage3D(ge,I,ne,xe,Ze,G,J,ie,wt,et,Tt.data):V.isCompressedArrayTexture?U.compressedTexSubImage3D(ge,I,ne,xe,Ze,G,J,ie,wt,Tt.data):U.texSubImage3D(ge,I,ne,xe,Ze,G,J,ie,wt,et,Tt),U.pixelStorei(U.UNPACK_ROW_LENGTH,It),U.pixelStorei(U.UNPACK_IMAGE_HEIGHT,nt),U.pixelStorei(U.UNPACK_SKIP_PIXELS,Wt),U.pixelStorei(U.UNPACK_SKIP_ROWS,wn),U.pixelStorei(U.UNPACK_SKIP_IMAGES,tn),I===0&&V.generateMipmaps&&U.generateMipmap(ge),ke.unbindTexture()},this.initRenderTarget=function(P){Fe.get(P).__webglFramebuffer===void 0&&k.setupRenderTarget(P)},this.initTexture=function(P){P.isCubeTexture?k.setTextureCube(P,0):P.isData3DTexture?k.setTexture3D(P,0):P.isDataArrayTexture||P.isCompressedArrayTexture?k.setTexture2DArray(P,0):k.setTexture2D(P,0),ke.unbindTexture()},this.resetState=function(){w=0,_=0,M=null,ke.reset(),tt.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return Mi}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorSpace=e===Ku?"display-p3":"srgb",t.unpackColorSpace=bt.workingColorSpace===Sl?"display-p3":"srgb"}},tl=class i{constructor(e,t=25e-5){this.isFogExp2=!0,this.name="",this.color=new de(e),this.density=t}clone(){return new i(this.color,this.density)}toJSON(){return{type:"FogExp2",name:this.name,color:this.color.getHex(),density:this.density}}};var nl=class extends gt{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Ut,this.environmentIntensity=1,this.environmentRotation=new Ut,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(t.object.environmentIntensity=this.environmentIntensity),t.object.environmentRotation=this.environmentRotation.toArray(),t}},gu=class{constructor(e,t){this.isInterleavedBuffer=!0,this.array=e,this.stride=t,this.count=e!==void 0?e.length/t:0,this.usage=va,this.updateRanges=[],this.version=0,this.uuid=ri()}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.array=new e.array.constructor(e.array),this.count=e.count,this.stride=e.stride,this.usage=e.usage,this}copyAt(e,t,n){e*=this.stride,n*=t.stride;for(let s=0,r=this.stride;s<r;s++)this.array[e+s]=t.array[n+s];return this}set(e,t=0){return this.array.set(e,t),this}clone(e){e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=ri()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer);let t=new this.array.constructor(e.arrayBuffers[this.array.buffer._uuid]),n=new this.constructor(t,this.stride);return n.setUsage(this.usage),n}onUpload(e){return this.onUploadCallback=e,this}toJSON(e){return e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=ri()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer))),{uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride}}},pn=new N,il=class i{constructor(e,t,n,s=!1){this.isInterleavedBufferAttribute=!0,this.name="",this.data=e,this.itemSize=t,this.offset=n,this.normalized=s}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(e){this.data.needsUpdate=e}applyMatrix4(e){for(let t=0,n=this.data.count;t<n;t++)pn.fromBufferAttribute(this,t),pn.applyMatrix4(e),this.setXYZ(t,pn.x,pn.y,pn.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)pn.fromBufferAttribute(this,t),pn.applyNormalMatrix(e),this.setXYZ(t,pn.x,pn.y,pn.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)pn.fromBufferAttribute(this,t),pn.transformDirection(e),this.setXYZ(t,pn.x,pn.y,pn.z);return this}getComponent(e,t){let n=this.array[e*this.data.stride+this.offset+t];return this.normalized&&(n=ii(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=Et(n,this.array)),this.data.array[e*this.data.stride+this.offset+t]=n,this}setX(e,t){return this.normalized&&(t=Et(t,this.array)),this.data.array[e*this.data.stride+this.offset]=t,this}setY(e,t){return this.normalized&&(t=Et(t,this.array)),this.data.array[e*this.data.stride+this.offset+1]=t,this}setZ(e,t){return this.normalized&&(t=Et(t,this.array)),this.data.array[e*this.data.stride+this.offset+2]=t,this}setW(e,t){return this.normalized&&(t=Et(t,this.array)),this.data.array[e*this.data.stride+this.offset+3]=t,this}getX(e){let t=this.data.array[e*this.data.stride+this.offset];return this.normalized&&(t=ii(t,this.array)),t}getY(e){let t=this.data.array[e*this.data.stride+this.offset+1];return this.normalized&&(t=ii(t,this.array)),t}getZ(e){let t=this.data.array[e*this.data.stride+this.offset+2];return this.normalized&&(t=ii(t,this.array)),t}getW(e){let t=this.data.array[e*this.data.stride+this.offset+3];return this.normalized&&(t=ii(t,this.array)),t}setXY(e,t,n){return e=e*this.data.stride+this.offset,this.normalized&&(t=Et(t,this.array),n=Et(n,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this}setXYZ(e,t,n,s){return e=e*this.data.stride+this.offset,this.normalized&&(t=Et(t,this.array),n=Et(n,this.array),s=Et(s,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this.data.array[e+2]=s,this}setXYZW(e,t,n,s,r){return e=e*this.data.stride+this.offset,this.normalized&&(t=Et(t,this.array),n=Et(n,this.array),s=Et(s,this.array),r=Et(r,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this.data.array[e+2]=s,this.data.array[e+3]=r,this}clone(e){if(e===void 0){console.log("THREE.InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.");let t=[];for(let n=0;n<this.count;n++){let s=n*this.data.stride+this.offset;for(let r=0;r<this.itemSize;r++)t.push(this.data.array[s+r])}return new Xe(new this.array.constructor(t),this.itemSize,this.normalized)}else return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.clone(e)),new i(e.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(e){if(e===void 0){console.log("THREE.InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.");let t=[];for(let n=0;n<this.count;n++){let s=n*this.data.stride+this.offset;for(let r=0;r<this.itemSize;r++)t.push(this.data.array[s+r])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:t,normalized:this.normalized}}else return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.toJSON(e)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}},sn=class extends wi{constructor(e){super(),this.isSpriteMaterial=!0,this.type="SpriteMaterial",this.color=new de(16777215),this.map=null,this.alphaMap=null,this.rotation=0,this.sizeAttenuation=!0,this.transparent=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.rotation=e.rotation,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}},ur,ra=new N,dr=new N,fr=new N,pr=new ue,aa=new ue,Gp=new Ge,_o=new N,oa=new N,wo=new N,Qf=new ue,ah=new ue,ep=new ue,un=class extends gt{constructor(e=new sn){if(super(),this.isSprite=!0,this.type="Sprite",ur===void 0){ur=new Qe;let t=new Float32Array([-.5,-.5,0,0,0,.5,-.5,0,1,0,.5,.5,0,1,1,-.5,.5,0,0,1]),n=new gu(t,5);ur.setIndex([0,1,2,0,2,3]),ur.setAttribute("position",new il(n,3,0,!1)),ur.setAttribute("uv",new il(n,2,3,!1))}this.geometry=ur,this.material=e,this.center=new ue(.5,.5)}raycast(e,t){e.camera===null&&console.error('THREE.Sprite: "Raycaster.camera" needs to be set in order to raycast against sprites.'),dr.setFromMatrixScale(this.matrixWorld),Gp.copy(e.camera.matrixWorld),this.modelViewMatrix.multiplyMatrices(e.camera.matrixWorldInverse,this.matrixWorld),fr.setFromMatrixPosition(this.modelViewMatrix),e.camera.isPerspectiveCamera&&this.material.sizeAttenuation===!1&&dr.multiplyScalar(-fr.z);let n=this.material.rotation,s,r;n!==0&&(r=Math.cos(n),s=Math.sin(n));let a=this.center;Eo(_o.set(-.5,-.5,0),fr,a,dr,s,r),Eo(oa.set(.5,-.5,0),fr,a,dr,s,r),Eo(wo.set(.5,.5,0),fr,a,dr,s,r),Qf.set(0,0),ah.set(1,0),ep.set(1,1);let o=e.ray.intersectTriangle(_o,oa,wo,!1,ra);if(o===null&&(Eo(oa.set(-.5,.5,0),fr,a,dr,s,r),ah.set(0,1),o=e.ray.intersectTriangle(_o,wo,oa,!1,ra),o===null))return;let l=e.ray.origin.distanceTo(ra);l<e.near||l>e.far||t.push({distance:l,point:ra.clone(),uv:Zi.getInterpolation(ra,_o,oa,wo,Qf,ah,ep,new ue),face:null,object:this})}copy(e,t){return super.copy(e,t),e.center!==void 0&&this.center.copy(e.center),this.material=e.material,this}};function Eo(i,e,t,n,s,r){pr.subVectors(i,t).addScalar(.5).multiply(n),s!==void 0?(aa.x=r*pr.x-s*pr.y,aa.y=s*pr.x+r*pr.y):aa.copy(pr),i.copy(e),i.x+=aa.x,i.y+=aa.y,i.applyMatrix4(Gp)}var tp=new N,np=new yt,ip=new yt,q1=new N,sp=new Ge,To=new N,oh=new li,rp=new Ge,lh=new ya,sl=class extends he{constructor(e,t){super(e,t),this.isSkinnedMesh=!0,this.type="SkinnedMesh",this.bindMode=of,this.bindMatrix=new Ge,this.bindMatrixInverse=new Ge,this.boundingBox=null,this.boundingSphere=null}computeBoundingBox(){let e=this.geometry;this.boundingBox===null&&(this.boundingBox=new oi),this.boundingBox.makeEmpty();let t=e.getAttribute("position");for(let n=0;n<t.count;n++)this.getVertexPosition(n,To),this.boundingBox.expandByPoint(To)}computeBoundingSphere(){let e=this.geometry;this.boundingSphere===null&&(this.boundingSphere=new li),this.boundingSphere.makeEmpty();let t=e.getAttribute("position");for(let n=0;n<t.count;n++)this.getVertexPosition(n,To),this.boundingSphere.expandByPoint(To)}copy(e,t){return super.copy(e,t),this.bindMode=e.bindMode,this.bindMatrix.copy(e.bindMatrix),this.bindMatrixInverse.copy(e.bindMatrixInverse),this.skeleton=e.skeleton,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}raycast(e,t){let n=this.material,s=this.matrixWorld;n!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),oh.copy(this.boundingSphere),oh.applyMatrix4(s),e.ray.intersectsSphere(oh)!==!1&&(rp.copy(s).invert(),lh.copy(e.ray).applyMatrix4(rp),!(this.boundingBox!==null&&lh.intersectsBox(this.boundingBox)===!1)&&this._computeIntersections(e,t,lh)))}getVertexPosition(e,t){return super.getVertexPosition(e,t),this.applyBoneTransform(e,t),t}bind(e,t){this.skeleton=e,t===void 0&&(this.updateMatrixWorld(!0),this.skeleton.calculateInverses(),t=this.matrixWorld),this.bindMatrix.copy(t),this.bindMatrixInverse.copy(t).invert()}pose(){this.skeleton.pose()}normalizeSkinWeights(){let e=new yt,t=this.geometry.attributes.skinWeight;for(let n=0,s=t.count;n<s;n++){e.fromBufferAttribute(t,n);let r=1/e.manhattanLength();r!==1/0?e.multiplyScalar(r):e.set(1,0,0,0),t.setXYZW(n,e.x,e.y,e.z,e.w)}}updateMatrixWorld(e){super.updateMatrixWorld(e),this.bindMode===of?this.bindMatrixInverse.copy(this.matrixWorld).invert():this.bindMode===Hg?this.bindMatrixInverse.copy(this.bindMatrix).invert():console.warn("THREE.SkinnedMesh: Unrecognized bindMode: "+this.bindMode)}applyBoneTransform(e,t){let n=this.skeleton,s=this.geometry;np.fromBufferAttribute(s.attributes.skinIndex,e),ip.fromBufferAttribute(s.attributes.skinWeight,e),tp.copy(t).applyMatrix4(this.bindMatrix),t.set(0,0,0);for(let r=0;r<4;r++){let a=ip.getComponent(r);if(a!==0){let o=np.getComponent(r);sp.multiplyMatrices(n.bones[o].matrixWorld,n.boneInverses[o]),t.addScaledVector(q1.copy(tp).applyMatrix4(sp),a)}}return t.applyMatrix4(this.bindMatrixInverse)}},xa=class extends gt{constructor(){super(),this.isBone=!0,this.type="Bone"}},rl=class extends Sn{constructor(e=null,t=1,n=1,s,r,a,o,l,c=xn,h=xn,u,d){super(null,a,o,l,c,h,s,r,u,d),this.isDataTexture=!0,this.image={data:e,width:t,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}},ap=new Ge,$1=new Ge,al=class i{constructor(e=[],t=[]){this.uuid=ri(),this.bones=e.slice(0),this.boneInverses=t,this.boneMatrices=null,this.boneTexture=null,this.init()}init(){let e=this.bones,t=this.boneInverses;if(this.boneMatrices=new Float32Array(e.length*16),t.length===0)this.calculateInverses();else if(e.length!==t.length){console.warn("THREE.Skeleton: Number of inverse bone matrices does not match amount of bones."),this.boneInverses=[];for(let n=0,s=this.bones.length;n<s;n++)this.boneInverses.push(new Ge)}}calculateInverses(){this.boneInverses.length=0;for(let e=0,t=this.bones.length;e<t;e++){let n=new Ge;this.bones[e]&&n.copy(this.bones[e].matrixWorld).invert(),this.boneInverses.push(n)}}pose(){for(let e=0,t=this.bones.length;e<t;e++){let n=this.bones[e];n&&n.matrixWorld.copy(this.boneInverses[e]).invert()}for(let e=0,t=this.bones.length;e<t;e++){let n=this.bones[e];n&&(n.parent&&n.parent.isBone?(n.matrix.copy(n.parent.matrixWorld).invert(),n.matrix.multiply(n.matrixWorld)):n.matrix.copy(n.matrixWorld),n.matrix.decompose(n.position,n.quaternion,n.scale))}}update(){let e=this.bones,t=this.boneInverses,n=this.boneMatrices,s=this.boneTexture;for(let r=0,a=e.length;r<a;r++){let o=e[r]?e[r].matrixWorld:$1;ap.multiplyMatrices(o,t[r]),ap.toArray(n,r*16)}s!==null&&(s.needsUpdate=!0)}clone(){return new i(this.bones,this.boneInverses)}computeBoneTexture(){let e=Math.sqrt(this.bones.length*4);e=Math.ceil(e/4)*4,e=Math.max(e,4);let t=new Float32Array(e*e*4);t.set(this.boneMatrices);let n=new rl(t,e,e,Hn,Vn);return n.needsUpdate=!0,this.boneMatrices=t,this.boneTexture=n,this}getBoneByName(e){for(let t=0,n=this.bones.length;t<n;t++){let s=this.bones[t];if(s.name===e)return s}}dispose(){this.boneTexture!==null&&(this.boneTexture.dispose(),this.boneTexture=null)}fromJSON(e,t){this.uuid=e.uuid;for(let n=0,s=e.bones.length;n<s;n++){let r=e.bones[n],a=t[r];a===void 0&&(console.warn("THREE.Skeleton: No bone found with UUID:",r),a=new xa),this.bones.push(a),this.boneInverses.push(new Ge().fromArray(e.boneInverses[n]))}return this.init(),this}toJSON(){let e={metadata:{version:4.6,type:"Skeleton",generator:"Skeleton.toJSON"},bones:[],boneInverses:[]};e.uuid=this.uuid;let t=this.bones,n=this.boneInverses;for(let s=0,r=t.length;s<r;s++){let a=t[s];e.bones.push(a.uuid);let o=n[s];e.boneInverses.push(o.toArray())}return e}},ol=class extends Xe{constructor(e,t,n,s=1){super(e,t,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=s}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){let e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}},mr=new Ge,op=new Ge,Ao=[],lp=new oi,X1=new Ge,la=new he,ca=new li,Ei=class extends he{constructor(e,t,n){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new ol(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let s=0;s<n;s++)this.setMatrixAt(s,X1)}computeBoundingBox(){let e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new oi),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,mr),lp.copy(e.boundingBox).applyMatrix4(mr),this.boundingBox.union(lp)}computeBoundingSphere(){let e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new li),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,mr),ca.copy(e.boundingSphere).applyMatrix4(mr),this.boundingSphere.union(ca)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),e.morphTexture!==null&&(this.morphTexture=e.morphTexture.clone()),e.instanceColor!==null&&(this.instanceColor=e.instanceColor.clone()),this.count=e.count,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}getColorAt(e,t){t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){t.fromArray(this.instanceMatrix.array,e*16)}getMorphAt(e,t){let n=t.morphTargetInfluences,s=this.morphTexture.source.data.data,r=n.length+1,a=e*r+1;for(let o=0;o<n.length;o++)n[o]=s[a+o]}raycast(e,t){let n=this.matrixWorld,s=this.count;if(la.geometry=this.geometry,la.material=this.material,la.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),ca.copy(this.boundingSphere),ca.applyMatrix4(n),e.ray.intersectsSphere(ca)!==!1))for(let r=0;r<s;r++){this.getMatrixAt(r,mr),op.multiplyMatrices(n,mr),la.matrixWorld=op,la.raycast(e,Ao);for(let a=0,o=Ao.length;a<o;a++){let l=Ao[a];l.instanceId=r,l.object=this,t.push(l)}Ao.length=0}}setColorAt(e,t){this.instanceColor===null&&(this.instanceColor=new ol(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),t.toArray(this.instanceColor.array,e*3)}setMatrixAt(e,t){t.toArray(this.instanceMatrix.array,e*16)}setMorphAt(e,t){let n=t.morphTargetInfluences,s=n.length+1;this.morphTexture===null&&(this.morphTexture=new rl(new Float32Array(s*this.count),s,this.count,qu,Vn));let r=this.morphTexture.source.data.data,a=0;for(let c=0;c<n.length;c++)a+=n[c];let o=this.geometry.morphTargetsRelative?1:1-a,l=s*e;r[l]=o,r.set(n,l+1)}updateMorphTargets(){}dispose(){return this.dispatchEvent({type:"dispose"}),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null),this}};var Ti=class extends wi{constructor(e){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new de(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.size=e.size,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}},cp=new Ge,vu=new ya,Co=new li,Ro=new N,es=class extends gt{constructor(e=new Qe,t=new Ti){super(),this.isPoints=!0,this.type="Points",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}raycast(e,t){let n=this.geometry,s=this.matrixWorld,r=e.params.Points.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),Co.copy(n.boundingSphere),Co.applyMatrix4(s),Co.radius+=r,e.ray.intersectsSphere(Co)===!1)return;cp.copy(s).invert(),vu.copy(e.ray).applyMatrix4(cp);let o=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=n.index,u=n.attributes.position;if(c!==null){let d=Math.max(0,a.start),f=Math.min(c.count,a.start+a.count);for(let g=d,b=f;g<b;g++){let p=c.getX(g);Ro.fromBufferAttribute(u,p),hp(Ro,p,l,s,e,t,this)}}else{let d=Math.max(0,a.start),f=Math.min(u.count,a.start+a.count);for(let g=d,b=f;g<b;g++)Ro.fromBufferAttribute(u,g),hp(Ro,g,l,s,e,t,this)}}updateMorphTargets(){let t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){let s=t[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){let o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}};function hp(i,e,t,n,s,r,a){let o=vu.distanceSqToPoint(i);if(o<t){let l=new N;vu.closestPointToPoint(i,l),l.applyMatrix4(n);let c=s.ray.origin.distanceTo(l);if(c<s.near||c>s.far)return;r.push({distance:c,distanceToRay:Math.sqrt(o),point:l,index:e,face:null,faceIndex:null,barycoord:null,object:a})}}var Ft=class extends Sn{constructor(e,t,n,s,r,a,o,l,c){super(e,t,n,s,r,a,o,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}},Nn=class{constructor(){this.type="Curve",this.arcLengthDivisions=200}getPoint(){return console.warn("THREE.Curve: .getPoint() not implemented."),null}getPointAt(e,t){let n=this.getUtoTmapping(e);return this.getPoint(n,t)}getPoints(e=5){let t=[];for(let n=0;n<=e;n++)t.push(this.getPoint(n/e));return t}getSpacedPoints(e=5){let t=[];for(let n=0;n<=e;n++)t.push(this.getPointAt(n/e));return t}getLength(){let e=this.getLengths();return e[e.length-1]}getLengths(e=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===e+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;let t=[],n,s=this.getPoint(0),r=0;t.push(0);for(let a=1;a<=e;a++)n=this.getPoint(a/e),r+=n.distanceTo(s),t.push(r),s=n;return this.cacheArcLengths=t,t}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(e,t){let n=this.getLengths(),s=0,r=n.length,a;t?a=t:a=e*n[r-1];let o=0,l=r-1,c;for(;o<=l;)if(s=Math.floor(o+(l-o)/2),c=n[s]-a,c<0)o=s+1;else if(c>0)l=s-1;else{l=s;break}if(s=l,n[s]===a)return s/(r-1);let h=n[s],d=n[s+1]-h,f=(a-h)/d;return(s+f)/(r-1)}getTangent(e,t){let s=e-1e-4,r=e+1e-4;s<0&&(s=0),r>1&&(r=1);let a=this.getPoint(s),o=this.getPoint(r),l=t||(a.isVector2?new ue:new N);return l.copy(o).sub(a).normalize(),l}getTangentAt(e,t){let n=this.getUtoTmapping(e);return this.getTangent(n,t)}computeFrenetFrames(e,t){let n=new N,s=[],r=[],a=[],o=new N,l=new Ge;for(let f=0;f<=e;f++){let g=f/e;s[f]=this.getTangentAt(g,new N)}r[0]=new N,a[0]=new N;let c=Number.MAX_VALUE,h=Math.abs(s[0].x),u=Math.abs(s[0].y),d=Math.abs(s[0].z);h<=c&&(c=h,n.set(1,0,0)),u<=c&&(c=u,n.set(0,1,0)),d<=c&&n.set(0,0,1),o.crossVectors(s[0],n).normalize(),r[0].crossVectors(s[0],o),a[0].crossVectors(s[0],r[0]);for(let f=1;f<=e;f++){if(r[f]=r[f-1].clone(),a[f]=a[f-1].clone(),o.crossVectors(s[f-1],s[f]),o.length()>Number.EPSILON){o.normalize();let g=Math.acos(nn(s[f-1].dot(s[f]),-1,1));r[f].applyMatrix4(l.makeRotationAxis(o,g))}a[f].crossVectors(s[f],r[f])}if(t===!0){let f=Math.acos(nn(r[0].dot(r[e]),-1,1));f/=e,s[0].dot(o.crossVectors(r[0],r[e]))>0&&(f=-f);for(let g=1;g<=e;g++)r[g].applyMatrix4(l.makeRotationAxis(s[g],f*g)),a[g].crossVectors(s[g],r[g])}return{tangents:s,normals:r,binormals:a}}clone(){return new this.constructor().copy(this)}copy(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}toJSON(){let e={metadata:{version:4.6,type:"Curve",generator:"Curve.toJSON"}};return e.arcLengthDivisions=this.arcLengthDivisions,e.type=this.type,e}fromJSON(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}},Sa=class extends Nn{constructor(e=0,t=0,n=1,s=1,r=0,a=Math.PI*2,o=!1,l=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=e,this.aY=t,this.xRadius=n,this.yRadius=s,this.aStartAngle=r,this.aEndAngle=a,this.aClockwise=o,this.aRotation=l}getPoint(e,t=new ue){let n=t,s=Math.PI*2,r=this.aEndAngle-this.aStartAngle,a=Math.abs(r)<Number.EPSILON;for(;r<0;)r+=s;for(;r>s;)r-=s;r<Number.EPSILON&&(a?r=0:r=s),this.aClockwise===!0&&!a&&(r===s?r=-s:r=r-s);let o=this.aStartAngle+e*r,l=this.aX+this.xRadius*Math.cos(o),c=this.aY+this.yRadius*Math.sin(o);if(this.aRotation!==0){let h=Math.cos(this.aRotation),u=Math.sin(this.aRotation),d=l-this.aX,f=c-this.aY;l=d*h-f*u+this.aX,c=d*u+f*h+this.aY}return n.set(l,c)}copy(e){return super.copy(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}toJSON(){let e=super.toJSON();return e.aX=this.aX,e.aY=this.aY,e.xRadius=this.xRadius,e.yRadius=this.yRadius,e.aStartAngle=this.aStartAngle,e.aEndAngle=this.aEndAngle,e.aClockwise=this.aClockwise,e.aRotation=this.aRotation,e}fromJSON(e){return super.fromJSON(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}},yu=class extends Sa{constructor(e,t,n,s,r,a){super(e,t,n,n,s,r,a),this.isArcCurve=!0,this.type="ArcCurve"}};function Ju(){let i=0,e=0,t=0,n=0;function s(r,a,o,l){i=r,e=o,t=-3*r+3*a-2*o-l,n=2*r-2*a+o+l}return{initCatmullRom:function(r,a,o,l,c){s(a,o,c*(o-r),c*(l-a))},initNonuniformCatmullRom:function(r,a,o,l,c,h,u){let d=(a-r)/c-(o-r)/(c+h)+(o-a)/h,f=(o-a)/h-(l-a)/(h+u)+(l-o)/u;d*=h,f*=h,s(a,o,d,f)},calc:function(r){let a=r*r,o=a*r;return i+e*r+t*a+n*o}}}var Po=new N,ch=new Ju,hh=new Ju,uh=new Ju,bu=class extends Nn{constructor(e=[],t=!1,n="centripetal",s=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=e,this.closed=t,this.curveType=n,this.tension=s}getPoint(e,t=new N){let n=t,s=this.points,r=s.length,a=(r-(this.closed?0:1))*e,o=Math.floor(a),l=a-o;this.closed?o+=o>0?0:(Math.floor(Math.abs(o)/r)+1)*r:l===0&&o===r-1&&(o=r-2,l=1);let c,h;this.closed||o>0?c=s[(o-1)%r]:(Po.subVectors(s[0],s[1]).add(s[0]),c=Po);let u=s[o%r],d=s[(o+1)%r];if(this.closed||o+2<r?h=s[(o+2)%r]:(Po.subVectors(s[r-1],s[r-2]).add(s[r-1]),h=Po),this.curveType==="centripetal"||this.curveType==="chordal"){let f=this.curveType==="chordal"?.5:.25,g=Math.pow(c.distanceToSquared(u),f),b=Math.pow(u.distanceToSquared(d),f),p=Math.pow(d.distanceToSquared(h),f);b<1e-4&&(b=1),g<1e-4&&(g=b),p<1e-4&&(p=b),ch.initNonuniformCatmullRom(c.x,u.x,d.x,h.x,g,b,p),hh.initNonuniformCatmullRom(c.y,u.y,d.y,h.y,g,b,p),uh.initNonuniformCatmullRom(c.z,u.z,d.z,h.z,g,b,p)}else this.curveType==="catmullrom"&&(ch.initCatmullRom(c.x,u.x,d.x,h.x,this.tension),hh.initCatmullRom(c.y,u.y,d.y,h.y,this.tension),uh.initCatmullRom(c.z,u.z,d.z,h.z,this.tension));return n.set(ch.calc(l),hh.calc(l),uh.calc(l)),n}copy(e){super.copy(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let s=e.points[t];this.points.push(s.clone())}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,n=this.points.length;t<n;t++){let s=this.points[t];e.points.push(s.toArray())}return e.closed=this.closed,e.curveType=this.curveType,e.tension=this.tension,e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let s=e.points[t];this.points.push(new N().fromArray(s))}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}};function up(i,e,t,n,s){let r=(n-e)*.5,a=(s-t)*.5,o=i*i,l=i*o;return(2*t-2*n+r+a)*l+(-3*t+3*n-2*r-a)*o+r*i+t}function Y1(i,e){let t=1-i;return t*t*e}function K1(i,e){return 2*(1-i)*i*e}function Z1(i,e){return i*i*e}function fa(i,e,t,n){return Y1(i,e)+K1(i,t)+Z1(i,n)}function J1(i,e){let t=1-i;return t*t*t*e}function j1(i,e){let t=1-i;return 3*t*t*i*e}function Q1(i,e){return 3*(1-i)*i*i*e}function eS(i,e){return i*i*i*e}function pa(i,e,t,n,s){return J1(i,e)+j1(i,t)+Q1(i,n)+eS(i,s)}var ll=class extends Nn{constructor(e=new ue,t=new ue,n=new ue,s=new ue){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=e,this.v1=t,this.v2=n,this.v3=s}getPoint(e,t=new ue){let n=t,s=this.v0,r=this.v1,a=this.v2,o=this.v3;return n.set(pa(e,s.x,r.x,a.x,o.x),pa(e,s.y,r.y,a.y,o.y)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},xu=class extends Nn{constructor(e=new N,t=new N,n=new N,s=new N){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=e,this.v1=t,this.v2=n,this.v3=s}getPoint(e,t=new N){let n=t,s=this.v0,r=this.v1,a=this.v2,o=this.v3;return n.set(pa(e,s.x,r.x,a.x,o.x),pa(e,s.y,r.y,a.y,o.y),pa(e,s.z,r.z,a.z,o.z)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},cl=class extends Nn{constructor(e=new ue,t=new ue){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=e,this.v2=t}getPoint(e,t=new ue){let n=t;return e===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(e).add(this.v1)),n}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new ue){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},Su=class extends Nn{constructor(e=new N,t=new N){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=e,this.v2=t}getPoint(e,t=new N){let n=t;return e===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(e).add(this.v1)),n}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new N){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},hl=class extends Nn{constructor(e=new ue,t=new ue,n=new ue){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=e,this.v1=t,this.v2=n}getPoint(e,t=new ue){let n=t,s=this.v0,r=this.v1,a=this.v2;return n.set(fa(e,s.x,r.x,a.x),fa(e,s.y,r.y,a.y)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},Mu=class extends Nn{constructor(e=new N,t=new N,n=new N){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=e,this.v1=t,this.v2=n}getPoint(e,t=new N){let n=t,s=this.v0,r=this.v1,a=this.v2;return n.set(fa(e,s.x,r.x,a.x),fa(e,s.y,r.y,a.y),fa(e,s.z,r.z,a.z)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},ul=class extends Nn{constructor(e=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=e}getPoint(e,t=new ue){let n=t,s=this.points,r=(s.length-1)*e,a=Math.floor(r),o=r-a,l=s[a===0?a:a-1],c=s[a],h=s[a>s.length-2?s.length-1:a+1],u=s[a>s.length-3?s.length-1:a+2];return n.set(up(o,l.x,c.x,h.x,u.x),up(o,l.y,c.y,h.y,u.y)),n}copy(e){super.copy(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let s=e.points[t];this.points.push(s.clone())}return this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,n=this.points.length;t<n;t++){let s=this.points[t];e.points.push(s.toArray())}return e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let s=e.points[t];this.points.push(new ue().fromArray(s))}return this}},dp=Object.freeze({__proto__:null,ArcCurve:yu,CatmullRomCurve3:bu,CubicBezierCurve:ll,CubicBezierCurve3:xu,EllipseCurve:Sa,LineCurve:cl,LineCurve3:Su,QuadraticBezierCurve:hl,QuadraticBezierCurve3:Mu,SplineCurve:ul}),_u=class extends Nn{constructor(){super(),this.type="CurvePath",this.curves=[],this.autoClose=!1}add(e){this.curves.push(e)}closePath(){let e=this.curves[0].getPoint(0),t=this.curves[this.curves.length-1].getPoint(1);if(!e.equals(t)){let n=e.isVector2===!0?"LineCurve":"LineCurve3";this.curves.push(new dp[n](t,e))}return this}getPoint(e,t){let n=e*this.getLength(),s=this.getCurveLengths(),r=0;for(;r<s.length;){if(s[r]>=n){let a=s[r]-n,o=this.curves[r],l=o.getLength(),c=l===0?0:1-a/l;return o.getPointAt(c,t)}r++}return null}getLength(){let e=this.getCurveLengths();return e[e.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;let e=[],t=0;for(let n=0,s=this.curves.length;n<s;n++)t+=this.curves[n].getLength(),e.push(t);return this.cacheLengths=e,e}getSpacedPoints(e=40){let t=[];for(let n=0;n<=e;n++)t.push(this.getPoint(n/e));return this.autoClose&&t.push(t[0]),t}getPoints(e=12){let t=[],n;for(let s=0,r=this.curves;s<r.length;s++){let a=r[s],o=a.isEllipseCurve?e*2:a.isLineCurve||a.isLineCurve3?1:a.isSplineCurve?e*a.points.length:e,l=a.getPoints(o);for(let c=0;c<l.length;c++){let h=l[c];n&&n.equals(h)||(t.push(h),n=h)}}return this.autoClose&&t.length>1&&!t[t.length-1].equals(t[0])&&t.push(t[0]),t}copy(e){super.copy(e),this.curves=[];for(let t=0,n=e.curves.length;t<n;t++){let s=e.curves[t];this.curves.push(s.clone())}return this.autoClose=e.autoClose,this}toJSON(){let e=super.toJSON();e.autoClose=this.autoClose,e.curves=[];for(let t=0,n=this.curves.length;t<n;t++){let s=this.curves[t];e.curves.push(s.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.autoClose=e.autoClose,this.curves=[];for(let t=0,n=e.curves.length;t<n;t++){let s=e.curves[t];this.curves.push(new dp[s.type]().fromJSON(s))}return this}},Ma=class extends _u{constructor(e){super(),this.type="Path",this.currentPoint=new ue,e&&this.setFromPoints(e)}setFromPoints(e){this.moveTo(e[0].x,e[0].y);for(let t=1,n=e.length;t<n;t++)this.lineTo(e[t].x,e[t].y);return this}moveTo(e,t){return this.currentPoint.set(e,t),this}lineTo(e,t){let n=new cl(this.currentPoint.clone(),new ue(e,t));return this.curves.push(n),this.currentPoint.set(e,t),this}quadraticCurveTo(e,t,n,s){let r=new hl(this.currentPoint.clone(),new ue(e,t),new ue(n,s));return this.curves.push(r),this.currentPoint.set(n,s),this}bezierCurveTo(e,t,n,s,r,a){let o=new ll(this.currentPoint.clone(),new ue(e,t),new ue(n,s),new ue(r,a));return this.curves.push(o),this.currentPoint.set(r,a),this}splineThru(e){let t=[this.currentPoint.clone()].concat(e),n=new ul(t);return this.curves.push(n),this.currentPoint.copy(e[e.length-1]),this}arc(e,t,n,s,r,a){let o=this.currentPoint.x,l=this.currentPoint.y;return this.absarc(e+o,t+l,n,s,r,a),this}absarc(e,t,n,s,r,a){return this.absellipse(e,t,n,n,s,r,a),this}ellipse(e,t,n,s,r,a,o,l){let c=this.currentPoint.x,h=this.currentPoint.y;return this.absellipse(e+c,t+h,n,s,r,a,o,l),this}absellipse(e,t,n,s,r,a,o,l){let c=new Sa(e,t,n,s,r,a,o,l);if(this.curves.length>0){let u=c.getPoint(0);u.equals(this.currentPoint)||this.lineTo(u.x,u.y)}this.curves.push(c);let h=c.getPoint(1);return this.currentPoint.copy(h),this}copy(e){return super.copy(e),this.currentPoint.copy(e.currentPoint),this}toJSON(){let e=super.toJSON();return e.currentPoint=this.currentPoint.toArray(),e}fromJSON(e){return super.fromJSON(e),this.currentPoint.fromArray(e.currentPoint),this}},wu=class i extends Qe{constructor(e=[new ue(0,-.5),new ue(.5,0),new ue(0,.5)],t=12,n=0,s=Math.PI*2){super(),this.type="LatheGeometry",this.parameters={points:e,segments:t,phiStart:n,phiLength:s},t=Math.floor(t),s=nn(s,0,Math.PI*2);let r=[],a=[],o=[],l=[],c=[],h=1/t,u=new N,d=new ue,f=new N,g=new N,b=new N,p=0,m=0;for(let x=0;x<=e.length-1;x++)switch(x){case 0:p=e[x+1].x-e[x].x,m=e[x+1].y-e[x].y,f.x=m*1,f.y=-p,f.z=m*0,b.copy(f),f.normalize(),l.push(f.x,f.y,f.z);break;case e.length-1:l.push(b.x,b.y,b.z);break;default:p=e[x+1].x-e[x].x,m=e[x+1].y-e[x].y,f.x=m*1,f.y=-p,f.z=m*0,g.copy(f),f.x+=b.x,f.y+=b.y,f.z+=b.z,f.normalize(),l.push(f.x,f.y,f.z),b.copy(g)}for(let x=0;x<=t;x++){let v=n+x*h*s,y=Math.sin(v),w=Math.cos(v);for(let _=0;_<=e.length-1;_++){u.x=e[_].x*y,u.y=e[_].y,u.z=e[_].x*w,a.push(u.x,u.y,u.z),d.x=x/t,d.y=_/(e.length-1),o.push(d.x,d.y);let M=l[3*_+0]*y,T=l[3*_+1],L=l[3*_+0]*w;c.push(M,T,L)}}for(let x=0;x<t;x++)for(let v=0;v<e.length-1;v++){let y=v+x*e.length,w=y,_=y+e.length,M=y+e.length+1,T=y+1;r.push(w,_,T),r.push(M,T,_)}this.setIndex(r),this.setAttribute("position",new He(a,3)),this.setAttribute("uv",new He(o,2)),this.setAttribute("normal",new He(c,3))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.points,e.segments,e.phiStart,e.phiLength)}},dl=class i extends wu{constructor(e=1,t=1,n=4,s=8){let r=new Ma;r.absarc(0,-t/2,e,Math.PI*1.5,0),r.absarc(0,t/2,e,0,Math.PI*.5),super(r.getPoints(n),s),this.type="CapsuleGeometry",this.parameters={radius:e,length:t,capSegments:n,radialSegments:s}}static fromJSON(e){return new i(e.radius,e.length,e.capSegments,e.radialSegments)}},ci=class i extends Qe{constructor(e=1,t=32,n=0,s=Math.PI*2){super(),this.type="CircleGeometry",this.parameters={radius:e,segments:t,thetaStart:n,thetaLength:s},t=Math.max(3,t);let r=[],a=[],o=[],l=[],c=new N,h=new ue;a.push(0,0,0),o.push(0,0,1),l.push(.5,.5);for(let u=0,d=3;u<=t;u++,d+=3){let f=n+u/t*s;c.x=e*Math.cos(f),c.y=e*Math.sin(f),a.push(c.x,c.y,c.z),o.push(0,0,1),h.x=(a[d]/e+1)/2,h.y=(a[d+1]/e+1)/2,l.push(h.x,h.y)}for(let u=1;u<=t;u++)r.push(u,u+1,0);this.setIndex(r),this.setAttribute("position",new He(a,3)),this.setAttribute("normal",new He(o,3)),this.setAttribute("uv",new He(l,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.radius,e.segments,e.thetaStart,e.thetaLength)}},Ct=class i extends Qe{constructor(e=1,t=1,n=1,s=32,r=1,a=!1,o=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:t,height:n,radialSegments:s,heightSegments:r,openEnded:a,thetaStart:o,thetaLength:l};let c=this;s=Math.floor(s),r=Math.floor(r);let h=[],u=[],d=[],f=[],g=0,b=[],p=n/2,m=0;x(),a===!1&&(e>0&&v(!0),t>0&&v(!1)),this.setIndex(h),this.setAttribute("position",new He(u,3)),this.setAttribute("normal",new He(d,3)),this.setAttribute("uv",new He(f,2));function x(){let y=new N,w=new N,_=0,M=(t-e)/n;for(let T=0;T<=r;T++){let L=[],S=T/r,E=S*(t-e)+e;for(let D=0;D<=s;D++){let O=D/s,F=O*l+o,W=Math.sin(F),B=Math.cos(F);w.x=E*W,w.y=-S*n+p,w.z=E*B,u.push(w.x,w.y,w.z),y.set(W,M,B).normalize(),d.push(y.x,y.y,y.z),f.push(O,1-S),L.push(g++)}b.push(L)}for(let T=0;T<s;T++)for(let L=0;L<r;L++){let S=b[L][T],E=b[L+1][T],D=b[L+1][T+1],O=b[L][T+1];e>0&&(h.push(S,E,O),_+=3),t>0&&(h.push(E,D,O),_+=3)}c.addGroup(m,_,0),m+=_}function v(y){let w=g,_=new ue,M=new N,T=0,L=y===!0?e:t,S=y===!0?1:-1;for(let D=1;D<=s;D++)u.push(0,p*S,0),d.push(0,S,0),f.push(.5,.5),g++;let E=g;for(let D=0;D<=s;D++){let F=D/s*l+o,W=Math.cos(F),B=Math.sin(F);M.x=L*B,M.y=p*S,M.z=L*W,u.push(M.x,M.y,M.z),d.push(0,S,0),_.x=W*.5+.5,_.y=B*.5*S+.5,f.push(_.x,_.y),g++}for(let D=0;D<s;D++){let O=w+D,F=E+D;y===!0?h.push(F,F+1,O):h.push(F+1,F,O),T+=3}c.addGroup(m,T,y===!0?1:2),m+=T}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}},Cs=class i extends Ct{constructor(e=1,t=1,n=32,s=1,r=!1,a=0,o=Math.PI*2){super(0,e,t,n,s,r,a,o),this.type="ConeGeometry",this.parameters={radius:e,height:t,radialSegments:n,heightSegments:s,openEnded:r,thetaStart:a,thetaLength:o}}static fromJSON(e){return new i(e.radius,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}},fl=class i extends Qe{constructor(e=[],t=[],n=1,s=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:e,indices:t,radius:n,detail:s};let r=[],a=[];o(s),c(n),h(),this.setAttribute("position",new He(r,3)),this.setAttribute("normal",new He(r.slice(),3)),this.setAttribute("uv",new He(a,2)),s===0?this.computeVertexNormals():this.normalizeNormals();function o(x){let v=new N,y=new N,w=new N;for(let _=0;_<t.length;_+=3)f(t[_+0],v),f(t[_+1],y),f(t[_+2],w),l(v,y,w,x)}function l(x,v,y,w){let _=w+1,M=[];for(let T=0;T<=_;T++){M[T]=[];let L=x.clone().lerp(y,T/_),S=v.clone().lerp(y,T/_),E=_-T;for(let D=0;D<=E;D++)D===0&&T===_?M[T][D]=L:M[T][D]=L.clone().lerp(S,D/E)}for(let T=0;T<_;T++)for(let L=0;L<2*(_-T)-1;L++){let S=Math.floor(L/2);L%2===0?(d(M[T][S+1]),d(M[T+1][S]),d(M[T][S])):(d(M[T][S+1]),d(M[T+1][S+1]),d(M[T+1][S]))}}function c(x){let v=new N;for(let y=0;y<r.length;y+=3)v.x=r[y+0],v.y=r[y+1],v.z=r[y+2],v.normalize().multiplyScalar(x),r[y+0]=v.x,r[y+1]=v.y,r[y+2]=v.z}function h(){let x=new N;for(let v=0;v<r.length;v+=3){x.x=r[v+0],x.y=r[v+1],x.z=r[v+2];let y=p(x)/2/Math.PI+.5,w=m(x)/Math.PI+.5;a.push(y,1-w)}g(),u()}function u(){for(let x=0;x<a.length;x+=6){let v=a[x+0],y=a[x+2],w=a[x+4],_=Math.max(v,y,w),M=Math.min(v,y,w);_>.9&&M<.1&&(v<.2&&(a[x+0]+=1),y<.2&&(a[x+2]+=1),w<.2&&(a[x+4]+=1))}}function d(x){r.push(x.x,x.y,x.z)}function f(x,v){let y=x*3;v.x=e[y+0],v.y=e[y+1],v.z=e[y+2]}function g(){let x=new N,v=new N,y=new N,w=new N,_=new ue,M=new ue,T=new ue;for(let L=0,S=0;L<r.length;L+=9,S+=6){x.set(r[L+0],r[L+1],r[L+2]),v.set(r[L+3],r[L+4],r[L+5]),y.set(r[L+6],r[L+7],r[L+8]),_.set(a[S+0],a[S+1]),M.set(a[S+2],a[S+3]),T.set(a[S+4],a[S+5]),w.copy(x).add(v).add(y).divideScalar(3);let E=p(w);b(_,S+0,x,E),b(M,S+2,v,E),b(T,S+4,y,E)}}function b(x,v,y,w){w<0&&x.x===1&&(a[v]=x.x-1),y.x===0&&y.z===0&&(a[v]=w/2/Math.PI+.5)}function p(x){return Math.atan2(x.z,-x.x)}function m(x){return Math.atan2(-x.y,Math.sqrt(x.x*x.x+x.z*x.z))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.vertices,e.indices,e.radius,e.details)}},Pr=class i extends fl{constructor(e=1,t=0){let n=(1+Math.sqrt(5))/2,s=1/n,r=[-1,-1,-1,-1,-1,1,-1,1,-1,-1,1,1,1,-1,-1,1,-1,1,1,1,-1,1,1,1,0,-s,-n,0,-s,n,0,s,-n,0,s,n,-s,-n,0,-s,n,0,s,-n,0,s,n,0,-n,0,-s,n,0,-s,-n,0,s,n,0,s],a=[3,11,7,3,7,15,3,15,13,7,19,17,7,17,6,7,6,15,17,4,8,17,8,10,17,10,6,8,0,16,8,16,2,8,2,10,0,12,1,0,1,18,0,18,16,6,10,2,6,2,13,6,13,15,2,16,18,2,18,3,2,3,13,18,1,9,18,9,11,18,11,3,4,14,12,4,12,0,4,0,8,11,9,5,11,5,19,11,19,7,19,5,14,19,14,4,19,4,17,1,12,14,1,14,5,1,5,9];super(r,a,e,t),this.type="DodecahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new i(e.radius,e.detail)}};var _a=class extends Ma{constructor(e){super(e),this.uuid=ri(),this.type="Shape",this.holes=[]}getPointsHoles(e){let t=[];for(let n=0,s=this.holes.length;n<s;n++)t[n]=this.holes[n].getPoints(e);return t}extractPoints(e){return{shape:this.getPoints(e),holes:this.getPointsHoles(e)}}copy(e){super.copy(e),this.holes=[];for(let t=0,n=e.holes.length;t<n;t++){let s=e.holes[t];this.holes.push(s.clone())}return this}toJSON(){let e=super.toJSON();e.uuid=this.uuid,e.holes=[];for(let t=0,n=this.holes.length;t<n;t++){let s=this.holes[t];e.holes.push(s.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.uuid=e.uuid,this.holes=[];for(let t=0,n=e.holes.length;t<n;t++){let s=e.holes[t];this.holes.push(new Ma().fromJSON(s))}return this}},tS={triangulate:function(i,e,t=2){let n=e&&e.length,s=n?e[0]*t:i.length,r=Vp(i,0,s,t,!0),a=[];if(!r||r.next===r.prev)return a;let o,l,c,h,u,d,f;if(n&&(r=aS(i,e,r,t)),i.length>80*t){o=c=i[0],l=h=i[1];for(let g=t;g<s;g+=t)u=i[g],d=i[g+1],u<o&&(o=u),d<l&&(l=d),u>c&&(c=u),d>h&&(h=d);f=Math.max(c-o,h-l),f=f!==0?32767/f:0}return wa(r,a,t,o,l,f,0),a}};function Vp(i,e,t,n,s){let r,a;if(s===vS(i,e,t,n)>0)for(r=e;r<t;r+=n)a=fp(r,i[r],i[r+1],a);else for(r=t-n;r>=e;r-=n)a=fp(r,i[r],i[r+1],a);return a&&_l(a,a.next)&&(Ta(a),a=a.next),a}function Rs(i,e){if(!i)return i;e||(e=i);let t=i,n;do if(n=!1,!t.steiner&&(_l(t,t.next)||Dt(t.prev,t,t.next)===0)){if(Ta(t),t=e=t.prev,t===t.next)break;n=!0}else t=t.next;while(n||t!==e);return e}function wa(i,e,t,n,s,r,a){if(!i)return;!a&&r&&uS(i,n,s,r);let o=i,l,c;for(;i.prev!==i.next;){if(l=i.prev,c=i.next,r?iS(i,n,s,r):nS(i)){e.push(l.i/t|0),e.push(i.i/t|0),e.push(c.i/t|0),Ta(i),i=c.next,o=c.next;continue}if(i=c,i===o){a?a===1?(i=sS(Rs(i),e,t),wa(i,e,t,n,s,r,2)):a===2&&rS(i,e,t,n,s,r):wa(Rs(i),e,t,n,s,r,1);break}}}function nS(i){let e=i.prev,t=i,n=i.next;if(Dt(e,t,n)>=0)return!1;let s=e.x,r=t.x,a=n.x,o=e.y,l=t.y,c=n.y,h=s<r?s<a?s:a:r<a?r:a,u=o<l?o<c?o:c:l<c?l:c,d=s>r?s>a?s:a:r>a?r:a,f=o>l?o>c?o:c:l>c?l:c,g=n.next;for(;g!==e;){if(g.x>=h&&g.x<=d&&g.y>=u&&g.y<=f&&vr(s,o,r,l,a,c,g.x,g.y)&&Dt(g.prev,g,g.next)>=0)return!1;g=g.next}return!0}function iS(i,e,t,n){let s=i.prev,r=i,a=i.next;if(Dt(s,r,a)>=0)return!1;let o=s.x,l=r.x,c=a.x,h=s.y,u=r.y,d=a.y,f=o<l?o<c?o:c:l<c?l:c,g=h<u?h<d?h:d:u<d?u:d,b=o>l?o>c?o:c:l>c?l:c,p=h>u?h>d?h:d:u>d?u:d,m=Eu(f,g,e,t,n),x=Eu(b,p,e,t,n),v=i.prevZ,y=i.nextZ;for(;v&&v.z>=m&&y&&y.z<=x;){if(v.x>=f&&v.x<=b&&v.y>=g&&v.y<=p&&v!==s&&v!==a&&vr(o,h,l,u,c,d,v.x,v.y)&&Dt(v.prev,v,v.next)>=0||(v=v.prevZ,y.x>=f&&y.x<=b&&y.y>=g&&y.y<=p&&y!==s&&y!==a&&vr(o,h,l,u,c,d,y.x,y.y)&&Dt(y.prev,y,y.next)>=0))return!1;y=y.nextZ}for(;v&&v.z>=m;){if(v.x>=f&&v.x<=b&&v.y>=g&&v.y<=p&&v!==s&&v!==a&&vr(o,h,l,u,c,d,v.x,v.y)&&Dt(v.prev,v,v.next)>=0)return!1;v=v.prevZ}for(;y&&y.z<=x;){if(y.x>=f&&y.x<=b&&y.y>=g&&y.y<=p&&y!==s&&y!==a&&vr(o,h,l,u,c,d,y.x,y.y)&&Dt(y.prev,y,y.next)>=0)return!1;y=y.nextZ}return!0}function sS(i,e,t){let n=i;do{let s=n.prev,r=n.next.next;!_l(s,r)&&Wp(s,n,n.next,r)&&Ea(s,r)&&Ea(r,s)&&(e.push(s.i/t|0),e.push(n.i/t|0),e.push(r.i/t|0),Ta(n),Ta(n.next),n=i=r),n=n.next}while(n!==i);return Rs(n)}function rS(i,e,t,n,s,r){let a=i;do{let o=a.next.next;for(;o!==a.prev;){if(a.i!==o.i&&pS(a,o)){let l=qp(a,o);a=Rs(a,a.next),l=Rs(l,l.next),wa(a,e,t,n,s,r,0),wa(l,e,t,n,s,r,0);return}o=o.next}a=a.next}while(a!==i)}function aS(i,e,t,n){let s=[],r,a,o,l,c;for(r=0,a=e.length;r<a;r++)o=e[r]*n,l=r<a-1?e[r+1]*n:i.length,c=Vp(i,o,l,n,!1),c===c.next&&(c.steiner=!0),s.push(fS(c));for(s.sort(oS),r=0;r<s.length;r++)t=lS(s[r],t);return t}function oS(i,e){return i.x-e.x}function lS(i,e){let t=cS(i,e);if(!t)return e;let n=qp(t,i);return Rs(n,n.next),Rs(t,t.next)}function cS(i,e){let t=e,n=-1/0,s,r=i.x,a=i.y;do{if(a<=t.y&&a>=t.next.y&&t.next.y!==t.y){let d=t.x+(a-t.y)*(t.next.x-t.x)/(t.next.y-t.y);if(d<=r&&d>n&&(n=d,s=t.x<t.next.x?t:t.next,d===r))return s}t=t.next}while(t!==e);if(!s)return null;let o=s,l=s.x,c=s.y,h=1/0,u;t=s;do r>=t.x&&t.x>=l&&r!==t.x&&vr(a<c?r:n,a,l,c,a<c?n:r,a,t.x,t.y)&&(u=Math.abs(a-t.y)/(r-t.x),Ea(t,i)&&(u<h||u===h&&(t.x>s.x||t.x===s.x&&hS(s,t)))&&(s=t,h=u)),t=t.next;while(t!==o);return s}function hS(i,e){return Dt(i.prev,i,e.prev)<0&&Dt(e.next,i,i.next)<0}function uS(i,e,t,n){let s=i;do s.z===0&&(s.z=Eu(s.x,s.y,e,t,n)),s.prevZ=s.prev,s.nextZ=s.next,s=s.next;while(s!==i);s.prevZ.nextZ=null,s.prevZ=null,dS(s)}function dS(i){let e,t,n,s,r,a,o,l,c=1;do{for(t=i,i=null,r=null,a=0;t;){for(a++,n=t,o=0,e=0;e<c&&(o++,n=n.nextZ,!!n);e++);for(l=c;o>0||l>0&&n;)o!==0&&(l===0||!n||t.z<=n.z)?(s=t,t=t.nextZ,o--):(s=n,n=n.nextZ,l--),r?r.nextZ=s:i=s,s.prevZ=r,r=s;t=n}r.nextZ=null,c*=2}while(a>1);return i}function Eu(i,e,t,n,s){return i=(i-t)*s|0,e=(e-n)*s|0,i=(i|i<<8)&16711935,i=(i|i<<4)&252645135,i=(i|i<<2)&858993459,i=(i|i<<1)&1431655765,e=(e|e<<8)&16711935,e=(e|e<<4)&252645135,e=(e|e<<2)&858993459,e=(e|e<<1)&1431655765,i|e<<1}function fS(i){let e=i,t=i;do(e.x<t.x||e.x===t.x&&e.y<t.y)&&(t=e),e=e.next;while(e!==i);return t}function vr(i,e,t,n,s,r,a,o){return(s-a)*(e-o)>=(i-a)*(r-o)&&(i-a)*(n-o)>=(t-a)*(e-o)&&(t-a)*(r-o)>=(s-a)*(n-o)}function pS(i,e){return i.next.i!==e.i&&i.prev.i!==e.i&&!mS(i,e)&&(Ea(i,e)&&Ea(e,i)&&gS(i,e)&&(Dt(i.prev,i,e.prev)||Dt(i,e.prev,e))||_l(i,e)&&Dt(i.prev,i,i.next)>0&&Dt(e.prev,e,e.next)>0)}function Dt(i,e,t){return(e.y-i.y)*(t.x-e.x)-(e.x-i.x)*(t.y-e.y)}function _l(i,e){return i.x===e.x&&i.y===e.y}function Wp(i,e,t,n){let s=Lo(Dt(i,e,t)),r=Lo(Dt(i,e,n)),a=Lo(Dt(t,n,i)),o=Lo(Dt(t,n,e));return!!(s!==r&&a!==o||s===0&&Io(i,t,e)||r===0&&Io(i,n,e)||a===0&&Io(t,i,n)||o===0&&Io(t,e,n))}function Io(i,e,t){return e.x<=Math.max(i.x,t.x)&&e.x>=Math.min(i.x,t.x)&&e.y<=Math.max(i.y,t.y)&&e.y>=Math.min(i.y,t.y)}function Lo(i){return i>0?1:i<0?-1:0}function mS(i,e){let t=i;do{if(t.i!==i.i&&t.next.i!==i.i&&t.i!==e.i&&t.next.i!==e.i&&Wp(t,t.next,i,e))return!0;t=t.next}while(t!==i);return!1}function Ea(i,e){return Dt(i.prev,i,i.next)<0?Dt(i,e,i.next)>=0&&Dt(i,i.prev,e)>=0:Dt(i,e,i.prev)<0||Dt(i,i.next,e)<0}function gS(i,e){let t=i,n=!1,s=(i.x+e.x)/2,r=(i.y+e.y)/2;do t.y>r!=t.next.y>r&&t.next.y!==t.y&&s<(t.next.x-t.x)*(r-t.y)/(t.next.y-t.y)+t.x&&(n=!n),t=t.next;while(t!==i);return n}function qp(i,e){let t=new Tu(i.i,i.x,i.y),n=new Tu(e.i,e.x,e.y),s=i.next,r=e.prev;return i.next=e,e.prev=i,t.next=s,s.prev=t,n.next=t,t.prev=n,r.next=n,n.prev=r,n}function fp(i,e,t,n){let s=new Tu(i,e,t);return n?(s.next=n.next,s.prev=n,n.next.prev=s,n.next=s):(s.prev=s,s.next=s),s}function Ta(i){i.next.prev=i.prev,i.prev.next=i.next,i.prevZ&&(i.prevZ.nextZ=i.nextZ),i.nextZ&&(i.nextZ.prevZ=i.prevZ)}function Tu(i,e,t){this.i=i,this.x=e,this.y=t,this.prev=null,this.next=null,this.z=0,this.prevZ=null,this.nextZ=null,this.steiner=!1}function vS(i,e,t,n){let s=0;for(let r=e,a=t-n;r<t;r+=n)s+=(i[a]-i[r])*(i[r+1]+i[a+1]),a=r;return s}var ma=class i{static area(e){let t=e.length,n=0;for(let s=t-1,r=0;r<t;s=r++)n+=e[s].x*e[r].y-e[r].x*e[s].y;return n*.5}static isClockWise(e){return i.area(e)<0}static triangulateShape(e,t){let n=[],s=[],r=[];pp(e),mp(n,e);let a=e.length;t.forEach(pp);for(let l=0;l<t.length;l++)s.push(a),a+=t[l].length,mp(n,t[l]);let o=tS.triangulate(n,s);for(let l=0;l<o.length;l+=3)r.push(o.slice(l,l+3));return r}};function pp(i){let e=i.length;e>2&&i[e-1].equals(i[0])&&i.pop()}function mp(i,e){for(let t=0;t<e.length;t++)i.push(e[t].x),i.push(e[t].y)}var pl=class i extends fl{constructor(e=1,t=0){let n=[1,0,0,-1,0,0,0,1,0,0,-1,0,0,0,1,0,0,-1],s=[0,2,4,0,4,3,0,3,5,0,5,2,1,2,5,1,5,3,1,3,4,1,4,2];super(n,s,e,t),this.type="OctahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new i(e.radius,e.detail)}},Ps=class i extends Qe{constructor(e=.5,t=1,n=32,s=1,r=0,a=Math.PI*2){super(),this.type="RingGeometry",this.parameters={innerRadius:e,outerRadius:t,thetaSegments:n,phiSegments:s,thetaStart:r,thetaLength:a},n=Math.max(3,n),s=Math.max(1,s);let o=[],l=[],c=[],h=[],u=e,d=(t-e)/s,f=new N,g=new ue;for(let b=0;b<=s;b++){for(let p=0;p<=n;p++){let m=r+p/n*a;f.x=u*Math.cos(m),f.y=u*Math.sin(m),l.push(f.x,f.y,f.z),c.push(0,0,1),g.x=(f.x/t+1)/2,g.y=(f.y/t+1)/2,h.push(g.x,g.y)}u+=d}for(let b=0;b<s;b++){let p=b*(n+1);for(let m=0;m<n;m++){let x=m+p,v=x,y=x+n+1,w=x+n+2,_=x+1;o.push(v,y,_),o.push(y,w,_)}}this.setIndex(o),this.setAttribute("position",new He(l,3)),this.setAttribute("normal",new He(c,3)),this.setAttribute("uv",new He(h,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.innerRadius,e.outerRadius,e.thetaSegments,e.phiSegments,e.thetaStart,e.thetaLength)}},ml=class i extends Qe{constructor(e=new _a([new ue(0,.5),new ue(-.5,-.5),new ue(.5,-.5)]),t=12){super(),this.type="ShapeGeometry",this.parameters={shapes:e,curveSegments:t};let n=[],s=[],r=[],a=[],o=0,l=0;if(Array.isArray(e)===!1)c(e);else for(let h=0;h<e.length;h++)c(e[h]),this.addGroup(o,l,h),o+=l,l=0;this.setIndex(n),this.setAttribute("position",new He(s,3)),this.setAttribute("normal",new He(r,3)),this.setAttribute("uv",new He(a,2));function c(h){let u=s.length/3,d=h.extractPoints(t),f=d.shape,g=d.holes;ma.isClockWise(f)===!1&&(f=f.reverse());for(let p=0,m=g.length;p<m;p++){let x=g[p];ma.isClockWise(x)===!0&&(g[p]=x.reverse())}let b=ma.triangulateShape(f,g);for(let p=0,m=g.length;p<m;p++){let x=g[p];f=f.concat(x)}for(let p=0,m=f.length;p<m;p++){let x=f[p];s.push(x.x,x.y,0),r.push(0,0,1),a.push(x.x,x.y)}for(let p=0,m=b.length;p<m;p++){let x=b[p],v=x[0]+u,y=x[1]+u,w=x[2]+u;n.push(v,y,w),l+=3}}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){let e=super.toJSON(),t=this.parameters.shapes;return yS(t,e)}static fromJSON(e,t){let n=[];for(let s=0,r=e.shapes.length;s<r;s++){let a=t[e.shapes[s]];n.push(a)}return new i(n,e.curveSegments)}};function yS(i,e){if(e.shapes=[],Array.isArray(i))for(let t=0,n=i.length;t<n;t++){let s=i[t];e.shapes.push(s.uuid)}else e.shapes.push(i.uuid);return e}var Ai=class i extends Qe{constructor(e=1,t=32,n=16,s=0,r=Math.PI*2,a=0,o=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:e,widthSegments:t,heightSegments:n,phiStart:s,phiLength:r,thetaStart:a,thetaLength:o},t=Math.max(3,Math.floor(t)),n=Math.max(2,Math.floor(n));let l=Math.min(a+o,Math.PI),c=0,h=[],u=new N,d=new N,f=[],g=[],b=[],p=[];for(let m=0;m<=n;m++){let x=[],v=m/n,y=0;m===0&&a===0?y=.5/t:m===n&&l===Math.PI&&(y=-.5/t);for(let w=0;w<=t;w++){let _=w/t;u.x=-e*Math.cos(s+_*r)*Math.sin(a+v*o),u.y=e*Math.cos(a+v*o),u.z=e*Math.sin(s+_*r)*Math.sin(a+v*o),g.push(u.x,u.y,u.z),d.copy(u).normalize(),b.push(d.x,d.y,d.z),p.push(_+y,1-v),x.push(c++)}h.push(x)}for(let m=0;m<n;m++)for(let x=0;x<t;x++){let v=h[m][x+1],y=h[m][x],w=h[m+1][x],_=h[m+1][x+1];(m!==0||a>0)&&f.push(v,y,_),(m!==n-1||l<Math.PI)&&f.push(y,w,_)}this.setIndex(f),this.setAttribute("position",new He(g,3)),this.setAttribute("normal",new He(b,3)),this.setAttribute("uv",new He(p,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.radius,e.widthSegments,e.heightSegments,e.phiStart,e.phiLength,e.thetaStart,e.thetaLength)}};var qn=class i extends Qe{constructor(e=1,t=.4,n=12,s=48,r=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:e,tube:t,radialSegments:n,tubularSegments:s,arc:r},n=Math.floor(n),s=Math.floor(s);let a=[],o=[],l=[],c=[],h=new N,u=new N,d=new N;for(let f=0;f<=n;f++)for(let g=0;g<=s;g++){let b=g/s*r,p=f/n*Math.PI*2;u.x=(e+t*Math.cos(p))*Math.cos(b),u.y=(e+t*Math.cos(p))*Math.sin(b),u.z=t*Math.sin(p),o.push(u.x,u.y,u.z),h.x=e*Math.cos(b),h.y=e*Math.sin(b),d.subVectors(u,h).normalize(),l.push(d.x,d.y,d.z),c.push(g/s),c.push(f/n)}for(let f=1;f<=n;f++)for(let g=1;g<=s;g++){let b=(s+1)*f+g-1,p=(s+1)*(f-1)+g-1,m=(s+1)*(f-1)+g,x=(s+1)*f+g;a.push(b,p,x),a.push(p,m,x)}this.setIndex(a),this.setAttribute("position",new He(o,3)),this.setAttribute("normal",new He(l,3)),this.setAttribute("uv",new He(c,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.radius,e.tube,e.radialSegments,e.tubularSegments,e.arc)}};var vt=class extends wi{constructor(e){super(),this.isMeshStandardMaterial=!0,this.defines={STANDARD:""},this.type="MeshStandardMaterial",this.color=new de(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new de(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Lp,this.normalScale=new ue(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Ut,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:""},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}};function ko(i,e,t){return!i||!t&&i.constructor===e?i:typeof e.BYTES_PER_ELEMENT=="number"?new e(i):Array.prototype.slice.call(i)}function bS(i){return ArrayBuffer.isView(i)&&!(i instanceof DataView)}var Ir=class{constructor(e,t,n,s){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=s!==void 0?s:new t.constructor(n),this.sampleValues=t,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,n=this._cachedIndex,s=t[n],r=t[n-1];n:{e:{let a;t:{i:if(!(e<s)){for(let o=n+2;;){if(s===void 0){if(e<r)break i;return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===o)break;if(r=s,s=t[++n],e<s)break e}a=t.length;break t}if(!(e>=r)){let o=t[1];e<o&&(n=2,r=o);for(let l=n-2;;){if(r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===l)break;if(s=r,r=t[--n-1],e>=r)break e}a=n,n=0;break t}break n}for(;n<a;){let o=n+a>>>1;e<t[o]?a=o:n=o+1}if(s=t[n],r=t[n-1],r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(s===void 0)return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,r,s)}return this.interpolate_(n,r,e,s)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,n=this.sampleValues,s=this.valueSize,r=e*s;for(let a=0;a!==s;++a)t[a]=n[r+a];return t}interpolate_(){throw new Error("call to abstract method")}intervalChanged_(){}},Au=class extends Ir{constructor(e,t,n,s){super(e,t,n,s),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:lf,endingEnd:lf}}intervalChanged_(e,t,n){let s=this.parameterPositions,r=e-2,a=e+1,o=s[r],l=s[a];if(o===void 0)switch(this.getSettings_().endingStart){case cf:r=e,o=2*t-n;break;case hf:r=s.length-2,o=t+s[r]-s[r+1];break;default:r=e,o=n}if(l===void 0)switch(this.getSettings_().endingEnd){case cf:a=e,l=2*n-t;break;case hf:a=1,l=n+s[1]-s[0];break;default:a=e-1,l=t}let c=(n-t)*.5,h=this.valueSize;this._weightPrev=c/(t-o),this._weightNext=c/(l-n),this._offsetPrev=r*h,this._offsetNext=a*h}interpolate_(e,t,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=e*o,c=l-o,h=this._offsetPrev,u=this._offsetNext,d=this._weightPrev,f=this._weightNext,g=(n-t)/(s-t),b=g*g,p=b*g,m=-d*p+2*d*b-d*g,x=(1+d)*p+(-1.5-2*d)*b+(-.5+d)*g+1,v=(-1-f)*p+(1.5+f)*b+.5*g,y=f*p-f*b;for(let w=0;w!==o;++w)r[w]=m*a[h+w]+x*a[c+w]+v*a[l+w]+y*a[u+w];return r}},Cu=class extends Ir{constructor(e,t,n,s){super(e,t,n,s)}interpolate_(e,t,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=e*o,c=l-o,h=(n-t)/(s-t),u=1-h;for(let d=0;d!==o;++d)r[d]=a[c+d]*u+a[l+d]*h;return r}},Ru=class extends Ir{constructor(e,t,n,s){super(e,t,n,s)}interpolate_(e){return this.copySampleValue_(e-1)}},$n=class{constructor(e,t,n,s){if(e===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(t===void 0||t.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+e);this.name=e,this.times=ko(t,this.TimeBufferType),this.values=ko(n,this.ValueBufferType),this.setInterpolation(s||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,n;if(t.toJSON!==this.toJSON)n=t.toJSON(e);else{n={name:e.name,times:ko(e.times,Array),values:ko(e.values,Array)};let s=e.getInterpolation();s!==e.DefaultInterpolation&&(n.interpolation=s)}return n.type=e.ValueTypeName,n}InterpolantFactoryMethodDiscrete(e){return new Ru(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new Cu(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new Au(this.times,this.values,this.getValueSize(),e)}setInterpolation(e){let t;switch(e){case Bo:t=this.InterpolantFactoryMethodDiscrete;break;case jh:t=this.InterpolantFactoryMethodLinear;break;case Pc:t=this.InterpolantFactoryMethodSmooth;break}if(t===void 0){let n="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(n);return console.warn("THREE.KeyframeTrack:",n),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Bo;case this.InterpolantFactoryMethodLinear:return jh;case this.InterpolantFactoryMethodSmooth:return Pc}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let n=0,s=t.length;n!==s;++n)t[n]+=e}return this}scale(e){if(e!==1){let t=this.times;for(let n=0,s=t.length;n!==s;++n)t[n]*=e}return this}trim(e,t){let n=this.times,s=n.length,r=0,a=s-1;for(;r!==s&&n[r]<e;)++r;for(;a!==-1&&n[a]>t;)--a;if(++a,r!==0||a!==s){r>=a&&(a=Math.max(a,1),r=a-1);let o=this.getValueSize();this.times=n.slice(r,a),this.values=this.values.slice(r*o,a*o)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!==0&&(console.error("THREE.KeyframeTrack: Invalid value size in track.",this),e=!1);let n=this.times,s=this.values,r=n.length;r===0&&(console.error("THREE.KeyframeTrack: Track is empty.",this),e=!1);let a=null;for(let o=0;o!==r;o++){let l=n[o];if(typeof l=="number"&&isNaN(l)){console.error("THREE.KeyframeTrack: Time is not a valid number.",this,o,l),e=!1;break}if(a!==null&&a>l){console.error("THREE.KeyframeTrack: Out of order keys.",this,o,l,a),e=!1;break}a=l}if(s!==void 0&&bS(s))for(let o=0,l=s.length;o!==l;++o){let c=s[o];if(isNaN(c)){console.error("THREE.KeyframeTrack: Value is not a valid number.",this,o,c),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),n=this.getValueSize(),s=this.getInterpolation()===Pc,r=e.length-1,a=1;for(let o=1;o<r;++o){let l=!1,c=e[o],h=e[o+1];if(c!==h&&(o!==1||c!==e[0]))if(s)l=!0;else{let u=o*n,d=u-n,f=u+n;for(let g=0;g!==n;++g){let b=t[u+g];if(b!==t[d+g]||b!==t[f+g]){l=!0;break}}}if(l){if(o!==a){e[a]=e[o];let u=o*n,d=a*n;for(let f=0;f!==n;++f)t[d+f]=t[u+f]}++a}}if(r>0){e[a]=e[r];for(let o=r*n,l=a*n,c=0;c!==n;++c)t[l+c]=t[o+c];++a}return a!==e.length?(this.times=e.slice(0,a),this.values=t.slice(0,a*n)):(this.times=e,this.values=t),this}clone(){let e=this.times.slice(),t=this.values.slice(),n=this.constructor,s=new n(this.name,e,t);return s.createInterpolant=this.createInterpolant,s}};$n.prototype.TimeBufferType=Float32Array;$n.prototype.ValueBufferType=Float32Array;$n.prototype.DefaultInterpolation=jh;var Is=class extends $n{constructor(e,t,n){super(e,t,n)}};Is.prototype.ValueTypeName="bool";Is.prototype.ValueBufferType=Array;Is.prototype.DefaultInterpolation=Bo;Is.prototype.InterpolantFactoryMethodLinear=void 0;Is.prototype.InterpolantFactoryMethodSmooth=void 0;var Pu=class extends $n{};Pu.prototype.ValueTypeName="color";var Iu=class extends $n{};Iu.prototype.ValueTypeName="number";var Lu=class extends Ir{constructor(e,t,n,s){super(e,t,n,s)}interpolate_(e,t,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=(n-t)/(s-t),c=e*o;for(let h=c+o;c!==h;c+=4)Ht.slerpFlat(r,0,a,c-o,a,c,l);return r}},gl=class extends $n{InterpolantFactoryMethodLinear(e){return new Lu(this.times,this.values,this.getValueSize(),e)}};gl.prototype.ValueTypeName="quaternion";gl.prototype.InterpolantFactoryMethodSmooth=void 0;var Ls=class extends $n{constructor(e,t,n){super(e,t,n)}};Ls.prototype.ValueTypeName="string";Ls.prototype.ValueBufferType=Array;Ls.prototype.DefaultInterpolation=Bo;Ls.prototype.InterpolantFactoryMethodLinear=void 0;Ls.prototype.InterpolantFactoryMethodSmooth=void 0;var ku=class extends $n{};ku.prototype.ValueTypeName="vector";var Du=class{constructor(e,t,n){let s=this,r=!1,a=0,o=0,l,c=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=n,this.itemStart=function(h){o++,r===!1&&s.onStart!==void 0&&s.onStart(h,a,o),r=!0},this.itemEnd=function(h){a++,s.onProgress!==void 0&&s.onProgress(h,a,o),a===o&&(r=!1,s.onLoad!==void 0&&s.onLoad())},this.itemError=function(h){s.onError!==void 0&&s.onError(h)},this.resolveURL=function(h){return l?l(h):h},this.setURLModifier=function(h){return l=h,this},this.addHandler=function(h,u){return c.push(h,u),this},this.removeHandler=function(h){let u=c.indexOf(h);return u!==-1&&c.splice(u,2),this},this.getHandler=function(h){for(let u=0,d=c.length;u<d;u+=2){let f=c[u],g=c[u+1];if(f.global&&(f.lastIndex=0),f.test(h))return g}return null}}},xS=new Du,Hu=class{constructor(e){this.manager=e!==void 0?e:xS,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={}}load(){}loadAsync(e,t){let n=this;return new Promise(function(s,r){n.load(e,s,t,r)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}};Hu.DEFAULT_MATERIAL_NAME="__DEFAULT";var Lr=class extends gt{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new de(e),this.intensity=t}dispose(){}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){let t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,this.groundColor!==void 0&&(t.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(t.object.distance=this.distance),this.angle!==void 0&&(t.object.angle=this.angle),this.decay!==void 0&&(t.object.decay=this.decay),this.penumbra!==void 0&&(t.object.penumbra=this.penumbra),this.shadow!==void 0&&(t.object.shadow=this.shadow.toJSON()),this.target!==void 0&&(t.object.target=this.target.uuid),t}},vl=class extends Lr{constructor(e,t,n){super(e,n),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(gt.DEFAULT_UP),this.updateMatrix(),this.groundColor=new de(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}},dh=new Ge,gp=new N,vp=new N,yl=class{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new ue(512,512),this.map=null,this.mapPass=null,this.matrix=new Ge,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new ba,this._frameExtents=new ue(1,1),this._viewportCount=1,this._viewports=[new yt(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(e){let t=this.camera,n=this.matrix;gp.setFromMatrixPosition(e.matrixWorld),t.position.copy(gp),vp.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(vp),t.updateMatrixWorld(),dh.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),this._frustum.setFromProjectionMatrix(dh),n.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),n.multiply(dh)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.mapSize.copy(e.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){let e={};return this.intensity!==1&&(e.intensity=this.intensity),this.bias!==0&&(e.bias=this.bias),this.normalBias!==0&&(e.normalBias=this.normalBias),this.radius!==1&&(e.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(e.mapSize=this.mapSize.toArray()),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}};var yp=new Ge,ha=new N,fh=new N,Nu=class extends yl{constructor(){super(new cn(90,1,.5,500)),this.isPointLightShadow=!0,this._frameExtents=new ue(4,2),this._viewportCount=6,this._viewports=[new yt(2,1,1,1),new yt(0,1,1,1),new yt(3,1,1,1),new yt(1,1,1,1),new yt(3,0,1,1),new yt(1,0,1,1)],this._cubeDirections=[new N(1,0,0),new N(-1,0,0),new N(0,0,1),new N(0,0,-1),new N(0,1,0),new N(0,-1,0)],this._cubeUps=[new N(0,1,0),new N(0,1,0),new N(0,1,0),new N(0,1,0),new N(0,0,1),new N(0,0,-1)]}updateMatrices(e,t=0){let n=this.camera,s=this.matrix,r=e.distance||n.far;r!==n.far&&(n.far=r,n.updateProjectionMatrix()),ha.setFromMatrixPosition(e.matrixWorld),n.position.copy(ha),fh.copy(n.position),fh.add(this._cubeDirections[t]),n.up.copy(this._cubeUps[t]),n.lookAt(fh),n.updateMatrixWorld(),s.makeTranslation(-ha.x,-ha.y,-ha.z),yp.multiplyMatrices(n.projectionMatrix,n.matrixWorldInverse),this._frustum.setFromProjectionMatrix(yp)}},ks=class extends Lr{constructor(e,t,n=0,s=2){super(e,t),this.isPointLight=!0,this.type="PointLight",this.distance=n,this.decay=s,this.shadow=new Nu}get power(){return this.intensity*4*Math.PI}set power(e){this.intensity=e/(4*Math.PI)}dispose(){this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.decay=e.decay,this.shadow=e.shadow.clone(),this}},Ou=class extends yl{constructor(){super(new Rr(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},Aa=class extends Lr{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(gt.DEFAULT_UP),this.updateMatrix(),this.target=new gt,this.shadow=new Ou}dispose(){this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}},bl=class extends Lr{constructor(e,t){super(e,t),this.isAmbientLight=!0,this.type="AmbientLight"}};var kr=class{constructor(e=!0){this.autoStart=e,this.startTime=0,this.oldTime=0,this.elapsedTime=0,this.running=!1}start(){this.startTime=bp(),this.oldTime=this.startTime,this.elapsedTime=0,this.running=!0}stop(){this.getElapsedTime(),this.running=!1,this.autoStart=!1}getElapsedTime(){return this.getDelta(),this.elapsedTime}getDelta(){let e=0;if(this.autoStart&&!this.running)return this.start(),0;if(this.running){let t=bp();e=(t-this.oldTime)/1e3,this.oldTime=t,this.elapsedTime+=e}return e}};function bp(){return performance.now()}var ju="\\[\\]\\.:\\/",SS=new RegExp("["+ju+"]","g"),Qu="[^"+ju+"]",MS="[^"+ju.replace("\\.","")+"]",_S=/((?:WC+[\/:])*)/.source.replace("WC",Qu),wS=/(WCOD+)?/.source.replace("WCOD",MS),ES=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",Qu),TS=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",Qu),AS=new RegExp("^"+_S+wS+ES+TS+"$"),CS=["material","materials","bones","map"],Uu=class{constructor(e,t,n){let s=n||Lt.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,s)}getValue(e,t){this.bind();let n=this._targetGroup.nCachedObjects_,s=this._bindings[n];s!==void 0&&s.getValue(e,t)}setValue(e,t){let n=this._bindings;for(let s=this._targetGroup.nCachedObjects_,r=n.length;s!==r;++s)n[s].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].unbind()}},Lt=class i{constructor(e,t,n){this.path=t,this.parsedPath=n||i.parseTrackName(t),this.node=i.findNode(e,this.parsedPath.nodeName),this.rootNode=e,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(e,t,n){return e&&e.isAnimationObjectGroup?new i.Composite(e,t,n):new i(e,t,n)}static sanitizeNodeName(e){return e.replace(/\s/g,"_").replace(SS,"")}static parseTrackName(e){let t=AS.exec(e);if(t===null)throw new Error("PropertyBinding: Cannot parse trackName: "+e);let n={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},s=n.nodeName&&n.nodeName.lastIndexOf(".");if(s!==void 0&&s!==-1){let r=n.nodeName.substring(s+1);CS.indexOf(r)!==-1&&(n.nodeName=n.nodeName.substring(0,s),n.objectName=r)}if(n.propertyName===null||n.propertyName.length===0)throw new Error("PropertyBinding: can not parse propertyName from trackName: "+e);return n}static findNode(e,t){if(t===void 0||t===""||t==="."||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let n=e.skeleton.getBoneByName(t);if(n!==void 0)return n}if(e.children){let n=function(r){for(let a=0;a<r.length;a++){let o=r[a];if(o.name===t||o.uuid===t)return o;let l=n(o.children);if(l)return l}return null},s=n(e.children);if(s)return s}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)e[t++]=n[s]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let e=this.node,t=this.parsedPath,n=t.objectName,s=t.propertyName,r=t.propertyIndex;if(e||(e=i.findNode(this.rootNode,t.nodeName),this.node=e),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!e){console.warn("THREE.PropertyBinding: No target node found for track: "+this.path+".");return}if(n){let c=t.objectIndex;switch(n){case"materials":if(!e.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.materials){console.error("THREE.PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}e=e.material.materials;break;case"bones":if(!e.skeleton){console.error("THREE.PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}e=e.skeleton.bones;for(let h=0;h<e.length;h++)if(e[h].name===c){c=h;break}break;case"map":if("map"in e){e=e.map;break}if(!e.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.map){console.error("THREE.PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}e=e.material.map;break;default:if(e[n]===void 0){console.error("THREE.PropertyBinding: Can not bind to objectName of node undefined.",this);return}e=e[n]}if(c!==void 0){if(e[c]===void 0){console.error("THREE.PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,e);return}e=e[c]}}let a=e[s];if(a===void 0){let c=t.nodeName;console.error("THREE.PropertyBinding: Trying to update property for track: "+c+"."+s+" but it wasn't found.",e);return}let o=this.Versioning.None;this.targetObject=e,e.needsUpdate!==void 0?o=this.Versioning.NeedsUpdate:e.matrixWorldNeedsUpdate!==void 0&&(o=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(r!==void 0){if(s==="morphTargetInfluences"){if(!e.geometry){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!e.geometry.morphAttributes){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}e.morphTargetDictionary[r]!==void 0&&(r=e.morphTargetDictionary[r])}l=this.BindingType.ArrayElement,this.resolvedProperty=a,this.propertyIndex=r}else a.fromArray!==void 0&&a.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=a):Array.isArray(a)?(l=this.BindingType.EntireArray,this.resolvedProperty=a):this.propertyName=s;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][o]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};Lt.Composite=Uu;Lt.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};Lt.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};Lt.prototype.GetterByBindingType=[Lt.prototype._getValue_direct,Lt.prototype._getValue_array,Lt.prototype._getValue_arrayElement,Lt.prototype._getValue_toArray];Lt.prototype.SetterByBindingTypeAndVersioning=[[Lt.prototype._setValue_direct,Lt.prototype._setValue_direct_setNeedsUpdate,Lt.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[Lt.prototype._setValue_array,Lt.prototype._setValue_array_setNeedsUpdate,Lt.prototype._setValue_array_setMatrixWorldNeedsUpdate],[Lt.prototype._setValue_arrayElement,Lt.prototype._setValue_arrayElement_setNeedsUpdate,Lt.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[Lt.prototype._setValue_fromArray,Lt.prototype._setValue_fromArray_setNeedsUpdate,Lt.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var v_=new Float32Array(1);typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:Fu}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=Fu);var wl={name:"CopyShader",uniforms:{tDiffuse:{value:null},opacity:{value:1}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform float opacity;

		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );
			gl_FragColor = opacity * texel;


		}`};var Yn=class{constructor(){this.isPass=!0,this.enabled=!0,this.needsSwap=!0,this.clear=!1,this.renderToScreen=!1}setSize(){}render(){console.error("THREE.Pass: .render() must be implemented in derived pass.")}dispose(){}},RS=new Rr(-1,1,1,-1,0,1),ed=class extends Qe{constructor(){super(),this.setAttribute("position",new He([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute("uv",new He([0,2,0,0,2,0],2))}},PS=new ed,Nr=class{constructor(e){this._mesh=new he(PS,e)}dispose(){this._mesh.geometry.dispose()}render(e){e.render(this._mesh,RS)}get material(){return this._mesh.material}set material(e){this._mesh.material=e}};var El=class extends Yn{constructor(e,t){super(),this.textureID=t!==void 0?t:"tDiffuse",e instanceof At?(this.uniforms=e.uniforms,this.material=e):e&&(this.uniforms=Dr.clone(e.uniforms),this.material=new At({name:e.name!==void 0?e.name:"unspecified",defines:Object.assign({},e.defines),uniforms:this.uniforms,vertexShader:e.vertexShader,fragmentShader:e.fragmentShader})),this.fsQuad=new Nr(this.material)}render(e,t,n){this.uniforms[this.textureID]&&(this.uniforms[this.textureID].value=n.texture),this.fsQuad.material=this.material,this.renderToScreen?(e.setRenderTarget(null),this.fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this.fsQuad.render(e))}dispose(){this.material.dispose(),this.fsQuad.dispose()}};var Ca=class extends Yn{constructor(e,t){super(),this.scene=e,this.camera=t,this.clear=!0,this.needsSwap=!1,this.inverse=!1}render(e,t,n){let s=e.getContext(),r=e.state;r.buffers.color.setMask(!1),r.buffers.depth.setMask(!1),r.buffers.color.setLocked(!0),r.buffers.depth.setLocked(!0);let a,o;this.inverse?(a=0,o=1):(a=1,o=0),r.buffers.stencil.setTest(!0),r.buffers.stencil.setOp(s.REPLACE,s.REPLACE,s.REPLACE),r.buffers.stencil.setFunc(s.ALWAYS,a,4294967295),r.buffers.stencil.setClear(o),r.buffers.stencil.setLocked(!0),e.setRenderTarget(n),this.clear&&e.clear(),e.render(this.scene,this.camera),e.setRenderTarget(t),this.clear&&e.clear(),e.render(this.scene,this.camera),r.buffers.color.setLocked(!1),r.buffers.depth.setLocked(!1),r.buffers.color.setMask(!0),r.buffers.depth.setMask(!0),r.buffers.stencil.setLocked(!1),r.buffers.stencil.setFunc(s.EQUAL,1,4294967295),r.buffers.stencil.setOp(s.KEEP,s.KEEP,s.KEEP),r.buffers.stencil.setLocked(!0)}},Tl=class extends Yn{constructor(){super(),this.needsSwap=!1}render(e){e.state.buffers.stencil.setLocked(!1),e.state.buffers.stencil.setTest(!1)}};var Al=class{constructor(e,t){if(this.renderer=e,this._pixelRatio=e.getPixelRatio(),t===void 0){let n=e.getSize(new ue);this._width=n.width,this._height=n.height,t=new gn(this._width*this._pixelRatio,this._height*this._pixelRatio,{type:Xn}),t.texture.name="EffectComposer.rt1"}else this._width=t.width,this._height=t.height;this.renderTarget1=t,this.renderTarget2=t.clone(),this.renderTarget2.texture.name="EffectComposer.rt2",this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2,this.renderToScreen=!0,this.passes=[],this.copyPass=new El(wl),this.copyPass.material.blending=si,this.clock=new kr}swapBuffers(){let e=this.readBuffer;this.readBuffer=this.writeBuffer,this.writeBuffer=e}addPass(e){this.passes.push(e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}insertPass(e,t){this.passes.splice(t,0,e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}removePass(e){let t=this.passes.indexOf(e);t!==-1&&this.passes.splice(t,1)}isLastEnabledPass(e){for(let t=e+1;t<this.passes.length;t++)if(this.passes[t].enabled)return!1;return!0}render(e){e===void 0&&(e=this.clock.getDelta());let t=this.renderer.getRenderTarget(),n=!1;for(let s=0,r=this.passes.length;s<r;s++){let a=this.passes[s];if(a.enabled!==!1){if(a.renderToScreen=this.renderToScreen&&this.isLastEnabledPass(s),a.render(this.renderer,this.writeBuffer,this.readBuffer,e,n),a.needsSwap){if(n){let o=this.renderer.getContext(),l=this.renderer.state.buffers.stencil;l.setFunc(o.NOTEQUAL,1,4294967295),this.copyPass.render(this.renderer,this.writeBuffer,this.readBuffer,e),l.setFunc(o.EQUAL,1,4294967295)}this.swapBuffers()}Ca!==void 0&&(a instanceof Ca?n=!0:a instanceof Tl&&(n=!1))}}this.renderer.setRenderTarget(t)}reset(e){if(e===void 0){let t=this.renderer.getSize(new ue);this._pixelRatio=this.renderer.getPixelRatio(),this._width=t.width,this._height=t.height,e=this.renderTarget1.clone(),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.renderTarget1=e,this.renderTarget2=e.clone(),this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2}setSize(e,t){this._width=e,this._height=t;let n=this._width*this._pixelRatio,s=this._height*this._pixelRatio;this.renderTarget1.setSize(n,s),this.renderTarget2.setSize(n,s);for(let r=0;r<this.passes.length;r++)this.passes[r].setSize(n,s)}setPixelRatio(e){this._pixelRatio=e,this.setSize(this._width,this._height)}dispose(){this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.copyPass.dispose()}};var Cl=class extends Yn{constructor(e,t,n=null,s=null,r=null){super(),this.scene=e,this.camera=t,this.overrideMaterial=n,this.clearColor=s,this.clearAlpha=r,this.clear=!0,this.clearDepth=!1,this.needsSwap=!1,this._oldClearColor=new de}render(e,t,n){let s=e.autoClear;e.autoClear=!1;let r,a;this.overrideMaterial!==null&&(a=this.scene.overrideMaterial,this.scene.overrideMaterial=this.overrideMaterial),this.clearColor!==null&&(e.getClearColor(this._oldClearColor),e.setClearColor(this.clearColor,e.getClearAlpha())),this.clearAlpha!==null&&(r=e.getClearAlpha(),e.setClearAlpha(this.clearAlpha)),this.clearDepth==!0&&e.clearDepth(),e.setRenderTarget(this.renderToScreen?null:n),this.clear===!0&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),e.render(this.scene,this.camera),this.clearColor!==null&&e.setClearColor(this._oldClearColor),this.clearAlpha!==null&&e.setClearAlpha(r),this.overrideMaterial!==null&&(this.scene.overrideMaterial=a),e.autoClear=s}};var $p={name:"LuminosityHighPassShader",shaderID:"luminosityHighPass",uniforms:{tDiffuse:{value:null},luminosityThreshold:{value:1},smoothWidth:{value:1},defaultColor:{value:new de(0)},defaultOpacity:{value:0}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;

			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform sampler2D tDiffuse;
		uniform vec3 defaultColor;
		uniform float defaultOpacity;
		uniform float luminosityThreshold;
		uniform float smoothWidth;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );

			float v = luminance( texel.xyz );

			vec4 outputColor = vec4( defaultColor.rgb, defaultOpacity );

			float alpha = smoothstep( luminosityThreshold, luminosityThreshold + smoothWidth, v );

			gl_FragColor = mix( outputColor, texel, alpha );

		}`};var Or=class i extends Yn{constructor(e,t,n,s){super(),this.strength=t!==void 0?t:1,this.radius=n,this.threshold=s,this.resolution=e!==void 0?new ue(e.x,e.y):new ue(256,256),this.clearColor=new de(0,0,0),this.renderTargetsHorizontal=[],this.renderTargetsVertical=[],this.nMips=5;let r=Math.round(this.resolution.x/2),a=Math.round(this.resolution.y/2);this.renderTargetBright=new gn(r,a,{type:Xn}),this.renderTargetBright.texture.name="UnrealBloomPass.bright",this.renderTargetBright.texture.generateMipmaps=!1;for(let u=0;u<this.nMips;u++){let d=new gn(r,a,{type:Xn});d.texture.name="UnrealBloomPass.h"+u,d.texture.generateMipmaps=!1,this.renderTargetsHorizontal.push(d);let f=new gn(r,a,{type:Xn});f.texture.name="UnrealBloomPass.v"+u,f.texture.generateMipmaps=!1,this.renderTargetsVertical.push(f),r=Math.round(r/2),a=Math.round(a/2)}let o=$p;this.highPassUniforms=Dr.clone(o.uniforms),this.highPassUniforms.luminosityThreshold.value=s,this.highPassUniforms.smoothWidth.value=.01,this.materialHighPassFilter=new At({uniforms:this.highPassUniforms,vertexShader:o.vertexShader,fragmentShader:o.fragmentShader}),this.separableBlurMaterials=[];let l=[3,5,7,9,11];r=Math.round(this.resolution.x/2),a=Math.round(this.resolution.y/2);for(let u=0;u<this.nMips;u++)this.separableBlurMaterials.push(this.getSeperableBlurMaterial(l[u])),this.separableBlurMaterials[u].uniforms.invSize.value=new ue(1/r,1/a),r=Math.round(r/2),a=Math.round(a/2);this.compositeMaterial=this.getCompositeMaterial(this.nMips),this.compositeMaterial.uniforms.blurTexture1.value=this.renderTargetsVertical[0].texture,this.compositeMaterial.uniforms.blurTexture2.value=this.renderTargetsVertical[1].texture,this.compositeMaterial.uniforms.blurTexture3.value=this.renderTargetsVertical[2].texture,this.compositeMaterial.uniforms.blurTexture4.value=this.renderTargetsVertical[3].texture,this.compositeMaterial.uniforms.blurTexture5.value=this.renderTargetsVertical[4].texture,this.compositeMaterial.uniforms.bloomStrength.value=t,this.compositeMaterial.uniforms.bloomRadius.value=.1;let c=[1,.8,.6,.4,.2];this.compositeMaterial.uniforms.bloomFactors.value=c,this.bloomTintColors=[new N(1,1,1),new N(1,1,1),new N(1,1,1),new N(1,1,1),new N(1,1,1)],this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors;let h=wl;this.copyUniforms=Dr.clone(h.uniforms),this.blendMaterial=new At({uniforms:this.copyUniforms,vertexShader:h.vertexShader,fragmentShader:h.fragmentShader,blending:Vt,depthTest:!1,depthWrite:!1,transparent:!0}),this.enabled=!0,this.needsSwap=!1,this._oldClearColor=new de,this.oldClearAlpha=1,this.basic=new kt,this.fsQuad=new Nr(null)}dispose(){for(let e=0;e<this.renderTargetsHorizontal.length;e++)this.renderTargetsHorizontal[e].dispose();for(let e=0;e<this.renderTargetsVertical.length;e++)this.renderTargetsVertical[e].dispose();this.renderTargetBright.dispose();for(let e=0;e<this.separableBlurMaterials.length;e++)this.separableBlurMaterials[e].dispose();this.compositeMaterial.dispose(),this.blendMaterial.dispose(),this.basic.dispose(),this.fsQuad.dispose()}setSize(e,t){let n=Math.round(e/2),s=Math.round(t/2);this.renderTargetBright.setSize(n,s);for(let r=0;r<this.nMips;r++)this.renderTargetsHorizontal[r].setSize(n,s),this.renderTargetsVertical[r].setSize(n,s),this.separableBlurMaterials[r].uniforms.invSize.value=new ue(1/n,1/s),n=Math.round(n/2),s=Math.round(s/2)}render(e,t,n,s,r){e.getClearColor(this._oldClearColor),this.oldClearAlpha=e.getClearAlpha();let a=e.autoClear;e.autoClear=!1,e.setClearColor(this.clearColor,0),r&&e.state.buffers.stencil.setTest(!1),this.renderToScreen&&(this.fsQuad.material=this.basic,this.basic.map=n.texture,e.setRenderTarget(null),e.clear(),this.fsQuad.render(e)),this.highPassUniforms.tDiffuse.value=n.texture,this.highPassUniforms.luminosityThreshold.value=this.threshold,this.fsQuad.material=this.materialHighPassFilter,e.setRenderTarget(this.renderTargetBright),e.clear(),this.fsQuad.render(e);let o=this.renderTargetBright;for(let l=0;l<this.nMips;l++)this.fsQuad.material=this.separableBlurMaterials[l],this.separableBlurMaterials[l].uniforms.colorTexture.value=o.texture,this.separableBlurMaterials[l].uniforms.direction.value=i.BlurDirectionX,e.setRenderTarget(this.renderTargetsHorizontal[l]),e.clear(),this.fsQuad.render(e),this.separableBlurMaterials[l].uniforms.colorTexture.value=this.renderTargetsHorizontal[l].texture,this.separableBlurMaterials[l].uniforms.direction.value=i.BlurDirectionY,e.setRenderTarget(this.renderTargetsVertical[l]),e.clear(),this.fsQuad.render(e),o=this.renderTargetsVertical[l];this.fsQuad.material=this.compositeMaterial,this.compositeMaterial.uniforms.bloomStrength.value=this.strength,this.compositeMaterial.uniforms.bloomRadius.value=this.radius,this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,e.setRenderTarget(this.renderTargetsHorizontal[0]),e.clear(),this.fsQuad.render(e),this.fsQuad.material=this.blendMaterial,this.copyUniforms.tDiffuse.value=this.renderTargetsHorizontal[0].texture,r&&e.state.buffers.stencil.setTest(!0),this.renderToScreen?(e.setRenderTarget(null),this.fsQuad.render(e)):(e.setRenderTarget(n),this.fsQuad.render(e)),e.setClearColor(this._oldClearColor,this.oldClearAlpha),e.autoClear=a}getSeperableBlurMaterial(e){let t=[];for(let n=0;n<e;n++)t.push(.39894*Math.exp(-.5*n*n/(e*e))/e);return new At({defines:{KERNEL_RADIUS:e},uniforms:{colorTexture:{value:null},invSize:{value:new ue(.5,.5)},direction:{value:new ue(.5,.5)},gaussianCoefficients:{value:t}},vertexShader:`varying vec2 vUv;
				void main() {
					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
				}`,fragmentShader:`#include <common>
				varying vec2 vUv;
				uniform sampler2D colorTexture;
				uniform vec2 invSize;
				uniform vec2 direction;
				uniform float gaussianCoefficients[KERNEL_RADIUS];

				void main() {
					float weightSum = gaussianCoefficients[0];
					vec3 diffuseSum = texture2D( colorTexture, vUv ).rgb * weightSum;
					for( int i = 1; i < KERNEL_RADIUS; i ++ ) {
						float x = float(i);
						float w = gaussianCoefficients[i];
						vec2 uvOffset = direction * invSize * x;
						vec3 sample1 = texture2D( colorTexture, vUv + uvOffset ).rgb;
						vec3 sample2 = texture2D( colorTexture, vUv - uvOffset ).rgb;
						diffuseSum += (sample1 + sample2) * w;
						weightSum += 2.0 * w;
					}
					gl_FragColor = vec4(diffuseSum/weightSum, 1.0);
				}`})}getCompositeMaterial(e){return new At({defines:{NUM_MIPS:e},uniforms:{blurTexture1:{value:null},blurTexture2:{value:null},blurTexture3:{value:null},blurTexture4:{value:null},blurTexture5:{value:null},bloomStrength:{value:1},bloomFactors:{value:null},bloomTintColors:{value:null},bloomRadius:{value:0}},vertexShader:`varying vec2 vUv;
				void main() {
					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
				}`,fragmentShader:`varying vec2 vUv;
				uniform sampler2D blurTexture1;
				uniform sampler2D blurTexture2;
				uniform sampler2D blurTexture3;
				uniform sampler2D blurTexture4;
				uniform sampler2D blurTexture5;
				uniform float bloomStrength;
				uniform float bloomRadius;
				uniform float bloomFactors[NUM_MIPS];
				uniform vec3 bloomTintColors[NUM_MIPS];

				float lerpBloomFactor(const in float factor) {
					float mirrorFactor = 1.2 - factor;
					return mix(factor, mirrorFactor, bloomRadius);
				}

				void main() {
					gl_FragColor = bloomStrength * ( lerpBloomFactor(bloomFactors[0]) * vec4(bloomTintColors[0], 1.0) * texture2D(blurTexture1, vUv) +
						lerpBloomFactor(bloomFactors[1]) * vec4(bloomTintColors[1], 1.0) * texture2D(blurTexture2, vUv) +
						lerpBloomFactor(bloomFactors[2]) * vec4(bloomTintColors[2], 1.0) * texture2D(blurTexture3, vUv) +
						lerpBloomFactor(bloomFactors[3]) * vec4(bloomTintColors[3], 1.0) * texture2D(blurTexture4, vUv) +
						lerpBloomFactor(bloomFactors[4]) * vec4(bloomTintColors[4], 1.0) * texture2D(blurTexture5, vUv) );
				}`})}};Or.BlurDirectionX=new ue(1,0);Or.BlurDirectionY=new ue(0,1);function ns(i){let e=i>>>0;return()=>{e|=0,e=e+1831565813|0;let t=Math.imul(e^e>>>15,1|e);return t=t+Math.imul(t^t>>>7,61|t)^t,((t^t>>>14)>>>0)/4294967296}}function Le(i,e,t=0){let n=Math.imul(i|0,374761393)+Math.imul(e|0,668265263)+Math.imul(t|0,1442695041)|0;return n=Math.imul(n^n>>>13,1274126177),((n^n>>>16)>>>0)/4294967296}function Ds(i){return ns(Math.max(1,i*2147483647|0))}function Mn(i,e=i){let t=document.createElement("canvas");return t.width=i,t.height=e,{c:t,g:t.getContext("2d")}}function _n(i,e){let t=new Ft(i);return t.wrapS=t.wrapT=ai,t.anisotropy=8,e&&(t.colorSpace=Gt),t}function Kn(i,e){i.beginPath(),i.moveTo(e[0][0],e[0][1]);for(let t=1;t<e.length;t++)i.lineTo(e[t][0],e[t][1]);i.closePath()}function On(i,e,t,n,s){for(let r=-1;r<=1;r++)for(let a=-1;a<=1;a++)i.save(),i.translate(t+a*e,n+r*e),s(i),i.restore()}function IS(i){let s=i===1,r=Mn(512),a=Mn(512),o=r.g,l=a.g,c=[],h=[],u=ns(13504928+i*7919);for(let p=0;p<8;p++){c.push([]),h.push([]);for(let m=0;m<8;m++)c[p].push((u()-.5)*64*.36),h[p].push((u()-.5)*64*.36)}let d=(p,m)=>{let x=(p%8+8)%8,v=(m%8+8)%8;return[p*64+c[v][x],m*64+h[v][x]]};o.fillStyle=s?"#0a0d0b":"#121009",o.fillRect(0,0,512,512),l.fillStyle="#000",l.fillRect(0,0,512,512);let f=s?[64,70,66]:[82,78,69];for(let p=-1;p<=8;p++)for(let m=-1;m<=8;m++){let x=(m%8+8)%8,v=(p%8+8)%8,y=Ds(Le(x,v,20907+i)),w=d(m,p),_=d(m+1,p),M=d(m+1,p+1),T=d(m,p+1),L=(w[0]+_[0]+M[0]+T[0])/4,S=(w[1]+_[1]+M[1]+T[1])/4,E=.84+y()*.07,D=[w,_,M,T].map(([B,ee])=>[L+(B-L)*E,S+(ee-S)*E]),O=.76+y()*.42,F=(y()-.5)*.12;if(o.fillStyle=`rgb(${Math.round(f[0]*O*(1+F))},${Math.round(f[1]*O)},${Math.round(f[2]*O*(1-F*.6))})`,Kn(o,D),o.fill(),o.save(),Kn(o,D),o.clip(),o.save(),o.translate(0,-2.2),Kn(o,D),o.strokeStyle="rgba(255,242,212,0.13)",o.lineWidth=3.5,o.stroke(),o.restore(),o.save(),o.translate(0,2.6),Kn(o,D),o.strokeStyle="rgba(0,0,0,0.32)",o.lineWidth=4,o.stroke(),o.restore(),y()<.42){o.strokeStyle="rgba(12,9,6,0.55)",o.lineWidth=.8+y()*1.1,o.beginPath();let B=L+(y()-.5)*64*.5,ee=S+(y()-.5)*64*.5;o.moveTo(B,ee);let q=3+Math.floor(y()*3);for(let le=0;le<q;le++)B+=(y()-.5)*64*.7,ee+=(y()-.5)*64*.7,o.lineTo(B,ee);o.stroke()}if(y()<.3){let B=D[Math.floor(y()*4)],ee=3+y()*6;o.fillStyle="rgba(8,6,4,0.5)",o.beginPath(),o.moveTo(B[0],B[1]),o.lineTo(B[0]+ee,B[1]+ee*.4),o.lineTo(B[0]+ee*.3,B[1]+ee),o.closePath(),o.fill()}o.restore(),Kn(l,D);let W=Math.round(105+O*80);l.fillStyle=`rgb(${W},${W},${W})`,l.fill(),l.save(),Kn(l,D),l.clip(),l.save(),l.translate(0,-2.2),Kn(l,D),l.strokeStyle="rgba(255,255,255,0.5)",l.lineWidth=3,l.stroke(),l.restore(),l.save(),l.translate(0,2.6),Kn(l,D),l.strokeStyle="rgba(0,0,0,0.55)",l.lineWidth=4,l.stroke(),l.restore(),l.restore()}let g=s?.42:.14;for(let p=0;p<8;p++)for(let m=0;m<8;m++){if(Le(m,p,12293+i)>g)continue;let[x,v]=d(m,p),y=5+Le(m,p,12294+i)*11;On(o,512,x,v,w=>{let _=w.createRadialGradient(0,0,0,0,0,y);_.addColorStop(0,"rgba(64,94,86,0.34)"),_.addColorStop(1,"rgba(64,94,86,0)"),w.fillStyle=_,w.beginPath(),w.arc(0,0,y,0,Math.PI*2),w.fill()})}let b=ns(401692+i);for(let p=0;p<700;p++)o.fillStyle=b()<.5?"rgba(0,0,0,0.1)":"rgba(122,116,98,0.1)",o.fillRect(b()*512,b()*512,1+b()*2.4,1+b()*2.4);for(let p=0;p<7;p++){let m=b()*512,x=b()*512,v=30+b()*70;On(o,512,m,x,y=>{let w=y.createRadialGradient(0,0,0,0,0,v);w.addColorStop(0,"rgba(5,5,3,0.10)"),w.addColorStop(1,"rgba(5,5,3,0)"),y.fillStyle=w,y.beginPath(),y.arc(0,0,v,0,Math.PI*2),y.fill()})}return{map:_n(r.c,!0),bump:_n(a.c,!1)}}function LS(i){let a=i===1,o=Mn(512),l=Mn(512),c=o.g,h=l.g;c.fillStyle="#17140f",c.fillRect(0,0,512,512),h.fillStyle="#000",h.fillRect(0,0,512,512);for(let f=0;f<8;f++){let g=f%2*128*.5;for(let b=-1;b<=4;b++){let p=(b%4+4)%4,m=Ds(Le(p,f,45596+i*31)),x=b*128+g+3,v=f*64+3,y=122,w=58;if(a&&m()<.1){c.fillStyle="#0b0906",c.fillRect(x,v,y,w),c.fillStyle="rgb(52,47,40)",c.fillRect(x,v+w*.45,y*(.3+m()*.4),w*.55),h.fillStyle="#000",h.fillRect(x,v,y,w);continue}let _=.72+m()*.42,T=m()<.07?[88,48,40]:[76,70,62],L=(m()-.5)*.1;c.fillStyle=`rgb(${Math.round(T[0]*_*(1+L))},${Math.round(T[1]*_)},${Math.round(T[2]*_*(1-L*.5))})`,c.fillRect(x,v,y,w),c.fillStyle="rgba(255,238,208,0.09)",c.fillRect(x,v,y,3),c.fillStyle="rgba(0,0,0,0.24)",c.fillRect(x,v+w-3,y,3);let S=a?m()<.75?2:1:m()<.42?1:0;for(let D=0;D<S;D++)c.fillStyle="rgba(6,5,3,0.42)",c.fillRect(x+m()*y*.6,v+m()*w*.5,4+m()*12,3+m()*6);if(a&&m()<.3){c.strokeStyle="rgba(5,4,2,0.5)",c.lineWidth=1+m(),c.beginPath();let D=x+m()*y,O=v;c.moveTo(D,O);for(let F=0;F<4;F++)D+=(m()-.5)*10,O+=w/4,c.lineTo(D,O);c.stroke()}let E=Math.round(112+_*84);h.fillStyle=`rgb(${E},${E},${E})`,h.fillRect(x,v,y,w),h.fillStyle="rgba(255,255,255,0.35)",h.fillRect(x,v,y,3),h.fillStyle="rgba(0,0,0,0.5)",h.fillRect(x,v+w-3,y,3)}}let u=c.createLinearGradient(0,0,0,512*.55);u.addColorStop(0,"rgba(4,3,2,0.28)"),u.addColorStop(1,"rgba(4,3,2,0)"),c.fillStyle=u,c.fillRect(0,0,512,512*.55),u=c.createLinearGradient(0,512,0,512*.74),u.addColorStop(0,"rgba(14,22,18,0.36)"),u.addColorStop(1,"rgba(14,22,18,0)"),c.fillStyle=u,c.fillRect(0,512*.74,512,512*.26);let d=ns(1303+i);for(let f=0;f<34;f++){let g=d()*512,b=2+d()*5,p=40+d()*170,m=d()*512*.5,x=.06+d()*.09;On(c,512,g,0,v=>{v.fillStyle=`rgba(8,7,5,${x})`,v.fillRect(-b/2,m,b,p)})}return{map:_n(o.c,!0),bump:_n(l.c,!1)}}function kS(){let t=42.666666666666664,n=Mn(256),s=Mn(256),r=n.g,a=s.g;r.fillStyle="#0d0a07",r.fillRect(0,0,256,256),a.fillStyle="#000",a.fillRect(0,0,256,256);for(let o=0;o<6;o++){let l=Ds(Le(o,3,28685)),c=o*t+1.5,h=t-3,u=.78+l()*.4,d=(l()-.5)*.1;r.fillStyle=`rgb(${Math.round(82*u*(1+d))},${Math.round(64*u)},${Math.round(46*u)})`,r.fillRect(c,0,h,256);let f=9+Math.floor(l()*6);for(let p=0;p<f;p++){r.strokeStyle=`rgba(18,10,5,${.05+l()*.09})`,r.lineWidth=.8+l()*1.3;let m=c+l()*h;r.beginPath(),r.moveTo(m,-4),r.bezierCurveTo(m+(l()-.5)*6,256*.33,m+(l()-.5)*6,256*.66,m+(l()-.5)*5,260),r.stroke()}if(l()<.35){let p=c+h*(.3+l()*.4),m=l()*256,x=3+l()*5,v=r.createRadialGradient(p,m,0,p,m,x*2.2);v.addColorStop(0,"rgba(16,9,4,0.7)"),v.addColorStop(.5,"rgba(30,18,9,0.35)"),v.addColorStop(1,"rgba(30,18,9,0)"),r.fillStyle=v,r.beginPath(),r.arc(p,m,x*2.2,0,Math.PI*2),r.fill()}let g=[];for(let p of[12,244])g.push([c+h*(.25+l()*.5),p]);for(let[p,m]of g)r.fillStyle="#0a0806",r.beginPath(),r.arc(p,m,2.4,0,Math.PI*2),r.fill(),r.fillStyle="rgba(190,180,160,0.5)",r.beginPath(),r.arc(p-.7,m-.7,.8,0,Math.PI*2),r.fill();let b=Math.round(120+u*70);a.fillStyle=`rgb(${b},${b},${b})`,a.fillRect(c,0,h,256);for(let[p,m]of g)a.fillStyle="rgba(255,255,255,0.85)",a.beginPath(),a.arc(p,m,2.2,0,Math.PI*2),a.fill()}return{map:_n(n.c,!0),bump:_n(s.c,!1)}}function DS(i){let t=i===0,n=Mn(256),s=Mn(256),r=n.g,a=s.g;r.fillStyle=t?"#1b1d20":"#26241f",r.fillRect(0,0,256,256),a.fillStyle="rgb(58,58,58)",a.fillRect(0,0,256,256);let o=ns(4612+i*17);for(let l=0;l<30;l++){let c=o()*256,h=o()*256,u=6+o()*22,d=t?o()<.3:o()<.75,f=.05+o()*(t?.13:.17),g=d?`rgba(112,64,34,${f.toFixed(3)})`:`rgba(5,5,6,${(f*1.2).toFixed(3)})`;On(r,256,c,h,b=>{let p=b.createRadialGradient(0,0,0,0,0,u);p.addColorStop(0,g),p.addColorStop(1,d?"rgba(112,64,34,0)":"rgba(5,5,6,0)"),b.fillStyle=p,b.beginPath(),b.arc(0,0,u,0,Math.PI*2),b.fill()})}for(let l=0;l<200;l++)r.fillStyle=o()<.6?`rgba(140,84,44,${(.06+o()*.1).toFixed(3)})`:`rgba(0,0,0,${(.08+o()*.12).toFixed(3)})`,r.fillRect(o()*256,o()*256,1+o()*1.6,1+o()*1.6);for(let l of[46,210]){r.fillStyle="#2e3136",r.fillRect(0,l-12,256,24),r.fillStyle="rgba(255,255,255,0.07)",r.fillRect(0,l-12,256,3),r.fillStyle="rgba(0,0,0,0.3)",r.fillRect(0,l+9,256,3),a.fillStyle="rgb(120,120,120)",a.fillRect(0,l-12,256,24);for(let c=16;c<256;c+=32)r.fillStyle="#3c4046",r.beginPath(),r.arc(c,l,3.4,0,Math.PI*2),r.fill(),r.fillStyle="rgba(0,0,0,0.5)",r.beginPath(),r.arc(c+.8,l+.9,2.6,0,Math.PI*2),r.fill(),a.fillStyle="rgb(210,210,210)",a.beginPath(),a.arc(c,l,3.4,0,Math.PI*2),a.fill()}for(let l=0;l<7;l++){r.strokeStyle=`rgba(200,205,214,${(.05+o()*.05).toFixed(3)})`,r.lineWidth=.8;let c=o()*256,h=o()*256;r.beginPath(),r.moveTo(c,h),r.lineTo(c+(o()-.5)*70,h+(o()-.5)*26),r.stroke()}return{map:_n(n.c,!0),bump:_n(s.c,!1)}}function HS(){let e=Mn(256),t=Mn(256),n=e.g,s=t.g;n.fillStyle="#b0aa9b",n.fillRect(0,0,256,256),s.fillStyle="rgb(150,150,150)",s.fillRect(0,0,256,256);let r=ns(45246);for(let a=0;a<22;a++){let o=8+r()*240,l=8+r()*240,c=8+r()*30,h=.05+r()*.09;On(n,256,o,l,u=>{let d=u.createRadialGradient(0,0,0,0,0,c);d.addColorStop(0,`rgba(96,92,80,${h.toFixed(3)})`),d.addColorStop(1,"rgba(96,92,80,0)"),u.fillStyle=d,u.beginPath(),u.arc(0,0,c,0,Math.PI*2),u.fill()}),On(s,256,o,l,u=>{let d=u.createRadialGradient(0,0,0,0,0,c);d.addColorStop(0,`rgba(70,70,70,${(h*1.6).toFixed(3)})`),d.addColorStop(1,"rgba(70,70,70,0)"),u.fillStyle=d,u.beginPath(),u.arc(0,0,c,0,Math.PI*2),u.fill()})}for(let a=0;a<9;a++){n.strokeStyle=`rgba(128,122,106,${(.25+r()*.2).toFixed(3)})`,n.lineWidth=.8+r()*.7,n.beginPath();let o=8+r()*240,l=8+r()*240;n.moveTo(o,l);for(let c=0;c<4;c++)o+=(r()-.5)*60,l+=(r()-.5)*60,n.lineTo(o,l);n.stroke()}for(let a=0;a<34;a++){let o=6+r()*244,l=6+r()*244,c=.8+r()*2.2;On(n,256,o,l,h=>{h.fillStyle=`rgba(70,66,56,${(.3+NS(o,l)*.3).toFixed(3)})`,h.beginPath(),h.arc(0,0,c,0,Math.PI*2),h.fill()}),On(s,256,o,l,h=>{h.fillStyle="rgba(20,20,20,0.8)",h.beginPath(),h.arc(0,0,c,0,Math.PI*2),h.fill()})}return{map:_n(e.c,!0),bump:_n(t.c,!1)}}function NS(i,e){return Le(i*10|0,e*10|0,156)}function OS(){let n=Mn(512),s=Mn(512),r=n.g,a=s.g;r.fillStyle="#171614",r.fillRect(0,0,512,512),a.fillStyle="#080808",a.fillRect(0,0,512,512);let o=[],l=[],c=ns(12630814);for(let u=0;u<8;u++){o.push([]),l.push([]);for(let d=0;d<8;d++)o[u].push((c()-.5)*64*.18),l[u].push((c()-.5)*64*.18)}let h=(u,d)=>{let f=(u%8+8)%8,g=(d%8+8)%8;return[u*64+o[g][f],d*64+l[g][f]]};for(let u=-1;u<=8;u++)for(let d=-1;d<=8;d++){let f=Ds(Le((d%8+8)%8,(u%8+8)%8,12630814)),g=[h(d,u),h(d+1,u),h(d+1,u+1),h(d,u+1)],b=g.reduce((y,w)=>y+w[0],0)/4,p=g.reduce((y,w)=>y+w[1],0)/4,m=g.map(([y,w])=>[b+(y-b)*.88,p+(w-p)*.88]),x=.75+f()*.42;r.fillStyle=`rgb(${Math.round(83*x)},${Math.round(80*x)},${Math.round(73*x)})`,Kn(r,m),r.fill(),r.save(),Kn(r,m),r.clip(),r.strokeStyle="rgba(238,224,194,0.12)",r.lineWidth=3,r.stroke(),r.restore();let v=Math.round(110+x*80);a.fillStyle=`rgb(${v},${v},${v})`,Kn(a,m),a.fill()}return{map:_n(n.c,!0),bump:_n(s.c,!1)}}function Xp(i,e){let n=Mn(512),s=Mn(512),r=n.g,a=s.g,o=i==="ash_grass",l=e>0,c=o?[45,55,43]:l?[59,53,46]:[67,57,46];r.fillStyle=`rgb(${c.join(",")})`,r.fillRect(0,0,512,512),a.fillStyle="rgb(105,105,105)",a.fillRect(0,0,512,512);let h=ns((o?42321:3351)+e*7919);for(let u=0;u<180;u++){let d=h()*512,f=h()*512,g=5+h()*30,b=h()<.5?1:-1,p=.035+h()*.09,m=o?b>0?`rgba(96,105,67,${p})`:`rgba(18,24,18,${p})`:b>0?`rgba(130,104,76,${p})`:`rgba(20,17,14,${p})`;On(r,512,d,f,x=>{let v=x.createRadialGradient(0,0,0,0,0,g);v.addColorStop(0,m),v.addColorStop(1,"rgba(0,0,0,0)"),x.fillStyle=v,x.beginPath(),x.arc(0,0,g,0,Math.PI*2),x.fill()}),On(a,512,d,f,x=>{x.fillStyle=`rgba(${b>0?"210,210,210":"20,20,20"},${p*1.8})`,x.beginPath(),x.arc(0,0,g*.75,0,Math.PI*2),x.fill()})}for(let u=0;u<(o?1500:700);u++){let d=h()*512,f=h()*512;if(o){let g=2+h()*7,b=h()<.5?"rgba(112,119,75,0.28)":"rgba(22,31,23,0.32)",p=.6+h()*.7,m=(h()-.5)*3;On(r,512,d,f,x=>{x.strokeStyle=b,x.lineWidth=p,x.beginPath(),x.moveTo(0,0),x.lineTo(m,-g),x.stroke()})}else{let g=.5+h()*(l?1.5:2.5),b=h()*Math.PI,p=.12+h()*.16;On(r,512,d,f,m=>{m.fillStyle=`rgba(16,13,11,${p})`,m.beginPath(),m.ellipse(0,0,g*1.4,g,b,0,Math.PI*2),m.fill()})}}return{map:_n(n.c,!0),bump:_n(s.c,!1)}}var Yp=new Map,Kp=new Map,US={flagstone:IS,cobble:()=>OS(),ash_dirt:i=>Xp("ash_dirt",i),ash_grass:i=>Xp("ash_grass",i),brick:LS,wood:()=>kS(),iron:DS,bone:()=>HS()},hi={id:"cellar",outdoor:!1,ambience:"crypt",floor:{kind:"flagstone",variant:0,repeatFt:27.5,roughness:.96,bumpScale:.45,metalness:.02},wall:{kind:"brick",intactVariant:0,ruinedVariant:1},trim:{woodVariant:0,ironVariant:1,sootVariant:0}},Rl={cellar:hi,crypt:{...hi,id:"crypt",floor:{...hi.floor,variant:1}},dungeon:{...hi,id:"dungeon",floor:{...hi.floor,variant:1}},town:{...hi,id:"town",outdoor:!0,ambience:"town",floor:{kind:"cobble",variant:0,repeatFt:22,roughness:.9,bumpScale:.32,metalness:.01}},road:{...hi,id:"road",outdoor:!0,ambience:"wilderness",floor:{kind:"ash_dirt",variant:1,repeatFt:34,roughness:.98,bumpScale:.22,metalness:0}},ashlands:{...hi,id:"ashlands",outdoor:!0,ambience:"wilderness",floor:{kind:"ash_dirt",variant:0,repeatFt:31,roughness:.98,bumpScale:.24,metalness:0}},wilderness:{...hi,id:"wilderness",outdoor:!0,ambience:"wilderness",floor:{kind:"ash_grass",variant:0,repeatFt:34,roughness:.96,bumpScale:.28,metalness:0}}};function Ur(i){let e=n=>String(n||"").toLowerCase().replace(/[\s-]+/g,"_"),t=e(i.tileSet);return t&&!Rl[t]&&console.warn(`[materials] unknown area tileset "${i.tileSet}"; resolving map theme/floor instead`),Rl[t]||Rl[e(i.theme)]||Rl[e(i.floor)]||hi}function Pl(i,e=0){let t=`${i}:${e}`,n=Yp.get(t);if(!n){let s=US[i];if(!s)throw new Error(`[materials] unknown kind: ${i}`);n=s(e),Yp.set(t,n)}return n}function Bt(i,e=0){let t=`${i}:${e}`,n=Kp.get(t);if(n)return n;let s;if(i==="ember")s=new vt({color:1707013,emissive:16734751,emissiveIntensity:2.3,roughness:1});else{let r=Pl(i,e),a=.9,o=0,l=.4;i==="flagstone"?(a=.96,o=.02,l=.45):i==="brick"?(a=.93,o=.03,l=.55):i==="wood"?(a=.88,l=.35):i==="iron"?(a=e===0?.66:.5,o=e===0?.58:.82,l=.3):i==="bone"&&(a=.9,o=.02,l=.3),s=new vt({map:r.map,bumpMap:r.bump,bumpScale:l,roughness:a,metalness:o})}return Kp.set(t,s),s}var Il=null;function ui(){if(Il)return Il;let i=document.createElement("canvas");i.width=i.height=64;let e=i.getContext("2d"),t=e.createRadialGradient(32,32,1,32,32,31);return t.addColorStop(0,"rgba(255,255,255,1)"),t.addColorStop(.35,"rgba(255,255,255,0.62)"),t.addColorStop(.7,"rgba(255,255,255,0.18)"),t.addColorStop(1,"rgba(255,255,255,0)"),e.fillStyle=t,e.beginPath(),e.arc(32,32,31,0,Math.PI*2),e.fill(),Il=new Ft(i),Il}var td=[];function Zp(i=0){if(td[i])return td[i];let e=document.createElement("canvas");e.width=64,e.height=128;let t=e.getContext("2d"),n=(r,a,o,l,c)=>{t.save(),t.translate(r,a),t.scale(1,l/o);let h=t.createRadialGradient(0,0,0,0,0,o);for(let[u,d]of c)h.addColorStop(u,d);t.fillStyle=h,t.beginPath(),t.arc(0,0,o,0,Math.PI*2),t.fill(),t.restore()};i===1?(n(32,72,26,50,[[0,"rgba(235,255,250,0.9)"],[.22,"rgba(160,255,230,0.7)"],[.45,"rgba(60,190,166,0.34)"],[.7,"rgba(24,110,96,0.14)"],[1,"rgba(8,40,36,0)"]]),n(32,88,11,22,[[0,"rgba(255,255,255,1)"],[.4,"rgba(190,255,240,0.85)"],[1,"rgba(120,230,205,0)"]])):(n(32,76,26,50,[[0,"rgba(255,244,214,0.9)"],[.22,"rgba(255,196,88,0.75)"],[.45,"rgba(255,120,36,0.38)"],[.7,"rgba(198,60,16,0.14)"],[1,"rgba(110,24,8,0)"]]),n(32,88,11,22,[[0,"rgba(255,255,244,1)"],[.4,"rgba(255,232,170,0.85)"],[1,"rgba(255,180,80,0)"]]));let s=new Ft(e);return s.colorSpace=Gt,td[i]=s,s}var Ll=null;function Ra(){if(Ll)return Ll;let i=document.createElement("canvas");i.width=i.height=128;let e=i.getContext("2d"),t=e.createRadialGradient(64,64,1,64,64,63);return t.addColorStop(0,"rgba(255,255,255,0.85)"),t.addColorStop(.3,"rgba(255,255,255,0.32)"),t.addColorStop(.65,"rgba(255,255,255,0.08)"),t.addColorStop(1,"rgba(255,255,255,0)"),e.fillStyle=t,e.beginPath(),e.arc(64,64,63,0,Math.PI*2),e.fill(),Ll=new Ft(i),Ll}var kl=null;function Jp(){if(kl)return kl;let i=document.createElement("canvas");i.width=i.height=32;let e=i.getContext("2d"),t=e.createRadialGradient(16,16,0,16,16,15);return t.addColorStop(0,"rgba(255,255,255,1)"),t.addColorStop(.25,"rgba(255,244,220,0.9)"),t.addColorStop(.55,"rgba(255,255,255,0.28)"),t.addColorStop(1,"rgba(255,255,255,0)"),e.fillStyle=t,e.beginPath(),e.arc(16,16,15,0,Math.PI*2),e.fill(),kl=new Ft(i),kl}var Dl=null;function jp(){if(Dl)return Dl;let i=document.createElement("canvas");i.width=16,i.height=64;let e=i.getContext("2d"),t=e.createLinearGradient(0,0,0,64);t.addColorStop(0,"rgba(255,255,255,0)"),t.addColorStop(.55,"rgba(255,255,255,0.3)"),t.addColorStop(.92,"rgba(255,255,255,0.9)"),t.addColorStop(1,"rgba(255,255,255,0)"),e.fillStyle=t,e.fillRect(0,0,16,64);let n=e.createLinearGradient(0,0,16,0);return n.addColorStop(0,"rgba(0,0,0,0)"),n.addColorStop(.5,"rgba(0,0,0,1)"),n.addColorStop(1,"rgba(0,0,0,0)"),e.globalCompositeOperation="destination-in",e.fillStyle=n,e.fillRect(0,0,16,64),Dl=new Ft(i),Dl}var Hl=null;function Qp(){if(Hl)return Hl;let i=document.createElement("canvas");i.width=16,i.height=128;let e=i.getContext("2d"),t=e.createLinearGradient(0,0,0,128);return t.addColorStop(0,"rgba(255,255,255,0.85)"),t.addColorStop(.55,"rgba(255,255,255,0.32)"),t.addColorStop(1,"rgba(255,255,255,0)"),e.fillStyle=t,e.fillRect(0,0,16,128),Hl=new Ft(i),Hl}var nd=null;function Nl(i=256){if(nd)return nd;let e=document.createElement("canvas");e.width=e.height=i;let t=e.getContext("2d"),n=t.createImageData(i,i),s=[[4,.5],[8,.25],[16,.15],[32,.1]],r=24301,a=()=>(r=r*16807%2147483647,r/2147483647),o=s.map(([h])=>{let u=new Float32Array(h*h);for(let d=0;d<u.length;d++)u[d]=a();return u}),l=h=>h*h*(3-2*h);for(let h=0;h<i;h++)for(let u=0;u<i;u++){let d=0;for(let b=0;b<s.length;b++){let p=s[b][0],m=s[b][1],x=o[b],v=u/i*p,y=h/i*p,w=Math.floor(v),_=Math.floor(y),M=l(v-w),T=l(y-_),L=w%p,S=(w+1)%p,E=_%p,D=(_+1)%p,O=x[E*p+L],F=x[E*p+S],W=x[D*p+L],B=x[D*p+S];d+=m*((O*(1-M)+F*M)*(1-T)+(W*(1-M)+B*M)*T)}d=Math.max(0,Math.min(1,(d-.3)*1.8));let f=d*255|0,g=(h*i+u)*4;n.data[g]=n.data[g+1]=n.data[g+2]=f,n.data[g+3]=255}t.putImageData(n,0,0);let c=new Ft(e);return c.wrapS=c.wrapT=ai,nd=c,c}var id=[];function Pa(i=0){if(id[i])return id[i];let e=256,t=document.createElement("canvas");t.width=t.height=e;let n=t.getContext("2d"),s=9001+i*137,r=()=>(s=s*16807%2147483647,s/2147483647);n.fillStyle="#ffffff",n.fillRect(0,0,e,e);for(let o=0;o<260;o++){let l=r()*e;n.fillStyle=`rgba(0,0,0,${.03+r()*.05})`,n.fillRect(l,0,1+r()*2,e)}for(let o=0;o<120;o++){let l=r()*e;n.fillStyle=`rgba(255,246,228,${.04+r()*.05})`,n.fillRect(0,l,e,1)}for(let o=0;o<5;o++){let l=r()*e,c=r()*e,h=18+r()*36,u=14+r()*30;n.fillStyle=`rgba(20,14,8,${.06+r()*.07})`,n.fillRect(l,c,h,u),n.strokeStyle="rgba(0,0,0,0.12)",n.strokeRect(l,c,h,u)}for(let o=0;o<26;o++)n.fillStyle=`rgba(14,10,6,${.04+r()*.07})`,n.beginPath(),n.arc(r()*e,r()*e,4+r()*16,0,Math.PI*2),n.fill();let a=new Ft(t);return a.wrapS=a.wrapT=ai,a.repeat.set(2,2),a.colorSpace=Gt,id[i]=a,a}var sd=null;function em(i=256){if(sd)return sd;let e=document.createElement("canvas");e.width=e.height=i;let t=e.getContext("2d"),n=i/2,s=i/2,r=i*.38,a=t.createRadialGradient(n,s,r*.8,n,s,i*.49);a.addColorStop(0,"rgba(215, 230, 255, 0.55)"),a.addColorStop(.35,"rgba(180, 205, 240, 0.22)"),a.addColorStop(.7,"rgba(150, 180, 225, 0.06)"),a.addColorStop(1,"rgba(120, 150, 210, 0)"),t.fillStyle=a,t.beginPath(),t.arc(n,s,i*.49,0,Math.PI*2),t.fill(),t.save(),t.beginPath(),t.arc(n,s,r,0,Math.PI*2),t.clip();let o=t.createRadialGradient(n-r*.15,s-r*.15,r*.05,n,s,r);o.addColorStop(0,"#fbf8f0"),o.addColorStop(.65,"#ded9cf"),o.addColorStop(.92,"#b2aba0"),o.addColorStop(1,"#78736a"),t.fillStyle=o,t.fillRect(0,0,i,i);let l=[{x:n-r*.32,y:s-r*.12,rx:r*.36,ry:r*.44,rot:.2,op:.42},{x:n+r*.1,y:s-r*.34,rx:r*.32,ry:r*.28,rot:-.1,op:.46},{x:n+r*.36,y:s-r*.18,rx:r*.26,ry:r*.24,rot:.3,op:.48},{x:n+r*.38,y:s+r*.08,rx:r*.3,ry:r*.26,rot:-.2,op:.5},{x:n+r*.22,y:s+r*.34,rx:r*.24,ry:r*.22,rot:.1,op:.44},{x:n-r*.08,y:s+r*.18,rx:r*.28,ry:r*.32,rot:-.3,op:.38},{x:n-r*.42,y:s+r*.25,rx:r*.2,ry:r*.26,rot:.4,op:.35}];for(let g of l){t.save(),t.translate(g.x,g.y),t.rotate(g.rot);let b=t.createRadialGradient(0,0,0,0,0,Math.max(g.rx,g.ry));b.addColorStop(0,`rgba(55, 52, 48, ${g.op})`),b.addColorStop(.55,`rgba(75, 71, 66, ${g.op*.8})`),b.addColorStop(.85,`rgba(105, 100, 93, ${g.op*.35})`),b.addColorStop(1,"rgba(130, 125, 118, 0)"),t.fillStyle=b,t.beginPath(),t.ellipse(0,0,g.rx,g.ry,0,0,Math.PI*2),t.fill(),t.restore()}let c=4919,h=()=>(c=c*16807%2147483647,c/2147483647);for(let g=0;g<90;g++){let b=h()*Math.PI*2,p=Math.sqrt(h())*(r*.94),m=n+Math.cos(b)*p,x=s+Math.sin(b)*p,v=1.2+h()*4.2;t.fillStyle=`rgba(40, 38, 35, ${.25+h()*.35})`,t.beginPath(),t.arc(m,x,v,0,Math.PI*2),t.fill(),t.fillStyle=`rgba(255, 252, 244, ${.4+h()*.45})`,t.beginPath(),t.arc(m-v*.25,x-v*.25,v*.55,0,Math.PI*2),t.fill()}let u=n-r*.12,d=s+r*.62;for(let g=0;g<14;g++){let b=g/14*Math.PI*2+h()*.2,p=r*(.35+h()*.45),m=t.createLinearGradient(u,d,u+Math.cos(b)*p,d+Math.sin(b)*p);m.addColorStop(0,"rgba(255, 255, 250, 0.45)"),m.addColorStop(.3,"rgba(245, 242, 235, 0.22)"),m.addColorStop(1,"rgba(220, 215, 205, 0)"),t.strokeStyle=m,t.lineWidth=1+h()*1.5,t.beginPath(),t.moveTo(u,d),t.lineTo(u+Math.cos(b)*p,d+Math.sin(b)*p),t.stroke()}t.fillStyle="#ffffff",t.beginPath(),t.arc(u,d,2.5,0,Math.PI*2),t.fill(),t.restore();let f=new Ft(e);return f.colorSpace=Gt,sd=f,f}var rd=null;function tm(i=256){if(rd)return rd;let e=document.createElement("canvas");e.width=e.height=i;let t=e.getContext("2d"),n=i/2,s=i/2,r=t.createRadialGradient(n,s,i*.18,n,s,i*.49);r.addColorStop(0,"rgba(255, 240, 200, 0.95)"),r.addColorStop(.18,"rgba(255, 205, 120, 0.65)"),r.addColorStop(.45,"rgba(255, 150, 50, 0.25)"),r.addColorStop(.75,"rgba(240, 95, 25, 0.08)"),r.addColorStop(1,"rgba(200, 50, 10, 0)"),t.fillStyle=r,t.beginPath(),t.arc(n,s,i*.49,0,Math.PI*2),t.fill();let a=t.createRadialGradient(n,s,0,n,s,i*.22);a.addColorStop(0,"#ffffff"),a.addColorStop(.45,"#fffbf2"),a.addColorStop(.8,"#ffe2a8"),a.addColorStop(1,"rgba(255, 200, 110, 0.85)"),t.fillStyle=a,t.beginPath(),t.arc(n,s,i*.22,0,Math.PI*2),t.fill();let o=new Ft(e);return o.colorSpace=Gt,rd=o,o}function Ci(i){if(!i)return"nw";let e=i.toLowerCase();return e==="tl"||e==="top_left"||e==="nw"||e==="northwest"?"nw":e==="tr"||e==="top_right"||e==="ne"||e==="northeast"?"ne":e==="br"||e==="bottom_right"||e==="se"||e==="southeast"?"se":e==="bl"||e==="bottom_left"||e==="sw"||e==="southwest"?"sw":"nw"}function nm(i,e,t){let n=Ci(t);return n==="nw"?i+e<=1:n==="se"?i+e>=1:n==="ne"?i>=e:n==="sw"?i<=e:!0}var Z=5,dn=16,Zn=new kt({color:10192992,transparent:!0,opacity:.28,depthWrite:!1,side:Mt}),im=new kt({color:11897410,transparent:!0,opacity:.36,depthWrite:!1,side:Mt}),FS=new vt({color:3566952,emissive:2383190,emissiveIntensity:1.2,metalness:.15,roughness:.35}),BS=new kt({color:9167565,transparent:!0,opacity:.52,side:Mt}),Ol=class{eng;group=new xt;areaTiles;sourceMap=null;doorLeaves=new Map;doorAnimations=new Map;waterMaterial=null;grassMaterial=null;grassTime={value:0};map=null;open=new Uint8Array(1);blockedHalfTiles=new Map;roadHalfTiles=new Map;colliders=[];indoor=!0;cameraMaxY=dn-4;constructor(e){this.eng=e}key(e,t){return t*4096+e}load(e){this.build(e)}build(e){this.sourceMap=e,this.buildWorld(e)}buildWorld(e){this.map=e,this.doorLeaves.clear(),this.doorAnimations.clear(),this.areaTiles=Ur(e),this.colliders=[],this.blockedHalfTiles.clear(),this.roadHalfTiles.clear(),this.indoor=!this.areaTiles.outdoor,this.cameraMaxY=this.indoor?dn-4:60,this.waterMaterial?.dispose(),this.waterMaterial=null,this.grassMaterial?.dispose(),this.grassMaterial=null,this.group.traverse(a=>{let o=a;o.geometry&&o.geometry.dispose()}),this.eng.scene.remove(this.group),this.group=new xt;let t=e.size.w,n=e.size.h;this.open=new Uint8Array(t*n);let s=new Set;for(let a of e.cells.wall){let[o,l,c]=a;if(c){let h=this.key(o,l),u=this.blockedHalfTiles.get(h);u||(u=new Set,this.blockedHalfTiles.set(h,u)),u.add(Ci(c))}else s.add(this.key(o,l))}let r=new Set(s);for(let a of e.cells.water||[]){let[o,l,c]=a;if(c){let h=this.key(o,l),u=this.blockedHalfTiles.get(h);u||(u=new Set,this.blockedHalfTiles.set(h,u)),u.add(Ci(c))}else r.add(this.key(o,l))}for(let a of e.cells.halfTiles||[]){let o=this.key(a.x,a.z);if(a.type==="water"||a.type==="wall"){let l=this.blockedHalfTiles.get(o);l||(l=new Set,this.blockedHalfTiles.set(o,l)),l.add(Ci(a.orientation))}else if(a.type==="road"){let l=this.roadHalfTiles.get(o);l||(l=new Set,this.roadHalfTiles.set(o,l)),l.add(Ci(a.orientation))}}for(let a=0;a<n;a++)for(let o=0;o<t;o++){let l=this.key(o,a),c=r.has(l),h=this.blockedHalfTiles.get(l);h&&(h.has("nw")&&h.has("se")||h.has("ne")&&h.has("sw"))&&(c=!0),this.open[a*t+o]=c?0:1}this.buildFloor(e,s),this.buildRoads(e),this.buildWater(e),this.buildRoomDetails(e),this.buildWalls(e,s),this.buildDoors(e),this.buildProps(e),this.buildExits(e),this.eng.scene.add(this.group)}syncDoorStates(e){if(!this.sourceMap)return null;let t=this.map,n=Ee.getState().me?.role==="dm",s=new Set;for(let l of e){if(!l.secret||!l.revealed)continue;let c=this.sourceMap.walls[l.wallIndex];if(c)if(c.x1===c.x2)for(let h=Math.floor(Math.min(c.z1,c.z2));h<Math.ceil(Math.max(c.z1,c.z2));h++)s.add(this.key(Math.floor(c.x1),h));else for(let h=Math.floor(Math.min(c.x1,c.x2));h<Math.ceil(Math.max(c.x1,c.x2));h++)s.add(this.key(h,Math.floor(c.z1)))}let r=new Map(e.map(l=>[l.wallIndex,l])),a={...this.sourceMap,cells:{...this.sourceMap.cells,wall:this.sourceMap.cells.wall.filter(([l,c])=>!s.has(this.key(l,c)))},walls:this.sourceMap.walls.map((l,c)=>{let h=r.get(c);return h?{...l,type:h.secret&&(h.revealed||n)?"secret_door":h.secret?"normal":l.type,isOpen:h.open,locked:h.locked}:l})};if(t&&JSON.stringify(t.walls)===JSON.stringify(a.walls)&&JSON.stringify(t.cells.wall)===JSON.stringify(a.cells.wall))return t;let o=new Map((t?.walls||[]).map((l,c)=>[c,!!l.isOpen]));this.buildWorld(a),this.buildLosIndex(a.walls);for(let l of e){if(o.get(l.wallIndex)===l.open)continue;let c=this.doorLeaves.get(l.wallIndex);c&&(c.rotation.y=o.get(l.wallIndex)?1.9:0,this.doorAnimations.set(l.wallIndex,{target:l.open?1.9:0}))}return a}update(e){this.waterMaterial&&(this.waterMaterial.uniforms.uTime.value+=e),this.grassTime.value+=e;for(let[t,n]of this.doorAnimations){let s=this.doorLeaves.get(t);if(!s){this.doorAnimations.delete(t);continue}let r=n.target-s.rotation.y;s.rotation.y+=r*Math.min(1,e*5),Math.abs(r)<.015&&(s.rotation.y=n.target,this.doorAnimations.delete(t))}}buildFloor(e,t){let n=e.size.w,s=e.size.h,r=this.areaTiles.floor,a=Pl(r.kind,r.variant);a.map.repeat.set(n*Z/r.repeatFt,s*Z/r.repeatFt),a.bump.repeat.copy(a.map.repeat);let o=new Float32Array(n*s*4*3),l=new Float32Array(n*s*4*2),c=new Float32Array(n*s*4*3),h=new Uint32Array(n*s*6),u=(M,T)=>M<0||T<0||M>=n||T>=s?!0:t.has(this.key(M,T)),d=new Set((e.cells.road||[]).map(([M,T])=>this.key(M,T))),f=new Set((e.cells.water||[]).map(([M,T])=>this.key(M,T)));for(let M of e.cells.halfTiles||[])M.type==="road"&&d.add(this.key(M.x,M.z)),M.type==="water"&&f.add(this.key(M.x,M.z));let g={forest:[.78,1.08,.78],meadow:[1.08,1.12,.86],snow_forest:[1.15,1.24,1.25],snowfield:[1.45,1.52,1.58],deadlands:[1.04,.91,.76],mountains:[1.12,1.12,1.1],town:[1.28,1.16,.93],graveyard:[.82,.96,.78],ruins:[.88,.92,.8]},b=e.terrain?.heightFt||[],p=e.terrain?.width||0,m=(M,T)=>p&&b[T*p+M]||0,x=e.biomes?.kinds||[],v=e.biomes?.cells||[];for(let M=0;M<s;M++)for(let T=0;T<n;T++){let L=M*n+T,S=L*4,E=L*6,D=[[T,M,0,0],[T+1,M,1,0],[T,M+1,0,1],[T+1,M+1,1,1]],O=v[L],F=(O===void 0?void 0:x[O])||x[0],W=[...g[F]||[1,1,1]],B=.82+Le(T,M,11)*.3;(u(T,M-1)||u(T,M+1)||u(T-1,M)||u(T+1,M))&&(B*=.76),d.has(this.key(T,M))&&(W[0]*=1.12,W[1]*=.94,W[2]*=.78);let q=99;for(let le=-2;le<=2;le++)for(let X=-2;X<=2;X++)if(f.has(this.key(T+X,M+le))){let te=Math.hypot(X,le);te<q&&(q=te)}if(q<=2.2){let le=Math.min(1,(2.2-q)/1.4);W[0]=W[0]*(1-le)+.7*le,W[1]=W[1]*(1-le)+.63*le,W[2]=W[2]*(1-le)+.51*le,q<=.9&&(B*=.88,B+=(Le(T*7|0,M*7|0,883)-.5)*.16)}for(let le=0;le<4;le++){let[X,te,Pe,$e]=D[le],$=(S+le)*3,se=(S+le)*2;o[$]=X*Z,o[$+1]=m(X,te),o[$+2]=te*Z,l[se]=X/n,l[se+1]=te/s,c[$]=W[0]*B,c[$+1]=W[1]*B,c[$+2]=W[2]*B}h.set([S,S+2,S+1,S+1,S+2,S+3],E)}let y=new Qe;y.setAttribute("position",new Xe(o,3)),y.setAttribute("uv",new Xe(l,2)),y.setAttribute("color",new Xe(c,3)),y.setIndex(new Xe(h,1)),y.computeVertexNormals();let w=new vt({map:a.map,bumpMap:a.bump,bumpScale:r.bumpScale,roughness:r.roughness,metalness:r.metalness,vertexColors:!0}),_=new he(y,w);_.receiveShadow=!0,this.group.add(_)}buildWater(e){let t=e.cells.water||[],n=(e.cells.halfTiles||[]).filter(x=>x.type==="water");if(!t.length&&!n.length)return;let s=[];for(let x of t){let[v,y,w]=x;s.push({x:v,z:y,orientation:w?Ci(w):void 0})}for(let x of n)s.push({x:x.x,z:x.z,orientation:Ci(x.orientation)});let r=0;for(let x of s)r+=x.orientation?1:2;let a=r*3,o=new Float32Array(a*3),l=new Uint32Array(a),c=e.terrain?.heightFt||[],h=e.terrain?.width||0,u=(x,v)=>h&&c[v*h+x]||0,d=e.cells.waterSurfaceFt||[],f=(x,v)=>{let y=d[v*e.size.w+x];return typeof y=="number"?y:u(x,v)+.28},g=new Set;for(let x of s)g.add(this.key(x.x,x.z));let b=0;for(let x of s){let{x:v,z:y,orientation:w}=x,_=[v,y],M=[v+1,y],T=[v,y+1],L=[v+1,y+1],S=[];w?w==="nw"?S.push([_,T,M]):w==="se"?S.push([L,M,T]):w==="ne"?S.push([M,_,L]):w==="sw"&&S.push([T,L,_]):S.push([_,T,M],[M,T,L]);for(let E of S)for(let[D,O]of E){let F=b*3;o[F]=D*Z,o[F+2]=O*Z;let W=Math.min(e.size.w-1,Math.max(0,Math.floor(D))),B=Math.min(e.size.h-1,Math.max(0,Math.floor(O))),ee=f(W,B),q=u(D,O),le=!1;for(let[X,te]of[[D-1,O-1],[D,O-1],[D-1,O],[D,O]])(X<0||te<0||X>=e.size.w||te>=e.size.h||!g.has(this.key(X,te)))&&(le=!0);w&&(le=!0),o[F+1]=le?Math.min(ee,q-.12):ee,l[b]=b,b++}}let p=new Qe;p.setAttribute("position",new Xe(o,3)),p.setIndex(new Xe(l,1)),p.computeVertexNormals(),this.waterMaterial=new At({uniforms:{uTime:{value:0}},vertexShader:`
        varying vec3 vWorld;
        varying vec3 vNormal;
        varying vec3 vViewDirection;
        void main() {
          vec4 world = modelMatrix * vec4(position, 1.0);
          vWorld = world.xyz;
          vNormal = normalize(normalMatrix * normal);
          vViewDirection = cameraPosition - world.xyz;
          gl_Position = projectionMatrix * viewMatrix * world;
        }
      `,fragmentShader:`
        uniform float uTime;
        varying vec3 vWorld;
        varying vec3 vNormal;
        varying vec3 vViewDirection;
        float hash21(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }
        float waterNoise(vec2 p) {
          vec2 cell = floor(p), f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          return mix(mix(hash21(cell), hash21(cell + vec2(1.0, 0.0)), f.x),
            mix(hash21(cell + vec2(0.0, 1.0)), hash21(cell + vec2(1.0, 1.0)), f.x), f.y);
        }
        float waterCells(vec2 p) {
          vec2 cell = floor(p), f = fract(p);
          float nearest = 2.0, nextNearest = 2.0;
          for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
            vec2 offset = vec2(float(x), float(y));
            vec2 point = offset + 0.5 + 0.32 * sin(6.28318 * hash21(cell + offset));
            float distanceToPoint = length(point - f);
            if (distanceToPoint < nearest) {
              nextNearest = nearest;
              nearest = distanceToPoint;
            } else if (distanceToPoint < nextNearest) {
              nextNearest = distanceToPoint;
            }
          }
          return nextNearest - nearest;
        }
        void main() {
          vec2 p = vWorld.xz;
          vec2 flow = vec2(uTime * 0.035, -uTime * 0.021);
          float broad = waterNoise(p * 0.12 + flow);
          float fine = waterNoise(p * 0.31 - flow.yx * 1.4);
          float cells = waterCells(p * 0.095 + flow * 0.45);
          float edge = 1.0 - smoothstep(0.025, 0.11, cells);
          float swell = 0.5 + 0.5 * sin(p.x * 0.16 +
            sin(p.y * 0.1 + uTime * 0.24) + uTime * 0.35);
          float pattern = clamp(broad * 0.27 + fine * 0.16 + swell * 0.57, 0.0, 1.0);
          float fresnel = pow(1.0 - max(dot(normalize(vViewDirection), vec3(0.0, 1.0, 0.0)), 0.0), 3.0);
          vec3 deep = vec3(0.012, 0.05, 0.065);
          vec3 middle = vec3(0.035, 0.12, 0.13);
          vec3 light = vec3(0.12, 0.23, 0.19);
          vec3 color = mix(deep, middle, smoothstep(0.22, 0.65, pattern));
          color = mix(color, light, smoothstep(0.72, 0.94, pattern) * 0.62 + fresnel * 0.14);
          color = mix(color, deep * 0.8, edge * 0.12);
          float ripple = 0.5 + 0.5 * sin(p.x * 0.24 +
            sin(p.y * 0.08 + uTime * 0.18) * 1.2 + uTime * 0.28);
          float rippleLine = smoothstep(0.86, 0.98, ripple) * (0.65 + broad * 0.35);
          color += vec3(0.08, 0.12, 0.09) * rippleLine * (0.14 + fresnel * 0.22);
          gl_FragColor = vec4(color, 0.96);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,transparent:!1,depthWrite:!0,side:Mt}),this.waterMaterial.toneMapped=!0,this.waterMaterial.uniforms.uTime.value=0,this.waterMaterial.needsUpdate=!0,this.waterMaterial.defines={USE_UV:""};let m=new he(p,this.waterMaterial);m.renderOrder=1,this.group.add(m)}buildRoads(e){let t=e.cells.road||[],n=(e.cells.halfTiles||[]).filter(x=>x.type==="road");if(!t.length&&!n.length)return;let s=[];for(let x of t){let[v,y,w]=x;s.push({x:v,z:y,orientation:w?Ci(w):void 0})}for(let x of n)s.push({x:x.x,z:x.z,orientation:Ci(x.orientation)});let r=0;for(let x of s)r+=x.orientation?1:2;let a=r*3,o=new Float32Array(a*3),l=new Float32Array(a*2),c=new Float32Array(a*3),h=new Uint32Array(a),u=document.createElement("canvas");u.width=128,u.height=128;let d=u.getContext("2d");if(!d)throw new Error("Unable to create road texture canvas");d.fillStyle="#76684e",d.fillRect(0,0,128,128);for(let x=0;x<900;x++){let v=Le(x,3,421)*128,y=Le(x,5,821)*128,w=70+Math.floor(Le(x,7,1229)*55);d.fillStyle=`rgba(${w},${w*.88},${w*.68},${.18+Le(x,11,31)*.28})`,d.beginPath(),d.ellipse(v,y,.8+Le(x,13,73)*2.4,.7+Le(x,17,97)*1.5,Le(x,19,131)*Math.PI,0,Math.PI*2),d.fill()}let f=new Ft(u);f.colorSpace=Gt,f.wrapS=f.wrapT=ai;let g=new de(11837828),b=0;for(let x of s){let{x:v,z:y,orientation:w}=x,_=[v,y],M=[v+1,y],T=[v,y+1],L=[v+1,y+1],S=[];w?w==="nw"?S.push([_,T,M]):w==="se"?S.push([L,M,T]):w==="ne"?S.push([M,_,L]):w==="sw"&&S.push([T,L,_]):S.push([_,T,M],[M,T,L]);for(let E of S)for(let[D,O]of E){let F=b*3,W=b*2,B=D*Z,ee=O*Z;o[F]=B,o[F+1]=this.terrainHeightAt(B,ee)+.09,o[F+2]=ee,l[W]=B/26,l[W+1]=ee/26;let q=.78+Le(v,y,51)*.3;c[F]=g.r*q,c[F+1]=g.g*q,c[F+2]=g.b*q,h[b]=b,b++}}let p=new Qe;p.setAttribute("position",new Xe(o,3)),p.setAttribute("uv",new Xe(l,2)),p.setAttribute("color",new Xe(c,3)),p.setIndex(new Xe(h,1)),p.computeVertexNormals();let m=new he(p,new vt({map:f,color:16777215,vertexColors:!0,roughness:1,metalness:0,polygonOffset:!0,polygonOffsetFactor:-1}));m.receiveShadow=!0,m.renderOrder=1,this.group.add(m)}terrainHeightAt(e,t){let n=this.map?.terrain;if(!n||n.width!==this.map.size.w+1||n.height!==this.map.size.h+1)return 0;let s=Math.max(0,Math.min(this.map.size.w-1,e/Z)),r=Math.max(0,Math.min(this.map.size.h-1,t/Z)),a=Math.floor(s),o=Math.floor(r),l=s-a,c=r-o,h=(f,g)=>n.heightFt[g*n.width+f]||0,u=h(a,o)+(h(a+1,o)-h(a,o))*l,d=h(a,o+1)+(h(a+1,o+1)-h(a,o+1))*l;return u+(d-u)*c}buildRoomDetails(e){if(!e.roomRects?.length)return;let t=(s,r,a,o,l)=>{let c=new he(new Ps(a,o,48),l);c.rotation.x=-Math.PI/2,c.position.set(s*Z,.035,r*Z),c.renderOrder=1,this.group.add(c)},n=(s,r,a,o,l)=>{let c=new he(new Ue(a,.025,o),l);return c.position.set(s*Z,.04,r*Z),c.renderOrder=1,this.group.add(c),c};for(let s of e.roomRects){let r=(s.x1+s.x2+1)/2,a=(s.z1+s.z2+1)/2,o=(s.x2-s.x1-1)*Z,l=(s.z2-s.z1-1)*Z;if(s.id===e.bossRoom){let h=Math.min(o,l)*.38;t(r,a,h-.42,h,im),t(r,a,h*.56-.32,h*.56,Zn);for(let u=0;u<8;u++){let d=u*Math.PI/4,f=r+Math.cos(d)*h*.78/Z,g=a+Math.sin(d)*h*.78/Z,b=n(f,g,1.3,.28,im);b.rotation.y=-d}}else if(s.module==="burial_chapel"){let h=Math.min(o,l)*.24;t(r,a,h-.32,h,Zn),t(r,a,h*.55-.24,h*.55,Zn)}else if(s.module==="processional_gallery"){let h=o>=l,u=(h?o:l)*.82,d=Math.min(o,l)*.22;if(h){n(r,a-d/(2*Z),u,.24,Zn),n(r,a+d/(2*Z),u,.24,Zn);for(let f=-1;f<=1;f++)n(r+f*u/(3*Z),a,.24,d,Zn)}else{n(r-d/(2*Z),a,.24,u,Zn),n(r+d/(2*Z),a,.24,u,Zn);for(let f=-1;f<=1;f++)n(r,a+f*u/(3*Z),d,.24,Zn)}}else s.module==="entry_vestibule"&&(n(r,a-.55,o*.7,.22,Zn),n(r,a+.55,o*.7,.22,Zn))}}buildWalls(e,t){let n=e.size.w,s=e.size.h,r=this.areaTiles.wall,a=[],o=[],l=[],c=[],h=(m,x)=>m>=0&&x>=0&&m<n&&x<s&&!t.has(this.key(m,x));for(let[m,x]of e.cells.wall){let v=h(m,x-1)||h(m,x+1)||h(m-1,x)||h(m+1,x);if((v&&Le(m,x,7)<.22?o:a).push([m,x]),v&&Le(m,x,29)<.23){let y=[];h(m,x-1)&&y.push([!0,m*Z+Z/2,x*Z+.55]),h(m,x+1)&&y.push([!0,m*Z+Z/2,(x+1)*Z-.55]),h(m-1,x)&&y.push([!1,m*Z+.55,x*Z+Z/2]),h(m+1,x)&&y.push([!1,(m+1)*Z-.55,x*Z+Z/2]);let w=y[Math.floor(Le(m,x,31)*y.length)];w&&(w[0]?l:c).push([w[1],w[2]])}this.colliders.push({x1:m*Z,z1:x*Z,x2:(m+1)*Z,z2:(x+1)*Z,yMin:0,yMax:dn})}for(let m of new Set([r.intactVariant,r.ruinedVariant])){let x=Pl(r.kind,m);x.map.repeat.set(1,1.6),x.bump.repeat.set(1,1.6)}let u=new gt,d=new de,f=(m,x)=>{if(!m.length)return;let v=new Ue(Z,dn,Z),y=x===0?r.intactVariant:r.ruinedVariant,w=new Ei(v,Bt(r.kind,y),m.length);w.castShadow=!0,w.receiveShadow=!0,m.forEach(([_,M],T)=>{u.position.set(_*Z+Z/2,dn/2,M*Z+Z/2),u.rotation.set(0,0,0),u.scale.set(1,1,1),u.updateMatrix(),w.setMatrixAt(T,u.matrix);let L=.78+Le(_,M,3)*.32,S=(Le(_,M,5)-.5)*.08;d.setRGB(L*(1+S),L,L*(1-S*.8)),x===1&&d.multiplyScalar(.92),w.setColorAt(T,d)}),w.instanceMatrix.needsUpdate=!0,w.instanceColor&&(w.instanceColor.needsUpdate=!0),this.group.add(w)};f(a,0),f(o,1);let g=Bt(r.kind,r.intactVariant),b=(m,x)=>{if(!m.length)return;let v=[x?[1.45,dn-2.2,1]:[1,dn-2.2,1.45],x?[2.75,1.15,1.35]:[1.35,1.15,2.75],x?[2.75,1.15,1.35]:[1.35,1.15,2.75]],y=[dn/2,.8,dn-.8];v.forEach(([w,_,M],T)=>{let L=new Ei(new Ue(w,_,M),g,m.length),S=new gt;m.forEach(([E,D],O)=>{S.position.set(E,y[T],D),S.updateMatrix(),L.setMatrixAt(O,S.matrix),L.setColorAt(O,new de(T===0?.76:.88,T===0?.76:.88,T===0?.76:.88))}),L.castShadow=!0,L.receiveShadow=!0,this.group.add(L)})};b(l,!0),b(c,!1);let p=[];for(let[m,x]of o){let v=Ds(Le(m,x,23)),y=1+Math.floor(v()*3);for(let w=0;w<y;w++){let _=.55+v()*.95;p.push({x:m*Z+.9+v()*(Z-1.8),y:dn-.1-_*.35,z:x*Z+.9+v()*(Z-1.8),s:_,rx:v()*3,ry:v()*3,rz:v()*3,r:.72+v()*.26,g:.68+v()*.26,b:.62+v()*.26})}}this.scatter(p,new Ue(1,.85,1),Bt(r.kind,r.ruinedVariant))}buildDoors(e){let t=Bt("wood",this.areaTiles.trim.woodVariant),n=Bt("iron",this.areaTiles.trim.ironVariant);for(let[s,r]of e.walls.entries()){if(r.type!=="door"&&r.type!=="secret_door")continue;let a=Math.max(Math.abs(r.x2-r.x1),Math.abs(r.z2-r.z1))*Z,o=r.x1===r.x2,l=o?r.x1+.5:(r.x1+r.x2)/2,c=o?(r.z1+r.z2)/2:r.z1+.5,h=l*Z,u=c*Z,d=new xt;d.position.set(h,0,u),r.x1===r.x2&&(d.rotation.y=Math.PI/2);let f=a/2,g=new Ue(.85,10.6,1.35);for(let M of[-f+.42,f-.42]){let T=new he(g,t);T.position.set(M,5.3,0),T.castShadow=!0,T.receiveShadow=!0,d.add(T)}let b=new he(new Ue(a+.9,1.5,1.45),t);b.position.set(0,10.4,0),b.castShadow=!0,d.add(b);let p=new he(new Ue(a+1,.5,1.55),n);p.position.set(0,10.15,0),d.add(p);let m=new xt;m.position.set(-f+.85,0,.35);let x=a-1.6,v=new he(new Ue(x,9.4,.42),t);v.position.set(x/2,4.9,0),v.castShadow=!0,m.add(v);for(let M of[2.3,7.4]){let T=new he(new Ue(x+.14,.6,.54),n);T.position.set(x/2,M,0),m.add(T)}let y=new he(new qn(.34,.07,6,14),n);y.position.set(x-.5,4.6,.4),y.rotation.x=Math.PI/2,m.add(y),m.rotation.y=r.isOpen?1.9:0,d.add(m),this.group.add(d),this.doorLeaves.set(s,m);let w=r.x1===r.x2?1.2:f+.8,_=r.x1===r.x2?f+.8:1.2;if(this.colliders.push({x1:h-w,z1:u-_,x2:h+w,z2:u+_,yMin:0,yMax:11,decor:!0}),!r.isOpen){let M=r.x1===r.x2?.36:Math.max(.5,f-.6),T=r.x1===r.x2?Math.max(.5,f-.6):.36;this.colliders.push({x1:h-M,z1:u-T,x2:h+M,z2:u+T,yMin:0,yMax:10.2})}}}buildProps(e){let t=Bt("wood",this.areaTiles.trim.woodVariant),n=Bt("iron",this.areaTiles.trim.sootVariant),s=Bt("iron",this.areaTiles.trim.ironVariant),r=Bt("bone",0),a=Bt("ember"),o=[],l=new Map,c=[],h=[],u=[],d=[],f=[],g=[];for(let p of e.props){let m=p.x*Z,x=p.z*Z,v=Ds(Le(p.x*64|0,p.z*64|0,101));if(p.type==="tree")g.push(p);else if(p.type==="building")this.buildTownBuilding(p,m,x);else if(p.type==="boulder"||p.type==="rock"||p.type==="scree"){let y=(p.scale||1)*(p.type==="boulder"?1.9:p.type==="rock"?.55:.8),w=this.terrainHeightAt(m,x),_=p.shape||(p.type==="boulder"?"angular":"slab"),M=l.get(_)||[];if(M.push({x:m,y:w+y*.45,z:x,s:y,rx:v()*.3,ry:p.rotY||v()*Math.PI,rz:v()*.3,r:p.variant==="snowfield"||p.variant==="snow_forest"?.78:.62+v()*.25,g:p.variant==="deadlands"?.39+v()*.16:.58+v()*.25,b:p.variant==="snowfield"||p.variant==="snow_forest"?.86:.5+v()*.24}),l.set(_,M),p.type==="boulder"){let T=Math.max(1.1,y*.75);this.colliders.push({x1:m-T,z1:x-T,x2:m+T,z2:x+T,yMin:0,yMax:5})}if(p.type==="boulder"||y>.75){let T=p.type==="scree"?5+Math.floor(v()*6):3+Math.floor(v()*4);for(let L=0;L<T;L++){let S=v()*Math.PI*2,E=y*(.8+v()*1.2),D=m+Math.cos(S)*E,O=x+Math.sin(S)*E,F=y*(.16+v()*.28),W=this.terrainHeightAt(D,O);c.push({x:D,y:W+F*.32,z:O,s:F,rx:v()*3,ry:v()*3,rz:v()*3,r:p.variant==="snowfield"||p.variant==="snow_forest"?.76:.58+v()*.24,g:p.variant==="deadlands"?.37+v()*.16:.55+v()*.24,b:p.variant==="snowfield"||p.variant==="snow_forest"?.84:.48+v()*.24})}}}else if(p.type==="twig"||p.type==="dead_brush"){let y=(p.scale||1)*(p.type==="dead_brush"?.85:.65),w=m+(v()-.5)*1.6,_=x+(v()-.5)*1.6;h.push({x:w,y:this.terrainHeightAt(w,_)+y*.15,z:_,s:y,rx:(v()-.5)*.4,ry:p.rotY||v()*Math.PI*2,rz:(v()-.5)*.4,r:.38+v()*.12,g:.28+v()*.1,b:.2+v()*.08})}else if(p.type==="wildflower"){let y=(p.scale||1)*.55,w=m+(v()-.5)*1.8,_=x+(v()-.5)*1.8,M=[[.92,.24,.24],[.95,.72,.18],[.72,.38,.9],[.34,.58,.95]],T=M[Math.floor(v()*M.length)];u.push({x:w,y:this.terrainHeightAt(w,_)+y*.35,z:_,s:y,rx:0,ry:v()*Math.PI*2,rz:(v()-.5)*.2,r:T[0],g:T[1],b:T[2]})}else if(p.type==="fern"){let y=(p.scale||1)*.75,w=m+(v()-.5)*1.7,_=x+(v()-.5)*1.7;d.push({x:w,y:this.terrainHeightAt(w,_)+y*.25,z:_,s:y,rx:0,ry:v()*Math.PI*2,rz:(v()-.5)*.2,r:.24+v()*.12,g:.52+v()*.18,b:.22+v()*.1})}else if(p.type==="snow_drift"){let y=(p.scale||1)*1.25,w=m+(v()-.5)*2,_=x+(v()-.5)*2;f.push({x:w,y:this.terrainHeightAt(w,_)+y*.22,z:_,s:y,rx:0,ry:v()*Math.PI*2,rz:0,r:.88,g:.92,b:.98})}else if(p.type==="bridge"){let y=new xt,w=(p.width||2.4)*Z,_=(p.length||5)*Z,M=new he(new Ue(w,.45,_),t);M.position.y=.22,M.receiveShadow=!0,M.castShadow=!0,y.add(M);let T=Bt("wood",0),L=w/2-.45;for(let S of[-L,L]){let E=new he(new Ue(.55,.7,_+.2),T);E.position.set(S,.1,0),E.castShadow=!0,y.add(E);let D=new he(new Ue(.35,.25,_+.2),T);D.position.set(S,2.2,0),D.castShadow=!0,y.add(D);let O=6;for(let F=0;F<O;F++){let W=-_/2+_/(O-1)*F,B=new he(new Ue(.35,2.1,.35),T);B.position.set(S,1.1,W),B.castShadow=!0,y.add(B)}}y.position.set(m,this.terrainHeightAt(m,x)+.18,x),y.rotation.y=p.rotY||0,this.group.add(y)}else if(p.type==="grave_marker"){let y=new xt,w=new he(new Ue(1.5,2.5,.45),r);w.position.y=1.25,w.castShadow=!0,y.add(w);let _=new he(new Ue(2.3,.4,.55),r);_.position.y=2.45,y.add(_),y.position.set(m,this.terrainHeightAt(m,x),x),y.rotation.y=p.rotY||0,this.group.add(y)}else if(p.type==="ruin_pillar"){let y=new he(new Ct(.9,1.3,4.5*(p.scale||1),7),r);y.position.set(m,this.terrainHeightAt(m,x)+2.25*(p.scale||1),x),y.rotation.z=.12*(p.scale||1),y.castShadow=!0,y.receiveShadow=!0,this.group.add(y)}else if(p.type==="cave_entrance")this.buildCaveMouth(m,x);else if(p.type==="well")this.buildTownWell(m,x);else if(p.type==="street_lantern")this.buildStreetLantern(m,x);else if(p.type==="brazier"){let y=new xt,w=new he(new Ct(1.5,1,1.8,10),n);w.position.y=3.4,w.castShadow=!0,y.add(w);let _=new he(new qn(1.48,.17,8,18),s);_.rotation.x=Math.PI/2,_.position.y=4.28,y.add(_);let M=new he(new Ct(.34,.6,3.1,8),n);M.position.y=1.6,M.castShadow=!0,y.add(M);for(let L=0;L<5;L++){let S=new he(new Pr(.42+v()*.22,0),a);S.position.set((v()-.5)*1.7,4.05+v()*.35,(v()-.5)*1.7),S.rotation.set(v()*3,v()*3,v()*3),y.add(S)}let T=new un(new sn({map:Ra(),color:16747066,transparent:!0,opacity:.55,blending:Vt,depthWrite:!1}));T.scale.setScalar(4.6),T.position.y=4.3,y.add(T),y.position.set(m,0,x),this.group.add(y),this.colliders.push({x1:m-1.4,z1:x-1.4,x2:m+1.4,z2:x+1.4,yMin:0,yMax:4})}else if(p.type==="pillar"){let y=new xt,w=new he(new Ct(2,2.45,dn,12),r);w.position.y=dn/2,w.castShadow=!0,w.receiveShadow=!0,y.add(w);let _=new he(new Ue(5.4,1.1,5.4),r);_.position.y=dn-.55,_.castShadow=!0,y.add(_);let M=new he(new Ue(5.8,1,5.8),r);M.position.y=.5,M.receiveShadow=!0,y.add(M);let T=3+Math.floor(v()*3);for(let L=0;L<T;L++){let S=v()*Math.PI*2,E=3+v()*1.5,D=.32+v()*.55;o.push({x:m+Math.cos(S)*E,y:D*.5+.08,z:x+Math.sin(S)*E,s:D,rx:v()*3,ry:v()*3,rz:v()*3,r:.5+v()*.3,g:.48+v()*.3,b:.44+v()*.3})}y.position.set(m,0,x),this.group.add(y),this.colliders.push({x1:m-2.4,z1:x-2.4,x2:m+2.4,z2:x+2.4,yMin:0,yMax:dn})}else if(p.type==="coffin"){let y=new xt,w=new he(new Ue(4.2,2.4,8.6),t);w.position.y=1.2,w.castShadow=!0,w.receiveShadow=!0,y.add(w);let _=new he(new Ct(2.1,2.1,8.2,10,1,!1,0,Math.PI),t);_.rotation.z=Math.PI/2,_.rotation.y=Math.PI/2,_.position.y=2.4,_.castShadow=!0,y.add(_),y.position.set(m,0,x),this.group.add(y),this.colliders.push({x1:m-2.2,z1:x-4.4,x2:m+2.2,z2:x+4.4,yMin:0,yMax:3})}else if(p.type==="altar"){let y=new xt,w=new he(new Ue(10,3.2,6),r);w.position.y=1.6,w.castShadow=!0,w.receiveShadow=!0,y.add(w);let _=new he(new Ue(12,1.2,8),r);_.position.y=.6,_.receiveShadow=!0,y.add(_);let M=new un(new sn({map:Ra(),color:8377544,transparent:!0,opacity:.5,blending:Vt,depthWrite:!1}));M.scale.setScalar(7),M.position.y=5,y.add(M),y.position.set(m,0,x),this.group.add(y),this.colliders.push({x1:m-5,z1:x-3,x2:m+5,z2:x+3,yMin:0,yMax:3.5})}else if(p.type==="rubble"){let y=2+Math.floor(v()*3);for(let w=0;w<y;w++){let _=.4+v()*1.1;o.push({x:m+(v()-.5)*3,y:_*.45+.08,z:x+(v()-.5)*3,s:_,rx:v()*3,ry:v()*3,rz:v()*3,r:.45+v()*.35,g:.43+v()*.35,b:.4+v()*.35})}}}this.buildRockClutter(e,c,l);let b=this.makeRockMaterial();o.length&&this.scatter(o,this.makeRockGeometry("talus"),b);for(let[p,m]of l)this.scatter(m,this.makeRockGeometry(p),b);if(c.length&&this.scatter(c,this.makeRockGeometry("pebble"),b),h.length){let p=this.makeTwigGeometry();this.scatter(h,p,new vt({color:4864814,roughness:.94}))}if(u.length){let p=this.makeWildflowerGeometry();this.scatter(u,p,new vt({color:16777215,roughness:.85}))}if(d.length){let p=this.makeFernGeometry();this.scatter(d,p,new vt({vertexColors:!0,roughness:.88,side:Mt}))}if(f.length){let p=this.makeSnowDriftGeometry();this.scatter(f,p,new vt({color:15528698,roughness:.82}))}this.buildTrees(g),this.buildGrassland(e)}buildRockClutter(e,t,n){let s=e.biomes?.cells,r=e.biomes?.kinds;if(!s||!r||s.length!==e.size.w*e.size.h)return;let a=new Set((e.cells.road||[]).map(([h,u])=>this.key(h,u))),o=new Set((e.cells.water||[]).map(([h,u])=>this.key(h,u))),l=new Set(e.cells.wall.map(([h,u])=>this.key(h,u))),c={x:56.5,z:55.5};for(let h=2;h<e.size.h-2;h+=2)for(let u=2;u<e.size.w-2;u+=2){let d=this.key(u,h);if(a.has(d)||o.has(d)||l.has(d)||Math.hypot(u-c.x,h-c.z)<14)continue;let f=r[s[h*e.size.w+u]],g=Le(u,h,4001),b=!1,p=0,m=.25;if(f==="mountains"?g>.42&&(b=!0,p=4+Math.floor(Le(u,h,4002)*5),m=.28+Le(u,h,4003)*.24):f==="forest"?g>.74&&(b=!0,p=2+Math.floor(Le(u,h,4002)*3),m=.22+Le(u,h,4003)*.18):f==="meadow"?g>.82&&(b=!0,p=2+Math.floor(Le(u,h,4002)*3),m=.18+Le(u,h,4003)*.16):f==="deadlands"?g>.62&&(b=!0,p=3+Math.floor(Le(u,h,4002)*4),m=.24+Le(u,h,4003)*.22):(f==="snowfield"||f==="snow_forest")&&g>.68&&(b=!0,p=2+Math.floor(Le(u,h,4002)*4),m=.24+Le(u,h,4003)*.2),!b)continue;let x=u*Z+Z*.5,v=h*Z+Z*.5;for(let y=0;y<p;y++){let w=y+h*103+u*991,_=Le(w,11,4004)*Math.PI*2,M=(.3+Le(w,23,4005)*1.8)*Z*.45,T=x+Math.cos(_)*M,L=v+Math.sin(_)*M,S=this.key(Math.floor(T/Z),Math.floor(L/Z));if(o.has(S)||l.has(S))continue;let E=m*(.65+Le(w,37,4006)*.7),D=this.terrainHeightAt(T,L),O=Le(w,41,4007)*3,F=Le(w,53,4008)*3,W=Le(w,67,4009)*3,B=.58+Le(w,71,4010)*.24,ee=.55+Le(w,79,4011)*.24,q=.5+Le(w,83,4012)*.24;if(f==="snowfield"||f==="snow_forest"?(B=.76+Le(w,71,4010)*.16,ee=.8+Le(w,79,4011)*.16,q=.88+Le(w,83,4012)*.1):f==="deadlands"&&(B=.34+Le(w,71,4010)*.14,ee=.32+Le(w,79,4011)*.12,q=.3+Le(w,83,4012)*.12),E>.42){let le=Le(w,89,4013)>.5?"talus":"angular",X=n.get(le)||[];X.push({x:T,y:D+E*.35,z:L,s:E,rx:O,ry:F,rz:W,r:B,g:ee,b:q}),n.set(le,X)}else t.push({x:T,y:D+E*.28,z:L,s:E,rx:O,ry:F,rz:W,r:B,g:ee,b:q})}}}makeRockMaterial(){let e=new vt({color:16777215,roughness:.94,metalness:.02});return e.onBeforeCompile=t=>{t.vertexShader=t.vertexShader.replace("#include <common>",`#include <common>
        varying vec3 vWorldPosition;
        varying vec3 vWorldNormal;
        varying float vLocalY;`),t.vertexShader=t.vertexShader.replace("#include <begin_vertex>",`#include <begin_vertex>
        #ifdef USE_INSTANCING
          vec4 worldPos = modelMatrix * instanceMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          mat3 normalMatrixInst = mat3(modelMatrix) * mat3(instanceMatrix);
          vWorldNormal = normalize(normalMatrixInst * normal);
        #else
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          vWorldNormal = normalize(mat3(modelMatrix) * normal);
        #endif
        vLocalY = position.y;`),t.fragmentShader=t.fragmentShader.replace("#include <common>",`#include <common>
        varying vec3 vWorldPosition;
        varying vec3 vWorldNormal;
        varying float vLocalY;`),t.fragmentShader=t.fragmentShader.replace("#include <color_fragment>",`#include <color_fragment>
        // \u2500\u2500 1. World-Space Macro Texturing & Sedimentary Strata \u2500\u2500
        float wsWarp = sin(vWorldPosition.x * 0.16 + vWorldPosition.z * 0.12) * 1.6;
        float strataCoord = (vWorldPosition.y + wsWarp) * 0.72;
        float strata = sin(strataCoord * 3.14159) * 0.5 + 0.5;
        float fineBands = sin(strataCoord * 8.6) * 0.5 + 0.5;

        float n1 = sin(vWorldPosition.x * 0.38 + sin(vWorldPosition.z * 0.32) * 2.2) *
                   cos(vWorldPosition.y * 0.44 + vWorldPosition.z * 0.28);
        float n2 = sin(vWorldPosition.x * 1.15 + vWorldPosition.y * 0.85) *
                   cos(vWorldPosition.z * 1.05 + vWorldPosition.x * 0.65);
        float n3 = sin(vWorldPosition.x * 2.6 + vWorldPosition.z * 2.2) *
                   cos(vWorldPosition.y * 2.8);
        float macroNoise = n1 * 0.54 + n2 * 0.31 + n3 * 0.15;

        vec3 rockBase = diffuseColor.rgb * (0.80 + macroNoise * 0.26 + strata * 0.10 - fineBands * 0.05);

        // \u2500\u2500 2. Top Overburden Blend (Moss / Snow / Lichen / Ash depending on biome) \u2500\u2500
        vec3 wNorm = normalize(vWorldNormal);
        float upSlope = clamp(wNorm.y, 0.0, 1.0);
        float topElev = smoothstep(-0.20, 0.55, vLocalY + macroNoise * 0.25);
        float topWeight = smoothstep(0.42, 0.85, upSlope) * topElev;

        vec3 mossColor   = vec3(0.24, 0.38, 0.17);
        vec3 snowColor   = vec3(0.92, 0.95, 0.99);
        vec3 ashColor    = vec3(0.17, 0.16, 0.15);
        vec3 lichenColor = vec3(0.50, 0.54, 0.44);

        vec3 topColor = mossColor;
        if (diffuseColor.b > 0.80 && diffuseColor.r > 0.70) {
          topColor = snowColor;
        } else if (diffuseColor.r < 0.44 && diffuseColor.g < 0.40) {
          topColor = ashColor;
        } else if (diffuseColor.r > 0.56 && diffuseColor.g > 0.52 && diffuseColor.b > 0.46) {
          topColor = lichenColor;
        }

        vec3 stoneWithTop = mix(rockBase, topColor, topWeight * 0.80);

        // \u2500\u2500 3. Bottom Ground Contact Blend (Loam / Mud / Slush / Ash at rock base) \u2500\u2500
        float groundFactor = 1.0 - smoothstep(-0.55, 0.28, vLocalY + macroNoise * 0.18);
        vec3 groundSoil = vec3(0.18, 0.14, 0.10);
        if (diffuseColor.b > 0.80 && diffuseColor.r > 0.70) {
          groundSoil = vec3(0.72, 0.78, 0.86);
        } else if (diffuseColor.r < 0.44 && diffuseColor.g < 0.40) {
          groundSoil = vec3(0.11, 0.10, 0.09);
        }

        diffuseColor.rgb = mix(stoneWithTop, groundSoil, groundFactor * 0.72);`),t.fragmentShader=t.fragmentShader.replace("#include <roughnessmap_fragment>",`#include <roughnessmap_fragment>
        roughnessFactor = mix(0.90, 0.98, topWeight * 0.5);`)},e.customProgramCacheKey=()=>"ashenreach-rock-ws-height-v2",e}makeRockGeometry(e){let t=new Pr(1,0),n={angular:[1.06,.88,1.02],slab:[1.48,.42,1.15],spire:[.72,1.68,.78],ridge:[1.65,.72,.68],split:[.96,1.04,1.34],pebble:[.85,.44,.76],talus:[1.14,.54,.82]},[s,r,a]=n[e]||n.angular;t.scale(s,r,a);let o=t.attributes.position;for(let l=0;l<o.count;l++){let c=o.getX(l),h=o.getY(l),u=o.getZ(l),d=Math.sin(c*2.8+h*3.4)*Math.cos(u*2.6+c*1.5)*.12;c+=c*d,h+=h*d,u+=u*d,h<-.2*r&&(h=-.32*r+(h+.2*r)*.22),o.setXYZ(l,c,h,u)}return o.needsUpdate=!0,t.computeVertexNormals(),t}mergeGeometries(e){let t=e.map(l=>l.index?l.toNonIndexed():l),n=0;for(let l of t){let c=l.getAttribute("position");c&&(n+=c.array.length)}let s=new Float32Array(n),r=new Float32Array(n),a=0;for(let l of t){let c=l.getAttribute("position"),h=l.getAttribute("normal");c&&(s.set(c.array,a),h&&r.set(h.array,a),a+=c.array.length)}let o=new Qe;return o.setAttribute("position",new Xe(s,3)),o.setAttribute("normal",new Xe(r,3)),o}makeFernGeometry(){let e=[],t=[],n=[],s=[];for(let o=0;o<7;o++){let l=o/7*Math.PI*2+(o%2?.16:-.16),c=Math.cos(l),h=Math.sin(l),u=-h,d=c,f=1.15+o%3*.18,g=4;for(let b=0;b<=g;b++){let p=b/g,m=Math.sin(p*Math.PI*.85)*.36*(1-p*.35),x=p*f,v=c*x,y=h*x,w=(b===0?.05:b===g?.02:.28*Math.sin(p*Math.PI))*.5,_=e.length/3;e.push(v-u*w,m,y-d*w,v+u*w,m,y+d*w),t.push(0,1,0,0,1,0);let M=.4+p*.24;if(n.push(.16,M,.12,.16,M,.12),b>0){let T=_-2;s.push(T,T+1,_,T+1,_+1,_)}}}let a=new Qe;return a.setAttribute("position",new He(e,3)),a.setAttribute("normal",new He(t,3)),a.setAttribute("color",new He(n,3)),a.setIndex(s),a.computeVertexNormals(),a}makeTwigGeometry(){let e=new Ct(.045,.08,1.8,5);e.rotateZ(Math.PI/2),e.rotateY(.25),e.translate(0,.04,0);let t=new Ct(.025,.045,.85,4);t.rotateZ(Math.PI/2+.65),t.rotateY(-.4),t.translate(.25,.03,.22);let n=new Ct(.02,.035,.6,4);n.rotateZ(Math.PI/2-.55),n.rotateY(.35),n.translate(-.35,.03,-.16);let s=this.mergeGeometries([e,t,n]);return e.dispose(),t.dispose(),n.dispose(),s}makeWildflowerGeometry(){let e=new Ct(.03,.045,.52,4);e.translate(0,.26,0);let t=new Ue(.28,.02,.08);t.rotateY(.4),t.translate(.08,.06,.04);let n=new Ue(.26,.02,.08);n.rotateY(-.9),n.translate(-.07,.08,-.05);let s=new Pr(.18,0);s.translate(0,.54,0);let r=this.mergeGeometries([e,t,n,s]);return e.dispose(),t.dispose(),n.dispose(),s.dispose(),r}makeSnowDriftGeometry(){let e=new Ai(1.2,8,6,0,Math.PI*2,0,Math.PI*.5);e.scale(1.4,.28,.95);let t=e.attributes.position;for(let n=0;n<t.count;n++){let s=t.getX(n),r=t.getY(n),a=t.getZ(n);r+=Math.sin(s*1.5+a*.8)*.06,t.setXYZ(n,s,Math.max(.02,r),a)}return t.needsUpdate=!0,e.computeVertexNormals(),e}buildGrassland(e){let t=e.biomes?.cells,n=e.biomes?.kinds;if(!t||!n||t.length!==e.size.w*e.size.h)return;let s=new Set((e.cells.road||[]).map(([m,x])=>this.key(m,x))),r=new Set((e.cells.water||[]).map(([m,x])=>this.key(m,x))),a=new Set(e.cells.wall.map(([m,x])=>this.key(m,x))),o=[];for(let m=1;m<e.size.h-1;m++)for(let x=1;x<e.size.w-1;x++){let v=this.key(x,m),y=n[t[m*e.size.w+x]];if(y!=="meadow"&&y!=="forest"||s.has(v)||r.has(v)||a.has(v))continue;let w=Le(x,m,207),_=y==="meadow"?this.eng.lowgfx?7+Math.floor(w*6):15+Math.floor(w*12):w>.28?this.eng.lowgfx?3+Math.floor(w*4):6+Math.floor(w*6):0;for(let M=0;M<_;M++){let T=M+m*e.size.w+x*997,L=(x-.15+Le(T,17,223)*1.3)*Z,S=(m-.15+Le(T,31,227)*1.3)*Z,E=this.key(Math.floor(L/Z),Math.floor(S/Z));if(s.has(E)||r.has(E)||a.has(E))continue;let D=y==="meadow"?[6456386,8100683,10136411,5402429]:[4547388,6256965,7897930],O=(y==="meadow"?1.08:.9)+Le(T,43,229)*.45,F=O*(.82+Le(T,71,241)*.48);o.push({x:L,z:S,y:this.terrainHeightAt(L,S),scaleXZ:O,scaleY:F,color:D[Math.floor(Le(T,59,233)*D.length)]})}}if(!o.length)return;let l=[],c=[],h=[],u=[{angle:.15,width:.22,height:1.18,bendX:.14,bendZ:.05},{angle:1.25,width:.18,height:.82,bendX:-.15,bendZ:-.08},{angle:2.2,width:.16,height:.52,bendX:.18,bendZ:.12},{angle:3.25,width:.2,height:1.05,bendX:-.12,bendZ:-.06},{angle:4.35,width:.17,height:.7,bendX:.19,bendZ:.1},{angle:5.35,width:.15,height:.44,bendX:-.14,bendZ:.07}];for(let m=0;m<u.length;m++){let x=u[m],v=Math.cos(x.angle)*x.width,y=Math.sin(x.angle)*x.width,w=x.height*.46,_=x.height,M=l.length/3;l.push(-v,0,-y,v,0,y,x.bendX-v*.65,w,x.bendZ-y*.65,x.bendX+v*.65,w,x.bendZ+y*.65,x.bendX*2.2-v*.12,_,x.bendZ*2.2-y*.12,x.bendX*2.2+v*.12,_,x.bendZ*2.2+y*.12),h.push(.52,.68,.46,.52,.68,.46,.78,.9,.64,.78,.9,.64,.98,1,.78,.98,1,.78),c.push(M,M+1,M+2,M+1,M+3,M+2,M+2,M+3,M+4,M+3,M+5,M+4)}let d=new Qe;d.setAttribute("position",new He(l,3)),d.setAttribute("color",new He(h,3)),d.setIndex(c),d.computeVertexNormals();let f=new vt({color:16777215,roughness:1,metalness:0,side:Mt,vertexColors:!0});this.grassMaterial=f,f.onBeforeCompile=m=>{m.uniforms.uGrassTime=this.grassTime,m.vertexShader=m.vertexShader.replace("#include <common>",`#include <common>
        uniform float uGrassTime;`),m.vertexShader=m.vertexShader.replace("#include <begin_vertex>",`#include <begin_vertex>
        #ifdef USE_INSTANCING
          vec3 grassOrigin = (instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
          mat3 grassRotation = mat3(
            normalize(instanceMatrix[0].xyz),
            normalize(instanceMatrix[1].xyz),
            normalize(instanceMatrix[2].xyz)
          );
          vec3 windLocal = transpose(grassRotation) * vec3(0.88, 0.0, 0.48);
          float gust = sin(grassOrigin.x * 0.12 + grassOrigin.z * 0.08 + uGrassTime * 0.85);
          transformed += windLocal * gust * position.y * position.y * 0.12;
        #endif`)},f.customProgramCacheKey=()=>"ashenreach-instanced-grass-wind-v2";let g=new Ei(d,f,o.length);g.instanceMatrix.setUsage(va);let b=new gt,p=new de;o.forEach((m,x)=>{b.position.set(m.x,m.y,m.z),b.rotation.y=Le(x,67,239)*Math.PI*2,b.scale.set(m.scaleXZ,m.scaleY,m.scaleXZ),b.updateMatrix(),g.setMatrixAt(x,b.matrix),p.setHex(m.color),g.setColorAt(x,p)}),g.instanceMatrix.needsUpdate=!0,g.instanceColor&&(g.instanceColor.needsUpdate=!0),g.castShadow=!1,g.receiveShadow=!0,this.group.add(g)}buildTrees(e){if(!e.length)return;let t=new vt({color:5913639,roughness:.96}),n=new vt({color:16777215,roughness:.94}),s=new Ei(new Ct(.5,.78,7,7),t,e.length),r=new gt,a=new de,o=new Map,l={oak:[5794366,6912840,5399099],pine:[3493184,4349257,3163963],ash:[6580806,7828299,5398851],snowpine:[7439997,9545372,6323317],dead:[6705219]},c=h=>(h.scale||1)*(h.variant==="dead"?1.2:1);e.forEach((h,u)=>{let d=h.x*Z,f=h.z*Z,g=c(h),b=this.terrainHeightAt(d,f);r.position.set(d,b+3.5*g,f),r.rotation.set(0,h.rotY||0,h.variant==="dead"?.05:0),r.scale.setScalar(g),r.updateMatrix(),s.setMatrixAt(u,r.matrix);let p=l[h.variant||"oak"]||l.oak;if(a.setHex(p[u%p.length]),s.setColorAt(u,a),h.variant!=="dead"){let x=h.variant==="snowpine"?"snowpine":h.variant==="pine"?"pine":"oak",v=o.get(x)||[];v.push(h),o.set(x,v)}let m=Math.max(.65,g*.35);this.colliders.push({x1:d-m,z1:f-m,x2:d+m,z2:f+m,yMin:0,yMax:7*g})}),s.instanceMatrix.needsUpdate=!0,s.instanceColor&&(s.instanceColor.needsUpdate=!0),s.castShadow=!0,s.receiveShadow=!0,this.group.add(s);for(let[h,u]of o){let d=h==="pine"||h==="snowpine",f=d?1:5,g=d?new Cs(3.7,11,8,1):new Ai(1,9,7),b=new Ei(g,n,u.length*f),p=new gt,m=new de;u.forEach((x,v)=>{let y=c(x),w=x.x*Z,_=x.z*Z,M=l[h]||l.oak,T=this.terrainHeightAt(w,_);for(let L=0;L<f;L++){if(d)p.position.set(w,T+10.5*y,_),p.rotation.set(0,x.rotY||0,0),p.scale.set(y,y,y);else{let E=[[0,0,0,2.6],[-2.3,.8,.2,2.05],[2.2,.7,-.2,2.05],[0,.6,2.25,2],[.2,.9,-2.2,2]],[D,O,F,W]=E[L];p.position.set(w+D*y,T+(8.3+O)*y,_+F*y),p.rotation.set(0,(x.rotY||0)+L*.61,0),p.scale.set(W*y,(W+.25)*y,W*y)}p.updateMatrix();let S=v*f+L;b.setMatrixAt(S,p.matrix),m.setHex(M[(v+L)%M.length]),b.setColorAt(S,m)}}),b.instanceMatrix.needsUpdate=!0,b.instanceColor&&(b.instanceColor.needsUpdate=!0),b.castShadow=!0,b.receiveShadow=!0,this.group.add(b)}}buildTownBuilding(e,t,n){let s={inn:{wall:7755067,roof:4796458,trim:11965784},general_store:{wall:7955526,roof:5652535,trim:12691820},smithy:{wall:5589315,roof:3879729,trim:10713154},healer:{wall:6844501,roof:5003590,trim:11774073},house:{wall:6707530,roof:4929585,trim:9336404}},r=s[e.variant||"house"]||s.house,a=(e.width||5)*Z*.82,o=(e.depth||5)*Z*.82,l=this.terrainHeightAt(t,n),c=new xt,h=new he(new Ue(a,8.5,o),new vt({color:r.wall,roughness:.94}));h.position.y=4.25,h.castShadow=!0,h.receiveShadow=!0,c.add(h);let u=new vt({color:r.roof,roughness:.98});for(let _ of[-1,1]){let M=new he(new Ue(a*.58,.7,o+1.4),u);M.position.set(_*a*.245,10.7,0),M.rotation.z=-_*.47,M.castShadow=!0,M.receiveShadow=!0,c.add(M)}let d=new _a;d.moveTo(-a/2,8.4),d.lineTo(a/2,8.4),d.lineTo(0,13.1),d.closePath();let f=new vt({color:r.wall,roughness:.96,side:Mt}),g=new he(new ml(d),f);for(let _ of[-1,1]){let M=g.clone();M.position.z=_*(o/2-.08),c.add(M)}let b=new vt({color:r.trim,roughness:.92});for(let _ of[-1,1]){let M=new he(new Ue(.65,8.4,.65),b);M.position.set(_*(a/2-.5),4.2,o/2+.12),M.castShadow=!0,c.add(M);let T=new he(new Ue(2.8,.32,.38),b);T.position.set(_*(a/2-1.6),7.5,o/2+.14),T.rotation.z=_*-.45,c.add(T)}let p=new he(new Ue(a+.6,.42,.42),b);p.position.set(0,8.35,o/2+.15),c.add(p);let m=new he(new Ue(2.6,5.2,.24),Bt("wood",0));m.position.set(0,2.6,o/2+.14),c.add(m);let x=new vt({color:15775063,emissive:11029789,emissiveIntensity:.65});for(let _ of[-1,1]){let M=new he(new Ue(1.7,1.55,.22),x);M.position.set(_*a*.27,5.5,o/2+.13),c.add(M)}let v=new he(new Ue(2.4,6.6,2.4),Bt("bone",0));v.position.set(a*.29,11.4,-o*.22),v.castShadow=!0,v.receiveShadow=!0,c.add(v),c.position.set(t,l,n),c.rotation.y=e.rotY||0,this.group.add(c);let y=(e.rotY&&Math.abs(Math.sin(e.rotY))>.5?o:a)*.44,w=(e.rotY&&Math.abs(Math.sin(e.rotY))>.5?a:o)*.44;this.colliders.push({x1:t-y,z1:n-w,x2:t+y,z2:n+w,yMin:0,yMax:12})}buildTownWell(e,t){let n=new xt,s=Bt("bone",0),r=Bt("wood",0),a=new he(new Ct(2.2,2.5,1.5,12),s);a.position.y=.75,a.castShadow=!0,n.add(a);let o=new he(new ci(1.75,16),new vt({color:3496032,roughness:.28}));o.rotation.x=-Math.PI/2,o.position.y=1.52,n.add(o);for(let c of[-1,1]){let h=new he(new Ue(.5,4.5,.5),r);h.position.set(c*2.3,2.25,0),n.add(h)}let l=new he(new Ue(5.2,.55,.55),r);l.position.y=4.3,n.add(l),n.position.set(e,this.terrainHeightAt(e,t),t),this.group.add(n)}buildStreetLantern(e,t){let n=new xt,s=Bt("iron",0),r=new vt({color:14722641,emissive:15043378,emissiveIntensity:1.1}),a=new he(new Ct(.17,.3,7,7),s);a.position.y=3.5,a.castShadow=!0,n.add(a);let o=new he(new Ue(1.2,1.45,1.2),r);o.position.y=7.2,n.add(o);let l=new he(new Cs(1,.7,6),s);l.position.y=8.2,n.add(l),n.position.set(e,this.terrainHeightAt(e,t),t),this.group.add(n)}buildCaveMouth(e,t){let n=new xt,s=Bt("bone",0),r=new he(new ci(4.3,12),new kt({color:592651,side:Mt}));r.position.set(0,4.2,.2),n.add(r);let a=new he(new qn(4,1.15,7,12,Math.PI),s);a.position.set(0,4.2,0),n.add(a);let o=this.makeRockMaterial();for(let l of[-1,1]){let c=new he(this.makeRockGeometry("angular"),o);c.position.set(l*4.2,1.5,0),c.scale.set(2.2,2.4,2.6),c.castShadow=!0,n.add(c)}n.position.set(e,this.terrainHeightAt(e,t),t),this.group.add(n)}buildExits(e){let t=Bt("bone",0);for(let n of e.exits||[]){let s=new xt,r=new he(new Ct(2.2,2.5,.35,8),t);r.position.y=.2,r.receiveShadow=!0,s.add(r);for(let c of[-1,1]){let h=new he(new Ue(.9,4.8,1.1),t);h.position.set(c*1.7,2.4,0),h.castShadow=!0,h.receiveShadow=!0,s.add(h)}let a=new he(new Ue(4.7,.9,1.3),t);a.position.y=4.75,a.castShadow=!0,s.add(a);let o=new he(new qn(1.3,.13,8,28),FS);o.position.set(0,2.55,.28),s.add(o);let l=new he(new ci(1.2,28),BS);l.position.set(0,2.55,.3),s.add(l),s.position.set(n.x*Z,0,n.z*Z),this.group.add(s)}}scatter(e,t,n){if(!e.length)return;let s=new Ei(t,n,e.length),r=new gt,a=new de;e.forEach((o,l)=>{r.position.set(o.x,o.y,o.z),r.rotation.set(o.rx,o.ry,o.rz),r.scale.setScalar(o.s),r.updateMatrix(),s.setMatrixAt(l,r.matrix),a.setRGB(o.r,o.g,o.b),s.setColorAt(l,a)}),s.instanceMatrix.needsUpdate=!0,s.instanceColor&&(s.instanceColor.needsUpdate=!0),s.castShadow=!0,s.receiveShadow=!0,this.group.add(s)}worldToCell(e,t){return{cx:Math.floor(e/Z),cz:Math.floor(t/Z)}}cellToWorld(e,t){return{x:e*Z+Z/2,z:t*Z+Z/2}}inBounds(e,t){return this.map?e>=0&&t>=0&&e<this.map.size.w&&t<this.map.size.h:!1}isOpenCell(e,t){return this.inBounds(e,t)?this.open[t*this.map.size.w+e]===1:!1}isOpenWorld(e,t){let n=this.worldToCell(e,t);if(!this.inBounds(n.cx,n.cz)||this.open[n.cz*this.map.size.w+n.cx]!==1)return!1;let s=this.blockedHalfTiles.get(this.key(n.cx,n.cz));if(s&&s.size>0){let r=(e-n.cx*Z)/Z,a=(t-n.cz*Z)/Z;for(let o of s)if(nm(r,a,o))return!1}return!0}isBlocked(e,t){return!this.isOpenWorld(e,t)}resolve(e,t,n=2){let s=e,r=t;for(let a of this.colliders){if(a.decor||a.yMin>5.5||a.yMax<.5)continue;let o=Math.max(a.x1,Math.min(s,a.x2)),l=Math.max(a.z1,Math.min(r,a.z2)),c=s-o,h=r-l,u=Math.sqrt(c*c+h*h);if(u<n)if(u>1e-4)s=o+c/u*n,r=l+h/u*n;else{let d=Math.abs(s-a.x1),f=Math.abs(a.x2-s),g=Math.abs(r-a.z1),b=Math.abs(a.z2-r),p=Math.min(d,f,g,b);p===d?s=a.x1-n:p===f?s=a.x2+n:p===g?r=a.z1-n:r=a.z2+n}}if(this.blockedHalfTiles.size>0&&this.map){let a=Math.max(0,Math.floor((s-n-1)/Z)),o=Math.min(this.map.size.w-1,Math.floor((s+n+1)/Z)),l=Math.max(0,Math.floor((r-n-1)/Z)),c=Math.min(this.map.size.h-1,Math.floor((r+n+1)/Z));for(let h=l;h<=c;h++)for(let u=a;u<=o;u++){let d=this.blockedHalfTiles.get(this.key(u,h));if(!d||d.size===0)continue;let f=u*Z,g=h*Z,b=(u+1)*Z,p=(h+1)*Z;for(let m of d){let x=0,v=0,y=0,w=0,_=0,M=0;m==="nw"?(x=f,v=p,y=b,w=g,_=.70710678,M=.70710678):m==="se"?(x=f,v=p,y=b,w=g,_=-.70710678,M=-.70710678):m==="ne"?(x=f,v=g,y=b,w=p,_=-.70710678,M=.70710678):m==="sw"&&(x=f,v=g,y=b,w=p,_=.70710678,M=-.70710678);let T=y-x,L=w-v,S=T*T+L*L||1,E=s-x,D=r-v,O=Math.max(0,Math.min(1,(E*T+D*L)/S)),F=x+O*T,W=v+O*L,B=(s-f)/Z,ee=(r-g)/Z,q=nm(B,ee,m),le=s-F,X=r-W,te=Math.hypot(le,X);if(q)s=F+_*n,r=W+M*n;else if(te<n){let Pe=n-te;te>1e-4?(s+=le/te*Pe,r+=X/te*Pe):(s+=_*Pe,r+=M*Pe)}}}}return[s,r]}segWorld=[];losClear(e,t,n,s){let r=n-e,a=s-t;for(let o of this.segWorld){if(!o.blocks)continue;let l=o.x2-o.x1,c=o.z2-o.z1,h=l*a-c*r;if(Math.abs(h)<1e-9)continue;let u=o.x1-e,d=o.z1-t,f=(l*d-c*u)/h,g=(r*d-a*u)/h;if(f>.02&&f<.98&&g>=0&&g<=1)return!1}return!0}buildLosIndex(e){this.segWorld=e.filter(t=>t.type!=="window"&&!(t.type==="door"&&t.isOpen)&&!(t.type==="secret_door"&&t.isOpen)).map(t=>{let n=t.type==="door"||t.type==="secret_door"?t.x1===t.x2?{...t,x1:t.x1+.5,x2:t.x2+.5}:{...t,z1:t.z1+.5,z2:t.z2+.5}:t;return{x1:n.x1*Z,z1:n.z1*Z,x2:n.x2*Z,z2:n.z2*Z,blocks:!0}})}};var Ia=[{hour:0,zenith:198160,midSky:462106,horizon:725794,low:527896,sunsetGlow:1450034,sunColor:10139874,moonColor:12112116,hemiSky:1844794,hemiGround:791068,ambient:2371138,rim:7244984,sunIntensity:.55,sunsetAmt:0,nightFactor:1},{hour:4.5,zenith:330006,midSky:593956,horizon:1186608,low:857122,sunsetGlow:2237496,sunColor:9480396,moonColor:11585772,hemiSky:2107966,hemiGround:922654,ambient:2634312,rim:6849706,sunIntensity:.5,sunsetAmt:0,nightFactor:.95},{hour:5.5,zenith:660520,midSky:2366008,horizon:5514302,low:3544614,sunsetGlow:10106426,sunColor:13464658,moonColor:9743570,hemiSky:3025992,hemiGround:1446944,ambient:4077136,rim:8549018,sunIntensity:.58,sunsetAmt:.45,nightFactor:.65},{hour:6.25,zenith:1453142,midSky:5909846,horizon:13914162,low:15431740,sunsetGlow:16540216,sunColor:16748096,moonColor:8558776,hemiSky:5391466,hemiGround:2628640,ambient:7230046,rim:11695204,sunIntensity:1.05,sunsetAmt:.95,nightFactor:.18},{hour:7,zenith:2247292,midSky:5668264,horizon:14060372,low:15447160,sunsetGlow:16030798,sunColor:16760420,moonColor:7768996,hemiSky:6579844,hemiGround:3287072,ambient:8814200,rim:12558974,sunIntensity:1.5,sunsetAmt:.55,nightFactor:.02},{hour:8.5,zenith:2445966,midSky:5934264,horizon:9485788,low:13164780,sunsetGlow:16765576,sunColor:16770750,moonColor:6716050,hemiSky:7241368,hemiGround:2893344,ambient:10133660,rim:10531528,sunIntensity:1.85,sunsetAmt:0,nightFactor:0},{hour:12,zenith:2117258,midSky:5408438,horizon:8959704,low:12639472,sunsetGlow:16773328,sunColor:16775912,moonColor:5926532,hemiSky:7702176,hemiGround:3156e3,ambient:10660004,rim:10269899,sunIntensity:2.1,sunsetAmt:0,nightFactor:0},{hour:16.5,zenith:2246784,midSky:5800620,horizon:10924742,low:14075564,sunsetGlow:16036454,sunColor:16765576,moonColor:6321290,hemiSky:7370892,hemiGround:3155484,ambient:10130568,rim:11708048,sunIntensity:1.75,sunsetAmt:.2,nightFactor:0},{hour:17.75,zenith:1914984,midSky:6187156,horizon:13925956,low:15442526,sunsetGlow:16157758,sunColor:16752718,moonColor:7505568,hemiSky:6707830,hemiGround:3417114,ambient:9730156,rim:13012068,sunIntensity:1.55,sunsetAmt:.75,nightFactor:0},{hour:18.5,zenith:1385550,midSky:7350876,horizon:14435882,low:15891518,sunsetGlow:16535604,sunColor:16737828,moonColor:8820916,hemiSky:5781084,hemiGround:2758684,ambient:8277590,rim:13395026,sunIntensity:1.25,sunsetAmt:1,nightFactor:.12},{hour:19.33,zenith:924218,midSky:3677252,horizon:7086650,low:4855848,sunsetGlow:10366522,sunColor:13388856,moonColor:10269394,hemiSky:3549768,hemiGround:1708570,ambient:4470344,rim:9457768,sunIntensity:.7,sunsetAmt:.6,nightFactor:.58},{hour:20.25,zenith:396834,midSky:1054254,horizon:2103338,low:1314846,sunsetGlow:3547184,sunColor:10006228,moonColor:11585772,hemiSky:2238524,hemiGround:1053210,ambient:2896966,rim:7374504,sunIntensity:.58,sunsetAmt:.15,nightFactor:.88},{hour:21,zenith:198160,midSky:462106,horizon:791588,low:528156,sunsetGlow:1450548,sunColor:10139874,moonColor:12112116,hemiSky:1844794,hemiGround:791068,ambient:2239552,rim:6981300,sunIntensity:.55,sunsetAmt:0,nightFactor:1},{hour:24,zenith:198160,midSky:462106,horizon:725794,low:527896,sunsetGlow:1450034,sunColor:10139874,moonColor:12112116,hemiSky:1844794,hemiGround:791068,ambient:2371138,rim:7244984,sunIntensity:.55,sunsetAmt:0,nightFactor:1}],Ul={clear:{fog:.001,rain:0,cloudCoverage:.38,cloudDensity:.85},overcast:{fog:.0022,rain:0,cloudCoverage:.72,cloudDensity:1.15},fog:{fog:.009,rain:0,cloudCoverage:.62,cloudDensity:1},rain:{fog:.0028,rain:.55,cloudCoverage:.8,cloudDensity:1.25},storm:{fog:.0042,rain:1,cloudCoverage:.9,cloudDensity:1.45}};function Un(i,e,t){let n=(i>>16&255)+((e>>16&255)-(i>>16&255))*t|0,s=(i>>8&255)+((e>>8&255)-(i>>8&255))*t|0,r=(i&255)+((e&255)-(i&255))*t|0;return n<<16|s<<8|r}function ad(i,e,t){return i+(e-i)*t}function zS(i){return i*i*(3-2*i)}function GS(i){let e=(i%24+24)%24;for(let n=0;n<Ia.length-1;n++){let s=Ia[n],r=Ia[n+1];if(e>=s.hour&&e<=r.hour){let a=(e-s.hour)/(r.hour-s.hour||1),o=zS(a);return{zenith:Un(s.zenith,r.zenith,o),midSky:Un(s.midSky,r.midSky,o),horizon:Un(s.horizon,r.horizon,o),low:Un(s.low,r.low,o),sunsetGlow:Un(s.sunsetGlow,r.sunsetGlow,o),sunColor:Un(s.sunColor,r.sunColor,o),moonColor:Un(s.moonColor,r.moonColor,o),hemiSky:Un(s.hemiSky,r.hemiSky,o),hemiGround:Un(s.hemiGround,r.hemiGround,o),ambient:Un(s.ambient,r.ambient,o),rim:Un(s.rim,r.rim,o),sunIntensity:ad(s.sunIntensity,r.sunIntensity,o),sunsetAmt:ad(s.sunsetAmt,r.sunsetAmt,o),nightFactor:ad(s.nightFactor,r.nightFactor,o)}}}return{...Ia[Ia.length-1]}}var sm=new N,Hs=new N,Fl=class{eng;hemi;ambient;sun;rim;stars;rain;sunDisc;moonDisc;embers=null;motes=null;groundFog=null;groundFogLayers=[];heightFogVolume=null;sunShafts=null;heightFogMat=null;sunShaftsMat=null;cloudShadows=null;cloudShadowMat=null;cloudOffset=new ue(0,0);groundFogOp=0;deadlandFog=!1;skyDome;torches=[];washLights=[];lanterns=[];embersMeta=[];motesMeta=[];obstructionBoxes=[];t=0;fogDensity=.001;rainAmt=0;fogTarget=.001;rainTarget=0;weather="clear";isCrypt=!0;thunderT=6;fireSfxT=2;flashEl;wind={x:.6,z:.2};constructor(e){this.eng=e,this.hemi=new vl(5924472,2366484,.42),e.scene.add(this.hemi),this.ambient=new bl(9081998,.38),e.scene.add(this.ambient),this.sun=new Aa(16771272,2),this.sun.castShadow=!0,this.sun.shadow.mapSize.set(e.lowgfx?1024:2048,e.lowgfx?1024:2048);let t=this.sun.shadow.camera;t.left=-90,t.right=90,t.top=90,t.bottom=-90,t.far=420,this.sun.shadow.bias=-4e-4,this.sun.shadow.normalBias=1.5,e.scene.add(this.sun),e.scene.add(this.sun.target),this.rim=new Aa(5933702,.32),this.rim.position.set(60,70,-90),e.scene.add(this.rim),this.buildStars(),this.buildRain(),this.buildSkyDiscs(),this.skyDome=this.buildSkyDome(),this.flashEl=document.createElement("div"),this.flashEl.style.cssText="position:fixed;inset:0;background:#cfd8ff;opacity:0;pointer-events:none;z-index:55;transition:opacity .12s",document.body.appendChild(this.flashEl)}buildStars(){let e=new Qe,t=new Float32Array(600*3);for(let n=0;n<600;n++){let s=Math.random()*Math.PI*2,r=Math.random()*Math.PI*.48+.05,a=500;t[n*3]=Math.cos(s)*Math.sin(r)*a,t[n*3+1]=Math.cos(r)*a*.6+40,t[n*3+2]=Math.sin(s)*Math.sin(r)*a}e.setAttribute("position",new Xe(t,3)),this.stars=new es(e,new Ti({color:12569576,size:1.6,sizeAttenuation:!1,transparent:!0,opacity:0,fog:!1,depthWrite:!1})),this.eng.scene.add(this.stars)}buildSkyDiscs(){this.sunDisc=new un(new sn({map:tm(256),color:16777215,transparent:!0,opacity:0,depthWrite:!1,fog:!1})),this.sunDisc.scale.setScalar(55),this.eng.scene.add(this.sunDisc),this.moonDisc=new un(new sn({map:em(256),color:16777215,transparent:!0,opacity:0,depthWrite:!1,fog:!1})),this.moonDisc.scale.setScalar(62),this.eng.scene.add(this.moonDisc)}buildSkyDome(){let e=new At({uniforms:{uZenith:{value:new de(2445966)},uMidSky:{value:new de(5934264)},uHorizon:{value:new de(9485788)},uLow:{value:new de(13164780)},uSunsetGlow:{value:new de(16536632)},uSunsetAmt:{value:0},uNightFactor:{value:0},uTime:{value:0},uSunDirection:{value:new N(0,1,0)},uMoonDirection:{value:new N(0,-1,0)},uSunColor:{value:new de(16775912)},uMoonColor:{value:new de(12112116)},uCloudCoverage:{value:.38},uCloudDensity:{value:.85},uWindOffset:{value:new ue(0,0)}},vertexShader:`
        varying vec3 vDirection;
        void main() {
          vDirection = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,fragmentShader:`
        uniform vec3 uZenith;
        uniform vec3 uMidSky;
        uniform vec3 uHorizon;
        uniform vec3 uLow;
        uniform vec3 uSunsetGlow;
        uniform float uSunsetAmt;
        uniform float uNightFactor;
        uniform float uTime;
        uniform vec3 uSunDirection;
        uniform vec3 uMoonDirection;
        uniform vec3 uSunColor;
        uniform vec3 uMoonColor;
        uniform float uCloudCoverage;
        uniform float uCloudDensity;
        uniform vec2 uWindOffset;

        varying vec3 vDirection;

        float hash21(vec2 p) {
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
        }

        float vnoise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(hash21(i + vec2(0.0, 0.0)), hash21(i + vec2(1.0, 0.0)), u.x),
            mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x),
            u.y
          );
        }

        float fbm(vec2 p) {
          float v = 0.0;
          v += 0.5000 * vnoise(p); p = p * 2.02 + vec2(1.6, 2.3);
          v += 0.2500 * vnoise(p); p = p * 2.03 - vec2(2.1, 1.4);
          v += 0.1250 * vnoise(p); p = p * 2.01 + vec2(3.5, 0.8);
          v += 0.0625 * vnoise(p);
          return v;
        }

        void main() {
          vec3 dir = normalize(vDirection);
          float h = dir.y;

          // 1. Atmospheric Gradient
          float upper = smoothstep(0.02, 0.72, h);
          float mid = smoothstep(-0.04, 0.38, h);
          vec3 sky = mix(uHorizon, uZenith, upper);
          sky = mix(sky, uMidSky, (1.0 - upper) * mid);
          float lower = 1.0 - smoothstep(-0.24, 0.06, h);
          sky = mix(sky, uLow, lower * 0.82);

          // 2. Sunset / Golden Hour Atmospheric Scattering Belt
          vec3 normSunDir = normalize(uSunDirection);
          vec3 normMoonDir = normalize(uMoonDirection);
          float sunAzimuth = max(0.0, dot(normalize(vec3(dir.x, 0.0, dir.z)), normalize(vec3(normSunDir.x, 0.0, normSunDir.z))));
          float sunsetBelt = exp(-pow((h - 0.035) * 8.5, 2.0));
          float sunsetDome = exp(-pow(max(0.0, h) * 3.2, 1.8));
          vec3 sunsetAtmosphere = uSunsetGlow * (sunsetBelt * (0.55 + 0.95 * pow(sunAzimuth, 2.0)) + sunsetDome * pow(sunAzimuth, 4.0) * 0.85);
          sky += sunsetAtmosphere * uSunsetAmt;

          // 3. Sun and Moon Coronas / Atmospheric Halos
          float sunDot = max(dot(dir, normSunDir), 0.0);
          float sunCorona = pow(sunDot, 64.0) * 0.45 + pow(sunDot, 12.0) * 0.18;
          sky += uSunColor * sunCorona * (1.0 - uNightFactor);

          float moonDot = max(dot(dir, normMoonDir), 0.0);
          float moonCorona = pow(moonDot, 96.0) * 0.38 + pow(moonDot, 14.0) * 0.14;
          sky += uMoonColor * moonCorona * uNightFactor * 0.75;

          // 4. Subtle background starry sparkle at night
          if (uNightFactor > 0.05 && h > 0.05) {
            float starGrid = hash21(floor(dir.xz / (h + 0.1) * 350.0));
            float starTwinkle = sin(uTime * 4.0 + starGrid * 60.0) * 0.5 + 0.5;
            float starBrightness = step(0.996, starGrid) * (0.3 + 0.7 * starTwinkle) * smoothstep(0.05, 0.25, h) * uNightFactor;
            sky += vec3(0.85, 0.92, 1.0) * starBrightness * 0.8;
          }

          // 5. Planar Troposphere Cloud Layer
          if (h > -0.05 && uCloudDensity > 0.01) {
            float planeDist = 1.0 / max(h + 0.18, 0.08);
            vec2 cloudCoord = (dir.xz * planeDist) * 0.0032 + uWindOffset;

            // Domain warping for billowing clouds
            vec2 warp = vec2(fbm(cloudCoord * 1.8 + vec2(0.0, 1.4)), fbm(cloudCoord * 1.8 + vec2(4.3, 2.8)));
            float rawDensity = fbm(cloudCoord * 2.2 + warp * 0.45);

            // Weather coverage thresholding
            float cloudThresh = 1.0 - uCloudCoverage;
            float cloudShape = smoothstep(cloudThresh - 0.18, cloudThresh + 0.22, rawDensity);
            float horizonFade = smoothstep(-0.02, 0.20, h);
            float cloudAlpha = clamp(cloudShape * horizonFade * uCloudDensity, 0.0, 1.0);

            if (cloudAlpha > 0.002) {
              // Modeling & Self-Shadowing: sample shifted towards sun
              vec2 sunShift = normalize(normSunDir.xz + vec2(0.001)) * 0.14;
              float sunSample = fbm((cloudCoord + sunShift) * 2.2 + warp * 0.45);
              float directSunIllum = clamp((rawDensity - sunSample * 0.85) * 2.6 + 0.38, 0.15, 1.25);

              // Forward Mie scattering (silver lining on sunlit edges)
              float forwardScatter = pow(sunDot, 5.0) * (1.0 - cloudShape * 0.75) * 1.35;

              // Daylight clouds
              vec3 cloudSunlit = vec3(0.94, 0.93, 0.90) * uSunColor * 1.1;
              vec3 cloudBelly = mix(uHorizon * 0.65, vec3(0.36, 0.40, 0.48), 0.52);
              vec3 dayCloud = mix(cloudBelly, cloudSunlit, clamp(directSunIllum + forwardScatter, 0.0, 1.0));

              // Golden Hour / Sunset clouds (vibrant peach, coral, salmon, and crimson alpenglow)
              vec3 sunsetCloud = mix(vec3(0.32, 0.18, 0.26), uSunsetGlow * 1.42, directSunIllum * 0.85 + forwardScatter * 1.3);

              // Night clouds (REALISTIC: dark slate charcoal, subtle moon silver illumination)
              vec2 moonShift = normalize(normMoonDir.xz + vec2(0.001)) * 0.14;
              float moonSample = fbm((cloudCoord + moonShift) * 2.2 + warp * 0.45);
              float moonIllum = clamp((rawDensity - moonSample * 0.85) * 2.0 + 0.25, 0.05, 0.95);
              float moonScatter = pow(moonDot, 4.0) * (1.0 - cloudShape * 0.7) * 0.35;
              vec3 nightCloudBase = vec3(0.022, 0.028, 0.042);
              vec3 nightCloudHighlight = vec3(0.12, 0.16, 0.24) * uMoonColor * 1.2;
              vec3 nightCloud = mix(nightCloudBase, nightCloudHighlight, clamp(moonIllum * 0.5 + moonScatter, 0.0, 1.0));

              // Blend day -> sunset -> night
              vec3 litCloud = mix(dayCloud, sunsetCloud, uSunsetAmt);
              litCloud = mix(litCloud, nightCloud, uNightFactor);

              // Crepuscular god rays breaking through cloud canopy
              float rayAngle = atan(dir.x - normSunDir.x, dir.y - normSunDir.y);
              float rays = sin(rayAngle * 14.0 + uTime * 0.025) * 0.5 + 0.5;
              rays = pow(rays, 3.0) * pow(sunDot, 2.2) * (1.0 - cloudAlpha * 0.65);
              vec3 rayColor = mix(uSunColor, uSunsetGlow, uSunsetAmt);
              sky += rayColor * rays * 0.35 * (1.0 - uNightFactor);

              // Composite cloud layer over sky
              sky = mix(sky, litCloud, cloudAlpha);
            }
          }

          gl_FragColor = vec4(sky, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,side:hn,depthWrite:!1,depthTest:!1,fog:!1,toneMapped:!1}),t=new he(new Ai(850,48,24),e);return t.renderOrder=-1e3,t.frustumCulled=!1,this.eng.scene.add(t),t}buildRain(){let e=this.eng.lowgfx?240:620,t=new Qe,n=new Float32Array(e*12),s=new Float32Array(e*8),r=new Uint32Array(e*6);for(let o=0;o<e;o++){let l=o*4,c=o*6,h=o*8;r[c]=l,r[c+1]=l+2,r[c+2]=l+1,r[c+3]=l+2,r[c+4]=l+3,r[c+5]=l+1,s[h]=0,s[h+1]=0,s[h+2]=1,s[h+3]=0,s[h+4]=0,s[h+5]=1,s[h+6]=1,s[h+7]=1}t.setAttribute("position",new Xe(n,3)),t.setAttribute("uv",new Xe(s,2)),t.setIndex(new Xe(r,1)),this.rain=new he(t,new kt({map:jp(),color:10465990,transparent:!0,opacity:0,depthWrite:!1,fog:!1})),this.rain.frustumCulled=!1,this.rain.renderOrder=4;let a=[];for(let o=0;o<e;o++)a.push({x:0,y:-100,z:0,v:40+Math.random()*24});this.rain.userData.drops=a,this.eng.scene.add(this.rain)}buildShaft(e,t,n,s,r,a,o,l){let c=new Ct(r,a,s,10,1,!0),h=new kt({color:o,map:Qp(),transparent:!0,opacity:l,blending:Vt,depthWrite:!1,side:Mt,fog:!1}),u=new he(c,h);return u.position.set(e,n-s/2,t),u.renderOrder=3,this.eng.scene.add(u),u}buildHangingLantern(e){let t=new xt,n=Bt("iron",1),s=Bt("iron",0),r=e.x*Z,a=e.z*Z,o=dn-9.7,l=new he(new Ct(.05,.05,o,5),s);l.position.y=9.7+o/2,t.add(l);for(let u=0;u<3;u++){let d=new he(new qn(.11,.035,5,10),s);d.position.y=10+u*.5,d.rotation.y=u*1.2,t.add(d)}let c=new he(new Cs(.55,.42,6),n);c.position.y=9.35,c.castShadow=!0,t.add(c);let h=new he(new Ue(.8,.12,.8),n);h.position.y=8,t.add(h);for(let[u,d]of[[-.3,-.3],[.3,-.3],[-.3,.3],[.3,.3]]){let f=new he(new Ue(.07,1.4,.07),n);f.position.set(u,8.7,d),t.add(f)}t.position.set(r,0,a),this.eng.scene.add(t),this.lanterns.push(t),this.obstructionBoxes.push({x1:r-.8,z1:a-.8,x2:r+.8,z2:a+.8,yMin:7.4,yMax:9.9,decor:!0})}buildEmbers(e){if(!e.length){this.embers=null;return}let t=e.length*10,n=new Qe,s=new Float32Array(t*3);this.embersMeta=[];for(let r=0;r<t;r++){let a=e[r%e.length],o=a.x+(Math.random()-.5)*2.4,l=a.y+Math.random()*1.6,c=a.z+(Math.random()-.5)*2.4;s[r*3]=o,s[r*3+1]=l,s[r*3+2]=c,this.embersMeta.push({hx:o,hy:l,hz:c,r:1.7,ph:Math.random()*Math.PI*2,sp:.5+Math.random()*.9})}n.setAttribute("position",new Xe(s,3)),this.embers=new es(n,new Ti({color:15243850,size:.9,transparent:!0,opacity:.85,map:Jp(),blending:Vt,depthWrite:!1})),this.embers.frustumCulled=!1,this.eng.scene.add(this.embers)}buildMotes(e){if(!e.length){this.motes=null;return}let t=e.length*12,n=new Qe,s=new Float32Array(t*3),r=new Float32Array(t*3);this.motesMeta=[];let a=new de(14200963),o=new de(10475724);for(let l=0;l<t;l++){let c=e[l%e.length],h={hx:c.x*Z,hy:c.flicker?4.2:6.2,hz:c.z*Z,r:3.5+Math.random()*2.5,h:1.6+Math.random()*1.8,sp:.1+Math.random()*.22,ph:Math.random()*Math.PI*2};this.motesMeta.push(h),s[l*3]=h.hx,s[l*3+1]=h.hy,s[l*3+2]=h.hz;let u=c.flicker?a:o;r[l*3]=u.r*.7,r[l*3+1]=u.g*.7,r[l*3+2]=u.b*.7}n.setAttribute("position",new Xe(s,3)),n.setAttribute("color",new Xe(r,3)),this.motes=new es(n,new Ti({size:.5,map:ui(),vertexColors:!0,transparent:!0,opacity:.5,blending:Vt,depthWrite:!1})),this.motes.frustumCulled=!1,this.eng.scene.add(this.motes)}buildGroundFog(e){let t=e.size.w*Z,n=e.size.h*Z,s=e.biomeBounds?.deadlands?.[0];this.deadlandFog=!!s;let r=s?s.radiusX*Z*2.2:t*1.15,a=s?s.radiusZ*Z*2.2:n*1.15,o=0;if(s&&e.terrain){let f=Math.max(0,Math.min(e.size.w,Math.round(s.x))),g=Math.max(0,Math.min(e.size.h,Math.round(s.z)));o=e.terrain.heightFt[g*e.terrain.width+f]||0}let l=Nl(256),c=s?s.x*Z:t/2,h=s?s.z*Z:n/2,u=this.isCrypt?[.8,2.2]:[1.4,3.8,7.2],d=[[.007,.0035],[-.0045,.006],[.003,-.0045]];for(let f=0;f<u.length;f++){let g=o+u[f],b=new At({uniforms:{uTime:{value:0},uNoiseTex:{value:l},uColor:{value:new de(this.isCrypt?792088:1776926)},uOpacity:{value:0},uSpeed:{value:new ue(d[f][0],d[f][1])},uTile:{value:new ue(r/(26+f*8),a/(26+f*8))}},vertexShader:`
          varying vec2 vUv;
          varying vec3 vWorldPos;
          uniform float uTime;
          void main() {
            vUv = uv;
            vec3 pos = position;
            pos.z += sin(pos.x * 0.045 + uTime * 0.7 + float(${f})) * cos(pos.y * 0.045 + uTime * 0.6) * 0.4;
            vec4 wp = modelMatrix * vec4(pos, 1.0);
            vWorldPos = wp.xyz;
            gl_Position = projectionMatrix * viewMatrix * wp;
          }
        `,fragmentShader:`
          uniform float uTime;
          uniform sampler2D uNoiseTex;
          uniform vec3 uColor;
          uniform float uOpacity;
          uniform vec2 uSpeed;
          uniform vec2 uTile;
          varying vec2 vUv;
          varying vec3 vWorldPos;
          void main() {
            // Soft radial feathering - no hard rectangular borders
            float distFromCenter = length(vUv * 2.0 - 1.0);
            float radial = 1.0 - smoothstep(0.42, 0.98, distFromCenter);
            if (radial <= 0.001) discard;

            vec2 uv1 = vUv * uTile + uSpeed * uTime * 0.25;
            vec2 uv2 = vUv * (uTile * 1.6) - vec2(uSpeed.y, uSpeed.x) * uTime * 0.2;
            float n1 = texture2D(uNoiseTex, uv1).r;
            float n2 = texture2D(uNoiseTex, uv2).r;
            float mist = mix(n1, n2, 0.48);
            mist = smoothstep(0.2, 0.8, mist);

            float alpha = uOpacity * radial * mist;
            gl_FragColor = vec4(uColor, alpha);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `,transparent:!0,depthWrite:!1,side:Mt}),p=new he(new Wn(r,a,16,16),b);p.rotation.x=-Math.PI/2,p.position.set(c,g,h),p.renderOrder=1,this.eng.scene.add(p),this.groundFogLayers.push(p)}}buildHeightFogVolume(e){let t=e.size.w*Z,n=e.size.h*Z,s=Math.max(t,n)*.75+160,r=this.isCrypt?42:180,a=new Ct(s,s,r,28,8,!0);this.heightFogMat=new At({uniforms:{uTime:{value:0},uCameraPos:{value:new N},uFogColor:{value:new de(this.isCrypt?461836:4871262)},uSunColor:{value:new de(14205602)},uSunDirection:{value:new N(0,1,0)},uBaseHeight:{value:0},uHeightFalloff:{value:this.isCrypt?.075:.038},uDensity:{value:.22},uNoiseTex:{value:Nl(256)}},vertexShader:`
        varying vec3 vWorldPos;
        varying vec3 vViewPos;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorldPos = wp.xyz;
          vec4 mvp = modelViewMatrix * vec4(position, 1.0);
          vViewPos = mvp.xyz;
          gl_Position = projectionMatrix * mvp;
        }
      `,fragmentShader:`
        uniform float uTime;
        uniform vec3 uCameraPos;
        uniform vec3 uFogColor;
        uniform vec3 uSunColor;
        uniform vec3 uSunDirection;
        uniform float uBaseHeight;
        uniform float uHeightFalloff;
        uniform float uDensity;
        uniform sampler2D uNoiseTex;
        varying vec3 vWorldPos;
        varying vec3 vViewPos;
        varying vec2 vUv;

        void main() {
          vec3 toFrag = vWorldPos - uCameraPos;
          float dist = length(toFrag);
          vec3 viewDir = normalize(toFrag);

          // Exponential height falloff: dense in low valleys/crypts, thinning above
          float fragH = max(0.0, vWorldPos.y - uBaseHeight);
          float camH = max(0.0, uCameraPos.y - uBaseHeight);
          float avgH = (fragH + camH) * 0.5;
          float heightFactor = exp(-avgH * uHeightFalloff);

          // Optical depth accumulation along the ray
          float distFactor = 1.0 - exp(-dist * 0.0075);

          // Billowing atmospheric noise drifting in world space
          vec2 noiseCoord = vWorldPos.xz * 0.005 + vec2(uTime * 0.0025, uTime * 0.0018);
          float n = texture2D(uNoiseTex, noiseCoord).r;
          float mistBillow = 0.72 + 0.38 * n;

          float fogFactor = clamp(distFactor * heightFactor * uDensity * mistBillow, 0.0, 0.88);

          // Forward solar in-scattering (Mie glow when facing sun/moon)
          float sunDot = max(0.0, dot(viewDir, normalize(uSunDirection)));
          float sunScatter = pow(sunDot, 5.0) * 0.42;
          vec3 finalColor = mix(uFogColor, uSunColor, sunScatter);

          // Fade smoothly near camera to prevent hard near-plane clipping
          float camFade = smoothstep(6.0, 30.0, dist);
          fogFactor *= camFade;

          if (fogFactor <= 0.002) discard;
          gl_FragColor = vec4(finalColor, fogFactor);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,side:Mt,transparent:!0,depthWrite:!1}),this.heightFogVolume=new he(a,this.heightFogMat),this.heightFogVolume.position.set(t/2,r/2-5,n/2),this.heightFogVolume.renderOrder=2,this.eng.scene.add(this.heightFogVolume)}buildVolumetricShafts(e){if(this.eng.lowgfx)return;let t=e.size.w*Z,n=e.size.h*Z,s=this.isCrypt?85:340,r=this.isCrypt?12:35,a=this.isCrypt?90:380,o=new Ct(r,s,a,22,6,!0);this.sunShaftsMat=new At({uniforms:{uTime:{value:0},uSunDirection:{value:new N(0,1,0)},uSunColor:{value:new de(16771272)},uCameraPos:{value:new N},uIntensity:{value:.15},uNoiseTex:{value:Nl(256)}},vertexShader:`
        varying vec3 vWorldPos;
        varying vec3 vViewPos;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorldPos = wp.xyz;
          vec4 mvp = modelViewMatrix * vec4(position, 1.0);
          vViewPos = mvp.xyz;
          gl_Position = projectionMatrix * mvp;
        }
      `,fragmentShader:`
        uniform float uTime;
        uniform vec3 uSunDirection;
        uniform vec3 uSunColor;
        uniform vec3 uCameraPos;
        uniform float uIntensity;
        uniform sampler2D uNoiseTex;
        varying vec3 vWorldPos;
        varying vec3 vViewPos;
        varying vec2 vUv;

        void main() {
          if (uIntensity <= 0.001) discard;
          vec3 viewDir = normalize(vWorldPos - uCameraPos);
          vec3 sunDir = normalize(uSunDirection);

          // Mie forward scattering phase function
          float cosTheta = dot(viewDir, sunDir);
          float g = 0.68;
          float phase = (1.0 - g * g) / pow(1.0 + g * g - 2.0 * g * cosTheta, 1.5);
          phase = clamp(phase * 0.28, 0.06, 2.5);

          // Height falloff along the beam
          float beamFade = smoothstep(0.0, 0.18, vUv.y) * smoothstep(1.0, 0.55, vUv.y);

          // Animated dust and cloud filament streaks scrolling through the shaft
          vec2 uv1 = vec2(vUv.x * 3.5 + uTime * 0.012, vUv.y * 1.8 - uTime * 0.024);
          vec2 uv2 = vec2(vUv.x * 6.0 - uTime * 0.018, vUv.y * 3.2 - uTime * 0.038);
          float n1 = texture2D(uNoiseTex, uv1).r;
          float n2 = texture2D(uNoiseTex, uv2).r;
          float shaftDensity = mix(n1, n2, 0.45);
          shaftDensity = smoothstep(0.18, 0.78, shaftDensity) * 1.35;

          // Camera near fade to prevent harsh clipping
          float dist = length(vViewPos);
          float camNearFade = smoothstep(6.0, 32.0, dist);

          float alpha = uIntensity * phase * beamFade * shaftDensity * camNearFade;
          if (alpha <= 0.002) discard;

          vec3 color = uSunColor * (1.0 + phase * 0.45);
          gl_FragColor = vec4(color * alpha, alpha * 0.82);
        }
      `,blending:Vt,depthWrite:!1,side:Mt,transparent:!0}),this.sunShafts=new he(o,this.sunShaftsMat),this.sunShafts.position.set(t/2,70,n/2),this.sunShafts.renderOrder=3,this.eng.scene.add(this.sunShafts)}setEnv(e){this.weather=e.weather,this.applyWeather()}applyWeather(){let e=Ul[this.weather]||Ul.clear;this.isCrypt?(this.fogTarget=.026+e.fog*.55,this.rainTarget=e.rain*.16):(this.fogTarget=e.fog,this.rainTarget=e.rain)}onMapTheme(e){let t=Ur(e);this.isCrypt=!t.outdoor,this.clearAtmosphere(),this.buildGroundFog(e),this.buildHeightFogVolume(e),this.buildVolumetricShafts(e),this.buildCloudShadows(e);let n=[];for(let s of e.lights){let r=new de(s.color),a=s.flicker,o=a?5.1:8.55,l=new ks(r,a?320:190,s.radiusFt*1.9,2);l.position.set(s.x*Z,o,s.z*Z),l.castShadow=a&&!this.eng.lowgfx,l.castShadow&&(l.shadow.mapSize.set(512,512),l.shadow.bias=-.004,l.shadow.normalBias=.6,l.shadow.camera.near=.5),this.eng.scene.add(l);let c=new ks(r,a?85:60,s.radiusFt*3.2,2);c.position.set(s.x*Z,o+2.6,s.z*Z),this.eng.scene.add(c),this.washLights.push(c);let h=new un(new sn({map:Zp(a?0:1),transparent:!0,opacity:.96,blending:Vt,depthWrite:!1})),u=a?3.5:1.7,d=a?5.3:2.6;h.scale.set(u,d,1),h.position.set(s.x*Z,o+(a?.55:.1),s.z*Z),this.eng.scene.add(h);let f=new un(new sn({map:Ra(),color:a?16771504:12582898,transparent:!0,opacity:.9,blending:Vt,depthWrite:!1}));f.scale.setScalar(a?2.6:1.3),f.position.copy(h.position),this.eng.scene.add(f);let g=a?this.buildShaft(s.x*Z,s.z*Z,4.9,4.6,.95,3.4,16751181,.05):this.buildShaft(s.x*Z,s.z*Z,8.3,8.1,1,2.6,8377544,.042);a?n.push({x:s.x*Z,y:5.6,z:s.z*Z}):this.buildHangingLantern(s),this.torches.push({light:l,base:a?330:195,phase:Math.random()*9,sprite:h,core:f,w:u,h:d,shaft:g,shaftBase:a?.05:.042})}this.buildEmbers(n),this.buildMotes(e.lights),this.applyWeather()}buildCloudShadows(e){if(this.cloudShadows&&(this.eng.scene.remove(this.cloudShadows),this.cloudShadows.geometry.dispose(),this.cloudShadows.material.dispose(),this.cloudShadows=null,this.cloudShadowMat=null),this.isCrypt)return;let t=e.size.w,n=e.size.h,s=e.terrain,r;if(s&&s.width===t+1&&s.height===n+1){let a=(t+1)*(n+1),o=new Float32Array(a*3),l=new Float32Array(a*2),c=new Uint32Array(t*n*6),h=s.heightFt;for(let u=0;u<=n;u++)for(let d=0;d<=t;d++){let f=(u*(t+1)+d)*3;o[f]=d*Z,o[f+1]=(h[u*(t+1)+d]||0)+.2,o[f+2]=u*Z;let g=(u*(t+1)+d)*2;l[g]=d/t,l[g+1]=1-u/n}for(let u=0;u<n;u++)for(let d=0;d<t;d++){let g=(u*t+d)*6,b=u*(t+1)+d,p=b+1,m=b+(t+1),x=m+1;c.set([b,m,p,p,m,x],g)}r=new Qe,r.setAttribute("position",new Xe(o,3)),r.setAttribute("uv",new Xe(l,2)),r.setIndex(new Xe(c,1)),r.computeVertexNormals()}else r=new Wn(t*Z,n*Z,32,32);this.cloudShadowMat=new At({uniforms:{uTime:{value:0},uWindOffset:{value:this.cloudOffset},uCloudCoverage:{value:.38},uShadowStrength:{value:.36}},vertexShader:`
        varying vec3 vWorldPos;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorldPos = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,fragmentShader:`
        uniform vec2 uWindOffset;
        uniform float uCloudCoverage;
        uniform float uShadowStrength;
        varying vec3 vWorldPos;

        float hash21(vec2 p) {
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
        }
        float vnoise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(hash21(i + vec2(0.0,0.0)), hash21(i + vec2(1.0,0.0)), u.x),
            mix(hash21(i + vec2(0.0,1.0)), hash21(i + vec2(1.0,1.0)), u.x),
            u.y
          );
        }
        float fbm(vec2 p) {
          float v = 0.0;
          v += 0.5000 * vnoise(p); p = p * 2.02 + vec2(1.6, 2.3);
          v += 0.2500 * vnoise(p); p = p * 2.03 - vec2(2.1, 1.4);
          v += 0.1250 * vnoise(p); p = p * 2.01 + vec2(3.5, 0.8);
          v += 0.0625 * vnoise(p);
          return v;
        }

        void main() {
          if (uShadowStrength <= 0.005) discard;
          vec2 cloudCoord = vWorldPos.xz * 0.0032 + uWindOffset;
          vec2 warp = vec2(fbm(cloudCoord * 1.8 + vec2(0.0, 1.4)), fbm(cloudCoord * 1.8 + vec2(4.3, 2.8)));
          float rawDensity = fbm(cloudCoord * 2.2 + warp * 0.45);
          float cloudThresh = 1.0 - uCloudCoverage;
          float shadowDensity = smoothstep(cloudThresh - 0.14, cloudThresh + 0.26, rawDensity);
          float alpha = shadowDensity * uShadowStrength;
          if (alpha <= 0.005) discard;
          gl_FragColor = vec4(0.012, 0.016, 0.026, alpha);
        }
      `,transparent:!0,depthWrite:!1,depthTest:!0,side:Mt}),this.cloudShadows=new he(r,this.cloudShadowMat),(!s||s.width!==t+1||s.height!==n+1)&&(this.cloudShadows.rotation.x=-Math.PI/2,this.cloudShadows.position.set(t*Z/2,.2,n*Z/2)),this.cloudShadows.renderOrder=1,this.eng.scene.add(this.cloudShadows)}clearAtmosphere(){for(let e of this.torches)this.eng.scene.remove(e.light),this.eng.scene.remove(e.sprite),this.eng.scene.remove(e.core),e.light.dispose(),e.sprite.material.dispose(),e.core.material.dispose(),e.shaft&&(this.eng.scene.remove(e.shaft),e.shaft.geometry.dispose(),e.shaft.material.dispose());this.torches=[];for(let e of this.washLights)this.eng.scene.remove(e),e.dispose();this.washLights=[];for(let e of this.lanterns)this.eng.scene.remove(e),e.traverse(t=>{let n=t;n.geometry&&n.geometry.dispose()});this.lanterns=[],this.obstructionBoxes=[],this.embers&&(this.eng.scene.remove(this.embers),this.embers.geometry.dispose(),this.embers.material.dispose(),this.embers=null),this.motes&&(this.eng.scene.remove(this.motes),this.motes.geometry.dispose(),this.motes.material.dispose(),this.motes=null),this.groundFog&&(this.eng.scene.remove(this.groundFog),this.groundFog.geometry.dispose(),this.groundFog.material.dispose(),this.groundFog=null);for(let e of this.groundFogLayers)this.eng.scene.remove(e),e.geometry.dispose(),e.material.dispose();this.groundFogLayers=[],this.heightFogVolume&&(this.eng.scene.remove(this.heightFogVolume),this.heightFogVolume.geometry.dispose(),this.heightFogVolume.material.dispose(),this.heightFogVolume=null,this.heightFogMat=null),this.sunShafts&&(this.eng.scene.remove(this.sunShafts),this.sunShafts.geometry.dispose(),this.sunShafts.material.dispose(),this.sunShafts=null,this.sunShaftsMat=null),this.cloudShadows&&(this.eng.scene.remove(this.cloudShadows),this.cloudShadows.geometry.dispose(),this.cloudShadows.material.dispose(),this.cloudShadows=null,this.cloudShadowMat=null)}update(e,t){if(this.t+=e,this.cloudOffset.x+=this.wind.x*e*6e-4,this.cloudOffset.y+=this.wind.z*e*6e-4,this.fireSfxT-=e,this.isCrypt&&this.fireSfxT<=0){this.fireSfxT=2.5+Math.random()*3.5;let L=this.eng.camera.position,S=this.torches.reduce((E,D)=>Math.min(E,L.distanceTo(D.light.position)),1/0);S<24&&pi("fire",1-S/24)}let n=t.time/60%24,s=GS(n),r=Ul[this.weather]||Ul.clear,a=r.cloudCoverage??.38,o=r.cloudDensity??1,l=this.eng.scene.background,c=this.eng.scene.fog,h=this.skyDome.material.uniforms,u=(n-6)/12*Math.PI,d=u+Math.PI,f=new N(-Math.cos(u),Math.sin(u)*.88,.28).normalize(),g=new N(-Math.cos(d),Math.sin(d)*.88,-.28).normalize();h.uTime.value=this.t,h.uSunDirection.value.copy(f),h.uMoonDirection.value.copy(g),h.uSunColor.value.setHex(s.sunColor),h.uMoonColor.value.setHex(s.moonColor),h.uZenith.value.setHex(this.isCrypt?395786:s.zenith),h.uMidSky.value.setHex(this.isCrypt?395786:s.midSky),h.uHorizon.value.setHex(this.isCrypt?395786:s.horizon),h.uLow.value.setHex(this.isCrypt?395786:s.low),h.uSunsetGlow.value.setHex(s.sunsetGlow),h.uSunsetAmt.value=this.isCrypt?0:s.sunsetAmt,h.uNightFactor.value=this.isCrypt?1:s.nightFactor,h.uCloudCoverage.value=a,h.uCloudDensity.value=this.isCrypt?0:o,h.uWindOffset.value.copy(this.cloudOffset),this.isCrypt?(l?.setHex(395786),c.color.setHex(461836)):(l?.setHex(s.horizon),c.color.setHex(Un(s.horizon,0,.16))),this.skyDome.position.copy(this.eng.camera.position);let b=this.eng.actors.focusPoint();if(this.isCrypt)this.sunDisc.material.opacity=0,this.moonDisc.material.opacity=0;else{this.sunDisc.position.set(b.x+f.x*480,f.y*480,b.z+f.z*480);let L=Math.max(0,Math.min(1,(f.y+.05)*6));this.sunDisc.material.opacity=L*(1-s.nightFactor*.85),this.moonDisc.position.set(b.x+g.x*480,g.y*480,b.z+g.z*480);let S=Math.max(0,Math.min(1,(g.y+.05)*6));this.moonDisc.material.opacity=S*s.nightFactor*.95}let p=f.y>.02,m=p?f:g,x=p?s.sunColor:s.moonColor,v=b.x*.0032+this.cloudOffset.x,y=b.z*.0032+this.cloudOffset.y,w=Math.sin(v*12)*Math.cos(y*12)*.5+.5,_=p&&!this.isCrypt&&a>.35?w*.28:0,M=p?s.sunIntensity*(1-_):s.sunIntensity*.75+.25*s.nightFactor;if(this.sun.position.set(b.x-m.x*120,80+Math.max(18,m.y*100),b.z-m.z*120),this.sun.target.position.set(b.x,0,b.z),this.sun.color.setHex(this.isCrypt?2893858:x),this.sun.intensity=this.isCrypt?.3:M,this.sun.castShadow=!this.isCrypt,this.rim.color.setHex(this.isCrypt?5933702:s.rim),this.rim.intensity=this.isCrypt?.18:p?.34:.28,this.hemi.color.setHex(this.isCrypt?3556428:s.hemiSky),this.hemi.groundColor.setHex(this.isCrypt?1512208:s.hemiGround),this.hemi.intensity=this.isCrypt?.32:p?.88:.48,this.ambient.color.setHex(this.isCrypt?7306626:s.ambient),this.ambient.intensity=this.isCrypt?.3:p?.8:.44,this.stars.material.opacity=this.isCrypt?0:Math.min(1,Math.max(0,(s.nightFactor-.2)*1.35)),this.cloudShadowMat){this.cloudShadowMat.uniforms.uTime.value=this.t,this.cloudShadowMat.uniforms.uWindOffset.value.copy(this.cloudOffset),this.cloudShadowMat.uniforms.uCloudCoverage.value=a;let L=(1-s.nightFactor)*.42+s.nightFactor*.08;this.cloudShadowMat.uniforms.uShadowStrength.value=this.isCrypt?0:L*(1-this.rainAmt*.35)}if(this.sunShafts&&this.sunShaftsMat){this.sunShaftsMat.uniforms.uTime.value=this.t,this.sunShaftsMat.uniforms.uCameraPos.value.copy(this.eng.camera.position);let L=m.clone();this.sunShaftsMat.uniforms.uSunDirection.value.copy(L),this.sunShaftsMat.uniforms.uSunColor.value.setHex(x);let S=this.isCrypt?.08:p?(.18+Math.max(0,f.y)*.14)*(1-this.rainAmt*.65):.1*s.nightFactor*(1-this.rainAmt*.65);this.sunShaftsMat.uniforms.uIntensity.value=this.weather==="storm"?S*.2:S,this.sunShafts.position.set(b.x,80,b.z),sm.copy(L).negate(),this.sunShafts.quaternion.setFromUnitVectors(new N(0,1,0),sm)}if(this.embers){let L=this.embers.geometry.attributes.position.array,S=this.embersMeta;for(let E=0;E<S.length;E++){let D=S[E];L[E*3]=D.hx+Math.sin(this.t*D.sp+D.ph)*D.r*.5,L[E*3+1]=D.hy+(this.t*D.sp*1.5+D.ph)%3.2,L[E*3+2]=D.hz+Math.cos(this.t*D.sp*.8+D.ph)*D.r*.5}this.embers.geometry.attributes.position.needsUpdate=!0}if(this.motes){let L=this.motes.geometry.attributes.position.array,S=this.motesMeta;for(let E=0;E<S.length;E++){let D=S[E];L[E*3]=D.hx+Math.sin(this.t*D.sp*.9+D.ph)*D.r,L[E*3+1]=D.hy+Math.sin(this.t*D.sp*.6+D.ph*1.7)*D.h,L[E*3+2]=D.hz+Math.cos(this.t*D.sp*.7+D.ph*.6)*D.r}this.motes.geometry.attributes.position.needsUpdate=!0}for(let L of this.torches){let S=1+Math.sin(this.t*13.7+L.phase)*.14+Math.sin(this.t*29.3+L.phase*2)*.08;L.light.intensity=L.base*1.25*S,L.sprite.scale.set(L.w*(.93+S*.07),L.h*(.88+S*.12),1),L.core.scale.setScalar((L.w>2?2.6:1.3)*(.9+S*.1)),L.shaft&&(L.shaft.material.opacity=L.shaftBase*(.75+.25*S))}let T=this.rain.material;if(T.opacity=Math.min(.5,this.rainAmt*.55),this.rainAmt>.015){this.wind.x=Math.sin(this.t*.12)*.9+Math.sin(this.t*.033)*.5,this.wind.z=Math.cos(this.t*.1)*.7;let L=this.eng.camera.position;this.eng.camera.getWorldDirection(Hs);let S=this.wind.x*.3,E=this.wind.z*.3,D=S,O=-1,F=E,W=Math.sqrt(D*D+O*O+F*F);D/=W,O/=W,F/=W;let B=O*Hs.z-F*Hs.y,ee=F*Hs.x-D*Hs.z,q=D*Hs.y-O*Hs.x,le=Math.sqrt(B*B+ee*ee+q*q)||1;B/=le,ee/=le,q/=le;let X=this.rain.geometry.attributes.position.array,te=this.rain.userData.drops,Pe=.075;for(let $e=0;$e<te.length;$e++){let $=te[$e];$.y-=$.v*e*(.55+this.rainAmt*.7),$.x+=S*9*e*this.rainAmt,$.z+=E*9*e*this.rainAmt,$.y<L.y-30&&($.x=L.x+(Math.random()-.5)*130,$.y=L.y+26+Math.random()*26,$.z=L.z+(Math.random()-.5)*130);let se=(1+$.v*.022)*(.5+this.rainAmt*.5),ye=$e*12;X[ye]=$.x-B*Pe-D*se,X[ye+1]=$.y-ee*Pe-O*se,X[ye+2]=$.z-q*Pe-F*se,X[ye+3]=$.x+B*Pe-D*se,X[ye+4]=$.y+ee*Pe-O*se,X[ye+5]=$.z+q*Pe-F*se,X[ye+6]=$.x-B*Pe+D*se,X[ye+7]=$.y-ee*Pe+O*se,X[ye+8]=$.z-q*Pe+F*se,X[ye+9]=$.x+B*Pe+D*se,X[ye+10]=$.y+ee*Pe+O*se,X[ye+11]=$.z+q*Pe+F*se}this.rain.geometry.attributes.position.needsUpdate=!0}this.weather==="storm"&&!this.isCrypt&&(this.thunderT-=e,this.thunderT<=0&&(this.thunderT=7+Math.random()*14,this.flashEl.style.opacity="0.5",setTimeout(()=>{this.flashEl.style.opacity="0"},110)))}dispose(){this.flashEl.remove(),this.clearAtmosphere()}};var VS=9,WS=.18,Bl=class{eng;plane=null;canvas;ctx;tex;explored=new Uint8Array(1);visible=new Uint8Array(1);W=1;H=1;accum=1;mapDef=null;myCell={cx:-1,cz:-1};constructor(e){this.eng=e,this.canvas=document.createElement("canvas"),this.canvas.width=this.canvas.height=8,this.ctx=this.canvas.getContext("2d"),this.tex=new Ft(this.canvas)}build(e){this.mapDef=e,this.W=e.size.w,this.H=e.size.h,this.explored=new Uint8Array(this.W*this.H),this.visible=new Uint8Array(this.W*this.H),this.eng.grid.buildLosIndex(e.walls),this.canvas.width=this.W*4,this.canvas.height=this.H*4,this.ctx=this.canvas.getContext("2d"),this.tex.dispose(),this.tex=new Ft(this.canvas),this.tex.magFilter=An,this.plane&&(this.eng.scene.remove(this.plane),this.plane.geometry.dispose(),this.plane.material.dispose());let t=e.terrain,n=t&&t.width===this.W+1&&t.height===this.H+1?this.buildTerrainGeometry(e):new Wn(this.W*Z,this.H*Z);this.plane=new he(n,new kt({map:this.tex,transparent:!0,depthWrite:!1,opacity:.985})),t&&t.width===this.W+1&&t.height===this.H+1?this.plane.position.y=.38:(this.plane.rotation.x=-Math.PI/2,this.plane.position.set(this.W*Z/2,.32,this.H*Z/2)),this.plane.renderOrder=2,this.eng.scene.add(this.plane),this.accum=1,this.repaint()}syncDoorStates(e){this.mapDef=e,this.accum=1}buildTerrainGeometry(e){let t=(this.W+1)*(this.H+1),n=new Float32Array(t*3),s=new Float32Array(t*2),r=new Uint32Array(this.W*this.H*6),a=e.terrain.heightFt;for(let l=0;l<=this.H;l++)for(let c=0;c<=this.W;c++){let h=(l*(this.W+1)+c)*3;n[h]=c*Z,n[h+1]=a[l*(this.W+1)+c]||0,n[h+2]=l*Z;let u=(l*(this.W+1)+c)*2;s[u]=c/this.W,s[u+1]=1-l/this.H}for(let l=0;l<this.H;l++)for(let c=0;c<this.W;c++){let h=l*this.W+c,u=h*6,d=l*(this.W+1)+c,f=d+1,g=d+this.W+1,b=g+1;r.set([d,g,f,f,g,b],u)}let o=new Qe;return o.setAttribute("position",new Xe(n,3)),o.setAttribute("uv",new Xe(s,2)),o.setIndex(new Xe(r,1)),o.computeVertexNormals(),o}update(e){if(this.accum+=e,this.accum<WS||(this.accum=0,!this.mapDef))return;let t=Ee.getState().myTokenId,n=t?this.eng.actors.get(t):null,s=n?n.group.position.x:this.eng.camera.position.x,r=n?n.group.position.z:this.eng.camera.position.z,{cx:a,cz:o}=this.eng.grid.worldToCell(s,r);a===this.myCell.cx&&o===this.myCell.cz||(this.myCell={cx:a,cz:o},this.compute(a,o),this.repaint())}compute(e,t){let n=VS;this.visible.fill(0);for(let s=-n;s<=n;s++)for(let r=-n;r<=n;r++){if(r*r+s*s>n*n)continue;let a=e+r,o=t+s;if(a<0||o<0||a>=this.W||o>=this.H)continue;let l=o*this.W+a,c=this.eng.grid.cellToWorld(e,t),h=this.eng.grid.cellToWorld(a,o);this.eng.grid.losClear(c.x,c.z,h.x,h.z)&&(this.explored[l]=1,this.visible[l]=1)}}tmpCanvas=document.createElement("canvas");repaint(){let t=this.tmpCanvas;t.width!==this.canvas.width&&(t.width=this.canvas.width,t.height=this.canvas.height);let n=t.getContext("2d");n.globalCompositeOperation="source-over",n.globalAlpha=.93,n.fillStyle="#020304",n.fillRect(0,0,t.width,t.height);for(let r=0;r<this.H;r++)for(let a=0;a<this.W;a++){if(this.explored[r*this.W+a]===0)continue;this.visible[r*this.W+a]===1?n.clearRect(a*4,r*4,4,4):(n.clearRect(a*4,r*4,4,4),n.globalAlpha=.5,n.fillStyle="#020304",n.fillRect(a*4,r*4,4,4),n.globalAlpha=.93)}let s=this.ctx;s.clearRect(0,0,this.canvas.width,this.canvas.height);try{s.filter="blur(2.5px)"}catch{}s.drawImage(t,0,0),s.filter="none",this.tex.needsUpdate=!0}isExplored(e,t){return e<0||t<0||e>=this.W||t>=this.H?!1:this.explored[t*this.W+e]>0}isVisible(e,t){return e<0||t<0||e>=this.W||t>=this.H?!1:this.visible[t*this.W+e]===1}dispose(){this.plane?.removeFromParent(),this.tex.dispose()}};var Jn={charcoal:1711394,clothAlt:2501427,bone:13616824,ember:12096815,blood:8003359,crypt:4020826,leather:3024416,iron:4804181,steel:9146521,oldSteel:7170658,wood:3812380,skinPale:13216910,skinAshen:11049606,skinWeathered:10123870,hairBlack:1644308,hairBrown:3811866,hairRust:6175264,hairAsh:9274484},La=new de(13148746),am=new de(7001288);function is(i,e,t){return i._rimDef={color:e.clone(),strength:t},i.onBeforeCompile=n=>{n.uniforms.uRimColor={value:i._rimDef.color},n.uniforms.uRimStrength={value:i._rimDef.strength},n.fragmentShader=n.fragmentShader.replace("#include <common>",`#include <common>
uniform vec3 uRimColor;
uniform float uRimStrength;`).replace("#include <emissivemap_fragment>",`#include <emissivemap_fragment>
        {
          float rimDot = 1.0 - saturate(dot(normalize(normal), normalize(vViewPosition)));
          totalEmissiveRadiance += uRimColor * uRimStrength * pow(rimDot, 3.2);
        }`)},i.customProgramCacheKey=()=>"ar-rim-"+t.toFixed(2),i}function Fr(i){let e=i._rimDef,t=i.clone();return e&&is(t,e.color,e.strength),t}var rm=new Map;function ss(i,e){let t=rm.get(i);if(t===void 0){let n=e();rm.set(i,n),t=n}return t}function rs(i){return"#"+i.toString(16).padStart(6,"0")}function zl(i){return ss("cloth"+rs(i),()=>is(new vt({color:i,roughness:.94,metalness:.02,map:Pa(0),bumpMap:Pa(0),bumpScale:.35,vertexColors:!0}),La,.34))}function om(i=Jn.leather){return ss("leather"+rs(i),()=>is(new vt({color:i,roughness:.82,metalness:.08,vertexColors:!0}),La,.38))}function lm(i){return ss("skin"+rs(i),()=>is(new vt({color:i,roughness:.72,metalness:0,vertexColors:!0}),La,.3))}function Gl(i,e=.42,t=.85){return ss(`metal${rs(i)}${e}${t}`,()=>is(new vt({color:i,roughness:e,metalness:t,vertexColors:!0}),La,.5))}function cm(i=Jn.bone){return ss(`bone${rs(i)}`,()=>is(new vt({color:i,roughness:.88,metalness:0,vertexColors:!0}),am,.42))}function hm(i,e=.88){return ss(`tatter${rs(i)}${e}`,()=>{let t=new vt({color:i,roughness:1,metalness:0,transparent:!0,opacity:e,side:Mt,vertexColors:!0,emissive:new de(i).multiplyScalar(.22),emissiveIntensity:.8});return is(t,am,.75)})}function um(i){return ss("cloak"+rs(i),()=>is(new vt({color:i,roughness:.96,metalness:0,side:Mt,map:Pa(1),bumpMap:Pa(1),bumpScale:.4}),La,.4))}function Vl(i){return ss("glow"+rs(i),()=>new kt({color:i,fog:!1}))}var R={PELVIS:0,SPINE1:1,SPINE2:2,NECK:3,HEAD:4,CLAV_L:5,ARM_L:6,FOREARM_L:7,HAND_L:8,CLAV_R:9,ARM_R:10,FOREARM_R:11,HAND_R:12,THIGH_L:13,SHIN_L:14,FOOT_L:15,THIGH_R:16,SHIN_R:17,FOOT_R:18},as=19,pe=(i,e,t=0)=>new N(i,e,t),dm=new N(0,-1,0),qS=new N(0,1,0),Wl=new N(0,0,1),ow=new Ht,$S=new Ge,XS=new de(1,1,1),YS=new Float64Array(as),fm={[R.PELVIS]:R.SPINE1,[R.SPINE1]:R.SPINE2,[R.SPINE2]:R.NECK,[R.NECK]:R.HEAD,[R.CLAV_L]:R.ARM_L,[R.ARM_L]:R.FOREARM_L,[R.FOREARM_L]:R.HAND_L,[R.CLAV_R]:R.ARM_R,[R.ARM_R]:R.FOREARM_R,[R.FOREARM_R]:R.HAND_R,[R.THIGH_L]:R.SHIN_L,[R.SHIN_L]:R.FOOT_L,[R.THIGH_R]:R.SHIN_R,[R.SHIN_R]:R.FOOT_R},KS={pelvisY:3.18,spine1:.55,spine2:.76,neck:.62,headDy:.32,clavX:.26,clavDy:.44,armDx:.56,upperArm:1.22,forearm:1.12,hand:.52,hipDx:.35,hipDy:-.06,thigh:1.48,shin:1.34,ankle:.16,limbR:1,torsoW:1,skullScale:1,shoulderPad:.3};function ZS(i,e){let t={...KS},n=s=>s*e;return i==="lean"?(t.clavX=.22,t.armDx=.48,t.limbR=.82,t.torsoW=.9,t.pelvisY=n(3.12),t.shoulderPad=.26):i==="broad"?(t.clavX=.3,t.armDx=.63,t.limbR=1.16,t.torsoW=1.12,t.pelvisY=n(3.22),t.shoulderPad=.34):i==="tall"?(t.clavX=.25,t.armDx=.53,t.pelvisY=n(3.4),t.thigh=1.58,t.shin=1.42,t.upperArm=1.28,t.forearm=1.18,t.limbR=.94,t.torsoW=.94):t.pelvisY=n(3.18),t}function pm(i){let e=i|0||1;return e^=e<<13,e^=e>>>17,e^=e<<5,(e>>>0)%1e3/1e3}var ql=null;function JS(){return ql||(ql={cloth:zl(16777215),skin:lm(16777215),hair:zl(16777215),leather:om(),metal:Gl(Jn.iron,.5,.62),bone:cm(Jn.bone),rag:zl(2367258),eyesSkel:Vl(16730666),eyesWraith:Vl(10479836),void:Vl(329482),tatter:hm(2765880)},ql)}var jS={warden:4146768,shadowdancer:2303790,ashen_mage:4865070,pale_priest:6972760},QS={warden:14723146,shadowdancer:10125268,ashen_mage:14715450,pale_priest:8377544},eM={warden:5910310,shadowdancer:2764856,ashen_mage:6047024,pale_priest:13616824},mm=[Jn.hairBlack,Jn.hairBrown,Jn.hairRust,Jn.hairAsh];function $l(i,e){if(typeof i!="string"||!i)return e;let t=parseInt(i.replace("#",""),16);return Number.isFinite(t)?t:e}var od=class{constructor(e){this.joints=e;this.segTips=[];for(let t=0;t<as;t++){let n=new N;t===R.HEAD?n.copy(e[t]).add(pe(0,.42,.08)):t===R.HAND_L||t===R.HAND_R?n.copy(e[t]).add(pe(0,-.5,.04)):t===R.FOOT_L||t===R.FOOT_R?n.copy(e[t]).add(pe(0,-.14,.62)):fm[t]!==void 0?n.copy(e[fm[t]]):n.copy(e[t]),this.segTips.push(n)}}buckets=new Map;segTips;bucket(e){let t=this.buckets.get(e);return t||(t={pos:[],nor:[],uv:[],col:[],si:[],sw:[]},this.buckets.set(e,t)),t}push(e,t,n){let s=e.index?e.toNonIndexed():e,r=this.bucket(t),a=s.attributes.position.array,o=s.attributes.normal?s.attributes.normal.array:null,l=s.attributes.uv?s.attributes.uv.array:null,c=a.length/3,h=n.tint??XS;for(let u=0;u<c;u++){let d=a[u*3],f=a[u*3+1],g=a[u*3+2];r.pos.push(d,f,g),o?r.nor.push(o[u*3],o[u*3+1],o[u*3+2]):r.nor.push(0,1,0),l?r.uv.push(l[u*2],l[u*2+1]):r.uv.push(0,0),r.col.push(h.r,h.g,h.b);let b=0,p=0,m=0,x=0,v=0,y=0,w=0,_=0;if(n.lock!==void 0)b=n.lock,v=1;else{let M=YS;for(let L=0;L<as;L++){let S=tM(d,f,g,this.joints[L],this.segTips[L]),E=S<.02?.02:S,D=1/(E*E*E*E*E);if(n.bias){let O=n.bias[L];O!==void 0&&(D*=O)}M[L]=D}for(let L=0;L<as;L++){let S=M[L];S<=0||(S>v?(_=w,x=m,w=y,m=p,y=v,p=b,v=S,b=L):S>y?(_=w,x=m,w=y,m=p,y=S,p=L):S>w?(_=w,x=m,w=S,m=L):S>_&&(_=S,x=L))}let T=v+y+w+_;T>0?(v/=T,y/=T,w/=T,_/=T):(b=R.PELVIS,v=1)}r.si.push(b,p,m,x),r.sw.push(v,y,w,_)}s!==e&&s.dispose()}capsule(e,t,n,s,r={}){let a=t.clone().sub(e),o=Math.max(a.length(),.05),l=Math.max(o-n*1.25,.06),c=new dl(n,l,4,r.radial??9),h=new Ht().setFromUnitVectors(qS,a.normalize()),u=new Ge().compose(e.clone().add(t).multiplyScalar(.5),h,pe(r.sx??1,1,r.sz??1));c.applyMatrix4(u),this.push(c,s,r)}tube(e,t,n,s,r,a={},o=!0){let l=new Ct(t,n,s,a.radial??10,1,o);a.rotY&&l.rotateY(a.rotY),l.applyMatrix4(new Ge().makeTranslation(e.x,e.y,e.z)),this.push(l,r,a)}box(e,t,n,s={},r){let a=new Ue(t.x,t.y,t.z),o=new Ge().compose(e,r?new Ht().setFromEuler(r):new Ht,pe(1,1,1));a.applyMatrix4(o),this.push(a,n,s)}sphere(e,t,n,s={},r=Math.PI*2,a=Math.PI){let o=new Ai(t,s.radial??10,7,0,r,0,a);r<Math.PI*2&&o.rotateY(2.42);let l=new Ge().compose(e,new Ht,pe(s.sx??1,s.sy??1,s.sz??1));o.applyMatrix4(l),this.push(o,n,s)}rib(e,t,n,s,r={}){let a=new qn(t,n,5,12,4.4);a.rotateX(Math.PI/2),a.rotateY(3.93),a.applyMatrix4(new Ge().makeTranslation(e.x,e.y,e.z)),this.push(a,s,r)}finish(){let e=new Map;for(let[t,n]of this.buckets){let s=new Qe;s.setAttribute("position",new He(n.pos,3)),s.setAttribute("normal",new He(n.nor,3)),s.setAttribute("uv",new He(n.uv,2)),s.setAttribute("color",new He(n.col,3)),s.setAttribute("skinIndex",new Ar(n.si,4)),s.setAttribute("skinWeight",new He(n.sw,4)),e.set(t,s)}return this.buckets.clear(),e}};function tM(i,e,t,n,s){let r=s.x-n.x,a=s.y-n.y,o=s.z-n.z,l=i-n.x,c=e-n.y,h=t-n.z,u=r*r+a*a+o*o,d=u>1e-9?(l*r+c*a+h*o)/u:0;d<0?d=0:d>1&&(d=1);let f=l-r*d,g=c-a*d,b=h-o*d;return Math.sqrt(f*f+g*g+b*b)}var ld=class{constructor(e,t,n,s,r,a,o=.32){this.bone=e;this.segLen=s/n,this.anchorLocal=t.clone();for(let l=0;l<=n;l++)this.pts.push(new N),this.prev.push(new N);for(let l=0;l<n;l++){let c=r*(1-o*(l/Math.max(1,n-1))),h=new Wn(c,this.segLen*1.06,1,2);h.translate(0,-this.segLen*.53,0);let u=new he(h,a);u.frustumCulled=!1,e.add(u),this.meshes.push(u)}e.updateWorldMatrix(!0,!1),this.bone.localToWorld(this.tmpA.copy(this.anchorLocal));for(let l=0;l<=n;l++)this.pts[l].copy(this.tmpA).addScaledVector(dm,this.segLen*l),this.prev[l].copy(this.pts[l])}pts=[];prev=[];segLen;meshes=[];anchorLocal;tmpA=new N;tmpB=new N;tmpQ=new Ht;tmpQ2=new Ht;dir=new N;update(e,t,n,s,r,a=.06){let o=this.bone;o.localToWorld(this.tmpA.copy(this.anchorLocal));let l=this.pts,c=this.prev,h=Math.exp(-r*e),u=-26*e*e,d=t*14*e*e,f=n*14*e*e,g=s*e*e;for(let b=1;b<l.length;b++){let p=l[b],m=c[b],x=(p.x-m.x)*h,v=(p.y-m.y)*h,y=(p.z-m.z)*h;m.copy(p),p.x+=x-d,p.y+=v+u+g,p.z+=y-f,p.y<a&&(p.y=a)}l[0].copy(this.tmpA),c[0].copy(this.tmpA);for(let b=0;b<3;b++)for(let p=1;p<l.length;p++){let m=l[p-1],x=l[p];this.dir.subVectors(x,m);let v=this.dir.length()||1e-5,y=(v-this.segLen)/v;p===1?x.addScaledVector(this.dir,-y):(m.addScaledVector(this.dir,y*.5),x.addScaledVector(this.dir,-y*.5))}o.getWorldQuaternion(this.tmpQ2),this.tmpQ.copy(this.tmpQ2).invert();for(let b=0;b<this.meshes.length;b++){let p=this.meshes[b];this.tmpB.copy(l[b]),o.worldToLocal(this.tmpB),p.position.copy(this.tmpB),this.dir.subVectors(l[b+1],l[b]).normalize(),this.tmpQ2.setFromUnitVectors(dm,this.dir),p.quaternion.copy(this.tmpQ).multiply(this.tmpQ2)}}dispose(){for(let e of this.meshes)e.removeFromParent(),e.geometry.dispose()}},Xl=class i{body=new xt;bones=[];skeleton;prop;bindQuats=[];joints=[];equipR=new xt;equipL=new xt;palmR=new gt;palmL=new gt;headTop=new gt;trailTip=null;trailBase=null;isWraith;isSkeleton;hasCloak;topY;palmSprite=null;innerGlow=null;chains=[];bodyMats=[];skinned=[];static bodyCache=new Map;constructor(e,t){this.isWraith=e==="wraith",this.isSkeleton=e==="skeleton";let n=t.seed??0,s=Math.floor(pm(n+7)*5)-2,r=1+s*.012,a=t.bodyType??"standard";this.isWraith&&(a="tall"),this.isSkeleton&&(a="lean"),this.prop=ZS(a,r),this.isSkeleton&&(this.prop.limbR=.52,this.prop.torsoW=.86,this.prop.skullScale=1.14),this.isWraith&&(this.prop.limbR=.5,this.prop.torsoW=.8,this.prop.pelvisY+=1.05);let o=this.prop;this.buildBones();let l=JS(),c=t.hair??(this.isSkeleton||this.isWraith?"none":"short"),h=t.hoodUp??(e==="shadowdancer"||this.isWraith||this.isSkeleton),u=`${e}|${a}|${c}|${h?1:0}|${s}`,d=i.bodyCache.get(u);if(!d){let v=new od(this.joints);this.isWraith?this.wraithParts(v,l):this.isSkeleton?this.skeletonParts(v,l):this.humanoidParts(v,l,{hair:c,hoodUp:h}),d={geoms:v.finish()},i.bodyCache.set(u,d)}let f=$l(t.clothTint,jS[e]??3356735),g=$l(t.skinTone,this.isSkeleton?Jn.bone:this.isWraith?12108990:Jn.skinAshen),b=$l(t.hairColor,mm[Math.floor(pm(n+31)*mm.length)]),p={cloth:f,skin:g,hair:b,leather:null,metal:null,bone:null,rag:null,eyesSkel:null,eyesWraith:null,void:null,tatter:null},m=v=>Object.keys(l).find(y=>l[y]===v),x=new Map;for(let[v]of d.geoms){let y=Fr(v),w=m(v),_=w?p[w]:null;_!=null&&y.color&&y.color.set(_),x.set(v,y),y.isMeshStandardMaterial&&this.bodyMats.push(y)}this.body.add(this.bones[R.PELVIS]),this.body.updateMatrixWorld(!0),this.skeleton=new al(this.bones);for(let[v,y]of d.geoms){let w=new sl(y,x.get(v));w.castShadow=!0,w.frustumCulled=!1,this.body.add(w),w.bind(this.skeleton,$S),this.skinned.push(w)}if(this.bones[R.HAND_R].add(this.equipR),this.bones[R.HAND_L].add(this.equipL),this.equipR.position.set(0,-.24,.05),this.equipL.position.set(0,-.24,.05),this.bones[R.HAND_R].add(this.palmR),this.palmR.position.set(0,-.18,.13),this.bones[R.HAND_L].add(this.palmL),this.palmL.position.set(0,-.18,.13),this.bones[R.HEAD].add(this.headTop),this.headTop.position.set(0,.5*o.skullScale,.05),this.hasCloak=!1,!this.isWraith&&!this.isSkeleton){let v=um($l(t.cloakColor,eM[e]??2501427)),y=e==="warden"||e==="pale_priest";this.addChain(this.bones[R.SPINE2],pe(-.52,.32,-.36),y?5:4,y?3.6:3,1.24,v),this.addChain(this.bones[R.SPINE2],pe(0,.36,-.4),y?5:4,y?3.75:3.15,1.42,v),this.addChain(this.bones[R.SPINE2],pe(.52,.32,-.36),y?5:4,y?3.6:3,1.24,v),this.hasCloak=!0}else if(this.isWraith){let v=Fr(l.tatter);for(let y=0;y<5;y++){let w=y/5*Math.PI*2+.4;this.addChain(this.bones[R.PELVIS],pe(Math.cos(w)*.5,-.1,Math.sin(w)*.42),4,2.9,.5,v,.5)}this.addChain(this.bones[R.PELVIS],pe(-.55,-.3,.3),5,3.9,.24,v,.15),this.addChain(this.bones[R.PELVIS],pe(.55,-.3,.3),5,3.9,.24,v,.15)}!this.isWraith&&!this.isSkeleton&&(this.palmSprite=gm(QS[e]??14723146,.001),this.palmL.add(this.palmSprite)),this.isWraith&&(this.innerGlow=gm(8382680,2.4),this.innerGlow.position.set(0,.35,0),this.bones[R.SPINE2].add(this.innerGlow)),this.topY=this.joints[R.HEAD].y+.62*o.skullScale+(h?.18:0),this.topY=Math.max(this.topY,5.7)}addChain(e,t,n,s,r,a,o=.32){this.chains.push(new ld(e,t,n,s,r,Fr(a),o))}buildBones(){let e=this.prop,t=()=>new xa,n=t();n.position.set(0,e.pelvisY,0);let s=t();s.position.set(0,e.spine1,.02);let r=t();r.position.set(0,e.spine2,0);let a=t();a.position.set(0,e.neck,.03);let o=t();o.position.set(0,e.headDy,.02),s.add(r),r.add(a),a.add(o),n.add(s);let l=t();l.position.set(e.clavX,e.clavDy,0);let c=t();c.position.set(e.armDx,0,0);let h=t();h.position.set(0,-e.upperArm,0);let u=t();u.position.set(0,-e.forearm,0),l.add(c),c.add(h),h.add(u),r.add(l);let d=t();d.position.set(-e.clavX,e.clavDy,0);let f=t();f.position.set(-e.armDx,0,0);let g=t();g.position.set(0,-e.upperArm,0);let b=t();b.position.set(0,-e.forearm,0),d.add(f),f.add(g),g.add(b),r.add(d);let p=t();p.position.set(e.hipDx,e.hipDy,0);let m=t();m.position.set(0,-e.thigh,0);let x=t();x.position.set(0,-e.shin,.02),p.add(m),m.add(x),n.add(p);let v=t();v.position.set(-e.hipDx,e.hipDy,0);let y=t();y.position.set(0,-e.thigh,0);let w=t();w.position.set(0,-e.shin,.02),v.add(y),y.add(w),n.add(v),this.bones=[n,s,r,a,o,l,c,h,u,d,f,g,b,p,m,x,v,y,w],this.bindQuats=this.bones.map(()=>new Ht),this.bindQuats[R.ARM_L].setFromAxisAngle(Wl,.14),this.bindQuats[R.ARM_R].setFromAxisAngle(Wl,-.14),this.bindQuats[R.THIGH_L].setFromAxisAngle(Wl,.045),this.bindQuats[R.THIGH_R].setFromAxisAngle(Wl,-.045);for(let _=0;_<as;_++)this.bones[_].quaternion.copy(this.bindQuats[_]);this.body.updateMatrixWorld(!0),this.joints=this.bones.map(_=>_.getWorldPosition(new N))}humanoidParts(e,t,n){let s=this.joints,r=this.prop,a=(g,b,p)=>g.clone().lerp(b,p),o=g=>new de(g,g,g),l=a(s[R.SPINE2],s[R.NECK],.42),c=a(s[R.SPINE1],s[R.SPINE2],.12),h=r.limbR;e.capsule(c,l,.42*r.torsoW,t.cloth,{sx:1.12,sz:.86}),e.capsule(l,a(s[R.SPINE2],s[R.NECK],.8),.5*r.torsoW,t.cloth,{sx:1.18,sz:.82,tint:o(.96)}),e.tube(pe(0,s[R.PELVIS].y+.28,0),.44*r.torsoW,.55*r.torsoW,.62,t.cloth,{tint:o(.8)}),e.tube(pe(0,s[R.PELVIS].y-.18,0),.5*r.torsoW,.6*r.torsoW,.78,t.cloth,{tint:o(.66)});for(let g of[R.ARM_L,R.ARM_R]){let b=g===R.ARM_L?R.FOREARM_L:R.FOREARM_R,p=g===R.ARM_L?R.HAND_L:R.HAND_R,m=s[g].clone().add(pe(0,.06,0));e.capsule(m,a(s[b],m,.06),.17*h,t.cloth,{tint:o(.92)}),e.capsule(s[b],s[p],.13*h,t.cloth,{tint:o(.86)})}for(let[g,b,p]of[[R.THIGH_L,R.SHIN_L,R.FOOT_L],[R.THIGH_R,R.SHIN_R,R.FOOT_R]]){let m=s[g].clone().add(pe(0,-.04,0));e.capsule(m,s[b],.2*h,t.cloth,{tint:o(.62)}),e.capsule(s[b],a(s[p],s[b],.28),.16*h,t.cloth,{tint:o(.56)})}for(let g of[R.FOREARM_L,R.FOREARM_R])e.box(s[g].clone().add(pe(0,.05,.02)),pe(.34,.3,.34),t.leather,{tint:o(.9)});for(let g of[R.SHIN_L,R.SHIN_R])e.box(s[g].clone().add(pe(0,.12,.03)),pe(.4,.36,.42),t.leather,{tint:o(.95)});for(let g of[R.FOOT_L,R.FOOT_R]){let b=s[g];e.box(pe(b.x,b.y+.16,b.z),pe(.34,.4,.4),t.leather,{tint:o(.55)}),e.box(pe(b.x,b.y-.07,b.z+.22),pe(.34,.22,.78),t.leather,{tint:o(.7)}),e.box(pe(b.x,b.y-.07,b.z+.58),pe(.3,.16,.22),t.leather,{tint:o(.5)})}e.tube(pe(0,s[R.PELVIS].y+.42,0),.47*r.torsoW,.47*r.torsoW,.2,t.leather,{tint:o(.85)},!1),e.box(pe(0,s[R.PELVIS].y+.42,.46*r.torsoW),pe(.17,.17,.07),t.metal,{bias:{[R.SPINE1]:4,[R.PELVIS]:3}}),e.box(pe(-.12,s[R.SPINE1].y+.62,.36*r.torsoW),pe(.13,1.15,.05),t.leather,{tint:o(.8),bias:{[R.SPINE2]:4,[R.SPINE1]:2}},new Ut(0,0,.42));let u=r.shoulderPad;for(let g of[R.ARM_L,R.ARM_R]){let b=g===R.ARM_L?1:-1;e.sphere(s[g].clone().add(pe(b*.04,.14,0)),u,t.metal,{sx:1.15,sy:.9,sz:1.05,tint:o(g===R.ARM_L?.85:1),bias:{[g]:30}},Math.PI*2,Math.PI*.62)}for(let[g,b]of[[R.FOREARM_L,R.HAND_L],[R.FOREARM_R,R.HAND_R]])e.capsule(a(s[g],s[b],.3),a(s[g],s[b],.86),.155*h,t.leather,{tint:o(.9)}),e.sphere(s[b].clone().add(pe(0,-.16,.01)),.145,t.leather,{sx:1.1,sy:1.35,sz:.85,tint:o(.75),bias:{[b]:8}});e.capsule(s[R.NECK],a(s[R.HEAD],s[R.NECK],.25),.14,t.skin,{tint:o(.8)});let d=s[R.HEAD],f=r.skullScale;e.sphere(d,.4*f,t.skin,{sx:.88,sy:1,sz:.92,bias:{[R.HEAD]:6,[R.NECK]:.4}}),e.sphere(d.clone().add(pe(0,.02,.16)),.33*f,t.skin,{sx:.82,sy:1.02,sz:.92,bias:{[R.HEAD]:6}}),e.box(d.clone().add(pe(0,.1*f,.31*f)),pe(.4,.075,.12),t.skin,{bias:{[R.HEAD]:8}}),e.box(d.clone().add(pe(0,-.24*f,.13*f)),pe(.26,.2,.3),t.skin,{bias:{[R.HEAD]:8}}),e.box(d.clone().add(pe(0,-.05*f,.36*f)),pe(.075,.12,.1),t.skin,{bias:{[R.HEAD]:8}});for(let g of[-.115,.115])e.sphere(d.clone().add(pe(g*f,.02*f,.3*f)),.042,t.void,{bias:{[R.HEAD]:50}});if((n.hair==="short"||n.hair==="long"||n.hair==="topknot")&&(e.sphere(d.clone().add(pe(0,.05*f,-.02*f)),.42*f,t.hair,{sx:.94,sy:.96,sz:1,bias:{[R.HEAD]:12}},Math.PI*2,Math.PI*.55),e.box(d.clone().add(pe(0,.06*f,.3*f)),pe(.34,.06,.1),t.hair,{bias:{[R.HEAD]:12}})),n.hair==="long"&&e.box(d.clone().add(pe(0,-.32*f,-.3*f)),pe(.44,.8,.14),t.hair,{bias:{[R.HEAD]:5}}),n.hair==="topknot"&&e.sphere(d.clone().add(pe(0,.46*f,-.02)),.13,t.hair,{bias:{[R.HEAD]:30}}),n.hoodUp){let g=d.clone().add(pe(0,.08*f,-.05));e.sphere(g,.5*f,t.cloth,{sx:1.02,sy:1.12,sz:1.06,tint:o(.9),bias:{[R.HEAD]:5,[R.NECK]:.6}},Math.PI*1.45,Math.PI*.72),e.tube(pe(0,s[R.NECK].y+.1,-.1),.42,.62,.55,t.cloth,{tint:o(.75),bias:{[R.NECK]:4,[R.SPINE2]:2}})}else e.sphere(pe(0,s[R.SPINE2].y+.52,-.02),.62*r.torsoW,t.cloth,{sx:1.3,sy:.72,sz:1,tint:o(.88),bias:{[R.SPINE2]:6,[R.CLAV_L]:1,[R.CLAV_R]:1}},Math.PI*2,Math.PI*.5)}skeletonParts(e,t){let n=this.joints,s=this.prop,r=(u,d,f)=>u.clone().lerp(d,f),a=u=>new de(u,u,u),o=t.bone;e.box(pe(0,n[R.PELVIS].y,0),pe(.6,.3,.4),o,{bias:{[R.PELVIS]:8}}),e.box(pe(0,n[R.PELVIS].y-.55,.2),pe(.44,.85,.06),t.rag,{tint:a(.8),bias:{[R.PELVIS]:6}},new Ut(.06,.1,0)),e.box(pe(.28,n[R.PELVIS].y-.5,.05),pe(.3,.7,.05),t.rag,{tint:a(.62),bias:{[R.PELVIS]:6}},new Ut(.1,0,.22)),e.capsule(n[R.SPINE1],r(n[R.SPINE2],n[R.NECK],.1),.085,o,{bias:{[R.SPINE1]:3,[R.SPINE2]:3}});for(let u=0;u<4;u++)e.box(pe(0,r(n[R.SPINE1],n[R.SPINE2],u/3).y,-.13),pe(.15,.09,.11),o,{bias:{[R.SPINE1]:3,[R.SPINE2]:3}});let l=r(n[R.SPINE2],n[R.NECK],.4);for(let u=0;u<5;u++){let d=u/4;e.rib(pe(0,r(n[R.SPINE1],l,.12+d*.82).y,.02),.52-d*.16,.042,o,{bias:{[R.SPINE1]:1.4,[R.SPINE2]:2.2}})}e.box(pe(0,r(n[R.SPINE1],l,.62).y,.44),pe(.09,.9,.06),o,{bias:{[R.SPINE2]:3}});for(let u of[R.CLAV_L,R.CLAV_R]){let d=n[u===R.CLAV_L?R.ARM_L:R.ARM_R];e.capsule(n[R.NECK].clone().add(pe(u===R.CLAV_L?.1:-.1,-.04,.06)),d,.05,o,{bias:{[u]:4}})}for(let[u,d,f]of[[R.ARM_L,R.FOREARM_L,R.HAND_L],[R.ARM_R,R.FOREARM_R,R.HAND_R]]){e.sphere(n[u],.11,o,{bias:{[u]:6}}),e.capsule(n[u],n[d],.095,o,{bias:{[u]:2,[d]:2}}),e.sphere(n[d],.085,o,{bias:{[d]:6}}),e.capsule(n[d],n[f],.075,o,{bias:{[d]:2,[f]:2}}),e.box(n[f].clone().add(pe(0,-.14,.02)),pe(.13,.26,.09),o,{bias:{[f]:10}});for(let g=0;g<3;g++)e.box(n[f].clone().add(pe((g-1)*.05,-.34,.05+Math.abs(g-1)*.02)),pe(.032,.2,.032),o,{bias:{[f]:30}},new Ut(.12,0,(g-1)*.1))}for(let[u,d,f]of[[R.THIGH_L,R.SHIN_L,R.FOOT_L],[R.THIGH_R,R.SHIN_R,R.FOOT_R]])e.capsule(n[u],n[d],.1,o,{bias:{[u]:2,[d]:2}}),e.sphere(n[d],.09,o,{bias:{[d]:6}}),e.capsule(n[d],n[f],.08,o,{bias:{[d]:2,[f]:2}}),e.box(pe(n[f].x,n[f].y-.08,n[f].z+.24),pe(.24,.15,.62),o,{bias:{[f]:12}});let c=n[R.HEAD],h=s.skullScale;e.sphere(c,.4*h,o,{sx:.9,sy:1,sz:.95,bias:{[R.HEAD]:8}}),e.box(c.clone().add(pe(0,.09*h,.3*h)),pe(.42,.08,.14),o,{bias:{[R.HEAD]:12}}),e.box(c.clone().add(pe(0,-.26*h,.14*h)),pe(.3,.22,.34),o,{bias:{[R.HEAD]:12}}),e.box(c.clone().add(pe(0,-.17*h,.3*h)),pe(.26,.05,.05),o,{tint:a(.8),bias:{[R.HEAD]:20}});for(let u of[-.13,.13])e.sphere(c.clone().add(pe(u*h,.02*h,.31*h)),.055,t.eyesSkel,{bias:{[R.HEAD]:60}}),e.sphere(c.clone().add(pe(u*h,-.12*h,.26*h)),.07,o,{tint:a(.72),bias:{[R.HEAD]:12}});e.sphere(n[R.ARM_L].clone().add(pe(.05,.12,0)),.28,t.metal,{sx:1.15,sy:.88,sz:1.05,tint:a(.85),bias:{[R.ARM_L]:30}},Math.PI*2,Math.PI*.6)}wraithParts(e,t){let n=this.joints,s=(o,l,c)=>o.clone().lerp(l,c),r=o=>new de(o,o,o);e.tube(pe(0,n[R.PELVIS].y+.1,0),.42,.98,2.5,t.tatter,{tint:r(.92),bias:{[R.PELVIS]:3,[R.SPINE1]:1.4}}),e.capsule(n[R.SPINE1],s(n[R.SPINE2],n[R.NECK],.3),.34,t.bone,{sx:1.04,sz:.78,bias:{[R.SPINE1]:2,[R.SPINE2]:2}});for(let o=0;o<3;o++)e.rib(pe(0,s(n[R.SPINE1],n[R.SPINE2],.35+o*.3).y,.02),.4-o*.05,.035,t.bone,{tint:r(.85),bias:{[R.SPINE1]:1.2,[R.SPINE2]:2}});let a=n[R.HEAD];e.sphere(a.clone().add(pe(0,.1,-.06)),.52,t.tatter,{sx:1.04,sy:1.14,sz:1.08,bias:{[R.HEAD]:5,[R.NECK]:.6}},Math.PI*1.5,Math.PI*.75),e.sphere(a.clone().add(pe(0,-.02,.1)),.3,t.void,{bias:{[R.HEAD]:50}});for(let o of[-.12,.12])e.sphere(a.clone().add(pe(o,.04,.3)),.05,t.eyesWraith,{sy:1.5,bias:{[R.HEAD]:60}});for(let[o,l,c]of[[R.ARM_L,R.FOREARM_L,R.HAND_L],[R.ARM_R,R.FOREARM_R,R.HAND_R]]){e.capsule(n[o],n[l],.082,t.bone,{bias:{[o]:2,[l]:2}}),e.capsule(n[l],n[c],.068,t.bone,{bias:{[l]:2,[c]:2}}),e.sphere(n[l],.075,t.bone,{bias:{[l]:6}});for(let h=0;h<3;h++)e.box(n[c].clone().add(pe((h-1)*.055,-.3,.04)),pe(.04,.34,.04),t.bone,{bias:{[c]:30}},new Ut(.18,0,(h-1)*.12))}}update(e,t,n,s=0){for(let r of this.chains)r.update(e,t,n,s,this.isWraith?2.2:3.4)}setDissolve(e){let t=Math.max(0,1-e);for(let n of this.bodyMats)t<1?(n.transparent=!0,n.opacity=t):(n.transparent=!1,n.opacity=1)}dispose(){this.body.removeFromParent();for(let e of this.chains)e.dispose();for(let e of this.skinned)e.removeFromParent();for(let e of this.bodyMats)e.dispose()}};function gm(i,e){let t=new sn({map:ui(),color:i,transparent:!0,opacity:.9,blending:Vt,depthWrite:!1}),n=new un(t);return n.scale.setScalar(e),n}var Yl=class{e=new Float32Array(as*3);rootPitch=0;rootRoll=0;lift=0;lungeF=0;trail=0;glow=0;windUp=0;set(e){this.e.set(e.e),this.rootPitch=e.rootPitch,this.rootRoll=e.rootRoll,this.lift=e.lift,this.lungeF=e.lungeF,this.trail=e.trail,this.glow=e.glow,this.windUp=e.windUp}},Rt=(i,e,t)=>i<e?e:i>t?t:i,vm=(i,e,t)=>{let n=Rt((t-i)/(e-i),0,1);return n*n*(3-2*n)},vn=i=>i*i*(3-2*i),Kl=class{phase=Math.random();gait=0;moveBlend=0;action=null;shown=new Yl;target=new Yl;seed;seed2;downed=!1;constructor(e=0){this.seed=e%97*.618+.31,this.seed2=e%53*.471+1.17}trigger(e,t=1,n=0){let s={attack:.8,spell:1.15,shoot:.8,heal:1.3,buff:1.2,hit:.42,crit:.6,miss:.42,die:1.7},r=e==="crit"?1.8:e==="attack"?Rt(t,.4,2):t;this.action={kind:e,t:0,dur:s[e]/(e==="attack"?.75+.25*r:1),power:r,dir:n}}setDowned(e){this.downed=e}update(e,t){let n=e.dt,s=this.phase,r=5.6+2.6*this.gait,a=0;if(e.speed>.2){let d=n*e.speed/r;this.phase=(this.phase+d)%1,e.speed>2&&!this.downed&&this.action?.kind!=="die"&&(a=Math.max(0,Math.floor((s+d)*2)-Math.floor(s*2)))}this.gait+=(vm(13,24,e.speed)-this.gait)*Math.min(1,n*5),this.moveBlend+=(vm(1.2,4.5,e.speed)-this.moveBlend)*Math.min(1,n*6);let o=this.target;o.e.fill(0),o.rootPitch=0,o.rootRoll=0,o.lift=0,o.lungeF=0,o.trail=0,o.glow=0,o.windUp=0;let l=this.action?.kind==="die";l?this.actionPose(o,e):this.downed?this.downedPose(o):(this.locomotion(o,e),this.action?this.actionPose(o,e):this.turnInPlace(o,e));let c=l?14:this.action?this.action.kind==="attack"&&this.action.t/this.action.dur>.28?42:26:11,h=1-Math.exp(-c*n),u=this.shown;for(let d=0;d<u.e.length;d++)u.e[d]+=(o.e[d]-u.e[d])*h;if(u.rootPitch+=(o.rootPitch-u.rootPitch)*h,u.rootRoll+=(o.rootRoll-u.rootRoll)*h,u.lift+=(o.lift-u.lift)*h,u.lungeF=o.lungeF,u.trail=o.trail,u.glow=o.glow,u.windUp=o.windUp,this.applyToRig(t,u),Rn.actionDone=!1,Rn.footfalls=a,Rn.dieT=-1,this.action){let d=this.action;d.t+=n,d.kind==="die"&&(Rn.dieT=Rt(d.t/d.dur,0,1)),d.t>=d.dur&&(this.action=null,Rn.actionDone=!0)}return Rn.rootPitch=u.rootPitch,Rn.rootRoll=u.rootRoll,Rn.lift=u.lift,Rn.lungeF=u.lungeF,Rn.trail=u.trail,Rn.glow=u.glow,Rn.windUp=u.windUp,Rn}downedPose(e){let t=e.e,n=(s,r,a=0,o=0)=>{t[s*3]=r,t[s*3+1]=a,t[s*3+2]=o};n(R.THIGH_L,-.8,0,.12),n(R.THIGH_R,-.95,0,-.12),n(R.SHIN_L,1.15),n(R.SHIN_R,1.25),n(R.FOOT_L,-.25),n(R.FOOT_R,-.3),n(R.SPINE1,.26),n(R.SPINE2,.35,.08),n(R.NECK,.1),n(R.HEAD,.24,.25,.08),n(R.ARM_L,-.32,0,.65),n(R.ARM_R,-.28,0,-.62),n(R.FOREARM_L,-.22),n(R.FOREARM_R,-.2),e.lift=.02}locomotion(e,t){let n=e.e,s=(v,y,w=0,_=0)=>{n[v*3]=y,n[v*3+1]=w,n[v*3+2]=_},r=(v,y=0,w=0,_=0)=>{n[v*3]+=y,n[v*3+1]+=w,n[v*3+2]+=_},a=t.t,o=this.phase,l=1-this.moveBlend,c=this.gait,h=t.isSkeleton?.45:1;if(t.isWraith){let v=1.15+Math.sin(a*1.25+this.seed)*.17;e.lift=v,s(R.PELVIS,0,Math.sin(a*.5+this.seed)*.08,Math.sin(a*.62)*.05),s(R.SPINE2,.06+Math.sin(a*.9)*.02,Math.sin(a*.44+this.seed2)*.1,0),s(R.NECK,.08,0,0),s(R.HEAD,-.14,Math.sin(a*.3+this.seed)*.2,Math.sin(a*.4)*.06);for(let[y,w,_,M]of[[R.ARM_L,R.FOREARM_L,R.HAND_L,1],[R.ARM_R,R.FOREARM_R,R.HAND_R,-1]]){let T=Math.sin(a*.7+this.seed+M*2.1);s(y,-.18+T*.06,0,M*(.16+T*.04)),s(w,-.3+Math.sin(a*.55+M)*.08,0,0),s(_,-.2,0,0)}e.rootPitch=Rt(t.speed*.008,0,.18),e.rootRoll=Rt(t.yawRate*.04,-.12,.12);return}let u=.44+.32*c,d=.85+.32*c,f=.085+.1*c,g=(.3+.34*c)*h,b=.05+.02*c,p=Math.sin(a*1.9+this.seed)*.02;for(let[v,y,w,_]of[[R.THIGH_L,R.SHIN_L,R.FOOT_L,0],[R.THIGH_R,R.SHIN_R,R.FOOT_R,.5]]){let M=(o+_)%1,T=Math.sin(M*Math.PI*2),L=-u*T*this.moveBlend,S=d*(.18+.82*Math.max(0,Math.sin((M-.8)*Math.PI*2)))*this.moveBlend,E=Math.max(0,Math.sin((M-.68)*Math.PI*2))*(.3+.25*c)*this.moveBlend;s(v,L),s(y,S),s(w,-(L+S)*.38+E-.05)}e.lift=(.5+.5*Math.cos(o*Math.PI*4))*f*this.moveBlend+p*l-.05*c*this.moveBlend,e.lift=Math.max(.02,e.lift),s(R.PELVIS,.02,-.1*Math.sin(o*Math.PI*2)*this.moveBlend,b*Math.sin(o*Math.PI*2)*this.moveBlend),s(R.SPINE1,.04+.1*c*this.moveBlend,.06*Math.sin(o*Math.PI*2)*this.moveBlend,0),s(R.SPINE2,.03+.12*c*this.moveBlend,.13*Math.sin(o*Math.PI*2)*this.moveBlend,-b*Math.sin(o*Math.PI*2)*this.moveBlend*.7),s(R.NECK,-.03-.05*c*this.moveBlend,0,0),s(R.HEAD,-.02-.06*c*this.moveBlend+Math.sin(a*.37+this.seed2)*.05*l,Math.sin(a*.31+this.seed)*.16*l+.06*Math.sin(o*Math.PI*2)*this.moveBlend,0);let m=Math.sin(o*Math.PI*2)*g*this.moveBlend,x=Math.sin(a*1.9+this.seed)*.02;for(let[v,y,w,_]of[[R.ARM_L,R.FOREARM_L,R.HAND_L,1],[R.ARM_R,R.FOREARM_R,R.HAND_R,-1]]){let M=-.06,T=-.28,L=_*.1;_<0&&(t.style==="sword"?(M=-.34,T=-.62,L=-.12):t.style==="dagger"?(M=-.16,T=-.8,L=-.08):t.style==="staff"?(M=-.1,T=-.18,L=-.04):t.style==="mace"&&(M=-.24,T=-.42,L=-.1));let S=M*l+-m*_+x*l;s(v,S,0,L*l+_*.05*this.moveBlend*(.5+c)),s(y,T*l-(.15+.5*c)*this.moveBlend*Math.max(0,-_*m),0,0),s(w,-.12*l,0,0)}s(R.CLAV_L,x*.4,0,0),s(R.CLAV_R,x*.4,0,0),t.isSkeleton&&(r(R.HEAD,Math.sin(a*12.7)*.015,Math.sin(a*9.3+2)*.03,0),r(R.SPINE2,0,Math.sin(a*7.1)*.02,0)),e.rootPitch=(Rt(t.accel*.005,-.1,.2)+.13*c)*this.moveBlend,e.rootRoll=Rt(t.yawRate*.05,-.14,.14)*this.moveBlend,e.rootPitch+=Math.sin(a*.5+this.seed2)*.012*l,e.rootRoll+=Math.sin(a*.42+this.seed)*.014*l}turnInPlace(e,t){if(t.speed>1||Math.abs(t.yawRate)<1.1)return;let n=Rt(Math.abs(t.yawRate)/3,0,1)*(1-this.moveBlend),s=Math.sign(t.yawRate),r=e.e;r[R.SPINE2*3+1]+=s*.3*n,r[R.HEAD*3+1]+=s*.22*n,r[R.PELVIS*3]-=.04*n,e.rootRoll+=s*.06*n}actionPose(e,t){let n=this.action,s=Rt(n.t/n.dur,0,1),r=e.e,a=(u,d,f,g,b)=>{b<=0||(r[u*3]+=(d-r[u*3])*b,r[u*3+1]+=(f-r[u*3+1])*b,r[u*3+2]+=(g-r[u*3+2])*b)};if(n.kind==="die"){this.deathPose(e,t,s);return}if(n.kind==="attack"){if(s<.3){let f=vn(s/.3);a(R.ARM_R,-2.45,.25,-.42,f),a(R.FOREARM_R,-1.45,0,0,f),a(R.HAND_R,-.3,0,0,f),a(R.SPINE2,-.12,-.4,0,f),a(R.PELVIS,.02,.18,0,f*.8),a(R.ARM_L,-.75,0,.18,f),a(R.FOREARM_L,-1,0,0,f),a(R.HEAD,.06,.18,0,f),e.windUp=Math.max(e.windUp,f*.5)}else if(s<.55){let f=vn((s-.3)/.25000000000000006),g=1-Math.pow(1-f,3);a(R.ARM_R,-.7,-.2,.18,g),a(R.FOREARM_R,-.25,0,0,g),a(R.HAND_R,-.1,0,0,g),a(R.SPINE2,.32,.3,0,g),a(R.PELVIS,.06,-.24,0,g),a(R.ARM_L,-.5,0,.1,g),a(R.FOREARM_L,-.8,0,0,g),a(R.HEAD,-.04,-.1,0,g),e.rootPitch+=.14*g,e.lift-=.06*g,e.lungeF=Math.sin(f*Math.PI)*(1.5+n.power*.9),e.trail=Math.sin(f*Math.PI)*Rt(.7+n.power*.3,0,1.4)}else{let f=vn((s-.55)/.44999999999999996),g=1-f;a(R.ARM_R,-.34,0,-.12,g*.9+f*.1),a(R.FOREARM_R,-.62,0,0,g*.9),a(R.SPINE2,.1*g,.2*g,0,g),e.rootPitch+=.06*g,e.trail=0}return}if(n.kind==="spell"){let u=vn(Rt(s/.32,0,1)),d=vn(Rt((s-.42)/.2,0,1)),f=vn(Rt((s-.62)/.38,0,1)),g=u*(1-f*.85);a(R.ARM_L,-1.32-d*.18,.1,.3,g),a(R.FOREARM_L,-.32+d*.1,0,0,g),a(R.HAND_L,-.25,0,0,g),a(R.SPINE2,-.08+d*.2,.22,0,g),a(R.PELVIS,0,-.12,0,g*.7),a(R.HEAD,-.12,.1,0,g),a(R.ARM_R,-.15,0,-.2,g*.6),e.glow=u*(1-f)*(.7+.3*Math.sin(s*Math.PI)),e.windUp=u*(1-f)*.9,e.lift+=.05*g;return}if(n.kind==="shoot"){let u=vn(Rt(s/.45,0,1)),d=vn(Rt((s-.45)/.14,0,1)),f=vn(Rt((s-.62)/.38,0,1)),g=u*(1-f);a(R.ARM_R,.4-d*1.5,0,-.25,g),a(R.FOREARM_R,-1.75+d*1.45,0,0,g),a(R.ARM_L,-1.38+d*.1,.15,.08,g),a(R.FOREARM_L,-.18,0,0,g),a(R.SPINE2,.04,-.3,0,g),a(R.HEAD,.02,-.1,0,g),e.trail=0,d>.55&&d<.75&&(e.lungeF=-.3);return}if(n.kind==="heal"||n.kind==="buff"){let u=vn(Rt(s/.4,0,1)),d=vn(Rt((s-.72)/.28,0,1)),f=u*(1-d),g=n.kind==="buff"?-2.85:-1.55;a(R.ARM_R,g,0,n.kind==="buff"?-.3:-.5,f),a(R.FOREARM_R,n.kind==="buff"?-.35:-.5,0,0,f),a(R.ARM_L,-1.5,0,.55,f),a(R.FOREARM_L,-.4,0,0,f),a(R.SPINE2,-.14,0,0,f),a(R.HEAD,-.22,0,0,f),e.glow=f*(n.kind==="heal"?.9:.55),e.windUp=f*.8,e.lift+=.08*f;return}let o=n.kind==="crit"?1.6:1;if(n.kind==="miss"){let u=Math.sin(s*Math.PI),d=n.dir>=0?1:-1;a(R.SPINE2,.08,-.3*d,.12*d,u),a(R.ARM_L,-.5,0,.5,u*.7),a(R.ARM_R,-.4,0,-.5,u*.7),e.rootRoll+=d*.13*u,e.lift-=.05*u;return}let l=s,c=Math.sin(l*Math.PI)*o,h=Math.sin(l*26)*.06*(1-l)*o;a(R.SPINE2,-.42*o,.08,0,Rt(c,0,1)),a(R.SPINE1,-.18*o,0,0,Rt(c,0,1)),a(R.HEAD,-.3*o,.1,0,Rt(c,0,1)),a(R.ARM_L,-.35,0,.55,Rt(c,0,1)*.8),a(R.ARM_R,-.3,0,-.55,Rt(c,0,1)*.8),a(R.PELVIS,-.06,0,0,Rt(c,0,1)),e.rootPitch-=.13*Rt(c,0,1),e.rootRoll+=h,e.lift-=.1*Rt(c,0,1)}deathPose(e,t,n){let s=e.e,r=(a,o,l,c,h)=>{s[a*3]+=(o-s[a*3])*h,s[a*3+1]+=(l-s[a*3+1])*h,s[a*3+2]+=(c-s[a*3+2])*h};if(t.isWraith){let a=vn(n);r(R.SPINE1,.5*a,0,0,a),r(R.SPINE2,.35*a,0,0,a),r(R.HEAD,.45*a,.2*a,.1*a,a),r(R.ARM_L,-.3-.4*a,0,.9*a,a),r(R.ARM_R,-.3-.4*a,0,-.9*a,a),e.lift=1.15-3.3*a,e.rootPitch=.85*a;return}if(n<.24){let a=vn(n/.24);r(R.THIGH_L,-.95,0,.1,a),r(R.THIGH_R,-.95,0,-.1,a),r(R.SHIN_L,1.6,0,0,a),r(R.SHIN_R,1.6,0,0,a),r(R.FOOT_L,-.3,0,0,a),r(R.FOOT_R,-.3,0,0,a),r(R.SPINE2,.2,0,0,a),r(R.ARM_L,-.35,0,.5,a),r(R.ARM_R,-.35,0,-.5,a),r(R.HEAD,-.15,0,0,a),e.lift=-1.15*a,e.rootPitch=.12*a}else if(n<.52){let a=vn((n-.24)/.28);r(R.THIGH_L,-1.4,0,.12,1),r(R.THIGH_R,-1.4,0,-.12,1),r(R.SHIN_L,2.15,0,0,1),r(R.SHIN_R,2.15,0,0,1),r(R.FOOT_L,-.4,0,0,1),r(R.FOOT_R,-.4,0,0,1),r(R.SPINE1,.5,0,0,1),r(R.SPINE2,.5,.1,0,1),r(R.HEAD,.42,.15,0,1),r(R.ARM_L,-.5,0,.35,1),r(R.ARM_R,-.5,0,-.35,1),r(R.FOREARM_L,-.3,0,0,1),r(R.FOREARM_R,-.3,0,0,1),e.lift=-1.15-.85*a,e.rootPitch=.12+.3*a}else{let a=vn((n-.52)/.48);r(R.THIGH_L,-.5,0,.14,1),r(R.THIGH_R,-.5,0,-.14,1),r(R.SHIN_L,.45,0,0,1),r(R.SHIN_R,.45,0,0,1),r(R.FOOT_L,-.5,0,0,1),r(R.FOOT_R,-.5,0,0,1),r(R.SPINE1,.3,0,0,1),r(R.SPINE2,.24,0,0,1),r(R.HEAD,-.2,.35,.15,1),r(R.ARM_L,-.2,0,1.15,1),r(R.ARM_R,-.2,0,-1.15,1),r(R.FOREARM_L,-.15,0,0,1),r(R.FOREARM_R,-.15,0,0,1),e.lift=-2-.85*a,e.rootPitch=.42+.95*a}}applyToRig(e,t){let n=t.e;for(let s=0;s<as;s++){let r=n[s*3],a=n[s*3+1],o=n[s*3+2];if(r===0&&a===0&&o===0){e.bones[s].quaternion.copy(e.bindQuats[s]);continue}cd.setFromAxisAngle(nM,r),bm.setFromAxisAngle(sM,o),ym.setFromAxisAngle(iM,a),cd.multiply(bm).multiply(ym),e.bones[s].quaternion.copy(e.bindQuats[s]).multiply(cd)}}},Rn={rootPitch:0,rootRoll:0,lift:0,lungeF:0,trail:0,glow:0,windUp:0,dieT:-1,actionDone:!1,footfalls:0},cd=new Ht,ym=new Ht,bm=new Ht,nM=new N(1,0,0),iM=new N(0,1,0),sM=new N(0,0,1);var Ve={steel:new de(.62,.65,.7),darkSteel:new de(.34,.36,.4),rust:new de(.42,.33,.24),wood:new de(.24,.18,.11),gold:new de(.72,.58,.18),bone:new de(.78,.74,.66),leather:new de(.2,.16,.12),pale:new de(.8,.78,.7)};function Ke(i,e,t,n,s,r,a,o,l){let c=new Ue(s,r,a);l?c.applyMatrix4(new Ge().compose(new N(e,t,n),new Ht().setFromEuler(l),new N(1,1,1))):c.translate(e,t,n),i.push({geom:c,color:o})}function xm(i,e,t,n,s,r,a,o,l=7){let c=new Ct(s,r,a,l);c.translate(e,t,n),i.push({geom:c,color:o})}function rM(i,e,t,n,s,r){let a=new pl(s,0);a.translate(e,t,n),i.push({geom:a,color:r})}function wm(i){let e=[],t=[],n=[],s=[];for(let a of i){let o=a.geom.index?a.geom.toNonIndexed():a.geom;o!==a.geom&&a.geom.dispose();let l=o.attributes.position.array,c=o.attributes.normal.array,h=o.attributes.uv?o.attributes.uv.array:null,u=l.length/3;for(let d=0;d<u;d++)e.push(l[d*3],l[d*3+1],l[d*3+2]),t.push(c[d*3],c[d*3+1],c[d*3+2]),h?n.push(h[d*2],h[d*2+1]):n.push(0,0),s.push(a.color.r,a.color.g,a.color.b);o.dispose()}let r=new Qe;return r.setAttribute("position",new He(e,3)),r.setAttribute("normal",new He(t,3)),r.setAttribute("uv",new He(n,2)),r.setAttribute("color",new He(s,3)),r}var Zl=new Map;function aM(i){let e=Zl.get(i);if(e)return e;let t=[],n=0,s;if(i==="longsword")Ke(t,0,.2,0,.09,.09,.09,Ve.gold),Ke(t,0,.02,0,.07,.42,.07,Ve.wood),Ke(t,0,-.16,0,.09,.1,.09,Ve.leather),Ke(t,0,-.26,0,.62,.055,.13,Ve.steel),Ke(t,0,-.3,0,.02,.075,.028,Ve.gold),Ke(t,0,-1.75,0,.11,2.9,.035,Ve.steel),Ke(t,0,-3.32,0,.062,.24,.028,Ve.steel),n=-3.4;else if(i==="dagger")Ke(t,0,.16,0,.07,.06,.07,Ve.darkSteel),Ke(t,0,.02,0,.055,.3,.055,Ve.wood),Ke(t,0,-.17,0,.2,.04,.09,Ve.darkSteel),Ke(t,.04,-.19,0,.12,.035,.08,Ve.darkSteel,new Ut(0,0,-.5)),Ke(t,0,-.75,0,.075,1.1,.022,Ve.darkSteel),Ke(t,0,-1.36,0,.045,.2,.018,Ve.darkSteel),n=-1.45;else if(i==="staff"){xm(t,0,-.2,0,.055,.075,4.2,Ve.wood),xm(t,.05,1.55,0,.05,.07,.6,Ve.wood,5),Ke(t,0,1.78,0,.16,.16,.16,Ve.wood),Ke(t,.1,1.66,.04,.1,.22,.1,Ve.wood,new Ut(.4,0,.5));for(let r=0;r<3;r++){let a=r/3*Math.PI*2;Ke(t,Math.cos(a)*.11,1.98,Math.sin(a)*.11,.035,.3,.035,Ve.rust,new Ut(Math.cos(a)*.35,0,-Math.sin(a)*.35))}rM(t,0,2.1,0,.11,Ve.gold),n=2.1,s={y:2.1,color:14715450}}else if(i==="mace"){Ke(t,0,.2,0,.09,.09,.09,Ve.bone),Ke(t,0,0,0,.07,.4,.07,Ve.wood),Ke(t,0,-.22,0,.3,.05,.3,Ve.gold),Ke(t,0,-.48,0,.2,.44,.2,Ve.darkSteel);for(let r=0;r<4;r++){let a=r/4*Math.PI;Ke(t,Math.cos(a)*.17,-.48,Math.sin(a)*.17,.32,.34,.05,Ve.darkSteel,new Ut(0,-a+Math.PI/2,0))}n=-.8}else i==="tattered_sword"&&(Ke(t,0,.18,0,.09,.08,.09,Ve.rust),Ke(t,0,.02,0,.07,.34,.07,Ve.wood),Ke(t,0,-.2,0,.5,.05,.11,Ve.rust),Ke(t,0,-1.35,0,.1,2.2,.03,Ve.rust),Ke(t,.04,-1.9,.02,.085,.9,.028,Ve.rust,new Ut(.1,.1,.08)),n=-2.4);return e={geom:wm(t),tipY:n,glow:s},Zl.set(i,e),e}function oM(i){let e="shield:"+i,t=Zl.get(e);if(t)return t.geom;let n=[];if(i==="kite")Ke(n,0,0,0,.09,1.5,1.05,Ve.wood),Ke(n,0,-.62,0,.085,.55,.78,Ve.wood),Ke(n,0,-1.02,0,.08,.3,.5,Ve.wood),Ke(n,.05,0,0,.04,1.52,1.07,Ve.rust),Ke(n,.05,-.62,0,.035,.57,.8,Ve.rust),Ke(n,.08,.12,0,.07,.24,.24,Ve.gold),Ke(n,.08,-.35,0,.06,.5,.07,Ve.gold),Ke(n,.08,-.35,0,.06,.07,.5,Ve.gold);else if(i==="tome")Ke(n,0,-.28,0,.55,.7,.16,Ve.leather),Ke(n,0,-.28,.085,.47,.6,.05,Ve.pale),Ke(n,0,.06,0,.5,.07,.19,Ve.gold),Ke(n,.2,-.28,0,.1,.74,.05,Ve.gold);else if(i==="reliquary"){Ke(n,0,-.05,0,.06,.34,.06,Ve.darkSteel);for(let r=0;r<3;r++)Ke(n,0,-.28-r*.09,0,.025,.1,.025,Ve.darkSteel);Ke(n,0,-.66,0,.3,.34,.3,Ve.rust),Ke(n,0,-.66,.16,.14,.14,.03,Ve.gold),Ke(n,0,-.85,0,.18,.06,.18,Ve.gold)}let s=wm(n);return Zl.set(e,{geom:s,tipY:0}),s}var Sm=new Map;function Mm(i,e){let t=Sm.get(i);t||(t=new sn({map:ui(),color:i,transparent:!0,opacity:.85,blending:Vt,depthWrite:!1}),Sm.set(i,t));let n=new un(t);return n.scale.setScalar(e),n}var _m={warden:{main:"longsword",off:"kite",mainTrail:!0},shadowdancer:{main:"dagger",off:"dagger",mainTrail:!0},ashen_mage:{main:"staff",off:"tome",mainTrail:!1},pale_priest:{main:"mace",off:"reliquary",mainTrail:!1},skeleton:{main:"tattered_sword",off:null,mainTrail:!0},wraith:{main:"",off:null,mainTrail:!1}};function Em(i,e){let t=_m[e]??_m.warden;if(!t.main)return;let n=Fr(Gl(16777215,.45,.7)),s=aM(t.main),r=new he(s.geom,n);if(r.castShadow=!0,r.frustumCulled=!1,i.equipR.add(r),s.glow){let a=Mm(s.glow.color,1);a.position.set(0,s.glow.y,0),r.add(a)}if(t.mainTrail&&s.tipY<-.5){let a=new gt;a.position.set(0,s.tipY,0);let o=new gt;o.position.set(0,s.tipY*.4,0),r.add(a),r.add(o),i.trailTip=a,i.trailBase=o}if(t.off){let a=oM(t.off),o=new he(a,n);if(o.castShadow=!0,o.frustumCulled=!1,t.off==="kite")o.position.set(.22,.1,.05),o.rotation.set(.1,0,-.12);else if(t.off==="tome")o.position.set(0,-.34,.16),o.rotation.set(-.5,.15,0);else if(t.off==="reliquary"){o.position.set(.02,-.5,.1);let l=Mm(8377544,.8);l.position.set(0,-.66,.1),o.add(l)}i.equipL.add(o)}}var lM={warden:"sword",shadowdancer:"dagger",ashen_mage:"staff",pale_priest:"mace",skeleton:"sword",wraith:"none"},Tm=.06,Am=new N,cM=150,Cm=8;function hM(i){let e=2166136261;for(let t=0;t<i.length;t++)e^=i.charCodeAt(t),e=Math.imul(e,16777619);return e>>>0}var Jl=class{eng;actors=new Map;labelHost;focusId=null;constructor(e){this.eng=e,this.labelHost=document.createElement("div"),this.labelHost.style.cssText="position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:20",document.body.appendChild(this.labelHost),document.fonts?.ready&&document.fonts.ready.then(()=>{for(let[,t]of this.actors)this.drawHp(t)})}makeHpBar(){let e=document.createElement("canvas");e.width=168,e.height=42;let t=new Ft(e),n=new un(new sn({map:t,transparent:!0,depthTest:!0,depthWrite:!1}));return n.scale.set(7.5,1.9,1),n.center.set(.5,0),{sprite:n,canvas:e,tex:t}}drawHp(e){let t=e.hpCanvas.getContext("2d"),n=168,s=42;t.clearRect(0,0,n,s);let r=Math.max(0,Math.min(1,e.data.hp/e.data.hpMax));t.beginPath();let a=6;t.moveTo(a+1,1),t.lineTo(n-a-1,1),t.quadraticCurveTo(n-1,1,n-1,a+1),t.lineTo(n-1,s-a-1),t.quadraticCurveTo(n-1,s-1,n-a-1,s-1),t.lineTo(a+1,s-1),t.quadraticCurveTo(1,s-1,1,s-a-1),t.lineTo(1,a+1),t.quadraticCurveTo(1,1,a+1,1),t.closePath(),t.fillStyle="rgba(10,9,12,0.82)",t.fill(),t.strokeStyle="rgba(184,149,47,0.55)",t.lineWidth=1.4,t.stroke();let o=17;for(t.font=`600 ${o}px Cinzel, Georgia, serif`;t.measureText(e.data.name).width>n-24&&o>10;)o-=1,t.font=`600 ${o}px Cinzel, Georgia, serif`;t.textAlign="center",t.fillStyle="rgba(0,0,0,0.8)",t.fillText(e.data.name,n/2+1,17),t.fillStyle=e.data.kind==="player"?e.data.color||"#e6c766":"#d8d2c4",t.fillText(e.data.name,n/2,16);let l=22,c=124,h=25,u=8;t.fillStyle="#181210",t.fillRect(l,h,c,u);let d=r>.5?"#8a2a1f":r>.25?"#a33a1f":"#c9541f";t.fillStyle=e.data.kind==="player"?"#77864a":d,t.fillRect(l,h,c*r,u),t.strokeStyle="rgba(200,190,170,0.35)",t.lineWidth=1,t.strokeRect(l-.5,h-.5,c+1,u+1),e.hpTex.needsUpdate=!0}sync(e){let t=new Set;for(let n of e){if(n.hidden&&n.kind==="monster")continue;t.add(n.id);let s=this.actors.get(n.id);if(s){let r=s.data.hp,a=s.dead;if(n.id!==this.eng.controls.tokenId&&(n.x!==s.data.x||n.z!==s.data.z||n.rotY!==s.data.rotY)){let o=performance.now(),l=s.remotePositions[s.remotePositions.length-1];s.remotePositions.push({x:n.x,z:n.z,rotY:n.rotY||0,at:Math.max(o,l.at+.001)}),s.remotePositions.length>Cm&&s.remotePositions.splice(0,s.remotePositions.length-Cm)}s.data=n,(n.hp!==r||s.dead!==a)&&this.drawHp(s),JSON.stringify(n.look||null),JSON.stringify(s.rig.__lookKey??null)}else{let r=hM(n.id)^(n.portraitSeed??0),a={...n.look||{},seed:r},o=new xt,l;try{l=new Xl(n.archetype,a),Em(l,n.archetype)}catch(y){console.error("[actors] rig build failed for "+n.id+" \u2014 figure skipped, sync continues",y);continue}o.add(l.body);let c=new he(new ci(2.1,24),new kt({color:0,transparent:!0,opacity:.5,depthWrite:!1,alphaMap:ui()}));c.rotation.x=-Math.PI/2,c.position.y=.13,o.add(c);let h=n.id==="tok_"+String(this.eng.controls?.tokenId??"").slice(4),u=n.kind==="player"?new de(n.color||"#c9a227"):new de(8003359),d=new he(new Ps(1.85,2.12,40),new kt({color:u,transparent:!0,opacity:h?.5:.28,depthWrite:!1}));d.rotation.x=-Math.PI/2,d.position.y=.14,o.add(d);let f=new he(new Ps(2.22,2.46,40),new kt({color:9431216,transparent:!0,opacity:.6,depthWrite:!1}));f.rotation.x=-Math.PI/2,f.position.y=.2,f.visible=!1,o.add(f);let g=null;n.kind==="player"&&(g=new ks(14198874,95,34,1.8),g.position.set(0,5.2,.4),o.add(g));let{sprite:b,canvas:p,tex:m}=this.makeHpBar(),x=(l.topY+1.15)*(n.size||1);b.position.y=x,o.add(b),o.position.set(n.x,0,n.z),o.rotation.y=n.rotY||0,this.eng.scene.add(o);let v=performance.now();s={id:n.id,group:o,rig:l,anim:new Kl(r),style:lM[n.archetype]||"sword",hpBar:b,hpCanvas:p,hpTex:m,plaqueY:x,data:n,speed:0,prevSpeed:0,accel:0,yawRate:0,lastX:n.x,lastZ:n.z,lastRotY:n.rotY||0,remotePositions:[{x:n.x,z:n.z,rotY:n.rotY||0,at:v}],dieT:-1,dead:!1,downed:!1,spawnT:.55,ring:d,statusRing:f,lantern:g},s.downed=n.hp<=0&&!n.deathSaves?.dead&&n.kind==="player",s.anim.setDowned(s.downed),this.actors.set(n.id,s),this.drawHp(s)}}for(let[n,s]of this.actors)t.has(n)||(this.eng.scene.remove(s.group),s.rig.dispose(),this.actors.delete(n))}clearAll(){for(let[,e]of this.actors)this.eng.scene.remove(e.group),e.rig.dispose();this.actors.clear()}get(e){return this.actors.get(e)}focusPoint(){let e=this.focusId?this.actors.get(this.focusId):null;return e?{x:e.group.position.x,z:e.group.position.z}:{x:100,z:80}}headPos(e,t=new N){return t.set(e.group.position.x,e.plaqueY-.9,e.group.position.z)}getScreenPos(e){let t=this.actors.get(e);if(!t)return null;let n=this.headPos(t).project(this.eng.camera);return n.z>1?null:{x:(n.x*.5+.5)*window.innerWidth,y:(-n.y*.5+.5)*window.innerHeight}}playAction(e,t){let n=this.actors.get(e);if(!n)return;let s=Math.max(.4,Math.min(2.4,t.power??1));switch(t.anim){case"lunge":n.anim.trigger("attack",s,t.dir??0);break;case"spell":n.anim.trigger("spell",s,t.dir??0);break;case"shoot":n.anim.trigger("shoot",s,t.dir??0);break;case"heal":n.anim.trigger("heal",s),this.eng.effects.burst(n.group.position,9431216,16,8);break;case"buff":n.anim.trigger("buff",s);break;case"hit":n.anim.trigger("hit"),this.eng.effects.burst(n.group.position,13187626,18),this.eng.cameraRig.shake(.45);break;case"crit":n.anim.trigger("crit",s),this.eng.effects.burst(n.group.position,16738858,34),this.eng.cameraRig.shake(.9);break;case"miss":n.anim.trigger("miss");break;case"die":n.dead||(n.dead=!0,n.dieT=0,n.anim.trigger("die"));break}}update(e,t){let n=1.1+Math.sin(t*.23)*.7,s=.5+Math.cos(t*.31)*.5,r=performance.now()-cM;for(let[a,o]of this.actors){let l=a===this.eng.controls.tokenId,c=o.data,h=this.eng.grid.worldToCell(o.group.position.x,o.group.position.z),u=c.kind!=="monster"||this.eng.fog.isVisible(h.cx,h.cz);o.group.visible=!c.hidden&&u,o.hpBar.visible=!l&&u&&!c.hidden;let d=String(c.conditions?.[0]||"").toLowerCase(),f=/poison|disease/.test(d)?8436573:/burn|fire/.test(d)?15895365:/fear|fright/.test(d)?8628699:/stun|paraly/.test(d)?11636956:14731888,g=c.hp<=0&&c.kind==="player"&&!c.deathSaves?.dead,b=!!c.deathSaves?.dead||c.kind!=="player"&&c.hp<=0;if(g!==o.downed&&(o.downed=g,o.anim.setDowned(g),g&&(o.speed=0,o.prevSpeed=0,o.accel=0)),o.statusRing.visible=(!!c.conditions?.length||o.downed)&&!o.dead,o.statusRing.material.color.setHex(o.downed?12076337:f),o.statusRing.material.opacity=.4+Math.sin(t*4)*.12,b&&!o.dead&&(o.dead=!0,o.dieT=0,o.anim.setDowned(!1),o.anim.trigger("die")),o.dead&&(o.dieT>=0&&(o.dieT=Math.min(1,o.dieT+e*.8)),o.rig.setDissolve(o.dieT),o.group.position.y=-o.dieT*.55,o.hpBar.material.opacity=1-o.dieT,o.ring.material.opacity=.28*(1-o.dieT)),!l&&!o.dead){let M=o.remotePositions;for(;M.length>2&&M[1].at<=r;)M.shift();let T=M[0],L=M[1];if(T&&r>=T.at){let S=L?Math.max(0,Math.min(1,(r-T.at)/(L.at-T.at))):1;o.group.position.x=T.x+((L?.x??T.x)-T.x)*S,o.group.position.z=T.z+((L?.z??T.z)-T.z)*S;let E=(L?.rotY??T.rotY)-T.rotY;for(;E>Math.PI;)E-=Math.PI*2;for(;E<-Math.PI;)E+=Math.PI*2;o.group.rotation.y=T.rotY+E*S}}let p=this.eng.grid.terrainHeightAt(o.group.position.x,o.group.position.z);o.group.position.y=o.dead?p-o.dieT*.55:p+(l?this.eng.controls.jumpOffset:0);let m=o.group.position.x-o.lastX,x=o.group.position.z-o.lastZ,v=Math.sqrt(m*m+x*x)/Math.max(e,1e-4);o.speed+=(v-o.speed)*Math.min(1,e*9);let y=o.group.rotation.y-o.lastRotY;for(;y>Math.PI;)y-=Math.PI*2;for(;y<-Math.PI;)y+=Math.PI*2;o.yawRate+=(y/Math.max(e,1e-4)-o.yawRate)*Math.min(1,e*7),o.accel+=((o.speed-o.prevSpeed)/Math.max(e,1e-4)-o.accel)*Math.min(1,e*5),o.prevSpeed=o.speed,o.lastX=o.group.position.x,o.lastZ=o.group.position.z,o.lastRotY=o.group.rotation.y;let w=o.anim.update({dt:e,t,speed:o.speed,accel:o.accel,yawRate:o.yawRate,style:o.style,isWraith:o.rig.isWraith,isSkeleton:o.rig.isSkeleton},o.rig);if(l)for(let M=0;M<w.footfalls;M++)We.emit(qe.SFX,{name:"step",volume:.72});let _=o.rig.body;if(_.position.x=0,_.position.z=w.lungeF*.42,o.rig.isWraith?_.position.y=1.15+w.lift:_.position.y=Math.max(0,w.lift*.35),!o.dead&&!o.rig.isWraith){let M=o.group.position.y,T=o.rig.bones,L=T[R.FOOT_L].getWorldPosition(Am).y-M,S=T[R.FOOT_R].getWorldPosition(Am).y-M,E=L<S?L:S;E<Tm&&(_.position.y+=(Tm-E)*.6)}if(o.rig.update(e,n-Math.sin(o.group.rotation.y)*o.speed*.35,s-Math.cos(o.group.rotation.y)*o.speed*.35,w.windUp),o.rig.palmSprite){let M=o.rig.palmSprite.material;M.opacity=.25+w.glow*.75,o.rig.palmSprite.scale.setScalar(Math.max(.001,.35+w.glow*1.5))}if(o.rig.innerGlow){let M=o.rig.innerGlow.material;M.opacity=.45+Math.sin(t*2.1)*.12+w.glow*.4}if(o.lantern){let M=1+Math.sin(t*13.7+o.lastX)*.12+Math.sin(t*31.3+o.lastZ)*.07;o.lantern.intensity=95*M}if(o.spawnT>0){o.spawnT=Math.max(0,o.spawnT-e);let T=.86+.14*(1-o.spawnT/.55);o.group.scale.setScalar(T)}}}dispose(){this.labelHost.remove()}};function uM(i,e,t,n,s,r,a){let o=n-i,l=s-e,c=r-t,h=0,u=1;if(Math.abs(o)<1e-9){if(i<a.x1||i>a.x2)return 1/0}else{let d=(a.x1-i)/o,f=(a.x2-i)/o;if(d>f){let g=d;d=f,f=g}if(d>h&&(h=d),f<u&&(u=f),h>u)return 1/0}if(Math.abs(l)<1e-9){if(e<a.yMin||e>a.yMax)return 1/0}else{let d=(a.yMin-e)/l,f=(a.yMax-e)/l;if(d>f){let g=d;d=f,f=g}if(d>h&&(h=d),f<u&&(u=f),h>u)return 1/0}if(Math.abs(c)<1e-9){if(t<a.z1||t>a.z2)return 1/0}else{let d=(a.z1-t)/c,f=(a.z2-t)/c;if(d>f){let g=d;d=f,f=g}if(d>h&&(h=d),f<u&&(u=f),h>u)return 1/0}return h}var ka=new N,hd=new N,jl=new N,Ns=new N,Ql=class{eng;yaw=Math.PI*.12;pitch=.34;dist=26;curLen=26;shakeAmt=0;frameIds=null;frameT=0;frameFocus=new N;focusInit=!1;constructor(e){this.eng=e}follow(e){this.eng.actors.focusId=e,this.frameIds=null,this.focusInit=!1}frameCombat(e){this.frameIds=e.length?e:null,this.frameT=0,this.focusInit=!1}orbit(e,t){this.yaw-=e*.0042,this.pitch=Math.max(.07,Math.min(1.18,this.pitch+t*.003))}zoom(e){this.dist=Math.max(12,Math.min(60,this.dist+e*.03))}shake(e){this.shakeAmt=Math.min(1.6,this.shakeAmt+e)}qaCam=null;update(e){let t=this.eng;if(window.__AR_QA_CAM__){let m=window.__AR_QA_CAM__;t.camera.position.set(m.pos.x,m.pos.y,m.pos.z),t.camera.lookAt(m.look.x,m.look.y,m.look.z);return}let n=0,s=0,r=0,a=!1;if(this.frameIds){let m=0,x=0,v=0;for(let y of this.frameIds){let w=t.actors.get(y);w&&(x+=w.group.position.x,v+=w.group.position.z,m++)}if(m>0){x/=m,v/=m;let y=0;for(let M of this.frameIds){let T=t.actors.get(M);T&&(y=Math.max(y,Math.hypot(T.group.position.x-x,T.group.position.z-v)))}a=!0,this.yaw+=e*.11;let w=Math.max(18,Math.min(55,y*2.1+18));this.dist+=(w-this.dist)*(1-Math.exp(-e*1.6)),Ns.set(x,0,v);let _=this.focusInit?1-Math.exp(-e*3):1;this.frameFocus.lerp(Ns,_),n=this.frameFocus.x,s=this.frameFocus.z,r=0,this.frameT+=e}else this.frameIds=null}if(!a){let m=t.actors.focusId?t.actors.get(t.actors.focusId):null;if(!m)return;Ns.set(m.group.position.x,0,m.group.position.z);let x=this.focusInit?1-Math.exp(-e*14):1;this.frameFocus.lerp(Ns,x),n=this.frameFocus.x,s=this.frameFocus.z,r=m.group.position.y}this.focusInit=!0;let o=r+5,l=Math.cos(this.pitch),c=Math.sin(this.pitch),h=this.dist*l,u=o+this.dist*c,d=t.grid.cameraMaxY;u>d&&(u=d),u<2.4&&(u=2.4),hd.set(n+Math.sin(this.yaw)*h,u,s+Math.cos(this.yaw)*h),ka.set(n,o,s),jl.subVectors(hd,ka);let f=jl.length();f>1e-4&&jl.multiplyScalar(1/f);let g=this.sweepClearT(ka,hd,Math.min(o,u),Math.max(o,u)),b=Math.min(f,Math.max(7,g*f-1.7)),p=b<this.curLen?14:2.4;this.curLen+=(b-this.curLen)*(1-Math.exp(-e*p)),this.curLen>f&&(this.curLen=f),this.curLen<7&&(this.curLen=7),Ns.copy(ka).addScaledVector(jl,this.curLen),this.pushOutOfBoxes(Ns,ka),t.camera.position.copy(Ns),t.camera.position.y>d&&(t.camera.position.y=d),t.camera.position.y<1.6&&(t.camera.position.y=1.6),t.camera.lookAt(n,o-.5,s),this.shakeAmt>.001&&(this.shakeAmt*=Math.exp(-e*5.5),t.camera.rotateX((Math.random()-.5)*this.shakeAmt*.02),t.camera.rotateY((Math.random()-.5)*this.shakeAmt*.02))}sweepClearT(e,t,n,s){let r=1,a=c=>{if(c.decor||s<c.yMin+.01||n>c.yMax-.01)return;let h=uM(e.x,e.y,e.z,t.x,t.y,t.z,c);h<r&&(r=h)},o=this.eng.grid.colliders;for(let c=0;c<o.length;c++)a(o[c]);let l=this.eng.world.obstructionBoxes;for(let c=0;c<l.length;c++)a(l[c]);return r}pushOutOfBoxes(e,t){let n=[this.eng.grid.colliders,this.eng.world.obstructionBoxes];for(let s=0;s<6;s++){let r=!1;for(let a of n){for(let o of a)if(!o.decor&&!(e.y<o.yMin||e.y>o.yMax)&&e.x>o.x1-.4&&e.x<o.x2+.4&&e.z>o.z1-.4&&e.z<o.z2+.4){r=!0;break}if(r)break}if(!r)return;e.lerp(t,.3)}}};var dM=16,fM=26,ec=class{eng;tokenId=null;keys={};drag=!1;lastX=0;lastY=0;netAccum=0;jumpHeight=0;jumpVelocity=0;jumpRequested=!1;correction=null;offMoveRejected;constructor(e){this.eng=e,this.offMoveRejected=We.on(qe.MOVE_REJECTED,n=>{let s=this.tokenId?this.eng.actors.get(this.tokenId):null,r=n?.position||n;s&&Number.isFinite(r?.x)&&Number.isFinite(r?.z)&&(this.correction={x:r.x,z:r.z})}),window.addEventListener("keydown",this.onKeyDown),window.addEventListener("keyup",this.onKeyUp);let t=e.renderer.domElement;t.addEventListener("pointerdown",this.onPointerDown),window.addEventListener("pointermove",this.onPointerMove),window.addEventListener("pointerup",this.onPointerUp),t.addEventListener("wheel",this.onWheel,{passive:!0}),t.addEventListener("contextmenu",n=>n.preventDefault())}get jumpOffset(){return this.jumpHeight}bindToken(e){this.tokenId=e}uiOpen(){return Ee.getState().phase!=="playing"?!0:!!(document.activeElement&&/^(INPUT|TEXTAREA|BUTTON|SELECT)$/.test(document.activeElement.tagName))||!!document.querySelector(".pnl-layer:not([hidden]), .hud-prompt:not([hidden])")}onKeyDown=e=>{if(e.code==="Space"&&!this.keys.Space&&!this.uiOpen()&&(this.jumpRequested=!0),e.code==="KeyE"&&!e.repeat&&!this.uiOpen()){let t=this.tokenId?this.eng.actors.get(this.tokenId):null;if(t){let n=t.group.position.x,s=t.group.position.z,r=this.nearestDoor(n,s),a=this.nearestExit(n,s);a&&(!r||a.distance<r.distance)?gd(a.id):r&&md(r.wallIndex)}}this.keys[e.code]=!0,["KeyW","KeyA","KeyS","KeyD","Space","ShiftLeft","KeyE"].includes(e.code)&&!this.uiOpen()&&e.preventDefault()};onKeyUp=e=>{this.keys[e.code]=!1};onPointerDown=e=>{e.button===0&&(this.drag=!0,this.lastX=e.clientX,this.lastY=e.clientY)};onPointerMove=e=>{if(!this.drag)return;let t=e.clientX-this.lastX,n=e.clientY-this.lastY;if(this.lastX=e.clientX,this.lastY=e.clientY,e.target&&e.target.tagName!=="CANVAS"){this.drag=!1;return}this.eng.cameraRig.orbit(t,n)};onPointerUp=()=>{this.drag=!1};onWheel=e=>{this.eng.cameraRig.zoom(e.deltaY)};nearestDoor(e,t){let n=Ee.getState().doors,s=this.eng.grid.map?.walls||[],r=null;for(let a of n){let o=s[a.wallIndex];if(!o||o.type!=="door"&&o.type!=="secret_door")continue;let l=o.x1===o.x2?{...o,x1:o.x1+.5,x2:o.x2+.5}:{...o,z1:o.z1+.5,z2:o.z2+.5},c=l.x1*5,h=l.z1*5,u=l.x2*5,d=l.z2*5,f=u-c,g=d-h,b=Math.max(0,Math.min(1,((e-c)*f+(t-h)*g)/(f*f+g*g||1))),p=Math.hypot(e-(c+b*f),t-(h+b*g));p>8.5||r&&r.distance<=p||(r={wallIndex:a.wallIndex,distance:p,label:a.locked?"Locked door":a.open?"Close door":"Open door"})}return r}nearestExit(e,t){let n=null;for(let s of this.eng.grid.map?.exits||[]){let r=Math.hypot(e-s.x*5,t-s.z*5);r>8.5||n&&n.distance<=r||(n={id:s.id,distance:r,label:s.label})}return n}update(e){let t=this.tokenId?this.eng.actors.get(this.tokenId):null;if(!t){let v=Ee.getState();v.interactLabel&&v.setInteract(null);return}let n=Ee.getState(),s=this.nearestDoor(t.group.position.x,t.group.position.z),r=this.nearestExit(t.group.position.x,t.group.position.z),a=r&&(!s||r.distance<s.distance)?r:s;n.interactLabel!==(a?.label||null)&&n.setInteract(a?.label||null);let o=n.initiative,l=!!o?.order?.length,c=o?.order?.[o.turnIdx??-1],h=!l||c===this.tokenId,u=o?.movement,d=u?.tokenId===this.tokenId&&Number.isFinite(u.maxFt)?u.maxFt:t.data.speedFt,f=l&&u?.tokenId===this.tokenId?Math.max(0,d-(u.usedFt||0)):t.data.speedFt,g=t.data.hp>0&&!t.data.deathSaves?.dead,b=g&&(!l||h&&f>.1),p=this.uiOpen(),m=!p&&b,x=this.keys.KeyW||this.keys.KeyA||this.keys.KeyS||this.keys.KeyD;if(g?(this.jumpRequested&&!p&&this.jumpHeight===0&&(this.jumpVelocity=7.2),this.jumpRequested=!1,(this.jumpHeight>0||this.jumpVelocity>0)&&(this.jumpHeight=Math.max(0,this.jumpHeight+this.jumpVelocity*e),this.jumpVelocity-=18*e,this.jumpHeight===0&&(this.jumpVelocity=0)),t.group.position.y=this.eng.grid.terrainHeightAt(t.group.position.x,t.group.position.z)+this.jumpHeight):(this.keys.KeyW=this.keys.KeyA=this.keys.KeyS=this.keys.KeyD=!1,this.keys.Space=!1,this.jumpRequested=!1,this.jumpHeight=0,this.jumpVelocity=0,t.group.position.y=this.eng.grid.terrainHeightAt(t.group.position.x,t.group.position.z)),this.correction)if(m&&x)t.group.position.x=this.correction.x,t.group.position.z=this.correction.z,this.correction=null;else{let v=Math.min(1,e*8);t.group.position.x+=(this.correction.x-t.group.position.x)*v,t.group.position.z+=(this.correction.z-t.group.position.z)*v,Math.hypot(this.correction.x-t.group.position.x,this.correction.z-t.group.position.z)<.35&&(this.correction=null)}if(m){let v=0,y=0;if(this.keys.KeyW&&(y-=1),this.keys.KeyS&&(y+=1),this.keys.KeyA&&(v-=1),this.keys.KeyD&&(v+=1),v!==0||y!==0){let _=Math.hypot(v,y);v/=_,y/=_;let M=this.eng.cameraRig.yaw,T=v*Math.cos(M)+y*Math.sin(M),L=-v*Math.sin(M)+y*Math.cos(M),E=this.keys.ShiftLeft||this.keys.ShiftRight?fM:dM,D=t.group.position.x,O=t.group.position.z,[F,W]=this.eng.grid.resolve(D+T*E*e,O,1.2);!this.eng.grid.isOpenWorld(F,O)&&this.eng.grid.isOpenWorld(D,O)&&(F=D),[F,W]=this.eng.grid.resolve(F,O+L*E*e,1.2),this.eng.grid.isOpenWorld(F,W)||(this.eng.grid.isOpenWorld(F,O)?W=O:this.eng.grid.isOpenWorld(D,W)?F=D:(F=D,W=O)),t.group.position.x=F,t.group.position.z=W,t.group.rotation.y=Math.atan2(T,L),this.netAccum+=e,this.netAccum>.1&&(this.netAccum=0,pc(F,W,t.group.rotation.y))}else this.netAccum+=e,this.netAccum>.5&&(this.netAccum=0,pc(t.group.position.x,t.group.position.z,t.group.rotation.y))}t.data.x=t.group.position.x,t.data.z=t.group.position.z,t.data.rotY=t.group.rotation.y}dispose(){this.offMoveRejected(),window.removeEventListener("keydown",this.onKeyDown),window.removeEventListener("keyup",this.onKeyUp),window.removeEventListener("pointermove",this.onPointerMove),window.removeEventListener("pointerup",this.onPointerUp)}};var tc=class{eng;host;floats=[];bursts=[];telegraphs=[];constructor(e){this.eng=e,this.host=document.createElement("div"),this.host.style.cssText="position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:22",document.body.appendChild(this.host)}floatText(e,t,n="dmg"){let s=document.createElement("div");s.className="float-text "+n,s.textContent=t,this.host.appendChild(s),this.floats.push({el:s,x:e.x,y:e.y,z:e.z,t:0,life:n==="miss"?.9:1.25})}burst(e,t,n=20,s=5){let r=new Qe,a=new Float32Array(n*3),o=new Float32Array(n*3);for(let c=0;c<n;c++){a[c*3]=e.x+(Math.random()-.5)*1.2,a[c*3+1]=e.y+4+Math.random()*2,a[c*3+2]=e.z+(Math.random()-.5)*1.2;let h=Math.random()*Math.PI*2,u=Math.random()*Math.PI*.6+.25,d=s*(.5+Math.random());o[c*3]=Math.cos(h)*Math.sin(u)*d,o[c*3+1]=Math.cos(u)*d*1.4,o[c*3+2]=Math.sin(h)*Math.sin(u)*d}r.setAttribute("position",new Xe(a,3));let l=new es(r,new Ti({color:t,size:1.9,transparent:!0,opacity:1,map:ui(),blending:Vt,depthWrite:!1}));l.frustumCulled=!1,this.eng.scene.add(l),this.bursts.push({points:l,vels:o,t:0,life:.8})}telegraph(e,t,n,s=13194271){let r=new he(new ci(n,36),new kt({color:s,transparent:!0,opacity:0,side:Mt,depthWrite:!1}));r.rotation.x=-Math.PI/2,r.position.set(e,.35,t),this.eng.scene.add(r),this.telegraphs.push({mesh:r,t:0,life:.9})}update(e){for(let t=this.floats.length-1;t>=0;t--){let n=this.floats[t];n.t+=e;let s=n.t/n.life;if(s>=1){n.el.remove(),this.floats.splice(t,1);continue}let r=new N(n.x,n.y+10+s*6,n.z).project(this.eng.camera);if(r.z>1){n.el.style.display="none";continue}n.el.style.display="block",n.el.style.left=(r.x*.5+.5)*window.innerWidth+"px",n.el.style.top=(-r.y*.5+.5)*window.innerHeight+"px",n.el.style.opacity=String(s<.7?1:(1-s)/.3),s<.25&&(n.el.style.transform=`translate(-50%,-50%) scale(${.7+s/.25*.5})`)}for(let t=this.bursts.length-1;t>=0;t--){let n=this.bursts[t];n.t+=e;let s=n.t/n.life;if(s>=1){this.eng.scene.remove(n.points),n.points.geometry.dispose(),n.points.material.dispose(),this.bursts.splice(t,1);continue}let r=n.points.geometry.attributes.position.array;for(let a=0;a<r.length/3;a++)n.vels[a*3+1]-=26*e,r[a*3]+=n.vels[a*3]*e,r[a*3+1]+=n.vels[a*3+1]*e,r[a*3+2]+=n.vels[a*3+2]*e,r[a*3+1]<.4&&(r[a*3+1]=.4,n.vels[a*3+1]*=-.35);n.points.geometry.attributes.position.needsUpdate=!0,n.points.material.opacity=1-s}for(let t=this.telegraphs.length-1;t>=0;t--){let n=this.telegraphs[t];n.t+=e;let s=n.t/n.life;if(s>=1){this.eng.scene.remove(n.mesh),n.mesh.geometry.dispose(),n.mesh.material.dispose(),this.telegraphs.splice(t,1);continue}let r=n.mesh.material;r.opacity=Math.sin(s*Math.PI)*.4,n.mesh.scale.setScalar(.6+s*.55)}}dispose(){this.host.remove()}};var nc=class{renderer;scene;camera;clock=new kr;world;grid;fog;actors;cameraRig;controls;effects;myTokenId=null;raf=0;disposed=!1;lastEnv={time:21*60,weather:"clear",mode:"cycle"};timeAccum=0;areaMusic="crypt";doorOpenByWall=new Map;composer=null;bloomPass=null;lowgfx;constructor(e){if(this.lowgfx=/lowgfx=1/.test(location.search)||(navigator.hardwareConcurrency||8)<=4,this.renderer=new el({canvas:e,antialias:!this.lowgfx,powerPreference:"high-performance"}),this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,this.lowgfx?1:2)),this.renderer.setSize(window.innerWidth,window.innerHeight),this.renderer.outputColorSpace=Gt,this.renderer.shadowMap.enabled=!0,this.renderer.shadowMap.type=Bu,this.renderer.toneMapping=zu,this.renderer.toneMappingExposure=1.05,this.scene=new nl,this.scene.background=new de(461068),this.scene.fog=new tl(461068,.01),this.camera=new cn(55,window.innerWidth/window.innerHeight,.5,900),this.camera.position.set(30,11,44),!this.lowgfx){let t=new Cl(this.scene,this.camera);this.bloomPass=new Or(new ue(window.innerWidth,window.innerHeight),.75,.5,.82),this.composer=new Al(this.renderer),this.composer.addPass(t),this.composer.addPass(this.bloomPass)}this.world=new Fl(this),this.grid=new Ol(this),this.fog=new Bl(this),this.actors=new Jl(this),this.effects=new tc(this),this.cameraRig=new Ql(this),this.controls=new ec(this),this.wire(),window.addEventListener("resize",this.onResize),window.__AR_ENGINE__=this}wire(){Ee.subscribe((e,t)=>{(e.initiative!==t.initiative||e.phase!==t.phase)&&Zr(e.phase==="playing"?e.initiative?"combat":this.areaMusic:"menu")}),We.on(qe.MAP_LOAD,e=>{if(!e||!e.size||!e.cells){console.warn("MAP_LOAD: map is null/missing \u2014 world geometry skipped");return}this.doorOpenByWall.clear(),Ee.getState().setInteract(null),this.loadMap(e)}),We.on(qe.DOORS_SYNC,e=>{if(!Array.isArray(e))return;for(let n of e){let s=this.doorOpenByWall.get(n.wallIndex);s!==void 0&&s!==n.open&&pi("door"),this.doorOpenByWall.set(n.wallIndex,n.open)}let t=this.grid.syncDoorStates(e);t&&this.fog.syncDoorStates(t)}),We.on(qe.TOKENS_SYNC,e=>{let t=Ee.getState();this.myTokenId=t.myTokenId,this.controls.bindToken(this.myTokenId),this.cameraRig.follow(this.myTokenId),this.actors.sync(e)}),We.on(qe.ENV_SYNC,e=>{e.dayNight&&(this.lastEnv.time=e.dayNight.time??this.lastEnv.time),e.dayNight?.mode&&(this.lastEnv.mode=e.dayNight.mode),e.weather?.type&&(this.lastEnv.weather=e.weather.type),this.world.setEnv(this.lastEnv)}),We.on(qe.FX,e=>{this.actors.playAction(e.actorId,e.action);let n={lunge:"attack",shoot:"shoot",spell:"spell",heal:"heal",buff:"buff",hit:"hit",crit:"crit",miss:"miss",die:"die"}[e.action?.anim];n&&pi(n)}),We.on(qe.SFX,e=>{e?.name&&pi(e.name,e.volume)})}loadMap(e){if(!e||!e.size||!e.cells){console.warn("MAP_LOAD: map is null/missing");return}this.grid.build(e),this.fog.build(e),this.actors.clearAll(),this.world.onMapTheme(e),this.areaMusic=Ur(e).ambience==="town"?"town":"crypt";let t=Ee.getState();Zr(t.initiative?"combat":this.areaMusic),this.controls.bindToken(this.myTokenId);let n=e.spawns.party[0];this.camera.position.set(n[0]*5+10,10.5,n[1]*5+16),this.camera.lookAt(n[0]*5,4,n[1]*5)}start(){let e=()=>{if(this.disposed||(this.raf=requestAnimationFrame(e),window.__AR_PAUSE__))return;let t=Math.min(this.clock.getDelta(),.05);this.tick(t)};this.raf=requestAnimationFrame(e)}tick(e){this.timeAccum+=e,this.lastEnv.mode==="cycle"&&(this.lastEnv.time=(this.lastEnv.time+e*1.2)%1440),this.world.update(e,this.lastEnv),this.grid.update(e),this.controls.update(e),this.actors.update(e,this.timeAccum),this.fog.update(e),this.effects.update(e),this.cameraRig.update(e),this.composer?this.composer.render():this.renderer.render(this.scene,this.camera)}onResize=()=>{this.camera.aspect=window.innerWidth/window.innerHeight,this.camera.updateProjectionMatrix(),this.renderer.setSize(window.innerWidth,window.innerHeight),this.composer&&this.composer.setSize(window.innerWidth,window.innerHeight)};dispose(){this.disposed=!0,cancelAnimationFrame(this.raf),window.removeEventListener("resize",this.onResize),this.bloomPass?.dispose(),this.composer?.dispose(),this.renderer.dispose()}};function Da(i,e){let t=document.createElement("div");t.className="pnl-layer",t.hidden=!0,t.innerHTML=`
    <div class="pnl-modal ornate${e.narrow?" pnl-narrow":""}" role="dialog" aria-modal="true">
      <input class="pnl-trap" data-ar-trap="1" readonly tabindex="-1" aria-hidden="true" />
      <header class="pnl-head">
        <div class="pnl-head-text">
          <div class="pnl-kicker"></div>
          <h2 class="pnl-title"></h2>
          <div class="pnl-sub" hidden></div>
        </div>
        <button type="button" class="pnl-close" aria-label="close the panel">\u2715</button>
      </header>
      <div class="pnl-body"></div>
    </div>`,i.appendChild(t);let n=t.querySelector(".pnl-modal"),s=t.querySelector(".pnl-body"),r=t.querySelector(".pnl-trap"),a=t.querySelector(".pnl-kicker"),o=t.querySelector(".pnl-title"),l=t.querySelector(".pnl-sub"),c={root:t,card:n,body:s,onOpen:()=>{},setHead(h){h.kicker!==void 0&&(a.textContent=h.kicker),h.title!==void 0&&(o.textContent=h.title),h.sub!==void 0&&(l.hidden=h.sub==null,h.sub!=null&&(l.textContent=h.sub))},open(){t.hidden=!1,r.focus({preventScroll:!0}),c.onOpen()},close(){t.hidden=!0,t.contains(document.activeElement)&&document.activeElement.blur()},toggle(){t.hidden?c.open():c.close()},isOpen:()=>!t.hidden,dispose(){t.remove()}};return c.setHead({kicker:e.kicker,title:e.title}),t.addEventListener("click",h=>{h.target===t&&c.close()}),t.querySelector(".pnl-close").addEventListener("click",()=>c.close()),n.addEventListener("click",h=>{!t.hidden&&!h.target.closest("[data-panel-keep-focus]")&&r.focus({preventScroll:!0})}),r.addEventListener("keydown",h=>{h.key==="Tab"&&h.preventDefault()}),c}function Rm(){let i=Ee.getState();return i.tokens.find(e=>e.id===i.myTokenId)??null}var pM="M40 30 L68 50 L40 70 Z",Pm="M30 16 H70 V84 H30 Z M40 32 H60 M40 46 H60 M40 60 H54",Im="M34 42 H66 L73 82 H27 Z M40 42 C40 29 60 29 60 42 M50 29 V22",mM="M28 30 H72 M28 50 H72 M28 70 H72",gM="M62 16 H78 V84 H62 M36 34 L20 50 L36 66 M20 50 H58";function Lm(i,e){let t=Da(i,{kicker:"the ashen reach",title:"Rest a moment",narrow:!0});t.body.innerHTML=`
    <div class="pnl-menu-actions">
      <button type="button" class="pnl-menu-btn" data-mb="resume">
        ${fi(pM,"mb-ic")} <span>Resume</span>
      </button>
      <button type="button" class="pnl-menu-btn" data-mb="sheet">
        ${fi(Pm,"mb-ic")} <span>Character Record</span> <kbd>C</kbd>
      </button>
      <button type="button" class="pnl-menu-btn" data-mb="inv">
        ${fi(Im,"mb-ic")} <span>Satchel &amp; Gear</span> <kbd>I</kbd>
      </button>
      <button type="button" class="pnl-menu-btn danger" data-mb="leave">
        ${fi(gM,"mb-ic")} <span>Return to the Main Menu</span>
      </button>
    </div>
    <div class="pnl-audio-settings" data-panel-keep-focus></div>
    <div class="pnl-menu-note">movement rests while this card is open \u2014 Esc or Resume to return</div>`;let n=Ya(t.body.querySelector(".pnl-audio-settings"),!0);return t.body.querySelectorAll(".pnl-menu-btn").forEach(s=>{s.addEventListener("click",()=>{switch(s.dataset.mb){case"resume":t.close();break;case"sheet":e.onOpenSheet();break;case"inv":e.onOpenInventory();break;case"leave":e.onReturn();break}})}),{open:()=>t.open(),close:()=>t.close(),toggle:()=>t.toggle(),isOpen:()=>t.isOpen(),dispose:()=>{n(),t.dispose()}}}function km(i,e){let t=document.createElement("div");return t.className="pnl-dock",t.innerHTML=`
    <button type="button" class="pnl-dock-btn" data-dock="sheet" title="character record (C)" aria-label="Character record (C)">${fi(Pm)} <span>Record</span> <kbd>C</kbd></button>
    <button type="button" class="pnl-dock-btn" data-dock="inv" title="satchel and gear (I)" aria-label="Satchel and gear (I)">${fi(Im)} <span>Satchel</span> <kbd>I</kbd></button>
    <button type="button" class="pnl-dock-btn" data-dock="menu" title="menu (Esc)" aria-label="Menu (Escape)">${fi(mM)} <span>Menu</span> <kbd>Esc</kbd></button>`,i.appendChild(t),t.addEventListener("click",n=>{let s=n.target.closest("[data-dock]");s&&(s.dataset.dock==="sheet"?e.onSheet():s.dataset.dock==="inv"?e.onInventory():s.dataset.dock==="menu"&&e.onMenu())}),()=>t.remove()}function Ha(){let i=Rm(),e=i?i.sheet??null:null;return{token:i,sheet:e}}var en=i=>String(i??"").replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e]),Ri=i=>i==null?"\u2014":i>=0?`+${i}`:`${i}`,Dm=["str","dex","con","int","wis","cha"],Hm={str:"STR",dex:"DEX",con:"CON",int:"INT",wis:"WIS",cha:"CHA"},vM=["acrobatics","animal_handling","arcana","athletics","deception","history","insight","intimidation","investigation","medicine","nature","perception","performance","persuasion","religion","sleight_of_hand","stealth","survival"],yM=["","1st","2nd","3rd","4th","5th","6th","7th","8th","9th"],Nm=i=>yM[i]||`${i}th`;function Pn(i,e,t,n){return`<div class="pnl-vital"${t?` data-band="${t}"`:""}${n?` title="${en(n)}"`:""}><b>${i}</b><span>${e}</span></div>`}function ic(i,e){if(!i)return"none";let t=e?.spellcasting;return[i.hp,i.hpMax,i.ac,(i.conditions||[]).join(","),i.deathSaves?.ok,i.deathSaves?.fail,i.deathSaves?.dead,e?.name,e?.level,e?.subclass,e?.race,e?.subrace,e?.class,e?.background,e?.ac,e?.armor,e?.shield,e?.hp?.current,e?.hp?.max,e?.hitDice?.remaining,e?.hitDice?.total,e?.initiative,e?.proficiencyBonus,!!Ee.getState().initiative,e?.sneakAttackDice,t?`${t.saveDC}|${t.attackBonus}|${t.cantripsKnown}|${t.preparedCount}`+Object.entries(t.slots||{}).map(([n,s])=>`${n}:${s.used}/${s.total}`).join(";")+`|${(t.cantrips||[]).join(",")}`+Object.entries(t.spellsByLevel||{}).map(([n,s])=>`${n}:${s.join(",")}`).join(";"):"",(e?.attacks||[]).map(n=>n.name).join(","),(e?.features||[]).map(n=>n.name).join(","),(e?.traits||[]).map(n=>n.name).join(","),e?.passive?.perception,e?.passive?.investigation,e?.passive?.insight].join("~")}function Om(i){let e=Da(i,{kicker:"character record",title:"Character Record"}),t="",n=()=>{let{token:r,sheet:a}=Ha(),o=e.body,l=o.scrollTop,c=new Set(Array.from(o.querySelectorAll("details[data-key][open]")).map(X=>X.dataset.key||""));if(!r){e.setHead({title:"No Mortal Shell",sub:null}),o.innerHTML=`<div class="pnl-note">thou walkest as the DM's eye \u2014 no mortal shell binds thee.</div>`,t=ic(r,a);return}if(!a){e.setHead({title:r.name,sub:null}),o.innerHTML=`<div class="pnl-note"><b>${en(r.name)}</b> walks as a plain ${en(r.archetype)}.<br/>
        Souls forged at the Forge of Souls carry a full record \u2014 this one carries none yet.</div>`,t=ic(r,a);return}let h=[a.race,a.subrace].filter(Boolean).join(" "),u=a.subclass?`${a.class} (${a.subclass})`:a.class;e.setHead({title:a.name||r.name,sub:[h,u,a.level?`Level ${a.level}`:null,a.background].filter(Boolean).join(" \xB7 ")||null});let d=r.hpMax||1,f=r.hp/d,g=[Pn(`${Math.max(0,r.hp)}<i>/${d}</i>`,"hit points",f>.6?void 0:f>.3?"mid":"low"),Pn(String(r.ac),"armor class",void 0,a.acDetail?`base ${a.acDetail.base??"?"}${a.acDetail.dex?` + dex ${Ri(a.acDetail.dex)}`:""}${a.acDetail.armor?` \xB7 ${a.acDetail.armor}`:""}${a.acDetail.shield?` + shield ${Ri(a.acDetail.shield)}`:""}`:void 0),Pn(Ri(a.initiative),"initiative"),Pn(`${a.speedFt??r.speedFt} ft`,"speed"),Pn(Ri(a.proficiencyBonus),"proficiency"),a.hitDice?Pn(`${a.hitDice.remaining??"?"}/${a.hitDice.total??"?"}`,`hit dice ${a.hitDice.die||""}`.trim()):"",a.darkvisionFt?Pn(`${a.darkvisionFt} ft`,"darkvision"):"",a.sneakAttackDice?Pn(a.sneakAttackDice,"sneak attack"):""].filter(Boolean).join(""),b=Dm.map(X=>{let te=a.abilities?.[X],Pe=a.baseAbilities?.[X],$e=te!=null&&Pe!=null?te-Pe:0;return`<div class="pnl-ability">
        <div class="ab-name">${Hm[X]}</div>
        <div class="ab-score">${te??"\u2014"}</div>
        <div class="ab-mod">${Ri(a.mods?.[X])}</div>
        ${$e?`<div class="ab-asi">${$e>0?"+":""}${$e} racial</div>`:""}
      </div>`}).join(""),p=Dm.map(X=>{let te=a.saves?.[X];return`<div class="pnl-save${te?.proficient?" prof":""}"><span class="pnl-dot"></span><b>${Ri(te?.mod)}</b><span>${Hm[X].toLowerCase()}</span></div>`}).join(""),m=vM.map(X=>{let te=a.skills?.[X];return te?`<div class="pnl-skill${te.proficient?" prof":""}"><span class="pnl-dot"></span><b>${Ri(te.mod)}</b><span class="sk-name">${en(te.name||X)}</span><span class="sk-ab">${en((te.ability||"").toUpperCase())}</span></div>`:""}).join(""),x=(a.attacks||[]).map(X=>{let te=[];X.finesse&&te.push("finesse"),X.twoHanded&&te.push("two-handed"),X.versatile&&te.push("versatile"),X.thrown&&te.push("thrown"),X.ammunition&&te.push("ammo"),X.ranged&&X.rangeFt&&te.push(`range ${X.rangeFt}/${X.longRangeFt??X.rangeFt}`);let Pe=X.damageFormula||`${X.damageDice||"?"}${X.damageMod?(X.damageMod>0?"+":"")+X.damageMod:""}`;return`<tr>
        <td>${en(X.name||"\u2014")}</td>
        <td class="pnl-atk-bonus">${Ri(X.attackBonus)}</td>
        <td>${en(Pe)}${X.damageType?` <span class="atk-type">${en(X.damageType)}</span>`:""}</td>
        <td class="dim">${en(te.join(" \xB7 "))}</td>
      </tr>`}).join(""),v=x?`
      <div class="pnl-sec">attacks</div>
      <table class="pnl-table">
        <thead><tr><th>weapon</th><th>bonus</th><th>damage</th><th>properties</th></tr></thead>
        <tbody>${x}</tbody>
      </table>`:"",y=a.spellcasting,w=!!y&&((y.cantrips||[]).length>0||(y.spells||[]).length>0||Object.keys(y.slots||{}).length>0||Object.keys(y.spellsByLevel||{}).length>0),_="";if(y&&w){let X=[y.ability?Pn(String(y.ability),"spell ability"):"",y.saveDC!=null?Pn(String(y.saveDC),"save dc"):"",y.attackBonus!=null?Pn(Ri(y.attackBonus),"spell attack"):"",y.cantripsKnown!=null?Pn(String(y.cantripsKnown),"cantrips"):"",y.preparedCount!=null?Pn(String(y.preparedCount),"prepared"):""].filter(Boolean).join(""),te=Object.entries(y.slots||{}).sort(($,se)=>Number($[0])-Number(se[0])).map(([$,se])=>`<div class="pnl-slot">${Nm(Number($))} <b>${Math.max(0,(se.total??0)-(se.used??0))}/${se.total??0}</b></div>`).join(""),Pe=(y.cantrips||[]).map($=>`<span class="pnl-chip cantrip">${en($)}</span>`).join(""),$e=Object.entries(y.spellsByLevel||{}).sort(($,se)=>Number($[0])-Number(se[0])).map(([$,se])=>`
          <div class="pnl-spell-level">${Nm(Number($))} level</div>
          <div class="pnl-chips">${se.map(ye=>`<span class="pnl-chip">${en(ye)}</span>`).join("")}</div>`).join("");_=`
        <div class="pnl-sec">spellcasting</div>
        <div class="pnl-vitals">${X}</div>
        ${te?`<div class="pnl-slots">${te}</div>`:""}
        ${Pe?`<div class="pnl-spell-level">cantrips</div><div class="pnl-chips">${Pe}</div>`:""}
        ${$e}`}let M=(a.features||[]).map((X,te)=>`
      <details class="pnl-feat" data-key="f${te}:${en(X.name||"")}">
        <summary><span class="pnl-feat-lvl">lv ${X.level??"?"}</span>${en(X.name||"\u2014")}</summary>
        <div class="pnl-feat-body">${en(X.description||"")}</div>
      </details>`).join(""),T=(a.traits||[]).map((X,te)=>`
      <details class="pnl-feat" data-key="t${te}:${en(X.name||"")}">
        <summary><span class="pnl-feat-src">${en(X.source||"trait")}</span>${en(X.name||"\u2014")}</summary>
        <div class="pnl-feat-body">${en(X.description||"")}</div>
      </details>`).join(""),L=a.passive,S=L?`
      <div class="pnl-sec">passive scores</div>
      <div class="pnl-chips">
        ${L.perception!=null?`<span class="pnl-chip">passive perception <b>${L.perception}</b></span>`:""}
        ${L.investigation!=null?`<span class="pnl-chip">passive investigation <b>${L.investigation}</b></span>`:""}
        ${L.insight!=null?`<span class="pnl-chip">passive insight <b>${L.insight}</b></span>`:""}
      </div>`:"",E=!!Ee.getState().initiative,D=Math.max(0,Math.floor(a.hitDice?.remaining||0)),O=a.class==="Warlock"&&Object.values(y?.slots||{}).some(X=>(X.used||0)>0),F=O?0:Math.min(1,D),W=Array.from({length:D+1},(X,te)=>`<option value="${te}"${te===F?" selected":""}>${te}</option>`).join(""),B=!E&&(O||D>0&&r.hp<d),ee=Object.values(y?.slots||{}).some(X=>(X.used||0)>0),q=!E&&(r.hp<d||D<(a.hitDice?.total||0)||ee),le=`
      <div class="pnl-sec">rest &amp; recover</div>
      <div class="pnl-rest-actions">
        <label>Hit Dice to spend
          <select data-rest-dice ${D?"":"disabled"}>${W}</select>
        </label>
        <button type="button" class="pnl-btn" data-rest-short ${B?"":"disabled"}>Short Rest</button>
        <button type="button" class="pnl-btn" data-rest-long ${q?"":"disabled"}>Long Rest</button>
      </div>
      <div class="pnl-rest-note">Short rests spend Hit Dice; long rests restore HP, spell slots, and some spent Hit Dice. Resting is unavailable during combat.</div>`;o.innerHTML=`
      <div class="pnl-vitals">${g}</div>
      <div class="pnl-sec">abilities</div>
      <div class="pnl-abilities">${b}</div>
      <div class="pnl-sec">saving throws</div>
      <div class="pnl-cols">${p}</div>
      <div class="pnl-sec">skills</div>
      <div class="pnl-cols">${m}</div>
      ${v}
      ${_}
      <div class="pnl-sec">features &amp; traits</div>
      ${M}${T||(M?"":'<div class="pnl-note">no recorded deeds \u2014 the road is still young.</div>')}
      ${S}
      ${le}`,o.querySelector("[data-rest-short]")?.addEventListener("click",()=>{let X=Number(o.querySelector("[data-rest-dice]")?.value||0);Xr("shortRest",X)}),o.querySelector("[data-rest-long]")?.addEventListener("click",()=>{window.confirm("Complete a long rest and restore your resources?")&&Xr("longRest")}),o.scrollTop=l,o.querySelectorAll("details[data-key]").forEach(X=>{c.has(X.dataset.key||"")&&(X.open=!0)}),t=ic(r,a)};e.onOpen=n;let s=Ee.subscribe(()=>{if(!e.isOpen())return;let{token:r,sheet:a}=Ha();ic(r,a)!==t&&n()});return{open:()=>e.open(),close:()=>e.close(),toggle:()=>e.toggle(),isOpen:()=>e.isOpen(),dispose(){s(),e.dispose()}}}var Na=i=>String(i??"").replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e]),bM=/^potion of (?:greater |superior |supreme )?healing$/i,xM={weapon:0,armor:1,shield:2,gear:3,tool:4,pack:5},Um=i=>xM[String(i.kind||"")]??3,SM=i=>String(i||"").replace(/_/g," ");function MM(i,e){let t=String(i.name||"");if(i.kind==="shield")return!!e.shield;if(i.kind==="armor")return e.armor===t;let n=e.equipped;return Array.isArray(n)&&n.includes(t)}function _M(i){let e=(i.inventory||[]).filter(s=>s&&s.name);if(e.length)return{items:e,note:null};let t=(i.equipment||[]).filter(s=>s&&s.name);if(t.length)return{items:t,note:"ledger without weights \u2014 the forge recorded names only"};let n=[];for(let s of i.attacks||[])s.name&&n.push({name:s.name,qty:1,kind:"weapon"});return i.armor&&n.push({name:i.armor,qty:1,kind:"armor"}),i.shield&&n.push({name:"Shield",qty:1,kind:"shield"}),{items:n,note:n.length?"starting gear, as forged":null}}function sc(i,e){return i?[e,i.armor,i.shield,JSON.stringify(i.equipped??null),JSON.stringify(i.inventory??null),JSON.stringify(i.equipment??null),JSON.stringify(i.carrying??null)].join("~"):`nosheet:${e}`}function Fm(i){let e=Da(i,{kicker:"satchel & gear",title:"Satchel & Gear"}),t="",n=()=>{let{token:r,sheet:a}=Ha(),o=e.body,l=o.scrollTop;if(!r){e.setHead({title:"Satchel & Gear",sub:null}),o.innerHTML=`<div class="pnl-note">thou walkest as the DM's eye \u2014 no satchel binds thee.</div>`,t=sc(a,0);return}if(!a){e.setHead({title:r.name,sub:null}),o.innerHTML=`<div class="pnl-note"><b>${Na(r.name)}</b> carries nothing the ledger can see.<br/>
        Souls forged at the Forge of Souls carry starting gear.</div>`,t=sc(a,r.hp);return}let{items:c,note:h}=_M(a),u=[...c].sort((g,b)=>Um(g)-Um(b)).map(g=>{let b=String(g.name||"\u2014"),p=String(g.kind||""),m=MM(g,a),x=p==="weapon"||p==="armor"||p==="shield",v=!x&&bM.test(b);return`<div class="pnl-item">
        <span class="it-name">${Na(b)}</span>
        ${g.qty&&g.qty>1?`<span class="it-qty">\xD7${g.qty}</span>`:""}
        <span class="it-cat">${Na(SM(g.category||p))}</span>
        <span class="it-wt">${g.weight!=null?`${g.weight} lb`:"\u2014"}</span>
        ${m?'<span class="pnl-badge">equipped</span>':""}
        ${x?`<button type="button" class="pnl-btn" data-op="equip" data-item="${Na(b)}">${m?"Unequip":"Equip"}</button>`:""}
        ${v?`<button type="button" class="pnl-btn" data-op="use" data-item="${Na(b)}">Use</button>`:""}
      </div>`}).join(""),d=a.carrying,f=d?`
      <div class="pnl-load${d.encumbered?" enc":""}">
        <span>load ${d.weight??0} / ${d.capacity??"?"} lb</span>
        <div class="pnl-load-bar"><i style="width:${Math.min(100,(d.weight||0)/Math.max(1,d.capacity||1)*100)}%"></i></div>
        ${d.encumbered?"<span>encumbered</span>":""}
      </div>`:"";e.setHead({title:a.name||r.name,sub:[`${c.length} ${c.length===1?"entry":"entries"}`,d?`load ${d.weight??0}/${d.capacity??"?"} lb`:null,h].filter(Boolean).join(" \xB7 ")||null}),o.innerHTML=u?u+f:'<div class="pnl-note">the satchel holds nothing but ash.<br/>Gear gathered in the reach will find its way here.</div>'+f,o.scrollTop=l,t=sc(a,r.hp)};e.onOpen=n,e.body.addEventListener("click",r=>{let a=r.target.closest("button[data-op]");!a||a.disabled||(Xr(a.dataset.op==="use"?"use":"equip",a.dataset.item||""),a.disabled=!0,a.classList.add("busy"),setTimeout(()=>{a.disabled=!1,a.classList.remove("busy")},4e3))});let s=Ee.subscribe(()=>{if(!e.isOpen())return;let{token:r,sheet:a}=Ha();sc(a,r?.hp??0)!==t&&n()});return{open:()=>e.open(),close:()=>e.close(),toggle:()=>e.toggle(),isOpen:()=>e.isOpen(),dispose(){s(),e.dispose()}}}var Vm=new URLSearchParams(location.search),Bm=location.pathname.match(/^\/j\/([a-z0-9]+)/i),ud=Vm.get("invite")||(Bm?Bm[1]:""),Wm=Vm.get("dm")||"",dd=/[?&]headless=1/.test(location.search),Br=document.getElementById("app");document.getElementById("boot-splash")?.remove();nf(Br,{invite:ud,dmKey:Wm||void 0,headless:dd});var zm=!1;function wM(){if(zm||dd)return;zm=!0;let i=document.createElement("canvas");i.id="game-canvas",Br.prepend(i),new nc(i).start(),pd()}var rc=null;function EM(){if(rc)return;let i=Om(Br),e=Fm(Br),t=[i,e],n=Lm(Br,{onOpenSheet:()=>s(i),onOpenInventory:()=>s(e),onReturn:()=>{a(),Ee.getState().setPhase("join"),$a()}});t.push(n);function s(c){for(let h of t)h!==c&&h.close();c.open()}function r(c){c.isOpen()?c.close():s(c)}function a(){for(let c of t)c.close()}let o=km(Br,{onSheet:()=>r(i),onInventory:()=>r(e),onMenu:()=>r(n)}),l=c=>{if(Ee.getState().phase!=="playing")return;let h=document.activeElement;if(!(h&&(h.tagName==="INPUT"||h.tagName==="TEXTAREA")&&h.dataset.arTrap!=="1"&&!h.closest(".ar-audio-settings"))&&!c.repeat){if(c.code==="KeyC"){r(i);return}if(c.code==="KeyI"){r(e);return}if(c.code==="Escape"){if(t.some(d=>d.isOpen())){a();return}let u=document.querySelector(".hud-prompt");if(u&&!u.hidden)return;s(n)}}};window.addEventListener("keydown",l),rc=()=>{window.removeEventListener("keydown",l),o();for(let c of t)c.dispose();rc=null}}var Gm=Ee.getState().phase;Ee.subscribe(i=>{i.phase!==Gm&&(Gm=i.phase,i.phase!=="playing"&&Zr("menu"),i.phase==="playing"?(wM(),EM()):rc?.())});Ee.setState({phase:"connecting"});Wa();console.log("[ashenreach] boot",ud?`invite=${ud}`:"no invite",Wm?"dm-key present":"",dd?"headless":"");})();
/*! Bundled license information:

three/build/three.module.js:
  (**
   * @license
   * Copyright 2010-2024 Three.js Authors
   * SPDX-License-Identifier: MIT
   *)
*/
