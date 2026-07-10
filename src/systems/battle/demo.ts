import type { Party } from '@/types';
import { newMageState } from './team';

/**
 * The roster/hub/auth features aren't part of this vertical slice — this
 * builds a fixed level-1 party (fire/water/earth, classic 2-front/1-back)
 * so BattlePage is playable standalone. Swap this out once features/party
 * owns real persisted party state.
 */
export function createDemoParty(): Party {
  return {
    picks: ['fire', 'water', 'earth'],
    placements: { fire: 'front', water: 'front', earth: 'back' },
    formationType: '2f1b',
    mages: {
      fire: newMageState('fire'),
      water: newMageState('water'),
      earth: newMageState('earth'),
    },
  };
}
