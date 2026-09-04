const TODO_KEY = 'osrs-main-journey-todos-v1';
let todos = JSON.parse(localStorage.getItem(TODO_KEY) || 'null') || [
  { text: 'Fazer 1 nível de Runecraft', done: false },
  { text: 'Fazer 1 quest de requisito', done: false },
  { text: 'Fazer herb run', done: false }
];
function saveTodos() { localStorage.setItem(TODO_KEY, JSON.stringify(todos)); }
function todoPanel() {
  return `<section class="card todo-panel"><div class="section-head" style="margin-top:0"><div><span class="eyebrow">SESSÃO LEVE</span><h2>To-do de hoje</h2></div><span class="pill">${todos.filter(t => t.done).length}/${todos.length}</span></div><p class="muted">Escolha poucas ações. Se cumprir uma, a sessão já valeu.</p><div class="todo-list">${todos.map((todo, index) => `<div class="todo-row"><label class="todo-item ${todo.done ? 'done' : ''}"><span class="todo-check"><input type="checkbox" data-todo-index="${index}" ${todo.done ? 'checked' : ''}><span>${escapeTodo(todo.text)}</span></span></label><div class="todo-actions"><button class="ghost-btn" type="button" data-todo-edit="${index}">Editar</button><button class="ghost-btn danger" type="button" data-todo-delete="${index}">Excluir</button></div></div>`).join('')}</div><form class="todo-form" id="todoForm"><input name="todo" maxlength="80" placeholder="Adicionar uma ação pequena..." required><button class="primary-btn">+</button></form><button class="ghost-btn" id="clearTodos" type="button">Limpar concluídas</button></section>`;
}
function todoSummaryCard() { return `<section class="card todo-summary"><div class="section-head" style="margin-top:0"><div><span class="eyebrow">RESUMO DA SESSÃO</span><h2>Hoje</h2></div><span class="pill">${todos.filter(t => t.done).length}/${todos.length}</span></div><div class="summary-todos">${todos.map((todo, index) => `<label class="summary-todo ${todo.done ? 'done' : ''}"><input type="checkbox" data-summary-todo-index="${index}" ${todo.done ? 'checked' : ''}><span>${escapeTodo(todo.text)}</span></label>`).join('') || '<span class="muted">Nenhuma tarefa configurada.</span>'}</div><button class="ghost-btn" id="configureTodos" type="button">Configurar sessão →</button></section>`; }
function accountSyncCard() { return `<section class="card sync-card"><div><span class="eyebrow">CONTA CONECTADA</span><h2>${escapeTodo(state.username || 'samurai_jao')}</h2><p class="muted">Wise Old Man · Total level atual: <strong>${state.total || '—'}</strong>${state.lastSync ? ` · atualizado ${escapeTodo(state.lastSync)}` : ''}</p></div><button class="ghost-btn" id="openSync">Atualizar conta</button></section>`; }
function accountSummaryCard() { const important = (state.skills || []).filter(skill => ['Attack', 'Strength', 'Defence', 'Ranged', 'Magic', 'Prayer', 'Hitpoints'].includes(skill[0])); return `<section class="card account-summary"><div class="section-head" style="margin-top:0"><div><span class="eyebrow">RESUMO DA CONTA</span><h2>Progressão atual</h2></div><div><span class="pill">${state.total || '—'} total</span><button class="ghost-btn summary-edit" id="editSummary" type="button">Editar</button></div></div><div class="skill-summary">${important.map(skill => `<div><span>${escapeTodo(skill[0])}</span><strong>${skill[1]}</strong><small>meta ${skill[2]}</small></div>`).join('')}</div><div class="summary-footer"><span>Próximo marco: <strong>2000 Total</strong></span><span>Hard CAs · ToA · All Hard Diaries</span></div></section>`; }
function accountSummaryEditor() { const important = (state.skills || []).filter(skill => ['Attack', 'Strength', 'Defence', 'Ranged', 'Magic', 'Prayer', 'Hitpoints'].includes(skill[0])); return `<section class="card account-summary"><div class="section-head" style="margin-top:0"><div><span class="eyebrow">EDITAR METAS</span><h2>Metas de combate</h2></div><span class="muted">Níveis atuais vêm da Wise Old Man</span></div><form class="summary-form" id="summaryForm"><div class="sync-readonly"><strong>Total atual: ${state.total || '—'}</strong><small>Somente leitura · sincronizado pela Wise Old Man</small></div><div class="summary-edit-grid">${important.map((skill, i) => `<label>${escapeTodo(skill[0])}<span class="level-target-row"><strong>${skill[1]}</strong><input name="target-${i}" type="number" min="1" value="${skill[2]}"></span><small>atual / meta</small></label>`).join('')}</div><div class="form-actions"><button class="ghost-btn" type="button" id="cancelSummary">Cancelar</button><button class="primary-btn">Salvar metas</button></div></form></section>`; }
function escapeTodo(value) { return String(value).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m])); }
function mountTodos() {
  const content = document.querySelector('#content');
  if (!content) return;
  document.querySelectorAll('#nav .nav-item').forEach(item => item.classList.toggle('active', item.dataset.page === page));
  const title = document.querySelector('#pageTitle')?.textContent;
  if (title === 'Skills') document.querySelector('#pageTitle').textContent = 'Meu personagem';
  if (title === 'Sessão de hoje' && !document.querySelector('.todo-panel')) content.insertAdjacentHTML('afterbegin', todoPanel());
  if (title === 'Visão geral' && !document.querySelector('.todo-summary')) content.insertAdjacentHTML('afterbegin', todoSummaryCard());
  if (title === 'Visão geral' && !document.querySelector('.sync-card')) content.insertAdjacentHTML('beforeend', accountSyncCard());
  if (title === 'Visão geral' && !document.querySelector('.account-summary')) content.insertAdjacentHTML('beforeend', accountSummaryCard());
  document.querySelectorAll('.skill-summary div').forEach(card => { const name = card.querySelector('span'); const file = name?.textContent.toLowerCase() + '-icon.png'; if (name && !name.querySelector('img')) name.insertAdjacentHTML('afterbegin', `<img src="assets/${file}" alt="" aria-hidden="true">`); });
  if (title === 'Skills') document.querySelectorAll('.skill-name').forEach(name => { const file = name.textContent.toLowerCase() + '-icon.png'; const available = ['attack', 'strength', 'defence', 'ranged', 'magic', 'prayer', 'hitpoints', 'runecraft', 'agility', 'herblore', 'thieving', 'crafting', 'mining', 'smithing', 'fishing', 'cooking', 'firemaking', 'woodcutting', 'fletching', 'slayer', 'farming', 'hunter', 'construction', 'sailing']; if (!name.querySelector('img') && available.includes(name.textContent.toLowerCase())) name.insertAdjacentHTML('afterbegin', `<img src="assets/${file}" alt="" aria-hidden="true">`); });
  const form = document.querySelector('#todoForm');
  if (form) form.onsubmit = event => { event.preventDefault(); const value = new FormData(form).get('todo').trim(); if (value) { todos.push({ text: value, done: false }); saveTodos(); refreshTodos(); } };
  document.querySelectorAll('[data-todo-index]').forEach(input => input.onchange = () => { todos[Number(input.dataset.todoIndex)].done = input.checked; saveTodos(); refreshTodos(); });
  document.querySelectorAll('[data-summary-todo-index]').forEach(input => input.onchange = () => { todos[Number(input.dataset.summaryTodoIndex)].done = input.checked; saveTodos(); refreshTodos(); });
  document.querySelectorAll('[data-todo-edit]').forEach(button => button.onclick = () => { const index = Number(button.dataset.todoEdit), value = prompt('Editar ação:', todos[index].text); if (value?.trim()) { todos[index].text = value.trim(); saveTodos(); refreshTodos(); } });
  document.querySelectorAll('[data-todo-delete]').forEach(button => button.onclick = () => { const index = Number(button.dataset.todoDelete); if (confirm(`Excluir “${todos[index].text}”?`)) { todos.splice(index, 1); saveTodos(); refreshTodos(); } });
  const clear = document.querySelector('#clearTodos');
  if (clear) clear.onclick = () => { todos = todos.filter(todo => !todo.done); saveTodos(); refreshTodos(); };
  const configure = document.querySelector('#configureTodos');
  if (configure) configure.onclick = () => { page = 'session'; render(); };
  const syncLink = document.querySelector('#openSync');
  if (syncLink) syncLink.onclick = () => { page = 'settings'; render(); };
  const skillSave = document.querySelector('#saveSkillTargets');
  if (skillSave) skillSave.onclick = () => { document.querySelectorAll('[data-target-index]').forEach(input => { state.skills[Number(input.dataset.targetIndex)][2] = Number(input.value) || state.skills[Number(input.dataset.targetIndex)][2]; }); save(); render(); };
  const skillSync = document.querySelector('#syncFromSkills');
  if (skillSync) skillSync.onclick = () => { page = 'settings'; render(); setTimeout(() => document.querySelector('#syncAccount')?.click(), 0); };
  const summaryEdit = document.querySelector('#editSummary');
  if (summaryEdit) summaryEdit.onclick = () => { const card = document.querySelector('.account-summary'); card.outerHTML = accountSummaryEditor(); const form = document.querySelector('#summaryForm'); form.onsubmit = event => { event.preventDefault(); const data = new FormData(form), important = state.skills.filter(skill => ['Attack', 'Strength', 'Defence', 'Ranged', 'Magic', 'Prayer', 'Hitpoints'].includes(skill[0])); important.forEach((skill, i) => { skill[2] = Number(data.get(`target-${i}`)) || skill[2]; }); save(); page = 'dashboard'; render(); }; document.querySelector('#cancelSummary').onclick = () => { page = 'dashboard'; render(); }; };
}
function refreshTodos() { document.querySelector('.todo-panel')?.remove(); document.querySelector('.todo-summary')?.remove(); mountTodos(); }
new MutationObserver(() => mountTodos()).observe(document.querySelector('#content'), { childList: true });
mountTodos();
