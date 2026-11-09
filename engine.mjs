export const CORES = [
  { id: 'aetherion', name: 'Aetherion', primary: '#39d8ed', secondary: '#f3ffff' },
  { id: 'draknor', name: 'Draknor', primary: '#f04755', secondary: '#15151a' },
  { id: 'veltrix', name: 'Veltrix', primary: '#a876fa', secondary: '#d8d0e7' },
  { id: 'nyxalon', name: 'Nyxalon', primary: '#26356e', secondary: '#11131d' },
  { id: 'pyronis', name: 'Pyronis', primary: '#ff7a28', secondary: '#f7cb59' },
  { id: 'zephyros', name: 'Zephyros', primary: '#63ccef', secondary: '#65d5a5' },
  { id: 'gravion', name: 'Gravion', primary: '#838994', secondary: '#c4ccd4' },
  { id: 'luminara', name: 'Luminara', primary: '#f6f2e9', secondary: '#e5c363' },
  { id: 'obsidrax', name: 'Obsidrax', primary: '#17181d', secondary: '#df434c' },
  { id: 'crysalix', name: 'Crysalix', primary: '#97eaf0', secondary: '#f6ffff' },
  { id: 'voltaris', name: 'Voltaris', primary: '#e9e639', secondary: '#49a9ee' },
  { id: 'umbros', name: 'Umbros', primary: '#583773', secondary: '#16121a' },
  { id: 'solvane', name: 'Solvane', primary: '#e7bd53', secondary: '#e64b45' },
  { id: 'tyralis', name: 'Tyralis', primary: '#aa794e', secondary: '#447651' },
  { id: 'noctyra', name: 'Noctyra', primary: '#252d65', secondary: '#9174c8' },
];

export const BLADES = [
  { id: 'B01', name: 'Aegis', ap: 40, li: 40, identity: 'Balanced' },
  { id: 'B02', name: 'Razor', ap: 50, li: 30, identity: 'Aggressive striker' },
  { id: 'B03', name: 'Ragnarok', ap: 60, li: 20, identity: 'Glass cannon' },
  { id: 'B04', name: 'Bulwark', ap: 30, li: 50, identity: 'Defensive blade' },
  { id: 'B05', name: 'Lockjaw', ap: 20, li: 60, identity: 'Burst specialist' },
  { id: 'B06', name: 'Impact', ap: 55, li: 25, identity: 'Heavy attacker' },
  { id: 'B07', name: 'Vanguard', ap: 45, li: 35, identity: 'Controlled attacker' },
  { id: 'B08', name: 'Warden', ap: 35, li: 45, identity: 'Stability hybrid' },
];

export const DISCS = [
  { id: 'D01', name: 'Orbit', ms: 50, st: 50, identity: 'Balanced' },
  { id: 'D02', name: 'Overdrive', ms: 65, st: 35, identity: 'Heavy attacker support' },
  { id: 'D03', name: 'Titan', ms: 80, st: 20, identity: 'Extreme mass' },
  { id: 'D04', name: 'Bastion', ms: 35, st: 65, identity: 'Defense-oriented' },
  { id: 'D05', name: 'Anchor', ms: 20, st: 80, identity: 'Ultra stability' },
  { id: 'D06', name: 'Pressure', ms: 70, st: 30, identity: 'Aggressive weight' },
  { id: 'D07', name: 'Vector', ms: 60, st: 40, identity: 'Hybrid' },
  { id: 'D08', name: 'Control', ms: 40, st: 60, identity: 'Controlled defense' },
];

export const TIPS = [
  { id: 'T01', name: 'Glide', mb: 50, sm: 50, identity: 'Balanced' },
  { id: 'T02', name: 'Dash', mb: 70, sm: 30, identity: 'Attack mobility' },
  { id: 'T03', name: 'Comet', mb: 85, sm: 15, identity: 'Extreme speed' },
  { id: 'T04', name: 'Endure', mb: 30, sm: 70, identity: 'Stamina focus' },
  { id: 'T05', name: 'Evergreen', mb: 15, sm: 85, identity: 'Ultra stamina' },
  { id: 'T06', name: 'Surge', mb: 60, sm: 40, identity: 'Hybrid attacker' },
  { id: 'T07', name: 'Steady', mb: 40, sm: 60, identity: 'Defensive stamina' },
  { id: 'T08', name: 'Skitter', mb: 75, sm: 25, identity: 'Unstable attacker' },
];

export const ACTIONS = ['ATTACK', 'DEFEND', 'DODGE', 'CHARGE', 'SPECIAL'];
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const safeRatio = (a, b) => a / Math.max(1, b);

export function buildBeyblade(selection, displayName = '') {
  const core = CORES.find((item) => item.id === selection.coreId) ?? CORES[0];
  const blade = BLADES.find((item) => item.id === selection.bladeId) ?? BLADES[0];
  const disc = DISCS.find((item) => item.id === selection.discId) ?? DISCS[0];
  const tip = TIPS.find((item) => item.id === selection.tipId) ?? TIPS[0];
  const scores = {
    Attack: Math.max(blade.ap / 80, tip.mb / 100),
    Defense: Math.max(disc.st / 100, disc.ms / 100),
    Stamina: tip.sm / 100,
  };
  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const type = ranked[0][1] - ranked[1][1] < 0.12 ? 'Balance' : ranked[0][0];
  const specialization = getSpecialization({ ap: blade.ap, li: blade.li, ms: disc.ms, st: disc.st, mb: tip.mb, sm: tip.sm });
  return {
    id: `${core.id}-${blade.id}-${disc.id}-${tip.id}`,
    displayName: displayName.trim() || `${core.name} ${blade.name}`,
    core,
    blade,
    disc,
    tip,
    ap: blade.ap,
    li: blade.li,
    ms: disc.ms,
    st: disc.st,
    mb: tip.mb,
    sm: tip.sm,
    type,
    scores,
    specialization,
  };
}

export function getSpecialization(bey) {
  const candidates = [
    ['Attack', bey.ap / 80, bey.mb / 100],
    ['Defense', bey.st / 100, bey.ms / 100],
    ['Stamina', bey.sm / 100, bey.st / 100],
  ];
  const domains = [];
  for (const [domain, first, second] of candidates) {
    if (Math.max(first, second) >= Math.max(0.7, Math.min(first, second) * 1.25)) domains.push(domain);
  }
  return domains;
}

export function createFighter(bey) {
  return {
    bey,
    energy: bey.sm * 1.2,
    maxEnergy: bey.sm * 1.2,
    stability: bey.st * 1.8,
    maxStability: bey.st * 1.8,
    pressure: 0,
    passivePressure: 0,
    special: 0,
    guardStack: 0,
    dodgeStack: 0,
    combo: 0,
    lastAction: null,
    repeatCount: 0,
    history: [],
    adaptationReady: false,
    lastTurnImpact: 0,
  };
}

export function createMatch(playerBey, rivalBey, seed = Math.random()) {
  return {
    turn: 0,
    status: 'active',
    winner: null,
    finish: null,
    instability: 0,
    fighters: [createFighter(playerBey), createFighter(rivalBey)],
    log: [{ turn: 0, text: 'The stadium gates open. Choose your first move.' }],
    seed: (Math.floor(seed * 0xffffffff) >>> 0) || 0x7f4a7c15,
  };
}

function nextRandom(match) {
  let value = match.seed >>> 0;
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  match.seed = value >>> 0;
  return match.seed / 0x100000000;
}

function typeImpactMultiplier(bey, action) {
  let multiplier = 1;
  if (bey.type === 'Attack' && ['ATTACK', 'SPECIAL'].includes(action)) multiplier *= 1.15;
  if (bey.type === 'Balance') multiplier *= 1.05;
  if (bey.specialization.includes('Attack') && ['ATTACK', 'SPECIAL'].includes(action)) multiplier *= 1.04;
  const apBonus = Math.max(0, bey.ap - 50) * 0.006;
  if (['ATTACK', 'SPECIAL'].includes(action)) multiplier *= 1 + Math.min(0.2, apBonus);
  return multiplier;
}

function defenseReduction(fighter, action) {
  if (action !== 'DEFEND') return 0;
  const fatigue = Math.max(0.05, 0.2 - 0.05 * fighter.guardStack);
  return clamp(fatigue + (fighter.bey.type === 'Defense' ? 0.2 : 0) + (fighter.bey.type === 'Balance' ? 0.05 : 0), 0.05, 0.4);
}

function dodgeEffectiveness(fighter, action) {
  if (action !== 'DODGE') return 0;
  return clamp(1 - Math.max(0, fighter.dodgeStack - 1) * 0.1, 0.2, 1);
}

function getActionBonus(fighter, action) {
  const history = fighter.history;
  if (history.length >= 4) {
    const [a, b, c, d] = history.slice(-4);
    if (a === c && b === d && a !== b && action !== a) return 0.05;
  }
  return 0;
}

function pressureResistance(bey) {
  const mass = Math.max(0, bey.ms - 70) * 0.005;
  const defense = bey.type === 'Defense' ? 0.08 : 0;
  return clamp(mass + defense, 0, 0.25);
}

function burstChance(impact, attacker, defender, defenderAction, initiative) {
  const raw = impact * (attacker.bey.ms / Math.max(8, defender.bey.li)) / 12000;
  const liResistance = Math.max(0, defender.bey.li - 50) * 0.007;
  const defenderType = defender.bey.type === 'Defense' && defenderAction === 'DEFEND' ? 0.2 : 0;
  let chance = (0.008 + raw) * (1 - Math.min(0.35, liResistance + defenderType));
  if (defenderAction === 'CHARGE') chance *= 1.2;
  if (initiative) chance += 0.05;
  return clamp(chance, 0.004, 0.22);
}

function endMatch(match, winnerIndex, finish, message) {
  match.status = 'complete';
  match.winner = winnerIndex;
  match.finish = finish;
  match.log.push({ turn: match.turn, text: message });
}

export function resolveTurn(match, actions) {
  if (match.status !== 'active') return match;
  if (!Array.isArray(actions) || actions.length !== 2 || actions.some((action) => !ACTIONS.includes(action))) {
    throw new Error('A valid action is required from both fighters.');
  }
  if (actions.some((action, index) => action === 'SPECIAL' && match.fighters[index].special < 100)) {
    throw new Error('SPECIAL requires a full meter.');
  }
  const [left, right] = match.fighters;
  const fighters = match.fighters;
  const messages = [];
  const turn = match.turn + 1;
  match.turn = turn;
  match.instability = Math.min(60, match.instability + 1);
  const actionBonus = fighters.map((fighter, index) => getActionBonus(fighter, actions[index]));
  const dodgeEffect = fighters.map((fighter, index) => dodgeEffectiveness(fighter, actions[index]));
  let collisionChance = 0.4 + (left.bey.mb + right.bey.mb) / 200;
  for (let i = 0; i < 2; i += 1) {
    if (actions[i] === 'ATTACK') collisionChance += 0.15;
    if (actions[i] === 'DODGE') collisionChance -= 0.25 * dodgeEffect[i];
    if (fighters[i].bey.specialization.includes('Attack') && actions[i] === 'ATTACK') collisionChance += Math.min(0.08, Math.max(0, fighters[i].bey.mb - 70) * 0.005);
  }
  collisionChance = clamp(collisionChance, 0.2, 0.9);
  const collision = nextRandom(match) < collisionChance;
  const initiative = actions.map((action) => action === 'DODGE' || action === 'CHARGE');
  const arenaFactor = Math.max(0.7, 1 - match.instability * 0.005);
  const effectiveStability = fighters.map((fighter) => {
    const condition = fighter.stability / Math.max(1, fighter.maxStability);
    return Math.max(10, fighter.bey.st * arenaFactor * (0.35 + condition * 0.65));
  });
  const damageTaken = [0, 0];
  const burstRolls = [false, false];
  let impacts = [0, 0];

  if (collision) {
    messages.push(`Collision! ${Math.round(collisionChance * 100)}% engagement chance paid off.`);
    for (let i = 0; i < 2; i += 1) {
      const target = 1 - i;
      const fighter = fighters[i];
      const rival = fighters[target];
      const action = actions[i];
      const actionMultiplier = { ATTACK: 1.5, DEFEND: 0.8, DODGE: 0.7, CHARGE: 0.5, SPECIAL: 5 }[action];
      const momentum = fighter.combo >= 2 ? Math.min(0.15, fighter.combo * 0.05) : 0;
      const readBonus = initiative[target] ? 0.08 : 0;
      const randomFactor = 0.9 + nextRandom(match) * 0.2;
      let impact = fighter.bey.ap * (1 + fighter.bey.mb / 120) * actionMultiplier;
      impact *= typeImpactMultiplier(fighter.bey, action) * (1 + momentum + readBonus + actionBonus[i]);
      if (fighter.bey.type === 'Stamina' && ['CHARGE'].includes(action)) impact *= 1.05;
      impact *= randomFactor;
      impacts[i] = impact;
      const reduction = defenseReduction(rival, actions[target]);
      const dodgePenalty = actions[target] === 'DODGE' ? 0.55 + 0.45 * (1 - dodgeEffect[target]) : 1;
      const chargeExposure = actions[target] === 'CHARGE' ? 1.25 : 1;
      const staminaResistance = rival.bey.type === 'Stamina' ? 0.92 : 1;
      const rawLoss = impact / 38;
      damageTaken[target] += rawLoss * (1 - reduction) * dodgePenalty * chargeExposure * staminaResistance;
      const stabilityLoss = impact / Math.max(10, effectiveStability[target]) * 0.75;
      rival.stability = Math.max(0, rival.stability - stabilityLoss);
      let pressure = (impact / Math.max(10, rival.bey.ms)) * 1.8;
      if (actions[target] === 'DODGE') pressure *= 0.55;
      rival.pressure += pressure;
      rival.pressure += rival.passivePressure;
      rival.passivePressure = 0;
      if (actions[i] === 'SPECIAL') {
        const recoil = impact / (Math.max(10, effectiveStability[i]) * 2.7);
        damageTaken[i] += recoil * (1 + Math.min(0.15, fighter.combo * 0.05));
        fighter.stability = Math.max(0, fighter.stability - recoil * 1.5);
      }
      if (actions[i] === 'ATTACK' || actions[i] === 'SPECIAL') {
        const chance = burstChance(impact, fighter, rival, actions[target], initiative[target]);
        burstRolls[target] = nextRandom(match) < chance;
        if (burstRolls[target]) messages.push(`${rival.bey.displayName}’s lock gives way!`);
      }
    }
    messages.push(`${left.bey.displayName} dealt ${Math.round(impacts[0])} impact · ${right.bey.displayName} dealt ${Math.round(impacts[1])}.`);
  } else {
    messages.push(`Near miss — the collision chance was ${Math.round(collisionChance * 100)}%.`);
    const rank = (action) => ({ ATTACK: 3, SPECIAL: 3, CHARGE: 2, DEFEND: 1, DODGE: 0 })[action];
    let target;
    if (rank(actions[0]) !== rank(actions[1])) target = rank(actions[0]) < rank(actions[1]) ? 0 : 1;
    else if (left.bey.mb !== right.bey.mb) target = left.bey.mb < right.bey.mb ? 0 : 1;
    else target = nextRandom(match) < 0.5 ? 0 : 1;
    fighters[target].passivePressure += 3;
    messages.push(`${fighters[target].bey.displayName} drifts toward the stadium edge (+3 banked pressure).`);
  }

  for (let i = 0; i < 2; i += 1) {
    const fighter = fighters[i];
    const action = actions[i];
    const staminaEfficiency = fighter.bey.type === 'Stamina' ? 0.8 : 1;
    const specialtyDrain = Math.max(0, fighter.bey.sm - 70) * 0.004;
    const baseDrain = (1 + fighter.bey.mb / 80) * staminaEfficiency * Math.max(0.6, 1 - specialtyDrain);
    let pressureDrain = fighter.pressure > 70 ? fighter.pressure / 50 : 0;
    if (fighter.bey.type === 'Balance') pressureDrain *= 0.95;
    damageTaken[i] += baseDrain + pressureDrain;
    fighter.energy = Math.max(0, fighter.energy - damageTaken[i]);
    if (action === 'CHARGE') {
      const gain = fighter.bey.type === 'Stamina' ? 18.75 : 15;
      fighter.special = Math.min(100, fighter.special + gain);
      messages.push(`${fighter.bey.displayName} charges ${Math.round(gain)} special energy.`);
    } else if (action === 'SPECIAL') {
      fighter.special = 0;
      messages.push(`${fighter.bey.displayName} unleashes a high-risk special!`);
    }
    if (action === 'DEFEND') fighter.guardStack += 1;
    else fighter.guardStack = 0;
    if (action === 'DODGE') fighter.dodgeStack += 1;
    else fighter.dodgeStack = 0;

    const connectedAttack = collision && ['ATTACK', 'SPECIAL'].includes(action);
    if (connectedAttack && impacts[i] >= impacts[1 - i] * 0.8) fighter.combo = Math.min(3, fighter.combo + 1);
    else fighter.combo = 0;
    fighter.history.push(action);
    if (fighter.history.length > 12) fighter.history.shift();
    fighter.repeatCount = action === fighter.lastAction ? fighter.repeatCount + 1 : 1;
    fighter.lastAction = action;
    fighter.lastTurnImpact = impacts[i];
  }

  // Simultaneous defeats are draws; otherwise burst > ring-out > spin in that order.
  const burstLosers = burstRolls.map((bursted, index) => bursted ? index : -1).filter((index) => index >= 0);
  if (burstLosers.length === 2) endMatch(match, null, 'double-burst', 'Both locks fail at once — the match is a draw!');
  else if (burstLosers.length === 1) endMatch(match, 1 - burstLosers[0], 'burst', `${fighters[burstLosers[0]].bey.displayName} bursts! ${fighters[1 - burstLosers[0]].bey.displayName} takes the match.`);
  else {
    const ringOuts = fighters.map((fighter, index) => {
      if (fighter.pressure <= 120) return false;
      const excess = fighter.pressure - 120;
      const chance = clamp(0.18 + excess * 0.009 - pressureResistance(fighter.bey), 0.08, 0.72);
      return nextRandom(match) < chance;
    });
    const ringLosers = ringOuts.map((out, index) => out ? index : -1).filter((index) => index >= 0);
    if (ringLosers.length === 2) endMatch(match, null, 'double-ring-out', 'Both Beyblades leave the stadium — it’s a draw!');
    else if (ringLosers.length === 1) endMatch(match, 1 - ringLosers[0], 'ring-out', `${fighters[ringLosers[0]].bey.displayName} is knocked out of the ring!`);
    else {
      const exhausted = fighters.map((fighter, index) => fighter.energy <= 0 ? index : -1).filter((index) => index >= 0);
      if (exhausted.length === 2) endMatch(match, null, 'double-spin-out', 'Both Beyblades run out of spin — draw!');
      else if (exhausted.length === 1) endMatch(match, 1 - exhausted[0], 'spin', `${fighters[exhausted[0]].bey.displayName} runs out of spin!`);
      else if (turn >= 40) {
        const scores = fighters.map((fighter) => fighter.energy + fighter.stability * 0.15 - fighter.pressure * 0.2);
        if (Math.abs(scores[0] - scores[1]) < 0.01) endMatch(match, null, 'time-limit-draw', 'The arena seals at turn 40 — a judge calls a draw.');
        else endMatch(match, scores[0] > scores[1] ? 0 : 1, 'time-limit', `${fighters[scores[0] > scores[1] ? 1 : 0].bey.displayName} is outlasted at the turn limit.`);
      }
    }
  }

  match.log.push({ turn, text: messages.join(' ') });
  if (match.log.length > 30) match.log.splice(1, match.log.length - 30);
  return match;
}

export function chooseAiAction(match, aiIndex = 1) {
  const ai = match.fighters[aiIndex];
  const player = match.fighters[1 - aiIndex];
  const options = ACTIONS.filter((action) => action !== 'SPECIAL' || ai.special >= 100);
  const recent = player.history.slice(-3);
  const predicted = recent.length ? recent[recent.length - 1] : 'ATTACK';
  if (ai.special >= 100 && (player.energy < player.maxEnergy * 0.48 || player.lastAction === 'CHARGE' || player.pressure > 75)) return 'SPECIAL';
  if (ai.energy < ai.maxEnergy * 0.28) {
    if (ai.bey.type === 'Stamina' && ai.special < 100) return 'CHARGE';
    return predicted === 'ATTACK' || predicted === 'SPECIAL' ? 'DODGE' : 'DEFEND';
  }
  if (ai.special < 100 && ai.energy > 15 && (ai.special <= 70 && (match.turn % 6 === 2 || (ai.bey.type === 'Stamina' && match.turn % 5 === 1)))) return 'CHARGE';
  if (player.special >= 75 && ['ATTACK', 'SPECIAL'].includes(predicted)) return 'DODGE';
  if (player.pressure > 85) return 'ATTACK';
  if (predicted === 'CHARGE' && ai.bey.ap > 35) return 'ATTACK';
  if (ai.bey.type === 'Attack' || ai.bey.ap >= 50) return match.turn % 4 === 0 ? 'DODGE' : 'ATTACK';
  if (ai.bey.type === 'Defense') return ['ATTACK', 'DEFEND', 'ATTACK', 'DODGE'][match.turn % 4];
  if (ai.bey.type === 'Stamina') return ['ATTACK', 'CHARGE', 'DEFEND', 'ATTACK', 'DODGE'][match.turn % 5];
  return options[(match.turn + recent.length) % options.length];
}

export function generateRival(seed = Date.now()) {
  const random = (() => {
    let state = (seed >>> 0) || 1;
    return () => {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 0x100000000;
    };
  })();
  const presets = [
    ['aetherion', 'B03', 'D02', 'T02', 'Nova'],
    ['draknor', 'B06', 'D06', 'T08', 'Rift'],
    ['luminara', 'B05', 'D05', 'T07', 'Bulwark'],
    ['crysalix', 'B04', 'D04', 'T05', 'Glacier'],
    ['voltaris', 'B07', 'D07', 'T01', 'Voltage'],
    ['noctyra', 'B02', 'D08', 'T06', 'Phantom'],
  ];
  const preset = presets[Math.floor(random() * presets.length)];
  return buildBeyblade({ coreId: preset[0], bladeId: preset[1], discId: preset[2], tipId: preset[3] }, preset[4]);
}

export function simulateMatch(playerBey, rivalBey, policyA, policyB, seed = 1) {
  const match = createMatch(playerBey, rivalBey, seed);
  for (let i = 0; i < 40 && match.status === 'active'; i += 1) {
    const actions = [policyA(match, 0), policyB(match, 1)];
    resolveTurn(match, actions);
  }
  return match;
}

export const policies = {
  attack: () => 'ATTACK',
  defend: () => 'DEFEND',
  dodge: () => 'DODGE',
  charge: (match, index) => match.fighters[index].special >= 100 ? 'SPECIAL' : 'CHARGE',
  adaptive: (match, index) => chooseAiAction(match, index),
};

export function allBuilds() {
  const builds = [];
  for (const core of CORES) for (const blade of BLADES) for (const disc of DISCS) for (const tip of TIPS) {
    builds.push(buildBeyblade({ coreId: core.id, bladeId: blade.id, discId: disc.id, tipId: tip.id }));
  }
  return builds;
}
