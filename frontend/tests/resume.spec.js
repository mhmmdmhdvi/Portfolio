import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

async function openResume(page) {
  await page.goto("/");
  await page.getByRole("status", { name: "Starting Windows" }).waitFor({ state: "hidden" });
  const shortcut = page.getByRole("main", { name: "Desktop" }).getByRole("button", { name: "Resume", exact: true });
  if (page.viewportSize().width <= 600) await shortcut.click();
  else await shortcut.dblclick();
  await expect(page.getByRole("dialog", { name: "File Explorer" })).toHaveCount(0);
  const resume = page.getByRole("dialog", { name: "Resume", exact: true });
  await expect(resume.getByRole("heading", { name: "Mohammad Mahdavi", exact: true })).toBeVisible();
  return resume;
}

test("Resume opens directly from the desktop and uses only supplied professional details", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const resume = await openResume(page);
  await expect(resume.getByText("Mid Level Full Stack Developer", { exact: true })).toBeVisible();
  await expect(resume.getByText("2021–2026", { exact: true })).toBeVisible();
  await expect(resume.getByRole("heading", { name: "Megatite CRM", exact: true })).toBeVisible();
  await expect(resume.locator('a[href^="mailto:"], a[href^="https://github.com"]')).toHaveCount(0);
  await resume.getByRole("heading", { name: "Date", exact: true }).scrollIntoViewIfNeeded();
  await expect(resume.getByRole("heading", { name: "Date", exact: true })).toBeInViewport();
  await resume.getByRole("button", { name: "Minimize", exact: true }).click();
  await page.getByRole("contentinfo", { name: "Taskbar" }).getByRole("button", { name: "Resume", exact: true }).click();
  await expect(resume).toBeVisible();
  expect(errors).toEqual([]);
});

test("the PDF loads on demand and downloads as a real PDF", async ({ page }) => {
  const requests = [];
  page.on("request", (request) => { if (request.url().endsWith(".pdf")) requests.push(request.url()); });
  const resume = await openResume(page);
  expect(requests).toEqual([]);
  const downloadEvent = page.waitForEvent("download");
  await resume.getByRole("link", { name: "Download CV", exact: true }).click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toBe("Mohammad-Mahdavi-Resume.pdf");
  expect(await download.failure()).toBeNull();
  const bytes = await readFile(await download.path());
  expect(bytes.subarray(0, 5).toString()).toBe("%PDF-");
  expect(bytes.length).toBeGreaterThan(5000);
});

test("Resume stays readable on a phone and when its desktop window narrows", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const resume = await openResume(page);
  const document = resume.locator(".resume-document");
  expect(await document.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  await resume.getByRole("heading", { name: "Date", exact: true }).scrollIntoViewIfNeeded();
  await expect(resume.getByRole("heading", { name: "Date", exact: true })).toBeInViewport();
  await page.setViewportSize({ width: 950, height: 600 });
  expect(await document.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  await resume.getByRole("button", { name: "Maximize", exact: true }).click();
  expect(await document.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
});
