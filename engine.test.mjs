import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ACTIONS,
  BLADES,
  CORES,
  DISCS,
  TIPS,
  allBuilds,
  buildBeyblade,
  createMatch,
  policies,
  resolveTurn,
  simulateMatch,
} from './engine.mjs';

const representativeBuilds = [
  ['aetherion', 'B01', 'D01', 'T01'],
  ['draknor', 'B03', 'D02', 'T02'],
  ['luminara', 'B05', 'D05', 'T07'],
  ['crysalix', 'B04', 'D04', 'T05'],
  ['voltaris', 'B07', 'D07', 'T06'],
  ['noctyra', 'B06', 'D06', 'T08'],
].map(([coreId, bladeId, discId, tipId]) => buildBeyblade({ coreId, bladeId, discId, tipId }));

test('all 7,680 builds are unique, valid, and preserve paired stat totals', () => {
  const builds = allBuilds();
  assert.equal(CORES.length * BLADES.length * DISCS.length * TIPS.length, 7680);
  assert.equal(builds.length, 7680);
  assert.equal(new Set(builds.map((build) => build.id)).size, 7680);
  for (const build of builds) {
    assert.equal(build.ap + build.li, 80, build.id);
    assert.equal(build.ms + build.st, 100, build.id);
    assert.equal(build.mb + build.sm, 100, build.id);
    assert.ok(['Attack', 'Defense', 'Stamina', 'Balance'].includes(build.type), build.id);
    assert.deepEqual(build, buildBeyblade({
      coreId: build.core.id,
      bladeId: build.blade.id,
      discId: build.disc.id,
      tipId: build.tip.id,
    }));
  }
});

test('engine rejects invalid actions without advancing a match', () => {
  const match = createMatch(representativeBuilds[0], representativeBuilds[1], 42);
  assert.throws(() => resolveTurn(match, ['ATTACK', 'NOPE']), /valid action/i);
  assert.equal(match.turn, 0);
  assert.equal(match.status, 'active');
  assert.deepEqual(ACTIONS, ['ATTACK', 'DEFEND', 'DODGE', 'CHARGE', 'SPECIAL']);
});

test('repeated-action strategies and adaptive play always terminate within the turn limit', () => {
  const strategyNames = ['attack', 'defend', 'dodge', 'charge', 'adaptive'];
  for (let a = 0; a < strategyNames.length; a += 1) {
    for (let b = 0; b < strategyNames.length; b += 1) {
      for (let seed = 1; seed <= 8; seed += 1) {
        const left = representativeBuilds[(a + seed) % representativeBuilds.length];
        const right = representativeBuilds[(b + seed + 2) % representativeBuilds.length];
        const result = simulateMatch(left, right, policies[strategyNames[a]], policies[strategyNames[b]], seed * 7919);
        assert.equal(result.status, 'complete', `${strategyNames[a]} vs ${strategyNames[b]} seed ${seed}`);
        assert.ok(result.turn > 0 && result.turn <= 40);
        assert.ok(result.winner === null || result.winner === 0 || result.winner === 1);
        assert.ok(result.finish);
      }
    }
  }
});

test('specials cannot be fired before the meter is full', () => {
  const match = createMatch(representativeBuilds[0], representativeBuilds[1], 7);
  assert.throws(() => resolveTurn(match, ['SPECIAL', 'ATTACK']), /full meter/i);
  assert.equal(match.turn, 0);
});
