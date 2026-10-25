# PandaDomiWeb

The public landing page for **Panda Domi**: one standalone scene that scrolls from a morning
valley to bedtime. A shy red panda peeks out from behind an old tree, the big panda and cub story
in three painted plates and a shelf of keepsakes, three real example cards, the promise
(*share the moment, not your child*) and a no-email way to follow along.

Live at <https://mncopilotuno.github.io/PandaDomiWeb/>.

The operating rules, phase plan and art style live in the main **PandaDomi** repository
(`CLAUDE.md`, `docs/ROADMAP.md`, `art/STYLE.md`). They are not copied here; this repository
follows them.

## What is in here

```
site/              the deployed files, exactly as served
  index.html       the page (no JavaScript)
  styles.css
  feed.xml         the news feed
  art/*.webp       accepted art from the game, resized for the web
  fonts/           Baloo 2 and Nunito from the game, with their OFL licences
art/assets.json    which game assets the page uses, at what width, from which commit, with hashes
scripts/
  sync-art.py      copies art and fonts out of a PandaDomi checkout
  check-art.mjs    fails if site/art or site/fonts drifted from art/assets.json
  serve.mjs        static server under /PandaDomiWeb/, 127.0.0.1 only
  check-size.mjs   no file over 5 MB
tests/             Playwright, against site/ as deployed
.agents/           feature doc, self-review, lessons
```

The page loads nothing from any other origin, sets no cookies and stores nothing.

## Art comes from the game

Every picture is art accepted in PandaDomi (`art/assets/<id>.webp` with status `accepted` in its
`assets.json`). Nothing is drawn or generated here. To pick up new or changed art:

```bash
# with PandaDomi cloned next to this repository, its origin/main fetched
pnpm art:sync                       # = python3 scripts/sync-art.py ../PandaDomi origin/main
pnpm art:check
```

Edit the list or a width in `art/assets.json`, then sync again.

Art the page is waiting for sits under `pending` in `art/assets.json` (today: nothing; the night
valley and the storytelling owl arrived on 2026-10-25). `pnpm art:status` prints where each stands in the
game and exits 0 only when all are accepted; then move them into `images`, sync, and use them.

The sync needs Python 3 with Pillow (WebP support); CI only checks hashes and never needs the game
repository.

## Commands

```bash
pnpm install --frozen-lockfile
pnpm serve          # http://127.0.0.1:4173/PandaDomiWeb/
pnpm test           # Playwright: desktop + phone projects
pnpm art:check      # art and fonts match art/assets.json
pnpm check:size     # no file over 5 MB
git config core.hooksPath .githooks   # once per clone: the 5 MB pre-commit hook
```

## Deploy

`.github/workflows/pages.yml` tests every pull request and every push to `main`; a green push to
`main` deploys `site/` to GitHub Pages (Source: GitHub Actions). All actions run on Node 24.

## Moving the scene

Everything sits inside `<div class="pd-grove">` with `pd-` prefixed classes and relative asset
paths, so the scene can later move, unchanged, into the bamboo grove of the Domi villa site.
