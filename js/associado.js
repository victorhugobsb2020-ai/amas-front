// associado.js

// --- TEMA ---
const savedTheme = localStorage.getItem('amas-theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);
document.getElementById('themeIcon').className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
document.getElementById('themeToggle').addEventListener('click', () => {
  const cur = document.documentElement.getAttribute('data-theme');
  const next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('amas-theme', next);
  document.getElementById('themeIcon').className = next === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
});

// --- AUTH ---
let logged = JSON.parse(localStorage.getItem('amas-logged') || 'null');
if (!logged || logged.tipo !== 'associado') window.location.href = 'login.html';

// Recarrega usuário atualizado
function getLoggedUser() {
  const users = JSON.parse(localStorage.getItem('amas-users') || '[]');
  return users.find(u => u.cpf === logged.cpf && u.tipo === 'associado') || logged;
}

let user = getLoggedUser();
document.getElementById('sidebarName').textContent = user.nome;

// --- DATA/HORA ---
function updateDT() {
  document.getElementById('dateTime').textContent = new Date().toLocaleString('pt-BR');
}
updateDT(); setInterval(updateDT, 1000);

// --- SIDEBAR ---
document.getElementById('hamburger').addEventListener('click', () => document.getElementById('sidebar').classList.toggle('open'));
document.getElementById('sidebarClose').addEventListener('click', () => document.getElementById('sidebar').classList.remove('open'));

// --- PRIMEIRO LOGIN ---
if (user.primeiroLogin) {
  document.getElementById('modalSenha').classList.remove('hidden');
}

document.getElementById('formTrocaSenha')?.addEventListener('submit', function(e) {
  e.preventDefault();
  const nova = document.getElementById('novaSenha').value;
  const conf = document.getElementById('confirmSenha').value;
  const err = document.getElementById('senhaError');
  if (nova.length < 6) { err.textContent = 'A senha deve ter ao menos 6 caracteres.'; err.classList.remove('hidden'); return; }
  if (nova !== conf) { err.textContent = 'As senhas não coincidem.'; err.classList.remove('hidden'); return; }

  const users = JSON.parse(localStorage.getItem('amas-users') || '[]');
  const idx = users.findIndex(u => u.cpf === user.cpf && u.tipo === 'associado');
  if (idx !== -1) { users[idx].senha = nova; users[idx].primeiroLogin = false; localStorage.setItem('amas-users', JSON.stringify(users)); }
  logged.primeiroLogin = false;
  localStorage.setItem('amas-logged', JSON.stringify(logged));
  document.getElementById('modalSenha').classList.add('hidden');
  user = getLoggedUser();
});

// --- SECTIONS ---
function showSection(name, el) {
  document.querySelectorAll('.dash-section').forEach(s => s.classList.remove('active'));
  document.getElementById('sec-' + name).classList.add('active');
  document.querySelectorAll('.sn-item').forEach(i => i.classList.remove('active'));
  if (el) el.classList.add('active');
  document.getElementById('pageTitle').textContent = {
    inicio:'Início', dados:'Meus Dados', financeiro:'Financeiro',
    comprovante:'Enviar Comprovante', historico:'Histórico'
  }[name] || name;
  user = getLoggedUser();
  if (name === 'inicio') renderInicio();
  if (name === 'dados') renderDados();
  if (name === 'financeiro') renderFinanceiro();
  if (name === 'historico') renderHistorico();
}

// --- INÍCIO ---
function renderInicio() {
  user = getLoggedUser();
  document.getElementById('nomeAssoc').textContent = user.nome.split(' ')[0];
  document.getElementById('statMatricula').textContent = user.matricula || '–';
  document.getElementById('statDesde').textContent = user.entrada ? new Date(user.entrada).toLocaleDateString('pt-BR') : '–';
  const contribs = getContribs();
  document.getElementById('statContrib').textContent = contribs.length;
  const benef = user.status === 'regular';
  document.getElementById('statBenef').textContent = benef ? 'Sim ✓' : 'Não ✗';
  const badge = document.getElementById('statusBadge');
  const labelMap = {regular:'Regular',inadimplente:'Inadimplente',pendente:'Pendente',analise:'Em análise'};
  badge.textContent = labelMap[user.status] || user.status;
  badge.style.background = user.status === 'regular' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)';
}

// --- DADOS ---
function renderDados() {
  const grid = document.getElementById('dadosGrid');
  const campos = [
    ['Nome completo', user.nome], ['CPF', user.cpf],
    ['Data de nascimento', user.nascimento ? new Date(user.nascimento).toLocaleDateString('pt-BR') : '–'],
    ['Telefone', user.telefone||'–'], ['Email', user.email||'–'],
    ['Profissão', user.profissao||'–'], ['Endereço', user.endereco||'–'],
    ['Matrícula', user.matricula||'–'], ['Membro desde', user.entrada ? new Date(user.entrada).toLocaleDateString('pt-BR') : '–'],
    ['Status', user.status||'–']
  ];
  grid.innerHTML = campos.map(([l,v]) => `<div class="dado-item"><label>${l}</label><span>${v}</span></div>`).join('');
}

// --- FINANCEIRO ---
function renderFinanceiro() {
  const fs = document.getElementById('finStatus');
  const labelMap = {regular:'Regular',inadimplente:'Inadimplente',pendente:'Pendente',analise:'Em análise'};
  const colorMap = {regular:'#22c55e',inadimplente:'#ef4444',pendente:'#f59e0b',analise:'#3b82f6'};
  fs.innerHTML = `
    <div style="display:flex;align-items:center;gap:1.5rem;flex-wrap:wrap">
      <div style="font-size:2.5rem;color:${colorMap[user.status]||'#4D53A0'}">
        <i class="fas fa-${user.status==='regular'?'check-circle':'exclamation-circle'}"></i>
      </div>
      <div>
        <strong style="font-size:1.2rem;color:var(--text)">${labelMap[user.status]||user.status}</strong>
        <p style="color:var(--text-muted);font-size:0.85rem;margin-top:0.2rem">
          ${user.status==='regular'?'Você está em dia com suas contribuições. Benefícios liberados!':'Verifique sua situação e entre em contato com a AMAS.'}
        </p>
      </div>
    </div>`;

  // Mensagens do admin
  const contribs = getContribs().filter(c => c.msg);
  const msgDiv = document.getElementById('msgAdmin');
  if (!contribs.length) {
    msgDiv.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem">Nenhuma mensagem do administrador.</p>';
    return;
  }
  msgDiv.innerHTML = contribs.map(c =>
    `<div class="msg-item"><i class="fas fa-exclamation-triangle"></i><div>
      <strong>${c.mes}/${c.ano}</strong> – ${c.msg}
    </div></div>`
  ).join('');
}

// --- CONTRIB ---
function getContribs() {
  return JSON.parse(localStorage.getItem('amas-contrib') || '[]').filter(c => c.cpf === user.cpf);
}

document.getElementById('formComprovante')?.addEventListener('submit', function(e) {
  e.preventDefault();
  const err = document.getElementById('compError');
  const ok = document.getElementById('compSucesso');
  const valor = document.getElementById('valorContrib').value;
  const mes = document.getElementById('mesRef').value;
  const ano = document.getElementById('anoRef').value;
  const arquivo = document.getElementById('arquivoComp').files[0];

  if (!valor || parseFloat(valor) <= 0) {
    err.textContent = 'Informe um valor válido.'; err.classList.remove('hidden'); return;
  }
  err.classList.add('hidden');

  const all = JSON.parse(localStorage.getItem('amas-contrib') || '[]');
  all.push({
    cpf: user.cpf, nome: user.nome,
    mes, ano, valor: parseFloat(valor),
    arquivo: arquivo ? arquivo.name : null,
    statusPag: 'analise',
    data: new Date().toISOString(), msg: ''
  });
  localStorage.setItem('amas-contrib', JSON.stringify(all));

  // Atualiza status para analise
  const users = JSON.parse(localStorage.getItem('amas-users') || '[]');
  const idx = users.findIndex(u => u.cpf === user.cpf);
  if (idx !== -1 && users[idx].status === 'pendente') { users[idx].status = 'analise'; localStorage.setItem('amas-users', JSON.stringify(users)); }

  ok.textContent = 'Comprovante enviado! Aguarde a análise do administrador.';
  ok.classList.remove('hidden');
  this.reset();
  setTimeout(() => ok.classList.add('hidden'), 4000);
});

// --- HISTÓRICO ---
function renderHistorico() {
  const tbody = document.getElementById('tbodyHistorico');
  tbody.innerHTML = '';
  const contribs = getContribs();
  if (!contribs.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:2rem">Nenhuma contribuição registrada.</td></tr>';
    return;
  }
  const labelMap = {analise:'badge-analise',aprovado:'badge-aprovado',revisao:'badge-revisao',recusado:'badge-recusado'};
  const nameMap = {analise:'Em análise',aprovado:'Aprovado',revisao:'Revisão solicitada',recusado:'Recusado'};
  [...contribs].reverse().forEach(c => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${c.mes}/${c.ano}</td>
      <td>R$ ${parseFloat(c.valor).toFixed(2).replace('.',',')}</td>
      <td>${new Date(c.data).toLocaleDateString('pt-BR')}</td>
      <td><span class="badge ${labelMap[c.statusPag]||''}">${nameMap[c.statusPag]||c.statusPag}</span></td>
      <td style="font-size:0.78rem;color:var(--text-muted)">${c.msg||'–'}</td>`;
    tbody.appendChild(tr);
  });
}

// --- INIT ---
renderInicio();