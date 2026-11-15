import {GLTFLoader} from './vendor/GLTFLoader.js';
export async function loadFoodKit(){
 const gltf=await new GLTFLoader().loadAsync(new URL('./assets/food-kit.glb',import.meta.url).href);
 const assets=new Map(gltf.scene.children.map(o=>[o.name,o]));
 for(const n of ['spaghetti','water_pasta','ragu','pan_ragu','parmesan','basil','plate','tomato','tomato_slice','onion','onion_slice','carrot','carrot_slice'])if(!assets.has(n))throw new Error('Missing food asset: '+n);
 gltf.scene.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.userData.sharedFood=true;}});
 return {make(name,parent){const o=assets.get(name).clone(true);parent.add(o);return o;},names:[...assets.keys()]};
}
