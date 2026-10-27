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

---

# Round 3: caption and link contrast

Found while drawing the landing page on a design canvas: the keepsake captions used
`--pd-wood-deep` `#8E6640` at 14.4 px bold, 4.42:1 on paper, under WCAG AA's 4.5:1.

## Findings

| # | Finding | Severity | Resolution |
|:--|:--|:--|:--|
| C1 | Keepsake captions 4.12–4.42:1 (measured against the rendered shelf). | medium (a11y) | New `--pd-wood-text` `#6B4626` (7.2:1 on paper). `--pd-wood-deep` stays for the plank's shading only. |
| C2 | The new test found a second one: "the news feed" link, rust on the paper-to-dusk fade, 4.24–4.31:1. | medium (a11y) | `--pd-dusk` lightened from `#EBC9A8` to `#F3DAC0`: rust text keeps 4.7:1 on it, and the footer starts from the same colour, so the sunset still joins the night. |
| C3 | No test measured contrast at all; a token comment ("5.6:1 on paper") was the only check, and only for rust. | medium (test gap) | New e2e test samples the pixels rendered behind every text box (screenshot with text hidden) and requires the 10th-percentile contrast to clear 4.5:1, or 3:1 for large text. It runs on desktop and phone. |

## Test honesty

| Check | Bug put back | Result |
|:--|:--|:--|
| every piece of text has enough contrast | the old caption colour and dusk (the state before this fix) | failed, listing all eight captions and the feed link |
| the same | hero haze removed | **passed**: the painted sky behind the hero words is light enough on its own, so the haze is a look, not a contrast need. Correct, not a blind spot. |

Building the test turned up three ways it could lie, each fixed and noted in the test: a
`!important` button colour beating the "hide all text" rule (raised with `:not(#a):not(#b)`),
the full-page capture recomputing the hero's `svh` height (frozen first), and the phone's
2.625 device pixel ratio (`scale: 'css'`). Cards scrolled out of the phone's row are shown for
the measurement, and fanned cards are straightened, so their boxes match their text.

## What I did NOT verify

- Text inside the painted cards is measured with the cards straightened; their rotation by a few
  degrees does not change what is behind the words.
- Windows high-contrast and forced-colors modes.

---

# Round 4: the painted night

The game accepted `valley-night` and `owl-storytelling` (commit `3329689`); the daily check found
them and moved them from `pending` into `images`.

## Findings

| # | Finding | Severity | Resolution |
|:--|:--|:--|:--|
| N1 | Syncing at the new commit also brought 12 already-used images the game had re-exported since `18614d5`. | low | Compared old and new side by side: the same paintings, re-encoded. Shipped as they are, so the page matches the game. |
| N2 | The contrast test failed "Good night, little panda." at 2.36:1 on desktop: the painting's moonlit clouds cross the line. | medium (a11y) | A soft night-sky haze behind the words (the hero's cream haze, in the dark). Passes on desktop and phone. A `text-shadow` would not have counted: the test hides it and measures real pixels. |
| N3 | A faint hairline between the dusk and the footer at the phone's 2.625 pixel ratio. | low (visible) | The footer overlaps the dusk by one pixel. |
| N4 | The CSS stars and the standalone moon lantern were drawn because no night art existed. | — | Removed; the painting has its stars and moon, the owl its lantern. `moon-lantern` stays on the keepsake shelf. |
| N5 | `pnpm art:status` exits 1 when `pending` is empty ("not all accepted" is vacuously odd). | low | Left as is: it only answers "is there art to bring in?", and the daily check is removed once nothing is pending. |

## Test honesty

| Check | Bug put back | Result |
|:--|:--|:--|
| every piece of text has enough contrast | the footer before the night haze | failed: 2.36:1 on the good-night line |
| tells the whole story | (new assertions) the footer's valley-night, owl and cub images | checked present; `art:check` fails if either file is missing |

## What I did NOT verify

- The owl and cub positions at every width between 390 and 1440 px: checked at those two.

---

# Round 5: the roadmap, and a page you can play with

The developer asked for the landing page to reflect PandaDomi's roadmap (now phases 0–6 and a full
feature inventory) and to be animated and interactive. The page gains `valley.js`; its reading
never depends on it.

## Findings

| # | Finding | Severity | Resolution |
|:--|:--|:--|:--|
| P1 | The hero's cream haze (a pseudo-element reaching past the words) swallowed taps on the shy panda. A real visitor could not say hello. | high (broken control) | `pointer-events: none` on both hazes. The tap test fails with it removed. |
| P2 | "Start again" pressed while a share was in flight: the pending share landed after the reset, putting a keepsake back and growing the cub. | medium (wrong state) | The share in flight is called back. New test; fails without the fix. |
| P3 | The contrast test failed "Share" at 4.27:1: the button font reset (`font: inherit`) dropped its weight, so it measured as normal text. | low | The reset moved under `:where()`, buttons set weight 800 explicitly; at 19 px bold it is large text. |
| P4 | "Tap the owl for a bedtime story" sat on moonlit clouds at 3.29:1. | medium (a11y) | A night-sky pill behind it. |
| P5 | The "now" roadmap stone, cream on rust at 18 px on a phone, was 4.27:1. | medium (a11y) | `--pd-rust-text` (5.75:1). |
| P6 | Inline `style` attributes for the berries' positions would be refused by the CSP. | — | Caught before running: positions moved to the stylesheet (`:nth-child`). JS sets transforms through the CSSOM, which the CSP allows. |
| P7 | The roadmap is the family's private plan in parts (the due date, "you and your wife" gates). | privacy | Only phases, themes and status are shown, with season-level dates. No family detail on the page. |
| P8 | One link now leaves the site: the early journal build at `/PandaDomi/app/` (same owner, same host). | low | Deliberate, from the roadmap's Phase 1; the link test allows exactly that URL. `referrer: no-referrer` still applies. |
| P9 | Page weight grows: 49 files, 5.2 MB of WebP in total. First view is unchanged (~0.9 MB); everything else is lazy, and the three night layers (~0.75 MB) load only when someone asks for the night. | medium | Accepted; not measured on a slow phone. |
| P10 | Sharing is pretend. A visitor could think a card went somewhere. | — | Labelled "Pretend sharing: nothing leaves this page" next to the button. |

## Test honesty (round 5)

| Test | Bug put back | Result |
|:--|:--|:--|
| without script … no control is dead | the Bedtime button not `hidden` | failed |
| loads nothing from any other origin, even while playing | `fetch('ping')` on Bedtime | **passed** at first: the CSP blocks the fetch before it is a request. The test now also fails on any CSP-blocked attempt → failed |
| leaves nothing behind | `localStorage.setItem` on share | failed |
| starting again while a share is in flight | the call-back removed | failed |
| roadmap tabs a keyboard can walk | arrow keys ignored | failed |
| far layers do not drift with reduced motion | parallax ignoring the setting | failed |
| the shy panda … ducks when tapped | the haze's `pointer-events: none` removed | failed |
| feeding the cub … | focus not moved after a pick | failed |

A first full run also had a failure that passed alone four times. Not called a flake: the owl swaps
the cub's picture back 2.2 s after a tap, and a `decode()` running across that swap rejects. The
helper now waits for the cub to settle. The page was right; the test stopped too early.

## What I did NOT verify

- Safari and Firefox, still (the play uses `aspect-ratio`, `svh`, container units, `mask-image`).
- How the play feels on a real phone with a thumb: target sizes are ≥ 44 px, measured only.
- Screen-reader announcements beyond their text: the live regions exist and are tested for content,
  not listened to.

---

# Round 6: Fewer Actions minutes (`ci.yml`, `deploy.yml`, `ci-changes.sh`, `check-live.sh`, `@device`)

Feature doc: `.agents/features/ci-minutes.md` (measured table, decisions, matrix).

## Findings

| # | Finding | Severity | Resolution |
|:--|:--|:--|:--|
| C1 | First draft of `ci-changes.sh` used plain `git diff --name-only`. A rename `site/art/x.webp` → `docs/x.webp` lists only `docs/x.webp`: read as docs only, the tests skip while the page loses a picture. | high (skipped tests on a code change) | `--no-renames`. A shell case covers it and fails without the flag. |
| C2 | A `.md` under `site/` is published, but the docs rule would have skipped it. | medium | Anything under `site/` is code. A shell case covers it and fails without the rule. |
| C3 | `if: needs.changes.outputs.code == 'true'` would skip `test` whenever `changes` failed. A skipped job satisfies a required check, so a broken detector would look green. | high | `test` runs unless the output is exactly `false` (`!cancelled() && … != 'false'`). |
| C4 | Before, the push run on `main` was a second gate before every deploy. Now nothing re-tests the merge commit. A PR merged red, or merged after `main` moved, deploys untested code. | medium | Accepted, as asked. Deploys only from `main`, after its fast checks. The README tells you to merge only green PRs whose CI ran on the current `main`. Not enforced. Branch protection is the owner's setting and is unchanged. |
| C5 | The peek and drift tests open their own `browser.newContext()`, so on the `phone` project they never emulated a phone. They ran twice, identically. | low (cost, and a misleading test name) | Desktop only now. Making them really test a phone is a separate decision. |
| C6 | `deploy.yml` takes a `ref` input. Without a guard, anyone who can dispatch could publish an unmerged commit. | medium | The job fails unless it runs from `main` and the commit is an ancestor of `origin/main`. The input reaches only `with:`, never a shell line. |
| C7 | `check-live.sh` first piped `curl | sha256sum`. Without `pipefail`, a failed fetch hashed empty input and printed a meaningless hash. | low | It now downloads to a temp file and reports `unreachable`. |
| C8 | The image runs Node 24 where `setup-node` gave 22. | low | Nothing in `scripts/` or the tests depends on the version. Noted in the README. |

## Test honesty

| Check | Bug put back | Result |
|:--|:--|:--|
| `ci-changes.test.sh` | `--no-renames` removed | failed (rename case) |
| `ci-changes.test.sh` | the `site/` rule removed | failed (`site/notes.md` case) |
| `check-live.sh` | `site/feed.xml` changed locally, live site unchanged | failed: 1 of 53 files differ |

`desktop` still runs all 25 tests it ran before. `phone` went from 24 run + 1 skipped to 11, the
ones tagged `@device`. No test was removed, skipped or loosened.

## What I did NOT verify

- The Playwright image as uid 1001 is proven only by this PR's CI. Docker has no daemon here.
- A docs-only PR skipping `test`: proven only by the next such PR.
- A deploy through `deploy.yml`, its live check and a rollback: proven only by the next dispatch.
- Whether the image bakes `/etc/localtime`. `TZ: UTC` pins it either way.
- Whether `test` is a required check in branch protection. Its name is unchanged, so either way it reports as before.
