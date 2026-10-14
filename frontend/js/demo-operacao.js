const ADMIN_KEY = 'sua-chave-secreta-longa';

const EMPRESAS = [
  { nome: 'Unimed Lavras', setor: 'saude', cnpj: '23.107.215/0001-10' },
  { nome: 'Santa Casa de Lavras', setor: 'saude', cnpj: '22.228.370/0001-00' },
  { nome: 'Rex Supermercados', setor: 'varejo', cnpj: '19.526.441/0001-90' },
  { nome: 'Cooxupe', setor: 'agronegocio', cnpj: '20.770.566/0001-00' },
  { nome: 'Autotrans / Circullare', setor: 'transporte', cnpj: '21.270.007/0001-05' },
];

const TIMELINE = [
  { hora: '08:00', texto: 'Varredura diaria DataJud (4 comarcas Sul de Minas).' },
  { hora: '08:02', texto: 'Novos processos catalogados e alertas enviados ao Telegram.' },
  { hora: '09:15', texto: 'Processo 5001847-33.2026.8.13.1820 aberto no portal Unimed Lavras.' },
  { hora: '10:40', texto: 'Robo ODR enviou proposta de acordo R$ 12.500,00.' },
  { hora: '14:20', texto: 'Minuta aguardando aval do juridico corporativo.' },
  { hora: '16:00', texto: 'Webhook Projuris pronto para disparo ao fechar acordo.' },
];

const logEl = document.getElementById('demo-log');
const modal = document.getElementById('demo-modal');
const modalBody = document.getElementById('demo-modal-body');

function log(msg) {
  const line = `[${new Date().toLocaleTimeString('pt-BR')}] ${msg}`;
  logEl.textContent = `${logEl.textContent}${logEl.textContent ? '\n' : ''}${line}`;
  logEl.scrollTop = logEl.scrollHeight;
}

function setStatus(key, text, state = 'ok') {
  const card = document.querySelector(`[data-key="${key}"]`);
  if (!card) return;
  card.querySelector('strong').textContent = text;
  card.classList.remove('ok', 'warn', 'err');
  card.classList.add(state);
}

function renderEmpresas() {
  document.getElementById('demo-empresas').innerHTML = EMPRESAS.map((e) => `
    <li><strong>${e.nome}</strong><br><span>${e.setor} | CNPJ ${e.cnpj}</span></li>
  `).join('');
}

function renderTimeline() {
  document.getElementById('demo-timeline').innerHTML = TIMELINE.map((t) => `
    <li><time>${t.hora}</time>${t.texto}</li>
  `).join('');
}

function openModal(html) {
  modalBody.innerHTML = html;
  modal.classList.add('open');
}

function closeModal() {
  modal.classList.remove('open');
}

function entrarDemo() {
  localStorage.setItem('arbitrajus_token', 'demo-token');
  localStorage.setItem('arbitrajus_user', JSON.stringify({
    email: 'juridico@unimedlavras.com.br',
    user_metadata: { full_name: 'Juridico Unimed Lavras' },
  }));
  log('Sessao demo iniciada como Juridico Unimed Lavras.');
  window.location.href = '/frontend/pages/dashboard.html';
}

async function checkHealth() {
  try {
    const r = await fetch('/api/health');
    const d = await r.json();
    setStatus('api', d.status === 'ok' ? 'Online' : 'Instavel', d.status === 'ok' ? 'ok' : 'warn');
    log(`API: ${d.service} v${d.version}`);
  } catch {
    setStatus('api', 'Offline', 'err');
    log('API: offline');
  }

  try {
    const r = await fetch('/api/integracao/health');
    const d = await r.json();
    setStatus('integracao', d.status === 'ok' ? 'Pronta' : 'Indisponivel', d.status === 'ok' ? 'ok' : 'warn');
    log('Integracao ERP: endpoints ativos.');
  } catch {
    setStatus('integracao', 'Offline', 'err');
  }

  try {
    const r = await fetch('/api/integracao/monitor/status', {
      headers: { 'X-Api-Key': ADMIN_KEY },
    });
    const d = await r.json();
    const total = d.stats?.total_vistos ?? 0;
    setStatus('monitor', `${total} processos catalogados`, 'ok');
    log(`Robo DataJud: ${d.alvos?.length || 5} empresas referencia, ${total} vistos.`);
  } catch {
    setStatus('monitor', 'Modo demo', 'warn');
    log('Robo: status local indisponivel (normal se API acabou de subir).');
  }
}

async function simularWebhook() {
  log('Disparando simulacao Projuris/Benner...');
  try {
    const r = await fetch('/api/integracao/simular/projuris', {
      method: 'POST',
      headers: { 'X-Api-Key': ADMIN_KEY },
    });
    const d = await r.json();
    log('Webhook simulado com sucesso.');
    openModal(`
      <h3 style="margin-top:0;font-family:Cinzel;color:#001428;">Payload enviado ao ERP</h3>
      <p style="color:#64748b;font-size:0.9rem;">Simulacao de acordo concluido para Unimed Lavras.</p>
      <pre>${JSON.stringify(d.payload, null, 2)}</pre>
    `);
  } catch (err) {
    log(`Erro webhook: ${err.message}`);
    openModal(`<p>Nao foi possivel simular. Verifique se o servidor local esta rodando.</p>`);
  }
}

document.getElementById('btn-dashboard')?.addEventListener('click', entrarDemo);
document.getElementById('btn-webhook')?.addEventListener('click', simularWebhook);
document.getElementById('btn-clear-log')?.addEventListener('click', () => { logEl.textContent = ''; });
document.getElementById('demo-modal-close')?.addEventListener('click', closeModal);
modal?.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

renderEmpresas();
renderTimeline();
log('Painel de demonstracao carregado.');
checkHealth();
