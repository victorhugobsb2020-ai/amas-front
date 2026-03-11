// login.js

// Aplica tema salvo
const saved = localStorage.getItem('amas-theme') || 'light';
document.documentElement.setAttribute('data-theme', saved);
const themeIcon = document.getElementById('themeIcon');
if (themeIcon) themeIcon.className = saved === 'dark' ? 'fas fa-sun' : 'fas fa-moon';

document.getElementById('themeToggle')?.addEventListener('click', () => {
  const cur = document.documentElement.getAttribute('data-theme');
  const next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('amas-theme', next);
  document.getElementById('themeIcon').className = next === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
});

// --- DADOS PADRÃO ---
function initData() {
  if (!localStorage.getItem('amas-users')) {
    const users = [
      { id: 1, tipo: 'admin', cpf: '000.000.000-00', senha: 'admin123', nome: 'Administrador AMAS', primeiroLogin: false },
      { id: 2, tipo: 'associado', cpf: '111.111.111-11', senha: '123456', nome: 'João da Silva', primeiroLogin: true,
        nascimento:'1990-05-10', telefone:'(61) 98888-1111', email:'joao@email.com',
        profissao:'Comerciante', endereco:'Rua das Acácias, 100 – São Sebastião',
        matricula:'AMAS001', entrada:'2024-01-10', status:'regular' },
      { id: 3, tipo: 'empresario', cpf: '222.222.222-22', senha: 'empresa123', nome: 'Maria Souza – Mercearia São Sebastião', primeiroLogin: false }
    ];
    localStorage.setItem('amas-users', JSON.stringify(users));
  }
}
initData();

// --- TABS ---
let perfilAtual = 'admin';

function setTab(perfil, btn) {
  perfilAtual = perfil;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const info = document.getElementById('loginInfo');
  const msgs = {
    admin: 'Acesso restrito a administradores do sistema.',
    associado: 'Entre com seu CPF e senha de associado.',
    empresario: 'Acesso para empresários parceiros da AMAS.'
  };
  info.textContent = msgs[perfil];
  info.style.display = 'block';
}

// Máscara CPF
document.getElementById('inputCPF')?.addEventListener('input', function() {
  let v = this.value.replace(/\D/g,'');
  v = v.replace(/(\d{3})(\d)/,'$1.$2');
  v = v.replace(/(\d{3})(\d)/,'$1.$2');
  v = v.replace(/(\d{3})(\d{1,2})$/,'$1-$2');
  this.value = v;
});

// Mostrar/ocultar senha
function togglePass() {
  const input = document.getElementById('inputSenha');
  const icon = document.getElementById('eyeIcon');
  if (input.type === 'password') {
    input.type = 'text'; icon.className = 'fas fa-eye-slash';
  } else {
    input.type = 'password'; icon.className = 'fas fa-eye';
  }
}

// --- SUBMIT ---
document.getElementById('loginForm')?.addEventListener('submit', function(e) {
  e.preventDefault();
  const cpf = document.getElementById('inputCPF').value.trim();
  const senha = document.getElementById('inputSenha').value.trim();
  const err = document.getElementById('loginError');

  const users = JSON.parse(localStorage.getItem('amas-users') || '[]');
  const user = users.find(u => u.cpf === cpf && u.senha === senha && u.tipo === perfilAtual);

  if (!user) {
    err.textContent = 'CPF ou senha incorretos. Verifique seus dados e tente novamente.';
    err.classList.remove('hidden');
    return;
  }

  err.classList.add('hidden');
  // Salva usuário logado
  localStorage.setItem('amas-logged', JSON.stringify(user));

  // Redireciona
  const rotas = { admin: 'admin.html', associado: 'associado.html', empresario: 'empresario.html' };
  window.location.href = rotas[user.tipo];
});