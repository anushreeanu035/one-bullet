/* ONE BULLET — the bullet hunts you.
   One thumb, one rule: hold to slip into bullet time, spend focus, get off the line.
   Twelve rooms, each one adding a rule of its own. */
(function (root) {
  'use strict';

  var CFG = {
    W: 720, H: 1280,
    RAIL_Y: 1016,
    RAIL_X0: 128, RAIL_X1: 592,
    PLAYER_R: 17,
    BULLET_R: 7,
    MOVE_SPEED: 1500,
    TIME_SLOW: 0.13,
    FOCUS_DRAIN: 1.25,
    FOCUS_GAIN: 0.30,
    SPEED_UP: 1.045,
    PASS_NEAR: 235,
    PASS_FAR: 305
  };

  var BORDER = [
    { x: -60, y: -60, w: 840, h: 90 },
    { x: -60, y: 1180, w: 840, h: 160 },
    { x: -60, y: -60, w: 90, h: 1400 },
    { x: 690, y: -60, w: 90, h: 1400 }
  ];

  /* ---------------------------------------------------------------- levels */
  var LEVELS = [
    { id: 1, name: 'The Undercroft', speed: 640, passes: 4, focus: 2.2,
      hint: 'Hold anywhere to slip, then let go. The red line is exactly where it will hit.',
      walls: [], start: { x: 360, y: 210 } },

    { id: 2, name: 'Two Walls', speed: 680, passes: 4, focus: 2.2,
      hint: 'The walls change the angle. Wait for it to commit, then move.',
      walls: [{ x: 120, y: 430, w: 210, h: 32 }, { x: 390, y: 430, w: 210, h: 32 }],
      start: { x: 200, y: 190 } },

    { id: 3, name: 'The Long Room', speed: 690, passes: 4, focus: 2.2,
      hint: 'Longer room, longer line. Do not spend the slip before the line is drawn.',
      walls: [{ x: 230, y: 330, w: 260, h: 30 }, { x: 60, y: 700, w: 200, h: 30 }, { x: 460, y: 700, w: 200, h: 30 }],
      start: { x: 560, y: 150 } },

    { id: 4, name: 'The Split', speed: 700, passes: 4, focus: 2.4,
      hint: 'It breaks in two on the second wall. Both halves want you.',
      walls: [{ x: 300, y: 520, w: 120, h: 30 }],
      start: { x: 360, y: 170 }, split: { at: 2, spread: 0.42 } },

    { id: 5, name: 'Slow Rain', speed: 560, passes: 4, focus: 2.2,
      hint: 'Focus is short here. Every hold has to count.',
      walls: [], start: { x: 150, y: 200 }, focusTight: true },

    { id: 6, name: 'The Creep', speed: 720, passes: 5, focus: 2.1,
      hint: 'It bends in the air \u2014 standing still is a decision.',
      walls: [{ x: 60, y: 480, w: 240, h: 30 }, { x: 420, y: 480, w: 240, h: 30 }],
      start: { x: 360, y: 160 }, curve: 0.55 },

    { id: 7, name: 'The Gate', speed: 760, passes: 5, focus: 2.1,
      hint: 'A wall that breathes. The angle changes while it moves.',
      walls: [{ x: 300, y: 380, w: 120, h: 30 }],
      movers: [{ x: 130, y: 620, w: 120, h: 28, ax: 180, ay: 0, sp: 0.9, ph: 0 }],
      start: { x: 360, y: 150 } },

    { id: 8, name: 'Blind Third', speed: 780, passes: 5, focus: 2.0,
      hint: 'After the third dodge the line goes dark. Read the bullet, not the line.',
      walls: [{ x: 60, y: 560, w: 180, h: 30 }, { x: 480, y: 560, w: 180, h: 30 }],
      start: { x: 360, y: 170 }, hideLineAfter: 2 },

    { id: 9, name: 'Twin Bores', speed: 700, passes: 6, focus: 2.3,
      hint: 'Two of them now, out of phase. One line at a time.',
      walls: [{ x: 320, y: 400, w: 80, h: 260 }],
      start: { x: 200, y: 160 }, bullets: 2, phase: 1.9 },

    { id: 10, name: 'The Gauntlet', speed: 820, passes: 6, focus: 2.2,
      hint: 'Faster. Both halves split. Keep your feet.',
      walls: [{ x: 300, y: 460, w: 120, h: 30 }, { x: 60, y: 760, w: 160, h: 30 }, { x: 500, y: 760, w: 160, h: 30 }],
      start: { x: 360, y: 140 }, split: { at: 2, spread: 0.5 } },

    { id: 11, name: 'The Core', speed: 880, passes: 7, focus: 2.2,
      hint: 'It bends, it splits, and the gate moves. Everything at once.',
      walls: [{ x: 320, y: 420, w: 80, h: 80 }],
      movers: [{ x: 90, y: 640, w: 110, h: 26, ax: 150, ay: 0, sp: 1.1, ph: 0 }],
      start: { x: 360, y: 160 }, curve: 0.4, split: { at: 3, spread: 0.45 } },

    { id: 12, name: 'One Bullet', speed: 880, passes: 7, focus: 2.0,
      hint: 'Last room. No hints left \u2014 only the line and your thumb.',
      walls: [{ x: 60, y: 520, w: 200, h: 26 }, { x: 460, y: 520, w: 200, h: 26 }, { x: 320, y: 300, w: 80, h: 26 }],
      movers: [{ x: 300, y: 720, w: 130, h: 26, ax: 200, ay: 0, sp: 1.3, ph: 1 }],
      start: { x: 360, y: 140 }, curve: 0.5, split: { at: 4, spread: 0.5 }, hideLineAfter: 4 }
  ];

  /* ------------------------------------------------------------- geometry */
  function rectEdges(r) {
    return [
      { x1: r.x, y1: r.y, x2: r.x + r.w, y2: r.y, nx: 0, ny: -1 },
      { x1: r.x, y1: r.y + r.h, x2: r.x + r.w, y2: r.y + r.h, nx: 0, ny: 1 },
      { x1: r.x, y1: r.y, x2: r.x, y2: r.y + r.h, nx: -1, ny: 0 },
      { x1: r.x + r.w, y1: r.y, x2: r.x + r.w, y2: r.y + r.h, nx: 1, ny: 0 }
    ];
  }

  /* level rects, with movers at their current position */
  function liveWalls(s) {
    var out = BORDER.concat(s.L.walls || []);
    if (s.L.movers) {
      for (var i = 0; i < s.L.movers.length; i++) {
        var m = s.L.movers[i];
        out.push({ x: m.x + Math.sin(s.t * m.sp + m.ph) * m.ax, y: m.y + Math.cos(s.t * m.sp + m.ph) * m.ay, w: m.w, h: m.h });
      }
    }
    return out;
  }

  function raySeg(px, py, dx, dy, e) {
    var vx = e.x2 - e.x1, vy = e.y2 - e.y1;
    var den = dx * vy - dy * vx;
    if (Math.abs(den) < 1e-9) return Infinity;
    var t = ((e.x1 - px) * vy - (e.y1 - py) * vx) / den;
    var u = ((e.x1 - px) * dy - (e.y1 - py) * dx) / den;
    if (t > 0.02 && u >= -0.0001 && u <= 1.0001) return t;
    return Infinity;
  }

  function nearestWall(rects, px, py, dx, dy) {
    var best = { t: Infinity, nx: 0, ny: 0 };
    for (var i = 0; i < rects.length; i++) {
      var es = rectEdges(rects[i]);
      for (var k = 0; k < 4; k++) {
        var t = raySeg(px, py, dx, dy, es[k]);
        if (t < best.t) best = { t: t, nx: es[k].nx, ny: es[k].ny };
      }
    }
    return best;
  }

  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }

  /* ---------------------------------------------------------------- state */
  function createState(levelIndex) {
    var L = LEVELS[levelIndex];
    var s = {
      L: L, index: levelIndex,
      player: { x: 360, y: CFG.RAIL_Y, target: 360, moving: 0 },
      bullets: [],
      focus: L.focus, maxFocus: L.focus,
      holding: false, slow: 0, timeScale: 1,
      passes: 0, bounces: 0,
      status: 'play', events: [], stall: 0,
      flash: 0, nearMiss: 0, t: 0, clock: 0,
      lineHidden: false, lastLineAt: 0, lastBounceAt: 0
    };
    var count = L.bullets || 1;
    for (var i = 0; i < count; i++) {
      s.bullets.push(makeBullet(s, L.start.x + (i ? 90 : -90) * (i % 2 ? 1 : -1),
        L.start.y + i * 40, L.speed));
    }
    for (var b = 0; b < s.bullets.length; b++) aim(s, s.bullets[b], true);
    return s;
  }

  function makeBullet(s, x, y, speed) {
    return { x: x, y: y, vx: 0, vy: -1, speed: speed, born: s.clock, bounces: 0, split: false, alive: true, armed: false, line: null, lineAt: 0 };
  }

  /* Liang-Barsky: does the segment enter the rect? */
  function segRect(x1, y1, x2, y2, r) {
    var t0 = 0, t1 = 1;
    var dx = x2 - x1, dy = y2 - y1;
    var p = [-dx, dx, -dy, dy];
    var q = [x1 - r.x, r.x + r.w - x1, y1 - r.y, r.y + r.h - y1];
    for (var i = 0; i < 4; i++) {
      if (Math.abs(p[i]) < 1e-9) { if (q[i] < 0) return false; continue; }
      var t = q[i] / p[i];
      if (p[i] < 0) { if (t > t1) return false; if (t > t0) t0 = t; }
      else { if (t < t0) return false; if (t < t1) t1 = t; }
    }
    return t1 - t0 > 0.001;
  }

  function lineBlocked(rects, x1, y1, x2, y2) {
    for (var i = 0; i < rects.length; i++) {
      if (segRect(x1, y1, x2, y2, rects[i])) return true;
    }
    return false;
  }

  /* Want you: aim at the player whenever the line is open. When a wall is in the way,
     keep the ricochet it just took — that is what makes the rooms feel alive. */
  function aim(s, b, silent) {
    var tx = s.player.x, ty = s.player.y - 26;
    var dx = tx - b.x, dy = ty - b.y;
    var len = Math.hypot(dx, dy) || 1;
    dx /= len; dy /= len;
    var rects = liveWalls(s);
    var open = !lineBlocked(rects, b.x + dx * 6, b.y + dy * 6, tx, ty);
    if (!open) { dx = b.vx; dy = b.vy; }
    b.vx = dx; b.vy = dy;
    var wall = nearestWall(rects, b.x, b.y, dx, dy);
    var reach = open ? Math.min(wall.t, Math.hypot(tx - b.x, ty - b.y)) : (isFinite(wall.t) ? wall.t : 620);
    b.line = { x1: b.x, y1: b.y, x2: b.x + dx * reach, y2: b.y + dy * reach };
    b.lineAt = s.clock;
    if (!silent) push(s, { e: 'aim', x: b.x, y: b.y });
  }

  function push(s, e) { s.events.push(e); if (s.events.length > 24) s.events.shift(); }

  /* ----------------------------------------------------------------- step */
  function step(s, dt, input) {
    if (s.status !== 'play') return s;
    input = input || {};
    s.clock += dt;

    s.holding = !!input.holding && s.focus > 0.001;
    var target = typeof input.targetX === 'number' ? input.targetX : s.player.x;
    s.player.target = target;

    if (s.holding) {
      s.focus = Math.max(0, s.focus - CFG.FOCUS_DRAIN * dt);
      s.slow = Math.min(1, s.slow + dt * 8);
    } else {
      s.focus = Math.min(s.maxFocus, s.focus + CFG.FOCUS_GAIN * dt);
      s.slow = Math.max(0, s.slow - dt * 6);
    }
    s.timeScale = 1 - (1 - CFG.TIME_SLOW) * s.slow;
    var gdt = dt * s.timeScale;
    s.t += gdt;

    if (s.holding) {
      var maxStep = CFG.MOVE_SPEED * dt;   // the slip is real-time: quick, but it burns focus
      var d = s.player.target - s.player.x;
      var move = clamp(d, -maxStep, maxStep);
      s.player.x = clamp(s.player.x + move, CFG.RAIL_X0, CFG.RAIL_X1);
      s.player.moving = Math.abs(move) > 0.3 ? Math.sign(move) : 0;
    } else s.player.moving = 0;

    s.stall += gdt;
    if (s.stall > 2.2) {
      // a bullet trapped in a pocket stops being a threat: put it back in the air
      s.stall = 0;
      for (var r2 = 0; r2 < s.bullets.length; r2++) {
        var rb = s.bullets[r2];
        if (!rb.alive) continue;
        rb.x = 180 + ((s.bounces + r2) % 3) * 150; rb.y = 130 + ((s.bounces + r2) % 2) * 45;
        rb.speed = s.L.speed; rb.bounces = 0;
        aim(s, rb, false);
      }
      push(s, { e: 'relaunch' });
    }

    var rects = liveWalls(s);
    for (var i = 0; i < s.bullets.length; i++) {
      var b = s.bullets[i];
      if (!b.alive) continue;
      moveBullet(s, b, rects, gdt);
      if (s.status !== 'play') return s;
    }

    // pass detection per bullet
    for (var j = 0; j < s.bullets.length; j++) {
      var bb = s.bullets[j];
      if (!bb.alive) continue;
      var pd = Math.hypot(bb.x - s.player.x, bb.y - (s.player.y - 26));
      if (pd < CFG.PASS_NEAR) bb.armed = true;
      else if (bb.armed && pd > CFG.PASS_FAR) {
        bb.armed = false;
        s.passes++;
        s.stall = 0;
        push(s, { e: 'pass', n: s.passes });
        if (s.passes >= s.L.passes) { s.status = 'clear'; push(s, { e: 'clear' }); return s; }
      }
    }
    return s;
  }

  /* If a bullet ever ends up inside a wall (a wall moved over it, or a split landed on an
     edge), push it out through the nearest face. Without this it rattles in place forever. */
  function unstick(b, rects) {
    for (var i = 0; i < rects.length; i++) {
      var r = rects[i];
      if (b.x > r.x + 2 && b.x < r.x + r.w - 2 && b.y > r.y + 2 && b.y < r.y + r.h - 2) {
        var dl = b.x - r.x, dr = r.x + r.w - b.x;
        var dt2 = b.y - r.y, db = r.y + r.h - b.y;
        var m = Math.min(dl, dr, dt2, db);
        if (m === dl) { b.x = r.x - 1; if (b.vx > 0) b.vx = -b.vx; }
        else if (m === dr) { b.x = r.x + r.w + 1; if (b.vx < 0) b.vx = -b.vx; }
        else if (m === dt2) { b.y = r.y - 1; if (b.vy > 0) b.vy = -b.vy; }
        else { b.y = r.y + r.h + 1; if (b.vy < 0) b.vy = -b.vy; }
      }
    }
  }

  function moveBullet(s, b, rects, gdt) {
    unstick(b, rects);
    // curve: bend toward the player while it flies
    if (s.L.curve) {
      var tx = s.player.x - b.x, ty = (s.player.y - 26) - b.y;
      var want = Math.atan2(ty, tx);
      var have = Math.atan2(b.vy, b.vx);
      var diff = Math.atan2(Math.sin(want - have), Math.cos(want - have));
      var turn = clamp(diff, -s.L.curve * gdt, s.L.curve * gdt);
      var a = have + turn;
      var cx = Math.cos(a), cy = Math.sin(a);
      var w0 = nearestWall(rects, b.x, b.y, cx, cy);
      if (w0.t > 30) { b.vx = cx; b.vy = cy; }
    }

    var remaining = b.speed * gdt;
    var guard = 0;
    while (remaining > 0.001 && guard++ < 6) {
      var w = nearestWall(rects, b.x, b.y, b.vx, b.vy);
      if (!isFinite(w.t)) { b.x += b.vx * remaining; b.y += b.vy * remaining; break; }
      if (w.t > remaining) {
        b.x += b.vx * remaining; b.y += b.vy * remaining;
        remaining = 0;
      } else {
        b.x += b.vx * w.t; b.y += b.vy * w.t;
        remaining -= w.t;
        var dot = b.vx * w.nx + b.vy * w.ny;
        b.vx -= 2 * dot * w.nx;
        b.vy -= 2 * dot * w.ny;
        b.x += b.vx * 0.8; b.y += b.vy * 0.8;
        b.speed *= CFG.SPEED_UP;
        b.bounces++;
        s.bounces++;
        push(s, { e: 'bounce', x: b.x, y: b.y });
        aim(s, b, false);
        if (s.L.split && b.bounces === s.L.split.at && !b.split) {
          b.split = true;
          var ang = Math.atan2(b.vy, b.vx);
          var sp = { x: Math.cos(ang + s.L.split.spread), y: Math.sin(ang + s.L.split.spread) };
          var nb = makeBullet(s, b.x, b.y, b.speed * 0.94);
          nb.vx = sp.x; nb.vy = sp.y;
          nb.split = true;
          nb.line = { x1: b.x, y1: b.y, x2: b.x + sp.x * 620, y2: b.y + sp.y * 620 };
          nb.lineAt = s.clock;
          s.bullets.push(nb);
          push(s, { e: 'split', x: b.x, y: b.y });
        }
      }
    }

    // hit
    var pd = Math.hypot(b.x - s.player.x, b.y - (s.player.y - 26));
    if (pd < CFG.PLAYER_R + CFG.BULLET_R) {
      b.alive = false;
      s.status = 'hit';
      s.flash = 1;
      push(s, { e: 'hit', x: b.x, y: b.y });
      return;
    }
    s.nearMiss = pd < 120 ? 1 : Math.max(0, s.nearMiss - gdt * 2);
  }

  var SIM = { CFG: CFG, LEVELS: LEVELS, BORDER: BORDER, createState: createState, step: step, liveWalls: liveWalls };
  if (typeof module !== 'undefined' && module.exports) module.exports = SIM;
  root.SIM = SIM;
})(typeof window !== 'undefined' ? window : this);
