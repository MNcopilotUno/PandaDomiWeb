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
