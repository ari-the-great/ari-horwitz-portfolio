// Theme toggle, menus, project filters, slideshows, image zoom, scroll reveal, clip playback.
(function () {
  var root = document.documentElement;
  root.classList.add('js');

  // ---------- dark mode ----------
  var themeBtn = document.querySelector('.theme-toggle');
  function setThemeLabel() {
    if (!themeBtn) return;
    var dark = root.getAttribute('data-theme') === 'dark';
    themeBtn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
  }
  setThemeLabel();
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
      setThemeLabel();
    });
  }

  // ---------- mobile menu ----------
  var nav = document.querySelector('.nav');
  var navToggle = document.querySelector('.nav-toggle');
  if (navToggle && nav) {
    navToggle.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = nav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', open);
      navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
  }

  // ---------- dropdowns ----------
  function closeAll(except) {
    document.querySelectorAll('.has-sub.open').forEach(function (li) {
      if (li === except) return;
      li.classList.remove('open');
      li.querySelector('.sub-toggle').setAttribute('aria-expanded', 'false');
    });
  }
  var desktop = window.matchMedia('(min-width: 1081px)');
  document.querySelectorAll('.has-sub').forEach(function (li) {
    var btn = li.querySelector('.sub-toggle');
    var timer;
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = !li.classList.contains('open');
      closeAll(li);
      li.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', open);
    });
    li.addEventListener('mouseenter', function () {
      if (!desktop.matches) return;
      clearTimeout(timer); closeAll(li);
      li.classList.add('open'); btn.setAttribute('aria-expanded', 'true');
    });
    li.addEventListener('mouseleave', function () {
      if (!desktop.matches) return;
      timer = setTimeout(function () { li.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }, 180);
    });
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.has-sub')) closeAll();
    if (nav && nav.classList.contains('open') && !e.target.closest('.nav')) {
      nav.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeAll();
  });

  // ---------- project filters (home) ----------
  var chips = document.querySelectorAll('.chip[data-filter]');
  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var f = chip.getAttribute('data-filter');
      chips.forEach(function (c) { c.setAttribute('aria-pressed', c === chip); });
      document.querySelectorAll('.card[data-group]').forEach(function (card) {
        card.hidden = !(f === 'all' || card.getAttribute('data-group') === f);
        if (!card.hidden) card.classList.add('in');
      });
    });
  });

  // ---------- slideshows ----------
  document.querySelectorAll('.slideshow').forEach(function (ss) {
    var track = ss.querySelector('.slides');
    var n = track.children.length, i = 0;
    var dots = ss.querySelector('.ss-dots');
    for (var k = 0; k < n; k++) {
      var d = document.createElement('button');
      d.setAttribute('aria-label', 'Slide ' + (k + 1));
      d.addEventListener('click', (function (k) { return function () { go(k); }; })(k));
      dots.appendChild(d);
    }
    function go(k) {
      i = (k + n) % n;
      track.style.transform = 'translateX(' + (-100 * i) + '%)';
      Array.prototype.forEach.call(dots.children, function (d, j) { d.setAttribute('aria-current', j === i); });
    }
    ss.querySelector('.ss-prev').addEventListener('click', function () { go(i - 1); });
    ss.querySelector('.ss-next').addEventListener('click', function () { go(i + 1); });
    if (n < 2) { ss.querySelector('.ss-prev').hidden = ss.querySelector('.ss-next').hidden = true; }
    go(0);
  });

  // ---------- click an image to see it larger ----------
  document.addEventListener('click', function (e) {
    var img = e.target.closest('img[data-zoom]');
    if (!img) return;
    var box = document.createElement('div');
    box.className = 'lightbox';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', 'Enlarged image');
    var big = document.createElement('img');
    big.src = img.src; big.alt = img.alt;
    box.appendChild(big);
    function close() { box.remove(); document.removeEventListener('keydown', onKey); }
    function onKey(ev) { if (ev.key === 'Escape') close(); }
    box.addEventListener('click', close);
    document.addEventListener('keydown', onKey);
    document.body.appendChild(box);
  });

  // ---------- scroll reveal ----------
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  // ---------- homepage clips: only play while visible, respect reduced motion ----------
  var clips = document.querySelectorAll('video.tile-media');
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  clips.forEach(function (v) {
    if (still) { v.removeAttribute('autoplay'); v.pause(); return; }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
          else v.pause();
        });
      }, { threshold: 0.2 }).observe(v);
    }
  });
})();
