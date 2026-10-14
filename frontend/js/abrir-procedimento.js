import { ProcedimentosAPI } from './api.js';
import { t, getLang, initLangSwitcher, langSwitcherHtml, applyI18n, onLangChange } from './i18n.js';

const root = document.getElementById('arbLangRoot');
if (root) {
  root.outerHTML = langSwitcherHtml('arbLangRoot');
  initLangSwitcher(document.getElementById('arbLangRoot'));
} else {
  applyI18n(document);
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

function tipoLabels() {
  return {
    conciliacao: t('proc.type.conciliacao') || 'Conciliation',
    mediacao: t('proc.type.mediacao') || 'Mediation',
    arbitragem: t('proc.type.arbitragem') || 'Arbitration',
  };
}

function estimateFeeUsd(valor) {
  const v = Number(valor) || 0;
  if (v <= 0) return 99;
  if (v <= 5000) return 149;
  if (v <= 25000) return 299;
  if (v <= 100000) return 499;
  return Math.min(1499, Math.round(v * 0.015));
}

function formatMoney(amount) {
  const lang = getLang() === 'pt' ? 'pt-BR' : 'en-US';
  const currency = getLang() === 'pt' ? 'BRL' : 'USD';
  return amount.toLocaleString(lang, { style: 'currency', currency });
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
      showError(t('proc.error.tipo') || 'Select a procedure type.');
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

  const token = localStorage.getItem('arbitrajus_token');
  if (token) {
    try {
      const data = await ProcedimentosAPI.taxa(tipo, valor);
      const amount = data.taxa_plataforma ?? estimateFeeUsd(valor);
      taxaEl.textContent = formatMoney(Number(amount));
      return;
    } catch {
      /* fall through to local estimate */
    }
  }
  taxaEl.textContent = formatMoney(estimateFeeUsd(valor));
}

function updateResumo() {
  const fd = new FormData(form);
  const tipo = fd.get('tipo');
  const labels = tipoLabels();
  resumoEl.innerHTML = `
    <div><span>${t('proc.resumo.tipo') || 'Type'}</span><strong>${labels[tipo] || tipo}</strong></div>
    <div><span>${t('proc.resumo.titulo') || 'Title'}</span><strong>${fd.get('titulo')}</strong></div>
    <div><span>${t('proc.resumo.parte') || 'Opposing party'}</span><strong>${fd.get('parte_contraria')}</strong></div>
    <div><span>${t('proc.resumo.email') || 'Email'}</span><strong>${fd.get('parte_contraria_email')}</strong></div>
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

onLangChange(() => {
  applyI18n(document);
  if (currentStep === totalSteps) updateResumo();
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!validateStep(currentStep)) return;

  const submitLabel = t('proc.submit') || 'Pay fee and file case';
  btnSubmit.disabled = true;
  btnSubmit.textContent = getLang() === 'pt' ? 'Abrindo...' : 'Filing...';
  hideError();

  const fd = new FormData(form);
  const token = localStorage.getItem('arbitrajus_token');

  try {
    let protocolo;
    let casoId = null;
    let statusText;

    if (token) {
      const data = await ProcedimentosAPI.create({
        titulo: fd.get('titulo'),
        descricao: fd.get('descricao'),
        tipo: fd.get('tipo'),
        valor_causa: fd.get('valor_causa') ? Number(fd.get('valor_causa')) : null,
        parte_contraria: fd.get('parte_contraria'),
        parte_contraria_email: fd.get('parte_contraria_email'),
        area: fd.get('area'),
      });
      protocolo = data.caso.protocolo;
      casoId = data.caso.id;
      statusText =
        getLang() === 'pt'
          ? `Status: ${data.status_label || data.caso.status}. Próximo passo: confirmar pagamento no painel.`
          : `Status: ${data.status_label || data.caso.status}. Next: confirm payment so we can notify the opposing party.`;
    } else {
      // Static / guest flow: keep the form usable without login redirect
      protocolo = `ARB-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
      statusText =
        getLang() === 'pt'
          ? 'Caso registrado. Após o pagamento, a outra parte será notificada automaticamente.'
          : 'Case drafted. After payment, the opposing party will be notified automatically.';
      try {
        sessionStorage.setItem(
          'arbitrajus_draft_case',
          JSON.stringify({
            protocolo,
            titulo: fd.get('titulo'),
            tipo: fd.get('tipo'),
            parte_contraria: fd.get('parte_contraria'),
            parte_contraria_email: fd.get('parte_contraria_email'),
            valor_causa: fd.get('valor_causa'),
            createdAt: new Date().toISOString(),
          })
        );
      } catch {
        /* ignore */
      }
    }

    panels.forEach((p) => p.classList.remove('active'));
    nav.hidden = true;
    successEl.hidden = false;
    document.getElementById('success-protocolo').textContent = protocolo;
    document.getElementById('success-status').textContent = statusText;
    const link = document.getElementById('success-caso-link');
    if (casoId) link.href = `caso.html?id=${casoId}`;
    else link.href = `login.html?redirect=${encodeURIComponent('/frontend/pages/dashboard.html')}`;
  } catch (err) {
    showError(err.message);
    btnSubmit.disabled = false;
    btnSubmit.textContent = submitLabel;
  }
});

updateUI();
