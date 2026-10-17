import test from 'node:test';
import assert from 'node:assert/strict';
import {createLoginState,verifyLoginState} from '../lib/login-state.ts';
test('login requires the signed requested email and the same PKCE verifier',()=>{
 const cookies=[{name:'sb-test-auth-token-code-verifier',value:'first'},{name:'sb-test-auth-token-flow-12345678-code-verifier',value:'first'}];
 const secret='test-only-server-secret';const token=createLoginState('owner@example.invalid',cookies,secret,1000);
 assert.equal(verifyLoginState(token,cookies,secret,2000),'owner@example.invalid');
 assert.equal(verifyLoginState(token,[{...cookies[0],value:'second'}],secret,2000),null);
 assert.equal(verifyLoginState(token,[...cookies,{name:'sb-test-auth-token-flow-abcdefgh-code-verifier',value:'other'}],secret,2000),null);
 assert.equal(verifyLoginState(token,cookies,'wrong-secret',2000),null);
 assert.equal(verifyLoginState(token,cookies,secret,3601001),null);
 const payload=Buffer.from(JSON.stringify({email:'changed@example.invalid'})).toString('base64url');
 assert.equal(verifyLoginState(payload+'.'+token.split('.')[1],cookies,secret,2000),null);
});
