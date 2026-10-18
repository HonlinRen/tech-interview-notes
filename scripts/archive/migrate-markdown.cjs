// One-time migration from the pre-2026-10-18 HTML working tree; guarded against reruns.
const fs = require('node:fs'), path = require('node:path');
const { parseDocument, DomUtils: d } = require('htmlparser2');
const Turndown = require('turndown'), { gfm } = require('turndown-plugin-gfm');
const topics = require('../../assets/topics'), { parseSource } = require('../templates');
const { merges, removals } = require('./interview-curation.cjs');
const answers = require('./interview-answers.cjs');
const markdown = require('../../assets/markdown');
if (topics.some(t => !fs.existsSync('src/' + t.path))) throw new Error('HTML 源已迁移，禁止重复执行');
const backup = '.local-backups/before-markdown-20261018'; fs.mkdirSync(backup, { recursive: true });
const td = new Turndown({ headingStyle:'atx', codeBlockStyle:'fenced', bulletListMarker:'-', emDelimiter:'*' }); td.use(gfm);
td.addRule('code', { filter:'pre', replacement(_text, node) {
  const code = node.querySelector('code') || node;
  const language = code.className?.match(/language-([\w+-]+)/)?.[1] || 'text';
  const value = code.textContent.replace(/\r\n/g, '\n').replace(/^\n/, '').replace(/\n$/, '');
  const longest = Math.max(2, ...(value.match(/`+/g) || []).map(s => s.length));
  const fence = '`'.repeat(longest + 1); return '\n\n' + fence + language + '\n' + value + '\n' + fence + '\n\n';
} });
td.addRule('definition', { filter:['dt','dd'], replacement(content, node) { return node.nodeName === 'DT' ? '\n\n**' + content + '**\n\n' : content + '\n\n'; } });
td.addRule('lineBreak', { filter:'br', replacement: () => '  \n' });
const redirects = {};
for (const [category, map] of Object.entries(merges)) for (const [old, target] of Object.entries(map)) redirects[category+':'+old] = target.includes(':') ? target : category+':'+target;
for (const [category, ids] of Object.entries(removals)) for (const id of ids) redirects[category+':'+id] = category+':main-content';
function retarget(category, value) {
  const match = value.match(/^(?:(?:\.\.\/)?(?:developer\/)?([\w-]+)\.html)?#([\w-]+)$/);
  if (!match) return value;
  const key = (match[1] || category) + ':' + match[2], target = redirects[key]; if (!target) return value;
  const [toCategory, id] = target.split(':');
  return toCategory === category ? '#' + id : toCategory + '.html#' + id;
}
const report = [], deleted = [], merged = [];
for (const topic of topics) {
  const raw = fs.readFileSync('src/'+topic.path, 'utf8'), parsed = parseSource(raw);
  fs.writeFileSync(path.join(backup, topic.file), raw);
  const doc = parseDocument(parsed.content), sections = doc.children.filter(n => n.name === 'section' && n.attribs.id !== 'summary');
  const quick = new Map(answers[topic.id].trim().split('\n').map(line => { const [id, fast, boundary] = line.split('|'); return [id, { fast, boundary }]; }));
  const out = [];
  for (const section of sections) {
    const id = section.attribs.id, heading = section.children.find(n => n.name === 'h2'), title = d.textContent(heading).replace(/^\d+[.、]\s*/, '');
    if (merges[topic.id]?.[id]) { merged.push({ category:topic.id,id,title,target:redirects[topic.id+':'+id] }); continue; }
    if (removals[topic.id]?.includes(id)) { deleted.push({ category:topic.id,id,title,reason:'偏离 Java 后端五年社招主线，或属于过细的术语/型号背诵；其通用能力保留在相关主题中。' }); continue; }
    const entry = quick.get(id); if (!entry?.fast || !entry.boundary) throw new Error('缺少人工整改答案：'+topic.id+':'+id);
    for (const node of d.findAll(n => !!n.name, section.children)) {
      if (/^h[3-6]$/.test(node.name)) node.name = 'h'+Math.min(6, Number(node.name.slice(1))+1);
      if (node.name === 'a' && node.attribs.href) node.attribs.href = retarget(topic.id, node.attribs.href);
      // Discard presentation-only attributes and colors; Markdown carries the semantics.
      for (const attr of ['style','class','contenteditable']) if (node.name !== 'code' || attr !== 'class') delete node.attribs[attr];
    }
    let body = td.turndown(section.children.filter(n => n !== heading).map(n => d.getOuterHTML(n)).join('')).trim();
    // Keep useful original examples, but remove a repeated lead paragraph.
    body = body.replace(/^(?!#|[-*]|\d\.|`|\|)([^\n]+)\n\n/, '');
    out.push('## '+title+' {#'+id+'}\n\n### 面试快答\n\n'+entry.fast+'\n\n### 详细解析\n\n'+entry.boundary+'\n\n'+body);
  }
  const content = out.join('\n\n')+'\n'; markdown.render(content);
  const destination = 'src/'+topic.path.replace('.html','.md'); fs.writeFileSync(destination, parsed.prefix + content); fs.unlinkSync('src/'+topic.path);
  report.push({ category:topic.id, before:sections.length, after:out.length, merged:sections.filter(n => merges[topic.id]?.[n.attribs.id]).length, removed:removals[topic.id]?.length || 0 });
}
fs.writeFileSync('assets/question-redirects.js', '(function(){window.StudyQuestionRedirects='+JSON.stringify(redirects,null,2)+';})();\n');
fs.writeFileSync('docs/interview-curation-20261018.json', JSON.stringify({ date:'2026-10-18', profile:'五年开发经验 / Java 后端社招，AI 应用为扩展方向', topics:report, merged, deleted },null,2)+'\n');
// Preserve progress from consolidated questions. Existing historical mappings remain intact.
let migrations = fs.readFileSync('assets/progress-migrations.js','utf8');
const additions = merged.map(q => '        '+JSON.stringify(q.category+':'+q.id)+': '+JSON.stringify(q.target)).join(',\n');
migrations = migrations.replace('}, remap: {', '}, remap: {\n'+additions+','); fs.writeFileSync('assets/progress-migrations.js',migrations);
console.log(JSON.stringify(report));
