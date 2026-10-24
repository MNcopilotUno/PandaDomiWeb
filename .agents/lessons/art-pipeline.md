# Lessons: art pipeline

## SVG filters clip broad strokes
**What happened.** Tails, arms and bamboo drawn as thick strokes came out as flat-ended
rectangles: half of each stroke was missing.
**Why it bit.** A filter's region is computed from the element's geometry bounding box, which
ignores stroke width. A 48-unit-wide tail along a nearly straight path has a bounding box only a
few units wide.
**How to apply.** Any filtered broad stroke goes in a `<g>` with an invisible `fill="none"` rect
around its control points, padded by the stroke width (`band()` in `art/lib.mjs` does this).

## Tinting the grain with brown makes light colours dirty
**What happened.** The first watercolour filter laid dark brown blots over every fill. On rust it
read as texture; on cream and pale sky it read as grey dirt.
**Why it bit.** A fixed-colour overlay shifts the hue of light fills toward its own colour.
**How to apply.** Vary the paint's own colour instead: multiply the fill by a light grey noise
(`feBlend mode="multiply"`), so each colour only darkens in its own hue.

## A picture's bottom edge shows a seam where it meets the page
**What happened.** The night scene's nearest hill ended in a visible band where the footer
continued in "the same" colour.
**Why it bit.** The paint filter darkens and wobbles the fill, and the page background had its
own paper texture: two different surfaces of nominally one colour.
**How to apply.** Where a picture runs on into a page colour, draw that last shape flat (no
filter) in exactly the page's token colour, and give the page a solid colour below it.

## Animation inside an `<img>` SVG ignores the page's reduced-motion setting
**What happened.** The shy panda's peek was a CSS animation inside its SVG, with a
`prefers-reduced-motion` query beside it. With reduced motion requested, Chromium still played it.
**Why it bit.** An SVG loaded as an image is a separate document; its media queries did not see
the page's (emulated) preference, so the opt-out never fired.
**How to apply.** Keep animated parts as separate layers and animate them from the page's CSS,
where the reduced-motion query is reliable. Test it with `reducedMotion: 'reduce'`.
