import { renderHeader } from "./components/header.js";
import { renderNav } from "./components/nav.js";
import { renderFooter } from "./components/footer.js";

document.getElementById("site-header").replaceWith(renderHeader());
document.getElementById("site-nav").replaceWith(renderNav());
document.getElementById("site-footer").replaceWith(renderFooter());
