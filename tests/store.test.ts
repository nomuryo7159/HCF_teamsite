import test from 'node:test';
import assert from 'node:assert/strict';
import type { SupabaseClient } from '@supabase/supabase-js';
import { readRecords, changeRecord, createRecord, reorderPhases, databaseError } from '../lib/store.ts';
function database(result:unknown,error:{code:string;message:string}|null=null){
 const calls:{name:string;args?:Record<string,unknown>}[]=[];
 const query={select(){return this;},eq(){return this;},order(){return this;},range(){return this;},then(resolve:(value:unknown)=>unknown){return Promise.resolve({data:result,error}).then(resolve);}};
 return {calls,db:{from(name:string){calls.push({name});return query;},async rpc(name:string,args?:Record<string,unknown>){calls.push({name,args});return {data:result,error};}} as unknown as SupabaseClient};
}
const row={id:'record',kind:'rule',data:{title:'A',body:''},revision:2,sort_order:10};
test('public reads map JSON records without restoring deleted defaults',async()=>{
 const {db,calls}=database([row]);assert.deepEqual(await readRecords(db),[{id:'record',kind:'rule',data:row.data,revision:2,sortOrder:10}]);assert.equal(calls[0].name,'hcf_records');
 const empty=database([]);assert.deepEqual(await readRecords(empty.db),[]);
});
test('create delegates validated data to atomic RPC',async()=>{
 const {db,calls}=database(row);const record=await createRecord(db,'rule',row.data,10);assert.equal(record.revision,2);assert.deepEqual(calls,[{name:'hcf_create_record',args:{p_kind:'rule',p_data:row.data,p_sort_order:10}}]);
});
test('edits and deletes preserve revision and nullable optional fields',async()=>{
 const {db,calls}=database(row);await changeRecord(db,'record',1,undefined,undefined,true);assert.deepEqual(calls[0],{name:'hcf_change_record',args:{p_id:'record',p_revision:1,p_data:null,p_sort_order:null,p_remove:true}});
});
test('known database errors preserve HTTP conflict and authorization contracts',async()=>{
 for(const [code,status] of [['P0400',400],['P0401',401],['P0403',403],['P0404',404],['P0409',409],['42501',403]] as const){assert.throws(()=>databaseError({code,message:'reason'}),{status,message:'reason'});}
 const {db}=database(null,{code:'P0409',message:'stale'});await assert.rejects(()=>changeRecord(db,'record',1,row.data,0),{status:409,message:'stale'});
 assert.throws(()=>databaseError({code:'unexpected',message:'private internals'}),error=>error instanceof Error && !error.message.includes('private internals'));
});
test('reorder validates duplicates and sends all revisions in one call',async()=>{
 const {db,calls}=database([row]);await assert.rejects(()=>reorderPhases(db,[{id:'a',revision:1},{id:'a',revision:1}]),{status:400});assert.equal(calls.length,0);
 const items=[{id:'record',revision:1}];assert.equal((await reorderPhases(db,items))[0].sortOrder,10);assert.deepEqual(calls,[{name:'hcf_reorder_phases',args:{p_items:items}}]);
});

test('public reads continue past the PostgREST page limit',async()=>{
 const rows=Array.from({length:1203},(_,i)=>({...row,id:String(i)}));
 const ranges:number[][]=[];
 const db={from(){const q={select(){return q},eq(){return q},order(){return q},async range(a:number,b:number){ranges.push([a,b]);return {data:rows.slice(a,b+1),error:null}}};return q}} as unknown as SupabaseClient;
 const records=await readRecords(db);assert.equal(records.length,1203);assert.equal(records[1202].id,'1202');assert.deepEqual(ranges,[[0,499],[500,999],[1000,1499]]);
});
