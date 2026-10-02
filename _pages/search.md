---
layout: page
title: Search
permalink: /search/
description: Search notes, projects, and this website in English or Chinese.
nav: true
nav_order: 5
---

<div id="site-search" data-bundle="{{ '/pagefind/pagefind.js' | relative_url }}">
  <label for="search-input" class="sr-only">Search this website</label>
  <input id="search-input" type="search" placeholder="Search in English or Chinese…" autocomplete="off" autofocus aria-controls="search-results">
  <p class="search-hint">Full-text search · Ctrl/⌘ + K · Use quotes for exact phrases</p>
  <div id="search-filters" class="search-filters"></div>
  <button id="search-clear" type="button">Clear search and filters</button>
  <p id="search-status" role="status" aria-live="polite">Loading search…</p>
  <button id="search-retry" type="button" hidden>Retry</button>
  <div id="search-results"></div>
  <button id="search-more" type="button" hidden>Load more</button>
</div>
<script type="module" src="{{ '/assets/js/fulltext-search.js' | relative_url }}"></script>
