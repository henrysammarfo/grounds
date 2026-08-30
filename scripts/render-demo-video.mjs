/**
 * Render demo/index.html → demo/GROUNDS_DEMO.mp4
 * Screenshots via Playwright (system Chrome) + system ffmpeg concat.
 * Usage: node scripts/render-demo-video.mjs
 */
import { chromium } from "playwright";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const demoDir = path.join(root, "demo");
const framesDir = path.join(demoDir, "_frames");
const htmlPath = path.join(demoDir, "index.html");
const mp4Path = path.join(demoDir, "GROUNDS_DEMO.mp4");
const concatPath = path.join(framesDir, "concat.txt");

function findBin(name) {
  const which = spawnSync("where.exe", [name], { encoding: "utf8" });
  if (which.status === 0) {
    const line = which.stdout.split(/\r?\n/).map((s) => s.trim()).find(Boolean);
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

let browser;
try {
  browser = await chromium.launch({ channel: "chrome", headless: true });
} catch {
  browser = await chromium.launch({ headless: true });
}
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "domcontentloaded", timeout: 120000 });
await page.waitForTimeout(2000);

const meta = await page.evaluate(() => window.__GROUNDS_DEMO__);
console.log(`Slides: ${meta.slides.length} · planned ${Math.round(meta.totalMs / 1000)}s`);

const concatLines = [];
for (let i = 0; i < meta.slides.length; i++) {
  await page.evaluate((idx) => window.showSlide(idx), i);
  await page.waitForTimeout(400);
  const frame = path.join(framesDir, `slide-${String(i).padStart(2, "0")}.png`);
  await page.screenshot({ path: frame, type: "png" });
  const dur = meta.slides[i].ms / 1000;
  // ffmpeg concat demuxer needs forward slashes
  const rel = frame.replace(/\\/g, "/");
  concatLines.push(`file '${rel}'`);
  concatLines.push(`duration ${dur.toFixed(3)}`);
  console.log(`Slide ${i + 1}: ${dur}s`);
}
// last frame must be listed again without duration for concat demuxer
const last = path.join(framesDir, `slide-${String(meta.slides.length - 1).padStart(2, "0")}.png`).replace(/\\/g, "/");
concatLines.push(`file '${last}'`);
fs.writeFileSync(concatPath, concatLines.join("\n"), "utf8");

await browser.close();

console.log(`Encoding ${mp4Path}`);
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
const probe = spawnSync(ffprobe, ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", mp4Path], {
  encoding: "utf8",
});
const duration = Number(probe.stdout.trim() || 0);
console.log(`Wrote ${mp4Path} (${(st.size / 1e6).toFixed(2)} MB, ${duration.toFixed(1)}s)`);
if (duration > 300) {
  console.warn("WARNING: over 5:00 hard cap");
  process.exit(2);
}
