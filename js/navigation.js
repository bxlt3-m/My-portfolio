// @ts-check
import { $, $$, clamp, canMove } from './utils.js';

/** mobile menu + glass bar highlight. returns a destroy fn */
export function initNav() {
  const ac = new AbortController();
  const { signal } = ac;
  const header = $('.site-header');
  const bar = $('.glass-bar');
  const menu = $('#menu');
  const nav = $('#mobile-nav');
  let t = 0; // close timer

  /** @param {boolean} open */
  function setMenu(open) {
    clearTimeout(t);
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (open) {
      nav.hidden = false;
      // two rAFs so the transition actually runs after un-hiding
      requestAnimationFrame(() => requestAnimationFrame(() => nav.classList.add('is-open')));
    } else {
      nav.classList.remove('is-open');
      t = window.setTimeout(
        () => {
          nav.hidden = true;
        },
        canMove() ? 220 : 0
      );
    }
  }
  const closeMenu = () => {
    if (menu.getAttribute('aria-expanded') === 'true') setMenu(false);
  };

  menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'), { signal });
  $$('#mobile-nav a').forEach(a => a.addEventListener('click', closeMenu, { signal }));
  addEventListener(
    'keydown',
    e => {
      if (e.key === 'Escape') closeMenu();
    },
    { signal }
  );
  addEventListener(
    'pointerdown',
    e => {
      if (!header.contains(/** @type {Node} */ (e.target))) closeMenu();
    },
    { signal }
  );
  // resizing to desktop with the menu open left it stuck, so reset
  matchMedia('(min-width: 601px)').addEventListener(
    'change',
    e => {
      if (e.matches) {
        closeMenu();
        nav.hidden = true;
      }
    },
    { signal }
  );

  // glass highlight follows the cursor (mouse only)
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    bar.addEventListener(
      'pointermove',
      e => {
        const r = bar.getBoundingClientRect();
        bar.style.setProperty('--mx', `${e.clientX - r.left}px`);
        bar.style.setProperty('--my', `${e.clientY - r.top}px`);
      },
      { passive: true, signal }
    );
  }

  return () => {
    ac.abort();
    clearTimeout(t);
  };
}

// the liquid cta on mobile. touch/pen only, desktop keeps the plain pill
/** @param {HTMLElement} el @param {number} x @param {number} y */
function pull(el, x, y) {
  const r = el.getBoundingClientRect();
  const nx = clamp((x - (r.left + r.width / 2)) / (r.width / 2), -1.4, 1.4);
  const ny = clamp((y - (r.top + r.height / 2)) / (r.height / 2), -1.8, 1.8);
  el.style.setProperty('--tx', `${(nx * 7).toFixed(2)}px`);
  el.style.setProperty('--ty', `${(ny * 5).toFixed(2)}px`);
  el.style.setProperty('--ox', `${(nx * 6).toFixed(2)}px`);
  el.style.setProperty('--oy', `${(ny * 4).toFixed(2)}px`);
  el.style.setProperty('--sx', `${x - r.left}px`);
  el.style.setProperty('--sy', `${y - r.top}px`);
}
/** @param {HTMLElement} el */
function release(el) {
  el.classList.remove('is-live');
  ['--tx', '--ty', '--ox', '--oy', '--sx', '--sy'].forEach(p => el.style.removeProperty(p));
}

export function initMagnets() {
  const ac = new AbortController();
  const { signal } = ac;
  const els = $$('[data-magnetic]');
  els.forEach(el => {
    let down = false;
    el.addEventListener(
      'pointerdown',
      e => {
        if (e.pointerType === 'mouse' || !canMove()) return;
        down = true;
        el.classList.add('is-live');
        pull(el, e.clientX, e.clientY);
      },
      { signal }
    );
    el.addEventListener(
      'pointermove',
      e => {
        if (down && canMove()) pull(el, e.clientX, e.clientY);
      },
      { signal }
    );
    ['pointerup', 'pointercancel'].forEach(ev =>
      el.addEventListener(
        ev,
        () => {
          down = false;
          release(el);
        },
        { signal }
      )
    );
  });
  return () => {
    ac.abort();
    els.forEach(release);
  };
}
