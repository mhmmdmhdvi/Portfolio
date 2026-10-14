import { expect, test } from "@playwright/test";

async function openDesktop(page) {
  await page.goto("/");
  await page.getByRole("status", { name: "Starting Windows" }).waitFor({ state: "hidden" });
}

test("the portfolio introduction fits monitors, iPads and phones without covering desktop icons", async ({ page }) => {
  await openDesktop(page);
  const welcome = page.getByRole("region", { name: "Portfolio introduction" });
  await expect(welcome.getByRole("heading", { name: "Mohammad Mahdavi" })).toBeVisible();
  await expect(welcome.getByText("Have fun exploring.", { exact: true })).toBeVisible();
  await expect(welcome.getByText("A Windows-inspired website.", { exact: true })).toHaveCount(0);
  await expect(welcome.getByText("Open a folder to explore.", { exact: true })).toHaveCount(0);
  const sizes = [
    [1920, 1080], [3840, 2160], [5120, 1440], [1366, 768], [1024, 768],
    [820, 1180], [1180, 820], [768, 1024], [2732, 2048], [2048, 1536], [1536, 2048], [1080, 1920],
    [390, 844], [320, 568], [844, 390], [568, 320], [960, 540],
  ];
  for (const [width, height] of sizes) {
    await page.setViewportSize({ width, height });
    const layout = await welcome.evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      const icons = document.querySelector(".desktop-icons").getBoundingClientRect();
      return {
        left: bounds.left, top: bounds.top, right: bounds.right, bottom: bounds.bottom,
        iconsRight: icons.right, overflow: element.scrollWidth > element.clientWidth,
        iconsBottom: Math.max(...[...document.querySelectorAll(".desktop-icon")].map((icon) => icon.getBoundingClientRect().bottom)),
      };
    });
    expect(layout.left, `${width}x${height}: icon space`).toBeGreaterThanOrEqual(layout.iconsRight + 8);
    expect(layout.top, `${width}x${height}: top`).toBeGreaterThanOrEqual(0);
    expect(layout.right, `${width}x${height}: right`).toBeLessThanOrEqual(width);
    expect(layout.bottom, `${width}x${height}: taskbar space`).toBeLessThanOrEqual(height - 48);
    expect(layout.overflow, `${width}x${height}: text width`).toBe(false);
    expect(layout.iconsBottom, `${width}x${height}: desktop shortcuts`).toBeLessThanOrEqual(height - 48);
    if (width < height) {
      expect(layout.top, `${width}x${height}: introduction at the top`).toBeLessThanOrEqual(height * 0.12);
      expect(layout.bottom, `${width}x${height}: space for artwork below`).toBeLessThanOrEqual(height * 0.46);
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("main", { name: "Desktop" }).getByRole("button", { name: "Resume", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Resume", exact: true })).toBeVisible();
});

test("existing wallpaper settings adopt the primary artwork once and later choices stay saved", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.setItem("win11-preferences", JSON.stringify({
    wallpaper: "bloom-dark", theme: "dark", volume: 35,
  })));
  await openDesktop(page);
  await expect(page.getByRole("region", { name: "Portfolio introduction" })).toBeVisible();
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  const settings = page.getByRole("dialog", { name: "Settings", exact: true });
  await expect(settings.getByRole("slider", { name: "System volume", exact: true })).toHaveValue("35");
  await settings.getByRole("button", { name: "Personalization", exact: true }).click();
  await expect(settings.getByRole("combobox", { name: "Color mode", exact: true })).toHaveValue("dark");
  await settings.getByRole("combobox", { name: "Background", exact: true }).selectOption("bloom-light");
  await page.reload();
  await page.getByRole("status", { name: "Starting Windows" }).waitFor({ state: "hidden" });
  await expect(page.getByRole("region", { name: "Portfolio introduction" })).toHaveCount(0);
});

test("large desktop icons fit when another portfolio folder is added", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await openDesktop(page);
  await page.getByRole("main", { name: "Desktop" }).click({ button: "right", position: { x: 290, y: 20 } });
  await page.getByRole("menuitem", { name: "View", exact: true }).click();
  await page.getByRole("menuitemradio", { name: "Large icons", exact: true }).click();
  for (const [width, height] of [[320, 568], [800, 480], [568, 361], [568, 320]]) {
    await page.setViewportSize({ width, height });
    const bottom = await page.locator(".desktop-icons").evaluate((element) =>
      Math.max(...[...element.querySelectorAll("button")].map((icon) => icon.getBoundingClientRect().bottom)),
    );
    expect(bottom, `${width}x${height}: large desktop shortcuts`).toBeLessThanOrEqual(height - 48);
  }
});

test("changing the wallpaper hides the introduction and the portfolio choice persists", async ({ page }) => {
  await openDesktop(page);
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  const settings = page.getByRole("dialog", { name: "Settings", exact: true });
  await settings.getByRole("button", { name: "Personalization", exact: true }).click();
  await settings.getByRole("combobox", { name: "Background", exact: true }).selectOption("bloom-dark");
  await expect(page.getByRole("region", { name: "Portfolio introduction" })).toHaveCount(0);
  await settings.getByRole("combobox", { name: "Background", exact: true }).selectOption("portfolio-blue");
  await settings.getByRole("button", { name: "Dark theme", exact: true }).click();
  await expect(settings.getByRole("combobox", { name: "Background", exact: true })).toHaveValue("portfolio-blue");
  await expect(page.getByRole("region", { name: "Portfolio introduction" })).toBeVisible();
  await settings.getByRole("button", { name: "Light theme", exact: true }).click();
  await expect(settings.getByRole("combobox", { name: "Background", exact: true })).toHaveValue("portfolio-blue");
  await settings.getByRole("button", { name: "Close", exact: true }).click();
  await expect(page.getByRole("region", { name: "Portfolio introduction" })).toBeVisible();
  await page.reload();
  await page.getByRole("status", { name: "Starting Windows" }).waitFor({ state: "hidden" });
  await expect(page.getByRole("region", { name: "Portfolio introduction" })).toBeVisible();
});
