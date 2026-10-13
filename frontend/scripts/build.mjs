import { build } from "vite";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import { brotliCompress, gzip, constants } from "node:zlib";

await build();
const brotli = promisify(brotliCompress);
const gzipCompress = promisify(gzip);
async function compress(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  await Promise.all(
    entries.map(async (entry) => {
      const filename = join(directory, entry.name);
      if (entry.isDirectory()) return compress(filename);
      if (!/\.(html|css|js|svg)$/.test(entry.name)) return;
      const content = await readFile(filename);
      const [br, gz] = await Promise.all([
        brotli(content, { params: { [constants.BROTLI_PARAM_QUALITY]: 9 } }),
        gzipCompress(content, { level: 9 }),
      ]);
      await Promise.all([
        writeFile(`${filename}.br`, br),
        writeFile(`${filename}.gz`, gz),
      ]);
    }),
  );
}
await compress("dist");
console.log("Brotli and gzip assets ready.");
