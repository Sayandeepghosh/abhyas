const {test}=require('node:test');
const assert=require('node:assert/strict');
const {validPassword,passwordChecks}=require('../dist/password-policy.js');
test('password policy requires length and all requested character classes',()=>{
  assert.equal(validPassword('Study!Journey2040'),true);
  for(const password of ['Short!2a','study!journey2040','STUDY!JOURNEY2040','Study!JourneyNow','StudyJourney2040','Study Journey2040','A!1a'+'x'.repeat(125),null])assert.equal(validPassword(password),false);
});
test('password feedback identifies individual missing requirements',()=>{
  assert.deepEqual(passwordChecks('StudyJourney'),{length:true,uppercase:true,lowercase:true,number:false,special:false});
  assert.equal(validPassword('A1!'+'a'.repeat(125)),true);
});
