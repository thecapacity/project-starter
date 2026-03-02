export class SiteFooter extends HTMLElement {
	connectedCallback() {
		this.innerHTML = `<p>&copy; ${new Date().getFullYear()}</p>`;
	}
}
