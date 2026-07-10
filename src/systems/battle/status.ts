import type { Hero } from '@/types';
import type { StatusKind } from '@/constants/status';

export interface HeroStatus {
  kind: StatusKind;
  amount?: number;
}

/**
 * Status chips are DERIVED fresh from the hero's real numeric fields, not
 * tracked in a separate array that could drift from what's actually
 * affecting combat math. dmgUpRound/dodgeUpRound/speedSurge are shared
 * fields — sign decides whether it renders as the buff or debuff variant.
 */
export function getHeroStatuses(h: Hero): HeroStatus[] {
  const list: HeroStatus[] = [];
  if (h.dmgUpRound > 0) list.push({ kind: 'dmgUp' });
  if (h.dmgUpRound < 0) list.push({ kind: 'dmgDown' });
  if (h.dodgeUpRound > 0) list.push({ kind: 'dodgeUp' });
  if (h.dodgeUpRound < 0) list.push({ kind: 'dodgeDown' });
  if ((h.speedSurge ?? 0) > 0) list.push({ kind: 'speedUp' });
  if ((h.speedSurge ?? 0) < 0) list.push({ kind: 'speedDown' });
  if (h.accDownRound) list.push({ kind: 'accDown' });
  if (h.block > 0) list.push({ kind: 'shielded', amount: h.block });
  if (h.blockOnAttack) list.push({ kind: 'blockOnAttack' });
  if (h.dmgReduction) list.push({ kind: 'dmgReduction' });
  if (h.reflect) list.push({ kind: 'reflect' });
  if (h.regen) list.push({ kind: 'regen' });
  if (h.burn) list.push({ kind: 'burning', amount: h.burn.dmg });
  if (h.frozen) list.push({ kind: 'frozen' });
  if ((h.tauntRoundsLeft ?? 0) > 0) list.push({ kind: 'taunting' });
  if ((h.vulnRoundsLeft ?? 0) > 0) list.push({ kind: 'vulnerable', amount: h.vulnPctRound });
  if ((h.thornsRoundsLeft ?? 0) > 0) list.push({ kind: 'thorns', amount: h.thornsFlat });
  if (h.forceFavoredRound) list.push({ kind: 'attuned' });
  return list;
}
