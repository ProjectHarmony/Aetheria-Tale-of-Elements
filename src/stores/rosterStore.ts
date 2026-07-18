import { create } from 'zustand';
import type { Element } from '@/types';

/** New-character creation flow: Character Creation (name/hair/eye — see
 *  AppearanceStep) then a Story beat that ends in picking the character's
 *  ONE main element (see StoryStep). No placement/formation step anymore —
 *  that only ever mattered for a multi-mage squad, and a character is a
 *  single mage now (see the MMORPG rehaul plan). */
interface RosterStore {
  step: 'appearance' | 'story';
  characterName: string;
  hairColor: string;
  eyeColor: string;
  el: Element | null;

  reset: () => void;
  setCharacterName: (name: string) => void;
  setHairColor: (color: string) => void;
  setEyeColor: (color: string) => void;
  goToStory: () => void;
  goBackToAppearance: () => void;
  pickElement: (el: Element) => void;
}

const initialState = {
  step: 'appearance' as const,
  characterName: '',
  hairColor: '',
  eyeColor: '',
  el: null as Element | null,
};

export const useRosterStore = create<RosterStore>((set) => ({
  ...initialState,

  reset: () => set({ ...initialState }),

  setCharacterName: (name) => set({ characterName: name }),
  setHairColor: (color) => set({ hairColor: color }),
  setEyeColor: (color) => set({ eyeColor: color }),

  goToStory: () => set({ step: 'story' }),
  goBackToAppearance: () => set({ step: 'appearance' }),

  pickElement: (el) => set((s) => ({ el: s.el === el ? null : el })),
}));
