# Two Elements — Architecture

This document describes the React/Vite/TypeScript rewrite in `app/`, why it's
structured the way it is, and how it's meant to grow. It reflects what's
**actually built** today, not an aspirational end-state — every claim below
is backed by a real file in this tree.

The original game (`../index.html`, `../styles.css`, `../script.js`) is
untouched and still playable. The full player loop — register/login → pick
& place 3 mages → hub → manage party (stats/skills/formation) → explore a
map → battle (adventure or PVP) → back to hub — is migrated and wired end to
end. Battle was built first and established the pattern (feature module +
systems engine + Zustand store) that auth/hub/roster/party/map all follow;
§11 lists what's still intentionally scoped down or not started.

---

## 1. Tech stack

React 19 · Vite 8 · TypeScript (strict) · Zustand · Framer Motion ·
Tailwind CSS v4 · React Router · React Three Fiber + Drei (installed,
lazy-loaded, not yet the active renderer — see §6).

## 2. Folder structure

```
app/
  src/
    assets/                 # static art/audio (empty — game is emoji/CSS today)
    components/
      ui/                    HealthBar.tsx, ConfirmModal.tsx — generic, reusable, no game-domain knowledge
      shared/                 (placeholder — cross-feature, non-generic UI lands here)
    features/
      auth/                  register/login — components/AuthPage.tsx
      roster/                one-time creation flow — pick 3 mages, place formation
      hub/                   main menu — party strip, Party/Adventure/PVP options
      party/                 stats/skills/equipment/formation management (post-creation)
      map/                   adventure exploration — joystick movement, encounters, portals
      battle/                turn-based combat — the pattern the others above followed
        components/          all battle-specific React components
        hooks/                useFloatingEvents, useHeroFx — event-stream → local UI state
        index.ts              feature's public export surface
      cards/ characters/ inventory/ skills/ quests/ effects/
                              placeholders — land here as equipment/quests/etc. get built
    hooks/                    (placeholder — cross-feature hooks, e.g. useMediaQuery)
    services/                 (placeholder — network/persistence adapters, e.g. save API)
    systems/
      battle/                 the battle ENGINE — pure TS, zero React/DOM — see §3
      party/                  progression, stat/skill draft-confirm staging, placement swap logic
      map/                    movement/camera/encounter/portal math — pure TS
      rendering/               the render-layer swap point — see §6
    stores/
      battleStore.ts          battle session state
      gameStore.ts            accounts, logged-in user, the persisted Party
      rosterStore.ts          transient creation-flow-only state (picks/placements/formation)
      mapStore.ts             current map, player/roamer positions, joystick vector
    types/                    shared TS types (element, hero, skill, battle, party, game, map)
    constants/                game data & tuning knobs (elements, skills, rules, status, formations, maps)
    layouts/
      ResponsiveShell.tsx      phone-card on mobile/tablet, adaptive wide layout on desktop — see §6
    pages/
      BattlePage.tsx           route-level composition: store + layout + feature
    App.tsx                    route table — every screen is a sibling route with auth/party guards
    main.tsx                   React root
```

Folders that exist but are still empty (`features/inventory`, `features/quests`,
`hooks/`, `services/`, …) are placeholders, not decoration — they encode
*where the next feature goes* so that decision doesn't have to be
re-litigated later. §10 covers how each one gets filled in.

## 3. Feature-based architecture, concretely

The spec asked for UI / rendering / gameplay logic / state / networking to be
separable. Battle demonstrates the actual seam:

- **`systems/battle/*`** — the engine. Pure functions and one async
  generator (`resolve.ts`). Takes/mutates a `BattleState` object, returns
  `BattleEvent`s. **Imports nothing from React, Zustand, or the DOM.** You
  could run `resolveRound()` in a Node test or a server authoritative-sim
  with zero changes — that portability is the whole point of keeping it
  separate from `stores/`.
- **`stores/battleStore.ts`** — the only thing that touches both the engine
  and React. Owns the mutable `BattleState` draft, calls into
  `systems/battle` functions, and republishes a new top-level object
  reference after each change so Zustand subscribers re-render (see §5 for
  why this is a top-level clone, not a deep one).
- **`features/battle/components/*`** — presentation only. Every component
  reads from the store via `useBattleStore` and renders; none of them
  contain game rules (no damage math, no turn-order logic — that's all in
  `systems/battle`).
- **`features/battle/hooks/*`** — the animation-event bridge (§7).

This is the template: a new feature (say, `inventory`) gets
`systems/inventory` (rules), `stores/inventoryStore.ts` (the one stateful
adapter), `features/inventory/components` (presentation). No feature reaches
into another feature's internals — they can only share `types/`,
`constants/`, and `components/ui`.

## 4. Data flow

```
User input (click)
   │
   ▼
features/battle/components/*  ──calls──▶  stores/battleStore.ts action
                                                │
                                                │ mutates a BattleState draft
                                                ▼
                                    systems/battle/* (pure engine functions)
                                                │
                                                │ resolveRound is async and
                                                │ yields BattleEvent per beat
                                                ▼
                                    battleStore republishes { ...battle }
                                    + appends event to events[]
                                                │
                    ┌───────────────────────────┼───────────────────────────┐
                    ▼                                                       ▼
      React re-renders from `battle`                     features/battle/hooks/* scan
      (HP bars, hand, CTA state, …)                       events[] for their heroId and
                                                            drive local Framer Motion state
                                                            (damage numbers, hit flash, banners)
```

Two consumers read the **same** event stream for two different jobs:
`battle` (the snapshot) drives *what the UI shows right now*; `events`
(the append-only log) drives *what just happened, once, animated*. Splitting
these was the fix for the classic "how do I animate a value change without
re-triggering the animation on every unrelated re-render" problem — a damage
number is a one-shot event, not a derived value.

## 5. State management strategy

One Zustand store per bounded domain — `battleStore` today, `partyStore`,
`inventoryStore`, `mapStore`, `settingsStore`, `audioStore`, `uiStore`,
`saveStore` following the same pattern as each feature migrates (the spec's
list of "separate stores for Player/Battle/Cards/…" is achieved by *one
store per feature*, not by carving up a single monolith).

**Mutation model:** `systems/battle` functions mutate a `BattleState` object
in place (the same in-place-draft style the original vanilla engine used for
its global `state`), and `battleStore` re-publishes a shallow top-level clone
(`{ ...battle }`) after each change. This is a deliberate, documented
trade-off: it's simpler than wiring Immer through every engine function, and
it's correct as long as components subscribe to the *whole* `battle` slice
(`useBattleStore(s => s.battle)`) rather than deep sub-paths — which is what
every component here does. If profiling ever shows this causing
over-rendering at scale, the fix is adding Immer's `produce` inside the
store's `publish()` helper — a one-function change, not a rewrite, because
nothing outside `battleStore.ts` knows or cares how the clone happens.

**No prop drilling:** components call `useBattleStore(selector)` directly;
nothing is passed down more than one level for store data. Page → Feature →
Component only passes UI-local props (e.g. `onTapHero`).

## 6. Rendering pipeline — 2D today, R3F-ready seam

The current game is emoji sprites over CSS, not 3D — building a real
Three.js character pipeline (skeletal animation, blending, particles) against
assets that don't exist would be building on sand. Instead, the render layer
is isolated behind one contract so it can be swapped later without touching
gameplay code:

- **`systems/rendering/types.ts`** — `BattlefieldRendererProps` (the props
  every battlefield renderer must accept: `battle`, `events`, `onTapHero`,
  `onUndo`) and `BattlefieldRenderer` (`ComponentType<BattlefieldRendererProps>`).
- **`features/battle/components/DomBattlefieldRenderer.tsx`** — the active
  implementation. CSS/Framer Motion, matches the original 2D art exactly.
- **`features/battle/components/R3FBattlefieldRenderer.tsx`** — a working
  but explicitly-labeled placeholder. It mounts a real `@react-three/fiber`
  `<Canvas>`, satisfies the exact same props contract, and proves the seam
  compiles and renders — but stands each hero up as a colored box, not a
  rigged character, because no GLTF models or animation clips exist yet.
  Swapping in real 3D later means writing `<ElementCharacterModel hero={h}/>`
  inside *this one file* — `BattleScreen`, the store, and the engine don't
  change.
- **`systems/rendering/index.ts`** — `RENDER_MODE` + `RENDERER_REGISTRY`,
  the single switch. Flip `RENDER_MODE` to `'r3f'` when real assets land.

**This seam also pays for itself immediately, not just later:** the `'r3f'`
registry entry is `React.lazy`-loaded (`BattleScreen` wraps it in
`<Suspense>`). Measured effect — confirmed via a real production build, not
estimated:

| | main bundle | r3f chunk |
|---|---|---|
| Before lazy-loading | 1.30 MB (368 KB gzip) | — (bundled in) |
| After lazy-loading | 402 KB (128 KB gzip) | 897 KB (239 KB gzip), loaded only if `RENDER_MODE` is ever `'r3f'` |

Every player on `'dom'` mode (the default, and the only mode with real
content today) never downloads three.js/fiber/drei at all.

When real 3D lands, the target pipeline (not yet built, but what the seam is
sized for): GLTF characters via `useGLTF` (Drei), animation clips driven by
`useAnimations` with a small state-machine mapping battle events → clip name
(`idle`/`walk`/`attack`/`skill`/`hurt`/`death`) and cross-fade blending,
`<Environment>` + a couple of directional lights for the lighting, `drei`'s
`<Instances>` for any particle-heavy VFX, and `shadows` only on hero meshes
(not the battlefield plane) to keep shadow-map cost bounded on mobile GPUs.

## 7. UI animation architecture

Framer Motion end to end, three layers:

1. **Continuous/derived state → `animate` prop.** `HealthBar` doesn't run its
   own timers; it computes a percentage from props and lets
   `animate={{ width: pct }}` interpolate. No component owns animation
   *state*, only animation *targets*.
2. **One-shot events → local component state via a hook.**
   `useFloatingEvents(events, heroId)` and `useHeroFx(events, heroId)` each
   watch the shared `events` stream, filter to their own hero, and turn a
   matching event into a short-lived local `useState` entry that
   self-removes via `setTimeout`. `HeroCard` renders those through
   `AnimatePresence` for enter/exit. This is why floating damage numbers
   don't need any DOM measurement (`getBoundingClientRect`, layers,
   z-index stacking) the way the original vanilla engine's `spawnDamageNumber`
   did — each number is scoped to, and positioned relative to, its own
   hero's own box.
3. **Global one-shot moments → a single owner.** `ActionBanner` is the one
   component allowed to show "Combo!"/"Defeated!"/a buff's name+desc — it
   also just watches `events`, but only one banner exists at a time,
   matching the original's single `#actionBanner` div.

Press feedback (`whileTap`), card entry/exit (`initial`/`animate`/`exit` +
`AnimatePresence`), and phase transitions (end-overlay fade-in) all follow
the same "declare the target state, let Framer interpolate" rule — no
component hand-rolls a CSS keyframe or a raw `setInterval` tween.

## 8. Performance strategy

Applied, not aspirational:

- **Code-splitting**: `R3FBattlefieldRenderer` is `React.lazy`-loaded (§6) —
  confirmed by build output, not assumed.
- **Strict TS + `noUncheckedIndexedAccess`**: catches a whole class of
  "assumed array/record access is defined" bugs at compile time rather than
  paying for runtime guards everywhere.
- **Event-stream architecture avoids re-render storms**: because one-shot
  FX are local `useState` in the hero that owns them (§7 point 2), a damage
  number on Ember doesn't re-render Tidewen, Boulder, or the hand — only
  `BattleScreen`'s single `battle` subscription re-renders on state changes,
  and Framer Motion's `animate` diffing is cheap.
- **Not yet done, and explicitly flagged rather than silently skipped**:
  object pooling for `BattleEvent`s (events array is capped at
  `MAX_BUFFERED_EVENTS = 40` and sliced, not pooled — fine at this scale,
  worth revisiting if event volume grows with AoE-heavy content),
  virtualization for the hand (irrelevant until hand sizes exceed a screen
  width, which the current `DECK_CONFIG.handSize = 4` never does), and
  texture/asset preloading (no textures exist yet — this is a §6 concern
  once real art lands, via Drei's `useGLTF.preload`).

## 9. Library choices

| Library | Why this one, specifically for this project |
|---|---|
| **Zustand** | The original engine's whole design is one mutable `state` object read/written imperatively. Zustand's `get()/set()` model is the closest React-idiomatic match — porting the engine's logic didn't require inventing a reducer/action-type vocabulary Redux would have demanded. |
| **Framer Motion** | Declarative `animate` targets map directly onto the original's CSS-transition-driven UI (health bars, card selection, banners) without hand-rolling keyframes, and `AnimatePresence` solves enter/exit for cards/badges that the original solved with manual `classList` timing (`setTimeout(() => el.remove(), 900)`). |
| **React Three Fiber + Drei** | Installed and seam-wired now (§6) specifically so the *architecture* doesn't need revisiting when 3D assets arrive — only isolated to a lazy chunk so it costs nothing today. |
| **Tailwind v4** | Utility classes kept component styling co-located and diffable against the original's inline `<style>` block, and the new `@tailwindcss/vite` plugin means zero PostCSS config. |
| **React Router** | Only `/battle` exists today, but every other screen (hub, roster, map, party) is a sibling route by construction — adding them is additive, not a routing rewrite. |
| **TypeScript strict mode** | The original engine's biggest latent-bug risk was implicit shape assumptions (`hero.dodge` sometimes present, sometimes not). Strict mode + `noUncheckedIndexedAccess` forced every one of those into an explicit `?? default` at the exact call site during porting — several were caught this way before ever running the app. |

GSAP was installed per the requested stack but isn't used anywhere yet —
nothing in the current battle slice needs an animation Framer Motion can't
express declaratively. It's available for the day something genuinely does
(e.g. a scripted cutscene timeline), rather than reached for by default.

## 10. Extension points

- **New feature = new vertical slice, same shape.** Roster/hub/map/quests
  each get `systems/<feature>` (rules) + `stores/<feature>Store.ts` (the
  React bridge) + `features/<feature>/components` (presentation) +
  `pages/<Feature>Page.tsx` (route). The placeholder folders in §2 are
  exactly these slots, empty until claimed.
- **Multiplayer**: because `systems/battle` never imports React/Zustand/DOM,
  `resolveRound` is already shaped to run **server-side** unmodified — a
  Node process could import the same module, run the same turn resolution
  against two connected clients' submitted plans, and emit the same
  `BattleEvent` stream over a WebSocket. The client-side change would be
  swapping `battleStore.attack()` from "call `resolveRound` locally" to
  "send plans to server, consume the server's event stream" — the engine
  contract doesn't change, only who calls it.
- **Live events / seasonal content**: `constants/skills.ts` and
  `constants/rules.ts` are the entire tunable surface for balance
  (`SKILL_TREES`, `DECK_CONFIG`, `ENERGY_PER_ROUND`, …). A live-ops config
  fetch that overrides specific constants at boot is additive — nothing in
  `systems/battle` hardcodes values inline, they're all imported from here.
- **Content updates (new elements/cards/skills)**: `Element` is currently a
  4-value union (`types/element.ts`) — adding a 5th element touches that
  union, one new `ELEMENT_META` entry, one new `SKILL_TREES` entry, and one
  new hex value in `HERO_HP`/`SPEED`/etc. TypeScript's exhaustiveness
  checking on `Record<Element, T>` means the compiler lists every file that
  needs the new entry — there's no way to add an element and silently miss
  a spot.
- **Save/load**: `services/` is reserved for exactly this — a
  `services/saveService.ts` that (de)serializes `Party`/`BattleState`-shaped
  data is a natural fit once persistence is needed; nothing currently
  couples game state to `localStorage` or a backend, so this is a pure
  addition, not a refactor.

## 11. What's explicitly NOT done in this pass

Scoped out by design, not by oversight — flagging so it isn't mistaken for
architecture debt:

- **Auth, hub, roster, party, and a single-region adventure map are now
  migrated** (`features/auth`, `features/hub`, `features/roster`,
  `features/party`, `features/map`, backed by `gameStore`/`rosterStore`/
  `mapStore`). `BattlePage` no longer only runs the fixed demo party — it
  reads `gameStore`'s real party + `battleContext` (`pvp` | `adventure`) and
  builds the actual team via `buildPlayerTeamFromParty`, only falling back
  to the level-1 demo party when there's no logged-in account (e.g. hitting
  `/battle` directly). The demo path itself (`systems/battle/demo.ts`)
  stays, both as a standalone smoke-test entry point and as the fallback.
- **World map is intentionally scoped down, not fully ported.** The
  original has 15+ branching per-element regions, MVP monsters with respawn
  timers, a minimap, and a world-map modal for fast travel. This ships the
  core exploration *engine* — joystick movement, camera following, wandering
  monster encounters, portal transitions between zones (`systems/map`,
  `stores/mapStore.ts`) — proven out on two connected zones
  (`constants/maps.ts`: Veyhollow ↔ Emberwild). Adding the rest of the world
  is a data change (more `MapDef` entries + portal pairs), not new engineering
  — the minimap and world-map-modal fast-travel UI are the only genuinely
  unbuilt pieces.
- **Equipment, quests, inventory** — `EquipmentTab.tsx` ports the original's
  honest "designed but not wired in" stub; no loot/crafting system exists on
  either side of the codebase yet.
- **Real 3D assets** — the R3F renderer is a proven seam, not production art
  (§6).
- **Multiplayer** — the engine is *shaped* for it (§10) but no networking
  code exists.
- **Save/load, achievements, daily rewards, AFK progression** — no
  persistence layer exists yet; these all depend on `services/` and a
  `saveStore` that aren't built. Accounts/party are in-memory only (same as
  the original) and reset on refresh.
