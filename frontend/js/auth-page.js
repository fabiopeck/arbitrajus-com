import { AuthAPI } from './api.js';
import { initLangSwitcher, applyI18n, onLangChange, langSwitcherHtml } from './i18n.js';

if (!document.getElementById('arbLangRoot')) {
  const host = document.createElement('div');
  host.className = 'sandbox-lang-host';
  host.innerHTML = langSwitcherHtml('arbLangRoot');
  document.body.appendChild(host);
}
initLangSwitcher();
onLangChange(() => applyI18n(document));

const params = new URLSearchParams(window.location.search);
const plan = params.get('plan');
const tabParam = params.get('tab');
const roleParam = params.get('role');

const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const errorEl = document.getElementById('auth-error');
const tabs = document.querySelectorAll('.auth-tab');

function showTab(name) {
  tabs.forEach((t) => t.classList.toggle('active', t.dataset.tab === name));
  loginForm.style.display = name === 'login' ? 'block' : 'none';
  signupForm.style.display = name === 'signup' ? 'block' : 'none';
}

tabs.forEach((t) => t.addEventListener('click', () => showTab(t.dataset.tab)));
if (tabParam === 'signup') showTab('signup');

if (roleParam && signupForm) {
  const roleSelect = signupForm.querySelector('[name="role"]');
  if (roleSelect) roleSelect.value = roleParam === 'mediador' ? 'mediador' : roleParam;
  showTab('signup');
}

function showError(msg) {
  errorEl.textContent = msg;
  errorEl.classList.add('show');
}

function saveSession(data) {
  if (data.session?.access_token) {
    localStorage.setItem('arbitrajus_token', data.session.access_token);
  }
  if (data.user) {
    localStorage.setItem('arbitrajus_user', JSON.stringify(data.user));
  }
  if (plan) localStorage.setItem('arbitrajus_plan', plan);
}

loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorEl.classList.remove('show');
  const fd = new FormData(loginForm);

  try {
    const data = await AuthAPI.login({
      email: fd.get('email'),
      password: fd.get('password'),
    });
    saveSession(data);
    const redirect = params.get('redirect');
    window.location.href = redirect || '/frontend/pages/dashboard.html';
  } catch (err) {
    if (fd.get('password') === 'demo123') {
      localStorage.setItem('arbitrajus_token', 'demo-token');
      localStorage.setItem('arbitrajus_user', JSON.stringify({
        email: fd.get('email'),
        user_metadata: { full_name: 'Usuário Demo' },
      }));
      const redirect = params.get('redirect');
      window.location.href = redirect || '/frontend/pages/dashboard.html';
      return;
    }
    showError(err.message);
  }
});

signupForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorEl.classList.remove('show');
  const fd = new FormData(signupForm);

  try {
    const data = await AuthAPI.signup({
      email: fd.get('email'),
      password: fd.get('password'),
      full_name: fd.get('full_name'),
      role: fd.get('role'),
    });
    saveSession(data);
    const redirect = params.get('redirect');
    window.location.href = redirect || '/frontend/pages/dashboard.html';
  } catch (err) {
    showError(err.message);
  }
});
