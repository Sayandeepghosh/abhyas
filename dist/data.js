'use strict';
// Treat imported files and browser storage as untrusted data.
function validateStudyData(x, subjects, syllabus) {
  try {
    const obj=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
    const str=(v,max)=>typeof v==='string'&&v.length<=max;
    const integer=(v,min,max)=>Number.isInteger(v)&&v>=min&&v<=max;
    const number=(v,min,max)=>Number.isFinite(v)&&v>=min&&v<=max;
    const date=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&v>='1900-01-01'&&v<='2200-12-31'&&new Date(v+'T00:00:00Z').toISOString().slice(0,10)===v;
    const time=v=>typeof v==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(v);
    const id=v=>str(v,100)&&/^[a-zA-Z0-9-]+$/.test(v);
    const stage=v=>['Both','Prelims','Mains','Revision'].includes(v);
    const subject=v=>subjects.includes(v);
    const rows=(list,max,check)=>Array.isArray(list)&&list.length<=max&&new Set(list.map(v=>v?.id)).size===list.length&&list.every(v=>obj(v)&&id(v.id)&&check(v));
    if(!obj(x)||x.version!==1||!obj(x.settings))return false;
    const s=x.settings;
    if(!(str(s.name,40)&&s.name.trim()&&['light','dark'].includes(s.theme)&&integer(s.focus,1,180)&&integer(s.short,1,30)&&integer(s.long,1,60)&&number(s.goal,.5,16)&&s.goal*2%1===0&&(s.examDate===''||date(s.examDate))&&typeof s.sound==='boolean'))return false;
    if(!rows(x.tasks,10000,t=>str(t.title,180)&&t.title.trim()&&subject(t.subject)&&stage(t.stage)&&integer(t.minutes,5,600)&&t.minutes%5===0&&date(t.date)&&typeof t.done==='boolean'))return false;
    if(!rows(x.notes,10000,n=>str(n.title,160)&&str(n.body,1000000)&&subject(n.subject)&&stage(n.stage)&&integer(n.updated,0,7258118400000)))return false;
    if(!rows(x.sessions,100000,s=>subject(s.subject)&&date(s.date)&&integer(s.minutes,1,180)&&integer(s.completedAt,0,7258118400000)))return false;
    if(!rows(x.reminders,1000,r=>str(r.title,100)&&r.title.trim()&&time(r.time)&&date(r.date)&&['daily','once'].includes(r.repeat)&&typeof r.enabled==='boolean'&&(r.lastFired==null||date(r.lastFired))&&(r.dueAt==null||integer(r.dueAt,0,7258118400000))))return false;
    const topicKeys=new Set(syllabus.flatMap(s=>s.topics.map((_,i)=>`${s.id}-${i}`)));
    return obj(x.progress)&&Object.entries(x.progress).every(([k,v])=>topicKeys.has(k)&&typeof v==='boolean')&&obj(x.water)&&Object.keys(x.water).length<=100000&&Object.entries(x.water).every(([k,v])=>date(k)&&integer(v,0,100));
  } catch { return false; }
}
function cleanStudyData(x) {
  const pick=(o,keys)=>Object.fromEntries(keys.map(k=>[k,o[k]]));
  return {
    version:1,
    settings:pick(x.settings,['name','theme','focus','short','long','goal','examDate','sound']),
    tasks:x.tasks.map(t=>pick(t,['id','title','subject','stage','minutes','date','done'])),
    notes:x.notes.map(n=>pick(n,['id','title','subject','stage','body','updated'])),
    sessions:x.sessions.map(s=>pick(s,['id','subject','minutes','date','completedAt'])),
    reminders:x.reminders.map(r=>({...pick(r,['id','title','time','date','repeat','enabled']),lastFired:r.lastFired??null,...(r.dueAt==null?{}:{dueAt:r.dueAt})})),
    progress:{...x.progress},water:{...x.water}
  };
}
function validateTimer(t,subjects){return !!t&&['focus','short','long'].includes(t.mode)&&subjects.includes(t.subject)&&Number.isInteger(t.duration)&&t.duration>=60&&t.duration<=10800&&Number.isInteger(t.remaining)&&t.remaining>=0&&t.remaining<=t.duration&&typeof t.running==='boolean'&&(t.running?Number.isInteger(t.endAt)&&t.endAt>=0&&t.endAt<=Date.now()+t.duration*1000+60000:t.endAt===null)}
