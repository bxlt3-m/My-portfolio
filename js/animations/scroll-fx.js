// @ts-check
// GSAP + ScrollTrigger bits: screenshot zoom-in and the rounded section tops.
import { $, $$ } from '../utils.js';

/** returns a destroy fn */
export function initScrollFx() {
  if (!window.gsap || !window.ScrollTrigger) return () => {};
  gsap.registerPlugin(ScrollTrigger);
  const ac = new AbortController();
  const { signal } = ac;
  const mm = gsap.matchMedia();

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    const blur = !matchMedia('(pointer: coarse)').matches;
    const frames = $$('.screenshot-main');
    frames.forEach(frame => {
      gsap.set(frame, { transformOrigin: '50% 0%' });
      const tl = gsap.timeline({
        scrollTrigger: { trigger: frame, start: 'top 95%', end: 'top 30%', scrub: 0.7, invalidateOnRefresh: true }
      });
      tl.fromTo(frame, { scale: 1.32 }, { scale: 1, ease: 'power2.out' }, 0);
      // explicit blur(0px) on purpose, same reason as in stage.js
      if (blur)
        tl.fromTo(
          frame,
          { filter: 'blur(12px) brightness(.7)' },
          { filter: 'blur(0px) brightness(1)', ease: 'power1.out', duration: 0.7 },
          0
        );
      else tl.fromTo(frame, { opacity: 0.55 }, { opacity: 1, ease: 'power1.out', duration: 0.7 }, 0);
    });
    return () => {
      gsap.set(frames, { clearProps: 'transform,filter,opacity' });
    };
  });

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    const wide = matchMedia('(min-width: 901px) and (hover: hover) and (pointer: fine)');
    // [section, the one it slides over]
    const pairs = [
      ['#about', '#work'],
      ['#contact', '#about']
    ];
    pairs.forEach(([sel, prevSel]) => {
      const el = $(sel);
      if (!el) return;
      const prev = $('.wrap', $(prevSel));
      const tl = gsap.timeline({
        scrollTrigger: { trigger: el, start: 'top 100%', end: 'top 10%', scrub: 0.6, invalidateOnRefresh: true }
      });
      tl.to(el, { borderTopLeftRadius: 0, borderTopRightRadius: 0, ease: 'power1.in' }, 0);
      if (prev && wide.matches) {
        gsap.set(prev, { transformOrigin: '50% 100%' });
        tl.to(prev, { y: -56, scale: 0.955, opacity: 0.45, ease: 'none' }, 0);
      }
    });
    return () => {
      gsap.set(['#about', '#contact'], { clearProps: 'borderTopLeftRadius,borderTopRightRadius' });
      $$('#work>.wrap,#about>.wrap').forEach(w => gsap.set(w, { clearProps: 'all' }));
    };
  });

  addEventListener('load', () => ScrollTrigger.refresh(), { signal });
  document.fonts?.ready.then(() => {
    if (!signal.aborted) ScrollTrigger.refresh();
  });

  return () => {
    ac.abort();
    mm.revert();
  };
}
