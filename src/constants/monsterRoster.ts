import type { MonsterMeta, MonsterRosterEntry } from '@/types';
import { computeMonsterStats } from './monsterFormulas';

/**
 * Aetheria Monster Database — Monster Roster sheet, 90 entries (78 field +
 * 12 Boss Underlings), ported as raw 5-7 field entries. Final stats stay
 * computed via `computeMonsterStats` (never baked), same "shortened coding"
 * philosophy as the source workbook: retune one Role/Tier multiplier and
 * every monster using it updates automatically.
 */
const R = (name: string, role: MonsterRosterEntry['role'], element: MonsterRosterEntry['element'], level: number, tier: MonsterRosterEntry['tier'], subtype: MonsterRosterEntry['subtype'], aggressive: boolean): MonsterRosterEntry => ({ name, role, element, level, tier, subtype, aggressive });

const MONSTER_ROSTER_RAW: MonsterRosterEntry[] = [
  // ---- Regular (45) ----
  R('Skarn', 'Tank', 'fire', 1, 'regular', 'Field', true),
  R('Volthak', 'Tactician', 'water', 2, 'regular', 'Field', true),
  R('Nimbrel', 'Healer', 'earth', 4, 'regular', 'Field', true),
  R('Quorash', 'Damager', 'wind', 5, 'regular', 'Field', true),
  R('Talvex', 'Assassin', 'fire', 6, 'regular', 'Field', true),
  R('Brindlox', 'AoE Controller', 'water', 8, 'regular', 'Field', true),
  R('Skitterhorn', 'AoE Damager', 'earth', 9, 'regular', 'Field', true),
  R('Muvrik', 'Dodger', 'wind', 10, 'regular', 'Field', true),
  R('Corvane', 'Burst', 'fire', 12, 'regular', 'Field', true),
  R('Ezrith', 'Accuracy', 'water', 13, 'regular', 'Field', true),
  R('Dravok', 'Tank', 'earth', 14, 'regular', 'Field', true),
  R('Quennith', 'Tactician', 'wind', 16, 'regular', 'Field', true),
  R('Obrali', 'Healer', 'fire', 17, 'regular', 'Field', true),
  R('Tesskin', 'Damager', 'water', 18, 'regular', 'Field', true),
  R('Ulrath', 'Assassin', 'earth', 20, 'regular', 'Field', true),
  R('Bexil', 'AoE Controller', 'wind', 21, 'regular', 'Field', true),
  R('Nythra', 'AoE Damager', 'fire', 22, 'regular', 'Field', true),
  R('Velkor', 'Dodger', 'water', 24, 'regular', 'Field', true),
  R('Krendel', 'Burst', 'earth', 25, 'regular', 'Field', true),
  R('Ombrise', 'Accuracy', 'wind', 26, 'regular', 'Field', true),
  R('Vastrum', 'Tank', 'fire', 28, 'regular', 'Field', true),
  R('Ganthil', 'Tactician', 'water', 29, 'regular', 'Field', true),
  R('Sullex', 'Healer', 'earth', 30, 'regular', 'Field', true),
  R('Praxil', 'Damager', 'wind', 32, 'regular', 'Field', true),
  R('Dovina', 'Assassin', 'fire', 33, 'regular', 'Field', true),
  R('Wrenak', 'AoE Controller', 'water', 35, 'regular', 'Field', true),
  R('Grixom', 'AoE Damager', 'earth', 36, 'regular', 'Field', true),
  R('Nezrath', 'Dodger', 'wind', 37, 'regular', 'Field', true),
  R('Klevar', 'Burst', 'fire', 39, 'regular', 'Field', true),
  R('Fennik', 'Accuracy', 'water', 40, 'regular', 'Field', true),
  R('Brakka', 'Tank', 'earth', 41, 'regular', 'Field', true),
  R('Ismera', 'Tactician', 'wind', 43, 'regular', 'Field', true),
  R('Colgath', 'Healer', 'fire', 44, 'regular', 'Field', true),
  R('Skorne', 'Damager', 'water', 45, 'regular', 'Field', true),
  R('Quixil', 'Assassin', 'earth', 47, 'regular', 'Field', true),
  R('Marrowick', 'AoE Controller', 'wind', 48, 'regular', 'Field', true),
  R('Dursken', 'AoE Damager', 'fire', 49, 'regular', 'Field', true),
  R('Elmirash', 'Dodger', 'water', 51, 'regular', 'Field', true),
  R('Grivane', 'Burst', 'earth', 52, 'regular', 'Field', true),
  R('Sarnoth', 'Accuracy', 'wind', 53, 'regular', 'Field', true),
  R('Yulkin', 'Tank', 'fire', 55, 'regular', 'Field', true),
  R('Tirune', 'Tactician', 'water', 56, 'regular', 'Field', true),
  R('Vaspek', 'Healer', 'earth', 57, 'regular', 'Field', true),
  R('Ondrek', 'Damager', 'wind', 59, 'regular', 'Field', true),
  R('Malvous', 'Assassin', 'fire', 60, 'regular', 'Field', true),

  // ---- Elite (12) ----
  R('Drathmoor', 'Damager', 'water', 15, 'elite', 'Field', true),
  R('Sarkothian', 'Assassin', 'earth', 20, 'elite', 'Field', true),
  R('Wyrmendal', 'AoE Controller', 'wind', 25, 'elite', 'Field', true),
  R('Glomerath', 'AoE Damager', 'fire', 30, 'elite', 'Field', true),
  R('Kelvorash', 'Dodger', 'water', 35, 'elite', 'Field', true),
  R('Ruskavane', 'Burst', 'earth', 40, 'elite', 'Field', true),
  R('Ithendra', 'Accuracy', 'wind', 45, 'elite', 'Field', true),
  R('Marnoxis', 'Tank', 'fire', 50, 'elite', 'Field', true),
  R('Vellithar', 'Tactician', 'water', 55, 'elite', 'Field', true),
  R('Ograthine', 'Healer', 'earth', 60, 'elite', 'Field', true),
  R('Fenrivask', 'Damager', 'wind', 65, 'elite', 'Field', true),
  R('Zamorune', 'Assassin', 'fire', 70, 'elite', 'Field', true),

  // ---- Mini-Boss, wild field (15) ----
  R('Xantherion', 'AoE Damager', 'earth', 25, 'miniboss', 'Field', false),
  R('Brivelash', 'Dodger', 'wind', 29, 'miniboss', 'Field', false),
  R('Ozmundir', 'Burst', 'fire', 33, 'miniboss', 'Field', false),
  R('Talrikoss', 'Accuracy', 'water', 37, 'miniboss', 'Field', false),
  R('Nessarow', 'Tank', 'earth', 41, 'miniboss', 'Field', false),
  R('Grethane', 'Tactician', 'wind', 45, 'miniboss', 'Field', false),
  R('Ulspire', 'Healer', 'fire', 49, 'miniboss', 'Field', false),
  R('Vokrath', 'Damager', 'water', 52, 'miniboss', 'Field', false),
  R('Idrissar', 'Assassin', 'earth', 56, 'miniboss', 'Field', false),
  R('Combrenus', 'AoE Controller', 'wind', 60, 'miniboss', 'Field', false),
  R('Altherion', 'AoE Damager', 'fire', 64, 'miniboss', 'Field', false),
  R('Prendilax', 'Dodger', 'water', 68, 'miniboss', 'Field', false),
  R('Baskrillon', 'Burst', 'earth', 72, 'miniboss', 'Field', false),
  R('Menrathis', 'Accuracy', 'wind', 76, 'miniboss', 'Field', true),
  R('Coivanor', 'Tank', 'fire', 80, 'miniboss', 'Field', true),

  // ---- Boss (6) ----
  R('Ulvarion, the Hollow Crown', 'Accuracy', 'earth', 40, 'boss', 'Field', false),
  R('Nyssandra, the Quiet Reign', 'Tank', 'wind', 48, 'boss', 'Field', false),
  R('Korrigahn, the Endless Debt', 'Tactician', 'earth', 56, 'boss', 'Field', false),
  R('Thessaline, the Last Vigil', 'Healer', 'water', 64, 'boss', 'Field', false),
  R('Duskrend, the Marrowking', 'Damager', 'fire', 72, 'boss', 'Field', false),
  R('Velkhazor, the Unmaking', 'Assassin', 'fire', 80, 'boss', 'Field', false),

  // ---- Boss Underlings (12) — Tactician role, spawn only alongside their Boss ----
  R('Morvathine', 'Tactician', 'earth', 28, 'miniboss', 'Boss Underling', false),
  R('Kestrallon', 'Tactician', 'fire', 34, 'miniboss', 'Boss Underling', false),
  R('Ilvanor', 'Tactician', 'wind', 36, 'miniboss', 'Boss Underling', false),
  R('Threnvax', 'Tactician', 'earth', 42, 'miniboss', 'Boss Underling', false),
  R('Ondrathis', 'Tactician', 'earth', 44, 'miniboss', 'Boss Underling', false),
  R('Vaskelume', 'Tactician', 'fire', 50, 'miniboss', 'Boss Underling', false),
  R('Corvaleth', 'Tactician', 'water', 52, 'miniboss', 'Boss Underling', false),
  R('Sethrune', 'Tactician', 'wind', 58, 'miniboss', 'Boss Underling', false),
  R('Draumond', 'Tactician', 'fire', 60, 'miniboss', 'Boss Underling', false),
  R('Ythrengal', 'Tactician', 'water', 66, 'miniboss', 'Boss Underling', false),
  R('Marendil', 'Tactician', 'fire', 68, 'miniboss', 'Boss Underling', false),
  R('Coswraith', 'Tactician', 'water', 74, 'miniboss', 'Boss Underling', false),
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

/** Each Boss's 2 unique Tactician-role escorts — Underling A shares the
 *  Boss's element, Underling B is the element that BEATS the Boss (so every
 *  Boss fight has real elemental variety, never a mono-element sweep). Boss
 *  encounter composition is always exactly these 3, matching the player's 3v3. */
export const BOSS_UNDERLINGS: Record<string, [string, string]> = {
  'Ulvarion, the Hollow Crown': ['Morvathine', 'Kestrallon'],
  'Nyssandra, the Quiet Reign': ['Ilvanor', 'Threnvax'],
  'Korrigahn, the Endless Debt': ['Ondrathis', 'Vaskelume'],
  'Thessaline, the Last Vigil': ['Corvaleth', 'Sethrune'],
  'Duskrend, the Marrowking': ['Draumond', 'Ythrengal'],
  'Velkhazor, the Unmaking': ['Marendil', 'Coswraith'],
};

/** Each Boss's home landmark on the Aetheria map (see constants/maps.ts placement). */
export const BOSS_LANDMARKS: Record<string, string> = {
  'Ulvarion, the Hollow Crown': 'ruins_of_eldoria',
  'Nyssandra, the Quiet Reign': 'tempest',
  'Korrigahn, the Endless Debt': 'obsidian_ravine',
  'Thessaline, the Last Vigil': 'mistvale_mountain_peak',
  'Duskrend, the Marrowking': 'ancient_dragon_spine_nest',
  'Velkhazor, the Unmaking': 'verdant_volcano',
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

/** `MONSTER_META` for the map/movement layer (icon/size/aggro), built from the roster. */
export const MONSTER_META: Record<string, MonsterMeta> = {};
MONSTER_ROSTER.forEach((m) => {
  MONSTER_META[m.name] = { el: m.element, tier: m.tier, icon: ROLE_ICON[m.role], size: 1, aggressive: m.aggressive };
});

/**
 * Adult/Elder-only stat bonus, applied on top of the normal Regular-tier
 * formula — Juvenile (no suffix) gets none, staying exactly as easy as the
 * base curve intends. Regular tier itself (`TIER_PROFILES.regular`) is
 * `hpMult: 1, dmgMult: 1` — zero compensation for a solo monster's basic
 * "one action/round vs a full 3-mage party" disadvantage, the same gap that
 * made Elite/Mini-Boss a curbstomp before those got tuned. Adult ("the
 * normal fight," per the Population Pyramid doc) gets a moderate bump;
 * Elder ("a rare, real threat") gets roughly Elite-tier toughness. Verified
 * via headless battle-engine simulation against a fresh Lv1 party, same
 * method used for the Elite/Mini-Boss tier calibration.
 */
const POPULATION_STAT_BONUS: Record<string, { hpMult: number; dmgMult: number }> = {
  ' (Adult)': { hpMult: 1.6, dmgMult: 1.3 },
  ' (Elder)': { hpMult: 2.8, dmgMult: 1.7 },
};

/** Live-computed battle stats for a roster entry — see `computeMonsterStats`. */
export function statsFor(entry: MonsterRosterEntry) {
  const base = computeMonsterStats(entry.role, entry.level, entry.tier);
  const suffix = entry.name.endsWith(' (Adult)') ? ' (Adult)' : entry.name.endsWith(' (Elder)') ? ' (Elder)' : '';
  const bonus = POPULATION_STAT_BONUS[suffix];
  if (!bonus) return base;
  return { ...base, hp: Math.round(base.hp * bonus.hpMult), dmg: Math.round(base.dmg * bonus.dmgMult) };
}
