export const clamp01=v=>Math.min(1,Math.max(0,v));
export const smooth=v=>{const t=clamp01(v);return t*t*(3-2*t);};
// Rest -> descending cut -> contact -> recovery. Continuous position and velocity.
export function knifeHeight(t){return t<.44?1.65-1.03*smooth(t/.44):.62+1.03*smooth((t-.44)/.56);}
export function platingFractions(count,target){return [0,1,2,3].map(i=>clamp01(count/(target/4)-i));}
export function ingredientAt(count,target){return Math.min(2,Math.floor(count/(target/3)));}
