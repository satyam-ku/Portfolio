// ============================================================
//  SCRIPT.JS — Shared utilities + per-section initialisation
//  Loaded BEFORE router.js so initSection() is available
// ============================================================

// ── Navbar scroll style ─────────────────────────────────────
window.addEventListener('scroll', () => {
  document.getElementById('navbar')?.classList.toggle('scrolled', window.scrollY > 30);
});

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
    background:radial-gradient(circle,rgba(99,102,241,0.07) 0%,transparent 70%);
    border-radius:50%;z-index:9999;
    transform:translate(-50%,-50%);transition:left 0.12s ease,top 0.12s ease;`;
  document.body.appendChild(glow);
  document.addEventListener('mousemove', e => {
    glow.style.left = e.clientX + 'px';
    glow.style.top  = e.clientY  + 'px';
  });
}

// ============================================================
//  SECTION INIT DISPATCHER
// ============================================================
function initSection(name) {
  initFadeUp();   // runs on every section
  switch (name) {
    case 'home':           initHome();           break;
    case 'skills':         initSkills();         break;
    case 'contact':        initContact();        break;
  }
}

// ── Shared: fade-up observer ────────────────────────────────
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
  // Typing animation for tagline
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
      taglineEl.textContent = del ? cur.slice(0, ci - 1) : cur.slice(0, ci + 1);
      del ? ci-- : ci++;
      if (!del && ci === cur.length) { del = true; setTimeout(type, 2000); return; }
      if (del && ci === 0) { del = false; ti = (ti + 1) % texts.length; }
      setTimeout(type, del ? 38 : 72);
    })();
  }

  // Counter animation for hero stats
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

// ── SKILLS section ───────────────────────────────────────────
function initSkills() {
  const fills = document.querySelectorAll('.skill-bar-fill');
  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.width = entry.target.dataset.width + '%';
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });
  fills.forEach(f => obs.observe(f));
}

// ── CONTACT section ──────────────────────────────────────────
function initContact() {
  // handleSubmit is global so the form's onsubmit="handleSubmit(event)" works
}

async function handleSubmit(e) {
  e.preventDefault();

  const btn     = document.getElementById('contact-submit');
  const btnText = document.getElementById('btn-text');
  const success = document.getElementById('form-success');
  const error   = document.getElementById('form-error');

  btn.disabled  = true;
  btnText.textContent = 'Sending…';
  success.classList.add('hidden');
  error.classList.add('hidden');

  const json = JSON.stringify(Object.fromEntries(new FormData(e.target)));

  try {
    const res    = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: json,
    });
    const result = await res.json();
    if (result.success) { success.classList.remove('hidden'); e.target.reset(); }
    else                  error.classList.remove('hidden');
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

// ── Counter animation helper ─────────────────────────────────
function animateCounter(el, target, decimal = false) {
  let current = 0;
  const step  = target / 60;
  const iv    = setInterval(() => {
    current += step;
    if (current >= target) { current = target; clearInterval(iv); }
    el.textContent = decimal ? current.toFixed(2) : Math.floor(current);
  }, 18);
}
