/**
 * Burn captions + soft background beat onto judge film.
 * Usage: node scripts/mux-judge-film.mjs
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import https from "node:https";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rawMp4 = path.join(root, "demo", "_judge_raw.mp4");
const capsJson = path.join(root, "demo", "judge-captions.json");
const srtPath = path.join(root, "demo", "judge-captions.srt");
const musicPath = path.join(root, "demo", "_bed.mp3");
const outPublic = path.join(root, "public", "demo", "grounds_product_film_acts_1_6.mp4");
const outDemo = path.join(root, "demo", "grounds_product_film_acts_1_6.mp4");
const outLocal = path.join(root, "demo", "GROUNDS_DEMO.mp4");

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

function ts(sec) {
  const s = Math.max(0, sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = Math.floor(s % 60);
  const ms = Math.floor((s - Math.floor(s)) * 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
}

if (!fs.existsSync(rawMp4)) {
  console.error("Missing raw film — run node scripts/render-judge-film.mjs first");
  process.exit(1);
}

const captions = JSON.parse(fs.readFileSync(capsJson, "utf8"));
const srt = captions
  .map((c, i) => `${i + 1}\n${ts(c.start)} --> ${ts(c.end)}\n${c.text}\n`)
  .join("\n");
fs.writeFileSync(srtPath, srt);

const ffmpeg = findBin("ffmpeg");
const ffprobe = findBin("ffprobe");

// Soft procedural bed (no copyrighted track): warm low pad + light pulse
if (!fs.existsSync(musicPath)) {
  console.log("Synthesizing background bed…");
  const bed = spawnSync(
    ffmpeg,
    [
      "-y",
      "-f",
      "lavfi",
      "-i",
      "sine=frequency=110:sample_rate=44100:duration=240",
      "-f",
      "lavfi",
      "-i",
      "sine=frequency=164.81:sample_rate=44100:duration=240",
      "-f",
      "lavfi",
      "-i",
      "anoisesrc=color=pink:amplitude=0.015:sample_rate=44100:duration=240",
      "-filter_complex",
      "[0]volume=0.04[a];[1]volume=0.03[b];[2]lowpass=f=500,volume=0.05[c];[a][b][c]amix=inputs=3:duration=longest,afade=t=in:st=0:d=2,afade=t=out:st=230:d=8",
      "-c:a",
      "libmp3lame",
      "-q:a",
      "5",
      musicPath,
    ],
    { encoding: "utf8" },
  );
  if (bed.status !== 0) {
    console.error(bed.stderr || bed.stdout);
    process.exit(1);
  }
}

// Escape path for ffmpeg subtitles filter on Windows
const srtEsc = srtPath.replace(/\\/g, "/").replace(/:/g, "\\:");
const tmpOut = path.join(root, "demo", "_judge_muxed.mp4");

console.log("Muxing captions + audio…");
const mux = spawnSync(
  ffmpeg,
  [
    "-y",
    "-i",
    rawMp4,
    "-stream_loop",
    "-1",
    "-i",
    musicPath,
    "-vf",
    `subtitles='${srtEsc}':force_style='FontName=Arial,FontSize=22,PrimaryColour=&H00E8F0EA,OutlineColour=&H00101010,BorderStyle=3,Outline=1,Shadow=0,MarginV=36'`,
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-b:a",
    "160k",
    "-shortest",
    "-movflags",
    "+faststart",
    tmpOut,
  ],
  { encoding: "utf8" },
);
if (mux.status !== 0) {
  console.error(mux.stderr || mux.stdout);
  process.exit(1);
}

fs.mkdirSync(path.dirname(outPublic), { recursive: true });
fs.copyFileSync(tmpOut, outPublic);
fs.copyFileSync(tmpOut, outDemo);
fs.copyFileSync(tmpOut, outLocal);

const probe = spawnSync(
  ffprobe,
  ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", outPublic],
  { encoding: "utf8" },
);
const duration = Number(probe.stdout.trim() || 0);
const mb = fs.statSync(outPublic).size / 1e6;
console.log(`Wrote ${outPublic} (${mb.toFixed(2)} MB, ${duration.toFixed(1)}s)`);
if (duration > 300) {
  console.warn("WARNING: over 5:00 contest cap");
  process.exit(2);
}
