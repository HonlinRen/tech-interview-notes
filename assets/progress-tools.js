(function () {
  window.mountProgressTools = function (container) {
    const tools = document.createElement("div");
    tools.className = "progress-tools";
    tools.innerHTML = '<button type="button" class="tool-btn" data-export>备份进度</button><label class="tool-btn import-label">导入进度<input type="file" accept=".json,application/json" aria-label="导入学习进度备份"></label><span class="progress-message" role="status"></span>';
    container.appendChild(tools);
    const message = tools.querySelector("[role=status]");
    if (!window.StudyStore.available) message.textContent = "浏览器存储不可用，进度仅在当前页面有效，请及时备份。";
    tools.querySelector("[data-export]").onclick = () => {
      const link = document.createElement("a");
      link.href = URL.createObjectURL(new Blob([window.StudyStore.exportData()], { type: "application/json" }));
      link.download = "study-progress-" + new Date().toISOString().slice(0, 10) + ".json";
      link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 1000);
      message.textContent = "已导出进度备份";
    };
    tools.querySelector("input").onchange = async event => {
      const file = event.target.files[0];
      if (!file) return;
      try {
        if (file.size > 5 * 1024 * 1024) throw new Error("备份不能超过 5MB");
        const raw = await file.text();
        if (!confirm("导入将替换备份中同名题目的学习状态，其他题目保留。是否继续？")) return;
        const count = window.StudyStore.importData(raw);
        message.textContent = "已导入 " + count + " 条进度";
      } catch (error) { message.textContent = error.message; }
      finally { event.target.value = ""; }
    };
  };
})();
