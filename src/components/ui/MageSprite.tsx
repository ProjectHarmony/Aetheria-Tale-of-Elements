import type { Element } from '@/types';

interface MageSpriteProps {
  el: Element;
  alive?: boolean;
}

const PALETTE: Record<Element, { core: string; coreGlow: string; robe: string; trim: string }> = {
  fire: { core: '#ff7a4d', coreGlow: '#ffd4bf', robe: '#3a2338', trim: '#ff9166' },
  water: { core: '#5fd0ef', coreGlow: '#c8efff', robe: '#20334a', trim: '#7fdcff' },
  earth: { core: '#8fd67a', coreGlow: '#d4f5d0', robe: '#263a24', trim: '#a4e08e' },
  wind: { core: '#c9a8ff', coreGlow: '#e4d6ff', robe: '#2d2648', trim: '#d6bbff' },
};

/**
 * A small illustrated "elemental spirit" mascot — the shared avatar for a
 * mage everywhere the game shows one (battle, roster, party, hub), not just
 * an emoji. Same robed-silhouette-plus-glowing-core shape for every element
 * (so the four read as one cohesive cast), with per-element accent shapes
 * (flame wisps / droplets / crystal shards / wind swirls) doing the work of
 * telling them apart at a glance.
 */
export function MageSprite({ el, alive = true }: MageSpriteProps) {
  const p = PALETTE[el];
  return (
    <svg viewBox="0 0 64 64" className="h-full w-full" style={{ opacity: alive ? 1 : 0.5 }}>
      <defs>
        <radialGradient id={`aura-${el}`} cx="50%" cy="42%" r="55%">
          <stop offset="0%" stopColor={p.coreGlow} stopOpacity="0.55" />
          <stop offset="100%" stopColor={p.coreGlow} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`robe-${el}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={p.robe} />
          <stop offset="100%" stopColor="#150f22" />
        </linearGradient>
        <radialGradient id={`core-${el}`} cx="50%" cy="35%" r="65%">
          <stop offset="0%" stopColor={p.coreGlow} />
          <stop offset="55%" stopColor={p.core} />
          <stop offset="100%" stopColor={p.core} stopOpacity="0.6" />
        </radialGradient>
      </defs>

      <circle cx="32" cy="30" r="26" fill={`url(#aura-${el})`} />

      {/* robe body */}
      <path
        d="M32 14c-3 0-5.5 2.2-6.4 5.4L18 52c-0.6 2.2 1 4.3 3.2 4.3h21.6c2.2 0 3.8-2.1 3.2-4.3l-7.6-32.6C37.5 16.2 35 14 32 14Z"
        fill={`url(#robe-${el})`}
        stroke={p.trim}
        strokeWidth="1.4"
        strokeOpacity="0.55"
      />
      {/* hem trim */}
      <path d="M20 47.5h24" stroke={p.trim} strokeWidth="1.6" strokeOpacity="0.5" strokeLinecap="round" />

      {/* hood */}
      <path
        d="M32 8c-6.6 0-11.6 5.2-11.6 11.8 0 4 2 7.2 5.4 9.4 1.4-3 3.6-4.6 6.2-4.6s4.8 1.6 6.2 4.6c3.4-2.2 5.4-5.4 5.4-9.4C43.6 13.2 38.6 8 32 8Z"
        fill={`url(#robe-${el})`}
        stroke={p.trim}
        strokeWidth="1.4"
        strokeOpacity="0.6"
      />
      {/* face shadow — no facial detail, keeps it mascot-like rather than uncanny */}
      <ellipse cx="32" cy="23" rx="6.5" ry="5.5" fill="#0b0712" fillOpacity="0.65" />

      {/* held elemental core */}
      <circle cx="32" cy="38" r="6.5" fill={`url(#core-${el})`} />
      <circle cx="32" cy="38" r="9" fill={p.core} fillOpacity="0.18" />

      {/* per-element accent shapes */}
      {el === 'fire' && (
        <g fill={p.core} opacity="0.9">
          <path d="M22 20c1.5 2 1 4-0.5 5s-3-0.2-2.7-2.2C19 21 20.5 19.5 22 20Z" />
          <path d="M45 24c1.2 1.7 0.6 3.6-1 4.3s-2.8-0.6-2.2-2.4c0.5-1.5 2-2.6 3.2-1.9Z" />
        </g>
      )}
      {el === 'water' && (
        <g fill={p.core} opacity="0.9">
          <path d="M21 18c1.6 2 1.6 4.4 0 5.6-1.6 1.2-3.6 0.2-3.4-1.8 0.2-2 1.8-4.3 3.4-3.8Z" />
          <path d="M46 22c1.4 1.8 1.4 4 0 5-1.4 1-3.2 0.1-3-1.6 0.2-1.8 1.6-3.9 3-3.4Z" />
        </g>
      )}
      {el === 'earth' && (
        <g fill={p.core} opacity="0.9">
          <path d="M18 22l3-4 3 4-3 4z" />
          <path d="M43 25l2.6-3.6 2.6 3.6-2.6 3.6z" />
        </g>
      )}
      {el === 'wind' && (
        <g stroke={p.core} strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.9">
          <path d="M15 21c3-1.4 6-1.4 8 0.6" />
          <path d="M44 26c2.6-1.2 5.2-1.2 7 0.5" />
        </g>
      )}
    </svg>
  );
}
