/**
 * Site footer component.
 * @returns {HTMLElement}
 */
export function renderFooter() {
  const el = document.createElement("footer");
  el.id = "site-footer";
  el.innerHTML = `<p>&copy; ${new Date().getFullYear()}</p>`;
  return el;
}
