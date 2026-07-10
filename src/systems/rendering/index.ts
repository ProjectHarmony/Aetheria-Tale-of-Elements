import { lazy } from 'react';
import { DomBattlefieldRenderer } from '@/features/battle/components/DomBattlefieldRenderer';
import type { BattlefieldRenderer } from './types';

export type RenderMode = 'dom' | 'r3f';

/**
 * Single switch point for the whole game's battlefield rendering strategy.
 * BattleScreen reads RENDER_MODE and looks up the renderer here — it never
 * imports DomBattlefieldRenderer or R3FBattlefieldRenderer directly. Flip
 * this to 'r3f' once real 3D character assets exist.
 *
 * The 'r3f' entry is lazy-loaded: three/@react-three/fiber/@react-three/drei
 * are a real chunk of bundle weight (measured ~900kB minified), and the
 * default 'dom' mode never touches them. React.lazy + BattleScreen's
 * Suspense boundary keeps that entire dependency graph out of the initial
 * bundle until something actually switches RENDER_MODE to 'r3f'.
 */
export const RENDER_MODE: RenderMode = 'dom';

export const RENDERER_REGISTRY: Record<RenderMode, BattlefieldRenderer> = {
  dom: DomBattlefieldRenderer,
  r3f: lazy(() => import('@/features/battle/components/R3FBattlefieldRenderer').then((m) => ({ default: m.R3FBattlefieldRenderer }))),
};

export * from './types';
