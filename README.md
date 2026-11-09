# PlayGround

<!-- omgithub:readme:start -->
## 🚀 Build, play, and remix with OMGithub

**Created using [OMGithub.com](https://go.ondev.store/).**

[![OMGithub](https://img.shields.io/badge/OMGithub-Open%20project-orange?style=for-the-badge)](https://go.ondev.store/Dr-sOuL7/PlayGround)
[![GitHub](https://img.shields.io/badge/GitHub-Source-181717?logo=github&style=for-the-badge)](https://github.com/Dr-sOuL7/PlayGround)

- 🎮 [Open the project](https://go.ondev.store/Dr-sOuL7/PlayGround).
- ✨ [Remix this project](https://go.ondev.store/Dr-sOuL7/PlayGround?remix=1).
- 💻 [Explore the source](https://github.com/Dr-sOuL7/PlayGround).
- 🛠️ [Check build runs](https://github.com/Dr-sOuL7/PlayGround/actions).
- 🐛 [Report an issue](https://github.com/Dr-sOuL7/PlayGround/issues).
- 👤 [Explore the creator's projects](https://go.ondev.store/Dr-sOuL7).
- 🌍 [Create with OMGithub](https://go.ondev.store/).
<!-- omgithub:readme:end -->

## Spin//Forge

A standalone, browser-playable Beyblade-inspired forge and arena. Build combinations from four parts, then battle an AI rival with simultaneous hidden actions and deterministic seeded combat.

### Run locally

Requires Node.js 20+ for the tests and Python 3 for the static web server. From the project root:

```sh
python3 -m http.server 3002
```

Open <http://localhost:3002>. No package installation or build step is required. To stop the server, press `Ctrl+C`.

### Tests

```sh
node --test engine.test.mjs
node --check app.js
node --check engine.mjs
```

The engine test suite validates all 7,680 part combinations, stat-pair conservation, invalid actions and special-meter requirements, and repeated/adaptive strategy match simulations.

### Gameplay notes

- Cores change appearance and identity only; combat stats come from the blade, disc, and tip.
- Stat pairs are conserved: AP + LI = 80, MS + ST = 100, and MB + SM = 100.
- The forge classifies type deterministically from the assembled stats. In the arena, both fighters choose simultaneously; the rival's move is hidden until resolution.
- Combat has controlled seeded randomness. It is an abstract strategy simulation, not a real-time physics model.
- Saved builds use this browser's local storage; they are not synced between devices.

### Telegram integration boundary

This repository currently contains only the standalone browser game. It does not include a Telegram bot, server-side match authority, database, or deployment configuration. A Telegram release still needs a bot token and deployment target, plus server-side challenge and private-action flows, persisted player/build/match state, turn deadlines, and concurrency/idempotency protections. Keep the token in deployment secrets; never put it in browser code or commit it to the repository.
