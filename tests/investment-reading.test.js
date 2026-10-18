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
  for (const book of books) {
    const entry = doc.getElementById('book-' + book.id);
    assert(entry.textContent.includes(book.theme));
    assert.equal(entry.querySelectorAll('.book-detail ol li').length, 3);
    assert.equal(entry.querySelectorAll('h4').length, 4);
    assert(entry.querySelector('.book-source a').href.startsWith('https://'));
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
