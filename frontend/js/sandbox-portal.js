import {
  PERFIS,
  requireSession,
  sandboxFetch,
  brl,
  etapaLabel,
  toast,
  RELATORIO_FORMATOS_LIST,
  relatorioUrl,
  refreshPerfis,
} from './sandbox-core.js';
import {
  mountSandboxShell,
  bindPortalNavigation,
  defaultSectionForPerfil,
} from './sandbox-nav.js';
import { t, initLangSwitcher, applyI18n, onLangChange, langSwitcherHtml } from './i18n.js';

if (!document.getElementById('arbLangRoot')) {
  const host = document.createElement('div');
  host.className = 'sandbox-lang-host';
  host.innerHTML = langSwitcherHtml('arbLangRoot');
  document.body.appendChild(host);
}
initLangSwitcher();

const session = requireSession();
refreshPerfis();
const perfil = PERFIS[session.perfil];

function sectionMeta() {
  return {
    dashboard: {
      kicker: t('sandbox.nav.group.dashboard') || 'Dashboard analitico',
      title: t('sandbox.nav.visaoGeral') || 'Visao geral',
      sub: t('sandbox.section.dashboard.sub') || 'Relatorios em tempo real, taxas de conversao e volume de casos',
    },
    relatorios: {
      kicker: t('sandbox.nav.group.dashboard') || 'Dashboard analitico',
      title: t('sandbox.nav.relatorios') || 'Relatorios gerenciais',
      sub: t('sandbox.section.relatorios.sub') || 'Indicadores de desempenho, economia e SLA operacional',
    },
    'esteira-sync': {
      kicker: t('sandbox.nav.group.operacional') || 'Gestao operacional',
      title: t('sandbox.nav.esteiraSync') || 'Esteira sincrona',
      sub: t('sandbox.nav.esteiraSync.desc') || 'Mediacao com agenda',
    },
    'esteira-async': {
      kicker: t('sandbox.nav.group.operacional') || 'Gestao operacional',
      title: t('sandbox.nav.esteiraAsync') || 'Esteira assincrona',
      sub: t('sandbox.nav.esteiraAsync.desc') || 'Negociacao direta',
    },
    processos: {
      kicker: t('sandbox.nav.group.sessao') || 'Sessao virtual',
      title: t('sandbox.nav.casos') || 'Casos e demandas',
      sub: t('sandbox.section.processos.sub') || 'Funil operacional com acesso a chat, minutas e assinatura por caso',
    },
    datajud: {
      kicker: t('sandbox.nav.group.sessao') || 'Sessao virtual',
      title: t('sandbox.nav.datajud') || 'Feed DataJud',
      sub: t('sandbox.section.datajud.sub') || 'Captura antecipada de processos na comarca de Lavras/MG',
    },
    auditoria: {
      kicker: t('sandbox.nav.group.historico') || 'Historico e seguranca',
      title: t('sandbox.nav.auditoria') || 'Trilha de auditoria',
      sub: t('sandbox.section.auditoria.sub') || 'Historico completo de interacoes e protocolos com comprovante',
    },
    blockchain: {
      kicker: t('sandbox.nav.group.historico') || 'Historico e seguranca',
      title: t('sandbox.nav.blockchain') || 'Registro blockchain',
      sub: t('sandbox.section.blockchain.sub') || 'Validacao de notificacoes, convites e documentos via registro imutavel',
    },
  };
}

const TOURS = {
  empresa: 'Voce esta como <strong>juridico corporativo</strong>. Use o menu para navegar entre dashboard, esteiras e auditoria.',
  advogado: 'Voce esta como <strong>advogado patrono</strong>. Acesse a esteira assincrona para negociar propostas.',
  parte: 'Voce esta como <strong>parte autora</strong>. Abra seu caso para chat, assinatura e sala virtual.',
  arbitro: 'Voce esta como <strong>mediador/arbitro</strong>. Gerencie sessoes sincronas e homologue acordos.',
};

let stateData = null;

function getInitialSection() {
  const hash = window.location.hash.replace('#', '');
  if (hash && sectionMeta()[hash]) return hash;
  return defaultSectionForPerfil(session.perfil);
}

function getCurrentSection() {
  const hash = window.location.hash.replace('#', '');
  return sectionMeta()[hash] ? hash : defaultSectionForPerfil(session.perfil);
}

const contentWrap = mountSandboxShell({
  activeSection: getInitialSection(),
  page: 'portal',
});

const tpl = document.getElementById('portal-main-template');
contentWrap.appendChild(tpl.content.cloneNode(true));

function exportButtonsHtml() {
  return RELATORIO_FORMATOS_LIST.map(
    (f) => `<a class="sandbox-btn sandbox-btn-outline sandbox-btn-sm" href="${relatorioUrl(f.id)}" download title="Exportar ${f.label}"><i class="fas ${f.icon}"></i> ${f.label}</a>`
  ).join('');
}

document.getElementById('sandbox-export-group').innerHTML = exportButtonsHtml();
document.getElementById('banner-perfil').textContent = perfil.label;
document.getElementById('sandbox-tour').innerHTML = TOURS[session.perfil] || '';

document.getElementById('btn-reset').innerHTML =
  `<i class="fas fa-rotate-left"></i> ${t('sandbox.reset') || 'Reiniciar demo'}`;
document.getElementById('btn-reset').addEventListener('click', async () => {
  if (!confirm(t('sandbox.reset.confirm') || 'Reiniciar todos os casos do sandbox?')) return;
  await sandboxFetch('/reset', { method: 'POST' });
  toast(t('sandbox.reset.done') || 'Sandbox reiniciado.');
  await load();
  renderSection(getCurrentSection());
});

onLangChange(() => {
  applyI18n(document);
  refreshPerfis();
  document.getElementById('banner-perfil').textContent = PERFIS[session.perfil]?.label || '';
  document.getElementById('btn-reset').innerHTML =
    `<i class="fas fa-rotate-left"></i> ${t('sandbox.reset') || 'Reiniciar demo'}`;
  renderSection(getCurrentSection());
});

function setActiveNav(sectionId) {
  document.querySelectorAll('[data-section]').forEach((a) => {
    a.classList.toggle('active', a.dataset.section === sectionId);
  });
}

function showSection(sectionId) {
  const meta = sectionMeta()[sectionId] || sectionMeta().dashboard;
  document.getElementById('section-kicker').textContent = meta.kicker;
  document.getElementById('section-title').textContent = meta.title;
  document.getElementById('section-sub').textContent = meta.sub;

  document.querySelectorAll('.sandbox-section').forEach((sec) => {
    sec.classList.toggle('sandbox-section--hidden', sec.dataset.section !== sectionId);
  });

  setActiveNav(sectionId);
  if (!window.location.hash || window.location.hash !== `#${sectionId}`) {
    history.replaceState(null, '', `#${sectionId}`);
  }
}

function renderSection(sectionId) {
  showSection(sectionId);
  const renderers = {
    dashboard: renderDashboard,
    relatorios: renderRelatorios,
    'esteira-sync': renderEsteiraSync,
    'esteira-async': renderEsteiraAsync,
    processos: renderProcessos,
    datajud: renderDatajud,
    auditoria: renderAuditoria,
    blockchain: renderBlockchain,
  };
  renderers[sectionId]?.();
}

async function load() {
  stateData = await sandboxFetch('/state');
  document.getElementById('wl-nome').textContent = stateData.white_label.cliente;
  document.getElementById('wl-cnpj').textContent = `CNPJ ${stateData.white_label.cnpj}`;
}

function renderCasosTable(compact = false) {
  if (!stateData?.casos?.length) {
    return '<p class="sandbox-panel-desc">Nenhum caso no sandbox. Rode <code>npm run sandbox:bots</code> ou clique em Reiniciar demo.</p>';
  }
  return `
    <div class="sandbox-table-wrap">
      <table class="sandbox-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Processo</th>
            ${compact ? '' : '<th>Protocolo ODR</th>'}
            <th>Autor</th>
            ${compact ? '<th>Etapa</th>' : '<th>Valores</th><th>Etapa</th>'}
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${stateData.casos
            .map(
              (c) => `
            <tr>
              <td><code class="sandbox-hash">${c.id}</code></td>
              <td><strong>${c.numero}</strong>${c.antecipada ? '<br><span class="sandbox-badge sandbox-badge--green">Captura antecipada</span>' : ''}</td>
              ${compact ? '' : `<td><small>${c.protocolo_odr || 'n/d'}</small></td>`}
              <td>${c.autor}</td>
              ${compact
                ? `<td><span class="sandbox-badge">${etapaLabel(c.etapa_atual, stateData.etapas)}</span></td>`
                : `<td>Pedido ${brl(c.pedido)}<br>Proposta ${brl(c.proposta)}</td>
              <td><span class="sandbox-badge">${etapaLabel(c.etapa_atual, stateData.etapas)}</span></td>`}
              <td><a class="sandbox-btn sandbox-btn-primary" href="sandbox-caso.html?id=${c.id}">Abrir</a></td>
            </tr>`
            )
            .join('')}
        </tbody>
      </table>
    </div>`;
}

function renderDashboard() {
  const m = stateData.metricas;
  const a = stateData.analytics;
  const maxVal = Math.max(...(a?.funil_mensal?.map((x) => x.capturados) || [1]));

  document.getElementById('sec-dashboard').innerHTML = `
    <div class="sandbox-metrics">
      <article class="sandbox-metric"><span>Economia</span><strong>${brl(m.economia)}</strong></article>
      <article class="sandbox-metric"><span>Caixa liberado</span><strong>${brl(m.caixa_liberado)}</strong></article>
      <article class="sandbox-metric"><span>Taxa de acordo</span><strong>${m.taxa_acordo}%</strong></article>
      <article class="sandbox-metric"><span>Tempo medio</span><strong>${m.tempo_medio_dias} dias</strong></article>
      <article class="sandbox-metric sandbox-metric--blue"><span>Abertos</span><strong>${m.casos_abertos ?? 42}</strong></article>
      <article class="sandbox-metric sandbox-metric--amber"><span>Em andamento</span><strong>${m.casos_andamento ?? 23}</strong></article>
      <article class="sandbox-metric sandbox-metric--green"><span>Encerrados</span><strong>${m.casos_encerrados ?? 61}</strong></article>
    </div>

    <div class="sandbox-panel sandbox-panel--highlight">
      <h2><i class="fas fa-folder-open"></i> Casos ativos no sandbox</h2>
      <p class="sandbox-panel-desc">Apos rodar os robos, o caso <strong>lav-01</strong> aparece aqui. Clique em Abrir ou use o atalho no menu lateral.</p>
      ${renderCasosTable(true)}
    </div>

    <div class="sandbox-grid-2">
      <div class="sandbox-panel">
        <h2><i class="fas fa-chart-column"></i> Desempenho mensal</h2>
        <div class="sandbox-chart">
          ${(a?.funil_mensal || [])
            .map(
              (row) => `
            <div class="sandbox-chart-row">
              <span class="sandbox-chart-label">${row.mes}</span>
              <div class="sandbox-chart-bars">
                <div class="sandbox-chart-bar sandbox-chart-bar--capt" style="width:${(row.capturados / maxVal) * 100}%"><em>${row.capturados}</em></div>
                <div class="sandbox-chart-bar sandbox-chart-bar--acordo" style="width:${(row.acordos / maxVal) * 100}%"><em>${row.acordos}</em></div>
              </div>
            </div>`
            )
            .join('')}
        </div>
        <p class="sandbox-chart-legend"><span class="dot dot--capt"></span> Capturados <span class="dot dot--acordo"></span> Acordos</p>
      </div>

      <div class="sandbox-panel">
        <h2><i class="fas fa-percent"></i> Conversao de propostas</h2>
        <div class="sandbox-gauge">
          <div class="sandbox-gauge-ring" style="--pct:${m.conversao_proposta ?? 72}">
            <span>${m.conversao_proposta ?? 72}%</span>
          </div>
          <p>Taxa de aceite apos primeira proposta formal no ODR (simulado).</p>
        </div>
      </div>
    </div>

    <div class="sandbox-panel">
      <h2><i class="fas fa-cloud"></i> Nuvem de palavras: canais criticos</h2>
      <p class="sandbox-panel-desc">Termos recorrentes em Procon, Reclame Aqui e Consumidor.gov</p>
      <div class="sandbox-wordcloud">
        ${(a?.nuvem_palavras || [])
          .map((w) => {
            const size = 0.75 + w.peso / 50;
            return `<span class="sandbox-word" style="--sz:${size}">${w.termo}</span>`;
          })
          .join('')}
      </div>
      <div class="sandbox-canais">
        ${(a?.canais || [])
          .map(
            (c) => `
          <div class="sandbox-canal">
            <strong>${c.canal}</strong>
            <span>${c.volume} casos</span>
            <em>${c.tendencia}</em>
          </div>`
          )
          .join('')}
      </div>
    </div>`;
}

function renderRelatorios() {
  const m = stateData.metricas;
  document.getElementById('sec-relatorios').innerHTML = `
    <div class="sandbox-panel">
      <h2>Indicadores consolidados</h2>
      <div class="sandbox-kpi-grid">
        <div class="sandbox-kpi"><span>Processos capturados (DataJud)</span><strong>${m.casos_capturados}</strong></div>
        <div class="sandbox-kpi"><span>Resolvidos via ODR</span><strong>${m.casos_resolvidos}</strong></div>
        <div class="sandbox-kpi"><span>Economia acumulada</span><strong>${brl(m.economia)}</strong></div>
        <div class="sandbox-kpi"><span>SLA medio</span><strong>${m.tempo_medio_dias} dias</strong></div>
      </div>
    </div>
    <div class="sandbox-panel">
      <h2>Exportacao</h2>
      <p class="sandbox-panel-desc">Relatorio completo dos casos do sandbox nos formatos abaixo.</p>
      <div class="sandbox-export-group">${exportButtonsHtml()}</div>
    </div>`;
}

function renderEsteiraSync() {
  const sessoes = stateData.esteira_sincrona || [];
  document.getElementById('sec-esteira-sync').innerHTML = `
    <div class="sandbox-panel">
      <h2><i class="fas fa-calendar-check"></i> Sessoes com mediador</h2>
      <p class="sandbox-panel-desc">Agendamento integrado a agenda dos mediadores com notificacoes automaticas (e-mail, SMS, WhatsApp).</p>
      <div class="sandbox-cards">
        ${sessoes
          .map((s) => {
            const notif = [
              s.notificacoes?.email && 'E-mail',
              s.notificacoes?.sms && 'SMS',
              s.notificacoes?.whatsapp && 'WhatsApp',
            ]
              .filter(Boolean)
              .join(' · ');
            return `
          <article class="sandbox-card">
            <div class="sandbox-card-head">
              <strong>${s.processo}</strong>
              <span class="sandbox-badge ${s.status === 'concluida' ? 'sandbox-badge--green' : ''}">${s.status}</span>
            </div>
            <p><i class="fas fa-user-tie"></i> ${s.mediador}</p>
            <p><i class="fas fa-clock"></i> ${new Date(s.data).toLocaleString('pt-BR')}</p>
            <p><i class="fas fa-bell"></i> ${notif || 'Nenhuma'}</p>
            <div class="sandbox-card-actions">
              <a class="sandbox-btn sandbox-btn-primary" href="sandbox-caso.html?id=${s.caso_id}#audiencia"><i class="fas fa-video"></i> Sala virtual</a>
              <a class="sandbox-btn sandbox-btn-outline" href="sandbox-caso.html?id=${s.caso_id}"><i class="fas fa-folder-open"></i> Abrir caso</a>
            </div>
          </article>`;
          })
          .join('')}
      </div>
    </div>`;
}

function renderEsteiraAsync() {
  const fila = stateData.esteira_assincrona || [];
  document.getElementById('sec-esteira-async').innerHTML = `
    <div class="sandbox-panel">
      <h2><i class="fas fa-handshake"></i> Negociacao direta</h2>
      <p class="sandbox-panel-desc">Painel de propostas e contrapropostas entre empresa e consumidor, sem videoconferencia imediata.</p>
      <div class="sandbox-table-wrap">
        <table class="sandbox-table">
          <thead>
            <tr><th>Processo</th><th>Propostas</th><th>Ultima movimentacao</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            ${fila
              .map(
                (f) => `
              <tr>
                <td><strong>${f.processo}</strong></td>
                <td>${f.propostas} rodadas</td>
                <td>${new Date(f.ultima).toLocaleString('pt-BR')}</td>
                <td><span class="sandbox-badge">${f.status.replace(/_/g, ' ')}</span></td>
                <td><a class="sandbox-btn sandbox-btn-primary" href="sandbox-caso.html?id=${f.caso_id}#negociacao">Negociar</a></td>
              </tr>`
              )
              .join('')}
          </tbody>
        </table>
      </div>
    </div>`;
}

function renderProcessos() {
  document.getElementById('sec-processos').innerHTML = `
    <div class="sandbox-panel">
      <h2>Funil operacional</h2>
      ${renderCasosTable(false)}
    </div>`;
}

async function renderDatajud() {
  const el = document.getElementById('sec-datajud');
  el.innerHTML = '<div class="sandbox-panel"><p>Carregando feed...</p></div>';
  try {
    const d = await sandboxFetch('/datajud');
    const tag = (fonte) =>
      fonte === 'datajud_real'
        ? '<span class="tag-real">DataJud real</span>'
        : '<span class="tag-real" style="background:#fef3c7;color:#92400e">Demo</span>';
    el.innerHTML = `
      <div class="sandbox-panel">
        <h2><i class="fas fa-satellite-dish"></i> Feed DataJud (parcial / real)</h2>
        <p class="sandbox-panel-desc">Ultima execucao: ${d.ultima_execucao ? new Date(d.ultima_execucao).toLocaleString('pt-BR') : 'n/d'} · ${d.total_vistos ?? 0} processos catalogados</p>
        <div class="sandbox-datajud-feed">
          ${(d.alertas || [])
            .map(
              (a) => `
            <div class="sandbox-datajud-item">
              <div><strong>${a.numero}</strong><br><small>${a.comarca} · ${a.empresa}</small></div>
              ${tag(a.fonte)}
            </div>`
            )
            .join('')}
        </div>
      </div>`;
  } catch {
    el.innerHTML = '<div class="sandbox-panel"><p>Feed indisponivel.</p></div>';
  }
}

function renderAuditoria() {
  const logs = stateData.auditoria || [];
  document.getElementById('sec-auditoria').innerHTML = `
    <div class="sandbox-panel">
      <h2><i class="fas fa-list-check"></i> Trilha de auditoria</h2>
      <p class="sandbox-panel-desc">Historico completo de interacoes com protocolo e comprovante de resposta.</p>
      <div class="sandbox-audit-list">
        ${logs
          .map(
            (l) => `
          <div class="sandbox-audit-item">
            <div class="sandbox-audit-dot"></div>
            <div>
              <strong>${l.evento}</strong>
              <p>${l.detalhe}</p>
              <small>${new Date(l.em).toLocaleString('pt-BR')} · Protocolo ${l.protocolo}</small>
            </div>
            <a href="sandbox-caso.html?id=${l.caso_id}" class="sandbox-btn sandbox-btn-outline sandbox-btn-sm">Caso</a>
          </div>`
          )
          .join('')}
      </div>
    </div>`;
}

function renderBlockchain() {
  const chain = stateData.blockchain || [];
  document.getElementById('sec-blockchain').innerHTML = `
    <div class="sandbox-panel">
      <h2><i class="fas fa-link"></i> Registro blockchain</h2>
      <p class="sandbox-panel-desc">Notificacoes e cartas-convite registradas com hash imutavel para evidencia juridica.</p>
      <div class="sandbox-table-wrap">
        <table class="sandbox-table">
          <thead>
            <tr><th>Hash</th><th>Tipo</th><th>Protocolo</th><th>Data</th><th>Status</th></tr>
          </thead>
          <tbody>
            ${chain
              .map(
                (b) => `
              <tr>
                <td><code class="sandbox-hash">${b.hash}</code></td>
                <td>${b.tipo}</td>
                <td>${b.protocolo}</td>
                <td>${new Date(b.em).toLocaleString('pt-BR')}</td>
                <td><span class="sandbox-badge sandbox-badge--green">${b.validado ? 'Validado' : 'Pendente'}</span></td>
              </tr>`
              )
              .join('')}
          </tbody>
        </table>
      </div>
    </div>`;
}

bindPortalNavigation((sectionId) => renderSection(sectionId));

(async () => {
  await load();
  const initial = getInitialSection();
  if (!window.location.hash) window.location.hash = initial;
  renderSection(getCurrentSection());
})();
