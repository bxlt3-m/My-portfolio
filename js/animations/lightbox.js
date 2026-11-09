// @ts-check
import { $, $$ } from '../utils.js';
import { rollCounter, initStage } from './stage.js';
import { lenis } from '../scroll.js';

const SIZES = '(max-width:1320px) calc(100vw - 2.5rem), 1180px';
const shots = [
  {
    src: './assets/minassa-timetable.webp',
    small: './assets/minassa-timetable-800.webp',
    title: 'Timetable',
    width: 1549,
    height: 939,
    alt: 'Minassa Dirasa timetable with a weekly class schedule'
  },
  {
    src: './assets/minassa-focus.webp',
    small: './assets/minassa-focus-800.webp',
    title: 'Focus timer',
    width: 1553,
    height: 941,
    alt: 'Minassa Dirasa focus timer showing a 25 minute session'
  },
  {
    src: './assets/minassa-tasks.webp',
    small: './assets/minassa-tasks-800.webp',
    title: 'Tasks',
    width: 1556,
    height: 943,
    alt: 'Minassa Dirasa task list and progress tracking'
  }
];
/** @param {{src:string, small:string, width:number}} s */
const srcset = s => `${s.small} 800w, ${s.src} ${s.width}w`;

// first slide is already in the html, the other two get built here
/** @param {HTMLElement} box @param {boolean} withSrcset */
function addLayers(box, withSrcset) {
  shots.slice(1).forEach(s => {
    const layer = document.createElement('span');
    layer.className = 'layer';
    const img = new Image();
    if (withSrcset) {
      img.srcset = srcset(s);
      img.sizes = SIZES;
    }
    img.src = s.src;
    img.alt = s.alt;
    img.width = s.width;
    img.height = s.height;
    img.loading = 'lazy';
    img.decoding = 'async';
    layer.appendChild(img);
    box.appendChild(layer);
  });
}

/** both galleries + the lightbox. returns a destroy fn */
export function initGallery() {
  const ac = new AbortController();
  const { signal } = ac;
  const dialog = /** @type {HTMLDialogElement} */ ($('#image-dialog'));
  const tabs = $$('[data-shot]');
  const botTabs = $$('[data-bot]');
  let curShot = 0,
    curBot = 0;

  addLayers($('#enlarge-screenshot'), true);
  addLayers($('#lightbox-stage'), false);

  const lb = initStage($('#lightbox-stage'));
  const minassa = initStage($('#enlarge-screenshot'));
  const bot = $('#bot-view') ? initStage($('#bot-view')) : null;

  /** @param {number} i @param {boolean} [focus] */
  function selectBot(i, focus = false) {
    const next = (i + botTabs.length) % botTabs.length;
    if (next === curBot) {
      if (focus) botTabs[next].focus();
      return;
    }
    curBot = next;
    botTabs.forEach((t, n) => {
      t.setAttribute('aria-selected', String(n === curBot));
      t.tabIndex = n === curBot ? 0 : -1;
    });
    $('#bot-view').setAttribute('aria-labelledby', `bot-tab-${curBot}`);
    rollCounter($('#bot-counter'), `${String(curBot + 1).padStart(2, '0')} / 02`);
    bot.go(curBot);
    if (focus) botTabs[curBot].focus();
  }

  /** @param {number} i @param {boolean} [focus] */
  function selectShot(i, focus = false) {
    const prev = curShot;
    curShot = (i + shots.length) % shots.length;
    const s = shots[curShot];
    const count = `${String(curShot + 1).padStart(2, '0')} / 03`;
    $('#enlarge-screenshot').setAttribute('aria-label', `Enlarge the ${s.title.toLowerCase()} screenshot`);
    tabs.forEach((t, n) => {
      t.setAttribute('aria-selected', String(n === curShot));
      t.tabIndex = n === curShot ? 0 : -1;
    });
    $('#shot-view').setAttribute('aria-labelledby', `shot-tab-${curShot}`);
    lb.go(curShot, !dialog.open); // instant when the dialog is closed
    $('#image-dialog-title').textContent = `Minassa Dirasa / ${s.title}`;
    $('#lightbox-count').textContent = count;
    if (focus) tabs[curShot].focus();
    if (prev !== curShot) {
      rollCounter($('#shot-counter'), count);
      minassa.go(curShot);
    }
  }

  // arrow keys / home / end on a tablist, same for both galleries
  /** @param {number} cur @param {number} len @returns {Record<string, number>} */
  const keys = (cur, len) => ({ ArrowRight: cur + 1, ArrowLeft: cur - 1, Home: 0, End: len - 1 });
  botTabs.forEach((t, i) => {
    t.addEventListener('click', () => selectBot(i), { signal });
    t.addEventListener(
      'keydown',
      e => {
        const k = keys(curBot, botTabs.length);
        if (e.key in k) {
          e.preventDefault();
          selectBot(k[e.key], true);
        }
      },
      { signal }
    );
  });
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => selectShot(i), { signal });
    t.addEventListener(
      'keydown',
      e => {
        const k = keys(curShot, shots.length);
        if (e.key in k) {
          e.preventDefault();
          selectShot(k[e.key], true);
        }
      },
      { signal }
    );
  });

  function open() {
    lenis?.scrollTo(scrollY, { immediate: true }); // stop lenis before the modal grabs scroll
    dialog.showModal();
  }
  $('#enlarge-screenshot').addEventListener('click', open, { signal });
  $('#expand-button').addEventListener('click', open, { signal });
  $('#close-image').addEventListener('click', () => dialog.close(), { signal });
  $('#previous-image').addEventListener('click', () => selectShot(curShot - 1), { signal });
  $('#next-image').addEventListener('click', () => selectShot(curShot + 1), { signal });

  // click on the backdrop closes it
  dialog.addEventListener(
    'click',
    e => {
      if (e.target !== dialog) return;
      const r = dialog.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close();
    },
    { signal }
  );
  dialog.addEventListener(
    'keydown',
    e => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        selectShot(curShot + (e.key === 'ArrowRight' ? 1 : -1));
      }
    },
    { signal }
  );

  // warm the cache for slides 2 and 3 once the browser is idle
  (window.requestIdleCallback || (cb => setTimeout(cb, 1800)))(() =>
    shots.slice(1).forEach(s => {
      const i = new Image();
      i.sizes = SIZES;
      i.srcset = srcset(s);
      i.src = s.src;
    })
  );
  return () => {
    ac.abort();
    lb.destroy();
    minassa.destroy();
    bot?.destroy();
  };
}
