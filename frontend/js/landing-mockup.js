import { initHeroCarousel } from './carousel.js';

document.addEventListener('DOMContentLoaded', () => {
  initHeroCarousel();
  initMobileMenu();
  initChatbot();
  applyRoleFromUrl();
});

function initMobileMenu() {
  const btn = document.getElementById('mobile-toggle');
  const menu = document.getElementById('mobile-menu');
  btn?.addEventListener('click', () => menu?.classList.toggle('open'));
  menu?.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => menu.classList.remove('open'));
  });
}

function initChatbot() {
  const fab = document.getElementById('chat-fab');
  const modal = document.getElementById('chat-modal');
  const close = document.getElementById('chat-close');
  const body = document.getElementById('chat-body');
  const input = document.getElementById('chat-input');
  const send = document.getElementById('chat-send');

  fab?.addEventListener('click', () => modal?.classList.add('open'));
  close?.addEventListener('click', () => modal?.classList.remove('open'));

  function addMsg(text, type) {
    const div = document.createElement('div');
    div.className = `chat-msg ${type}`;
    div.textContent = text;
    body?.appendChild(div);
    body.scrollTop = body.scrollHeight;
  }

  function respond(msg) {
    const m = msg.toLowerCase();
    if (m.includes('conflito') || m.includes('cadastr')) {
      return 'Clique em "Resolver um Conflito" ou "CADASTRAR MEU CASO" para iniciar seu procedimento na plataforma.';
    }
    if (m.includes('árbitro') || m.includes('arbitro') || m.includes('mediador')) {
      return 'Para atuar como árbitro, use o botão "Atuar como Árbitro" ou "TORNAR-SE ÁRBITRO" no site.';
    }
    if (m.includes('empresa') || m.includes('quem')) {
      return 'Atendemos empresas, imobiliárias, instituições financeiras, advogados e pessoas físicas.';
    }
    return 'A ARBITRAJUS é a infraestrutura nacional de arbitragem e mediação digital. Pergunte sobre cadastro, árbitros ou como funciona.';
  }

  function sendMsg() {
    const text = input?.value.trim();
    if (!text) return;
    addMsg(text, 'user');
    input.value = '';
    setTimeout(() => addMsg(respond(text), 'bot'), 500);
  }

  send?.addEventListener('click', sendMsg);
  input?.addEventListener('keypress', (e) => e.key === 'Enter' && sendMsg());
}

function applyRoleFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const role = params.get('role');
  if (role) {
    document.querySelectorAll('a[href*="role=mediador"]').forEach((a) => {
      a.href = `/frontend/pages/login.html?tab=signup&role=${encodeURIComponent(role)}`;
    });
  }
}
