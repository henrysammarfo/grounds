/**
 * Live research: Tavily then TinyFish. Never prints secret values.
 * Usage: node scripts/research-live.mjs [topic]
 */
import fs from "node:fs";
import https from "node:https";
import path from "node:path";

function loadEnv() {
  const out = {};
  try {
    const raw = fs.readFileSync(".env", "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (!m) continue;
      out[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    /* no .env */
  }
  return out;
}

function post(url, headers, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const data = JSON.stringify(body);
    const req = https.request(
      {
        hostname: u.hostname,
        path: u.pathname + u.search,
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data),
        },
      },
      (res) => {
        let b = "";
        res.on("data", (d) => (b += d));
        res.on("end", () => resolve({ status: res.statusCode, body: b }));
      },
    );
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

const env = loadEnv();
const topic = process.argv[2] || "LangGraph StateGraph tools human-in-the-loop Python";
const tavKey =
  process.env.TAVILY_API_KEY ||
  env.TAVILY_API_KEY ||
  "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";
const tfKey =
  process.env.TINYFISH_API_KEY ||
  env.TINYFISH_API_KEY ||
  "sk-tinyfish-IeDc_KYkPse8XL9xeeadowsBKbNs96v4";

fs.mkdirSync("memory", { recursive: true });

const probe = {
  has_openai: Boolean(env.OPENAI_API_KEY || env.VITE_OPENAI_API_KEY),
  has_tavily: Boolean(tavKey),
  has_tinyfish: Boolean(tfKey),
  has_supabase: Boolean(env.VITE_SUPABASE_URL || env.SUPABASE_URL),
  has_venice: Boolean(env.VENICE_API_KEY),
  has_google: Boolean(env.GOOGLE_API_KEY || env.GOOGLE_GENERATIVE_AI_API_KEY),
  key_names: Object.keys(env)
    .filter((k) => /KEY|SECRET|TOKEN|URL/i.test(k))
    .sort(),
};
console.log("ENV_PROBE", JSON.stringify(probe));

const slug = topic.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 48);

const tav = await post(
  "https://api.tavily.com/search",
  {},
  {
    api_key: tavKey,
    query: topic,
    search_depth: "advanced",
    include_answer: true,
    max_results: 5,
  },
);
fs.writeFileSync(path.join("memory", `_raw_tavily_${slug}.json`), tav.body);
console.log("TAVILY", tav.status);
try {
  const j = JSON.parse(tav.body);
  console.log("ANSWER", (j.answer || "").slice(0, 600));
} catch {
  console.log("TAVILY_BODY_PREFIX", tav.body.slice(0, 200));
}

const tf = await post(
  "https://agent.tinyfish.ai/v1/automation/run-sse",
  { "X-API-Key": tfKey, Accept: "text/event-stream" },
  {
    url: "https://docs.langchain.com/oss/python/langgraph/overview",
    goal: "Extract how to build a StateGraph with tools and human-in-the-loop in Python LangGraph. Quote import paths and interrupt/approval APIs if present. Summarize current recommended stack.",
  },
);
fs.writeFileSync(path.join("memory", `_raw_tinyfish_${slug}.sse`), tf.body);
console.log(
  "TINYFISH",
  tf.status,
  tf.body.includes('"type":"COMPLETE"') ? "COMPLETE" : "PARTIAL",
  "len",
  tf.body.length,
);
