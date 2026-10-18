const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");
const { root, page } = require("./helpers");
const version = w => { const meta = w.document.createElement("meta"); meta.name = "document-version"; meta.content = "presentation-test"; w.document.head.append(meta); };
test("专题页有页面标题、精简导航和分组目录；每道题在目录中出现一次", t => {
  const dom = page("developer/java.html"); t.after(() => dom.window.close()); const d = dom.window.document;
  assert.equal(d.querySelectorAll("h1").length, 1);
  assert.equal(d.querySelectorAll("#topicSelect option").length, 17);
  assert.equal(d.querySelector("#topicSelect").value, "java");
  assert(d.querySelector(".tools-more .progress-tools"));
  assert.equal(d.querySelectorAll(".learned-btn, .question-permalink").length, 0);
  assert(d.querySelectorAll(".toc-subgroup").length >= 4);
  const links = [...d.querySelectorAll(".toc-links a")].map(link => link.hash.slice(1));
  assert.equal(links.length, d.querySelectorAll("main > section").length); assert.equal(new Set(links).size, links.length);

});
test("Markdown 增删题目仅修改草稿，取消不改变学习状态", async t => {
  const dom = page('developer/java.html',{ before:version }); t.after(()=>dom.window.close());
  const w=dom.window,d=w.document;
  w.StudyStore.setStatus('java:volatile','mastered');
  d.querySelector('[data-action="edit-primary"]').click();
  const input=d.querySelector('#markdown-input');
  input.value=input.value.replace(/## volatile[\s\S]*?(?=\n## )/,'')+'\n\n## 新增 {#presentation-new}\n\n### 面试快答\n\n快答\n\n### 详细解析\n\n解析\n';
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

test("所有实验笔记提供导航、主题、表格滚动和图示放大，同时保留正文与代码", t => {
  for (const file of fs.readdirSync(path.join(root, "developer/llm-infra-lab")).filter(f => f.endsWith(".html"))) {
    const relative = "developer/llm-infra-lab/" + file;
    const original = new JSDOM(fs.readFileSync(path.join(root, relative), "utf8"));
    const dom = page(relative); t.after(() => { original.window.close(); dom.window.close(); }); const w = dom.window, d = w.document;
    assert.equal(d.querySelectorAll(".lab-toc a").length, d.querySelectorAll("main > section").length);
    assert(d.querySelector('.lab-nav a[href="../../index.html"]'));
    assert.equal(d.querySelectorAll(".lab-table-scroll > table").length, d.querySelectorAll("main table").length);
    assert.equal(d.querySelectorAll(".diagram-zoom").length, d.querySelectorAll("main svg").length);
    assert.deepEqual([...d.querySelectorAll("main pre")].map(pre => pre.textContent), [...original.window.document.querySelectorAll("main pre")].map(pre => pre.textContent));
    d.querySelector("#labTheme").click(); assert(d.body.classList.contains("dark"));
    d.querySelector("#labTheme").click(); assert(!d.body.classList.contains("dark"));
    const button = d.querySelector(".diagram-zoom");
    if (button) {
      w.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
      w.HTMLDialogElement.prototype.close = function () { this.open = false; this.dispatchEvent(new w.Event("close")); };
      button.click(); const dialog = d.querySelector("dialog"); assert(dialog.open); assert(dialog.querySelector("svg"));
      const ids = [...d.querySelectorAll("[id]")].map(node => node.id); assert.equal(new Set(ids).size, ids.length);
      dialog.querySelector("button").click(); assert.equal(d.querySelector("dialog"), null); assert.equal(d.activeElement, button);
    }
  }
});
