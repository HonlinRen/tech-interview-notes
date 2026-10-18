(function () {
  const PREFIX = "study-progress-v3:";
  const VALID = new Set(["new", "review", "mastered"]);
  const fallback = new Map();
  let available = true;
  let cache = null;
  const storage = {
    getItem(key) { if (fallback.has(key)) return fallback.get(key); try { return window.localStorage.getItem(key); } catch (_) { available = false; return fallback.get(key) || null; } },
    setItem(key, value) { fallback.set(key, String(value)); try { window.localStorage.setItem(key, String(value)); } catch (_) { available = false; } },
    removeItem(key) { fallback.delete(key); try { window.localStorage.removeItem(key); } catch (_) { available = false; } },
    keys() { try { return [...new Set([...Object.keys(window.localStorage), ...fallback.keys()])]; } catch (_) { available = false; return [...fallback.keys()]; } }
  };
  function parse(value) { try { const result = JSON.parse(value); return result && typeof result === "object" && !Array.isArray(result) ? result : {}; } catch (_) { return {}; } }
  function canonical(key) {
    const seen = new Set();
    while (window.StudyMigrations.remap[key] && !seen.has(key)) { seen.add(key); key = window.StudyMigrations.remap[key]; }
    return key;
  }
  function key(question) {
    return canonical((window.__STUDY_LEGACY_QUESTION_MAP || {})[question.id] || question.category + ":" + question.id);
  }
  function legacy() {
    const result = {};
    for (const name of ["study-learned-questions", "study-learned-v2"]) {
      const data = parse(storage.getItem(name));
      for (let id of Object.keys(data)) {
        if (!data[id]) continue;
        if (!id.includes(":")) id = (window.__STUDY_LEGACY_QUESTION_MAP || {})[id] || (window.StudyMigrations.byId[id] ? window.StudyMigrations.byId[id] + ":" + id : "");
        if (id) result[canonical(id)] = { status: "mastered", updatedAt: 0 };
      }
    }
    return result;
  }
  function records() {
    if (cache) return cache;
    const result = legacy();
    const keys = storage.keys();
    for (const name of keys) {
      if (!name.startsWith(PREFIX)) continue;
      const record = parse(storage.getItem(name));
      if (VALID.has(record.status) && Number.isFinite(record.updatedAt)) {
        const original = name.slice(PREFIX.length), id = canonical(original), previous = result[id];
        // Consolidated questions may have several old v3 slots. Newest wins,
        // with the canonical slot winning ties, independent of storage order.
        if (!previous || record.updatedAt > previous.updatedAt || (record.updatedAt === previous.updatedAt && original === id)) result[id] = record;
      }
    }
    cache = result;
    return result;
  }
  function status(id) { return records()[canonical(id)]?.status || "new"; }
  function notify() { cache = null; window.dispatchEvent(new Event("study-progress")); }
  function setStatus(id, value) {
    if (!VALID.has(value)) throw new Error("无效的学习状态");
    storage.setItem(PREFIX + canonical(id), JSON.stringify({ status: value, updatedAt: Date.now() }));
    notify();
  }
  function learned() { return Object.fromEntries(Object.entries(records()).filter(([, item]) => item.status === "mastered").map(([id]) => [id, true])); }
  function exportData() { return JSON.stringify({ version: 3, exportedAt: new Date().toISOString(), records: records() }, null, 2); }
  function importData(raw) {
    const data = JSON.parse(raw);
    if (data.version !== 3 || !data.records || typeof data.records !== "object" || Array.isArray(data.records)) throw new Error("不是有效的学习进度备份（version 3）");
    const entries = Object.entries(data.records);
    if (entries.length > 20000) throw new Error("备份条目过多");
    const categories = new Set(window.StudyTopics.map(t => t.id));
    for (const [id, item] of entries) {
      if (!categories.has(id.split(":")[0]) || !/^[^:]+:[^\s:]+$/.test(id) || !item || !VALID.has(item.status) || !Number.isFinite(item.updatedAt) || item.updatedAt < 0) throw new Error("备份中包含无效的题目或状态");
    }
    // Validate everything before changing any progress. Imports intentionally override matching questions.
    for (const [id, item] of entries) storage.setItem(PREFIX + canonical(id), JSON.stringify({ status: item.status, updatedAt: Date.now() }));
    notify();
    return entries.length;
  }
  window.addEventListener("storage", event => { if (event.key) fallback.delete(event.key); else fallback.clear(); if (!event.key || event.key.startsWith(PREFIX) || ["study-learned-v2", "study-learned-questions"].includes(event.key)) notify(); });
  window.StudyStore = { storage, canonical, key, status, setStatus, records, learned, exportData, importData, get available() { return available; } };
})();
