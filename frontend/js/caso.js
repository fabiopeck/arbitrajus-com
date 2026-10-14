import { ProcedimentosAPI } from './api.js';

const token = localStorage.getItem('arbitrajus_token');
if (!token) {
  window.location.href = '/frontend/pages/login.html?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
}

const params = new URLSearchParams(window.location.search);
const casoId = params.get('id');
if (!casoId) {
  window.location.href = '/frontend/pages/dashboard.html';
}

document.getElementById('logout-btn')?.addEventListener('click', () => {
  localStorage.removeItem('arbitrajus_token');
  localStorage.removeItem('arbitrajus_user');
  window.location.href = '/frontend/pages/login.html';
});

const STATUS_LABELS = {
  rascunho: 'Rascunho',
  pagamento_pendente: 'Pagamento pendente',
  aguardando_partes: 'Aguardando partes',
  em_andamento: 'Em andamento',
  suspenso: 'Suspenso',
  concluido: 'Concluído',
  arquivado: 'Arquivado',
};

const TIPO_LABELS = {
  conciliacao: 'Conciliação',
  mediacao: 'Mediação',
  arbitragem: 'Arbitragem',
};

function formatDate(iso) {
  return new Date(iso).toLocaleString('pt-BR');
}

function formatMoney(val) {
  if (val == null) return '-';
  return Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function renderDetalhes(caso) {
  const dl = document.getElementById('caso-detalhes');
  dl.innerHTML = `
    <div><dt>Tipo</dt><dd>${TIPO_LABELS[caso.tipo] || caso.tipo}</dd></div>
    <div><dt>Área</dt><dd>${caso.area || '-'}</dd></div>
    <div><dt>Valor da causa</dt><dd>${formatMoney(caso.valor_causa)}</dd></div>
    <div><dt>Taxa plataforma</dt><dd>${formatMoney(caso.taxa_plataforma)}</dd></div>
    <div><dt>Parte contrária</dt><dd>${caso.parte_contraria || '-'}</dd></div>
    <div><dt>E-mail contrária</dt><dd>${caso.parte_contraria_email || '-'}</dd></div>
    <div><dt>Descrição</dt><dd>${caso.descricao || '-'}</dd></div>
    <div><dt>Abertura</dt><dd>${formatDate(caso.created_at)}</dd></div>
  `;
}

function renderTimeline(eventos) {
  const ul = document.getElementById('caso-timeline');
  if (!eventos.length) {
    ul.innerHTML = '<li class="caso-timeline-empty">Nenhum evento registrado.</li>';
    return;
  }
  ul.innerHTML = eventos
    .map(
      (e) => `
    <li class="caso-timeline-item">
      <div class="caso-timeline-dot"></div>
      <div class="caso-timeline-body">
        <strong>${e.titulo}</strong>
        <p>${e.descricao || ''}</p>
        <time>${formatDate(e.created_at)}</time>
      </div>
    </li>`
    )
    .join('');
}

function renderAcoes(acoes, status) {
  const container = document.getElementById('caso-acoes');
  const hints = {
    pagamento_pendente: 'Confirme o pagamento da taxa para notificar as partes.',
    aguardando_partes: 'Aguarde aceite da parte contrária ou confirme manualmente (demo).',
    em_andamento: 'Quando concluído, encerre o procedimento.',
    suspenso: 'Retome ou arquive conforme necessário.',
    concluido: 'Procedimento finalizado.',
    arquivado: 'Procedimento arquivado.',
  };
  document.getElementById('caso-acao-hint').textContent = hints[status] || '';

  if (!acoes.length) {
    container.innerHTML = '<p class="proc-note">Nenhuma ação pendente.</p>';
    return;
  }

  container.innerHTML = acoes
    .map(
      (a) =>
        `<button type="button" class="btn ${a.primary ? 'btn-primary' : 'btn-outline'}" data-acao="${a.acao}">${a.label}</button>`
    )
    .join('');

  container.querySelectorAll('[data-acao]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      try {
        await loadCaso(await ProcedimentosAPI.acao(casoId, btn.dataset.acao));
      } catch (err) {
        alert(err.message);
        btn.disabled = false;
      }
    });
  });
}

function loadCaso(data) {
  const { caso, timeline, acoes, status_label } = data;
  document.getElementById('caso-titulo').textContent = caso.titulo;
  document.getElementById('caso-protocolo').textContent = caso.protocolo;
  const badge = document.getElementById('caso-status-badge');
  badge.textContent = status_label || STATUS_LABELS[caso.status] || caso.status;
  badge.className = `badge-status ${caso.status}`;
  renderDetalhes(caso);
  renderTimeline(timeline || []);
  renderAcoes(acoes || [], caso.status);
  document.title = `${caso.protocolo} | ARBITRAJUS`;
  return data;
}

async function init() {
  try {
    const data = await ProcedimentosAPI.get(casoId);
    loadCaso(data);
  } catch (err) {
    document.getElementById('caso-titulo').textContent = 'Erro ao carregar';
    document.getElementById('caso-protocolo').textContent = err.message;
  }
}

init();
