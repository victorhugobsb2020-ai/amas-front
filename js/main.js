// main.js – Site institucional

// --- DARK MODE ---
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');

function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('amas-theme', t);
  if (themeIcon) themeIcon.className = t === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

const saved = localStorage.getItem('amas-theme') || 'light';
applyTheme(saved);

if (themeToggle) themeToggle.addEventListener('click', () => {
  const cur = document.documentElement.getAttribute('data-theme');
  applyTheme(cur === 'dark' ? 'light' : 'dark');
});

// --- NAVBAR SCROLL ---
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 50);
  const st = document.getElementById('scrollTop');
  if (st) st.classList.toggle('show', window.scrollY > 300);
});

// --- MOBILE MENU ---
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));
  navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));
}

// --- SCROLL TO TOP ---
document.getElementById('scrollTop')?.addEventListener('click', () => window.scrollTo({top:0,behavior:'smooth'}));

// --- ACTIVE NAV LINK ---
const sections = document.querySelectorAll('section[id]');
const links = document.querySelectorAll('.nav-link');
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      links.forEach(l => l.classList.remove('active'));
      const link = document.querySelector(`.nav-link[href="#${e.target.id}"]`);
      if (link) link.classList.add('active');
    }
  });
}, { threshold: 0.4 });
sections.forEach(s => observer.observe(s));

// --- FORM ASSOCIAÇÃO ---
const formAssociacao = document.getElementById('formAssociacao');
const formSucesso = document.getElementById('formSucesso');

// Máscara CPF
document.getElementById('cpf')?.addEventListener('input', function() {
  let v = this.value.replace(/\D/g,'');
  v = v.replace(/(\d{3})(\d)/,'$1.$2');
  v = v.replace(/(\d{3})(\d)/,'$1.$2');
  v = v.replace(/(\d{3})(\d{1,2})$/,'$1-$2');
  this.value = v;
});

// Máscara Telefone
document.getElementById('telefone')?.addEventListener('input', function() {
  let v = this.value.replace(/\D/g,'');
  v = v.replace(/^(\d{2})(\d)/,'($1) $2');
  v = v.replace(/(\d{5})(\d)/,'$1-$2');
  this.value = v;
});

if (formAssociacao) {
  formAssociacao.addEventListener('submit', function(e) {
    e.preventDefault();
    const dados = {
      nome: document.getElementById('nome').value,
      cpf: document.getElementById('cpf').value,
      nascimento: document.getElementById('nascimento').value,
      telefone: document.getElementById('telefone').value,
      email: document.getElementById('email').value,
      profissao: document.getElementById('profissao').value,
      endereco: document.getElementById('endereco').value,
      motivo: document.getElementById('motivo').value,
      status: 'analise', data: new Date().toISOString()
    };

    // Salva solicitações pendentes
    const pending = JSON.parse(localStorage.getItem('amas-pending') || '[]');
    pending.push(dados);
    localStorage.setItem('amas-pending', JSON.stringify(pending));

    formAssociacao.classList.add('hidden');
    formSucesso.classList.remove('hidden');
  });
}

function resetForm() {
  formAssociacao?.classList.remove('hidden');
  formSucesso?.classList.add('hidden');
  formAssociacao?.reset();
}

// --- CONTATO FORM ---
document.getElementById('contatoForm')?.addEventListener('submit', function(e) {
  e.preventDefault();
  alert('Mensagem enviada com sucesso! Retornaremos em breve.');
  this.reset();
});