begin;
-- All fixtures and mutations roll back, including edits to existing phases.
insert into public.hcf_editors(email,role) values('hcf-test-owner@example.invalid','owner'),('hcf-test-editor@example.invalid','editor');
insert into public.hcf_settings(singleton,enrollment_secret_hash) values(true,encode(sha256(convert_to('hcf-test-only-secret','UTF8')),'hex'));
insert into public.hcf_verified_users(user_id,email) values('00000000-0000-0000-0000-000000000002','hcf-test-editor@example.invalid');
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000001","email":"hcf-test-owner@example.invalid","amr":[{"method":"password"}]}',true);
set local role authenticated;
do $$begin
 if (public.hcf_access_status()->>'canEdit')::boolean then raise exception 'unbound owner permitted'; end if;
 begin perform public.hcf_create_record('rule','{"title":"Denied","body":""}',0); raise exception 'unbound owner wrote'; exception when sqlstate 'P0403' then null; end;
 begin perform public.hcf_register_identity('hcf-test-only-secret','hcf-test-owner@example.invalid'); raise exception 'password enrollment permitted'; exception when sqlstate 'P0403' then null; end;
end;$$;
reset role;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000001","email":"hcf-test-owner@example.invalid","amr":[{"method":"magiclink"}]}',true);
set local role authenticated;
do $$begin
 begin perform public.hcf_register_identity('wrong','hcf-test-owner@example.invalid'); raise exception 'wrong secret permitted'; exception when sqlstate 'P0403' then null; end;
 perform public.hcf_register_identity('hcf-test-only-secret','hcf-test-owner@example.invalid');
 perform set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000001","email":"hcf-test-owner@example.invalid","amr":[{"method":"otp"}]}',true);
 perform public.hcf_register_identity('hcf-test-only-secret','hcf-test-owner@example.invalid');
 perform set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000001","email":"hcf-test-owner@example.invalid","amr":[{"method":"email/signup"}]}',true);
 perform public.hcf_register_identity('hcf-test-only-secret','hcf-test-owner@example.invalid');
end;$$;
reset role;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000001","email":"changed@example.invalid"}',true);
set local role authenticated;
do $$begin
 if (public.hcf_access_status()->>'canEdit')::boolean then raise exception 'changed email permitted'; end if;
end;$$;
reset role;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000001","email":"hcf-test-owner@example.invalid","role":"authenticated"}',true);
create temporary table hcf_test_ids(label text,id text);
grant select,insert on hcf_test_ids to authenticated;
set local role authenticated;
do $$
declare phase jsonb; task jsonb; rule jsonb; before_order jsonb; all_phases jsonb; reordered jsonb; denied boolean;
begin
 if not (public.hcf_access_status()->>'isOwner')::boolean then raise exception 'owner status'; end if;
 perform public.hcf_change_editor(' HCF-TEST-ADDED@example.invalid ',false);
 if not public.hcf_list_editors() @> '[{"email":"hcf-test-added@example.invalid"}]' then raise exception 'editor addition'; end if;
 begin perform public.hcf_change_editor('hcf-test-owner@example.invalid',true); raise exception 'owner removable'; exception when sqlstate 'P0400' then null; end;
 phase:=public.hcf_create_record('phase','{"title":"SQL test","assignee":"","startDate":"","endDate":""}',0);
 task:=public.hcf_create_record('task',jsonb_build_object('title','Task','assignee','','phaseId',phase->>'id','dueDate','','completed',false),0);
 begin perform public.hcf_change_record(phase->>'id',1,null,null,true); raise exception 'referenced phase deleted'; exception when sqlstate 'P0409' then null; end;
 perform public.hcf_change_record(task->>'id',1,null,null,true);
 perform public.hcf_change_record(phase->>'id',1,null,null,true);
 begin perform public.hcf_create_record('task',jsonb_build_object('title','Task','assignee','','phaseId',phase->>'id','dueDate','','completed',false),0); raise exception 'deleted phase accepted'; exception when sqlstate 'P0409' then null; end;
 rule:=public.hcf_create_record('rule','{"title":"SQL test","body":""}',0);
 perform public.hcf_change_record(rule->>'id',1,'{"title":"Changed","body":""}',null,false);
 begin perform public.hcf_change_record(rule->>'id',1,'{"title":"Stale","body":""}',null,false); raise exception 'stale update accepted'; exception when sqlstate 'P0409' then null; end;
 begin perform public.hcf_change_record('team',0,null,null,true); raise exception 'team deleted'; exception when sqlstate 'P0400' then null; when sqlstate 'P0409' then null; end;
 phase:=public.hcf_create_record('phase','{"title":"Reorder test","assignee":"","startDate":"","endDate":""}',0);
 select jsonb_agg(jsonb_build_object('id',id,'revision',revision) order by id),jsonb_agg(to_jsonb(r) order by id) into all_phases,before_order from public.hcf_records r where kind='phase';
 begin perform public.hcf_reorder_phases(jsonb_build_array(jsonb_build_object('id',phase->>'id','revision',0))); raise exception 'stale reorder accepted'; exception when sqlstate 'P0409' then null; end;
 if before_order<>(select jsonb_agg(to_jsonb(r) order by id) from public.hcf_records r where kind='phase') then raise exception 'failed reorder changed data'; end if;
 reordered:=public.hcf_reorder_phases(all_phases);
 if jsonb_array_length(reordered)<>jsonb_array_length(all_phases) then raise exception 'reorder incomplete'; end if;
 insert into pg_temp.hcf_test_ids values('deleted',task->>'id');
 begin insert into public.hcf_records(id,kind,data) values('hcf-bypass','rule','{}'); raise exception 'direct insert accepted'; exception when insufficient_privilege then null; end;
end;$$;
reset role;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000002","email":"hcf-test-editor@example.invalid","role":"authenticated"}',true);
set local role authenticated;
do $$begin
 if not (public.hcf_access_status()->>'canEdit')::boolean or (public.hcf_access_status()->>'isOwner')::boolean then raise exception 'editor status'; end if;
 begin perform public.hcf_list_editors(); raise exception 'editor accessed emails'; exception when sqlstate 'P0403' then null; end;
 perform public.hcf_create_record('rule','{"title":"Editor test","body":""}',0);
end;$$;
reset role;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000003","email":"unlisted@example.invalid","role":"authenticated"}',true);
set local role authenticated;
do $$begin
 begin perform public.hcf_create_record('rule','{"title":"Denied","body":""}',0); raise exception 'unlisted user wrote'; exception when sqlstate 'P0403' then null; end;
end;$$;
reset role;
select set_config('request.jwt.claims','{}',true);
grant select on hcf_test_ids to anon;
set local role anon;
do $$begin
 if (public.hcf_access_status()->>'signedIn')::boolean then raise exception 'anonymous signed in'; end if;
 if exists(select 1 from public.hcf_records where id in(select id from pg_temp.hcf_test_ids)) then raise exception 'deleted record leaked'; end if;
 begin perform public.hcf_create_record('rule','{"title":"Denied","body":""}',0); raise exception 'anonymous wrote'; exception when insufficient_privilege then null; end;
 begin perform 1 from public.hcf_editors; raise exception 'anonymous read emails'; exception when insufficient_privilege then null; end;
end;$$;
reset role;
select 'hcf transaction and RLS tests passed' as result;
rollback;
