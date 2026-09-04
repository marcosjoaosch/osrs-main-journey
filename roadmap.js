function mountRoadmap() {
  const title = document.querySelector('#pageTitle')?.textContent;
  if (title === 'Metas') {
    document.querySelectorAll('[data-goal-action="edit"]').forEach(button => button.addEventListener('click', () => setTimeout(() => { const goal = state.goals[Number(button.dataset.goalIndex)], era = document.querySelector('#goalForm [name="era"]'); if (goal && era) era.value = goal.era || ''; }, 0)));
    const newEra = document.querySelector('#goalForm [name="era"]'); if (newEra && window.goalEraDraft) newEra.value = window.goalEraDraft;
    return;
  }
  if (title !== 'Roadmap') return;
  document.querySelectorAll('[data-goal-open]').forEach(button => button.onclick = () => {
    window.openGoalIndex = Number(button.dataset.goalOpen);
    page = 'goals'; render();
    setTimeout(() => document.querySelector(`[data-goal-action="edit"][data-goal-index="${window.openGoalIndex}"]`)?.click(), 0);
  });
  document.querySelectorAll('[data-era-add]').forEach(button => button.onclick = () => {
    window.goalEraDraft = Number(button.dataset.eraAdd);
    page = 'goals'; render();
    setTimeout(() => document.querySelector('#goalForm')?.scrollIntoView({ behavior: 'smooth' }), 0);
  });
}
new MutationObserver(() => mountRoadmap()).observe(document.querySelector('#content'), { childList: true });
document.addEventListener('submit', event => {
  if (event.target.id === 'goalForm') {
    const formData = new FormData(event.target), formIndex = Number(formData.get('index')), selectedEra = formData.get('era');
    setTimeout(() => { const goal = formIndex >= 0 ? state.goals[formIndex] : state.goals[state.goals.length - 1]; if (goal) { goal.era = selectedEra ? Number(selectedEra) : undefined; save(); } window.goalEraDraft = null; }, 0);
  }
});
mountRoadmap();
