import sharp from "sharp";
import { mkdir, readdir, stat, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const source = process.argv[2];
if (!source) throw new Error('Usage: node scripts/project-images.mjs "path/to/project library"');
const publicRoot = fileURLToPath(new URL("../public/assets/projects/", import.meta.url));
const output = fileURLToPath(new URL("../src/data/projectImages.json", import.meta.url));
const groups = [
  { id: "secora", folder: "secora", photos: [
    ["14_27_37", "Home"], ["14_27_50", "Mobile view"], ["14_28_22", "Lessons"],
    ["14_30_49", "SQL injection exercise"], ["14_30_59", "Lesson guide"],
    ["14_31_14", "Quiz"], ["14_28_50", "Learning paths"],
    ["14_29_15", "Profile · Persian"], ["14_29_51", "Profile · English"],
  ] },
  { id: "honor-preinvoice", folder: "honor app", photos: [
    ["152317", "Customer details"], ["152328", "Invoice details"], ["152333", "Products and totals"],
    ["152408", "Invoice preview"], ["152425", "Product management"],
  ] },
  { id: "megatite-crm", folder: "salespanel", photos: [
    ["3.png", "Sales panel"], ["2.png", "Overview"], ["1.png", "Sign in"],
    ["4.png", "Overview · mobile"], ["5.png", "Sales panel · mobile"],
  ] },
  { id: "megatite-chatbot", folder: "ai-chatbot", photos: [
    ["4.png", "Chat"], ["2.png", "Customer name"], ["3.png", "Customer phone"],
    ["1.png", "Operator sign in"], ["5.png", "Administration"],
  ] },
  { id: "gitshield", folder: "gitshield", photos: [["Untitled.png", "Repository scan"]] },
  { id: "chess-extension", folder: "chess-ai-extention", photos: [["14_35_25", "Move analysis"]] },
  { id: "date", folder: "date", photos: [
    ["14_41_58", "Invitation"], ["14_42_13", "Location"],
    ["14_42_21", "Date and time"], ["14_42_36", "Contact details"],
  ] },
];

const manifest = {};
let sourceBytes = 0;
let outputBytes = 0;
for (const group of groups) {
  const directory = resolve(source, group.folder);
  const names = await readdir(directory);
  const destination = resolve(publicRoot, group.id);
  await mkdir(destination, { recursive: true });
  const images = [];
  for (const [index, [match, caption]] of group.photos.entries()) {
    const matches = names.filter((name) => name.includes(match));
    if (matches.length !== 1) throw new Error(`Expected one image matching ${group.folder}/${match}`);
    const input = resolve(directory, matches[0]);
    sourceBytes += (await stat(input)).size;
    let pipeline = sharp(input).rotate();
    if (group.id === "gitshield") pipeline = pipeline.trim({ background: "#ffffff", threshold: 8 });
    const normalized = await pipeline.png().toBuffer();
    const { width, height } = await sharp(normalized).metadata();
    const prefix = String(index + 1).padStart(2, "0");
    const url = `/assets/projects/${group.id}/${prefix}`;
    const full = await sharp(normalized).resize({ width: 1920, withoutEnlargement: true })
      .webp({ quality: 88, effort: 5 }).toFile(resolve(destination, `${prefix}-full.webp`));
    const cropped = width >= 1000 && height > width * 1.6;
    let preview = sharp(normalized);
    if (cropped) preview = preview.extract({ left: 0, top: 0, width, height: Math.round(width * 1.35) });
    const page = await preview.resize({ width: 960, withoutEnlargement: true })
      .webp({ quality: 84, effort: 5 }).toFile(resolve(destination, `${prefix}-page.webp`));
    outputBytes += full.size + page.size;
    images.push({ caption, full: `${url}-full.webp`, preview: `${url}-page.webp`, width: full.width, height: full.height, previewWidth: page.width, previewHeight: page.height, cropped });
    if (index === 0) {
      const cover = await sharp(normalized).resize({ width: 520, height: 560, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 82, effort: 5 }).toFile(resolve(destination, "cover.webp"));
      outputBytes += cover.size;
    }
  }
  manifest[group.id] = { cover: `/assets/projects/${group.id}/cover.webp`, images };
  console.log(`${group.id}: ${images.length} screenshots`);
}
await writeFile(output, JSON.stringify(manifest, null, 2) + "\n");
console.log(`Source: ${(sourceBytes / 1048576).toFixed(1)} MiB; optimized images and previews: ${(outputBytes / 1048576).toFixed(1)} MiB`);
