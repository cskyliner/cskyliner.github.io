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

  /* Search box: taller, bolder, with search icon */
  .pagefind-ui__form {
    position: relative;
  }
  .pagefind-ui__form::before {
    background-color: var(--pagefind-ui-text);
    width: calc(18px * var(--pagefind-ui-scale));
    height: calc(18px * var(--pagefind-ui-scale));
    top: calc(23px * var(--pagefind-ui-scale));
    left: calc(20px * var(--pagefind-ui-scale));
    content: "";
    position: absolute;
    display: block;
    opacity: 0.6;
    -webkit-mask-image: url("data:image/svg+xml,%3Csvg width='18' height='18' viewBox='0 0 18 18' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12.7549 11.255H11.9649L11.6849 10.985C12.6649 9.845 13.2549 8.365 13.2549 6.755C13.2549 3.165 10.3449 0.255005 6.75488 0.255005C3.16488 0.255005 0.254883 3.165 0.254883 6.755C0.254883 10.345 3.16488 13.255 6.75488 13.255C8.36488 13.255 9.84488 12.665 10.9849 11.685L11.2549 11.965V12.755L16.2549 17.745L17.7449 16.255L12.7549 11.255ZM6.75488 11.255C4.26488 11.255 2.25488 9.245 2.25488 6.755C2.25488 4.26501 4.26488 2.255 6.75488 2.255C9.24488 2.255 11.2549 4.26501 11.2549 6.755C11.2549 9.245 9.24488 11.255 6.75488 11.255Z' fill='%23000000'/%3E%3C/svg%3E%0A");
    mask-image: url("data:image/svg+xml,%3Csvg width='18' height='18' viewBox='0 0 18 18' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12.7549 11.255H11.9649L11.6849 10.985C12.6649 9.845 13.2549 8.365 13.2549 6.755C13.2549 3.165 10.3449 0.255005 6.75488 0.255005C3.16488 0.255005 0.254883 3.165 0.254883 6.755C0.254883 10.345 3.16488 13.255 6.75488 13.255C8.36488 13.255 9.84488 12.665 10.9849 11.685L11.2549 11.965V12.755L16.2549 17.745L17.7449 16.255L12.7549 11.255ZM6.75488 11.255C4.26488 11.255 2.25488 9.245 2.25488 6.755C2.25488 4.26501 4.26488 2.255 6.75488 2.255C9.24488 2.255 11.2549 4.26501 11.2549 6.755C11.2549 9.245 9.24488 11.255 6.75488 11.255Z' fill='%23000000'/%3E%3C/svg%3E%0A");
    -webkit-mask-size: 100%;
    mask-size: 100%;
    z-index: 9;
    pointer-events: none;
  }
  .pagefind-ui__search-input {
    height: calc(58px * var(--pagefind-ui-scale)) !important;
    padding: 0 calc(64px * var(--pagefind-ui-scale)) 0 calc(54px * var(--pagefind-ui-scale)) !important;
    font-size: calc(18px * var(--pagefind-ui-scale)) !important;
    font-weight: 600 !important;
    border-radius: var(--pagefind-ui-border-radius) !important;
  }
  .pagefind-ui__search-input::placeholder {
    opacity: 0.35;
  }
  .pagefind-ui__search-clear {
    top: calc(3px * var(--pagefind-ui-scale));
    right: calc(3px * var(--pagefind-ui-scale));
    height: calc(52px * var(--pagefind-ui-scale));
    padding: 0 calc(14px * var(--pagefind-ui-scale)) 0 calc(2px * var(--pagefind-ui-scale));
    font-size: calc(13px * var(--pagefind-ui-scale));
  }

  /* Result items: clean card style with top border separator */
  .pagefind-ui__result {
    list-style-type: none !important;
    display: flex;
    align-items: flex-start;
    gap: calc(16px * var(--pagefind-ui-scale));
    padding: calc(24px * var(--pagefind-ui-scale)) 0 !important;
    border-top: 1px solid var(--pagefind-ui-border) !important;
    margin: 0 !important;
  }
  .pagefind-ui__result:last-of-type {
    border-bottom: 1px solid var(--pagefind-ui-border) !important;
  }
  .pagefind-ui__result-inner {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }
  .pagefind-ui__result-title {
    display: inline-block;
    font-weight: 700 !important;
    font-size: calc(18px * var(--pagefind-ui-scale)) !important;
    margin: 0 !important;
  }
  .pagefind-ui__result-title .pagefind-ui__result-link {
    color: var(--pagefind-ui-text) !important;
    text-decoration: none !important;
  }
  .pagefind-ui__result-title .pagefind-ui__result-link:hover {
    text-decoration: underline !important;
  }
  .pagefind-ui__result-excerpt {
    font-size: calc(15px * var(--pagefind-ui-scale)) !important;
    margin: calc(4px * var(--pagefind-ui-scale)) 0 0 !important;
    line-height: 1.9 !important;
    min-width: unset !important;
  }

  /* Sub-results: indent with arrow prefix */
  .pagefind-ui__result-nested {
    display: flex;
    flex-direction: column;
    padding-left: calc(20px * var(--pagefind-ui-scale)) !important;
    margin-top: calc(8px * var(--pagefind-ui-scale));
  }
  .pagefind-ui__result-nested:first-of-type {
    padding-top: calc(8px * var(--pagefind-ui-scale)) !important;
  }
  .pagefind-ui__result-nested .pagefind-ui__result-link {
    font-size: calc(14px * var(--pagefind-ui-scale)) !important;
    position: relative;
  }
  .pagefind-ui__result-nested .pagefind-ui__result-link::before {
    content: "⤷ ";
    color: var(--pagefind-ui-primary);
    opacity: 0.7;
  }
  .pagefind-ui__result-nested .pagefind-ui__result-excerpt {
    font-size: calc(13px * var(--pagefind-ui-scale)) !important;
    margin-top: 2px !important;
  }

  /* Loading animation: pulsing skeleton */
  @keyframes pagefind-pulsate {
    0% { opacity: 0.1; }
    50% { opacity: 0.25; }
    100% { opacity: 0.1; }
  }
  .pagefind-ui__loading {
    animation: pagefind-pulsate 1.8s infinite ease-in-out !important;
    border-radius: var(--pagefind-ui-border-radius) !important;
  }

  /* Message (no results) */
  .pagefind-ui__message {
    font-size: calc(15px * var(--pagefind-ui-scale)) !important;
    padding: calc(16px * var(--pagefind-ui-scale)) 0 !important;
    font-weight: 600 !important;
    color: var(--pagefind-ui-text) !important;
    opacity: 0.7;
  }

  /* Highlight: theme color, soft background */
  mark.pagefind-ui__result-highlight {
    background-color: rgba(var(--global-theme-color-rgb, 26, 115, 232), 0.18) !important;
    color: inherit !important;
    padding: 0.05em 0.2em;
    border-radius: 3px;
  }
</style>
