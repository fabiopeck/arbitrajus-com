const API = '/api/outreach';
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

function log(msg) {
  const el = document.getElementById('admin-log');
  el.textContent = `${new Date().toLocaleTimeString('pt-BR')}: ${msg}\n` + el.textContent;
}

async function api(path, options = {}) {
  const res = await fetch(`${API}${path}`, { ...options, headers: { ...headers(), ...options.headers } });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro na API');
  return data;
}

function parseCsv(text) {
  const lines = text.trim().split('\n').filter(Boolean);
  if (lines.length < 2) throw new Error('CSV precisa de cabeçalho + ao menos 1 linha');
  const cols = lines[0].split(',').map((c) => c.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const parts = line.split(',');
    const row = {};
    cols.forEach((col, i) => { row[col] = parts[i]?.trim(); });
    return row;
  });
}

async function loadEmailStatus() {
  try {
    const status = await api('/email-status');
    document.getElementById('admin-email-status').innerHTML = `
      <strong>E-mail:</strong> ${status.provider} ·
      ${status.configured ? 'Configurado' : 'Pendente (configure RESEND_API_KEY)'} ·
      De: ${status.from}
    `;
  } catch (err) {
    document.getElementById('admin-email-status').textContent = `E-mail: ${err.message}`;
  }
}

async function loadStats() {
  const stats = await api('/stats');
  document.getElementById('admin-stats').innerHTML = `
    <div class="admin-stat"><strong>${stats.total}</strong><span>Total</span></div>
    <div class="admin-stat"><strong>${stats.contato_permitido}</strong><span>Contato permitido</span></div>
    <div class="admin-stat"><strong>${stats.cadastro_iniciado + stats.credenciado}</strong><span>Cadastrados</span></div>
    <div class="admin-stat"><strong>${stats.descadastrado + stats.excluido}</strong><span>Opt-out / excluídos</span></div>
  `;
}

async function loadTable() {
  const rows = await api('/prospects?limit=200');
  const tbody = document.getElementById('admin-table-body');
  tbody.innerHTML = rows.map((r) => `
    <tr>
      <td>${r.nome}</td>
      <td>${r.email}</td>
      <td>${r.status}</td>
      <td>${r.convite_count || 0}</td>
      <td>${r.contato_permitido ? 'Sim' : 'Não'}</td>
    </tr>
  `).join('');
}

async function connect() {
  const key = document.getElementById('admin-key').value.trim();
  if (!key) return;
  sessionStorage.setItem(KEY_STORAGE, key);
  try {
    await loadEmailStatus();
    await loadStats();
    await loadTable();
    document.getElementById('admin-panel').hidden = false;
    log('Conectado.');
  } catch (err) {
    sessionStorage.removeItem(KEY_STORAGE);
    log(`Erro: ${err.message}`);
  }
}

document.getElementById('admin-save-key')?.addEventListener('click', connect);

document.getElementById('btn-import')?.addEventListener('click', async () => {
  try {
    const rows = parseCsv(document.getElementById('csv-input').value);
    const result = await api('/import', { method: 'POST', body: JSON.stringify({ rows }) });
    log(`Importados: ${result.imported}, ignorados: ${result.skipped}`);
    await loadEmailStatus();
    await loadStats();
    await loadTable();
  } catch (err) {
    log(`Importação: ${err.message}`);
  }
});

document.getElementById('btn-send')?.addEventListener('click', async () => {
  try {
    const result = await api('/enviar-convites', { method: 'POST', body: JSON.stringify({ limit: 20 }) });
    log(`${result.message} (modo: ${result.modo})`);
    await loadEmailStatus();
    await loadStats();
    await loadTable();
  } catch (err) {
    log(`Convites: ${err.message}`);
  }
});

document.getElementById('btn-purge')?.addEventListener('click', async () => {
  if (!confirm('Excluir prospects inativos há 60+ dias sem cadastro?')) return;
  try {
    const result = await api('/purge-inativos', { method: 'POST', body: JSON.stringify({ days: 60 }) });
    log(`Purge: ${result.purged} registro(s)`);
    await loadEmailStatus();
    await loadStats();
    await loadTable();
  } catch (err) {
    log(`Purge: ${err.message}`);
  }
});

document.getElementById('btn-refresh')?.addEventListener('click', async () => {
  await loadStats();
  await loadTable();
  log('Lista atualizada.');
});

if (getKey()) {
  document.getElementById('admin-key').value = getKey();
  connect();
}
