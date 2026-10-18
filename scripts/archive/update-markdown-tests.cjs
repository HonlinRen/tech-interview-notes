const fs = require('node:fs');
let s = fs.readFileSync('tests/content.test.js','utf8');
const start = s.indexOf('test('), end = s.indexOf('test("服务器拒绝');
s = s.slice(0,start) + `test("全部专题的 Markdown 在构建、浏览器预览与编辑加载中一致", async t => {
  const { parseSource, sourcePath } = require('../scripts/templates');
  const renderer = require('../assets/markdown');
  for (const topic of topics) {
    const raw = parseSource(fs.readFileSync(path.join(__dirname,'../src',sourcePath(topic)), 'utf8')).content;
    const original = new JSDOM('<main>'+renderer.render(raw)+'</main>');
    const dom = page(topic.path, { before(w) { const meta = w.document.createElement('meta'); meta.name = 'document-version'; meta.content = 'test-version'; w.document.head.append(meta); } });
    t.after(() => { original.window.close(); dom.window.close(); });
    const w = dom.window; w.document.querySelector('[data-action="edit-primary"]').click();
    assert(w.document.body.classList.contains('markdown-editing'));
    assert.equal(w.document.querySelector('#markdown-input').value, raw);
    assert.equal(w.document.querySelectorAll('[contenteditable], .code-edit-panel, .editor-format-btn').length,0);
    w.document.querySelector('[data-action="preview"]').click();
    const preview = w.document.querySelector('.markdown-preview');
    assert.equal(normalize(preview.textContent), normalize(original.window.document.querySelector('main').textContent), topic.id);
    assert.equal(preview.querySelectorAll('[id]').length,0,'预览不能复制正式锚点');
    assert.deepEqual([...preview.querySelectorAll('pre code')].map(n=>n.textContent), [...original.window.document.querySelectorAll('pre code')].map(n=>n.textContent));
    const ids = [...w.document.querySelectorAll('[id]')].map(n=>n.id); assert.equal(new Set(ids).size, ids.length);
  }
});
test("Markdown 支持表格、链接、强调与围栏代码，拒绝无效结构并转义原始 HTML", () => {
  const renderer = require('../assets/markdown');
  const valid = '## 示例 {#example}\\n\\n### 面试快答\\n\\n**重点** [链接](https://example.com)\\n\\n### 详细解析\\n\\n| a | b |\\n| --- | --- |\\n| 1 | 2 |\\n\\n<script>alert(1)</script>\\n\\n~~~java\\na < b\\n{{ literal }} {% if x %}\\n~~~';
  const dom = new JSDOM(renderer.render(valid));
  assert(dom.window.document.querySelector('table')); assert(dom.window.document.querySelector('strong')); assert(!dom.window.document.querySelector('script'));
  assert.match(dom.window.document.querySelector('pre code').textContent,/a < b/); dom.window.close();
  for (const bad of [valid+valid,valid.replace('example','markdown-source'),valid.replace('### 详细解析','### 其他'),'前言\\n'+valid,valid.replace('## 示例 {#example}','## 缺少 ID')]) assert.throws(()=>renderer.render(bad));
});
` + s.slice(end);
fs.writeFileSync('tests/content.test.js',s);
s = fs.readFileSync('tests/presentation.test.js','utf8').replace('assert.equal(links.length, 57)', 'assert.equal(links.length, d.querySelectorAll("main > section").length)').replace("  assert.equal(d.querySelector('#jvm-memory .concept-list').querySelectorAll('dt').length, 2);",'');
const from = s.indexOf('test("编辑模式增删'), to = s.indexOf('test("所有实验笔记');
s = s.slice(0,from)+`test("Markdown 增删题目仅修改草稿，取消不改变学习状态", async t => {
  const dom = page('developer/java.html',{ before:version }); t.after(()=>dom.window.close());
  const w=dom.window,d=w.document;
  w.StudyStore.setStatus('java:volatile','mastered');
  d.querySelector('[data-action="edit-primary"]').click();
  const input=d.querySelector('#markdown-input');
  input.value=input.value.replace(/## volatile[\\s\\S]*?(?=\\n## )/,'')+'\\n\\n## 新增 {#presentation-new}\\n\\n### 面试快答\\n\\n快答\\n\\n### 详细解析\\n\\n解析\\n';
  input.dispatchEvent(new w.Event('input',{bubbles:true})); w.StudyDraft.capture();
  d.querySelector('[data-action="preview"]').click();
  assert.match(d.querySelector('.markdown-preview').textContent,/新增/);
  assert.equal(w.StudyStore.status('java:volatile'),'mastered');
  assert.equal(w.__requests.filter(u=>u==='/api/save').length,0);
  w.confirm=()=>false;d.querySelector('[data-action="cancel"]').click(); assert(w.localStorage.getItem(w.StudyDraft.key));
  w.confirm=()=>true;d.querySelector('[data-action="cancel"]').click(); assert.equal(w.localStorage.getItem(w.StudyDraft.key),null);
  assert(!d.body.classList.contains('markdown-editing'));
  const event=new w.Event('beforeunload',{cancelable:true});w.dispatchEvent(event);assert(!event.defaultPrevented);
});

`+s.slice(to);
fs.writeFileSync('tests/presentation.test.js',s);
s = fs.readFileSync('tests/server.test.js','utf8').replace('src/developer/java.html','src/developer/java.md');
s = s.replace(/sections:/g,'markdown:').replace(/body\.sections/g,'body.markdown');
s = s.replace(/markdown: '<section id="save-test"[\s\S]*?section>'/, `markdown: '## 保存校验题 {#save-test}\\n\\n### 面试快答\\n\\n新内容\\n\\n### 详细解析\\n\\n~~~java\\nexact code {{ user }} {% if x %} {% endraw %}\\n~~~'`);
s = s.replace("markdown: '<section id=\"x\"><h2>A</h2><script>alert(1)</script></section>'", "markdown: '## 缺少固定ID\\n\\n无效内容'");
fs.writeFileSync('tests/server.test.js',s);
s = fs.readFileSync('tests/templates.test.js','utf8');
s = s.replace("const relative = file === 'index.html' ? 'index.njk' : file;", "const relative = file === 'index.html' ? 'index.njk' : topics.some(t=>t.path===file) ? file.replace('.html','.md') : file;");
s = s.replace("'<main>' + source.content + '</main>'", "'<main>' + (relative.endsWith('.md') ? require('../assets/markdown').render(source.content) : source.content) + '</main>'");
s = s.replaceAll('src/developer/java.html','src/developer/java.md').replace("renderPage(fixture, 'developer/java.html')","renderPage(fixture, 'developer/java.md')");
s = s.replace("original.prefix + '<section id=\"literal\"><h2>原样代码</h2><pre><code>' + literal + '</code></pre></section>'", "original.prefix + '## 原样代码 {#literal}\\n\\n### 面试快答\\n\\n符号不执行\\n\\n### 详细解析\\n\\n~~~text\\n' + literal + '\\n~~~'");
s = s.replace("config.setUseGitIgnore(false);", "config.setUseGitIgnore(false);\n      config.setLibrary('md', { render: require("+JSON.stringify(require('node:path').join(process.cwd(),'assets/markdown'))+").render });\n      config.addGlobalData('eleventyComputed', { markdownSource: data => data.page.inputPath.endsWith('.md') ? require("+JSON.stringify(require('node:path').join(process.cwd(),'scripts/templates'))+").parseSource(require('node:fs').readFileSync(data.page.inputPath,'utf8')).content : '' });");
s = s.replace("templateFormats: ['html', 'njk'], htmlTemplateEngine: false", "templateFormats: ['html', 'njk', 'md'], htmlTemplateEngine: false, markdownTemplateEngine: false");
s = s.replace('23 篇正文保留原始 HTML、代码、表格和 SVG','题库 Markdown 与实验笔记 HTML 均保留代码、表格和 SVG');
fs.writeFileSync('tests/templates.test.js',s);
