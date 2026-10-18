(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('markdown-it'));
  else root.StudyMarkdown = factory(root.markdownit);
})(typeof window === 'undefined' ? globalThis : window, function (MarkdownIt) {
  const md = new MarkdownIt({ html: false, linkify: false, breaks: false });
  const reserved = new Set(['summary', 'main-content', 'markdown-source', 'markdown-input', 'emptyState', 'searchInput', 'searchSuggestions', 'filterBar', 'topicSelect', 'categoryStats', 'studyStats', 'compactBtn', 'darkBtn', 'progressFilter', 'selfTestBtn', 'sessionStatus']);
  function parse(source) {
    const tokens = md.parse(source.replace(/\r\n/g, '\n'), {});
    const questions = [], ids = new Set();
    let start = -1;
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (token.type !== 'heading_open' || token.tag !== 'h2' || token.level !== 0) continue;
      if (start >= 0) questions[questions.length - 1].tokens = tokens.slice(start, i);
      const inline = tokens[i + 1];
      const match = inline.content.match(/^(.*?)\s+\{#([a-zA-Z][\w-]*)\}\s*$/);
      if (!match || !match[1].trim()) throw new Error('每道题用“## 题目标题 {#固定ID}”开头');
      const id = match[2];
      if (ids.has(id) || reserved.has(id) || id.endsWith('--answer')) throw new Error('重复或保留的题目 ID：' + id);
      ids.add(id);
      inline.content = match[1]; inline.children = md.parseInline(match[1], {})[0].children;
      questions.push({ id, title: match[1], line: token.map[0] }); start = i;
    }
    if (start < 0) throw new Error('至少保留一道题，使用“## 题目标题 {#固定ID}”');
    if (questions[0].line > 0) {
      const prefix = source.split(/\r?\n/).slice(0, questions[0].line).join('\n').trim();
      if (prefix) throw new Error('题目正文必须从二级标题开始');
    }
    questions[questions.length - 1].tokens = tokens.slice(start);
    for (const question of questions) {
      if (question.tokens.some(t => t.type === 'heading_open' && t.tag === 'h1')) throw new Error('题目内请用三级或更低标题');
      const answerHeadings = question.tokens.flatMap((t, i, list) => t.type === 'heading_open' && t.tag === 'h3' && t.level === 0 ? [list[i + 1].content] : []);
      if (answerHeadings.length !== 2 || answerHeadings[0] !== '面试快答' || answerHeadings[1] !== '详细解析') throw new Error('每道题必须依次包含“### 面试快答”和“### 详细解析”，子标题请用四级');
      for (const label of ['面试快答', '详细解析']) {
        const index = question.tokens.findIndex(t => t.type === 'inline' && t.content === label);
        const rest = question.tokens.slice(index + 2);
        if (!rest.length || rest[0].type === 'heading_open') throw new Error(label + '不能为空');
      }
    }
    return questions;
  }
  function render(source) {
    return parse(source).map(q => '<section id="' + q.id + '">\n' + md.renderer.render(q.tokens, md.options, {}) + '</section>').join('\n\n');
  }
  return { parse, render };
});
