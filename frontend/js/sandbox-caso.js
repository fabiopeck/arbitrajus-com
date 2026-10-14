import {
  requireSession,
  sandboxFetch,
  brl,
  etapaLabel,
  toast,
  RELATORIO_FORMATOS_LIST,
  downloadMinuta,
} from './sandbox-core.js';
import { mountSandboxShell, bindCasoAnchors } from './sandbox-nav.js';
import { initLangSwitcher, applyI18n, onLangChange, langSwitcherHtml, t } from './i18n.js';

if (!document.getElementById('arbLangRoot')) {
  const host = document.createElement('div');
  host.className = 'sandbox-lang-host';
  host.innerHTML = langSwitcherHtml('arbLangRoot');
  document.body.appendChild(host);
}
initLangSwitcher();
onLangChange(() => applyI18n(document));

requireSession();

const params = new URLSearchParams(window.location.search);
const casoId = params.get('id') || 'lav-01';

let etapasGlobais = [];
let casoAtual = null;

const contentWrap = mountSandboxShell({
  activeSection: 'processos',
  activeCasoId: casoId,
  page: 'caso',
});

contentWrap.appendChild(document.getElementById('caso-main-template').content.cloneNode(true));
bindCasoAnchors();

async function loadCaso() {
  const data = await sandboxFetch(`/casos/${casoId}`);
  const c = data.caso;
  casoAtual = c;
  etapasGlobais = data.etapas;

  document.getElementById('wl-nome').textContent = data.white_label.cliente;
  document.getElementById('wl-cnpj').textContent = `CNPJ ${data.white_label.cnpj}`;

  document.getElementById('caso-numero').textContent = c.numero;
  document.getElementById('caso-vara').textContent = `${c.vara} · Protocolo ${c.protocolo_odr || 'n/d'}`;
  document.getElementById('caso-partes').textContent = `${c.autor} × ${c.reu} · ${c.advogado} (${c.oab})`;
  document.getElementById('caso-etapa').textContent = etapaLabel(c.etapa_atual, data.etapas);
  document.getElementById('caso-valores').innerHTML = `
    Pedido: <strong style="color:#c53030">${brl(c.pedido)}</strong><br>
    Proposta atual: <strong style="color:#276749">${brl(c.proposta)}</strong><br>
    Economia potencial: <strong>${brl(c.pedido - c.proposta)}</strong>
    ${c.antecipada ? '<br><span class="sandbox-badge sandbox-badge--green">Captura antecipada | citacao em ' + c.citacao_prevista_em + '</span>' : ''}`;

  document.getElementById('btn-audiencia').href = data.sala_audiencia_url;

  renderChat(c.chat);
  renderMinutas(c);
  renderDocs(c.documentos);
  renderSigs(c.assinaturas);
  renderEtapas(c);
  renderAcoes(data.acoes);
  document.title = `${c.numero} | Sandbox ODR`;

  const anchor = window.location.hash.replace('#', '');
  if (anchor) {
    setTimeout(() => document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth' }), 100);
  }
}

function renderChat(chat) {
  const el = document.getElementById('caso-chat');
  if (!chat?.length) {
    el.innerHTML = '<p style="color:#94a3b8;font-size:0.85rem">Nenhuma mensagem ainda.</p>';
    return;
  }
  el.innerHTML = chat
    .map((m) => `<div class="sandbox-chat-msg"><span>${m.quem} · ${new Date(m.quando).toLocaleString('pt-BR')}</span>${m.texto}</div>`)
    .join('');
  el.scrollTop = el.scrollHeight;
}

function renderMinutas(caso) {
  const minutas = caso.minutas || [];
  const el = document.getElementById('caso-minutas');
  if (!minutas.length) {
    el.innerHTML = '<p class="sandbox-panel-desc">Nenhuma minuta gerada. O juridico corporativo pode gerar a partir da etapa de negociacao.</p>';
    return;
  }
  el.innerHTML = `
    <div class="sandbox-minutas-tabs">
      ${minutas
        .map(
          (m, i) => `
        <button type="button" class="sandbox-minuta-tab ${i === minutas.length - 1 ? 'active' : ''}" data-idx="${i}">
          v${m.versao} · ${m.status.replace(/_/g, ' ')}
        </button>`
        )
        .join('')}
    </div>
    ${minutas
      .map((m, i) => {
        const texto = `TERMO DE ACORDO EXTRAJUDICIAL\n\nProcesso: ${caso.numero}\nAutor: ${caso.autor}\nReu: ${caso.reu}\n\n${m.titulo}\nValor acordado: ${brl(m.valor)}\nStatus: ${m.status}\nElaborado por: ${m.autor}\nEm: ${new Date(m.em).toLocaleString('pt-BR')}\n\nClausula 1: O reu compromete-se ao pagamento conforme valor acima.\nClausula 2: A parte autora da quitacao plena apos o pagamento.\nClausula 3: O acordo sera homologado na plataforma ARBITRAJUS.\n\n[Demonstracao sandbox, sem valor juridico]`;
        return `
      <div class="sandbox-minuta-editor ${i === minutas.length - 1 ? '' : 'sandbox-section--hidden'}" data-minuta="${i}">
        <textarea class="sandbox-minuta-text" readonly>${texto}</textarea>
        <div class="sandbox-minuta-meta">
          <span><i class="fas fa-user"></i> ${m.autor}</span>
          <span><i class="fas fa-coins"></i> ${brl(m.valor)}</span>
          <div class="sandbox-export-group sandbox-export-group--sm">
            ${RELATORIO_FORMATOS_LIST.map((f) => `<button type="button" class="sandbox-btn sandbox-btn-outline sandbox-btn-sm" data-export-format="${f.id}" data-minuta-idx="${i}"><i class="fas ${f.icon}"></i> ${f.label}</button>`).join('')}
          </div>
        </div>
      </div>`;
      })
      .join('')}`;

  el.querySelectorAll('.sandbox-minuta-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      const idx = tab.dataset.idx;
      el.querySelectorAll('.sandbox-minuta-tab').forEach((t) => t.classList.remove('active'));
      el.querySelectorAll('[data-minuta]').forEach((p) => p.classList.add('sandbox-section--hidden'));
      tab.classList.add('active');
      el.querySelector(`[data-minuta="${idx}"]`)?.classList.remove('sandbox-section--hidden');
    });
  });

  el.querySelectorAll('[data-export-format]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.minutaIdx);
      const m = minutas[idx];
      downloadMinuta(caso, m, btn.dataset.exportFormat);
    });
  });
}

function renderDocs(docs) {
  document.getElementById('caso-docs').innerHTML = (docs || [])
    .map((d) => `<li><span><i class="fas fa-file-pdf"></i> ${d.nome}</span><small>${d.por}</small></li>`)
    .join('') || '<li>Nenhum documento</li>';
}

function renderSigs(sigs) {
  const labels = { empresa: 'Empresa', parte: 'Parte', advogado: 'Advogado' };
  document.getElementById('caso-sigs').innerHTML = Object.entries(labels)
    .map(([k, label]) => `<div class="sandbox-sig ${sigs[k] ? 'ok' : ''}"><i class="fas fa-${sigs[k] ? 'check' : 'clock'}"></i><br>${label}<br>${sigs[k] ? 'Assinado' : 'Pendente'}</div>`)
    .join('');
}

function renderEtapas(caso) {
  const ordemAtual = etapasGlobais.find((e) => e.id === caso.etapa_atual)?.ordem ?? 0;
  const concluidas = new Set(caso.timeline.filter((t) => t.concluida).map((t) => t.etapa));

  document.getElementById('caso-etapas').innerHTML = etapasGlobais
    .map((e) => {
      const done = concluidas.has(e.id) || e.ordem < ordemAtual;
      const current = e.id === caso.etapa_atual;
      const ev = caso.timeline.find((t) => t.etapa === e.id);
      return `
      <div class="sandbox-etapa ${done ? 'done' : ''} ${current ? 'current' : ''}">
        <div class="sandbox-etapa-dot"><i class="fas fa-${done ? 'check' : e.ordem}"></i></div>
        <div class="sandbox-etapa-body">
          <strong>${e.label}</strong>
          <p>${ev?.descricao || (current ? 'Etapa em andamento' : 'Aguardando')}</p>
        </div>
      </div>`;
    })
    .join('');
}

function renderAcoes(acoes) {
  const skip = new Set(['enviar_mensagem', 'upload_documento']);
  const container = document.getElementById('caso-acoes');
  const filtered = acoes.filter((a) => !skip.has(a.id));
  if (!filtered.length) {
    container.innerHTML = '<p style="font-size:0.85rem;color:#64748b">Nenhuma acao pendente para seu perfil nesta etapa.</p>';
    return;
  }
  container.innerHTML = filtered
    .map((a) => `<button type="button" class="sandbox-btn ${a.primary ? 'sandbox-btn-primary' : 'sandbox-btn-outline'}" data-acao="${a.id}">${a.label}</button>`)
    .join('');

  container.querySelectorAll('[data-acao]').forEach((btn) => {
    btn.addEventListener('click', () => executarAcao(btn.dataset.acao, btn));
  });
}

async function executarAcao(acao, btn) {
  btn.disabled = true;
  try {
    let payload = {};
    if (acao === 'propor_acordo') {
      const v = prompt('Valor da proposta (R$):');
      if (!v) return;
      payload = { valor: Number(v.replace(/\D/g, '')) / 100 || Number(v) };
    }
    const res = await sandboxFetch(`/casos/${casoId}/acao`, {
      method: 'POST',
      body: JSON.stringify({ acao, ...payload }),
    });
    toast(res.message || 'Feito.');
    await loadCaso();
  } catch (err) {
    toast(err.message);
  } finally {
    btn.disabled = false;
  }
}

document.getElementById('chat-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const input = document.getElementById('chat-input');
  const texto = input.value.trim();
  if (!texto) return;
  try {
    await sandboxFetch(`/casos/${casoId}/acao`, {
      method: 'POST',
      body: JSON.stringify({ acao: 'enviar_mensagem', texto }),
    });
    input.value = '';
    await loadCaso();
  } catch (err) {
    toast(err.message);
  }
});

document.getElementById('file-input').addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    await sandboxFetch(`/casos/${casoId}/acao`, {
      method: 'POST',
      body: JSON.stringify({
        acao: 'upload_documento',
        nome: file.name,
        tamanho: `${(file.size / 1024).toFixed(1)} KB`,
      }),
    });
    toast(`"${file.name}" anexado (simulado).`);
    await loadCaso();
  } catch (err) {
    toast(err.message);
  }
  e.target.value = '';
});

loadCaso();
