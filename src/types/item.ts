/** The 5 backpack classifications the player asked for. */
export type ItemCategory = 'consumable' | 'equipment' | 'loot' | 'soul' | 'card';

/** Drop-tier flavor, purely presentational (color-coding in the UI) — mirrors
 *  the monster Tier it dropped from (regular/elite/miniboss), plus a 5th
 *  `legendary` step reserved for a Boss's ultra-rare Crimson Card. */
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

/** 6 gear slots per mage: Headgear, Robe, Cape, Weapon, and 2 Accessories.
 *  Head/Robe/Cape each take 1 Card; Weapon takes up to 3 Soul Stones;
 *  Accessories have their own fixed effect and no sockets. */
export type GearSlot = 'head' | 'robe' | 'cape' | 'weapon' | 'acc1' | 'acc2';

/** Flat additive bonus to a mage's 6 core stat POINTS (same units as
 *  allocated stat points — see STAT_SCALE in constants/heroes.ts), applied
 *  on top of whatever the player has manually spent. */
export interface ItemStatBonus {
  pow?: number;
  cs?: number;
  vit?: number;
  dge?: number;
  crt?: number;
  acc?: number;
}

export interface ItemDef {
  id: string;
  name: string;
  icon: string;
  category: ItemCategory;
  desc: string;
  /** How many of this item one backpack stack can hold. Equipment/Card/Soul are unique per copy (1); Consumable/Loot stack higher. */
  maxStack: number;
  /** Equipment only — which of the 6 slots this piece goes in. */
  slot?: GearSlot;
  /** Equipment/Card/Soul only — the stat bonus this piece grants while worn/socketed. */
  statBonus?: ItemStatBonus;
  /** Equipment only — how many Cards (Head/Robe/Cape) or Soul Stones (Weapon) this piece accepts. Accessories: 0/undefined. */
  socketCount?: number;
  /** Consumable only — HP restored when used on a hero (in battle, or on the
   *  overworld where it heals the party's lowest-HP% mage directly). */
  healAmount?: number;
  /** Consumable only — teleports the player straight back to Crown Haven
   *  City when used from the overworld (a "Town Portal Scroll"). Not usable
   *  mid-battle — retreating out of a fight isn't implemented. */
  teleportHub?: boolean;
  /** Aeons price at Crown Haven City's shop — undefined = not purchasable. */
  buyPrice?: number;
  /** Aeons the shop pays to buy this off the player — undefined = not sellable. */
  sellPrice?: number;
  /** Minimum mage Level required to equip/socket this — undefined = no restriction. */
  reqLevel?: number;
  /** Equipment only — rare monster drops (Mini-Boss+) can add a flat bonus
   *  to every skill the mage has ALREADY invested at least 1 point in
   *  (active or passive), capped at that skill's own max rank. Never
   *  unlocks a skill from scratch, only amplifies a choice the player
   *  already made — the "slightly off-balance if you got lucky" perk. */
  bonusSkillRanks?: number;
  /** Presentational drop-tier — see ItemRarity. */
  rarity?: ItemRarity;
}

/** One worn piece of gear plus whatever's currently socketed into it —
 *  lives on MageState.gear, keyed by GearSlot. */
export interface EquippedGear {
  itemId: string;
  /** Card ids (Head/Robe/Cape) or Soul Stone ids (Weapon) currently socketed — length capped at the gear's own `socketCount`. */
  socketedIds: string[];
}

/** The account-wide backpack — items aren't per-mage, only what's equipped/socketed is. */
export type Inventory = Record<string, number>;
