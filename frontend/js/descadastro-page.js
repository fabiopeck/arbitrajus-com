const API = '/api/credenciamento';

function showAlert(message, type = 'success') {
  const el = document.getElementById('desc-alert');
  el.hidden = false;
  el.textContent = message;
  el.className = `cred-alert cred-alert--${type}`;
}

function getTokenFromUrl() {
  return new URLSearchParams(window.location.search).get('t') || '';
}

async function initFromToken() {
  const token = getTokenFromUrl();
  if (!token) return;

  document.getElementById('desc-token').value = token;
  document.getElementById('excl-token').value = token;

  try {
    const res = await fetch(`${API}/token/${token}`);
    if (res.ok) {
      const data = await res.json();
      document.getElementById('desc-email').placeholder = data.email;
      document.getElementById('excl-email').placeholder = data.email;
    }
  } catch {
    /* token inválido: usuário pode usar e-mail */
  }
}

document.getElementById('desc-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const body = {
    token: fd.get('token') || undefined,
    email: fd.get('email') || undefined,
  };
  if (!body.token && !body.email) {
    showAlert('Informe o e-mail ou use o link recebido por convite.', 'error');
    return;
  }
  try {
    const res = await fetch(`${API}/descadastro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    showAlert(data.message, 'success');
  } catch (err) {
    showAlert(err.message, 'error');
  }
});

document.getElementById('excl-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!confirm('Confirma a solicitação de exclusão definitiva dos seus dados?')) return;

  const fd = new FormData(e.target);
  const body = {
    token: fd.get('token') || undefined,
    email: fd.get('email') || undefined,
    motivo: fd.get('motivo') || undefined,
  };
  if (!body.token && !body.email) {
    showAlert('Informe o e-mail ou use o link recebido por convite.', 'error');
    return;
  }
  try {
    const res = await fetch(`${API}/exclusao-dados`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    showAlert(data.message, 'success');
  } catch (err) {
    showAlert(err.message, 'error');
  }
});

initFromToken();
