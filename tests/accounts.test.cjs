const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function harness(storage=new Map()){
 const nodes=new Map(),events={},alerts=[];let reloads=0,quota=false;
 const node=id=>{if(!nodes.has(id))nodes.set(id,{value:'',textContent:'',hidden:false,inert:false,disabled:false,innerHTML:'',classList:{remove(){}},querySelector:node,querySelectorAll:()=>[],remove(){},reset(){},append(){}});return nodes.get(id)};
 const context=vm.createContext({crypto:require('node:crypto').webcrypto,TextEncoder,TextDecoder,btoa,atob,Uint8Array,console,Blob,URL,setTimeout,navigator:{},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>{if(quota)throw Error('quota');storage.set(k,v)},removeItem:k=>storage.delete(k)},document:{createElement:()=>node('screen'),querySelector:node,body:{prepend(){},append(){},classList:{remove(){}}},head:{append(script){script.onload()}}},location:{reload(){reloads++}},alert:m=>alerts.push(m),confirm:()=>true,prompt:()=> 'alice',addEventListener:(name,fn)=>events[name]=fn});
 context.window=context;
 for(const f of ['password-policy','vault','accounts'])vm.runInContext(fs.readFileSync(`dist/${f}.js`,'utf8'),context);
 return {context,node,storage,events,alerts,reloads:()=>reloads,quota:()=>quota=true,async enter(name,password,signup=false){if(signup)node('#account-switch').onclick();node('#account-confirm').value=password;await node('form').onsubmit({preventDefault(){},stopPropagation(){},target:{username:{value:name},password:{value:password},reset(){}}})}};
}
test('signup stores ciphertext only, persists changes, and login isolates accounts',async()=>{
 const h=harness();await h.enter('Alice','TestOnly!Study2040',true);
 assert.ok(h.storage.has('abhyas-account-v1:alice'));assert.equal(h.storage.has('abhyas-v1'),false);
 h.context.AbhyasStorage.setItem('abhyas-v1','private study notes');await h.node('#account-lock').onclick();assert.equal(h.reloads(),1);
 assert.ok(![...h.storage.values()].join('').includes('private study notes'));assert.ok(![...h.storage.values()].join('').includes('TestOnly!Study2040'));
 const wrong=harness(h.storage);await wrong.enter('alice','Wrong!Password2040');assert.equal(wrong.context.AbhyasStorage,undefined);
 const good=harness(h.storage);await good.enter('ALICE','TestOnly!Study2040');assert.equal(good.context.AbhyasStorage.getItem(), 'private study notes');
 const bob=harness(h.storage);await bob.enter('bob','TestOnly!Study2040',true);assert.equal(bob.context.AbhyasStorage.getItem(),null);
});
test('quota failure preserves last ciphertext and blocks logout with unsaved changes',async()=>{
 const h=harness();await h.enter('alice','TestOnly!Study2040',true);const before=h.storage.get('abhyas-account-v1:alice');h.quota();h.context.AbhyasStorage.setItem('abhyas-v1','unsaved');await h.node('#account-lock').onclick();assert.equal(h.reloads(),0);assert.equal(h.storage.get('abhyas-account-v1:alice'),before);assert.match(h.node('#vault-status').textContent,/Not saved/);assert.ok(h.alerts.length);
});
test('confirmed deletion removes only the selected account',async()=>{
 const h=harness(new Map([['abhyas-account-v1:bob','other account']]));await h.enter('alice','TestOnly!Study2040',true);await h.node('#account-delete').onclick();assert.equal(h.storage.has('abhyas-account-v1:alice'),false);assert.equal(h.storage.get('abhyas-account-v1:bob'),'other account');assert.equal(h.reloads(),1);
});
test('encrypted restore refuses overwrite and recovers with original password',async()=>{
 const original=harness();await original.enter('alice','TestOnly!Study2040',true);original.context.AbhyasStorage.setItem('', 'restorable notes');await original.node('#account-lock').onclick();
 const backup=JSON.stringify({user:'alice',record:JSON.parse(original.storage.get('abhyas-account-v1:alice'))});
 const restored=harness(),event={target:{files:[{size:backup.length,text:async()=>backup}],value:'backup'}};
 await restored.node('#account-restore').onchange(event);const before=restored.storage.get('abhyas-account-v1:alice');await restored.node('#account-restore').onchange(event);assert.equal(restored.storage.get('abhyas-account-v1:alice'),before);assert.match(restored.node('#account-message').textContent,/already exists/);
 await restored.enter('alice','TestOnly!Study2040');assert.equal(restored.context.AbhyasStorage.getItem(),'restorable notes');
});
test('legacy migration removes plaintext only after encryption succeeds',async()=>{
 for(const fail of [false,true]){const legacy=JSON.stringify({notes:['legacy']}),h=harness(new Map([['abhyas-v1',legacy]]));h.context.validBackup=()=>true;await h.enter('alice','TestOnly!Study2040',true);if(fail)h.quota();await h.node('#account-migrate').onclick();assert.equal(h.storage.has('abhyas-v1'),fail);if(!fail){const reopened=harness(h.storage);await reopened.enter('alice','TestOnly!Study2040');assert.equal(reopened.context.AbhyasStorage.getItem(),legacy)}}
});
