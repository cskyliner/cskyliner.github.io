// Keep wide article tables scrollable without changing native table semantics.
document.querySelectorAll(".post article table, .post d-article table").forEach((table) => {
  if (table.closest(".table-scroll, .table-responsive, .bootstrap-table") || table.matches('[data-toggle="table"]')) return;

  const wrapper = document.createElement("div");
  wrapper.className = "table-scroll";
  wrapper.setAttribute("role", "region");
  wrapper.setAttribute("aria-label", table.caption?.textContent.trim() || "Scrollable table");
  wrapper.tabIndex = 0;
  table.before(wrapper);
  wrapper.append(table);
});
