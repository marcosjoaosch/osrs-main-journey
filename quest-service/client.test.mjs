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
test('new profile can sync while old request finishes without unlocking the new request',async()=>{
  const waiting=[];const c=setup(()=>new Promise(resolve=>waiting.push(resolve)));
  const main=c.state,first=c.syncQuests();
  c.state=structuredClone(main);c.state.username='Iron Samuka';c.profileHub.activeId='iron';
  const second=c.syncQuests();assert.equal(waiting.length,2);
  waiting[0](Response.json(envelope()));await first;
  assert.equal(c.ui.questSyncing,true);assert.equal(main.quests.items[0].state,0);
  waiting[1](Response.json(envelope('Iron Samuka')));await second;
  assert.equal(c.state.quests.items[0].state,2);assert.equal(c.state.goals[0].status,'done');assert.equal(c.ui.questSyncing,false);
});
test('empty collection payload preserves obtained items even with global catalog size',async()=>{
  const body=envelope();body.payload.collection_log=[];body.payload.collectionLogItemCount=1721;body.payload.achievement_diaries={};
  const c=setup(async()=>Response.json(body));await c.syncQuests();
  assert.deepEqual(c.state.progression.collectionLog.completed,[1]);assert.deepEqual(c.state.progression.diaries.data,{saved:true});
});
test('incomplete fractional progress and paused goals are not marked done',async()=>{
  const c=setup(async()=>Response.json(envelope()));c.goalProgress=()=>99.6;await c.syncQuests();
  assert.equal(c.state.goals[0].status,'active');
  c.state.goals[0].status='paused';c.goalProgress=()=>100;await c.syncQuests();assert.equal(c.state.goals[0].status,'paused');
});
test('older service cache and foreign player responses cannot replace progress',async()=>{
  for(const body of [envelope('Other'),{...envelope(),cached:true,payload:{...envelope().payload,timestamp:'2026-09-01T00:00:00Z'}}]){
    let count=0;const c=setup(async()=>{if(++count===1)return Response.json(body);throw new Error('offline')});
    await c.syncQuests();assert.equal(c.state.quests.items[0].state,0);assert.ok(c.state.quests.syncError);
  }
});
test('central status reconciliation preserves pauses and completes linked quests once',async()=>{
  const c=setup(async()=>Response.json(envelope()));let events=0;c.addHistory=()=>events++;
  c.questByName=name=>c.state.quests.items.find(q=>q.name===name);
  const auto=readFileSync(new URL('../auto-goal-suite.js',import.meta.url),'utf8');vm.runInContext(auto,c);
  c.state.goals.push({...c.state.goals[0],title:'Paused',status:'paused'});
  await c.syncQuests();c.render();c.render();
  assert.equal(c.state.goals[0].status,'done');assert.equal(c.state.goals[1].status,'paused');assert.equal(events,1);
});
