const API_BASE = window.location.origin;

export async function api(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const token = localStorage.getItem('arbitrajus_token');
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/api${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Erro ${res.status}`);
  }
  return data;
}

export const AuthAPI = {
  status: () => api('/auth/status'),
  login: (body) => api('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  signup: (body) => api('/auth/signup', { method: 'POST', body: JSON.stringify(body) }),
};

export const CasesAPI = {
  list: () => api('/cases'),
  get: (id) => api(`/cases/${id}`),
  create: (body) => api('/cases', { method: 'POST', body: JSON.stringify(body) }),
};

export const ProcedimentosAPI = {
  taxa: (tipo, valor) => api(`/procedimentos/taxa?tipo=${encodeURIComponent(tipo)}&valor=${encodeURIComponent(valor || 0)}`),
  create: (body) => api('/procedimentos', { method: 'POST', body: JSON.stringify(body) }),
  list: () => api('/procedimentos'),
  get: (id) => api(`/procedimentos/${id}`),
  acao: (id, acao) => api(`/procedimentos/${id}/acao`, { method: 'POST', body: JSON.stringify({ acao }) }),
  timeline: (id) => api(`/procedimentos/${id}/timeline`),
};

export const ContactAPI = {
  send: (body) => api('/contact', { method: 'POST', body: JSON.stringify(body) }),
};

export const PlansAPI = {
  list: () => api('/plans'),
};

export async function loadPublicConfig() {
  const res = await fetch(`${API_BASE}/api/config/public`);
  return res.json();
}
