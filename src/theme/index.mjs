// index.mjs - template modules, rendered in this order (sitemap after the pages: it lists ctx.pages; redirect stubs
// after it, so they are never listed). A module whose file does not exist yet is skipped with a warning.
export const MODULES = ['home', 'shop', 'pages', 'resources', 'sitemap', 'redirects'];
