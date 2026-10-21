import test from 'node:test';
import assert from 'node:assert/strict';
import {approvedSession} from '../lib/access.ts';
test('only authenticated owner-approved members have a site session',()=>{
 for(const signedIn of [false,true])for(const isOwner of [false,true])for(const canEdit of [false,true]){
  const result=approvedSession({signedIn,isOwner,canEdit});
  assert.equal(result.signedIn,signedIn&&canEdit);
  assert.equal(result.canEdit,signedIn&&canEdit);
  assert.equal(result.isOwner,signedIn&&canEdit&&isOwner);
 }
});
