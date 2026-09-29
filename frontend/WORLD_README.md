# JeevanMitra — 3D Voxel Village (World Frontend)

A playable, Minecraft-style voxel village you walk through, replacing the old
sidebar-and-cards dashboard. Features live *in the world* as places, people and
objects. The only 2D chrome is a small game HUD and in-world panels.

English is the default language; Hindi is one tap away.

---

## Run it

```bash
cd frontend
npm install
npm run dev          # http://localhost:3000
```

Runs standalone with `mockData.ts` (no backend needed). To use the real backend:

```bash
cd ../backend
# set OFFICER_API_KEY / WORKER_API_KEY in .env, then:
uvicorn app.main:app --port 4000
```

The frontend proxies `/api/*` to `127.0.0.1:4000` (see `next.config.mjs`).

### QA helpers (browser console)

```js
__jm.teleport(25, 6, 2)      // jump anywhere
__jm.look(yaw, pitch, dist)  // aim the camera
__jm.store.getState()        // inspect world state
```

---

## Controls

| | Desktop | Mobile |
|---|---|---|
| Move | `WASD` / arrows | left virtual joystick |
| Look | mouse (click to lock) | drag anywhere |
| Sprint | `Shift` | – |
| Jump | `Space` | – |
| Interact | `E` or `Enter` | big round **Interact** button |
| Go to a place | hotbar / map (auto-walk) | tap hotbar / map |
| Settings | `⚙` top-left | `⚙` top-left |

Reduced motion turns auto-walk into an instant teleport, disables camera bob and
rain, and skips the guided intro.

---

## Architecture

```
src/
  app/page.tsx              client-only entry, deep-link ?place=<id>
  world/
    engine/
      noise.ts              seeded simplex (fixed seed => same village for all)
      blocks.ts             block registry -> atlas tiles
      atlas.ts              procedural 16x16 texture atlas on a canvas
      chunks.ts             16x16x64 chunks, face culling + per-vertex AO
      terrain.ts            world generation + hand-authored village
      world.ts              flat Uint8Array, O(1) block access (singleton)
      lighting.ts           day/night (8 min cycle, golden morning start)
      quality.ts            low / medium / high tiers + GPU auto-detect
      worldClock.ts         per-frame clock that does NOT re-render React
    scene/                  Terrain, Sky, Water, WorldScene
    places/                 Places, SkillCentres (ghost vs built), DistrictTower
    npc/                    Npcs (villagers/animals), Mitra (companion)
    controls/               PlayerController, CameraRig
    adapters/               API/mock shapes -> world entities
    state/useWorldStore.ts  zustand
  ui/                       Hud, Hotbar, Compass, Subtitles, JourneyBar,
                            PlacePanel, MatchCard, SettingsSheet,
                            TouchControls, SimpleMode (2D fallback)
  i18n/                     en.json, hi.json, ta.json, bn.json, te.json
```

### Performance notes

- **One mesh per chunk**, not per block. Greedy face culling + per-vertex AO.
- **Flat `Uint8Array` world** for O(1) block reads. (Do *not* use `x % 16` for
  chunk-local coordinates on a negative-coordinate world — JS `%` keeps the
  sign and silently drops blocks. Use `x - chunkX * 16`.)
- **`worldClock.ts`** keeps the day/night clock out of React state, so the
  scene does not re-render 60x/second.
- **Stable `gl` / `dpr` / `camera` props** on `<Canvas>` — new object literals
  each render make R3F rebuild its reconciler root.
- `reactStrictMode: false` (see `next.config.mjs`): StrictMode's double-mount
  makes R3F v9 synchronously unmount its root mid-render.
- Quality tiers: Low (no shadows/post, 4 chunks), Medium (1 shadow cascade,
  bloom, 6), High (SSAO, 9). Auto-detected, user-overridable in Settings.

Measured headless (Chrome, 1280x800): **canvas interactive ~1.5-2 s, ~48 FPS**.

---

## Adding a building / blueprint

Buildings are functions in `world/engine/terrain.ts` that write blocks through
`fillBox` / `hollowBox`:

```ts
function buildHouse(chunks, x0, z0, groundY, w, d, opts) {
  hollowBox(chunks, x0, groundY, z0, x0 + w, groundY + 4, z0 + d,
            opts.plaster ? B.PLASTER : B.MUD, B.TERRACOTTA);
  fillBox(chunks, x0 + 2, groundY, z0, x0 + 2, groundY + 2, z0, 0); // door
}
```

Then call it from `generateWorld()`, ideally after `flattenArea(...)` so the
ground is level. Block ids live in the `B` map; textures in `atlas.ts`.

---

## The Verified Match Protocol (non-negotiable)

| State | In the world | In the panel |
|---|---|---|
| **Interest Match** | translucent blue "blueprint" ghost, wireframe edges, scaffolding poles, flat plan on the ground | dashed blue border + 📐 + "योग्यता मेल — स्थानीय बैच की पुष्टि नहीं", **no Apply button** |
| **Verified Match** | solid lit building, golden beacon beam, open door, lit windows | solid gold border + 🏠 + "सत्यापित", **Apply enabled** |

Status is never colour-only: every centre carries an icon **and** text.

Only a field worker can flip the state, via
`POST /worker/opportunities/{id}/verify` (`api.verifyOpportunity`). The panel
shows an "under construction" animation, and the card only becomes Verified
**after the API returns success**. On failure the building stays a ghost and
Mitra says so. The frontend never upgrades state on its own.

Switch the role with the top-left dropdown to try it (Field Worker unlocks the
Verify button; Beneficiary sees locked places).

---

## Accessibility

- **2D fallback ("Simple view")** — Settings → Simple view, or any WebGL
  failure. Same 10 places, same panels, same features. The world is an
  enhancement, never a gate.
- Text size S/M/L/XL, high contrast, captions on/off, reduce motion.
- Panels are keyboard reachable; Mitra's captions use `aria-live="polite"`.
- Hotbar/map targets are ≥ 56 px on touch.
- Status is icon + text + pattern, never colour alone.
- No personal data in the scene, URLs or logs.

---

## Built vs roadmap

Honest status. "Built" means it works in the code today.

| Feature | Status |
|---|---|
| Voxel terrain, chunks, AO, texture atlas | **Built** |
| Day/night cycle, sun/moon, clouds, stars | **Built** |
| Third-person movement, collision, step-up, respawn | **Built** |
| Touch joystick + Interact + Mic buttons | **Built** |
| Auto-walk fast travel, proximity prompt | **Built** |
| HUD: hotbar, compass/map, journey bar, subtitles | **Built** |
| 10 places with panels, role gating | **Built** |
| Verified vs Interest cards + worker verify flow | **Built** |
| Ghost vs built 3D centres, beacon, build animation | **Built** |
| District tower bars with a red real gap | **Built** |
| Quality tiers, 2D fallback, i18n en/hi (+ta/bn/te HUD) | **Built** |
| Greedy meshing on a Web Worker | **Partial** — face-culled mesher runs on the main thread; the worker port is not wired |
| SSAO / bloom post-processing | **Partial** — `@react-three/postprocessing` is installed and tiers are defined, but the effect stack is not mounted |
| Wind-animated crops/leaves, monsoon rain, birds/fireflies | **Roadmap** — scenery is static |
| Voice interview (consent → questions → confirm) in-world | **Roadmap** — the Mitra mic button captures speech and captions it, but the full consent + question flow is not built |
| Avatar picker | **Roadmap** |
| Ambient audio (wind/birds/crickets/footsteps) | **Roadmap** — sound toggle is present, no audio assets |
| Real API wiring for panels (jobs/aid/careers/mentors/district) | **Roadmap** — panels read `mockData.ts`; only the worker verify call hits the API |
| IVR / WhatsApp channels | **Roadmap** |
| District brief lectern with traceable numbers | **Partial** — the lectern renders; the Layer-5 brief fetch is not wired |

All names, numbers and schemes are illustrative sample data and are marked as
such. Nothing here claims official PM-AJAY integration, guaranteed admission or
employment.
