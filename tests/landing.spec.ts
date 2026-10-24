import { test, expect, type Page } from '@playwright/test';

// Scroll to the bottom in steps so every lazy picture is requested.
async function visitWholePage(page: Page) {
  await page.goto('./');
  await page.evaluate(async () => {
    for (let y = 0; y <= document.body.scrollHeight; y += 400) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 30));
    }
  });
  await page.waitForLoadState('networkidle');
}

test('loads nothing from any other origin', async ({ page, baseURL }) => {
  const origin = new URL(baseURL!).origin;
  const requests: string[] = [];
  page.on('request', (r) => requests.push(r.url()));
  await visitWholePage(page);

  const foreign = requests.filter((u) => !u.startsWith(origin + '/') && !u.startsWith('data:'));
  expect(foreign, 'requests to other origins').toEqual([]);
  // The page must actually have loaded its own files, or the check above is empty.
  expect(requests.filter((u) => u.endsWith('.webp')).length).toBeGreaterThanOrEqual(20);
  expect(requests.filter((u) => u.endsWith('.woff2')).length).toBeGreaterThanOrEqual(2);
});

test('every file it asks for exists', async ({ page }) => {
  const failed: string[] = [];
  page.on('response', (r) => {
    if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`);
  });
  page.on('requestfailed', (r) => failed.push(`failed ${r.url()}`));
  await visitWholePage(page);
  expect(failed).toEqual([]);
});

test('every picture draws', async ({ page }) => {
  await visitWholePage(page);
  // decode() waits for a picture still being drawn and rejects for a broken one.
  const broken = await page.$$eval('img', async (imgs) => {
    const results = await Promise.allSettled(imgs.map((i) => i.decode()));
    return imgs
      .filter((img, k) => results[k]!.status === 'rejected' || img.naturalWidth === 0)
      .map((img) => img.getAttribute('src'));
  });
  expect(broken).toEqual([]);
});

test('no console errors or security policy violations', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(e.message));
  await visitWholePage(page);
  expect(errors).toEqual([]);
});

test('tells the whole story', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('.pd-brand')).toHaveText('Panda Domi');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/^Share the moment, not\s+your\s+child\.$/);
  await expect(page.locator('.pd-plate-row')).toHaveCount(3);
  await expect(page.locator('.pd-shelf li')).toHaveCount(8);
  await expect(page.locator('.pd-card')).toHaveCount(3);
  for (const card of await page.locator('.pd-card').all()) {
    await expect(card.locator('.pd-made')).toHaveText('made with Panda Domi');
  }
  await expect(page.getByRole('heading', { name: 'Our promise' })).toBeVisible();
  await expect(page.locator('.pd-promises li')).toHaveCount(5);
  await expect(page.getByRole('link', { name: 'the news feed' })).toHaveAttribute('href', 'feed.xml');
});

test('runs no script and offers no way to send anything', async ({ page }) => {
  await page.goto('./');
  // No script means nothing on the page can phone home or keep state.
  await expect(page.locator('script')).toHaveCount(0);
  // No photo, camera or form: there is nothing to upload and nowhere to send it.
  await expect(page.locator('form, input, textarea, video, audio, iframe, object, embed')).toHaveCount(0);
});

test('leaves nothing behind in the browser', async ({ page, context }) => {
  await visitWholePage(page);
  expect(await context.cookies()).toEqual([]);
  const stored = await page.evaluate(async () => ({
    local: localStorage.length,
    session: sessionStorage.length,
    databases: (await indexedDB.databases()).length,
  }));
  expect(stored).toEqual({ local: 0, session: 0, databases: 0 });
});

test('every link stays on this site', async ({ page, baseURL }) => {
  await page.goto('./');
  const hrefs = await page.$$eval('a[href]', (as) => as.map((a) => (a as HTMLAnchorElement).href));
  expect(hrefs.length).toBeGreaterThan(0);
  for (const href of hrefs) expect(href.startsWith(baseURL!), href).toBe(true);
});

test('every picture is described or marked decorative', async ({ page }) => {
  await page.goto('./');
  const missing = await page.$$eval('img', (imgs) => imgs.filter((i) => !i.hasAttribute('alt')).map((i) => i.src));
  expect(missing).toEqual([]);
  const described = await page.$$eval('img', (imgs) => imgs.filter((i) => (i.getAttribute('alt') ?? '').length > 20).length);
  expect(described).toBeGreaterThanOrEqual(9);
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

test('fits a small phone without sideways scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('./');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  // .pd-grove clips overflow, so also check nothing readable is cut off at the
  // edges.
  const cut = await page.$$eval('h1, h2, h3, p, li, a, img, .pd-card-row', (els) =>
    els
      // The painted stage is wider than a phone on purpose (it shows the middle of
      // the painting), and the cards scroll sideways inside their own row.
      .filter((e) => !e.closest('.pd-stage') && !e.closest('.pd-card'))
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
  expect(parsed).toEqual({ error: 0, root: 'http://www.w3.org/2005/Atom', entries: 2, title: 'The valley is painted' });
});

test('the shy panda peeks once, and rests in place when motion is reduced', async ({ browser }) => {
  for (const [reducedMotion, expected] of [['no-preference', 'pd-peek'], ['reduce', 'none']] as const) {
    const context = await browser.newContext({ reducedMotion });
    const page = await context.newPage();
    await page.goto('./');
    const panda = page.locator('.pd-peek img');
    await expect(panda).toHaveCSS('animation-name', expected);
    if (reducedMotion === 'reduce') {
      // Without the slide, the panda is already out from behind the trunk.
      const shown = await panda.evaluate((img) => {
        const window = img.parentElement!.getBoundingClientRect();
        const r = img.getBoundingClientRect();
        return (r.right - window.left) / window.width;
      });
      expect(shown).toBeGreaterThan(0.8);
    }
    await context.close();
  }
});

test('the game\'s own fonts are the ones in use', async ({ page }) => {
  await visitWholePage(page);
  const loaded = await page.evaluate(async () => {
    await document.fonts.ready;
    return [...document.fonts].filter((f) => f.status === 'loaded').map((f) => `${f.family} ${f.weight}`);
  });
  expect(loaded).toEqual(expect.arrayContaining(['Baloo 2 800', 'Nunito 200 1000']));
});

test('the cards can be scrolled with a keyboard on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('./');
  const row = page.getByRole('region', { name: 'Example cards' });
  await expect(row).toHaveAttribute('tabindex', '0');
  const scrollable = await row.evaluate((el) => el.scrollWidth > el.clientWidth);
  expect(scrollable).toBe(true);
  await row.focus();
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => row.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
});

// Every piece of text is measured against the pixels actually rendered behind it,
// including the painted hero and the cards: the page is screenshotted with all
// text hidden, and each text box is sampled from that image. A box passes when
// its 10th-percentile contrast clears WCAG AA (4.5:1, or 3:1 for large text), so
// a stray light pixel in a painting cannot fail it but a light patch can.
test('every piece of text has enough contrast with what is behind it', async ({ browser, isMobile }) => {
  test.setTimeout(90_000);
  // Its own context: hiding the text needs an injected style, which the site's CSP rightly refuses.
  const context = await browser.newContext({ bypassCSP: true, viewport: isMobile ? { width: 390, height: 844 } : { width: 1280, height: 900 } });
  const page = await context.newPage();
  await visitWholePage(page);
  await page.$$eval('img', (imgs) => Promise.allSettled(imgs.map((i) => i.decode())));
  await page.evaluate(() => window.scrollTo(0, 0));
  // Freeze what a full-page capture would otherwise move or hide: the hero's height
  // follows the viewport (svh), fanned cards report axis-aligned boxes wider than their
  // text, and on a phone the cards scrolled out of their row are not painted at all.
  const heroHeight = await page.locator('.pd-hero').evaluate((el) => el.getBoundingClientRect().height);
  await page.addStyleTag({
    content: `.pd-grove .pd-hero { min-height: ${heroHeight}px !important; height: ${heroHeight}px; }
      .pd-grove .pd-card { transform: none !important; }
      .pd-grove .pd-card-row { flex-wrap: wrap !important; overflow: visible !important; }`,
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
  expect(failures).toEqual([]);
});
