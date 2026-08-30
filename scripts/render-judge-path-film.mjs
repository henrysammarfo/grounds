/**
 * Judge-path film: signup → sign-in → dashboard walkthrough (no demo bypass).
 * Usage: node scripts/render-judge-path-film.mjs [baseUrl]
 * Requires: GROUNDS_DEMO_EMAIL, GROUNDS_DEMO_PASSWORD in env.
 */
import { chromium } from "playwright";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "demo");
const framesDir = path.join(outDir, "_judge_frames");
const mp4Path = "/opt/cursor/artifacts/grounds_judge_path_signup_signin_film.mp4";
const concatPath = path.join(framesDir, "concat.txt");
const baseUrl = (
  process.argv[2] ||
  process.env.GROUNDS_JUDGE_FILM_URL ||
  "https://temporary-rapid-hawthorn-7kywpoj.vercel.app"
).replace(/\/$/, "");

const email = process.env.GROUNDS_DEMO_EMAIL;
const password = process.env.GROUNDS_DEMO_PASSWORD;
if (!email || !password) {
  console.error("Missing GROUNDS_DEMO_EMAIL / GROUNDS_DEMO_PASSWORD");
  process.exit(1);
}

const ffmpeg = "ffmpeg";
const ffprobe = "ffprobe";
const FPS = 2;
let frameIdx = 0;
const concatLines = [];

fs.rmSync(framesDir, { recursive: true, force: true });
fs.mkdirSync(framesDir, { recursive: true });
fs.mkdirSync(path.dirname(mp4Path), { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

async function shotHold(ms) {
  const steps = Math.max(1, Math.round((ms / 1000) * FPS));
  for (let i = 0; i < steps; i++) {
    const frame = path.join(framesDir, `f-${String(frameIdx).padStart(4, "0")}.png`);
    await page.screenshot({ path: frame, type: "png" });
    concatLines.push(`file '${frame.replace(/\\/g, "/")}'`);
    concatLines.push(`duration ${(1 / FPS).toFixed(3)}`);
    frameIdx++;
    await page.waitForTimeout(1000 / FPS);
  }
}

async function go(p) {
  await page.goto(baseUrl + p, { waitUntil: "networkidle", timeout: 90000 }).catch(async () => {
    await page.goto(baseUrl + p, { waitUntil: "domcontentloaded", timeout: 90000 });
  });
  await page.waitForTimeout(500);
}

async function clickLink(name) {
  await page.getByRole("link", { name }).first().click({ timeout: 15000 });
  await page.waitForTimeout(400);
}

async function clickButton(name) {
  await page.getByRole("button", { name }).first().click({ timeout: 15000 });
  await page.waitForTimeout(500);
}

// Act 0 — cold start (logged out)
await go("/");
await shotHold(2500);
await clickLink("Open dashboard");
await shotHold(2000);

// Act 1 — marketing
await go("/");
await shotHold(2500);
await page.evaluate(() => window.scrollBy(0, 600));
await shotHold(2000);
await clickLink("See how it works");
await shotHold(3000);
await page.evaluate(() => window.scrollBy(0, 700));
await shotHold(2000);
await page.getByRole("link", { name: /get started|open dashboard/i }).first().click();
await shotHold(2000);

// Act 2 — signup then sign in
await page.getByRole("button", { name: /sign up/i }).first().click();
await shotHold(1000);
await page.locator("#name").fill("Judge Demo");
await page.locator("#email").fill(email);
await page.locator("#password").fill(password);
await shotHold(1500);
await page.locator("form").getByRole("button", { name: /create account/i }).click();
await shotHold(2500);
await page.getByRole("button", { name: /sign in/i }).first().click();
await shotHold(800);
await page.locator("#email").fill(email);
await page.locator("#password").fill(password);
await page.locator("form").getByRole("button", { name: /^sign in$/i }).click();
await page.waitForURL("**/dashboard**", { timeout: 30000 });
await shotHold(3000);

// Act 3 — overview KPIs
await shotHold(3000);

// Act 4 — claim packs
await clickLink("Claim packs");
await shotHold(2000);
await page.getByPlaceholder(/search/i).fill("widget");
await shotHold(1500);
await clickButton("Mismatch");
await shotHold(1200);
await clickButton("All");
await shotHold(1200);
await page.getByRole("link", { name: /widget-cli|C-001/i }).first().click();
await shotHold(3500);
await page.evaluate(() => window.scrollBy(0, 500));
await shotHold(2500);
await clickButton("Export");
await shotHold(2000);

// Act 5 — trajectories + runs
await clickLink("Trajectories");
await shotHold(4000);
await page.evaluate(() => window.scrollBy(0, 400));
await shotHold(2500);
await clickLink("Runs");
await shotHold(2500);
await clickButton("One-shot baseline");
await shotHold(1500);
await clickButton("GROUNDS agent");
await shotHold(1500);
await clickButton("Start run");
await shotHold(2500);

// Act 6 — human gate + evaluation
await clickLink("Human gate");
await shotHold(3000);
const approve = page.getByRole("button", { name: "Approve" }).first();
if (await approve.count()) {
  await approve.click();
  await shotHold(2500);
}
const deny = page.getByRole("button", { name: "Deny" }).first();
if (await deny.count()) {
  await deny.click();
  await shotHold(2500);
}
await clickLink("Evaluation");
await shotHold(4500);
await page.evaluate(() => window.scrollBy(0, 400));
await shotHold(3500);

// Act 7 — settings + account + sign out
await clickLink("Settings");
await shotHold(3000);
await page.getByRole("switch").first().click().catch(() => {});
await shotHold(1500);
await clickLink("Account");
await shotHold(2500);
const signOut = page.getByRole("button", { name: /sign out/i }).or(page.getByRole("link", { name: /sign out/i }));
if (await signOut.count()) {
  await signOut.first().click();
} else {
  await page.locator("text=Sign out").first().click();
}
await shotHold(2500);

// Close — home
await go("/");
await shotHold(3500);

if (frameIdx === 0) {
  console.error("No frames captured");
  process.exit(1);
}

const last = path.join(framesDir, `f-${String(frameIdx - 1).padStart(4, "0")}.png`).replace(/\\/g, "/");
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
    "fps=24,format=yuv420p,scale=1440:900",
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
