/**
 * Pack contest source zip ≤50MB for HackerEarth.
 * Usage: node scripts/pack-submission.mjs
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "submission");
const zipPath = path.join(outDir, "grounds-micro1-source.zip");
const staging = path.join(outDir, "_staging");

fs.rmSync(staging, { recursive: true, force: true });
fs.mkdirSync(staging, { recursive: true });

const include = [
  "agent",
  "baseline",
  "cases",
  "eval",
  "grounds_lib",
  "tests",
  "scripts",
  "memory",
  "demo/index.html",
  // Videos hosted via Video URL field (≤50MB zip limit) — see HACKEREARTH_FIELDS.md
  "REPRO.md",
  "IMPROVEMENT_CHANGELOG.md",
  "VIDEO_SCRIPT.md",
  "pyproject.toml",
  "package.json",
  "package-lock.json",
  "README.md",
  "AGENTS.md",
  ".env.example",
  ".gitignore",
  "submission/HACKEREARTH_FIELDS.md",
  // measured artefacts (no secrets)
  "out/metrics.json",
  "out/EVAL_TABLE.md",
  "out/eval_table.json",
  "out/baseline",
  "out/agent",
  "src",
  "vite.config.ts",
  "tsconfig.json",
];

const skipName = new Set(["node_modules", ".git", ".env", "_frames", "_product_frames", "_record", "_staging", ".venv", "__pycache__", ".pytest_cache"]);

function copyRecursive(src, dest) {
  const st = fs.statSync(src);
  if (st.isDirectory()) {
    const base = path.basename(src);
    if (skipName.has(base)) return;
    fs.mkdirSync(dest, { recursive: true });
    for (const name of fs.readdirSync(src)) {
      if (skipName.has(name)) continue;
      if (name === ".env" || name.startsWith(".env.")) continue;
      copyRecursive(path.join(src, name), path.join(dest, name));
    }
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

for (const rel of include) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) {
    console.warn("skip missing", rel);
    continue;
  }
  copyRecursive(abs, path.join(staging, rel));
}

// Ensure no .env slipped in
function scrub(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) scrub(p);
    else if (name === ".env" || name.startsWith(".env.")) fs.rmSync(p);
  }
}
scrub(staging);

fs.rmSync(zipPath, { force: true });

const ps = `
Compress-Archive -Path '${staging.replace(/'/g, "''")}\\*' -DestinationPath '${zipPath.replace(/'/g, "''")}' -Force
`;
const r = spawnSync("powershell.exe", ["-NoProfile", "-Command", ps], { encoding: "utf8" });
if (r.status !== 0) {
  console.error(r.stderr || r.stdout);
  process.exit(r.status || 1);
}

const mb = fs.statSync(zipPath).size / (1024 * 1024);
console.log(`Wrote ${zipPath} (${mb.toFixed(2)} MB)`);
if (mb > 50) {
  console.error("OVER 50MB — trim before upload");
  process.exit(2);
}
