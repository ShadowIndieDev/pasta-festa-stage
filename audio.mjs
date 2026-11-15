export class Music {
 constructor(){this.context=null;this.enabled=true;this.volume=.22;this.beat=0;this.timer=null;}
 async unlock(){if(!this.context){this.context=new (window.AudioContext||window.webkitAudioContext)();this.gain=this.context.createGain();this.gain.connect(this.context.destination);}await this.context.resume();this.gain.gain.value=this.enabled?this.volume:0;}
 configure(enabled,volume){this.enabled=enabled;this.volume=volume;if(this.gain)this.gain.gain.setTargetAtTime(enabled?volume:0,this.context.currentTime,.1);}
 note(freq,duration=.4,volume=.16,type='triangle'){if(!this.context||this.context.state!=='running')return;const t=this.context.currentTime,o=this.context.createOscillator(),g=this.context.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(volume,t+.015);g.gain.exponentialRampToValueAtTime(.001,t+duration);o.connect(g);g.connect(this.gain);o.start(t);o.stop(t+duration+.05);}
 start(){if(this.timer)return;const melody=[64,67,71,67,64,59,62,67,69,67,62,59,60,64,67,64,60,55,59,62,67,62,59,55];this.timer=setInterval(()=>{const n=melody[this.beat%melody.length];this.note(440*2**((n-69)/12),.48,.11);if(this.beat%3===0)this.note(440*2**(((this.beat<12?48:43)-69)/12),.8,.06,'sine');this.beat=(this.beat+1)%24;},390);}
 stop(){clearInterval(this.timer);this.timer=null;}
 action(phase){this.note(phase==='chop'?180:phase==='plate'?660:330,.12,.2,phase==='chop'?'triangle':'sine');}
 finish(){[523,659,784,1046].forEach((f,i)=>setTimeout(()=>this.note(f,.7,.12),i*180));}
}
