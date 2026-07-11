import type { Card, Element, Hero, HeroPassives, MageState, Party, PassiveKnobKey, Skill } from '@/types';
import {
  DEFAULT_STATS,
  ELEMENTS_ALL,
  HERO_ACC,
  HERO_CRIT,
  HERO_DODGE,
  HERO_HP,
  HERO_NAMES,
  ENEMY_NAMES,
  LEVEL_GAP_XP_BONUS_MAX_MULT,
  LEVEL_GAP_XP_BONUS_PER_LEVEL,
  MAX_ENERGY,
  MAX_EQUIPPED_ACTIVES,
  MONSTER_MOVESETS,
  MONSTER_ROSTER_BY_NAME,
  MONSTER_SKILLS_BY_ID,
  PLAYER_ELEMENT_LEVEL,
  PLAYER_ELEMENT_RESIST_LEVEL,
  SKILL_POINTS_PER_LEVEL,
  SKILL_TREES,
  SPEED,
  STARTING_ENERGY,
  STAT_POINTS_PER_LEVEL,
  STAT_SCALE,
  skillToCard,
  statsFor,
  ultimateUnlocked,
} from '@/constants';
import { shuffleArray } from './deck';

/** A freshly created Lv1 mage starts with Level 1's own points already
 *  available (not just points earned from LEVELING UP past it) — otherwise
 *  a brand-new character has 0 skill points and their first battle is
 *  unplayable. That single starting skill point is auto-spent on the
 *  element's basic Root attack, so a new mage can fight immediately without
 *  a required trip to the skill tree first — `respecMage` (which refunds
 *  every point ever earned, including this one) is how a player would
 *  reallocate away from it if they want a different opener.
 *  `respecMage` mirrors this same "level x points-per-level" total. */
export function newMageState(el: Element): MageState {
  const basicSkill = SKILL_TREES[el].find((s) => s.kind === 'attack' && s.branch === 'Root');
  return {
    level: 1,
    xp: 0,
    statPoints: STAT_POINTS_PER_LEVEL,
    skillPoints: SKILL_POINTS_PER_LEVEL - (basicSkill ? 1 : 0),
    stats: { ...DEFAULT_STATS },
    ranks: basicSkill ? { [basicSkill.id]: 1 } : {},
    equipped: null,
  };
}

export function skillRank(mage: MageState, skillId: string): number {
  return mage.ranks[skillId] || 0;
}

/** Actives = attacks the mage has invested at least 1 point in and can put in their battle deck. */
export function unlockedActives(mage: MageState, el: Element) {
  return SKILL_TREES[el].filter((s) => s.kind === 'attack' && (mage.ranks[s.id] || 0) > 0);
}

export function equippedActives(mage: MageState, el: Element) {
  const pool = unlockedActives(mage, el);
  if (!mage.equipped) return pool.slice(0, MAX_EQUIPPED_ACTIVES);
  const set = pool.filter((s) => mage.equipped!.includes(s.id));
  return set.length ? set : pool.slice(0, MAX_EQUIPPED_ACTIVES);
}

const PASSIVE_KEYS: PassiveKnobKey[] = [
  'dmgUpPct', 'burnChanceUp', 'burnTickDmgUp', 'thornsFlatUp', 'regenWhileShielded',
  'healUpPct', 'overflowToShieldPct', 'dmgVsLowHpPct', 'critVsLowHpPct', 'critDmgUp',
  'critUpPct', 'critVsBurnedPct', 'dmgWhileShieldedPct', 'dmgUpWhileLowHpPct',
  'dmgUpWhileActedFirstPct', 'dmgReductionWhileLowHpPct', 'aoeDmgUpPct', 'multiHitDmgUpPct',
  'dmgVsFrozenPct', 'energyRefundOnAoEChance', 'dmgPer100Shield', 'onDodgeRecoil',
  'onDodgeShield', 'thornBurnDmgWhileShielded', 'thornBurnTicksWhileShielded', 'tauntShieldBonus',
];

interface DerivedStats {
  maxHp: number;
  speed: number;
  powMult: number;
  dodge: number;
  crit: number;
  acc: number;
  blockOnAttack: number;
  execBonus: number;
  reflect: number;
  dmgReduction: number;
  regen: number;
  passives: HeroPassives;
}

export function derivedStatsFor(el: Element, mage: MageState): DerivedStats {
  const s = mage.stats;
  const passiveSkills = SKILL_TREES[el].filter((k) => k.kind === 'passive' && (mage.ranks[k.id] || 0) > 0);

  const sum = (key: 'blockOnAttack' | 'execBonus' | 'reflect' | 'dmgReduction' | 'regen' | 'dodgeUp' | 'speedUp' | 'accUp' | 'maxHpUpPct' | PassiveKnobKey) =>
    passiveSkills.reduce((v, p) => v + (p.effect?.[key] || 0) * (mage.ranks[p.id] || 0), 0);

  // Thresholds are fixed cutoffs, not rank-scaled sums — take whichever owned passive defines one.
  const lowHpThreshold = passiveSkills.find((p) => p.effect?.lowHpThreshold !== undefined)?.effect?.lowHpThreshold ?? 0.5;

  const passives = {} as HeroPassives;
  PASSIVE_KEYS.forEach((key) => { passives[key] = sum(key); });
  passives.lowHpThreshold = lowHpThreshold;

  return {
    maxHp: Math.round((HERO_HP[el] + (s.vit - 5) * STAT_SCALE.vit) * (1 + sum('maxHpUpPct'))),
    speed: SPEED[el] + (s.cs - 5) * STAT_SCALE.cs + sum('speedUp'),
    powMult: 1 + (s.pow - 5) * STAT_SCALE.pow,
    dodge: Math.min(0.6, HERO_DODGE[el] + (s.dge - 5) * STAT_SCALE.dge + sum('dodgeUp')),
    crit: Math.min(0.6, HERO_CRIT[el] + (s.crt - 5) * STAT_SCALE.crt),
    acc: Math.min(1, HERO_ACC[el] + (s.acc - 5) * STAT_SCALE.acc + sum('accUp')),
    blockOnAttack: sum('blockOnAttack'),
    execBonus: sum('execBonus'),
    reflect: sum('reflect'),
    dmgReduction: sum('dmgReduction'),
    regen: sum('regen'),
    passives,
  };
}

/** Builds player Hero instances + the rank-aware runtime card pool for this battle. */
export function buildPlayerTeamFromParty(party: Party): { heroes: Hero[]; runtimeCards: Record<string, Card> } {
  const runtimeCards: Record<string, Card> = {};
  const heroes = party.picks.map((el, i) => {
    const mage = party.mages[el];
    if (!mage) throw new Error(`Party is missing mage state for element "${el}"`);
    const d = derivedStatsFor(el, mage);
    const actives = equippedActives(mage, el);
    actives.forEach((s) => { runtimeCards[s.id] = skillToCard(s, skillRank(mage, s.id), el); });
    const ult = SKILL_TREES[el].find((s) => s.kind === 'ultimate')!;
    const hasUltimate = ultimateUnlocked(mage, el);
    if (hasUltimate) runtimeCards[ult.id] = skillToCard(ult, skillRank(mage, ult.id) || 1, el);

    const hero: Hero = {
      id: 'p' + i,
      name: HERO_NAMES[el],
      el,
      row: party.placements[el] ?? (i === 0 ? 'front' : 'back'),
      level: mage.level,
      hp: d.maxHp,
      maxHp: d.maxHp,
      alive: true,
      block: 0,
      speed: d.speed,
      powMult: d.powMult,
      dodge: d.dodge,
      crit: d.crit,
      acc: d.acc,
      elementLevel: PLAYER_ELEMENT_LEVEL,
      elementResistLevel: PLAYER_ELEMENT_RESIST_LEVEL,
      blockOnAttack: d.blockOnAttack,
      execBonus: d.execBonus,
      reflect: d.reflect,
      dmgReduction: d.dmgReduction,
      regen: d.regen,
      passives: d.passives,
      critDmgMult: 1.5,
      dmgUpRound: 0,
      dodgeUpRound: 0,
      speedNextRound: 0,
      accDownRound: 0,
      hasUltimate,
      deck: shuffleArray(actives.map((s) => s.id)),
      hand: [],
      discard: [],
      pendingDiscard: [],
    };
    return hero;
  });
  return { heroes, runtimeCards };
}

const ZERO_PASSIVES: HeroPassives = PASSIVE_KEYS.reduce((acc, k) => { acc[k] = 0; return acc; }, {} as HeroPassives);
ZERO_PASSIVES.lowHpThreshold = 0.5;

interface EnemyBaselineOptions {
  elementLevel?: number;
  elementResistLevel?: number;
  energy?: number;
  maxEnergy?: number;
  moveset?: Card[];
}

export function enemyBaseline(el: Element, opts: EnemyBaselineOptions = {}) {
  return {
    block: 0,
    speed: SPEED[el],
    powMult: 1,
    dodge: HERO_DODGE[el],
    crit: HERO_CRIT[el],
    acc: HERO_ACC[el],
    elementLevel: opts.elementLevel ?? PLAYER_ELEMENT_LEVEL,
    elementResistLevel: opts.elementResistLevel ?? PLAYER_ELEMENT_RESIST_LEVEL,
    energy: opts.energy ?? STARTING_ENERGY,
    maxEnergy: opts.maxEnergy ?? MAX_ENERGY,
    moveset: opts.moveset ?? [],
    blockOnAttack: 0,
    execBonus: 0,
    reflect: 0,
    dmgReduction: 0,
    regen: 0,
    passives: { ...ZERO_PASSIVES },
    critDmgMult: 1.5,
    dmgUpRound: 0,
    dodgeUpRound: 0,
    speedNextRound: 0,
    accDownRound: 0,
  };
}

let genericEnemySkillSeq = 0;

/** A single flat "Strike" for enemies that aren't a real Aetheria Database
 *  monster (PvP/demo battles) — registered into the shared skill registry
 *  per-instance since damage is looked up by id, same pattern the real
 *  roster uses, just built at battle-start time instead of module load. */
function genericEnemyCard(dmg: number): Card {
  const id = `generic::strike::${++genericEnemySkillSeq}`;
  const skill: Skill = { id, kind: 'attack', branch: 'Generic', tier: 1, cost: 1, dmg, maxRank: 1, prereqs: [], name: 'Strike', desc: 'A basic attack.' };
  MONSTER_SKILLS_BY_ID[id] = skill;
  return { id, el: 'fire', type: 'attack', cost: 1, name: 'Strike', stat: `${dmg} DMG`, desc: skill.desc, isUltimate: false, kind: 'attack', aoe: false, effect: null, rank: 1 };
}

/** Random 3-element enemy team, mildly scaled to the player's average level
 *  (PvP/demo pacing) — not a real Aetheria Database monster, so it gets a
 *  single generic "Strike" rather than a Role kit. */
export function buildRandomEnemyTeam(avgPartyLevel: number): Hero[] {
  const shuffled = [...ELEMENTS_ALL].sort(() => Math.random() - 0.5);
  const picks = shuffled.slice(0, 3);
  const useOneFront = Math.random() < 0.5;
  const frontCount = useOneFront ? 1 : 2;
  const frontEls = new Set(picks.slice(0, frontCount));
  const scale = 1 + 0.05 * (avgPartyLevel - 1);
  return picks.map((el, i) => {
    const dmg = Math.round(110 * scale);
    const card = genericEnemyCard(dmg);
    card.el = el;
    const hp = Math.round(HERO_HP[el] * scale);
    return {
      id: 'e' + i,
      name: ENEMY_NAMES[el],
      el,
      row: (frontEls.has(el) ? 'front' : 'back') as Hero['row'],
      hp,
      maxHp: hp,
      alive: true,
      ...enemyBaseline(el, { moveset: [card] }),
    };
  });
}

/** XP reward per monster, by Tier. */
const TIER_XP: Record<string, number> = { regular: 60, elite: 120, miniboss: 200, boss: 400 };

/** Bonus multiplier for beating something above the party's own level —
 *  +15% per level of gap, capped at 4x so an extreme mismatch can't be
 *  farmed for an absurd windfall. A monster AT or BELOW party level pays
 *  the plain tier reward (never reduced). */
export function xpGapMultiplier(monsterLevel: number, partyLevel: number): number {
  const gap = Math.max(0, monsterLevel - partyLevel);
  return Math.min(LEVEL_GAP_XP_BONUS_MAX_MULT, 1 + gap * LEVEL_GAP_XP_BONUS_PER_LEVEL);
}

/**
 * Builds a squad from an explicit list of Aetheria Database monster names —
 * a solo field monster (1 name), or a Boss + its 2 Underlings (3 names,
 * always exactly 3 per the Boss Underlings design, matching the player's
 * 3v3). Stats/skills come entirely from the roster + formulas + skill kits;
 * nothing here is hand-scaled — the roster's own fixed Level/Tier already
 * encode difficulty. `partyLevel` only feeds the XP-reward's level-gap
 * bonus (see `xpGapMultiplier`) — it never touches enemy stats.
 */
export function buildEncounterEnemyTeam(monsterNames: string[], partyLevel = 1): { enemies: Hero[]; xpReward: number; dmgScale: number } {
  const known = monsterNames.map((n) => MONSTER_ROSTER_BY_NAME[n]).filter((m): m is NonNullable<typeof m> => !!m);
  if (known.length === 0) return { enemies: buildRandomEnemyTeam(1), xpReward: 60, dmgScale: 1 };

  const threeUp = known.length === 3;
  const enemies: Hero[] = known.map((entry, i) => {
    const stats = statsFor(entry);
    const moveset = MONSTER_MOVESETS[entry.name] ?? [];
    const row: Hero['row'] = threeUp ? (i === 1 ? 'back' : 'front') : 'front';
    return {
      id: 'e' + i,
      name: entry.name,
      el: entry.element,
      row,
      level: entry.level,
      hp: stats.hp,
      maxHp: stats.hp,
      alive: true,
      ...enemyBaseline(entry.element, {
        elementLevel: stats.elementLevel,
        elementResistLevel: stats.elementResistLevel,
        moveset,
      }),
      speed: stats.speed,
      dodge: stats.dodge / 100,
      crit: stats.crit / 100,
      acc: stats.accuracy / 100,
    };
  });

  const xpReward = known.reduce((sum, m) => sum + Math.round((TIER_XP[m.tier] ?? 60) * xpGapMultiplier(m.level, partyLevel)), 0);
  return { enemies, xpReward, dmgScale: 1 };
}
