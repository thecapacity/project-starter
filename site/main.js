import { SiteHeader } from "./components/header.js";
import { SiteNav } from "./components/nav.js";
import { SiteFooter } from "./components/footer.js";

// Register once — any page that imports this file gets <site-header>,
// <site-nav>, and <site-footer> as real HTML tags.
customElements.define("site-header", SiteHeader);
customElements.define("site-nav", SiteNav);
customElements.define("site-footer", SiteFooter);
