import type { Card, MonsterRole, MonsterRosterEntry, MonsterTier, Skill, SkillEffect } from '@/types';
import { SKILLS_BY_ID } from './skills';
import { MONSTER_ROSTER, statsFor } from './monsterRoster';

/**
 * Aetheria Monster Database — Role Skill Kits / Boss Signature Skills /
 * Tier Skills, ported onto the existing (already very rich) `SkillEffect`
 * vocabulary. Damage is baked PER MONSTER (Reference Dmg x this kit skill's
 * Dmg Mult, rounded) at moveset-build time, same "live formula, not a static
 * dump" philosophy as the stat system — retune a Dmg Mult here and every
 * monster using that Role skill updates automatically. %-of-own-HP self
 * effects (Bulwark Up, Mend, Silent Verdict) are similarly flattened to a
 * flat number per monster instance, since the engine's self-heal/self-shield
 * riders are flat by design.
 */

const TIER_ORDER: Record<MonsterTier, number> = { regular: 0, elite: 1, miniboss: 2, boss: 3 };

interface RoleSkillDef {
  slug: string;
  name: string;
  cost: number;
  dmgMult: number;
  unlocksAt: 'regular' | 'elite';
  desc: string;
  effect?: SkillEffect;
}

// ============================================================
// ROLE SKILL KITS — 10 roles, shared pool (~2-3 skills each). Every
// Regular/Elite/Mini-Boss monster's kit comes entirely from here by Role.
// ============================================================
export const ROLE_SKILL_KITS: Record<MonsterRole, RoleSkillDef[]> = {
  'Tank': [
    { slug: 'guard_strike', name: 'Guard Strike', cost: 1, dmgMult: 0.9, unlocksAt: 'regular', desc: 'No rider — basic attack.' },
    { slug: 'bulwark_up', name: 'Bulwark Up', cost: 1, dmgMult: 0, unlocksAt: 'regular', desc: 'Self-shield: +25% of own Final HP as Block.' },
    { slug: 'provoke', name: 'Provoke', cost: 2, dmgMult: 0.7, unlocksAt: 'elite', desc: 'TAUNT 1 round.', effect: { tauntRounds: 1 } },
  ],
  'Tactician': [
    { slug: 'probe_strike', name: 'Probe Strike', cost: 1, dmgMult: 0.9, unlocksAt: 'regular', desc: 'No rider — basic attack.' },
    { slug: 'unbalance', name: 'Unbalance', cost: 1, dmgMult: 0, unlocksAt: 'regular', desc: 'Target -10% Accuracy, 1 round.', effect: { targetAccDownPct: 0.10 } },
    { slug: 'exploit', name: 'Exploit', cost: 2, dmgMult: 1.1, unlocksAt: 'elite', desc: '+30% dmg vs targets with any active debuff.', effect: { dmgVsAnyDebuffPct: 0.30 } },
  ],
  'Healer': [
    { slug: 'weak_strike', name: 'Weak Strike', cost: 1, dmgMult: 0.7, unlocksAt: 'regular', desc: 'No rider — basic attack.' },
    { slug: 'mend', name: 'Mend', cost: 1, dmgMult: 0, unlocksAt: 'regular', desc: 'Self-heal 20% of own Final HP.' },
    { slug: 'rally', name: 'Rally', cost: 2, dmgMult: 0, unlocksAt: 'elite', desc: 'Heal lowest-HP ally in its group 25% of their Final HP.', effect: { healAllyLowestPctOfMaxHp: 0.25 } },
  ],
  'Damager': [
    { slug: 'strike', name: 'Strike', cost: 1, dmgMult: 1, unlocksAt: 'regular', desc: 'No rider — basic attack.' },
    { slug: 'heavy_blow', name: 'Heavy Blow', cost: 2, dmgMult: 1.3, unlocksAt: 'regular', desc: 'No rider — heavier hit.' },
    { slug: 'rending_blow', name: 'Rending Blow', cost: 2, dmgMult: 1.1, unlocksAt: 'elite', desc: 'Target -10% dmg dealt, 2 rounds.', effect: { targetDmgDownPct: 0.10, targetDmgDownRounds: 2 } },
  ],
  'Assassin': [
    { slug: 'quick_strike', name: 'Quick Strike', cost: 1, dmgMult: 1, unlocksAt: 'regular', desc: 'No rider — basic attack.' },
    { slug: 'ambush', name: 'Ambush', cost: 1, dmgMult: 1, unlocksAt: 'regular', desc: '+30% dmg if this monster acted first this round.', effect: { dmgIfActedFirstPct: 0.30 } },
    { slug: 'execute', name: 'Execute', cost: 2, dmgMult: 1.2, unlocksAt: 'elite', desc: '+50% dmg vs targets under 35% HP.', effect: { dmgVsLowHpActivePct: 0.50, lowHpThreshold: 0.35 } },
  ],
  'AoE Controller': [
    { slug: 'disrupt', name: 'Disrupt', cost: 1, dmgMult: 0.7, unlocksAt: 'regular', desc: 'No rider — basic attack.' },
    { slug: 'unnerving_roar', name: 'Unnerving Roar', cost: 2, dmgMult: 0.6, unlocksAt: 'elite', desc: 'AoE all enemies; each -10% Accuracy, 1 round.', effect: { enemyAccDown: 0.10 } },
  ],
  'AoE Damager': [
    { slug: 'cleave', name: 'Cleave', cost: 1, dmgMult: 0.7, unlocksAt: 'regular', desc: 'AoE all enemies, no rider.' },
    { slug: 'wide_slash', name: 'Wide Slash', cost: 2, dmgMult: 0.9, unlocksAt: 'elite', desc: 'AoE all enemies, no rider — wider hit.' },
  ],
  'Dodger': [
    { slug: 'nimble_strike', name: 'Nimble Strike', cost: 1, dmgMult: 0.9, unlocksAt: 'regular', desc: 'No rider — basic attack.' },
    { slug: 'evasive_step', name: 'Evasive Step', cost: 1, dmgMult: 0, unlocksAt: 'regular', desc: 'Self +15% Dodge, 1 round.', effect: { selfDodgeUpRound: 0.15 } },
  ],
  'Burst': [
    { slug: 'charge_strike', name: 'Charge Strike', cost: 1, dmgMult: 0.8, unlocksAt: 'regular', desc: 'No rider — basic attack.' },
    { slug: 'overload', name: 'Overload', cost: 2, dmgMult: 1.6, unlocksAt: 'elite', desc: 'No rider — high-variance burst hit.' },
  ],
  'Accuracy': [
    { slug: 'true_strike', name: 'True Strike', cost: 1, dmgMult: 1, unlocksAt: 'regular', desc: 'Cannot miss.', effect: { guaranteedHit: true } },
    { slug: 'pinpoint', name: 'Pinpoint', cost: 2, dmgMult: 1.2, unlocksAt: 'elite', desc: 'Ignores target Dodge entirely.', effect: { ignoreDodge: true } },
  ],
};
// AoE-flavored kit skills need the card-level `aoe` flag too (damage side of an AoE cast).
const AOE_SLUGS = new Set(['unnerving_roar', 'cleave', 'wide_slash']);

// ============================================================
// BOSS SIGNATURE SKILLS — 6 hand-authored, one per Boss (the only
// hand-authored damage numbers in the whole system besides the Dmg Mults above).
// ============================================================
interface BossSignatureDef { slug: string; name: string; cost: number; dmgMult: number; desc: string; effect?: SkillEffect; aoe?: boolean }
export const BOSS_SIGNATURE_SKILLS: Record<string, BossSignatureDef> = {
  'Ulvarion, the Hollow Crown': { slug: 'crownfall', name: 'Crownfall', cost: 4, dmgMult: 1.8, aoe: true, desc: 'AoE all enemies, cannot miss, each target Shred -10% dmg dealt 2 rounds.', effect: { guaranteedHit: true, targetDmgDownPct: 0.10, targetDmgDownRounds: 2 } },
  'Nyssandra, the Quiet Reign': { slug: 'silent_verdict', name: 'Silent Verdict', cost: 4, dmgMult: 1.2, desc: 'TAUNT all enemies + self-shield +40% of own Final HP.', effect: { tauntRounds: 1 } }, // selfShieldFlat added at build time (40% of own HP)
  'Korrigahn, the Endless Debt': { slug: 'debt_collection', name: 'Debt Collection', cost: 4, dmgMult: 1.3, desc: 'Target -20% dmg dealt AND -15% Accuracy, 2 rounds.', effect: { targetDmgDownPct: 0.20, targetDmgDownRounds: 2, targetAccDownPct: 0.15, targetAccDownRounds: 2 } },
  'Thessaline, the Last Vigil': { slug: 'vigils_embrace', name: "Vigil's Embrace", cost: 4, dmgMult: 0, desc: 'Heal self + both Underlings 30% of their own Final HP, cleanse all debuffs.', effect: { teamHealPctOfMaxHp: 0.30, cleanseTeam: true } },
  'Duskrend, the Marrowking': { slug: 'marrow_ruin', name: 'Marrow Ruin', cost: 4, dmgMult: 2, desc: "Ignores 20% of target's Shield.", effect: { shieldPiercePct: 0.20 } },
  'Velkhazor, the Unmaking': { slug: 'the_unmaking', name: 'The Unmaking', cost: 4, dmgMult: 1.5, desc: '+70% dmg vs targets under 40% HP.', effect: { dmgVsLowHpActivePct: 0.70, lowHpThreshold: 0.40 } },
};

// ============================================================
// TIER SKILLS — not Role-based, gated purely by Tier (+ 2 named exceptions).
// ============================================================
const FIELD_REVERSAL: { slug: string; name: string; cost: number; effect: SkillEffect } = {
  slug: 'field_reversal', name: 'Field Reversal', cost: 2, effect: { swapRandomFrontBack: true },
};
const RUINOUS_CHARGE: { slug: string; name: string; cost: number; effect: SkillEffect } = {
  slug: 'ruinous_charge', name: 'Ruinous Charge', cost: 5, effect: { channelKind: 'ruinousCharge' },
};
const RUINOUS_CHARGE_NAMES = new Set(['Korrigahn, the Endless Debt', 'Velkhazor, the Unmaking']);

function monsterSkillToCard(skill: Skill, element: MonsterRosterEntry['element']): Card {
  return {
    id: skill.id, el: element, type: skill.kind, cost: skill.cost ?? 0, name: skill.name,
    stat: skill.dmg ? `${skill.dmg} DMG${skill.aoe ? ' (ALL)' : ''}` : 'Utility',
    desc: skill.desc, isUltimate: false, kind: skill.kind, aoe: !!skill.aoe, effect: skill.effect ?? null, rank: 1,
  };
}

/** Builds one monster's full resolved Skill[] (basic attack + Role kit +
 *  Boss Signature + applicable Tier skills), damage baked from its own
 *  computed Reference Dmg, registers each into `MONSTER_SKILLS_BY_ID`. */
function buildMonsterSkills(entry: MonsterRosterEntry, registry: Record<string, Skill>): Skill[] {
  const stats = statsFor(entry);
  const skills: Skill[] = [];

  ROLE_SKILL_KITS[entry.role].forEach((def) => {
    if (TIER_ORDER[entry.tier] < (def.unlocksAt === 'elite' ? 1 : 0)) return;
    const effect = { ...def.effect };
    if (def.slug === 'bulwark_up') effect.selfShieldFlat = Math.round(stats.hp * 0.25);
    if (def.slug === 'mend') effect.healSelfFlat = Math.round(stats.hp * 0.20);
    skills.push({
      id: `${entry.name}::${def.slug}`, kind: def.dmgMult > 0 ? 'attack' : 'buff', branch: 'Monster', tier: 1,
      cost: def.cost, dmg: def.dmgMult > 0 ? Math.round(stats.dmg * def.dmgMult) : undefined,
      aoe: AOE_SLUGS.has(def.slug), maxRank: 1, prereqs: [], name: def.name,
      desc: def.desc, effect: Object.keys(effect).length ? effect : undefined,
    });
  });

  if (entry.tier === 'boss') {
    const sig = BOSS_SIGNATURE_SKILLS[entry.name];
    if (sig) {
      const effect = { ...sig.effect };
      if (sig.slug === 'silent_verdict') effect.selfShieldFlat = Math.round(stats.hp * 0.40);
      skills.push({
        id: `${entry.name}::${sig.slug}`, kind: sig.dmgMult > 0 ? 'attack' : 'buff', branch: 'Monster', tier: 1,
        cost: sig.cost, dmg: sig.dmgMult > 0 ? Math.round(stats.dmg * sig.dmgMult) : undefined,
        aoe: !!sig.aoe, maxRank: 1, prereqs: [], name: sig.name, desc: sig.desc,
        effect: Object.keys(effect).length ? effect : undefined,
      });
    }
  }

  if (entry.tier === 'miniboss' || entry.tier === 'boss') {
    skills.push({
      id: `${entry.name}::${FIELD_REVERSAL.slug}`, kind: 'buff', branch: 'Monster', tier: 1,
      cost: FIELD_REVERSAL.cost, maxRank: 1, prereqs: [], name: FIELD_REVERSAL.name,
      desc: 'Swaps a random Front-row player with a random Back-row player.', effect: FIELD_REVERSAL.effect,
    });
  }
  if (RUINOUS_CHARGE_NAMES.has(entry.name)) {
    skills.push({
      id: `${entry.name}::${RUINOUS_CHARGE.slug}`, kind: 'attack', branch: 'Monster', tier: 1,
      cost: RUINOUS_CHARGE.cost, maxRank: 1, prereqs: [], name: RUINOUS_CHARGE.name,
      desc: '2-round telegraphed lock-on — devastating if the target has no Block up.', effect: RUINOUS_CHARGE.effect,
    });
  }

  skills.forEach((s) => { registry[s.id] = s; });
  return skills;
}

export const MONSTER_SKILLS_BY_ID: Record<string, Skill> = {};
export const MONSTER_MOVESETS: Record<string, Card[]> = {};
MONSTER_ROSTER.forEach((entry) => {
  const skills = buildMonsterSkills(entry, MONSTER_SKILLS_BY_ID);
  MONSTER_MOVESETS[entry.name] = skills.map((s) => monsterSkillToCard(s, entry.element));
});

/** Merged registry `resolve.ts` looks skills up in — player skills (rank-scaled,
 *  shared per element) + monster skills (rank-fixed at 1, baked per monster). */
export const ALL_SKILLS_BY_ID: Record<string, Skill> = { ...SKILLS_BY_ID, ...MONSTER_SKILLS_BY_ID };
