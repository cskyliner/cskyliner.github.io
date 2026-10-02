const root = document.getElementById("site-search");
const input = document.getElementById("search-input");
const results = document.getElementById("search-results");
const status = document.getElementById("search-status");
const more = document.getElementById("search-more");
const retry = document.getElementById("search-retry");
const filters = document.getElementById("search-filters");
let attempts = 0;
let totals = {};
const keys = { type: "Content type", course: "Course", topic: "Topic" };
let engine,
  matches = [],
  shown = 0,
  revision = 0,
  timer,
  composing = false;
const node = (tag, text, className) => {
  const element = document.createElement(tag);
  if (text != null) element.textContent = text;
  if (className) element.className = className;
  return element;
};
function link(title, url) {
  const element = node("a", title);
  const destination = new URL(url, location.href);
  if (destination.origin === location.origin) element.href = destination.href;
  return element;
}
function selected() {
  const state = {};
  for (const key of Object.keys(keys)) state[key] = [...filters.querySelectorAll(`input[data-filter="${key}"]:checked`)].map((item) => item.value);
  return state;
}
function restore() {
  const parameters = new URLSearchParams(location.search);
  input.value = parameters.get("q") || "";
  for (const box of filters.querySelectorAll("input")) box.checked = parameters.getAll(box.dataset.filter).includes(box.value);
}
function persist() {
  const url = new URL(location.href);
  for (const key of ["q", ...Object.keys(keys)]) url.searchParams.delete(key);
  if (input.value.trim()) url.searchParams.set("q", input.value.trim());
  for (const [key, values] of Object.entries(selected())) for (const value of values) url.searchParams.append(key, value);
  if (url.href !== location.href) history.pushState(null, "", url);
}
function excerpt(html) {
  const element = node("p", null, "search-excerpt");
  // Pagefind escapes source text before adding its own <mark> elements.
  element.innerHTML = html || "";
  return element;
}
function card(data) {
  const article = node("article", null, "search-result");
  const title = node("h2");
  title.append(link(data.meta.title || "Untitled", data.url));
  article.append(title);
  const labels = [...(data.filters.type || []), ...(data.filters.topic || [])];
  article.append(node("p", labels.join(" · "), "search-labels"));
  const sections = data.sub_results || [];
  const sectionCard = (section) => {
    const block = node("div", null, "search-section");
    if (section.url.includes("#")) block.append(link(section.title, section.url));
    block.append(excerpt(section.excerpt));
    return block;
  };
  if (!sections.length) article.append(excerpt(data.excerpt));
  for (const section of sections.slice(0, 3)) article.append(sectionCard(section));
  if (sections.length > 3) {
    const details = node("details");
    details.append(node("summary", `Show ${sections.length - 3} more matching sections`));
    for (const section of sections.slice(3)) details.append(sectionCard(section));
    article.append(details);
  }
  return article;
}
async function loadMore(token = revision) {
  more.disabled = true;
  try {
    const end = Math.min(shown + 10, matches.length);
    const data = await Promise.all(matches.slice(shown, end).map((match) => match.data()));
    if (token !== revision) return;
    for (const result of data) results.append(card(result));
    shown = end;
    more.hidden = shown >= matches.length;
  } catch (error) {
    if (token === revision) fail(error);
  } finally {
    more.disabled = false;
  }
}
function fail(error) {
  console.error("Search failed", error);
  status.textContent = "Search could not load. Please retry.";
  retry.hidden = false;
}
function searchTerm(query) {
  if (/^\s*".+"\s*$/.test(query) || !/[\u4e00-\u9fff]/.test(query) || !Intl.Segmenter) return query;
  return [...new Intl.Segmenter("zh", { granularity: "word" }).segment(query)]
    .filter((part) => part.isWordLike)
    .map((part) => part.segment)
    .join(" ");
}
async function search(save = true) {
  if (!engine) return;
  const token = ++revision;
  if (save) persist();
  retry.hidden = true;
  more.hidden = true;
  results.replaceChildren();
  const state = selected();
  const active = Object.entries(state).filter(([, values]) => values.length);
  const query = input.value.trim();
  if (!query && !active.length) {
    for (const box of filters.querySelectorAll("input")) {
      box.closest("label").querySelector("span").textContent = `${box.value} (${totals[box.dataset.filter]?.[box.value] ?? 0})`;
    }
    status.textContent = "Enter a search term or select a filter.";
    return;
  }
  status.textContent = "Searching…";
  try {
    const response = await engine.search(query ? searchTerm(query) : null, {
      filters: Object.fromEntries(active.map(([key, values]) => [key, { any: values }])),
    });
    if (token !== revision) return;
    matches = response.results;
    shown = 0;
    status.textContent = matches.length
      ? `${matches.length} matching ${matches.length === 1 ? "page" : "pages"}`
      : "No results. Try another term or clear a filter.";
    for (const box of filters.querySelectorAll("input")) {
      const count = response.filters?.[box.dataset.filter]?.[box.value] ?? 0;
      box.closest("label").querySelector("span").textContent = `${box.value} (${count})`;
    }
    await loadMore(token);
  } catch (error) {
    if (token === revision) fail(error);
  }
}
async function initialize() {
  status.textContent = "Loading search…";
  retry.hidden = true;
  try {
    const bundle = new URL(root.dataset.bundle, location.href);
    bundle.searchParams.set("attempt", String(++attempts));
    engine = await import(bundle.href);
    await engine.init();
    const available = await engine.filters();
    totals = available;
    filters.replaceChildren();
    for (const [key, label] of Object.entries(keys)) {
      if (!available[key]) continue;
      const group = node("fieldset");
      group.append(node("legend", label));
      for (const [value, count] of Object.entries(available[key]).sort(([a], [b]) => a.localeCompare(b))) {
        const option = node("label");
        const box = node("input");
        box.type = "checkbox";
        box.value = value;
        box.dataset.filter = key;
        option.append(box, node("span", `${value} (${count})`));
        group.append(option);
      }
      filters.append(group);
    }
    restore();
    await search(false);
  } catch (error) {
    engine = null;
    fail(error);
  }
}
input.addEventListener("compositionstart", () => {
  composing = true;
  clearTimeout(timer);
  ++revision;
});
input.addEventListener("compositionend", () => {
  composing = false;
  search();
});
input.addEventListener("input", () => {
  if (composing) return;
  ++revision;
  clearTimeout(timer);
  timer = setTimeout(() => search(), 200);
});
filters.addEventListener("change", () => {
  clearTimeout(timer);
  search();
});
more.addEventListener("click", () => loadMore());
retry.addEventListener("click", () => (engine ? search(false) : initialize()));
document.getElementById("search-clear").addEventListener("click", () => {
  clearTimeout(timer);
  input.value = "";
  for (const box of filters.querySelectorAll("input")) box.checked = false;
  search();
  input.focus();
});
window.addEventListener("popstate", () => {
  clearTimeout(timer);
  restore();
  search(false);
});
initialize();
