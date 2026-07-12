import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMapStore } from '@/stores/mapStore';
import { useGameStore } from '@/stores/gameStore';
import { HUB_MAP_ID, MAPS, mapAccentColor, mapBackground, mapIconFor } from '@/constants';
import { useWheelPinchZoom } from '@/hooks/useWheelPinchZoom';
import { Joystick } from './Joystick';
import { Minimap } from './Minimap';
import { MinimapBadge } from './MinimapBadge';
import { WorldMapModal } from './WorldMapModal';
import { MapItemsSheet } from './MapItemsSheet';

const MIN_ZOOM = 0.8;
const MAX_ZOOM = 1;

const KEY_TO_DIR: Record<string, 'up' | 'down' | 'left' | 'right'> = {
  KeyW: 'up', ArrowUp: 'up',
  KeyS: 'down', ArrowDown: 'down',
  KeyA: 'left', ArrowLeft: 'left',
  KeyD: 'right', ArrowRight: 'right',
};

function isTypingTarget(el: Element | null): boolean {
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || (el as HTMLElement).isContentEditable);
}

export function MapPage() {
  const mapId = useMapStore((s) => s.mapId);
  const playerPos = useMapStore((s) => s.playerPos);
  const roamers = useMapStore((s) => s.roamers);
  const pendingEncounter = useMapStore((s) => s.pendingEncounter);
  const activeEncounter = useMapStore((s) => s.activeEncounter);
  const initialized = useMapStore((s) => s.initialized);
  const visitedMaps = useMapStore((s) => s.visitedMaps);
  const areaBanner = useMapStore((s) => s.areaBanner);
  const locked = useMapStore((s) => s.locked);
  const enterMap = useMapStore((s) => s.enterMap);
  const setJoyVec = useMapStore((s) => s.setJoyVec);
  const tick = useMapStore((s) => s.tick);
  const clearEncounter = useMapStore((s) => s.clearEncounter);
  const triggerEncounter = useMapStore((s) => s.triggerEncounter);
  const setBattleContext = useGameStore((s) => s.setBattleContext);
  const navigate = useNavigate();
  const rafRef = useRef<number>(0);
  const heldDirs = useRef(new Set<string>());
  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewSize, setViewSize] = useState({ w: 370, h: 780 });
  const [worldMapOpen, setWorldMapOpen] = useState(false);
  const [itemsOpen, setItemsOpen] = useState(false);
  const [zoom, setZoom] = useState(1);

  // Gameplay camera always centers on the player, never on the cursor/pinch
  // point, so the gesture's anchor coordinates are irrelevant here — unlike
  // the World Map modal, there's no separate scroll/pan state to preserve.
  useWheelPinchZoom({ ref: viewportRef, zoom, minZoom: MIN_ZOOM, maxZoom: MAX_ZOOM, onZoom: setZoom });

  useEffect(() => {
    // First mount this session (fresh page load, or a brand-new player):
    // mapId/playerPos may already reflect a persisted save, so resume THERE
    // rather than hardcoding Veyhollow — unless that persisted mapId no
    // longer exists (e.g. an older save from before the map graph was
    // expanded/renamed), in which case fall back to the hub rather than
    // silently rendering nothing. A remount from returning out of a battle
    // (store already initialized this session) just consumes the encounter
    // outcome and unlocks movement.
    if (!initialized) {
      enterMap(MAPS[mapId] ? mapId : HUB_MAP_ID, MAPS[mapId] ? playerPos : undefined);
    } else if (!activeEncounter) {
      clearEncounter();
    }
    // (activeEncounter, if present on remount, is resolved by BattlePage
    // calling resolveEncounter() before navigating back here.)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Real viewport measurement (not a hardcoded phone size) so the camera
  // centers correctly whether we're in the mobile phone-card or the wide
  // desktop panel.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      if (r.width && r.height) setViewSize({ w: r.width, h: r.height });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // WASD + arrow keys, always active alongside the touch joystick — both
  // drive the same joyVec the store's tick() consumes, so portal/encounter/
  // aggro checks all just work regardless of input source.
  useEffect(() => {
    function recompute() {
      let x = 0, y = 0;
      const dirs = heldDirs.current;
      if (dirs.has('left')) x -= 1;
      if (dirs.has('right')) x += 1;
      if (dirs.has('up')) y -= 1;
      if (dirs.has('down')) y += 1;
      if (x !== 0 && y !== 0) { x *= 0.7071; y *= 0.7071; }
      setJoyVec({ x, y });
    }
    function onKeyDown(e: KeyboardEvent) {
      const dir = KEY_TO_DIR[e.code];
      if (!dir || isTypingTarget(document.activeElement)) return;
      if (e.repeat === false || !heldDirs.current.has(dir)) e.preventDefault();
      heldDirs.current.add(dir);
      recompute();
    }
    function onKeyUp(e: KeyboardEvent) {
      const dir = KEY_TO_DIR[e.code];
      if (!dir) return;
      heldDirs.current.delete(dir);
      recompute();
    }
    function onBlur() { heldDirs.current.clear(); recompute(); }
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function loop() {
      tick();
      rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [tick]);

  useEffect(() => {
    if (pendingEncounter) {
      setBattleContext('adventure');
      navigate('/battle');
    }
  }, [pendingEncounter, navigate, setBattleContext]);

  const map = MAPS[mapId];
  if (!map) return null;

  const effViewW = viewSize.w / zoom;
  const effViewH = viewSize.h / zoom;
  const camX = Math.max(0, Math.min(playerPos.x - effViewW / 2, map.w - effViewW));
  const camY = Math.max(0, Math.min(playerPos.y - effViewH / 2, map.h - effViewH));

  return (
    <div ref={viewportRef} className="relative h-full w-full overflow-hidden touch-none" style={{ background: mapBackground(map) }}>
      <div
        className="absolute left-0 top-0"
        style={{ width: map.w, height: map.h, transform: `scale(${zoom}) translate(${-camX}px, ${-camY}px)`, transformOrigin: '0 0' }}
      >
        <div className="pointer-events-none absolute left-1/2 top-2.5 -translate-x-1/2 text-center font-['Baloo_2'] text-xs font-extrabold text-white/55" style={{ textShadow: '0 2px 6px rgba(0,0,0,0.6)' }}>
          {mapIconFor(map)} {map.name}
          <span className="mt-0.5 block text-[9px] font-semibold text-white/35">{map.sub}</span>
        </div>

        {map.portals.map((p) => (
          <div key={`${p.dir}-${p.to}`} className="absolute flex flex-col items-center" style={{ left: p.x - 26, top: p.y - 32 }}>
            <motion.div
              className="h-11 w-11 rounded-full border-[3px] border-white/60"
              style={{ background: `radial-gradient(circle, ${mapAccentColor(MAPS[p.to] ?? map)}, transparent 70%)` }}
              animate={{ rotate: 360, scale: [1, 1.08, 1] }}
              transition={{ rotate: { duration: 3, repeat: Infinity, ease: 'linear' }, scale: { duration: 1.5, repeat: Infinity } }}
            />
            <div className="mt-1 whitespace-nowrap rounded-full bg-[#241a30]/85 px-2 py-0.5 text-[8px] font-bold text-white">{p.label}</div>
          </div>
        ))}

        {map.landmarks?.map((l) => (
          <div
            key={l.name}
            className="pointer-events-none absolute flex flex-col items-center"
            style={{ left: l.x, top: l.y - 6 }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-white/50" />
            <div className="mt-1 whitespace-nowrap rounded-full bg-black/40 px-1.5 py-0.5 text-[7px] font-semibold text-white/60">{l.name}</div>
          </div>
        ))}

        {roamers.map((r) => (
          <div
            key={r.id}
            className="absolute flex h-9 w-9 cursor-pointer items-center justify-center"
            style={{ left: r.x - 18, top: r.y - 18 }}
            onClick={() => triggerEncounter(r.id)}
          >
            {r.aggro && (
              <motion.div
                className="absolute inset-[-6px] rounded-full border-2 border-[var(--color-danger)]"
                animate={{ opacity: [0.3, 0.8, 0.3], scale: [0.9, 1.05, 0.9] }}
                transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}
            <span className="text-[26px]" style={{ filter: r.aggro ? 'drop-shadow(0 0 6px rgba(255,84,112,0.7))' : 'drop-shadow(0 3px 4px rgba(0,0,0,0.35))' }}>
              {r.meta.icon}
            </span>
          </div>
        ))}

        <div className="absolute flex h-8 w-8 items-center justify-center text-2xl" style={{ left: playerPos.x - 16, top: playerPos.y - 16, filter: 'drop-shadow(0 3px 4px rgba(0,0,0,0.4))' }}>
          🧙
        </div>
      </div>

      <div className="absolute left-0 right-0 top-0 z-40 flex items-start justify-between p-3.5">
        <div className="flex flex-col items-start gap-1.5">
          <div className="rounded-2xl border border-white/15 bg-[#241a30]/80 px-3.5 py-1.5 font-['Baloo_2'] text-[12px] font-bold text-white backdrop-blur-md">
            {mapIconFor(map)} {map.name}
            <span className="mt-0.5 block text-[8.5px] font-semibold text-white/45">{map.sub}</span>
          </div>
          <Minimap map={map} playerPos={playerPos} onClick={() => setWorldMapOpen(true)} />
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setItemsOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-[#241a30]/80 text-base backdrop-blur-md"
            >
              🎒
            </button>
            <button
              onClick={() => navigate('/hub')}
              className="rounded-2xl border border-white/15 bg-[#241a30]/80 px-3 py-1.5 font-['Baloo_2'] text-[11px] font-bold text-white backdrop-blur-md"
            >
              🏠 Hub
            </button>
          </div>
          <MinimapBadge mapId={mapId} visitedMaps={visitedMaps} onClick={() => setWorldMapOpen(true)} />
        </div>
      </div>

      <Joystick onChange={setJoyVec} />

      <div className={`map-transition-veil ${locked && !pendingEncounter ? 'show' : ''}`} />
      <div className={`map-area-banner ${areaBanner ? 'show' : ''}`}>
        {areaBanner && (
          <>
            <div className="font-['Baloo_2'] text-lg font-extrabold text-white" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.7)' }}>
              {areaBanner.icon} {areaBanner.name}
            </div>
            <div className="mt-0.5 text-[10px] font-semibold text-white/60">{areaBanner.sub}</div>
          </>
        )}
      </div>

      {worldMapOpen && <WorldMapModal currentMapId={mapId} visitedMaps={visitedMaps} onClose={() => setWorldMapOpen(false)} />}
      <MapItemsSheet open={itemsOpen} map={map} onClose={() => setItemsOpen(false)} />
    </div>
  );
}
