'use strict';
const CACHE_PREFIX=`abhyas-${self.registration.scope}-`;
const CACHE=CACHE_PREFIX+'v8';
const ASSETS=['./','./index.html','./styles.css?v=8','./studio.css?v=8','./theme.js?v=8','./data.js?v=8','./studio.js?v=8','./app.js?v=8','./motion.js?v=8','./accounts.css?v=8','./password-policy.js?v=8','./vault.js?v=8','./accounts.js?v=8','./icon.svg','./icon-192.png','./icon-512.png','./manifest.webmanifest'];
const assetURLs=new Set(ASSETS.map(path=>new URL(path,self.registration.scope).href));
const indexURL=new URL('./index.html',self.registration.scope).href;
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith(CACHE_PREFIX)&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url),scope=new URL(self.registration.scope);
  if(request.method!=='GET'||url.origin!==scope.origin||!url.pathname.startsWith(scope.pathname))return;
  const navigation=request.mode==='navigate',key=navigation?indexURL:request.url;
  if(!navigation&&!assetURLs.has(key))return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE),controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),5000);
    try{
      const response=await fetch(request,{signal:controller.signal,cache:'no-cache'});
      if(response.ok&&!response.redirected){event.waitUntil(cache.put(key,response.clone()).catch(()=>{}));return response}
      return (await cache.match(key))||response;
    }catch{return (await cache.match(key))||Response.error()}
    finally{clearTimeout(timeout)}
  })());
});

