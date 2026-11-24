// Theme toggle, menus, project filters, slideshows, image zoom, scroll reveal, clip playback.
(function () {
  var root = document.documentElement;
  root.classList.add('js');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function play(v) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }

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
    // auto-cycle, paused while hovered or focused
    if (n > 1 && !reduceMotion) {
      var hold = false;
      ss.addEventListener('mouseenter', function () { hold = true; });
      ss.addEventListener('mouseleave', function () { hold = false; });
      ss.addEventListener('focusin', function () { hold = true; });
      ss.addEventListener('focusout', function () { hold = false; });
      setInterval(function () { if (!hold && !document.hidden) go(i + 1); }, 3800);
    }
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

  // ---------- project page videos: autoplay (muted) while on screen ----------
  document.querySelectorAll('video.autoplay').forEach(function (v) {
    if (reduceMotion) return;
    var userPaused = false;
    v.addEventListener('pause', function () { if (v.dataset.auto !== '1') userPaused = true; v.dataset.auto = ''; });
    v.addEventListener('play', function () { userPaused = false; });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { if (!userPaused) play(v); }
          else if (!v.paused) { v.dataset.auto = '1'; v.pause(); }
        });
      }, { threshold: 0.35 }).observe(v);
    } else { play(v); }
  });

  // ---------- homepage spotlight ----------
  document.querySelectorAll('.spotlight').forEach(function (sp) {
    var slides = sp.querySelectorAll('.sp-slide');
    var items = sp.querySelectorAll('.sp-item');
    var dur = parseInt(sp.getAttribute('data-interval'), 10) || 6500;
    sp.style.setProperty('--sp-dur', dur + 'ms');
    var cur = 0, visible = false, hover = false;

    function setActive(n) {
      cur = (n + slides.length) % slides.length;
      slides.forEach(function (s, j) {
        var on = j === cur;
        s.classList.toggle('is-active', on);
        s.setAttribute('aria-hidden', on ? 'false' : 'true');
        var v = s.querySelector('video');
        if (!v) return;
        if (on && visible && !reduceMotion) { v.preload = 'auto'; v.currentTime = 0; play(v); }
        else v.pause();
      });
      items.forEach(function (it, j) {
        it.classList.toggle('is-active', j === cur);
        // restart the progress bar animation
        var bar = it.querySelector('.sp-bar i');
        if (bar) { bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = ''; }
      });
      // warm up the next clip
      var nv = slides[(cur + 1) % slides.length].querySelector('video');
      if (nv && nv.preload === 'none') nv.preload = 'metadata';
    }
    function updatePause() { sp.classList.toggle('is-paused', hover || !visible || reduceMotion); }

    items.forEach(function (it, j) {
      it.addEventListener('mouseenter', function () { if (j !== cur) setActive(j); });
      it.addEventListener('focus', function () { if (j !== cur) setActive(j); });
      var bar = it.querySelector('.sp-bar i');
      if (bar) bar.addEventListener('animationend', function () { if (j === cur) setActive(cur + 1); });
    });
    sp.addEventListener('mouseenter', function () { hover = true; updatePause(); });
    sp.addEventListener('mouseleave', function () { hover = false; updatePause(); });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          visible = en.isIntersecting;
          updatePause();
          var v = slides[cur].querySelector('video');
          if (v) { if (visible && !reduceMotion) play(v); else v.pause(); }
        });
      }, { threshold: 0.25 }).observe(sp);
    } else { visible = true; }
    updatePause();
    setActive(0);
  });

  // ---------- interactive exoskeleton ----------
  document.querySelectorAll('.exo').forEach(function (exo) {
    var fig = exo.querySelector('.exo-figure');
    var svg = exo.querySelector('.exo-svg');
    var tip = exo.querySelector('.exo-tip');
    var detail = exo.querySelector('.exo-detail');
    var emptyDetail = detail.innerHTML;
    var parts = exo.querySelectorAll('.exo-part');
    var keys = exo.querySelectorAll('.exo-key');
    var pinned = null;

    function content(key) {
      var k = exo.querySelector('.exo-key[data-part="' + key + '"]');
      return k ? k.parentElement.querySelector('template').innerHTML : '';
    }
    function show(key) {
      exo.classList.add('has-active');
      parts.forEach(function (p) { p.classList.toggle('is-active', p.dataset.part === key); });
      keys.forEach(function (k) { k.classList.toggle('is-active', k.dataset.part === key); });
      var p = exo.querySelector('.exo-part[data-part="' + key + '"]');
      var html = content(key);
      detail.innerHTML = html;
      tip.innerHTML = html.split('</strong>')[0] + '</strong>';
      tip.hidden = false;
      // position the card next to the part, inside the photo
      var box = svg.getBoundingClientRect(), fbox = fig.getBoundingClientRect();
      var vb = svg.viewBox.baseVal;
      var x = box.left - fbox.left + box.width * (parseFloat(p.dataset.cx) - vb.x) / vb.width;
      var y = box.top - fbox.top + box.height * (parseFloat(p.dataset.cy) - vb.y) / vb.height;
      var half = Math.min(tip.offsetWidth / 2, fbox.width * 0.45);
      x = Math.max(half + 8, Math.min(fbox.width - half - 8, x));
      tip.style.left = x + 'px';
      tip.style.top = y + 'px';
      tip.classList.toggle('below', y < fbox.height * 0.45);
    }
    function hide() {
      if (pinned) { show(pinned); return; }
      exo.classList.remove('has-active');
      parts.forEach(function (p) { p.classList.remove('is-active'); });
      keys.forEach(function (k) { k.classList.remove('is-active'); });
      tip.hidden = true;
      detail.innerHTML = emptyDetail;
    }
    parts.forEach(function (p) {
      p.addEventListener('mouseenter', function () { show(p.dataset.part); });
      p.addEventListener('mouseleave', hide);
      p.addEventListener('focus', function () { show(p.dataset.part); });
      p.addEventListener('blur', hide);
      p.addEventListener('click', function (e) { e.stopPropagation(); pinned = pinned === p.dataset.part ? null : p.dataset.part; pinned ? show(pinned) : hide(); });
      p.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); p.dispatchEvent(new Event('click')); } });
    });
    keys.forEach(function (k) {
      k.addEventListener('mouseenter', function () { show(k.dataset.part); });
      k.addEventListener('mouseleave', hide);
      k.addEventListener('focus', function () { show(k.dataset.part); });
      k.addEventListener('blur', hide);
      k.addEventListener('click', function (e) { e.stopPropagation(); pinned = pinned === k.dataset.part ? null : k.dataset.part; pinned ? show(pinned) : hide(); });
    });
    document.addEventListener('click', function (e) { if (pinned && !e.target.closest('.exo')) { pinned = null; hide(); } });
    window.addEventListener('resize', function () { if (pinned) show(pinned); });
  });
})();
