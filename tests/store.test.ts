import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { readRecords, changeRecord, createRecord, reorderPhases } from '../lib/store.ts';
function database(){
 const sql=new DatabaseSync(':memory:');sql.exec(readFileSync(new URL('../drizzle/0000_zippy_lila_cheney.sql',import.meta.url),'utf8'));
 return {prepare(query:string){return {bind(...values:unknown[]){return command(values);},...command([])};function command(values:unknown[]){return {first:async()=>sql.prepare(query).get(...values as never[])??null,all:async()=>({results:sql.prepare(query).all(...values as never[])}),run:async()=>sql.prepare(query).run(...values as never[])};}}} as unknown as D1Database;
}
test('first default edit uses atomic revision and deletion persists',async()=>{
 const db=database();const before=await readRecords(db);const member=before.find(r=>r.id==='pending')!;
 const results=await Promise.allSettled([changeRecord(db,member.id,0,member.data,0),changeRecord(db,member.id,0,member.data,0)]);
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
 assert.equal((results.find(r=>r.status==='rejected') as PromiseRejectedResult).reason.status,409);
 await changeRecord(db,member.id,1,undefined,undefined,true);
 assert.equal((await readRecords(db)).some(r=>r.id===member.id),false);
});
test('concurrent existing updates permit one writer',async()=>{
 const db=database();const record=await createRecord(db,'rule',{title:'A',body:''},0);
 const results=await Promise.allSettled([changeRecord(db,record.id,1,{title:'B',body:''},0),changeRecord(db,record.id,1,{title:'C',body:''},0)]);
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
 assert.equal((await readRecords(db)).find(r=>r.id===record.id)?.revision,2);
});
test('referenced phase cannot be deleted',async()=>{
 const db=database();const phase=await createRecord(db,'phase',{title:'A',assignee:'',startDate:'',endDate:''},0);
 await createRecord(db,'task',{title:'T',assignee:'',phaseId:phase.id,dueDate:'',completed:false},0);
 await assert.rejects(()=>changeRecord(db,phase.id,1,undefined,undefined,true),{status:409});
});
test('tasks cannot reference an absent phase',async()=>{
 const db=database();await assert.rejects(()=>createRecord(db,'task',{title:'T',assignee:'',phaseId:'missing',dueDate:'',completed:false},0),{status:409});
});
test('repeated adjacent movements retain exact phase order',async()=>{
 const db=database();
 await Promise.all(['A','B','C'].map((title,i)=>createRecord(db,'phase',{title,assignee:'',startDate:'',endDate:''},(i+1)*10)));
 const order=async()=> (await readRecords(db)).filter(r=>r.kind==='phase');
 const move=async(from:number,to:number)=>{const all=await order();const [item]=all.splice(from,1);all.splice(to,0,item);await reorderPhases(db,all.map(({id,revision})=>({id,revision})));return (await order()).map(r=>r.data.title);};
 assert.deepEqual(await move(2,1),['A','C','B']);
 assert.deepEqual(await move(2,1),['A','B','C']);
 assert.deepEqual(await move(0,1),['B','A','C']);
 assert.deepEqual((await order()).map(r=>r.sortOrder),[0,10,20]);
});
test('stale reorder and incomplete phase lists change no records',async()=>{
 const db=database();
 const a=await createRecord(db,'phase',{title:'A',assignee:'',startDate:'',endDate:''},10);
 const b=await createRecord(db,'phase',{title:'B',assignee:'',startDate:'',endDate:''},20);
 await changeRecord(db,a.id,1,a.data,10);
 const before=await readRecords(db);
 await assert.rejects(()=>reorderPhases(db,[{id:b.id,revision:1},{id:a.id,revision:1}]),{status:409});
 assert.deepEqual(await readRecords(db),before);
 await assert.rejects(()=>reorderPhases(db,[{id:b.id,revision:1}]),{status:409});
 assert.deepEqual(await readRecords(db),before);
 await assert.rejects(()=>reorderPhases(db,[{id:b.id,revision:1},{id:b.id,revision:1}]),{status:400});
});
