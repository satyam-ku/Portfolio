// ============================================================
//  ROUTER.JS — Client-side SPA router
//  • Desktop (> 768 px) : click-based SPA (one section at a time)
//  • Mobile  (≤ 768 px) : all sections loaded & stacked; user scrolls
// ============================================================

const ROUTES = {
  home:           'sections/home.html',
  about:          'sections/about.html',
  skills:         'sections/skills.html',
  projects:       'sections/projects.html',
  education:      'sections/education.html',
  certifications: 'sections/certifications.html',
  contact:        'sections/contact.html',
};
const ROUTE_ORDER = ['home','about','skills','projects','education','certifications','contact'];

const cache   = {};   // HTML cache so we never fetch twice
let   current = null; // Currently active route (desktop only)
let   currentMode = null; // 'mobile' | 'desktop'

// ── Detect mobile ────────────────────────────────────────────
const isMobile = () => window.innerWidth <= 768;

// ── Utility ──────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Loading indicator ─────────────────────────────────────────
function showLoader(app) {
  app.innerHTML = `
    <div style="
      display:flex;align-items:center;justify-content:center;
      min-height:60vh;gap:0.6rem;
    ">
      <span style="
        width:10px;height:10px;border-radius:50%;
        background:var(--primary);display:inline-block;
        animation:loader-bounce 0.9s ease-in-out infinite;
      "></span>
      <span style="
        width:10px;height:10px;border-radius:50%;
        background:var(--secondary);display:inline-block;
        animation:loader-bounce 0.9s ease-in-out 0.2s infinite;
      "></span>
      <span style="
        width:10px;height:10px;border-radius:50%;
        background:var(--primary);display:inline-block;
        animation:loader-bounce 0.9s ease-in-out 0.4s infinite;
      "></span>
    </div>`;
  if (!document.getElementById('loader-style')) {
    const s = document.createElement('style');
    s.id = 'loader-style';
    s.textContent = `@keyframes loader-bounce {
      0%,100%{transform:translateY(0);opacity:0.5}
      50%{transform:translateY(-10px);opacity:1}
    }`;
    document.head.appendChild(s);
  }
}

// ============================================================
//  DESKTOP MODE — click-based SPA (one section at a time)
// ============================================================
async function navigate(name) {
  if (!ROUTES[name]) name = 'home';
  if (current === name) { closeMenu(); return; }

  const app = document.getElementById('app');
  closeMenu();

  app.classList.remove('app-visible');
  await sleep(280);

  if (!cache[name]) showLoader(app);

  // Fetch (or use cache)
  if (!cache[name]) {
    try {
      const res = await fetch(ROUTES[name]);
      if (!res.ok) throw new Error(res.status);
      cache[name] = await res.text();
    } catch {
      app.innerHTML = `<div style="text-align:center;padding:10rem 2rem;color:#f87171">
        ⚠️ Could not load section. Please refresh.</div>`;
      app.classList.add('app-visible');
      return;
    }
  }

  app.innerHTML = cache[name];
  current = name;

  window.scrollTo({ top: 0, behavior: 'instant' });
  history.pushState({ section: name, mode: 'desktop' }, '', '#' + name);

  setActiveNav(name);

  requestAnimationFrame(() => requestAnimationFrame(() => {
    app.classList.add('app-visible');
  }));

  initSection(name);
}

// ============================================================
//  MOBILE MODE — all sections stacked, scroll-based
// ============================================================
async function loadMobileMode() {
  const app = document.getElementById('app');

  // Show a full-page loader while we fetch everything
  showLoader(app);

  // Fetch all sections (parallel, using cache when available)
  await Promise.all(ROUTE_ORDER.map(async name => {
    if (!cache[name]) {
      try {
        const res = await fetch(ROUTES[name]);
        if (!res.ok) throw new Error(res.status);
        cache[name] = await res.text();
      } catch {
        cache[name] = `<section id="${name}" style="padding:4rem 1rem;text-align:center;color:#f87171">
          ⚠️ Could not load "${name}". Please refresh.</section>`;
      }
    }
  }));

  // Build one big page: wrap each section in a scroll-target div
  app.innerHTML = ROUTE_ORDER.map(name =>
    `<div id="section-${name}" class="mobile-section">${cache[name]}</div>`
  ).join('');

  // Make app always visible in mobile (no click-transition needed)
  app.classList.add('app-visible');

  // Run all section inits
  ROUTE_ORDER.forEach(name => initSection(name));

  // Scroll-spy: update active nav link as user scrolls
  setupScrollSpy();

  // If there's a hash, scroll to it
  const hash = location.hash.slice(1);
  if (hash && ROUTES[hash]) {
    scrollToSection(hash, false);
  }
}

// ── Smooth scroll to a section anchor (mobile) ───────────────
function scrollToSection(name, smooth = true) {
  const target = document.getElementById('section-' + name);
  if (!target) return;
  const navH = document.getElementById('navbar')?.offsetHeight || 0;
  const top  = target.getBoundingClientRect().top + window.scrollY - navH - 8;
  window.scrollTo({ top, behavior: smooth ? 'smooth' : 'instant' });
}

// ── Scroll-spy for mobile nav ─────────────────────────────────
let scrollSpyTimer = null;
function setupScrollSpy() {
  window.removeEventListener('scroll', onScrollSpy);
  window.addEventListener('scroll', onScrollSpy, { passive: true });
}

function onScrollSpy() {
  if (scrollSpyTimer) return;
  scrollSpyTimer = requestAnimationFrame(() => {
    scrollSpyTimer = null;
    const navH = document.getElementById('navbar')?.offsetHeight || 60;
    let active = ROUTE_ORDER[0];
    for (const name of ROUTE_ORDER) {
      const el = document.getElementById('section-' + name);
      if (!el) continue;
      if (el.getBoundingClientRect().top <= navH + 40) active = name;
    }
    setActiveNav(active);
    // Update hash silently without pushing history
    history.replaceState({ section: active, mode: 'mobile' }, '', '#' + active);
  });
}

// ============================================================
//  SHARED helpers
// ============================================================
function setActiveNav(name) {
  document.querySelectorAll('.nav-link').forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === '#' + name);
  });
}

function closeMenu() {
  document.getElementById('nav-links')?.classList.remove('open');
  resetHamburger();
}

// ============================================================
//  CLICK DELEGATION
//  • Desktop → SPA navigate()
//  • Mobile  → smooth-scroll to section anchor
// ============================================================
document.addEventListener('click', e => {
  const link = e.target.closest('a[href^="#"]');
  if (!link) return;
  const section = link.getAttribute('href').slice(1);
  if (!ROUTES[section]) return;   // not a route → normal behaviour
  e.preventDefault();
  closeMenu();
  if (isMobile()) {
    scrollToSection(section);
  } else {
    navigate(section);
  }
});

// ── Browser back / forward ─────────────────────────────────
window.addEventListener('popstate', e => {
  const name = e.state?.section || 'home';
  if (isMobile()) {
    scrollToSection(name);
  } else {
    navigate(name);
  }
});

// ============================================================
//  MODE SWITCHER — re-initialises when viewport crosses 768 px
// ============================================================
function initMode() {
  const mode = isMobile() ? 'mobile' : 'desktop';
  if (mode === currentMode) return;   // already in this mode
  currentMode = mode;
  current = null;                     // reset desktop route tracker

  const app = document.getElementById('app');

  if (mode === 'mobile') {
    // Remove desktop-only classes/state
    app.classList.add('app-visible');
    loadMobileMode();
  } else {
    // Switch to desktop SPA
    window.removeEventListener('scroll', onScrollSpy);
    app.innerHTML = '';
    app.classList.remove('app-visible');
    const hash = location.hash.slice(1);
    navigate(ROUTES[hash] ? hash : 'home');
  }
}

// Debounced resize handler
let resizeTimer = null;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(initMode, 250);
});

// ── Initial page load ────────────────────────────────────────
initMode();
