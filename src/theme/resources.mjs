// resources.mjs - RESOURCES lane: /blog/ (The Insider), /blog/<cat>/ x5, /blog/<slug>/ and the guide template
// (/dispensary-guides/, /getting-a-medical-card/, /cannabis-laws-by-state/new-york/, /faq/, /terms-and-conditions/,
// /privacy-policy/, /accessibility-statement/). Copy comes from the WRITER lane: src/content/posts + src/content/guides.
// A missing post or guide renders an empty state in a lane build (ALLOW_MISSING_GEN=1); a final build fails on it, the
// same way gimg() fails on a missing image. Post dates are not real publication dates: they are never printed, and the
// Article JSON-LD carries no date and no author.
import { esc, escA, href, linkAttrs, gimg, hasGenerated, imgUrl, slugify, stripTags, absUrl, store } from './util.mjs';
import { page, crumbsHtml, icon, drip, mark, tag, ctaBand } from './shell.mjs';

const SITE = 'The Bridge';
const FALLBACK_ART = 'g-wall-night';
const FOOD = ['g-butter', 'g-honey', 'g-cat-edibles'];
const laneBuild = () => process.env.ALLOW_MISSING_GEN === '1';

const HOME = { href: '/', label: 'Home' };
const BLOG = { href: '/blog/', label: 'Blog' };

// One art moment per category (hero composition, hand tag, cut-out). Tag words come from the client's own vocabulary.
const CATS = {
  'cannabis-101': {
    kicker: 'Start here', tag: 'CONNECTED', color: 'blue', art: 'g-bud-key', front: 'g-leaf-cut', phase: 1,
    lede: 'The plant, the terms and the basics in plain language. Straight facts. No stigma.',
  },
  recipes: {
    kicker: 'From the kitchen', tag: 'ASTORIA', color: 'orange', stills: FOOD, phase: 2,
    lede: 'Kitchen projects for adults 21 and older, written step by step.',
  },
  culture: {
    kicker: 'Queens and beyond', tag: 'CULTURE', color: 'orange', art: 'g-wall-night', torch: 'g-piece', front: 'g-can', phase: 3,
    lede: 'Hip hop, community and social equity, and what they have to do with the plant.',
  },
  shopping: {
    kicker: 'Before you buy', tag: 'QUEENS', color: 'blue', art: 'g-bag', front: 'g-jar', phase: 0,
    lede: 'How to read a menu, what to ask at the counter and how to leave with what you came for.',
  },
  lifestyle: {
    kicker: 'Day to day', tag: 'COMMUNITY', color: 'blue', art: 'g-rain-glass', pane: true, phase: 4,
    lede: 'Everyday life with cannabis for adults 21 and older: hosting, habits and keeping it responsible.',
  },
};

// The seven guide pages. `mode` picks the composition; the words all come from src/content/guides/<slug>.json.
const GUIDES = [
  { slug: 'dispensary-guide', path: '/dispensary-guides/', label: 'Dispensary Guide', mode: 'walk', image: 'g-bag', tag: 'ASTORIA', front: 'g-jar' },
  { slug: 'medical-card', path: '/getting-a-medical-card/', label: 'Getting a Medical Card', mode: 'walk', image: 'g-papers-law', tag: 'EQUITY' },
  { slug: 'ny-laws', path: '/cannabis-laws-by-state/new-york/', label: 'New York Cannabis Laws', mode: 'law', image: 'g-papers-law', tag: 'QUEENS', front: 'g-truss' },
  { slug: 'faq', path: '/faq/', label: 'FAQ', mode: 'faq', image: 'g-rain-glass', tag: 'CONNECTED' },
  { slug: 'terms', path: '/terms-and-conditions/', label: 'Terms and Conditions', mode: 'legal' },
  { slug: 'privacy', path: '/privacy-policy/', label: 'Privacy Policy', mode: 'legal' },
  { slug: 'accessibility', path: '/accessibility-statement/', label: 'Accessibility Statement', mode: 'legal' },
];

// ---------- small helpers ----------
const pageTitle = (s) => `${String(s || '').replace(/\s*\|\s*The Bridge\s*$/i, '').trim()} | ${SITE}`;
const plain = (s) => stripTags(s).replace(/\s+/g, ' ').trim();
const pad = (n) => String(n).padStart(2, '0');
const catsOf = (ctx) => ctx.ia.blogCategories || [];
const catOf = (ctx, slug) => catsOf(ctx).find((c) => c.slug === slug);
const postPath = (p) => href(p.path || `/blog/${p.slug}/`);
const artId = (id) => (id && hasGenerated(id) ? id : FALLBACK_ART);
const art = (id, opts = {}) => gimg(artId(id), { alt: '', ...opts });
const ogImage = (ctx, id) => { const a = artId(id); return hasGenerated(a) ? absUrl(ctx, imgUrl(a, 1440)) : undefined; };

// H1 size tier by visible length, so a long article title still leaves the lede on a 1280x585 first screen.
const h1Tier = (s) => { const n = plain(s).length; return n <= 24 ? 'r-h1--s' : n <= 48 ? 'r-h1--m' : n <= 80 ? 'r-h1--l' : 'r-h1--xl'; };

// A copy string that may be plain text or trusted HTML: plain text is escaped, a bare ampersand never survives.
const inline = (s) => { const t = String(s ?? ''); return /<[a-z][^>]*>/i.test(t) ? t : t.replace(/&(?!#?\w+;)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); };
const asBlock = (s) => { const t = rewriteLinks(inline(s)); return /<(p|ul|ol|div|blockquote|h\d)\b/i.test(t) ? t : `<p>${t}</p>`; };

// Every link in writer HTML goes through linkAttrs: internal paths normalised, external links open in a new tab.
function rewriteLinks(html) {
  return String(html || '').replace(/<a\b([^>]*)>/gi, (m, at) => {
    const hit = /\shref=(["'])(.*?)\1/i.exec(at);
    if (!hit) return m;
    const rest = at.replace(hit[0], '').replace(/\s(target|rel)=(["']).*?\2/gi, '');
    return `<a${linkAttrs(hit[2].replace(/&amp;/g, '&'))}${rest}>`;
  });
}

// Wrap the last whole word of a blockquote in the hand-drawn marker. The text itself never changes.
function markLastWord(inner) {
  const cut = inner.search(/<(cite|footer)\b/i);
  const head = cut === -1 ? inner : inner.slice(0, cut);
  const tail = cut === -1 ? '' : inner.slice(cut);
  const parts = head.split(/(<[^>]+>)/);
  for (let i = parts.length - 1; i >= 0; i--) {
    if (parts[i].startsWith('<')) continue;
    const words = [...parts[i].matchAll(/(?<![&#A-Za-z0-9])[A-Za-z][A-Za-z'’-]{3,}(?![A-Za-z0-9;])/g)];
    if (!words.length) continue;
    const w = words[words.length - 1];
    parts[i] = parts[i].slice(0, w.index) + mark(w[0]) + parts[i].slice(w.index + w[0].length);
    return parts.join('') + tail;
  }
  return inner;
}

// Article body: ids on the h2s (for the table of contents), display blockquotes, normalised links.
function body(html) {
  const toc = [];
  const used = new Set();
  let out = String(html || '').replace(/<h2\b([^>]*)>([\s\S]*?)<\/h2>/gi, (m, at, inner) => {
    const label = plain(inner);
    const own = /\sid=["']([^"']+)["']/i.exec(at);
    let id = own ? own[1] : slugify(label) || `part-${toc.length + 1}`;
    if (!own) { const base = id; let n = 2; while (used.has(id)) id = `${base}-${n++}`; }
    used.add(id);
    toc.push({ id, label });
    return `<h2${own ? at : `${at} id="${escA(id)}"`}>${inner}</h2>`;
  });
  out = out.replace(/<blockquote\b[^>]*>([\s\S]*?)<\/blockquote>/gi, (m, inner) => `<blockquote class="r-q${plain(inner).length > 150 ? ' r-q--long' : ''}">${markLastWord(inner)}</blockquote>`);
  return { html: rewriteLinks(out), toc };
}

const tocNav = (items) => (items.length < 2 ? '' : `<nav class="r-toc" aria-label="On this page">
<p class="r-toc__h">On this page</p>
<ol class="r-toc__list" role="list">${items.map((t) => `<li><a class="r-toc__a" href="#${escA(t.id)}">${esc(t.label)}</a></li>`).join('')}</ol>
</nav>`);

function sourcesBlock(list, { id = 'sources' } = {}) {
  const items = (list || []).filter((s) => s && s.url);
  if (!items.length) return '';
  return `<section class="r-sources" id="${id}" aria-labelledby="${id}-h" data-reveal>
<h2 class="r-sources__h" id="${id}-h">Sources</h2>
<ol class="r-sources__list" role="list">${items.map((s) => `<li><a class="r-sources__a"${linkAttrs(s.url)}><span>${esc(s.label || s.url)}</span>${icon('ext', 'r-sources__ico')}</a></li>`).join('')}</ol>
</section>`;
}

const closing = (ctx) => ctaBand(ctx, {
  kicker: 'The Bridge, Astoria',
  title: 'Shop Now',
  text: `Order online or visit us at ${ctx.site.address.oneLine}.`,
  buttons: [
    { label: 'Shop Now', href: store(ctx), cls: 'btn--paint', icon: 'ext' },
    { label: 'Visit Astoria', href: '/dispensaries/astoria/', cls: 'btn--ghost' },
  ],
});

// ---------- cards ----------
const CARD_SIZES = {
  xl: '(min-width: 1024px) 58vw, 100vw',
  l: '(min-width: 1024px) 64vw, 100vw',
  w: '(min-width: 1024px) 92vw, 100vw',
  m: '(min-width: 1024px) 40vw, (min-width: 640px) 50vw, 100vw',
  s: '(min-width: 1024px) 31vw, (min-width: 640px) 50vw, 45vw',
};
// The same image on one page gets a different crop or a mirror, so a small art set does not look repeated.
function varyImage(seen, id) {
  const n = seen.get(id) || 0;
  seen.set(id, n + 1);
  return n ? ` r-vary-${((n - 1) % 3) + 1}` : '';
}

function card(ctx, post, { size = 's', drop = 0, h = 3, i = 0, seen = new Map(), image, label, link, text } = {}) {
  const cat = catOf(ctx, post.category);
  const id = artId(image || post.image);
  const lab = label || (cat ? cat.label : '');
  const glassy = size === 'xl' || size === 'l' || size === 'w';
  const desc = text != null ? text : (size === 's' ? '' : plain(post.description || post.lede || ''));
  const words = `${lab ? `<p class="r-label r-card__cat">${esc(lab)}</p>` : ''}<h${h} class="r-card__title">${esc(post.h1 || post.title)}</h${h}>${desc ? `<p class="r-card__text">${esc(desc)}</p>` : ''}`;
  return `<article class="r-card r-card--${size}${drop ? ` r-drop-${drop}` : ''}" data-reveal style="--i:${i % 4}">
<a class="r-card__link"${linkAttrs(link || postPath(post))}>
<div class="r-card__media"><div class="r-card__frame${varyImage(seen, id)}">${gimg(id, { alt: '', sizes: CARD_SIZES[size], cls: 'r-card__img' })}</div></div>
<div class="r-card__body${glassy ? ' r-card__pane glass' : ''}">${glassy ? `<div class="r-card__inner">${words}</div>` : words}</div>
</a>
</article>`;
}

// Rows that always fill the 12-column grid, whatever the post count. `phase` rotates the rhythm, so the category pages
// do not look cloned. Each entry: [size, drop].
const ROW = {
  a: [['xl', 0], ['m', 2]],
  b: [['s', 0], ['s', 2], ['s', 1]],
  c: [['m', 1], ['xl', 0]],
  d: [['l', 0], ['s', 3]],
  e: [['s', 1], ['l', 0]],
};
const RHYTHM = ['a', 'b', 'c', 'b', 'd', 'b', 'e', 'b'];
function layout(n, phase = 0) {
  const out = [];
  let left = n;
  let k = phase;
  while (left > 0) {
    let row;
    if (left === 1) row = [['w', 0]];
    else if (left === 2 || left === 4) row = ROW[RHYTHM[k % RHYTHM.length] === 'b' ? (k % 4 === 1 ? 'c' : 'd') : RHYTHM[k % RHYTHM.length]];
    else if (left === 3) row = ROW.b;
    else row = ROW[RHYTHM[k % RHYTHM.length]];
    out.push(...row);
    left -= row.length;
    k++;
  }
  return out;
}

function grid(ctx, posts, { phase = 0, h = 3, seen = new Map(), imageOf } = {}) {
  const shape = layout(posts.length, phase);
  return `<div class="r-grid">${posts.map((p, i) => card(ctx, p, { size: shape[i][0], drop: shape[i][1], h, i, seen, image: imageOf ? imageOf(p, i) : undefined })).join('\n')}</div>`;
}

function tabs(ctx, current) {
  const items = [{ href: '/blog/', label: 'All stories', slug: '' }, ...catsOf(ctx).map((c) => ({ href: `/blog/${c.slug}/`, label: c.label, slug: c.slug }))];
  return `<nav class="r-tabs" aria-label="Blog categories"><ul class="r-tabs__list" role="list">${items.map((t) => `<li><a class="r-tab${t.slug === current ? ' is-on' : ''}"${linkAttrs(t.href, t.slug === current ? { 'aria-current': 'page' } : {})}>${esc(t.label)}</a></li>`).join('')}</ul></nav>`;
}

const emptyState = (text, link = '') => `<div class="r-empty" data-reveal><p class="r-empty__t">${esc(text)}</p>${link}</div>`;

// ---------- /blog/ ----------
function hubPage(ctx, posts) {
  const path = '/blog/';
  const crumbs = [HOME, { label: 'Blog' }];
  const lead = posts.find((p) => p.featured) || posts[0] || null;
  const rest = posts.filter((p) => p !== lead);
  const seen = new Map();
  if (lead) seen.set(artId(lead.image), 1);
  const leadCat = lead ? catOf(ctx, lead.category) : null;
  const first = rest.slice(0, 8);
  const more = rest.slice(8);
  const description = 'The Insider is the blog of The Bridge in Astoria, Queens: cannabis basics, recipes, news and culture, shopping and everyday life.';
  const title = pageTitle('The Insider');
  const leadHtml = lead ? `<article class="r-lead glass" data-reveal style="--i:3">
<div class="r-lead__in">
${leadCat ? `<p class="r-label">${esc(leadCat.label)}</p>` : ''}
<h2 class="r-lead__title"><a${linkAttrs(postPath(lead))}>${esc(lead.h1 || lead.title)}</a></h2>
<p class="r-lead__text">${esc(plain(lead.description || lead.lede || ''))}</p>
<a class="btn btn--paint btn--sm"${linkAttrs(postPath(lead), { 'aria-label': `Read: ${plain(lead.h1 || lead.title)}` })}>Read the story</a>
</div>
</article>` : '';
  const main = `<section class="band band--void r-hub" data-spot>
<div class="band__clip">
<div class="r-hub__art" data-depth="-0.05">${art(lead ? lead.image : FALLBACK_ART, { sizes: '100vw', eager: true, cls: 'r-hub__img' })}</div>
<span class="r-key" aria-hidden="true"></span>
<span class="grain" aria-hidden="true"></span>
${tag('QUEENS', { color: 'blue', cls: 'r-hub__tag' })}
</div>
<div class="wrap wrap--wide r-hub__in">
${crumbsHtml(crumbs)}
<p class="kicker" data-reveal>The Bridge blog</p>
<h1 class="display display--mega r-hub__h1" data-reveal style="--i:1">The <span class="accent">Insider</span></h1>
<p class="lede r-hub__lede" data-reveal style="--i:2">Straight talk from Astoria on cannabis, cooking, culture and shopping in New York.</p>
${leadHtml}
</div>
</section>
<section class="band band--coal r-feed" aria-labelledby="r-feed-h">
<div class="wrap wrap--wide">
<div class="r-feed__head">
<h2 class="display r-feed__h" id="r-feed-h" data-reveal>Every <span class="outline">story</span></h2>
${tabs(ctx, '')}
</div>
${first.length ? grid(ctx, first, { seen }) : emptyState(lead ? 'More stories are on the way.' : 'The first stories are on the way.')}
</div>
</section>
${more.length ? `<section class="band band--paint r-paint">
<div class="wrap wrap--wide r-paint__in">
<p class="r-paint__line" data-reveal>Straight facts. No stigma.</p>
<a class="r-inkbtn"${linkAttrs('/facts/')}>Know Your Cannabis</a>
</div>
</section>
<section class="band band--coal r-feed r-feed--more" aria-label="More stories">
<div class="wrap wrap--wide">${grid(ctx, more, { phase: 2, seen })}</div>
</section>` : ''}
${closing(ctx)}`;
  return {
    path,
    html: page({
      ctx, path, title, description, canonical: absUrl(ctx, path), main, crumbs, heroCrumbs: true, bodyClass: 'r-page r-page--hub',
      og: { title, description, type: 'website', image: lead ? ogImage(ctx, lead.image) : undefined },
      jsonld: [{ '@context': 'https://schema.org', '@type': 'Blog', name: 'The Insider', url: absUrl(ctx, path), description, publisher: { '@type': 'Organization', name: ctx.site.fullName, url: ctx.site.origin } }],
    }),
  };
}

// ---------- /blog/<cat>/ ----------
function catMoment(ctx, cat, d, list) {
  // recipes: three food stills pasted across the right of the hero, the last one crossing the seam
  if (d.stills) {
    return {
      clip: `<span class="r-key" aria-hidden="true"></span>`,
      front: `<div class="r-stills" aria-hidden="true">${d.stills.map((id, i) => `<div class="r-still r-still--${i + 1}"${i === 1 ? ' data-depth="0.05"' : ''}>${gimg(id, { alt: '', sizes: '(min-width: 1024px) 26vw, 40vw', eager: i === 0 })}</div>`).join('')}</div>`,
    };
  }
  // culture: a wall in the dark, the piece shows only where the torch falls
  if (d.torch) {
    return {
      attrs: ' data-torch',
      clip: `<div class="r-cat__wall">${art(d.art, { sizes: '100vw', eager: true })}</div><div class="r-cat__torch" data-torch-layer>${gimg(d.torch, { alt: '', sizes: '100vw' })}</div>`,
      front: `<div class="r-cat__front cut protrude" data-depth="0.06">${gimg(d.front, { alt: '', sizes: '(min-width: 1024px) 22vw, 30vw' })}</div>`,
    };
  }
  // lifestyle: a pane of smoked glass sliding over a wet window, listing what is in this section
  if (d.pane) {
    const top = list.slice(0, 3);
    return {
      clip: `<div class="r-cat__wide">${art(d.art, { sizes: '100vw', eager: true })}</div>`,
      front: top.length ? `<div class="r-cat__pane glass glass--strong" data-reveal style="--i:3"><div class="r-cat__pane-in">
<p class="r-label">In this section</p>
<ul class="r-cat__links" role="list">${top.map((p) => `<li><a class="r-cat__link"${linkAttrs(postPath(p))}>${esc(p.h1 || p.title)}</a></li>`).join('')}</ul>
</div></div>` : '',
    };
  }
  // cannabis 101 and shopping: one lit still on the right, a cut-out crossing the seam
  return {
    clip: `<div class="r-cat__art" data-depth="-0.05">${art(d.art, { sizes: '(min-width: 1024px) 70vw, 100vw', eager: true })}</div><span class="r-key" aria-hidden="true"></span>`,
    front: `<div class="r-cat__front cut protrude" data-depth="0.06">${gimg(d.front, { alt: '', sizes: '(min-width: 1024px) 22vw, 30vw' })}</div>`,
  };
}

function catPage(ctx, cat, posts) {
  const path = `/blog/${cat.slug}/`;
  const d = CATS[cat.slug] || { kicker: 'The Insider', tag: 'CULTURE', color: 'blue', art: FALLBACK_ART, lede: '', phase: 0 };
  const list = posts.filter((p) => p.category === cat.slug);
  const crumbs = [HOME, BLOG, { label: cat.label }];
  const title = pageTitle(cat.label);
  const description = `${cat.label} on The Insider, the blog of The Bridge in Astoria, Queens. ${d.lede}`.trim();
  const moment = catMoment(ctx, cat, d, list);
  // Recipes shows food stills: a recipe card whose image is not food gets the next still.
  let foodI = 0;
  const imageOf = cat.slug === 'recipes' ? (p) => (FOOD.includes(p.image) ? p.image : FOOD[foodI++ % FOOD.length]) : undefined;
  const main = `<section class="band band--void r-cat r-cat--${escA(cat.slug)}" data-spot${moment.attrs || ''}>
<div class="band__clip">
${moment.clip}
<span class="r-cat__scrim" aria-hidden="true"></span>
<span class="grain" aria-hidden="true"></span>
${tag(d.tag, { color: d.color, cls: 'r-cat__tag' })}
</div>
<div class="wrap wrap--wide r-cat__in">
<div class="r-cat__words">
${crumbsHtml(crumbs)}
<p class="kicker" data-reveal>${esc(d.kicker)}</p>
<h1 class="display r-cat__h1 ${h1Tier(cat.label)}" data-reveal style="--i:1">${esc(cat.label)}</h1>
<p class="lede r-cat__lede" data-reveal style="--i:2">${esc(d.lede)}</p>
</div>
</div>
${moment.front}
</section>
<section class="band band--coal r-feed r-feed--cat r-feed--${escA(cat.slug)}" aria-label="${escA(cat.label)} stories">
<div class="wrap wrap--wide">
${tabs(ctx, cat.slug)}
${list.length ? grid(ctx, list, { phase: d.phase, h: 2, imageOf }) : emptyState('Nothing in this section yet.', `<a class="link-arrow"${linkAttrs('/blog/')}>Back to The Insider</a>`)}
</div>
</section>
${closing(ctx)}`;
  return {
    path,
    html: page({
      ctx, path, title, description, canonical: absUrl(ctx, path), main, crumbs, heroCrumbs: true, bodyClass: `r-page r-page--cat`,
      og: { title, description, type: 'website', image: ogImage(ctx, d.art || FOOD[0]) },
      jsonld: [{ '@context': 'https://schema.org', '@type': 'CollectionPage', name: `${cat.label} | The Insider`, url: absUrl(ctx, path), description, isPartOf: { '@type': 'Blog', name: 'The Insider', url: absUrl(ctx, '/blog/') } }],
    }),
  };
}

// ---------- shared hero: the image lost in shadow, the H1 straight on its ground ----------
const seedOf = (t) => [...String(t)].reduce((n, c) => (n * 31 + c.charCodeAt(0)) % 997, 7);
function shadowHero({ crumbsHtmlStr, kicker, h1, lede, image, tagWord, tagColor = 'blue', front, cls = '', after = '' }) {
  return `<section class="band band--void r-phero ${cls}" data-spot>
<div class="band__clip">
<div class="r-phero__art" data-depth="-0.05">${art(image, { sizes: '(min-width: 1024px) 72vw, 100vw', eager: true })}</div>
<span class="r-key" aria-hidden="true"></span>
<span class="r-phero__scrim" aria-hidden="true"></span>
<span class="grain" aria-hidden="true"></span>
${tagWord ? tag(tagWord, { color: tagColor, cls: 'r-phero__tag' }) : ''}
</div>
<div class="wrap wrap--wide r-phero__in">
${crumbsHtmlStr}
${kicker ? `<p class="kicker" data-reveal>${esc(kicker)}</p>` : ''}
<h1 class="display r-phero__h1 ${h1Tier(h1)}" data-reveal style="--i:1">${esc(h1)}</h1>
${lede ? `<p class="lede r-phero__lede" data-reveal style="--i:2">${inline(lede)}</p>` : ''}
${after}
</div>
${front ? `<div class="r-phero__front cut protrude" data-depth="0.05">${gimg(front, { alt: '', sizes: '(min-width: 1200px) 18vw, 1px' })}</div>` : ''}
${drip({ w: 300, h: 110, color: 'var(--orange)', cls: 'r-phero__drip', seed: seedOf(h1) })}
</section>`;
}

// ---------- /blog/<slug>/ ----------
function relatedOf(post, posts) {
  const bySlug = new Map(posts.map((p) => [p.slug, p]));
  const out = [];
  const push = (p) => { if (p && p.slug !== post.slug && !out.includes(p) && out.length < 3) out.push(p); };
  (post.related || []).forEach((s) => push(bySlug.get(s)));
  posts.filter((p) => p.category === post.category).forEach(push);
  posts.forEach(push);
  return out;
}

// The category crumb stays a link, even though it is the last one shown: Home / Blog / Category.
function postCrumbs(cat) {
  const shown = [HOME, BLOG];
  if (cat) shown.push({ href: `/blog/${cat.slug}/`, label: cat.label });
  const raw = crumbsHtml(shown);
  if (!cat) return raw;
  return raw.replace(/<span[^>]*>([^<]*)<\/span>(\s*(?:<\/li>\s*<\/ol>\s*)?<\/nav>)\s*$/, (m, label, end) => `<a${linkAttrs(`/blog/${cat.slug}/`)}>${label}</a>${end}`);
}

function postPage(ctx, post, posts) {
  const path = postPath(post);
  const cat = catOf(ctx, post.category);
  const h1 = post.h1 || post.title;
  const crumbs = [HOME, BLOG, ...(cat ? [{ href: `/blog/${cat.slug}/`, label: cat.label }] : []), { label: plain(h1) }];
  const d = (cat && CATS[cat.slug]) || {};
  const { html, toc } = body(post.html);
  const sources = (post.sources || []).filter((s) => s && s.url);
  const tocItems = [...toc, ...(sources.length ? [{ id: 'sources', label: 'Sources' }] : [])];
  const related = relatedOf(post, posts);
  const title = pageTitle(post.title || h1);
  const description = plain(post.description || post.lede || h1);
  const isRecipe = post.category === 'recipes';
  const main = `${shadowHero({ crumbsHtmlStr: postCrumbs(cat), kicker: post.kicker, h1, lede: post.lede, image: post.image, tagWord: d.tag, tagColor: d.color, front: d.front, cls: `r-phero--${post.category || 'post'}` })}
<section class="band band--coal r-article">
<div class="wrap r-article__grid${tocItems.length < 2 ? ' r-article__grid--solo' : ''}">
${tocNav(tocItems)}
<article class="r-article__col">
<div class="r-read">${html}</div>
${isRecipe ? `<p class="r-disclaimer" data-reveal>${esc(ctx.site.disclaimer)}</p>` : ''}
${sourcesBlock(sources)}
</article>
</div>
</section>
${related.length ? `<section class="band band--void r-related" aria-labelledby="r-related-h">
<div class="wrap wrap--wide">
<h2 class="display r-related__h" id="r-related-h" data-reveal>Keep <span class="accent">reading</span></h2>
<div class="r-grid r-grid--3">${related.map((p, i) => card(ctx, p, { size: 's', h: 3, i })).join('\n')}</div>
</div>
</section>` : ''}
${closing(ctx)}`;
  const url = absUrl(ctx, path);
  const image = ogImage(ctx, post.image);
  return {
    path,
    html: page({
      ctx, path, title, description, canonical: url, main, crumbs, heroCrumbs: true, bodyClass: `r-page r-page--post`,
      og: { title, description, type: 'article', image },
      // No author and no date: nothing in the capture supports either.
      jsonld: [{ '@context': 'https://schema.org', '@type': 'Article', headline: plain(h1), description, mainEntityOfPage: url, url, ...(image ? { image } : {}), publisher: { '@type': 'Organization', name: ctx.site.fullName, url: ctx.site.origin } }],
    }),
  };
}

// ---------- guides ----------
// Guide `items` are free form: a string, or an object with any of the usual keys. Reduced to { title, html, source }.
function normItem(it) {
  if (typeof it === 'string') return { html: inline(it) };
  const o = it || {};
  const title = o.title || o.heading || o.name || o.term || '';
  const text = o.html || o.text || o.fact || o.body || o.line || o.statement || o.claim || o.a || '';
  const s = o.source || (Array.isArray(o.sources) ? o.sources[0] : null) || null;
  const url = o.url || o.href || o.link || o.sourceUrl || o.source_url || (s && typeof s === 'object' ? s.url || s.href : (typeof s === 'string' && /^https?:/.test(s) ? s : '')) || '';
  const label = o.sourceLabel || o.source_label || (s && typeof s === 'object' ? s.label || s.name || s.title : (typeof s === 'string' && !/^https?:/.test(s) ? s : '')) || o.label || '';
  return { title: o.q ? '' : title, q: o.q || '', html: rewriteLinks(inline(text)), source: url ? { url, label: label || url } : null };
}

function faqList(items) {
  return `<div class="faq r-faq">${items.map((f) => `<details data-reveal><summary>${esc(plain(f.q))}</summary><div class="faq__a">${asBlock(f.a || f.html || f.text || '')}</div></details>`).join('\n')}</div>`;
}
// { group, q, a } in source order -> [{ name, id, items }]; items with no group share one nameless group.
function faqGroups(items) {
  const out = [];
  for (const f of items) {
    const name = f.group ? plain(f.group) : '';
    let g = out.find((x) => x.name === name);
    if (!g) { g = { name, id: name ? `q-${slugify(name)}` : '', items: [] }; out.push(g); }
    g.items.push(f);
  }
  return out;
}
const faqLd = (items) => ({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: items.map((f) => ({ '@type': 'Question', name: plain(f.q), acceptedAnswer: { '@type': 'Answer', text: plain(f.a || f.html || f.text || '') } })) });

// Law page: numbered facts, the official source link beside each. The number runs across sections.
function factList(items, counter) {
  return `<ol class="r-facts" role="list">${items.map((n) => {
    counter.n += 1;
    return `<li class="r-fact" data-reveal>
<span class="r-fact__n" aria-hidden="true">${pad(counter.n)}</span>
<div class="r-fact__t">${n.title ? `<h3 class="r-fact__h">${esc(n.title)}</h3>` : ''}<div class="r-fact__b">${asBlock(n.html)}</div></div>
${n.source ? `<p class="r-fact__s"><span class="r-label">Official source</span><a class="r-fact__a"${linkAttrs(n.source.url)}><span>${esc(n.source.label)}</span>${icon('ext', 'r-sources__ico')}</a></p>` : ''}
</li>`;
  }).join('\n')}</ol>`;
}

function itemList(items) {
  if (items.some((n) => n.title)) {
    return `<ul class="r-items" role="list">${items.map((n, i) => `<li class="r-item glass glass--lift" data-reveal style="--i:${i % 4}"><div class="r-item__in">${n.title ? `<h3 class="r-item__h">${esc(n.title)}</h3>` : ''}<div class="r-item__b">${asBlock(n.html)}</div>${n.source ? `<a class="link-arrow"${linkAttrs(n.source.url)}>${esc(n.source.label)}</a>` : ''}</div></li>`).join('\n')}</ul>`;
  }
  return `<ul class="r-bullets">${items.map((n) => `<li>${n.html}${n.source ? ` <a${linkAttrs(n.source.url)}>${esc(n.source.label)}</a>` : ''}</li>`).join('')}</ul>`;
}

function sectionsHtml(guide, mode) {
  const counter = { n: 0 };
  const toc = [];
  const faqs = [];
  const used = new Set();
  let stepN = 0;
  const secs = (guide.sections || []).map((s, i) => {
    const heading = s.heading ? plain(s.heading) : '';
    let id = '';
    if (heading) {
      const base = slugify(heading) || `part-${i + 1}`;
      id = base;
      let n = 2;
      while (used.has(id)) id = `${base}-${n++}`;
      used.add(id);
      toc.push({ id, label: heading });
    }
    const items = (s.items || []).map(normItem);
    const asked = (s.items || []).filter((x) => x && x.q);
    faqs.push(...asked);
    const rest = items.filter((n) => !n.q);
    const { html } = body(s.html);
    let itemsHtml = '';
    if (asked.length) itemsHtml += faqList(asked);
    if (rest.length) itemsHtml += mode === 'law' || rest.some((n) => n.source && !n.title) ? factList(rest, counter) : itemList(rest);
    const numbered = mode === 'walk' && heading;
    if (numbered) stepN += 1;
    return `<section class="r-gsec r-gsec--${mode}"${id ? ` id="${escA(id)}"` : ''}>
${numbered ? `<div class="r-gsec__n" aria-hidden="true" data-reveal>${pad(stepN)}</div>` : ''}
<div class="r-gsec__b">
${heading ? `<h2 class="r-gsec__h" data-reveal>${esc(heading)}</h2>` : ''}
${s.html ? `<div class="r-read" data-reveal>${html}</div>` : ''}
${itemsHtml}
</div>
</section>`;
  });
  return { secs, toc, faqs };
}

// Cross links between the guides, with image cards.
function nextGuides(ctx, def) {
  const others = GUIDES.filter((g) => g.mode !== 'legal' && g.slug !== def.slug && ctx.guides[g.slug]);
  const list = others.slice(0, 3);
  if (!list.length) return '';
  return `<section class="band band--void r-related" aria-labelledby="r-next-h">
<div class="wrap wrap--wide">
<h2 class="display r-related__h" id="r-next-h" data-reveal>Keep <span class="accent">going</span></h2>
<div class="r-grid r-grid--3">${list.map((g, i) => card(ctx, { h1: ctx.guides[g.slug].h1 || ctx.guides[g.slug].title || g.label, image: ctx.guides[g.slug].image || g.image }, { size: 's', h: 3, i, link: g.path, label: 'Guide', text: '' })).join('\n')}</div>
</div>
</section>`;
}

function missingGuide(ctx, def) {
  if (!laneBuild()) throw new Error(`guide missing: src/content/guides/${def.slug}.json (${def.path})`);
  const crumbs = [HOME, { label: def.label }];
  const title = pageTitle(def.label);
  const description = `${def.label} from The Bridge in Astoria, Queens.`;
  return {
    path: def.path,
    html: page({
      ctx, path: def.path, title, description, canonical: absUrl(ctx, def.path), crumbs, heroCrumbs: true, bodyClass: 'r-page r-page--guide', og: { title, description, type: 'website' },
      main: `${shadowHero({ crumbsHtmlStr: crumbsHtml(crumbs), h1: def.label, image: def.image, tagWord: def.tag })}
<section class="band band--coal r-article"><div class="wrap">${emptyState('This page is being written.')}</div></section>`,
    }),
  };
}

function guidePage(ctx, def) {
  const g = ctx.guides[def.slug];
  if (!g) return missingGuide(ctx, def);
  const path = def.path;
  const h1 = g.h1 || g.title || def.label;
  const crumbs = [HOME, { label: def.label }];
  const title = pageTitle(g.title || def.label);
  const description = plain(g.description || g.lede || def.label);
  const { secs, toc, faqs } = sectionsHtml(g, def.mode);
  const faq = [...(g.faq || []), ...faqs];
  const hasFaqBlock = (g.faq || []).length > 0;
  const sources = (g.sources || []).filter((s) => s && s.url);
  const draft = g.draftNote ? `<div class="r-draft" role="note"><p class="r-draft__h">Draft</p><div class="r-draft__t">${asBlock(g.draftNote)}</div></div>` : '';
  const groups = hasFaqBlock ? faqGroups(g.faq) : [];
  const faqBlock = !hasFaqBlock ? '' : (def.mode === 'faq'
    ? groups.map((x) => `<section class="r-gsec r-gsec--faq"${x.id ? ` id="${escA(x.id)}"` : ''}>${x.name ? `<h2 class="r-gsec__h" data-reveal>${esc(x.name)}</h2>` : ''}${faqList(x.items)}</section>`).join('\n')
    : `<section class="r-gsec r-gsec--faq" id="questions"><h2 class="r-gsec__h" data-reveal>Questions</h2>${faqList(g.faq)}</section>`);
  const tocItems = [...toc, ...(hasFaqBlock && def.mode !== 'faq' ? [{ id: 'questions', label: 'Questions' }] : []), ...(sources.length ? [{ id: 'sources', label: 'Sources' }] : [])];
  const jsonld = faq.length ? [faqLd(faq)] : [];
  let main;

  if (def.mode === 'legal') {
    main = `<section class="band band--void r-legalhero">
<div class="wrap wrap--narrow">
${crumbsHtml(crumbs)}
${g.kicker ? `<p class="kicker">${esc(g.kicker)}</p>` : ''}
<h1 class="display r-legalhero__h1">${esc(h1)}</h1>
${g.lede ? `<p class="lede r-legalhero__lede">${inline(g.lede)}</p>` : ''}
${draft}
</div>
</section>
<section class="band band--coal r-legal">
<div class="wrap wrap--narrow">
${secs.join('\n')}
${faqBlock}
${sourcesBlock(sources)}
</div>
</section>`;
  } else {
    const hero = shadowHero({
      crumbsHtmlStr: crumbsHtml(crumbs), kicker: g.kicker, h1, lede: g.lede, image: g.image || def.image, tagWord: def.tag, front: def.front,
      cls: `r-phero--${def.mode} r-phero--${def.slug}`, after: draft,
    });
    if (def.mode === 'faq') {
      main = `${hero}
<section class="band band--coal r-faqs">
<div class="wrap r-faqs__grid">
<aside class="r-faqs__side" aria-label="Questions by topic">
<div class="r-faqs__print">${gimg('g-mic', { alt: '', sizes: '(min-width: 1024px) 24vw, 1px' })}</div>
${groups.filter((x) => x.id).map((x) => `<a class="link-arrow"${linkAttrs(`#${x.id}`)}>${esc(x.name)}</a>`).join('\n')}
</aside>
<div class="r-faqs__col">
${faqBlock}
${secs.join('\n')}
${sourcesBlock(sources)}
</div>
</div>
</section>
${nextGuides(ctx, def)}
${closing(ctx)}`;
    } else if (def.mode === 'law') {
      main = `${hero}
<section class="band band--coal r-law">
<div class="wrap">
${secs.join('\n')}
${faqBlock}
${sourcesBlock(sources)}
</div>
</section>
${nextGuides(ctx, def)}
${closing(ctx)}`;
    } else {
      main = `${hero}
<section class="band band--coal r-article r-article--guide">
<div class="wrap r-article__grid${tocItems.length < 2 ? ' r-article__grid--solo' : ''}">
${tocNav(tocItems)}
<div class="r-article__col">
${secs.join('\n')}
${faqBlock}
${sourcesBlock(sources)}
</div>
</div>
</section>
${nextGuides(ctx, def)}
${closing(ctx)}`;
    }
  }
  return {
    path,
    html: page({
      ctx, path, title, description, canonical: absUrl(ctx, path), main, crumbs, heroCrumbs: true, bodyClass: `r-page r-page--guide r-page--${def.mode}`,
      og: { title, description, type: 'website', image: def.mode === 'legal' ? undefined : ogImage(ctx, g.image || def.image) }, jsonld,
    }),
  };
}

// ---------- render ----------
export async function render(ctx) {
  const posts = ctx.posts || [];
  if (!posts.length && !laneBuild()) throw new Error('no posts in src/content/posts');
  ctx.guides = ctx.guides || {};
  for (const c of catsOf(ctx)) if (!posts.some((p) => p.category === c.slug)) console.warn(`warning: blog category without posts: ${c.slug}`);
  return [
    hubPage(ctx, posts),
    ...catsOf(ctx).map((c) => catPage(ctx, c, posts)),
    ...posts.map((p) => postPage(ctx, p, posts)),
    ...GUIDES.map((g) => guidePage(ctx, g)),
  ];
}
