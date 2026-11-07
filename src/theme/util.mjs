// util.mjs - shared helpers (main session owns this file; lanes import, never edit: ask through your report).
import { img, picture, imgUrl, hasGenerated, capSizes } from '../lib/images.mjs';
export { img, picture, imgUrl, hasGenerated, capSizes };

// Generated image by id (docs/BUILD-CONTRACT.md "Generated image ids"). While IMAGERY is still producing, a lane build
// with ALLOW_MISSING_GEN=1 gets a styled placeholder slot instead of a build failure; the final build (no env) fails on
// any missing id.
export function gimg(id, opts = {}) {
  if (hasGenerated(id) || process.env.ALLOW_MISSING_GEN !== '1') return img(id, opts);
  return `<span class="img-slot ${opts.cls || ''}" data-slot="${String(id).replace(/"/g, '')}" role="img" aria-label="${String(opts.alt || '').replace(/"/g, '&quot;')}"></span>`;
}

export const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export const escA = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export const attrs = (o = {}) => Object.entries(o).filter(([, v]) => v !== false && v != null && v !== '').map(([k, v]) => (v === true ? ` ${k}` : ` ${k}="${escA(v)}"`)).join('');
export const isExternal = (u) => /^(https?:)?\/\//i.test(String(u)) || /^(mailto|tel|sms):/i.test(String(u));

// Internal page paths are directories ("/shop" -> "/shop/"); "#frag" and "?q" survive; files ("/404.html",
// "/assets/...") are left alone. External URLs unchanged.
export function href(u) {
  const s = String(u ?? '');
  if (!s || isExternal(s) || s.startsWith('#')) return s;
  const m = s.match(/^([^?#]*)([?#].*)?$/);
  let p = m[1];
  const rest = m[2] || '';
  if (!p.startsWith('/')) return s;
  if (p.startsWith('/assets/') || /\.[a-z0-9]{2,5}$/i.test(p)) return s;
  if (!p.endsWith('/')) p += '/';
  return p + rest;
}

// <a> attributes for any URL: external links open in a new tab with rel noopener (mailto/tel stay in place).
export function linkAttrs(u, extra = {}) {
  const h = href(String(u ?? ''));
  const ext = /^(https?:)?\/\//i.test(h);
  return attrs({ href: h, ...(ext ? { target: '_blank', rel: 'noopener' } : {}), ...extra });
}

// Client photo by file name in assets/photos ("havoc-mixing.webp", "cut/pro1.webp"): <img> with WebP variants + srcset.
export function photo(ctx, file, opts = {}) {
  return img({ src: '/assets/photos/' + file, alt: opts.alt != null ? opts.alt : '' }, opts);
}

export const slugify = (s) => String(s).toLowerCase().replace(/&[a-z]+;/g, '').replace(/<[^>]+>/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const stripTags = (s) => String(s ?? '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();

// Absolute URL for canonicals / og:url (site.json origin).
export const absUrl = (ctx, p) => ctx.site.origin + href(p);

// Store links: store(ctx) = the online store home; store(ctx, 'flower') = that category's store collection.
export function store(ctx, slug) {
  if (!slug) return ctx.site.store;
  const hit = (ctx.site.categories || []).find((c) => c.slug === slug);
  return hit ? hit.store : ctx.site.store;
}

// Captured-page lookups. sec(ctx, 'about-us', 'approach-section') = first section whose class contains the name, or by index;
// blocks are { tag, cls, text, href, src, alt, group, items }. byCls(section, 'story-title') = first block with that class.
export function sec(ctx, slug, which) {
  const list = (ctx.content[slug] || {}).sections || [];
  const s = typeof which === 'number' ? list[which] : list.find((x) => (x.cls || '').includes(which));
  if (!s) throw new Error(`captured section not found: ${slug} / ${which}`);
  return s;
}
export const byCls = (s, cls) => (s.blocks || []).find((b) => (b.cls || '').split(/\s+/).includes(cls));
export const texts = (s, pred = () => true) => (s.blocks || []).filter((b) => b.text && pred(b)).map((b) => b.text);

// Preview forms are NOT wired to any service: every form renders with data-demo-form; site.js stops the submit and
// shows the inline note. Use demoForm() for every form so the wording stays one sentence site-wide. fields: "Name" or
// { label, name, type: text|email|tel|textarea|select, options: [] , required }.
export const DEMO_NOTE = 'This preview form is not connected yet, so nothing is sent.';
export function demoForm({ id = '', fields = [], button = 'Submit', cls = '' } = {}) {
  const field = (f) => {
    const d = typeof f === 'string' ? { label: f } : f;
    const name = d.name || slugify(d.label);
    const type = d.type || (/email/i.test(d.label) ? 'email' : 'text');
    const req = d.required ? ' required' : '';
    let input;
    if (type === 'textarea') input = `<textarea class="demo-form__input" name="${escA(name)}" rows="4"${req}></textarea>`;
    else if (type === 'select') input = `<select class="demo-form__input" name="${escA(name)}"${req}>${(d.options || []).map((o) => `<option>${esc(o)}</option>`).join('')}</select>`;
    else input = `<input class="demo-form__input" type="${escA(type)}" name="${escA(name)}" autocomplete="${/email/i.test(d.label) ? 'email' : /name/i.test(d.label) ? 'name' : 'off'}"${req}>`;
    return `<label class="demo-form__field"><span class="demo-form__label">${esc(d.label)}</span>${input}</label>`;
  };
  return `<form class="demo-form ${cls}" method="post" action="#" data-demo-form novalidate${id ? ` id="${escA(id)}"` : ''}>
${fields.map(field).join('\n')}
<button class="btn btn--paint demo-form__btn" type="submit" disabled data-demo-btn>${esc(button)}</button>
<p class="demo-form__note" data-demo-note hidden role="status">${esc(DEMO_NOTE)}</p>
</form>`;
}
