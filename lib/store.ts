import type { SupabaseClient } from '@supabase/supabase-js';
import type { TeamRecord, RecordKind } from './model.ts';
import { HttpError } from './access.ts';
type Row={id:string;kind:RecordKind;data:unknown;revision:number;sort_order:number};
const fromRow=(r:Row)=>({id:r.id,kind:r.kind,data:r.data,revision:r.revision,sortOrder:r.sort_order}) as TeamRecord;
export function databaseError(error:{code?:string;message:string}):never {
 const statuses:Record<string,number>={P0400:400,P0401:401,P0403:403,P0404:404,P0409:409,'42501':403};
 throw new HttpError(statuses[error.code??'']??500,statuses[error.code??'']?error.message:'保存処理に失敗しました。時間をおいて再試行してください');
}
export async function rpc<T>(db:SupabaseClient,name:string,args?:Record<string,unknown>):Promise<T>{
 const {data,error}=await db.rpc(name,args);if(error)databaseError(error);return data as T;
}
export async function readRecords(db:SupabaseClient):Promise<TeamRecord[]>{
 const records:TeamRecord[]=[];
 const pageSize=500;
 for(let offset=0;;offset+=pageSize){
  const {data,error}=await db.from('hcf_records').select('id,kind,data,revision,sort_order').eq('deleted',false).order('sort_order').order('id').range(offset,offset+pageSize-1);
  if(error)databaseError(error);
  const page=data as Row[];records.push(...page.map(fromRow));
  if(page.length<pageSize)return records;
 }
}
export async function createRecord(db:SupabaseClient,kind:RecordKind,data:unknown,sortOrder:number){
 return fromRow(await rpc<Row>(db,'hcf_create_record',{p_kind:kind,p_data:data,p_sort_order:sortOrder}));
}
export async function changeRecord(db:SupabaseClient,id:string,revision:number,data:unknown,sortOrder:number|undefined,remove=false){
 return fromRow(await rpc<Row>(db,'hcf_change_record',{p_id:id,p_revision:revision,p_data:data??null,p_sort_order:sortOrder??null,p_remove:remove}));
}
export async function reorderPhases(db:SupabaseClient,items:{id:string;revision:number}[]){
 if(items.length<1||items.length>500||new Set(items.map(item=>item.id)).size!==items.length)throw new HttpError(400,'並び替えるフェーズを確認してください');
 const rows=await rpc<Row[]>(db,'hcf_reorder_phases',{p_items:items});return rows.map(fromRow).sort((a,b)=>a.sortOrder-b.sortOrder);
}
