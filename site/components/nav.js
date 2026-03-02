export class SiteNav extends HTMLElement {
	connectedCallback() {
		this.innerHTML = `
			<a href="/">Home</a>
			<a href="/about.html">About</a>`;
	}
}
