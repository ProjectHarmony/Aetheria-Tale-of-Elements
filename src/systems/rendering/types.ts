import type { ComponentType } from 'react';
import type { BattleState } from '@/types';
import type { TimedBattleEvent } from '@/stores/battleStore';

/**
 * The contract every battlefield renderer must satisfy — gameplay/state
 * code (battleStore, systems/battle) never imports a concrete renderer, it
 * only ever hands battle state + the event stream to whichever component
 * satisfies this shape. Today the only implementation is
 * DomBattlefieldRenderer (CSS/Framer Motion, matches the current 2D
 * emoji-sprite art). When real rigged 3D character models exist, a
 * R3FBattlefieldRenderer implementing the exact same props can be swapped
 * in via RENDERER_REGISTRY (see index.ts) with no changes anywhere else —
 * not in the store, not in the resolution engine, not in BattleScreen's
 * layout chrome (HUD/hand/CTA bar stay DOM regardless of battlefield mode).
 */
export interface BattlefieldRendererProps {
  battle: BattleState;
  events: TimedBattleEvent[];
  onTapHero: (heroId: string) => void;
  onUndo: (heroId: string) => void;
}

export type BattlefieldRenderer = ComponentType<BattlefieldRendererProps>;
