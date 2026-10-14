import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

async function openResume(page) {
  await page.goto("/");
  await page.getByRole("status", { name: "Starting Windows" }).waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await page.getByRole("searchbox", { name: "Search apps, settings, and documents" }).fill("Resume");
  await page.getByRole("region", { name: "Search", exact: true }).getByRole("button", { name: "Resume", exact: true }).click();
  const app = page.getByRole("dialog", { name: "Resume", exact: true });
  await expect(app.getByRole("heading", { name: "Mohammad Mahdavi", exact: true })).toBeVisible();
  return app;
}

test("Resume has the portrait and switches to Persian without changing the English desktop", async ({ page }) => {
  const app = await openResume(page);
  const portrait = app.getByRole("img", { name: "Portrait of Mohammad Mahdavi" });
  await expect(portrait).toBeVisible();
  await expect.poll(() => portrait.evaluate((image) => image.complete && image.naturalWidth > 0)).toBe(true);
  await app.getByRole("heading", { name: "Date", exact: true }).scrollIntoViewIfNeeded();
  await app.getByRole("button", { name: "فارسی", exact: true }).click();
  await expect(app.locator(".resume-document")).toHaveAttribute("dir", "rtl");
  await expect(app.locator(".resume-document")).toHaveAttribute("lang", "fa");
  await expect(app.getByRole("heading", { name: "محمد مهدوی", exact: true })).toBeInViewport();
  await expect(app.getByRole("heading", { name: "مهارت‌های فنی", exact: true })).toBeVisible();
  await expect(page.getByRole("main", { name: "Desktop" }).getByRole("button", { name: "Resume", exact: true })).toBeVisible();
  await expect(app.locator('a[href^="mailto:"], a[href^="https://github.com"]')).toHaveCount(0);
  await app.getByRole("button", { name: "English", exact: true }).click();
  await expect(app.locator(".resume-document")).toHaveAttribute("dir", "ltr");
  await expect(app.getByRole("heading", { name: "Mohammad Mahdavi", exact: true })).toBeInViewport();
});

test("Persian selection survives reopening and downloads its own PDF", async ({ page }) => {
  const app = await openResume(page);
  await app.getByRole("button", { name: "فارسی", exact: true }).click();
  const downloading = page.waitForEvent("download");
  await app.getByRole("link", { name: "دریافت PDF", exact: true }).click();
  const download = await downloading;
  expect(download.suggestedFilename()).toBe("Mohammad-Mahdavi-Resume-fa.pdf");
  expect(await download.failure()).toBeNull();
  const bytes = await readFile(await download.path());
  expect(bytes.subarray(0, 5).toString()).toBe("%PDF-");
  await page.reload();
  await page.getByRole("status", { name: "Starting Windows" }).waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await page.getByRole("searchbox").fill("Resume");
  await page.getByRole("region", { name: "Search", exact: true }).getByRole("button", { name: "Resume", exact: true }).click();
  await expect(page.getByRole("heading", { name: "محمد مهدوی", exact: true })).toBeVisible();
});

test("Persian portrait, text and technology names fit a narrow phone", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  const app = await openResume(page);
  await app.getByRole("button", { name: "فارسی", exact: true }).click();
  const document = app.locator(".resume-document");
  expect(await document.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  expect(await app.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  await app.getByRole("heading", { name: "Date", exact: true }).scrollIntoViewIfNeeded();
  await expect(app.getByRole("heading", { name: "Date", exact: true })).toBeInViewport();
  await expect(app.locator(".resume-stack").last().locator("bdi")).toHaveAttribute("dir", "ltr");
});
