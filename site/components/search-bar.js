export class SearchBar extends HTMLElement {
	connectedCallback() {
		const params = new URLSearchParams(window.location.search);
		const initial = params.get("q") || "";

		this.innerHTML = `
			<form class="search-form">
				<input
					type="text"
					class="search-input"
					placeholder="Search or type a command..."
					value="${initial}"
					autocomplete="off"
					autofocus
				/>
				<button type="submit" class="search-submit">Go</button>
			</form>
		`;

		const form = this.querySelector(".search-form");
		const input = this.querySelector(".search-input");

		form.addEventListener("submit", (e) => {
			e.preventDefault();
			const query = input.value.trim();
			if (!query) return;
			const url = new URL(window.location);
			url.searchParams.set("q", query);
			history.pushState({}, "", url);
			this._dispatch(query);
		});

		// On back/forward navigation, re-fire search
		window.addEventListener("popstate", () => {
			const q = new URLSearchParams(window.location.search).get("q") || "";
			input.value = q;
			if (q) this._dispatch(q);
		});

		if (initial) this._dispatch(initial);
	}

	_dispatch(query) {
		document.dispatchEvent(new CustomEvent("site:search", { detail: { query } }));
	}
}
