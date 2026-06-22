(function () {
  if (typeof window.hljs === "undefined") {
    return;
  }

  window.hljs.registerAliases("redis", { languageName: "bash" });

  document.querySelectorAll("main pre code").forEach(function (block) {
    if (/language-[\w+-]+/.test(block.className)) {
      window.hljs.highlightElement(block);
    }
  });
})();
