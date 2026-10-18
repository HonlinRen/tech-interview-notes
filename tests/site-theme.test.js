const test = require('node:test');
const assert = require('node:assert/strict');
const { page } = require('./helpers');

test('站点主题和原有页面开关同步，保留学习状态，并响应其他标签页切换', async t => {
  for (const file of ['index.html', 'developer/java.html', 'developer/llm-infra-lab/kv_cache_notes.html', 'reading/index.html']) {
    const dom = page(file); t.after(() => dom.window.close());
    const w = dom.window, d = w.document;
    const button = d.querySelector('.site-theme-toggle');
    button.click();
    await new Promise(resolve => setImmediate(resolve));
    assert(d.body.classList.contains('dark'), file);
    assert.equal(button.getAttribute('aria-pressed'), 'true');
    const legacy = d.querySelector('#darkBtn, #labTheme, .home-study-tools .progress-tools button[aria-pressed]');
    if (legacy) {
      assert.equal(legacy.textContent, '浅色模式');
      legacy.click();
      await new Promise(resolve => setImmediate(resolve));
      assert(!d.body.classList.contains('dark'), file);
      assert.equal(button.getAttribute('aria-pressed'), 'false');
    }
    w.localStorage.setItem('study-dark', '1');
    w.dispatchEvent(new w.StorageEvent('storage', { key: 'study-dark', newValue: '1' }));
    await new Promise(resolve => setImmediate(resolve));
    assert(d.body.classList.contains('dark'), file);
    assert.equal(d.querySelectorAll('.site-nav-links [aria-current]').length, 1);
  }
});

test('浏览器存储不可用时，新主题开关不会清空临时学习记录', async t => {
  const dom = page('developer/java.html', { before(w) { Object.defineProperty(w, 'localStorage', { get() { throw new Error('blocked'); } }); } });
  t.after(() => dom.window.close());
  const w = dom.window, d = w.document;
  w.StudyStore.setStatus('java:volatile', 'review');
  d.querySelector('.site-theme-toggle').click();
  await new Promise(resolve => setImmediate(resolve));
  assert(d.body.classList.contains('dark'));
  assert.equal(w.StudyStore.status('java:volatile'), 'review');
  assert.equal(d.querySelector('#darkBtn').textContent, '浅色模式');
});
