import type { Element } from '@/types';

/**
 * ARCHIVED — the original Two Elements monster roster (fire/water/earth/wind
 * territory mobs + 4 MVPs), superseded by the Aetheria Monster Database
 * (`Aetheria_Monster-Database-v5.xlsx`, 90 monsters: 78 field + 12 boss
 * underlings, formula-driven stats, real skill kits, 6 named Bosses tied to
 * specific Aetheria landmarks).
 *
 * Not imported anywhere — kept only for reference/history. Uses its own
 * frozen-in-time tier shape (not the live `MonsterMeta`/`MonsterTier`, which
 * has since moved to the new 4-tier model) so this snapshot doesn't need to
 * track later type changes.
 */
interface LegacyMonsterMeta {
  el: Element;
  tier: 'normal' | 'mini' | 'mvp';
  icon: string;
  size: number;
}

export const LEGACY_MONSTER_META: Record<string, LegacyMonsterMeta> = {
  // ---- FIRE (Emberwild chain) ----
  'Cinderling': { el: 'fire', tier: 'normal', icon: '🔥', size: 2 },
  'Ashfang Wolf': { el: 'fire', tier: 'normal', icon: '🐺', size: 2 },
  'Emberling Sprite': { el: 'fire', tier: 'normal', icon: '✨', size: 1 },
  'Scorch Beetle': { el: 'fire', tier: 'normal', icon: '🪲', size: 2 },
  'Flareclaw Crab': { el: 'fire', tier: 'normal', icon: '🦀', size: 2 },
  'Smoldering Imp': { el: 'fire', tier: 'normal', icon: '👹', size: 1 },
  'Sunscale Lizard': { el: 'fire', tier: 'normal', icon: '🦎', size: 2 },
  'Charhide Boar': { el: 'fire', tier: 'normal', icon: '🐗', size: 1 },
  'Cinderfang Alpha': { el: 'fire', tier: 'mini', icon: '🐺', size: 1 },
  'Emberback Brute': { el: 'fire', tier: 'mini', icon: '👹', size: 1 },
  'Cindermaw Prowler': { el: 'fire', tier: 'mini', icon: '🐆', size: 1 },
  'Ashmaw, the Cinder Tyrant': { el: 'fire', tier: 'mvp', icon: '🐺', size: 1 },

  // ---- WATER (Tideshallow chain) ----
  'Ripplejelly': { el: 'water', tier: 'normal', icon: '🫧', size: 3 },
  'Frostfin Eel': { el: 'water', tier: 'normal', icon: '🐍', size: 2 },
  'Tidepool Crab': { el: 'water', tier: 'normal', icon: '🦀', size: 2 },
  'Mistwing Ray': { el: 'water', tier: 'normal', icon: '🐡', size: 1 },
  'Brineback Turtle': { el: 'water', tier: 'normal', icon: '🐢', size: 1 },
  'Coral Serpent': { el: 'water', tier: 'normal', icon: '🐍', size: 2 },
  'Dewdrop Sprite': { el: 'water', tier: 'normal', icon: '💧', size: 1 },
  'Kelpfin Guppy': { el: 'water', tier: 'normal', icon: '🐠', size: 2 },
  'Tideclaw Matriarch': { el: 'water', tier: 'mini', icon: '🦞', size: 1 },
  'Frostmaw Stalker': { el: 'water', tier: 'mini', icon: '🐊', size: 1 },
  'Ripcurrent Hunter': { el: 'water', tier: 'mini', icon: '🦈', size: 1 },
  'Leviatide, the Abyssal Sovereign': { el: 'water', tier: 'mvp', icon: '🐋', size: 1 },

  // ---- EARTH (Bracken Expanse chain) ----
  'Pebblecrawler': { el: 'earth', tier: 'normal', icon: '🪨', size: 2 },
  'Mossback Tortoise': { el: 'earth', tier: 'normal', icon: '🐢', size: 1 },
  'Rootling Sapling': { el: 'earth', tier: 'normal', icon: '🌱', size: 2 },
  'Clayhide Golem': { el: 'earth', tier: 'normal', icon: '🗿', size: 1 },
  'Burrowclaw Mole': { el: 'earth', tier: 'normal', icon: '🦫', size: 2 },
  'Thornback Beetle': { el: 'earth', tier: 'normal', icon: '🪲', size: 1 },
  'Granite Toad': { el: 'earth', tier: 'normal', icon: '🐸', size: 2 },
  'Stonehide Warlord': { el: 'earth', tier: 'mini', icon: '🗿', size: 1 },
  'Bramblehorn Chief': { el: 'earth', tier: 'mini', icon: '🐗', size: 1 },
  "Terravus, the Mountain's Wrath": { el: 'earth', tier: 'mvp', icon: '🗿', size: 1 },

  // ---- WIND (Skyreach chain) ----
  'Zephyrling': { el: 'wind', tier: 'normal', icon: '🌪️', size: 3 },
  'Skitterhawk': { el: 'wind', tier: 'normal', icon: '🦅', size: 1 },
  'Gustwing Moth': { el: 'wind', tier: 'normal', icon: '🦋', size: 2 },
  'Cloudpuff Sprite': { el: 'wind', tier: 'normal', icon: '☁️', size: 1 },
  'Breeze Hare': { el: 'wind', tier: 'normal', icon: '🐇', size: 2 },
  'Whirlwisp': { el: 'wind', tier: 'normal', icon: '🌀', size: 1 },
  'Stormtail Swift': { el: 'wind', tier: 'normal', icon: '🐦', size: 2 },
  'Galewing Harrier': { el: 'wind', tier: 'mini', icon: '🦅', size: 1 },
  'Skyrend Raptor': { el: 'wind', tier: 'mini', icon: '🦖', size: 1 },
  'Tempestra, Queen of the Gale': { el: 'wind', tier: 'mvp', icon: '🦅', size: 1 },
};

/** Old 3-tier (normal/mini/mvp) respawn timers — the new Aetheria database
 *  uses a 4-tier model (Regular/Elite/Mini-Boss/Boss: 1/5/30/60 min) instead,
 *  archived alongside the roster it belonged to. */
export const LEGACY_RESPAWN_MS = {
  normal: 12 * 1000,
  mini: 15 * 60 * 1000,
  mvp: 5 * 60 * 60 * 1000,
};
