import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

// Run the same browser search API against local files, without an HTTP server.
const site = path.resolve("_site");
globalThis.fetch = async (url) => new Response(fs.readFileSync(path.join(site, new URL(url).pathname)), { status: 200 });
const source = fs.readFileSync(path.join(site, "pagefind/pagefind.js"), "utf8");
const pagefind = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
await pagefind.options({ basePath: "http://local.test/pagefind/", baseUrl: "/" });
await pagefind.init("zh");
const querySource = fs.readFileSync(path.join(site, "assets/js/search-query.js"), "utf8");
const { searchNotes } = await import(`data:text/javascript;base64,${Buffer.from(querySource).toString("base64")}`);
const filters = await pagefind.filters();
assert.equal(filters.type.Notes, 6);
assert.equal(filters.type.Projects, 4);
assert.equal(filters.type.About, 1);
assert.equal(filters.type.CV, 1);
assert.equal(filters.course.AIIntro, 3);
assert.equal(filters.course.CV, 3);

async function search(term, options) {
  const response = await pagefind.search(term, options);
  return Promise.all(response.results.map((result) => result.data()));
}
const all = await search(null);
assert.equal(all.length, 12);
for (const result of all) {
  assert(!/\/search\/|\/books\/|\/news\/|\/category\/|\/tag\//.test(result.url));
  assert(!result.content.includes("Enjoy Reading This Article"));
  const html = fs.readFileSync(path.join(site, result.url, "index.html"), "utf8");
  assert(!html.includes('http-equiv="refresh"'));
}
const notes = await search(null, { filters: { type: "Notes" } });
assert.equal(notes.length, 6);
for (const note of notes) {
  const html = fs.readFileSync(path.join(site, note.url, "index.html"), "utf8");
  assert(html.includes('<html lang="zh-CN">'));
}
const projectList = fs.readFileSync(path.join(site, "projects/index.html"), "utf8");
for (const slug of ["chronosflow", "gobang", "neural-physics-subspaces"]) {
  assert(fs.existsSync(path.join(site, "projects", slug, "index.html")));
}
for (const repository of ["ChronosFlow", "GoBang", "Neural-Physics-Subspaces"]) {
  assert(projectList.toLowerCase().includes(`href="https://github.com/cskyliner/${repository.toLowerCase()}"`));
}
const union = await search(null, { filters: { course: { any: ["AIIntro", "CV"] }, topic: "NLP" } });
assert.equal(union.length, 2);
const positional = await search("位置 编码");
assert(positional.some((result) => result.meta.title.includes("RNN")));
for (const result of positional) {
  assert(result.excerpt.includes("<mark>"));
  const html = fs.readFileSync(path.join(site, result.url, "index.html"), "utf8");
  for (const section of result.sub_results) {
    const fragment = decodeURIComponent(new URL(section.url, "http://local.test").hash.slice(1));
    if (fragment) assert(html.includes(`id="${fragment}"`), `Missing anchor ${fragment}`);
  }
}
const englishTail = await search("CS231n");
const generation = englishTail.find((result) => result.meta.title.includes("Image Generation"));
assert(generation);
const plain = generation.content.replace(/\u200b/g, "");
assert(plain.indexOf("CS231n") > 5000, "Regression query must occur after 5000 characters");
assert(generation.sub_results.some((section) => section.url.includes("#references")));
const chineseTail = await search("清晰 似然");
assert(generation.content.replace(/\u200b/g, "").lastIndexOf("清晰") > 5000);
assert(
  chineseTail.some(
    (result) => result.meta.title.includes("Image Generation") && result.sub_results.some((section) => section.url.includes("summary"))
  )
);
assert.equal((await search('"zzzznomatchtestzzzz"')).length, 0);
async function queryNotes(query) {
  const response = await searchNotes(pagefind, query);
  return Promise.all(response.results.map((result) => result.data()));
}
const implicit = await queryNotes("隐式");
assert.deepEqual(
  implicit.map((result) => result.meta.title),
  ["Computer Vision: Image Generation"]
);
assert(implicit[0].excerpt.replace(/<\/?mark>/g, "").includes("隐式"));
assert(!implicit[0].sub_results.some((section) => section.title === "总结" && !section.excerpt.replace(/<\/?mark>/g, "").includes("隐式")));
assert((await queryNotes("隐 式")).some((result) => result.meta.title.includes("RNN")));
assert.deepEqual(
  (await queryNotes("Transformer 位置编码")).map((result) => result.meta.title),
  ["Introduction to AI: RNN and Transformer"]
);
assert((await queryNotes("位置编码")).every((result) => result.content.includes("位置编码")));
assert((await queryNotes("清晰 似然")).some((result) => result.meta.title.includes("Image Generation")));
assert.equal((await queryNotes("不存在的完整中文词组")).length, 0);
assert((await queryNotes("GoBang")).every((result) => result.filters.type.includes("Notes")));
for (const query of ["transfer", "TRANSFER", "contrastive", "nonexistentwordxyz", "transfer 隐式", "Transformer transfer"]) {
  assert.equal((await queryNotes(query)).length, 0, `Unmatched English query must not fall back to initials: ${query}`);
}
for (const query of ["Transformer", "transformer", "trans", "VAE", "GAN", "CS231n"]) {
  const results = await queryNotes(query);
  assert(results.length > 0, `Existing English query must match: ${query}`);
  for (const result of results) {
    assert(result.content.toLowerCase().includes(query.toLowerCase()));
    for (const section of result.sub_results) {
      const highlights = [...section.excerpt.matchAll(/<mark>(.*?)<\/mark>/g)].map((match) => match[1].toLowerCase());
      assert(
        highlights.some((text) => text.includes(query.toLowerCase())),
        `Excerpt must highlight the English query: ${query}`
      );
    }
  }
}
const englishPhrase = await queryNotes('"Latent Diffusion"');
assert.deepEqual(
  englishPhrase.map((result) => result.meta.title),
  ["Computer Vision: Image Generation"]
);
const transformer = (await queryNotes("Transformer")).find((result) => result.meta.title.includes("RNN"));
assert(transformer.sub_results.length > 1, "English searches must retain multiple chapter hits");
assert((await queryNotes("VAE GAN")).some((result) => result.meta.title.includes("Image Generation")));
console.log("Search acceptance passed: 12 pages, full text beyond 5000 characters, Chinese/English, excerpts, anchors, filters, exclusions.");
