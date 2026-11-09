(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const CORE_DATA = [
    {name:'Aetherion', color:'#76c9ff', accent:'#aedfff'},
    {name:'Draknor', color:'#ff786c', accent:'#ffb18a'},
    {name:'Nyxalon', color:'#b38aff', accent:'#d2baff'},
    {name:'Pyronis', color:'#ffab56', accent:'#ffd18b'},
    {name:'Zephyros', color:'#72dfb1', accent:'#b0f1d0'}
  ];
  const MOVES = ['attack','defend','dodge','charge','special'];
  const MOVE_LABEL = {attack:'ATTACK',defend:'DEFEND',dodge:'DODGE',charge:'CHARGE',special:'SPECIAL'};
  const DEFAULT_BUILD = {core:'Aetherion',ap:56,ms:48,mb:52};
  const OPPONENT_BUILD = {core:'Draknor',ap:61,ms:62,mb:45};
  let build = loadBuild();
  let match, timer, toastTimer;
  let currentView = 'battle';

  function loadBuild(){
    try { const saved=JSON.parse(localStorage.getItem('spinClashBuild')); if(saved && CORE_DATA.some(c=>c.name===saved.core)) return {...DEFAULT_BUILD,...saved}; } catch(_e){}
    return {...DEFAULT_BUILD};
  }
  function statsOf(b){return {AP:+b.ap,LI:80-(+b.ap),MS:+b.ms,ST:100-(+b.ms),MB:+b.mb,SM:100-(+b.mb)}}
  function classify(s){
    const attack=(s.AP+s.MB)/2, defense=(s.ST+s.MS)/2;
    if(attack>=defense*1.12 && attack>=s.SM*1.12) return 'Attack';
    if(defense>=attack*1.12 && defense>=s.SM*1.12) return 'Defense';
    if(s.SM>=Math.max(attack,defense)*1.12) return 'Stamina';
    return 'Balance';
  }
  function typeDescription(type){return ({Attack:'Explosive pressure, sharp recoil',Defense:'Hold ground and punish impact',Stamina:'Long spin, patient counterplay',Balance:'Versatile and hard to read'})[type]}
  function isSpecialist(state){return state.type!=='Balance'}
  function createState(b,name,isPlayer=false){
    const stats=statsOf(b),type=classify(stats);
    return {name,core:b.core,stats,type,energy:stats.SM*1.2,maxEnergy:stats.SM*1.2,pressure:0,passive:0,meter:0,guard:0,dodge:0,combo:0,lastAction:null,repeat:0,stability:100,isPlayer,charging:false,action:null};
  }
  function newMatch(){
    clearInterval(timer);
    const rivalBuild={...OPPONENT_BUILD};
    match={step:0,maxSteps:24,instability:0,player:createState(build,build.core,true),opponent:createState(rivalBuild,'Drift Phantom'),pending:false,over:false,log:[],collisions:0};
    $('resultOverlay').classList.add('hidden');
    $('matchLabel').textContent='VS. RIVAL AI';
    $('opponentNameArena').textContent='DRIFT PHANTOM';
    $('opponentTitle').textContent='Drift Phantom';
    $('actionHint').textContent='Attack raises collision odds. Charge safely when the rival is off-balance.';
    $('statusText').textContent='Choose your opening move'; $('collisionOdds').textContent='COLLISION —';
    match.log=[{step:'—',html:'The bowl is set. <strong>Choose your opening move.</strong>'}];
    renderAll(); startClock();
  }
  function startClock(){
    clearInterval(timer); let remaining=60; $('clock').textContent=remaining;
    timer=setInterval(()=>{
      if(!match||match.over||match.pending){clearInterval(timer);return}
      remaining--; $('clock').textContent=remaining;
      if(remaining<=0){clearInterval(timer);toast('Time — you brace automatically.');takeTurn(Math.random()<.5?'defend':'dodge',true)}
    },1000);
  }
  function addLog(html,step=match.step){
    match.log.unshift({step:String(step).padStart(2,'0'),html});match.log=match.log.slice(0,8);renderLog();
  }
  function toast(message){const el=$('toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2100)}
  function setView(view){
    currentView=view;
    if(view!=='battle')clearInterval(timer);else if(match&&!match.over&&!match.pending)startClock();
    for(const id of ['battle','garage','guide']) $(id+'View').classList.toggle('hidden',id!==view);
    document.querySelectorAll('.nav-link').forEach(button=>button.classList.toggle('active',button.dataset.view===view));
    if(view==='garage')renderBuilder();
    window.scrollTo({top:0,behavior:'smooth'});
  }
  function aiMove(state,player){
    // A readable practice pilot: it learns from repeated player habits but still varies its choices.
    if(state.meter>=100 && Math.random()<.62)return 'special';
    if(player.lastAction==='charge' && Math.random()<.68)return 'attack';
    if(player.lastAction==='special' && Math.random()<.48)return 'dodge';
    if(player.combo>=2 && Math.random()<.5)return 'defend';
    if(state.energy<state.maxEnergy*.3 && state.meter<70 && Math.random()<.55)return 'charge';
    const roll=Math.random();
    if(roll<.40)return 'attack'; if(roll<.63)return 'defend'; if(roll<.79)return 'dodge'; return 'charge';
  }
  function clamp(n,min,max){return Math.max(min,Math.min(max,n))}
  function randomFactor(){return .9+Math.random()*.2}
  function takeTurn(action,timeout=false){
    if(!match||match.over||match.pending)return;
    if(action==='special'&&match.player.meter<100)return;
    clearInterval(timer);match.pending=true;
    const p=match.player,o=match.opponent;
    const rivalAction=aiMove(o,p);
    p.action=action;o.action=rivalAction;
    match.step++;match.instability++;
    if(p.lastAction===action){p.repeat++;p.combo=Math.min(3,p.combo+1)}else{p.repeat=0;p.combo=0}
    if(o.lastAction===rivalAction){o.repeat++;o.combo=Math.min(3,o.combo+1)}else{o.repeat=0;o.combo=0}
    // Guard and dodge decay deliberately reward mixing moves.
    p.guard=action==='defend'?p.guard+1:0;o.guard=rivalAction==='defend'?o.guard+1:0;
    p.dodge=action==='dodge'?p.dodge+1:0;o.dodge=rivalAction==='dodge'?o.dodge+1:0;
    p.charging=action==='charge';o.charging=rivalAction==='charge';
    if(action==='charge')p.meter=clamp(p.meter+(p.type==='Stamina'?18:15),0,100);
    if(rivalAction==='charge')o.meter=clamp(o.meter+(o.type==='Stamina'?18:15),0,100);
    let adaptationP=p.lastAction&&p.lastAction!==action?.05:0;
    let adaptationO=o.lastAction&&o.lastAction!==rivalAction?.05:0;
    p.lastAction=action;o.lastAction=rivalAction;
    const mbRate=(p.stats.MB>70?(p.stats.MB-70)*.005:0)+(o.stats.MB>70?(o.stats.MB-70)*.005:0);
    let collisionChance=.4+(p.stats.MB+o.stats.MB)/200+mbRate;
    if(action==='attack')collisionChance+=.15;
    if(rivalAction==='attack')collisionChance+=.15;
    if(action==='dodge')collisionChance-=.25*Math.max(.2,1-.1*p.dodge);
    if(rivalAction==='dodge')collisionChance-=.25*Math.max(.2,1-.1*o.dodge);
    collisionChance=clamp(collisionChance,.2,.9);
    $('collisionOdds').textContent=`COLLISION ${Math.round(collisionChance*100)}%`;
    const collided=Math.random()<collisionChance;
    let notes=[];
    if(collided){
      match.collisions++;
      p.pressure+=p.passive;o.pressure+=o.passive;p.passive=0;o.passive=0;
      resolveStrike(p,o,action,rivalAction,adaptationP,notes);
      if(!match.over)resolveStrike(o,p,rivalAction,action,adaptationO,notes);
      $('arenaScene').classList.add('impact');setTimeout(()=>$('arenaScene').classList.remove('impact'),450);
      $('actionFlash').textContent='CLASH!';$('actionFlash').classList.add('show');setTimeout(()=>$('actionFlash').classList.remove('show'),700);
      $('statusText').textContent=`Collision! ${MOVE_LABEL[action]} meets ${MOVE_LABEL[rivalAction]}`;
    }else{
      p.passive+=3;o.passive+=3;
      $('statusText').textContent='Near miss — pressure is building';
      notes.push('No collision. Passive pressure +3 each.');
    }
    applyEndTurn(p);applyEndTurn(o);
    if(timeout)notes.unshift('Timeout — you automatically braced.');
    if(action!==rivalAction)notes.push(`You ${MOVE_LABEL[action].toLowerCase()} / rival ${MOVE_LABEL[rivalAction].toLowerCase()}.`);
    const winner=checkWinner(p,o);
    if(winner)finish(winner,notes);
    else if(match.step>=match.maxSteps)finish(p.energy>=o.energy?'player':'opponent',notes,'TIME LIMIT');
    else{
      addLog(notes.join(' ')); match.pending=false; renderAll();startClock();
      $('actionHint').textContent=hintFor(action,rivalAction,collided);
    }
  }
  function hintFor(action,rival,collided){
    if(rival==='charge')return 'Rival is charging. Attack can punish an exposed spinner.';
    if(action==='charge'&&collided)return 'Charging into a collision hurts. Find a safer window to build meter.';
    if(action==='dodge')return 'Dodge reduces engagement odds, but repeated evasions lose effectiveness.';
    if(action==='defend')return 'Guard fatigue rises with repeated defense. Break the pattern to adapt.';
    if(action==='special')return 'Special spent your full meter. Watch recoil and capitalize on the impact.';
    if(!collided)return 'The bowl is tightening. Passive pressure carries into the next collision.';
    return 'Switch up your rhythm for a +5% adaptation bonus on your next move.';
  }
  function resolveStrike(attacker,defender,move,defenderMove,adaptation,notes){
    const s=attacker.stats,d=defender.stats;
    let impact=s.AP*(1+s.MB/120);
    const actionScale={attack:1.5,defend:.6,dodge:.7,charge:.5,special:5}[move];
    impact*=actionScale;
    if(attacker.type==='Attack')impact*=1.15;
    if(attacker.type==='Balance')impact*=1.05;
    if(s.AP>50)impact*=1+(s.AP-50)*.006;
    if(attacker.type==='Attack'&&isSpecialist(attacker))impact*=1.08;
    if(attacker.combo>=2)impact*=1+Math.min(.15,.05*(attacker.combo-1));
    if(attacker.lastAction&&attacker.repeat===0)impact*=1+adaptation;
    if(defenderMove==='dodge'||defenderMove==='charge')impact*=1.08;
    impact*=randomFactor();
    if(move==='special')attacker.meter=0;
    let reduction=0;
    if(defenderMove==='defend'){
      reduction=Math.max(.05,.20-.05*defender.guard);
      if(defender.type==='Defense')reduction+=.20;
    }
    if(defender.type==='Balance')reduction+=.05;
    if(d.ST>70)reduction+=(d.ST-70)*.005;
    if(defender.type==='Defense'&&defender.type==='Defense'&&d.ST+d.MS>=1.25*Math.max(d.AP+d.MB,d.SM))reduction+=.08;
    if(defender.charging)reduction=-.25;
    reduction=clamp(reduction,0,.7);
    const incoming=impact*(1-reduction);
    const effectiveST=Math.max(15,d.ST*(1-match.instability*.005));
    const stabilityLoss=incoming/effectiveST*10;
    defender.stability=clamp(defender.stability-stabilityLoss,0,100);
    defender.energy-=incoming/20*(defender.type==='Stamina'?.8:1)*(defender.charging?1.25:1);
    let recoil=incoming/Math.max(15,s.ST);
    if(attacker.type==='Defense')recoil*=.85;
    if(attacker.type==='Balance')recoil*=.95;
    if(attacker.combo>=2)recoil*=1+Math.min(.15,.05*(attacker.combo-1));
    attacker.energy-=recoil*(attacker.type==='Stamina'?.8:1);
    attacker.pressure+=incoming/Math.max(15,s.MS)*2;
    defender.pressure+=incoming/Math.max(15,d.MS)*2;
    let burst=incoming*(d.MS/d.LI)/1000;
    if(move==='charge'||defender.charging)burst*=1.2;
    if(defenderMove==='dodge'||defenderMove==='charge')burst+=.05;
    if(d.LI>50)burst*=Math.max(.15,1-(d.LI-50)*.007);
    if(defender.type==='Defense')burst*=.85;
    if(defender.charging)burst*=1.2;
    burst=clamp(burst,0,.5);
    if(Math.random()<burst){defender.burst=true;notes.push(`<strong class="log-danger">${defender.name} bursts!</strong>`);return}
    if(attacker.isPlayer)notes.push(`<strong class="log-good">Your ${MOVE_LABEL[move].toLowerCase()}</strong> deals ${incoming.toFixed(1)} impact.`);
    else notes.push(`<strong class="log-danger">Rival ${MOVE_LABEL[move].toLowerCase()}</strong> deals ${incoming.toFixed(1)} impact.`);
    if(move==='special')notes.push(`<strong>Special strike!</strong>`);
  }
  function applyEndTurn(state){
    if(state.burst)return;
    let drain=(1+state.stats.MB/80)*(state.type==='Stamina'?.8:1);
    if(state.pressure>70)drain+=state.pressure/50;
    if(state.stats.SM>70)drain*=Math.max(.3,1-(state.stats.SM-70)*.004);
    state.energy-=drain;
    // A little spin recovery from a deliberate charge, but its impact exposure remains.
    if(state.action==='charge')state.energy+=state.type==='Stamina'?2.2:1.5;
    state.energy=Math.min(state.maxEnergy,state.energy);
  }
  function checkWinner(p,o){
    if(p.burst)return 'opponent';if(o.burst)return 'player';
    if(p.pressure>120&&ringOut(p))return 'opponent';if(o.pressure>120&&ringOut(o))return 'player';
    if(p.energy<=0&&o.energy<=0)return p.energy>o.energy?'player':'opponent';
    if(p.energy<=0)return 'opponent';if(o.energy<=0)return 'player';
    return null;
  }
  function ringOut(state){const excess=state.pressure-120;const resistance=state.stats.MS>70?(state.stats.MS-70)*.005:0;return Math.random()<clamp(.24+excess*.012-resistance, .12,.82)}
  function finish(winner,notes=[],reason=''){match.over=true;match.pending=true;clearInterval(timer);addLog(`${notes.join(' ')} <strong>${winner==='player'?'You win!':'Rival wins.'}</strong>`);renderAll();const win=winner==='player';$('resultMark').textContent=win?'✦':'↻';$('resultTitle').textContent=reason|| (win?'VICTORY':'DEFEAT');$('resultTitle').style.color=win?'#d2b8ff':'#ff9b8b';$('resultCopy').textContent=reason?`Match went the distance. ${win?'Your spin outlasted the rival.':'The rival held more spin energy.'}`:win?`Your ${build.core} found its moment in the bowl.`:'The rival took the match. Adjust your build and try a new line.';$('resultStep').textContent=String(match.step).padStart(2,'0');$('resultStats').innerHTML=`<div class="result-stat"><span>COLLISIONS</span><b>${match.collisions}</b></div><div class="result-stat"><span>YOUR SPIN</span><b>${Math.max(0,Math.round(match.player.energy))}</b></div><div class="result-stat"><span>RIVAL SPIN</span><b>${Math.max(0,Math.round(match.opponent.energy))}</b></div>`;$('resultOverlay').classList.remove('hidden')}
  function renderAll(){if(!match)return;renderFighter(match.player,'player');renderFighter(match.opponent,'opponent');$('stepNum').textContent=String(Math.min(match.step+1,24)).padStart(2,'0');$('actionStep').textContent=String(match.step+1).padStart(2,'0');$('instabilityNum').textContent=String(match.instability+1).padStart(2,'0');$('specialButton').disabled=match.player.meter<100||match.pending||match.over;document.querySelectorAll('.action-button:not(#specialButton)').forEach(b=>b.disabled=match.pending||match.over);$('specialHint').textContent=match.player.meter>=100?'Unleash · ×5 impact':'Needs '+Math.max(0,100-match.player.meter)+'% more charge';$('adaptHint').style.visibility=match.player.lastAction?'visible':'hidden';renderLog()}
  function renderFighter(s,prefix){const player=prefix==='player';const energy=clamp(s.energy/s.maxEnergy*100,0,100);$(`${prefix}EnergyText`).textContent=Math.max(0,Math.round(s.energy));$(`${prefix}EnergyBar`).style.width=energy+'%';$(`${prefix}PressureText`).innerHTML=`${Math.round(s.pressure)} <small>/ 120</small>`;$(`${prefix}PressureBar`).style.width=clamp(s.pressure/120*100,0,100)+'%';$(`${prefix}Meter`).textContent=Math.round(s.meter)+'%';$(`${prefix}ChargeBar`).style.width=s.meter+'%';$(`${prefix}Combo`).textContent=`COMBO ×${s.combo}`;if(player){$('playerTitle').textContent=s.core;$('playerNameArena').textContent=s.core.toUpperCase();$('playerType').textContent=s.type.toUpperCase()+' TYPE';$('playerStats').innerHTML=statRows(s.stats);$('sideType').textContent=s.type.toUpperCase()+' TYPE';$('typeDescription').textContent=typeDescription(s.type);$('typeBonus').textContent=s.type==='Balance'?'+5%':s.type==='Attack'?'+15%':s.type==='Defense'?'−20%':'−20%';$('coreLabel').textContent=s.core.toUpperCase();const c=CORE_DATA.find(x=>x.name===s.core);if(c){document.querySelector('.player-blade').style.background=`conic-gradient(from 5deg,${c.accent},${c.color}55,${c.accent},${c.color}88,${c.accent},#29395f,${c.accent})`;document.querySelector('.showcase-blade').style.background=`conic-gradient(${c.accent},${c.color}66,${c.accent},${c.color}88,${c.accent})`;}}else{$('opponentType').textContent=s.type.toUpperCase()+' TYPE';}}
  function statRows(s){return [['AP',s.AP],['ST',s.ST],['SM',s.SM],['MB',s.MB],['MS',s.MS],['LI',s.LI]].map(([key,val])=>`<div class="stat-row"><span>${key}</span><div class="stat-track"><i style="width:${val}%"></i></div><b>${val}</b></div>`).join('')}
  function renderLog(){$('logList').innerHTML=match.log.map(entry=>`<div class="log-entry"><span class="log-step">${entry.step}</span><span>${entry.html}</span></div>`).join('')}
  function renderBuilder(){
    const s=statsOf(build),type=classify(s);$('apSlider').value=build.ap;$('msSlider').value=build.ms;$('mbSlider').value=build.mb;
    $('coreOptions').innerHTML=CORE_DATA.map(c=>`<button class="core-option ${c.name===build.core?'selected':''}" data-core="${c.name}" style="--gem:${c.color}"><i class="core-gem"></i>${c.name}</button>`).join('');
    $('coreOptions').querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>{build.core=button.dataset.core;renderBuilder()}));
    $('apValue').textContent=s.AP;$('liValue').textContent=`${s.LI} LI`;$('msValue').textContent=s.MS;$('stValue').textContent=`${s.ST} ST`;$('mbValue').textContent=s.MB;$('smValue').textContent=`${s.SM} SM`;
    for(const [id,value,max] of [['apSlider',s.AP,80],['msSlider',s.MS,100],['mbSlider',s.MB,100]])$(id).style.background=`linear-gradient(90deg,#bb9cf4 ${value/max*100}%,#393640 ${value/max*100}%)`;
    $('previewName').textContent=build.core;$('previewType').textContent=type.toUpperCase();$('previewDomain').textContent=type==='Balance'?'WELL ROUNDED':`${type.toUpperCase()} SPECIALIST`;
    for(const [id,key] of [['previewAP','AP'],['previewST','ST'],['previewSM','SM'],['previewMB','MB'],['previewMS','MS'],['previewLI','LI']])$(id).textContent=s[key];
    const c=CORE_DATA.find(x=>x.name===build.core);if(c){$('previewName').style.color=c.accent;document.querySelector('.preview-top').style.background=`conic-gradient(${c.accent},${c.color}66,${c.accent},${c.color}88,${c.accent})`}
  }
  function saveBuild(){localStorage.setItem('spinClashBuild',JSON.stringify(build));if(match&&!match.over)newMatch();else{match=null;newMatch()}toast(`${build.core} build saved · back to the bowl`);setView('battle')}
  function resetBuild(){build={...DEFAULT_BUILD};renderBuilder()}

  document.querySelectorAll('.nav-link').forEach(button=>button.addEventListener('click',()=>setView(button.dataset.view)));
  document.querySelectorAll('.action-button').forEach(button=>button.addEventListener('click',()=>takeTurn(button.dataset.action)));
  document.addEventListener('keydown',event=>{if(currentView!=='battle'||$('resultOverlay').classList.contains('hidden')===false)return;const actions={'1':'attack','2':'defend','3':'dodge','4':'charge','5':'special'};if(actions[event.key])takeTurn(actions[event.key])});
  $('newMatch').addEventListener('click',()=>{newMatch();toast('Fresh match. Spin up!')});
  $('editBuild').addEventListener('click',()=>setView('garage'));$('sideEdit').addEventListener('click',()=>setView('garage'));$('loadoutButton').addEventListener('click',()=>setView('garage'));
  $('garageBattle').addEventListener('click',()=>setView('battle'));$('guideBattle').addEventListener('click',()=>setView('battle'));
  $('apSlider').addEventListener('input',e=>{build.ap=+e.target.value;renderBuilder()});$('msSlider').addEventListener('input',e=>{build.ms=+e.target.value;renderBuilder()});$('mbSlider').addEventListener('input',e=>{build.mb=+e.target.value;renderBuilder()});
  $('saveBuild').addEventListener('click',saveBuild);$('previewBattle').addEventListener('click',saveBuild);$('resetBuild').addEventListener('click',resetBuild);
  $('resultRematch').addEventListener('click',()=>{newMatch();toast('Run it back!')});$('resultGarage').addEventListener('click',()=>{$('resultOverlay').classList.add('hidden');setView('garage')});$('resultOverlay').addEventListener('click',e=>{if(e.target===$('resultOverlay'))$('resultOverlay').classList.add('hidden')});
  // Build profiles are also valid by construction when edited: each paired stat keeps its fixed sum.
  renderBuilder();newMatch();
})();
