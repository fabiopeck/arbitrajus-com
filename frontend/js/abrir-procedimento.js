import { ProcedimentosAPI } from './api.js';

const token = localStorage.getItem('arbitrajus_token');
if (!token) {
  const redirect = encodeURIComponent(window.location.pathname + window.location.search);
  window.location.href = `/frontend/pages/login.html?redirect=${redirect}`;
}

const form = document.getElementById('proc-form');
const panels = [...document.querySelectorAll('.proc-panel')];
const steps = [...document.querySelectorAll('.proc-step')];
const btnPrev = document.getElementById('proc-prev');
const btnNext = document.getElementById('proc-next');
const btnSubmit = document.getElementById('proc-submit');
const nav = document.getElementById('proc-nav');
const successEl = document.getElementById('proc-success');
const errorEl = document.getElementById('proc-error');
const resumoEl = document.getElementById('proc-resumo');
const taxaEl = document.getElementById('proc-taxa');

let currentStep = 1;
const totalSteps = 4;

function showError(msg) {
  errorEl.textContent = msg;
  errorEl.hidden = false;
}

function hideError() {
  errorEl.hidden = true;
}

function updateUI() {
  panels.forEach((p) => p.classList.toggle('active', Number(p.dataset.panel) === currentStep));
  steps.forEach((s) => {
    const n = Number(s.dataset.step);
    s.classList.toggle('active', n === currentStep);
    s.classList.toggle('done', n < currentStep);
  });
  btnPrev.disabled = currentStep === 1;
  btnNext.style.display = currentStep < totalSteps ? 'inline-flex' : 'none';
  btnSubmit.hidden = currentStep !== totalSteps;
  if (currentStep === totalSteps) updateResumo();
}

function validateStep(step) {
  const panel = panels.find((p) => Number(p.dataset.panel) === step);
  const fields = panel.querySelectorAll('input, textarea, select');
  for (const field of fields) {
    if (!field.checkValidity()) {
      field.reportValidity();
      return false;
    }
  }
  if (step === 1) {
    const tipo = form.querySelector('[name="tipo"]:checked');
    if (!tipo) {
      showError('Selecione o tipo de procedimento.');
      return false;
    }
  }
  hideError();
  return true;
}

async function fetchTaxa() {
  const fd = new FormData(form);
  const tipo = fd.get('tipo');
  const valor = fd.get('valor_causa') || 0;
  if (!tipo) return;
  try {
    const data = await ProcedimentosAPI.taxa(tipo, valor);
    taxaEl.textContent = data.taxa_plataforma.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  } catch {
    taxaEl.textContent = 'Consulte após seleção';
  }
}

function updateResumo() {
  const fd = new FormData(form);
  const tipo = fd.get('tipo');
  const labels = { conciliacao: 'Conciliação', mediacao: 'Mediação', arbitragem: 'Arbitragem' };
  resumoEl.innerHTML = `
    <div><span>Tipo</span><strong>${labels[tipo] || tipo}</strong></div>
    <div><span>Título</span><strong>${fd.get('titulo')}</strong></div>
    <div><span>Parte contrária</span><strong>${fd.get('parte_contraria')}</strong></div>
    <div><span>E-mail</span><strong>${fd.get('parte_contraria_email')}</strong></div>
  `;
  fetchTaxa();
}

btnNext.addEventListener('click', () => {
  if (!validateStep(currentStep)) return;
  if (currentStep < totalSteps) {
    currentStep += 1;
    updateUI();
  }
});

btnPrev.addEventListener('click', () => {
  if (currentStep > 1) {
    currentStep -= 1;
    updateUI();
  }
});

form.querySelector('[name="valor_causa"]')?.addEventListener('change', fetchTaxa);
form.querySelectorAll('[name="tipo"]').forEach((r) => r.addEventListener('change', fetchTaxa));

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!validateStep(currentStep)) return;

  btnSubmit.disabled = true;
  btnSubmit.textContent = 'Abrindo...';
  hideError();

  const fd = new FormData(form);
  try {
    const data = await ProcedimentosAPI.create({
      titulo: fd.get('titulo'),
      descricao: fd.get('descricao'),
      tipo: fd.get('tipo'),
      valor_causa: fd.get('valor_causa') ? Number(fd.get('valor_causa')) : null,
      parte_contraria: fd.get('parte_contraria'),
      parte_contraria_email: fd.get('parte_contraria_email'),
      area: fd.get('area'),
    });

    panels.forEach((p) => p.classList.remove('active'));
    nav.hidden = true;
    successEl.hidden = false;
    document.getElementById('success-protocolo').textContent = data.caso.protocolo;
    document.getElementById('success-status').textContent =
      `Status: ${data.status_label || data.caso.status}. Próximo passo: confirmar pagamento no painel do procedimento.`;

    const token = localStorage.getItem('arbitrajus_token');
    document.getElementById('success-caso-link').href = `caso.html?id=${data.caso.id}`;
  } catch (err) {
    showError(err.message);
    btnSubmit.disabled = false;
    btnSubmit.textContent = 'Confirmar e abrir';
  }
});

updateUI();
