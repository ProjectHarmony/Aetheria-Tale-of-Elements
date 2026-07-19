import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useMapStore } from '@/stores/mapStore';
import { useGameStore } from '@/stores/gameStore';
import { useHubStore } from '@/stores/hubStore';
import { useChatStore, type ChatBubble as ChatBubbleData } from '@/stores/chatStore';
import { useRoomStore } from '@/stores/roomStore';
import type { ChatRoomSummary, PartyMemberStatus, RoomActionResult } from '@/net/protocol';
import { HUB_MAP_ID, MAPS, mapAccentColor, mapBackground, mapIconFor } from '@/constants';
import { isTypingTarget } from '@/utils/dom';
import { useWheelPinchZoom } from '@/hooks/useWheelPinchZoom';
import { joinHub, leaveHub, moveHub } from '@/net/hubSync';
import { createRoom, joinRoom } from '@/net/roomSocket';
import { Joystick } from './Joystick';
import { Minimap } from './Minimap';
import { MinimapBadge } from './MinimapBadge';
import { WorldMapModal } from './WorldMapModal';
import { MapItemsSheet } from './MapItemsSheet';

const HUB_MOVE_THROTTLE_MS = 200;

const MIN_ZOOM = 0.8;
const MAX_ZOOM = 1;

const KEY_TO_DIR: Record<string, 'up' | 'down' | 'left' | 'right'> = {
  KeyW: 'up', ArrowUp: 'up',
  KeyS: 'down', ArrowDown: 'down',
  KeyA: 'left', ArrowLeft: 'left',
  KeyD: 'right', ArrowRight: 'right',
};

/** Ragnarok-style speech balloon floating above a character's sprite — World
 *  chat renders white, Party chat a pale green, matching the classic
 *  public-vs-party color split. Parented by whichever sprite wrapper is
 *  currently `relative`, so `bottom-full` stacks it just above the head
 *  regardless of that wrapper's own absolute map position. */
function ChatBubble({ bubble }: { bubble: ChatBubbleData }) {
  const isParty = bubble.channel === 'party';
  return (
    <motion.div
      initial={{ opacity: 0, y: 4, scale: 0.85 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.9 }}
      transition={{ duration: 0.18 }}
      className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1.5 w-max max-w-[130px] -translate-x-1/2"
    >
      <div
        className={`rounded-xl px-2.5 py-1.5 text-center text-[10px] font-semibold leading-snug shadow-[0_3px_10px_rgba(0,0,0,0.35)] ${
          isParty ? 'bg-[#dff5e4] text-[#1c4a2a]' : 'bg-white text-[#241a30]'
        }`}
        style={{ overflowWrap: 'break-word' }}
      >
        {bubble.body}
      </div>
      <div className={`mx-auto h-0 w-0 border-x-[5px] border-t-[6px] border-x-transparent ${isParty ? 'border-t-[#dff5e4]' : 'border-t-white'}`} />
    </motion.div>
  );
}

/** Field Party List — Name / Lv / HP for every current party member,
 *  rendered below the Minimap whenever the player is in a multiplayer party
 *  (see the chat/party system). A member's status shows "…" until their
 *  first PARTY_STATUS update arrives (or the join snapshot already carried
 *  one, if they'd reported it before you joined). */
function PartyList({ members, statuses, selfUsername }: { members: string[]; statuses: Record<string, PartyMemberStatus>; selfUsername: string | null }) {
  if (members.length === 0) return null;
  return (
    <div className="flex w-[128px] flex-col gap-1 rounded-xl border border-white/15 bg-[#241a30]/80 px-2 py-1.5 backdrop-blur-md">
      <div className="text-[7.5px] font-bold uppercase tracking-wide text-white/40">🧑‍🤝‍🧑 Party</div>
      {members.map((m) => {
        const status = statuses[m];
        return (
          <div key={m} className="text-[8.5px] leading-snug">
            <div className="truncate font-bold text-white/90">
              {status?.name || m}
              {m === selfUsername ? ' (You)' : ''}
            </div>
            <div className="text-white/50">{status ? `Lv${status.level} · ${status.hp}/${status.maxHp} HP` : '…'}</div>
          </div>
        );
      })}
    </div>
  );
}

/** Static marker above a room's creator, Crown-Haven-only — clicking it
 *  joins directly (public) or is intercepted by the caller to show a
 *  password prompt first (private). Doesn't track the creator's later
 *  movement, matching Ragnarok's own room icon behavior. */
function RoomMarker({ room, isMine, onTap }: { room: ChatRoomSummary; isMine: boolean; onTap: () => void }) {
  return (
    <button
      type="button"
      onClick={onTap}
      className="absolute flex flex-col items-center"
      style={{ left: room.x - 40, top: room.y - 46, width: 80 }}
    >
      <div
        className={`flex max-w-full items-center gap-1 rounded-full border px-2 py-1 text-[8.5px] font-bold text-white backdrop-blur-md ${
          isMine ? 'border-[var(--color-gold)]/70 bg-[var(--color-gold)]/15' : 'border-white/25 bg-black/50'
        }`}
      >
        <span className="flex-shrink-0">🗨️</span>
        <span className="truncate">{room.title}</span>
        {room.hasPassword && <span className="flex-shrink-0">🔒</span>}
      </div>
      <div className="mt-0.5 text-[7px] font-bold text-white/60">{room.occupants}/{room.maxSize}</div>
    </button>
  );
}

/** Room-creation form — Title, a max-size stepper capped 2–10, and a
 *  Public/Private toggle that only reveals the password field once Private
 *  is picked (blank password otherwise = public, per the create ack). */
function CreateRoomModal({ open, onClose, x, y }: { open: boolean; onClose: () => void; x: number; y: number }) {
  const [title, setTitle] = useState('');
  const [maxSize, setMaxSize] = useState(10);
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  async function handleCreate() {
    if (!title.trim()) { setError('Enter a room title.'); return; }
    setBusy(true);
    setError(null);
    let res: RoomActionResult;
    try {
      res = await createRoom(title.trim(), maxSize, x, y, isPrivate ? password : undefined);
    } catch {
      setBusy(false);
      setError('Lost connection to the server.');
      return;
    }
    setBusy(false);
    if (!res.ok) {
      setError(res.error === 'already-in-a-room' ? "You're already in a room." : 'Could not create room.');
      return;
    }
    setTitle('');
    setPassword('');
    setIsPrivate(false);
    setMaxSize(10);
    useChatStore.getState().setActiveTab('room');
    useChatStore.getState().setOpen(true);
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-[400] flex items-end justify-center bg-black/55 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40 }}
            animate={{ y: 0 }}
            exit={{ y: 40 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[380px] rounded-t-[24px] border border-[var(--panel-border)] bg-[#241a30] p-5 pb-7"
          >
            <div className="mb-3 font-['Baloo_2'] text-base font-extrabold text-[#fff8f0]">🗨️ Create Room</div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Room title…"
              maxLength={40}
              className="mb-3 w-full rounded-lg border border-white/15 bg-black/25 px-3 py-2 text-[12px] text-white outline-none"
            />
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[11px] font-bold text-white/70">Max players</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMaxSize((m) => Math.max(2, m - 1))}
                  className="h-7 w-7 rounded-md border border-white/16 bg-white/8 font-['Baloo_2'] font-extrabold text-white/70"
                >
                  −
                </button>
                <span className="w-6 text-center font-['Baloo_2'] text-[13px] font-extrabold text-[#fff8f0]">{maxSize}</span>
                <button
                  onClick={() => setMaxSize((m) => Math.min(10, m + 1))}
                  className="h-7 w-7 rounded-md border border-white/16 bg-white/8 font-['Baloo_2'] font-extrabold text-white/70"
                >
                  +
                </button>
              </div>
            </div>
            <div className="mb-3 flex gap-1.5">
              <button
                onClick={() => setIsPrivate(false)}
                className={`flex-1 rounded-lg py-1.5 text-[10.5px] font-bold ${!isPrivate ? 'bg-[#1a1330] text-[#fff8f0]' : 'bg-[#1a1330]/50 text-white/45'}`}
              >
                🌐 Public
              </button>
              <button
                onClick={() => setIsPrivate(true)}
                className={`flex-1 rounded-lg py-1.5 text-[10.5px] font-bold ${isPrivate ? 'bg-[#1a1330] text-[#fff8f0]' : 'bg-[#1a1330]/50 text-white/45'}`}
              >
                🔒 Private
              </button>
            </div>
            {isPrivate && (
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Room password…"
                className="mb-3 w-full rounded-lg border border-white/15 bg-black/25 px-3 py-2 text-[12px] text-white outline-none"
              />
            )}
            {error && <div className="mb-2 text-[10px] font-bold text-[var(--color-danger)]">{error}</div>}
            <div className="flex gap-2.5">
              <button onClick={onClose} className="flex-1 rounded-[13px] border-[1.5px] border-white/18 bg-white/8 py-3 font-['Baloo_2'] text-[13px] font-extrabold text-white/70">
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={busy}
                className="flex-1 rounded-[13px] py-3 font-['Baloo_2'] text-[13px] font-extrabold text-[var(--color-gold-deep)] disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, var(--color-gold), var(--color-fire))' }}
              >
                {busy ? '…' : 'Create'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Password prompt for tapping a locked room's marker — a public room skips
 *  this entirely (see handleQuickJoin) and joins straight away. */
function JoinRoomModal({ room, onClose }: { room: ChatRoomSummary | null; onClose: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setPassword('');
    setError(null);
  }, [room?.id]);

  useEffect(() => {
    if (!room) return;
    function onKeyDown(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [room, onClose]);

  async function handleJoin() {
    if (!room) return;
    setBusy(true);
    setError(null);
    let res: RoomActionResult;
    try {
      res = await joinRoom(room.id, password);
    } catch {
      setBusy(false);
      setError('Lost connection to the server.');
      return;
    }
    setBusy(false);
    if (!res.ok) {
      setError(
        res.error === 'wrong-password' ? 'Wrong password.' :
        res.error === 'full' ? 'That room is full.' :
        res.error === 'already-in-a-room' ? "You're already in a room." : 'Could not join room.',
      );
      return;
    }
    useChatStore.getState().setActiveTab('room');
    useChatStore.getState().setOpen(true);
    onClose();
  }

  return (
    <AnimatePresence>
      {room && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-[400] flex items-end justify-center bg-black/55 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40 }}
            animate={{ y: 0 }}
            exit={{ y: 40 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[380px] rounded-t-[24px] border border-[var(--panel-border)] bg-[#241a30] p-5 pb-7"
          >
            <div className="mb-1 font-['Baloo_2'] text-base font-extrabold text-[#fff8f0]">🔒 {room.title}</div>
            <div className="mb-3 text-[10.5px] text-white/50">This room requires a password.</div>
            <input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleJoin(); }}
              placeholder="Password…"
              className="mb-3 w-full rounded-lg border border-white/15 bg-black/25 px-3 py-2 text-[12px] text-white outline-none"
            />
            {error && <div className="mb-2 text-[10px] font-bold text-[var(--color-danger)]">{error}</div>}
            <div className="flex gap-2.5">
              <button onClick={onClose} className="flex-1 rounded-[13px] border-[1.5px] border-white/18 bg-white/8 py-3 font-['Baloo_2'] text-[13px] font-extrabold text-white/70">
                Cancel
              </button>
              <button
                onClick={handleJoin}
                disabled={busy}
                className="flex-1 rounded-[13px] py-3 font-['Baloo_2'] text-[13px] font-extrabold text-[var(--color-gold-deep)] disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, var(--color-gold), var(--color-fire))' }}
              >
                {busy ? '…' : 'Join'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
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
  const resting = useMapStore((s) => s.resting);
  const restPulse = useMapStore((s) => s.restPulse);
  const toggleRest = useMapStore((s) => s.toggleRest);
  const setBattleContext = useGameStore((s) => s.setBattleContext);
  const party = useGameStore((s) => s.party);
  const user = useGameStore((s) => s.user);
  const otherPlayers = useHubStore((s) => s.otherPlayers);
  const bubbles = useChatStore((s) => s.bubbles);
  const partyMembers = useChatStore((s) => s.partyMembers);
  const partyStatuses = useChatStore((s) => s.partyStatuses);
  const rooms = useRoomStore((s) => s.rooms);
  const activeRoom = useRoomStore((s) => s.activeRoom);
  const navigate = useNavigate();
  const rafRef = useRef<number>(0);
  const heldDirs = useRef(new Set<string>());
  const lastHubEmit = useRef({ t: 0, x: 0, y: 0 });
  // Read inside the WASD keydown handler (registered once, closure-stale
  // otherwise) — kept in sync by the effect below whenever activeRoom
  // changes, same "ref mirrors reactive state for a mount-once listener"
  // pattern heldDirs itself already uses.
  const inRoomRef = useRef(false);
  const elementPreview = party?.picks[0] ?? null;
  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewSize, setViewSize] = useState({ w: 370, h: 780 });
  const [worldMapOpen, setWorldMapOpen] = useState(false);
  const [itemsOpen, setItemsOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [createRoomOpen, setCreateRoomOpen] = useState(false);
  const [passwordPromptRoom, setPasswordPromptRoom] = useState<ChatRoomSummary | null>(null);
  const [roomError, setRoomError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomError) return;
    const t = setTimeout(() => setRoomError(null), 3000);
    return () => clearTimeout(t);
  }, [roomError]);

  // Being inside a chat room anchors the character in place — same as
  // Ragnarok's own room behavior, not just "the panel happens to be open."
  // Snaps any in-flight movement to a dead stop the instant a room is
  // joined/created, and blocks new WASD input for as long as you're in one
  // (see the keydown handler below and the Joystick render further down).
  useEffect(() => {
    inRoomRef.current = !!activeRoom;
    if (activeRoom) {
      heldDirs.current.clear();
      setJoyVec({ x: 0, y: 0 });
    }
  }, [activeRoom, setJoyVec]);

  async function handleQuickJoin(room: ChatRoomSummary) {
    let res: RoomActionResult;
    try {
      res = await joinRoom(room.id);
    } catch {
      setRoomError('Lost connection to the server.');
      return;
    }
    if (!res.ok) {
      setRoomError(
        res.error === 'full' ? 'That room is full.' :
        res.error === 'already-in-a-room' ? "You're already in a room." : 'Could not join room.',
      );
      return;
    }
    useChatStore.getState().setActiveTab('room');
    useChatStore.getState().setOpen(true);
  }

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
      if (!dir || isTypingTarget(document.activeElement) || inRoomRef.current) return;
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
      // Hub presence: throttled so this isn't a full-framerate socket emit —
      // only fires while actually standing in Crown Haven City, and only on
      // a real position change. Reads playerPos fresh off the store each
      // frame rather than the destructured render value, which would be
      // stale inside this effect's single long-lived rAF closure.
      const state = useMapStore.getState();
      if (state.mapId === HUB_MAP_ID) {
        const now = performance.now();
        const last = lastHubEmit.current;
        if (now - last.t >= HUB_MOVE_THROTTLE_MS && (state.playerPos.x !== last.x || state.playerPos.y !== last.y)) {
          lastHubEmit.current = { t: now, x: state.playerPos.x, y: state.playerPos.y };
          moveHub(state.playerPos.x, state.playerPos.y, elementPreview);
        }
      }
      rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  // Join/leave the hub-presence room whenever the current map crosses in or
  // out of Crown Haven City — completely separate from field/Adventure
  // roamer state, which this never touches.
  useEffect(() => {
    if (mapId === HUB_MAP_ID) {
      joinHub(playerPos.x, playerPos.y, elementPreview);
      return () => leaveHub();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapId]);

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

        {mapId === HUB_MAP_ID && Object.values(otherPlayers).map((p) => (
          <div key={p.userId} className="pointer-events-none absolute flex flex-col items-center" style={{ left: p.x - 16, top: p.y - 16 }}>
            <AnimatePresence>{bubbles[p.userId] && <ChatBubble bubble={bubbles[p.userId]!} />}</AnimatePresence>
            <span className="text-2xl" style={{ filter: 'drop-shadow(0 3px 4px rgba(0,0,0,0.4)) hue-rotate(60deg)' }}>🧙</span>
            <div className="mt-0.5 whitespace-nowrap rounded-full bg-black/45 px-1.5 py-0.5 text-[7px] font-bold text-white/75">{p.userId}</div>
          </div>
        ))}

        {mapId === HUB_MAP_ID && rooms.map((room) => (
          <RoomMarker
            key={room.id}
            room={room}
            isMine={activeRoom?.roomId === room.id}
            onTap={() => {
              if (activeRoom?.roomId === room.id) return;
              if (room.hasPassword) setPasswordPromptRoom(room);
              else handleQuickJoin(room);
            }}
          />
        ))}

        <div className="absolute flex h-8 w-8 items-center justify-center text-2xl" style={{ left: playerPos.x - 16, top: playerPos.y - 16, filter: 'drop-shadow(0 3px 4px rgba(0,0,0,0.4))' }}>
          <AnimatePresence>{user && bubbles[user] && <ChatBubble bubble={bubbles[user]!} />}</AnimatePresence>
          🧙
        </div>

        {resting && (
          <motion.div
            key={restPulse}
            initial={{ opacity: 1, y: 0, scale: 0.9 }}
            animate={{ opacity: 0, y: -26, scale: 1.1 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            className="pointer-events-none absolute font-['Baloo_2'] text-sm font-extrabold text-[var(--color-success)]"
            style={{ left: playerPos.x, top: playerPos.y - 30, transform: 'translateX(-50%)', textShadow: '0 2px 4px rgba(0,0,0,0.6)' }}
          >
            +{map.safe ? 3 : 1} HP
          </motion.div>
        )}
      </div>

      <div className="absolute left-0 right-0 top-0 z-40 flex items-start justify-between p-3.5">
        <div className="flex flex-col items-start gap-1.5">
          <div className="rounded-2xl border border-white/15 bg-[#241a30]/80 px-3.5 py-1.5 font-['Baloo_2'] text-[12px] font-bold text-white backdrop-blur-md">
            {mapIconFor(map)} {map.name}
            <span className="mt-0.5 block text-[8.5px] font-semibold text-white/45">{map.sub}</span>
          </div>
          <Minimap map={map} playerPos={playerPos} onClick={() => setWorldMapOpen(true)} />
          <PartyList members={partyMembers} statuses={partyStatuses} selfUsername={user} />
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleRest}
              className={`flex h-8 w-8 items-center justify-center rounded-full border text-base backdrop-blur-md ${
                resting ? 'border-[var(--color-gold)] bg-[var(--color-gold)]/25' : 'border-white/15 bg-[#241a30]/80'
              }`}
            >
              💤
            </button>
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

      {resting && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute left-1/2 top-16 z-40 -translate-x-1/2 rounded-full border border-[var(--color-gold)]/50 bg-[#241a30]/90 px-4 py-1.5 text-center backdrop-blur-md"
        >
          <span className="font-['Baloo_2'] text-[11px] font-bold text-[var(--color-gold)]">
            💤 Resting — +{map.safe ? 3 : 1} HP/s per mage
          </span>
        </motion.div>
      )}

      {roomError && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="absolute left-1/2 top-16 z-40 -translate-x-1/2 rounded-full border border-[var(--color-danger)]/50 bg-[#241a30]/90 px-4 py-1.5 text-center backdrop-blur-md"
        >
          <span className="font-['Baloo_2'] text-[11px] font-bold text-[var(--color-danger)]">{roomError}</span>
        </motion.div>
      )}

      {activeRoom && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute left-1/2 top-16 z-40 -translate-x-1/2 rounded-full border border-[var(--color-gold)]/50 bg-[#241a30]/90 px-4 py-1.5 text-center backdrop-blur-md"
        >
          <span className="font-['Baloo_2'] text-[11px] font-bold text-[var(--color-gold)]">
            🗨️ In "{activeRoom.title}" — Leave the room to move
          </span>
        </motion.div>
      )}

      {!activeRoom && <Joystick onChange={setJoyVec} />}

      {mapId === HUB_MAP_ID && (
        <button
          onClick={() => setCreateRoomOpen(true)}
          disabled={!!activeRoom}
          title={activeRoom ? 'Leave your current room first' : 'Create a chat room'}
          className="absolute bottom-3 right-16 z-[300] flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-[#241a30]/85 text-lg backdrop-blur-md disabled:opacity-30"
        >
          🗨️
        </button>
      )}

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
      <CreateRoomModal open={createRoomOpen} onClose={() => setCreateRoomOpen(false)} x={playerPos.x} y={playerPos.y} />
      <JoinRoomModal room={passwordPromptRoom} onClose={() => setPasswordPromptRoom(null)} />
    </div>
  );
}
