// @ts-check
import { $, $$ } from './utils.js';

const toastEl = $('#toast');
let tt = 0;

/** @param {string} text @param {() => void} [done] */
export function toast(text, done) {
  if (!toastEl) return;
  toastEl.textContent = text;
  toastEl.classList.add('show');
  clearTimeout(tt);
  tt = window.setTimeout(() => {
    toastEl.classList.remove('show');
    if (done) done();
  }, 2400);
}

export function initContact() {
  const ac = new AbortController();
  const { signal } = ac;
  // projects aren't public yet, button is just a placeholder for later
  $$('[data-gh]').forEach(b => b.addEventListener('click', () => toast('This project is not open source yet'), { signal }));

  const btn = $('#copy-email');
  if (!btn) return () => ac.abort();
  // address is split in the markup so it isn't sitting there for scrapers
  const addr = `${btn.dataset.u}@${btn.dataset.d}`;
  const label = $('.copy-label', btn);
  btn.hidden = false;
  /** @param {string} text */
  const say = text =>
    toast(text, () => {
      label.textContent = 'COPY EMAIL';
    });

  btn.addEventListener(
    'click',
    async () => {
      try {
        await navigator.clipboard.writeText(addr);
        label.textContent = 'COPIED';
        say('Email copied to clipboard');
      } catch {
        // clipboard api is blocked (http, old webviews...). old school fallback
        const ta = document.createElement('textarea');
        ta.value = addr;
        ta.setAttribute('readonly', '');
        ta.style.cssText = 'position:fixed;opacity:0;top:0';
        document.body.appendChild(ta);
        ta.select();
        let ok = false;
        try {
          ok = document.execCommand('copy');
        } catch {
          // some webviews throw instead of returning false
        }
        ta.remove();
        if (ok) {
          label.textContent = 'COPIED';
          say('Email copied to clipboard');
        } else say(addr); // last resort, at least show it
      }
    },
    { signal }
  );
  return () => {
    ac.abort();
    clearTimeout(tt);
  };
}
