import type { Element } from './element';

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
  /** Consumable only — reveals an Unidentified Equipment item (see
   *  `identified`/`identifiesInto`), turning it into its real, statted item. */
  isIdentifyScroll?: boolean;
  /** Aeons price at Crown Haven City's shop — undefined = not purchasable. */
  buyPrice?: number;
  /** Aeons the shop pays to buy this off the player — undefined = not sellable. */
  sellPrice?: number;
  /** Informational only — the monster Level this piece/card dropped from.
   *  No longer gates equipping/socketing (see the "retract level cap" ask);
   *  just shown as a reference tag in the UI. */
  itemLevel?: number;
  /** Equipment only, default true. False = drops as "Unidentified" with its
   *  real slot/stats/name hidden — can't be equipped until an Identify
   *  Scroll is used on it (see gameStore.identifyItem), which consumes this
   *  item + one scroll and grants `identifiesInto` instead. This is where
   *  the resistance-roll "chance" the player asked for actually happens —
   *  the identified item's stats are fixed per catalog entry (this whole
   *  item system is a static catalog, not per-drop-instance RNG), but the
   *  player doesn't know what they rolled until they identify it. */
  identified?: boolean;
  /** Unidentified-equipment only — the real item id an Identify Scroll turns this into. */
  identifiesInto?: string;
  /** Equipment only — % less damage taken from that element's attacks (from
   *  up to 3 rolls at generation time, can repeat the same element to stack
   *  it further). Head/Robe/Cape/Accessories only, never Wands. */
  elementResist?: Partial<Record<Element, number>>;
  /** Wand only — a random element's outgoing damage %, so a wand can land on
   *  a mage's own element (a jackpot roll) or a mismatched one (a dud) —
   *  balanced by rolling a modest range regardless of which element it hits. */
  wandElementDmgPct?: { el: Element; pct: number };
  /** Accessory only — both members of a matched pair share the same setId;
   *  wearing both at once (acc1 + acc2) grants `setBonus` on top of their
   *  individual statBonus. Undefined = a standalone accessory with no pairing. */
  setId?: string;
  setBonus?: ItemStatBonus;
  /** Shown in the UI when both accessories of a set are worn. */
  setBonusDesc?: string;
  /** Equipment only — +1/+2/+3 rank to every skill of ONE element the mage
   *  has already invested at least 1 point in (active or passive), capped at
   *  that skill's own max rank — replaces the old element-agnostic
   *  `bonusSkillRanks`. Only ever benefits a mage of the MATCHING element. */
  elementSkillRankBonus?: { el: Element; ranks: number };
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
