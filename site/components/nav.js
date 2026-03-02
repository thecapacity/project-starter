/**
 * Site navigation component.
 * @param {object} [opts]
 * @param {Array<{label: string, href: string}>} [opts.links] - Nav link definitions
 * @returns {HTMLElement}
 */
export function renderNav({ links = [{ label: "Home", href: "/" }] } = {}) {
  const el = document.createElement("nav");
  el.id = "site-nav";
  el.innerHTML = links
    .map((l) => `<a href="${l.href}">${l.label}</a>`)
    .join("");
  return el;
}
