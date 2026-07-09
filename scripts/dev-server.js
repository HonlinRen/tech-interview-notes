const express = require("express");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const DEVELOPER_DIR = path.join(ROOT, "developer");
const PORT = Number(process.env.PORT) || 3000;

const ALLOWED_FILES = new Set([
  "python.html",
  "java.html",
  "spring.html",
  "mysql.html",
  "redis.html",
  "rocketmq.html",
  "docker-k8s.html",
  "ai.html",
  "rag-vector.html",
  "langchain.html",
  "architecture.html",
  "observability.html",
  "security.html",
  "llm.html",
  "leetcode.html",
  "frontend.html",
  "bigdata.html"
]);

const CATEGORY_TO_FILE = {
  python: "python.html",
  java: "java.html",
  spring: "spring.html",
  mysql: "mysql.html",
  redis: "redis.html",
  rocketmq: "rocketmq.html",
  "docker-k8s": "docker-k8s.html",
  ai: "ai.html",
  "rag-vector": "rag-vector.html",
  langchain: "langchain.html",
  architecture: "architecture.html",
  observability: "observability.html",
  security: "security.html",
  llm: "llm.html",
  leetcode: "leetcode.html",
  frontend: "frontend.html",
  bigdata: "bigdata.html"
};

function stripHtml(text) {
  return text.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function collectQuestionsFromHtml(html, category) {
  const questions = [];
  const mainMatch = html.match(/<main>([\s\S]*?)<\/main>/i);
  if (!mainMatch) {
    return questions;
  }

  const sectionRegex = /<section\s+id="([^"]+)"[^>]*>([\s\S]*?)<\/section>/gi;
  let match;
  while ((match = sectionRegex.exec(mainMatch[1])) !== null) {
    const id = match[1];
    if (id === "summary") {
      continue;
    }

    const inner = match[2];
    const h2Match = inner.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
    if (!h2Match) {
      continue;
    }

    const title = stripHtml(h2Match[1]);
    if (/^\d+-\d+\./.test(title)) {
      continue;
    }

    questions.push({ id: id, category: category });
  }

  return questions;
}

function buildStudyStats() {
  const questions = [];
  Object.keys(CATEGORY_TO_FILE).forEach(function (category) {
    const file = CATEGORY_TO_FILE[category];
    const filePath = path.join(DEVELOPER_DIR, file);
    if (!fs.existsSync(filePath)) {
      return;
    }
    const html = fs.readFileSync(filePath, "utf8");
    questions.push.apply(questions, collectQuestionsFromHtml(html, category));
  });
  return questions;
}

const app = express();
app.use(express.json({ limit: "20mb" }));

app.get("/api/editor-health", function (req, res) {
  res.json({ ok: true });
});

app.get("/api/stats", function (req, res) {
  try {
    const questions = buildStudyStats();
    res.json({
      ok: true,
      total: questions.length,
      questions: questions
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message || "Stats failed" });
  }
});

app.get("/favicon.ico", function (req, res) {
  res.type("image/svg+xml");
  res.sendFile(path.join(ROOT, "assets", "favicon.svg"));
});

app.post("/api/save", function (req, res) {
  try {
    const file = req.body && req.body.file;
    const sections = req.body && req.body.sections;

    if (!file || typeof file !== "string" || !ALLOWED_FILES.has(file)) {
      res.status(400).json({ ok: false, error: "Invalid file: " + String(file) });
      return;
    }

    if (!sections || typeof sections !== "string") {
      res.status(400).json({ ok: false, error: "Missing sections HTML" });
      return;
    }

    const filePath = path.join(DEVELOPER_DIR, file);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ ok: false, error: "File not found: " + file });
      return;
    }

    let html = fs.readFileSync(filePath, "utf8");
    const mainMatch = html.match(/<main>([\s\S]*?)<\/main>/i);
    if (!mainMatch) {
      res.status(400).json({ ok: false, error: "No <main> found" });
      return;
    }

    const mainInner = mainMatch[1];
    const emptyStateMatch = mainInner.match(/([\s\S]*?<div id="emptyState"[^>]*>[\s\S]*?<\/div>)/i);
    if (!emptyStateMatch) {
      res.status(400).json({ ok: false, error: "No emptyState div found" });
      return;
    }

    const prefix = emptyStateMatch[1];
    const trimmedSections = sections.replace(/^\s+|\s+$/g, "");
    const newMainInner = prefix + "\n\n" + trimmedSections + "\n";
    html = html.replace(/<main>[\s\S]*?<\/main>/i, "<main>" + newMainInner + "</main>");

    fs.writeFileSync(filePath, html, "utf8");
    res.json({ ok: true, file: file });
  } catch (error) {
    console.error("[save]", error);
    res.status(500).json({ ok: false, error: error.message || "Server write failed" });
  }
});

app.use(express.static(ROOT));

app.listen(PORT, function () {
  console.log("Interview editor dev server: http://localhost:" + PORT);
});
