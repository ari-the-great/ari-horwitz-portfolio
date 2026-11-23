// Menu, slideshows and image zoom.
(function () {
  // Mobile menu
  var nav = document.querySelector('.nav');
  var toggle = document.querySelector('.nav-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open);
    });
  }
  // Dropdowns (click/tap; hover also works on desktop via CSS)
  document.querySelectorAll('.sub-toggle').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var li = btn.parentElement;
      var open = !li.classList.contains('open');
      document.querySelectorAll('.has-sub.open').forEach(function (o) { o.classList.remove('open'); o.firstElementChild.setAttribute('aria-expanded', 'false'); });
      if (open) { li.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); }
    });
  });
  document.addEventListener('click', function () {
    document.querySelectorAll('.has-sub.open').forEach(function (o) { o.classList.remove('open'); });
  });

  // Slideshows
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

  // Click an image to see it larger
  document.addEventListener('click', function (e) {
    var img = e.target.closest('img[data-zoom]');
    if (!img) return;
    var box = document.createElement('div');
    box.className = 'lightbox';
    var big = document.createElement('img');
    big.src = img.src; big.alt = img.alt;
    box.appendChild(big);
    box.addEventListener('click', function () { box.remove(); });
    document.addEventListener('keydown', function esc(ev) { if (ev.key === 'Escape') { box.remove(); document.removeEventListener('keydown', esc); } });
    document.body.appendChild(box);
  });
})();
