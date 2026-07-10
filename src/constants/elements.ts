import type { Element, ElementMeta, Matchup } from '@/types';
import { netCounterMult } from './monsterFormulas';

export const ELEMENTS_ALL: Element[] = ['fire', 'water', 'earth', 'wind'];

export const ELEMENT_META: Record<Element, ElementMeta> = {
  fire: { icon: '🔥', color: 'var(--color-fire)', beats: 'earth' },
  water: { icon: '🌊', color: 'var(--color-water)', beats: 'fire' },
  earth: { icon: '🌱', color: 'var(--color-earth)', beats: 'wind' },
  wind: { icon: '🌪️', color: 'var(--color-wind)', beats: 'water' },
};

export function matchup(attacker: Element, defender: Element): Matchup {
  if (ELEMENT_META[attacker].beats === defender) return 'favored';
  if (ELEMENT_META[defender].beats === attacker) return 'resisted';
  return 'neutral';
}

/** Default counter-depth for player Heroes — Element Lv3 / Resist Lv3 nets
 *  to exactly 1.2x on the `favored` side (today's flat matchup rate), so
 *  player-side balance is unchanged by the per-Role counter-depth system. */
export const PLAYER_ELEMENT_LEVEL = 3;
export const PLAYER_ELEMENT_RESIST_LEVEL = 3;

/** Flat penalty for attacking into a losing matchup — unaffected by either
 *  side's Element Level, since the Aetheria README only defines exposure
 *  depth for the "being hit by your counter" (favored-for-attacker) direction. */
const RESISTED_MULT = 0.8;

/**
 * The one shared matchup-multiplier function — replaces the flat 1.2x/0.8x
 * that used to be hardcoded independently in combat.ts and resolve.ts.
 * `favored`: scales by the TARGET's exposure-vs-resist net multiplier (the
 * README's own formula — how exposed the target is to its counter-element).
 * `resisted`: stays the original flat 0.8x.
 */
export function elementCounterMult(result: Matchup, targetElementLevel = PLAYER_ELEMENT_LEVEL, targetElementResistLevel = PLAYER_ELEMENT_RESIST_LEVEL): number {
  if (result === 'favored') return netCounterMult(targetElementLevel, targetElementResistLevel);
  if (result === 'resisted') return RESISTED_MULT;
  return 1;
}
