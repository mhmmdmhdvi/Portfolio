import { test, expect } from "@playwright/test";

async function openGame(page, title, random = 0) {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript((value) => { Math.random = () => value; }, random);
  await page.goto("/");
  await page.getByRole("status", { name: "Starting Windows" }).waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await page.getByRole("button", { name: title, exact: true }).click();
  const dialog = page.getByRole("dialog", { name: title, exact: true });
  await expect(dialog).toBeVisible();
  return { dialog, errors };
}

const cell = (game, row, column, suffix = "") =>
  game.getByRole("button", { name: `Cell ${row}, ${column}${suffix}`, exact: true });

for (const width of [1366, 390]) {
  test.describe(`${width}px card and mine games`, () => {
    test.use({ viewport: { width, height: width === 390 ? 844 : 900 }, hasTouch: width === 390 });
    const activate = (locator, options) => width === 390 ? locator.tap(options) : locator.click(options);

    test("a new mine round leaves flag mode and opens the first square", async ({ page }) => {
      const { dialog: game, errors } = await openGame(page, "Minesweeper");
      await activate(game.getByRole("button", { name: "Flag mode" }));
      await activate(cell(game, 1, 1));
      await expect(cell(game, 1, 1, ", flagged")).toBeVisible();
      await activate(game.getByRole("button", { name: "New game", exact: true }));
      await expect(game.getByRole("button", { name: "Flag mode" })).toHaveAttribute("aria-pressed", "false");
      await activate(cell(game, 5, 5));
      await expect(cell(game, 5, 5, ", revealed")).toBeVisible();
      expect(errors).toEqual([]);
    });

    test("accessible mine counts describe revealed numbers and a loss locks the field", async ({ page }) => {
      const { dialog: game, errors } = await openGame(page, "Minesweeper");
      await activate(cell(game, 5, 5));
      await expect(cell(game, 2, 3, ", revealed")).toHaveAttribute("aria-description", "4 adjacent mines");
      await activate(cell(game, 1, 2));
      await expect(game.getByText("Game over", { exact: true })).toBeVisible();
      await expect(cell(game, 1, 2, ", revealed")).toBeDisabled();
      await activate(game.getByRole("button", { name: "New game", exact: true }));
      await expect(cell(game, 1, 2)).toBeEnabled();
      expect(errors).toEqual([]);
    });

    test("Minesweeper flags both ways, reveals safe cells, wins, and starts again", async ({ page }) => {
      const { dialog: game, errors } = await openGame(page, "Minesweeper");
      await activate(cell(game, 5, 5));
      await activate(game.getByRole("button", { name: "Flag mode" }));
      await activate(cell(game, 1, 1));
      await expect(cell(game, 1, 1, ", flagged")).toBeVisible();
      await activate(cell(game, 1, 1, ", flagged"));
      await expect(cell(game, 1, 1)).toBeVisible();
      await activate(game.getByRole("button", { name: "Flag mode" }));
      await activate(cell(game, 1, 1));
      await expect(game.getByText("You win!", { exact: true })).toBeVisible();
      await activate(game.getByRole("button", { name: "New game", exact: true }));
      await expect(game.getByRole("group", { name: "Minefield", exact: true }).getByRole("button")).toHaveCount(81);
      await expect(cell(game, 5, 5)).toBeEnabled();
      expect(await game.locator(".game-content").evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
      await game.screenshot({ path: `playwright-report/ui-audit/minesweeper-${width}.png` });
      expect(errors).toEqual([]);
    });

    test("Solitaire moves a run, flips, undoes, recycles, and sends aces home", async ({ page }) => {
      const { dialog: game, errors } = await openGame(page, "Solitaire", 0.15);
      await activate(game.getByRole("button", { name: /6 of Spades, tableau column 3/ }));
      await activate(game.getByRole("button", { name: /7 of Diamonds, tableau column 2/ }), { position: { x: 10, y: 10 } });
      await expect(game.locator(".sol-column").nth(1).locator(".sol-tableau-card")).toHaveCount(3);
      // A card inside a run is selected through its exposed rank strip.
      await activate(game.getByRole("button", { name: /7 of Diamonds, tableau column 2/ }), { position: { x: 10, y: 10 } });
      await activate(game.getByRole("button", { name: /8 of Spades, tableau column 1/ }));
      await expect(game.locator(".sol-column").nth(0).locator(".sol-tableau-card")).toHaveCount(3);
      await expect(game.locator(".sol-column").nth(1).locator(".sol-tableau-card").last().getByRole("button")).toBeEnabled();
      await activate(game.getByRole("button", { name: "Undo", exact: true }));
      await activate(game.getByRole("button", { name: "Undo", exact: true }));
      await expect(game.locator(".sol-column").nth(0).locator(".sol-tableau-card")).toHaveCount(1);
      for (let draw = 0; draw < 24; draw++) await activate(game.locator(".sol-stock"));
      await expect(game.getByRole("button", { name: "Stock empty. Recycle the waste", exact: true })).toBeEnabled();
      await activate(game.locator(".sol-stock"));
      await activate(game.locator(".sol-stock"));
      await expect(game.getByRole("button", { name: "Queen of Hearts, top of waste. Select card", exact: true })).toBeVisible();
      await activate(game.getByRole("button", { name: "Undo", exact: true }));
      await activate(game.getByRole("button", { name: "Undo", exact: true }));
      await expect(game.getByRole("button", { name: "Stock empty. Recycle the waste", exact: true })).toBeVisible();
      await page.evaluate(() => { Math.random = () => 0; });
      await activate(game.getByRole("button", { name: "New game", exact: true }));
      await expect(game.getByRole("button", { name: "Undo", exact: true })).toBeDisabled();
      await activate(game.getByRole("button", { name: /Ace of Spades, tableau column 1/ }));
      await activate(game.getByRole("button", { name: "To foundation", exact: true }));
      await expect(game.getByRole("button", { name: /spades foundation, 1 cards, Ace of Spades on top/ })).toBeVisible();
      await activate(game.getByRole("button", { name: /King of Hearts, tableau column 7/ }));
      await activate(game.getByRole("button", { name: /Empty tableau column 1\. Kings only/ }));
      await expect(game.getByRole("button", { name: /King of Hearts, tableau column 1/ })).toBeVisible();
      await activate(game.getByRole("button", { name: "Undo", exact: true }));
      await activate(game.getByRole("button", { name: "Undo", exact: true }));
      await game.getByRole("button", { name: /Ace of Diamonds, tableau column 3/ }).dblclick();
      await expect(game.getByRole("button", { name: /diamonds foundation, 1 cards, Ace of Diamonds on top/ })).toBeVisible();
      expect(await game.locator(".game-content").evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
      await game.screenshot({ path: `playwright-report/ui-audit/solitaire-${width}.png` });
      expect(errors).toEqual([]);
    });
  });
}
