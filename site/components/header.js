export class SiteHeader extends HTMLElement {
	connectedCallback() {
		this.innerHTML = `<a class="site-title" href="/">Project Starter</a>`;
	}
}
