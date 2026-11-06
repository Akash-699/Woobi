(() => {
  const standalone = document.body.hasAttribute('data-app-launch');
  const android = document.body.hasAttribute('data-android-app');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  function animateWelcome(welcome, onComplete) {
    const canvas = welcome.querySelector('.welcome-carpet canvas');
    const context = canvas.getContext('2d');
    if (!context) {
      onComplete();
      return () => {};
    }
    const duration = 2800;
    const entrance = [
      { selector: '.welcome-arch', delay: 0, duration: 1800, lift: 0, scale: .97 },
      { selector: '.welcome-star', delay: 250, duration: 650, lift: 8, scale: .92 },
      { selector: '.welcome-eyebrow', delay: 450, duration: 650, lift: 8 },
      { selector: '.welcome-copy h1', delay: 650, duration: 850, lift: 16, scale: .97 },
      { selector: '.welcome-caption', delay: 1100, duration: 750, lift: 10 },
      { selector: '.welcome-arrival', delay: 1750, duration: 650, lift: 10 },
      { selector: '.welcome-skip', delay: 1900, duration: 900, lift: 14, scale: .94 }
    ].map(({ selector, delay, duration: revealDuration, lift, scale = 1 }) => {
      const animation = welcome.querySelector(selector).animate([
        { opacity: 0, transform: `translateY(${lift}px) scale(${scale})` },
        { opacity: 1, transform: 'translateY(0) scale(1)' }
      ], { delay, duration: revealDuration, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'both' });
      // One clock drives both the fabric and the welcome elements, even after a slow frame.
      animation.pause();
      animation.currentTime = 0;
      return animation;
    });
    let elapsed = reduced.matches ? duration : 0;
    let previousTime = null;
    let frame = 0;
    let width = 0;
    let height = 0;
    let gold, velvet, sheen;

    function draw() {
      entrance.forEach(animation => { animation.currentTime = elapsed; });
      if (!width || !height) return;
      context.clearRect(0, 0, width, height);
      const progress = Math.min(elapsed / duration, 1);
      const travel = .5 - Math.cos(progress * Math.PI) / 2;
      // The roll travels beyond the viewport, leaving the same flat carpet behind.
      const front = -14 + (height + 54) * travel;
      const halfWidth = y => width * (.06 + .44 * y / height);
      const center = width / 2;

      function fabric(inset, fill) {
        context.beginPath();
        context.moveTo(center - halfWidth(0) + inset, 0);
        context.lineTo(center + halfWidth(0) - inset, 0);
        context.lineTo(center + halfWidth(front) - inset, front);
        context.lineTo(center - halfWidth(front) + inset, front);
        context.closePath();
        context.fillStyle = fill;
        context.fill();
      }

      if (front > 0) {
        fabric(0, gold);
        fabric(width * .007, velvet);
        fabric(width * .007, sheen);
      }

      const radius = 3 + 9 * Math.max(0, Math.min(front / height, 1));
      if (front - radius < height) {
        const left = center - halfWidth(front);
        const right = center + halfWidth(front);
        const cap = radius * .7;
        const roll = context.createLinearGradient(0, front - radius, 0, front + radius);
        roll.addColorStop(0, '#882237');
        roll.addColorStop(.28, '#d2616b');
        roll.addColorStop(.52, '#b5384d');
        roll.addColorStop(1, '#651526');
        context.beginPath();
        context.moveTo(left + cap, front - radius);
        context.lineTo(right - cap, front - radius);
        context.bezierCurveTo(right + cap, front - radius, right + cap, front + radius, right - cap, front + radius);
        context.lineTo(left + cap, front + radius);
        context.bezierCurveTo(left - cap, front + radius, left - cap, front - radius, left + cap, front - radius);
        context.fillStyle = roll;
        context.fill();
        // Gold binding curves around the ends of the fabric roll.
        context.fillStyle = '#c49b65';
        for (const x of [left + cap * .3, right - cap * .3]) {
          context.beginPath();
          context.ellipse(x, front, cap * .6, radius * .88, 0, 0, Math.PI * 2);
          context.fill();
        }
      }
    }

    function resize() {
      const bounds = canvas.getBoundingClientRect();
      const density = Math.min(window.devicePixelRatio || 1, 2);
      width = bounds.width;
      height = bounds.height;
      canvas.width = Math.round(width * density);
      canvas.height = Math.round(height * density);
      context.setTransform(density, 0, 0, density, 0, 0);
      gold = context.createLinearGradient(0, 0, 0, height);
      gold.addColorStop(0, '#e5c694');
      gold.addColorStop(1, '#9b6a3b');
      velvet = context.createLinearGradient(0, 0, 0, height);
      velvet.addColorStop(0, '#651b2a');
      velvet.addColorStop(.55, '#ac263c');
      velvet.addColorStop(1, '#791426');
      sheen = context.createLinearGradient(0, 0, width, 0);
      sheen.addColorStop(0, '#30071399');
      sheen.addColorStop(.5, '#ffb7a51f');
      sheen.addColorStop(1, '#30071399');
      draw();
    }

    function tick(time) {
      frame = 0;
      if (document.hidden) { previousTime = null; return; }
      // Bound the step so a busy startup frame cannot teleport the leading edge.
      if (previousTime !== null) elapsed = Math.min(duration, elapsed + Math.min(time - previousTime, 40));
      previousTime = time;
      draw();
      if (elapsed < duration) frame = requestAnimationFrame(tick);
      else onComplete();
    }

    function resume() {
      previousTime = null;
      cancelAnimationFrame(frame);
      frame = 0;
      if (reduced.matches) {
        elapsed = duration;
        draw();
        onComplete();
      } else if (!document.hidden && elapsed < duration) {
        frame = requestAnimationFrame(tick);
      }
    }

    const observer = new ResizeObserver(resize);
    resize();
    observer.observe(canvas);
    document.addEventListener('visibilitychange', resume);
    reduced.addEventListener('change', resume);
    resume();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener('visibilitychange', resume);
      reduced.removeEventListener('change', resume);
      entrance.forEach(animation => animation.cancel());
    };
  }

  function revealDashboard() {
    window.app?.goToScreen?.('today');
    window.Studio3D?.setRenderingPaused?.(false);
    if (reduced.matches) return;
    const groups = [
      { selector: '#screen-today .seren-stage-viewport', delay: 0, duration: 1200, lift: 0, scale: .96, opacity: 1 },
      { selector: '#screen-today .seren-header', delay: 250, duration: 650, lift: -10, scale: 1 },
      { selector: '#screen-today .seren-bottom-bar > *', delay: 80, duration: 500, lift: 18, scale: 1 }
    ];
    groups.forEach(group => {
      document.querySelectorAll(group.selector).forEach((element, index) => {
        element.animate([
          { opacity: group.opacity ?? 0, translate: `0 ${group.lift}px`, scale: String(group.scale) },
          { opacity: 1, translate: '0 0', scale: '1' }
        ], {
          duration: group.duration,
          delay: group.delay + index * 45,
          easing: 'cubic-bezier(.35,.05,.3,1)',
          fill: 'backwards'
        });
      });
    });
  }

  // The standalone preview hands off to the actual app after Enter is pressed.
  const address = new URL(location.href);
  if (!standalone && address.searchParams.get('welcome') === 'entered') {
    address.searchParams.delete('welcome');
    history.replaceState(null, '', address);
    revealDashboard();
    return;
  }
  if (!standalone && !android && !matchMedia('(max-width: 700px)').matches) return;

  let releaseEntrance;
  let entranceFinished = false;
  const entranceComplete = new Promise(resolve => {
    releaseEntrance = () => {
      if (entranceFinished) return;
      entranceFinished = true;
      requestAnimationFrame(() => setTimeout(() => {
        document.body.classList.remove('welcome-intro');
        resolve();
      }, 0));
    };
  });
  // App startup may prepare the hidden studio only after the welcome has settled.
  window.woobiWelcomeEntrance = entranceComplete;
  document.body.classList.add('welcome-intro');
  const welcome = document.createElement('dialog');
  welcome.className = 'app-welcome';
  welcome.setAttribute('aria-labelledby', 'app-welcome-title');
  welcome.innerHTML = `
    <div class="welcome-stage" aria-hidden="true"><span class="welcome-arch"></span></div>
    <header class="welcome-header">
      <div class="welcome-brand">woobi<span>YOUR STYLE, REMIXED.</span></div>
      <div class="welcome-signature">sérén<span>STUDIO</span></div>
    </header>
    <div class="welcome-copy">
      <span class="welcome-star" aria-hidden="true">✧</span>
      <p class="welcome-eyebrow">A MOMENT, JUST FOR YOU</p>
      <h1 id="app-welcome-title">Your style.<br><em>Centre stage.</em></h1>
      <p class="welcome-caption">Already yours. Newly inspired.</p>
    </div>
    <div class="welcome-carpet" aria-hidden="true"><canvas></canvas></div>
    <footer class="welcome-footer">
      <span class="welcome-arrival">WELCOME TO YOUR WARDROBE</span>
      <button class="welcome-skip" type="button" autofocus>Enter Woobi <span aria-hidden="true">↗</span></button>
    </footer>`;
  document.body.append(welcome);
  let entering = false;
  const finish = () => {
    stopEntrance();
    document.body.classList.remove('welcome-intro');
    welcome.close();
    welcome.remove();
    if (standalone) {
      location.replace(location.protocol === 'file:' ? '../index.html?welcome=entered' : '/?welcome=entered');
      return;
    }
    const dashboard = document.querySelector('.app-viewport');
    if (dashboard) {
      dashboard.setAttribute('tabindex', '-1');
      dashboard.focus({ preventScroll: true });
    }
  };
  welcome.querySelector('button').addEventListener('click', async () => {
    if (entering) return;
    entering = true;
    const enterButton = welcome.querySelector('button');
    enterButton.disabled = true;
    if (!standalone) {
      enterButton.setAttribute('aria-busy', 'true');
      enterButton.firstChild.textContent = 'Opening Woobi ';
      await entranceComplete;
      await window.app?.prepareVirtualStudio?.();
      enterButton.removeAttribute('aria-busy');
    }
    if (!standalone) revealDashboard();
    if (reduced.matches || standalone) {
      finish();
      return;
    }
    const bounds = welcome.getBoundingClientRect();
    const button = welcome.querySelector('button').getBoundingClientRect();
    const centerX = button.left + button.width / 2 - bounds.left;
    const centerY = button.top + button.height / 2 - bounds.top;
    const radius = Math.hypot(
      Math.max(centerX, bounds.width - centerX),
      Math.max(centerY, bounds.height - centerY)
    ) * 1.01;
    // An expanding opening from the tapped button reveals the room underneath.
    function aperture(size) {
      const points = ['0px 0px', '100% 0px', '100% 100%', '0px 100%', '0px 0px'];
      for (let step = 0; step <= 64; step++) {
        const angle = step / 64 * Math.PI * 2;
        points.push(`${centerX + Math.cos(angle) * size}px ${centerY + Math.sin(angle) * size}px`);
      }
      points.push('0px 0px');
      return `polygon(evenodd, ${points.join(',')})`;
    }
    welcome.querySelectorAll('.welcome-header, .welcome-copy, .welcome-footer').forEach(element => {
      element.animate([
        { opacity: getComputedStyle(element).opacity },
        { opacity: 0 }
      ], { duration: 240, fill: 'forwards' });
    });
    const departure = welcome.animate([
      { clipPath: aperture(0) },
      { clipPath: aperture(radius) }
    ], { duration: 850, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' });
    departure.finished.then(finish, finish);
  });
  welcome.addEventListener('cancel', event => event.preventDefault());
  welcome.showModal();
  const stopEntrance = animateWelcome(welcome, releaseEntrance);
})();
