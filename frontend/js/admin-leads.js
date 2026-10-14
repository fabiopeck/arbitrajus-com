const API = '/api/leads';
const KEY_STORAGE = 'arb_outreach_admin_key';

function getKey() {
  return sessionStorage.getItem(KEY_STORAGE) || '';
}

function headers() {
  return {
    'Content-Type': 'application/json',
    'X-Admin-Key': getKey(),
  };
}

async function api(path, options = {}) {
  const res = await fetch(`${API}${path}`, { ...options, headers: { ...headers(), ...options.headers } });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro na API');
  return data;
}

function fmtCnpj(cnpj) {
  return cnpj || '-';
}

function faixaLabel(faixa) {
  return {
    quente: 'Quente ≥50/mês',
    morno: 'Morno ≥30/mês',
    monitorar: 'Monitorar',
    oportunidade_odr: 'Sem ODR (alvo)',
    usa_odr: 'Já tem ODR',
    sem_dado: 'Sem dado',
  }[faixa] || faixa;
}

function odrLabel(lead) {
  if (lead.odr_privado === 'nenhum') return 'Não usa ODR';
  if (lead.odr_privado === 'proprio') return 'ODR próprio';
  if (lead.odr_privado === 'legaltech') return 'Legaltech';
  if (lead.odr_privado === 'camara') return 'Câmara';
  return lead.odr_privado;
}

function renderStats(stats) {
  document.getElementById('admin-stats').innerHTML = `
    <div class="admin-stat"><strong>${stats.total}</strong><span>Empresas</span></div>
    <div class="admin-stat"><strong>${stats.sem_odr}</strong><span>Sem ODR privado</span></div>
    <div class="admin-stat"><strong>${stats.quentes}</strong><span>Quentes ≥50/mês</span></div>
    <div class="admin-stat"><strong>${stats.mornos}</strong><span>Mornos ≥30/mês</span></div>
    <div class="admin-stat"><strong>${stats.oportunidade_odr}</strong><span>Alvo sem volume</span></div>
    <div class="admin-stat"><strong>${stats.mapeados_datajud}</strong><span>Já consultadas</span></div>
  `;
}

function renderBanner(status) {
  const d = status.datajud || {};
  const ok = d.ok ? 'DataJud online' : `DataJud indisponível: ${d.error || 'erro'}`;
  document.getElementById('datajud-banner').innerHTML = `
    <strong>${ok}.</strong>
    ${d.aviso || ''}
    A lista abaixo já filtra quem <em>não</em> usa ODR privado, o cliente típico da ARBITRAJUS.
  `;
}

function renderScan(job) {
  const el = document.getElementById('scan-progress');
  if (!job || job.status === 'idle') {
    el.textContent = 'Nenhum mapeamento rodando.';
    return;
  }
  if (job.status === 'running') {
    el.textContent = `Mapeando ${job.current}/${job.total}: ${job.empresa || ''} @ ${job.tribunal || '...'}`;
    return;
  }
  if (job.status === 'error') {
    el.textContent = `Erro no mapeamento: ${job.error}`;
    return;
  }
  el.textContent = `Concluído (${job.total} empresas). Última execução: ${new Date(job.finished_at).toLocaleString('pt-BR')}`;
}

function renderTable(leads) {
  const tbody = document.getElementById('admin-table-body');
  if (!leads.length) {
    tbody.innerHTML = '<tr><td colspan="8">Nenhum lead neste filtro.</td></tr>';
    return;
  }
  tbody.innerHTML = leads.map((l) => {
    const media = l.datajud?.media_mensal ?? '-';
    const total = l.datajud?.processos_12m ?? '-';
    const title = l.odr_detalhe || l.razao_social;
    return `
      <tr>
        <td>
          <strong>${l.nome}</strong><br>
          <small>${l.uf} · ${l.porte} · ${l.razao_social}</small>
        </td>
        <td>${fmtCnpj(l.cnpj)}</td>
        <td>${l.setor}</td>
        <td>${total}</td>
        <td>${media}</td>
        <td title="${title}"><span class="lead-badge ${l.odr_privado === 'nenhum' ? 'gap' : 'odr'}">${odrLabel(l)}</span></td>
        <td><span class="lead-badge ${l.faixa_comercial}">${faixaLabel(l.faixa_comercial)}</span></td>
        <td><strong>${l.prioridade}</strong></td>
      </tr>
    `;
  }).join('');
}

function queryString() {
  const params = new URLSearchParams();
  const q = document.getElementById('q').value.trim();
  const setor = document.getElementById('setor').value;
  const odr = document.getElementById('odr').value;
  const faixa = document.getElementById('faixa').value;
  if (q) params.set('q', q);
  if (setor) params.set('setor', setor);
  if (odr) params.set('odr', odr);
  if (faixa) params.set('faixa', faixa);
  const s = params.toString();
  return s ? `?${s}` : '';
}

async function loadAll() {
  const [status, list] = await Promise.all([
    api('/status'),
    api(`/${queryString()}`),
  ]);
  renderBanner(status);
  renderStats(list.stats);
  renderScan(list.scan);
  renderTable(list.leads);
  return list.scan;
}

let pollTimer;

function pollScan() {
  clearInterval(pollTimer);
  pollTimer = setInterval(async () => {
    try {
      const job = await api('/scan');
      renderScan(job);
      if (job.status !== 'running') {
        clearInterval(pollTimer);
        await loadAll();
      }
    } catch {
      clearInterval(pollTimer);
    }
  }, 1500);
}

async function connect() {
  const key = document.getElementById('admin-key').value.trim() || getKey();
  if (!key) return;
  sessionStorage.setItem(KEY_STORAGE, key);
  try {
    const scan = await loadAll();
    document.getElementById('admin-panel').hidden = false;
    if (scan?.status === 'running') pollScan();
  } catch (err) {
    sessionStorage.removeItem(KEY_STORAGE);
    document.getElementById('scan-progress').textContent = `Erro: ${err.message}`;
    alert(err.message);
  }
}

document.getElementById('admin-save-key')?.addEventListener('click', connect);

['q', 'setor', 'odr', 'faixa'].forEach((id) => {
  document.getElementById(id)?.addEventListener('change', () => loadAll().catch(() => {}));
});
document.getElementById('q')?.addEventListener('keyup', (e) => {
  if (e.key === 'Enter') loadAll().catch(() => {});
});

async function startScan(modo) {
  try {
    await api('/scan', { method: 'POST', body: JSON.stringify({ modo }) });
    pollScan();
  } catch (err) {
    alert(err.message);
  }
}

document.getElementById('btn-scan-rapido')?.addEventListener('click', () => startScan('rapido'));
document.getElementById('btn-scan-amplo')?.addEventListener('click', () => startScan('amplo'));
document.getElementById('btn-refresh')?.addEventListener('click', () => loadAll().catch((err) => alert(err.message)));

document.getElementById('btn-add')?.addEventListener('click', async () => {
  try {
    await api('/', {
      method: 'POST',
      body: JSON.stringify({
        nome: document.getElementById('new-nome').value,
        razao_social: document.getElementById('new-razao').value,
        cnpj: document.getElementById('new-cnpj').value,
        setor: document.getElementById('new-setor').value,
        uf: document.getElementById('new-uf').value,
        odr_privado: 'nenhum',
      }),
    });
    document.getElementById('new-nome').value = '';
    document.getElementById('new-razao').value = '';
    document.getElementById('new-cnpj').value = '';
    await loadAll();
  } catch (err) {
    alert(err.message);
  }
});

if (getKey()) {
  document.getElementById('admin-key').value = getKey();
  connect();
}
