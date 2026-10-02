(() => {
  const url = document.currentScript.dataset.searchUrl;
  document.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k" && !event.isComposing) {
      event.preventDefault();
      const input = document.getElementById("search-input");
      if (input) input.focus();
      else window.location.assign(url);
    }
  });
})();
