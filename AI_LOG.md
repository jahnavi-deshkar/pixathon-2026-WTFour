# Prism Heist — paused development handoff

Paused at the user's request on 2026-10-23, approximately 5:27 PM IST. No gameplay implementation was changed during this handoff. No commit or push was made.

## Persisted implementation

Run 1 created the vanilla HTML/CSS/JS engine, title/vault/victory screens, geometric canvas rendering, optional sprite/audio loading, synthesized audio, undo/reset/hints/mute, saved stars, buffered rotation animation, and Levels 1–2. Empty starter placeholder files were removed; finished sprites/audio are still absent and use fallbacks.

The last official `node js/solver.js` run exited 0:

| id | name | method | par | states | ms | status |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | The Training Vault | replay + BFS | 3 | 9 | 2.9 | PASS |
| 2 | Range Decay | replay + BFS | 4 | 12 | 0.5 | PASS |

Times are from that run, not performance guarantees. Both authored solutions remain strings in the unchanged level definitions.

The built-in browser rejected `file://` navigation under its URL policy. Browser-console behavior and visual interaction have not been verified. Do not bypass this restriction or report a successful browser check.

## User-approved scope change

The user supplied `C:\Users\Administrator\Downloads\Core_Idea.txt` and asked to correct the game toward that concept, followed by the Run 2 level-authoring request. After the conflict was explained, the user explicitly answered: **"Also redesign the engine/UI to match the core idea"**.

README preserves the reference brief. It calls for planning and execution phases, movable/placeable mirrors, selected-mirror rotation, a FIRE button, a countdown/progress bar, sweeping real-time surveillance, hazard/failure/retry flows, and a pause/menu flow. None of this redesign has been implemented. The main unresolved work is reconciling those mechanics with fixed 90-degree prisms, deterministic four-phase cameras, live-beam alarm rejection, BFS optimality, and the existing par/stars system. Do not assume an unimplemented architecture proposal is an agreed design.

## Repository synchronization

`git pull --ff-only` succeeded with **Already up to date.** The first sandboxed attempt could not write `.git/FETCH_HEAD`; the authorized elevated retry succeeded. Git commands needed a command-scoped safe-directory override for this checkout. No global Git configuration was changed.

At pause, Git reports modified README plus untracked `.gitignore`, `AGENTS.md`, `AI_LOG.md`, `index.html`, `style.css`, and `js/`. The Run 1 implementation is therefore local and uncommitted. Preserve it. A fresh agent should inspect status and read files rather than assuming the remote contains this work.

## Candidate Levels 3–8 — NOT YET IN THE GAME

These objects were constructed and searched entirely in memory through a Node command using the CURRENT `Rules.parse`, `Rules.actions`, `Rules.step`, `Rules.hash`, and `Rules.isWin`. No temporary script or data file was created. The search rejected invalid steps, visited canonical hashes, and returned the shortest route. Initial states were safe and unsolved. These are construction results, not final official CLI results and not verified against any future redesign.

The data below preserves the interrupted work. Review the supplied `hint` text if adopted. Keep Levels 1–2 intact unless the approved rule redesign requires an explicit migration.

```js
[
  {
    id: 3, name: 'Sensor Alley', tier: 'Moderate', width: 6, height: 6,
    grid: ['######', '#D.PA#', '#E.P.#', '#....#', '#..PA#', '######'],
    entities: {},
    params: { emitterDir: 1, range: 7, prismRots: [3, 1, 0], cameras: [] },
    par: 6,
    solution: ['c:3:1', 'c:3:1', 'c:3:1', 'c:3:4', 'c:3:2', 'c:3:2'],
    hint: 'Shield the lower alarm before opening the upstream prism.'
  },
  {
    id: 4, name: 'Dual Boost', tier: 'Moderate', width: 6, height: 6,
    grid: ['######', '#DP#.#', '#.P.PA', '#.A#B#', '#E..P#', '######'],
    entities: {},
    params: { emitterDir: 1, range: 5, prismRots: [0, 2, 0, 1], cameras: [] },
    par: 8,
    solution: ['c:2:1', 'c:2:1', 'c:2:2', 'c:2:2', 'c:4:2', 'c:4:2', 'c:4:4', 'c:4:4'],
    hint: 'Recharge on the right, then route around the wall pillars.'
  },
  {
    id: 5, name: 'The Patrolling Eye', tier: 'Moderate', width: 6, height: 6,
    grid: ['######', '#.D..#', '#.P.P#', '#.C..#', '#E..P#', '######'],
    entities: {},
    params: {
      emitterDir: 1, range: 8, prismRots: [2, 0, 1],
      cameras: [{ x: 2, y: 3, baseDir: 0, range: 2 }]
    },
    par: 7,
    solution: ['c:4:2', 'c:2:2', 'c:2:2', 'c:4:2', 'c:4:4', 'c:4:4', 'W'],
    hint: 'Set the watched prism in a clear window; wait for the beam route to clear.'
  },
  {
    id: 6, name: 'Blind Spot', tier: 'Hard', width: 7, height: 7,
    grid: ['#######', '#DP#..#', '#.P.PA#', '#.A.B.#', '#.C...#', '#E..P.#', '#######'],
    entities: {},
    params: {
      emitterDir: 1, range: 5, prismRots: [3, 1, 0, 1],
      cameras: [{ x: 2, y: 4, baseDir: 0, range: 2 }]
    },
    par: 11,
    solution: ['c:2:1', 'c:2:1', 'c:2:1', 'c:2:2', 'c:4:2', 'c:2:2', 'c:2:2', 'c:4:2', 'c:4:5', 'c:4:5', 'W'],
    hint: 'Prepare the alarm-safe route before letting the beam through the booster.'
  },
  {
    id: 7, name: 'Crossfire Protocol', tier: 'Hard', width: 7, height: 7,
    grid: ['#######', '#P.P.A#', '#D..C.#', '#.CPBP#', '#..A..#', '#.E..P#', '#######'],
    entities: {},
    params: {
      emitterDir: 1, range: 6, prismRots: [2, 3, 1, 0, 1],
      cameras: [{ x: 4, y: 2, baseDir: 1, range: 2 }, { x: 2, y: 3, baseDir: 0, range: 2 }]
    },
    par: 15,
    solution: ['c:1:1', 'c:1:1', 'c:1:1', 'c:3:1', 'c:3:1', 'c:3:1', 'c:3:3', 'c:3:3', 'c:3:3', 'c:5:3', 'c:5:3', 'c:5:5', 'c:5:5', 'W', 'W'],
    hint: 'The two sweeps share a narrow window. Set the route before that window opens.'
  },
  {
    id: 8, name: 'Master Heist', tier: 'Hard', width: 8, height: 8,
    grid: ['########', '#P.P.A.#', '#D.BC..#', '#.CP.P.#', '#..A.B.#', '#.E..P.#', '#....PA#', '########'],
    entities: {},
    params: {
      emitterDir: 1, range: 5, prismRots: [2, 3, 2, 0, 1, 0],
      cameras: [{ x: 4, y: 2, baseDir: 1, range: 2 }, { x: 2, y: 3, baseDir: 0, range: 2 }]
    },
    par: 15,
    solution: ['c:1:1', 'c:1:1', 'c:1:1', 'c:3:1', 'c:3:1', 'c:3:1', 'c:3:3', 'c:3:3', 'c:5:3', 'c:5:3', 'c:5:6', 'c:5:5', 'c:5:5', 'c:5:6', 'c:5:6'],
    hint: 'Turn the bottom prism into an opaque shield before rotating the upstream prism twice.'
  }
]
```

### Construction evidence and caveats

- L3's solved main route uses the top prism at rot 2 and upstream prism at rot 3; the lower rot-0 prism initially reflects the upstream intermediate beam into an alarm. The search rotates that lower prism once to an opaque face before opening upstream. Its lower prism is a safety device, not part of the final diamond route.
- L4's solved row-major rotations are `[2, 0, 2, 3]`. The nine-step route needs the booster at step four to reach the goal with range five. It has one booster, as required by the later Run 2 request despite the level name.
- L5's solved rotations are `[0, 2, 3]`; the route is eight steps. The upper-left prism starts watched. The shortest route includes one W and finishes at phase 3.
- L6's solved rotations are `[2, 0, 2, 3]`; its ten-step route uses the booster at step five. The shortest route includes one W. The returned W is at the end, not before the central prism as described in the original lock; strengthen this aspect if strict adherence to that specific teaching beat is required.
- L7's solved rotations are `[1, 2, 0, 2, 3]`; its twelve-step route refills at step six. Camera base directions differ by one phase, and cones overlap. The returned path mostly groups rotations, so the stronger requirement for non-greedy interleaving has NOT been demonstrated; refine the candidate rather than claiming that requirement passed.
- L8 uses the same five-prism main route with boosters at `(5,4)` and `(3,2)`, plus a safety prism at `(5,6)`. Opening upstream at `(5,5)` before shielding sends the beam through the lower prism into `(6,6)`. The returned path first turns the shield opaque, then rotates upstream twice; it later spends two extra rotations on that off-route prism to advance phase. Consider using equivalent explicit W actions in a shortest authored route and verify through `Rules.step`. Do not confuse this with a fully reviewed finale.
- One-off construction search visited 41, 216, 205, 938, 4020, and 13964 states respectively. Its timings were roughly 1, 9, 6, 28, 112, and 409 ms. Its stopping point differs from the official solver's, so these are not final CLI state counts. L7/L8 initial searches exceeded the live 35 ms hint budget; the existing solver returns the gentle fallback, but improved hint performance may be desirable.
- Geometry, hazard ordering, mandatory waits, booster necessity, and teaching quality still need final review. A passing shortest-length search alone does not establish every qualitative requirement.

## Continuation checklist

1. Resume only when requested. Read the current handoff in AGENTS, README's product brief, current source, and Git status. Re-establish the deadline if needed.
2. Resolve and document the approved redesign's rule/state contract. Retain vanilla classic scripts, local-file compatibility, relative assets, procedural fallbacks, and one pure shared rules implementation.
3. Implement the chosen planning/execution, FIRE/countdown, mirror controls, surveillance, pause, and failure/retry flow. Reconcile any rule changes with BFS, hints, par, and stars. Do not silently treat the current candidate solutions as valid after rule changes.
4. Add/refine Levels 3–8, preserving Levels 1–2 as the baseline. Use the later Run 2 dimensions/counts/ranges and par bands: L3 6–8, L4 6–9, L5 7–10, L6 11–14, L7 12–16, L8 13–18. Detailed later requirements include 2 sensors and range 7 for L3; 4 prisms/1 booster/2 sensors/range 5 for L4; 3–4 prisms/1 camera of range 2/laser range 8 for L5; 4–5 prisms/1 camera/2 sensors/1 booster/range 5 for L6; 5 prisms/2 cameras/2 sensors/1 booster/range 6 for L7; 5–6 prisms/2 cameras/3 sensors/2 boosters/range 5 for L8.
5. Save shortest action arrays for new levels, run `node js/solver.js`, and fix until all eight persisted levels pass with true optimal pars and exit 0. Print the actual final CLI table. No unit-test suites, scratch files, or new dependency/build files.
6. Update UI counts/copy and README for the actual finished campaign and controls. Perform only permitted browser checks; report any unverified behavior accurately. Do not commit or push unless requested.
