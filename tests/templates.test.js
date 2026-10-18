const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const topics = require('../assets/topics');
const { root, projectRoot } = require('./helpers');
const { parseSource, renderPage } = require('../scripts/templates');

test('Eleventy 输出与开发预览一致；题库 Markdown 与实验笔记 HTML 均保留代码、表格和 SVG', () => {
  const files = [...topics.map(topic => topic.path), ...fs.readdirSync(path.join(projectRoot, 'src/developer/llm-infra-lab')).filter(file => file.endsWith('.html')).map(file => 'developer/llm-infra-lab/' + file)];
  for (const file of ['index.html', ...files]) {
    const relative = file === 'index.html' ? 'index.njk' : topics.some(t=>t.path===file) ? file.replace('.html','.md') : file;
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    const preview = renderPage(projectRoot, relative);
    assert.equal(preview.trim(), html.trim(), file + ' 开发与部署输出不一致');
    if (file === 'index.html') continue;
    const source = parseSource(fs.readFileSync(path.join(projectRoot, 'src', relative), 'utf8'));
    const before = new JSDOM('<main>' + (relative.endsWith('.md') ? require('../assets/markdown').render(source.content) : source.content) + '</main>');
    const after = new JSDOM(html);
    const sections = doc => [...doc.window.document.querySelectorAll('main > section')].map(section => section.outerHTML);
    assert.deepEqual(sections(after), sections(before), file + ' 正文被模板修改');
    assert(!after.window.document.querySelector('head style'), file + ' 遗留页面内联样式');
    before.window.close(); after.window.close();
  }
});

test('实际 Eleventy 构建保留正文模板符号，并将公共组件修改应用到所有专题', async t => {
  const directory = path.join(projectRoot, '.local-backups');
  fs.mkdirSync(directory, { recursive: true });
  const fixture = fs.mkdtempSync(path.join(directory, 'template-test-'));
  t.after(() => {
    assert(fs.realpathSync(fixture).startsWith(fs.realpathSync(directory) + path.sep));
    fs.rmSync(fixture, { recursive: true, force: true });
  });
  fs.cpSync(path.join(projectRoot, 'src'), path.join(fixture, 'src'), { recursive: true });
  const sourcePath = path.join(fixture, 'src/developer/java.md');
  const original = parseSource(fs.readFileSync(sourcePath, 'utf8'));
  const literal = '{{ user.name }} {% if condition %} {% endraw %} {# literal comment #}';
  fs.writeFileSync(sourcePath, original.prefix + '## 原样代码 {#literal}\n\n### 面试快答\n\n符号不执行\n\n### 详细解析\n\n~~~text\n' + literal + '\n~~~');
  const toolbar = path.join(fixture, 'src/_includes/components/toolbar.njk');
  fs.appendFileSync(toolbar, '<p class="shared-template-proof">统一组件</p>');
  const { default: Eleventy } = await import('@11ty/eleventy');
  const configPath = path.join(fixture, 'eleventy.config.cjs');
  fs.writeFileSync(configPath, `
    const { createEnvironment, bundles } = require(${JSON.stringify(path.join(projectRoot, 'scripts/templates'))});
    const topics = require(${JSON.stringify(path.join(projectRoot, 'assets/topics'))});
    module.exports = config => {
      config.setUseGitIgnore(false);
      config.setLibrary('md', { render: require(${JSON.stringify(path.join(projectRoot, 'assets/markdown'))}).render });
      config.addGlobalData('eleventyComputed', { markdownSource: data => data.page.inputPath.endsWith('.md') ? require(${JSON.stringify(path.join(projectRoot, 'scripts/templates'))}).parseSource(require('node:fs').readFileSync(data.page.inputPath,'utf8')).content : '' });
      config.setLibrary('njk', createEnvironment(${JSON.stringify(fixture)}));
      config.addGlobalData('topics', topics); config.addGlobalData('bundles', bundles);
      return { dir: { includes: '_includes' }, templateFormats: ['html', 'njk', 'md'], htmlTemplateEngine: false, markdownTemplateEngine: false };
    };
  `);
  const site = new Eleventy(path.join(fixture, 'src'), path.join(fixture, 'output'), {
    configPath, quietMode: true
  });
  await site.write();
  const rendered = fs.readFileSync(path.join(fixture, 'output/developer/java.html'), 'utf8');
  const dom = new JSDOM(rendered);
  assert.equal(dom.window.document.querySelector('pre code').textContent, literal+'\n');
  dom.window.close();
  for (const topic of topics) assert(fs.readFileSync(path.join(fixture, 'output', topic.path), 'utf8').includes('shared-template-proof'), topic.id);
  assert(renderPage(fixture, 'developer/java.md').includes(literal));
});
