const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

const MOVE_IDS = [
  "langchain-structure",
  "langchain-build-flow",
  "langchain-vs-langgraph",
  "langgraph-node",
  "langgraph-edge",
  "langgraph-state",
  "langgraph-builder",
  "infinite-loop",
  "state-persistence",
  "hitl"
];

const FILTER_BTN =
  '<button class="filter-btn" type="button" data-filter="langchain" data-page="langchain.html">LangChain / LangGraph</button>\n          ';

const htmlFiles = fs.readdirSync(ROOT).filter((f) => f.endsWith(".html"));

htmlFiles.forEach((file) => {
  const filePath = path.join(ROOT, file);
  let content = fs.readFileSync(filePath, "utf8");
  if (content.includes('data-page="langchain.html"')) {
    return;
  }
  if (!content.includes('data-page="rag-vector.html"')) {
    return;
  }
  content = content.replace(
    /(<button class="filter-btn[^"]*" type="button" data-filter="rag-vector" data-page="rag-vector\.html">RAG 向量检索<\/button>\r?\n\s*)(<button class="filter-btn[^"]*" type="button" data-filter="llm")/,
    "$1" + FILTER_BTN + "$2"
  );
  fs.writeFileSync(filePath, content);
  console.log("Updated filter bar:", file);
});

const studyPath = path.join(ROOT, "assets", "study.js");
let study = fs.readFileSync(studyPath, "utf8");

MOVE_IDS.forEach((id) => {
  const re = new RegExp(`("${id.replace(/-/g, "\\-")}": )"ai"`, "g");
  study = study.replace(re, `$1"langchain"`);
});

if (!study.includes('"langchain": "langchain.html"')) {
  study = study.replace(
    'const categoryOrder = ["python", "java", "spring", "mysql", "redis", "rocketmq", "docker-k8s", "ai", "rag-vector", "llm"',
    'const categoryOrder = ["python", "java", "spring", "mysql", "redis", "rocketmq", "docker-k8s", "ai", "rag-vector", "langchain", "llm"'
  );
  study = study.replace(
    '"rag-vector": "rag-vector.html",\n        "llm": "llm.html"',
    '"rag-vector": "rag-vector.html",\n        "langchain": "langchain.html",\n        "llm": "llm.html"'
  );
  study = study.replace(
    '"rag-vector": "RAG 向量检索",\n        llm:',
    '"rag-vector": "RAG 向量检索",\n        langchain: "LangChain / LangGraph",\n        llm:'
  );
}

const remapEntries = MOVE_IDS.map((id) => `        "ai:${id}": "langchain:${id}"`).join(",\n");
if (!study.includes('"ai:langchain-structure": "langchain:langchain-structure"')) {
  study = study.replace(
    '"ai:bi-encoder-cross-encoder": "rag-vector:bi-encoder-cross-encoder"\n      };',
    `"ai:bi-encoder-cross-encoder": "rag-vector:bi-encoder-cross-encoder",\n${remapEntries}\n      };`
  );
}

fs.writeFileSync(studyPath, study);

const legacyPath = path.join(ROOT, "assets", "study-legacy-map.js");
let legacy = fs.readFileSync(legacyPath, "utf8");
MOVE_IDS.forEach((id) => {
  legacy = legacy.replace(new RegExp(`"ai:${id}"`, "g"), `"langchain:${id}"`);
});
fs.writeFileSync(legacyPath, legacy);

const homePath = path.join(ROOT, "assets", "home.js");
let home = fs.readFileSync(homePath, "utf8");
if (!home.includes("langchain")) {
  home = home.replace(
    '"rag-vector": "rag-vector.html",\n    llm:',
    '"rag-vector": "rag-vector.html",\n    langchain: "langchain.html",\n    llm:'
  );
  fs.writeFileSync(homePath, home);
}

const editorPath = path.join(ROOT, "assets", "content-editor.js");
let editor = fs.readFileSync(editorPath, "utf8");
if (!editor.includes("langchain")) {
  editor = editor.replace(
    '"rag-vector": "rag-vector.html",\n    llm:',
    '"rag-vector": "rag-vector.html",\n    langchain: "langchain.html",\n    llm:'
  );
  editor = editor.replace(
    '"rag-vector": "python",\n      llm:',
    '"rag-vector": "python",\n      langchain: "python",\n      llm:'
  );
  fs.writeFileSync(editorPath, editor);
}

const serverPath = path.join(ROOT, "scripts", "dev-server.js");
let server = fs.readFileSync(serverPath, "utf8");
if (!server.includes("langchain.html")) {
  server = server.replace(
    '"rag-vector.html",\n  "architecture.html"',
    '"rag-vector.html",\n  "langchain.html",\n  "architecture.html"'
  );
  server = server.replace(
    '"rag-vector": "rag-vector.html",\n  architecture:',
    '"rag-vector": "rag-vector.html",\n  langchain: "langchain.html",\n  architecture:'
  );
  fs.writeFileSync(serverPath, server);
}

const indexPath = path.join(ROOT, "index.html");
let index = fs.readFileSync(indexPath, "utf8");
if (!index.includes("langchain.html")) {
  index = index.replace(
    '<a class="home-card" href="ai.html">\n          <h2>AI应用</h2>\n          <p>Agent、MCP、LangGraph、Prompt、评测与生产落地</p>\n        </a>',
    '<a class="home-card" href="ai.html">\n          <h2>AI应用</h2>\n          <p>Agent、MCP、Prompt、评测与生产落地</p>\n        </a>'
  );
  index = index.replace(
    '<a class="home-card" href="rag-vector.html">\n          <h2>RAG 向量检索</h2>\n          <p>Chunk、Embedding、向量库、Hybrid、Rerank、数据清洗</p>\n        </a>',
    '<a class="home-card" href="rag-vector.html">\n          <h2>RAG 向量检索</h2>\n          <p>Chunk、Embedding、向量库、Hybrid、Rerank、数据清洗</p>\n        </a>\n        <a class="home-card" href="langchain.html">\n          <h2>LangChain / LangGraph</h2>\n          <p>Chain、Agent、LCEL、Node、Edge、State、Checkpointer</p>\n        </a>'
  );
  fs.writeFileSync(indexPath, index);
}

const stylesPath = path.join(ROOT, "assets", "styles.css");
let styles = fs.readFileSync(stylesPath, "utf8");
if (!styles.includes('data-filter="langchain"')) {
  styles = styles.replace(
    '.filter-btn[data-filter="rag-vector"] { --filter-color: #2563eb; }\n    .filter-btn[data-filter="llm"]',
    '.filter-btn[data-filter="rag-vector"] { --filter-color: #2563eb; }\n    .filter-btn[data-filter="langchain"] { --filter-color: #059669; }\n    .filter-btn[data-filter="llm"]'
  );
  fs.writeFileSync(stylesPath, styles);
}

console.log("Config updates complete");
