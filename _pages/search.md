---
layout: page
title: Search
permalink: /search/
description: Full-text search across all content
nav: true
nav_order: 5
---

<link href="/pagefind/pagefind-ui.css" rel="stylesheet">
<script src="/pagefind/pagefind-ui.js" defer></script>
<script>
  document.addEventListener('DOMContentLoaded', function () {
    window.pf = new PagefindUI({
      element: '#search',
      showSubResults: true,
      showImages: false,
      // Allow single-character Chinese search (default minimum is 2)
      processTerm: function (term) {
        return term;
      },
      translations: {
        placeholder: '搜索笔记内容...',
        zero_results: '未找到与 [SEARCH_TERM] 相关的结果',
        many_results: '找到 [COUNT] 条结果',
        one_result: '找到 [COUNT] 条结果',
        searching: '搜索中...',
      },
    });
  });
</script>

<div id="search"></div>

<style>
  #search {
    --pagefind-ui-scale: 0.9;
    --pagefind-ui-primary: var(--global-theme-color);
    --pagefind-ui-text: var(--global-text-color);
    --pagefind-ui-background: var(--global-bg-color);
    --pagefind-ui-border: var(--global-border-color);
    --pagefind-ui-tag: var(--global-theme-color);
    --pagefind-ui-border-width: 1px;
    --pagefind-ui-border-radius: 8px;
    --pagefind-ui-image-border-radius: 8px;
    --pagefind-ui-image-box-ratio: 3/2;
    --pagefind-ui-font: var(--body-font);
  }
  .pagefind-ui__search-input {
    font-size: 1rem !important;
    padding: 0.6rem 1rem !important;
  }
  /* Better result snippet display for Chinese text */
  .pagefind-ui__result-excerpt {
    line-height: 1.8;
  }
  mark.pagefind-ui__result-highlight {
    background-color: rgba(var(--global-theme-color-rgb, 78, 115, 223), 0.2);
    padding: 0.1em 0.2em;
    border-radius: 2px;
  }
</style>
