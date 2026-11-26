# One Bullet — source

One bullet that never stops, twelve rooms, one thumb. Hold to slip into bullet time, spend
focus, get off the red line before the bullet arrives.

Phaser 3.80.1. No external assets, no network. Play it by opening `OneBullet.html`.

Six screenshots are in `screenshots/`, and `media-rooms-9-12.mp4` is a 41-second run through
rooms 9 to 12 played by the test bot.

## Run it

- **Simplest:** open `OneBullet.html` — the whole game in one file, Phaser inlined, works offline.
- **Develop:** serve this folder (`python3 -m http.server 8000`) and open `index.html`.
- **Rebuild the single file:** `python3 build.py` (writes `OneBullet.html`).

## Structure

```
index.html          entry + HTML overlay UI (real buttons, never canvas-drawn)
sim.js              pure gameplay: rooms, ricochet, aim, focus economy, passes, splits
main.js             Phaser scene: room, figure, bullets, aim lines, effects, panels
build.py            inlines phaser.min.js + sim.js + main.js into OneBullet.html
test/bot.js         headless bot: plays all twelve rooms, reports clears (run it with node)
```

`sim.js` has no engine in it. `SIM.step(state, dt, {holding, targetX})` is the whole game: the
bullet's ricochet, its aim at you at every bounce, the focus economy and the pass counter. The
renderer only draws the state.

## Controls

- **Hold anywhere** — bullet time: the world drops to 13% speed and the figure can move; it costs
  focus while held.
- **Drag while holding** — the figure follows your thumb along the rail.
- **Release** — back to real time; the slip recharges.

The bullet re-aims at you on every wall it touches. The red line is that aim. You dodge by
leaving the line after it is drawn.

## Rooms

Twelve, each one adding a rule: walls, a faster bullet, a split, a tight focus budget, a curving
bullet, a moving gate, a hidden aim line, two bullets out of phase, and combinations of those.

## Verify it is winnable

```bash
node test/bot.js
```

The bot holds when a bullet is about to arrive and picks the roomiest patch of rail. All twelve
rooms clear. Current run times: 5–14 s for most, 20 s for the long chaser in room 2.

## URL parameters (demo / testing)

- `?auto=1` — the bot plays
- `?level=7` — start on a room (1–12)

## Licences

Phaser 3.80.1 (MIT) is bundled. All other code, art, animation and audio is original and drawn
procedurally at runtime. No third-party art, audio or fonts.
