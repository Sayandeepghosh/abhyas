const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const harness=require('./harness.cjs');
test('Android exports use the document bridge without a browser blob download',()=>{
 const h=harness();h.run('var exports=[];window.AbhyasAndroid={saveFile:(...args)=>exports.push(args)};download("backup.json",JSON.stringify({version:1}),"application/json")');
 assert.equal(h.run('exports.length'),1);assert.equal(h.run('exports[0][1]'),'{"version":1}');
});
test('native screen wake state follows timer running and storage lock ownership',()=>{
 const h=harness();h.run('var awake=[];window.AbhyasAndroid={setTheme(){},keepAwake:value=>awake.push(value)};startTimer()');
 assert.equal(h.run('awake.at(-1)'),true);h.run('startTimer()');assert.equal(h.run('awake.at(-1)'),false);
 h.run('state.timer.running=true;dataStatus("Read only",true)');assert.equal(h.run('awake.at(-1)'),false);
});
test('timer ring uses wall-clock progress and clamps expired and invalid future extremes',()=>{
 const h=harness();h.run('state.timer.duration=60;state.timer.remaining=30');assert.equal(h.run('timerProgress()'),.5);
 h.run('state.timer.running=true;state.timer.endAt=Date.now()+15000');assert.equal(h.run('timerProgress()'),.25);
 h.advance(16000);assert.equal(h.run('timerProgress()'),0);h.run('state.timer.endAt=Date.now()+999999');assert.equal(h.run('timerProgress()'),1);
});
test('Android manifest requests no permissions and disables backup, cleartext, and debug mode',()=>{
 const manifest=fs.readFileSync('android/AndroidManifest.xml','utf8');assert.doesNotMatch(manifest,/uses-permission|debuggable="true"/);assert.match(manifest,/allowBackup="false"/);assert.match(manifest,/usesCleartextTraffic="false"/);
 const java=fs.readFileSync('android/src/io/github/sayandeepghosh/abhyas/MainActivity.java','utf8');
 for(const required of ['setWebContentsDebuggingEnabled(false)','setAllowFileAccess(false)','setAllowUniversalAccessFromFileURLs(false)','setBlockNetworkLoads(true)','ASSETS.contains(name)','request.hasGesture()'])assert.ok(java.includes(required),required);
 assert.doesNotMatch(java,/\.proceed\(|getExternalStorageDirectory|MANAGE_EXTERNAL_STORAGE/);
});
