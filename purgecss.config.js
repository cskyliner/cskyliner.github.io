module.exports = {
  content: ["_site/**/*.html", "_site/**/*.js"],
  css: ["_site/assets/css/*.css"],
  safelist: { greedy: [/search-/, /site-search/] },
  output: "_site/assets/css/",
  skippedContentGlobs: ["_site/assets/**/*.html"],
};
