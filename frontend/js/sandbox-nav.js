/**
 * Menu lateral ARBITRAJUS - painel gerencial ODR
 */
import { PERFIS, getSession, clearSession, refreshPerfis } from './sandbox-core.js';
import { t, onLangChange } from './i18n.js';

function buildNavGroups() {
  return [
    {
      label: t('sandbox.nav.group.dashboard') || 'Dashboard analitico',
      profiles: ['empresa', 'arbitro'],
      items: [
        { id: 'dashboard', hash: '#dashboard', label: t('sandbox.nav.visaoGeral') || 'Visao geral', icon: 'fa-chart-pie' },
        { id: 'relatorios', hash: '#relatorios', label: t('sandbox.nav.relatorios') || 'Relatorios gerenciais', icon: 'fa-chart-line' },
      ],
    },
    {
      label: t('sandbox.nav.group.operacional') || 'Gestao operacional',
      profiles: ['empresa', 'arbitro', 'advogado'],
      items: [
        {
          id: 'esteira-sync',
          hash: '#esteira-sync',
          label: t('sandbox.nav.esteiraSync') || 'Esteira sincrona',
          icon: 'fa-users',
          desc: t('sandbox.nav.esteiraSync.desc') || 'Mediacao com agenda',
        },
        {
          id: 'esteira-async',
          hash: '#esteira-async',
          label: t('sandbox.nav.esteiraAsync') || 'Esteira assincrona',
          icon: 'fa-comments-dollar',
          desc: t('sandbox.nav.esteiraAsync.desc') || 'Negociacao direta',
        },
      ],
    },
    {
      label: t('sandbox.nav.group.sessao') || 'Sessao virtual',
      profiles: ['empresa', 'arbitro', 'advogado', 'parte'],
      items: [
        { id: 'processos', hash: '#processos', label: t('sandbox.nav.casos') || 'Casos e demandas', icon: 'fa-folder-open' },
        { id: 'datajud', hash: '#datajud', label: t('sandbox.nav.datajud') || 'Feed DataJud', icon: 'fa-satellite-dish' },
      ],
    },
    {
      label: t('sandbox.nav.group.historico') || 'Historico e seguranca',
      profiles: ['empresa', 'arbitro'],
      items: [
        { id: 'auditoria', hash: '#auditoria', label: t('sandbox.nav.auditoria') || 'Trilha de auditoria', icon: 'fa-list-check' },
        { id: 'blockchain', hash: '#blockchain', label: t('sandbox.nav.blockchain') || 'Registro blockchain', icon: 'fa-link' },
      ],
    },
  ];
}

function buildFooterLinks() {
  return [
    { id: 'caso-lav01', href: 'sandbox-caso.html?id=lav-01', label: 'Caso lav-01', icon: 'fa-folder-open' },
    { id: 'hub', href: 'demo-operacao.html', label: t('sandbox.nav.hub') || 'Hub tecnico', icon: 'fa-plug', external: true },
    { id: 'sair', href: '#', label: t('sandbox.nav.trocarPerfil') || 'Trocar perfil', icon: 'fa-right-from-bracket', action: 'sair' },
  ];
}

export function defaultSectionForPerfil(perfilId) {
  const map = {
    empresa: 'dashboard',
    arbitro: 'esteira-sync',
    advogado: 'esteira-async',
    parte: 'processos',
  };
  return map[perfilId] || 'dashboard';
}

export function mountSandboxShell(options = {}) {
  const {
    activeSection = 'dashboard',
    activeCasoId = null,
    page = 'portal',
    wlNome = 'Unimed Lavras',
    wlCnpj = 'CNPJ',
  } = options;

  refreshPerfis();
  const session = getSession();
  const perfil = session ? PERFIS[session.perfil] : null;
  const perfilId = session?.perfil || 'empresa';

  const shell = document.getElementById('sandbox-shell');
  if (!shell) return null;

  const navGroups = buildNavGroups();
  const footerLinks = buildFooterLinks();

  const visibleGroups = navGroups
    .map((g) => ({
      ...g,
      items: g.items.filter((item) => g.profiles.includes(perfilId)),
    }))
    .filter((g) => g.items.length);

  const navHtml = visibleGroups
    .map(
      (g) => `
    <div class="sandbox-nav-group">
      <span class="sandbox-nav-group-label">${g.label}</span>
      ${g.items
        .map((item) => {
          const isActive = item.id === activeSection;
          const href = `sandbox-portal.html${item.hash}`;
          return `<a href="${href}" class="${isActive ? 'active' : ''}" data-section="${item.id}"><i class="fas ${item.icon}"></i> ${item.label}</a>`;
        })
        .join('')}
    </div>`
    )
    .join('');

  const casoSubnav =
    page === 'caso' && activeCasoId
      ? `
    <div class="sandbox-nav-group sandbox-nav-group--caso">
      <span class="sandbox-nav-group-label">${t('sandbox.nav.casoTools') || 'Ferramentas do caso'}</span>
      <a href="#negociacao" class="sandbox-caso-anchor" data-anchor="negociacao"><i class="fas fa-comments"></i> Chat</a>
      <a href="#minutas" class="sandbox-caso-anchor" data-anchor="minutas"><i class="fas fa-file-contract"></i> Editor de termos</a>
      <a href="#assinatura" class="sandbox-caso-anchor" data-anchor="assinatura"><i class="fas fa-pen-nib"></i> Assinatura</a>
      <a href="#audiencia" class="sandbox-caso-anchor" data-anchor="audiencia"><i class="fas fa-video"></i> Sala virtual</a>
    </div>`
      : '';

  shell.innerHTML = `
    <aside class="sandbox-sidebar" id="sandbox-sidebar">
      <button type="button" class="sandbox-menu-toggle" id="sandbox-menu-toggle" aria-label="${t('common.menu') || 'Menu'}">
        <i class="fas fa-bars"></i>
      </button>
      <span class="sandbox-sidebar-brand">Powered by ARBITRAJUS</span>
      <div class="sandbox-sidebar-wl">
        <strong id="wl-nome">${wlNome}</strong>
        <small id="wl-cnpj">${wlCnpj}</small>
      </div>
      <nav class="sandbox-nav" id="sandbox-nav">
        ${navHtml}
        ${casoSubnav}
        <div class="sandbox-nav-group sandbox-nav-group--footer">
          ${footerLinks.map((l) => `<a href="${l.href}" ${l.action ? `data-action="${l.action}"` : ''}><i class="fas ${l.icon}"></i> ${l.label}</a>`).join('')}
        </div>
      </nav>
      <div class="sandbox-user">
        <strong id="user-nome">${perfil?.nome || 'Usuario'}</strong>
        <span id="user-perfil">${perfil?.label || 'Perfil'}</span>
      </div>
    </aside>
    <div class="sandbox-content-wrap" id="sandbox-content-wrap"></div>
  `;

  shell.querySelector('[data-action="sair"]')?.addEventListener('click', (e) => {
    e.preventDefault();
    clearSession();
    window.location.href = '/frontend/pages/sandbox.html';
  });

  shell.querySelector('#sandbox-menu-toggle')?.addEventListener('click', () => {
    shell.classList.toggle('sandbox-shell--menu-open');
  });

  return shell.querySelector('#sandbox-content-wrap');
}

export function bindPortalNavigation(onSectionChange) {
  const links = document.querySelectorAll('[data-section]');
  links.forEach((a) => {
    a.addEventListener('click', (e) => {
      if (a.hostname === window.location.hostname) {
        e.preventDefault();
        const id = a.dataset.section;
        window.location.hash = id;
        onSectionChange?.(id);
      }
    });
  });

  window.addEventListener('hashchange', () => {
    const id = window.location.hash.replace('#', '') || defaultSectionForPerfil(getSession()?.perfil);
    onSectionChange?.(id);
  });
}

export function bindCasoAnchors() {
  document.querySelectorAll('.sandbox-caso-anchor').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const id = a.dataset.anchor;
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      document.querySelectorAll('.sandbox-caso-anchor').forEach((x) => x.classList.remove('active'));
      a.classList.add('active');
    });
  });
}

// Keep export name for any legacy imports
export const NAV_GROUPS = buildNavGroups();
onLangChange(() => {
  /* consumers remount on lang change when needed */
});
