export type FormationKey = '2f1b' | '1f2b';

export interface FormationMeta {
  front: number;
  back: number;
  label: string;
  desc: string;
}

export const FORMATIONS: Record<FormationKey, FormationMeta> = {
  '2f1b': { front: 2, back: 1, label: '2 Front / 1 Back', desc: 'Classic wall — two mages absorb hits, one stays safe.' },
  '1f2b': { front: 1, back: 2, label: '1 Front / 2 Back', desc: 'Glass cannon — one mage tanks, two stay protected.' },
};
