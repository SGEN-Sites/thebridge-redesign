// shop.mjs - SHOP lane (docs/BUILD-CONTRACT.md section 3, "NIGHT PIECE"): /shop/, /shop/<slug>/ x8,
// /dispensaries/astoria/deals/ and /rewards/ ("The List"). Captured words come from src/content/pages/shop.json and
// site.json, new copy from src/content/guides/ (WRITER). No price, deal, stock or perk is ever typed here.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../lib/paths.mjs';
import { esc, escA, linkAttrs, gimg, photo, absUrl, store, sec, byCls, demoForm } from './util.mjs';
import { page, crumbsHtml, icon, drip, mark, tag, spray, pcard, ctaBand } from './shell.mjs';

const HOME = { label: 'Home', href: '/' };
const SHOP = { label: 'Shop', href: '/shop/' };

// Client product cut-out when IMAGERY has delivered it, else the original photo.
const hasCut = (file) => fs.existsSync(path.join(ROOT, 'assets/photos/cut', file));
const productCut = (ctx, file, opts) => photo(ctx, (hasCut(file) ? 'cut/' : '') + file, opts);

// The category still: the client's own photo, or the generated still life for edibles and concentrates.
const catArt = (ctx, c, opts = {}) => (c.photo ? photo(ctx, c.photo, opts) : gimg(c.gen, opts));

// Stamped title: "<Page> | The Bridge" unless the source already carries the name.
const titled = (t) => (/\|\s*The Bridge/.test(String(t)) ? String(t) : `${t} | The Bridge`);

const catUrl = (slug) => `/shop/${slug}/`;
const keepNumbers = (s) => esc(s).replace(/\d+-\d+/g, '<span class="s-nb">$&</span>');

// ---------- captured /shop/ data: fails the build rather than quietly dropping a word ----------
function capturedShop(ctx) {
  const s = sec(ctx, 'shop', 'shop-category');
  const head = byCls(s, 'section-title');
  const hm = String(head && head.text).match(/^(SHOP BY)\s+(CATEGORY)\s+(ORDER ONLINE WE DELIVER)$/);
  if (!hm) throw new Error('shop capture: section title changed: ' + (head && head.text));
  const cards = {};
  let cur = null;
  for (const b of s.blocks) {
    if (b.group !== 'category-card') continue;
    if (b.tag === 'img') {
      const file = String(b.src).split('/').pop();
      const cat = ctx.site.categories.find((c) => c.photo === file);
      if (!cat) throw new Error('shop capture: no category for ' + file);
      cur = cards[cat.slug] = { alt: b.alt };
    } else if (b.tag === 'h3') cur.name = b.text;
    else if (b.tag === 'p') cur.text = b.text;
    else if (b.tag === 'a') {
      const m = String(b.text).match(/^(Shop Now)\s+(\d+)\s+(\S+)$/);
      if (!m) throw new Error('shop capture: unexpected link text: ' + b.text);
      cur.shop = { label: m[1], count: m[2], arrow: m[3] };
    }
  }
  if (Object.keys(cards).length !== 6) throw new Error('shop capture: expected 6 category cards, got ' + Object.keys(cards).length);
  const f = sec(ctx, 'shop', 'featured-products');
  const fh = (f.blocks || []).find((b) => b.tag === 'h2');
  const va = byCls(f, 'view-all');
  const vm = String(va && va.text).match(/^(.*\S)\s+(\S+)$/);
  if (!fh || !vm) throw new Error('shop capture: featured header changed');
  const arrows = (f.blocks || []).filter((b) => b.group === 'slider-arrow').map((b) => b.text);
  return { hTop: hm[1], hAccent: hm[2], sub: hm[3], cards, featured: fh.text, viewAll: { label: vm[1], arrow: vm[2], href: va.href }, arrows };
}

// ---------- rail: glass head stays put, products slide under its frost ----------
function railHtml(ctx, products, { heading, viewAll, arrows, headingId }) {
  const prev = arrows[0] || '';
  const next = arrows[1] || '';
  return `<div class="s-rail rail" data-rail>
  <div class="s-rail__head glass glass--strong" data-reveal>
    <h2 class="s-rail__title display" id="${escA(headingId)}">${esc(heading)}</h2>
    <a class="s-rail__all link-arrow"${linkAttrs(viewAll.href)}>${esc(viewAll.label)} <span aria-hidden="true">${esc(viewAll.arrow)}</span></a>
    <div class="s-rail__arrows">
      <button class="s-rail__btn" type="button" data-rail-prev aria-label="Previous products">${esc(prev)}</button>
      <button class="s-rail__btn" type="button" data-rail-next aria-label="Next products">${esc(next)}</button>
    </div>
  </div>
  <div class="s-rail__track rail__track" tabindex="0" role="group" aria-label="${escA(heading)}">
    ${products.map((p, i) => `<div class="s-rail__item" data-reveal style="--i:${Math.min(i, 5)}">${pcard(ctx, p, { h: 3 })}</div>`).join('\n    ')}
  </div>
</div>`;
}

// ---------- /shop/ ----------
function shopCard(ctx, c, cap, i) {
  const big = c.slug === 'flower';
  const name = cap ? cap.name : c.label;
  const text = cap ? cap.text : c.text;
  const shop = cap ? cap.shop : { label: 'Shop Now', arrow: '→' };
  const sizes = big ? '(min-width: 1024px) 60vw, 100vw' : '(min-width: 1024px) 44vw, (min-width: 700px) 50vw, 100vw';
  return `<div class="s-cell s-cell--${escA(c.slug)}" data-reveal style="--i:${i % 4}">
  <article class="s-cat s-cat--${escA(c.slug)}" data-spot${big ? ' data-tilt' : ''}>
    <a class="s-cat__art"${linkAttrs(catUrl(c.slug), { tabindex: '-1', 'aria-hidden': 'true' })}>${catArt(ctx, c, { alt: '', sizes })}</a>
    <div class="s-cat__pane glass glass--strong glass--lift">
      <h2 class="s-cat__name"><a${linkAttrs(catUrl(c.slug))}>${esc(name)}</a></h2>
      <p class="s-cat__text">${esc(text)}</p>
      <a class="s-cat__shop btn btn--glass btn--sm"${linkAttrs(store(ctx, c.slug))}>${esc(shop.label)}${shop.count ? ` <span class="s-count">${esc(shop.count)}</span>` : ''} <span aria-hidden="true">${esc(shop.arrow)}</span></a>
    </div>
  </article>
</div>`;
}

function shopPage(ctx) {
  const rec = ctx.content.shop;
  const cap = capturedShop(ctx);
  const crumbs = [HOME, { label: 'Shop' }];
  const main = `
<section class="band band--void s-hero" aria-labelledby="s-h1" data-spot>
  <div class="band__clip">
    ${gimg('g-wall-night', { alt: '', cls: 'band__bg s-wall', eager: true })}
    <div class="s-light" aria-hidden="true"></div>
    ${spray('orange-2', { cls: 's-hero__spray', depth: 0.06 })}
    ${tag('ASTORIA', { color: 'blue', cls: 's-hero__tag', depth: 0.1 })}
    <div class="s-hero__scrim" aria-hidden="true"></div>
    <div class="grain" aria-hidden="true"></div>
  </div>
  <div class="wrap s-hero__in">
    ${crumbsHtml(crumbs)}
    <div class="s-hero__lead">
      <h1 class="s-hero__h1" id="s-h1">${esc(cap.hTop)} <span class="accent s-sprayed">${esc(cap.hAccent)}</span></h1>
      <div class="s-hero__act">
        <p class="s-hero__sub">${esc(cap.sub)}</p>
        <a class="btn btn--paint"${linkAttrs(store(ctx))}>${esc(ctx.ia.cta.label)}${icon('arrow')}</a>
      </div>
    </div>
    <nav class="s-hero__index" aria-label="Categories">
      ${ctx.site.categories.map((c) => `<a class="s-hero__ix"${linkAttrs(catUrl(c.slug))}>${esc(c.label)}</a>`).join('\n      ')}
    </nav>
  </div>
  <div class="s-front s-front--jar" data-depth="-0.05">${gimg('g-jar', { alt: '', cls: 'cut', eager: true, sizes: '(min-width: 1024px) 30vw, 44vw' })}</div>
  ${drip({ w: 420, h: 170, color: 'var(--orange)', seed: 3, cls: 's-drip s-drip--a' })}
</section>

<section class="band band--coal s-bento" aria-label="${escA(cap.hTop + ' ' + cap.hAccent)}">
  <div class="band__clip">
    ${spray('orange-1', { cls: 's-bento__spray' })}
    <div class="grain" aria-hidden="true"></div>
  </div>
  <div class="wrap s-bento__grid">
    ${ctx.site.categories.map((c, i) => shopCard(ctx, c, cap.cards[c.slug], i)).join('\n    ')}
  </div>
</section>

<section class="band band--void s-railsec" aria-labelledby="s-featured">
  <div class="band__clip">
    <div class="s-light s-light--rail" aria-hidden="true"></div>
    ${tag('CONNECTED', { color: 'blue', cls: 's-railsec__tag' })}
    ${spray('orange-2', { cls: 's-railsec__spray' })}
    <div class="grain" aria-hidden="true"></div>
  </div>
  ${railHtml(ctx, ctx.site.products, { heading: cap.featured, viewAll: cap.viewAll, arrows: cap.arrows, headingId: 's-featured' })}
</section>`;
  return {
    path: '/shop/',
    html: page({
      ctx, path: '/shop/', title: rec.title, description: rec.description, canonical: absUrl(ctx, '/shop/'),
      bodyClass: 'page-shop', main, crumbs, heroCrumbs: true,
    }),
  };
}

// ---------- /shop/<slug>/: one art direction per category so the eight heroes never read as clones ----------
// flip: the still is mirrored and the words sit on the right. v: where the words sit. zoom/origin/pos: how the still is
// framed. lx/ly: the key light, always on the subject. tag: the paint gesture, words from the client's own vocabulary.
const DIRECTION = {
  flower: { flip: false, v: 'low', zoom: 1, origin: '100% 40%', pos: '100% 34%', lx: '74%', ly: '40%', tag: 'QUEENS', tagColor: 'blue', closing: 'CULTURE', pane: 'ASTORIA', spray: 'orange-1', drip: 'l', front: { product: 'pro1.webp', fw: 236 } },
  'pre-rolls': { flip: true, v: 'mid', zoom: 1.04, origin: '100% 70%', pos: '100% 62%', lx: '26%', ly: '60%', tag: 'CULTURE', tagColor: 'orange', closing: 'ASTORIA', pane: 'CONNECTED', spray: 'blue-1', drip: 'r', front: { product: 'pro5.webp' } },
  vapes: { flip: false, v: 'top', zoom: 1.12, origin: '100% 100%', pos: '100% 100%', lx: '80%', ly: '34%', tag: 'CONNECTED', tagColor: 'blue', closing: 'QUEENS', pane: 'CULTURE', spray: 'orange-2', drip: 'm', front: { product: 'pro3.webp' } },
  edibles: { flip: true, v: 'low', zoom: 1, origin: '100% 50%', pos: '100% 50%', lx: '24%', ly: '42%', tag: 'COMMUNITY', tagColor: 'orange', closing: 'EQUITY', pane: 'QUEENS', spray: 'blue-2', drip: 'r', front: { gen: 'g-leaf-cut' } },
  concentrates: { flip: false, v: 'mid', zoom: 1.16, origin: '100% 55%', pos: '100% 55%', lx: '70%', ly: '56%', tag: 'EQUITY', tagColor: 'blue', closing: 'CONNECTED', pane: 'ASTORIA', spray: 'orange-1', drip: 'r', front: { gen: 'g-truss', wide: true } },
  beverages: { flip: true, v: 'top', zoom: 1.08, origin: '100% 100%', pos: '100% 90%', lx: '30%', ly: '66%', tag: 'ASTORIA', tagColor: 'orange', closing: 'COMMUNITY', pane: 'CULTURE', spray: 'orange-2', drip: 'm', front: { gen: 'g-can' } },
  wellness: { flip: false, v: 'low', zoom: 1.05, origin: '100% 60%', pos: '100% 70%', lx: '78%', ly: '58%', tag: 'COMMUNITY', tagColor: 'blue', closing: 'QUEENS', pane: 'EQUITY', spray: 'blue-1', drip: 'r', front: { gen: 'g-leaf-cut' } },
  lifestyle: { flip: true, v: 'mid', zoom: 1, origin: '100% 70%', pos: '100% 76%', lx: '22%', ly: '60%', tag: 'CULTURE', tagColor: 'orange', closing: 'ASTORIA', pane: 'CONNECTED', spray: 'orange-1', drip: 'm', front: { gen: 'g-cans' } },
};

function frontHtml(ctx, d) {
  const f = d.front;
  const sizes = '(min-width: 1024px) 320px, 40vw';
  const inner = f.product ? productCut(ctx, f.product, { alt: '', cls: 'cut', sizes, eager: true }) : gimg(f.gen, { alt: '', cls: 'cut', sizes, eager: true });
  return `<div class="s-front s-front--cat${f.wide ? ' s-front--wide' : ''}"${f.fw ? ` style="--s-fw:${f.fw}px"` : ''} data-depth="-0.05">${inner}</div>`;
}

function gluePoints(glue) {
  return Array.isArray(glue && glue.points) ? glue.points.filter(Boolean) : [];
}

function categoryPage(ctx, cat, i) {
  const d = DIRECTION[cat.slug];
  if (!d) throw new Error('shop: no art direction for category ' + cat.slug);
  const url = catUrl(cat.slug);
  const crumbs = [HOME, SHOP, { label: cat.label }];
  const glue = ((ctx.guides || {})['category-glue'] || {})[cat.slug] || null;
  const points = gluePoints(glue);
  const products = ctx.site.products.filter((p) => p.cat === cat.slug);
  const cats = ctx.site.categories;
  const related = [1, 2, 3].map((n) => cats[(i + n) % cats.length]);
  const featured = (sec(ctx, 'shop', 'featured-products').blocks || []).find((b) => b.tag === 'h2').text;
  const viewAll = capturedShop(ctx).viewAll;

  const glueBand = glue && (glue.intro || points.length) ? `
<section class="band band--coal s-glue${d.flip ? ' s-glue--flip' : ''}">
  <div class="band__clip">
    ${spray(d.spray, { cls: 's-glue__spray' })}
    ${tag(d.pane, { color: d.tagColor, cls: 's-glue__tag' })}
    <div class="grain" aria-hidden="true"></div>
  </div>
  <div class="wrap s-glue__in">
    ${glue.intro ? `<p class="s-glue__intro lede" data-reveal>${esc(glue.intro)}</p>` : ''}
    ${points.length ? `<ul class="s-glue__points glass" data-reveal style="--i:1">
      ${points.map((p) => `<li>${esc(p)}</li>`).join('\n      ')}
    </ul>` : ''}
  </div>
</section>` : '';

  const shopLine = `<a class="s-all link-arrow"${linkAttrs(store(ctx, cat.slug))}>${esc(viewAll.label)} <span aria-hidden="true">${esc(viewAll.arrow)}</span></a>`;
  const productBand = products.length ? `
<section class="band band--void s-prods s-prods--n${products.length}" aria-labelledby="s-prods-h">
  <div class="band__clip"><div class="s-light s-light--prods" aria-hidden="true"></div><div class="grain" aria-hidden="true"></div></div>
  <div class="wrap s-prods__in">
    <header class="s-prods__head" data-reveal>
      <h2 class="display s-h2" id="s-prods-h">${esc(featured)}</h2>
      ${shopLine}
    </header>
    <div class="s-prods__grid">
      ${products.map((p, n) => `<div class="s-prods__item" data-reveal style="--i:${n}">${pcard(ctx, p, { h: 3 })}</div>`).join('\n      ')}
    </div>
  </div>
</section>` : `
<section class="band band--void s-noprods" aria-labelledby="s-prods-h">
  <div class="band__clip"><div class="s-light s-light--prods" aria-hidden="true"></div><div class="grain" aria-hidden="true"></div></div>
  <div class="wrap s-noprods__in" data-reveal>
    <h2 class="kicker" id="s-prods-h">Online store</h2>
    <a class="s-bigstore"${linkAttrs(store(ctx, cat.slug))}>Shop ${mark(esc(cat.label))}<span class="s-bigstore__go" aria-hidden="true">${esc(viewAll.arrow)}</span></a>
  </div>
</section>`;

  const main = `
<section class="band band--void s-ch s-ch--${escA(d.v)}${d.flip ? ' s-ch--flip' : ''} s-ch--${escA(cat.slug)}" style="--lx:${d.lx};--ly:${d.ly};--s-zoom:${d.zoom};--s-origin:${d.origin};--s-pos:${d.pos};--s-chars:${cat.label.length};--s-tagc:${d.tag.length}" aria-labelledby="s-h1">
  <div class="band__clip">
    <div class="s-ch__art">${catArt(ctx, cat, { alt: '', eager: true, sizes: '100vw' })}</div>
    <div class="s-light" aria-hidden="true"></div>
    ${spray(d.spray, { cls: 's-ch__spray', depth: 0.05 })}
    <div class="s-ch__scrim" aria-hidden="true"></div>
    <div class="grain" aria-hidden="true"></div>
  </div>
  <div class="wrap s-ch__in">
    ${crumbsHtml(crumbs)}
    <div class="s-ch__copy">
      ${tag(d.tag, { color: d.tagColor, cls: 's-ch__tag' })}
      <h1 class="s-ch__h1" id="s-h1">${esc(cat.label)}</h1>
      <p class="s-ch__text lede">${esc(cat.text)}</p>
      <div class="btn-row"><a class="btn btn--paint"${linkAttrs(store(ctx, cat.slug))}>${esc(ctx.ia.cta.label)}${icon('arrow')}</a></div>
    </div>
  </div>
  ${frontHtml(ctx, d)}
  ${drip({ w: 420, h: 170, color: 'var(--orange)', seed: i + 2, cls: 's-drip s-drip--' + d.drip })}
</section>
${glueBand}
${productBand}

<section class="band band--coal s-rel" aria-labelledby="s-rel-h">
  <div class="wrap">
    <h2 class="s-rel__h kicker" id="s-rel-h">Other categories</h2>
    <div class="s-rel__grid">
      ${related.map((c, n) => `<a class="s-relcard"${linkAttrs(catUrl(c.slug))} data-reveal style="--i:${n}">
        <span class="s-relcard__art">${catArt(ctx, c, { alt: '', sizes: '(min-width: 700px) 30vw, 100vw' })}</span>
        <span class="s-relcard__name">${esc(c.label)}</span>
        <span class="s-relcard__go" aria-hidden="true">→</span>
      </a>`).join('\n      ')}
    </div>
  </div>
</section>
${ctaBand(ctx, {
    kicker: ctx.ia.utility.pickup.value,
    title: ctx.ia.utility.promo.text,
    paint: d.closing,
    text: ctx.site.address.oneLine,
    buttons: [
      { label: ctx.ia.cta.label, href: store(ctx, cat.slug), cls: 'btn--paint' },
      { label: `${ctx.ia.utility.pickup.label} ${ctx.ia.utility.pickup.value}`, href: ctx.ia.utility.pickup.href, cls: 'btn--glass' },
    ],
  })}`;

  return {
    path: url,
    html: page({
      ctx, path: url, title: titled(cat.label), description: `${cat.label} at The Bridge in Astoria, Queens. ${cat.text}`, canonical: absUrl(ctx, url),
      bodyClass: `page-shop page-shop-cat page-shop-${cat.slug}`, main, crumbs, heroCrumbs: true,
    }),
  };
}

// ---------- written sections shared by Deals and The List ----------
function guideSections(g) {
  return (g.sections || []).map((s, i) => `<section class="s-read__row" data-reveal style="--i:${Math.min(i, 3)}">
      ${s.heading ? `<h2 class="s-read__h display">${esc(s.heading)}</h2>` : ''}
      <div class="s-read__body prose">${s.html || ''}</div>
    </section>`).join('\n    ');
}

// ---------- /dispensaries/astoria/deals/: calm, typographic, one orange moment. Invents nothing. ----------
function dealsPage(ctx) {
  const g = (ctx.guides || {}).deals || {};
  const url = '/dispensaries/astoria/deals/';
  const crumbs = [HOME, { label: 'Astoria', href: '/dispensaries/astoria/' }, { label: 'Deals' }];
  const h1 = g.h1 || 'Deals';
  const lede = g.lede || 'The Bridge publishes no current deals list here. The store menu shows what is on the menu now.';
  const body = guideSections(g);
  const main = `
<section class="band band--void s-calm" aria-labelledby="s-h1" style="--lx:18%;--ly:6%">
  <div class="band__clip">${gimg(g.image || 'g-bud-key', { alt: '', cls: 'band__bg s-calm__art', sizes: '70vw', eager: true })}<div class="s-light" aria-hidden="true"></div><div class="grain" aria-hidden="true"></div></div>
  <div class="wrap s-calm__in">
    ${crumbsHtml(crumbs)}
    ${g.kicker ? `<p class="kicker" data-reveal>${esc(g.kicker)}</p>` : ''}
    <h1 class="s-calm__h1" id="s-h1" data-reveal>${esc(h1)}</h1>
    <p class="s-calm__lede lede" data-reveal style="--i:1">${keepNumbers(lede)}</p>
  </div>
</section>
${body ? `<section class="band band--void s-read">
  <div class="wrap s-read__in">
    ${body}
  </div>
</section>` : ''}
<section class="band band--paint s-orange" aria-label="Where to look">
  <div class="wrap s-orange__in">
    <a class="s-orange__link" data-reveal${linkAttrs(store(ctx))}><span class="s-orange__name">The store menu</span><span class="s-orange__go" aria-hidden="true">→</span></a>
    <a class="s-orange__link" data-reveal style="--i:1"${linkAttrs('/events/')}><span class="s-orange__name">Event-day pricing</span><span class="s-orange__go" aria-hidden="true">→</span></a>
    <a class="s-orange__link" data-reveal style="--i:2"${linkAttrs('/rewards/')}><span class="s-orange__name">The List</span><span class="s-orange__go" aria-hidden="true">→</span></a>
  </div>
</section>`;
  return {
    path: url,
    html: page({
      ctx, path: url, title: titled(g.title || 'Deals'),
      description: g.description || 'Where to find pricing at The Bridge in Astoria, Queens: the online store menu, the events page and The List.',
      canonical: absUrl(ctx, url), bodyClass: 'page-deals', main, crumbs, heroCrumbs: true,
    }),
  };
}

// ---------- /rewards/ = "The List": a name and an email. No points, no perks, no promises. ----------
function listPage(ctx) {
  const g = (ctx.guides || {}).list || {};
  const url = '/rewards/';
  const crumbs = [HOME, { label: 'The List' }];
  const h1 = g.h1 || 'The List';
  const lede = g.lede || 'Leave a name and an email.';
  const body = guideSections(g);
  const main = `
<section class="band band--void s-list" aria-labelledby="s-h1" style="--lx:72%;--ly:34%">
  <div class="band__clip">
    ${gimg('g-wall-night', { alt: '', cls: 'band__bg s-wall', eager: true })}
    <div class="s-light" aria-hidden="true"></div>
    ${spray('orange-1', { cls: 's-list__spray' })}
    ${tag('CONNECTED', { color: 'orange', cls: 's-list__tag', depth: 0.06 })}
    <div class="s-list__scrim" aria-hidden="true"></div>
    <div class="grain" aria-hidden="true"></div>
  </div>
  <div class="wrap s-list__in">
    ${crumbsHtml(crumbs)}
    <div class="s-list__copy">
      ${g.kicker ? `<p class="kicker" data-reveal>${esc(g.kicker)}</p>` : ''}
      <h1 class="s-list__h1" id="s-h1" data-reveal>${esc(h1)}</h1>
      <p class="s-list__lede lede" data-reveal style="--i:1">${keepNumbers(lede)}</p>
    </div>
    <div class="s-list__stage">
      <div class="s-list__pane glass glass--lit" data-reveal style="--i:2">
        ${demoForm({ id: 'the-list', fields: [{ label: 'Name', type: 'text' }, { label: 'Email', type: 'email' }], button: 'Get On The List', cls: 's-list__form' })}
      </div>
    </div>
  </div>
  <div class="s-front s-front--can" data-depth="-0.05">${gimg('g-can', { alt: '', cls: 'cut', sizes: '(min-width: 1024px) 240px, 30vw' })}</div>
</section>
${body ? `<section class="band band--coal s-read s-read--after">
  <div class="wrap s-read__in">
    ${body}
  </div>
</section>` : ''}`;
  return {
    path: url,
    html: page({
      ctx, path: url, title: titled(g.title || 'The List'),
      description: g.description || 'The List from The Bridge in Astoria, Queens: leave a name and an email.',
      canonical: absUrl(ctx, url), bodyClass: 'page-list', main, crumbs, heroCrumbs: true,
    }),
  };
}

export async function render(ctx) {
  return [
    shopPage(ctx),
    ...ctx.site.categories.map((c, i) => categoryPage(ctx, c, i)),
    dealsPage(ctx),
    listPage(ctx),
  ];
}
