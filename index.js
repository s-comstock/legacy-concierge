/*--------------------
Legacy Concierge Custom JavaScript Compiler
--------------------*/

import { initNavbar } from './navbar.js';

/* Initialize after Webflow finishes loading */
window.Webflow ||= [];
window.Webflow.push(() => {
  initNavbar();
}
