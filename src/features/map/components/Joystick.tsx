import { useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { Vec2 } from '@/types';

const JOY_R = 48;

/** Floating joystick: the base appears wherever the finger first lands
 *  inside the zone (not pinned to a fixed spot), matching the original's
 *  touch-anywhere-to-steer feel. */
export function Joystick({ onChange }: { onChange: (vec: Vec2) => void }) {
  const zoneRef = useRef<HTMLDivElement>(null);
  const [base, setBase] = useState<Vec2 | null>(null);
  const [knob, setKnob] = useState<Vec2>({ x: 0, y: 0 });
  const pointerIdRef = useRef<number | null>(null);

  function toLocal(clientX: number, clientY: number): Vec2 {
    const rect = zoneRef.current!.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  function handleDown(e: ReactPointerEvent) {
    pointerIdRef.current = e.pointerId;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setBase(toLocal(e.clientX, e.clientY));
    setKnob({ x: 0, y: 0 });
  }

  function handleMove(e: ReactPointerEvent) {
    if (pointerIdRef.current !== e.pointerId || !base) return;
    const local = toLocal(e.clientX, e.clientY);
    let dx = local.x - base.x;
    let dy = local.y - base.y;
    const dist = Math.hypot(dx, dy);
    if (dist > JOY_R) {
      dx = (dx / dist) * JOY_R;
      dy = (dy / dist) * JOY_R;
    }
    setKnob({ x: dx, y: dy });
    onChange({ x: dx / JOY_R, y: dy / JOY_R });
  }

  function handleUp() {
    pointerIdRef.current = null;
    setBase(null);
    setKnob({ x: 0, y: 0 });
    onChange({ x: 0, y: 0 });
  }

  return (
    <div
      ref={zoneRef}
      className="absolute bottom-0 left-0 z-40 h-[200px] w-[170px] touch-none"
      onPointerDown={handleDown}
      onPointerMove={handleMove}
      onPointerUp={handleUp}
      onPointerCancel={handleUp}
    >
      {base && (
        <div
          className="absolute flex h-24 w-24 items-center justify-center rounded-full border-2 border-white/25 bg-black/40"
          style={{ left: base.x - 48, top: base.y - 48 }}
        >
          <div
            className="h-11 w-11 rounded-full border-[1.5px] border-white/50"
            style={{
              transform: `translate(${knob.x}px, ${knob.y}px)`,
              background: 'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.4), var(--color-gold))',
            }}
          />
        </div>
      )}
    </div>
  );
}
