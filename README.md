# The Bridge: redesign pitch

A redesign concept for The Bridge Cannabis Experience, Astoria, Queens NY. This is a pitch, not the live site. The preview is
set to noindex.

- **Preview:** https://sgen-sites.github.io/thebridge-redesign/
- **Live site it is based on:** https://www.thebridgecannabis.com
- **Online store it links to:** https://store.thebridgecannabis.com

## What this is

The Bridge's own words and photos, rebuilt on the page structure of a large multi-state dispensary operator's site, narrowed to
one location. New design, "Night Piece": glassmorphism, graffiti and tenebrism on The Bridge's black, bone and orange. See
[docs/DESIGN.md](docs/DESIGN.md) for the design and [docs/MEDIA.md](docs/MEDIA.md) for every generated image and clip.

Pages The Bridge does not have (blog, FAQ, guides, The List, careers, legal placeholders) hold new original copy, not text from
that operator's site. Forms are not connected. Legal pages are placeholders for The Bridge's counsel.

## Build

Node 18 or newer, plus cwebp and webpmux on PATH.

```
MSYS_NO_PATHCONV=1 node src/build.mjs
node tools/serve.mjs --root dist --port 8080
```

Content is in `src/content/`, templates in `src/theme/`, styles in `src/styles/`.
