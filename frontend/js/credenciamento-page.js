const API = '/api/credenciamento';

function showAlert(el, message, type = 'success') {
  el.hidden = false;
  el.textContent = message;
  el.className = `cred-alert cred-alert--${type}`;
}

document.getElementById('cred-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const alert = document.getElementById('cred-alert');
  const form = e.target;
  const btn = form.querySelector('.cred-submit');
  btn.disabled = true;

  const payload = Object.fromEntries(new FormData(form));
  payload.consentimento_lgpd = form.consentimento_lgpd.checked;

  try {
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao enviar');

    showAlert(alert, `${data.message} Você pode gerenciar seus dados em descadastro.html`, 'success');
    form.reset();
  } catch (err) {
    showAlert(alert, err.message, 'error');
  } finally {
    btn.disabled = false;
  }
});
