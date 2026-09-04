function bindGoalProgress() {
  document.querySelectorAll('[data-progress]').forEach(button => button.onclick = () => {
    const goal = state.goals[Number(button.dataset.goalIndex)], value = Number(button.dataset.progress);
    if (!goal) return;
    goal.progress = value;
    goal.status = value === 100 ? 'Concluída' : value > 0 ? 'Em andamento' : 'Disponível';
    save(); render();
  });
}
new MutationObserver(() => bindGoalProgress()).observe(document.querySelector('#content'), { childList: true });
bindGoalProgress();
