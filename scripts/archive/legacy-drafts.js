(function () {
  if (!document.querySelector('meta[name="document-version"]')) return;
  const storage = window.StudyStore.storage;
  const prefix = 'study-draft:' + location.pathname;
  // Every document owns a separate slot, including duplicated tabs.
  const key = prefix + ':' + crypto.randomUUID();
  const main = document.querySelector('main');
  let timer, editing = false, dirty = false, restoring = false, source = null, selected = null;
  const banner = document.createElement('div'); banner.className = 'draft-banner'; banner.setAttribute('role', 'status');
  main.prepend(banner);
  function read(name) { try { return JSON.parse(storage.getItem(name)); } catch (_) { return null; } }
  function drafts() {
    return storage.keys().filter(name => name === prefix || name.startsWith(prefix + ':')).map(name => ({ name, draft: read(name) }))
      .filter(item => item.draft && typeof item.draft.sections === 'string').sort((a,b) => b.draft.savedAt - a.draft.savedAt);
  }
  function show() {
    const items = drafts(); banner.replaceChildren();
    if (!items.length) { banner.hidden = true; return; }
    banner.hidden = false;
    if (!items.some(item => item.name === selected)) selected = items.some(item => item.name === key) ? key : items[0].name;
    const { draft } = items.find(item => item.name === selected);
    const text = document.createElement('span');
    text.textContent = '本地草稿 · ' + new Date(draft.savedAt).toLocaleString() + (draft.version !== window.StudySave.version ? '（源文件已变化，请先下载草稿与最新内容核对）' : '') + (!window.StudyStore.available ? ' · 浏览器存储不可用，请下载备份' : '');
    const choice = document.createElement('select'); choice.setAttribute('aria-label', '选择要恢复的草稿');
    choice.hidden = items.length < 2;
    for (const item of items) { const option = document.createElement('option'); option.value = item.name; option.textContent = (item.name === key ? '当前页面 · ' : '') + new Date(item.draft.savedAt).toLocaleString(); choice.append(option); }
    choice.value = selected; choice.onchange = () => { selected = choice.value; show(); };
    const restore = document.createElement('button'); restore.type = 'button'; restore.className = 'tool-btn'; restore.textContent = '恢复草稿';
    restore.onclick = () => {
      if (editing && !confirm('用所选草稿恢复页面？当前编辑也会保留为独立草稿。')) return;
      try {
        capture(); sessionStorage.setItem('study-restore', selected); restoring = true;
        window.dispatchEvent(new Event('study-restore-navigation')); location.reload();
      } catch (_) { text.textContent = '浏览器无法恢复草稿，请下载备份'; }
    };
    const download = document.createElement('button'); download.type = 'button'; download.className = 'tool-btn'; download.textContent = '下载草稿';
    download.onclick = () => {
      const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([draft.sections], { type: 'text/plain;charset=utf-8' })); link.download = document.body.dataset.category + '-draft.html'; link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    };
    const discard = document.createElement('button'); discard.type = 'button'; discard.className = 'tool-btn'; discard.textContent = '删除草稿';
    discard.onclick = () => { if (confirm('删除所选本地草稿？已保存的文件不受影响。')) { storage.removeItem(selected); show(); } };
    banner.append(text, choice, restore, download, discard);
  }
  function capture() {
    if (!editing || !dirty || restoring) return;
    try {
      const active = document.querySelector('pre.editor-code-active');
      const panel = document.querySelector('.code-edit-panel');
      let code = null, previous = null, previousClass = null;
      if (active && panel && !panel.hidden) {
        code = active.querySelector('code');
        if (code) { previous = code.innerHTML; previousClass = code.className; code.textContent = panel.querySelector('textarea').value; const lang = panel.querySelector('select').value; code.className = lang ? 'language-' + lang : ''; }
      }
      let sections;
      try { sections = window.HtmlSerializer.serializeMainSections(); }
      finally { if (code) { code.innerHTML = previous; code.className = previousClass; } }
      storage.setItem(key, JSON.stringify({ version: window.StudySave.version, sections, savedAt: Date.now() }));
      show();
    } catch (error) { banner.hidden = false; banner.textContent = '草稿未能保存：' + error.message; }
  }
  const schedule = () => { if (!editing || restoring) return; dirty = true; clearTimeout(timer); timer = setTimeout(capture, 600); };
  window.StudyDraft = { key, capture, clear() {
    dirty = false; clearTimeout(timer); storage.removeItem(key);
    if (source && read(source.name)?.savedAt === source.savedAt) storage.removeItem(source.name);
    show();
  } };
  window.addEventListener('study-edit-mode', event => { editing = event.detail; });
  window.addEventListener('study-dirty', schedule);
  window.addEventListener('storage', event => { if (!event.key || event.key.startsWith(prefix)) show(); });
  document.addEventListener('input', event => { if (event.target.closest('main, .code-edit-panel')) schedule(); });
  document.addEventListener('click', event => { if (editing && event.target.closest('.editor-sidebar-tools, .editor-row-controls-floating, .code-edit-actions')) window.dispatchEvent(new Event('study-dirty')); });
  window.addEventListener('pagehide', capture);
  document.addEventListener('visibilitychange', () => { if (document.hidden) capture(); });
  let pending;
  try { pending = sessionStorage.getItem('study-restore'); if (pending === prefix || pending?.startsWith(prefix + ':')) sessionStorage.removeItem('study-restore'); } catch (_) { /* Download remains available. */ }
  if (pending === prefix || pending?.startsWith(prefix + ':')) {
    const draft = read(pending);
    if (draft) {
      try {
        const sections = window.HtmlSerializer.parseSections(draft.sections);
        main.querySelectorAll(':scope > section').forEach(section => section.remove()); main.append(...sections);
        window.StudySave.restoreVersion(draft.version); source = { name: pending, savedAt: draft.savedAt };
        document.addEventListener('DOMContentLoaded', () => { window.dispatchEvent(new Event('study-draft-restored')); dirty = true; });
      } catch (error) { banner.textContent = '无法恢复：' + error.message; }
    }
  }
  show();
})();
