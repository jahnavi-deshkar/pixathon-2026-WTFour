(function (root, factory) {
  'use strict';
  var node = typeof module === 'object' && module.exports;
  var solver = factory(node ? require('./rules.js') : root.Rules);
  if (node) {
    module.exports = solver;
    if (require.main === module) {
      var levels = require('./levels.js');
      var failed = false;
      console.log('id | name                    | method          | par | states | ms   | status');
      console.log('---|-------------------------|-----------------|-----|--------|------|-------');
      levels.forEach(function (level) {
        var result = solver.solveLevel(level);
        failed = failed || !result.ok;
        console.log(String(level.id).padEnd(2) + ' | ' + level.name.padEnd(23) + ' | ' + result.method.padEnd(15) + ' | ' +
          String(level.par).padEnd(3) + ' | ' + String(result.states).padEnd(6) + ' | ' + result.ms.toFixed(1).padEnd(4) + ' | ' +
          (result.ok ? 'PASS' : 'FAIL: ' + result.error));
      });
      process.exitCode = failed ? 1 : 0;
    }
  } else root.Solver = solver;
}(typeof window !== 'undefined' ? window : null, function (Rules) {
  'use strict';
  function now() { return typeof performance !== 'undefined' ? performance.now() : Date.now(); }
  function readSolution(value) {
    if (Array.isArray(value)) return value.slice();
    return typeof value === 'string' ? value.trim().split(/\s+/).filter(Boolean) : [];
  }
  function reconstruct(nodes, index) {
    var path = [];
    while (nodes[index].parent >= 0) { path.push(nodes[index].action); index = nodes[index].parent; }
    return path.reverse();
  }
  function search(initial, deadline) {
    var nodes = [{ state: initial, parent: -1, action: null }];
    var visited = new Set([Rules.hash(initial)]);
    if (Rules.isWin(initial)) return { solution: [], states: 1 };
    for (var head = 0; head < nodes.length; head += 1) {
      if (now() >= deadline) return { timedOut: true, states: visited.size };
      var choices = Rules.actions(nodes[head].state);
      for (var i = 0; i < choices.length; i += 1) {
        var result = Rules.step(nodes[head].state, choices[i]);
        if (!result.valid) continue;
        var key = Rules.hash(result.state);
        if (visited.has(key)) continue;
        if (visited.size >= 200000) return { capped: true, states: visited.size };
        visited.add(key);
        nodes.push({ state: result.state, parent: head, action: choices[i] });
        if (Rules.isWin(result.state)) return { solution: reconstruct(nodes, nodes.length - 1), states: visited.size };
      }
    }
    return { solution: null, states: visited.size };
  }
  function solveLevel(level) {
    var start = now();
    var output = { ok: false, method: 'replay + BFS', states: 0, ms: 0, solution: null, error: '' };
    try {
      var initial = Rules.parse(level), state = initial;
      var authored = readSolution(level.solution);
      authored.forEach(function (action) {
        var step = Rules.step(state, action);
        if (!step.valid) throw new Error('Authored solution contains an invalid action: ' + action);
        state = step.state;
      });
      if (!Rules.isWin(state)) throw new Error('Authored solution does not reach the diamond.');
      if (!Number.isInteger(level.par) || level.par < 3) throw new Error('Par must be an integer of at least 3.');
      if (Rules.isWin(initial)) throw new Error('Level starts solved.');
      var found = search(initial, Infinity);
      output.states = found.states;
      if (found.capped) {
        output.method = 'verified:replay'; output.solution = authored;
      } else {
        if (!found.solution) throw new Error('Level is unsolvable.');
        output.solution = found.solution;
        if (level.par !== found.solution.length) throw new Error('Par ' + level.par + ' differs from optimum ' + found.solution.length + '.');
      }
      output.ok = true;
    } catch (error) { output.error = error.message; }
    output.ms = now() - start;
    return output;
  }
  function nextAction(state, level) {
    var found = search(state, now() + 35);
    return found.solution && found.solution.length ? found.solution[0] : null;
  }
  return { solveLevel: solveLevel, nextAction: nextAction };
}));
