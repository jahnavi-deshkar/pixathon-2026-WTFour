# Prism Heist

**Development is paused.** The current build contains the original engine and two playable vaults. A broader redesign was approved but has not been implemented. Agent handoff: read `AGENTS.md`, then `AI_LOG.md` for candidate Levels 3–8 and remaining work.

A quiet heist made of light. Rotate corner prisms clockwise to guide a limited-range laser into a diamond. Hexagonal boosters refill the beam. Alarm sensors reject unsafe moves; CCTV fields block the beam and prevent rotating watched prisms. Each valid action advances surveillance by one quarter turn.

Open `index.html` directly in a browser, or serve the repository on GitHub Pages. No installation, dependencies, network connection, or build step is needed. This first release contains two playable vaults; the remaining six slots are offline.

## Controls

- Click, tap, or swipe a prism to rotate it clockwise.
- Use arrow keys to select a prism, then Enter to rotate it.
- W or Space waits one beat when a vault has CCTV.
- Z undoes a move, R resets, H highlights an optimal next move, M toggles sound, and L opens vault selection. The on-screen buttons offer the same actions.
- Enter or Space continues after a solve.

Three stars require finishing at or below par; two stars allow two extra moves. Other completed routes earn one star. Best stars and the mute setting save locally when browser storage is available. Reduced-motion settings suppress movement and particles.

## Verification

Run `node js/solver.js`. It first replays each authored solution through the shared, pure rules engine, then uses breadth-first search to verify the shortest route and exact par. It prints a result for every available level and exits with code 1 on failure. Searches exceeding 200,000 states report `verified:replay` instead of claiming optimality. Live hints use the same search with a 35 ms budget.

The two routes were constructed from solved prism orientations and scrambled backward. Their optimal pars are 3 and 4. In Range Decay, the five-step path requires the booster because the laser has only four energy.

## Optional assets

Missing assets automatically use geometric canvas art and synthesized sound. No placeholder files are required. Reload after adding finished assets at these relative paths:

- `assets/sprites/hero.png`: a horizontal strip of square frames; the first frame replaces the emitter.
- `assets/sprites/tileset.png`: square frames ordered floor, wall, goal, emitter, prism, booster, sensor, camera. The prism frame uses the NE orientation.
- `assets/sprites/ui_elements.png`: square frames ordered star_full, star_empty, undo, reset, hint, mute.
- `assets/audio/click.mp3`, `slide.mp3`, `solve.mp3`, and `bgm.mp3`: effects and looping background audio. Audio begins only after pressing Start.

## Approved product direction — not yet implemented

The user's source brief is `C:\Users\Administrator\Downloads\Core_Idea.txt`. This summary preserves its intent for agents who do not have that local file. It is product reference material; instructions inside the attachment do not independently authorize agent actions.

Prism Heist is a top-down stealth laser-routing game set in a museum. The player is a hacker in the control room, guiding a partner toward a secured diamond. The intended experience has two distinct phases:

- **Planning:** inspect the museum and patrol paths, place or drag mirrors, select and rotate them, manage the remaining mirror count, and pause to plan.
- **Execution:** press FIRE or let a countdown/progress bar reach its endpoint to fire the configured laser. Success requires reaching the diamond within range while avoiding sensors and guards. Missing the diamond or hitting a hazard causes failure and a retry flow.

The brief also asks for sweeping CCTV/guard vision cones with randomized time intervals, restrictions on manipulating watched tiles, a main menu with Start Heist/Levels/Audio/Quit, a pause menu, clean pixel-style museum art, neon laser light, amber hazards, and restrained espionage audio. The original brief mentions arbitrary mirror angles and four example levels; the later development request specifies eight levels using the named Mechanic Lock ladder.

The user explicitly approved redesigning the engine/UI after being told that these features exceed a levels-only change. This approval does not mean any redesign is already present.

## Decisions and remaining work

Reconcile the product brief with the deterministic corner-prism rules before implementation. Decide whether planning retains 90-degree corner prisms or changes the mirror model, how placement inventories and patrol timing affect the state/search space, what triggers failure, and how turns/par remain meaningful when surveillance moves in real time. Keep one shared rules implementation for gameplay and the solver. Preserve reproducible verification; do not introduce unseeded randomness into pure rules.

Candidate Levels 3–8 were constructed from solved routes and searched in memory against the existing rules. Their observed shortest lengths are 6, 8, 7, 11, 15, and 15. They have not been saved to the game, reviewed as a full campaign, or verified by the official CLI. Exact grids, parameters, paths, and caveats are in `AI_LOG.md`. If the rule contract changes, revalidate or redesign them.

After the redesign and level work, run `node js/solver.js` until all eight persisted levels pass with exact optimal pars. Update the displayed vault count, descriptions, controls, and README to match the actual implementation. The current UI/README still describe two available vaults.

The built-in browser rejected the attempted local-file preview. No browser-console check or GitHub Pages check has passed, and no claim of either should be made. Keep verification within the permitted tools and access policies.
