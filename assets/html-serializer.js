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
      if (onlyCode) {
        const text = code.textContent.replace(/\r\n/g, "\n");
        if (text.indexOf("\n") !== -1 || text.length >= 120) {
          const langMatch = code.className.match(/language-([\w+-]+)/);
          const langClass = langMatch ? ' class="language-' + langMatch[1] + '"' : "";
          return baseIndent + "<pre><code" + langClass + ">" + escapeHtml(text) + "</code></pre>";
        }
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
      return baseIndent + "<pre>" + escapeHtml(pre.textContent) + "</pre>";
    }

    const langMatch = code.className.match(/language-([\w+-]+)/);
    const langClass = langMatch ? ' class="language-' + langMatch[1] + '"' : "";
    const text = code.textContent.replace(/\r\n/g, "\n");
    return baseIndent + "<pre><code" + langClass + ">" + escapeHtml(text) + "</code></pre>";
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
            return el.tagName === "TH";
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
        const cells = Array.from(tr.children).map(function (td) {
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

  function serializeBlock(el, baseIndent) {
    const tag = el.tagName;
    if (tag === "DIV") {
      if (el.children.length === 1 && el.firstElementChild && el.firstElementChild.tagName === "PRE") {
        return serializePre(el.firstElementChild, baseIndent);
      }
      return Array.from(el.children)
        .map(function (child) {
          return serializeBlock(child, baseIndent);
        })
        .filter(Boolean)
        .join("\n");
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
    return "";
  }

  function getSectionContentNodes(section) {
    const answer = section.querySelector(":scope > .answer");
    if (answer) {
      return Array.from(answer.children);
    }
    return Array.from(section.children).filter(function (child) {
      return !child.classList.contains("question-heading");
    });
  }

  function getSectionTitle(section) {
    const h2 = section.querySelector(":scope > .question-heading h2, :scope > h2");
    if (!h2) {
      return "";
    }
    return stripNumber(h2.textContent.trim());
  }

  function serializeSection(section) {
    const id = section.id;
    if (!id || id === "summary") {
      return "";
    }

    const title = getSectionTitle(section);
    const blocks = getSectionContentNodes(section)
      .map(function (node) {
        return serializeBlock(node, "        ");
      })
      .filter(Boolean);

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
