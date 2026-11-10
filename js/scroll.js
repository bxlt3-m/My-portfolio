// @ts-check
// Lenis smooth scroll + the one rAF loop that drives everything scroll-linked
// (progress bar, header tone, nav highlight, parallax, per-word blur).
import { $, $$, root, clamp, easeOut, rm, canMove, touch } from './utils.js';

/** shared with the lightbox, which has to stop it before opening the modal */
export let lenis = null;

const WAVE = 9; // how many words are mid-fade at the same time

const finePointer = matchMedia('(min-width: 601px) and (hover: hover) and (pointer: fine)');

/** @param {any} w @param {number} v @param {boolean} blur */
function setWord(w, v, blur) {
  const q = Math.round(v * 50) / 50; // 50 steps is plenty, skips redundant style writes
  if (w._v === q) return;
  w._v = q;
  if (q >= 1) {
    w.style.opacity = '1';
    w.style.transform = '';
    w.style.filter = '';
    return;
  }
  const e = easeOut(q);
  w.style.opacity = e.toFixed(3);
  w.style.transform = `translate3d(0,${((1 - e) * 0.5).toFixed(3)}em,0)`;
  w.style.filter = blur ? `blur(${((1 - e) * 12).toFixed(2)}px)` : '';
}

/** returns a destroy fn */
export function initScroll() {
  const ac = new AbortController();
  const { signal } = ac;

  const dialog = /** @type {HTMLDialogElement} */ ($('#image-dialog'));
  const header = $('.site-header');
  const progress = $('.reading-progress');
  const strip = $('.top-strip');
  const heroName = $('.hero-name');
  const heroFigure = $('#editorial-figure');
  const toneEls = $$('[data-tone]').filter(el => el !== header);
  const navLinks = $$('.desktop-nav a');
  const navTargets = navLinks.map(a => $(/** @type {string} */ (a.getAttribute('href'))));
  const scrubs = $$('[data-scrub]');
  const scrubWords = $$('.swords').map(el => ({ el, words: $$('.w', el), state: '' }));

  let frame = 0;
  let dirty = true;
  let lastY = -1;
  let stripH = 28;
  let toneTops = /** @type {{top:number, tone:string}[]} */ ([]);
  let navTops = /** @type {number[]} */ ([]);
  let lastTone = '',
    lastNav = -2,
    lastHeaderY = -1;

  // section positions only change on resize/layout, so measure once and reuse every frame
  function measure() {
    stripH = strip.offsetHeight;
    toneTops = toneEls
      .map(el => ({ top: el.getBoundingClientRect().top + scrollY, tone: el.dataset.tone || 'light' }))
      .sort((a, b) => a.top - b.top);
    navTops = navTargets.map(el => (el ? el.getBoundingClientRect().top + scrollY : Infinity));
  }

  function schedule() {
    if (!frame) frame = requestAnimationFrame(update);
  }
  function invalidate() {
    measure();
    dirty = true;
    schedule();
  }

  function setupLenis() {
    lenis?.destroy();
    lenis = null;
    if (canMove() && finePointer.matches && typeof window.Lenis === 'function') {
      lenis = new window.Lenis({
        autoRaf: false, // we call raf() ourselves so ScrollTrigger stays in step
        lerp: 0.12,
        smoothWheel: true,
        syncTouch: false,
        wheelMultiplier: 1,
        respectReducedMotion: true,
        anchors: { duration: 0.85, easing: (/** @type {number} */ t) => 1 - Math.pow(1 - t, 4) },
        prevent: (/** @type {Element} */ node) => dialog.open || Boolean(node.closest('[data-lenis-prevent]')),
        // ctrl/cmd/shift + wheel is zoom or horizontal scroll, leave it to the browser
        virtualScroll: ({ event }) => !event.ctrlKey && !event.metaKey && !event.shiftKey
      });
    }
    invalidate();
  }

  /** @param {number} time */
  function update(time) {
    frame = 0;
    lenis?.raf(time);
    if (lenis && window.ScrollTrigger) ScrollTrigger.update();

    const y = Math.max(0, scrollY);
    if (dirty || y !== lastY) {
      const motion = canMove();
      const max = Math.max(1, lenis ? lenis.limit : root.scrollHeight - innerHeight);
      progress.style.transform = `scaleX(${Math.min(1, y / max)})`;

      // the header rides up with the top strip, then sticks
      const hy = Math.max(0, stripH - y);
      if (hy !== lastHeaderY) {
        header.style.transform = `translate3d(0,${hy}px,0)`;
        lastHeaderY = hy;
      }

      // header tone follows whichever section is under it
      const probe = y + hy + 40;
      let tone = 'light';
      for (const t of toneTops) {
        if (t.top <= probe) tone = t.tone;
        else break;
      }
      if (tone !== lastTone) {
        header.dataset.tone = tone;
        lastTone = tone;
      }

      let nav = -1;
      navTops.forEach((top, i) => {
        if (top - 160 <= y) nav = i;
      });
      if (nav !== lastNav) {
        navLinks.forEach((a, i) => (i === nav ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
        lastNav = nav;
      }

      const depth = motion ? Math.min(y, 760) : 0;
      heroName.style.transform = `translate3d(0,${depth * 0.12}px,0)`;
      heroFigure.style.transform = `translate3d(0,${-depth * 0.045}px,0)`;

      if (motion) {
        const vh = innerHeight;
        for (const el of scrubs) {
          const r = el.getBoundingClientRect();
          if (r.bottom < -240 || r.top > vh + 240) continue; // far off screen
          const kind = el.dataset.scrub;
          if (kind === 'rise') {
            const e = easeOut(clamp((vh - r.top) / (vh * 0.6), 0, 1));
            el.style.transform = `translate3d(0,${(1 - e) * 56}px,0) scale(${0.92 + 0.08 * e})`;
          } else if (kind === 'drift') {
            const c = clamp((r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2), -1, 1);
            el.style.transform = `translate3d(0,${c * -5}%,0) scale(1.12)`;
          } else if (kind === 'grow') {
            const e = easeOut(clamp((vh - r.top) / (vh * 0.75), 0, 1));
            el.style.transform = `scale(${0.86 + 0.14 * e})`;
          }
        }

        const blur = !touch.matches;
        for (const g of scrubWords) {
          const r = g.el.getBoundingClientRect();
          const n = g.words.length;
          if (r.top > vh + 80) {
            if (g.state !== 'below') {
              g.words.forEach(w => setWord(w, 0, blur));
              g.state = 'below';
              g.el.classList.remove('is-live');
            }
            continue;
          }
          if (r.bottom < -80) {
            if (g.state !== 'above') {
              g.words.forEach(w => setWord(w, 1, blur));
              g.state = 'above';
              g.el.classList.remove('is-live');
            }
            continue;
          }
          if (g.state !== 'live') {
            g.state = 'live';
            g.el.classList.add('is-live'); // css only sets will-change while a group is in view
          }
          const p = clamp((vh * 0.96 - r.top) / (vh * 0.82 + r.height * 0.1), 0, 1);
          const head = p * (n + WAVE);
          for (let k = 0; k < n; k++) setWord(g.words[k], (head - k) / WAVE, blur);
        }
      } else {
        for (const el of scrubs) el.style.transform = '';
      }

      lastY = y;
      dirty = false;
    }
    if (lenis) schedule(); // lenis needs a frame every tick while it's easing
  }

  rm.addEventListener('change', setupLenis, { signal });
  finePointer.addEventListener('change', setupLenis, { signal });
  // .is-scrolling turns will-change on only while the page is moving (see motion.css)
  let idle = 0;
  const onScroll = () => {
    root.classList.add('is-scrolling');
    clearTimeout(idle);
    idle = window.setTimeout(() => root.classList.remove('is-scrolling'), 160);
    schedule();
  };
  addEventListener('scroll', onScroll, { passive: true, signal });
  addEventListener('resize', invalidate, { signal });
  addEventListener('pageshow', invalidate, { signal });
  addEventListener('load', invalidate, { signal });
  const ro = 'ResizeObserver' in window ? new ResizeObserver(invalidate) : null;
  ro?.observe(document.body);
  setupLenis();

  return () => {
    ac.abort();
    ro?.disconnect();
    cancelAnimationFrame(frame);
    clearTimeout(idle);
    root.classList.remove('is-scrolling');
    lenis?.destroy();
    lenis = null;
  };
}
