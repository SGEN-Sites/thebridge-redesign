// home.mjs - The Bridge home "/" (HOME lane, "NIGHT PIECE"). The section order is the adopted operator's home order filled
// with The Bridge's content: 1 hero, 2 marquee, 3 shop by category, 4 shop our brands (torch wall), 5 our story,
// 6 statement, 7 know your strain, 8 featured products, 9 videos, 10 Mobb Deep x NDICA, 11 visit, 12 what's on + press,
// 13 the insider, 14 ready to elevate. Every captured word comes from src/content/pages/home.json or site.json: it is read,
// never retyped. New words are short labels only. Root-absolute URLs live in HTML attributes (D6).
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../lib/paths.mjs';
import * as shell from './shell.mjs';
import { esc, escA, linkAttrs, gimg, img, photo, store, sec, byCls, absUrl, hasGenerated, capSizes } from './util.mjs';

const { icon, hoursHtml, tag, spray, drip, ytCard, pcard, loopVideo } = shell;
const hasFile = (rel) => fs.existsSync(path.join(ROOT, rel));
const hasPhoto = (f) => hasFile('assets/photos/' + f);
const noArrow = (s) => String(s || '').replace(/\s*[→❯❮]\s*/g, ' ').trim();
const arrow = () => icon('arrow');

// the client's script logo, every width it ships in
const LOGO_BONE = [[440, 'bridge-logo-bone-440'], [880, 'bridge-logo-bone-880']];
const LOGO = [[440, 'bridge-logo-440'], [880, 'bridge-logo-880'], [1600, 'bridge-logo-1600']];
function logoImg(set, alt, { sizes = '40vw', cls = '', eager = false } = {}) {
  const big = set[set.length - 1];
  return `<img${cls ? ` class="${cls}"` : ''} src="/assets/brand/${big[1]}.webp" srcset="${set.map(([w, n]) => `/assets/brand/${n}.webp ${w}w`).join(', ')}" sizes="${escA(sizes)}" width="1600" height="977" alt="${escA(alt)}" decoding="async"${eager ? ' fetchpriority="high"' : ' loading="lazy"'}>`;
}

const HERO_LG = [1280, 1920, 2560, 3840].map((w) => [w, `/assets/media/bridge-hero-${w}.webp`]);
const HERO_SM = [800, 1200, 1600].map((w) => [w, `/assets/media/bridge-hero-sm-${w}.webp`]);
// the phone photo covers the hero by height (140vw wide); a 3x phone takes it as 2x, the same rule img() applies
const HERO_SM_SIZES = capSizes('140vw');

// ---------- 1 hero ----------
function hero(ctx, s) {
  const lines = byCls(s, 'hero-title').text.split(/\s+/);
  const logoAlt = (s.blocks.find((b) => b.tag === 'img') || {}).alt || ctx.site.fullName;
  // the client's own bridge photo, upscaled (docs/MEDIA.md); a tall crop on phones, up to 3840 px on desktop
  const steel = `<picture><source media="(max-width: 759px)" srcset="${HERO_SM.map(([w, u]) => `${u} ${w}w`).join(', ')}" sizes="${HERO_SM_SIZES}"><source srcset="${HERO_LG.map(([w, u]) => `${u} ${w}w`).join(', ')}" sizes="(max-width: 1023px) 190vw, 100vw"><img class="h-hero__photo" src="${HERO_LG[1][1]}" width="3840" height="2817" alt="" decoding="async" fetchpriority="high"></picture>`;
  const h1 = lines.map((w, i) => `<span class="h-hero__line${/^CULTURE$/i.test(w) ? ' outline' : ''}" style="--i:${i}">${esc(w)}</span>`).join(' ');
  return `<section class="h-hero" aria-labelledby="h-hero-h1" data-video-host>
<div class="band__clip h-hero__wall">
${steel}
<span class="h-hero__scrim"></span>
<span class="grain"></span>
</div>
${tag('QUEENS', { color: 'blue', cls: 'h-hero__tag' })}
<div class="h-spray" data-spray-tag aria-hidden="true"><canvas class="h-spray__paint"></canvas><canvas class="h-spray__fx"></canvas></div>
<button class="loop-toggle" type="button" data-spray-toggle aria-pressed="false" aria-label="Pause motion">${icon('pause', 'loop-toggle__pause')}${icon('play', 'loop-toggle__play')}</button>
<div class="h-hero__logo" data-depth="-0.07">${logoImg(LOGO_BONE, logoAlt, { sizes: '(max-width: 720px) 50vw, (max-width: 1023px) 360px, 42vw', eager: true })}</div>
<div class="wrap wrap--wide h-hero__copy">
<p class="kicker h-hero__eyebrow">${esc(byCls(s, 'eyebrow').text)}</p>
<h1 class="h-hero__h1" id="h-hero-h1">${h1}</h1>
<div class="h-hero__side">
<p class="h-hero__text">${esc(byCls(s, 'hero-text').text)}</p>
<div class="btn-row h-hero__btns">
<a class="btn btn--paint"${linkAttrs(store(ctx))}>Shop Now</a>
<a class="btn btn--glass"${linkAttrs('/dispensaries/astoria/')}>Visit The Shop</a>
</div>
</div>
</div>
</section>`;
}

// ---------- 2 marquee: real text once, copies aria-hidden ----------
function marquee(ctx) {
  const run = esc(ctx.site.marquee.join(' • ')) + ' • ';
  return `<div class="h-marq">
<div class="h-marq__shadow"></div>
<div class="h-marq__band" data-marquee>
<p class="h-marq__run">${run}</p>
<p class="h-marq__run" aria-hidden="true">${run}</p>
</div>
</div>
<div class="seam h-front" aria-hidden="true">
<div class="h-front__truss" data-depth="0.05">${gimg('g-truss', { alt: '', cls: 'cut h-front__img', sizes: '(max-width: 767px) 72vw, 44vw' })}</div>
</div>`;
}

// ---------- 3 shop by category: a bento, two large and six small ----------
function categories(ctx, s) {
  const title = byCls(s, 'section-title').text;
  const m = title.match(/^(SHOP BY CATEGORY)\s+(.+)$/i) || [null, title, ''];
  const large = new Set(['flower', 'lifestyle']);
  const cards = ctx.site.categories.map((c, i) => {
    const big = large.has(c.slug);
    // a small card's art is cover-cropped into a tall box on phones, so it paints about 110vw wide
    // phones: all eight art boxes are about 140 px tall and cover-cropped, so about 280 px of image covers any of them
    const sizes = big ? '(max-width: 767px) 280px, 50vw' : '(max-width: 767px) 280px, 26vw';
    const art = c.gen ? gimg(c.gen, { alt: '', cls: 'h-cat__img', sizes }) : photo(ctx, c.photo, { alt: '', cls: 'h-cat__img', sizes });
    return `<a class="h-cat h-cat--${esc(c.slug)}${big ? ' h-cat--lg' : ''}"${linkAttrs(c.store)} data-reveal style="--i:${i % 4}">
<span class="h-cat__art">${art}</span>
<div class="h-cat__pane glass glass--lift">
<h3 class="h-cat__name">${esc(c.label)}</h3>
<p class="h-cat__text">${esc(c.text)}</p>
<span class="h-cat__go link-arrow">Shop Now ${arrow()}</span>
</div>
</a>`;
  }).join('\n');
  return `<section class="band band--void h-cats" aria-labelledby="h-cats-h">
<div class="wrap wrap--wide">
<h2 class="h-cats__title" id="h-cats-h" data-reveal><span class="display">${esc(m[1])}</span> <span class="h-cats__sub">${esc(m[2])}</span></h2>
<div class="h-cats__grid">
${cards}
</div>
</div>
</section>`;
}

// ---------- 4 shop our brands: graffiti in the dark, found with a torch ----------
function brands(ctx) {
  const links = ctx.site.brands.map((b, i) => `<li class="h-brands__item${i % 5 === 2 ? ' h-brands__item--hand' : ''}"><a class="h-brand"${linkAttrs(b.url)}>${esc(b.name)}</a></li>`).join('\n');
  return `<section class="band band--void h-torch" data-torch aria-labelledby="h-torch-h">
<div class="band__clip">
${gimg('g-piece', { alt: '', cls: 'band__bg h-torch__dim', sizes: '100vw' })}
<div class="h-torch__lit" data-torch-layer>${gimg('g-piece', { alt: '', cls: 'band__bg', sizes: '100vw' })}<span class="h-torch__halo"></span></div>
<span class="grain"></span>
</div>
<div class="wrap wrap--wide h-torch__in">
<h2 class="h-torch__h" id="h-torch-h" data-reveal>Shop Our Brands</h2>
<ul class="h-brands" data-reveal>
${links}
</ul>
</div>
</section>`;
}

// ---------- 5 our story: a pane sliding over a spray tag, crossing the lower seam ----------
function story(ctx, s) {
  const pic = s.blocks.find((b) => b.tag === 'img') || {};
  return `<section class="band band--void h-story" aria-labelledby="h-story-h">
<div class="band__clip">
${photo(ctx, 'havoc-mixing.webp', { alt: pic.alt || 'Studio Session', cls: 'band__bg h-story__photo', sizes: '(max-width: 767px) 131vw, 100vw' })}
<span class="h-story__shade"></span>
<span class="grain"></span>
</div>
<div class="wrap wrap--wide h-story__in">
${tag('CULTURE', { color: 'orange', cls: 'h-story__tag', depth: '-0.08' })}
<div class="glass glass--lit h-story__pane" data-depth="0.05" data-reveal>
<p class="kicker">${esc(byCls(s, 'section-eyebrow').text)}</p>
<h2 class="display h-story__title" id="h-story-h">${esc(byCls(s, 'story-title').text)}</h2>
<p class="lede h-story__text">${esc(byCls(s, 'story-text').text)}</p>
</div>
</div>
</section>`;
}

// ---------- 6 statement: scroll-lit type, a drip across the seam ----------
function statement(ctx, s) {
  return `<section class="band band--coal h-state">
<div class="wrap wrap--wide">
<p class="display h-state__text" data-words="120">${esc(byCls(s, 'statement-text').text)}</p>
</div>
${drip({ w: 520, h: 150, color: 'var(--orange)', cls: 'h-state__drip' })}
</section>`;
}

// ---------- 7 know your strain ----------
function strains(ctx) {
  const cards = ctx.site.strains.map((st, i) => {
    const sizes = '(max-width: 720px) 80vw, 30vw';
    const art = st.gen ? gimg(st.gen, { alt: '', cls: 'h-strain__img h-strain__img--cut', sizes: '(max-width: 767px) 44vw, 30vw' }) : photo(ctx, st.photo, { alt: '', cls: 'h-strain__img', sizes });
    return `<a class="h-strain h-strain--${esc(st.slug)}"${linkAttrs('/facts/#' + st.slug)} data-tilt="5" data-reveal style="--i:${i}">
<span class="h-strain__art">${art}</span>
<div class="h-strain__pane glass glass--lift">
<h3 class="h-strain__name">${esc(st.label)}</h3>
<p class="h-strain__line">${esc(st.line)}</p>
</div>
</a>`;
  }).join('\n');
  return `<section class="band band--void h-strains" aria-labelledby="h-strains-h">
<div class="band__clip"><span class="h-strains__key"></span><span class="grain"></span></div>
<div class="wrap wrap--wide">
<h2 class="display h-strains__h" id="h-strains-h" data-reveal>Know Your Strain</h2>
<div class="h-strains__row">
${cards}
</div>
</div>
</section>`;
}

// ---------- 8 featured products ----------
function products(ctx, s) {
  const title = (s.blocks.find((b) => b.tag === 'h2') || {}).text;
  const all = byCls(s, 'view-all');
  return `<section class="band band--coal h-feat" aria-labelledby="h-feat-h">
<div class="h-feat__cans" data-depth="0.04" aria-hidden="true">${gimg('g-cans', { alt: '', cls: 'cut h-feat__cansimg', sizes: '(max-width: 720px) 40vw, 24vw' })}</div>
<div class="wrap wrap--wide">
<header class="h-feat__head" data-reveal>
<h2 class="display h-feat__h" id="h-feat-h">${esc(title)}</h2>
<a class="link-arrow h-feat__all"${linkAttrs(all.href)}>${esc(noArrow(all.text))} ${arrow()}</a>
</header>
<div class="h-feat__rail" data-rail data-rail-label="${escA(title)}" data-reveal>
<div class="rail__track">
${ctx.site.products.map((p) => pcard(ctx, p, { h: 3 })).join('\n')}
</div>
</div>
</div>
</section>`;
}

// ---------- 9 videos: the seven unique videos (the source repeats one, a source defect) ----------
function videos(ctx, s) {
  return `<section class="band band--void band--beam h-vids" aria-labelledby="h-vids-h">
<div class="wrap wrap--wide h-vids__in">
<h2 class="display h-vids__h" id="h-vids-h" data-reveal>${esc(byCls(s, 'section-title').text)}</h2>
<div class="h-vids__grid">
${ctx.site.videos.map((v, i) => `<div class="h-vid h-vid--${i + 1}" data-reveal style="--i:${i % 3}">${ytCard(v)}</div>`).join('\n')}
</div>
</div>
</section>`;
}

// ---------- 10 Mobb Deep x NDICA: the strongest depth moment ----------
function mobb(ctx, s) {
  const b = s.blocks;
  const heads = b.filter((x) => x.tag === 'h5');
  const pillars = heads.map((h, i) => `<div class="glass glass--lift h-pillar" data-reveal style="--i:${i}">
<h3 class="h-pillar__name">${esc(h.text)}</h3>
<p class="h-pillar__text">${esc(b[b.indexOf(h) + 1].text)}</p>
</div>`).join('\n');
  const more = b.find((x) => x.tag === 'a');
  const shot = b.find((x) => x.tag === 'img') || {};
  // the cut-out from IMAGERY when it exists; until then the client's photo, its edges masked into the wall (see .h-mobb__cut--photo)
  const cut = hasPhoto('cut/mobb-deep-hell.webp');
  const big = photo(ctx, cut ? 'cut/mobb-deep-hell.webp' : 'mobb-deep-hell.webp', { alt: 'Mobb Deep', cls: 'h-mobb__img', sizes: '(max-width: 720px) 96vw, (max-width: 1100px) 56vw, 760px' });
  return `<section class="band band--void h-mobb" aria-labelledby="h-mobb-h">
<div class="band__clip">
${gimg('g-wall-night', { alt: '', cls: 'band__bg h-mobb__wall', sizes: '100vw' })}
<span class="h-mobb__shade"></span>
<span class="grain"></span>
</div>
${tag('COMMUNITY', { color: 'blue', cls: 'h-mobb__tag', depth: '-0.05' })}
${spray('orange-1', { cls: 'h-mobb__spray', depth: '0.03' })}
<div class="h-mobb__cut${cut ? ' cut' : ' h-mobb__cut--photo'}" data-depth="0.06">${big}</div>
<div class="wrap wrap--wide h-mobb__in">
<div class="h-mobb__copy">
<figure class="h-mobb__print" data-reveal>${photo(ctx, 'mobb-deep-shot.webp', { alt: shot.alt || 'Mobb Deep', sizes: '(max-width: 767px) 40vw, 240px' })}</figure>
<h2 class="display h-mobb__h" id="h-mobb-h" data-reveal>${esc(byCls(s, 'section-title').text).replace(/\s+(x\s+\S+)$/i, ' <span class="h-mobb__x">$1</span>')}</h2>
<p class="lede h-mobb__sub" data-reveal>${esc(byCls(s, 'sub-text').text)}</p>
<div class="h-pillars">
${pillars}
</div>
<div class="h-mobb__foot" data-reveal>
<a class="btn btn--paint h-mobb__more"${linkAttrs(ctx.site.ndica.url)}>${esc(noArrow(more.text))} ${arrow()}</a>
<span class="h-mobb__chip">${photo(ctx, ctx.site.ndica.logo, { alt: ctx.site.ndica.name, cls: 'h-mobb__ndica', sizes: '160px' })}</span>
</div>
</div>
</div>
</section>`;
}

// ---------- 11 visit: one store only ----------
function visit(ctx) {
  const { site, ia } = ctx;
  return `<section class="band band--void h-visit" aria-labelledby="h-visit-h">
<div class="band__clip">
${gimg('g-elevated', { alt: '', cls: 'band__bg h-visit__bg', sizes: '100vw' })}
<span class="h-visit__shade"></span>
<span class="grain"></span>
</div>
<div class="wrap wrap--wide h-visit__in">
<div class="glass glass--strong h-visit__pane" data-reveal>
<p class="kicker">Visit</p>
<h2 class="display h-visit__h" id="h-visit-h">${esc(ia.utility.pickup.value)}</h2>
<p class="h-visit__addr">${icon('pin')}<span>${esc(site.address.oneLine)}</span></p>
${hoursHtml(ctx, 'h-visit__hours')}
<p class="h-visit__note">${esc(site.hoursNote)}</p>
<div class="btn-row h-visit__btns">
<a class="btn btn--paint"${linkAttrs(site.map.directions)}>Get Directions</a>
<a class="btn btn--glass"${linkAttrs(site.phone.tel)}>${icon('phone')}${esc(site.phone.display)}</a>
</div>
</div>
</div>
</section>`;
}

// ---------- 12 what's on + in the press: words from the captures, plus short labels ----------
function teasers(ctx) {
  const ev = ctx.content.events;
  const med = ctx.content.media;
  const evBlocks = sec(ctx, 'events', 'events-section').blocks;
  const flyerAlt = (f) => (evBlocks.find((b) => b.tag === 'img' && String(b.src).includes(f)) || {}).alt || '';
  const flyers = ['event-havoc-popup-aug-2026-sm.webp', 'event-eaton-pilates-aug-2026-sm.webp'].map((f, i) => `<a class="h-flyer h-flyer--${i + 1}"${linkAttrs('/events/')} data-reveal style="--i:${i}">${photo(ctx, f, { alt: flyerAlt(f), sizes: '(max-width: 720px) 46vw, 300px' })}</a>`).join('\n');
  const outlets = [];
  for (const s of med.sections) for (const b of s.blocks || []) {
    if (!(b.cls || '').split(/\s+/).includes('press-meta')) continue;
    const [name, date] = b.text.split('•').map((x) => x.trim());
    outlets.push({ name, date });
  }
  const list = outlets.map((o, i) => `<li><a class="h-press__row"${linkAttrs('/media/')}><span class="h-press__name">${esc(o.name)}</span><span class="h-press__date">${esc(o.date)}</span></a></li>`).join('\n');
  const pressLede = (sec(ctx, 'media', 'hero-media').blocks.find((b) => b.tag === 'p') || {}).text || '';
  return `<section class="band band--void h-news" aria-labelledby="h-news-on h-news-press">
<div class="band__clip">
${gimg('g-wheatpaste', { alt: '', cls: 'band__bg h-news__wall', sizes: '100vw' })}
<span class="h-news__shade"></span>
<span class="grain"></span>
</div>
<div class="wrap wrap--wide h-news__in">
<div class="h-news__on">
<h2 class="display h-news__h" id="h-news-on" data-reveal><a${linkAttrs('/events/')}>${esc(ev.h1)}</a></h2>
<div class="h-flyers">
${flyers}
</div>
</div>
<div class="h-news__press">
<h2 class="display h-news__h" id="h-news-press" data-reveal><a${linkAttrs('/media/')}>${esc(med.h1)}</a></h2>
<p class="h-press__lede" data-reveal>${esc(pressLede)}</p>
<ul class="h-press" data-reveal>
${list}
</ul>
</div>
</div>
</section>`;
}

// ---------- 13 the insider: renders nothing without posts ----------
function insider(ctx) {
  const posts = (ctx.posts || []).slice(0, 3);
  if (!posts.length) return '';
  const cards = posts.map((p, i) => {
    const pth = p.path || `/blog/${p.slug}/`;
    const art = p.image && hasGenerated(p.image) ? gimg(p.image, { alt: '', cls: 'h-post__img', sizes: '(max-width: 767px) 62vw, 30vw' }) : '';
    return `<a class="h-post"${linkAttrs(pth)} data-reveal style="--i:${i}">
<span class="h-post__art${art ? '' : ' h-post__art--none'}">${art}</span>
<h3 class="h-post__title">${esc(p.h1 || p.title)}</h3>
<span class="link-arrow h-post__go">Read ${arrow()}</span>
</a>`;
  }).join('\n');
  return `<section class="band band--coal h-posts" aria-labelledby="h-posts-h">
<div class="wrap wrap--wide">
<header class="h-posts__head" data-reveal>
<h2 class="display h-posts__h" id="h-posts-h">The Insider</h2>
<a class="link-arrow"${linkAttrs('/blog/')}>Blog ${arrow()}</a>
</header>
<div class="h-posts__row">
${cards}
</div>
</div>
</section>`;
}

// ---------- 14 ready to elevate: the one "lights on" band ----------
function elevate(ctx, s) {
  const b = s.blocks;
  const go = b.find((x) => x.tag === 'a');
  const mist = hasFile('assets/media/loop-mist.mp4') ? loopVideo(ctx, 'loop-mist', { cls: 'h-cta__mist', phone: false }) : '';
  return `<section class="band band--paint h-cta" aria-labelledby="h-cta-h"${mist ? ' data-video-host' : ''}>
<div class="band__clip">
${mist || gimg('g-burst', { alt: '', cls: 'h-cta__mist', sizes: '100vw' })}
${tag('CONNECTED', { cls: 'h-cta__tag', wipe: false })}
</div>
<div class="h-cta__can" data-depth="-0.05" aria-hidden="true">${gimg('g-can', { alt: '', cls: 'cut h-cta__canimg', sizes: '(max-width: 720px) 26vw, 14vw' })}</div>
<div class="wrap wrap--wide h-cta__in">
<h2 class="display display--mega h-cta__h" id="h-cta-h" data-reveal>${esc(b.find((x) => x.tag === 'h3').text)}</h2>
<div class="h-cta__row" data-reveal>
<p class="h-cta__text">${esc(b.find((x) => x.tag === 'p').text)}</p>
<a class="btn btn--paint h-cta__go"${linkAttrs(go.href)}>${esc(noArrow(go.text))} ${arrow()}</a>
</div>
</div>
</section>`;
}

export async function render(ctx) {
  const home = ctx.content.home;
  const S = (w) => sec(ctx, 'home', w);
  const main = [
    hero(ctx, S('hero')),
    marquee(ctx),
    categories(ctx, S('category-section')),
    brands(ctx),
    story(ctx, S('story-section')),
    statement(ctx, S('statement-section')),
    strains(ctx),
    products(ctx, S('featured-products')),
    videos(ctx, S('youtube-section')),
    mobb(ctx, S('last-section')),
    visit(ctx),
    teasers(ctx),
    insider(ctx),
    elevate(ctx, S('bg-gray')),
  ].filter(Boolean).join('\n');

  // the hero photo is the first paint: preload the same srcset the <img> uses
  const steel = photo(ctx, 'Bridge-hero.webp', { alt: '', eager: true, sizes: '100vw' });
  const srcset = (steel.match(/srcset="([^"]+)"/) || [])[1];
  const src = (steel.match(/\ssrc="([^"]+)"/) || [])[1];
  const html = shell.page({
    ctx,
    path: '/',
    title: home.title,
    description: home.description,
    canonical: absUrl(ctx, '/'),
    og: { title: home.title, description: home.description, type: 'website' },
    bodyClass: 'h-page',
    main,
    crumbs: [],
    scripts: ['spray-tag.js'],
    preload: [
      { href: HERO_LG[1][1], as: 'image', type: 'image/webp', media: '(min-width: 760px)', imagesrcset: HERO_LG.map(([w, u]) => `${u} ${w}w`).join(', '), imagesizes: '(max-width: 1023px) 190vw, 100vw', fetchpriority: 'high' },
      { href: HERO_SM[1][1], as: 'image', type: 'image/webp', media: '(max-width: 759px)', imagesrcset: HERO_SM.map(([w, u]) => `${u} ${w}w`).join(', '), imagesizes: HERO_SM_SIZES, fetchpriority: 'high' },
    ],
  });
  return [{ path: '/', html }];
}
