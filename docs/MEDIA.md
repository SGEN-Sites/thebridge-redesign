# Media record

Every generated image and media file in this site. All generated art is illustrative: it never shows The Bridge's store, staff, customers, products or brands, a real place or a real person, and no caption presents it as any of those. The prompt of every generated image is in `src/content/image-plan.json` under its id; each generated file in `assets/generated/` also has a sidecar `<file>.json` with its prompt, seed, request id and the retouching applied, and carries the IPTC `trainedAlgorithmicMedia` label. Videos carry the same label in their container tags.

| id | model | what it is | where the prompt lives | status |
|---|---|---|---|---|
| `g-truss` | fal-ai/flux-pro/v1.1-ultra, fal-ai/birefnet/v2 | Section of riveted steel bridge truss with an orange rim light, cut out | `src/content/image-plan.json` | AI-generated, illustrative |
| `g-cans` | fal-ai/flux-pro/v1.1-ultra, fal-ai/birefnet/v2 | Three unbranded matte black spray cans, cut out | `src/content/image-plan.json` | AI-generated, illustrative |
| `g-can` | fal-ai/flux-pro/v1.1-ultra, fal-ai/birefnet/v2 | One unbranded spray can, tilted, cut out | `src/content/image-plan.json` | AI-generated, illustrative |
| `g-leaf-cut` | fal-ai/flux-pro/v1.1-ultra, fal-ai/birefnet/v2 | One cannabis fan leaf with an orange rim light, cut out | `src/content/image-plan.json` | AI-generated, illustrative |
| `g-jar` | fal-ai/flux-pro/v1.1-ultra, fal-ai/birefnet/v2 | Plain glass jar of cured flower, cut out | `src/content/image-plan.json` | AI-generated, illustrative |
| `g-burst` | fal-ai/flux-pro/v1.1-ultra | Orange paint mist burst on black, for screen blending | `src/content/image-plan.json` | AI-generated, illustrative |
| `g-wall-night` | fal-ai/flux-pro/v1.1-ultra, then the paint kit below | Dark wall in one shaft of orange light with faded paint layers | `src/content/image-plan.json` | AI-generated, illustrative |
| `g-girders` | fal-ai/flux-pro/v1.1-ultra | Riveted steel girders from below, one light, haze | `src/content/image-plan.json` | AI-generated, illustrative |
| `g-rain-glass` | fal-ai/flux-pro/v1.1-ultra | Wet window, orange and cobalt lights out of focus | `src/content/image-plan.json` | AI-generated, illustrative |
| `g-wheatpaste` | fal-ai/flux-pro/v1.1-ultra | Torn blank wheat-pasted paper on brick, one light | `src/content/image-plan.json` | AI-generated, illustrative |
| `g-elevated` | fal-ai/flux-pro/v1.1-ultra | Generic elevated rail steel over a wet empty road, orange lamps | `src/content/image-plan.json` | AI-generated, illustrative |
| `g-piece` | fal-ai/flux-pro/v1.1-ultra | Abstract orange and cobalt painted shapes on a black wall, no letters | `src/content/image-plan.json` | AI-generated, illustrative |
| `g-bud-key` | fal-ai/flux-pro/v1.1-ultra | Cured flower macro on black | `src/content/image-plan.json` | AI-generated, illustrative |
| `g-papers` | fal-ai/flux-pro/v1.1-ultra | Plain metal grinder and loose blank papers on slate | `src/content/image-plan.json` | AI-generated, illustrative |
| `g-butter` | fal-ai/flux-pro/v1.1-ultra | Herb butter on dark slate | `src/content/image-plan.json` | AI-generated, illustrative |
| `g-honey` | fal-ai/flux-pro/v1.1-ultra | Honey dipper and plain jar | `src/content/image-plan.json` | AI-generated, illustrative |
| `g-vinyl` | fal-ai/flux-pro/v1.1-ultra | Vinyl record and mixer knobs | `src/content/image-plan.json` | AI-generated, illustrative |
| `g-mic` | fal-ai/flux-pro/v1.1-ultra | Vintage microphone in a beam with smoke | `src/content/image-plan.json` | AI-generated, illustrative |
| `g-bag` | fal-ai/flux-pro/v1.1-ultra | Plain paper bag with a rolled top on a glass counter | `src/content/image-plan.json` | AI-generated, illustrative |
| `g-papers-law` | fal-ai/flux-pro/v1.1-ultra | Stack of blank papers on a dark desk under one lamp | `src/content/image-plan.json` | AI-generated, illustrative |
| `g-cat-edibles` | fal-ai/flux-pro/v1.1-ultra | Plain dark chocolate squares on slate, dark gold still life | `src/content/image-plan.json` | AI-generated, illustrative |
| `g-cat-concentrates` | fal-ai/flux-pro/v1.1-ultra | Glassy amber resin on a glass dish with steel tools, dark gold still life | `src/content/image-plan.json` | AI-generated, illustrative |
| `h-mega-explore` | Higgsfield z_image | Glass jars of cured flower on black stone, menu card art | prompt kept in the project's working notes | AI-generated, illustrative |
| `h-mega-resources` | Higgsfield z_image | An open book and a desk lamp at night, menu card art | prompt kept in the project's working notes | AI-generated, illustrative |
| `loop-mist` | fal-ai/kling-video/v3/pro/image-to-video, from the still `s-mist` (fal-ai/flux-pro/v1.1-ultra) | Seamless orange spray paint mist in one shaft of light on black: `assets/media/loop-mist.mp4`, `loop-mist-sm.mp4`, posters `loop-mist.webp`, `loop-mist-sm.webp` | still `src/content/image-plan.json`, motion prompt below | AI-generated, illustrative |

Motion prompt of `loop-mist`: "Fine orange spray paint mist hangs in the shaft of sodium light and drifts slowly, countless tiny droplets float and glitter, the haze thins and thickens gently, the shaft of light stays fixed, camera locked, static shot, the black background stays black"

## Client images processed, not generated

| file | model | what was done | status |
|---|---|---|---|
| `assets/photos/cut/mobb-deep-hell.webp` | fal-ai/birefnet/v2 | Background removed from the client's photo. The men's pixels are the source photo; nothing was redrawn | client photo |
| `assets/photos/cut/pro1.webp` to `pro8.webp` (except `pro3`) | fal-ai/esrgan, fal-ai/birefnet/v2 | The client's product shots upscaled 4x, background removed, trimmed. No generative model touched the labels | client photo, AI-enhanced |
| `assets/media/bridge-hero-*.webp`, `bridge-hero-sm-*.webp` | fal-ai/topaz/upscale/image, Standard V2 | The client's own bridge photo upscaled 2x, tones lifted slightly, cut to the hero's sizes and a tall phone crop by `tools/bridge-hero.py`. Nothing added or restaged | client photo, AI-upscaled |
| `assets/photos/cut/pro3.webp` | none | The client's own transparent image, trimmed | client photo |

## Procedural paint kit, no AI

`assets/photos/paint/` (`spray-orange-1`, `spray-orange-2`, `spray-blue-1`, `spray-blue-2`, `grain`, `spray-mask`) is drawn by `tools/spray-art.py`, which is seeded and redraws the same pixels on each run.

## Hero spray loop, no AI

The blue QUEENS in the home hero is not a video. `src/scripts/spray-tag.js` paints it on a canvas along hand-drawn stroke paths, with speckle, drips and a moving nozzle mist, then holds, fades and repeats. The can that follows the nozzle is the generated `g-can`.
