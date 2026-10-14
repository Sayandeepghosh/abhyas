const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const context=vm.createContext({crypto:require('node:crypto').webcrypto,TextEncoder,TextDecoder,btoa,atob,Uint8Array});
vm.runInContext(fs.readFileSync('dist/vault.js','utf8'),context);
const vault=context.AbhyasVault;
test('encrypted workspace round trip and authentication rejects wrong passwords, users and tampering',async()=>{
 const salt=vault.salt(),key=await vault.key('TestOnly!Study2040',salt),raw=JSON.stringify({notes:['private note']});
 const first=await vault.seal(key,raw,'alice'),second=await vault.seal(key,raw,'alice');
 assert.notEqual(first.iv,second.iv);assert.notEqual(first.data,second.data);assert.equal(key.extractable,false);
 assert.equal(await vault.open(key,first,'alice'),raw);assert.ok(!JSON.stringify(first).includes('private note'));
 await assert.rejects(vault.open(key,first,'bob'));
 const wrong=await vault.key('WrongOnly!Study2040',salt);await assert.rejects(vault.open(wrong,first,'alice'));
 const bytes=Buffer.from(first.data,'base64');bytes[0]^=1;await assert.rejects(vault.open(key,{...first,data:bytes.toString('base64')},'alice'));
 const restored=await vault.key('TestOnly!Study2040',salt);assert.equal(await vault.open(restored,JSON.parse(JSON.stringify(first)),'alice'),raw);
});
test('different account salts yield incompatible keys even for the same password',async()=>{
 const one=await vault.key('TestOnly!Study2040',vault.salt()),two=await vault.key('TestOnly!Study2040',vault.salt());
 await assert.rejects(vault.open(two,await vault.seal(one,'workspace','alice'),'alice'));
});
