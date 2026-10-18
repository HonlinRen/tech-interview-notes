(function () {
  let version = document.querySelector('meta[name="document-version"]')?.content;
  window.StudySave = {
    restoreVersion(value) { version = value; },
    async save(file, markdown, expectedVersion = version) {
      if (!version) throw new Error("请通过 npm run dev 启动的服务打开页面后编辑");
      const response = await fetch("/api/save", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file: file, markdown: markdown, version: expectedVersion })
      });
      let payload;
      try { payload = await response.json(); } catch (_) { throw new Error("保存服务返回异常，请保留草稿后重试"); }
      if (!response.ok || !payload.ok) throw new Error(payload.error || "保存失败");
      version = payload.version;
      return payload;
    },
    get version() { return version; }
  };
})();
