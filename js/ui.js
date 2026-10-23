(function (root) {
  'use strict';
  var Engine = root.GameEngine, Rules = root.Rules;
  var byId = function (id) { return document.getElementById(id); };
  var board = byId('board'), ctx = board.getContext('2d'), particleCanvas = byId('particles');
  var particleCtx = particleCanvas.getContext('2d');
  var shell = byId('game-shell'), frame = byId('board-frame');
  var dialogs = [byId('title-dialog'), byId('levels-dialog'), byId('victory-dialog')];
  var view = null, selected = 0, hovered = null, keyboardSelection = false, pointer = null;
  var boardSize = 0, padding = 26, tileSize = 0, pixelRatio = 1, paintId = 0, particleId = 0;
  var victoryTimer = 0, shakeTimer = 0, particles = [], assets = {}, reducedMotion = root.matchMedia('(prefers-reduced-motion: reduce)');
  var palette = { bg: '#0B0F19', floor: '#1E293B', ink: '#334155', text: '#F8FAFC', amber: '#F59E0B', cyan: '#00F5D4' };
  var uiOrder = ['star_full', 'star_empty', 'undo', 'reset', 'hint', 'mute'];
  var directions = [[0, -1], [1, 0], [0, 1], [-1, 0]];

  function sheet(context, name, index, x, y, size) {
    var image = assets[name];
    if (!image || index >= image.width / image.height) return false;
    context.imageSmoothingEnabled = false;
    context.drawImage(image, index * image.height, 0, image.height, image.height, x, y, size, size);
    return true;
  }
  function polygon(context, points, fill, stroke, width) {
    context.beginPath(); points.forEach(function (point, index) {
      if (!index) context.moveTo(point[0], point[1]); else context.lineTo(point[0], point[1]);
    }); context.closePath();
    if (fill) { context.fillStyle = fill; context.fill(); }
    if (stroke) { context.strokeStyle = stroke; context.lineWidth = width || 2; context.stroke(); }
  }
  function star(context, cx, cy, radius, full) {
    var points = [];
    for (var i = 0; i < 10; i += 1) {
      var angle = -Math.PI / 2 + i * Math.PI / 5, distance = i % 2 ? radius * 0.46 : radius;
      points.push([cx + Math.cos(angle) * distance, cy + Math.sin(angle) * distance]);
    }
    polygon(context, points, full ? palette.amber : palette.bg, full ? palette.amber : palette.ink, 2);
  }
  function icon(canvas) {
    var context = canvas.getContext('2d'), name = canvas.dataset.icon, size = canvas.width;
    context.clearRect(0, 0, size, size);
    if (sheet(context, 'ui_elements', uiOrder.indexOf(name), 0, 0, size)) return;
    context.save(); context.scale(size / 28, size / 28);
    context.strokeStyle = name === 'hint' ? palette.amber : palette.text;
    context.lineWidth = 2; context.lineCap = 'square'; context.lineJoin = 'miter';
    if (name === 'star_full' || name === 'star_empty') star(context, 14, 14, 11, name === 'star_full');
    else if (name === 'undo' || name === 'reset') {
      context.beginPath(); context.arc(14, 15, 8, -Math.PI * 0.8, Math.PI * 0.8); context.stroke();
      context.beginPath(); context.moveTo(5, 5); context.lineTo(5, 11); context.lineTo(11, 11); context.stroke();
      if (name === 'reset') { context.beginPath(); context.moveTo(20, 23); context.lineTo(23, 21); context.stroke(); }
    } else if (name === 'hint') {
      context.beginPath(); context.arc(14, 11, 7, 0, Math.PI * 2); context.stroke();
      context.beginPath(); context.moveTo(10, 17); context.lineTo(11, 23); context.lineTo(17, 23); context.lineTo(18, 17);
      context.moveTo(11, 26); context.lineTo(17, 26); context.stroke();
    } else if (name === 'mute') {
      polygon(context, [[3, 11], [8, 11], [14, 6], [14, 22], [8, 17], [3, 17]], null, palette.text, 2);
      context.beginPath();
      if (view && view.muted) {
        context.moveTo(19, 10); context.lineTo(26, 18); context.moveTo(26, 10); context.lineTo(19, 18);
      } else context.arc(15, 14, 10, -0.7, 0.7);
      context.stroke();
    }
    context.restore();
  }

  function loadAssets() {
    ['hero', 'tileset', 'ui_elements'].forEach(function (name) {
      var image = new Image();
      image.onload = function () {
        if (image.height > 0 && image.width >= image.height && image.width % image.height === 0) assets[name] = image;
        redrawAssets();
      };
      image.onerror = function () { assets[name] = null; redrawAssets(); };
      image.src = 'assets/sprites/' + name + '.png';
    });
  }
  function redrawAssets() {
    document.querySelectorAll('canvas[data-icon]').forEach(icon);
    drawTitle(); requestPaint();
  }
  function drawTitle() {
    var canvas = byId('title-art'), context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = palette.ink; context.lineWidth = 2;
    for (var x = 30; x < 360; x += 30) {
      context.beginPath(); context.moveTo(x, 20); context.lineTo(x, 160); context.stroke();
    }
    [30, 60, 90, 120, 150].forEach(function (y) {
      context.beginPath(); context.moveTo(30, y); context.lineTo(330, y); context.stroke();
    });
    context.strokeStyle = palette.cyan; context.lineWidth = 5;
    context.beginPath(); context.moveTo(30, 130); context.lineTo(180, 130); context.lineTo(180, 50); context.lineTo(300, 50); context.stroke();
    context.save(); context.translate(180, 130); mirror(context, 62, 3 * Math.PI / 2, false); context.restore();
    context.save(); context.translate(180, 50); mirror(context, 62, Math.PI / 2, false); context.restore();
    polygon(context, [[300, 28], [320, 50], [300, 72], [280, 50]], palette.bg, palette.amber, 4);
    if (assets.hero) sheet(context, 'hero', 0, 10, 110, 40);
    else { context.fillStyle = palette.cyan; context.fillRect(20, 120, 20, 20); }
  }

  function mirror(context, size, angle, useSprite) {
    context.save(); context.rotate(angle);
    if (useSprite) sheet(context, 'tileset', 4, -size / 2, -size / 2, size);
    var q = size * 0.25;
    polygon(context, [[-q, -q], [-q, q], [q, q]], palette.ink, palette.ink, Math.max(5, size * 0.08));
    context.strokeStyle = palette.text; context.lineWidth = Math.max(4, size * 0.065);
    context.beginPath(); context.moveTo(-q, -q); context.lineTo(q, q); context.stroke();
    context.fillStyle = palette.text;
    context.fillRect(-2, -size * 0.39, 4, size * 0.12);
    context.fillRect(size * 0.27, -2, size * 0.12, 4);
    context.fillStyle = palette.cyan; context.fillRect(-3, -3, 6, 6);
    context.restore();
  }
  function hexagon(context, radius) {
    var points = [];
    for (var i = 0; i < 6; i += 1) points.push([Math.cos(i * Math.PI / 3) * radius, Math.sin(i * Math.PI / 3) * radius]);
    polygon(context, points, palette.bg, palette.amber, 3);
    context.save(); context.scale(0.65, 0.65); polygon(context, points, null, palette.amber, 2); context.restore();
    polygon(context, [[1, -radius * 0.5], [-radius * 0.25, 2], [1, 2], [-1, radius * 0.5], [radius * 0.25, -2], [-1, -2]], palette.amber);
  }
  function center(x, y) { return [padding + (x + 0.5) * tileSize, padding + (y + 0.5) * tileSize]; }
  function resize() {
    var nextSize = board.getBoundingClientRect().width;
    if (!nextSize) return;
    boardSize = nextSize; pixelRatio = Math.min(root.devicePixelRatio || 1, 3);
    padding = boardSize < 400 ? 23 : 30;
    [board, particleCanvas].forEach(function (canvas) {
      canvas.width = Math.round(boardSize * pixelRatio); canvas.height = Math.round(boardSize * pixelRatio);
    });
    tileSize = view ? (boardSize - padding * 2) / view.state.width : 0;
    draw();
  }
  function requestPaint() {
    if (!paintId) paintId = requestAnimationFrame(function () { paintId = 0; draw(); });
  }
  function draw() {
    if (!view || !boardSize) return;
    var state = view.state, time = performance.now();
    tileSize = (boardSize - padding * 2) / state.width;
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingEnabled = false; ctx.clearRect(0, 0, boardSize, boardSize);
    ctx.fillStyle = palette.bg; ctx.fillRect(0, 0, boardSize, boardSize);
    ctx.font = '16px ui-monospace, Consolas, monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = palette.text; ctx.globalAlpha = 0.5;
    for (var col = 0; col < state.width; col += 1) ctx.fillText(String.fromCharCode(65 + col), center(col, 0)[0], padding * 0.45);
    for (var row = 0; row < state.height; row += 1) ctx.fillText(String(row + 1), padding * 0.45, center(0, row)[1]);
    ctx.globalAlpha = 1;
    state.grid.forEach(function (rowTiles, y) {
      rowTiles.forEach(function (tile, x) {
        var px = padding + x * tileSize, py = padding + y * tileSize;
        ctx.fillStyle = tile === '#' ? palette.ink : palette.floor;
        ctx.fillRect(px + 2, py + 2, tileSize - 4, tileSize - 4);
        var index = tile === '#' ? 1 : 0;
        if (!sheet(ctx, 'tileset', index, px + 2, py + 2, tileSize - 4)) {
          if (tile === '#') {
            ctx.strokeStyle = palette.bg; ctx.lineWidth = 2;
            ctx.strokeRect(px + 9, py + 9, tileSize - 18, tileSize - 18);
            ctx.fillStyle = palette.floor; ctx.fillRect(px + tileSize / 2 - 2, py + tileSize / 2 - 2, 4, 4);
          } else {
            ctx.fillStyle = palette.ink; ctx.fillRect(px + 8, py + 8, 2, 2); ctx.fillRect(px + tileSize - 10, py + tileSize - 10, 2, 2);
          }
        }
      });
    });
    Rules.vision(state).forEach(function (cell) {
      var px = padding + cell.x * tileSize, py = padding + cell.y * tileSize;
      ctx.save(); ctx.fillStyle = palette.amber; ctx.globalAlpha = 0.12; ctx.fillRect(px + 4, py + 4, tileSize - 8, tileSize - 8);
      ctx.globalAlpha = 0.9; ctx.setLineDash([5, 5]); ctx.strokeStyle = palette.amber; ctx.lineWidth = 2;
      ctx.strokeRect(px + 6, py + 6, tileSize - 12, tileSize - 12); ctx.restore();
    });

    ctx.save(); ctx.beginPath(); ctx.rect(padding, padding, tileSize * state.width, tileSize * state.height); ctx.clip();
    state.beam.segments.forEach(function (segment) {
      var from = center(segment.x1, segment.y1), to = center(segment.x2, segment.y2);
      ctx.strokeStyle = palette.cyan; ctx.lineWidth = 12; ctx.globalAlpha = 0.12;
      ctx.beginPath(); ctx.moveTo(from[0], from[1]); ctx.lineTo(to[0], to[1]); ctx.stroke();
      ctx.globalAlpha = 1; ctx.lineWidth = 3; ctx.stroke();
      var dx = segment.x2 - segment.x1, dy = segment.y2 - segment.y1;
      var remaining = Math.max(0, Math.ceil(segment.energy / state.range * 4));
      for (var pip = 0; pip < 4; pip += 1) {
        var fraction = 0.25 + pip / 6;
        ctx.fillStyle = pip < remaining ? palette.cyan : palette.ink;
        ctx.fillRect(from[0] + dx * tileSize * fraction - dy * 9 - 1.5, from[1] + dy * tileSize * fraction + dx * 9 - 1.5, 3, 3);
      }
    });
    ctx.restore();

    state.grid.forEach(function (rowTiles, y) {
      rowTiles.forEach(function (tile, x) {
        if (tile === '.' || tile === '#') return;
        var point = center(x, y), size = tileSize * 0.8;
        ctx.save(); ctx.translate(point[0], point[1]);
        if (tile === 'P') {
          var index = state.prisms.findIndex(function (prism) { return prism.x === x && prism.y === y; });
          var angle = state.prisms[index].rot * Math.PI / 2;
          if (view.animation && !reducedMotion.matches) {
            var previous = view.animation.previous.prisms[index].rot;
            if (previous !== state.prisms[index].rot) {
              var fraction = Math.min(1, (time - view.animation.start) / view.animation.duration);
              fraction = fraction * fraction * (3 - 2 * fraction);
              var delta = view.animation.type === 'undo' ? -1 : 1;
              angle = (previous + delta * fraction) * Math.PI / 2;
            }
          }
          mirror(ctx, size, angle, true);
          var isHint = view.hintAction === 'c:' + x + ':' + y;
          if (isHint || (keyboardSelection && selected === index) || hovered === index) {
            ctx.strokeStyle = isHint ? palette.amber : palette.cyan; ctx.lineWidth = isHint ? 3 : 2;
            if (isHint) ctx.setLineDash([6, 4]);
            ctx.strokeRect(-tileSize * 0.43, -tileSize * 0.43, tileSize * 0.86, tileSize * 0.86); ctx.setLineDash([]);
            ctx.beginPath(); ctx.arc(0, 0, size * 0.43, -1.05, -0.15); ctx.stroke();
          }
        } else if (tile === 'E') {
          if (!sheet(ctx, 'hero', 0, -size / 2, -size / 2, size) && !sheet(ctx, 'tileset', 3, -size / 2, -size / 2, size)) {
            ctx.rotate(state.emitter.dir * Math.PI / 2);
            ctx.fillStyle = palette.bg; ctx.fillRect(-size * 0.28, -size * 0.3, size * 0.56, size * 0.6);
            ctx.strokeStyle = palette.cyan; ctx.lineWidth = 3; ctx.strokeRect(-size * 0.28, -size * 0.3, size * 0.56, size * 0.6);
            polygon(ctx, [[0, -size * 0.19], [size * 0.13, size * 0.04], [-size * 0.13, size * 0.04]], palette.cyan);
            ctx.fillStyle = palette.cyan; ctx.fillRect(-size * 0.12, size * 0.15, size * 0.24, 3);
          }
        } else if (tile === 'D') {
          if (!sheet(ctx, 'tileset', 2, -size / 2, -size / 2, size)) {
            var r = size * 0.33;
            polygon(ctx, [[0, -r], [r * 0.8, 0], [0, r], [-r * 0.8, 0]], palette.bg, view.won ? palette.cyan : palette.text, 3);
            ctx.strokeStyle = view.won ? palette.cyan : palette.text; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(-r * 0.8, 0); ctx.lineTo(r * 0.8, 0); ctx.moveTo(0, -r); ctx.lineTo(-r * 0.25, 0); ctx.lineTo(0, r); ctx.lineTo(r * 0.25, 0); ctx.closePath(); ctx.stroke();
          }
        } else if (tile === 'B') {
          if (!sheet(ctx, 'tileset', 5, -size / 2, -size / 2, size)) hexagon(ctx, size * 0.35);
        } else if (tile === 'A') {
          if (!sheet(ctx, 'tileset', 6, -size / 2, -size / 2, size)) {
            polygon(ctx, [[0, -size * 0.36], [size * 0.36, size * 0.3], [-size * 0.36, size * 0.3]], palette.bg, palette.amber, 3);
            ctx.strokeStyle = palette.amber; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, -size * 0.12); ctx.lineTo(0, size * 0.07); ctx.stroke();
            ctx.fillStyle = palette.amber; ctx.fillRect(-2, size * 0.17, 4, 4);
          }
        } else if (tile === 'C') {
          var camera = state.cameras.find(function (item) { return item.x === x && item.y === y; });
          ctx.rotate((camera.baseDir + state.phase) * Math.PI / 2);
          if (!sheet(ctx, 'tileset', 7, -size / 2, -size / 2, size)) {
            ctx.fillStyle = palette.bg; ctx.fillRect(-size * 0.25, -size * 0.2, size * 0.5, size * 0.4);
            ctx.strokeStyle = palette.amber; ctx.lineWidth = 3; ctx.strokeRect(-size * 0.25, -size * 0.2, size * 0.5, size * 0.4);
            polygon(ctx, [[-size * 0.12, -size * 0.2], [size * 0.12, -size * 0.2], [0, -size * 0.4]], palette.amber);
          }
        }
        ctx.restore();
      });
    });
    if (view.animation && !reducedMotion.matches && time < view.animation.start + view.animation.duration) requestPaint();
  }

  function burst() {
    if (reducedMotion.matches) return;
    var goal = null;
    view.state.grid.forEach(function (row, y) { row.forEach(function (tile, x) { if (tile === 'D') goal = center(x, y); }); });
    if (!goal) return;
    var start = performance.now();
    particles = Array.from({ length: 25 }, function (_, index) {
      var angle = index / 25 * Math.PI * 2, speed = 60 + Math.random() * 150;
      return { x: goal[0], y: goal[1], vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, color: index % 2 ? palette.cyan : palette.amber, size: 3 + Math.random() * 4 };
    });
    cancelAnimationFrame(particleId);
    function tick(time) {
      var t = (time - start) / 1000;
      particleCtx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0); particleCtx.clearRect(0, 0, boardSize, boardSize);
      particles.forEach(function (particle) {
        particleCtx.globalAlpha = Math.max(0, 1 - t / 0.9); particleCtx.fillStyle = particle.color;
        particleCtx.fillRect(particle.x + particle.vx * t, particle.y + particle.vy * t + 160 * t * t, particle.size, particle.size);
      });
      particleCtx.globalAlpha = 1;
      if (t < 0.9) particleId = requestAnimationFrame(tick);
      else { particles = []; particleCtx.clearRect(0, 0, boardSize, boardSize); }
    }
    particleId = requestAnimationFrame(tick);
  }

  function syncInert() { shell.inert = dialogs.some(function (dialog) { return dialog.open; }); }
  function openDialog(dialog) {
    dialogs.forEach(function (other) { if (other !== dialog && other.open) other.close(); });
    if (!dialog.open) dialog.showModal();
    syncInert();
  }
  function closeDialogs() { dialogs.forEach(function (dialog) { if (dialog.open) dialog.close(); }); syncInert(); }
  function renderLevelGrid() {
    var grid = byId('level-grid'); grid.replaceChildren();
    for (var index = 0; index < 8; index += 1) {
      var level = root.GAME_LEVELS[index], button = document.createElement('button');
      button.className = 'button level-slot'; button.type = 'button'; button.disabled = !level;
      var number = document.createElement('span'); number.className = 'slot-number'; number.textContent = String(index + 1).padStart(2, '0');
      var name = document.createElement('span'); name.className = 'slot-name'; name.textContent = level ? level.name : 'Operation offline';
      button.append(number, name);
      if (level) {
        var stars = document.createElement('span'); stars.className = 'slot-stars';
        var count = Math.min(3, Math.max(0, Number(view.stars[level.id]) || 0));
        stars.textContent = '★'.repeat(count) + '☆'.repeat(3 - count); stars.setAttribute('aria-label', count + ' of 3 stars'); button.append(stars);
        button.dataset.level = String(index);
        button.setAttribute('aria-label', 'Vault ' + level.id + ': ' + level.name + ', ' + count + ' of 3 stars');
      }
      grid.append(button);
    }
  }
  function showVictory() {
    if (!view.won) return;
    var level = view.level, count = view.state.turns <= level.par ? 3 : view.state.turns <= level.par + 2 ? 2 : 1;
    var stars = byId('victory-stars'); stars.replaceChildren(); stars.setAttribute('aria-label', count + ' of 3 stars earned');
    for (var i = 0; i < 3; i += 1) {
      var canvas = document.createElement('canvas'); canvas.width = 64; canvas.height = 64; canvas.dataset.icon = i < count ? 'star_full' : 'star_empty';
      canvas.setAttribute('aria-hidden', 'true'); stars.append(canvas); icon(canvas);
    }
    byId('victory-moves').textContent = view.state.turns; byId('victory-par').textContent = level.par;
    byId('victory-best').textContent = view.stars[level.id] + ' / 3';
    var hasNext = Boolean(root.GAME_LEVELS[view.levelIndex + 1]);
    var cleared = root.GAME_LEVELS.filter(function (item) { return Number(view.stars[item.id]) > 0; }).length;
    byId('victory-description').textContent = hasNext ? level.name + ' is clear. The next vault awaits.' :
      cleared === root.GAME_LEVELS.length ? 'Both available vaults are clear. A clean getaway.' : level.name + ' is clear. Another vault awaits.';
    byId('next-label').textContent = hasNext ? 'Next vault' : 'Return to vaults';
    openDialog(byId('victory-dialog')); byId('next-button').focus();
  }

  function update(next, events, detail) {
    view = next;
    if (detail.type === 'load' || detail.type === 'undo') {
      clearTimeout(victoryTimer); closeDialogs();
      cancelAnimationFrame(particleId); particles = []; particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
      if (detail.type === 'load') { selected = Math.max(0, view.state.prisms.length - 1); hovered = null; keyboardSelection = false; }
    }
    byId('level-name').textContent = view.level.name; byId('vault-number').textContent = String(view.level.id).padStart(2, '0');
    byId('tier-label').textContent = view.level.tier + ' / ' + String(view.level.id).padStart(2, '0');
    byId('feed-label').textContent = 'PRISM ARRAY / ' + view.state.width + ' × ' + view.state.height;
    byId('moves-value').textContent = String(view.state.turns).padStart(2, '0'); byId('par-value').textContent = String(view.level.par).padStart(2, '0');
    byId('range-value').textContent = String(view.state.range).padStart(2, '0');
    byId('phase-value').textContent = view.state.cameras.length ? (view.state.phase + 1) + ' / 4' : 'Offline';
    byId('phase-dots').querySelectorAll('i').forEach(function (dot, index) { dot.classList.toggle('active', Boolean(view.state.cameras.length) && index === view.state.phase); });
    byId('status-message').textContent = view.message;
    byId('beam-status').textContent = view.won ? 'DIAMOND SECURED' : 'SIGNAL ACTIVE';
    byId('undo-button').disabled = !view.historyLength; byId('hint-button').disabled = view.won;
    byId('wait-button').disabled = !view.state.cameras.length || view.won;
    byId('wait-button').title = view.state.cameras.length ? 'Advance the CCTV sweep one beat' : 'Wait is available in vaults with CCTV';
    byId('mute-button').setAttribute('aria-pressed', String(view.muted));
    byId('mute-button').setAttribute('aria-label', view.muted ? 'Unmute sound (M)' : 'Mute sound (M)');
    byId('mute-label').textContent = view.muted ? 'Sound off' : 'Sound on';
    byId('progress-count').textContent = root.GAME_LEVELS.filter(function (level) { return Number(view.stars[level.id]) > 0; }).length;
    var meter = byId('par-meter'); meter.replaceChildren(); meter.classList.toggle('over', view.state.turns > view.level.par);
    for (var n = 0; n < view.level.par; n += 1) { var pip = document.createElement('i'); pip.classList.toggle('used', n < view.state.turns); meter.append(pip); }
    document.querySelectorAll('canvas[data-icon="mute"]').forEach(icon);
    if (events.indexOf('bump') >= 0 && !reducedMotion.matches) {
      clearTimeout(shakeTimer); frame.classList.remove('shake-x', 'shake-y');
      var target = /^c:(\d+):(\d+)$/.exec(detail.action || '');
      var axis = target && Math.abs(Number(target[2]) - view.state.emitter.y) > Math.abs(Number(target[1]) - view.state.emitter.x) ? 'shake-y' : 'shake-x';
      void board.offsetWidth; frame.classList.add(axis);
      shakeTimer = setTimeout(function () { frame.classList.remove('shake-x', 'shake-y'); }, 120);
    }
    if (detail.type === 'start') { closeDialogs(); board.focus({ preventScroll: true }); resize(); }
    if (detail.type === 'select') { clearTimeout(victoryTimer); renderLevelGrid(); openDialog(byId('levels-dialog')); }
    if (events.indexOf('win') >= 0) { burst(); victoryTimer = setTimeout(showVictory, reducedMotion.matches ? 0 : 650); }
    requestPaint();
  }

  function cellAt(event) {
    var rect = board.getBoundingClientRect();
    var x = Math.floor((event.clientX - rect.left - padding) / tileSize), y = Math.floor((event.clientY - rect.top - padding) / tileSize);
    return x >= 0 && y >= 0 && x < view.state.width && y < view.state.height ? { x: x, y: y } : null;
  }
  function selectPrism(direction) {
    var prisms = view.state.prisms, current = prisms[selected];
    if (!current) return;
    var vector = directions[direction], best = -1, bestScore = Infinity;
    prisms.forEach(function (prism, index) {
      var dx = prism.x - current.x, dy = prism.y - current.y, forward = dx * vector[0] + dy * vector[1];
      if (forward <= 0) return;
      var score = Math.abs(dx * vector[1] - dy * vector[0]) * 10 + forward;
      if (score < bestScore) { best = index; bestScore = score; }
    });
    selected = best >= 0 ? best : (selected + 1) % prisms.length; keyboardSelection = true;
    var prism = prisms[selected];
    board.setAttribute('aria-label', 'Prism ' + String.fromCharCode(65 + prism.x) + (prism.y + 1) + ' selected. Enter rotates clockwise. Arrow keys select another prism.');
    requestPaint();
  }

  board.addEventListener('pointerdown', function (event) {
    if (event.button !== 0 || !event.isPrimary) return;
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, cell: cellAt(event) };
    board.setPointerCapture(event.pointerId);
  });
  board.addEventListener('pointerup', function (event) {
    if (!pointer || pointer.id !== event.pointerId) return;
    var gesture = pointer; pointer = null;
    var distance = Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y);
    var cell = distance > 24 ? gesture.cell : cellAt(event);
    if (cell) {
      var index = view.state.prisms.findIndex(function (prism) { return prism.x === cell.x && prism.y === cell.y; });
      if (index >= 0) selected = index;
      keyboardSelection = false;
      Engine.dispatch(distance > 24 && index < 0 && view.state.cameras.length ? 'W' : 'c:' + cell.x + ':' + cell.y);
    }
  });
  board.addEventListener('pointercancel', function () { pointer = null; });
  board.addEventListener('lostpointercapture', function () { pointer = null; });
  board.addEventListener('pointermove', function (event) {
    if (!view || pointer) return;
    var cell = cellAt(event), index = cell ? view.state.prisms.findIndex(function (prism) { return prism.x === cell.x && prism.y === cell.y; }) : -1;
    if (hovered !== index) { hovered = index; board.style.cursor = index >= 0 ? 'pointer' : 'crosshair'; requestPaint(); }
  });
  board.addEventListener('pointerleave', function () { hovered = null; requestPaint(); });

  byId('start-button').addEventListener('click', function () { Engine.dispatch('start'); });
  byId('levels-button').addEventListener('click', function () { Engine.dispatch('select'); });
  byId('mute-button').addEventListener('click', function () { Engine.dispatch('mute'); });
  ['wait', 'undo', 'reset', 'hint'].forEach(function (command) {
    byId(command + '-button').addEventListener('click', function () { Engine.dispatch(command === 'wait' ? 'W' : command); });
  });
  byId('next-button').addEventListener('click', function () { Engine.dispatch('next'); });
  byId('replay-button').addEventListener('click', function () { Engine.dispatch('reset'); });
  byId('level-grid').addEventListener('click', function (event) {
    var button = event.target.closest('button[data-level]');
    if (button) { Engine.dispatch('level:' + button.dataset.level); board.focus({ preventScroll: true }); }
  });
  document.querySelectorAll('[data-close]').forEach(function (button) {
    button.addEventListener('click', function () { byId(button.dataset.close).close(); });
  });
  dialogs.forEach(function (dialog) {
    dialog.addEventListener('close', function () {
      syncInert(); if (view && view.started && !dialogs.some(function (item) { return item.open; })) board.focus({ preventScroll: true });
    });
    if (dialog.id !== 'levels-dialog') dialog.addEventListener('cancel', function (event) { event.preventDefault(); });
  });
  document.addEventListener('keydown', function (event) {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    var key = event.key.toLowerCase();
    if (key === 'm') { event.preventDefault(); if (!event.repeat) Engine.dispatch('mute'); return; }
    if (byId('title-dialog').open) {
      if (key === 'enter' || key === ' ') { event.preventDefault(); if (!event.repeat) Engine.dispatch('start'); }
      return;
    }
    if (['z', 'r', 'h'].indexOf(key) >= 0) {
      event.preventDefault();
      if (!event.repeat) Engine.dispatch({ z: 'undo', r: 'reset', h: 'hint' }[key]);
      return;
    }
    if (key === 'l') { event.preventDefault(); if (!event.repeat) { if (byId('levels-dialog').open) byId('levels-dialog').close(); else Engine.dispatch('select'); } return; }
    if (byId('levels-dialog').open) return;
    if (view.won) {
      if (key === 'enter' || key === ' ') { event.preventDefault(); if (!event.repeat) Engine.dispatch('next'); }
      return;
    }
    if (key === 'w' || key === ' ') { event.preventDefault(); if (!event.repeat) Engine.dispatch('W'); return; }
    // Buttons keep their standard Enter activation; board navigation uses Enter on the canvas.
    if (event.target.closest('button, a')) return;
    var arrows = { arrowup: 0, arrowright: 1, arrowdown: 2, arrowleft: 3 };
    if (arrows[key] !== undefined) { event.preventDefault(); selectPrism(arrows[key]); }
    if (key === 'enter') {
      event.preventDefault();
      var prism = view.state.prisms[selected];
      if (prism && !event.repeat) Engine.dispatch('c:' + prism.x + ':' + prism.y);
    }
  });
  if (root.ResizeObserver) new ResizeObserver(resize).observe(frame);
  else root.addEventListener('resize', resize);
  reducedMotion.addEventListener('change', function () {
    if (reducedMotion.matches) {
      cancelAnimationFrame(particleId); particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
    }
    requestPaint();
  });
  Engine.subscribe(update); Engine.init(); resize(); loadAssets(); drawTitle();
  openDialog(byId('title-dialog')); byId('start-button').focus();
}(window));
