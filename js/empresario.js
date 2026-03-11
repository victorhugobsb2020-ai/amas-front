// empresario.js

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
if (!logged || logged.tipo !== 'empresario') window.location.href = 'login.html';
document.getElementById('sidebarName').textContent = logged.nome;

// --- DATA/HORA ---
function updateDT() {
  document.getElementById('dateTime').textContent = new Date().toLocaleString('pt-BR');
}
updateDT(); setInterval(updateDT, 1000);

// --- SIDEBAR ---
document.getElementById('hamburger').addEventListener('click', () => document.getElementById('sidebar').classList.toggle('open'));
document.getElementById('sidebarClose').addEventListener('click', () => document.getElementById('sidebar').classList.remove('open'));

// --- SECTIONS ---
function showSection(name, el) {
  document.querySelectorAll('.dash-section').forEach(s => s.classList.remove('active'));
  document.getElementById('sec-' + name).classList.add('active');
  document.querySelectorAll('.sn-item').forEach(i => i.classList.remove('active'));
  if (el) el.classList.add('active');
  document.getElementById('pageTitle').textContent = { consulta:'Consultar CPF', historico:'Histórico' }[name] || name;
  if (name === 'historico') renderHistorico();
}

// --- MÁSCARA CPF ---
document.getElementById('cpfConsulta')?.addEventListener('input', function() {
  let v = this.value.replace(/\D/g,'');
  v = v.replace(/(\d{3})(\d)/,'$1.$2');
  v = v.replace(/(\d{3})(\d)/,'$1.$2');
  v = v.replace(/(\d{3})(\d{1,2})$/,'$1-$2');
  this.value = v;
});

// Enter para consultar
document.getElementById('cpfConsulta')?.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') consultarCPF();
});

// --- CONSULTAR ---
function consultarCPF() {
  const cpf = document.getElementById('cpfConsulta').value.trim();
  const res = document.getElementById('resultadoConsulta');

  if (cpf.length < 14) {
    res.className = 'resultado nok';
    res.innerHTML = '<h4><i class="fas fa-times-circle"></i> CPF inválido</h4><p>Digite o CPF completo no formato 000.000.000-00</p>';
    res.classList.remove('hidden');
    return;
  }

  const users = JSON.parse(localStorage.getItem('amas-users') || '[]');
  const assoc = users.find(u => u.cpf === cpf && u.tipo === 'associado');
  const agora = new Date().toLocaleString('pt-BR');

  if (!assoc) {
    res.className = 'resultado nok';
    res.innerHTML = `<h4><i class="fas fa-user-times"></i> Associado não encontrado</h4>
      <p>CPF <strong>${cpf}</strong> não está cadastrado na AMAS.</p>
      <p>Consulta realizada em: ${agora}</p>
      <span class="benef benef-nao"><i class="fas fa-times"></i> Benefício não liberado</span>`;
    res.classList.remove('hidden');
    salvarHistorico(cpf, 'Não encontrado', 'Não encontrado', false, agora);
    return;
  }

  const regular = assoc.status === 'regular';
  const labelMap = {regular:'Regular',inadimplente:'Inadimplente',pendente:'Pendente',analise:'Em análise'};
  res.className = 'resultado ' + (regular ? 'ok' : 'nok');
  res.innerHTML = `
    <h4><i class="fas fa-${regular?'check-circle':'exclamation-circle'}"></i> ${regular?'Associado Regular':'Associado Irregular'}</h4>
    <p><strong>Nome:</strong> ${assoc.nome}</p>
    <p><strong>CPF:</strong> ${assoc.cpf}</p>
    <p><strong>Situação:</strong> ${labelMap[assoc.status]||assoc.status}</p>
    <p><strong>Matrícula:</strong> ${assoc.matricula||'–'}</p>
    <p><strong>Consulta realizada em:</strong> ${agora}</p>
    <span class="benef ${regular?'benef-sim':'benef-nao'}">
      <i class="fas fa-${regular?'check':'times'}"></i> Benefício ${regular?'Liberado':'Não liberado'}
    </span>`;
  res.classList.remove('hidden');
  salvarHistorico(cpf, assoc.nome, labelMap[assoc.status]||assoc.status, regular, agora);
}

function salvarHistorico(cpf, nome, status, benef, dt) {
  const h = JSON.parse(localStorage.getItem('amas-hist-emp') || '[]');
  h.unshift({ cpf, nome, status, benef, dt, empCPF: logged.cpf });
  localStorage.setItem('amas-hist-emp', JSON.stringify(h.slice(0,100)));
}

// --- HISTÓRICO ---
function renderHistorico() {
  const tbody = document.getElementById('tbodyHistEmp');
  tbody.innerHTML = '';
  const h = JSON.parse(localStorage.getItem('amas-hist-emp') || '[]').filter(x => x.empCPF === logged.cpf);
  if (!h.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:2rem">Nenhuma consulta realizada.</td></tr>';
    return;
  }
  h.forEach(c => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-size:0.78rem">${c.dt}</td>
      <td>${c.cpf}</td>
      <td>${c.nome}</td>
      <td><span class="badge ${c.status==='Regular'?'badge-regular':'badge-inadimplente'}">${c.status}</span></td>
      <td><span class="badge ${c.benef?'badge-aprovado':'badge-recusado'}">${c.benef?'Sim':'Não'}</span></td>`;
    tbody.appendChild(tr);
  });
}