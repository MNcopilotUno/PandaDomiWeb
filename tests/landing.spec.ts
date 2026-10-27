import { test, expect, type Browser, type Page } from '@playwright/test';

// Tests the phone can change: what loads, lays out, shows or responds at a phone's size
// and to touch. playwright.config.ts runs only these on the phone; the rest is the same
// code on the same files, so it runs once, on the desktop.
const DEVICE = { tag: '@device' };

// The early journal build, linked from the roadmap's Phase 1. The only link that leaves this site.
const EARLY_BUILD = 'https://mncopilotuno.github.io/PandaDomi/app/';

// Scroll to the bottom in steps so every lazy picture is requested, and pause there
// so the last ones are seen before anything scrolls back.
async function visitWholePage(page: Page) {
  await page.goto('./');
  await page.evaluate(async () => {
    for (let y = 0; y <= document.body.scrollHeight; y += 400) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 30));
    }
    await new Promise((r) => setTimeout(r, 500));
  });
  await page.waitForLoadState('networkidle');
}

// Every interaction on the page, once: night, the shy panda, sharing, feeding, every
// roadmap stone, the owl. Privacy checks run after this, so play cannot hide a request.
async function playEverything(page: Page) {
  await page.getByRole('button', { name: 'Bedtime' }).click();
  await expect(page.locator('.pd-hero')).toHaveAttribute('data-time', 'night');
  await page.getByRole('button', { name: 'Say hello to the shy panda' }).click();
  for (const chip of await page.locator('.pd-chip').all()) {
    await chip.click();
    await page.getByRole('button', { name: 'Share', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Share', exact: true })).toBeEnabled();
  }
  for (let i = 1; i <= 5; i++) await page.getByRole('button', { name: `Pick berry ${i}` }).click();
  for (const tab of await page.getByRole('tab').all()) await tab.click();
  await page.getByRole('button', { name: 'Ask the owl for a story' }).click();
  // Let the cub settle back to sleep: a picture swapped mid-check would fail decode() for no fault of the page.
  await expect(page.locator('.pd-night-cub')).toHaveAttribute('src', 'art/cub-newborn-sleeping.webp', { timeout: 5000 });
  await page.waitForLoadState('networkidle');
}

test('loads nothing from any other origin, even while playing', DEVICE, async ({ page, baseURL }) => {
  const origin = new URL(baseURL!).origin;
  const requests: string[] = [];
  const kinds = new Set<string>();
  page.on('request', (r) => {
    requests.push(r.url());
    kinds.add(r.resourceType());
  });
  // The CSP blocks a fetch before it becomes a request, so watch for blocked attempts too:
  // the page must not even try.
  const blocked: string[] = [];
  page.on('console', (m) => {
    if (/Content Security Policy|Refused to/i.test(m.text())) blocked.push(m.text());
  });
  page.on('pageerror', (e) => blocked.push(e.message));
  await visitWholePage(page);
  await playEverything(page);
  expect(blocked, 'attempts the CSP blocked').toEqual([]);

  const foreign = requests.filter((u) => !u.startsWith(origin + '/') && !u.startsWith('data:'));
  expect(foreign, 'requests to other origins').toEqual([]);
  // The page must actually have loaded its own files, or the check above is empty.
  expect(requests.filter((u) => u.endsWith('.webp')).length).toBeGreaterThanOrEqual(30);
  expect(requests.filter((u) => u.endsWith('.woff2')).length).toBeGreaterThanOrEqual(2);
  expect(requests.filter((u) => u.endsWith('/valley.js'))).toHaveLength(1);
  // Loading and play ask for files only: no fetch, no XHR, no beacon.
  for (const kind of kinds) expect(['image', 'font', 'stylesheet', 'script', 'document']).toContain(kind);
});

test('every file it asks for exists', DEVICE, async ({ page }) => {
  const failed: string[] = [];
  page.on('response', (r) => {
    if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`);
  });
  page.on('requestfailed', (r) => failed.push(`failed ${r.url()}`));
  await visitWholePage(page);
  await playEverything(page);
  expect(failed).toEqual([]);
});

test('every picture draws, in every state the play can reach', async ({ page }) => {
  await visitWholePage(page);
  await playEverything(page);
  // decode() waits for a picture still being drawn and rejects for a broken one.
  // A lazy picture inside a hidden roadmap phase is never requested; those are
  // checked by opening each phase above, so skip what is hidden now.
  const broken = await page.$$eval('img[src]', async (imgs) => {
    const shown = imgs.filter((i) => !i.closest('[hidden]'));
    const results = await Promise.allSettled(shown.map((i) => i.decode()));
    return shown
      .filter((img, k) => results[k]!.status === 'rejected' || img.naturalWidth === 0)
      .map((img) => img.getAttribute('src'));
  });
  expect(broken).toEqual([]);
});

test('no console errors or security policy violations', DEVICE, async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(e.message));
  await visitWholePage(page);
  await playEverything(page);
  expect(errors).toEqual([]);
});

test('tells the whole story', DEVICE, async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('.pd-brand')).toHaveText('Panda Domi');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/^Share the moment, not\s+your\s+child\.$/);
  await expect(page.getByRole('heading', { name: 'Every moment you share leaves a keepsake' })).toBeVisible();
  await expect(page.locator('.pd-card .pd-made')).toHaveText('made with Panda Domi');
  await expect(page.locator('.pd-shelf li')).toHaveCount(8);
  await expect(page.getByRole('heading', { name: 'When you decide they’re ready, the cub is theirs' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'The path through the valley' })).toBeVisible();
  await expect(page.locator('.pd-phase')).toHaveCount(7);
  await expect(page.getByRole('heading', { name: 'Our promise' })).toBeVisible();
  await expect(page.locator('.pd-promises li')).toHaveCount(6);
  await expect(page.getByRole('link', { name: 'the news feed' })).toHaveAttribute('href', 'feed.xml');
  const night = page.locator('footer.pd-night');
  await expect(night.locator('img[src="art/valley-night.webp"]')).toHaveCount(1);
  await expect(night.locator('img[src="art/owl-storytelling.webp"]')).toHaveCount(1);
  await expect(night.locator('.pd-goodnight')).toHaveText('Good night, little panda.');
});

test('the roadmap names every phase, with an honest status', async ({ page }) => {
  await page.goto('./');
  const names = await page.locator('.pd-stone-name').allTextContents();
  expect(names).toEqual(['This page', 'The journal', 'The farm', 'Child play', 'Extras', 'Visits', 'Further']);
  const statuses = await page.locator('.pd-stone').evaluateAll((els) => els.map((e) => e.getAttribute('data-status')));
  expect(statuses).toEqual(['done', 'now', 'started', 'groundwork', 'later', 'later', 'later']);
  await expect(page.locator('#phase-4')).toContainText('20% going to red panda conservation');
  await expect(page.locator('#phase-1 a')).toHaveAttribute('href', EARLY_BUILD);
});

test('without script the whole page still reads, and no control is dead', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('./');
  // Every roadmap phase is listed, and the stones are plain links to them.
  for (let i = 0; i <= 6; i++) await expect(page.locator(`#phase-${i}`)).toBeVisible();
  await expect(page.locator('.pd-stone').first()).toHaveAttribute('href', '#phase-0');
  // The finished state is shown: a card, a full shelf, the sleeping cub.
  await expect(page.locator('.pd-card-title')).toHaveText('First steps!');
  for (const img of await page.locator('.pd-shelf img').all()) await expect(img).toBeVisible();
  // Not one button on screen: they only appear when the script can run them.
  await expect(page.locator('button:visible')).toHaveCount(0);
  await context.close();
});

test('runs only its own script and offers no way to send anything', async ({ page }) => {
  await page.goto('./');
  const scripts = await page.$$eval('script', (ss) => ss.map((s) => ({ src: s.getAttribute('src'), inline: s.textContent!.trim().length })));
  expect(scripts).toEqual([{ src: 'valley.js', inline: 0 }]);
  // No photo, camera, text field or form: there is nothing to upload and nowhere to send it.
  await expect(page.locator('form, input, textarea, select, video, audio, iframe, object, embed')).toHaveCount(0);
});

test('leaves nothing behind in the browser', async ({ page, context }) => {
  await visitWholePage(page);
  await playEverything(page);
  expect(await context.cookies()).toEqual([]);
  const stored = await page.evaluate(async () => ({
    local: localStorage.length,
    session: sessionStorage.length,
    databases: (await indexedDB.databases()).length,
    caches: 'caches' in window ? (await caches.keys()).length : 0,
  }));
  expect(stored).toEqual({ local: 0, session: 0, databases: 0, caches: 0 });
});

test('every link stays on this site, but for the early build', async ({ page, baseURL }) => {
  await page.goto('./');
  const hrefs = await page.$$eval('a[href]', (as) => as.map((a) => (a as HTMLAnchorElement).href));
  expect(hrefs.length).toBeGreaterThan(0);
  const away = hrefs.filter((href) => !href.startsWith(baseURL!));
  expect(away).toEqual([EARLY_BUILD]);
});

test('every picture is described or marked decorative', async ({ page }) => {
  await page.goto('./');
  const missing = await page.$$eval('img', (imgs) => imgs.filter((i) => !i.hasAttribute('alt')).map((i) => i.src));
  expect(missing).toEqual([]);
  const described = await page.$$eval('img', (imgs) => imgs.filter((i) => (i.getAttribute('alt') ?? '').length > 20).length);
  expect(described).toBeGreaterThanOrEqual(20);
});

test('the skip link is the first stop for the keyboard', async ({ page, isMobile }) => {
  test.skip(isMobile, 'keyboard navigation is a desktop check');
  await page.goto('./');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to the story' });
  await expect(skip).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#story$/);
  await expect(page.locator('#story')).toBeFocused();
});

test('fits a small phone without sideways scrolling', DEVICE, async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('./');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  // .pd-grove clips overflow, so also check nothing readable is cut off at the
  // edges. The painted stage is wider than a phone on purpose (it shows the middle
  // of the painting), and the card it plays with slides away when shared.
  const cut = await page.$$eval('h1, h2, h3, p, li, a, button, img', (els) =>
    els
      .filter((e) => !e.closest('.pd-stage') && !e.closest('[hidden]'))
      .filter((e) => {
        const r = e.getBoundingClientRect();
        return r.width > 0 && (r.left < -1 || r.right > window.innerWidth + 1);
      })
      .map((e) => `${e.tagName.toLowerCase()}.${e.className}: ${e.textContent?.trim().slice(0, 30) ?? ''}`),
  );
  expect(cut).toEqual([]);
});

test('the news feed is well-formed Atom', async ({ page, request }) => {
  const res = await request.get('feed.xml');
  expect(res.ok()).toBe(true);
  const xml = await res.text();
  await page.goto('./');
  const parsed = await page.evaluate((text) => {
    const doc = new DOMParser().parseFromString(text, 'application/xml');
    return {
      error: doc.getElementsByTagName('parsererror').length,
      root: doc.documentElement.namespaceURI,
      entries: doc.getElementsByTagName('entry').length,
      title: doc.querySelector('entry > title')?.textContent,
    };
  }, xml);
  expect(parsed).toEqual({ error: 0, root: 'http://www.w3.org/2005/Atom', entries: 4, title: 'The path through the valley' });
});

test('the game’s own fonts are the ones in use', async ({ page }) => {
  await visitWholePage(page);
  const loaded = await page.evaluate(async () => {
    await document.fonts.ready;
    return [...document.fonts].filter((f) => f.status === 'loaded').map((f) => `${f.family} ${f.weight}`);
  });
  expect(loaded).toEqual(expect.arrayContaining(['Baloo 2 800', 'Nunito 200 1000']));
});

// ---------- The play ----------

test('the shy panda peeks once, rests with reduced motion, and ducks when tapped', async ({ browser }) => {
  for (const [reducedMotion, expected] of [['no-preference', 'pd-peek'], ['reduce', 'none']] as const) {
    const context = await browser.newContext({ reducedMotion });
    const page = await context.newPage();
    await page.goto('./');
    const panda = page.locator('.pd-peek img');
    await expect(panda).toHaveCSS('animation-name', expected);
    const shown = () =>
      panda.evaluate((img) => {
        const box = img.parentElement!.getBoundingClientRect();
        return (img.getBoundingClientRect().right - box.left) / box.width;
      });
    if (reducedMotion === 'reduce') expect(await shown()).toBeGreaterThan(0.8);
    // Tapped, it ducks behind the trunk, then comes back.
    await page.waitForTimeout(reducedMotion === 'reduce' ? 0 : 2300);
    await page.getByRole('button', { name: 'Say hello to the shy panda' }).click();
    await expect(page.locator('.pd-peek')).toHaveClass(/is-hiding/);
    await expect(page.locator('.pd-peek')).not.toHaveClass(/is-hiding/, { timeout: 3000 });
    await expect.poll(shown).toBeGreaterThan(0.8);
    await context.close();
  }
});

test('bedtime turns the opening scene to night and back', DEVICE, async ({ page }) => {
  await page.goto('./');
  const hero = page.locator('.pd-hero');
  const night = page.locator('.pd-layer-night').first();
  await expect(night).not.toHaveAttribute('src', /.+/); // the night paintings wait until asked for
  await page.getByRole('button', { name: 'Bedtime' }).click();
  await expect(hero).toHaveAttribute('data-time', 'night');
  await expect(night).toHaveAttribute('src', 'art/landing-sky-night.webp');
  await expect(night).toHaveCSS('opacity', '1', { timeout: 3000 });
  await page.getByRole('button', { name: 'Morning' }).click();
  await expect(hero).toHaveAttribute('data-time', 'day');
  await expect(page.getByRole('button', { name: 'Bedtime' })).toBeVisible();
});

test('sharing a moment puts its keepsake on the shelf and grows the cub', DEVICE, async ({ page }) => {
  await page.goto('./');
  const placed = page.locator('.pd-shelf li.is-placed');
  await expect(placed).toHaveCount(0);
  await page.getByRole('button', { name: 'What they said' }).click();
  await expect(page.locator('.pd-card-title')).toHaveText('What they said');
  await expect(page.locator('.pd-card-art')).toHaveAttribute('src', 'art/cub-speaking.webp');
  await expect(page.getByRole('button', { name: 'What they said' })).toHaveAttribute('aria-pressed', 'true');

  const share = page.getByRole('button', { name: 'Share', exact: true });
  await share.click();
  await expect(placed).toHaveCount(1);
  await expect(page.locator('.pd-shelf li[data-keepsake="child-said"]')).toHaveClass(/is-placed/);
  // The den says what the cub does; what was shared is for screen readers, in a sentence.
  await expect(page.locator('.pd-den-stage')).toHaveText('Eyes open: the cub looks around the den.');
  await expect(page.locator('.pd-said')).toHaveText(
    'Shared “What they said.” A speech bubble note went on the shelf. Eyes open: the cub looks around the den.',
  );
  // The keepsakes still to collect wait on the shelf as faint ghosts, not as gaps.
  await expect(page.locator('.pd-shelf li[data-keepsake="first-steps"] img')).toHaveCSS('opacity', '0.18');
  await expect(page.locator('.pd-den-cub')).toHaveAttribute('src', 'art/cub-awake.webp');

  // Sharing the same moment again grows the cub, but the keepsake is already there.
  await expect(share).toBeEnabled();
  await share.click();
  await expect(page.locator('.pd-den-stage')).toHaveText('First wobbly steps across the den.');
  await expect(page.locator('.pd-said')).toHaveText('Shared “What they said.” First wobbly steps across the den.');
  await expect(placed).toHaveCount(1);

  // Six shares in all bring the cub to its own den, and it stays there.
  for (let i = 0; i < 4; i++) {
    await expect(share).toBeEnabled();
    await share.click();
  }
  await expect(page.locator('.pd-den-cub')).toHaveAttribute('src', 'art/cub-own-den.webp');
  await page.getByRole('button', { name: 'Start again' }).click();
  await expect(placed).toHaveCount(0);
  await expect(page.locator('.pd-den-cub')).toHaveAttribute('src', 'art/cub-newborn-sleeping.webp');
  await expect(share).toBeFocused();
});

test('starting again while a share is in flight calls the share back', async ({ page }) => {
  await page.goto('./');
  const share = page.getByRole('button', { name: 'Share', exact: true });
  await share.click();
  await expect(page.getByRole('button', { name: 'Start again' })).toBeVisible();
  await expect(share).toBeEnabled();
  await share.click(); // a second share, still flying...
  await page.getByRole('button', { name: 'Start again' }).click(); // ...when the visitor starts again
  await page.waitForTimeout(1200); // longer than a share takes to land
  await expect(page.locator('.pd-shelf li.is-placed')).toHaveCount(0);
  await expect(page.locator('.pd-den-cub')).toHaveAttribute('src', 'art/cub-newborn-sleeping.webp');
  await expect(share).toBeEnabled();
});

test('feeding the cub counts the berries: three, and still hungry', DEVICE, async ({ page }) => {
  await page.goto('./');
  const count = page.locator('.pd-count');
  await expect(count).toBeHidden();
  for (let i = 1; i <= 3; i++) await page.getByRole('button', { name: `Pick berry ${i}` }).click();
  await expect(count).toHaveText('3Three… still hungry!');
  // On one line, even on a phone.
  expect(await count.evaluate((p) => p.getBoundingClientRect().height < 2 * parseFloat(getComputedStyle(p.lastElementChild!).lineHeight))).toBe(true);
  // The keyboard stays on the bush.
  await expect(page.getByRole('button', { name: 'Pick berry 4' })).toBeFocused();
  for (let i = 4; i <= 5; i++) await page.getByRole('button', { name: `Pick berry ${i}` }).click();
  await expect(count).toHaveText('5Five! Full and happy.');
  await expect(page.locator('.pd-feed-cub')).toHaveAttribute('src', 'art/cub-smiling.webp');
  await page.getByRole('button', { name: 'Pick again' }).click();
  await expect(count).toBeHidden();
  await expect(page.getByRole('button', { name: 'Pick berry 1' })).toBeEnabled();
});

test('the roadmap stones are tabs a keyboard can walk', async ({ page }) => {
  await page.goto('./');
  const tabs = page.getByRole('tab');
  await expect(tabs).toHaveCount(7);
  // It opens where the work is now: the journal.
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#phase-1')).toBeVisible();
  await expect(page.locator('#phase-0')).toBeHidden();
  await tabs.nth(1).focus();
  await page.keyboard.press('ArrowRight');
  await expect(tabs.nth(2)).toBeFocused();
  await expect(page.locator('#phase-2')).toBeVisible();
  await expect(page.locator('#phase-1')).toBeHidden();
  await page.keyboard.press('End');
  await expect(page.locator('#phase-6')).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#phase-0')).toBeVisible();
  await expect(page.getByRole('tabpanel')).toHaveCount(1);
});

test('the owl tells a bedtime line and the cub yawns', DEVICE, async ({ page }) => {
  await page.goto('./');
  const says = page.locator('.pd-owl-says');
  await expect(says).toBeHidden();
  await page.getByRole('button', { name: 'Ask the owl for a story' }).click();
  await expect(says).toHaveText(/Once upon a time/);
  await expect(page.locator('.pd-night-cub')).toHaveAttribute('src', 'art/cub-yawn.webp');
  await page.getByRole('button', { name: 'Ask the owl for a story' }).click();
  await expect(says).toHaveText(/stars are out/);
  await expect(page.locator('.pd-night-cub')).toHaveAttribute('src', 'art/cub-newborn-sleeping.webp', { timeout: 4000 });
});

test('with reduced motion the far layers do not drift', async ({ browser }) => {
  for (const [reducedMotion, drifts] of [['no-preference', true], ['reduce', false]] as const) {
    const context = await browser.newContext({ reducedMotion });
    const page = await context.newPage();
    await page.goto('./');
    await page.evaluate(() => window.scrollTo(0, 300));
    await page.waitForTimeout(200);
    const transform = await page.locator('.pd-depth').first().evaluate((el) => getComputedStyle(el).transform);
    expect(transform !== 'none', `${reducedMotion}: ${transform}`).toBe(drifts);
    await context.close();
  }
});

// ---------- Contrast ----------

// Every piece of text is measured against the pixels actually rendered behind it,
// including the paintings: the page is screenshotted with all text hidden, and each
// text box is sampled from that image. A box passes when its 10th-percentile contrast
// clears WCAG AA (4.5:1, or 3:1 for large text), so a stray light pixel in a painting
// cannot fail it but a light patch can.
async function contrastFailures(browser: Browser, isMobile: boolean, prepare: (page: Page) => Promise<void>) {
  // Its own context: hiding the text needs an injected style, which the site's CSP rightly refuses.
  const context = await browser.newContext({ bypassCSP: true, viewport: isMobile ? { width: 390, height: 844 } : { width: 1280, height: 900 } });
  const page = await context.newPage();
  await visitWholePage(page);
  await prepare(page);
  await page.$$eval('img[src]', (imgs) => Promise.allSettled(imgs.filter((i) => !i.closest('[hidden]')).map((i) => i.decode())));
  await page.evaluate(() => window.scrollTo(0, 0));
  // Freeze what a full-page capture would otherwise move: the hero's height follows
  // the viewport (svh), and the far layers drift with scroll.
  const heroHeight = await page.locator('.pd-hero').evaluate((el) => el.getBoundingClientRect().height);
  await page.addStyleTag({
    content: `.pd-grove .pd-hero { min-height: ${heroHeight}px !important; height: ${heroHeight}px; }
      .pd-grove .pd-depth { transform: none !important; }
      .pd-grove *, .pd-grove *::before, .pd-grove *::after { transition: none !important; animation: none !important; }`,
  });

  const boxes = await page.evaluate(() => {
    const out: { label: string; color: number[]; large: boolean; rects: number[][] }[] = [];
    const walker = document.createTreeWalker(document.querySelector('.pd-grove')!, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const el = node.parentElement!;
      if (!node.textContent!.trim() || el.closest('[aria-hidden="true"]')) continue;
      const style = getComputedStyle(el);
      const range = document.createRange();
      range.selectNodeContents(node);
      const rects = [...range.getClientRects()]
        .filter((r) => r.width > 2 && r.height > 2)
        .map((r) => [r.left + window.scrollX, r.top + window.scrollY, r.width, r.height]);
      if (!rects.length) continue;
      const size = parseFloat(style.fontSize);
      const bold = parseInt(style.fontWeight, 10) >= 700;
      out.push({
        label: `${el.tagName.toLowerCase()} "${node.textContent!.trim().slice(0, 40)}"`,
        color: style.color.match(/[\d.]+/g)!.map(Number),
        large: size >= 24 || (bold && size >= 18.66),
        rects,
      });
    }
    return out;
  });

  // :not(#a):not(#b) lifts the rule above any id or class rule, !important ones included.
  await page.addStyleTag({
    content: '*:not(#a):not(#b) { color: transparent !important; text-shadow: none !important; text-decoration-color: transparent !important; }',
  });
  // One screenshot pixel per CSS pixel, so it lines up with the text boxes on a high-DPI phone too.
  const shot = await page.screenshot({ fullPage: true, scale: 'css' });

  // Decode the screenshot in a blank page (the site's own CSP rightly refuses data: images).
  const lab = await browser.newPage();
  const failures = await lab.evaluate(
    async ({ png, boxes }) => {
      const img = new Image();
      img.src = `data:image/png;base64,${png}`;
      await img.decode();
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const lin = (c: number) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
      const lum = (r: number, g: number, b: number) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
      const bad: string[] = [];
      for (const box of boxes) {
        const ratios: number[] = [];
        for (const [x, y, w, h] of box.rects) {
          const data = ctx.getImageData(Math.floor(x!), Math.floor(y!), Math.max(1, Math.ceil(w!)), Math.max(1, Math.ceil(h!))).data;
          for (let i = 0; i < data.length; i += 4 * 7) {
            const [r, g, b, a = 1] = box.color;
            // Blend a translucent text colour over the pixel it sits on.
            const fr = r! * a + data[i]! * (1 - a);
            const fg = g! * a + data[i + 1]! * (1 - a);
            const fb = b! * a + data[i + 2]! * (1 - a);
            const l1 = lum(fr, fg, fb);
            const l2 = lum(data[i]!, data[i + 1]!, data[i + 2]!);
            ratios.push((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05));
          }
        }
        ratios.sort((p, q) => p - q);
        const p10 = ratios[Math.floor(ratios.length * 0.1)] ?? 21;
        const need = box.large ? 3 : 4.5;
        if (p10 < need) bad.push(`${box.label}: ${p10.toFixed(2)}:1, needs ${need}:1`);
      }
      return bad;
    },
    { png: shot.toString('base64'), boxes },
  );
  await lab.close();
  await context.close();
  return failures;
}

test('every piece of text has enough contrast with what is behind it', DEVICE, async ({ browser, isMobile }) => {
  test.setTimeout(90_000);
  // With the owl's words showing, so the bubble is measured too.
  const failures = await contrastFailures(browser, isMobile, async (page) => {
    await page.getByRole('button', { name: 'Ask the owl for a story' }).click();
    for (let i = 1; i <= 3; i++) await page.getByRole('button', { name: `Pick berry ${i}` }).click();
  });
  expect(failures).toEqual([]);
});

test('the opening scene keeps its contrast at night', DEVICE, async ({ browser, isMobile }) => {
  test.setTimeout(90_000);
  const failures = await contrastFailures(browser, isMobile, async (page) => {
    await page.getByRole('button', { name: 'Bedtime' }).click();
    await expect(page.locator('.pd-hero')).toHaveAttribute('data-time', 'night');
  });
  expect(failures).toEqual([]);
});
