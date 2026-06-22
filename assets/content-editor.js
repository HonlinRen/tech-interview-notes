(function () {
  const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
  const CATEGORY_TO_FILE = {
    python: "python.html",
    java: "java.html",
    spring: "spring.html",
    mysql: "mysql.html",
    redis: "redis.html",
    rocketmq: "rocketmq.html",
    "docker-k8s": "docker-k8s.html",
    ai: "ai.html",
    architecture: "architecture.html",
    observability: "observability.html",
    security: "security.html"
  };
  const CODE_LANGUAGES = [
    { value: "", label: "无高亮" },
    { value: "java", label: "Java" },
    { value: "python", label: "Python" },
    { value: "bash", label: "Bash / Shell" },
    { value: "sql", label: "SQL" },
    { value: "javascript", label: "JavaScript" },
    { value: "xml", label: "XML / HTML" },
    { value: "yaml", label: "YAML" },
    { value: "json", label: "JSON" }
  ];

  if (!LOCAL_HOSTS.has(window.location.hostname)) {
    return;
  }

  const state = {
    editing: false,
    activePre: null,
    savedRange: null,
    lastEditable: null
  };

  const studyTools = document.querySelector(".study-tools");
  const aside = document.querySelector("aside");
  const homeLink = aside && aside.querySelector(".home-link");
  if (!studyTools || !aside || !homeLink) {
    return;
  }

  const sidebarControls = document.createElement("div");
  sidebarControls.className = "editor-sidebar-controls";
  sidebarControls.innerHTML =
    '<button type="button" class="tool-btn editor-sidebar-btn" data-action="edit-primary">编辑模式</button>' +
    '<button type="button" class="tool-btn editor-sidebar-btn editor-sidebar-edit-only" data-action="cancel">取消</button>' +
    '<div class="editor-sidebar-tools">' +
    '<div class="editor-sidebar-tools-row">' +
    '<button type="button" class="tool-btn editor-format-btn" data-action="bold"><strong>B</strong></button>' +
    '<button type="button" class="tool-btn editor-format-btn" data-action="highlight">高亮</button>' +
    '<button type="button" class="tool-btn editor-format-btn em-orange-preview" data-action="orange">橙色</button>' +
    '<button type="button" class="tool-btn editor-format-btn" data-action="bullet">标题点</button>' +
    "</div>" +
    '<div class="editor-sidebar-tools-row">' +
    '<button type="button" class="tool-btn editor-format-btn editor-code-btn editor-code-btn-full" data-action="insert-code">Code</button>' +
    "</div>" +
    "</div>" +
    '<button type="button" class="tool-btn editor-sidebar-btn editor-sidebar-edit-only" data-action="save-exit">保存并退出</button>' +
    '<span class="editor-sidebar-status" aria-live="polite"></span>';
  homeLink.insertAdjacentElement("afterend", sidebarControls);

  const primaryBtn = sidebarControls.querySelector('[data-action="edit-primary"]');
  const cancelBtn = sidebarControls.querySelector('[data-action="cancel"]');
  const saveExitBtn = sidebarControls.querySelector('[data-action="save-exit"]');
  const sidebarTools = sidebarControls.querySelector(".editor-sidebar-tools");
  const sidebarStatusEl = sidebarControls.querySelector(".editor-sidebar-status");

  const codePanel = document.createElement("div");
  codePanel.className = "code-edit-panel";
  codePanel.hidden = true;
  codePanel.innerHTML =
    '<div class="code-edit-dialog" role="dialog" aria-label="编辑代码块">' +
    '<div class="code-edit-header">' +
    '<strong>编辑代码块</strong>' +
    '<button type="button" class="code-edit-close" data-action="close-code" aria-label="关闭">&times;</button>' +
    "</div>" +
    '<label class="code-edit-label">语言<select class="code-edit-lang"></select></label>' +
    '<textarea class="code-edit-text" spellcheck="false"></textarea>' +
    '<div class="code-edit-actions">' +
    '<button type="button" class="tool-btn" data-action="apply-code">应用</button>' +
    '<button type="button" class="tool-btn" data-action="close-code">取消</button>' +
    "</div>" +
    "</div>";
  document.body.appendChild(codePanel);

  const langSelect = codePanel.querySelector(".code-edit-lang");
  const codeTextarea = codePanel.querySelector(".code-edit-text");

  CODE_LANGUAGES.forEach(function (item) {
    const option = document.createElement("option");
    option.value = item.value;
    option.textContent = item.label;
    langSelect.appendChild(option);
  });

  function setStatus(message, isError) {
    sidebarStatusEl.textContent = message || "";
    sidebarStatusEl.classList.toggle("error", Boolean(isError));
  }

  function getSections() {
    return Array.from(document.querySelectorAll("main > section")).filter(function (section) {
      return section.id && section.id !== "summary";
    });
  }

  function getSectionH2(section) {
    return section.querySelector(":scope > .question-heading h2, :scope > h2");
  }

  function getSectionAnswer(section) {
    return section.querySelector(":scope > .answer");
  }

  function wrapSelection(tagName) {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      return;
    }
    const range = selection.getRangeAt(0);
    const wrapper = document.createElement(tagName);
    wrapper.appendChild(range.extractContents());
    range.insertNode(wrapper);
    selection.removeAllRanges();
    const newRange = document.createRange();
    newRange.selectNodeContents(wrapper);
    selection.addRange(newRange);
  }

  function wrapSelectionWithClass(tagName, className) {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      return;
    }
    const range = selection.getRangeAt(0);
    const wrapper = document.createElement(tagName);
    wrapper.className = className;
    wrapper.appendChild(range.extractContents());
    range.insertNode(wrapper);
    selection.removeAllRanges();
    const newRange = document.createRange();
    newRange.selectNodeContents(wrapper);
    selection.addRange(newRange);
  }

  function getEditableContainer(node) {
    if (!(node instanceof Node)) {
      return null;
    }
    const element = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    if (!element) {
      return null;
    }
    return element.closest(".answer[contenteditable='true'], h2[contenteditable='true']");
  }

  function protectCodeBlocks(root) {
    root.querySelectorAll("pre").forEach(function (pre) {
      pre.contentEditable = "false";
    });
  }

  function normalizeCodeBlocks(root) {
    root.querySelectorAll("div").forEach(function (div) {
      if (div.children.length === 1 && div.firstElementChild && div.firstElementChild.tagName === "PRE") {
        div.replaceWith(div.firstElementChild);
      }
    });

    root.querySelectorAll("p").forEach(function (p) {
      const code = p.querySelector(":scope > code");
      if (!code) {
        return;
      }
      const onlyInline = Array.from(p.childNodes).every(function (node) {
        if (node.nodeType === Node.TEXT_NODE) {
          return !node.textContent.trim();
        }
        return node === code;
      });
      if (!onlyInline) {
        return;
      }
      const text = code.textContent.replace(/\r\n/g, "\n");
      if (text.indexOf("\n") === -1 && text.length < 120) {
        return;
      }

      const pre = document.createElement("pre");
      const newCode = document.createElement("code");
      newCode.className = code.className || "";
      if (!newCode.className && langSelect.value) {
        newCode.className = "language-" + langSelect.value;
      }
      newCode.textContent = text;
      pre.contentEditable = "false";
      pre.appendChild(newCode);
      p.replaceWith(pre);
    });
  }

  function normalizeOrphanInlines(root) {
    const inlineWrap = new Set(["MARK", "SPAN", "STRONG", "B", "EM", "I", "A", "FONT", "U"]);
    Array.from(root.childNodes).forEach(function (node) {
      if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
        const p = document.createElement("p");
        p.textContent = node.textContent;
        node.replaceWith(p);
        return;
      }
      if (node.nodeType === Node.ELEMENT_NODE && inlineWrap.has(node.tagName)) {
        const p = document.createElement("p");
        node.replaceWith(p);
        p.appendChild(node);
      }
    });
  }

  function debugLog(location, message, data, hypothesisId) {
    fetch("/api/debug-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: "5803c5",
        location: location,
        message: message,
        data: data,
        hypothesisId: hypothesisId,
        runId: "post-fix-2",
        timestamp: Date.now()
      })
    }).catch(function () {});
  }

  function normalizeLists(root) {
    Array.from(root.querySelectorAll("p")).forEach(function (p) {
      const lists = Array.from(p.children).filter(function (el) {
        return el.tagName === "UL" || el.tagName === "OL";
      });
      if (lists.length === 0) {
        return;
      }
      lists.forEach(function (list) {
        p.parentNode.insertBefore(list, p.nextSibling);
      });
      const hasContent = Array.from(p.childNodes).some(function (node) {
        if (node.nodeType === Node.TEXT_NODE) {
          return node.textContent.trim();
        }
        return node.nodeType === Node.ELEMENT_NODE;
      });
      if (!hasContent) {
        p.remove();
      }
    });

    root.querySelectorAll("div").forEach(function (div) {
      if (div.children.length === 1) {
        const child = div.firstElementChild;
        if (child && (child.tagName === "UL" || child.tagName === "OL")) {
          div.replaceWith(child);
          return;
        }
      }
      if (!div.querySelector("pre, ul, ol, table, p, h3, h4")) {
        const p = document.createElement("p");
        while (div.firstChild) {
          p.appendChild(div.firstChild);
        }
        if (p.textContent.trim()) {
          div.replaceWith(p);
        }
      }
    });

    root.querySelectorAll("li > div:only-child, li > p:only-child").forEach(function (wrapper) {
      const li = wrapper.parentElement;
      if (!li || li.tagName !== "LI") {
        return;
      }
      while (wrapper.firstChild) {
        li.insertBefore(wrapper.firstChild, wrapper);
      }
      wrapper.remove();
    });
  }

  function captureSelection() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }
    const range = selection.getRangeAt(0);
    if (getEditableContainer(range.commonAncestorContainer)) {
      state.savedRange = range.cloneRange();
    }
  }

  function restoreSelection() {
    if (!state.savedRange) {
      return false;
    }
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(state.savedRange);
    return true;
  }

  function focusEditable(editable) {
    if (!editable) {
      return;
    }
    editable.focus();
    const selection = window.getSelection();
    if (!state.savedRange || !editable.contains(state.savedRange.commonAncestorContainer)) {
      const range = document.createRange();
      range.selectNodeContents(editable);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
      state.savedRange = range.cloneRange();
      return;
    }
    restoreSelection();
  }

  function placeCaret(node) {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(node);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    state.savedRange = range.cloneRange();
  }

  function getActiveEditable() {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const editable = getEditableContainer(selection.getRangeAt(0).commonAncestorContainer);
      if (editable) {
        return editable;
      }
    }
    if (state.savedRange) {
      return getEditableContainer(state.savedRange.commonAncestorContainer);
    }
    return state.lastEditable;
  }

  function insertBulletListManual(editable) {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return false;
    }

    const range = selection.getRangeAt(0);
    let node = range.commonAncestorContainer;
    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentElement;
    }

    const currentLi = node && node.closest("li");
    const currentList = currentLi && currentLi.closest("ul, ol");

    if (currentList && editable.contains(currentList)) {
      const newLi = document.createElement("li");
      newLi.appendChild(document.createElement("br"));
      currentLi.insertAdjacentElement("afterend", newLi);
      placeCaret(newLi);
      return true;
    }

    const ul = document.createElement("ul");
    const li = document.createElement("li");
    if (!range.collapsed) {
      li.appendChild(range.extractContents());
    } else {
      li.appendChild(document.createElement("br"));
    }
    ul.appendChild(li);

    const blockP = node && node.closest("p");
    if (blockP && editable.contains(blockP) && blockP.parentElement === editable) {
      blockP.insertAdjacentElement("afterend", ul);
    } else {
      range.collapse(true);
      range.insertNode(ul);
    }

    const paragraph = document.createElement("p");
    paragraph.appendChild(document.createElement("br"));
    ul.insertAdjacentElement("afterend", paragraph);
    placeCaret(li);
    return true;
  }

  function insertBulletList() {
    const editable = getActiveEditable();
    if (!editable) {
      setStatus("请先将光标放在可编辑区域", true);
      return;
    }

    focusEditable(editable);

    const executed = document.execCommand("insertUnorderedList");
    if (!executed) {
      insertBulletListManual(editable);
    }
    normalizeLists(editable);

    captureSelection();
    setStatus("");
  }

  function insertCodeBlock() {
    const editable = getActiveEditable();
    if (!editable) {
      setStatus("请先将光标放在可编辑区域", true);
      return;
    }

    focusEditable(editable);

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      setStatus("请先将光标放在可编辑区域", true);
      return;
    }

    const range = selection.getRangeAt(0);
    range.deleteContents();

    const pre = document.createElement("pre");
    pre.contentEditable = "false";
    const code = document.createElement("code");
    code.textContent = "";
    pre.appendChild(code);

    const paragraph = document.createElement("p");
    paragraph.appendChild(document.createElement("br"));

    const fragment = document.createDocumentFragment();
    fragment.appendChild(pre);
    fragment.appendChild(paragraph);
    range.insertNode(fragment);

    openCodePanel(pre);
    setStatus("");
  }

  function setEditMode(enabled) {
    state.editing = enabled;
    document.body.classList.toggle("edit-mode", enabled);
    primaryBtn.hidden = enabled;

    getSections().forEach(function (section) {
      const answer = getSectionAnswer(section);
      const h2 = getSectionH2(section);
      if (answer) {
        answer.contentEditable = enabled ? "true" : "false";
      }
      if (h2) {
        h2.contentEditable = enabled ? "true" : "false";
      }
      section.classList.toggle("editor-section-active", enabled);
      if (enabled) {
        const answer = getSectionAnswer(section);
        if (answer) {
          normalizeOrphanInlines(answer);
          normalizeCodeBlocks(answer);
          normalizeLists(answer);
          protectCodeBlocks(answer);
        }
        attachTableControls(section);
      } else {
        detachTableControls(section);
      }
    });

    if (!enabled) {
      closeCodePanel();
      setStatus("");
    }
  }

  function attachTableControls(section) {
    const root = getSectionAnswer(section) || section;
    root.querySelectorAll("table tbody tr").forEach(function (row) {
      if (row.dataset.editorBound === "1") {
        return;
      }
      row.dataset.editorBound = "1";
      row.classList.add("editor-table-row");

      const controls = document.createElement("td");
      controls.className = "editor-row-controls";
      controls.contentEditable = "false";
      controls.innerHTML =
        '<button type="button" class="editor-row-btn" data-row-action="insert-above" title="在上方插入行">+↑</button>' +
        '<button type="button" class="editor-row-btn" data-row-action="insert-below" title="在下方插入行">+↓</button>' +
        '<button type="button" class="editor-row-btn danger" data-row-action="delete" title="删除行">×</button>';
      row.insertBefore(controls, row.firstChild);
    });
  }

  function detachTableControls(section) {
    const root = getSectionAnswer(section) || section;
    root.querySelectorAll("table tbody tr").forEach(function (row) {
      row.classList.remove("editor-table-row");
      delete row.dataset.editorBound;
      const controls = row.querySelector(".editor-row-controls");
      if (controls) {
        controls.remove();
      }
    });
  }

  function createTableRow(templateRow, insertBelow) {
    const row = document.createElement("tr");
    const templateCells = Array.from(templateRow.children).filter(function (cell) {
      return !cell.classList.contains("editor-row-controls");
    });

    templateCells.forEach(function (cell) {
      const td = document.createElement(cell.tagName === "TH" ? "th" : "td");
      td.innerHTML = "&nbsp;";
      row.appendChild(td);
    });

    const controls = document.createElement("td");
    controls.className = "editor-row-controls";
    controls.contentEditable = "false";
    controls.innerHTML =
      '<button type="button" class="editor-row-btn" data-row-action="insert-above" title="在上方插入行">+↑</button>' +
      '<button type="button" class="editor-row-btn" data-row-action="insert-below" title="在下方插入行">+↓</button>' +
      '<button type="button" class="editor-row-btn danger" data-row-action="delete" title="删除行">×</button>';
    row.insertBefore(controls, row.firstChild);
    row.dataset.editorBound = "1";
    row.classList.add("editor-table-row");
    return row;
  }

  function getDataRows(tbody) {
    return Array.from(tbody.querySelectorAll(":scope > tr"));
  }

  function handleTableAction(button) {
    const row = button.closest("tr");
    const tbody = row && row.parentElement;
    if (!row || !tbody) {
      return;
    }

    const action = button.dataset.rowAction;
    if (action === "insert-above") {
      tbody.insertBefore(createTableRow(row, false), row);
      return;
    }
    if (action === "insert-below") {
      tbody.insertBefore(createTableRow(row, true), row.nextSibling);
      return;
    }
    if (action === "delete") {
      const rows = getDataRows(tbody);
      if (rows.length <= 1) {
        setStatus("表格至少保留一行", true);
        return;
      }
      row.remove();
    }
  }

  function getCodeLanguage(pre) {
    const code = pre.querySelector("code");
    if (!code) {
      return "";
    }
    const match = code.className.match(/language-([\w+-]+)/);
    return match ? match[1] : "";
  }

  function setCodeLanguage(code, lang) {
    code.className = lang ? "language-" + lang : "";
  }

  function openCodePanel(pre) {
    state.activePre = pre;
    const code = pre.querySelector("code") || pre;
    codeTextarea.value = code.textContent.replace(/\r\n/g, "\n");
    langSelect.value = getCodeLanguage(pre);
    codePanel.hidden = false;
    codeTextarea.focus();
    pre.classList.add("editor-code-active");
  }

  function closeCodePanel() {
    if (state.activePre) {
      state.activePre.classList.remove("editor-code-active");
      state.activePre = null;
    }
    codePanel.hidden = true;
  }

  function applyCodePanel() {
    if (!state.activePre) {
      return;
    }

    let code = state.activePre.querySelector("code");
    if (!code) {
      code = document.createElement("code");
      state.activePre.textContent = "";
      state.activePre.appendChild(code);
    }

    code.textContent = codeTextarea.value.replace(/\r\n/g, "\n");
    setCodeLanguage(code, langSelect.value);
    state.activePre.contentEditable = "false";

    if (window.hljs) {
      delete code.dataset.highlighted;
      code.removeAttribute("data-highlighted");
      window.hljs.highlightElement(code);
    }

    closeCodePanel();
  }

  function currentPageFile() {
    const fromPath = window.location.pathname.split("/").filter(Boolean).pop() || "";
    if (Object.values(CATEGORY_TO_FILE).includes(fromPath)) {
      return fromPath;
    }
    const category = document.body.dataset.category;
    if (category && CATEGORY_TO_FILE[category]) {
      return CATEGORY_TO_FILE[category];
    }
    return fromPath;
  }

  function formatSaveError(error, response, rawBody) {
    const message = error && error.message ? error.message : "保存失败";
    if (error && error.name === "TypeError" && /fetch|network|failed/i.test(message)) {
      return (
        "无法连接保存服务。请确认：1) 终端已运行 npm run dev；2) 地址栏是 http://localhost:3000/" +
        (currentPageFile() || "java.html") +
        "（不要用 Live Server 或其他端口）"
      );
    }
    if (response && !response.ok && rawBody) {
      try {
        const payload = JSON.parse(rawBody);
        if (payload.error) {
          return payload.error;
        }
      } catch (parseError) {
        return "服务器返回异常 HTTP " + response.status + "，请确认使用 npm run dev 打开的页面";
      }
    }
    if (/unexpected token|json/i.test(message)) {
      return "服务器返回异常，请确认使用 npm run dev 打开的 http://localhost:3000";
    }
    return message;
  }

  async function verifyEditorServer() {
    try {
      const response = await fetch("/api/editor-health", { method: "GET" });
      if (!response.ok) {
        return false;
      }
      const payload = await response.json();
      return Boolean(payload && payload.ok);
    } catch (error) {
      return false;
    }
  }

  async function savePage() {
    if (!window.HtmlSerializer) {
      console.warn("[editor save] HtmlSerializer 未加载");
      setStatus("序列化模块未加载", true);
      return;
    }

    const pageFile = currentPageFile();
    if (!pageFile || !Object.values(CATEGORY_TO_FILE).includes(pageFile)) {
      console.warn("[editor save] 无法识别页面文件:", pageFile);
      setStatus("无法识别当前页面文件：" + (pageFile || "(空)") + "，请从 http://localhost:3000/java.html 这类地址打开", true);
      return;
    }

    if (!codePanel.hidden && state.activePre) {
      applyCodePanel();
    }

    setStatus("保存中…");
    saveExitBtn.disabled = true;

    try {
      // #region agent log
      const _dbgTarget = document.getElementById("compile-and-interpret");
      const _dbgAnsBefore = _dbgTarget && getSectionAnswer(_dbgTarget);
      debugLog("content-editor.js:savePage:before-normalize", "DOM before normalize", {
        innerHTML: _dbgAnsBefore ? _dbgAnsBefore.innerHTML : null,
        childTags: _dbgAnsBefore ? Array.from(_dbgAnsBefore.children).map(function (c) { return c.tagName + ":" + c.className; }) : null,
        childNodes: _dbgAnsBefore ? Array.from(_dbgAnsBefore.childNodes).map(function (n) {
          return n.nodeType === 3 ? "#text:" + n.textContent.trim().slice(0, 60) : n.tagName + ":" + n.className;
        }) : null,
        textContent: _dbgAnsBefore ? _dbgAnsBefore.textContent : null
      }, "B,C,F,G");
      // #endregion
      getSections().forEach(function (section) {
        const answer = getSectionAnswer(section);
        if (answer) {
          normalizeOrphanInlines(answer);
          normalizeCodeBlocks(answer);
          normalizeLists(answer);
          normalizeOrphanInlines(answer);
        }
      });

      // #region agent log
      const _dbgAnsAfter = _dbgTarget && getSectionAnswer(_dbgTarget);
      debugLog("content-editor.js:savePage:after-normalize", "DOM after normalize", {
        innerHTML: _dbgAnsAfter ? _dbgAnsAfter.innerHTML : null,
        childTags: _dbgAnsAfter ? Array.from(_dbgAnsAfter.children).map(function (c) { return c.tagName + ":" + c.className; }) : null
      }, "C");
      // #endregion

      let sectionsHtml;
      try {
        sectionsHtml = window.HtmlSerializer.serializeMainSections();
      } catch (serializeError) {
        throw new Error("内容序列化失败：" + (serializeError.message || serializeError));
      }

      // #region agent log
      const _dbgSection = window.HtmlSerializer.serializeSection(_dbgTarget);
      debugLog("content-editor.js:savePage:after-serialize", "Serialized section", {
        hasGraalVM: _dbgSection.indexOf("GraalVM") !== -1,
        hasEmWarn: _dbgSection.indexOf("em-warn") !== -1,
        hasMark: _dbgSection.indexOf("<mark>") !== -1,
        sectionSnippet: _dbgSection.slice(-500)
      }, "A,D,E,F,G");
      // #endregion

      if (!sectionsHtml.trim()) {
        throw new Error("没有可保存的题目内容，请刷新页面后重试");
      }

      const response = await fetch("/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file: pageFile,
          sections: sectionsHtml
        })
      });

      const rawBody = await response.text();
      let payload = null;
      try {
        payload = rawBody ? JSON.parse(rawBody) : null;
      } catch (parseError) {
        throw new Error(formatSaveError(parseError, response, rawBody));
      }

      if (!response.ok || !payload || !payload.ok) {
        throw new Error((payload && payload.error) || formatSaveError(new Error("保存失败"), response, rawBody));
      }

      setStatus("已保存，正在刷新…");
      setEditMode(false);
      window.location.reload();
    } catch (error) {
      console.error("[editor save]", error);
      setStatus(formatSaveError(error), true);
      saveExitBtn.disabled = false;
    }
  }

  function handleEditorAction(action) {
    if (action === "edit-primary") {
      verifyEditorServer().then(function (ok) {
        if (!ok) {
          setStatus(
            "保存服务未就绪。请运行 npm run dev，并访问 http://localhost:3000/" + (currentPageFile() || "java.html"),
            true
          );
        }
        setEditMode(true);
      });
      return;
    }
    if (action === "save-exit") {
      savePage();
      return;
    }
    if (action === "cancel") {
      window.location.reload();
      return;
    }

    const editable = getActiveEditable();
    if (editable) {
      focusEditable(editable);
    }

    if (action === "bold") {
      document.execCommand("bold");
      captureSelection();
      return;
    }
    if (action === "highlight") {
      wrapSelection("mark");
      captureSelection();
      return;
    }
    if (action === "orange") {
      wrapSelectionWithClass("span", "em-warn");
      captureSelection();
      return;
    }
    if (action === "bullet") {
      insertBulletList();
      return;
    }
    if (action === "insert-code") {
      insertCodeBlock();
      return;
    }
  }

  saveExitBtn.addEventListener("click", function (event) {
    event.preventDefault();
    event.stopPropagation();
    handleEditorAction("save-exit");
  });

  cancelBtn.addEventListener("click", function (event) {
    event.preventDefault();
    event.stopPropagation();
    handleEditorAction("cancel");
  });

  sidebarControls.addEventListener("mousedown", function (event) {
    const button = event.target.closest("button[data-action]");
    if (!button) {
      return;
    }
    const action = button.dataset.action;
    if (action === "edit-primary" || action === "save-exit" || action === "cancel") {
      return;
    }
    event.preventDefault();
  });

  sidebarControls.addEventListener("click", function (event) {
    const button = event.target.closest("button[data-action]");
    if (!button) {
      return;
    }
    const action = button.dataset.action;
    if (action === "save-exit" || action === "cancel") {
      return;
    }
    event.preventDefault();
    handleEditorAction(action);
  });

  document.addEventListener("selectionchange", function () {
    if (!state.editing) {
      return;
    }
    captureSelection();
  });

  document.addEventListener("focusin", function (event) {
    if (!state.editing) {
      return;
    }
    const editable = event.target.closest(".answer[contenteditable='true'], h2[contenteditable='true']");
    if (editable) {
      state.lastEditable = editable;
    }
  });

  codePanel.addEventListener("click", function (event) {
    const button = event.target.closest("button[data-action]");
    if (!button) {
      return;
    }
    if (button.dataset.action === "apply-code") {
      applyCodePanel();
      return;
    }
    if (button.dataset.action === "close-code") {
      closeCodePanel();
    }
  });

  document.addEventListener("click", function (event) {
    if (!state.editing) {
      return;
    }

    const rowBtn = event.target.closest(".editor-row-btn");
    if (rowBtn) {
      event.preventDefault();
      event.stopPropagation();
      handleTableAction(rowBtn);
      return;
    }

    const pre = event.target.closest("main pre");
    if (pre && !event.target.closest(".code-edit-panel")) {
      event.preventDefault();
      openCodePanel(pre);
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !codePanel.hidden) {
      closeCodePanel();
    }
  });

  document.addEventListener(
    "keydown",
    function (event) {
      if (!state.editing) {
        return;
      }
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      if (target.closest(".answer[contenteditable='true'], h2[contenteditable='true']") && event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        document.execCommand("insertParagraph");
      }
    },
    true
  );
})();
