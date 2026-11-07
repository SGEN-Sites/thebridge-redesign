/* spray-tag.js - the blue QUEENS in the home hero, sprayed on in a loop.
   Two canvases: .h-spray__paint collects the paint and is only ever added to, so a frame costs a few stamps, not a redraw;
   .h-spray__fx holds what moves (nozzle mist, flying specks, drip beads, the can). The word is drawn stroke by stroke along hand
   paths, so it reads as a writer's tag: soft fat-cap edges, speckle, drips, then a hold, a fade and the next run.
   Off screen or paused it stops. Under prefers-reduced-motion the finished tag is painted once and nothing moves.
   Without JavaScript or canvas the static .h-hero__tag stays. Every URL comes from an attribute (contract D6). */
(function () {
  'use strict';
  var root = document.querySelector('[data-spray-tag]');
  if (!root) return;
  var hero = root.closest('.h-hero') || root.parentNode;
  var paintC = root.querySelector('.h-spray__paint');
  var fxC = root.querySelector('.h-spray__fx');
  var P = paintC && paintC.getContext && paintC.getContext('2d');
  var F = fxC && fxC.getContext && fxC.getContext('2d');
  if (!P || !F) return;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var toggle = hero.querySelector('[data-spray-toggle]');
  var BLUE = '27,57,255';
  var TAU = Math.PI * 2;

  /* the word, in a 1180 x 320 design space. One entry = one pull of the can. drips: [where along the stroke 0..1, length, width] */
  var WORD = [
    { pts: [[112, 30], [58, 40], [22, 92], [16, 160], [38, 226], [92, 262], [150, 246], [186, 190], [190, 118], [164, 58], [108, 28]], drips: [] },
    { pts: [[112, 176], [150, 224], [200, 262], [256, 284]], drips: [[0.98, 92, 1]] },
    { pts: [[290, 42], [282, 120], [284, 200], [306, 250], [352, 266], [396, 240], [414, 170], [420, 40]], drips: [[0.47, 58, 0.9]] },
    { pts: [[606, 40], [540, 36], [484, 38], [484, 38], [478, 140], [474, 262], [474, 262], [540, 264], [610, 258]], drips: [[0.66, 104, 1]] },
    { pts: [[480, 150], [530, 146], [580, 142]], drips: [] },
    { pts: [[796, 36], [730, 32], [672, 34], [672, 34], [666, 138], [662, 260], [662, 260], [730, 262], [800, 254]], drips: [] },
    { pts: [[668, 146], [720, 142], [772, 138]], drips: [[0.98, 48, 0.8]] },
    { pts: [[848, 284], [852, 170], [862, 36], [862, 36], [908, 146], [968, 276], [968, 276], [980, 160], [992, 30]], drips: [[0.62, 122, 1.1]] },
    { pts: [[1166, 58], [1112, 30], [1058, 46], [1046, 94], [1082, 140], [1140, 176], [1168, 226], [1138, 272], [1076, 284], [1020, 262]], drips: [[0.8, 76, 0.9]] }
  ];
  var WRITE_SECONDS = 5.2, HOLD = 2.9, FADE = 1.1, REST = 0.35, JUMP = 0.13;

  /* seeded, so every run paints the same tag */
  var seed = 1;
  function rnd() { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }
  function gauss() { return Math.sqrt(-2 * Math.log(rnd() + 1e-6)) * Math.cos(TAU * rnd()); }

  /* Catmull-Rom through the hand points, sampled fine */
  function spline(pts) {
    var out = [];
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[Math.max(i - 1, 0)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(i + 2, pts.length - 1)];
      var d = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
      var n = Math.max(2, Math.ceil(d / 5));
      for (var k = 0; k < n; k++) {
        var t = k / n, t2 = t * t, t3 = t2 * t;
        out.push([
          0.5 * (2 * p1[0] + (p2[0] - p0[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (3 * p1[0] - p0[0] - 3 * p2[0] + p3[0]) * t3),
          0.5 * (2 * p1[1] + (p2[1] - p0[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (3 * p1[1] - p0[1] - 3 * p2[1] + p3[1]) * t3)
        ]);
      }
    }
    out.push(pts[pts.length - 1]);
    return out;
  }
  var CURVES = WORD.map(function (s) { return spline(s.pts); });

  var W = 0, H = 0, dpr = 1, R = 14, K = 1, strokes = [], stampC = null, glowC = null, totalLen = 0, canH = 0;
  var canImg = null, canReady = false;
  var canUrl = root.getAttribute('data-can');
  if (canUrl && !reduce) { canImg = new Image(); canImg.onload = function () { canReady = true; }; canImg.src = canUrl; }

  function sprite(radius, stops) {
    var c = document.createElement('canvas');
    var s = Math.ceil(radius * 2 * dpr) + 2;
    c.width = c.height = s;
    var x = c.getContext('2d');
    var g = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    stops.forEach(function (st) { g.addColorStop(st[0], 'rgba(' + BLUE + ',' + st[1] + ')'); });
    x.fillStyle = g;
    x.fillRect(0, 0, s, s);
    return c;
  }

  function layout() {
    W = root.clientWidth; H = root.clientHeight;
    if (!W || !H) return false;
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    [paintC, fxC].forEach(function (c) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); });
    P.setTransform(dpr, 0, 0, dpr, 0, 0);
    F.setTransform(dpr, 0, 0, dpr, 0, 0);
    var rr = root.getBoundingClientRect();
    var hr = hero.getBoundingClientRect();
    var head = hr.top - rr.top;
    var heroH = H - head;
    var wordW, ox, oy, s, rot = -0.045, slant = 0.09;
    if (W >= 1024) {
      /* desktop: across the top of the bridge, right of the headline, above the logo */
      var right = Math.max(W * 0.045, 24);
      var outline = hero.querySelector('.h-hero__line.outline');
      var minX = outline ? outline.getBoundingClientRect().right - rr.left + 8 : 0;
      wordW = Math.min(W * 0.68, heroH * 2.3, 1500, W - minX - right);
      s = wordW / 1180;
      ox = W - wordW - right;
      oy = head + heroH * 0.015 + wordW * Math.sin(-rot) * 0.72;
    } else {
      /* phones and tablets: the word lands just above the eyebrow, under the logo */
      wordW = W >= 760 ? W * 0.84 : W * 1.02;
      s = wordW / 1180;
      ox = W >= 760 ? W * 0.02 : -W * 0.012;
      var eb = hero.querySelector('.h-hero__eyebrow');
      var ebTop = eb ? eb.getBoundingClientRect().top - rr.top : head + heroH * 0.3;
      oy = ebTop - 314 * s + wordW * Math.sin(-rot) * 0.5;
    }
    K = Math.max(s, 0.34);
    R = 13 * s;
    canH = Math.max(320 * s * 0.42, 56);
    var cos = Math.cos(rot), sin = Math.sin(rot);
    var map = function (p) {
      var x = p[0] + (160 - p[1]) * slant, y = p[1];
      return [ox + (x * cos - y * sin) * s, oy + (x * sin + y * cos) * s];
    };
    totalLen = 0;
    strokes = CURVES.map(function (curve, i) {
      var pts = curve.map(map);
      var step = Math.max(R * 0.26, 1.1);
      var stamps = [[pts[0][0], pts[0][1]]], carry = 0;
      for (var j = 1; j < pts.length; j++) {
        var a = pts[j - 1], b = pts[j], d = Math.hypot(b[0] - a[0], b[1] - a[1]), at = step - carry;
        while (at <= d) { stamps.push([a[0] + (b[0] - a[0]) * at / d, a[1] + (b[1] - a[1]) * at / d]); at += step; }
        carry = d - (at - step);
      }
      stamps.forEach(function (st, k) {
        st[2] = 0.92 + 0.14 * Math.sin(k * 0.06 + i * 1.7) + 0.07 * Math.sin(k * 0.17 + i) + (k < 5 ? (5 - k) * 0.035 : 0);
      });
      totalLen += stamps.length * step;
      var drips = WORD[i].drips.map(function (dr) {
        return { at: Math.round(dr[0] * (stamps.length - 1)), len: dr[1] * s, w: Math.max(1.4, 3 * s * dr[2]), fired: false };
      });
      return { stamps: stamps, step: step, drips: drips };
    });
    stampC = sprite(R * 1.3, [[0, 0.95], [0.5, 0.85], [0.72, 0.42], [0.88, 0.1], [1, 0]]);
    glowC = sprite(R * 4.4, [[0, 0.42], [0.25, 0.2], [0.6, 0.06], [1, 0]]);
    return true;
  }

  var state = 'idle', si = 0, sp = 0, clock = 0, live = [], flying = [], nozzle = null, nozzleOn = false, canX = 0, canY = 0, canA = 0, canVx = 0;
  function setState(n) { state = n; root.setAttribute('data-state', n); }

  function stampAt(x, y, press) {
    var r = R * 1.3 * (press || 1);
    P.globalAlpha = 0.5;
    P.drawImage(stampC, x - r, y - r, r * 2, r * 2);
  }
  /* speckle: most lands in a band just past the stroke edge, a little flies further */
  function speckle(x, y, count) {
    P.fillStyle = 'rgb(' + BLUE + ')';
    for (var b = 0; b < 3; b++) {
      P.globalAlpha = [0.92, 0.6, 0.32][b];
      P.beginPath();
      for (var i = 0; i < count; i++) {
        var far = rnd() < 0.16;
        var dist = R * (far ? 1.7 + rnd() * 2.2 : 0.92 + Math.abs(gauss()) * 0.5);
        var ang = rnd() * TAU;
        var size = (far ? 0.35 + rnd() * 0.7 : 0.4 + rnd() * 0.85) * K * 1.5;
        var px = x + Math.cos(ang) * dist, py = y + Math.sin(ang) * dist;
        P.moveTo(px + size, py);
        P.arc(px, py, size, 0, TAU);
      }
      P.fill();
    }
    P.globalAlpha = 1;
  }

  function beginRun() {
    seed = 7331;
    P.clearRect(0, 0, W, H);
    paintC.style.opacity = '1';
    live = []; flying = [];
    si = 0; sp = 0; clock = 0;
    strokes.forEach(function (s) { s.drips.forEach(function (d) { d.fired = false; }); });
    nozzle = strokes[0].stamps[0].slice();
    canX = nozzle[0] + 40 * K; canY = nozzle[1] + 90 * K; canA = 0; canVx = 0;
    setState('write');
  }

  function fireDrips(s, from, to) {
    s.drips.forEach(function (d) {
      if (!d.fired && d.at >= from && d.at <= to) {
        d.fired = true;
        var st = s.stamps[d.at];
        live.push({ x: st[0], y: st[1] + R * 0.5, len: d.len, w: d.w, cur: 0, t: 0, wob: (rnd() - 0.5) * 0.05 });
      }
    });
  }

  function growDrips(dt) {
    P.strokeStyle = 'rgb(' + BLUE + ')';
    P.lineCap = 'round';
    P.globalAlpha = 1;
    live.forEach(function (d) {
      d.t += dt;
      var next = d.len * (1 - Math.exp(-d.t / 1.15));
      if (next - d.cur < 0.35) return;
      P.lineWidth = d.w * (1 - 0.34 * (d.cur / d.len));
      P.beginPath();
      P.moveTo(d.x + d.wob * d.cur, d.y + d.cur);
      P.lineTo(d.x + d.wob * next, d.y + next);
      P.stroke();
      d.cur = next;
    });
  }

  function step(dt) {
    clock += dt;
    if (state === 'write') {
      var s = strokes[si];
      var speed = totalLen / WRITE_SECONDS;
      var u = sp / Math.max(s.stamps.length - 1, 1);
      var pace = 0.72 + 0.46 * Math.sin(Math.PI * Math.min(u, 1));
      var n = Math.max(1, Math.round(speed * pace * dt / s.step));
      var end = Math.min(sp + n, s.stamps.length - 1);
      for (var i = sp; i <= end; i++) {
        stampAt(s.stamps[i][0], s.stamps[i][1], s.stamps[i][2]);
        if (i % 2 === 0) speckle(s.stamps[i][0], s.stamps[i][1], 5);
      }
      var prev = nozzle;
      nozzle = s.stamps[end].slice();
      canVx = (nozzle[0] - prev[0]) / Math.max(dt, 0.001);
      fireDrips(s, sp, end);
      for (var f = 0; f < 5; f++) {
        var a = rnd() * TAU, v = (70 + rnd() * 230) * K;
        flying.push({ x: nozzle[0], y: nozzle[1], vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.16 + rnd() * 0.26, t: 0, r: (0.5 + rnd() * 1.1) * K * 1.5 });
      }
      nozzleOn = true;
      sp = end + 1;
      if (sp >= s.stamps.length) {
        si++;
        if (si >= strokes.length) { nozzleOn = false; clock = 0; setState('hold'); }
        else { nozzleOn = false; clock = 0; sp = 0; setState('jump'); }
      }
    } else if (state === 'jump') {
      var target = strokes[si].stamps[0];
      var q = Math.min(clock / JUMP, 1);
      nozzle = [nozzle[0] + (target[0] - nozzle[0]) * q, nozzle[1] + (target[1] - nozzle[1]) * q];
      if (q >= 1) { clock = 0; setState('write'); }
    } else if (state === 'hold') {
      if (clock > HOLD) { clock = 0; setState('fade'); }
    } else if (state === 'fade') {
      paintC.style.opacity = String(Math.max(1 - clock / FADE, 0));
      if (clock > FADE) { clock = 0; live = []; setState('rest'); }
    } else if (state === 'rest') {
      if (clock > REST) beginRun();
    }
    growDrips(dt);
  }

  function drawFx(dt) {
    F.clearRect(0, 0, W, H);
    /* mist at the nozzle */
    if (nozzleOn && nozzle) {
      var g = R * 4.4;
      F.globalAlpha = 1;
      F.drawImage(glowC, nozzle[0] - g, nozzle[1] - g, g * 2, g * 2);
    }
    /* flying specks */
    F.fillStyle = 'rgb(' + BLUE + ')';
    flying = flying.filter(function (p) {
      p.t += dt;
      if (p.t > p.life) return false;
      p.x += p.vx * dt; p.y += p.vy * dt;
      F.globalAlpha = 1 - p.t / p.life;
      F.beginPath();
      F.arc(p.x, p.y, p.r, 0, TAU);
      F.fill();
      return true;
    });
    /* wet beads at the head of each running drip */
    F.globalAlpha = 1;
    live.forEach(function (d) {
      if (d.cur >= d.len * 0.97) return;
      F.beginPath();
      F.arc(d.x + d.wob * d.cur, d.y + d.cur, d.w * 0.82, 0, TAU);
      F.fill();
    });
    /* the can follows the nozzle a beat behind and leaves when the tag is done */
    if (canReady && nozzle) {
      var writing = state === 'write' || state === 'jump';
      canA += ((writing ? 1 : 0) - canA) * Math.min(1, dt * (writing ? 12 : 4));
      var aim = writing ? nozzle : [nozzle[0] + 150 * K, nozzle[1] + 120 * K];
      canX += (aim[0] - canX) * Math.min(1, dt * (writing ? 22 : 2.5));
      canY += (aim[1] - canY) * Math.min(1, dt * (writing ? 22 : 2.5));
      if (canA > 0.02) {
        var ch = canH, cw = ch * canImg.naturalWidth / canImg.naturalHeight;
        F.save();
        F.globalAlpha = canA;
        F.translate(canX + R * 0.5, canY + R * 0.15);
        F.rotate(0.12 + Math.max(-0.14, Math.min(0.14, canVx * 0.00018)));
        /* the cut-out's nozzle sits near the top left of the file */
        F.drawImage(canImg, -cw * 0.13, -ch * 0.015, cw, ch);
        F.restore();
      }
    }
    F.globalAlpha = 1;
  }

  /* the finished tag at once, for reduced motion */
  function paintAll() {
    seed = 7331;
    P.clearRect(0, 0, W, H);
    paintC.style.opacity = '1';
    strokes.forEach(function (s) {
      s.stamps.forEach(function (st, i) { stampAt(st[0], st[1], st[2]); if (i % 2 === 0) speckle(st[0], st[1], 5); });
      s.drips.forEach(function (d) {
        var st = s.stamps[d.at];
        P.strokeStyle = 'rgb(' + BLUE + ')'; P.lineCap = 'round'; P.lineWidth = d.w; P.globalAlpha = 1;
        P.beginPath(); P.moveTo(st[0], st[1] + R * 0.5); P.lineTo(st[0], st[1] + R * 0.5 + d.len); P.stroke();
      });
    });
    P.globalAlpha = 1;
  }

  var raf = window.requestAnimationFrame.bind(window);
  var running = false, paused = false, seen = false, last = 0;
  function tick(now) {
    if (!running) return;
    var dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    step(dt);
    drawFx(dt);
    raf(tick);
  }
  function sync() {
    var should = seen && !paused && !document.hidden;
    if (should && !running) { running = true; last = performance.now(); raf(tick); }
    else if (!should) { running = false; }
  }

  function start() {
    if (!layout()) return false;
    hero.classList.add('has-spray');
    if (reduce) { paintAll(); setState('still'); return true; }
    beginRun();
    return true;
  }

  function boot() {
    if (!start()) return;
    if (reduce) return;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { seen = es[es.length - 1].isIntersecting; sync(); }, { rootMargin: '8% 0px 8% 0px' }).observe(root);
    } else { seen = true; sync(); }
    document.addEventListener('visibilitychange', sync);
    if (toggle) {
      toggle.addEventListener('click', function () {
        paused = toggle.getAttribute('aria-pressed') !== 'true';
        toggle.setAttribute('aria-pressed', paused ? 'true' : 'false');
        toggle.setAttribute('aria-label', paused ? 'Play motion' : 'Pause motion');
        sync();
      });
    }
  }

  /* a width change restarts the run; the mobile URL bar's small height changes do not */
  var lastW = 0, timer = 0;
  function onResize() {
    clearTimeout(timer);
    timer = setTimeout(function () {
      var w = root.clientWidth;
      if (w === lastW) return;
      lastW = w;
      if (!layout()) return;
      if (reduce) paintAll(); else beginRun();
    }, 160);
  }

  /* the phone layout reads the eyebrow's position, so wait for the fonts before the first layout */
  var go = function () { lastW = root.clientWidth; boot(); window.addEventListener('resize', onResize); };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(go, go); else go();
})();
