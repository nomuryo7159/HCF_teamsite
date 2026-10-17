import {HttpError,requireSameOrigin} from '@/lib/access';
import {apiResponse} from '@/lib/permissions';
import {createSupabaseServerClient} from '@/lib/supabase';
export async function POST(request:Request){return apiResponse(async()=>{
 requireSameOrigin(request);const client=await createSupabaseServerClient(false);const {error}=await client.auth.signOut({scope:'local'});
 if(error)throw new HttpError(503,'ログアウトできませんでした。再度お試しください。');
 return {ok:true};
})}
