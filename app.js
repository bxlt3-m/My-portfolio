'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const root = document.documentElement;
root.classList.add('js');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const motionAllowed = () => !reduceMotion.matches;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const easeOut = t => 1 - Math.pow(1 - t, 3);
const header = $('.site-header');
const bar = $('.glass-bar');
const menu = $('#menu');
const mobileNav = $('#mobile-nav');
let menuTimer = 0;
function setMenu(open) {
  clearTimeout(menuTimer);
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  if (open) {
    mobileNav.hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => mobileNav.classList.add('is-open')));
  } else {
    mobileNav.classList.remove('is-open');
    menuTimer = setTimeout(() => { mobileNav.hidden = true; }, motionAllowed() ? 220 : 0);
  }
}
const closeMenu = () => { if (menu.getAttribute('aria-expanded') === 'true') setMenu(false); };
menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
$$('#mobile-nav a').forEach(link => link.addEventListener('click', closeMenu));
addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
addEventListener('pointerdown', event => { if (!header.contains(event.target)) closeMenu(); });
matchMedia('(min-width: 601px)').addEventListener('change', event => { if (event.matches) { closeMenu(); mobileNav.hidden = true; } });
if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
  bar.addEventListener('pointermove', event => {
    const rect = bar.getBoundingClientRect();
    bar.style.setProperty('--mx', `${event.clientX - rect.left}px`);
    bar.style.setProperty('--my', `${event.clientY - rect.top}px`);
  }, { passive: true });
}
const magnets = $$('[data-magnetic]');
function magnetMove(el, x, y) {
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
function magnetRest(el) {
  el.classList.remove('is-live');
  ['--tx', '--ty', '--ox', '--oy', '--sx', '--sy'].forEach(p => el.style.removeProperty(p));
}
magnets.forEach(el => {
  let down = false;
  el.addEventListener('pointerdown', event => { if (event.pointerType !== 'mouse' && motionAllowed()) { down = true; el.classList.add('is-live'); magnetMove(el, event.clientX, event.clientY); } });
  el.addEventListener('pointermove', event => { if (down && motionAllowed()) magnetMove(el, event.clientX, event.clientY); });
  ['pointerup', 'pointercancel'].forEach(type => el.addEventListener(type, () => { down = false; magnetRest(el); }));
});
const SHOT_SIZES = '(max-width:1320px) calc(100vw - 2.5rem), 1180px';
const shots = [
  { src: './assets/minassa-timetable.webp', small: './assets/minassa-timetable-800.webp', title: 'Timetable', width: 1549, height: 939, alt: 'Minassa Dirasa timetable with a weekly class schedule' },
  { src: './assets/minassa-focus.webp', small: './assets/minassa-focus-800.webp', title: 'Focus timer', width: 1553, height: 941, alt: 'Minassa Dirasa focus timer showing a 25 minute session' },
  { src: './assets/minassa-tasks.webp', small: './assets/minassa-tasks-800.webp', title: 'Tasks', width: 1556, height: 943, alt: 'Minassa Dirasa task list and progress tracking' }
];
const shotSet = shot => `${shot.small} 800w, ${shot.src} ${shot.width}w`;
let activeShot = 0;
const shotTabs = $$('[data-shot]');
const dialog = $('#image-dialog');
const coarsePointer = matchMedia('(pointer: coarse)');
function rollCounter(el, text) {
  if (!window.gsap || !motionAllowed()) { el.textContent = text; return; }
  gsap.killTweensOf(el);
  gsap.to(el, { y: -8, opacity: 0, duration: .16, ease: 'power2.in', onComplete: () => { el.textContent = text; gsap.fromTo(el, { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: .38, ease: 'power3.out' }); } });
}
function initStage(root) {
  const layers = $$('.layer', root);
  const art = l => $('img', l);
  let cur = 0, tl = null;
  const settle = (from, to) => { layers[from].classList.remove('on'); layers[to].classList.add('on'); };
  return {
    layers,
    go(to, instant = false) {
      if (to === cur || !layers[to]) return;
      const from = cur, dir = to > from ? 1 : -1;
      if (tl) { const prev = tl; tl = null; prev.progress(1); prev.kill(); }
      cur = to;
      if (instant || !window.gsap || !motionAllowed()) { settle(from, to); return; }
      const A = layers[from], B = layers[to];
      const blur = !coarsePointer.matches;
      gsap.set(A, { zIndex: 1, visibility: 'visible' });
      gsap.set(B, { zIndex: 2, visibility: 'visible', clipPath: dir > 0 ? 'inset(100% 0% 0% 0%)' : 'inset(0% 0% 100% 0%)' });
      const mine = gsap.timeline({ onComplete: () => { settle(from, to); gsap.set([A, B, art(A), art(B)], { clearProps: 'all' }); if (tl === mine) tl = null; } });
      tl = mine;
      mine.to(B, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.05, ease: 'power3.inOut' }, 0);
      mine.fromTo(art(B), blur ? { scale: 1.32, filter: 'blur(14px) brightness(.6)' } : { scale: 1.32 }, blur ? { scale: 1, filter: 'blur(0px) brightness(1)', duration: 1.4, ease: 'power3.out' } : { scale: 1, duration: 1.4, ease: 'power3.out' }, 0);
      mine.fromTo(art(A), blur ? { scale: 1, yPercent: 0, filter: 'blur(0px) brightness(1)' } : { scale: 1, yPercent: 0 }, blur ? { scale: 1.1, yPercent: -3 * dir, filter: 'blur(8px) brightness(.55)', duration: 1.05, ease: 'power2.in' } : { scale: 1.1, yPercent: -3 * dir, duration: 1.05, ease: 'power2.in' }, 0);
    }
  };
}
shots.slice(1).forEach(shot => {
  const layer = document.createElement('span');
  layer.className = 'layer';
  const img = new Image();
  img.srcset = shotSet(shot); img.sizes = SHOT_SIZES; img.src = shot.src; img.alt = shot.alt; img.width = shot.width; img.height = shot.height; img.loading = 'lazy'; img.decoding = 'async';
  layer.appendChild(img);
  $('#enlarge-screenshot').appendChild(layer);
});
shots.slice(1).forEach(shot => {
  const layer = document.createElement('span');
  layer.className = 'layer';
  const img = new Image();
  img.src = shot.src; img.alt = shot.alt; img.width = shot.width; img.height = shot.height; img.loading = 'lazy'; img.decoding = 'async';
  layer.appendChild(img);
  $('#lightbox-stage').appendChild(layer);
});
const lightboxStage = initStage($('#lightbox-stage'));
const minassaStage = initStage($('#enlarge-screenshot'));
const botStage = $('#bot-view') ? initStage($('#bot-view')) : null;
const botTabs = $$('[data-bot]');
let activeBot = 0;
function selectBot(index, focus = false) {
  const next = (index + botTabs.length) % botTabs.length;
  if (next === activeBot) { if (focus) botTabs[next].focus(); return; }
  activeBot = next;
  botTabs.forEach((tab, i) => { tab.setAttribute('aria-selected', String(i === activeBot)); tab.tabIndex = i === activeBot ? 0 : -1; });
  $('#bot-view').setAttribute('aria-labelledby', `bot-tab-${activeBot}`);
  rollCounter($('#bot-counter'), `${String(activeBot + 1).padStart(2, '0')} / 02`);
  botStage.go(activeBot);
  if (focus) botTabs[activeBot].focus();
}
botTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectBot(index));
  tab.addEventListener('keydown', event => {
    const keys = { ArrowRight: activeBot + 1, ArrowLeft: activeBot - 1, Home: 0, End: botTabs.length - 1 };
    if (event.key in keys) { event.preventDefault(); selectBot(keys[event.key], true); }
  });
});
function selectShot(index, focus = false) {
  const previous = activeShot;
  activeShot = (index + shots.length) % shots.length;
  const shot = shots[activeShot];
  const count = `${String(activeShot + 1).padStart(2, '0')} / 03`;
  $('#enlarge-screenshot').setAttribute('aria-label', `Enlarge the ${shot.title.toLowerCase()} screenshot`);
  shotTabs.forEach((tab, i) => { tab.setAttribute('aria-selected', String(i === activeShot)); tab.tabIndex = i === activeShot ? 0 : -1; });
  $('#shot-view').setAttribute('aria-labelledby', `shot-tab-${activeShot}`);
  lightboxStage.go(activeShot, !dialog.open);
  $('#image-dialog-title').textContent = `Minassa Dirasa / ${shot.title}`;
  $('#lightbox-count').textContent = count;
  if (focus) shotTabs[activeShot].focus();
  if (previous !== activeShot) { rollCounter($('#shot-counter'), count); minassaStage.go(activeShot); }
}
shotTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectShot(index));
  tab.addEventListener('keydown', event => {
    const keys = { ArrowRight: activeShot + 1, ArrowLeft: activeShot - 1, Home: 0, End: shots.length - 1 };
    if (event.key in keys) { event.preventDefault(); selectShot(keys[event.key], true); }
  });
});
function openLightbox() {
  smoothScroll?.scrollTo(scrollY, { immediate: true });
  dialog.showModal();
}
$('#enlarge-screenshot').addEventListener('click', openLightbox);
$('#expand-button').addEventListener('click', openLightbox);
$('#close-image').addEventListener('click', () => dialog.close());
$('#previous-image').addEventListener('click', () => selectShot(activeShot - 1));
$('#next-image').addEventListener('click', () => selectShot(activeShot + 1));
dialog.addEventListener('click', event => {
  if (event.target === dialog) {
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  }
});
dialog.addEventListener('keydown', event => { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); selectShot(activeShot + (event.key === 'ArrowRight' ? 1 : -1)); } });
(window.requestIdleCallback || (cb => setTimeout(cb, 1800)))(() => shots.slice(1).forEach(s => { const i = new Image(); i.sizes = SHOT_SIZES; i.srcset = shotSet(s); i.src = s.src; }));
function splitWords(el) {
  const frag = document.createDocumentFragment();
  let word = null, i = 0;
  const open = () => { word = document.createElement('span'); word.className = 'w'; word.style.setProperty('--i', i++); frag.appendChild(word); };
  for (const node of [...el.childNodes]) {
    if (node.nodeType === 3) {
      for (const part of node.textContent.split(/(\s+)/)) {
        if (!part) continue;
        if (/^\s+$/.test(part)) { word = null; frag.appendChild(document.createTextNode(' ')); }
        else { if (!word) open(); word.appendChild(document.createTextNode(part)); }
      }
    } else if (node.nodeName === 'BR') { word = null; frag.appendChild(node); }
    else { if (!word) open(); word.appendChild(node); }
  }
  el.textContent = '';
  el.appendChild(frag);
}
$$('.words, .swords').forEach(splitWords);
const replayEls = [...$$('#about .words'), ...$$('#about .principles>.rule'), $('#work-title'), $('#contact-title')].filter(Boolean);
const revealElements = $$('.reveal, .fade, .mask-lines, .words, .principles>.rule').filter(el => !replayEls.includes(el));
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('in-view'); observer.unobserve(entry.target); }
  }), { threshold: .12, rootMargin: '0px 0px -40px 0px' });
  revealElements.forEach(element => observer.observe(element));
} else { revealElements.forEach(element => element.classList.add('in-view')); }
if ('IntersectionObserver' in window) {
  const replayObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    const el = entry.target;
    if (!motionAllowed()) return;
    if (entry.intersectionRatio >= .12 && !el.classList.contains('in-view')) {
      el.classList.add('in-view');
    } else if (entry.intersectionRatio === 0 && entry.boundingClientRect.bottom <= 0 && el.classList.contains('in-view')) {
      el.style.transition = 'none';
      el.querySelectorAll('.w, .title-line>span').forEach(n => { n.style.transition = 'none'; });
      el.style.setProperty('--ty', '-.5em');
      el.style.setProperty('--my', '-115%');
      el.classList.remove('in-view');
      void el.offsetWidth;
      el.style.transition = '';
      el.querySelectorAll('.w, .title-line>span').forEach(n => { n.style.transition = ''; });
    }
  }), { threshold: [0, .12], rootMargin: '0px 0px -40px 0px' });
  replayEls.forEach(el => replayObserver.observe(el));
}
const toastEl = $('#toast');
let toastTimer = 0;
const toastSay = (text, done) => { if (!toastEl) return; toastEl.textContent = text; toastEl.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => { toastEl.classList.remove('show'); if (done) done(); }, 2400); };
$$('[data-gh]').forEach(btn => btn.addEventListener('click', () => toastSay('This project is not open source yet')));
const copyBtn = $('#copy-email');
if (copyBtn) {
  const address = `${copyBtn.dataset.u}@${copyBtn.dataset.d}`;
  const label = $('.copy-label', copyBtn);
  copyBtn.hidden = false;
  const say = text => toastSay(text, () => { label.textContent = 'COPY EMAIL'; });
  copyBtn.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(address); label.textContent = 'COPIED'; say('Email copied to clipboard'); }
    catch (error) {
      const field = document.createElement('textarea');
      field.value = address; field.setAttribute('readonly', ''); field.style.cssText = 'position:fixed;opacity:0;top:0';
      document.body.appendChild(field); field.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (e) {}
      field.remove();
      if (ok) { label.textContent = 'COPIED'; say('Email copied to clipboard'); } else { say(address); }
    }
  });
}
if (window.gsap && window.ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);
  const mm = gsap.matchMedia();
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    const blur = !coarsePointer.matches;
    const frames = $$('.screenshot-main');
    frames.forEach(frame => {
      gsap.set(frame, { transformOrigin: '50% 0%' });
      const tl = gsap.timeline({ scrollTrigger: { trigger: frame, start: 'top 95%', end: 'top 30%', scrub: .7, invalidateOnRefresh: true } });
      tl.fromTo(frame, { scale: 1.32 }, { scale: 1, ease: 'power2.out' }, 0);
      if (blur) tl.fromTo(frame, { filter: 'blur(12px) brightness(.7)' }, { filter: 'blur(0px) brightness(1)', ease: 'power1.out', duration: .7 }, 0);
      else tl.fromTo(frame, { opacity: .55 }, { opacity: 1, ease: 'power1.out', duration: .7 }, 0);
    });
    return () => { gsap.set(frames, { clearProps: 'transform,filter,opacity' }); };
  });
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    const wide = matchMedia('(min-width: 901px) and (hover: hover) and (pointer: fine)');
    const pairs = [['#about', '#work'], ['#contact', '#about']];
    pairs.forEach(([sel, prevSel]) => {
      const el = $(sel);
      if (!el) return;
      const prev = prevSel ? $('.wrap', $(prevSel)) : null;
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 100%', end: 'top 10%', scrub: .6, invalidateOnRefresh: true } });
      tl.to(el, { borderTopLeftRadius: 0, borderTopRightRadius: 0, ease: 'power1.in' }, 0);
      if (prev && wide.matches) { gsap.set(prev, { transformOrigin: '50% 100%' }); tl.to(prev, { y: -56, scale: .955, opacity: .45, ease: 'none' }, 0); }
    });
    return () => { gsap.set(['#about', '#contact'], { clearProps: 'borderTopLeftRadius,borderTopRightRadius' }); $$('#work>.wrap,#about>.wrap').forEach(w => gsap.set(w, { clearProps: 'all' })); };
  });
  addEventListener('load', () => ScrollTrigger.refresh());
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
}
const finePointer = matchMedia('(min-width: 601px) and (hover: hover) and (pointer: fine)');
let smoothScroll = null;
let scrollFrame = 0;
let scrollNeedsUpdate = true;
let lastRenderedScroll = -1;
const progressLine = $('.reading-progress');
const strip = $('.top-strip');
const heroName = $('.hero-name');
const heroFigure = $('#editorial-figure');
const toneEls = $$('[data-tone]').filter(el => el !== header);
const navLinks = $$('.desktop-nav a');
const navTargets = navLinks.map(a => $(a.getAttribute('href')));
const scrubs = $$('[data-scrub]');
const coarse = matchMedia('(pointer: coarse)');
const scrubWords = $$('.swords').map(el => ({ el, words: $$('.w', el), state: '' }));
const WAVE = 9;
function setWord(w, v, blur) {
  const q = Math.round(v * 50) / 50;
  if (w._v === q) return;
  w._v = q;
  if (q >= 1) { w.style.opacity = '1'; w.style.transform = ''; w.style.filter = ''; return; }
  const e = easeOut(q);
  w.style.opacity = e.toFixed(3);
  w.style.transform = `translate3d(0,${((1 - e) * .5).toFixed(3)}em,0)`;
  w.style.filter = blur ? `blur(${((1 - e) * 12).toFixed(2)}px)` : '';
}
let stripH = 28, toneTops = [], navTops = [], lastTone = '', lastNav = -2, lastScrolled = null, lastHeaderY = -1;
function measure() {
  stripH = strip.offsetHeight;
  toneTops = toneEls.map(el => ({ top: el.getBoundingClientRect().top + scrollY, tone: el.dataset.tone })).sort((a, b) => a.top - b.top);
  navTops = navTargets.map(el => el ? el.getBoundingClientRect().top + scrollY : Infinity);
}
function configureSmoothScroll() {
  smoothScroll?.destroy();
  smoothScroll = null;
  if (motionAllowed() && finePointer.matches && typeof window.Lenis === 'function') {
    smoothScroll = new window.Lenis({
      autoRaf: false,
      lerp: 0.12,
      smoothWheel: true,
      syncTouch: false,
      wheelMultiplier: 1,
      respectReducedMotion: true,
      anchors: { duration: 0.85, easing: t => 1 - Math.pow(1 - t, 4) },
      prevent: node => dialog.open || Boolean(node.closest('[data-lenis-prevent]')),
      virtualScroll: ({ event }) => !event.ctrlKey && !event.metaKey && !event.shiftKey
    });
  }
  invalidateScroll();
}
function scheduleScroll() { if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScroll); }
function invalidateScroll() { measure(); scrollNeedsUpdate = true; scheduleScroll(); }
function updateScroll(time) {
  scrollFrame = 0;
  smoothScroll?.raf(time);
  if (smoothScroll && window.ScrollTrigger) ScrollTrigger.update();
  const y = Math.max(0, scrollY);
  if (scrollNeedsUpdate || y !== lastRenderedScroll) {
    const motion = motionAllowed();
    const max = Math.max(1, smoothScroll ? smoothScroll.limit : root.scrollHeight - innerHeight);
    progressLine.style.transform = `scaleX(${Math.min(1, y / max)})`;
    const hy = Math.max(0, stripH - y);
    if (hy !== lastHeaderY) { header.style.transform = `translate3d(0,${hy}px,0)`; lastHeaderY = hy; }
    const probe = y + hy + 40;
    let tone = 'light';
    for (const t of toneTops) { if (t.top <= probe) tone = t.tone; else break; }
    if (tone !== lastTone) { header.dataset.tone = tone; lastTone = tone; }
    let nav = -1;
    navTops.forEach((top, i) => { if (top - 160 <= y) nav = i; });
    if (nav !== lastNav) { navLinks.forEach((a, i) => i === nav ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')); lastNav = nav; }
    const depth = motion ? Math.min(y, 760) : 0;
    heroName.style.transform = `translate3d(0,${depth * .12}px,0)`;
    heroFigure.style.transform = `translate3d(0,${-depth * .045}px,0)`;
    if (motion) {
      const vh = innerHeight;
      for (const el of scrubs) {
        const r = el.getBoundingClientRect();
        if (r.bottom < -240 || r.top > vh + 240) continue;
        const kind = el.dataset.scrub;
        if (kind === 'rise') {
          const e = easeOut(clamp((vh - r.top) / (vh * .6), 0, 1));
          el.style.transform = `translate3d(0,${(1 - e) * 56}px,0) scale(${.92 + .08 * e})`;
        } else if (kind === 'drift') {
          const c = clamp(((r.top + r.height / 2) - vh / 2) / (vh / 2 + r.height / 2), -1, 1);
          el.style.transform = `translate3d(0,${c * -5}%,0) scale(1.12)`;
        } else if (kind === 'grow') {
          const e = easeOut(clamp((vh - r.top) / (vh * .75), 0, 1));
          el.style.transform = `scale(${.86 + .14 * e})`;
        }
      }
    } else {
      for (const el of scrubs) el.style.transform = '';
    }
    if (motion) {
      const vh = innerHeight;
      const blur = !coarse.matches;
      for (const g of scrubWords) {
        const r = g.el.getBoundingClientRect();
        const n = g.words.length;
        if (r.top > vh + 80) { if (g.state !== 'below') { g.words.forEach(w => setWord(w, 0, blur)); g.state = 'below'; } continue; }
        if (r.bottom < -80) { if (g.state !== 'above') { g.words.forEach(w => setWord(w, 1, blur)); g.state = 'above'; } continue; }
        g.state = 'live';
        const p = clamp((vh * .96 - r.top) / (vh * .82 + r.height * .1), 0, 1);
        const head = p * (n + WAVE);
        for (let k = 0; k < n; k++) setWord(g.words[k], (head - k) / WAVE, blur);
      }
    }
    lastRenderedScroll = y;
    scrollNeedsUpdate = false;
  }
  if (smoothScroll) scheduleScroll();
}
reduceMotion.addEventListener('change', configureSmoothScroll);
finePointer.addEventListener('change', configureSmoothScroll);
addEventListener('scroll', scheduleScroll, { passive: true });
addEventListener('resize', invalidateScroll);
addEventListener('pageshow', invalidateScroll);
addEventListener('load', invalidateScroll);
if ('ResizeObserver' in window) new ResizeObserver(invalidateScroll).observe(document.body);
configureSmoothScroll();
