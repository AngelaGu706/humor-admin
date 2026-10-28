import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
function load(path, imports = {}) {
  const { outputText } = ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', outputText)(name => { if (name === 'server-only') return {}; if (name in imports) return imports[name]; throw new Error(name); }, mod, mod.exports);
  return mod.exports;
}
const catalog = load('../lib/course-catalog.ts');
test('model search finds names containing a version dot', async () => {
  const models = [{ id: 1, name: 'GPT-4.1', provider_model_id: 'gpt-4.1-2025-04-14' }, { id: 2, name: 'GPT-4o', provider_model_id: 'gpt-4o-2024-08-06' }];
  let filters = [];
  const query = { select() { return this; }, order() { return this; }, async in() { return { data: [], error: null }; }, or(value) { filters = value.split(','); return this; }, async range() {
    const data = models.filter(row => filters.some(filter => { const [column, pattern] = filter.split('.ilike.%'); return String(row[column]).toLowerCase().includes(pattern.slice(0, -1).toLowerCase()); }));
    return { data, count: data.length, error: null };
  } };
  const data = load('../lib/course-data.ts', { './course-server': { requireCourseAdmin: async () => ({ supabase: { from: () => query } }) }, './course-catalog': catalog, 'next/navigation': { notFound() { throw new Error('Not found'); }, redirect() { throw new Error('Unexpected redirect'); } } });
  const result = await data.courseList('models', { q: 'GPT-4.1' });
  assert.deepEqual(result.rows.map(row => row.name), ['GPT-4.1']);
  assert.equal(result.count, 1);
});
class AccessError extends Error { constructor(status, message) { super(message); this.status = status; } }
const response = (data, init) => Response.json(data, init);
function fixture({ deny = false, data = { id: 9, modified_datetime_utc: '2026-10-27T12:00:00Z' }, error = null } = {}) {
  const operations = [];
  const query = {};
  for (const method of ['insert', 'update', 'delete', 'eq', 'select']) query[method] = (...args) => { operations.push([method, ...args]); return query; };
  for (const method of ['single', 'maybeSingle']) query[method] = async () => ({ data, error });
  const supabase = { from: table => { operations.push(['from', table]); return query; } };
  const { courseMutation } = load('../lib/course-mutations.ts', {
    'next/server': { NextResponse: { json: response } },
    './course-server': { authorizeCourseAdmin: async () => { if (deny) throw new AccessError(401, 'Sign in'); return { supabase }; } },
    './course-catalog': catalog, './auth': { AccessError },
    './api': { sameOrigin: req => { if (req.headers.get('origin') !== new URL(req.url).origin) throw new AccessError(403, 'Origin'); }, apiError: err => response({ error: err.message }, { status: err.status || 500 }) },
  });
  return { operations, run: (key, method, body = {}, id = '9', origin = 'https://admin.example') => courseMutation(new Request('https://admin.example/api/studio/' + key, { method, headers: { origin, 'Content-Type': 'application/json' }, body: JSON.stringify(body) }), { params: Promise.resolve({ resource: key, id }) }) };
}
const version = '2026-10-27T12:00:00Z';
test('the resource catalog contains every Week 7 requirement and never exposes credential tables', () => {
  for (const key of ['users','chains','steps','mix','terms','content','requests','examples','models','providers','responses','domains','emails']) assert.ok(catalog.resourceFor(key));
  for (const key of ['auth_tokens','auth_clients','__proto__','constructor']) assert.equal(catalog.resourceFor(key), undefined);
  assert.deepEqual(Object.keys(catalog.resources).filter(key => catalog.resources[key].fields && !catalog.resources[key].updateOnly).sort(), ['domains','emails','examples','models','providers','terms']);
});
test('server validation excludes role, ownership, and arbitrary audit fields', () => {
  for (const key of ['is_superadmin','created_by_user_id','modified_datetime_utc','id']) assert.throws(() => catalog.validateValues(catalog.resources.providers, { name: 'Example', [key]: true }), /cannot be changed/);
});
test('integer values reject decimals, unsafe IDs, booleans, and out of range counts', () => {
  for (const count of [-1, 32768, 2.5, true, '1e2', 'Infinity', 9007199254740992]) assert.throws(() => catalog.validateValues(catalog.resources.mix, { humor_flavor_id: '1', caption_count: count }));
  assert.deepEqual(catalog.validateValues(catalog.resources.mix, { humor_flavor_id: '1', caption_count: '0' }), { humor_flavor_id: 1, caption_count: 0 });
});
test('domain and email fields normalize valid values and reject URLs, wildcards, and malformed entries', () => {
  assert.equal(catalog.validateValues(catalog.resources.domains, { apex_domain: ' Columbia.EDU ' }).apex_domain, 'columbia.edu');
  assert.equal(catalog.validateValues(catalog.resources.emails, { email_address: ' Test@Columbia.EDU ' }).email_address, 'test@columbia.edu');
  for (const domain of ['https://columbia.edu','*.columbia.edu','a@columbia.edu','localhost','-bad.edu','ok.edu/path']) assert.throws(() => catalog.validateValues(catalog.resources.domains, { apex_domain: domain }));
  for (const email of ['not-an-email', 'a@@b.edu', 'a@-bad.edu', 'a b@c.edu']) assert.throws(() => catalog.validateValues(catalog.resources.emails, { email_address: email }));
});
test('models require real booleans and all required fields; optional references can be blank', () => {
  assert.throws(() => catalog.validateValues(catalog.resources.models, { name: 'Test', llm_provider_id: '1', provider_model_id: 'test', is_temperature_supported: 'true' }));
  assert.throws(() => catalog.validateValues(catalog.resources.providers, { name: '  ' }));
  assert.deepEqual(catalog.validateValues(catalog.resources.terms, { term: 'test', definition: 'meaning', example: 'usage', priority: '0', term_type_id: '' }), { term: 'test', definition: 'meaning', example: 'usage', priority: 0, term_type_id: null });
});
test('image previews only accept HTTPS URLs without embedded credentials', () => {
  for (const value of ['javascript:alert(1)','data:image/svg+xml,test','http://example.com/a.jpg','https://user:password@example.com/a.jpg', null]) assert.equal(catalog.safeImageUrl(value), null);
  assert.equal(catalog.safeImageUrl('https://example.com/image.jpg'), 'https://example.com/image.jpg');
});
test('anonymous writes and cross-origin requests stop before any table access', async () => {
  for (const method of ['POST','PATCH','DELETE']) { const f = fixture({ deny: true }); assert.equal((await f.run('terms', method)).status, 401); assert.deepEqual(f.operations, []); }
  const f = fixture(); assert.equal((await f.run('terms', 'POST', {}, '9', 'https://evil.example')).status, 403); assert.deepEqual(f.operations, []);
});
test('read-only resources, arbitrary table names, and forbidden mix actions cannot be mutated', async () => {
  for (const [key, method, status] of [['users','PATCH',405],['steps','PATCH',405],['content','DELETE',405],['auth_tokens','POST',404],['mix','POST',405],['mix','DELETE',405]]) { const f = fixture(); assert.equal((await f.run(key,method)).status, status); assert.deepEqual(f.operations, []); }
});
test('create sends only validated business fields and leaves IDs and audit fields to the database', async () => {
  const f = fixture(); const res = await f.run('providers','POST',{ values: { name: '  New provider  ' } }); assert.equal(res.status, 201);
  assert.deepEqual(f.operations.find(op => op[0] === 'insert'), ['insert', { name: 'New provider' }]);
  assert.equal(f.operations[0][1], 'llm_providers');
});
test('updates and deletes require the original version and filter by both ID and version', async () => {
  for (const method of ['PATCH','DELETE']) {
    const f = fixture(); const res = await f.run('providers', method, { ...(method === 'PATCH' ? { values: { name: 'Edited' } } : {}), version }); assert.equal(res.status,200);
    assert.ok(f.operations.some(op => op[0] === 'eq' && op[1] === 'id' && op[2] === '9'));
    assert.ok(f.operations.some(op => op[0] === 'eq' && op[1] === 'modified_datetime_utc' && op[2] === version));
  }
  const f = fixture(); assert.equal((await f.run('providers','PATCH',{ values:{name:'Edit'} })).status,400); assert.deepEqual(f.operations, []);
});
test('stale edits and database constraints produce recoverable conflict errors', async () => {
  const stale = fixture({ data: null }); assert.equal((await stale.run('providers','DELETE',{ version })).status,409);
  for (const [code,status] of [['23503',409],['23505',409],['42501',403],['23514',400]]) { const f = fixture({ error:{code} }); assert.equal((await f.run('providers','POST',{values:{name:'Test'}})).status,status); }
});
test('invalid IDs, body fields, role injection, and excessive payloads are rejected before data writes', async () => {
  for (const [id, body] of [['invalid',{values:{name:'Test'},version}], ['9',{values:{name:'Test',is_superadmin:true},version}], ['9',{values:{name:'Test'},version,user_id:'other'}]]) { const f = fixture(); assert.equal((await f.run('providers','PATCH',body,id)).status,400); assert.deepEqual(f.operations,[]); }
  const f = fixture(); assert.equal((await f.run('providers','POST',{values:{name:'x'.repeat(91000)}})).status,413); assert.deepEqual(f.operations,[]);
});
function authFixture({ user = { id:'owner', identities:[{provider:'google'}] }, profile = {id:'owner',is_superadmin:true}, profileError = null } = {}) {
  let dataReads = 0;
  const client = { auth:{getUser:async()=>({data:{user},error:null})}, from:()=>{ dataReads++; return {select:()=>({eq:()=>({maybeSingle:async()=>({data:profile,error:profileError})})})}; } };
  const originalUrl = process.env.COURSE_SUPABASE_URL, originalKey = process.env.COURSE_SUPABASE_PUBLISHABLE_KEY;
  process.env.COURSE_SUPABASE_URL='https://course.example'; process.env.COURSE_SUPABASE_PUBLISHABLE_KEY='public-test-key';
  const courseAuth = load('../lib/course-server.ts', { '@supabase/ssr':{createServerClient:()=>client}, 'next/headers':{cookies:async()=>({getAll:()=>[]})}, 'next/navigation':{redirect:path=>{throw new Error(path)}}, './auth':{AccessError} });
  return { authorize:()=>courseAuth.authorizeCourseAdmin(), reads:()=>dataReads, restore:()=>{ if(originalUrl===undefined) delete process.env.COURSE_SUPABASE_URL; else process.env.COURSE_SUPABASE_URL=originalUrl; if(originalKey===undefined) delete process.env.COURSE_SUPABASE_PUBLISHABLE_KEY; else process.env.COURSE_SUPABASE_PUBLISHABLE_KEY=originalKey; } };
}
test('the course workspace independently requires Google and a real boolean administrator flag', async () => {
  for (const config of [{user:null}, {user:{id:'owner',identities:[{provider:'email'}]}}, {profile:null}, {profile:{is_superadmin:false}}, {profile:{is_superadmin:'true'}}, {profileError:new Error('database')}]) {
    const f=authFixture(config); try { await assert.rejects(f.authorize(), err=>[401,403,503].includes(err.status)); if(config.user===null) assert.equal(f.reads(),0); } finally {f.restore();}
  }
  const profile={id:'owner',is_superadmin:true}; const f=authFixture({profile}); try {assert.equal((await f.authorize()).profile.id,'owner'); profile.is_superadmin=false; await assert.rejects(f.authorize(),err=>err.status===403);} finally{f.restore();}
});

test('origin validation preserves the local loopback address without accepting a different host or port', () => {
  const api=load('../lib/api.ts', { 'next/server':{NextResponse:{json:response}}, './auth':{AccessError} });
  const local=new Request('http://localhost:3017/api/studio/models',{headers:{host:'127.0.0.1:3017',origin:'http://127.0.0.1:3017'}});
  assert.equal(api.requestOrigin(local),'http://127.0.0.1:3017'); assert.doesNotThrow(()=>api.sameOrigin(local));
  for(const headers of [{host:'evil.example:3017',origin:'http://evil.example:3017'},{host:'127.0.0.1:9999',origin:'http://127.0.0.1:9999'},{host:'127.0.0.1:3017',origin:'https://evil.example'}]) assert.throws(()=>api.sameOrigin(new Request('http://localhost:3017/api/studio/models',{headers})),err=>err.status===403);
  const live=new Request('https://admin.example/api/studio/models',{headers:{host:'evil.example',origin:'https://evil.example'}}); assert.throws(()=>api.sameOrigin(live),err=>err.status===403);
});
