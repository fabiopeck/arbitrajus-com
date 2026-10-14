import { ProcedimentosAPI } from './api.js';

const token = localStorage.getItem('arbitrajus_token');
if (!token) {
  window.location.href = '/frontend/pages/login.html';
}

const user = JSON.parse(localStorage.getItem('arbitrajus_user') || '{}');
document.getElementById('user-name').textContent =
  user.user_metadata?.full_name || user.email || 'Usuário';

document.getElementById('logout-btn')?.addEventListener('click', () => {
  localStorage.removeItem('arbitrajus_token');
  localStorage.removeItem('arbitrajus_user');
  localStorage.removeItem('arbitrajus_plan');
  window.location.href = '/frontend/pages/login.html';
});

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('pt-BR');
}

function renderCases(cases) {
  const tbody = document.getElementById('cases-tbody');
  if (!cases.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;">Nenhum procedimento ainda. <a href="abrir-procedimento.html">Abra o primeiro</a></td></tr>';
    return;
  }

  tbody.innerHTML = cases
    .map(
      (c) => `
    <tr class="case-row" data-id="${c.id}">
      <td><strong>${c.protocolo || c.id?.slice(0, 8)}</strong></td>
      <td>${c.titulo}</td>
      <td style="text-transform:capitalize;">${c.tipo}</td>
      <td><span class="badge-status ${c.status}">${(c.status || '').replace(/_/g, ' ')}</span></td>
      <td>${formatDate(c.created_at)}</td>
      <td><a href="caso.html?id=${c.id}" class="btn btn-outline btn-sm">Ver</a></td>
    </tr>`
    )
    .join('');

  document.getElementById('stat-total').textContent = cases.length;
  document.getElementById('stat-active').textContent = cases.filter((c) =>
    ['em_andamento', 'aguardando_partes', 'pagamento_pendente'].includes(c.status)
  ).length;
  document.getElementById('stat-done').textContent = cases.filter((c) => c.status === 'concluido').length;
}

async function loadCases() {
  try {
    const { procedimentos } = await ProcedimentosAPI.list();
    renderCases(procedimentos || []);
  } catch {
    try {
      const { cases } = await (await import('./api.js')).CasesAPI.list();
      renderCases(cases || []);
    } catch {
      renderCases([]);
    }
  }
}

document.getElementById('new-case-btn')?.addEventListener('click', () => {
  window.location.href = 'abrir-procedimento.html';
});

loadCases();
