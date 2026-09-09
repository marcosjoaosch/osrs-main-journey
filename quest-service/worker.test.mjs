import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createService} from './worker.mjs';
const payload = name => ({username:name,quests:{'Swan Song':2},timestamp:'2026-09-08T20:00:00Z'});
const req = name => new Request('https://service.test/quests?username='+encodeURIComponent(name),{headers:{Origin:'https://marcosjoaosch.github.io'}});
test('an upstream failure is not cached and a retry can recover',async()=>{
  let calls=0;const handle=createService({fetchUpstream:async()=>{if(++calls===1)throw new Error('timeout');return Response.json(payload('samurai_jao'))}});
  assert.equal((await handle(req('samurai_jao'))).status,502);
  const retry=await handle(req('samurai_jao'));assert.equal(retry.status,200);assert.equal((await retry.json()).cached,false);assert.equal(calls,2);
});
test('isolates accounts, coalesces requests and expires the short cache',async()=>{
  let calls=0,time=1000;
  const handle=createService({now:()=>time,fetchUpstream:async url=>{calls++;return Response.json(payload(decodeURIComponent(url.split('/').at(-2))))}});
  const responses=await Promise.all([handle(req('samurai_jao')),handle(req('samurai_jao'))]);
  assert.equal(calls,1); assert.equal((await responses[0].json()).cached,false);
  assert.equal((await (await handle(req('samurai jao'))).json()).cached,true);
  assert.equal((await (await handle(req('Iron Samuka'))).json()).payload.username,'Iron Samuka');
  assert.equal(calls,2);time+=31000;
  await handle(req('samurai_jao'));assert.equal(calls,3);
});
test('rejects wrong identity, malformed data, unknown names and upstream failures',async()=>{
  for(const [body,status,expected] of [[payload('Other'),200,502],[{username:'samurai_jao',quests:{x:8}},200,502],[{},404,404],[{},503,502]]){
    const handle=createService({fetchUpstream:async()=>Response.json(body,{status})});
    assert.equal((await handle(req('samurai_jao'))).status,expected);
  }
});
test('restricts routes, input, origin and excessive calls',async()=>{
  const handle=createService({fetchUpstream:async()=>Response.json(payload('samurai_jao'))});
  assert.equal((await handle(req('../bad'))).status,400);
  assert.equal((await handle(new Request('https://service.test/anything'))).status,404);
  assert.equal((await handle(new Request('https://service.test/quests?username=samurai_jao',{headers:{Origin:'https://unknown.test'}}))).status,403);
  for(let i=0;i<30;i++)assert.equal((await handle(req('samurai_jao'))).status,200);
  assert.equal((await handle(req('samurai_jao'))).status,429);
});
