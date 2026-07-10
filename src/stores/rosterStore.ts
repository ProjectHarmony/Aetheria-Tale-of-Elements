import { create } from 'zustand';
import type { Element, Row } from '@/types';
import type { FormationKey } from '@/constants/formations';
import { computePlacementAfterMove } from '@/systems/party';

interface RosterStore {
  step: 'pickMage' | 'placement';
  picks: Element[];
  previewEl: Element | null;
  formationType: FormationKey;
  placements: Partial<Record<Element, Row>>;
  movingEl: Element | null;

  reset: () => void;
  toggleElement: (el: Element) => void;
  setPreview: (el: Element) => void;
  goToPlacement: () => void;
  goBackToPickMage: () => void;
  setFormation: (key: FormationKey) => void;
  pickUp: (el: Element) => void;
  placeAt: (target: Row | null, targetOccupantEl?: Element) => void;
  /** For drag gestures: places `movingEl` directly, independent of any tap-flow `movingEl` in store state. */
  placeDirect: (movingEl: Element, target: Row | null, targetOccupantEl?: Element) => void;
}

const initialState = {
  step: 'pickMage' as const,
  picks: [] as Element[],
  previewEl: null as Element | null,
  formationType: '2f1b' as FormationKey,
  placements: {} as Partial<Record<Element, Row>>,
  movingEl: null as Element | null,
};

export const useRosterStore = create<RosterStore>((set, get) => ({
  ...initialState,

  reset: () => set({ ...initialState }),

  toggleElement: (el) => {
    const { picks } = get();
    if (picks.includes(el)) {
      set({ picks: picks.filter((p) => p !== el), previewEl: null });
    } else if (picks.length < 3) {
      set({ picks: [...picks, el], previewEl: el });
    } else {
      set({ previewEl: el });
    }
  },

  setPreview: (el) => set({ previewEl: el }),

  goToPlacement: () => set({ step: 'placement', placements: {}, movingEl: null }),
  goBackToPickMage: () => set({ step: 'pickMage' }),

  setFormation: (key) => {
    // Switching shapes invalidates old slot positions — bench everyone and
    // let the player re-place deliberately rather than silently reshuffling.
    set({ formationType: key, placements: {}, movingEl: null });
  },

  pickUp: (el) => set((s) => ({ movingEl: s.movingEl === el ? null : el })),

  placeAt: (target, targetOccupantEl) => {
    const { movingEl, placements } = get();
    if (!movingEl) return;
    set({ placements: computePlacementAfterMove(placements, movingEl, target, targetOccupantEl), movingEl: null });
  },

  placeDirect: (movingEl, target, targetOccupantEl) => {
    const { placements } = get();
    set({ placements: computePlacementAfterMove(placements, movingEl, target, targetOccupantEl), movingEl: null });
  },
}));
