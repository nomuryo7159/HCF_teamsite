import { z } from 'zod';
const short = z.string().trim().max(200);
const title = short.min(1, '入力してください');
const body = z.string().max(20000);
const date = z.string().refine(v => {
 if(v==='')return true;
 if(!/^\d{4}-\d{2}-\d{2}$/.test(v))return false;
 const parsed=new Date(v+'T00:00:00Z');
 return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0,10)===v;
}, '実在する日付を入力してください');
const requiredDate=date.refine(v=>v!=='','日付を入力してください');
const url = z.string().max(2000).refine(v=>{if(!v)return true;try {return ['http:','https:'].includes(new URL(v).protocol);}catch{return false;}},'http または https の URL を入力してください');
const time = z.string().regex(/^$|^(?:[01]\d|2[0-3]):[0-5]\d$/);
export const dataSchemas = {
 team:z.object({name:title,mission:body}).strict(),
 member:z.object({name:title,role:short,bio:body,status:z.enum(['active','pending'])}).strict(),
 rule:z.object({title,body}).strict(),
 phase:z.object({title,assignee:short,startDate:date,endDate:date}).strict(),
 task:z.object({title,assignee:short,phaseId:short,dueDate:date,completed:z.boolean(),completedAt:date.optional()}).strict(),
 event:z.object({title,date:requiredDate,startTime:time,endTime:time,description:body,url:url.optional()}).strict(),
 thread:z.object({title,startDate:date,endDate:date,summary:body,url}).strict(),
 minute:z.object({title,date:requiredDate,summary:body,body,tags:z.array(short.min(1)).max(30)}).strict(),
 resource:z.object({title,description:body,url:url.refine(v=>v!=='','URL を入力してください'),category:short}).strict(),
};
export type RecordKind = keyof typeof dataSchemas;
export type RecordData = {[K in RecordKind]:z.infer<(typeof dataSchemas)[K]>};
export type TeamRecord = {[K in RecordKind]:{id:string;kind:K;data:RecordData[K];revision:number;sortOrder:number}}[RecordKind];
export const recordKindSchema = z.enum(['team','member','rule','phase','task','event','thread','minute','resource']);
export function validateData<K extends RecordKind>(kind:K,input:unknown):RecordData[K] {
 const data=dataSchemas[kind].parse(input);
 if ('startDate' in data && data.startDate && data.endDate && data.startDate>data.endDate) throw new Error('終了日は開始日以降にしてください');
 if ('startTime' in data && data.startTime && data.endTime && data.startTime>data.endTime) throw new Error('終了時刻は開始時刻以降にしてください');
 return data as RecordData[K];
}
export const defaultRecords:TeamRecord[]=[
 {id:'team',kind:'team',data:{name:'チーム名未定',mission:'目的はこれから決めていきます'},revision:0,sortOrder:0},
 ...([{id:'nomurin',name:'のむりん'},{id:'yukichi',name:'ゆきち'},{id:'pending',name:'参加予定'}] as const).map((m,i)=>({id:m.id,kind:'member' as const,data:{name:m.name,role:'',bio:'',status:m.id==='pending'?'pending' as const:'active' as const},revision:0,sortOrder:i})),
];

const fieldLabels:Record<string,string>={name:'名前',mission:'目的',title:'タイトル',role:'役割',bio:'紹介',status:'参加状態',body:'本文',assignee:'担当者',startDate:'開始日',endDate:'終了日',dueDate:'期限',completed:'完了状態',completedAt:'完了日',phaseId:'フェーズ',date:'日付',startTime:'開始時刻',endTime:'終了時刻',description:'説明',url:'URL',summary:'要約',tags:'タグ',category:'カテゴリ'};
export function validationErrorMessage(error:unknown):string {
 if(error instanceof z.ZodError){
  return error.issues.map(issue=>{
   const label=issue.path.map(part=>typeof part==='number'?String(part+1):fieldLabels[part]??part).join('・')||'入力内容';
   let message=issue.message;
   if(issue.code==='invalid_type')message='値の形式を確認してください';
   else if(issue.code==='unrecognized_keys')message='対応していない入力項目があります';
   else if(issue.code==='invalid_enum_value')message='選択肢から選んでください';
   else if(issue.code==='too_small')message=issue.minimum===1?'入力してください':`${issue.minimum}以上で入力してください`;
   else if(issue.code==='too_big')message=`${issue.maximum}以下で入力してください`;
   else if(issue.code==='invalid_string'&&issue.validation==='regex')message='時刻を HH:MM 形式で入力してください';
   return `${label}：${message}`;
  }).join(' / ');
 }
 return error instanceof Error?error.message:'入力内容を確認してください';
}
