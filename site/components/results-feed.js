export class ResultsFeed extends HTMLElement {
	connectedCallback() {
		this.innerHTML = `<p class="results-hint">Enter a search or command above.</p>`;

		document.addEventListener("site:search", (e) => {
			this.render(e.detail.query);
		});
	}

	render(query) {
		const isCommand = query.startsWith("/");

		if (isCommand) {
			this.innerHTML = `
				<p class="results-hint">Command: <code>${query}</code></p>
				<p>Command handling not yet implemented.</p>
			`;
			return;
		}

		// Placeholder results — replace with real fetch() calls
		const results = Array.from({ length: 8 }, (_, i) => ({
			title: `Result ${i + 1} for "${query}"`,
			url: `https://example.com/result-${i + 1}`,
			snippet: `Placeholder snippet ${i + 1}. Replace this with real data from your worker or API.`,
		}));

		this.innerHTML = `
			<p class="results-count"><strong>${results.length}</strong> results for <em>${query}</em></p>
			<ul class="results-list">
				${results
					.map(
						(r) => `
					<li class="result-card">
						<h3><a href="${r.url}">${r.title}</a></h3>
						<span class="result-url">${r.url}</span>
						<p>${r.snippet}</p>
					</li>
				`,
					)
					.join("")}
			</ul>
		`;
	}
}
