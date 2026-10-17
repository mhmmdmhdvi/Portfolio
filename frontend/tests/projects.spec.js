import { expect, test } from "@playwright/test";

test("Projects opens directly from the desktop and loads its images on demand", async ({ page }) => {
  const images = [];
  const errors = [];
  page.on("request", (request) => { if (request.url().includes("/assets/projects/")) images.push(request.url()); });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.getByRole("status", { name: "Starting Windows" }).waitFor({ state: "hidden" });
  expect(images).toEqual([]);
  const shortcut = page.getByRole("main", { name: "Desktop" }).getByRole("link", { name: "Projects", exact: true });
  await expect(shortcut).toBeVisible({ timeout: 3000 });
  await expect(page.getByRole("link", { name: /Simple view/ })).toHaveCount(0);
  await shortcut.click();
  await expect(page).toHaveURL(/\/projects$/);
  const library = page.getByRole("region", { name: "Project library", exact: true });
  await expect(library.getByRole("heading", { name: "Project Library", exact: true })).toBeVisible();
  await expect(library.getByRole("button", { name: /^Open book:/ })).toHaveCount(8);
  expect(images.some((url) => url.includes("-full.webp"))).toBe(false);
  await library.getByRole("button", { name: "Open book: Honor PreInvoice", exact: true }).click();
  await expect(library.getByRole("heading", { name: "Honor PreInvoice", exact: true })).toBeVisible();
  await expect(page.getByRole("dialog", { name: "File Explorer", exact: true })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("a book turns pages, enlarges screenshots and returns focus to its cover", async ({ page }) => {
  await page.goto("/projects");
  const book = page.getByRole("button", { name: "Open book: Honor PreInvoice", exact: true });
  await book.click();
  await expect(page).toHaveURL(/\/projects\/honor-preinvoice$/);
  await expect(page.getByRole("button", { name: "Previous page", exact: true })).toBeDisabled();
  const enlarge = page.getByRole("button", { name: "Enlarge: Customer details", exact: true });
  await enlarge.click();
  const viewer = page.getByRole("dialog", { name: "Screenshot viewer", exact: true });
  await expect(viewer.getByRole("img", { name: "Honor PreInvoice — Customer details", exact: true })).toBeVisible();
  await viewer.getByRole("button", { name: "Actual size", exact: true }).click();
  await expect(viewer.getByRole("button", { name: "Fit width", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(viewer).toHaveCount(0);
  await expect(enlarge).toBeFocused();
  await page.getByRole("button", { name: "Next page", exact: true }).click();
  await expect(page.getByRole("button", { name: "Enlarge: Invoice details", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Next page", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Next page", exact: true }).click();
  await expect(page.getByRole("button", { name: "Next page", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Previous page", exact: true }).click();
  await expect(page.getByRole("button", { name: "Enlarge: Invoice details", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Back to shelf", exact: true }).click();
  await expect(book).toBeFocused();
  await expect(page).toHaveURL(/\/projects$/);
});

test("project links survive refresh and browser navigation, and reject unknown projects", async ({ page }) => {
  await page.goto("/projects/secora");
  await expect(page.getByRole("heading", { name: "Secora", exact: true })).toBeVisible();
  await expect(page.getByRole("status", { name: "Starting Windows" })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Secora", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Back to shelf", exact: true }).click();
  await page.goBack();
  await expect(page.getByRole("heading", { name: "Secora", exact: true })).toBeVisible();
  await page.goForward();
  await expect(page.getByRole("heading", { name: "Project Library", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Resume", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Honor PreInvoice", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Contact", exact: true }).click();
  await expect(page.getByRole("link", { name: "Send email", exact: true })).toBeVisible();
  await page.goto("/projects/does-not-exist");
  await expect(page.getByRole("heading", { name: "Project not found", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "All projects", exact: true }).click();
  await expect(page.getByRole("button", { name: /^Open book:/ })).toHaveCount(8);
});

for (const size of [{ width: 320, height: 568 }, { width: 820, height: 1180 }, { width: 1440, height: 420 }]) {
  test(`the shelf and book fit ${size.width} by ${size.height} screens`, async ({ page }) => {
    await page.setViewportSize(size);
    await page.goto("/projects");
    await expect(page.getByRole("button", { name: /^Open book:/ })).toHaveCount(8);
    await page.getByRole("button", { name: "Open book: Honor PreInvoice", exact: true }).click();
    await expect(page.getByRole("button", { name: "Next page", exact: true })).toBeInViewport();
    expect(await page.locator("body").evaluate((element) => element.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole("button", { name: "Next page", exact: true }).click();
    await expect(page.getByRole("button", { name: "Previous page", exact: true })).toBeEnabled();
    expect(await page.locator(".book-spread").evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
    await page.getByRole("button", { name: "Back to shelf", exact: true }).click();
    await page.getByRole("button", { name: "Open book: Megatite Customers Club", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Megatite Customers Club", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Next page", exact: true })).toBeDisabled();
  });
}

test("keyboard navigation and reduced motion work without trapping visitors", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/projects/honor-preinvoice");
  await page.getByRole("region", { name: "Honor PreInvoice book", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("button", { name: "Enlarge: Customer details", exact: true })).toBeVisible();
  await expect(page.locator(".turning-paper")).toHaveCount(0);
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByRole("heading", { name: "Honor PreInvoice", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Open book: Honor PreInvoice", exact: true })).toBeFocused();
});

test("a failed full-size screenshot can be retried", async ({ page }) => {
  let fail = true;
  await page.route("**/assets/projects/honor-preinvoice/01-full.webp*", async (route) => {
    if (fail) { fail = false; await route.abort(); }
    else await route.continue();
  });
  await page.goto("/projects/honor-preinvoice");
  await page.getByRole("button", { name: "Enlarge: Customer details", exact: true }).click();
  const viewer = page.getByRole("dialog", { name: "Screenshot viewer", exact: true });
  await viewer.getByRole("button", { name: "Reload image", exact: true }).click();
  await expect(viewer.getByRole("img")).toBeVisible();
  expect(await viewer.getByRole("img").evaluate((image) => image.naturalWidth > 0)).toBe(true);
});

test("touch swipes turn pages and leave the next screenshot tap usable", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:5173/projects/honor-preinvoice");
  const client = await context.newCDPSession(page);
  async function swipeLeft() {
    const area = await page.locator(".book-spread").boundingBox();
    const y = area.y + area.height / 2;
    const start = area.x + area.width * .8;
    const end = area.x + area.width * .2;
    await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: start, y }] });
    // Sample a finger moving across the page; a zero-duration jump triggers browser tap suppression.
    for (let step = 1; step <= 8; step++) {
      await client.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: start + (end - start) * step / 8, y }] });
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
    await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect(page.getByRole("button", { name: "Next page", exact: true })).toBeEnabled();
  }
  await page.getByRole("heading", { name: "Honor PreInvoice", exact: true }).waitFor();
  await expect(page.getByRole("button", { name: "Next page", exact: true })).toBeEnabled();
  await swipeLeft();
  await expect(page.getByRole("button", { name: "Enlarge: Customer details", exact: true })).toBeVisible();
  await swipeLeft();
  const image = page.getByRole("button", { name: "Enlarge: Invoice details", exact: true });
  await expect(image).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Screenshot viewer", exact: true })).toHaveCount(0);
  await image.tap();
  await expect(page.getByRole("dialog", { name: "Screenshot viewer", exact: true })).toBeVisible();
  await context.close();
});

test("covers hinge without shifting the book, then zoom into a slowly turning spread", async ({ page }) => {
  await page.goto("/projects");
  await expect(page.getByText("Open a book.", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("group", { name: "Project type", exact: true })).toHaveCount(0);
  await expect(page.locator(".shelf-caption, .book-type")).toHaveCount(0);
  const book = page.getByRole("button", { name: "Open book: Honor PreInvoice", exact: true });
  const before = await book.boundingBox();
  await book.hover();
  await expect.poll(() => book.locator(".book-front").evaluate((element) => getComputedStyle(element).transform)).not.toBe("none");
  expect(await book.boundingBox()).toEqual(before);
  await book.click();
  await expect(page.locator(".book-flight")).toBeVisible();
  await expect(page.getByRole("button", { name: "Next page", exact: true })).toBeDisabled();
  await expect(page.locator(".book-flight")).toHaveCount(0);
  await expect(page.locator(".book-spread > .reader-page")).toHaveCount(2);
  await page.getByRole("button", { name: "Next page", exact: true }).click();
  const duration = await page.locator(".turning-paper").evaluate((element) => parseFloat(getComputedStyle(element).animationDuration));
  expect(duration).toBeGreaterThanOrEqual(.9);
  await expect(page.getByRole("button", { name: "Next page", exact: true })).toBeEnabled();
  await page.keyboard.press("Escape");
  await expect(book).toBeFocused();
});

test("enlarged images preserve browser history keyboard shortcuts", async ({ page }) => {
  await page.goto("/projects");
  await page.getByRole("button", { name: "Open book: Honor PreInvoice", exact: true }).click();
  await page.getByRole("button", { name: "Enlarge: Customer details", exact: true }).click();
  const viewer = page.getByRole("dialog", { name: "Screenshot viewer", exact: true });
  await page.evaluate(() => {
    window.historyKeys = [];
    window.addEventListener("keydown", (event) => {
      if (event.altKey && event.key.startsWith("Arrow")) window.historyKeys.push({ key: event.key, prevented: event.defaultPrevented });
    });
  });
  await page.keyboard.press("Alt+ArrowRight");
  await expect(viewer.getByRole("img", { name: "Honor PreInvoice — Customer details", exact: true })).toBeVisible();
  await page.keyboard.press("Alt+ArrowLeft");
  expect(await page.evaluate(() => window.historyKeys)).toEqual([
    { key: "ArrowRight", prevented: false }, { key: "ArrowLeft", prevented: false },
  ]);
  await page.goBack();
  await expect(page).toHaveURL(/\/projects$/);
  await expect(page.getByRole("heading", { name: "Project Library", exact: true })).toBeVisible();
});

test("camera transitions cancel safely on resize, history and reduced-motion changes", async ({ page }) => {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/projects");
  const cover = page.getByRole("button", { name: "Open book: Honor PreInvoice", exact: true });
  await cover.click();
  await expect(page.locator(".book-flight")).toBeVisible();
  await page.goBack();
  await expect(cover).toBeFocused();
  await expect(page.locator(".book-flight")).toHaveCount(0);
  await cover.click();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator(".book-flight")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Next page", exact: true })).toBeEnabled();
  await expect(page.locator(".book-spread > .reader-page")).toHaveCount(1);
  await page.getByRole("button", { name: "Back to shelf", exact: true }).click();
  await cover.click();
  await expect(page.locator(".book-flight")).toBeVisible();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".book-flight, .opening-cover")).toHaveCount(0);
  await page.getByRole("button", { name: "Next page", exact: true }).click();
  await expect(page.getByRole("button", { name: "Enlarge: Customer details", exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test("screenshot navigation keeps keyboard focus inside the viewer at either end", async ({ page }) => {
  await page.goto("/projects/honor-preinvoice");
  await page.getByRole("button", { name: "Enlarge: Customer details", exact: true }).click();
  const viewer = page.getByRole("dialog", { name: "Screenshot viewer", exact: true });
  for (let i = 0; i < 4; i++) await viewer.getByRole("button", { name: "Next image", exact: true }).click();
  await page.keyboard.press("Tab");
  expect(await viewer.evaluate(element => element.contains(document.activeElement))).toBe(true);
  await page.keyboard.press("Escape");
  await expect(viewer).toHaveCount(0);
});
