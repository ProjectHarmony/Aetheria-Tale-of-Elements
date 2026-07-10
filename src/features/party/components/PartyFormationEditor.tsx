import { useState } from 'react';
import { motion } from 'framer-motion';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { Element, Row } from '@/types';
import { ELEMENT_META, FORMATIONS, HERO_NAMES } from '@/constants';
import type { FormationKey } from '@/constants/formations';
import { useGameStore } from '@/stores/gameStore';
import { useDragToPlace } from '@/hooks/useDragToPlace';
import { MageSprite } from '@/components/ui/MageSprite';

interface TokenProps {
  el: Element;
  held: boolean;
  dragging: boolean;
  onPointerDown: (e: ReactPointerEvent) => void;
  onPointerMove: (e: ReactPointerEvent) => void;
  onPointerUp: (e: ReactPointerEvent) => void;
}

function Token({ el, held, dragging, onPointerDown, onPointerMove, onPointerUp }: TokenProps) {
  const meta = ELEMENT_META[el];
  return (
    <motion.div
      data-token=""
      whileTap={{ scale: 0.92 }}
      animate={held ? { scale: 1.08, boxShadow: '0 0 0 3px var(--color-gold)' } : { scale: 1, boxShadow: '0 0 0 0px transparent' }}
      style={{ borderColor: meta.color, opacity: dragging ? 0.28 : 1, touchAction: 'none' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className="flex h-full w-full cursor-grab flex-col items-center justify-center gap-0.5 rounded-2xl border-2 bg-[rgba(44,28,64,0.85)]"
    >
      <div className="h-9 w-9"><MageSprite el={el} /></div>
      <span className="font-['Baloo_2'] text-[10px] font-extrabold" style={{ color: meta.color }}>{HERO_NAMES[el]}</span>
      <span className="text-[6px] font-extrabold uppercase tracking-wide text-white/40">{held ? 'Tap a slot' : 'Drag or tap'}</span>
    </motion.div>
  );
}

function GhostToken({ el, x, y }: { el: Element; x: number; y: number }) {
  const meta = ELEMENT_META[el];
  return (
    <div
      className="pointer-events-none fixed z-[500] -translate-x-1/2 -translate-y-1/2 scale-110 flex-col items-center justify-center gap-0.5 rounded-2xl border-2 bg-[rgba(58,44,84,0.96)] shadow-[0_14px_30px_-6px_rgba(0,0,0,0.6)] flex"
      style={{ left: x, top: y, height: 84, width: 84, borderColor: meta.color }}
    >
      <div className="h-9 w-9"><MageSprite el={el} /></div>
      <span className="font-['Baloo_2'] text-[10px] font-extrabold" style={{ color: meta.color }}>{HERO_NAMES[el]}</span>
    </div>
  );
}

export function PartyFormationEditor({ onBack }: { onBack: () => void }) {
  const party = useGameStore((s) => s.party);
  const setFormationType = useGameStore((s) => s.setFormationType);
  const moveMagePlacement = useGameStore((s) => s.moveMagePlacement);
  const [movingEl, setMovingEl] = useState<Element | null>(null);

  function pickUp(el: Element) {
    setMovingEl((cur) => (cur === el ? null : el));
  }
  function dropAt(target: Row | null, targetOccupantEl?: Element) {
    if (!movingEl) return;
    moveMagePlacement(movingEl, target, targetOccupantEl);
    setMovingEl(null);
  }
  function handleTokenTap(tappedEl: Element) {
    if (movingEl) {
      if (movingEl === tappedEl) { pickUp(movingEl); return; }
      dropAt(party?.placements[tappedEl] ?? null, tappedEl);
    } else {
      pickUp(tappedEl);
    }
  }

  const { ghost, onPointerDown, onPointerMove, onPointerUp } = useDragToPlace(
    (draggedEl, target, occupantEl) => moveMagePlacement(draggedEl, target, occupantEl),
    handleTokenTap,
  );
  const isDraggingEl = (el: Element) => ghost?.el === el;

  if (!party) return null;
  const formation = FORMATIONS[party.formationType];
  const frontEls = party.picks.filter((el) => party.placements[el] === 'front');
  const backEls = party.picks.filter((el) => party.placements[el] === 'back');
  const benchEls = party.picks.filter((el) => !party.placements[el]);
  const complete = frontEls.length === formation.front && backEls.length === formation.back;

  function slot(row: Row, occupantEl: Element | undefined, big?: boolean) {
    const size = big ? 96 : 84;
    return (
      <div
        onClick={occupantEl ? undefined : () => dropAt(row)}
        data-drop-row={row}
        data-drop-occupant={occupantEl ?? ''}
        className={`flex items-center justify-center rounded-2xl border-2 border-dashed ${movingEl ? 'border-[var(--color-gold)] bg-[#2a2010]/80' : 'border-white/25 bg-[#1a1330]/55'}`}
        style={{ height: size, width: size }}
      >
        {occupantEl ? (
          <Token
            el={occupantEl}
            held={movingEl === occupantEl}
            dragging={isDraggingEl(occupantEl)}
            onPointerDown={onPointerDown(occupantEl)}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          />
        ) : (
          <div className="flex flex-col items-center gap-0.5 text-white/50">
            <span className="text-xl leading-none">+</span>
            <span className="text-[7px] font-extrabold uppercase tracking-wide">{row === 'front' ? 'Front' : 'Back'}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <button onClick={onBack} className="mb-3 flex items-center gap-1 text-[11px] font-bold text-[#2c1f3d]/80">← Mages</button>

      <div className="mb-3 text-[11px] font-bold uppercase tracking-wide text-[#2c1f3d]/75">Formation</div>
      <div className="mb-4 grid grid-cols-2 gap-2.5">
        {(Object.entries(FORMATIONS) as [FormationKey, typeof formation][]).map(([key, f]) => (
          <div
            key={key}
            onClick={() => setFormationType(key)}
            className={`cursor-pointer rounded-2xl border-2 p-3 text-center ${party.formationType === key ? 'border-[var(--color-gold)] bg-[#241a30]/85' : 'border-white/12 bg-[#1a1330]/70'}`}
          >
            <div className="font-['Baloo_2'] text-[12.5px] font-extrabold text-[#fff8f0]">{f.label}</div>
            <div className="mt-0.5 text-[9px] leading-tight text-white/50">{f.desc}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/20 p-3.5">
        <div className="mb-2 text-center font-['Baloo_2'] text-[11px] font-extrabold text-[#ffb37a]">🛡 Front Line</div>
        <div className="mb-3.5 flex justify-center gap-3">{Array.from({ length: formation.front }, (_, i) => <div key={i}>{slot('front', frontEls[i])}</div>)}</div>
        <div className="mb-2 text-center font-['Baloo_2'] text-[11px] font-extrabold text-[#a8c6ff]">🎯 Back Line</div>
        <div className="flex justify-center gap-3">{Array.from({ length: formation.back }, (_, i) => <div key={i}>{slot('back', backEls[i], true)}</div>)}</div>
      </div>

      <div className="mb-1.5 mt-3.5 text-[11px] font-bold uppercase tracking-wide text-[#2c1f3d]/75">Bench</div>
      <div
        data-drop-row="bench"
        onClick={(e) => { if (movingEl && !(e.target as HTMLElement).closest('[data-token]')) dropAt(null); }}
        className="mb-2 flex min-h-[70px] flex-wrap items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed border-white/20 bg-black/30 p-2.5"
      >
        {benchEls.length === 0 ? (
          <div className="py-1.5 text-center text-[10px] text-white/55">All mages placed.</div>
        ) : (
          benchEls.map((el) => (
            <div key={el} style={{ height: 84, width: 84 }}>
              <Token el={el} held={movingEl === el} dragging={isDraggingEl(el)} onPointerDown={onPointerDown(el)} onPointerMove={onPointerMove} onPointerUp={onPointerUp} />
            </div>
          ))
        )}
      </div>

      {!complete && (
        <div className="mt-2 inline-block w-full rounded-xl bg-[#3a1f28]/85 px-2.5 py-2 text-center text-[10.5px] font-bold text-[var(--color-danger)]">
          ⚠ Formation must have exactly {formation.front} Front + {formation.back} Back before battle.
        </div>
      )}

      {ghost && <GhostToken el={ghost.el} x={ghost.x} y={ghost.y} />}
    </div>
  );
}
