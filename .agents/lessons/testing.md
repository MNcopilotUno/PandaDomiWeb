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

## `FontFace.family` has no quotes
**What happened.** The font test expected `"Baloo 2" 800` and failed with the font loaded fine.
**Why it bit.** `document.fonts` reports the family as declared but unquoted: `Baloo 2`.
**How to apply.** Compare against the bare family name. And test fonts at all: a wrong `url()`
falls back to a system font silently, with no 404 that a request check would always catch.

## Three ways a screenshot-based contrast test lies
**What happened.** The first run reported 1.0:1 for a button, 1.4:1 for every heading on a
phone, and 1.5:1 for cards nobody could see.
**Why it bit.** A `.pd-button { color: … !important }` beat a `* { color: transparent !important }`
rule; a full-page capture re-lays out `svh` heights; the phone context's device pixel ratio made
the screenshot 2.625× larger than the CSS boxes; and overflowed cards are never painted.
**How to apply.** Raise the hiding rule's specificity, freeze viewport-dependent heights before
measuring, screenshot with `scale: 'css'`, and make clipped content visible for the measurement.

## A CSP can make a privacy test pass for the wrong reason
**What happened.** A `fetch()` added on purpose did not fail "loads nothing from any other
origin": the CSP refused it before it ever became a request, so the request listener saw nothing.
**Why it bit.** The visitor was safe, but the test was green because of a second defence, not
because it checked anything. Remove the CSP and the test would have stayed green.
**How to apply.** Also fail on blocked attempts (console "Refused to…", CSP violations): the page
must not even try.

## A picture swapped during `decode()` rejects
**What happened.** "Every picture draws" failed once under load: the owl's tap swaps the cub to a
yawn and back after 2.2 s, and the check's `decode()` ran across the swap.
**How to apply.** End an interaction helper only when every timed swap has settled.

## A test's own context does not inherit the project's device
**What happened.** The shy-panda and drift tests ran on the `phone` project, and their results
read as "works on a phone". Both open `browser.newContext({ reducedMotion })`, which starts from
defaults: a desktop viewport, no touch, no mobile UA.
**Why it bit.** The phone leg cost a run and proved nothing the desktop leg had not.
**How to apply.** When a test makes its own context, spread the project's device into it, or run
the test once. Tag the tests a device can really change (`@device`) and run only those on the
second project.
