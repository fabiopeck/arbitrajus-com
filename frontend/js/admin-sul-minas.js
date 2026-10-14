const API = '/api/leads';
const KEY_STORAGE = 'arb_outreach_admin_key';

function getKey() {
  return sessionStorage.getItem(KEY_STORAGE) || '';
}

function headers() {
  return { 'Content-Type': 'application/json', 'X-Admin-Key': getKey() };
}

async function api(path, options = {}) {
  const res = await fetch(`${API}${path}`, { ...options, headers: { ...headers(), ...options.headers } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Erro na API');
  return data;
}

function log(msg) {
  document.getElementById('log').textContent = `${new Date().toLocaleTimeString('pt-BR')}: ${msg}`;
}

function txt(value) {
  return String(value ?? '').replace(/\u2014|\u2013/g, ',').replace(/,\s*,/g, ',').trim();
}

function faixaLabel(faixa) {
  return {
    quente: 'Quente ≥50/mês',
    morno: 'Morno ≥30/mês',
    monitorar: 'Abaixo de 30/mês',
    usa_odr: 'Já tem ODR',
    sem_dado: 'Sem extração',
  }[faixa] || faixa;
}

let cache = { municipios: [], empresas: [], alvos: [], extraido_em: null, stats: {}, aviso: '', periodo: null };

function renderStats(stats, extraido) {
  document.getElementById('admin-stats').innerHTML = `
    <div class="admin-stat"><strong>${stats.municipios || 0}</strong><span>Comarcas</span></div>
    <div class="admin-stat"><strong>${stats.sem_odr || 0}</strong><span>Alvos sem ODR</span></div>
    <div class="admin-stat"><strong>${stats.comarcas_quente || 0}</strong><span>Comarcas ≥50 cíveis/mês</span></div>
    <div class="admin-stat"><strong>${(stats.civel_12m || 0).toLocaleString('pt-BR')}</strong><span>Cíveis na região (12m)</span></div>
    <div class="admin-stat"><strong>${extraido ? new Date(extraido).toLocaleDateString('pt-BR') : '-'}</strong><span>Última extração</span></div>
  `;
}

function renderCidades(municipios) {
  const tbody = document.getElementById('tbody-cidades');
  tbody.innerHTML = municipios.map((m, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><strong>${m.cidade}</strong><br><small>${m.micro}</small></td>
      <td>${Number(m.civel_12m || 0).toLocaleString('pt-BR')}</td>
      <td><strong>${m.civel_media_mensal ?? '-'}</strong></td>
      <td>${Number(m.total_12m || 0).toLocaleString('pt-BR')}</td>
      <td><span class="lead-badge ${m.faixa}">${faixaLabel(m.faixa)}</span></td>
    </tr>
  `).join('') || '<tr><td colspan="6">Clique em extrair para puxar o DataJud.</td></tr>';
}

function empresasFiltradas() {
  const q = document.getElementById('q').value.trim().toLowerCase();
  const setor = document.getElementById('setor').value;
  const odr = document.getElementById('odr').value;
  const base = odr === 'todos' ? cache.empresas : cache.alvos;
  return base.filter((e) => {
    if (setor && e.setor !== setor) return false;
    if (!q) return true;
    return `${e.nome} ${e.cidade} ${e.cnpj} ${e.setor}`.toLowerCase().includes(q);
  });
}

function renderEmpresas() {
  const rows = empresasFiltradas();
  document.getElementById('tbody-empresas').innerHTML = rows.map((e) => `
    <tr>
      <td>
        <strong>${txt(e.nome)}</strong><br>
        <small>${txt(e.cnpj) || 'CNPJ a completar'} | ${txt(e.odr_detalhe || e.razao_social)}</small>
      </td>
      <td>${e.cidade}</td>
      <td>${e.setor}</td>
      <td><strong>${e.comarca_civel_media_mensal ?? '-'}</strong><br><small>${Number(e.comarca_civel_12m || 0).toLocaleString('pt-BR')} no ano</small></td>
      <td><span class="lead-badge ${e.odr_privado === 'nenhum' ? 'gap' : 'odr'}">${e.odr_privado === 'nenhum' ? 'Não usa ODR' : 'Já tem ODR'}</span></td>
      <td>
        <select data-id="${e.id}" class="status-select">
          <option value="monitorar" ${e.status_interno === 'monitorar' ? 'selected' : ''}>Monitorar</option>
          <option value="abordar" ${e.status_interno === 'abordar' ? 'selected' : ''}>Abordar</option>
          <option value="em_conversa" ${e.status_interno === 'em_conversa' ? 'selected' : ''}>Em conversa</option>
          <option value="desqualificado" ${e.status_interno === 'desqualificado' ? 'selected' : ''}>Desqualificado</option>
        </select>
      </td>
    </tr>
  `).join('') || '<tr><td colspan="6">Nenhum alvo neste filtro.</td></tr>';

  document.querySelectorAll('.status-select').forEach((sel) => {
    sel.onchange = async () => {
      try {
        cache = await api(`/sul-minas/empresas/${sel.dataset.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ status_interno: sel.value }),
        });
        paint();
        log(`Status atualizado: ${sel.value}`);
      } catch (err) {
        alert(err.message);
      }
    };
  });
}

function fillCidadesSelect() {
  const sel = document.getElementById('new-ibge');
  const list = cache.municipios.length ? cache.municipios : [];
  sel.innerHTML = list.map((m) => `<option value="${m.ibge}">${m.cidade}</option>`).join('')
    || '<option value="">Extraia primeiro</option>';
}

function paint() {
  document.getElementById('aviso').textContent = cache.aviso || '';
  renderStats(cache.stats || {}, cache.extraido_em);
  renderCidades(cache.municipios || []);
  renderEmpresas();
  fillCidadesSelect();
}

async function load() {
  cache = await api('/sul-minas');
  paint();
  if (cache.extraido_em) {
    log(`Dados carregados. Período ${cache.periodo?.from} → ${cache.periodo?.to}`);
  } else {
    log('Ainda sem extração. Clique no botão para puxar o TJMG.');
  }
}

async function connect() {
  const key = document.getElementById('admin-key').value.trim() || getKey();
  if (!key) return;
  sessionStorage.setItem(KEY_STORAGE, key);
  try {
    await load();
    document.getElementById('admin-panel').hidden = false;
  } catch (err) {
    sessionStorage.removeItem(KEY_STORAGE);
    document.getElementById('admin-key').value = 'sua-chave-secreta-longa';
    alert(err.message);
  }
}

document.getElementById('admin-save-key')?.addEventListener('click', connect);
document.getElementById('btn-refresh')?.addEventListener('click', () => load().catch((e) => alert(e.message)));
document.getElementById('q')?.addEventListener('input', renderEmpresas);
document.getElementById('setor')?.addEventListener('change', renderEmpresas);
document.getElementById('odr')?.addEventListener('change', renderEmpresas);

document.getElementById('btn-extrair')?.addEventListener('click', async () => {
  const btn = document.getElementById('btn-extrair');
  btn.disabled = true;
  log('Consultando DataJud/TJMG (pode levar alguns segundos)...');
  try {
    cache = await api('/sul-minas/extrair', { method: 'POST', body: JSON.stringify({}) });
    paint();
    log(`Extração ok. ${cache.stats.civel_12m.toLocaleString('pt-BR')} processos cíveis na região.`);
  } catch (err) {
    log(err.message);
    alert(err.message);
  } finally {
    btn.disabled = false;
  }
});

document.getElementById('btn-csv')?.addEventListener('click', () => {
  const url = `/api/leads/sul-minas/csv?key=${encodeURIComponent(getKey())}`;
  window.location.href = url;
});

document.getElementById('btn-add')?.addEventListener('click', async () => {
  try {
    cache = await api('/sul-minas/empresas', {
      method: 'POST',
      body: JSON.stringify({
        nome: document.getElementById('new-nome').value,
        cnpj: document.getElementById('new-cnpj').value,
        ibge: Number(document.getElementById('new-ibge').value),
        setor: document.getElementById('new-setor').value,
        odr_privado: 'nenhum',
      }),
    });
    document.getElementById('new-nome').value = '';
    document.getElementById('new-cnpj').value = '';
    paint();
    log('Empresa incluída no controle interno.');
  } catch (err) {
    alert(err.message);
  }
});

if (getKey()) {
  document.getElementById('admin-key').value = getKey();
  connect();
}
