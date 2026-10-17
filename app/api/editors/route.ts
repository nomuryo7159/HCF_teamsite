import { z } from 'zod';
import { env } from 'cloudflare:workers';
import { HttpError, normalizeEmail } from '@/lib/access';
import { apiResponse, database, jsonBody, requirePermission, session } from '@/lib/permissions';
const input=z.object({email:z.string().trim().email().max(254)}).strict();
export async function GET(){return apiResponse(async()=>{const access=await session();if(!access.signedIn)throw new HttpError(401,'ログインしてください');if(!access.isOwner)throw new HttpError(403,'オーナー権限が必要です');const {results}=await database().prepare('SELECT email FROM editors ORDER BY email').all<{email:string}>();return {editors:results};});}
async function change(request:Request,remove:boolean){return apiResponse(async()=>{
 await requirePermission(request,true);
 const parsed=input.safeParse(await jsonBody(request));if(!parsed.success)throw new HttpError(400,'メールアドレスを確認してください');
 const email=normalizeEmail(parsed.data.email);
 if(email===normalizeEmail(env.OWNER_EMAIL??''))throw new HttpError(400,'オーナーの権限は変更できません');
 await database().prepare(remove?'DELETE FROM editors WHERE email=?':'INSERT INTO editors (email) VALUES (?) ON CONFLICT(email) DO NOTHING').bind(email).run();return {ok:true};
});}
export async function POST(request:Request){return change(request,false);}
export async function DELETE(request:Request){return change(request,true);}
