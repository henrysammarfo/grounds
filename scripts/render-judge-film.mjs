/**
 * Judge-path product film against LIVE site: signup/signin → full product → results.
 * Usage: node scripts/render-judge-film.mjs
 * Reads GROUNDS_DEMO_* from .env (never prints secrets).
 */
import { chromium } from "playwright";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const framesDir = path.join(root, "demo", "_judge_frames");
const rawMp4 = path.join(root, "demo", "_judge_raw.mp4");
const baseUrl = (process.env.GROUNDS_FILM_URL || "http://127.0.0.1:8080").replace(/\/$/, "");

function readEnv() {
  const out = {};
  const p = path.join(root, ".env");
  if (!fs.existsSync(p)) return out;
  for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq < 1) continue;
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    out[t.slice(0, eq).trim()] = v;
  }
  return out;
}

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

const env = readEnv();
const email = env.GROUNDS_DEMO_EMAIL;
const password = env.GROUNDS_DEMO_PASSWORD;
if (!email || !password) {
  console.error("Run node scripts/ensure-demo-account.mjs first");
  process.exit(1);
}

fs.rmSync(framesDir, { recursive: true, force: true });
fs.mkdirSync(framesDir, { recursive: true });

const ffmpeg = findBin("ffmpeg");
const FPS = 2;
let frameIdx = 0;
const concatLines = [];
/** @type {{ start: number, end: number, text: string }[]} */
const captions = [];
let t0 = Date.now();

function nowSec() {
  return (Date.now() - t0) / 1000;
}

function cap(text, holdSec = 3) {
  const start = Math.max(0, nowSec() - 0.2);
  captions.push({ start, end: start + holdSec, text });
}

async function shotHold(page, ms) {
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

let browser;
try {
  browser = await chromium.launch({ channel: "chrome", headless: true });
} catch {
  browser = await chromium.launch({ headless: true });
}

const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
});
const page = await context.newPage();

async function go(p) {
  console.log("→", p);
  await page.goto(baseUrl + p, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForTimeout(900);
}

t0 = Date.now();
cap("GROUNDS — verify claims against the real repo", 4);

// Act 0–1 marketing
await go("/");
await page.evaluate(() => {
  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch {}
});
await go("/");
await shotHold(page, 5000);
await page.evaluate(() => window.scrollBy(0, 550));
cap("Live metrics: baseline vs GROUNDS on identical gold packs", 4);
await shotHold(page, 4000);

await page.getByRole("link", { name: /See how it works/i }).first().click({ timeout: 15000 }).catch(async () => {
  await go("/product");
});
await page.waitForTimeout(800);
cap("How it works: tools → verify → human gate → report", 4);
await shotHold(page, 5000);
await page.evaluate(() => window.scrollBy(0, 700));
await shotHold(page, 4000);

// Act 2 auth — create account then sign in
cap("Create an account — what judges do first", 4);
await go("/auth");
await shotHold(page, 3000);

await page.getByRole("button", { name: "Sign up", exact: true }).click();
await page.waitForTimeout(500);
await page.locator("#name").fill("Judge Demo");
await page.locator("#email").fill(email);
await page.locator("#password").fill(password);
await shotHold(page, 3000);
cap("Submit create account (or continue if you already have one)", 4);
await page.locator('form button[type="submit"]').click();
await page.waitForTimeout(3000);
await shotHold(page, 3000);

// If still on auth, sign in
if (page.url().includes("/auth")) {
  cap("Sign in with your GROUNDS account", 3);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForTimeout(400);
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await shotHold(page, 2000);
  await page.locator('form button[type="submit"]').click();
  await page.waitForTimeout(3500);
}

await page.waitForURL(/\/dashboard/, { timeout: 30000 }).catch(() => {});
cap("Signed in — dashboard Overview with live eval KPIs", 4);
await shotHold(page, 6000);

// Claim packs
cap("Claim packs: search, filter, open C-001", 4);
await page.getByRole("link", { name: "Claim packs" }).click();
await page.waitForTimeout(600);
await shotHold(page, 2500);
await page.getByPlaceholder(/Search/i).fill("widget");
await shotHold(page, 2000);
await page.getByRole("button", { name: "Mismatch" }).click().catch(() => {});
await shotHold(page, 1500);
await page.getByRole("button", { name: "All" }).click().catch(() => {});
await shotHold(page, 1500);
await page.getByRole("link", { name: /widget-cli|README green|C-001/i }).first().click();
await page.waitForTimeout(700);
cap("Results: baseline believed the README — GROUNDS grounded the claims", 5);
await shotHold(page, 6000);
await page.evaluate(() => window.scrollBy(0, 500));
await shotHold(page, 4000);
await page.getByRole("button", { name: /Export/i }).click().catch(() => {});
await shotHold(page, 2000);

// Trajectories
cap("Trajectories: tool I/O judges can replay", 4);
await page.getByRole("link", { name: "Trajectories" }).click();
await page.waitForTimeout(700);
await shotHold(page, 5000);
await page.evaluate(() => window.scrollBy(0, 400));
await shotHold(page, 3000);

// Runs
cap("Runs: start baseline or GROUNDS agent on the same pack", 4);
await page.getByRole("link", { name: "Runs" }).click();
await page.waitForTimeout(600);
await page.getByRole("button", { name: /One-shot baseline/i }).click().catch(() => {});
await shotHold(page, 2000);
await page.getByRole("button", { name: /GROUNDS agent/i }).click().catch(() => {});
await shotHold(page, 2000);
await page.getByRole("button", { name: /Start run/i }).click().catch(() => {});
await shotHold(page, 3500);

// Gate
cap("Human gate: approve or deny risky actions", 4);
await page.getByRole("link", { name: "Human gate" }).click();
await page.waitForTimeout(700);
await shotHold(page, 3500);
if (await page.getByRole("button", { name: "Approve" }).count()) {
  await page.getByRole("button", { name: "Approve" }).first().click();
  await shotHold(page, 2500);
}
if (await page.getByRole("button", { name: "Deny" }).count()) {
  await page.getByRole("button", { name: "Deny" }).first().click();
  await shotHold(page, 2500);
}

// Evaluation — hold on results
cap("Measured lift: ~0.18 → ~0.91 claim accuracy on 10 gold packs", 6);
await page.getByRole("link", { name: "Evaluation" }).click();
await page.waitForTimeout(700);
await shotHold(page, 7000);
await page.evaluate(() => window.scrollBy(0, 450));
await shotHold(page, 5000);

// Settings
cap("Settings: solo workspace — multi-tenant not required for contest", 4);
await page.getByRole("link", { name: "Settings", exact: true }).click();
await page.waitForTimeout(600);
await shotHold(page, 4000);
const sw = page.getByRole("switch");
if (await sw.count()) {
  await sw.nth(Math.min(3, (await sw.count()) - 1)).click();
  await shotHold(page, 2500);
}

// Sign out
cap("Sign out — full loop complete", 3);
await page.getByRole("button", { name: /Sign out/i }).click();
await page.waitForTimeout(1500);
await shotHold(page, 3000);

await go("/");
cap("GROUNDS — documentation honesty as an agent workflow", 5);
await shotHold(page, 4000);

await browser.close();

const last = path.join(framesDir, `f-${String(frameIdx - 1).padStart(4, "0")}.png`).replace(/\\/g, "/");
concatLines.push(`file '${last}'`);
const concatPath = path.join(framesDir, "concat.txt");
fs.writeFileSync(concatPath, concatLines.join("\n"));
fs.writeFileSync(path.join(root, "demo", "judge-captions.json"), JSON.stringify(captions, null, 2));

console.log(`Frames ${frameIdx}. Encoding raw…`);
const r = spawnSync(
  ffmpeg,
  ["-y", "-f", "concat", "-safe", "0", "-i", concatPath, "-vf", "fps=30,format=yuv420p", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-an", rawMp4],
  { encoding: "utf8" },
);
if (r.status !== 0) {
  console.error(r.stderr || r.stdout);
  process.exit(1);
}
console.log("Raw film:", rawMp4);
console.log("Next: node scripts/mux-judge-film.mjs");
