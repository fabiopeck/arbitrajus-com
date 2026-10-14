import { listPerfis, saveSession } from './sandbox-core.js';
import { initLangSwitcher, applyI18n, onLangChange, t, langSwitcherHtml } from './i18n.js';

function ensureLangSwitcher() {
  if (document.getElementById('arbLangRoot')) return;
  const host = document.createElement('div');
  host.className = 'sandbox-lang-host';
  host.innerHTML = langSwitcherHtml('arbLangRoot');
  document.body.appendChild(host);
}

function renderPerfis() {
  const container = document.getElementById('sandbox-perfis');
  if (!container) return;
  const enter = t('sandbox.perfil.entrar') || 'Entrar';
  container.innerHTML = listPerfis()
    .map(
      (p) => `
  <button type="button" class="sandbox-perfil-pick" data-perfil="${p.id}">
    <span class="sandbox-perfil-pick-icon"><i class="fas ${p.icon}"></i></span>
    <span class="sandbox-perfil-pick-body">
      <strong>${p.label}</strong>
      <small>${p.nome} · ${p.desc}</small>
    </span>
    <span class="sandbox-perfil-pick-enter">${enter}</span>
    <i class="fas fa-chevron-right sandbox-perfil-pick-arrow" aria-hidden="true"></i>
  </button>`
    )
    .join('');
}

ensureLangSwitcher();
initLangSwitcher();
applyI18n(document);
renderPerfis();

onLangChange(() => {
  applyI18n(document);
  renderPerfis();
});

document.getElementById('sandbox-perfis')?.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-perfil]');
  if (!btn) return;
  saveSession(btn.dataset.perfil);
  window.location.href = '/frontend/pages/sandbox-portal.html';
});
