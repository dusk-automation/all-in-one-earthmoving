/* All-In-One Earthmoving: design preview by Dusk.
   Motion only runs when <html> has .motion (set in the head unless the visitor asks for reduced motion).
   Without this script the page is complete and still: poster image, no parallax. */
(function () {
  'use strict';
  window.__aio = true;
  var root = document.documentElement;
  var motion = root.classList.contains('motion');
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- header and phone action bar ---------- */
  var header = $('.site-header');
  var bar = $('.action-bar');
  var hero = $('.hero');
  function onScrollUi() {
    var y = window.scrollY || window.pageYOffset;
    header.classList.toggle('scrolled', y > 40);
    if (bar) bar.classList.toggle('show', y > (hero ? hero.offsetHeight * 0.55 : 300));
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
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    $$('.nav a').forEach(function (a) { a.addEventListener('click', closeMenu); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
  }

  /* ---------- hero video ---------- */
  var video = $('.hero-video');
  var toggle = $('.vid-toggle');
  var userPaused = false;
  var conn = navigator.connection || {};
  if (video && motion && !conn.saveData) {
    // the smaller file for phones and narrow windows, chosen once when the page opens
    var wide = Math.max(window.innerWidth, window.innerHeight) > 900 && window.innerWidth > 720;
    video.src = video.getAttribute(wide ? 'data-src-lg' : 'data-src-sm');
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
    // save battery: stop the clip while the hero is off screen or the tab is hidden
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) tryPlay(); else video.pause(); });
      }).observe(hero);
    }
    document.addEventListener('visibilitychange', function () { if (document.hidden) video.pause(); else tryPlay(); });
  } else if (hero) {
    hero.classList.add('no-video');
  }

  /* ---------- parallax: each layer moves at its own speed ----------
     data-speed > 0 moves slower than the page (further away), < 0 faster (closer).
     Layers in the hero are measured from the top of the page; the rest from the
     middle of the screen, so they sit in their natural place at mid-screen. */
  var layers = [];
  if (motion) {
    $$('[data-speed]').forEach(function (el) {
      var scope = el.closest('[data-scope]') || el.parentElement;
      layers.push({ el: el, scope: scope, speed: parseFloat(el.getAttribute('data-speed')) || 0, hero: scope.getAttribute('data-scope') === 'hero', fade: el.hasAttribute('data-fade') });
    });
  }
  var ticking = false;
  function render() {
    ticking = false;
    var vh = window.innerHeight;
    var k = window.innerWidth < 720 ? 0.6 : 1;
    for (var i = 0; i < layers.length; i++) {
      var L = layers[i];
      var r = L.scope.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) continue;
      var d = L.hero ? (window.scrollY || window.pageYOffset) : (vh / 2 - (r.top + r.height / 2));
      var y = d * L.speed * k;
      L.el.style.transform = 'translate3d(0,' + y.toFixed(1) + 'px,0)';
      if (L.fade) L.el.style.opacity = Math.max(0, 1 - Math.max(0, d) / (vh * 0.75)).toFixed(3);
    }
  }
  function onScroll() {
    onScrollUi();
    if (!layers.length || ticking) return;
    ticking = true;
    window.requestAnimationFrame(render);
    // rAF does not run in a hidden tab; keep layers right when it comes back
    setTimeout(function () { if (ticking) render(); }, 120);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScrollUi();
  render();

  /* ---------- reveal on scroll ---------- */
  var rv = $$('.rv');
  function revealCheck() {
    var vh = window.innerHeight;
    rv = rv.filter(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < vh * 0.92 && r.bottom > 0) { el.classList.add('in'); return false; }
      return true;
    });
  }
  if (motion) {
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
      }, { rootMargin: '0px 0px -8% 0px' });
      rv.forEach(function (el) { io.observe(el); });
    }
    // backup for browsers or panes where the observer is paused
    window.addEventListener('scroll', function () { if (rv.length) revealCheck(); }, { passive: true });
    revealCheck();
  } else {
    rv.forEach(function (el) { el.classList.add('in'); });
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
