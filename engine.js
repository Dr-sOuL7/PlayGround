// Deterministic, UI-independent combat rules for BEYBLADE: ARENA.
// All probability-like values are clamped to [0, 1]; combat output is finite and bounded.
export const CORES = [
  ['Aetherion','#68e6ff'],['Draknor','#ff725f'],['Veltrix','#ffbc58'],['Nyxalon','#a48cff'],['Pyronis','#ff645d'],
  ['Zephyros','#73e4c4'],['Gravion','#9aa8be'],['Luminara','#ffe47b'],['Obsidrax','#a8b7c8'],['Crysalix','#8ed8ff'],
  ['Voltaris','#ffe36a'],['Umbros','#ba8cff'],['Solvane','#ff9874'],['Tyralis','#8bffa8'],['Noctyra','#d4a0ff']
].map(([name,color], index) => ({ id: `C${String(index+1).padStart(2,'0')}`, name, color }));

export const BLADES = [[40,40],[50,30],[60,20],[30,50],[20,60],[55,25],[45,35],[35,45]]
  .map(([ap,li],i)=>({id:`B${String(i+1).padStart(2,'0')}`,ap,li}));
export const DISCS = [[50,50],[65,35],[80,20],[35,65],[20,80],[70,30],[60,40],[40,60]]
  .map(([ms,st],i)=>({id:`D${String(i+1).padStart(2,'0')}`,ms,st}));
export const TIPS = [[50,50],[70,30],[85,15],[30,70],[15,85],[60,40],[40,60],[75,25]]
  .map(([mb,sm],i)=>({id:`T${String(i+1).padStart(2,'0')}`,mb,sm}));
export const COMPONENT_COUNT = CORES.length * BLADES.length * DISCS.length * TIPS.length;
export const ACTIONS = ['attack','defend','dodge','charge','special'];
export const ACTION_LABELS = {attack:'Attack',defend:'Defense',dodge:'Dodge',charge:'Charge',special:'Special'};
const clamp = (n,min,max) => Math.max(min,Math.min(max,n));
const round = (n,d=1) => Number(n.toFixed(d));

export function makeBuild({core='C01',blade='B01',disc='D01',tip='T01',name='Aetherion'}) {
  const c=CORES.find(x=>x.id===core)||CORES[0], b=BLADES.find(x=>x.id===blade)||BLADES[0], d=DISCS.find(x=>x.id===disc)||DISCS[0], t=TIPS.find(x=>x.id===tip)||TIPS[0];
  // Component conservation is preserved: each choice trades one paired stat for another.
  const stats={
    attack:round(clamp(50+(b.ap-40)*.62+(t.mb-50)*.18,20,80)),
    defense:round(clamp(50+(b.li-40)*.34+(d.st-50)*.34+(t.sm-50)*.22,20,80)),
    mobility:round(clamp(50+(t.mb-50)*.47+(d.ms-50)*.16+(b.ap-40)*.12,20,80)),
    stamina:round(clamp(50+(d.st-50)*.43+(t.sm-50)*.33+(b.li-40)*.14,20,80)),
    balance:round(clamp(50+(b.li-40)*.18+(d.ms-50)*.25+(t.sm-50)*.26,20,80))
  };
  const sorted=Object.entries(stats).sort((a,b)=>b[1]-a[1]);
  const classification=sorted[0][1]<55||sorted[0][0]==='balance'?'Balanced':sorted[0][0][0].toUpperCase()+sorted[0][0].slice(1);
  return {core:c.id,coreName:c.name,color:c.color,blade:b.id,disc:d.id,tip:t.id,name,stats,classification};
}

export function createBattle(buildA, buildB, seed=0x5eed) {
  return {
    turn:1, seed:seed>>>0, over:false, winner:null, reason:null,
    fighters:[buildA,buildB].map((build,i)=>({build,energy:100,stability:100,position:30,momentum:0,defenseFatigue:0,dodgeDecay:0,initiative:i===0?1:0,adaptation:null,specialCooldown:0,bursts:0})),
    log:[{turn:0,text:'LAUNCH! Both bladers enter the arena.',kind:'system'}],
    totals:{bursts:0,ringOuts:0,spinFinishes:0}
  };
}
function rand(state) { state.seed=(Math.imul(state.seed,1664525)+1013904223)>>>0; return state.seed/4294967296; }
function adapt(fighter, action) { return fighter.adaptation===action ? 0 : fighter.adaptation ? 0.06 : 0; }
function finish(state, winner, reason) {
  state.over=true; state.winner=winner; state.reason=reason;
  if(reason==='Burst') state.totals.bursts++;
  if(reason==='Ring-Out') state.totals.ringOuts++;
  if(reason==='Spin Finish') state.totals.spinFinishes++;
}

export function resolveTurn(state, actionA, actionB) {
  if(state.over) throw new Error('Match is already complete.');
  if(!ACTIONS.includes(actionA)||!ACTIONS.includes(actionB)) throw new Error('Choose a valid combat action.');
  const actions=[actionA,actionB], f=state.fighters, events=[];
  const initiative=f[0].build.stats.mobility+f[0].momentum >= f[1].build.stats.mobility+f[1].momentum ? 0:1;
  f.forEach((x,i)=>{ x.initiative=i===initiative?1:0; x.defenseFatigue=Math.max(0,x.defenseFatigue-.06); x.dodgeDecay=Math.max(0,x.dodgeDecay-.09); x.specialCooldown=Math.max(0,x.specialCooldown-1); });

  // Setup phase. Charge restores energy; defensive stances reduce damage but fatigue accumulates.
  for(let i=0;i<2;i++){
    const x=f[i], action=actions[i];
    if(action==='charge') { const gain=clamp(11+x.build.stats.stamina*.10-x.energy*.025,5,16); x.energy=clamp(x.energy+gain,0,100); x.momentum=clamp(x.momentum+.10,0,.7); events.push(`${x.build.name} charges +${Math.round(gain)} energy.`); }
    if(action==='defend') { x.defenseFatigue=clamp(x.defenseFatigue+.10,0,.5); x.position=Math.max(0,x.position-5); }
  }
  // Collisions are resolved simultaneously; stochastic collision checks have explicit bounds.
  const hits=[false,false], impacts=[0,0];
  for(let i=0;i<2;i++){
    const j=1-i, x=f[i], target=f[j], action=actions[i], targetAction=actions[j];
    if(!['attack','special'].includes(action)) continue;
    if(action==='special' && (x.energy<20||x.specialCooldown>0)) { events.push(`${x.build.name}'s Special is unavailable — energy preserved.`); continue; }
    const special=action==='special';
    if(special){ x.energy=clamp(x.energy-20,0,100); x.specialCooldown=2; }
    const base=action==='attack'?.57:.68;
    const collision=clamp(base+(x.build.stats.mobility-50)*.003+(x.momentum*.12)+(x.position-target.position)*.0015-(targetAction==='dodge'?.30:0)-target.dodgeDecay, .08,.94);
    if(rand(state)>=collision){ events.push(`${x.build.name} misses (${Math.round(collision*100)}% collision chance).`); continue; }
    hits[i]=true;
    const actionScale=special?1.55:1;
    const attack=(x.build.stats.attack*.42+25+x.momentum*14)*actionScale*(1+adapt(x,action));
    const guard=targetAction==='defend'?target.build.stats.defense*.42+18+target.defenseFatigue*22:target.build.stats.defense*.12+7;
    const evade=targetAction==='dodge'?target.build.stats.mobility*.19+target.dodgeDecay*18:0;
    const impact=clamp((attack-guard-evade)*(.70+rand(state)*.38),2,64);
    impacts[i]=impact;
    const stabilityDamage=clamp(impact*(.74+(100-target.stability)*.004),1,55);
    target.stability=clamp(target.stability-stabilityDamage,0,100);
    target.energy=clamp(target.energy-impact*(special?.34:.20),0,100);
    const pressure=clamp((x.build.stats.attack-target.build.stats.defense)*.0018+impact*.009+(special?.08:0),.02,.52);
    target.position=clamp(target.position+pressure*20+(rand(state)-.5)*2,0,105);
    x.momentum=clamp(x.momentum+.17+(special?.1:0),0,.7);
    x.position=clamp(x.position-3,0,105);
    events.push(`${x.build.name} ${special?'unleashes SPECIAL':'strikes'} for ${Math.round(impact)} impact.`);
    const burstChance=clamp(.015+(100-target.stability)*.0014+Math.max(0,impact-32)*.002,0,.22);
    if(target.stability<=0 || rand(state)<burstChance){ target.bursts++; finish(state,i,'Burst'); events.push(`${target.build.name} BURST!`); break; }
  }
  // Defensive resource decay is paid even on a missed collision, preventing infinite stall loops.
  for(let i=0;i<2&&!state.over;i++){
    const x=f[i], action=actions[i];
    if(action==='defend') x.energy=clamp(x.energy-3.5-x.defenseFatigue*4,0,100);
    else if(action==='dodge'){ x.dodgeDecay=clamp(x.dodgeDecay+.12,0,.5); x.energy=clamp(x.energy-5,0,100); x.position=Math.max(0,x.position-2); }
    else if(action==='attack') x.energy=clamp(x.energy-5,0,100);
    x.momentum=clamp(x.momentum*.76,0,.7);
    x.adaptation=action;
  }
  if(!state.over){
    const out=f.map(x=>x.position>=100);
    if(out[0]||out[1]){ const winner=out[0]&&out[1]?(f[0].energy>=f[1].energy?0:1):out[0]?1:0; finish(state,winner,'Ring-Out'); events.push(`${f[1-winner].build.name} is knocked out of the ring!`); }
    else if(f.some(x=>x.energy<=0)){ const winner=f[0].energy===f[1].energy?-1:f[0].energy>f[1].energy?0:1; finish(state,winner,'Spin Finish'); events.push(winner<0?'Both Beys lose spin!':'Spin Finish!'); }
    else if(state.turn>=30){ const score=f.map(x=>x.energy*.48+x.stability*.34+(100-x.position)*.18); finish(state,score[0]===score[1]?-1:score[0]>score[1]?0:1,'Time Limit'); events.push('Time limit — judges score the match.'); }
  }
  state.log.push({turn:state.turn,text:events.join(' '),kind:state.over?'result':hits.some(Boolean)?'impact':'turn'});
  state.turn++;
  return state;
}

export function validateContent() {
  if(COMPONENT_COUNT!==7680) throw new Error(`Expected 7680 builds, got ${COMPONENT_COUNT}`);
  for(const x of BLADES) if(x.ap+x.li!==80) throw new Error(`Blade tradeoff failed: ${x.id}`);
  for(const x of DISCS) if(x.ms+x.st!==100) throw new Error(`Disc tradeoff failed: ${x.id}`);
  for(const x of TIPS) if(x.mb+x.sm!==100) throw new Error(`Tip tradeoff failed: ${x.id}`);
  return true;
}
