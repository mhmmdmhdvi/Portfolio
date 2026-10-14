import { expect, test } from "@playwright/test";

async function openGame(page, title) {
  await page.goto("/");
  await page.getByRole("status", { name: "Starting Windows" }).waitFor({ state: "hidden" });
  const folder = page.getByRole("main", { name: "Desktop" }).getByRole("button", { name: "Games", exact: true });
  if (page.viewportSize().width <= 600) await folder.click(); else await folder.dblclick();
  const shortcut = page.getByRole("dialog", { name: "File Explorer" }).getByRole("button", { name: title, exact: true });
  if (page.viewportSize().width <= 600) await shortcut.click(); else await shortcut.dblclick();
  const game = page.getByRole("dialog", { name: title, exact: true });
  await expect(game.getByRole("button", { name: "Launch ball", exact: true })).toBeVisible();
  return game;
}

test("Pause hotkey does not pause an unstarted arcade game", async ({ page }) => {
  const game = await openGame(page, "Breakout");
  await game.locator("canvas").focus();
  await page.keyboard.press("p");
  await expect(game.getByRole("status")).toHaveText("Ready to launch");
  await page.keyboard.press("Space");
  await expect(game.getByRole("status")).toHaveText("Playing");
  await page.keyboard.press("p");
  await expect(game.getByRole("status")).toHaveText("Paused");
  await page.keyboard.press("p");
  await expect(game.getByRole("status")).toHaveText("Playing");
});

test("Pinball flipper buttons respond to keyboard hold and release", async ({ page }) => {
  const game = await openGame(page, "Pinball");
  const canvas = game.locator("canvas");
  const button = game.getByRole("button", { name: "Left flipper", exact: true });
  await button.focus();
  const initial = await canvas.evaluate((element) => element.toDataURL());
  await page.keyboard.down("Enter");
  await expect.poll(() => canvas.evaluate((element, image) => element.toDataURL() !== image, initial), { timeout: 1500 }).toBe(true);
  await page.keyboard.up("Enter");
  await expect.poll(() => canvas.evaluate((element, image) => element.toDataURL() === image, initial)).toBe(true);
});

test("short arcade windows keep a readable board and scroll to their controls", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 340 });
  const game = await openGame(page, "Pinball");
  const box = await game.locator("canvas").boundingBox();
  expect(box.height).toBeGreaterThan(200);
  await game.getByRole("button", { name: "Right flipper", exact: true }).scrollIntoViewIfNeeded();
  await expect(game.getByRole("button", { name: "Right flipper", exact: true })).toBeInViewport();
  expect(await game.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
});

test("a minimized game can be restored from the phone taskbar", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const game = await openGame(page, "Pinball");
  await game.getByRole("button", { name: "Minimize", exact: true }).click();
  const task = page.getByRole("contentinfo", { name: "Taskbar" }).getByRole("button", { name: "Pinball", exact: true });
  await expect(task).toBeVisible();
  await task.click();
  await expect(game).toBeVisible();
});

test("running games stay clear of the system tray on a narrow desktop", async ({ page }) => {
  await page.setViewportSize({ width: 901, height: 720 });
  const first = await openGame(page, "Pinball");
  await first.getByRole("button", { name: "Minimize", exact: true }).click();
  const titles = ["Solitaire", "Snake", "2048", "Breakout", "Chess", "Minesweeper"];
  for (const title of titles) {
    await page.getByRole("dialog", { name: "File Explorer" }).getByRole("button", { name: title, exact: true }).dblclick();
    const game = page.getByRole("dialog", { name: title, exact: true });
    await game.locator(".game-shell").waitFor();
    await game.getByRole("button", { name: "Minimize", exact: true }).click();
  }
  const apps = await page.locator(".taskbar-apps").boundingBox();
  const tray = await page.locator(".system-tray").boundingBox();
  expect(apps.x + apps.width).toBeLessThanOrEqual(tray.x);
  const taskbar = page.getByRole("contentinfo", { name: "Taskbar" });
  for (const title of ["Pinball", ...titles]) {
    const button = taskbar.getByRole("button", { name: title, exact: true });
    await button.scrollIntoViewIfNeeded();
    await button.click();
    const game = page.getByRole("dialog", { name: title, exact: true });
    await expect(game).toBeVisible();
    await game.getByRole("button", { name: "Minimize", exact: true }).click();
  }
});
