import { SiteHeader } from "./components/header.js";
import { SiteNav } from "./components/nav.js";
import { SiteFooter } from "./components/footer.js";
import { SiteSidebar } from "./components/sidebar.js";
import { SearchBar } from "./components/search-bar.js";
import { ResultsFeed } from "./components/results-feed.js";

// Register once: any page importing this file gets all `customElements` defined
customElements.define("site-header", SiteHeader);
customElements.define("site-nav", SiteNav);
customElements.define("site-footer", SiteFooter);
customElements.define("site-sidebar", SiteSidebar);
customElements.define("search-bar", SearchBar);
customElements.define("results-feed", ResultsFeed);
