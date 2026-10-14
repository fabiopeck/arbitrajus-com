/**
 * ARBITRAJUS i18n — PT / EN / ES
 * Markup: data-i18n | data-i18n-html | data-i18n-placeholder | data-i18n-aria | data-i18n-title | data-i18n-value | data-i18n-alt
 */
import dict from './i18n-dict.js';

export const LANG_KEY = 'arbitrajus_lang';
export const LANG_FLAGS = {
  pt: '<svg viewBox="0 0 30 30"><circle cx="15" cy="15" r="15" fill="#009c3b"/><path fill="#ffdf00" d="M15 5.2L24.8 15 15 24.8 5.2 15z"/><circle cx="15" cy="15" r="5.2" fill="#002776"/></svg>',
  en: '<svg viewBox="0 0 30 30"><rect width="30" height="30" fill="#b22234"/><path stroke="#fff" stroke-width="2.3" d="M0 3.5h30M0 8h30M0 12.5h30M0 17h30M0 21.5h30M0 26h30"/><rect width="12.5" height="14.5" fill="#3c3b6e"/></svg>',
  es: '<svg viewBox="0 0 30 30"><rect width="30" height="7.5" y="0" fill="#aa151b"/><rect width="30" height="15" y="7.5" fill="#f1bf00"/><rect width="30" height="7.5" y="22.5" fill="#aa151b"/></svg>',
};
export const LANG_CODES = { pt: 'PT', en: 'EN', es: 'ES' };
export const LANG_HTML = { pt: 'pt-BR', en: 'en', es: 'es' };

const listeners = new Set();

function normalizeLang(lang) {
  return LANG_CODES[lang] ? lang : 'en';
}

export function getLang() {
  return normalizeLang(localStorage.getItem(LANG_KEY) || 'en');
}

export function t(key, lang = getLang()) {
  const entry = dict[key];
  if (!entry) return null;
  return entry[lang] ?? entry.en ?? entry.pt ?? null;
}

export function applyI18n(root = document) {
  const lang = getLang();
  const scope = root.querySelectorAll
    ? root
    : document;

  scope.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    const val = t(key, lang);
    if (val == null) return;
    const textNodes = [...el.childNodes].filter(
      (n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim()
    );
    if (textNodes.length === 1 && el.children.length > 0) {
      textNodes[0].textContent = ` ${val}`;
    } else if (el.children.length === 0) {
      el.textContent = val;
    } else {
      el.textContent = val;
    }
  });

  scope.querySelectorAll('[data-i18n-html]').forEach((el) => {
    const key = el.getAttribute('data-i18n-html');
    const val = t(key, lang);
    if (val != null) el.innerHTML = val;
  });

  scope.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    const val = t(key, lang);
    if (val != null) el.setAttribute('placeholder', val);
  });

  scope.querySelectorAll('[data-i18n-aria]').forEach((el) => {
    const key = el.getAttribute('data-i18n-aria');
    const val = t(key, lang);
    if (val != null) el.setAttribute('aria-label', val);
  });

  scope.querySelectorAll('[data-i18n-title]').forEach((el) => {
    const key = el.getAttribute('data-i18n-title');
    const val = t(key, lang);
    if (val != null) el.setAttribute('title', val);
  });

  scope.querySelectorAll('[data-i18n-value]').forEach((el) => {
    const key = el.getAttribute('data-i18n-value');
    const val = t(key, lang);
    if (val != null) el.setAttribute('value', val);
  });

  scope.querySelectorAll('[data-i18n-alt]').forEach((el) => {
    const key = el.getAttribute('data-i18n-alt');
    const val = t(key, lang);
    if (val != null) el.setAttribute('alt', val);
  });

  const metaTitle = t('meta.title', lang);
  if (metaTitle && document.title) document.title = metaTitle;

  const metaDesc = document.querySelector('meta[name="description"]');
  const desc = t('meta.description', lang);
  if (metaDesc && desc) metaDesc.setAttribute('content', desc);

  document.documentElement.lang = LANG_HTML[lang];
}

export function setLang(lang) {
  const safe = normalizeLang(lang);
  localStorage.setItem(LANG_KEY, safe);
  applyI18n(document);
  listeners.forEach((fn) => {
    try {
      fn(safe);
    } catch (_) {
      /* ignore */
    }
  });
  window.dispatchEvent(new CustomEvent('arbitrajus:lang', { detail: { lang: safe } }));
  return safe;
}

export function onLangChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function initLangSwitcher(root = document.getElementById('arbLangRoot')) {
  if (!root) {
    applyI18n(document);
    return;
  }

  const btn = root.querySelector('.arb-lang__btn');
  const flagEl = root.querySelector('[data-lang-flag]');
  const codeEl = root.querySelector('[data-lang-code]');
  const options = root.querySelectorAll('[data-lang-option]');

  const syncUi = (lang) => {
    if (flagEl) flagEl.innerHTML = LANG_FLAGS[lang];
    if (codeEl) codeEl.textContent = LANG_CODES[lang];
    options.forEach((opt) => {
      const optLang = opt.dataset.langOption;
      opt.setAttribute('aria-selected', optLang === lang ? 'true' : 'false');
    });
  };

  const close = () => {
    root.classList.remove('is-open');
    btn?.setAttribute('aria-expanded', 'false');
  };

  const open = () => {
    root.classList.add('is-open');
    btn?.setAttribute('aria-expanded', 'true');
  };

  btn?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (root.classList.contains('is-open')) close();
    else open();
  });

  options.forEach((opt) => {
    opt.addEventListener('click', () => {
      setLang(opt.dataset.langOption);
      syncUi(getLang());
      close();
    });
  });

  document.addEventListener('click', (e) => {
    if (!root.contains(e.target)) close();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });

  const lang = getLang();
  syncUi(lang);
  applyI18n(document);
}

/** Compact switcher HTML for pages without the institutional header */
export function langSwitcherHtml(id = 'arbLangRoot') {
  return `
<div class="arb-lang" id="${id}">
  <button class="arb-lang__btn" type="button" aria-expanded="false" aria-haspopup="listbox" aria-label="Language" title="Language" data-i18n-aria="common.language" data-i18n-title="common.language">
    <span class="arb-lang__flag" data-lang-flag aria-hidden="true">${LANG_FLAGS.en}</span>
    <span class="arb-lang__code" data-lang-code>EN</span>
    <svg class="arb-lang__chev" viewBox="0 0 12 8" aria-hidden="true"><path d="M1 1.5l5 5 5-5"/></svg>
  </button>
  <div class="arb-lang__menu" role="listbox" aria-label="Language" data-i18n-aria="common.language">
    <button type="button" class="arb-lang__option" role="option" data-lang-option="en" aria-selected="true">
      <span class="arb-lang__flag" aria-hidden="true">${LANG_FLAGS.en}</span>
      <span class="arb-lang__option-label" data-i18n="header.lang.en">English</span>
      <span class="arb-lang__option-code">EN</span>
    </button>
    <button type="button" class="arb-lang__option" role="option" data-lang-option="pt" aria-selected="false">
      <span class="arb-lang__flag" aria-hidden="true">${LANG_FLAGS.pt}</span>
      <span class="arb-lang__option-label" data-i18n="header.lang.pt">Português</span>
      <span class="arb-lang__option-code">PT</span>
    </button>
    <button type="button" class="arb-lang__option" role="option" data-lang-option="es" aria-selected="false">
      <span class="arb-lang__flag" aria-hidden="true">${LANG_FLAGS.es}</span>
      <span class="arb-lang__option-label" data-i18n="header.lang.es">Español</span>
      <span class="arb-lang__option-code">ES</span>
    </button>
  </div>
</div>`;
}

export { dict as I18N_DICT };
