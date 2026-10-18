const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const { JSDOM } = require("jsdom");
const topics = require("../assets/topics");
const { buildIndex, summaryIndex, searchIndex, validateSections } = require("./content");
const root = path.join(__dirname, "..");
const siteRoot = path.join(root, '_site');
for (const field of ["id", "file", "path"]) assert.equal(new Set(topics.map(t => t[field])).size, topics.length, "专题配置重复：" + field);
for (const topic of topics) assert.equal(topic.path, "developer/" + topic.file, "专题文件与路径不一致");
const files = fs.readdirSync(siteRoot, { recursive: true }).filter(file => file.endsWith('.html')).map(file => file.replaceAll('\\', '/'));
const docs = new Map(files.map(file => [file, new JSDOM(fs.readFileSync(path.join(siteRoot, file), "utf8")).window.document]));
for (const [file, doc] of docs) {
  assert(doc.querySelector('link[href$="assets/theme.css"]'), file + ' 缺少统一视觉样式');
  if (doc.body.classList.contains('site-theme')) {
    assert.equal(doc.querySelectorAll('.site-nav-links a').length, 4, file + ' 缺少站点导航');
    assert(doc.getElementById('main-content'), file + ' 缺少可跳转的正文入口');
  }
  const ids = new Set();
  for (const node of doc.querySelectorAll("[id]")) { assert(!ids.has(node.id), file + " 重复 ID: " + node.id); ids.add(node.id); }
  const scripts = [...doc.querySelectorAll("script[src]")].map(script => script.getAttribute("src"));
  assert.equal(new Set(scripts).size, scripts.length, file + " 重复加载脚本");
  for (const node of doc.querySelectorAll("[href], [src]")) {
    const ref = node.getAttribute("href") || node.getAttribute("src");
    if (!ref || /^(?:[a-z]+:|\/\/)/i.test(ref)) continue;
    const [relative, anchor] = ref.split("#");
    const target = path.resolve(path.dirname(path.join(siteRoot, file)), relative.split("?")[0] || path.basename(file));
    assert(target.startsWith(siteRoot + path.sep), "引用超出项目: " + ref);
    assert(fs.existsSync(target), file + " 引用不存在: " + ref);
    const relativeTarget = path.relative(siteRoot, target).replaceAll("\\", "/");
    if (anchor && docs.has(relativeTarget)) {
      const targetDoc = docs.get(relativeTarget);
      if (anchor.startsWith('/') && targetDoc.querySelector('[data-route="' + anchor.slice(1) + '"]')) continue;
      assert(targetDoc.getElementById(decodeURIComponent(anchor)), file + " 锚点不存在: " + ref);
    }
  }
}
for (const topic of topics) {
  const doc = docs.get(topic.path);
  assert.equal(doc.body.dataset.category, topic.id);
  assert.equal(doc.querySelectorAll("h1").length, 1, topic.path + " 缺少页面级标题");
  const nav = [...doc.querySelectorAll("#topicSelect option")];
  assert.deepEqual(nav.map(option => option.value), topics.map(t => t.id), topic.path + " 专题导航不一致，请运行 npm run build");
  assert.equal(doc.querySelector("#topicSelect").value, topic.id);
  validateSections([...doc.querySelectorAll("main > section")].map(n => n.outerHTML).join("\n"));
  const card = docs.get("index.html").querySelector('.home-topic-list a[href="' + topic.path + '"]');
  assert(card, "首页缺少专题入口");
  assert.equal(card.querySelector("h2").textContent, topic.label);
  assert.equal(card.querySelector("p").textContent, topic.description);
}
for (const [file, doc] of docs) {
  if (!file.startsWith("developer/llm-infra-lab/")) continue;
  assert.equal(doc.querySelectorAll("h1").length, 1, file + " 缺少页面级标题");
  assert(doc.querySelector('link[href="../../assets/lab.css"]'), file + " 缺少共享阅读样式");
  assert(doc.querySelector('script[src="../../assets/lab.js"]'), file + " 缺少共享导航脚本");
  assert(doc.querySelector('.lab-nav a[href="../../index.html"]'), file + " 缺少返回入口");
  assert.equal(doc.querySelectorAll(".lab-toc a").length, doc.querySelectorAll("main > section").length, file + " 章节目录不完整");
  assert(!doc.querySelector('script[src^="http"], link[rel="stylesheet"][href^="http"]'), file + " 不应依赖远程展示资源");
}
const index = buildIndex(root);
const currentKeys = new Set(index.questions.map(q => q.category + ':' + q.id));
const redirectsContext = { window: {} };
require('node:vm').runInNewContext(fs.readFileSync(path.join(root,'assets/question-redirects.js'),'utf8'),redirectsContext);
for (const [old, target] of Object.entries(redirectsContext.window.StudyQuestionRedirects)) {
  assert(currentKeys.has(target) || target.endsWith(':main-content'), '旧题重定向目标不存在：'+old+' → '+target);
}
for (const topic of topics) {
  const source = require('./templates').parseSource(fs.readFileSync(path.join(root,'src',require('./templates').sourcePath(topic)),'utf8')).content;
  const questions = require('../assets/markdown').parse(source);
  assert(questions.length > 0,topic.id+' 无题目');
  for (const q of questions) {
    const card=docs.get(topic.path).getElementById(q.id);
    assert.deepEqual([...card.querySelectorAll(':scope > h3')].map(n=>n.textContent),['面试快答','详细解析'],topic.id+':'+q.id+' 结构不统一');
  }
}
assert.deepEqual(JSON.parse(fs.readFileSync(path.join(siteRoot, "assets/questions-index.json"))), summaryIndex(index), "静态索引过期，请运行 npm run build");
assert.deepEqual(JSON.parse(fs.readFileSync(path.join(siteRoot, "assets/search-index.json"))), searchIndex(index), "全文索引过期，请运行 npm run build");
for (const doc of docs.values()) doc.defaultView.close();
console.log('通过：' + files.length + ' 个页面的链接、锚点、ID、导航、内容结构和索引一致性');
