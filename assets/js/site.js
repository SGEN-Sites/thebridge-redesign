/* site.js: "Night Piece" behaviour (FOUNDATION): 21+ gate, header state, mega menus (hover intent with a gap bridge and a
   close delay, click, keyboard, Escape), drawer below 1024 px, reveals and paint wipes (2.5 s fail-safe), depth, tilt, cursor
   key light, torch, scroll-lit words, marquee, rail, video facade, autoplay loops, demo forms, lightbox, footer sweep.
   No dependencies, defer-safe. Contract D6: no quoted string literal in this file starts with a slash; every URL is read from
   an HTML attribute. Every motion hook is off under prefers-reduced-motion. */
(function () {
  'use strict';
  var doc = document;
  var root = doc.documentElement;
  var mq = function (q) { return window.matchMedia ? window.matchMedia(q) : { matches: false }; };
  var reduce = mq('(prefers-reduced-motion: reduce)').matches;
  var finePointer = mq('(hover: hover) and (pointer: fine)').matches;
  var coarse = mq('(hover: none), (pointer: coarse)').matches;
  var desktopMq = mq('(min-width: 1024px)');
  var $$ = function (sel, el) { return Array.prototype.slice.call((el || doc).querySelectorAll(sel)); };
  var $ = function (sel, el) { return (el || doc).querySelector(sel); };
  var hasIO = 'IntersectionObserver' in window;
  var onMq = function (m, fn) { if (m.addEventListener) m.addEventListener('change', fn); else if (m.addListener) m.addListener(fn); };
  var vh = function () { return window.innerHeight || root.clientHeight; };
  var clamp = function (x, a, b) { return Math.max(a, Math.min(b, x)); };
  var raf = window.requestAnimationFrame.bind(window);
  var onScreen = function (els, fn, opts) {
    if (!hasIO) { els.forEach(function (el) { fn(el, true); }); return; }
    var io = new IntersectionObserver(function (en) { en.forEach(function (x) { fn(x.target, x.isIntersecting); }); }, opts || {});
    els.forEach(function (el) { io.observe(el); });
  };
  var ARROW = '<svg class="ico" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4.5 12h15"></path><path d="m13 5.5 6.5 6.5-6.5 6.5"></path></svg>';
  var CROSS = '<svg class="ico" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M6 6l12 12"></path><path d="M18 6 6 18"></path></svg>';
  root.classList.add('js');

  var focusables = function (el) {
    return $$('a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])', el).filter(function (x) {
      return !x.hidden && x.offsetParent !== null;
    });
  };
  var loop = function (box, e) {
    var f = focusables(box);
    if (!f.length) { e.preventDefault(); return; }
    var a = f[0], z = f[f.length - 1];
    if (e.shiftKey && (doc.activeElement === a || !box.contains(doc.activeElement))) { e.preventDefault(); z.focus(); }
    else if (!e.shiftKey && (doc.activeElement === z || !box.contains(doc.activeElement))) { e.preventDefault(); a.focus(); }
  };
  /* after the 21+ gate closes: move focus to <main> (nothing visible; the tabindex goes away on blur) */
  var focusMain = function () {
    var m = doc.getElementById('main');
    if (!m) return;
    m.setAttribute('tabindex', '-1');
    m.focus({ preventScroll: true });
    m.addEventListener('blur', function () { m.removeAttribute('tabindex'); }, { once: true });
  };

  /* ---------------- 21+ gate (D7). Hidden in the HTML, so it never blocks without JS; the head script set html.gate-open
     before first paint when the key is missing, so a returning visitor sees no flash. ---------------- */
  var gate = $('[data-age-gate]');
  if (gate) {
    var KEY = gate.getAttribute('data-age-key');
    var ok = false;
    try { ok = window.localStorage.getItem(KEY) === '1'; } catch (err) { ok = false; }
    if (ok) {
      root.classList.remove('gate-open');
    } else {
      var site = $('.site');
      var pane = $('[role="dialog"]', gate);
      var ask = $('[data-age-ask]', gate);
      var blocked = $('[data-age-blocked]', gate);
      var yes = $('[data-age-yes]', gate);
      var no = $('[data-age-no]', gate);
      root.classList.add('gate-open');
      gate.hidden = false;
      if (site && 'inert' in site) site.inert = true;
      setTimeout(function () { if (yes) yes.focus(); }, 40);
      if (yes) yes.addEventListener('click', function () {
        try { window.localStorage.setItem(KEY, '1'); } catch (err) { /* storage blocked: the gate just closes for this page */ }
        gate.hidden = true;
        root.classList.remove('gate-open');
        if (site && 'inert' in site) site.inert = false;
        focusMain();
      });
      if (no) no.addEventListener('click', function () {
        if (ask) ask.hidden = true;
        if (blocked) { blocked.hidden = false; blocked.focus(); }
        if (pane) { pane.setAttribute('aria-labelledby', 'age-gate-bt'); pane.removeAttribute('aria-describedby'); }
      });
      gate.addEventListener('keydown', function (e) { if (e.key === 'Tab') loop(gate, e); });
      doc.addEventListener('focusin', function (e) {
        if (gate.hidden || gate.contains(e.target)) return;
        if (blocked && !blocked.hidden) blocked.focus();
        else if (yes) yes.focus();
      });
    }
  }

  /* ---------------- header: scrolled state ---------------- */
  var header = $('[data-header]');
  var tick = false;
  function onScroll() {
    tick = false;
    if (header) header.classList.toggle('is-scrolled', (window.scrollY || window.pageYOffset || 0) > 24);
  }
  onScroll();
  window.addEventListener('scroll', function () { if (!tick) { tick = true; raf(onScroll); } }, { passive: true });

  /* ---------------- mega menus ([data-dropdown]): hover intent, click, keyboard, Escape ---------------- */
  var items = $$('[data-dropdown]');
  var openItem = null;
  var openTimer = 0;
  var closeTimer = 0;
  function trig(item) { return $('[data-dropdown-trigger]', item); }
  function setOpen(item, open) {
    var btn = trig(item);
    item.classList.toggle('is-open', open);
    if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) {
      if (openItem && openItem !== item) setOpen(openItem, false);
      openItem = item;
    } else if (openItem === item) {
      openItem = null;
    }
    if (header) header.classList.toggle('has-open-panel', !!openItem && desktopMq.matches);
  }
  function closeAll() { items.forEach(function (m) { if (m.classList.contains('is-open')) setOpen(m, false); }); }
  items.forEach(function (item) {
    var btn = trig(item);
    if (!btn) return;
    btn.addEventListener('click', function () {
      clearTimeout(openTimer); clearTimeout(closeTimer);
      setOpen(item, !item.classList.contains('is-open'));
    });
    btn.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowDown') return;
      e.preventDefault();
      setOpen(item, true);
      var panel = $('[data-dropdown-panel]', item);
      var f = panel ? focusables(panel) : [];
      if (f.length) f[0].focus();
    });
    item.addEventListener('pointerenter', function (e) {
      if (e.pointerType !== 'mouse' || !desktopMq.matches) return;
      clearTimeout(closeTimer); clearTimeout(openTimer);
      /* intent: a short delay on the first open, none when moving between panels */
      openTimer = setTimeout(function () { setOpen(item, true); }, openItem ? 0 : 120);
    });
    item.addEventListener('pointerleave', function (e) {
      if (e.pointerType !== 'mouse' || !desktopMq.matches) return;
      clearTimeout(openTimer);
      closeTimer = setTimeout(function () { if (openItem === item) setOpen(item, false); }, 300);
    });
    item.addEventListener('focusout', function (e) {
      if (!desktopMq.matches) return;
      if (e.relatedTarget && item.contains(e.relatedTarget)) return;
      setTimeout(function () { if (!item.contains(doc.activeElement) && item.classList.contains('is-open')) setOpen(item, false); }, 0);
    });
  });
  /* a plain nav item without a panel closes whatever is open as soon as the pointer reaches it */
  $$('.nav__item:not([data-dropdown])').forEach(function (it) {
    it.addEventListener('pointerenter', function (e) {
      if (e.pointerType !== 'mouse' || !desktopMq.matches || !openItem) return;
      clearTimeout(openTimer);
      closeTimer = setTimeout(function () { if (openItem) setOpen(openItem, false); }, 120);
    });
  });
  doc.addEventListener('click', function (e) {
    if (!openItem || openItem.contains(e.target)) return;
    if (desktopMq.matches) closeAll();
  });

  /* ---------------- drawer (below 1024 px), with a focus loop while open ---------------- */
  var nav = $('[data-nav]');
  var toggle = $('[data-nav-toggle]');
  var scrim = $('[data-nav-scrim]');
  var closeBtn = $('[data-nav-close]');
  function setDrawer(open, returnFocus) {
    if (!nav || !toggle) return;
    root.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (scrim) scrim.hidden = !open;
    if (open) {
      setTimeout(function () { var f = closeBtn || focusables(nav)[0]; if (f) f.focus(); }, 60);
    } else {
      closeAll();
      if (returnFocus) toggle.focus();
    }
  }
  if (toggle) toggle.addEventListener('click', function () { setDrawer(!root.classList.contains('nav-open')); });
  if (closeBtn) closeBtn.addEventListener('click', function () { setDrawer(false, true); });
  if (scrim) scrim.addEventListener('click', function () { setDrawer(false, true); });
  if (nav) {
    nav.addEventListener('keydown', function (e) { if (e.key === 'Tab' && root.classList.contains('nav-open')) loop(nav, e); });
    nav.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('a[href]') : null;
      if (a && root.classList.contains('nav-open')) setDrawer(false);
    });
  }
  /* crossing 1024 px hides one of the two navs: never leave focus inside the hidden one */
  onMq(desktopMq, function () {
    var active = doc.activeElement;
    setDrawer(false);
    closeAll();
    if (active && active !== doc.body && active.offsetParent === null) {
      var t = desktopMq.matches ? $('.mainbar .logo') : toggle;
      if (t) t.focus();
    }
  });

  /* Escape: close the open panel (focus back on its trigger) or the drawer */
  doc.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape' && e.key !== 'Esc') return;
    if (gate && !gate.hidden) return;
    if (openItem) {
      var btn = trig(openItem);
      setOpen(openItem, false);
      if (btn && btn.offsetParent !== null) btn.focus();
      return;
    }
    if (root.classList.contains('nav-open')) setDrawer(false, true);
  });

  /* ---------------- reveals ([data-reveal], [data-spray]): IntersectionObserver adds .is-in. motion.css holds the CSS
     fail-safe (visible at 2.5 s even with no JS running); the timer below covers a dead IntersectionObserver. ---------------- */
  var maskUrl = root.getAttribute('data-spray-mask');
  if (maskUrl && !reduce && hasIO) {
    var maskImg = new Image();
    maskImg.onload = function () { root.classList.add('spray-ok'); };
    maskImg.src = maskUrl;
  }
  var reveals = $$('[data-reveal], [data-spray]');
  if (reduce || !hasIO) {
    reveals.forEach(function (el) { el.classList.add('is-in', 'spray-done'); });
  } else if (reveals.length) {
    var ioAlive = false;
    var ioReveal = new IntersectionObserver(function (entries) {
      ioAlive = true;
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); ioReveal.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
    reveals.forEach(function (el) { ioReveal.observe(el); });
    var markIn = function (el) { el.classList.add('is-in'); ioReveal.unobserve(el); };
    raf(function () {
      raf(function () {
        reveals.forEach(function (el) { var r = el.getBoundingClientRect(); if ((r.width || r.height) && r.bottom > 0 && r.top < vh()) markIn(el); });
      });
    });
    setTimeout(function () {
      if (ioAlive) return;
      reveals.forEach(markIn);
    }, 2500);
    /* the paint mask goes away once the wipe has run, so nothing stays masked */
    doc.addEventListener('animationend', function (e) {
      if (e.animationName === 'spray-wipe' && e.target.classList) e.target.classList.add('spray-done');
    });
  }

  /* ---------------- parallax ([data-depth="0.15"]: rAF, the translate property, only while on screen; negative moves
     against the scroll) ---------------- */
  var depthEls = (reduce || coarse) ? [] : $$('[data-depth]');
  if (depthEls.length) {
    var dTick = false;
    var vis = [];
    var dUpdate = function () {
      dTick = false;
      var h = vh();
      vis.forEach(function (el) {
        var d = parseFloat(el.getAttribute('data-depth')) || 0;
        /* measure without our own offset, so the element does not chase itself */
        var r = el.getBoundingClientRect();
        var y = clamp(-(r.top - (el._py || 0) + r.height / 2 - h / 2) * d, -140, 140);
        el._py = y;
        el.style.setProperty('--py', y.toFixed(1) + 'px');
      });
    };
    var dQueue = function () { if (!dTick) { dTick = true; raf(dUpdate); } };
    if (hasIO) {
      var ioDepth = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          var i = vis.indexOf(en.target);
          if (en.isIntersecting && i < 0) { vis.push(en.target); en.target.classList.add('is-moving'); }
          if (!en.isIntersecting && i >= 0) { vis.splice(i, 1); en.target.classList.remove('is-moving'); }
        });
        dQueue();
      }, { rootMargin: '25% 0px 25% 0px' });
      depthEls.forEach(function (el) { ioDepth.observe(el); });
    } else { vis = depthEls.slice(); }
    window.addEventListener('scroll', dQueue, { passive: true });
    window.addEventListener('resize', dQueue, { passive: true });
    dQueue();
  }

  /* ---------------- [data-tilt="6"]: pointer tilt on fine pointers ---------------- */
  if (!reduce && finePointer) {
    $$('[data-tilt]').forEach(function (el) {
      var max = parseFloat(el.getAttribute('data-tilt')) || 6;
      var pending = 0, px = 0, py = 0;
      var paint = function () {
        pending = 0;
        el.style.setProperty('--ry', (px * max * 2).toFixed(2) + 'deg');
        el.style.setProperty('--rx', (-py * max * 2).toFixed(2) + 'deg');
      };
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        if (!r.width || !r.height) return;
        px = (e.clientX - r.left) / r.width - 0.5;
        py = (e.clientY - r.top) / r.height - 0.5;
        el.classList.add('is-tilting');
        if (!pending) pending = raf(paint);
      });
      el.addEventListener('pointerleave', function () {
        el.classList.remove('is-tilting');
        el.style.setProperty('--rx', '0deg');
        el.style.setProperty('--ry', '0deg');
      });
    });
  }

  /* ---------------- [data-spot]: the key light follows the cursor, heavy and slow (--lx / --ly in %) ---------------- */
  if (!reduce && finePointer) {
    $$('[data-spot]').forEach(function (el) {
      if (!el.classList.contains('band') && !el.classList.contains('glass')) {
        var layer = doc.createElement('span');
        layer.className = 'spot';
        layer.setAttribute('aria-hidden', 'true');
        el.insertBefore(layer, el.firstChild);
      }
      var tx = 0, ty = 0, cx = -1, cy = -1, running = false;
      var step = function () {
        cx += (tx - cx) * 0.12; cy += (ty - cy) * 0.12;
        el.style.setProperty('--lx', cx.toFixed(2) + '%');
        el.style.setProperty('--ly', cy.toFixed(2) + '%');
        if (Math.abs(tx - cx) + Math.abs(ty - cy) > 0.08) raf(step); else running = false;
      };
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        if (!r.width || !r.height) return;
        tx = clamp(((e.clientX - r.left) / r.width) * 100, 0, 100);
        ty = clamp(((e.clientY - r.top) / r.height) * 100, 0, 100);
        if (cx < 0) { cx = tx; cy = ty; }
        el.classList.add('is-spotting');
        if (!running) { running = true; raf(step); }
      });
      el.addEventListener('pointerleave', function () { el.classList.remove('is-spotting'); });
    });
  }

  /* ---------------- [data-torch]: a layer seen only in a circle of light. The masked layer is [data-torch-layer] or .torch__layer
     inside the element when there is one, else the element itself (the pointer is then read on its section). With no pointer the
     circle drifts slowly; reduced motion keeps it statically lit. Only runs while on screen. ---------------- */
  $$('[data-torch]').forEach(function (el) {
    var layer = $('[data-torch-layer], .torch__layer', el) || el;
    var host = layer === el ? (el.closest('section, .band') || el.parentNode) : el;
    layer.classList.add('is-torch');
    if (reduce) { layer.classList.add('is-torch-still'); return; }
    var tx = 0.5, ty = 0.45, cx = 0.5, cy = 0.45, inside = false, seen = false, running = false;
    var frame = function (now) {
      if (!seen) { running = false; return; }
      if (!inside) {
        tx = 0.5 + 0.36 * Math.sin(now / 5400);
        ty = 0.5 + 0.3 * Math.sin(now / 3900 + 1.3);
      }
      var k = inside ? 0.13 : 0.025;
      cx += (tx - cx) * k; cy += (ty - cy) * k;
      layer.style.setProperty('--tx', (cx * 100).toFixed(2) + '%');
      layer.style.setProperty('--ty', (cy * 100).toFixed(2) + '%');
      raf(frame);
    };
    onScreen([host], function (_, on) {
      seen = on;
      if (on && !running) { running = true; raf(frame); }
    });
    if (finePointer) {
      host.addEventListener('pointermove', function (e) {
        var r = layer.getBoundingClientRect();
        if (!r.width || !r.height) return;
        tx = (e.clientX - r.left) / r.width;
        ty = (e.clientY - r.top) / r.height;
        inside = true;
      });
      host.addEventListener('pointerleave', function () { inside = false; });
    }
  });

  /* ---------------- [data-words]: each word lights with scroll progress; a sticky pin from 1024 px. The value is the pin's scroll
     run in vh ([data-words="140"]). Text nodes are split in place, so the real text stays in the DOM once; with no JS or under
     reduced motion it is plain lit text. ---------------- */
  var wordBlocks = [];
  if (!reduce) {
    $$('[data-words]').forEach(function (el) {
      var spans = [];
      (function walk(node) {
        Array.prototype.slice.call(node.childNodes).forEach(function (n) {
          if (n.nodeType === 3) {
            if (!/\S/.test(n.nodeValue)) return;
            var frag = doc.createDocumentFragment();
            n.nodeValue.split(/(\s+)/).forEach(function (w) {
              if (!w) return;
              if (!/\S/.test(w)) { frag.appendChild(doc.createTextNode(w)); return; }
              var s = doc.createElement('span');
              s.className = 'w';
              s.textContent = w;
              spans.push(s);
              frag.appendChild(s);
            });
            node.replaceChild(frag, n);
          } else if (n.nodeType === 1 && n.getAttribute('aria-hidden') !== 'true') {
            walk(n);
          }
        });
      })(el);
      if (!spans.length) return;
      el.classList.add('is-words');
      var pin = doc.createElement('div');
      pin.className = 'words-pin';
      var stick = doc.createElement('div');
      stick.className = 'words-pin__stick';
      el.parentNode.insertBefore(pin, el);
      pin.appendChild(stick);
      stick.appendChild(el);
      wordBlocks.push({ el: el, pin: pin, stick: stick, spans: spans, run: parseFloat(el.getAttribute('data-words')) || 130, last: [] });
    });
  }
  if (wordBlocks.length) {
    var wTick = false;
    var wLayout = function () {
      wordBlocks.forEach(function (b) {
        var h = vh();
        var bar = header ? ($('.mainbar', header) || header).offsetHeight : 0;
        var fits = desktopMq.matches && b.el.offsetHeight < h - bar - 32;
        b.pinned = fits;
        /* the statement pins in the middle of the space under the bar */
        b.top = fits ? Math.max(bar + 16, Math.round(bar + (h - bar - b.el.offsetHeight) / 2)) : 0;
        if (fits) b.stick.style.top = b.top + 'px'; else b.stick.style.removeProperty('top');
        b.pin.classList.toggle('words-pin--off', !fits);
        b.runPx = (b.run / 100) * h;
        if (fits) b.pin.style.height = Math.ceil(b.stick.offsetHeight + b.runPx) + 'px';
        else b.pin.style.removeProperty('height');
      });
      wQueue();
    };
    var wPaint = function () {
      wTick = false;
      var h = vh();
      wordBlocks.forEach(function (b) {
        var r = b.pin.getBoundingClientRect();
        if (r.bottom < -h || r.top > h * 1.5) return;
        var p;
        if (b.pinned) {
          p = (h * 0.82 - r.top) / (h * 0.82 - b.top + b.runPx * 0.92);
        } else {
          p = (h * 0.85 - r.top) / (h * 0.3 + r.height);
        }
        p = clamp(p, 0, 1);
        var soft = 6, lit = p * (b.spans.length + soft);
        b.spans.forEach(function (s, i) {
          var v = clamp((lit - i) / soft, 0, 1);
          var o = Math.round((0.16 + 0.84 * v) * 100) / 100;
          if (b.last[i] !== o) { b.last[i] = o; s.style.opacity = o; }
        });
      });
    };
    var wQueue = function () { if (!wTick) { wTick = true; raf(wPaint); } };
    window.addEventListener('scroll', wQueue, { passive: true });
    window.addEventListener('resize', wLayout, { passive: true });
    wLayout();
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(wLayout);
    window.addEventListener('load', wLayout);
  }

  /* ---------------- [data-marquee]: content repeated until it is wide enough, copies aria-hidden, a CSS transform loop; pauses on
     hover, focus and off screen. The value is the speed in px per second. ---------------- */
  $$('[data-marquee]').forEach(function (m) {
    if (reduce) return;
    m.classList.add('marquee');
    var track = doc.createElement('div');
    track.className = 'marquee__track';
    var group = doc.createElement('div');
    group.className = 'marquee__group';
    while (m.firstChild) group.appendChild(m.firstChild);
    track.appendChild(group);
    m.appendChild(track);
    var originals = Array.prototype.slice.call(group.children);
    var guard = 0;
    while (originals.length && group.scrollWidth < m.clientWidth + 40 && guard++ < 8) {
      originals.forEach(function (c) { var k = c.cloneNode(true); k.setAttribute('aria-hidden', 'true'); group.appendChild(k); });
    }
    var copy = group.cloneNode(true);
    copy.setAttribute('aria-hidden', 'true');
    $$('a, button, input, select, textarea, [tabindex]', copy).forEach(function (x) { x.setAttribute('tabindex', '-1'); });
    $$('[id]', copy).forEach(function (x) { x.removeAttribute('id'); });
    track.appendChild(copy);
    var speed = parseFloat(m.getAttribute('data-marquee')) || 70;
    m.style.setProperty('--marquee-dur', Math.max(12, Math.round(group.scrollWidth / speed)) + 's');
    if (hasIO) new IntersectionObserver(function (en) { en.forEach(function (x) { m.classList.toggle('is-paused', !x.isIntersecting); }); }).observe(m);
  });

  /* ---------------- [data-rail]: scroll-snap strip with arrows that move by one card, disabled at the ends; the strip itself takes
     focus and the arrow keys. Reuses [data-rail-prev] / [data-rail-next] when the page has its own buttons. ---------------- */
  $$('[data-rail]').forEach(function (host, n) {
    var track = $('.rail__track', host);
    host.classList.add('rail');
    if (!track) {
      track = doc.createElement('div');
      track.className = 'rail__track';
      while (host.firstChild) track.appendChild(host.firstChild);
      host.appendChild(track);
    }
    track.setAttribute('tabindex', '0');
    if (!track.getAttribute('role')) track.setAttribute('role', 'group');
    if (!track.getAttribute('aria-label')) track.setAttribute('aria-label', host.getAttribute('data-rail-label') || host.getAttribute('aria-label') || 'Scrollable list');
    var prev = $('[data-rail-prev]', host), next = $('[data-rail-next]', host);
    if (!prev || !next) {
      var bar = doc.createElement('div');
      bar.className = 'rail__btns';
      prev = doc.createElement('button');
      prev.type = 'button';
      prev.className = 'rail__btn rail__btn--prev';
      prev.setAttribute('aria-label', 'Previous');
      prev.innerHTML = ARROW;
      next = doc.createElement('button');
      next.type = 'button';
      next.className = 'rail__btn rail__btn--next';
      next.setAttribute('aria-label', 'Next');
      next.innerHTML = ARROW;
      bar.appendChild(prev);
      bar.appendChild(next);
      host.appendChild(bar);
    }
    var by = function (dir) {
      var card = track.firstElementChild;
      var gap = parseFloat(window.getComputedStyle(track).columnGap) || 0;
      var w = card ? card.getBoundingClientRect().width + gap : track.clientWidth * 0.8;
      track.scrollBy({ left: dir * w, behavior: reduce ? 'auto' : 'smooth' });
    };
    var sync = function () {
      var max = track.scrollWidth - track.clientWidth;
      prev.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft >= max - 2;
      /* a disabled button cannot hold focus: hand it to the strip */
      if ((prev.disabled && doc.activeElement === prev) || (next.disabled && doc.activeElement === next)) track.focus({ preventScroll: true });
    };
    prev.addEventListener('click', function () { by(-1); });
    next.addEventListener('click', function () { by(1); });
    track.addEventListener('keydown', function (e) {
      if (e.target !== track) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); by(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); by(-1); }
    });
    var sTick = false;
    track.addEventListener('scroll', function () { if (!sTick) { sTick = true; raf(function () { sTick = false; sync(); }); } }, { passive: true });
    window.addEventListener('resize', sync, { passive: true });
    sync();
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(sync);
    window.addEventListener('load', sync);
  });

  /* ---------------- [data-yt="<id>"]: click-to-load facade. The link goes to YouTube when JS is off. ---------------- */
  $$('[data-yt]').forEach(function (box) {
    var id = box.getAttribute('data-yt');
    var media = $('.ytcard__media', box) || box;
    if (!id) return;
    media.addEventListener('click', function (e) {
      e.preventDefault();
      var f = doc.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) + '?autoplay=1&rel=0';
      f.title = box.getAttribute('data-yt-title') || 'Video';
      f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      f.allowFullscreen = true;
      f.setAttribute('loading', 'eager');
      var holder = doc.createElement('div');
      holder.className = media.className;
      holder.appendChild(f);
      media.parentNode.replaceChild(holder, media);
      f.focus();
    }, { once: true });
  });

  /* ---------------- autoplay loops: poster first; plays only on screen, never under reduced motion. The pause/play toggle moves
     out of .band__clip onto its band, so it is clickable. ---------------- */
  var loops = $$('video[data-loop]');
  var playV = function (v) {
    if (v.hasAttribute('data-user-paused')) return;
    var p = v.play && v.play();
    if (p && p.catch) p.catch(function () { /* blocked or no source for this width: the poster stays */ });
  };
  var loopGroups = [];
  loops.forEach(function (v) {
    v.muted = true;
    var btn = v.nextElementSibling;
    if (!btn || !btn.hasAttribute('data-loop-toggle')) return;
    var clip = v.closest('.band__clip');
    var host = clip ? clip.parentNode : v.parentNode;
    var group = loopGroups.filter(function (g) { return g.host === host; })[0];
    if (group) { group.vids.push(v); btn.parentNode.removeChild(btn); return; }
    group = { host: host, btn: btn, vids: [v] };
    loopGroups.push(group);
    if (window.getComputedStyle(host).position === 'static') host.style.position = 'relative';
    host.appendChild(btn);
    if (reduce) { btn.hidden = true; return; }
    btn.addEventListener('click', function () {
      var pause = btn.getAttribute('aria-pressed') !== 'true';
      btn.setAttribute('aria-pressed', pause ? 'true' : 'false');
      btn.setAttribute('aria-label', pause ? 'Play motion' : 'Pause motion');
      group.vids.forEach(function (x) {
        if (pause) { x.setAttribute('data-user-paused', ''); x.pause(); }
        else { x.removeAttribute('data-user-paused'); playV(x); }
      });
    });
  });
  if (!reduce && loops.length) {
    onScreen(loops, function (v, on) { if (on) playV(v); else if (v.pause) v.pause(); }, { rootMargin: '12% 0px 12% 0px' });
  }

  /* ---------------- demo forms (D9): the button wakes up with JS; never posts; shows the one honest line ---------------- */
  $$('[data-demo-form]').forEach(function (f) {
    $$('[data-demo-btn]', f).forEach(function (b) { b.disabled = false; });
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var note = $('[data-demo-note]', f);
      if (note) note.hidden = false;
    });
  });

  /* ---------------- [data-lightbox]: a link to a full image opens in a <dialog>. Esc (native), the backdrop and a button close it,
     focus returns to the link (native). No showModal: the link just opens the image. ---------------- */
  var lb = null, lbImg = null;
  function lightbox() {
    if (lb) return lb;
    lb = doc.createElement('dialog');
    lb.className = 'lightbox';
    lbImg = doc.createElement('img');
    lbImg.className = 'lightbox__img';
    lbImg.decoding = 'async';
    var x = doc.createElement('button');
    x.type = 'button';
    x.className = 'lightbox__close';
    x.setAttribute('aria-label', 'Close');
    x.innerHTML = CROSS;
    x.addEventListener('click', function () { lb.close(); });
    lb.appendChild(lbImg);
    lb.appendChild(x);
    lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });
    lb.addEventListener('close', function () { lbImg.removeAttribute('src'); });
    doc.body.appendChild(lb);
    return lb;
  }
  $$('[data-lightbox]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var src = a.getAttribute('href') || a.getAttribute('data-src');
      if (!src || !window.HTMLDialogElement) return;
      var d = lightbox();
      if (!d.showModal) return;
      e.preventDefault();
      var inner = $('img', a);
      lbImg.alt = a.getAttribute('data-alt') || (inner ? inner.getAttribute('alt') : '') || '';
      lbImg.src = src;
      d.showModal();
    });
  });

  /* ---------------- footer wordmark sweep: runs only while on screen ---------------- */
  var fm = $$('[data-footer-light]');
  if (fm.length && hasIO && !reduce) {
    fm.forEach(function (x) { x.classList.add('is-paused'); });
    onScreen(fm, function (x, on) { x.classList.toggle('is-paused', !on); }, { rootMargin: '4% 0px 4% 0px' });
  }
})();
