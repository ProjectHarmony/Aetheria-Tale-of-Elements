import type { Element } from '@/types';

export const SPEED: Record<Element, number> = { fire: 108, water: 100, earth: 90, wind: 112 };
export const HERO_HP: Record<Element, number> = { fire: 590, water: 600, earth: 670, wind: 600 };
export const HERO_NAMES: Record<Element, string> = { fire: 'Ember', water: 'Tidewen', earth: 'Boulder', wind: 'Zephyra' };
export const ENEMY_NAMES: Record<Element, string> = { fire: 'Cinder', water: 'Maren', earth: 'Cragg', wind: 'Squall' };

export const HERO_DODGE: Record<Element, number> = { fire: 0.05, water: 0.08, earth: 0.03, wind: 0.15 };
export const HERO_CRIT: Record<Element, number> = { fire: 0.1, water: 0.05, earth: 0.04, wind: 0.07 };
export const HERO_ACC: Record<Element, number> = { fire: 0.91, water: 0.89, earth: 0.86, wind: 0.89 };

export const STAT_SCALE = {
  pow: 0.02,
  cs: 2,
  vit: 25,
  dge: 0.005,
  crt: 0.005,
  acc: 0.005,
} as const;

export interface MageStats {
  pow: number;
  cs: number;
  vit: number;
  dge: number;
  crt: number;
  acc: number;
}

export const DEFAULT_STATS: MageStats = { pow: 5, cs: 5, vit: 5, dge: 5, crt: 5, acc: 5 };

export type StatKey = keyof MageStats;

export interface StatMeta {
  name: string;
  icon: string;
  desc: string;
}

export const STAT_META: Record<StatKey, StatMeta> = {
  pow: { name: 'Power', icon: '💥', desc: '+2% damage per point' },
  cs: { name: 'Cast Speed', icon: '⚡', desc: '+2 Speed per point (acts earlier)' },
  vit: { name: 'Vital', icon: '❤️', desc: '+25 max HP per point' },
  dge: { name: 'Dodge', icon: '💨', desc: '+0.5% dodge chance per point' },
  crt: { name: 'Crit', icon: '✨', desc: '+0.5% critical chance per point' },
  acc: { name: 'Accuracy', icon: '🎯', desc: '+0.5% hit chance per point' },
};
