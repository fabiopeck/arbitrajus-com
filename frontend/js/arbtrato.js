import { initLangSwitcher, onLangChange, applyI18n } from './i18n.js';

const STORAGE_KEY = 'arbitrajus_submissions';

function assetPath(relativeFromRoot) {
  const path = location.pathname.replace(/\\/g, '/');
  const inSubpage = path.includes('/pages/');
  return inSubpage ? `../../${relativeFromRoot}` : relativeFromRoot;
}

document.addEventListener('DOMContentLoaded', async () => {
  initTabTriggers();
  initHeader();
  initLangSwitcher();
  onLangChange(() => applyI18n(document));
  initSiteSearch();
  initSolutionsTabs();
  initSetores();
  initStats();
  initImpactAccordion();
  initProfessionalsFilter();
  initForms();
  initModals();
  await loadMockData();
});

function initTabTriggers() {
  document.querySelectorAll('[data-tab-trigger]').forEach((el) => {
    el.addEventListener('click', (e) => {
      const tab = el.dataset.tabTrigger;
      if (!tab || !el.getAttribute('href')?.startsWith('#')) return;
      e.preventDefault();
      document.getElementById('solucoes')?.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => {
        document.querySelector(`.arb-tab[data-tab="${tab}"]`)?.click();
      }, 450);
    });
  });
}

function initHeader() {
  const header = document.querySelector('.arb-header');
  const menuBtn = document.getElementById('arb-menu-btn');
  const drawer = document.getElementById('arb-mobile-drawer');
  const closeBtn = document.getElementById('arb-drawer-close');
  const backdrop = document.getElementById('arb-mega-backdrop');
  const megaItems = document.querySelectorAll('.arb-nav-item--mega');
  let closeTimer = null;

  const isDesktopNav = () => window.matchMedia('(min-width: 1200px)').matches;

  const syncHeaderHeight = () => {
    if (!header) return;
    document.documentElement.style.setProperty('--arb-header-h', `${header.offsetHeight}px`);
  };

  const cancelClose = () => {
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }
  };

  const scheduleClose = () => {
    cancelClose();
    closeTimer = setTimeout(closeMega, 120);
  };

  const closeMega = () => {
    cancelClose();
    megaItems.forEach((item) => {
      item.classList.remove('open');
      item.querySelector('.arb-nav-link')?.setAttribute('aria-expanded', 'false');
    });
    header?.classList.remove('mega-open');
    backdrop?.setAttribute('hidden', '');
    backdrop?.setAttribute('aria-hidden', 'true');
  };

  const openMega = (item) => {
    cancelClose();
    megaItems.forEach((i) => {
      i.classList.remove('open');
      i.querySelector('.arb-nav-link')?.setAttribute('aria-expanded', 'false');
    });
    item.classList.add('open');
    item.querySelector('.arb-nav-link')?.setAttribute('aria-expanded', 'true');
    header?.classList.add('mega-open');
    backdrop?.removeAttribute('hidden');
    backdrop?.setAttribute('aria-hidden', 'false');
  };

  syncHeaderHeight();
  requestAnimationFrame(syncHeaderHeight);
  window.addEventListener('resize', syncHeaderHeight);
  window.addEventListener('load', syncHeaderHeight);

  menuBtn?.addEventListener('click', () => {
    closeMega();
    drawer?.classList.add('open');
  });
  closeBtn?.addEventListener('click', () => drawer?.classList.remove('open'));
  drawer?.addEventListener('click', (e) => {
    if (e.target === drawer) drawer.classList.remove('open');
  });

  drawer?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => drawer?.classList.remove('open'));
  });

  megaItems.forEach((item) => {
    const btn = item.querySelector('.arb-nav-link');
    const mega = item.querySelector('.arb-mega');

    btn?.addEventListener('click', (e) => {
      if (isDesktopNav()) e.preventDefault();
    });

    [item, mega].forEach((el) => {
      el?.addEventListener('mouseenter', () => {
        if (!isDesktopNav()) return;
        openMega(item);
      });
      el?.addEventListener('mouseleave', () => {
        if (!isDesktopNav()) return;
        scheduleClose();
      });
    });

    btn?.addEventListener('focus', () => {
      if (!isDesktopNav()) return;
      openMega(item);
    });

    item.addEventListener('focusout', (e) => {
      if (!isDesktopNav()) return;
      if (item.contains(e.relatedTarget)) return;
      scheduleClose();
    });

    item.querySelectorAll('.arb-mega a').forEach((link) => {
      link.addEventListener('click', closeMega);
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeMega();
      drawer?.classList.remove('open');
    }
  });
}

function initSiteSearch() {
  const routes = {
    arbitragem: { href: '#solucoes', tab: 'arbitragem' },
    mediação: { href: '#solucoes', tab: 'mediacao' },
    mediacao: { href: '#solucoes', tab: 'mediacao' },
    conciliação: { href: '#solucoes', tab: 'conciliacao' },
    conciliacao: { href: '#solucoes', tab: 'conciliacao' },
    custas: { href: 'frontend/pages/custas.html' },
    notificação: { href: 'frontend/pages/notificacao.html' },
    notificacao: { href: 'frontend/pages/notificacao.html' },
    credenciamento: { href: 'frontend/pages/credenciamento.html' },
    tribunais: { href: '#instituicoes' },
    cejusc: { href: '#instituicoes' },
    integração: { href: '#instituicoes' },
    integracao: { href: '#instituicoes' },
    faq: { href: '#faq' },
    setores: { href: '#setores' },
    plataforma: { href: 'frontend/pages/login.html' },
    login: { href: 'frontend/pages/login.html' },
    entrar: { href: 'frontend/pages/login.html' },
    abrir: { href: 'frontend/pages/abrir-procedimento.html' },
    caso: { href: 'frontend/pages/abrir-procedimento.html' },
    procedimento: { href: 'frontend/pages/abrir-procedimento.html' },
    validador: { href: 'frontend/pages/validador.html' },
    árbitros: { href: '#solucoes', tab: 'arbitros' },
    arbitros: { href: '#solucoes', tab: 'arbitros' },
    empresa: { href: '#sobre' },
    sobre: { href: '#sobre' },
    contato: { href: '#contato' },
    equipe: { href: '#equipe' },
  };

  const resolveQuery = (raw) => {
    const q = raw.trim().toLowerCase();
    if (!q) return null;
    if (routes[q]) return routes[q];
    return Object.entries(routes).find(([key]) => q.includes(key))?.[1] || null;
  };

  const navigate = (raw) => {
    const hit = resolveQuery(raw);
    if (!hit) {
      document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    if (hit.href.startsWith('#')) {
      document.querySelector(hit.href)?.scrollIntoView({ behavior: 'smooth' });
      if (hit.tab) {
        setTimeout(() => {
          document.querySelector(`.arb-tab[data-tab="${hit.tab}"]`)?.click();
        }, 400);
      }
      return;
    }

    location.href = assetPath(hit.href);
  };

  const bindSearch = (form, input) => {
    if (!form || !input) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      navigate(input.value);
      document.getElementById('arb-mobile-drawer')?.classList.remove('open');
    });
  };

  bindSearch(
    document.getElementById('arb-header-search'),
    document.getElementById('arb-search-input')
  );
  bindSearch(
    document.getElementById('arb-mobile-search'),
    document.getElementById('arb-mobile-search-input')
  );
}

function initSolutionsTabs() {
  const tabs = document.querySelectorAll('.arb-tab');
  const panels = document.querySelectorAll('.arb-tab-panel');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const id = tab.dataset.tab;
      tabs.forEach((t) => t.classList.toggle('active', t === tab));
      panels.forEach((p) => p.classList.toggle('active', p.dataset.panel === id));
    });
  });
}

function initSetores() {
  document.querySelectorAll('.arb-setor-card').forEach((card) => {
    card.addEventListener('click', () => {
      const nome = card.dataset.setor || card.querySelector('.arb-setor-card-title span')?.textContent;
      sessionStorage.setItem('arbitrajus_setor', nome);
      window.location.href = assetPath('frontend/pages/login.html?tab=signup');
    });
  });
}

function initImpactAccordion() {
  const accordion = document.querySelector('.arb-impact-accordion');
  if (!accordion) return;

  accordion.querySelectorAll('.arb-impact-item').forEach((item) => {
    item.addEventListener('toggle', () => {
      if (!item.open) return;
      accordion.querySelectorAll('.arb-impact-item').forEach((other) => {
        if (other !== item) other.open = false;
      });
    });
  });
}

function initStats() {
  const els = document.querySelectorAll('[data-stat]');
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const end = parseInt(el.dataset.stat, 10);
        const suffix = el.dataset.suffix || '';
        const duration = 1800;
        const start = performance.now();
        const tick = (now) => {
          const p = Math.min((now - start) / duration, 1);
          const val = Math.floor(p * end);
          el.textContent = formatStat(val, suffix);
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        observer.unobserve(el);
      });
    },
    { threshold: 0.2 }
  );
  els.forEach((e) => observer.observe(e));
}

function formatStat(n, suffix) {
  if (suffix === 'M') return n >= 1000 ? `${(n / 1000).toFixed(0)}M+` : `${n}M+`;
  return n.toLocaleString('pt-BR') + suffix;
}

async function loadMockData() {
  try {
    const res = await fetch(assetPath('frontend/data/mock.json'));
    const data = await res.json();
    renderBlog(data.blog);
    window.__ARBITRAJUS_MOCK__ = data;
  } catch {
    /* fallback estático no HTML */
  }
}

function renderBlog(posts) {
  const grid = document.getElementById('blog-grid');
  if (!grid || !posts?.length) return;
  grid.innerHTML = posts
    .map(
      (p) => `
    <article class="arb-blog-card">
      <div class="arb-blog-thumb">
        <img src="${assetPath(p.imagem)}" alt="" width="800" height="534" loading="lazy" decoding="async">
      </div>
      <div class="arb-blog-body">
        <small style="color:var(--arb-primary);font-weight:700;">${p.data}</small>
        <h4>${p.titulo}</h4>
        <p>${p.resumo}</p>
        <a href="#blog" class="btn-arb btn-arb-outline" style="padding:0.5rem 1rem;font-size:0.75rem;">LER MAIS</a>
      </div>
    </article>`
    )
    .join('');
}

function initProfessionalsFilter() {
  const filters = document.querySelectorAll('.arb-professionals-filter');
  const cards = document.querySelectorAll('.arb-professional-card');
  if (!filters.length || !cards.length) return;

  filters.forEach((btn) => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;
      filters.forEach((b) => b.classList.toggle('active', b === btn));
      cards.forEach((card) => {
        const role = card.dataset.role;
        const show = filter === 'all' || role === filter;
        card.classList.toggle('is-hidden', !show);
      });
    });
  });
}

function initForms() {
  document.getElementById('contact-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    saveSubmission('contato', Object.fromEntries(fd));
    showSuccessModal();
    e.target.reset();
  });
}

function saveSubmission(type, data) {
  const list = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  list.push({ type, data, at: new Date().toISOString() });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function initModals() {
  document.querySelectorAll('[data-modal-close]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.getElementById('arb-success-modal')?.classList.remove('open');
    });
  });
}

export function showSuccessModal() {
  document.getElementById('arb-success-modal')?.classList.add('open');
}
