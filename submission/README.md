# One Bullet

**Practical assignment — AI + Game Development**

A one-thumb action game for mobile. One bullet, twelve rooms, and the bullet never stops: it ricochets around the room and re-aims at you on every bounce. Hold the screen to drop into bullet time, slide the figure off the red line it is travelling along, and survive until its momentum runs out.

---

## 1. Game concept and brief explanation

**The idea in one line:** every bullet-hell game gives you a gun. This one gives you the bullet — as the enemy — and one thumb to stay alive with.

You are a small figure on a rail at the bottom of a sealed room. A single bullet is fired into the room and it does not stop: it bounces off the walls, and every time it hits one, it re-aims at wherever you are standing. A red line shows exactly where it is going next. To not be there, you **hold** the screen: the world drops to 13% speed, the figure can move, and a slip meter drains while you hold. Let go and time snaps back with the bullet already in the air.

Everything else in the game is the same rule with a sharper edge: a room where the bullet splits in two on its second wall, a room where it curves toward you in the air, a room where the red line goes dark after two dodges, a room with two bullets out of phase, a room where the bullet gets 4.5% faster on every bounce and you get seven dodges to survive.

**Why this concept.** Three reasons, all from the research below:

1. Mobile is a thumb, and most action games pretend it is a gamepad. This one has exactly one input — press and hold — and one decision — when to press it.
2. The timing decision is the whole game, and it is *legible*: the red line tells you the future, so a new player understands the stakes in three seconds and still has to earn the dodge.
3. The fantasy is borrowed from cinema (the slow-motion sidestep), not from another mobile game. There is nothing in the top charts that gives you that moment with one thumb.

**Core loop.** Bullet bounces → the line is drawn → wait, wait, hold → time crawls, the figure slides → the bullet passes through where you were → release, recharge, repeat.

**Rules.** Hold anywhere to slip (costs focus); drag to move while slipping; release to return to real time. One hit ends the room. Surviving the room's dodge count clears it.

**Target player.** 16–35, plays in 2–5 minute sessions, likes skill games but not twin-stick shooters; the player who replays a room until the dodge lands. Sessions: 30 seconds to 3 minutes per room, ~6 minutes for a clean run of the twelve.

---

## 2. Research and analysis of reference games

Three games, chosen to cover the three business models on the store: the download monster, the hybrid-casual earner, and the premium port. Each listing was opened in a live browser session and read in full — rating, install count, price, feature copy and the first page of reviews.

| Game | Store facts | Model |
|---|---|---|
| **Block Blast!** (Hungry Studio) — [listing](https://play.google.com/store/apps/details?id=com.block.juggle) | 4.8★, 5.97M reviews, **1B+ installs** | Free, ads + IAP |
| **Color Block Jam** (Rollic) — [listing](https://play.google.com/store/apps/details?id=com.GybeGames.ColorBlockJam) | 4.1★, 360K reviews, **10M+ installs** | Free, ads + IAP |
| **Balatro** (Playstack) — [listing](https://play.google.com/store/apps/details?id=com.playstack.balatro.android) | 4.7★, 29.1K reviews, **1M+ installs, $9.99** | Premium |

**Block Blast!** — 8×8 grid, drag blocks, clear lines, beat your score. Offline, no timer, no fail state; the listing sells "relaxing", "single player", "easy to play, challenging to master". It was the most downloaded mobile game of 2025 (~368M installs per AppMagic). Reviews split exactly where you would expect: five stars for the calm loop, one star for the ads and the suspicion that the difficulty bends toward the ad break.

*What works:* a three-second rule explanation and a session you can leave at any moment.
*The opening:* the friction is the business model, not the design.

**Color Block Jam** — slide coloured blocks to matching doors against a timer, with boosters and a fail offer. Rollic's own post-mortem credits a "clean visual style and smooth gameplay feel"; the market backs it ($33M IAP in Q3 2025, 18.6M downloads that quarter). At 4.1 stars, the recurring complaint is that pieces sometimes need several taps before they move: *touch feel* is what costs it the fifth star.

*What works:* one-thumb dragging, colour as the only instruction, difficulty taught by doing.
*The opening:* "smooth feel" is a feature, and most games in the category do not treat it as one.

**Balatro** — poker roguelike deckbuilder, $9.99, no ads, 4.7 stars, and the copy leads with "remastered controls for touch screen devices": a premium game that took the phone seriously instead of shrinking a PC interface.

*What works:* one verb (play a hand) hiding enormous depth, and respect for the player's time.
*The opening:* there is a paying audience for a small, sharp, premium-feeling mobile game.

**What the three say together.** The download leaders are free, silent and playable in a queue; the premium survivor is small, strange and confident. Both win on one clear verb and a screen that explains itself in three seconds — and neither wins on volume of content. **One Bullet is aimed at that intersection: one verb (hold), legible in a screenshot, with the feel of a premium arcade game.**

---

## 3. AppMagic research findings

From AppMagic's published 2025 reports (the platform is a paid subscription; these are their figures, not mine):

- **Casual is flat in money, growing in players.** ~**$21B** IAP, flat year on year, while downloads grew **+8%** (up from +6.4% in 2024). More installs, same revenue.
- **Puzzle is the only top-three casual genre still growing**: **$8.2B (+7.6%)** revenue, **+9.9%** downloads. Casino $6.9B (−7.6%), Simulation $1.9B (−4.8%).
- **Inside puzzle the sub-genres move fast**: Match-3 $4.8B (−0.1%); **Merge $1.4B (+80%)**; sort and screw puzzles roughly doubled since 2024; **block puzzles 10× year-on-year** IAP growth.
- **Hybrid-casual is where growth lives**: the top 10 hybrid-casual titles grew **+114% YoY** in Q3 2025, and **puzzle is over 60%** of hybrid-casual revenue (up from 50% the quarter before). Color Block Jam alone took **$33M in one quarter**; its studio went from **$87M to $207.5M** of IAP across 2025.
- **Retention is quietly falling** while event calendars get denser (D14–D30 down 3.5–5.4%, D365 down 8–13%). More events did not buy loyalty.

**What it means for this concept.** (1) Puzzle is the safe harbour, but the category is oversupplied with timed, ad-choked sorting games — so the differentiation has to be the *interaction*, not the theme or the level count. (2) Hybrid-casual economics reward a clean core loop over a content treadmill, which is exactly what a one-input arcade game is. (3) Falling retention is a warning against bolting a meta onto a thin core: **One Bullet ships a core, not a meta** — twelve rooms, one rule, no currencies.

---

## 4. Art direction and visual references

**Theme.** A blueprint at night. The room is drawn as if it were an engineering drawing that someone turned the lights off in.

**Palette.** Room `#080d13 → #03050a` (ink, never pure black, so silhouettes have somewhere to sit). You and time: **cyan** `#7ce8ff`. The bullet: **hot amber** `#ffb36b`. The danger line: **red-orange** `#ff8a6a` — the only red in the frame, so it reads before you have read anything.

**Shape language.** The room is rectangles and right angles; the figure is the only soft shape in the frame (a hooded silhouette with a white head), and the bullet is the only thing with a trail. Movement is the only animation that matters, so the art stays still and lets motion carry the screen.

**Light.** No sprites, no post-processing. Glow is faked with layered additive radial gradients and wide, low-alpha strokes — it holds up at phone brightness and costs nothing on a mid-range GPU. Bullet time is a colour event: a cold wash over the frame, the ambient dust slowing with the world.

**Motion.** Everything in bullet time is a slow drift; everything out of it is a snap. The dodge has a two-frame lean, the bullet has a 16-frame trail, and the line always appears one beat before the danger.

**References.** *SUPERHOT* for making slowness itself the mechanic; Housemarque's *Resogun* and *Nex Machina* for neon-on-black readability at speed; *INSIDE* and *Limbo* for silhouette and restraint; classic one-hit arcade games (*Geometry Wars*, *Downwell*) for the "one mistake and the room restarts" tension.

**Why it is drawn in code.** AI image generation is the weakest link in AI game production right now: style drift between assets, resolution that will not scale, and unclear provenance in a submission that has to declare licences. Procedural vector art solves all three — one file, any resolution, zero third-party art — and it lets the art direction be changed by editing numbers instead of regenerating pictures.

---

## 5. Playable prototype / hosted link

**https://anushreeanu035.github.io/one-bullet/** — opens in any phone browser, portrait, touch, no install, no login. It runs offline as a single HTML file too.

---

## 6. Source code / repository

**https://github.com/anushreeanu035/one-bullet** — `sim.js` (gameplay), `main.js` (renderer/input), `OneBullet.html` (single-file build), `test/bot.js` (headless playtest), `build.py`.

---

## 7. Gameplay demonstration video

`One Bullet - rooms 9 to 12.mp4` — 41 seconds, rooms 9 to 12 played by the test bot, ending on the all-clear: the twin-bullet room, the gauntlet, the core, and the final room with every rule at once.

---

## 8. AI tools and workflow (disclosure)

| Stage | Tool | What it did | What I did |
|---|---|---|---|
| Market research | AI agent (web search + a live browser session) | Pulled AppMagic's published 2025 reports, opened the three store listings, captured ratings, installs, pricing and review sentiment | Chose the three games, checked every figure against the live page, decided what mattered |
| Concept | LLM brainstorming + my play | Generated ~10 one-thumb mechanics (sonar, tether, cut, gravity, dodge) | Picked the dodge, and rejected two earlier concepts after playing them |
| Code | AI coding agent + Phaser 3.80 | Wrote the simulation, renderer, input, audio, build and test harness | Specified the architecture (pure sim + thin renderer), reviewed every function, tuned all numbers by playing |
| Difficulty | AI-generated bot | Plays all twelve rooms headlessly and reports dodges, ricochets, time and slip left | Set the pass counts and speeds so the bot clears every room with a visible margin |
| Art | **no image generator** | Procedural Phaser Graphics and generated canvas textures | Palette, shape language, glow pass, the single-red rule |
| Audio | Procedural WebAudio | Oscillator envelopes for slip-in, bounce, split, hit, clear | Chose intervals and mix |
| Video | Canvas capture + ffmpeg | Recorded the canvas via MediaRecorder, encoded to H.264 | Drove the run, trimmed it, checked every frame |
| Documentation | LLM drafting | Structure and first draft of this document | Every number and claim checked against the build |

**Tools by name:** the GenTeam Spark agent (research, code generation, analysis), Phaser 3.80.1 (framework), Node.js (headless bot), Chrome (device and performance testing), ffmpeg (video). No third-party art, audio, fonts or code other than Phaser (MIT).

**And what that means honestly:** the AI did not design this game. It removed the cost of *building* it, which is where the days would otherwise have gone. The design calls — one input, no twin-stick, one bullet instead of waves, one hit instead of health, twelve rooms instead of fifty — were made by playing, failing, and changing one number at a time.

---

## 9. Five additional future concepts

1. **Echo Moth** — a pitch-black cave; drag to fly, tap to pulse sonar, and the room exists for one second after every pulse. Memory and nerve instead of reaction.
2. **Two-Step** — a rhythm stealth game for two thumbs: each thumb is a footstep, and every step off the beat is heard.
3. **Windward** — draw the wind with a finger; boats, seeds and kites ride the currents you scribble. The same idea as this game — your line is the material — with momentum.
4. **Postbox** — sort a village's letters by the stories inside them; each letter is a small narrative puzzle and the village wakes up as a meta.
5. **Grow Room** — an idle greenhouse where the shape you prune becomes the machine that produces resources.

**Priority: Echo Moth.** It shares this game's whole interaction philosophy (one thumb, one material, calm pressure), reuses the codebase almost entirely, and has the strongest six-second ad moment of the five: a tap, a ring of sound, and a world appearing out of the dark.

**How AI helps on these:** procedural level generation plus an automated playability check — the same headless bot used here, dropped into a search loop — can generate and filter thousands of small rooms for solvability before a human sees them. For Echo Moth specifically, AI can grade sonar "readability" — how much of a room one pulse reveals — which is otherwise tuned by eye.

---

## 10. Screenshots

Six attached: title, room 1 mid-dodge, room 3, the twin-bullet room, the final room, and the room-clear screen. They are also in the repository under `screenshots/`.

---

## 11. Challenges faced, and improvements made

**1. The dodge window is invisible until it is tuned.** The first build had the slip moving the figure in *game* time, so a single dodge burned 1.3 seconds of a 2-second meter — players ran out of focus before the bullet arrived. Fixed by making the slip real-time: the meter now pays for the decision, not the distance.

**2. The bullet could trap itself.** If it landed in a pocket between walls it would ping-pong in place, never threatening, and the room could not be finished. Fixed twice: it only re-aims when it has a clear line to you (otherwise it keeps its natural ricochet), and a deterministic relaunch puts a stuck bullet back in the air.

**3. A split could drop a bullet inside a wall**, where it rattled at sixty bounces a second. Fixed with an unstick pass that pushes it out through the nearest face.

**4. My buttons were dead on a phone.** The first build drew its buttons inside the canvas; a tap that missed the drawn shape did nothing and read as a broken game. Every panel and every button in this build is a real HTML element over the canvas.

**5. The game ran while its own menus were open** — you could be hit while reading the intro. Fixed with an explicit pause gate behind the panels.

**6. The red line was too quiet on a phone.** It was a dotted line at 55% opacity; at arm's length it vanished. Now it is a glow stroke plus a solid core plus centre dots, and it is the only red in the frame.

**7. Shallow shots could not be dodged** on a one-axis rail, which is unfair. Aiming now requires a clear line, and every attack comes at you at a workable angle.

**With more days I would:** add 3–5 rooms with a second rule interacting (a bullet that splits only when you slip), put the dodge window on a tuning curve shown to playtesters, package it properly (Capacitor or a PWA with a manifest), and instrument the first failure point per room — I expect room 11 to be the cliff.

**What I would keep:** one input, one bullet, one hit, twelve rooms. Those four decisions are the game.

---

*Everything above was built, tested and shipped in one working session. The prototype is the point — open it and play it before reading the rest.*
