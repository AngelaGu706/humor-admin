import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
function fixture(deny = false, client) {
  let reads = 0;
  const { outputText } = ts.transpileModule(readFileSync(new URL('../lib/food-traces.ts',import.meta.url),'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}});
  const mod={exports:{}};
  new Function('require','module','exports',outputText)(name=>{
    if(name==='server-only')return{};
    if(name==='./auth')return{requireAdmin:async()=>{if(deny)throw new Error('Denied');return{supabase:{from:table=>{reads++;if(client)return client.from(table);throw new Error('Database reached');}}};}};
    if(name==='./content')return{isUuid:x=>/^[0-9a-f-]{36}$/i.test(x)};
    if(name==='next/navigation')return{notFound:()=>{throw new Error('Not found');},redirect:url=>{throw new Error(`Redirect ${url}`);}};
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
function requestClient() {
  const rows = Array.from({length:45},(_,i)=>({id:String(i),status:i<23?'succeeded':i<44?'failed':'running',user_input:i===0?'Dinner':'Brunch',result_title:i<23?'Buvette':null}));
  return {from(table){
    assert.equal(table,'food_generation_requests');
    let selected=[...rows];
    const builder={
      select(){return builder;},
      eq(column,value){selected=selected.filter(row=>row[column]===value);return builder;},
      or(expression){
        const match=/^user_input\.ilike\.%(.+)%,result_title\.ilike\.%\1%$/.exec(expression);
        assert.ok(match,'search applies the same literal text to both fields');
        const q=match[1].toLowerCase();
        selected=selected.filter(row=>[row.user_input,row.result_title].some(value=>value?.toLowerCase().includes(q)));return builder;
      },
      order(){return builder;},
      async range(start,end){return {data:selected.slice(start,end+1),count:selected.length,error:null};},
    };return builder;
  }};
}
test('completed search filters before counting and paginating',async()=>{
  const f=fixture(false,requestClient());
  const result=await f.foodRequests(2,'Brunch','completed');
  assert.equal(result.count,22);assert.equal(result.rows.length,2);
  assert.ok(result.rows.every(row=>row.status==='succeeded'&&row.user_input==='Brunch'));
  const byRestaurant=await f.foodRequests(1,'Buvette','completed');
  assert.equal(byRestaurant.count,23);
});
test('failed requests stay separate and out-of-range redirects retain search and status',async()=>{
  const f=fixture(false,requestClient());
  const result=await f.foodRequests(2,'Brunch','failed');
  assert.equal(result.count,21);assert.equal(result.rows.length,1);assert.equal(result.rows[0].status,'failed');
  await assert.rejects(f.foodRequests(99,'Brunch','failed'),error=>{
    const url=new URL(error.message.replace('Redirect ',''),'https://admin.example');
    assert.equal(url.pathname,'/admin/requests');assert.equal(url.searchParams.get('page'),'2');
    assert.equal(url.searchParams.get('q'),'Brunch');assert.equal(url.searchParams.get('status'),'failed');return true;
  });
});
test('empty matches and unknown status filters have useful fallback behavior',async()=>{
  const f=fixture(false,requestClient());
  assert.deepEqual(await f.foodRequests(1,'missing restaurant','failed'),{rows:[],count:0});
  assert.equal((await f.foodRequests(1,'','unrecognized')).count,45);
  assert.equal((await f.foodRequests()).count,45);
});
test('filter navigation safely retains a search and can clear it independently',()=>{
  const f=fixture();
  const url=new URL(f.foodRequestsUrl({q:'eggs & toast',status:'failed'}),'https://admin.example');
  assert.equal(url.searchParams.get('q'),'eggs & toast');assert.equal(url.searchParams.get('status'),'failed');
  assert.equal(url.searchParams.has('page'),false);
  assert.equal(f.foodRequestsUrl({status:'failed'}),'/admin/requests?status=failed');
  assert.equal(f.foodRequestsUrl(),'/admin/requests');
});
test('provider failures without output are not shown as validation failures',()=>{
  const f=fixture();
  assert.equal(f.validationStatus({validation_passed:false,output_text:null}),'Not run');
  assert.equal(f.validationStatus({validation_passed:false,output_text:'  \n'}),'Not run');
  assert.equal(f.validationStatus({validation_passed:null,output_text:null}),'Not run');
  assert.equal(f.traceErrorMessage('model_http_503'),'Model temporarily unavailable');
});
test('invalid returned content still fails validation and successful output stays passed',()=>{
  const f=fixture();
  assert.equal(f.validationStatus({validation_passed:false,output_text:'invalid JSON'}),'Failed');
  assert.equal(f.validationStatus({validation_passed:true,output_text:'{"title":"Buvette"}'}),'Passed');
  assert.equal(f.validationStatus({validation_passed:null,output_text:'partial response'}),'Not completed');
});
test('error descriptions distinguish model, persistence, and constraint failures without inventing unknown causes',()=>{
  const f=fixture();
  assert.equal(f.traceErrorMessage('model_http_429'),'Model rate limit reached');
  assert.equal(f.traceErrorMessage('model_http_504'),'Model request timed out');
  assert.equal(f.traceErrorMessage('trace_write_failed'),'Could not save generation record');
  assert.equal(f.traceErrorMessage('neighborhood_mismatch'),'Result did not match the requested neighborhood');
  assert.equal(f.traceErrorMessage('unrecognized_error'),'Generation failed');
});
