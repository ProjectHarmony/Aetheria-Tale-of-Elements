import type { MapDef, Vec2 } from '@/types';
import { MAPS, mapAccentColor } from '@/constants';

interface MinimapProps {
  map: MapDef;
  playerPos: Vec2;
  onClick: () => void;
}

const SIZE = 92;

/** Percentage-based placement within the minimap box — map coordinates and
 *  screen coordinates share the same x-right/y-down orientation, so this is
 *  a direct scale, no axis flip needed. */
function pct(x: number, y: number, map: MapDef): { left: string; top: string } {
  return { left: `${Math.min(100, Math.max(0, (x / map.w) * 100))}%`, top: `${Math.min(100, Math.max(0, (y / map.h) * 100))}%` };
}

/** Always-visible live overview of the CURRENT map (portals, landmarks, the
 *  player's own position) — distinct from MinimapBadge's "tap for the full
 *  world atlas" affordance. Tapping this still opens that same World Map
 *  modal, since a small live view naturally invites "show me more." */
export function Minimap({ map, playerPos, onClick }: MinimapProps) {
  return (
    <button
      onClick={onClick}
      className="relative flex-shrink-0 overflow-hidden rounded-2xl border-[1.5px] border-white/20 bg-[#0a0610]/85 backdrop-blur-md"
      style={{ width: SIZE, height: SIZE }}
      aria-label="Open world map"
    >
      {map.portals.map((p) => {
        const pos = pct(p.x, p.y, map);
        return (
          <span
            key={`${p.dir}-${p.to}`}
            className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/70"
            style={{ ...pos, background: mapAccentColor(MAPS[p.to] ?? map) }}
          />
        );
      })}

      {map.landmarks?.map((l) => {
        const pos = pct(l.x, l.y, map);
        return (
          <span
            key={l.name}
            className="absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--color-danger)] shadow-[0_0_4px_1px_rgba(255,84,112,0.7)]"
            style={pos}
          />
        );
      })}

      <span
        className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--color-gold)] shadow-[0_0_6px_2px_rgba(255,200,80,0.7)]"
        style={pct(playerPos.x, playerPos.y, map)}
      />
    </button>
  );
}
