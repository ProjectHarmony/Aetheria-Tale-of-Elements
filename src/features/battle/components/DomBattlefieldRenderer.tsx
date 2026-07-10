import { useRef } from 'react';
import type { BattlefieldRendererProps } from '@/systems/rendering/types';
import { HeroNodesProvider } from '../context/HeroNodesContext';
import { useBattlefieldShake } from '../hooks/useBattlefieldShake';
import { useFitScale } from '../hooks/useFitScale';
import { HeroRow } from './HeroRow';
import { ArrowOverlay } from './ArrowOverlay';
import { BattleArenaBackground } from './BattleArenaBackground';

/**
 * The active battlefield renderer: 2D CSS/emoji sprites, matches the
 * original game's art direction exactly. Satisfies BattlefieldRendererProps
 * so it's a drop-in peer of any future R3F renderer — see
 * systems/rendering/types.ts for the swap contract.
 *
 * Camera: fixed side-view stage (Axie Infinity style) — player column on
 * the left facing right, enemy column on the right facing left, both
 * standing on a flat horizontal ground line. Not top-down/isometric.
 */
export function DomBattlefieldRenderer({ battle, events, onTapHero, onUndo }: BattlefieldRendererProps) {
  const shakeRef = useRef<HTMLDivElement>(null);
  useBattlefieldShake(events, shakeRef);

  // Neither column may be taller than the actually-available battlefield
  // height — that space shrinks/grows with sibling content (enemy intel
  // strip wrapping, plan-prompt text length, etc.), so a fixed scale number
  // only ever fits one specific layout. This measures both columns' real
  // (pre-transform) heights continuously and shrinks them just enough to
  // guarantee every hero stays fully visible, never clipped by the
  // battlefield's overflow-hidden edge.
  const playerRowRef = useRef<HTMLDivElement>(null);
  const enemyRowRef = useRef<HTMLDivElement>(null);
  const heroScale = useFitScale(shakeRef, [playerRowRef, enemyRowRef]);

  return (
    <HeroNodesProvider>
      <div ref={shakeRef} className="relative flex flex-1 items-end justify-between overflow-hidden px-1 py-0.5">
        <BattleArenaBackground />

        <div className="absolute left-1/2 top-1.5 z-20 flex -translate-x-1/2 gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-2 w-2 rounded-full border transition-all duration-200 ${
                i < battle.combo ? 'border-[var(--color-gold)] bg-[var(--color-gold)] shadow-[0_0_8px_var(--color-gold)]' : 'border-white/20 bg-white/12'
              }`}
            />
          ))}
        </div>

        <div
          className="pointer-events-none absolute inset-0 z-[3]"
          style={{ background: 'radial-gradient(ellipse 85% 80% at 50% 55%, transparent 55%, rgba(5,3,9,0.28))' }}
        />

        <ArrowOverlay events={events} />

        <HeroRow ref={playerRowRef} battle={battle} team={battle.players} side="player" events={events} onTapHero={onTapHero} onUndo={onUndo} scale={heroScale} />
        <HeroRow ref={enemyRowRef} battle={battle} team={battle.enemies} side="enemy" events={events} onTapHero={onTapHero} onUndo={onUndo} scale={heroScale} />
      </div>
    </HeroNodesProvider>
  );
}
