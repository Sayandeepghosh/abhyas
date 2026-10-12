const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function motionHarness({stored='system',reduced=false,page='dashboard'}={}){
 const events={},frames=new Map(),observers=[],classes=new Set();let next=0,cancels=0,reads=0;
 const scene={style:{},closest:()=>true,getBoundingClientRect(){reads++;return {left:0,top:0,width:500,height:500}}};
 const root={dataset:{},classList:{toggle(c,v){v?classes.add(c):classes.delete(c)},contains:c=>classes.has(c)}};
 const modal={open:false,classList:{add(){},remove(){}},addEventListener(){}};
 const media={matches:reduced,addEventListener(_name,fn){this.change=fn}};
 const choices=['system','full','reduced'].map(value=>({dataset:{motionChoice:value},setAttribute(k,v){this[k]=v}}));
 const doc={documentElement:root,hidden:false,querySelector:s=>s==='.orbit-stage'?scene:s==='#modal'?modal:null,querySelectorAll:s=>s==='[data-motion-choice]'?choices:[],addEventListener:(name,fn)=>{(events[name]??=[]).push(fn)}};
 const context=vm.createContext({console,document:doc,window:{IntersectionObserver:true},matchMedia:()=>media,localStorage:{getItem:()=>stored,setItem(_k,v){stored=v}},nav:[],state:{tasks:[]},currentPage:page,writeAllowed:true,$:s=>s==='#modal'?modal:null,IntersectionObserver:class{constructor(fn){this.fn=fn;this.disconnected=false;observers.push(this)}observe(){}disconnect(){this.disconnected=true}},requestAnimationFrame:fn=>{frames.set(++next,fn);return next},cancelAnimationFrame:id=>{if(frames.delete(id))cancels++},setTimeout(){}});
 vm.runInContext(fs.readFileSync('dist/motion.js','utf8'),context);
 return {doc,root,scene,media,choices,frames,observers,get reads(){return reads},get cancels(){return cancels},mount:()=>context.window.AbhyasMotion.mount(),emit:(name,e)=>events[name]?.forEach(fn=>fn(e)),flush(){for(const [id,fn]of frames){frames.delete(id);fn()}}};
}
test('saved reduced motion disables effects, and system accessibility overrides expressive mode',()=>{
 const h=motionHarness({stored:'reduced'});assert.equal(h.root.dataset.motion,'reduced');assert.equal(h.choices[2]['aria-pressed'],true);
 const system=motionHarness({stored:'full',reduced:true});assert.equal(system.root.dataset.motion,'reduced');system.media.matches=false;system.media.change();assert.equal(system.root.dataset.motion,'full');
});
test('a burst of pointer events schedules one frame and one geometry read',()=>{
 const h=motionHarness();for(let i=0;i<100;i++)h.emit('pointermove',{pointerType:'mouse',clientX:150+i,clientY:200,target:{closest:()=>true}});
 assert.equal(h.frames.size,1);assert.equal(h.reads,0);h.flush();assert.equal(h.reads,1);assert.match(h.scene.style.transform,/rotateY/);
});
test('navigation disconnects observers and cancels a queued frame for the previous scene',()=>{
 const h=motionHarness();h.emit('pointermove',{pointerType:'mouse',clientX:150,clientY:200,target:{closest:()=>true}});h.mount();assert.equal(h.frames.size,0);assert.equal(h.cancels,1);assert.equal(h.observers[0].disconnected,true);assert.equal(h.scene.style.transform,'');
});
test('hidden documents and touch pointers cannot drive parallax work',()=>{
 const h=motionHarness();h.emit('pointermove',{pointerType:'touch'});assert.equal(h.frames.size,0);h.doc.hidden=true;h.emit('visibilitychange',{});h.emit('pointermove',{pointerType:'mouse'});assert.equal(h.frames.size,0);assert.equal(h.root.classList.contains('document-hidden'),true);
});
test('reduced motion schedules no pointer animation even after many movements',()=>{
 const h=motionHarness({stored:'reduced'});for(let i=0;i<100;i++)h.emit('pointermove',{pointerType:'mouse',clientX:100,clientY:100});assert.equal(h.frames.size,0);assert.equal(h.reads,0);
});
test('clicking ordinary content cannot toggle immersive mode after it has been activated',()=>{
 const h=motionHarness({page:'focus'}),button={};
 h.emit('click',{target:{closest:s=>s==='[data-zen]'?button:null}});assert.equal(h.root.classList.contains('zen-active'),true);
 h.emit('click',{target:{closest:s=>s==='[data-zen]'&&h.root.dataset.zen!==undefined?h.root:null}});assert.equal(h.root.classList.contains('zen-active'),true);
 h.mount();assert.equal(h.root.classList.contains('zen-active'),true);
});
