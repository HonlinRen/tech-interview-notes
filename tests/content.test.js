const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");
const topics = require("../assets/topics");
const { root, page } = require("./helpers");
const { validateSections } = require("../scripts/content");
const normalize = text => text.replace(/\s+/g, " ").trim();
test('旧题链接跳到合并目标，删除题回到专题正文入口',t=>{
  const merged=page('developer/java.html',{hash:'#thread-pool-flow'}),removed=page('developer/java.html',{hash:'#java-bytecode'});
  t.after(()=>{merged.window.close();removed.window.close();});
  assert.equal(merged.window.location.hash,'#thread-pool-params');assert.equal(removed.window.location.hash,'#main-content');
});
test('损坏的 URL 编码不会阻止题目初始化',t=>{
  const dom=page('developer/java.html',{hash:'#%E0%A4%A'});t.after(()=>dom.window.close());
  assert.equal(dom.window.document.querySelectorAll('.question-card').length,32);
});
test("全部专题的 Markdown 在构建、浏览器预览与编辑加载中一致", async t => {
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
  const valid = '## 示例 {#example}\n\n### 面试快答\n\n**重点** [链接](https://example.com)\n\n### 详细解析\n\n| a | b |\n| --- | --- |\n| 1 | 2 |\n\n<script>alert(1)</script>\n\n~~~java\na < b\n{{ literal }} {% if x %}\n~~~';
  const dom = new JSDOM(renderer.render(valid));
  assert(dom.window.document.querySelector('table')); assert(dom.window.document.querySelector('strong')); assert(!dom.window.document.querySelector('script'));
  assert.match(dom.window.document.querySelector('pre code').textContent,/a < b/); dom.window.close();
  for (const bad of [valid+'\n\n'+valid,valid.replace('example','markdown-source'),valid.replace('### 详细解析','### 其他'),'前言\n'+valid,valid.replace('## 示例 {#example}','## 缺少 ID')]) assert.throws(()=>renderer.render(bad));
});
test("服务器拒绝重复 ID、保留 ID、活动内容和危险地址", () => {
  for (const body of [
    '<section id="x"><h2>A</h2></section><section id="x"><h2>B</h2></section>',
    '<section id="searchInput"><h2>A</h2></section>', '<section id="x"><p>无标题</p></section>',
    '<section id="x"><h2>A</h2><script>alert(1)</script></section>',
    '<section id="x"><h2>A</h2><img onerror="alert(1)" src="x"></section>',
    '<section id="x"><h2>A</h2><a href="java&#10;script:alert(1)">x</a></section>'
  ]) assert.throws(() => validateSections(body));
});
test("深链接优先于上次学习位置，自测和学习筛选正常工作", async t => {
  const dom = page("developer/java.html", { hash: "#volatile", mobile: true, before(w) { w.localStorage.setItem("study-current-question", "java:aqs"); } });
  t.after(() => dom.window.close());
  await new Promise(resolve => dom.window.requestAnimationFrame(resolve));
  assert.equal(dom.window.__scrolled, "volatile");
  assert.equal(dom.window.document.querySelector(".toc-group").open, false);
  const button = dom.window.document.querySelector("#selfTestBtn"); button.click();
  assert(dom.window.document.body.classList.contains("self-test"));
  const reveal = dom.window.document.querySelector("#volatile .reveal-answer"); reveal.click();
  assert.equal(reveal.getAttribute("aria-expanded"), "true");
  const select = dom.window.document.querySelector("#volatile .question-progress"); select.value = "review"; select.dispatchEvent(new dom.window.Event("change"));
  assert.equal(dom.window.document.querySelector("#volatile").dataset.learningStatus, "review");
  const filter = dom.window.document.getElementById("progressFilter"); filter.value = "review"; filter.dispatchEvent(new dom.window.Event("change"));
  assert.equal(dom.window.document.body.dataset.progressFilter, "review");
  assert.equal(dom.window.document.getElementById("sessionStatus").textContent, "当前显示 1 题");
});
test("首页搜索跨专题返回结果，标题优先，统计跟随进度更新", async t => {
  const dom = page("index.html"); t.after(() => dom.window.close()); await new Promise(resolve => setImmediate(resolve));
  const w = dom.window, input = w.document.getElementById("globalSearch");
  assert.equal(w.__requests.filter(url => url.includes("search-index")).length, 0, "首页统计不加载全文");
  input.value = "KV Cache"; input.dispatchEvent(new w.Event("input"));
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(w.__requests.filter(url => url.includes("search-index")).length, 1);
  assert(w.document.querySelectorAll(".global-result").length > 0);
  assert.match(w.document.querySelector(".global-result strong").textContent, /KV Cache/i);
  w.StudyStore.setStatus("java:volatile", "mastered");
  assert.match(w.document.getElementById("homeStats").textContent, /已掌握 1/);
  input.value = "afterExecute"; input.dispatchEvent(new w.Event("input"));
  assert(w.document.querySelectorAll(".global-result").length > 0, "题目末尾的关键词也能全站检索");
  input.value = "不存在的匹配词xyz"; input.dispatchEvent(new w.Event("input"));
  assert.match(w.document.getElementById("globalResults").textContent, /没有找到/);
});
test("静态托管的专题不显示本地写入按钮，学习与自测仍可使用", t => {
  const dom = page("developer/java.html"); t.after(() => dom.window.close());
  assert.equal(dom.window.document.querySelectorAll('[data-action="edit-primary"], .add-btn, .delete-btn').length, 0);
  assert(dom.window.document.querySelector("#selfTestBtn"));
});
test("专题搜索支持方向键选择、Escape 返回；空结果不会保留旧跳转目标", t => {
  const dom = page("developer/java.html"); t.after(() => dom.window.close()); const w = dom.window;
  const input = w.document.getElementById("searchInput"); input.value = "volatile"; input.dispatchEvent(new w.Event("input"));
  input.dispatchEvent(new w.KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true }));
  assert(w.document.activeElement.classList.contains("search-suggestion"));
  w.document.activeElement.dispatchEvent(new w.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  assert.equal(w.document.activeElement, input);
  input.value = "不存在的词xyz"; input.dispatchEvent(new w.Event("input"));
  assert.equal(w.document.getElementById("searchSuggestions")._matches.length, 0);
});
