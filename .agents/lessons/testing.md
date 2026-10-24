# Lessons: testing

## `overflow: hidden` hides the bug the phone-width test looks for
**What happened.** With a 500 px-wide element forced in, "fits a small phone" still passed.
**Why it bit.** `.pd-grove` clips overflow (so the bleeding hero layers never cause a sideways
scroll), so `scrollWidth` never grows: wide content is silently cut off instead, which is worse.
**How to apply.** Also assert that no visible text, link or picture extends past either edge of
the viewport. Reintroduce the bug and watch the test fail before trusting it.

## "Network idle" is not "pictures drawn"
**What happened.** "Every picture draws" failed on lazy SVGs that had loaded but were still being
decoded, and full-page screenshots showed those pictures blank.
**Why it bit.** Heavy SVG filters take time to rasterise after the bytes arrive.
**How to apply.** Await `img.decode()` for every picture (it rejects for a broken one) instead of
checking `complete` right after `networkidle`.
