/*--------------------
Legacy Concierge Custom JavaScript Compiler
--------------------*/

import { initNavbar } from './components/navbar.js';

/* Initialize after Webflow finishes loading */
window.Webflow ||= [];
window.Webflow.push(() => {
  initNavbar();
}
