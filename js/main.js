// @ts-check
// Entry point. Order matches the old app.js; scroll goes last because it measures the page.
import { root } from './utils.js';
import { initNav, initMagnets } from './navigation.js';
import { initGallery } from './animations/lightbox.js';
import { initReveal } from './reveal.js';
import { initContact } from './contact.js';
import { initScrollFx } from './animations/scroll-fx.js';
import { initScroll } from './scroll.js';

root.classList.add('js');

const teardown = [initNav(), initMagnets(), initGallery(), initReveal(), initContact(), initScrollFx(), initScroll()];

// handy in the console while debugging: window.__destroySite()
window.__destroySite = () => teardown.forEach(fn => fn && fn());
