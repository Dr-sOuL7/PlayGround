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

## BEYBLADE: ARENA

A responsive, browser-playable local PvP prototype. Build a Bey from cosmetic cores and stat-trading parts, then play a hidden-action pass-and-play match with a second player on the same device.

### Run locally

Requires Node.js 18 or newer. No package installation is needed.

```sh
npm run dev
```

Open the local URL printed by the server (by default, `http://127.0.0.1:3002`). Run the combat and content tests with:

```sh
npm test
```

### Prototype status

The playable scope includes the workshop, 15 cosmetic cores, 8 blades, 8 discs, 8 tips, local storage for builds/history, five combat actions, seeded combat resolution, battle finishes, and a result screen. It does not include accounts, cloud saves, online PvP, matchmaking, spectators, AI, or production rankings. Combat formulas are provisional because the source brief did not specify canonical math; no rarity-based or core-based stat advantages are used.

See [the architecture, provisional combat math audit, and roadmap](docs/architecture.md) for implementation details, assumptions, validation, and next steps.
