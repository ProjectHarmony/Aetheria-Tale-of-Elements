import type { Element, GearSlot, ItemDef, ItemRarity, ItemStatBonus, MonsterRole, MonsterTier } from '@/types';
import { ELEMENTS_ALL } from './elements';
import { ROLE_STAT_WEIGHTS } from './monsterFormulas';
import { MONSTER_ROSTER_RAW } from './monsterRoster';

/**
 * Monster-dropped Equipment + Cards — the "best part of the game" rare-drop
 * layer. Every one of the roster's 90 species drops its own unique
 * Equipment piece AND its own unique Card; the 6 Bosses additionally drop a
 * second, far rarer "Crimson Card". Everything here is formula-driven from
 * the roster's own Role/Level/Tier (same philosophy as monsterLoot.ts and
 * the monster stat system itself) rather than hand-authored per monster —
 * at 90+ items, consistency matters more than bespoke flavor, and reusing
 * ROLE_STAT_WEIGHTS keeps a monster's gear feel like an extension of how it
 * already fights.
 *
 * Rarity ladder mirrors monster Tier: Common (regular) / Uncommon (elite) /
 * Rare (miniboss) / Epic (boss) / Legendary (a Boss's Crimson Card only).
 * Higher tiers get a bigger stat-point budget (see TIER_EQUIP_MULT/
 * TIER_CARD_MULT) — deliberately "slightly off-balance" if you get lucky,
 * per the design brief.
 *
 * Equipment drops UNIDENTIFIED (see `identified`/`identifiesInto` on
 * ItemDef) — an Identify Scroll (constants/items.ts) reveals it, which is
 * where a piece's elemental resistance roll (or a Wand's element-damage%
 * roll) is "found out." Item Level is shown everywhere but no longer gates
 * equipping (see the old `reqLevel` — now purely informational `itemLevel`).
 */

const ROLE_TO_SLOT: Record<MonsterRole, GearSlot> = {
  Tactician: 'head',
  Accuracy: 'head',
  Tank: 'robe',
  'AoE Controller': 'robe',
  Healer: 'cape',
  Dodger: 'cape',
  Damager: 'weapon',
  'AoE Damager': 'weapon',
  Assassin: 'acc1',
  Burst: 'acc2',
};

const SLOT_FLAVOR: Record<GearSlot, string> = {
  head: 'Warhood',
  robe: 'Vestments',
  cape: 'Mantle',
  weapon: 'Wand',
  acc1: 'Charm',
  acc2: 'Talisman',
};

const SLOT_ICON: Record<GearSlot, string> = {
  head: '🎓',
  robe: '🥋',
  cape: '🦺',
  weapon: '🪄',
  acc1: '💠',
  acc2: '📿',
};

const ELEMENT_ICON: Record<Element, string> = { fire: '🔥', water: '🌊', earth: '🌱', wind: '🌪️' };

const TIER_RARITY: Record<MonsterTier, ItemRarity> = { regular: 'common', elite: 'uncommon', miniboss: 'rare', boss: 'epic' };
export const RARITY_LABEL: Record<ItemRarity, string> = { common: 'Common', uncommon: 'Uncommon', rare: 'Rare', epic: 'Epic', legendary: 'Legendary' };
/** Standard MMO rarity color ladder, shared by every item-inspection UI (GearSlotSheet/CardSocketSheet/ItemDetailModal). */
export const RARITY_COLOR: Record<ItemRarity, string> = {
  common: '#c9c3d6',
  uncommon: '#7ee88c',
  rare: '#6db4ff',
  epic: '#c98bff',
  legendary: '#ff6b6b',
};

/** Stat-point budget multipliers, on top of a level-scaled base — bigger for
 *  Equipment than Cards (a full gear piece vs. one socketed supplement),
 *  and increasing with Tier so rarer drops read as meaningfully stronger,
 *  not just re-skinned. */
const TIER_EQUIP_MULT: Record<MonsterTier, number> = { regular: 1, elite: 1.6, miniboss: 2.4, boss: 3.4 };
const TIER_CARD_MULT: Record<MonsterTier, number> = { regular: 1, elite: 1.5, miniboss: 2.2, boss: 3.2 };
/** Crimson Cards (Boss-only, second drop) hit noticeably harder than the Boss's own normal Card. */
const CRIMSON_MULT = 2.2;

/** Element-skill rank bonus by Tier — replaces the old element-agnostic
 *  `bonusSkillRanks`: +1/+2/+3 rank to every skill of ONE element (the
 *  dropping monster's own) the mage has already invested in, capped at that
 *  skill's own max rank. Regular gear carries none — this is a rare-drop
 *  "off-balance" perk, not a baseline stat. */
const ELEMENT_SKILL_RANK_BONUS: Partial<Record<MonsterTier, number>> = { elite: 1, miniboss: 2, boss: 3 };

/** How many independent elemental-resistance rolls an Equipment piece gets,
 *  by Tier — each roll independently picks any of the 4 elements (repeats
 *  allowed, stacking that element's resist higher) and a level-scaled
 *  magnitude. Capped at 3 total per the design brief. Wands roll a single
 *  element-damage% instead (see `wandRoll` below), never resistance. */
const RESIST_ROLLS: Record<MonsterTier, number> = { regular: 1, elite: 2, miniboss: 2, boss: 3 };
const RESIST_PCT_PER_ROLL_CAP = 0.15;

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

/** Deterministic pseudo-random fraction in [0, 1) from a string seed — same
 *  avalanche-mixing approach as maps.ts's seededUnit, so each monster's
 *  socket-count/resistance/wand rolls are stable across reloads/deploys
 *  instead of actually re-rolling (these are catalog item DEFINITIONS, not
 *  per-drop instance RNG — see ItemDef.identified's doc comment). */
function seededFraction(seed: string): number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
}

type StatWeights = Record<keyof ItemStatBonus, number>;

/** Splits `budget` across every stat per the role's weights (rounded, zeros dropped) — used for Equipment, which reads as a rounded-out piece of gear. */
function distributeAll(budget: number, weights: StatWeights): ItemStatBonus {
  const bonus: ItemStatBonus = {};
  (Object.keys(weights) as (keyof ItemStatBonus)[]).forEach((k) => {
    const share = Math.round(budget * weights[k]!);
    if (share > 0) bonus[k] = share;
  });
  return bonus;
}

/** Puts the WHOLE budget on just the role's top `n` stats (renormalized) —
 *  used for Cards, which read as a single punchy stat (Ragnarok-style)
 *  rather than a diffuse full-gear spread. */
function distributeTop(budget: number, weights: StatWeights, n: number): ItemStatBonus {
  const entries = (Object.keys(weights) as (keyof ItemStatBonus)[])
    .map((k) => [k, weights[k]!] as const)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);
  const total = entries.reduce((sum, [, w]) => sum + w, 0) || 1;
  const bonus: ItemStatBonus = {};
  entries.forEach(([k, w], i) => {
    const share = i === entries.length - 1
      ? budget - entries.slice(0, -1).reduce((sum, [k2]) => sum + (bonus[k2] ?? 0), 0)
      : Math.round(budget * (w / total));
    if (share > 0) bonus[k] = share;
  });
  return bonus;
}

/** Rolls up to `RESIST_ROLLS[tier]` independent elemental-resistance picks
 *  (repeats stack), each magnitude scaled by level and capped per-roll. */
function rollElementResist(seedBase: string, tier: MonsterTier, level: number): Partial<Record<Element, number>> {
  const resist: Partial<Record<Element, number>> = {};
  const rolls = RESIST_ROLLS[tier];
  for (let i = 0; i < rolls; i++) {
    const el = ELEMENTS_ALL[Math.floor(seededFraction(`${seedBase}::resist-el-${i}`) * ELEMENTS_ALL.length)]!;
    const pct = Math.min(RESIST_PCT_PER_ROLL_CAP, 0.03 + level * 0.0015 + seededFraction(`${seedBase}::resist-pct-${i}`) * 0.05);
    resist[el] = Math.round(((resist[el] ?? 0) + pct) * 1000) / 1000;
  }
  return resist;
}

/** A Wand's single element-damage% roll — random which element (so it can
 *  land on the mage's own element for a jackpot, or a mismatched dud),
 *  magnitude scaled by tier/level but kept in a modest, balanced band. */
function rollWandElementDmg(seedBase: string, tier: MonsterTier, level: number): { el: Element; pct: number } {
  const el = ELEMENTS_ALL[Math.floor(seededFraction(`${seedBase}::wand-el`) * ELEMENTS_ALL.length)]!;
  const base = { regular: 0.06, elite: 0.09, miniboss: 0.13, boss: 0.18 }[tier];
  const pct = Math.round((base + level * 0.001 + seededFraction(`${seedBase}::wand-pct`) * 0.03) * 1000) / 1000;
  return { el, pct };
}

export const MONSTER_EQUIPMENT_ITEMS: Record<string, ItemDef> = {};
/** The "Unidentified <slot>" placeholder each equipment piece actually drops
 *  as — see ItemDef.identified/identifiesInto and gameStore.identifyItem. */
export const MONSTER_UNID_EQUIPMENT_ITEMS: Record<string, ItemDef> = {};
export const MONSTER_CARD_ITEMS: Record<string, ItemDef> = {};
export const MONSTER_CRIMSON_ITEMS: Record<string, ItemDef> = {};

/** Species display name -> its dropped item id (population variants and Boss Underlings resolve to their base species, same convention as monsterLoot.ts). */
export const EQUIPMENT_ID_BY_SPECIES: Record<string, string> = {};
/** Species display name -> the UNIDENTIFIED item id it actually drops (see rollMonsterEquipmentDrops). */
export const UNID_EQUIPMENT_ID_BY_SPECIES: Record<string, string> = {};
export const CARD_ID_BY_SPECIES: Record<string, string> = {};
export const CRIMSON_ID_BY_SPECIES: Record<string, string> = {};

// Accessory set-pairing: Assassin-role monsters drop acc1 ("Charm"), Burst-
// role monsters drop acc2 ("Talisman") — zipped 1:1 in roster order into
// matched pairs so "wear both together" has a real partner to look for.
// Any left over (uneven Assassin/Burst counts) just stays a standalone
// accessory with no combo bonus, which is fine.
const assassinEntries = MONSTER_ROSTER_RAW.filter((m) => m.role === 'Assassin');
const burstEntries = MONSTER_ROSTER_RAW.filter((m) => m.role === 'Burst');
const setIdByMonsterName: Record<string, string> = {};
const setPartnerNameByMonsterName: Record<string, string> = {};
for (let i = 0; i < Math.min(assassinEntries.length, burstEntries.length); i++) {
  const a = assassinEntries[i]!;
  const b = burstEntries[i]!;
  const setId = `set_${slug(a.name)}_${slug(b.name)}`;
  setIdByMonsterName[a.name] = setId;
  setIdByMonsterName[b.name] = setId;
  setPartnerNameByMonsterName[a.name] = b.name;
  setPartnerNameByMonsterName[b.name] = a.name;
}

MONSTER_ROSTER_RAW.forEach((entry) => {
  const weights = ROLE_STAT_WEIGHTS[entry.role];
  const rarity = TIER_RARITY[entry.tier];
  const idSlug = slug(entry.name);

  // ---- Equipment ----
  const slot = ROLE_TO_SLOT[entry.role];
  const isWand = slot === 'weapon';
  const isAccessory = slot === 'acc1' || slot === 'acc2';
  const socketCount = isWand
    ? (seededFraction(`${entry.name}::wand-sockets`) < 0.5 ? 2 : 3)
    : (seededFraction(`${entry.name}::sockets`) < 0.7 ? 1 : 2);
  const equipBudget = Math.max(1, Math.round((3 + entry.level * 0.5) * TIER_EQUIP_MULT[entry.tier]));
  const elementSkillRanks = ELEMENT_SKILL_RANK_BONUS[entry.tier];
  const equipId = `equip_${idSlug}`;

  const elementResist = isWand ? undefined : rollElementResist(entry.name, entry.tier, entry.level);
  const wandElementDmgPct = isWand ? rollWandElementDmg(entry.name, entry.tier, entry.level) : undefined;
  const setId = isAccessory ? setIdByMonsterName[entry.name] : undefined;
  const setPartner = isAccessory ? setPartnerNameByMonsterName[entry.name] : undefined;
  const setBonus: ItemStatBonus | undefined = setId ? distributeAll(Math.round(equipBudget * 0.35), weights) : undefined;

  const resistDesc = elementResist && Object.keys(elementResist).length
    ? ` ${Object.entries(elementResist).map(([el, pct]) => `${ELEMENT_ICON[el as Element]}${Math.round(pct * 100)}%`).join(' ')} resist.`
    : '';
  const wandDesc = wandElementDmgPct ? ` ${ELEMENT_ICON[wandElementDmgPct.el]}+${Math.round(wandElementDmgPct.pct * 100)}% element dmg.` : '';
  const setDesc = setId && setPartner ? ` Paired with ${setPartner}'s piece — wear both for a bonus.` : '';
  const rankDesc = elementSkillRanks ? ` +${elementSkillRanks} rank to your invested ${entry.element} skills.` : '';

  MONSTER_EQUIPMENT_ITEMS[equipId] = {
    id: equipId,
    name: `${entry.name}'s ${SLOT_FLAVOR[slot]} [${socketCount}]`,
    icon: SLOT_ICON[slot],
    category: 'equipment',
    maxStack: 1,
    slot,
    socketCount,
    statBonus: distributeAll(equipBudget, weights),
    itemLevel: entry.level,
    rarity,
    elementResist: elementResist && Object.keys(elementResist).length ? elementResist : undefined,
    wandElementDmgPct,
    setId,
    setBonus,
    setBonusDesc: setId && setPartner ? `Set bonus with ${setPartner}'s piece: ${Object.entries(setBonus ?? {}).map(([k, v]) => `+${v} ${k.toUpperCase()}`).join(', ')}` : undefined,
    elementSkillRankBonus: elementSkillRanks ? { el: entry.element, ranks: elementSkillRanks } : undefined,
    desc: `${RARITY_LABEL[rarity]} gear dropped by ${entry.name}. ${socketCount} socket${socketCount > 1 ? 's' : ''}.${resistDesc}${wandDesc}${setDesc}${rankDesc} Item Lv ${entry.level}.`,
  };
  EQUIPMENT_ID_BY_SPECIES[entry.name] = equipId;

  const unidId = `unid_equip_${idSlug}`;
  MONSTER_UNID_EQUIPMENT_ITEMS[unidId] = {
    id: unidId,
    name: `Unidentified ${SLOT_FLAVOR[slot]}`,
    icon: '❓',
    category: 'equipment',
    maxStack: 20,
    itemLevel: entry.level,
    rarity,
    identified: false,
    identifiesInto: equipId,
    desc: `An unidentified ${SLOT_FLAVOR[slot].toLowerCase()} — its stats (and any elemental resistance or wand affinity) are hidden until identified. Use an Identify Scroll to reveal it. Item Lv ${entry.level}.`,
  };
  UNID_EQUIPMENT_ID_BY_SPECIES[entry.name] = unidId;

  // ---- Card ----
  const cardBudget = Math.max(1, Math.round((1.5 + entry.level * 0.3) * TIER_CARD_MULT[entry.tier]));
  const cardId = `card_${idSlug}`;
  MONSTER_CARD_ITEMS[cardId] = {
    id: cardId,
    name: `${entry.name} Card`,
    icon: '🃏',
    category: 'card',
    maxStack: 9,
    statBonus: distributeTop(cardBudget, weights, 2),
    itemLevel: entry.level,
    rarity,
    desc: `Socket into an equipped Head/Robe/Cape piece. Bears ${entry.name}'s likeness. Item Lv ${entry.level}.`,
  };
  CARD_ID_BY_SPECIES[entry.name] = cardId;

  // ---- Crimson Card (Boss only — a second, far rarer drop) ----
  if (entry.tier === 'boss') {
    const crimsonBudget = Math.round(cardBudget * CRIMSON_MULT);
    const crimsonId = `crimson_${idSlug}`;
    const shortName = entry.name.split(',')[0]!.trim();
    MONSTER_CRIMSON_ITEMS[crimsonId] = {
      id: crimsonId,
      name: `Crimson ${shortName}`,
      icon: '🔴',
      category: 'card',
      maxStack: 9,
      statBonus: distributeTop(crimsonBudget, weights, 2),
      itemLevel: entry.level,
      rarity: 'legendary',
      desc: `Legendary. A blood-dark echo of ${entry.name}'s own power — vanishingly rare. Item Lv ${entry.level}.`,
    };
    CRIMSON_ID_BY_SPECIES[entry.name] = crimsonId;
  }
});

function baseSpeciesName(battleName: string): string {
  return battleName.replace(/ \((?:Adult|Elder)\)$/, '');
}

/** Independent drop rolls per defeated monster (all separate from
 *  MONSTER_LOOT_DROP_CHANCE's trophy roll) — Equipment 10% (Wand 5%
 *  instead, since it comes with more sockets), Card 2%/1%/0.10% by Tier
 *  (regular / elite+miniboss / boss), and a Boss's Crimson Card at 0.01%.
 *  Equipment always drops as its Unidentified placeholder, never the real item. */
export function rollMonsterEquipmentDrops(monsterNames: string[]): Record<string, number> {
  const drops: Record<string, number> = {};
  const add = (id: string) => { drops[id] = (drops[id] ?? 0) + 1; };

  monsterNames.forEach((battleName) => {
    const species = baseSpeciesName(battleName);
    const entry = MONSTER_ROSTER_RAW.find((m) => m.name === species);
    if (!entry) return;

    const unidId = UNID_EQUIPMENT_ID_BY_SPECIES[species];
    if (unidId) {
      const isWand = MONSTER_EQUIPMENT_ITEMS[EQUIPMENT_ID_BY_SPECIES[species]!]!.slot === 'weapon';
      if (Math.random() < (isWand ? 0.05 : 0.10)) add(unidId);
    }

    const cardId = CARD_ID_BY_SPECIES[species];
    if (cardId) {
      const cardRate = entry.tier === 'boss' ? 0.001 : entry.tier === 'elite' || entry.tier === 'miniboss' ? 0.01 : 0.02;
      if (Math.random() < cardRate) add(cardId);
    }

    const crimsonId = CRIMSON_ID_BY_SPECIES[species];
    if (crimsonId && Math.random() < 0.0001) add(crimsonId);
  });

  return drops;
}
