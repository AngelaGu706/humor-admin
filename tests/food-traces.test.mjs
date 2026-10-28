import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
function fixture(deny = false) {
  let reads = 0;
  const { outputText } = ts.transpileModule(readFileSync(new URL('../lib/food-traces.ts',import.meta.url),'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}});
  const mod={exports:{}};
  new Function('require','module','exports',outputText)(name=>{
    if(name==='server-only')return{};
    if(name==='./auth')return{requireAdmin:async()=>{if(deny)throw new Error('Denied');return{supabase:{from:()=>{reads++;throw new Error('Database reached');}}};}};
    if(name==='./content')return{isUuid:x=>/^[0-9a-f-]{36}$/i.test(x)};
    if(name==='next/navigation')return{notFound:()=>{throw new Error('Not found');},redirect:()=>{throw new Error('Redirect');}};
    throw new Error(name);
  },mod,mod.exports);
  return {...mod.exports,reads:()=>reads};
}
test('food trace list and detail deny access before any database reads',async()=>{
  const f=fixture(true);await assert.rejects(f.foodRequests(),/Denied/);await assert.rejects(f.foodRequest('00000000-0000-4000-8000-000000000001'),/Denied/);assert.equal(f.reads(),0);
});
test('invalid request IDs never reach a database query',async()=>{
  const f=fixture();await assert.rejects(f.foodRequest('invalid'),/Not found/);assert.equal(f.reads(),0);
});
