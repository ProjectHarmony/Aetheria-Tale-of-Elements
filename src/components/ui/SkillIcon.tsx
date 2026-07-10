import type { Skill } from '@/types';

/** 16 procedural glyph motifs, colored via `currentColor` so they inherit whatever color wraps them. */
const GLYPHS: Record<string, string> = {
  flame: '<path d="M12 3C9 8 7.5 9.5 8 13c.4 2.8 1.8 4.5 4 4.5s3.6-1.7 4-4.5c.5-3.5-1-5-4-10z" fill="currentColor"/>',
  snow: '<g stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9"/></g>',
  shield: '<path d="M12 3l7 2.6V12c0 4.6-3.4 7.6-7 9-3.6-1.4-7-4.4-7-9V5.6z" fill="currentColor"/>',
  taunt: '<path d="M12 3l7 2.6V12c0 4.6-3.4 7.6-7 9-3.6-1.4-7-4.4-7-9V5.6z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 7v6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><circle cx="12" cy="16" r="1.4" fill="currentColor"/>',
  heal: '<path d="M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6z" fill="currentColor"/>',
  dodge: '<g stroke="currentColor" stroke-width="1.9" fill="none" stroke-linecap="round"><path d="M4 8c5-4 9 4 16 0M4 15c5-4 9 4 16 0"/></g>',
  crit: '<path d="M12 2l1.8 8.2L22 12l-8.2 1.8L12 22l-1.8-8.2L2 12l8.2-1.8z" fill="currentColor"/>',
  pierce: '<g stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 12h13"/></g><path d="M14 8l7 4-7 4z" fill="currentColor"/>',
  aoe: '<g fill="currentColor"><circle cx="6.5" cy="14" r="2.6"/><circle cx="12" cy="8" r="2.6"/><circle cx="17.5" cy="14" r="2.6"/></g>',
  multi: '<g stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M5 5l11 13M11 4l9 11"/></g>',
  bolt: '<path d="M13 2L5 13h6l-2 9 10-13h-6z" fill="currentColor"/>',
  speed: '<g stroke="currentColor" stroke-width="1.9" fill="none" stroke-linecap="round"><path d="M3 7h11c3 0 3-3.6 0-3.4M3 12h15c3 0 3 3.6 0 3.4M3 17h9"/></g>',
  skull: '<path d="M12 3a7 7 0 00-7 7c0 2.6 1.3 4.4 3 5.4V19h8v-3.6c1.7-1 3-2.8 3-5.4a7 7 0 00-7-7z" fill="currentColor"/><circle cx="9.4" cy="10.5" r="1.5" fill="black"/><circle cx="14.6" cy="10.5" r="1.5" fill="black"/>',
  cleanse: '<g stroke="currentColor" stroke-width="1.8" stroke-linecap="round" opacity=".55"><path d="M12 3v18M3 12h18M6 6l12 12M18 6L6 18"/></g><circle cx="12" cy="12" r="2.4" fill="currentColor"/>',
  eye: '<path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12z" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="2.6" fill="currentColor"/>',
  thorn: '<path d="M3 19L7.5 7l4.5 12L16.5 7 21 19" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
  cycle: '<g stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"><path d="M19 8a8 8 0 00-13.5-1.5M5 16a8 8 0 0013.5 1.5"/></g><path d="M5.5 2.5v4.5H10z" fill="currentColor"/><path d="M18.5 21.5V17H14z" fill="currentColor"/>',
  shred: '<path d="M12 3l7 2.6V12c0 4.6-3.4 7.6-7 9-3.6-1.4-7-4.4-7-9V5.6z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M10 5l3 5-4 3 5 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  droplet: '<path d="M12 3s-6 8-6 12a6 6 0 0012 0c0-4-6-12-6-12z" fill="currentColor"/>',
  leaf: '<path d="M5 19C5 9 13 4 20 4c0 8-7 16-15 15z" fill="currentColor"/>',
};

/** Picks the most relevant glyph for a skill based on its structured effect data (no text-parsing needed). */
export function pickSkillGlyph(skill: Skill): string {
  const e = skill.effect ?? {};
  if (skill.kind === 'ultimate') return 'crit';
  if (e.tauntRounds) return 'taunt';
  if (e.forceFavoredRound) return 'cycle';
  if (e.execFlatBonus || e.consumeBurnBonus) return 'skull';
  if (e.cleanseSelf || e.cleanseTeam) return 'cleanse';
  if (e.thornsFlat || e.thornsFlatUp) return 'thorn';
  if (e.pierce) return 'pierce';
  if (e.freezeChance || e.dmgVsFrozen || e.dmgVsFrozenPct || e.shatterFreeze) return 'snow';
  if (e.burnChance || e.dmgVsBurned || e.burnChanceUp || e.burnTickDmgUp || e.critVsBurnedPct) return 'flame';
  if (e.healAllyLowestPct || e.healAllyLowestFlat || e.healSelfFlat || e.healSelfPctOfDmg || e.healAdjacentAllyPctOfDmg || e.healUpPct || e.regenWhileShielded || e.teamRegenAmount) return 'heal';
  if (e.selfDodgeUpRound || e.selfDodgeBuff || e.dodgeUp || e.onDodgeShield || e.onDodgeRecoil || e.selfDodgeUpOnCastChance) return 'dodge';
  if (e.critChanceThisHit || e.critUpPct || e.critVsLowHpPct || e.critDmgUp) return 'crit';
  if (skill.aoe || e.aoeMode || e.aoeDmgUpPct) return 'aoe';
  if ((e.hits ?? 1) > 1 || e.multiHitDmgUpPct) return 'multi';
  if (e.energyGain || e.energyRefundOnKill || e.energyRefundChance || e.energyRefundOnAoEChance) return 'bolt';
  if (e.speedUp || e.dmgIfActedFirst || e.dmgUpWhileActedFirstPct || e.selfSpeedNextRound || e.targetSpeedDown) return 'speed';
  if (e.accUp || e.targetAccDownPct) return 'eye';
  if (e.shredPct || e.targetDmgDownPct) return 'shred';
  if (e.blockOnAttack || e.shieldSelfMult || e.teamBlock || e.shieldAllyLowestFlat || e.shieldAllyPctOfOwnShield || e.shieldBackRowAllyPctOfGain) return 'shield';
  const fallback: Record<string, string> = { fire: 'flame', water: 'droplet', earth: 'leaf', wind: 'dodge' };
  return fallback[skill.id.split('_')[0] ?? ''] ?? 'bolt';
}

export function SkillIcon({ skill, size = 20 }: { skill: Skill; size?: number }) {
  const glyph = GLYPHS[pickSkillGlyph(skill)] ?? GLYPHS.flame!;
  return <svg width={size} height={size} viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: glyph }} />;
}
