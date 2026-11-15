import * as T from './vendor/three.module.js';
// Tabletop and shelf props (v1.4), built in code so no extra downloads are needed.
// Shapes are deterministic: every "random" variation comes from a fixed seed.
export function rng(seed){let s=seed>>>0;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};}
const V=(x,y)=>new T.Vector2(x,y);
function finish(mesh,shadow=true){mesh.castShadow=shadow;mesh.receiveShadow=true;return mesh;}
function lathe(points,material,segments=48){return finish(new T.Mesh(new T.LatheGeometry(points.map(p=>V(...p)),segments),material));}
const std=(color,roughness=.7,extra={})=>new T.MeshStandardMaterial({color,roughness,...extra});

// A leaf lying along +Z: width follows a leaf outline, edges cup upward, a soft fold runs down the middle
// and the tip droops. Built as a small grid so the light reads its curve.
export function leafGeometry({length=1,width=.74,cup=-.32,droop=.22,fold=.12,cols=14,rows=8}={}){
 const pos=[],uv=[],index=[];
 for(let i=0;i<=cols;i++){const u=i/cols,w=width*.5*Math.pow(Math.sin(Math.PI*Math.pow(Math.min(1,u*1.02),.7)),.6)*(u<.06?u/.06*.5+.5:1);
  for(let j=0;j<=rows;j++){const v=-1+2*j/rows,x=v*w,y=cup*w*v*v+fold*w*Math.abs(v)-droop*u*u*length;pos.push(x,y,u*length);uv.push(j/rows,u);}}
 for(let i=0;i<cols;i++)for(let j=0;j<rows;j++){const a=i*(rows+1)+j,b=a+rows+1;index.push(a,b,a+1,b,b+1,a+1);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(index);g.computeVertexNormals();return g;}

// Potted basil: terracotta pot on a saucer, soil, and stems with opposite leaf pairs turning 90° at each node.
export function basilPot(seed=7){
 const g=new T.Group(),r=rng(seed),terra=std(0xb5653f,.86),dark=std(0x9a5233,.9);
 g.add(lathe([[0,0],[.42,0],[.5,.035],[.53,.08],[.5,.085],[.43,.035],[0,.035]],dark));
 g.add(lathe([[0,.03],[.3,.03],[.32,.05],[.41,.52],[.47,.53],[.49,.6],[.48,.66],[.45,.67],[.42,.64],[.4,.56],[0,.56]],terra));
 const soil=finish(new T.Mesh(new T.CircleGeometry(.41,40),std(0x4c372a,1)),false);soil.rotation.x=-Math.PI/2;soil.position.y=.565;g.add(soil);
 for(let i=0;i<9;i++){const a=r()*Math.PI*2,d=r()*.33,p=finish(new T.Mesh(new T.SphereGeometry(.025+r()*.02,8,6),std(0x5d4636,1)));p.scale.y=.6;p.position.set(Math.cos(a)*d,.57,Math.sin(a)*d);g.add(p);}
 const stemMat=std(0x5f8a3f,.6),leafMats=[0x426f33,0x4e7e3b,0x3b6530,0x5a8b43].map(c=>std(c,.42,{side:T.DoubleSide}));
 const leafGeoms=[leafGeometry(),leafGeometry({cup:-.42,droop:.3}),leafGeometry({width:.68,cup:-.25,droop:.15})];
 const stems=9;for(let s=0;s<stems;s++){
  const a=s/stems*Math.PI*2+r()*.5,lean=.3+r()*.35,h=.45+r()*.4,base=new T.Vector3(Math.cos(a)*.1*r(),.56,Math.sin(a)*.1*r());
  const top=new T.Vector3(base.x+Math.cos(a)*lean*h,.56+h,base.z+Math.sin(a)*lean*h),mid=base.clone().lerp(top,.5);mid.y+=.03;
  const curve=new T.QuadraticBezierCurve3(base,mid,top);g.add(finish(new T.Mesh(new T.TubeGeometry(curve,16,.017,6,false),stemMat)));
  const nodes=3+Math.floor(r()*2);for(let n=1;n<=nodes;n++){const t=n/(nodes+.4),p=curve.getPoint(t),size=(.5-.22*t)*(.85+r()*.3),turn=a+n*Math.PI/2+r()*.3;
   for(const side of [0,Math.PI]){const dir=new T.Vector3(Math.cos(turn+side),.12+.4*t+r()*.15,Math.sin(turn+side)).normalize(),leaf=finish(new T.Mesh(leafGeoms[Math.floor(r()*3)],leafMats[Math.floor(r()*4)]));leaf.position.copy(p);leaf.lookAt(p.clone().add(dir));leaf.scale.setScalar(size);g.add(leaf);}}
  // Tip: a small upright cluster of young leaves.
  for(let k=0;k<3;k++){const d=new T.Vector3(Math.cos(a+k*2.1)*.8,1.2,Math.sin(a+k*2.1)*.5).normalize(),leaf=finish(new T.Mesh(leafGeoms[0],leafMats[3]));leaf.position.copy(top);leaf.lookAt(top.clone().add(d));leaf.scale.setScalar(.2+r()*.05);g.add(leaf);}
 }
 return g;}

// Olive oil bottle: clear glass, golden oil inside, cork, paper label and twine at the neck.
export function oilBottle(){
 const g=new T.Group();
 const oil=lathe([[0,.04],[.27,.04],[.27,.74],[.23,.9],[0,.9]],std(0xb59a1e,.2,{transparent:true,opacity:.9,emissive:0x3a2c04}));oil.renderOrder=1;g.add(oil);
 const glass=lathe([[0,0],[.28,0],[.31,.03],[.31,.75],[.28,.94],[.15,1.14],[.11,1.28],[.125,1.31],[.125,1.4],[0,1.4]],std(0xc6dcc0,.06,{transparent:true,opacity:.32,depthWrite:false,metalness:.1}));glass.renderOrder=2;glass.castShadow=false;g.add(glass);
 g.add(lathe([[0,1.33],[.1,1.33],[.118,1.38],[.112,1.56],[.09,1.58],[0,1.58]],std(0x9c7b52,.95),24));
 const label=finish(new T.Mesh(new T.CylinderGeometry(.316,.316,.36,40,1,true,-.95,1.9),std(0xf1e5c4,.9,{side:T.DoubleSide})));label.position.y=.42;g.add(label);
 for(const y of [.29,.55]){const band=finish(new T.Mesh(new T.CylinderGeometry(.318,.318,.025,40,1,true,-.95,1.9),std(0x5f7d4f,.8,{side:T.DoubleSide})));band.position.y=y;g.add(band);}
 const leafMark=finish(new T.Mesh(leafGeometry({cup:0,droop:0,fold:0}),std(0x6f8a45,.8,{side:T.DoubleSide})),false);leafMark.scale.setScalar(.14);leafMark.position.set(-.04,.4,.322);leafMark.rotation.set(-Math.PI/2,0,.6);leafMark.rotation.order='ZXY';g.add(leafMark);
 const twine=finish(new T.Mesh(new T.TorusGeometry(.122,.014,6,28),std(0xb89d6c,.95)));twine.rotation.x=Math.PI/2;twine.position.y=1.3;g.add(twine);
 return g;}

// Lemon with pointed ends and a dimpled peel; optional leaf.
function lemonGeometry(seed){const pts=[];for(let i=0;i<=22;i++){const y=-.43+.86*i/22,a=Math.abs(y);let rad=a<=.34?.27*Math.sqrt(1-(a/.37)**2):.27*Math.sqrt(1-(.34/.37)**2)*Math.max(0,1-(a-.34)/.09)**1.3;pts.push(V(Math.max(rad,i===0||i===22?0:.012),y));}
 const g=new T.LatheGeometry(pts,40),p=g.attributes.position,r=rng(seed);for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),d=Math.hypot(x,z);if(d>.02){const k=1+(r()-.5)*.025;p.setX(i,x*k);p.setZ(i,z*k);}}g.computeVertexNormals();return g;}
export function lemon(seed=3,withLeaf=true){const g=new T.Group(),peel=std(0xe6c443,.48);const body=finish(new T.Mesh(lemonGeometry(seed),peel));body.rotation.z=Math.PI/2;g.add(body);
 const nub=finish(new T.Mesh(new T.CylinderGeometry(.03,.04,.05,10),std(0x7a7a3a,.8)));nub.rotation.z=Math.PI/2;nub.position.x=.44;g.add(nub);
 if(withLeaf){const leaf=finish(new T.Mesh(leafGeometry({width:.4,cup:.25,droop:.1}),std(0x46733a,.45,{side:T.DoubleSide})));leaf.scale.setScalar(.42);leaf.position.set(.44,.05,0);leaf.lookAt(new T.Vector3(.9,.12,.35));g.add(leaf);}
 return g;}
// Cut face drawn on a canvas: rind, pith and juicy segments.
function lemonFace(){const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');x.fillStyle='#e9c446';x.beginPath();x.arc(128,128,128,0,7);x.fill();x.fillStyle='#f7efcf';x.beginPath();x.arc(128,128,116,0,7);x.fill();
 for(let i=0;i<9;i++){const a=i/9*Math.PI*2,b=a+Math.PI*2/9;x.fillStyle=i%2?'#f2d867':'#efd35c';x.beginPath();x.moveTo(128+Math.cos(a+.05)*14,128+Math.sin(a+.05)*14);x.arc(128,128,104,a+.06,b-.06);x.closePath();x.fill();}
 x.fillStyle='#f8f1d8';x.beginPath();x.arc(128,128,12,0,7);x.fill();const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;}
export function lemonHalf(seed=5){const g=new T.Group(),geo=lemonGeometry(seed),p=geo.attributes.position;for(let i=0;i<p.count;i++)if(p.getY(i)>0)p.setY(i,0);geo.computeVertexNormals();
 const body=finish(new T.Mesh(geo,std(0xe6c443,.48)));g.add(body);const face=finish(new T.Mesh(new T.CircleGeometry(.265,40),std(0xffffff,.35,{map:lemonFace()})),false);face.rotation.x=-Math.PI/2;face.position.y=.002;g.add(face);
 return g;}

// Linen tea towel: gentle folds and a woven texture with two coloured stripes and fringe.
function linenTexture(){const c=document.createElement('canvas');c.width=256;c.height=512;const x=c.getContext('2d'),r=rng(11);x.fillStyle='#f3ead2';x.fillRect(0,0,256,512);
 for(let i=0;i<256;i+=2){x.fillStyle=`rgba(120,100,70,${.03+r()*.04})`;x.fillRect(i,0,1,512);}for(let j=0;j<512;j+=2){x.fillStyle=`rgba(255,255,255,${.04+r()*.05})`;x.fillRect(0,j,256,1);}
 for(const [u,col] of [[.16,'#66836a'],[.215,'#66836a'],[.775,'#b97051'],[.83,'#b97051']]){x.fillStyle=col;x.globalAlpha=.9;x.fillRect(u*256-3,0,6,512);x.globalAlpha=1;}
 x.fillStyle='#e7dcbf';for(let i=4;i<252;i+=5){x.fillRect(i,0,2,10);x.fillRect(i,502,2,10);}
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t;}
export function linen(w=2.2,d=3.7){const geo=new T.PlaneGeometry(w,d,22,34);geo.rotateX(-Math.PI/2);const p=geo.attributes.position;
 for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);p.setY(i,.032+.016*Math.sin(z*3.4+x*1.2)*Math.cos(x*2.3)+.035*Math.max(0,(z-d*.36)/(d*.14))**2);}geo.computeVertexNormals();
 return finish(new T.Mesh(geo,std(0xffffff,.95,{map:linenTexture(),side:T.DoubleSide})),false);}

// Glass storage jar with contents (pasta, beans or dried herbs) and a wooden lid.
export function pantryJar(kind=0,seed=1){const g=new T.Group(),r=rng(seed),colors=[0xe8c56f,0xb7794d,0x6f8a5a];
 const fill=.42+kind*.06,content=lathe([[0,.03],[.25,.03],[.25,fill],[0,fill]],std(colors[kind],.8),32);g.add(content);
 for(let i=0;i<14;i++){const a=r()*Math.PI*2,d=r()*.2,bit=kind===0?new T.CylinderGeometry(.035,.035,.14,8):new T.SphereGeometry(kind===1?.05:.04,8,6),m=finish(new T.Mesh(bit,std(colors[kind],.75)));m.position.set(Math.cos(a)*d,fill+.02,Math.sin(a)*d);m.rotation.set(r()*3,r()*3,r()*3);if(kind===2)m.scale.set(1.6,.4,.8);g.add(m);}
 const glass=lathe([[0,0],[.27,0],[.29,.03],[.29,.62],[.25,.68],[.25,.72],[0,.72]],std(0xd7e6dd,.05,{transparent:true,opacity:.28,depthWrite:false}),32);glass.castShadow=false;glass.renderOrder=2;g.add(glass);
 g.add(lathe([[0,.7],[.29,.7],[.3,.74],[.29,.8],[.12,.81],[.1,.86],[.06,.9],[0,.9]],std(0x9e794c,.85),32));
 return g;}
