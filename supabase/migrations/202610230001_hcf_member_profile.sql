-- Member cards: optional profile fields (hobby tags, MBTI, focus, schedule, values, profile link).
create or replace function public.hcf_validate_data(p_kind text,p_data jsonb) returns void language plpgsql set search_path='' as $$
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
 if p_kind='task' then optional:=array['completedAt']; elsif p_kind='event' then optional:=array['url']; elsif p_kind='member' then optional:=array['tags','mbti','focus','schedule','values','url']; end if;
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
