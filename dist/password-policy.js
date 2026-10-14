'use strict';
// Shared UI policy. The authentication provider must enforce the same rules.
(function(root){
  function passwordChecks(password){
    const value=typeof password==='string'?password:'';
    return {length:value.length>=12&&value.length<=128,uppercase:/[A-Z]/.test(value),lowercase:/[a-z]/.test(value),number:/[0-9]/.test(value),special:/[^A-Za-z0-9\s]/.test(value)};
  }
  function validPassword(value){return Object.values(passwordChecks(value)).every(Boolean)}
  if(typeof module==='object'&&module.exports)module.exports={passwordChecks,validPassword};
  else root.AbhyasPassword={passwordChecks,validPassword};
})(typeof window==='object'?window:globalThis);
