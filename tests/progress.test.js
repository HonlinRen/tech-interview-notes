const test = require("node:test");
const assert = require("node:assert/strict");
const { page } = require("./helpers");

test('合并题按更新时间迁移进度，显式取消不会被旧槽覆盖', t => {
  const dom=page('developer/java.html',{before(w){
    w.localStorage.setItem('study-progress-v3:java:thread-pool-params',JSON.stringify({status:'new',updatedAt:20}));
    w.localStorage.setItem('study-progress-v3:java:thread-pool-flow',JSON.stringify({status:'mastered',updatedAt:10}));
  }});t.after(()=>dom.window.close());const w=dom.window,store=w.StudyStore;
  assert.equal(store.status('java:thread-pool-params'),'new');
  w.localStorage.setItem('study-progress-v3:java:thread-pool-flow',JSON.stringify({status:'review',updatedAt:30}));
  w.dispatchEvent(new w.StorageEvent('storage',{key:'study-progress-v3:java:thread-pool-flow'}));
  assert.equal(store.status('java:thread-pool-params'),'review');
  store.setStatus('java:thread-pool-params','new');assert.equal(store.status('java:thread-pool-flow'),'new');
});
test('当前题目的状态键不再指向已移除的别名',t=>{
  const dom=page('index.html');t.after(()=>dom.window.close());
  const index=require('../scripts/content').buildIndex(require('node:path').join(__dirname,'..'));
  for(const q of index.questions) assert.equal(dom.window.StudyStore.key(q),q.category+':'+q.id);
});
test('首页继续学习入口识别合并前的题目 ID',async t=>{
  const dom=page('index.html',{before(w){w.localStorage.setItem('study-current-question','java:thread-pool-flow');}});t.after(()=>dom.window.close());
  await new Promise(resolve=>setImmediate(resolve));
  const link=dom.window.document.querySelector('.continue-learning');assert(!link.hidden);assert.match(link.href,/#thread-pool-params$/);
});
test("首页与专题页共享历史题目迁移，状态可取消且不复活", async t => {
  for (const file of ["index.html", "developer/ai.html"]) {
    const dom = page(file, { before(w) { w.localStorage.setItem("study-learned-v2", JSON.stringify({ "ai:what-is-mcp": true, "ai:chunk-design": true })); } });
    t.after(() => dom.window.close());
    const store = dom.window.StudyStore;
    assert.equal(store.status("ai:mcp-and-tool-calling"), "mastered");
    assert.equal(store.status("rag-vector:chunk-design"), "mastered");
    store.setStatus("ai:mcp-and-tool-calling", "new");
    assert.equal(store.status("ai:mcp-and-tool-calling"), "new");
    store.setStatus("ai:mcp-and-tool-calling", "review");
    assert.equal(store.status("ai:mcp-and-tool-calling"), "review");
  }
});
test("不同标签页修改不同题目，不会整份覆盖；同题响应 storage 事件", t => {
  const dom = page("developer/java.html"); t.after(() => dom.window.close());
  const w = dom.window, store = w.StudyStore;
  store.setStatus("java:volatile", "mastered");
  w.localStorage.setItem("study-progress-v3:java:aqs", JSON.stringify({ status: "review", updatedAt: Date.now() }));
  w.dispatchEvent(new w.StorageEvent("storage", { key: "study-progress-v3:java:aqs" }));
  assert.equal(store.status("java:volatile"), "mastered"); assert.equal(store.status("java:aqs"), "review");
  w.localStorage.setItem("study-progress-v3:java:volatile", JSON.stringify({ status: "new", updatedAt: Date.now() }));
  w.dispatchEvent(new w.StorageEvent("storage", { key: "study-progress-v3:java:volatile" }));
  assert.equal(store.status("java:volatile"), "new");
  assert.equal(w.document.querySelector("#volatile .question-progress").value, "new");
});
test("进度导入先完整校验，再覆盖同题；支持导出恢复", t => {
  const dom = page("developer/java.html"); t.after(() => dom.window.close());
  const store = dom.window.StudyStore;
  store.setStatus("java:volatile", "review"); const backup = store.exportData();
  store.setStatus("java:volatile", "mastered"); store.importData(backup);
  assert.equal(store.status("java:volatile"), "review");
  const invalid = { version: 3, records: { "java:volatile": { status: "mastered", updatedAt: 1 }, "bad:unknown": { status: "new", updatedAt: 1 } } };
  assert.throws(() => store.importData(JSON.stringify(invalid)));
  assert.equal(store.status("java:volatile"), "review");
});
test("localStorage 不可用时专题仍能初始化并使用临时进度", t => {
  const dom = page("developer/java.html", { before(w) { Object.defineProperty(w, "localStorage", { get() { throw new Error("blocked"); } }); } });
  t.after(() => dom.window.close());
  const store = dom.window.StudyStore; store.setStatus("java:volatile", "review");
  assert.equal(store.available, false); assert.equal(store.status("java:volatile"), "review");
  assert(dom.window.document.querySelectorAll(".question-card").length > 0);
});
