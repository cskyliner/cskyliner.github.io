// Ensure every searchable heading has a stable anchor before Pagefind reads HTML.
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const root = path.resolve("_site");
function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (!["pagefind", "_pages"].includes(entry.name)) walk(file);
    } else if (entry.name.endsWith(".html")) {
      let html = fs.readFileSync(file, "utf8");
      if (!html.includes("data-pagefind-body")) continue;
      const ids = new Set([...html.matchAll(/\bid=["']([^"']+)["']/g)].map((match) => match[1]));
      let number = 0;
      html = html.replace(/<h([1-6])\b([^>]*)>/gi, (heading, level, attributes) => {
        if (/\bid\s*=/.test(attributes)) return heading;
        let id;
        do {
          id = `search-section-${++number}`;
        } while (ids.has(id));
        ids.add(id);
        return `<h${level}${attributes} id="${id}">`;
      });
      fs.writeFileSync(file, html);
    }
  }
}
walk(root);
execFileSync(path.resolve("node_modules/.bin/pagefind"), ["--site", root, "--force-language", "zh"], { stdio: "inherit" });
