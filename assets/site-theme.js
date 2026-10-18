(function () {
  const button = document.querySelector('.site-theme-toggle');
  if (!button) return;
  const nav = document.querySelector('.site-nav');
  const measureNav = () => {
    const height = nav.getBoundingClientRect().height;
    if (height) document.body.style.setProperty('--site-nav-height', height + 'px');
  };
  measureNav();
  if (window.ResizeObserver) new ResizeObserver(measureNav).observe(nav);
  function updateNavigation() {
    const active = document.body.classList.contains('reading-page') ? 'reading'
      : document.body.classList.contains('lab-page') ? 'labs'
      : document.body.dataset.category ? 'topics'
      : ['labs', 'reading', 'projects'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'topics';
    nav.querySelectorAll('[data-nav]').forEach(link => {
      if (link.dataset.nav === active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  updateNavigation();
  window.addEventListener('hashchange', updateNavigation);
  function storedTheme() { return window.StudyStore ? window.StudyStore.storage.getItem('study-dark') : localStorage.getItem('study-dark'); }
  function updateButton() {
    const dark = document.body.classList.contains('dark');
    button.setAttribute('aria-pressed', String(dark));
    button.setAttribute('aria-label', dark ? '切换浅色模式' : '切换深色模式');
    button.title = button.getAttribute('aria-label');
    document.querySelectorAll('#darkBtn, #labTheme, .home-study-tools .progress-tools button[aria-pressed]').forEach(control => {
      control.textContent = dark ? '浅色模式' : '深色模式';
      control.setAttribute('aria-pressed', String(dark));
    });
  }
  try { document.body.classList.toggle('dark', storedTheme() === '1'); } catch (_) {}
  updateButton();
  button.addEventListener('click', function () {
    const dark = !document.body.classList.contains('dark');
    document.body.classList.toggle('dark', dark);
    try {
      if (window.StudyStore) window.StudyStore.storage.setItem('study-dark', dark ? '1' : '0');
      else localStorage.setItem('study-dark', dark ? '1' : '0');
    } catch (_) {}
    updateButton();
  });
  window.addEventListener('storage', function (event) {
    if (event.key && event.key !== 'study-dark') return;
    document.body.classList.toggle('dark', event.newValue === '1');
    updateButton();
  });
  new MutationObserver(updateButton).observe(document.body, { attributes: true, attributeFilter: ['class'] });
})();
