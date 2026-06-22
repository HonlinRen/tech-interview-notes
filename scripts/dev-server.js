const express = require("express");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
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
  "architecture.html",
  "observability.html",
  "security.html"
]);

const app = express();
app.use(express.json({ limit: "20mb" }));

app.post("/api/save", function (req, res) {
  const file = req.body && req.body.file;
  const sections = req.body && req.body.sections;

  if (!file || typeof file !== "string" || !ALLOWED_FILES.has(file)) {
    res.status(400).json({ ok: false, error: "Invalid file" });
    return;
  }

  if (!sections || typeof sections !== "string") {
    res.status(400).json({ ok: false, error: "Missing sections HTML" });
    return;
  }

  const filePath = path.join(ROOT, file);
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ ok: false, error: "File not found" });
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
  res.json({ ok: true });
});

app.use(express.static(ROOT));

app.listen(PORT, function () {
  console.log("Interview editor dev server: http://localhost:" + PORT);
});
