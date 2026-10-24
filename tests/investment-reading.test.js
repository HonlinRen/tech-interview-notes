const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const { renderPage } = require('../scripts/templates');
const { createApp } = require('../scripts/dev-server');
const projectRoot = path.join(__dirname, '..');

test('投资书单开发预览与静态输出完整一致，全部书籍与图谱关联可达', async t => {
  const relative = 'reading/investment-reading/index.njk';
  const preview = renderPage(projectRoot, relative);
  const built = fs.readFileSync(path.join(projectRoot, '_site/reading/investment-reading/index.html'), 'utf8');
  assert.equal(preview.trim(), built.trim());
  const dom = new JSDOM(preview);
  t.after(() => dom.window.close());
  const doc = dom.window.document;
  const books = JSON.parse(fs.readFileSync(path.join(projectRoot, 'src/_data/investmentBooks.json')));
  assert.equal(books.length, 24);
  assert.equal(doc.querySelectorAll('.book-entry').length, books.length);
  assert.equal(doc.querySelectorAll('.concept-detail').length, 8);
  assert.equal(doc.querySelectorAll('.master-profile').length, 8);
  assert.equal(doc.querySelectorAll('.idea-detail').length, 18);
  assert.equal(doc.querySelectorAll('#path .path-order > li').length, 4);
  assert.equal(doc.querySelectorAll('#path .path-svg title').length, 1);
  assert.equal(doc.querySelectorAll('.layer-figure').length, 6);
  for (const id of ['starting', 'framework', 'valuation', 'allocation']) assert(doc.querySelector('#' + id + ' .layer-figure'));
  assert(!doc.querySelector('script[src^="http"]'), '阅读内容不依赖在线组件');
  for (const book of books) {
    const entry = doc.getElementById('book-' + book.id);
    assert(entry.textContent.includes(book.theme));
    assert.equal(entry.querySelectorAll('.book-detail ol li').length, 3);
    assert.equal(entry.querySelectorAll('h4').length, 4);
    assert([...entry.querySelectorAll('.book-source a')].some(link => link.getAttribute('href') === book.source));
    assert(doc.querySelector('.map-book-links a[href="#book-' + book.id + '"]'));
  }
  for (const link of doc.querySelectorAll('a[href^="#"]')) assert(doc.getElementById(link.getAttribute('href').slice(1)), link.getAttribute('href'));
  const server = createApp(projectRoot).listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const response = await fetch('http://127.0.0.1:' + server.address().port + '/reading/investment-reading/index.html');
  assert.equal(response.status, 200);
  assert.equal((await response.text()).trim(), built.trim());
});

test('人物聚焦、全景、概念回链与无脚本内容完整可用', t => {
  const html = renderPage(projectRoot, 'reading/investment-reading/index.njk');
  const dom = new JSDOM(html, { url: 'http://localhost/reading/investment-reading/index.html#master-soros', runScripts: 'outside-only' });
  t.after(() => dom.window.close());
  const doc = dom.window.document;
  const masters = JSON.parse(fs.readFileSync(path.join(projectRoot, 'src/_data/investmentMasters.json')));
  const ideas = JSON.parse(fs.readFileSync(path.join(projectRoot, 'src/_data/investmentIdeas.json')));
  for (const master of masters) {
    const profile = doc.getElementById('master-' + master.id);
    assert(!profile.hidden, '无脚本时人物可读');
    assert(profile.textContent.includes(master.practice));
    assert(profile.textContent.includes(master.boundary));
    assert.equal(profile.querySelectorAll('.master-chain > div:first-child li').length, 3);
  }
  for (const idea of ideas) {
    const detail = doc.getElementById('idea-' + idea.id);
    assert(detail.textContent.includes(idea.meaning));
    assert(detail.querySelector('a[href="#concept-' + idea.domain + '"]'));
    for (const masterId of idea.masters) {
      assert(doc.querySelector('#master-' + masterId + ' a[href="#idea-' + idea.id + '"]'));
      assert(detail.querySelector('a[href="#master-' + masterId + '"]'));
    }
  }
  dom.window.HTMLElement.prototype.scrollIntoView = function () {};
  dom.window.eval(fs.readFileSync(path.join(projectRoot, 'assets/investment-reading.js'), 'utf8'));
  const visible = () => [...doc.querySelectorAll('.master-profile')].filter(p => !p.hidden).map(p => p.id);
  assert.deepEqual(visible(), ['master-soros']);
  doc.querySelector('[data-master-mode="overview"]').click();
  assert(!doc.querySelector('[data-master-overview]').hidden);
  assert(doc.getElementById('master-select').disabled);
  dom.window.location.hash = '#master-bogle';
  dom.window.dispatchEvent(new dom.window.HashChangeEvent('hashchange'));
  assert.deepEqual(visible(), ['master-bogle']);
  assert(!doc.querySelector('[data-master-focus]').hidden);
  assert(!doc.getElementById('master-select').disabled);
  doc.getElementById('master-select').value = 'munger';
  doc.getElementById('master-select').dispatchEvent(new dom.window.Event('change'));
  assert.deepEqual(visible(), ['master-munger']);
  dom.window.location.hash = '#idea-inversion';
  dom.window.dispatchEvent(new dom.window.HashChangeEvent('hashchange'));
  assert(doc.getElementById('idea-inversion').open);
});

test('知识图谱与书籍锚点自动展开目标，支持直接链接及重复定位', t => {
  const dom = new JSDOM(renderPage(projectRoot, 'reading/investment-reading/index.njk'), { url: 'http://localhost/reading/investment-reading/index.html#book-moats', runScripts: 'outside-only' });
  t.after(() => dom.window.close());
  dom.window.HTMLElement.prototype.scrollIntoView = function () {};
  dom.window.eval(fs.readFileSync(path.join(projectRoot, 'assets/investment-reading.js'), 'utf8'));
  const doc = dom.window.document;
  assert(doc.querySelector('#book-moats details').open);
  dom.window.location.hash = '#concept-valuation';
  dom.window.dispatchEvent(new dom.window.HashChangeEvent('hashchange'));
  assert(doc.getElementById('concept-valuation').open);
  assert.equal(doc.querySelector('.map-node a[aria-current]').getAttribute('href'), '#concept-valuation');
  doc.getElementById('concept-valuation').open = false;
  doc.querySelector('.map-node a[href="#concept-valuation"]').dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert(doc.getElementById('concept-valuation').open);
});
