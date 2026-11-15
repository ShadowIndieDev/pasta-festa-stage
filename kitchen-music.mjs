import {SFX} from './sfx.mjs?v=1.4';
const TRACK=new URL('./assets/music/italian-kitchen-bb445b2101f0.mp3',import.meta.url).href;
export function makeLoop(context,raw){
 const fade=Math.min(Math.round(raw.sampleRate*1.2),Math.floor(raw.length/8));
 const length=raw.length-fade,out=context.createBuffer(raw.numberOfChannels,length,raw.sampleRate);let peak=0;
 for(let c=0;c<raw.numberOfChannels;c++){
  const input=raw.getChannelData(c),output=out.getChannelData(c),join=raw.length-2*fade;
  output.set(input.subarray(fade,raw.length-fade));
  for(let i=0;i<fade;i++){const a=i/(fade-1);output[join+i]=input[raw.length-fade+i]*(1-a)+input[i]*a;}
  for(const v of output)peak=Math.max(peak,Math.abs(v));
 }
 if(!Number.isFinite(peak)||peak<.0001)throw new Error('Audio is silent or invalid');
 const gain=Math.min(1.5,.78/peak);for(let c=0;c<out.numberOfChannels;c++){const a=out.getChannelData(c);for(let i=0;i<a.length;i++)a[i]*=gain;}
 return out;
}
export class Music {
 constructor(onStatus=()=>{}){this.context=null;this.enabled=true;this.volume=.22;this.wanted=false;this.buffer=null;this.loading=null;this.source=null;this.offset=0;this.onStatus=onStatus;this.finishTimers=[];this.ambient=null;this.ambientTimer=null;}
 async unlock(){
  if(!this.context){this.context=new (window.AudioContext||window.webkitAudioContext)();this.gain=this.context.createGain();this.gain.connect(this.context.destination);}
  await this.context.resume();this.gain.gain.setTargetAtTime(this.enabled?this.volume:0,this.context.currentTime,.1);
 }
 async load(){
  if(this.buffer)return this.buffer;if(this.loading)return this.loading;
  this.onStatus('BGMを準備しています…');
  this.loading=(async()=>{
   const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
   try{const response=await fetch(TRACK,{signal:controller.signal});if(!response.ok)throw new Error('Audio unavailable');const data=await response.arrayBuffer();const raw=await this.context.decodeAudioData(data);this.buffer=makeLoop(this.context,raw);this.onStatus('イタリアのキッチン「小さなキッチンのワルツ」');return this.buffer;}
   finally{clearTimeout(timer);}
  })();
  try{return await this.loading;}finally{this.loading=null;}
 }
 configure(enabled,volume){this.enabled=!!enabled;this.volume=Math.min(.6,Math.max(0,volume));if(this.gain)this.gain.gain.setTargetAtTime(this.enabled?this.volume:0,this.context.currentTime,.12);if(!this.enabled)this.detach();else if(this.wanted)this.play();}
 start(){this.wanted=true;this.play();}
 async play(){
  if(!this.enabled||!this.wanted||!this.context||this.context.state!=='running'||this.source)return;
  try{await this.load();if(!this.wanted||!this.enabled||this.source||this.context.state!=='running')return;
   const source=this.context.createBufferSource(),fade=this.context.createGain();source.buffer=this.buffer;source.loop=true;source.connect(fade);fade.connect(this.gain);const now=this.context.currentTime;fade.gain.setValueAtTime(0,now);fade.gain.linearRampToValueAtTime(.65,now+.4);
   this.offset%=this.buffer.duration;this.startedAt=now;this.source=source;this.trackGain=fade;source.onended=()=>{source.disconnect();fade.disconnect();};source.start(now,this.offset);
  }catch{this.onStatus('BGMを読み込めませんでした。通信を確認し、BGMを一度OFF→ONにしてください。');}
 }
 detach(){if(!this.source)return;const now=this.context.currentTime;this.offset=(this.offset+now-this.startedAt)%this.buffer.duration;const source=this.source,fade=this.trackGain;this.source=null;this.trackGain=null;fade.gain.cancelScheduledValues(now);fade.gain.setTargetAtTime(0,now,.03);source.stop(now+.15);}
 stop(){this.wanted=false;this.detach();this.ambience(null);for(const timer of this.finishTimers)clearTimeout(timer);this.finishTimers=[];}
 reset(){this.stop();this.offset=0;}
 note(freq,duration=.4,volume=.16,type='triangle',delay=0){if(!this.enabled||!this.context||this.context.state!=='running')return;const t=this.context.currentTime+delay,o=this.context.createOscillator(),g=this.context.createGain();o.type=type; o.frequency.value=freq;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(volume,t+.015);g.gain.exponentialRampToValueAtTime(.001,t+duration);o.connect(g);g.connect(this.gain);o.onended=()=>{o.disconnect();g.disconnect();};o.start(t);o.stop(t+duration+.05);}
 // v1.4 sound effects go through their own bus (a little louder than the music) into the shared volume.
 sfx(name,options,delay=0){if(!this.enabled||!this.context||this.context.state!=='running'||!SFX[name])return;if(!this.sfxBus){this.sfxBus=this.context.createGain();this.sfxBus.gain.value=2.4;this.sfxBus.connect(this.gain);}SFX[name](this.context,this.sfxBus,this.context.currentTime+delay,options);}
 // index = which action this is (0-based) in the scene. Delays line the sound up with the animation.
 action(phase,index=0,target=1){
  if(phase==='toss'){this.sfx('toss');this.sfx('land',{kind:index%3},.85);}
  else if(phase==='chop')this.sfx('chop',{i:index},.42);
  else if(phase==='boil')this.sfx('bubble');
  else if(phase==='sauce')this.sfx('stir');
  else if(phase==='plate')this.sfx(['pasta','pour','cheese','basil'][Math.min(3,Math.floor(index/(target/4)))]);}
 celebrate(){this.sfx('fanfare');this.sfx('applause',{},.9);}
 // Quiet simmer under the camera scenes. Only while that scene is being played.
 ambience(kind){if(kind===this.ambient)return;this.ambient=kind;clearInterval(this.ambientTimer);this.ambientTimer=null;if(!kind)return;const name=kind==='boil'?'simmerBoil':'simmerSauce';this.ambientTimer=setInterval(()=>this.sfx(name),260);}
 finish(){for(const t of this.finishTimers)clearTimeout(t);this.finishTimers=[523,659,784,1046].map((f,i)=>setTimeout(()=>this.note(f,.7,.12),i*180));}
}
