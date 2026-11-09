import {
  ACTIONS,
  BLADES,
  CORES,
  DISCS,
  TIPS,
  allBuilds,
  buildBeyblade,
  chooseAiAction,
  createMatch,
  generateRival,
  resolveTurn,
} from './engine.mjs';

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const STORAGE_KEY = 'spinforge-builds-v1';
const defaults = { coreId: 'aetherion', bladeId: 'B01', discId: 'D01', tipId: 'T01' };
const actionInfo = {
  ATTACK: ['↗', '1.5× IMPACT', 'Raise collision odds'],
  DEFEND: ['⬡', 'GUARD', 'Reduce incoming damage'],
  DODGE: ['⌁', 'EVASIVE', 'Lower collision odds'],
  CHARGE: ['ϟ', 'BUILD METER', 'Exposed while charging'],
  SPECIAL: ['✹', '5× IMPACT', 'High recoil · spend meter'],
};
let selection = { ...defaults };
let currentBuild = buildBeyblade(selection, 'Aetherion');
let match = null;
let rival = null;
let submitted = false;
let turnTimer = null;
let toastTimer = null;
let assemblyCount = 1;

function populateSelects() {
  $('#core-select').innerHTML = CORES.map((part) => `<option value="${part.id}">${part.name}</option>`).join('');
  $('#blade-select').innerHTML = BLADES.map((part) => `<option value="${part.id}">${part.id} · ${part.name} — AP ${part.ap} / LI ${part.li}</option>`).join('');
  $('#disc-select').innerHTML = DISCS.map((part) => `<option value="${part.id}">${part.id} · ${part.name} — MS ${part.ms} / ST ${part.st}</option>`).join('');
  $('#tip-select').innerHTML = TIPS.map((part) => `<option value="${part.id}">${part.id} · ${part.name} — MB ${part.mb} / SM ${part.sm}</option>`).join('');
  for (const [key, selector] of Object.entries({ coreId: '#core-select', bladeId: '#blade-select', discId: '#disc-select', tipId: '#tip-select' })) {
    $(selector).value = selection[key];
    $(selector).addEventListener('change', () => {
      selection[key] = $(selector).value;
      updateBuild();
    });
  }
}

function updateBuild() {
  currentBuild = buildBeyblade(selection, $('#build-name').value);
  const { core, blade, disc, tip } = currentBuild;
  $('#build-name').value = $('#build-name').value.slice(0, 24);
  $('#preview-name').textContent = currentBuild.displayName;
  $('#preview-parts').textContent = `${blade.id} · ${disc.id} · ${tip.id}`;
  $('#type-pill').textContent = `${currentBuild.type.toUpperCase()} TYPE`;
  $('#core-color').style.background = `linear-gradient(135deg, ${core.primary} 50%, ${core.secondary} 50%)`;
  $('#core-color').style.boxShadow = `0 0 18px ${core.primary}40`;
  $('#core-badge').textContent = core.name.slice(0, 2).toUpperCase();
  $('#core-badge').style.background = core.primary;
  $('#core-badge').style.color = luminance(core.primary) > 0.62 ? '#17181d' : '#fff';
  $('#preview-bey').style.setProperty('--core', core.primary);
  $('#preview-bey').style.setProperty('--secondary', core.secondary);
  $('#bey-card').style.borderColor = `${core.primary}45`;
  $('#blade-values').innerHTML = `<span>AP <b>${blade.ap}</b></span><span>LI <b>${blade.li}</b></span>`;
  $('#disc-values').innerHTML = `<span>MS <b>${disc.ms}</b></span><span>ST <b>${disc.st}</b></span>`;
  $('#tip-values').innerHTML = `<span>MB <b>${tip.mb}</b></span><span>SM <b>${tip.sm}</b></span>`;
  $('#tip-identity').textContent = tip.identity;
  const special = currentBuild.specialization.length ? `${currentBuild.specialization.join(' / ').toUpperCase()} SPECIALIST` : 'WELL ROUNDED';
  $('#specialization-label').textContent = special;
  $('#stat-bars').innerHTML = [
    ['AP', currentBuild.ap, 80], ['LI', currentBuild.li, 80],
    ['MS', currentBuild.ms, 100], ['ST', currentBuild.st, 100],
    ['MB', currentBuild.mb, 100], ['SM', currentBuild.sm, 100],
  ].map(([label, value, max]) => `<div class="stat-row"><span class="stat-code">${label}</span><div class="stat-track"><div class="stat-fill" style="width:${Math.max(3, value / max * 100)}%"></div></div><span class="stat-value">${value}</span></div>`).join('');
}

function luminance(hex) {
  const channels = hex.slice(1).match(/.{2}/g).map((part) => parseInt(part, 16) / 255).map((c) => c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function switchView(viewName) {
  $$('.nav-link').forEach((button) => button.classList.toggle('active', button.dataset.view === viewName));
  $$('.view').forEach((view) => view.classList.toggle('active', view.id === `${viewName}-view`));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function loadSavedBuilds() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(saved) ? saved.slice(0, 6) : [];
  } catch {
    return [];
  }
}

function renderSavedBuilds() {
  const saved = loadSavedBuilds();
  const container = $('#saved-builds');
  container.innerHTML = saved.map((item, index) => {
    const bey = buildBeyblade(item.selection, item.name);
    return `<span class="saved-chip" data-load="${index}" title="Load ${escapeHtml(bey.displayName)}">${escapeHtml(bey.displayName)} <button type="button" data-delete="${index}" aria-label="Delete ${escapeHtml(bey.displayName)}">×</button></span>`;
  }).join('');
  container.querySelectorAll('[data-load]').forEach((chip) => chip.addEventListener('click', (event) => {
    if (event.target.closest('[data-delete]')) return;
    const item = loadSavedBuilds()[Number(chip.dataset.load)];
    if (!item) return;
    selection = { ...item.selection };
    Object.entries({ coreId: '#core-select', bladeId: '#blade-select', discId: '#disc-select', tipId: '#tip-select' }).forEach(([key, selector]) => { $(selector).value = selection[key]; });
    $('#build-name').value = item.name;
    updateBuild();
    showToast(`${item.name} loaded into the bay.`);
  }));
  container.querySelectorAll('[data-delete]').forEach((button) => button.addEventListener('click', (event) => {
    event.stopPropagation();
    const items = loadSavedBuilds();
    items.splice(Number(button.dataset.delete), 1);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    renderSavedBuilds();
  }));
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function saveBuild() {
  const items = loadSavedBuilds();
  const name = $('#build-name').value.trim() || currentBuild.displayName;
  const savedItem = { name, selection: { ...selection } };
  const duplicate = items.findIndex((item) => item.name.toLowerCase() === name.toLowerCase());
  if (duplicate >= 0) items.splice(duplicate, 1);
  items.unshift(savedItem);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 6)));
  renderSavedBuilds();
  showToast(`${name} saved to your build bay.`);
}

function randomizeBuild() {
  selection = {
    coreId: CORES[Math.floor(Math.random() * CORES.length)].id,
    bladeId: BLADES[Math.floor(Math.random() * BLADES.length)].id,
    discId: DISCS[Math.floor(Math.random() * DISCS.length)].id,
    tipId: TIPS[Math.floor(Math.random() * TIPS.length)].id,
  };
  Object.entries({ coreId: '#core-select', bladeId: '#blade-select', discId: '#disc-select', tipId: '#tip-select' }).forEach(([key, selector]) => { $(selector).value = selection[key]; });
  $('#build-name').value = '';
  updateBuild();
}

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2300);
}

function rivalForStyle(style) {
  if (style === 'random') return generateRival(Math.floor(Math.random() * 0xffffffff));
  const candidates = {
    attack: ['draknor', 'B03', 'D02', 'T02', 'Rift'],
    defense: ['luminara', 'B05', 'D05', 'T07', 'Bulwark'],
    stamina: ['crysalix', 'B04', 'D04', 'T05', 'Glacier'],
    balance: ['voltaris', 'B01', 'D01', 'T01', 'Vector'],
  }[style];
  return buildBeyblade({ coreId: candidates[0], bladeId: candidates[1], discId: candidates[2], tipId: candidates[3] }, candidates[4]);
}

function launchMatch() {
  clearTimeout(turnTimer);
  rival = rivalForStyle($('#rival-style').value);
  match = createMatch(currentBuild, rival, Math.random());
  submitted = false;
  $('#prebattle').classList.add('hidden');
  $('#battle-screen').classList.remove('hidden');
  $('#result-banner').classList.add('hidden');
  $('#arena-name-0').textContent = currentBuild.displayName;
  $('#arena-name-1').textContent = rival.displayName;
  $('#arena-type-0').textContent = `${currentBuild.type.toUpperCase()} TYPE`;
  $('#arena-type-1').textContent = `${rival.type.toUpperCase()} TYPE`;
  for (const [index, bey] of [currentBuild, rival].entries()) {
    const element = $(`#arena-bey-${index}`);
    element.style.setProperty('--core', bey.core.primary);
    element.style.setProperty('--secondary', bey.core.secondary);
  }
  renderBattle();
  switchView('arena');
}

function renderFighterStatus(fighter, index) {
  const energyPct = Math.max(0, fighter.energy / fighter.maxEnergy * 100);
  const stabilityPct = Math.max(0, fighter.stability / fighter.maxStability * 100);
  const specialPct = fighter.special;
  const displayName = fighter.bey.displayName;
  const showMeter = (label, value, pct, className = '') => `<div class="meter-row ${className}"><label>${label}</label><div class="meter-track"><div class="meter-fill" style="width:${Math.max(0, Math.min(100, pct))}%"></div></div><output>${Math.round(value)}%</output></div>`;
  $(`#fighter-status-${index}`).innerHTML = `<div class="status-name-row"><strong>${escapeHtml(displayName)}</strong><span>${fighter.bey.blade.id} · ${fighter.bey.tip.id}</span></div>${showMeter('ENERGY', energyPct, energyPct)}${showMeter('STABILITY', stabilityPct, stabilityPct, 'stability')}${showMeter('PRESSURE', Math.min(100, fighter.pressure / 120 * 100), fighter.pressure / 120 * 100, 'pressure')}${showMeter('SPECIAL', specialPct, specialPct, 'special')}<div class="fighter-meta"><span>COMBO ×${fighter.combo}</span><span>GUARD ${fighter.guardStack} · DODGE ${fighter.dodgeStack}</span></div>`;
}

function renderActions() {
  const buttons = $('#action-buttons');
  buttons.innerHTML = ACTIONS.map((action) => {
    const [icon, label, description] = actionInfo[action];
    const disabled = action === 'SPECIAL' && match.fighters[0].special < 100;
    return `<button type="button" class="action-button" data-action="${action}" ${disabled || submitted || match.status !== 'active' ? 'disabled' : ''}><span class="move-icon">${icon}</span><b>${action}</b><small>${label}</small></button>`;
  }).join('');
  buttons.querySelectorAll('[data-action]').forEach((button) => button.addEventListener('click', () => submitAction(button.dataset.action)));
}

function renderBattle() {
  if (!match) return;
  $('#turn-label').textContent = `TURN ${String(match.turn + 1).padStart(2, '0')}`;
  match.fighters.forEach(renderFighterStatus);
  $('#instability-label').textContent = match.instability < 10 ? 'ARENA STABLE' : `INSTABILITY ${match.instability}%`;
  $('#combat-log').innerHTML = match.log.slice(-6).reverse().map((entry) => `<div class="log-entry"><span>${String(entry.turn).padStart(2, '0')}</span><div>${escapeHtml(entry.text)}</div></div>`).join('');
  $('#combat-log').scrollTop = 0;
  $('#action-hint').textContent = match.status !== 'active' ? 'MATCH COMPLETE' : submitted ? 'MOVE LOCKED · RIVAL THINKING…' : 'RIVAL’S MOVE IS HIDDEN';
  renderActions();
  if (match.status === 'complete') showResult();
}

function submitAction(action) {
  if (submitted || match?.status !== 'active') return;
  if (!ACTIONS.includes(action)) return;
  if (action === 'SPECIAL' && match.fighters[0].special < 100) return;
  clearTimeout(turnTimer);
  submitted = true;
  $('#action-buttons').querySelectorAll('button').forEach((button) => {
    button.disabled = true;
    if (button.dataset.action === action) button.classList.add('selected');
  });
  $('#action-hint').textContent = 'MOVE LOCKED · RIVAL THINKING…';
  turnTimer = setTimeout(() => resolveRound(action), 520);
}

function resolveRound(playerAction) {
  if (!match || match.status !== 'active') return;
  const rivalAction = chooseAiAction(match, 1);
  resolveTurn(match, [playerAction, rivalAction]);
  const collisionEntry = match.log[match.log.length - 1];
  if (collisionEntry?.text.includes('Collision!')) {
    $('#impact-flash').classList.remove('hit');
    void $('#impact-flash').offsetWidth;
    $('#impact-flash').classList.add('hit');
    $$('.arena-bey').forEach((bey) => {
      bey.classList.remove('spinning');
      void bey.offsetWidth;
      bey.classList.add('spinning');
    });
  }
  updateArenaPositions();
  submitted = false;
  renderBattle();
  if (match.status === 'active') {
    turnTimer = setTimeout(() => {
      if (!submitted && match?.status === 'active') resolveRound('DEFEND');
    }, 60000);
  }
}

function updateArenaPositions() {
  const [playerState, rivalState] = match.fighters;
  const playerX = 29 + Math.min(12, playerState.pressure / 12);
  const rivalX = 71 - Math.min(12, rivalState.pressure / 12);
  $('#arena-bey-0').style.left = `${playerX}%`;
  $('#arena-bey-1').style.left = `${rivalX}%`;
  $('#arena-bey-0').style.top = `${48 + Math.min(12, playerState.pressure / 15)}%`;
  $('#arena-bey-1').style.top = `${48 - Math.min(12, rivalState.pressure / 15)}%`;
}

function showResult() {
  clearTimeout(turnTimer);
  const banner = $('#result-banner');
  const win = match.winner === 0;
  const draw = match.winner === null;
  banner.classList.toggle('draw', draw);
  const title = draw ? 'A STADIUM DRAW' : win ? 'VICTORY · WELL SPUN' : 'DEFEAT · RUN IT BACK';
  const finish = match.finish.replaceAll('-', ' ').toUpperCase();
  banner.innerHTML = `<div><h2>${title}</h2><p>${finish} · ${match.turn} turns. ${escapeHtml(match.log[match.log.length - 1]?.text || '')}</p></div><button id="rematch" class="button button-primary">${draw || win ? 'RUN IT BACK' : 'REMATCH'} <span>↻</span></button>`;
  banner.classList.remove('hidden');
  $('#rematch').addEventListener('click', launchMatch);
}

function forfeit() {
  if (!match || match.status !== 'active') return;
  clearTimeout(turnTimer);
  match.status = 'complete';
  match.winner = 1;
  match.finish = 'forfeit';
  match.log.push({ turn: match.turn, text: `${currentBuild.displayName} forfeits the match.` });
  renderBattle();
}

function bindEvents() {
  $$('.nav-link').forEach((button) => button.addEventListener('click', () => switchView(button.dataset.view)));
  $('#build-name').addEventListener('input', updateBuild);
  $('#random-build').addEventListener('click', randomizeBuild);
  $('#save-build').addEventListener('click', saveBuild);
  $('#start-battle').addEventListener('click', () => { switchView('arena'); $('#prebattle').classList.remove('hidden'); $('#battle-screen').classList.add('hidden'); });
  $('#back-to-forge').addEventListener('click', () => switchView('forge'));
  $('#launch-match').addEventListener('click', launchMatch);
  $('#surrender').addEventListener('click', forfeit);
}

populateSelects();
bindEvents();
updateBuild();
renderSavedBuilds();

// Keep the full build space readily inspectable for local QA without coupling the UI to it.
window.SpinForge = { allBuilds, buildBeyblade, get match() { return match; } };
