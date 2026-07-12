import type { GearSlot, ItemDef } from '@/types';

/**
 * Starter item catalog — a small hand-authored set per category so the
 * Backpack has real content to interact with before a real loot/daily-
 * reward pipeline exists (see STARTER_INVENTORY below, and HubPage/Adventure
 * for where a future drop system would call `addItem`). Every category the
 * player asked for is represented: Equipment (wearable, one of the 6
 * GearSlots), Card (Ragnarok-style — sockets into Head/Robe/Cape gear),
 * Soul Stone (sockets into the Weapon only, up to 3), Consumable (used
 * mid-battle to heal), and Loot (quest-only, no mechanical effect).
 */
export const ITEMS_BY_ID: Record<string, ItemDef> = {
  // ---- Equipment (wearable — one of the 6 GearSlots) ----
  apprentice_hood: {
    id: 'apprentice_hood', name: 'Apprentice Hood', icon: '🎩', category: 'equipment', maxStack: 1,
    slot: 'head', socketCount: 1, statBonus: { acc: 2 },
    desc: 'A modest cloth hood. +2 Accuracy. 1 Card socket.',
  },
  apprentice_robe: {
    id: 'apprentice_robe', name: 'Apprentice Robe', icon: '👘', category: 'equipment', maxStack: 1,
    slot: 'robe', socketCount: 1, statBonus: { vit: 3 },
    desc: 'Simple spellcasting robes. +3 Vital. 1 Card socket.',
  },
  travelers_cape: {
    id: 'travelers_cape', name: "Traveler's Cape", icon: '🧣', category: 'equipment', maxStack: 1,
    slot: 'cape', socketCount: 1, statBonus: { dge: 2 },
    desc: 'Well-worn from the road. +2 Dodge. 1 Card socket.',
  },
  novice_staff: {
    id: 'novice_staff', name: 'Novice Staff', icon: '🪄', category: 'equipment', maxStack: 1,
    slot: 'weapon', socketCount: 3, statBonus: { pow: 3 },
    desc: 'A starting spellcaster’s staff. +3 Power. 3 Soul Stone sockets.',
  },
  lucky_charm: {
    id: 'lucky_charm', name: 'Lucky Charm', icon: '🍀', category: 'equipment', maxStack: 1,
    slot: 'acc1', statBonus: { crt: 2 },
    desc: 'A small trinket that hums with luck. +2 Crit. No sockets.',
  },
  focus_ring: {
    id: 'focus_ring', name: 'Focus Ring', icon: '💍', category: 'equipment', maxStack: 1,
    slot: 'acc2', statBonus: { cs: 2 },
    desc: 'Sharpens the mind mid-cast. +2 Cast Speed. No sockets.',
  },

  // ---- Card (Ragnarok-style — sockets into an equipped Head/Robe/Cape) ----
  slime_card: {
    id: 'slime_card', name: 'Slime Card', icon: '🟢', category: 'card', maxStack: 9,
    statBonus: { vit: 2 }, desc: 'Socket into Head/Robe/Cape gear. +2 Vital.',
  },
  goblin_card: {
    id: 'goblin_card', name: 'Goblin Card', icon: '🗡️', category: 'card', maxStack: 9,
    statBonus: { pow: 2 }, desc: 'Socket into Head/Robe/Cape gear. +2 Power.',
  },
  sprite_card: {
    id: 'sprite_card', name: 'Sprite Card', icon: '✨', category: 'card', maxStack: 9,
    statBonus: { acc: 2 }, desc: 'Socket into Head/Robe/Cape gear. +2 Accuracy.',
  },

  // ---- Soul Stone (separate from Cards — sockets into the Weapon only) ----
  ember_wisp_soul: {
    id: 'ember_wisp_soul', name: 'Ember Wisp Soul', icon: '🔥', category: 'soul', maxStack: 9,
    statBonus: { pow: 3 }, desc: 'Socket into a Weapon only. +3 Power.',
  },
  tide_spirit_soul: {
    id: 'tide_spirit_soul', name: 'Tide Spirit Soul', icon: '💧', category: 'soul', maxStack: 9,
    statBonus: { cs: 3 }, desc: 'Socket into a Weapon only. +3 Cast Speed.',
  },

  // ---- Consumable (used mid-battle to heal a mage) ----
  minor_healing_draught: {
    id: 'minor_healing_draught', name: 'Minor Healing Draught', icon: '🧪', category: 'consumable', maxStack: 20,
    healAmount: 150, desc: 'Use in battle to restore 150 HP to your lowest-HP mage.',
  },
  healing_draught: {
    id: 'healing_draught', name: 'Healing Draught', icon: '🧉', category: 'consumable', maxStack: 20,
    healAmount: 350, desc: 'Use in battle to restore 350 HP to your lowest-HP mage.',
  },

  // ---- Loot (quest-only — no mechanical effect) ----
  tattered_map_fragment: {
    id: 'tattered_map_fragment', name: 'Tattered Map Fragment', icon: '📜', category: 'loot', maxStack: 99,
    desc: 'Quest item. A torn scrap of an old map — someone in Crown Haven might want this.',
  },
  ancient_coin: {
    id: 'ancient_coin', name: 'Ancient Coin', icon: '🪙', category: 'loot', maxStack: 99,
    desc: 'Quest item. Bears a crest no living kingdom claims.',
  },
};

export function itemById(id: string): ItemDef | undefined {
  return ITEMS_BY_ID[id];
}

/** Which gear slots a Card can socket into (Head/Robe/Cape) vs a Soul Stone (Weapon only). */
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
  tattered_map_fragment: 1,
};
