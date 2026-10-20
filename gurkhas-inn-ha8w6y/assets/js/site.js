(function () {
  'use strict';
  var api = ConceptSite.init();
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* mandala behind the flag */
  var m = $('#mandala');
  if (m) {
    var NS = 'http://www.w3.org/2000/svg', h = '';
    [60, 110, 170, 235, 290].forEach(function (r) { h += '<circle r="' + r + '"/>'; });
    for (var i = 0; i < 16; i++) {
      var a = i * 22.5;
      h += '<g transform="rotate(' + a + ')"><path d="M0 -60C28 -100 28 -140 0 -170C-28 -140 -28 -100 0 -60Z"/><path d="M0 -175C34 -205 34 -250 0 -290C-34 -250 -34 -205 0 -175Z"/></g>';
    }
    m.innerHTML = h;
    if (api.motion) gsap.to(m, { rotation: 90, svgOrigin: '0 0', ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  }

  /* ribbon: second copy is decoration */
  $$('.rv-row').forEach(function (r) { var k = r.children.length / 2; $$('.rv-row > *').slice(k).forEach(function (e) { e.setAttribute('aria-hidden', 'true'); }); });

  /* crest entrance */
  if (api.motion) {
    var kb = $('#heroCrest .kb'), kf = $('#heroCrest .kf'), cr = $('#heroCrest .crown');
    gsap.set(kb, { svgOrigin: '802 740', rotation: -42, opacity: 0 });
    gsap.set(kf, { svgOrigin: '260 740', rotation: 42, opacity: 0 });
    gsap.set(cr, { y: -70, opacity: 0 });
    var t = gsap.timeline({ delay: 0.5 });
    t.to('.hero .flag', { autoAlpha: 1, duration: 0.01 }, 0)
     .to(kb, { rotation: 0, opacity: 1, duration: 1.3, ease: 'power3.out' }, 0.1)
     .to(kf, { rotation: 0, opacity: 1, duration: 1.3, ease: 'power3.out' }, 0.25)
     .to(cr, { y: 0, opacity: 1, duration: 1, ease: 'bounce.out' }, 1.0);
    gsap.fromTo('.hero .flag', { rotation: 6 }, { rotation: 3, duration: 2.4, ease: 'elastic.out(1,.35)', delay: 0.5 });
    /* gentle sway while the hero is on screen */
    gsap.to('.hero .flag', { y: 10, rotation: 2, duration: 3.6, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: 3 });
  }

  /* signature scene: Dhaulagiri to City Road */
  (function () {
    var NS = 'http://www.w3.org/2000/svg', g = $('#stars'), fl = $('#flags'), fs = $('#flagset'), n = 0;
    for (var i = 0; i < 46; i++) { var c = document.createElementNS(NS, 'circle'); c.setAttribute('cx', Math.round((i * 197) % 1500 - 150)); c.setAttribute('cy', Math.round(((i * 83) % 230) - 60)); c.setAttribute('r', i % 5 === 0 ? 2.2 : 1.3); c.setAttribute('opacity', i % 3 ? 0.35 : 0.7); g.appendChild(c); }
    var len = fl.getTotalLength(), cols = ['#3b73c4', '#f6efe3', '#e42218', '#4c9a55', '#e8c13a', '#3b73c4', '#f6efe3', '#e42218'];
    cols.forEach(function (col, i) {
      var t = (i + 0.7) / (cols.length + 0.3), pt = fl.getPointAtLength(len * t), r = document.createElementNS(NS, 'rect');
      r.setAttribute('x', pt.x - 7); r.setAttribute('y', pt.y); r.setAttribute('width', 14); r.setAttribute('height', 18); r.setAttribute('fill', col);
      r.setAttribute('transform', 'rotate(' + (i % 2 ? 5 : -4) + ' ' + pt.x + ' ' + pt.y + ')'); fs.appendChild(r);
    });
  })();
  var ridge = $('#ridge'), dot = $('#dot'), J = $('#journey');
  var stns = $$('[data-st]', J);
  var L = ridge.getTotalLength();
  var c0 = '#1d1a24', c1 = '#3a0a13', c2 = '#6e1220';
  function setProg(p) {
    ridge.style.strokeDasharray = L; ridge.style.strokeDashoffset = L * (1 - p);
    var pt = ridge.getPointAtLength(L * p); dot.setAttribute('cx', pt.x); dot.setAttribute('cy', pt.y);
    var s = p < 0.34 ? 0 : p < 0.7 ? 1 : 2;
    stns.forEach(function (e) {
      var n = +e.getAttribute('data-st');
      if (e.classList.contains('jstep')) e.classList.toggle('on', n === s);
      else if (e.tagName === 'circle') e.classList.toggle('on', p >= [0.2, 0.52, 0.93][n]);
      else e.classList.toggle('on', n <= s);
    });
    $('#win').classList.toggle('on', p > 0.95);
    var fo = p > 0.2 ? 1 : 0; $('#flags').style.opacity = fo; $('#flagset').style.opacity = fo;
    J.style.backgroundColor = p < 0.5 ? gsap.utils.interpolate(c0, c1, p * 2) : gsap.utils.interpolate(c1, c2, (p - 0.5) * 2);
    var g = $('.glow', J); g.style.transform = 'translateX(' + (p * 78) + 'vw)'; g.style.opacity = 0.55 + p * 0.45;
  }
  if (api.motion) {
    var mm = gsap.matchMedia();
    mm.add('(min-width: 900px)', function () {
      var o = { p: 0 };
      setProg(0);
      gsap.to(o, { p: 1, ease: 'none', onUpdate: function () { setProg(o.p); },
        scrollTrigger: { trigger: J, start: 'top top', end: '+=240%', pin: true, scrub: 0.5, anticipatePin: 1 } });
    });
    mm.add('(max-width: 899px)', function () {
      var o = { p: 0 };
      setProg(0);
      gsap.to(o, { p: 1, ease: 'none', onUpdate: function () { setProg(o.p); },
        scrollTrigger: { trigger: '.j-map', start: 'top 85%', end: 'bottom 30%', scrub: 0.4 } });
      $$('.jstep', J).forEach(function (e) { e.classList.remove('on'); ScrollTrigger.create({ trigger: e, start: 'top 88%', once: true, onEnter: function () { e.classList.add('on'); } }); });
    });
  } else {
    ridge.style.strokeDasharray = 'none'; $$('.jstep', J).forEach(function (e) { e.classList.add('on'); });
    stns.forEach(function (e) { if (!e.classList.contains('jstep')) e.classList.add('on'); }); $('#win').classList.add('on'); $('#flags').style.opacity = 1; $('#flagset').style.opacity = 1;
    J.style.backgroundColor = c1; dot.setAttribute('cx', 1070); dot.setAttribute('cy', 296);
  }

  /* enquiry form: sends nothing */
  api.fakeForm('enq', 'enq-done');
  $$('[data-enq]').forEach(function (a) { a.addEventListener('click', function () { var s = $('#e-topic'); for (var i = 0; i < s.options.length; i++) if (s.options[i].text === a.getAttribute('data-enq')) s.selectedIndex = i; }); });

  /* booking drawer */
  var drawer = $('#drawer'), scrim = $('#scrim'), step = 1, st = { n: 2, day: null, time: null, dayLabel: '' };
  var lastFocus = null, days = $('#days'), slots = $('#slots'), next = $('#dnext'), back = $('#dback');
  var DN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], MN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var TIMES = ['12:00', '12:30', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'];
  function buildDays() {
    var now = new Date(), html = '';
    for (var i = 0; i < 14; i++) {
      var d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
      var lab = DN[d.getDay()] + ' ' + d.getDate() + ' ' + MN[d.getMonth()];
      html += '<button type="button" class="chipb" aria-pressed="false" data-i="' + i + '" data-lab="' + lab + '"><span>' + (i === 0 ? 'Today' : DN[d.getDay()]) + '</span><b>' + d.getDate() + '</b></button>';
    }
    days.innerHTML = html;
  }
  function taken(i, t) { var k = (i * 7 + t * 13 + st.n * 5) % 11; return k < 3; }
  function buildSlots() {
    var i = st.day, html = '';
    TIMES.forEach(function (t, k) {
      var off = i === null || taken(i, k);
      html += '<button type="button" class="chipb" aria-pressed="' + (st.time === t) + '"' + (off ? ' disabled' : '') + ' data-t="' + t + '">' + t + '</button>';
    });
    slots.innerHTML = html;
    if (i === null) slots.insertAdjacentHTML('afterbegin', '<p class="note" style="margin:0 0 6px;width:100%">Choose a day to see times.</p>');
  }
  function validate() {
    next.disabled = step === 1 ? (st.day === null || !st.time) : false;
    next.textContent = step === 2 ? 'Request table' : step === 3 ? 'Done' : 'Next';
    back.hidden = step !== 2;
    $('#dprog').style.width = (step * 33.4) + '%';
  }
  function show(n) {
    step = n; $$('.step', drawer).forEach(function (e) { e.classList.toggle('on', +e.getAttribute('data-step') === n); });
    validate(); var f = $('.step.on h3', drawer); if (f) { f.setAttribute('tabindex', '-1'); f.focus(); }
  }
  function open(e) {
    if (e) e.preventDefault();
    lastFocus = document.activeElement; buildDays(); st.day = null; st.time = null; $('#pn').textContent = st.n; buildSlots();
    drawer.classList.add('open'); scrim.classList.add('open'); drawer.setAttribute('aria-hidden', 'false'); show(1);
    if (api.lenis) api.lenis.stop(); document.body.style.overflow = 'hidden';
    $('#dclose').focus();
  }
  function close() {
    drawer.classList.remove('open'); scrim.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true');
    if (api.lenis) api.lenis.start(); document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }
  $$('[data-open-book]').forEach(function (b) { b.addEventListener('click', open); });
  $('#dclose').addEventListener('click', close); scrim.addEventListener('click', close);
  document.addEventListener('keydown', function (e) {
    if (!drawer.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'Tab') {
      var f = $$('button:not([disabled]):not([hidden]),input,textarea,select,[tabindex="0"]', drawer).filter(function (x) { return x.offsetParent !== null; });
      if (!f.length) return;
      var a = f[0], z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    }
  });
  function setN(v) { st.n = Math.max(1, Math.min(12, v)); $('#pn').textContent = st.n; $('#big').hidden = st.n < 9; st.time = null; buildSlots(); validate(); }
  $('#pm').addEventListener('click', function () { setN(st.n - 1); });
  $('#pp').addEventListener('click', function () { setN(st.n + 1); });
  days.addEventListener('click', function (e) {
    var b = e.target.closest('.chipb'); if (!b) return;
    $$('.chipb', days).forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
    st.day = +b.getAttribute('data-i'); st.dayLabel = b.getAttribute('data-lab'); st.time = null; buildSlots(); validate();
  });
  slots.addEventListener('click', function (e) {
    var b = e.target.closest('.chipb'); if (!b || b.disabled) return;
    st.time = b.getAttribute('data-t'); $$('.chipb', slots).forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); validate();
  });
  back.addEventListener('click', function () { show(1); });
  next.addEventListener('click', function () {
    if (step === 1) return show(2);
    if (step === 2) {
      var bad = null;
      $$('#bf [required]').forEach(function (el) { var ok = el.value.trim() !== ''; el.style.borderColor = ok ? '' : '#b3261e'; el.setAttribute('aria-invalid', ok ? 'false' : 'true'); if (!ok && !bad) bad = el; });
      if (bad) { bad.focus(); return; }
      $('#ref').textContent = 'GI-' + (4000 + Math.floor(Math.random() * 5000));
      $('#sumtxt').textContent = st.n + (st.n === 1 ? ' guest' : ' guests') + ', ' + st.dayLabel + ' at ' + st.time + '. We would confirm by phone.';
      return show(3);
    }
    close();
  });
})();
