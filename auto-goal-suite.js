/* Keeps every goal status aligned with its calculated progress. Loaded last. */
const AUTO_GOAL_COMPLETION_EPSILON=99.999;
const AUTO_GOAL_DERIVED_MODES=new Set([
  'quest','skill','boss','raid','diaryTask','diaryTier','combatAchievement',
  'collectionItem','collectionSource','gearLoadout','composite','slayerTask','slayerKills'
]);

function autoGoalComparableName(value=''){
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .replace(/[’‘`´]/g,"'")
    .replace(/[^a-z0-9]+/gi,' ')
    .trim()
    .toLowerCase();
}

const autoGoalBaseQuestByName=questByName;
questByName=function(name){
  const exact=autoGoalBaseQuestByName(name);
  if(exact)return exact;
  const wanted=autoGoalComparableName(name);
  return wanted?(state.quests.items||[]).find(item=>autoGoalComparableName(item.name)===wanted):undefined;
};

function reconcileAutomaticGoalStatuses(historyDetail='Conclusão detectada automaticamente pelo progresso atual.'){
  const completed=[],reopened=[],activated=[],relinked=[];
  (state.goals||[]).forEach(goal=>{
    if(!goal||goal.status==='archived')return;
    if(goal.mode==='quest'&&goal.questName){
      const quest=questByName(goal.questName);
      if(quest&&quest.name!==goal.questName){goal.questName=quest.name;relinked.push(goal.id)}
    }
    let progress=0;
    try{progress=Number(goalProgress(goal))}catch{return}
    if(Number.isFinite(progress)&&progress>=AUTO_GOAL_COMPLETION_EPSILON&&goal.status!=='done'){
      goal.status='done';
      completed.push(goal);
      addHistory('goal',`${goal.title} concluída`,historyDetail);
    }else if(Number.isFinite(progress)&&progress<AUTO_GOAL_COMPLETION_EPSILON&&AUTO_GOAL_DERIVED_MODES.has(goal.mode)&&goal.status==='done'){
      goal.status=progress>0?'active':'planned';
      reopened.push(goal);
      addHistory('goal',`${goal.title} reaberta`,`O progresso automático está em ${Math.round(progress)}%.`);
    }else if(Number.isFinite(progress)&&progress>0&&AUTO_GOAL_DERIVED_MODES.has(goal.mode)&&goal.status==='planned'){
      goal.status='active';
      activated.push(goal);
    }
  });
  return {completed,reopened,activated,relinked,changed:completed.length+reopened.length+activated.length+relinked.length>0};
}

const autoGoalBaseSave=save;
save=function(message='Salvo',option=false){
  const result=reconcileAutomaticGoalStatuses();
  const nextMessage=result.completed.length&&option!==true
    ?`${message} · ${result.completed.length} meta(s) concluída(s)`
    :message;
  return autoGoalBaseSave(nextMessage,option);
};

const autoGoalBaseRender=render;
let autoGoalRendering=false;
render=function(){
  if(!autoGoalRendering){
    const result=reconcileAutomaticGoalStatuses();
    if(result.changed)autoGoalBaseSave('Status das metas atualizado',true);
  }
  autoGoalRendering=true;
  try{return autoGoalBaseRender()}finally{autoGoalRendering=false}
};

const autoGoalInitialRepair=reconcileAutomaticGoalStatuses('Meta reparada automaticamente ao conferir o progresso salvo.');
if(autoGoalInitialRepair.changed){autoGoalBaseSave('Metas automáticas reparadas',true);render()}
