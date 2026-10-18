(function () {
      let requestedHash = '';
      try { requestedHash = decodeURIComponent(location.hash.slice(1)); } catch (_) { /* Keep the page usable for malformed external links. */ }
      const redirected = window.StudyQuestionRedirects?.[document.body.dataset.category + ':' + requestedHash];
      if (redirected) {
        const [category, id] = redirected.split(':');
        const topic = window.StudyTopics.find(t => t.id === category);
        if (category === document.body.dataset.category) history.replaceState(null, '', '#' + id);
        else { location.replace(topic.file + '#' + id); return; }
      }
      const categoryBySection = window.StudyMigrations.byId;
      const localStorage = window.StudyStore.storage;

      const categoryOrder = window.StudyTopics.map(t => t.id);
      const categoryPages = Object.fromEntries(window.StudyTopics.map(t => [t.id, t.file]));
      const categoryLabels = Object.fromEntries(window.StudyTopics.map(t => [t.id, t.label]));

      const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);
      function questionStorageKey(question) { return window.StudyStore.key(question); }
      function isQuestionLearned(question) { return window.StudyStore.status(questionStorageKey(question)) === "mastered"; }
      function setQuestionLearned(question, learned) {
        window.StudyStore.setStatus(questionStorageKey(question), learned ? "mastered" : "new");
        state.learned = window.StudyStore.learned();
      }
      function loadLearnedState() { return window.StudyStore.learned(); }
      function applyPageScopedMigration() { /* Shared store migrates on read. */ }

      const state = {
        filter: document.body.dataset.category || "python",
        query: "",
        questions: [],
        learned: loadLearnedState()
      };

      const searchInput = document.getElementById("searchInput");
      const searchSuggestions = document.getElementById("searchSuggestions");
      const emptyState = document.getElementById("emptyState");
      const studyStats = document.getElementById("studyStats");
      const categoryStats = document.getElementById("categoryStats");
      const compactBtn = document.getElementById("compactBtn");
      const darkBtn = document.getElementById("darkBtn");
      const currentCategory = document.body.dataset.category || state.filter;

      function normalize(text) {
        return text.toLowerCase().replace(/\s+/g, " ").trim();
      }

      function escapeHtml(text) {
        return text
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");
      }

      function stripNumber(title) {
        return title.replace(/^\d+(?:-\d+)?\.\s*/, "");
      }

      function saveLearnedState() { state.learned = window.StudyStore.learned(); }

      function rememberQuestion(question) {
        if (!question) {
          return;
        }
        localStorage.setItem("study-current-question", questionStorageKey(question));
        localStorage.setItem("study-current-category", question.category);
      }

      function updateLearnedVisual(question) {
        const learned = isQuestionLearned(question);
        question.container.classList.toggle("learned", learned);
        if (question.learnedButton) {
          question.learnedButton.classList.toggle("learned", learned);
          question.learnedButton.setAttribute("aria-pressed", learned ? "true" : "false");
          question.learnedButton.title = learned ? "取消已掌握" : "标记已掌握";
          question.learnedButton.setAttribute("aria-label", question.learnedButton.title);
        }
        if (question.tocLink) {
          question.tocLink.classList.toggle("learned", learned);
        }
      }

      function getCurrentPageFile() {
        const fromPath = window.location.pathname.split("/").filter(Boolean).pop() || "";
        if (Object.values(categoryPages).includes(fromPath)) {
          return fromPath;
        }
        if (currentCategory && categoryPages[currentCategory]) {
          return categoryPages[currentCategory];
        }
        return fromPath;
      }

      function createLearnedButton(question) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "learned-btn";
        button.textContent = "\u2713";
        button.setAttribute("aria-label", "标记已学习");
        button.addEventListener("click", function (event) {
          event.stopPropagation();
          rememberQuestion(question);
          setQuestionLearned(question, !isQuestionLearned(question));
          saveLearnedState();
          updateLearnedVisual(question);
          updateStats();
          renderCategoryStats();
        });
        question.learnedButton = button;
        return button;
      }

      function createQuestionActions() {
        const actions = document.createElement('div'); actions.className = 'question-actions'; return actions;
      }

      function enhanceQuestion(section) {
        const h2 = section.querySelector(":scope > .question-heading h2, :scope > h2");
        if (!h2) {
          return null;
        }
        const titleText = h2.textContent.trim();
        if (/^\d+-\d+\./.test(titleText)) {
          return null;
        }

        section.classList.add("question-card");
        const heading = document.createElement("div");
        heading.className = "question-heading";
        section.insertBefore(heading, h2);
        heading.appendChild(h2);

        const answer = document.createElement("div");
        answer.className = "answer";
        while (heading.nextSibling) {
          answer.appendChild(heading.nextSibling);
        }
        section.appendChild(answer);

        const question = {
          id: section.id,
          titleElement: h2,
          originalTitle: h2.textContent.trim(),
          category: currentCategory,
          container: section,
          parentSection: section,
          text: normalize(section.textContent)
        };
        heading.appendChild(createQuestionActions(question));
        section.addEventListener("click", function () {
          rememberQuestion(question);
        });
        updateLearnedVisual(question);
        return question;
      }

      function buildQuestions() {
        document.querySelectorAll("main > section").forEach(function (section) {
          if (section.id === "summary") {
            return;
          }
          const question = enhanceQuestion(section);
          if (question) {
            state.questions.push(question);
          }
        });
      }

      function renumberQuestions() {
        const counters = Object.fromEntries(categoryOrder.map(function (category) {
          return [category, 0];
        }));

        state.questions.forEach(function (question) {
          counters[question.category] += 1;
          const cleanTitle = stripNumber(question.originalTitle);
          question.displayNumber = counters[question.category];
          question.titleElement.textContent = question.displayNumber + ". " + cleanTitle;
        });
      }

      function getTocLinksContainer(group) {
        let container = group.querySelector(".toc-links");
        if (!container) {
          container = document.createElement("div");
          container.className = "toc-links";
          group.appendChild(container);
        }
        Array.from(group.querySelectorAll(":scope > a")).forEach(function (link) {
          container.appendChild(link);
        });
        return container;
      }

      function renderToc() {
        document.querySelectorAll(".toc-group").forEach(function (group) {
          const category = group.dataset.filter;
          const linksContainer = getTocLinksContainer(group);
          const openLabels = new Set([...linksContainer.querySelectorAll(".toc-subgroup[open] > summary")].map(summary => summary.textContent));
          linksContainer.replaceChildren();
          const groups = new Map();
          state.questions
            .filter(function (question) {
              return question.category === category;
            })
            .forEach(function (question) {
              const link = document.createElement("a");
              link.href = "#" + question.id;
              link.textContent = question.titleElement.textContent;
              link.classList.toggle("learned", isQuestionLearned(question));
              question.tocLink = link;
              const label = window.StudyReadingGroups.label(category, question.id);
              if (!groups.has(label)) {
                const subgroup = document.createElement("details"); subgroup.className = "toc-subgroup"; subgroup.open = openLabels.has(label) || groups.size === 0;
                const summary = document.createElement("summary"); summary.textContent = label; subgroup.append(summary);
                const list = document.createElement("div"); list.className = "toc-subgroup-links"; subgroup.append(list);
                groups.set(label, list); linksContainer.append(subgroup);
              }
              groups.get(label).appendChild(link);
            });
        });
        window.dispatchEvent(new Event("study-toc-updated"));
      }

      function applyFilter() {
        const query = normalize(state.query);
        let visible = 0;

        state.questions.forEach(function (question) {
          const categoryOk = query ? true : question.category === state.filter;
          const queryOk = !query || question.text.includes(query);
          const show = categoryOk && queryOk;
          question.container.style.display = show ? "" : "none";
          if (show) {
            visible += 1;
          }
        });

        emptyState.classList.toggle("show", visible === 0);
        updateStats(visible);
      }

      function updateStats(visibleCount) {
        if (studyStats) {
          studyStats.textContent = "";
        }
      }

      function getSearchMatches() {
        const query = normalize(state.query);
        if (!query) {
          return [];
        }
        return state.questions.filter(function (question) {
          return question.text.includes(query);
        });
      }

      function renderSearchSuggestions() {
        const matches = getSearchMatches().slice(0, 12);
        searchSuggestions._matches = matches;

        if (!state.query.trim()) {
          searchSuggestions.classList.remove("show");
          searchSuggestions.innerHTML = "";
          return;
        }

        if (!matches.length) {
          searchSuggestions.innerHTML = '<div class="search-suggestion-empty">没有匹配题目</div>';
          searchSuggestions.classList.add("show");
          return;
        }

        searchSuggestions.innerHTML = matches.map(function (question, index) {
          const title = escapeHtml(question.titleElement.textContent);
          const category = escapeHtml(categoryLabels[question.category] || question.category);
          return '<button class="search-suggestion" type="button" role="option" data-question-index="' + index + '">'
            + '<span class="suggestion-title">' + title + '</span>'
            + '<span class="suggestion-category">' + category + '</span>'
            + '</button>';
        }).join("");
        searchSuggestions._matches = matches;
        searchSuggestions.classList.add("show");
      }

      function jumpToQuestion(question) {
        rememberQuestion(question);
        state.query = "";
        searchInput.value = "";
        searchSuggestions.classList.remove("show");
        searchSuggestions.innerHTML = "";
        setFilter(question.category);
        requestAnimationFrame(function () {
          question.container.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
          question.container.classList.add("search-hit");
          window.setTimeout(function () {
            question.container.classList.remove("search-hit");
          }, 1400);
        });
      }

      function restoreEditorScroll() {
        const raw = sessionStorage.getItem("editor-scroll-restore");
        if (!raw) {
          return false;
        }
        sessionStorage.removeItem("editor-scroll-restore");
        try {
          const data = JSON.parse(raw);
          requestAnimationFrame(function () {
            window.scrollTo(0, data.scrollY || 0);
          });
          return true;
        } catch (error) {
          return false;
        }
      }

      function restoreLastQuestion() {
        if (window.location.hash) {
          let id;
          try { id = decodeURIComponent(window.location.hash.slice(1)); } catch (_) { return; }
          const target = state.questions.find(q => q.id === id);
          if (target) { jumpToQuestion(target); return; }
          // A non-question fragment (such as a removed question's page entry)
          // still takes precedence over the last reading position.
          setFilter(currentCategory); return;
        }
        let savedKey = localStorage.getItem("study-current-question");
        const visited = new Set();
        while (window.StudyMigrations.remap[savedKey] && !visited.has(savedKey)) {
          visited.add(savedKey); savedKey = window.StudyMigrations.remap[savedKey];
        }
        const question = state.questions.find(function (item) {
          return questionStorageKey(item) === savedKey || item.id === savedKey;
        });

        if (!question) {
          setFilter(currentCategory);
          return;
        }

        setFilter(question.category);
        requestAnimationFrame(function () {
          question.container.scrollIntoView({ behavior: "auto", block: "start" });
          question.container.classList.add("search-hit");
          window.setTimeout(function () {
            question.container.classList.remove("search-hit");
          }, 1000);
        });
      }

      function renderCategoryStats() {
        const pageQuestions = state.questions.filter(function (question) {
          return question.category === currentCategory;
        });
        const total = pageQuestions.length;
        const learnedTotal = pageQuestions.filter(function (question) {
          return isQuestionLearned(question);
        }).length;
        const label = categoryLabels[currentCategory] || currentCategory;
        categoryStats.innerHTML = '<span class="category-stat"><span>' + label + '</span><strong>' + total + ' 题 / 已掌握 ' + learnedTotal + ' 题</strong></span>';

        document.querySelectorAll(".toc-count").forEach(function (count) {
          count.remove();
        });
      }

      function setFilter(filter) {
        if (filter !== currentCategory && categoryPages[filter]) {
          window.location.href = categoryPages[filter];
          return;
        }
        state.filter = filter;
        document.querySelectorAll(".filter-btn").forEach(function (button) {
          button.classList.toggle("active", button.dataset.filter === filter);
        });
        document.querySelectorAll(".toc-group").forEach(function (group) {
          group.classList.toggle("active", group.dataset.filter === filter);
        });
        applyFilter();
      }

      window.addEventListener("study-progress", function () {
        state.learned = loadLearnedState();
        state.questions.forEach(updateLearnedVisual);
        renderCategoryStats();
      });
      window.addEventListener("hashchange", restoreLastQuestion);
      buildQuestions();
      renumberQuestions();
      renderToc();
      renderCategoryStats();
      applyPageScopedMigration();

      searchInput.setAttribute("aria-label", "搜索当前专题题目");
      searchInput.setAttribute("aria-controls", "searchSuggestions");
      document.getElementById("topicSelect").addEventListener("change", function (event) {
        localStorage.setItem("study-current-category", event.target.value);
        localStorage.removeItem("study-current-question");
        setFilter(event.target.value);
      });
      searchSuggestions.addEventListener("keydown", function (event) {
        const options = Array.from(searchSuggestions.querySelectorAll("button"));
        const index = options.indexOf(document.activeElement);
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          options[(index + (event.key === "ArrowDown" ? 1 : -1) + options.length) % options.length]?.focus();
        }
        if (event.key === "Escape") { searchInput.focus(); searchSuggestions.classList.remove("show"); }
      });
      searchInput.addEventListener("input", function () {
          state.query = searchInput.value;
          applyFilter();
          renderSearchSuggestions();
        });

        searchInput.addEventListener("focus", function () {
          renderSearchSuggestions();
        });

        searchInput.addEventListener("keydown", function (event) {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            const options = Array.from(searchSuggestions.querySelectorAll("button"));
            const next = event.key === "ArrowDown" ? 0 : options.length - 1;
            if (options[next]) { event.preventDefault(); options[next].focus(); }
          }
          if (event.key === "Enter") {
            const first = searchSuggestions._matches && searchSuggestions._matches[0];
            if (first) {
              event.preventDefault();
              jumpToQuestion(first);
            }
          }
          if (event.key === "Escape") {
            searchSuggestions.classList.remove("show");
          }
        });

        searchSuggestions.addEventListener("click", function (event) {
          const button = event.target.closest(".search-suggestion");
          if (!button) {
            return;
          }
          const index = Number(button.dataset.questionIndex);
          const question = searchSuggestions._matches && searchSuggestions._matches[index];
          if (question) {
            jumpToQuestion(question);
          }
        });

        document.addEventListener("click", function (event) {
          if (!event.target.closest(".search-wrap")) {
            searchSuggestions.classList.remove("show");
          }
        });

        document.getElementById("filterBar").addEventListener("click", function (event) {
          const button = event.target.closest(".filter-btn");
          if (button) {
            localStorage.setItem("study-current-category", button.dataset.filter);
            localStorage.removeItem("study-current-question");
            setFilter(button.dataset.filter);
          }
        });

        document.querySelector("aside").addEventListener("click", function (event) {
          const link = event.target.closest("a[href^='#']");
          if (link) {
            event.preventDefault();
            const id = link.getAttribute("href").slice(1);
            const question = state.questions.find(function (item) {
              return item.id === id || questionStorageKey(item) === id;
            });
            if (question) {
              jumpToQuestion(question);
            }
            return;
          }

          const group = event.target.closest(".toc-group");
          if (group && group.dataset.filter) {
            localStorage.setItem("study-current-category", group.dataset.filter);
            localStorage.removeItem("study-current-question");
            setFilter(group.dataset.filter);
          }
        });

        compactBtn.addEventListener("click", function () {
          document.body.classList.toggle("compact");
          const enabled = document.body.classList.contains("compact");
          localStorage.setItem("study-compact", enabled ? "1" : "0");
          compactBtn.textContent = enabled ? "\u8be6\u7ec6\u6a21\u5f0f" : "\u6838\u5fc3\u901f\u89c8";
        });

        darkBtn.addEventListener("click", function () {
          document.body.classList.toggle("dark");
          const enabled = document.body.classList.contains("dark");
          localStorage.setItem("study-dark", enabled ? "1" : "0");
          darkBtn.textContent = enabled ? "\u6d45\u8272\u6a21\u5f0f" : "\u6df1\u8272\u6a21\u5f0f";
        });

        if (localStorage.getItem("study-compact") === "1") {
          document.body.classList.add("compact");
          compactBtn.textContent = "\u8be6\u7ec6\u6a21\u5f0f";
        }

        if (localStorage.getItem("study-dark") === "1") {
          document.body.classList.add("dark");
          darkBtn.textContent = "\u6d45\u8272\u6a21\u5f0f";
        }

      if (!restoreEditorScroll()) {
        restoreLastQuestion();
      }
    })();
