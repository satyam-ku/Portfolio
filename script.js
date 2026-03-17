// ============================================================
//  SCRIPT.JS — Shared utilities + per-section initialisation
// ============================================================

// ── Navbar scroll style ─────────────────────────────────────
window.addEventListener('scroll', () => {
  document.getElementById('navbar')?.classList.toggle('scrolled', window.scrollY > 30);
});

// Always apply background (mobile fix)
document.getElementById('navbar')?.classList.add('scrolled');


// ── Hamburger menu ──────────────────────────────────────────
const hamburger   = document.getElementById('hamburger');
const navLinksEl  = document.getElementById('nav-links');

hamburger?.addEventListener('click', () => {
  navLinksEl.classList.toggle('open');
  const isOpen = navLinksEl.classList.contains('open');
  updateHamburgerIcon(isOpen);
});

function updateHamburgerIcon(open) {
  const spans = hamburger?.querySelectorAll('span');
  if (!spans) return;

  spans[0].style.transform = open ? 'rotate(45deg) translate(5px, 5px)' : '';
  spans[1].style.opacity   = open ? '0' : '';
  spans[2].style.transform = open ? 'rotate(-45deg) translate(5px, -5px)' : '';
}

function resetHamburger() {
  navLinksEl?.classList.remove('open');
  updateHamburgerIcon(false);
}


// ── Cursor glow (desktop only) ──────────────────────────────
if (window.innerWidth > 768) {
  const glow = document.createElement('div');
  glow.style.cssText = `
    position:fixed;width:320px;height:320px;pointer-events:none;
    background:radial-gradient(circle,rgba(236,72,153,0.07) 0%,transparent 70%);
    border-radius:50%;z-index:9999;
    transform:translate(-50%,-50%);
    transition:left 0.12s ease,top 0.12s ease;
  `;
  document.body.appendChild(glow);

  document.addEventListener('mousemove', e => {
    glow.style.left = e.clientX + 'px';
    glow.style.top  = e.clientY + 'px';
  });
}


// ============================================================
//  SECTION INIT DISPATCHER
// ============================================================
function initSection(name) {
  initFadeUp();

  switch (name) {
    case 'home':     initHome();     break;
    case 'skills':   initSkills?.(); break;
    case 'projects': initProjects(); break;
    case 'contact':  initContact();  break;
  }
}


// ── Shared: fade-up animation ───────────────────────────────
function initFadeUp() {
  const els = document.querySelectorAll(
    '#app .glass-card, #app .timeline-item, #app .section-header,' +
    '#app .hero-badge, #app .hero-name, #app .hero-tagline,' +
    '#app .hero-sub, #app .hero-actions, #app .hero-stats, #app .hero-visual'
  );

  els.forEach(el => el.classList.add('fade-up'));

  const obs = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), i * 55);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

  els.forEach(el => obs.observe(el));
}


// ── HOME section ─────────────────────────────────────────────
function initHome() {
  const taglineEl = document.querySelector('.hero-tagline');

  if (taglineEl) {
    const texts = [
      'CS Engineer & Developer',
      'Python & ML Enthusiast',
      'Problem Solver',
      'Full-Stack Explorer',
    ];

    let ti = 0, ci = 0, del = false;

    (function type() {
      const cur = texts[ti];

      taglineEl.textContent = del
        ? cur.slice(0, ci - 1)
        : cur.slice(0, ci + 1);

      del ? ci-- : ci++;

      if (!del && ci === cur.length) {
        del = true;
        setTimeout(type, 2000);
        return;
      }

      if (del && ci === 0) {
        del = false;
        ti = (ti + 1) % texts.length;
      }

      setTimeout(type, del ? 38 : 72);
    })();
  }

  // Counter animation
  const statNums = document.querySelectorAll('.stat-num');

  const statObs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el  = entry.target;
        const raw = el.dataset.target ?? el.textContent;

        animateCounter(el, parseFloat(raw), raw.includes('.'));
        statObs.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  statNums.forEach(el => statObs.observe(el));
}


// ── PROJECTS section ─────────────────────────────────────────
function initProjects() {
  var track    = document.getElementById('proj-track');
  var vp       = document.getElementById('proj-viewport');
  var dotsWrap = document.getElementById('proj-dots');
  var btnPrev  = document.getElementById('proj-prev');
  var btnNext  = document.getElementById('proj-next');

  if (!track || !vp || !btnPrev || !btnNext) return;

  var page = 0;
  var perPage, pages, cardW, gapPx;
  var resizeTimer;

  function setup() {
    var vpW = vp.offsetWidth;
    perPage = vpW < 580 ? 1 : vpW < 920 ? 2 : 3;

    var cs = window.getComputedStyle(track);
    gapPx  = parseFloat(cs.columnGap || cs.gap) || 24;

    cardW = (vpW - gapPx * (perPage - 1)) / perPage;

    var items = track.querySelectorAll('.proj-card-item');

    items.forEach(function (el) {
      el.style.flex  = '0 0 ' + cardW + 'px';
      el.style.width = cardW + 'px';
    });

    pages = Math.ceil(items.length / perPage);
    if (page >= pages) page = pages - 1;

    buildDots();
    moveTo(false);
  }

  function moveTo(animate) {
    var offset = page * perPage * (cardW + gapPx);

    track.style.transition = animate
      ? 'transform 0.48s cubic-bezier(0.4,0,0.2,1)'
      : 'none';

    track.style.transform = 'translateX(-' + offset + 'px)';

    dotsWrap.querySelectorAll('.carousel-dot').forEach(function (d, i) {
      d.classList.toggle('active', i === page);
    });

    btnPrev.disabled = (page === 0);
    btnNext.disabled = (page >= pages - 1);
  }

  function go(p) {
    page = Math.max(0, Math.min(p, pages - 1));
    moveTo(true);
  }

  function buildDots() {
    dotsWrap.innerHTML = '';
    if (pages <= 1) return;

    for (var i = 0; i < pages; i++) {
      (function (idx) {
        var d = document.createElement('button');
        d.className = 'carousel-dot' + (idx === 0 ? ' active' : '');
        d.setAttribute('aria-label', 'Slide ' + (idx + 1));
        d.addEventListener('click', function () { go(idx); });
        dotsWrap.appendChild(d);
      })(i);
    }
  }

  btnPrev.addEventListener('click', function () { go(page - 1); });
  btnNext.addEventListener('click', function () { go(page + 1); });

  // Keyboard support
  document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowRight') go(page + 1);
    if (e.key === 'ArrowLeft')  go(page - 1);
  });

  // Touch swipe
  var touchStartX = 0;

  vp.addEventListener('touchstart', function (e) {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });

  vp.addEventListener('touchend', function (e) {
    var dx = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(dx) > 50) go(dx > 0 ? page + 1 : page - 1);
  }, { passive: true });

  // Mouse drag
  var mouseStartX = 0, mouseDown = false;

  vp.addEventListener('mousedown', function (e) {
    mouseStartX = e.clientX;
    mouseDown = true;
    e.preventDefault();
  });

  window.addEventListener('mouseup', function (e) {
    if (!mouseDown) return;
    mouseDown = false;

    var dx = mouseStartX - e.clientX;
    if (Math.abs(dx) > 50) go(dx > 0 ? page + 1 : page - 1);
  });

  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(setup, 150);
  });

  requestAnimationFrame(() => {
    requestAnimationFrame(setup);
  });
}


// ── CONTACT section ──────────────────────────────────────────
function initContact() {}

async function handleSubmit(e) {
  e.preventDefault();

  const btn     = document.getElementById('contact-submit');
  const btnText = document.getElementById('btn-text');
  const success = document.getElementById('form-success');
  const error   = document.getElementById('form-error');

  btn.disabled = true;
  btnText.textContent = 'Sending…';

  success.classList.add('hidden');
  error.classList.add('hidden');

  const json = JSON.stringify(Object.fromEntries(new FormData(e.target)));

  try {
    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: json,
    });

    const result = await res.json();

    if (result.success) {
      success.classList.remove('hidden');
      e.target.reset();
    } else {
      error.classList.remove('hidden');
    }

  } catch {
    error.classList.remove('hidden');

  } finally {
    btn.disabled = false;
    btnText.textContent = 'Send Message';

    setTimeout(() => {
      success.classList.add('hidden');
      error.classList.add('hidden');
    }, 5000);
  }
}


// ── Counter animation ────────────────────────────────────────
function animateCounter(el, target, decimal = false) {
  let current = 0;
  const step  = target / 60;

  const iv = setInterval(() => {
    current += step;

    if (current >= target) {
      current = target;
      clearInterval(iv);
    }

    el.textContent = decimal
      ? current.toFixed(2)
      : Math.floor(current);

  }, 18);
}