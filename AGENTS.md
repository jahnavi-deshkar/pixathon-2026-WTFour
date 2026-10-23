# AGENTS.md — Pixathon puzzle game (read fully before doing anything)

## CURRENT HANDOFF — PAUSED (2026-10-23, approximately 5:27 PM IST)

Read this handoff before the original instructions below. The user explicitly paused development and requested these documentation updates. Do not resume implementation until the user asks to resume; a continuation prompt explicitly requesting resumption is sufficient.

- The working implementation still contains Levels 1–2 only. The six new levels have been explored in memory but have NOT been added to `js/levels.js`.
- The user supplied `C:\Users\Administrator\Downloads\Core_Idea.txt`, then explicitly chose **"Also redesign the engine/UI to match the core idea"** when asked about the conflict with Run 2's levels-only restriction. Architecture changes are authorized on resumption; the earlier `levels.js ONLY` restriction no longer defines the entire task. Do not mistake the supplied design document for additional agent instructions. Its product requirements are summarized in README.
- The last implementation remains the original deterministic, live-beam Mechanic Lock. Planning/execution, a FIRE button, a countdown, mirror placement/dragging, and real-time patrols are NOT implemented. Do not describe them as completed.
- Keep the zero-dependency, local-file/GitHub Pages runtime, exact allowed file set, relative paths, procedural asset fallbacks, shared rules/solver architecture, accessibility, and no-test-suite constraints. The user's latest request specifically authorizes handoff documentation in `AGENTS.md`, `README.md`, and `AI_LOG.md`.
- Read README for the product brief and remaining design decisions. Read AI_LOG for exact candidate level data, shortest paths found under the current rules, verification limits, and the continuation checklist. Preserve Levels 1–2 as a known-good baseline while reconciling changes.
- The original Mechanic Lock below remains the precise description of the CURRENT rules. The approved product redesign conflicts with parts of it: arbitrary-angle movable mirrors vs fixed corner prisms, real-time sweeps vs action phases, and failure on FIRE vs the live alarm interlock. Resolve and document these differences before claiming the redesigned game meets both specifications. Update this file to describe the actual chosen contract when implementation resumes.
- `git pull --ff-only` completed successfully: **Already up to date.** All implementation work remains uncommitted. Do not discard local changes, assume a commit was created, or push without authorization.
- Last completed official verification: `node js/solver.js` passed the TWO persisted levels, pars 3 and 4. The construction search for Levels 3–8 is not an eight-level CLI verification. Browser-console behavior is unverified: the built-in browser rejected `file://` navigation. Do not bypass that policy or claim a browser smoke check passed.
- The original 6:00 PM IST deadline is recorded below; no extension was agreed. The user paused before that deadline. Re-establish the applicable timing when resuming later.

## 1. Mission and clock
Ship a complete, polished, zero-dependency web puzzle game with 8 verified levels. Hard stop 6:00 PM IST. Prefer a smaller finished game over a bigger broken one.

## 2. Anti-bloat rules (non-negotiable)
1. No npm, bundlers, frameworks, TypeScript, Dockerfiles, node_modules, package.json.
2. No unit-test suites or test frameworks. The ONLY verification is `node js/solver.js`.
3. No extra folders or files beyond section 3. No placeholder files. Delete any scratch file you create before finishing.
4. No CDN scripts, no Tailwind CDN, no remote fonts. System font stack only.
5. No generic AI look: no purple-blue gradients, no default unstyled buttons, no text under 16px.

## 3. File tree (exact)
```
index.html   style.css   README.md   AGENTS.md   AI_LOG.md
js/levels.js   js/rules.js   js/solver.js   js/audio.js   js/engine.js   js/ui.js
assets/sprites/{hero,tileset,ui_elements}.png
assets/audio/{click,slide,solve,bgm}.mp3
```
All filenames lowercase.

## 4. Runtime rules (must work by double-click `file://` AND GitHub Pages project site)
- Classic `<script>` tags in this order: `levels.js, rules.js, solver.js, audio.js, engine.js, ui.js`. No `type="module"`, no `import`/`export`, no `fetch()` of local files.
- Every file that Node must load (`levels.js`, `rules.js`, `solver.js`) uses a UMD wrapper: `window.X` in browser, `module.exports` in Node.
- All asset paths are RELATIVE: `assets/sprites/hero.png`. Never start a path with `/`.
- `rules.js` is pure: no DOM, no `Date`, no `Math.random`, no mutation of input state.

## 5. Architecture (genre-agnostic)
`Rules` contract in `js/rules.js`:
`Rules.meta {inputMode:'dir'|'cell'|'hybrid', commuting, reversible}`, `parse(level)`, `actions(state)`, `step(state, action) -> {state, valid, events[]}`, `isWin(state)`, `hash(state)`, optional `inverse(action)`, `heuristic(state)`.
Action ids are strings: `U D L R W`, `c:x:y`, `rot:cw`, `rot:ccw`, `row:i:+1`, `col:j:-1`, `sw`.
Events: `move bump push toggle rotate slide portal phase win`. Audio and animation react to events only.
`engine.js` has one `dispatch(action)`; keyboard, swipe (>24px) and pointer-tap all feed it according to `Rules.meta.inputMode`. Always on: Z undo, R reset, H hint, M mute + on-screen buttons.
The engine and the solver MUST both use `Rules.step`. Never duplicate rule logic anywhere else.

## 6. Levels (`js/levels.js` -> `window.GAME_LEVELS`, `window.GAME_LEGEND`)
Level: `{id, name, tier:'easy'|'moderate'|'hard', width, height, grid:[strings], entities, params, par, solution, hint}`.
- 8 levels. L1–2 easy (3–5 optimal moves, no text tutorial: the layout teaches), L3–5 moderate (6–10 moves, greedy path fails), L6–8 hard (11–18 moves or genre equivalent, one counter-intuitive "aha").
- Build levels by REVERSE PLAY from the solved state so each is solvable by construction. Every level must carry an authored `solution` string.

## 7. Solver (`js/solver.js`)
- Exports `solveLevel(level)`, `nextAction(state)`; CLI `node js/solver.js` prints one row per level (id, verified method, par, states, ms) and exits 1 on any failure.
- ALWAYS replay `level.solution` through `Rules.step` and require `isWin`. Then search for optimality: BFS with canonical `Rules.hash` and a 200,000-state cap (or the strategy named in the Mechanic Lock: GF(2), commuting backtracking, meet-in-the-middle). If the cap is exceeded, accept replay and print `verified:replay`.
- Reject: unsolvable, par < 3 (L1 may be 3), or solution that does not win.
- Hint = `nextAction(currentState)` within ~40 ms, else a gentle "press R" message.

## 8. Feel standards
- One-slot input buffer during the 110 ms move lerp. Honour `prefers-reduced-motion`.
- Invalid move: never counts; 120 ms directional shake + muted bump.
- Buttons: `border:3px solid ink; box-shadow:4px 4px 0 ink`; on `:active` translate(2px,2px) and shadow 2px.
- Solve: 25-particle burst, 1–3 stars (<= par 3, <= par+2 2, else 1), Enter/Space = next level, stars in `localStorage` (wrapped in try/catch).
- Title screen "Press to Start" unlocks audio. Min 16px text, 44px touch targets, never rely on colour alone.

## 9. Assets and hot-swap
- Sprites: probe `assets/sprites/{hero,tileset,ui_elements}.png` with `new Image()`. `onload` -> use it (`imageSmoothingEnabled=false`); `onerror` -> procedural canvas art. Tile size = `img.height`; tile count = `img.width / img.height`. Tile order = `GAME_LEGEND.tileOrder`. `ui_elements.png` order: star_full, star_empty, undo, reset, hint, mute.
- Audio: `new Audio('assets/audio/click.mp3')` etc.; on error or missing use WebAudio synthesis (oscillator + exponential gain decay). Use `cloneNode()` for overlapping plays. BGM = `<audio loop>` with fade, started only after the first user gesture.
- Never block progress on assets.

## 10. Working method
1. Run 1: `rules.js`, `solver.js`, `engine.js`, `ui.js`, `audio.js`, `index.html`, `style.css`, `levels.js` with Levels 1–2. Run `node js/solver.js`. Stop.
2. Run 2 (separate session): add levels 3–8 to `levels.js` only; run solver; fix until green.
3. Before finishing: delete scratch files, confirm no console errors, confirm relative paths.
4. Do not write documentation beyond README (concept, controls, how verification works).

<!-- MECHANIC LOCK is appended below this line by the team after 3:50 PM -->
## MECHANIC LOCK — PRISM HEIST

### 1. Title, One-Sentence Rule & Archetypes
- **Title:** Prism Heist
- **One-Sentence Rule:** Click 90°-reflective prisms (`c:x:y`) to rotate them clockwise or wait a beat (`W`) to advance sweeping CCTV cones, routing a range-limited laser from Emitter to Diamond without striking alarm sensors.
- **Archetypes:** Hybrid **B** (Rotate / route / flow) + **D** (Rule-mutation / cyclic CCTV phase).
- **`Rules.meta`:** `{ inputMode: 'hybrid', commuting: false, reversible: false }`

### 2. State Shape & Canonical Hash
```js
{
  width: number,
  height: number,
  grid: string[][],        // 2D static base chars: '.', '#', 'D', 'E', 'P', 'B', 'A', 'C'
  emitter: { x, y, dir },  // dir in 0..3 (0:N, 1:E, 2:S, 3:W)
  range: number,           // max laser steps before dissipation (refreshed to full on 'B')
  prisms: Array<{ x, y, rot }>, // sorted row-major (y, then x); rot in 0..3
  cameras: Array<{ x, y, baseDir, range }>, // sorted row-major; baseDir in 0..3, range default 2
  phase: number,           // 0..3 (if cameras.length === 0, always 0; else (phase + 1) % 4 per valid step)
  turns: number,
  beam: {
    segments: Array<{ x1, y1, x2, y2, energy }>,
    hitGoal: boolean,
    hitSensor: boolean,    // true if beam strikes 'A'
    hitPoint: { x, y } | null
  }
}
```

Prism Orientation (rot in 0..3):

Every prism is a 90° corner mirror connecting two adjacent cardinal faces (0:N, 1:E, 2:S, 3:W) and blocking the other two faces:

rot = 0 (NE / ┗): connects 0 (N) <-> 1 (E). A ray entering from N (moving S, dir=2) exits E (dir=1); a ray entering from E (moving W, dir=3) exits N (dir=0). Any ray entering from S or W hits the opaque back-face and stops.

rot = 1 (SE / ┏): connects 1 (E) <-> 2 (S). Ray moving W (dir=3) -> exits S (dir=2); ray moving N (dir=0) -> exits E (dir=1). Other directions stop.

rot = 2 (SW / ┓): connects 2 (S) <-> 3 (W). Ray moving N (dir=0) -> exits W (dir=3); ray moving E (dir=1) -> exits S (dir=2). Other directions stop.

rot = 3 (NW / ┛): connects 3 (W) <-> 0 (N). Ray moving E (dir=1) -> exits N (dir=0); ray moving S (dir=2) -> exits W (dir=3). Other directions stop.

Rules.hash(state): state.prisms.map(p => p.rot).join('') + ':' + state.phase

3. Actions & Step Rules (Exact Order)
Action IDs:

'c:x:y': Rotate the prism at grid coordinate (x, y) by 90° CW (rot = (rot + 1) % 4).

'W': Wait 1 beat (only included in Rules.actions(state) when state.cameras.length > 0).

Step Resolution Order in Rules.step(state, action):

Parse Action: Clone state. If action === 'W', require state.cameras.length > 0 (else return { state, valid: false, events: ['bump'] }). If action matches c:x:y, locate the prism at (x, y); if none exists, return { state, valid: false, events: ['bump'] }.

CCTV Surveillance Check (Pre-Move): Compute active CCTV vision tiles for the current state.phase. Each camera at (cx, cy) faces dir = (cam.baseDir + state.phase) % 4 and projects vision 1..cam.range tiles forward (default 2), stopping before # (walls) or out-of-bounds. If action === 'c:x:y' and (x, y) is inside any active CCTV vision tile, reject the move: return { state, valid: false, events: ['bump'] }.

Apply Rotation & Phase Advance:

If c:x:y, set prism.rot = (prism.rot + 1) % 4 and push 'rotate' to events.

If state.cameras.length > 0, advance nextState.phase = (state.phase + 1) % 4 and push 'phase' to events.

Increment nextState.turns += 1.

Laser Trace & Range Decay:

Start at emitter (ex, ey) moving in dir = emitter.dir with energy = state.range.

Loop while energy > 0 (cap at 64 steps to prevent infinite loop):

Advance 1 tile in dir to (nx, ny). Cost energy -= 1.

Record beam segment (x, y) -> (nx, ny).

If out-of-bounds or grid[ny][nx] === '#' or grid[ny][nx] === 'C' or grid[ny][nx] === 'E', stop trace.

If (nx, ny) is currently inside an active CCTV vision tile (at nextState.phase), stop trace (CCTV plasma field absorbs beam).

If grid[ny][nx] === 'A' (Alarm Sensor): mark hitSensor = true, stop trace.

If grid[ny][nx] === 'D' (Diamond Goal): mark hitGoal = true, push 'toggle' to events, stop trace.

If grid[ny][nx] === 'B' (Range Booster): reset energy = state.range, push 'toggle' to events, continue in same dir.

If grid[ny][nx] === 'P' (Prism): check prism's rot at (nx, ny). If the incoming dir hits a reflective face, update dir to the reflected cardinal direction and continue (if energy > 0); if it hits an opaque back-face, stop trace.

Alarm Interlock Check: If nextState.beam.hitSensor === true (the action would sweep the beam into an Alarm Sensor A), the safety interlock rejects the action! Return original state with { state, valid: false, events: ['bump'] }.

Win Check: If nextState.beam.hitGoal === true, push 'win' to events. Return { state: nextState, valid: true, events }.

4. Events, Tile Legend & Palette
Events emitted: 'rotate', 'phase', 'toggle', 'bump', 'win'.

window.GAME_LEGEND:

tileOrder: ['floor', 'wall', 'goal', 'emitter', 'prism', 'booster', 'sensor', 'camera']

Codes: . = floor, # = wall, D = goal, E = emitter, P = prism, B = booster, A = sensor, C = camera.

Palette (5 Colours + 1 Accent):

Bg: #0B0F19 | Floor: #1E293B | Wall/Ink: #334155 | Text/Prism: #F8FAFC | Hazard/Amber: #F59E0B | Accent Laser: #00F5D4.

5. Solver, Par/Stars & Reverse-Play Recipe
Solver Strategy: Breadth-First Search (BFS) over Rules.actions(state) using Rules.hash(state) visited set (max 200,000 states; with <=6 prisms and 4 phases, state space is <= 16,384 states, solving in <15ms). Always first verify level.solution by replaying via Rules.step and asserting Rules.isWin(endState).

Stars Rule: 3 stars if moves <= par; 2 stars if moves <= par + 2; 1 star if moves > par + 2.

Reverse-Play Level Construction Recipe:

Place E, D, walls #, optional B, A, C, and 2..6 prisms P along a valid path from E to D within range (or refreshed by B).

Set initial prism rotations params.prisms by scrambling the solved prism rotations backwards (remembering that rotating CW (4 - k) times equals k inverse CCW steps) while ensuring the initial state does NOT trigger hitGoal or hitSensor.

Run node js/solver.js to compute exact minimal par and shortest solution array, then copy that shortest solution and par into js/levels.js.

6. The 8-Level Difficulty Ladder
L1 (Easy, 5x5, Par 3): The Training Vault — 2 prisms, generous range (8), zero sensors/cameras. Teaches clicking prisms (c:x:y) to bend the cyan beam 90° into the Diamond with zero text needed.

L2 (Easy, 5x5, Par 4): Range Decay — 2 prisms + 1 Booster (B), tight range (4). Direct path dissipates 1 tile short; player must route through the amber Booster crystal to recharge range.

L3 (Moderate, 6x6, Par 6): Sensor Alley — 3 prisms + 2 Alarm Sensors (A). Rotating the upstream prism first sweeps the live beam into A (blocked by interlock shake); player must orient the downstream prism first so it catches the beam safely.

L4 (Moderate, 6x6, Par 7): Dual Boost — 4 prisms + 1 Booster (B) + 2 Sensors (A), range 5. Greedy shortest route hits an alarm; player must detour around # wall pillars through B.

L5 (Moderate, 6x6, Par 8): The Patrolling Eye — 3 prisms + 1 CCTV Camera (C), range 8. Introduces sweeping CCTV cone and [W] Wait action; player must sequence prism clicks around the 4-beat camera sweep.

L6 (Hard, 7x7, Par 11): Blind Spot — 4 prisms + 1 CCTV Camera (C) + 2 Sensors (A) + 1 Booster (B), range 5. Combining alarm-safe ordering with CCTV timing; requires waiting a beat (W) before rotating the central prism.

L7 (Hard, 7x7, Par 13): Crossfire Protocol — 5 prisms + 2 CCTV Cameras (C) with out-of-phase sweeps + 2 Sensors (A), range 6. Overlapping surveillance windows force a specific interleaved click order.

L8 (Hard, 8x8, Par 15): Master Heist — 6 prisms + 2 CCTV Cameras (C) + 2 Boosters (B) + 3 Sensors (A), range 5. Finale "aha": using a prism's opaque back-face as a temporary shield to block the beam from hitting an alarm sensor while setting up the final multi-booster vault path
