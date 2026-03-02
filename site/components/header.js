/**
 * Site header component.
 * @param {object} [opts]
 * @param {string} [opts.title] - Brand/site name
 * @returns {HTMLElement}
 */
export function renderHeader({ title = "Project Starter" } = {}) {
  const el = document.createElement("header");
  el.id = "site-header";
  el.innerHTML = `<a class="site-title" href="/">${title}</a>`;
  return el;
}
