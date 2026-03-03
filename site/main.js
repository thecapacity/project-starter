import { SiteHeader } from "./components/header.js";
import { SiteNav } from "./components/nav.js";
import { SiteFooter } from "./components/footer.js";

// Register once: any page importing this file gets all `customElements` defined
customElements.define("site-header", SiteHeader);
customElements.define("site-nav", SiteNav);
customElements.define("site-footer", SiteFooter);
