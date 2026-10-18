(function () {
  const theme = document.getElementById("labTheme");
  function savedTheme() { try { return localStorage.getItem("study-dark") === "1"; } catch (_) { return false; } }
  function applyTheme() { const enabled = savedTheme(); document.body.classList.toggle("dark", enabled); theme.textContent = enabled ? "浅色模式" : "深色模式"; theme.setAttribute("aria-pressed", String(enabled)); }
  theme.onclick = () => {
    const enabled = !document.body.classList.contains("dark");
    try { localStorage.setItem("study-dark", enabled ? "1" : "0"); applyTheme(); }
    catch (_) { document.body.classList.toggle("dark", enabled); theme.textContent = enabled ? "浅色模式" : "深色模式"; theme.setAttribute("aria-pressed", String(enabled)); }
  };
  window.addEventListener("storage", event => { if (!event.key || event.key === "study-dark") applyTheme(); });
  applyTheme();
  document.querySelectorAll("main table").forEach((table, index) => {
    const region = document.createElement("div"); region.className = "lab-table-scroll"; region.tabIndex = 0;
    region.setAttribute("role", "region"); region.setAttribute("aria-label", "数据表 " + (index + 1) + "，宽表可横向滚动");
    table.before(region); region.append(table);
  });
  function zoom(svg, button, title) {
    const dialog = document.createElement("dialog"); dialog.className = "lab-zoom"; dialog.setAttribute("aria-label", title);
    const heading = document.createElement("div"); heading.className = "lab-zoom-heading";
    const label = document.createElement("strong"); label.textContent = title;
    const close = document.createElement("button"); close.type = "button"; close.textContent = "关闭图示"; close.onclick = () => dialog.close(); heading.append(label, close);
    const canvas = document.createElement("div"); canvas.className = "zoom-canvas"; canvas.tabIndex = 0; canvas.setAttribute("aria-label", "放大图示，可横向滚动");
    const clone = svg.cloneNode(true); const ids = new Map();
    clone.querySelectorAll("[id]").forEach((node, i) => { const original = node.id; node.id = "zoom-" + i + "-" + original; ids.set(original, node.id); });
    clone.querySelectorAll("*").forEach(node => [...node.attributes].forEach(attr => {
      let value = attr.value;
      for (const [from, to] of ids) { value = value.replaceAll("url(#" + from + ")", "url(#" + to + ")"); if (value === "#" + from) value = "#" + to; }
      if (value !== attr.value) node.setAttribute(attr.name, value);
    }));
    canvas.append(clone); dialog.append(heading, canvas); document.body.append(dialog);
    dialog.addEventListener("close", () => { dialog.remove(); button.focus(); });
    dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); });
    dialog.showModal();
  }
  document.querySelectorAll("main svg").forEach((svg, index) => {
    const title = svg.getAttribute("aria-label") || "实验图示 " + (index + 1);
    const figure = document.createElement("figure"); figure.className = "lab-figure-shell";
    const region = document.createElement("div"); region.className = "lab-diagram-scroll"; region.tabIndex = 0; region.setAttribute("role", "region"); region.setAttribute("aria-label", title + "，可横向滚动");
    svg.before(figure); region.append(svg);
    const caption = document.createElement("figcaption"); caption.className = "diagram-tools";
    const hint = document.createElement("span"); hint.textContent = "图示可横向滚动查看";
    const button = document.createElement("button"); button.type = "button"; button.className = "diagram-zoom"; button.textContent = "放大图示"; button.setAttribute("aria-label", "放大：" + title); button.onclick = () => zoom(svg, button, title);
    caption.append(hint, button); figure.append(region, caption);
  });
  const toc = document.querySelector(".lab-toc");
  toc.addEventListener("click", event => { if (event.target.closest("a")) toc.open = false; });
  let frame;
  const update = () => {
    frame = null;
    const sections = [...document.querySelectorAll("main > section")];
    const current = sections.filter(section => section.getBoundingClientRect().top < innerHeight * .3).pop() || sections[0];
    document.querySelectorAll(".lab-toc a").forEach(link => { if (link.hash === "#" + current?.id) link.setAttribute("aria-current", "location"); else link.removeAttribute("aria-current"); });
  };
  window.addEventListener("scroll", () => { if (!frame) frame = requestAnimationFrame(update); }, { passive: true });
  update();
})();
