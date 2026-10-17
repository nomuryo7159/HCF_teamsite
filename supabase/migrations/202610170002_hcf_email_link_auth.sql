create or replace function public.hcf_register_identity(p_secret text,p_email text) returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception using errcode='P0401',message='ログインしてください'; end if;
 if p_email is null or p_email<>lower(btrim(auth.jwt()->>'email')) or not exists(select 1 from jsonb_array_elements(coalesce(auth.jwt()->'amr','[]'::jsonb)) a where a->>'method' in ('otp','magiclink','email/signup')) or p_secret is null or not exists(select 1 from public.hcf_settings where singleton and enrollment_secret_hash=encode(sha256(convert_to(p_secret,'UTF8')),'hex')) then
  raise exception using errcode='P0403',message='メール確認をやり直してください';
 end if;
 insert into public.hcf_verified_users(user_id,email) values(auth.uid(),p_email) on conflict(user_id) do update set email=excluded.email,verified_at=now();
end;$$;
