window.WOOBI_AUTH_COPY = {
  loginTitle: 'Step into your style.',
  loginIntro: 'Your wardrobe. A world of possibilities.'
};
(() => {
  const card = document.querySelector('.arch-card');
  const slot = document.querySelector('.arch-slot');
  function fitCard() {
    const scale = Math.min(1, Math.max(0, slot.clientHeight - 20) / card.offsetHeight,
      Math.max(0, slot.clientWidth - 20) / card.offsetWidth);
    card.style.setProperty('--card-scale', scale);
  }
  function fitViewport() {
    const height = window.visualViewport?.height || innerHeight;
    document.body.style.setProperty('--view-height', height + 'px');
    document.body.classList.toggle('compact-viewport', height < 500);
    fitCard();
  }
  const observer = new ResizeObserver(fitCard);
  observer.observe(card);
  observer.observe(slot);
  addEventListener('resize', fitViewport);
  window.visualViewport?.addEventListener('resize', fitViewport);
  document.fonts.ready.then(fitCard);
  fitViewport();
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const replay = document.getElementById('replay-reveal');
  let revealTimer;
  let revealFrame;
  function revealPage() {
    clearTimeout(revealTimer);
    cancelAnimationFrame(revealFrame);
    document.body.classList.remove('is-entering');
    replay.hidden = motion.matches;
    if (motion.matches) return;
    // Restart the decorative entrance, including the curtains, on request.
    revealFrame = requestAnimationFrame(() => {
      revealFrame = requestAnimationFrame(() => {
        document.body.classList.add('is-entering');
        revealTimer = setTimeout(() => document.body.classList.remove('is-entering'), 2300);
      });
    });
  }
  replay.addEventListener('click', revealPage);
  motion.addEventListener('change', revealPage);
  // The initial class starts the reveal before scripts load; only stop it
  // when a user requests reduced motion, or after its last transition.
  replay.hidden = motion.matches;
  if (motion.matches) document.body.classList.remove('is-entering');
  else revealTimer = setTimeout(() => document.body.classList.remove('is-entering'), 2300);

  const study = document.querySelector('.study-carousel');
  const layers = [...study.querySelectorAll('.study-shirt')];
  const pause = document.getElementById('study-pause');
  const next = document.getElementById('study-next');
  const wideScreen = matchMedia('(min-width: 1051px)');
  const wardrobe = [
    { name: 'White linen shirt', atlas: 2, position: '0 0' },
    { name: 'Navy cotton shirt', atlas: 1, position: '0 0' },
    { name: 'Maroon everyday top', atlas: 1, position: '100% 100%' },
    { name: 'Olive kurta', atlas: 2, position: '100% 0' },
    { name: 'Beige chinos', atlas: 1, position: '100% 0' },
    { name: 'White sneakers', atlas: 1, position: '0 100%' },
    { name: 'Tan leather loafers', atlas: 2, position: '0 100%' },
    { name: 'Leather watch', atlas: 2, position: '100% 100%' }
  ];
  let itemIndex = 0, activeLayer = 0, slideshowTimer;
  let manuallyPaused = false;
  function showNextItem() {
    itemIndex = (itemIndex + 1) % wardrobe.length;
    const item = wardrobe[itemIndex];
    const incoming = layers[1 - activeLayer];
    incoming.style.backgroundImage = `url('assets/wardrobe-atlas${item.atlas === 2 ? '-2' : ''}.png')`;
    incoming.style.backgroundPosition = item.position;
    incoming.classList.add('is-active');
    layers[activeLayer].classList.remove('is-active');
    activeLayer = 1 - activeLayer;
    study.setAttribute('aria-label', item.name + ' from the Woobi wardrobe');
    document.getElementById('study-item-name').textContent = item.name.toUpperCase();
  }
  function syncSlideshow() {
    clearInterval(slideshowTimer);
    const paused = manuallyPaused || motion.matches;
    pause.textContent = paused ? 'Play' : 'Pause';
    pause.setAttribute('aria-pressed', String(paused));
    pause.hidden = motion.matches;
    if (!paused && wideScreen.matches && !document.hidden) {
      slideshowTimer = setInterval(showNextItem, 4200);
    }
  }
  pause.addEventListener('click', () => { manuallyPaused = !manuallyPaused; syncSlideshow(); });
  next.addEventListener('click', () => { showNextItem(); syncSlideshow(); });
  motion.addEventListener('change', syncSlideshow);
  wideScreen.addEventListener('change', syncSlideshow);
  document.addEventListener('visibilitychange', syncSlideshow);
  syncSlideshow();
})();
