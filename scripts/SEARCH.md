# Full-text search

Search uses Pagefind Extended 1.4.0 over the production HTML. The browser UI is English; one forced `zh` index searches Chinese and English together. Actual HTML language remains page-specific.

```sh
npm ci
JEKYLL_ENV=production bundle exec jekyll build
rm -rf _site/_pages
npm run build:search
npm run test:search
npx --no-install purgecss -c purgecss.config.js
python3 -m http.server 8080 --directory _site
```

Open `/search/`. Jekyll rebuilds remove the generated bundle; run `build:search` after each rebuild. The build script adds IDs only to headings that do not already have one. Existing TOC anchors are preserved.

Posts are searchable automatically. To opt in another page, set `search: true` and `search_type: About`, `CV`, or `Projects`. Templates expose `categories` as Course (except `notes`) and `tags` as Topic. The projects collection outputs detail pages, while `card_url` controls the existing card's external destination.

The Search page searches Notes only and shows a single input with contextual results. Type, Course, and Topic metadata remains in the index for future use, but the page does not expose filter controls or tag labels.

Continuous Chinese terms match continuous text. For example, `隐式` matches that phrase, while `隐 式` requires both terms anywhere in the same note. The query helper reads the six notes' cached Pagefind fragments, finds literal occurrences, and uses the index's own token boundaries to issue quoted phrase queries. This avoids incompatible browser tokenization and Pagefind's broad prefix fallback; excerpts and chapter links still come from Pagefind.

Search URLs preserve `q`; refresh and browser history restore it. Quoted phrases remain supported. The empty page shows only the input.

The Obsidian importer reads `lang` from each manifest note, defaulting to `zh-CN`. Changing a post's English title does not change its body language.

The search page's CSP explicitly permits WebAssembly compilation for Pagefind. It does not enable JavaScript `eval`. Search assets and indexes are served locally without a search CDN or backend.
