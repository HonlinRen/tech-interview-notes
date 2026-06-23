(function () {
  const INLINE_TAGS = new Set(["STRONG", "MARK", "DEL", "CODE", "B", "I", "EM"]);

  function escapeHtml(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function stripNumber(title) {
    return title.replace(/^\d+(?:-\d+)?\.\s*/, "");
  }

  function indent(level) {
    return "        ".slice(0, level * 2) || "";
  }

  function looksLikeCodeFragment(text) {
    const line = text.trim();
    if (!line) {
      return false;
    }
    if (/[\u4e00-\u9fff]/.test(line) && !/["'].*[\u4e00-\u9fff].*["']/.test(line)) {
      return false;
    }
    return /[;{}()]/.test(line) || /^(import|public|private|protected|class|interface|enum|return|if|for|while|new|throw|try|catch|package|def|function|const|let|var|async|await|#include|using|namespace)\b/.test(line);
  }

  function looksLikeMergedCode(text) {
    const normalized = text.replace(/\r\n/g, "\n").trim();
    if (!normalized) {
      return false;
    }
    const lines = normalized.split("\n");
    if (lines.length < 2) {
      return false;
    }
    if (/^(import |public |private |class |interface |def |function |package |#include|using )/m.test(normalized)) {
      return true;
    }
    return /[;{}]/.test(normalized) && lines.filter(looksLikeCodeFragment).length >= 2;
  }

  function extractCodeText(codeEl) {
    if (!codeEl) {
      return "";
    }
    const parts = [];
    codeEl.childNodes.forEach(function (node) {
      if (node.nodeType === Node.TEXT_NODE) {
        parts.push(node.textContent);
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) {
        return;
      }
      const tag = node.tagName;
      if (tag === "BR") {
        parts.push("\n");
        return;
      }
      if (tag === "DIV" || tag === "P") {
        if (parts.length && !/\n$/.test(parts[parts.length - 1])) {
          parts.push("\n");
        }
        parts.push(extractCodeText(node));
        parts.push("\n");
        return;
      }
      parts.push(node.textContent);
    });
    return parts.join("").replace(/\r\n/g, "\n").replace(/\n+$/, "");
  }

  function looksLikeSingleLineCodeBlock(text) {
    const normalized = text.replace(/\r\n/g, "\n").trim();
    if (!normalized || normalized.indexOf("\n") !== -1) {
      return false;
    }
    const parts = normalized.split(";").map(function (part) {
      return part.trim();
    }).filter(Boolean);
    return parts.length >= 2 && parts.filter(looksLikeCodeFragment).length >= 2;
  }

  function looksLikeStandaloneCodeStatement(text) {
    const normalized = text.replace(/\r\n/g, "\n").trim();
    if (!normalized) {
      return false;
    }
    const lines = normalized.split("\n").map(function (line) {
      return line.trim();
    }).filter(Boolean);
    if (lines.length >= 2) {
      return looksLikeMergedCode(lines.join("\n"));
    }
    const line = lines[0] || "";
    if (looksLikeSingleLineCodeBlock(line)) {
      return true;
    }
    return looksLikeCodeFragment(line) && /[;=]/.test(line) && line.length >= 15;
  }

  function shouldSerializeInlineCodeAsPre(codeEl, text) {
    if (!codeEl) {
      return false;
    }
    if (/language-[\w+-]+/.test(codeEl.className || "")) {
      return true;
    }
    if (codeEl.querySelector("br, div, p")) {
      return true;
    }
    const normalized = text.replace(/\r\n/g, "\n").trim();
    if (normalized.indexOf("\n") !== -1) {
      const lines = normalized.split("\n").filter(function (line) {
        return line.trim();
      });
      if (lines.length >= 2) {
        return looksLikeMergedCode(normalized) || lines.filter(looksLikeCodeFragment).length >= 2;
      }
    }
    return looksLikeStandaloneCodeStatement(normalized);
  }

  function inferCodeLangFromSection(node) {
    const section = node && node.closest ? node.closest("section") : null;
    if (!section) {
      return "";
    }
    const coded = section.querySelector("pre code[class*='language-'], code[class*='language-']");
    if (!coded) {
      return "";
    }
    const match = coded.className.match(/language-([\w+-]+)/);
    return match ? match[1] : "";
  }

  const EM_SPAN_CLASSES = new Set(["em-warn", "em-danger", "em-key", "em-ok", "em-muted", "em-accent"]);

  function serializeInline(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      return escapeHtml(node.textContent);
    }
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return "";
    }

    const tag = node.tagName;
    if (tag === "BR") {
      return "";
    }

    const inner = Array.from(node.childNodes).map(serializeInline).join("");

    if (tag === "STRONG" || tag === "B") {
      return "<strong>" + inner + "</strong>";
    }
    if (tag === "MARK") {
      return "<mark>" + inner + "</mark>";
    }
    if (tag === "DEL" || tag === "S") {
      return "<del>" + inner + "</del>";
    }
    if (tag === "CODE") {
      return "<code>" + inner + "</code>";
    }
    if (tag === "SPAN") {
      const emClass = Array.from(node.classList).find(function (name) {
        return EM_SPAN_CLASSES.has(name);
      });
      if (emClass) {
        return '<span class="' + emClass + '">' + inner + "</span>";
      }
    }
    if (INLINE_TAGS.has(tag)) {
      return inner;
    }

    return inner;
  }

  function serializeParagraph(p, baseIndent) {
    const lists = Array.from(p.children).filter(function (el) {
      return el.tagName === "UL" || el.tagName === "OL";
    });
    if (lists.length > 0) {
      const parts = [];
      Array.from(p.childNodes).forEach(function (node) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          if (node.tagName === "UL" || node.tagName === "OL") {
            parts.push(serializeList(node, node.tagName.toLowerCase(), baseIndent));
            return;
          }
          parts.push(serializeInline(node));
          return;
        }
        if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
          parts.push(baseIndent + "<p>" + escapeHtml(node.textContent) + "</p>");
        }
      });
      return parts.filter(Boolean).join("\n");
    }

    const code = p.querySelector(":scope > code");
    if (code) {
      const onlyCode = Array.from(p.childNodes).every(function (node) {
        if (node.nodeType === Node.TEXT_NODE) {
          return !node.textContent.trim();
        }
        return node === code;
      });
      const text = onlyCode
        ? extractCodeText(code)
        : p.textContent.replace(/\r\n/g, "\n").trim();
      if (text && shouldSerializeInlineCodeAsPre(code, text)) {
        const langMatch = code.className.match(/language-([\w+-]+)/);
        const inferredLang = langMatch ? langMatch[1] : inferCodeLangFromSection(p);
        const langClass = inferredLang ? ' class="language-' + inferredLang + '"' : "";
        return baseIndent + "<pre><code" + langClass + ">" + escapeHtml(text.trim()) + "</code></pre>";
      }
    }

    const inner = Array.from(p.childNodes).map(serializeInline).join("");
    return baseIndent + "<p>" + inner + "</p>";
  }

  function serializeHeading(el, tag, baseIndent) {
    const inner = Array.from(el.childNodes).map(serializeInline).join("");
    return baseIndent + "<" + tag + ">" + inner + "</" + tag + ">";
  }

  function serializePre(pre, baseIndent) {
    const code = pre.querySelector("code");
    if (!code) {
      const out = baseIndent + "<pre>" + escapeHtml(pre.textContent) + "</pre>";
      // #region agent log
      if (pre.textContent.indexOf("CompletableFuture") !== -1 && typeof fetch === "function") {
        fetch("http://127.0.0.1:7812/ingest/52ee4261-ce2a-45ff-9202-7e39a9415d65", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "ce29c0" },
          body: JSON.stringify({
            sessionId: "ce29c0",
            location: "html-serializer.js:serializePre",
            message: "serialize pre without code child",
            data: { preTag: pre.tagName, outSnippet: out.slice(0, 200) },
            hypothesisId: "B",
            runId: "pre-fix",
            timestamp: Date.now()
          })
        }).catch(function () {});
      }
      // #endregion
      return out;
    }

    const langMatch = code.className.match(/language-([\w+-]+)/);
    const dataLang = pre.dataset && pre.dataset.codeLang;
    const langClass = langMatch
      ? ' class="language-' + langMatch[1] + '"'
      : dataLang
        ? ' class="language-' + escapeHtml(dataLang) + '"'
        : "";
    const text = extractCodeText(code).replace(/\r\n/g, "\n");
    const out = baseIndent + "<pre><code" + langClass + ">" + escapeHtml(text) + "</code></pre>";
    // #region agent log
    if (text.indexOf("CompletableFuture") !== -1 && typeof fetch === "function") {
      fetch("http://127.0.0.1:7812/ingest/52ee4261-ce2a-45ff-9202-7e39a9415d65", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "ce29c0" },
        body: JSON.stringify({
          sessionId: "ce29c0",
          location: "html-serializer.js:serializePre",
          message: "serialize pre with code",
          data: {
            codeClass: code.className,
            langMatch: langMatch ? langMatch[1] : null,
            newlineCount: text.split("\n").length - 1,
            hasPreInOut: out.indexOf("<pre>") !== -1,
            outSnippet: out.slice(0, 250)
          },
          hypothesisId: "B,C",
          runId: "pre-fix",
          timestamp: Date.now()
        })
      }).catch(function () {});
    }
    // #endregion
    return out;
  }

  function serializeTableCell(cell, tag) {
    const inner = Array.from(cell.childNodes).map(serializeInline).join("");
    return "<" + tag + ">" + inner + "</" + tag + ">";
  }

  function serializeTableRow(tr, cellTag) {
    const cells = Array.from(tr.children)
      .filter(function (el) {
        return el.tagName === cellTag.toUpperCase();
      })
      .map(function (cell) {
        return serializeTableCell(cell, cellTag);
      });
    return "            <tr>" + cells.join("") + "</tr>";
  }

  function serializeTable(table, baseIndent) {
    const lines = [baseIndent + "<table>"];
    const thead = table.querySelector("thead");
    const tbody = table.querySelector("tbody");

    if (thead) {
      lines.push(baseIndent + "  <thead>");
      Array.from(thead.querySelectorAll(":scope > tr")).forEach(function (tr) {
        const cells = Array.from(tr.children)
          .filter(function (el) {
            return el.tagName === "TH" && !el.classList.contains("editor-row-controls-header");
          })
          .map(function (th) {
            return serializeTableCell(th, "th");
          });
        lines.push(baseIndent + "    <tr>");
        cells.forEach(function (cell) {
          lines.push(baseIndent + "      " + cell);
        });
        lines.push(baseIndent + "    </tr>");
      });
      lines.push(baseIndent + "  </thead>");
    }

    if (tbody) {
      lines.push(baseIndent + "  <tbody>");
      Array.from(tbody.querySelectorAll(":scope > tr")).forEach(function (tr) {
        const cells = Array.from(tr.children)
          .filter(function (el) {
            return el.tagName === "TD" && !el.classList.contains("editor-row-controls");
          })
          .map(function (td) {
            return serializeTableCell(td, "td");
          });
        lines.push(baseIndent + "    <tr>" + cells.join("") + "</tr>");
      });
      lines.push(baseIndent + "  </tbody>");
    } else {
      lines.push(baseIndent + "  <tbody>");
      Array.from(table.querySelectorAll(":scope > tr")).forEach(function (tr) {
        if (tr.closest("thead")) {
          return;
        }
        const cells = Array.from(tr.children)
          .filter(function (el) {
            return (el.tagName === "TD" || el.tagName === "TH") && !el.classList.contains("editor-row-controls");
          })
          .map(function (td) {
            return serializeTableCell(td, td.tagName.toLowerCase());
          });
        lines.push(baseIndent + "    <tr>" + cells.join("") + "</tr>");
      });
      lines.push(baseIndent + "  </tbody>");
    }

    lines.push(baseIndent + "</table>");
    return lines.join("\n");
  }

  function serializeList(list, tag, baseIndent) {
    const lines = [baseIndent + "<" + tag + ">"];
    Array.from(list.children).forEach(function (li) {
      if (li.tagName !== "LI") {
        return;
      }
      const inner = Array.from(li.childNodes).map(function (node) {
        if (node.nodeType === Node.TEXT_NODE) {
          return escapeHtml(node.textContent);
        }
        if (node.nodeType === Node.ELEMENT_NODE) {
          const childTag = node.tagName;
          if (childTag === "P") {
            return serializeInline(node) || Array.from(node.childNodes).map(serializeInline).join("");
          }
          if (childTag === "UL" || childTag === "OL") {
            return serializeList(node, childTag.toLowerCase(), baseIndent + "  ");
          }
          if (childTag === "PRE") {
            return "\n" + serializePre(node, baseIndent + "    ") + "\n" + baseIndent + "    ";
          }
          return serializeInline(node);
        }
        return "";
      }).join("");
      lines.push(baseIndent + "  <li>" + inner + "</li>");
    });
    lines.push(baseIndent + "</" + tag + ">");
    return lines.join("\n");
  }

  const BLOCK_TAGS = new Set(["P", "UL", "OL", "PRE", "TABLE", "H3", "H4", "DIV"]);

  function hasBlockChild(el) {
    return Array.from(el.children).some(function (child) {
      return BLOCK_TAGS.has(child.tagName);
    });
  }

  function serializeInlineBlock(el, baseIndent) {
    const inner = Array.from(el.childNodes).map(serializeInline).join("");
    if (!inner.trim()) {
      return "";
    }
    return baseIndent + "<p>" + inner + "</p>";
  }

  function serializeBlock(el, baseIndent) {
    const tag = el.tagName;
    if (tag === "DIV") {
      if (el.children.length === 1 && el.firstElementChild && el.firstElementChild.tagName === "PRE") {
        return serializePre(el.firstElementChild, baseIndent);
      }
      if (!hasBlockChild(el)) {
        // #region agent log
        if (el.textContent.indexOf("CompletableFuture") !== -1 && typeof fetch === "function") {
          fetch("http://127.0.0.1:7812/ingest/52ee4261-ce2a-45ff-9202-7e39a9415d65", {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "ce29c0" },
            body: JSON.stringify({
              sessionId: "ce29c0",
              location: "html-serializer.js:serializeBlock:div-inline",
              message: "DIV with code serialized as inline p",
              data: {
                childTags: Array.from(el.children).map(function (c) { return c.tagName + ":" + c.className; }),
                textSnippet: el.textContent.slice(0, 200)
              },
              hypothesisId: "B",
              runId: "pre-fix",
              timestamp: Date.now()
            })
          }).catch(function () {});
        }
        // #endregion
        return serializeInlineBlock(el, baseIndent);
      }
      const divResult = Array.from(el.children)
        .map(function (child) {
          return serializeBlock(child, baseIndent);
        })
        .filter(Boolean)
        .join("\n");
      // #region agent log
      if (!divResult && el.textContent.trim() && typeof fetch === "function") {
        fetch("/api/debug-log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: "5803c5",
            location: "html-serializer.js:serializeBlock:div-empty",
            message: "DIV serialized to empty",
            data: {
              text: el.textContent.trim().slice(0, 120),
              childTags: Array.from(el.children).map(function (c) { return c.tagName + ":" + c.className; }),
              inSection: (el.closest("section") || {}).id
            },
            hypothesisId: "A",
            runId: "post-fix-2",
            timestamp: Date.now()
          })
        }).catch(function () {});
      }
      // #endregion
      return divResult;
    }
    if (tag === "P") {
      return serializeParagraph(el, baseIndent);
    }
    if (tag === "H3" || tag === "H4") {
      return serializeHeading(el, tag.toLowerCase(), baseIndent);
    }
    if (tag === "PRE") {
      return serializePre(el, baseIndent);
    }
    if (tag === "TABLE") {
      return serializeTable(el, baseIndent);
    }
    if (tag === "UL" || tag === "OL") {
      return serializeList(el, tag.toLowerCase(), baseIndent);
    }
    if (tag === "SPAN" || tag === "MARK") {
      return serializeInlineBlock(el, baseIndent);
    }
    if (!hasBlockChild(el) && el.textContent && el.textContent.trim()) {
      return serializeInlineBlock(el, baseIndent);
    }
    return "";
  }

  function getSectionContentNodes(section) {
    const answer = section.querySelector(":scope > .answer");
    const container = answer || section;
    const nodes = [];
    Array.from(container.childNodes).forEach(function (node) {
      if (node.nodeType === Node.TEXT_NODE) {
        if (node.textContent.trim()) {
          nodes.push(node);
        }
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) {
        return;
      }
      if (node.classList.contains("question-heading")) {
        return;
      }
      nodes.push(node);
    });
    return nodes;
  }

  function getSectionTitle(section) {
    const h2 = section.querySelector(":scope > .question-heading h2, :scope > h2");
    if (!h2) {
      return "";
    }
    return stripNumber(h2.textContent.trim());
  }

  function serializeSection(section) {
    if (!section) {
      return "";
    }
    const id = section.id;
    if (!id || id === "summary") {
      return "";
    }

    const title = getSectionTitle(section);
    const blocks = getSectionContentNodes(section)
      .map(function (node) {
        if (node.nodeType === Node.TEXT_NODE) {
          return "        <p>" + escapeHtml(node.textContent.trim()) + "</p>";
        }
        return serializeBlock(node, "        ");
      })
      .filter(Boolean);

    // #region agent log
    if (id === "compile-and-interpret" && typeof fetch === "function") {
      fetch("/api/debug-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: "5803c5",
          location: "html-serializer.js:serializeSection",
          message: "Section node analysis",
          data: {
            elementChildCount: blocks.length,
            blockTags: blocks.map(function (b) { return b.trim().slice(0, 40); }),
            hasGraalVM: blocks.join("\n").indexOf("GraalVM") !== -1
          },
          hypothesisId: "B,G",
          runId: "post-fix-2",
          timestamp: Date.now()
        })
      }).catch(function () {});
    }
    // #endregion

    const lines = ['<section id="' + escapeHtml(id) + '">'];
    if (title) {
      lines.push("        <h2>" + escapeHtml(title) + "</h2>");
    }
    lines.push.apply(lines, blocks);
    lines.push("      </section>");
    return lines.join("\n");
  }

  function serializeMainSections() {
    return Array.from(document.querySelectorAll("main > section"))
      .map(serializeSection)
      .filter(Boolean)
      .join("\n\n");
  }

  window.HtmlSerializer = {
    escapeHtml: escapeHtml,
    stripNumber: stripNumber,
    serializeSection: serializeSection,
    serializeMainSections: serializeMainSections
  };
})();
