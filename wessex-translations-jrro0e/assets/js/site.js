/* Wessex Translations concept: page behaviour. Every part of the page works without this file. */
(function () {
  'use strict';
  var api = window.ConceptSite.init();
  var gsap = window.gsap, ST = window.ScrollTrigger;
  var fine = window.matchMedia('(pointer: fine)').matches;

  /* ---------- mobile menu ---------- */
  var mb = document.querySelector('.menu-btn'), mn = document.getElementById('mnav');
  if (mb && mn) {
    mb.addEventListener('click', function () {
      var open = mb.getAttribute('aria-expanded') === 'true';
      mb.setAttribute('aria-expanded', String(!open)); mn.hidden = open;
    });
    mn.addEventListener('click', function (e) { if (e.target.tagName === 'A') { mb.setAttribute('aria-expanded', 'false'); mn.hidden = true; } });
  }

  /* ---------- hero: the speech-bubble lens ---------- */
  (function () {
    var hero = document.querySelector('.hero'), lens = hero && hero.querySelector('.lens');
    if (!hero || !lens || !api.motion) return;
    var trs = [].slice.call(lens.querySelectorAll('.tr')), tag = lens.querySelector('.tag');
    var li = 0, x = -999, y = -999, tx = 0, ty = 0, s = 0, ts = 0, seen = false, auto = !fine, t0 = 0, lastSwap = 0, visible = true;
    function size() { return Math.max(220, Math.min(330, window.innerWidth * 0.23)); }
    function setLang(i) {
      li = (i + trs.length) % trs.length;
      trs.forEach(function (t, k) { t.classList.toggle('on', k === li); });
      tag.textContent = trs[li].getAttribute('data-name');
    }
    function headBox() {
      var h = hero.querySelector('h1').getBoundingClientRect(), r = hero.getBoundingClientRect();
      return { x: h.left - r.left, y: h.top - r.top, w: h.width, h: h.height };
    }
    hero.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      var r = hero.getBoundingClientRect(); tx = e.clientX - r.left; ty = e.clientY - r.top;
      if (!seen) { x = tx; y = ty; seen = true; }
      auto = false; ts = size();
    });
    hero.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse' && seen) setLang(li + 1); });
    hero.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') ts = 0; });
    hero.addEventListener('click', function (e) {
      if (e.target.closest('a,button')) return;
      setLang(li + 1); lastSwap = performance.now();
    });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(hero);
    setLang(0);
    gsap.ticker.add(function () {
      if (!visible) return;
      var now = performance.now();
      if (auto) {
        if (!t0) { t0 = now; lastSwap = now; }
        var b = headBox(), t = (now - t0) / 1000;
        tx = b.x + b.w * (0.5 + 0.38 * Math.sin(t * 0.42));
        ty = b.y + b.h * (0.5 + 0.34 * Math.sin(t * 0.67 + 1.2));
        if (x < -900) { x = tx; y = ty; }
        var ph = t % 10;
        ts = ph < 6.5 ? size() * 0.85 : 0;
        if (ph >= 6.5 && now - lastSwap > 3000) { setLang(li + 1); lastSwap = now; }
      }
      x += (tx - x) * 0.14; y += (ty - y) * 0.14; s += (ts - s) * 0.12;
      if (s < 0.5 && ts === 0) s = 0;
      var w = s, h = s * 1.0288, lx = x - w * 0.5, ly = y - h * 0.44;
      lens.style.webkitMaskSize = lens.style.maskSize = w.toFixed(1) + 'px ' + h.toFixed(1) + 'px';
      lens.style.webkitMaskPosition = lens.style.maskPosition = lx.toFixed(1) + 'px ' + ly.toFixed(1) + 'px';
      tag.style.transform = 'translate(' + (x - tag.offsetWidth / 2).toFixed(1) + 'px,' + (y + s * 0.2).toFixed(1) + 'px)';
    });
  })();

  /* ---------- typesetting scene: original to translation ---------- */
  (function () {
    var scene = document.getElementById('typesetting');
    if (!scene) return;
    var pages = [].slice.call(scene.querySelectorAll('.page'));
    var btns = [].slice.call(scene.querySelectorAll('.langs button'));
    var bars = btns.map(function (b) { return b.querySelector('.bar i'); });
    var div = scene.querySelector('.divider'), divLab = div.querySelector('b');
    var codes = ['EN', 'FR', 'DE', 'AR'];
    var r = { a: 0, b: 0, c: 0 }, active = 0, st = null;
    function apply() {
      var v = [1, r.a, r.b, r.c];
      for (var k = 1; k < 4; k++) {
        var cut = ((1 - v[k]) * 100).toFixed(2) + '%';
        var cp = k === 3 ? 'inset(0 0 0 ' + cut + ')' : 'inset(0 ' + cut + ' 0 0)';
        pages[k].style.clipPath = cp; pages[k].style.webkitClipPath = cp;
      }
      var a = 0; for (k = 1; k < 4; k++) if (v[k] >= 0.5) a = k;
      var w = -1; for (k = 3; k >= 1; k--) if (v[k] > 0.001 && v[k] < 0.999) { w = k; break; }
      if (w > 0) {
        var pct = w === 3 ? (1 - v[w]) : v[w];
        div.style.opacity = 1; div.style.left = (pct * 100).toFixed(2) + '%'; divLab.textContent = codes[w];
      } else div.style.opacity = 0;
      bars.forEach(function (bar, k) { bar.style.transform = 'scaleX(' + (k === 0 ? 1 : v[k]) + ')'; });
      if (a !== active) {
        active = a;
        btns.forEach(function (b, k) { b.setAttribute('aria-pressed', String(k === a)); });
        pages.forEach(function (p, k) { if (k === a) p.removeAttribute('aria-hidden'); else p.setAttribute('aria-hidden', 'true'); });
      }
    }
    function go(k, instant) {
      var target = { a: k >= 1 ? 1 : 0, b: k >= 2 ? 1 : 0, c: k >= 3 ? 1 : 0 };
      if (instant || !api.motion) { r.a = target.a; r.b = target.b; r.c = target.c; apply(); return; }
      gsap.to(r, { a: target.a, b: target.b, c: target.c, duration: 1.1, ease: 'power3.inOut', onUpdate: apply, overwrite: true });
    }
    apply();
    // seg: hold .5, wipe 1, hold .6, wipe 1, hold .6, wipe 1, hold .5  (total 5.2)
    var U = 5.2, stops = [0.25 / U, 1.8 / U, 3.4 / U, 4.98 / U];
    function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
    if (api.motion) {
      var mm = gsap.matchMedia();
      mm.add('(min-width: 901px)', function () {
        st = ST.create({
          trigger: scene, start: 'top top', end: '+=2600', pin: true, scrub: 0.6, anticipatePin: 1,
          onUpdate: function (self) {
            var t = self.progress * U;
            r.a = clamp(t - 0.5); r.b = clamp(t - 2.1); r.c = clamp(t - 3.7); apply();
          }
        });
        return function () { st = null; };
      });
    }
    btns.forEach(function (b, k) {
      b.addEventListener('click', function () {
        if (st) {
          var y = st.start + (st.end - st.start) * stops[k];
          if (api.lenis) api.lenis.scrollTo(y, { duration: 1.4 }); else window.scrollTo({ top: y, behavior: 'smooth' });
        } else go(k);
      });
    });
    // on phones, play it once when it comes into view
    if (api.motion) {
      ST.create({ trigger: scene.querySelector('.stage'), start: 'top 70%', once: true, onEnter: function () {
        if (st) return;
        var i = 0; var step = function () { i++; if (i > 3 || st) return; go(i); setTimeout(step, 2200); };
        setTimeout(step, 600);
      } });
    }
  })();

  /* ---------- proofreading marks ---------- */
  if (api.motion) {
    document.querySelectorAll('.pm path').forEach(function (p) {
      var len = p.getTotalLength();
      p.style.strokeDasharray = len; p.style.strokeDashoffset = len;
      gsap.to(p, { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut', delay: 0.55, scrollTrigger: { trigger: p.closest('h2'), start: 'top 80%', once: true } });
    });
  }

  /* ---------- specialism tabs ---------- */
  (function () {
    var tabs = [].slice.call(document.querySelectorAll('[role=tab]'));
    function select(t, focus) {
      tabs.forEach(function (o) {
        var on = o === t, p = document.getElementById(o.getAttribute('aria-controls'));
        o.setAttribute('aria-selected', String(on)); o.tabIndex = on ? 0 : -1;
        p.hidden = !on;
        if (on) { p.classList.remove('anim'); void p.offsetWidth; p.classList.add('anim'); }
      });
      if (focus) t.focus();
      if (window.ScrollTrigger) ST.refresh();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t); });
      t.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
        if (e.key === 'Home') n = tabs[0];
        if (e.key === 'End') n = tabs[tabs.length - 1];
        if (n) { e.preventDefault(); select(n, true); }
      });
    });
  })();

  /* ---------- quote request (sends nothing) ---------- */
  (function () {
    var f = document.getElementById('wiz');
    if (!f) return;
    var steps = [].slice.call(f.querySelectorAll('fieldset[data-step]'));
    var bar = [].slice.call(f.querySelectorAll('.steps-bar > div'));
    var back = document.getElementById('wiz-back'), next = document.getElementById('wiz-next'), err = document.getElementById('wiz-err');
    var status = document.getElementById('wiz-status'), cur = 0;
    function show(i) {
      cur = i; err.textContent = '';
      steps.forEach(function (s, k) { s.hidden = k !== i; });
      bar.forEach(function (b, k) { b.className = k < i ? 'done' : k === i ? 'cur' : ''; });
      back.hidden = i === 0;
      next.firstChild.textContent = i === steps.length - 1 ? 'Request my quote ' : 'Continue ';
      status.textContent = 'Step ' + (i + 1) + ' of ' + steps.length + ': ' + steps[i].querySelector('legend').textContent;
      var first = steps[i].querySelector('input:not([type=hidden]),select,textarea');
      if (first && f.dataset.started) first.focus({ preventScroll: true });
      f.dataset.started = '1';
      if (window.ScrollTrigger) ST.refresh();
    }
    back.addEventListener('click', function () { if (cur > 0) show(cur - 1); });
    var fl = document.getElementById('files'), list = document.getElementById('file-list');
    fl.addEventListener('change', function () {
      list.textContent = '';
      [].slice.call(fl.files).forEach(function (file) {
        var li = document.createElement('li'), n = document.createElement('b'), sz = document.createElement('span');
        n.textContent = file.name; n.style.fontWeight = 500;
        sz.textContent = file.size > 1048576 ? (file.size / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(file.size / 1024)) + ' KB';
        li.appendChild(n); li.appendChild(sz); list.appendChild(li);
      });
    });
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      if (cur === 1 && !f.querySelector('input[name=to]:checked')) { err.textContent = 'Please choose at least one language to translate into.'; return; }
      if (cur < steps.length - 1) { show(cur + 1); return; }
      var bad = null;
      steps[cur].querySelectorAll('[required]').forEach(function (el) {
        var ok = el.value.trim() !== '' && (el.type !== 'email' || /.+@.+\..+/.test(el.value));
        el.setAttribute('aria-invalid', ok ? 'false' : 'true');
        if (!ok && !bad) bad = el;
      });
      if (bad) { err.textContent = 'Please add your name and a valid email address.'; bad.focus(); return; }
      steps.forEach(function (s) { s.hidden = true; });
      document.getElementById('wiz-nav').hidden = true; err.textContent = '';
      f.querySelector('.steps-bar').style.display = 'none';
      document.getElementById('wiz-ref').textContent = 'Q-' + String(Math.floor(1000 + Math.random() * 9000));
      var d = document.getElementById('wiz-done'); d.hidden = false; d.focus({ preventScroll: true });
      status.textContent = 'Request sent. This is a preview — the form will go live with your new site.';
      if (window.ScrollTrigger) ST.refresh();
    });
    show(0);
  })();
})();
