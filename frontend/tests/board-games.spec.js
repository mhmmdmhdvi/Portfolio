import { test, expect } from "@playwright/test";
import { moveBoard } from "../src/components/apps/twenty48/game.js";

async function bootAndOpen(page, title, viewport) {
  await page.setViewportSize(viewport);
  await page.addInitScript(() => {
    Date.now = () => 1700000000000;
    Math.random = () => 0.25;
  });
  await page.goto("/");
  await page.getByRole("status", { name: "Starting Windows" }).waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await page.getByRole("searchbox", { name: "Search apps, settings, and documents" }).fill(title);
  await page.getByRole("button", { name: title, exact: true }).click();
  const dialog = page.getByRole("dialog", { name: title, exact: true });
  await expect(dialog).toBeVisible();
  return dialog;
}

async function tileGeometry(dialog) {
  return dialog.locator(".twenty48-board").evaluate((board) => {
    const bounds = board.getBoundingClientRect();
    return {
      board: { width: bounds.width, height: bounds.height },
      tiles: Array.from(board.querySelectorAll(".twenty48-tile"), (tile) => {
        const rect = tile.getBoundingClientRect();
        return { width: rect.width, height: rect.height };
      }),
    };
  });
}

function expectSquareTiles(geometry, baseline) {
  expect(Math.abs(geometry.board.width - geometry.board.height), "board must remain square").toBeLessThan(0.5);
  for (const tile of geometry.tiles) {
    expect(Math.abs(tile.width - tile.height), "populated and empty cells must remain square").toBeLessThan(0.5);
    expect(Math.abs(tile.height - baseline.tiles[0].height), "moves must not resize cells").toBeLessThan(0.5);
  }
}

const keyFor = { left: "ArrowLeft", right: "ArrowRight", up: "ArrowUp", down: "ArrowDown" };

function chooseMove(board) {
  return Object.keys(keyFor).map((direction) => {
    const moved = moveBoard(board, direction);
    const highest = Math.max(...moved.board);
    const corner = Math.max(moved.board[0], moved.board[3], moved.board[12], moved.board[15]);
    return { direction, changed: moved.changed, value: moved.board.filter((value) => !value).length * 20 + moved.score + (corner === highest ? highest / 3 : 0) };
  }).filter((move) => move.changed).sort((a, b) => b.value - a.value)[0];
}

for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
  test(`2048 keeps equal square cells through real merges and high values at ${viewport.width}px`, async ({ page }) => {
    const dialog = await bootAndOpen(page, "2048", viewport);
    const baseline = await tileGeometry(dialog);
    expectSquareTiles(baseline, baseline);
    let highest = 0;
    for (let turn = 0; turn < 180; turn++) {
      const board = (await dialog.locator(".twenty48-tile").allTextContents()).map((text) => Number(text) || 0);
      highest = Math.max(...board);
      if (highest >= 128) break;
      const move = chooseMove(board);
      expect(move, "the test game must remain playable until a high value is reached").toBeTruthy();
      await page.keyboard.press(keyFor[move.direction]);
      expectSquareTiles(await tileGeometry(dialog), baseline);
    }
    expect(highest).toBeGreaterThanOrEqual(128);
    await dialog.getByRole("button", { name: "Undo", exact: true }).click();
    expectSquareTiles(await tileGeometry(dialog), baseline);
    await dialog.getByRole("button", { name: "New game", exact: true }).click();
    expectSquareTiles(await tileGeometry(dialog), baseline);
    await expect(dialog.locator(".arcade-score")).toHaveText("Score 0");
  });
}

test("Snake remains square in a short desktop window", async ({ page }) => {
  const dialog = await bootAndOpen(page, "Snake", { width: 900, height: 500 });
  const board = await dialog.locator(".snake-board").boundingBox();
  expect(Math.abs(board.width - board.height)).toBeLessThan(0.5);
  await expect(dialog.getByRole("button", { name: "Start game", exact: true })).toBeInViewport();
  await expect(dialog.getByRole("button", { name: "Turn up", exact: true })).toBeInViewport();
});

test("Snake Space pauses after a direction button and resumes without restarting", async ({ page }) => {
  const dialog = await bootAndOpen(page, "Snake", { width: 1440, height: 1000 });
  await dialog.getByRole("button", { name: "Start", exact: true }).click();
  await dialog.getByRole("button", { name: "Turn up", exact: true }).click();
  await page.keyboard.press("Space");
  await expect(dialog.getByRole("status")).toContainText("Paused");
  const head = dialog.locator('.snake-board rect[fill="#b6f6ba"]');
  const position = await head.evaluate((node) => `${node.getAttribute("x")},${node.getAttribute("y")}`);
  await page.waitForTimeout(260);
  expect(await head.evaluate((node) => `${node.getAttribute("x")},${node.getAttribute("y")}`)).toBe(position);
  await page.keyboard.press("Space");
  await expect(dialog.getByRole("status")).toHaveText("Playing");
  await expect.poll(() => head.evaluate((node) => `${node.getAttribute("x")},${node.getAttribute("y")}`)).not.toBe(position);
});
