import * as THREE from 'three';

const PARTS = {
  core: [
    {name:'Astra', avatar:'Astral Pulse', icon:'✦', spin:0, burst:0, mass:0, inertia:0, grip:0, avatarText:'An expanding pulse disrupts nearby rivals and restores your balance.', color:'#63d9eb', ability:'pulse'},
    {name:'Bastion', avatar:'Aegis Ward', icon:'⬡', spin:-4, burst:16, mass:0.16, inertia:0.2, grip:0.08, avatarText:'A brief guard absorbs the next impact and steadies your spin.', color:'#a5d19b', ability:'guard'},
    {name:'Vesper', avatar:'Void Step', icon:'✧', spin:10, burst:-11, mass:-0.08, inertia:-0.08, grip:-0.03, avatarText:'A quick phase-shift grants a clean burst of speed and evasion.', color:'#c7a6ff', ability:'step'}
  ],
  blade: [
    {name:'Vanguard', spin:0, burst:0, mass:0, inertia:0, grip:0, attack:1, drag:1, color:'#72c9e6', desc:'Balanced contact · steady spin'},
    {name:'Ripper', spin:-7, burst:-4, mass:0.08, inertia:0.05, grip:-0.04, attack:1.55, drag:1.07, color:'#e8a56c', desc:'Heavy striking points · higher recoil'},
    {name:'Halo', spin:10, burst:7, mass:-0.06, inertia:-0.04, grip:0.07, attack:.7, drag:.88, color:'#9bb8ff', desc:'Smooth perimeter · efficient endurance'}
  ],
  disc: [
    {name:'Orbit', spin:0, burst:0, mass:0, inertia:0, grip:0, drag:1, color:'#8a8df0', desc:'Even weight distribution · balanced'},
    {name:'Anvil', spin:-5, burst:12, mass:0.2, inertia:0.22, grip:-0.08, drag:1.1, color:'#a8abb4', desc:'Dense and stable · slow acceleration'},
    {name:'Feather', spin:9, burst:-8, mass:-0.13, inertia:-0.16, grip:0.1, drag:.84, color:'#7cdbc0', desc:'Light and agile · easier to knock out'}
  ],
  tip: [
    {name:'Glide', spin:2, burst:0, mass:0, inertia:0, grip:0, friction:.13, accel:1, color:'#78d5bf', desc:'Low friction · smooth wide circles'},
    {name:'Anchor', spin:-5, burst:14, mass:0.04, inertia:0.02, grip:.35, friction:.2, accel:.8, color:'#dcb47a', desc:'Strong grip · holds position under impact'},
    {name:'Rush', spin:-1, burst:-6, mass:-.03, inertia:-.03, grip:-.15, friction:.07, accel:1.28, color:'#ed8e9c', desc:'High acceleration · unstable at low spin'}
  ]
};
const BASE={core:PARTS.core[0],blade:PARTS.blade[0],disc:PARTS.disc[0],tip:PARTS.tip[0]};
const $=s=>document.querySelector(s);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const vec=(x=0,z=0)=>new THREE.Vector3(x,0,z);
const state={build:{...BASE},draft:{...BASE}, launched:false, phase:'standby', phaseTime:10, round:1, points:[0,0], fighters:[], actionUsed:false, avatarUsed:false, camera:'top', mode:'1v1', bot:{personality:'tactician',difficulty:'standard'}, sound:true, matchOver:false, tiltTime:0, keys:new Set(), joy:{x:0,y:0}, toastTimer:null};

let scene,camera,renderer,arenaRoot,bees=[],raf,lastFrame=0,accumulator=0, audioCtx;
const FIXED=1/60, RADIUS=6.1;
function makeMaterial(color,metalness=.7,roughness=.28){return new THREE.MeshStandardMaterial({color,metalness,roughness});}
function setupScene(){
  const host=$('#arena-canvas');scene=new THREE.Scene();scene.background=new THREE.Color('#101821');scene.fog=new THREE.Fog('#101821',17,39);
  camera=new THREE.PerspectiveCamera(42,1,.1,100);renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.7));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;host.appendChild(renderer.domElement);
  scene.add(new THREE.HemisphereLight('#a9d8ef','#141923',2));const key=new THREE.DirectionalLight('#e5f6ff',3.3);key.position.set(-5,10,6);scene.add(key);const rim=new THREE.PointLight('#3f9bc1',20,22);rim.position.set(6,5,-4);scene.add(rim);const redLight=new THREE.PointLight('#a93a55',13,17);redLight.position.set(-7,3,4);scene.add(redLight);
  arenaRoot=new THREE.Group();scene.add(arenaRoot);makeStadium();makeEnvironment();setCamera('top');resize();window.addEventListener('resize',resize);animate(0);
}
function makeStadium(){
  const floor=new THREE.Mesh(new THREE.CylinderGeometry(RADIUS, RADIUS+.4,.42,128,1,false),makeMaterial('#263442',.68,.37));floor.position.y=-.28;arenaRoot.add(floor);
  const bowl=new THREE.Mesh(new THREE.CylinderGeometry(RADIUS+.5,RADIUS+.5,.7,128,1,true),new THREE.MeshStandardMaterial({color:'#162331',metalness:.7,roughness:.36,side:THREE.DoubleSide}));bowl.position.y=-.15;arenaRoot.add(bowl);
  const inset=new THREE.Mesh(new THREE.CircleGeometry(RADIUS-.08,128),makeMaterial('#172634',.35,.49));inset.rotation.x=-Math.PI/2;inset.position.y=-.065;arenaRoot.add(inset);
  const ring=(r,y,color,opacity=1,tube=.028)=>{const m=new THREE.Mesh(new THREE.TorusGeometry(r,tube,8,160),new THREE.MeshBasicMaterial({color,transparent:opacity<1,opacity}));m.rotation.x=Math.PI/2;m.position.y=y;arenaRoot.add(m);};
  ring(RADIUS-.2,.015,'#48748b',.85,.035);ring(RADIUS*.69,.004,'#34536a',.58,.018);ring(RADIUS*.36,.003,'#35566c',.48,.014);ring(RADIUS+.12,.04,'#71c6de',.72,.045);
  const center=new THREE.Mesh(new THREE.CircleGeometry(.65,64),new THREE.MeshBasicMaterial({color:'#253e4b',transparent:true,opacity:.8}));center.rotation.x=-Math.PI/2;center.position.y=.008;arenaRoot.add(center);
  // Radial etched stadium detailing.
  for(let i=0;i<32;i++){const a=i/32*Math.PI*2;const geo=new THREE.BoxGeometry(.012,.008, RADIUS*1.72);const line=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:i%4===0?'#526f7e':'#334a5b',transparent:true,opacity:i%4===0?.45:.22}));line.position.set(Math.sin(a)*RADIUS*.55,.012,Math.cos(a)*RADIUS*.55);line.rotation.y=a;arenaRoot.add(line);}
  const outer=new THREE.Mesh(new THREE.TorusGeometry(RADIUS+.42,.18,12,128),makeMaterial('#394b5a',.85,.24));outer.rotation.x=Math.PI/2;outer.position.y=.13;arenaRoot.add(outer);
  for(let i=0;i<12;i++){const a=i/12*Math.PI*2;const post=new THREE.Mesh(new THREE.CylinderGeometry(.13,.16,.28,12),makeMaterial(i%3===0?'#68c4d6':'#445868',.8,.22));post.position.set(Math.sin(a)*(RADIUS+.34),.1,Math.cos(a)*(RADIUS+.34));arenaRoot.add(post);}
}
function makeEnvironment(){
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshStandardMaterial({color:'#0a1018',roughness:.9,metalness:.12}));floor.rotation.x=-Math.PI/2;floor.position.y=-.68;scene.add(floor);
 const grid=new THREE.GridHelper(80,60,'#253746','#18232e');grid.position.y=-.675;grid.material.transparent=true;grid.material.opacity=.3;scene.add(grid);
}
function makeBey(team,build){
 const root=new THREE.Group();const spinGroup=new THREE.Group();root.add(spinGroup);
 const primary=team===0?'#58c9ee':'#ff657e';const accent=team===0?'#a8eeff':'#ffc0a5';const gold=team===0?'#d4b77a':'#d6a5af';
 const metal=makeMaterial(primary,.82,.22), bright=makeMaterial(accent,.72,.24), dark=makeMaterial(team===0?'#223c4c':'#512c3a',.86,.28), discMat=makeMaterial(gold,.9,.27);
 const disc=new THREE.Mesh(new THREE.CylinderGeometry(.83,.82,.2,48),discMat);disc.position.y=.2;spinGroup.add(disc);
 const outer=new THREE.Mesh(new THREE.TorusGeometry(.92,.12,12,64),metal);outer.rotation.x=Math.PI/2;outer.position.y=.35;spinGroup.add(outer);
 const bladeRing=new THREE.Mesh(new THREE.TorusGeometry(.69,.13,10,48),bright);bladeRing.rotation.x=Math.PI/2;bladeRing.position.y=.42;spinGroup.add(bladeRing);
 for(let i=0;i<6;i++){
  const a=i/6*Math.PI*2;const shape=new THREE.Mesh(new THREE.ConeGeometry(.22,.62,5),i%2?metal:bright);shape.rotation.x=Math.PI/2;shape.rotation.z=-Math.PI/2;shape.rotation.y=a;shape.position.set(Math.sin(a)*.67,.43,Math.cos(a)*.67);spinGroup.add(shape);
  const rivet=new THREE.Mesh(new THREE.SphereGeometry(.055,8,6),discMat);rivet.position.set(Math.sin(a)*.72,.49,Math.cos(a)*.72);spinGroup.add(rivet);
 }
 const hub=new THREE.Mesh(new THREE.CylinderGeometry(.36,.43,.22,32),dark);hub.position.y=.52;spinGroup.add(hub);
 const core=new THREE.Mesh(new THREE.CylinderGeometry(.26,.26,.18,32),metal);core.position.y=.68;spinGroup.add(core);
 const gem=new THREE.Mesh(new THREE.OctahedronGeometry(.17,1),bright);gem.position.y=.8;spinGroup.add(gem);
 const tip=new THREE.Mesh(new THREE.ConeGeometry(.14,.28,20),makeMaterial('#dce5eb',.7,.22));tip.position.y=-.03;spinGroup.add(tip);
 const shadow=new THREE.Mesh(new THREE.CircleGeometry(1.05,32),new THREE.MeshBasicMaterial({color:team===0?'#159dcc':'#e33c59',transparent:true,opacity:.09,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.013;root.add(shadow);
 const aura=new THREE.Mesh(new THREE.TorusGeometry(1.04,.025,8,48),new THREE.MeshBasicMaterial({color:team===0?'#58c9ee':'#ff657e',transparent:true,opacity:.6}));aura.rotation.x=Math.PI/2;aura.position.y=.04;root.add(aura);
 scene.add(root);
 const reserves=buildStats(build);
  return {team,root,spinGroup,parts:build, pos:vec(team===0?-2.25:2.25,team===0?-.3:.3),vel:vec(team===0?1.15:-1.05,team===0?.42:-.25),heading:team===0?.28:Math.PI-.2,spin:reserves.spin,burst:reserves.burst,spinAngle:0,tilt:0,tiltTimer:0,flash:0,attack:build.blade.attack,invuln:0,botThink:0,visual:{aura},mass:1+build.core.mass+build.disc.mass+build.blade.mass, inertia:1+build.core.inertia+build.disc.inertia+build.blade.inertia, grip:.2+build.core.grip+build.disc.grip+build.tip.grip, friction:build.tip.friction*build.blade.drag*build.disc.drag, accel:build.tip.accel, maxSpeed:5.2};
}
function disposeBeys(){for(const b of bees){scene.remove(b.root);b.root.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material)o.material.dispose();});}bees=[];}
function setCamera(which){state.camera=which;document.querySelectorAll('.camera-btn').forEach(b=>b.classList.toggle('active',b.dataset.camera===which));if(!camera)return;const poses={top:[0,17,.01],side:[0,7,17],pov:[-6,9,10]};const p=poses[which];camera.position.set(...p);camera.lookAt(0,0,0);camera.fov=which==='top'?42:which==='pov'?48:39;camera.updateProjectionMatrix();}
function resize(){if(!renderer)return;const el=$('#arena-canvas');const w=Math.max(el.clientWidth,1),h=Math.max(el.clientHeight,1);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
function animate(ts){raf=requestAnimationFrame(animate);const t=ts/1000;let dt=Math.min(.05,(ts-lastFrame)/1000||0);lastFrame=ts;if(state.launched&&!state.matchOver){accumulator+=dt;while(accumulator>=FIXED){step(FIXED);accumulator-=FIXED;}}updateVisuals(dt,t);renderer.render(scene,camera);}
function step(dt){
 if(state.phase==='auto'||state.phase==='manual'){
  state.phaseTime-=dt;if(state.phaseTime<=0){state.phase=state.phase==='auto'?'manual':'auto';state.phaseTime=10;state.actionUsed=false;if(state.phase==='manual')toast('MANUAL CONTROL · CHOOSE YOUR ACTION');else toast('AUTONOMOUS PHYSICS · READ THE CLASH');updatePhaseUI();}
 }
 const [player,rival]=bees;if(!player||!rival)return;
 if(state.phase==='auto'){driveAuto(player,rival,dt,true);driveAuto(rival,player,dt,false);}else if(state.phase==='manual'){driveManual(player,dt);driveAuto(rival,player,dt,false);}
 for(const b of bees)integrate(b,dt);
 collide(player,rival,dt);
 for(const b of bees){if(b.spin<=0){finish(1-b.team,'SPIN FINISH');return;}if(b.burst<=0){finish(1-b.team,'BURST FINISH');return;}if(Math.hypot(b.pos.x,b.pos.z)>RADIUS+.22){finish(1-b.team,'RING OUT');return;}}
 updateHUD();
}
function driveAuto(b,target,dt,isPlayer){
 const dx=target.pos.x-b.pos.x,dz=target.pos.z-b.pos.z,d=Math.hypot(dx,dz)||1;const personality=state.bot.personality;let desired;
 if(personality==='survivor'&&!isPlayer){desired=vec(-dz/d,dx/d);if(Math.hypot(b.pos.x,b.pos.z)>4)desired=vec(-b.pos.x/Math.hypot(b.pos.x,b.pos.z),-b.pos.z/Math.hypot(b.pos.x,b.pos.z));}
 else if(personality==='aggressive'&&!isPlayer){desired=vec(dx/d,dz/d);}
 else if(personality==='chaotic'&&!isPlayer){b.botThink-=dt;if(b.botThink<=0){b.botThink=.7+Math.random()*1.7;b.wander=Math.random()*Math.PI*2;}desired=vec(Math.cos(b.wander||0),Math.sin(b.wander||0));if(d<2.1)desired=vec(dx/d,dz/d);}
 else {const orbit=vec(-dz/d,dx/d);desired=vec(dx/d*.36+orbit.x*.92,dz/d*.36+orbit.z*.92);if(d>4.5)desired=vec(dx/d,dz/d);}
 const n=desired.length()||1;desired.multiplyScalar(1/n);const baseStrength=personality==='aggressive'&&!isPlayer?2.45:1.35;const difficultyScale=state.bot.difficulty==='casual'?.78:state.bot.difficulty==='expert'?1.18:1;const strength=baseStrength*difficultyScale;
 b.vel.x+=desired.x*strength*dt*b.accel;b.vel.z+=desired.z*strength*dt*b.accel;b.heading=lerpAngle(b.heading,Math.atan2(desired.x,desired.z),dt*1.5);
}
function driveManual(b,dt){
 let x=state.joy.x,z=state.joy.y;if(state.keys.has('ArrowLeft')||state.keys.has('a'))x-=1;if(state.keys.has('ArrowRight')||state.keys.has('d'))x+=1;if(state.keys.has('ArrowUp')||state.keys.has('w'))z-=1;if(state.keys.has('ArrowDown')||state.keys.has('s'))z+=1;const n=Math.hypot(x,z);if(n>1){x/=n;z/=n;}if(Math.abs(x)+Math.abs(z)>.05){b.vel.x+=x*2.35*dt*b.accel;b.vel.z+=z*2.35*dt*b.accel;b.heading=lerpAngle(b.heading,Math.atan2(x,-z),dt*2.2);}
}
function integrate(b,dt){
 const radius=Math.hypot(b.pos.x,b.pos.z);if(radius>4.65){const nx=b.pos.x/radius,nz=b.pos.z/radius,outward=Math.max(0,b.vel.x*nx+b.vel.z*nz),edge=clamp((radius-4.65)/(RADIUS-4.65),0,1),brake=Math.min(outward,(2.5+edge*4)*dt);b.vel.x-=nx*brake;b.vel.z-=nz*brake;}
 const speed=Math.hypot(b.vel.x,b.vel.z);const spinFactor=Math.max(.15,b.spin/100);const friction=b.friction*(1.15-b.grip*.6);const damping=Math.max(0,1-friction*dt);b.vel.multiplyScalar(damping);const max=b.maxSpeed*(.48+spinFactor*.52);if(speed>max)b.vel.multiplyScalar(max/speed);b.pos.x+=b.vel.x*dt;b.pos.z+=b.vel.z*dt;
 b.spin=Math.max(0,b.spin-(.38+b.friction*2.05+speed*.085)*dt);b.spinAngle+=(5.5+spinFactor*23)*dt*(b.team===0?1:-1);b.tiltTimer=Math.max(0,b.tiltTimer-dt);b.invuln=Math.max(0,b.invuln-dt);b.tilt=lerp(b.tilt, b.tiltTimer>0?.25:0,dt*3);
}
function collide(a,b,dt){
 const dx=b.pos.x-a.pos.x,dz=b.pos.z-a.pos.z,d=Math.hypot(dx,dz)||.001,min=1.58;if(d>=min)return;const nx=dx/d,nz=dz/d,overlap=min-d;const relative=(b.vel.x-a.vel.x)*nx+(b.vel.z-a.vel.z)*nz;const restitution=.83;const impulse=Math.max(0,-relative)*(1+restitution)/(1/a.mass+1/b.mass);
 a.vel.x-=impulse*nx/a.mass;a.vel.z-=impulse*nz/a.mass;b.vel.x+=impulse*nx/b.mass;b.vel.z+=impulse*nz/b.mass;
 a.pos.x-=nx*overlap*(b.mass/(a.mass+b.mass));a.pos.z-=nz*overlap*(b.mass/(a.mass+b.mass));b.pos.x+=nx*overlap*(a.mass/(a.mass+b.mass));b.pos.z+=nz*overlap*(a.mass/(a.mass+b.mass));
 // Tangential angular momentum transfers into a small, readable burst-health loss.
 if(relative<-.12){const attackA=a.attack*(a.tiltTimer>0?1.5:1),attackB=b.attack*(b.tiltTimer>0?1.5:1);const power=Math.min(9,Math.abs(relative)*1.1+impulse*.65);if(a.invuln<=0)b.burst=Math.max(0,b.burst-power*attackA);if(b.invuln<=0)a.burst=Math.max(0,a.burst-power*attackB);a.spin=Math.max(0,a.spin-power*.12);b.spin=Math.max(0,b.spin-power*.12);showImpact();playSound('clash',clamp(power/8,.2,1));}
}
function lerpAngle(a,b,t){let d=(b-a+Math.PI*3)%(Math.PI*2)-Math.PI;return a+d*clamp(t,0,1);}
function updateVisuals(dt,t){
 bees.forEach(b=>{b.root.position.set(b.pos.x,0,b.pos.z);b.root.rotation.y=b.heading;b.spinGroup.rotation.y=b.spinAngle;b.spinGroup.rotation.z=b.tilt*Math.sin(t*7+b.team);b.visual.aura.material.opacity=.28+.22*Math.sin(t*5+b.team);const s=.92+Math.min(.25,Math.hypot(b.vel.x,b.vel.z)*.035);b.root.scale.set(s,1,s);});
 if(state.camera==='pov'&&bees[0]){const p=bees[0].pos;const desired=new THREE.Vector3(p.x-4,6,p.z+5);camera.position.lerp(desired,.035);camera.lookAt(0,0,0);}
}
function updatePhaseUI(){const active=state.phase==='manual';$('#phase-label').textContent=state.phase==='auto'?'AUTONOMOUS PHYSICS':active?'MANUAL CONTROL':'ARENA STANDBY';$('#right-phase').textContent=state.phase==='auto'?'AUTO':active?'MANUAL':'STANDBY';$('#control-state').textContent=active?'ACTIVE':'LOCKED';$('#control-mode-text').textContent=active?'LIVE INPUT':'MANUAL PHASE';$('#arena-tip').textContent=active?'STEER · DASH OR TILT · AVATAR AT ≤50%':'PHYSICS RUNNING · WATCH FOR AN OPENING';$('#center-callout').classList.toggle('hidden',state.launched);$('#phase-count').textContent=Math.max(0,Math.ceil(state.phaseTime));document.querySelectorAll('.action-button').forEach(b=>b.disabled=!active||state.actionUsed);updateAvatarUI();}
function updateHUD(){
 $('#phase-count').textContent=Math.max(0,Math.ceil(state.phaseTime));
 bees.forEach(b=>{const prefix=b.team===0?'you':'rival';const spin=clamp(b.spin,0,100),burst=clamp(b.burst,0,100);$(`#${prefix}-spin-bar`).style.width=spin+'%';$(`#${prefix}-spin-value`).textContent=Math.round(spin);$(`#${prefix}-burst-value`).textContent=Math.round(burst);});
 renderScores();updateAvatarUI();
}
function renderScores(){['you','rival'].forEach((side,i)=>{const el=$(`#${side}-score`);el.innerHTML='';for(let j=0;j<5;j++){const dot=document.createElement('i');if(j<state.points[i])dot.className='filled';el.appendChild(dot);}});}
function updateAvatarUI(){if(!bees[0])return;const b=bees[0],ready=state.phase==='manual'&&b.burst<=50&&!state.avatarUsed&&!state.matchOver;$('#avatar-ready').textContent=state.avatarUsed?'USED':ready?'READY':b.burst<=50?'WAIT FOR MANUAL':'LOCKED';$('#avatar-ready').classList.toggle('ready',ready);$('#avatar-btn').disabled=!ready;$('#avatar-threshold').style.width=`${clamp((50-b.burst)/50*100,0,100)}%`;}
function newMatch(){
 disposeBeys();state.points=[0,0];state.round=1;state.phase='auto';state.phaseTime=10;state.actionUsed=false;state.avatarUsed=false;state.matchOver=false;state.launched=true;state.tiltTime=0;
 const own={...state.build};const enemy={...BASE,core:PARTS.core[0],blade:PARTS.blade[1],disc:PARTS.disc[0],tip:PARTS.tip[0]};bees=[makeBey(0,own),makeBey(1,enemy)];$('#round-number').textContent='01';$('#you-bey-label').textContent=buildName(state.build).toUpperCase();$('#rival-bey-label').textContent='NOVA STRIKER';$('#launch-btn').querySelector('b').textContent='MATCH IN PROGRESS';$('#launch-btn').querySelector('small').textContent='ROUND 01 · SPACE';$('#launch-btn').disabled=true;$('#center-callout').classList.add('hidden');updatePhaseUI();updateHUD();toast('LAUNCH! AUTONOMOUS PHYSICS · 10 SECONDS');playSound('launch',.7);
}
function launchRound(){if(state.matchOver){newMatch();return;}if(!state.launched){newMatch();return;}if(state.phase==='finished'){state.round++;state.avatarUsed=false;state.actionUsed=false;state.phase='auto';state.phaseTime=10;const own={...state.build};const enemy={...BASE,blade:PARTS.blade[1]};disposeBeys();bees=[makeBey(0,own),makeBey(1,enemy)];$('#round-number').textContent=String(state.round).padStart(2,'0');$('#launch-btn').disabled=true;$('#launch-btn').querySelector('b').textContent='MATCH IN PROGRESS';$('#launch-btn').querySelector('small').textContent=`ROUND ${String(state.round).padStart(2,'0')} · SPACE`;updatePhaseUI();updateHUD();toast('ROUND '+String(state.round).padStart(2,'0')+' · LAUNCH!');playSound('launch',.7);}}
function finish(winner,kind){if(state.phase==='finished')return;state.points[winner]+=kind==='RING OUT'?2:kind==='SPIN FINISH'?1:3;state.phase='finished';state.phaseTime=0;updatePhaseUI();updateHUD();playSound(kind==='BURST FINISH'?'burst':'finish',1);const match=state.points[winner]>=5;state.matchOver=match;const text=match?(winner===0?'MATCH VICTORY':'MATCH DEFEAT'):kind;$('#center-callout').innerHTML=`<span class="callout-overline">${match?'FIRST TO FIVE':(winner===0?'YOU WIN THE ROUND':'RIVAL WINS')}</span><b>${match?(winner===0?'VICTORY':'DEFEAT'):kind.replace(' ','<br>')}</b><small>${match?'PHYSICS. STRATEGY. SKILL.':`+${kind==='RING OUT'?2:kind==='SPIN FINISH'?1:3} POINT${kind==='RING OUT'||kind==='BURST FINISH'?'S':''} · ${state.points[winner]} / 5`}</small>`;$('#center-callout').classList.remove('hidden');$('#launch-btn').disabled=false;$('#launch-btn').querySelector('b').textContent=match?'REMATCH':'NEXT ROUND';$('#launch-btn').querySelector('small').textContent=match?'RESET MATCH':'SPACE TO CONTINUE';$('#arena-tip').textContent=match?'MATCH COMPLETE · REMATCH WHEN READY':'ROUND COMPLETE · PREPARE NEXT LAUNCH';toast(`${kind} · ${winner===0?'YOU':'RIVAL'} SCORE${kind==='RING OUT'?' 2':kind==='SPIN FINISH'?' 1':' 3'}`);}
function special(which){if(!bees[0]||state.phase!=='manual'||state.actionUsed)return;const b=bees[0];state.actionUsed=true;document.querySelectorAll('.action-button').forEach(x=>x.disabled=true);if(which==='dash'){const f=vec(Math.sin(b.heading),Math.cos(b.heading));b.vel.x+=f.x*4.25;b.vel.z+=f.z*4.25;b.spin=Math.max(0,b.spin-5);b.burst=Math.max(0,b.burst-3);showImpact('DASH!');playSound('dash',.8);toast('DASH · SPEED FOR SPIN');}else{const jx=state.joy.x,jz=state.joy.y;const desired=(Math.abs(jx)+Math.abs(jz)>.1)?Math.atan2(jx,-jz):b.heading;b.heading=lerpAngle(b.heading,desired,1);b.tiltTimer=3.4;b.vel.multiplyScalar(.79);b.spin=Math.max(0,b.spin-2);showImpact('TILT!');playSound('tilt',.65);toast('TILT · IMPACT UP, STABILITY DOWN');}updateAvatarUI();}
function activateAvatar(){const b=bees[0],target=bees[1];if(!b||state.phase!=='manual'||b.burst>50||state.avatarUsed)return;state.avatarUsed=true;const ability=b.parts.core.ability;const dx=target.pos.x-b.pos.x,dz=target.pos.z-b.pos.z,d=Math.hypot(dx,dz)||1;if(ability==='pulse'){if(d<4.2){target.burst=Math.max(0,target.burst-24);target.vel.x+=dx/d*2.7;target.vel.z+=dz/d*2.7;}b.spin=Math.min(100,b.spin+10);b.burst=Math.min(100,b.burst+7);}else if(ability==='guard'){b.invuln=2.4;b.burst=Math.min(100,b.burst+21);b.spin=Math.min(100,b.spin+5);}else{b.vel.x-=dx/d*2.2;b.vel.z-=dz/d*2.2;b.spin=Math.min(100,b.spin+8);b.burst=Math.min(100,b.burst+5);target.burst=Math.max(0,target.burst-13);}
 $('#avatar-ready').textContent='USED';$('#avatar-btn').disabled=true;showImpact(b.parts.core.avatar.toUpperCase());playSound('avatar',1);toast(`${b.parts.core.avatar.toUpperCase()} · CORE ABILITY ACTIVATED`);updateHUD();}
function showImpact(text='CLASH!'){const el=$('#impact-label');el.textContent=text;el.classList.remove('show');void el.offsetWidth;el.classList.add('show');}
function playSound(type,level=1){if(!state.sound)return;try{audioCtx ||= new (window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume();const now=audioCtx.currentTime;const osc=audioCtx.createOscillator(),gain=audioCtx.createGain();const base={clash:110,launch:170,dash:260,tilt:320,avatar:440,finish:220,burst:75}[type]||160;osc.type=type==='clash'||type==='burst'?'sawtooth':'sine';osc.frequency.setValueAtTime(base,now);osc.frequency.exponentialRampToValueAtTime(Math.max(35,base*(type==='clash'?.48:.72)),now+.18);gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.08*level,now+.012);gain.gain.exponentialRampToValueAtTime(.0001,now+.24);osc.connect(gain);gain.connect(audioCtx.destination);osc.start(now);osc.stop(now+.25);}catch{}}
function buildStats(build){const parts=Object.values(build);return{spin:clamp(Math.round(75+parts.reduce((s,p)=>s+(p.spin||0),0)*.35),35,96),burst:clamp(Math.round(70+parts.reduce((s,p)=>s+(p.burst||0),0)*.35),35,96)};}
function buildName(build){return `${build.core.name} ${build.blade.name}`;}
function updateBuildUI(){const b=state.draft;const st=buildStats(b);$('#build-name').textContent=buildName(state.build).toUpperCase();$('#core-name').textContent=state.build.core.name;$('#blade-name').textContent=state.build.blade.name;$('#disc-name').textContent=state.build.disc.name;$('#tip-name').textContent=state.build.tip.name;$('#loadout-spin').style.width=st.spin+'%';$('#loadout-burst').style.width=st.burst+'%';$('#spin-score').textContent=st.spin;$('#burst-score').textContent=st.burst;$('#avatar-name').textContent=state.build.core.avatar.toUpperCase();$('#avatar-icon').textContent=state.build.core.icon;$('#avatar-description').textContent=state.build.core.avatarText;$('#workshop-build-name').textContent=buildName(b).toUpperCase();const ds=buildStats(b);$('#workshop-build-stats').textContent=`SPIN ${ds.spin} · BURST ${ds.burst}`;$('#you-bey-label').textContent=buildName(state.build).toUpperCase();}
function openPanel(id){const panelId=id==='workshop'?'workshop-panel':id;$('#'+panelId).classList.add('open');$('#'+panelId).setAttribute('aria-hidden','false');if(panelId==='workshop-panel')renderWorkshop();}
function closePanels(){$$('.overlay-panel').forEach(p=>{p.classList.remove('open');p.setAttribute('aria-hidden','true');});}
function renderWorkshop(){const holder=$('#workshop-slots');holder.innerHTML='';for(const key of ['core','blade','disc','tip']){const slot=document.createElement('div');slot.className='workshop-slot';const head=document.createElement('div');head.className='slot-head';head.innerHTML=`<b>${key.toUpperCase()}</b><span>${key==='core'?'AVATAR + BALANCE':key==='blade'?'IMPACT + RECOIL':key==='disc'?'INERTIA + MASS':'GRIP + ACCELERATION'}</span>`;slot.appendChild(head);const options=document.createElement('div');options.className='part-options';PARTS[key].forEach(part=>{const btn=document.createElement('button');btn.className='part-option'+(state.draft[key].name===part.name?' selected':'');btn.innerHTML=`<b>${part.name}</b><small>${part.desc||part.avatarText}</small><em>${part.spin>=0?'+':''}${part.spin||0} SPIN · ${part.burst>=0?'+':''}${part.burst||0} BURST</em>`;btn.onclick=()=>{state.draft[key]=part;renderWorkshop();};options.appendChild(btn);});slot.appendChild(options);holder.appendChild(slot);}}
function toast(text){const el=$('#toast');el.textContent=text;el.classList.add('show');clearTimeout(state.toastTimer);state.toastTimer=setTimeout(()=>el.classList.remove('show'),2100);}
function setupJoystick(){const base=$('#joystick-base'),knob=$('#joystick-knob');let active=false;const move=e=>{if(!active)return;const r=base.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let x=(e.clientX-cx)/(r.width*.36),y=(e.clientY-cy)/(r.height*.36);const n=Math.hypot(x,y);if(n>1){x/=n;y/=n;}state.joy.x=x;state.joy.y=y;knob.style.transform=`translate(${x*20}px,${y*20}px)`;let dir='NORTH';if(Math.hypot(x,y)>.2){const deg=(Math.atan2(x,-y)*180/Math.PI+360)%360;dir=['NORTH','NORTH-EAST','EAST','SOUTH-EAST','SOUTH','SOUTH-WEST','WEST','NORTH-WEST'][Math.round(deg/45)%8];}$('#joystick-direction').textContent=dir;};base.addEventListener('pointerdown',e=>{active=true;base.setPointerCapture(e.pointerId);move(e);});base.addEventListener('pointermove',move);const release=()=>{active=false;state.joy.x=state.joy.y=0;knob.style.transform='translate(0,0)';$('#joystick-direction').textContent='NORTH';};base.addEventListener('pointerup',release);base.addEventListener('pointercancel',release);}
function bind(){
 document.querySelectorAll('.nav-link').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.nav-link').forEach(x=>x.classList.toggle('active',x===b));if(b.dataset.panel==='workshop')openPanel('workshop');else if(b.dataset.panel==='records')toast('PILOT RECORDS · LOCAL PROTOTYPE');else closePanels();}));
 document.querySelectorAll('[data-open-workshop]').forEach(b=>b.onclick=()=>openPanel('workshop'));
 document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',closePanels));
 document.querySelectorAll('.camera-btn').forEach(b=>b.onclick=()=>setCamera(b.dataset.camera));
 document.querySelectorAll('.mode-option').forEach(b=>b.onclick=()=>{document.querySelectorAll('.mode-option').forEach(x=>x.classList.toggle('selected',x===b));state.mode=b.dataset.mode;if(state.mode!=='1v1')toast(`${b.dataset.mode.toUpperCase()} FORMAT · LOCAL 1v1 PROTOTYPE ACTIVE`);});
 $('#launch-btn').onclick=launchRound;$('#dash-btn').onclick=()=>special('dash');$('#tilt-btn').onclick=()=>special('tilt');$('#avatar-btn').onclick=activateAvatar;
 $('#sound-btn').onclick=()=>{state.sound=!state.sound;$('#sound-btn').innerHTML=`♫ <span>SOUND ${state.sound?'ON':'OFF'}</span>`;if(state.sound)playSound('launch',.3);};
 $('#bot-settings').onclick=()=>openPanel('bot-panel');$('#save-bot').onclick=()=>{state.bot.personality=$('#bot-personality').value;state.bot.difficulty=$('#bot-difficulty').value;$('#ai-style-label').textContent=`${state.bot.personality.toUpperCase()} · ${state.bot.difficulty.toUpperCase()}`;closePanels();toast('RIVAL SETTINGS UPDATED · NO STAT ADVANTAGE');};
 $('#save-build').onclick=()=>{state.build={...state.draft};updateBuildUI();closePanels();toast(`${buildName(state.build).toUpperCase()} EQUIPPED · PHYSICS UPDATED`);if(state.launched&&!state.matchOver)toast('BUILD EQUIPPED FOR NEXT MATCH');};
 $('#help-btn').onclick=()=>openPanel('help-panel');document.addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(k)){state.keys.add(k);if(state.phase!=='manual')return;e.preventDefault();}if(e.repeat)return;if(k===' '){e.preventDefault();if(!state.launched||state.phase==='finished')launchRound();}if(k==='shift')special('dash');if(k==='e')special('tilt');if(k==='q')activateAvatar();if(k==='m'&&state.phase!=='standby')toast(state.phase==='manual'?'MANUAL CONTROL ACTIVE':'AUTONOMOUS PHYSICS ACTIVE');if(k==='escape')closePanels();});document.addEventListener('keyup',e=>state.keys.delete(e.key.toLowerCase()));
 setupJoystick();renderScores();updateBuildUI();
}
function $$(s){return [...document.querySelectorAll(s)]}
setupScene();bind();
