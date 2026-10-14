import { applyI18n, onLangChange } from './i18n.js';

const WELCOME_KEY = 'arbitrajus_welcome_seen';
const COOKIE_KEY = 'arbitrajus_cookie_consent';

function assetPath(relativeFromRoot) {
  const path = location.pathname.replace(/\\/g, '/');
  const inSubpage = path.includes('/pages/');
  return inSubpage ? `../../${relativeFromRoot}` : relativeFromRoot;
}

function injectWidgets() {
  const logo = assetPath('frontend/assets/img/logo-2.png');
  const heroImg = assetPath('frontend/assets/img/welcome/banner-curia.avif');
  const privacidade = assetPath('frontend/pages/privacidade.html');
  const abrirProc = assetPath('frontend/pages/abrir-procedimento.html');

  const container = document.createElement('div');
  container.id = 'arb-widgets-root';
  container.innerHTML = `
    <div class="arb-welcome-overlay" id="arb-welcome" role="dialog" aria-modal="true" aria-labelledby="arb-welcome-title">
      <div class="arb-welcome-banner">
        <button type="button" class="arb-welcome-close" id="arb-welcome-close" aria-label="Close" data-i18n-aria="welcome.closeAria">&times;</button>
        <div class="arb-welcome-grid">
          <div class="arb-welcome-visual">
            <img src="${heroImg}" alt="Online mediation and conciliation" class="arb-welcome-image" width="480" height="640" data-i18n-alt="welcome.imgAlt">
            <div class="arb-welcome-visual-overlay"></div>
            <span class="arb-welcome-badge">
              <img src="${logo}" alt="" class="arb-welcome-badge-logo" width="28" height="28">
              <span data-i18n="welcome.badge">ODR · Online dispute resolution</span>
            </span>
          </div>
          <div class="arb-welcome-content">
            <div class="arb-welcome-brand">
              <img src="${logo}" alt="" class="arb-welcome-brand-logo" width="72" height="72">
              <span class="arb-welcome-brand-name">
                <span class="arb-welcome-brand-arbitra">ARBITRA</span><span class="arb-welcome-brand-jus">JUS</span>
              </span>
            </div>
            <h2 id="arb-welcome-title" data-i18n="welcome.title">Conflict resolution with excellence and speed</h2>
            <p class="arb-welcome-lead" data-i18n="welcome.lead">
              National platform for 100% digital arbitration, mediation and conciliation.
              A secure environment to dialogue, negotiate and reach agreements with legal effect.
            </p>
            <ul class="arb-welcome-features">
              <li><i class="fas fa-bolt"></i> <span data-i18n="welcome.feature1">Fast, traceable proceedings</span></li>
              <li><i class="fas fa-user-shield"></i> <span data-i18n="welcome.feature2">Accredited professionals</span></li>
              <li><i class="fas fa-laptop"></i> <span data-i18n="welcome.feature3">Fully digital experience</span></li>
            </ul>
            <div class="arb-welcome-actions">
              <a href="#solucoes" class="btn-arb btn-arb-primary" id="arb-welcome-cta" data-i18n="welcome.cta">Explore solutions</a>
              <a href="${abrirProc}" class="btn-arb btn-arb-white" data-i18n="welcome.openCase">Open a case</a>
            </div>
            <button type="button" class="arb-welcome-skip" id="arb-welcome-skip" data-i18n="welcome.skip">Continue browsing</button>
          </div>
        </div>
      </div>
    </div>

    <button type="button" class="arb-cookie-fab hidden" id="arb-cookie-fab" aria-label="Preferências de cookies">
      <i class="fas fa-cookie-bite"></i>
    </button>

    <div class="arb-cookie-overlay" id="arb-cookie-overlay" aria-hidden="true">
      <div
        class="arb-cookie-bar"
        id="arb-cookie-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="arb-cookie-title"
      >
        <div class="arb-cookie-bar-main" id="arb-cookie-main">
          <div class="arb-cookie-bar-text">
            <h3 id="arb-cookie-title">Privacidade e cookies</h3>
            <p>
              Utilizamos cookies para melhorar sua experiência, analisar o uso da plataforma e personalizar conteúdos.
              Consulte nossa <a href="${privacidade}">Política de Privacidade</a>.
            </p>
          </div>
          <div class="arb-cookie-bar-actions">
            <button type="button" class="arb-cookie-settings-btn" id="arb-cookie-toggle-settings">Configurações</button>
            <button type="button" class="arb-cookie-refuse" id="arb-cookie-refuse">Recusar</button>
            <button type="button" class="arb-cookie-accept" id="arb-cookie-accept">Aceitar</button>
          </div>
        </div>

        <div class="arb-cookie-settings" id="arb-cookie-settings">
          <div class="arb-cookie-toggle">
            <span>Essenciais<small>Necessários para o funcionamento do site</small></span>
            <div class="arb-cookie-switch">
              <input type="checkbox" id="cookie-essential" checked disabled>
              <label for="cookie-essential"></label>
            </div>
          </div>
          <div class="arb-cookie-toggle">
            <span>Analíticos<small>Estatísticas de uso anônimas</small></span>
            <div class="arb-cookie-switch">
              <input type="checkbox" id="cookie-analytics">
              <label for="cookie-analytics"></label>
            </div>
          </div>
          <div class="arb-cookie-toggle">
            <span>Marketing<small>Comunicações e conteúdos personalizados</small></span>
            <div class="arb-cookie-switch">
              <input type="checkbox" id="cookie-marketing">
              <label for="cookie-marketing"></label>
            </div>
          </div>
          <div class="arb-cookie-settings-actions">
            <button type="button" class="arb-cookie-save" id="arb-cookie-save">Salvar preferências</button>
          </div>
        </div>

        <button type="button" class="arb-cookie-close" id="arb-cookie-close" aria-label="Fechar preferências">&times;</button>
      </div>
    </div>

    <div class="arb-cookie-toast" id="arb-cookie-toast" role="status" aria-live="polite">
      <i class="fas fa-circle-check"></i>
      Configurações salvas com sucesso
    </div>

    <button type="button" class="arb-chat-fab hidden" id="arb-chat-fab" aria-label="Fale conosco">
      <i class="fas fa-comments"></i>
    </button>

    <div class="arb-chat-panel" id="arb-chat-panel" role="dialog" aria-label="Contato">
      <div class="arb-chat-header">
        <h3><i class="fas fa-headset"></i> Fale conosco</h3>
        <button type="button" class="arb-chat-close" id="arb-chat-close" aria-label="Fechar">&times;</button>
      </div>
      <div class="arb-chat-body">
        <div id="arb-chat-form-wrap">
          <p class="arb-chat-welcome"><i class="fas fa-hand-sparkles"></i> Seja bem vindo à ARBITRAJUS!</p>
          <p>Tire dúvidas sobre arbitragem, mediação ou abertura de procedimentos. Responderemos em breve.</p>
          <form class="arb-chat-form" id="arb-chat-form">
            <label for="arb-chat-nome">Nome</label>
            <input id="arb-chat-nome" name="nome" required autocomplete="name" placeholder="Seu nome">
            <label for="arb-chat-email">E-mail</label>
            <input id="arb-chat-email" name="email" type="email" required autocomplete="email" placeholder="seu@email.com">
            <label for="arb-chat-msg">Mensagem</label>
            <textarea id="arb-chat-msg" name="mensagem" required placeholder="Como podemos ajudar?"></textarea>
            <button type="submit" class="arb-chat-submit" id="arb-chat-submit">
              <i class="fas fa-paper-plane"></i> Enviar mensagem
            </button>
          </form>
        </div>
        <div class="arb-chat-success" id="arb-chat-success" hidden>
          <i class="fas fa-circle-check"></i>
          <p><strong>Mensagem enviada!</strong><br>Em breve nossa equipe entrará em contato.</p>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(container);
  applyI18n(container);
  onLangChange(() => applyI18n(container));
}

function getCookieConsent() {
  try {
    return JSON.parse(localStorage.getItem(COOKIE_KEY) || 'null');
  } catch {
    return null;
  }
}

function saveCookieConsent(consent) {
  localStorage.setItem(COOKIE_KEY, JSON.stringify({ ...consent, savedAt: new Date().toISOString() }));
}

function showCookieToast() {
  const toast = document.getElementById('arb-cookie-toast');
  toast?.classList.add('show');
  setTimeout(() => toast?.classList.remove('show'), 3200);
}

function openCookieBanner({ required = false } = {}) {
  const overlay = document.getElementById('arb-cookie-overlay');
  if (!overlay) return;

  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  overlay.classList.toggle('required', required);
  document.getElementById('arb-cookie-close')?.classList.toggle('hidden', required);

  if (required) {
    document.body.style.overflow = 'hidden';
  }

  document.getElementById('arb-chat-panel')?.classList.remove('open');
}

function closeCookieBanner() {
  const overlay = document.getElementById('arb-cookie-overlay');
  overlay?.classList.remove('open', 'required');
  overlay?.setAttribute('aria-hidden', 'true');
  document.getElementById('arb-cookie-settings')?.classList.remove('open');
  document.querySelector('.arb-cookie-bar-text')?.classList.remove('hidden');

  if (!document.getElementById('arb-welcome')?.classList.contains('open')) {
    document.body.style.overflow = '';
  }
}

function closeWelcome() {
  localStorage.setItem(WELCOME_KEY, '1');
  document.getElementById('arb-welcome')?.classList.remove('open');
  document.body.style.overflow = '';
  revealFloatingWidgets();
}

function revealFloatingWidgets() {
  document.getElementById('arb-cookie-fab')?.classList.remove('hidden');
  document.getElementById('arb-chat-fab')?.classList.remove('hidden');

  const consent = getCookieConsent();
  if (!consent) {
    setTimeout(() => openCookieBanner({ required: true }), 400);
  }
}

function initWelcome() {
  const overlay = document.getElementById('arb-welcome');
  if (!overlay) return;

  if (!localStorage.getItem(WELCOME_KEY)) {
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => overlay.classList.add('open'));
  } else {
    revealFloatingWidgets();
  }

  document.getElementById('arb-welcome-close')?.addEventListener('click', closeWelcome);
  document.getElementById('arb-welcome-skip')?.addEventListener('click', closeWelcome);
  document.getElementById('arb-welcome-cta')?.addEventListener('click', closeWelcome);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeWelcome();
  });
}

function initCookies() {
  const overlay = document.getElementById('arb-cookie-overlay');
  const panel = document.getElementById('arb-cookie-panel');
  const fab = document.getElementById('arb-cookie-fab');
  const settings = document.getElementById('arb-cookie-settings');
  const barText = () => document.querySelector('.arb-cookie-bar-text');
  const analytics = document.getElementById('cookie-analytics');
  const marketing = document.getElementById('cookie-marketing');

  const consent = getCookieConsent();
  if (consent) {
    analytics.checked = Boolean(consent.analytics);
    marketing.checked = Boolean(consent.marketing);
  }

  fab?.addEventListener('click', () => {
    openCookieBanner({ required: false });
  });

  document.getElementById('arb-cookie-close')?.addEventListener('click', () => {
    if (!overlay?.classList.contains('required')) {
      closeCookieBanner();
    }
  });

  overlay?.addEventListener('click', (e) => {
    if (e.target === overlay && !overlay.classList.contains('required')) {
      closeCookieBanner();
    }
  });

  panel?.addEventListener('click', (e) => e.stopPropagation());

  document.getElementById('arb-cookie-toggle-settings')?.addEventListener('click', () => {
    const opening = !settings?.classList.contains('open');
    settings?.classList.toggle('open', opening);
    barText()?.classList.toggle('hidden', opening);
  });

  document.getElementById('arb-cookie-accept')?.addEventListener('click', () => {
    saveCookieConsent({ essential: true, analytics: true, marketing: true, choice: 'accept' });
    closeCookieBanner();
    showCookieToast();
  });

  document.getElementById('arb-cookie-refuse')?.addEventListener('click', () => {
    saveCookieConsent({ essential: true, analytics: false, marketing: false, choice: 'refuse' });
    analytics.checked = false;
    marketing.checked = false;
    closeCookieBanner();
    showCookieToast();
  });

  document.getElementById('arb-cookie-save')?.addEventListener('click', () => {
    saveCookieConsent({
      essential: true,
      analytics: analytics.checked,
      marketing: marketing.checked,
      choice: 'custom',
    });
    closeCookieBanner();
    showCookieToast();
  });
}

async function initChat() {
  const panel = document.getElementById('arb-chat-panel');
  const fab = document.getElementById('arb-chat-fab');
  const form = document.getElementById('arb-chat-form');
  const formWrap = document.getElementById('arb-chat-form-wrap');
  const success = document.getElementById('arb-chat-success');
  const submitBtn = document.getElementById('arb-chat-submit');

  fab?.addEventListener('click', () => {
    panel?.classList.toggle('open');
    closeCookieBanner();
  });

  document.getElementById('arb-chat-close')?.addEventListener('click', () => {
    panel?.classList.remove('open');
  });

  document.addEventListener('click', (e) => {
    if (!panel?.classList.contains('open')) return;
    const inside = panel.contains(e.target) || fab?.contains(e.target);
    if (!inside) panel.classList.remove('open');
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    const fd = new FormData(form);

    try {
      const res = await fetch(`${window.location.origin}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: fd.get('nome'),
          email: fd.get('email'),
          mensagem: fd.get('mensagem'),
          origem: 'chat-widget',
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Erro ao enviar');
      }
      formWrap.hidden = true;
      success.hidden = false;
      setTimeout(() => {
        form.reset();
        formWrap.hidden = false;
        success.hidden = true;
        panel?.classList.remove('open');
        submitBtn.disabled = false;
      }, 3500);
    } catch (err) {
      alert(err.message || 'Não foi possível enviar. Tente novamente.');
      submitBtn.disabled = false;
    }
  });
}

function bindAccessibilityControls(fab, panel) {
  if (!fab || !panel) return;

  let fontStep = 0;

  fab.addEventListener('click', (e) => {
    e.preventDefault();
    const open = panel.hasAttribute('hidden');
    panel.toggleAttribute('hidden', !open);
    fab.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  document.addEventListener('click', (e) => {
    if (panel.hasAttribute('hidden')) return;
    const inside = panel.contains(e.target) || fab.contains(e.target);
    if (!inside) {
      panel.setAttribute('hidden', '');
      fab.setAttribute('aria-expanded', 'false');
    }
  });

  panel.querySelectorAll('[data-a11y]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const action = btn.getAttribute('data-a11y');
      const root = document.documentElement;

      if (action === 'font-up') {
        fontStep = Math.min(fontStep + 1, 2);
      } else if (action === 'font-down') {
        fontStep = Math.max(fontStep - 1, -2);
      } else if (action === 'contrast') {
        root.classList.toggle('arb-a11y-contrast');
      } else if (action === 'reset') {
        fontStep = 0;
        root.classList.remove('arb-a11y-contrast', 'arb-a11y-font-sm', 'arb-a11y-font-lg', 'arb-a11y-font-xl');
      }

      root.classList.remove('arb-a11y-font-sm', 'arb-a11y-font-lg', 'arb-a11y-font-xl');
      if (fontStep === -2 || fontStep === -1) root.classList.add('arb-a11y-font-sm');
      if (fontStep === 1) root.classList.add('arb-a11y-font-lg');
      if (fontStep === 2) root.classList.add('arb-a11y-font-xl');
    });
  });
}

function initAccessibility() {
  const headerFab = document.getElementById('arb-a11y-fab');
  const headerPanel = document.getElementById('arb-a11y-panel');

  if (headerFab && headerPanel) {
    bindAccessibilityControls(headerFab, headerPanel);
    return;
  }

  if (document.getElementById('arb-access-rail')) return;

  const rail = document.createElement('div');
  rail.id = 'arb-access-rail';
  rail.className = 'arb-access-rail';
  rail.innerHTML = `
    <a
      href="#"
      class="arb-a11y-fab arb-header-a11y-link"
      id="arb-a11y-fab"
      aria-label="Acessibilidade"
      aria-expanded="false"
      aria-controls="arb-a11y-panel"
    >
      <span class="arb-header-a11y-text">Acessibilidade</span>
      <img src="frontend/assets/img/acessibilidade-40-40.png" alt="" class="arb-header-a11y-icon" width="40" height="40">
    </a>
    <div class="arb-a11y-panel" id="arb-a11y-panel" role="dialog" aria-label="Acessibilidade" hidden>
      <p class="arb-a11y-panel-title">Acessibilidade</p>
      <button type="button" class="arb-a11y-action" data-a11y="font-up">
        <i class="fas fa-text-height" aria-hidden="true"></i> Aumentar texto
      </button>
      <button type="button" class="arb-a11y-action" data-a11y="font-down">
        <i class="fas fa-font" aria-hidden="true"></i> Diminuir texto
      </button>
      <button type="button" class="arb-a11y-action" data-a11y="contrast">
        <i class="fas fa-circle-half-stroke" aria-hidden="true"></i> Alto contraste
      </button>
      <button type="button" class="arb-a11y-action" data-a11y="reset">
        <i class="fas fa-rotate-left" aria-hidden="true"></i> Restaurar padrão
      </button>
    </div>
  `;
  document.body.appendChild(rail);
  bindAccessibilityControls(
    document.getElementById('arb-a11y-fab'),
    document.getElementById('arb-a11y-panel')
  );
}

document.addEventListener('DOMContentLoaded', () => {
  injectWidgets();
  initWelcome();
  initCookies();
  initChat();
  initAccessibility();
});
