export class SiteSidebar extends HTMLElement {
	connectedCallback() {
		this.innerHTML = `
			<button class="sidebar-toggle" aria-label="Toggle sidebar" aria-expanded="false">&#9776;</button>
			<aside class="sidebar-panel" aria-hidden="true">
				<h2>Settings</h2>
				<ul>
					<li><label><input type="checkbox" /> Show previews</label></li>
					<li><label><input type="checkbox" /> Safe search</label></li>
					<li>
						<label>Results per page
							<select>
								<option>10</option>
								<option>25</option>
								<option>50</option>
							</select>
						</label>
					</li>
				</ul>
			</aside>
		`;

		const btn = this.querySelector(".sidebar-toggle");
		const panel = this.querySelector(".sidebar-panel");

		btn.addEventListener("click", (e) => {
			e.stopPropagation();
			const isOpen = panel.getAttribute("aria-hidden") === "false";
			panel.setAttribute("aria-hidden", isOpen ? "true" : "false");
			btn.setAttribute("aria-expanded", isOpen ? "false" : "true");
		});

		document.addEventListener("click", (e) => {
			if (!this.contains(e.target)) {
				panel.setAttribute("aria-hidden", "true");
				btn.setAttribute("aria-expanded", "false");
			}
		});
	}
}
