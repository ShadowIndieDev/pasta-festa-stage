export const STAGES = [
 {id:'chop',name:'具材を切る',role:1,key:' ',verb:'ことん！',hint:'トマト・玉ねぎ・にんじんを切ろう',label:'切る',steps:24},
 {id:'boil',name:'パスタを茹でる',role:2,key:' ',verb:'くるくる',hint:'お鍋のパスタを、ゆっくり混ぜよう',label:'混ぜる',steps:24},
 {id:'sauce',name:'ソースをつくる',role:2,key:' ',verb:'くるくる',hint:'ひき肉と野菜が、おいしいソースに',label:'混ぜる',steps:28},
 {id:'plate',name:'お皿に盛り付ける',role:3,key:' ',verb:'のせよう',hint:'パスタ、ソース、チーズ、バジルの順に',label:'盛り付ける',steps:16}
];
// v1.6: the toss scene (role 0) is cut; the show starts at chopping. Role 0 stays in names[] so saved names keep their places.
// 少なめ (amount .67) chops 3 per vegetable = 9; the other amounts keep 24 and 36.
export const CHOP_FEW=9;
export const DEFAULTS={names:['投げる係','切る係','混ぜる係','盛り付け係'],sensitivity:3,amount:1,music:true,volume:.22,autoNext:false,device:'',roi:'center',keys:[' ',' ',' ',' '],reduced:false};
export function sanitize(input={}){const v={...DEFAULTS,...input};// v1.2 saved three names (切る・混ぜる・盛り付け). Keep them on their roles after the new first role.
 const names=Array.isArray(input.names)&&input.names.length===3?[undefined,...input.names]:input.names;v.names=DEFAULTS.names.map((n,i)=>typeof names?.[i]==='string'?names[i].slice(0,24):n);v.keys=DEFAULTS.keys.map((k,i)=>['Enter',' ','Shift'].includes(input.keys?.[i])?input.keys[i]:k);v.sensitivity=Math.min(5,Math.max(1,Number(v.sensitivity)||3));v.amount=[.67,1,1.5].includes(Number(v.amount))?Number(v.amount):1;v.volume=Math.min(.6,Math.max(0,Number(v.volume)||0));v.device=typeof v.device==='string'?v.device:'';v.roi=['center','left','right','full'].includes(v.roi)?v.roi:'center';for(const k of ['music','autoNext','reduced'])v[k]=v[k]===true;return v;}
export class Show {
 constructor(settings=DEFAULTS){this.settings=settings;this.reset();}
 reset(){this.index=0;this.count=0;this.total=0;this.status='intro';this.last=-Infinity;}
 get stage(){return STAGES[this.index];}
 get target(){if(this.stage.id==='chop'&&this.settings.amount===.67)return CHOP_FEW;const unit=this.stage.id==='plate'?4:['chop','toss'].includes(this.stage.id)?3:1;return Math.max(unit,Math.round(this.stage.steps*this.settings.amount/unit)*unit);}
 start(){if(this.status==='intro'||this.status==='ready'){this.status='playing';this.last=-Infinity;return true;}return false;}
 act(now){if(this.status!=='playing'||now-this.last<1100)return false;this.last=now;this.count++;this.total++;if(this.count>=this.target)this.status='complete';return true;}
 next(){if(this.status!=='complete')return false;if(this.index===STAGES.length-1){this.status='final';return true;}this.index++;this.count=0;this.last=-Infinity;this.status='ready';return true;}
 pause(){if(this.status==='playing'){this.status='paused';return true;}return false;}
 resume(){if(this.status==='paused'){this.status='playing';this.last=-Infinity;return true;}return false;}
}
