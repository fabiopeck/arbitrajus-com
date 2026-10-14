/**
 * Layout compartilhado estilo MOL + ARBITRAJUS
 */
import { PERFIS, getSession, clearSession } from './sandbox-core.js';

const NAV_ITEMS = [
  { href: 'sandbox-portal.html', label: 'Inicio', icon: 'fa-house', id: 'inicio' },
  { href: 'sandbox-portal.html', label: 'Processos TJMG', icon: 'fa-gavel', id: 'processos' },
  { href: 'sandbox-portal.html#minutas', label: 'Minutas de acordo', icon: 'fa-file-contract', id: 'minutas' },
  { href: 'sandbox-portal.html#prazos', label: 'Prazos', icon: 'fa-clock', id: 'prazos' },
  { href: 'sandbox-portal.html#relatorios', label: 'Relatorios', icon: 'fa-chart-column', id: 'relatorios' },
  { href: 'demo-operacao.html', label: 'Integracoes', icon: 'fa-plug', id: 'integracoes' },
  { href: 'sandbox.html', label: 'Sair', icon: 'fa-right-from-bracket', id: 'sair', action: 'sair' },
];

export function mountMolShell(options = {}) {
  const {
    activeNav = 'processos',
    breadcrumb = [],
    pageTitle = 'Processos TJMG',
    pageSubtitle = 'Pesquisar demandas',
    wlNome = 'Unimed Lavras',
  } = options;

  const session = getSession();
  const perfil = session ? PERFIS[session.perfil] : null;

  const root = document.getElementById('mol-root');
  if (!root) return;

  const crumbs = breadcrumb.length
    ? breadcrumb.map((c, i) => (i === breadcrumb.length - 1
      ? `<span>${c.label}</span>`
      : `<a href="${c.href || '#'}">${c.label}</a>`)).join(' <span class="mol-crumb-sep">/</span> ')
    : `<a href="sandbox-portal.html">Inicio</a> <span class="mol-crumb-sep">/</span> <span>${pageTitle}</span>`;

  root.innerHTML = `
    <header class="mol-header">
      <div class="mol-header-inner">
        <div class="mol-logo">
          <div class="mol-logo-mark">A</div>
          <div>
            <strong class="mol-logo-main">ARBITRAJUS</strong>
            <span class="mol-logo-sub">odr.arbitrajus.com · ${wlNome}</span>
          </div>
        </div>
        <div class="mol-header-user">
          <div class="mol-user-text">
            <strong>${perfil?.nome || 'Usuario demo'}</strong>
            <span>${perfil?.label || 'Perfil'}</span>
          </div>
          <div class="mol-avatar" title="Perfil verificado"><i class="fas fa-user-check"></i></div>
        </div>
      </div>
    </header>

    <nav class="mol-menu">
      ${NAV_ITEMS.map((item) => `
        <a href="${item.href}" class="${item.id === activeNav ? 'active' : ''}" data-nav="${item.id}" ${item.action ? `data-action="${item.action}"` : ''}>
          <i class="fas ${item.icon}"></i> ${item.label}
        </a>
      `).join('')}
    </nav>

    <div class="mol-page-head">
      <div class="mol-page-titles">
        <h1>${pageTitle}</h1>
        <p>${pageSubtitle}</p>
      </div>
      <div class="mol-breadcrumb">${crumbs}</div>
    </div>

    <main class="mol-content" id="mol-content"></main>

    <footer class="mol-footer">
      <span>Copyright © ${new Date().getFullYear()} ARBITRAJUS · Ambiente sandbox · dados ficticios</span>
    </footer>

    <button type="button" class="mol-fab" id="mol-fab-chat" title="Chat ODR"><i class="fas fa-comments"></i></button>
  `;

  root.querySelector('[data-action="sair"]')?.addEventListener('click', (e) => {
    e.preventDefault();
    clearSession();
    window.location.href = '/frontend/pages/sandbox.html';
  });

  root.querySelector('#mol-fab-chat')?.addEventListener('click', () => {
    const casoId = new URLSearchParams(window.location.search).get('id') || 'lav-01';
    window.location.href = `sandbox-caso.html?id=${casoId}#negociacao`;
  });

  return document.getElementById('mol-content');
}

export function downloadMinuta(caso, minuta, formato) {
  const base = `TERMO DE ACORDO EXTRAJUDICIAL\nProcesso: ${caso.numero}\nAutor: ${caso.autor}\nReu: ${caso.reu}\nMinuta v${minuta.versao}: ${minuta.titulo}\nValor: R$ ${minuta.valor.toLocaleString('pt-BR')}\nStatus: ${minuta.status}\n\nClausulas simuladas para demonstracao ARBITRAJUS.\n`;
  const safeName = `minuta-v${minuta.versao}-${caso.id}`;

  if (formato === 'xml') {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<acordo xmlns="https://arbitrajus.com/schema/odr">
  <processo>${caso.numero}</processo>
  <autor>${caso.autor}</autor>
  <reu>${caso.reu}</reu>
  <minuta versao="${minuta.versao}" status="${minuta.status}">
    <titulo>${minuta.titulo}</titulo>
    <valor moeda="BRL">${minuta.valor}</valor>
    <gerado_em>${minuta.em}</gerado_em>
  </minuta>
</acordo>`;
    triggerDownload(xml, `${safeName}.xml`, 'application/xml');
    return;
  }

  if (formato === 'docx') {
    const rtf = `{\\rtf1\\ansi Termo de acordo - ${caso.numero} - Minuta v${minuta.versao} - R$ ${minuta.valor}}`;
    triggerDownload(rtf, `${safeName}.doc`, 'application/msword');
    return;
  }

  triggerDownload(base, `${safeName}.pdf`, 'application/pdf');
}

function triggerDownload(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function situacaoLabel(etapa) {
  const map = {
    captura: 'Capturado DataJud',
    notificacao: 'Aguardando partes',
    negociacao: 'Em negociacao no ODR',
    minuta: 'Minuta em analise',
    assinatura: 'Aguardando assinaturas',
    audiencia: 'Audiencia agendada',
    acordo: 'Acordo homologado',
    erp: 'Enviado ao ERP',
  };
  return map[etapa] || etapa;
}
