import type { MonsterMeta, MonsterRosterEntry } from '@/types';
import { computeMonsterStats } from './monsterFormulas';

/**
 * Aetheria Monster Database — ported from
 * Complete_Monsters_With_Lore_Race_Behavior.xlsx (Tier/Monster/Element/
 * Element Level/Lore/Race/Behavior columns). Final stats stay computed via
 * `computeMonsterStats` (never baked), same "shortened coding" philosophy as
 * the source workbook: retune one Role/Tier multiplier and every monster
 * using it updates automatically. Role isn't in that sheet, so it's
 * auto-assigned round-robin across the 10 Roles (stats/skill kits still work
 * immediately — see monsterFormulas.ts / monsterSkills.ts). The sheet's 2
 * "World Boss" entries (dual-element, e.g. Earth/Wind) are deliberately left
 * out for now — the engine only supports one element per monster, and
 * true dual-element combat is a real engine change still to be designed.
 */
const R = (
  name: string,
  role: MonsterRosterEntry['role'],
  element: MonsterRosterEntry['element'],
  level: number,
  tier: MonsterRosterEntry['tier'],
  subtype: MonsterRosterEntry['subtype'],
  aggressive: boolean,
  elementLevel: number,
  race: MonsterRosterEntry['race'],
): MonsterRosterEntry => ({ name, role, element, level, tier, subtype, aggressive, elementLevel, race });

export const MONSTER_ROSTER_RAW: MonsterRosterEntry[] = [
  // ---- Normal (40) — Role isn't in the sheet, auto-assigned round-robin
  // across the 10 Roles. Note: a Regular-tier Field entry's own `aggressive`
  // flag here is inert once expanded into its Population Pyramid (Juvenile/
  // Adult/Elder — see expandRegularFieldEntry below), which already fixes
  // Juvenile=non-aggressive/Adult+Elder=aggressive regardless of what's
  // authored per-species; the sheet's Behavior column is kept on the raw
  // entry for reference but has no separate effect here.
  R('Puffleaf', 'Tank', 'earth', 1, 'regular', 'Field', false, 1, 'Plant'),
  R('Momoon', 'Tactician', 'wind', 3, 'regular', 'Field', false, 2, 'Spirit'),
  R('Bramblet', 'Healer', 'earth', 4, 'regular', 'Field', false, 2, 'Plant'),
  R('Nibble', 'Damager', 'earth', 6, 'regular', 'Field', false, 1, 'Beast'),
  R('Fuzzle', 'Assassin', 'wind', 7, 'regular', 'Field', false, 1, 'Beast'),
  R('Doodle', 'AoE Controller', 'wind', 9, 'regular', 'Field', false, 1, 'Beast'),
  R('Pibbit', 'AoE Damager', 'water', 10, 'regular', 'Field', false, 1, 'Beast'),
  R('Snuffle', 'Dodger', 'earth', 12, 'regular', 'Field', false, 2, 'Beast'),
  R('Glimble', 'Burst', 'fire', 13, 'regular', 'Field', true, 1, 'Elemental'),
  R('Tumbley', 'Accuracy', 'earth', 15, 'regular', 'Field', false, 1, 'Beast'),
  R('Mossy', 'Tank', 'earth', 16, 'regular', 'Field', false, 1, 'Plant'),
  R('Pebloo', 'Tactician', 'earth', 18, 'regular', 'Field', false, 1, 'Beast'),
  R('Fizzlepuff', 'Healer', 'wind', 19, 'regular', 'Field', false, 1, 'Beast'),
  R('Wiggleaf', 'Damager', 'earth', 21, 'regular', 'Field', false, 1, 'Plant'),
  R('Dewlet', 'Assassin', 'water', 22, 'regular', 'Field', false, 1, 'Beast'),
  R('Bubblee', 'AoE Controller', 'water', 24, 'regular', 'Field', true, 1, 'Elemental'),
  R('Swoonie', 'AoE Damager', 'wind', 25, 'regular', 'Field', false, 1, 'Beast'),
  R('Pollen', 'Dodger', 'earth', 27, 'regular', 'Field', false, 1, 'Plant'),
  R('Flutteroo', 'Burst', 'wind', 28, 'regular', 'Field', false, 1, 'Beast'),
  R('Rumblet', 'Accuracy', 'earth', 30, 'regular', 'Field', false, 1, 'Beast'),
  R('Nori', 'Tank', 'water', 31, 'regular', 'Field', false, 2, 'Beast'),
  R('Belloo', 'Tactician', 'wind', 33, 'regular', 'Field', false, 1, 'Beast'),
  R('Puffin', 'Healer', 'wind', 34, 'regular', 'Field', false, 2, 'Beast'),
  R('Suri', 'Damager', 'water', 36, 'regular', 'Field', false, 1, 'Beast'),
  R('Flurry', 'Assassin', 'water', 37, 'regular', 'Field', false, 2, 'Beast'),
  R('Thimble', 'AoE Controller', 'earth', 39, 'regular', 'Field', false, 1, 'Beast'),
  R('Berri', 'AoE Damager', 'earth', 40, 'regular', 'Field', false, 1, 'Beast'),
  R('Bristle', 'Dodger', 'earth', 42, 'regular', 'Field', false, 1, 'Beast'),
  R('Gloomie', 'Burst', 'water', 43, 'regular', 'Field', false, 1, 'Spirit'),
  R('Cinderoo', 'Accuracy', 'fire', 45, 'regular', 'Field', true, 2, 'Elemental'),
  R('Fernie', 'Tank', 'earth', 46, 'regular', 'Field', false, 1, 'Plant'),
  R('Willowee', 'Tactician', 'water', 48, 'regular', 'Field', false, 2, 'Plant'),
  R('Mallow', 'Healer', 'earth', 49, 'regular', 'Field', false, 1, 'Beast'),
  R('Ripple', 'Damager', 'water', 51, 'regular', 'Field', true, 1, 'Elemental'),
  R('Dandel', 'Assassin', 'wind', 52, 'regular', 'Field', false, 1, 'Plant'),
  R('Bloomie', 'AoE Controller', 'earth', 54, 'regular', 'Field', false, 1, 'Plant'),
  R('Breelee', 'AoE Damager', 'wind', 55, 'regular', 'Field', false, 1, 'Beast'),
  R('Taffy', 'Dodger', 'earth', 57, 'regular', 'Field', false, 1, 'Beast'),
  R('Cloveroo', 'Burst', 'earth', 58, 'regular', 'Field', false, 1, 'Plant'),
  R('Mireling', 'Accuracy', 'water', 60, 'regular', 'Field', false, 2, 'Beast'),

  // ---- Elite (30) — same round-robin Role assignment as Normal above.
  // Elite entries are NOT expanded by the Population Pyramid, so each one's
  // own `aggressive` (from the sheet's Behavior column) applies directly.
  R('Ironmane', 'Tank', 'earth', 10, 'elite', 'Field', true, 3, 'Construct'),
  R('Dreadhorn', 'Tactician', 'earth', 12, 'elite', 'Field', true, 2, 'Beast'),
  R('Emberhide', 'Healer', 'fire', 15, 'elite', 'Field', true, 2, 'Elemental'),
  R('Hollowfang', 'Damager', 'wind', 17, 'elite', 'Field', true, 2, 'Spirit'),
  R('Stormhide', 'Assassin', 'wind', 20, 'elite', 'Field', true, 3, 'Elemental'),
  R('Ashwarden', 'AoE Controller', 'fire', 22, 'elite', 'Field', true, 2, 'Elemental'),
  R('Grimtail', 'AoE Damager', 'earth', 24, 'elite', 'Field', true, 2, 'Beast'),
  R('Thornhide', 'Dodger', 'earth', 27, 'elite', 'Field', true, 2, 'Beast'),
  R('Mirelord', 'Burst', 'water', 29, 'elite', 'Field', true, 3, 'Beast'),
  R('Brimhide', 'Accuracy', 'fire', 32, 'elite', 'Field', true, 2, 'Beast'),
  R('Soulmaw', 'Tank', 'water', 34, 'elite', 'Field', true, 2, 'Spirit'),
  R('Nighthorn', 'Tactician', 'wind', 37, 'elite', 'Field', true, 2, 'Beast'),
  R('Irontide', 'Healer', 'water', 39, 'elite', 'Field', true, 2, 'Construct'),
  R('Flamehide', 'Damager', 'fire', 41, 'elite', 'Field', true, 3, 'Elemental'),
  R('Hollowmane', 'Assassin', 'wind', 44, 'elite', 'Field', true, 2, 'Spirit'),
  R('Shadecaller', 'AoE Controller', 'wind', 46, 'elite', 'Field', true, 2, 'Spirit'),
  R('Briarlord', 'AoE Damager', 'earth', 49, 'elite', 'Field', true, 2, 'Plant'),
  R('Duskhowler', 'Dodger', 'wind', 51, 'elite', 'Field', true, 2, 'Beast'),
  R('Gloomhide', 'Burst', 'water', 53, 'elite', 'Field', true, 2, 'Spirit'),
  R('Tidewarden', 'Accuracy', 'water', 56, 'elite', 'Field', true, 4, 'Elemental'),
  R('Fellhorn', 'Tank', 'earth', 58, 'elite', 'Field', true, 2, 'Beast'),
  R('Stormcaller', 'Tactician', 'wind', 61, 'elite', 'Field', true, 4, 'Elemental'),
  R('Moltenmane', 'Healer', 'fire', 63, 'elite', 'Field', true, 4, 'Elemental'),
  R('Moonstalker', 'Damager', 'wind', 66, 'elite', 'Field', true, 2, 'Spirit'),
  R('Briarfang', 'Assassin', 'earth', 68, 'elite', 'Field', true, 2, 'Plant'),
  R('Wildmaw', 'AoE Controller', 'fire', 70, 'elite', 'Field', true, 2, 'Aberration'),
  R('Silentclaw', 'AoE Damager', 'wind', 73, 'elite', 'Field', true, 2, 'Beast'),
  R('Stonehide', 'Dodger', 'earth', 75, 'elite', 'Field', true, 4, 'Construct'),
  R('Mirehowler', 'Burst', 'water', 78, 'elite', 'Field', true, 2, 'Beast'),
  R('Eldermaw', 'Accuracy', 'earth', 80, 'elite', 'Field', true, 2, 'Aberration'),

  // ---- Mini-Boss, wild field (10) ----
  R('Elder Briar', 'Tank', 'earth', 25, 'miniboss', 'Field', true, 4, 'Plant'),
  R('Hollow Baron', 'Tactician', 'wind', 31, 'miniboss', 'Field', true, 2, 'Spirit'),
  R('Ember Regent', 'Healer', 'fire', 37, 'miniboss', 'Field', true, 4, 'Elemental'),
  R('Storm Herald', 'Damager', 'wind', 43, 'miniboss', 'Field', true, 4, 'Elemental'),
  R('Moon Reaper', 'Assassin', 'water', 49, 'miniboss', 'Field', true, 3, 'Spirit'),
  R('Tide Tyrant', 'AoE Controller', 'water', 56, 'miniboss', 'Field', true, 4, 'Elemental'),
  R('Iron Sentinel', 'AoE Damager', 'earth', 62, 'miniboss', 'Field', true, 3, 'Construct'),
  R('Gloom Warden', 'Dodger', 'water', 68, 'miniboss', 'Field', true, 3, 'Spirit'),
  R('Ash Monarch', 'Burst', 'fire', 74, 'miniboss', 'Field', true, 3, 'Elemental'),
  R('Soul Harbinger', 'Accuracy', 'wind', 80, 'miniboss', 'Field', true, 3, 'Spirit'),

  // ---- Boss (9) — see BOSS_LANDMARKS/BOSS_UNDERLINGS below and
  // monsterSkills.ts's BOSS_SIGNATURE_SKILLS (only the first 6 have a
  // hand-authored signature skill so far; Nethriel/Eldrune/Solmare fall back
  // to their Role's normal kit until custom signatures are designed).
  R('Aurelion', 'Tank', 'wind', 40, 'boss', 'Field', true, 3, 'Dragonkin'),
  R('Morvain', 'Tactician', 'fire', 46, 'boss', 'Field', true, 2, 'Beast'),
  R('Seraphel', 'Healer', 'wind', 52, 'boss', 'Field', true, 3, 'Spirit'),
  R('Dreadmare', 'Damager', 'earth', 58, 'boss', 'Field', true, 3, 'Undead'),
  R('Umbriel', 'Assassin', 'water', 64, 'boss', 'Field', true, 2, 'Spirit'),
  R('Volaris', 'AoE Controller', 'wind', 70, 'boss', 'Field', true, 4, 'Elemental'),
  R('Nethriel', 'AoE Damager', 'water', 76, 'boss', 'Field', true, 3, 'Spirit'),
  R('Eldrune', 'Dodger', 'earth', 82, 'boss', 'Field', true, 2, 'Beast'),
  R('Solmare', 'Burst', 'fire', 88, 'boss', 'Field', true, 4, 'Elemental'),

  // ---- Boss Underlings (18, 2 per Boss) — PLACEHOLDER names (the sheet has
  // no Underling data), Tactician role, spawn only alongside their Boss.
  R('Boss Underling Placeholder 01', 'Tactician', 'water', 32, 'miniboss', 'Boss Underling', false, 2, 'Dragonkin'),
  R('Boss Underling Placeholder 02', 'Tactician', 'earth', 32, 'miniboss', 'Boss Underling', false, 2, 'Dragonkin'),
  R('Boss Underling Placeholder 03', 'Tactician', 'wind', 38, 'miniboss', 'Boss Underling', false, 2, 'Beast'),
  R('Boss Underling Placeholder 04', 'Tactician', 'fire', 38, 'miniboss', 'Boss Underling', false, 2, 'Beast'),
  R('Boss Underling Placeholder 05', 'Tactician', 'water', 44, 'miniboss', 'Boss Underling', false, 2, 'Spirit'),
  R('Boss Underling Placeholder 06', 'Tactician', 'earth', 44, 'miniboss', 'Boss Underling', false, 2, 'Spirit'),
  R('Boss Underling Placeholder 07', 'Tactician', 'wind', 50, 'miniboss', 'Boss Underling', false, 2, 'Undead'),
  R('Boss Underling Placeholder 08', 'Tactician', 'fire', 50, 'miniboss', 'Boss Underling', false, 2, 'Undead'),
  R('Boss Underling Placeholder 09', 'Tactician', 'water', 56, 'miniboss', 'Boss Underling', false, 2, 'Spirit'),
  R('Boss Underling Placeholder 10', 'Tactician', 'earth', 56, 'miniboss', 'Boss Underling', false, 2, 'Spirit'),
  R('Boss Underling Placeholder 11', 'Tactician', 'wind', 62, 'miniboss', 'Boss Underling', false, 2, 'Elemental'),
  R('Boss Underling Placeholder 12', 'Tactician', 'fire', 62, 'miniboss', 'Boss Underling', false, 2, 'Elemental'),
  R('Boss Underling Placeholder 13', 'Tactician', 'water', 68, 'miniboss', 'Boss Underling', false, 2, 'Spirit'),
  R('Boss Underling Placeholder 14', 'Tactician', 'earth', 68, 'miniboss', 'Boss Underling', false, 2, 'Spirit'),
  R('Boss Underling Placeholder 15', 'Tactician', 'wind', 74, 'miniboss', 'Boss Underling', false, 2, 'Beast'),
  R('Boss Underling Placeholder 16', 'Tactician', 'fire', 74, 'miniboss', 'Boss Underling', false, 2, 'Beast'),
  R('Boss Underling Placeholder 17', 'Tactician', 'water', 80, 'miniboss', 'Boss Underling', false, 2, 'Elemental'),
  R('Boss Underling Placeholder 18', 'Tactician', 'earth', 80, 'miniboss', 'Boss Underling', false, 2, 'Elemental'),
];

/**
 * Population Pyramid — a Regular-tier Field species is never a single spawn:
 * it's a 3-level population sharing one stat identity (role/element) but
 * each level gets its own Level (relative to the species' own authored
 * Level, so danger still scales exactly the way the base roster already
 * ordered it) and its own aggro behavior:
 *   base Level      "Juvenile" (no suffix) — non-aggressive, most common (x12/map)
 *   base Level + 2  "(Adult)"              — aggressive, the normal fight (x5/map)
 *   base Level + 14 "(Elder)"              — aggressive, rare — NOT guaranteed
 *                                             near its own species; see the
 *                                             sparse cross-map placement in
 *                                             constants/maps.ts
 * Elite/Mini-Boss/Boss/Underling entries are untouched by this expansion.
 */
interface PopulationLevelDef { levelOffset: number; suffix: string; aggressive: boolean }
export const POPULATION_LEVELS: PopulationLevelDef[] = [
  { levelOffset: 0, suffix: '', aggressive: false },
  { levelOffset: 2, suffix: ' (Adult)', aggressive: true },
  { levelOffset: 14, suffix: ' (Elder)', aggressive: true },
];
/** Individuals placed per population level, per map that hosts them — see constants/maps.ts placement pass. */
export const POPULATION_COUNTS: Record<string, number> = { '': 12, ' (Adult)': 5, ' (Elder)': 1 };

function expandRegularFieldEntry(entry: MonsterRosterEntry): MonsterRosterEntry[] {
  return POPULATION_LEVELS.map((lvl) => ({ ...entry, name: entry.name + lvl.suffix, level: entry.level + lvl.levelOffset, aggressive: lvl.aggressive }));
}

export const MONSTER_ROSTER: MonsterRosterEntry[] = MONSTER_ROSTER_RAW.flatMap((entry) =>
  entry.tier === 'regular' && entry.subtype === 'Field' ? expandRegularFieldEntry(entry) : [entry],
);

export const MONSTER_ROSTER_BY_NAME: Record<string, MonsterRosterEntry> = {};
MONSTER_ROSTER.forEach((m) => { MONSTER_ROSTER_BY_NAME[m.name] = m; });

/** Each Boss's 2 Tactician-role escorts (still PLACEHOLDER names — see
 *  above). Boss encounter composition is always exactly these 3, matching
 *  the player's 3v3. */
export const BOSS_UNDERLINGS: Record<string, [string, string]> = {
  'Aurelion': ['Boss Underling Placeholder 01', 'Boss Underling Placeholder 02'],
  'Morvain': ['Boss Underling Placeholder 03', 'Boss Underling Placeholder 04'],
  'Seraphel': ['Boss Underling Placeholder 05', 'Boss Underling Placeholder 06'],
  'Dreadmare': ['Boss Underling Placeholder 07', 'Boss Underling Placeholder 08'],
  'Umbriel': ['Boss Underling Placeholder 09', 'Boss Underling Placeholder 10'],
  'Volaris': ['Boss Underling Placeholder 11', 'Boss Underling Placeholder 12'],
  'Nethriel': ['Boss Underling Placeholder 13', 'Boss Underling Placeholder 14'],
  'Eldrune': ['Boss Underling Placeholder 15', 'Boss Underling Placeholder 16'],
  'Solmare': ['Boss Underling Placeholder 17', 'Boss Underling Placeholder 18'],
};

/** Each Boss's home landmark on the Aetheria map (see constants/maps.ts
 *  placement) — the sheet doesn't assign landmarks, so the 3 new Bosses
 *  (beyond the original 6) got 3 more distinctive existing map ids. */
export const BOSS_LANDMARKS: Record<string, string> = {
  'Aurelion': 'ruins_of_eldoria',
  'Morvain': 'tempest',
  'Seraphel': 'obsidian_ravine',
  'Dreadmare': 'mistvale_mountain_peak',
  'Umbriel': 'ancient_dragon_spine_nest',
  'Volaris': 'verdant_volcano',
  'Nethriel': 'dragon_spine_peak',
  'Eldrune': 'crimson_entrance',
  'Solmare': 'shattered_cliffs',
};

/** Reverse lookup: every Underling name -> the Boss it belongs to (used to
 *  pull the whole trio into one encounter no matter which of the 3 you touch first). */
export const UNDERLING_TO_BOSS: Record<string, string> = {};
Object.entries(BOSS_UNDERLINGS).forEach(([boss, [a, b]]) => { UNDERLING_TO_BOSS[a] = boss; UNDERLING_TO_BOSS[b] = boss; });

/** Icons keyed by Role — monster names deliberately reveal nothing about
 *  Role/Element (see README), so this is presentation-only, not derived from name. */
const ROLE_ICON: Record<MonsterRosterEntry['role'], string> = {
  'Tank': '🛡️', 'Tactician': '🧠', 'Healer': '💚', 'Damager': '⚔️', 'Assassin': '🗡️',
  'AoE Controller': '🌀', 'AoE Damager': '💥', 'Dodger': '🍃', 'Burst': '💢', 'Accuracy': '🎯',
};

/** Early-hub zones stay welcoming to a fresh party — any monster at or
 *  below this level never chases/attacks first, regardless of what its raw
 *  Tier/Role entry above says, overriding it here rather than hand-editing
 *  every low-level `R(...)` row. Species assigned to a map are ordered by
 *  ascending Level (see constants/maps.ts), so Level is already the game's
 *  own proxy for "how close to the hub" — no separate per-map field needed.
 *  Juvenile (population Level+0) is already non-aggressive by design below;
 *  this catches everything else that can still land this low (low-Level
 *  Elites/wild Mini-Bosses, and the Adult variant of the very first zones'
 *  species) so a brand-new character never gets jumped on their first steps out. */
const EARLY_MAP_NON_AGGRO_LEVEL_CAP = 8;

/** `MONSTER_META` for the map/movement layer (icon/size/aggro), built from the roster. */
export const MONSTER_META: Record<string, MonsterMeta> = {};
MONSTER_ROSTER.forEach((m) => {
  const aggressive = m.level <= EARLY_MAP_NON_AGGRO_LEVEL_CAP ? false : m.aggressive;
  MONSTER_META[m.name] = { el: m.element, tier: m.tier, icon: ROLE_ICON[m.role], size: 1, aggressive };
});

/** Bestiary flavor text (Lore) per species — presentation-only, keyed by the
 *  roster's base name (Population-pyramid suffixes like " (Adult)" share
 *  their Juvenile's entry, resolved by whatever future bestiary UI strips
 *  the suffix the same way `lootIdForMonster` already does in monsterLoot.ts). */
export const MONSTER_LORE: Record<string, string> = {
  'Puffleaf': 'A tiny forest spirit that gathers fallen leaves into fluffy nests. It runs from danger but fiercely protects its home.',
  'Momoon': 'A round creature that glows softly beneath the moonlight. Travelers believe its light brings peaceful dreams.',
  'Bramblet': 'Born inside thorny bushes, Bramblets hide until disturbed. Their vines surprise careless adventurers.',
  'Nibble': 'Always searching for berries and mushrooms. Its tiny bites are more annoying than painful.',
  'Fuzzle': 'A fuzzy woodland creature with endless curiosity. It follows strangers hoping for food.',
  'Doodle': 'This playful spirit leaves mysterious drawings wherever it wanders. Villagers see them as lucky signs.',
  'Pibbit': 'A cheerful swamp hopper that sings before rainfall. Its voice echoes across marshes.',
  'Snuffle': 'Using its powerful nose it uncovers hidden roots. It becomes angry when its meal is stolen.',
  'Glimble': 'Tiny sparks dance around its body. Many mistake it for a floating lantern.',
  'Tumbley': 'It rolls across grassy hills faster than it walks. It rarely notices where it ends up.',
  'Mossy': 'Its body is covered in soft moss. Small birds mistake it for a rock.',
  'Pebloo': 'Pebloo hides among river stones. It is surprisingly strong for its size.',
  'Fizzlepuff': 'It releases harmless sparkling dust when frightened. Children love watching it bounce.',
  'Wiggleaf': 'Leaves sway around it even without wind. It dances at sunrise.',
  'Dewlet': 'Morning dew gathers on its fur. Farmers believe it brings healthy crops.',
  'Bubblee': 'Bubblee creates floating bubbles that drift for hours. Some carry glowing spores.',
  'Swoonie': 'Its sleepy eyes rarely stay open. It reacts instantly to danger.',
  'Pollen': 'Covered in golden pollen, it helps flowers bloom. Bees follow it everywhere.',
  'Flutteroo': 'Its tiny wings flutter endlessly. It enjoys chasing butterflies.',
  'Rumblet': 'Small tremors follow each heavy step. Its growl is louder than expected.',
  'Nori': 'A gentle river creature that swims gracefully. It dislikes polluted waters.',
  'Belloo': 'Its cry resembles distant bells. Temples consider it sacred.',
  'Puffin': 'A cloud-like beast that floats through mist. Storms are its favorite weather.',
  'Suri': 'Quick and clever, it steals fruit from travelers. It always escapes.',
  'Flurry': 'Snowflakes gather around Flurry. It slides across frozen ponds.',
  'Thimble': 'A tiny guardian of abandoned cottages. It challenges foes much larger than itself.',
  'Berri': 'Its colorful fur resembles ripe berries. Predators often mistake it for food.',
  'Bristle': 'Sharp fur covers its back. It curls into a ball when threatened.',
  'Gloomie': 'Though it looks sad, it is harmless. Flowers bloom where it rests.',
  'Cinderoo': 'Born from warm ashes after forest fires. It symbolizes new beginnings.',
  'Fernie': 'Fernie hides among tall ferns. Its leafy tail changes with the seasons.',
  'Willowee': 'This gentle spirit lives beneath willow trees. It hums before rain.',
  'Mallow': 'Its body feels as soft as cotton. Many creatures sleep beside it.',
  'Ripple': 'Ripple swims so quickly only circles remain. Fishermen rarely glimpse it.',
  'Dandel': 'When frightened it releases fluffy seeds. Each seed becomes a tiny spirit.',
  'Bloomie': 'Bloomie wakes flowers with cheerful songs. Meadows brighten after it passes.',
  'Breelee': 'A playful breeze follows it. Fallen leaves dance around its feet.',
  'Taffy': 'Sticky vines cling to its body. Curious creatures become trapped.',
  'Cloveroo': 'Said to bring luck, it appears only to kind travelers. Greedy hunters never find one.',
  'Mireling': 'A young swamp spirit that watches marshlands. It vanishes beneath the mud.',
  'Ironmane': 'Ironmane is a legendary elite bound to the power of Earth. Its presence alone changes the battlefield and has become the subject of countless legends.',
  'Dreadhorn': 'Dreadhorn is a legendary elite bound to the power of Earth. Its presence alone changes the battlefield and has become the subject of countless legends.',
  'Emberhide': 'Emberhide is a legendary elite bound to the power of Fire. Its presence alone changes the battlefield and has become the subject of countless legends.',
  'Hollowfang': 'Hollowfang is a legendary elite bound to the power of Wind. Its presence alone changes the battlefield and has become the subject of countless legends.',
  'Stormhide': 'Stormhide is a legendary elite bound to the power of Wind. Its presence alone changes the battlefield and has become the subject of countless legends.',
  'Ashwarden': 'Ashwarden is a legendary elite bound to the power of Fire. Its presence alone changes the battlefield and has become the subject of countless legends.',
  'Grimtail': 'Grimtail is a legendary elite bound to the power of Earth. Its presence alone changes the battlefield and has become the subject of countless legends.',
  'Thornhide': 'Thornhide is a legendary elite bound to the power of Earth. Its presence alone changes the battlefield and has become the subject of countless legends.',
  'Mirelord': 'Mirelord is a legendary elite bound to the power of Water. Its presence alone changes the battlefield and has become the subject of countless legends.',
  'Brimhide': 'Brimhide is a legendary elite bound to the power of Fire. Its presence alone changes the battlefield and has become the subject of countless legends.',
  'Soulmaw': 'Soulmaw is a legendary elite bound to the power of Water. Its presence alone changes the battlefield and has become the subject of countless legends.',
  'Nighthorn': 'Nighthorn is a legendary elite bound to the power of Wind. Its presence alone changes the battlefield and has become the subject of countless legends.',
  'Irontide': 'Irontide is a legendary elite bound to the power of Water. Its presence alone changes the battlefield and has become the subject of countless legends.',
  'Flamehide': 'Flamehide is a legendary elite bound to the power of Fire. Its presence alone changes the battlefield and has become the subject of countless legends.',
  'Hollowmane': 'Hollowmane is a legendary elite bound to the power of Wind. Its presence alone changes the battlefield and has become the subject of countless legends.',
  'Shadecaller': 'Shadecaller is a legendary elite bound to the power of Wind. Its presence alone changes the battlefield and has become the subject of countless legends.',
  'Briarlord': 'Briarlord is a legendary elite bound to the power of Earth. Its presence alone changes the battlefield and has become the subject of countless legends.',
  'Duskhowler': 'Duskhowler is a legendary elite bound to the power of Wind. Its presence alone changes the battlefield and has become the subject of countless legends.',
  'Gloomhide': 'Gloomhide is a legendary elite bound to the power of Water. Its presence alone changes the battlefield and has become the subject of countless legends.',
  'Tidewarden': 'Tidewarden is a legendary elite bound to the power of Water. Its presence alone changes the battlefield and has become the subject of countless legends.',
  'Fellhorn': 'Fellhorn is a legendary elite bound to the power of Earth. Its presence alone changes the battlefield and has become the subject of countless legends.',
  'Stormcaller': 'Stormcaller is a legendary elite bound to the power of Wind. Its presence alone changes the battlefield and has become the subject of countless legends.',
  'Moltenmane': 'Moltenmane is a legendary elite bound to the power of Fire. Its presence alone changes the battlefield and has become the subject of countless legends.',
  'Moonstalker': 'Moonstalker is a legendary elite bound to the power of Wind. Its presence alone changes the battlefield and has become the subject of countless legends.',
  'Briarfang': 'Briarfang is a legendary elite bound to the power of Earth. Its presence alone changes the battlefield and has become the subject of countless legends.',
  'Wildmaw': 'Wildmaw is a legendary elite bound to the power of Fire. Its presence alone changes the battlefield and has become the subject of countless legends.',
  'Silentclaw': 'Silentclaw is a legendary elite bound to the power of Wind. Its presence alone changes the battlefield and has become the subject of countless legends.',
  'Stonehide': 'Stonehide is a legendary elite bound to the power of Earth. Its presence alone changes the battlefield and has become the subject of countless legends.',
  'Mirehowler': 'Mirehowler is a legendary elite bound to the power of Water. Its presence alone changes the battlefield and has become the subject of countless legends.',
  'Eldermaw': 'Eldermaw is a legendary elite bound to the power of Earth. Its presence alone changes the battlefield and has become the subject of countless legends.',
  'Elder Briar': 'Elder Briar is a legendary mini boss bound to the power of Earth. Its presence alone changes the battlefield and has become the subject of countless legends.',
  'Hollow Baron': 'Hollow Baron is a legendary mini boss bound to the power of Wind. Its presence alone changes the battlefield and has become the subject of countless legends.',
  'Ember Regent': 'Ember Regent is a legendary mini boss bound to the power of Fire. Its presence alone changes the battlefield and has become the subject of countless legends.',
  'Storm Herald': 'Storm Herald is a legendary mini boss bound to the power of Wind. Its presence alone changes the battlefield and has become the subject of countless legends.',
  'Moon Reaper': 'Moon Reaper is a legendary mini boss bound to the power of Water. Its presence alone changes the battlefield and has become the subject of countless legends.',
  'Tide Tyrant': 'Tide Tyrant is a legendary mini boss bound to the power of Water. Its presence alone changes the battlefield and has become the subject of countless legends.',
  'Iron Sentinel': 'Iron Sentinel is a legendary mini boss bound to the power of Earth. Its presence alone changes the battlefield and has become the subject of countless legends.',
  'Gloom Warden': 'Gloom Warden is a legendary mini boss bound to the power of Water. Its presence alone changes the battlefield and has become the subject of countless legends.',
  'Ash Monarch': 'Ash Monarch is a legendary mini boss bound to the power of Fire. Its presence alone changes the battlefield and has become the subject of countless legends.',
  'Soul Harbinger': 'Soul Harbinger is a legendary mini boss bound to the power of Wind. Its presence alone changes the battlefield and has become the subject of countless legends.',
  'Aurelion': 'Aurelion is a legendary boss bound to the power of Wind. Its presence alone changes the battlefield and has become the subject of countless legends.',
  'Morvain': 'Morvain is a legendary boss bound to the power of Fire. Its presence alone changes the battlefield and has become the subject of countless legends.',
  'Seraphel': 'Seraphel is a legendary boss bound to the power of Wind. Its presence alone changes the battlefield and has become the subject of countless legends.',
  'Dreadmare': 'Dreadmare is a legendary boss bound to the power of Earth. Its presence alone changes the battlefield and has become the subject of countless legends.',
  'Umbriel': 'Umbriel is a legendary boss bound to the power of Water. Its presence alone changes the battlefield and has become the subject of countless legends.',
  'Volaris': 'Volaris is a legendary boss bound to the power of Wind. Its presence alone changes the battlefield and has become the subject of countless legends.',
  'Nethriel': 'Nethriel is a legendary boss bound to the power of Water. Its presence alone changes the battlefield and has become the subject of countless legends.',
  'Eldrune': 'Eldrune is a legendary boss bound to the power of Earth. Its presence alone changes the battlefield and has become the subject of countless legends.',
  'Solmare': 'Solmare is a legendary boss bound to the power of Fire. Its presence alone changes the battlefield and has become the subject of countless legends.',
};

/**
 * Population-pyramid point-pool multiplier — folds into `computeMonsterStats`
 * the same way Tier does, scaling hp/dmg/speed/dodge/crit/acc together
 * rather than hp/dmg alone. Juvenile (no suffix) gets none, staying exactly
 * as easy as a Regular-tier monster's base formula intends — Regular tier
 * itself (`TIER_PROFILES.regular`) has `pointMult: 1`, zero compensation for
 * a solo monster's "one action/round vs a full 3-mage party" disadvantage,
 * the same gap that made Elite/Mini-Boss a curbstomp before those were
 * tuned. Adult ("the normal fight," per the Population Pyramid doc) gets a
 * strong bump; Elder ("a rare, real threat") gets pushed further still.
 * Verified via headless battle-engine simulation against a fresh Lv1 party.
 */
const POPULATION_POINT_MULT: Record<string, number> = {
  ' (Adult)': 3,
  ' (Elder)': 4.2,
};

/** Boss Underlings share the roster's `tier: 'miniboss'` field (for
 *  respawn/XP bucketing) but never fight solo — they're always one of 3 in
 *  a Boss's 3v3, not a lone monster against the player's full party, so
 *  they don't need Mini-Boss's full solo-compensation multiplier. Overridden
 *  down to roughly Elite's — still a real contributor to the fight, without
 *  inheriting a boost sized for a fight they're never actually in. */
const BOSS_UNDERLING_POINT_MULT = 1.8;

/** Live-computed battle stats for a roster entry — see `computeMonsterStats`. */
export function statsFor(entry: MonsterRosterEntry) {
  const suffix = entry.name.endsWith(' (Adult)') ? ' (Adult)' : entry.name.endsWith(' (Elder)') ? ' (Elder)' : '';
  const pointMultExtra = POPULATION_POINT_MULT[suffix] ?? 1;
  const tierPointMultOverride = entry.subtype === 'Boss Underling' ? BOSS_UNDERLING_POINT_MULT : undefined;
  return computeMonsterStats(entry.role, entry.level, entry.tier, entry.element, pointMultExtra, tierPointMultOverride, entry.elementLevel);
}
