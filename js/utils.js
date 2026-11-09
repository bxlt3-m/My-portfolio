// @ts-check
// small shared helpers, nothing clever in here

/** @type {<T extends HTMLElement = HTMLElement>(s: string, r?: ParentNode) => T} */
export const $ = (s, r = document) => /** @type {any} */ (r.querySelector(s));
/** @type {<T extends HTMLElement = HTMLElement>(s: string, r?: ParentNode) => T[]} */
export const $$ = (s, r = document) => /** @type {any} */ ([...r.querySelectorAll(s)]);

export const root = document.documentElement;
/** @param {number} v @param {number} a @param {number} b */
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
/** @param {number} t */
export const easeOut = t => 1 - Math.pow(1 - t, 3);

// live MediaQueryLists on purpose: people toggle reduced motion while the
// page is open and we want to react to it
export const rm = matchMedia('(prefers-reduced-motion: reduce)');
export const canMove = () => !rm.matches;
export const touch = matchMedia('(pointer: coarse)');
