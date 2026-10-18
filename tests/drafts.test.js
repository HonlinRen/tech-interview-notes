const test = require('node:test');
const assert = require('node:assert/strict');
const { page } = require('./helpers');
function version(w) { const meta = w.document.createElement('meta'); meta.name='document-version';meta.content='original-version';w.document.head.append(meta); }
function edit(w, text) {
  w.document.querySelector('[data-action="edit-primary"]').click();
  const input=w.document.querySelector('#markdown-input');input.value+=text;input.dispatchEvent(new w.Event('input',{bubbles:true}));return input;
}
test('Markdown 草稿保留未预览的代码，取消后停止定时写入及离开提醒',async t=>{
  const dom=page('developer/java.html',{before:version});t.after(()=>dom.window.close());const w=dom.window;
  edit(w,'\n\n~~~java\n未预览代码\n~~~');w.StudyDraft.capture();
  const draft=JSON.parse(w.localStorage.getItem(w.StudyDraft.key));assert(draft.markdown.includes('未预览代码'));assert.equal(draft.version,'original-version');
  const before=new w.Event('beforeunload',{cancelable:true});w.dispatchEvent(before);assert(before.defaultPrevented);
  w.document.querySelector('[data-action="cancel"]').click();await new Promise(r=>setTimeout(r,650));
  assert.equal(w.localStorage.getItem(w.StudyDraft.key),null);
  const after=new w.Event('beforeunload',{cancelable:true});w.dispatchEvent(after);assert(!after.defaultPrevented);
});
test('恢复旧版 Markdown 草稿，冲突保存保留草稿与当前文件版本',async t=>{
  const key='study-markdown-draft:/developer/java.html:older';
  const restored='## 恢复题 {#restored}\n\n### 面试快答\n\n恢复快答\n\n### 详细解析\n\n恢复解析';
  const dom=page('developer/java.html',{before(w){version(w);w.localStorage.setItem(key,JSON.stringify({version:'older-version',savedAt:1,markdown:restored}));}});
  t.after(()=>dom.window.close());const w=dom.window;
  [...w.document.querySelectorAll('.draft-banner button')].find(b=>b.textContent==='恢复').click();
  assert.equal(w.document.querySelector('#markdown-input').value,restored);assert.equal(w.StudySave.version,'original-version');
  let request;
  w.fetch=async(url,options)=>{request=JSON.parse(options.body);return {ok:false,json:async()=>({ok:false,error:'文件已变化'})};};
  w.document.querySelector('[data-action="save-exit"]').click();await new Promise(r=>setImmediate(r));
  assert.equal(request.version,'older-version');assert.equal(request.markdown,restored);
  assert.equal(w.StudySave.version,'original-version');assert(w.localStorage.getItem(w.StudyDraft.key));assert(w.localStorage.getItem(key));
  assert.match(w.document.querySelector('.markdown-status').textContent,/文件已变化/);
  assert(!w.document.querySelector('#markdown-input').readOnly);
});
test('多个编辑页面使用独立草稿槽，清除当前草稿保留其他页面草稿及旧 HTML 草稿',t=>{
  const first=page('developer/java.html',{before:version}),second=page('developer/java.html',{before:version});
  t.after(()=>{first.window.close();second.window.close();});const w=first.window;
  assert.notEqual(w.StudyDraft.key,second.window.StudyDraft.key);
  w.localStorage.setItem(second.window.StudyDraft.key,JSON.stringify({version:'original-version',savedAt:1,markdown:'other'}));
  const legacy='study-draft:/developer/java.html:legacy';w.localStorage.setItem(legacy,JSON.stringify({sections:'<section>旧草稿</section>'}));
  edit(w,'\n新增');w.StudyDraft.capture();
  assert(w.localStorage.getItem(w.StudyDraft.key));assert(w.localStorage.getItem(second.window.StudyDraft.key));
  assert.match(w.document.querySelector('.draft-banner').textContent,/旧版 HTML/);
  w.StudyDraft.clear();assert.equal(w.localStorage.getItem(w.StudyDraft.key),null);assert(w.localStorage.getItem(legacy));assert(w.localStorage.getItem(second.window.StudyDraft.key));
});
