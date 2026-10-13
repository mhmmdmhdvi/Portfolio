import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const root = fileURLToPath(new URL("../", import.meta.url));
const serverDir = fileURLToPath(new URL("../../backend/", import.meta.url));
const executable = fileURLToPath(
  new URL(
    `../../backend/bin/server${process.platform === "win32" ? ".exe" : ""}`,
    import.meta.url,
  ),
);
await mkdir(new URL("../../backend/bin/", import.meta.url), {
  recursive: true,
});
await promisify(execFile)("go", ["build", "-o", executable, "./cmd/server"], {
  cwd: serverDir,
});
const backend = spawn(executable, [], {
  cwd: serverDir,
  stdio: "inherit",
  windowsHide: true,
  env: { ...process.env, DEV_ORIGIN: "http://127.0.0.1:5173" },
});
const vite = await createServer({ root });
let stopping = false;
async function shutdown(code = 0) {
  if (stopping) return;
  stopping = true;
  backend.kill();
  await vite.close();
  process.exit(code);
}
backend.on("error", (error) => {
  console.error(error.message);
  shutdown(1);
});
backend.on("exit", (code) => {
  if (!stopping) shutdown(code ?? 1);
});
process.on("SIGINT", () => shutdown());
process.on("SIGTERM", () => shutdown());
try {
  await vite.listen();
  vite.printUrls();
} catch (error) {
  console.error(error.message);
  await shutdown(1);
}
