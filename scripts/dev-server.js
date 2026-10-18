const express = require('express');
const fs = require('node:fs');
const path = require('node:path');
const topics = require('../assets/topics');
const { hash, validateSections, buildIndex, summaryIndex, searchIndex, atomicWrite, writeIndex } = require('./content');
const { parseSource, renderPage } = require('./templates');
const markdownRenderer = require('../assets/markdown');
function createApp(root = path.join(__dirname, '..')) {
  const app = express();
  const allowed = new Set(topics.map(topic => topic.file));
  app.disable('x-powered-by');
  app.use(express.json({ limit: '5mb' }));
  app.get('/api/editor-health', (req, res) => res.json({ ok: true }));
  app.get('/api/stats', (req, res, next) => {
    try { const index = buildIndex(root); res.json({ ok: true, total: index.questions.length, questions: index.questions }); }
    catch (error) { next(error); }
  });
  app.get('/assets/questions-index.json', (req, res, next) => {
    try { res.set('Cache-Control', 'no-store').json(summaryIndex(buildIndex(root))); } catch (error) { next(error); }
  });
  app.get('/assets/search-index.json', (req, res, next) => {
    try { res.set('Cache-Control', 'no-store').json(searchIndex(buildIndex(root))); } catch (error) { next(error); }
  });
  app.get('/developer/:file', (req, res, next) => {
    if (!allowed.has(req.params.file)) return next();
    try {
      const relative = 'developer/' + req.params.file.replace(/\.html$/, '.md');
      const source = fs.readFileSync(path.join(root, 'src', relative), 'utf8');
      const html = renderPage(root, relative, source);
      res.set('Cache-Control', 'no-store').type('html').send(html.replace('</head>', '<meta name="document-version" content="' + hash(source) + '"></head>'));
    } catch (error) { next(error); }
  });
  app.post('/api/save', (req, res, next) => {
    if (!['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress)) return res.status(403).json({ ok: false, error: '编辑服务仅允许本机访问' });
    const origin = req.get('origin');
    if (origin && origin !== 'http://' + req.get('host')) return res.status(403).json({ ok: false, error: '保存请求来源不匹配' });
    const { file, markdown, version } = req.body || {};
    if (!allowed.has(file)) return res.status(400).json({ ok: false, error: '无效的专题文件' });
    if (typeof markdown !== 'string' || !markdown.trim()) return res.status(400).json({ ok: false, error: '没有可保存的 Markdown 题目内容' });
    if (!version) return res.status(428).json({ ok: false, error: '缺少页面版本，请保留草稿并刷新页面' });
    const relative = 'developer/' + file.replace(/\.html$/, '.md');
    const filePath = path.join(root, 'src', relative);
    try {
      if (!fs.existsSync(filePath)) return res.status(404).json({ ok: false, error: '专题文件不存在' });
      const source = fs.readFileSync(filePath, 'utf8');
      if (hash(source) !== version) return res.status(409).json({ ok: false, error: '文件已被其他页面或编辑器修改。请下载草稿，刷新后核对再保存。' });
      try { validateSections(markdownRenderer.render(markdown)); } catch (error) { return res.status(400).json({ ok: false, error: error.message }); }
      const updated = parseSource(source).prefix + markdown.replace(/\r\n/g, '\n').trim() + '\n';
      // Render before modifying the source: a broken layout must not consume the draft.
      const rendered = renderPage(root, relative, updated);
      const backupDir = path.join(root, '.local-backups');
      fs.mkdirSync(backupDir, { recursive: true });
      atomicWrite(path.join(backupDir, file + '.bak'), source);
      atomicWrite(filePath, updated);
      let warning;
      try {
        const output = path.join(root, '_site/developer', file);
        fs.mkdirSync(path.dirname(output), { recursive: true });
        atomicWrite(output, rendered);
        writeIndex(root);
      } catch (_) { warning = '源文件已保存，静态页面或索引更新失败，请运行 npm run build'; }
      res.json({ ok: true, file, version: hash(updated), warning });
    } catch (error) { next(error); }
  });
  app.get('/favicon.ico', (req, res) => res.sendFile(path.join(root, 'assets/favicon.svg')));
  app.get(['/', '/index.html'], (req, res, next) => {
    try { res.set('Cache-Control', 'no-store').type('html').send(renderPage(root, 'index.njk')); } catch (error) { next(error); }
  });
  app.get('/developer/llm-infra-lab/:file', (req, res, next) => {
    if (!/^[a-z0-9_-]+\.html$/.test(req.params.file)) return next();
    const relative = 'developer/llm-infra-lab/' + req.params.file;
    if (!fs.existsSync(path.join(root, 'src', relative))) return next();
    try { res.set('Cache-Control', 'no-store').type('html').send(renderPage(root, relative)); } catch (error) { next(error); }
  });
  app.get(['/reading', '/reading/', '/reading/index.html'], (req, res, next) => {
    if (req.path === '/reading') return res.redirect('/reading/');
    try { res.type('html').send(renderPage(root, 'reading/index.njk')); } catch (error) { next(error); }
  });
  app.get(['/reading/investment-reading', '/reading/investment-reading/', '/reading/investment-reading/index.html'], (req, res, next) => {
    if (req.path === '/reading/investment-reading') return res.redirect('/reading/investment-reading/');
    try { res.set('Cache-Control', 'no-store').type('html').send(renderPage(root, 'reading/investment-reading/index.njk')); } catch (error) { next(error); }
  });
  app.get(['/reading/growth-handbook', '/reading/growth-handbook/', '/reading/growth-handbook/index.html'], (req, res) => {
    if (req.path === '/reading/growth-handbook') return res.redirect('/reading/growth-handbook/');
    res.sendFile(path.join(root, 'src/reading/growth-handbook/index.html'));
  });
  app.use('/assets', express.static(path.join(root, 'assets'), { dotfiles: 'deny' }));
  app.use((error, req, res, next) => {
    const status = error.type === 'entity.too.large' ? 413 : error instanceof SyntaxError ? 400 : 500;
    res.status(status).json({ ok: false, error: status === 413 ? '内容超过 5MB 保存限制' : status === 400 ? '请求内容不是有效 JSON' : '服务读取或写入失败，请保留草稿后重试' });
  });
  return app;
}
if (require.main === module) {
  const root = path.join(__dirname, '..');
  const port = Number(process.env.PORT) || 3000;
  require('./build').build(root).then(() => {
    createApp(root).listen(port, '127.0.0.1', () => console.log('Interview editor: http://localhost:' + port));
  }).catch(error => { console.error(error); process.exitCode = 1; });
}
module.exports = { createApp };
