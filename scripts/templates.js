const fs = require('node:fs');
const path = require('node:path');
const yaml = require('js-yaml');
const nunjucks = require('nunjucks');
const { parseDocument, DomUtils } = require('htmlparser2');
const topics = require('../assets/topics');
const markdown = require('../assets/markdown');

const bundles = {
  home: ['topics', 'study-legacy-map', 'progress-migrations', 'progress-store', 'progress-tools', 'home'],
  topic: ['highlight.min', 'vendor/markdown-it.min', 'markdown', 'topics', 'question-redirects', 'study-legacy-map', 'progress-migrations', 'progress-store', 'progress-tools', 'save-client', 'reading-groups', 'study', 'code-highlight', 'content-editor', 'study-extras'],
  lab: ['highlight.min', 'code-highlight', 'lab']
};
function parseSource(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) throw new Error('源文件缺少页面元数据');
  return { data: yaml.load(match[1], { schema: yaml.JSON_SCHEMA }), content: source.slice(match[0].length), prefix: match[0] };
}
function chapters(content) {
  const doc = parseDocument(content);
  return doc.children.filter(node => node.name === 'section').map(section => ({
    id: section.attribs.id,
    title: DomUtils.textContent((section.children || []).find(node => node.name === 'h2') || section)
  }));
}
function createEnvironment(root) {
  const env = new nunjucks.Environment(new nunjucks.FileSystemLoader(path.join(root, 'src/_includes'), { noCache: true }), { autoescape: true, throwOnUndefined: true });
  env.addFilter('topicById', id => {
    const topic = topics.find(topic => topic.id === id);
    if (!topic) throw new Error('未知专题：' + id);
    return topic;
  });
  env.addFilter('chapters', chapters);
  return env;
}
function renderPage(root, relative, source = fs.readFileSync(path.join(root, 'src', relative), 'utf8')) {
  const { data, content } = parseSource(source);
  const env = createEnvironment(root);
  const dataDirectory = path.join(root, 'src/_data');
  const globalData = {};
  if (fs.existsSync(dataDirectory)) {
    for (const file of fs.readdirSync(dataDirectory).filter(file => file.endsWith('.json'))) {
      globalData[path.basename(file, '.json')] = JSON.parse(fs.readFileSync(path.join(dataDirectory, file), 'utf8'));
    }
  }
  const context = { ...globalData, ...data, topics, bundles, page: { inputPath: path.join(root, 'src', relative) } };
  // HTML bodies are literal, including code examples containing template delimiters.
  context.content = relative.endsWith('.md') ? markdown.render(content) : relative.endsWith('.njk') ? env.renderString(content, context) : content;
  context.markdownSource = relative.endsWith('.md') ? content : '';
  return env.render(data.layout, context);
}
const sourcePath = topic => topic.path.replace(/\.html$/, '.md');
module.exports = { parseSource, chapters, createEnvironment, renderPage, bundles, sourcePath };
