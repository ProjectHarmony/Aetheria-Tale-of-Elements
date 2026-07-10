import type { Element } from './element';

export type Direction = 'N' | 'S' | 'E' | 'W';
/** Aetheria Monster Database's 4-tier model (spawn timers 1/5/30/60 min). */
export type MonsterTier = 'regular' | 'elite' | 'miniboss' | 'boss';

export interface PortalDef {
  dir: Direction;
  to: string;
  label: string;
  x: number;
  y: number;
  connectionType?: string;
}

/** [monsterName, spawnX, spawnY] — mirrors the original's tuple-array shape. */
export type MonsterSlot = [string, number, number];

/** [itemId, x, y] — reserved for the follow-up item-placement data drop, mirrors MonsterSlot. */
export type ItemSlot = [string, number, number];

export interface MapDef {
  id: string;
  name: string;
  sub: string;
  el: Element | 'neutral';
  el2?: Element;
  w: number;
  h: number;
  safe: boolean;
  tier?: number;
  mvpName?: string;
  monsters: MonsterSlot[];
  items?: ItemSlot[];
  portals: PortalDef[];
  weather?: string;
  terrain?: Record<string, number>;
  landmarks?: { name: string; x: number; y: number }[];
}

export interface MonsterMeta {
  el: Element;
  tier: MonsterTier;
  icon: string;
  size: number;
  /** Explicit per-monster field (not tier-derived) — the Aetheria database
   *  has exceptions in both directions (e.g. a species' Lv1 "Juvenile" is
   *  always non-aggro regardless of tier; a couple of high-level Mini-Bosses
   *  are flagged aggressive as a deliberate twist). */
  aggressive: boolean;
}

export interface Vec2 {
  x: number;
  y: number;
}

/** A live roamer instance on the current map, resolved from a MapDef's monster slots. */
export interface Roamer {
  id: string;
  slot: number;
  name: string;
  meta: MonsterMeta;
  x: number;
  y: number;
  aggro: boolean;
}

export interface MvpState {
  alive: boolean;
  mapId: string;
}
