---
layout: page
title: Search
permalink: /search/
description: Full-text search across all content
nav: true
nav_order: 5
---

<link href="/pagefind/pagefind-ui.css" rel="stylesheet">
<script src="/pagefind/pagefind-ui.js" onload="window.pf = new PagefindUI({ element: '#search', showSubResults: true, showImages: false, translations: { placeholder: '搜索笔记内容...' } });" defer></script>

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
</style>
