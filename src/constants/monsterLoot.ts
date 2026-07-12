import type { ItemDef } from '@/types';
import { MONSTER_ROSTER_RAW } from './monsterRoster';

/** Chance an individually-defeated monster drops its own unique loot item, checked once per monster in a won encounter. */
export const MONSTER_LOOT_DROP_CHANCE = 0.7;

/** Flavor noun per Role, shared with the roster's own Role taxonomy (see
 *  monsterRoster.ts's ROLE_ICON) so loot names stay formula-driven rather
 *  than hand-picked per monster. */
const ROLE_LOOT_NOUN: Record<string, string> = {
  Tank: 'Hide',
  Tactician: 'Sigil',
  Healer: 'Petal',
  Damager: 'Fang',
  Assassin: 'Claw',
  'AoE Controller': 'Core',
  'AoE Damager': 'Cinder',
  Dodger: 'Feather',
  Burst: 'Shard',
  Accuracy: 'Eye',
};

const TIER_LOOT_ICON: Record<string, string> = { regular: '🦴', elite: '🔮', miniboss: '💎', boss: '👑' };
/** Aeons sell price = base + level * per-level, both scaled by Tier — later, rarer kills pay off far more than an early Regular drop. */
const TIER_PRICE_BASE: Record<string, number> = { regular: 4, elite: 10, miniboss: 18, boss: 40 };
const TIER_PRICE_PER_LEVEL: Record<string, number> = { regular: 1.2, elite: 2, miniboss: 2.8, boss: 5 };

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

function lootNameFor(monsterName: string, role: string, tier: string): string {
  if (tier === 'boss') return `${monsterName.split(',')[0]!.trim()}'s Crown Shard`;
  return `${monsterName}'s ${ROLE_LOOT_NOUN[role] ?? 'Remains'}`;
}

function lootPriceFor(level: number, tier: string): number {
  const base = TIER_PRICE_BASE[tier] ?? TIER_PRICE_BASE.regular!;
  const perLevel = TIER_PRICE_PER_LEVEL[tier] ?? TIER_PRICE_PER_LEVEL.regular!;
  return Math.max(1, Math.round(base + level * perLevel));
}

/** One unique sellable loot item per monster SPECIES (the roster's 90 raw
 *  entries, before the Population Pyramid expands Regular species into
 *  Juvenile/Adult/Elder) — all population variants of a species share the
 *  same loot, resolved via `lootIdForMonster`. Stacks to 99 (Etc/loot never
 *  gates on maxStack the way Equipment's 1-per-copy rule does). */
export const MONSTER_LOOT_ITEMS: Record<string, ItemDef> = {};
/** Species display name -> its loot item id. */
const LOOT_ID_BY_SPECIES: Record<string, string> = {};

MONSTER_ROSTER_RAW.forEach((entry) => {
  const id = `loot_${slug(entry.name)}`;
  const price = lootPriceFor(entry.level, entry.tier);
  MONSTER_LOOT_ITEMS[id] = {
    id,
    name: lootNameFor(entry.name, entry.role, entry.tier),
    icon: TIER_LOOT_ICON[entry.tier] ?? TIER_LOOT_ICON.regular!,
    category: 'loot',
    maxStack: 99,
    sellPrice: price,
    desc: `A trophy from ${entry.name}. The Crown Haven shop will buy this for 💰${price} Aeons.`,
  };
  LOOT_ID_BY_SPECIES[entry.name] = id;
});

/** Resolves a battle-time monster name (which may carry a Population suffix
 *  like " (Adult)"/" (Elder)") back to its species' one shared loot item. */
export function lootIdForMonster(battleName: string): string | undefined {
  const baseName = battleName.replace(/ \((?:Adult|Elder)\)$/, '');
  return LOOT_ID_BY_SPECIES[baseName];
}

/** Rolls each defeated monster's independent MONSTER_LOOT_DROP_CHANCE to
 *  drop its unique loot — called once per won encounter (see
 *  buildEncounterEnemyTeam), never per-hit. */
export function rollMonsterLoot(monsterNames: string[]): Record<string, number> {
  const drops: Record<string, number> = {};
  monsterNames.forEach((name) => {
    const itemId = lootIdForMonster(name);
    if (!itemId) return;
    if (Math.random() < MONSTER_LOOT_DROP_CHANCE) drops[itemId] = (drops[itemId] ?? 0) + 1;
  });
  return drops;
}
