const fs=require('node:fs');
const vm=require('node:vm');
const {randomUUID}=require('node:crypto');
module.exports=function harness(options={}){
 const nodes=new Map(),storage=options.storage||new Map(),events={document:{},window:{}};
 let quota=options.quota??Infinity,clock=Date.now();
 const node=selector=>{if(!nodes.has(selector))nodes.set(selector,{hidden:true,open:false,inert:false,dataset:{},value:'',innerHTML:'',textContent:'',classList:{add(){},remove(){},toggle(){},contains(){return false}},setAttribute(){},removeAttribute(){},focus(){},showModal(){this.open=true},close(){this.open=false}});return nodes.get(selector)};
 const listen=target=>(name,fn)=>{(events[target][name]??=[]).push(fn)};
 const timers=[];
 class TestDate extends Date{constructor(...args){super(...(args.length?args:[clock]))}static now(){return clock}}
 const context=vm.createContext({console,Date:TestDate,performance,crypto:{randomUUID},setInterval(){return 1},clearInterval(){},setTimeout(fn){timers.push(fn);return timers.length},clearTimeout(){},localStorage:{getItem:k=>{if(options.unavailable)throw Error('SecurityError');return storage.get(k)||null},setItem:(k,v)=>{if(options.unavailable||v.length>quota)throw Error('QuotaExceededError');storage.set(k,v)}},location:{hash:'#dashboard',reload(){}},navigator:options.navigator||{},document:{documentElement:{dataset:{theme:'light'}},querySelector:node,querySelectorAll:()=>[],addEventListener:listen('document')},window:{addEventListener:listen('window'),scrollTo(){}},FormData:class{constructor(form){return Object.entries(form.values)}},Blob,URL});
 for(const file of ['dist/data.js','dist/app.js'])vm.runInContext(fs.readFileSync(file,'utf8'),context);
 const run=s=>vm.runInContext(s,context);
 return {run,storage,nodes,node,events,timers,setQuota:n=>quota=n,setClock:n=>clock=n,advance:n=>clock+=n,
 click(action,extra={}){const element={dataset:{action,...extra}};for(const fn of events.document.click||[])fn({target:{closest:selector=>selector==='[data-action]'?element:null},preventDefault(){}})},
 submit(id,values,dataId=''){for(const fn of events.document.submit||[])fn({target:{id,values,dataset:{id:dataId}},preventDefault(){}})},
 change(target){for(const fn of events.document.change||[])fn({target})},
 emit(target,event,data){for(const fn of events[target][event]||[])fn(data)}
 };
};
