import { searchNotes } from "./search-query.js";

const root = document.getElementById("site-search");
const input = document.getElementById("search-input");
const results = document.getElementById("search-results");
const status = document.getElementById("search-status");
const more = document.getElementById("search-more");
const retry = document.getElementById("search-retry");
let attempts = 0;
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
function restore() {
  const parameters = new URLSearchParams(location.search);
  input.value = parameters.get("q") || "";
}
function persist() {
  const url = new URL(location.href);
  for (const key of ["q", "type", "course", "topic"]) url.searchParams.delete(key);
  if (input.value.trim()) url.searchParams.set("q", input.value.trim());
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
async function search(save = true) {
  if (!engine) return;
  const token = ++revision;
  if (save) persist();
  retry.hidden = true;
  more.hidden = true;
  results.replaceChildren();
  const query = input.value.trim();
  if (!query) {
    status.textContent = "";
    return;
  }
  status.textContent = "Searching…";
  try {
    const response = await searchNotes(engine, query);
    if (token !== revision) return;
    matches = response.results;
    shown = 0;
    status.textContent = matches.length
      ? `${matches.length} matching ${matches.length === 1 ? "page" : "pages"}`
      : "No results. Try another search term.";
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
more.addEventListener("click", () => loadMore());
retry.addEventListener("click", () => (engine ? search(false) : initialize()));
window.addEventListener("popstate", () => {
  clearTimeout(timer);
  restore();
  search(false);
});
initialize();
