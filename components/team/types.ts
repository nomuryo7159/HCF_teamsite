export type Data = {
 team: {name:string;mission:string};
 member: {name:string;role:string;bio:string;status:'active'|'pending';tags?:string[];mbti?:string;focus?:string;schedule?:string;values?:string;url?:string};
 rule: {title:string;body:string};
 phase: {title:string;assignee:string;startDate:string;endDate:string};
 task: {title:string;assignee:string;phaseId:string;dueDate:string;completed:boolean;completedAt?:string};
 event: {title:string;date:string;startTime:string;endTime:string;description:string;url?:string};
 thread: {title:string;startDate:string;endDate:string;summary:string;url:string};
 minute: {title:string;date:string;summary:string;body:string;tags:string[]};
 resource: {title:string;description:string;url:string;category:string};
};
export type Kind=keyof Data;
export type Entry<K extends Kind=Kind> = K extends Kind ? {id:string;kind:K;data:Data[K];revision:number;sortOrder:number} : never;
export type Editing = {kind:Kind;entry?:Entry};
export const labels:Record<Kind,string>={team:'チーム情報',member:'メンバー',rule:'活動ルール',phase:'工程',task:'タスク',event:'予定',thread:'週次スレッド',minute:'議事録',resource:'共有資料'};
export const today=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Tokyo'}).format(new Date());
export const dateLabel=(date:string)=>date?new Intl.DateTimeFormat('ja-JP',{month:'numeric',day:'numeric',weekday:'short',timeZone:'UTC'}).format(new Date(date+'T00:00:00Z')):'日程未定';
export async function request<T>(url:string,method='GET',body?:unknown):Promise<T>{
 const res=await fetch(url,{method,headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined,cache:'no-store'});
 const payload=await res.json() as {error?:string;message?:string};
 if(!res.ok) throw new Error(typeof payload.error==='string'?payload.error:typeof payload.message==='string'?payload.message:'処理に失敗しました。時間をおいて再度お試しください。');
 return payload as T;
}
