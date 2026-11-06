// shell.mjs: the page chrome and the shared components of "Night Piece" (FOUNDATION).
// Exports and the page() signature are FIXED (every lane calls them):
//   page({ ctx, path, title, description, canonical, og, jsonld, bodyClass, main, crumbs, heroCrumbs, scripts, preload })
//     main        the <main> INNER html (page() wraps it in <main id="main">)
//     crumbs      [{ label, href }] or [[href, label]], last = current page. Printed in a slim bar under the header unless
//                 heroCrumbs is true (then the template prints crumbsHtml(crumbs) in its own hero). BreadcrumbList JSON-LD is automatic.
//     og          { title, description, type, image, url }; jsonld object or array; scripts extra file names under /assets/js/;
//     preload     [{ href, as, type, media, imagesrcset, imagesizes, fetchpriority, crossorigin }]
//   crumbsHtml(crumbs)
//   icon(name, cls)           ext chev menu close pin clock bag truck user cart search arrow tag id plus minus phone mail play pause up instagram facebook tiktok
//   logoHtml(ctx, { on: 'dark'|'photo', cls, eager, link = true, sizes })   on: 'photo' = the bone file; link: false = <span>
//   hoursHtml(ctx, cls)       <dl class="hours"> of site.hours
//   drip({ w, h, color, cls, seed, run = true })   inline SVG paint run; run: paint grows downward on scroll. Deterministic.
//   mark(word)                raw html word in .mark with the hand-drawn underline
//   tag(text, { color: 'blue'|'orange', cls, depth, wipe = true })          aria-hidden hand tag, position:absolute behind the copy
//   spray(name, { cls, depth, wipe = true, sizes })                         overspray: orange-1 orange-2 blue-1 blue-2
//   ytCard(video, { h = 3 })  click-to-load video facade with the title as visible text
//   pcard(ctx, product, { h = 3, eager, sizes })   ccard(ctx, cat, { h = 3, sizes })
//   ctaBand(ctx, { kicker, title, text, buttons, paint, cls, id, h = 2 })   buttons [{ label, href, cls }] or [[href, label]]
//   loopVideo(ctx, id, { cls, phone = true, eager })   muted loop: poster first, plays on screen; phone:false = poster only under 760 px
//   CSS_ORDER
// Backdrops: put every wall layer in .band__clip. The first section of <main> bleeds its .band__clip up under the frosted
// header by itself (shell.css), so a hero photo sits behind the glass with no extra markup and no layout change.
// Every word in the chrome comes from ctx.site / ctx.ia, or is a neutral label (Menu, Close menu, Get directions, Previous, Next).
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../lib/paths.mjs';
import { imageSize } from '../lib/images.mjs';
import { dePunct } from '../lib/punct.mjs';
import { esc, escA, attrs, href, linkAttrs, absUrl, gimg, hasGenerated, img, photo } from './util.mjs';

export const CSS_ORDER = ['fonts', 'tokens', 'base', 'components', 'motion', 'shell', 'home', 'shop', 'pages', 'resources', 'mobile', 'fix'];

// ---------- icons ----------
const ICONS = {
  ext: '<path d="M7 17 17 7"/><path d="M8 7h9v9"/>',
  chev: '<path d="m6 9 6 6 6-6"/>',
  menu: '<path d="M4 7h16"/><path d="M4 12h16"/><path d="M9 17h11"/>',
  close: '<path d="M6 6l12 12"/><path d="M18 6 6 18"/>',
  pin: '<path d="M19 10c0 5.6-7 11-7 11s-7-5.4-7-11a7 7 0 0 1 14 0Z"/><circle cx="12" cy="10" r="2.6"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  bag: '<path d="M5.5 8h13l-1 12.5h-11L5.5 8Z"/><path d="M9 8V7a3 3 0 0 1 6 0v1"/>',
  truck: '<path d="M2.5 6.5h11v9.5h-11z"/><path d="M13.5 10h4l3 3.2V16h-7"/><circle cx="6.5" cy="17.5" r="1.7"/><circle cx="17" cy="17.5" r="1.7"/>',
  user: '<circle cx="12" cy="8" r="3.8"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/>',
  cart: '<path d="M3 4h2.2l2.3 11h10.3L20 7.5H6.4"/><circle cx="9.2" cy="19" r="1.4"/><circle cx="16.6" cy="19" r="1.4"/>',
  search: '<circle cx="10.8" cy="10.8" r="6.6"/><path d="m20 20-4.4-4.4"/>',
  arrow: '<path d="M4.5 12h15"/><path d="m13 5.5 6.5 6.5-6.5 6.5"/>',
  tag: '<path d="M12.6 2.8H4.8a2 2 0 0 0-2 2v7.8l8.6 8.6a2.2 2.2 0 0 0 3.1 0l6.7-6.7a2.2 2.2 0 0 0 0-3.1Z"/><circle cx="8" cy="8" r="1.3"/>',
  id: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="12" r="2.2"/><path d="M14 10h4M14 14h4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  phone: '<path d="M5 3.5h3.6l1.8 4.6-2.4 1.6a11 11 0 0 0 6.3 6.3l1.6-2.4 4.6 1.8V19a1.8 1.8 0 0 1-1.9 1.8A16.5 16.5 0 0 1 3.2 5.4 1.8 1.8 0 0 1 5 3.5Z"/>',
  mail: '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="m3.5 7 8.5 6.5L20.5 7"/>',
  up: '<path d="M12 19V5"/><path d="m6 11 6-6 6 6"/>',
  play: '<path d="M8 5.5v13l10-6.5Z" fill="currentColor"/>',
  pause: '<path d="M8.5 5.5v13M15.5 5.5v13" stroke-width="2.6"/>',
  instagram: '<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="0.9" fill="currentColor"/>',
  facebook: '<path d="M14 21v-7.5h2.7l.5-3.3H14V8.1c0-1 .4-1.7 1.8-1.7h1.5V3.5c-.7-.1-1.6-.2-2.5-.2-2.6 0-4.3 1.5-4.3 4.4v2.5H7.6v3.3h2.9V21"/>',
  tiktok: '<path d="M14 3.5v11.6a3.4 3.4 0 1 1-3.4-3.4"/><path d="M14 3.5c.4 2.7 2.3 4.6 5.2 4.8"/>',
};
export function icon(name, cls = '') {
  return `<svg class="ico${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONS[name] || ICONS.arrow}</svg>`;
}

// ---------- small helpers ----------
const t = (s) => dePunct(String(s ?? ''));  // ia.json is not dash-normalised at load: every ia string goes through this
const pathOf = (h) => href(String(h || '')).split('#')[0].split('?')[0];
const isCur = (h, p) => !!h && !/^(https?:)?\/\//i.test(h) && !String(h).includes('#') && pathOf(h) === p;
const cur = (h, p) => (isCur(h, p) ? ' aria-current="page"' : '');
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const exists = (rel) => fs.existsSync(path.join(ROOT, rel));
// a heading or line a lane hands over: plain text is escaped, text that already holds markup or an entity is trusted
const rich = (s) => (/<[a-z][^>]*>|&[a-z#0-9]+;/i.test(String(s ?? '')) ? String(s) : esc(s));

// ---------- breadcrumbs: [{ label, href }] or [[href, label]]; the separator "/" is drawn by CSS ----------
const crumbParts = (c) => (Array.isArray(c) ? { href: c[0], label: c[1] } : c || {});
export function crumbsHtml(crumbs = []) {
  if (!crumbs || !crumbs.length) return '';
  return `<nav class="crumbs" aria-label="Breadcrumb"><ol>${crumbs.map((raw, i) => {
    const c = crumbParts(raw);
    return `<li>${i < crumbs.length - 1 && c.href ? `<a${linkAttrs(c.href)}>${esc(c.label)}</a>` : `<span aria-current="page">${esc(c.label)}</span>`}</li>`;
  }).join('')}</ol></nav>`;
}

// ---------- logo: the client's script logo, orange; the bone file for photo moments ----------
let LOGO_SIZE;
const logoSize = () => {
  if (LOGO_SIZE) return LOGO_SIZE;
  try { LOGO_SIZE = imageSize(fs.readFileSync(path.join(ROOT, 'assets/brand/bridge-logo-220.webp'))); } catch { /* size stays the known ratio */ }
  LOGO_SIZE = LOGO_SIZE || { w: 220, h: 134 };
  return LOGO_SIZE;
};
export function logoHtml(ctx, { on = 'dark', cls = '', eager = false, link = true, sizes = '(max-width: 1023px) 84px, 92px', current = false } = {}) {
  const name = ctx.site.name;
  const bone = on === 'photo' || on === 'bone';
  const set = bone ? [[440, 'bone-440'], [880, 'bone-880']] : [[220, '220'], [440, '440'], [880, '880'], [1600, '1600']];
  const { w, h } = logoSize();
  const im = `<img${attrs({
    class: 'logo__img',
    src: `/assets/brand/bridge-logo-${set[0][1]}.webp`,
    srcset: set.map(([sw, f]) => `/assets/brand/bridge-logo-${f}.webp ${sw}w`).join(', '),
    sizes, width: w, height: h, alt: link ? '' : name, decoding: 'async',
    ...(eager ? { loading: 'eager', fetchpriority: 'high' } : { loading: 'lazy' }),
  })}>`;
  const c = `logo${cls ? ' ' + cls : ''}`;
  if (!link) return `<span class="${c}">${im}</span>`;
  return `<a class="${c}"${linkAttrs('/')} aria-label="${escA(name)} home"${current ? ' aria-current="page"' : ''}>${im}</a>`;
}

// ---------- hours ----------
export function hoursHtml(ctx, cls = '') {
  return `<dl class="hours${cls ? ' ' + cls : ''}">${(ctx.site.hours || []).map((r) => `<div class="hours__row"><dt>${esc(r.days)}</dt><dd>${esc(r.time)}</dd></div>`).join('')}</dl>`;
}

// ---------- paint ----------
// drip(): a thin run of paint along the top edge with fingers hanging off it. Deterministic from w, h, seed.
export function drip({ w = 420, h = 180, color = 'var(--orange)', cls = '', seed = 1, run = true } = {}) {
  let s = (Math.abs(Math.round(seed * 7919 + w * 31 + h * 17)) % 233279) + 1;
  const r = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  const n1 = (x) => Number(x.toFixed(1));
  const count = Math.max(2, Math.min(8, Math.round(w / 95)));
  const base = Math.max(5, Math.min(14, h * 0.07));
  const fingers = [];
  for (let i = 0; i < count; i++) {
    const x = ((i + 0.5 + (r() - 0.5) * 0.62) / count) * w;
    const fw = Math.max(5, Math.min(13, w / 42)) * (0.72 + r() * 0.62);
    const long = (i + Math.round(seed)) % 3 === 1;
    const len = h * (long ? 0.72 + r() * 0.26 : 0.2 + r() * 0.34);
    fingers.push({ x, fw, len: Math.max(base + fw * 3, len) });
  }
  let d = `M0 0H${w}C${n1(w - w * 0.03)} ${n1(base * 0.3)} ${n1(w - w * 0.05)} ${n1(base)} ${n1(w - w * 0.09)} ${n1(base)}`;
  let hi = '';
  let drop = '';
  for (const f of fingers.slice().sort((a, b) => b.x - a.x)) {
    const R = f.x + f.fw / 2, L = f.x - f.fw / 2, sh = f.fw * 0.95, b = base * (0.82 + r() * 0.36), y = f.len, bulge = f.fw * 0.22;
    d += `L${n1(R + sh)} ${n1(b)}Q${n1(R)} ${n1(b)} ${n1(R)} ${n1(b + sh)}L${n1(R - 0.4)} ${n1(y - f.fw * 1.25)}`;
    d += `C${n1(R + bulge)} ${n1(y - f.fw * 0.65)} ${n1(R + bulge)} ${n1(y)} ${n1(f.x)} ${n1(y)}C${n1(L - bulge)} ${n1(y)} ${n1(L - bulge)} ${n1(y - f.fw * 0.65)} ${n1(L + 0.4)} ${n1(y - f.fw * 1.25)}`;
    d += `L${n1(L)} ${n1(b + sh)}Q${n1(L)} ${n1(b)} ${n1(L - sh)} ${n1(b)}`;
    if (y > h * 0.6) {
      hi += `<path d="M${n1(f.x - f.fw * 0.16)} ${n1(b + sh * 1.2)}L${n1(f.x - f.fw * 0.16)} ${n1(y - f.fw * 1.2)}"/>`;
      if (!drop && y + f.fw * 2.4 < h) drop = `<ellipse cx="${n1(f.x)}" cy="${n1(y + f.fw * 1.5)}" rx="${n1(f.fw * 0.26)}" ry="${n1(f.fw * 0.42)}" fill="currentColor"/>`;
    }
  }
  d += `L${n1(w * 0.09)} ${n1(base)}C${n1(w * 0.05)} ${n1(base)} ${n1(w * 0.03)} ${n1(base * 0.3)} 0 0Z`;
  return `<svg class="drip${cls ? ' ' + cls : ''}" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" style="color:${escA(color)}" aria-hidden="true" focusable="false"${run ? ' data-reveal="drip"' : ''}><path d="${d}" fill="currentColor"/>${drop}<g fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="1.4" stroke-linecap="round">${hi}</g></svg>`;
}

const MARK_LINES = [
  'M3 13.5C38 7.6 74 5.2 118 6.6c44 1.3 91 5 118 4.1 25-.8 43-2.8 61-4.7',
  'M2 8.5c41-3.7 79 3.8 124 3.9 47 .1 88-7.2 121-6.6 20 .3 36 2.2 51 4.8',
  'M4 11c31-5.6 78-5.3 113-3.6 56 2.7 92 6.1 134 3.3 17-1.1 32-2.8 46-5.2',
];
let markN = 0;
export function mark(word) {
  const d = MARK_LINES[markN++ % MARK_LINES.length];
  return `<span class="mark">${word}<svg class="mark__line" viewBox="0 0 300 18" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path pathLength="1" d="${d}"/></svg></span>`;
}

export function tag(text, { color = 'blue', cls = '', depth, wipe = true } = {}) {
  return `<span class="tag tag--${escA(color)}${cls ? ' ' + cls : ''}" aria-hidden="true"${wipe ? ' data-spray' : ''}${depth != null ? ` data-depth="${escA(depth)}"` : ''}>${esc(text)}</span>`;
}

// overspray image from the paint kit; while a file is missing, a CSS burst of the same box keeps the layout
export function spray(name, { cls = '', depth, wipe = true, sizes = '(max-width: 767px) 110vw, 60vw' } = {}) {
  const file = `paint/spray-${name}.webp`;
  const a = { ...(wipe ? { 'data-spray': true } : {}), ...(depth != null ? { 'data-depth': depth } : {}), 'aria-hidden': 'true' };
  const c = `spray spray--${/blue/.test(name) ? 'blue' : 'orange'}${cls ? ' ' + cls : ''}`;
  if (!exists('assets/photos/' + file)) return `<span class="${c} spray--css"${attrs(a)}></span>`;
  return img({ src: '/assets/photos/' + file, alt: '' }, { alt: '', sizes, cls: c, attrs: a });
}

// ---------- autoplay loop: poster first, plays only on screen (site.js), paused on its poster under reduced motion ----------
export function loopVideo(ctx, id, { cls = '', phone = true, eager = false } = {}) {
  const raw = ((ctx.images || {}).media || {})[id];
  const m = typeof raw === 'string' ? { src: raw } : raw || {};
  const url = (u) => (!u ? '' : String(u).startsWith('/') ? String(u) : '/assets/media/' + u);
  const src = url(m.src || m.mp4 || m.file || m.video);
  const sm = url(m.sm || m.small || m.phone || m.mp4Sm);
  const poster = url(m.poster || m.still);
  if (!src || !exists(src.slice(1))) return `<span class="loop loop--empty${cls ? ' ' + cls : ''}" aria-hidden="true"></span>`;
  const sources = phone
    ? `${sm && exists(sm.slice(1)) ? `<source src="${escA(sm)}" media="(max-width: 759px)" type="video/mp4">` : ''}<source src="${escA(src)}" type="video/mp4">`
    : `<source src="${escA(src)}" media="(min-width: 760px)" type="video/mp4">`;
  const vid = `<video class="loop__v${cls ? ' ' + cls : ''}" muted loop playsinline disablepictureinpicture disableremoteplayback preload="${eager ? 'auto' : 'none'}"${poster && exists(poster.slice(1)) ? ` poster="${escA(poster)}"` : ''} aria-hidden="true" tabindex="-1" data-loop${eager ? ' data-eager' : ''}${phone ? '' : ' data-no-phone'}>${sources}</video>`;
  return `${vid}<button class="loop-toggle${phone ? '' : ' loop-toggle--no-phone'}" type="button" data-loop-toggle aria-pressed="false" aria-label="Pause motion">${icon('pause', 'loop-toggle__pause')}${icon('play', 'loop-toggle__play')}</button>`;
}

// ---------- cards ----------
export function ytCard(v, { h = 3 } = {}) {
  const H = `h${h}`;
  const id = String(v.id);
  const watch = `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`;
  const thumb = `assets/photos/yt/${id}.jpg`;
  const pic = exists(thumb) ? img({ src: '/' + thumb, alt: '' }, { alt: '', cls: 'ytcard__img', sizes: '(max-width: 767px) 92vw, (max-width: 1279px) 46vw, 420px' }) : '<span class="ytcard__img ytcard__img--none"></span>';
  return `<article class="ytcard" data-yt="${escA(id)}" data-yt-title="${escA(v.title)}">
<a class="ytcard__media"${linkAttrs(watch)} aria-label="Play video: ${escA(v.title)}">${pic}<span class="ytcard__play" aria-hidden="true">${icon('play')}</span></a>
<${H} class="ytcard__title">${esc(v.title)}</${H}>
</article>`;
}

export function pcard(ctx, p, { h = 3, eager = false, sizes = '(max-width: 767px) 46vw, 300px' } = {}) {
  const H = `h${h}`;
  const cutFile = p.cut && exists('assets/photos/cut/' + p.cut) ? 'cut/' + p.cut : p.cut || p.id + '.webp';
  const pic = photo(ctx, cutFile, { alt: p.title, sizes, cls: 'cut pcard__img', eager });
  return `<article class="pcard" data-cat="${escA(p.cat || '')}">
<a class="pcard__media"${linkAttrs(p.url)} tabindex="-1" aria-hidden="true">${pic}</a>
<div class="pcard__body glass glass--lift">
<span class="chip pcard__tag">${esc(p.tag)}</span>
<${H} class="pcard__name"><a${linkAttrs(p.url)}>${esc(p.title)}</a></${H}>
<div class="pcard__foot"><p class="pcard__price">${esc(p.price)}</p><a class="pcard__add btn btn--paint btn--sm"${linkAttrs(p.url)}>ADD TO CART</a></div>
</div>
</article>`;
}

export function ccard(ctx, c, { h = 3, sizes = '(max-width: 767px) 92vw, (max-width: 1279px) 46vw, 440px' } = {}) {
  const H = `h${h}`;
  const pic = c.photo ? photo(ctx, c.photo, { alt: '', sizes, cls: 'ccard__img' }) : gimg(c.gen, { alt: '', sizes, cls: 'ccard__img' });
  return `<article class="ccard">
<div class="ccard__media">${pic}</div>
<div class="ccard__body">
<${H} class="ccard__label"><a${linkAttrs('/shop/' + c.slug + '/')}>${esc(c.label)}</a></${H}>
<p class="ccard__text">${esc(c.text)}</p>
<a class="ccard__go link-arrow"${linkAttrs(c.store)}>Shop Now${icon('arrow')}</a>
</div>
</article>`;
}

// ---------- closing band: a smoked pane sliding over a hand tag and a burst of overspray ----------
export function ctaBand(ctx, { kicker = '', title = '', text = '', buttons = [], paint = 'CONNECTED', cls = '', id = '', h = 2, color = 'blue' } = {}) {
  const H = `h${h}`;
  const list = (buttons && buttons.length ? buttons : [{ label: t(ctx.ia.cta.label), href: ctx.ia.cta.href }]).map((b) => (Array.isArray(b) ? { href: b[0], label: b[1], cls: b[2] } : b));
  const btns = list.map((b, i) => `<a class="btn ${b.cls || (i === 0 ? 'btn--paint' : 'btn--ghost')}"${linkAttrs(b.href)}>${esc(b.label)}${icon(b.icon || 'arrow')}</a>`).join('');
  const bg = hasGenerated('g-wall-night') || process.env.ALLOW_MISSING_GEN === '1' ? gimg('g-wall-night', { alt: '', cls: 'band__bg', sizes: '100vw' }) : '';
  return `<section class="band band--beam cta-band${cls ? ' ' + cls : ''}"${id ? ` id="${escA(id)}"` : ''}>
<div class="band__clip" aria-hidden="true">${bg}${loopVideo(ctx, 'loop-mist', { cls: 'band__bg screen', phone: false })}</div>
${spray('orange-1', { cls: 'cta-band__burst', depth: 0.1 })}
${paint ? tag(paint, { color, cls: 'cta-band__tag', depth: -0.08 }) : ''}
<div class="wrap cta-band__in">
<div class="glass glass--lit cta-band__pane" data-reveal>
${kicker ? `<p class="kicker">${rich(kicker)}</p>` : ''}
<${H} class="display cta-band__title">${rich(title)}</${H}>
${text ? `<p class="lede">${rich(text)}</p>` : ''}
<div class="btn-row">${btns}</div>
</div>
</div>
</section>`;
}

// ---------- mega menus (from 1024 px) / accordions in the drawer (below it) ----------
const MEGA_FALLBACK = { 'h-mega-explore': 'g-bud-key', 'h-mega-resources': 'g-wall-night' };
const megaLinkList = (ctx, g) => (g.links === 'brands' ? (ctx.site.brands || []).map((b) => [b.url, b.name]) : g.links || []);
function megaGroup(ctx, g, p) {
  const s = ctx.site;
  let body;
  if (g.hours) {
    body = `${hoursHtml(ctx, 'hours--sm')}${s.hoursNote ? `<p class="mega__note">${esc(s.hoursNote)}</p>` : ''}`;
  } else if (g.address) {
    body = `<address class="mega__addr">
<a${linkAttrs(s.map.directions)}>${icon('pin')}<span>${esc(s.address.oneLine)}</span></a>
<a${linkAttrs(s.phone.tel)}>${icon('phone')}<span>${esc(s.phone.display)}</span></a>
</address>
<a class="link-arrow mega__dir"${linkAttrs(s.map.directions)}>Get directions${icon('arrow')}</a>`;
  } else {
    body = `<ul class="mega__links">${megaLinkList(ctx, g).map(([u, label]) => `<li><a class="mega__link"${linkAttrs(u)}${cur(u, p)}>${esc(t(label))}</a></li>`).join('')}</ul>`;
  }
  return `<div class="mega__group mega__group--${slug(g.group)}"><p class="mega__h">${esc(t(g.group))}</p>${body}</div>`;
}
function megaCard(f) {
  const id = hasGenerated(f.image) ? f.image : MEGA_FALLBACK[f.image] || f.image;
  return `<a class="mega__card"${linkAttrs(f.href)}>
<span class="mega__media">${gimg(id, { alt: '', sizes: '(min-width: 1024px) 320px, 1px', cls: 'mega__img' })}</span>
<span class="mega__card-body"><span class="mega__card-t">${esc(t(f.title))}</span><span class="mega__card-l">${esc(t(f.line))}</span></span>
<span class="mega__card-go" aria-hidden="true">${icon('arrow')}</span>
</a>`;
}
function navHtml(ctx, p) {
  const ia = ctx.ia;
  const s = ctx.site;
  const u = ia.utility || {};
  const items = (ia.nav || []).map((it) => {
    const label = esc(t(it.label));
    if (!it.mega) return `<li class="nav__item${isCur(it.href, p) ? ' is-current' : ''}"><div class="nav__row"><a class="nav__link"${linkAttrs(it.href)}${cur(it.href, p)}>${label}</a></div></li>`;
    const pid = 'mega-' + it.key;
    const owns = isCur(it.href, p) || it.mega.some((g) => megaLinkList(ctx, g).some(([x]) => isCur(x, p)));
    const row = it.href
      ? `<a class="nav__link"${linkAttrs(it.href)}${cur(it.href, p)}>${label}</a><button class="nav__more" type="button" aria-expanded="false" aria-controls="${pid}" data-dropdown-trigger>${icon('chev')}<span class="sr-only">${label} menu</span></button>`
      : `<button class="nav__link nav__link--btn" type="button" aria-expanded="false" aria-controls="${pid}" data-dropdown-trigger><span>${label}</span>${icon('chev')}</button>`;
    return `<li class="nav__item has-panel${owns ? ' is-current' : ''}" data-dropdown>
<div class="nav__row">${row}</div>
<div class="mega mega--${escA(it.key)}" id="${pid}" data-dropdown-panel>
<div class="mega__panel glass glass--strong"><div class="mega__scroll">
<div class="mega__feature">${it.feature ? megaCard(it.feature) : ''}</div>
<div class="mega__groups">${it.mega.map((g) => megaGroup(ctx, g, p)).join('')}</div>
</div></div>
</div>
</li>`;
  }).join('\n');
  return `<nav class="nav" id="site-nav" aria-label="Main" data-nav>
<div class="nav__drawer-head">${logoHtml(ctx)}<button class="nav__close" type="button" data-nav-close>${icon('close')}<span class="sr-only">Close menu</span></button></div>
<ul class="nav__list">
${items}
</ul>
<div class="nav__drawer-foot">
<a class="btn btn--paint nav__cta"${linkAttrs(ia.cta.href)}>${esc(t(ia.cta.label))}${icon('arrow')}</a>
${u.promo ? `<p class="nav__promo">${esc(t(u.promo.text))}</p>` : ''}
<ul class="nav__util">
${u.pickup ? `<li><a${linkAttrs(u.pickup.href)}>${icon('pin')}<span>${esc(t(u.pickup.label))} <strong>${esc(t(u.pickup.value))}</strong></span></a></li>` : ''}
${u.delivery ? `<li><a${linkAttrs(u.delivery.href)}>${icon('truck')}<span>${esc(t(u.delivery.label))}</span></a></li>` : ''}
${u.account ? `<li><a${linkAttrs(u.account.href)}>${icon('user')}<span>${esc(t(u.account.label))}</span></a></li>` : ''}
<li><a${linkAttrs(s.phone.tel)}>${icon('phone')}<span>${esc(s.phone.display)}</span></a></li>
</ul>
</div>
</nav>`;
}

function utilHtml(ctx) {
  const u = ctx.ia.utility || {};
  return `<div class="util">
<div class="util__in">
${u.promo ? `<p class="util__promo"><span>${esc(t(u.promo.text))}</span><a class="util__cta"${linkAttrs(u.promo.href)}>${esc(t(u.promo.cta))}${icon('arrow')}</a></p>` : ''}
<ul class="util__links">
${u.pickup ? `<li><a class="util__link"${linkAttrs(u.pickup.href)}>${icon('pin')}<span>${esc(t(u.pickup.label))} <strong>${esc(t(u.pickup.value))}</strong></span></a></li>` : ''}
${u.delivery ? `<li><a class="util__link"${linkAttrs(u.delivery.href)}>${icon('truck')}<span>${esc(t(u.delivery.label))}</span></a></li>` : ''}
${u.account ? `<li><a class="util__link"${linkAttrs(u.account.href)}>${icon('user')}<span>${esc(t(u.account.label))}</span></a></li>` : ''}
</ul>
</div>
</div>`;
}

function headerHtml(ctx, p) {
  return `<header class="site-header" data-header>
${utilHtml(ctx)}
<div class="mainbar">
${logoHtml(ctx, { eager: true, current: p === '/', cls: 'mainbar__logo' })}
${navHtml(ctx, p)}
<div class="header-tools">
<a class="btn btn--paint btn--sm header-cta"${linkAttrs(ctx.ia.cta.href)}>${esc(t(ctx.ia.cta.label))}${icon('arrow')}</a>
<button class="nav-toggle" type="button" aria-controls="site-nav" aria-expanded="false" data-nav-toggle>${icon('menu')}<span class="sr-only">Menu</span></button>
</div>
</div>
</header>
<div class="nav-scrim" data-nav-scrim hidden></div>`;
}

// ---------- footer ----------
function footerHtml(ctx, p) {
  const s = ctx.site;
  const f = ctx.ia.footer || {};
  const socials = [['instagram', 'Instagram'], ['facebook', 'Facebook'], ['tiktok', 'TikTok']].filter(([k]) => s.social && s.social[k]);
  const col = (c) => {
    if (c.contact) {
      return `<div class="footer__col footer__contact">
<h2 class="footer__h">${esc(t(c.title))}</h2>
<address class="footer__addr">
<a${linkAttrs(s.map.directions)}>${icon('pin')}<span>${esc(s.address.oneLine)}</span></a>
<a${linkAttrs(s.phone.tel)}>${icon('phone')}<span>${esc(s.phone.display)}</span></a>
</address>
<div class="footer__hours">${icon('clock')}<div>${hoursHtml(ctx, 'hours--sm')}${s.hoursNote ? `<p class="footer__note">${esc(s.hoursNote)}</p>` : ''}</div></div>
<ul class="footer__social">${socials.map(([k, label]) => `<li><a${linkAttrs(s.social[k])} aria-label="${escA(label)}">${icon(k)}</a></li>`).join('')}</ul>
</div>`;
    }
    return `<div class="footer__col"><h2 class="footer__h">${esc(t(c.title))}</h2><ul class="footer__links">${(c.links || []).map(([u, label]) => `<li><a${linkAttrs(u)}${cur(u, p)}>${esc(t(label))}</a></li>`).join('')}</ul></div>`;
  };
  const word = esc(String(s.name).toUpperCase());
  return `<footer class="site-footer">
<div class="footer__drips" aria-hidden="true">${drip({ w: 560, h: 250, seed: 2, cls: 'footer__drip footer__drip--a' })}${drip({ w: 300, h: 170, seed: 5, color: 'var(--orange-deep)', cls: 'footer__drip footer__drip--b' })}</div>
<div class="footer__mark" aria-hidden="true" data-footer-light><span class="footer__word"><span class="footer__word-t">${word}</span><span class="footer__strip"></span></span></div>
<div class="wrap wrap--wide footer__inner">
<div class="footer__top">
<div class="footer__brand">${logoHtml(ctx, { cls: 'footer__logo', sizes: '132px' })}<p class="footer__tagline">${esc(s.tagline)}</p></div>
<div class="footer__cols">
${(f.columns || []).map(col).join('\n')}
</div>
</div>
<div class="footer__bottom">
<p class="footer__disclaimer">${esc(s.disclaimer)}</p>
<ul class="footer__legal">${(f.legal || []).map(([u, label]) => `<li><a${linkAttrs(u)}${cur(u, p)}>${esc(t(label))}</a></li>`).join('')}</ul>
</div>
</div>
</footer>`;
}

// ---------- 21+ gate (D7): hidden in the HTML; the head script shows it before first paint unless the key is set ----------
function gateHtml(ctx) {
  const g = ctx.site.ageGate || {};
  return `<div class="age-gate" data-age-gate data-age-key="${escA(ctx.site.ageKey)}" hidden>
<div class="age-gate__burst" aria-hidden="true"></div>
<div class="age-gate__pane glass glass--strong" role="dialog" aria-modal="true" aria-labelledby="age-gate-t" aria-describedby="age-gate-p">
${logoHtml(ctx, { link: false, cls: 'age-gate__logo', sizes: '168px' })}
<div class="age-gate__ask" data-age-ask>
<h2 class="age-gate__t" id="age-gate-t">${esc(g.title)}</h2>
<p class="age-gate__p" id="age-gate-p">${esc(g.text)}</p>
<div class="btn-row age-gate__btns"><button class="btn btn--paint" type="button" data-age-yes>${esc(g.yes)}</button><button class="btn btn--ghost" type="button" data-age-no>${esc(g.no)}</button></div>
</div>
<div class="age-gate__blocked" data-age-blocked hidden tabindex="-1">
<h2 class="age-gate__t" id="age-gate-bt">${esc(g.blockedTitle)}</h2>
<p class="age-gate__p">${esc(g.blockedText)}</p>
<p class="age-gate__hint">${esc(g.blockedHint)}</p>
</div>
</div>
</div>`;
}

// ---------- structured data ----------
function storeLd(ctx) {
  const s = ctx.site;
  const a = s.address || {};
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const dayIdx = (x) => DAYS.findIndex((d) => d.toLowerCase().startsWith(String(x).trim().slice(0, 3).toLowerCase()));
  const clock = (x) => { const m = String(x).trim().match(/^(\d{1,2})(?::(\d{2}))?\s*([ap])m$/i); if (!m) return null; let h = Number(m[1]) % 12; if (/p/i.test(m[3])) h += 12; return `${String(h).padStart(2, '0')}:${m[2] || '00'}`; };
  const spec = (s.hours || []).map((r) => {
    const [from, to] = String(r.days).split(/\s+to\s+/);
    const i = dayIdx(from), j = dayIdx(to || from);
    const [o, c] = String(r.time).split(/\s+to\s+/).map(clock);
    if (i < 0 || j < 0 || !o || !c) return null;
    return { '@type': 'OpeningHoursSpecification', dayOfWeek: DAYS.slice(i, j + 1), opens: o, closes: c };
  }).filter(Boolean);
  return {
    '@context': 'https://schema.org', '@type': 'Store', name: s.fullName || s.name, url: s.origin + '/',
    telephone: String(s.phone.tel || '').replace(/^tel:/, ''),
    address: { '@type': 'PostalAddress', streetAddress: a.street, addressLocality: a.city, addressRegion: a.state, postalCode: a.zip, addressCountry: 'US' },
    geo: s.geo ? { '@type': 'GeoCoordinates', latitude: s.geo.lat, longitude: s.geo.lng } : undefined,
    openingHoursSpecification: spec, hasMap: s.map && s.map.directions,
    sameAs: Object.values(s.social || {}),
  };
}

function ogImage(ctx, og) {
  const u = og.image || '/assets/photos/Bridge-hero.webp';
  return /^https?:/i.test(u) ? u : (ctx.site.origin || '') + u;
}

// ---------- the page ----------
export function page({ ctx, path: p, title, description, canonical, og = {}, jsonld = [], bodyClass = '', main = '', crumbs = [], heroCrumbs = false, scripts = [], preload = [] }) {
  og = og || {};
  const can = canonical || absUrl(ctx, p);
  const desc = description || title;
  const css = (ctx.cssFiles || []).map((f) => `<link rel="stylesheet" href="/assets/css/${f}.css">`).join('\n');
  const lds = [].concat(jsonld || []).filter(Boolean);
  const types = lds.map((o) => o['@type']);
  if (crumbs && crumbs.length > 1 && !types.includes('BreadcrumbList')) {
    lds.push({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: crumbs.map((raw, i) => { const c = crumbParts(raw); return { '@type': 'ListItem', position: i + 1, name: c.label, item: absUrl(ctx, c.href || p) }; }) });
  }
  if (p === '/' && !types.some((x) => /Store|LocalBusiness|Organization/.test(String(x)))) lds.push(storeLd(ctx));
  const ld = lds.map((o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`).join('\n');
  const pre = (preload || []).filter(Boolean).map((x) => `<link rel="preload"${attrs(x)}>`).join('\n');
  const js = [...new Set(['site.js', ...(scripts || [])])].filter((f) => !ctx.jsFiles || ctx.jsFiles.includes(f));
  const crumbBar = crumbs && crumbs.length && !heroCrumbs;
  const bc = [bodyClass, crumbBar ? 'has-crumbbar' : ''].filter(Boolean).join(' ');
  const key = String(ctx.site.ageKey).replace(/[^A-Za-z0-9_-]/g, '');
  return `<!doctype html>
<html lang="en" data-spray-mask="/assets/photos/paint/spray-mask.webp">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${escA(desc)}">
<link rel="canonical" href="${escA(can)}">
<meta property="og:site_name" content="${escA(ctx.site.fullName || ctx.site.name)}">
<meta property="og:title" content="${escA(og.title || title)}">
<meta property="og:description" content="${escA(og.description || desc)}">
<meta property="og:url" content="${escA(og.url || can)}">
<meta property="og:type" content="${escA(og.type || 'website')}">
<meta property="og:image" content="${escA(ogImage(ctx, og))}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#050505">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="icon" type="image/png" sizes="48x48" href="/favicon-48.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preload" href="/assets/fonts/BebasNeue-400.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/Inter-var.woff2" as="font" type="font/woff2" crossorigin>
${pre}
${css}
<script>(function(d){var c=d.classList;c.add('js');try{if(localStorage.getItem('${key}')!=='1')c.add('gate-open')}catch(e){c.add('gate-open')}})(document.documentElement);</script>
${ld}
</head>
<body id="top"${attrs({ class: bc })}>
<div class="site">
${headerHtml(ctx, p)}
${crumbBar ? `<div class="crumbs-bar"><div class="wrap wrap--wide">${crumbsHtml(crumbs)}</div></div>` : ''}
<main id="main">
${main}
</main>
${footerHtml(ctx, p)}
</div>
${gateHtml(ctx)}
${js.map((f) => `<script src="/assets/js/${escA(f)}" defer${f === 'site.js' ? ` onerror="document.documentElement.classList.remove('gate-open')"` : ''}></script>`).join('\n')}
</body>
</html>`;
}
