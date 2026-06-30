const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

const MOVE_IDS = [
  "chunk-design", "metadata", "vector-retrieval", "topk-recall", "query-rewrite",
  "rag-hyde", "rerank", "embedding-selection", "vector-dimensions", "similarity-metrics",
  "vector-vs-bm25", "bm25-vs-keyword", "hybrid-search", "pdf-table-rag", "rag-image-handling",
  "image-text-vector-same-db", "incremental-update", "version-conflict", "citations",
  "recall-troubleshooting", "chunk-overlap", "chunk-parent-child", "vector-db-selection",
  "hnsw-vs-ivf", "dense-vs-sparse", "bi-encoder-cross-encoder"
];

const FILTER_BTN =
  '<button class="filter-btn" type="button" data-filter="rag-vector" data-page="rag-vector.html">RAG 向量检索</button>\n          ';

const htmlFiles = fs.readdirSync(ROOT).filter((f) => f.endsWith(".html"));

htmlFiles.forEach((file) => {
  const filePath = path.join(ROOT, file);
  let content = fs.readFileSync(filePath, "utf8");
  if (content.includes("data-page=\"rag-vector.html\"")) {
    return;
  }
  if (!content.includes("data-page=\"ai.html\"")) {
    return;
  }
  content = content.replace(
    /(<button class="filter-btn[^"]*" type="button" data-filter="ai" data-page="ai\.html">AI应用<\/button>\r?\n\s*)(<button class="filter-btn[^"]*" type="button" data-filter="llm")/,
    "$1" + FILTER_BTN + "$2"
  );
  fs.writeFileSync(filePath, content);
  console.log("Updated filter bar:", file);
});

// study.js category remaps
const studyPath = path.join(ROOT, "assets", "study.js");
let study = fs.readFileSync(studyPath, "utf8");

MOVE_IDS.forEach((id) => {
  const re = new RegExp(`("${id.replace(/-/g, "\\-")}": )"ai"`, "g");
  study = study.replace(re, `$1"rag-vector"`);
});

if (!study.includes('"rag-vector": "rag-vector.html"')) {
  study = study.replace(
    'const categoryOrder = ["python", "java", "spring", "mysql", "redis", "rocketmq", "docker-k8s", "ai", "llm"',
    'const categoryOrder = ["python", "java", "spring", "mysql", "redis", "rocketmq", "docker-k8s", "ai", "rag-vector", "llm"'
  );
  study = study.replace(
    '"ai": "ai.html",\n        "llm": "llm.html"',
    '"ai": "ai.html",\n        "rag-vector": "rag-vector.html",\n        "llm": "llm.html"'
  );
  study = study.replace(
    'ai: "AI应用",\n        llm:',
    'ai: "AI应用",\n        "rag-vector": "RAG 向量检索",\n        llm:'
  );
}

// legacy learned key remap
const remapEntries = MOVE_IDS.map((id) => `        "ai:${id}": "rag-vector:${id}"`).join(",\n");
if (!study.includes('"ai:chunk-design": "rag-vector:chunk-design"')) {
  study = study.replace(
    'const LEGACY_STORAGE_KEY_REMAP = {\n        "observability:capacity-planning": "observability:obs-capacity-planning"\n      };',
    `const LEGACY_STORAGE_KEY_REMAP = {\n        "observability:capacity-planning": "observability:obs-capacity-planning",\n${remapEntries}\n      };`
  );
}

// add missing section ids
const missing = ["vector-vs-bm25", "bm25-vs-keyword"];
missing.forEach((id) => {
  if (!study.includes(`"${id}":`)) {
    study = study.replace(
      'const categoryBySection = {',
      `const categoryBySection = {\n        "${id}": "rag-vector",`
    );
  }
});

fs.writeFileSync(studyPath, study);

// legacy question map
const legacyPath = path.join(ROOT, "assets", "study-legacy-map.js");
let legacy = fs.readFileSync(legacyPath, "utf8");
MOVE_IDS.forEach((id) => {
  legacy = legacy.replace(new RegExp(`"ai:${id}"`, "g"), `"rag-vector:${id}"`);
});
fs.writeFileSync(legacyPath, legacy);

// home.js
const homePath = path.join(ROOT, "assets", "home.js");
let home = fs.readFileSync(homePath, "utf8");
if (!home.includes("rag-vector")) {
  home = home.replace(
    'ai: "ai.html",\n    llm:',
    'ai: "ai.html",\n    "rag-vector": "rag-vector.html",\n    llm:'
  );
  fs.writeFileSync(homePath, home);
}

// content-editor.js
const editorPath = path.join(ROOT, "assets", "content-editor.js");
let editor = fs.readFileSync(editorPath, "utf8");
if (!editor.includes("rag-vector")) {
  editor = editor.replace(
    'ai: "ai.html",\n    llm:',
    'ai: "ai.html",\n    "rag-vector": "rag-vector.html",\n    llm:'
  );
  editor = editor.replace(
    'ai: "python",\n      llm:',
    'ai: "python",\n      "rag-vector": "python",\n      llm:'
  );
  fs.writeFileSync(editorPath, editor);
}

// dev-server.js
const serverPath = path.join(ROOT, "scripts", "dev-server.js");
let server = fs.readFileSync(serverPath, "utf8");
if (!server.includes("rag-vector.html")) {
  server = server.replace('"ai.html",\n  "architecture.html"', '"ai.html",\n  "rag-vector.html",\n  "architecture.html"');
  server = server.replace('ai: "ai.html",\n  architecture:', 'ai: "ai.html",\n  "rag-vector": "rag-vector.html",\n  architecture:');
  fs.writeFileSync(serverPath, server);
}

// index.html
const indexPath = path.join(ROOT, "index.html");
let index = fs.readFileSync(indexPath, "utf8");
if (!index.includes("rag-vector.html")) {
  index = index.replace(
    '<a class="home-card" href="ai.html">\n          <h2>AI应用</h2>\n          <p>RAG、向量检索、Rerank、Tool Calling、LangGraph</p>\n        </a>',
    '<a class="home-card" href="ai.html">\n          <h2>AI应用</h2>\n          <p>Agent、MCP、LangGraph、Prompt、评测与生产落地</p>\n        </a>\n        <a class="home-card" href="rag-vector.html">\n          <h2>RAG 向量检索</h2>\n          <p>Chunk、Embedding、向量库、Hybrid、Rerank、数据清洗</p>\n        </a>'
  );
  fs.writeFileSync(indexPath, index);
}

console.log("Config updates complete");
