import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { HttpError, normalizeEmail, permissionsFor, requireSameOrigin } from './access';
export function database():D1Database {if(!env.DB)throw new Error('D1 DB binding is unavailable');return env.DB;}
export async function session(){
 const user=await getChatGPTUser();
 const email=user?normalizeEmail(user.email):null;
 const owner=env.OWNER_EMAIL;
 const editor=email&&owner?await database().prepare('SELECT email FROM editors WHERE email=?').bind(email).first():null;
 return permissionsFor(email,owner,!!editor);
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
 if(error instanceof HttpError)return Response.json({error:error.message},{status:error.status});
 console.error('API request failed',error);
 return Response.json({error:'処理に失敗しました。時間をおいて再試行してください'},{status:500});
 }
}
export async function jsonBody(request:Request){try{return await request.json();}catch{throw new HttpError(400,'JSON が不正です');}}
