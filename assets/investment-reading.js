(function () {
  'use strict';
  const masterSelect = document.getElementById('master-select');
  const profiles = [...document.querySelectorAll('.master-profile')];
  const overview = document.querySelector('[data-master-overview]');
  const focus = document.querySelector('[data-master-focus]');
  function showMaster(id, mode = 'focus') {
    if (!masterSelect || !profiles.some(profile => profile.dataset.master === id)) return;
    masterSelect.value = id;
    focus.hidden = mode !== 'focus';
    overview.hidden = mode !== 'overview';
    masterSelect.disabled = mode === 'overview';
    profiles.forEach(profile => { profile.hidden = profile.dataset.master !== id; });
    document.querySelectorAll('[data-master-mode]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.masterMode === mode));
    });
    document.getElementById('master-status').textContent = mode === 'overview' ? '全景：18 个思想概念及其跨人物关联' : '当前聚焦：' + masterSelect.selectedOptions[0].textContent;
  }
  if (masterSelect) {
    document.querySelector('[data-master-tools]').hidden = false;
    showMaster(masterSelect.value);
    masterSelect.addEventListener('change', () => showMaster(masterSelect.value));
    document.querySelectorAll('[data-master-mode]').forEach(button => {
      button.addEventListener('click', () => showMaster(masterSelect.value, button.dataset.masterMode));
    });
  }
  function revealTarget() {
    let id;
    try { id = decodeURIComponent(location.hash.slice(1)); } catch (_) { return; }
    const target = document.getElementById(id);
    if (!target) return;
    if (target.matches('.master-profile')) showMaster(target.dataset.master);
    if (target.matches('.concept-detail, .idea-detail')) target.open = true;
    const bookDetail = target.matches('.book-entry') && target.querySelector('.book-detail');
    if (bookDetail) bookDetail.open = true;
    if (target.matches('.concept-detail, .book-entry, .idea-detail, .master-profile')) target.scrollIntoView({ block: 'start' });
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
