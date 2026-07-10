import { MAPS, mapIconFor } from '@/constants';

interface MinimapBadgeProps {
  mapId: string;
  visitedMaps: string[];
  onClick: () => void;
}

/** Corner "you are here" readout — click opens the full World Map modal.
 *  Aetheria has no per-region clusters/tiers, so this shows the current
 *  location's name + weather and world-wide exploration progress instead of
 *  the old per-territory "T{tier}/4" stat. */
export function MinimapBadge({ mapId, visitedMaps, onClick }: MinimapBadgeProps) {
  const map = MAPS[mapId];
  if (!map) return null;

  const totalMaps = Object.keys(MAPS).length;
  const title = `${mapIconFor(map)} ${map.name}`;
  const sub = `${map.weather ?? ''}${map.weather ? ' · ' : ''}${visitedMaps.length}/${totalMaps} explored`;

  return (
    <button
      onClick={onClick}
      className="flex min-w-[76px] flex-col items-center gap-0.5 rounded-[10px] border-[1.5px] border-white/20 bg-[#0a0610]/85 px-2.5 py-1.5 active:scale-95"
    >
      <span className="whitespace-nowrap text-[10px] font-extrabold text-[var(--color-gold)]">{title}</span>
      <span className="text-[7px] font-semibold text-white/45">{sub}</span>
      <span className="mt-0.5 whitespace-nowrap rounded-full bg-[#140e20]/70 px-1.5 py-0.5 text-[7px] font-extrabold text-white/50">Tap for map</span>
    </button>
  );
}
