const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const aiHtml = fs.readFileSync(path.join(ROOT, "ai.html"), "utf8");

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

const sectionRegex = /<section id="([^"]+)">([\s\S]*?)<\/section>/g;
const sections = {};
let match;
while ((match = sectionRegex.exec(aiHtml)) !== null) {
  sections[match[1]] = match[0];
}

const missing = MOVE_IDS.filter((id) => !sections[id]);
if (missing.length) {
  console.error("Missing sections:", missing);
  process.exit(1);
}

const movedContent = MOVE_IDS.map((id) => sections[id]).join("\n\n");

const langchainHtml = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
  <title>LangChain / LangGraph 高频问题整理</title>
  <link rel="stylesheet" href="assets/highlight-theme.css">
  <link rel="stylesheet" href="assets/styles.css">
  <link rel="stylesheet" href="assets/editor.css">
</head>
<body data-category="langchain">
  <div class="layout">
    <aside>
      <a class="home-link" href="index.html">返回首页</a>
<div id="categoryStats" class="category-stats"></div>
      <details class="toc-group active" data-filter="langchain" open>
        <summary>LangChain / LangGraph</summary>
      </details>
    </aside>

    <main>
      <div class="study-tools" aria-label="学习工具">
        <div class="tool-row">
          <div class="search-wrap">
            <input id="searchInput" class="search-box" type="search" placeholder="当前主题搜索关键词" autocomplete="off">
            <div id="searchSuggestions" class="search-suggestions" role="listbox"></div>
          </div>
          <button id="compactBtn" class="tool-btn" type="button">核心速览</button>
          <button id="darkBtn" class="tool-btn" type="button">深色模式</button>
        </div>
        <div class="tool-row" id="filterBar">
          <button class="filter-btn" type="button" data-filter="python" data-page="python.html">Python</button>
          <button class="filter-btn" type="button" data-filter="java" data-page="java.html">Java / JVM</button>
          <button class="filter-btn" type="button" data-filter="spring" data-page="spring.html">Spring Boot</button>
          <button class="filter-btn" type="button" data-filter="mysql" data-page="mysql.html">MySQL</button>
          <button class="filter-btn" type="button" data-filter="redis" data-page="redis.html">Redis</button>
          <button class="filter-btn" type="button" data-filter="rocketmq" data-page="rocketmq.html">RocketMQ</button>
          <button class="filter-btn" type="button" data-filter="docker-k8s" data-page="docker-k8s.html">Docker / K8S</button>
          <button class="filter-btn" type="button" data-filter="ai" data-page="ai.html">AI应用</button>
          <button class="filter-btn" type="button" data-filter="rag-vector" data-page="rag-vector.html">RAG 向量检索</button>
          <button class="filter-btn active" type="button" data-filter="langchain" data-page="langchain.html">LangChain / LangGraph</button>
          <button class="filter-btn" type="button" data-filter="llm" data-page="llm.html">大模型 / 推理与微调</button>
          <button class="filter-btn" type="button" data-filter="architecture" data-page="architecture.html">网关 / 架构</button>
          <button class="filter-btn" type="button" data-filter="observability" data-page="observability.html">可观测性</button>
          <button class="filter-btn" type="button" data-filter="security" data-page="security.html">安全 / 鉴权</button>
          <button class="filter-btn" type="button" data-filter="leetcode" data-page="leetcode.html">算法 LeetCode</button>
          <span id="studyStats" class="study-stats"></span>
        </div>
      </div>

      <div id="emptyState" class="study-empty">没有找到匹配的问题，换个关键词试试。</div>

${movedContent}
</main>
  </div>
  <script src="assets/highlight.min.js"></script>
  <script src="assets/study-legacy-map.js"></script>
  <script src="assets/study.js"></script>
  <script src="assets/code-highlight.js"></script>
  <script src="assets/html-serializer.js"></script>
  <script src="assets/content-editor.js"></script>
</body>
</html>
`;

fs.writeFileSync(path.join(ROOT, "langchain.html"), langchainHtml);

let updatedAi = aiHtml;
MOVE_IDS.forEach((id) => {
  updatedAi = updatedAi.replace(sections[id] + "\n\n", "");
  updatedAi = updatedAi.replace(sections[id], "");
});

fs.writeFileSync(path.join(ROOT, "ai.html"), updatedAi);

console.log("Created langchain.html with", MOVE_IDS.length, "sections");
console.log("Removed sections from ai.html");
