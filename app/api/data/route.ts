import { z } from 'zod';
import { HttpError } from '@/lib/access';
import { recordKindSchema, validateData, validationErrorMessage } from '@/lib/model';
import { apiResponse, database, jsonBody, requirePermission } from '@/lib/permissions';
import { changeRecord, createRecord, readRecords } from '@/lib/store';
const order=z.number().int().min(-1000000).max(1000000).optional();
const create=z.object({kind:recordKindSchema,data:z.unknown(),sortOrder:order}).strict();
const edit=z.object({id:z.string().min(1).max(200),revision:z.number().int().min(0),data:z.unknown(),sortOrder:order}).strict();
const deletion=edit.omit({data:true,sortOrder:true});
function parse<T>(schema:z.ZodType<T>,value:unknown):T{const result=schema.safeParse(value);if(!result.success)throw new HttpError(400,'入力内容を確認してください');return result.data;}
function validData(kind:z.infer<typeof recordKindSchema>,data:unknown){try{return validateData(kind,data);}catch(error){throw new HttpError(400,validationErrorMessage(error));}}
export async function GET(){return apiResponse(async()=>({records:await readRecords(database())}));}
export async function POST(request:Request){return apiResponse(async()=>{await requirePermission(request);const body=parse(create,await jsonBody(request));const data=validData(body.kind,body.data);await checkPhase(body.kind,data);return {record:await createRecord(database(),body.kind,data,body.sortOrder??0)};});}
async function checkPhase(kind:string,data:unknown){if(kind==='task'){const phaseId=(data as {phaseId:string}).phaseId;if(phaseId&&!(await readRecords(database())).some(r=>r.id===phaseId&&r.kind==='phase'))throw new HttpError(400,'フェーズが見つかりません');}}
export async function PATCH(request:Request){return apiResponse(async()=>{await requirePermission(request);const body=parse(edit,await jsonBody(request));const current=(await readRecords(database())).find(r=>r.id===body.id);if(!current)throw new HttpError(404,'項目が見つかりません');const data=validData(current.kind,body.data);await checkPhase(current.kind,data);return {record:await changeRecord(database(),body.id,body.revision,data,body.sortOrder)};});}
export async function DELETE(request:Request){return apiResponse(async()=>{await requirePermission(request);const body=parse(deletion,await jsonBody(request));await changeRecord(database(),body.id,body.revision,undefined,undefined,true);return {ok:true};});}
