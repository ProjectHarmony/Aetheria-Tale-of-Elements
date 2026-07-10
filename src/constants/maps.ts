import type { Direction, MapDef, PortalDef } from '@/types';
import { WORLD_MAP_DATA, type RawWarpPortal } from './worldMapData';
import { BOSS_LANDMARKS, BOSS_UNDERLINGS, MONSTER_META, MONSTER_ROSTER } from './monsterRoster';
import { TIER_PROFILES } from './monsterFormulas';

/**
 * Aetheria world map — transformed from the raw Aetheria atlas data
 * (`worldMapData.ts`, 61 locations) into the game's MapDef graph. Unlike the
 * original prototype's fire/water/earth/wind territories, this world has no
 * per-region element bias — it's a Ragnarok-Online-style spread of varied
 * zones (city, forests, mountains, deserts, coasts, ruins) linked by warp
 * portals, one safe hub (Crown Haven City) at the center.
 *
 * Monsters: the 6 Bosses + their 12 Underlings are placed at their named
 * landmarks below (`BOSS_LANDMARKS`); the other 72 field/Elite/wild
 * Mini-Boss monsters are placed by ascending Level onto every other map,
 * ordered by hop-distance from the hub — danger scales outward. `items`
 * stays empty, ready for a follow-up content drop.
 */

// ============================================================
// MONSTER DATA — see constants/monsterRoster.ts / monsterFormulas.ts /
// monsterSkills.ts for the full Aetheria Monster Database port.
// ============================================================
export { MONSTER_META };

export const RESPAWN_MS = {
  regular: TIER_PROFILES.regular.respawnMs,
  elite: TIER_PROFILES.elite.respawnMs,
  miniboss: TIER_PROFILES.miniboss.respawnMs,
  boss: TIER_PROFILES.boss.respawnMs,
};

// ============================================================
// MAP GRAPH — Aetheria: Crown Haven City (hub) + 60 field/coast/mountain/
// ruin maps, transformed from WORLD_MAP_DATA.
// ============================================================
export const HUB_MAP_ID = 'crown_haven_city';

/** Source positions/sizes are a 0–100 abstract space, scaled up to real
 *  in-game units — every location is a uniform 100x100 in the source data,
 *  so this one constant is effectively each map's real footprint (x15 =
 *  1500x1500, i.e. a 150x150 map at the original x10 scale). */
const SCALE = 15;

const DIR_WORD_TO_LETTER: Record<RawWarpPortal['direction'], Direction> = {
  North: 'N', South: 'S', East: 'E', West: 'W',
};

export const MAPS: Record<string, MapDef> = {};

Object.values(WORLD_MAP_DATA).forEach((raw) => {
  const [w, h] = raw.size;
  const portals: PortalDef[] = raw.warpPortals.map((p) => ({
    dir: DIR_WORD_TO_LETTER[p.direction],
    to: p.targetMap,
    label: '', // resolved below, once every map exists (source only carries a targetMap id, no label)
    x: p.position[0] * SCALE,
    y: p.position[1] * SCALE,
    connectionType: p.connectionType,
  }));
  MAPS[raw.mapId] = {
    id: raw.mapId,
    name: raw.mapName,
    sub: raw.weather,
    el: 'neutral',
    w: w * SCALE,
    h: h * SCALE,
    safe: raw.mapId === HUB_MAP_ID,
    monsters: [],
    items: [],
    portals,
    weather: raw.weather,
    terrain: raw.terrain,
    landmarks: raw.landmarks?.map((l) => ({ name: l.name, x: l.position[0] * SCALE, y: l.position[1] * SCALE })),
  };
});

Object.values(MAPS).forEach((map) => {
  map.portals.forEach((p) => { p.label = MAPS[p.to]?.name ?? p.to; });
});

/** Every portal must have a matching reverse portal in its destination — logs (doesn't throw) if the graph is ever broken. */
export function mapGraphSelfTest(): string[] {
  const problems: string[] = [];
  Object.values(MAPS).forEach((map) => {
    map.portals.forEach((p) => {
      const target = MAPS[p.to];
      if (!target) { problems.push(`${map.id} portal ${p.dir} points to unknown map "${p.to}"`); return; }
      const hasReturn = target.portals.some((rp) => rp.to === map.id);
      if (!hasReturn) problems.push(`${map.id} -> ${p.to} has NO return portal.`);
    });
  });
  if (problems.length && import.meta.env.DEV) console.error('MAP GRAPH ERRORS:\n' + problems.join('\n'));
  return problems;
}
mapGraphSelfTest();

// ============================================================
// BOSS + UNDERLING PLACEMENT — the 6 Aetheria Bosses, each with its 2
// Tactician-role Underlings, placed at their designated landmark map.
// Composition is always exactly these 3 (matching the player's 3v3) — see
// BOSS_UNDERLINGS/BOSS_LANDMARKS (constants/monsterRoster.ts) and
// mapStore.ts's group-aware encounter trigger. No source x/y was given for
// these, so placement within each 1500x1500 map is a small judgment call —
// spread in a loose triangle near the map's center.
// ============================================================
Object.entries(BOSS_LANDMARKS).forEach(([bossName, mapId]) => {
  const map = MAPS[mapId];
  const underlings = BOSS_UNDERLINGS[bossName];
  if (!map || !underlings) return;
  const [underlingA, underlingB] = underlings;
  const cx = map.w / 2, cy = map.h / 2;
  map.monsters.push([bossName, cx, cy], [underlingA, cx - 120, cy + 140], [underlingB, cx + 120, cy - 140]);
});

// ============================================================
// FIELD MONSTER PLACEMENT — every non-Boss/non-Underling monster (45
// Regular + 12 Elite + 15 wild Mini-Boss = 72), placed by ascending Level
// onto every map that isn't the hub or a Boss landmark, ordered by
// hop-distance from Crown Haven City — weakest nearest the hub, strongest
// at the frontier, exactly as requested. Each assigned species spawns as a
// small local population — several roaming individuals scattered around
// the map, not a single lone spawn — so exploring never reads as "empty."
// A light stand-in for the full 31-per-species "Population Pyramid" spread
// with Juvenile/Adult/Elder sub-populations (see
// systems/map/populationPyramid.ts for that richer data model, still
// unused pending zone→species assignments).
// ============================================================
const FIELD_INSTANCES_PER_SPECIES = 5;

function computeMapLayers(): Record<string, number> {
  const layer: Record<string, number> = { [HUB_MAP_ID]: 0 };
  const queue: string[] = [HUB_MAP_ID];
  while (queue.length) {
    const cur = queue.shift()!;
    MAPS[cur]!.portals.forEach((p) => {
      if (layer[p.to] !== undefined || !MAPS[p.to]) return;
      layer[p.to] = layer[cur]! + 1;
      queue.push(p.to);
    });
  }
  return layer;
}

/** Deterministic pseudo-random unit offset in [-1, 1] from a string seed — keeps placement stable across reloads without hand-picking x/y per monster. */
function seededUnit(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return ((Math.abs(h) % 1000) / 1000) * 2 - 1;
}

{
  const bossMapIds = new Set(Object.values(BOSS_LANDMARKS));
  const mapLayers = computeMapLayers();
  const fieldMapIds = Object.keys(MAPS)
    .filter((id) => id !== HUB_MAP_ID && !bossMapIds.has(id))
    .sort((a, b) => (mapLayers[a] ?? 99) - (mapLayers[b] ?? 99) || a.localeCompare(b));

  const fieldMonsters = MONSTER_ROSTER
    .filter((m) => m.subtype === 'Field' && m.tier !== 'boss')
    .sort((a, b) => a.level - b.level);

  fieldMonsters.forEach((entry, i) => {
    const mapId = fieldMapIds[Math.min(fieldMapIds.length - 1, Math.floor((i * fieldMapIds.length) / fieldMonsters.length))];
    const map = mapId ? MAPS[mapId] : undefined;
    if (!map) return;
    // Clusters that landed on this map earlier get nudged apart via a
    // per-species angular offset so multiple species' populations don't
    // all pile onto the same patch of ground.
    const clusterIndex = Math.floor(map.monsters.length / FIELD_INSTANCES_PER_SPECIES);
    const clusterAngle = clusterIndex * 2.4;
    const clusterCx = map.w / 2 + Math.cos(clusterAngle) * map.w * 0.22;
    const clusterCy = map.h / 2 + Math.sin(clusterAngle) * map.h * 0.22;
    for (let n = 0; n < FIELD_INSTANCES_PER_SPECIES; n++) {
      const cx = clusterCx + seededUnit(entry.name + 'x' + n) * map.w * 0.16;
      const cy = clusterCy + seededUnit(entry.name + 'y' + n) * map.h * 0.16;
      map.monsters.push([entry.name, cx, cy]);
    }
  });
}

// ============================================================
// TERRAIN-DRIVEN THEMING — no per-region element bias in Aetheria, so icon/
// accent-color come from each map's dominant terrain composition instead.
// Buckets are checked in priority order (most distinctive first) so e.g. a
// ruin with 30% ruinStructure + 35% filler grass still reads as a ruin.
// ============================================================
interface TerrainStyle { icon: string; rgb: string }

const TERRAIN_BUCKETS: { keys: string[]; icon: string; rgb: string }[] = [
  { keys: ['cityStructures', 'stoneStructure'], icon: '🏙️', rgb: '232,196,104' },
  { keys: ['ruinStructure', 'graveyard'], icon: '🪦', rgb: '143,138,168' },
  { keys: ['lavaRock', 'ash'], icon: '🌋', rgb: '255,107,74' },
  { keys: ['geyserPool', 'mineralRock'], icon: '♨️', rgb: '78,205,196' },
  { keys: ['caveFloor', 'bioluminescentRock', 'rubble'], icon: '🕳️', rgb: '90,127,176' },
  { keys: ['snow', 'mountainPath'], icon: '❄️', rgb: '188,214,230' },
  { keys: ['sand', 'desertScrub'], icon: '🏜️', rgb: '224,176,112' },
  { keys: ['marshWater', 'reed'], icon: '🐸', rgb: '122,154,90' },
  { keys: ['river', 'water', 'pebbleBank'], icon: '💧', rgb: '78,205,196' },
  { keys: ['forest', 'forestBorder', 'forestPatch'], icon: '🌲', rgb: '76,138,90' },
  { keys: ['sunflowerField', 'wildflower'], icon: '🌻', rgb: '240,200,64' },
  { keys: ['orchardRows'], icon: '🍎', rgb: '194,106,74' },
];
const FALLBACK_STYLE: TerrainStyle = { icon: '🌾', rgb: '168,198,108' };
const HUB_STYLE: TerrainStyle = { icon: '⛩', rgb: '255,200,92' };

function terrainStyleFor(map: MapDef): TerrainStyle {
  if (map.safe) return HUB_STYLE;
  const terrain = map.terrain;
  if (terrain) {
    for (const bucket of TERRAIN_BUCKETS) {
      if (bucket.keys.some((k) => (terrain[k] ?? 0) > 0)) return bucket;
    }
  }
  return FALLBACK_STYLE;
}

export function mapIconFor(map: MapDef): string {
  return map.safe ? '⛩' : terrainStyleFor(map).icon;
}

/** Tint color for portal rings / world-map node borders — replaces the old element-keyed `--wm-{el}` CSS vars. */
export function mapAccentColor(map: MapDef): string {
  return `rgb(${terrainStyleFor(map).rgb})`;
}

/** Per-map background gradient, tinted by dominant terrain. */
export function mapBackground(map: MapDef): string {
  const { rgb } = terrainStyleFor(map);
  return `radial-gradient(ellipse 80% 60% at 50% 30%, rgba(${rgb},0.16), transparent 65%), #1d1830`;
}

