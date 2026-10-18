(function () {
  'use strict';
  function revealTarget() {
    let id;
    try { id = decodeURIComponent(location.hash.slice(1)); } catch (_) { return; }
    const target = document.getElementById(id);
    if (!target) return;
    if (target.matches('.concept-detail')) target.open = true;
    const bookDetail = target.matches('.book-entry') && target.querySelector('.book-detail');
    if (bookDetail) bookDetail.open = true;
    if (target.matches('.concept-detail, .book-entry')) target.scrollIntoView({ block: 'start' });
    document.querySelectorAll('.map-node a').forEach(link => {
      if (link.getAttribute('href') === location.hash) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  document.addEventListener('click', function (event) {
    const link = event.target.closest('a[href^="#"]');
    if (link && link.getAttribute('href') === location.hash) revealTarget();
  });
  window.addEventListener('hashchange', revealTarget);
  revealTarget();
}());
