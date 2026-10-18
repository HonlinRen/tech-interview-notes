(function () {
  const ALLOWED = new Set('SECTION H2 H3 H4 H5 H6 P DIV SPAN STRONG B I EM MARK DEL S U SUB SUP SMALL BR HR PRE CODE UL OL LI TABLE CAPTION THEAD TBODY TFOOT TR TH TD A IMG BLOCKQUOTE DETAILS SUMMARY DL DT DD FIGURE FIGCAPTION KBD SAMP'.split(' '));
  const ATTRS = new Set(['id', 'title', 'href', 'src', 'alt', 'width', 'height', 'colspan', 'rowspan', 'scope', 'start', 'reversed', 'open', 'target', 'rel']);
  const UI = '.question-heading .question-actions, .question-actions, .editor-row-controls, .editor-row-controls-header, .editor-row-controls-floating, .editor-code-toolbar, .reveal-answer';
  const escapeHtml = text => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const stripNumber = text => text.replace(/^\d+(?:-\d+)?\.\s*/, '');
  function sanitize(node) {
    if (node.nodeType === Node.TEXT_NODE) return document.createTextNode(node.textContent);
    if (node.nodeType !== Node.ELEMENT_NODE) return document.createTextNode('');
    if (!ALLOWED.has(node.tagName)) throw new Error('不支持保存的标签：' + node.tagName + '。请先移除或转换该内容。');
    const clone = document.createElement(node.tagName.toLowerCase());
    for (const attribute of node.attributes) {
      const name = attribute.name, value = attribute.value;
      if (!ATTRS.has(name)) continue;
      if ((name === 'href' || name === 'src') && !/^(https?:|mailto:|tel:|#|\.{0,2}\/|[^:]+$)/i.test(value.replace(/[\s\u0000-\u001f]/g, ''))) throw new Error('链接或图片地址不受支持');
      clone.setAttribute(name, value);
    }
    const classes = [...node.classList].filter(name => /^(language-[\w+-]+|em-[\w-]+|note|warning|tip|concept-list|explanation-block)$/.test(name));
    if (classes.length) clone.className = classes.join(' ');
    if (clone.tagName === 'A' && clone.target === '_blank') clone.rel = 'noopener noreferrer';
    if (node.tagName === 'PRE') {
      // Highlighting is presentation only. Preserve exact code text and its language.
      const original = node.querySelector('code');
      if (original) {
        const code = document.createElement('code');
        const language = [...original.classList].find(name => /^language-[\w+-]+$/.test(name));
        if (language) code.className = language;
        code.textContent = original.textContent;
        clone.appendChild(code);
      } else clone.textContent = node.textContent;
      return clone;
    }
    node.childNodes.forEach(child => {
      if (child.nodeType === Node.ELEMENT_NODE && child.matches(UI)) return;
      clone.appendChild(sanitize(child));
    });
    return clone;
  }
  function serializeSection(section) {
    if (!section.id || section.id === 'summary') return '';
    const output = document.createElement('section'); output.id = section.id;
    const title = section.querySelector(':scope > .question-heading h2, :scope > h2');
    if (!title || !title.textContent.trim()) throw new Error('题目缺少标题：' + section.id);
    const heading = document.createElement('h2'); heading.textContent = stripNumber(title.textContent.trim()); output.append(heading);
    const container = section.querySelector(':scope > .answer') || section;
    container.childNodes.forEach(node => {
      if (node === title || (node.nodeType === Node.ELEMENT_NODE && (node.classList.contains('question-heading') || node.matches(UI)))) return;
      output.appendChild(sanitize(node));
    });
    return output.outerHTML;
  }
  function parseSections(raw) {
    const template = document.createElement('template'); template.innerHTML = raw;
    const sections = [...template.content.children];
    if (!sections.length || sections.some(node => node.tagName !== 'SECTION' || !node.id)) throw new Error('草稿题目结构无效');
    const ids = new Set();
    sections.forEach(section => { if (ids.has(section.id)) throw new Error('草稿包含重复题目'); ids.add(section.id); });
    return sections.map(section => sanitize(section));
  }
  window.HtmlSerializer = { escapeHtml, stripNumber, serializeSection, parseSections,
    serializeMainSections() { return [...document.querySelectorAll('main > section')].map(serializeSection).filter(Boolean).join('\n\n'); }
  };
})();
