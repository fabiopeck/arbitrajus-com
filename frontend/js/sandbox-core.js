/**
 * ARBITRAJUS Sandbox - nucleo compartilhado (auth demo + API)
 */
import { t } from './i18n.js';

const PERFIS_BASE = {
  empresa: {
    id: 'empresa',
    labelKey: 'sandbox.perfil.empresa',
    descKey: 'sandbox.perfil.empresa.desc',
    icon: 'fa-building',
    nome: 'Ana Paula Ribeiro',
    org: 'Unimed Lavras',
    labelFallback: 'Juridico corporativo',
    descFallback: 'Metricas, aprovacao de minutas, ERP e relatorios.',
  },
  advogado: {
    id: 'advogado',
    labelKey: 'sandbox.perfil.advogado',
    descKey: 'sandbox.perfil.advogado.desc',
    icon: 'fa-scale-balanced',
    nome: 'Dr. Ricardo Mendes',
    org: 'OAB/MG 142.881',
    labelFallback: 'Advogado (patrono)',
    descFallback: 'Chat, propostas e upload de pecas.',
  },
  parte: {
    id: 'parte',
    labelKey: 'sandbox.perfil.parte',
    descKey: 'sandbox.perfil.parte.desc',
    icon: 'fa-user',
    nome: 'Maria Helena Costa',
    org: 'Beneficiaria',
    labelFallback: 'Parte autora',
    descFallback: 'Acompanha o caso e assina o acordo.',
  },
  arbitro: {
    id: 'arbitro',
    labelKey: 'sandbox.perfil.arbitro',
    descKey: 'sandbox.perfil.arbitro.desc',
    icon: 'fa-gavel',
    nome: 'Dr. Andre Kinzer',
    org: 'Corpo tecnico ARBITRAJUS',
    labelFallback: 'Arbitro / Mediador',
    descFallback: 'Audiencia virtual e homologacao.',
  },
};

function localizePerfil(base) {
  return {
    id: base.id,
    icon: base.icon,
    nome: base.nome,
    org: base.org,
    label: t(base.labelKey) || base.labelFallback,
    desc: t(base.descKey) || base.descFallback,
  };
}

/** Localized profiles map (recomputed each access via getters on demand) */
export const PERFIS = Object.fromEntries(
  Object.keys(PERFIS_BASE).map((id) => [id, localizePerfil(PERFIS_BASE[id])])
);

export function refreshPerfis() {
  for (const id of Object.keys(PERFIS_BASE)) {
    PERFIS[id] = localizePerfil(PERFIS_BASE[id]);
  }
  return PERFIS;
}

export function listPerfis() {
  refreshPerfis();
  return Object.values(PERFIS);
}

const SESSION_KEY = 'arbitrajus_sandbox_session';

export function saveSession(perfilId) {
  const perfil = PERFIS_BASE[perfilId];
  if (!perfil) return;
  localStorage.setItem(SESSION_KEY, JSON.stringify({ perfil: perfilId, desde: new Date().toISOString() }));
}

export function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function requireSession(redirect = '/frontend/pages/sandbox.html') {
  const s = getSession();
  if (!s?.perfil) {
    window.location.href = redirect;
    return null;
  }
  return s;
}

export async function sandboxFetch(path, options = {}) {
  const session = getSession();
  const headers = {
    'Content-Type': 'application/json',
    'X-Sandbox-Perfil': session?.perfil || 'empresa',
    ...(options.headers || {}),
  };
  const res = await fetch(`/api/sandbox${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

export function brl(n) {
  return Number(n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function etapaLabel(id, etapas) {
  return etapas?.find((e) => e.id === id)?.label || id;
}

export const RELATORIO_FORMATOS_LIST = [
  { id: 'csv', label: 'CSV', icon: 'fa-file-csv' },
  { id: 'txt', label: 'TXT', icon: 'fa-file-lines' },
  { id: 'xls', label: 'Excel', icon: 'fa-file-excel' },
  { id: 'pdf', label: 'PDF', icon: 'fa-file-pdf' },
];

export function relatorioUrl(formato) {
  return `/api/sandbox/relatorio.${formato}`;
}

export function downloadBlob(content, filename, mime) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadMinuta(caso, minuta, formato, brlFn) {
  const formatBrl = brlFn || brl;
  const baseName = `minuta-v${minuta.versao}-${caso.id}`;
  const texto = `TERMO DE ACORDO EXTRAJUDICIAL\n\nProcesso: ${caso.numero}\nAutor: ${caso.autor}\nReu: ${caso.reu}\n\n${minuta.titulo}\nValor: ${formatBrl(minuta.valor)}\nStatus: ${minuta.status}\nElaborado por: ${minuta.autor}\nEm: ${new Date(minuta.em).toLocaleString('pt-BR')}\n\nClausula 1: O reu compromete-se ao pagamento conforme valor acima.\nClausula 2: A parte autora da quitacao plena apos o pagamento.\nClausula 3: O acordo sera homologado na plataforma ARBITRAJUS.`;

  if (formato === 'csv') {
    const row = [caso.numero, caso.autor, caso.reu, minuta.titulo, minuta.valor, minuta.status, minuta.autor].join(',');
    downloadBlob('\uFEFFprocesso,autor,reu,titulo,valor,status,autor\n' + row, `${baseName}.csv`, 'text/csv;charset=utf-8');
    return;
  }
  if (formato === 'txt') {
    downloadBlob('\uFEFF' + texto, `${baseName}.txt`, 'text/plain;charset=utf-8');
    return;
  }
  if (formato === 'xls') {
    const xml = `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Minuta"><Table><Row><Cell><Data ss:Type="String">${texto.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</Data></Cell></Row></Table></Worksheet></Workbook>`;
    downloadBlob('\uFEFF' + xml, `${baseName}.xls`, 'application/vnd.ms-excel;charset=utf-8');
    return;
  }
  if (formato === 'pdf') {
    downloadBlob('\uFEFF' + texto, `${baseName}.txt`, 'text/plain;charset=utf-8');
    toast('PDF da minuta: use Exportar PDF no painel de relatorios ou salve como PDF pelo navegador.');
  }
}

export function toast(msg) {
  const el = document.createElement('div');
  el.className = 'sandbox-toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}
