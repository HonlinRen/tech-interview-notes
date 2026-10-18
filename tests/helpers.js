const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");
const projectRoot = path.join(__dirname, '..');
const root = path.join(projectRoot, '_site');
function page(file, options = {}) {
  const dom = new JSDOM(fs.readFileSync(path.join(root, file), "utf8"), { url: "http://localhost:3000/" + file + (options.hash || ""), runScripts: "outside-only", pretendToBeVisual: true });
  const w = dom.window;
  w.matchMedia = query => ({ matches: Boolean(options.mobile), media: query, addEventListener() {}, removeEventListener() {} });
  w.HTMLElement.prototype.scrollIntoView = function () { w.__scrolled = this.id; };
  w.scrollTo = () => {};
  w.confirm = () => true;
  w.__requests = [];
  w.fetch = async url => {
    w.__requests.push(url);
    return { ok: true, json: async () => url.includes("editor-health") ? { ok: true } : JSON.parse(fs.readFileSync(path.join(root, url.includes("search-index") ? "assets/search-index.json" : "assets/questions-index.json"))) };
  };
  if (options.before) options.before(w);
  for (const script of w.document.querySelectorAll("script[src]")) {
    const filePath = path.resolve(path.dirname(path.join(root, file)), script.getAttribute("src"));
    w.eval(fs.readFileSync(filePath, "utf8"));
  }
  return dom;
}
module.exports = { root, projectRoot, page };
