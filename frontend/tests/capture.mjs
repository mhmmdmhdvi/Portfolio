import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

await mkdir("test-results", { recursive: true });
const browser = await chromium.launch({
  channel: process.platform === "win32" ? "msedge" : undefined,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
await page.goto(process.env.CAPTURE_URL ?? "http://127.0.0.1:5173");
await page.screenshot({ path: "test-results/boot.png" });
await page
  .getByRole("status", { name: "Starting Windows" })
  .waitFor({ state: "hidden" });
await page.screenshot({ path: "test-results/desktop.png" });
await page.getByRole("button", { name: "Start", exact: true }).click();
await page.screenshot({
  path: "test-results/start.png",
  animations: "disabled",
});
await page.keyboard.press("Escape");
await page.getByRole("button", { name: "This PC", exact: true }).dblclick();
await page.getByText("Folders (6)").waitFor();
await page.screenshot({ path: "test-results/explorer.png" });
await page.getByRole("dialog", { name: "File Explorer" }).getByRole("button", { name: "More", exact: true }).click();
await page.getByRole("button", { name: "Properties", exact: true }).click();
await page.getByRole("dialog", { name: "Folder properties" }).waitFor();
await page.screenshot({ path: "test-results/properties.png" });
await page.getByRole("button", { name: "Close properties" }).click();
console.log(JSON.stringify({ errors }));
await browser.close();
