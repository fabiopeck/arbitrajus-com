const PAGE_SIZE = 6;
const DATA_URL = 'frontend/data/mock-reels.json';

const TIPO_LABEL = {
  reel: 'Reel',
  noticia: 'Notícia',
  audiencia: 'Audiência',
};

const state = {
  items: [],
  areas: [],
  tipo: 'todos',
  area: 'todas',
  cursor: 0,
  filtered: [],
  loading: false,
  done: false,
};

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getFiltered() {
  return state.items.filter((item) => {
    const tipoOk = state.tipo === 'todos' || item.tipo === state.tipo;
    const areaOk = state.area === 'todas' || item.area === state.area;
    return tipoOk && areaOk;
  });
}

function cardHtml(item) {
  const tipo = TIPO_LABEL[item.tipo] || item.tipo;
  const meta = [item.autor, item.oab].filter(Boolean).join(' · ');
  const duration = item.duracao
    ? `<span class="arb-reels-card-duration">${escapeHtml(item.duracao)}</span>`
    : '';
  const play =
    item.tipo !== 'noticia'
      ? `<span class="arb-reels-card-play" aria-hidden="true"><i class="fas fa-play"></i></span>`
      : '';

  return `
    <article class="arb-reels-card" data-tipo="${escapeHtml(item.tipo)}" data-area="${escapeHtml(item.area)}">
      <div class="arb-reels-card-media">
        <img src="${escapeHtml(item.thumb)}" alt="" loading="lazy" decoding="async" width="360" height="640">
        ${play}
        ${duration}
        <span class="arb-reels-card-badge">${escapeHtml(tipo)}</span>
      </div>
      <div class="arb-reels-card-body">
        <p class="arb-reels-card-area">${escapeHtml(item.area)}</p>
        <h3 class="arb-reels-card-title">${escapeHtml(item.titulo)}</h3>
        <p class="arb-reels-card-meta">${escapeHtml(meta)}</p>
        ${item.tag ? `<span class="arb-reels-card-tag">${escapeHtml(item.tag)}</span>` : ''}
      </div>
    </article>
  `;
}

function renderBatch(reset = false) {
  const grid = document.getElementById('arb-reels-grid');
  const empty = document.getElementById('arb-reels-empty');
  const status = document.getElementById('arb-reels-status');
  if (!grid) return;

  if (reset) {
    grid.innerHTML = '';
    state.cursor = 0;
    state.done = false;
    state.filtered = getFiltered();
  }

  if (!state.filtered.length) {
    grid.innerHTML = '';
    state.done = true;
    if (empty) empty.hidden = false;
    if (status) status.textContent = 'Nenhum conteúdo para este filtro.';
    return;
  }

  if (empty) empty.hidden = true;

  const slice = state.filtered.slice(state.cursor, state.cursor + PAGE_SIZE);
  state.cursor += slice.length;
  grid.insertAdjacentHTML('beforeend', slice.map(cardHtml).join(''));

  state.done = state.cursor >= state.filtered.length;
  if (status) {
    status.textContent = state.done
      ? `${state.filtered.length} conteúdos · fim do feed`
      : `${state.cursor} de ${state.filtered.length} conteúdos`;
  }
}

function setActiveChip(group, value) {
  document.querySelectorAll(`[data-reels-${group}]`).forEach((btn) => {
    const active = btn.getAttribute(`data-reels-${group}`) === value;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
}

function applyFilters() {
  setActiveChip('tipo', state.tipo);
  const select = document.getElementById('arb-reels-area');
  if (select) select.value = state.area;
  document.querySelectorAll('[data-reels-area-chip]').forEach((btn) => {
    const active = btn.getAttribute('data-reels-area-chip') === state.area;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
  renderBatch(true);
}

function fillAreas() {
  const select = document.getElementById('arb-reels-area');
  const chips = document.getElementById('arb-reels-area-chips');
  if (!select || !chips) return;

  select.innerHTML =
    '<option value="todas">Todas as áreas</option>' +
    state.areas.map((area) => `<option value="${escapeHtml(area)}">${escapeHtml(area)}</option>`).join('');

  chips.innerHTML =
    `<button type="button" class="arb-reels-area-chip is-active" data-reels-area-chip="todas" aria-pressed="true">Todas</button>` +
    state.areas
      .map(
        (area) =>
          `<button type="button" class="arb-reels-area-chip" data-reels-area-chip="${escapeHtml(area)}" aria-pressed="false">${escapeHtml(area)}</button>`
      )
      .join('');
}

function bindControls() {
  document.querySelectorAll('[data-reels-tipo]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.tipo = btn.getAttribute('data-reels-tipo') || 'todos';
      applyFilters();
    });
  });

  const select = document.getElementById('arb-reels-area');
  if (select) {
    select.addEventListener('change', () => {
      state.area = select.value || 'todas';
      applyFilters();
    });
  }

  const chips = document.getElementById('arb-reels-area-chips');
  if (chips) {
    chips.addEventListener('click', (event) => {
      const btn = event.target.closest('[data-reels-area-chip]');
      if (!btn) return;
      state.area = btn.getAttribute('data-reels-area-chip') || 'todas';
      applyFilters();
    });
  }
}

function observeSentinel() {
  const sentinel = document.getElementById('arb-reels-sentinel');
  if (!sentinel || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      if (state.loading || state.done) return;
      state.loading = true;
      renderBatch(false);
      state.loading = false;
    },
    { rootMargin: '240px 0px' }
  );

  observer.observe(sentinel);
}

async function init() {
  const section = document.getElementById('rede-juridica');
  if (!section) return;

  try {
    const res = await fetch(DATA_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    state.areas = data.areas || [];
    state.items = data.items || [];
  } catch (err) {
    const status = document.getElementById('arb-reels-status');
    if (status) status.textContent = 'Não foi possível carregar o feed jurídico.';
    console.error('[reels-feed]', err);
    return;
  }

  fillAreas();
  bindControls();
  applyFilters();
  observeSentinel();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
