// pages.mjs - PAGES lane: /about-us/ /facts/ /events/ /media/ /contact/ /dispensaries/astoria/ /careers/ /404.html.
// Every captured word comes out of ctx.content (src/content/pages/*.json); nothing is retyped here. New copy exists only on
// the 404 page and as form labels for /careers/, and states no business fact.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../lib/paths.mjs';
import { esc, escA, linkAttrs, gimg, photo, absUrl, store, sec, byCls, demoForm } from './util.mjs';
import { page, crumbsHtml, icon, hoursHtml, drip, mark, tag, spray } from './shell.mjs';

// ---------- captured-data helpers ----------
const picks = (s, t) => (s.blocks || []).filter((b) => b.tag === t);
const pick = (s, t, i = 0) => picks(s, t)[i];
const withCls = (s, c) => (s.blocks || []).filter((b) => (b.cls || '').split(/\s+/).includes(c));
const hasPhoto = (file) => fs.existsSync(path.join(ROOT, 'assets/photos', file));

// Captured links point at the old flat files ("./contact.html"): ia.json redirects holds the new path.
const internal = (ctx, h) => {
  const m = String(h || '').match(/^\.\/([\w-]+\.html)$/);
  return m ? ctx.ia.redirects['/' + m[1]] || h : h;
};
// "Browse the Shop →": the word part and the captured arrow, so the arrow can move on hover.
const linkInner = (t) => {
  const m = String(t).match(/^([\s\S]*?)\s*([→↗])\s*$/);
  return m ? `${esc(m[1])}${icon(m[2] === '→' ? 'arrow' : 'ext')}` : esc(t);
};
const linkTo = (ctx, b, cls = 'btn btn--paint') => `<a${linkAttrs(internal(ctx, b.href), { class: cls })}>${linkInner(b.text)}</a>`;
const textLink = (ctx, b, cls = '') => linkTo(ctx, b, `link-arrow p-tlink ${cls}`.trim());

// One accent per heading, on a word the capture already has.
const accentLast = (t, cls = 'accent') => {
  const m = String(t).match(/^([\s\S]*\s)(\S+)$/);
  return m ? `${esc(m[1])}<span class="${cls}">${esc(m[2])}</span>` : esc(t);
};
const accentWord = (t, word, cls = 'accent') => esc(t).replace(esc(word), `<span class="${cls}">${esc(word)}</span>`);
const noEmoji = (t) => String(t).replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '').trim();
const rich = (s) => (/<[a-z]/i.test(String(s)) ? String(s) : esc(s));

const kicker = (t, attr = 'data-reveal') => `<p class="kicker" ${attr}>${esc(t)}</p>`;
const pool = (cls) => `<div class="p-pool ${cls}"></div>`;
const drawnArrow = '<svg class="p-draw" viewBox="0 0 64 24" aria-hidden="true"><path class="p-draw__base" d="M1 12h60M50 2l11 10-11 10"/><path class="p-draw__ink" pathLength="1" d="M1 12h60M50 2l11 10-11 10"/></svg>';

function mk(ctx, { path: p, title, description, crumbs, main, jsonld = [], bodyClass = '', preload = [] }) {
  const url = absUrl(ctx, p);
  return {
    path: p,
    html: page({ ctx, path: p, title, description, canonical: url, og: { title, description, type: 'website', url }, jsonld, bodyClass: `p-page ${bodyClass}`.trim(), main, crumbs, heroCrumbs: true, preload }),
  };
}

// Closing band: captured h3, sentence, links. mod picks the ground; each page passes its own art.
function closing(ctx, s, { mod = 'paint', bg = '', art = '', heading = null } = {}) {
  const h = pick(s, 'h3');
  const p = pick(s, 'p');
  const links = picks(s, 'a');
  const paint = mod === 'paint' || mod === 'strip';
  const cls = paint ? 'band--paint' : 'band--void';
  return `<section class="band ${cls} p-cta p-cta--${mod}">
${bg ? `<div class="band__clip">${bg}</div>` : ''}
${art}
<div class="wrap wrap--wide p-cta__in">
<h2 class="display p-cta__h" data-reveal>${heading || esc(h.text)}</h2>
<div class="p-cta__side" data-reveal style="--i:1">
<p class="p-cta__text">${esc(p.text)}</p>
<div class="btn-row">${links.map((b, i) => linkTo(ctx, b, i === 0 ? 'btn btn--paint' : paint ? 'btn btn--ghost' : 'btn btn--glass')).join('')}</div>
</div>
</div>
</section>`;
}

// ---------- /about-us/ ----------
function about(ctx) {
  const rec = ctx.content['about-us'];
  const [hero, havoc, ndica, diff, appr, bigger, cta] = rec.sections;
  const crumbs = [{ label: 'Home', href: '/' }, { label: 'About' }];
  const points = (appr.blocks || []).filter((b) => b.group === 'approach-item');
  const panes = [];
  for (let i = 0; i < points.length; i += 2) panes.push([points[i], points[i + 1]]);
  const biggerParas = withCls(bigger, 'story-text');
  const cut = hasPhoto('cut/mobb-deep-hell.webp');
  const main = `
<section class="band band--void p-hero p-ahero">
<div class="band__clip">
${photo(ctx, 'new-york-rappers.webp', { alt: '', cls: 'p-ahero__img', eager: true, sizes: '(max-width: 900px) 100vw, 74vw' })}
<div class="p-ahero__shade"></div>
${spray('orange-1', { cls: 'p-ahero__spray' })}
<div class="grain"></div>
</div>
<div class="wrap wrap--wide p-hero__in">
${crumbsHtml(crumbs)}
<p class="kicker" data-reveal>${esc(pick(hero, 'div').text)}</p>
<h1 class="display display--mega p-h1" data-reveal style="--i:1">${esc(pick(hero, 'h1').text)}</h1>
<p class="p-ahero__sub" data-reveal style="--i:2">${esc(pick(hero, 'p').text)}</p>
</div>
</section>

<section class="band band--coal p-havoc">
<div class="band__clip"><div class="grain"></div></div>
${drip({ w: 520, h: 150, color: 'var(--orange)', cls: 'p-havoc__drip' })}
<div class="wrap wrap--wide p-havoc__grid">
<div class="p-havoc__text">
<h2 class="display p-h2" data-reveal>${accentLast(byCls(havoc, 'story-title').text)}</h2>
<p class="p-body p-body--lead" data-reveal style="--i:2">${esc(byCls(havoc, 'story-text').text)}</p>
</div>
<figure class="p-havoc__fig">
<div class="p-havoc__photo p-zoom" data-reveal>${photo(ctx, 'Mobb-Deep.webp', { alt: 'Mobb Deep, black and white portrait under a concrete overpass', sizes: '(max-width: 900px) 100vw, 44vw' })}</div>
<p class="kicker p-figlabel">${esc(byCls(havoc, 'section-eyebrow').text)}</p>
<blockquote class="glass p-havoc__quote" data-reveal style="--i:2">${esc(byCls(havoc, 'line-txt').text)}</blockquote>
</figure>
</div>
</section>

<section class="band band--void p-ndica">
<div class="band__clip">${pool('p-pool--bl')}</div>
<div class="wrap wrap--wide">
<div class="p-ndica__grid">
<div class="p-ndica__side">
<div class="p-ndica__chip" data-reveal data-tilt>${photo(ctx, 'ndica.png', { alt: 'NDICA logo', sizes: '(max-width: 900px) 70vw, 380px' })}</div>
${kicker(byCls(ndica, 'section-eyebrow').text)}
</div>
<div class="p-ndica__text">
<h2 class="display p-h2" data-reveal style="--i:1">${accentLast(byCls(ndica, 'story-title').text, 'outline')}</h2>
<p class="p-body p-body--lead" data-reveal style="--i:2">${esc(byCls(ndica, 'story-text').text)}</p>
</div>
</div>
<div class="p-ledger" data-reveal>
<h3 class="p-ledger__h">${esc(pick(diff, 'h5').text)}</h3>
<p class="p-ledger__p">${esc(pick(diff, 'p').text)}</p>
${textLink(ctx, pick(diff, 'a'), 'p-ledger__a')}
</div>
</div>
</section>

<section class="band band--coal p-approach">
<div class="wrap wrap--wide">
<div class="p-approach__head">
<div>
<p class="kicker" data-reveal>${esc(byCls(appr, 'section-eyebrow').text)}</p>
<h2 class="display p-h2" data-reveal style="--i:1">${accentLast(byCls(appr, 'approach-title').text, 'outline')}</h2>
</div>
<p class="p-body p-body--lead" data-reveal style="--i:2">${esc(byCls(appr, 'approach-desc').text)}</p>
</div>
</div>
<div class="p-approach__stage">
<div class="band__clip">
${gimg('g-wall-night', { alt: '', cls: 'band__bg p-approach__bg' })}
${spray('orange-2', { cls: 'p-approach__spray' })}
${tag('COMMUNITY', { color: 'blue', cls: 'p-approach__tag' })}
</div>
<div class="wrap wrap--wide"><ul class="p-panes">
${panes.map(([h, p], i) => `<li class="glass glass--lift p-pane" data-reveal style="--i:${i}"><h3 class="p-pane__h">${esc(h.text)}</h3><p>${esc(p.text)}</p></li>`).join('\n')}
</ul></div>
</div>
<div class="wrap wrap--wide p-approach__after">
<blockquote class="p-bigquote" data-words="110">${esc(byCls(appr, 'approach-quote').text)}</blockquote>
<figure class="p-print" data-reveal data-tilt>
<span class="p-print__tape" aria-hidden="true"></span>
${photo(ctx, 'house.webp', { alt: 'Archive photo of the Queensbridge Houses under construction, a utility pole in front of a brick apartment block', sizes: '300px' })}
<figcaption>${esc(byCls(appr, 'image-caption').text)}</figcaption>
</figure>
</div>
</section>

<section class="band band--void p-bigger${cut ? ' p-bigger--cut' : ''}">
<div class="band__clip">${pool('p-pool--r')}<div class="grain"></div></div>
<div class="wrap wrap--wide p-bigger__grid">
<figure class="p-bigger__fig">
${cut ? photo(ctx, 'mobb-deep-hell.webp', { alt: '', cls: 'p-bigger__ghost', sizes: '(max-width: 900px) 92vw, 50vw' }) : ''}
<div class="p-bigger__frame" aria-hidden="true"></div>
${cut
    ? photo(ctx, 'cut/mobb-deep-hell.webp', { alt: 'Mobb Deep in front of a graffiti wall, the photo cut out so they step past its frame', cls: 'cut p-bigger__cut', sizes: '(max-width: 900px) 92vw, 50vw', attrs: { 'data-depth': '0.05' } })
    : photo(ctx, 'mobb-deep-hell.webp', { alt: 'Mobb Deep in front of a graffiti wall', cls: 'p-bigger__plain', sizes: '(max-width: 900px) 92vw, 50vw' })}
<p class="kicker p-figlabel p-figlabel--bl">${esc(byCls(bigger, 'section-eyebrow').text)}</p>
</figure>
<div class="p-bigger__text">
<h2 class="display p-h2" data-reveal style="--i:1">${accentWord(byCls(bigger, 'story-title').text, 'Bigger', 'outline')}</h2>
<p class="p-body" data-reveal style="--i:2">${esc(biggerParas[0].text)}</p>
<p class="p-body" data-reveal style="--i:3">${esc(biggerParas[1].text)}</p>
</div>
</div>
</section>

${closing(ctx, cta, { mod: 'paint' })}
`;
  return mk(ctx, { path: rec.path, title: rec.title, description: rec.description, crumbs, main, bodyClass: 'p-page--about' });
}

// ---------- /facts/ ----------
const splitLabel = (t) => {
  const m = String(t).match(/^([^:]{2,24}:)\s*([\s\S]*)$/);
  return m ? [m[1], m[2]] : ['', String(t)];
};
const rowHtml = (label, value) => `<div class="p-rows__row"><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`;
const STRIKE = '<svg class="p-strike" viewBox="0 0 1000 90" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M6 58 C 130 26, 300 74, 480 44 S 800 18, 994 40"/></svg>';

function pbCards(s) {
  const titles = withCls(s, 'pb-card-title');
  const bodies = withCls(s, 'pb-card-text');
  return titles.map((t, i) => [t.text, bodies[i].text]);
}
const DOT = '<span class="p-dot" aria-hidden="true"></span>';

function facts(ctx) {
  const rec = ctx.content.facts;
  const [hero, word, science, myth, intro, sativa, indica, ruder, benefits, sides, how, cta] = rec.sections;
  const crumbs = [{ label: 'Home', href: '/' }, { label: 'Know Your Cannabis' }];
  const wordTitle = byCls(word, 'story-title').text.match(/^(.*?)\s*(".*")$/) || [null, byCls(word, 'story-title').text, ''];
  const wordParas = withCls(word, 'story-text');
  const myths = withCls(myth, 'accordion-button').map((b, i) => [b.text, withCls(myth, 'accordion-body')[i].text]);
  const nav = [['word', 'The Word Matters'], ['myth', 'Myth vs Fact'], ['strains', 'Know Your Strain'], ['benefits', 'Potential Benefits'], ['side-effects', 'Side Effects'], ['how-it-works', 'How It Works']];

  const strain = ({ id, s, photoFile, alt, rows, intro: lead, line, caption, side, nameCls }) => {
    const eyebrow = (s.blocks || []).find((b) => (b.cls || '').includes('section-eyebrow'));
    const h = (s.blocks || []).find((b) => b.tag === 'h2');
    return `<section class="band band--void p-strain p-strain--${side}" id="${id}">
<figure class="p-strain__media p-zoom">
${photo(ctx, photoFile, { alt, sizes: '(max-width: 900px) 100vw, 60vw' })}
<figcaption class="p-strain__cap">${esc(caption)}</figcaption>
</figure>
<div class="wrap wrap--wide p-strain__grid">
<div class="p-strain__text">
<p class="display ${nameCls} p-strain__name" data-reveal>${esc(eyebrow.text)}</p>
<h3 class="display p-h3-big" data-reveal style="--i:1">${esc(h.text)}</h3>
<p class="p-body" data-reveal style="--i:2">${esc(lead)}</p>
<dl class="p-rows" data-reveal style="--i:3">${rows.map(([l, v]) => rowHtml(l, v)).join('')}</dl>
<p class="p-line" data-reveal style="--i:4">${esc(line)}</p>
</div>
</div>
</section>`;
  };

  const sativaText = withCls(sativa, 'story-text').map((b) => b.text);
  const indicaText = withCls(indica, 'story-text').map((b) => b.text);
  const ruderText = withCls(ruder, 'story-text').map((b) => b.text);
  const howText = withCls(how, 'story-text').map((b) => b.text);
  const ecsPanes = howText.slice(1, 4).map((t) => {
    const m = t.match(/^(\w+\.)\s+([\s\S]*)$/);
    return m ? [m[1], m[2]] : ['', t];
  });
  const benefitDisc = picks(benefits, 'p').find((b) => !b.cls);
  const sideDisc = picks(sides, 'p').find((b) => !b.cls);

  const main = `
<section class="band band--void p-hero p-fhero">
<div class="band__clip">
${photo(ctx, 'know-your-cannabis.webp', { alt: '', cls: 'p-fhero__img', eager: true, sizes: '100vw' })}
<div class="p-fhero__shade"></div>
<div class="grain"></div>
</div>
<div class="wrap wrap--wide p-hero__in">
${crumbsHtml(crumbs)}
<p class="kicker" data-reveal>${esc(pick(hero, 'div').text)}</p>
<h1 class="display display--mega p-h1" data-reveal style="--i:1">${accentLast(pick(hero, 'h1').text)}</h1>
<p class="lede p-hero__lede" data-reveal style="--i:2">${esc(pick(hero, 'p').text)}</p>
</div>
</section>

<div class="p-facts">
<nav class="p-fnav" aria-label="On this page" data-p-fnav>
<div class="wrap wrap--wide"><ul class="p-fnav__list">
${nav.map(([id, label]) => `<li><a href="#${id}">${esc(label)}</a></li>`).join('')}
</ul></div>
</nav>

<section class="band band--void p-word p-anchor" id="word">
<div class="p-word__wall">
<div class="band__clip">
${gimg('g-wall-night', { alt: '', cls: 'band__bg p-word__bg' })}
<div class="p-word__shade"></div>
</div>
<div class="wrap wrap--wide">
<p class="kicker" data-reveal>${esc(byCls(word, 'section-eyebrow').text)}</p>
<h2 class="p-word__h" data-reveal style="--i:1"><span class="p-word__lead">${esc(wordTitle[1])}</span> <span class="p-word__giant">${esc(wordTitle[2])}${STRIKE}</span></h2>
</div>
</div>
<div class="wrap wrap--wide p-word__grid">
<div class="p-word__body">
<p class="p-body p-body--lead" data-reveal>${esc(wordParas[0].text)}</p>
<p class="p-body p-body--lead" data-reveal style="--i:1">${esc(wordParas[1].text)}</p>
<p class="p-line" data-reveal style="--i:2">${esc(byCls(word, 'line-txt').text)}</p>
</div>
<aside class="p-word__aside">
${spray('orange-2', { cls: 'p-word__spray' })}
<div class="glass p-word__pane" data-reveal style="--i:1">
<h3 class="p-pane__h p-pane__h--big">${esc(pick(science, 'h5').text)}</h3>
<p>${esc(pick(science, 'p').text)}</p>
</div>
</aside>
</div>
</section>

<section class="band band--coal p-myth p-anchor" id="myth">
<div class="wrap wrap--wide">
<h2 class="display p-h2 p-myth__h" data-reveal>${accentWord(byCls(myth, 'myth-title').text, 'FACT', 'accent')}</h2>
<div class="p-myth__grid">
${myths.map(([q, a], i) => {
    const [label, claim] = splitLabel(q);
    return `<article class="p-mythcard" data-reveal style="--i:${i % 2}">
<h3 class="p-mythcard__q"><span class="p-mythcard__tag">${esc(label)}</span> <span class="p-mythcard__claim">${esc(claim)}</span></h3>
<p class="p-body">${esc(a)}</p>
</article>`;
  }).join('\n')}
</div>
</div>
</section>

<div id="strains" class="p-anchor">
<section class="band band--void p-sintro">
<div class="band__clip">${pool('p-pool--tl')}</div>
<div class="wrap wrap--wide p-sintro__grid">
<div>
${kicker(byCls(intro, 'section-eyebrow').text)}
<h2 class="display p-h2 p-sintro__h" data-reveal style="--i:1">${accentWord(byCls(intro, 'story-title').text, 'Three', 'outline')}</h2>
</div>
<p class="p-body p-body--lead" data-reveal style="--i:2">${esc(byCls(intro, 'story-text').text)}</p>
</div>
</section>

${strain({
    id: 'sativa', s: sativa, photoFile: 'sativa-plant.webp', alt: 'Sativa cola with long narrow leaves, a blurred garden behind it', side: 'r', nameCls: 'outline',
    intro: sativaText[0], rows: sativaText.slice(1).map(splitLabel), line: byCls(sativa, 'line-txt').text, caption: byCls(sativa, 'image-caption').text,
  })}

${strain({
    id: 'indica', s: indica, photoFile: 'indica-bud.webp', alt: 'Macro photo of a dense indica bud with orange pistils on a dark blue ground', side: 'l', nameCls: 'accent',
    intro: byCls(indica, 'mid-txt').text,
    rows: [splitLabel(indicaText[1]), splitLabel(indicaText[2]), [pick(indica, 'b').text, indicaText[3]]],
    line: byCls(indica, 'line-txt').text, caption: byCls(indica, 'image-caption').text,
  })}

<section class="band band--coal p-ruder" id="ruderalis">
<div class="band__clip">${spray('orange-1', { cls: 'p-ruder__spray' })}</div>
<div class="p-ruder__art">${gimg('g-leaf-cut', { alt: 'A single cannabis fan leaf, rim-lit in orange', cls: 'cut p-ruder__leaf', sizes: '(max-width: 900px) 46vw, 420px', attrs: { 'data-depth': '0.08' } })}</div>
<div class="wrap wrap--wide p-ruder__grid">
<div class="p-ruder__text">
<p class="display outline p-strain__name" data-reveal>${esc(byCls(ruder, 'section-eyebrow').text)}</p>
<h3 class="display p-h3-big" data-reveal style="--i:1">${accentWord(byCls(ruder, 'story-title').text, 'Wild Card.', 'accent')}</h3>
<p class="p-body" data-reveal style="--i:2">${esc(ruderText[0])}</p>
<p class="p-body" data-reveal style="--i:3">${esc(ruderText[1])}</p>
</div>
</div>
</section>
</div>

<section class="band band--void p-benefits p-anchor" id="benefits">
<div class="wrap wrap--wide">
<div class="p-benefits__head">
<div>
${kicker(byCls(benefits, 'pb-eyebrow').text)}
<h2 class="display p-h2" data-reveal style="--i:1">${esc(byCls(benefits, 'pb-title').text)}</h2>
</div>
<p class="p-body p-body--lead" data-reveal style="--i:2">${esc(byCls(benefits, 'pb-subtitle').text)}</p>
</div>
<ul class="p-bgrid">
${pbCards(benefits).map(([t, b], i) => `<li class="p-bcard" data-reveal style="--i:${i % 3}">${DOT}<h3 class="p-bcard__h">${esc(t)}</h3><p>${esc(b)}</p></li>`).join('\n')}
</ul>
<div class="p-disc" data-reveal>
<p>${esc(benefitDisc.text)}</p>
<a class="link-arrow p-tlink" href="#side-effects">${esc(pick(benefits, 'a').text)}</a>
</div>
</div>
</section>

<section class="band band--coal p-sides p-anchor" id="side-effects">
<div class="wrap wrap--wide p-sides__grid">
<div class="p-sides__head">
<h2 class="display p-h2" data-reveal>${accentWord(byCls(sides, 'pb-title').text, 'Side Effects', 'accent')}</h2>
<p class="p-body p-body--lead" data-reveal style="--i:1">${esc(byCls(sides, 'pb-subtitle').text)}</p>
<div class="p-disc p-disc--stack" data-reveal style="--i:2">
<p>${esc(sideDisc.text)}</p>
<a class="link-arrow p-tlink" href="#side-effects">${esc(pick(sides, 'a').text)}</a>
</div>
</div>
<ol class="p-srows">
${pbCards(sides).map(([t, b], i) => `<li class="p-srow" data-reveal style="--i:${i % 3}">${DOT}<h3 class="p-srow__h">${esc(t)}</h3><p>${esc(b)}</p></li>`).join('\n')}
</ol>
</div>
</section>

<section class="band band--void p-how p-anchor" id="how-it-works">
<div class="wrap wrap--wide">
<div class="p-how__head">
${kicker(byCls(how, 'section-eyebrow').text)}
<h2 class="display p-h2" data-reveal style="--i:1">${accentWord(byCls(how, 'story-title').text, 'Cannabis System.', 'accent')}</h2>
<p class="p-body p-body--lead" data-reveal style="--i:2">${esc(howText[0])}</p>
</div>
</div>
<div class="p-how__stage">
<div class="band__clip">
${spray('blue-2', { cls: 'p-how__spray' })}
${tag('CONNECTED', { color: 'orange', cls: 'p-how__tag' })}
</div>
<div class="wrap wrap--wide"><ul class="p-how__panes">
${ecsPanes.map(([h, p], i) => `<li class="glass glass--lift p-pane" data-reveal style="--i:${i}"><h3 class="p-pane__h p-pane__h--big">${esc(h)}</h3><p>${esc(p)}</p></li>`).join('\n')}
</ul></div>
</div>
<div class="wrap wrap--wide p-how__after">
<p class="p-body" data-reveal>${esc(howText[4])}</p>
<p class="p-line p-line--big" data-reveal style="--i:1">${esc(byCls(how, 'line-txt').text)}</p>
</div>
</section>

${closing(ctx, cta, {
    mod: 'beam',
    bg: `${gimg('g-wall-night', { alt: '', cls: 'band__bg p-cta__bg' })}<div class="p-cta__shade"></div>`,
    art: `<div class="p-cta__art p-cta__art--cans">${gimg('g-cans', { alt: '', cls: 'cut', sizes: '(max-width: 900px) 44vw, 420px', attrs: { 'data-depth': '0.08' } })}</div>`,
  })}
</div>
<script>(function(){var n=document.querySelector('[data-p-fnav]');if(!n||!('IntersectionObserver' in window))return;var u=n.querySelector('ul'),l=[].slice.call(n.querySelectorAll('a')),m={};l.forEach(function(a){var s=document.getElementById(a.getAttribute('href').slice(1));if(s)m[s.id]=a;});var io=new IntersectionObserver(function(es){es.forEach(function(e){var a=m[e.target.id];if(!e.isIntersecting||!a)return;l.forEach(function(x){x.removeAttribute('aria-current');});a.setAttribute('aria-current','true');if(u.scrollWidth>u.clientWidth)u.scrollLeft=a.offsetLeft-u.offsetLeft-16;});},{rootMargin:'-30% 0px -60% 0px'});Object.keys(m).forEach(function(id){io.observe(document.getElementById(id));});})();</script>
`;
  return mk(ctx, { path: rec.path, title: rec.title, description: rec.description, crumbs, main, bodyClass: 'p-page--facts', preload: [{ href: '/assets/fonts/RubikSprayPaint-400.woff2', as: 'font', type: 'font/woff2', crossorigin: true }] });
}

// ---------- /events/ ----------
function eventChips(t) {
  // "Aug 7 & 8, 2026 Free Entry 21+" was three chips in the source: the date, then word pairs.
  const m = String(t).match(/^(.*?\b20\d\d)\s+(.*)$/);
  if (!m) return [t];
  const rest = m[2].split(/\s+/);
  const pairs = [];
  for (let i = 0; i < rest.length; i += 2) pairs.push(rest.slice(i, i + 2).join(' '));
  return [m[1], ...pairs];
}
const factRow = (t) => {
  const m = String(t).match(/^(\w+)\s+([\s\S]*)$/);
  return `<div class="p-rows__row"><dt>${esc(m[1])}</dt><dd>${esc(m[2])}</dd></div>`;
};

function flyer(ctx, { file, alt, caption, viewLabel, cls = '' }) {
  return `<figure class="p-flyer ${cls}" data-reveal>
<a${linkAttrs(`/assets/photos/${file}.webp`, { class: 'p-flyer__link', 'data-lightbox': true, 'data-tilt': true, 'aria-label': `${viewLabel}: ${caption}` })}>
${photo(ctx, `${file}.webp`, { alt, sizes: '(max-width: 767px) 64vw, (max-width: 900px) 86vw, 420px' })}
<span class="p-flyer__zoom">${esc(viewLabel)}</span>
</a>
<figcaption>${esc(caption)}</figcaption>
</figure>`;
}

function events(ctx) {
  const rec = ctx.content.events;
  const [hero, list, kit, cta, modalHavoc, modalPilates, grand] = rec.sections;
  const crumbs = [{ label: 'Home', href: '/' }, { label: 'Events' }];
  const B = list.blocks;
  const upcoming = B.slice(0, 3);
  const pop = B.slice(3, 24);
  const pil = B.slice(24, 35);
  const recently = B[35];
  const day = (arr) => {
    const m = String(arr[0].text).match(/^(Day \d)\s+([\s\S]*)$/);
    const lis = arr.slice(3);
    return `<div class="p-day">
<h4 class="p-day__h"><span class="p-day__n">${esc(m ? m[1] : '')}</span> ${esc(m ? m[2] : arr[0].text)}</h4>
<p class="p-day__time">${esc(arr[1].text)}</p>
<p class="p-day__brands">${esc(arr[2].text)}</p>
<ul class="p-day__list">${lis.map((b) => `<li>${esc(b.text)}</li>`).join('')}</ul>
</div>`;
  };
  const chips = (b) => `<div class="p-chips">${eventChips(b.text).map((c, i) => `<span class="chip${i === 0 ? ' chip--paint' : ''}">${esc(c)}</span>`).join('')}</div>`;
  const grandAnchors = picks(grand, 'a');
  const gh5 = picks(grand, 'h5');
  const gp = picks(grand, 'p');
  const can = gimg('g-can', { alt: '', cls: 'cut', sizes: '(max-width: 900px) 30vw, 320px', attrs: { 'data-depth': '0.1' } });

  const main = `
<section class="band band--void p-hero p-ehero">
<div class="band__clip">
${gimg('g-wall-night', { alt: '', cls: 'band__bg p-ehero__bg', eager: true })}
<div class="p-ehero__shade"></div>
${spray('orange-1', { cls: 'p-ehero__spray' })}
<div class="grain"></div>
</div>
<div class="p-ehero__can">${can}</div>
<div class="wrap wrap--wide p-ehero__grid">
<div class="p-ehero__copy">
${crumbsHtml(crumbs)}
<p class="kicker" data-reveal>${esc(pick(hero, 'div').text)}</p>
<h1 class="display display--mega p-h1" data-reveal style="--i:1">${accentLast(pick(hero, 'h1').text)}</h1>
<p class="lede p-hero__lede" data-reveal style="--i:2">${esc(pick(hero, 'p').text)}</p>
</div>
<aside class="glass glass--lit p-upnext" data-reveal style="--i:3" aria-label="${escA(upcoming[0].text)}">
<p class="kicker">${esc(upcoming[0].text)}</p>
<p class="p-upnext__line">${esc(upcoming[1].text)}</p>
${linkTo(ctx, upcoming[2], 'btn btn--paint')}
</aside>
</div>
</section>

<section class="band band--coal p-past">
<div class="wrap wrap--wide">
<h2 class="display p-h2 p-past__h" data-reveal>${accentLast(recently.text, 'outline')}</h2>

<article class="p-event">
${flyer(ctx, { file: 'event-havoc-popup-aug-2026', alt: pop[0].alt, caption: pick(modalHavoc, 'h5').text, viewLabel: pop[1].text })}
<div class="p-event__body">
<div data-reveal>${chips(pop[2])}</div>
<h3 class="display p-h3-big" data-reveal style="--i:1">${esc(pop[3].text)}</h3>
<p class="p-body p-body--lead" data-reveal style="--i:2">${esc(pop[4].text)}</p>
<dl class="p-rows" data-reveal style="--i:3">${factRow(pop[5].text)}${factRow(pop[6].text)}</dl>
<div class="p-days" data-reveal style="--i:4">
${day(pop.slice(7, 13))}
${day(pop.slice(13, 19))}
</div>
<div class="btn-row" data-reveal style="--i:5">${linkTo(ctx, pop[19], 'btn btn--paint')}${linkTo(ctx, pop[20], 'btn btn--ghost')}</div>
</div>
</article>

<article class="p-event p-event--flip">
${flyer(ctx, { file: 'event-eaton-pilates-aug-2026', alt: pil[0].alt, caption: pick(modalPilates, 'h5').text, viewLabel: pil[1].text })}
<div class="p-event__body">
<div data-reveal>${chips(pil[2])}</div>
<h3 class="display p-h3-big" data-reveal style="--i:1">${esc(pil[3].text)}</h3>
<p class="p-body p-body--lead" data-reveal style="--i:2">${esc(pil[4].text)}</p>
<dl class="p-rows" data-reveal style="--i:3">${factRow(pil[5].text)}${factRow(pil[6].text)}${factRow(pil[7].text)}</dl>
<p class="p-note" data-reveal style="--i:4">${esc(pil[8].text)}</p>
<div class="btn-row" data-reveal style="--i:5">${linkTo(ctx, pil[9], 'btn btn--paint')}${linkTo(ctx, pil[10], 'btn btn--ghost')}</div>
</div>
</article>
</div>
</section>

<section class="band band--void p-grand">
<div class="band__clip">
${photo(ctx, 'Bridge-hero.webp', { alt: '', cls: 'band__bg p-grand__bg', sizes: '100vw' })}
<div class="p-grand__shade"></div>
</div>
<div class="wrap wrap--wide">
<div class="glass glass--strong p-grand__pane" data-reveal>
<h2 class="display p-h2">${esc(noEmoji(pick(grand, 'h3').text))}</h2>
<p class="p-body p-body--lead">${esc(gp[0].text)}</p>
<div class="p-grand__days">
<div class="p-grand__day">
<h3 class="p-grand__date">${esc(gh5[0].text)}</h3>
<p class="p-body">${esc(gp[1].text)}</p>
<p class="p-grand__addr">${esc(gp[2].text)}</p>
${linkTo(ctx, grandAnchors[0], 'btn btn--glass')}
</div>
<div class="p-grand__day">
<h3 class="p-grand__date">${esc(gh5[1].text)}</h3>
<p class="p-body">${esc(gp[3].text)}</p>
<p class="p-grand__addr">${esc(gp[4].text)}</p>
${linkTo(ctx, grandAnchors[1], 'btn btn--glass')}
</div>
</div>
</div>
</div>
</section>

<section class="band band--paint p-partner">
<div class="wrap wrap--wide p-partner__grid">
<div>
<p class="p-partner__eyebrow" data-reveal>${esc(byCls(kit, 'section-eyebrow').text)}</p>
<h2 class="display p-partner__h" data-reveal style="--i:1">${esc(byCls(kit, 'press-kit-title').text)}</h2>
</div>
<div class="p-partner__side" data-reveal style="--i:2">
<p>${esc(byCls(kit, 'press-kit-text').text)}</p>
<div class="btn-row">${picks(kit, 'a').map((b, i) => linkTo(ctx, b, i === 0 ? 'btn btn--paint' : 'btn btn--ghost')).join('')}</div>
</div>
</div>
</section>

${closing(ctx, cta, {
    mod: 'shop',
    bg: `${pool('p-pool--tr')}<div class="grain"></div>`,
    art: productArt(ctx),
  })}
`;
  return mk(ctx, { path: rec.path, title: rec.title, description: rec.description, crumbs, main, bodyClass: 'p-page--events' });
}
// Two of the client's own product cut-outs crossing the seam; nothing until IMAGERY has cut them (no fake transparency).
function productArt(ctx) {
  const files = ['cut/pro7.webp', 'cut/pro3.webp'].filter(hasPhoto);
  if (!files.length) return '';
  return `<div class="p-cta__art p-cta__art--pro">${files.map((f, i) => photo(ctx, f, { alt: '', cls: `cut p-cta__pro p-cta__pro--${i}`, sizes: '260px' })).join('')}</div>`;
}

// ---------- /media/ ----------
function pressRows(s) {
  const out = [];
  let cur = null;
  for (const b of s.blocks || []) {
    const c = b.cls || '';
    if (c.includes('press-index')) { cur = { href: b.href, index: b.text }; out.push(cur); } else if (!cur) continue;
    else if (c.includes('press-meta')) cur.meta = b.text;
    else if (c.includes('press-title')) cur.title = b.text;
    else if (c.includes('press-text')) cur.text = b.text;
  }
  return out;
}

function media(ctx) {
  const rec = ctx.content.media;
  const [hero, strip, feat, all, kit, cta] = rec.sections;
  const crumbs = [{ label: 'Home', href: '/' }, { label: 'Media' }];
  const nums = withCls(strip, 'press-stat-num');
  const labels = withCls(strip, 'press-stat-label');
  const f = {
    href: byCls(feat, 'press-featured-title').href,
    meta: byCls(feat, 'press-meta').text,
    title: byCls(feat, 'press-featured-title').text,
    text: byCls(feat, 'press-featured-text').text,
    more: (feat.blocks || []).find((b) => (b.cls || '').includes('col-lg-4')).text,
  };
  const main = `
<section class="band band--void p-hero p-mhero">
<div class="band__clip">
${gimg('g-wheatpaste', { alt: '', cls: 'band__bg p-mhero__bg', eager: true })}
<div class="p-mhero__shade"></div>
<div class="grain"></div>
</div>
<div class="wrap wrap--wide p-hero__in">
${crumbsHtml(crumbs)}
<p class="kicker" data-reveal>${esc(pick(hero, 'div').text)}</p>
<h1 class="display display--mega p-h1" data-reveal style="--i:1">${accentLast(pick(hero, 'h1').text)}</h1>
<p class="lede p-hero__lede" data-reveal style="--i:2">${esc(pick(hero, 'p').text)}</p>
</div>
</section>

<div class="wrap wrap--wide p-stats-wrap">
<div class="glass glass--lit p-stats" data-reveal>
${nums.map((n, i) => `<div class="stat p-stat"><span class="stat__num">${esc(n.text)}</span><span class="stat__label">${esc(labels[i].text)}</span></div>`).join('\n')}
</div>
</div>

<section class="band band--void p-feature-band">
<div class="band__clip">
<div class="p-feature__art">${photo(ctx, 'mobb-deep-shot.webp', { alt: '', sizes: '(max-width: 900px) 100vw, 56vw' })}</div>
</div>
<div class="wrap wrap--wide">
${kicker(byCls(feat, 'section-eyebrow').text)}
<a${linkAttrs(f.href, { class: 'p-feature', 'data-reveal': true, style: '--i:1' })}>
<span class="p-press__meta">${esc(f.meta)}</span>
<h2 class="display p-feature__h">${esc(f.title)}</h2>
<span class="p-feature__text">${esc(f.text)}</span>
<span class="p-feature__more">${linkInner(f.more)}</span>
</a>
</div>
</section>

<section class="band band--coal p-press">
<div class="wrap wrap--wide">
<h2 class="display p-h2 p-press__h" data-reveal>${esc(byCls(all, 'section-eyebrow').text)}</h2>
<ol class="p-press__list">
${pressRows(all).map((r, i) => `<li data-reveal style="--i:${i % 3}">
<a${linkAttrs(r.href, { class: 'p-press__row', 'data-spot': true })}>
<span class="p-press__index">${esc(r.index)}</span>
<div class="p-press__main">
<span class="p-press__meta">${esc(r.meta)}</span>
<h3 class="p-press__title">${esc(r.title)}</h3>
<span class="p-press__text">${esc(r.text)}</span>
</div>
<span class="p-press__go">${drawnArrow}</span>
</a>
</li>`).join('\n')}
</ol>
</div>
</section>

<section class="band band--void p-kit">
<div class="band__clip">
${pool('p-pool--l')}
${spray('blue-1', { cls: 'p-kit__spray' })}
${tag('CULTURE', { color: 'orange', cls: 'p-kit__tag' })}
</div>
<div class="wrap wrap--wide p-kit__grid">
<div class="glass p-kit__pane" data-reveal>
<p class="kicker">${esc(byCls(kit, 'section-eyebrow').text)}</p>
<h2 class="display p-h2">${esc(byCls(kit, 'press-kit-title').text)}</h2>
<p class="p-body">${esc(byCls(kit, 'press-kit-text').text)}</p>
<div class="btn-row">${picks(kit, 'a').map((b, i) => linkTo(ctx, b, i === 0 ? 'btn btn--paint' : 'btn btn--ghost')).join('')}</div>
</div>
</div>
</section>

${closing(ctx, cta, {
    mod: 'girders',
    bg: `${gimg('g-girders', { alt: '', cls: 'band__bg p-cta__bg' })}<div class="p-cta__shade"></div>`,
    art: `<div class="p-cta__art p-cta__art--truss">${gimg('g-truss', { alt: '', cls: 'cut', sizes: '(max-width: 900px) 70vw, 760px', attrs: { 'data-depth': '-0.06' } })}</div>`,
  })}
`;
  return mk(ctx, { path: rec.path, title: rec.title, description: rec.description, crumbs, main, bodyClass: 'p-page--media' });
}

// ---------- /contact/ ----------
function hourRows(t) {
  // "Mon to Thu: 10 AM to 10 PM Fri to Sat: ..." : one captured line, three rows
  const DAY = '(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)';
  const re = new RegExp(`(${DAY}(?:\\s+to\\s+${DAY})?:)\\s*(.*?)(?=\\s+${DAY}\\b|$)`, 'g');
  const rows = [...String(t).matchAll(re)];
  if (!rows.length) throw new Error('contact hours: captured line did not parse');
  return rows.map((m) => `<div class="hours__row"><dt>${esc(m[1])}</dt><dd>${esc(m[2])}</dd></div>`).join('');
}
function socialLinks(ctx) {
  const s = ctx.site.social;
  return [['facebook', 'Facebook'], ['tiktok', 'TikTok'], ['instagram', 'Instagram']]
    .map(([k, label]) => `<a${linkAttrs(s[k], { class: 'p-social', 'aria-label': `The Bridge on ${label}` })}>${icon(k)}<span>${esc(label)}</span></a>`).join('');
}
function faqHtml(items, cls = '') {
  return `<div class="faq ${cls}">${items.map(([q, a], i) => `<details class="faq__item" open${i ? ' data-fold' : ''}><summary>${esc(q)}</summary><div class="faq__a">${rich(a)}</div></details>`).join('\n')}</div>`;
}

function contact(ctx) {
  const rec = ctx.content.contact;
  const [hero, cards, map, form, faq, cta] = rec.sections;
  const crumbs = [{ label: 'Home', href: '/' }, { label: 'Contact' }];
  const h5s = picks(cards, 'h5');
  const ps = picks(cards, 'p').filter((b) => !(b.cls || '').includes('icon'));
  const phone = picks(cards, 'a')[0];
  const labels = picks(form, 'label').map((b) => b.text);
  const inputs = picks(form, 'input');
  const ta = pick(form, 'textarea');
  const formHtml = demoForm({
    id: 'contact-form',
    cls: 'p-form',
    button: pick(form, 'button').text,
    fields: [
      { label: labels[0], name: 'name', required: true },
      { label: labels[1], name: 'email', type: 'email', required: true },
      { label: labels[2], name: 'subject', type: 'select', options: pick(form, 'select').items },
      { label: labels[3], name: 'message', type: 'textarea', required: true },
    ],
  })
    .replace('name="name"', `name="name" placeholder="${escA(inputs[0].placeholder)}"`)
    .replace('name="email"', `name="email" placeholder="${escA(inputs[1].placeholder)}"`)
    .replace('name="message"', `name="message" placeholder="${escA(ta.placeholder)}"`);
  const qa = withCls(faq, 'accordion-button').map((b, i) => [b.text, withCls(faq, 'accordion-body')[i].text]);
  const frame = pick(map, 'iframe');

  const main = `
<section class="band band--void p-hero p-chero">
<div class="band__clip">
${gimg('g-rain-glass', { alt: '', cls: 'band__bg p-chero__bg', eager: true })}
<div class="p-chero__shade"></div>
<div class="grain"></div>
</div>
<div class="wrap wrap--wide p-hero__in">
${crumbsHtml(crumbs)}
<p class="kicker" data-reveal>${esc(pick(hero, 'div').text)}</p>
<h1 class="display display--mega p-h1" data-reveal style="--i:1">${accentLast(pick(hero, 'h1').text)}</h1>
<p class="lede p-hero__lede" data-reveal style="--i:2">${esc(pick(hero, 'p').text)}</p>
</div>
<div class="wrap wrap--wide p-ccards">
<article class="glass glass--lift p-ccard" data-reveal style="--i:3">
${icon('pin', 'p-ccard__ico')}
<h2 class="p-ccard__h">${esc(h5s[0].text)}</h2>
<p class="p-ccard__p"><a${linkAttrs(ctx.site.map.directions, { class: 'p-ccard__addr' })}>${esc(ps[0].text)}</a></p>
</article>
<article class="glass glass--lift p-ccard" data-reveal style="--i:4">
${icon('clock', 'p-ccard__ico')}
<h2 class="p-ccard__h">${esc(h5s[1].text)}</h2>
<dl class="hours p-hours">${hourRows(ps[1].text)}</dl>
<small class="p-ccard__small">${esc(pick(cards, 'small').text)}</small>
</article>
<article class="glass glass--lift p-ccard" data-reveal style="--i:5">
${icon('phone', 'p-ccard__ico')}
<h2 class="p-ccard__h">${esc(h5s[2].text)}</h2>
<a${linkAttrs(phone.href, { class: 'p-ccard__tel' })}>${esc(phone.text)}</a>
<div class="p-socials">${socialLinks(ctx)}</div>
</article>
</div>
</section>

<section class="band band--void p-map">
<div class="wrap wrap--wide p-map__head">
<div>
${kicker(pick(map, 'span').text)}
<h2 class="display p-h2" data-reveal style="--i:1">${accentLast(pick(map, 'h2').text)}</h2>
</div>
${textLink(ctx, pick(map, 'a'), 'p-map__larger')}
</div>
<div class="wrap wrap--wide">
<div class="p-map__frame" data-reveal>
<iframe src="${escA(ctx.site.map.embed)}" title="${escA(frame.frameTitle)}" loading="lazy"></iframe>
</div>
</div>
</section>

<section class="band band--coal p-msg" id="message">
<div class="band__clip">
${spray('orange-2', { cls: 'p-msg__spray' })}
${tag('QUEENS', { color: 'blue', cls: 'p-msg__tag' })}
</div>
<div class="wrap wrap--wide p-msg__grid">
<div class="p-msg__copy">
<h2 class="display p-h2 p-msg__h" data-reveal>${accentWord(byCls(form, 'contact-title').text, 'MESSAGE', 'accent')}</h2>
<p class="p-body p-body--lead" data-reveal style="--i:1">${esc(byCls(form, 'contact-subtitle').text)}</p>
</div>
<div class="glass glass--strong p-msg__pane" data-reveal style="--i:2">${formHtml}</div>
</div>
</section>

<section class="band band--void p-qa">
<div class="wrap wrap--narrow">
<h2 class="display p-h2" data-reveal>${esc(byCls(faq, 'myth-title').text)}</h2>
<div data-reveal style="--i:1">${faqHtml(qa)}</div>
</div>
</section>

${closing(ctx, cta, { mod: 'strip' })}
`;
  return mk(ctx, { path: rec.path, title: rec.title, description: rec.description, crumbs, main, bodyClass: 'p-page--contact' });
}

const sourcesHtml = (g) => ((g.sources || []).length ? `<section class="band band--void p-sources">
<div class="wrap wrap--wide">
<h2 class="kicker">Sources</h2>
<ul class="p-sources__list">${g.sources.map((x) => `<li><a${linkAttrs(x.url)}>${esc(x.label)}</a></li>`).join('')}</ul>
</div>
</section>` : '');

// ---------- /dispensaries/astoria/ ----------
function localBusinessLd(ctx) {
  const s = ctx.site;
  const DAY = { mon: 'Mo', tue: 'Tu', wed: 'We', thu: 'Th', fri: 'Fr', sat: 'Sa', sun: 'Su' };
  const t24 = (t) => {
    const m = String(t).match(/(\d{1,2})(?::(\d{2}))?\s*([AP])M/i);
    let h = +m[1] % 12;
    if (/p/i.test(m[3])) h += 12;
    return `${String(h).padStart(2, '0')}:${m[2] || '00'}`;
  };
  const openingHours = s.hours.map((h) => {
    const days = h.days.toLowerCase().match(/mon|tue|wed|thu|fri|sat|sun/g).map((d) => DAY[d]).join('-');
    const [a, b] = h.time.split(/\s+to\s+/i);
    return `${days} ${t24(a)}-${t24(b)}`;
  });
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: s.fullName,
    url: absUrl(ctx, '/dispensaries/astoria/'),
    telephone: s.phone.tel.replace(/^tel:/, ''),
    address: { '@type': 'PostalAddress', streetAddress: s.address.street, addressLocality: s.address.city, addressRegion: s.address.state, postalCode: s.address.zip },
    geo: { '@type': 'GeoCoordinates', latitude: s.geo.lat, longitude: s.geo.lng },
    openingHours,
    hasMap: s.map.larger,
    sameAs: Object.values(s.social),
  };
}

function astoria(ctx) {
  const P = '/dispensaries/astoria/';
  const g = (ctx.guides && ctx.guides.astoria) || {};
  const s = ctx.site;
  const h1 = g.h1 || `${s.name}, ${s.address.city}`;
  const crumbs = [{ label: 'Home', href: '/' }, { label: s.address.city }];
  const sections = g.sections || [];
  const faq = (g.faq || []).map((x) => [x.q, x.a]);
  const main = `
<section class="band band--void p-hero p-store">
<div class="band__clip">
${gimg('g-elevated', { alt: '', cls: 'band__bg p-store__bg', eager: true })}
<div class="p-store__shade"></div>
<div class="grain"></div>
</div>
<div class="wrap wrap--wide p-store__grid">
<div class="p-store__copy">
${crumbsHtml(crumbs)}
${g.kicker ? `<p class="kicker" data-reveal>${esc(g.kicker)}</p>` : ''}
<h1 class="display display--mega p-h1 p-store__h1" data-reveal style="--i:1">${esc(h1)}</h1>
${g.lede ? `<p class="lede p-hero__lede" data-reveal style="--i:2">${rich(g.lede)}</p>` : ''}
<div class="btn-row" data-reveal style="--i:3">
<a${linkAttrs(store(ctx), { class: 'btn btn--paint' })}>Shop Now${icon('ext')}</a>
<a${linkAttrs(s.map.directions, { class: 'btn btn--glass' })}>Directions${icon('pin')}</a>
</div>
</div>
<aside class="glass glass--lit p-store__card" data-reveal style="--i:2">
<div class="p-store__row">${icon('pin')}<p>${esc(s.address.oneLine)}</p></div>
<div class="p-store__row">${icon('phone')}<a${linkAttrs(s.phone.tel, { class: 'p-store__tel' })}>${esc(s.phone.display)}</a></div>
<div class="p-store__row p-store__row--hours">${icon('clock')}<div>${hoursHtml(ctx, 'p-store__hours')}<small>${esc(s.hoursNote)}</small></div></div>
</aside>
</div>
</section>

<section class="band band--coal p-storemap">
<div class="wrap wrap--wide p-storemap__grid">
<div class="p-map__frame" data-reveal>
<iframe src="${escA(s.map.embed)}" title="${escA(`${s.name} store location map`)}" loading="lazy"></iframe>
</div>
<div class="p-storemap__side">
${sections[0] ? `<h2 class="display p-h2" data-reveal>${esc(sections[0].heading)}</h2><div class="prose" data-reveal style="--i:1">${sections[0].html}</div>` : ''}
${(g.amenities || []).length ? `<ul class="p-amen" data-reveal style="--i:2">${g.amenities.map((a) => `<li class="chip">${esc(a)}</li>`).join('')}</ul>` : ''}
<a${linkAttrs(s.map.larger, { class: 'link-arrow p-tlink' })}>View Larger Map${icon('ext')}</a>
</div>
</div>
</section>

${sections[1] ? `<section class="band band--void p-inside">
<div class="band__clip">${gimg('g-bud-key', { alt: '', cls: 'p-inside__art', sizes: '(max-width: 900px) 100vw, 62vw' })}</div>
<div class="wrap wrap--wide">
<div class="p-inside__text">
<h2 class="display p-h2" data-reveal>${esc(sections[1].heading)}</h2>
<div class="prose" data-reveal style="--i:1">${sections[1].html}</div>
</div>
</div>
</section>` : ''}

${sections.length > 2 ? `<section class="band band--coal p-counter">
<div class="p-how__stage">
<div class="band__clip">
${spray('orange-1', { cls: 'p-how__spray' })}
${tag('ASTORIA', { color: 'blue', cls: 'p-how__tag' })}
</div>
<div class="wrap wrap--wide"><ul class="p-how__panes">
${sections.slice(2).map((sc, i) => `<li class="glass glass--lift p-pane" data-reveal style="--i:${i}"><h2 class="p-pane__h p-pane__h--big">${esc(sc.heading)}</h2><div class="prose">${sc.html}</div></li>`).join('\n')}
</ul></div>
</div>
</section>` : ''}

${faq.length ? `<section class="band band--void p-qa">
<div class="wrap wrap--narrow">
<h2 class="display p-h2" data-reveal>FAQ</h2>
<div data-reveal style="--i:1">${faqHtml(faq)}</div>
</div>
</section>` : ''}
${sourcesHtml(g)}
`;
  return mk(ctx, {
    path: P,
    title: g.title || `${s.name}, ${s.address.city} | ${s.fullName}`,
    description: g.description || `${s.fullName}, ${s.address.oneLine}. Store hours, phone and directions.`,
    crumbs,
    main,
    jsonld: [localBusinessLd(ctx)],
    bodyClass: 'p-page--astoria',
  });
}

// ---------- /careers/ ----------
function careers(ctx) {
  const P = '/careers/';
  const g = (ctx.guides && ctx.guides.careers) || {};
  const crumbs = [{ label: 'Home', href: '/' }, { label: 'Careers' }];
  const sections = g.sections || [];
  const faq = (g.faq || []).map((x) => [x.q, x.a]);
  const appHeading = (g.application && g.application.heading) || 'Application';
  const appLede = g.application && g.application.lede;
  const fields = (g.application && g.application.fields) || [
    { label: 'Name', name: 'name', required: true },
    { label: 'Email', name: 'email', type: 'email', required: true },
    { label: 'Phone', name: 'phone', type: 'tel' },
    { label: 'Tell us about yourself', name: 'about', type: 'textarea', required: true },
  ];
  const main = `
<section class="band band--void p-hero p-jobs">
<div class="band__clip">
${gimg('g-mic', { alt: '', cls: 'band__bg p-jobs__bg', eager: true })}
<div class="p-jobs__shade"></div>
${tag('CULTURE', { color: 'blue', cls: 'p-jobs__tag' })}
<div class="grain"></div>
</div>
<div class="wrap wrap--wide p-hero__in">
${crumbsHtml(crumbs)}
${g.kicker ? `<p class="kicker" data-reveal>${esc(g.kicker)}</p>` : ''}
<h1 class="display display--mega p-h1" data-reveal style="--i:1">${esc(g.h1 || 'Careers')}</h1>
${g.lede ? `<p class="lede p-hero__lede" data-reveal style="--i:2">${rich(g.lede)}</p>` : ''}
<div class="btn-row" data-reveal style="--i:3"><a class="btn btn--paint" href="#application">${esc(appHeading)}${icon('arrow')}</a></div>
</div>
</section>

${sections.map((sc, i) => `<section class="band ${i % 2 ? 'band--void' : 'band--coal'} p-gsec p-gsec--${i % 2 ? 'b' : 'a'}">
<div class="wrap wrap--wide p-gsec__grid">
<h2 class="display p-h2" data-reveal>${esc(sc.heading)}</h2>
<div class="prose" data-reveal style="--i:1">${sc.html}</div>
</div>
</section>`).join('\n')}

<section class="band band--coal p-msg p-apply" id="application">
<div class="band__clip">
${spray('orange-1', { cls: 'p-msg__spray' })}
${gimg('g-vinyl', { alt: '', cls: 'p-apply__art' })}
</div>
<div class="wrap wrap--wide p-msg__grid">
<div class="p-msg__copy">
<h2 class="display p-h2 p-msg__h" data-reveal>${accentLast(appHeading)}</h2>
${appLede ? `<p class="p-body p-body--lead" data-reveal style="--i:1">${rich(appLede)}</p>` : ''}
</div>
<div class="glass glass--strong p-msg__pane" data-reveal style="--i:2">${demoForm({ id: 'application-form', cls: 'p-form', button: (g.application && g.application.button) || 'Send Application', fields })}</div>
</div>
</section>

${faq.length ? `<section class="band band--void p-qa">
<div class="wrap wrap--narrow">
<h2 class="display p-h2" data-reveal>FAQ</h2>
<div data-reveal style="--i:1">${faqHtml(faq)}</div>
</div>
</section>` : ''}
${sourcesHtml(g)}
`;
  return mk(ctx, {
    path: P,
    title: g.title || `Careers | ${ctx.site.name}`,
    description: g.description || `Careers at ${ctx.site.fullName}, ${ctx.site.address.short}. Send us an application.`,
    crumbs,
    main,
    bodyClass: 'p-page--careers',
  });
}

// ---------- /404.html ----------
function notFound(ctx) {
  const P = '/404.html';
  const main = `
<section class="band band--void p-404" data-torch>
<div class="p-404__wall" data-torch-layer aria-hidden="true">
${gimg('g-piece', { alt: '', cls: 'p-404__piece' })}
<span class="p-404__tagword">${esc(ctx.site.address.borough.toUpperCase())}</span>
</div>
<div class="wrap wrap--wide p-404__in">
<p class="kicker">404</p>
<h1 class="display display--mega p-h1">This Wall Got <span class="outline">Buffed.</span></h1>
<p class="lede p-hero__lede">Whatever was up here got painted over. Take a look around with the light, then head back to Broadway.</p>
<div class="btn-row">
<a${linkAttrs('/', { class: 'btn btn--paint' })}>Back Home</a>
<a${linkAttrs(store(ctx), { class: 'btn btn--glass' })}>Go To The Store${icon('ext')}</a>
</div>
</div>
</section>
`;
  return mk(ctx, { path: P, title: `Page Not Found | ${ctx.site.name}`, description: 'This page does not exist. Head back to The Bridge home page or the online store.', crumbs: [], main, bodyClass: 'p-page--404' });
}

export async function render(ctx) {
  // A captured section lookup that fails must stop the build, not ship a hole.
  sec(ctx, 'contact', 'contact-section');
  return [about(ctx), facts(ctx), events(ctx), media(ctx), contact(ctx), astoria(ctx), careers(ctx), notFound(ctx)];
}
