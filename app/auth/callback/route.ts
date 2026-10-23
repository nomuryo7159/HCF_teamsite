import {approvedSession} from '@/lib/access';
import {verifyLoginState} from '@/lib/login-state';
import {NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {createSupabaseServerClient} from '@/lib/supabase';
export async function GET(request:Request){
 const code=new URL(request.url).searchParams.get('code');
 const cookieStore=await cookies();
 const token=cookieStore.get('hcf-login-email')?.value;
 const enrollmentSecret=process.env.HCF_ENROLLMENT_SECRET;
 if(!code||!token){cookieStore.delete('hcf-login-email');return NextResponse.redirect(new URL('/login?error=invalid_link',request.url));}
 if(!enrollmentSecret||enrollmentSecret.length<32)return NextResponse.redirect(new URL('/login?error=configuration',request.url));
 const requestedEmail=verifyLoginState(token,cookieStore.getAll(),enrollmentSecret);
 if(!requestedEmail){cookieStore.delete('hcf-login-email');return NextResponse.redirect(new URL('/login?error=invalid_link',request.url));}
 const client=await createSupabaseServerClient(false);
 const {data,error}=await client.auth.exchangeCodeForSession(code);
 if(error||!data.user?.email||data.user.email.toLowerCase()!==requestedEmail.toLowerCase()){
  const {error:signOutError}=await client.auth.signOut({scope:'local'});
  if(signOutError)console.error('HCF session cleanup failed',{code:signOutError.code});
  cookieStore.delete('hcf-login-email');
  return NextResponse.redirect(new URL('/login?error=expired_link',request.url));
 }
 const {error:registrationError}=await client.rpc('hcf_register_identity',{p_secret:enrollmentSecret,p_email:data.user.email.toLowerCase()});
 cookieStore.delete('hcf-login-email');
 if(registrationError){
  console.error('HCF email verification registration failed',{code:registrationError.code});
  const {error:signOutError}=await client.auth.signOut({scope:'local'});
  if(signOutError)console.error('HCF session cleanup failed',{code:signOutError.code});
  return NextResponse.redirect(new URL('/login?error=verification_failed',request.url));
 }
 const {data:access,error:accessError}=await client.rpc('hcf_access_status');
 if(accessError||!access||!approvedSession(access).signedIn){
  if(accessError)console.error('HCF approval check failed',{code:accessError.code});
  const {error:signOutError}=await client.auth.signOut({scope:'local'});
  if(signOutError)console.error('HCF session cleanup failed',{code:signOutError.code});
  return NextResponse.redirect(new URL(accessError?'/login?error=verification_failed':'/login?error=approval_required',request.url));
 }
 return NextResponse.redirect(new URL('/',request.url));
}
