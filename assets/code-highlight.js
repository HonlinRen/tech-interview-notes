(function () {
  if (typeof window.hljs === "undefined") {
    return;
  }

  window.hljs.registerAliases("redis", { languageName: "bash" });

  document.querySelectorAll("main pre code").forEach(function (block) {
    const language = block.className.match(/language-([\w+-]+)/)?.[1];
    if (language && window.hljs.getLanguage(language)) {
      window.hljs.highlightElement(block);
    }
  });
})();
