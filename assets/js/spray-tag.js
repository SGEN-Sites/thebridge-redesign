/* spray-tag.js - the blue QUEENS in the home hero, sprayed on in a loop, in the tag's own font.
   The letters are the font's (Sedgwick Ave Display, the face of the static .h-hero__tag): the finished word is drawn once
   with fillText into an offscreen canvas and the spray only reveals it. A nozzle walks each letter's centre lines, measured
   from the font by tools/tag-strokes.py, laying soft coverage; what shows is the word clipped to that coverage, with a soft
   overspray edge, speckle and drips. .h-spray__paint shows the paint; each frame recomposites only the area that changed;
   .h-spray__fx holds what moves (nozzle mist, flying specks, drip beads). Off screen or paused it stops. Under
   prefers-reduced-motion the finished tag is painted once and nothing moves. Without JavaScript, canvas or the font, the
   static .h-hero__tag stays. */
(function () {
  'use strict';
  var root = document.querySelector('[data-spray-tag]');
  if (!root) return;
  var hero = root.closest('.h-hero') || root.parentNode;
  var still = hero.querySelector('.h-hero__tag');
  var paintC = root.querySelector('.h-spray__paint');
  var fxC = root.querySelector('.h-spray__fx');
  var P = paintC && paintC.getContext && paintC.getContext('2d');
  var F = fxC && fxC.getContext && fxC.getContext('2d');
  var TEXT = 'QUEENS';
  if (!P || !F || !still || (still.textContent || '').trim().toUpperCase() !== TEXT) return;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var toggle = hero.querySelector('[data-spray-toggle]');
  var BLUE = '27,57,255';
  var TAU = Math.PI * 2;
  var FACE = 'Sedgwick Ave Display';
  /* the static tag's tilt on desktop; below 1024 the word shares a short band with the logo, so it lies flatter */
  var ROT = -7 * Math.PI / 180, ROT_SMALL = -3 * Math.PI / 180, tilt = ROT;

  /* GLYPHS:BEGIN - written by tools/tag-strokes.py from the font; do not edit by hand */
  var GLYPHS = {
    Q: { ink: [4, -762, 664, -74], strokes: [[420,-690,69,350,-700,66,250,-683,45,190,-662,44,165,-610,63,95,-577,31,60,-500,35,50,-410,46,60,-320,56,100,-228,66,160,-170,70,260,-140,63,360,-155,44,440,-188,45,495,-240,86,550,-290,35,572,-370,40,580,-460,49,565,-540,63,520,-610,72,460,-665,71,380,-697,67],[180,-585,59,220,-505,67,300,-420,72,380,-355,72,450,-290,72,495,-240,86,530,-212,71,580,-177,72,615,-158,73]] },
    U: { ink: [12, -794, 484, -40], strokes: [[175,-745,55,150,-665,76,130,-590,89,163,-515,50,150,-430,44,130,-355,45,98,-225,44,75,-140,59,50,-85,64,110,-110,66,220,-130,56,310,-155,56,372,-183,45,405,-225,39,424,-320,48,424,-430,58,408,-560,62,398,-650,59,405,-722,42]] },
    E: { ink: [-4, -788, 586, -12], strokes: [[150,-735,88,199,-660,90,282,-632,77,342,-607,75,402,-583,71,450,-580,61,512,-596,44,548,-610,34,574,-622,30],[199,-650,81,168,-600,46,162,-520,44,154,-420,44,150,-365,61,132,-334,57,107,-290,44,92,-200,41,82,-130,57,35,-58,40,100,-100,70,212,-106,66,312,-115,70,402,-120,74,477,-132,60,532,-128,58],[150,-362,64,212,-363,58,272,-368,60,342,-384,64,406,-402,52]] },
    N: { ink: [26, -850, 456, 6], strokes: [[40,-28,30,96,-115,39,128,-215,43,147,-355,48,175,-480,84,185,-600,76,180,-705,66,192,-805,38,200,-700,68,207,-600,78,215,-500,90,267,-440,78,310,-395,83,340,-360,108,344,-280,100,342,-185,87,338,-50,50,346,-200,90,368,-330,104,390,-420,58,392,-555,60,390,-695,64,403,-815,43]] },
    S: { ink: [-4, -788, 606, -46], strokes: [[430,-568,38,446,-612,39,460,-680,64,495,-728,64,532,-748,64,470,-712,73,400,-700,62,330,-690,66,250,-674,66,180,-655,70,140,-635,74,165,-585,56,200,-525,58,252,-470,59,332,-370,63,412,-270,66,445,-215,62,462,-160,95,500,-128,77,537,-115,73,480,-140,83,432,-140,76,360,-140,68,292,-140,68,192,-138,67,100,-137,74,55,-122,76,78,-180,77,112,-245,58]] }
  };
  /* per letter of the word: [x, y, length, width, stroke, where along it] in font units */
  var DRIPS = [[[330,-90,230,11,0,0.557]],[[140,-60,170,10,0,0.491]],[[300,-52,300,12,1,0.79]],[[450,-56,140,9,1,0.915]],[[345,-6,340,12,0,0.676]],[[230,-80,220,10,0,0.838]]];
  /* GLYPHS:END */

  var WRITE_SECONDS = 5.2, HOLD = 2.9, FADE = 1.1, REST = 0.35, JUMP = 0.1, SETTLE = 0.3;
  /* stamp radius in half-widths: solid to about 1.25 of them, the radius tools/tag-strokes.py proves covers every letter */
  var SPRAY = 1.48;

  /* seeded, so every run paints the same tag */
  var seed = 1;
  function rnd() { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }
  function gauss() { return Math.sqrt(-2 * Math.log(rnd() + 1e-6)) * Math.cos(TAU * rnd()); }

  /* Catmull-Rom through the stroke points, sampled every few font units; the half-width is carried along */
  function spline(pts) {
    var out = [];
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[Math.max(i - 1, 0)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(i + 2, pts.length - 1)];
      var n = Math.max(2, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / 4));
      for (var k = 0; k < n; k++) {
        var t = k / n, t2 = t * t, t3 = t2 * t;
        out.push([
          0.5 * (2 * p1[0] + (p2[0] - p0[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (3 * p1[0] - p0[0] - 3 * p2[0] + p3[0]) * t3),
          0.5 * (2 * p1[1] + (p2[1] - p0[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (3 * p1[1] - p0[1] - 3 * p2[1] + p3[1]) * t3),
          p1[2] + (p2[2] - p1[2]) * t
        ]);
      }
    }
    out.push(pts[pts.length - 1]);
    return out;
  }

  function offscreen(w, h) { var c = document.createElement('canvas'); c.width = Math.max(1, w); c.height = Math.max(1, h); return c; }
  function sprite(rgb, stops) {
    var c = offscreen(128, 128), x = c.getContext('2d');
    var g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    stops.forEach(function (st) { g.addColorStop(st[0], 'rgba(' + rgb + ',' + st[1] + ')'); });
    x.fillStyle = g;
    x.fillRect(0, 0, 128, 128);
    return c;
  }
  var stampC = sprite('255,255,255', [[0, 1], [0.55, 1], [0.8, 0.45], [1, 0]]);
  var glowC = sprite(BLUE, [[0, 0.42], [0.25, 0.2], [0.6, 0.06], [1, 0]]);

  /* letter origins in font units, with the font's own advances and kerning */
  var starts = null;
  function measure() {
    var m = offscreen(8, 8).getContext('2d');
    m.font = '400 1000px "' + FACE + '"';
    var out = [];
    for (var i = 0; i < TEXT.length; i++) out.push(m.measureText(TEXT.slice(0, i + 1)).width - m.measureText(TEXT[i]).width);
    return out;
  }

  var W = 0, H = 0, dpr = 1, K = 1, box = null, artC = null, covC = null, exC = null, C = null, X = null;
  var strokes = [], totalLen = 0;

  function layout() {
    W = root.clientWidth; H = root.clientHeight;
    if (!W || !H) return false;
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    [paintC, fxC].forEach(function (c) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); });
    P.setTransform(dpr, 0, 0, dpr, 0, 0);
    F.setTransform(dpr, 0, 0, dpr, 0, 0);
    var rr = root.getBoundingClientRect(), hr = hero.getBoundingClientRect();
    var head = hr.top - rr.top, heroH = H - head;
    var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity, i;
    for (i = 0; i < TEXT.length; i++) {
      var ink = GLYPHS[TEXT[i]].ink;
      x0 = Math.min(x0, starts[i] + ink[0]); x1 = Math.max(x1, starts[i] + ink[2]);
      y0 = Math.min(y0, ink[1]); y1 = Math.max(y1, ink[3]);
    }
    var desk = W >= 1024;
    tilt = desk ? ROT : ROT_SMALL;
    var cos = Math.cos(tilt), sin = Math.sin(tilt), iw = x1 - x0, ih = y1 - y0, as = Math.abs(sin);
    var bw = iw * cos + ih * as, bh = iw * as + ih * cos;
    var rect = function (el) {
      if (!el) return null;
      var r = el.getBoundingClientRect();
      return { l: r.left - rr.left, r: r.right - rr.left, t: r.top - rr.top };
    };
    /* the lowest point of the tilted word over the columns ax..bx: its outline's bottom is the left edge, then the
       bottom edge rising to the right, so the lowest point is the bottom left corner or the column nearest to it */
    var lowest = function (k, left, top, ax, bx) {
      var xtl = left, ytl = top + iw * as * k, xbl = left + ih * as * k, ybl = top + bh * k, xbr = left + bw * k, ybr = top + ih * cos * k;
      if (bx <= xtl || ax >= xbr) return -Infinity;
      var x = Math.min(Math.max(xbl, ax), bx);
      return x <= xbl ? ytl + (x - xtl) / Math.max(xbl - xtl, 1e-6) * (ybl - ytl) : ybl + (x - xbl) / Math.max(xbr - xbl, 1e-6) * (ybr - ybl);
    };
    var logo = rect(hero.querySelector('.h-hero__logo'));
    var wordW, left, top;
    if (desk) {
      /* desktop: across the top of the bridge, right of the headline; on a short window it shrinks until it clears the
         sentence's shade and the logo */
      var right = Math.max(W * 0.045, 24);
      var outline = hero.querySelector('.h-hero__line.outline');
      var minX = outline ? outline.getBoundingClientRect().right - rr.left + 8 : 0;
      var side = rect(hero.querySelector('.h-hero__side'));
      var keep = [];
      if (side) keep.push([side.l - 30, side.r + 52, side.t - 52]);
      if (logo) keep.push([logo.l, logo.r, logo.t - 10]);
      top = head + heroH * 0.015;
      wordW = Math.min(W * 0.68, heroH * 2.3, 1500, W - minX - right);
      for (var n = 0; n < 40; n++) {
        left = W - right - wordW;
        var k0 = wordW / bw, l0 = left;
        if (keep.every(function (o) { return lowest(k0, l0, top, o[0], o[1]) <= o[2]; })) break;
        wordW *= 0.97;
      }
    } else {
      /* tablets: left of the logo when a real word fits there; phones: under the logo, nearly the screen's width;
         either way it lands just above the eyebrow */
      var eb = hero.querySelector('.h-hero__eyebrow');
      var ebTop = eb ? eb.getBoundingClientRect().top - rr.top : head + heroH * 0.3;
      left = W * 0.02;
      var room = logo ? logo.l - left - 12 : 0;
      wordW = room >= W * 0.45 ? room : (W >= 760 ? W * 0.84 : W * 0.96);
      top = ebTop - 4 - wordW * bh / bw;
    }
    var k = wordW / bw, fs = k * 1000;
    K = Math.max(fs / 340, 0.34);
    /* where the ink box's top left corner lands so the tilted box starts at (left, top) */
    var ox = left - Math.min(0, iw * cos, -ih * sin, iw * cos - ih * sin) * k;
    var oy = top - Math.min(0, iw * sin, ih * cos, iw * sin + ih * cos) * k;
    var map = function (u, v) { var px = (u - x0) * k, py = (v - y0) * k; return [ox + px * cos - py * sin, oy + px * sin + py * cos]; };

    /* strokes in screen space; a stamp every fifth of the local half-width */
    strokes = []; totalLen = 0;
    var pend = [];
    for (i = 0; i < TEXT.length; i++) {
      var g = GLYPHS[TEXT[i]], base = starts[i], first = strokes.length;
      g.strokes.forEach(function (flat) {
        var pts = [];
        for (var j = 0; j < flat.length; j += 3) pts.push([flat[j] + base, flat[j + 1], flat[j + 2]]);
        var scr = spline(pts).map(function (p) { var q = map(p[0], p[1]); return [q[0], q[1], p[2] * k]; });
        var stamps = [{ x: scr[0][0], y: scr[0][1], r: scr[0][2], at: 0 }], since = 0, len = 0;
        for (j = 1; j < scr.length; j++) {
          var d = Math.hypot(scr[j][0] - scr[j - 1][0], scr[j][1] - scr[j - 1][1]);
          since += d; len += d;
          if (since >= Math.max(scr[j][2] * 0.2, 1) || j === scr.length - 1) { stamps.push({ x: scr[j][0], y: scr[j][1], r: scr[j][2], at: len }); since = 0; }
        }
        totalLen += len;
        strokes.push({ stamps: stamps, len: len, drips: [] });
      });
      (DRIPS[i] || []).forEach(function (dr) {
        var q = map(dr[0] + base, dr[1]);
        pend.push({ s: first + dr[4], frac: dr[5], x: q[0], y: q[1], len: dr[2] * k, w: Math.max(1.3, dr[3] * k) });
      });
    }
    var dripBottom = 0;
    pend.forEach(function (d) {
      var s = strokes[d.s];
      if (!s) return;
      var at = 0;
      while (at < s.stamps.length - 1 && s.stamps[at].at < d.frac * s.len) at++;
      s.drips.push({ at: at, x: d.x, y: d.y, len: d.len, w: d.w, fired: false });
      dripBottom = Math.max(dripBottom, d.y + d.len + d.w * 2);
    });

    /* the paint's box: the tilted word, its overspray and its drips, on whole device pixels */
    var pad = fs * 0.22;
    var dx0 = Math.max(0, Math.floor((left - pad) * dpr)), dy0 = Math.max(0, Math.floor((top - pad) * dpr));
    var dx1 = Math.min(paintC.width, Math.ceil((left + wordW + pad) * dpr));
    var dy1 = Math.min(paintC.height, Math.ceil(Math.max(top + bh * k + pad, dripBottom) * dpr));
    box = { dx: dx0, dy: dy0, dw: Math.max(1, dx1 - dx0), dh: Math.max(1, dy1 - dy0) };
    box.x = dx0 / dpr; box.y = dy0 / dpr; box.w = box.dw / dpr; box.h = box.dh / dpr;
    var local = function (c) { var x = c.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, -dx0, -dy0); return x; };

    /* the finished tag: the font's letters, with a soft overspray edge behind them */
    artC = offscreen(box.dw, box.dh);
    var A = local(artC);
    A.save();
    A.translate(ox, oy);
    A.rotate(tilt);
    A.font = '400 ' + fs + 'px "' + FACE + '"';
    A.textAlign = 'left';
    A.textBaseline = 'alphabetic';
    A.fillStyle = 'rgb(' + BLUE + ')';
    for (i = 0; i < TEXT.length; i++) A.fillText(TEXT[i], (starts[i] - x0) * k, -y0 * k);
    A.restore();
    var half = artC, levels = fs * dpr > 300 ? 3 : 2;
    for (i = 0; i < levels; i++) {
      var next = offscreen(Math.ceil(half.width / 2), Math.ceil(half.height / 2));
      next.getContext('2d').drawImage(half, 0, 0, next.width, next.height);
      half = next;
    }
    A.setTransform(1, 0, 0, 1, 0, 0);
    A.globalCompositeOperation = 'destination-over';
    A.globalAlpha = 0.42;
    A.drawImage(half, 0, 0, box.dw, box.dh);
    A.globalCompositeOperation = 'source-over';
    A.globalAlpha = 1;

    covC = offscreen(box.dw, box.dh); C = local(covC);
    exC = offscreen(box.dw, box.dh); X = local(exC);
    return true;
  }

  var state = 'idle', si = 0, sp = 0, pos = 0, clock = 0, live = [], flying = [], nozzle = null, nozzleOn = false, settled = false, dr = null;
  function setState(n) { state = n; root.setAttribute('data-state', n); }

  /* the area changed this frame, in CSS px */
  function touch(x0, y0, x1, y1) {
    if (!dr) { dr = [x0, y0, x1, y1]; return; }
    if (x0 < dr[0]) dr[0] = x0;
    if (y0 < dr[1]) dr[1] = y0;
    if (x1 > dr[2]) dr[2] = x1;
    if (y1 > dr[3]) dr[3] = y1;
  }
  /* what shows: the finished tag where the spray has reached, then the overspray and drips on top; only inside the changed
     area, clipped, because destination-in would otherwise clear the rest of the canvas */
  function composite() {
    if (!dr) return;
    var x0 = Math.max(box.dx, Math.floor(dr[0] * dpr)), y0 = Math.max(box.dy, Math.floor(dr[1] * dpr));
    var x1 = Math.min(box.dx + box.dw, Math.ceil(dr[2] * dpr)), y1 = Math.min(box.dy + box.dh, Math.ceil(dr[3] * dpr));
    dr = null;
    if (x1 <= x0 || y1 <= y0) return;
    var w = x1 - x0, h = y1 - y0, sx = x0 - box.dx, sy = y0 - box.dy;
    P.save();
    P.setTransform(1, 0, 0, 1, 0, 0);
    P.beginPath();
    P.rect(x0, y0, w, h);
    P.clip();
    P.clearRect(x0, y0, w, h);
    P.drawImage(artC, sx, sy, w, h, x0, y0, w, h);
    P.globalCompositeOperation = 'destination-in';
    P.drawImage(covC, sx, sy, w, h, x0, y0, w, h);
    P.globalCompositeOperation = 'source-over';
    P.drawImage(exC, sx, sy, w, h, x0, y0, w, h);
    P.restore();
  }

  function stampAt(st) {
    var r = st.r * SPRAY;
    C.globalAlpha = 0.5;
    C.drawImage(stampC, st.x - r, st.y - r, r * 2, r * 2);
    touch(st.x - r, st.y - r, st.x + r, st.y + r);
  }
  /* speckle: most lands in a band just past the letter's edge, a little flies further */
  function speckle(st, count) {
    var reach = st.r * 3.95 + 4 * K;
    touch(st.x - reach, st.y - reach, st.x + reach, st.y + reach);
    X.fillStyle = 'rgb(' + BLUE + ')';
    for (var b = 0; b < 3; b++) {
      X.globalAlpha = [0.92, 0.6, 0.32][b];
      X.beginPath();
      for (var i = 0; i < count; i++) {
        var far = rnd() < 0.16;
        var dist = st.r * (far ? 1.7 + rnd() * 2.2 : 1.02 + Math.abs(gauss()) * 0.45);
        var ang = rnd() * TAU;
        var size = (far ? 0.35 + rnd() * 0.7 : 0.4 + rnd() * 0.85) * K * 1.4;
        var px = st.x + Math.cos(ang) * dist, py = st.y + Math.sin(ang) * dist;
        X.moveTo(px + size, py);
        X.arc(px, py, size, 0, TAU);
      }
      X.fill();
    }
    X.globalAlpha = 1;
  }

  function wipe(ctx) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); ctx.restore(); }

  function beginRun() {
    seed = 7331;
    wipe(C); wipe(X);
    P.clearRect(0, 0, W, H);
    paintC.style.opacity = '1';
    live = []; flying = []; settled = false; dr = null;
    si = 0; sp = 0; pos = 0; clock = 0;
    strokes.forEach(function (s) { s.drips.forEach(function (d) { d.fired = false; }); });
    var s0 = strokes[0].stamps[0];
    nozzle = [s0.x, s0.y, s0.r];
    setState('write');
  }

  function fireDrips(s, from, to) {
    s.drips.forEach(function (d) {
      if (!d.fired && d.at >= from && d.at <= to) {
        d.fired = true;
        live.push({ x: d.x, y: d.y, len: d.len, w: d.w, cur: 0, t: 0, wob: (rnd() - 0.5) * 0.05 });
      }
    });
  }

  function growDrips(dt) {
    X.strokeStyle = 'rgb(' + BLUE + ')';
    X.lineCap = 'round';
    X.globalAlpha = 1;
    live.forEach(function (d) {
      d.t += dt;
      var next = d.len * (1 - Math.exp(-d.t / 1.15));
      if (next - d.cur < 0.35) return;
      X.lineWidth = d.w * (1 - 0.34 * (d.cur / d.len));
      X.beginPath();
      X.moveTo(d.x + d.wob * d.cur, d.y + d.cur);
      X.lineTo(d.x + d.wob * next, d.y + next);
      X.stroke();
      touch(d.x + d.wob * next - d.w - 2, d.y + d.cur - d.w - 2, d.x + d.wob * d.cur + d.w + 2, d.y + next + d.w + 2);
      d.cur = next;
    });
  }

  function step(dt) {
    clock += dt;
    if (state === 'write') {
      /* the nozzle's place along the stroke is continuous; a stamp lands once the nozzle has passed it */
      var s = strokes[si];
      var pace = 0.72 + 0.46 * Math.sin(Math.PI * Math.min(pos / Math.max(s.len, 1), 1));
      pos += totalLen / WRITE_SECONDS * pace * dt;
      var end = sp - 1;
      while (end < s.stamps.length - 1 && s.stamps[end + 1].at <= pos) end++;
      for (var i = sp; i <= end; i++) {
        stampAt(s.stamps[i]);
        if (i % 2 === 0) speckle(s.stamps[i], 4);
      }
      if (end >= sp) {
        var e = s.stamps[end];
        nozzle = [e.x, e.y, e.r];
        fireDrips(s, sp, end);
        for (var f = 0; f < 5; f++) {
          var a = rnd() * TAU, v = (70 + rnd() * 230) * K;
          flying.push({ x: e.x, y: e.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.16 + rnd() * 0.26, t: 0, r: (0.5 + rnd() * 1.1) * K * 1.4 });
        }
        sp = end + 1;
      }
      nozzleOn = true;
      if (sp >= s.stamps.length) {
        nozzleOn = false; clock = 0; sp = 0; pos = 0; si++;
        setState(si >= strokes.length ? 'hold' : 'jump');
      }
    } else if (state === 'jump') {
      var t0 = strokes[si].stamps[0];
      var q = Math.min(clock / JUMP, 1);
      nozzle = [nozzle[0] + (t0.x - nozzle[0]) * q, nozzle[1] + (t0.y - nozzle[1]) * q, t0.r];
      if (q >= 1) { clock = 0; setState('write'); }
    } else if (state === 'hold') {
      /* any sliver the nozzle missed settles in, so the finished tag is exactly the font */
      if (!settled) {
        C.globalAlpha = clock >= SETTLE ? 1 : 0.2;
        C.fillStyle = '#fff';
        C.fillRect(box.x, box.y, box.w, box.h);
        C.globalAlpha = 1;
        touch(box.x, box.y, box.x + box.w, box.y + box.h);
        if (clock >= SETTLE) settled = true;
      }
      if (clock > HOLD) { clock = 0; setState('fade'); }
    } else if (state === 'fade') {
      paintC.style.opacity = String(Math.max(1 - clock / FADE, 0));
      if (clock > FADE) { clock = 0; live = []; setState('rest'); }
    } else if (state === 'rest') {
      if (clock > REST) beginRun();
    }
    growDrips(dt);
    composite();
  }

  function drawFx(dt) {
    F.clearRect(0, 0, W, H);
    /* mist at the nozzle */
    if (nozzleOn && nozzle) {
      var g = nozzle[2] * 3.4;
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
  }

  /* the finished tag at once, for reduced motion */
  function paintAll() {
    seed = 7331;
    wipe(C); wipe(X);
    P.clearRect(0, 0, W, H);
    paintC.style.opacity = '1';
    C.fillStyle = '#fff';
    C.fillRect(box.x, box.y, box.w, box.h);
    X.strokeStyle = 'rgb(' + BLUE + ')';
    X.lineCap = 'round';
    strokes.forEach(function (s) {
      s.stamps.forEach(function (st, i) { if (i % 2 === 0) speckle(st, 4); });
      s.drips.forEach(function (d) {
        X.globalAlpha = 1; X.lineWidth = d.w;
        X.beginPath(); X.moveTo(d.x, d.y); X.lineTo(d.x, d.y + d.len); X.stroke();
      });
    });
    dr = null;
    touch(box.x, box.y, box.x + box.w, box.y + box.h);
    composite();
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
    starts = measure();
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

  /* the letters must be the font's, so nothing starts until the face has loaded; if it never does, the static tag stays.
     The phone layout reads the eyebrow's position, so it also waits for the other fonts. */
  if (!document.fonts || !document.fonts.load) return;
  var face = document.fonts.load('400 100px "' + FACE + '"', TEXT).then(function (faces) {
    return !!(faces && faces.length) && faces.every(function (f) { return f.status === 'loaded'; });
  }, function () { return false; });
  Promise.all([face, document.fonts.ready.then(null, function () {})]).then(function (r) {
    if (!r[0]) return;
    lastW = root.clientWidth;
    boot();
    window.addEventListener('resize', onResize);
  });
})();
