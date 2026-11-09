import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ACTIONS, BLADES, COMPONENT_COUNT, CORES, DISCS, TIPS,
  createBattle, makeBuild, resolveTurn, validateContent,
} from './engine.js';

const sample = makeBuild({ core: 'C01', blade: 'B01', disc: 'D01', tip: 'T01', name: 'TEST' });

function playToEnd(seed, firstAction, secondAction) {
  const battle = createBattle(sample, sample, seed);
  while (!battle.over) resolveTurn(battle, firstAction, secondAction);
  return battle;
}

test('content has 7,680 combinations and conserved component pairs', () => {
  assert.equal(COMPONENT_COUNT, 7680);
  assert.equal(validateContent(), true);
  assert.equal(CORES.length, 15);
  assert.equal(BLADES.length, 8);
  assert.equal(DISCS.length, 8);
  assert.equal(TIPS.length, 8);
  for (const part of BLADES) assert.equal(part.ap + part.li, 80);
  for (const part of DISCS) assert.equal(part.ms + part.st, 100);
  for (const part of TIPS) assert.equal(part.mb + part.sm, 100);
});

test('every build combination produces bounded finite stats and cosmetic-only cores', () => {
  const firstCore = makeBuild({ core: 'C01' });
  const otherCore = makeBuild({ core: 'C15' });
  assert.deepEqual(otherCore.stats, firstCore.stats);
  assert.equal(otherCore.classification, firstCore.classification);
  let count = 0;
  for (const core of CORES) for (const blade of BLADES) for (const disc of DISCS) for (const tip of TIPS) {
    const build = makeBuild({ core: core.id, blade: blade.id, disc: disc.id, tip: tip.id });
    for (const value of Object.values(build.stats)) {
      assert.ok(Number.isFinite(value));
      assert.ok(value >= 20 && value <= 80);
    }
    count++;
  }
  assert.equal(count, COMPONENT_COUNT);
});

test('balance is included when assigning the build type', () => {
  const build = makeBuild({ blade: 'B08', disc: 'D07', tip: 'T05' });
  assert.ok(build.stats.balance > build.stats.stamina);
  assert.ok(build.stats.stamina >= 55);
  assert.equal(build.classification, 'Balanced');
});

test('all five actions are accepted and invalid actions are rejected without mutation', () => {
  for (const action of ACTIONS) {
    const battle = createBattle(sample, sample, 9);
    assert.doesNotThrow(() => resolveTurn(battle, action, 'charge'));
    assert.equal(battle.turn, 2);
  }
  const battle = createBattle(sample, sample, 9);
  const before = structuredClone(battle);
  assert.throws(() => resolveTurn(battle, 'teleport', 'charge'), /valid combat action/);
  assert.deepEqual(battle, before);
});

test('same seed and actions produce identical combat results', () => {
  const a = playToEnd(123456, 'attack', 'dodge');
  const b = playToEnd(123456, 'attack', 'dodge');
  assert.deepEqual(a, b);
  assert.ok(a.over);
});

test('specials spend exactly 20 energy and unavailable specials preserve energy', () => {
  const ready = createBattle(sample, sample, 3);
  resolveTurn(ready, 'special', 'charge');
  assert.equal(ready.fighters[0].energy, 80);

  const low = createBattle(sample, sample, 3);
  low.fighters[0].energy = 19;
  resolveTurn(low, 'special', 'charge');
  assert.equal(low.fighters[0].energy, 19);
});

test('resource and position values stay bounded through a full match', () => {
  const battle = createBattle(sample, makeBuild({ blade: 'B03', disc: 'D05', tip: 'T03' }), 0xabcdef);
  const actions = ['attack', 'defend', 'dodge', 'charge', 'special'];
  for (let turn = 0; turn < 30 && !battle.over; turn++) {
    resolveTurn(battle, actions[turn % actions.length], actions[(turn + 2) % actions.length]);
    for (const fighter of battle.fighters) {
      for (const resource of ['energy', 'stability']) assert.ok(fighter[resource] >= 0 && fighter[resource] <= 100);
      assert.ok(fighter.position >= 0 && fighter.position <= 105);
      assert.ok(fighter.momentum >= 0 && fighter.momentum <= 0.7);
    }
  }
  assert.equal(battle.over, true);
});

test('ring-out, spin-finish, burst, and time-limit resolutions are reachable', () => {
  const ringOut = createBattle(sample, sample, 4);
  ringOut.fighters[1].position = 105;
  resolveTurn(ringOut, 'charge', 'charge');
  assert.equal(ringOut.reason, 'Ring-Out');
  assert.equal(ringOut.winner, 0);
  assert.equal(ringOut.totals.ringOuts, 1);

  const spin = createBattle(sample, sample, 4);
  spin.fighters[0].energy = 4;
  resolveTurn(spin, 'dodge', 'charge');
  assert.equal(spin.reason, 'Spin Finish');
  assert.equal(spin.winner, 1);
  assert.equal(spin.totals.spinFinishes, 1);

  let burst;
  for (let seed = 1; seed <= 100 && !burst; seed++) {
    const candidate = createBattle(sample, sample, seed);
    candidate.fighters[1].stability = 1;
    resolveTurn(candidate, 'attack', 'charge');
    if (candidate.reason === 'Burst') burst = candidate;
  }
  assert.ok(burst, 'a seeded collision should burst a fighter at critical stability');
  assert.equal(burst.totals.bursts, 1);

  const timed = createBattle(sample, sample, 4);
  timed.turn = 30;
  resolveTurn(timed, 'charge', 'charge');
  assert.equal(timed.reason, 'Time Limit');
  assert.ok(timed.over);
});
