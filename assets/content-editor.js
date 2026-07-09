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
    "rag-vector": "rag-vector.html",
    langchain: "langchain.html",
    llm: "llm.html",
    architecture: "architecture.html",
    observability: "observability.html",
    security: "security.html",
    frontend: "frontend.html",
    bigdata: "bigdata.html",
    leetcode: "leetcode.html"
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
    '<button type="button" class="tool-btn editor-format-btn editor-highlight-preview" data-action="highlight">高亮</button>' +
    '<button type="button" class="tool-btn editor-format-btn em-orange-preview" data-action="orange">橙色</button>' +
    '<button type="button" class="tool-btn editor-format-btn em-red-preview" data-action="red">红色</button>' +
    '<button type="button" class="tool-btn editor-format-btn editor-bullet-btn" data-action="bullet">标题 <span class="editor-bullet-dot" aria-hidden="true">●</span></button>' +
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
    '<button type="button" class="tool-btn code-edit-delete" data-action="delete-code">删除代码块</button>' +
    '<div class="code-edit-actions-main">' +
    '<button type="button" class="tool-btn" data-action="apply-code">应用</button>' +
    '<button type="button" class="tool-btn" data-action="close-code">取消</button>' +
    "</div>" +
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

  function getSectionContentRoot(section) {
    return getSectionAnswer(section) || section;
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
      ensureCodeBlockMetadata(pre);
    });
  }

  function ensureCodeBlockMetadata(pre) {
    const code = pre.querySelector("code");
    if (!code) {
      return;
    }
    if (!pre.dataset.rawCode) {
      pre.dataset.rawCode = code.textContent.replace(/\r\n/g, "\n");
    }
    if (!pre.dataset.codeLang) {
      const lang = getCodeLanguage(pre);
      if (lang) {
        pre.dataset.codeLang = lang;
      }
    }
  }

  function markCodeBlockMetadata(pre, codeText, lang) {
    pre.dataset.rawCode = codeText.replace(/\r\n/g, "\n");
    if (lang) {
      pre.dataset.codeLang = lang;
    } else {
      delete pre.dataset.codeLang;
    }
  }

  function looksLikeCodeFragment(text) {
    const line = text.trim();
    if (!line) {
      return false;
    }
    if (/^\s*#/.test(line)) {
      return true;
    }
    if (/^(&lt;|<)pre/i.test(line) || /^(&lt;|<)code/i.test(line)) {
      return false;
    }
    if (/[\u4e00-\u9fff]/.test(line) && !/["'].*[\u4e00-\u9fff].*["']/.test(line)) {
      return false;
    }
    return /[;{}()]/.test(line) || /^(import|public|private|protected|class|interface|enum|return|if|for|while|new|throw|try|catch|package|def|function|const|let|var|async|await|#include|using|namespace)\b/.test(line);
  }

  function looksLikeMergedCode(text) {
    const normalized = text.replace(/\r\n/g, "\n").trim();
    if (!normalized) {
      return false;
    }
    const lines = normalized.split("\n");
    if (lines.length < 2) {
      return false;
    }
    if (/^(import |public |private |class |interface |def |function |package |#include|using )/m.test(normalized)) {
      return true;
    }
    return /[;{}]/.test(normalized) && lines.filter(looksLikeCodeFragment).length >= 2;
  }

  function extractCodeText(codeEl) {
    if (!codeEl) {
      return "";
    }
    const parts = [];
    codeEl.childNodes.forEach(function (node) {
      if (node.nodeType === Node.TEXT_NODE) {
        parts.push(node.textContent);
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) {
        return;
      }
      const tag = node.tagName;
      if (tag === "BR") {
        parts.push("\n");
        return;
      }
      if (tag === "DIV" || tag === "P") {
        if (parts.length && !/\n$/.test(parts[parts.length - 1])) {
          parts.push("\n");
        }
        parts.push(extractCodeText(node));
        parts.push("\n");
        return;
      }
      parts.push(node.textContent);
    });
    return parts.join("").replace(/\r\n/g, "\n").replace(/\n+$/, "");
  }

  function looksLikeSingleLineCodeBlock(text) {
    const normalized = text.replace(/\r\n/g, "\n").trim();
    if (!normalized || normalized.indexOf("\n") !== -1) {
      return false;
    }
    const parts = normalized.split(";").map(function (part) {
      return part.trim();
    }).filter(Boolean);
    return parts.length >= 2 && parts.filter(looksLikeCodeFragment).length >= 2;
  }

  function looksLikeStandaloneCodeStatement(text) {
    const normalized = text.replace(/\r\n/g, "\n").trim();
    if (!normalized) {
      return false;
    }
    const lines = normalized.split("\n").map(function (line) {
      return line.trim();
    }).filter(Boolean);
    if (lines.length >= 2) {
      return looksLikeMergedCode(lines.join("\n"));
    }
    const line = lines[0] || "";
    if (looksLikeSingleLineCodeBlock(line)) {
      return true;
    }
    return looksLikeCodeFragment(line) && /[;=]/.test(line) && line.length >= 15;
  }

  function shouldPromoteInlineCodeToPre(codeEl, text) {
    if (!codeEl) {
      return false;
    }
    if (/language-[\w+-]+/.test(codeEl.className || "")) {
      return true;
    }
    if (codeEl.querySelector("br, div, p")) {
      return true;
    }
    const normalized = text.replace(/\r\n/g, "\n").trim();
    if (normalized.indexOf("\n") !== -1) {
      const lines = normalized.split("\n").filter(function (line) {
        return line.trim();
      });
      if (lines.length >= 2) {
        return looksLikeMergedCode(normalized) || lines.filter(looksLikeCodeFragment).length >= 2;
      }
    }
    return looksLikeStandaloneCodeStatement(normalized);
  }

  function createPreFromCodeText(text, lang, root) {
    const resolvedLang = lang || inferCodeLangFromAnswer(root) || langSelect.value || "";
    const pre = document.createElement("pre");
    pre.contentEditable = "false";
    const newCode = document.createElement("code");
    if (resolvedLang) {
      setCodeLanguage(newCode, resolvedLang);
    }
    newCode.textContent = text.replace(/\r\n/g, "\n").trim();
    pre.appendChild(newCode);
    markCodeBlockMetadata(pre, newCode.textContent, resolvedLang);
    return pre;
  }

  function promoteInlineCodeParagraph(p, root) {
    const code = p.querySelector(":scope > code");
    if (!code) {
      return false;
    }
    const onlyCode = Array.from(p.childNodes).every(function (node) {
      if (node.nodeType === Node.TEXT_NODE) {
        return !node.textContent.trim();
      }
      return node === code;
    });

    const text = onlyCode ? extractCodeText(code) : p.textContent.replace(/\r\n/g, "\n").trim();
    if (!text || !shouldPromoteInlineCodeToPre(code, text)) {
      return false;
    }

    const lang = getCodeLanguage(code) || inferCodeLangFromAnswer(root) || "";
    p.replaceWith(createPreFromCodeText(text, lang, root));
    return true;
  }

  function repairPartialInlineCodeParagraphs(root) {
    Array.from(root.querySelectorAll("p")).forEach(function (p) {
      if (p.querySelector("pre, ul, ol, table")) {
        return;
      }
      const codes = p.querySelectorAll(":scope > code");
      if (codes.length !== 1) {
        return;
      }
      if (Array.from(p.childNodes).every(function (node) {
        if (node.nodeType === Node.TEXT_NODE) {
          return !node.textContent.trim();
        }
        return node === codes[0];
      })) {
        return;
      }
      const text = p.textContent.replace(/\r\n/g, "\n").trim();
      if (!looksLikeStandaloneCodeStatement(text)) {
        return;
      }
      p.replaceWith(createPreFromCodeText(text, getCodeLanguage(codes[0]) || inferCodeLangFromAnswer(root), root));
    });
  }

  function removeEmptyParagraphs(root) {
    Array.from(root.querySelectorAll("p")).forEach(function (p) {
      if (!p.textContent.trim() && !p.querySelector("img, pre, ul, ol, table, br")) {
        p.remove();
      }
    });
  }

  function promoteInlineCodeBlocks(root) {
    Array.from(root.querySelectorAll("p")).forEach(function (p) {
      promoteInlineCodeParagraph(p, root);
    });
  }

  function inferCodeLangFromAnswer(root) {
    const coded = root.querySelector("pre code[class*='language-'], code[class*='language-']");
    if (!coded) {
      return "";
    }
    const match = coded.className.match(/language-([\w+-]+)/);
    return match ? match[1] : "";
  }

  function normalizePlainTextCodeParagraphs(root) {
    const fallbackLang = inferCodeLangFromAnswer(root);
    Array.from(root.querySelectorAll("p")).forEach(function (p) {
      if (p.querySelector("code, pre, ul, ol, table, h3, h4")) {
        return;
      }
      const text = p.textContent.replace(/\r\n/g, "\n").trim();
      if (!looksLikeMergedCode(text) && !looksLikeMultilineCodeText(text)) {
        return;
      }
      const pre = document.createElement("pre");
      pre.contentEditable = "false";
      const code = document.createElement("code");
      code.textContent = text;
      setCodeLanguage(code, fallbackLang);
      pre.appendChild(code);
      markCodeBlockMetadata(pre, text, fallbackLang);
      p.replaceWith(pre);
    });
  }

  function repairSplitCodeParagraphs(root) {
    const fallbackLang = inferCodeLangFromAnswer(root);
    const nodes = Array.from(root.children);
    let i = 0;
    while (i < nodes.length) {
      const node = nodes[i];
      if (node.tagName !== "P") {
        i += 1;
        continue;
      }

      const run = [];
      let j = i;
      while (j < nodes.length && nodes[j].tagName === "P") {
        const text = nodes[j].textContent.trim();
        if (!text || !looksLikeCodeFragment(text)) {
          break;
        }
        run.push(nodes[j]);
        j += 1;
      }

      if (run.length >= 2) {
        const codeText = run.map(function (p) {
          return p.textContent.trim();
        }).join("\n");
        if (looksLikeMergedCode(codeText) || looksLikeMultilineCodeText(codeText)) {
          const pre = document.createElement("pre");
          pre.contentEditable = "false";
          const code = document.createElement("code");
          code.textContent = codeText;
          pre.appendChild(code);
          markCodeBlockMetadata(pre, codeText, fallbackLang);
          root.insertBefore(pre, run[0]);
          run.forEach(function (p) {
            p.remove();
          });
          nodes.splice(i, run.length, pre);
          i += 1;
          continue;
        }
      }
      i += 1;
    }
  }

  function inferDefaultCodeLang() {
    const category = document.body && document.body.dataset.category;
    const map = {
      python: "python",
      ai: "python",
      "rag-vector": "python",
      java: "java",
      spring: "java",
      mysql: "sql",
      redis: "bash",
      rocketmq: "java",
      "docker-k8s": "bash",
      llm: "python",
      architecture: "bash",
      observability: "bash",
      security: "java",
      frontend: "javascript",
      bigdata: "bash",
      leetcode: "python"
    };
    return map[category] || "";
  }

  function hoistPreBlocks(root) {
    Array.from(root.querySelectorAll("pre")).forEach(function (pre) {
      let parent = pre.parentElement;
      while (parent && parent !== root) {
        const grand = parent.parentElement;
        if (!grand) {
          break;
        }
        if (parent.tagName === "P" || parent.tagName === "LI") {
          grand.insertBefore(pre, parent.nextSibling);
          if (
            parent.tagName === "P" &&
            !parent.textContent.trim() &&
            !parent.querySelector("img, ul, ol, table, pre, code")
          ) {
            parent.remove();
          }
          parent = pre.parentElement;
          continue;
        }
        if (
          parent.tagName === "DIV" &&
          grand === root &&
          parent.children.length === 1 &&
          parent.firstElementChild === pre
        ) {
          parent.replaceWith(pre);
          break;
        }
        break;
      }
      pre.contentEditable = "false";
    });
  }

  function looksLikeMultilineCodeText(text) {
    const normalized = text.replace(/\r\n/g, "\n").trim();
    if (!normalized) {
      return false;
    }
    const lines = normalized.split("\n").filter(function (line) {
      return line.trim();
    });
    if (lines.length < 2) {
      return false;
    }
    if (/^(import |from |def |class |async def |@|#|\/\/|\/\*|\{|\}|try:|except |if __name__)/m.test(normalized)) {
      return true;
    }
    return looksLikeMergedCode(normalized);
  }

  function findBlockInsertAnchor(editable, range) {
    let node = range.commonAncestorContainer;
    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentElement;
    }
    if (!(node instanceof Element) || !editable.contains(node)) {
      return null;
    }
    const block = node.closest("p, h3, h4, pre, table, ul, ol");
    if (block && editable.contains(block) && block.parentElement === editable) {
      return block;
    }
    return null;
  }

  function restoreCodeBlocksFromData(root) {
    root.querySelectorAll("pre").forEach(function (pre) {
      const rawCode = pre.dataset.rawCode;
      if (!rawCode) {
        return;
      }
      let code = pre.querySelector("code");
      if (!code) {
        code = document.createElement("code");
        pre.textContent = "";
        pre.appendChild(code);
      }
      code.textContent = rawCode.replace(/\r\n/g, "\n");
      const lang = pre.dataset.codeLang || getCodeLanguage(pre);
      setCodeLanguage(code, lang);
      pre.contentEditable = "false";
    });
  }

  function prepareCodeBlocksForSave(root) {
    hoistPreBlocks(root);
    promoteInlineCodeBlocks(root);
    repairPartialInlineCodeParagraphs(root);
    repairSplitCodeParagraphs(root);
    normalizePlainTextCodeParagraphs(root);
    restoreCodeBlocksFromData(root);
    hoistPreBlocks(root);
    protectCodeBlocks(root);
    root.querySelectorAll("pre code").forEach(function (code) {
      const plain = code.textContent.replace(/\r\n/g, "\n");
      code.textContent = plain;
      const pre = code.closest("pre");
      const lang =
        (pre && (pre.dataset.codeLang || getCodeLanguage(pre))) ||
        inferCodeLangFromAnswer(root) ||
        inferDefaultCodeLang();
      if (lang) {
        setCodeLanguage(code, lang);
        if (pre) {
          pre.dataset.codeLang = lang;
        }
      }
    });
    removeEmptyParagraphs(root);
  }

  function normalizeCodeBlocks(root) {
    root.querySelectorAll("div").forEach(function (div) {
      if (div.children.length === 1 && div.firstElementChild && div.firstElementChild.tagName === "PRE") {
        div.replaceWith(div.firstElementChild);
      }
    });

    promoteInlineCodeBlocks(root);
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
    const defaultLang = inferDefaultCodeLang();
    if (defaultLang) {
      langSelect.value = defaultLang;
    }

    const pre = document.createElement("pre");
    pre.contentEditable = "false";
    pre.dataset.editorCodeBlock = "1";
    const code = document.createElement("code");
    if (defaultLang) {
      setCodeLanguage(code, defaultLang);
      pre.dataset.codeLang = defaultLang;
    }
    code.textContent = "";
    pre.appendChild(code);

    const paragraph = document.createElement("p");
    paragraph.appendChild(document.createElement("br"));

    const anchor = findBlockInsertAnchor(editable, range);
    if (anchor) {
      anchor.insertAdjacentElement("afterend", pre);
      pre.insertAdjacentElement("afterend", paragraph);
    } else {
      range.deleteContents();
      const fragment = document.createDocumentFragment();
      fragment.appendChild(pre);
      fragment.appendChild(paragraph);
      range.insertNode(fragment);
      hoistPreBlocks(editable);
    }

    openCodePanel(pre);
    setStatus("");
  }

  const ROW_CONTROLS_HTML =
    '<button type="button" class="editor-row-btn" data-row-action="insert-above" title="在上方插入行">+↑</button>' +
    '<button type="button" class="editor-row-btn" data-row-action="insert-below" title="在下方插入行">+↓</button>' +
    '<button type="button" class="editor-row-btn danger" data-row-action="delete" title="删除行">×</button>';

  let tableOverlayLayer = null;
  let overlayRepositionScheduled = false;

  function rememberScrollForReload() {
    sessionStorage.setItem("editor-scroll-restore", JSON.stringify({
      scrollY: window.scrollY
    }));
  }

  function ensureTableOverlayLayer() {
    if (!tableOverlayLayer) {
      tableOverlayLayer = document.createElement("div");
      tableOverlayLayer.className = "editor-table-overlay-layer";
      tableOverlayLayer.hidden = true;
      document.body.appendChild(tableOverlayLayer);
      window.addEventListener("scroll", scheduleTableOverlayReposition, true);
      window.addEventListener("resize", scheduleTableOverlayReposition);
    }
    return tableOverlayLayer;
  }

  function scheduleTableOverlayReposition() {
    if (!state.editing || overlayRepositionScheduled) {
      return;
    }
    overlayRepositionScheduled = true;
    requestAnimationFrame(function () {
      overlayRepositionScheduled = false;
      repositionTableOverlays();
    });
  }

  function repositionTableOverlays() {
    if (!tableOverlayLayer || tableOverlayLayer.hidden) {
      return;
    }
    tableOverlayLayer.querySelectorAll(".editor-row-controls-floating").forEach(function (strip) {
      const row = strip._anchorRow;
      if (!row || !row.isConnected) {
        strip.remove();
        return;
      }
      const rect = row.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) {
        strip.style.visibility = "hidden";
        return;
      }
      strip.style.visibility = "visible";
      strip.style.top = Math.round(rect.top) + "px";
      strip.style.left = Math.max(8, Math.round(rect.left - 92)) + "px";
      strip.style.height = Math.round(rect.height) + "px";
    });
  }

  function bindTableRowOverlay(row) {
    const legacyControls = row.querySelector(".editor-row-controls");
    if (legacyControls) {
      legacyControls.remove();
    }
    if (row.dataset.editorOverlayBound === "1") {
      return;
    }
    const layer = ensureTableOverlayLayer();
    layer.hidden = false;
    row.dataset.editorOverlayBound = "1";
    row.classList.add("editor-table-row");

    const strip = document.createElement("div");
    strip.className = "editor-row-controls-floating";
    strip.setAttribute("contenteditable", "false");
    strip.innerHTML = ROW_CONTROLS_HTML;
    strip._anchorRow = row;
    layer.appendChild(strip);
  }

  function setEditMode(enabled) {
    state.editing = enabled;
    document.body.classList.toggle("edit-mode", enabled);
    primaryBtn.hidden = enabled;

    getSections().forEach(function (section) {
      const answer = getSectionAnswer(section);
      const h2 = getSectionH2(section);
      const contentRoot = getSectionContentRoot(section);
      if (answer) {
        answer.contentEditable = enabled ? "true" : "false";
      }
      if (h2) {
        h2.contentEditable = enabled ? "true" : "false";
      }
      section.classList.toggle("editor-section-active", enabled);
      if (enabled) {
        protectCodeBlocks(contentRoot);
        attachTableControls(section);
      } else {
        detachTableControls(section);
      }
    });

    if (enabled) {
      scheduleTableOverlayReposition();
    }

    if (!enabled) {
      closeCodePanel();
      setStatus("");
    }
  }

  function attachTableControls(section) {
    const root = getSectionAnswer(section) || section;
    root.querySelectorAll(".editor-row-controls-header").forEach(function (cell) {
      cell.remove();
    });
    root.querySelectorAll("table tbody tr").forEach(bindTableRowOverlay);
    repositionTableOverlays();
  }

  function detachTableControls(section) {
    const root = getSectionAnswer(section) || section;
    root.querySelectorAll("table tbody tr").forEach(function (row) {
      row.classList.remove("editor-table-row");
      delete row.dataset.editorOverlayBound;
      const legacyControls = row.querySelector(".editor-row-controls");
      if (legacyControls) {
        legacyControls.remove();
      }
    });
    root.querySelectorAll(".editor-row-controls-header").forEach(function (cell) {
      cell.remove();
    });
    if (!tableOverlayLayer) {
      return;
    }
    tableOverlayLayer.querySelectorAll(".editor-row-controls-floating").forEach(function (strip) {
      const row = strip._anchorRow;
      if (row && root.contains(row)) {
        strip.remove();
      }
    });
    if (!tableOverlayLayer.querySelector(".editor-row-controls-floating")) {
      tableOverlayLayer.hidden = true;
    }
  }

  function createTableRow(templateRow) {
    const row = document.createElement("tr");
    Array.from(templateRow.children).forEach(function (cell) {
      if (cell.classList.contains("editor-row-controls")) {
        return;
      }
      const td = document.createElement(cell.tagName === "TH" ? "th" : "td");
      td.innerHTML = "&nbsp;";
      row.appendChild(td);
    });
    return row;
  }

  function getDataRows(tbody) {
    return Array.from(tbody.querySelectorAll(":scope > tr"));
  }

  function handleTableAction(button) {
    const strip = button.closest(".editor-row-controls-floating");
    const row = strip ? strip._anchorRow : button.closest("tr");
    const tbody = row && row.parentElement;
    if (!row || !tbody) {
      return;
    }

    const action = button.dataset.rowAction;
    if (action === "insert-above") {
      const newRow = createTableRow(row);
      tbody.insertBefore(newRow, row);
      bindTableRowOverlay(newRow);
      repositionTableOverlays();
      return;
    }
    if (action === "insert-below") {
      const newRow = createTableRow(row);
      tbody.insertBefore(newRow, row.nextSibling);
      bindTableRowOverlay(newRow);
      repositionTableOverlays();
      return;
    }
    if (action === "delete") {
      const rows = getDataRows(tbody);
      if (rows.length <= 1) {
        setStatus("表格至少保留一行", true);
        return;
      }
      if (strip) {
        strip.remove();
      }
      row.remove();
      repositionTableOverlays();
    }
  }

  function getCodeLanguage(container) {
    if (!container) {
      return "";
    }
    const code = container.tagName === "CODE" ? container : container.querySelector("code");
    if (!code) {
      return "";
    }
    const match = (code.className || "").match(/language-([\w+-]+)/);
    return match ? match[1] : "";
  }

  function setCodeLanguage(code, lang) {
    code.className = lang ? "language-" + lang : "";
  }

  function openCodePanel(pre) {
    state.activePre = pre;
    ensureCodeBlockMetadata(pre);
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

  function deleteCodePanel() {
    if (!state.activePre) {
      return;
    }
    state.activePre.remove();
    closeCodePanel();
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
    const lang = langSelect.value || inferDefaultCodeLang() || inferCodeLangFromAnswer(state.activePre.closest(".answer") || state.activePre.closest("section"));
    setCodeLanguage(code, lang);
    state.activePre.contentEditable = "false";
    state.activePre.dataset.editorCodeBlock = "1";
    markCodeBlockMetadata(state.activePre, codeTextarea.value, lang);

    const contentRoot = getSectionContentRoot(state.activePre.closest("section"));
    if (contentRoot) {
      hoistPreBlocks(contentRoot);
    }

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
        "developer/" +
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

  function restoreCodeHighlighting() {
    if (!window.hljs) {
      return;
    }
    document.querySelectorAll("main pre code").forEach(function (code) {
      if (!/language-[\w+-]+/.test(code.className)) {
        return;
      }
      delete code.dataset.highlighted;
      code.removeAttribute("data-highlighted");
      window.hljs.highlightElement(code);
    });
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
      setStatus("无法识别当前页面文件：" + (pageFile || "(空)") + "，请从 http://localhost:3000/developer/java.html 这类地址打开", true);
      return;
    }

    if (!codePanel.hidden && state.activePre) {
      applyCodePanel();
    }

    setStatus("保存中…");
    saveExitBtn.disabled = true;

    try {
      getSections().forEach(function (section) {
        const contentRoot = getSectionContentRoot(section);
        normalizeOrphanInlines(contentRoot);
        normalizeCodeBlocks(contentRoot);
        normalizeLists(contentRoot);
        normalizeOrphanInlines(contentRoot);
        prepareCodeBlocksForSave(contentRoot);
      });

      let sectionsHtml;
      try {
        sectionsHtml = window.HtmlSerializer.serializeMainSections();
      } catch (serializeError) {
        throw new Error("内容序列化失败：" + (serializeError.message || serializeError));
      }

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
      rememberScrollForReload();
      window.location.reload();
    } catch (error) {
      console.error("[editor save]", error);
      restoreCodeHighlighting();
      setStatus(formatSaveError(error), true);
      saveExitBtn.disabled = false;
    }
  }

  function handleEditorAction(action) {
    if (action === "edit-primary") {
      verifyEditorServer().then(function (ok) {
        if (!ok) {
          setStatus(
            "保存服务未就绪。请运行 npm run dev，并访问 http://localhost:3000/developer/" + (currentPageFile() || "java.html"),
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
      rememberScrollForReload();
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
    if (action === "red") {
      wrapSelectionWithClass("span", "em-danger");
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
    if (button.dataset.action === "delete-code") {
      deleteCodePanel();
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
