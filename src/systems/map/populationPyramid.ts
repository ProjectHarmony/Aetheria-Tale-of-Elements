import type { Element, MonsterMeta, MonsterRole, MonsterSlot } from '@/types';
import { computeMonsterStats } from '@/constants/monsterFormulas';

/**
 * "Population Pyramid" — how a zone fills with Regular-tier wildlife, per
 * the Aetheria Monster Database's Population Pyramid sheet. Each zone hosts
 * 3 Regular species (2 matching the zone's dominant element, 1 cross-element
 * "wildcard"); each species is a 3-level population, not a single spawn:
 *
 *   Lv1  "Juvenile" x20  (non-aggro — skittish, won't attack first)
 *   Lv3  "Adult"    x10  (aggressive — the normal fight)
 *   Lv15 "Elder"    x1   (always aggressive — a rare, real threat wearing a familiar face)
 *
 * 31 individuals per species x 3 species = 93 roaming individuals per zone.
 * DATA MODEL ONLY — not called against any real map yet. Placement (which 3
 * species go in each of the ~55 non-boss zones) isn't specified anywhere in
 * the source workbook beyond one worked example (Stonegate), so it's a
 * separate content-authoring pass, not a data port.
 */
export interface PopulationSpecies {
  /** Base display name — Adult/Elder get a suffixed variant name (see `speciesDisplayName`) so each population level can carry its own aggro/tier identity in MONSTER_META, since Juvenile and Adult/Elder behave differently. */
  name: string;
  role: MonsterRole;
  element: Element;
}

interface PopulationLevelDef {
  level: number;
  suffix: '' | ' (Adult)' | ' (Elder)';
  count: number;
  aggressive: boolean;
}

export const POPULATION_LEVELS: PopulationLevelDef[] = [
  { level: 1, suffix: '', count: 20, aggressive: false },
  { level: 3, suffix: ' (Adult)', count: 10, aggressive: true },
  { level: 15, suffix: ' (Elder)', count: 1, aggressive: true },
];

export function speciesDisplayName(species: PopulationSpecies, levelDef: PopulationLevelDef): string {
  return species.name + levelDef.suffix;
}

/** MONSTER_META entries for all 3 population levels of one species — merge into the active roster's MONSTER_META once real placement lands. */
export function populationMonsterMeta(species: PopulationSpecies, icon: string): Record<string, MonsterMeta> {
  const out: Record<string, MonsterMeta> = {};
  POPULATION_LEVELS.forEach((lvl) => {
    out[speciesDisplayName(species, lvl)] = { el: species.element, tier: 'regular', icon, size: 1, aggressive: lvl.aggressive };
  });
  return out;
}

/**
 * Expands one species into its full 31-individual `MonsterSlot[]`, given
 * explicit sub-location placements per population level (Juveniles roam
 * widely, the single Elder belongs at exactly one "discovery reward" spot,
 * per the source sheet's own worked example) — the CALLER decides placement,
 * this only resolves count + position into slots.
 */
export function buildPopulationSlots(species: PopulationSpecies, placements: Record<number, [number, number][]>): MonsterSlot[] {
  const slots: MonsterSlot[] = [];
  POPULATION_LEVELS.forEach((lvl) => {
    const positions = placements[lvl.level] ?? [];
    const name = speciesDisplayName(species, lvl);
    positions.slice(0, lvl.count).forEach(([x, y]) => slots.push([name, x, y]));
  });
  return slots;
}

/** Convenience: the computed battle stats for one species at one population level. */
export function populationStatsFor(species: PopulationSpecies, level: number) {
  return computeMonsterStats(species.role, level, 'regular');
}
