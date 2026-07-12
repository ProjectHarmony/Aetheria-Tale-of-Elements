import type { Element, MageState, Party } from '@/types';
import {
  DEFAULT_STATS,
  MAX_MAGE_LEVEL,
  PVP_UNLOCK_LEVEL,
  SKILL_POINTS_PER_LEVEL,
  STAT_POINTS_PER_LEVEL,
  xpNeededForLevel,
} from '@/constants';
import { derivedStatsFor } from '@/systems/battle';

export interface LevelUp {
  el: Element;
  level: number;
}

/** Grants XP to every party mage in place; returns a summary of level-ups for the UI. */
export function grantPartyXp(party: Party, amount: number): LevelUp[] {
  const ups: LevelUp[] = [];
  party.picks.forEach((el) => {
    const m = party.mages[el];
    if (!m || m.level >= MAX_MAGE_LEVEL) return;
    m.xp += amount;
    let leveled = false;
    while (m.level < MAX_MAGE_LEVEL && m.xp >= xpNeededForLevel(m.level)) {
      m.xp -= xpNeededForLevel(m.level);
      m.level += 1;
      m.statPoints += STAT_POINTS_PER_LEVEL;
      m.skillPoints += SKILL_POINTS_PER_LEVEL;
      ups.push({ el, level: m.level });
      leveled = true;
    }
    if (m.level >= MAX_MAGE_LEVEL) m.xp = 0;
    // Leveling up tops off HP — a level gained mid-adventure shouldn't leave
    // a mage stuck at whatever fraction of the OLD max they were carrying
    // (Pokemon-style HP otherwise persists untouched between fights).
    if (leveled) m.currentHp = derivedStatsFor(el, m).maxHp;
  });
  return ups;
}

export function partyPvpUnlocked(party: Party | null): boolean {
  if (!party) return false;
  return party.picks.every((el) => (party.mages[el]?.level ?? 0) >= PVP_UNLOCK_LEVEL);
}

export function avgPartyLevel(party: Party | null): number {
  if (!party) return 1;
  const levels = party.picks.map((el) => party.mages[el]?.level ?? 1);
  return levels.reduce((a, b) => a + b, 0) / levels.length;
}

/** Fully resets one mage's stats AND skills, refunding every point ever
 *  earned — including Level 1's own points (see `newMageState`), not just
 *  points from leveling up past it. */
export function respecMage(m: MageState, _el: Element): void {
  const totalStatPts = m.level * STAT_POINTS_PER_LEVEL;
  const totalSkillPts = m.level * SKILL_POINTS_PER_LEVEL;
  m.stats = { ...DEFAULT_STATS };
  m.statPoints = totalStatPts;
  m.ranks = {};
  m.skillPoints = totalSkillPts;
  m.equipped = null;
}
