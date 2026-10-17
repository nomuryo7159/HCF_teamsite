import 'server-only';
import { createServerClient } from '@supabase/ssr';
import {isAuthSessionMissingError} from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { HttpError } from './access';

export async function createSupabaseServerClient(verifySession=true){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)throw new HttpError(503,'データベースの接続設定が完了していません。管理者にご確認ください。');
 const cookieStore=await cookies();
 const client=createServerClient(url,key,{
  cookieOptions:{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/'},
  cookies:{getAll(){return cookieStore.getAll()},setAll(values){for(const {name,value,options} of values)cookieStore.set(name,value,options)}}
 });
 if(verifySession){const {error}=await client.auth.getUser();if(error&&!isAuthSessionMissingError(error)){if(error.status===400||error.status===401||error.status===403){const {error:signOutError}=await client.auth.signOut({scope:'local'});if(signOutError)throw new HttpError(401,'再度ログインしてください。')}else throw new HttpError(503,'ログイン状態を確認できませんでした。時間をおいて再度お試しください。')}}
 return client;
}
