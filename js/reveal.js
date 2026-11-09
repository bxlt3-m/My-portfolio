// @ts-check
import { $, $$, canMove } from './utils.js';

// wraps every word in a span.w so the scroll code can drive them one by one
/** @param {HTMLElement} el */
function splitWords(el) {
  const frag = document.createDocumentFragment();
  /** @type {HTMLElement | null} */
  let w = null;
  let n = 0;
  const open = () => {
    w = document.createElement('span');
    w.className = 'w';
    w.style.setProperty('--i', String(n++));
    frag.appendChild(w);
  };
  for (const node of [...el.childNodes]) {
    if (node.nodeType === 3) {
      for (const part of node.textContent.split(/(\s+)/)) {
        if (!part) continue;
        if (/^\s+$/.test(part)) {
          w = null;
          frag.appendChild(document.createTextNode(' '));
        } else {
          if (!w) open();
          w.appendChild(document.createTextNode(part));
        }
      }
    } else if (node.nodeName === 'BR') {
      w = null;
      frag.appendChild(node);
    } else {
      if (!w) open();
      w.appendChild(node);
    } // inline tags (the red dot etc) stay glued to their word
  }
  el.textContent = '';
  el.appendChild(frag);
}

/** splits the text + sets up the in-view observers. returns a destroy fn */
export function initReveal() {
  $$('.words, .swords').forEach(splitWords);

  // these ones re-arm when you scroll back up past them
  const replay = [...$$('#about .words'), ...$$('#about .principles>.rule'), $('#work-title'), $('#contact-title')].filter(Boolean);
  const once = $$('.reveal, .fade, .mask-lines, .words, .principles>.rule').filter(el => !replay.includes(el));

  if (!('IntersectionObserver' in window)) {
    once.forEach(el => el.classList.add('in-view'));
    return () => {};
  }

  const io = new IntersectionObserver(
    list =>
      list.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in-view');
          io.unobserve(e.target);
        }
      }),
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );
  once.forEach(el => io.observe(el));

  const again = new IntersectionObserver(
    list =>
      list.forEach(e => {
        const el = /** @type {HTMLElement} */ (e.target);
        if (!canMove()) return;
        if (e.intersectionRatio >= 0.12 && !el.classList.contains('in-view')) {
          el.classList.add('in-view');
        } else if (e.intersectionRatio === 0 && e.boundingClientRect.bottom <= 0 && el.classList.contains('in-view')) {
          // it went off the top. snap back to the hidden state without animating
          // so it can play again next time. (force reflow = the offsetWidth line)
          const parts = /** @type {NodeListOf<HTMLElement>} */ (el.querySelectorAll('.w, .title-line>span'));
          el.style.transition = 'none';
          parts.forEach(n => {
            n.style.transition = 'none';
          });
          el.style.setProperty('--ty', '-.5em');
          el.style.setProperty('--my', '-115%');
          el.classList.remove('in-view');
          void el.offsetWidth;
          el.style.transition = '';
          parts.forEach(n => {
            n.style.transition = '';
          });
        }
      }),
    { threshold: [0, 0.12], rootMargin: '0px 0px -40px 0px' }
  );
  replay.forEach(el => again.observe(el));
  return () => {
    io.disconnect();
    again.disconnect();
  };
}
