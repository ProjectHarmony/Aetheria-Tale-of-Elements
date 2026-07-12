import type { Direction, MapDef, PortalDef } from '@/types';
import { WORLD_MAP_DATA, type RawWarpPortal } from './worldMapData';
import { BOSS_LANDMARKS, BOSS_UNDERLINGS, MONSTER_META, MONSTER_ROSTER, MONSTER_ROSTER_BY_NAME, POPULATION_COUNTS, POPULATION_LEVELS } from './monsterRoster';
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
 *  so this one constant is effectively each map's real footprint (x20 =
 *  2000x2000, i.e. a 200x200 map at the original x10 scale — enough open
 *  room for the camera pan to not feel suffocating). */
const SCALE = 20;

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
// BOSS PLACEMENT — the 6 Aetheria Bosses, placed at their designated
// landmark map. Their 2 Tactician-role Underlings are battle-only: they
// never roam the map themselves, only joining the fight once the player
// walks into the Boss (see mapStore.ts's encounterGroup) — composition is
// always exactly these 3 (matching the player's 3v3), see
// BOSS_UNDERLINGS/BOSS_LANDMARKS (constants/monsterRoster.ts).
// ============================================================
Object.entries(BOSS_LANDMARKS).forEach(([bossName, mapId]) => {
  const map = MAPS[mapId];
  if (!map || !BOSS_UNDERLINGS[bossName]) return;
  map.monsters.push([bossName, map.w / 2, map.h / 2]);
});

// ============================================================
// FIELD MONSTER PLACEMENT — every non-Boss/non-Underling species (45
// Regular + 12 Elite + 15 wild Mini-Boss = 72), assigned a primary map by
// ascending (base) Level, ordered by hop-distance from Crown Haven City —
// weakest nearest the hub, strongest at the frontier. Elite/Mini-Boss still
// spawn as a flat local population (FIELD_INSTANCES_PER_SPECIES). Regular
// species instead spawn their full 3-tier Population Pyramid (see
// monsterRoster.ts POPULATION_LEVELS/POPULATION_COUNTS): Juvenile (x12) +
// Adult (x5) always land on the species' primary map, but the single rare
// Elder is NOT guaranteed there — each species independently rolls whether
// it spawns an Elder at all (~45% do), and when it does, it lands on a
// random map within a nearby difficulty window, often a different map than
// its own Juvenile/Adult population.
// ============================================================
const FIELD_INSTANCES_PER_SPECIES = 2;
const POPULATION_SUFFIXES = POPULATION_LEVELS.filter((l) => l.suffix !== '').map((l) => l.suffix);

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

/** Deterministic pseudo-random unit offset in [-1, 1] from a string seed —
 *  keeps placement stable across reloads without hand-picking x/y per
 *  monster. Runs a proper avalanche finalizer (not just a running sum) so
 *  seeds that differ by one trailing character (e.g. name+'x'+3 vs
 *  name+'x'+4) still land far apart in [-1, 1] — a plain polynomial rolling
 *  hash left near-identical seeds clumped together, which is why monster
 *  populations used to read as a tight nest instead of a wide scatter. */
function seededUnit(seed: string): number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  h ^= h >>> 16;
  return ((h >>> 0) / 4294967295) * 2 - 1;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/** Scatters `count` individuals of one species/tier independently across the
 *  whole map (each instance gets its own seeded-random point, not a shared
 *  nest/cluster point) so a species' population reads as roaming the whole
 *  zone rather than a single tight den. */
function scatterOnMap(map: MapDef, name: string, count: number): void {
  for (let n = 0; n < count; n++) {
    const x = clamp(map.w / 2 + seededUnit(name + 'x' + n) * map.w * 0.47, 16, map.w - 16);
    const y = clamp(map.h / 2 + seededUnit(name + 'y' + n) * map.h * 0.47, 16, map.h - 16);
    map.monsters.push([name, x, y]);
  }
}

{
  const bossMapIds = new Set(Object.values(BOSS_LANDMARKS));
  const mapLayers = computeMapLayers();
  const fieldMapIds = Object.keys(MAPS)
    .filter((id) => id !== HUB_MAP_ID && !bossMapIds.has(id))
    .sort((a, b) => (mapLayers[a] ?? 99) - (mapLayers[b] ?? 99) || a.localeCompare(b));

  // One entry per species for assignment purposes — Adult/Elder variants are
  // derived from their Juvenile sibling's assigned map below, not assigned
  // independently, so the existing ascending-level/hop-distance ordering is
  // untouched by the 3x population expansion.
  const baseFieldMonsters = MONSTER_ROSTER
    .filter((m) => m.subtype === 'Field' && m.tier !== 'boss' && !POPULATION_SUFFIXES.some((sfx) => m.name.endsWith(sfx)))
    .sort((a, b) => a.level - b.level);

  baseFieldMonsters.forEach((entry, i) => {
    const mapIndex = Math.min(fieldMapIds.length - 1, Math.floor((i * fieldMapIds.length) / baseFieldMonsters.length));
    const mapId = fieldMapIds[mapIndex];
    const map = mapId ? MAPS[mapId] : undefined;
    if (!map) return;

    if (entry.tier !== 'regular') {
      scatterOnMap(map, entry.name, FIELD_INSTANCES_PER_SPECIES);
      return;
    }

    scatterOnMap(map, entry.name, POPULATION_COUNTS[''] ?? 12);
    const adult = MONSTER_ROSTER_BY_NAME[entry.name + ' (Adult)'];
    if (adult) scatterOnMap(map, adult.name, POPULATION_COUNTS[' (Adult)'] ?? 5);

    const elder = MONSTER_ROSTER_BY_NAME[entry.name + ' (Elder)'];
    const spawnsElder = seededUnit(entry.name + '::elder-chance') < -0.1; // ~45% of species spawn an Elder anywhere at all
    if (elder && spawnsElder) {
      const window = 3;
      const offset = Math.round(seededUnit(entry.name + '::elder-map') * window);
      const elderMapIndex = Math.max(0, Math.min(fieldMapIds.length - 1, mapIndex + offset));
      const elderMapId = fieldMapIds[elderMapIndex];
      const elderMap = elderMapId ? MAPS[elderMapId] : undefined;
      if (elderMap) scatterOnMap(elderMap, elder.name, POPULATION_COUNTS[' (Elder)'] ?? 1);
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

