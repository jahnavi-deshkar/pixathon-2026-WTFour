# Prism Verify — implementation log

## Current status — 2026-10-23

The user resumed the paused handoff, approved the core-idea engine/UI redesign, and expanded the product into an interactive human-verification challenge. Implementation is complete for the local prototype and server-validated demonstration gate. It is not a production CAPTCHA/firewall, and no external application has been integrated or deployed. No commit or push was made.

## Delivered

- Professional light interface with green controls, a dark geometric signal board, explicit verification steps, instructions, keyboard/touch controls, reduced motion, and procedural graphics/audio fallbacks.
- Verify, Practice, and Workshop modes with separate access/scoring behavior.
- Explicit planning, FIRE/execution, success, pause, and retry flows. The preview reaching the target alone does not complete a session.
- Workshop relocation of existing mirrors through pure `Rules.step` actions. The original 90-degree corner-mirror model is retained; arbitrary-angle optics are not implemented.
- Optional live rehearsals with a 90-second automatic-fire timer, randomized CCTV intervals outside pure rules, pause, and hidden-tab pausing. Their results are unranked.
- Eight persisted levels. Levels 1–2 retain their original definitions. The six former in-memory candidates were adopted and refined: L6's shortest authored route begins with W; L7 camera phases force interleaving in the authored optimum at par 13; L8 uses the opaque shield followed by two explicit wait beats.
- Authored-path lookup accelerates canonical hints; off-route BFS remains budgeted.
- An optional zero-dependency loopback HTTP demo server in `js/engine.js`. It issues expiring session-bound one-use challenges, replays routes independently, and gates a demo resource. Static mode is clearly labeled and cannot grant server access.
- Current operation/security boundaries and the revised architecture contract are documented in README and AGENTS.

## Final recorded verification

`node js/solver.js` exited 0 after the final level refinements:

```text
id | name                    | method          | par | states | ms     | status
1  | The Training Vault      | replay + BFS    | 3   | 9      | 4.4    | PASS
2  | Range Decay             | replay + BFS    | 4   | 12     | 0.5    | PASS
3  | Sensor Alley            | replay + BFS    | 6   | 33     | 2.8    | PASS
4  | Dual Boost              | replay + BFS    | 8   | 192    | 12.3   | PASS
5  | The Patrolling Eye      | replay + BFS    | 7   | 164    | 16.6   | PASS
6  | Blind Spot              | replay + BFS    | 11  | 876    | 46.2   | PASS
7  | Crossfire Protocol      | replay + BFS    | 13  | 3646   | 246.8  | PASS
8  | Master Heist            | replay + BFS    | 15  | 13040  | 1254.2 | PASS
UI wiring / script syntax / server replay / one-use challenge / session isolation: PASS
```

Timings vary with machine load. Loopback requests failed under the initial restricted sandbox; the approved elevated run passed. The CLI additionally rejects empty routes and cross-origin requests and confirms unrelated sessions cannot fetch the protected resource. No extra test or scratch files were created.

The browser displayed the new HTTP app at `http://127.0.0.1:8081` and a server-accepted route during inspection. Captured JavaScript error logs were empty. The direct-file browser check remains unverified because the browser tool previously rejected file URLs. No mobile visual or assistive-technology audit is recorded.

## Remaining integration work

A real deployment requires the owner's backend and protected resource, HTTPS/session controls, production anti-abuse measures, and an accessible alternative verification method. The public finite puzzle can be solved by software, so puzzle completion must not be sold as proof of humanity. The supplied local server protects only its demonstration endpoint. No external-system credentials or deployment target were supplied.

All changes remain local and uncommitted. Keep the allowed file tree and zero-dependency constraints when continuing. Do not reuse the obsolete paused handoff as the current product status.
