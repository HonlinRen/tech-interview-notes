const topics = require('./assets/topics');
const { createEnvironment, bundles } = require('./scripts/templates');

module.exports = function (config) {
  config.setLibrary('njk', createEnvironment(__dirname));
  config.setLibrary('md', { render: require('./assets/markdown').render });
  config.addGlobalData('topics', topics);
  config.addGlobalData('bundles', bundles);
  config.addGlobalData('eleventyComputed', { markdownSource: data => data.page.inputPath.endsWith('.md') ? require('./scripts/templates').parseSource(require('node:fs').readFileSync(data.page.inputPath, 'utf8')).content : '' });
  config.addPassthroughCopy({ assets: 'assets' });
  return {
    dir: { input: 'src', includes: '_includes', output: '_site' },
    templateFormats: ['html', 'njk', 'md'],
    htmlTemplateEngine: false,
    markdownTemplateEngine: false
  };
};
