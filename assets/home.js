(function () {
  const LEARNED_STORAGE_KEY = "study-learned-v2";
  const LEGACY_STORAGE_KEY_REMAP = {
    "observability:capacity-planning": "observability:obs-capacity-planning"
  };

  const CATEGORY_PAGES = {
    python: "python.html",
    java: "java.html",
    spring: "spring.html",
    mysql: "mysql.html",
    redis: "redis.html",
    rocketmq: "rocketmq.html",
    "docker-k8s": "docker-k8s.html",
    ai: "ai.html",
    "rag-vector": "rag-vector.html",
    llm: "llm.html",
    architecture: "architecture.html",
    observability: "observability.html",
    security: "security.html",
    leetcode: "leetcode.html"
  };

  const statsEl = document.getElementById("homeStats");
  if (!statsEl) {
    return;
  }

  function stripHtml(text) {
    return text.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  }

  function getLegacyQuestionMap() {
    return window.__STUDY_LEGACY_QUESTION_MAP || {};
  }

  function questionStorageKey(question) {
    const legacyMap = getLegacyQuestionMap();
    if (legacyMap[question.id]) {
      return legacyMap[question.id];
    }
    return question.category + ":" + question.id;
  }

  function loadLearnedState() {
    try {
      const saved = localStorage.getItem(LEARNED_STORAGE_KEY);
      if (!saved) {
        return {};
      }
      const parsed = JSON.parse(saved);
      if (!parsed || typeof parsed !== "object") {
        return {};
      }
      const out = {};
      Object.keys(parsed).forEach(function (key) {
        if (!parsed[key]) {
          return;
        }
        const mapped = LEGACY_STORAGE_KEY_REMAP[key] || key;
        if (mapped.indexOf(":") !== -1) {
          out[mapped] = true;
        }
      });
      return out;
    } catch (error) {
      return {};
    }
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

  async function fetchQuestionsFromPages() {
    const entries = Object.entries(CATEGORY_PAGES);
    const results = await Promise.all(entries.map(async function (entry) {
      const category = entry[0];
      const file = entry[1];
      const response = await fetch(file, { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Failed to load " + file);
      }
      const html = await response.text();
      return collectQuestionsFromHtml(html, category);
    }));

    return results.flat();
  }

  async function fetchQuestions() {
    try {
      const response = await fetch("/api/stats", { cache: "no-store" });
      if (response.ok) {
        const payload = await response.json();
        if (payload && payload.ok && Array.isArray(payload.questions)) {
          return payload.questions;
        }
      }
    } catch (error) {
      /* fallback below */
    }
    return fetchQuestionsFromPages();
  }

  function countLearned(questions) {
    const learned = loadLearnedState();
    let total = 0;
    questions.forEach(function (question) {
      if (learned[questionStorageKey(question)]) {
        total += 1;
      }
    });
    return total;
  }

  function renderStats(total, learned) {
    statsEl.innerHTML =
      '<span class="home-stat"><span>总计题目</span><strong>' + total + " 题</strong></span>" +
      '<span class="home-stat"><span>已学习</span><strong>' + learned + " 题</strong></span>";
  }

  fetchQuestions()
    .then(function (questions) {
      renderStats(questions.length, countLearned(questions));
    })
    .catch(function () {
      statsEl.innerHTML = '<span class="home-stat home-stat-muted">统计加载失败</span>';
    });
})();
