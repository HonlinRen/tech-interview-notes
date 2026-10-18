const path = require('node:path');
const fs = require('node:fs');
const { writeIndex } = require('./content');

async function build(root = path.join(__dirname, '..')) {
  root = fs.realpathSync(root);
  const output = path.resolve(root, '_site');
  if (path.relative(root, output) !== '_site') throw new Error('无效的构建输出路径');
  if (fs.existsSync(output)) {
    if (fs.lstatSync(output).isSymbolicLink() || path.dirname(fs.realpathSync(output)) !== root) throw new Error('构建输出目录不能是外部链接');
    fs.rmSync(output, { recursive: true, force: true });
  }
  const { default: Eleventy } = await import('@11ty/eleventy');
  const site = new Eleventy(path.join(root, 'src'), output, {
    configPath: path.join(root, 'eleventy.config.cjs'), quietMode: true
  });
  await site.write();
  const index = writeIndex(root);
  fs.writeFileSync(path.join(root, '_site/.nojekyll'), '');
  console.log('已生成静态站点 _site/：' + index.questions.length + ' 道题');
}
if (require.main === module) build().catch(error => { console.error(error); process.exitCode = 1; });
module.exports = { build };
