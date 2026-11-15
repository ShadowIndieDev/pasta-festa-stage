// Cooking sound effects (v1.4), made in the browser with Web Audio: filtered noise and short tones.
// No sound files and no network. Each effect is a function (context, output node, start time, options).
const noiseCache=new WeakMap();
function noise(ctx){let b=noiseCache.get(ctx);if(!b){const n=Math.floor(ctx.sampleRate*2);b=ctx.createBuffer(1,n,ctx.sampleRate);const d=b.getChannelData(0);let s=22222;for(let i=0;i<n;i++){s=(s*1664525+1013904223)>>>0;d[i]=s/2147483648-1;}noiseCache.set(ctx,b);}return b;}
const rand=(a,b)=>a+Math.random()*(b-a);
// Start from silence: a new gain node is 1 until its first scheduled value, which clicked.
function shape(g,t,attack,peak,dur){g.gain.value=0;g.gain.setValueAtTime(0,0);g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(peak,t+attack);g.gain.exponentialRampToValueAtTime(.0001,t+Math.max(dur,attack+.01));}
// Filtered noise burst: hiss, swish, tap, crackle.
export function burst(ctx,out,t,{type='bandpass',freq=1000,to=0,q=1,peak=.2,attack=.004,dur=.15,rate=1}={}){
 const src=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();src.buffer=noise(ctx);src.playbackRate.value=rate;f.type=type;f.frequency.value=freq;f.frequency.setValueAtTime(freq,t);if(to)f.frequency.exponentialRampToValueAtTime(to,t+dur);f.Q.value=q;shape(g,t,attack,peak,dur);
 src.connect(f);f.connect(g);g.connect(out);src.start(t,Math.random()*1.5);src.stop(t+dur+.05);src.onended=()=>{src.disconnect();f.disconnect();g.disconnect();};}
// Tone with an optional pitch glide.
export function tone(ctx,out,t,{freq=440,to=0,type='sine',peak=.15,attack=.005,dur=.3}={}){
 const o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);if(to)o.frequency.exponentialRampToValueAtTime(to,t+dur);shape(g,t,attack,peak,dur);
 o.connect(g);g.connect(out);o.start(t);o.stop(t+dur+.05);o.onended=()=>{o.disconnect();g.disconnect();};}

export const SFX={
 // 幕をあける: a soft rising swish, then three bright notes.
 curtain(c,o,t){burst(c,o,t,{type:'lowpass',freq:300,to:3200,q:.7,peak:.14,attack:.35,dur:1});[523,659,784].forEach((f,i)=>{tone(c,o,t+.4+i*.13,{freq:f,type:'triangle',peak:.1,dur:.9});tone(c,o,t+.4+i*.13,{freq:f*2,peak:.025,dur:.6});});},
 // 次の係が はじめる / 再開: a small kitchen bell.
 cue(c,o,t){for(const [f,p,d] of [[1318,.08,1.3],[1976,.035,.9],[2637,.02,.6]])tone(c,o,t,{freq:f,peak:p,dur:d,attack:.003});},
 // 次の場面へ: a light page turn.
 page(c,o,t){burst(c,o,t,{freq:3000,to:1200,q:.8,peak:.16,attack:.03,dur:.32});burst(c,o,t+.12,{freq:1800,to:900,q:.8,peak:.09,attack:.02,dur:.2});},
 // 投げる: whoosh as the vegetable leaves the basket.
 toss(c,o,t){burst(c,o,t,{freq:500,to:2400,q:1.4,peak:.24,attack:.12,dur:.5});tone(c,o,t,{freq:420,to:700,peak:.05,dur:.12});},
 // まな板に着地: kind 0 tomato (soft), 1 carrot (woody knock), 2 onion (papery).
 land(c,o,t,{kind=0}={}){
  if(kind===0){tone(c,o,t,{freq:150,to:70,peak:.26,dur:.2});burst(c,o,t,{type:'lowpass',freq:900,peak:.12,dur:.08});}
  else if(kind===1){tone(c,o,t,{freq:330,to:240,type:'triangle',peak:.18,dur:.12});burst(c,o,t,{freq:1900,q:4,peak:.13,dur:.05});tone(c,o,t+.09,{freq:300,to:230,type:'triangle',peak:.06,dur:.08});}
  else{tone(c,o,t,{freq:210,to:110,peak:.2,dur:.15});burst(c,o,t,{freq:3200,q:1,peak:.09,dur:.07});}},
 // 切る: the knife reaches the board — a click plus the wooden body of the board.
 chop(c,o,t,{i=0}={}){const k=1+(i%3)*.04;burst(c,o,t,{freq:2300*k,q:3,peak:.2,attack:.002,dur:.045});tone(c,o,t,{freq:175*k,to:120,type:'triangle',peak:.22,dur:.13});burst(c,o,t+.01,{type:'highpass',freq:5000,peak:.04,dur:.05});},
 // 茹でる: water swirl and a few bubbles.
 bubble(c,o,t){burst(c,o,t,{type:'lowpass',freq:500,q:.8,peak:.1,attack:.15,dur:.6});for(let n=0;n<4;n++){const f=rand(320,620);tone(c,o,t+rand(.05,.5),{freq:f,to:f*1.9,peak:.06,attack:.004,dur:.07});}},
 // ソース: thick sauce turning over, with a light sizzle.
 stir(c,o,t){tone(c,o,t+.05,{freq:120,to:78,peak:.13,dur:.17});tone(c,o,t+.28,{freq:105,to:70,peak:.08,dur:.15});burst(c,o,t,{type:'highpass',freq:4200,peak:.045,attack:.05,dur:.55});},
 // 盛り付け: pasta lands, sauce pours, cheese falls, basil is placed.
 pasta(c,o,t){burst(c,o,t,{type:'lowpass',freq:700,q:.8,peak:.2,attack:.01,dur:.18});tone(c,o,t,{freq:230,to:150,peak:.08,dur:.14});burst(c,o,t+.06,{type:'lowpass',freq:500,peak:.06,dur:.12});},
 pour(c,o,t){burst(c,o,t,{type:'lowpass',freq:450,q:2,peak:.14,attack:.08,dur:.65});[170,210,190].forEach((f,i)=>tone(c,o,t+.08+i*.15,{freq:f,to:f*1.35,peak:.08,dur:.1}));},
 cheese(c,o,t){for(let n=0;n<16;n++)burst(c,o,t+n*.032+rand(0,.02),{type:'highpass',freq:rand(4500,7000),q:.7,peak:rand(.06,.1),attack:.001,dur:.025});},
 basil(c,o,t){burst(c,o,t,{freq:3600,q:2,peak:.15,attack:.01,dur:.08});tone(c,o,t+.02,{freq:1400,to:1700,peak:.03,dur:.1});},
 // 完成: a short fanfare, then applause.
 fanfare(c,o,t){[[523,0],[659,.16],[784,.32],[1046,.5]].forEach(([f,d])=>{tone(c,o,t+d,{freq:f,type:'triangle',peak:.11,dur:.5});tone(c,o,t+d,{freq:f*2,peak:.03,dur:.35});});for(const f of [523,659,784,1046])tone(c,o,t+.72,{freq:f,type:'triangle',peak:.06,attack:.02,dur:1.6});},
 applause(c,o,t,{seconds=3.2}={}){for(let n=0;n<110;n++){const at=Math.pow(Math.random(),.85)*seconds,fade=1-at/seconds*.7;burst(c,o,t+at,{freq:rand(900,2600),q:1.3,peak:rand(.08,.16)*fade,attack:.001,dur:rand(.025,.05)});}},
 // Quiet beds while the camera scenes are playing (called every ~0.26 s).
 simmerBoil(c,o,t){if(Math.random()<.65){const f=rand(280,560);tone(c,o,t+rand(0,.2),{freq:f,to:f*1.8,peak:.025,attack:.004,dur:.06});}},
 simmerSauce(c,o,t){if(Math.random()<.35)tone(c,o,t+rand(0,.2),{freq:rand(85,120),to:65,peak:.05,dur:.14});burst(c,o,t,{type:'highpass',freq:5200,peak:.012,attack:.08,dur:.3});},
};
export const SFX_NAMES=Object.keys(SFX);
