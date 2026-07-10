import { motion } from 'framer-motion';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { useRosterStore } from '@/stores/rosterStore';
import { useDragToPlace } from '@/hooks/useDragToPlace';
import type { Element, Row } from '@/types';
import { ELEMENT_META, FORMATIONS, HERO_NAMES } from '@/constants';
import type { FormationKey } from '@/constants/formations';
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
      className="pointer-events-none fixed z-[500] flex h-21 w-21 -translate-x-1/2 -translate-y-1/2 scale-110 flex-col items-center justify-center gap-0.5 rounded-2xl border-2 bg-[rgba(58,44,84,0.96)] shadow-[0_14px_30px_-6px_rgba(0,0,0,0.6)]"
      style={{ left: x, top: y, borderColor: meta.color, height: 84, width: 84 }}
    >
      <div className="h-9 w-9"><MageSprite el={el} /></div>
      <span className="font-['Baloo_2'] text-[10px] font-extrabold" style={{ color: meta.color }}>{HERO_NAMES[el]}</span>
    </div>
  );
}

interface SlotProps {
  row: Row;
  occupantEl?: Element;
  onTap: () => void;
  big?: boolean;
  dragHandlers: { onPointerDown: (el: Element) => (e: ReactPointerEvent) => void; onPointerMove: (e: ReactPointerEvent) => void; onPointerUp: (e: ReactPointerEvent) => void };
  isDraggingEl: (el: Element) => boolean;
}

function Slot({ row, occupantEl, onTap, big, dragHandlers, isDraggingEl }: SlotProps) {
  const movingEl = useRosterStore((s) => s.movingEl);
  const size = big ? 96 : 84;
  return (
    <div
      onClick={occupantEl ? undefined : onTap}
      data-drop-row={row}
      data-drop-occupant={occupantEl ?? ''}
      className={`relative flex items-center justify-center rounded-2xl border-2 border-dashed transition-colors ${movingEl ? 'border-[var(--color-gold)] bg-[#2a2010]/80' : 'border-white/25 bg-[#1a1330]/55'}`}
      style={{ height: size, width: size }}
    >
      {occupantEl ? (
        <Token
          el={occupantEl}
          held={movingEl === occupantEl}
          dragging={isDraggingEl(occupantEl)}
          onPointerDown={dragHandlers.onPointerDown(occupantEl)}
          onPointerMove={dragHandlers.onPointerMove}
          onPointerUp={dragHandlers.onPointerUp}
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

export function PlacementStep() {
  const picks = useRosterStore((s) => s.picks);
  const placements = useRosterStore((s) => s.placements);
  const formationType = useRosterStore((s) => s.formationType);
  const movingEl = useRosterStore((s) => s.movingEl);
  const setFormation = useRosterStore((s) => s.setFormation);
  const pickUp = useRosterStore((s) => s.pickUp);
  const placeAt = useRosterStore((s) => s.placeAt);
  const placeDirect = useRosterStore((s) => s.placeDirect);

  const formation = FORMATIONS[formationType];
  const frontEls = picks.filter((el) => placements[el] === 'front');
  const backEls = picks.filter((el) => placements[el] === 'back');
  const benchEls = picks.filter((el) => !placements[el]);

  // Tap-driven continuation ("pick up, then tap a destination") shares state
  // with the drag gesture below via the SAME store, but taps and drags are
  // otherwise independent input paths — see useDragToPlace's doc comment.
  function handleTokenTap(tappedEl: Element) {
    if (movingEl) {
      if (movingEl === tappedEl) { pickUp(movingEl); return; }
      placeAt(placements[tappedEl] ?? null, tappedEl);
    } else {
      pickUp(tappedEl);
    }
  }

  const { ghost, onPointerDown, onPointerMove, onPointerUp } = useDragToPlace(
    (draggedEl, target, occupantEl) => placeDirect(draggedEl, target, occupantEl),
    handleTokenTap,
  );
  const isDraggingEl = (el: Element) => ghost?.el === el;
  const dragHandlers = { onPointerDown, onPointerMove, onPointerUp };

  function onSlotTap(row: Row, occupantEl?: Element) {
    if (movingEl) placeAt(row, occupantEl);
    else if (occupantEl) pickUp(occupantEl);
  }

  return (
    <div>
      <div className="mb-3.5 text-[11px] font-bold uppercase tracking-wide text-[#2c1f3d]/75">Choose your formation</div>
      <div className="mb-4 grid grid-cols-2 gap-2.5">
        {(Object.entries(FORMATIONS) as [FormationKey, typeof formation][]).map(([key, f]) => (
          <div
            key={key}
            onClick={() => setFormation(key)}
            className={`cursor-pointer rounded-2xl border-2 p-3.5 text-center transition-colors ${formationType === key ? 'border-[var(--color-gold)] bg-[#241a30]/85' : 'border-white/12 bg-[#1a1330]/70'}`}
          >
            <div className="mb-2 flex h-9 items-center justify-center gap-1.5">
              {key === '2f1b' ? (
                <>
                  <span className="h-[30px] w-4 rounded" style={{ background: formationType === key ? 'var(--color-gold)' : 'rgba(255,255,255,0.25)' }} />
                  <span className="h-[18px] w-4 self-center rounded" style={{ background: formationType === key ? 'var(--color-gold)' : 'rgba(255,255,255,0.25)' }} />
                </>
              ) : (
                <>
                  <span className="h-[18px] w-4 self-center rounded" style={{ background: formationType === key ? 'var(--color-gold)' : 'rgba(255,255,255,0.25)' }} />
                  <span className="h-[30px] w-4 rounded" style={{ background: formationType === key ? 'var(--color-gold)' : 'rgba(255,255,255,0.25)' }} />
                </>
              )}
            </div>
            <div className="font-['Baloo_2'] text-[13px] font-extrabold text-[#fff8f0]">{f.label}</div>
            <div className="mt-0.5 text-[9.5px] leading-tight text-white/50">{f.desc}</div>
          </div>
        ))}
      </div>

      <div className="mb-3.5 text-[11px] font-bold uppercase tracking-wide text-[#2c1f3d]/75">Drag mages onto the battlefield</div>
      <div className="mb-1.5 rounded-2xl border border-white/10 bg-black/20 p-3.5">
        <div className="mb-2.5 flex flex-col items-center gap-1.5 opacity-55">
          <div className="flex gap-3.5 text-xl grayscale">
            <span>👹</span><span>👹</span><span>👹</span>
          </div>
          <div className="text-[8px] font-extrabold uppercase tracking-wide text-[rgba(255,143,163,0.7)]">Enemy line</div>
        </div>
        <div className="mb-3.5 border-t-2 border-dashed border-[rgba(255,84,112,0.35)] pt-1 text-center text-[6.5px] font-bold uppercase tracking-wide text-[rgba(255,143,163,0.55)]">▼ enemy attacks from here ▼</div>

        <div className="mb-3.5">
          <div className="mb-2 text-center font-['Baloo_2'] text-[11px] font-extrabold text-[#ffb37a]">🛡 Front Line <span className="font-['Manrope'] text-[8.5px] font-semibold text-white/40">Takes hits first, shields the back</span></div>
          <div className="flex justify-center gap-3">
            {Array.from({ length: formation.front }, (_, i) => (
              <Slot key={i} row="front" occupantEl={frontEls[i]} onTap={() => onSlotTap('front', frontEls[i])} dragHandlers={dragHandlers} isDraggingEl={isDraggingEl} />
            ))}
          </div>
        </div>
        <div>
          <div className="mb-2 text-center font-['Baloo_2'] text-[11px] font-extrabold text-[#a8c6ff]">🎯 Back Line <span className="font-['Manrope'] text-[8.5px] font-semibold text-white/40">Protected — safest for glass cannons</span></div>
          <div className="flex justify-center gap-3">
            {Array.from({ length: formation.back }, (_, i) => (
              <Slot key={i} row="back" occupantEl={backEls[i]} onTap={() => onSlotTap('back', backEls[i])} big dragHandlers={dragHandlers} isDraggingEl={isDraggingEl} />
            ))}
          </div>
        </div>
      </div>

      <div className="mb-1.5 mt-3.5 text-[11px] font-bold uppercase tracking-wide text-[#2c1f3d]/75">Bench — waiting mages</div>
      <div
        data-drop-row="bench"
        onClick={(e) => { if (movingEl && !(e.target as HTMLElement).closest('[data-token]')) placeAt(null); }}
        className="mb-2 flex min-h-[80px] flex-wrap items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed border-white/20 bg-black/30 p-2.5"
      >
        {benchEls.length === 0 ? (
          <div className="py-2 text-center text-[10px] leading-relaxed text-white/55">All mages placed. Drag one back here to bench them.</div>
        ) : (
          benchEls.map((el) => (
            <div key={el} style={{ height: 84, width: 84 }}>
              <Token el={el} held={movingEl === el} dragging={isDraggingEl(el)} onPointerDown={onPointerDown(el)} onPointerMove={onPointerMove} onPointerUp={onPointerUp} />
            </div>
          ))
        )}
      </div>

      <div className="mt-2.5 text-center text-[10px] leading-relaxed text-[#2c1f3d]/65">
        {movingEl ? `${HERO_NAMES[movingEl]} is picked up — tap a slot (or the bench) to drop them there.` : 'Drag a mage onto a slot, or tap one then tap a slot to place them.'}
      </div>

      {ghost && <GhostToken el={ghost.el} x={ghost.x} y={ghost.y} />}
    </div>
  );
}
