import * as T from './vendor/three.module.js';
import {RoomEnvironment} from './vendor/RoomEnvironment.js';
import {basilPot,oilBottle,lemon,lemonHalf,linen,pantryJar} from './props.mjs?v=1.4';
import {smooth,knifeHeight,platingFractions,ingredientAt} from './cooking-motion.mjs';
// Toss scene layout: basket on the left of the counter, cutting board on the right.
const TOSS={basket:[-3.2,-.1,.7],board:[1.7,0,.15],flight:.85,veg:['tomato','carrot','onion']};
const C={cream:0xf5ebd3,wood:0xc29461,green:0x47694f,tomato:0xc84f2e,cheese:0xf1d387,pan:0x374640};
export class Kitchen {
 constructor(host,kit){this.kit=kit;this.host=host;this.active=true;this.stirAngle=0;this.stirSpeed=0;this.actionAge=99;this.renderer=new T.WebGLRenderer({antialias:true,alpha:false});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=.9;host.append(this.renderer.domElement);this.scene=new T.Scene();const environment=new RoomEnvironment();const pmrem=new T.PMREMGenerator(this.renderer);this.environment=pmrem.fromScene(environment,.04);this.scene.environment=this.environment.texture;this.scene.environmentIntensity=.25;environment.dispose();pmrem.dispose();this.scene.background=new T.Color(0xece3d0);this.scene.fog=new T.Fog(0xece3d0,17,35);this.camera=new T.PerspectiveCamera(36,1,.1,80);this.root=new T.Group();this.scene.add(this.root);this.objects=[];this.steam=[];this.phase='intro';this.progress=0;this.pulse=0;this.time=0;this.target=9;this.count=0;this.reduced=false;this.buildRoom();this.display('intro',4,4);this.resize();this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(host);}
 mat(color,roughness=.7,metalness=0){return new T.MeshStandardMaterial({color,roughness,metalness});}
 mesh(geometry,material,parent=this.root){const m=new T.Mesh(geometry,typeof material==='number'?this.mat(material):material);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 box(x,y,z,color,parent=this.root){return this.mesh(new T.BoxGeometry(x,y,z),color,parent);}
 sphere(x,y,z,r,color,parent=this.root){const m=this.mesh(new T.SphereGeometry(r,20,14),color,parent);m.position.set(x,y,z);return m;}
 cylinder(r1,r2,h,color,parent=this.root){return this.mesh(new T.CylinderGeometry(r1,r2,h,48),color,parent);}
 curve(points,r,color,parent=this.root){return this.mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),42,r,7,false),color,parent);}
 buildRoom(){const a=new T.HemisphereLight(0xfffaf0,0x9e9574,1.3);this.scene.add(a);const sun=new T.DirectionalLight(0xfff0ce,3.4);sun.position.set(-5,11,6);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-11;sun.shadow.camera.right=11;sun.shadow.camera.top=10;sun.shadow.camera.bottom=-10;sun.shadow.normalBias=.03;this.scene.add(sun);const fill=new T.DirectionalLight(0xcbe4df,.9);fill.position.set(8,4,-2);this.scene.add(fill);
 const table=this.box(19,.4,10,C.wood);table.position.set(0,-.3,0);for(let i=-4;i<=4;i++){const line=this.box(19,.002,.012,0xaf8151);line.position.set(0,-.096,i*1.1);}
 const wall=this.box(22,9,.3,0xe5deca);wall.position.set(0,4.1,-4.6);for(let x=-10;x<=10;x++){for(let y=0;y<3;y++){const tile=this.box(.98,.65,.05,(x+y)%3===0?0x97a79b:0xb1bbab);tile.position.set(x,.33+y*.68,-4.4);}}
 const arch=new T.Shape();arch.moveTo(-1.7,0);arch.lineTo(-1.7,2.4);arch.absarc(0,2.4,1.7,Math.PI,0,true);arch.lineTo(1.7,0);arch.closePath();const window=this.mesh(new T.ShapeGeometry(arch),this.mat(0xd8e5d8));window.position.set(4,1.3,-4.35);const frame=this.box(.09,3.8,.1,0x9caa94);frame.position.set(4,3.2,-4.26);const sill=this.box(3.8,.17,.55,C.cream);sill.position.set(4,1.3,-4.1);const hill=this.sphere(4,1.6,-4.25,1,0x96b1a1);hill.scale.set(1.65,.4,.04);
 const shelf=this.box(5,.16,.65,0xb3895b);shelf.position.set(-4,2.6,-4);for(let i=0;i<3;i++){const jar=pantryJar(i,i+2);jar.position.set(-5.3+i*1.2,2.68,-3.98);this.root.add(jar);}
 // v1.4: linen towel, olive oil bottle, potted basil and lemons are modelled in props.mjs.
 const cloth=linen();cloth.position.set(4.8,-.1,1.4);cloth.rotation.y=-.15;this.root.add(cloth);
 const bottle=oilBottle();bottle.position.set(-4.8,-.1,-1.9);bottle.rotation.y=.25;this.root.add(bottle);
 const herbpot=basilPot();herbpot.position.set(6,-.1,-2.4);this.root.add(herbpot);
 this.decor=[];for(let i=0;i<3;i++){this.decor.push(this.tomato(-4.4+i*.4,.2,2.3+Math.sin(i*2)*.4,.35,this.root));}const fruit=lemon();fruit.position.set(5.45,.17,-.35);fruit.rotation.y=.5;this.root.add(fruit);const half=lemonHalf();half.position.set(6.15,.17,.15);this.root.add(half);
 this.makeBackdrop();
 this.food=new T.Group();this.scene.add(this.food);}

 // Painted kitchen wall (image-generated) shown behind the toss scene. Without the picture the 3D room stays.
 makeBackdrop(){const geometry=new T.PlaneGeometry(21,14),material=new T.MeshBasicMaterial({color:0xf2efe6,toneMapped:false,fog:false});this.backdrop=new T.Mesh(geometry,material);this.backdrop.position.set(0,4.5,-3.45);this.backdrop.visible=false;this.backdrop.userData.ready=false;this.scene.add(this.backdrop);
  new T.TextureLoader().load(new URL('./assets/kitchen-backdrop.jpg',import.meta.url).href,tex=>{tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;material.map=tex;material.needsUpdate=true;this.backdrop.userData.ready=true;this.backdrop.visible=this.phase==='toss';},undefined,()=>{});}
 tomato(x,y,z,r,parent){const t=this.asset('tomato',parent);t.position.set(x,y,z);t.scale.setScalar(r/.61);return t;}

 asset(name,parent=this.food){return this.kit.make(name,parent);}
 clear(){const geometries=new Set(),materials=new Set();this.food.traverse(o=>{if(o.userData.sharedFood)return;if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material);});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());this.food.clear();this.food.position.set(0,0,0);this.steam=[];this.spoon=null;this.knife=null;this.chunks=null;this.noodles=null;this.layers=null;this.bubbles=[];this.slices=[];this.pendingChop=null;this.tossItems=null;this.flight=null;this.actionAge=99;this.stirAngle=0;this.stirSpeed=0;}
 display(phase,count,target){this.clear();this.phase=phase;this.count=count;this.target=target;this.progress=count/target;this.visualProgress=this.progress;
 if(this.backdrop)this.backdrop.visible=phase==='toss'&&this.backdrop.userData.ready;for(const d of this.decor||[])d.visible=phase!=='toss';
 if(phase==='toss')this.tossing();else if(phase==='chop')this.chopping();else if(phase==='boil')this.boiling();else if(phase==='sauce')this.sauce();else this.plating(phase==='plate'?count:target);}
 chopping(){const f=this.food;const board=this.box(5.8,.22,3.6,0xb8844f,f);board.position.y=.09;const edge=this.box(5.7,.035,3.5,0xd8ad73,f);edge.position.y=.215;
 for(let i=0;i<14;i++){const grain=this.curve([[-2.7,.236,-1.55+i*.23],[-.8,.236,-1.54+i*.23],[1,.236,-1.57+i*.23],[2.7,.236,-1.55+i*.23]],.003,0xba8f5b,f);}
 this.prep=new T.Group();f.add(this.prep);this.refreshChop(this.count);
 this.knife=new T.Group();f.add(this.knife);this.knife.position.set(.38,1.65,.25);
 const shape=new T.Shape();shape.moveTo(-.75,.29);shape.lineTo(.65,.29);shape.lineTo(.68,.08);shape.quadraticCurveTo(.1,-.3,-.75,-.29);shape.closePath();
 const blade=this.mesh(new T.ExtrudeGeometry(shape,{depth:.035,bevelEnabled:true,bevelSize:.012,bevelThickness:.008,bevelSegments:2,steps:1}),this.mat(0xc8d0d0,.2,.85),this.knife);blade.rotation.y=Math.PI/2;
 const handle=this.box(.14,.2,.8,0x573621,this.knife);handle.position.set(0,.17,1.09);for(let i=0;i<3;i++)this.sphere(.076,.18,.87+i*.21,.025,0xadb1a4,this.knife);
 this.knife.rotation.set(0,.15,-.06);}
 refreshChop(count){this.prep.traverse(o=>{if(!o.userData.sharedFood){o.geometry?.dispose();o.material?.dispose();}});this.prep.clear();this.slices=[];this.ingredient=ingredientAt(count,this.target);const per=this.target/3;
 for(let j=0;j<3;j++){const bowl=this.mesh(new T.LatheGeometry([new T.Vector2(.01,0),new T.Vector2(.34,0),new T.Vector2(.48,.26),new T.Vector2(.5,.28),new T.Vector2(.51,.25),new T.Vector2(.37,-.05),new T.Vector2(.01,-.05)],40),this.mat(0xf2e8d4,.32),this.prep);bowl.position.set(-2.1+j*1.15,.29,-1.05);
 if(count>=(j+1)*per){for(let k=0;k<5;k++){const piece=this.asset(['tomato_slice','onion_slice','carrot_slice'][j],this.prep);piece.scale.setScalar(j===2?.65:.45);piece.position.set(-2.1+j*1.15+Math.sin(k*2)*.14,.37+k*.035,-1.05+Math.cos(k*2)*.13);piece.rotation.y=k*.9;}}}
 if(count>=this.target)return;
 const idx=this.ingredient,cut=count%per;this.whole=this.asset(['tomato','onion','carrot'][idx],this.prep);this.whole.position.set(.28,.78,.28);if(idx===2){this.whole.rotation.z=-Math.PI/2;this.whole.position.y=.57;}this.whole.scale.setScalar(1-cut/per*.22);
 for(let i=0;i<cut;i++){const piece=this.asset(['tomato_slice','onion_slice','carrot_slice'][idx],this.prep);piece.position.set(-2+(i%4)*.38,.29+Math.floor(i/4)*.11,.05+Math.floor(i/4)*.5);piece.scale.setScalar(idx===2?.92:.65);piece.rotation.y=i*.4;piece.userData.restX=piece.position.x;this.slices.push(piece);}
 }
 tossing(){const f=this.food,[bx,,bz]=TOSS.board;const board=this.box(4.3,.22,3,0xb8844f,f);board.position.set(bx,.09,bz);const edge=this.box(4.2,.035,2.9,0xd8ad73,f);edge.position.set(bx,.215,bz);
 for(let i=0;i<12;i++)this.curve([[bx-2.05,.236,bz-1.32+i*.24],[bx-.6,.236,bz-1.31+i*.24],[bx+.7,.236,bz-1.34+i*.24],[bx+2.05,.236,bz-1.32+i*.24]],.003,0xba8f5b,f);
 // Low wicker basket: lathe body, woven bands, rim and two side loops.
 const basket=new T.Group();basket.position.set(...TOSS.basket);f.add(basket);const wicker=new T.MeshStandardMaterial({color:0xb98a52,roughness:.9,side:T.DoubleSide});
 this.mesh(new T.LatheGeometry([[0,0],[.92,0],[1.02,.1],[1.2,.66],[1.24,.72]].map(p=>new T.Vector2(...p)),40),wicker,basket);
 for(let k=0;k<4;k++){const y=.14+k*.15,r=1.04+(y-.1)/.56*.16;const band=this.mesh(new T.TorusGeometry(r,.035,6,48),k%2?0x9c703f:0xc89b62,basket);band.rotation.x=Math.PI/2;band.position.y=y;}
 for(let k=0;k<16;k++){const a=k/16*Math.PI*2,stake=this.box(.05,.68,.05,0x8f6537,basket);stake.position.set(Math.sin(a)*1.12,.37,Math.cos(a)*1.12);stake.rotation.set(Math.cos(a)*.27,0,-Math.sin(a)*.27);}
 const rim=this.mesh(new T.TorusGeometry(1.24,.075,8,56),0xa77a45,basket);rim.rotation.x=Math.PI/2;rim.position.y=.72;
 for(const z of [-1.3,1.3]){const loop=this.mesh(new T.TorusGeometry(.2,.045,6,20,Math.PI),0xa77a45,basket);loop.position.set(0,.72,z);loop.rotation.y=Math.PI/2;}
 this.prep=new T.Group();f.add(this.prep);this.refreshToss(this.count);}
 tossLift(type,s){return (type===1?.36:.56)*s;}
 basketSpot(i){const n=this.target,[x,y,z]=TOSS.basket,a=i*2.4+.4,r=i%3===0?.2:.55,layer=Math.floor((n-1-i)/4),type=i%3,s=type===1?.85:.55;return new T.Vector3(x+Math.sin(a)*r,y+.06+this.tossLift(type,s)+layer*.3,z+Math.cos(a)*r*.8);}
 boardSpot(i){const [x,,z]=TOSS.board,type=i%3,round=Math.floor(i/3),s=type===1?.85:.55;return new T.Vector3(x-1.3+type*1.3,.235+this.tossLift(type,s),z-.85+round*.85);}
 refreshToss(count){this.prep.traverse(o=>{if(!o.userData.sharedFood){o.geometry?.dispose();o.material?.dispose();}});this.prep.clear();this.flight=null;this.tossItems=[];
 for(let i=0;i<this.target;i++){const type=i%3,o=this.asset(TOSS.veg[type],this.prep),s=type===1?.85:.55;o.scale.setScalar(s);if(type===1)o.rotation.z=-Math.PI/2;const rest=i<count?i*.8:i*1.7;o.rotation.y=rest;o.userData.restY=rest;o.position.copy(i<count?this.boardSpot(i):this.basketSpot(i));this.tossItems.push(o);}}
 startToss(i){if(this.flight)this.landToss(this.flight.i);const o=this.tossItems?.[i];if(!o)return;if(this.reduced){this.landToss(i);return;}this.flight={i,from:o.position.clone(),to:this.boardSpot(i)};}
 landToss(i){const o=this.tossItems[i];o.position.copy(this.boardSpot(i));o.rotation.x=0;o.rotation.y=o.userData.restY;this.flight=null;}
 updateToss(){if(!this.tossItems)return;const t=this.actionAge/TOSS.flight;
 if(this.flight){const {i,from,to}=this.flight,o=this.tossItems[i];if(t>=1){this.landToss(i);}else{const e=smooth(t);o.position.lerpVectors(from,to,e);o.position.y+=3.1*4*e*(1-e);o.rotation.x=-t*Math.PI*2;}}
 // Small squash on landing, then rest.
 const land=(this.actionAge-TOSS.flight)/.22,last=this.tossItems[this.count-1];if(last&&!this.flight&&land>=0&&land<1&&!this.reduced){const q=Math.sin(land*Math.PI)*.16,type=(this.count-1)%3,s=type===1?.85:.55;last.scale.set(s*(1+q*.6),s*(1-q),s*(1+q*.6));}else if(last&&land>=1){const type=(this.count-1)%3,s=type===1?.85:.55;last.scale.setScalar(s);}}
 stove(){const base=this.box(4.5,.24,3.5,0x56614f,this.food);base.position.y=.05;const rim=this.cylinder(1.75,1.75,.08,0x27382e,this.food);rim.position.y=.23;const glow=this.mesh(new T.TorusGeometry(1.45,.04,8,64),0xc6a26a,this.food);glow.rotation.x=Math.PI/2;glow.position.y=.29;}
 makeSpoon(y){this.spoon=new T.Group();this.food.add(this.spoon);this.spoon.position.y=y;this.curve([[.45,-.08,.35],[.7,.55,.4],[1.1,1.55,.45]],.065,0xa57a42,this.spoon);const tip=this.sphere(.45,-.12,.35,.27,0xb28a51,this.spoon);tip.scale.set(.75,.23,1.2);}
 makeSteam(y){const mat=new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.08,depthWrite:false});for(let i=0;i<12;i++){const s=this.mesh(new T.SphereGeometry(.09,10,8),mat,this.food);s.userData={seed:i,y};s.scale.set(1,2,1);this.steam.push(s);}}
 boiling(){this.stove();const f=this.food;
 const profile=[[0,.29],[1.3,.29],[1.5,.44],[1.55,1.34],[1.51,1.37],[1.46,1.29],[1.41,.48],[1.25,.37],[0,.37]].map(p=>new T.Vector2(...p));const pot=this.mesh(new T.LatheGeometry(profile,80),this.mat(0xaebcb9,.25,.78),f);
 for(const x of [-1.86,1.86]){const h=this.mesh(new T.TorusGeometry(.3,.065,12,32),this.mat(0x8a9892,.3,.7),f);h.rotation.x=Math.PI/2;h.position.set(x,1.1,0);}
 const water=this.cylinder(1.46,1.46,.025,this.mat(0x86b6ae,.18,.25),f);water.position.y=1.04;
 this.noodles=this.asset('water_pasta');this.noodles.position.y=1.09;
 for(let i=0;i<22;i++){const a=i*2.4,r=Math.sqrt((i+.5)/22)*1.32;const b=this.sphere(Math.sin(a)*r,1.1,Math.cos(a)*r,.04+(i%3)*.013,this.mat(0xc6dfce,.13,.1),f);b.userData.seed=i;this.bubbles.push(b);}
 this.makeSpoon(1.25);this.makeSteam(1.4);}
 sauce(){this.stove();const f=this.food;const profile=[[0,.3],[1.42,.3],[1.7,.64],[1.73,.72],[1.68,.74],[1.6,.63],[1.4,.39],[0,.39]].map(p=>new T.Vector2(...p));this.mesh(new T.LatheGeometry(profile,80),this.mat(0x35433e,.32,.45),f);const handle=this.box(1.55,.17,.28,C.pan,f);handle.position.set(2.25,.55,.2);handle.rotation.y=-.2;
 this.chunks=this.asset('pan_ragu');this.chunks.position.y=.56;this.makeSpoon(.81);this.makeSteam(.9);}
 plating(count){this.food.position.set(this.phase==='intro'||this.phase==='final'?1.8:0,0,0);this.asset('plate');this.layers=['spaghetti','ragu','parmesan','basil'].map(n=>this.asset(n));this.layers[0].position.y=-.06;this.layers[1].position.y=.81;this.layers[2].position.y=.95;this.layers[3].position.set(.05,1.03,-.05);this.layerValues=platingFractions(count,this.target);this.layerTargets=[...this.layerValues];this.updatePlate(1);this.makeSteam(.8);}
 updatePlate(dt){if(!this.layers)return;const k=this.reduced?1:1-Math.exp(-dt*7);this.layers.forEach((o,i)=>{this.layerValues[i]+=(this.layerTargets[i]-this.layerValues[i])*k;const p=this.layerValues[i];o.visible=p>.001;const size=Math.max(.001,Math.cbrt(p));o.scale.set(size*1.2,size,size*1.2);});}
 updateState(phase,count,target){
 // Keep the same objects and stir angle across actions. Only scene changes rebuild.
 if(phase!==this.phase||target!==this.target||count>this.count+1||count<this.count){this.display(phase,count,target);return;}
 const increased=count>this.count;this.count=count;this.progress=count/target;
 if(increased){this.actionAge=0;if(phase==='toss')this.startToss(count-1);if(phase==='chop'){this.pendingChop=count;this.didCut=false;}if(this.layers)this.layerTargets=platingFractions(count,target);}
 }
 resize(){const w=this.host.clientWidth,h=this.host.clientHeight;this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();}
 frame(dt){this.time+=dt;const wide=this.camera.aspect>1.1,showcase=this.phase==='intro'||this.phase==='final',x=showcase&&wide?1.2:0;if(this.phase==='toss'){this.camera.position.set(-.6,wide?5.2:8,wide?11.6:17);this.camera.lookAt(-.6,wide?1.1:.9,0);}else{this.camera.position.set(x,wide?7.8:11.5,wide?10.8:15.6);this.camera.lookAt(x,.2,0);}
 // A throw never stays in mid-air: if drawing stops (scene finished, paused, hidden), it lands.
 if(!this.active&&this.flight)this.landToss(this.flight.i);
 if(this.active){this.actionAge+=dt;this.visualProgress+=(this.progress-this.visualProgress)*(1-Math.exp(-dt*6));
 const t=Math.min(1,this.actionAge/.95);
 if(this.knife){this.knife.position.y=this.reduced?1.65:knifeHeight(t);this.knife.rotation.z=this.reduced?-.06:-.06+.07*Math.sin(t*Math.PI);if(this.pendingChop!==null&&(!this.didCut)&&(t>=.44||this.reduced)){const previousIngredient=this.ingredient;const final=this.pendingChop>=this.target;const newIngredient=ingredientAt(this.pendingChop,this.target);if(newIngredient===previousIngredient&&!final)this.refreshChop(this.pendingChop);this.didCut=true;}if(t>=1&&this.pendingChop!==null){if(this.ingredient!==ingredientAt(this.pendingChop,this.target)||this.pendingChop===this.target)this.refreshChop(this.pendingChop);this.pendingChop=null;}}
 const lastSlice=this.slices.at(-1);if(lastSlice&&this.didCut)lastSlice.position.x=lastSlice.userData.restX+(this.reduced?0:.35*(1-smooth((t-.44)/.5)));const desired=this.reduced?0:(this.actionAge<1.5?2.6*(1-smooth(Math.max(0,(this.actionAge-.9)/.6))):0);this.stirSpeed+=(desired-this.stirSpeed)*(1-Math.exp(-dt*6));this.stirAngle+=dt*this.stirSpeed;
 if(this.spoon){this.spoon.rotation.y=this.stirAngle;this.spoon.rotation.z=this.reduced?0:Math.sin(this.stirAngle*2)*.04;}
 if(this.noodles){this.noodles.rotation.y=this.stirAngle*.31;this.noodles.position.y=1.085+(this.reduced?0:Math.sin(this.time*1.8)*.006);}
 if(this.chunks){this.chunks.rotation.y=this.stirAngle*.12;this.chunks.scale.set(1,1+(this.reduced?0:Math.sin(this.stirAngle*3)*.07),1);}
 this.updatePlate(dt);this.updateToss();
 for(const b of this.bubbles){const q=(this.time*.7+b.userData.seed*.137)%1;b.visible=!this.reduced;b.scale.setScalar(.25+Math.sin(q*Math.PI)*.85);b.position.y=1.07+q*.065;}
 }
 for(const s of this.steam){const i=s.userData.seed,p=(this.time*.23+i*.081)%1;s.position.set(Math.sin(i*2.1)*.7+Math.sin(this.time+i)*p*.11,s.userData.y+p*1.6,Math.cos(i*2.1)*.6);s.scale.setScalar(.35+Math.sin(p*Math.PI)*.7);s.visible=!this.reduced;}
 this.renderer.render(this.scene,this.camera);}
}
