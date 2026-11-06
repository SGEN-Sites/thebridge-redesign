// redirects.mjs - small redirect stubs for the old .html URLs and two hub paths (ia.json redirects). Rendered after the
// sitemap, so stubs are never listed. The target lives in an <a href> so the preview build can prefix it; the script
// reads it from the attribute (contract D6).
import { esc, escA, href, absUrl } from './util.mjs';
export async function render(ctx) {
  return Object.entries(ctx.ia.redirects || {}).map(([from, to]) => ({
    path: from,
    html: `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(ctx.site.name)}</title><meta name="robots" content="noindex"><meta name="description" content="This page moved to a new address on The Bridge website. Follow the link to continue."><link rel="canonical" href="${escA(absUrl(ctx, to))}"></head><body><main id="main"><h1>This page moved</h1><p><a id="to" href="${escA(href(to))}">Continue</a></p></main><script>location.replace(document.getElementById('to').href)</script></body></html>`,
  }));
}
