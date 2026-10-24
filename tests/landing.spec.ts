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
  expect(requests.filter((u) => u.endsWith('.svg')).length).toBeGreaterThanOrEqual(10);
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
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Panda Domi');
  await expect(page.locator('.pd-tagline')).toHaveText('Share the moment, not your child.');
  await expect(page.locator('.pd-beat')).toHaveCount(3);
  await expect(page.locator('.pd-card')).toHaveCount(3);
  for (const card of await page.locator('.pd-card').all()) {
    await expect(card.locator('.pd-made')).toHaveText('made with Panda Domi');
  }
  await expect(page.getByRole('heading', { name: 'Share the moment, not your child.' })).toBeVisible();
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
  // edges. The hero layers are meant to bleed past the screen and are skipped.
  const cut = await page.$$eval('h1, h2, h3, p, li, a, img:not(.pd-layer)', (els) =>
    els
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
  expect(parsed).toEqual({ error: 0, root: 'http://www.w3.org/2005/Atom', entries: 1, title: 'The valley is open' });
});
