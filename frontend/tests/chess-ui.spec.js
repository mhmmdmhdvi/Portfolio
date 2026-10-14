import { test, expect } from "@playwright/test";

async function openChess(page) {
  await page.goto("/");
  await page.getByRole("status", { name: "Starting Windows" }).waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await page.getByRole("searchbox").fill("chess");
  await page.getByRole("button", { name: "Chess", exact: true }).click();
  const app = page.locator(".app-chess");
  await expect(app.getByRole("grid", { name: "Chessboard" })).toBeVisible();
  return app;
}

function square(app, name) {
  return app.locator(`[data-square="${name}"]`);
}

async function move(app, from, to) {
  await square(app, from).click();
  await square(app, to).click();
}

async function play(app, moves) {
  for (const [from, to] of moves) await move(app, from, to);
}

const promotionMoves = [
  ["a2", "a4"], ["h7", "h5"], ["a4", "a5"], ["h5", "h4"],
  ["a5", "a6"], ["h4", "h3"], ["a6", "b7"], ["h3", "g2"], ["b7", "a8"],
];

test("chess plays legal moves, castles, undoes and navigates a flipped board", async ({ page }) => {
  const app = await openChess(page);
  const player = await app.locator(".chess-player").last().boundingBox();
  const footer = await app.locator(".game-footer").boundingBox();
  expect(player.y + player.height).toBeLessThanOrEqual(footer.y);
  await app.getByRole("combobox", { name: "Game mode" }).selectOption("local");
  await move(app, "e2", "e5");
  await expect(square(app, "e2")).toHaveAttribute("aria-label", "e2, White pawn");
  await expect(app.locator(".chess-moves li")).toHaveCount(0);
  await square(app, "e2").click();
  await expect(square(app, "e4")).toHaveAttribute("aria-label", /legal move/);
  await square(app, "e4").click();
  await play(app, [["e7", "e5"], ["g1", "f3"], ["b8", "c6"], ["f1", "e2"], ["g8", "f6"], ["e1", "g1"]]);
  await expect(square(app, "f1")).toHaveAttribute("aria-label", "f1, White rook");
  await expect(square(app, "g1")).toHaveAttribute("aria-label", "g1, White king");
  await app.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(square(app, "e1")).toHaveAttribute("aria-label", "e1, White king");
  await app.getByRole("button", { name: "Flip board" }).click();
  await expect(app.locator(".chess-square").first()).toHaveAttribute("data-square", "h1");
  await square(app, "e2").focus();
  await page.keyboard.press("ArrowRight");
  await expect(square(app, "d2")).toBeFocused();
  await page.keyboard.press("Home");
  await expect(square(app, "h2")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(app.locator('[aria-selected="true"]')).toHaveCount(0);
  await page.screenshot({ path: "playwright-report/ui-audit/chess-desktop.png", animations: "disabled" });
  await page.evaluate(() => document.querySelector(".windows-shell").setAttribute("data-theme", "dark"));
  await page.screenshot({ path: "playwright-report/ui-audit/chess-desktop-dark.png", animations: "disabled" });
});

test("promotion cancel and selection return keyboard focus to the board", async ({ page }) => {
  const app = await openChess(page);
  await app.getByRole("combobox", { name: "Game mode" }).selectOption("local");
  await play(app, promotionMoves);
  await expect(app.getByRole("button", { name: "Promote to queen" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(app.getByRole("dialog", { name: "Choose promotion" })).toHaveCount(0);
  await expect(square(app, "b7")).toBeFocused();
  await expect(square(app, "b7")).toHaveAttribute("aria-label", /White pawn/);
  await square(app, "a8").click();
  await app.getByRole("button", { name: "Promote to knight" }).click();
  await expect(square(app, "a8")).toHaveAttribute("aria-label", "a8, White knight");
  await expect(square(app, "a8")).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(square(app, "b8")).toBeFocused();
});

test("en passant and checkmate work through the visible board", async ({ page }) => {
  const app = await openChess(page);
  await app.getByRole("combobox", { name: "Game mode" }).selectOption("local");
  await play(app, [["e2", "e4"], ["a7", "a6"], ["e4", "e5"], ["d7", "d5"]]);
  await square(app, "e5").click();
  await expect(square(app, "d6").locator(".chess-move-hint.capture")).toBeVisible();
  await square(app, "d6").click();
  await expect(square(app, "d5")).toHaveAttribute("aria-label", "d5, empty");
  await expect(square(app, "d6")).toHaveAttribute("aria-label", "d6, White pawn");
  await app.getByRole("button", { name: "New game", exact: true }).click();
  await play(app, [["f2", "f3"], ["e7", "e5"], ["g2", "g4"], ["d8", "h4"]]);
  await expect(app.locator(".chess-position-status strong")).toHaveText("Black wins by checkmate");
  await expect(app.getByRole("grid", { name: "Chessboard" })).toHaveAttribute("aria-disabled", "true");
  await square(app, "a2").click({ force: true });
  await square(app, "a3").click({ force: true });
  await expect(app.locator(".chess-moves li")).toHaveCount(2);
  await app.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(app.getByRole("grid", { name: "Chessboard" })).toHaveAttribute("aria-disabled", "false");
});

test("computer pauses while minimized and responds once after restore", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const app = await openChess(page);
  await square(app, "e2").click();
  await page.evaluate(() => {
    document.querySelector('[data-square="e4"]').click();
    document.querySelector('.app-chess [aria-label="Minimize"]').click();
  });
  await expect(app).toBeHidden();
  await page.waitForTimeout(700);
  await expect(app.locator(".chess-moves li span:last-child")).toHaveText("—");
  await page.getByRole("button", { name: "Chess", exact: true }).click();
  await expect(app.locator(".chess-moves li span:last-child")).not.toHaveText("—");
  await app.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(app.locator(".chess-moves li")).toHaveCount(0);
  await app.getByRole("button", { name: "Maximize", exact: true }).click();
  await expect(square(app, "e2")).toHaveAttribute("aria-label", "e2, White pawn");
  await app.getByRole("button", { name: "Restore", exact: true }).click();
  await square(app, "d2").click();
  await page.evaluate(() => {
    document.querySelector('[data-square="d4"]').click();
    document.querySelector('.app-chess .game-actions button').click();
  });
  await page.waitForTimeout(700);
  await expect(app.locator(".chess-moves li")).toHaveCount(0);
  await square(app, "c2").click();
  await page.evaluate(() => {
    document.querySelector('[data-square="c4"]').click();
    const mode = document.querySelector('.app-chess [aria-label="Game mode"]');
    mode.value = "local";
    mode.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.waitForTimeout(700);
  await expect(app.locator(".chess-moves li")).toHaveCount(0);
  await expect(square(app, "c2")).toHaveAttribute("aria-label", "c2, White pawn");
  await move(app, "e2", "e4");
  await move(app, "e7", "e5");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  const search = page.getByRole("searchbox");
  await search.pressSequentially("chess 123");
  await expect(search).toHaveValue("chess 123");
  await expect(app.locator(".chess-moves li")).toHaveCount(1);
  expect(errors).toEqual([]);
});

test("computer pauses when another app has focus and does not consume typing", async ({ page }) => {
  const app = await openChess(page);
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await page.getByRole("searchbox").fill("notepad");
  await page.getByRole("button", { name: "Notepad", exact: true }).click();
  const editor = page.locator(".app-notepad textarea");
  await expect(editor).toBeVisible();
  await page.getByRole("button", { name: "Chess", exact: true }).click();
  await square(app, "e2").click();
  await page.evaluate(() => {
    document.querySelector('[data-square="e4"]').click();
    document.querySelector('[aria-label="Taskbar"] [aria-label="Notepad"]').click();
  });
  await editor.pressSequentially("Chess 123");
  await editor.press("ArrowLeft");
  await editor.press("Enter");
  await expect(editor).toHaveValue("Chess 12\n3");
  await page.waitForTimeout(700);
  await expect(app.locator(".chess-moves li span:last-child")).toHaveText("—");
  await page.getByRole("button", { name: "Chess", exact: true }).click();
  await expect(app.locator(".chess-moves li span:last-child")).not.toHaveText("—");
});

test.describe("chess on touch", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });
  test("board, promotion and history remain usable at 390px", async ({ page }) => {
    const app = await openChess(page);
    await app.getByRole("combobox", { name: "Game mode" }).selectOption("local");
    await square(app, "e2").tap();
    await square(app, "e4").tap();
    await expect(square(app, "e4")).toHaveAttribute("aria-label", "e4, White pawn");
    const board = await app.getByRole("grid", { name: "Chessboard" }).boundingBox();
    expect(board.x).toBeGreaterThanOrEqual(0);
    expect(board.x + board.width).toBeLessThanOrEqual(390);
    await app.getByRole("button", { name: "New game", exact: true }).click();
    await play(app, promotionMoves);
    await app.getByRole("button", { name: "Promote to queen" }).tap();
    await expect(square(app, "a8")).toHaveAttribute("aria-label", "a8, White queen");
    await app.locator(".chess-history").scrollIntoViewIfNeeded();
    await expect(app.locator(".chess-moves li").last()).toContainText("bxa8=Q");
    await app.getByRole("button", { name: "New game", exact: true }).click();
    const content = await app.locator(".game-content").boundingBox();
    const topPlayer = await app.locator(".chess-player").first().boundingBox();
    expect(topPlayer.y).toBeGreaterThanOrEqual(content.y);
    await page.screenshot({ path: "playwright-report/ui-audit/chess-mobile.png" });
  });
});
