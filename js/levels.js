(function (root, factory) {
  'use strict';
  var levels = factory();
  if (typeof module === 'object' && module.exports) module.exports = levels;
  if (root) {
    root.GAME_LEVELS = levels;
    root.GAME_LEGEND = {
      tileOrder: ['floor', 'wall', 'goal', 'emitter', 'prism', 'booster', 'sensor', 'camera'],
      codes: { '.': 'floor', '#': 'wall', D: 'goal', E: 'emitter', P: 'prism', B: 'booster', A: 'sensor', C: 'camera' }
    };
  }
}(typeof window !== 'undefined' ? window : null, function () {
  'use strict';
  return [
    {
      id: 1, name: 'The Training Vault', tier: 'Easy', width: 5, height: 5,
      grid: ['#####', '#D.P#', '#...#', '#E.P#', '#####'],
      entities: {},
      // Solved rotations [2, 3], scrambled backwards by [1, 2] clicks.
      params: { emitterDir: 1, range: 8, prismRots: [1, 1], cameras: [] },
      par: 3,
      solution: 'c:3:1 c:3:3 c:3:3',
      hint: 'The lower prism sends the beam up. The upper prism sends it left.'
    },
    {
      id: 2, name: 'Range Decay', tier: 'Easy', width: 5, height: 5,
      grid: ['#####', 'D.P.#', '#.B.#', '#EP.#', '#####'],
      entities: {},
      // Solved rotations [2, 3], scrambled backwards by [2, 2] clicks.
      // The five-step route needs the booster at step two to beat range four.
      params: { emitterDir: 1, range: 4, prismRots: [0, 1], cameras: [] },
      par: 4,
      solution: 'c:2:1 c:2:1 c:2:3 c:2:3',
      hint: 'Route up through the hexagonal booster, then left into the diamond.'
    }
  ];
}));
