// sitemap.mjs - RESOURCES lane: /site-map/ and sitemap.xml. Rendered after every page module (index.mjs MODULES), so
// ctx.pages holds every page. Each page is listed exactly once, in Shop / Astoria / Resources / The Insider / Company /
// Legal (a page no rule knows lands in Company, never dropped). /404.html and redirect stubs are excluded. Labels come
// from the page's own <h1>, except where the H1 does not name the page (the home page's statement, the about page's
// "THE BRIDGE"): those take the architecture's label. The render throws if the count of listed pages does not add up.
import fs from 'node:fs';
import nodePath from 'node:path';
import { esc, escA, linkAttrs, gimg, stripTags, absUrl } from './util.mjs';
import { page, crumbsHtml, tag } from './shell.mjs';

const PATH = '/site-map/';
const GROUPS = ['Shop', 'Astoria', 'Resources', 'The Insider', 'Company', 'Legal'];
const RESOURCES = ['/facts/', '/dispensary-guides/', '/getting-a-medical-card/', '/cannabis-laws-by-state/new-york/', '/faq/'];
const LEGAL = ['/terms-and-conditions/', '/privacy-policy/', '/accessibility-statement/', PATH];
// A fixed order inside a group for the hubs; everything else follows, sorted by label.
const FIRST = ['/', '/shop/', '/rewards/', '/dispensaries/astoria/', '/dispensaries/astoria/deals/', ...RESOURCES, '/blog/', '/about-us/', '/events/', '/media/', '/careers/', '/contact/', ...LEGAL];

function groupOf(p) {
  if (p === '/' || p.startsWith('/shop/') || p === '/rewards/') return 'Shop';
  if (p.startsWith('/dispensaries/')) return 'Astoria';
  if (RESOURCES.includes(p) || p.startsWith('/cannabis-laws-by-state/')) return 'Resources';
  if (p.startsWith('/blog/')) return 'The Insider';
  if (LEGAL.includes(p)) return 'Legal';
  return 'Company';
}

const clean = (t) => stripTags(String(t || '')).replace(/\s*\|\s*The Bridge\s*$/i, '').replace(/\s+/g, ' ').trim();

// The architecture's own labels (nav, mega menus, footer), used only where a page's H1 does not name it.
function iaLabels(ia) {
  const out = new Map();
  const walk = (o) => {
    if (Array.isArray(o)) {
      if (o.length === 2 && typeof o[0] === 'string' && o[0].startsWith('/') && typeof o[1] === 'string') { if (!out.has(o[0])) out.set(o[0], o[1]); return; }
      o.forEach(walk);
    } else if (o && typeof o === 'object') {
      if (typeof o.href === 'string' && (o.label || o.title) && !out.has(o.href)) out.set(o.href, o.label || o.title);
      Object.values(o).forEach(walk);
    }
  };
  walk(ia && ia.footer);
  walk(ia && ia.nav);
  return out;
}

function h1Of(html) {
  const m = /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(html || '');
  return m ? clean(m[1]) : '';
}

export async function render(ctx) {
  const redirects = new Set(Object.keys((ctx.ia && ctx.ia.redirects) || {}));
  const isStub = (rec) => /http-equiv=["']refresh["']/i.test((rec && rec.html) || '');
  const all = [...ctx.pages.keys()].filter((p) => p.endsWith('/') && !redirects.has(p) && !isStub(ctx.pages.get(p)));
  if (!all.includes(PATH)) all.push(PATH);

  const ia = iaLabels(ctx.ia);
  const site = clean(ctx.site.name).toLowerCase();
  const labelOf = (p) => {
    if (p === PATH) return 'Sitemap';
    const h1 = h1Of((ctx.pages.get(p) || {}).html);
    if (p === '/' || !h1 || h1.toLowerCase() === site) return ia.get(p) || h1 || p;
    return h1;
  };
  const rank = (p) => { const i = FIRST.indexOf(p); return i === -1 ? FIRST.length : i; };
  // In The Insider the category pages come first, then the stories.
  const catPaths = new Set(((ctx.ia && ctx.ia.blogCategories) || []).map((c) => `/blog/${c.slug}/`));
  const tier = (p) => (catPaths.has(p) ? 0 : 1);
  const entries = all.map((p) => ({ path: p, label: labelOf(p), group: groupOf(p) }));
  entries.sort((a, b) => rank(a.path) - rank(b.path) || tier(a.path) - tier(b.path) || a.label.localeCompare(b.label));

  const listed = GROUPS.reduce((n, g) => n + entries.filter((e) => e.group === g).length, 0);
  if (listed !== new Set(all).size) throw new Error(`sitemap lists ${listed} pages of ${new Set(all).size}`);

  const li = (e) => `<li><a class="r-sm__a"${linkAttrs(encodeURI(e.path), e.path === PATH ? { 'aria-current': 'page' } : {})}>${esc(e.label)}</a></li>`;
  const groups = GROUPS.map((name, gi) => {
    const items = entries.filter((e) => e.group === name);
    if (!items.length) return '';
    const id = `r-sm-${name.toLowerCase().replace(/[^a-z]+/g, '-')}`;
    return `<section class="r-sm__group glass${items.length > 12 ? ' r-sm__group--long' : ''}" data-reveal style="--i:${gi % 3}" aria-labelledby="${id}"><div class="r-sm__in">
<h2 class="r-sm__h" id="${id}">${esc(name)}</h2>
<ul class="r-sm__list" role="list">${items.map(li).join('')}</ul>
</div></section>`;
  }).join('\n');

  const crumbs = [{ href: '/', label: 'Home' }, { label: 'Sitemap' }];
  const title = 'Sitemap | The Bridge';
  const description = 'Every page of The Bridge site in one place: shop, Astoria, resources, The Insider, company and legal.';
  const main = `<section class="band band--void r-smhero" data-spot>
<div class="band__clip">
<div class="r-smhero__art">${gimg('g-girders', { alt: '', sizes: '100vw', eager: true })}</div>
<span class="r-key" aria-hidden="true"></span>
<span class="grain" aria-hidden="true"></span>
${tag('ASTORIA', { color: 'blue', cls: 'r-smhero__tag' })}
</div>
<div class="wrap wrap--wide r-smhero__in">
${crumbsHtml(crumbs)}
<p class="kicker" data-reveal>Every page</p>
<h1 class="display display--mega r-smhero__h1" data-reveal style="--i:1">Sitemap</h1>
<p class="lede" data-reveal style="--i:2">The whole site in one place, ${entries.length} pages.</p>
</div>
<div class="wrap wrap--wide r-sm"><div class="r-sm__grid">${groups}</div></div>
</section>`;

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map((e) => `  <url><loc>${escA(absUrl(ctx, encodeURI(e.path)))}</loc></url>`).join('\n')}
</urlset>
`;
  if (ctx.out) {
    fs.mkdirSync(ctx.out, { recursive: true });
    fs.writeFileSync(nodePath.join(ctx.out, 'sitemap.xml'), xml);
  }
  return [{
    path: PATH,
    html: page({ ctx, path: PATH, title, description, canonical: absUrl(ctx, PATH), og: { title, description, type: 'website' }, bodyClass: 'r-page r-page--sitemap', main, crumbs, heroCrumbs: true }),
  }];
}
