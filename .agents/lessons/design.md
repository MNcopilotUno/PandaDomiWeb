# Lessons: design

## A radial-gradient haze shows its box
**What happened.** The cream haze behind the hero words ended in a hard rectangle over the sky.
**Why it bit.** `radial-gradient(ellipse at …)` sizes to the farthest corner by default, so the
gradient is still partly opaque where the pseudo-element's box ends.
**How to apply.** Size such a haze with `closest-side` and fade it to zero at 100%, so it is fully
transparent before the box edge.

## Chrome that fits drawn art fights painted art
**What happened.** The 3 px dark outlines around every picture and card suited the code-drawn
pencil style; around the detailed painted art they looked like stickers on a picture book.
**How to apply.** Let painted plates sit borderless on the paper with a warm, soft shadow; keep
lines for things that are drawn.

## A shade that is fine for art is not fine for text
**What happened.** The keepsake captions reused the plank's shading colour `#8E6640`: 4.42:1 on
paper, just under AA. A rust link on the sunset fade was 4.3:1. Both looked fine by eye.
**Why it bit.** Palette tones are chosen for paintings; text needs its own darker shade per
background, and a gradient background is only as good as its darkest point under the text.
**How to apply.** Give text its own tokens (`--pd-rust-text`, `--pd-wood-text`) with the ratio in
a comment, and keep the pixel-sampling contrast test green: it measures what is really behind
each word, paintings and gradients included.

## A decorative layer that reaches past its box can eat taps
**What happened.** The hero's haze, a pseudo-element extending beyond the words, sat over the shy
panda's button, so tapping the panda did nothing.
**How to apply.** Give every decorative overlay `pointer-events: none`, and test controls by
clicking them like a person would (Playwright refuses a click another element intercepts).

## `text-wrap` resets `white-space: nowrap`
**What happened.** The berry count pill had `white-space: nowrap` and still wrapped on a phone.
**Why it bit.** `.pd-grove p { text-wrap: pretty }` is more specific than `.pd-count`.
`text-wrap` is a shorthand for `text-wrap-mode` and `text-wrap-style`, so it quietly set the wrap
mode back to `wrap`. It was invisible on the desktop, where the pill had room.
**How to apply.** When a rule sets `text-wrap` on a broad selector, give any element that must not
wrap `text-wrap: nowrap` at equal or higher specificity. Test "on one line" on the narrow device,
not on the desktop.
