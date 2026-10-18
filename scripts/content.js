const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { parseDocument, DomUtils } = require("htmlparser2");
const topics = require("../assets/topics");
const { parseSource, sourcePath } = require('./templates');
const markdown = require('../assets/markdown');

const hash = text => crypto.createHash("sha256").update(text).digest("hex");
const isTag = node => typeof node.name === "string";
const ALLOWED_ELEMENTS = new Set("section h2 h3 h4 h5 h6 p div span strong b i em mark del s u sub sup small br hr pre code ul ol li table caption thead tbody tfoot tr th td a img blockquote details summary dl dt dd figure figcaption kbd samp".split(" "));
const children = node => (node.children || []).filter(isTag);
const text = node => DomUtils.textContent(node).replace(/\s+/g, " ").trim();
function collect(html, topic) {
  const doc = parseDocument(html);
  const main = DomUtils.findOne(n => n.name === "main", doc.children, true);
  if (!main) throw new Error("页面缺少 main");
  return children(main).filter(n => n.name === "section" && n.attribs.id !== "summary").map(section => {
    const title = children(section).find(n => n.name === "h2");
    if (!section.attribs.id || !title) throw new Error("题目必须包含 id 和 h2 标题");
    return {
      id: section.attribs.id, category: topic.id, title: text(title).replace(/^\d+(?:-\d+)?\.\s*/, ""),
      path: topic.path + "#" + encodeURIComponent(section.attribs.id),
      text: children(section).filter(n => n !== title).map(text).join(" "),
      excerpt: children(section).filter(n => n !== title).map(text).join(" ").slice(0, 160)
    };
  });
}
function validateSections(sections) {
  const doc = parseDocument(sections);
  const nodes = doc.children.filter(n => n.type !== "comment" && !(n.type === "text" && !n.data.trim()));
  if (!nodes.length || nodes.some(n => !isTag(n) || n.name !== "section")) throw new Error("只允许保存题目 section");
  const ids = new Set();
  const reserved = new Set(["emptyState", "searchInput", "searchSuggestions", "filterBar", "topicSelect", "categoryStats", "studyStats", "compactBtn", "darkBtn", "progressFilter", "selfTestBtn", "sessionStatus"]);
  for (const node of DomUtils.findAll(isTag, nodes)) {
    if (node.attribs.id) {
      if (ids.has(node.attribs.id) || reserved.has(node.attribs.id)) throw new Error("重复或保留的题目或元素 ID：" + node.attribs.id);
      ids.add(node.attribs.id);
    }
    if (!ALLOWED_ELEMENTS.has(node.name)) throw new Error("题目包含不支持的标签：" + node.name);
    for (const [key, value] of Object.entries(node.attribs)) {
      if (/^on/i.test(key) || ["srcdoc", "contenteditable"].includes(key) || (/^(href|src|xlink:href)$/i.test(key) && !/^(https?:|mailto:|tel:|#|\.{0,2}\/|[^:]+$)/i.test(value.replace(/[\s\u0000-\u001f]/g, "")))) throw new Error("题目包含不支持的属性：" + key);
    }
  }
  for (const node of nodes) {
    if (!node.attribs.id || node.attribs.id === "summary" || !children(node).some(n => n.name === "h2" && text(n))) throw new Error("每道题需要唯一 ID 和非空 h2 标题");
  }
  return nodes.map(node => DomUtils.getOuterHTML(node)).join("\n\n");
}
function buildIndex(root) {
  return { version: 1, questions: topics.flatMap(topic => collect('<main>' + markdown.render(parseSource(fs.readFileSync(path.join(root, 'src', sourcePath(topic)), 'utf8')).content) + '</main>', topic)) };
}
function atomicWrite(file, data) {
  const temp = file + "." + crypto.randomUUID() + ".tmp";
  try { fs.writeFileSync(temp, data, "utf8"); fs.renameSync(temp, file); }
  finally { if (fs.existsSync(temp)) fs.unlinkSync(temp); }
}
function writeIndex(root) {
  const index = buildIndex(root);
  fs.mkdirSync(path.join(root, '_site/assets'), { recursive: true });
  atomicWrite(path.join(root, "_site/assets/questions-index.json"), JSON.stringify(summaryIndex(index)));
  atomicWrite(path.join(root, "_site/assets/search-index.json"), JSON.stringify(searchIndex(index)));
  return index;
}
function summaryIndex(index) { return { version: 1, questions: index.questions.map(({ text, ...question }) => question) }; }
function searchIndex(index) { return { version: 1, textByKey: Object.fromEntries(index.questions.map(q => [q.category + ":" + q.id, q.text])) }; }
module.exports = { hash, collect, validateSections, buildIndex, summaryIndex, searchIndex, atomicWrite, writeIndex };
