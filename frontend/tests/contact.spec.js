import { expect, test } from "@playwright/test";

async function openContact(page) {
  await page.goto("/");
  await page.getByRole("status", { name: "Starting Windows" }).waitFor({ state: "hidden" });
  const shortcut = page.getByRole("main", { name: "Desktop" }).getByRole("button", { name: "Contact Me", exact: true });
  if (page.viewportSize().width <= 600) await shortcut.click();
  else await shortcut.dblclick();
  await expect(page.getByRole("dialog", { name: "File Explorer", exact: true })).toHaveCount(0);
  const contact = page.getByRole("dialog", { name: "Contact Me", exact: true });
  await expect(contact.getByRole("heading", { name: "Contact Me", exact: true })).toBeVisible();
  return contact;
}

test("Contact Me opens directly from the desktop with the supplied public links", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const contact = await openContact(page);
  await expect(contact.getByRole("link", { name: "Send email", exact: true })).toHaveAttribute("href", "mailto:mhmmd.mhdvi82@gmail.com");
  await expect(contact.getByRole("link", { name: "Call", exact: true })).toHaveAttribute("href", "tel:+989392360398");
  const linkedin = contact.getByRole("link", { name: "Open profile", exact: true });
  await expect(linkedin).toHaveAttribute("href", "https://www.linkedin.com/in/mohammad-mahdavi-devops");
  await expect(linkedin).toHaveAttribute("target", "_blank");
  await expect(linkedin).toHaveAttribute("rel", /noopener/);
  await expect(linkedin).toHaveAttribute("rel", /noreferrer/);
  await expect(contact.locator('a[href*="github.com"], form')).toHaveCount(0);
  await expect(contact.getByRole("img", { name: "Portrait of Mohammad Mahdavi", exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test("copying contact information uses the clipboard and handles denied access", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const contact = await openContact(page);
  await contact.getByRole("button", { name: "Copy email address", exact: true }).click();
  await expect(contact.getByRole("status")).toHaveText("Email address copied.");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("mhmmd.mhdvi82@gmail.com");
  await page.evaluate(() => Object.defineProperty(navigator.clipboard, "writeText", {
    configurable: true,
    value: async () => { throw new DOMException("Permission denied", "NotAllowedError"); },
  }));
  await contact.getByRole("button", { name: "Copy phone number", exact: true }).click();
  await expect(contact.getByRole("status")).toHaveText("Couldn't copy. Select the address or number and copy it.");
  await expect(contact.getByRole("button", { name: "Copy phone number", exact: true })).toBeEnabled();
});

test("Persian contact details fit a small phone and the language survives reopening", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  const contact = await openContact(page);
  await contact.getByRole("button", { name: "فارسی", exact: true }).click();
  const sheet = contact.locator(".contact-sheet");
  await expect(sheet).toHaveAttribute("lang", "fa");
  await expect(sheet).toHaveAttribute("dir", "rtl");
  await expect(contact.getByRole("heading", { name: "ارتباط با من", exact: true })).toBeVisible();
  for (const [width, height] of [[320, 568], [390, 844], [820, 1180], [1180, 820], [568, 320]]) {
    await page.setViewportSize({ width, height });
    expect(await sheet.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
    await contact.getByRole("link", { name: "تماس", exact: true }).scrollIntoViewIfNeeded();
    await expect(contact.getByRole("link", { name: "تماس", exact: true })).toBeInViewport();
  }
  await contact.getByRole("button", { name: "Close", exact: true }).click();
  await page.reload();
  await page.getByRole("status", { name: "Starting Windows" }).waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await page.getByRole("searchbox", { name: "Search apps, settings, and documents", exact: true }).fill("Contact Me");
  await page.getByRole("region", { name: "Search", exact: true }).getByRole("button", { name: "Contact Me", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Contact Me", exact: true }).getByRole("heading", { name: "ارتباط با من", exact: true })).toBeVisible();
});

test("iPad visitors open Contact Me with a single tap", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, viewport: { width: 820, height: 1180 }, hasTouch: true, isMobile: true });
  try {
    const page = await context.newPage();
    await page.goto("/");
    await page.getByRole("status", { name: "Starting Windows" }).waitFor({ state: "hidden" });
    await page.getByRole("main", { name: "Desktop" }).getByRole("button", { name: "Contact Me", exact: true }).tap();
    await expect(page.getByRole("dialog", { name: "Contact Me", exact: true })).toBeVisible();
    await expect(page.getByRole("dialog", { name: "File Explorer", exact: true })).toHaveCount(0);
  } finally {
    await context.close();
  }
});
