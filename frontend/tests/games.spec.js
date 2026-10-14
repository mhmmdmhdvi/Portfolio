import { test, expect } from "@playwright/test";

const titles = [
  "Solitaire",
  "Snake",
  "2048",
  "Breakout",
  "Pinball",
  "Chess",
  "Minesweeper",
];

async function boot(page) {
  await page.goto("/");
  await page
    .getByRole("status", { name: "Starting Windows" })
    .waitFor({ state: "hidden" });
}
async function folder(page) {
  await page
    .getByRole("main", { name: "Desktop" })
    .getByRole("button", { name: "Games", exact: true })
    .dblclick();
  const explorer = page.getByRole("dialog", { name: "File Explorer" });
  for (const title of titles)
    await expect(
      explorer.getByRole("button", { name: title, exact: true }),
    ).toBeVisible();
  return explorer;
}
async function game(page, explorer, title) {
  await explorer.getByRole("button", { name: title, exact: true }).dblclick();
  const dialog = page.getByRole("dialog", { name: title, exact: true });
  await expect(dialog).toBeVisible();
  return dialog;
}

test("Games replaces Edge and launches all seven games", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await boot(page);
  await expect(
    page.getByRole("button", { name: "Microsoft Edge", exact: true }),
  ).toHaveCount(0);
  const explorer = await folder(page);
  for (const title of titles) {
    const dialog = await game(page, explorer, title);
    if (["Breakout", "Pinball"].includes(title)) {
      await dialog
        .getByRole("button", { name: "Launch ball", exact: true })
        .click();
      await expect(dialog.getByRole("status")).toHaveText("Playing");
      await dialog.getByRole("button", { name: "Pause", exact: true }).click();
      await expect(dialog.getByRole("status")).toHaveText("Paused");
    }
    if (title === "Solitaire") {
      await dialog
        .getByRole("button", { name: /Stock, .* cards\. Draw one card/ })
        .click();
      await expect(
        dialog.getByRole("button", { name: "Undo", exact: true }),
      ).toBeEnabled();
      await dialog.getByRole("button", { name: "Undo", exact: true }).click();
    }
    if (title === "Snake") {
      await dialog.getByRole("button", { name: "Start", exact: true }).click();
      await expect(dialog.getByRole("status")).toHaveText("Playing");
    }
    await dialog.getByRole("button", { name: "Close", exact: true }).click();
  }
  expect(errors).toEqual([]);
});

test("reopening the desktop folder returns an existing Explorer to Games", async ({
  page,
}) => {
  await boot(page);
  const explorer = await folder(page);
  await explorer
    .getByRole("navigation", { name: "Folders" })
    .getByRole("button", { name: "Documents", exact: true })
    .click();
  await expect(explorer.getByRole("searchbox", { name: "Search Documents", exact: true })).toBeVisible();
  await folder(page);
});

test("Chess plays a computer move and supports a local game and undo", async ({
  page,
}) => {
  await boot(page);
  const explorer = await folder(page);
  const chess = await game(page, explorer, "Chess");
  await expect(chess.getByRole("combobox", { name: "Game mode" })).toHaveValue(
    "computer",
  );
  await chess
    .getByRole("gridcell", { name: "e2, White pawn", exact: true })
    .click();
  await chess.getByRole("gridcell", { name: /e4, empty/ }).click();
  await expect(chess.getByRole("status")).toHaveText("White to move", {
    timeout: 15000,
  });
  await chess.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(
    chess.getByRole("gridcell", { name: "e2, White pawn", exact: true }),
  ).toBeVisible();
  await chess
    .getByRole("combobox", { name: "Game mode" })
    .selectOption("local");
  await chess
    .getByRole("gridcell", { name: "e2, White pawn", exact: true })
    .click();
  await chess.getByRole("gridcell", { name: /e4, empty/ }).click();
  await expect(chess.getByRole("status")).toHaveText("Black to move");
  await chess
    .getByRole("gridcell", { name: "e7, Black pawn", exact: true })
    .click();
  await chess.getByRole("gridcell", { name: /e5, empty/ }).click();
  await expect(chess.getByRole("status")).toHaveText("White to move");
});

test("active games do not consume shell typing and Snake pauses while minimized", async ({
  page,
}) => {
  await boot(page);
  const explorer = await folder(page);
  const snake = await game(page, explorer, "Snake");
  await snake.getByRole("button", { name: "Start", exact: true }).click();
  await snake.getByRole("button", { name: "Minimize", exact: true }).click();
  await page.getByRole("button", { name: "Search", exact: true }).click();
  const search = page.getByRole("searchbox", {
    name: "Search apps, settings, and documents",
  });
  await search.pressSequentially("wasd p chess");
  await expect(search).toHaveValue("wasd p chess");
  await page.keyboard.press("Escape");
  await page
    .getByRole("contentinfo", { name: "Taskbar" })
    .getByRole("button", { name: "Snake", exact: true })
    .click();
  await expect(snake.getByRole("status")).toContainText("Paused");
});

test("all game windows fit a phone and remain usable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await boot(page);
  await page
    .getByRole("main", { name: "Desktop" })
    .getByRole("button", { name: "Games", exact: true })
    .click();
  const explorer = page.getByRole("dialog", { name: "File Explorer" });
  for (const title of titles) {
    await explorer.getByRole("button", { name: title, exact: true }).click();
    const dialog = page.getByRole("dialog", { name: title, exact: true });
    await expect(dialog).toBeVisible();
    const bounds = await dialog.boundingBox();
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.width).toBeLessThanOrEqual(390);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(796);
    expect(
      await dialog.evaluate(
        (element) => element.scrollWidth <= element.clientWidth,
      ),
    ).toBe(true);
    await dialog.getByRole("button", { name: "Close", exact: true }).click();
  }
});

test("restarting pauses a running game throughout the boot screen", async ({
  page,
}) => {
  await boot(page);
  const explorer = await folder(page);
  const breakout = await game(page, explorer, "Breakout");
  await breakout
    .getByRole("button", { name: "Launch ball", exact: true })
    .click();
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await page.getByRole("button", { name: "Power", exact: true }).click();
  await page.getByRole("button", { name: "Restart", exact: true }).click();
  await expect(
    page.getByRole("status", { name: "Starting Windows" }),
  ).toBeVisible();
  const window = page.locator(".app-breakout");
  await expect(window.locator(".game-status")).toHaveText("Paused", {
    timeout: 1500,
  });
  const frame = await window
    .locator("canvas")
    .evaluate((canvas) => canvas.toDataURL());
  await page.waitForTimeout(400);
  expect(
    await window.locator("canvas").evaluate((canvas) => canvas.toDataURL()),
  ).toBe(frame);
  await page
    .getByRole("status", { name: "Starting Windows" })
    .waitFor({ state: "hidden" });
  await expect(breakout.getByRole("status")).toHaveText("Playing");
});
