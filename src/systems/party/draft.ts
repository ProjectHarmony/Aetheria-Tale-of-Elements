import type { MageState, Skill } from '@/types';
import { DEFAULT_STATS, meetsPrereqs, type StatKey } from '@/constants';

/**
 * Stat/skill points are staged here as the player taps +/- across the
 * panel, and only applied to the real MageState on a single explicit
 * Confirm — nothing is spent per click. Ported from the same draft model
 * built for the original game's Party screen (script.js mageDraft), now as
 * plain React component state instead of a module-level global.
 */
export interface MageDraft {
  stats: Record<StatKey, number>;
  ranks: Record<string, number>;
  statPointsUsed: number;
  skillPointsUsed: number;
}

export function createEmptyDraft(): MageDraft {
  const stats = {} as Record<StatKey, number>;
  (Object.keys(DEFAULT_STATS) as StatKey[]).forEach((k) => { stats[k] = 0; });
  return { stats, ranks: {}, statPointsUsed: 0, skillPointsUsed: 0 };
}

export function draftHasPending(draft: MageDraft): boolean {
  return draft.statPointsUsed > 0 || draft.skillPointsUsed > 0;
}

export function stageStatPoint(draft: MageDraft, key: StatKey, remaining: number): MageDraft {
  if (remaining <= 0) return draft;
  return { ...draft, stats: { ...draft.stats, [key]: draft.stats[key] + 1 }, statPointsUsed: draft.statPointsUsed + 1 };
}

export function unstageStatPoint(draft: MageDraft, key: StatKey): MageDraft {
  if (draft.stats[key] <= 0) return draft;
  return { ...draft, stats: { ...draft.stats, [key]: draft.stats[key] - 1 }, statPointsUsed: draft.statPointsUsed - 1 };
}

/** Current + staged-pending ranks merged, for prerequisite checks against the in-progress draft. */
export function effectiveRanks(mage: MageState, draft: MageDraft): Record<string, number> {
  const out: Record<string, number> = { ...mage.ranks };
  Object.keys(draft.ranks).forEach((id) => { out[id] = (out[id] || 0) + (draft.ranks[id] || 0); });
  return out;
}

/** Raising requires: points remaining, under the skill's own maxRank, and prerequisites met at the merged current+pending ranks. */
export function stageSkillRank(draft: MageDraft, mage: MageState, skill: Skill, skillPointsLeft: number): MageDraft {
  const pending = draft.ranks[skill.id] || 0;
  const currentRank = mage.ranks[skill.id] || 0;
  if (skillPointsLeft <= 0 || currentRank + pending >= skill.maxRank) return draft;
  if (!meetsPrereqs(skill, effectiveRanks(mage, draft))) return draft;
  return { ...draft, ranks: { ...draft.ranks, [skill.id]: pending + 1 }, skillPointsUsed: draft.skillPointsUsed + 1 };
}

/** Lowering is blocked if some other owned/pending skill in the same element still depends on this rank. */
export function unstageSkillRank(draft: MageDraft, mage: MageState, skill: Skill, elementSkills: Skill[]): MageDraft {
  const pending = draft.ranks[skill.id] || 0;
  if (pending <= 0) return draft;
  const ranksAfterLower = { ...effectiveRanks(mage, draft), [skill.id]: (mage.ranks[skill.id] || 0) + pending - 1 };
  const stillValid = elementSkills.every((other) => (ranksAfterLower[other.id] || 0) <= 0 || meetsPrereqs(other, ranksAfterLower));
  if (!stillValid) return draft;
  return { ...draft, ranks: { ...draft.ranks, [skill.id]: pending - 1 }, skillPointsUsed: draft.skillPointsUsed - 1 };
}

/** Commits a draft into the real mage state — permanent, mirrors the single Confirm action. */
export function applyDraft(m: MageState, draft: MageDraft): void {
  (Object.keys(draft.stats) as StatKey[]).forEach((k) => { m.stats[k] += draft.stats[k]; });
  Object.keys(draft.ranks).forEach((id) => {
    const delta = draft.ranks[id];
    if (delta) m.ranks[id] = (m.ranks[id] || 0) + delta;
  });
  m.statPoints -= draft.statPointsUsed;
  m.skillPoints -= draft.skillPointsUsed;
}
