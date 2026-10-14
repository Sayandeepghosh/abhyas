'use strict';
(function(root){
 const encode=new TextEncoder(),decode=new TextDecoder();
 const b64=bytes=>btoa(Array.from(bytes,b=>String.fromCharCode(b)).join(''));
 const bytes=value=>Uint8Array.from(atob(value),c=>c.charCodeAt(0));
 async function key(password,salt){const material=await crypto.subtle.importKey('raw',encode.encode(password),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',salt:bytes(salt),iterations:600000,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['encrypt','decrypt'])}
 async function seal(key,raw,user){const iv=crypto.getRandomValues(new Uint8Array(12));return {iv:b64(iv),data:b64(new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:encode.encode(user)},key,encode.encode(raw))))}}
 async function open(key,record,user){return decode.decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes(record.iv),additionalData:encode.encode(user)},key,bytes(record.data)))}
 root.AbhyasVault={key,seal,open,salt:()=>b64(crypto.getRandomValues(new Uint8Array(16)))};
})(globalThis);
