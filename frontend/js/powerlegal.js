import { initHeroCarousel } from './carousel.js';
import { ContactAPI } from './api.js';

document.addEventListener('DOMContentLoaded', () => {
  initHeroCarousel();
  initMobileMenu();
  initCounters();
  initTestimonials();
  initChatbot();
  initNewsletter();
});

function initMobileMenu() {
  const toggle = document.getElementById('pl-menu-toggle');
  const nav = document.getElementById('pl-mobile-nav');
  toggle?.addEventListener('click', () => nav?.classList.toggle('open'));
  nav?.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => nav.classList.remove('open'));
  });
}

function initCounters() {
  const counters = document.querySelectorAll('[data-count]');
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseInt(el.dataset.count, 10);
        const duration = 2000;
        const start = performance.now();
        const animate = (now) => {
          const progress = Math.min((now - start) / duration, 1);
          el.textContent = Math.floor(progress * target);
          if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
        observer.unobserve(el);
      });
    },
    { threshold: 0.3 }
  );
  counters.forEach((c) => observer.observe(c));
}

function initTestimonials() {
  const quotes = document.querySelectorAll('.pl-testimonial-item');
  const dots = document.querySelectorAll('.pl-testimonial-dots button');
  if (!quotes.length) return;

  let current = 0;
  function show(i) {
    current = i;
    quotes.forEach((q, idx) => q.classList.toggle('hidden', idx !== current));
    dots.forEach((d, idx) => d.classList.toggle('active', idx === current));
  }

  dots.forEach((dot, i) => dot.addEventListener('click', () => show(i)));
  setInterval(() => show((current + 1) % quotes.length), 8000);
}

function initChatbot() {
  const fab = document.getElementById('pl-chat-fab');
  const modal = document.getElementById('pl-chat-modal');
  const close = document.getElementById('pl-chat-close');
  const body = document.getElementById('pl-chat-body');
  const input = document.getElementById('pl-chat-input');
  const send = document.getElementById('pl-chat-send');

  fab?.addEventListener('click', () => modal?.classList.add('open'));
  close?.addEventListener('click', () => modal?.classList.remove('open'));

  function addMsg(text, type) {
    const div = document.createElement('div');
    div.style.cssText = `max-width:85%;padding:0.6rem 0.9rem;border-radius:10px;margin-bottom:0.5rem;font-size:0.88rem;${
      type === 'user' ? 'background:#132a45;color:#fff;margin-left:auto;' : 'background:#e2e8f0;'
    }`;
    div.textContent = text;
    body?.appendChild(div);
    body.scrollTop = body.scrollHeight;
  }

  function sendMsg() {
    const text = input?.value.trim();
    if (!text) return;
    addMsg(text, 'user');
    input.value = '';
    setTimeout(() => {
      addMsg(
        'Obrigado pela mensagem! Use "Consulta Gratuita" ou acesse a Área do Cliente para iniciar seu procedimento na ARBITRAJUS.',
        'bot'
      );
    }, 500);
  }

  send?.addEventListener('click', sendMsg);
  input?.addEventListener('keypress', (e) => e.key === 'Enter' && sendMsg());
}

function initNewsletter() {
  const form = document.getElementById('newsletter-form');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = form.querySelector('input[type="email"]')?.value;
    if (!email) return;
    try {
      await ContactAPI.send({
        nome: 'Newsletter',
        email,
        mensagem: 'Inscrição na newsletter ARBITRAJUS',
        origem: 'newsletter',
      });
      alert('Inscrição realizada com sucesso!');
      form.reset();
    } catch {
      alert('Obrigado! Você receberá nossas novidades em breve.');
      form.reset();
    }
  });
}
