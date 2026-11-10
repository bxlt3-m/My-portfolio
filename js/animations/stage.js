// @ts-check
import { $, $$, canMove, touch } from '../utils.js';

// little counter that rolls "01 / 03" when the slide changes
/** @param {HTMLElement} el @param {string} text */
export function rollCounter(el, text) {
  if (!window.gsap || !canMove()) {
    el.textContent = text;
    return;
  }
  gsap.killTweensOf(el);
  gsap.to(el, {
    y: -8,
    opacity: 0,
    duration: 0.16,
    ease: 'power2.in',
    onComplete: () => {
      el.textContent = text;
      gsap.fromTo(el, { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.38, ease: 'power3.out' });
    }
  });
}

// layered image stage. each .layer is stacked, the incoming one wipes in
// with a clip-path while the outgoing one drifts + blurs away
/** @param {HTMLElement} box */
export function initStage(box) {
  const layers = $$('.layer', box);
  /** @param {HTMLElement} l */
  const img = l => $('img', l);
  /** @type {any} */
  let tl = null;
  let curr = 0;
  /** @param {number} a @param {number} b */
  const swap = (a, b) => {
    layers[a].classList.remove('on');
    layers[b].classList.add('on');
  };

  return {
    layers,
    /** @param {number} to @param {boolean} [instant] */
    go(to, instant = false) {
      if (to === curr || !layers[to]) return;
      const from = curr,
        dir = to > from ? 1 : -1;

      // user clicking fast: finish the running one first so nothing gets stuck half way
      if (tl) {
        const old = tl;
        tl = null;
        old.progress(1);
        old.kill();
      }
      curr = to;
      if (instant || !window.gsap || !canMove()) {
        swap(from, to);
        return;
      }

      const A = layers[from],
        B = layers[to];
      const blur = !touch.matches; // filter blur is too heavy on phones
      gsap.set(A, { zIndex: 1, visibility: 'visible' });
      gsap.set(B, { zIndex: 2, visibility: 'visible', clipPath: dir > 0 ? 'inset(100% 0% 0% 0%)' : 'inset(0% 0% 100% 0%)' });

      const mine = gsap.timeline({
        onComplete: () => {
          swap(from, to);
          gsap.set([A, B, img(A), img(B)], { clearProps: 'all' });
          if (tl === mine) tl = null;
        }
      });
      tl = mine;

      mine.to(B, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.05, ease: 'power3.inOut' }, 0);
      // NOTE: explicit blur(0px)/brightness(1) on purpose. tweening from "none" goes black.
      mine.fromTo(
        img(B),
        blur ? { scale: 1.32, filter: 'blur(14px) brightness(.6)' } : { scale: 1.32 },
        blur
          ? { scale: 1, filter: 'blur(0px) brightness(1)', duration: 1.4, ease: 'power3.out' }
          : { scale: 1, duration: 1.4, ease: 'power3.out' },
        0
      );
      mine.fromTo(
        img(A),
        blur ? { scale: 1, yPercent: 0, filter: 'blur(0px) brightness(1)' } : { scale: 1, yPercent: 0 },
        blur
          ? { scale: 1.1, yPercent: -3 * dir, filter: 'blur(8px) brightness(.55)', duration: 1.05, ease: 'power2.in' }
          : { scale: 1.1, yPercent: -3 * dir, duration: 1.05, ease: 'power2.in' },
        0
      );
    },
    destroy() {
      if (tl) {
        tl.kill();
        tl = null;
      }
    }
  };
}
