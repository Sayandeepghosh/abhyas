const test=require('node:test'),assert=require('node:assert/strict');
const harness=require('./harness.cjs');
test('large workspace: 5000 notes, 10000 tasks and 100000 sessions remain valid with bounded initial rendering',()=>{
 const h=harness();
 h.run("state.notes=Array.from({length:5000},(_,i)=>({id:'n'+i,title:'Revision '+i,body:'A short revision note. '.repeat(20),subject:'Indian Polity',stage:'Both',updated:Date.now()}));state.tasks=Array.from({length:10000},(_,i)=>({id:'t'+i,title:'Study task '+i,subject:'Economy',stage:'Prelims',minutes:25,date:dateKey(),done:false}));state.sessions=Array.from({length:100000},(_,i)=>({id:'s'+i,subject:'Economy',minutes:25,date:dateKey(),completedAt:Date.now()}))");
 const start=performance.now();assert.equal(h.run('validBackup(state)'),true);
 const notes=h.run('notesPage()'),tasks=h.run('planner()');h.run('dashboard()');
 assert.equal((notes.match(/class="note-preview/g)||[]).length,100);assert.equal((tasks.match(/class="task-row/g)||[]).length,100);
 assert.match(notes,/Show more notes/);assert.match(tasks,/Show more tasks/);
 const ms=performance.now()-start;console.log(`Large-workspace validation + notes/planner/dashboard rendering: ${ms.toFixed(1)} ms`);assert.ok(ms<10000,'must finish within a generous 10 second bound');
});
test('one-million-character note has a bounded preview and accurate word count',()=>{const h=harness();h.run("state.notes[0].body='word '.repeat(200000)");const before=performance.now(),html=h.run('noteList(state.notes)');assert.ok(html.length<5000);assert.equal(h.run('wordCount(state.notes[0].body)'),200000);console.log(`1 MB note preview + word count: ${(performance.now()-before).toFixed(1)} ms`)});
