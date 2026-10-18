(function () {
  const store = window.StudyStore;
  const tools = document.querySelector(".study-tools");
  if (!tools) return;
  const row = document.createElement("div");
  row.className = "study-session-tools tool-row";
  row.innerHTML = '<label>学习状态 <select id="progressFilter" aria-label="筛选学习状态"><option value="all">全部</option><option value="new">未学</option><option value="review">待复习</option><option value="mastered">已掌握</option></select></label><button type="button" class="tool-btn" id="selfTestBtn" aria-pressed="false">开始自测</button><span id="sessionStatus" role="status"></span>';
  tools.appendChild(row);
  window.mountProgressTools(tools.querySelector(".progress-tools-host"));
  const test = row.querySelector("button");
  const message = row.querySelector("[role=status]");
  const update = () => {
    const records = store.records();
    for (const section of document.querySelectorAll("main > section.question-card")) {
      const id = store.key({ id: section.id, category: document.body.dataset.category });
      const status = records[id]?.status || "new";
      section.dataset.learningStatus = status;
      const select = section.querySelector(".question-progress");
      if (select) select.value = status;
    }
    const visible = [...document.querySelectorAll(".question-card")].filter(section => section.style.display !== "none" && (document.body.dataset.progressFilter === "all" || section.dataset.learningStatus === document.body.dataset.progressFilter)).length;
    message.textContent = "当前显示 " + visible + " 题";
    const empty = document.getElementById("emptyState");
    empty.textContent = "没有符合搜索条件和学习状态的题目，可调整筛选后继续。";
    empty.classList.toggle("show", visible === 0);
  };
  function enhance() {
    document.querySelectorAll("main > section.question-card").forEach(section => {
      if (section.querySelector(".question-progress")) return;
      const actions = section.querySelector(".question-actions");
      const select = document.createElement("select");
      select.className = "question-progress";
      select.setAttribute("aria-label", section.querySelector("h2").textContent + "的学习状态");
      select.innerHTML = '<option value="new">未学</option><option value="review">待复习</option><option value="mastered">已掌握</option>';
      select.onchange = () => store.setStatus(store.key({ id: section.id, category: document.body.dataset.category }), select.value);
      const copy = document.createElement("button");
      copy.type = "button"; copy.className = "tool-btn copy-question"; copy.textContent = "复制链接";
      copy.onclick = async event => {
        event.stopPropagation();
        const url = new URL(location.href); url.hash = section.id;
        try { await navigator.clipboard.writeText(url.href); message.textContent = "已复制题目链接"; }
        catch (_) { history.replaceState(null, "", url.hash); message.textContent = "已定位题目，可复制地址栏链接"; }
      };
      const reveal = document.createElement("button");
      reveal.type = "button"; reveal.className = "tool-btn reveal-answer"; reveal.textContent = "显示答案";
      const answer = section.querySelector(":scope > .answer");
      answer.id = section.id + "--answer"; reveal.setAttribute("aria-controls", answer.id); reveal.setAttribute("aria-expanded", "false");
      reveal.onclick = () => { const show = section.classList.toggle("answer-revealed"); reveal.textContent = show ? "收起答案" : "显示答案"; reveal.setAttribute("aria-expanded", String(show)); };
      actions.append(select, copy, reveal);

      section.querySelectorAll("pre:not(:has(code))").forEach(pre => pre.classList.add("explanation-block"));
    });
    update();
  }
  document.body.dataset.progressFilter = "all";
  row.querySelector("select").onchange = event => { document.body.dataset.progressFilter = event.target.value; update(); };
  test.onclick = () => {
    const enabled = document.body.classList.toggle("self-test");
    test.textContent = enabled ? "结束自测" : "开始自测";
    test.setAttribute("aria-pressed", String(enabled));
    document.querySelectorAll(".answer-revealed").forEach(section => section.classList.remove("answer-revealed"));
    document.querySelectorAll(".reveal-answer").forEach(button => { button.textContent = "显示答案"; button.setAttribute("aria-expanded", "false"); });
  };
  window.addEventListener("study-progress", update);
  window.addEventListener("study-question-jump", () => { document.body.dataset.progressFilter = "all"; row.querySelector("select").value = "all"; update(); });
  document.getElementById("searchInput").addEventListener("input", update);
  window.addEventListener("study-edit-mode", event => { if (event.detail) { document.body.classList.remove("self-test"); document.body.dataset.progressFilter = "all"; row.querySelector("select").value = "all"; test.textContent = "开始自测"; test.setAttribute("aria-pressed", "false"); update(); } });
  const observer = new MutationObserver(enhance);
  observer.observe(document.querySelector("main"), { childList: true });
  const toc = document.querySelector(".toc-group");
  if (window.matchMedia("(max-width: 920px)").matches && toc) toc.open = false;
  enhance();
  let frame, activeId;
  function trackReading() {
    frame = null;
    const cards = [...document.querySelectorAll(".question-card")].filter(el => el.getClientRects().length && getComputedStyle(el).display !== "none");
    const current = cards.filter(el => el.getBoundingClientRect().top <= innerHeight * 0.25).pop() || cards[0];
    if (!current || current.id === activeId) return;
    activeId = current.id;
    document.querySelectorAll(".toc-links a").forEach(link => {
      const selected = link.getAttribute("href") === "#" + activeId;
      if (selected) { link.setAttribute("aria-current", "location"); link.closest(".toc-subgroup").open = true; }
      else link.removeAttribute("aria-current");
    });
  }
  const scheduleReading = () => { if (!frame) frame = requestAnimationFrame(trackReading); };
  window.addEventListener("scroll", scheduleReading, { passive: true });
  window.addEventListener("study-toc-updated", () => { activeId = null; scheduleReading(); });
  window.addEventListener("study-question-jump", scheduleReading);
  scheduleReading();
})();
