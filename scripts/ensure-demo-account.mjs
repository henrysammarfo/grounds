/**
 * Ensure a Supabase demo account exists for product film (signup then signin).
 * Does not print secrets. Writes GROUNDS_DEMO_* into .env if missing.
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const envPath = path.join(root, ".env");

function readEnv(file) {
  const out = {};
  if (!fs.existsSync(file)) return out;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq < 1) continue;
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[t.slice(0, eq).trim()] = v;
  }
  return out;
}

const env = readEnv(envPath);
const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_PUBLISHABLE_KEY;
const email = env.GROUNDS_DEMO_EMAIL || "demo.judge@grounds.app";
const password = env.GROUNDS_DEMO_PASSWORD || "GroundsDemo!2026";
const name = "Judge Demo";

if (!url || !key) {
  console.error(JSON.stringify({ ok: false, err: "missing_supabase_url_or_key" }));
  process.exit(1);
}

const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  "Content-Type": "application/json",
};

const signup = await fetch(`${url}/auth/v1/signup`, {
  method: "POST",
  headers,
  body: JSON.stringify({ email, password, data: { display_name: name } }),
});
const signupBody = await signup.json().catch(() => ({}));

const signin = await fetch(`${url}/auth/v1/token?grant_type=password`, {
  method: "POST",
  headers,
  body: JSON.stringify({ email, password }),
});
const signinBody = await signin.json().catch(() => ({}));

const ok = Boolean(signinBody.access_token);
console.log(
  JSON.stringify({
    ok,
    signupStatus: signup.status,
    signinStatus: signin.status,
    hasSession: ok,
    signupMsg: signupBody.msg || signupBody.error_description || signupBody.error || null,
    signinMsg: signinBody.msg || signinBody.error_description || signinBody.error || null,
    email,
  }),
);

if (ok) {
  let raw = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
  if (!/^GROUNDS_DEMO_EMAIL=/m.test(raw)) {
    raw += `\nGROUNDS_DEMO_EMAIL=${email}\nGROUNDS_DEMO_PASSWORD=${password}\n`;
    fs.writeFileSync(envPath, raw);
  }
}

process.exit(ok ? 0 : 1);
