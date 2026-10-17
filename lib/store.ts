import { defaultRecords, type TeamRecord, type RecordKind } from './model.ts';
import { HttpError } from './access.ts';
type Row={id:string;kind:RecordKind;data:string;revision:number;sort_order:number;deleted:number};
const fromRow=(r:Row)=>({id:r.id,kind:r.kind,data:JSON.parse(r.data),revision:r.revision,sortOrder:r.sort_order}) as TeamRecord;
export async function readRecords(db:D1Database):Promise<TeamRecord[]>{
 const {results}=await db.prepare('SELECT * FROM records').all<Row>();
 const ids=new Set(results.map(r=>r.id));
 return [...defaultRecords.filter(r=>!ids.has(r.id)),...results.filter(r=>!r.deleted).map(fromRow)].sort((a,b)=>a.sortOrder-b.sortOrder||a.id.localeCompare(b.id));
}
export async function createRecord(db:D1Database,kind:RecordKind,data:unknown,sortOrder:number){
 if(kind==='team')throw new HttpError(409,'チーム情報は既存の項目を編集してください');
 const id=crypto.randomUUID();
 const phaseId=kind==='task'?(data as {phaseId:string}).phaseId:'';
 const row=await db.prepare("INSERT INTO records (id,kind,data,revision,sort_order,deleted) SELECT ?,?,?,1,?,0 WHERE ?='' OR EXISTS (SELECT 1 FROM records WHERE id=? AND kind='phase' AND deleted=0) RETURNING *").bind(id,kind,JSON.stringify(data),sortOrder,phaseId,phaseId).first<Row>();
 if(!row)throw new HttpError(409,'フェーズが削除されました。再読み込みしてください');
 return fromRow(row);
}
export async function changeRecord(db:D1Database,id:string,revision:number,data:unknown,sortOrder:number|undefined,remove=false){
 const records=await readRecords(db);
 const current=records.find(r=>r.id===id);
 if(!current)throw new HttpError(404,'項目が見つかりません');
 if(current.revision!==revision)throw new HttpError(409,'ほかの人が更新しました。再読み込みしてください');
 if(remove && current.kind==='team')throw new HttpError(400,'チーム情報は削除できません');
 if(remove && current.kind==='phase' && records.some(r=>r.kind==='task'&&r.data.phaseId===id))throw new HttpError(409,'このフェーズに属するタスクがあります');
 const serialized=JSON.stringify(data??current.data);
 let row:Row|null;
 if(revision===0 && defaultRecords.some(r=>r.id===id)){
 row=await db.prepare('INSERT INTO records (id,kind,data,revision,sort_order,deleted) VALUES (?,?,?,1,?,?) ON CONFLICT(id) DO NOTHING RETURNING *').bind(id,current.kind,serialized,sortOrder??current.sortOrder,remove?1:0).first<Row>();
 }else{
 const phaseGuard=remove&&current.kind==='phase'?" AND NOT EXISTS (SELECT 1 FROM records AS task WHERE task.kind='task' AND task.deleted=0 AND json_extract(task.data,'$.phaseId')=?)":'';
 const phaseId=!remove&&current.kind==='task'?(data as {phaseId:string}).phaseId:'';
 const taskGuard=" AND (?='' OR EXISTS (SELECT 1 FROM records AS phase WHERE phase.id=? AND phase.kind='phase' AND phase.deleted=0))";
 const statement=db.prepare('UPDATE records SET data=?,revision=revision+1,sort_order=?,deleted=? WHERE id=? AND revision=? AND deleted=0'+taskGuard+phaseGuard+' RETURNING *');
 const bindings=[serialized,sortOrder??current.sortOrder,remove?1:0,id,revision,phaseId,phaseId];
 row=await (phaseGuard?statement.bind(...bindings,id):statement.bind(...bindings)).first<Row>();
 }
 if(!row)throw new HttpError(409,'ほかの人が更新しました。再読み込みしてください');
 return fromRow(row);
}

/** Replace the complete phase ordering in one statement, or change nothing. */
export async function reorderPhases(db:D1Database,items:{id:string;revision:number}[]){
 if(items.length<1||items.length>500||new Set(items.map(item=>item.id)).size!==items.length){
  throw new HttpError(400,'並び替えるフェーズを確認してください');
 }
 // Materialize the validity check before UPDATE changes any revisions. A single
 // JSON parameter also stays below D1's bound-parameter limit for 500 phases.
 const {results}=await db.prepare(`
  WITH expected AS MATERIALIZED (
   SELECT json_extract(value,'$.id') AS id,
          json_extract(value,'$.revision') AS revision,
          CAST(key AS INTEGER)*10 AS sort_order
   FROM json_each(?)
  ), valid AS MATERIALIZED (
   SELECT (SELECT count(*) FROM records WHERE kind='phase' AND deleted=0) = (SELECT count(*) FROM expected)
    AND NOT EXISTS (
     SELECT 1 FROM expected LEFT JOIN records ON records.id=expected.id
     WHERE records.id IS NULL OR records.kind!='phase' OR records.deleted!=0 OR records.revision!=expected.revision
    ) AS ok
  )
  UPDATE records
  SET sort_order=(SELECT expected.sort_order FROM expected WHERE expected.id=records.id),
      revision=revision+1
  WHERE id IN (SELECT id FROM expected) AND (SELECT ok FROM valid)
  RETURNING *
 `).bind(JSON.stringify(items)).all<Row>();
 if(results.length!==items.length)throw new HttpError(409,'フェーズが更新されました。再読み込みしてください');
 return results.map(fromRow).sort((a,b)=>a.sortOrder-b.sortOrder);
}
