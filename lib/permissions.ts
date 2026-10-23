import { createSupabaseServerClient } from '@/lib/supabase';
import { approvedSession, HttpError, requireSameOrigin } from './access';
import { rpc } from './store';
export const database=createSupabaseServerClient;
export async function session(){
 return approvedSession(await rpc<{signedIn:boolean;isOwner:boolean;canEdit:boolean}>(await database(),'hcf_access_status'));
}
export async function requirePermission(request:Request,ownerOnly=false){
 requireSameOrigin(request);
 const access=await session();
 if(!access.signedIn)throw new HttpError(401,'ログインしてください');
 if(ownerOnly?!access.isOwner:!access.canEdit)throw new HttpError(403,'編集権限がありません');
 return access;
}
export async function apiResponse(action:()=>Promise<unknown>){
 try{return Response.json(await action(),{headers:{'Cache-Control':'no-store'}});}catch(error){
 if(error instanceof HttpError)return Response.json({error:error.message},{status:error.status,headers:{'Cache-Control':'no-store'}});
 console.error('API request failed',error);
 return Response.json({error:'処理に失敗しました。時間をおいて再試行してください'},{status:500});
 }
}
export async function jsonBody(request:Request){try{return await request.json();}catch{throw new HttpError(400,'JSON が不正です');}}
