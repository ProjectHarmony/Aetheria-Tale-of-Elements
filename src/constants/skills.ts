import type { Element, MageState, Skill } from '@/types';

/**
 * v3.1 branching skill tree — hand-designed (see the "Two Elements Skill
 * Tree v3.1" planner) and ported here with real battle-engine mechanics
 * wired to every effect. Progression is prerequisite-gated, not level-gated:
 * Root (tier 1) skills are always raisable; tier 2-4 skills require a
 * specific sibling/parent skill at a specific rank (see `prereqs`); the
 * Ultimate additionally requires mage level >= 15 AND at least 1 rank in any
 * of that element's three tier-4 skills (see `ultimateUnlocked`).
 *
 * Authoring rules used throughout (kept consistent rather than special-cased
 * per skill):
 *  - Passive numeric knobs scale linearly with rank: value = coefficient *
 *    rank. Where the source flavor text states both a flat "base" and a
 *    "+X per level" (e.g. "8+2/lv"), the per-level number is used as the
 *    coefficient and the flat prefix is treated as non-binding flavor —
 *    this keeps one rule for the whole tree instead of guessing an implied
 *    base offset the source never actually specifies.
 *  - Active-skill rider effects (heals, shields, debuffs, taunts, etc.) are
 *    flat regardless of rank — only the skill's own `dmg` scales with rank,
 *    via the universal skillDamage() formula below.
 *  - A few passives describe mechanics our engine doesn't model (shield
 *    never decays between rounds here, so "retain N% of shield into next
 *    round" is moot); those are left as flavor-only (no `effect`) rather
 *    than bolting on one-off plumbing for a single skill.
 */

function prereq(skillId: string, rank: number) {
  return { skillId, rank };
}

export const SKILL_TREES: Record<Element, Skill[]> = {
  fire: [
    // --- Root ---
    { id: 'fire_spark', kind: 'attack', branch: 'Root', tier: 1, cost: 1, dmg: 60, maxRank: 5, prereqs: [], name: 'Spark', desc: 'A quick bolt of flame — 30% chance to set the target Burning.', effect: { burnChance: 0.3, burnDmg: 10, burnTicks: 2 } },
    { id: 'fire_cinder_flick', kind: 'attack', branch: 'Root', tier: 1, cost: 1, dmg: 45, maxRank: 5, prereqs: [], name: 'Cinder Flick', desc: 'A snapping ember jab. Refunds 1 Energy if it finishes the target.', effect: { energyRefundOnKill: 1 } },
    { id: 'fire_pyric_sense', kind: 'passive', branch: 'Root', tier: 1, maxRank: 5, prereqs: [prereq('fire_spark', 1)], name: 'Pyric Sense', desc: 'Sharpens your aim with flame — bonus Accuracy per rank.', effect: { accUp: 0.02 } },
    // --- Incineration (nuker) ---
    { id: 'fire_flame_shot', kind: 'attack', branch: 'Incineration', tier: 2, cost: 2, dmg: 115, maxRank: 5, prereqs: [prereq('fire_spark', 3)], name: 'Flame Shot', desc: 'A focused burst of fire that sears Burning targets harder.', effect: { dmgVsBurned: 18 } },
    { id: 'fire_ember_volley', kind: 'attack', branch: 'Incineration', tier: 2, cost: 1, dmg: 45, maxRank: 5, prereqs: [prereq('fire_spark', 2)], name: 'Ember Volley', desc: 'Three quick embers, each with a chance to set the target Burning.', effect: { hits: 3, burnChance: 0.1 } },
    { id: 'fire_heat_haze', kind: 'attack', branch: 'Incineration', tier: 2, cost: 1, dmg: 50, maxRank: 5, prereqs: [prereq('fire_spark', 2)], name: 'Heat Haze', desc: "A blinding shimmer of heat — the target's Accuracy drops for a round.", effect: { targetAccDownPct: 0.05 } },
    { id: 'fire_pyromania', kind: 'passive', branch: 'Incineration', tier: 2, maxRank: 5, prereqs: [prereq('fire_spark', 2)], name: 'Pyromania', desc: 'Your fire burns hotter — bonus damage on all your attacks, per rank.', effect: { dmgUpPct: 0.04 } },
    { id: 'fire_flash_burn', kind: 'attack', branch: 'Incineration', tier: 3, cost: 2, dmg: 90, maxRank: 5, prereqs: [prereq('fire_spark', 3)], name: 'Flash Burn', desc: 'Guaranteed to set the target ablaze, though only briefly.', effect: { burnChance: 1, burnDmg: 6, burnTicks: 1 } },
    { id: 'fire_backdraft', kind: 'attack', branch: 'Incineration', tier: 3, cost: 2, dmg: 80, maxRank: 5, prereqs: [prereq('fire_flame_shot', 2)], name: 'Backdraft', desc: 'Punishes a target that struck you last round with extra damage.', effect: { dmgVsAttackedMeLastRound: 30 } },
    { id: 'fire_stoke', kind: 'passive', branch: 'Incineration', tier: 3, maxRank: 5, prereqs: [prereq('fire_pyromania', 2)], name: 'Stoke', desc: 'Stokes your embers — bonus Burn chance on all your attacks, per rank.', effect: { burnChanceUp: 0.05 } },
    { id: 'fire_inferno_wave', kind: 'attack', branch: 'Incineration', tier: 3, cost: 4, dmg: 75, aoe: true, maxRank: 5, prereqs: [prereq('fire_flame_shot', 3)], name: 'Inferno Wave', desc: 'A wave of fire that scorches every enemy and may set them Burning.', effect: { burnChance: 0.15 } },
    { id: 'fire_combustion', kind: 'passive', branch: 'Incineration', tier: 3, maxRank: 5, prereqs: [prereq('fire_pyromania', 3)], name: 'Combustion', desc: 'Your Burns smolder fiercer — bonus tick damage on Burns you inflict, per rank.', effect: { burnTickDmgUp: 3 } },
    { id: 'fire_scorched_earth', kind: 'attack', branch: 'Incineration', tier: 4, cost: 2, dmg: 55, maxRank: 5, prereqs: [prereq('fire_inferno_wave', 2)], name: 'Scorched Earth', desc: 'Scorches the entire enemy front row at once.', effect: { aoeMode: 'front' } },
    { id: 'fire_dragon_flame', kind: 'attack', branch: 'Incineration', tier: 4, cost: 5, dmg: 280, maxRank: 5, prereqs: [prereq('fire_flame_shot', 3), prereq('fire_combustion', 2)], name: 'Dragon Flame', desc: "A devastating blast that consumes any Burn on the target for a huge bonus.", effect: { consumeBurnBonus: 60 } },
    // --- Cinderguard (fire tank) ---
    { id: 'fire_ashen_skin', kind: 'passive', branch: 'Cinderguard', tier: 2, maxRank: 5, prereqs: [prereq('fire_spark', 2)], name: 'Ashen Skin', desc: 'Ash hardens into armor — bonus Block whenever you land an attack, per rank.', effect: { blockOnAttack: 3 } },
    { id: 'fire_coal_shield', kind: 'attack', branch: 'Cinderguard', tier: 2, cost: 1, dmg: 40, maxRank: 5, prereqs: [prereq('fire_ashen_skin', 2)], name: 'Coal Shield', desc: 'Triples the Block you gain from this cast.', effect: { shieldSelfMult: 3 } },
    { id: 'fire_smolder_slam', kind: 'attack', branch: 'Cinderguard', tier: 2, cost: 2, dmg: 85, maxRank: 5, prereqs: [prereq('fire_ashen_skin', 2)], name: 'Smolder Slam', desc: 'Doubles the Block you gain from this cast.', effect: { shieldSelfMult: 2 } },
    { id: 'fire_kindled_resolve', kind: 'attack', branch: 'Cinderguard', tier: 3, cost: 1, dmg: 45, maxRank: 5, prereqs: [prereq('fire_smolder_slam', 2)], name: 'Kindled Resolve', desc: 'Burns away your own Burn and Freeze.', effect: { cleanseSelf: true } },
    { id: 'fire_brand_of_ash', kind: 'attack', branch: 'Cinderguard', tier: 3, cost: 2, dmg: 75, maxRank: 5, prereqs: [prereq('fire_smolder_slam', 2)], name: 'Brand of Ash', desc: "Brands the target with ash, weakening their next attack.", effect: { targetDmgDownPct: 0.1 } },
    { id: 'fire_warm_embers', kind: 'passive', branch: 'Cinderguard', tier: 3, maxRank: 5, prereqs: [prereq('fire_ashen_skin', 2)], name: 'Warm Embers', desc: 'Embers keep you warm while shielded — regenerate HP each round while you hold Block, per rank.', effect: { regenWhileShielded: 4 } },
    { id: 'fire_cauterize', kind: 'attack', branch: 'Cinderguard', tier: 3, cost: 3, dmg: 120, maxRank: 5, prereqs: [prereq('fire_smolder_slam', 3)], name: 'Cauterize', desc: 'Cauterizes your wounds, healing a share of the damage dealt and burning away your own Burn.', effect: { healSelfPctOfDmg: 0.25, cleanseSelf: true } },
    { id: 'fire_furnace_heart', kind: 'passive', branch: 'Cinderguard', tier: 3, maxRank: 5, prereqs: [prereq('fire_ashen_skin', 3)], name: 'Furnace Heart', desc: 'A furnace of a heart — bonus max HP per rank.', effect: { maxHpUpPct: 0.02 } },
    { id: 'fire_ember_bulwark', kind: 'attack', branch: 'Cinderguard', tier: 4, cost: 2, dmg: 70, maxRank: 5, prereqs: [prereq('fire_cauterize', 2)], name: 'Ember Bulwark', desc: 'Bonus damage equal to a quarter of your current Block.', effect: { dmgPctOfShield: 0.25 } },
    { id: 'fire_molten_carapace', kind: 'passive', branch: 'Cinderguard', tier: 4, maxRank: 5, prereqs: [prereq('fire_smolder_slam', 2)], name: 'Molten Carapace', desc: 'While shielded, anyone who lands a hit on you catches fire, per rank.', effect: { thornBurnDmgWhileShielded: 2, thornBurnTicksWhileShielded: 1 } },
    { id: 'fire_pyre_warden', kind: 'attack', branch: 'Cinderguard', tier: 4, cost: 4, dmg: 140, maxRank: 5, prereqs: [prereq('fire_cauterize', 3)], name: 'Pyre Warden', desc: "Forces enemies to target you for a round, with a surge of extra Block.", effect: { tauntRounds: 1, shieldSelfMult: 1.5 } },
    // --- Flashfire (assassin) ---
    { id: 'fire_flash_ignition', kind: 'passive', branch: 'Flashfire', tier: 2, maxRank: 5, prereqs: [prereq('fire_spark', 2)], name: 'Flash Ignition', desc: 'Quickens your steps — bonus Speed per rank.', effect: { speedUp: 3 } },
    { id: 'fire_spark_step', kind: 'attack', branch: 'Flashfire', tier: 2, cost: 1, dmg: 50, maxRank: 5, prereqs: [prereq('fire_spark', 2)], name: 'Spark Step', desc: 'A quick dash that leaves you faster next round.', effect: { selfSpeedNextRound: 5 } },
    { id: 'fire_blazing_step', kind: 'attack', branch: 'Flashfire', tier: 2, cost: 2, dmg: 100, maxRank: 5, prereqs: [prereq('fire_flash_ignition', 2)], name: 'Blazing Step', desc: 'Extra damage if you already acted first this round.', effect: { dmgIfActedFirst: 20 } },
    { id: 'fire_twin_flare', kind: 'attack', branch: 'Flashfire', tier: 3, cost: 2, dmg: 96, maxRank: 5, prereqs: [prereq('fire_blazing_step', 2)], name: 'Twin Flare', desc: 'Two flares, both striking the same target.', effect: { hits: 2 } },
    { id: 'fire_fuse_cutter', kind: 'attack', branch: 'Flashfire', tier: 3, cost: 1, dmg: 40, maxRank: 5, prereqs: [prereq('fire_spark_step', 2)], name: 'Fuse Cutter', desc: "Singes the target's footing, cutting their Dodge for a round.", effect: { targetDodgeDownPct: 0.1 } },
    { id: 'fire_hot_pursuit', kind: 'passive', branch: 'Flashfire', tier: 3, maxRank: 5, prereqs: [prereq('fire_flash_ignition', 2)], name: 'Hot Pursuit', desc: 'Presses the advantage — bonus damage per rank while you act first.', effect: { dmgUpWhileActedFirstPct: 0.03 } },
    { id: 'fire_flare_rush', kind: 'attack', branch: 'Flashfire', tier: 3, cost: 3, dmg: 150, maxRank: 5, prereqs: [prereq('fire_blazing_step', 3)], name: 'Flare Rush', desc: 'A blazing rush that pierces straight to the back row.', effect: { pierce: true } },
    { id: 'fire_killing_heat', kind: 'passive', branch: 'Flashfire', tier: 3, maxRank: 5, prereqs: [prereq('fire_blazing_step', 2)], name: 'Killing Heat', desc: 'Fire finds the weak spots on a Burning foe — bonus Crit chance vs Burning targets, per rank.', effect: { critVsBurnedPct: 0.05 } },
    { id: 'fire_afterburn', kind: 'attack', branch: 'Flashfire', tier: 4, cost: 2, dmg: 85, maxRank: 5, prereqs: [prereq('fire_blazing_step', 3)], name: 'Afterburn', desc: 'If this finishes the target, refunds 1 Energy.', effect: { energyRefundOnKill: 1 } },
    { id: 'fire_attune_blaze', kind: 'attack', branch: 'Flashfire', tier: 4, cost: 2, dmg: 60, maxRank: 5, prereqs: [prereq('fire_flare_rush', 2)], name: 'Attune: Blaze', desc: 'Attunes you to victory — your matchup always favors you for the rest of the round.', effect: { forceFavoredRound: true } },
    { id: 'fire_immolating_blade', kind: 'attack', branch: 'Flashfire', tier: 4, cost: 5, dmg: 250, maxRank: 5, prereqs: [prereq('fire_flare_rush', 3), prereq('fire_killing_heat', 2)], name: 'Immolating Blade', desc: "An executioner's blade — massive bonus damage against a nearly-defeated target.", effect: { execFlatBonus: 70, lowHpThreshold: 0.35 } },
    // --- Ultimate ---
    { id: 'fire_phoenix_judgment', kind: 'ultimate', branch: 'Ultimate', tier: 5, cost: 8, dmg: 220, aoe: true, maxRank: 3, prereqs: [], name: 'Phoenix Judgment', desc: 'Scorches every enemy, sets them ablaze, and revives one fallen ally.', effect: { burnChance: 1, burnDmg: 15, burnTicks: 3, reviveAllyPct: 0.2 } },
  ],
  water: [
    // --- Root ---
    { id: 'water_bullet', kind: 'attack', branch: 'Root', tier: 1, cost: 1, dmg: 55, maxRank: 5, prereqs: [], name: 'Water Bullet', desc: 'A swift, unerring jet of water that heals your lowest-HP ally.', effect: { guaranteedHit: true, healAllyLowestPct: 0.2 } },
    { id: 'water_droplet_jab', kind: 'attack', branch: 'Root', tier: 1, cost: 1, dmg: 45, maxRank: 5, prereqs: [], name: 'Droplet Jab', desc: 'A quick jab. Refunds 1 Energy if it finishes the target.', effect: { energyRefundOnKill: 1 } },
    { id: 'water_current_sense', kind: 'passive', branch: 'Root', tier: 1, maxRank: 5, prereqs: [prereq('water_bullet', 1)], name: 'Current Sense', desc: 'Reads the current — bonus Accuracy per rank.', effect: { accUp: 0.02 } },
    // --- Tides of Mercy (battle healer) ---
    { id: 'water_flowing_grace', kind: 'passive', branch: 'Tides of Mercy', tier: 2, maxRank: 5, prereqs: [prereq('water_bullet', 2)], name: 'Flowing Grace', desc: 'Bonus healing on everything you heal, per rank.', effect: { healUpPct: 0.05 } },
    { id: 'water_soothing_mist', kind: 'attack', branch: 'Tides of Mercy', tier: 2, cost: 1, dmg: 40, maxRank: 5, prereqs: [prereq('water_bullet', 2)], name: 'Soothing Mist', desc: 'Soothes your lowest-HP ally with a flat heal.', effect: { healAllyLowestFlat: 25 } },
    { id: 'water_cleansing_current', kind: 'attack', branch: 'Tides of Mercy', tier: 2, cost: 2, dmg: 90, maxRank: 5, prereqs: [prereq('water_bullet', 3)], name: 'Cleansing Current', desc: 'Washes away a debuff from your lowest-HP ally.', effect: { cleanseTeam: false } },
    { id: 'water_bubble_guard', kind: 'attack', branch: 'Tides of Mercy', tier: 3, cost: 1, dmg: 40, maxRank: 5, prereqs: [prereq('water_soothing_mist', 2)], name: 'Bubble Guard', desc: 'Wraps your lowest-HP ally in a protective bubble of Block.', effect: { shieldAllyLowestFlat: 30 } },
    { id: 'water_twin_streams', kind: 'attack', branch: 'Tides of Mercy', tier: 3, cost: 2, dmg: 90, maxRank: 5, prereqs: [prereq('water_soothing_mist', 3)], name: 'Twin Streams', desc: 'Two streams of water, each healing your lowest-HP ally.', effect: { hits: 2, healAllyLowestPct: 0.1 } },
    { id: 'water_menders_rhythm', kind: 'passive', branch: 'Tides of Mercy', tier: 3, maxRank: 5, prereqs: [prereq('water_flowing_grace', 2)], name: "Mender's Rhythm", desc: 'Falls into a healing rhythm — bonus healing per rank.', effect: { healUpPct: 0.04 } },
    { id: 'water_renewing_tide', kind: 'attack', branch: 'Tides of Mercy', tier: 3, cost: 3, dmg: 130, maxRank: 5, prereqs: [prereq('water_bullet', 3)], name: 'Renewing Tide', desc: 'Heals your entire team for a share of the damage dealt.', effect: { healAllyLowestPct: 0.15 } },
    { id: 'water_overflow', kind: 'passive', branch: 'Tides of Mercy', tier: 3, maxRank: 5, prereqs: [prereq('water_flowing_grace', 3)], name: 'Overflow', desc: 'Overhealing spills into Block instead of going to waste, per rank.', effect: { overflowToShieldPct: 0.1 } },
    { id: 'water_undines_favor', kind: 'attack', branch: 'Tides of Mercy', tier: 4, cost: 2, dmg: 70, maxRank: 5, prereqs: [prereq('water_cleansing_current', 3)], name: "Undine's Favor", desc: 'Washes every debuff off yourself.', effect: { cleanseSelf: true } },
    { id: 'water_baptism', kind: 'attack', branch: 'Tides of Mercy', tier: 4, cost: 2, dmg: 75, maxRank: 5, prereqs: [prereq('water_renewing_tide', 2)], name: 'Baptism', desc: 'Heals your lowest-HP ally and grants them a burst of Dodge.', effect: { healAllyLowestPct: 0.3, allyDodgeUpRound: 0.1 } },
    { id: 'water_wellspring', kind: 'attack', branch: 'Tides of Mercy', tier: 4, cost: 4, dmg: 150, maxRank: 5, prereqs: [prereq('water_renewing_tide', 3)], name: 'Wellspring', desc: 'A deep heal and a shield for your lowest-HP ally.', effect: { healAllyLowestPct: 0.4, shieldAllyLowestFlat: 60 } },
    // --- Deepfrost (freeze & crit) ---
    { id: 'water_ice_shard', kind: 'attack', branch: 'Deepfrost', tier: 2, cost: 2, dmg: 105, maxRank: 5, prereqs: [prereq('water_bullet', 3)], name: 'Ice Shard', desc: 'A razor shard of ice with a chance to Freeze the target.', effect: { freezeChance: 0.2 } },
    { id: 'water_frost_nick', kind: 'attack', branch: 'Deepfrost', tier: 2, cost: 1, dmg: 45, maxRank: 5, prereqs: [prereq('water_bullet', 2)], name: 'Frost Nick', desc: 'A small nick of frost with a slim chance to Freeze.', effect: { freezeChance: 0.1 } },
    { id: 'water_cold_focus', kind: 'passive', branch: 'Deepfrost', tier: 2, maxRank: 5, prereqs: [prereq('water_ice_shard', 2)], name: 'Cold Focus', desc: 'A cold, focused mind — bonus Crit chance per rank.', effect: { critUpPct: 0.04 } },
    { id: 'water_cold_snap', kind: 'attack', branch: 'Deepfrost', tier: 3, cost: 1, dmg: 50, maxRank: 5, prereqs: [prereq('water_frost_nick', 2)], name: 'Cold Snap', desc: 'Extra damage against a Frozen target, without consuming the Freeze.', effect: { dmgVsFrozen: 25 } },
    { id: 'water_rimeblade', kind: 'attack', branch: 'Deepfrost', tier: 3, cost: 2, dmg: 95, maxRank: 5, prereqs: [prereq('water_ice_shard', 2)], name: 'Rimeblade', desc: 'A blade of rime — bonus Crit chance on this cast alone.', effect: { critChanceThisHit: 0.15 } },
    { id: 'water_icicle_volley', kind: 'attack', branch: 'Deepfrost', tier: 3, cost: 2, dmg: 96, maxRank: 5, prereqs: [prereq('water_ice_shard', 3)], name: 'Icicle Volley', desc: 'Three icicles, each with a chance to Freeze.', effect: { hits: 3, freezeChance: 0.08 } },
    { id: 'water_chill_sense', kind: 'passive', branch: 'Deepfrost', tier: 3, maxRank: 5, prereqs: [prereq('water_cold_focus', 2)], name: 'Chill Sense', desc: 'A chilling instinct — bonus Crit damage per rank.', effect: { critDmgUp: 0.03 } },
    { id: 'water_glacier_fang', kind: 'attack', branch: 'Deepfrost', tier: 3, cost: 3, dmg: 155, maxRank: 5, prereqs: [prereq('water_ice_shard', 3)], name: 'Glacier Fang', desc: 'A savage bite of glacier ice — big bonus Crit chance on this cast.', effect: { critChanceThisHit: 0.25 } },
    { id: 'water_brittle_strike', kind: 'passive', branch: 'Deepfrost', tier: 3, maxRank: 5, prereqs: [prereq('water_cold_focus', 2)], name: 'Brittle Strike', desc: 'Frozen foes shatter easier — bonus damage vs Frozen targets, per rank.', effect: { dmgVsFrozenPct: 0.08 } },
    { id: 'water_attune_tide', kind: 'attack', branch: 'Deepfrost', tier: 4, cost: 2, dmg: 60, maxRank: 5, prereqs: [prereq('water_glacier_fang', 2)], name: 'Attune: Tide', desc: 'Attunes you to victory — your matchup always favors you for the rest of the round.', effect: { forceFavoredRound: true } },
    { id: 'water_abyssal_spike', kind: 'attack', branch: 'Deepfrost', tier: 4, cost: 5, dmg: 265, maxRank: 5, prereqs: [prereq('water_glacier_fang', 3), prereq('water_brittle_strike', 2)], name: 'Abyssal Spike', desc: 'A crushing spike that shatters a Frozen target for a massive bonus.', effect: { dmgVsFrozen: 70, shatterFreeze: true } },
    // --- Abyssal Bulwark (water tank) ---
    { id: 'water_tidal_membrane', kind: 'passive', branch: 'Abyssal Bulwark', tier: 2, maxRank: 5, prereqs: [prereq('water_bullet', 2)], name: 'Tidal Membrane', desc: 'A membrane of pressurized water — bonus Block whenever you land an attack, per rank.', effect: { blockOnAttack: 2 } },
    { id: 'water_brine_coat', kind: 'attack', branch: 'Abyssal Bulwark', tier: 2, cost: 1, dmg: 40, maxRank: 5, prereqs: [prereq('water_tidal_membrane', 2)], name: 'Brine Coat', desc: 'Triples the Block you gain from this cast.', effect: { shieldSelfMult: 3 } },
    { id: 'water_pressure_slam', kind: 'attack', branch: 'Abyssal Bulwark', tier: 2, cost: 2, dmg: 85, maxRank: 5, prereqs: [prereq('water_tidal_membrane', 2)], name: 'Pressure Slam', desc: 'Doubles the Block you gain from this cast.', effect: { shieldSelfMult: 2 } },
    { id: 'water_rip_current', kind: 'attack', branch: 'Abyssal Bulwark', tier: 3, cost: 1, dmg: 50, maxRank: 5, prereqs: [prereq('water_pressure_slam', 2)], name: 'Rip Current', desc: "Drags at the target's footing, cutting their Dodge for a round.", effect: { targetDodgeDownPct: 0.1 } },
    { id: 'water_anchor_slam', kind: 'attack', branch: 'Abyssal Bulwark', tier: 3, cost: 2, dmg: 75, maxRank: 5, prereqs: [prereq('water_pressure_slam', 2)], name: 'Anchor Slam', desc: "Weighs the target down, weakening their next attack.", effect: { targetDmgDownPct: 0.1 } },
    { id: 'water_ballast', kind: 'passive', branch: 'Abyssal Bulwark', tier: 3, maxRank: 5, prereqs: [prereq('water_tidal_membrane', 2)], name: 'Ballast', desc: 'A deep-set ballast — bonus max HP per rank.', effect: { maxHpUpPct: 0.02 } },
    { id: 'water_undertow', kind: 'attack', branch: 'Abyssal Bulwark', tier: 3, cost: 3, dmg: 120, maxRank: 5, prereqs: [prereq('water_pressure_slam', 3)], name: 'Undertow', desc: 'Forces enemies to target you for a round and drags the target down in Speed.', effect: { tauntRounds: 1, targetSpeedDown: 10 } },
    { id: 'water_salt_ward', kind: 'passive', branch: 'Abyssal Bulwark', tier: 3, maxRank: 5, prereqs: [prereq('water_tidal_membrane', 2)], name: 'Salt Ward', desc: 'Crusted salt clings to your armor, per rank.' },
    { id: 'water_life_raft', kind: 'attack', branch: 'Abyssal Bulwark', tier: 4, cost: 1, dmg: 45, maxRank: 5, prereqs: [prereq('water_brine_coat', 3)], name: 'Life Raft', desc: 'Gives a share of your own Block to your lowest-HP ally.', effect: { shieldAllyPctOfOwnShield: 0.25 } },
    { id: 'water_depth_charge', kind: 'attack', branch: 'Abyssal Bulwark', tier: 4, cost: 2, dmg: 55, maxRank: 5, prereqs: [prereq('water_undertow', 2)], name: 'Depth Charge', desc: 'Hits the entire enemy front row at once.', effect: { aoeMode: 'front' } },
    { id: 'water_leviathan_guard', kind: 'attack', branch: 'Abyssal Bulwark', tier: 4, cost: 4, dmg: 135, maxRank: 5, prereqs: [prereq('water_undertow', 3)], name: 'Leviathan Guard', desc: 'Grants a share of your Block to your lowest-HP ally.', effect: { shieldAllyPctOfOwnShield: 0.5 } },
    // --- Ultimate ---
    { id: 'water_ocean_dominion', kind: 'ultimate', branch: 'Ultimate', tier: 5, cost: 8, maxRank: 3, prereqs: [], name: 'Ocean Dominion', desc: 'Heals and cleanses your whole team, and has a strong chance to Freeze every enemy.', effect: { teamHeal: 150, cleanseTeam: true, freezeAllChance: 0.7 } },
  ],
  earth: [
    // --- Root ---
    { id: 'earth_stone_throw', kind: 'attack', branch: 'Root', tier: 1, cost: 1, dmg: 60, maxRank: 5, prereqs: [], name: 'Stone Throw', desc: 'A heavy hurled stone that doubles your Block gain this cast.', effect: { shieldSelfMult: 2 } },
    { id: 'earth_gravel_toss', kind: 'attack', branch: 'Root', tier: 1, cost: 1, dmg: 45, maxRank: 5, prereqs: [], name: 'Gravel Toss', desc: 'A quick toss of gravel. Refunds 1 Energy if it finishes the target.', effect: { energyRefundOnKill: 1 } },
    { id: 'earth_tremor_sense', kind: 'passive', branch: 'Root', tier: 1, maxRank: 5, prereqs: [prereq('earth_stone_throw', 1)], name: 'Tremor Sense', desc: 'Feels the ground shift — bonus Accuracy per rank.', effect: { accUp: 0.02 } },
    // --- Bastion (earth tank) ---
    { id: 'earth_granite_core', kind: 'passive', branch: 'Bastion', tier: 2, maxRank: 5, prereqs: [prereq('earth_stone_throw', 2)], name: 'Granite Core', desc: 'A core of granite — bonus Block whenever you land an attack, per rank.', effect: { blockOnAttack: 2 } },
    { id: 'earth_mud_wall', kind: 'attack', branch: 'Bastion', tier: 2, cost: 1, dmg: 40, maxRank: 5, prereqs: [prereq('earth_granite_core', 2)], name: 'Mud Wall', desc: 'Triples the Block you gain from this cast.', effect: { shieldSelfMult: 3 } },
    { id: 'earth_rampart', kind: 'attack', branch: 'Bastion', tier: 2, cost: 2, dmg: 80, maxRank: 5, prereqs: [prereq('earth_stone_throw', 3)], name: 'Rampart', desc: 'Shares a portion of your Block gain with a back-row ally.', effect: { shieldBackRowAllyPctOfGain: 0.4 } },
    { id: 'earth_fortify', kind: 'attack', branch: 'Bastion', tier: 3, cost: 1, dmg: 45, maxRank: 5, prereqs: [prereq('earth_rampart', 2)], name: 'Fortify', desc: 'Grants your lowest-HP ally a flat shield of Block.', effect: { shieldAllyLowestFlat: 30 } },
    { id: 'earth_shield_bash', kind: 'attack', branch: 'Bastion', tier: 3, cost: 2, dmg: 75, maxRank: 5, prereqs: [prereq('earth_rampart', 2)], name: 'Shield Bash', desc: 'Bonus damage equal to a quarter of your current Block.', effect: { dmgPctOfShield: 0.25 } },
    { id: 'earth_stalwart', kind: 'passive', branch: 'Bastion', tier: 3, maxRank: 5, prereqs: [prereq('earth_granite_core', 2)], name: 'Stalwart', desc: 'A stalwart frame — bonus max HP per rank.', effect: { maxHpUpPct: 0.02 } },
    { id: 'earth_bulwark_slam', kind: 'attack', branch: 'Bastion', tier: 3, cost: 3, dmg: 140, maxRank: 5, prereqs: [prereq('earth_stone_throw', 3)], name: 'Bulwark Slam', desc: 'Forces enemies to target you for a round.', effect: { tauntRounds: 1 } },
    { id: 'earth_aftershock', kind: 'passive', branch: 'Bastion', tier: 3, maxRank: 5, prereqs: [prereq('earth_granite_core', 3)], name: 'Aftershock', desc: 'Reverberating tremors settle into your stance, per rank.' },
    { id: 'earth_ground_slam', kind: 'attack', branch: 'Bastion', tier: 4, cost: 2, dmg: 55, maxRank: 5, prereqs: [prereq('earth_bulwark_slam', 2)], name: 'Ground Slam', desc: 'Hits the entire enemy front row at once.', effect: { aoeMode: 'front' } },
    { id: 'earth_patience', kind: 'passive', branch: 'Bastion', tier: 4, maxRank: 5, prereqs: [prereq('earth_bulwark_slam', 2)], name: 'Patience', desc: 'Taunting grants extra Block, per rank.', effect: { tauntShieldBonus: 10 } },
    { id: 'earth_immovable', kind: 'attack', branch: 'Bastion', tier: 4, cost: 4, dmg: 130, maxRank: 5, prereqs: [prereq('earth_bulwark_slam', 3)], name: 'Immovable', desc: 'Forces enemies to target you and reduces the damage you take for a round.', effect: { tauntRounds: 1, selfDmgReductionRound: 0.15 } },
    // --- Landslide (juggernaut) ---
    { id: 'earth_rock_spike', kind: 'attack', branch: 'Landslide', tier: 2, cost: 2, dmg: 110, maxRank: 5, prereqs: [prereq('earth_stone_throw', 3)], name: 'Rock Spike', desc: 'Shreds the target — they take more damage for 2 rounds.', effect: { shredPct: 0.1, shredRounds: 2 } },
    { id: 'earth_flint_edge', kind: 'attack', branch: 'Landslide', tier: 2, cost: 1, dmg: 50, maxRank: 5, prereqs: [prereq('earth_stone_throw', 2)], name: 'Flint Edge', desc: 'Bonus damage while you currently hold Block.', effect: { dmgIfShielded: 10 } },
    { id: 'earth_heavy_hands', kind: 'passive', branch: 'Landslide', tier: 2, maxRank: 5, prereqs: [prereq('earth_rock_spike', 2)], name: 'Heavy Hands', desc: 'Your blows land harder while shielded, per rank.', effect: { dmgWhileShieldedPct: 0.05 } },
    { id: 'earth_sunder_step', kind: 'attack', branch: 'Landslide', tier: 3, cost: 1, dmg: 45, maxRank: 5, prereqs: [prereq('earth_rock_spike', 2)], name: 'Sunder Step', desc: 'Shreds the target — they take more damage for a round.', effect: { shredPct: 0.05, shredRounds: 1 } },
    { id: 'earth_boulder_volley', kind: 'attack', branch: 'Landslide', tier: 3, cost: 2, dmg: 100, maxRank: 5, prereqs: [prereq('earth_rock_spike', 3)], name: 'Boulder Volley', desc: 'Two boulders, both striking the same target.', effect: { hits: 2 } },
    { id: 'earth_grit', kind: 'passive', branch: 'Landslide', tier: 3, maxRank: 5, prereqs: [prereq('earth_heavy_hands', 2)], name: 'Grit', desc: 'Fights hardest when cornered — bonus damage per rank while under half HP.', effect: { dmgUpWhileLowHpPct: 0.03 } },
    { id: 'earth_quake_fist', kind: 'attack', branch: 'Landslide', tier: 3, cost: 3, dmg: 165, maxRank: 5, prereqs: [prereq('earth_rock_spike', 3)], name: 'Quake Fist', desc: 'A grounding blow that cannot miss.', effect: { guaranteedHit: true } },
    { id: 'earth_momentum_mass', kind: 'passive', branch: 'Landslide', tier: 3, maxRank: 5, prereqs: [prereq('earth_heavy_hands', 2)], name: 'Momentum Mass', desc: 'Your Block adds weight to every blow — bonus damage per 100 current Block, per rank.', effect: { dmgPer100Shield: 4 } },
    { id: 'earth_landslip', kind: 'attack', branch: 'Landslide', tier: 4, cost: 2, dmg: 85, maxRank: 5, prereqs: [prereq('earth_quake_fist', 2)], name: 'Landslip', desc: 'Bonus damage vs a Taunting or shielded target.', effect: { dmgVsTauntingOrShielded: 30 } },
    { id: 'earth_attune_terra', kind: 'attack', branch: 'Landslide', tier: 4, cost: 2, dmg: 60, maxRank: 5, prereqs: [prereq('earth_quake_fist', 2)], name: 'Attune: Terra', desc: 'Attunes you to victory — your matchup always favors you for the rest of the round.', effect: { forceFavoredRound: true } },
    { id: 'earth_gaia_hammer', kind: 'attack', branch: 'Landslide', tier: 4, cost: 5, dmg: 260, maxRank: 5, prereqs: [prereq('earth_quake_fist', 3), prereq('earth_momentum_mass', 2)], name: 'Gaia Hammer', desc: 'Bonus damage equal to half your current Block, capped.', effect: { dmgPctOfShield: 0.5, dmgPctOfShieldCap: 150 } },
    // --- Verdant (sustain) ---
    { id: 'earth_sapwood_skin', kind: 'passive', branch: 'Verdant', tier: 2, maxRank: 5, prereqs: [prereq('earth_stone_throw', 2)], name: 'Sapwood Skin', desc: 'Bark-like skin regenerates you each round, per rank.', effect: { regen: 2 } },
    { id: 'earth_sprout_snap', kind: 'attack', branch: 'Verdant', tier: 2, cost: 1, dmg: 40, maxRank: 5, prereqs: [prereq('earth_stone_throw', 2)], name: 'Sprout Snap', desc: 'A snapping vine that heals you a flat amount.', effect: { healSelfFlat: 15 } },
    { id: 'earth_thorn_lash', kind: 'attack', branch: 'Verdant', tier: 2, cost: 2, dmg: 95, maxRank: 5, prereqs: [prereq('earth_sapwood_skin', 2)], name: 'Thorn Lash', desc: 'Attackers who hit you this round take thorn damage back.', effect: { thornsFlat: 20, thornsRounds: 1 } },
    { id: 'earth_bramble_coat', kind: 'attack', branch: 'Verdant', tier: 3, cost: 1, dmg: 40, maxRank: 5, prereqs: [prereq('earth_thorn_lash', 2)], name: 'Bramble Coat', desc: 'A coat of thorns for the round, alongside your normal Block gain.', effect: { thornsFlat: 10, thornsRounds: 1 } },
    { id: 'earth_sap_drink', kind: 'attack', branch: 'Verdant', tier: 3, cost: 2, dmg: 80, maxRank: 5, prereqs: [prereq('earth_thorn_lash', 3)], name: 'Sap Drink', desc: 'Drinks in a share of the damage you deal as healing.', effect: { healSelfPctOfDmg: 0.5 } },
    { id: 'earth_overgrowth', kind: 'passive', branch: 'Verdant', tier: 3, maxRank: 5, prereqs: [prereq('earth_thorn_lash', 2)], name: 'Overgrowth', desc: 'Your thorns grow sharper — bonus thorn damage per rank.', effect: { thornsFlatUp: 4 } },
    { id: 'earth_natures_pulse', kind: 'attack', branch: 'Verdant', tier: 3, cost: 3, dmg: 115, maxRank: 5, prereqs: [prereq('earth_thorn_lash', 3)], name: "Nature's Pulse", desc: 'Heals you and a nearby ally from the damage you deal.', effect: { healSelfPctOfDmg: 0.3, healAdjacentAllyPctOfDmg: 0.15 } },
    { id: 'earth_deep_roots', kind: 'passive', branch: 'Verdant', tier: 3, maxRank: 5, prereqs: [prereq('earth_thorn_lash', 2)], name: 'Deep Roots', desc: 'Roots run deep — reduced damage taken per rank while under half HP.', effect: { dmgReductionWhileLowHpPct: 0.05 } },
    { id: 'earth_pollen_daze', kind: 'attack', branch: 'Verdant', tier: 4, cost: 2, dmg: 70, maxRank: 5, prereqs: [prereq('earth_natures_pulse', 2)], name: 'Pollen Daze', desc: "Dazes the target with pollen, cutting their Accuracy for a round.", effect: { targetAccDownPct: 0.05 } },
    { id: 'earth_root_grip', kind: 'attack', branch: 'Verdant', tier: 4, cost: 2, dmg: 75, maxRank: 5, prereqs: [prereq('earth_natures_pulse', 2)], name: 'Root Grip', desc: "Roots snare the target, slowing them for a round.", effect: { targetSpeedDown: 10 } },
    { id: 'earth_wildgrowth', kind: 'attack', branch: 'Verdant', tier: 4, cost: 4, dmg: 140, maxRank: 5, prereqs: [prereq('earth_natures_pulse', 3)], name: 'Wildgrowth', desc: "Blankets your whole team in regenerating growth for 2 rounds.", effect: { teamRegenAmount: 25, teamRegenRounds: 2 } },
    // --- Ultimate ---
    { id: 'earth_world_pillar', kind: 'ultimate', branch: 'Ultimate', tier: 5, cost: 8, dmg: 180, aoe: true, maxRank: 3, prereqs: [], name: 'World Pillar', desc: 'Crushes every enemy, shields your whole team, and forces enemies to target you.', effect: { teamBlock: 250, tauntRounds: 1 } },
  ],
  wind: [
    // --- Root ---
    { id: 'wind_gust_blade', kind: 'attack', branch: 'Root', tier: 1, cost: 1, dmg: 55, maxRank: 5, prereqs: [], name: 'Gust Blade', desc: 'A slicing blade of air with a chance to speed up your own Dodge.', effect: { selfDodgeUpOnCastChance: 0.2, selfDodgeUpRound: 0.1 } },
    { id: 'wind_zephyr_poke', kind: 'attack', branch: 'Root', tier: 1, cost: 1, dmg: 45, maxRank: 5, prereqs: [], name: 'Zephyr Poke', desc: 'A quick poke of wind. Refunds 1 Energy if it finishes the target.', effect: { energyRefundOnKill: 1 } },
    { id: 'wind_sense', kind: 'passive', branch: 'Root', tier: 1, maxRank: 5, prereqs: [prereq('wind_gust_blade', 1)], name: 'Wind Sense', desc: 'Reads the breeze — bonus Accuracy per rank.', effect: { accUp: 0.02 } },
    // --- Slipstream (assassin) ---
    { id: 'wind_tailwind', kind: 'passive', branch: 'Slipstream', tier: 2, maxRank: 5, prereqs: [prereq('wind_gust_blade', 2)], name: 'Tailwind', desc: 'A favorable wind at your back — bonus Speed per rank.', effect: { speedUp: 2 } },
    { id: 'wind_razor_feint', kind: 'attack', branch: 'Slipstream', tier: 2, cost: 1, dmg: 50, maxRank: 5, prereqs: [prereq('wind_gust_blade', 2)], name: 'Razor Feint', desc: 'Extra damage if you already acted first this round.', effect: { dmgIfActedFirst: 10 } },
    { id: 'wind_wind_shot', kind: 'attack', branch: 'Slipstream', tier: 2, cost: 2, dmg: 105, maxRank: 5, prereqs: [prereq('wind_gust_blade', 3)], name: 'Wind Shot', desc: 'A compressed bullet of wind that pierces straight to the back row.', effect: { pierce: true } },
    { id: 'wind_blood_scent', kind: 'attack', branch: 'Slipstream', tier: 3, cost: 1, dmg: 45, maxRank: 5, prereqs: [prereq('wind_razor_feint', 2)], name: 'Blood Scent', desc: 'Extra damage vs a target already damaged this round.', effect: { dmgVsDamagedThisRound: 20 } },
    { id: 'wind_twin_cut', kind: 'attack', branch: 'Slipstream', tier: 3, cost: 2, dmg: 90, maxRank: 5, prereqs: [prereq('wind_wind_shot', 2)], name: 'Twin Cut', desc: 'Two cuts, both striking the same target.', effect: { hits: 2 } },
    { id: 'wind_shadow_lunge', kind: 'attack', branch: 'Slipstream', tier: 3, cost: 2, dmg: 90, maxRank: 5, prereqs: [prereq('wind_wind_shot', 3)], name: 'Shadow Lunge', desc: 'A lunge from the shadows that pierces straight to the back row.', effect: { pierce: true } },
    { id: 'wind_hawk_dive', kind: 'attack', branch: 'Slipstream', tier: 3, cost: 3, dmg: 160, maxRank: 5, prereqs: [prereq('wind_wind_shot', 3)], name: 'Hawk Dive', desc: 'A diving strike — extra damage if you already acted first this round.', effect: { dmgIfActedFirst: 35 } },
    { id: 'wind_opportunist', kind: 'passive', branch: 'Slipstream', tier: 3, maxRank: 5, prereqs: [prereq('wind_tailwind', 3)], name: 'Opportunist', desc: 'Preys on the weak — bonus damage per rank vs targets under 40% HP.', effect: { dmgVsLowHpPct: 0.06, lowHpThreshold: 0.4 } },
    { id: 'wind_killer_instinct', kind: 'passive', branch: 'Slipstream', tier: 4, maxRank: 5, prereqs: [prereq('wind_opportunist', 2)], name: 'Killer Instinct', desc: 'Bonus Crit chance per rank vs targets under 40% HP.', effect: { critVsLowHpPct: 0.03, lowHpThreshold: 0.4 } },
    { id: 'wind_attune_gale', kind: 'attack', branch: 'Slipstream', tier: 4, cost: 2, dmg: 60, maxRank: 5, prereqs: [prereq('wind_hawk_dive', 2)], name: 'Attune: Gale', desc: 'Attunes you to victory — your matchup always favors you for the rest of the round.', effect: { forceFavoredRound: true } },
    { id: 'wind_tempest_strike', kind: 'attack', branch: 'Slipstream', tier: 4, cost: 5, dmg: 270, maxRank: 5, prereqs: [prereq('wind_hawk_dive', 3), prereq('wind_opportunist', 2)], name: 'Tempest Strike', desc: 'Bonus damage for every scroll you\'ve already cast this round.', effect: { dmgPerPriorCastThisRound: 40 } },
    // --- Mistral Veil (dodge tank) ---
    { id: 'wind_feather_guard', kind: 'passive', branch: 'Mistral Veil', tier: 2, maxRank: 5, prereqs: [prereq('wind_gust_blade', 2)], name: 'Feather Guard', desc: 'Feather-light armor — bonus Block whenever you land an attack, per rank.', effect: { blockOnAttack: 2 } },
    { id: 'wind_feint_guard', kind: 'attack', branch: 'Mistral Veil', tier: 2, cost: 1, dmg: 40, maxRank: 5, prereqs: [prereq('wind_feather_guard', 2)], name: 'Feint Guard', desc: 'A feinting guard that boosts your own Dodge for the round.', effect: { selfDodgeUpRound: 0.1 } },
    { id: 'wind_deflecting_gust', kind: 'attack', branch: 'Mistral Veil', tier: 2, cost: 2, dmg: 80, maxRank: 5, prereqs: [prereq('wind_feather_guard', 2)], name: 'Deflecting Gust', desc: 'A deflecting gust that boosts your own Dodge for the round.', effect: { selfDodgeUpRound: 0.15 } },
    { id: 'wind_mirage_step', kind: 'attack', branch: 'Mistral Veil', tier: 3, cost: 1, dmg: 40, maxRank: 5, prereqs: [prereq('wind_feint_guard', 2)], name: 'Mirage Step', desc: 'Doubles this cast\'s Block gain and adds a touch of Dodge.', effect: { shieldSelfMult: 2, selfDodgeUpRound: 0.05 } },
    { id: 'wind_wind_wall', kind: 'attack', branch: 'Mistral Veil', tier: 3, cost: 2, dmg: 55, maxRank: 5, prereqs: [prereq('wind_deflecting_gust', 2)], name: 'Wind Wall', desc: 'Hits the entire enemy front row at once.', effect: { aoeMode: 'front' } },
    { id: 'wind_gust_riposte', kind: 'passive', branch: 'Mistral Veil', tier: 3, maxRank: 5, prereqs: [prereq('wind_slipstream_ward', 2)], name: 'Gust Riposte', desc: 'On a successful dodge, the attacker takes recoil damage, per rank.', effect: { onDodgeRecoil: 3 } },
    { id: 'wind_provoking_squall', kind: 'attack', branch: 'Mistral Veil', tier: 3, cost: 3, dmg: 110, maxRank: 5, prereqs: [prereq('wind_deflecting_gust', 3)], name: 'Provoking Squall', desc: 'Forces enemies to target you for a round with a burst of Dodge while taunting.', effect: { tauntRounds: 1, selfDodgeUpRound: 0.2 } },
    { id: 'wind_slipstream_ward', kind: 'passive', branch: 'Mistral Veil', tier: 3, maxRank: 5, prereqs: [prereq('wind_deflecting_gust', 2)], name: 'Slipstream Ward', desc: 'On a successful dodge, gain a shield of Block, per rank.', effect: { onDodgeShield: 5 } },
    { id: 'wind_vanish', kind: 'attack', branch: 'Mistral Veil', tier: 4, cost: 2, dmg: 70, maxRank: 5, prereqs: [prereq('wind_provoking_squall', 2)], name: 'Vanish', desc: 'A burst of Dodge for the round.', effect: { selfDodgeUpRound: 0.25 } },
    { id: 'wind_airy_constitution', kind: 'passive', branch: 'Mistral Veil', tier: 4, maxRank: 5, prereqs: [prereq('wind_feather_guard', 2)], name: 'Airy Constitution', desc: 'A body light as air — bonus max HP per rank.', effect: { maxHpUpPct: 0.02 } },
    { id: 'wind_eye_of_the_storm', kind: 'attack', branch: 'Mistral Veil', tier: 4, cost: 4, dmg: 125, maxRank: 5, prereqs: [prereq('wind_provoking_squall', 3)], name: 'Eye of the Storm', desc: 'A sustained burst of Dodge lasting 2 rounds.', effect: { selfDodgeBuff: 0.25, selfDodgeBuffRounds: 2 } },
    // --- Stormcall (AoE tempo) ---
    { id: 'wind_static_charge', kind: 'passive', branch: 'Stormcall', tier: 2, maxRank: 5, prereqs: [prereq('wind_gust_blade', 2)], name: 'Static Charge', desc: 'Chance to refund Energy on an AoE or multi-hit cast (once per turn), per rank.', effect: { energyRefundOnAoEChance: 0.2 } },
    { id: 'wind_static_jab', kind: 'attack', branch: 'Stormcall', tier: 2, cost: 1, dmg: 45, maxRank: 5, prereqs: [prereq('wind_gust_blade', 2)], name: 'Static Jab', desc: 'A charged jab with a chance to refund Energy.', effect: { energyRefundChance: 0.2 } },
    { id: 'wind_chain_gale', kind: 'attack', branch: 'Stormcall', tier: 2, cost: 2, dmg: 70, maxRank: 5, prereqs: [prereq('wind_static_charge', 2)], name: 'Chain Gale', desc: 'Strikes the target, and arcs to one random enemy for a fraction of the damage.', effect: { secondaryRandomPct: 0.5 } },
    { id: 'wind_overcharge', kind: 'attack', branch: 'Stormcall', tier: 3, cost: 1, dmg: 60, maxRank: 5, prereqs: [prereq('wind_static_jab', 2)], name: 'Overcharge', desc: 'A powerful jolt that recoils some damage back on you.', effect: { selfRecoil: 12 } },
    { id: 'wind_fork_lightning', kind: 'attack', branch: 'Stormcall', tier: 3, cost: 2, dmg: 90, maxRank: 5, prereqs: [prereq('wind_chain_gale', 2)], name: 'Fork Lightning', desc: 'Forks between two different enemies.', effect: { aoeMode: 'random2' } },
    { id: 'wind_ion_field', kind: 'attack', branch: 'Stormcall', tier: 3, cost: 1, dmg: 40, maxRank: 5, prereqs: [prereq('wind_static_jab', 2)], name: 'Ion Field', desc: 'Charges the air — your attacks deal bonus damage for the rest of the round.', effect: { selfDmgUpRound: 0.15 } },
    { id: 'wind_shatter_dive', kind: 'attack', branch: 'Stormcall', tier: 3, cost: 3, dmg: 150, maxRank: 5, prereqs: [prereq('wind_chain_gale', 3)], name: 'Shatter Dive', desc: 'A diving strike that shatters a Frozen target for a massive bonus.', effect: { dmgVsFrozen: 80, shatterFreeze: true } },
    { id: 'wind_storm_herald', kind: 'passive', branch: 'Stormcall', tier: 3, maxRank: 5, prereqs: [prereq('wind_chain_gale', 2)], name: 'Storm Herald', desc: 'Bonus damage on AoE scrolls, per rank.', effect: { aoeDmgUpPct: 0.06 } },
    { id: 'wind_storm_sense', kind: 'passive', branch: 'Stormcall', tier: 4, maxRank: 5, prereqs: [prereq('wind_fork_lightning', 2)], name: 'Storm Sense', desc: 'Bonus damage on multi-hit scrolls, per rank.', effect: { multiHitDmgUpPct: 0.04 } },
    { id: 'wind_downburst', kind: 'attack', branch: 'Stormcall', tier: 4, cost: 2, dmg: 55, maxRank: 5, prereqs: [prereq('wind_chain_gale', 2)], name: 'Downburst', desc: 'Hits the entire enemy front row at once.', effect: { aoeMode: 'front' } },
    { id: 'wind_sky_cutter', kind: 'attack', branch: 'Stormcall', tier: 4, cost: 4, dmg: 70, aoe: true, maxRank: 5, prereqs: [prereq('wind_chain_gale', 3), prereq('wind_storm_herald', 2)], name: 'Sky Cutter', desc: 'Hits every enemy at once.' },
    // --- Ultimate ---
    { id: 'wind_storm_dominion', kind: 'ultimate', branch: 'Ultimate', tier: 5, cost: 8, dmg: 200, aoe: true, maxRank: 3, prereqs: [], name: 'Storm Dominion', desc: 'Strikes every enemy, grants your team a burst of Dodge, and surges your team with extra Energy.', effect: { teamDodgeUpRound: 0.25, energyGain: 3 } },
  ],
};

export const SKILLS_BY_ID: Record<string, Skill> = {};
Object.values(SKILL_TREES).forEach((tree) => tree.forEach((s) => { SKILLS_BY_ID[s.id] = s; }));

export const RANK_DMG_BONUS = 0.08;
export const ATTACK_MAX_RANK = 5;
export const MAX_EQUIPPED_ACTIVES = 6;
/** Character level required, alongside 1+ rank in any Tier-4 skill, to raise an element's Ultimate. */
export const ULTIMATE_LEVEL_REQUIREMENT = 15;
/** Fallback burn tick numbers for skills that only specify a burn chance. */
export const DEFAULT_BURN_DMG = 10;
export const DEFAULT_BURN_TICKS = 2;

export function skillsForElement(el: Element): Skill[] {
  return SKILL_TREES[el];
}

/** A skill is "owned" once at least 1 point is invested — no more auto-grants by level. */
export function ownedSkills(mage: MageState, el: Element): Skill[] {
  return SKILL_TREES[el].filter((s) => (mage.ranks[s.id] || 0) > 0);
}

/** All of a skill's prerequisites met at the given rank map (AND-combined). Root skills (tier 1) have none. */
export function meetsPrereqs(skill: Skill, ranks: Record<string, number>): boolean {
  return skill.prereqs.every((p) => (ranks[p.skillId] || 0) >= p.rank);
}

/** Ultimates additionally require mage level >= 15 AND 1+ rank in any of that element's three Tier-4 skills. */
export function ultimateUnlocked(mage: MageState, el: Element): boolean {
  if (mage.level < ULTIMATE_LEVEL_REQUIREMENT) return false;
  return SKILL_TREES[el].some((s) => s.tier === 4 && (mage.ranks[s.id] || 0) > 0);
}

export function skillDamage(skill: Skill, rank: number): number {
  if (!skill.dmg) return 0;
  return Math.round(skill.dmg * (1 + RANK_DMG_BONUS * (rank - 1)));
}

/** Presentation card for the battle hand — the runtime shape the UI renders. */
export function skillToCard(skill: Skill, rank: number, el: Element) {
  const dmgTxt = skill.dmg
    ? `${skillDamage(skill, rank)} DMG${skill.aoe || skill.effect?.aoeMode ? ' (ALL)' : ''}`
    : skill.kind === 'passive'
      ? 'Passive'
      : 'Buff';
  return {
    id: skill.id,
    el,
    type: skill.kind,
    cost: skill.cost || 0,
    name: skill.name,
    stat: dmgTxt || '—',
    desc: skill.desc + (skill.kind === 'attack' && rank > 1 ? ` (Rank ${rank})` : ''),
    isUltimate: skill.kind === 'ultimate',
    kind: skill.kind,
    aoe: !!skill.aoe,
    effect: skill.effect || null,
    rank,
  };
}
