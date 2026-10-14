const LAWYERS_URL = 'frontend/data/mock-advogados.json';

const lawyersState = {
  advogados: [],
  planos: [],
  regioes: [],
  funcoes: [],
  cursos: [],
  filters: {
    funcao: 'todas',
    area: 'todas',
    regiao: 'todas',
    estado: 'todas',
    cidade: 'todas',
    curso: 'todas',
    destaqueOnly: false,
  },
};

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

function starsHtml(rating) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  let html = '';
  for (let i = 1; i <= 5; i += 1) {
    if (i <= full) html += '<i class="fas fa-star" aria-hidden="true"></i>';
    else if (i === full + 1 && half) html += '<i class="fas fa-star-half-stroke" aria-hidden="true"></i>';
    else html += '<i class="far fa-star" aria-hidden="true"></i>';
  }
  return html;
}

function fillSelect(id, values, allLabel) {
  const el = document.getElementById(id);
  if (!el) return;
  const current = el.value;
  el.innerHTML =
    `<option value="todas">${esc(allLabel)}</option>` +
    values.map((v) => `<option value="${esc(v)}">${esc(v)}</option>`).join('');
  if ([...el.options].some((o) => o.value === current)) el.value = current;
}

function syncDependentFilters() {
  const { regiao, estado } = lawyersState.filters;
  let pool = lawyersState.advogados;
  if (regiao !== 'todas') pool = pool.filter((a) => a.regiao === regiao);
  fillSelect('arb-lawyers-estado', uniqueSorted(pool.map((a) => a.estado)), 'Todos');
  if (estado !== 'todas') pool = pool.filter((a) => a.estado === estado);
  fillSelect('arb-lawyers-cidade', uniqueSorted(pool.map((a) => a.cidade)), 'Todas');
}

function destaqueRank(adv) {
  if (adv.destaqueTipo === 'mensal') return 0;
  if (adv.destaqueTipo === 'semanal') return 1;
  if (adv.destaque) return 2;
  return 3;
}

function getFilteredLawyers() {
  const f = lawyersState.filters;
  return lawyersState.advogados
    .filter((a) => {
      if (f.funcao !== 'todas' && a.funcao !== f.funcao) return false;
      if (f.area !== 'todas' && !(a.areas || []).includes(f.area)) return false;
      if (f.regiao !== 'todas' && a.regiao !== f.regiao) return false;
      if (f.estado !== 'todas' && a.estado !== f.estado) return false;
      if (f.cidade !== 'todas' && a.cidade !== f.cidade) return false;
      if (f.curso !== 'todas' && a.curso !== f.curso) return false;
      if (f.destaqueOnly && !a.destaque) return false;
      return true;
    })
    .sort((a, b) => {
      const dr = destaqueRank(a) - destaqueRank(b);
      if (dr !== 0) return dr;
      return (b.rating || 0) - (a.rating || 0);
    });
}

function destaqueBadge(adv) {
  if (adv.destaqueTipo === 'mensal') {
    return '<span class="arb-vitrine-badge arb-vitrine-badge--mensal">Destaque mensal</span>';
  }
  if (adv.destaqueTipo === 'semanal') {
    return '<span class="arb-vitrine-badge arb-vitrine-badge--semanal">Destaque semanal</span>';
  }
  return '';
}

function lawyerCardHtml(adv) {
  const areas = (adv.areas || [])
    .slice(0, 3)
    .map((x) => `<span class="arb-vitrine-tag">${esc(x)}</span>`)
    .join('');
  const comment = (adv.comentarios || [])[0];
  const commentHtml = comment
    ? `<p class="arb-vitrine-comment">“${esc(comment.texto)}”</p>`
    : '';

  return `
    <article class="arb-vitrine-card${adv.destaque ? ' is-featured' : ''}${adv.destaqueTipo === 'mensal' ? ' is-mensal' : ''}${adv.destaqueTipo === 'semanal' ? ' is-semanal' : ''}" data-id="${esc(adv.id)}">
      <div class="arb-vitrine-photo">
        <img src="${esc(adv.foto)}" alt="" loading="lazy" decoding="async" width="400" height="520">
        ${destaqueBadge(adv)}
        <span class="arb-vitrine-funcao">${esc(adv.funcao)}</span>
        <span class="arb-vitrine-online ${adv.online ? 'is-on' : 'is-off'}" title="${adv.online ? 'Disponível online' : 'Offline'}">
          <i class="fas fa-circle" aria-hidden="true"></i> ${adv.online ? 'Online' : 'Offline'}
        </span>
        <div class="arb-vitrine-photo-meta">
          <strong>${esc(adv.nome)}</strong>
          <span>${esc(adv.cidade)}/${esc(adv.estado)}</span>
        </div>
      </div>
      <div class="arb-vitrine-body">
        <p class="arb-vitrine-oab">${esc(adv.oab)}</p>
        <div class="arb-vitrine-rating" aria-label="Avaliação ${esc(adv.rating)} de 5">
          <span class="arb-vitrine-stars">${starsHtml(adv.rating)}</span>
          <strong>${esc(Number(adv.rating).toFixed(1))}</strong>
          <span>(${esc(adv.avaliacoes)})</span>
        </div>
        <p class="arb-vitrine-curso"><i class="fas fa-graduation-cap" aria-hidden="true"></i> ${esc(adv.curso)}</p>
        <div class="arb-vitrine-tags">${areas}</div>
        <p class="arb-vitrine-stats">${esc(adv.sessoes)} sessões · ${esc(adv.regiao)}</p>
        ${commentHtml}
        <a class="arb-vitrine-cta" href="frontend/pages/credenciamento.html">Ver perfil</a>
      </div>
    </article>
  `;
}

function planCardHtml(plano) {
  const items = (plano.itens || [])
    .map((i) => `<li><i class="fas fa-check" aria-hidden="true"></i> ${esc(i)}</li>`)
    .join('');
  const classes = [
    'arb-plan-card',
    plano.destaque ? 'is-destaque' : '',
    plano.popular ? 'is-popular' : '',
    plano.id === 'destaque-mensal' ? 'is-mensal' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const periodo =
    plano.periodo && plano.periodo !== 'cadastro'
      ? `<span class="arb-plan-periodo">por ${esc(plano.periodo)}</span>`
      : `<span class="arb-plan-periodo">inclusão na vitrine</span>`;

  return `
    <article class="${classes}">
      ${plano.popular ? '<span class="arb-plan-tag">Mais vendido</span>' : ''}
      ${plano.id === 'destaque-mensal' ? '<span class="arb-plan-tag arb-plan-tag--gold">Melhor exposição</span>' : ''}
      <h4 class="arb-plan-name">${esc(plano.nome)}</h4>
      <p class="arb-plan-price">${esc(plano.preco)} ${periodo}</p>
      <ul class="arb-plan-list">${items}</ul>
      <a class="btn-arb ${plano.destaque ? 'btn-arb-primary' : 'btn-arb-outline'} arb-plan-cta" href="frontend/pages/credenciamento.html">
        ${plano.destaque ? 'Comprar destaque' : 'Cadastrar perfil'}
      </a>
    </article>
  `;
}

function renderSponsoredStrip(list) {
  const strip = document.getElementById('arb-vitrine-sponsored');
  const track = document.getElementById('arb-vitrine-sponsored-track');
  if (!strip || !track) return;

  const featured = list.filter((a) => a.destaque).slice(0, 8);
  if (!featured.length) {
    strip.hidden = true;
    track.innerHTML = '';
    return;
  }

  strip.hidden = false;
  track.innerHTML = featured
    .map(
      (a) => `
      <a class="arb-vitrine-sponsor-item" href="#advogado-${esc(a.id)}" data-scroll-lawyer="${esc(a.id)}">
        <img src="${esc(a.foto)}" alt="" width="64" height="64" loading="lazy">
        <span>
          <strong>${esc(a.nome.split(' ').slice(0, 2).join(' '))}</strong>
          <small>${esc(a.funcao)} · ${a.destaqueTipo === 'mensal' ? 'Mensal' : 'Semanal'}</small>
        </span>
      </a>`
    )
    .join('');
}

function renderLawyers() {
  const grid = document.getElementById('arb-lawyers-grid');
  const empty = document.getElementById('arb-lawyers-empty');
  const status = document.getElementById('arb-lawyers-status');
  if (!grid) return;

  const list = getFilteredLawyers();
  renderSponsoredStrip(list);
  grid.innerHTML = list
    .map((adv) => lawyerCardHtml(adv).replace('<article', `<article id="advogado-${esc(adv.id)}"`))
    .join('');

  if (empty) empty.hidden = list.length > 0;
  if (status) {
    const destaques = list.filter((a) => a.destaque).length;
    status.textContent = list.length
      ? `${list.length} profissionais · ${destaques} em destaque (semanal/mensal no topo)`
      : 'Nenhum resultado';
  }
}

function renderPlans() {
  const grid = document.getElementById('arb-lawyers-plans-grid');
  if (!grid) return;
  grid.innerHTML = lawyersState.planos.map(planCardHtml).join('');
}

function bindLawyerFilters() {
  const map = [
    ['arb-lawyers-funcao', 'funcao'],
    ['arb-lawyers-area', 'area'],
    ['arb-lawyers-regiao', 'regiao'],
    ['arb-lawyers-estado', 'estado'],
    ['arb-lawyers-cidade', 'cidade'],
    ['arb-lawyers-curso', 'curso'],
  ];

  map.forEach(([id, key]) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('change', () => {
      lawyersState.filters[key] = el.value || 'todas';
      if (key === 'regiao') {
        lawyersState.filters.estado = 'todas';
        lawyersState.filters.cidade = 'todas';
        syncDependentFilters();
        const est = document.getElementById('arb-lawyers-estado');
        const cid = document.getElementById('arb-lawyers-cidade');
        if (est) est.value = 'todas';
        if (cid) cid.value = 'todas';
      }
      if (key === 'estado') {
        lawyersState.filters.cidade = 'todas';
        syncDependentFilters();
        const cid = document.getElementById('arb-lawyers-cidade');
        if (cid) cid.value = 'todas';
      }
      renderLawyers();
    });
  });

  const destaque = document.getElementById('arb-lawyers-destaque-only');
  if (destaque) {
    destaque.addEventListener('change', () => {
      lawyersState.filters.destaqueOnly = destaque.checked;
      renderLawyers();
    });
  }

  const sponsored = document.getElementById('arb-vitrine-sponsored-track');
  if (sponsored) {
    sponsored.addEventListener('click', (event) => {
      const link = event.target.closest('[data-scroll-lawyer]');
      if (!link) return;
      event.preventDefault();
      const id = link.getAttribute('data-scroll-lawyer');
      const card = document.getElementById(`advogado-${id}`);
      if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }
}

function initFilterOptions() {
  const areas = uniqueSorted(lawyersState.advogados.flatMap((a) => a.areas || []));
  fillSelect('arb-lawyers-funcao', lawyersState.funcoes, 'Todas');
  fillSelect('arb-lawyers-area', areas, 'Todas');
  fillSelect('arb-lawyers-regiao', lawyersState.regioes, 'Todas');
  fillSelect('arb-lawyers-curso', lawyersState.cursos, 'Todos');
  syncDependentFilters();
}

async function initLawyersDirectory() {
  if (!document.getElementById('advogados')) return;

  try {
    const res = await fetch(LAWYERS_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    lawyersState.advogados = data.advogados || [];
    lawyersState.planos = data.planos || [];
    lawyersState.regioes = data.regioes || [];
    lawyersState.funcoes = data.funcoes || [];
    lawyersState.cursos = data.cursos || [];
  } catch (err) {
    const status = document.getElementById('arb-lawyers-status');
    if (status) status.textContent = 'Não foi possível carregar a vitrine.';
    console.error('[lawyers-directory]', err);
    return;
  }

  initFilterOptions();
  bindLawyerFilters();
  renderPlans();
  renderLawyers();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLawyersDirectory);
} else {
  initLawyersDirectory();
}
