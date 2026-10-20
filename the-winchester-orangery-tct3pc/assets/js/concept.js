/* Shared behaviour for Itchen Studio concept sites.
   Progressive: every page is complete without it; motion runs only when
   the visitor hasn't asked their device to reduce motion. */
(function () {
  'use strict';

  function splitWords(el) {
    var out = [];
    var nodes = Array.prototype.slice.call(el.childNodes);
    el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    nodes.forEach(function (n) {
      if (n.nodeType === 3) {
        var frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
          var o = document.createElement('span'); o.className = 'sw'; o.setAttribute('aria-hidden', 'true');
          var i = document.createElement('span'); i.textContent = part;
          o.appendChild(i); frag.appendChild(o); out.push(i);
        });
        el.replaceChild(frag, n);
      } else if (n.nodeType === 1 && n.tagName !== 'BR') {
        out = out.concat(splitWords(n));
      }
    });
    return out;
  }

  function fakeForm(formId, doneId) {
    var f = document.getElementById(formId), done = document.getElementById(doneId);
    if (!f) return;
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = null;
      f.querySelectorAll('[required]').forEach(function (el) {
        var ok = el.value.trim() !== '';
        el.style.borderColor = ok ? '' : '#b3261e';
        el.setAttribute('aria-invalid', ok ? 'false' : 'true');
        if (!ok && !bad) bad = el;
      });
      if (bad) { bad.focus(); return; }
      done.hidden = false;
    });
  }

  function init(opts) {
    opts = opts || {};
    var html = document.documentElement;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var fine = window.matchMedia('(pointer: fine)').matches;
    var api = { motion: false, fakeForm: fakeForm, lenis: null };

    var style = document.createElement('style');
    style.textContent = '.sw{display:inline-block;overflow:hidden;vertical-align:top;padding-bottom:.08em;margin-bottom:-.08em}.sw>span{display:inline-block}';
    document.head.appendChild(style);

    /* header hides on the way down */
    var top = document.querySelector('.top');
    if (top) {
      var lastY = window.scrollY;
      window.addEventListener('scroll', function () {
        var y = window.scrollY;
        if (y > lastY + 6 && y > 500) top.classList.add('away');
        else if (y < lastY - 6) top.classList.remove('away');
        lastY = y;
      }, { passive: true });
      top.addEventListener('focusin', function () { top.classList.remove('away'); });
    }

    if (reduce || !window.gsap || !window.ScrollTrigger) {
      html.classList.remove('motion'); html.classList.add('ready');
      return api;
    }
    var gsap = window.gsap, ST = window.ScrollTrigger;
    gsap.registerPlugin(ST);
    api.motion = true;

    if (window.Lenis && fine) {
      var lenis = new window.Lenis({ lerp: 0.12, smoothWheel: true });
      lenis.on('scroll', ST.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
      api.lenis = lenis;
    }
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href'), t = id.length > 1 && document.querySelector(id);
        if (!t) return;
        e.preventDefault();
        var hh = top ? top.offsetHeight : 0;
        var y = t.getBoundingClientRect().top + window.scrollY - (t.classList.contains('hero') ? 999 : hh);
        if (api.lenis) api.lenis.scrollTo(Math.max(0, y), { duration: 1.3 }); else window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
      });
    });

    /* initial states */
    var lines = gsap.utils.toArray('.hero h1 .ln > span');
    var intro = gsap.utils.toArray('[data-intro]');
    gsap.set(lines, { yPercent: 105, y: 0 });
    gsap.set(intro, { autoAlpha: 0, y: 20 });
    gsap.set('[data-reveal]', { autoAlpha: 0, y: 36 });
    var splits = gsap.utils.toArray('[data-split]').map(function (h) { var w = splitWords(h); gsap.set(w, { yPercent: 110 }); return { el: h, w: w }; });
    html.classList.add('ready');

    var tl = gsap.timeline({ delay: 0.1 });
    tl.from('.hero .bg img', { scale: 1.12, duration: 2.2, ease: 'power2.out' }, 0)
      .to(lines, { yPercent: 0, duration: 1.15, stagger: 0.12, ease: 'expo.out' }, 0.15)
      .to(intro, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.08, ease: 'power3.out' }, 0.45);
    if (document.querySelector('.hero .bg img')) {
      gsap.to('.hero .bg img', { yPercent: 12, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    }

    ST.batch('[data-reveal]', { start: 'top 88%', once: true, onEnter: function (b) { gsap.to(b, { autoAlpha: 1, y: 0, duration: 0.95, stagger: 0.08, ease: 'power3.out', overwrite: true }); } });
    splits.forEach(function (s) { gsap.to(s.w, { yPercent: 0, duration: 1, stagger: 0.04, ease: 'expo.out', scrollTrigger: { trigger: s.el, start: 'top 86%', once: true } }); });

    /* image reveals and parallax */
    gsap.utils.toArray('[data-clip]').forEach(function (el) {
      gsap.fromTo(el, { clipPath: 'inset(18% 10% 18% 10% round 14px)' }, { clipPath: 'inset(0% 0% 0% 0% round 14px)', ease: 'none', scrollTrigger: { trigger: el, start: 'top 92%', end: 'top 40%', scrub: true } });
    });
    gsap.utils.toArray('[data-parallax]').forEach(function (img) {
      gsap.fromTo(img, { yPercent: -8 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    /* counters */
    gsap.utils.toArray('[data-count]').forEach(function (el) {
      var end = +el.dataset.count, o = { v: 0 };
      el.textContent = '0';
      gsap.to(o, { v: end, duration: 1.6, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true },
        onUpdate: function () { el.textContent = Math.round(o.v).toLocaleString('en-GB'); } });
    });

    /* ribbons: drift, speed up with scroll, follow direction */
    var rows = gsap.utils.toArray('[data-marquee], .strip .track, .rv-row');
    if (rows.length) {
      var boost = 0, dir = 1;
      ST.create({ start: 0, end: 'max', onUpdate: function (s) { dir = s.direction; boost = Math.min(Math.abs(s.getVelocity()) / 260, 6); } });
      var items = rows.map(function (r) { return { el: r, x: 0, w: 0, base: (+r.dataset.dir || 1) * (+r.dataset.speed || 0.5) }; });
      var measure = function () { items.forEach(function (it) { it.w = it.el.scrollWidth / 2; }); };
      measure(); window.addEventListener('resize', measure); window.addEventListener('load', measure);
      gsap.ticker.add(function (t, dt) {
        boost *= 0.93;
        items.forEach(function (it) {
          if (!it.w) return;
          it.x -= (it.base * (1 + boost)) * dir * (dt / 16.7);
          if (it.x <= -it.w) it.x += it.w;
          if (it.x > 0) it.x -= it.w;
          it.el.style.transform = 'translate3d(' + it.x.toFixed(2) + 'px,0,0)';
        });
      });
    }

    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ST.refresh(); });
    window.addEventListener('load', function () { ST.refresh(); });
    return api;
  }

  window.ConceptSite = { init: init, splitWords: splitWords, fakeForm: fakeForm };
})();
