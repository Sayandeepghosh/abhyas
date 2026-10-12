const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {randomUUID}=require('node:crypto');
function app(){
 const nodes=new Map(),storage=new Map();
 const node=s=>{if(!nodes.has(s))nodes.set(s,{hidden:true,dataset:{},value:'',innerHTML:'',textContent:'',classList:{add(){},remove(){},toggle(){},contains(){return false}},setAttribute(){},removeAttribute(){},focus(){},showModal(){},close(){}});return nodes.get(s)};
 const context=vm.createContext({console,crypto:{randomUUID},setInterval(){},clearInterval(){},setTimeout(){},clearTimeout(){},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},location:{hash:'#dashboard'},navigator:{},document:{documentElement:{dataset:{theme:'light'}},querySelector:node,querySelectorAll:()=>[],addEventListener(){}},window:{addEventListener(){},scrollTo(){}}});
 vm.runInContext(fs.readFileSync('dist/data.js','utf8'),context);
 vm.runInContext(fs.readFileSync('dist/app.js','utf8'),context);
 vm.runInContext('var alerts=[]; showAlert=(...args)=>alerts.push(args);',context);
 return s=>vm.runInContext(s,context);
}
test('focus completion logs once, persists duration and credits the completion date',()=>{const run=app();run("state.settings.focus=1;setTimerMode('focus');state.timer.running=true;state.timer.endAt=Date.now()-1000;tick();tick();");assert.equal(run('state.sessions.length'),1);assert.equal(run('state.sessions[0].minutes'),1);assert.equal(run('state.sessions[0].date===dateKey(new Date(state.sessions[0].completedAt))'),true);assert.equal(run('state.timer.running'),false);assert.equal(run('alerts.length'),1)});
test('pausing uses wall-clock time; resuming and resetting do not fabricate study time',()=>{const run=app();run('startTimer();state.timer.endAt=Date.now()+90000;startTimer();');assert.equal(run('state.timer.running'),false);assert.ok(run('state.timer.remaining')>=89&&run('state.timer.remaining')<=90);run('startTimer();setTimerMode("short");');assert.equal(run('state.sessions.length'),0);assert.equal(run('state.timer.remaining'),300)});
test('completed breaks do not count as study sessions',()=>{const run=app();run('setTimerMode("short");state.timer.running=true;state.timer.endAt=Date.now()-1;tick();');assert.equal(run('state.sessions.length'),0);assert.equal(run('alerts.length'),1)});
test('daily alarms fire once and overdue one-time alarms are disabled',()=>{const run=app();run("const d=new Date(Date.now()-60000);state.reminders=[{id:'test',title:'Read',time:String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0'),date:dateKey(d),repeat:'daily',enabled:true,lastFired:null}];checkReminders();checkReminders();");assert.equal(run('alerts.length'),1);run("state.reminders[0].repeat='once';state.reminders[0].lastFired=null;checkReminders()");assert.equal(run('state.reminders[0].enabled'),false)});
test('backup accepts a real workspace and rejects malformed or unsafe content',()=>{const run=app();assert.equal(run('!!validBackup(defaultState())'),true);assert.equal(run('!!validBackup({version:1})'),false);assert.equal(run("const copy=defaultState();copy.settings.focus=-1;!!validBackup(copy)"),false);assert.equal(run("const bad=defaultState();bad.tasks[0].id='x\" onclick=\"alert(1)';!!validBackup(bad)"),false);assert.equal(run("esc('<script>\"&')"),'&lt;script&gt;&quot;&amp;')});
test('progress, totals, and streaks reflect recorded work',()=>{const run=app();assert.equal(run('progressStats().percent'),0);run("state.progress['polity-0']=true;state.sessions.push({id:'s',subject:'Indian Polity',minutes:25,date:dateKey(),completedAt:Date.now()})");assert.equal(run('progressStats().done'),1);assert.equal(run('totalMinutes(dateKey())'),25);assert.equal(run('streak()'),1)});
