(function (root) {
  'use strict';
  var levels = root.GAME_LEVELS, Rules = root.Rules;
  var levelIndex = 0, state = null, history = [], listeners = [], stars = {};
  var started = false, muted = false, animation = null, timer = 0, buffered = null;
  var hintAction = null, message = '', reducedMotion = root.matchMedia('(prefers-reduced-motion: reduce)');
  try {
    var saved = JSON.parse(localStorage.getItem('prism-heist-progress') || '{}');
    if (saved && typeof saved === 'object') stars = saved;
    muted = localStorage.getItem('prism-heist-muted') === 'true';
  } catch (error) { stars = {}; }
  root.GameAudio.setMuted(muted);

  function snapshot() {
    return {
      level: levels[levelIndex], levelIndex: levelIndex, state: state, started: started, muted: muted,
      historyLength: history.length, animation: animation, hintAction: hintAction, message: message,
      won: state ? Rules.isWin(state) : false, stars: Object.assign({}, stars)
    };
  }
  function publish(events, detail) {
    root.GameAudio.react(events || []);
    var view = snapshot();
    listeners.forEach(function (listener) { listener(view, events || [], detail || {}); });
  }
  function cancelMove() { clearTimeout(timer); animation = null; buffered = null; }
  function load(index) {
    if (!levels[index]) return;
    cancelMove(); levelIndex = index; state = Rules.parse(levels[index]); history = [];
    hintAction = null; message = 'Signal live. Vault ' + String(levels[index].id).padStart(2, '0') + ' online.';
    publish([], { type: 'load' });
  }
  function saveWin() {
    var score = state.turns <= levels[levelIndex].par ? 3 : state.turns <= levels[levelIndex].par + 2 ? 2 : 1;
    stars[levels[levelIndex].id] = Math.max(Number(stars[levels[levelIndex].id]) || 0, score);
    try { localStorage.setItem('prism-heist-progress', JSON.stringify(stars)); } catch (error) { /* Private browsing still permits play. */ }
  }
  function finishAnimation() {
    animation = null;
    var pending = buffered; buffered = null;
    publish([], { type: 'settled' });
    if (pending && !Rules.isWin(state)) dispatch(pending);
  }
  function animate(previous, events, type) {
    if (!reducedMotion.matches && (events.indexOf('rotate') >= 0 || events.indexOf('phase') >= 0)) {
      animation = { previous: previous, start: performance.now(), duration: 110, type: type || 'action' };
      timer = setTimeout(finishAnimation, 110);
    }
  }

  function dispatch(action) {
    if (action === 'mute') {
      muted = !muted; root.GameAudio.setMuted(muted);
      try { localStorage.setItem('prism-heist-muted', String(muted)); } catch (error) { /* Optional persistence. */ }
      publish([], { type: 'mute' }); return;
    }
    if (action === 'start') {
      root.GameAudio.unlock(); started = true;
      publish(['toggle'], { type: 'start' }); return;
    }
    if (!started) return;
    if (/^level:\d+$/.test(action)) { load(Number(action.split(':')[1])); return; }
    if (action === 'next') {
      if (!Rules.isWin(state)) return;
      if (levels[levelIndex + 1]) load(levelIndex + 1);
      else publish(['toggle'], { type: 'select' });
      return;
    }
    if (action === 'select') { publish(['toggle'], { type: 'select' }); return; }
    if (action === 'reset') { load(levelIndex); return; }
    if (action === 'undo') {
      cancelMove(); hintAction = null;
      if (!history.length) { message = 'No moves to undo yet.'; publish([], { type: 'message' }); return; }
      var before = state; state = history.pop(); message = 'Last move undone.';
      animate(before, ['rotate'], 'undo'); publish(['rotate'], { type: 'undo' }); return;
    }
    if (action === 'hint') {
      if (Rules.isWin(state)) return;
      hintAction = root.Solver.nextAction(state, levels[levelIndex]);
      if (hintAction === 'W') message = 'Wait one beat for the next surveillance window.';
      else if (hintAction) {
        var cell = hintAction.split(':');
        message = 'Rotate prism ' + String.fromCharCode(65 + Number(cell[1])) + (Number(cell[2]) + 1) + ' clockwise. ' + levels[levelIndex].hint;
      } else message = 'The route is hard to read. Press R for a fresh start.';
      publish([], { type: 'hint' }); return;
    }
    if (Rules.isWin(state)) return;
    if (animation) { buffered = action; return; }
    var result = Rules.step(state, action);
    if (!result.valid) {
      message = 'Move blocked. Find a clear prism or surveillance window.';
      publish(result.events, { type: 'invalid', action: action }); return;
    }
    var previous = state;
    history.push(state); state = result.state; hintAction = null;
    message = 'Signal live. ' + state.turns + (state.turns === 1 ? ' move recorded.' : ' moves recorded.');
    if (result.events.indexOf('win') >= 0) { buffered = null; saveWin(); message = 'Diamond secured. Vault cleared.'; }
    animate(previous, result.events);
    publish(result.events, { type: 'action', action: action });
  }

  root.GameEngine = {
    dispatch: dispatch, snapshot: snapshot,
    subscribe: function (listener) { listeners.push(listener); },
    init: function () { load(0); }
  };
}(window));
