import {createLoginState,isVerifierCookie} from '@/lib/login-state';
import {z} from 'zod';
import {cookies} from 'next/headers';
import {HttpError,requireSameOrigin} from '@/lib/access';
import {apiResponse,jsonBody} from '@/lib/permissions';
import {createSupabaseServerClient} from '@/lib/supabase';
export async function POST(request:Request){return apiResponse(async()=>{
 requireSameOrigin(request);
 const parsed=z.object({email:z.string().trim().email().max(254)}).strict().safeParse(await jsonBody(request));
 if(!parsed.success)throw new HttpError(400,'メールアドレスを確認してください。');
 const enrollmentSecret=process.env.HCF_ENROLLMENT_SECRET;
 if(!enrollmentSecret||enrollmentSecret.length<32)throw new HttpError(503,'ログインの設定が完了していません。');
 const cookieStore=await cookies();
 for(const cookie of cookieStore.getAll())if(isVerifierCookie(cookie.name))cookieStore.delete(cookie.name);
 const client=await createSupabaseServerClient(false);
 const {error}=await client.auth.signInWithOtp({email:parsed.data.email.toLowerCase(),options:{emailRedirectTo:new URL('/auth/callback',request.url).toString(),shouldCreateUser:true}});
 if(error){console.error('Email sign-in request failed',{status:error.status,code:error.code});throw new HttpError(error.status===429?429:503,error.status===429?'送信回数の上限に達しました。時間をおいてから再度お試しください。':'ログインメールを送信できませんでした。時間をおいて再度お試しください。');}
 cookieStore.set('hcf-login-email',createLoginState(parsed.data.email.toLowerCase(),cookieStore.getAll(),enrollmentSecret),{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/',maxAge:3600});
 return {sent:true};
})}
