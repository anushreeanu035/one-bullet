#!/usr/bin/env node
/* Headless playtest: a bot that reads each bullet's aim line, holds when a shot is about to
   arrive and slides to the roomiest patch of rail. Run: node test/bot.js [roomNumber] */
'use strict';

var SIM = require('../sim.js');
var RAIL = [];
for (var x = SIM.CFG.RAIL_X0; x <= SIM.CFG.RAIL_X1; x += 46) RAIL.push(x);
var PY = SIM.CFG.RAIL_Y - 26;

function clearance(s, at) {
  var worst = 1e9;
  for (var i = 0; i < s.bullets.length; i++) {
    var b = s.bullets[i];
    if (!b.alive) continue;
    var minD = 1e9;
    for (var t = 0; t <= 0.55; t += 0.05) {
      var bx = b.x + b.vx * b.speed * t, by = b.y + b.vy * b.speed * t;
      if (bx < 0 || bx > 720 || by < 0 || by > 1280) break;
      var d = Math.hypot(bx - at, by - PY);
      if (d < minD) minD = d;
    }
    if (minD < worst) worst = minD;
  }
  return worst;
}

function bot(s) {
  var cur = clearance(s, s.player.x);
  if (cur > 110) return { holding: false, targetX: s.player.x };
  var bestX = s.player.x, best = -1;
  for (var i = 0; i < RAIL.length; i++) {
    var c = clearance(s, RAIL[i]);
    if (c > best) { best = c; bestX = RAIL[i]; }
  }
  if (best <= cur) return { holding: false, targetX: s.player.x };
  return { holding: true, targetX: bestX };
}

function play(i) {
  var s = SIM.createState(i), dt = 1 / 60, f = 0;
  while (s.status === 'play' && f++ < 60 * 240) SIM.step(s, dt, bot(s));
  return {
    room: i + 1, name: s.L.name, result: s.status,
    dodges: s.passes + '/' + s.L.passes, ricochets: s.bounces,
    seconds: +(f / 60).toFixed(1), slipLeft: +(s.focus / s.maxFocus * 100).toFixed(0) + '%'
  };
}

var only = process.argv[2] ? parseInt(process.argv[2], 10) - 1 : null;
var start = only == null ? 0 : only, end = only == null ? SIM.LEVELS.length : only + 1;
var fails = 0;
for (var i = start; i < end; i++) {
  var r = play(i);
  if (r.result !== 'clear') fails++;
  console.log([r.room, r.name, r.result, r.dodges, r.ricochets + ' ricochets',
    r.seconds + 's', r.slipLeft].join('  ·  '));
}
console.log(fails ? fails + ' room(s) not cleared' : 'all rooms cleared');
process.exit(fails ? 1 : 0);
