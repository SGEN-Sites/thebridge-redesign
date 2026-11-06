// data.mjs - load every content file once.
//   ctx.site      src/content/site.json          The Bridge's facts (every value traced to crawl/bridge/*.html)
//   ctx.ia        src/content/ia.json            the adopted architecture mapped onto one location: bar, nav, footer, redirects
//   ctx.images    src/content/images.json        generated media registry (IMAGERY lane)
//   ctx.content   src/content/pages/<slug>.json  The Bridge's captured pages ({ path, oldPath, title, description, h1, sections })
//   ctx.posts     src/content/posts/<slug>.json  NEW original articles (WRITER lane), newest first
//   ctx.guides    src/content/guides/<slug>.json NEW original guide pages (WRITER lane): dispensary guide, medical, NY laws, FAQ, careers, legal, list, deals, astoria
// Dash punctuation in every copy source is normalised at load (src/lib/punct.mjs); words are unchanged.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './paths.mjs';
import { normaliseDashes } from './punct.mjs';

const readJson = (rel, fallback) => {
  const f = path.join(ROOT, rel);
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : fallback;
};
const readDir = (rel) => {
  const dir = path.join(ROOT, rel);
  const out = {};
  if (!fs.existsSync(dir)) return out;
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.json')).sort()) out[f.replace(/\.json$/, '')] = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  return out;
};
const when = (x) => { const t = Date.parse(x.date || ''); return Number.isNaN(t) ? 0 : t; };

export function loadAll() {
  const site = normaliseDashes(readJson('src/content/site.json', {}));
  const ia = readJson('src/content/ia.json', {});
  const images = readJson('src/content/images.json', { photos: {}, media: {} });
  const content = normaliseDashes(readDir('src/content/pages'));
  const posts = normaliseDashes(Object.values(readDir('src/content/posts')).sort((a, b) => when(b) - when(a)));
  const guides = normaliseDashes(readDir('src/content/guides'));
  return { site, ia, images, content, posts, guides };
}
