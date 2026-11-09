# BEYBLADE: ARENA — prototype architecture and rules audit

## Scope and implementation choices

This repository is a browser-first, dependency-free local prototype. It deliberately does not implement accounts, a database, online matchmaking, or server-authoritative PvP. The installed project is the OMGithub PlayGround project, not a CCGS template; CCGS-specific native commands and agents are not available in this repository. For the first playable milestone, the implementation uses browser-native HTML, CSS, ES modules, and a small Node.js HTTP server rather than introducing a framework or build system.

The prototype is intended to validate the build loop, simultaneous hidden-action flow, basic combat pacing, and presentation. It is not a canonical Beyblade rules implementation or an online-ready game service.

## System map

- `index.html` is the accessible document shell and loads the stylesheet and application module.
- `styles.css` provides the responsive desktop/mobile layouts and component states.
- `app.js` owns rendering, navigation, local storage, build management, and the pass-and-play interaction. Player two's action is hidden until the device is handed over; this is a local privacy affordance, not secure secrecy.
- `engine.js` is UI-independent. It defines the component catalog, derives build stats, creates a seeded match state, and resolves a pair of actions as one turn. It has no DOM, storage, network, or framework dependencies.
- `engine.test.js` tests inventory invariants and important combat guarantees using Node's built-in test runner.
- `server.mjs` serves static project files locally. The server is not a game API and does not authenticate or persist player data.
- `package.json` exposes `npm run dev`, `npm start`, and `npm test`; there are no runtime or development dependencies.

### State and turn boundary

A build is a plain data object. `createBattle()` copies two builds into fighter state with energy, stability, ring position, momentum, defense fatigue, dodge decay, initiative, adaptation, cooldown, and burst count. `resolveTurn(state, actionA, actionB)` validates both actions before mutating state, resolves both choices against the same turn, appends a log entry, and marks a finish when one of the conditions is met. A seeded linear-congruential generator makes a match reproducible for a given initial seed and action sequence. The UI presents the engine output; it does not calculate combat outcomes itself.

## Build system and content

The catalog contains 15 cosmetic cores, 8 blades, 8 discs, and 8 tips: `15 × 8 × 8 × 8 = 7,680` possible component combinations. Cores supply name and color only. Each blade, disc, and tip trades points between paired attributes (`ap/li`, `ms/st`, and `mb/sm`) so its pair total is conserved.

`makeBuild()` combines component values into five displayed stats—attack, defense, mobility, stamina, and balance—using the provisional weighted equations below. Each stat is clamped to 20–80 and rounded to one decimal place. The build type uses the strongest stat: a strongest balance stat, or a highest stat below 55, is classified as `Balanced`; otherwise it is classified by the winning attack, defense, mobility, or stamina stat. Ties follow the declared stat order in the engine. Cosmetic core selection cannot change stats or type.

With blade values `ap/li`, disc values `ms/st`, and tip values `mb/sm`:

```text
attack   = clamp(50 + (ap - 40) × 0.62 + (mb - 50) × 0.18, 20, 80)
defense  = clamp(50 + (li - 40) × 0.34 + (st - 50) × 0.34 + (sm - 50) × 0.22, 20, 80)
mobility = clamp(50 + (mb - 50) × 0.47 + (ms - 50) × 0.16 + (ap - 40) × 0.12, 20, 80)
stamina  = clamp(50 + (st - 50) × 0.43 + (sm - 50) × 0.33 + (li - 40) × 0.14, 20, 80)
balance  = clamp(50 + (li - 40) × 0.18 + (ms - 50) × 0.25 + (sm - 50) × 0.26, 20, 80)
```

## Provisional combat math audit

The original specification named actions and finishes but did not define canonical stat mappings, probabilities, damage equations, resource costs, or turn order. The numbers below are therefore explicit prototype tuning values, not verified or official formulae. Treat balancing and any competitive claims as out of scope until the rules are agreed and the values are playtested.

| Mechanic | Current prototype rule | Bounds / audit note |
| --- | --- | --- |
| Randomness | Seeded 32-bit LCG; each draw is in `[0, 1)` | Reproducible, not cryptographic. Suitable for local tests, not by itself a trusted online RNG. |
| Initiative | `mobility + momentum` is compared and the result is stored; fighter 0 is marked on ties | The current resolver still processes fighters in array order (fighter 0 then fighter 1); the initiative flag does not currently change collision order. |
| Attack collision | Base 0.57; special base 0.68; adjusted by mobility, momentum, position, dodge, and dodge decay | Clamped to 0.08–0.94. A miss deals no impact. |
| Attack power | `(attack × 0.42 + 25 + momentum × 14)`; special multiplies by 1.55; switching away from the previous action adds 6% adaptation | Adaptation is deterministic and bounded; repeating the same action does not earn this bonus, and there is no unbounded combo multiplier. |
| Guard / evade | Defend adds `defense × 0.42 + 18 + fatigue × 22`; otherwise guard is `defense × 0.12 + 7`. Dodge evade uses `mobility × 0.19 + dodgeDecay × 18` | These subtract from attack before impact; the impact floor prevents a successful collision from doing zero damage. |
| Impact | Remaining attack is multiplied by a seeded factor from 0.70 to under 1.08 | Clamped to 2–64. The random multiplier is intentionally visible for auditability. |
| Stability / energy damage | Stability damage scales with impact and missing stability; energy damage is 20% of impact, or 34% for a special | Stability damage clamped to 1–55; resources clamped to 0–100. |
| Ring pressure | Based on attack-vs-defense difference and impact, plus small seeded positional variance | Position clamped to 0–105; reaching 100 causes ring-out resolution. |
| Burst | Chance starts at 1.5%, rises with lost stability and impact above 32 | Clamped to 0–22%; stability reaching zero bursts deterministically. |
| Action economy | Charge restores energy; attack, defend, and dodge cost energy; special costs 20 energy and sets cooldown to 2 | Cooldown ticks down at the beginning of each turn, so one full intervening turn blocks the next special. Charge gain is bounded 5–16; energy remains in 0–100. Unavailable specials preserve energy. |
| Finish | Burst, ring-out, zero-energy spin finish, or turn-30 judge score | Mutual ring-out / simultaneous spin-loss are resolved with deterministic tie handling; judge score combines energy, stability, and ring position. |

### Known math caveats

- The equations are provisional and have not undergone simulation-based balance analysis or human playtesting.
- Action order is represented by initiative, but both attacks are evaluated in the same resolution pass; if the first attack ends the match, the second is skipped. This is a deliberate simplified simultaneous-action model, not a physical collision simulation.
- A collision chance is sampled before impact randomness, and burst chance is only sampled when stability remains above zero. This means different branches consume different numbers of PRNG draws; deterministic replay remains intact for the same decisions, but changing a mechanic can shift all later draws.
- The current `Time Limit` winner is selected from a prototype score (48% energy, 34% stability, 18% ring position). It should be reviewed alongside all other values before any ranked mode.
- `resolveTurn()` guards actions and finished matches, but the prototype assumes engine-created battle state. A future server boundary must validate the full state shape and all client input independently.

## Validation performed

Run `npm test` to check the catalog totals and pair conservation, all 7,680 bounded build combinations, cosmetic-only cores, type classification, action validation without mutation, seeded repeatability, special-energy handling, bounded resources, and reachable finish paths. The browser prototype has also been exercised through a complete local match and at a 390×844 mobile viewport; the tested mobile layout had no horizontal overflow. These checks validate implementation behavior, not balance quality or production security.

## Roadmap

1. **Rules and balance:** agree canonical stat/action meanings, probabilities, turn ordering, costs, and finishes; add Monte Carlo and property-based balance checks; then conduct human playtests and tune only from evidence.
2. **Product polish:** improve accessibility and input ergonomics, add sound/preferences and clearer battle telemetry, and resolve browser-specific presentation issues.
3. **Server-authoritative foundation:** introduce a versioned combat protocol and server-owned match state; submit both player choices privately, resolve only on the server, and add request validation, reconnect behavior, rate limits, and replay/audit records.
4. **Accounts and persistence:** add authentication, profiles, saved builds, and match history through a documented API and database migrations. Keep cosmetic identity separate from competitive stats.
5. **Online PvP:** add matchmaking, rematches, disconnect handling, spectators, and abuse reporting only after authoritative combat and operational monitoring exist.
6. **AI and rankings:** add bots that use the same public action contract; define ranking rules and resets after the competitive rules and server have been validated.

Online features are not present today. Do not treat local storage, client-side action hiding, the seeded PRNG, or the static Node server as security or persistence mechanisms.
