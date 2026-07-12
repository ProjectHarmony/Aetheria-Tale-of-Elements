import type { GearSlot, ItemDef, ItemRarity, ItemStatBonus, MonsterRole, MonsterTier } from '@/types';
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
 * per the design brief — and Mini-Boss/Boss Equipment also grants
 * `bonusSkillRanks` (+1 / +2), amplifying whichever active/passive skills
 * the player already invested in.
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

const BONUS_SKILL_RANKS: Partial<Record<MonsterTier, number>> = { miniboss: 1, boss: 2 };

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

/** Deterministic pseudo-random fraction in [0, 1) from a string seed — same
 *  avalanche-mixing approach as maps.ts's seededUnit, so each monster's
 *  socket-count roll is stable across reloads/deploys instead of actually
 *  re-rolling (these are catalog item DEFINITIONS, not per-drop rolls). */
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

export const MONSTER_EQUIPMENT_ITEMS: Record<string, ItemDef> = {};
export const MONSTER_CARD_ITEMS: Record<string, ItemDef> = {};
export const MONSTER_CRIMSON_ITEMS: Record<string, ItemDef> = {};

/** Species display name -> its dropped item id (population variants and Boss Underlings resolve to their base species, same convention as monsterLoot.ts). */
export const EQUIPMENT_ID_BY_SPECIES: Record<string, string> = {};
export const CARD_ID_BY_SPECIES: Record<string, string> = {};
export const CRIMSON_ID_BY_SPECIES: Record<string, string> = {};

MONSTER_ROSTER_RAW.forEach((entry) => {
  const weights = ROLE_STAT_WEIGHTS[entry.role];
  const rarity = TIER_RARITY[entry.tier];
  const idSlug = slug(entry.name);

  // ---- Equipment ----
  const slot = ROLE_TO_SLOT[entry.role];
  const isWand = slot === 'weapon';
  const socketCount = isWand
    ? (seededFraction(`${entry.name}::wand-sockets`) < 0.5 ? 2 : 3)
    : (seededFraction(`${entry.name}::sockets`) < 0.7 ? 1 : 2);
  const equipBudget = Math.max(1, Math.round((3 + entry.level * 0.5) * TIER_EQUIP_MULT[entry.tier]));
  const bonusSkillRanks = BONUS_SKILL_RANKS[entry.tier];
  const equipId = `equip_${idSlug}`;
  MONSTER_EQUIPMENT_ITEMS[equipId] = {
    id: equipId,
    name: `${entry.name}'s ${SLOT_FLAVOR[slot]} [${socketCount}]`,
    icon: SLOT_ICON[slot],
    category: 'equipment',
    maxStack: 1,
    slot,
    socketCount,
    statBonus: distributeAll(equipBudget, weights),
    reqLevel: entry.level,
    rarity,
    bonusSkillRanks,
    desc: `${RARITY_LABEL[rarity]} gear dropped by ${entry.name}. ${socketCount} socket${socketCount > 1 ? 's' : ''}.${
      bonusSkillRanks ? ` +${bonusSkillRanks} rank to skills you've already invested in.` : ''
    } Requires Lv ${entry.level}.`,
  };
  EQUIPMENT_ID_BY_SPECIES[entry.name] = equipId;

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
    reqLevel: entry.level,
    rarity,
    desc: `Socket into an equipped Head/Robe/Cape piece. Bears ${entry.name}'s likeness. Requires Lv ${entry.level}.`,
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
      reqLevel: entry.level,
      rarity: 'legendary',
      desc: `Legendary. A blood-dark echo of ${entry.name}'s own power — vanishingly rare. Requires Lv ${entry.level}.`,
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
 *  (regular / elite+miniboss / boss), and a Boss's Crimson Card at 0.01%. */
export function rollMonsterEquipmentDrops(monsterNames: string[]): Record<string, number> {
  const drops: Record<string, number> = {};
  const add = (id: string) => { drops[id] = (drops[id] ?? 0) + 1; };

  monsterNames.forEach((battleName) => {
    const species = baseSpeciesName(battleName);
    const entry = MONSTER_ROSTER_RAW.find((m) => m.name === species);
    if (!entry) return;

    const equipId = EQUIPMENT_ID_BY_SPECIES[species];
    if (equipId) {
      const isWand = MONSTER_EQUIPMENT_ITEMS[equipId]!.slot === 'weapon';
      if (Math.random() < (isWand ? 0.05 : 0.10)) add(equipId);
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
