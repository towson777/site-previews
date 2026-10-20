/* How Jobbi works: two phones, one job.
   A pinned, scroll-scrubbed timeline. The customer (left) posts a leaking overflow pipe,
   gets a guide price, compares quotes, books Dan, approves his revised quote after the visit
   and pays. The tradesperson (right) gets the job, quotes, turns up, adjusts and gets paid.
   Every hand-off flies across the arc between the phones. On phone-width screens it's one
   handset that turns round whenever the story changes side. With reduced motion the caption
   list becomes a stepper that jumps the phones to the end of each step. */
(function () {
  'use strict';
  var J = document.getElementById('journey');
  if (!J) return;
  var api = window.ConceptSite ? window.ConceptSite.init() : { motion: false };
  var gsap = window.gsap;
  if (!gsap) return;
  var ST = window.ScrollTrigger;
  J.classList.add('j-js');

  var $ = function (s, r) { return (r || J).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || J).querySelectorAll(s)); };
  var wrap = $('.j-stage-wrap'), stage = $('.j-stage'), view = $('.j-view'), pin = $('.j-pin');
  var flip = $('.flip'), whoC = $('.who-c'), whoT = $('.who-t');
  var C = $('.ph-c .scr'), T = $('.ph-t .scr');
  var caps = $$('.cap'), bar = $('.j-bar i'), capM = $('.j-cap-m');
  var capData = caps.map(function (c) { return { n: c.querySelector('.n').textContent, h: c.querySelector('.tx b').textContent, p: c.querySelector('.tx>span').innerHTML }; });

  // when each caption starts, in timeline seconds
  var BOUNDS = [0, 4.3, 7.4, 13.8, 18.85, 26.2];
  var END = 34.4;

  /* ---------- fit the stage to the space ---------- */
  var mqMob = window.matchMedia('(max-width: 980px)');
  function fit() {
    var mob = mqMob.matches, W = mob ? 340 : 1000, H = 760;
    var availW = view.clientWidth || W;
    var capH = mob ? capM.offsetHeight + 10 : 0;
    var noteH = $('.j-note').offsetHeight + 10;
    var availH = window.innerHeight - (mob ? 82 : 128) - capH - noteH;
    var s = Math.max(0.4, Math.min(availW / W, availH / H, mob ? 1 : 0.94));
    wrap.style.setProperty('--s', s.toFixed(4));
  }
  fit();
  window.addEventListener('resize', fit);

  /* ---------- captions ---------- */
  var current = -1;
  function capAt(t) { var i = 0; for (var k = 0; k < BOUNDS.length; k++) if (t >= BOUNDS[k] - 0.001) i = k; return i; }
  function setCap(i) {
    if (i === current) return;
    current = i;
    caps.forEach(function (c, k) { c.classList.toggle('on', k === i); c.classList.toggle('done', k < i); });
    var d = capData[i];
    if (capM && mqMob.matches && api.motion) {
      gsap.to(capM, { autoAlpha: 0, y: -6, duration: 0.15, overwrite: true, onComplete: function () {
        capM.querySelector('.n').textContent = d.n; capM.querySelector('.mh').textContent = d.h; capM.querySelector('.mp').innerHTML = d.p;
        gsap.fromTo(capM, { y: 6 }, { autoAlpha: 1, y: 0, duration: 0.25 });
      } });
    } else if (capM) {
      capM.querySelector('.n').textContent = d.n; capM.querySelector('.mh').textContent = d.h; capM.querySelector('.mp').innerHTML = d.p;
    }
  }

  var live = null; // { tl, st }

  /* ---------- build the timeline for one layout ---------- */
  function build(desk) {
    var tl = gsap.timeline({ paused: true, defaults: { ease: 'none' } });
    var inits = [], restores = [], made = [];

    function P(root, id) { return $('[data-pn="' + id + '"]', root); }
    function Bt(root, k) { return $('[data-b="' + k + '"]', root); }
    function offsetIn(el, anc) { var x = 0, y = 0; while (el && el !== anc) { x += el.offsetLeft; y += el.offsetTop; el = el.offsetParent; } return { x: x, y: y }; }

    // class switches are worked out from the playhead, so scrubbing either way is exact
    var events = [];
    function cls(el, name, on, t) { events.push({ el: el, name: name, on: on, t: t }); restores.push(function () { el.classList.remove(name); }); }
    function applyClasses(time) {
      var state = new Map();
      events.forEach(function (e) {
        var key = e.el; if (!state.has(key)) state.set(key, {});
        var st = state.get(key);
        if (!(e.name in st)) st[e.name] = false;
        if (time >= e.t) st[e.name] = e.on;
      });
      state.forEach(function (st, el) { Object.keys(st).forEach(function (n) { el.classList.toggle(n, st[n]); }); });
    }
    // swap one visible element for another
    function swap(a, b, t) { tl.to(a, { autoAlpha: 0, duration: 0.15 }, t).to(b, { autoAlpha: 1, duration: 0.15 }, t + 0.05); }
    function show(el, t, d, from) {
      from = from || { y: 10 };
      var to = { autoAlpha: 1, duration: d || 0.3, ease: 'power2.out', immediateRender: false };
      Object.keys(from).forEach(function (k) { to[k] = k === 'scale' ? 1 : 0; });
      from.autoAlpha = 0;
      tl.fromTo(el, from, to, t);
    }
    function hide(el, t, d) { tl.to(el, { autoAlpha: 0, duration: d || 0.2 }, t); }
    function grow(el, t, d) { tl.to(el, { height: function () { return el.scrollHeight; }, autoAlpha: 1, duration: d || 0.35, ease: 'power2.inOut' }, t); }
    function shrink(el, t, d) { tl.to(el, { height: 0, autoAlpha: 0, duration: d || 0.3, ease: 'power2.inOut' }, t); }

    // screens slide like iOS navigation
    function go(root, from, to, t) {
      var a = P(root, from), b = P(root, to);
      tl.set(b, { autoAlpha: 1 }, t)
        .fromTo(b, { xPercent: 100 }, { xPercent: 0, duration: 0.42, ease: 'power3.inOut', immediateRender: false }, t)
        .to(a, { xPercent: -30, duration: 0.42, ease: 'power3.inOut' }, t)
        .set(a, { autoAlpha: 0 }, t + 0.42);
    }
    function back(root, from, to, t) {
      var a = P(root, from), b = P(root, to);
      tl.set(b, { autoAlpha: 1 }, t)
        .to(b, { xPercent: 0, duration: 0.42, ease: 'power3.inOut' }, t)
        .to(a, { xPercent: 100, duration: 0.42, ease: 'power3.inOut' }, t)
        .set(a, { autoAlpha: 0 }, t + 0.42);
    }

    // a finger tap
    function tap(root, el, t) {
      var dot = $('.tapdot', root);
      tl.set(dot, { x: function () { var o = offsetIn(el, root); return o.x + el.offsetWidth / 2; },
                    y: function () { var o = offsetIn(el, root); return o.y + el.offsetHeight / 2; }, scale: 1.6, autoAlpha: 0 }, t)
        .to(dot, { autoAlpha: 1, scale: 1, duration: 0.12, ease: 'power2.out' }, t)
        .to(dot, { scale: 0.78, duration: 0.07, ease: 'power1.inOut' }, t + 0.14)
        .to(el, { scale: 0.96, duration: 0.07, ease: 'power1.inOut' }, t + 0.14)
        .to(dot, { scale: 1.1, autoAlpha: 0, duration: 0.16 }, t + 0.22)
        .to(el, { scale: 1, duration: 0.1 }, t + 0.22);
    }

    // typing into a field
    function type(el, t, d, onStep) {
      var full = el.getAttribute('data-full') || el.textContent;
      el.setAttribute('data-full', full);
      var o = { p: 0 };
      inits.push(function () { el.textContent = ''; });
      restores.push(function () { el.textContent = full; el.classList.remove('cr'); });
      tl.fromTo(o, { p: 0 }, { p: 1, duration: d, immediateRender: false, onUpdate: function () {
        var n = Math.round(o.p * full.length), txt = full.slice(0, n);
        if (el.textContent !== txt) el.textContent = txt;
        el.classList.toggle('cr', o.p > 0 && o.p < 1);
        if (onStep) onStep(txt);
      } }, t);
    }
    function money(v) { return '£' + v.toFixed(2); }
    function count(el, from, to, t, d, fmt) {
      var orig = el.textContent, o = { v: from };
      fmt = fmt || money;
      inits.push(function () { el.textContent = fmt(from); });
      restores.push(function () { el.textContent = orig; });
      tl.fromTo(o, { v: from }, { v: to, duration: d, ease: 'power1.out', immediateRender: false, onUpdate: function () { el.textContent = fmt(o.v); } }, t);
    }

    // sheets and banners
    function sheetUp(root, sheet, t) { var dim = $('.dim', root); tl.to(dim, { autoAlpha: 1, duration: 0.25 }, t).to(sheet, { yPercent: 0, duration: 0.42, ease: 'power3.out' }, t); }
    function sheetDown(root, sheet, t) { var dim = $('.dim', root); tl.to(sheet, { yPercent: 106, duration: 0.35, ease: 'power3.in' }, t).to(dim, { autoAlpha: 0, duration: 0.25 }, t + 0.12); }

    // hand-offs between the phones (wide screens)
    var lit = $('.arc-lit'), L = 420, SEG = 110;
    try { L = lit.getTotalLength() || 420; } catch (e) {}
    gsap.set(lit, { strokeDasharray: SEG + ' ' + (L + SEG + 4), strokeDashoffset: SEG });
    function bez(p) { var a = 1 - p; return { x: a * a * 352 + 2 * a * p * 500 + p * p * 648, y: a * a * 300 + 2 * a * p * 110 + p * p * 300 }; }
    var ICON = {
      job: '<svg viewBox="0 0 24 24"><path d="M12 3c3.3 4 6 7.2 6 10.4a6 6 0 0 1-12 0C6 10.2 8.7 7 12 3Z"/></svg>',
      gbp: '<svg viewBox="0 0 24 24"><path d="M16 7.5A4 4 0 0 0 9 10v8M7 13h7M7 18h10"/></svg>',
      cal: '<svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/></svg>',
      van: '<svg viewBox="0 0 24 24"><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="17.5" r="1.6"/><circle cx="17" cy="17.5" r="1.6"/></svg>',
      ok: '<svg viewBox="0 0 24 24"><path d="m6 12.5 4 4 8-9"/></svg>',
      doc: '<svg viewBox="0 0 24 24"><path d="M7 3h7l4 4v14H7z"/><path d="M10 12h5M10 16h5"/></svg>'
    };
    function hand(fromC, icon, label, t, green) {
      if (!desk) return;
      var el = document.createElement('div');
      el.className = 'pk' + (green ? ' g' : '');
      el.innerHTML = '<i>' + ICON[icon] + '</i>' + label;
      stage.appendChild(el); made.push(el);
      gsap.set(el, { xPercent: -50, yPercent: -50, x: 352, y: 300, autoAlpha: 0 });
      var o = { p: 0 }, D = 0.75;
      tl.fromTo(o, { p: 0 }, { p: 1, duration: D, ease: 'power1.inOut', immediateRender: false, onUpdate: function () {
          var q = bez(fromC ? o.p : 1 - o.p); gsap.set(el, { x: q.x, y: q.y });
        } }, t)
        .fromTo(el, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.14, ease: 'back.out(2)', immediateRender: false }, t)
        .to(el, { autoAlpha: 0, scale: 0.85, duration: 0.14 }, t + D - 0.12)
        .fromTo(lit, { strokeDashoffset: fromC ? SEG : -L }, { strokeDashoffset: fromC ? -L : SEG, duration: D, ease: 'power1.inOut', immediateRender: false }, t);
      // the receiving phone answers with a small nudge
      var ph = fromC ? T.parentNode : C.parentNode;
      tl.to(ph, { y: -6, duration: 0.12, ease: 'power2.out' }, t + D - 0.08).to(ph, { y: 0, duration: 0.25, ease: 'power2.inOut' }, t + D + 0.04);
    }
    // the handset turns round (phone-width screens)
    function turn(toT, t) {
      if (desk) return;
      tl.to(flip, { rotateY: toT ? 180 : 0, duration: 0.5, ease: 'power2.inOut' }, t)
        .to(flip, { scale: 0.9, duration: 0.25, ease: 'power1.in' }, t)
        .to(flip, { scale: 1, duration: 0.25, ease: 'power1.out' }, t + 0.25)
        .to(toT ? whoC : whoT, { autoAlpha: 0, duration: 0.15 }, t + 0.1)
        .to(toT ? whoT : whoC, { autoAlpha: 1, duration: 0.2 }, t + 0.3);
    }

    /* ---------- starting state ---------- */
    $$('.pn', C).concat($$('.pn', T)).forEach(function (p) { gsap.set(p, { xPercent: 0, autoAlpha: 0 }); });
    gsap.set([P(C, 'new'), P(T, 'home')], { autoAlpha: 1 });
    gsap.set($$('.tapdot'), { autoAlpha: 0 });
    gsap.set([$('.pthumb', P(C, 'new'))], { autoAlpha: 0, scale: 0.6 });
    var skel = $('.skel', C), aisum = $('.aisum', C);
    gsap.set(skel, { autoAlpha: 0, height: 0 });
    gsap.set(aisum, { autoAlpha: 0 });
    gsap.set($$('[data-pn="ai"] .tag, [data-pn="ai"] .tile, [data-pn="ai"] .tips', C), { autoAlpha: 0, y: 10 });
    gsap.set($$('.qwrap', C), { height: 0, autoAlpha: 0 });
    gsap.set($('.booked', C), { autoAlpha: 0 });
    gsap.set($('.booked .bigtick', C), { scale: 0.4 });
    var eta = $('.eta', C);
    gsap.set(eta, { height: 0, autoAlpha: 0, marginBottom: -10 });
    gsap.set($('.trk i', C), { scaleX: 0.12 });
    gsap.set([$('.chg', C), $('[data-pn="job"] .ft', C)], { autoAlpha: 0 });
    gsap.set($$('.sheet', C), { autoAlpha: 1, yPercent: 106 });
    gsap.set($('.dim', C), { autoAlpha: 0 });
    gsap.set($$('.b-dark .spin, .b-dark .okk', C), { autoAlpha: 0 });
    gsap.set($$('.st b', C), { width: '0%' });
    var push = $('.push', T);
    gsap.set(push, { autoAlpha: 1, yPercent: -150 });
    gsap.set($$('.toast', T), { autoAlpha: 0, y: -10 });
    gsap.set($$('.sp', T), { autoAlpha: 0 });
    gsap.set($('.sp-q', T), { autoAlpha: 1 });
    gsap.set($('.w1', T), { autoAlpha: 0 });
    gsap.set($$('.acts', T), { autoAlpha: 0 });
    gsap.set($('.li-add', T), { height: 0, autoAlpha: 0, paddingTop: 0, paddingBottom: 0, borderBottomWidth: 0 });
    gsap.set($('.review', T), { autoAlpha: 0, y: 10 });
    if (desk) {
      gsap.set(flip, { clearProps: 'transform' });
      gsap.set([whoC, whoT], { autoAlpha: 1 });
    } else {
      gsap.set(flip, { rotateY: 0, scale: 1 });
      gsap.set(whoC, { autoAlpha: 1 }); gsap.set(whoT, { autoAlpha: 0 });
    }

    var c = function (k) { return Bt(C, k); }, tp = function (k) { return Bt(T, k); };
    var chipPlumb = $('.chip[data-k="plumb"]', C), fldDesc = $('.fld-big', C);
    var qDan = $('[data-q="dan"]', C), qMark = $('[data-q="mark"]', C), qTom = $('[data-q="tom"]', C), qn = $('.qn', C);
    var revSheet = $('.sh-rev', C), paySheet = $('.sh-pay', C);
    var prog = function (s) { return $('.prog li[data-s="' + s + '"]', C); };
    var sp = function (k) { return $('.sp-' + k, T); };
    var aWay = $('.a-way', T), aSite = $('.a-site', T);

    /* ===== 1 · Describe your job ===== */
    tap(C, chipPlumb, 0.15); cls(chipPlumb, 'on', true, 0.32);
    tap(C, fldDesc, 0.5); cls(fldDesc, 'focus', true, 0.62);
    type($('[data-ty="desc"]', C), 0.7, 2.5);
    cls(fldDesc, 'focus', false, 3.25);
    tap(C, $('.addp', C), 3.3);
    show($('.pthumb', P(C, 'new')), 3.5, 0.3, { scale: 0.6 });
    tap(C, c('estimate'), 3.95);
    go(C, 'new', 'ai', 4.3);

    /* ===== 2 · Get a guide price ===== */
    tl.to(skel, { height: 46, autoAlpha: 1, duration: 0.2 }, 4.6)
      .to(skel, { height: 0, autoAlpha: 0, duration: 0.2 }, 5.05)
      .to(aisum, { autoAlpha: 1, duration: 0.01 }, 5.1);
    type(aisum, 5.1, 0.85);
    tl.to($$('[data-pn="ai"] .tag, [data-pn="ai"] .tile', C), { autoAlpha: 1, y: 0, duration: 0.3, stagger: 0.12, ease: 'power2.out' }, 6.0)
      .to($('[data-pn="ai"] .tips', C), { autoAlpha: 1, y: 0, duration: 0.3, ease: 'power2.out' }, 6.65);
    tap(C, c('post'), 7.05);
    go(C, 'ai', 'live', 7.4);
    hand(true, 'job', 'New job', 7.5);
    turn(true, 7.75);

    /* ===== 3 · Compare estimates ===== */
    // tradesperson: the job arrives, Dan quotes
    tl.to(push, { yPercent: 0, duration: 0.35, ease: 'back.out(1.3)' }, 8.25);
    tap(T, push, 8.85);
    tl.to(push, { yPercent: -150, duration: 0.3, ease: 'power2.in' }, 9.05);
    go(T, 'home', 'tjob', 9.05);
    tap(T, tp('toquote'), 9.75);
    go(T, 'tjob', 'tquote', 9.95);
    var fPrice = $('.fld-price', T), fNote = $('[data-pn="tquote"] .fld-mid', T), recv = $('.recv', T);
    inits.push(function () { recv.textContent = '£0.00'; });
    restores.push(function () { recv.textContent = '£90.25'; });
    cls(fPrice, 'focus', true, 10.3);
    type($('[data-ty="price"]', T), 10.35, 0.4, function (txt) { var v = parseFloat(txt) || 0; recv.textContent = money(v * 0.95); });
    cls(fPrice, 'focus', false, 10.8);
    cls(fNote, 'focus', true, 10.85);
    type($('[data-ty="note"]', T), 10.9, 0.9);
    cls(fNote, 'focus', false, 11.85);
    tap(T, tp('sendq'), 11.9);
    show($('.t-sent', T), 12.05, 0.25, { y: -10 });
    go(T, 'tquote', 'tact', 12.5);
    hand(false, 'gbp', 'Quote · £95', 12.1);
    // customer: quotes come in
    grow(qMark, 9.4); grow(qTom, 10.6);
    turn(false, 12.4);
    grow(qDan, 12.95, 0.45);
    var qSteps = [[9.4, '1'], [10.6, '2'], [12.95, '3']];
    restores.push(function () { qn.textContent = '0'; });
    tap(C, c('accept'), 13.55);
    go(C, 'live', 'book', 13.8);

    /* ===== 4 · Book a time ===== */
    var dThu = $('.day[data-k="thu"]', C), sAm = $('.slot[data-k="am"]', C);
    tap(C, dThu, 14.25); cls(dThu, 'on', true, 14.4);
    tap(C, sAm, 14.7); cls(sAm, 'on', true, 14.85);
    tap(C, c('confirm'), 15.15);
    tl.to($('.booked', C), { autoAlpha: 1, duration: 0.25 }, 15.35)
      .to($('.booked .bigtick', C), { scale: 1, duration: 0.4, ease: 'back.out(2)' }, 15.4);
    hand(true, 'cal', 'Booked · Thu 22 Oct', 15.5, true);
    turn(true, 15.75);
    go(C, 'book', 'job', 16.1);
    // tradesperson: booked, on the way
    swap(sp('q'), sp('b'), 16.3);
    swap($('.w0', T), $('.w1', T), 16.3);
    show(aWay, 16.4, 0.3, { y: 8 });
    tap(T, tp('onway'), 16.85);
    swap(sp('b'), sp('w'), 17.05);
    hide(aWay, 17.05);
    hand(false, 'van', 'On my way', 17.05);
    turn(false, 17.3);
    cls(prog('way'), 'on', true, 17.85);
    grow(eta, 17.85, 0.3);
    tl.to(eta, { marginBottom: 0, duration: 0.3 }, 17.85)
      .to($('.trk i', C), { scaleX: 1, duration: 0.75, ease: 'power1.inOut' }, 18.1);

    /* ===== 5 · Agree any changes ===== */
    cls(prog('site'), 'on', true, 18.9);
    shrink(eta, 18.9, 0.3);
    tl.to(eta, { marginBottom: -10, duration: 0.3 }, 18.9);
    swap(sp('w'), sp('s'), 18.9);
    show(aSite, 19.0, 0.3, { y: 8 });
    turn(true, 19.15);
    tap(T, tp('adjust'), 19.75);
    go(T, 'tact', 'tadj', 19.95);
    var liAdd = $('.li-add', T);
    tap(T, tp('additem'), 20.4);
    tl.to(liAdd, { height: function () { return liAdd.scrollHeight + 18; }, paddingTop: 9, paddingBottom: 9, borderBottomWidth: 1, autoAlpha: 1, duration: 0.3, ease: 'power2.inOut' }, 20.55);
    type($('[data-ty="item"]', T), 20.65, 0.5);
    type($('[data-ty="amt"]', T), 21.2, 0.3);
    count($('.ntot', T), 95, 120, 21.5, 0.35);
    var fWhy = $('[data-pn="tadj"] .fld-mid', T);
    cls(fWhy, 'focus', true, 21.9);
    type($('[data-ty="why"]', T), 21.95, 1.0);
    cls(fWhy, 'focus', false, 23.0);
    tap(T, tp('sendrev'), 23.05);
    back(T, 'tadj', 'tact', 23.25);
    swap(sp('s'), sp('r'), 23.3);
    hide(aSite, 23.3);
    hand(false, 'doc', 'Revised quote · £120', 23.3);
    turn(false, 23.5);
    sheetUp(C, revSheet, 24.05);
    tap(C, c('approve'), 24.65);
    sheetDown(C, revSheet, 24.85);
    count($('.agreed', C), 95, 120, 24.95, 0.4);
    show($('.chg', C), 25.25, 0.3, { y: 6 });
    hand(true, 'ok', 'Approved', 25.0, true);
    turn(true, 25.25);
    show($('.t-appr', T), 25.8, 0.25, { y: -10 });
    swap(sp('r'), sp('a'), 25.8);
    count($('.tprice', T), 95, 120, 25.8, 0.3);
    show(aSite, 25.9, 0.3, { y: 8 });

    /* ===== 6 · Pay securely ===== */
    hide($('.t-appr', T), 26.4);
    tap(T, tp('complete'), 26.45);
    swap(sp('a'), sp('i'), 26.65);
    hide(aSite, 26.65);
    hand(false, 'doc', 'Invoice · £120', 26.7);
    turn(false, 26.95);
    cls(prog('done'), 'on', true, 27.5);
    show($('[data-pn="job"] .ft', C), 27.55, 0.3, { y: 16 });
    tap(C, c('pay'), 28.0);
    sheetUp(C, paySheet, 28.2);
    var pay = c('paynow');
    tap(C, pay, 28.85);
    tl.to($('.pl', pay), { autoAlpha: 0, duration: 0.1 }, 29.0)
      .to($('.spin', pay), { autoAlpha: 1, duration: 0.1 }, 29.0)
      .to($('.spin', pay), { autoAlpha: 0, duration: 0.1 }, 29.5)
      .fromTo($('.okk', pay), { autoAlpha: 0, scale: 0.9 }, { autoAlpha: 1, scale: 1, duration: 0.25, ease: 'back.out(2)', immediateRender: false }, 29.5);
    hand(true, 'gbp', '£114.00 paid', 29.7, true);
    turn(true, 29.95);
    go(C, 'job', 'paid', 30.2);
    go(T, 'tact', 'tearn', 30.45);
    count($('.earnv', T), 0, 114, 30.9, 0.6, function (v) { return '+£' + v.toFixed(2); });
    turn(false, 31.7);
    $$('.st b', C).forEach(function (b, i) { tl.to(b, { width: '100%', duration: 0.25, ease: 'power1.out' }, 32.25 + i * 0.16); });
    tap(C, c('submit'), 33.4);
    show($('.review', T), 33.65, 0.35, { y: 10 });
    tl.to({}, { duration: 0.01 }, END);

    inits.slice().reverse().forEach(function (f) { f(); });
    applyClasses(0); qn.textContent = '0';
    function sync() {
      var now = tl.time();
      applyClasses(now);
      var q = '0'; qSteps.forEach(function (x) { if (now >= x[0]) q = x[1]; }); if (qn.textContent !== q) qn.textContent = q;
      setCap(capAt(now));
      if (bar) bar.parentNode.style.setProperty('--bp', tl.progress().toFixed(3));
    }
    tl.eventCallback('onUpdate', sync);

    return {
      tl: tl,
      sync: sync,
      cleanup: function () {
        restores.forEach(function (f) { f(); });
        made.forEach(function (el) { el.remove(); });
        $$('[data-full]').forEach(function (el) { el.removeAttribute('data-full'); });
      }
    };
  }

  /* ---------- run it ---------- */
  var mm = gsap.matchMedia();
  mm.add({ desk: '(min-width: 981px)', mob: '(max-width: 980px)' }, function (ctx) {
    var desk = ctx.conditions.desk;
    fit();
    current = -1;
    var b = build(desk), tl = b.tl, st = null;

    if (api.motion && ST) {
      var perUnit = desk ? 270 : 220;
      st = ST.create({
        trigger: pin, start: 'top top', end: function () { return '+=' + Math.round(END * perUnit); },
        pin: true, scrub: 0.6, animation: tl, anticipatePin: 1, invalidateOnRefresh: true
      });
      // the phones settle in as the section arrives
      if (desk) {
        gsap.fromTo(C.parentNode, { x: -40, rotation: -5, y: 40 }, { x: 0, rotation: 0, y: 0, ease: 'none',
          scrollTrigger: { trigger: J, start: 'top bottom', end: 'top top', scrub: true } });
        gsap.fromTo(T.parentNode, { x: 40, rotation: 5, y: 60 }, { x: 0, rotation: 0, y: 0, ease: 'none',
          scrollTrigger: { trigger: J, start: 'top bottom', end: 'top top', scrub: true } });
      } else {
        gsap.fromTo(flip, { rotateX: 14, y: 40 }, { rotateX: 0, y: 0, ease: 'none',
          scrollTrigger: { trigger: J, start: 'top bottom', end: 'top top', scrub: true } });
      }
      tl.progress(1).progress(0);
      setCap(0);
    } else {
      // reduced motion: a stepper that jumps to the end of each step
      tl.progress(1).progress(0);
      tl.seek(BOUNDS[1] - 0.02, false); b.sync();
    }

    J.__tl = tl; J.__st = st;
    function jump(i) {
      if (st) {
        var p = (BOUNDS[i] + 0.02) / END;
        var y = st.start + p * (st.end - st.start);
        if (api.lenis) api.lenis.scrollTo(y, { duration: 1.2 }); else window.scrollTo({ top: y, behavior: 'smooth' });
      } else {
        var e = i + 1 < BOUNDS.length ? BOUNDS[i + 1] - 0.02 : END;
        tl.seek(e, false); b.sync(); setCap(i);
      }
    }
    var handlers = caps.map(function (cap, i) {
      var btn = cap.querySelector('button'), h = function () { jump(i); };
      btn.addEventListener('click', h);
      return function () { btn.removeEventListener('click', h); };
    });

    return function () {
      handlers.forEach(function (f) { f(); });
      if (st) st.kill();
      tl.kill();
      b.cleanup();
    };
  });
})();
