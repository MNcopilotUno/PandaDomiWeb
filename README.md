# PandaDomiWeb

The public landing page for **Panda Domi**: one standalone 2D scene that scrolls from morning
to bedtime. A shy red panda peeks from behind a tree, the big panda and cub story, three example
cards, the promise (*share the moment, not your child*) and a no-email way to follow along.

Live at <https://mncopilotuno.github.io/PandaDomiWeb/> once the Pages workflow has deployed `main`.

The operating rules, phase plan and art style live in the main **PandaDomi** repository
(`CLAUDE.md`, `docs/ROADMAP.md`, `art/STYLE.md`). They are not copied here; this repository
follows them.

## What is in here

```
site/            the deployed files, exactly as served: index.html, styles.css, feed.xml, art/
art/             the drawing code that writes site/art/*.svg
  lib.mjs        palette, watercolour and pencil filters, painting helpers
  characters.mjs big panda, cub (standing, sleeping), owl
  nature.mjs     bamboo, bushes, mountains, hills, lantern, stars, keepsakes
  scenes.mjs     every illustration on the page
  build.mjs      writes the SVGs; --check fails if they are stale
scripts/         serve.mjs (static server under /PandaDomiWeb/), check-size.mjs
tests/           Playwright, against site/ as deployed
.agents/         feature doc, self-review, lessons
```

The page has **no JavaScript**, loads nothing from any other origin, sets no cookies and stores
nothing. Every picture is drawn in code (SVG), so there are no binary art files to manage.

## Commands

```bash
pnpm install --frozen-lockfile
pnpm art            # redraw site/art/*.svg from art/*.mjs (commit the result)
pnpm art:check      # fail if site/art is out of date
pnpm serve          # http://127.0.0.1:4173/PandaDomiWeb/  (127.0.0.1 only)
pnpm test           # Playwright: desktop + phone projects
pnpm check:size     # no file over 5 MB
git config core.hooksPath .githooks   # once per clone: the 5 MB pre-commit hook
```

## Deploy

`.github/workflows/pages.yml` tests every pull request and every push to `main`; a green push to
`main` deploys `site/` to GitHub Pages. Pages must be set to **Source: GitHub Actions** in the
repository settings (Settings → Pages).

## Moving the scene

Everything sits inside `<div class="pd-grove">` with `pd-` prefixed classes and relative asset
paths, so the scene can later move, unchanged, into the bamboo grove of the Domi villa site.
