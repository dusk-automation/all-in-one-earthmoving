/* All-In-One Earthmoving: design preview by Dusk (version 2).
   Motion only runs when <html> has .motion (set in the head unless the visitor asks for reduced motion).
   Without this script the page is complete and still: poster images, no parallax, all text visible. */
(function () {
  'use strict';
  window.__aio = true;
  var root = document.documentElement;
  var motion = root.classList.contains('motion');
  var finePointer = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var scrollY = function () { return window.scrollY || window.pageYOffset; };

  /* ---------- text splitting (done before the entrance starts) ---------- */
  // hero headline: each letter rises in turn
  $$('.hero-title .chars').forEach(function (el, ln) {
    var text = el.textContent; el.textContent = '';
    for (var i = 0; i < text.length; i++) {
      var c = document.createElement('span');
      c.className = 'ch';
      c.style.setProperty('--i', i); c.style.setProperty('--ln', ln);
      c.textContent = text[i] === ' ' ? ' ' : text[i];
      el.appendChild(c);
    }
  });
  if (motion) { var ht = $('.hero-title'); if (ht) ht.classList.add('split'); }

  // split a heading into words; inline elements (like the orange accent) are kept and split too
  function splitWords(el, make) {
    var nodes = Array.prototype.slice.call(el.childNodes); var n = 0;
    el.textContent = '';
    function addParts(target, text) {
      text.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) { target.appendChild(document.createTextNode(' ')); return; }
        target.appendChild(make(part, n++));
      });
    }
    nodes.forEach(function (node) {
      if (node.nodeType === 3) { addParts(el, node.textContent); return; }
      var wrap = node.cloneNode(false); addParts(wrap, node.textContent); el.appendChild(wrap);
    });
  }
  // section headings: each word rises out of a slot
  $$('.split-words').forEach(function (el) {
    splitWords(el, function (word, i) {
      var w = document.createElement('span'); w.className = 'w';
      var s = document.createElement('span'); s.textContent = word; s.style.setProperty('--i', i);
      w.appendChild(s); return w;
    });
  });
  // about statement: words light up as it scrolls through
  $$('.scrub-words').forEach(function (el) {
    var words = [];
    splitWords(el, function (word) {
      var w = document.createElement('span'); w.className = 'sw'; w.textContent = word;
      words.push(w); return w;
    });
    el._words = words;
  });

  // hour-meter numbers: each digit gets a rolling column 0-9
  function rollOdo(el) {
    $$('.dg-col', el).forEach(function (col) { col.style.transform = 'translateY(' + (-parseInt(col.dataset.to, 10)) + 'em)'; });
  }
  $$('.odo').forEach(function (el) {
    var text = el.textContent; el.textContent = ''; var di = 0;
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (/\d/.test(ch)) {
        var dg = document.createElement('span'); dg.className = 'dg'; dg.setAttribute('aria-hidden', 'true');
        var col = document.createElement('span'); col.className = 'dg-col'; col.style.setProperty('--i', di++);
        col.dataset.to = ch;
        for (var d = 0; d <= 9; d++) { var sp = document.createElement('span'); sp.textContent = d; col.appendChild(sp); }
        dg.appendChild(col); el.appendChild(dg);
      } else {
        var t = document.createElement('span'); t.setAttribute('aria-hidden', 'true'); t.textContent = ch; el.appendChild(t);
      }
    }
    if (!motion) rollOdo(el);
  });

  /* ---------- header: solid on scroll, tucks away going down, progress line ---------- */
  var header = $('.site-header');
  var bar = $('.action-bar');
  var hero = $('.hero');
  var prog = $('.progress span');
  var lastY = scrollY();
  function onScrollUi() {
    var y = scrollY();
    header.classList.toggle('scrolled', y > 40);
    var goingDown = y > lastY + 4, goingUp = y < lastY - 4;
    if (!root.classList.contains('menu-open')) {
      if (goingDown && y > (hero ? hero.offsetHeight * 0.8 : 600)) header.classList.add('tuck');
      else if (goingUp || y < 200) header.classList.remove('tuck');
    }
    if (goingDown || goingUp) lastY = y;
    if (bar) bar.classList.toggle('show', y > (hero ? hero.offsetHeight * 0.55 : 300));
    if (prog) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      prog.style.transform = 'scaleX(' + (max > 0 ? clamp(y / max, 0, 1) : 0).toFixed(4) + ')';
    }
  }
  // keyboard users always get the header back
  header.addEventListener('focusin', function () { header.classList.remove('tuck'); });
  // underline the menu item of the section in view
  var navLinks = $$('.nav a');
  if ('IntersectionObserver' in window && navLinks.length) {
    var navIo = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        navLinks.forEach(function (a) { a.classList.toggle('is-here', a.getAttribute('href') === '#' + e.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    navLinks.forEach(function (a) { var t = $(a.getAttribute('href')); if (t) navIo.observe(t); });
  }

  /* ---------- phone menu ---------- */
  var menuBtn = $('.menu-btn');
  function closeMenu() {
    root.classList.remove('menu-open');
    if (menuBtn) { menuBtn.setAttribute('aria-expanded', 'false'); menuBtn.setAttribute('aria-label', 'Open menu'); }
  }
  if (menuBtn) {
    menuBtn.addEventListener('click', function () {
      var open = !root.classList.contains('menu-open');
      root.classList.toggle('menu-open', open);
      header.classList.remove('tuck');
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    navLinks.forEach(function (a) { a.addEventListener('click', closeMenu); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
  }

  /* ---------- hero film ---------- */
  var video = $('.hero-video');
  var toggle = $('.vid-toggle');
  var userPaused = false;
  var conn = navigator.connection || {};
  if (video && motion && !conn.saveData) {
    // phones in portrait get an upright cut of the film; big screens get 1080p
    var vw = window.innerWidth, vh0 = window.innerHeight, dpr = window.devicePixelRatio || 1;
    var px = vw * dpr;
    var src = (vw <= 720 && vh0 > vw) ? 'data-src-sm' : (px >= 2600 ? 'data-src-xxl' : (px >= 1500 ? 'data-src-xl' : 'data-src-lg'));
    if (src === 'data-src-sm' && video.getAttribute('data-poster-sm')) video.poster = video.getAttribute('data-poster-sm');
    video.src = video.getAttribute(src);
    video.preload = 'auto';
    var tryPlay = function () {
      if (userPaused) return;
      var p = video.play();
      if (p && p.then) p.then(function () { hero.classList.add('playing'); }).catch(function () { hero.classList.add('no-video'); });
    };
    video.addEventListener('playing', function () { hero.classList.remove('no-video'); hero.classList.add('playing'); });
    tryPlay();
    if (toggle) {
      toggle.hidden = false;
      toggle.addEventListener('click', function () {
        userPaused = !userPaused;
        if (userPaused) { video.pause(); } else { tryPlay(); }
        toggle.classList.toggle('is-paused', userPaused);
        toggle.setAttribute('aria-label', userPaused ? 'Play background video' : 'Pause background video');
      });
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) tryPlay(); else video.pause(); });
      }).observe(hero);
    }
    document.addEventListener('visibilitychange', function () { if (document.hidden) video.pause(); else tryPlay(); });
  } else if (hero) {
    hero.classList.add('no-video');
  }

  /* ---------- pointer depth in the hero (desktop only) ---------- */
  var pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  if (motion && finePointer && hero) {
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      pointer.tx = (e.clientX - r.left) / r.width - 0.5;
      pointer.ty = (e.clientY - r.top) / r.height - 0.5;
      loop();
    });
    hero.addEventListener('pointerleave', function () { pointer.tx = 0; pointer.ty = 0; loop(); });
  }

  /* ---------- parallax: each layer moves at its own speed ----------
     data-speed > 0 moves slower than the page (further away), < 0 faster (closer).
     Hero layers are measured from the top of the page; the rest from the middle of the screen. */
  var layers = [];
  if (motion) {
    $$('[data-speed]').forEach(function (el) {
      var scope = el.closest('[data-scope]') || el.parentElement;
      layers.push({ el: el, scope: scope, speed: parseFloat(el.getAttribute('data-speed')) || 0,
        hero: scope.getAttribute('data-scope') === 'hero', fade: el.hasAttribute('data-fade'),
        px: parseFloat(el.getAttribute('data-px')) || 0 });
    });
  }
  function renderLayers(vh, k) {
    for (var i = 0; i < layers.length; i++) {
      var L = layers[i];
      var r = L.scope.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) continue;
      var d = L.hero ? scrollY() : (vh / 2 - (r.top + r.height / 2));
      var y = d * L.speed * k, x = 0;
      if (L.px) { x = pointer.x * L.px; y += pointer.y * L.px * 0.6; }
      L.el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
      if (L.fade) L.el.style.opacity = Math.max(0, 1 - Math.max(0, d) / (vh * 0.75)).toFixed(3);
    }
  }

  function renderScrub(vh) {
    $$('.scrub-words').forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.bottom < -50 || r.top > vh + 50) return;
      // fully lit once the heading's middle reaches about 40% down the screen
      var p = clamp((vh * 0.9 - r.top) / (vh * 0.5 + r.height * 0.5), 0, 1);
      var words = el._words || [];
      var lit = Math.round(p * words.length);
      for (var i = 0; i < words.length; i++) words[i].classList.toggle('on', i < lit);
    });
  }

  /* ---------- the machine: scroll scrubs an orbit around the excavator ---------- */
  var machine = $('.machine');
  var mc = machine && $('.machine-canvas', machine);
  var mctx = mc && mc.getContext ? mc.getContext('2d') : null;
  var mFrames = [], mCount = machine ? parseInt(machine.getAttribute('data-frames'), 10) || 0 : 0;
  var mLoaded = false, mLast = -1;
  var steps = machine ? $$('.mstep', machine) : [];
  var railFill = machine && $('.machine-rail-fill', machine);
  function sizeCanvas() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var cw = mc.clientWidth, ch = mc.clientHeight;
    if (mc.width !== Math.round(cw * dpr) || mc.height !== Math.round(ch * dpr)) {
      mc.width = Math.round(cw * dpr); mc.height = Math.round(ch * dpr); mLast = -1;
    }
  }
  function loadFrames() {
    if (mLoaded || !mCount) return; mLoaded = true;
    // phones get 1280 px stills, desktops 1920, sharp or very wide screens 2560
    var px = window.innerWidth * (window.devicePixelRatio || 1);
    var set = window.innerWidth <= 720 ? 'm' : (px >= 2600 ? 'x' : 'd');
    // every sixth still first, so scrolling works at once, then the ones in between
    var order = [];
    for (var a = 0; a < mCount; a += 6) order.push(a);
    for (var b = 0; b < mCount; b++) if (b % 6) order.push(b);
    order.forEach(function (i) {
      var img = new Image();
      img.decoding = 'async';
      img.onload = function () { mLast = -1; renderMachine(window.innerHeight, true); };
      img.src = 'assets/machine/' + set + '/' + String(i).padStart(3, '0') + '.webp';
      mFrames[i] = img;
    });
  }
  function ready(img) { return img && img.complete && img.naturalWidth > 0; }
  function drawFrame(i, p) {
    var img = mFrames[i];
    // until every frame has arrived, show the nearest one that has
    for (var k = 1; !ready(img) && k < mCount; k++) {
      img = ready(mFrames[i - k]) ? mFrames[i - k] : mFrames[i + k];
    }
    if (!ready(img)) return false;
    var W = mc.width, H = mc.height, iw = img.naturalWidth, ih = img.naturalHeight, dw, dh, dx, dy;
    if (W / H >= 1) {
      // a little larger than cover and shifted left, so the machine clears the text on the right
      // the camera also pushes in slightly as the orbit goes round
      var s = Math.max(W / iw, H / ih) * (1.14 + 0.1 * p); dw = iw * s; dh = ih * s;
      dx = clamp((W - dw) / 2 - W * (0.07 + 0.07 * p), W - dw, 0); dy = (H - dh) / 2;
    }
    else { dw = W * 1.5; dh = dw * ih / iw; dx = (W - dw) / 2; dy = H * 0.46 - dh / 2; }
    mctx.fillStyle = '#14120F'; mctx.fillRect(0, 0, W, H);
    mctx.drawImage(img, dx, dy, dw, dh);
    return img === mFrames[i];
  }
  function renderMachine(vh, force) {
    if (!machine) return;
    var r = machine.getBoundingClientRect();
    if (r.bottom < -vh || r.top > vh * 2.5) return;
    if (motion && mctx) loadFrames();
    var p = clamp(-r.top / Math.max(1, r.height - vh), 0, 1);
    var step = Math.min(steps.length - 1, Math.floor(p * steps.length * 0.999));
    if (motion) for (var i = 0; i < steps.length; i++) steps[i].classList.toggle('is-on', i === step);
    if (railFill) railFill.style.transform = 'scaleY(' + p.toFixed(4) + ')';
    if (!motion || !mctx || !mCount) return;
    var f = Math.round(p * (mCount - 1));
    if (f !== mLast || force) {
      sizeCanvas();
      var exact = drawFrame(f, f / Math.max(1, mCount - 1));
      if (exact || force) machine.classList.add('has-frame');
      mLast = exact ? f : -1;
    }
  }

  /* ---------- marquee: drifts on its own, faster and in the scroll direction while scrolling ---------- */
  var mq = $('.marquee-track');
  var mqX = 0, mqVis = false, mqBoost = 0, mqDir = -1, mqLastY = scrollY();
  if (mq && motion && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { mqVis = es[0].isIntersecting; if (mqVis) loop(); }).observe(mq);
  }

  /* ---------- the frame loop ---------- */
  var ticking = false, looping = false;
  function render() {
    ticking = false;
    var vh = window.innerHeight;
    var k = window.innerWidth < 720 ? 0.6 : 1;
    pointer.x += (pointer.tx - pointer.x) * 0.08;
    pointer.y += (pointer.ty - pointer.y) * 0.08;
    if (layers.length) renderLayers(vh, k);
    if (motion) renderScrub(vh);
    renderMachine(vh);
  }
  function loop() {
    if (looping || !motion) return; looping = true;
    var step = function () {
      var moving = Math.abs(pointer.tx - pointer.x) > 0.002 || Math.abs(pointer.ty - pointer.y) > 0.002;
      if (mqVis && mq) {
        var y = scrollY(), dy = y - mqLastY; mqLastY = y;
        if (dy) { mqDir = dy > 0 ? -1 : 1; mqBoost = Math.min(14, mqBoost + Math.abs(dy) * 0.12); }
        mqBoost *= 0.92;
        mqX += mqDir * (0.6 + mqBoost);
        var half = mq.scrollWidth / 2;
        if (mqX <= -half) mqX += half;
        if (mqX > 0) mqX -= half;
        mq.style.transform = 'translate3d(' + mqX.toFixed(1) + 'px,0,0)';
      }
      if (moving) render();
      if (mqVis || moving) requestAnimationFrame(step); else looping = false;
    };
    requestAnimationFrame(step);
  }
  function onScroll() {
    onScrollUi();
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(render);
    // rAF does not run in a hidden tab; keep things right when it comes back
    setTimeout(function () { if (ticking) render(); }, 120);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  var lastW = window.innerWidth;
  window.addEventListener('resize', function () {
    // phones change height as the address bar slides; only redraw fully on real width changes
    if (Math.abs(window.innerWidth - lastW) > 2) { lastW = window.innerWidth; mLast = -1; }
    onScroll();
  });
  onScrollUi();
  render();

  /* ---------- reveal on scroll ---------- */
  var rv = $$('.rv, .reveal-img, .split-words, .foot-word');
  function reveal(el) {
    el.classList.add('in');
    if (el.classList.contains('odo')) rollOdo(el);
    $$('.odo', el).forEach(rollOdo);
  }
  function revealCheck() {
    var vh = window.innerHeight;
    rv = rv.filter(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < vh * 0.9 && r.bottom > 0) { reveal(el); return false; }
      return true;
    });
  }
  if (motion) {
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { reveal(e.target); io.unobserve(e.target); } });
      }, { rootMargin: '0px 0px -10% 0px' });
      rv.forEach(function (el) { io.observe(el); });
    }
    // backup for browsers or panes where the observer is paused
    window.addEventListener('scroll', function () { if (rv.length) revealCheck(); }, { passive: true });
    revealCheck();
  } else {
    rv.forEach(reveal);
  }

  /* ---------- buttons lean toward the pointer (desktop only) ---------- */
  if (motion && finePointer) {
    $$('.magnetic').forEach(function (b) {
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) / r.width, y = (e.clientY - r.top - r.height / 2) / r.height;
        b.style.transform = 'translate(' + (x * 10).toFixed(1) + 'px,' + (y * 8).toFixed(1) + 'px)';
      });
      b.addEventListener('pointerleave', function () { b.style.transform = ''; });
    });
  }

  /* ---------- photo viewer ---------- */
  var lbx = $('.lbx');
  var shots = $$('.shot-btn');
  var lbxIndex = 0, lastFocus = null;
  function showShot(i) {
    lbxIndex = (i + shots.length) % shots.length;
    var b = shots[lbxIndex], img = $('img', b), cap = b.parentElement.querySelector('figcaption');
    var li = $('.lbx-img', lbx);
    li.src = b.getAttribute('data-full'); li.alt = img.alt;
    $('.lbx-cap', lbx).textContent = cap ? cap.textContent : '';
    $('.lbx-count', lbx).textContent = (lbxIndex + 1) + ' / ' + shots.length;
    if (motion) { li.style.animation = 'none'; void li.offsetWidth; li.style.animation = ''; }
  }
  shots.forEach(function (b) {
    var cap = b.parentElement.querySelector('figcaption');
    b.setAttribute('aria-label', 'View larger: ' + (cap ? cap.textContent : 'photo'));
  });
  if (lbx && typeof lbx.showModal === 'function') {
    shots.forEach(function (b, i) {
      b.addEventListener('click', function () { lastFocus = b; showShot(i); lbx.showModal(); });
    });
    $('.lbx-close', lbx).addEventListener('click', function () { lbx.close(); });
    $('.lbx-prev', lbx).addEventListener('click', function () { showShot(lbxIndex - 1); });
    $('.lbx-next', lbx).addEventListener('click', function () { showShot(lbxIndex + 1); });
    lbx.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') showShot(lbxIndex - 1);
      if (e.key === 'ArrowRight') showShot(lbxIndex + 1);
    });
    // a click on the dark background closes it
    lbx.addEventListener('click', function (e) { if (e.target === lbx) lbx.close(); });
    lbx.addEventListener('close', function () { if (lastFocus) lastFocus.focus(); });
    // swipe left and right on phones
    var sx = null;
    lbx.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    lbx.addEventListener('touchend', function (e) {
      if (sx === null) return;
      var dx = e.changedTouches[0].clientX - sx; sx = null;
      if (Math.abs(dx) > 50) showShot(lbxIndex + (dx < 0 ? 1 : -1));
    });
  } else {
    // very old browsers: open the large photo directly
    shots.forEach(function (b) { b.addEventListener('click', function () { window.open(b.getAttribute('data-full'), '_blank'); }); });
  }

  /* ---------- open now / closed, in Sydney time ---------- */
  var status = $('[data-status]');
  try {
    var parts = new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Sydney', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(new Date());
    var get = function (t) { for (var i = 0; i < parts.length; i++) if (parts[i].type === t) return parts[i].value; return ''; };
    var days = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    var day = days[get('weekday').slice(0, 3)];
    var mins = parseInt(get('hour'), 10) * 60 + parseInt(get('minute'), 10);
    var row = $('.hours-table tr[data-day="' + day + '"]');
    if (row) row.classList.add('today');
    var weekday = day >= 1 && day <= 5;
    var open = weekday && mins >= 7 * 60 && mins < 17 * 60;
    var text;
    if (open) text = 'Open now · until 5 pm';
    else if (weekday && mins < 7 * 60) text = 'Closed · opens 7 am today';
    else if (day >= 1 && day <= 4) text = 'Closed · opens 7 am tomorrow';
    else text = 'Closed · opens 7 am Monday';
    if (status && day !== undefined && !isNaN(mins)) {
      status.textContent = text;
      status.classList.toggle('is-open', open);
      status.hidden = false;
    }
  } catch (e) { /* the table still shows the hours */ }

  /* ---------- footer year ---------- */
  var yr = $('[data-year]');
  if (yr) yr.textContent = String(new Date().getFullYear());
})();
