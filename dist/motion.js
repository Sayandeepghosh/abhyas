'use strict';
(() => {
 const root=document.documentElement,reduce=matchMedia('(prefers-reduced-motion: reduce)');
 let preference='system',observer=null,scene=null,frame=0,pointerX=0,pointerY=0;
 const commands=[...nav.map(([page,title,ic])=>({title,ic,page})),{title:'Settings',ic:'settings',page:'settings'},{title:'Add a study task',ic:'plus',action:'task-add'},{title:'Create a note',ic:'note',action:'note-add'},{title:'Add a reminder',ic:'bell',action:'reminder-add'}];
 try{preference=localStorage.getItem('abhyas-motion')||'system'}catch{}
 if(!['system','full','reduced'].includes(preference))preference='system';
 function applyMotion(){root.dataset.motion=preference==='reduced'||reduce.matches?'reduced':'full';root.dataset.motionPreference=preference;document.querySelectorAll('[data-motion-choice]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.motionChoice===preference));if(root.dataset.motion==='reduced')cancelPointer()}
 function cancelPointer(){cancelAnimationFrame(frame);frame=0;if(scene)scene.style.transform=''}
 function mount(){
  observer?.disconnect();cancelPointer();scene=document.querySelector('.orbit-stage');
  document.querySelector('.page-content')?.classList.add('studio-enter');
  root.classList.toggle('zen-active',currentPage==='focus'&&root.dataset.immersive==='true');
  document.querySelectorAll('[data-zen]').forEach(b=>{b.setAttribute('aria-pressed',root.dataset.immersive==='true');b.setAttribute('aria-label',root.dataset.immersive==='true'?'Leave immersive focus':'Enter immersive focus')});
  const settings=document.querySelector('.settings-grid');
  if(settings&&!settings.querySelector('.motion-settings'))settings.insertAdjacentHTML('beforeend',`<section class="card settings-card motion-settings"><span class="card-kicker">MAKE IT FEEL RIGHT</span><h2>Motion & atmosphere</h2><p>Choose expressive movement or a quieter workspace. Your device’s reduced-motion preference is always respected.</p><div class="motion-choices" role="group" aria-label="Animation preference"><button data-motion-choice="system">System</button><button data-motion-choice="full">Expressive</button><button data-motion-choice="reduced">Reduced</button></div></section>`);
  applyMotion();
  if('IntersectionObserver' in window){observer=new IntersectionObserver(entries=>entries.forEach(({target,isIntersecting})=>target.classList.toggle('in-view',isIntersecting)),{threshold:.08});document.querySelectorAll('[data-motion-scene],.launch-art,.breathing-orb').forEach(el=>observer.observe(el))}
  else document.querySelectorAll('[data-motion-scene],.launch-art').forEach(el=>el.classList.add('in-view'));
 }
 function openCommands(){if(!writeAllowed)return;openModal('Find your next step',commandPalette());$('#modal').classList.add('command-modal');filterCommands('');$('#command-input').focus()}
 function filterCommands(query){const matches=commands.filter(c=>c.title.toLowerCase().includes(query.trim().toLowerCase()));$('#command-results').innerHTML=matches.map(c=>`<button class="command-result" ${c.page?`data-page="${c.page}"`:`data-action="${c.action}"`} data-command>${icon(c.ic)}<span>${esc(c.title)}</span><span>↗</span></button>`).join('')||'<p class="empty-command">No matching tools. Try “notes” or “focus”.</p>'}
 document.addEventListener('input',e=>{if(e.target.id==='command-input')filterCommands(e.target.value)});
 document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&!$('#modal').open&&root.classList.contains('zen-active')){document.querySelector('[data-zen]')?.click();return}
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openCommands();return}
  if(!$('#modal').open||!$('#command-input'))return;
  const items=[...document.querySelectorAll('.command-result')],index=items.indexOf(document.activeElement);
  if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();const next=e.key==='ArrowDown'?(index+1)%items.length:index<0?items.length-1:(index-1+items.length)%items.length;items[next]?.focus()}
  if(e.key==='Enter'&&e.target.id==='command-input'){e.preventDefault();items[0]?.click()}
 });
 // Capture closes only the palette before the application's delegated action runs.
 document.addEventListener('click',e=>{if(e.target.closest('[data-command]'))closeModal()},true);
 document.addEventListener('click',e=>{
  if(e.target.closest('[data-open-command]'))openCommands();
  const choice=e.target.closest('[data-motion-choice]');if(choice){preference=choice.dataset.motionChoice;try{localStorage.setItem('abhyas-motion',preference)}catch{}applyMotion()}
  if(e.target.closest('[data-zen]')){root.dataset.immersive=root.dataset.immersive==='true'?'false':'true';root.classList.toggle('zen-active',root.dataset.immersive==='true'&&currentPage==='focus');document.querySelectorAll('[data-zen]').forEach(b=>{b.setAttribute('aria-pressed',root.dataset.immersive==='true');b.setAttribute('aria-label',root.dataset.immersive==='true'?'Leave immersive focus':'Enter immersive focus')})}
  const day=e.target.closest('[data-chart-day]');if(day){document.querySelectorAll('[data-chart-day]').forEach(b=>b.classList.toggle('selected',b===day))}
  const complete=e.target.closest('[data-action="task-toggle"]');if(complete&&root.dataset.motion!=='reduced'&&state.tasks.find(t=>t.id===complete.dataset.id)?.done){
   const burst=document.createElement('span');burst.className='completion-burst';burst.setAttribute('aria-hidden','true');burst.style.left=e.clientX+'px';burst.style.top=e.clientY+'px';
   burst.innerHTML=Array.from({length:8},(_,i)=>`<i style="--angle:${i*45}deg;--distance:${24+i%3*8}px"></i>`).join('');document.body.append(burst);setTimeout(()=>burst.remove(),700);
  }
 });
 $('#modal').addEventListener('close',()=>$('#modal').classList.remove('command-modal'));
 document.addEventListener('pointermove',e=>{
  if(!scene||root.dataset.motion==='reduced'||e.pointerType!=='mouse'||!scene.closest('.in-view')||document.hidden)return;
  if(!e.target.closest('[data-motion-scene]')){cancelPointer();return}
  pointerX=e.clientX;pointerY=e.clientY;
  if(!frame)frame=requestAnimationFrame(()=>{const bounds=scene.getBoundingClientRect(),x=(pointerX-bounds.left)/bounds.width-.5,y=(pointerY-bounds.top)/bounds.height-.5;scene.style.transform=`perspective(900px) rotateX(${-y*7}deg) rotateY(${x*9}deg)`;frame=0});
 },{passive:true});
 document.addEventListener('visibilitychange',()=>{root.classList.toggle('document-hidden',document.hidden);if(document.hidden)cancelPointer()});
 reduce.addEventListener?.('change',applyMotion);
 window.AbhyasMotion={mount};mount();
})();
