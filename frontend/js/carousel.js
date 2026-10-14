const INTERVAL_MS = 6000;

export function initHeroCarousel() {
  const slides = document.querySelectorAll('.carousel-slide');
  const dots = document.querySelectorAll('.carousel-dot');
  const hero = document.querySelector('.arb-hero');
  if (!slides.length) return;

  let current = 0;
  let timer = null;

  function goTo(index) {
    current = ((index % slides.length) + slides.length) % slides.length;

    slides.forEach((s, i) => s.classList.toggle('active', i === current));
    dots.forEach((d, i) => {
      const isActive = i === current;
      d.classList.toggle('active', isActive);
      const progress = d.querySelector('.dot-progress');
      if (progress) {
        progress.style.animation = 'none';
        void progress.offsetWidth;
        if (isActive) {
          progress.style.animation = `dotFill ${INTERVAL_MS / 1000}s linear forwards`;
        }
      }
    });

    if (hero) hero.dataset.slide = String(current);
    document.dispatchEvent(new CustomEvent('arb-carousel-change', { detail: { index: current } }));
  }

  function next() {
    goTo(current + 1);
  }

  function startAutoplay() {
    clearInterval(timer);
    timer = setInterval(next, INTERVAL_MS);
  }

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      goTo(i);
      startAutoplay();
    });
  });

  goTo(0);
  startAutoplay();
}
