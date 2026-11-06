window.WOOBI_AUTH_COPY = {
  loginTitle: 'Let’s get dressed.',
  loginIntro: 'Your wardrobe. Your rules. Your next good outfit.'
};
(() => {
  const pieces = [...document.querySelectorAll('.piece')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const toggle = document.getElementById('motion-toggle');
  let paused = reduced.matches;
  function renderMotion() {
    document.body.classList.toggle('paused', paused);
    toggle.textContent = paused ? 'Resume motion' : 'Pause motion';
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.disabled = reduced.matches;
    if (reduced.matches) toggle.textContent = 'Motion reduced';
  }
  renderMotion();
  toggle.addEventListener('click', () => { paused = !paused; renderMotion(); });
  reduced.addEventListener('change', () => { paused = reduced.matches; renderMotion(); });
  const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
  function move(piece, x, y) {
    piece.dataset.x = x; piece.dataset.y = y;
    piece.style.setProperty('--dx', x + 'px'); piece.style.setProperty('--dy', y + 'px');
  }
  pieces.forEach(piece => {
    let drag;
    piece.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      const box = piece.getBoundingClientRect();
      const parent = piece.parentElement.getBoundingClientRect();
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, dx: Number(piece.dataset.x || 0), dy: Number(piece.dataset.y || 0), box, parent };
      piece.setPointerCapture(e.pointerId);
      piece.classList.add('dragging');
    });
    piece.addEventListener('pointermove', e => {
      if (!drag || drag.id !== e.pointerId) return;
      const x = clamp(e.clientX - drag.x, drag.parent.left - drag.box.right + 35, drag.parent.right - drag.box.left - 35);
      const y = clamp(e.clientY - drag.y, drag.parent.top - drag.box.bottom + 35, drag.parent.bottom - drag.box.top - 35);
      move(piece, drag.dx + x, drag.dy + y);
    });
    const release = () => { drag = null; piece.classList.remove('dragging'); };
    piece.addEventListener('pointerup', release);
    piece.addEventListener('pointercancel', release);
    piece.addEventListener('lostpointercapture', release);
    piece.addEventListener('keydown', e => {
      let x = Number(piece.dataset.x || 0), y = Number(piece.dataset.y || 0);
      const keys = { ArrowLeft: [-12,0], ArrowRight: [12,0], ArrowUp: [0,-12], ArrowDown: [0,12] };
      if (e.key === 'Home') { e.preventDefault(); move(piece,0,0); }
      else if (keys[e.key]) {
        e.preventDefault(); x += keys[e.key][0]; y += keys[e.key][1];
        move(piece,clamp(x,-innerWidth*.3,innerWidth*.3),clamp(y,-150,150));
      }
    });
  });
  document.getElementById('shuffle').addEventListener('click', () => {
    pieces.forEach(piece => {
      const range = innerWidth < 700 ? 14 : 45;
      move(piece,(Math.random()-.5)*range*2,(Math.random()-.5)*40);
      piece.style.setProperty('--angle', ((Math.random()-.5)*48) + 'deg');
    });
  });
  addEventListener('resize', () => pieces.forEach(piece => move(piece,0,0)));
  const note = document.querySelector('.login-note');
  const slot = document.querySelector('.note-slot');
  function fitNote() {
    // Reserve space for the tape, rotation and shadow outside the paper.
    const scale = Math.min(1, Math.max(0, slot.clientHeight - 30) / note.offsetHeight,
      Math.max(0, slot.clientWidth - 14) / note.offsetWidth);
    note.style.setProperty('--note-scale', scale);
  }
  function fitViewport() {
    const height = window.visualViewport?.height || innerHeight;
    document.body.style.setProperty('--view-height', height + 'px');
    document.body.classList.toggle('compact-viewport', height < 500);
    fitNote();
  }
  const observer = new ResizeObserver(fitNote);
  observer.observe(slot);
  observer.observe(note);
  addEventListener('resize', fitViewport);
  window.visualViewport?.addEventListener('resize', fitViewport);
  document.fonts.ready.then(fitNote);
  fitViewport();
})();
