import { apiResponse, session } from '@/lib/permissions';
export async function GET(){return apiResponse(session);}
