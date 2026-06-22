(function () {
  const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
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
    activePre: null
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
    '<button type="button" class="tool-btn editor-sidebar-btn editor-sidebar-edit-only" data-action="cancel" hidden>取消</button>' +
    '<div class="editor-sidebar-tools" hidden>' +
    '<div class="editor-sidebar-tools-row">' +
    '<button type="button" class="tool-btn editor-format-btn" data-action="bold"><strong>B</strong></button>' +
    '<button type="button" class="tool-btn editor-format-btn" data-action="highlight">高亮</button>' +
    '<button type="button" class="tool-btn editor-format-btn em-orange-preview" data-action="orange">橙色</button>' +
    '<button type="button" class="tool-btn editor-format-btn" data-action="strike"><del>删</del></button>' +
    "</div>" +
    '<div class="editor-sidebar-tools-row">' +
    '<button type="button" class="tool-btn editor-format-btn editor-code-btn" data-action="insert-code-python">+Py</button>' +
    '<button type="button" class="tool-btn editor-format-btn editor-code-btn" data-action="insert-code-java">+Java</button>' +
    '<button type="button" class="tool-btn editor-format-btn editor-code-btn" data-action="insert-code-sql">+SQL</button>' +
    "</div>" +
    "</div>" +
    '<button type="button" class="tool-btn editor-sidebar-btn editor-sidebar-edit-only" data-action="save-exit" hidden>保存并退出</button>' +
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

  function insertCodeBlock(lang) {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      setStatus("请先将光标放在可编辑区域", true);
      return;
    }

    const editable = getEditableContainer(selection.anchorNode);
    if (!editable) {
      setStatus("请先将光标放在可编辑区域", true);
      return;
    }

    const range = selection.getRangeAt(0);
    range.deleteContents();

    const pre = document.createElement("pre");
    const code = document.createElement("code");
    code.className = "language-" + lang;
    code.textContent = "\n";
    pre.appendChild(code);

    const paragraph = document.createElement("p");
    paragraph.appendChild(document.createElement("br"));

    const fragment = document.createDocumentFragment();
    fragment.appendChild(pre);
    fragment.appendChild(paragraph);
    range.insertNode(fragment);

    if (window.hljs) {
      delete code.dataset.highlighted;
      code.removeAttribute("data-highlighted");
      window.hljs.highlightElement(code);
    }

    const textNode = document.createTextNode("");
    code.appendChild(textNode);
    const cursorRange = document.createRange();
    cursorRange.setStart(textNode, 0);
    cursorRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(cursorRange);
    setStatus("");
  }

  function setEditMode(enabled) {
    state.editing = enabled;
    document.body.classList.toggle("edit-mode", enabled);
    primaryBtn.hidden = enabled;
    cancelBtn.hidden = !enabled;
    saveExitBtn.hidden = !enabled;
    sidebarTools.hidden = !enabled;

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

    if (window.hljs) {
      delete code.dataset.highlighted;
      code.removeAttribute("data-highlighted");
      window.hljs.highlightElement(code);
    }

    closeCodePanel();
  }

  function currentPageFile() {
    const parts = window.location.pathname.split("/");
    return parts[parts.length - 1] || "index.html";
  }

  async function savePage() {
    if (!window.HtmlSerializer) {
      setStatus("序列化模块未加载", true);
      return;
    }

    setStatus("保存中…");
    saveExitBtn.disabled = true;

    try {
      const response = await fetch("/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file: currentPageFile(),
          sections: window.HtmlSerializer.serializeMainSections()
        })
      });

      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        throw new Error((payload && payload.error) || "保存失败");
      }

      setStatus("已保存，正在刷新…");
      window.location.reload();
    } catch (error) {
      setStatus(error.message || "保存失败", true);
      saveExitBtn.disabled = false;
    }
  }

  function handleEditorAction(action) {
    if (action === "edit-primary") {
      setEditMode(true);
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
    if (action === "bold") {
      document.execCommand("bold");
      return;
    }
    if (action === "highlight") {
      wrapSelection("mark");
      return;
    }
    if (action === "orange") {
      wrapSelectionWithClass("span", "em-warn");
      return;
    }
    if (action === "strike") {
      wrapSelection("del");
      return;
    }
    if (action === "insert-code-python") {
      insertCodeBlock("python");
      return;
    }
    if (action === "insert-code-java") {
      insertCodeBlock("java");
      return;
    }
    if (action === "insert-code-sql") {
      insertCodeBlock("sql");
      return;
    }
  }

  sidebarControls.addEventListener("click", function (event) {
    const button = event.target.closest("button[data-action]");
    if (!button) {
      return;
    }
    handleEditorAction(button.dataset.action);
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
