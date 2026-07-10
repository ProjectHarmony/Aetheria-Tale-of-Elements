import { useCallback, useEffect, useLayoutEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import aetheriaMapArt from '@/assets/maps/aetheria-world-map.webp';
import { MAPS, MAP_ART_POSITIONS, MAP_ART_SIZE } from '@/constants';
import { useWheelPinchZoom } from '@/hooks/useWheelPinchZoom';

interface WorldMapModalProps {
  currentMapId: string;
  visitedMaps: string[];
  onClose: () => void;
}

const MIN_ZOOM = 0.3;
const MAX_ZOOM = 2.5;
const ZOOM_ANIM_MS = 200;

/** Renders the hand-illustrated Aetheria atlas art with a pin per location,
 *  in place of the old schematic node-graph — every location's name/icon is
 *  already drawn into the art, so pins are a pure "where am I / where have I
 *  been" progress overlay, not a label. Zoomable (ctrl+scroll / pinch, eased
 *  rather than snapping) and mouse-draggable, on top of native touch/scroll
 *  panning — see useWheelPinchZoom. */
export function WorldMapModal({ currentMapId, visitedMaps, onClose }: WorldMapModalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const zoomRef = useRef(1);
  const pendingAnchorRef = useRef<{ fracX: number; fracY: number; localX: number; localY: number } | null>(null);
  const zoomAnimRef = useRef<number | null>(null);
  const dragRef = useRef<{ x: number; y: number; scrollLeft: number; scrollTop: number } | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    const here = MAP_ART_POSITIONS[currentMapId];
    if (!el || !here) return;
    const [xPct, yPct] = here;
    el.scrollLeft = (xPct / 100) * MAP_ART_SIZE.w - el.clientWidth / 2;
    el.scrollTop = (yPct / 100) * MAP_ART_SIZE.h - el.clientHeight / 2;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMapId]);

  // Zoom toward the cursor/pinch point, eased over ZOOM_ANIM_MS rather than
  // snapping straight to the target — each frame re-derives the scroll
  // offset that keeps the anchor fraction (captured once, at gesture start)
  // under the same local point, so the anchor stays visually pinned for the
  // whole transition, not just at the end. A new gesture mid-animation
  // cancels and re-anchors from wherever the tween currently is.
  const handleZoom = useCallback((nextZoom: number, localX: number, localY: number) => {
    const el = scrollRef.current;
    if (!el) return;
    if (zoomAnimRef.current !== null) cancelAnimationFrame(zoomAnimRef.current);

    const startZoom = zoomRef.current;
    const fracX = (el.scrollLeft + localX) / (MAP_ART_SIZE.w * startZoom);
    const fracY = (el.scrollTop + localY) / (MAP_ART_SIZE.h * startZoom);
    const startTime = performance.now();

    function step(now: number) {
      const t = Math.min(1, (now - startTime) / ZOOM_ANIM_MS);
      const eased = 1 - (1 - t) * (1 - t);
      const z = startZoom + (nextZoom - startZoom) * eased;
      pendingAnchorRef.current = { fracX, fracY, localX, localY };
      setZoom(z);
      zoomAnimRef.current = t < 1 ? requestAnimationFrame(step) : null;
    }
    zoomAnimRef.current = requestAnimationFrame(step);
  }, []);

  useEffect(() => () => { if (zoomAnimRef.current !== null) cancelAnimationFrame(zoomAnimRef.current); }, []);

  useLayoutEffect(() => {
    zoomRef.current = zoom;
    const el = scrollRef.current;
    const anchor = pendingAnchorRef.current;
    if (!el || !anchor) return;
    el.scrollLeft = anchor.fracX * MAP_ART_SIZE.w * zoom - anchor.localX;
    el.scrollTop = anchor.fracY * MAP_ART_SIZE.h * zoom - anchor.localY;
    pendingAnchorRef.current = null;
  }, [zoom]);

  useWheelPinchZoom({ ref: scrollRef, zoom, minZoom: MIN_ZOOM, maxZoom: MAX_ZOOM, onZoom: handleZoom });

  // Click-and-drag panning (desktop mouse) — native scroll already covers
  // trackpad/touch, this adds the "grab the map" gesture mouse users expect.
  useEffect(() => {
    function onMove(e: MouseEvent) {
      const el = scrollRef.current;
      const drag = dragRef.current;
      if (!el || !drag) return;
      el.scrollLeft = drag.scrollLeft - (e.clientX - drag.x);
      el.scrollTop = drag.scrollTop - (e.clientY - drag.y);
    }
    function onUp() {
      dragRef.current = null;
      const el = scrollRef.current;
      if (el) el.style.cursor = 'grab';
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  function handleMouseDown(e: ReactMouseEvent) {
    const el = scrollRef.current;
    if (!el) return;
    dragRef.current = { x: e.clientX, y: e.clientY, scrollLeft: el.scrollLeft, scrollTop: el.scrollTop };
    el.style.cursor = 'grabbing';
  }

  const canvasW = MAP_ART_SIZE.w * zoom;
  const canvasH = MAP_ART_SIZE.h * zoom;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="flex max-h-[85vh] w-full max-w-[520px] flex-col rounded-2xl border border-white/15 bg-[#1a1330] p-4 shadow-2xl">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-['Baloo_2'] text-[15px] font-extrabold text-white">🗺️ World Map</h2>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white/70">✕</button>
        </div>

        <div className="wm-legend">
          <span><i style={{ background: 'var(--color-gold)' }} />You are here</span>
          <span><i style={{ background: 'rgba(255,255,255,0.85)' }} />Visited</span>
          <span><i style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)' }} />Unexplored</span>
        </div>

        <div className="wm-scroll" ref={scrollRef} onMouseDown={handleMouseDown}>
          <div className="wm-art-canvas" style={{ width: canvasW, height: canvasH }}>
            <img src={aetheriaMapArt} alt="Map of Aetheria" width={canvasW} height={canvasH} className="block max-w-none select-none" draggable={false} />

            {Object.values(MAPS).map((m) => {
              const p = MAP_ART_POSITIONS[m.id];
              if (!p) return null;
              const [xPct, yPct] = p;
              const here = currentMapId === m.id;
              const visited = visitedMaps.includes(m.id);
              const cls = ['wm-pin'];
              if (here) cls.push('wm-pin-here');
              else if (visited) cls.push('wm-pin-visited');
              else cls.push('wm-pin-unexplored');
              return (
                <div
                  key={m.id}
                  id={`wmPin_${m.id}`}
                  className={cls.join(' ')}
                  style={{ left: `${xPct}%`, top: `${yPct}%` }}
                >
                  {here && <div className="wm-here-pin">📍 YOU ARE HERE</div>}
                </div>
              );
            })}
          </div>
        </div>

        <p className="mt-2.5 text-center text-[9px] leading-relaxed text-white/40">
          Drag to explore, ctrl+scroll (or pinch) to zoom. Crown Haven City sits at the heart of
          Aetheria — every road, coastline, and mountain pass eventually leads back to it.
        </p>
      </div>
    </div>
  );
}
