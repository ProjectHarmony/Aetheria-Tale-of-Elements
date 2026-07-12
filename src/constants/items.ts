import type { GearSlot, ItemDef } from '@/types';
import { MONSTER_LOOT_ITEMS } from './monsterLoot';
import { MONSTER_CARD_ITEMS, MONSTER_CRIMSON_ITEMS, MONSTER_EQUIPMENT_ITEMS } from './monsterGear';

/**
 * Hand-authored starter item catalog — a small set per category so the
 * Backpack has real content to interact with before a real daily-reward
 * pipeline exists (see STARTER_INVENTORY below). Every category the player
 * asked for is represented: Equipment (wearable, one of the 6 GearSlots —
 * the starter "Apprentice" line has no Card sockets; socketed gear is a
 * later item tier), Card (Ragnarok-style — sockets into an equipped
 * Head/Robe/Cape), Soul Crystal (sockets into an equipped Weapon only),
 * Consumable (heals in battle or from the overworld; the Town Portal Scroll
 * instead warps to Crown Haven City), and Etc (junk loot with no mechanical
 * effect — the one category the Crown Haven shop buys from the player, see
 * SHOP_BUY_ITEMS/AEON_TIER_REWARD for the other side of the Aeons currency
 * loop). ITEMS_BY_ID below also merges in `MONSTER_LOOT_ITEMS` — one
 * procedurally-generated sellable Etc item per monster species, dropped at
 * MONSTER_LOOT_DROP_CHANCE per defeated monster (see monsterLoot.ts).
 */
const HAND_ITEMS: Record<string, ItemDef> = {
  // ---- Equipment (wearable — one of the 6 GearSlots; no sockets yet) ----
  apprentice_hood: {
    id: 'apprentice_hood', name: 'Apprentice Hood', icon: '🎩', category: 'equipment', maxStack: 1,
    slot: 'head', statBonus: { acc: 2 },
    desc: 'A modest cloth hood. +2 Accuracy.',
  },
  apprentice_robe: {
    id: 'apprentice_robe', name: 'Apprentice Robe', icon: '👘', category: 'equipment', maxStack: 1,
    slot: 'robe', statBonus: { vit: 3 },
    desc: 'Simple spellcasting robes. +3 Vital.',
  },
  travelers_cape: {
    id: 'travelers_cape', name: "Traveler's Cape", icon: '🧣', category: 'equipment', maxStack: 1,
    slot: 'cape', statBonus: { dge: 2 },
    desc: 'Well-worn from the road. +2 Dodge.',
  },
  novice_staff: {
    id: 'novice_staff', name: 'Novice Staff', icon: '🪄', category: 'equipment', maxStack: 1,
    slot: 'weapon', statBonus: { pow: 3 },
    desc: 'A starting spellcaster’s staff. +3 Power.',
  },
  lucky_charm: {
    id: 'lucky_charm', name: 'Lucky Charm', icon: '🍀', category: 'equipment', maxStack: 1,
    slot: 'acc1', statBonus: { crt: 2 },
    desc: 'A small trinket that hums with luck. +2 Crit.',
  },
  focus_ring: {
    id: 'focus_ring', name: 'Focus Ring', icon: '💍', category: 'equipment', maxStack: 1,
    slot: 'acc2', statBonus: { cs: 2 },
    desc: 'Sharpens the mind mid-cast. +2 Cast Speed.',
  },

  // ---- Card (Ragnarok-style — sockets into an equipped Head/Robe/Cape) ----
  slime_card: {
    id: 'slime_card', name: 'Slime Card', icon: '🟢', category: 'card', maxStack: 9,
    statBonus: { vit: 2 }, desc: 'Socket into an equipped Head/Robe/Cape piece. +2 Vital.',
  },
  goblin_card: {
    id: 'goblin_card', name: 'Goblin Card', icon: '🗡️', category: 'card', maxStack: 9,
    statBonus: { pow: 2 }, desc: 'Socket into an equipped Head/Robe/Cape piece. +2 Power.',
  },
  sprite_card: {
    id: 'sprite_card', name: 'Sprite Card', icon: '✨', category: 'card', maxStack: 9,
    statBonus: { acc: 2 }, desc: 'Socket into an equipped Head/Robe/Cape piece. +2 Accuracy.',
  },

  // ---- Soul Crystal (separate from Cards — sockets into an equipped Weapon only) ----
  ember_wisp_soul: {
    id: 'ember_wisp_soul', name: 'Ember Wisp Soul Crystal', icon: '🔥', category: 'soul', maxStack: 9,
    statBonus: { pow: 3 }, desc: 'Socket into an equipped Weapon. +3 Power.',
  },
  tide_spirit_soul: {
    id: 'tide_spirit_soul', name: 'Tide Spirit Soul Crystal', icon: '💧', category: 'soul', maxStack: 9,
    statBonus: { cs: 3 }, desc: 'Socket into an equipped Weapon. +3 Cast Speed.',
  },

  // ---- Consumable (heals — in battle, or the lowest-HP mage directly from the overworld) ----
  minor_healing_draught: {
    id: 'minor_healing_draught', name: 'Minor Healing Draught', icon: '🧪', category: 'consumable', maxStack: 20,
    healAmount: 150, buyPrice: 15, desc: 'Restores 150 HP to your lowest-HP mage. 💰15 Aeons.',
  },
  healing_draught: {
    id: 'healing_draught', name: 'Healing Draught', icon: '🧉', category: 'consumable', maxStack: 20,
    healAmount: 350, buyPrice: 35, desc: 'Restores 350 HP to your lowest-HP mage. 💰35 Aeons.',
  },

  // ---- Consumable (utility — teleports the player, not a heal) ----
  town_portal_scroll: {
    id: 'town_portal_scroll', name: 'Town Portal Scroll', icon: '🌀', category: 'consumable', maxStack: 20,
    teleportHub: true, buyPrice: 20, desc: 'Warps you straight back to Crown Haven City from anywhere in the field. 💰20 Aeons.',
  },

  // ---- Etc (quest/junk loot — no mechanical effect, sellable at Crown Haven's shop) ----
  tattered_map_fragment: {
    id: 'tattered_map_fragment', name: 'Tattered Map Fragment', icon: '📜', category: 'loot', maxStack: 99,
    sellPrice: 8, desc: 'A torn scrap of an old map. The Crown Haven shop will buy this for 💰8 Aeons.',
  },
  ancient_coin: {
    id: 'ancient_coin', name: 'Ancient Coin', icon: '🪙', category: 'loot', maxStack: 99,
    sellPrice: 25, desc: 'Bears a crest no living kingdom claims. The Crown Haven shop will buy this for 💰25 Aeons.',
  },
};

/** The full catalog — hand-authored items plus one procedurally-generated
 *  sellable loot item per monster species (see monsterLoot.ts). */
export const ITEMS_BY_ID: Record<string, ItemDef> = {
  ...HAND_ITEMS,
  ...MONSTER_LOOT_ITEMS,
  ...MONSTER_EQUIPMENT_ITEMS,
  ...MONSTER_CARD_ITEMS,
  ...MONSTER_CRIMSON_ITEMS,
};

/** Purchasable at Crown Haven City's shop, in listed order. */
export const SHOP_BUY_ITEMS: string[] = ['minor_healing_draught', 'healing_draught', 'town_portal_scroll'];

export function itemById(id: string): ItemDef | undefined {
  return ITEMS_BY_ID[id];
}

/** Which gear slots a Card can socket into (Head/Robe/Cape) vs a Soul Crystal (Weapon only). */
export const CARD_SOCKET_SLOTS: GearSlot[] = ['head', 'robe', 'cape'];
export const SOUL_SOCKET_SLOT: GearSlot = 'weapon';

/** A small starting bag so the Backpack isn't empty before any real loot/
 *  daily-reward pipeline exists — `createParty` seeds a fresh account with this. */
export const STARTER_INVENTORY: Record<string, number> = {
  apprentice_hood: 1,
  apprentice_robe: 1,
  travelers_cape: 1,
  novice_staff: 1,
  lucky_charm: 1,
  focus_ring: 1,
  slime_card: 2,
  goblin_card: 1,
  ember_wisp_soul: 1,
  minor_healing_draught: 3,
  healing_draught: 1,
  town_portal_scroll: 1,
  tattered_map_fragment: 1,
};

/** Aeons a fresh account starts with — enough for a first shop visit without making the economy meaningless. */
export const STARTING_AEONS = 50;

/** Aeons awarded per defeated monster Tier, granted alongside XP after an Adventure win (see BattlePage). */
export const AEON_TIER_REWARD: Record<string, number> = { regular: 8, elite: 15, miniboss: 25, boss: 50 };
