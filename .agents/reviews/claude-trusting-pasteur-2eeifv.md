# Self-review: claude/trusting-pasteur-2eeifv (landing page)

Pull request: https://github.com/MNcopilotUno/PandaDomiWeb/pull/1

Adversarial pass. Findings first, then what was not verified.

## Correctness

| # | Finding | Severity | Resolution |
|:--|:--|:--|:--|
| 1 | Broad strokes (tails, arms, bamboo) were clipped to rectangles: filter regions ignore stroke width. | high (visible) | Fixed: `band()` wraps each stroke with a padded invisible rect. Lesson in `lessons/art-pipeline.md`. |
| 2 | On wide screens `object-fit: cover` cropped the far mountains flat across the peaks. | medium | Fixed: layers use natural height, with a `min-height` so narrow screens crop only the sides. |
| 3 | A strip of sky showed between the far and near layers on tall phones. | low | Fixed: far layer lowered to overlap the near hills. |
| 4 | The night picture met the footer with a visible seam. | low | Fixed: the nearest hill is a flat fill in exactly `--pd-indigo-deep`, and the footer is that solid colour. |
| 5 | Hero text sat over the mountains with weak contrast on desktop. | medium | Fixed: text moved up, cream halo behind text. |
| 6 | Second run, two tabs, tab closed mid-action, clock change: the page has no state and no script, so none of these can change what it shows. | — | Nothing to fix. |
| 7 | The peek animation runs once per image decode; a back/forward cache restore may show the end state without the peek. | low | Accepted: the end state is the intended resting picture. |
| 7a | **Reduced motion was ignored.** The peek animation lived inside `shy-panda.svg` with its own `prefers-reduced-motion` query; in Chromium, with reduced motion requested, the panda still started hidden and slid in. A media query inside an `<img>` SVG did not follow the page's setting. | high (accessibility) | Fixed: split into `shy-head.svg` and `shy-tree.svg`; the page's CSS animates the head and turns the animation off under reduced motion. New e2e test; it fails with the media query removed. |

## Privacy (every path a byte could leave the device)

| # | Finding | Resolution |
|:--|:--|:--|
| 8 | The page first said "we never learn who you are" and "counts no visitors" with no caveat. GitHub Pages, as host, sees IP addresses and user agents of every request. | Fixed: the small print now says the page is hosted on GitHub Pages and GitHub sees requests like any host. The feed line now says "no sign-up, and we never learn who you are", which is true of us. |
| 9 | Requests for the page's own files go to GitHub only. There are no third-party requests (tested), no outbound links (tested), `referrer: no-referrer`, and a CSP of `default-src 'none'` with only same-origin images and styles. | OK |
| 10 | CSP via `<meta>` cannot set `frame-ancestors`, and Pages cannot send headers, so the page can be framed by another site. | Accepted: the page has no inputs or actions, so framing gains an attacker nothing. |
| 11 | The repository is public. No family research, no real quotes, no names, no due date are in copy or source. A planned line hinting at "a family expecting a baby this winter" was left out of the copy. | OK |
| 12 | The feed's URLs hard-code `mncopilotuno.github.io/PandaDomiWeb`. A custom domain later means updating `feed.xml`. | Noted in the feature doc. |

## Child safety

| # | Finding | Resolution |
|:--|:--|:--|
| 13 | Can a child reach a purchase, a link out or a stranger? No purchase UI, no external link, no form, no input, no free text from anyone (all tested). | OK |
| 14 | The page states product promises in the present tense ("It works offline") for an app that is not built yet. | Accepted for a landing page; the follow-along section says the journal "is being made right now". Keep these promises in step with what ships. |

## Offline

| # | Finding | Resolution |
|:--|:--|:--|
| 15 | No service worker. Offline, the page is either served from the browser cache or not at all. | Deliberate: a worker would add the stale-worker trap to a static page for no gain. |

## Test honesty

Each check was run with its bug put back:

| Test | Bug put back | Result |
|:--|:--|:--|
| loads nothing from any other origin | Google Fonts `<link>` | failed, listing the URL |
| runs no script and offers no way to send anything | `<input type="file">` + `<script>` | failed |
| every file it asks for exists | the same `<script src="x.js">` (404) | failed |
| every link stays on this site | `<a href="https://example.com">` | failed |
| every picture is described or marked decorative | alt removed from one picture | failed |
| fits a small phone | `.pd-cards { min-width: 500px }` | **passed** at first (overflow hidden hid it) → test rewritten to check edges → failed |
| `pnpm art:check` | one byte appended to `den.svg` | failed |
| the shy panda peeks once, and rests in place when motion is reduced | reduced-motion media query removed | failed |

Not re-checked with a bug put back: "leaves nothing behind" (no script exists that could write
storage), "the news feed is well-formed", "the skip link".

## Scope

Only the landing page, its art, tests and deploy. No app code, no service worker, no copies of
the PandaDomi docs. Art prompts for painted versions were not written (they belong in
PandaDomi's `art/prompts/`).

## What I did NOT verify

- **Safari and Firefox.** Only Chromium was run. SVG filter output (turbulence, displacement,
  morphology) differs between engines; the art may look different, and the CSS animation inside
  an `<img>` SVG is unverified outside Chromium.
- **Real phones.** Decode time of the filtered SVGs on a low-end phone is not measured.
- **The deployed site.** Whether Pages is enabled with Source: GitHub Actions in this repository's
  settings; the first deploy will tell.
- **Reduced motion** is checked in Chromium (emulated) only, not with a real OS setting.
- **The Phase 0 gate's human half**: whether someone in the family understands it unaided.

---

# Round 2: the game's art, a new layout, Node 24 actions

Second PR on the same branch, restarted from `main` after the first one merged.

## Findings

| # | Finding | Severity | Resolution |
|:--|:--|:--|:--|
| R1 | The hero's cream haze showed a hard rectangle over the sky on desktop. | medium (visible) | Fixed: `closest-side` gradient fading to zero inside its box. Lesson in `lessons/design.md`. |
| R2 | The phone-width test would have flagged the painted stage and the sideways card row, which overflow by design. A blanket exclusion could hide a real overflow. | medium (test honesty) | Excluded only what lives inside `.pd-stage` and inside each `.pd-card`; the card row itself is still checked. Re-verified with a 480 px shelf: fails. |
| R3 | A wrong font path falls back to a system font silently: the request test only sees a 404 if the font is ever requested. | medium | New test reads `document.fonts` for loaded Baloo 2 800 and Nunito. Fails with the path broken. |
| R4 | The card row on a phone is a scroll region; without `tabindex` a keyboard user cannot scroll it. | medium (a11y) | `role="region"`, label and `tabindex="0"`; new test scrolls it with ArrowRight. Fails with `tabindex` removed. |
| R5 | Synced art could silently drift from what the game accepted, or a placeholder could slip in. | medium | The sync reads with `git show` at a pinned commit, refuses anything not `accepted`, and records hashes; `art:check` fails on a changed, missing, stray, unreferenced or unused file (each case run). |
| R6 | The art is re-encoded (WebP q84, resized). Some detail is lost against the game's originals. | low | Accepted: sizes are 2× the largest display size, except the hero layers, which stay at full width. |
| R7 | Page weight rose from ≈0.4 MB to ≈2.5 MB, ≈0.9 MB of it in the opening scene. | medium | Below the fold everything is lazy. Not measured on a slow phone; noted as a gap. |
| R8 | The CSP needed `font-src 'self'` for the fonts. | — | Added; the console test confirms no CSP violation. |
| R9 | Copy: example card words are invented; two are the game's own landing examples. "Three wobbly steps from the sofa to the cat" is new. No real quotes or names. | — | OK for a public repo. |
| R10 | `upload-pages-artifact@v5` is a composite action; it runs `upload-artifact@v7` (Node 24) inside. | — | Checked its `action.yml`; every action in the workflow now runs on Node 24. |

## Test honesty (round 2)

| Check | Bug put back | Result |
|:--|:--|:--|
| the game's own fonts are the ones in use | Baloo 2 `url()` pointed at a missing file | failed |
| the shy panda peeks once, and rests in place when motion is reduced | reduced-motion rule removed | failed |
| the cards can be scrolled with a keyboard on a phone | `tabindex` removed from the row | failed |
| fits a small phone | `.pd-shelf { min-width: 480px }` | failed |
| `pnpm art:check` | a byte appended to a WebP; a stray file; a reference renamed | failed, naming each |

## What I did NOT verify (round 2)

- Safari and Firefox, still: the 16:9 stage uses `aspect-ratio`, `svh` and container query units
  (`cqi`) on the cards.
- Load time on a real phone on a slow connection.
- That the deployed site matches until the Pages deploy of this round has run.
