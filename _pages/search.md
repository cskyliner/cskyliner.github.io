---
layout: page
title: Search
permalink: /search/
description: Full-text search across all content
nav: true
nav_order: 5
---

<script src="https://cdn.jsdelivr.net/gh/nextapps-de/flexsearch@0.7.2/dist/flexsearch.bundle.min.js" defer></script>
<script>
  let searchIndex = null;
  let searchData = null;

  async function initSearch() {
    try {
      const response = await fetch('/assets/search-index.json');
      const data = await response.json();
      searchData = data;
      
      searchIndex = new FlexSearch.Document({
        document: {
          id: 'id',
          index: ['title', 'content', 'tags'],
          store: ['title', 'url', 'excerpt', 'date', 'tags', 'content']
        },
        tokenize: 'forward',
        resolution: 9
      });
      
      data.docs.forEach(doc => {
        searchIndex.add({
          id: doc.id,
          title: doc.title,
          content: doc.content || '',
          tags: (doc.tags || []).join(' '),
          url: doc.url,
          excerpt: doc.excerpt,
          date: doc.date
        });
      });
    } catch (e) {
      console.error('Failed to load search index:', e);
    }
  }

  function search(query) {
    if (!searchIndex || !query.trim()) {
      return [];
    }
    
    const allDocScores = new Map();
    const isChinese = /[\u4e00-\u9fff]/.test(query);
    
    if (isChinese && searchData) {
      const chineseTokens = [];
      const chinesePattern = /[\u4e00-\u9fff]+/g;
      let match;
      while ((match = chinesePattern.exec(query)) !== null) {
        const text = match[0];
        for (let i = 2; i <= text.length; i++) {
          chineseTokens.push(text.substring(0, i));
        }
      }
      
      chineseTokens.forEach(token => {
        const docIds = searchData.index[token] || [];
        docIds.forEach(docId => {
          const current = allDocScores.get(docId) || { doc: searchData.docs[docId], score: 0 };
          current.score += 1;
          allDocScores.set(docId, current);
        });
      });
    }
    
    const results = searchIndex.search(query, {
      limit: 20,
      enrich: true
    });
    
    results.forEach(fieldResult => {
      fieldResult.result.forEach(item => {
        const current = allDocScores.get(item.id) || { doc: item.doc, score: 0 };
        current.score += 2;
        allDocScores.set(item.id, current);
      });
    });
    
    const sortedResults = Array.from(allDocScores.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
      .map(item => item.doc);
    
    return sortedResults;
  }

  function highlightMatch(text, query) {
    if (!query || !text) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="pagefind-ui__result-highlight">$1</mark>');
  }

  function renderResults(results, query) {
    const container = document.getElementById('search-results');
    
    if (!query.trim()) {
      container.innerHTML = '';
      return;
    }
    
    if (results.length === 0) {
      container.innerHTML = `<p class="pagefind-ui__message">未找到与 "${query}" 相关的结果</p>`;
      return;
    }
    
    let html = `<p class="pagefind-ui__message">找到 ${results.length} 条结果</p>`;
    
    results.forEach(doc => {
      const title = highlightMatch(doc.title || '', query);
      
      let excerpt = doc.excerpt || '';
      if (doc.content && query) {
        const isChinese = /[\u4e00-\u9fff]/.test(query);
        let matchExcerpt = '';
        
        if (isChinese) {
          const chinesePattern = /[\u4e00-\u9fff]+/g;
          let match;
          while ((match = chinesePattern.exec(query)) !== null) {
            const token = match[0];
            const idx = doc.content.indexOf(token);
            if (idx !== -1) {
              const start = Math.max(0, idx - 60);
              const end = Math.min(doc.content.length, idx + token.length + 100);
              matchExcerpt = doc.content.substring(start, end);
              break;
            }
          }
        } else {
          const lowerContent = doc.content.toLowerCase();
          const lowerQuery = query.toLowerCase();
          const idx = lowerContent.indexOf(lowerQuery);
          if (idx !== -1) {
            const start = Math.max(0, idx - 60);
            const end = Math.min(doc.content.length, idx + query.length + 100);
            matchExcerpt = doc.content.substring(start, end);
          }
        }
        
        if (matchExcerpt) {
          let ctxStart = 0, ctxEnd = doc.content.length;
          if (isChinese) {
            const chinesePattern = /[\u4e00-\u9fff]+/g;
            let match;
            while ((match = chinesePattern.exec(query)) !== null) {
              const token = match[0];
              const idx = doc.content.indexOf(token);
              if (idx !== -1) {
                ctxStart = Math.max(0, idx - 60);
                ctxEnd = Math.min(doc.content.length, idx + token.length + 100);
                break;
              }
            }
          }
          excerpt = (ctxStart > 0 ? '...' : '') + matchExcerpt + (ctxEnd < doc.content.length ? '...' : '');
        }
      }
      
      excerpt = highlightMatch(excerpt, query);
      const tags = Array.isArray(doc.tags) ? doc.tags : (doc.tags ? doc.tags.split(',').map(t => t.trim()) : []);
      
      html += `
        <li class="pagefind-ui__result">
          <div class="pagefind-ui__result-inner">
            <h3 class="pagefind-ui__result-title">
              <a class="pagefind-ui__result-link" href="${doc.url}">${title}</a>
            </h3>
            ${excerpt ? `<p class="pagefind-ui__result-excerpt">${excerpt}</p>` : ''}
            ${tags.length > 0 ? `<p class="pagefind-ui__result-tags">${tags.map(t => `<span class="tag">${t}</span>`).join(' ')}</p>` : ''}
          </div>
        </li>
      `;
    });
    
    container.innerHTML = html;
  }

  document.addEventListener('DOMContentLoaded', function () {
    initSearch();
    
    const input = document.getElementById('search-input');
    let debounceTimer;
    
    input.addEventListener('input', function() {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const query = this.value;
        const results = search(query);
        renderResults(results, query);
      }, 200);
    });
  });
</script>

<div class="search-container">
  <input type="text" id="search-input" placeholder="搜索笔记内容..." autocomplete="off">
</div>

<div id="search-results"></div>

<style>
  .search-container {
    margin-bottom: 24px;
  }

  #search-input {
    width: 100%;
    height: 58px;
    padding: 0 64px 0 54px;
    font-size: 18px;
    font-weight: 600;
    border: 1px solid var(--global-border-color);
    border-radius: 8px;
    background: var(--global-bg-color);
    color: var(--global-text-color);
    font-family: var(--body-font);
    position: relative;
    box-sizing: border-box;
  }

  #search-input::placeholder {
    opacity: 0.35;
  }

  #search-input:focus {
    outline: none;
    border-color: var(--global-theme-color);
  }

  .search-container {
    position: relative;
  }

  .search-container::before {
    content: "";
    position: absolute;
    left: 20px;
    top: 50%;
    transform: translateY(-50%);
    width: 18px;
    height: 18px;
    background-color: var(--global-text-color);
    opacity: 0.6;
    -webkit-mask-image: url("data:image/svg+xml,%3Csvg width='18' height='18' viewBox='0 0 18 18' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12.7549 11.255H11.9649L11.6849 10.985C12.6649 9.845 13.2549 8.365 13.2549 6.755C13.2549 3.165 10.3449 0.255005 6.75488 0.255005C3.16488 0.255005 0.254883 3.165 0.254883 6.755C0.254883 10.345 3.16488 13.255 6.75488 13.255C8.36488 13.255 9.84488 12.665 10.9849 11.685L11.2549 11.965V12.755L16.2549 17.745L17.7449 16.255L12.7549 11.255ZM6.75488 11.255C4.26488 11.255 2.25488 9.245 2.25488 6.755C2.25488 4.26501 4.26488 2.255 6.75488 2.255C9.24488 2.255 11.2549 4.26501 11.2549 6.755C11.2549 9.245 9.24488 11.255 6.75488 11.255Z' fill='%23000000'/%3E%3C/svg%3E%0A");
    mask-image: url("data:image/svg+xml,%3Csvg width='18' height='18' viewBox='0 0 18 18' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12.7549 11.255H11.9649L11.6849 10.985C12.6649 9.845 13.2549 8.365 13.2549 6.755C13.2549 3.165 10.3449 0.255005 6.75488 0.255005C3.16488 0.255005 0.254883 3.165 0.254883 6.755C0.254883 10.345 3.16488 13.255 6.75488 13.255C8.36488 13.255 9.84488 12.665 10.9849 11.685L11.2549 11.965V12.755L16.2549 17.745L17.7449 16.255L12.7549 11.255ZM6.75488 11.255C4.26488 11.255 2.25488 9.245 2.25488 6.755C2.25488 4.26501 4.26488 2.255 6.75488 2.255C9.24488 2.255 11.2549 4.26501 11.2549 6.755C11.2549 9.245 9.24488 11.255 6.75488 11.255Z' fill='%23000000'/%3E%3C/svg%3E%0A");
    -webkit-mask-size: 100%;
    mask-size: 100%;
    z-index: 1;
    pointer-events: none;
  }

  #search-results {
    margin-top: 16px;
  }

  #search-results ul {
    list-style-type: none;
    padding: 0;
    margin: 0;
  }

  .pagefind-ui__result {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding: 24px 0;
    border-top: 1px solid var(--global-border-color);
  }

  .pagefind-ui__result:last-of-type {
    border-bottom: 1px solid var(--global-border-color);
  }

  .pagefind-ui__result-inner {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .pagefind-ui__result-title {
    font-weight: 700;
    font-size: 18px;
    margin: 0;
  }

  .pagefind-ui__result-title .pagefind-ui__result-link {
    color: var(--global-text-color);
    text-decoration: none;
  }

  .pagefind-ui__result-title .pagefind-ui__result-link:hover {
    text-decoration: underline;
  }

  .pagefind-ui__result-excerpt {
    font-size: 15px;
    margin: 4px 0 0;
    line-height: 1.9;
  }

  .pagefind-ui__result-tags {
    margin-top: 8px;
    font-size: 13px;
    opacity: 0.7;
  }

  .pagefind-ui__result-tags .tag {
    margin-right: 8px;
    padding: 2px 8px;
    background: rgba(var(--global-theme-color-rgb, 26, 115, 232), 0.1);
    border-radius: 4px;
  }

  .pagefind-ui__message {
    font-size: 15px;
    padding: 16px 0;
    font-weight: 600;
    color: var(--global-text-color);
    opacity: 0.7;
  }

  mark.pagefind-ui__result-highlight {
    background-color: rgba(var(--global-theme-color-rgb, 26, 115, 232), 0.18);
    color: inherit;
    padding: 0.05em 0.2em;
    border-radius: 3px;
  }
</style>