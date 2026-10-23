import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';

test('PostgreSQL migration, RLS and transactional invariants',async()=>{
 const db=new PGlite();
 try{
  // Supabase supplies these standard roles and verified PostgREST JWT helpers.
  // All application tables/functions below are the actual migration, unmodified.
  await db.exec(`
   create role anon;
   create role authenticated;
   create schema auth;
   create function auth.jwt() returns jsonb language sql stable as $$
    select coalesce(nullif(current_setting('request.jwt.claims',true),'')::jsonb,'{}'::jsonb)
   $$;
   create function auth.uid() returns uuid language sql stable as $$
    select (auth.jwt()->>'sub')::uuid
   $$;
   grant usage on schema auth to anon,authenticated;
   grant execute on all functions in schema auth to anon,authenticated;
  `);
  const directory=new URL('../supabase/migrations/',import.meta.url);
  for(const file of (await readdir(directory)).filter(name=>name.endsWith('.sql')).sort()){
   await db.exec(await readFile(new URL(file,directory),'utf8'));
  }
  const sql=await readFile(new URL('../supabase/tests/hcf_transactions.sql',import.meta.url),'utf8');
  const results=await db.exec(sql);
  assert.ok(results.some(r=>r.rows.some(row=>(row as {result?:string}).result==='hcf transaction and RLS tests passed')));
  const records=await db.query<{count:number}>('select count(*)::int as count from public.hcf_records');
  assert.equal(records.rows[0].count,4,'fixture mutations were rolled back');
  const editors=await db.query<{count:number}>('select count(*)::int as count from public.hcf_editors');
  assert.equal(editors.rows[0].count,0,'fixture editor emails were rolled back');
 }finally{await db.close()}
});

test('member profile fields are accepted and still validated',async()=>{
 const db=new PGlite();
 try{
  await db.exec(`create role anon; create role authenticated; create schema auth;
   create function auth.jwt() returns jsonb language sql stable as $$ select '{}'::jsonb $$;
   create function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;`);
  const directory=new URL('../supabase/migrations/',import.meta.url);
  for(const file of (await readdir(directory)).filter(name=>name.endsWith('.sql')).sort())await db.exec(await readFile(new URL(file,directory),'utf8'));
  const check=(data:object)=>db.query('select public.hcf_validate_data($1,$2::jsonb)',['member',JSON.stringify(data)]);
  const base={name:'のむりん',role:'',bio:'',status:'active'};
  await check(base);
  await check({...base,tags:['🚃 ローカル線'],mbti:'INTP-A',focus:'x',schedule:'朝型',values:'y',url:'https://example.com'});
  await assert.rejects(check({...base,url:'javascript:alert(1)'}));
  await assert.rejects(check({...base,tags:'not-array'}));
  await assert.rejects(check({...base,mbti:'x'.repeat(201)}));
  await assert.rejects(check({...base,unknown:'x'}));
 }finally{await db.close()}
});
