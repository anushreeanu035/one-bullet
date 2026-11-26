/* ONE BULLET — presentation.
   Phaser draws the room, the figure, the bullets and the aim lines.
   Input is plain DOM so a tap can never be swallowed by the engine. */
(function () {
  'use strict';

  var W = 720, H = 1280;
  var qs = new URLSearchParams(location.search);
  var START = Math.max(0, Math.min(SIM.LEVELS.length - 1, (parseInt(qs.get('level') || '1', 10) || 1) - 1));
  var AUTO = qs.get('auto') === '1';
  var CHAIN = qs.get('chain') === '1';          // demo: walk through the rooms by itself
  var CANVAS_HUD = qs.get('hud') === 'canvas';  // draw the HUD in the canvas (for video capture)

  var COL = {
    ink: 0xeaf3ff, mint: 0x7ce8ff, warm: 0xffb36b, bad: 0xff5f4a,
    wall: 0x0e161f, wallLip: 0x2a4256, grid: 0x0a1219
  };

  var UI = {
    room: document.getElementById('roomName'),
    passCur: document.getElementById('passCur'),
    passNeed: document.getElementById('passNeed'),
    hint: document.getElementById('hint'),
    focusFill: document.getElementById('focusFill'),
    focusPct: document.getElementById('focusPct'),
    wrap: document.getElementById('panel-wrap'),
    eyebrow: document.getElementById('pEyebrow'),
    title: document.getElementById('pTitle'),
    sub: document.getElementById('pSub'),
    stat: document.getElementById('pStat'),
    btn: document.getElementById('pBtn'),
    ghost: document.getElementById('pGhost')
  };

  var panelHandler = null;
  UI.btn.addEventListener('click', function () { if (panelHandler) panelHandler('main'); });
  UI.ghost.addEventListener('click', function () { if (panelHandler) panelHandler('ghost'); });

  function showPanel(p) {
    UI.eyebrow.textContent = p.eyebrow || '';
    UI.title.textContent = p.title || '';
    UI.sub.textContent = p.sub || '';
    UI.stat.textContent = p.stat || '';
    UI.btn.textContent = p.button || 'OK';
    if (p.ghost) { UI.ghost.textContent = p.ghost; UI.ghost.style.display = 'block'; }
    else UI.ghost.style.display = 'none';
    panelHandler = function (which) {
      if (which === 'ghost' && p.onGhost) { p.onGhost(); return; }
      if (p.onButton) p.onButton();
    };
    UI.wrap.classList.add('on');
    if (window.GAME) window.GAME.pausedUi = true;
  }
  function hidePanel() { UI.wrap.classList.remove('on'); window.GAME.pausedUi = false; }

  function layoutUi() {
    var c = window.GAME && window.GAME.canvas;
    if (!c) return;
    var r = c.getBoundingClientRect();
    var els = [document.getElementById('ui'), document.getElementById('panel-wrap')];
    els.forEach(function (el) {
      el.style.left = r.left + 'px'; el.style.top = r.top + 'px';
      el.style.width = r.width + 'px'; el.style.height = r.height + 'px';
    });
  }
  window.addEventListener('resize', function () { setTimeout(layoutUi, 60); });

  /* ------------------------------------------------------------ audio */
  function Sfx() { this.ctx = null; }
  Sfx.prototype.init = function () {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try { this.ctx = new AC(); } catch (e) { this.ctx = null; }
  };
  Sfx.prototype.tone = function (f, dur, type, gain, to) {
    if (!this.ctx) return;
    var c = this.ctx, t = c.currentTime;
    var o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(f, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain || 0.05, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + 0.02);
  };
  Sfx.prototype.noise = function (dur, gain, freq) {
    if (!this.ctx) return;
    var c = this.ctx, t = c.currentTime;
    var n = Math.floor(c.sampleRate * dur);
    var buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    var src = c.createBufferSource(); src.buffer = buf;
    var bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = freq || 1200; bp.Q.value = 0.9;
    var g = c.createGain(); g.gain.value = gain || 0.08;
    src.connect(bp); bp.connect(g); g.connect(c.destination); src.start(t);
  };
  Sfx.prototype.slipIn = function () { this.tone(700, 0.35, 'sine', 0.04, 180); };
  Sfx.prototype.slipOut = function () { this.tone(220, 0.22, 'sine', 0.03, 620); };
  Sfx.prototype.bounce = function () { this.tone(320 + Math.random() * 60, 0.07, 'square', 0.02); };
  Sfx.prototype.pass = function () { this.noise(0.18, 0.06, 2400); };
  Sfx.prototype.split = function () { this.noise(0.2, 0.1, 900); this.tone(180, 0.2, 'sawtooth', 0.05, 90); };
  Sfx.prototype.hit = function () { this.noise(0.35, 0.22, 300); this.tone(90, 0.5, 'triangle', 0.1, 40); };
  Sfx.prototype.clear = function () {
    var self = this;
    [523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) { setTimeout(function () { self.tone(f, 0.7, 'sine', 0.045); }, i * 95); });
  };

  /* ------------------------------------------------------------ scene */
  function Scene() { Phaser.Scene.call(this, { key: 'onebullet' }); }
  Scene.prototype = Object.create(Phaser.Scene.prototype);
  Scene.prototype.constructor = Scene;

  Scene.prototype.init = function (data) {
    this.levelIndex = (data && typeof data.level === 'number') ? data.level : START;
  };

  Scene.prototype.create = function () {
    var self = this;
    this.sfx = this.sfx || new Sfx();
    this.s = SIM.createState(this.levelIndex);
    this.L = this.s.L;
    this.trails = this.s.bullets.map(function () { return []; });
    this.holding = false;
    this.targetX = this.s.player.x;
    this.done = false;

    this.makeTextures();
    this.buildBackdrop();
    this.buildArena();
    this.buildPlayer();

    var spot = this.add.graphics().setDepth(3);
    spot.fillStyle(0x0d2634, 0.55);
    spot.beginPath();
    spot.moveTo(SIM.CFG.RAIL_X0 - 90, SIM.CFG.RAIL_Y + 26);
    spot.lineTo(SIM.CFG.RAIL_X1 + 90, SIM.CFG.RAIL_Y + 26);
    spot.lineTo(SIM.CFG.RAIL_X1 + 40, SIM.CFG.RAIL_Y - 380);
    spot.lineTo(SIM.CFG.RAIL_X0 - 40, SIM.CFG.RAIL_Y - 380);
    spot.closePath(); spot.fillPath();

    var struts = this.add.graphics().setDepth(2);
    struts.lineStyle(1, 0x14232e, 1);
    for (var sx = 60; sx < W; sx += 120) {
      struts.beginPath(); struts.moveTo(sx, 30); struts.lineTo(sx, SIM.CFG.RAIL_Y + 20); struts.strokePath();
    }

    this.gfxMovers = this.add.graphics().setDepth(7);
    this.gfxLine = this.add.graphics().setDepth(10);
    this.gfxBullet = this.add.graphics().setDepth(24);
    this.gfxFx = this.add.graphics().setDepth(26);
    this.slowTint = this.add.rectangle(W / 2, H / 2, W, H, 0x3fb6d8, 0).setDepth(44);

    this.sparks = this.add.particles(0, 0, 'glow', {
      lifespan: { min: 200, max: 620 },
      speed: { min: 60, max: 330 },
      scale: { start: 0.2, end: 0 },
      alpha: { start: 0.9, end: 0 },
      blendMode: 'ADD', emitting: false
    }).setDepth(28);

    UI.room.textContent = 'Room ' + (this.levelIndex + 1) + ' / ' + SIM.LEVELS.length + ' · ' + this.L.name;
    UI.passNeed.textContent = this.L.passes;
    UI.passCur.textContent = '0';
    UI.hint.textContent = this.L.hint;
    UI.hint.style.opacity = '1';

    if (CANVAS_HUD) this.buildCanvasHud();
    this.bindInput();
    this.cameras.main.fadeIn(420, 4, 6, 9);
    layoutUi();
    setTimeout(layoutUi, 120);

    this.game.pausedUi = false;
    if (AUTO || CHAIN) { hidePanel(); }
    else this.showIntro();
  };

  Scene.prototype.buildCanvasHud = function () {
    var self = this;
    document.getElementById('ui').style.display = 'none';
    var F = 'Trebuchet MS, Helvetica, Arial, sans-serif';
    this.add.text(30, 26, 'ONE BULLET', { fontFamily: F, fontSize: '13px', color: '#6c8098' }).setDepth(50);
    this.chRoom = this.add.text(30, 46, '', { fontFamily: F, fontSize: '21px', color: '#eaf3ff' }).setDepth(50);
    this.chRoom.setText('ROOM ' + (this.levelIndex + 1) + ' / ' + SIM.LEVELS.length + ' \u00b7 ' + this.L.name.toUpperCase());
    this.chDodge = this.add.text(W - 30, 24, '0 / ' + this.L.passes, { fontFamily: F, fontSize: '24px', color: '#7ce8ff' }).setOrigin(1, 0).setDepth(50);
    this.add.text(W - 30, 54, 'DODGED', { fontFamily: F, fontSize: '10px', color: '#6c8098' }).setOrigin(1, 0).setDepth(50);

    this.chBarBg = this.add.rectangle(W / 2, H - 96, W - 60, 5, 0xffffff, 0.1).setDepth(50);
    this.chBar = this.add.rectangle(30, H - 96, W - 60, 5, 0x7ce8ff, 0.95).setOrigin(0, 0.5).setDepth(51);
    this.add.text(30, H - 82, 'SLIP', { fontFamily: F, fontSize: '10px', color: '#6c8098' }).setDepth(50);
    this.chHint = this.add.text(W / 2, H - 54, this.L.hint, {
      fontFamily: F, fontSize: '13px', color: '#9db0c4', align: 'center', wordWrap: { width: W - 100 }
    }).setOrigin(0.5, 0.5).setDepth(50);
    this.tweens.add({ targets: this.chHint, alpha: 0.15, delay: 7000, duration: 1500 });
  };

  Scene.prototype.makeTextures = function () {
    if (this.textures.exists('glow')) return;
    var g = this.textures.createCanvas('glow', 128, 128);
    var ctx = g.context;
    var grd = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, 'rgba(255,255,255,1)');
    grd.addColorStop(0.22, 'rgba(255,255,255,0.7)');
    grd.addColorStop(0.55, 'rgba(255,255,255,0.16)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grd; ctx.fillRect(0, 0, 128, 128); g.refresh();

    var v = this.textures.createCanvas('vig', W, H);
    var c3 = v.context;
    var vg = c3.createRadialGradient(W / 2, H * 0.46, H * 0.18, W / 2, H * 0.5, H * 0.82);
    vg.addColorStop(0, 'rgba(3,5,8,0)');
    vg.addColorStop(0.6, 'rgba(3,5,8,0.32)');
    vg.addColorStop(1, 'rgba(2,3,5,0.94)');
    c3.fillStyle = vg; c3.fillRect(0, 0, W, H); v.refresh();
  };

  Scene.prototype.buildBackdrop = function () {
    var bg = this.add.graphics().setDepth(0);
    bg.fillGradientStyle(0x080d13, 0x080d13, 0x04070a, 0x030507, 1);
    bg.fillRect(0, 0, W, H);

    var g = this.add.graphics().setDepth(1);
    g.lineStyle(1, COL.grid, 0.9);
    for (var x = 40; x < W; x += 40) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.strokePath(); }
    for (var y = 40; y < H; y += 40) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.strokePath(); }

    this.add.image(W / 2, 260, 'glow').setScale(7).setTint(0x10303f).setAlpha(0.22).setDepth(1);
    this.add.particles(0, 0, 'glow', {
      x: { min: 0, max: W }, y: { min: 0, max: H },
      lifespan: { min: 5000, max: 11000 },
      speedY: { min: -12, max: 5 }, speedX: { min: -6, max: 6 },
      scale: { min: 0.03, max: 0.09 },
      alpha: { start: 0, end: 0.3 },
      frequency: 240, quantity: 1, blendMode: 'ADD', tint: [0x7ce8ff, 0xffffff]
    }).setDepth(2);

    this.add.image(0, 0, 'vig').setOrigin(0).setDepth(40);
  };

  Scene.prototype.slab = function (g, r, fill, lip) {
    g.fillStyle(fill, 1);
    g.fillRoundedRect(r.x, r.y, r.w, r.h, 7);
    g.lineStyle(2, lip, 0.9);
    g.strokeRoundedRect(r.x, r.y, r.w, r.h, 7);
    g.lineStyle(1, 0xffffff, 0.07);
    g.beginPath(); g.moveTo(r.x + 6, r.y + 3.5); g.lineTo(r.x + r.w - 6, r.y + 3.5); g.strokePath();
  };

  Scene.prototype.buildArena = function () {
    var g = this.add.graphics().setDepth(6);
    g.lineStyle(3, 0x223d4d, 0.95);
    g.strokeRect(22, 22, W - 44, H - 210);
    g.lineStyle(1, COL.mint, 0.12);
    g.strokeRect(28, 28, W - 56, H - 222);
    for (var i = 0; i < this.L.walls.length; i++) this.slab(g, this.L.walls[i], COL.wall, COL.wallLip);

    // the rail the figure stands on
    g.lineStyle(2, 0x2a4256, 0.9);
    g.beginPath(); g.moveTo(SIM.CFG.RAIL_X0 - 30, SIM.CFG.RAIL_Y + 26); g.lineTo(SIM.CFG.RAIL_X1 + 30, SIM.CFG.RAIL_Y + 26); g.strokePath();
    g.lineStyle(1, COL.mint, 0.1);
    g.beginPath(); g.moveTo(SIM.CFG.RAIL_X0 - 30, SIM.CFG.RAIL_Y + 30); g.lineTo(SIM.CFG.RAIL_X1 + 30, SIM.CFG.RAIL_Y + 30); g.strokePath();
  };

  Scene.prototype.buildPlayer = function () {
    var p = this.s.player;
    this.player = this.add.container(p.x, p.y).setDepth(12);
    this.pGlow = this.add.image(0, -20, 'glow').setScale(1.5).setTint(0x7ce8ff).setAlpha(0.25).setBlendMode(Phaser.BlendModes.ADD);
    var body = this.add.graphics();
    body.fillStyle(0x0b1a24, 1);
    body.fillRoundedRect(-12, -26, 24, 36, 10);          // cloak
    body.fillStyle(0x143140, 1);
    body.fillRoundedRect(-11, -26, 22, 12, 8);
    body.fillStyle(0xdff6ff, 1);
    body.fillCircle(0, -33, 9);                          // head
    body.fillStyle(0x7ce8ff, 0.9);
    body.fillRoundedRect(-2.5, -22, 5, 14, 2);           // scarf
    this.player.add([this.pGlow, body]);
    this.pBody = body;
    this.tweens.add({ targets: this.pGlow, alpha: 0.45, scale: 1.8, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  };

  /* ------------------------------------------------------------ input */
  Scene.prototype.bindInput = function () {
    var self = this;
    var canvas = this.game.canvas;
    function toGame(ev) {
      var r = canvas.getBoundingClientRect();
      return { x: (ev.clientX - r.left) * (W / r.width), y: (ev.clientY - r.top) * (H / r.height) };
    }
    function down(ev) {
      self.sfx.init();
      if (self.s.status !== 'play') return;
      self.holding = true;
      self.targetX = toGame(ev).x;
      self.sfx.slipIn();
    }
    function move(ev) { if (self.holding) self.targetX = toGame(ev).x; }
    function up() { if (self.holding) { self.holding = false; self.sfx.slipOut(); } }
    canvas.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    this._unbind = function () {
      canvas.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  };

  /* ------------------------------------------------------------ loop */
  Scene.prototype.update = function (time, delta) {
    if (!this.s) return;
    var dt = Math.min(0.05, delta / 1000);
    if (this.s.status === 'play' && !this.done && !this.game.pausedUi) {
      var input = { holding: this.holding, targetX: this.targetX };
      if (AUTO || CHAIN) input = this.bot();
      SIM.step(this.s, dt, input);
      this.consume();
    }
    this.draw(dt);
  };

  /* demo autopilot: reads the aim lines and slips to the roomiest patch of rail */
  Scene.prototype.bot = function () {
    var s = this.s, p = s.player, ty = p.y - 26;
    var RAIL = [];
    for (var x = SIM.CFG.RAIL_X0; x <= SIM.CFG.RAIL_X1; x += 46) RAIL.push(x);

    function clearance(at) {
      var worst = 1e9;
      for (var i = 0; i < s.bullets.length; i++) {
        var b = s.bullets[i];
        if (!b.alive) continue;
        var minD = 1e9;
        for (var t = 0; t <= 0.55; t += 0.05) {
          var bx = b.x + b.vx * b.speed * t, by = b.y + b.vy * b.speed * t;
          if (bx < 0 || bx > W || by < 0 || by > H) break;
          var d = Math.hypot(bx - at, by - ty);
          if (d < minD) minD = d;
        }
        if (minD < worst) worst = minD;
      }
      return worst;
    }
    var cur = clearance(p.x);
    if (cur > 110) return { holding: false, targetX: p.x };
    var bestX = p.x, best = -1;
    for (var k = 0; k < RAIL.length; k++) { var c = clearance(RAIL[k]); if (c > best) { best = c; bestX = RAIL[k]; } }
    if (best <= cur) return { holding: false, targetX: p.x };
    return { holding: true, targetX: bestX };
  };

  Scene.prototype.consume = function () {
    var evs = this.s.events, self = this;
    for (var i = 0; i < evs.length; i++) {
      var e = evs[i];
      if (e.e === 'bounce') {
        this.sparks.setParticleTint(0xbfefff);
        this.sparks.explode(6, e.x, e.y);
        this.sfx.bounce();
      } else if (e.e === 'pass') {
        this.sfx.pass();
        UI.passCur.textContent = String(this.s.passes);
        this.ripple(this.s.player.x, this.s.player.y - 24);
      } else if (e.e === 'split') {
        this.sfx.split();
        this.sparks.setParticleTint(0xffb36b);
        this.sparks.explode(26, e.x, e.y);
        this.cameras.main.shake(120, 0.005);
      } else if (e.e === 'relaunch') {
        this.sparks.setParticleTint(0x7ce8ff);
        this.sparks.explode(10, 360, 140);
      } else if (e.e === 'hit') {
        this.sfx.hit();
        this.cameras.main.shake(320, 0.012);
        this.cameras.main.flash(260, 255, 70, 50);
        this.sparks.setParticleTint(0xff5f4a);
        this.sparks.explode(40, e.x, e.y);
        this.done = true;
        this.slowTint.setFillStyle(0xff3322, 0.35);
        this.time.delayedCall(900, function () { self.showFail(); });
      } else if (e.e === 'clear') {
        this.sfx.clear();
        this.cameras.main.flash(300, 200, 240, 255);
        this.done = true;
        if (CHAIN) {
          var last = this.levelIndex >= SIM.LEVELS.length - 1;
          this.chainLabel(last);
          this.time.delayedCall(2200, function () { if (!last) self.goTo(self.levelIndex + 1); });
          return;
        }
        this.time.delayedCall(700, function () { self.showClear(); });
      }
    }
    evs.length = 0;
  };

  Scene.prototype.chainLabel = function (last) {
    var F = 'Trebuchet MS, Helvetica, Arial, sans-serif';
    var t1 = this.add.text(W / 2, H / 2 - 20, last ? 'ALL ROOMS CLEAR' : 'ROOM ' + (this.levelIndex + 1) + ' CLEAR', {
      fontFamily: F, fontSize: '30px', color: '#eaf3ff', align: 'center'
    }).setOrigin(0.5).setDepth(60).setAlpha(0);
    var t2 = this.add.text(W / 2, H / 2 + 24, last ? 'one bullet, twelve rooms' : this.s.passes + ' dodged \u00b7 ' + this.s.bounces + ' ricochets', {
      fontFamily: F, fontSize: '15px', color: '#9db0c4'
    }).setOrigin(0.5).setDepth(60).setAlpha(0);
    this.tweens.add({ targets: [t1, t2], alpha: 1, duration: 260 });
  };

  Scene.prototype.ripple = function (x, y) {
    var self = this;
    var r = this.add.graphics().setDepth(27);
    r.lineStyle(2, 0x7ce8ff, 0.6);
    r.strokeCircle(x, y, 10);
    this.tweens.add({
      targets: r, alpha: 0, duration: 520,
      onUpdate: function (tw) { var p = tw.progress; r.clear(); r.lineStyle(2, 0x7ce8ff, 0.6 * (1 - p)); r.strokeCircle(x, y, 10 + p * 90); },
      onComplete: function () { r.destroy(); }
    });
  };

  /* ------------------------------------------------------------ draw */
  Scene.prototype.draw = function (dt) {
    var s = this.s, L = this.L, i;

    // movers
    this.gfxMovers.clear();
    if (L.movers) {
      var walls = SIM.liveWalls(s);
      var offset = walls.length - L.movers.length;
      for (i = 0; i < L.movers.length; i++) this.slab(this.gfxMovers, walls[offset + i], 0x122232, 0x3d6a86);
    }

    // aim lines
    var g = this.gfxLine;
    g.clear();
    var showLine = true;
    if (L.hideLineAfter != null && s.passes >= L.hideLineAfter) {
      showLine = (s.clock - s.lastLineAt) < 0.28;
    }
    for (i = 0; i < s.bullets.length; i++) {
      var b = s.bullets[i];
      if (!b.alive || !b.line) continue;
      if (!showLine) continue;
      var ln = b.line;
      var dx = ln.x2 - ln.x1, dy = ln.y2 - ln.y1;
      var len = Math.hypot(dx, dy);
      g.lineStyle(9, 0xff4a2a, 0.10);
      g.beginPath(); g.moveTo(ln.x1, ln.y1); g.lineTo(ln.x2, ln.y2); g.strokePath();
      g.lineStyle(2.4, 0xff8a6a, 0.85);
      g.beginPath(); g.moveTo(ln.x1, ln.y1); g.lineTo(ln.x2, ln.y2); g.strokePath();
      var n = Math.max(2, Math.floor(len / 26));
      for (var k = 0; k < n; k++) {
        var t = k / n;
        g.fillStyle(0xffd0bc, 0.9);
        g.fillCircle(ln.x1 + dx * t, ln.y1 + dy * t, 2.1);
      }
      g.lineStyle(2, 0xff7a5f, 0.85);
      g.strokeCircle(ln.x2, ln.y2, 11);
      g.lineStyle(1.4, 0xff7a5f, 0.55);
      g.strokeCircle(ln.x2, ln.y2, 5);
    }

    // bullets
    var bg = this.gfxBullet;
    bg.clear();
    for (i = 0; i < s.bullets.length; i++) {
      var bb = s.bullets[i];
      if (!bb.alive) { this.trails[i] = []; continue; }
      var tr = this.trails[i] || (this.trails[i] = []);
      tr.push({ x: bb.x, y: bb.y });
      if (tr.length > 16) tr.shift();
      for (var t2 = 0; t2 < tr.length; t2++) {
        var a = (t2 / tr.length);
        bg.fillStyle(0xffd7a8, 0.32 * a);
        bg.fillCircle(tr[t2].x, tr[t2].y, 1.5 + 5.5 * a);
      }
      bg.fillStyle(COL.warm, 0.32);
      bg.fillCircle(bb.x, bb.y, 17);
      bg.fillStyle(0x2a1408, 1);
      bg.fillCircle(bb.x, bb.y, 8);
      bg.fillStyle(0xfffdf6, 1);
      bg.fillCircle(bb.x, bb.y, 5.6);
    }

    // player
    this.player.x = s.player.x;
    this.pBody.x = 0;
    if (s.player.moving) {
      this.pBody.scaleX = 1 + 0.04 * Math.sin(this.time.now / 60);
      this.player.y = s.player.y + Math.abs(Math.sin(this.time.now / 90)) * -2;
    } else {
      this.pBody.scaleX = 1;
      this.player.y = s.player.y;
    }

    // slow motion tint
    if (this.done && s.status === 'hit') {
      this.slowTint.setFillStyle(0xff3322, 0.25);
    } else {
      this.slowTint.setFillStyle(0x3fb6d8, 0.10 * s.slow);
    }

    if (this.chBar) {
      this.chBar.width = Math.max(1, (W - 60) * Math.max(0, s.focus / s.maxFocus));
      this.chDodge.setText(s.passes + ' / ' + this.L.passes);
      this.chBar.fillColor = (s.focus / s.maxFocus) < 0.3 ? 0xff8a5c : 0x7ce8ff;
    }

    // focus
    var pct = Math.max(0, s.focus / s.maxFocus);
    UI.focusFill.style.width = (pct * 100).toFixed(1) + '%';
    UI.focusPct.textContent = Math.round(pct * 100) + '%';
    UI.focusFill.className = 'focusfill' + (pct < 0.3 ? ' low' : '');

    // remember when a line was last drawn (for blind rooms)
    var latest = 0;
    for (i = 0; i < s.bullets.length; i++) if (s.bullets[i].lineAt > latest) latest = s.bullets[i].lineAt;
    s.lastLineAt = latest;
  };

  /* ------------------------------------------------------------ panels */
  Scene.prototype.showIntro = function () {
    var self = this;
    showPanel({
      eyebrow: 'ONE BULLET',
      title: 'It never stops',
      sub: 'One bullet, ' + SIM.LEVELS.length + ' rooms. Hold anywhere to slip into bullet time \u2014 the world crawls, you can move, and the slip costs focus. Get off the red line before it arrives.',
      stat: 'HOLD TO SLIP · DRAG TO MOVE · RELEASE',
      button: 'STEP IN'
    });
    panelHandler = function () { hidePanel(); self.sfx.init(); };
  };

  Scene.prototype.showClear = function () {
    var self = this;
    var last = this.levelIndex >= SIM.LEVELS.length - 1;
    showPanel({
      eyebrow: last ? 'ALL ROOMS' : 'ROOM ' + (this.levelIndex + 1) + ' CLEAR',
      title: last ? 'You are still standing' : this.L.name + ' clear',
      sub: last ? 'Twelve rooms, one bullet, and it never touched you.' : 'It came at you ' + this.s.passes + ' times.',
      stat: this.s.bounces + ' RICOCHETS · ' + Math.round((this.s.focus / this.s.maxFocus) * 100) + '% SLIP LEFT',
      button: last ? 'PLAY AGAIN' : 'NEXT ROOM',
      onButton: function () { self.goTo(last ? 0 : self.levelIndex + 1); }
    });
  };

  Scene.prototype.showFail = function () {
    var self = this;
    showPanel({
      eyebrow: 'HIT',
      title: 'It found you',
      sub: 'You dodged ' + this.s.passes + ' of ' + this.L.passes + '. Hold later \u2014 wait until the red line is drawn, then slip.',
      stat: '',
      button: 'TRY AGAIN',
      ghost: 'BACK A ROOM',
      onButton: function () { self.goTo(self.levelIndex); },
      onGhost: function () { self.goTo(Math.max(0, self.levelIndex - 1)); }
    });
  };

  Scene.prototype.goTo = function (idx) {
    var self = this;
    hidePanel();
    this.done = true;
    this.cameras.main.fadeOut(240, 3, 5, 8);
    this.cameras.main.once('camerafadeoutcomplete', function () {
      if (self._unbind) self._unbind();
      self.scene.restart({ level: idx });
    });
  };

  var config = {
    type: Phaser.AUTO,
    parent: 'game',
    width: W, height: H,
    backgroundColor: '#05070a',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    render: { antialias: true, powerPreference: 'low-power' },
    scene: [Scene]
  };

  window.GAME = new Phaser.Game(config);
  setTimeout(layoutUi, 200);
})();
