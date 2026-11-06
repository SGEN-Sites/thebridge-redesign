# Design: Night Piece

A *piece* is what a graffiti writer calls a finished work. A *nocturne* is what a painter calls a night scene. Night Piece is both: one scene under the bridge at night, with a dark wall, one hard orange sodium light, fresh paint on the wall and a sheet of smoked glass in front of it. It keeps The Bridge's own brand, tone and words. The page structure comes from a large multi-state dispensary operator's site, mapped onto one store.

## The four planes

Every section is built back to front in the same order.

1. **Wall.** Near-black grounds (`.band`). Each section gets one warm key light: a radial pool placed by `--lx` and `--ly`, plus a vignette, and optionally a raked beam (`.band--beam`) or fine grain (`.grain`). Photos and textures go in `.band__clip` and are masked with a radial, so they fall to black and only show where the light lands. A page may have one "lights on" band (`.band--paint`): full orange ground, black type.
2. **Paint.** One confident gesture per section: an oversized hand tag behind a heading (`.tag`), a burst of overspray (`spray()`), a drip off an edge (`drip()`), or a marker underline under one whole word (`.mark`). Display type may carry the brand's hard cobalt offset. Paint is laid on scroll with a speckled mask (`[data-spray]`).
3. **Glass.** Smoked panes (`.glass`) with a live blur, whose top left edge catches the key light through a hairline drawn on a pseudo-element. The signature move is a pane sliding over a tag or a burst, so the colour diffuses behind the frost. Glass is for panels, cards over art, menus and dialogs, never for hero text. The header frosts on a pseudo-element, so the mega menu panels can blur too. On phones the panes become opaque smoked fills, and only the header and dialogs keep a live blur.
4. **Front.** Cut-outs with clean alpha (`.cut`) cross the seams between sections: bridge steel, spray cans, product shots, smoke. Product cut-outs lift out of the top of their glass card with an overspray bloom behind them on hover.

## Palette

Black (`#050505`), bone (`#f5f1e8`) and one orange (`#ff6b00`) do the work, with `#ff9d00` for small labels. These are The Bridge's own brand values. Cobalt (`#1b39ff`) only appears as the shadow of orange: offset type, the hard shadow on a paint button, a tag behind glass, the far rim of a pane. It is never a large flat field.

## Type

- **Bebas Neue**: uppercase, huge and tight, for headings, navigation, buttons and the footer wordmark.
- **Inter**: body text at 16 px and 1.65.
- **Space Mono**: caps for kickers and labels, with a small spray dot in front, never a tick.
- **Sedgwick Ave Display**: hand tags, decorative and hidden from screen readers.
- **Rubik Spray Paint** and **Rubik Wet Paint**: one big paint word at a time, never reading text.

One accent per heading at most: orange (`.accent`), a stroked word (`.outline`) or the marker underline. No visible text is under 13 px.

## Motion

Slow, heavy, deliberate. Everything below is off under `prefers-reduced-motion`, where autoplay loops stay on their poster and text is simply lit.

- **Reveals:** a fade up with the light coming on. A CSS fail-safe shows everything at 2.5 s, and reveals end at the element's own state, so glass and hover effects keep working.
- **Paint:** a speckled wipe for tags and bursts, and drips that run down when they come into view.
- **Depth:** scroll parallax on the transform layer, pointer tilt on fine pointers, a key light that follows the cursor, and a torch that reveals a wall in a circle of light (it drifts slowly on touch screens).
- **Scroll-lit statements:** each word goes from dim to lit with scroll progress, on a sticky pin from 1024 px up.
- **Hover:** a glass lift with a sheen, a product lift with a bloom behind it, a slow image zoom, buttons that fill with paint from the left, and link underlines drawn from the left.
- **Footer:** a fast light sweep across the wordmark, one band every 2.4 s at constant speed with no visible wrap, paused off screen.
- **Rails and marquees:** horizontal rails with arrow buttons and scroll snap, and marquees that pause on hover and focus. Autoplay loops play only on screen and carry a pause and play toggle.
