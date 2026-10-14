import { chromium } from "@playwright/test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import react from "@vitejs/plugin-react";
import { mkdir, readFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const renderer = await createServer({
  root,
  configFile: false,
  cacheDir: "node_modules/.vite-resume-pdf",
  plugins: [react()],
  server: { middlewareMode: true },
  appType: "custom",
});
let browser;
try {
  const { ResumeDocument } = await renderer.ssrLoadModule("/src/components/apps/resume/ResumeDocument.jsx");
  const { resumeLocales, resumePortrait } = await renderer.ssrLoadModule("/src/data/resumeLocales.js");
  const styles = await Promise.all(
    ["resume.css", "resume-print.css"].map((name) =>
      readFile(new URL("../src/components/apps/resume/" + name, import.meta.url), "utf8"),
    ),
  );
  const [portrait, font] = await Promise.all([
    readFile(new URL("../public" + resumePortrait, import.meta.url)),
    readFile(new URL("../public/assets/fonts/vazirmatn-variable.woff2", import.meta.url)),
  ]);
  const portraitSrc = "data:image/jpeg;base64," + portrait.toString("base64");
  const stylesheet = styles.join("\n").replaceAll(
    "/assets/fonts/vazirmatn-variable.woff2",
    "data:font/woff2;base64," + font.toString("base64"),
  );
  browser = await chromium.launch({
    channel: process.env.PLAYWRIGHT_CHANNEL ?? (process.platform === "win32" ? "msedge" : undefined),
  });
  const page = await browser.newPage();
  await page.emulateMedia({ media: "print" });
  for (const [language, locale] of Object.entries(resumeLocales)) {
    const output = fileURLToPath(new URL("../../backend/content/resume/" + locale.pdf.filename, import.meta.url));
    const markup = renderToStaticMarkup(createElement(ResumeDocument, { language, portraitSrc }));
    const title = renderToStaticMarkup(createElement("title", null, locale.name + " — " + locale.labels.toolbar));
    await page.setContent(
      '<!doctype html><html lang="' + language + '" dir="' + locale.direction + '"><head><meta charset="utf-8">' +
      title + "<style>*{box-sizing:border-box}" + stylesheet +
      "</style></head><body>" + markup + "</body></html>",
    );
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map((image) => image.decode()));
    });
    await mkdir(dirname(output), { recursive: true });
    const pdf = await page.pdf({
      path: output,
      format: "A4",
      preferCSSPageSize: true,
      printBackground: true,
      tagged: true,
    });
    console.log("Saved " + output + " (" + pdf.length.toLocaleString() + " bytes)");
  }
} finally {
  await browser?.close();
  await renderer.close();
}
