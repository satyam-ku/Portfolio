// ============================================================
//  ROUTER.JS — Client-side SPA router
//  Fetches section HTML, injects into #app, runs init per section
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

const cache   = {};   // HTML cache so we never fetch twice
let   current = null; // Currently active route

// ── Detect mobile ────────────────────────────────────────────
const isMobile = () => window.innerWidth <= 768;

// ── Loading indicator ────────────────────────────────────────
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
  // Inject keyframes once
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

// ── Navigate to a named section ─────────────────────────────
async function navigate(name) {
  if (!ROUTES[name]) name = 'home';
  if (current === name) {
    // On mobile, just close the menu and return
    closeMenu();
    return;
  }

  const app = document.getElementById('app');

  // 0) Close mobile menu FIRST — before any animation
  closeMenu();

  // 1) Exit animation (shorter on mobile for snappier feel)
  app.classList.remove('app-visible');
  await sleep(isMobile() ? 140 : 280);

  // 2) Show loader while fetching
  if (!cache[name]) showLoader(app);

  // 3) Fetch (or use cache)
  if (!cache[name]) {
    try {
      const res = await fetch(ROUTES[name]);
      if (!res.ok) throw new Error(res.status);
      cache[name] = await res.text();
    } catch (e) {
      app.innerHTML = `<div style="text-align:center;padding:10rem 2rem;color:#f87171">
        ⚠️ Could not load section. Please refresh.</div>`;
      app.classList.add('app-visible');
      return;
    }
  }

  // 4) Inject HTML
  app.innerHTML = cache[name];
  current = name;

  // 5) Scroll to top (always instant to avoid layout glitch mid-transition)
  window.scrollTo({ top: 0, behavior: 'instant' });

  // 6) Push URL hash
  history.pushState({ section: name }, '', '#' + name);

  // 7) Update active nav link
  document.querySelectorAll('.nav-link').forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === '#' + name);
  });

  // 8) Enter animation (double rAF ensures DOM has painted)
  requestAnimationFrame(() => requestAnimationFrame(() => {
    app.classList.add('app-visible');
  }));

  // 9) Run section-specific JS
  initSection(name);
}

// ── Close mobile nav menu ────────────────────────────────────
function closeMenu() {
  document.getElementById('nav-links')?.classList.remove('open');
  resetHamburger();
}

// ── Browser back / forward ───────────────────────────────────
window.addEventListener('popstate', e => {
  navigate(e.state?.section || 'home');
});

// ── Global click delegation (nav links + in-section <a href="#..."> buttons) ─
document.addEventListener('click', e => {
  const link = e.target.closest('a[href^="#"]');
  if (!link) return;
  const section = link.getAttribute('href').slice(1);
  if (!ROUTES[section]) return;          // not a route → normal behaviour
  e.preventDefault();
  navigate(section);
});

// ── Initial page load ────────────────────────────────────────
const initHash = location.hash.slice(1);
navigate(ROUTES[initHash] ? initHash : 'home');

// ── Utility ──────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
