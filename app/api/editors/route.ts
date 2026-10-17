import { z } from 'zod';
import { HttpError, normalizeEmail } from '@/lib/access';
import { apiResponse, database, jsonBody, requirePermission, session } from '@/lib/permissions';
import { rpc } from '@/lib/store';
const input=z.object({email:z.string().trim().email().max(254)}).strict();
export async function GET(){return apiResponse(async()=>{const access=await session();if(!access.signedIn)throw new HttpError(401,'ログインしてください');if(!access.isOwner)throw new HttpError(403,'オーナー権限が必要です');return {editors:await rpc<{email:string}[]>(await database(),'hcf_list_editors')};});}
async function change(request:Request,remove:boolean){return apiResponse(async()=>{
 await requirePermission(request,true);
 const parsed=input.safeParse(await jsonBody(request));if(!parsed.success)throw new HttpError(400,'メールアドレスを確認してください');
 await rpc(await database(),'hcf_change_editor',{p_email:normalizeEmail(parsed.data.email),p_remove:remove});return {ok:true};
});}
export async function POST(request:Request){return change(request,false);}
export async function DELETE(request:Request){return change(request,true);}
