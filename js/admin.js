// admin.js

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
const logged = JSON.parse(localStorage.getItem('amas-logged') || 'null');
if (!logged || logged.tipo !== 'admin') window.location.href = 'login.html';
else document.getElementById('sidebarName').textContent = logged.nome;

// --- DATA/HORA ---
function updateDateTime() {
  const now = new Date();
  document.getElementById('dateTime').textContent = now.toLocaleString('pt-BR');
}
updateDateTime(); setInterval(updateDateTime, 1000);

// --- SIDEBAR ---
document.getElementById('hamburger').addEventListener('click', () => document.getElementById('sidebar').classList.toggle('open'));
document.getElementById('sidebarClose').addEventListener('click', () => document.getElementById('sidebar').classList.remove('open'));

// --- SECTIONS ---
function showSection(name, el) {
  document.querySelectorAll('.dash-section').forEach(s => s.classList.remove('active'));
  document.getElementById('sec-' + name).classList.add('active');
  document.querySelectorAll('.sn-item').forEach(i => i.classList.remove('active'));
  if (el) el.classList.add('active');
  document.getElementById('pageTitle').textContent = {
    dashboard:'Dashboard', associados:'Associados', cadastrar:'Cadastrar Associado',
    contribuicoes:'Contribuições', relatorios:'Relatórios'
  }[name] || name;
  if (name === 'associados') renderTable();
  if (name === 'contribuicoes') renderContrib();
  if (name === 'relatorios') renderRelatorios();
  if (name === 'dashboard') renderDashboard();
}

// --- UTILS ---
function getUsers() { return JSON.parse(localStorage.getItem('amas-users') || '[]'); }
function saveUsers(u) { localStorage.setItem('amas-users', JSON.stringify(u)); }
function getAssociados() { return getUsers().filter(u => u.tipo === 'associado'); }
function getContrib() { return JSON.parse(localStorage.getItem('amas-contrib') || '[]'); }
function saveContrib(c) { localStorage.setItem('amas-contrib', JSON.stringify(c)); }

function statusBadge(s) {
  const map = {
    regular:'badge-regular', inadimplente:'badge-inadimplente', pendente:'badge-pendente',
    analise:'badge-analise', aprovado:'badge-aprovado', revisao:'badge-revisao', recusado:'badge-recusado'
  };
  const label = {
    regular:'Regular', inadimplente:'Inadimplente', pendente:'Pendente',
    analise:'Em análise', aprovado:'Aprovado', revisao:'Revisão', recusado:'Recusado'
  };
  return `<span class="badge ${map[s]||''}">${label[s]||s}</span>`;
}

// --- DASHBOARD ---
let chartPizza, chartBarras;
function renderDashboard() {
  const assoc = getAssociados();
  const contrib = getContrib();
  document.getElementById('statTotal').textContent = assoc.length;
  document.getElementById('statReg').textContent = assoc.filter(a=>a.status==='regular').length;
  document.getElementById('statInad').textContent = assoc.filter(a=>a.status==='inadimplente').length;
  const totalArrecadado = contrib.filter(c=>c.statusPag==='aprovado').reduce((s,c)=>s+parseFloat(c.valor||0),0);
  document.getElementById('statArrecadado').textContent = 'R$ ' + totalArrecadado.toFixed(2).replace('.',',');

  const ctxP = document.getElementById('chartPizza')?.getContext('2d');
  const ctxB = document.getElementById('chartBarras')?.getContext('2d');

  const statusCounts = {};
  assoc.forEach(a => { statusCounts[a.status] = (statusCounts[a.status]||0)+1; });

  if (chartPizza) chartPizza.destroy();
  if (ctxP) chartPizza = new Chart(ctxP, {
    type: 'doughnut',
    data: {
      labels: Object.keys(statusCounts).map(s=>({regular:'Regular',inadimplente:'Inadimplente',pendente:'Pendente',analise:'Em análise'}[s]||s)),
      datasets:[{ data: Object.values(statusCounts),
        backgroundColor:['#22c55e','#ef4444','#f59e0b','#3b82f6'], borderWidth: 2 }]
    },
    options:{ plugins:{ legend:{ position:'bottom' } } }
  });

  const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const arrecadPorMes = Array(12).fill(0);
  contrib.filter(c=>c.statusPag==='aprovado').forEach(c => {
    const m = new Date(c.data).getMonth();
    arrecadPorMes[m] += parseFloat(c.valor||0);
  });

  if (chartBarras) chartBarras.destroy();
  if (ctxB) chartBarras = new Chart(ctxB, {
    type: 'bar',
    data: {
      labels: meses,
      datasets:[{ label:'Arrecadado (R$)', data: arrecadPorMes,
        backgroundColor:'rgba(77,83,160,0.7)', borderColor:'#4D53A0', borderWidth:1 }]
    },
    options:{ scales:{ y:{ beginAtZero:true } }, plugins:{ legend:{ display:false } } }
  });
}

// --- TABELA ASSOCIADOS ---
function renderTable(filtro='') {
  const tbody = document.getElementById('tbodyAssociados');
  tbody.innerHTML = '';
  const assoc = getAssociados().filter(a =>
    a.nome.toLowerCase().includes(filtro.toLowerCase()) || a.cpf.includes(filtro)
  );
  if (!assoc.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:2rem">Nenhum associado encontrado.</td></tr>';
    return;
  }
  assoc.forEach(a => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${a.matricula||'–'}</td>
      <td>${a.nome}</td>
      <td>${a.cpf}</td>
      <td>${statusBadge(a.status)}</td>
      <td>${a.telefone||'–'}</td>
      <td>
        <button class="btn-action btn-edit" onclick="editarAssociado('${a.cpf}')"><i class="fas fa-edit"></i> Editar</button>
        <button class="btn-action btn-delete" onclick="excluirAssociado('${a.cpf}')"><i class="fas fa-trash"></i> Excluir</button>
      </td>`;
    tbody.appendChild(tr);
  });
}

document.getElementById('buscaCPF')?.addEventListener('input', function() { renderTable(this.value); });

// --- CADASTRAR / EDITAR ---
let editando = false;

document.getElementById('formCadastro')?.addEventListener('submit', function(e) {
  e.preventDefault();
  const err = document.getElementById('cadError');
  const users = getUsers();
  const cpf = document.getElementById('cCPF').value;
  const id = document.getElementById('editId').value;

  if (!editando) {
    if (users.find(u => u.cpf === cpf)) {
      err.textContent = 'CPF já cadastrado no sistema!';
      err.classList.remove('hidden');
      return;
    }
  }
  err.classList.add('hidden');

  const assocData = {
    tipo: 'associado',
    nome: document.getElementById('cNome').value,
    cpf, nascimento: document.getElementById('cNasc').value,
    telefone: document.getElementById('cTel').value,
    email: document.getElementById('cEmail').value,
    profissao: document.getElementById('cProf').value,
    endereco: document.getElementById('cEnd').value,
    entrada: document.getElementById('cEntrada').value || new Date().toISOString().split('T')[0],
    status: document.getElementById('cStatus').value,
    senha: document.getElementById('cSenha').value || '123456',
    primeiroLogin: !editando,
    matricula: 'AMAS' + String(Date.now()).slice(-4),
    id: editando ? parseInt(id) : Date.now()
  };

  if (editando) {
    const idx = users.findIndex(u => u.id === parseInt(id));
    if (idx !== -1) { Object.assign(users[idx], assocData); }
  } else {
    users.push(assocData);
  }

  saveUsers(users);
  this.reset();
  document.getElementById('formTitle').innerHTML = '<i class="fas fa-user-plus"></i> Cadastrar Associado';
  editando = false;
  alert(editando ? 'Associado atualizado!' : 'Associado cadastrado com sucesso!');
  showSection('associados', document.querySelector('.sn-item'));
});

function editarAssociado(cpf) {
  const users = getUsers();
  const a = users.find(u => u.cpf === cpf);
  if (!a) return;
  editando = true;
  document.getElementById('editId').value = a.id;
  document.getElementById('cNome').value = a.nome;
  document.getElementById('cCPF').value = a.cpf;
  document.getElementById('cNasc').value = a.nascimento||'';
  document.getElementById('cTel').value = a.telefone||'';
  document.getElementById('cEmail').value = a.email||'';
  document.getElementById('cProf').value = a.profissao||'';
  document.getElementById('cEnd').value = a.endereco||'';
  document.getElementById('cEntrada').value = a.entrada||'';
  document.getElementById('cStatus').value = a.status||'regular';
  document.getElementById('cSenha').value = '';
  document.getElementById('formTitle').innerHTML = '<i class="fas fa-edit"></i> Editar Associado';
  showSection('cadastrar', null);
}

function excluirAssociado(cpf) {
  if (!confirm('Tem certeza que deseja excluir este associado?')) return;
  const users = getUsers().filter(u => !(u.cpf === cpf && u.tipo === 'associado'));
  saveUsers(users);
  renderTable();
}

function cancelEdit() {
  editando = false;
  document.getElementById('formCadastro')?.reset();
  document.getElementById('formTitle').innerHTML = '<i class="fas fa-user-plus"></i> Cadastrar Associado';
}

// --- CONTRIBUIÇÕES ---
let contribIdRevisao = null;

function renderContrib() {
  const tbody = document.getElementById('tbodyContrib');
  tbody.innerHTML = '';
  const contribs = getContrib();
  if (!contribs.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:2rem">Nenhum comprovante enviado ainda.</td></tr>';
    return;
  }
  contribs.forEach((c, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${c.nome||c.cpf}</td>
      <td>${c.mes}/${c.ano}</td>
      <td>R$ ${parseFloat(c.valor).toFixed(2).replace('.',',')}</td>
      <td>${statusBadge(c.statusPag)}</td>
      <td><span style="color:var(--text-muted);font-size:0.75rem">${c.arquivo||'Sem arquivo'}</span></td>
      <td>
        ${c.statusPag==='analise'?`
          <button class="btn-action btn-approve" onclick="aprovarContrib(${idx})"><i class="fas fa-check"></i></button>
          <button class="btn-action btn-review" onclick="abrirRevisao(${idx})"><i class="fas fa-comment"></i></button>
          <button class="btn-action btn-reject" onclick="rejeitarContrib(${idx})"><i class="fas fa-times"></i></button>
        `:'<span style="color:var(--text-muted);font-size:0.75rem">–</span>'}
      </td>`;
    tbody.appendChild(tr);
  });
}

function aprovarContrib(idx) {
  const contribs = getContrib();
  contribs[idx].statusPag = 'aprovado';
  contribs[idx].msg = '';
  saveContrib(contribs);
  // Atualiza status do associado
  const users = getUsers();
  const u = users.find(u => u.cpf === contribs[idx].cpf);
  if (u) { u.status = 'regular'; saveUsers(users); }
  renderContrib();
}

function rejeitarContrib(idx) {
  const contribs = getContrib();
  contribs[idx].statusPag = 'recusado';
  saveContrib(contribs);
  renderContrib();
}

function abrirRevisao(idx) {
  contribIdRevisao = idx;
  document.getElementById('modalRevisao').classList.remove('hidden');
}

function fecharModal() {
  document.getElementById('modalRevisao')?.classList.add('hidden');
  contribIdRevisao = null;
}

function enviarRevisao() {
  const msg = document.getElementById('msgRevisao').value;
  if (!msg.trim()) { alert('Escreva a mensagem de revisão.'); return; }
  const contribs = getContrib();
  contribs[contribIdRevisao].statusPag = 'revisao';
  contribs[contribIdRevisao].msg = msg;
  saveContrib(contribs);
  fecharModal();
  renderContrib();
}

// --- RELATÓRIOS ---
let chartRel;
function renderRelatorios() {
  const assoc = getAssociados();
  document.getElementById('rTotal').textContent = assoc.length;
  document.getElementById('rReg').textContent = assoc.filter(a=>a.status==='regular').length;
  document.getElementById('rInad').textContent = assoc.filter(a=>a.status==='inadimplente').length;
  document.getElementById('rAnal').textContent = assoc.filter(a=>a.status==='analise').length;

  const statusCounts = {};
  assoc.forEach(a => { statusCounts[a.status] = (statusCounts[a.status]||0)+1; });
  const labelMap = {regular:'Regular',inadimplente:'Inadimplente',pendente:'Pendente',analise:'Em análise'};
  const colorMap = {regular:'#22c55e',inadimplente:'#ef4444',pendente:'#f59e0b',analise:'#3b82f6'};

  const ctxR = document.getElementById('chartRelatorio')?.getContext('2d');
  if (chartRel) chartRel.destroy();
  if (ctxR) chartRel = new Chart(ctxR, {
    type: 'bar',
    data: {
      labels: Object.keys(statusCounts).map(s=>labelMap[s]||s),
      datasets:[{ label:'Associados', data: Object.values(statusCounts),
        backgroundColor: Object.keys(statusCounts).map(s=>colorMap[s]||'#4D53A0') }]
    },
    options:{ plugins:{ legend:{ display:false } }, scales:{ y:{ beginAtZero:true, ticks:{ stepSize:1 } } } }
  });
}

// --- INIT ---
renderDashboard();