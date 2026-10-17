create table public.hcf_records (
 id text primary key check (length(id) between 1 and 200),
 kind text not null check (kind in ('team','member','rule','phase','task','event','thread','minute','resource')),
 data jsonb not null check (jsonb_typeof(data)='object'),
 revision integer not null default 1 check (revision>=0),
 sort_order integer not null default 0 check (sort_order between -1000000 and 1000000),
 deleted boolean not null default false
);
create table public.hcf_editors (email text primary key check(email=lower(btrim(email)) and length(email)<=254),role text not null check(role in ('owner','editor')));
alter table public.hcf_records enable row level security;
alter table public.hcf_editors enable row level security;
revoke all on public.hcf_records,public.hcf_editors from anon,authenticated;
grant select on public.hcf_records to anon,authenticated;
create policy hcf_public_active_records on public.hcf_records for select to anon,authenticated using (not deleted);
insert into public.hcf_records(id,kind,data,revision,sort_order) values
('team','team','{"name":"チーム名未定","mission":"目的はこれから決めていきます"}',0,0),
('nomurin','member','{"name":"のむりん","role":"","bio":"","status":"active"}',0,0),
('yukichi','member','{"name":"ゆきち","role":"","bio":"","status":"active"}',0,1),
('pending','member','{"name":"参加予定","role":"","bio":"","status":"pending"}',0,2);
create table public.hcf_verified_users (user_id uuid primary key,email text not null check(email=lower(btrim(email))),verified_at timestamptz not null default now());
create table public.hcf_settings (singleton boolean primary key default true check(singleton),enrollment_secret_hash text not null check(enrollment_secret_hash ~ '^[0-9a-f]{64}$'));
alter table public.hcf_verified_users enable row level security;
alter table public.hcf_settings enable row level security;
revoke all on public.hcf_verified_users,public.hcf_settings from public,anon,authenticated;
create function public.hcf_register_identity(p_secret text,p_email text) returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception using errcode='P0401',message='ログインしてください'; end if;
 if p_email is null or p_email<>lower(btrim(auth.jwt()->>'email')) or not exists(select 1 from jsonb_array_elements(coalesce(auth.jwt()->'amr','[]'::jsonb)) a where a->>'method'='otp') or p_secret is null or not exists(select 1 from public.hcf_settings where singleton and enrollment_secret_hash=encode(sha256(convert_to(p_secret,'UTF8')),'hex')) then
  raise exception using errcode='P0403',message='メール確認をやり直してください';
 end if;
 insert into public.hcf_verified_users(user_id,email) values(auth.uid(),p_email) on conflict(user_id) do update set email=excluded.email,verified_at=now();
end;$$;
create function public.hcf_access_status() returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('signedIn',auth.uid() is not null,
 'isOwner',exists(select 1 from public.hcf_verified_users v join public.hcf_editors e using(email) where v.user_id=auth.uid() and v.email=lower(btrim(auth.jwt()->>'email')) and e.role='owner'),
 'canEdit',exists(select 1 from public.hcf_verified_users v join public.hcf_editors e using(email) where v.user_id=auth.uid() and v.email=lower(btrim(auth.jwt()->>'email'))));
$$;
create function public.hcf_require_edit(p_owner boolean default false) returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception using errcode='P0401',message='ログインしてください'; end if;
 if not exists(select 1 from public.hcf_verified_users v join public.hcf_editors e using(email) where v.user_id=auth.uid() and v.email=lower(btrim(auth.jwt()->>'email')) and (not p_owner or e.role='owner')) then raise exception using errcode='P0403',message='編集権限がありません'; end if;
end;$$;
create function public.hcf_validate_data(p_kind text,p_data jsonb) returns void language plpgsql set search_path='' as $$
declare required text[]; optional text[] := '{}'; k text; v jsonb; s text;
begin
 required:=case p_kind
 when 'team' then array['name','mission'] when 'member' then array['name','role','bio','status']
 when 'rule' then array['title','body'] when 'phase' then array['title','assignee','startDate','endDate']
 when 'task' then array['title','assignee','phaseId','dueDate','completed']
 when 'event' then array['title','date','startTime','endTime','description']
 when 'thread' then array['title','startDate','endDate','summary','url']
 when 'minute' then array['title','date','summary','body','tags']
 when 'resource' then array['title','description','url','category'] else null end;
 if p_kind='task' then optional:=array['completedAt']; elsif p_kind='event' then optional:=array['url']; end if;
 if required is null or p_data is null or jsonb_typeof(p_data)<>'object' or not(p_data ?& required) then raise exception using errcode='P0400',message='入力内容を確認してください'; end if;
 for k,v in select * from jsonb_each(p_data) loop
  if not(k=any(required||optional)) then raise exception using errcode='P0400',message='対応していない入力項目があります'; end if;
  if k='completed' then
   if jsonb_typeof(v)<>'boolean' then raise exception using errcode='P0400',message='完了状態を確認してください'; end if;
  elsif k='tags' then
   if jsonb_typeof(v)<>'array' then raise exception using errcode='P0400',message='タグを確認してください'; end if;
   if jsonb_array_length(v)>30 or exists(select 1 from jsonb_array_elements(v) as tag where jsonb_typeof(tag)<>'string' or length(btrim(tag#>>'{}')) not between 1 and 200) then raise exception using errcode='P0400',message='タグを確認してください'; end if;
  else
   if jsonb_typeof(v)<>'string' then raise exception using errcode='P0400',message='値の形式を確認してください'; end if;
   s:=v#>>'{}';
   if length(s)>(case when k in ('mission','bio','body','description','summary') then 20000 when k='url' then 2000 else 200 end) then raise exception using errcode='P0400',message='入力が長すぎます'; end if;
   if k in ('title','name') and length(btrim(s))=0 then raise exception using errcode='P0400',message='入力してください'; end if;
   if k='status' and s not in ('active','pending') then raise exception using errcode='P0400',message='参加状態を確認してください'; end if;
   if k in ('startDate','endDate','dueDate','completedAt','date') and s<>'' then
    begin
     if s !~ '^\d{4}-\d{2}-\d{2}$' or to_char(s::date,'YYYY-MM-DD')<>s then raise exception 'invalid date'; end if;
    exception when others then raise exception using errcode='P0400',message='実在する日付を入力してください'; end;
   end if;
   if k='date' and s='' then raise exception using errcode='P0400',message='日付を入力してください'; end if;
   if k in ('startTime','endTime') and s<>'' and s !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then raise exception using errcode='P0400',message='時刻を確認してください'; end if;
   if k='url' and ((s='' and p_kind='resource') or (s<>'' and s !~ '^https?://[^[:space:]]+')) then raise exception using errcode='P0400',message='http または https の URL を入力してください'; end if;
  end if;
 end loop;
 if (p_data->>'startDate')<>'' and (p_data->>'endDate')<>'' and (p_data->>'startDate')>(p_data->>'endDate') or (p_data->>'startTime')<>'' and (p_data->>'endTime')<>'' and (p_data->>'startTime')>(p_data->>'endTime') then raise exception using errcode='P0400',message='終了は開始以降にしてください'; end if;
end;$$;
create function public.hcf_check_phase(p_kind text,p_data jsonb) returns void language plpgsql set search_path='' as $$
begin
 if p_kind='task' and p_data->>'phaseId'<>'' and not exists(select 1 from public.hcf_records where id=p_data->>'phaseId' and kind='phase' and not deleted) then raise exception using errcode='P0409',message='フェーズが削除されました。再読み込みしてください'; end if;
end;$$;
create function public.hcf_create_record(p_kind text,p_data jsonb,p_sort_order integer) returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.hcf_records;
begin
 perform pg_advisory_xact_lock(716591017); perform public.hcf_require_edit();
 if p_kind='team' then raise exception using errcode='P0409',message='チーム情報は既存の項目を編集してください'; end if;
 if p_sort_order is null or p_sort_order not between -1000000 and 1000000 then raise exception using errcode='P0400',message='並び順を確認してください'; end if;
 perform public.hcf_validate_data(p_kind,p_data); perform public.hcf_check_phase(p_kind,p_data);
 insert into public.hcf_records(id,kind,data,sort_order) values(gen_random_uuid()::text,p_kind,p_data,p_sort_order) returning * into r;
 return to_jsonb(r)-'deleted';
end;$$;
create function public.hcf_change_record(p_id text,p_revision integer,p_data jsonb,p_sort_order integer,p_remove boolean default false) returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.hcf_records;
begin
 perform pg_advisory_xact_lock(716591017); perform public.hcf_require_edit();
 if p_id is null or length(p_id) not between 1 and 200 or p_revision is null or p_revision<0 or p_remove is null or (p_sort_order is not null and p_sort_order not between -1000000 and 1000000) then raise exception using errcode='P0400',message='入力内容を確認してください'; end if;
 select * into r from public.hcf_records where id=p_id and not deleted;
 if not found then raise exception using errcode='P0404',message='項目が見つかりません'; end if;
 if r.revision<>p_revision then raise exception using errcode='P0409',message='ほかの人が更新しました。再読み込みしてください'; end if;
 if p_remove then
  if r.kind='team' then raise exception using errcode='P0400',message='チーム情報は削除できません'; end if;
  if r.kind='phase' and exists(select 1 from public.hcf_records where kind='task' and not deleted and data->>'phaseId'=p_id) then raise exception using errcode='P0409',message='このフェーズに属するタスクがあります'; end if;
 else perform public.hcf_validate_data(r.kind,p_data); perform public.hcf_check_phase(r.kind,p_data); end if;
 update public.hcf_records set data=case when p_remove then r.data else p_data end,revision=revision+1,sort_order=coalesce(p_sort_order,r.sort_order),deleted=p_remove where id=p_id returning * into r;
 return to_jsonb(r)-'deleted';
end;$$;
create function public.hcf_reorder_phases(p_items jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare total integer; result jsonb;
begin
 perform pg_advisory_xact_lock(716591017); perform public.hcf_require_edit();
 if p_items is null or jsonb_typeof(p_items)<>'array' then raise exception using errcode='P0400',message='並び替えるフェーズを確認してください'; end if;
 total:=jsonb_array_length(p_items);
 if total not between 1 and 500 or exists(select 1 from jsonb_array_elements(p_items) x where jsonb_typeof(x)<>'object') then raise exception using errcode='P0400',message='並び替えるフェーズを確認してください'; end if;
 if exists(select 1 from jsonb_array_elements(p_items) x where not(x ?& array['id','revision']) or (select count(*) from jsonb_object_keys(x))<>2 or jsonb_typeof(x->'id')<>'string' or length(x->>'id') not between 1 and 200 or jsonb_typeof(x->'revision')<>'number' or x->>'revision' !~ '^[0-9]+$') then raise exception using errcode='P0400',message='並び替えるフェーズを確認してください'; end if;
 if (select count(distinct x->>'id') from jsonb_array_elements(p_items) x)<>total then raise exception using errcode='P0400',message='並び替えるフェーズを確認してください'; end if;
 if (select count(*) from public.hcf_records where kind='phase' and not deleted)<>total or exists(select 1 from jsonb_array_elements(p_items) x left join public.hcf_records r on r.id=x->>'id' where r.id is null or r.kind<>'phase' or r.deleted or r.revision::numeric<>(x->>'revision')::numeric) then raise exception using errcode='P0409',message='フェーズが更新されました。再読み込みしてください'; end if;
 with updated as (update public.hcf_records r set sort_order=(x.ord-1)*10,revision=r.revision+1 from jsonb_array_elements(p_items) with ordinality x(item,ord) where r.id=x.item->>'id' returning r.*) select jsonb_agg(to_jsonb(updated)-'deleted' order by sort_order) into result from updated;
 return result;
end;$$;
create function public.hcf_list_editors() returns jsonb language plpgsql security definer set search_path='' as $$
begin perform public.hcf_require_edit(true); return coalesce((select jsonb_agg(jsonb_build_object('email',email) order by email) from public.hcf_editors where role='editor'),'[]'::jsonb); end;$$;
create function public.hcf_change_editor(p_email text,p_remove boolean default false) returns void language plpgsql security definer set search_path='' as $$
declare normalized text:=lower(btrim(p_email));
begin
 perform pg_advisory_xact_lock(716591017); perform public.hcf_require_edit(true);
 if normalized is null or length(normalized)>254 or normalized !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or p_remove is null then raise exception using errcode='P0400',message='メールアドレスを確認してください'; end if;
 if exists(select 1 from public.hcf_editors where email=normalized and role='owner') then raise exception using errcode='P0400',message='オーナーの権限は変更できません'; end if;
 if p_remove then delete from public.hcf_editors where email=normalized; else insert into public.hcf_editors(email,role) values(normalized,'editor') on conflict(email) do nothing; end if;
end;$$;
revoke all on function public.hcf_access_status(),public.hcf_require_edit(boolean),public.hcf_validate_data(text,jsonb),public.hcf_check_phase(text,jsonb),public.hcf_create_record(text,jsonb,integer),public.hcf_change_record(text,integer,jsonb,integer,boolean),public.hcf_reorder_phases(jsonb),public.hcf_list_editors(),public.hcf_change_editor(text,boolean) from public,anon,authenticated;
grant execute on function public.hcf_access_status() to anon,authenticated;
grant execute on function public.hcf_create_record(text,jsonb,integer),public.hcf_change_record(text,integer,jsonb,integer,boolean),public.hcf_reorder_phases(jsonb),public.hcf_list_editors(),public.hcf_change_editor(text,boolean) to authenticated;

revoke all on function public.hcf_register_identity(text,text) from public,anon,authenticated;
grant execute on function public.hcf_register_identity(text,text) to authenticated;
