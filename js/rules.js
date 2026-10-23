(function (root, factory) {
  'use strict';
  var rules = factory();
  if (typeof module === 'object' && module.exports) module.exports = rules;
  if (root) { root.Rules = rules; root.GAME_LEGEND = rules.LEGEND; }
}(typeof window !== 'undefined' ? window : null, function () {
  'use strict';
  var vectors = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  var reflections = [{ 2: 1, 3: 0 }, { 3: 2, 0: 1 }, { 0: 3, 1: 2 }, { 1: 0, 2: 3 }];
  var legend = {
    tileOrder: ['floor', 'wall', 'goal', 'emitter', 'prism', 'booster', 'sensor', 'camera'],
    codes: { '.': 'floor', '#': 'wall', D: 'goal', E: 'emitter', P: 'prism', B: 'booster', A: 'sensor', C: 'camera' }
  };

  function vision(state) {
    var tiles = [];
    var seen = Object.create(null);
    state.cameras.forEach(function (camera) {
      var dir = (camera.baseDir + state.phase) % 4;
      var vector = vectors[dir];
      for (var n = 1; n <= (camera.range || 2); n += 1) {
        var x = camera.x + vector[0] * n;
        var y = camera.y + vector[1] * n;
        if (x < 0 || y < 0 || x >= state.width || y >= state.height || state.grid[y][x] === '#') break;
        var key = x + ':' + y;
        if (!seen[key]) { tiles.push({ x: x, y: y }); seen[key] = true; }
      }
    });
    return tiles;
  }

  function trace(state, events) {
    var beam = { segments: [], hitGoal: false, hitSensor: false, hitPoint: null };
    var covered = Object.create(null);
    vision(state).forEach(function (tile) { covered[tile.x + ':' + tile.y] = true; });
    var x = state.emitter.x, y = state.emitter.y, dir = state.emitter.dir, energy = state.range;
    for (var count = 0; energy > 0 && count < 64; count += 1) {
      var nx = x + vectors[dir][0], ny = y + vectors[dir][1];
      energy -= 1;
      beam.segments.push({ x1: x, y1: y, x2: nx, y2: ny, energy: energy });
      beam.hitPoint = { x: nx, y: ny };
      if (nx < 0 || ny < 0 || nx >= state.width || ny >= state.height) break;
      var tile = state.grid[ny][nx];
      if (tile === '#' || tile === 'C' || tile === 'E' || covered[nx + ':' + ny]) break;
      if (tile === 'A') { beam.hitSensor = true; break; }
      if (tile === 'D') { beam.hitGoal = true; events.push('toggle'); break; }
      if (tile === 'B') { energy = state.range; events.push('toggle'); }
      if (tile === 'P') {
        var prism = state.prisms.find(function (p) { return p.x === nx && p.y === ny; });
        var reflected = prism && reflections[prism.rot][dir];
        if (reflected === undefined) break;
        dir = reflected;
      }
      x = nx; y = ny;
    }
    return beam;
  }

  function rotationAt(source, index, x, y) {
    var value = Array.isArray(source) ? source[index] : source[x + ':' + y];
    if (value === undefined && !Array.isArray(source)) value = source[x + ',' + y];
    if (value && typeof value === 'object') value = value.rot;
    return value === undefined ? 0 : ((Number(value) % 4) + 4) % 4;
  }

  function parse(level) {
    var params = level.params || {};
    var state = {
      width: level.width, height: level.height, grid: level.grid.map(function (row) { return row.split(''); }),
      emitter: null, range: params.range === undefined ? 8 : params.range,
      prisms: [], cameras: [], phase: 0, turns: 0, beam: null
    };
    if (state.grid.length !== state.height || state.grid.some(function (row) { return row.length !== state.width; })) {
      throw new Error('Level dimensions do not match the grid.');
    }
    state.grid.forEach(function (row, y) {
      row.forEach(function (code, x) {
        if (!legend.codes[code]) throw new Error('Unknown tile: ' + code);
        if (code === 'E') {
          if (state.emitter) throw new Error('A vault must have exactly one emitter.');
          state.emitter = { x: x, y: y, dir: params.emitterDir === undefined ? 1 : params.emitterDir };
        }
        if (code === 'P') state.prisms.push({ x: x, y: y, rot: rotationAt(params.prismRots || params.prisms || [], state.prisms.length, x, y) });
        if (code === 'C') {
          var config = (params.cameras || []).find(function (c) { return c.x === x && c.y === y; }) || {};
          state.cameras.push({ x: x, y: y, baseDir: config.baseDir || 0, range: config.range || 2 });
        }
      });
    });
    if (!state.emitter || !Number.isInteger(state.emitter.dir) || state.emitter.dir < 0 || state.emitter.dir > 3 || !(state.range > 0)) {
      throw new Error('Invalid emitter or laser range.');
    }
    state.beam = trace(state, []);
    return state;
  }

  function actions(state) {
    var result = state.prisms.map(function (p) { return 'c:' + p.x + ':' + p.y; });
    if (state.cameras.length) result.push('W');
    return result;
  }

  function step(state, action) {
    var match = typeof action === 'string' && /^c:(\d+):(\d+)$/.exec(action);
    var index = -1;
    var rejected = { state: state, valid: false, events: ['bump'] };
    if (action === 'W') { if (!state.cameras.length) return rejected; }
    else {
      if (!match) return rejected;
      index = state.prisms.findIndex(function (p) { return p.x === Number(match[1]) && p.y === Number(match[2]); });
      if (index < 0) return rejected;
      if (vision(state).some(function (tile) { return tile.x === Number(match[1]) && tile.y === Number(match[2]); })) return rejected;
    }
    var next = {
      width: state.width, height: state.height, grid: state.grid.map(function (row) { return row.slice(); }),
      emitter: Object.assign({}, state.emitter), range: state.range,
      prisms: state.prisms.map(function (p) { return Object.assign({}, p); }),
      cameras: state.cameras.map(function (c) { return Object.assign({}, c); }),
      phase: state.cameras.length ? (state.phase + 1) % 4 : 0, turns: state.turns + 1, beam: null
    };
    var events = [];
    if (index >= 0) { next.prisms[index].rot = (next.prisms[index].rot + 1) % 4; events.push('rotate'); }
    if (state.cameras.length) events.push('phase');
    next.beam = trace(next, events);
    if (next.beam.hitSensor) return rejected;
    if (isWin(next)) events.push('win');
    return { state: next, valid: true, events: events };
  }

  function isWin(state) { return Boolean(state.beam && state.beam.hitGoal && !state.beam.hitSensor); }
  function hash(state) { return state.prisms.map(function (p) { return p.rot; }).join('') + ':' + state.phase; }

  return {
    meta: { inputMode: 'hybrid', commuting: false, reversible: false }, LEGEND: legend,
    parse: parse, actions: actions, step: step, isWin: isWin, hash: hash,
    vision: vision, heuristic: function () { return 0; }
  };
}));
