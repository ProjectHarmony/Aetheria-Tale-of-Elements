import type { MapDef, MonsterMeta, MonsterTier, PortalDef, Roamer, Vec2 } from '@/types';
import { MONSTER_META, RESPAWN_MS } from '@/constants/maps';

export const MOVE_SPEED_BASE = 4.5;
const ENCOUNTER_RADIUS = 34;
const PORTAL_RADIUS = 38;
const AMBIENT_DRIFT_RANGE = 50;

/** Detection radius + chase-speed multiplier by tier, for aggressive roamers.
 *  Kept well under 1.0 across the board — an aggressive roamer that matches
 *  or beats the player's own speed can never be outwalked once spotted,
 *  which reads as relentless/unfair rather than "a real threat you can
 *  choose to run from." Higher tiers are still scarier (faster relative
 *  chase), but none of them can actually catch a player who commits to
 *  fleeing in a straight line. */
const AGGRO_RADIUS: Record<MonsterTier, number> = { regular: 220, elite: 260, miniboss: 320, boss: 420 };
const AGGRO_MULT: Record<MonsterTier, number> = { regular: 0.5, elite: 0.55, miniboss: 0.65, boss: 0.75 };

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function slotKey(mapId: string, slot: number): string {
  return `${mapId}:${slot}`;
}

/** Moves the player by a normalized joystick/keyboard vector, clamped to map bounds. */
export function movePlayer(pos: Vec2, joyVec: Vec2, map: MapDef, speed = MOVE_SPEED_BASE): Vec2 {
  if (joyVec.x === 0 && joyVec.y === 0) return pos;
  return {
    x: clamp(pos.x + joyVec.x * speed, 16, map.w - 16),
    y: clamp(pos.y + joyVec.y * speed, 16, map.h - 16),
  };
}

/** Camera top-left offset so the player stays centered, clamped so the world edge never shows past the viewport. */
export function computeCamera(pos: Vec2, map: MapDef, viewW: number, viewH: number): Vec2 {
  return {
    x: clamp(pos.x - viewW / 2, 0, Math.max(0, map.w - viewW)),
    y: clamp(pos.y - viewH / 2, 0, Math.max(0, map.h - viewH)),
  };
}

/** A uniform-random point inside the map's walkable bounds — used to give a
 *  respawning monster a fresh position instead of reappearing on the exact
 *  spot it was defeated on. */
function randomMapPosition(map: MapDef): Vec2 {
  return { x: 16 + Math.random() * Math.max(0, map.w - 32), y: 16 + Math.random() * Math.max(0, map.h - 32) };
}

/**
 * Resolves a map's monster slots into live roamers, honoring respawn
 * cooldowns (regular/elite/miniboss) and the Boss tier's world-singleton
 * state — a slot is skipped entirely if it's on cooldown or (for a Boss)
 * currently dead. Mirrors the original's loadMap() roamer-building pass. A
 * slot that's respawning (was previously defeated, cooldown now elapsed)
 * reappears at a random map position rather than its authored spawn point;
 * a slot that's never been defeated yet keeps its authored position.
 */
export function resolveRoamers(
  map: MapDef,
  respawnAt: Record<string, number>,
  bossDefeatedAt: Record<string, number>,
  now = Date.now(),
): Roamer[] {
  const out: Roamer[] = [];
  map.monsters.forEach(([name, x, y, companions], slot) => {
    const meta: MonsterMeta | undefined = MONSTER_META[name];
    if (!meta) return;
    let pos: Vec2 = { x, y };
    if (meta.tier === 'boss') {
      const defeatedAt = bossDefeatedAt[name];
      if (defeatedAt !== undefined) {
        if (now - defeatedAt < RESPAWN_MS.boss) return;
        pos = randomMapPosition(map);
      }
    } else {
      const until = respawnAt[slotKey(map.id, slot)];
      if (until !== undefined) {
        if (now < until) return;
        pos = randomMapPosition(map);
      }
    }
    out.push({ id: `${map.id}-${slot}`, slot, name, meta, x: pos.x, y: pos.y, aggro: meta.aggressive, companions });
  });
  return out;
}

/**
 * Aggro chase for aggressive roamers only (non-aggressive monsters never
 * chase — they only ambient-drift). A spotted Regular/Elite can't simply be
 * outwalked (matched speed); Mini-Boss/Boss are progressively "slightly" faster.
 */
export function stepAggro(roamers: Roamer[], map: MapDef, playerPos: Vec2, playerSpeed: number): Roamer[] {
  return roamers.map((r) => {
    if (!r.aggro) return r;
    const dist = Math.hypot(playerPos.x - r.x, playerPos.y - r.y);
    const detectRadius = AGGRO_RADIUS[r.meta.tier];
    if (dist >= detectRadius || dist <= 30) return r;
    const speed = playerSpeed * AGGRO_MULT[r.meta.tier];
    const dx = (playerPos.x - r.x) / dist;
    const dy = (playerPos.y - r.y) / dist;
    return { ...r, x: clamp(r.x + dx * speed, 16, map.w - 16), y: clamp(r.y + dy * speed, 16, map.h - 16) };
  });
}

/** Gentle random-hop drift for non-aggro (normal-tier) roamers, called on a ~2.2s interval, not every frame. */
export function ambientDrift(roamers: Roamer[], map: MapDef): Roamer[] {
  return roamers.map((r) => {
    if (r.aggro) return r;
    return {
      ...r,
      x: clamp(r.x + (Math.random() - 0.5) * AMBIENT_DRIFT_RANGE, 16, map.w - 16),
      y: clamp(r.y + (Math.random() - 0.5) * AMBIENT_DRIFT_RANGE, 16, map.h - 16),
    };
  });
}

export function findEncounter(pos: Vec2, roamers: Roamer[]): Roamer | undefined {
  return roamers.find((r) => Math.hypot(pos.x - r.x, pos.y - r.y) < ENCOUNTER_RADIUS);
}

export function findPortal(pos: Vec2, portals: PortalDef[]): PortalDef | undefined {
  return portals.find((p) => Math.hypot(pos.x - p.x, pos.y - p.y) < PORTAL_RADIUS);
}

/** Spawn point on arrival: pulled in from the destination's return portal so it can't instantly re-trigger. */
export function computeArrivalSpawn(fromMapId: string, toMap: MapDef): Vec2 {
  const backPortal = toMap.portals.find((p) => p.to === fromMapId);
  if (!backPortal) return { x: toMap.w / 2, y: toMap.h / 2 };
  const cx = toMap.w / 2;
  const cy = toMap.h / 2;
  const dx = cx - backPortal.x;
  const dy = cy - backPortal.y;
  const dist = Math.hypot(dx, dy) || 1;
  const pushIn = 100;
  return {
    x: clamp(backPortal.x + (dx / dist) * pushIn, 16, toMap.w - 16),
    y: clamp(backPortal.y + (dy / dist) * pushIn, 16, toMap.h - 16),
  };
}
