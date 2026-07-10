/**
 * Status visuals are DERIVED from a hero's live numeric fields (see
 * systems/battle/status.ts::getHeroStatuses), not tracked as a separate
 * array that could drift out of sync with what's actually affecting combat
 * math. Ported 1:1 from script.js STATUS_META.
 */
export type StatusKind =
  | 'dmgUp'
  | 'dodgeUp'
  | 'speedUp'
  | 'shielded'
  | 'blockOnAttack'
  | 'dmgReduction'
  | 'reflect'
  | 'regen'
  | 'dmgDown'
  | 'dodgeDown'
  | 'speedDown'
  | 'accDown'
  | 'burning'
  | 'frozen'
  | 'taunting'
  | 'vulnerable'
  | 'thorns'
  | 'attuned';

export interface StatusMeta {
  icon: string;
  label: string;
  isDebuff: boolean;
  permanent: boolean;
}

export const STATUS_META: Record<StatusKind, StatusMeta> = {
  dmgUp: { icon: '💥', label: 'Damage Up', isDebuff: false, permanent: false },
  dodgeUp: { icon: '💨', label: 'Dodge Up', isDebuff: false, permanent: false },
  speedUp: { icon: '⚡', label: 'Speed Up', isDebuff: false, permanent: false },
  shielded: { icon: '🛡️', label: 'Shielded', isDebuff: false, permanent: false },
  blockOnAttack: { icon: '🛡️', label: 'Ward', isDebuff: false, permanent: true },
  dmgReduction: { icon: '🪨', label: 'Hardened', isDebuff: false, permanent: true },
  reflect: { icon: '🪞', label: 'Reflect', isDebuff: false, permanent: true },
  regen: { icon: '💚', label: 'Regenerating', isDebuff: false, permanent: true },
  dmgDown: { icon: '📉', label: 'Damage Down', isDebuff: true, permanent: false },
  dodgeDown: { icon: '🎯', label: 'Dodge Down', isDebuff: true, permanent: false },
  speedDown: { icon: '🐌', label: 'Speed Down', isDebuff: true, permanent: false },
  accDown: { icon: '😵', label: 'Accuracy Down', isDebuff: true, permanent: false },
  burning: { icon: '🔥', label: 'Burning', isDebuff: true, permanent: false },
  frozen: { icon: '❄️', label: 'Frozen', isDebuff: true, permanent: false },
  taunting: { icon: '📢', label: 'Taunting', isDebuff: false, permanent: false },
  vulnerable: { icon: '💢', label: 'Vulnerable', isDebuff: true, permanent: false },
  thorns: { icon: '🌵', label: 'Thorns', isDebuff: false, permanent: false },
  attuned: { icon: '🔮', label: 'Attuned', isDebuff: false, permanent: false },
};
