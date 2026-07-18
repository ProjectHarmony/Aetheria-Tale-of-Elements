import type { Element, Row } from './element';
import type { MageStats } from '@/constants/heroes';
import type { FormationKey } from '@/constants/formations';
import type { EquippedGear, GearSlot } from './item';

/** Persistent per-mage progression — the roster/party feature owns this shape. */
export interface MageState {
  level: number;
  xp: number;
  statPoints: number;
  skillPoints: number;
  stats: MageStats;
  ranks: Record<string, number>;
  /** null = auto-equip (first N unlocked actives); array = manual pick */
  equipped: string[] | null;
  /** Worn gear (Headgear/Robe/Cape/Weapon/Necklace/Accessory) — null = empty slot. */
  gear: Record<GearSlot, EquippedGear | null>;
  /** HP carried between Adventure battles (Pokemon-style — no auto-heal
   *  between fights). `undefined` = never fought yet, treated as full HP.
   *  A full party wipe resets everyone to 1 (see gameStore.syncPartyHp). */
  currentHp?: number;
}

export interface Party {
  /** As of the MMORPG rehaul: exactly ONE element — a character is one mage,
   *  not a squad. Kept as an array (not a single `Element` field) since the
   *  whole battle/party engine already iterates `picks` generically; a
   *  length-1 array needed zero changes anywhere else. */
  picks: Element[];
  placements: Partial<Record<Element, Row>>;
  mages: Partial<Record<Element, MageState>>;
  formationType: FormationKey;
  /** Player-chosen display name for their character — shown in place of the
   *  element's fixed lore name (HERO_NAMES) wherever a mage's name renders. */
  characterName?: string;
  /** Character-creation appearance picks — placeholder swatches only until
   *  real art exists; MageSprite doesn't visually reflect these yet. */
  hairColor?: string;
  eyeColor?: string;
  /** Set once the new-character guided tutorial battle has been completed —
   *  gates TutorialPage from ever showing again for this character. */
  tutorialCompleted?: boolean;
}
