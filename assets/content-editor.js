(function () {
  if (!document.querySelector('meta[name="document-version"]')) return;
  const source = document.getElementById('markdown-source'), tools = document.querySelector('.study-tools');
  if (!source || !tools) return;
  const file = window.StudyTopics.find(t => t.id === document.body.dataset.category).file;
  const storage = window.StudyStore.storage, prefix = 'study-markdown-draft:' + location.pathname + ':';
  const key = prefix + crypto.randomUUID();
  const controls = document.createElement('div'); controls.className = 'markdown-controls';
  controls.innerHTML = '<button type="button" class="tool-btn" data-action="edit-primary">编辑 Markdown</button><span role="status" aria-live="polite"></span>'; tools.append(controls);
  const panel = document.createElement('div'); panel.className = 'markdown-editor'; panel.hidden = true;
  panel.innerHTML = '<div class="markdown-editor-bar"><strong>编辑题目</strong><button type="button" class="tool-btn" data-action="preview">预览</button><button type="button" class="tool-btn" data-action="download">下载 .md</button><button type="button" class="tool-btn" data-action="cancel">取消</button><button type="button" class="tool-btn" data-action="save-exit">保存</button></div><p class="markdown-help">用 ## 题目标题 {#固定ID} 新增题目，删除整段即可删题。每题依次使用 ### 面试快答、### 详细解析，内部小节用 ####。支持列表、表格、链接和围栏代码块。</p><label class="markdown-label" for="markdown-input">Markdown 正文</label><textarea id="markdown-input" class="markdown-input" spellcheck="false"></textarea><div class="markdown-preview" hidden aria-label="Markdown 预览"></div><p class="markdown-status" role="status" aria-live="polite"></p>'; tools.after(panel);
  const input = panel.querySelector('textarea'), preview = panel.querySelector('.markdown-preview'), status = panel.querySelector('.markdown-status');
  const banner = document.createElement('div'); banner.className = 'draft-banner'; tools.after(banner);
  let editing = false, dirty = false, timer, restoring = null, pendingVersion = null, busy = false;
  function message(text) { status.textContent = text; controls.querySelector('[role=status]').textContent = text; }
  function read(name) { try { return JSON.parse(storage.getItem(name)); } catch (_) { return null; } }
  function download(text, suffix) {
    const a = document.createElement('a'), url = URL.createObjectURL(new Blob([text], { type: 'text/markdown;charset=utf-8' }));
    a.href = url; a.download = file.replace('.html', suffix); a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function setEditing(value) {
    editing = value; panel.hidden = !value; controls.querySelector('button').hidden = value;
    document.body.classList.toggle('markdown-editing', value);
    window.dispatchEvent(new CustomEvent('study-edit-mode', { detail: value }));
    if (value) { input.setSelectionRange(0, 0); input.focus(); panel.scrollIntoView({ block: 'start' }); }
  }
  function showDrafts() {
    banner.replaceChildren();
    const drafts = storage.keys().filter(k => k.startsWith(prefix)).map(name => ({ name, draft: read(name) })).filter(x => x.draft && typeof x.draft.markdown === 'string').sort((a,b) => b.draft.savedAt - a.draft.savedAt);
    banner.hidden = drafts.length === 0;
    for (const { name, draft } of drafts) {
      const row = document.createElement('div'), label = document.createElement('span');
      label.textContent = 'Markdown 草稿 · ' + new Date(draft.savedAt).toLocaleString() + (draft.version !== window.StudySave.version ? ' · 源文件已变更' : ''); row.append(label);
      for (const [text, action] of [
        ['恢复', () => {
          if (dirty && !confirm('恢复所选草稿？当前修改会先保存为独立草稿。')) return;
          capture(); restoring = { name, savedAt: draft.savedAt }; pendingVersion = draft.version;
          input.value = draft.markdown; dirty = true; preview.hidden = true; setEditing(true);
          message(draft.version !== window.StudySave.version ? '旧版本草稿保存会被拒绝，请下载、刷新后与最新正文合并。' : '已恢复草稿，保存后写入文件。');
        }],
        ['下载', () => download(draft.markdown, '-draft.md')],
        ['删除', () => { if (confirm('删除这份草稿？')) { storage.removeItem(name); showDrafts(); } }]
      ]) { const b = document.createElement('button'); b.type = 'button'; b.className = 'tool-btn'; b.textContent = text; b.onclick = action; row.append(b); }
      banner.append(row);
    }
    const legacy = storage.keys().filter(k => k.startsWith('study-draft:' + location.pathname)).map(k => read(k)).filter(d => d && typeof d.sections === 'string');
    if (legacy.length) {
      banner.hidden = false; const note = document.createElement('p'); note.textContent = '旧版 HTML 草稿仍保留，可下载后手动迁入 Markdown。'; banner.append(note);
      legacy.forEach((draft, i) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'tool-btn'; b.textContent = '下载旧草稿 ' + (i + 1); b.onclick = () => download(draft.sections, '-legacy-draft.html'); banner.append(b); });
    }
  }
  function capture() {
    if (!editing || !dirty) return;
    try { storage.setItem(key, JSON.stringify({ markdown: input.value, version: pendingVersion || window.StudySave.version, savedAt: Date.now() })); showDrafts(); }
    catch (error) { message('草稿保存失败，请下载备份：' + error.message); }
  }
  function clear() {
    clearTimeout(timer); storage.removeItem(key);
    if (restoring && read(restoring.name)?.savedAt === restoring.savedAt) storage.removeItem(restoring.name);
    restoring = null; dirty = false; showDrafts();
  }
  controls.querySelector('button').onclick = () => { input.value = source.value; pendingVersion = null; dirty = false; setEditing(true); message(window.StudyStore.available ? '' : '浏览器存储不可用，草稿仅在本页内存中，请下载备份。'); };
  panel.onclick = async event => {
    const action = event.target.closest('[data-action]')?.dataset.action; if (!action || busy) return;
    if (action === 'download') { download(input.value, '.md'); return; }
    if (action === 'cancel') { if (dirty && !confirm('放弃本次修改并删除当前草稿？')) return; clear(); pendingVersion = null; setEditing(false); preview.hidden = true; message(''); return; }
    if (action === 'preview') {
      try {
        preview.innerHTML = window.StudyMarkdown.render(input.value); preview.hidden = false;
        // Preview IDs must not shadow the real question anchors or answer IDs.
        preview.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
        preview.querySelectorAll('pre code').forEach(code => { if (window.hljs?.getLanguage(code.className.replace('language-', ''))) window.hljs.highlightElement(code); });
        message('预览已更新，尚未保存。');
      } catch (error) { message(error.message); } return;
    }
    if (action === 'save-exit') {
      try {
        window.StudyMarkdown.parse(input.value); busy = true; input.readOnly = true; panel.querySelectorAll('button').forEach(b => b.disabled = true); message('保存中…');
        const result = await window.StudySave.save(file, input.value, pendingVersion || window.StudySave.version);
        clear(); pendingVersion = null; setEditing(false); source.value = input.value;
        if (result.warning) { message(result.warning); return; } location.reload();
      } catch (error) { capture(); message(error.message); }
      finally { busy = false; input.readOnly = false; panel.querySelectorAll('button').forEach(b => b.disabled = false); }
    }
  };
  input.oninput = () => { dirty = true; clearTimeout(timer); timer = setTimeout(capture, 600); message('未保存'); };
  window.addEventListener('beforeunload', event => { if (editing && dirty) { capture(); event.preventDefault(); event.returnValue = ''; } });
  window.addEventListener('pagehide', capture); document.addEventListener('visibilitychange', () => { if (document.hidden) capture(); }); window.addEventListener('storage', showDrafts);
  window.StudyDraft = { key, capture, clear }; showDrafts();
})();
