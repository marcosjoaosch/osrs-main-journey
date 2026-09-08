import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../app-v2.js',import.meta.url),'utf8');
const syncSource=source.slice(source.indexOf("const QUEST_SYNC_BASE="),source.indexOf('async function loadWikiCatalog()'));
function setup(fetch){
  const state={username:'samurai_jao',quests:{items:[{name:'Swan Song',state:0}],lastSync:'2026-09-08T20:00:00Z'},progression:{diaries:{data:{saved:true}},combatAchievements:{completed:[5]},collectionLog:{completed:[1]}},goals:[{title:'Swan Song',questName:'Swan Song',mode:'quest',status:'planned'}]};
  const c={state,profileHub:{activeId:'main'},ui:{},route:'quests',window:{OSRS_QUEST_SERVICE_URL:'https://service.test'},fetch,AbortSignal,Date,Map,Number,encodeURIComponent,slug:s=>String(s).toLowerCase().replace(/[_ ]/g,'-'),render:()=>{},save:()=>{},toast:()=>{},addHistory:()=>{},formatDate:s=>s};
  c.goalProgress=g=>(c.state.quests.items.find(x=>x.name===g.questName)?.state||0)*50;
  vm.createContext(c);vm.runInContext(syncSource,c);return c;
}
const envelope=(name='samurai_jao')=>({payload:{username:name,timestamp:'2026-09-08T22:00:00Z',quests:{'Swan Song':2}},cached:false,fetchedAt:'2026-09-08T22:00:00Z'});
test('fresh quest completes linked goal and missing fields preserve achievements',async()=>{
  const c=setup(async()=>Response.json(envelope()));await c.syncQuests();
  assert.equal(c.state.goals[0].status,'done');assert.equal(c.state.quests.connection,'live-service');
  assert.deepEqual(c.state.progression.combatAchievements.completed,[5]);assert.deepEqual(c.state.progression.diaries.data,{saved:true});
});
test('switching profile during request never writes another account; duplicate click coalesces',async()=>{
  let resolve,calls=0;const c=setup(()=>{calls++;return new Promise(r=>resolve=r)});
  const original=c.state;const promise=c.syncQuests();await c.syncQuests();assert.equal(calls,1);
  c.state={username:'Iron Samuka'};c.profileHub.activeId='iron';resolve(Response.json(envelope()));await promise;
  assert.equal(original.quests.items[0].state,0);assert.deepEqual(c.state,{username:'Iron Samuka'});assert.equal(c.ui.questSyncing,false);
});
test('failed live and older snapshot preserve completed data',async()=>{
  let count=0;const c=setup(async()=>{if(++count<3)throw new Error('offline');return Response.json({username:'samurai_jao',timestamp:'2026-09-01T00:00:00Z',quests:{'Swan Song':0}})});
  c.state.quests.items[0].state=2;await c.syncQuests();assert.equal(c.state.quests.items[0].state,2);assert.ok(c.state.quests.syncError);
});
