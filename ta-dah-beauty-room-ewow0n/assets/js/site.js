(function () {
  'use strict';
  var TREAT = [
    { id: 'brows', n: 'Brows', d: 'Shaping and tidying, with attention to each hair.', m: '' },
    { id: 'electrolysis', n: 'Electrolysis', d: 'Treatment for individual hairs.', m: '' },
    { id: 'ipl', n: 'IPL hair reduction', d: 'Light-based treatment for larger areas.', m: '' },
    { id: 'facials', n: 'Facials & facial massage', d: 'Including acupuncture facials.', m: '' },
    { id: 'waxing', n: 'Waxing', d: 'Hair removal by wax.', m: '' },
    { id: 'nails', n: 'Nails & foot care', d: 'For hands and feet.', m: '' },
    { id: 'body', n: 'Body treatments', d: 'Care for skin beyond the face.', m: '' },
    { id: 'ears', n: 'Ear piercing', d: 'Booked like any other treatment.', m: '' }
  ];
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  /* treatments list + contact select */
  var tl = document.getElementById('tlist'), sel = document.getElementById('cfsel');
  TREAT.forEach(function (t, i) {
    var li = document.createElement('li');
    li.innerHTML = '<button type="button" data-book="' + t.id + '"><span class="n">' + String(i + 1).padStart(2, '0') + '</span><span class="t">' + esc(t.n) + '</span><span class="d">' + esc(t.d) + '</span><span class="go" aria-hidden="true">→</span><span class="sr">Book ' + esc(t.n) + '</span></button>';
    tl.appendChild(li);
    sel.insertAdjacentHTML('beforeend', '<option>' + esc(t.n) + '</option>');
  });
  sel.insertAdjacentHTML('afterbegin', '<option>Not sure yet</option>'); sel.selectedIndex = 0;

  /* logos: play the draw-on */
  document.querySelectorAll('.logo').forEach(function (l) {
    if (l.id === 'footlogo' && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (e) { if (e[0].isIntersecting) { l.classList.add('in'); io.disconnect(); } }, { threshold: .4 });
      io.observe(l);
    } else l.classList.add('in');
  });

  var api = window.ConceptSite.init();
  api.fakeForm('cf', 'cfdone');

  /* ---------- signature scene ---------- */
  if (api.motion) {
    var mm = gsap.matchMedia();
    mm.add('(min-width: 761px)', function () {
      var sc = document.querySelector('.scene'), wrap = sc.querySelector('.zoomwrap'), sharp = sc.querySelector('.sharp'),
        ring = sc.querySelector('.ringpos'), caps = gsap.utils.toArray('.scene .cap'), bar = document.getElementById('bar'), cn = document.getElementById('cn');
      sc.classList.add('is-pinned');
      var vmin = function (n) { return Math.min(innerWidth, innerHeight) * n / 100; };
      var R = { r: 10, z: 1 };
      var apply = function () {
        sharp.style.clipPath = 'circle(' + R.r + 'vmin at 33% 60%)';
        ring.style.width = (R.r * 2) + 'vmin';
        wrap.style.transform = 'scale(' + R.z + ')';
      };
      apply();
      gsap.set(caps.slice(1), { autoAlpha: 0, y: 24 });
      var tlm = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: '.stage', start: 'top top', end: '+=' + Math.round(innerHeight * 3.2), pin: true, scrub: 0.6, anticipatePin: 1, invalidateOnRefresh: true } });
      tlm.to(R, { r: 19, z: 1.25, duration: 1, onUpdate: apply }, 0)
        .to(R, { r: 27, z: 1.7, duration: 1, onUpdate: apply }, 1)
        .to(R, { r: 120, z: 1.7, duration: 1, onUpdate: apply }, 2)
        .to(ring, { autoAlpha: 0, duration: .4 }, 2.3)
        .to(bar, { scaleX: 1, duration: 3 }, 0);
      [0, 1, 2].forEach(function (i) {
        if (i > 0) tlm.to(caps[i - 1], { autoAlpha: 0, y: -18, duration: .25 }, i - .1).to(caps[i], { autoAlpha: 1, y: 0, duration: .3 }, i + .08);
        tlm.call(function () { cn.textContent = '0' + (i + 1); }, null, i + .1);
      });
      tlm.call(function () { cn.textContent = '03'; }, null, 2.1);
      return function () { sc.classList.remove('is-pinned'); sharp.style.clipPath = ''; wrap.style.transform = ''; ring.style.width = ''; };
    });
    mm.add('(max-width: 760px)', function () {
      var sharp = document.querySelector('.scene .sharp');
      gsap.fromTo(sharp, { clipPath: 'circle(18% at 35% 62%)' }, { clipPath: 'circle(95% at 35% 62%)', ease: 'none', scrollTrigger: { trigger: '.scene .stage', start: 'top 80%', end: 'center 40%', scrub: true } });
      gsap.fromTo('.scene .zoomwrap', { opacity: 1 }, { opacity: 1 });
    });
  }

  /* ---------- booking drawer ---------- */
  var DN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], MN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var drawer = document.getElementById('drawer'), scrim = document.getElementById('scrim'), body = document.getElementById('dr-body'), foot = document.getElementById('dr-foot');
  var B = { step: 0, svc: null, day: null, time: null, name: '', email: '', note: '', ref: '' }, lastFocus = null;
  var today = new Date(); today.setHours(0, 0, 0, 0);
  var days = []; for (var i = 1; i <= 14; i++) days.push(new Date(today.getFullYear(), today.getMonth(), today.getDate() + i));
  function seeded(n) { var x = Math.sin(n) * 10000; return x - Math.floor(x); }
  function lab(t) { return String(Math.floor(t)).padStart(2, '0') + ':' + (t % 1 ? '30' : '00'); }
  function slots(d) { var out = []; for (var t = 9; t <= 16.5; t += .5) out.push({ t: t, off: seeded(d.getDate() * 13 + t * 5 + 2) < .42 }); return out; }
  function svc() { return TREAT.filter(function (x) { return x.id === B.svc; })[0]; }
  function when() { var d = days[B.day]; return DN[d.getDay()] + ' ' + d.getDate() + ' ' + MN[d.getMonth()] + ' at ' + lab(B.time); }
  function render() {
    document.querySelectorAll('.prog i').forEach(function (p, k) { p.classList.toggle('on', k <= Math.min(B.step, 2)); });
    document.getElementById('dr-step').textContent = B.step < 3 ? 'Step ' + (B.step + 1) + ' of 3' : 'Booked';
    var h = '', f = '';
    if (B.step === 0) {
      h = '<h3 id="dr-title">Which treatment?</h3>';
      TREAT.forEach(function (x) { h += '<button type="button" class="opt" data-svc="' + x.id + '" aria-pressed="' + (B.svc === x.id) + '"><b>' + esc(x.n) + '</b><span>' + esc(x.d) + '</span></button>'; });
      f = '<span></span><button class="btn" type="button" data-next ' + (B.svc ? '' : 'disabled') + '>Choose a day</button>';
    } else if (B.step === 1) {
      h = '<h3 id="dr-title">Pick a day and time</h3><span class="ex">Example availability</span><div class="cal" role="group" aria-label="Day">';
      days.forEach(function (d, k) { h += '<button type="button" data-day="' + k + '" aria-pressed="' + (B.day === k) + '" aria-label="' + DN[d.getDay()] + ' ' + d.getDate() + ' ' + MN[d.getMonth()] + '"><small>' + DN[d.getDay()] + '</small><b>' + d.getDate() + '</b></button>'; });
      h += '</div><div class="slots" role="group" aria-label="Time">';
      if (B.day !== null) slots(days[B.day]).forEach(function (x) { h += '<button type="button" data-time="' + x.t + '" aria-pressed="' + (B.time === x.t) + '" ' + (x.off ? 'disabled aria-label="' + lab(x.t) + ', taken"' : '') + '>' + lab(x.t) + '</button>'; });
      else h += '<p class="note" style="grid-column:1/-1">Choose a day to see times.</p>';
      h += '</div>';
      f = '<button class="back" type="button" data-back>Back</button><button class="btn" type="button" data-next ' + (B.time !== null ? '' : 'disabled') + '>Your details</button>';
    } else if (B.step === 2) {
      h = '<h3 id="dr-title">Your details</h3><dl class="sum"><dt>Treatment</dt><dd>' + esc(svc().n) + '</dd><dt>When</dt><dd>' + when() + '</dd></dl><form id="df" novalidate><label>Your name<input id="dn" autocomplete="name" value="' + esc(B.name) + '" required></label><label>Email<input id="de" type="email" autocomplete="email" value="' + esc(B.email) + '" required></label><label>Anything Julia should know? (optional)<textarea id="dt">' + esc(B.note) + '</textarea></label></form>';
      f = '<button class="back" type="button" data-back>Back</button><button class="btn" type="button" data-confirm>Request booking</button>';
    } else {
      h = '<h3 id="dr-title">Thank you, ' + esc(B.name.split(' ')[0] || 'there') + '.</h3><p>Your example booking request:</p><dl class="sum"><dt>Treatment</dt><dd>' + esc(svc().n) + '</dd><dt>When</dt><dd>' + when() + '</dd></dl><p class="note">Reference</p><div class="ref">' + B.ref + '</div><p class="note">This is a preview — the form will go live with your new site. Nothing has been sent.</p>';
      f = '<span></span><button class="btn" type="button" data-close>Close</button>';
    }
    body.innerHTML = h; foot.innerHTML = f; body.scrollTop = 0;
    var t = document.getElementById('dr-title'); if (t) { t.setAttribute('tabindex', '-1'); }
  }
  function open(id) {
    lastFocus = document.activeElement;
    B = { step: 0, svc: id || null, day: null, time: null, name: '', email: '', note: '', ref: '' };
    if (id) B.step = 1;
    render();
    scrim.hidden = false; drawer.hidden = false;
    if (api.lenis) api.lenis.stop();
    requestAnimationFrame(function () { scrim.classList.add('on'); drawer.classList.add('on'); document.getElementById('dr-x').focus(); });
  }
  function close() {
    scrim.classList.remove('on'); drawer.classList.remove('on');
    if (api.lenis) api.lenis.start();
    setTimeout(function () { scrim.hidden = true; drawer.hidden = true; }, 500);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-book]'); if (b) { e.preventDefault(); open(b.getAttribute('data-book') || null); return; }
    if (drawer.hidden) return;
    var el;
    if ((el = e.target.closest('[data-svc]'))) { B.svc = el.dataset.svc; render(); var n = foot.querySelector('[data-next]'); if (n) n.focus(); }
    else if ((el = e.target.closest('[data-day]'))) { B.day = +el.dataset.day; B.time = null; render(); var d = body.querySelector('[data-day="' + B.day + '"]'); if (d) d.focus(); }
    else if ((el = e.target.closest('[data-time]'))) { B.time = +el.dataset.time; render(); var tt = body.querySelector('[data-time="' + B.time + '"]'); if (tt) tt.focus(); }
    else if (e.target.closest('[data-next]')) { B.step++; render(); }
    else if (e.target.closest('[data-back]')) { B.step--; render(); }
    else if (e.target.closest('[data-close]') || e.target.id === 'dr-x' || e.target === scrim) close();
    else if (e.target.closest('[data-confirm]')) {
      var nm = document.getElementById('dn'), em = document.getElementById('de'), bad = null;
      [nm, em].forEach(function (x) { var ok = x.value.trim() !== '' && (x !== em || /\S+@\S+/.test(x.value)); x.style.borderColor = ok ? '' : '#b3261e'; x.setAttribute('aria-invalid', ok ? 'false' : 'true'); if (!ok && !bad) bad = x; });
      B.name = nm.value.trim(); B.email = em.value.trim(); B.note = document.getElementById('dt').value;
      if (bad) { bad.focus(); return; }
      B.ref = 'B-' + (1000 + Math.floor(Math.random() * 9000)); B.step = 3; render();
      var t = document.getElementById('dr-title'); if (t) t.focus();
    }
  });
  document.addEventListener('keydown', function (e) {
    if (drawer.hidden) return;
    if (e.key === 'Escape') { close(); return; }
    if (e.key === 'Tab') {
      var f = drawer.querySelectorAll('button:not([disabled]), input, textarea');
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
})();
