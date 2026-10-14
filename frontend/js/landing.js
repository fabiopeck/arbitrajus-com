import { initHeroCarousel } from './carousel.js';
import { ContactAPI } from './api.js';
import { t, getLang } from './i18n.js';

document.addEventListener('DOMContentLoaded', () => {
  initHeroCarousel();
  initHeaderScroll();
  initMobileMenu();
  initReveal();
  initChatbot();
  initContactForm();
  initPlanButtons();
});

function initHeaderScroll() {
  const header = document.getElementById('header');
  window.addEventListener('scroll', () => {
    header?.classList.toggle('scrolled', window.scrollY > 50);
  });
}

function initMobileMenu() {
  const btn = document.getElementById('mobile-toggle');
  const menu = document.getElementById('mobile-menu');
  btn?.addEventListener('click', () => menu?.classList.toggle('open'));
  menu?.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => menu.classList.remove('open'));
  });
}

function initReveal() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );
  document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
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
    const lang = getLang();
    if (m.includes('arbitrajus') || m.includes('o que é') || m.includes('what is')) {
      return t('landing.chat.about', lang) || '';
    }
    if (m.includes('como funciona') || m.includes('how it works') || m.includes('how does')) {
      return t('landing.chat.how', lang) || '';
    }
    if (m.includes('plano') || m.includes('preço') || m.includes('price') || m.includes('plan')) {
      return t('landing.chat.plans', lang) || '';
    }
    if (m.includes('segur') || m.includes('legal') || m.includes('secur') || m.includes('faa') || m.includes('lgpd')) {
      return t('landing.security.reply', lang) || '';
    }
    return t('landing.chat.fallback', lang) || '';
  }

  function sendMsg() {
    const text = input?.value.trim();
    if (!text) return;
    addMsg(text, 'user');
    input.value = '';
    setTimeout(() => addMsg(respond(text), 'bot'), 600);
  }

  send?.addEventListener('click', sendMsg);
  input?.addEventListener('keypress', (e) => e.key === 'Enter' && sendMsg());
}

function initContactForm() {
  const form = document.getElementById('contact-form');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    try {
      await ContactAPI.send({
        nome: fd.get('nome'),
        email: fd.get('email'),
        telefone: fd.get('telefone'),
        mensagem: fd.get('mensagem'),
      });
      showToast('Mensagem enviada com sucesso!');
      form.reset();
    } catch (err) {
      showToast(err.message || 'Erro ao enviar');
    }
  });
}

function initPlanButtons() {
  document.querySelectorAll('[data-plan]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const plan = btn.dataset.plan;
      window.location.href = `/frontend/pages/login.html?plan=${plan}`;
    });
  });
}

function showToast(msg) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}
