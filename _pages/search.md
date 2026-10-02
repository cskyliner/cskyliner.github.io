---
layout: page
title: Search
permalink: /search/
description:
nav: true
nav_order: 5
---

<div id="site-search" data-bundle="{{ '/pagefind/pagefind.js' | relative_url }}">
  <label for="search-input" class="sr-only">Search notes</label>
  <input id="search-input" type="search" placeholder="Search notes…" autocomplete="off" autofocus aria-controls="search-results">
  <p id="search-status" role="status" aria-live="polite">Loading search…</p>
  <button id="search-retry" type="button" hidden>Retry</button>
  <div id="search-results"></div>
  <button id="search-more" type="button" hidden>Load more</button>
</div>
<script type="module" src="{{ '/assets/js/fulltext-search.js' | relative_url }}"></script>
