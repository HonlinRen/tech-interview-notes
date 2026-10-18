(function () {
  const stats = document.getElementById('homeStats');
  const hero = document.querySelector('.home-hero-study');
  const panel = document.createElement('div'); panel.className = 'home-study-tools';
  panel.innerHTML = '<label for="globalSearch">全站搜索</label><input id="globalSearch" class="search-box" type="search" placeholder="搜索题目，例如 KV Cache、事务、MCP" autocomplete="off" aria-controls="globalResults"><div id="globalResults" class="global-results" aria-live="polite"></div><a class="continue-learning" hidden>继续上次学习</a><span class="index-status" role="status"></span>';
  hero.append(panel); window.mountProgressTools(panel);
  const theme = document.createElement('button'); theme.type = 'button'; theme.className = 'tool-btn';
  panel.querySelector('.progress-tools').append(theme);
  function applyTheme() { const dark = window.StudyStore.storage.getItem('study-dark') === '1'; document.body.classList.toggle('dark', dark); theme.textContent = dark ? '浅色模式' : '深色模式'; theme.setAttribute('aria-pressed', String(dark)); }
  theme.onclick = () => { window.StudyStore.storage.setItem('study-dark', document.body.classList.contains('dark') ? '0' : '1'); applyTheme(); };
  window.addEventListener('storage', event => { if (event.key === 'study-dark' || !event.key) applyTheme(); });
  applyTheme();
  const input = panel.querySelector('input'); const results = panel.querySelector('#globalResults'); const message = panel.querySelector('.index-status');
  let questions = [], ready = false;
  let fullSearch = null;
  function loadFullSearch() {
    if (fullSearch) return fullSearch;
    message.textContent = '正在加载完整搜索…';
    fullSearch = (async () => {
      const response = await fetch('assets/search-index.json', { cache: 'no-cache' });
      if (!response.ok) throw new Error('全文索引加载失败');
      const data = await response.json();
      if (data.version !== 1 || !data.textByKey || typeof data.textByKey !== 'object') throw new Error('全文索引格式无效');
      questions.forEach(q => { q.text = data.textByKey[q.category + ':' + q.id] || q.excerpt; });
      message.textContent = ''; search();
    })().catch(() => { fullSearch = null; message.textContent = '完整搜索暂不可用，当前仅搜索标题与摘要；再次输入可重试。'; });
    return fullSearch;
  }
  function renderStats() {
    const records = window.StudyStore.records();
    const learned = questions.filter(q => records[window.StudyStore.key(q)]?.status === 'mastered').length;
    const review = questions.filter(q => records[window.StudyStore.key(q)]?.status === 'review').length;
    stats.textContent = '共 ' + questions.length + ' 题 · 已掌握 ' + learned + ' · 待复习 ' + review;
    window.StudyTopics.forEach(topic => {
      const card = document.querySelector('.home-topic-list a[href="' + topic.path + '"]');
      let badge = card.querySelector('.topic-progress');
      if (!badge) { badge = document.createElement('span'); badge.className = 'topic-progress'; card.append(badge); }
      const subset = questions.filter(q => q.category === topic.id);
      const count = subset.filter(q => records[window.StudyStore.key(q)]?.status === 'mastered').length;
      badge.textContent = count + ' / ' + subset.length + ' 已掌握';
    });
    const current = window.StudyStore.canonical(window.StudyStore.storage.getItem('study-current-question'));
    const question = questions.find(q => window.StudyStore.key(q) === current);
    const link = panel.querySelector('.continue-learning'); link.hidden = !question;
    if (question) { link.href = question.path; link.textContent = '继续学习：' + question.title; }
  }
  function search() {
    results.replaceChildren(); const query = input.value.trim().toLowerCase();
    if (!query) return;
    if (!ready) { results.textContent = '正在加载题目索引…'; return; }
    const tokens = query.split(/\s+/);
    const ranked = questions.map(q => ({ q, score: tokens.reduce((score, token) => score + (q.title.toLowerCase().includes(token) ? 4 : 0) + ((q.text || q.excerpt).toLowerCase().includes(token) ? 1 : 0), 0) }))
      .filter(({ q }) => tokens.every(token => (q.title + ' ' + (q.text || q.excerpt)).toLowerCase().includes(token))).sort((a,b) => b.score - a.score);
    const count = document.createElement('p'); count.textContent = ranked.length ? '找到 ' + ranked.length + ' 道题' + (ranked.length > 20 ? '，显示前 20 条' : '') : '没有找到匹配题目'; results.append(count);
    for (const { q } of ranked.slice(0,20)) {
      const link = document.createElement('a'); link.href = q.path; link.className = 'global-result';
      const title = document.createElement('strong'); title.textContent = q.title;
      const category = document.createElement('span'); category.textContent = window.StudyTopics.find(t => t.id === q.category).label;
      const excerpt = document.createElement('small'); excerpt.textContent = q.excerpt.slice(0,120);
      link.append(title, category, excerpt); results.append(link);
    }
  }
  input.addEventListener('input', () => { search(); if (questions.length && input.value.trim()) loadFullSearch(); });
  input.addEventListener('focus', () => { if (questions.length) loadFullSearch(); });
  input.addEventListener('keydown', event => { if (event.key === 'ArrowDown') { const first = results.querySelector('a'); if (first) { event.preventDefault(); first.focus(); } } });
  results.addEventListener('keydown', event => {
    const links = [...results.querySelectorAll('a')]; const current = links.indexOf(document.activeElement);
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); links[(current + (event.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length]?.focus(); }
    if (event.key === 'Escape') input.focus();
  });
  window.addEventListener('study-progress', renderStats);
  window.addEventListener('pageshow', () => { if (questions.length) renderStats(); });
  async function load() {
    try {
      const response = await fetch('assets/questions-index.json', { cache: 'no-cache' });
      if (!response.ok) throw new Error('索引加载失败');
      const data = await response.json();
      if (data.version !== 1 || !Array.isArray(data.questions)) throw new Error('索引格式无效');
      questions = data.questions; ready = true; renderStats(); search(); message.textContent = '';
      if (input.value.trim() || document.activeElement === input) loadFullSearch();
    } catch (_) {
      stats.textContent = '统计暂不可用'; message.replaceChildren(document.createTextNode('搜索索引加载失败。'));
      const retry = document.createElement('button'); retry.type = 'button'; retry.className = 'tool-btn'; retry.textContent = '重试'; retry.onclick = load; message.append(retry);
    }
  }
  load();
})();
