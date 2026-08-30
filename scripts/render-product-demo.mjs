/**
 * Click-through PRODUCT demo — uses features (filters, run, gate, settings).
 * Requires: VITE_GROUNDS_DEMO=1 npm run dev -- --port 8080
 * Usage: node scripts/render-product-demo.mjs [baseUrl]
 */
import { chromium } from "playwright";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const demoDir = path.join(root, "demo");
const framesDir = path.join(demoDir, "_product_frames");
const mp4Path = path.join(demoDir, "GROUNDS_DEMO.mp4");
const concatPath = path.join(framesDir, "concat.txt");
const baseUrl = (process.argv[2] || process.env.GROUNDS_DEMO_URL || "http://127.0.0.1:8080").replace(
  /\/$/,
  "",
);

function findBin(name) {
  const which = spawnSync("where.exe", [name], { encoding: "utf8" });
  if (which.status === 0) {
    const line = which.stdout
      .split(/\r?\n/)
      .map((s) => s.trim())
      .find(Boolean);
    if (line) return line;
  }
  const winget = path.join(
    process.env.LOCALAPPDATA || "",
    "Microsoft",
    "WinGet",
    "Packages",
    "Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe",
    "ffmpeg-9.0-full_build",
    "bin",
    `${name}.exe`,
  );
  if (fs.existsSync(winget)) return winget;
  return name;
}

fs.rmSync(framesDir, { recursive: true, force: true });
fs.mkdirSync(framesDir, { recursive: true });

const ffmpeg = findBin("ffmpeg");
const ffprobe = findBin("ffprobe");
const FPS = 2;
let frameIdx = 0;
const concatLines = [];

let browser;
try {
  browser = await chromium.launch({ channel: "chrome", headless: true });
} catch {
  browser = await chromium.launch({ headless: true });
}

const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
});

async function shotHold(ms) {
  const steps = Math.max(1, Math.round((ms / 1000) * FPS));
  for (let i = 0; i < steps; i++) {
    const frame = path.join(framesDir, `f-${String(frameIdx).padStart(4, "0")}.png`);
    await page.screenshot({ path: frame, type: "png" });
    const rel = frame.replace(/\\/g, "/");
    concatLines.push(`file '${rel}'`);
    concatLines.push(`duration ${(1 / FPS).toFixed(3)}`);
    frameIdx++;
    await page.waitForTimeout(1000 / FPS);
  }
}

async function go(p) {
  console.log(`→ ${p}`);
  await page.goto(baseUrl + p, { waitUntil: "networkidle", timeout: 90000 }).catch(async () => {
    await page.goto(baseUrl + p, { waitUntil: "domcontentloaded", timeout: 90000 });
  });
  await page.waitForTimeout(600);
}

async function clickText(text, opts = {}) {
  const loc = page.getByRole(opts.role || "link", { name: text, exact: opts.exact ?? false }).first();
  await loc.click({ timeout: 15000 });
  await page.waitForTimeout(400);
}

async function clickButton(name) {
  await page.getByRole("button", { name }).first().click({ timeout: 15000 });
  await page.waitForTimeout(500);
}

// --- Probe ---
{
  const res = await page.goto(baseUrl + "/", { waitUntil: "domcontentloaded", timeout: 60000 });
  if (!res || !res.ok()) {
    console.error(`Server not ready at ${baseUrl}`);
    process.exit(1);
  }
}

// 1) Marketing → open product
await go("/");
await shotHold(4000);
await page.evaluate(() => window.scrollBy(0, 500));
await shotHold(3000);
await clickText("See how it works", { role: "link" });
await shotHold(5000);
await page.evaluate(() => window.scrollBy(0, 700));
await shotHold(4000);

// 2) Enter dashboard via CTA
await go("/dashboard");
await shotHold(5000);

// 3) Sidebar: Claim packs → search + filter + open C-001
await clickText("Claim packs", { role: "link" });
await shotHold(3000);
await page.getByPlaceholder("Search repo, claim or case id").fill("widget");
await shotHold(2500);
await clickButton("Mismatch");
await shotHold(2000);
await clickButton("All");
await shotHold(1500);
await page.getByRole("link", { name: /README green CI|widget-cli|C-001/i }).first().click();
await shotHold(5000);
await page.evaluate(() => window.scrollBy(0, 500));
await shotHold(4000);
await clickButton("Export");
await shotHold(2500);

// 4) Trajectories via nav
await clickText("Trajectories", { role: "link" });
await shotHold(5000);
await page.evaluate(() => window.scrollBy(0, 400));
await shotHold(3000);

// 5) Runs — toggle mode, change selects, Start run
await clickText("Runs", { role: "link" });
await shotHold(3000);
await clickButton("One-shot baseline");
await shotHold(2000);
await clickButton("GROUNDS agent");
await shotHold(2000);
await page.locator("select").nth(0).selectOption({ index: 0 });
await page.locator("select").nth(1).selectOption({ index: 0 });
await shotHold(2000);
await clickButton("Start run");
await shotHold(3500);

// Also sidebar New run (already on runs)
await page.getByRole("link", { name: "New run" }).click().catch(() => {});
await shotHold(2000);

// 6) Human gate — Approve then Deny
await clickText("Human gate", { role: "link" });
await shotHold(4000);
const approve = page.getByRole("button", { name: "Approve" }).first();
if (await approve.count()) {
  await approve.click();
  await shotHold(3000);
}
const deny = page.getByRole("button", { name: "Deny" }).first();
if (await deny.count()) {
  await deny.click();
  await shotHold(3000);
}
await shotHold(2000);

// 7) Evaluation
await clickText("Evaluation", { role: "link" });
await shotHold(5000);
await page.evaluate(() => window.scrollBy(0, 450));
await shotHold(4000);

// 8) Settings — toggle policy + invite later (honest solo, not multi-tenant)
await clickText("Settings", { role: "link" });
await shotHold(4000);
await page.getByRole("switch").nth(3).click(); // redact secrets
await shotHold(2500);
await page.getByRole("switch").nth(3).click(); // toggle back
await shotHold(2000);
await clickButton("Invite later");
await shotHold(2500);
await clickButton("Key hygiene tip");
await shotHold(2500);

// 9) Overview wrap
await clickText("Overview", { role: "link" });
await shotHold(4000);

// 10) Docs / changelog briefly
await go("/docs");
await shotHold(4000);
await go("/changelog");
await shotHold(4000);
await go("/");
await shotHold(3000);

if (frameIdx === 0) {
  console.error("No frames");
  process.exit(1);
}
const last = path
  .join(framesDir, `f-${String(frameIdx - 1).padStart(4, "0")}.png`)
  .replace(/\\/g, "/");
concatLines.push(`file '${last}'`);
fs.writeFileSync(concatPath, concatLines.join("\n"), "utf8");
await browser.close();

console.log(`Frames: ${frameIdx} (~${(frameIdx / FPS).toFixed(1)}s). Encoding…`);
const r = spawnSync(
  ffmpeg,
  [
    "-y",
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    concatPath,
    "-vf",
    "fps=30,format=yuv420p",
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    "-an",
    mp4Path,
  ],
  { encoding: "utf8" },
);
if (r.status !== 0) {
  console.error(r.stderr || r.stdout);
  process.exit(r.status || 1);
}

const st = fs.statSync(mp4Path);
const probe = spawnSync(
  ffprobe,
  ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", mp4Path],
  { encoding: "utf8" },
);
const duration = Number(probe.stdout.trim() || 0);
console.log(`Wrote ${mp4Path} (${(st.size / 1e6).toFixed(2)} MB, ${duration.toFixed(1)}s)`);
if (duration > 300) process.exit(2);
