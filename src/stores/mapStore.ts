import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Roamer, Vec2 } from '@/types';
import { BOSS_UNDERLINGS, HUB_MAP_ID, MAPS, MONSTER_META, RESPAWN_MS } from '@/constants';
import {
  ambientDrift,
  computeArrivalSpawn,
  findEncounter,
  findPortal,
  movePlayer,
  resolveRoamers,
  slotKey,
  stepAggro,
} from '@/systems/map';
import { useGameStore } from './gameStore';

/** HP/sec regenerated to every party mage while Resting — safer, faster in
 *  Crown Haven City; slower (and still interruptible by a roaming monster)
 *  everywhere else in the field. */
const REST_HP_PER_SEC = { safe: 3, field: 1 };
const REST_TICK_MS = 1000;

/** A Boss + its 2 Underlings always fight together (always exactly 3,
 *  matching the player's 3v3) — walking into any one of the trio pulls in
 *  whichever of the other 2 are currently present as roamers on this map. */
export interface ActiveEncounter {
  mapId: string;
  /** Parallel to `names` — -1 marks a battle-only member with no map slot of
   *  its own (a Boss's Underlings), skipped by resolveEncounter's per-slot
   *  respawn scheduling since they're tied to the Boss's own respawn instead. */
  slots: number[];
  names: string[];
}

export interface AreaBanner {
  icon: string;
  name: string;
  sub: string;
}

interface MapStore {
  mapId: string;
  playerPos: Vec2;
  roamers: Roamer[];
  joyVec: Vec2;
  locked: boolean;
  pendingEncounter: boolean;
  activeEncounter: ActiveEncounter | null;
  initialized: boolean;
  visitedMaps: string[];
  areaBanner: AreaBanner | null;
  /** Standing still and recovering HP over time — see REST_HP_PER_SEC. Movement
   *  input is ignored entirely while resting (you can't drift off mid-heal);
   *  only the Rest button (toggleRest) or an interrupting encounter ends it. */
  resting: boolean;
  /** Increments once per successful regen tick while resting — MapPage
   *  watches this to pop a fresh "+3 HP" indicator each second without
   *  re-deriving its own separate timer. */
  restPulse: number;

  enterMap: (mapId: string, spawn?: Vec2) => void;
  changeMap: (mapId: string, spawn: Vec2) => void;
  setJoyVec: (vec: Vec2) => void;
  tick: () => void;
  clearEncounter: () => void;
  triggerEncounter: (roamerId: string) => void;
  resolveEncounter: (won: boolean) => void;
  /** Instantly warps the player to Crown Haven City — used by a Town Portal
   *  Scroll (see MapItemsSheet) and shared with resolveEncounter's loss path. */
  warpToHub: () => void;
  toggleRest: () => void;
}

// Session-only (never persisted, matching the original's plain in-memory
// variables): respawn cooldowns for regular/elite/miniboss roamers, and each
// Boss's world-singleton "last defeated at" timestamp.
const respawnAt: Record<string, number> = {};
const bossDefeatedAt: Record<string, number> = {};
let lastAmbientTick = 0;
const AMBIENT_INTERVAL_MS = 2200;
let lastRestTick = 0;

/** A Boss roamer always pulls its 2 Underlings into the battle alongside it —
 *  the Underlings never roam the map themselves (slot -1: no map presence,
 *  no independent respawn tracking), they only exist as battle participants. */
function encounterGroup(hitRoamer: Roamer): { slot: number; name: string }[] {
  const underlings = BOSS_UNDERLINGS[hitRoamer.name];
  if (!underlings) return [{ slot: hitRoamer.slot, name: hitRoamer.name }];
  return [{ slot: hitRoamer.slot, name: hitRoamer.name }, ...underlings.map((name) => ({ slot: -1, name }))];
}

/** Only "where was I" + exploration progress persist — roamers, joystick
 *  vector, and lock/encounter flags are session-transient and always
 *  rebuilt fresh by MapPage's mount effect via enterMap(). */
export const useMapStore = create<MapStore>()(
  persist(
    (set, get) => ({
      mapId: HUB_MAP_ID,
      playerPos: { x: 750, y: 750 },
      roamers: [],
      joyVec: { x: 0, y: 0 },
      locked: false,
      pendingEncounter: false,
      activeEncounter: null,
      initialized: false,
      visitedMaps: [HUB_MAP_ID],
      areaBanner: null,
      resting: false,
      restPulse: 0,

      enterMap: (mapId, spawn) => {
        const map = MAPS[mapId];
        if (!map) return;
        const playerPos = spawn ?? { x: map.w / 2, y: map.h / 2 };
        set((s) => ({
          mapId,
          playerPos,
          roamers: resolveRoamers(map, respawnAt, bossDefeatedAt),
          joyVec: { x: 0, y: 0 },
          pendingEncounter: false,
          activeEncounter: null,
          initialized: true,
          resting: false,
          visitedMaps: s.visitedMaps.includes(mapId) ? s.visitedMaps : [...s.visitedMaps, mapId],
        }));
      },

      // Real traversal (portal walked into) — brief lock while the fade
      // veil + area-name banner play, matching the original's TransitionManager.
      changeMap: (mapId, spawn) => {
        const map = MAPS[mapId];
        if (!map || get().locked) return;
        set({ locked: true });
        setTimeout(() => {
          get().enterMap(mapId, spawn);
          set({
            areaBanner: { icon: map.safe ? '⛩' : '🌐', name: map.name, sub: map.sub },
          });
          setTimeout(() => set({ areaBanner: null }), 1700);
          setTimeout(() => set({ locked: false }), 180);
        }, 180);
      },

      setJoyVec: (vec) => set({ joyVec: vec }),

      tick: () => {
        const { mapId, playerPos, roamers, joyVec, locked, pendingEncounter, resting } = get();
        if (locked || pendingEncounter) return;
        const map = MAPS[mapId];
        if (!map) return;

        // Resting locks the player in place — movement input is ignored
        // entirely (no auto-cancel-on-move), so a stray joystick nudge can't
        // accidentally cut a heal short. Only the Rest button or an
        // interrupting encounter ends it. Roamers still aggro/drift/ambush as
        // normal below — resting out in the field is real risk for a slower
        // heal, not a free pause.
        if (resting) {
          const now = performance.now();
          if (now - lastRestTick >= REST_TICK_MS) {
            lastRestTick = now;
            useGameStore.getState().regenParty(map.safe ? REST_HP_PER_SEC.safe : REST_HP_PER_SEC.field);
            set({ restPulse: get().restPulse + 1 });
          }

          let nextRoamers = stepAggro(roamers, map, playerPos, 4.5);
          if (now - lastAmbientTick >= AMBIENT_INTERVAL_MS) {
            lastAmbientTick = now;
            nextRoamers = ambientDrift(nextRoamers, map);
          }

          const hit = findEncounter(playerPos, nextRoamers);
          if (hit) {
            const group = encounterGroup(hit);
            set({
              roamers: nextRoamers,
              pendingEncounter: true,
              locked: true,
              resting: false,
              activeEncounter: { mapId, slots: group.map((r) => r.slot), names: group.map((r) => r.name) },
            });
            return;
          }

          set({ roamers: nextRoamers });
          return;
        }

        const nextPos = movePlayer(playerPos, joyVec, map);
        let nextRoamers = stepAggro(roamers, map, nextPos, 4.5);

        const now = performance.now();
        if (now - lastAmbientTick >= AMBIENT_INTERVAL_MS) {
          lastAmbientTick = now;
          nextRoamers = ambientDrift(nextRoamers, map);
        }

        const hit = findEncounter(nextPos, nextRoamers);
        if (hit) {
          const group = encounterGroup(hit);
          set({
            playerPos: nextPos,
            roamers: nextRoamers,
            pendingEncounter: true,
            locked: true,
            activeEncounter: { mapId, slots: group.map((r) => r.slot), names: group.map((r) => r.name) },
          });
          return;
        }

        const portal = findPortal(nextPos, map.portals);
        if (portal) {
          const destMap = MAPS[portal.to];
          if (destMap) {
            get().changeMap(portal.to, computeArrivalSpawn(mapId, destMap));
            return;
          }
        }

        set({ playerPos: nextPos, roamers: nextRoamers });
      },

      triggerEncounter: (roamerId) => {
        const { mapId, roamers, locked, pendingEncounter } = get();
        if (locked || pendingEncounter) return;
        const hit = roamers.find((r) => r.id === roamerId);
        if (!hit) return;
        const group = encounterGroup(hit);
        set({ pendingEncounter: true, locked: true, resting: false, activeEncounter: { mapId, slots: group.map((r) => r.slot), names: group.map((r) => r.name) } });
      },

      toggleRest: () => {
        const { locked, pendingEncounter, resting } = get();
        if (locked || pendingEncounter) return;
        if (!resting) lastRestTick = performance.now();
        set({ resting: !resting });
      },

      clearEncounter: () => set({ pendingEncounter: false, locked: false, joyVec: { x: 0, y: 0 } }),

      // Called once, right after returning from an adventure battle. A win
      // starts each defeated roamer's respawn cooldown (or, for a Boss,
      // marks the world-singleton dead) and stays put on the current map. A
      // loss sends the player straight back to Crown Haven City — waking up
      // next to whatever just beat them (often a much higher-level roamer,
      // now that danger scales with distance from the hub) would just be an
      // immediate repeat death, not a real "retry."
      resolveEncounter: (won) => {
        const { activeEncounter, mapId } = get();
        if (activeEncounter && won) {
          activeEncounter.slots.forEach((slot, i) => {
            const name = activeEncounter.names[i];
            const tier = name ? MONSTER_META[name]?.tier : undefined;
            if (tier === 'boss' && name) {
              bossDefeatedAt[name] = Date.now();
            } else if (tier && slot >= 0) {
              respawnAt[slotKey(activeEncounter.mapId, slot)] = Date.now() + RESPAWN_MS[tier];
            }
          });
        }

        if (activeEncounter && !won) {
          get().warpToHub();
          set({ activeEncounter: null, pendingEncounter: false });
          return;
        }

        const map = MAPS[mapId];
        set({
          activeEncounter: null,
          pendingEncounter: false,
          locked: false,
          roamers: map ? resolveRoamers(map, respawnAt, bossDefeatedAt) : [],
          joyVec: { x: 0, y: 0 },
        });
      },

      warpToHub: () => {
        const hub = MAPS[HUB_MAP_ID];
        set({
          locked: false,
          mapId: HUB_MAP_ID,
          playerPos: hub ? { x: hub.w / 2, y: hub.h / 2 } : { x: 750, y: 750 },
          roamers: hub ? resolveRoamers(hub, respawnAt, bossDefeatedAt) : [],
          // Whatever direction was held the instant this fired (e.g.
          // walking into a roamer, or opening the Backpack mid-stride)
          // otherwise sits in the store untouched — tick() just skips
          // consuming it while locked/pendingEncounter, not clears it — so
          // the player would start sliding in that stale direction the
          // moment they arrive, with no input at all.
          joyVec: { x: 0, y: 0 },
        });
      },
    }),
    {
      name: 'two-elements-map-save',
      partialize: (state) => ({ mapId: state.mapId, playerPos: state.playerPos, visitedMaps: state.visitedMaps }),
    },
  ),
);
