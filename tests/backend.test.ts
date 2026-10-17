import test from 'node:test';
import assert from 'node:assert/strict';
import { validateData, defaultRecords, validationErrorMessage } from '../lib/model.ts';
import { permissionsFor, requireSameOrigin } from '../lib/access.ts';
test('rejects impossible dates and reversed ranges',()=>{
 assert.throws(()=>validateData('phase',{title:'A',assignee:'',startDate:'2026-02-30',endDate:''}));
 assert.throws(()=>validateData('phase',{title:'A',assignee:'',startDate:'2026-03-02',endDate:'2026-03-01'}));
});
test('rejects executable URLs and accepts optional blanks',()=>{
 assert.throws(()=>validateData('resource',{title:'A',description:'',category:'',url:'javascript:alert(1)'}));
 assert.doesNotThrow(()=>validateData('event',{title:'A',date:'2026-02-28',startTime:'',endTime:'',description:'',url:''}));
});
test('owner configuration required and emails normalized',()=>{
 assert.deepEqual(permissionsFor('a@b.com',undefined,true),{signedIn:true,isOwner:false,canEdit:false});
 assert.equal(permissionsFor(' Owner@Example.com ','owner@example.com',false).isOwner,true);
 assert.equal(permissionsFor('editor@example.com','owner@example.com',true).canEdit,true);
 assert.equal(permissionsFor(null,'owner@example.com',true).canEdit,false);
});
test('mutation requires matching origin',()=>{
 assert.throws(()=>requireSameOrigin(new Request('https://site.test/api/data',{method:'POST'})));
 assert.throws(()=>requireSameOrigin(new Request('https://site.test/api/data',{headers:{origin:'https://evil.test'}})));
 assert.doesNotThrow(()=>requireSameOrigin(new Request('https://site.test/api/data',{headers:{origin:'https://site.test'}})));
});
test('initial identities remain stable',()=>assert.deepEqual(defaultRecords.filter(r=>r.kind==='member').map(r=>r.id),['nomurin','yukichi','pending']));

test('event and minute dates and resource URLs are required',()=>{
 assert.throws(()=>validateData('event',{title:'A',date:'',startTime:'',endTime:'',description:''}));
 assert.throws(()=>validateData('minute',{title:'A',date:'',summary:'',body:'',tags:[]}));
 assert.throws(()=>validateData('resource',{title:'A',description:'',category:'',url:''}));
 assert.doesNotThrow(()=>validateData('phase',{title:'A',assignee:'',startDate:'',endDate:''}));
 assert.doesNotThrow(()=>validateData('task',{title:'A',assignee:'',phaseId:'',dueDate:'',completed:false}));
});
test('malformed calendar dates produce validation errors instead of RangeError',()=>{
 assert.throws(()=>validateData('phase',{title:'A',assignee:'',startDate:'2026-13-01',endDate:''}),error=>error instanceof Error && !(error instanceof RangeError) && validationErrorMessage(error).includes('開始日：実在する日付を入力してください'));
});
test('validation feedback names each invalid field in Japanese',()=>{
 try{validateData('resource',{title:'',description:'',url:'javascript:alert(1)',category:''});assert.fail('expected invalid input');}catch(error){
 const message=validationErrorMessage(error);
 assert.match(message,/タイトル：入力してください/);
 assert.match(message,/URL：http または https の URL を入力してください/);
 assert.equal(message.includes('"code"'),false);
 }
});
