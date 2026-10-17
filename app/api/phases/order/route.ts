import { z } from 'zod';
import { HttpError } from '@/lib/access';
import { apiResponse, database, jsonBody, requirePermission } from '@/lib/permissions';
import { reorderPhases } from '@/lib/store';
const input=z.object({items:z.array(z.object({id:z.string().min(1).max(200),revision:z.number().int().min(1)}).strict()).min(1).max(500)}).strict();
export async function PATCH(request:Request){
 return apiResponse(async()=>{
  await requirePermission(request);
  const parsed=input.safeParse(await jsonBody(request));
  if(!parsed.success)throw new HttpError(400,'並び替えるフェーズを確認してください');
  return {records:await reorderPhases(await database(),parsed.data.items)};
 });
}
