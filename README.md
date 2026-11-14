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

## sOuLsSPIN prototype

A browser-based 3D Beyblade-style battle prototype built with Three.js. It runs as a static site; no package installation or build step is required.

### Run locally

From the project directory, start a static HTTP server:

```sh
python3 -m http.server 4173
```

Then open <http://localhost:4173>. The app loads Three.js from jsDelivr and fonts from Google Fonts, so those resources need network access. Opening `index.html` directly with `file://` is not supported because the game uses JavaScript modules.

### Play

- Launch with **LAUNCH BEYS** or **Space**. Each round alternates 10 seconds of autonomous physics and 10 seconds of manual control.
- Steer with the on-screen joystick, **WASD**, or the arrow keys. Use **Shift** for DASH or **E** for TILT; only one special action is available per manual phase.
- Activate the equipped Core Avatar with **Q** during a manual phase when Burst Health is at 50% or less. It can be used once per round.
- Scores: Ring Out = 2, Spin Finish = 1, Burst Finish = 3. The first pilot to 5 points wins the match.
- Choose Top, Side, or POV cameras. The Workshop lets you equip a Core, Blade, Disc, and Tip; their properties affect spin reserve, burst reserve, mass, inertia, grip, drag, acceleration, and impact power.
- Rival personality changes its steering behavior. Difficulty changes steering pressure, not hidden combat stats.

### Scope and limitations

This is a local 1v1 prototype, not a fully calibrated or hardware-validated physics simulation. The collision, spin-loss, burst-damage, and component effects are intentionally lightweight gameplay models. Teams and round-robin buttons are format placeholders that currently keep the local 1v1 battle active. Records and progression are not persisted, multiplayer is not implemented, and cosmetic-only unlocks are future work. Bot settings and builds live only for the current page session.

### Validation artifact

A compact JPEG capture at 1024×768 is saved at [`screenshots/soulsspin.jpg`](screenshots/soulsspin.jpg).
