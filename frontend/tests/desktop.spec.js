import { test, expect } from "@playwright/test";

test("desktop shortcuts open portfolio windows directly and link to GitHub in the requested order", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("status", { name: "Starting Windows" }).waitFor({ state: "hidden" });
  const desktop = page.getByRole("main", { name: "Desktop" });
  await expect(desktop.locator(".desktop-icon")).toHaveText(["This PC", "Recycle Bin", "Games", "Resume", "Contact Me", "GitHub", "Projects"]);
  const github = desktop.getByRole("link", { name: "GitHub", exact: true });
  await expect(github).toHaveAttribute("href", "https://github.com/mhmmdmhdvi");
  await expect(github).toHaveAttribute("target", "_blank");
  await expect(github).toHaveAttribute("rel", /noopener/);
  await expect(github).toHaveAttribute("rel", /noreferrer/);
  for (const name of ["Resume", "Contact Me"]) {
    await desktop.getByRole("button", { name, exact: true }).dblclick();
    const window = page.getByRole("dialog", { name, exact: true });
    await expect(window).toBeVisible();
    await expect(page.getByRole("dialog", { name: "File Explorer", exact: true })).toHaveCount(0);
    await window.getByRole("button", { name: "Close", exact: true }).click();
  }
});

test("boots into the desktop after four seconds", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("status", { name: "Starting Windows" }),
  ).toBeVisible();
  await page.waitForTimeout(2500);
  await expect(
    page.getByRole("status", { name: "Starting Windows" }),
  ).toBeVisible();
  await expect(
    page.getByRole("status", { name: "Starting Windows" }),
  ).toBeHidden({ timeout: 3000 });
  await expect(
    page.getByRole("button", { name: "Start", exact: true }),
  ).toBeVisible();
});

test("opens, minimizes, restores and closes File Explorer", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("status", { name: "Starting Windows" })
    .waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "This PC", exact: true }).dblclick();
  const explorer = page.getByRole("dialog", { name: "File Explorer" });
  await expect(explorer).toBeVisible();
  await explorer.getByRole("button", { name: "Minimize" }).click();
  await expect(explorer).toBeHidden();
  await page
    .getByRole("button", { name: "File Explorer", exact: true })
    .click();
  await expect(explorer).toBeVisible();
  await explorer.getByRole("button", { name: "Maximize" }).click();
  await explorer.getByRole("button", { name: "Restore" }).click();
  await explorer.getByRole("button", { name: "Close", exact: true }).click();
  await expect(explorer).toHaveCount(0);
});

test("search launches an app and Escape closes shell panels", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("status", { name: "Starting Windows" })
    .waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await page
    .getByRole("searchbox", { name: "Search apps, settings, and documents" })
    .fill("calculator");
  await page.getByRole("button", { name: "Calculator", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Calculator" })).toBeVisible();
  await page.getByRole("button", { name: "Quick settings" }).click();
  await expect(
    page.getByRole("dialog", { name: "Quick settings" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("dialog", { name: "Quick settings" }),
  ).toHaveCount(0);
});

test("mobile windows fit the screen", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page
    .getByRole("status", { name: "Starting Windows" })
    .waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "This PC", exact: true }).click();
  const explorer = page.getByRole("dialog", { name: "File Explorer" });
  await expect(explorer).toBeVisible();
  const bounds = await explorer.boundingBox();
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.width).toBeLessThanOrEqual(390);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(796);
});

test("saved night light survives a fresh visit", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("status", { name: "Starting Windows" })
    .waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "Quick settings" }).click();
  await page.getByRole("button", { name: "Night light", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Night light", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await page
    .getByRole("status", { name: "Starting Windows" })
    .waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "Quick settings" }).click();
  await expect(
    page.getByRole("button", { name: "Night light", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("keeps window controls onscreen when the viewport shrinks", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await page
    .getByRole("status", { name: "Starting Windows" })
    .waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "This PC", exact: true }).dblclick();
  await page.setViewportSize({ width: 800, height: 700 });
  const explorer = page.getByRole("dialog", { name: "File Explorer" });
  const bounds = await explorer.boundingBox();
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(800);
  await explorer.getByRole("button", { name: "Close", exact: true }).click();
  await expect(explorer).toHaveCount(0);
});

test("Calculator does not consume text typed into shell search", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("status", { name: "Starting Windows" })
    .waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await page.getByRole("button", { name: "Calculator", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Calculator" })).toBeVisible();
  await page.getByRole("button", { name: "Search", exact: true }).click();
  const search = page.getByRole("searchbox", {
    name: "Search apps, settings, and documents",
  });
  await search.pressSequentially("123");
  await expect(search).toHaveValue("123");
  await expect(
    page.getByRole("dialog", { name: "Calculator" }).getByLabel("Result"),
  ).toHaveText("0");
});

test("boot prevents opening desktop apps from the keyboard", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("status", { name: "Starting Windows" }),
  ).toBeVisible();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await page
    .getByRole("status", { name: "Starting Windows" })
    .waitFor({ state: "hidden" });
  await expect(page.getByRole("dialog", { name: "Recycle Bin" })).toHaveCount(
    0,
  );
});

test("Flag mode can both add and remove a flag on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page
    .getByRole("status", { name: "Starting Windows" })
    .waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await page.getByRole("button", { name: "Minesweeper", exact: true }).click();
  const game = page.getByRole("dialog", { name: "Minesweeper" });
  await game.getByRole("button", { name: "Flag mode" }).click();
  await game.getByRole("button", { name: "Cell 1, 1", exact: true }).click();
  await expect(
    game.getByRole("button", { name: "Cell 1, 1, flagged", exact: true }),
  ).toBeVisible();
  await game
    .getByRole("button", { name: "Cell 1, 1, flagged", exact: true })
    .click();
  await expect(
    game.getByRole("button", { name: "Cell 1, 1", exact: true }),
  ).toBeVisible();
});
