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

// ── Navigate to a named section ─────────────────────────────
async function navigate(name) {
  if (!ROUTES[name]) name = 'home';
  if (current === name) return;

  const app = document.getElementById('app');

  // 1) Exit animation
  app.classList.remove('app-visible');
  await sleep(280);

  // 2) Fetch (or use cache)
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

  // 3) Inject HTML
  app.innerHTML = cache[name];
  current = name;

  // 4) Scroll to top
  window.scrollTo({ top: 0, behavior: 'instant' });

  // 5) Push URL hash
  history.pushState({ section: name }, '', '#' + name);

  // 6) Update active nav link
  document.querySelectorAll('.nav-link').forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === '#' + name);
  });

  // 7) Enter animation (double rAF ensures DOM has painted)
  requestAnimationFrame(() => requestAnimationFrame(() => {
    app.classList.add('app-visible');
  }));

  // 8) Run section-specific JS
  initSection(name);
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
  // Close mobile menu
  document.getElementById('nav-links')?.classList.remove('open');
  resetHamburger();
});

// ── Initial page load ────────────────────────────────────────
const initHash = location.hash.slice(1);
navigate(ROUTES[initHash] ? initHash : 'home');

// ── Utility ──────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
