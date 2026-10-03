const catalogs = new WeakMap();
const hasChinese = (text) => /\p{Script=Han}/u.test(text);

async function catalog(engine) {
  if (!catalogs.has(engine)) {
    const promise = engine
      .search(null, { filters: { type: "Notes" } })
      .then(async ({ results }) => Promise.all(results.map(async (result) => ({ id: result.id, data: await result.data() }))));
    catalogs.set(engine, promise);
    promise.catch(() => catalogs.delete(engine));
  }
  return catalogs.get(engine);
}

// Use the index's own word boundaries instead of a second, incompatible tokenizer.
// Quotes enforce adjacency in Pagefind; explicit query spaces separate AND terms.
function phrases(raw, term) {
  let text = "";
  const offsets = [];
  for (let i = 0; i < raw.length; i++) {
    if (raw[i] === "\u200b") continue;
    offsets.push(i);
    text += raw[i];
  }
  const variants = new Set();
  let position = text.toLowerCase().indexOf(term.toLowerCase());
  while (position !== -1) {
    let start = offsets[position];
    let end = offsets[position + term.length - 1] + 1;
    while (start > 0 && !/[\s\u200b]/u.test(raw[start - 1])) start--;
    while (end < raw.length && !/[\s\u200b]/u.test(raw[end])) end++;
    variants.add(
      `"${raw
        .slice(start, end)
        .replace(/[\s\u200b]+/gu, " ")
        .replace(/"/g, "")
        .trim()}"`
    );
    position = text.toLowerCase().indexOf(term.toLowerCase(), position + term.length);
  }
  return variants;
}

export async function searchNotes(engine, query) {
  const notes = await catalog(engine);
  const terms = [...query.matchAll(/"([^"]+)"|(\S+)/gu)].map((match) => ({ text: match[1] || match[2], quoted: !!match[1] }));
  // Prefer the most specific Chinese term when choosing excerpts and ranking.
  terms.sort((a, b) => Number(hasChinese(b.text)) - Number(hasChinese(a.text)) || b.text.length - a.text.length);
  const groups = await Promise.all(
    terms.map(async ({ text, quoted }) => {
      // Validate every language before searching: Pagefind otherwise shortens
      // unmatched words (e.g. "transfer") down to unrelated tokens (e.g. "t").
      const candidates = notes.filter(({ data }) => data.content.toLowerCase().includes(text.toLowerCase()));
      const ids = new Set(candidates.map(({ id }) => id));
      if (!ids.size) return [];
      if (!hasChinese(text) && !quoted) {
        // Keep useful prefix completion and multiple chapter hits, but reject
        // any fallback locations that do not highlight the actual input.
        const response = await engine.search(text, { filters: { type: "Notes" } });
        const highlightsTerm = (html) =>
          [...html.matchAll(/<mark>(.*?)<\/mark>/g)].some((match) => match[1].toLowerCase().includes(text.toLowerCase()));
        const matches = await Promise.all(
          response.results
            .filter(({ id }) => ids.has(id))
            .map(async (result) => {
              const data = await result.data();
              const sections = data.sub_results.filter((section) => highlightsTerm(section.excerpt));
              if (!sections.length && !highlightsTerm(data.excerpt)) return null;
              const accurate = {
                ...data,
                sub_results: sections,
                excerpt: highlightsTerm(data.excerpt) ? data.excerpt : sections[0].excerpt,
              };
              return { ...result, data: async () => accurate };
            })
        );
        const results = matches.filter(Boolean);
        if (results.length) return results;
      }
      const variants = new Set(candidates.flatMap(({ data }) => [...phrases(data.raw_content, text)]));
      const responses = await Promise.all([...variants].map((phrase) => engine.search(phrase, { filters: { type: "Notes" } })));
      return [
        ...new Map(
          responses
            .flatMap(({ results }) => results)
            .filter(({ id }) => ids.has(id))
            .map((result) => [result.id, result])
        ).values(),
      ];
    })
  );
  const results = (groups[0] || []).filter(({ id }) => groups.every((group) => group.some((result) => result.id === id)));
  return { results };
}
